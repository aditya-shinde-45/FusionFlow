import { Router } from "express";
import { NotificationController } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.list);
router.put("/:id/read", NotificationController.markRead);
router.put("/read-all", NotificationController.markAllRead);

export default router;

