export const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "FusionFlow HCM - Enterprise Hire-to-Retire API",
    version: "1.0.0",
    description: "Enterprise H2R HRMS API inspired by Oracle Fusion Cloud HCM for Sahyadri Auto Components Pvt Ltd.",
    contact: {
      name: "Engineering Architecture Team",
      email: "architecture@sahyadriauto.in",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1 Endpoint",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer token obtained from /api/v1/auth/login",
      },
    },
    schemas: {
      StandardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
          data: { type: "object" },
          meta: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          code: { type: "string", example: "VALIDATION_ERROR" },
          details: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        summary: "Sign in and acquire JWT bearer token",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "hr.manager" },
                  password: { type: "string", example: "Demo@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/StandardResponse" } } } },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current authenticated user session & permissions",
        tags: ["Authentication"],
        responses: { 200: { description: "User profile returned" } },
      },
    },
    "/employees": {
      get: {
        summary: "List employees with search and filters",
        tags: ["Core HR"],
        parameters: [
          { name: "department", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 25 } },
        ],
        responses: { 200: { description: "Employee list" } },
      },
      post: {
        summary: "Register new employee",
        tags: ["Core HR"],
        responses: { 201: { description: "Employee created" } },
      },
    },
    "/employees/{id}": {
      get: {
        summary: "Get employee detail with employment history, direct reports, compensation",
        tags: ["Core HR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Employee details" }, 404: { description: "Not found" } },
      },
      put: {
        summary: "Update permitted profile fields",
        tags: ["Core HR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/employees/{id}/actions": {
      post: {
        summary: "Initiate employment action (Promote, Transfer, Change Manager, Terminate)",
        tags: ["Core HR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Action recorded" } },
      },
    },
    "/employees/org-chart": {
      get: {
        summary: "Retrieve full organization hierarchy tree",
        tags: ["Core HR"],
        responses: { 200: { description: "Org chart tree" } },
      },
    },
    "/recruitment/requisitions": {
      get: { summary: "List job requisitions", tags: ["Recruitment"] },
      post: { summary: "Create job requisition with workflow approval", tags: ["Recruitment"] },
    },
    "/recruitment/candidates": {
      get: { summary: "List candidates and applications", tags: ["Recruitment"] },
      post: { summary: "Register candidate application", tags: ["Recruitment"] },
    },
    "/recruitment/candidates/{id}/convert-to-employee": {
      post: {
        summary: "Convert accepted candidate into employee (Zero duplicate check)",
        tags: ["Recruitment"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 201: { description: "Candidate converted to employee" } },
      },
    },
    "/attendance": {
      get: { summary: "List attendance records", tags: ["Time and Attendance"] },
    },
    "/attendance/clock-in": {
      post: { summary: "Record employee clock-in", tags: ["Time and Attendance"] },
    },
    "/attendance/clock-out": {
      post: { summary: "Record employee clock-out and calculate overtime", tags: ["Time and Attendance"] },
    },
    "/leaves/requests": {
      get: { summary: "List leave requests", tags: ["Leave and Absence"] },
      post: { summary: "Apply for leave with balance deduction & overlap check", tags: ["Leave and Absence"] },
    },
    "/payroll/runs/calculate": {
      post: {
        summary: "Execute India statutory payroll calculation engine (Decimal-safe)",
        tags: ["Payroll"],
        responses: { 200: { description: "Payroll calculated" } },
      },
    },
    "/payroll/runs/{id}/finalize": {
      post: {
        summary: "Finalize and lock payroll run (Idempotent, generates payslips)",
        tags: ["Payroll"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Payroll finalized" } },
      },
    },
    "/payroll/payslips/{id}": {
      get: {
        summary: "Retrieve detailed payslip with earnings, statutory deductions & net pay",
        tags: ["Payroll"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Payslip details" } },
      },
    },
    "/approvals": {
      get: { summary: "List pending approvals assigned to current role", tags: ["Approvals"] },
    },
    "/approvals/{id}/action": {
      post: {
        summary: "Perform approval action (Approve, Reject, Request Info, Reassign)",
        tags: ["Approvals"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Approval processed" } },
      },
    },
    "/reports/headcount": {
      get: { summary: "Headcount report by department, grade, gender", tags: ["Reports and Analytics"] },
    },
    "/reports/payroll-cost": {
      get: { summary: "Payroll cost by department and pay period", tags: ["Reports and Analytics"] },
    },
    "/admin/audit": {
      get: { summary: "Enterprise audit log trail", tags: ["Administration and Security"] },
    },
  },
};

