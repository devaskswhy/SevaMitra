import express, { Express, Request, Response } from "express";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import volunteerRoutes from "./routes/volunteers";
import zoneRoutes from "./routes/zones";
import taskRoutes from "./routes/tasks";
import assignmentRoutes from "./routes/assignments";
import incidentRoutes from "./routes/incidents";
import allocationRoutes from "./routes/allocation";

const app: Express = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

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

// Error handling middleware
app.use((err: any, _req: Request, res: Response) => {
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
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server shut down gracefully");
    process.exit(0);
  });
});

export { app, io, prisma };
