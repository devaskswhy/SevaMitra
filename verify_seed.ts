import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    const volunteerCount = await prisma.volunteer.count();
    const zoneCount = await prisma.zone.count();
    const taskCount = await prisma.task.count();
    const shiftCount = await prisma.shift.count();
    const assignmentCount = await prisma.assignment.count();
    const incidentCount = await prisma.incident.count();

    console.log("📊 Database Verification:");
    console.log(`✅ Volunteers: ${volunteerCount}`);
    console.log(`✅ Zones: ${zoneCount}`);
    console.log(`✅ Tasks: ${taskCount}`);
    console.log(`✅ Shifts: ${shiftCount}`);
    console.log(`✅ Assignments: ${assignmentCount}`);
    console.log(`✅ Incidents: ${incidentCount}`);

    // Show sample data
    console.log("\n📝 Sample Volunteers:");
    const volunteers = await prisma.volunteer.findMany({
      take: 3,
      select: {
        name: true,
        email: true,
        skills: true,
        reliabilityScore: true,
      },
    });
    volunteers.forEach((v) => console.log(`  - ${v.name} (${v.skills})`));

    console.log("\n📝 Sample Zones:");
    const zones = await prisma.zone.findMany({
      take: 3,
      select: { name: true, type: true, priority: true },
    });
    zones.forEach((z) => console.log(`  - ${z.name} (${z.type}) - Priority: ${z.priority}`));

    console.log("\n📝 Sample Tasks:");
    const tasks = await prisma.task.findMany({
      take: 3,
      select: {
        title: true,
        skillsRequired: true,
        difficulty: true,
      },
    });
    tasks.forEach((t) => console.log(`  - ${t.title} (Difficulty: ${t.difficulty})`));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
