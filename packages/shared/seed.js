const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create 25 zones
  const zones = await Promise.all(
    Array.from({ length: 25 }, (_, i) => {
      return prisma.zone.create({
        data: {
          name: `Zone ${i + 1}`,
          type: ['GHAT', 'CAMP', 'MEDICAL', 'TRAFFIC', 'ENTRY_EXIT', 'CROWD_CONTROL'][Math.floor(Math.random() * 6)],
          coordinates: { type: 'Point', coordinates: [Math.random() * 180 - 90, Math.random() * 360 - 180] },
          maxCapacity: Math.floor(Math.random() * 1000) + 100,
          currentLoad: Math.floor(Math.random() * 1000),
          priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        },
      });
    })
  );

  // Create 500 volunteers
  const volunteers = await Promise.all(
    Array.from({ length: 500 }, (_, i) => {
      return prisma.volunteer.create({
        data: {
          name: `Volunteer ${i + 1}`,
          phone: `+91${Math.floor(Math.random() * 10000000000)}`,
          email: `volunteer${i + 1}@example.com`,
          aadhaarHash: `hash${i + 1}`,
          age: Math.floor(Math.random() * 50) + 18,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          languages: ['Hindi', 'English', 'Marathi', 'Bengali', 'Gujarati'][Math.floor(Math.random() * 5)],
          skills: [],
          certifications: [],
          homeState: ['Maharashtra', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Karnataka'][Math.floor(Math.random() * 5)],
          registeredAt: new Date(),
          status: 'ACTIVE',
          reliabilityScore: Math.floor(Math.random() * 101),
          completedShifts: Math.floor(Math.random() * 20),
        },
      });
    })
  );

  // Create 50 tasks
  const tasks = await Promise.all(
    Array.from({ length: 50 }, (_, i) => {
      return prisma.task.create({
        data: {
          title: `Task ${i + 1}`,
          skillsRequired: [],
          zone: { connect: { id: zones[Math.floor(Math.random() * zones.length)].id } },
          estimatedDuration: Math.floor(Math.random() * 120) + 30,
          difficulty: Math.floor(Math.random() * 5) + 1,
          minVolunteers: Math.floor(Math.random() * 5) + 1,
          maxVolunteers: Math.floor(Math.random() * 10) + 5,
        },
      });
    })
  );

  // Create 200 shifts
  const shifts = await Promise.all(
    Array.from({ length: 200 }, (_, i) => {
      return prisma.shift.create({
        data: {
          startTime: new Date(Date.now() + Math.floor(Math.random() * 10000000000)),
          endTime: new Date(Date.now() + Math.floor(Math.random() * 10000000000) + 3600000), // 1 hour later
        },
      });
    })
  );

  console.log({ zones, volunteers, tasks, shifts });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });