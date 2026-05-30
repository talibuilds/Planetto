import { prisma } from "../config";
import { RoomType, TaskStatus, Priority, MessageType } from "../generated/prisma/enums.js";
import crypto from "crypto";


// ─── Helpers ───────────────────────────────────────────────────────────────
function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A3F9B1C2"
}

function requireMember(room: any, userId: string) {
  const member = room.members?.find((m: any) => m.userId === userId);
  if (!member) throw Object.assign(new Error("Not a member of this room"), { statusCode: 403 });
  return member;
}

function requireAdmin(room: any, userId: string) {
  const member = requireMember(room, userId);
  if (member.role !== "ADMIN") throw Object.assign(new Error("Admin access required"), { statusCode: 403 });
  return member;
}

// ─── Room CRUD ─────────────────────────────────────────────────────────────
export const roomService = {

  async createRoom(userId: string, data: {
    name: string;
    type?: RoomType;
    description?: string;
    subject?: string;
    emoji?: string;
    bannerColor?: string;
    isPublic?: boolean;
    maxMembers?: number;
    deadline?: string;
    weeklyGoalSessions?: number;
  }) {
    const inviteCode = generateInviteCode();
    const room = await prisma.room.create({
      data: {
        name: data.name,
        type: data.type ?? "STUDY_GROUP",
        description: data.description,
        subject: data.subject ?? "General",
        emoji: data.emoji ?? "📚",
        bannerColor: data.bannerColor ?? "#2D5016",
        isPublic: data.isPublic ?? true,
        inviteCode,
        maxMembers: data.maxMembers ?? 20,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        weeklyGoalSessions: data.weeklyGoalSessions ?? 0,
        adminId: userId,
        members: {
          create: { userId, role: "ADMIN" },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, profileImage: true } } } } },
    });

    // System message: room created
    await prisma.roomMessage.create({
      data: {
        roomId: room.id,
        senderId: userId,
        content: `🎉 Room created! Welcome to ${room.name}.`,
        type: "SYSTEM",
      },
    });

    return room;
  },

  async getRoomsForUser(userId: string) {
    const memberships = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, profileImage: true } } },
              orderBy: { joinedAt: "asc" },
            },
            tasks: { select: { status: true } },
            pomodoroSessions: {
              where: { isActive: true },
              include: {
                participants: { include: { user: { select: { id: true, name: true } } } },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map(m => {
      const room = m.room;
      const totalTasks = room.tasks.length;
      const doneTasks = room.tasks.filter((t: any) => t.status === "DONE").length;
      const activeSession = room.pomodoroSessions[0] ?? null;
      return {
        ...room,
        memberCount: room.members.length,
        memberAvatars: room.members.slice(0, 5).map((rm: any) => rm.user),
        taskStats: { total: totalTasks, done: doneTasks },
        activeSession: activeSession ? {
          id: activeSession.id,
          startedAt: activeSession.startedAt,
          durationMinutes: activeSession.durationMinutes,
          participantCount: activeSession.participants.length,
        } : null,
        myRole: m.role,
      };
    });
  },

  async discoverRooms(userId: string, search?: string) {
    const myRoomIds = (await prisma.roomMember.findMany({ where: { userId }, select: { roomId: true } }))
      .map(m => m.roomId);

    return prisma.room.findMany({
      where: {
        isPublic: true,
        isEnabled: true,
        id: { notIn: myRoomIds },
        ...(search ? { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ]} : {}),
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  },

  async getRoomById(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, profileImage: true, email: true } } },
          orderBy: { role: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, profileImage: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        pomodoroSessions: {
          where: { isActive: true },
          include: {
            participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } },
            startedBy: { select: { id: true, name: true } },
          },
          take: 1,
        },
      },
    });

    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const myMembership = room.members.find((m: any) => m.userId === userId);

    // Update last active
    await prisma.roomMember.updateMany({
      where: { roomId, userId },
      data: { lastActiveAt: new Date() },
    });

    await roomService._updateStreak(roomId);

    // Log today's activity for user's personal streak
    const today = new Date().toISOString().split("T")[0];
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {}); // ignore unique constraint race conditions

    return { ...room, myRole: myMembership?.role };
  },

  async updateRoom(roomId: string, userId: string, data: Partial<{
    name: string; description: string; subject: string;
    emoji: string; bannerColor: string; isPublic: boolean;
    maxMembers: number; deadline: string; weeklyGoalSessions: number;
  }>) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireAdmin(room, userId);

    return prisma.room.update({
      where: { id: roomId },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });
  },

  async deleteRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireAdmin(room, userId);
    await prisma.room.delete({ where: { id: roomId } });
    return { deleted: true };
  },

  // ─── Invite System ──────────────────────────────────────────────────────
  async generateInvite(roomId: string, userId: string, expiresInHours = 24, maxUses = 50) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireAdmin(room, userId);

    const newCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { inviteCode: newCode, inviteExpiresAt: expiresAt, inviteMaxUses: maxUses, inviteUseCount: 0 },
      select: { inviteCode: true, inviteExpiresAt: true, inviteMaxUses: true },
    });
    return updated;
  },

  async joinRoomByCode(userId: string, inviteCode: string) {
    const room = await prisma.room.findUnique({
      where: { inviteCode },
      include: { members: true },
    });
    if (!room) throw Object.assign(new Error("Invalid invite code"), { statusCode: 404 });

    // Check expiry
    if (room.inviteExpiresAt && room.inviteExpiresAt < new Date()) {
      throw Object.assign(new Error("Invite link has expired"), { statusCode: 400 });
    }
    // Check max uses
    if (room.inviteUseCount >= room.inviteMaxUses) {
      throw Object.assign(new Error("Invite link has reached its maximum uses"), { statusCode: 400 });
    }
    // Check max members
    if (room.members.length >= room.maxMembers) {
      throw Object.assign(new Error("Room is full"), { statusCode: 400 });
    }
    // Already a member?
    if (room.members.find((m: any) => m.userId === userId)) {
      throw Object.assign(new Error("Already a member of this room"), { statusCode: 409 });
    }

    await prisma.$transaction([
      prisma.roomMember.create({ data: { roomId: room.id, userId, role: "MEMBER" } }),
      prisma.room.update({ where: { id: room.id }, data: { inviteUseCount: { increment: 1 } } }),
    ]);

    // System message
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.roomMessage.create({
      data: {
        roomId: room.id,
        senderId: userId,
        content: `${user?.name ?? "Someone"} joined the room.`,
        type: "SYSTEM",
      },
    });

    // Log activity for personal streak
    const today = new Date().toISOString().split("T")[0];
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {});

    // Notify all existing members about the new joiner
    const joiner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const existingMembers = room.members.filter((m: any) => m.userId !== userId);
    for (const m of existingMembers) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          title: `New member joined ${room.name}`,
          body: `${joiner?.name ?? 'Someone'} just joined your room.`,
          type: 'JOIN',
          roomId: room.id,
        },
      }).catch(() => {});
    }

    return room;
  },

  async leaveRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });

    const member = room.members.find((m: any) => m.userId === userId);
    if (!member) throw Object.assign(new Error("Not a member"), { statusCode: 400 });

    // If admin is leaving and there are other members, transfer to next member
    if (member.role === "ADMIN") {
      const otherMembers = room.members.filter((m: any) => m.userId !== userId);
      if (otherMembers.length > 0) {
        await prisma.$transaction([
          prisma.room.update({ where: { id: roomId }, data: { adminId: otherMembers[0].userId } }),
          prisma.roomMember.update({ where: { id: otherMembers[0].id }, data: { role: "ADMIN" } }),
          prisma.roomMember.delete({ where: { id: member.id } }),
        ]);
      } else {
        // Last member leaving — delete room
        await prisma.room.delete({ where: { id: roomId } });
        return { deleted: true };
      }
    } else {
      await prisma.roomMember.delete({ where: { id: member.id } });
    }

    return { left: true };
  },

  async removeMember(roomId: string, adminUserId: string, targetUserId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireAdmin(room, adminUserId);
    if (targetUserId === adminUserId) throw Object.assign(new Error("Cannot remove yourself"), { statusCode: 400 });

    const member = room.members.find((m: any) => m.userId === targetUserId);
    if (!member) throw Object.assign(new Error("User is not a member"), { statusCode: 404 });

    await prisma.roomMember.delete({ where: { id: member.id } });
    return { removed: true };
  },

  async transferAdmin(roomId: string, adminUserId: string, newAdminId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireAdmin(room, adminUserId);

    const newAdmin = room.members.find((m: any) => m.userId === newAdminId);
    if (!newAdmin) throw Object.assign(new Error("New admin must be a room member"), { statusCode: 400 });

    await prisma.$transaction([
      prisma.room.update({ where: { id: roomId }, data: { adminId: newAdminId } }),
      prisma.roomMember.updateMany({ where: { roomId, userId: adminUserId }, data: { role: "MEMBER" } }),
      prisma.roomMember.updateMany({ where: { roomId, userId: newAdminId }, data: { role: "ADMIN" } }),
    ]);

    return { transferred: true };
  },

  // ─── Messages ───────────────────────────────────────────────────────────
  async getMessages(roomId: string, userId: string, cursor?: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    return prisma.roomMessage.findMany({
      where: { roomId, parentId: null }, // top-level only
      include: {
        sender: { select: { id: true, name: true, profileImage: true } },
        replies: {
          include: { sender: { select: { id: true, name: true, profileImage: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async sendMessage(roomId: string, userId: string, content: string, type: MessageType = "TEXT", parentId?: string, mediaUrl?: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const msg = await prisma.roomMessage.create({
      data: { roomId, senderId: userId, content, type, parentId, mediaUrl },
      include: { sender: { select: { id: true, name: true, profileImage: true } } },

    });

    // Update activity for streak
    await roomService._updateStreak(roomId);
    await prisma.roomMember.updateMany({ where: { roomId, userId }, data: { lastActiveAt: new Date() } });

    // Log sender's activity for growth stats
    const today = new Date().toISOString().split("T")[0];
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {});

    // Notify all other members (skip if it's a SYSTEM message)
    if (type !== "SYSTEM") {
      const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const otherMembers = room.members.filter((m: any) => m.userId !== userId);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      for (const m of otherMembers) {
        // Check if a recent notification already exists (debounce)
        const recent = await prisma.notification.findFirst({
          where: {
            userId: m.userId,
            roomId,
            type: "MESSAGE",
            createdAt: { gte: fiveMinutesAgo },
          },
        });
        if (!recent) {
          await prisma.notification.create({
            data: {
              userId: m.userId,
              title: `New message in ${room.name}`,
              body: `${sender?.name ?? 'Someone'}: ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`,
              type: "MESSAGE",
              roomId,
            },
          }).catch(() => {});
        }
      }
    }

    return msg;
  },

  async pinMessage(messageId: string, roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireAdmin(room, userId);

    return prisma.roomMessage.update({ where: { id: messageId }, data: { isPinned: true } });
  },

  async getPinnedMessages(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    return prisma.roomMessage.findMany({
      where: { roomId, isPinned: true },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  // ─── Tasks ──────────────────────────────────────────────────────────────
  async getRoomTasks(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const tasks = await prisma.roomTask.findMany({
      where: { roomId },
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      todo: tasks.filter((t: any) => t.status === "TODO"),
      inProgress: tasks.filter((t: any) => t.status === "IN_PROGRESS"),
      done: tasks.filter((t: any) => t.status === "DONE"),
    };
  },

  async createRoomTask(roomId: string, userId: string, data: {
    title: string; description?: string;
    assigneeIds?: string[];  // multiple assignees
    assigneeId?: string;     // kept for single-assignee compat
    priority?: Priority; dueDate?: string;
  }) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    // Only room admins can create tasks
    requireAdmin(room, userId);

    const assigneeIds = data.assigneeIds && data.assigneeIds.length > 0
      ? data.assigneeIds
      : data.assigneeId ? [data.assigneeId] : [];
    const primaryAssigneeId = assigneeIds[0] ?? undefined;

    const task = await prisma.roomTask.create({
      data: {
        roomId,
        createdById: userId,
        title: data.title,
        description: data.description,
        assigneeId: primaryAssigneeId,
        assigneeIds,
        priority: data.priority ?? "MED",
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify every assignee
    const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    for (const assigneeUserId of assigneeIds) {
      await prisma.notification.create({
        data: {
          userId: assigneeUserId,
          title: `New task assigned: ${data.title}`,
          body: `${creator?.name ?? 'Admin'} assigned you a task in ${room.name}.`,
          type: 'TASK_ASSIGNED',
          roomId,
        },
      }).catch(() => {});

      // Log growth stats for assignees when they get assigned a task
      await prisma.loginRecord.upsert({
        where: { userId_loginDate: { userId: assigneeUserId, loginDate: new Date().toISOString().split("T")[0] } },
        create: { userId: assigneeUserId, loginDate: new Date().toISOString().split("T")[0] },
        update: {},
      }).catch(() => {});
    }

    // Log creator activity
    const today = new Date().toISOString().split("T")[0];
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {});

    return task;
  },

  async updateRoomTask(taskId: string, roomId: string, userId: string, data: Partial<{
    status: TaskStatus; title: string; description: string;
    assigneeId: string; assigneeIds: string[]; priority: Priority; dueDate: string;
  }>) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    // Fetch the current task to know who the assignees are
    const existingTask = await prisma.roomTask.findUnique({ where: { id: taskId } });

    const updated = await prisma.roomTask.update({
      where: { id: taskId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    const today = new Date().toISOString().split("T")[0];

    // Always log for the user making the update
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {});

    // When task is marked IN_PROGRESS or DONE — log growth for all assignees
    if ((data.status === "DONE" || data.status === "IN_PROGRESS") && existingTask?.status !== data.status) {
      const assigneeUserIds = existingTask?.assigneeIds?.length
        ? existingTask.assigneeIds
        : existingTask?.assigneeId ? [existingTask.assigneeId] : [];

      for (const aId of assigneeUserIds) {
        await prisma.loginRecord.upsert({
          where: { userId_loginDate: { userId: aId, loginDate: today } },
          create: { userId: aId, loginDate: today },
          update: {},
        }).catch(() => {});

        if (data.status === "DONE") {
          await prisma.notification.create({
            data: {
              userId: aId,
              title: `Task completed: ${existingTask?.title ?? ''}`,
              body: `Great work! This task has been marked as done in ${room.name}.`,
              type: 'TASK_DONE',
              roomId,
            },
          }).catch(() => {});
        }
      }
    }

    return updated;
  },

  // ─── Pomodoro Sessions ──────────────────────────────────────────────────
  async startPomodoroSession(roomId: string, userId: string, durationMinutes = 25) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    // End any existing active session
    await prisma.roomPomodoroSession.updateMany({
      where: { roomId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    const session = await prisma.roomPomodoroSession.create({
      data: {
        roomId,
        startedById: userId,
        durationMinutes,
        participants: { create: { userId } }, // starter auto-joins
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } },
        startedBy: { select: { id: true, name: true } },
      },
    });

    await roomService._updateStreak(roomId);

    // Notify via system message
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.roomMessage.create({
      data: {
        roomId,
        senderId: userId,
        content: `⏱️ ${user?.name} started a ${durationMinutes}-minute Pomodoro session!`,
        type: "SYSTEM",
      },
    });

    // Notify all non-starter members to join
    const nonStarters = room.members.filter((m: any) => m.userId !== userId);
    for (const m of nonStarters) {
      await prisma.notification.create({
        data: {
          userId: m.userId,
          title: `⏱️ Group Pomodoro started in ${room.name}`,
          body: `${user?.name ?? 'Admin'} started a ${durationMinutes}-min focus session. Tap to join!`,
          type: "POMODORO",
          roomId,
        },
      }).catch(() => {});
    }

    return session;
  },

  async joinPomodoroSession(sessionId: string, roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const session = await prisma.roomPomodoroSession.findUnique({ where: { id: sessionId } });
    if (!session || !session.isActive) throw Object.assign(new Error("No active session"), { statusCode: 400 });

    // Upsert participant
    await prisma.roomSessionParticipant.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId },
      update: {},
    });

    return prisma.roomPomodoroSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } },
        startedBy: { select: { id: true, name: true } },
      },
    });
  },

  async endPomodoroSession(sessionId: string, roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const session = await prisma.roomPomodoroSession.findUnique({
      where: { id: sessionId },
      include: { participants: true },
    });
    if (!session) throw Object.assign(new Error("Session not found"), { statusCode: 404 });

    // Only starter or admin can end
    const member = room.members.find((m: any) => m.userId === userId);
    if (session.startedById !== userId && member?.role !== "ADMIN") {
      throw Object.assign(new Error("Only the session starter or room admin can end the session"), { statusCode: 403 });
    }

    const ended = await prisma.roomPomodoroSession.update({
      where: { id: sessionId },
      data: { isActive: false, endedAt: new Date() },
    });

    // Create FocusSession for every participant so Weekly Focus updates
    const durationSeconds = session.durationMinutes * 60;
    for (const p of session.participants) {
      await prisma.focusSession.create({
        data: {
          userId: p.userId,
          duration: durationSeconds,
          quality: 100,
          notes: `Group Pomodoro — ${room.name}`,
        },
      }).catch(() => {});

      // Also log LoginRecord for streak
      const today = new Date().toISOString().split("T")[0];
      await prisma.loginRecord.upsert({
        where: { userId_loginDate: { userId: p.userId, loginDate: today } },
        create: { userId: p.userId, loginDate: today },
        update: {},
      }).catch(() => {});
    }

    return ended;
  },

  async getActiveSession(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    return prisma.roomPomodoroSession.findFirst({
      where: { roomId, isActive: true },
      include: {
        participants: { include: { user: { select: { id: true, name: true, profileImage: true } } } },
        startedBy: { select: { id: true, name: true } },
      },
    });
  },

  // ─── Stats ──────────────────────────────────────────────────────────────
  async getRoomStats(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [weekSessions, weekMessages, allTasks, doneTasks, members] = await Promise.all([
      prisma.roomPomodoroSession.count({ where: { roomId, createdAt: { gte: weekAgo } } }),
      prisma.roomMessage.count({ where: { roomId, createdAt: { gte: weekAgo }, type: { not: "SYSTEM" } } }),
      prisma.roomTask.count({ where: { roomId } }),
      prisma.roomTask.count({ where: { roomId, status: "DONE" } }),
      prisma.roomMember.findMany({
        where: { roomId },
        include: { user: { select: { id: true, name: true, profileImage: true } } },
      }),
    ]);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const memberActivity = members.map((m: any) => {
      let activityStatus: "active_today" | "active_week" | "inactive";
      if (m.lastActiveAt && m.lastActiveAt > dayAgo) activityStatus = "active_today";
      else if (m.lastActiveAt && m.lastActiveAt > weekAgoDate) activityStatus = "active_week";
      else activityStatus = "inactive";

      return { ...m.user, role: m.role, lastActiveAt: m.lastActiveAt, activityStatus };
    });

    return {
      streak: room.streakCount,
      weeklyStats: { sessions: weekSessions, messages: weekMessages, tasksCompleted: doneTasks },
      taskProgress: { total: allTasks, done: doneTasks },
      memberActivity,
      weeklyGoal: room.weeklyGoalSessions,
      weeklyGoalProgress: room.weeklyGoalSessions > 0 ? Math.min(100, Math.round((weekSessions / room.weeklyGoalSessions) * 100)) : 0,
    };
  },

  // ─── Internal Helpers ───────────────────────────────────────────────────
  async _updateStreak(roomId: string) {
    const today = new Date().toISOString().split("T")[0];
    const room = await prisma.room.findUnique({ where: { id: roomId }, select: { lastActiveDate: true, streakCount: true } });
    if (!room) return;

    if (room.lastActiveDate === today) return; // already counted today

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const newStreak = room.lastActiveDate === yesterday ? (room.streakCount + 1) : 1;

    await prisma.room.update({
      where: { id: roomId },
      data: { lastActiveDate: today, streakCount: newStreak },
    });
  },

  // ─── Admin-level Operations ─────────────────────────────────────────────
  async adminGetAllRooms() {
    return prisma.room.findMany({
      include: {
        _count: { select: { members: true, messages: true, tasks: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async adminGetAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true, name: true, email: true, profileImage: true,
        isAdmin: true, createdAt: true,
        _count: { select: { roomMemberships: true, tasks: true, focusSessions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async adminGetRoomDetail(roomId: string) {
    return prisma.room.findUnique({
      where: { id: roomId },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, profileImage: true } } } },
        messages: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        pomodoroSessions: {
          include: { startedBy: { select: { id: true, name: true } }, _count: { select: { participants: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  },

  async adminGetPlatformStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalRooms, activeRooms, todayMessages, totalSessions] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.roomPomodoroSession.count({ where: { isActive: true } }),
      prisma.roomMessage.count({ where: { createdAt: { gte: today }, type: { not: "SYSTEM" } } }),
      prisma.roomPomodoroSession.count(),
    ]);

    return { totalUsers, totalRooms, activeRooms, todayMessages, totalSessions };
  },

  // ─── Resources ───────────────────────────────────────────────────────────
  async getResources(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);
    return prisma.roomResource.findMany({
      where: { roomId },
      include: { uploader: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async addResource(roomId: string, userId: string, data: { title: string; type: string; url: string }) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const resource = await prisma.roomResource.create({
      data: { roomId, uploaderId: userId, title: data.title, type: data.type, url: data.url },
      include: { uploader: { select: { id: true, name: true, profileImage: true } } },
    });

    // Log activity
    const today = new Date().toISOString().split("T")[0];
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {});

    return resource;
  },

  async deleteResource(resourceId: string, roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    const resource = await prisma.roomResource.findUnique({ where: { id: resourceId } });
    if (!resource) throw Object.assign(new Error("Resource not found"), { statusCode: 404 });
    // Only uploader or admin can delete
    const member = requireMember(room, userId);
    if (resource.uploaderId !== userId && member.role !== "ADMIN") {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
    return prisma.roomResource.delete({ where: { id: resourceId } });
  },

  // ─── Check-Ins ───────────────────────────────────────────────────────────
  async getCheckIns(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    // Get last 7 days of check-ins for all members
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    const checkins = await prisma.roomCheckIn.findMany({
      where: { roomId, date: { in: days } },
      include: { user: { select: { id: true, name: true, profileImage: true } } },
    });

    // Build matrix: { userId -> { date -> true } }
    const matrix: Record<string, Record<string, boolean>> = {};
    checkins.forEach((c: any) => {
      if (!matrix[c.userId]) matrix[c.userId] = {};
      matrix[c.userId][c.date] = true;
    });

    return { days, matrix, checkins };
  },

  async checkIn(roomId: string, userId: string, note?: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room) throw Object.assign(new Error("Room not found"), { statusCode: 404 });
    requireMember(room, userId);

    const today = new Date().toISOString().split("T")[0];

    const checkin = await prisma.roomCheckIn.upsert({
      where: { roomId_userId_date: { roomId, userId, date: today } },
      create: { roomId, userId, date: today, note },
      update: { note },
    });

    // Log activity
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId, loginDate: today } },
      create: { userId, loginDate: today },
      update: {},
    }).catch(() => {});

    return checkin;
  },
};
