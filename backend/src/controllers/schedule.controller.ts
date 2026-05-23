import { Request, Response } from "express";
import { scheduleService } from "../services";
import { asyncHandler } from "../utils";

export const scheduleController = {
  /**
   * GET /api/schedules/:userId
   * Query: ?day=MON (optional, filters by day)
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { day } = req.query;

    if (day) {
      const schedules = await scheduleService.getByDay(userId as string, day as string);
      res.status(200).json({ success: true, data: schedules });
      return;
    }

    const result = await scheduleService.getAll(userId as string);
    res.status(200).json({ success: true, data: result.schedules });
  }),

  /**
   * POST /api/schedules
   * Body: { userId, dayOfWeek, startTime, endTime, subject, code?, teacher?, room?, type? }
   */
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId, dayOfWeek, startTime, endTime, subject } = req.body;

    if (!userId || !dayOfWeek || !startTime || !endTime || !subject) {
      res.status(400).json({
        success: false,
        message: "userId, dayOfWeek, startTime, endTime, and subject are required",
      });
      return;
    }

    const schedule = await scheduleService.create(req.body);
    res.status(201).json({ success: true, data: schedule });
  }),

  /**
   * POST /api/schedules/bulk
   * Body: { userId, entries: [...] }
   * Replaces all schedule entries for the user.
   */
  bulkSave: asyncHandler(async (req: Request, res: Response) => {
    const { userId, entries } = req.body;

    if (!userId || !Array.isArray(entries)) {
      res.status(400).json({ success: false, message: "userId and entries array are required" });
      return;
    }

    const result = await scheduleService.bulkSave(userId, entries);
    res.status(201).json({
      success: true,
      message: `Saved ${entries.length} schedule entries`,
      data: result,
    });
  }),

  /**
   * DELETE /api/schedules/:id
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    await scheduleService.delete(req.params.id as string);
    res.status(200).json({ success: true, message: "Schedule entry deleted" });
  }),
};
