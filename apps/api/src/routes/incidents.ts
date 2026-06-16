import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";

const router = Router();

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

// PATCH resolve incident
router.patch("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        resolvedAt: new Date(),
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    sendSuccess(res, { message: "Incident resolved", incident });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST deploy volunteers to incident
router.post("/:id/deploy-volunteers", async (req: Request, res: Response) => {
  try {
    const { volunteerIds } = req.body;

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      sendError(res, "volunteerIds must be a non-empty array", 400);
      return;
    }

    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        volunteersDeployed: {
          connect: volunteerIds.map((id: number) => ({ id })),
        },
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });

    sendSuccess(res, { message: "Volunteers deployed to incident", incident });
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

export default router;
