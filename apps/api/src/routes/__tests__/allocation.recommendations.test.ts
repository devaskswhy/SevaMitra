import request from "supertest";
import app from "../../app";
import { prisma } from "../../lib/prisma";

const runId = Date.now();

describe("POST /api/allocation/recommendations", () => {
  let zoneId: number;
  let taskId: number;
  let shiftId: number;
  let strongVolunteerId: number;
  let weakVolunteerId: number;

  beforeAll(async () => {
    const zone = await prisma.zone.create({
      data: { name: `Alloc Test Zone ${runId}`, type: "CAMP", maxCapacity: 100 },
    });
    zoneId = zone.id;

    const task = await prisma.task.create({
      data: {
        title: "Integration test task",
        skillsRequired: "first_aid,medical",
        zoneId,
        estimatedDuration: 2,
        difficulty: 3,
        minVolunteers: 1,
        maxVolunteers: 3,
      },
    });
    taskId = task.id;

    const shift = await prisma.shift.create({
      data: {
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    });
    shiftId = shift.id;

    // Matches every required skill, high reliability — should outscore weak.
    const strong = await prisma.volunteer.create({
      data: {
        name: "Strong Candidate",
        phone: `+91${runId}2`,
        email: `alloc-strong-${runId}@example.com`,
        aadhaarHash: "test-hash",
        age: 28,
        gender: "OTHER",
        skills: "first_aid,medical,general",
        homeState: "Uttar Pradesh",
        status: "ACTIVE",
        reliabilityScore: 90,
        completedShifts: 10,
      },
    });
    strongVolunteerId = strong.id;

    // Matches no required skill, low reliability — should score lower.
    const weak = await prisma.volunteer.create({
      data: {
        name: "Weak Candidate",
        phone: `+91${runId}3`,
        email: `alloc-weak-${runId}@example.com`,
        aadhaarHash: "test-hash",
        age: 40,
        gender: "OTHER",
        skills: "technical",
        homeState: "Bihar",
        status: "ACTIVE",
        reliabilityScore: 10,
        completedShifts: 0,
      },
    });
    weakVolunteerId = weak.id;
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({ where: { taskId } });
    await prisma.volunteer.delete({ where: { id: strongVolunteerId } });
    await prisma.volunteer.delete({ where: { id: weakVolunteerId } });
    await prisma.task.delete({ where: { id: taskId } });
    await prisma.shift.delete({ where: { id: shiftId } });
    await prisma.zone.delete({ where: { id: zoneId } });
    await prisma.$disconnect();
  });

  it("returns 400 when taskId or shiftId is missing", async () => {
    const res = await request(app).post("/api/allocation/recommendations").send({ shiftId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns volunteers ranked with the best skills/reliability match first", async () => {
    // A large limit so both fixtures are guaranteed to appear in the
    // results regardless of how many other (e.g. demo-seeded) active
    // volunteers are also competing for this task.
    const res = await request(app)
      .post("/api/allocation/recommendations")
      .send({ taskId, shiftId, limit: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { recommendations } = res.body.data;
    expect(Array.isArray(recommendations)).toBe(true);

    const strongEntry = recommendations.find((r: any) => r.volunteerId === strongVolunteerId);
    const weakEntry = recommendations.find((r: any) => r.volunteerId === weakVolunteerId);
    expect(strongEntry).toBeDefined();
    expect(weakEntry).toBeDefined();
    expect(strongEntry.score).toBeGreaterThan(weakEntry.score);

    // The endpoint's own contract: sorted descending by score.
    const scores = recommendations.map((r: any) => r.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("respects the limit parameter", async () => {
    const res = await request(app)
      .post("/api/allocation/recommendations")
      .send({ taskId, shiftId, limit: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.recommendations.length).toBeLessThanOrEqual(1);
  });
});
