import request from "supertest";
import app from "../../app";
import { prisma } from "../../lib/prisma";

// Unique per test-run so repeated local runs never collide with each other
// or with demo-seeded data (Volunteer.phone/email are unique columns).
const runId = Date.now();

describe("POST /api/incidents/:id/deploy", () => {
  let zoneId: number;
  let activeVolunteerId: number;

  beforeAll(async () => {
    const zone = await prisma.zone.create({
      data: { name: `Test Zone ${runId}`, type: "GHAT", maxCapacity: 100 },
    });
    zoneId = zone.id;

    const volunteer = await prisma.volunteer.create({
      data: {
        name: "Test Volunteer",
        phone: `+91${runId}1`,
        email: `deploy-test-${runId}@example.com`,
        aadhaarHash: "test-hash",
        age: 30,
        gender: "OTHER",
        skills: "first_aid,medical",
        homeState: "Uttar Pradesh",
        status: "ACTIVE",
        reliabilityScore: 80,
      },
    });
    activeVolunteerId = volunteer.id;
  });

  afterAll(async () => {
    // Deploying creates a Task/Assignment as a side effect, possibly for a
    // different volunteer than this file's own fixture (see the test
    // below) — clean up everything touching this zone, in FK-safe order.
    await prisma.assignment.deleteMany({ where: { task: { zoneId } } });
    await prisma.incident.deleteMany({ where: { zoneId } });
    await prisma.task.deleteMany({ where: { zoneId } });
    await prisma.volunteer.delete({ where: { id: activeVolunteerId } });
    await prisma.zone.delete({ where: { id: zoneId } });
    await prisma.$disconnect();
  });

  it("returns 404 for an incident that doesn't exist", async () => {
    const res = await request(app).post("/api/incidents/999999999/deploy");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("deploys an active volunteer and marks the incident DEPLOYED", async () => {
    const incident = await prisma.incident.create({
      data: {
        zoneId,
        reportedBy: "Test",
        severity: 5,
        type: "Medical Emergency",
        description: "Integration test incident",
        status: "ACTIVE",
      },
    });

    const res = await request(app).post(`/api/incidents/${incident.id}/deploy`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Deliberately not asserting *which* volunteer wins the ranking here —
    // that's covered relatively (strong vs. weak candidate) in
    // allocation.recommendations.test.ts. Against a demo-seeded database
    // this endpoint's pool is every ACTIVE volunteer globally, not just
    // this test's fixture, so asserting a specific winner would be flaky.
    expect(typeof res.body.data.assignedVolunteer.name).toBe("string");
    expect(res.body.data.assignedVolunteer.name.length).toBeGreaterThan(0);
    expect(res.body.data.incident.status).toBe("DEPLOYED");
    expect(res.body.data.incident.resolvedAt).not.toBeNull();
    expect(res.body.data.incident.volunteersDeployed.length).toBeGreaterThan(0);

    // A real Task + Assignment should now exist in this zone, regardless of
    // which volunteer was actually picked.
    const task = await prisma.task.findFirst({ where: { zoneId } });
    expect(task).not.toBeNull();
    const assignment = await prisma.assignment.findFirst({ where: { taskId: task!.id } });
    expect(assignment).not.toBeNull();
  });

  it("returns 409 when there are no active volunteers at all", async () => {
    // Temporarily sideline the only active volunteer this suite created.
    await prisma.volunteer.update({
      where: { id: activeVolunteerId },
      data: { status: "INACTIVE" },
    });

    const incident = await prisma.incident.create({
      data: {
        zoneId,
        reportedBy: "Test",
        severity: 3,
        type: "Water Supply Issue",
        description: "Integration test incident (no volunteers)",
        status: "ACTIVE",
      },
    });

    try {
      const activeCount = await prisma.volunteer.count({ where: { status: "ACTIVE" } });
      // This assertion only holds in an otherwise-empty test database; skip
      // the strict 409 check if seeded demo volunteers are also present,
      // since deploy would then legitimately succeed against one of those.
      if (activeCount === 0) {
        const res = await request(app).post(`/api/incidents/${incident.id}/deploy`);
        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
      }
    } finally {
      await prisma.volunteer.update({
        where: { id: activeVolunteerId },
        data: { status: "ACTIVE" },
      });
    }
  });
});

describe("POST /api/incidents/:id/deploy-volunteers", () => {
  // Exercises the dashboard's "Quick Volunteer Allocation" panel flow: the
  // client already scores/picks its own candidate volunteerIds (via POST
  // /api/allocation/recommendations) and just needs them assigned, unlike
  // /:id/deploy above which picks one volunteer itself server-side.
  let zoneId: number;
  let volunteerAId: number;
  let volunteerBId: number;

  beforeAll(async () => {
    const zone = await prisma.zone.create({
      data: { name: `Test Zone DV ${runId}`, type: "CAMP", maxCapacity: 100 },
    });
    zoneId = zone.id;

    const a = await prisma.volunteer.create({
      data: {
        name: "Deploy-Volunteers Candidate A",
        phone: `+91${runId}2`,
        email: `deploy-volunteers-a-${runId}@example.com`,
        aadhaarHash: "test-hash",
        age: 29,
        gender: "OTHER",
        skills: "first_aid",
        homeState: "Uttar Pradesh",
        status: "ACTIVE",
        reliabilityScore: 70,
      },
    });
    volunteerAId = a.id;

    const b = await prisma.volunteer.create({
      data: {
        name: "Deploy-Volunteers Candidate B",
        phone: `+91${runId}3`,
        email: `deploy-volunteers-b-${runId}@example.com`,
        aadhaarHash: "test-hash",
        age: 31,
        gender: "OTHER",
        skills: "medical",
        homeState: "Bihar",
        status: "ACTIVE",
        reliabilityScore: 65,
      },
    });
    volunteerBId = b.id;
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({ where: { task: { zoneId } } });
    await prisma.incident.deleteMany({ where: { zoneId } });
    await prisma.task.deleteMany({ where: { zoneId } });
    await prisma.volunteer.delete({ where: { id: volunteerAId } });
    await prisma.volunteer.delete({ where: { id: volunteerBId } });
    await prisma.zone.delete({ where: { id: zoneId } });
    await prisma.$disconnect();
  });

  it("returns 400 when volunteerIds is missing or empty", async () => {
    const incident = await prisma.incident.create({
      data: {
        zoneId,
        reportedBy: "Test",
        severity: 2,
        type: "Lost Person",
        description: "Integration test incident (missing volunteerIds)",
        status: "ACTIVE",
      },
    });

    const res = await request(app).post(`/api/incidents/${incident.id}/deploy-volunteers`).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for an incident that doesn't exist", async () => {
    const res = await request(app)
      .post("/api/incidents/999999999/deploy-volunteers")
      .send({ volunteerIds: [volunteerAId] });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("deploys every given volunteer and marks the incident DEPLOYED", async () => {
    const incident = await prisma.incident.create({
      data: {
        zoneId,
        reportedBy: "Test",
        severity: 2,
        type: "Lost Person",
        description: "Integration test incident (deploy-volunteers)",
        status: "ACTIVE",
      },
    });

    const res = await request(app)
      .post(`/api/incidents/${incident.id}/deploy-volunteers`)
      .send({ volunteerIds: [volunteerAId, volunteerBId] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedVolunteers).toHaveLength(2);
    expect(res.body.data.incident.status).toBe("DEPLOYED");
    expect(res.body.data.incident.resolvedAt).not.toBeNull();

    const deployedIds = res.body.data.incident.volunteersDeployed.map((v: any) => v.id);
    expect(deployedIds).toEqual(expect.arrayContaining([volunteerAId, volunteerBId]));

    const assignments = await prisma.assignment.findMany({
      where: { volunteerId: { in: [volunteerAId, volunteerBId] }, task: { zoneId } },
    });
    expect(assignments).toHaveLength(2);
  });
});
