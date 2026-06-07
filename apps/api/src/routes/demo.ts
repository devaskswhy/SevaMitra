import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Demo reset endpoint - GET/POST /api/demo/reset
router.all('/reset', async (req: Request, res: Response) => {
  try {
    // 1. Clear all assignments and incidents
    await prisma.assignment.deleteMany({});
    await prisma.incident.deleteMany({});

    // 2. Create 1 active severity-4 incident at "Triveni Sangam" zone
    const triveniSangam = await prisma.zone.findFirst({
      where: { name: { contains: 'Triveni' } }
    });

    if (triveniSangam) {
      await prisma.incident.create({
        data: {
          zoneId: triveniSangam.id,
          reportedBy: 'Demo Coordinator',
          severity: 4,
          type: 'CROWD_CRUSH',
          description: 'Heavy crowd surge at main ghat - immediate attention required',
          resolvedAt: null,
        },
      });
    }

    // 3. Set 2 zones to 85% capacity (amber warning)
    const zones = await prisma.zone.findMany({
      where: { maxCapacity: { gt: 50 } }
    });

    if (zones.length >= 2) {
      await prisma.zone.update({
        where: { id: zones[0].id },
        data: { currentLoad: Math.floor(zones[0].maxCapacity * 0.85) }
      });
      await prisma.zone.update({
        where: { id: zones[1].id },
        data: { currentLoad: Math.floor(zones[1].maxCapacity * 0.85) }
      });
    }

    // 4. Create 3 pending assignments
    const volunteers = await prisma.volunteer.findMany({
      where: { status: 'ACTIVE' },
      take: 3
    });

    const tasks = await prisma.task.findMany({
      take: 3
    });

    const shifts = await prisma.shift.findMany({
      take: 3
    });

    if (volunteers.length >= 3 && tasks.length >= 3 && shifts.length >= 3) {
      for (let i = 0; i < 3; i++) {
        await prisma.assignment.create({
          data: {
            volunteerId: volunteers[i].id,
            taskId: tasks[i].id,
            shiftId: shifts[i].id,
            checkInTime: null,
            checkOutTime: null,
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Demo reset complete',
      data: {
        incidentsCreated: 1,
        zonesUpdated: 2,
        assignmentsCreated: 3,
      },
    });
  } catch (error) {
    console.error('Demo reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset demo data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
