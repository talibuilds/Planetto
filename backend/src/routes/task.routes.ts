import { Router } from "express";
import { taskController } from "../controllers";

const router = Router();

router.get("/:userId", taskController.getAll);
router.post("/", taskController.create);
router.patch("/:id", taskController.update);
router.patch("/:id/toggle", taskController.toggleCompletion);
router.patch("/:id/focus", taskController.toggleFocusQueue);
router.delete("/:id", taskController.delete);

export default router;
