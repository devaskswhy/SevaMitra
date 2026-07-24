import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";

const router = Router();

// GET all shifts
router.get("/", async (_req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { startTime: "asc" },
    });
    sendSuccess(res, shifts);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET upcoming shifts (startTime in the future, ascending)
router.get("/upcoming", async (_req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { startTime: { gt: new Date() } },
      orderBy: { startTime: "asc" },
    });
    sendSuccess(res, shifts);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET shift by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        assignments: {
          include: {
            volunteer: true,
            task: true,
          },
        },
      },
    });
    if (!shift) {
      sendError(res, "Shift not found", 404);
      return;
    }
    sendSuccess(res, shift);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST create new shift
router.post("/", async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;

    const shift = await prisma.shift.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    sendSuccess(res, shift, 201);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PUT update shift
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    const shift = await prisma.shift.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        ...(startTime ? { startTime: new Date(startTime) } : {}),
        ...(endTime ? { endTime: new Date(endTime) } : {}),
      },
    });
    sendSuccess(res, shift);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// DELETE shift
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.shift.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    sendSuccess(res, { message: "Shift deleted successfully" });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

export default router;
