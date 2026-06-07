import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET all assignments
router.get("/", async (_req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        volunteer: true,
        task: {
          include: {
            zone: true,
          },
        },
        shift: true,
      },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// GET assignment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        volunteer: true,
        task: {
          include: {
            zone: true,
          },
        },
        shift: true,
      },
    });
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// POST create new assignment
router.post("/", async (req: Request, res: Response) => {
  try {
    const { volunteerId, taskId, shiftId } = req.body;

    // Check for duplicate assignment
    const existing = await prisma.assignment.findUnique({
      where: {
        volunteerId_taskId_shiftId: {
          volunteerId,
          taskId,
          shiftId,
        },
      },
    });

    if (existing) {
      res.status(400).json({ error: "Volunteer already assigned to this task in this shift" });
      return;
    }

    const assignment = await prisma.assignment.create({
      data: {
        volunteerId,
        taskId,
        shiftId,
      },
      include: {
        volunteer: true,
        task: {
          include: {
            zone: true,
          },
        },
        shift: true,
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// PUT update assignment
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: {
        volunteer: true,
        task: {
          include: {
            zone: true,
          },
        },
        shift: true,
      },
    });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// DELETE assignment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.assignment.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// POST check-in (mark arrival time)
router.post("/:id/check-in", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        checkInTime: new Date(),
      },
      include: {
        volunteer: true,
        task: true,
        shift: true,
      },
    });
    res.json({
      message: "Checked in successfully",
      assignment,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check in" });
  }
});

// POST check-out (mark departure time and update performance)
router.post("/:id/check-out", async (req: Request, res: Response) => {
  try {
    const { performanceRating } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        checkOutTime: new Date(),
        performanceRating: performanceRating || undefined,
      },
      include: {
        volunteer: true,
        task: true,
        shift: true,
      },
    });

    // Update volunteer's completed shifts count
    if (!assignment.checkInTime || !assignment.checkOutTime) {
      throw new Error("Check-in and check-out times are required");
    }

    const completedShifts =
      (await prisma.assignment.count({
        where: {
          volunteerId: assignment.volunteerId,
          checkOutTime: { not: null },
        },
      })) + 1;

    await prisma.volunteer.update({
      where: { id: assignment.volunteerId },
      data: { completedShifts },
    });

    res.json({
      message: "Checked out successfully",
      assignment,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check out" });
  }
});

// GET assignments for volunteer
router.get("/volunteer/:volunteerId", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { volunteerId: parseInt(req.params.volunteerId) },
      include: {
        task: {
          include: {
            zone: true,
          },
        },
        shift: true,
      },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch volunteer assignments" });
  }
});

// GET assignments for task
router.get("/task/:taskId", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { taskId: parseInt(req.params.taskId) },
      include: {
        volunteer: true,
        shift: true,
      },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task assignments" });
  }
});

// GET assignments for shift
router.get("/shift/:shiftId", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { shiftId: parseInt(req.params.shiftId) },
      include: {
        volunteer: true,
        task: {
          include: {
            zone: true,
          },
        },
      },
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shift assignments" });
  }
});

export default router;
