import { Router, Request, Response, NextFunction } from "express";
import { roomController } from "../controllers/room.controller";
import { authMiddleware } from "../middleware";
import { prisma } from "../config";

const router = Router();

// ─── Admin Auth Middleware ───────────────────────────────────────────────────
const isAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, email: true } });
    if (!user || (!user.isAdmin && user.email !== "admin@planetto.space")) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    next();
  } catch (err) {
    next(err);
  }
};

router.use(authMiddleware);
router.use(isAdminMiddleware);

// ─── Admin Routes ────────────────────────────────────────────────────────────
router.get("/stats", roomController.adminGetStats);
router.get("/rooms", roomController.adminGetAllRooms);
router.get("/users", roomController.adminGetAllUsers);
router.get("/rooms/:id", roomController.adminGetRoomDetail);
router.patch("/rooms/:id", roomController.adminUpdateRoom);
router.delete("/rooms/:id", roomController.adminDeleteRoom);
router.delete("/users/:id", roomController.adminDeleteUser);

// Toggle room enabled/disabled
router.patch("/rooms/:id/toggle-enabled", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ success: false, error: "Room not found" });
    const updated = await prisma.room.update({
      where: { id },
      data: { isEnabled: !room.isEnabled },
    });
    res.json({ success: true, data: { isEnabled: updated.isEnabled } });
  } catch (err) { next(err); }
});

// Seed sample rooms (admin only)
router.post("/seed-rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const { seedRooms } = await import("../scripts/seedRooms.js");
    await seedRooms(userId);
    res.json({ success: true, message: "Sample rooms seeded successfully" });
  } catch (err) { next(err); }
});

export default router;
