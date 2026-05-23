import { prisma } from "../config";

interface CreateScheduleInput {
  userId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  code?: string;
  teacher?: string;
  room?: string;
  type?: string;
}

export const scheduleService = {
  /**
   * Get all schedule entries for a user, grouped by day.
   */
  async getAll(userId: string) {
    const schedules = await prisma.schedule.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Group by day for frontend consumption
    const grouped: Record<string, typeof schedules> = {};
    for (const s of schedules) {
      if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
      grouped[s.dayOfWeek].push(s);
    }

    return { schedules, grouped };
  },

  /**
   * Get schedule for a specific day.
   */
  async getByDay(userId: string, dayOfWeek: string) {
    return prisma.schedule.findMany({
      where: { userId, dayOfWeek: dayOfWeek.toUpperCase() },
      orderBy: { startTime: "asc" },
    });
  },

  /**
   * Create a single schedule entry.
   */
  async create(input: CreateScheduleInput) {
    return prisma.schedule.create({
      data: {
        userId: input.userId,
        dayOfWeek: input.dayOfWeek.toUpperCase(),
        startTime: input.startTime,
        endTime: input.endTime,
        subject: input.subject,
        code: input.code,
        teacher: input.teacher,
        room: input.room,
        type: input.type || "THEORY",
      },
    });
  },

  /**
   * Bulk save schedule entries (replaces all entries for a user).
   * Used when syncing a full timetable from the AI scan or manual upload.
   */
  async bulkSave(userId: string, entries: Omit<CreateScheduleInput, "userId">[]) {
    // Delete all existing schedules for this user first
    await prisma.schedule.deleteMany({ where: { userId } });

    // Insert all new entries
    const data = entries.map((e) => ({
      userId,
      dayOfWeek: e.dayOfWeek.toUpperCase(),
      startTime: e.startTime,
      endTime: e.endTime,
      subject: e.subject,
      code: e.code,
      teacher: e.teacher,
      room: e.room,
      type: e.type || "THEORY",
    }));

    await prisma.schedule.createMany({ data });

    // Return the newly created schedules
    return this.getAll(userId);
  },

  /**
   * Delete a single schedule entry.
   */
  async delete(scheduleId: string) {
    return prisma.schedule.delete({ where: { id: scheduleId } });
  },
};
