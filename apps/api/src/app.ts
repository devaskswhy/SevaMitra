import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import volunteerRoutes from "./routes/volunteers";
import zoneRoutes from "./routes/zones";
import taskRoutes from "./routes/tasks";
import assignmentRoutes from "./routes/assignments";
import incidentRoutes from "./routes/incidents";
import allocationRoutes from "./routes/allocation";
import shiftRoutes from "./routes/shifts";
import demoRoutes from "./routes/demo";

// Express app construction only — no app.listen(), no Socket.io, no
// background jobs. Split out of index.ts so tests can import a real,
// fully-wired app (via supertest) without binding a port or starting
// the auto-resolve cron interval. index.ts re-exports this same `app`
// for the actual running server, so production behavior is unchanged.
const app: Express = express();

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
app.use("/api/shifts", shiftRoutes);
app.use("/api/demo", demoRoutes);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
