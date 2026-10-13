# FusionFlow Enterprise H2R Backend — Oracle Fusion Cloud HCM–Inspired Architecture

A production-ready, enterprise-grade **Hire-to-Retire (H2R)** backend built with Node.js, Express, and PostgreSQL/Supabase, following the architectural and workflow patterns of **Oracle Fusion Cloud HCM**.

Designed for **Sahyadri Auto Components Pvt Ltd** (Pune Manufacturing Plant), supporting role-based access control across 14 enterprise roles, decimal-safe statutory payroll calculations, multi-stage approval workflows, and complete employee lifecycle management.

---

## 1. Architecture Overview

- **Runtime**: Node.js v20+ (ES Modules)
- **Framework**: Express.js 4.x
- **Database Architecture**:
  - Official Supabase client (`@supabase/supabase-js`)
  - Full PostgreSQL DDL migrations (`migrations/001_initial_h2r_schema.sql` & `migrations/002_rls_policies.sql`)
  - ACID-compliant transactional persistence engine pre-seeded with Sahyadri Auto enterprise records
- **Security & RBAC**:
  - Helmet security headers
  - Rate limiting on global APIs and strict brute-force limits on `/auth/login`
  - JWT token verification with role and employee context
  - Fine-grained permission checks and hierarchical permission inheritance
  - Immutable audit trail logging on all state-altering endpoints
- **Financial Precision**:
  - BigInt / Paise integer arithmetic (`src/utils/currency.js`) ensuring zero IEEE 754 floating-point inaccuracies
  - Indian statutory compliance (EPF 12%, ESI 0.75%, Maharashtra Professional Tax, TDS projection, Loss of Pay deduction, Factories Act double-rate overtime)
- **API Documentation**: OpenAPI 3.0 / Swagger interactive UI at `/api/docs`

---

## 2. Modules & Capabilities

| Module | Core Endpoints | Business Logic & Workflow Integration |
|---|---|---|
| **Core HR & Lifecycle** | `/api/v1/employees` | Employee creation, profile management, auto-generated `EMP-xxxx` numbers, employment actions (Promote, Transfer, Change Manager, Terminate), org hierarchy tree. |
| **Organization Structure** | `/api/v1/org/departments`, `/jobs`, `/positions`, `/locations` | Business units, department heads, headcount planning, positions with incumbent assignments, grade structures. |
| **Recruitment & Onboarding** | `/api/v1/recruitment`, `/candidates`, `/onboarding` | Job requisitions with approval routing, candidate stage tracking, interview feedback scoring, offer generation & acceptance, duplicate-preventing conversion to employee, onboarding task checklists. |
| **Time & Attendance** | `/api/v1/attendance` | Shift tracking (Morning, Afternoon, Night, General), clock-in/out, late detection, overtime hours calculation (>8 hrs), attendance corrections, monthly summaries. |
| **Leave & Absence** | `/api/v1/leaves` | Paid & unpaid policies (CL, SL, PL, LOP), balance accruals, overlapping leave prevention, balance deduction to pending, cancellation with balance restoration, payroll LOP integration. |
| **Talent & Performance** | `/api/v1/talent`, `/performance`, `/learning` | FY review cycles, goals/OKRs with progress weights, self-assessment, manager assessment & rating, training course catalog, enrollments, certifications with expiration tracking. |
| **Compensation & Benefits** | `/api/v1/compensation` | Salary structures (Basic, HRA, Special Allowance), salary revisions with effective dates, executive approval workflows. |
| **Payroll Management** | `/api/v1/payroll`, `/payslips` | Multi-step calculation engine, India statutory rules (PF, ESI, PTax, TDS), unpaid absence (LOP) deductions, overtime additions, executive review, idempotent finalization & locking, payslip publishing, NEFT bank batch export. |
| **Workflow & Approvals** | `/api/v1/approvals` | Universal approval engine for requisitions, promotions, leaves, attendance corrections, overtime, salary revisions, and payroll runs; multi-level approval history, mandatory rejection reasons. |
| **Notifications** | `/api/v1/notifications` | In-app user notifications for workflow approvals, payslip publishing, interview scheduling, and task assignments. |
| **Reporting & Analytics** | `/api/v1/reports` | Real-time headcount distributions by department/grade/gender, recruitment funnel, leave utilization, plant attendance punch summaries, payroll cost by department. |
| **System Admin & Audit** | `/api/v1/admin`, `/api/v1/audit` | 14 system accounts management, role permission matrix, tamper-evident audit logs. |

---

## 3. End-to-End Business Processes (Oracle Fusion Equivalents)

### Workflow A: Hire to Onboard
1. Requisition created (`REQ-2026-xxxx`) and routes to HR Manager / Plant Head.
2. Candidate applies (`CAND-2026-xxxx`), interview scheduled and scored.
3. Offer generated (`OFFER-2026-xxxx`) and accepted.
4. Candidate converted to employee via `POST /recruitment/candidates/:id/convert-to-employee`:
   - System checks candidate is not already converted.
   - Generates unique `EMP-xxxx` identifier.
   - Creates employee profile and initial employment history.
   - Instantiates default leave balances (CL, SL, PL, LOP).
   - Generates 4 onboarding compliance checklists.
   - Creates effective compensation record based on offer terms.

### Workflow B: Employee Work to Payroll
1. Attendance captures clock-in and clock-out with shift assignment.
2. Approved overtime hours and approved unpaid absence (LOP days) are imported.
3. Payroll run executed via `POST /payroll/runs/calculate`:
   - Decimal-safe Basic, HRA, and Special Allowance.
   - Overtime earnings computed at double rate under Factories Act.
   - LOP deduction computed as `(Basic / DaysInMonth) * LOPDays`.
   - EPF computed at 12% of basic.
   - ESI computed at 0.75% of gross if gross <= ₹21,000.
   - Maharashtra Professional Tax applied per statutory slabs (₹200/month).
   - Progressive TDS computed.
   - Net salary computed: `Gross - TotalDeductions`.
4. Submitted for Plant Head review via `POST /payroll/runs/:id/submit`.
5. Approved by Plant Head via `POST /payroll/runs/:id/approve`.
6. Finalized and locked via `POST /payroll/runs/:id/finalize`:
   - Idempotent: once finalized, recalculations are blocked.
   - Payslips published to employees.
   - Automated notification dispatched to each employee.
   - Bank payment instruction batch (NEFT) generated for finance.

### Workflow C: Leave to Attendance to Payroll Reconciliation
1. Employee applies for leave (`POST /leaves/requests`).
2. Overlap validation verifies employee has no existing approved/pending leave for the date range.
3. Balance check ensures sufficient quota. Days deducted to `pending`.
4. Manager approves in Worklist. Days move to `used`.
5. If leave is unpaid (`LOP`), payroll calculation automatically docks pay and adjusts worked days.

---

## 4. Role & Permission Matrix (14 Enterprise Roles)

| Role | Oracle Fusion Equivalent | Key Responsibilities & Scopes |
|---|---|---|
| `admin` | Application Implementation Consultant | Unrestricted superuser access to all modules, users, and audit logs. |
| `plant.head` | Enterprise Executive / General Manager | Approves requisitions, salary revisions, promotions, and payroll runs; finalizes payroll. |
| `hr.manager` | Human Resources Business Partner | Manages core HR, initiates employment actions, creates job requisitions, runs payroll calculations, approves leaves. |
| `hr.specialist` | Human Resources Specialist | Employee data administration, candidate screening, onboarding task verification, leave balance administration. |
| `mgr.production` | Line Manager (Production) | Approves shift swaps, overtime requests, attendance corrections, and leave requests for production subordinates. |
| `mgr.stores` | Line Manager (Stores & Purchase) | Approves team leaves, reviews material requisitions, manages stores staff. |
| `prod.supervisor` | Shop Floor Supervisor | Records shift attendance, monitors daily operations, submits overtime requests. |
| `emp.production` | Employee Self-Service (ESS) | Clock-in/out, views own schedule, applies for leave, views own payslips and goals. |
| `emp.quality` | Employee Self-Service (ESS) | Quality team operations, attendance logging, leave applications. |
| `buyer` | Procurement Specialist | Manages requisitions, supplier interfaces, and operational tasks. |
| `stores.controller` | Inventory & Receiving Specialist | Material receipts, stock movements, and shipping coordination. |
| `accounts.clerk` | Payroll & Payables Specialist | Views payroll reports, reviews payslip distributions, assists payroll processing. |
| `sales.ops` | Order Management Specialist | Sales order coordination, customer interfaces. |
| `auditor` | Internal Auditor / Compliance Officer | Read-only inspection across core HR, audit logs, payroll summaries, and approval histories. |

---

## 5. Setup & Running Instructions

### Prerequisites
- Node.js v20+ and npm v10+

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
USE_SUPABASE=false # Set to true to query Supabase directly
```

### Running Backend Tests
Execute the automated test suite (49 unit and integration tests across 8 suites):
```bash
npm test
# Or from root workspace:
npm run backend:test
```

### Starting Backend Server
```bash
npm start
# Or for live file watching:
npm run dev
# Or from root workspace:
npm run backend
```
The server will start at `http://localhost:5000`.
- Health Check: `http://localhost:5000/health`
- Swagger Documentation: `http://localhost:5000/api/docs`

### Applying Supabase Migrations
In the Supabase Dashboard SQL Editor, run:
1. `migrations/001_initial_h2r_schema.sql` (Creates all tables, constraints, foreign keys, and indexes)
2. `migrations/002_rls_policies.sql` (Enforces Row Level Security policies)

---

## 6. Frontend Integration
The React + Vite frontend (`src/`) connects to this backend via:
- `src/api/client.ts`: Centralized, typed API client with automatic Bearer token injection and error handling.
- `vite.config.ts`: Proxy configuration forwarding `/api` to `http://localhost:5000`.
- All demo accounts use password `Demo@123`.

