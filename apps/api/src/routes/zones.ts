import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";

const router = Router();

// GET all zones
router.get("/", async (_req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        tasks: true,
        incidents: true,
      },
    });
    sendSuccess(res, zones);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET zone by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: parseInt(req.params.id as string) },
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
      sendError(res, "Zone not found", 404);
      return;
    }
    sendSuccess(res, zone);
  } catch (error) {
    sendPrismaError(res, error);
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
    sendSuccess(res, zone, 201);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PUT update zone
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const zone = await prisma.zone.update({
      where: { id: parseInt(req.params.id as string) },
      data: req.body,
    });
    sendSuccess(res, zone);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// DELETE zone
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.zone.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    sendSuccess(res, { message: "Zone deleted successfully" });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PATCH update zone load
router.patch("/:id/load", async (req: Request, res: Response) => {
  try {
    const { currentLoad } = req.body;
    const zone = await prisma.zone.update({
      where: { id: parseInt(req.params.id as string) },
      data: { currentLoad },
    });
    sendSuccess(res, zone);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET zones by type
router.get("/type/:type", async (req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { type: req.params.type as string },
    });
    sendSuccess(res, zones);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET zones by priority
router.get("/priority/:priority", async (req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { priority: req.params.priority as string },
    });
    sendSuccess(res, zones);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

export default router;
