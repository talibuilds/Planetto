import { Request, Response } from "express";
import { taskService } from "../services";
import { asyncHandler } from "../utils";

export const taskController = {
  /**
   * GET /api/tasks/:userId
   * Query: ?date=2026-05-12 (optional, filters by due date)
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { date } = req.query;

    const tasks = date
      ? await taskService.getByDate(userId as string, date as string)
      : await taskService.getAll(userId as string);

    res.status(200).json({ success: true, data: tasks });
  }),

  /**
   * POST /api/tasks
   * Body: { userId, title, description?, subject?, priority?, dueDate?, inFocusQueue? }
   */
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId, title } = req.body;

    if (!userId || !title) {
      res.status(400).json({ success: false, message: "userId and title are required" });
      return;
    }

    const task = await taskService.create(req.body);
    res.status(201).json({ success: true, data: task });
  }),

  /**
   * PATCH /api/tasks/:id
   * Body: { title?, description?, subject?, priority?, isCompleted?, inFocusQueue?, dueDate? }
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.update(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: task });
  }),

  /**
   * PATCH /api/tasks/:id/toggle
   * Toggles isCompleted.
   */
  toggleCompletion: asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.toggleCompletion(req.params.id as string);
    res.status(200).json({ success: true, data: task });
  }),

  /**
   * PATCH /api/tasks/:id/focus
   * Toggles inFocusQueue.
   */
  toggleFocusQueue: asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.toggleFocusQueue(req.params.id as string);
    res.status(200).json({ success: true, data: task });
  }),

  /**
   * DELETE /api/tasks/:id
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    await taskService.delete(req.params.id as string);
    res.status(200).json({ success: true, message: "Task deleted" });
  }),
};
