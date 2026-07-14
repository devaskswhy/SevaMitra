import express, { Express, Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./lib/prisma";
import { setSocketServer } from "./lib/socket";
import volunteerRoutes from "./routes/volunteers";
import zoneRoutes from "./routes/zones";
import taskRoutes from "./routes/tasks";
import assignmentRoutes from "./routes/assignments";
import incidentRoutes from "./routes/incidents";
import allocationRoutes from "./routes/allocation";
import demoRoutes from "./routes/demo";
import chatRoutes from "./routes/chat";

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/allocation", allocationRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

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
