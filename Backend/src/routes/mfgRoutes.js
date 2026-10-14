import { Router } from "express";
import { MfgController } from "../controllers/mfgController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();
router.use(authenticate);

// Bills of Materials
router.get("/bom", authorizePermissions(PERMISSIONS.BOM_VIEW), MfgController.listBoms);
router.get("/bom/:id", authorizePermissions(PERMISSIONS.BOM_VIEW), MfgController.getBom);
router.post("/bom", authorizePermissions(PERMISSIONS.BOM_MANAGE), MfgController.createBom);

// Routings & Work Centers
router.get("/routings", authorizePermissions(PERMISSIONS.ROUTING_VIEW), MfgController.listRoutings);
router.get("/routings/:id", authorizePermissions(PERMISSIONS.ROUTING_VIEW), MfgController.getRouting);
router.get("/work-centers", authorizePermissions(PERMISSIONS.ROUTING_VIEW), MfgController.listWorkCenters);

// Work Orders
router.get("/work-orders", authorizePermissions(PERMISSIONS.WORK_ORDER_VIEW), MfgController.listWorkOrders);
router.get("/work-orders/:id", authorizePermissions(PERMISSIONS.WORK_ORDER_VIEW), MfgController.getWorkOrder);
router.post("/work-orders", authorizePermissions(PERMISSIONS.WORK_ORDER_MANAGE), MfgController.createWorkOrder);
router.post("/work-orders/:id/release", authorizePermissions(PERMISSIONS.WORK_ORDER_MANAGE), MfgController.releaseWorkOrder);
router.post("/work-orders/:id/operations/:seq/progress", authorizePermissions(PERMISSIONS.WORK_ORDER_EXECUTE), MfgController.recordOperation);

// MRP / Planner Workbench
router.get("/planner", authorizePermissions(PERMISSIONS.PLANNER_VIEW), MfgController.runMrp);
router.post("/planner/run", authorizePermissions(PERMISSIONS.PLANNER_MANAGE), MfgController.runMrp);
router.post("/planner/:id/firm", authorizePermissions(PERMISSIONS.PLANNER_MANAGE), MfgController.firmPlan);

export default router;

