import { useMemo, useState } from "react";
import api from "./api/client";
import {
  BrowserRouter,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { create } from "zustand";
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

const statuses = ["Approved", "In progress", "Pending approval", "Draft", "On hold", "Completed"];
const names = ["Pune Friction Materials", "Western Auto Forge", "Deccan Industrial Supply", "Mahindra Components", "Apex Metal Works", "Sahyadri Logistics"];
const items = ["Brake Pad Assembly – Front", "Clutch Plate 240 mm", "Friction Lining Compound", "Steel Back Plate", "Copper Fibre", "Release Bearing"];

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
  return <header className="global-header">
    <button className="icon-btn" onClick={openNav} aria-label="Open navigator"><Menu size={20} /></button>
    <button className="brand-button" onClick={() => navigate("/home")}><Brand /></button>
    <div className="global-search"><Search size={17} /><input placeholder="Search people, orders, invoices…" /></div>
    <button className="header-action" onClick={() => navigate("/help")}><CircleHelp size={18} /><span>Help</span></button>
    <button className="header-action bell" onClick={() => navigate("/notifications")}><Bell size={18} /><span className="count">6</span></button>
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
  const user = useAppStore((s) => s.user)!;
  if (pathname === "/") return <Navigate to="/home" replace />;
  const page = pages.find((p) => p.path === pathname) || pages.find((p) => p.path.includes(":") && isMatch(p.path, pathname));
  if (!page) return <NotFound />;
  if (!allowedForPage(page, user.username)) return <Forbidden />;
  if (pathname === "/home") return <HomePage />;
  if (pathname === "/me") return <ProfilePage />;
  if (pathname === "/worklist") return <Worklist />;
  if (pathname === "/people/org-chart") return <OrgChart />;
  if (pathname === "/notifications") return <Notifications />;
  if (pathname === "/reports") return <Reports />;
  if (pathname === "/admin/tools") return <AdminTools />;
  if (pathname === "/help") return <Help />;
  if (page.kind === "detail") return <DocumentPage page={page} />;
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
  const metrics = user.username === "admin"
    ? [["Active users", "14", "100% enabled", "success"], ["Approval rules", "18", "3 changed this month", "neutral"], ["Audit events today", "126", "12 sensitive changes", "warning"], ["Failed sign-ins", "2", "No account lockouts", "success"]]
    : user.username === "prod.supervisor"
      ? [["Work orders open", "18", "6 in progress", "neutral"], ["Plan attainment", "94.2%", "2.1% above yesterday", "success"], ["Material shortages", "3", "2 affect today’s plan", "warning"], ["Scrap this shift", "3.8%", "Within 5% tolerance", "success"]]
      : [["Pending approvals", "8", "3 due today", "warning"], ["Open work items", "24", "6 assigned to you", "neutral"], ["Spend this month", "₹ 48,72,450", "6.2% under plan", "success"], ["Exceptions", "5", "2 high priority", "warning"]];
  const attention = [
    ["PR-2026-1184", "Purchase requisition awaiting approval", "₹ 4,87,250.00", "2 days", "/worklist"],
    ["WO-2026-0318", "Steel Back Plate shortage", "40 EA short", "Today, 09:18", "/mfg/work-orders/WO-2026-0318"],
    ["INV-8841", "Invoice quantity variance hold", "20 KG variance", "Yesterday", "/ap/invoices/INV-8841"],
    ["SO-2026-0418", "Customer order requires work order", "Ship by 18-Oct-2026", "3 hours", "/orders/SO-2026-0418"],
  ];
  const activity = [
    ["Receipt RCV-2026-3821 completed", "Pooja Nair · 10:24", "Receipt"],
    ["Work order WO-2026-0312 released", "Sanjay Bhosale · 09:52", "Manufacturing"],
    ["Supplier Western Auto Forge approved", "Kavita More · 09:16", "Supplier"],
    ["Sales order SO-2026-0412 booked", "Ritu Sharma · 08:44", "Order"],
  ];
  return <div className="home-dashboard">
    <div className="home-heading">
      <div><p className="eyebrow">Sahyadri Auto Components Pvt Ltd</p><h1>Operations overview</h1><p>{user.name} · {user.role} · Pune manufacturing plant</p></div>
      <div className="home-heading-actions"><span className="as-of"><Clock3 size={15} /> Data refreshed 15-Oct-2026, 10:42</span><Button onClick={() => window.location.reload()}><RefreshCcw size={15}/> Refresh</Button></div>
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
        <div className="production-summary"><div><span>Planned</span><strong>2,400</strong><small>units</small></div><div><span>Completed</span><strong>1,648</strong><small>68.7%</small></div><div><span>Rejected</span><strong>42</strong><small>2.5%</small></div></div>
        <div className="plan-progress"><div><span>Shift progress</span><strong>68.7%</strong></div><div><i/></div><p>752 units remaining · Shift ends at 15:30</p></div>
        <div className="line-status"><div><span>Brake Pad Line 1</span><Status value="Running"/></div><div><span>Clutch Plate Line 2</span><Status value="Changeover"/></div><div><span>Finishing and Inspection</span><Status value="On track"/></div></div>
      </section>
    </div>

    <div className="dashboard-columns lower">
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Process health</h2><p>Open volume and exceptions by process</p></div></div>
        <div className="process-health">{[
          ["Hire-to-Retire", "4 open", "1 awaiting HR", "/people/queue"],
          ["Procure-to-Pay", "32 open", "3 on hold", "/requisitions"],
          ["Plan-to-Produce", "18 open", "3 shortages", "/mfg/work-orders"],
          ["Order-to-Cash", "21 open", "2 credit holds", "/orders"],
        ].map(([name,open,exception,path],i)=><button key={name} onClick={()=>navigate(path)}><span className="process-icon">{[Users,ShoppingCart,Factory,Truck].map((Icon,index)=>index===i?<Icon key={name} size={17}/>:null)}</span><div><strong>{name}</strong><small>{open}</small></div><Status value={exception}/><ChevronRight size={14}/></button>)}</div>
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest transactions across the plant</p></div><button className="text-button" onClick={()=>navigate("/audit")}>View audit log</button></div>
        <div className="recent-activity">{activity.map(([title,meta,type])=><div key={title}><span className="activity-dot"/><div><strong>{title}</strong><small>{meta}</small></div><span>{type}</span></div>)}</div>
      </section>
    </div>

    <section className="home-section quick-actions-section"><div className="section-heading"><div><h2>Quick actions</h2><p>Start frequently used tasks</p></div></div>
      <div className="quick-row"><Button onClick={() => navigate("/requisitions/new")}><Plus size={16} /> Create Requisition</Button><Button onClick={() => navigate("/people/actions")}><Users size={16} /> Manage Employment</Button><Button onClick={() => navigate("/mfg/planner")}><Factory size={16} /> Run Planning</Button><Button onClick={() => navigate("/reports")}><BarChart3 size={16} /> View Reports</Button></div>
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
  const [advanced, setAdvanced] = useState(false);
  const rows = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: `${page.title.slice(0, 3).toUpperCase()}-${String(1048 + i)}`,
    name: page.path === "/people" ? ["Rahul Patil", "Sneha Joshi", "Sanjay Bhosale", "Vikram Jadhav", "Pooja Nair", "Nitin Gaikwad"][i % 6] : page.path === "/items" ? items[i % items.length] : names[i % names.length],
    type: ["Production", "Direct material", "Standard", "Pune Plant"][i % 4],
    date: `${String(2 + i).padStart(2, "0")}-Oct-2026`,
    amount: `₹ ${(124500 + i * 23750).toLocaleString("en-IN")}.00`,
    owner: ["Anil Deshmukh", "Kavita More", "Vikram Jadhav", "Pooja Nair"][i % 4],
    status: statuses[i % statuses.length],
  })).filter((r) => `${r.id} ${r.name}`.toLowerCase().includes(query.toLowerCase())), [page.title, page.path, query]);
  const readonly = user.username === "auditor";
  const hasCreate = !["/audit", "/accounting", "/inventory/transactions", "/people", "/inventory/onhand"].includes(page.path);
  return <><PageTitle page={page} actions={<>{hasCreate && <Button variant="primary" disabled={readonly} title={readonly ? "Read-only role" : ""} onClick={() => navigate(`${page.path}/new`)}><Plus size={16} /> Create</Button>}<Button><MoreHorizontal size={16} /> Actions</Button></>} />
    <WorkArea page={page}>
      <section className="search-panel">
        <div className="filter-grid"><label>Saved Search<select><option>My Open {page.title}</option><option>Awaiting Approval</option><option>All records</option></select></label><label>Keywords<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by number or name" /></label><label>Status<select><option>All</option><option>Open</option><option>Pending approval</option><option>Completed</option></select></label><div className="filter-actions"><Button variant="primary"><Search size={15} /> Search</Button><Button onClick={() => setQuery("")}>Reset</Button></div></div>
        <button className="advanced" onClick={() => setAdvanced(!advanced)}><ChevronDown size={15} className={advanced ? "rotate" : ""} /> Advanced</button>
        {advanced && <div className="advanced-fields"><label>From date<input type="date" /></label><label>Owner<input placeholder="Search owner" /></label><label>Business unit<select><option>Pune Manufacturing</option></select></label></div>}
      </section>
      <section className="table-card">
        <div className="table-toolbar"><strong>{rows.length} results</strong><div><Button variant="quiet">Freeze first column</Button><Button variant="quiet">Columns</Button><Button variant="quiet">Export CSV</Button></div></div>
        <div className="table-scroll"><table><thead><tr><th className="check"><input type="checkbox" aria-label="Select all" /></th><th>Number</th><th>Description</th><th>Category</th><th>Date</th><th className="right">Amount / value</th><th>Owner</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td className="check"><input type="checkbox" aria-label={`Select ${r.id}`} /></td><td><button className="table-link" onClick={() => navigate(`${page.path}/${r.id}`)}>{r.id}</button></td><td><strong>{r.name}</strong></td><td>{r.type}</td><td className="tabular">{r.date}</td><td className="right tabular">{r.amount}</td><td>{r.owner}</td><td><Status value={r.status} /></td><td><button className="icon-btn"><MoreHorizontal size={17} /></button></td></tr>)}</tbody>
        </table></div>
        <div className="pagination"><span>Rows per page <select><option>25</option><option>50</option></select></span><span>1–{rows.length} of {rows.length}</span><button className="icon-btn" disabled><ChevronLeft size={17} /></button><button className="icon-btn" disabled><ChevronRight size={17} /></button></div>
      </section>
    </WorkArea>
  </>;
}

function StatusTrain({ current = 2 }: { current?: number }) {
  const steps = ["Draft", "Submitted", "Approval", "Processing", "Completed"];
  return <div className="status-train">{steps.map((step, i) => <div className={i < current ? "done" : i === current ? "current" : ""} key={step}><span>{i < current ? <Check size={13} /> : i + 1}</span><small>{step}</small></div>)}</div>;
}

function DocumentPage({ page }: { page: Page }) {
  const user = useAppStore((s) => s.user)!;
  const notify = useAppStore((s) => s.notify);
  const tabSets: Record<string, string[]> = {
    "/people/:id": ["Overview", "Employment", "Assignment History", "Direct Reports", "Audit History"],
    "/suppliers/:id": ["Profile", "Sites", "Bank Accounts", "Audit History"],
    "/requisitions/:id": ["Lines", "Approvals", "Attachments", "Audit History"],
    "/po/:id": ["Lines", "Schedules", "Receipts", "Invoices", "Audit History"],
    "/ap/invoices/:id": ["Match", "Validation", "Holds", "Approvals", "Accounting", "Audit History"],
    "/mfg/work-orders/:id": ["Operations", "Materials", "Completion", "Cost and Variance", "Audit History"],
    "/customers/:id": ["Overview", "Sites", "Credit", "Orders", "Receivables", "Audit History"],
    "/orders/:id": ["Lines", "Fulfilment", "Credit", "Shipment", "Invoice", "Audit History"],
  };
  const tabs = tabSets[page.path] || ["Lines", "Approvals", "Accounting", "Attachments", "Audit History"];
  const [tab, setTab] = useState(tabs[0]);
  const readonly = user.username === "auditor";
  return <><PageTitle page={page} actions={<><Button>Actions <ChevronDown size={14} /></Button><Button disabled={readonly} title={readonly ? "Read-only role" : ""}>Save</Button><Button variant="primary" disabled={readonly} title={readonly ? "Read-only role" : ""} onClick={() => notify(`${page.title} submitted for approval`)}>Submit</Button></>} />
    <div className="document-shell">
      <div className="summary-strip"><div><small>Document number</small><strong>{page.title.startsWith("Person") ? "EMP-1042" : "FF-2026-00184"}</strong></div><div><small>Business unit</small><strong>Pune Manufacturing</strong></div><div><small>Owner</small><strong>Vikram Jadhav</strong></div><div><small>Total</small><strong className="tabular">₹ 4,87,250.00</strong></div><div><small>Status</small><Status value="Pending approval" /></div></div>
      <StatusTrain />
      <div className="tabs">{tabs.map((t) => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>
      <DetailTabContent page={page} tab={tab} readonly={readonly} />
    </div>
  </>;
}

function DetailTabContent({ page, tab, readonly }: { page: Page; tab: string; readonly: boolean }) {
  if (tab === "Audit History") return <section className="content-card"><h2>Audit History</h2><p className="helper">Every change is retained with date, user, role, old value and new value.</p><AuditTable /></section>;
  if (tab === "Approvals") return <section className="content-card"><h2>Approval chain</h2><div className="approval-chain">{["Anil Deshmukh · Line Manager", "Kavita More · Functional Manager", "Suresh Rane · Plant Head"].map((x, i) => <div key={x}><span className="avatar">{x.split(" ").map(s => s[0]).slice(0,2).join("")}</span><div><strong>{x}</strong><small>{i === 0 ? "Approved · 14-Oct-2026, 16:22" : "Pending"}</small></div><Status value={i === 0 ? "Approved" : "Pending"} /></div>)}</div></section>;
  if (tab === "Accounting") return <section className="content-card"><h2>Accounting distribution</h2><LinesTable accounting /></section>;
  if (tab === "Attachments") return <section className="empty-state"><FileText size={28} /><h2>No attachments</h2><p>Add supporting quotations, specifications or approvals.</p><Button disabled={readonly}>Add attachment</Button></section>;

  if (page.path === "/people/:id") {
    if (tab === "Overview") return <InfoSections sections={[
      ["Personal information", [["Employee number", "EMP-1042"], ["Date of birth", "08-Feb-1994"], ["Work email", "rahul.patil@sahyadriauto.in"], ["Status", "Active"]]],
      ["Current assignment", [["Job", "Production Operator"], ["Department", "Production"], ["Grade", "G3"], ["Manager", "Anil Deshmukh"]]],
    ]} />;
    if (tab === "Employment") return <InfoSections sections={[["Work relationship", [["Legal employer", "Sahyadri Auto Components Pvt Ltd"], ["Hire date", "18-Jun-2021"], ["Worker type", "Employee"], ["Location", "Pune Manufacturing Plant"]]]]} />;
    if (tab === "Assignment History") return <Timeline items={["01-Apr-2025 · Promoted to Production Operator, Grade G3", "01-Jul-2023 · Transferred to Brake Pad Assembly", "18-Jun-2021 · Hired as Production Trainee, Grade G1"]} />;
    return <PeopleMiniTable />;
  }
  if (page.path === "/suppliers/:id") {
    if (tab === "Profile") return <InfoSections sections={[
      ["Organisation", [["Supplier", "Western Auto Forge"], ["Tax ID", "27AAACW8421F1ZQ"], ["Category", "Direct Materials"], ["Status", "Approved"]]],
      ["Primary contact", [["Contact", "Prakash Mehta"], ["Email", "accounts@westernautoforge.in"], ["Phone", "+91 20 2748 2180"], ["Payment terms", "Net 30"]]],
    ]} />;
    if (tab === "Sites") return <SimpleGrid headers={["Site", "Purpose", "Address", "Status"]} rows={[["PUNE-01", "Purchasing and payment", "Bhosari MIDC, Pune", "Active"], ["NASHIK-01", "Purchasing", "Satpur MIDC, Nashik", "Active"]]} />;
    return <SimpleGrid headers={["Bank", "Account ending", "IFSC", "Change status"]} rows={[["HDFC Bank", "•••• 2841", "HDFC0000486", "Approved"], ["ICICI Bank", "•••• 9034", "ICIC0006241", "Pending approval"]]} />;
  }
  if (page.path === "/po/:id") {
    if (tab === "Schedules") return <SimpleGrid headers={["Line", "Need-by date", "Ship-to", "Ordered", "Received"]} rows={[["1", "22-Oct-2026", "Pune Stores", "500 EA", "300 EA"], ["2", "25-Oct-2026", "Pune Stores", "250 KG", "250 KG"]]} />;
    if (tab === "Receipts") return <SimpleGrid headers={["Receipt", "Date", "Accepted", "Rejected", "Receiver"]} rows={[["RCV-2026-3821", "14-Oct-2026", "300 EA", "5 EA", "Pooja Nair"]]} />;
    if (tab === "Invoices") return <SimpleGrid headers={["Invoice", "Supplier invoice", "Amount", "Match status"]} rows={[["INV-8841", "WAF/26/1084", "₹ 2,12,600.00", "On hold"]]} />;
  }
  if (page.path === "/ap/invoices/:id") {
    if (tab === "Match") return <MatchGrid />;
    if (tab === "Validation") return <ValidationPanel />;
    if (tab === "Holds") return <SimpleGrid headers={["Hold", "Reason", "Applied", "Release status"]} rows={[["Quantity variance", "Invoice exceeds accepted receipt by 20 EA", "14-Oct-2026", "Release requested"]]} />;
  }
  if (page.path === "/mfg/work-orders/:id") {
    if (tab === "Operations") return <OperationStepper />;
    if (tab === "Materials") return <SimpleGrid headers={["Component", "Required", "Issued", "Shortage", "Status"]} rows={[["Friction Lining Compound", "240 KG", "240 KG", "—", "Issued"], ["Steel Back Plate", "400 EA", "360 EA", "40 EA", "Shortage"], ["Copper Fibre", "18 KG", "18 KG", "—", "Issued"]]} />;
    if (tab === "Completion") return <CompletionPanel readonly={readonly} />;
    if (tab === "Cost and Variance") return <SimpleGrid headers={["Cost element", "Standard", "Actual", "Variance"]} rows={[["Material", "₹ 1,86,400.00", "₹ 1,92,150.00", "₹ 5,750.00"], ["Resource", "₹ 42,600.00", "₹ 41,980.00", "₹ -620.00"], ["Overhead", "₹ 18,400.00", "₹ 18,400.00", "₹ 0.00"]]} />;
  }
  if (page.path === "/customers/:id") {
    if (tab === "Overview") return <InfoSections sections={[
      ["Customer profile", [["Customer", "Mahindra Components Ltd"], ["Account", "CUST-1048"], ["Tax ID", "27AAACM3025E1Z7"], ["Status", "Active"]]],
      ["Balance summary", [["Credit limit", "₹ 25,00,000.00"], ["Open balance", "₹ 12,42,800.00"], ["Available credit", "₹ 12,57,200.00"], ["Risk class", "Low"]]],
    ]} />;
    if (tab === "Credit") return <CreditPanel readonly={readonly} />;
    if (tab === "Sites") return <SimpleGrid headers={["Site", "Use", "City", "Status"]} rows={[["PUNE-BILL", "Bill-to", "Pune", "Active"], ["CHAKAN-SHIP", "Ship-to", "Chakan", "Active"]]} />;
    if (tab === "Orders") return <SimpleGrid headers={["Order", "Date", "Amount", "Status"]} rows={[["SO-2026-0418", "12-Oct-2026", "₹ 8,72,500.00", "Material shortage"], ["SO-2026-0384", "28-Sep-2026", "₹ 4,24,000.00", "Shipped"]]} />;
    return <SimpleGrid headers={["Invoice", "Due date", "Original", "Balance"]} rows={[["AR-2026-2208", "29-Oct-2026", "₹ 6,28,400.00", "₹ 6,28,400.00"], ["AR-2026-2142", "18-Oct-2026", "₹ 6,14,400.00", "₹ 2,14,400.00"]]} />;
  }
  if (page.path === "/orders/:id") {
    if (tab === "Fulfilment") return <div className="content-stack"><div className="warning-banner"><Boxes size={18}/><div><strong>Material shortage</strong><p>40 brake pad assemblies are not available for the requested ship date.</p></div><Button>Create Work Order</Button></div><SimpleGrid headers={["Line", "Ordered", "Available", "Reserved", "Shortage"]} rows={[["Brake Pad Assembly – Front", "400 EA", "360 EA", "360 EA", "40 EA"], ["Clutch Plate 240 mm", "200 EA", "240 EA", "200 EA", "—"]]} /></div>;
    if (tab === "Credit") return <div className="warning-banner"><CreditCard size={18}/><div><strong>Credit check passed</strong><p>Available credit after this order: ₹ 3,84,700.00.</p></div><Status value="Approved"/></div>;
    if (tab === "Shipment") return <SimpleGrid headers={["Shipment", "Planned date", "Picked", "Shipped", "Status"]} rows={[["SHP-2026-0912", "18-Oct-2026", "560 EA", "—", "Ready to ship"]]} />;
    if (tab === "Invoice") return <SimpleGrid headers={["AR invoice", "Invoice date", "Amount", "Status"]} rows={[["Created after shipment", "—", "₹ 8,72,500.00", "Pending shipment"]]} />;
  }
  return <section className="content-card"><div className="section-heading"><div><h2>Document lines</h2><p>Review quantities, pricing and source references.</p></div><Button disabled={readonly} title={readonly ? "Read-only role" : ""}><Plus size={15} /> Add line</Button></div><LinesTable /></section>;
}

function InfoSections({ sections }: { sections: [string, string[][]][] }) {
  return <div className="detail-sections">{sections.map(([title, fields]) => <section className="content-card" key={title}><h2>{title}</h2><dl className="detail-list">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</div>;
}

function SimpleGrid({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <section className="content-card"><div className="table-scroll"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={`${i}-${j}`}>{j === row.length - 1 && /active|approved|pending|hold|issued|shortage|ship/i.test(cell) ? <Status value={cell}/> : cell}</td>)}</tr>)}</tbody></table></div></section>;
}

function Timeline({ items }: { items: string[] }) {
  return <section className="content-card"><h2>Date-effective history</h2><div className="timeline">{items.map((item, i) => <div key={item}><span>{i + 1}</span><p>{item}</p></div>)}</div></section>;
}

function PeopleMiniTable() {
  return <SimpleGrid headers={["Employee", "Job", "Grade", "Department", "Status"]} rows={[
    ["Sanjay Bhosale", "Production Supervisor", "G3", "Production", "Active"],
    ["Rahul Patil", "Production Operator", "G3", "Production", "Active"],
    ["Mangesh Pawar", "Production Trainee", "G1", "Production", "Active"],
  ]} />;
}

function MatchGrid() {
  return <section className="content-card"><div className="section-heading"><div><h2>Three-way match</h2><p>Invoice quantities are compared with the purchase order and accepted receipts.</p></div><Status value="On hold"/></div><div className="table-scroll"><table><thead><tr><th>Line</th><th>Item</th><th className="right">PO quantity</th><th className="right">Received</th><th className="right">Invoiced</th><th className="right">Difference</th><th>Result</th></tr></thead><tbody>
    <tr><td>1</td><td>Steel Back Plate</td><td className="right">300 EA</td><td className="right">300 EA</td><td className="right">300 EA</td><td className="right">—</td><td><Status value="Matched"/></td></tr>
    <tr className="difference-row"><td>2</td><td>Friction Lining Compound</td><td className="right">250 KG</td><td className="right">230 KG</td><td className="right">250 KG</td><td className="right">20 KG</td><td><Status value="On hold"/></td></tr>
  </tbody></table></div></section>;
}

function ValidationPanel() {
  return <section className="content-card"><h2>Validation results</h2><div className="validation-list">
    <div><Check size={17}/><div><strong>Supplier and site are active</strong><p>Western Auto Forge · PUNE-01</p></div><Status value="Passed"/></div>
    <div><Check size={17}/><div><strong>Invoice number is unique</strong><p>No duplicate supplier invoice was found.</p></div><Status value="Passed"/></div>
    <div className="failed"><X size={17}/><div><strong>Quantity match failed</strong><p>Invoice line 2 exceeds the accepted receipt by 20 KG.</p></div><Status value="On hold"/></div>
  </div></section>;
}

function OperationStepper() {
  const operations = [["10", "Mixing", "Completed", "240 KG"], ["20", "Hot Pressing", "Completed", "400 EA"], ["30", "Curing", "In progress", "280 EA"], ["40", "Finishing", "Not started", "—"], ["50", "Inspection", "Not started", "—"]];
  return <section className="content-card"><h2>Operation progress</h2><div className="operation-list">{operations.map(([seq, name, status, quantity], i) => <div key={seq} className={i === 2 ? "current" : ""}><span className="operation-number">{i < 2 ? <Check size={14}/> : seq}</span><div><strong>{name}</strong><small>Count point {name === "Inspection" ? "Yes" : "No"} · Completed quantity {quantity}</small></div><Status value={status}/></div>)}</div></section>;
}

function CompletionPanel({ readonly }: { readonly: boolean }) {
  const notify = useAppStore(s => s.notify);
  const [good, setGood] = useState("280");
  const [scrap, setScrap] = useState("8");
  const scrapRate = ((Number(scrap) / Math.max(Number(good) + Number(scrap), 1)) * 100).toFixed(1);
  return <section className="content-card"><div className="section-heading"><div><h2>Operation completion</h2><p>Record completed and scrapped quantities for the current operation.</p></div><Status value={Number(scrapRate) > 5 ? "Approval required" : "Within tolerance"}/></div><div className="form-grid"><label>Good quantity<input type="number" value={good} onChange={e=>setGood(e.target.value)}/></label><label>Scrap quantity<input type="number" value={scrap} onChange={e=>setScrap(e.target.value)}/></label><label>Scrap percentage<input value={`${scrapRate}%`} readOnly/></label><label>Reason code<select><option>Surface defect</option><option>Dimensional failure</option><option>Material contamination</option></select></label><label className="wide">Completion note<textarea defaultValue="Curing operation completed against shift production log."/></label></div>{Number(scrapRate) > 5 && <div className="warning-banner"><Clock3 size={18}/><div><strong>Manager approval required</strong><p>Scrap above 5% routes to the Line Manager, Production.</p></div></div>}<div className="section-footer"><Button variant="primary" disabled={readonly} onClick={()=>notify("Operation completion recorded")}>Complete operation</Button></div></section>;
}

function CreditPanel({ readonly }: { readonly: boolean }) {
  const notify = useAppStore(s => s.notify);
  const [limit, setLimit] = useState("2500000");
  return <section className="content-card"><div className="section-heading"><div><h2>Credit management</h2><p>Credit-limit changes require Plant Head approval.</p></div><Status value="Low risk"/></div><div className="form-grid"><label>Current credit limit<input value="₹ 25,00,000.00" readOnly/></label><label>Requested credit limit<input type="number" value={limit} onChange={e=>setLimit(e.target.value)}/></label><label className="wide">Business justification<textarea defaultValue="Increase requested to support the revised annual customer schedule."/></label></div><div className="section-footer"><Button variant="primary" disabled={readonly} onClick={()=>notify("Credit limit change submitted to Plant Head")}>Submit change for approval</Button></div></section>;
}

function LinesTable({ accounting = false }: { accounting?: boolean }) {
  return <div className="table-scroll"><table><thead><tr><th>Line</th><th>{accounting ? "Account" : "Item"}</th><th>Description</th><th className="right">{accounting ? "Debit" : "Quantity"}</th><th className="right">{accounting ? "Credit" : "Unit price"}</th><th>Status</th></tr></thead><tbody>
    {items.slice(0, 5).map((item, i) => <tr key={item}><td>{i + 1}</td><td className="link-cell">{accounting ? `01-210-${4200 + i * 10}` : `FG-${201 + i}`}</td><td>{item}</td><td className="right tabular">{accounting ? (i < 3 ? `₹ ${(65000 + i * 12500).toLocaleString("en-IN")}.00` : "—") : `${120 + i * 25} EA`}</td><td className="right tabular">{accounting ? (i >= 3 ? `₹ ${(122500 + i * 5000).toLocaleString("en-IN")}.00` : "—") : `₹ ${(625 + i * 90).toLocaleString("en-IN")}.00`}</td><td><Status value={i === 3 ? "On hold" : "Approved"} /></td></tr>)}
  </tbody></table></div>;
}

function FormPage({ page }: { page: Page }) {
  const user = useAppStore((s) => s.user)!;
  const notify = useAppStore((s) => s.notify);
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  const [dirty, setDirty] = useState(false);
  const readonly = user.username === "auditor";
  const submit = async () => {
    try {
      if (page.path === "/people/actions") {
        await api.employees.performAction("EMP-1042", {
          action: "PROMOTE",
          effectiveDate: "2026-11-01",
          reason: "Career progression",
          proposedGrade: "G4",
        });
      }
    } catch (e: any) {
      console.warn("API action notice:", e.message);
    }
    notify(`${page.title} submitted successfully`);
    setDirty(false);
  };
  return <><PageTitle page={page} actions={<><Button onClick={() => dirty && !window.confirm("Discard unsaved changes?") ? null : navigate(-1)}>Cancel</Button><Button disabled={readonly} onClick={() => { notify("Draft saved"); setDirty(false); }}>Save</Button><Button variant="primary" disabled={readonly} title={readonly ? "Read-only role" : ""} onClick={submit}>Submit</Button></>} />
    <div className="form-page" onChange={() => setDirty(true)}>
      <StatusTrain current={0} />
      <section className="form-section"><div className="section-heading"><div><h2>General information</h2><p>Fields marked with an asterisk are required.</p></div></div>
        <div className="form-grid">
          <label>Business unit <span>*</span><select defaultValue="Pune Manufacturing"><option>Pune Manufacturing</option></select></label>
          <label>Transaction date <span>*</span><input type="date" defaultValue="2026-10-15" /></label>
          <label>Requester <span>*</span><input defaultValue={user.name} /></label>
          <label>Department <span>*</span><select><option>Production</option><option>Stores and Purchase</option><option>Quality</option></select></label>
          <label className="wide">Description <span>*</span><input defaultValue={page.title.replace("Create ", "") + " for October operations"} /></label>
          <label className="wide">Justification <HelpCircle size={13} /><textarea defaultValue="Required to support the approved October production plan and customer delivery schedule." /></label>
        </div>
      </section>
      <SpecializedFormFields page={page} />
      {needsLines && <section className="form-section"><div className="section-heading"><div><h2>Lines and details</h2><p>Enter the transaction details and review calculated totals.</p></div><Button><Plus size={15} /> Add line</Button></div><EditableLines /></section>}
      <button className="show-more" onClick={() => setMore(!more)}><ChevronDown size={15} className={more ? "rotate" : ""} /> {more ? "Show less" : "Show more"}</button>
      {more && <section className="form-section"><h2>Additional information</h2><div className="form-grid"><label>Reference<input placeholder="External or legacy reference" /></label><label>Priority<select><option>Normal</option><option>Urgent</option></select></label><label className="wide">Internal note<textarea /></label></div></section>}
      {needsLines && <div className="form-total"><span>Calculated total</span><strong>₹ 2,43,750.00</strong><Status value="Within budget" /></div>}
    </div>
  </>;
}

function SpecializedFormFields({ page }: { page: Page }) {
  if (page.path === "/me/resignation") return <section className="form-section"><h2>Resignation details</h2><div className="form-grid"><label>Proposed last working day <span>*</span><input type="date" defaultValue="2026-11-30"/></label><label>Reason <span>*</span><select><option>Career opportunity</option><option>Personal reasons</option><option>Higher education</option><option>Relocation</option></select></label><label className="wide">Comments<textarea defaultValue="Please initiate the required notice-period and offboarding activities."/></label></div><div className="process-preview"><strong>Approval route</strong><span>Employee</span><ChevronRight size={14}/><span>Line Manager</span><ChevronRight size={14}/><span>HR Manager</span><ChevronRight size={14}/><span>Offboarding</span></div></section>;
  if (page.path === "/people/actions") return <section className="form-section"><div className="section-heading"><div><h2>Employment action</h2><p>Managers can initiate actions only for people in their reporting hierarchy.</p></div><Status value="Team scope"/></div><div className="form-grid"><label>Action <span>*</span><select><option>Promote</option><option>Transfer</option><option>Change Manager</option><option>Terminate</option><option>Rehire</option></select></label><label>Person <span>*</span><select><option>Rahul Patil · EMP-1042</option><option>Sanjay Bhosale · EMP-1034</option></select></label><label>Effective date <span>*</span><input type="date" defaultValue="2026-11-01"/></label><label>Reason code <span>*</span><select><option>Career progression</option><option>Organisation change</option><option>Performance</option><option>Voluntary separation</option></select></label><label>Proposed grade<select><option>G4</option><option>G3</option></select></label><label>Proposed manager<select><option>Anil Deshmukh</option><option>Kavita More</option></select></label></div><div className="warning-banner"><ShieldCheck size={18}/><div><strong>Additional approval</strong><p>Grade G4 and above will route to the Plant Head after HR Manager approval.</p></div></div></section>;
  if (page.path === "/suppliers/new") return <section className="form-section"><div className="section-heading"><div><h2>Supplier profile</h2><p>Tax identity and bank account are checked for possible duplicates.</p></div><Status value="No duplicate found"/></div><div className="form-grid"><label>Legal name <span>*</span><input defaultValue="Western Auto Forge"/></label><label>Tax ID / GSTIN <span>*</span><input defaultValue="27AAACW8421F1ZQ"/></label><label>Category <span>*</span><select><option>Direct Materials</option><option>Indirect Materials</option><option>Logistics</option></select></label><label>Primary site <span>*</span><input defaultValue="PUNE-01"/></label><label>Bank name <span>*</span><input defaultValue="HDFC Bank"/></label><label>IFSC <span>*</span><input defaultValue="HDFC0000486"/></label><label className="wide">Bank account number <span>*</span><input defaultValue="5020002841"/></label></div></section>;
  if (page.path === "/receiving") return <section className="form-section"><h2>Receipt controls</h2><div className="form-grid"><label>Purchase order <span>*</span><select><option>PO-2026-0841 · Western Auto Forge</option></select></label><label>PO schedule <span>*</span><select><option>Line 1 · Schedule 1 · Due 22-Oct-2026</option></select></label><label>Accepted quantity <span>*</span><input type="number" defaultValue="300"/></label><label>Rejected quantity<input type="number" defaultValue="5"/></label><label>Rejection reason<select><option>Surface damage</option><option>Incorrect specification</option></select></label><label>Subinventory<select><option>RM-STORES</option><option>QUALITY-HOLD</option></select></label></div><div className="warning-banner"><Clock3 size={18}/><div><strong>Receipt tolerance</strong><p>Maximum permitted receipt is 525 EA. Quantities above tolerance will be blocked.</p></div></div></section>;
  if (page.path === "/ap/invoices/new") return <section className="form-section"><div className="section-heading"><div><h2>Invoice controls</h2><p>Validate supplier invoice identity, tax and purchase-order match.</p></div><Status value="No duplicate found"/></div><div className="form-grid"><label>Supplier invoice number <span>*</span><input defaultValue="WAF/26/1084"/></label><label>Purchase order <span>*</span><select><option>PO-2026-0841</option></select></label><label>Invoice amount <span>*</span><input defaultValue="212600.00"/></label><label>GST amount<input defaultValue="32430.51"/></label><label>Invoice date <span>*</span><input type="date" defaultValue="2026-10-14"/></label><label>Payment terms<select><option>Net 30</option></select></label></div></section>;
  if (page.path === "/ap/payments/new") return <section className="form-section"><h2>Payment controls</h2><div className="form-grid"><label>Payment method <span>*</span><select><option>NEFT</option><option>Cheque</option></select></label><label>Payment date <span>*</span><input type="date" defaultValue="2026-10-16"/></label><label>Bank account <span>*</span><select><option>HDFC Operating · •••• 4821</option></select></label><label>Group by<select><option>Supplier and currency</option></select></label></div><SimpleGrid headers={["Select", "Supplier", "Invoice", "Due date", "Amount"]} rows={[["Yes", "Western Auto Forge", "INV-8841", "18-Oct-2026", "₹ 2,12,600.00"], ["Yes", "Deccan Industrial Supply", "INV-8829", "20-Oct-2026", "₹ 1,46,800.00"]]}/></section>;
  if (page.path === "/inventory/new") return <section className="form-section"><h2>Inventory movement</h2><div className="form-grid"><label>Transaction type <span>*</span><select><option>Subinventory transfer</option><option>Miscellaneous issue</option><option>Miscellaneous receipt</option></select></label><label>Item <span>*</span><select><option>Steel Back Plate · RM-204</option></select></label><label>From subinventory <span>*</span><select><option>RM-STORES</option></select></label><label>To subinventory <span>*</span><select><option>WIP-STAGING</option></select></label><label>Available quantity<input value="1,240 EA" readOnly/></label><label>Transaction quantity <span>*</span><input type="number" defaultValue="200"/></label></div><p className="field-note">Transactions that would result in negative stock are blocked.</p></section>;
  if (page.path === "/orders/new") return <section className="form-section"><h2>Order controls</h2><div className="form-grid"><label>Customer <span>*</span><select><option>Mahindra Components Ltd</option></select></label><label>Price list <span>*</span><select><option>Domestic OEM 2026</option></select></label><label>Requested ship date <span>*</span><input type="date" defaultValue="2026-10-18"/></label><label>Ship-to site <span>*</span><select><option>CHAKAN-SHIP</option></select></label></div><div className="control-results"><div><Check size={16}/><span>Credit check</span><strong>Passed</strong></div><div className="warning"><Clock3 size={16}/><span>Availability</span><strong>40 EA short</strong></div></div></section>;
  if (page.path === "/ar/receipts") return <section className="form-section"><h2>Receipt application</h2><div className="form-grid"><label>Customer <span>*</span><select><option>Mahindra Components Ltd</option></select></label><label>Receipt amount <span>*</span><input defaultValue="400000.00"/></label><label>Receipt method <span>*</span><select><option>NEFT</option><option>Cheque</option></select></label><label>Receipt date <span>*</span><input type="date" defaultValue="2026-10-15"/></label></div><SimpleGrid headers={["Apply", "Invoice", "Due date", "Balance", "Applied"]} rows={[["Yes", "AR-2026-2142", "18-Oct-2026", "₹ 2,14,400.00", "₹ 2,14,400.00"], ["Yes", "AR-2026-2208", "29-Oct-2026", "₹ 6,28,400.00", "₹ 1,85,600.00"]]}/><p className="field-note">Remaining unapplied amount: ₹ 0.00 · Write-off tolerance: ₹ 500.00</p></section>;
  return null;
}

function EditableLines() {
  return <div className="table-scroll"><table><thead><tr><th>Line</th><th>Item / category</th><th>Description</th><th className="right">Quantity</th><th>UoM</th><th className="right">Unit price</th><th className="right">Amount</th><th></th></tr></thead><tbody>
    {[0,1,2].map((i) => <tr key={i}><td>{i + 1}</td><td><select defaultValue={items[i]}>{items.map(x => <option key={x}>{x}</option>)}</select></td><td><input defaultValue={`Production requirement – batch ${310 + i}`} /></td><td><input className="number-input" type="number" defaultValue={100 + i * 25} /></td><td><select><option>EA</option><option>KG</option></select></td><td><input className="number-input" defaultValue={`${650 + i * 125}.00`} /></td><td className="right tabular">₹ {(65000 + i * 31875).toLocaleString("en-IN")}.00</td><td><button className="icon-btn"><X size={16} /></button></td></tr>)}
  </tbody></table></div>;
}

function ProfilePage() {
  const user = useAppStore((s) => s.user)!;
  const page = pages.find(p => p.path === "/me")!;
  return <><PageTitle page={page} actions={<Button>Edit profile</Button>} /><div className="profile-grid">
    <section className="profile-card"><div className="profile-head"><span className="avatar large">{user.initials}</span><div><h2>{user.name}</h2><p>{user.role}</p><Status value="Active" /></div></div><dl><div><dt>Employee number</dt><dd>EMP-1042</dd></div><div><dt>Work email</dt><dd>{user.username}@sahyadriauto.in</dd></div><div><dt>Location</dt><dd>Pune Manufacturing Plant</dd></div><div><dt>Manager</dt><dd>{user.reportsTo}</dd></div></dl></section>
    <section className="content-card"><h2>Assignment</h2><dl className="detail-list"><div><dt>Business unit</dt><dd>Pune Manufacturing</dd></div><div><dt>Department</dt><dd>Production</dd></div><div><dt>Grade</dt><dd>G3</dd></div><div><dt>Hire date</dt><dd>18-Jun-2021</dd></div></dl><hr /><h2>Delegation</h2><div className="form-grid"><label>Delegate to<input placeholder="Search person" /></label><label>From and to<input placeholder="DD-MMM-YYYY — DD-MMM-YYYY" /></label></div></section>
    <section className="content-card full"><div className="section-heading"><h2>My Requests</h2><Button>Create request</Button></div><LinesTable /></section>
  </div></>;
}

function Worklist() {
  const page = pages.find(p => p.path === "/worklist")!;
  const notify = useAppStore(s => s.notify);
  const statusesById = useAppStore(s => s.workflowStatuses);
  const updateWorkflow = useAppStore(s => s.updateWorkflow);
  const approvals = [
    ["PR-2026-1184", "Purchase Requisition PR-2026-1184", "₹ 4,87,250.00", "Rahul Patil", "2 days"],
    ["PER-2042", "Promotion Request PER-2042", "Grade G3 to G4", "Anil Deshmukh", "1 day"],
    ["SUP-1098", "Supplier Registration SUP-1098", "Western Auto Forge", "Vikram Jadhav", "6 hours"],
    ["INV-8841", "Invoice Hold Release INV-8841", "₹ 2,12,600.00", "Nitin Gaikwad", "3 days"],
  ];
  const act = async (id: string, title: string, action: "Approved" | "Rejected" | "Information requested" | "Reassigned") => {
    let reason = "";
    if (action === "Rejected") {
      const res = window.prompt("Enter the rejection reason");
      if (!res?.trim()) return notify("A reason is required to reject");
      reason = res;
    }
    if (action === "Reassigned") {
      const assignee = window.prompt("Reassign to");
      if (!assignee?.trim()) return;
    }
    if (action === "Information requested") {
      const message = window.prompt("Enter the information required");
      if (!message?.trim()) return;
    }
    try {
      await api.approvals.act(id, action, reason);
    } catch (err: any) {
      console.warn("Backend approval notice:", err.message);
    }
    updateWorkflow(id, action);
    notify(`${title}: ${action.toLowerCase()}`);
  };
  return <><PageTitle page={page} actions={<Button>Approval history</Button>} /><div className="worklist-layout"><aside className="worklist-filters"><h3>Saved searches</h3>{["Assigned to me (8)", "Due today (3)", "High priority (2)", "Requested information (1)"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}</aside><div className="approval-list">{approvals.map((a,i)=>{const final = ["Approved", "Rejected"].includes(statusesById[a[0]]); return <article className="approval-card" key={a[0]}><div className="approval-top"><div><span className="eyebrow">{i % 2 ? "People" : "Procurement"}</span><h2>{a[1]}</h2></div><Status value={statusesById[a[0]]} /></div><div className="approval-facts"><div><small>Summary</small><strong>{a[2]}</strong></div><div><small>Requester</small><strong>{a[3]}</strong></div><div><small>Age</small><strong>{a[4]}</strong></div><div><small>Approval chain</small><strong>Level {i % 3 + 1} of 3</strong></div></div><div className="approval-actions"><Button variant="primary" disabled={final} onClick={()=>act(a[0], a[1], "Approved")}>Approve</Button><Button variant="danger" disabled={final} onClick={()=>act(a[0], a[1], "Rejected")}>Reject</Button><Button disabled={final} onClick={()=>act(a[0], a[1], "Information requested")}>Request Info</Button><Button disabled={final} onClick={()=>act(a[0], a[1], "Reassigned")}>Reassign</Button><Button variant="quiet">View document <ChevronRight size={14}/></Button></div></article>})}</div></div></>;
}

function OrgChart() {
  const page = pages.find(p => p.path === "/people/org-chart")!;
  const branches = [
    ["Rohini Sawant", "HR Manager", "RS"],
    ["Anil Deshmukh", "Line Manager, Production", "AD"],
    ["Kavita More", "Line Manager, Stores and Purchase", "KM"],
    ["Ritu Sharma", "Sales Operations", "RS"],
  ];
  return <><PageTitle page={page} actions={<Button>Expand all</Button>} /><section className="org-card"><div className="org-node top"><span className="avatar">SR</span><div><strong>Suresh Rane</strong><small>Plant Head</small></div></div><div className="org-line" /><div className="org-branches">{branches.map((b,i)=><div key={b[0]} className="org-column"><article className="org-node"><span className="avatar">{b[2]}</span><div><strong>{b[0]}</strong><small>{b[1]}</small></div></article>{i===1&&<><div className="vertical"/><article className="org-node child"><span className="avatar">RP</span><div><strong>Rahul Patil</strong><small>Production Operator</small></div></article></>}</div>)}</div></section></>;
}

function Notifications() {
  const page = pages.find(p => p.path === "/notifications")!;
  const notify = useAppStore(s => s.notify);
  const markAll = async () => {
    try {
      await api.notifications.markAllRead();
    } catch (err: any) {
      console.warn("Notification notice:", err.message);
    }
    notify("All notifications marked as read");
  };
  return <><PageTitle page={page} actions={<Button onClick={markAll}>Mark all as read</Button>} /><section className="notification-list">{Array.from({length:9},(_,i)=><article className={i<3?"unread":""} key={i}><span className="notification-icon">{i%2?<FileText size={18}/>:<ClipboardCheck size={18}/>}</span><div><strong>{i%2?"Approval required":"Transaction updated"}</strong><p>{i%2?"Requisition PR-2026-1184 is awaiting your approval.":"Work order WO-2026-0318 moved to operation completion."}</p><small>{15-i}-Oct-2026 · {String(9+i).padStart(2,"0")}:24</small></div>{i<3&&<i/>}</article>)}</section></>;
}

function Reports() {
  const page = pages.find(p => p.path === "/reports")!;
  const reports = ["Open Purchase Orders", "Invoices on Hold", "Aged Payables", "Stock Valuation", "Work Order Status", "Sales by Customer", "Headcount", "Hires and Exits", "Audit Summary"];
  return <><PageTitle page={page} actions={<Button>Report history</Button>} /><section className="report-filters"><label>As-of date<input type="date" defaultValue="2026-10-15"/></label><label>Business unit<select><option>Pune Manufacturing</option></select></label><label>Department<select><option>All departments</option></select></label><Button variant="primary">Apply</Button></section><div className="report-grid">{reports.map((r,i)=><article key={r}><div><BarChart3 size={21}/><Status value={i%3===0?"Updated today":"Available"}/></div><h2>{r}</h2><p>{i%2?"Operational detail with status, owner and aging.":"Current balances and movement for the selected period."}</p><div><Button>Open report</Button><Button variant="quiet">Export CSV</Button></div></article>)}</div></>;
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

function AuditTable() {
  return <div className="table-scroll"><table><thead><tr><th>When</th><th>User</th><th>Role</th><th>Field</th><th>Old value</th><th>New value</th></tr></thead><tbody>{Array.from({length:6},(_,i)=><tr key={i}><td>1{4-i}-Oct-2026, {10+i}:24</td><td>{users[i+1].name}</td><td>{users[i+1].role}</td><td>{["Status","Amount","Need-by date","Approver"][i%4]}</td><td>{i%2?"Draft":"₹ 4,52,000.00"}</td><td>{i%2?"Submitted":"₹ 4,87,250.00"}</td></tr>)}</tbody></table></div>;
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
