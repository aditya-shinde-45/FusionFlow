import { Router } from "express";
import { OrganizationController } from "../controllers/organizationController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { departmentCreateSchema, jobCreateSchema, positionCreateSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

// Departments
router.get("/departments", OrganizationController.listDepartments);
router.get("/departments/:id", OrganizationController.getDepartmentById);
router.post(
  "/departments",
  authorizePermissions(PERMISSIONS.ORG_SETUP_MANAGE),
  validate(departmentCreateSchema),
  OrganizationController.createDepartment
);

// Jobs & Grades
router.get("/jobs", OrganizationController.listJobs);
router.post(
  "/jobs",
  authorizePermissions(PERMISSIONS.ORG_SETUP_MANAGE),
  validate(jobCreateSchema),
  OrganizationController.createJob
);

// Positions
router.get("/positions", OrganizationController.listPositions);
router.post(
  "/positions",
  authorizePermissions(PERMISSIONS.ORG_SETUP_MANAGE),
  validate(positionCreateSchema),
  OrganizationController.createPosition
);

// Locations
router.get("/locations", OrganizationController.listLocations);

export default router;

