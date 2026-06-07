import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
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
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task" });
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
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
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
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE task
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.task.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
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
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks for zone" });
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
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks by difficulty" });
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
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update volunteer count" });
    }
  }
);

export default router;
