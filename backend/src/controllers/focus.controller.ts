import { Request, Response } from "express";
import { focusService } from "../services";
import { asyncHandler } from "../utils";

export const focusController = {
  /**
   * GET /api/focus/:userId
   * Returns all focus sessions for a user.
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await focusService.getAll(req.params.userId as string);
    res.status(200).json({ success: true, data: sessions });
  }),

  /**
   * POST /api/focus
   * Body: { userId, duration, pauses?, quality?, notes? }
   * Duration is in seconds (matching frontend's logFocusSession(durationSeconds, pauses)).
   */
  logSession: asyncHandler(async (req: Request, res: Response) => {
    const { userId, duration } = req.body;

    if (!userId || duration === undefined) {
      res.status(400).json({ success: false, message: "userId and duration are required" });
      return;
    }

    const session = await focusService.logSession(req.body);
    res.status(201).json({ success: true, data: session });
  }),

  /**
   * GET /api/focus/:userId/stats
   * Returns aggregated focus stats (today, all-time, streak).
   */
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await focusService.getStats(req.params.userId as string);
    res.status(200).json({ success: true, data: stats });
  }),

  /**
   * DELETE /api/focus/:id
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    await focusService.delete(req.params.id as string);
    res.status(200).json({ success: true, message: "Focus session deleted" });
  }),
};
