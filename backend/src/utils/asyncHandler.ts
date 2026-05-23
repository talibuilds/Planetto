import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler to catch errors and forward them
 * to the Express error-handling middleware.
 * Eliminates the need for try/catch in every controller.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
