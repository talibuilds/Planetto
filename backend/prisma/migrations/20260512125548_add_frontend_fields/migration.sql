/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MED', 'HIGH');

-- AlterTable
ALTER TABLE "focus_sessions" ADD COLUMN     "pauses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quality" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "code" TEXT,
ADD COLUMN     "teacher" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'THEORY';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "in_focus_queue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MED',
ADD COLUMN     "subject" TEXT NOT NULL DEFAULT 'General';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT NOT NULL;
