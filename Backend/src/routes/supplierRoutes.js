import { Router } from "express";
import { SupplierController } from "../controllers/supplierController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { supplierCreateSchema, supplierUpdateSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizePermissions(PERMISSIONS.SUPPLIER_VIEW), SupplierController.list);
router.get("/:id", authorizePermissions(PERMISSIONS.SUPPLIER_VIEW), SupplierController.getById);

router.post(
  "/",
  authorizePermissions(PERMISSIONS.SUPPLIER_MANAGE),
  validate(supplierCreateSchema),
  logAuditEvent("REGISTER_SUPPLIER", "SUPPLIER", (req, data) => ({
    entityId: data.data?.id,
    details: `Registered supplier ${data.data?.name} with Tax ID ${data.data?.taxId}`,
  })),
  SupplierController.create
);

router.put(
  "/:id",
  authorizePermissions(PERMISSIONS.SUPPLIER_MANAGE),
  validate(supplierUpdateSchema),
  logAuditEvent("UPDATE_SUPPLIER", "SUPPLIER", (req) => ({
    entityId: req.params.id,
    details: `Updated supplier ${req.params.id}`,
  })),
  SupplierController.update
);

export default router;

