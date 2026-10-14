import { Router } from "express";
import authRoutes from "./authRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import recruitmentRoutes from "./recruitmentRoutes.js";
import onboardingRoutes from "./onboardingRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import talentRoutes from "./talentRoutes.js";
import compensationRoutes from "./compensationRoutes.js";
import payrollRoutes from "./payrollRoutes.js";
import approvalRoutes from "./approvalRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import reportRoutes from "./reportRoutes.js";
import adminRoutes from "./adminRoutes.js";
import supplierRoutes from "./supplierRoutes.js";
import { requisitionRouter, poRouter } from "./procurementRoutes.js";
import receivingRoutes from "./receivingRoutes.js";
import payablesRoutes from "./payablesRoutes.js";
import { itemRouter, inventoryRouter } from "./inventoryRoutes.js";
import mfgRoutes from "./mfgRoutes.js";
import {
  customerRouter,
  priceListRouter,
  orderRouter,
  shippingRouter,
  arRouter,
} from "./orderRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/employees", employeeRoutes);
apiRouter.use("/org", organizationRoutes);
// Shortcuts for departments, jobs, positions
apiRouter.use("/", organizationRoutes);
apiRouter.use("/recruitment", recruitmentRoutes);
apiRouter.use("/candidates", recruitmentRoutes);
apiRouter.use("/onboarding", onboardingRoutes);
apiRouter.use("/attendance", attendanceRoutes);
apiRouter.use("/leaves", leaveRoutes);
apiRouter.use("/talent", talentRoutes);
apiRouter.use("/performance", talentRoutes);
apiRouter.use("/learning", talentRoutes);
apiRouter.use("/compensation", compensationRoutes);
apiRouter.use("/payroll", payrollRoutes);
apiRouter.use("/payslips", payrollRoutes);
apiRouter.use("/approvals", approvalRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/reports", reportRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/audit", adminRoutes);

// Procure-to-Pay (P2P) Routes
apiRouter.use("/suppliers", supplierRoutes);
apiRouter.use("/requisitions", requisitionRouter);
apiRouter.use("/po", poRouter);
apiRouter.use("/receiving", receivingRoutes);
apiRouter.use("/ap", payablesRoutes);

// Plan-to-Produce (Manufacturing & Inventory)
apiRouter.use("/items", itemRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/mfg", mfgRoutes);

// Order-to-Cash (O2C - Sales, Shipping, Receivables)
apiRouter.use("/customers", customerRouter);
apiRouter.use("/price-lists", priceListRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/shipping", shippingRouter);
apiRouter.use("/ar", arRouter);

export default apiRouter;


