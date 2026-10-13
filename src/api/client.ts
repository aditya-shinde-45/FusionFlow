/**
 * FusionFlow Enterprise API Client
 * Connects frontend React components to Node.js H2R Backend
 */

const API_BASE = "/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== "undefined" ? localStorage.getItem("fusionflow_token") : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("fusionflow_token", token);
    } else {
      localStorage.removeItem("fusionflow_token");
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("fusionflow_token");
    }
    return this.token;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      return data;
    } catch (err: any) {
      // Return structured error
      throw err;
    }
  }

  // Authentication
  auth = {
    login: async (username: string, password: string = "Demo@123") => {
      const res = await this.request<{ success: boolean; data: { token: string; user: any } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.data?.token) {
        this.setToken(res.data.token);
      }
      return res.data;
    },
    me: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/auth/me");
      return res.data;
    },
    logout: async () => {
      try {
        await this.request("/auth/logout", { method: "POST" });
      } finally {
        this.setToken(null);
      }
    },
  };

  // Core HR
  employees = {
    list: async (params: Record<string, string | number> = {}) => {
      const qs = new URLSearchParams(params as any).toString();
      const res = await this.request<{ success: boolean; data: any[]; meta: any }>(`/employees?${qs}`);
      return res;
    },
    getById: async (id: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/employees/${id}`);
      return res.data;
    },
    create: async (data: any) => {
      const res = await this.request<{ success: boolean; data: any }>("/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    update: async (id: string, updates: any) => {
      const res = await this.request<{ success: boolean; data: any }>(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return res.data;
    },
    performAction: async (id: string, actionData: any) => {
      const res = await this.request<{ success: boolean; data: any }>(`/employees/${id}/actions`, {
        method: "POST",
        body: JSON.stringify(actionData),
      });
      return res.data;
    },
    getOrgChart: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/employees/org-chart");
      return res.data;
    },
  };

  // Organization
  org = {
    departments: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/org/departments");
      return res.data;
    },
    jobs: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/org/jobs");
      return res.data;
    },
    positions: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/org/positions");
      return res.data;
    },
    locations: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/org/locations");
      return res.data;
    },
  };

  // Recruitment
  recruitment = {
    requisitions: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/recruitment/requisitions?${qs}`);
      return res.data;
    },
    createRequisition: async (data: any) => {
      const res = await this.request<{ success: boolean; data: any }>("/recruitment/requisitions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    candidates: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/recruitment/candidates?${qs}`);
      return res.data;
    },
    convertToEmployee: async (candidateId: string, employeeData: any = {}) => {
      const res = await this.request<{ success: boolean; data: any }>(
        `/recruitment/candidates/${candidateId}/convert-to-employee`,
        {
          method: "POST",
          body: JSON.stringify(employeeData),
        }
      );
      return res.data;
    },
  };

  // Time & Attendance
  attendance = {
    list: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/attendance?${qs}`);
      return res.data;
    },
    clockIn: async (data: { shiftId?: string; checkInTime?: string; notes?: string } = {}) => {
      const res = await this.request<{ success: boolean; data: any }>("/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    clockOut: async (data: { checkOutTime?: string; notes?: string } = {}) => {
      const res = await this.request<{ success: boolean; data: any }>("/attendance/clock-out", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    correction: async (data: any) => {
      const res = await this.request<{ success: boolean; data: any }>("/attendance/correction", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    summary: async (employeeId?: string, year?: number, month?: number) => {
      const qs = new URLSearchParams({
        ...(employeeId ? { employeeId } : {}),
        ...(year ? { year: String(year) } : {}),
        ...(month ? { month: String(month) } : {}),
      }).toString();
      const res = await this.request<{ success: boolean; data: any }>(`/attendance/summary?${qs}`);
      return res.data;
    },
  };

  // Leave & Absence
  leaves = {
    types: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/leaves/types");
      return res.data;
    },
    balances: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/leaves/balances");
      return res.data;
    },
    requests: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/leaves/requests?${qs}`);
      return res.data;
    },
    apply: async (data: any) => {
      const res = await this.request<{ success: boolean; data: any }>("/leaves/requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    cancel: async (id: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/leaves/requests/${id}/cancel`, {
        method: "POST",
      });
      return res.data;
    },
  };

  // Talent & Performance
  talent = {
    goals: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/talent/goals?${qs}`);
      return res.data;
    },
    createGoal: async (data: any) => {
      const res = await this.request<{ success: boolean; data: any }>("/talent/goals", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    reviews: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/talent/reviews?${qs}`);
      return res.data;
    },
    courses: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/talent/courses");
      return res.data;
    },
    enrollments: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/talent/enrollments");
      return res.data;
    },
  };

  // Payroll
  payroll = {
    periods: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/payroll/periods");
      return res.data;
    },
    runs: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/payroll/runs");
      return res.data;
    },
    getRunById: async (id: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/payroll/runs/${id}`);
      return res.data;
    },
    calculate: async (periodCode: string, payGroup?: string) => {
      const res = await requestPost("/payroll/runs/calculate", { periodCode, payGroup });
      return res.data;
    },
    submit: async (runId: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/payroll/runs/${runId}/submit`, {
        method: "POST",
      });
      return res.data;
    },
    approve: async (runId: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/payroll/runs/${runId}/approve`, {
        method: "POST",
      });
      return res.data;
    },
    finalize: async (runId: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/payroll/runs/${runId}/finalize`, {
        method: "POST",
      });
      return res.data;
    },
    payslips: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/payroll/payslips?${qs}`);
      return res.data;
    },
    getPayslipById: async (id: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/payroll/payslips/${id}`);
      return res.data;
    },
    exportBank: async (runId: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/payroll/runs/${runId}/export-bank`);
      return res.data;
    },
  };

  // Approvals & Worklist
  approvals = {
    list: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const res = await this.request<{ success: boolean; data: any[] }>(`/approvals?${qs}`);
      return res.data;
    },
    act: async (id: string, action: string, comment?: string, details?: any) => {
      const res = await this.request<{ success: boolean; data: any }>(`/approvals/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, comment, ...details }),
      });
      return res.data;
    },
  };

  // Notifications
  notifications = {
    list: async () => {
      const res = await this.request<{ success: boolean; data: { unreadCount: number; notifications: any[] } }>("/notifications");
      return res.data;
    },
    markRead: async (id: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/notifications/${id}/read`, {
        method: "PUT",
      });
      return res.data;
    },
    markAllRead: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/notifications/read-all", {
        method: "PUT",
      });
      return res.data;
    },
  };

  // Reports
  reports = {
    headcount: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/reports/headcount");
      return res.data;
    },
    recruitment: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/reports/recruitment");
      return res.data;
    },
    leaveUtilization: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/reports/leave-utilization");
      return res.data;
    },
    attendance: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/reports/attendance");
      return res.data;
    },
    payrollCost: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/reports/payroll-cost");
      return res.data;
    },
  };

  // Admin & Audit
  admin = {
    users: async () => {
      const res = await this.request<{ success: boolean; data: any[] }>("/admin/users");
      return res.data;
    },
    updateRole: async (userId: string, role: string) => {
      const res = await this.request<{ success: boolean; data: any }>(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      return res.data;
    },
    roles: async () => {
      const res = await this.request<{ success: boolean; data: any }>("/admin/roles");
      return res.data;
    },
    audit: async (limit: number = 50) => {
      const res = await this.request<{ success: boolean; data: any[] }>(`/admin/audit?limit=${limit}`);
      return res.data;
    },
  };
}

async function requestPost(endpoint: string, body: any) {
  return api.request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const api = new ApiClient();
export default api;

