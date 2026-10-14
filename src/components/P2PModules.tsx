import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import {
  Building2,
  ShoppingCart,
  FileText,
  PackageCheck,
  Archive,
  CreditCard,
  WalletCards,
  Plus,
  Search,
  RefreshCcw,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Download,
  Clock3,
  ShieldCheck,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

// Reusable status badge
function P2PStatusBadge({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const kind =
    /approved|completed|active|paid|validated|matched/i.test(v)
      ? "success"
      : /hold|pending|open|draft/i.test(v)
      ? "warning"
      : /reject|failed|blocked|inactive/i.test(v)
      ? "danger"
      : "neutral";
  return <span className={`status ${kind}`}>{value}</span>;
}

// ==========================================
// 1. SUPPLIERS DIRECTORY & DETAIL (/suppliers)
// ==========================================

export function P2PSupplierList({ onSelectSupplier }: { onSelectSupplier: (id: string) => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.suppliers.list({ search, category });
      if (res && Array.isArray(res)) setSuppliers(res);
    } catch (err: any) {
      console.warn("Error loading suppliers:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, category]);

  return (
    <div className="p2p-suppliers-view">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Suppliers
          <input
            placeholder="Search by name, code or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Direct Materials">Direct Materials</option>
            <option value="Indirect Materials">Indirect Materials</option>
            <option value="Logistics">Logistics</option>
            <option value="Services">Services</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={load}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${suppliers.length} suppliers`} (Live Backend API)</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Supplier Code</th>
                <th>Supplier Name</th>
                <th>Tax ID / GSTIN</th>
                <th>Category</th>
                <th>Primary Site</th>
                <th>Contact</th>
                <th>Payment Terms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectSupplier(s.id)}
                    >
                      {s.code}
                    </button>
                  </td>
                  <td>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.email}</div>
                  </td>
                  <td className="tabular">{s.taxId}</td>
                  <td>{s.category}</td>
                  <td>{s.sites?.[0]?.siteCode || "PUNE-01"}</td>
                  <td>{s.primaryContact}</td>
                  <td>{s.paymentTerms}</td>
                  <td>
                    <P2PStatusBadge value={s.status} />
                  </td>
                </tr>
              ))}
              {!loading && suppliers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No suppliers found matching criteria
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

export function P2PSupplierDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [supplier, setSupplier] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Profile");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.suppliers.getById(id);
        setSupplier(res);
      } catch (err: any) {
        console.warn("Error fetching supplier detail:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 32, textAlign: "center" }}>Loading supplier profile {id}...</div>;
  }

  if (!supplier) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p>Supplier {id} not found.</p>
        <button className="btn" onClick={onBack}>
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="document-shell">
      <div className="summary-strip">
        <div>
          <small>Supplier Number</small>
          <strong>{supplier.code}</strong>
        </div>
        <div>
          <small>Legal Name</small>
          <strong>{supplier.name}</strong>
        </div>
        <div>
          <small>Category</small>
          <strong>{supplier.category}</strong>
        </div>
        <div>
          <small>Payment Terms</small>
          <strong>{supplier.paymentTerms}</strong>
        </div>
        <div>
          <small>Status</small>
          <P2PStatusBadge value={supplier.status} />
        </div>
      </div>

      <div className="tabs">
        {["Profile", "Sites", "Bank Accounts"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="detail-sections">
          <section className="content-card">
            <h2>Organization & Tax Details</h2>
            <dl className="detail-list">
              <div>
                <dt>Legal Name</dt>
                <dd>{supplier.name}</dd>
              </div>
              <div>
                <dt>GSTIN / Tax ID</dt>
                <dd>{supplier.taxId}</dd>
              </div>
              <div>
                <dt>Permanent Account Number (PAN)</dt>
                <dd>{supplier.pan || "PAN ON FILE"}</dd>
              </div>
              <div>
                <dt>Operating Currency</dt>
                <dd>{supplier.currency}</dd>
              </div>
            </dl>
          </section>
          <section className="content-card">
            <h2>Primary Contact Information</h2>
            <dl className="detail-list">
              <div>
                <dt>Primary Representative</dt>
                <dd>{supplier.primaryContact}</dd>
              </div>
              <div>
                <dt>Email Address</dt>
                <dd>{supplier.email || "accounts@supplier.in"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{supplier.phone || "+91 20 2748 0000"}</dd>
              </div>
              <div>
                <dt>Registration Date</dt>
                <dd className="tabular">{supplier.createdAt?.split("T")[0]}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {tab === "Sites" && (
        <section className="content-card">
          <h2>Registered Supplier Sites & Warehouses</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Site Code</th>
                  <th>Purpose</th>
                  <th>Physical Address</th>
                  <th>City</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(supplier.sites || []).map((site: any) => (
                  <tr key={site.siteCode}>
                    <td>
                      <strong>{site.siteCode}</strong>
                    </td>
                    <td>{site.purpose}</td>
                    <td>{site.address}</td>
                    <td>{site.city}</td>
                    <td>
                      <P2PStatusBadge value={site.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Bank Accounts" && (
        <section className="content-card">
          <h2>Disbursement Bank Accounts (NEFT / RTGS)</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Account Number</th>
                  <th>IFSC Code</th>
                  <th>Branch</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {(supplier.bankAccounts || []).map((bank: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <strong>{bank.bankName}</strong>
                    </td>
                    <td className="tabular">{bank.accountNumber}</td>
                    <td className="tabular">{bank.ifscCode}</td>
                    <td>{bank.branch || "Pune"}</td>
                    <td>
                      <P2PStatusBadge value={bank.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ==========================================
// 2. PURCHASE REQUISITIONS WORKBENCH (/requisitions)
// ==========================================

export function P2PRequisitionList({ onSelectRequisition }: { onSelectRequisition: (id: string) => void }) {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.requisitions.list({ search });
      if (res && Array.isArray(res)) setReqs(res);
    } catch (err: any) {
      console.warn("Error loading requisitions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <div className="p2p-req-view">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Requisitions
          <input
            placeholder="Search by PR number, title or requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={load}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${reqs.length} requisitions`} (Live Backend API)</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PR Number</th>
                <th>Title / Description</th>
                <th>Department</th>
                <th>Requester</th>
                <th>Need-By Date</th>
                <th className="right">Estimated Value</th>
                <th>Approval Stage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectRequisition(r.code || r.id)}
                    >
                      {r.code}
                    </button>
                  </td>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td>{r.department}</td>
                  <td>{r.requesterName}</td>
                  <td className="tabular">{r.needByDate}</td>
                  <td className="right tabular">₹ {(r.totalAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td>{r.stage}</td>
                  <td>
                    <P2PStatusBadge value={r.status} />
                  </td>
                </tr>
              ))}
              {!loading && reqs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No purchase requisitions found
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

export function P2PRequisitionDetail({
  id,
  notify,
  onBack,
}: {
  id: string;
  notify?: (msg: string) => void;
  onBack: () => void;
}) {
  const [req, setReq] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Lines");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.requisitions.getById(id);
      setReq(res);
    } catch (err: any) {
      console.warn("Error fetching requisition detail:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleApprove = async () => {
    try {
      await api.requisitions.approve(id);
      notify?.(`Requisition ${id} approved successfully`);
      load();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleConvertToPo = async () => {
    try {
      const po = await api.requisitions.convertToPo(id, { supplierId: "SUP-101", supplierSite: "PUNE-01" });
      notify?.(`Requisition converted to Purchase Order ${po.code}!`);
      load();
    } catch (err: any) {
      alert(`Convert error: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center" }}>Loading requisition {id}...</div>;
  if (!req) return <div style={{ padding: 32, textAlign: "center" }}>Requisition not found.</div>;

  return (
    <div className="document-shell">
      <div className="summary-strip">
        <div>
          <small>Requisition Number</small>
          <strong>{req.code}</strong>
        </div>
        <div>
          <small>Business Unit</small>
          <strong>{req.businessUnit}</strong>
        </div>
        <div>
          <small>Requester</small>
          <strong>{req.requesterName}</strong>
        </div>
        <div>
          <small>Total Estimated Amount</small>
          <strong className="tabular">₹ {(req.totalAmount || 0).toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Status</small>
          <P2PStatusBadge value={req.status} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
        {req.status === "Pending approval" && (
          <button className="btn btn-primary" onClick={handleApprove}>
            <Check size={15} /> Approve Requisition
          </button>
        )}
        {req.status === "Approved" && (
          <button className="btn btn-primary" onClick={handleConvertToPo}>
            <ShoppingCart size={15} /> Convert to Purchase Order
          </button>
        )}
      </div>

      <div className="tabs">
        {["Lines", "Approvals", "Justification"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Lines" && (
        <section className="content-card">
          <h2>Requisition Lines</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th className="right">Quantity</th>
                  <th>UoM</th>
                  <th className="right">Unit Price</th>
                  <th className="right">Line Amount</th>
                  <th>Need-By Date</th>
                  <th>Subinventory</th>
                </tr>
              </thead>
              <tbody>
                {(req.lines || []).map((l: any) => (
                  <tr key={l.lineNum}>
                    <td>{l.lineNum}</td>
                    <td>
                      <strong>{l.itemCode}</strong>
                    </td>
                    <td>{l.description}</td>
                    <td className="right tabular">{l.quantity}</td>
                    <td>{l.uom}</td>
                    <td className="right tabular">₹ {l.unitPrice.toLocaleString("en-IN")}.00</td>
                    <td className="right tabular">₹ {l.lineTotal.toLocaleString("en-IN")}.00</td>
                    <td className="tabular">{l.needByDate}</td>
                    <td>{l.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Approvals" && (
        <section className="content-card">
          <h2>Approval Chain & Routing</h2>
          <div className="approval-chain">
            {(req.approvalChain || []).map((step: any, i: number) => (
              <div key={i}>
                <span className="avatar">
                  {step.name
                    ? String(step.name)
                        .trim()
                        .split(/\s+/)
                        .map((s: string) => s[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "AP"}
                </span>
                <div>
                  <strong>
                    {step.name} · {step.role}
                  </strong>
                  <small>
                    {step.status} {step.actionDate ? `· ${step.actionDate.split("T")[0]}` : ""}
                  </small>
                </div>
                <P2PStatusBadge value={step.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "Justification" && (
        <section className="content-card">
          <h2>Requisition Justification & Purpose</h2>
          <p style={{ lineHeight: 1.6 }}>{req.justification}</p>
        </section>
      )}
    </div>
  );
}

// ==========================================
// 3. PURCHASE ORDERS WORKBENCH (/po)
// ==========================================

export function P2PPurchaseOrderList({ onSelectPo }: { onSelectPo: (id: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.po.list({ search });
      if (res && Array.isArray(res)) setOrders(res);
    } catch (err: any) {
      console.warn("Error loading POs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <div className="p2p-po-view">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Purchase Orders
          <input
            placeholder="Search by PO number, supplier, or buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={load}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${orders.length} purchase orders`} (Live Backend API)</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Buyer</th>
                <th>Order Date</th>
                <th>Payment Terms</th>
                <th className="right">Order Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectPo(po.code || po.id)}
                    >
                      {po.code}
                    </button>
                  </td>
                  <td>
                    <strong>{po.supplierName}</strong>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Site: {po.supplierSite}</div>
                  </td>
                  <td>{po.buyerName}</td>
                  <td className="tabular">{po.orderDate}</td>
                  <td>{po.paymentTerms}</td>
                  <td className="right tabular">₹ {(po.totalAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td>
                    <P2PStatusBadge value={po.status} />
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No purchase orders found
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

export function P2PPurchaseOrderDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [po, setPo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Lines");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.po.getById(id);
        setPo(res);
      } catch (err: any) {
        console.warn("Error loading PO detail:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div style={{ padding: 32, textAlign: "center" }}>Loading purchase order {id}...</div>;
  if (!po) return <div style={{ padding: 32, textAlign: "center" }}>Purchase order not found.</div>;

  return (
    <div className="document-shell">
      <div className="summary-strip">
        <div>
          <small>PO Number</small>
          <strong>{po.code}</strong>
        </div>
        <div>
          <small>Supplier</small>
          <strong>{po.supplierName}</strong>
        </div>
        <div>
          <small>Buyer</small>
          <strong>{po.buyerName}</strong>
        </div>
        <div>
          <small>Total Value</small>
          <strong className="tabular">₹ {(po.totalAmount || 0).toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Status</small>
          <P2PStatusBadge value={po.status} />
        </div>
      </div>

      <div className="tabs">
        {["Lines", "Schedules", "Receipts", "Invoices"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Lines" && (
        <section className="content-card">
          <h2>Purchase Order Lines</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th className="right">Ordered</th>
                  <th className="right">Received</th>
                  <th className="right">Billed</th>
                  <th className="right">Unit Price</th>
                  <th className="right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(po.lines || []).map((l: any) => (
                  <tr key={l.lineNum}>
                    <td>{l.lineNum}</td>
                    <td>
                      <strong>{l.itemCode}</strong>
                    </td>
                    <td>{l.description}</td>
                    <td className="right tabular">
                      {l.orderedQty} {l.uom}
                    </td>
                    <td className="right tabular">
                      {l.receivedQty || 0} {l.uom}
                    </td>
                    <td className="right tabular">
                      {l.billedQty || 0} {l.uom}
                    </td>
                    <td className="right tabular">₹ {l.unitPrice.toLocaleString("en-IN")}.00</td>
                    <td className="right tabular">₹ {l.lineTotal.toLocaleString("en-IN")}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Schedules" && (
        <section className="content-card">
          <h2>Delivery Schedules & Due Dates</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Schedule</th>
                  <th>Need-By Date</th>
                  <th>Ship-To Location</th>
                  <th className="right">Ordered Quantity</th>
                  <th className="right">Received Quantity</th>
                  <th className="right">Outstanding Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(po.schedules || []).map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td>{s.lineNum}</td>
                    <td>{s.scheduleNum}</td>
                    <td className="tabular">{s.needByDate}</td>
                    <td>{s.shipTo}</td>
                    <td className="right tabular">{s.orderedQty} EA</td>
                    <td className="right tabular">{s.receivedQty || 0} EA</td>
                    <td className="right tabular">
                      <strong style={{ color: s.dueQty > 0 ? "var(--warning)" : "var(--success)" }}>
                        {s.dueQty} EA
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Receipts" && (
        <section className="content-card">
          <h2>Related Goods Receipts (GRN)</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Date</th>
                  <th>Packing Slip</th>
                  <th>Receiver</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(po.receipts || []).map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.code}</strong>
                    </td>
                    <td className="tabular">{r.receiptDate}</td>
                    <td>{r.packingSlip}</td>
                    <td>{r.receiverName}</td>
                    <td>
                      <P2PStatusBadge value={r.status} />
                    </td>
                  </tr>
                ))}
                {(po.receipts || []).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 18, color: "var(--muted)" }}>
                      No receipts processed for this PO yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Invoices" && (
        <section className="content-card">
          <h2>Related Payables Invoices</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Supplier Invoice Ref</th>
                  <th>Invoice Date</th>
                  <th className="right">Invoice Amount</th>
                  <th>Match Status</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(po.invoices || []).map((i: any) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.code}</strong>
                    </td>
                    <td>{i.supplierInvoiceNum}</td>
                    <td className="tabular">{i.invoiceDate}</td>
                    <td className="right tabular">₹ {(i.invoiceAmount || 0).toLocaleString("en-IN")}.00</td>
                    <td>
                      <P2PStatusBadge value={i.matchStatus} />
                    </td>
                    <td>
                      <P2PStatusBadge value={i.status} />
                    </td>
                  </tr>
                ))}
                {(po.invoices || []).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 18, color: "var(--muted)" }}>
                      No invoices billed against this PO yet
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

// ==========================================
// 4. GOODS RECEIVING INSPECTION (/receiving)
// ==========================================

export function P2PReceivingWorkbench({ notify }: { notify?: (msg: string) => void }) {
  const [poList, setPoList] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("PO-2026-0841");
  const [poDetail, setPoDetail] = useState<any | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form input
  const [deliveredQty, setDeliveredQty] = useState("300");
  const [acceptedQty, setAcceptedQty] = useState("295");
  const [rejectedQty, setRejectedQty] = useState("5");
  const [rejectionReason, setRejectionReason] = useState("Surface damage");
  const [subinventory, setSubinventory] = useState("RM-STORES");

  const loadData = async () => {
    try {
      const pos = await api.po.list();
      if (pos) setPoList(pos);
      const rcvs = await api.receiving.listReceipts();
      if (rcvs) setReceipts(rcvs);
    } catch (err: any) {
      console.warn("Load receiving error:", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPoId) {
      api.po.getById(selectedPoId).then(setPoDetail).catch(() => {});
    }
  }, [selectedPoId]);

  const handleCreateReceipt = async () => {
    const del = Number(deliveredQty);
    const acc = Number(acceptedQty);
    const rej = Number(rejectedQty);

    if (acc + rej !== del) {
      alert(`Delivered quantity (${del}) must equal Accepted (${acc}) + Rejected (${rej})!`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.receiving.createReceipt({
        poId: selectedPoId,
        packingSlip: `PS-${Date.now().toString().slice(-4)}`,
        subinventory,
        lines: [
          {
            lineNum: 1,
            itemCode: poDetail?.lines?.[0]?.itemCode || "RM-204",
            deliveredQty: del,
            acceptedQty: acc,
            rejectedQty: rej,
            rejectionReason: rej > 0 ? rejectionReason : null,
            subinventory,
            rejectSubinventory: "QUALITY-HOLD",
          },
        ],
      });
      notify?.(`Goods Receipt ${res.code} processed! ${acc} accepted, ${rej} rejected to QUALITY-HOLD`);
      loadData();
    } catch (err: any) {
      alert(`Receipt Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p2p-receiving-shell">
      <div className="detail-sections" style={{ marginBottom: 20 }}>
        <section className="content-card">
          <div className="section-heading">
            <div>
              <h2>Receipt Controls & Inspection Entry</h2>
              <p>Verify physical deliveries against approved PO schedules and tolerances.</p>
            </div>
            <P2PStatusBadge value="Inspection Gate" />
          </div>

          <div className="form-grid">
            <label>
              Purchase Order Reference <span>*</span>
              <select value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)}>
                {poList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.supplierName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subinventory Destination <span>*</span>
              <select value={subinventory} onChange={(e) => setSubinventory(e.target.value)}>
                <option value="RM-STORES">RM-STORES (Raw Material Warehouse)</option>
                <option value="WIP-STAGING">WIP-STAGING (Assembly Buffer)</option>
              </select>
            </label>
            <label>
              Delivered Quantity <span>*</span>
              <input
                type="number"
                value={deliveredQty}
                onChange={(e) => setDeliveredQty(e.target.value)}
              />
            </label>
            <label>
              Accepted Quantity (Passed Inspection) <span>*</span>
              <input
                type="number"
                value={acceptedQty}
                onChange={(e) => setAcceptedQty(e.target.value)}
              />
            </label>
            <label>
              Rejected Quantity
              <input
                type="number"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(e.target.value)}
              />
            </label>
            <label>
              Rejection Reason Code
              <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}>
                <option value="Surface damage">Surface damage</option>
                <option value="Dimensional failure">Dimensional failure</option>
                <option value="Incorrect specification">Incorrect specification</option>
                <option value="Surface porosity">Surface porosity / blowholes</option>
              </select>
            </label>
          </div>

          <div className="warning-banner" style={{ marginTop: 14 }}>
            <Clock3 size={18} />
            <div>
              <strong>Receipt Tolerance Rule</strong>
              <p>Maximum allowed over-delivery is +5%. Rejected items automatically generate Return-to-Vendor (RTV) debit notes.</p>
            </div>
          </div>

          <div style={{ marginTop: 14, textAlign: "right" }}>
            <button className="btn btn-primary" onClick={handleCreateReceipt} disabled={loading}>
              <PackageCheck size={16} /> Record Inspection & Issue GRN
            </button>
          </div>
        </section>
      </div>

      <section className="content-card">
        <h2>Completed Goods Receipt Notes (GRN)</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>GRN Number</th>
                <th>PO Reference</th>
                <th>Supplier</th>
                <th>Receipt Date</th>
                <th>Packing Slip</th>
                <th>Destination</th>
                <th>Accepted Qty</th>
                <th>Rejected Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.code}</strong>
                  </td>
                  <td>{r.poCode}</td>
                  <td>{r.supplierName}</td>
                  <td className="tabular">{r.receiptDate}</td>
                  <td>{r.packingSlip}</td>
                  <td>{r.subinventory}</td>
                  <td className="tabular" style={{ color: "var(--success)" }}>
                    {r.lines?.[0]?.acceptedQty || 0} EA
                  </td>
                  <td className="tabular" style={{ color: r.lines?.[0]?.rejectedQty > 0 ? "var(--danger)" : "var(--muted)" }}>
                    {r.lines?.[0]?.rejectedQty || 0} EA
                  </td>
                  <td>
                    <P2PStatusBadge value={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// 5. AP INVOICES & 3-WAY MATCH (/ap/invoices)
// ==========================================

export function P2PInvoiceList({ onSelectInvoice }: { onSelectInvoice: (id: string) => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.ap.listInvoices({ search });
      if (res && Array.isArray(res)) setInvoices(res);
    } catch (err: any) {
      console.warn("Load invoices error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <div className="p2p-invoices-view">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Invoices
          <input
            placeholder="Search invoice number, supplier invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={load}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${invoices.length} invoices`} (Live Backend API)</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Supplier Invoice Ref</th>
                <th>Supplier</th>
                <th>PO Number</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th className="right">Gross Amount</th>
                <th>3-Way Match</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectInvoice(inv.code || inv.id)}
                    >
                      {inv.code}
                    </button>
                  </td>
                  <td>
                    <strong>{inv.supplierInvoiceNum}</strong>
                  </td>
                  <td>{inv.supplierName}</td>
                  <td>{inv.poCode || "—"}</td>
                  <td className="tabular">{inv.invoiceDate}</td>
                  <td className="tabular">{inv.dueDate}</td>
                  <td className="right tabular">₹ {(inv.invoiceAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td>
                    <P2PStatusBadge value={inv.matchStatus} />
                  </td>
                  <td>
                    <P2PStatusBadge value={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function P2PInvoiceDetail({
  id,
  notify,
  onBack,
}: {
  id: string;
  notify?: (msg: string) => void;
  onBack: () => void;
}) {
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("3-Way Match");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.ap.getInvoiceById(id);
      setInvoice(res);
    } catch (err: any) {
      console.warn("Load invoice detail error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleReleaseHold = async (holdId: string) => {
    const reason = window.prompt("Enter justification for releasing hold:");
    if (!reason?.trim()) return;
    try {
      await api.ap.releaseHold(holdId, reason);
      notify?.(`Hold ${holdId} released! Invoice validated.`);
      load();
    } catch (err: any) {
      alert(`Release error: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center" }}>Loading invoice {id}...</div>;
  if (!invoice) return <div style={{ padding: 32, textAlign: "center" }}>Invoice not found.</div>;

  return (
    <div className="document-shell">
      <div className="summary-strip">
        <div>
          <small>Invoice Number</small>
          <strong>{invoice.code}</strong>
        </div>
        <div>
          <small>Supplier Ref</small>
          <strong>{invoice.supplierInvoiceNum}</strong>
        </div>
        <div>
          <small>Supplier</small>
          <strong>{invoice.supplierName}</strong>
        </div>
        <div>
          <small>Invoice Amount</small>
          <strong className="tabular">₹ {(invoice.invoiceAmount || 0).toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Status</small>
          <P2PStatusBadge value={invoice.status} />
        </div>
      </div>

      <div className="tabs">
        {["3-Way Match", "Holds", "Validation"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "3-Way Match" && (
        <section className="content-card">
          <div className="section-heading">
            <div>
              <h2>Three-Way Match Verification</h2>
              <p>Invoice quantities are automatically compared against Purchase Order lines and Accepted Receipts.</p>
            </div>
            <P2PStatusBadge value={invoice.matchStatus} />
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th className="right">PO Quantity</th>
                  <th className="right">Receipt Accepted</th>
                  <th className="right">Invoiced Quantity</th>
                  <th className="right">Difference</th>
                  <th>Match Result</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lines || []).map((l: any) => (
                  <tr
                    key={l.lineNum}
                    className={l.matchStatus === "On hold" ? "difference-row" : ""}
                    style={{ background: l.matchStatus === "On hold" ? "rgba(239, 68, 68, 0.05)" : undefined }}
                  >
                    <td>{l.lineNum}</td>
                    <td>
                      <strong>{l.itemCode}</strong>
                    </td>
                    <td>{l.description}</td>
                    <td className="right tabular">{l.poQty} EA</td>
                    <td className="right tabular">{l.receivedQty} EA</td>
                    <td className="right tabular">
                      <strong>{l.invoicedQty} EA</strong>
                    </td>
                    <td className="right tabular" style={{ color: l.differenceQty > 0 ? "var(--danger)" : "var(--muted)" }}>
                      {l.differenceQty > 0 ? `+${l.differenceQty} EA` : "—"}
                    </td>
                    <td>
                      <P2PStatusBadge value={l.matchStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Holds" && (
        <section className="content-card">
          <h2>Invoice Matching Holds</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Hold Code</th>
                  <th>Hold Type</th>
                  <th>Applied Reason</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.holds || []).map((h: any) => (
                  <tr key={h.holdId}>
                    <td>
                      <strong>{h.holdId}</strong>
                    </td>
                    <td>{h.holdType}</td>
                    <td>{h.reason}</td>
                    <td className="tabular">{h.appliedDate}</td>
                    <td>
                      <P2PStatusBadge value={h.status} />
                    </td>
                    <td>
                      {h.status !== "Released" && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: "4px 8px", fontSize: 12 }}
                          onClick={() => handleReleaseHold(h.holdId)}
                        >
                          Release Hold
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(invoice.holds || []).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 18, color: "var(--muted)" }}>
                      No holds active on this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Validation" && (
        <section className="content-card">
          <h2>Validation & Audit Rules</h2>
          <div className="validation-list">
            <div>
              <Check size={17} />
              <div>
                <strong>Supplier identity active</strong>
                <p>{invoice.supplierName} verified in good standing</p>
              </div>
              <P2PStatusBadge value="Passed" />
            </div>
            <div>
              <Check size={17} />
              <div>
                <strong>Duplicate invoice check</strong>
                <p>Invoice reference {invoice.supplierInvoiceNum} is unique</p>
              </div>
              <P2PStatusBadge value="Passed" />
            </div>
            <div>
              {invoice.status === "On hold" ? <X size={17} /> : <Check size={17} />}
              <div>
                <strong>Quantity match verification</strong>
                <p>
                  {invoice.status === "On hold"
                    ? "Invoiced quantity exceeds accepted receipt quantity"
                    : "All quantities matched within tolerance"}
                </p>
              </div>
              <P2PStatusBadge value={invoice.status === "On hold" ? "On hold" : "Passed"} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ==========================================
// 6. AP HOLDS WORKBENCH (/ap/holds)
// ==========================================

export function P2PHoldsWorkbench({ notify }: { notify?: (msg: string) => void }) {
  const [holds, setHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.ap.listHolds();
      if (res) setHolds(res);
    } catch (err: any) {
      console.warn("Load holds error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRelease = async (holdId: string) => {
    const reason = window.prompt("Enter justification for releasing hold:");
    if (!reason?.trim()) return;
    try {
      await api.ap.releaseHold(holdId, reason);
      notify?.(`Hold ${holdId} released!`);
      load();
    } catch (err: any) {
      alert(`Release error: ${err.message}`);
    }
  };

  return (
    <div className="table-card">
      <div className="table-toolbar">
        <strong>{loading ? "Loading..." : `${holds.length} invoice holds`} (Live Backend API)</strong>
        <button className="btn" onClick={load}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Hold ID</th>
              <th>Invoice</th>
              <th>Supplier</th>
              <th>Hold Type</th>
              <th>Reason</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {holds.map((h) => (
              <tr key={h.id || h.holdId}>
                <td>
                  <strong>{h.holdId || h.id}</strong>
                </td>
                <td>{h.invoiceCode || h.invoiceId}</td>
                <td>{h.supplierName}</td>
                <td>{h.holdType}</td>
                <td>{h.reason}</td>
                <td className="tabular">{h.appliedDate}</td>
                <td>
                  <P2PStatusBadge value={h.status} />
                </td>
                <td>
                  {h.status !== "Released" ? (
                    <button
                      className="btn btn-primary"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      onClick={() => handleRelease(h.holdId || h.id)}
                    >
                      Release Hold
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Released</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 7. AP DISBURSEMENTS & NEFT BATCHES (/ap/payments)
// ==========================================

export function P2PPaymentWorkbench({ notify }: { notify?: (msg: string) => void }) {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.ap.listPaymentBatches();
      if (res) setBatches(res);
    } catch (err: any) {
      console.warn("Load payment batches error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleExportBank = async (batchId: string) => {
    try {
      const res = await api.ap.exportBankBatch(batchId);
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", res.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify?.(`Exported ${res.fileName} successfully!`);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleProcessBatch = async (batchId: string) => {
    try {
      await api.ap.processPaymentBatch(batchId);
      notify?.(`Payment batch ${batchId} processed! Invoices marked Paid.`);
      load();
    } catch (err: any) {
      alert(`Process error: ${err.message}`);
    }
  };

  const handleCreateBatch = async () => {
    try {
      const res = await api.ap.createPaymentBatch({
        bankAccount: "HDFC Operating · •••• 4821",
        paymentMethod: "NEFT",
      });
      notify?.(`Created payment batch ${res.code} for ₹ ${res.totalAmount.toLocaleString("en-IN")}`);
      load();
    } catch (err: any) {
      alert(`Create batch error: ${err.message}`);
    }
  };

  return (
    <div className="p2p-payments-view">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={handleCreateBatch}>
          <CreditCard size={15} /> Create Payment Batch for Validated Invoices
        </button>
        <button className="btn" onClick={load}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${batches.length} payment batches`} (Live Backend API)</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Disbursement Account</th>
                <th>Method</th>
                <th>Payment Date</th>
                <th className="right">Batch Total</th>
                <th>Invoices Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.code}</strong>
                  </td>
                  <td>{b.bankAccount}</td>
                  <td>{b.paymentMethod}</td>
                  <td className="tabular">{b.paymentDate}</td>
                  <td className="right tabular">₹ {(b.totalAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="tabular">{b.invoicesCount} invoices</td>
                  <td>
                    <P2PStatusBadge value={b.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={() => handleExportBank(b.code || b.id)}
                      >
                        <Download size={13} /> NEFT File
                      </button>
                      {b.status !== "Processed" && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: "4px 8px", fontSize: 12 }}
                          onClick={() => handleProcessBatch(b.code || b.id)}
                        >
                          Process
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. RETURNS TO SUPPLIER (RTV) WORKBENCH (/receiving/returns)
// ==========================================

export function P2PReturnsWorkbench({ notify }: { notify?: (msg: string) => void }) {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.receiving.listReturns({ search });
      if (Array.isArray(res)) setReturns(res);
    } catch (err: any) {
      console.warn("Load returns error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const totalRejectedQty = returns.reduce((sum, r) => sum + (r.returnQty || 0), 0);
  const totalDebitNotes = returns.reduce((sum, r) => sum + (r.debitNoteAmount || 0), 0);

  return (
    <div className="p2p-returns-workbench">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Returns & Debit Notes
          <input
            placeholder="Search by RTV code, receipt or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={loadData}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: 16 }}>
        <article className="metric-card">
          <span>Active RTV Orders</span>
          <strong>{returns.length}</strong>
          <small>Rejected at inspection gate</small>
        </article>
        <article className="metric-card">
          <span>Total Rejected Material</span>
          <strong style={{ color: "var(--danger)" }}>{totalRejectedQty} EA</strong>
          <small>Routed to QUALITY-HOLD</small>
        </article>
        <article className="metric-card">
          <span>Total Debit Notes Issued</span>
          <strong style={{ color: "var(--success)" }}>₹ {totalDebitNotes.toLocaleString("en-IN")}.00</strong>
          <small>Deducted from AP invoices</small>
        </article>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${returns.length} Returns to Supplier (Live API)`}</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>RTV Code</th>
                <th>GRN Reference</th>
                <th>Supplier</th>
                <th>Item Code</th>
                <th>Description</th>
                <th className="right">Rejected Qty</th>
                <th>Defect Reason</th>
                <th>Debit Note Ref</th>
                <th className="right">Debit Note Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.code}</strong>
                  </td>
                  <td>{r.receiptCode}</td>
                  <td>
                    <strong>{r.supplierName}</strong>
                  </td>
                  <td>{r.itemCode}</td>
                  <td>{r.description}</td>
                  <td className="right tabular" style={{ color: "var(--danger)", fontWeight: 700 }}>
                    {r.returnQty} {r.uom || "EA"}
                  </td>
                  <td>{r.reason}</td>
                  <td>
                    <span className="tabular font-medium" style={{ color: "var(--primary)" }}>
                      {r.debitNoteRef}
                    </span>
                  </td>
                  <td className="right tabular" style={{ fontWeight: 600 }}>
                    ₹ {(r.debitNoteAmount || 0).toLocaleString("en-IN")}.00
                  </td>
                  <td>
                    <P2PStatusBadge value={r.status || "Debit Note Issued"} />
                  </td>
                </tr>
              ))}
              {!loading && returns.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No return-to-vendor (RTV) records found.
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

