import { Router } from "express";
import { focusController } from "../controllers";

const router = Router();

router.get("/:userId", focusController.getAll);
router.get("/:userId/stats", focusController.getStats);
router.post("/", focusController.logSession);
router.delete("/:id", focusController.delete);

export default router;
