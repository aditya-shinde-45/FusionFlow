import { Router } from "express";
import { OnboardingController } from "../controllers/onboardingController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/tasks", authorizePermissions(PERMISSIONS.ONBOARDING_VIEW), OnboardingController.listTasks);
router.post("/tasks", authorizePermissions(PERMISSIONS.ONBOARDING_MANAGE), OnboardingController.createTask);
router.put("/tasks/:id", authorizePermissions(PERMISSIONS.ONBOARDING_MANAGE), OnboardingController.updateTask);

export default router;

