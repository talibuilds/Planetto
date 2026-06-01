/**
 * Seed script — creates sample rooms under the given user account.
 * Can be called from the admin API or directly via ts-node.
 */
import prisma from "../config/database.js";
import crypto from "crypto";

const generateCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();

const SAMPLE_ROOMS = [
  {
    name: "DBMS Finals Prep",
    type: "STUDY_GROUP" as const,
    description: "Cracking database concepts together — ER diagrams, normalization, SQL queries, and transaction management.",
    subject: "Computer Science",
    emoji: "🗄️",
    bannerColor: "#1B4332",
    isPublic: true,
    weeklyGoalSessions: 10,
  },
  {
    name: "Algorithm & DSA Grind",
    type: "STUDY_GROUP" as const,
    description: "Daily coding problems, graph theory, dynamic programming and competitive programming strategies.",
    subject: "Computer Science",
    emoji: "⚡",
    bannerColor: "#1E3A5F",
    isPublic: true,
    weeklyGoalSessions: 14,
  },
  {
    name: "Calculus & Linear Algebra",
    type: "STUDY_GROUP" as const,
    description: "From limits to eigenvectors. Weekly problem-solving sessions and concept revision for engineering maths.",
    subject: "Mathematics",
    emoji: "📐",
    bannerColor: "#3B0764",
    isPublic: true,
    weeklyGoalSessions: 8,
  },
  {
    name: "Final Year Project Hub",
    type: "PROJECT_ROOM" as const,
    description: "Collaborative space for FYP teams. Track deliverables, share updates, and stay on schedule.",
    subject: "Engineering",
    emoji: "🚀",
    bannerColor: "#7C2D12",
    isPublic: false,
    weeklyGoalSessions: 6,
  },
  {
    name: "Machine Learning Study Circle",
    type: "STUDY_GROUP" as const,
    description: "Deep dives into neural networks, gradient descent, model evaluation and Kaggle challenges.",
    subject: "AI & ML",
    emoji: "🧠",
    bannerColor: "#064E3B",
    isPublic: true,
    weeklyGoalSessions: 12,
  },
  {
    name: "Physics Electrodynamics — Sec B",
    type: "CLASSROOM" as const,
    description: "Class room for Electrodynamics. Homework help, shared notes and exam prep.",
    subject: "Physics",
    emoji: "⚛️",
    bannerColor: "#1E3A5F",
    isPublic: false,
    weeklyGoalSessions: 5,
  },
  {
    name: "100-Day Consistency Pod",
    type: "ACCOUNTABILITY_POD" as const,
    description: "Small group of 5 committed to daily goals for 100 days. Check-ins every morning. No excuses.",
    subject: "Productivity",
    emoji: "🏆",
    bannerColor: "#451A03",
    isPublic: true,
    weeklyGoalSessions: 20,
    maxMembers: 5,
  },
  {
    name: "Operating Systems Deep Dive",
    type: "STUDY_GROUP" as const,
    description: "Process scheduling, memory management, file systems and OS internals for GATE and university exams.",
    subject: "Computer Science",
    emoji: "💾",
    bannerColor: "#1F2937",
    isPublic: true,
    weeklyGoalSessions: 10,
  },
];

export async function seedRooms(adminUserId: string) {
  let created = 0;
  for (const room of SAMPLE_ROOMS) {
    const existing = await prisma.room.findFirst({ where: { name: room.name, adminId: adminUserId } });
    if (existing) continue;

    await prisma.room.create({
      data: {
        ...room,
        maxMembers: (room as any).maxMembers ?? 20,
        inviteCode: generateCode(),
        adminId: adminUserId,
        isEnabled: true,
        members: { create: { userId: adminUserId, role: "ADMIN" } },
      },
    });
    created++;
  }
  return created;
}

// Standalone execution
if (process.argv[1].endsWith("seedRooms.ts") || process.argv[1].endsWith("seedRooms.js")) {
  (async () => {
    const admin = await prisma.user.findFirst({ where: { email: "admin@planetto.space" } });
    if (!admin) { console.error("Admin user not found. Login first."); process.exit(1); }
    const count = await seedRooms(admin.id);
    console.log(`Seeded ${count} rooms.`);
    await prisma.$disconnect();
  })();
}
