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

export default apiRouter;

