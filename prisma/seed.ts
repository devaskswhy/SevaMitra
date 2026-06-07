import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Indian names for volunteers
const indianNames = [
  "Rajesh Kumar",
  "Priya Sharma",
  "Amit Patel",
  "Anjali Gupta",
  "Vikram Singh",
  "Divya Reddy",
  "Arjun Verma",
  "Neha Iyer",
  "Rohan Desai",
  "Pooja Mishra",
  "Arun Nair",
  "Sneha Joshi",
  "Karthik Rao",
  "Ananya Kapoor",
  "Suresh Pandey",
  "Ritika Saxena",
  "Nikhil Bhat",
  "Shreya Agarwal",
  "Harshit Malhotra",
  "Riya Chatterjee",
  "Sanjay Yadav",
  "Meera Kulkarni",
  "Varun Chopra",
  "Sakshi Nayar",
  "Akshay Bhattacharya",
  "Isha Menon",
  "Ashok Rao",
  "Kavya Dixit",
  "Madhav Kini",
  "Anushka Srivastava",
  "Manish Thakur",
  "Deepa Mohan",
  "Rahul Saxena",
  "Naina Dubey",
  "Siddharth Verma",
  "Anjum Mirza",
  "Rishabh Nair",
  "Tulsi Rao",
  "Gaurav Sharma",
  "Priyanka Dutta",
  "Vikrant Singh",
  "Zainab Ahmed",
  "Harsh Gupta",
  "Swati Jain",
  "Nitin Kapoor",
  "Simran Bhatnagar",
  "Rohit Kumar",
  "Divyajyoti Das",
  "Anand Verma",
  "Sapna Sharma",
];

// Available skills (will be stored as comma-separated strings)
const skills = [
  "first_aid",
  "crowd_management",
  "language_hindi",
  "language_english",
  "language_bengali",
  "medical",
  "technical",
  "general",
];

// Prayagraj ghat names
const zones = [
  { name: "Triveni Sangam", type: "GHAT" },
  { name: "Ram Ghat", type: "GHAT" },
  { name: "Dashaswamedh", type: "GHAT" },
  { name: "Hanuman Ghat", type: "GHAT" },
  { name: "Yamuna Ghat", type: "GHAT" },
  { name: "Saraswati Ghat", type: "GHAT" },
  { name: "Gate 1 Camp", type: "CAMP" },
  { name: "Gate 2 Medical", type: "MEDICAL" },
  { name: "Gate 3 Traffic", type: "TRAFFIC" },
  { name: "Gate 4 Camp", type: "CAMP" },
];

// Shift times for next 7 days
function generateShifts() {
  const shifts = [];
  const today = new Date();
  const shiftTimes = [
    { hours: 6 },
    { hours: 12 },
    { hours: 20 },
  ];

  for (let day = 0; day < 7; day++) {
    for (const time of shiftTimes) {
      const shiftDate = new Date(today);
      shiftDate.setDate(shiftDate.getDate() + day);
      shiftDate.setHours(time.hours, 0, 0, 0);

      const endDate = new Date(shiftDate);
      endDate.setHours(shiftDate.getHours() + 6);

      shifts.push({
        startTime: shiftDate,
        endTime: endDate,
      });
    }
  }

  return shifts.slice(0, 10); // Return first 10 shifts
}

// Task types
const taskTypes = [
  "Crowd Management",
  "First Aid",
  "Logistics",
  "Registration",
  "Sanitation",
  "Security",
  "Communication",
  "Route Guidance",
  "Camping Setup",
  "Medical Assistance",
];

async function main() {
  try {
    console.log("🌱 Starting database seed...");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await prisma.assignment.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.zone.deleteMany({});
    await prisma.volunteer.deleteMany({});

    // Create zones
    console.log("📍 Creating zones...");
    const createdZones = [];
    for (const zone of zones) {
      const createdZone = await prisma.zone.create({
        data: {
          name: zone.name,
          type: zone.type,
          maxCapacity: 100,
          currentLoad: Math.floor(Math.random() * 50),
          priority: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)],
        },
      });
      createdZones.push(createdZone);
    }
    console.log(`✅ Created ${createdZones.length} zones`);

    // Create volunteers
    console.log("👥 Creating volunteers...");
    const createdVolunteers = [];
    for (let i = 0; i < 50; i++) {
      const volunteerSkillsArray: string[] = [];
      // Each volunteer gets 2-4 random skills
      const numSkills = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < numSkills; j++) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        if (!volunteerSkillsArray.includes(randomSkill)) {
          volunteerSkillsArray.push(randomSkill);
        }
      }

      const volunteer = await prisma.volunteer.create({
        data: {
          name: indianNames[i],
          email: `volunteer${i + 1}@mahakumbh.org`,
          phone: `+91${Math.floor(100000000 + Math.random() * 900000000)}`,
          aadhaarHash: crypto
            .createHash("sha256")
            .update(`aadhaar_${i}`)
            .digest("hex"),
          age: Math.floor(Math.random() * 40) + 18, // 18-57
          gender: Math.random() > 0.5 ? "M" : "F",
          languages: volunteerSkillsArray
            .filter((s) => s.startsWith("language_"))
            .join(","),
          skills: volunteerSkillsArray.join(","),
          homeState: "Uttar Pradesh",
          reliabilityScore: Math.floor(Math.random() * 41) + 60, // 60-100
          completedShifts: Math.floor(Math.random() * 10),
          status: Math.random() > 0.2 ? "ACTIVE" : "INACTIVE",
        },
      });
      createdVolunteers.push(volunteer);
    }
    console.log(`✅ Created ${createdVolunteers.length} volunteers`);

    // Create shifts
    console.log("⏰ Creating shifts...");
    const shiftsData = generateShifts();
    const createdShifts = [];
    for (const shift of shiftsData) {
      const createdShift = await prisma.shift.create({
        data: {
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
      });
      createdShifts.push(createdShift);
    }
    console.log(`✅ Created ${createdShifts.length} shifts`);

    // Create tasks
    console.log("📋 Creating tasks...");
    const createdTasks = [];
    for (let i = 0; i < 20; i++) {
      const zone = createdZones[Math.floor(Math.random() * createdZones.length)];
      const taskSkillsArray: string[] = [];
      const numRequiredSkills = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numRequiredSkills; j++) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        if (!taskSkillsArray.includes(randomSkill)) {
          taskSkillsArray.push(randomSkill);
        }
      }

      const task = await prisma.task.create({
        data: {
          title: `${taskTypes[Math.floor(Math.random() * taskTypes.length)]} - Task ${i + 1}`,
          skillsRequired: taskSkillsArray.join(","),
          zoneId: zone.id,
          difficulty: Math.floor(Math.random() * 5) + 1, // 1-5
          estimatedDuration: Math.floor(Math.random() * 8) + 2, // 2-9 hours
          minVolunteers: Math.floor(Math.random() * 2) + 1, // 1-2
          maxVolunteers: Math.floor(Math.random() * 5) + 3, // 3-7
        },
      });
      createdTasks.push(task);
    }
    console.log(`✅ Created ${createdTasks.length} tasks`);

    // Create assignments
    console.log("🤝 Creating assignments...");
    const createdAssignments = [];
    const assignmentCount = Math.min(30, createdVolunteers.length * 2);
    const usedCombinations = new Set<string>();

    for (let i = 0; i < assignmentCount; i++) {
      const volunteer = createdVolunteers[Math.floor(Math.random() * createdVolunteers.length)];
      const task = createdTasks[Math.floor(Math.random() * createdTasks.length)];
      const shift = createdShifts[Math.floor(Math.random() * createdShifts.length)];

      const combinationKey = `${volunteer.id}_${task.id}_${shift.id}`;
      if (usedCombinations.has(combinationKey)) {
        continue;
      }
      usedCombinations.add(combinationKey);

      try {
        const assignment = await prisma.assignment.create({
          data: {
            volunteerId: volunteer.id,
            taskId: task.id,
            shiftId: shift.id,
            checkInTime: Math.random() > 0.5 ? new Date() : null,
            checkOutTime: Math.random() > 0.8 ? new Date() : null,
            performanceRating: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : null,
          },
        });
        createdAssignments.push(assignment);
      } catch (error: any) {
        // Skip on error
        console.error(`Failed to create assignment for volunteer ${volunteer.id}:`, error.message);
      }
    }
    console.log(`✅ Created ${createdAssignments.length} assignments`);

    // Create some incidents
    console.log("⚠️ Creating incidents...");
    const incidentCount = Math.floor(Math.random() * 5) + 2; // 2-6 incidents
    for (let i = 0; i < incidentCount; i++) {
      const zone = createdZones[Math.floor(Math.random() * createdZones.length)];
      const volunteersForIncident = createdVolunteers
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);

      await prisma.incident.create({
        data: {
          zoneId: zone.id,
          reportedBy: `Coordinator_${i}`,
          severity: Math.floor(Math.random() * 5) + 1, // 1-5
          type: ["CROWD_CRUSH", "MEDICAL", "SECURITY", "INFRASTRUCTURE"][
            Math.floor(Math.random() * 4)
          ],
          description: `Emergency situation at ${zone.name}`,
          resolvedAt: Math.random() > 0.5 ? new Date() : null,
          volunteersDeployed: {
            connect: volunteersForIncident.map((v) => ({ id: v.id })),
          },
        },
      });
    }
    console.log("✅ Created incidents");

    console.log("\n✨ Database seed completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Volunteers: ${createdVolunteers.length}`);
    console.log(`   - Zones: ${createdZones.length}`);
    console.log(`   - Shifts: ${createdShifts.length}`);
    console.log(`   - Tasks: ${createdTasks.length}`);
    console.log(`   - Assignments: ${createdAssignments.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
