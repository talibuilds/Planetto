import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import focusRoutes from "./focus.routes";
import scheduleRoutes from "./schedule.routes";

const router = Router();

/**
 * GET /api/health
 * Basic health-check endpoint to verify the server is running.
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "🪐 Planetto API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── Mount Feature Routes ──────────────────────────────
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/focus", focusRoutes);
router.use("/schedules", scheduleRoutes);

export default router;
