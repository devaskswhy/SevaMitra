import { Router, Request, Response } from "express";
import AllocationEngine from "../services/allocationEngine";
import { sendSuccess, sendError } from "../lib/apiResponse";

const router = Router();

// POST get top volunteers for a task
router.post("/recommendations", async (req: Request, res: Response) => {
  try {
    const { taskId, shiftId, limit } = req.body;

    if (!taskId || !shiftId) {
      sendError(res, "taskId and shiftId are required", 400);
      return;
    }

    const recommendations = await AllocationEngine.getTopVolunteersForTask(
      taskId,
      shiftId,
      limit || 5
    );

    sendSuccess(res, {
      taskId,
      shiftId,
      recommendations: recommendations.assignments,
      totalScore: recommendations.totalScore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, "Failed to generate recommendations", 500, message);
  }
});

// POST auto-allocate volunteers to a task
router.post("/auto-allocate/:taskId/:shiftId", async (req: Request, res: Response) => {
  try {
    const { taskId, shiftId } = req.params;

    if (!taskId || !shiftId) {
      sendError(res, "taskId and shiftId are required", 400);
      return;
    }

    const result = await AllocationEngine.autoAllocateTask(
      parseInt(taskId as string),
      parseInt(shiftId as string)
    );

    sendSuccess(res, {
      taskId: parseInt(taskId as string),
      shiftId: parseInt(shiftId as string),
      created: result.created,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, "Failed to auto-allocate", 500, message);
  }
});

// POST get allocations for multiple tasks
router.post("/batch-recommendations", async (req: Request, res: Response) => {
  try {
    const { taskIds, shiftId } = req.body;

    if (!Array.isArray(taskIds) || !shiftId) {
      sendError(res, "taskIds (array) and shiftId are required", 400);
      return;
    }

    const recommendations = await AllocationEngine.getMultiTaskAllocations(
      taskIds,
      shiftId
    );

    sendSuccess(res, {
      shiftId,
      tasks: recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendError(res, "Failed to generate batch recommendations", 500, message);
  }
});

// GET allocation stats/insights
router.get("/stats/overview", async (_req: Request, res: Response) => {
  try {
    sendSuccess(res, {
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
    sendError(res, "Failed to fetch allocation stats", 500);
  }
});

export default router;
