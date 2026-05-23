import { Router } from "express";
import { scheduleController } from "../controllers";

const router = Router();

router.get("/:userId", scheduleController.getAll);
router.post("/", scheduleController.create);
router.post("/bulk", scheduleController.bulkSave);
router.delete("/:id", scheduleController.delete);

export default router;
