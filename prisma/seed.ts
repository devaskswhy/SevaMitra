import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// ─── Data Constants ──────────────────────────────────────────

const indianNames = [
  "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Anjali Gupta", "Vikram Singh",
  "Divya Reddy", "Arjun Verma", "Neha Iyer", "Rohan Desai", "Pooja Mishra",
  "Arun Nair", "Sneha Joshi", "Karthik Rao", "Ananya Kapoor", "Suresh Pandey",
  "Ritika Saxena", "Nikhil Bhat", "Shreya Agarwal", "Harshit Malhotra", "Riya Chatterjee",
  "Sanjay Yadav", "Meera Kulkarni", "Varun Chopra", "Sakshi Nayar", "Akshay Bhattacharya",
  "Isha Menon", "Ashok Rao", "Kavya Dixit", "Madhav Kini", "Anushka Srivastava",
  "Manish Thakur", "Deepa Mohan", "Rahul Saxena", "Naina Dubey", "Siddharth Verma",
  "Anjum Mirza", "Rishabh Nair", "Tulsi Rao", "Gaurav Sharma", "Priyanka Dutta",
  "Vikrant Singh", "Zainab Ahmed", "Harsh Gupta", "Swati Jain", "Nitin Kapoor",
  "Simran Bhatnagar", "Rohit Kumar", "Divyajyoti Das", "Anand Verma", "Sapna Sharma",
];

const skillCategories = [
  "first_aid",
  "crowd_management",
  "language_hindi",
  "language_english",
  "language_bengali",
  "medical",
  "technical",
  "general",
];

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

const taskTypes = [
  "Crowd Management", "First Aid", "Logistics", "Registration",
  "Sanitation", "Security", "Communication", "Route Guidance",
  "Camping Setup", "Medical Assistance",
];

const incidentTypes = ["CROWD_CRUSH", "MEDICAL", "SECURITY", "INFRASTRUCTURE", "FIRE", "STAMPEDE"];
const incidentDescriptions: Record<string, string[]> = {
  CROWD_CRUSH: [
    "Heavy crowd surge at main ghat — immediate crowd control required",
    "Severe overcrowding near entry gates — barriers buckling",
    "Pilgrim bottleneck forming at narrow passage",
  ],
  MEDICAL: [
    "Volunteer reported multiple heat-stroke cases near water station",
    "Elderly pilgrim collapsed — CPR in progress, ambulance dispatched",
    "Mass dehydration alert — medical camp overwhelmed",
  ],
  SECURITY: [
    "Suspicious abandoned bag found near VIP enclosure",
    "Altercation between groups — situation escalating",
    "Perimeter breach on the eastern barricade",
  ],
  INFRASTRUCTURE: [
    "Temporary bridge showing structural stress under load",
    "Power outage across lighting grid sector B",
    "Portable toilet unit overflowing — sanitation risk",
  ],
  FIRE: [
    "Small fire reported at food stall cluster",
    "Electrical short-circuit causing smoke in control room",
  ],
  STAMPEDE: [
    "Rumour-triggered movement — risk of stampede at gate 3",
    "Panic movement detected on CCTV — containment needed",
  ],
};

const homeStates = [
  "Uttar Pradesh", "Madhya Pradesh", "Bihar", "Maharashtra",
  "Rajasthan", "West Bengal", "Tamil Nadu", "Karnataka",
];

// ─── Helpers ──────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(0, 23), randomInt(0, 59), 0, 0);
  return d;
}

function generateShifts() {
  const shifts: { startTime: Date; endTime: Date }[] = [];
  const today = new Date();
  const shiftHours = [6, 12, 20];

  for (let day = 0; day < 7; day++) {
    for (const hour of shiftHours) {
      const start = new Date(today);
      start.setDate(start.getDate() + day);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(start);
      end.setHours(start.getHours() + 6);

      shifts.push({ startTime: start, endTime: end });
    }
  }
  return shifts.slice(0, 10);
}

// ─── Main Seed ────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── Clear existing data (order matters for FK constraints)
  console.log("🧹 Clearing existing data...");
  await prisma.assignment.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.volunteerSession.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.volunteer.deleteMany({});

  // ── 1. Create 10 Zones ────────────────────────────────────
  console.log("📍 Creating 10 zones...");
  const createdZones = await Promise.all(
    zones.map((z) =>
      prisma.zone.create({
        data: {
          name: z.name,
          type: z.type,
          maxCapacity: randomInt(80, 200),
          currentLoad: randomInt(10, 60),
          priority: pick(["LOW", "MEDIUM", "HIGH"]),
        },
      })
    )
  );
  console.log(`   ✅ Created ${createdZones.length} zones`);

  // ── 2. Create 50 Volunteers ───────────────────────────────
  console.log("👥 Creating 50 volunteers...");
  const createdVolunteers = await Promise.all(
    indianNames.map((name, i) => {
      const volSkills = pickN(skillCategories, randomInt(2, 4));
      const langSkills = volSkills.filter((s) => s.startsWith("language_"));

      return prisma.volunteer.create({
        data: {
          name,
          email: `volunteer${i + 1}@mahakumbh.org`,
          phone: `+91${String(9000000000 + i * 1000 + randomInt(0, 999))}`,
          aadhaarHash: crypto.createHash("sha256").update(`aadhaar_${i}`).digest("hex"),
          age: randomInt(18, 57),
          gender: Math.random() > 0.5 ? "M" : "F",
          languages: langSkills.join(","),
          skills: volSkills.join(","),
          homeState: pick(homeStates),
          reliabilityScore: randomInt(60, 100),
          completedShifts: randomInt(0, 12),
          status: Math.random() > 0.15 ? "ACTIVE" : "INACTIVE",
        },
      });
    })
  );
  console.log(`   ✅ Created ${createdVolunteers.length} volunteers`);

  // ── 3. Create Shifts ──────────────────────────────────────
  console.log("⏰ Creating shifts...");
  const shiftsData = generateShifts();
  const createdShifts = await Promise.all(
    shiftsData.map((s) =>
      prisma.shift.create({ data: { startTime: s.startTime, endTime: s.endTime } })
    )
  );
  console.log(`   ✅ Created ${createdShifts.length} shifts`);

  // ── 4. Create Tasks ───────────────────────────────────────
  console.log("📋 Creating 20 tasks...");
  const createdTasks = await Promise.all(
    Array.from({ length: 20 }, (_, i) => {
      const zone = pick(createdZones);
      const reqSkills = pickN(skillCategories, randomInt(1, 2));
      return prisma.task.create({
        data: {
          title: `${pick(taskTypes)} - Task ${i + 1}`,
          skillsRequired: reqSkills.join(","),
          zoneId: zone.id,
          difficulty: randomInt(1, 5),
          estimatedDuration: randomInt(2, 9),
          minVolunteers: randomInt(1, 2),
          maxVolunteers: randomInt(3, 7),
        },
      });
    })
  );
  console.log(`   ✅ Created ${createdTasks.length} tasks`);

  // ── 5. Create Assignments ─────────────────────────────────
  console.log("🤝 Creating assignments...");
  const usedCombos = new Set<string>();
  let assignmentCount = 0;

  for (let i = 0; i < 30; i++) {
    const vol = pick(createdVolunteers);
    const task = pick(createdTasks);
    const shift = pick(createdShifts);
    const key = `${vol.id}_${task.id}_${shift.id}`;

    if (usedCombos.has(key)) continue;
    usedCombos.add(key);

    try {
      await prisma.assignment.create({
        data: {
          volunteerId: vol.id,
          taskId: task.id,
          shiftId: shift.id,
          checkInTime: Math.random() > 0.5 ? new Date() : null,
          checkOutTime: Math.random() > 0.8 ? new Date() : null,
          performanceRating: Math.random() > 0.7 ? randomInt(1, 5) : null,
        },
      });
      assignmentCount++;
    } catch (err: any) {
      console.warn(`   ⚠ Skipped duplicate assignment: ${err.message}`);
    }
  }
  console.log(`   ✅ Created ${assignmentCount} assignments`);

  // ── 6. Create 20 Incidents ────────────────────────────────
  console.log("⚠️  Creating 20 incidents...");
  for (let i = 0; i < 20; i++) {
    const zone = pick(createdZones);
    const type = pick(incidentTypes);
    const descriptions = incidentDescriptions[type] ?? [`Incident at ${zone.name}`];
    const deployedVols = pickN(createdVolunteers, randomInt(1, 4));

    await prisma.incident.create({
      data: {
        zoneId: zone.id,
        reportedBy: `Coordinator_${randomInt(1, 10)}`,
        severity: randomInt(1, 5),
        type,
        description: pick(descriptions),
        createdAt: daysAgo(randomInt(0, 30)),
        resolvedAt: Math.random() > 0.4 ? daysAgo(randomInt(0, 5)) : null,
        volunteersDeployed: {
          connect: deployedVols.map((v) => ({ id: v.id })),
        },
      },
    });
  }
  console.log("   ✅ Created 20 incidents");

  // ── Summary ───────────────────────────────────────────────
  console.log("\n✨ Database seed completed successfully!");
  console.log("📊 Summary:");
  console.log(`   Zones:        ${createdZones.length}`);
  console.log(`   Volunteers:   ${createdVolunteers.length}`);
  console.log(`   Shifts:       ${createdShifts.length}`);
  console.log(`   Tasks:        ${createdTasks.length}`);
  console.log(`   Assignments:  ${assignmentCount}`);
  console.log(`   Incidents:    20`);
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
