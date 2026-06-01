import { prisma } from "../config";

interface LogSessionInput {
  userId: string;
  duration: number;  // in seconds
  pauses?: number;
  quality?: number;
  notes?: string;
}

export const focusService = {
  /**
   * Get all focus sessions for a user (newest first).
   */
  async getAll(userId: string) {
    return prisma.focusSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Log a completed focus session.
   */
  async logSession(input: LogSessionInput) {
    // Calculate quality: Base 100 - (pauses * 5), min 50%
    const calculatedQuality = input.quality ?? Math.max(50, 100 - ((input.pauses || 0) * 5));

    const session = await prisma.focusSession.create({
      data: {
        userId: input.userId,
        duration: input.duration,
        pauses: input.pauses || 0,
        quality: calculatedQuality,
        notes: input.notes,
      },
    });

    // Log today as an active day whenever a focus session is completed
    const todayStr = new Date().toISOString().split("T")[0];
    await prisma.loginRecord.upsert({
      where: { userId_loginDate: { userId: input.userId, loginDate: todayStr } },
      create: { userId: input.userId, loginDate: todayStr },
      update: {},
    }).catch(() => {});

    return session;
  },

  /**
   * Get aggregated focus stats for a user.
   * Returns: total sessions, total focus time, average quality,
   *          today's sessions, today's focus time, day streak,
   *          and a 30-day activity map combining ALL activity types.
   */
  async getStats(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Auto-record login/active day when stats are fetched (e.g. on app launch)
    const todayStr = now.toISOString().split("T")[0];
    try {
      await prisma.loginRecord.upsert({
        where: { userId_loginDate: { userId, loginDate: todayStr } },
        create: { userId, loginDate: todayStr },
        update: {},
      });
    } catch (err) {
      console.error("Failed to auto-log login record in getStatsService:", err);
    }

    // All-time stats
    const allSessions = await prisma.focusSession.aggregate({
      where: { userId },
      _count: true,
      _sum: { duration: true, quality: true },
      _avg: { quality: true },
    });

    // Today's stats
    const todaySessions = await prisma.focusSession.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
      _count: true,
      _sum: { duration: true },
      _avg: { quality: true },
    });

    // Past 30 days activity grid — ALL activity types combined
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentSessions, recentLogins, recentTasks] = await Promise.all([
      prisma.focusSession.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.loginRecord.findMany({
        where: { userId, loginDate: { gte: thirtyDaysAgo.toISOString().split("T")[0] } },
        select: { loginDate: true },
      }),
      prisma.task.findMany({
        where: { userId, isCompleted: true, completedAt: { gte: thirtyDaysAgo } },
        select: { completedAt: true },
      }),
    ]);

    const activityMap: { [dateStr: string]: number } = {};
    // Focus sessions — weighted higher
    for (const s of recentSessions) {
      const d = s.createdAt.toISOString().split("T")[0];
      activityMap[d] = (activityMap[d] || 0) + 2;
    }
    // Daily logins — baseline 1 if no other activity
    for (const l of recentLogins) {
      if (!activityMap[l.loginDate]) activityMap[l.loginDate] = 1;
    }
    // Completed tasks — +1 per task
    for (const t of recentTasks) {
      if (t.completedAt) {
        const d = t.completedAt.toISOString().split("T")[0];
        activityMap[d] = (activityMap[d] || 0) + 1;
      }
    }

    // Day streak calculation
    const streak = await calculateStreak(userId);

    return {
      allTime: {
        totalSessions: allSessions._count,
        totalFocusSeconds: allSessions._sum.duration || 0,
        totalFocusHours: parseFloat(((allSessions._sum.duration || 0) / 3600).toFixed(1)),
        avgQuality: Math.round(allSessions._avg.quality || 0),
      },
      today: {
        sessionsToday: todaySessions._count,
        focusSecondsToday: todaySessions._sum.duration || 0,
        focusHoursToday: parseFloat(((todaySessions._sum.duration || 0) / 3600).toFixed(1)),
        avgQualityToday: Math.round(todaySessions._avg.quality || 0),
      },
      dayStreak: streak,
      activity: activityMap,
    };
  },

  /**
   * Delete a focus session.
   */
  async delete(sessionId: string) {
    return prisma.focusSession.delete({ where: { id: sessionId } });
  },
};

/**
 * Calculate consecutive days with at least one activity,
 * ending at today (or yesterday if no activity today yet).
 * Uses: FocusSession, completed Tasks, LoginRecord.
 */
async function calculateStreak(userId: string): Promise<number> {
  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    select: { createdAt: true },
  });

  const completedTasks = await prisma.task.findMany({
    where: { userId, isCompleted: true, completedAt: { not: null } },
    select: { completedAt: true },
  });

  const logins = await prisma.loginRecord.findMany({
    where: { userId },
    select: { loginDate: true },
  });

  const sessionDates = sessions.map((s) => s.createdAt.toISOString().split("T")[0]);
  const taskDates = completedTasks.map((t) => t.completedAt!.toISOString().split("T")[0]);
  const loginDates = logins.map((l) => l.loginDate);

  // Combine and sort unique dates, newest first
  const allDates = [...new Set([...sessionDates, ...taskDates, ...loginDates])].sort((a, b) => b.localeCompare(a));

  if (allDates.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let expectedDate = new Date(today);

  // If no activity today, check if yesterday counts
  if (allDates[0] !== today) {
    expectedDate.setDate(expectedDate.getDate() - 1);
    if (allDates[0] !== expectedDate.toISOString().split("T")[0]) {
      return 0; // Streak broken
    }
  }

  for (const dateStr of allDates) {
    const expected = expectedDate.toISOString().split("T")[0];
    if (dateStr === expected) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (dateStr < expected) {
      break; // Gap found, streak ends
    }
  }

  return streak;
}
