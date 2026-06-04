import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import focusRoutes from "./focus.routes";
import scheduleRoutes from "./schedule.routes";
import roomRoutes from "./room.routes";
import adminRoutes from "./admin.routes";
import notificationRoutes from "./notification.routes";
import timetableRoutes from "./timetable.routes";

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
router.use("/rooms", roomRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/timetable", timetableRoutes);

export default router;

