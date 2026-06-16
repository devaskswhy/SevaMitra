import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";

const router = Router();

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
    sendSuccess(res, assignments);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET assignment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(req.params.id as string) },
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
      sendError(res, "Assignment not found", 404);
      return;
    }
    sendSuccess(res, assignment);
  } catch (error) {
    sendPrismaError(res, error);
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
      sendError(res, "Volunteer already assigned to this task in this shift", 409);
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
    sendSuccess(res, assignment, 201);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PUT update assignment
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id as string) },
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
    sendSuccess(res, assignment);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// DELETE assignment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.assignment.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    sendSuccess(res, { message: "Assignment deleted successfully" });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST check-in (mark arrival time)
router.post("/:id/check-in", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        checkInTime: new Date(),
      },
      include: {
        volunteer: true,
        task: true,
        shift: true,
      },
    });
    sendSuccess(res, { message: "Checked in successfully", assignment });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST check-out (mark departure time and update performance)
router.post("/:id/check-out", async (req: Request, res: Response) => {
  try {
    const { performanceRating } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id: parseInt(req.params.id as string) },
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
      sendError(res, "Check-in and check-out times are required", 400);
      return;
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

    sendSuccess(res, { message: "Checked out successfully", assignment });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET assignments for volunteer
router.get("/volunteer/:volunteerId", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { volunteerId: parseInt(req.params.volunteerId as string) },
      include: {
        task: {
          include: {
            zone: true,
          },
        },
        shift: true,
      },
    });
    sendSuccess(res, assignments);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET assignments for task
router.get("/task/:taskId", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { taskId: parseInt(req.params.taskId as string) },
      include: {
        volunteer: true,
        shift: true,
      },
    });
    sendSuccess(res, assignments);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET assignments for shift
router.get("/shift/:shiftId", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { shiftId: parseInt(req.params.shiftId as string) },
      include: {
        volunteer: true,
        task: {
          include: {
            zone: true,
          },
        },
      },
    });
    sendSuccess(res, assignments);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

export default router;
