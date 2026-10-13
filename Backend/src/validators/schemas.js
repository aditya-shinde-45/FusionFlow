import { z } from "zod";

// Auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Employee
export const employeeCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  workEmail: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  hireDate: z.string().optional(),
  department: z.string().optional(),
  departmentId: z.string().optional(),
  job: z.string().optional(),
  grade: z.string().optional(),
  managerId: z.string().nullable().optional(),
  managerName: z.string().optional(),
  location: z.string().optional(),
  pan: z.string().optional(),
  bankAccount: z.string().optional(),
});

export const employeeUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  bankIfsc: z.string().optional(),
});

export const employmentActionSchema = z.object({
  action: z.enum(["PROMOTE", "TRANSFER", "CHANGE_MANAGER", "TERMINATE", "SEPARATION", "SUSPEND", "REHIRE"]),
  effectiveDate: z.string().optional(),
  reason: z.string().optional(),
  proposedGrade: z.string().optional(),
  proposedManager: z.string().optional(),
  proposedDepartment: z.string().optional(),
  comments: z.string().optional(),
});

// Organization
export const departmentCreateSchema = z.object({
  code: z.string().min(2, "Department code required"),
  name: z.string().min(2, "Department name required"),
  headId: z.string().optional(),
  headName: z.string().optional(),
  businessUnit: z.string().optional(),
});

export const jobCreateSchema = z.object({
  code: z.string().min(2, "Job code required"),
  title: z.string().min(2, "Job title required"),
  grade: z.string().min(1, "Grade required"),
  departmentId: z.string().optional(),
});

export const positionCreateSchema = z.object({
  code: z.string().min(2, "Position code required"),
  title: z.string().min(2, "Position title required"),
  jobId: z.string().min(1, "Job id required"),
  departmentId: z.string().min(1, "Department id required"),
  headcount: z.number().int().positive().optional(),
});

// Recruitment
export const requisitionCreateSchema = z.object({
  title: z.string().min(3, "Title required"),
  departmentId: z.string().min(1, "Department required"),
  department: z.string().optional(),
  jobId: z.string().optional(),
  openings: z.number().int().positive().default(1),
  hiringManagerId: z.string().optional(),
  hiringManager: z.string().optional(),
  minExpYears: z.number().nonnegative().optional(),
  salaryRangeMin: z.number().positive().optional(),
  salaryRangeMax: z.number().positive().optional(),
  description: z.string().optional(),
});

export const candidateRegisterSchema = z.object({
  requisitionId: z.string().min(1, "Requisition required"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(5, "Phone required"),
  skills: z.array(z.string()).optional(),
});

export const interviewScheduleSchema = z.object({
  interviewerId: z.string().min(1, "Interviewer required"),
  interviewerName: z.string().optional(),
  scheduledAt: z.string().min(1, "Schedule date/time required"),
});

export const interviewFeedbackSchema = z.object({
  score: z.number().min(1).max(5),
  feedback: z.string().min(1, "Feedback comments required"),
  recommendation: z.enum(["Hire", "Reject", "Hold"]),
});

export const offerCreateSchema = z.object({
  jobTitle: z.string().min(1, "Job title required"),
  grade: z.string().optional(),
  proposedSalary: z.number().positive("Proposed salary must be positive"),
  joiningDate: z.string().min(1, "Joining date required"),
});

// Attendance & Leave
export const attendanceClockSchema = z.object({
  employeeId: z.string().optional(),
  shiftId: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
});

export const attendanceCorrectionSchema = z.object({
  employeeId: z.string().optional(),
  date: z.string().min(1, "Date required"),
  requestedCheckIn: z.string().min(1, "Check-in time required"),
  requestedCheckOut: z.string().min(1, "Check-out time required"),
  reason: z.string().min(1, "Reason required"),
});

export const overtimeRequestSchema = z.object({
  employeeId: z.string().optional(),
  date: z.string().min(1, "Date required"),
  hours: z.number().positive("Hours must be positive"),
  reason: z.string().min(1, "Reason required"),
});

export const leaveApplySchema = z.object({
  employeeId: z.string().optional(),
  leaveTypeCode: z.string().min(1, "Leave type code required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  reason: z.string().optional(),
});

// Talent
export const goalCreateSchema = z.object({
  employeeId: z.string().optional(),
  cycleId: z.string().optional(),
  title: z.string().min(3, "Goal title required"),
  category: z.string().optional(),
  weight: z.number().positive().max(100).optional(),
  progress: z.number().min(0).max(100).optional(),
  targetDate: z.string().optional(),
});

export const reviewSelfSchema = z.object({
  selfRating: z.number().min(1).max(5),
  selfComments: z.string().min(1, "Self comments required"),
});

export const reviewManagerSchema = z.object({
  managerRating: z.number().min(1).max(5),
  managerComments: z.string().min(1, "Manager comments required"),
  recommendation: z.string().optional(),
});

// Compensation & Payroll
export const salaryRevisionSchema = z.object({
  employeeId: z.string().min(1, "Employee required"),
  effectiveDate: z.string().min(1, "Effective date required"),
  proposedBasic: z.number().positive(),
  proposedHra: z.number().nonnegative(),
  proposedSpecial: z.number().nonnegative(),
  reason: z.string().optional(),
});

export const payrollPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12),
  daysInMonth: z.number().int().min(28).max(31).optional(),
});

export const payrollCalculateSchema = z.object({
  periodCode: z.string().min(6, "Period code (e.g. 2026-10) required"),
  payGroup: z.string().optional(),
});

// Approvals
export const approvalActSchema = z.object({
  action: z.enum(["Approved", "Rejected", "Information requested", "Reassigned"]),
  comment: z.string().optional(),
  reassignedToRole: z.string().optional(),
  requestedInfoMessage: z.string().optional(),
});
