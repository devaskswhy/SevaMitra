import { Server } from "socket.io";
import { prisma } from "./lib/prisma";
import { setSocketServer } from "./lib/socket";
import app from "./app";

const PORT = process.env.PORT || 4000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
});
setSocketServer(io);

const incidentReplacementPool = [
  {
    type: "Crowd Surge",
    description: "Overcrowding detected at Yamuna Ghat — crowd control needed",
    severity: 5,
    reportedBy: "Zone Monitor",
  },
  {
    type: "Medical Emergency",
    description: "Pilgrim requiring medical assistance near Ram Ghat",
    severity: 5,
    reportedBy: "Medical Team",
  },
  {
    type: "Lost Person",
    description: "Child reported missing near Sector 1 Ghat",
    severity: 4,
    reportedBy: "Volunteer",
  },
  {
    type: "Fire Hazard",
    description: "Small fire reported near Camp Zone B",
    severity: 4,
    reportedBy: "Security",
  },
  {
    type: "Water Supply Issue",
    description: "Drinking water shortage at Sector 4",
    severity: 3,
    reportedBy: "Camp Manager",
  },
  {
    type: "Stampede Risk",
    description: "Dangerous crowd density at Dashaswamedh Ghat entry",
    severity: 5,
    reportedBy: "Zone Monitor",
  },
];

const autoResolveInterval = setInterval(async () => {
  try {
    const now = new Date();
    const dueIncidents = await prisma.incident.findMany({
      where: {
        status: "DEPLOYED",
        resolvedAt: { lte: now },
      },
      include: {
        zone: true,
        volunteersDeployed: true,
      },
    });

    if (!dueIncidents.length) return;

    const zones = await prisma.zone.findMany({ select: { id: true } });
    if (!zones.length) return;

    for (const incident of dueIncidents) {
      const resolvedIncident = await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
        },
        include: {
          zone: true,
          volunteersDeployed: true,
        },
      });
      io.emit("incident:resolved", resolvedIncident);

      const randomTemplate =
        incidentReplacementPool[Math.floor(Math.random() * incidentReplacementPool.length)];
      const randomZone = zones[Math.floor(Math.random() * zones.length)];

      const newIncident = await prisma.incident.create({
        data: {
          zoneId: randomZone.id,
          type: randomTemplate.type,
          description: randomTemplate.description,
          severity: randomTemplate.severity,
          reportedBy: randomTemplate.reportedBy,
          status: "ACTIVE",
        },
        include: {
          zone: true,
          volunteersDeployed: true,
        },
      });
      io.emit("incident:new", newIncident);
    }
  } catch (error) {
    console.error("Auto-resolve incident job failed:", error);
  }
}, 60 * 1000);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  // Real-time assignment updates
  socket.on("assignment:updated", (data) => {
    io.emit("assignment:updated", data);
  });

  // Real-time incident updates
  socket.on("incident:reported", (data) => {
    io.emit("incident:reported", data);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  clearInterval(autoResolveInterval);
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server shut down gracefully");
    process.exit(0);
  });
});

export { app, io, prisma };
