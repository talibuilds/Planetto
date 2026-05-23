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

    return prisma.focusSession.create({
      data: {
        userId: input.userId,
        duration: input.duration,
        pauses: input.pauses || 0,
        quality: calculatedQuality,
        notes: input.notes,
      },
    });
  },

  /**
   * Get aggregated focus stats for a user.
   * Returns: total sessions, total focus time, average quality,
   *          today's sessions, today's focus time, day streak.
   */
  async getStats(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

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
 * Calculate consecutive days with at least one focus session,
 * ending at today (or yesterday if no session today yet).
 */
async function calculateStreak(userId: string): Promise<number> {
  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (sessions.length === 0) return 0;

  // Get unique dates (as date strings)
  const uniqueDates = [
    ...new Set(sessions.map((s) => s.createdAt.toISOString().split("T")[0])),
  ].sort((a, b) => b.localeCompare(a)); // newest first

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let expectedDate = new Date(today);

  // If no session today, check if yesterday counts
  if (uniqueDates[0] !== today) {
    expectedDate.setDate(expectedDate.getDate() - 1);
    if (uniqueDates[0] !== expectedDate.toISOString().split("T")[0]) {
      return 0; // Streak broken
    }
  }

  for (const dateStr of uniqueDates) {
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
