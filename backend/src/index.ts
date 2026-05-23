import express from "express";
import cors from "cors";
import { env, prisma } from "./config";
import { errorHandler } from "./middleware";
import apiRoutes from "./routes";

// ─── Create Express App ────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────
app.use(cors());                    // Allow cross-origin requests from the Expo app
app.use(express.json());            // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─── API Routes ────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ─── Root Endpoint ─────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    app: "Planetto Backend",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// ─── Global Error Handler (must be last) ───────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────
async function main() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(env.PORT, () => {
      console.log(`
  🪐  Planetto Backend is live!
  ───────────────────────────────
  🌍  Environment : ${env.NODE_ENV}
  🚀  Server      : http://localhost:${env.PORT}
  📡  Health      : http://localhost:${env.PORT}/api/health
  ───────────────────────────────
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
