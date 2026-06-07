import { Router, Request, Response } from "express";
import AllocationEngine from "../services/allocationEngine";

const router = Router();

// POST get top volunteers for a task
router.post("/recommendations", async (req: Request, res: Response) => {
  try {
    const { taskId, shiftId, limit } = req.body;

    if (!taskId || !shiftId) {
      res.status(400).json({ error: "taskId and shiftId are required" });
      return;
    }

    const recommendations = await AllocationEngine.getTopVolunteersForTask(
      taskId,
      shiftId,
      limit || 5
    );

    res.json({
      taskId,
      shiftId,
      recommendations: recommendations.assignments,
      totalScore: recommendations.totalScore,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to generate recommendations",
      message: error.message,
    });
  }
});

// POST auto-allocate volunteers to a task
router.post("/auto-allocate/:taskId/:shiftId", async (req: Request, res: Response) => {
  try {
    const { taskId, shiftId } = req.params;

    if (!taskId || !shiftId) {
      res.status(400).json({ error: "taskId and shiftId are required" });
      return;
    }

    const result = await AllocationEngine.autoAllocateTask(
      parseInt(taskId as string),
      parseInt(shiftId as string)
    );

    res.json({
      taskId: parseInt(taskId as string),
      shiftId: parseInt(shiftId as string),
      created: result.created,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to auto-allocate",
      message: error.message,
    });
  }
});

// POST get allocations for multiple tasks
router.post("/batch-recommendations", async (req: Request, res: Response) => {
  try {
    const { taskIds, shiftId } = req.body;

    if (!Array.isArray(taskIds) || !shiftId) {
      res.status(400).json({ error: "taskIds (array) and shiftId are required" });
      return;
    }

    const recommendations = await AllocationEngine.getMultiTaskAllocations(
      taskIds,
      shiftId
    );

    res.json({
      shiftId,
      tasks: recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to generate batch recommendations",
      message: error.message,
    });
  }
});

// GET allocation stats/insights
router.get("/stats/overview", async (_req: Request, res: Response) => {
  try {
    res.json({
      status: "Allocation engine active",
      weights: {
        skillsMatch: 0.3,
        reliability: 0.25,
        availability: 0.2,
        proximity: 0.15,
        workload: 0.1,
      },
      algorithm: "Weighted scoring with multi-factor analysis",
      factors: [
        "Skill match",
        "Reliability score",
        "Availability",
        "Location proximity",
        "Workload balance",
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch allocation stats" });
  }
});

export default router;
