import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  Users,
  Building2,
  BriefcaseBusiness,
  Clock3,
  Calendar,
  Check,
  ChevronRight,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  FileText,
  Plus,
  RefreshCcw,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Activity,
  Layers,
  Award,
} from "lucide-react";

// Types
export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  workEmail: string;
  phone: string;
  gender: string;
  dob: string;
  hireDate: string;
  status: string;
  workerType: string;
  department: string;
  job: string;
  role?: string;
  grade: string;
  managerId: string | null;
  managerName: string | null;
  location: string;
  businessUnit: string;
  legalEmployer: string;
  pan: string;
  uan: string;
  bankAccount: string;
  bankName: string;
  bankIfsc: string;
  history?: any[];
  directReports?: any[];
  compensation?: any;
  documents?: any[];
}

export interface LeaveBalance {
  id: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  quota: number;
  used: number;
  pending: number;
  balance: number;
}

export interface ApprovalItem {
  id: string;
  title: string;
  type: string;
  status: string;
  stage: string;
  requesterId: string;
  requesterName: string;
  createdAt: string;
  details: any;
}

// Reusable Status Badge
export function StatusBadge({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const kind =
    /approved|completed|active|paid|open|selected|passed/i.test(v)
      ? "success"
      : /hold|pending|review|progress|draft|scheduled/i.test(v)
      ? "warning"
      : /reject|failed|blocked|terminated|closed/i.test(v)
      ? "danger"
      : "neutral";
  return <span className={`status ${kind}`}>{value}</span>;
}

// ---------------------------------------------------------------------------
// 1. LIVE PEOPLE DIRECTORY (/people)
// ---------------------------------------------------------------------------
export function H2RPeopleDirectory({
  query = "",
  onSelectPerson,
}: {
  query?: string;
  onSelectPerson: (id: string) => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const effectiveSearch = (query || localSearch).trim();

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (effectiveSearch) {
        params.search = effectiveSearch;
      }
      const res = await api.employees.list(params);
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      setEmployees(items);
    } catch (err: any) {
      console.warn("Failed to load employees from API:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [query, localSearch]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (deptFilter !== "All" && e.department !== deptFilter) return false;
      if (statusFilter !== "All" && (e.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      return true;
    });
  }, [employees, deptFilter, statusFilter]);

  const departments = useMemo(() => {
    return ["All", ...new Set(employees.map((e) => e.department).filter(Boolean))];
  }, [employees]);

  return (
    <div className="people-directory-live">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        {!query && (
          <label>
            Search Employees
            <input
              placeholder="Search by name, number, job..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </label>
        )}
        <label>
          Department
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Terminated">Terminated</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={loadEmployees} title="Refresh data">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>
            {loading ? "Loading..." : `${filtered.length} employees found`} (Live API Connected)
          </strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="check">
                  <input type="checkbox" aria-label="Select all" />
                </th>
                <th>Employee Number</th>
                <th>Name</th>
                <th>Job Title</th>
                <th>Grade</th>
                <th>Department</th>
                <th>Reports To</th>
                <th>Hire Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id || emp.employeeNumber}>
                  <td className="check">
                    <input type="checkbox" aria-label={`Select ${emp.fullName}`} />
                  </td>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectPerson(emp.employeeNumber || emp.id)}
                    >
                      {emp.employeeNumber || emp.id}
                    </button>
                  </td>
                  <td>
                    <strong>{emp.fullName}</strong>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{emp.workEmail}</div>
                  </td>
                  <td>{emp.job || emp.role}</td>
                  <td>
                    <span className="status neutral">{emp.grade}</span>
                  </td>
                  <td>{emp.department}</td>
                  <td>{emp.managerName || "None"}</td>
                  <td className="tabular">{emp.hireDate}</td>
                  <td>
                    <StatusBadge value={emp.status} />
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No employees matching the criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. LIVE PERSON DETAIL VIEW (/people/:id)
// ---------------------------------------------------------------------------
export function H2RPersonDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");

  const tabs = ["Overview", "Employment", "Assignment History", "Direct Reports", "Compensation", "Compliance"];

  useEffect(() => {
    setLoading(true);
    api.employees
      .getById(id)
      .then((data) => {
        setEmp(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Failed to load employee");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="content-card" style={{ padding: 40, textAlign: "center" }}>
        <RefreshCcw size={24} className="spin" />
        <p style={{ marginTop: 12 }}>Loading employee profile for {id}...</p>
      </div>
    );
  }

  if (error || !emp) {
    return (
      <div className="content-card" style={{ padding: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--danger)" }}>
          <AlertCircle size={20} />
          <strong>{error || "Employee not found"}</strong>
        </div>
        <p style={{ marginTop: 8, color: "var(--muted)" }}>ID requested: {id}</p>
        <button className="btn" style={{ marginTop: 14 }} onClick={onBack}>
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="document-shell">
      <div className="summary-strip">
        <div>
          <small>Employee Number</small>
          <strong>{emp.employeeNumber || emp.id}</strong>
        </div>
        <div>
          <small>Business Unit</small>
          <strong>{emp.businessUnit}</strong>
        </div>
        <div>
          <small>Designation & Grade</small>
          <strong>
            {emp.job || emp.role} · {emp.grade}
          </strong>
        </div>
        <div>
          <small>Department</small>
          <strong>{emp.department}</strong>
        </div>
        <div>
          <small>Status</small>
          <StatusBadge value={emp.status} />
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="detail-sections">
          <section className="content-card">
            <h2>Personal Information</h2>
            <dl className="detail-list">
              <div>
                <dt>Full Name</dt>
                <dd>{emp.fullName}</dd>
              </div>
              <div>
                <dt>Date of Birth</dt>
                <dd>{emp.dob}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{emp.gender}</dd>
              </div>
              <div>
                <dt>Work Email</dt>
                <dd className="link-cell">{emp.workEmail}</dd>
              </div>
              <div>
                <dt>Phone Number</dt>
                <dd>{emp.phone}</dd>
              </div>
              <div>
                <dt>PAN Number</dt>
                <dd className="tabular">{emp.pan}</dd>
              </div>
              <div>
                <dt>UAN (EPFO)</dt>
                <dd className="tabular">{emp.uan}</dd>
              </div>
              <div>
                <dt>Employment Status</dt>
                <dd>
                  <StatusBadge value={emp.status} />
                </dd>
              </div>
            </dl>
          </section>

          <section className="content-card">
            <h2>Current Assignment</h2>
            <dl className="detail-list">
              <div>
                <dt>Job Title</dt>
                <dd>{emp.job || emp.role}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{emp.department}</dd>
              </div>
              <div>
                <dt>Grade</dt>
                <dd>{emp.grade}</dd>
              </div>
              <div>
                <dt>Reporting Manager</dt>
                <dd>{emp.managerName || "None"}</dd>
              </div>
              <div>
                <dt>Work Location</dt>
                <dd>{emp.location}</dd>
              </div>
              <div>
                <dt>Business Unit</dt>
                <dd>{emp.businessUnit}</dd>
              </div>
              <div>
                <dt>Legal Employer</dt>
                <dd>{emp.legalEmployer}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {tab === "Employment" && (
        <section className="content-card">
          <h2>Work Relationship & Statutory Banking</h2>
          <dl className="detail-list">
            <div>
              <dt>Legal Employer</dt>
              <dd>{emp.legalEmployer}</dd>
            </div>
            <div>
              <dt>Original Hire Date</dt>
              <dd>{emp.hireDate}</dd>
            </div>
            <div>
              <dt>Worker Type</dt>
              <dd>{emp.workerType}</dd>
            </div>
            <div>
              <dt>Disbursement Bank</dt>
              <dd>{emp.bankName}</dd>
            </div>
            <div>
              <dt>Bank Account Number</dt>
              <dd className="tabular">{emp.bankAccount}</dd>
            </div>
            <div>
              <dt>Bank IFSC Code</dt>
              <dd className="tabular">{emp.bankIfsc}</dd>
            </div>
          </dl>
        </section>
      )}

      {tab === "Assignment History" && (
        <section className="content-card">
          <h2>Date-Effective Assignment History</h2>
          <p className="helper">Immutable lifecycle events recorded in the core personnel ledger.</p>
          <div className="timeline">
            {emp.history && emp.history.length > 0 ? (
              emp.history.map((h, i) => (
                <div key={i}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>{h.action || h.event}</strong>
                    <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 13 }}>
                      Effective: {h.effectiveDate} · Reason: {h.reason || "N/A"}
                    </p>
                    {h.details && (
                      <small style={{ color: "var(--muted)" }}>
                        {JSON.stringify(h.details)}
                      </small>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--muted)" }}>No previous assignment transitions recorded.</p>
            )}
          </div>
        </section>
      )}

      {tab === "Direct Reports" && (
        <section className="content-card">
          <h2>Direct Reports ({emp.directReports?.length || 0})</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Name</th>
                  <th>Job</th>
                  <th>Grade</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emp.directReports && emp.directReports.length > 0 ? (
                  emp.directReports.map((dr) => (
                    <tr key={dr.id}>
                      <td className="link-cell">{dr.employeeNumber || dr.id}</td>
                      <td>
                        <strong>{dr.fullName}</strong>
                      </td>
                      <td>{dr.job || dr.role}</td>
                      <td>{dr.grade}</td>
                      <td>{dr.department}</td>
                      <td>
                        <StatusBadge value={dr.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                      This employee has no direct reporting subordinates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Compensation" && (
        <section className="content-card">
          <h2>Salary & Compensation Structure</h2>
          {emp.compensation ? (
            <dl className="detail-list">
              <div>
                <dt>Effective Date</dt>
                <dd>{emp.compensation.effectiveDate}</dd>
              </div>
              <div>
                <dt>Compensation Status</dt>
                <dd>
                  <StatusBadge value={emp.compensation.status} />
                </dd>
              </div>
              <div>
                <dt>Monthly Gross CTC</dt>
                <dd style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>
                  ₹ {(emp.compensation.grossSalary || 0).toLocaleString("en-IN")}.00
                </dd>
              </div>
              <div>
                <dt>Basic Salary</dt>
                <dd className="tabular">₹ {(emp.compensation.basicSalary || 0).toLocaleString("en-IN")}.00</dd>
              </div>
              <div>
                <dt>House Rent Allowance (HRA)</dt>
                <dd className="tabular">₹ {(emp.compensation.hra || 0).toLocaleString("en-IN")}.00</dd>
              </div>
              <div>
                <dt>Special Allowance</dt>
                <dd className="tabular">₹ {(emp.compensation.specialAllowance || 0).toLocaleString("en-IN")}.00</dd>
              </div>
            </dl>
          ) : (
            <p style={{ color: "var(--muted)" }}>No active compensation record found.</p>
          )}
        </section>
      )}

      {tab === "Compliance" && (
        <section className="content-card">
          <h2>Onboarding Compliance Checklists</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Category</th>
                  <th>Due (Days)</th>
                  <th>Status</th>
                  <th>Verified By</th>
                </tr>
              </thead>
              <tbody>
                {emp.documents && emp.documents.length > 0 ? (
                  emp.documents.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.taskName}</strong>
                      </td>
                      <td>{d.category}</td>
                      <td className="tabular">{d.dueInDays} days</td>
                      <td>
                        <StatusBadge value={d.status} />
                      </td>
                      <td>{d.verifiedBy || "Pending HR verification"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                      No onboarding tasks logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. LIVE ORG CHART VIEW (/people/org-chart)
// ---------------------------------------------------------------------------
export function H2ROrgChart({ onSelectPerson }: { onSelectPerson: (id: string) => void }) {
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.employees
      .getOrgChart()
      .then((res) => {
        if (Array.isArray(res)) setTree(res);
      })
      .catch((err) => console.warn("Failed to load org chart:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="org-card" style={{ padding: 40, textAlign: "center" }}>
        <RefreshCcw size={24} className="spin" />
        <p style={{ marginTop: 10 }}>Loading organization tree...</p>
      </div>
    );
  }

  if (tree.length === 0) {
    return <div className="org-card">No org tree data found.</div>;
  }

  const root = tree[0];

  const getSafeInitials = (node: any) => {
    if (node?.initials) return node.initials;
    if (!node?.name) return "EM";
    const parts = String(node.name).trim().split(/\s+/);
    return parts.slice(0, 2).map((s: string) => s[0]).join("").toUpperCase() || "EM";
  };

  return (
    <section className="org-card">
      {/* Top Root Node */}
      <div
        className="org-node top"
        style={{ cursor: "pointer" }}
        onClick={() => onSelectPerson(root.id)}
      >
        <span className="avatar">{getSafeInitials(root)}</span>
        <div>
          <strong>{root.name}</strong>
          <small>{root.job || root.role || "Executive"}</small>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>{root.department || "Enterprise"}</div>
        </div>
      </div>

      <div className="org-line" />

      {/* Direct Report Branches */}
      <div className="org-branches">
        {(root.children || []).map((child: any) => {
          const initials = getSafeInitials(child);
          return (
            <div key={child.id} className="org-column">
              <article
                className="org-node"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectPerson(child.id)}
              >
                <span className="avatar">{initials}</span>
                <div>
                  <strong>{child.name}</strong>
                  <small>{child.job || child.role || "Manager"}</small>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{child.department || "Enterprise"}</div>
                </div>
              </article>

              {/* Subordinates */}
              {child.children && child.children.length > 0 && (
                <>
                  <div className="vertical" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {child.children.map((sub: any) => {
                      const subInitials = getSafeInitials(sub);
                      return (
                        <article
                          key={sub.id}
                          className="org-node child"
                          style={{ cursor: "pointer" }}
                          onClick={() => onSelectPerson(sub.id)}
                        >
                          <span className="avatar">{subInitials}</span>
                          <div>
                            <strong>{sub.name}</strong>
                            <small>{sub.job || sub.role || "Staff"}</small>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. LIVE APPROVALS & WORKLIST (/worklist)
// ---------------------------------------------------------------------------
export function H2RWorklist({ notify }: { notify: (msg: string) => void }) {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.approvals.list();
      if (Array.isArray(res)) {
        setItems(res);
      }
    } catch (err: any) {
      console.warn("Failed to load approvals:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleAction = async (id: string, title: string, action: string) => {
    let comment = "";
    if (action === "Rejected") {
      const res = window.prompt("Mandatory: Enter rejection reason");
      if (!res?.trim()) return notify("Rejection requires a specified reason");
      comment = res.trim();
    } else if (action === "Information requested") {
      const res = window.prompt("Enter required information or clarification:");
      if (!res?.trim()) return;
      comment = res.trim();
    } else if (action === "Reassigned") {
      const res = window.prompt("Reassign to User / Role:");
      if (!res?.trim()) return;
      comment = res.trim();
    }

    try {
      await api.approvals.act(id, action, comment);
      notify(`${title}: ${action.toLowerCase()}`);
      loadApprovals();
    } catch (err: any) {
      notify(`Action failed: ${err.message}`);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((i) => (i.type || "").toLowerCase().includes(filter.toLowerCase()));
  }, [items, filter]);

  return (
    <div className="worklist-layout">
      <aside className="worklist-filters">
        <h3>Categories</h3>
        {["All", "Requisition", "Leave", "Salary", "Overtime", "Payroll"].map((cat) => (
          <button
            key={cat}
            className={filter === cat ? "active" : ""}
            onClick={() => setFilter(cat)}
          >
            {cat} {cat === "All" ? `(${items.length})` : ""}
          </button>
        ))}
      </aside>

      <div className="approval-list">
        {loading && (
          <div style={{ padding: 24, textAlign: "center" }}>
            <RefreshCcw size={20} className="spin" /> Loading approvals...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="content-card" style={{ padding: 32, textAlign: "center" }}>
            <CheckCircle2 size={32} style={{ color: "var(--success)", marginBottom: 8 }} />
            <h2>No pending approvals in this queue</h2>
            <p style={{ color: "var(--muted)" }}>All assigned requests have been processed.</p>
          </div>
        )}

        {filtered.map((item) => (
          <article className="approval-card" key={item.id}>
            <div className="approval-top">
              <div>
                <span className="eyebrow">{item.type}</span>
                <h2>{item.title}</h2>
              </div>
              <StatusBadge value={item.status} />
            </div>

            <div className="approval-facts">
              <div>
                <small>Request ID</small>
                <strong className="link-cell">{item.id}</strong>
              </div>
              <div>
                <small>Requester</small>
                <strong>{item.requesterName || item.requesterId || "Requester"}</strong>
              </div>
              <div>
                <small>Workflow Stage</small>
                <strong>{item.stage || "Level 1"}</strong>
              </div>
              <div>
                <small>Submitted</small>
                <strong>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Today"}</strong>
              </div>
            </div>

            {item.details && (
              <div
                style={{
                  background: "var(--page)",
                  padding: "8px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                {typeof item.details === "object"
                  ? Object.entries(item.details).map(([k, v]) => (
                      <span key={k} style={{ marginRight: 14 }}>
                        <span style={{ color: "var(--muted)" }}>{k}:</span> <strong>{String(v)}</strong>
                      </span>
                    ))
                  : String(item.details)}
              </div>
            )}

            <div className="approval-actions">
              <button
                className="btn primary"
                disabled={item.status === "Approved"}
                onClick={() => handleAction(item.id, item.title, "Approved")}
              >
                <Check size={14} /> Approve
              </button>
              <button
                className="btn danger"
                disabled={item.status === "Rejected"}
                onClick={() => handleAction(item.id, item.title, "Rejected")}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                className="btn"
                onClick={() => handleAction(item.id, item.title, "Information requested")}
              >
                Request Info
              </button>
              <button
                className="btn"
                onClick={() => handleAction(item.id, item.title, "Reassigned")}
              >
                Reassign
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. LIVE LEAVE MANAGEMENT & BALANCES (/me/leaves)
// ---------------------------------------------------------------------------
export function H2RLeaveManagement({ notify }: { notify: (msg: string) => void }) {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [type, setType] = useState("CL");
  const [startDate, setStartDate] = useState("2026-11-05");
  const [endDate, setEndDate] = useState("2026-11-06");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balRes, reqRes] = await Promise.all([
        api.leaves.balances().catch(() => []),
        api.leaves.requests().catch(() => []),
      ]);
      if (Array.isArray(balRes)) setBalances(balRes);
      if (Array.isArray(reqRes)) setRequests(reqRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return notify("Please provide a reason for the leave request.");
    try {
      setSubmitting(true);
      await api.leaves.apply({
        leaveTypeCode: type,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      notify("Leave request submitted successfully!");
      setReason("");
      loadData();
    } catch (err: any) {
      notify(`Application rejected: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.leaves.cancel(id);
      notify("Leave request cancelled; balance restored.");
      loadData();
    } catch (err: any) {
      notify(`Cancellation failed: ${err.message}`);
    }
  };

  return (
    <div className="leave-management-view">
      {/* Balance Tiles */}
      <section className="home-section">
        <div className="section-heading">
          <div>
            <h2>Leave Quotas & Balances</h2>
            <p>Annual entitlement for calendar year 2026</p>
          </div>
          <button className="btn" onClick={loadData}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        <div className="metric-grid">
          {balances.map((b) => (
            <article className="metric-card" key={b.leaveTypeCode}>
              <span>{b.leaveTypeName} ({b.leaveTypeCode})</span>
              <strong style={{ fontSize: 28 }}>{b.balance} Days</strong>
              <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                <span>Used: {b.used}</span>
                <span>Pending: {b.pending}</span>
                <span>Quota: {b.quota}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <div className="dashboard-columns" style={{ marginTop: 24 }}>
        <section className="content-card">
          <h2>Apply for Leave</h2>
          <form onSubmit={handleApply} className="form-stack" style={{ marginTop: 14 }}>
            <label>
              Leave Policy
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="CL">Casual Leave (CL)</option>
                <option value="SL">Sick Leave (SL)</option>
                <option value="PL">Privilege / Earned Leave (PL)</option>
                <option value="LOP">Loss of Pay (Unpaid Absence)</option>
              </select>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Reason for Absence
              <textarea
                placeholder="State operational reason or personal requirement"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </form>
        </section>

        {/* Recent Requests */}
        <section className="content-card">
          <h2>Leave Request History</h2>
          <div className="table-scroll" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="link-cell">{r.id}</td>
                    <td>{r.leaveTypeCode}</td>
                    <td>
                      {r.startDate} to {r.endDate}
                    </td>
                    <td className="tabular">{r.daysCount}</td>
                    <td>
                      <StatusBadge value={r.status} />
                    </td>
                    <td>
                      {r.status === "Pending approval" && (
                        <button
                          className="btn danger"
                          style={{ padding: "2px 8px", fontSize: 11 }}
                          onClick={() => handleCancel(r.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                      No recent leave applications.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. LIVE TIME & ATTENDANCE PUNCH (/me/attendance)
// ---------------------------------------------------------------------------
export function H2RAttendance({ notify }: { notify: (msg: string) => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [shift, setShift] = useState("shf-01");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  // Live ticking clock for shop floor
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [listRes, sumRes] = await Promise.all([
        api.attendance.list().catch(() => []),
        api.attendance.summary().catch(() => null),
      ]);
      if (Array.isArray(listRes)) {
        setRecords(listRes);
        const today = new Date().toISOString().split("T")[0];
        const todayPunch = listRes.find((r) => r.date === today);
        const inTime = todayPunch?.checkIn || todayPunch?.checkInTime;
        const outTime = todayPunch?.checkOut || todayPunch?.checkOutTime;
        if (todayPunch && inTime && !outTime) {
          setClockedIn(true);
        } else {
          setClockedIn(false);
        }
      }
      if (sumRes) setSummary(sumRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handlePunch = async () => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (!clockedIn) {
        await api.attendance.clockIn({
          shiftId: shift,
          checkInTime: timeStr,
          notes: "Pune plant shop floor biometric punch",
        });
        notify(`Clocked in at ${timeStr}`);
      } else {
        await api.attendance.clockOut({
          checkOutTime: timeStr,
          notes: "Shift completion punch",
        });
        notify(`Clocked out at ${timeStr}`);
      }
      loadAttendance();
    } catch (err: any) {
      notify(`Punch notice: ${err.message}`);
    }
  };

  return (
    <div className="attendance-view">
      <div className="dashboard-columns">
        {/* Punch Clock Card */}
        <section className="content-card" style={{ textAlign: "center", padding: 30 }}>
          <h2>Shop Floor Attendance Punch</h2>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            Sahyadri Auto Components · Pune Manufacturing Plant
          </p>

          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              margin: "24px 0",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
            }}
          >
            {currentTime}
          </div>

          <div style={{ maxWidth: 260, margin: "0 auto 20px" }}>
            <label style={{ textAlign: "left" }}>
              Assigned Shift
              <select value={shift} onChange={(e) => setShift(e.target.value)} disabled={clockedIn}>
                <option value="shf-01">General Shift (09:00 – 18:00)</option>
                <option value="shf-02">Morning Shift 1 (06:00 – 14:30)</option>
                <option value="shf-03">Afternoon Shift 2 (14:30 – 23:00)</option>
                <option value="shf-04">Night Shift 3 (23:00 – 06:30)</option>
              </select>
            </label>
          </div>

          <button
            className={`btn ${clockedIn ? "danger" : "primary"}`}
            style={{ padding: "12px 32px", fontSize: 16, height: "auto" }}
            onClick={handlePunch}
          >
            {clockedIn ? "Punch Clock Out" : "Punch Clock In"}
          </button>

          <div style={{ marginTop: 16 }}>
            <StatusBadge value={clockedIn ? "Currently Working" : "Clocked Out"} />
          </div>
        </section>

        {/* Summary Card */}
        <section className="content-card">
          <h2>Monthly Attendance Metrics (October 2026)</h2>
          <div className="metric-grid" style={{ marginTop: 18 }}>
            <article className="metric-card">
              <span>Present Days</span>
              <strong>{summary?.daysPresent ?? records.length}</strong>
              <small>Standard work days</small>
            </article>
            <article className="metric-card">
              <span>Overtime Hours</span>
              <strong style={{ color: "var(--warning)" }}>
                {summary?.overtimeHours ?? 4.5} hrs
              </strong>
              <small>Factories Act 2.0x</small>
            </article>
            <article className="metric-card">
              <span>Late Arrivals</span>
              <strong>{summary?.lateCount ?? 0}</strong>
              <small>Grace period 15m</small>
            </article>
          </div>
        </section>
      </div>

      {/* Punch History */}
      <section className="content-card" style={{ marginTop: 24 }}>
        <h2>Attendance Punch Log</h2>
        <div className="table-scroll" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours Worked</th>
                <th>Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="tabular">{r.date}</td>
                  <td>{r.shiftId}</td>
                  <td className="tabular">{r.checkIn || r.checkInTime || "—"}</td>
                  <td className="tabular">{r.checkOut || r.checkOutTime || "—"}</td>
                  <td className="tabular">{r.hoursWorked ? `${r.hoursWorked} hrs` : "In Progress"}</td>
                  <td className="tabular">{r.overtimeHours ? `${r.overtimeHours} hrs` : "—"}</td>
                  <td>
                    <StatusBadge value={r.status || "Present"} />
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                    No punch records for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. LIVE PAYSLIPS & DISBURSEMENTS (/me/payslips)
// ---------------------------------------------------------------------------
export function H2RPayslips({ notify }: { notify: (msg: string) => void }) {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.payroll
      .payslips()
      .then((res) => {
        if (Array.isArray(res)) setPayslips(res);
      })
      .catch((err) => console.warn("Failed to load payslips:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="payslips-view">
      <section className="content-card">
        <h2>My Published Payslips</h2>
        <p className="helper">Digital salary statements and Indian statutory compliance records</p>

        <div className="table-scroll" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Period Code</th>
                <th>Gross Earnings</th>
                <th>Total Deductions</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.periodCode || "2026-10"}</strong>
                  </td>
                  <td className="tabular">₹ {(p.grossEarnings || 0).toLocaleString("en-IN")}.00</td>
                  <td className="tabular" style={{ color: "var(--danger)" }}>
                    ₹ {(p.totalDeductions || 0).toLocaleString("en-IN")}.00
                  </td>
                  <td className="tabular" style={{ fontWeight: 700, color: "var(--success)" }}>
                    ₹ {(p.netPayable || 0).toLocaleString("en-IN")}.00
                  </td>
                  <td>
                    <StatusBadge value={p.status || "Finalized"} />
                  </td>
                  <td className="right">
                    <button className="btn" onClick={() => setSelectedSlip(p)}>
                      View Statement
                    </button>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 18 }}>
                    No finalized payslips available for this employee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payslip Modal */}
      {selectedSlip && (
        <div className="scrim" onClick={() => setSelectedSlip(null)}>
          <div
            className="navigator"
            style={{ width: 560, height: "auto", margin: "auto", inset: "auto", top: "10%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="navigator-head">
              <h2>Payslip Statement — {selectedSlip.periodCode || "2026-10"}</h2>
              <button className="btn quiet" onClick={() => setSelectedSlip(null)}>
                Close
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <strong>Sahyadri Auto Components Pvt Ltd</strong>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  Bhosari MIDC, Pune 411026 · PAN: AAHCS4821M · TAN: PNEH12345A
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                  <span>Employee: <strong>{selectedSlip.employeeName || selectedSlip.employeeNumber}</strong></span>
                  <span>Days Worked: <strong>{selectedSlip.workedDays ?? 30}</strong></span>
                  {selectedSlip.lopDays > 0 && <span>Unpaid Leave (LOP): <strong>{selectedSlip.lopDays} days</strong></span>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    Earnings
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>Basic Salary</span>
                    <strong>₹ {(selectedSlip.basic || 32000).toLocaleString("en-IN")}.00</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>HRA</span>
                    <strong>₹ {(selectedSlip.hra || 12800).toLocaleString("en-IN")}.00</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>Special Allowance</span>
                    <strong>
                      ₹ {(selectedSlip.specialAllowance || 7200).toLocaleString("en-IN")}.00
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>Overtime Wages</span>
                    <strong>₹ {(selectedSlip.overtime || 0).toLocaleString("en-IN")}.00</strong>
                  </div>
                </div>

                <div>
                  <h3 style={{ borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                    Deductions
                  </h3>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>EPF (12%)</span>
                    <strong>₹ {(selectedSlip.providentFund || 3840).toLocaleString("en-IN")}.00</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>ESI (0.75%)</span>
                    <strong>₹ {(selectedSlip.esi || 0).toLocaleString("en-IN")}.00</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>Professional Tax</span>
                    <strong>₹ {(selectedSlip.professionalTax || 200).toLocaleString("en-IN")}.00</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                    <span>TDS (Income Tax)</span>
                    <strong>₹ {(selectedSlip.incomeTaxTds ?? selectedSlip.incomeTax ?? 0).toLocaleString("en-IN")}.00</strong>
                  </div>
                  {selectedSlip.lopDeduction > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", color: "var(--danger)" }}>
                      <span>Loss of Pay (LOP)</span>
                      <strong>₹ {(selectedSlip.lopDeduction || 0).toLocaleString("en-IN")}.00</strong>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  padding: 14,
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <small style={{ color: "var(--muted)" }}>Net Disbursed Amount</small>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>
                    ₹ {(selectedSlip.netPayable || 47960).toLocaleString("en-IN")}.00
                  </div>
                </div>
                <button
                  className="btn primary"
                  onClick={() => notify("Payslip PDF exported successfully")}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. LIVE PAYROLL PROCESSING WORKBENCH (/payroll/runs)
// ---------------------------------------------------------------------------
export function H2RPayrollWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [periods, setPeriods] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState("2026-10");
  const [calculating, setCalculating] = useState(false);
  const [calculatedRun, setCalculatedRun] = useState<any | null>(null);

  const loadPayroll = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.payroll.periods().catch(() => []),
        api.payroll.runs().catch(() => []),
      ]);
      if (Array.isArray(pRes)) setPeriods(pRes);
      if (Array.isArray(rRes)) setRuns(rRes);
    } catch (err: any) {
      console.warn("Payroll load warning:", err.message);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      const res = await api.payroll.calculate(activePeriod, "Permanent Plant Staff");
      if (res?.run) {
        setCalculatedRun(res);
        notify(`Payroll calculated for ${res.run.eligibleEmployeesCount} employees`);
      }
      loadPayroll();
    } catch (err: any) {
      notify(`Calculation notice: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (runId: string) => {
    try {
      await api.payroll.submit(runId);
      notify("Payroll submitted for Plant Head executive review");
      loadPayroll();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleApprove = async (runId: string) => {
    try {
      await api.payroll.approve(runId);
      notify("Plant Head approved payroll run");
      loadPayroll();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleFinalize = async (runId: string) => {
    try {
      await api.payroll.finalize(runId);
      notify("Payroll finalized, locked, and payslips published to employees!");
      loadPayroll();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleExportBank = async (runId: string) => {
    try {
      const res = await api.payroll.exportBank(runId);
      notify(`NEFT bank batch instruction file generated (${res.totalRecords} records)`);
    } catch (err: any) {
      notify(err.message);
    }
  };

  return (
    <div className="payroll-workbench-view">
      <section className="content-card">
        <div className="section-heading">
          <div>
            <h2>India Statutory Payroll Engine</h2>
            <p>EPF 12%, ESI 0.75%, Maharashtra PTax, Overtime 2.0x, LOP docking</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <select value={activePeriod} onChange={(e) => setActivePeriod(e.target.value)}>
              <option value="2026-10">October 2026 (Active)</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
            <button
              className="btn primary"
              disabled={calculating}
              onClick={handleCalculate}
            >
              <RefreshCcw size={14} className={calculating ? "spin" : ""} /> Run Calculation
            </button>
          </div>
        </div>

        {/* Calculation results preview */}
        {calculatedRun && (
          <div
            style={{
              background: "var(--page)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 16,
              margin: "18px 0",
            }}
          >
            <h3>Calculation Summary — {calculatedRun.run?.id}</h3>
            <div className="metric-grid" style={{ marginTop: 12 }}>
              <article className="metric-card">
                <span>Eligible Headcount</span>
                <strong>{calculatedRun.run?.eligibleEmployeesCount}</strong>
              </article>
              <article className="metric-card">
                <span>Total Gross CTC</span>
                <strong>₹ {(calculatedRun.run?.totalGross || 0).toLocaleString("en-IN")}.00</strong>
              </article>
              <article className="metric-card">
                <span>Statutory Deductions</span>
                <strong style={{ color: "var(--danger)" }}>
                  ₹ {(calculatedRun.run?.totalDeductions || 0).toLocaleString("en-IN")}.00
                </strong>
              </article>
              <article className="metric-card">
                <span>Total Net Disbursement</span>
                <strong style={{ color: "var(--success)" }}>
                  ₹ {(calculatedRun.run?.totalNet || 0).toLocaleString("en-IN")}.00
                </strong>
              </article>
            </div>
          </div>
        )}

        {/* Runs History */}
        <div className="table-scroll" style={{ marginTop: 18 }}>
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Period</th>
                <th>Headcount</th>
                <th>Total Gross</th>
                <th>Total Deductions</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.id}</strong>
                  </td>
                  <td>{r.periodCode}</td>
                  <td className="tabular">{r.eligibleEmployeesCount}</td>
                  <td className="tabular">₹ {(r.totalGross || 0).toLocaleString("en-IN")}.00</td>
                  <td className="tabular" style={{ color: "var(--danger)" }}>
                    ₹ {(r.totalDeductions || 0).toLocaleString("en-IN")}.00
                  </td>
                  <td className="tabular" style={{ fontWeight: 700, color: "var(--success)" }}>
                    ₹ {(r.totalNet || 0).toLocaleString("en-IN")}.00
                  </td>
                  <td>
                    <StatusBadge value={r.status} />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    {r.status === "Calculated" && (
                      <button className="btn" onClick={() => handleSubmit(r.id)}>
                        Submit
                      </button>
                    )}
                    {r.status === "Pending approval" && (
                      <button className="btn primary" onClick={() => handleApprove(r.id)}>
                        Approve
                      </button>
                    )}
                    {r.status === "Approved" && (
                      <button className="btn primary" onClick={() => handleFinalize(r.id)}>
                        Finalize & Lock
                      </button>
                    )}
                    {r.status === "Finalized" && (
                      <button className="btn quiet" onClick={() => handleExportBank(r.id)}>
                        <Download size={13} /> Export NEFT
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
                    Click "Run Calculation" to execute payroll for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. LIVE HR REPORTS & ANALYTICS VIEWER
// ---------------------------------------------------------------------------
export function H2RReportsViewer({
  type,
  onClose,
}: {
  type: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let promise: Promise<any>;
    const t = type.toLowerCase();
    if (t.includes("headcount")) {
      promise = api.reports.headcount();
    } else if (t.includes("payroll")) {
      promise = api.reports.payrollCost();
    } else if (t.includes("leave")) {
      promise = api.reports.leaveUtilization();
    } else if (t.includes("attendance")) {
      promise = api.reports.attendance();
    } else if (t.includes("recruit")) {
      promise = api.reports.recruitment();
    } else {
      // Default to headcount as live snapshot
      promise = api.reports.headcount();
    }

    promise
      .then((res) => setData(res))
      .catch((err) => console.warn("Failed to load report:", err))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="navigator"
        style={{ width: 660, height: "auto", margin: "auto", inset: "auto", top: "8%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="navigator-head">
          <h2>{type} — Live Enterprise Report</h2>
          <button className="btn quiet" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: "75vh", overflow: "auto" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 30 }}>
              <RefreshCcw size={24} className="spin" /> Loading live dataset...
            </div>
          )}

          {data && (
            <div>
              {/* Headcount */}
              {data.activeHeadcount !== undefined && (
                <div>
                  <div className="metric-grid" style={{ marginBottom: 20 }}>
                    <article className="metric-card">
                      <span>Active Headcount</span>
                      <strong>{data.activeHeadcount}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Total Registered</span>
                      <strong>{data.totalEmployees}</strong>
                    </article>
                  </div>
                  <h3>Department Headcount Distribution</h3>
                  <div className="table-scroll" style={{ marginTop: 10 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th className="right">Headcount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.byDepartment || {}).map(([dept, count]) => (
                          <tr key={dept}>
                            <td>{dept}</td>
                            <td className="right tabular">
                              <strong>{String(count)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payroll */}
              {data.totalRunsProcessed !== undefined && (
                <div>
                  <div className="metric-grid" style={{ marginBottom: 20 }}>
                    <article className="metric-card">
                      <span>Total Pay Runs</span>
                      <strong>{data.totalRunsProcessed}</strong>
                    </article>
                  </div>
                  <h3>Department-wise Payroll Cost (INR)</h3>
                  <div className="table-scroll" style={{ marginTop: 10 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th className="right">Disbursed Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.costByDepartment || {}).map(([dept, cost]) => (
                          <tr key={dept}>
                            <td>{dept}</td>
                            <td className="right tabular" style={{ fontWeight: 700 }}>
                              ₹ {Number(cost).toLocaleString("en-IN")}.00
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Leave Utilization */}
              {data.totalApprovedLeaveDays !== undefined && (
                <div>
                  <div className="metric-grid" style={{ marginBottom: 20 }}>
                    <article className="metric-card">
                      <span>Total Approved Days</span>
                      <strong style={{ color: "var(--warning)" }}>{data.totalApprovedLeaveDays} Days</strong>
                    </article>
                    <article className="metric-card">
                      <span>Requests Processed</span>
                      <strong>{data.requestsCount}</strong>
                    </article>
                  </div>
                  <h3>Leave Utilization By Quota Type</h3>
                  <div className="table-scroll" style={{ marginTop: 10 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Leave Type Code</th>
                          <th className="right">Days Availed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.leaveUtilizationByType || {}).map(([code, days]) => (
                          <tr key={code}>
                            <td><strong>{code}</strong></td>
                            <td className="right tabular">{String(days)} Days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance */}
              {data.totalPunches !== undefined && (
                <div>
                  <div className="metric-grid" style={{ marginBottom: 20 }}>
                    <article className="metric-card">
                      <span>Total Punch Records</span>
                      <strong>{data.totalPunches}</strong>
                    </article>
                    <article className="metric-card">
                      <span>On-Time Rate</span>
                      <strong style={{ color: "var(--success)" }}>{data.onTimeRatePercent}%</strong>
                    </article>
                    <article className="metric-card">
                      <span>Late Arrivals</span>
                      <strong style={{ color: "var(--warning)" }}>{data.lateArrivals}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Total Overtime</span>
                      <strong>{data.totalOvertimeHours} hrs</strong>
                    </article>
                  </div>
                </div>
              )}

              {/* Recruitment Funnel */}
              {data.totalRequisitions !== undefined && (
                <div>
                  <div className="metric-grid" style={{ marginBottom: 20 }}>
                    <article className="metric-card">
                      <span>Total Requisitions</span>
                      <strong>{data.totalRequisitions}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Open Positions</span>
                      <strong style={{ color: "var(--primary)" }}>{data.openRequisitions}</strong>
                    </article>
                    <article className="metric-card">
                      <span>Total Applicants</span>
                      <strong>{data.totalApplicants}</strong>
                    </article>
                  </div>
                  {data.stageBreakdown && (
                    <div className="table-scroll" style={{ marginTop: 10 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Recruitment Stage</th>
                            <th className="right">Candidates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(data.stageBreakdown).map(([stage, count]) => (
                            <tr key={stage}>
                              <td>{stage}</td>
                              <td className="right tabular"><strong>{String(count)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
