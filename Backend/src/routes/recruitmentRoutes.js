import { Router } from "express";
import { RecruitmentController } from "../controllers/recruitmentController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import {
  requisitionCreateSchema,
  candidateRegisterSchema,
  interviewScheduleSchema,
  interviewFeedbackSchema,
  offerCreateSchema,
} from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

// Requisitions
router.get("/requisitions", authorizePermissions(PERMISSIONS.RECRUITMENT_VIEW), RecruitmentController.listRequisitions);
router.get("/requisitions/:id", authorizePermissions(PERMISSIONS.RECRUITMENT_VIEW), RecruitmentController.getRequisitionById);
router.post(
  "/requisitions",
  authorizePermissions(PERMISSIONS.RECRUITMENT_MANAGE),
  validate(requisitionCreateSchema),
  logAuditEvent("CREATE_REQUISITION", "REQUISITION", (req, data) => ({ entityId: data.data?.id, details: `Created requisition ${data.data?.title}` })),
  RecruitmentController.createRequisition
);

// Candidates
router.get("/candidates", authorizePermissions(PERMISSIONS.RECRUITMENT_VIEW), RecruitmentController.listCandidates);
router.get("/candidates/:id", authorizePermissions(PERMISSIONS.RECRUITMENT_VIEW), RecruitmentController.getCandidateById);
router.post(
  "/candidates",
  authorizePermissions(PERMISSIONS.RECRUITMENT_MANAGE),
  validate(candidateRegisterSchema),
  RecruitmentController.registerCandidate
);

// Interviews
router.post(
  "/candidates/:id/interviews",
  authorizePermissions(PERMISSIONS.RECRUITMENT_MANAGE),
  validate(interviewScheduleSchema),
  RecruitmentController.scheduleInterview
);
router.post(
  "/interviews/:id/feedback",
  authorizePermissions(PERMISSIONS.RECRUITMENT_MANAGE),
  validate(interviewFeedbackSchema),
  RecruitmentController.submitFeedback
);

// Offers
router.post(
  "/candidates/:id/offers",
  authorizePermissions(PERMISSIONS.RECRUITMENT_MANAGE),
  validate(offerCreateSchema),
  logAuditEvent("CREATE_OFFER", "JOB_OFFER", (req, data) => ({ entityId: data.data?.id, details: `Generated offer for candidate ${req.params.id}` })),
  RecruitmentController.createOffer
);
router.post("/offers/:id/respond", RecruitmentController.respondToOffer);

// Convert candidate to employee
router.post(
  "/candidates/:id/convert-to-employee",
  authorizePermissions(PERMISSIONS.RECRUITMENT_MANAGE),
  logAuditEvent("CONVERT_CANDIDATE", "CANDIDATE", (req, data) => ({ entityId: req.params.id, details: `Converted candidate ${req.params.id} to employee ${data.data?.id}` })),
  RecruitmentController.convertToEmployee
);

export default router;

