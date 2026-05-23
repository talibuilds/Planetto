import dotenv from "dotenv";

// Load .env before anything else
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  GEMINI_API_KEY: string;
}

const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

// Fail fast if the database URL is missing
if (!env.DATABASE_URL) {
  console.error("❌ FATAL: DATABASE_URL is not set in .env");
  process.exit(1);
}

export default env;
