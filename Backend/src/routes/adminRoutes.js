import { Router } from "express";
import { AdminController } from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions, authorizeRoles } from "../middleware/rbac.js";
import { PERMISSIONS, ROLES } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/users", authorizeRoles(ROLES.ADMIN, ROLES.AUDITOR), AdminController.listUsers);
router.put("/users/:id/role", authorizeRoles(ROLES.ADMIN), AdminController.updateUserRole);
router.get("/roles", authorizeRoles(ROLES.ADMIN, ROLES.AUDITOR), AdminController.listRoles);
router.get("/audit", authorizePermissions(PERMISSIONS.AUDIT_VIEW), AdminController.listAudit);

export default router;

