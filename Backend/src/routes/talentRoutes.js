import { Router } from "express";
import { TalentController } from "../controllers/talentController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { goalCreateSchema, reviewSelfSchema, reviewManagerSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

// Cycles
router.get("/cycles", TalentController.listCycles);
router.post("/cycles", authorizePermissions(PERMISSIONS.PERFORMANCE_ADMIN), TalentController.createCycle);

// Goals
router.get("/goals", TalentController.listGoals);
router.post("/goals", validate(goalCreateSchema), TalentController.createGoal);
router.put("/goals/:id", TalentController.updateGoal);

// Reviews
router.get("/reviews", TalentController.listReviews);
router.post("/reviews", authorizePermissions(PERMISSIONS.PERFORMANCE_ADMIN), TalentController.initiateReview);
router.post(
  "/reviews/:id/self-assessment",
  authorizePermissions(PERMISSIONS.PERFORMANCE_SELF_ASSESS),
  validate(reviewSelfSchema),
  TalentController.submitSelfAssessment
);
router.post(
  "/reviews/:id/manager-assessment",
  authorizePermissions(PERMISSIONS.PERFORMANCE_MANAGER_ASSESS),
  validate(reviewManagerSchema),
  TalentController.submitManagerAssessment
);

// Courses & Learning
router.get("/courses", TalentController.listCourses);
router.post("/courses", authorizePermissions(PERMISSIONS.ORG_SETUP_MANAGE), TalentController.createCourse);
router.get("/enrollments", TalentController.listEnrollments);
router.post("/enroll", TalentController.enroll);
router.put("/enrollments/:id/complete", TalentController.completeEnrollment);

export default router;

