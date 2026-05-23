import { Request, Response } from "express";
import { authService } from "../services";
import { asyncHandler } from "../utils";

export const authController = {
  /**
   * POST /api/auth/register
   * Body: { email, password, name? }
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await authService.register(email, password, name);
    res.status(201).json({ success: true, data: user });
  }),

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await authService.login(email, password);
    res.status(200).json({ success: true, data: user });
  }),

  /**
   * POST /api/auth/google
   * Body: { idToken }
   */
  googleLogin: asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ success: false, message: "idToken is required" });
      return;
    }

    const user = await authService.googleLogin(idToken);
    res.status(200).json({ success: true, data: user });
  }),

  /**
   * GET /api/auth/profile/:userId
   */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.params.userId as string);
    res.status(200).json({ success: true, data: user });
  }),

  /**
   * PATCH /api/auth/profile/:userId
   * Body: { name?, email? }
   */
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.params.userId as string, req.body);
    res.status(200).json({ success: true, data: user });
  }),
};
