import { prisma } from "../config";
import { Priority } from "../generated/prisma/enums";

interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  subject?: string;
  priority?: Priority;
  dueDate?: string; // ISO date string e.g. "2026-05-12"
  inFocusQueue?: boolean;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  subject?: string;
  priority?: Priority;
  isCompleted?: boolean;
  inFocusQueue?: boolean;
  dueDate?: string | null;
}

export const taskService = {
  /**
   * Get all tasks for a user, ordered by creation date (newest first).
   */
  async getAll(userId: string) {
    return prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get tasks for a user filtered by due date.
   */
  async getByDate(userId: string, date: string) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    return prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Create a new task.
   */
  async create(input: CreateTaskInput) {
    return prisma.task.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        subject: input.subject || "General",
        priority: input.priority || "MED",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        inFocusQueue: input.inFocusQueue || false,
      },
    });
  },

  /**
   * Update a task by ID.
   */
  async update(taskId: string, input: UpdateTaskInput) {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...input,
        dueDate: input.dueDate !== undefined
          ? (input.dueDate ? new Date(input.dueDate) : null)
          : undefined,
      },
    });
  },

  /**
   * Toggle task completion status.
   */
  async toggleCompletion(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw Object.assign(new Error("Task not found"), { statusCode: 404 });
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { isCompleted: !task.isCompleted },
    });
  },

  /**
   * Toggle focus queue status.
   */
  async toggleFocusQueue(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw Object.assign(new Error("Task not found"), { statusCode: 404 });
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { inFocusQueue: !task.inFocusQueue },
    });
  },

  /**
   * Delete a task by ID.
   */
  async delete(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  },
};
