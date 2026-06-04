import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { timetableController, upload } from "../controllers/timetable.controller";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// POST /api/timetable/parse-text — OCR text → AI extracts entries (PRIMARY, fast)
router.post("/parse-text", timetableController.parseText);

// POST /api/timetable/parse — image upload → AI extracts entries (LEGACY fallback)
router.post("/parse", upload.single("timetable"), timetableController.parse);

// POST /api/timetable/confirm — save confirmed entries to DB
router.post("/confirm", timetableController.confirm);

export default router;
