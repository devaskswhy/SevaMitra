import { prisma } from "../lib/prisma";

interface VolunteerScore {
  volunteerId: number;
  score: number;
  skills_match: number;
  reliability_score: number;
  availability: number;
  location_proximity: number;
  workload_balance: number;
}

interface AllocationResult {
  taskId: number;
  assignments: VolunteerScore[];
  totalScore: number;
}

/**
 * Weighted scoring algorithm for smart volunteer-task matching
 * Factors considered:
 * - Skills match (30%)
 * - Reliability score (25%)
 * - Availability (20%)
 * - Location proximity (15%)
 * - Workload balance (10%)
 */
export class AllocationEngine {
  private weights = {
    skillsMatch: 0.3,
    reliability: 0.25,
    availability: 0.2,
    proximity: 0.15,
    workload: 0.1,
  };

  /**
   * Calculate skills match score (0-100)
   */
  private calculateSkillsMatch(volunteerSkills: string, requiredSkills: string): number {
    if (!requiredSkills) return 100; // No specific skills required

    const required = requiredSkills.toLowerCase().split(",").map((s) => s.trim());
    const available = volunteerSkills.toLowerCase().split(",").map((s) => s.trim());

    const matchCount = required.filter((skill) => available.includes(skill)).length;
    return (matchCount / required.length) * 100;
  }

  /**
   * Calculate reliability score (0-100)
   * Based on completed shifts and volunteer's existing reliability score
   */
  private calculateReliabilityScore(
    reliabilityScore: number,
    completedShifts: number
  ): number {
    // Base reliability score with a boost for completed shifts
    const shiftBoost = Math.min(completedShifts * 5, 30); // Max 30 point boost
    return Math.min(reliabilityScore + shiftBoost, 100);
  }

  /**
   * Calculate availability score (0-100)
   * Checks if volunteer has conflicting assignments
   */
  private async calculateAvailabilityScore(
    volunteerId: number,
    shiftStart: Date,
    shiftEnd: Date
  ): Promise<number> {
    const conflictingAssignments = await prisma.assignment.findMany({
      where: {
        volunteerId,
        shift: {
          AND: [
            { startTime: { lt: shiftEnd } },
            { endTime: { gt: shiftStart } },
          ],
        },
        checkOutTime: null, // Not yet completed
      },
    });

    // 100 if fully available, 50 if has one conflict, 0 if multiple conflicts
    if (conflictingAssignments.length === 0) return 100;
    if (conflictingAssignments.length === 1) return 50;
    return 0;
  }

  /**
   * Calculate location proximity score (0-100)
   * Simple distance-based scoring (could be enhanced with actual geolocation)
   */
  private calculateProximityScore(homeState: string, zoneLocation: string): number {
    if (!zoneLocation) return 50; // Neutral if no location data

    // Simple state matching (could be enhanced with actual GPS coordinates)
    const homeStateNorm = homeState.toLowerCase().trim();
    const zoneNorm = zoneLocation.toLowerCase().trim();

    if (homeStateNorm === zoneNorm) return 100; // Same state
    if (homeStateNorm.includes("state") && zoneNorm.includes("state")) {
      return 75; // Adjacent states (simplified)
    }
    return 50; // Different regions
  }

  /**
   * Calculate workload balance score (0-100)
   * Prefers volunteers with fewer active assignments
   */
  private async calculateWorkloadScore(volunteerId: number): Promise<number> {
    const activeAssignments = await prisma.assignment.count({
      where: {
        volunteerId,
        checkOutTime: null, // Still active
      },
    });

    // 100 if no active assignments, decreases with more assignments
    // Assuming max 5 concurrent assignments as reasonable limit
    const maxConcurrent = 5;
    const score = Math.max(0, 100 - (activeAssignments / maxConcurrent) * 100);
    return Math.min(score, 100);
  }

  /**
   * Score a single volunteer for a task
   */
  private async scoreVolunteer(
    volunteer: any,
    task: any,
    shift: any
  ): Promise<VolunteerScore> {
    const skillsScore = this.calculateSkillsMatch(volunteer.skills, task.skillsRequired);
    const reliabilityScore = this.calculateReliabilityScore(
      volunteer.reliabilityScore,
      volunteer.completedShifts
    );
    const availabilityScore = await this.calculateAvailabilityScore(
      volunteer.id,
      shift.startTime,
      shift.endTime
    );
    const proximityScore = this.calculateProximityScore(
      volunteer.homeState,
      task.zone.coordinates || ""
    );
    const workloadScore = await this.calculateWorkloadScore(volunteer.id);

    const totalScore =
      skillsScore * this.weights.skillsMatch +
      reliabilityScore * this.weights.reliability +
      availabilityScore * this.weights.availability +
      proximityScore * this.weights.proximity +
      workloadScore * this.weights.workload;

    return {
      volunteerId: volunteer.id,
      score: totalScore,
      skills_match: skillsScore,
      reliability_score: reliabilityScore,
      availability: availabilityScore,
      location_proximity: proximityScore,
      workload_balance: workloadScore,
    };
  }

  /**
   * Get top volunteers for a task (sorted by score)
   */
  async getTopVolunteersForTask(
    taskId: number,
    shiftId: number,
    limit: number = 5
  ): Promise<AllocationResult> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { zone: true },
      });

      const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
      });

      if (!task || !shift) {
        throw new Error("Task or Shift not found");
      }

      // Get all active volunteers
      const volunteers = await prisma.volunteer.findMany({
        where: { status: "ACTIVE" },
      });

      // Score each volunteer
      const scores = await Promise.all(
        volunteers.map((vol: any) => this.scoreVolunteer(vol, task, shift))
      );

      // Sort by score descending and take top N
      const topVolunteers = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .filter((s) => s.score > 0); // Only include viable candidates

      const totalScore = topVolunteers.reduce((sum, s) => sum + s.score, 0);

      return {
        taskId,
        assignments: topVolunteers,
        totalScore,
      };
    } catch (error) {
      console.error("Error in allocation engine:", error);
      throw error;
    }
  }

  /**
   * Auto-allocate volunteers to a task
   */
  async autoAllocateTask(
    taskId: number,
    shiftId: number
  ): Promise<{ created: number; failed: number }> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const allocation = await this.getTopVolunteersForTask(
        taskId,
        shiftId,
        task.maxVolunteers
      );

      let created = 0;
      let failed = 0;

      // Create assignments for top volunteers
      for (const score of allocation.assignments.slice(0, task.minVolunteers)) {
        try {
          await prisma.assignment.create({
            data: {
              volunteerId: score.volunteerId,
              taskId,
              shiftId,
            },
          });
          created++;
        } catch (error: any) {
          if (error.code !== "P2002") {
            // Ignore duplicate assignments
            console.error("Failed to create assignment:", error);
            failed++;
          }
        }
      }

      return { created, failed };
    } catch (error) {
      console.error("Error in auto-allocation:", error);
      throw error;
    }
  }

  /**
   * Get allocation recommendations for multiple tasks
   */
  async getMultiTaskAllocations(
    taskIds: number[],
    shiftId: number
  ): Promise<AllocationResult[]> {
    return Promise.all(
      taskIds.map((taskId) => this.getTopVolunteersForTask(taskId, shiftId))
    );
  }
}

export default new AllocationEngine();
