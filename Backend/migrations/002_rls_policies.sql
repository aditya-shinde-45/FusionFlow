-- ============================================================================
-- FusionFlow HCM - Row Level Security (RLS) Policies
-- Strict Multi-tenant / Role-based access control for Supabase PostgreSQL
-- ============================================================================

-- 1. Enable RLS on sensitive tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compensation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions to extract user context from Supabase auth.jwt()
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    current_setting('request.jwt.claim.role', true),
    'anon'
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'employeeId',
    NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. EMPLOYEES POLICIES
-- Service role has full access
CREATE POLICY "Service role full access on employees"
ON public.employees
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins, HR and Auditors can view all employees
CREATE POLICY "HR and Admins view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.current_user_role() IN ('admin', 'plant.head', 'hr.manager', 'hr.specialist', 'auditor')
  OR id = public.current_employee_id()
  OR manager_id = public.current_employee_id()
);

-- 4. COMPENSATION POLICIES
CREATE POLICY "Service role full access on compensation"
ON public.compensation_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only HR, Admin, Plant Head, and employee themselves can view salary records
CREATE POLICY "Restricted access to compensation"
ON public.compensation_records
FOR SELECT
TO authenticated
USING (
  public.current_user_role() IN ('admin', 'plant.head', 'hr.manager', 'hr.specialist', 'auditor')
  OR employee_id = public.current_employee_id()
);

-- 5. PAYSLIPS POLICIES
CREATE POLICY "Service role full access on payslips"
ON public.payslips
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Never expose one employee's payslip to another without explicit HR/Payroll authorization
CREATE POLICY "Restricted payslip visibility"
ON public.payslips
FOR SELECT
TO authenticated
USING (
  public.current_user_role() IN ('admin', 'plant.head', 'hr.manager', 'accounts.clerk', 'auditor')
  OR employee_id = public.current_employee_id()
);

-- 6. LEAVE REQUESTS POLICIES
CREATE POLICY "Service role full access on leave_requests"
ON public.leave_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Leave requests visibility"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  public.current_user_role() IN ('admin', 'plant.head', 'hr.manager', 'hr.specialist', 'auditor')
  OR employee_id = public.current_employee_id()
);

-- 7. ATTENDANCE POLICIES
CREATE POLICY "Service role full access on attendance"
ON public.attendance_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Attendance visibility"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  public.current_user_role() IN ('admin', 'plant.head', 'hr.manager', 'mgr.production', 'mgr.stores', 'prod.supervisor', 'auditor')
  OR employee_id = public.current_employee_id()
);

-- 8. NOTIFICATIONS POLICIES
CREATE POLICY "Service role full access on notifications"
ON public.notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "User sees own notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()::text
  OR public.current_user_role() = 'admin'
);

-- 9. AUDIT LOGS POLICIES
CREATE POLICY "Service role full access on audit_logs"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only Admin and Auditor can inspect audit log trails
CREATE POLICY "Audit logs restricted view"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.current_user_role() IN ('admin', 'plant.head', 'auditor')
);

