import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

// Create a standard node-postgres connection pool
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });

// Instantiate the Prisma PG adapter
const adapter = new PrismaPg(pool);

// Singleton Prisma client instance.
// Uses the pg adapter for direct PostgreSQL connectivity (Prisma v7+).
const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

export default prisma;
