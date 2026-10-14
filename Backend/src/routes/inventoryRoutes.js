import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { PERMISSIONS } from "../constants/roles.js";

export const itemRouter = Router();
itemRouter.use(authenticate);

itemRouter.get("/", authorizePermissions(PERMISSIONS.ITEM_VIEW), InventoryController.listItems);
itemRouter.get("/:id", authorizePermissions(PERMISSIONS.ITEM_VIEW), InventoryController.getItem);
itemRouter.post("/", authorizePermissions(PERMISSIONS.ITEM_MANAGE), InventoryController.createItem);

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

inventoryRouter.get("/onhand", authorizePermissions(PERMISSIONS.INVENTORY_VIEW), InventoryController.getOnhand);
inventoryRouter.get("/subinventories", authorizePermissions(PERMISSIONS.INVENTORY_VIEW), InventoryController.getSubinventories);
inventoryRouter.get("/transactions", authorizePermissions(PERMISSIONS.INVENTORY_VIEW), InventoryController.getTransactions);
inventoryRouter.post("/transfers", authorizePermissions(PERMISSIONS.INVENTORY_MANAGE), InventoryController.transfer);
inventoryRouter.post("/miscellaneous", authorizePermissions(PERMISSIONS.INVENTORY_MANAGE), InventoryController.miscellaneous);
inventoryRouter.get("/cycle-counts", authorizePermissions(PERMISSIONS.INVENTORY_VIEW), InventoryController.getCycleCounts);
inventoryRouter.get("/material-issues", authorizePermissions(PERMISSIONS.INVENTORY_VIEW), InventoryController.getMaterialIssues);
inventoryRouter.post("/material-issues/issue", authorizePermissions(PERMISSIONS.INVENTORY_MANAGE), InventoryController.issueMaterial);

