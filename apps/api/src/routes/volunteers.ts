import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch volunteers" });
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
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch volunteer" });
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
    res.status(201).json(volunteer);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "Email or phone already exists" });
    } else {
      res.status(500).json({ error: "Failed to create volunteer" });
    }
  }
});

// PUT update volunteer
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const volunteer = await prisma.volunteer.update({
      where: { id: parseInt(req.params.id as string) },
      data: req.body,
    });
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: "Failed to update volunteer" });
  }
});

// DELETE volunteer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await prisma.volunteer.delete({
      where: { id: parseInt(req.params.id as string) },
    });
    res.json({ message: "Volunteer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete volunteer" });
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
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ error: "Failed to search volunteers" });
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

    res.json(available);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available volunteers" });
  }
});

export default router;
