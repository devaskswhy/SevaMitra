import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET all zones
router.get("/", async (_req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        tasks: true,
        incidents: true,
      },
    });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

// GET zone by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        tasks: {
          include: {
            assignments: true,
          },
        },
        incidents: true,
      },
    });
    if (!zone) {
      res.status(404).json({ error: "Zone not found" });
      return;
    }
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// POST create new zone
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, coordinates, maxCapacity, priority } = req.body;

    const zone = await prisma.zone.create({
      data: {
        name,
        type,
        coordinates: coordinates || "",
        maxCapacity,
        priority: priority || "LOW",
      },
    });
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ error: "Failed to create zone" });
  }
});

// PUT update zone
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const zone = await prisma.zone.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: "Failed to update zone" });
  }
});

// DELETE zone
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.zone.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Zone deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete zone" });
  }
});

// PATCH update zone load
router.patch("/:id/load", async (req: Request, res: Response) => {
  try {
    const { currentLoad } = req.body;
    const zone = await prisma.zone.update({
      where: { id: parseInt(req.params.id) },
      data: { currentLoad },
    });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: "Failed to update zone load" });
  }
});

// GET zones by type
router.get("/type/:type", async (req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { type: req.params.type },
    });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zones by type" });
  }
});

// GET zones by priority
router.get("/priority/:priority", async (req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { priority: req.params.priority },
    });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch zones by priority" });
  }
});

export default router;
