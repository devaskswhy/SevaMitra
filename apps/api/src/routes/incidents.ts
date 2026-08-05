import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";
import { getSocketServer } from "../lib/socket";

const router = Router();

const deploymentDurationsBySeverity: Record<number, [number, number]> = {
  5: [15, 30],
  4: [30, 60],
  3: [60, 120],
  2: [120, 240],
  1: [240, 480],
};

const getIncidentSkillNeeds = (severity: number): string[] => {
  if (severity >= 5) return ["first_aid", "medical"];
  if (severity >= 4) return ["crowd_management"];
  return ["general"];
};

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// GET all incidents
router.get("/", async (_req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        zone: true,
        volunteersDeployed: true,
      },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, incidents);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET resolved/deployed incidents with expected resolution timestamps
router.get("/resolved", async (_req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        resolvedAt: { not: null },
        status: { in: ["DEPLOYED", "RESOLVED"] },
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
      orderBy: { resolvedAt: "desc" },
    });
    sendSuccess(res, incidents);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET unresolved incidents
router.get("/status/unresolved", async (_req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: { resolvedAt: null },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
      orderBy: { severity: "desc" },
    });
    sendSuccess(res, incidents);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET incidents by severity level
router.get("/severity/:level", async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: { severity: parseInt(req.params.level as string) },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    sendSuccess(res, incidents);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET incidents by zone
router.get("/zone/:zoneId", async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: { zoneId: parseInt(req.params.zoneId as string) },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    sendSuccess(res, incidents);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET incident by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    if (!incident) {
      sendError(res, "Incident not found", 404);
      return;
    }
    sendSuccess(res, incident);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST create new incident
router.post("/", async (req: Request, res: Response) => {
  try {
    const { zoneId, reportedBy, severity, type, description, volunteerIds } = req.body;

    const incident = await prisma.incident.create({
      data: {
        zoneId,
        reportedBy,
        severity,
        type,
        description,
        volunteersDeployed: volunteerIds
          ? {
              connect: volunteerIds.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });

    sendSuccess(res, incident, 201);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PUT update incident
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { volunteersDeployed, ...otherData } = req.body;

    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        ...otherData,
        volunteersDeployed: volunteersDeployed
          ? {
              set: volunteersDeployed.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });

    sendSuccess(res, incident);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// DELETE incident
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.incident.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    sendSuccess(res, { message: "Incident deleted successfully" });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST deploy volunteer to incident
router.post("/:id/deploy", async (req: Request, res: Response) => {
  try {
    const incidentId = parseInt(req.params.id as string);
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { zone: true, volunteersDeployed: true },
    });

    if (!incident) {
      sendError(res, "Incident not found", 404);
      return;
    }

    const activeVolunteers = await prisma.volunteer.findMany({
      where: { status: "ACTIVE" },
    });

    if (!activeVolunteers.length) {
      sendError(res, "No active volunteers available", 409);
      return;
    }

    const requiredSkills = getIncidentSkillNeeds(incident.severity);
    const skilledVolunteers = activeVolunteers.filter((volunteer: (typeof activeVolunteers)[number]) => {
      const volunteerSkills = volunteer.skills.toLowerCase();
      return requiredSkills.some((skill) => volunteerSkills.includes(skill));
    });
    const volunteerPool = skilledVolunteers.length ? skilledVolunteers : activeVolunteers;

    const volunteerWithAssignmentCounts = await Promise.all(
      volunteerPool.map(async (volunteer: (typeof volunteerPool)[number]) => {
        const currentAssignments = await prisma.assignment.count({
          where: { volunteerId: volunteer.id, checkOutTime: null },
        });
        return { volunteer, currentAssignments };
      })
    );

    volunteerWithAssignmentCounts.sort((a, b) => {
      if (b.volunteer.reliabilityScore !== a.volunteer.reliabilityScore) {
        return b.volunteer.reliabilityScore - a.volunteer.reliabilityScore;
      }
      if (a.currentAssignments !== b.currentAssignments) {
        return a.currentAssignments - b.currentAssignments;
      }
      return a.volunteer.id - b.volunteer.id;
    });

    const assigned = volunteerWithAssignmentCounts[0];
    const [minMinutes, maxMinutes] = deploymentDurationsBySeverity[incident.severity] ?? [240, 480];
    const estimatedMinutes = randomInt(minMinutes, maxMinutes);
    const estimatedResolvedAt = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    let task = await prisma.task.findFirst({
      where: { zoneId: incident.zoneId },
      orderBy: [{ difficulty: "desc" }, { id: "asc" }],
    });

    if (!task) {
      task = await prisma.task.create({
        data: {
          title: `Incident Response: ${incident.type}`,
          zoneId: incident.zoneId,
          skillsRequired: requiredSkills.join(","),
          estimatedDuration: Math.max(1, Math.round(estimatedMinutes / 60)),
          difficulty: Math.min(5, Math.max(1, incident.severity)),
          minVolunteers: 1,
          maxVolunteers: 3,
        },
      });
    }

    const now = new Date();
    let shift =
      (await prisma.shift.findFirst({
        where: { startTime: { lte: now }, endTime: { gte: now } },
        orderBy: { startTime: "asc" },
      })) ??
      (await prisma.shift.findFirst({
        where: { startTime: { gte: now } },
        orderBy: { startTime: "asc" },
      }));

    if (!shift) {
      shift = await prisma.shift.create({
        data: {
          startTime: now,
          endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        },
      });
    }

    await prisma.assignment.create({
      data: {
        volunteerId: assigned.volunteer.id,
        taskId: task.id,
        shiftId: shift.id,
      },
    });

    const updatedIncident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: "DEPLOYED",
        resolvedAt: estimatedResolvedAt,
        volunteersDeployed: {
          connect: { id: assigned.volunteer.id },
        },
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });

    getSocketServer()?.emit("incident:deployed", updatedIncident);

    sendSuccess(res, {
      assignedVolunteer: {
        name: assigned.volunteer.name,
        phone: assigned.volunteer.phone,
        skills: assigned.volunteer.skills,
      },
      estimatedResolution: `${estimatedMinutes} minutes`,
      incident: updatedIncident,
    });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST deploy specific volunteers to an incident — used by the dashboard's
// Quick Volunteer Allocation panel, which already scores and picks its own
// candidates client-side via POST /api/allocation/recommendations and just
// needs them assigned, unlike /:id/deploy above which picks one volunteer
// itself server-side.
router.post("/:id/deploy-volunteers", async (req: Request, res: Response) => {
  try {
    const incidentId = parseInt(req.params.id as string);
    const { volunteerIds } = req.body as { volunteerIds?: number[] };

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      sendError(res, "volunteerIds (non-empty array) is required", 400);
      return;
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { zone: true, volunteersDeployed: true },
    });

    if (!incident) {
      sendError(res, "Incident not found", 404);
      return;
    }

    const volunteers = await prisma.volunteer.findMany({
      where: { id: { in: volunteerIds } },
    });

    if (!volunteers.length) {
      sendError(res, "None of the given volunteerIds exist", 404);
      return;
    }

    const requiredSkills = getIncidentSkillNeeds(incident.severity);
    const [minMinutes, maxMinutes] = deploymentDurationsBySeverity[incident.severity] ?? [240, 480];
    const estimatedMinutes = randomInt(minMinutes, maxMinutes);
    const estimatedResolvedAt = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    let task = await prisma.task.findFirst({
      where: { zoneId: incident.zoneId },
      orderBy: [{ difficulty: "desc" }, { id: "asc" }],
    });

    if (!task) {
      task = await prisma.task.create({
        data: {
          title: `Incident Response: ${incident.type}`,
          zoneId: incident.zoneId,
          skillsRequired: requiredSkills.join(","),
          estimatedDuration: Math.max(1, Math.round(estimatedMinutes / 60)),
          difficulty: Math.min(5, Math.max(1, incident.severity)),
          minVolunteers: 1,
          maxVolunteers: Math.max(3, volunteers.length),
        },
      });
    }

    const now = new Date();
    let shift =
      (await prisma.shift.findFirst({
        where: { startTime: { lte: now }, endTime: { gte: now } },
        orderBy: { startTime: "asc" },
      })) ??
      (await prisma.shift.findFirst({
        where: { startTime: { gte: now } },
        orderBy: { startTime: "asc" },
      }));

    if (!shift) {
      shift = await prisma.shift.create({
        data: {
          startTime: now,
          endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        },
      });
    }

    for (const volunteer of volunteers) {
      try {
        await prisma.assignment.create({
          data: { volunteerId: volunteer.id, taskId: task.id, shiftId: shift.id },
        });
      } catch (error: any) {
        if (error.code !== "P2002") throw error; // ignore duplicate assignment, still deploy
      }
    }

    const updatedIncident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: "DEPLOYED",
        resolvedAt: estimatedResolvedAt,
        volunteersDeployed: {
          connect: volunteers.map((v) => ({ id: v.id })),
        },
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });

    getSocketServer()?.emit("incident:deployed", updatedIncident);

    sendSuccess(res, {
      assignedVolunteers: volunteers.map((v) => ({ name: v.name, phone: v.phone, skills: v.skills })),
      estimatedResolution: `${estimatedMinutes} minutes`,
      incident: updatedIncident,
    });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST resolve incident
router.post("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    getSocketServer()?.emit("incident:resolved", incident);
    sendSuccess(res, { message: "Incident resolved", incident });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

export default router;
