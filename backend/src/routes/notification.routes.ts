import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config";
import { authMiddleware } from "../middleware";

const router = Router();
router.use(authMiddleware);

// GET /notifications — list unread + recent notifications for the user
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
});

// PATCH /notifications/mark-all-read — mark all as read
router.patch("/mark-all-read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /notifications/:id/read — mark single as read
router.patch("/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.notification.updateMany({
      where: { id: notifId, userId },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /notifications/:id — delete a notification
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const notifId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.notification.deleteMany({ where: { id: notifId, userId } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
