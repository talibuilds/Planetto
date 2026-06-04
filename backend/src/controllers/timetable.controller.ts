import { Request, Response } from "express";
import multer from "multer";
import { timetableService } from "../services/timetable.service";
import { asyncHandler } from "../utils";

// ─── Multer config (kept for legacy image upload) ───────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP, or PDF files are accepted."));
    }
  },
});

export const timetableController = {
  /**
   * POST /api/timetable/parse-text
   * Accepts: JSON body { text: "OCR extracted text..." }
   * Header: x-user-id
   * Returns: { success, data: [parsed entries] }
   * 
   * This is the PRIMARY endpoint — fast, reliable, text-only AI call.
   */
  parseText: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    if (!userId) {
      res.status(401).json({ success: false, error: "Missing x-user-id header" });
      return;
    }

    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      res.status(400).json({
        success: false,
        error: "OCR text is too short or missing. Please try a clearer image.",
      });
      return;
    }

    console.log(`📝 Received OCR text (${text.length} chars) from user ${userId}`);

    const entries = await timetableService.parseText(text.trim());

    res.status(200).json({
      success: true,
      message: `AI extracted ${entries.length} class entries from OCR text.`,
      data: entries,
    });
  }),

  /**
   * POST /api/timetable/parse (LEGACY — image upload)
   * Kept as fallback. Accepts: multipart/form-data with field "timetable"
   */
  parse: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    if (!userId) {
      res.status(401).json({ success: false, error: "Missing x-user-id header" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded." });
      return;
    }

    const entries = await timetableService.parseImage(file.buffer, file.mimetype);

    res.status(200).json({
      success: true,
      message: `AI extracted ${entries.length} class entries.`,
      data: entries,
    });
  }),

  /**
   * POST /api/timetable/confirm
   * Body: { entries: [...] }
   * Saves the confirmed entries to the DB.
   */
  confirm: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    if (!userId) {
      res.status(401).json({ success: false, error: "Missing x-user-id header" });
      return;
    }

    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ success: false, error: "entries array is required" });
      return;
    }

    const result = await timetableService.replaceSchedules(userId, entries);

    res.status(200).json({
      success: true,
      message: `Timetable saved! ${result.count} classes stored.`,
      data: { count: result.count },
    });
  }),
};
