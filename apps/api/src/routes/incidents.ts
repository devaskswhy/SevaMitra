import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET all incidents
router.get("/", async (_req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// GET incident by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch incident" });
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

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ error: "Failed to create incident" });
  }
});

// PUT update incident
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { volunteersDeployed, ...otherData } = req.body;

    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
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

    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: "Failed to update incident" });
  }
});

// DELETE incident
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.incident.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Incident deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete incident" });
  }
});

// PATCH resolve incident
router.patch("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
      data: {
        resolvedAt: new Date(),
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    res.json({
      message: "Incident resolved",
      incident,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

// POST deploy volunteers to incident
router.post("/:id/deploy-volunteers", async (req: Request, res: Response) => {
  try {
    const { volunteerIds } = req.body;

    const incident = await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
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

    res.json({
      message: "Volunteers deployed to incident",
      incident,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to deploy volunteers" });
  }
});

// GET incidents by severity level
router.get("/severity/:level", async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: { severity: parseInt(req.params.level) },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch incidents by severity" });
  }
});

// GET incidents by zone
router.get("/zone/:zoneId", async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: { zoneId: parseInt(req.params.zoneId) },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch incidents for zone" });
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
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unresolved incidents" });
  }
});

export default router;
