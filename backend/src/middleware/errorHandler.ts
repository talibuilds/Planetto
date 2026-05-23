import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
}

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;

  console.error(`🔥 [${statusCode}] ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : err.message,
  });
}
