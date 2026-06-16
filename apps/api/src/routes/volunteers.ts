import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPrismaError, sendError } from "../lib/apiResponse";

const router = Router();

// GET all volunteers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const volunteers = await prisma.volunteer.findMany({
      include: {
        assignments: {
          include: {
            task: true,
            shift: true,
          },
        },
      },
    });
    sendSuccess(res, volunteers);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET volunteer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        assignments: {
          include: {
            task: true,
            shift: true,
          },
        },
        incidents: true,
      },
    });
    if (!volunteer) {
      sendError(res, "Volunteer not found", 404);
      return;
    }
    sendSuccess(res, volunteer);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// POST create new volunteer
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      aadhaarHash,
      age,
      gender,
      languages,
      skills,
      certifications,
      homeState,
    } = req.body;

    const volunteer = await prisma.volunteer.create({
      data: {
        name,
        phone,
        email,
        aadhaarHash,
        age,
        gender,
        languages: languages || "",
        skills: skills || "",
        certifications: certifications || "",
        homeState,
      },
    });
    sendSuccess(res, volunteer, 201);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// PUT update volunteer
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const volunteer = await prisma.volunteer.update({
      where: { id: parseInt(req.params.id as string) },
      data: req.body,
    });
    sendSuccess(res, volunteer);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// DELETE volunteer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.volunteer.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    sendSuccess(res, { message: "Volunteer deleted successfully" });
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET volunteers by skill
router.get("/search/skills/:skill", async (req: Request, res: Response) => {
  try {
    const volunteers = await prisma.volunteer.findMany({
      where: {
        skills: {
          contains: req.params.skill as string,
        },
      },
    });
    sendSuccess(res, volunteers);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

// GET available volunteers (with status and no current assignments)
router.get("/available/list", async (_req: Request, res: Response) => {
  try {
    const volunteers = await prisma.volunteer.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        assignments: {
          include: {
            shift: true,
          },
        },
      },
    });

    const available = volunteers.filter((v: any) => {
      const now = new Date();
      return !v.assignments.some((a: any) => {
        const shiftStart = new Date(a.shift.startTime);
        const shiftEnd = new Date(a.shift.endTime);
        return now >= shiftStart && now <= shiftEnd;
      });
    });

    sendSuccess(res, available);
  } catch (error) {
    sendPrismaError(res, error);
  }
});

export default router;
