import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";

const router = Router();

// GET all tasks
router.get("/", async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        zone: true,
        assignments: {
          include: {
            volunteer: true,
            shift: true,
          },
        },
      },
    });
    sendSuccess(res, tasks);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET task by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        zone: true,
        assignments: {
          include: {
            volunteer: true,
            shift: true,
          },
        },
      },
    });
    if (!task) {
      sendError(res, "Task not found", 404);
      return;
    }
    sendSuccess(res, task);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST create new task
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      skillsRequired,
      zoneId,
      estimatedDuration,
      difficulty,
      minVolunteers,
      maxVolunteers,
    } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        skillsRequired: skillsRequired || "",
        zoneId,
        estimatedDuration,
        difficulty,
        minVolunteers,
        maxVolunteers,
      },
      include: {
        zone: true,
      },
    });
    sendSuccess(res, task, 201);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PUT update task
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id as string) },
      data: req.body,
      include: {
        zone: true,
      },
    });
    sendSuccess(res, task);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// DELETE task
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.task.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    sendSuccess(res, { message: "Task deleted successfully" });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET tasks by zone
router.get("/zone/:zoneId", async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { zoneId: parseInt(req.params.zoneId as string) },
      include: {
        zone: true,
        assignments: {
          include: {
            volunteer: true,
          },
        },
      },
    });
    sendSuccess(res, tasks);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET tasks by difficulty level
router.get("/difficulty/:level", async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { difficulty: parseInt(req.params.level as string) },
      include: {
        zone: true,
      },
    });
    sendSuccess(res, tasks);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PATCH update task volunteer count
router.patch(
  "/:id/volunteer-count",
  async (req: Request, res: Response) => {
    try {
      const { minVolunteers, maxVolunteers } = req.body;
      const task = await prisma.task.update({
        where: { id: parseInt(req.params.id as string) },
        data: { minVolunteers, maxVolunteers },
      });
      sendSuccess(res, task);
    } catch (error) {
      sendPrismaError(res, error);
    }
  }
);

export default router;
