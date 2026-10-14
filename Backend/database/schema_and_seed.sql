-- ============================================================================
-- FUSIONFLOW ENTERPRISE ERP - COMPLETE DATABASE SCHEMA & SEED DATA FOR SUPABASE
-- Organization: Sahyadri Auto Components Pvt Ltd (Pune Manufacturing Plant)
-- Dialect: PostgreSQL (Supabase 15+)
-- Covers: System & Auth, Phase 1 (H2R), Phase 2 (P2P), Phase 3 (Plan-to-Produce), Phase 4 (Order-to-Cash)
-- ============================================================================

-- 0. EXTENSIONS & SCHEMAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop for idempotent reset (Optional: comment out if preserving data)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- ============================================================================
-- 1. SYSTEM, USERS & RBAC TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL REFERENCES public.roles(code) ON DELETE RESTRICT,
    reports_to VARCHAR(150) DEFAULT 'None',
    initials VARCHAR(10) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'aud-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(50),
    user_name VARCHAR(150),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'notif-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    user_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PHASE 1: HIRE-TO-RETIRE (HCM) TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    head_id VARCHAR(50),
    head_name VARCHAR(150),
    business_unit VARCHAR(100) DEFAULT 'Pune Manufacturing',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(50) DEFAULT 'Pune',
    state VARCHAR(50) DEFAULT 'Maharashtra',
    country VARCHAR(50) DEFAULT 'India',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    department_id VARCHAR(50) REFERENCES public.departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.positions (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    job_id VARCHAR(50) REFERENCES public.jobs(id),
    department_id VARCHAR(50) REFERENCES public.departments(id),
    headcount INT DEFAULT 1,
    current_employee_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Filled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
    id VARCHAR(50) PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    work_email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    gender VARCHAR(20),
    dob DATE,
    hire_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    worker_type VARCHAR(50) DEFAULT 'Permanent',
    department VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) REFERENCES public.departments(id),
    job VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    manager_id VARCHAR(50),
    manager_name VARCHAR(150),
    location VARCHAR(100) DEFAULT 'Pune Manufacturing Plant',
    business_unit VARCHAR(100) DEFAULT 'Pune Manufacturing',
    legal_employer VARCHAR(150) DEFAULT 'Sahyadri Auto Components Pvt Ltd',
    pan VARCHAR(20),
    uan VARCHAR(30),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(30),
    user_id VARCHAR(50) REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaves (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES public.employees(id),
    leave_type VARCHAR(50) NOT NULL, -- Annual, Casual, Sick, Maternity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected
    approved_by VARCHAR(50),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES public.employees(id),
    work_date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    hours_worked NUMERIC(5,2) DEFAULT 0,
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Present',
    shift VARCHAR(50) DEFAULT 'General 08:00-16:30',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id VARCHAR(50) PRIMARY KEY,
    period_code VARCHAR(20) UNIQUE NOT NULL, -- 2026-10
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Open', -- Open, Processing, Approved, Finalized
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    period_code VARCHAR(20) NOT NULL,
    run_date DATE NOT NULL,
    total_gross NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_net NUMERIC(15,2) NOT NULL DEFAULT 0,
    employee_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted, Approved, Finalized
    approved_by VARCHAR(50),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    payroll_run_id VARCHAR(50) REFERENCES public.payroll_runs(id),
    employee_id VARCHAR(50) REFERENCES public.employees(id),
    period VARCHAR(20) NOT NULL,
    basic NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) NOT NULL,
    special_allowance NUMERIC(12,2) NOT NULL,
    gross_earnings NUMERIC(12,2) NOT NULL,
    pf_employee NUMERIC(12,2) NOT NULL,
    esic_employee NUMERIC(12,2) NOT NULL,
    income_tax_tds NUMERIC(12,2) NOT NULL,
    professional_tax NUMERIC(12,2) NOT NULL,
    loss_of_pay_unpaid NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL,
    net_salary NUMERIC(12,2) NOT NULL,
    days_worked INT DEFAULT 26,
    unpaid_leave_days INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recruitment_requisitions (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    job_id VARCHAR(50),
    grade VARCHAR(10) NOT NULL,
    openings INT DEFAULT 1,
    hiring_manager VARCHAR(150) NOT NULL,
    salary_range_min NUMERIC(12,2),
    salary_range_max NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recruitment_candidates (
    id VARCHAR(50) PRIMARY KEY,
    requisition_id VARCHAR(50) REFERENCES public.recruitment_requisitions(id),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    stage VARCHAR(50) DEFAULT 'Applied', -- Applied, Screening, Interview, Offered, Hired
    status VARCHAR(50) DEFAULT 'Active',
    score INT DEFAULT 85,
    converted_employee_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PHASE 2: PROCURE-TO-PAY (P2P) TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(50) NOT NULL, -- GSTIN
    pan VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Direct Materials, Indirect, Logistics
    primary_site VARCHAR(50) DEFAULT 'PUNE-01',
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    msme_registered BOOLEAN DEFAULT FALSE,
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    bank_ifsc VARCHAR(30),
    rating NUMERIC(3,1) DEFAULT 4.5,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    requester_id VARCHAR(50),
    requester_name VARCHAR(150),
    total_amount NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending', -- Draft, Pending, Approved, Rejected, Fulfilled
    current_approver VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_requisition_lines (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'prl-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    requisition_id VARCHAR(50) REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_amount NUMERIC(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(50) REFERENCES public.suppliers(id),
    supplier_name VARCHAR(200) NOT NULL,
    requisition_id VARCHAR(50),
    buyer_name VARCHAR(150) NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    gst_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    status VARCHAR(50) DEFAULT 'Issued', -- Draft, Approved, Issued, Partially Received, Received, Closed
    approved_by VARCHAR(150),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'pol-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    po_id VARCHAR(50) REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ordered_qty NUMERIC(12,2) NOT NULL,
    received_qty NUMERIC(12,2) DEFAULT 0,
    uom VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_amount NUMERIC(15,2) NOT NULL,
    tolerance_percent NUMERIC(5,2) DEFAULT 5.0
);

CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- GRN-2026-XXXX
    po_id VARCHAR(50) REFERENCES public.purchase_orders(id),
    po_code VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) REFERENCES public.suppliers(id),
    supplier_name VARCHAR(200) NOT NULL,
    challan_number VARCHAR(100),
    receipt_date DATE NOT NULL,
    accepted_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    rejected_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    subinventory VARCHAR(50) DEFAULT 'RM-STORES',
    reject_subinventory VARCHAR(50) DEFAULT 'QUALITY-HOLD',
    received_by VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rtv_returns (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- RTV-2026-XXXX
    receipt_id VARCHAR(50) REFERENCES public.goods_receipts(id),
    receipt_code VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) REFERENCES public.suppliers(id),
    supplier_name VARCHAR(200) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    returned_qty NUMERIC(12,2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    debit_note_number VARCHAR(50) NOT NULL,
    debit_amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Dispatched',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ap_invoices (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- INV-XXXX
    supplier_invoice_num VARCHAR(100) NOT NULL,
    supplier_id VARCHAR(50) REFERENCES public.suppliers(id),
    supplier_name VARCHAR(200) NOT NULL,
    po_id VARCHAR(50),
    po_code VARCHAR(50),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    invoice_amount NUMERIC(15,2) NOT NULL,
    gst_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    status VARCHAR(50) DEFAULT 'Validated', -- Draft, Validated, On Hold, Approved, Paid
    match_status VARCHAR(50) DEFAULT 'Matched', -- Matched, Variance Hold
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ap_holds (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    invoice_id VARCHAR(50) REFERENCES public.ap_invoices(id),
    invoice_code VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    hold_type VARCHAR(100) NOT NULL, -- Quantity variance, Price variance, Quality hold
    reason TEXT NOT NULL,
    applied_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Release requested, Released
    requested_by VARCHAR(150),
    released_by VARCHAR(150),
    release_justification TEXT,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ap_payment_batches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- PAYBATCH-YYYY-MM-DD
    bank_account VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'NEFT',
    payment_date DATE NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    invoices_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Approved', -- Draft, Approved, Processed
    instructions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PHASE 3: PLAN-TO-PRODUCE (MANUFACTURING & INVENTORY) TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.items (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- Finished Goods, Subassembly, Raw Material, Packaging
    uom VARCHAR(20) NOT NULL DEFAULT 'EA',
    standard_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    list_price NUMERIC(12,2) DEFAULT 0,
    make_or_buy VARCHAR(20) NOT NULL DEFAULT 'Buy', -- Make, Buy
    lead_time_days INT DEFAULT 3,
    safety_stock INT DEFAULT 0,
    min_order_qty INT DEFAULT 1,
    reorder_point INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    preferred_supplier_id VARCHAR(50) REFERENCES public.suppliers(id),
    bom_id VARCHAR(50),
    routing_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subinventories (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    locator_control BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_onhand (
    id VARCHAR(50) PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    subinventory VARCHAR(50) NOT NULL REFERENCES public.subinventories(code),
    locator VARCHAR(50),
    onhand_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    reserved_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    available_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
    uom VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_positive_stock CHECK (onhand_qty >= 0 AND available_qty >= 0)
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id VARCHAR(50) PRIMARY KEY,
    txn_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL, -- PO_RECEIPT, SUBINVENTORY_TRANSFER, WIP_ISSUE, WIP_COMPLETION, MISC_ISSUE, MISC_RECEIPT
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    from_subinventory VARCHAR(50),
    to_subinventory VARCHAR(50),
    quantity NUMERIC(12,2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    reference VARCHAR(200),
    created_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.boms (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- BOM-FG-1001
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    revision VARCHAR(10) NOT NULL DEFAULT 'A',
    status VARCHAR(50) DEFAULT 'Active',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    yield_percent NUMERIC(5,2) DEFAULT 98.0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bom_components (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'bomc-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    bom_id VARCHAR(50) REFERENCES public.boms(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    quantity_per NUMERIC(10,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    scrap_percent NUMERIC(5,2) DEFAULT 0,
    operation_seq INT NOT NULL DEFAULT 10,
    is_critical BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.work_centers (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    capacity_hours_per_day NUMERIC(5,2) DEFAULT 16.0,
    labor_hourly_rate NUMERIC(10,2) DEFAULT 250.0,
    machine_hourly_rate NUMERIC(10,2) DEFAULT 450.0,
    efficiency INT DEFAULT 95,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.routings (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- ROUT-FG-1001
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    name VARCHAR(200) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.routing_operations (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'ro-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    routing_id VARCHAR(50) REFERENCES public.routings(id) ON DELETE CASCADE,
    seq INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    work_center VARCHAR(50) REFERENCES public.work_centers(code),
    setup_hours NUMERIC(6,2) DEFAULT 0.5,
    run_hours_per_unit NUMERIC(6,4) DEFAULT 0.05,
    auto_backflush BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.work_orders (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- WO-2026-XXXX
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    planned_qty NUMERIC(12,2) NOT NULL,
    completed_qty NUMERIC(12,2) DEFAULT 0,
    scrapped_qty NUMERIC(12,2) DEFAULT 0,
    uom VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Released', -- Draft, Released, In Progress, Completed, Closed
    routing_id VARCHAR(50),
    bom_id VARCHAR(50),
    current_op_seq INT DEFAULT 10,
    current_op_name VARCHAR(200),
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    assigned_line VARCHAR(100) DEFAULT 'Pune Brake Pad Line 1',
    supervisor VARCHAR(150) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Normal',
    completion_percent INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.work_order_operations (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'woop-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    work_order_id VARCHAR(50) REFERENCES public.work_orders(id) ON DELETE CASCADE,
    seq INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    work_center VARCHAR(50) REFERENCES public.work_centers(code),
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed
    planned_qty NUMERIC(12,2) NOT NULL,
    completed_qty NUMERIC(12,2) DEFAULT 0,
    scrapped_qty NUMERIC(12,2) DEFAULT 0,
    scrap_reason VARCHAR(200),
    operator VARCHAR(150),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.material_issues (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'mi-' || substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
    work_order_id VARCHAR(50) REFERENCES public.work_orders(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    required_qty NUMERIC(12,2) NOT NULL,
    issued_qty NUMERIC(12,2) DEFAULT 0,
    uom VARCHAR(20) NOT NULL,
    subinventory VARCHAR(50) REFERENCES public.subinventories(code),
    status VARCHAR(50) DEFAULT 'Pending' -- Pending, Partially Issued, Fully Issued
);

CREATE TABLE IF NOT EXISTS public.mrp_plans (
    id VARCHAR(50) PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL REFERENCES public.items(code),
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    gross_demand NUMERIC(12,2) NOT NULL,
    projected_onhand NUMERIC(12,2) NOT NULL,
    safety_stock NUMERIC(12,2) NOT NULL,
    net_shortage NUMERIC(12,2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    suggested_action VARCHAR(100) NOT NULL, -- CREATE_PURCHASE_REQUISITION, CREATE_WORK_ORDER
    suggested_qty NUMERIC(12,2) NOT NULL,
    suggested_date DATE NOT NULL,
    supplier_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'Recommended', -- Recommended, Firmed
    firmed_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. PHASE 4: ORDER-TO-CASH (O2C) SCHEMA
-- ============================================================================

-- Customers Master
CREATE TABLE IF NOT EXISTS public.customers (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(64),
    pan VARCHAR(32),
    category VARCHAR(64),
    primary_site VARCHAR(64),
    address TEXT,
    payment_terms VARCHAR(32) DEFAULT 'Net 30',
    credit_limit NUMERIC(15,2) DEFAULT 0.00,
    credit_used NUMERIC(15,2) DEFAULT 0.00,
    credit_hold BOOLEAN DEFAULT FALSE,
    contact_person VARCHAR(128),
    contact_email VARCHAR(128),
    contact_phone VARCHAR(32),
    status VARCHAR(32) DEFAULT 'Active',
    rating NUMERIC(3,1) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Lists
CREATE TABLE IF NOT EXISTS public.price_lists (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    effective_from DATE,
    effective_to DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price List Items
CREATE TABLE IF NOT EXISTS public.price_list_items (
    id VARCHAR(64) PRIMARY KEY,
    price_list_id VARCHAR(64) REFERENCES public.price_lists(id) ON DELETE CASCADE,
    item_code VARCHAR(64) REFERENCES public.items(code),
    item_name VARCHAR(255),
    uom VARCHAR(16) DEFAULT 'EA',
    list_price NUMERIC(15,2) NOT NULL,
    min_qty NUMERIC(10,2) DEFAULT 1
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES public.customers(id),
    customer_name VARCHAR(255),
    order_date DATE DEFAULT CURRENT_DATE,
    requested_ship_date DATE,
    price_list_code VARCHAR(64),
    ship_to_site VARCHAR(128),
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    gst_amount NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) DEFAULT 0.00,
    credit_check_status VARCHAR(32) DEFAULT 'Pending',
    status VARCHAR(32) DEFAULT 'Draft',
    payment_terms VARCHAR(32) DEFAULT 'Net 30',
    created_by VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Order Lines
CREATE TABLE IF NOT EXISTS public.sales_order_lines (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_code VARCHAR(64) REFERENCES public.items(code),
    description VARCHAR(255),
    ordered_qty NUMERIC(12,2) NOT NULL,
    shipped_qty NUMERIC(12,2) DEFAULT 0,
    uom VARCHAR(16) DEFAULT 'EA',
    unit_price NUMERIC(15,2) NOT NULL,
    line_amount NUMERIC(15,2) NOT NULL
);

-- Shipping Deliveries (Dispatch / Outbound Deliveries)
CREATE TABLE IF NOT EXISTS public.shipping_deliveries (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    so_code VARCHAR(64) REFERENCES public.sales_orders(code),
    customer_id VARCHAR(64) REFERENCES public.customers(id),
    customer_name VARCHAR(255),
    delivery_date DATE DEFAULT CURRENT_DATE,
    carrier_name VARCHAR(128),
    vehicle_number VARCHAR(64),
    eway_bill_number VARCHAR(64),
    lr_number VARCHAR(64),
    ship_to VARCHAR(128),
    items_count INT DEFAULT 1,
    total_qty NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(32) DEFAULT 'Shipped',
    shipped_by VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AR Invoices (Receivables Invoices)
CREATE TABLE IF NOT EXISTS public.ar_invoices (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    so_code VARCHAR(64),
    delivery_code VARCHAR(64),
    customer_id VARCHAR(64) REFERENCES public.customers(id),
    customer_name VARCHAR(255),
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    taxable_amount NUMERIC(15,2) DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    paid_amount NUMERIC(15,2) DEFAULT 0.00,
    balance_due NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(32) DEFAULT 'Open',
    payment_terms VARCHAR(32) DEFAULT 'Net 30',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AR Receipts (Customer Remittance & Payment Application)
CREATE TABLE IF NOT EXISTS public.ar_receipts (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES public.customers(id),
    customer_name VARCHAR(255),
    receipt_date DATE DEFAULT CURRENT_DATE,
    receipt_method VARCHAR(64) DEFAULT 'NEFT/RTGS',
    reference VARCHAR(128),
    receipt_amount NUMERIC(15,2) NOT NULL,
    applied_amount NUMERIC(15,2) DEFAULT 0.00,
    unapplied_amount NUMERIC(15,2) DEFAULT 0.00,
    bank_account VARCHAR(128),
    status VARCHAR(32) DEFAULT 'Applied',
    recorded_by VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_employees_number ON public.employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON public.ap_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_onhand_item ON public.inventory_onhand(item_code, subinventory);
CREATE INDEX IF NOT EXISTS idx_inventory_txns_item ON public.inventory_transactions(item_code);
CREATE INDEX IF NOT EXISTS idx_work_orders_item ON public.work_orders(item_code);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(code);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_shipping_deliveries_so ON public.shipping_deliveries(so_code);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_customer ON public.ar_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_status ON public.ar_invoices(status);
CREATE INDEX IF NOT EXISTS idx_ar_receipts_customer ON public.ar_receipts(customer_id);

-- ============================================================================
-- 7. SEED DATA (ENTERPRISE PUNE PLANT INITIAL DATASET)
-- ============================================================================

-- A. ROLES (14 Roles with RBAC Matrix)
INSERT INTO public.roles (code, name, description, permissions)
VALUES
('admin', 'System Admin', 'Full system superuser access', '["all"]'::jsonb),
('plant.head', 'Plant Head', 'VP Operations and Plant General Manager', '["employee:view_all","payroll:approve","po:approve","mfg:all"]'::jsonb),
('hr.manager', 'HR Manager', 'Head of Human Resources & Compensation', '["employee:manage","payroll:process","leave:approve"]'::jsonb),
('hr.specialist', 'HR Specialist', 'Talent Acquisition & Employee Records', '["recruitment:manage","onboarding:manage"]'::jsonb),
('mgr.production', 'Line Manager, Production', 'Production Operations & Shop Floor Lead', '["work_order:manage","bom:manage","routing:manage","planner:manage"]'::jsonb),
('mgr.stores', 'Line Manager, Stores and Purchase', 'Central Stores, Purchasing & Valuation', '["inventory:manage","po:manage","receiving:manage"]'::jsonb),
('prod.supervisor', 'Production Supervisor', 'Shop Floor Line Supervisor & Dispatch Lead', '["work_order:execute","attendance:approve"]'::jsonb),
('emp.production', 'Employee, Production', 'Shop Floor Line Technician / Machine Operator', '["work_order:execute","attendance:log"]'::jsonb),
('emp.quality', 'Employee, Quality', 'QA/QC Inspector & Material Verification', '["receiving:inspect","quality:hold"]'::jsonb),
('buyer', 'Buyer', 'Senior Procurement Specialist', '["po:create","supplier:manage","pr:read"]'::jsonb),
('stores.controller', 'Stores Controller', 'Receiving Dock & Material Issue Specialist', '["inventory:transfer","receiving:create"]'::jsonb),
('accounts.clerk', 'Accounts Clerk', 'Accounts Payable & Financial Matching Specialist', '["invoice:create","hold:release","payment:process"]'::jsonb),
('sales.ops', 'Sales Operations', 'Commercial Order Fulfillment Specialist', '["orders:manage","customers:manage"]'::jsonb),
('auditor', 'Auditor User', 'Statutory Compliance & Read-Only Auditor', '["audit:read","reports:read"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- B. USERS (Bcrypt Password: Demo@123)
-- Hash: $2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W
INSERT INTO public.users (id, username, name, email, password_hash, role, reports_to, initials)
VALUES
('usr-01', 'admin', 'Admin User', 'admin@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'admin', 'None', 'AU'),
('usr-02', 'plant.head', 'Suresh Rane', 'plant.head@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'plant.head', 'None', 'SR'),
('usr-03', 'hr.manager', 'Rohini Sawant', 'hr.manager@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'hr.manager', 'Suresh Rane', 'RS'),
('usr-04', 'hr.specialist', 'Meera Kulkarni', 'hr.specialist@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'hr.specialist', 'Rohini Sawant', 'MK'),
('usr-05', 'mgr.production', 'Anil Deshmukh', 'mgr.production@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'mgr.production', 'Suresh Rane', 'AD'),
('usr-06', 'mgr.stores', 'Kavita More', 'mgr.stores@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'mgr.stores', 'Suresh Rane', 'KM'),
('usr-07', 'emp.production', 'Rahul Patil', 'emp.production@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'emp.production', 'Anil Deshmukh', 'RP'),
('usr-08', 'prod.supervisor', 'Sanjay Bhosale', 'prod.supervisor@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'prod.supervisor', 'Anil Deshmukh', 'SB'),
('usr-09', 'emp.quality', 'Sneha Joshi', 'emp.quality@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'emp.quality', 'Kavita More', 'SJ'),
('usr-10', 'buyer', 'Vikram Jadhav', 'buyer@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'buyer', 'Kavita More', 'VJ'),
('usr-11', 'stores.controller', 'Pooja Nair', 'stores.controller@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'stores.controller', 'Kavita More', 'PN'),
('usr-12', 'accounts.clerk', 'Nitin Gaikwad', 'accounts.clerk@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'accounts.clerk', 'Kavita More', 'NG'),
('usr-13', 'sales.ops', 'Ritu Sharma', 'sales.ops@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'sales.ops', 'Suresh Rane', 'RS'),
('usr-14', 'auditor', 'Auditor User', 'auditor@sahyadriauto.in', '$2b$10$w6Q998zP98eP0oKsqC.Gxe5U1uF/lHlM84O3u2zLgQeZJzM07N04W', 'auditor', 'None', 'AU')
ON CONFLICT (id) DO NOTHING;

-- C. DEPARTMENTS & LOCATIONS
INSERT INTO public.departments (id, code, name, head_id, head_name)
VALUES
('dept-01', 'PROD', 'Production', 'EMP-1004', 'Anil Deshmukh'),
('dept-02', 'STORES', 'Stores and Purchase', 'EMP-1005', 'Kavita More'),
('dept-03', 'HR', 'Human Resources', 'EMP-1002', 'Rohini Sawant'),
('dept-04', 'QUAL', 'Quality Control', 'EMP-1005', 'Kavita More'),
('dept-05', 'FIN', 'Finance and Accounts', 'EMP-1001', 'Suresh Rane'),
('dept-06', 'SALES', 'Sales Operations', 'EMP-1001', 'Suresh Rane')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.locations (id, code, name, address)
VALUES
('loc-01', 'PUNE-PLANT', 'Pune Manufacturing Plant', 'Bhosari MIDC, Pune 411026'),
('loc-02', 'CHAKAN-STAGING', 'Chakan Staging Warehouse', 'Chakan MIDC Phase II, Pune')
ON CONFLICT (id) DO NOTHING;

-- D. EMPLOYEES
INSERT INTO public.employees (id, employee_number, first_name, last_name, full_name, work_email, phone, gender, dob, hire_date, status, worker_type, department, department_id, job, grade, manager_id, manager_name, pan, uan, bank_account, bank_name, bank_ifsc, user_id)
VALUES
('EMP-1001', 'EMP-1001', 'Suresh', 'Rane', 'Suresh Rane', 'plant.head@sahyadriauto.in', '+91 98220 12345', 'Male', '1975-04-12', '2015-06-01', 'Active', 'Permanent', 'Production', 'dept-01', 'Plant Head', 'G6', NULL, NULL, 'ABCDE1234F', '100902837461', '5020001001234', 'HDFC Bank', 'HDFC0000486', 'usr-02'),
('EMP-1002', 'EMP-1002', 'Rohini', 'Sawant', 'Rohini Sawant', 'hr.manager@sahyadriauto.in', '+91 98220 23456', 'Female', '1982-08-20', '2018-03-15', 'Active', 'Permanent', 'Human Resources', 'dept-03', 'HR Manager', 'G5', 'EMP-1001', 'Suresh Rane', 'BCDEF2345G', '100902837462', '5020001002234', 'HDFC Bank', 'HDFC0000486', 'usr-03'),
('EMP-1003', 'EMP-1003', 'Meera', 'Kulkarni', 'Meera Kulkarni', 'hr.specialist@sahyadriauto.in', '+91 98220 34567', 'Female', '1990-06-14', '2020-01-10', 'Active', 'Permanent', 'Human Resources', 'dept-03', 'HR Specialist', 'G3', 'EMP-1002', 'Rohini Sawant', 'CDEFG3456H', '100902837463', '5020001003234', 'HDFC Bank', 'HDFC0000486', 'usr-04'),
('EMP-1004', 'EMP-1004', 'Anil', 'Deshmukh', 'Anil Deshmukh', 'mgr.production@sahyadriauto.in', '+91 98220 45678', 'Male', '1980-02-18', '2017-09-01', 'Active', 'Permanent', 'Production', 'dept-01', 'Line Manager, Production', 'G5', 'EMP-1001', 'Suresh Rane', 'DEFGH4567J', '100902837464', '5020001004234', 'HDFC Bank', 'HDFC0000486', 'usr-05'),
('EMP-1005', 'EMP-1005', 'Kavita', 'More', 'Kavita More', 'mgr.stores@sahyadriauto.in', '+91 98220 56789', 'Female', '1983-08-25', '2019-04-01', 'Active', 'Permanent', 'Stores and Purchase', 'dept-02', 'Line Manager, Stores and Purchase', 'G5', 'EMP-1001', 'Suresh Rane', 'EFGHI5678K', '100902837465', '5020001005234', 'HDFC Bank', 'HDFC0000486', 'usr-06'),
('EMP-1042', 'EMP-1042', 'Rahul', 'Patil', 'Rahul Patil', 'emp.production@sahyadriauto.in', '+91 98220 78901', 'Male', '1992-05-10', '2021-02-01', 'Active', 'Permanent', 'Production', 'dept-01', 'Production Operator', 'G3', 'EMP-1004', 'Anil Deshmukh', 'GHIJK7890M', '100902837467', '5020001007234', 'HDFC Bank', 'HDFC0000486', 'usr-07')
ON CONFLICT (id) DO NOTHING;

-- E. SUPPLIERS
INSERT INTO public.suppliers (id, code, name, tax_id, pan, category, primary_site, payment_terms, bank_name, bank_account, bank_ifsc, rating, status)
VALUES
('SUP-101', 'SUP-101', 'Western Auto Forge Pvt Ltd', '27AAACW8421F1ZQ', 'AAACW8421F', 'Direct Materials', 'PUNE-01', 'Net 30', 'HDFC Bank', '5020002841', 'HDFC0000486', 4.8, 'Active'),
('SUP-102', 'SUP-102', 'Deccan Industrial Supply Corp', '27AABCD9912K1ZT', 'AABCD9912K', 'Direct Materials', 'CHAKAN-02', 'Net 30', 'State Bank of India', '30829100234', 'SBIN0001422', 4.5, 'Active'),
('SUP-103', 'SUP-103', 'Precision Fasteners Ltd', '27AABCP1145M1Z8', 'AABCP1145M', 'Consumables', 'PUNE-01', 'Net 45', 'ICICI Bank', '004505001298', 'ICIC0000045', 4.6, 'Active')
ON CONFLICT (id) DO NOTHING;

-- F. SUBINVENTORIES
INSERT INTO public.subinventories (code, name, location, locator_control, active)
VALUES
('RM-STORES', 'Raw Material Stores', 'Bhosari Central Bay A', TRUE, TRUE),
('WIP-STAGING', 'Shop Floor WIP Staging', 'Line 1 & 2 Buffer Staging', FALSE, TRUE),
('FG-WAREHOUSE', 'Finished Goods Dispatch Hub', 'Finished Goods Bay C', TRUE, TRUE),
('QUALITY-HOLD', 'Quarantine & Quality Hold', 'QA Inspection Bay', FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- G. ITEMS (Item Master)
INSERT INTO public.items (id, code, name, description, category, uom, standard_cost, list_price, make_or_buy, lead_time_days, safety_stock, min_order_qty, reorder_point, status, preferred_supplier_id)
VALUES
('FG-1001', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 'High-performance commercial vehicle ceramic friction pads with integrated wear sensor clip', 'Finished Goods', 'SET', 650.00, 1250.00, 'Make', 3, 200, 50, 250, 'Active', NULL),
('FG-1002', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 'Torsional damper heavy-duty organic friction clutch disc for multi-axle trucks', 'Finished Goods', 'EA', 1850.00, 3400.00, 'Make', 4, 100, 25, 120, 'Active', NULL),
('SA-301', 'SA-301', 'Friction Disc Subassembly', 'Pre-bonded steel friction carrier disc with segmented organic pads', 'Subassembly', 'EA', 420.00, 0.00, 'Make', 2, 150, 50, 180, 'Active', NULL),
('SA-302', 'SA-302', 'Clutch Cover & Diaphragm Subassembly', 'Pressed alloy steel pressure plate with heat-treated diaphragm spring', 'Subassembly', 'EA', 780.00, 0.00, 'Make', 2, 80, 30, 100, 'Active', NULL),
('RM-204', 'RM-204', 'High-Tensile Steel Back Plate (6mm)', 'Fine-blanked structural steel backing plate with mechanical retention holes', 'Raw Material', 'EA', 145.00, 0.00, 'Buy', 5, 500, 200, 600, 'Active', 'SUP-101'),
('RM-205', 'RM-205', 'Ceramic Friction Lining Compound', 'Phenolic resin ceramic composite dry mix batch with copper-free additives', 'Raw Material', 'KG', 380.00, 0.00, 'Buy', 7, 300, 100, 400, 'Active', 'SUP-102'),
('RM-206', 'RM-206', 'Hardened Rivets & Anti-Rattle Clip Kit', 'Zinc-nickel plated copper alloy tubular rivets and spring clips', 'Raw Material', 'PKT', 45.00, 0.00, 'Buy', 3, 400, 100, 450, 'Active', 'SUP-103'),
('RM-207', 'RM-207', 'Cushion Spring Steel Strip (50CrV4)', 'Precision cold-rolled spring steel coil for clutch torsional dampening', 'Raw Material', 'KG', 220.00, 0.00, 'Buy', 5, 200, 50, 250, 'Active', 'SUP-101'),
('PKG-101', 'PKG-101', 'Corrugated Export Packaging Box & Foam', '5-ply heavy duty anti-moisture branded retail & shipping carton', 'Packaging', 'BOX', 35.00, 0.00, 'Buy', 2, 600, 300, 700, 'Active', 'SUP-102')
ON CONFLICT (id) DO NOTHING;

-- H. INVENTORY ON-HAND
INSERT INTO public.inventory_onhand (id, item_code, item_name, subinventory, locator, onhand_qty, reserved_qty, available_qty, uom, unit_cost, total_value)
VALUES
('ONH-01', 'RM-204', 'High-Tensile Steel Back Plate (6mm)', 'RM-STORES', 'A-01-04', 1240, 500, 740, 'EA', 145.00, 179800.00),
('ONH-02', 'RM-205', 'Ceramic Friction Lining Compound', 'RM-STORES', 'A-02-12', 680, 250, 430, 'KG', 380.00, 258400.00),
('ONH-03', 'RM-206', 'Hardened Rivets & Anti-Rattle Clip Kit', 'RM-STORES', 'A-03-08', 920, 300, 620, 'PKT', 45.00, 41400.00),
('ONH-04', 'RM-207', 'Cushion Spring Steel Strip (50CrV4)', 'RM-STORES', 'A-04-02', 340, 100, 240, 'KG', 220.00, 74800.00),
('ONH-05', 'PKG-101', 'Corrugated Export Packaging Box & Foam', 'RM-STORES', 'A-05-01', 850, 200, 650, 'BOX', 35.00, 29750.00),
('ONH-06', 'RM-204', 'High-Tensile Steel Back Plate (6mm)', 'WIP-STAGING', 'WIP-01', 300, 0, 300, 'EA', 145.00, 43500.00),
('ONH-07', 'SA-301', 'Friction Disc Subassembly', 'WIP-STAGING', 'WIP-02', 180, 120, 60, 'EA', 420.00, 75600.00),
('ONH-08', 'SA-302', 'Clutch Cover & Diaphragm Subassembly', 'WIP-STAGING', 'WIP-02', 95, 50, 45, 'EA', 780.00, 74100.00),
('ONH-09', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 'FG-WAREHOUSE', 'C-01-10', 450, 300, 150, 'SET', 650.00, 292500.00),
('ONH-10', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 'FG-WAREHOUSE', 'C-02-05', 120, 80, 40, 'EA', 1850.00, 222000.00),
('ONH-11', 'RM-205', 'Ceramic Friction Lining Compound', 'QUALITY-HOLD', 'QA-01', 25, 0, 25, 'KG', 380.00, 9500.00)
ON CONFLICT (id) DO NOTHING;

-- I. WORK CENTERS
INSERT INTO public.work_centers (code, name, department, capacity_hours_per_day, labor_hourly_rate, machine_hourly_rate, efficiency)
VALUES
('WC-STAMP', 'Blanking & Stamping Press Line', 'Production', 16.0, 250.00, 450.00, 94),
('WC-SINTER', 'Continuous Sintering Furnace Cell', 'Production', 24.0, 300.00, 850.00, 98),
('WC-MACH', '4-Axis CNC Surface Grinding Cell', 'Production', 16.0, 280.00, 600.00, 92),
('WC-QA', 'Metrology & Dynamic Friction QA Lab', 'Quality Control', 12.0, 320.00, 200.00, 96),
('WC-PACK', 'Laser Marking & Automated Packing', 'Production', 16.0, 180.00, 150.00, 95)
ON CONFLICT (code) DO NOTHING;

-- J. BILLS OF MATERIALS (BOM)
INSERT INTO public.boms (id, code, item_code, item_name, revision, status, effective_from, yield_percent, description)
VALUES
('BOM-FG-1001', 'BOM-FG-1001', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 'C', 'Active', '2026-01-01', 98.0, 'Standard OEM production BOM for Pune Brake Line 1'),
('BOM-FG-1002', 'BOM-FG-1002', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 'B', 'Active', '2026-02-15', 97.5, 'Multi-axle commercial vehicle clutch plate structure')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bom_components (id, bom_id, item_code, item_name, quantity_per, uom, scrap_percent, operation_seq, is_critical)
VALUES
('BOMC-01', 'BOM-FG-1001', 'RM-204', 'High-Tensile Steel Back Plate (6mm)', 2.0, 'EA', 1.0, 10, TRUE),
('BOMC-02', 'BOM-FG-1001', 'RM-205', 'Ceramic Friction Lining Compound', 0.40, 'KG', 2.5, 20, TRUE),
('BOMC-03', 'BOM-FG-1001', 'RM-206', 'Hardened Rivets & Anti-Rattle Clip Kit', 1.0, 'PKT', 0.5, 30, FALSE),
('BOMC-04', 'BOM-FG-1001', 'PKG-101', 'Corrugated Export Packaging Box & Foam', 1.0, 'BOX', 0.0, 50, FALSE),
('BOMC-05', 'BOM-FG-1002', 'SA-301', 'Friction Disc Subassembly', 1.0, 'EA', 1.5, 10, TRUE),
('BOMC-06', 'BOM-FG-1002', 'SA-302', 'Clutch Cover & Diaphragm Subassembly', 1.0, 'EA', 1.0, 20, TRUE),
('BOMC-07', 'BOM-FG-1002', 'RM-207', 'Cushion Spring Steel Strip (50CrV4)', 0.80, 'KG', 2.0, 10, TRUE),
('BOMC-08', 'BOM-FG-1002', 'RM-206', 'Hardened Rivets & Anti-Rattle Clip Kit', 2.0, 'PKT', 1.0, 20, FALSE),
('BOMC-09', 'BOM-FG-1002', 'PKG-101', 'Corrugated Export Packaging Box & Foam', 1.0, 'BOX', 0.0, 40, FALSE)
ON CONFLICT (id) DO NOTHING;

-- K. ROUTINGS
INSERT INTO public.routings (id, code, item_code, name, active)
VALUES
('ROUT-FG-1001', 'ROUT-FG-1001', 'FG-1001', 'Brake Pad Standard Progressive Manufacturing Routing', TRUE),
('ROUT-FG-1002', 'ROUT-FG-1002', 'FG-1002', 'Clutch Plate Multi-Stage Assembly & Dynamic Balance Routing', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.routing_operations (id, routing_id, seq, name, work_center, setup_hours, run_hours_per_unit, auto_backflush)
VALUES
('RO-01', 'ROUT-FG-1001', 10, 'Fine-blanking & Backplate Retention Piercing', 'WC-STAMP', 0.50, 0.04, TRUE),
('RO-02', 'ROUT-FG-1001', 20, 'Ceramic Matrix Pressing & Sintering Thermal Cycle', 'WC-SINTER', 1.00, 0.12, TRUE),
('RO-03', 'ROUT-FG-1001', 30, 'CNC Surface Grinding, Slotting & Chamfering', 'WC-MACH', 0.40, 0.06, FALSE),
('RO-04', 'ROUT-FG-1001', 40, 'Shear Strength Verification & Friction Audit', 'WC-QA', 0.25, 0.03, FALSE),
('RO-05', 'ROUT-FG-1001', 50, 'Laser QR Marking & Anti-Corrosion Retail Box Pack', 'WC-PACK', 0.20, 0.02, TRUE),
('RO-06', 'ROUT-FG-1002', 10, 'Friction Disc & Damper Hub Alignment', 'WC-STAMP', 0.50, 0.08, TRUE),
('RO-07', 'ROUT-FG-1002', 20, 'Hydraulic Swaging & Rivet Retention Press', 'WC-MACH', 0.40, 0.10, TRUE),
('RO-08', 'ROUT-FG-1002', 30, 'Dynamic Runout & Diaphragm Release Testing', 'WC-QA', 0.30, 0.05, FALSE),
('RO-09', 'ROUT-FG-1002', 40, 'Anti-Rust Dipping & Final Crate Boxing', 'WC-PACK', 0.20, 0.03, TRUE)
ON CONFLICT (id) DO NOTHING;

-- L. WORK ORDERS
INSERT INTO public.work_orders (id, code, item_code, item_name, planned_qty, completed_qty, scrapped_qty, uom, status, routing_id, bom_id, current_op_seq, current_op_name, start_date, due_date, assigned_line, supervisor, priority, completion_percent)
VALUES
('WO-2026-0318', 'WO-2026-0318', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 1000, 650, 18, 'SET', 'In Progress', 'ROUT-FG-1001', 'BOM-FG-1001', 30, 'CNC Surface Grinding, Slotting & Chamfering', '2026-10-12', '2026-10-18', 'Pune Brake Pad Line 1', 'Sanjay Bhosale', 'Urgent', 65),
('WO-2026-0319', 'WO-2026-0319', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 300, 0, 0, 'EA', 'Released', 'ROUT-FG-1002', 'BOM-FG-1002', 10, 'Friction Disc & Damper Hub Alignment', '2026-10-16', '2026-10-22', 'Clutch Plate Line 2', 'Sanjay Bhosale', 'Normal', 0),
('WO-2026-0320', 'WO-2026-0320', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 500, 500, 8, 'SET', 'Completed', 'ROUT-FG-1001', 'BOM-FG-1001', 50, 'Laser QR Marking & Anti-Corrosion Retail Box Pack', '2026-10-06', '2026-10-10', 'Pune Brake Pad Line 1', 'Sanjay Bhosale', 'Normal', 100)
ON CONFLICT (id) DO NOTHING;

-- M. WORK ORDER OPERATIONS
INSERT INTO public.work_order_operations (id, work_order_id, seq, name, work_center, status, planned_qty, completed_qty, scrapped_qty, operator, completed_at)
VALUES
('WOOP-01', 'WO-2026-0318', 10, 'Fine-blanking & Backplate Retention Piercing', 'WC-STAMP', 'Completed', 1000, 1000, 5, 'Rahul Patil', '2026-10-13T12:00:00Z'),
('WOOP-02', 'WO-2026-0318', 20, 'Ceramic Matrix Pressing & Sintering Thermal Cycle', 'WC-SINTER', 'Completed', 995, 990, 5, 'Rahul Patil', '2026-10-14T16:00:00Z'),
('WOOP-03', 'WO-2026-0318', 30, 'CNC Surface Grinding, Slotting & Chamfering', 'WC-MACH', 'In Progress', 990, 650, 8, 'Rahul Patil', NULL),
('WOOP-04', 'WO-2026-0318', 40, 'Shear Strength Verification & Friction Audit', 'WC-QA', 'Pending', 990, 0, 0, NULL, NULL),
('WOOP-05', 'WO-2026-0318', 50, 'Laser QR Marking & Anti-Corrosion Retail Box Pack', 'WC-PACK', 'Pending', 990, 0, 0, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- N. MATERIAL ISSUES
INSERT INTO public.material_issues (id, work_order_id, item_code, item_name, required_qty, issued_qty, uom, subinventory, status)
VALUES
('MI-01', 'WO-2026-0318', 'RM-204', 'High-Tensile Steel Back Plate (6mm)', 2000, 2000, 'EA', 'RM-STORES', 'Fully Issued'),
('MI-02', 'WO-2026-0318', 'RM-205', 'Ceramic Friction Lining Compound', 400, 300, 'KG', 'RM-STORES', 'Partially Issued'),
('MI-03', 'WO-2026-0318', 'RM-206', 'Hardened Rivets & Anti-Rattle Clip Kit', 1000, 1000, 'PKT', 'RM-STORES', 'Fully Issued'),
('MI-04', 'WO-2026-0318', 'PKG-101', 'Corrugated Export Packaging Box & Foam', 1000, 0, 'BOX', 'RM-STORES', 'Pending')
ON CONFLICT (id) DO NOTHING;

-- O. MRP PLANS
INSERT INTO public.mrp_plans (id, item_code, item_name, category, gross_demand, projected_onhand, safety_stock, net_shortage, uom, suggested_action, suggested_qty, suggested_date, supplier_name, status)
VALUES
('MRP-01', 'RM-205', 'Ceramic Friction Lining Compound', 'Raw Material', 650, 430, 300, 520, 'KG', 'CREATE_PURCHASE_REQUISITION', 600, '2026-10-18', 'Deccan Industrial Supply', 'Recommended'),
('MRP-02', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 'Finished Goods', 280, 40, 100, 340, 'EA', 'CREATE_WORK_ORDER', 350, '2026-10-20', 'In-House Line 2', 'Recommended'),
('MRP-03', 'RM-207', 'Cushion Spring Steel Strip (50CrV4)', 'Raw Material', 380, 240, 200, 340, 'KG', 'CREATE_PURCHASE_REQUISITION', 400, '2026-10-22', 'Western Auto Forge', 'Recommended')
ON CONFLICT (id) DO NOTHING;

-- P. CUSTOMERS MASTER
INSERT INTO public.customers (id, code, name, tax_id, pan, category, primary_site, address, payment_terms, credit_limit, credit_used, credit_hold, contact_person, contact_email, contact_phone, status, rating)
VALUES
('CUST-101', 'CUST-101', 'Mahindra Components Ltd', '27AAACM3025E1Z7', 'AAACM3025E', 'OEM Tier 1', 'CHAKAN-PLANT', 'Plot A-14, Phase II, Chakan MIDC, Pune 410501', 'Net 30', 2500000.00, 1242800.00, FALSE, 'Rajesh Khurana', 'rkhurana@mahindra.com', '+91 98231 44556', 'Active', 4.9),
('CUST-102', 'CUST-102', 'Tata Motors Commercial Vehicles Ltd', '27AAACT1284M1Z2', 'AAACT1284M', 'OEM Tier 1', 'PIMPRI-WORKS', 'Sector 15, Pimpri Industrial Belt, Pune 411018', 'Net 45', 8000000.00, 3250000.00, FALSE, 'Vikas Kadam', 'vkadam@tatamotors.com', '+91 98232 55667', 'Active', 5.0),
('CUST-103', 'CUST-103', 'Bajaj Auto Commercial Division', '27AAACB5544J1Z8', 'AAACB5544J', 'OEM Major', 'WALUJ-PLANT', 'Bajaj Nagar, Waluj MIDC, Aurangabad 431136', 'Net 30', 3500000.00, 810000.00, FALSE, 'Sunil Thorat', 'sthorat@bajajauto.co.in', '+91 98233 66778', 'Active', 4.8),
('CUST-104', 'CUST-104', 'Ashok Leyland Spare Parts Hub', '33AAACA2233P1Z1', 'AAACA2233P', 'Aftermarket', 'HOSUR-HUB', 'SIPCOT Industrial Complex, Hosur, Tamil Nadu 635126', 'Net 30', 4000000.00, 3850000.00, FALSE, 'Murugan Selvam', 'mselvam@ashokleyland.com', '+91 94432 11223', 'Active', 4.6)
ON CONFLICT (id) DO NOTHING;

-- Q. PRICE LISTS & PRICE LIST ITEMS
INSERT INTO public.price_lists (id, code, name, currency, effective_from, effective_to, active)
VALUES
('PL-OEM-2026', 'PL-OEM-2026', 'Domestic OEM Contract Price List 2026', 'INR', '2026-01-01', '2026-12-31', TRUE),
('PL-AFTERMARKET', 'PL-AFTERMARKET', 'National Aftermarket Distributor Price List', 'INR', '2026-04-01', '2027-03-31', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_list_items (id, price_list_id, item_code, item_name, uom, list_price, min_qty)
VALUES
('PLI-01', 'PL-OEM-2026', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 'SET', 1250.00, 50),
('PLI-02', 'PL-OEM-2026', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 'EA', 3400.00, 25),
('PLI-03', 'PL-AFTERMARKET', 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 'SET', 1350.00, 20),
('PLI-04', 'PL-AFTERMARKET', 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 'EA', 3650.00, 10)
ON CONFLICT (id) DO NOTHING;

-- R. SALES ORDERS & SALES ORDER LINES
INSERT INTO public.sales_orders (id, code, customer_id, customer_name, order_date, requested_ship_date, price_list_code, ship_to_site, total_amount, gst_amount, grand_total, credit_check_status, status, payment_terms, created_by)
VALUES
('SO-2026-0811', 'SO-2026-0811', 'CUST-101', 'Mahindra Components Ltd', '2026-10-14', '2026-10-25', 'PL-OEM-2026', 'CHAKAN-SHIP', 625000.00, 112500.00, 737500.00, 'Passed', 'Booked', 'Net 30', 'Ritu Sharma'),
('SO-2026-0812', 'SO-2026-0812', 'CUST-102', 'Tata Motors Commercial Vehicles Ltd', '2026-10-10', '2026-10-18', 'PL-OEM-2026', 'PIMPRI-WORKS', 680000.00, 122400.00, 802400.00, 'Passed', 'Shipped', 'Net 45', 'Ritu Sharma')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sales_order_lines (id, order_id, line_number, item_code, description, ordered_qty, shipped_qty, uom, unit_price, line_amount)
VALUES
('SOL-01', 'SO-2026-0811', 1, 'FG-1001', 'Ceramic Disc Brake Pads (Front Axle Set)', 500, 0, 'SET', 1250.00, 625000.00),
('SOL-02', 'SO-2026-0812', 1, 'FG-1002', 'Heavy Duty Clutch Plate Assembly (380mm)', 200, 200, 'EA', 3400.00, 680000.00)
ON CONFLICT (id) DO NOTHING;

-- S. SHIPPING DELIVERIES
INSERT INTO public.shipping_deliveries (id, code, so_code, customer_id, customer_name, delivery_date, carrier_name, vehicle_number, eway_bill_number, lr_number, ship_to, items_count, total_qty, status, shipped_by)
VALUES
('DEL-2026-0501', 'DEL-2026-0501', 'SO-2026-0812', 'CUST-102', 'Tata Motors Commercial Vehicles Ltd', '2026-10-14', 'VRL Logistics Ltd', 'MH-12-RN-4821', '241088492019', 'LR-VRL-99214', 'PIMPRI-WORKS', 1, 200, 'Shipped', 'Pooja Nair')
ON CONFLICT (id) DO NOTHING;

-- T. AR INVOICES
INSERT INTO public.ar_invoices (id, code, so_code, delivery_code, customer_id, customer_name, invoice_date, due_date, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_amount, paid_amount, balance_due, status, payment_terms)
VALUES
('AR-2026-2142', 'AR-2026-2142', 'SO-2026-0812', 'DEL-2026-0501', 'CUST-102', 'Tata Motors Commercial Vehicles Ltd', '2026-10-14', '2026-11-28', 680000.00, 61200.00, 61200.00, 0.00, 802400.00, 802400.00, 0.00, 'Paid', 'Net 45'),
('AR-2026-2208', 'AR-2026-2208', 'SO-2026-0811', NULL, 'CUST-101', 'Mahindra Components Ltd', '2026-10-15', '2026-11-15', 625000.00, 56250.00, 56250.00, 0.00, 737500.00, 0.00, 737500.00, 'Open', 'Net 30')
ON CONFLICT (id) DO NOTHING;

-- U. AR RECEIPTS
INSERT INTO public.ar_receipts (id, code, customer_id, customer_name, receipt_date, receipt_method, reference, receipt_amount, applied_amount, unapplied_amount, bank_account, status, recorded_by)
VALUES
('REC-2026-0101', 'REC-2026-0101', 'CUST-102', 'Tata Motors Commercial Vehicles Ltd', '2026-10-15', 'RTGS', 'CMS-RTGS-98214', 802400.00, 802400.00, 0.00, 'HDFC Operating · •••• 4821', 'Applied', 'Nitin Gaikwad')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 'Schema and seed execution successful!' AS status,
       (SELECT COUNT(*) FROM public.users) AS users_count,
       (SELECT COUNT(*) FROM public.employees) AS employees_count,
       (SELECT COUNT(*) FROM public.suppliers) AS suppliers_count,
       (SELECT COUNT(*) FROM public.items) AS items_count,
       (SELECT COUNT(*) FROM public.work_orders) AS work_orders_count,
       (SELECT COUNT(*) FROM public.customers) AS customers_count,
       (SELECT COUNT(*) FROM public.sales_orders) AS sales_orders_count,
       (SELECT COUNT(*) FROM public.shipping_deliveries) AS shipping_deliveries_count,
       (SELECT COUNT(*) FROM public.ar_invoices) AS ar_invoices_count,
       (SELECT COUNT(*) FROM public.ar_receipts) AS ar_receipts_count;

