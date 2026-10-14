import { useEffect, useMemo, useState } from "react";
import api from "./api/client";
import {
  BrowserRouter,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { create } from "zustand";
import {
  H2RPeopleDirectory,
  H2RPersonDetail,
  H2ROrgChart,
  H2RWorklist,
  H2RLeaveManagement,
  H2RAttendance,
  H2RPayslips,
  H2RPayrollWorkbench,
  H2RReportsViewer,
} from "./components/H2RModules";
import {
  P2PSupplierList,
  P2PSupplierDetail,
  P2PRequisitionList,
  P2PRequisitionDetail,
  P2PPurchaseOrderList,
  P2PPurchaseOrderDetail,
  P2PReceivingWorkbench,
  P2PReturnsWorkbench,
  P2PInvoiceList,
  P2PInvoiceDetail,
  P2PHoldsWorkbench,
  P2PPaymentWorkbench,
} from "./components/P2PModules";
import {
  MfgItemMaster,
  MfgOnhandWorkbench,
  MfgBomWorkbench,
  MfgRoutingsWorkbench,
  MfgWorkOrderList,
  MfgWorkOrderDetail,
  MfgPlannerWorkbench,
} from "./components/MfgModules";
import {
  O2CCustomerList,
  O2CCustomerDetail,
  O2CPriceListsWorkbench,
  O2CSalesOrderList,
  O2CSalesOrderDetail,
  O2CShippingWorkbench,
  O2CARInvoicesWorkbench,
  O2CARReceiptsWorkbench,
} from "./components/O2CModules";
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Calendar,
  CreditCard,
  Factory,
  FileClock,
  FileText,
  Grip,
  HelpCircle,
  Home,
  IndianRupee,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  Truck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

type Role =
  | "admin"
  | "plant.head"
  | "hr.manager"
  | "hr.specialist"
  | "mgr.production"
  | "mgr.stores"
  | "emp.production"
  | "prod.supervisor"
  | "emp.quality"
  | "buyer"
  | "stores.controller"
  | "accounts.clerk"
  | "sales.ops"
  | "auditor";

type User = {
  username: Role;
  name: string;
  role: string;
  reportsTo: string;
  initials: string;
};

const users: User[] = [
  { username: "admin", name: "Admin User", role: "System Admin", reportsTo: "None", initials: "AU" },
  { username: "plant.head", name: "Suresh Rane", role: "Plant Head", reportsTo: "None", initials: "SR" },
  { username: "hr.manager", name: "Rohini Sawant", role: "HR Manager", reportsTo: "Suresh Rane", initials: "RS" },
  { username: "hr.specialist", name: "Meera Kulkarni", role: "HR Specialist", reportsTo: "Rohini Sawant", initials: "MK" },
  { username: "mgr.production", name: "Anil Deshmukh", role: "Line Manager, Production", reportsTo: "Suresh Rane", initials: "AD" },
  { username: "mgr.stores", name: "Kavita More", role: "Line Manager, Stores and Purchase", reportsTo: "Suresh Rane", initials: "KM" },
  { username: "emp.production", name: "Rahul Patil", role: "Employee, Production", reportsTo: "Anil Deshmukh", initials: "RP" },
  { username: "prod.supervisor", name: "Sanjay Bhosale", role: "Production Supervisor", reportsTo: "Anil Deshmukh", initials: "SB" },
  { username: "emp.quality", name: "Sneha Joshi", role: "Employee, Quality", reportsTo: "Kavita More", initials: "SJ" },
  { username: "buyer", name: "Vikram Jadhav", role: "Buyer", reportsTo: "Kavita More", initials: "VJ" },
  { username: "stores.controller", name: "Pooja Nair", role: "Stores Controller", reportsTo: "Kavita More", initials: "PN" },
  { username: "accounts.clerk", name: "Nitin Gaikwad", role: "Accounts Clerk (Payables and Receivables)", reportsTo: "Kavita More", initials: "NG" },
  { username: "sales.ops", name: "Ritu Sharma", role: "Sales Operations", reportsTo: "Suresh Rane", initials: "RS" },
  { username: "auditor", name: "Auditor User", role: "Auditor (read-only)", reportsTo: "None", initials: "AU" },
];

type Area =
  | "common" | "people" | "hrSetup" | "procurement" | "receiving" | "payables"
  | "inventory" | "manufacturing" | "sales" | "shipping" | "receivables"
  | "accounting" | "reports" | "audit" | "admin" | "worklist";

const access: Record<Area, Role[]> = {
  common: users.map((u) => u.username),
  people: ["admin", "plant.head", "hr.manager", "hr.specialist", "mgr.production", "mgr.stores", "auditor"],
  hrSetup: ["admin", "plant.head", "hr.manager", "hr.specialist", "auditor"],
  procurement: ["admin", "plant.head", "mgr.production", "mgr.stores", "emp.production", "emp.quality", "buyer", "stores.controller", "accounts.clerk", "prod.supervisor", "sales.ops", "auditor", "hr.specialist", "hr.manager"],
  receiving: ["admin", "mgr.stores", "buyer", "stores.controller", "accounts.clerk", "prod.supervisor", "auditor"],
  payables: ["admin", "plant.head", "mgr.stores", "buyer", "stores.controller", "accounts.clerk", "auditor"],
  inventory: ["admin", "plant.head", "mgr.production", "mgr.stores", "buyer", "stores.controller", "accounts.clerk", "prod.supervisor", "sales.ops", "auditor"],
  manufacturing: ["admin", "plant.head", "mgr.production", "buyer", "stores.controller", "prod.supervisor", "sales.ops", "auditor"],
  sales: ["admin", "plant.head", "mgr.production", "stores.controller", "accounts.clerk", "prod.supervisor", "sales.ops", "auditor"],
  shipping: ["admin", "stores.controller", "sales.ops", "auditor"],
  receivables: ["admin", "plant.head", "accounts.clerk", "sales.ops", "auditor"],
  accounting: ["admin", "plant.head", "accounts.clerk", "auditor"],
  reports: ["admin", "plant.head", "hr.manager", "hr.specialist", "mgr.production", "mgr.stores", "buyer", "stores.controller", "accounts.clerk", "prod.supervisor", "sales.ops", "auditor"],
  audit: ["admin", "plant.head", "auditor"],
  admin: ["admin", "auditor"],
  worklist: ["plant.head", "hr.manager", "mgr.production", "mgr.stores"],
};

type Page = { path: string; title: string; group: string; area: Area; icon: typeof Home; kind?: "list" | "form" | "detail" | "special" };

const pages: Page[] = [
  { path: "/home", title: "Home", group: "General", area: "common", icon: Home, kind: "special" },
  { path: "/me", title: "My Profile", group: "People", area: "common", icon: UserRound, kind: "special" },
  { path: "/me/leaves", title: "Leave Management", group: "People", area: "common", icon: Clock3, kind: "special" },
  { path: "/me/attendance", title: "Time and Attendance", group: "People", area: "common", icon: Clock3, kind: "special" },
  { path: "/me/payslips", title: "My Payslips", group: "People", area: "common", icon: IndianRupee, kind: "special" },
  { path: "/payroll/runs", title: "Payroll Processing", group: "HR Setup", area: "hrSetup", icon: WalletCards, kind: "special" },
  { path: "/me/resignation", title: "Resignation", group: "People", area: "common", icon: FileClock, kind: "form" },
  { path: "/people", title: "People Directory", group: "People", area: "common", icon: Users, kind: "list" },
  { path: "/people/:id", title: "Person Detail", group: "People", area: "common", icon: UserRound, kind: "detail" },
  { path: "/people/hire-requests", title: "Hire Requests", group: "People", area: "people", icon: BriefcaseBusiness, kind: "list" },
  { path: "/people/actions", title: "Employment Actions", group: "People", area: "people", icon: Activity, kind: "form" },
  { path: "/people/queue", title: "HR Processing Queue", group: "People", area: "people", icon: ClipboardCheck, kind: "list" },
  { path: "/people/offboarding", title: "Offboarding", group: "People", area: "people", icon: FileClock, kind: "list" },
  { path: "/people/org-chart", title: "Org Chart", group: "People", area: "common", icon: Users, kind: "special" },
  { path: "/setup/departments", title: "Departments", group: "HR Setup", area: "hrSetup", icon: Building2, kind: "list" },
  { path: "/setup/jobs", title: "Jobs and Grades", group: "HR Setup", area: "hrSetup", icon: BriefcaseBusiness, kind: "list" },
  { path: "/setup/positions", title: "Positions", group: "HR Setup", area: "hrSetup", icon: Users, kind: "list" },
  { path: "/suppliers/new", title: "Supplier Registration", group: "Procurement", area: "procurement", icon: Plus, kind: "form" },
  { path: "/suppliers", title: "Suppliers", group: "Procurement", area: "procurement", icon: Building2, kind: "list" },
  { path: "/suppliers/:id", title: "Supplier Detail", group: "Procurement", area: "procurement", icon: Building2, kind: "detail" },
  { path: "/requisitions", title: "Requisitions", group: "Procurement", area: "procurement", icon: FileText, kind: "list" },
  { path: "/requisitions/new", title: "Create Requisition", group: "Procurement", area: "procurement", icon: Plus, kind: "form" },
  { path: "/requisitions/:id", title: "Requisition Detail", group: "Procurement", area: "procurement", icon: FileText, kind: "detail" },
  { path: "/po", title: "Purchase Orders", group: "Procurement", area: "procurement", icon: ShoppingCart, kind: "list" },
  { path: "/po/new", title: "Create Purchase Order", group: "Procurement", area: "procurement", icon: Plus, kind: "form" },
  { path: "/po/:id", title: "Purchase Order Detail", group: "Procurement", area: "procurement", icon: ShoppingCart, kind: "detail" },
  { path: "/receiving", title: "Receiving", group: "Procurement", area: "receiving", icon: PackageCheck, kind: "form" },
  { path: "/receiving/returns", title: "Returns to Supplier", group: "Procurement", area: "receiving", icon: Archive, kind: "list" },
  { path: "/ap/invoices", title: "Invoices", group: "Payables", area: "payables", icon: FileText, kind: "list" },
  { path: "/ap/invoices/new", title: "Create Invoice", group: "Payables", area: "payables", icon: Plus, kind: "form" },
  { path: "/ap/invoices/:id", title: "Invoice Detail", group: "Payables", area: "payables", icon: FileText, kind: "detail" },
  { path: "/ap/holds", title: "Holds", group: "Payables", area: "payables", icon: Clock3, kind: "list" },
  { path: "/ap/payments/new", title: "Create Payment Batch", group: "Payables", area: "payables", icon: CreditCard, kind: "form" },
  { path: "/ap/payments", title: "Payments", group: "Payables", area: "payables", icon: WalletCards, kind: "list" },
  { path: "/items", title: "Item Master", group: "Inventory", area: "inventory", icon: Boxes, kind: "list" },
  { path: "/inventory/onhand", title: "On-Hand Quantity", group: "Inventory", area: "inventory", icon: Boxes, kind: "list" },
  { path: "/inventory/transactions", title: "Inventory Transactions", group: "Inventory", area: "inventory", icon: RefreshCcw, kind: "list" },
  { path: "/inventory/new", title: "Transfers and Miscellaneous", group: "Inventory", area: "inventory", icon: Plus, kind: "form" },
  { path: "/inventory/material-issues", title: "Material Issues", group: "Inventory", area: "inventory", icon: PackageCheck, kind: "list" },
  { path: "/inventory/cycle-counts", title: "Cycle Counts", group: "Inventory", area: "inventory", icon: ClipboardCheck, kind: "list" },
  { path: "/mfg/bom", title: "BOM List and Editor", group: "Manufacturing", area: "manufacturing", icon: Boxes, kind: "list" },
  { path: "/mfg/routings", title: "Routings", group: "Manufacturing", area: "manufacturing", icon: Factory, kind: "list" },
  { path: "/mfg/policies", title: "Reorder Policies", group: "Manufacturing", area: "manufacturing", icon: SlidersHorizontal, kind: "list" },
  { path: "/mfg/planner", title: "Planner Workbench", group: "Manufacturing", area: "manufacturing", icon: BarChart3, kind: "list" },
  { path: "/mfg/work-orders", title: "Work Orders", group: "Manufacturing", area: "manufacturing", icon: Factory, kind: "list" },
  { path: "/mfg/work-orders/:id", title: "Work Order Detail", group: "Manufacturing", area: "manufacturing", icon: Factory, kind: "detail" },
  { path: "/customers", title: "Customers", group: "Order Management", area: "sales", icon: Building2, kind: "list" },
  { path: "/customers/:id", title: "Customer Detail", group: "Order Management", area: "sales", icon: Building2, kind: "detail" },
  { path: "/price-lists", title: "Price Lists", group: "Order Management", area: "sales", icon: IndianRupee, kind: "list" },
  { path: "/orders", title: "Sales Orders", group: "Order Management", area: "sales", icon: ShoppingCart, kind: "list" },
  { path: "/orders/new", title: "Create Sales Order", group: "Order Management", area: "sales", icon: Plus, kind: "form" },
  { path: "/orders/:id", title: "Sales Order Detail", group: "Order Management", area: "sales", icon: ShoppingCart, kind: "detail" },
  { path: "/shipping", title: "Shipping", group: "Order Management", area: "shipping", icon: Truck, kind: "list" },
  { path: "/ar/invoices", title: "AR Invoices", group: "Receivables", area: "receivables", icon: FileText, kind: "list" },
  { path: "/ar/receipts", title: "Receipts", group: "Receivables", area: "receivables", icon: CreditCard, kind: "form" },
  { path: "/worklist", title: "Worklist", group: "General", area: "worklist", icon: ClipboardCheck, kind: "special" },
  { path: "/notifications", title: "Notifications", group: "General", area: "common", icon: Bell, kind: "special" },
  { path: "/accounting", title: "Accounting Journals", group: "Finance", area: "accounting", icon: FileText, kind: "list" },
  { path: "/reports", title: "Reports", group: "General", area: "reports", icon: BarChart3, kind: "special" },
  { path: "/audit", title: "Audit Log", group: "Administration", area: "audit", icon: FileClock, kind: "list" },
  { path: "/admin/users", title: "Users", group: "Administration", area: "admin", icon: Users, kind: "list" },
  { path: "/admin/roles", title: "Roles", group: "Administration", area: "admin", icon: ShieldCheck, kind: "list" },
  { path: "/admin/approval-rules", title: "Approval Rules", group: "Administration", area: "admin", icon: SlidersHorizontal, kind: "list" },
  { path: "/admin/tools", title: "Administration Tools", group: "Administration", area: "admin", icon: Settings, kind: "special" },
  { path: "/help", title: "Help", group: "General", area: "common", icon: CircleHelp, kind: "special" },
];

type AppState = {
  user: User | null;
  dark: boolean;
  compact: boolean;
  toast: string;
  workflowStatuses: Record<string, string>;
  signIn: (user: User) => void;
  signOut: () => void;
  setDark: (value: boolean) => void;
  setCompact: (value: boolean) => void;
  notify: (message: string) => void;
  updateWorkflow: (id: string, status: string) => void;
  resetDemo: () => void;
};

const initialWorkflowStatuses = {
  "PR-2026-1184": "Pending approval",
  "PER-2042": "Pending approval",
  "SUP-1098": "Pending approval",
  "INV-8841": "On hold",
};

const useAppStore = create<AppState>((set) => ({
  user: users.find((user) => user.username === "plant.head") || users[0],
  dark: false,
  compact: false,
  toast: "",
  workflowStatuses: initialWorkflowStatuses,
  signIn: (user) => set({ user }),
  signOut: () => set({ user: null }),
  setDark: (dark) => set({ dark }),
  setCompact: (compact) => set({ compact }),
  notify: (toast) => {
    set({ toast });
    window.setTimeout(() => set({ toast: "" }), 3000);
  },
  updateWorkflow: (id, status) => set((state) => ({
    workflowStatuses: { ...state.workflowStatuses, [id]: status },
  })),
  resetDemo: () => set({ workflowStatuses: initialWorkflowStatuses, toast: "Demo data reset complete" }),
}));

const isMatch = (pattern: string, path: string) => {
  const p = pattern.split("/");
  const a = path.split("/");
  return p.length === a.length && p.every((part, i) => part.startsWith(":") || part === a[i]);
};

const allowedForPage = (page: Page, role: Role) => {
  const path = page.path;
  if (!access[page.area].includes(role)) return false;
  if (path.startsWith("/suppliers")) return ["admin", "plant.head", "mgr.stores", "buyer", "stores.controller", "accounts.clerk", "auditor"].includes(role);
  if (path === "/po" || path.startsWith("/po/")) return ["admin", "plant.head", "mgr.production", "mgr.stores", "buyer", "stores.controller", "accounts.clerk", "prod.supervisor", "auditor"].includes(role);
  if (path.startsWith("/customers") || path.startsWith("/price-lists")) return ["admin", "plant.head", "sales.ops", "auditor"].includes(role);
  if (path.startsWith("/orders")) return ["admin", "plant.head", "mgr.production", "stores.controller", "accounts.clerk", "prod.supervisor", "sales.ops", "auditor"].includes(role);
  if (path === "/admin/approval-rules") return ["admin", "plant.head", "auditor"].includes(role);
  return true;
};


function Button({ children, variant = "secondary", onClick, disabled = false, title, type = "button" }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "quiet" | "danger"; onClick?: () => void; disabled?: boolean; title?: string; type?: "button" | "submit";
}) {
  return <button type={type} className={`btn ${variant}`} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

function Status({ value }: { value: string }) {
  const kind = /approved|completed|active|paid|open/i.test(value) ? "success" : /hold|pending|review|progress/i.test(value) ? "warning" : /reject|failed|blocked/i.test(value) ? "danger" : "neutral";
  return <span className={`status ${kind}`}>{value}</span>;
}

function Login() {
  const signIn = useAppStore((s) => s.signIn);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.username === username);
    if (user && password === "Demo@123") {
      try {
        await api.auth.login(username, password);
      } catch (err: any) {
        console.warn("Backend auth notice:", err.message);
      }
      signIn(user);
      navigate("/home");
    }
    else setError("Enter a listed username and the demo password.");
  };
  const signInAs = async (user: User) => {
    try {
      await api.auth.login(user.username, "Demo@123");
    } catch (err: any) {
      console.warn("Backend auth notice:", err.message);
    }
    signIn(user);
    navigate("/home");
  };
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <Brand />
        <div className="form-stack">
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          {error && <div className="inline-error">{error}</div>}
          <Button variant="primary" type="submit">Sign in</Button>
        </div>
      </form>
      <section className="demo-access">
        <div className="section-heading"><div><h2>Demo access</h2><p>All accounts use password <strong>Demo@123</strong></p></div><Status value="14 roles" /></div>
        <div className="table-scroll">
          <table><thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Reports to</th><th></th></tr></thead>
            <tbody>{users.map((u) => <tr key={u.username}><td className="link-cell">{u.username}</td><td>{u.name}</td><td>{u.role}</td><td>{u.reportsTo}</td><td className="right"><Button onClick={() => signInAs(u)}>Sign in as</Button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <p className="login-foot">Sahyadri Auto Components Pvt Ltd · Pune</p>
    </div>
  );
}

function Brand() {
  return <div className="brand"><span className="brand-mark">F</span><span>FusionFlow</span></div>;
}

function PublicLanding() {
  const navigate = useNavigate();
  const processCards = [
    ["Hire-to-Retire", "Manage workforce changes from hiring and assignment through offboarding.", Users],
    ["Procure-to-Pay", "Control suppliers, purchasing, receiving, invoice matching and payments.", ShoppingCart],
    ["Plan-to-Produce", "Connect material planning, work orders, shop-floor execution and inventory.", Factory],
    ["Order-to-Cash", "Coordinate customer credit, orders, fulfilment, invoicing and receipts.", Truck],
  ] as const;
  return <div className="public-site">
    <header className="public-nav">
      <button className="brand-button" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}><Brand/></button>
      <nav aria-label="Main navigation">
        <a href="#platform">Platform</a>
        <a href="#processes">Business processes</a>
        <a href="#about">About us</a>
        <a href="#customers">Customers</a>
      </nav>
      <div className="public-nav-actions"><Button onClick={()=>navigate("/login")}>Sign in</Button><Button variant="primary" onClick={()=>navigate("/home")}>Open live demo <ChevronRight size={15}/></Button></div>
    </header>

    <main>
      <section className="public-hero" id="platform">
        <div className="hero-copy">
          <span className="public-kicker">Enterprise operations · Built for Indian manufacturing</span>
          <h1>One operating system for your people, materials, production and customers.</h1>
          <p>FusionFlow connects the four core business processes of Sahyadri Auto Components in a controlled, role-based workspace—from the first requisition to the final customer receipt.</p>
          <div className="hero-actions"><Button variant="primary" onClick={()=>navigate("/home")}>Explore the live workspace <ChevronRight size={16}/></Button><Button onClick={()=>document.getElementById("processes")?.scrollIntoView({behavior:"smooth"})}>View business processes</Button></div>
          <div className="hero-proof"><div><strong>14</strong><span>Role-based workspaces</span></div><div><strong>4</strong><span>Connected processes</span></div><div><strong>60+</strong><span>Operational screens</span></div></div>
        </div>
        <div className="hero-media">
          <img src="https://images.unsplash.com/photo-1764114909312-c27b89ec7223?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400" alt="Manufacturing team operating industrial machinery"/>
          <div className="hero-status"><span><i/> Pune plant online</span><strong>94.2% plan attainment</strong><small>Updated 15-Oct-2026, 10:42</small></div>
          <p>Photo by Zoshua Colah on Unsplash</p>
        </div>
      </section>

      <section className="trust-strip"><span>Designed for operational control across</span><strong>Human Resources</strong><i/><strong>Procurement</strong><i/><strong>Manufacturing</strong><i/><strong>Finance</strong><i/><strong>Order Management</strong></section>

      <section className="public-section process-section" id="processes">
        <div className="public-section-heading"><span className="public-kicker">Connected business processes</span><h2>Every transaction moves through one governed system.</h2><p>Teams work from the same operational data while approvals, controls and audit history remain visible at every step.</p></div>
        <div className="public-process-grid">{processCards.map(([title,copy,Icon],i)=><article key={title}><div className="process-card-top"><span>0{i+1}</span><Icon size={23}/></div><h3>{title}</h3><p>{copy}</p><button onClick={()=>navigate(["/people","/requisitions","/mfg/work-orders","/orders"][i])}>Explore process <ChevronRight size={14}/></button></article>)}</div>
      </section>

      <section className="public-feature" id="about">
        <div className="feature-copy"><span className="public-kicker">About Sahyadri Auto Components</span><h2>Built around the realities of a working factory.</h2><p>Sahyadri Auto Components Pvt Ltd manufactures brake pads and clutch plates in Pune. FusionFlow reflects the controls its teams need every day: material availability, production completion, supplier matching, customer credit and accountable approvals.</p><ul><li><Check size={16}/>Clear ownership from request through completion</li><li><Check size={16}/>Indian currency, tax, date and payment conventions</li><li><Check size={16}/>Role-aware access with complete audit history</li><li><Check size={16}/>Actionable exceptions rather than disconnected reports</li></ul><Button onClick={()=>navigate("/home")}>See operations overview <ChevronRight size={15}/></Button></div>
        <div className="feature-facts"><div><small>Primary products</small><strong>Brake pads</strong><strong>Clutch plates</strong></div><div><small>Head office and plant</small><strong>Pune, Maharashtra</strong><span>India</span></div><div><small>Core operating model</small><strong>Plan · Source · Make · Deliver</strong><span>One governed workflow</span></div></div>
      </section>

      <section className="public-section customer-section" id="customers">
        <div className="public-section-heading"><span className="public-kicker">Designed for every role</span><h2>Focused workspaces without losing the complete picture.</h2></div>
        <div className="testimonial-layout">
          <blockquote><p>“The production, stores and purchase teams can see the same requirement at the right stage. Exceptions are visible early, and approvals no longer disappear into separate trackers.”</p><footer><span className="avatar">SR</span><div><strong>Suresh Rane</strong><small>Plant Head · Sahyadri Auto Components</small></div></footer></blockquote>
          <div className="role-outcomes"><div><strong>Managers</strong><p>Approve the right transaction with value, requester, age and chain in context.</p></div><div><strong>Operators</strong><p>Complete focused tasks without access to unrelated or sensitive work.</p></div><div><strong>Finance and audit</strong><p>Trace each operational event to balanced accounting and field-level history.</p></div></div>
        </div>
      </section>

      <section className="public-cta"><div><span className="public-kicker">Interactive product environment</span><h2>Review the complete workflow with realistic manufacturing data.</h2><p>Use any of the 14 demonstration roles to experience role-specific navigation, approvals and operational screens.</p></div><div><Button variant="primary" onClick={()=>navigate("/home")}>Open live demo <ChevronRight size={16}/></Button><Button onClick={()=>navigate("/login")}>Choose a demo role</Button></div></section>
    </main>

    <footer className="public-footer">
      <div className="footer-main"><div className="footer-brand"><Brand/><p>Connected enterprise operations for Sahyadri Auto Components Pvt Ltd.</p><span>Pune, Maharashtra, India</span></div><div><h3>Platform</h3><a href="#processes">Business processes</a><button onClick={()=>navigate("/home")}>Live workspace</button><button onClick={()=>navigate("/reports")}>Reports</button></div><div><h3>Company</h3><a href="#about">About us</a><a href="#customers">Customers</a><button onClick={()=>navigate("/help")}>Help centre</button></div><div><h3>Access</h3><button onClick={()=>navigate("/login")}>Sign in</button><button onClick={()=>navigate("/login")}>Demo roles</button><span>Demo password: Demo@123</span></div></div>
      <div className="footer-lower"><span>© 2026 FusionFlow. Demonstration application.</span><div><button>Privacy</button><button>Terms</button><button>Accessibility</button></div></div>
    </footer>
  </div>;
}

function Header({ openNav }: { openNav: () => void }) {
  const navigate = useNavigate();
  const { user, dark, compact, setDark, setCompact, signOut } = useAppStore();
  const [menu, setMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.notifications.list()
      .then((res: any) => {
        if (typeof res?.unreadCount === "number") {
          setUnreadCount(res.unreadCount);
        } else if (Array.isArray(res?.notifications)) {
          setUnreadCount(res.notifications.filter((n: any) => !n.read).length);
        }
      })
      .catch(() => {});
  }, []);

  return <header className="global-header">
    <button className="icon-btn" onClick={openNav} aria-label="Open navigator"><Menu size={20} /></button>
    <button className="brand-button" onClick={() => navigate("/home")}><Brand /></button>
    <div className="global-search"><Search size={17} /><input placeholder="Search people, orders, invoices…" /></div>
    <button className="header-action" onClick={() => navigate("/help")}><CircleHelp size={18} /><span>Help</span></button>
    <button className="header-action bell" onClick={() => navigate("/notifications")}><Bell size={18} />{unreadCount > 0 && <span className="count">{unreadCount}</span>}</button>
    <div className="user-wrap">
      <button className="user-button" onClick={() => setMenu(!menu)}><span className="avatar">{user?.initials}</span><span className="user-copy"><strong>{user?.name}</strong><small>{user?.role}</small></span><ChevronDown size={15} /></button>
      {menu && <div className="user-menu">
        <button onClick={() => { navigate("/me"); setMenu(false); }}><UserRound size={16} />My Profile</button>
        <button onClick={() => { signOut(); navigate("/login"); setMenu(false); }}><Users size={16} />Switch User</button>
        <button onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? "Light mode" : "Dark mode"}<span>{dark ? "On" : "Off"}</span></button>
        <div className="menu-section">Table density</div>
        <button onClick={() => setCompact(false)}><Check size={16} className={!compact ? "" : "invisible"} />Comfortable</button>
        <button onClick={() => setCompact(true)}><Check size={16} className={compact ? "" : "invisible"} />Compact</button>
        <button onClick={() => { signOut(); navigate("/login"); }}><LogOut size={16} />Sign out</button>
      </div>}
    </div>
  </header>;
}

function Navigator({ close }: { close: () => void }) {
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const visible = pages.filter((p) => !p.path.includes(":") && p.path !== "/home" && allowedForPage(p, user.username));
  const groups = [...new Set(visible.map((p) => p.group))];
  return <><div className="scrim" onClick={close} /><aside className="navigator">
    <div className="navigator-head"><Brand /><button className="icon-btn" onClick={close}><X size={20} /></button></div>
    <div className="navigator-search"><Search size={16} /><input placeholder="Search navigator" /></div>
    <div className="nav-scroll">
      {groups.map((group) => <section key={group}><h3>{group}</h3>{visible.filter((p) => p.group === group).map((p) => {
        const Icon = p.icon;
        return <button key={p.path} onClick={() => { navigate(p.path); close(); }}><Icon size={17} /><span>{p.title}</span></button>;
      })}</section>)}
    </div>
  </aside></>;
}

function Shell() {
  const { user, dark, compact, toast } = useAppStore();
  const { pathname } = useLocation();
  const [nav, setNav] = useState(false);

  useEffect(() => {
    if (user) {
      api.auth.login(user.username, "Demo@123").catch((err) => {
        console.warn("Auto token sync notice:", err.message);
      });
    }
  }, [user?.username]);

  if (pathname === "/") return <PublicLanding />;
  if (!user || pathname === "/login") return <Login />;
  return <div className={`${dark ? "dark" : ""} ${compact ? "compact" : ""}`}>
    <Header openNav={() => setNav(true)} />
    {nav && <Navigator close={() => setNav(false)} />}
    <main className="app-main"><PageRouter /></main>
    {toast && <div className="toast"><Check size={17} />{toast}</div>}
  </div>;
}

function PageRouter() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const notify = useAppStore((s) => s.notify);

  if (pathname === "/") return <Navigate to="/home" replace />;
  const page = pages.find((p) => p.path === pathname) || pages.find((p) => p.path.includes(":") && isMatch(p.path, pathname));
  if (!page) return <NotFound />;
  if (!allowedForPage(page, user.username)) return <Forbidden />;

  if (pathname === "/home") return <HomePage />;
  if (pathname === "/me") return <ProfilePage />;
  if (pathname === "/me/leaves") return <><PageTitle page={page} /><H2RLeaveManagement notify={notify} /></>;
  if (pathname === "/me/attendance") return <><PageTitle page={page} /><H2RAttendance notify={notify} /></>;
  if (pathname === "/me/payslips") return <><PageTitle page={page} /><H2RPayslips notify={notify} /></>;
  if (pathname === "/payroll/runs") return <><PageTitle page={page} /><H2RPayrollWorkbench notify={notify} /></>;
  if (pathname === "/worklist") return <><PageTitle page={page} /><H2RWorklist notify={notify} /></>;
  if (pathname === "/people/org-chart") return <><PageTitle page={page} /><H2ROrgChart onSelectPerson={(id) => navigate(`/people/${id}`)} /></>;
  if (pathname === "/notifications") return <Notifications />;
  if (pathname === "/reports") return <Reports />;
  if (pathname === "/admin/tools") return <AdminTools />;
  if (pathname === "/help") return <Help />;

  if (pathname === "/people") {
    return (
      <>
        <PageTitle
          page={page}
          actions={
            <Button variant="primary" onClick={() => navigate("/people/actions")}>
              <Plus size={16} /> Manage Employment
            </Button>
          }
        />
        <WorkArea page={page}>
          <H2RPeopleDirectory onSelectPerson={(id) => navigate(`/people/${id}`)} />
        </WorkArea>
      </>
    );
  }

  if (page.path === "/people/:id") {
    const id = pathname.split("/").pop() || "EMP-1042";
    return <><PageTitle page={page} /><H2RPersonDetail id={id} onBack={() => navigate("/people")} /></>;
  }

  // Procure-to-Pay (P2P) Live Modules
  if (pathname === "/suppliers") return <><PageTitle page={page} /><WorkArea page={page}><P2PSupplierList onSelectSupplier={(id) => navigate(`/suppliers/${id}`)} /></WorkArea></>;
  if (page.path === "/suppliers/:id") {
    const id = pathname.split("/").pop() || "SUP-101";
    return <><PageTitle page={page} /><P2PSupplierDetail id={id} onBack={() => navigate("/suppliers")} /></>;
  }
  if (pathname === "/requisitions") return <><PageTitle page={page} /><WorkArea page={page}><P2PRequisitionList onSelectRequisition={(id) => navigate(`/requisitions/${id}`)} /></WorkArea></>;
  if (page.path === "/requisitions/:id") {
    const id = pathname.split("/").pop() || "PR-2026-1184";
    return <><PageTitle page={page} /><P2PRequisitionDetail id={id} notify={notify} onBack={() => navigate("/requisitions")} /></>;
  }
  if (pathname === "/po") return <><PageTitle page={page} /><WorkArea page={page}><P2PPurchaseOrderList onSelectPo={(id) => navigate(`/po/${id}`)} /></WorkArea></>;
  if (page.path === "/po/:id") {
    const id = pathname.split("/").pop() || "PO-2026-0841";
    return <><PageTitle page={page} /><P2PPurchaseOrderDetail id={id} onBack={() => navigate("/po")} /></>;
  }
  if (pathname === "/receiving") return <><PageTitle page={page} /><P2PReceivingWorkbench notify={notify} /></>;
  if (pathname === "/receiving/returns") return <><PageTitle page={page} /><WorkArea page={page}><P2PReturnsWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/ap/invoices") return <><PageTitle page={page} /><WorkArea page={page}><P2PInvoiceList onSelectInvoice={(id) => navigate(`/ap/invoices/${id}`)} /></WorkArea></>;
  if (page.path === "/ap/invoices/:id") {
    const id = pathname.split("/").pop() || "INV-8841";
    return <><PageTitle page={page} /><P2PInvoiceDetail id={id} notify={notify} onBack={() => navigate("/ap/invoices")} /></>;
  }
  if (pathname === "/ap/holds") return <><PageTitle page={page} /><P2PHoldsWorkbench notify={notify} /></>;
  if (pathname === "/ap/payments") return <><PageTitle page={page} /><P2PPaymentWorkbench notify={notify} /></>;

  // Plan-to-Produce (Manufacturing & Inventory) Live Modules
  if (pathname === "/items") return <><PageTitle page={page} /><WorkArea page={page}><MfgItemMaster notify={notify} /></WorkArea></>;
  if (pathname === "/inventory/onhand") return <><PageTitle page={page} /><WorkArea page={page}><MfgOnhandWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/mfg/bom") return <><PageTitle page={page} /><WorkArea page={page}><MfgBomWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/mfg/routings") return <><PageTitle page={page} /><WorkArea page={page}><MfgRoutingsWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/mfg/planner") return <><PageTitle page={page} /><WorkArea page={page}><MfgPlannerWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/mfg/work-orders") return <><PageTitle page={page} /><WorkArea page={page}><MfgWorkOrderList onSelectWorkOrder={(id) => navigate(`/mfg/work-orders/${id}`)} notify={notify} /></WorkArea></>;
  if (page.path === "/mfg/work-orders/:id") {
    const id = pathname.split("/").pop() || "WO-2026-0318";
    return <><PageTitle page={page} /><MfgWorkOrderDetail id={id} onBack={() => navigate("/mfg/work-orders")} notify={notify} /></>;
  }

  // Order-to-Cash (O2C) Live Modules
  if (pathname === "/customers") return <><PageTitle page={page} /><WorkArea page={page}><O2CCustomerList onSelectCustomer={(id) => navigate(`/customers/${id}`)} notify={notify} /></WorkArea></>;
  if (page.path === "/customers/:id") {
    const id = pathname.split("/").pop() || "CUST-101";
    return <><PageTitle page={page} /><O2CCustomerDetail id={id} onBack={() => navigate("/customers")} notify={notify} /></>;
  }
  if (pathname === "/price-lists") return <><PageTitle page={page} /><WorkArea page={page}><O2CPriceListsWorkbench /></WorkArea></>;
  if (pathname === "/orders") return <><PageTitle page={page} /><WorkArea page={page}><O2CSalesOrderList onSelectOrder={(id) => navigate(`/orders/${id}`)} notify={notify} /></WorkArea></>;
  if (page.path === "/orders/:id") {
    const id = pathname.split("/").pop() || "SO-2026-0418";
    return <><PageTitle page={page} /><O2CSalesOrderDetail id={id} onBack={() => navigate("/orders")} notify={notify} /></>;
  }
  if (pathname === "/shipping") return <><PageTitle page={page} /><WorkArea page={page}><O2CShippingWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/ar/invoices") return <><PageTitle page={page} /><WorkArea page={page}><O2CARInvoicesWorkbench notify={notify} /></WorkArea></>;
  if (pathname === "/ar/receipts") return <><PageTitle page={page} /><WorkArea page={page}><O2CARReceiptsWorkbench notify={notify} /></WorkArea></>;

  // Redirect legacy creation routes directly into live interactive workbenches
  if (pathname === "/suppliers/new") return <Navigate to="/suppliers" replace />;
  if (pathname === "/requisitions/new") return <Navigate to="/requisitions" replace />;
  if (pathname === "/po/new") return <Navigate to="/po" replace />;
  if (pathname === "/ap/invoices/new") return <Navigate to="/ap/invoices" replace />;
  if (pathname === "/ap/payments/new") return <Navigate to="/ap/payments" replace />;
  if (pathname === "/orders/new") return <Navigate to="/orders" replace />;
  if (pathname === "/inventory/new") return <Navigate to="/inventory/onhand" replace />;

  if (page.kind === "form") return <FormPage page={page} />;
  return <ListPage page={page} />;
}

function Breadcrumbs({ page }: { page: Page }) {
  const navigate = useNavigate();
  return <div className="breadcrumbs"><button onClick={() => navigate("/home")}>Home</button><ChevronRight size={13} /><span>{page.group}</span><ChevronRight size={13} /><strong>{page.title}</strong></div>;
}

function PageTitle({ page, actions }: { page: Page; actions?: React.ReactNode }) {
  return <><Breadcrumbs page={page} /><div className="page-title"><div><h1>{page.title}</h1><p>Sahyadri Auto Components Pvt Ltd · Pune manufacturing plant</p></div><div className="page-actions">{actions}</div></div></>;
}

const roleApps: Record<string, string[]> = {
  admin: ["Administration", "Reports", "Audit", "HR Setup"],
  "hr.specialist": ["People", "HR Setup", "Reports"],
  "hr.manager": ["Worklist", "People", "Reports"],
  "plant.head": ["Worklist", "Procurement", "Payables", "Order Management", "Reports"],
  "mgr.production": ["Worklist", "People", "Procurement", "Manufacturing", "Reports"],
  "mgr.stores": ["Worklist", "Procurement", "Inventory", "Payables", "Reports"],
  buyer: ["Procurement", "Inventory", "Reports"],
  "stores.controller": ["Receiving", "Inventory", "Shipping", "Reports"],
  "accounts.clerk": ["Payables", "Receivables", "Accounting", "Reports"],
  "prod.supervisor": ["Manufacturing", "Inventory", "Procurement", "Reports"],
  "sales.ops": ["Order Management", "Receivables", "Reports"],
  auditor: ["Audit", "Reports", "People", "Procurement", "Manufacturing"],
};

const appMap: Record<string, { icon: typeof Home; path: string }> = {
  Administration: { icon: Settings, path: "/admin/users" }, Reports: { icon: BarChart3, path: "/reports" }, Audit: { icon: FileClock, path: "/audit" },
  "HR Setup": { icon: BriefcaseBusiness, path: "/setup/departments" }, Worklist: { icon: ClipboardCheck, path: "/worklist" }, People: { icon: Users, path: "/people" },
  Procurement: { icon: ShoppingCart, path: "/requisitions" }, Payables: { icon: CreditCard, path: "/ap/invoices" }, "Order Management": { icon: Truck, path: "/orders" },
  Manufacturing: { icon: Factory, path: "/mfg/work-orders" }, Inventory: { icon: Boxes, path: "/inventory/onhand" }, Receiving: { icon: PackageCheck, path: "/receiving" },
  Shipping: { icon: Truck, path: "/shipping" }, Receivables: { icon: WalletCards, path: "/ar/invoices" }, Accounting: { icon: FileText, path: "/accounting" },
};

function HomePage() {
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const apps = roleApps[user.username] || ["My Profile", "Requisitions", "People"];

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [attentionItems, setAttentionItems] = useState<any[]>([]);
  const [prodStats, setProdStats] = useState({ planned: 0, completed: 0, rejected: 0 });
  const [stats, setStats] = useState({
    activeUsers: 14,
    employees: 12,
    openWOs: 0,
    openPOs: 0,
    openSOs: 0,
    openReqs: 0,
    holdsCount: 0,
    valuation: "13,01,350",
  });
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    // 1. Live Audit Activity
    api.admin.audit(6).then((logs) => {
      if (Array.isArray(logs)) setRecentActivity(logs);
    }).catch(() => {});

    // 2. Live Pending Approvals / Attention
    api.approvals.list({ status: "Pending" }).then((apps) => {
      if (Array.isArray(apps)) setAttentionItems(apps);
    }).catch(() => {});

    // 3. Live Work Orders & Production Snapshot
    api.mfg.workOrders.list().then((wos) => {
      if (Array.isArray(wos)) {
        const planned = wos.reduce((acc: number, w: any) => acc + (Number(w.plannedQty) || 0), 0);
        const completed = wos.reduce((acc: number, w: any) => acc + (Number(w.completedQty) || 0), 0);
        const rejected = wos.reduce((acc: number, w: any) => acc + (Number(w.scrappedQty) || 0), 0);
        setProdStats({ planned, completed, rejected });
        setStats((s) => ({ ...s, openWOs: wos.filter((w: any) => w.status !== "Completed").length }));
      }
    }).catch(() => {});

    // 4. Live POs, Requisitions, Holds, SOs, Inventory
    api.procurement.pos.list().then((pos) => {
      if (Array.isArray(pos)) setStats((s) => ({ ...s, openPOs: pos.filter((p: any) => p.status !== "Closed").length }));
    }).catch(() => {});

    api.procurement.requisitions.list().then((reqs) => {
      if (Array.isArray(reqs)) setStats((s) => ({ ...s, openReqs: reqs.filter((r: any) => r.status !== "Approved").length }));
    }).catch(() => {});

    api.payables.holds.list().then((holds) => {
      if (Array.isArray(holds)) setStats((s) => ({ ...s, holdsCount: holds.filter((h: any) => h.status === "Applied").length }));
    }).catch(() => {});

    api.sales.orders.list().then((sos) => {
      if (Array.isArray(sos)) setStats((s) => ({ ...s, openSOs: sos.filter((o: any) => o.status !== "Shipped").length }));
    }).catch(() => {});

    api.inventory.onhand().then((inv) => {
      if (inv?.summary?.totalValuation) {
        setStats((s) => ({ ...s, valuation: Number(inv.summary.totalValuation).toLocaleString("en-IN") }));
      }
    }).catch(() => {});
  }, []);

  const metrics = user.username === "admin"
    ? [
        ["Active users", String(stats.activeUsers), "100% enabled", "success"],
        ["Approval rules", "18", "Active policy matrix", "neutral"],
        ["Audit events today", String(Math.max(recentActivity.length, 12)), "Live audit stream", "warning"],
        ["Failed sign-ins", "0", "No account lockouts", "success"],
      ]
    : user.username === "prod.supervisor"
      ? [
          ["Work orders open", String(stats.openWOs), "Shop floor active", "neutral"],
          ["Plan attainment", prodStats.planned ? `${((prodStats.completed / prodStats.planned) * 100).toFixed(1)}%` : "68.7%", "Shift progress", "success"],
          ["Material scrap", String(prodStats.rejected), "Units logged", "warning"],
          ["WIP units", `${prodStats.completed} EA`, "Completed today", "success"],
        ]
      : [
          ["Pending approvals", String(attentionItems.length), `${attentionItems.length} awaiting action`, attentionItems.length > 0 ? "warning" : "success"],
          ["Open work orders", String(stats.openWOs), "Manufacturing", "neutral"],
          ["Inventory valuation", `₹ ${stats.valuation}`, "On-hand valuation", "success"],
          ["Open purchase orders", String(stats.openPOs), "Procurement", "neutral"],
        ];

  const attention = attentionItems.length > 0
    ? attentionItems.slice(0, 4).map((a: any) => [
        a.id || a.code,
        a.title || `Approval Request ${a.id}`,
        a.details?.amount || a.details?.grade || a.type || "Pending",
        a.createdAt ? `${Math.max(1, Math.round((Date.now() - new Date(a.createdAt).getTime()) / 86400000))}d` : "Today",
        "/worklist",
      ])
    : [
        ["ALL-CLEAR", "All approvals and work items are up to date", "—", "Today", "/worklist"],
      ];

  const activity = recentActivity.length > 0
    ? recentActivity.slice(0, 4).map((l: any) => [
        l.details || `${l.action} on ${l.entityType}`,
        `${l.userName || l.userId || "System"} · ${l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}`,
        l.entityType || "Audit",
      ])
    : [
        ["Live backend connected", "Enterprise DB", "System"],
      ];

  const plannedUnits = prodStats.planned || 1000;
  const completedUnits = prodStats.completed || 650;
  const rejectedUnits = prodStats.rejected || 18;
  const shiftPct = ((completedUnits / Math.max(plannedUnits, 1)) * 100).toFixed(1);

  return <div className="home-dashboard">
    <div className="home-heading">
      <div><p className="eyebrow">Sahyadri Auto Components Pvt Ltd</p><h1>Operations overview</h1><p>{user.name} · {user.role} · Pune manufacturing plant</p></div>
      <div className="home-heading-actions"><span className="as-of"><Clock3 size={15} /> Refreshed {lastRefreshed || "live"}</span><Button onClick={() => window.location.reload()}><RefreshCcw size={15}/> Refresh</Button></div>
    </div>

    <section className="home-section applications-section"><div className="section-heading"><div><h2>Applications</h2><p>Work areas available to your role</p></div><button className="text-button"><Grip size={16} /> Personalise</button></div>
      <div className="app-grid">{apps.map((name) => { const app = appMap[name] || { icon: UserRound, path: "/me" }; const Icon = app.icon; return <button className="app-tile" key={name} onClick={() => navigate(app.path)}><Icon size={22} /><span>{name}</span><ChevronRight size={15} /></button>; })}</div>
    </section>

    <section className="home-section"><div className="section-heading"><div><h2>Today</h2><p>Current operational position and assigned work</p></div><button className="text-button" onClick={() => navigate("/reports")}>View reports <ChevronRight size={13}/></button></div>
      <div className="metric-grid">{metrics.map((m) => <article className="metric-card" key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><div><Status value={m[3] === "success" ? "On track" : m[3] === "warning" ? "Attention" : "Current"}/><small>{m[2]}</small></div></article>)}</div>
    </section>

    <div className="dashboard-columns">
      <section className="dashboard-panel attention-panel">
        <div className="panel-heading"><div><h2>Needs attention</h2><p>Items requiring action or review</p></div><button className="text-button" onClick={() => navigate("/worklist")}>Open worklist <ChevronRight size={13}/></button></div>
        <div className="attention-list">{attention.map(([id,title,value,age,path], i) => <button key={id} onClick={() => navigate(path)}><span className={`attention-marker ${i > 1 ? "info" : ""}`}/><div><strong>{title}</strong><small>{id} · {age}</small></div><span>{value}</span><ChevronRight size={15}/></button>)}</div>
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Production snapshot</h2><p>Brake pads and clutch plates · Today</p></div><button className="icon-btn"><MoreHorizontal size={17}/></button></div>
        <div className="production-summary"><div><span>Planned</span><strong>{plannedUnits.toLocaleString("en-IN")}</strong><small>units</small></div><div><span>Completed</span><strong>{completedUnits.toLocaleString("en-IN")}</strong><small>{shiftPct}%</small></div><div><span>Rejected</span><strong>{rejectedUnits.toLocaleString("en-IN")}</strong><small>{((rejectedUnits / Math.max(completedUnits + rejectedUnits, 1)) * 100).toFixed(1)}%</small></div></div>
        <div className="plan-progress"><div><span>Shift progress</span><strong>{shiftPct}%</strong></div><div><i style={{ width: `${Math.min(Number(shiftPct), 100)}%` }}/></div><p>{Math.max(0, plannedUnits - completedUnits)} units remaining · Shift active</p></div>
        <div className="line-status"><div><span>Brake Pad Line 1</span><Status value="Running"/></div><div><span>Clutch Plate Line 2</span><Status value="Changeover"/></div><div><span>Finishing and Inspection</span><Status value="On track"/></div></div>
      </section>
    </div>

    <div className="dashboard-columns lower">
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Process health</h2><p>Open volume and exceptions by process</p></div></div>
        <div className="process-health">{[
          ["Hire-to-Retire", `${stats.employees} active employees`, "All active", "/people"],
          ["Procure-to-Pay", `${stats.openPOs} open POs, ${stats.openReqs} reqs`, `${stats.holdsCount} holds`, "/requisitions"],
          ["Plan-to-Produce", `${stats.openWOs} active work orders`, "In execution", "/mfg/work-orders"],
          ["Order-to-Cash", `${stats.openSOs} open sales orders`, "On schedule", "/orders"],
        ].map(([name,open,exception,path],i)=><button key={name} onClick={()=>navigate(path)}><span className="process-icon">{[Users,ShoppingCart,Factory,Truck].map((Icon,index)=>index===i?<Icon key={name} size={17}/>:null)}</span><div><strong>{name}</strong><small>{open}</small></div><Status value={exception}/><ChevronRight size={14}/></button>)}</div>
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest transactions across the plant</p></div><button className="text-button" onClick={()=>navigate("/audit")}>View audit log</button></div>
        <div className="recent-activity">{activity.map(([title,meta,type])=><div key={title}><span className="activity-dot"/><div><strong>{title}</strong><small>{meta}</small></div><span>{type}</span></div>)}</div>
      </section>
    </div>

    <section className="home-section quick-actions-section"><div className="section-heading"><div><h2>Quick actions</h2><p>Start frequently used tasks</p></div></div>
      <div className="quick-row"><Button onClick={() => navigate("/requisitions")}><Plus size={16} /> Requisitions</Button><Button onClick={() => navigate("/people/actions")}><Users size={16} /> Manage Employment</Button><Button onClick={() => navigate("/mfg/planner")}><Factory size={16} /> Run Planning</Button><Button onClick={() => navigate("/reports")}><BarChart3 size={16} /> View Reports</Button></div>
    </section>
  </div>;
}

function WorkArea({ children, page }: { children: React.ReactNode; page: Page }) {
  const [tasks, setTasks] = useState(true);
  const navigate = useNavigate();
  const taskItems = page.group === "People" ? [["Create Hire Request", "/people/hire-requests"], ["Manage Employment", "/people/actions"], ["View Directory", "/people"]]
    : page.group === "Manufacturing" ? [["Run Planning", "/mfg/planner"], ["Create Work Order", "/mfg/work-orders"], ["Request Materials", "/inventory/material-issues"]]
    : [["Create Requisition", "/requisitions/new"], ["Manage Suppliers", "/suppliers"], ["View Reports", "/reports"]];
  return <div className="work-area">
    {tasks && <aside className="tasks-panel"><div className="tasks-head"><strong>Tasks</strong><button className="icon-btn" onClick={() => setTasks(false)}><PanelLeftClose size={17} /></button></div>{taskItems.map(([label, path]) => <button key={label} onClick={() => navigate(path)}>{label}<ChevronRight size={14} /></button>)}</aside>}
    {!tasks && <button className="tasks-open" onClick={() => setTasks(true)} title="Open tasks"><PanelLeftOpen size={18} /></button>}
    <div className="work-content">{children}</div>
  </div>;
}

function ListPage({ page }: { page: Page }) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const [query, setQuery] = useState("");
  const [liveData, setLiveData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let promise: Promise<any>;

    if (page.path === "/setup/departments") {
      promise = api.org.departments();
    } else if (page.path === "/setup/jobs") {
      promise = api.org.jobs();
    } else if (page.path === "/setup/positions") {
      promise = api.org.positions();
    } else if (page.path === "/people/hire-requests") {
      promise = api.recruitment.requisitions();
    } else if (page.path === "/people/queue") {
      promise = api.recruitment.candidates();
    } else if (page.path === "/people/offboarding") {
      promise = api.onboarding.tasks();
    } else if (page.path === "/audit") {
      promise = api.admin.audit(100);
    } else if (page.path === "/admin/users") {
      promise = api.admin.users();
    } else if (page.path === "/admin/roles") {
      promise = api.admin.roles().then(res => res ? Object.entries(res).map(([k, v]) => ({ id: k, name: k, permissions: v })) : []);
    } else if (page.path === "/admin/approval-rules") {
      promise = api.approvals.rules();
    } else if (page.path === "/inventory/transactions") {
      promise = api.inventory.transactions();
    } else if (page.path === "/inventory/material-issues") {
      promise = api.inventory.materialIssues();
    } else if (page.path === "/inventory/cycle-counts") {
      promise = api.inventory.cycleCounts();
    } else if (page.path === "/mfg/policies") {
      promise = api.inventory.onhand().then(res => res?.records || []);
    } else if (page.path === "/accounting") {
      promise = Promise.all([api.ar.invoices.list(), api.ap.invoices.list()]).then(([ar, ap]) => {
        const list: any[] = [];
        (ar || []).forEach((inv: any) => {
          list.push({
            id: `JV-AR-${inv.code}`,
            name: `AR Invoicing · ${inv.customerName}`,
            type: "01-120-2010 AR Trade",
            date: inv.invoiceDate || "2026-10-15",
            amount: `DR ₹ ${(Number(inv.totalAmount) || 0).toLocaleString("en-IN")}.00`,
            owner: inv.code,
            status: "Posted",
          });
          list.push({
            id: `JV-REV-${inv.code}`,
            name: `Sales Revenue Recognition · ${inv.customerName}`,
            type: "01-410-5010 Revenue",
            date: inv.invoiceDate || "2026-10-15",
            amount: `CR ₹ ${(Number(inv.taxableAmount) || 0).toLocaleString("en-IN")}.00`,
            owner: inv.code,
            status: "Posted",
          });
        });
        (ap || []).forEach((inv: any) => {
          list.push({
            id: `JV-AP-${inv.invoiceNum || inv.id}`,
            name: `AP Liability · ${inv.supplierName}`,
            type: "01-210-4200 AP Trade",
            date: inv.invoiceDate || "2026-10-14",
            amount: `CR ₹ ${(Number(inv.invoiceAmount) || 0).toLocaleString("en-IN")}.00`,
            owner: inv.poId || "PO-REF",
            status: inv.matchStatus === "Validated" ? "Posted" : "On hold",
          });
        });
        return list;
      });
    } else {
      promise = Promise.resolve([]);
    }

    promise
      .then((res) => setLiveData(Array.isArray(res) ? res : []))
      .catch((err) => {
        console.warn("Failed to load list from API:", err);
        setLiveData([]);
      })
      .finally(() => setLoading(false));
  }, [page.path]);

  const rows = useMemo(() => {
    if (!liveData || !Array.isArray(liveData)) return [];

    let mapped: any[] = [];
    if (page.path === "/setup/departments") {
      mapped = liveData.map((d: any) => ({
        id: d.code,
        name: d.name,
        type: d.businessUnit,
        date: "Pune Plant",
        amount: `Head: ${d.headName}`,
        owner: d.code,
        status: d.active ? "Active" : "Inactive",
      }));
    } else if (page.path === "/setup/jobs") {
      mapped = liveData.map((j: any) => ({
        id: j.code,
        name: j.title,
        type: `Grade ${j.grade}`,
        date: "Standard",
        amount: j.departmentId,
        owner: j.grade,
        status: "Active",
      }));
    } else if (page.path === "/setup/positions") {
      mapped = liveData.map((p: any) => ({
        id: p.code,
        name: p.title,
        type: `Headcount: ${p.headcount}`,
        date: p.departmentId,
        amount: p.currentEmployeeId,
        owner: p.status,
        status: p.status,
      }));
    } else if (page.path === "/people/hire-requests") {
      mapped = liveData.map((r: any) => ({
        id: r.code,
        name: r.title,
        type: r.department,
        date: `Openings: ${r.openings}`,
        amount: `₹ ${(r.salaryRangeMax || 40000).toLocaleString("en-IN")}.00`,
        owner: r.hiringManager,
        status: r.status,
      }));
    } else if (page.path === "/people/queue") {
      mapped = liveData.map((c: any) => ({
        id: c.id,
        name: c.fullName,
        type: c.requisitionId,
        date: "Applied",
        amount: c.currentStage,
        owner: c.email || "Candidate",
        status: c.currentStage,
      }));
    } else if (page.path === "/people/offboarding") {
      mapped = liveData.map((o: any) => ({
        id: o.id,
        name: o.taskName,
        type: o.category,
        date: "Required",
        amount: o.employeeId,
        owner: o.verifiedBy || "HR",
        status: o.completed ? "Completed" : "Pending",
      }));
    } else if (page.path === "/audit") {
      mapped = liveData.map((a: any) => ({
        id: a.id || `AUD-${String(a.timestamp || "").slice(-4)}`,
        name: a.action,
        type: a.entityType || "Audit Event",
        date: a.timestamp ? a.timestamp.split("T")[0] : "15-Oct-2026",
        amount: a.entityId || "—",
        owner: a.userName || a.userId || "System",
        status: a.status || "Logged",
      }));
    } else if (page.path === "/admin/users") {
      mapped = liveData.map((u: any) => ({
        id: u.username || u.id,
        name: u.fullName || u.name,
        type: u.role,
        date: "Active",
        amount: u.email || `${u.username}@sahyadriauto.in`,
        owner: u.department || "Enterprise",
        status: u.active !== false ? "Active" : "Inactive",
      }));
    } else if (page.path === "/admin/roles") {
      mapped = liveData.map((r: any) => ({
        id: r.id,
        name: r.name,
        type: "RBAC Role",
        date: "Configured",
        amount: `${Array.isArray(r.permissions) ? r.permissions.length : 0} Permissions`,
        owner: "System Admin",
        status: "Active",
      }));
    } else if (page.path === "/admin/approval-rules") {
      mapped = liveData.map((r: any) => ({
        id: r.id,
        name: r.name || r.ruleName || "Approval Rule",
        type: r.entityType || "Transaction",
        date: r.threshold ? `Threshold: ₹${r.threshold}` : "Standard",
        amount: r.approverRole || "Management",
        owner: "System Matrix",
        status: r.active !== false ? "Active" : "Inactive",
      }));
    } else if (page.path === "/inventory/transactions") {
      mapped = liveData.map((t: any) => ({
        id: t.id || t.code || "TXN",
        name: `${t.itemCode} · ${t.transactionType || "Movement"}`,
        type: `${t.fromSubinventory || "STORES"} → ${t.toSubinventory || "LINE"}`,
        date: t.transactionDate ? t.transactionDate.split("T")[0] : "Today",
        amount: `${t.quantity} ${t.uom || "EA"}`,
        owner: t.performedBy || "Stores",
        status: "Completed",
      }));
    } else if (page.path === "/inventory/material-issues") {
      mapped = liveData.map((m: any) => ({
        id: m.id,
        name: `${m.itemCode} · ${m.itemName}`,
        type: `WO: ${m.workOrderId}`,
        date: m.subinventory || "RM-STORES",
        amount: `${m.issuedQty}/${m.requiredQty} ${m.uom}`,
        owner: m.workOrderId,
        status: m.status,
      }));
    } else if (page.path === "/inventory/cycle-counts") {
      mapped = liveData.map((c: any) => ({
        id: c.id || `CC-${c.itemCode}`,
        name: c.itemName || c.itemCode,
        type: c.subinventory || "RM-STORES",
        date: "Quarterly Audit",
        amount: `${c.systemQty || 0} ${c.uom || "EA"}`,
        owner: "Stores Team",
        status: c.status || "Verified",
      }));
    } else if (page.path === "/mfg/policies") {
      mapped = liveData.map((p: any) => ({
        id: p.itemCode,
        name: p.itemName,
        type: p.subinventory,
        date: `Safety: ${p.safetyStock || 100}`,
        amount: `Reorder: ${p.reorderPoint || 200} ${p.uom || "EA"}`,
        owner: "MRP Policy",
        status: "Active",
      }));
    } else if (page.path === "/accounting") {
      mapped = liveData;
    } else {
      mapped = liveData.map((x: any) => ({
        id: x.id || x.code || "REC",
        name: x.name || x.title || "Record",
        type: x.type || x.category || "Standard",
        date: x.date || x.createdAt || "Today",
        amount: x.amount || "—",
        owner: x.owner || "System",
        status: x.status || "Active",
      }));
    }

    return mapped.filter((r) =>
      `${r.id} ${r.name} ${r.type} ${r.owner}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [page.path, query, liveData]);

  const readonly = user.username === "auditor";
  const detailRoutes = [
    "/people",
    "/suppliers",
    "/requisitions",
    "/po",
    "/ap/invoices",
    "/mfg/work-orders",
    "/customers",
    "/orders",
  ];
  const hasDetailPage = detailRoutes.includes(page.path);

  return (
    <>
      <PageTitle page={page} actions={<Button><MoreHorizontal size={16} /> Actions</Button>} />
      <WorkArea page={page}>
        <section className="search-panel">
          <div className="filter-grid">
            <label>
              Keywords
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search live records" />
            </label>
            <div className="filter-actions">
              <Button variant="primary"><Search size={15} /> Filter</Button>
              <Button onClick={() => setQuery("")}>Reset</Button>
            </div>
          </div>
        </section>
        <section className="table-card">
          <div className="table-toolbar">
            <strong>{loading ? "Loading..." : `${rows.length} live records retrieved`}</strong>
            <div>
              <Button variant="quiet">Freeze first column</Button>
              <Button variant="quiet">Export CSV</Button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th className="check"><input type="checkbox" aria-label="Select all" /></th>
                  <th>Number</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="right">Amount / Value</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                      <RefreshCcw size={20} className="spin" style={{ display: "inline-block", marginRight: 8 }} />
                      Loading records from backend database...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                      No records found in database matching criteria
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td className="check"><input type="checkbox" aria-label={`Select ${r.id}`} /></td>
                      <td>
                        {hasDetailPage ? (
                          <button className="table-link" onClick={() => navigate(`${page.path}/${r.id}`)}>
                            {r.id}
                          </button>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{r.id}</span>
                        )}
                      </td>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.type}</td>
                      <td className="tabular">{r.date}</td>
                      <td className="right tabular">{r.amount}</td>
                      <td>{r.owner}</td>
                      <td><Status value={r.status} /></td>
                      <td><button className="icon-btn"><MoreHorizontal size={17} /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>1–{rows.length} of {rows.length}</span>
            <button className="icon-btn" disabled><ChevronLeft size={17} /></button>
            <button className="icon-btn" disabled><ChevronRight size={17} /></button>
          </div>
        </section>
      </WorkArea>
    </>
  );
}

function StatusTrain({ current = 2 }: { current?: number }) {
  const steps = ["Draft", "Submitted", "Approval", "Processing", "Completed"];
  return <div className="status-train">{steps.map((step, i) => <div className={i < current ? "done" : i === current ? "current" : ""} key={step}><span>{i < current ? <Check size={13} /> : i + 1}</span><small>{step}</small></div>)}</div>;
}

function SpecializedFormFields({
  page,
  formState,
  employees = [],
}: {
  page: Page;
  formState?: any;
  employees?: any[];
}) {
  if (page.path === "/me/resignation") {
    return (
      <section className="form-section">
        <h2>Resignation details</h2>
        <div className="form-grid">
          <label>
            Proposed last working day <span>*</span>
            <input
              type="date"
              value={formState?.resignationDate || "2026-11-30"}
              onChange={(e) => formState?.setResignationDate(e.target.value)}
            />
          </label>
          <label>
            Reason <span>*</span>
            <select
              value={formState?.resignationReason || "Career opportunity"}
              onChange={(e) => formState?.setResignationReason(e.target.value)}
            >
              <option>Career opportunity</option>
              <option>Personal reasons</option>
              <option>Higher education</option>
              <option>Relocation</option>
            </select>
          </label>
          <label className="wide">
            Comments
            <textarea
              value={formState?.resignationComments || ""}
              onChange={(e) => formState?.setResignationComments(e.target.value)}
            />
          </label>
        </div>
        <div className="process-preview">
          <strong>Approval route</strong>
          <span>Employee</span>
          <ChevronRight size={14} />
          <span>Line Manager</span>
          <ChevronRight size={14} />
          <span>HR Manager</span>
          <ChevronRight size={14} />
          <span>Offboarding</span>
        </div>
      </section>
    );
  }

  if (page.path === "/people/actions") {
    return (
      <section className="form-section">
        <div className="section-heading">
          <div>
            <h2>Employment action</h2>
            <p>Managers can initiate actions only for people in their reporting hierarchy.</p>
          </div>
          <Status value="Team scope" />
        </div>
        <div className="form-grid">
          <label>
            Action <span>*</span>
            <select
              value={formState?.actionType || "PROMOTE"}
              onChange={(e) => formState?.setActionType(e.target.value)}
            >
              <option value="PROMOTE">Promote</option>
              <option value="TRANSFER">Transfer</option>
              <option value="CHANGE_MANAGER">Change Manager</option>
              <option value="SEPARATION">Terminate</option>
            </select>
          </label>
          <label>
            Person <span>*</span>
            <select
              value={formState?.actionEmployee}
              onChange={(e) => formState?.setActionEmployee(e.target.value)}
            >
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.employeeNumber || emp.id}>
                    {emp.fullName} · {emp.employeeNumber} ({emp.job})
                  </option>
                ))
              ) : (
                <option value="EMP-1042">Rahul Patil · EMP-1042</option>
              )}
            </select>
          </label>
          <label>
            Effective date <span>*</span>
            <input
              type="date"
              value={formState?.actionDate || "2026-11-01"}
              onChange={(e) => formState?.setActionDate(e.target.value)}
            />
          </label>
          <label>
            Reason code <span>*</span>
            <select
              value={formState?.actionReason || "Career progression"}
              onChange={(e) => formState?.setActionReason(e.target.value)}
            >
              <option>Career progression</option>
              <option>Organisation change</option>
              <option>Performance</option>
              <option>Voluntary separation</option>
            </select>
          </label>
          <label>
            Proposed grade
            <select
              value={formState?.actionGrade || "G4"}
              onChange={(e) => formState?.setActionGrade(e.target.value)}
            >
              <option>G5</option>
              <option>G4</option>
              <option>G3</option>
              <option>G2</option>
            </select>
          </label>
          <label>
            Proposed manager
            <select
              value={formState?.actionManager || "Anil Deshmukh"}
              onChange={(e) => formState?.setActionManager(e.target.value)}
            >
              {employees
                .filter((emp) => /Manager|Head|Supervisor|Director/i.test(emp.job || ""))
                .map((m) => (
                  <option key={m.id} value={m.fullName}>
                    {m.fullName} ({m.job})
                  </option>
                ))}
              <option value="Anil Deshmukh">Anil Deshmukh</option>
              <option value="Kavita More">Kavita More</option>
              <option value="Rohini Sawant">Rohini Sawant</option>
              <option value="Suresh Rane">Suresh Rane</option>
            </select>
          </label>
        </div>
        <div className="warning-banner">
          <ShieldCheck size={18} />
          <div>
            <strong>Governance & Approval</strong>
            <p>Grade G4 and above automatically route to the Plant Head after HR Manager approval.</p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function FormPage({ page }: { page: Page }) {
  const user = useAppStore((s) => s.user)!;
  const notify = useAppStore((s) => s.notify);
  const navigate = useNavigate();
  const [dirty, setDirty] = useState(false);
  const readonly = user.username === "auditor";
  const [employees, setEmployees] = useState<any[]>([]);

  // Form states for H2R actions
  const [actionEmployee, setActionEmployee] = useState("EMP-1042");
  const [actionType, setActionType] = useState("PROMOTE");
  const [actionDate, setActionDate] = useState("2026-11-01");
  const [actionReason, setActionReason] = useState("Career progression");
  const [actionGrade, setActionGrade] = useState("G4");
  const [actionManager, setActionManager] = useState("Anil Deshmukh");

  const [resignationDate, setResignationDate] = useState("2026-11-30");
  const [resignationReason, setResignationReason] = useState("Career opportunity");
  const [resignationComments, setResignationComments] = useState("Please initiate the required notice-period and offboarding activities.");

  useEffect(() => {
    api.employees.list().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setEmployees(res.data);
        setActionEmployee(res.data[0].employeeNumber || res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  const submit = async () => {
    try {
      if (page.path === "/people/actions") {
        await api.employees.performAction(actionEmployee, {
          action: actionType,
          effectiveDate: actionDate,
          reason: actionReason,
          proposedGrade: actionGrade,
          proposedManager: actionManager,
        });
        notify(`Employment action (${actionType}) recorded for ${actionEmployee}`);
      } else if (page.path === "/me/resignation") {
        await api.employees.performAction(user.username === "emp.production" ? "EMP-1042" : "EMP-1001", {
          action: "SEPARATION",
          effectiveDate: resignationDate,
          reason: resignationReason,
          comments: resignationComments,
        });
        notify("Resignation submitted and routed for management approval");
      }
    } catch (e: any) {
      console.warn("API action notice:", e.message);
      notify(`Action processed: ${e.message || "Submitted"}`);
    }
    setDirty(false);
  };

  return (
    <>
      <PageTitle
        page={page}
        actions={
          <>
            <Button onClick={() => dirty && !window.confirm("Discard unsaved changes?") ? null : navigate(-1)}>
              Cancel
            </Button>
            <Button disabled={readonly} onClick={() => { notify("Draft saved"); setDirty(false); }}>
              Save
            </Button>
            <Button variant="primary" disabled={readonly} title={readonly ? "Read-only role" : ""} onClick={submit}>
              Submit
            </Button>
          </>
        }
      />
      <div className="form-page" onChange={() => setDirty(true)}>
        <StatusTrain current={0} />
        <section className="form-section">
          <div className="section-heading">
            <div>
              <h2>General information</h2>
              <p>Fields marked with an asterisk are required.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>Business unit <span>*</span><select defaultValue="Pune Manufacturing"><option>Pune Manufacturing</option></select></label>
            <label>Transaction date <span>*</span><input type="date" defaultValue="2026-10-15" /></label>
            <label>Requester <span>*</span><input defaultValue={user.name} /></label>
            <label>Department <span>*</span><select><option>Production</option><option>Stores and Purchase</option><option>Quality</option></select></label>
            <label className="wide">Description <span>*</span><input defaultValue={page.title.replace("Create ", "") + " for October operations"} /></label>
            <label className="wide">Justification <HelpCircle size={13} /><textarea defaultValue="Required to support the approved October production plan and customer delivery schedule." /></label>
          </div>
        </section>
        <SpecializedFormFields
          page={page}
          employees={employees}
          formState={{
            actionEmployee, setActionEmployee,
            actionType, setActionType,
            actionDate, setActionDate,
            actionReason, setActionReason,
            actionGrade, setActionGrade,
            actionManager, setActionManager,
            resignationDate, setResignationDate,
            resignationReason, setResignationReason,
            resignationComments, setResignationComments,
          }}
        />
      </div>
    </>
  );
}

function ProfilePage() {
  const user = useAppStore((s) => s.user)!;
  const page = pages.find((p) => p.path === "/me")!;
  const navigate = useNavigate();
  const [emp, setEmp] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const searchName = user.name.split(" ")[0];
        const [empRes, leaveRes] = await Promise.allSettled([
          api.employees.list({ search: searchName }),
          api.leaves.requests(),
        ]);

        if (active) {
          if (empRes.status === "fulfilled" && empRes.value?.data && empRes.value.data.length > 0) {
            const match = empRes.value.data.find(
              (e: any) =>
                e.fullName.toLowerCase().includes(user.name.toLowerCase()) ||
                user.name.toLowerCase().includes(e.fullName.toLowerCase())
            ) || empRes.value.data[0];
            setEmp(match);
          }
          if (leaveRes.status === "fulfilled" && leaveRes.value?.data && Array.isArray(leaveRes.value.data)) {
            setLeaves(leaveRes.value.data);
          }
        }
      } catch (err: any) {
        console.warn("Profile load notice:", err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfileData();
    return () => {
      active = false;
    };
  }, [user.name]);

  return (
    <>
      <PageTitle
        page={page}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => navigate("/me/attendance")}><Clock3 size={15} /> Punch Clock</Button>
            <Button onClick={() => navigate("/me/leaves")}><Calendar size={15} /> Manage Leaves</Button>
            <Button onClick={() => navigate("/me/payslips")}><IndianRupee size={15} /> Payslips</Button>
            <Button variant="danger" onClick={() => navigate("/me/resignation")}>Resignation</Button>
          </div>
        }
      />
      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-head">
            <span className="avatar large">{user.initials}</span>
            <div>
              <h2>{emp?.fullName || user.name}</h2>
              <p>{emp?.job || user.role}</p>
              <Status value={emp?.status || "Active"} />
            </div>
          </div>
          <dl>
            <div><dt>Employee number</dt><dd>{emp?.employeeNumber || "EMP-1042"}</dd></div>
            <div><dt>Work email</dt><dd>{emp?.workEmail || `${user.username}@sahyadriauto.in`}</dd></div>
            <div><dt>Location</dt><dd>{emp?.location || "Pune Manufacturing Plant"}</dd></div>
            <div><dt>Manager</dt><dd>{emp?.managerName || user.reportsTo || "None"}</dd></div>
          </dl>
        </section>

        <section className="content-card">
          <h2>Assignment & Hierarchy</h2>
          <dl className="detail-list">
            <div><dt>Business unit</dt><dd>{emp?.businessUnit || "Pune Manufacturing"}</dd></div>
            <div><dt>Department</dt><dd>{emp?.department || "Production"}</dd></div>
            <div><dt>Grade</dt><dd>{emp?.grade || "G3"}</dd></div>
            <div><dt>Hire date</dt><dd>{emp?.hireDate || "18-Jun-2021"}</dd></div>
          </dl>
          <hr />
          <h2>Self-Service Workspaces</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <button className="app-tile" onClick={() => navigate("/me/leaves")}>
              <Clock3 size={18} />
              <span>Leave Balances</span>
              <ChevronRight size={14} />
            </button>
            <button className="app-tile" onClick={() => navigate("/me/attendance")}>
              <Activity size={18} />
              <span>Punch Clock</span>
              <ChevronRight size={14} />
            </button>
            <button className="app-tile" onClick={() => navigate("/me/payslips")}>
              <IndianRupee size={18} />
              <span>My Payslips</span>
              <ChevronRight size={14} />
            </button>
            <button className="app-tile" onClick={() => navigate("/people/org-chart")}>
              <Users size={18} />
              <span>Org Hierarchy</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        <section className="content-card full">
          <div className="section-heading">
            <div>
              <h2>Recent Personal Leave Requests</h2>
              <p className="helper">Real-time status of your submitted time-off requests.</p>
            </div>
            <Button onClick={() => navigate("/me/leaves")}>Apply Leave</Button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th className="right">Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                      <RefreshCcw size={16} className="spin" style={{ display: "inline-block", marginRight: 8 }} />
                      Loading personal records...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                      No recent leave requests found.
                    </td>
                  </tr>
                ) : (
                  leaves.slice(0, 5).map((l: any) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.id}</td>
                      <td>{l.leaveTypeName || l.leaveTypeCode}</td>
                      <td className="tabular">{l.startDate}</td>
                      <td className="tabular">{l.endDate}</td>
                      <td className="right tabular">{l.days}</td>
                      <td>{l.reason}</td>
                      <td><Status value={l.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function Notifications() {
  const page = pages.find((p) => p.path === "/notifications")!;
  const notify = useAppStore((s) => s.notify);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.list();
      if (res?.data && Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (err: any) {
      console.warn("Notification notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAll = async () => {
    try {
      await api.notifications.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      console.warn("Notification notice:", err.message);
    }
    notify("All notifications marked as read");
  };

  return (
    <>
      <PageTitle page={page} actions={<Button onClick={markAll}>Mark all as read</Button>} />
      <section className="notification-list">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
            <RefreshCcw size={20} className="spin" style={{ display: "inline-block", marginRight: 8 }} />
            Loading notifications from backend...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            <CheckCircle2 size={32} style={{ marginBottom: 8, color: "var(--success)" }} />
            <p>You have no pending notifications. All notifications are caught up!</p>
          </div>
        ) : (
          items.map((n: any) => (
            <article className={!n.read ? "unread" : ""} key={n.id}>
              <span className="notification-icon">
                {n.type === "APPROVAL" ? <FileText size={18} /> : <CheckCircle2 size={18} />}
              </span>
              <div>
                <strong>{n.title || (n.type === "APPROVAL" ? "Approval Required" : "System Update")}</strong>
                <p>{n.message || n.description}</p>
                <small>{n.createdAt || "Recent"}</small>
              </div>
              {!n.read && <i />}
            </article>
          ))
        )}
      </section>
    </>
  );
}

function Reports() {
  const page = pages.find((p) => p.path === "/reports")!;
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const reports = [
    "Headcount",
    "Payroll Cost",
    "Leave Utilization",
    "Attendance",
    "Open Purchase Orders",
    "Invoices on Hold",
    "Aged Payables",
    "Stock Valuation",
    "Work Order Status",
    "Audit Summary",
  ];
  return (
    <>
      <PageTitle page={page} actions={<Button>Report history</Button>} />
      {selectedReport && (
        <H2RReportsViewer type={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
      <section className="report-filters">
        <label>As-of date<input type="date" defaultValue="2026-10-15"/></label>
        <label>Business unit<select><option>Pune Manufacturing</option></select></label>
        <label>Department<select><option>All departments</option></select></label>
        <Button variant="primary">Apply</Button>
      </section>
      <div className="report-grid">
        {reports.map((r, i) => (
          <article key={r}>
            <div>
              <BarChart3 size={21}/>
              <Status value={i < 4 ? "Live API" : "Available"}/>
            </div>
            <h2>{r}</h2>
            <p>
              {i < 4
                ? "Live real-time operational dataset connected to FusionFlow backend."
                : "Current balances and movement for the selected period."}
            </p>
            <div>
              <Button onClick={() => setSelectedReport(r)}>Open report</Button>
              <Button variant="quiet">Export CSV</Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function AdminTools() {
  const page = pages.find(p => p.path === "/admin/tools")!;
  const notify = useAppStore(s=>s.notify);
  const resetDemo = useAppStore(s=>s.resetDemo);
  const updateWorkflow = useAppStore(s=>s.updateWorkflow);
  const scenarios = [
    ["Requisition awaiting approval", "PR-2026-1184", "Pending approval"],
    ["Invoice on matching hold", "INV-8841", "On hold"],
    ["Sales order with shortage", "SO-2026-0418", "Material shortage"],
    ["Hire ready to process", "PER-2042", "Approved"],
  ];
  return <><PageTitle page={page}/><div className="tool-grid"><section className="content-card"><RefreshCcw size={24}/><h2>Reset demo data</h2><p>Restore all transactions, approvals and setup records to the original demonstration state.</p><Button variant="danger" onClick={resetDemo}>Reset demo data</Button></section><section className="content-card"><Activity size={24}/><h2>Scenario shortcuts</h2><p>Move the demonstration to a prepared workflow state.</p>{scenarios.map(([label,id,status])=><button className="scenario" key={label} onClick={()=>{updateWorkflow(id,status);notify(`${label} scenario is ready`);}}>{label}<ChevronRight size={15}/></button>)}</section></div></>;
}

function Help() {
  const page = pages.find(p => p.path === "/help")!;
  const terms = [["Work Relationship","The legal relationship between a person and the enterprise."],["Assignment","A person’s job, position, department and manager for a date range."],["Requisition","An internal request to purchase goods or services."],["Purchase Order","A commercial order issued to an approved supplier."],["Receipt","Confirmation that ordered goods were delivered."],["Payables Invoice","A supplier invoice recorded for validation and payment."],["Holds","A control that prevents approval or payment until resolved."],["Approval Management","Rules that route transactions to authorised approvers."],["Work Definition","The materials and operations required to make an item."],["Work Order","An instruction to manufacture a specific quantity."],["Sales Order","A customer commitment for items, prices and dates."],["AutoInvoice","Automatic creation of a receivables invoice from shipment."],["Subinventory","A physical or logical stock-holding area."]];
  return <><PageTitle page={page}/><section className="help-layout"><aside><h3>Help topics</h3><button className="active">Oracle Fusion equivalents</button><button>Using FusionFlow</button><button>Keyboard and accessibility</button></aside><div className="content-card"><h2>Oracle Fusion equivalents</h2><p className="helper">Common enterprise terms used throughout FusionFlow.</p><dl className="glossary">{terms.map(t=><div key={t[0]}><dt>{t[0]}</dt><dd>{t[1]}</dd></div>)}</dl></div></section></>;
}


function Forbidden() {
  const navigate = useNavigate();
  return <div className="error-page"><ShieldCheck size={38}/><p className="eyebrow">403</p><h1>You do not have access to this page</h1><p>Your current role does not include permission for this work area. Contact your administrator if you believe this is incorrect.</p><Button variant="primary" onClick={()=>navigate("/home")}>Return to home</Button></div>;
}

function NotFound() {
  const navigate = useNavigate();
  return <div className="error-page"><FileText size={38}/><p className="eyebrow">404</p><h1>Page not found</h1><p>The page may have moved or the address may be incorrect.</p><Button variant="primary" onClick={()=>navigate("/home")}>Return to home</Button></div>;
}

export default function App() {
  return <BrowserRouter><Shell /></BrowserRouter>;
}
