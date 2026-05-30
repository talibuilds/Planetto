import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authService = {
  /**
   * Register a new user.
   */
  async register(email: string, password: string, name?: string) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error("User with this email already exists"), { statusCode: 409 });
    }

    const user = await prisma.user.create({
      data: { email, password, name },
      select: { id: true, email: true, name: true, profileImage: true, createdAt: true },
    });

    // Record login for newly registered user
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await prisma.loginRecord.upsert({
        where: {
          userId_loginDate: {
            userId: user.id,
            loginDate: todayStr,
          },
        },
        create: {
          userId: user.id,
          loginDate: todayStr,
        },
        update: {},
      });
    } catch (err) {
      console.error("Failed to log login record on registration:", err);
    }

    return user;
  },

  /**
   * Login — simple email/password check (no JWT yet).
   */
  async login(email: string, password: string) {
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, profileImage: true, createdAt: true },
    });

    // Auto-create demo credential for testing if it doesn't exist
    if (!user && email === "admin@planetto.space" && password === "admin123") {
      user = await prisma.user.create({
        data: {
          email,
          password,
          name: "Admin Demo User",
        },
        select: { id: true, email: true, name: true, password: true, profileImage: true, createdAt: true },
      });
    }

    if (!user) {
      throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }

    // Simple plaintext comparison for now
    // TODO: Replace with bcrypt hash comparison in production
    if (user.password !== password) {
      throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }

    // Seed sessions for the demo user if they don't have any yet
    if (email === "admin@planetto.space") {
      // We will only seed sessions now, tasks are created manually by the user

      const focusCount = await prisma.focusSession.count({ where: { userId: user.id } });
      if (focusCount === 0) {
        const sessionsToSeed = [
          { offsetDays: 0, count: 3 }, // Today
          { offsetDays: 1, count: 2 }, // Yesterday
          { offsetDays: 2, count: 4 }, // 2 days ago
          { offsetDays: 3, count: 1 }, // 3 days ago
          { offsetDays: 5, count: 2 },
          { offsetDays: 7, count: 3 },
          { offsetDays: 10, count: 1 },
          { offsetDays: 12, count: 2 },
          { offsetDays: 15, count: 1 },
          { offsetDays: 20, count: 4 },
          { offsetDays: 25, count: 2 },
        ];

        for (const entry of sessionsToSeed) {
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() - entry.offsetDays);
          
          for (let i = 0; i < entry.count; i++) {
            await prisma.focusSession.create({
              data: {
                userId: user.id,
                duration: 1800 + i * 300, // 30-35 mins
                pauses: i % 2,
                quality: Math.max(70, 100 - (i % 2) * 15),
                notes: `Seeded session ${i + 1} for testing`,
                createdAt: sessionDate,
              },
            });
          }
        }
      }

      const scheduleCount = await prisma.schedule.count({ where: { userId: user.id } });
      if (scheduleCount === 0) {
        await prisma.schedule.createMany({
          data: [
            // MON
            { userId: user.id, dayOfWeek: "MON", startTime: "08:55", endTime: "10:45", subject: "ADA", code: "ADA LAB", teacher: "Prof. MANJULA S", room: "2F LAB 3", type: "LAB" },
            { userId: user.id, dayOfWeek: "MON", startTime: "11:15", endTime: "12:10", subject: "CRP", code: "CRP", teacher: "Prof. ROHITH VAIDYA K", room: "205", type: "THEORY" },
            { userId: user.id, dayOfWeek: "MON", startTime: "12:10", endTime: "01:05", subject: "SE", code: "SE", teacher: "Prof. LAKSHMI NEELIMA", room: "205", type: "THEORY" },
            { userId: user.id, dayOfWeek: "MON", startTime: "02:00", endTime: "02:55", subject: "OS", code: "OS", teacher: "Dr. M V SUDHAMANI", room: "210", type: "THEORY" },
            { userId: user.id, dayOfWeek: "MON", startTime: "02:55", endTime: "03:50", subject: "ADA", code: "ADA", teacher: "Prof. MANJULA S", room: "210", type: "THEORY" },
            // TUE
            { userId: user.id, dayOfWeek: "TUE", startTime: "08:55", endTime: "09:50", subject: "TFC", code: "TFC TUTORIAL", teacher: "Prof. RASHMI K B", room: "304", type: "TUTORIAL" },
            { userId: user.id, dayOfWeek: "TUE", startTime: "11:15", endTime: "12:10", subject: "LAO", code: "LAO", teacher: "Prof. Mallikarjun", room: "103", type: "THEORY" },
            { userId: user.id, dayOfWeek: "TUE", startTime: "12:10", endTime: "01:05", subject: "OS", code: "OS", teacher: "Dr. M V SUDHAMANI", room: "103", type: "THEORY" },
            { userId: user.id, dayOfWeek: "TUE", startTime: "02:00", endTime: "02:55", subject: "SE", code: "SE", teacher: "Prof. LAKSHMI NEELIMA", room: "103", type: "THEORY" },
            // WED
            { userId: user.id, dayOfWeek: "WED", startTime: "08:00", endTime: "08:55", subject: "TFC", code: "TFC", teacher: "Prof. RASHMI K B", room: "301", type: "THEORY" },
            { userId: user.id, dayOfWeek: "WED", startTime: "08:55", endTime: "09:50", subject: "LAO", code: "LAO", teacher: "Prof. Mallikarjun", room: "301", type: "THEORY" },
            { userId: user.id, dayOfWeek: "WED", startTime: "09:50", endTime: "10:45", subject: "ADA", code: "ADA", teacher: "Prof. MANJULA S", room: "301", type: "THEORY" },
            // THU
            { userId: user.id, dayOfWeek: "THU", startTime: "08:55", endTime: "09:50", subject: "SE", code: "SE", teacher: "Prof. LAKSHMI NEELIMA", room: "307", type: "THEORY" },
            { userId: user.id, dayOfWeek: "THU", startTime: "09:50", endTime: "10:45", subject: "ADA", code: "ADA", teacher: "Prof. MANJULA S", room: "307", type: "THEORY" },
            { userId: user.id, dayOfWeek: "THU", startTime: "11:15", endTime: "12:10", subject: "OS", code: "OS", teacher: "Dr. M V SUDHAMANI", room: "201", type: "THEORY" },
            { userId: user.id, dayOfWeek: "THU", startTime: "12:10", endTime: "01:05", subject: "CRP", code: "CRP", teacher: "Prof. ROHITH VAIDYA K", room: "201", type: "THEORY" },
            { userId: user.id, dayOfWeek: "THU", startTime: "02:00", endTime: "03:50", subject: "OS", code: "OS LAB", teacher: "Dr. M V SUDHAMANI", room: "2F LAB 4", type: "LAB" },
            // FRI
            { userId: user.id, dayOfWeek: "FRI", startTime: "08:55", endTime: "10:45", subject: "MAD", code: "MAD LAB", teacher: "Prof. MYG", room: "2F LAB 4", type: "LAB" },
            { userId: user.id, dayOfWeek: "FRI", startTime: "11:15", endTime: "12:10", subject: "TFC", code: "TFC", teacher: "Prof. RASHMI K B", room: "204", type: "THEORY" },
            { userId: user.id, dayOfWeek: "FRI", startTime: "12:10", endTime: "01:05", subject: "CRP", code: "CRP", teacher: "Prof. ROHITH VAIDYA K", room: "204", type: "THEORY" },
            { userId: user.id, dayOfWeek: "FRI", startTime: "02:00", endTime: "02:55", subject: "LAO", code: "LAO TUTORIAL", teacher: "Prof. Mallikarjun", room: "210", type: "TUTORIAL" }
          ]
        });
      }
    }

    // Record login
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await prisma.loginRecord.upsert({
        where: {
          userId_loginDate: {
            userId: user.id,
            loginDate: todayStr,
          },
        },
        create: {
          userId: user.id,
          loginDate: todayStr,
        },
        update: {},
      });
    } catch (err) {
      console.error("Failed to log login record on email login:", err);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  },

  /**
   * Google OAuth Login/Registration
   * Verifies the Google id_token and finds/creates the user.
   */
  async googleLogin(idToken: string) {
    let email = "";
    let name = "";
    let googleId = "";

    if (idToken && idToken.startsWith("mock-")) {
      // Parse mock token in format: mock-email-name-googleId
      const parts = idToken.split("-");
      email = parts[1] || "mock-developer@planetto.space";
      name = parts[2] || "Developer User";
      googleId = parts[3] || "dev12345";
    } else {
      if (!process.env.GOOGLE_CLIENT_ID) {
        throw Object.assign(new Error("Google OAuth is not configured on the server"), { statusCode: 500 });
      }

      // Verify the token with Google
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw Object.assign(new Error("Invalid Google token"), { statusCode: 401 });
      }

      email = payload.email;
      name = payload.name || "";
      googleId = payload.sub;
    }

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    if (user) {
      // If user exists but doesn't have googleId linked yet, link it
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, name: user.name || name }
        });
      }
    } else {
      // Register new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
        }
      });
    }

    // Record login
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await prisma.loginRecord.upsert({
        where: {
          userId_loginDate: {
            userId: user.id,
            loginDate: todayStr,
          },
        },
        create: {
          userId: user.id,
          loginDate: todayStr,
        },
        update: {},
      });
    } catch (err) {
      console.error("Failed to log login record on Google login:", err);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  },

  /**
   * Get user profile by ID.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, profileImage: true, createdAt: true },
    });
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    return user;
  },

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, data: { name?: string; email?: string; profileImage?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, profileImage: true, createdAt: true },
    });
    return user;
  },
};
