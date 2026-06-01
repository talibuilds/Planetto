import { Router } from "express";
import { roomController } from "../controllers/room.controller";
import { authMiddleware } from "../middleware";

const router = Router();

// All room routes require authentication
router.use(authMiddleware);

// ─── Room CRUD ──────────────────────────────────────────────────────────────
router.post("/", roomController.createRoom);
router.get("/", roomController.getMyRooms);
router.get("/discover", roomController.discoverRooms);
router.get("/:id", roomController.getRoomById);
router.patch("/:id", roomController.updateRoom);
router.delete("/:id", roomController.deleteRoom);

// ─── Membership ─────────────────────────────────────────────────────────────
router.post("/join/:inviteCode", roomController.joinByCode);
router.post("/:id/leave", roomController.leaveRoom);
router.post("/:id/invite", roomController.generateInvite);
router.delete("/:id/members/:memberId", roomController.removeMember);
router.patch("/:id/transfer-admin", roomController.transferAdmin);

// ─── Messages ────────────────────────────────────────────────────────────────
router.get("/:id/messages", roomController.getMessages);
router.post("/:id/messages", roomController.sendMessage);
router.patch("/:id/messages/:msgId/pin", roomController.pinMessage);
router.get("/:id/messages/pinned", roomController.getPinnedMessages);

// ─── Tasks ───────────────────────────────────────────────────────────────────
router.get("/:id/tasks", roomController.getTasks);
router.post("/:id/tasks", roomController.createTask);
router.patch("/:id/tasks/:taskId", roomController.updateTask);

// ─── Pomodoro Sessions ───────────────────────────────────────────────────────
router.post("/:id/sessions/start", roomController.startSession);
router.post("/:id/sessions/:sid/join", roomController.joinSession);
router.post("/:id/sessions/:sid/end", roomController.endSession);
router.get("/:id/sessions/active", roomController.getActiveSession);

// ─── Stats ───────────────────────────────────────────────────────────────────
router.get("/:id/stats", roomController.getRoomStats);

// ─── Resources ───────────────────────────────────────────────────────────────
router.get("/:id/resources", roomController.getResources);
router.post("/:id/resources", roomController.addResource);
router.delete("/:id/resources/:resId", roomController.deleteResource);

// ─── Check-Ins ───────────────────────────────────────────────────────────────
router.get("/:id/checkins", roomController.getCheckIns);
router.post("/:id/checkins", roomController.checkIn);

export default router;
