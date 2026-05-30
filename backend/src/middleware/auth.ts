import { Request, Response, NextFunction } from "express";

/**
 * Simple auth middleware: reads userId from the x-user-id header.
 * The frontend client interceptor attaches this from the auth context.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Missing x-user-id header" });
  }
  (req as any).userId = userId;
  next();
};
