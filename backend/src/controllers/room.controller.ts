import { Request, Response, NextFunction } from "express";
import { roomService } from "../services/room.service";
import { prisma } from "../config";

// Helper to get userId from request (matches existing pattern in app)
const getUser = (req: Request): string => {
  const userId = (req as any).userId as string;
  if (!userId) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  return userId;
};

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

export const roomController = {
  createRoom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const room = await roomService.createRoom(userId, req.body);
      res.status(201).json({ success: true, data: room });
    } catch (err) { next(err); }
  },

  getMyRooms: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const rooms = await roomService.getRoomsForUser(userId);
      res.json({ success: true, data: rooms });
    } catch (err) { next(err); }
  },

  discoverRooms: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const { search } = req.query;
      const rooms = await roomService.discoverRooms(userId, search as string);
      res.json({ success: true, data: rooms });
    } catch (err) { next(err); }
  },

  getRoomById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const room = await roomService.getRoomById(p(req.params.id), userId);
      res.json({ success: true, data: room });
    } catch (err) { next(err); }
  },

  updateRoom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const room = await roomService.updateRoom(p(req.params.id), userId, req.body);
      res.json({ success: true, data: room });
    } catch (err) { next(err); }
  },

  deleteRoom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const result = await roomService.deleteRoom(p(req.params.id), userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  joinByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const room = await roomService.joinRoomByCode(userId, p(req.params.inviteCode));
      res.json({ success: true, data: room });
    } catch (err) { next(err); }
  },

  leaveRoom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const result = await roomService.leaveRoom(p(req.params.id), userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  generateInvite: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const { expiresInHours, maxUses } = req.body;
      const result = await roomService.generateInvite(p(req.params.id), userId, expiresInHours, maxUses);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const { cursor } = req.query;
      const messages = await roomService.getMessages(p(req.params.id), userId, cursor as string);
      res.json({ success: true, data: messages });
    } catch (err) { next(err); }
  },

  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const { content, type, parentId, mediaUrl } = req.body;
      const msg = await roomService.sendMessage(p(req.params.id), userId, content, type, parentId, mediaUrl);
      res.status(201).json({ success: true, data: msg });
    } catch (err) { next(err); }
  },

  pinMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const msg = await roomService.pinMessage(p(req.params.msgId), p(req.params.id), userId);
      res.json({ success: true, data: msg });
    } catch (err) { next(err); }
  },

  getPinnedMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const msgs = await roomService.getPinnedMessages(p(req.params.id), userId);
      res.json({ success: true, data: msgs });
    } catch (err) { next(err); }
  },

  getTasks: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const tasks = await roomService.getRoomTasks(p(req.params.id), userId);
      res.json({ success: true, data: tasks });
    } catch (err) { next(err); }
  },

  createTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const task = await roomService.createRoomTask(p(req.params.id), userId, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (err) { next(err); }
  },

  updateTask: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const task = await roomService.updateRoomTask(p(req.params.taskId), p(req.params.id), userId, req.body);
      res.json({ success: true, data: task });
    } catch (err) { next(err); }
  },

  startSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const session = await roomService.startPomodoroSession(p(req.params.id), userId, req.body.durationMinutes);
      res.status(201).json({ success: true, data: session });
    } catch (err) { next(err); }
  },

  joinSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const session = await roomService.joinPomodoroSession(p(req.params.sid), p(req.params.id), userId);
      res.json({ success: true, data: session });
    } catch (err) { next(err); }
  },

  endSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const session = await roomService.endPomodoroSession(p(req.params.sid), p(req.params.id), userId);
      res.json({ success: true, data: session });
    } catch (err) { next(err); }
  },

  getActiveSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const session = await roomService.getActiveSession(p(req.params.id), userId);
      res.json({ success: true, data: session });
    } catch (err) { next(err); }
  },

  getRoomStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const stats = await roomService.getRoomStats(p(req.params.id), userId);
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  removeMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const result = await roomService.removeMember(p(req.params.id), userId, p(req.params.memberId));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  transferAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const result = await roomService.transferAdmin(p(req.params.id), userId, req.body.newAdminId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // ─── Admin Panel Controllers ──────────────────────────────────────────
  adminGetStats: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await roomService.adminGetPlatformStats();
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  adminGetAllRooms: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rooms = await roomService.adminGetAllRooms();
      res.json({ success: true, data: rooms });
    } catch (err) { next(err); }
  },

  adminGetAllUsers: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await roomService.adminGetAllUsers();
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  },

  adminGetRoomDetail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const room = await roomService.adminGetRoomDetail(p(req.params.id));
      res.json({ success: true, data: room });
    } catch (err) { next(err); }
  },

  adminUpdateRoom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For admin updates, bypass the admin check by using the room's own adminId
      const roomId = p(req.params.id);
      const existingRoom = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
      if (!existingRoom) return res.status(404).json({ success: false, error: "Room not found" });
      const room = await prisma.room.update({
        where: { id: roomId },
        data: {
          name: req.body.name,
          description: req.body.description,
          subject: req.body.subject,
          emoji: req.body.emoji,
          bannerColor: req.body.bannerColor,
          isPublic: req.body.isPublic,
          maxMembers: req.body.maxMembers,
          weeklyGoalSessions: req.body.weeklyGoalSessions,
          deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
        },
      });
      res.json({ success: true, data: room });
    } catch (err) { next(err); }
  },

  adminDeleteRoom: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.room.delete({ where: { id: p(req.params.id) } });
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  },

  adminDeleteUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.user.delete({ where: { id: p(req.params.id) } });
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  },

  // ─── Resources ──────────────────────────────────────────────────────
  getResources: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const resources = await roomService.getResources(p(req.params.id), userId);
      res.json({ success: true, data: resources });
    } catch (err) { next(err); }
  },

  addResource: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const resource = await roomService.addResource(p(req.params.id), userId, req.body);
      res.status(201).json({ success: true, data: resource });
    } catch (err) { next(err); }
  },

  deleteResource: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      await roomService.deleteResource(p(req.params.resId), p(req.params.id), userId);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) { next(err); }
  },

  // ─── Check-Ins ──────────────────────────────────────────────────────
  getCheckIns: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const data = await roomService.getCheckIns(p(req.params.id), userId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  checkIn: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUser(req);
      const checkin = await roomService.checkIn(p(req.params.id), userId, req.body?.note);
      res.status(201).json({ success: true, data: checkin });
    } catch (err) { next(err); }
  },
};
