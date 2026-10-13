-- ============================================================================
-- FusionFlow HCM - Hire-to-Retire (H2R) Enterprise Database Schema
-- Inspired by Oracle Fusion Cloud HCM Architecture
-- Compatible with PostgreSQL 15+ / Supabase PostgreSQL
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SYSTEM SECURITY & USERS
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    reports_to VARCHAR(100) DEFAULT 'None',
    initials VARCHAR(10),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id VARCHAR(100) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id VARCHAR(50) REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. ENTERPRISE STRUCTURE (BUSINESS UNITS, DEPARTMENTS, LOCATIONS)
CREATE TABLE IF NOT EXISTS public.business_units (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_employer VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    head_id VARCHAR(64),
    head_name VARCHAR(255),
    business_unit VARCHAR(255) DEFAULT 'Pune Manufacturing',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    department_id VARCHAR(64) REFERENCES public.departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.positions (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    job_id VARCHAR(64) REFERENCES public.jobs(id),
    department_id VARCHAR(64) REFERENCES public.departments(id),
    headcount INT DEFAULT 1,
    current_employee_id VARCHAR(64),
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CORE HR & EMPLOYEE LIFECYCLE
CREATE TABLE IF NOT EXISTS public.employees (
    id VARCHAR(64) PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    work_email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    gender VARCHAR(20),
    dob DATE,
    hire_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    worker_type VARCHAR(50) DEFAULT 'Permanent',
    department VARCHAR(100) NOT NULL,
    department_id VARCHAR(64) REFERENCES public.departments(id),
    job VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    manager_id VARCHAR(64),
    manager_name VARCHAR(200),
    location VARCHAR(200) DEFAULT 'Pune Manufacturing Plant',
    business_unit VARCHAR(200) DEFAULT 'Pune Manufacturing',
    legal_employer VARCHAR(255) DEFAULT 'Sahyadri Auto Components Pvt Ltd',
    pan VARCHAR(20),
    uan VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(50),
    user_id VARCHAR(64) REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employment_history (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    event VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    grade VARCHAR(20),
    previous_grade VARCHAR(20),
    department VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RECRUITMENT & ONBOARDING
CREATE TABLE IF NOT EXISTS public.job_requisitions (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    department_id VARCHAR(64) REFERENCES public.departments(id),
    department VARCHAR(100) NOT NULL,
    job_id VARCHAR(64) REFERENCES public.jobs(id),
    openings INT DEFAULT 1,
    hiring_manager_id VARCHAR(64),
    hiring_manager VARCHAR(200),
    status VARCHAR(50) DEFAULT 'Draft',
    min_exp_years NUMERIC(4,1) DEFAULT 1,
    salary_range_min NUMERIC(12,2),
    salary_range_max NUMERIC(12,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidates (
    id VARCHAR(64) PRIMARY KEY,
    requisition_id VARCHAR(64) REFERENCES public.job_requisitions(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    current_stage VARCHAR(50) DEFAULT 'Applied',
    status VARCHAR(50) DEFAULT 'In progress',
    rating NUMERIC(3,2) DEFAULT 0,
    skills TEXT[],
    applied_date DATE DEFAULT CURRENT_DATE,
    converted_employee_id VARCHAR(64) REFERENCES public.employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interviews (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) REFERENCES public.candidates(id) ON DELETE CASCADE,
    interviewer_id VARCHAR(64),
    interviewer_name VARCHAR(200),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    score INT,
    feedback TEXT,
    recommendation VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_offers (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) REFERENCES public.candidates(id) ON DELETE CASCADE,
    requisition_id VARCHAR(64) REFERENCES public.job_requisitions(id),
    job_title VARCHAR(255) NOT NULL,
    grade VARCHAR(20) DEFAULT 'G2',
    proposed_salary NUMERIC(12,2) NOT NULL,
    joining_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Issued',
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    required BOOLEAN DEFAULT TRUE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    verified_by VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORK SCHEDULES & ATTENDANCE
CREATE TABLE IF NOT EXISTS public.shifts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    break_duration_minutes INT DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_id VARCHAR(64) REFERENCES public.shifts(id),
    check_in VARCHAR(10),
    check_out VARCHAR(10),
    hours_worked NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Present',
    is_late BOOLEAN DEFAULT FALSE,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_emp_date UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS public.overtime_requests (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending approval',
    approved_by VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEAVE AND ABSENCE
CREATE TABLE IF NOT EXISTS public.leave_types (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    annual_quota INT DEFAULT 12,
    paid BOOLEAN DEFAULT TRUE,
    carry_forward BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type_code VARCHAR(20) REFERENCES public.leave_types(code),
    allocated INT NOT NULL,
    used INT DEFAULT 0,
    pending INT DEFAULT 0,
    balance INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_emp_leave_type UNIQUE(employee_id, leave_type_code)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(200) NOT NULL,
    leave_type_code VARCHAR(20) REFERENCES public.leave_types(code),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending approval',
    approved_by VARCHAR(200),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TALENT & PERFORMANCE MANAGEMENT
CREATE TABLE IF NOT EXISTS public.performance_cycles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.performance_goals (
    id VARCHAR(64) PRIMARY KEY,
    cycle_id VARCHAR(64) REFERENCES public.performance_cycles(id),
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    weight INT DEFAULT 20,
    progress INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'In progress',
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id VARCHAR(64) PRIMARY KEY,
    cycle_id VARCHAR(64) REFERENCES public.performance_cycles(id),
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    manager_id VARCHAR(64) REFERENCES public.employees(id),
    self_rating NUMERIC(3,2),
    self_comments TEXT,
    manager_rating NUMERIC(3,2),
    manager_comments TEXT,
    recommendation VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Draft',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_hours INT DEFAULT 8,
    category VARCHAR(100) DEFAULT 'Technical',
    mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) REFERENCES public.courses(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    enrolled_at DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'In progress',
    progress INT DEFAULT 0,
    score INT,
    completed_at DATE,
    certification_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMPENSATION & BENEFITS
CREATE TABLE IF NOT EXISTS public.compensation_records (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    basic_salary NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) NOT NULL,
    special_allowance NUMERIC(12,2) NOT NULL,
    gross_salary NUMERIC(12,2) NOT NULL,
    pf_eligible BOOLEAN DEFAULT TRUE,
    esi_eligible BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'Active',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYROLL MANAGEMENT
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    days_in_month INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    period_id VARCHAR(64) REFERENCES public.payroll_periods(id),
    period_code VARCHAR(50) NOT NULL,
    pay_group VARCHAR(100) NOT NULL,
    eligible_employees_count INT DEFAULT 0,
    total_gross NUMERIC(14,2) DEFAULT 0.00,
    total_deductions NUMERIC(14,2) DEFAULT 0.00,
    total_net NUMERIC(14,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft',
    locked BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMPTZ,
    submitted_by VARCHAR(200),
    submitted_at TIMESTAMPTZ,
    approved_by VARCHAR(200),
    approved_at TIMESTAMPTZ,
    finalized_by VARCHAR(200),
    finalized_at TIMESTAMPTZ,
    bank_instruction_exported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
    id VARCHAR(64) PRIMARY KEY,
    payroll_run_id VARCHAR(64) REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id VARCHAR(64) REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_number VARCHAR(50) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    period_code VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    pan VARCHAR(20),
    uan VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    worked_days INT NOT NULL,
    lop_days INT DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    basic NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) NOT NULL,
    special_allowance NUMERIC(12,2) NOT NULL,
    overtime NUMERIC(12,2) DEFAULT 0,
    lop_deduction NUMERIC(12,2) DEFAULT 0,
    gross_earnings NUMERIC(12,2) NOT NULL,
    provident_fund NUMERIC(12,2) DEFAULT 0,
    esi NUMERIC(12,2) DEFAULT 0,
    professional_tax NUMERIC(12,2) DEFAULT 0,
    income_tax_tds NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL,
    net_payable NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    payment_method VARCHAR(50) DEFAULT 'NEFT',
    payment_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WORKFLOW APPROVAL ENGINE
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount_formatted VARCHAR(100),
    amount NUMERIC(14,2) DEFAULT 0,
    requester_name VARCHAR(200) NOT NULL,
    requester_id VARCHAR(64),
    department VARCHAR(100),
    stage VARCHAR(100) DEFAULT 'Level 1 of 1',
    assigned_to_role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending approval',
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.approval_rules (
    id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    threshold_amount NUMERIC(14,2),
    approver_role VARCHAR(50) NOT NULL,
    level INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS & AUDIT TRAILS
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    unread BOOLEAN DEFAULT TRUE,
    link VARCHAR(255) DEFAULT '/home',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(64),
    user_name VARCHAR(200),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(64),
    details TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50)
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_employees_dept ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leaves_emp_status ON public.leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON public.payslips(period_code);
CREATE INDEX IF NOT EXISTS idx_payslips_emp ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_approvals_role_status ON public.approval_requests(assigned_to_role, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, unread);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);

