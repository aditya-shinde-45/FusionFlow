import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  Building2,
  ShoppingCart,
  Truck,
  FileText,
  CreditCard,
  RefreshCcw,
  Search,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Check,
  X,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  PackageCheck,
  FileClock,
  Printer,
  Download,
} from "lucide-react";

// Reusable Status Badge
export function StatusBadge({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const kind =
    /paid|shipped|booked|passed|active|delivered|applied/i.test(v)
      ? "success"
      : /open|pending|partially|warning|review/i.test(v)
      ? "warning"
      : /credit hold|closed|rejected|failed|danger/i.test(v)
      ? "danger"
      : "neutral";
  return <span className={`status ${kind}`}>{value}</span>;
}

// ---------------------------------------------------------------------------
// 1. CUSTOMER MASTER LIST (/customers)
// ---------------------------------------------------------------------------
export function O2CCustomerList({
  onSelectCustomer,
  notify,
}: {
  onSelectCustomer: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Customer State
  const [newName, setNewName] = useState("");
  const [newTaxId, setNewTaxId] = useState("");
  const [newCategory, setNewCategory] = useState("OEM Tier 1");
  const [newTerms, setNewTerms] = useState("Net 30");
  const [newLimit, setNewLimit] = useState("5000000");
  const [newSite, setNewSite] = useState("CHAKAN-SHIP");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.sales.customers({ category: categoryFilter, search });
      if (Array.isArray(res)) setCustomers(res);
    } catch (err: any) {
      console.warn("Failed to load customers:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [categoryFilter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.sales.createCustomer({
        name: newName,
        taxId: newTaxId,
        category: newCategory,
        paymentTerms: newTerms,
        creditLimit: Number(newLimit),
        primarySite: newSite,
        contactPerson: newContact,
        contactEmail: newEmail,
      });
      notify(`Customer ${res.code} · ${res.name} registered successfully`);
      setShowCreateModal(false);
      loadCustomers();
    } catch (err: any) {
      notify(`Customer registration failed: ${err.message}`);
    }
  };

  const summary = useMemo(() => {
    const totalLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const totalUsed = customers.reduce((sum, c) => sum + (c.creditUsed || 0), 0);
    return {
      count: customers.length,
      totalLimit,
      totalUsed,
      available: totalLimit - totalUsed,
    };
  }, [customers]);

  return (
    <div className="o2c-customers-list">
      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Active Customers</small>
          <strong>{summary.count} Registered</strong>
        </div>
        <div>
          <small>Total Extended Credit</small>
          <strong>₹ {(summary.totalLimit / 100000).toFixed(1)} Lakhs</strong>
        </div>
        <div>
          <small>Credit Utilized</small>
          <strong style={{ color: "var(--brand)" }}>
            ₹ {(summary.totalUsed / 100000).toFixed(1)} Lakhs
          </strong>
        </div>
        <div>
          <small>Available Credit Buffer</small>
          <strong style={{ color: "var(--success)" }}>
            ₹ {(summary.available / 100000).toFixed(1)} Lakhs
          </strong>
        </div>
      </div>

      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Customer
          <input
            placeholder="Search code, name, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Segment / Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="OEM Major">OEM Major</option>
            <option value="OEM Tier 1">OEM Tier 1</option>
            <option value="Aftermarket">Aftermarket</option>
          </select>
        </label>
        <div className="filter-actions" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button className="btn" onClick={loadCustomers}><RefreshCcw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Register Customer
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${customers.length} Customers`}</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>GSTIN</th>
                <th>Terms</th>
                <th className="right">Credit Limit</th>
                <th className="right">Credit Used</th>
                <th className="right">Available Credit</th>
                <th>Credit Status</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const avail = (c.creditLimit || 0) - (c.creditUsed || 0);
                const isOver = c.creditUsed > c.creditLimit;
                return (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="table-link"
                        style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                        onClick={() => onSelectCustomer(c.code || c.id)}
                      >
                        {c.code}
                      </button>
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.contactPerson} · {c.primarySite}</div>
                    </td>
                    <td>{c.category}</td>
                    <td className="tabular">{c.taxId}</td>
                    <td>{c.paymentTerms}</td>
                    <td className="right tabular">₹ {(c.creditLimit || 0).toLocaleString("en-IN")}.00</td>
                    <td className="right tabular">₹ {(c.creditUsed || 0).toLocaleString("en-IN")}.00</td>
                    <td className="right tabular">
                      <strong style={{ color: isOver ? "var(--danger)" : "inherit" }}>
                        ₹ {avail.toLocaleString("en-IN")}.00
                      </strong>
                    </td>
                    <td>
                      {isOver ? (
                        <span className="status danger">Credit Hold</span>
                      ) : (
                        <span className="status success">Normal</span>
                      )}
                    </td>
                    <td><StatusBadge value={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreate}>
              <div className="modal-head">
                <div>
                  <h2>Register Customer Account</h2>
                  <p>Add commercial account profile and configure credit governance</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label className="wide">Legal Name *<input required placeholder="e.g. Bharat Forge Ltd" value={newName} onChange={(e) => setNewName(e.target.value)} /></label>
                  <label>GSTIN *<input required placeholder="27AAACB1234F1ZQ" value={newTaxId} onChange={(e) => setNewTaxId(e.target.value)} /></label>
                  <label>Category *<select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}><option value="OEM Major">OEM Major</option><option value="OEM Tier 1">OEM Tier 1</option><option value="Aftermarket">Aftermarket</option></select></label>
                  <label>Payment Terms *<select value={newTerms} onChange={(e) => setNewTerms(e.target.value)}><option value="Net 30">Net 30</option><option value="Net 45">Net 45</option><option value="Advance">Advance</option></select></label>
                  <label>Credit Limit (₹) *<input type="number" required value={newLimit} onChange={(e) => setNewLimit(e.target.value)} /></label>
                  <label>Ship-To Site<input value={newSite} onChange={(e) => setNewSite(e.target.value)} /></label>
                  <label>Contact Person<input value={newContact} onChange={(e) => setNewContact(e.target.value)} /></label>
                  <label className="wide">Contact Email<input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. CUSTOMER DETAIL VIEW (/customers/:id)
// ---------------------------------------------------------------------------
export function O2CCustomerDetail({
  id,
  onBack,
  notify,
}: {
  id: string;
  onBack: () => void;
  notify: (msg: string) => void;
}) {
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.sales
      .customerDetail(id)
      .then((res) => setCustomer(res))
      .catch((err) => notify(`Failed to load customer: ${err.message}`))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !customer) {
    return (
      <div className="content-card" style={{ padding: 40, textAlign: "center" }}>
        <RefreshCcw size={24} className="spin" />
        <p style={{ marginTop: 12 }}>Loading Customer Profile {id}...</p>
      </div>
    );
  }

  const creditUsedPct = Math.min(100, Math.round(((customer.creditUsed || 0) / (customer.creditLimit || 1)) * 100));

  return (
    <div className="o2c-customer-detail">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn" onClick={onBack}>← Back to Customers</button>
        <StatusBadge value={customer.status} />
      </div>

      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Customer Code</small>
          <strong>{customer.code}</strong>
        </div>
        <div>
          <small>GSTIN</small>
          <strong>{customer.taxId}</strong>
        </div>
        <div>
          <small>Payment Terms</small>
          <strong>{customer.paymentTerms}</strong>
        </div>
        <div>
          <small>Credit Limit</small>
          <strong>₹ {customer.creditLimit?.toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Credit Utilized</small>
          <strong style={{ color: creditUsedPct > 90 ? "var(--danger)" : "var(--brand)" }}>
            {creditUsedPct}% (₹ {customer.creditUsed?.toLocaleString("en-IN")}.00)
          </strong>
        </div>
      </div>

      <div className="detail-sections" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <section className="content-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Commercial Profile</h2>
          <dl className="detail-list">
            <div><dt>Company Name</dt><dd><strong>{customer.name}</strong></dd></div>
            <div><dt>Segment</dt><dd>{customer.category}</dd></div>
            <div><dt>Primary Site</dt><dd>{customer.primarySite}</dd></div>
            <div><dt>Registered Address</dt><dd>{customer.address}</dd></div>
          </dl>
        </section>

        <section className="content-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Key Contacts & Governance</h2>
          <dl className="detail-list">
            <div><dt>Contact Person</dt><dd>{customer.contactPerson}</dd></div>
            <div><dt>Email</dt><dd>{customer.contactEmail}</dd></div>
            <div><dt>Phone</dt><dd>{customer.contactPhone}</dd></div>
            <div><dt>Credit Risk Rating</dt><dd><span className="status success">★ {customer.rating} / 5.0</span></dd></div>
          </dl>
        </section>
      </div>

      {/* Sales Orders */}
      <section className="content-card" style={{ padding: 18, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Recent Sales Orders</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Order Date</th>
                <th>Requested Ship Date</th>
                <th className="right">Order Amount</th>
                <th>Credit Status</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders?.map((o: any) => (
                <tr key={o.id}>
                  <td><strong>{o.code}</strong></td>
                  <td>{o.orderDate}</td>
                  <td>{o.requestedShipDate}</td>
                  <td className="right tabular">₹ {(o.grandTotal || 0).toLocaleString("en-IN")}.00</td>
                  <td><StatusBadge value={o.creditCheckStatus} /></td>
                  <td><StatusBadge value={o.status} /></td>
                </tr>
              ))}
              {(!customer.orders || customer.orders.length === 0) && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No sales orders recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Open AR Invoices */}
      <section className="content-card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Accounts Receivable (AR) Invoices</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th className="right">Total Amount</th>
                <th className="right">Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.invoices?.map((i: any) => (
                <tr key={i.id}>
                  <td><strong>{i.code}</strong></td>
                  <td>{i.invoiceDate}</td>
                  <td>{i.dueDate}</td>
                  <td className="right tabular">₹ {(i.totalAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">
                    <strong style={{ color: i.balanceDue > 0 ? "var(--warning)" : "inherit" }}>
                      ₹ {(i.balanceDue || 0).toLocaleString("en-IN")}.00
                    </strong>
                  </td>
                  <td><StatusBadge value={i.status} /></td>
                </tr>
              ))}
              {(!customer.invoices || customer.invoices.length === 0) && (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No invoices recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. PRICE LISTS WORKBENCH (/price-lists)
// ---------------------------------------------------------------------------
export function O2CPriceListsWorkbench() {
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sales.priceLists().then((res) => {
      if (Array.isArray(res)) setPriceLists(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="o2c-pricelists-workbench">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Commercial Contract Price Lists</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>Standard OEM contract and national aftermarket distributor rates</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {priceLists.map((pl) => (
          <div key={pl.id} className="content-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: 16 }}>{pl.code}</strong>
                <p style={{ margin: "2px 0 0 0", color: "var(--muted)" }}>{pl.name}</p>
              </div>
              <StatusBadge value={pl.active ? "Active" : "Expired"} />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              Validity: {pl.effectiveFrom} to {pl.effectiveTo} · Currency: {pl.currency}
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th className="right">List Price</th>
                    <th className="right">Min Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.items?.map((item: any) => (
                    <tr key={item.itemCode}>
                      <td><strong>{item.itemCode}</strong></td>
                      <td>{item.itemName}</td>
                      <td className="right tabular"><strong>₹ {item.listPrice.toLocaleString("en-IN")}.00</strong></td>
                      <td className="right tabular">{item.minQty} {item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. SALES ORDERS LIST (/orders)
// ---------------------------------------------------------------------------
export function O2CSalesOrderList({
  onSelectOrder,
  notify,
}: {
  onSelectOrder: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Order State
  const [selectedCust, setSelectedCust] = useState("CUST-101");
  const [selectedItem, setSelectedItem] = useState("FG-1001");
  const [orderQty, setOrderQty] = useState("200");
  const [shipDate, setShipDate] = useState("2026-10-25");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.sales.orders({ status: statusFilter });
      if (Array.isArray(res)) setOrders(res);
    } catch (err: any) {
      console.warn("Failed to load orders:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = selectedItem === "FG-1001" ? 1250.0 : 3400.0;
      const res = await api.sales.createOrder({
        customerId: selectedCust,
        requestedShipDate: shipDate,
        lines: [
          {
            itemCode: selectedItem,
            description: selectedItem === "FG-1001" ? "Ceramic Disc Brake Pads" : "Heavy Duty Clutch Plate",
            orderedQty: Number(orderQty),
            unitPrice: price,
            uom: selectedItem === "FG-1001" ? "SET" : "EA",
          },
        ],
      });
      notify(`Sales Order ${res.code} created (${res.status}, Credit Check: ${res.creditCheckStatus})`);
      setShowCreateModal(false);
      loadOrders();
    } catch (err: any) {
      notify(`Order booking error: ${err.message}`);
    }
  };

  return (
    <div className="o2c-orders-list">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Order Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Booked">Booked</option>
            <option value="Shipped">Shipped</option>
            <option value="Credit Hold">Credit Hold</option>
          </select>
        </label>
        <div className="filter-actions" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button className="btn" onClick={loadOrders}><RefreshCcw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create Sales Order
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{loading ? "Loading..." : `${orders.length} Sales Orders`}</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Requested Ship</th>
                <th className="right">Subtotal</th>
                <th className="right">GST (18%)</th>
                <th className="right">Grand Total</th>
                <th>Credit Check</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((so) => (
                <tr key={so.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectOrder(so.code || so.id)}
                    >
                      {so.code}
                    </button>
                  </td>
                  <td>
                    <strong>{so.customerName}</strong>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{so.shipToSite}</div>
                  </td>
                  <td className="tabular">{so.orderDate}</td>
                  <td className="tabular">{so.requestedShipDate}</td>
                  <td className="right tabular">₹ {(so.totalAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">₹ {(so.gstAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular"><strong>₹ {(so.grandTotal || 0).toLocaleString("en-IN")}.00</strong></td>
                  <td><StatusBadge value={so.creditCheckStatus} /></td>
                  <td><StatusBadge value={so.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreate}>
              <div className="modal-head">
                <div>
                  <h2>Book New Sales Order</h2>
                  <p>Real-time GST computation and credit limit verification</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label className="wide">
                    Customer Account *
                    <select value={selectedCust} onChange={(e) => setSelectedCust(e.target.value)}>
                      <option value="CUST-101">CUST-101 · Mahindra Components Ltd (Credit Limit: ₹ 50L)</option>
                      <option value="CUST-102">CUST-102 · Tata Motors Commercial Vehicles (Credit Limit: ₹ 80L)</option>
                      <option value="CUST-103">CUST-103 · Bajaj Auto Commercial Division (Credit Limit: ₹ 35L)</option>
                      <option value="CUST-104">CUST-104 · Ashok Leyland Parts Hub (Credit Limit: ₹ 40L)</option>
                    </select>
                  </label>
                  <label className="wide">
                    Finished Goods Item *
                    <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                      <option value="FG-1001">FG-1001 · Ceramic Disc Brake Pads (₹ 1,250.00 / SET)</option>
                      <option value="FG-1002">FG-1002 · Heavy Duty Clutch Plate Assembly (₹ 3,400.00 / EA)</option>
                    </select>
                  </label>
                  <label>
                    Order Quantity *
                    <input type="number" required min="1" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} />
                  </label>
                  <label>
                    Requested Ship Date *
                    <input type="date" required value={shipDate} onChange={(e) => setShipDate(e.target.value)} />
                  </label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Book Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. SALES ORDER DETAIL & SHIP CONFIRM (/orders/:id)
// ---------------------------------------------------------------------------
export function O2CSalesOrderDetail({
  id,
  onBack,
  notify,
}: {
  id: string;
  onBack: () => void;
  notify: (msg: string) => void;
}) {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);

  // Ship confirm form
  const [carrier, setCarrier] = useState("VRL Logistics Ltd");
  const [vehicle, setVehicle] = useState("MH-12-RN-9921");
  const [eway, setEway] = useState(`241088${Math.floor(100000 + Math.random() * 900000)}`);
  const [lr, setLr] = useState(`LR-VRL-${Math.floor(10000 + Math.random() * 90000)}`);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await api.sales.orderDetail(id);
      setOrder(res);
    } catch (err: any) {
      console.warn("Failed to load sales order:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleShipConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.sales.shipConfirm(order.code, {
        carrierName: carrier,
        vehicleNumber: vehicle,
        ewayBillNumber: eway,
        lrNumber: lr,
      });
      notify(`Shipment Confirmed: Delivery ${res.delivery.code} & Invoice ${res.invoice.code} generated`);
      setShowShipModal(false);
      loadDetail();
    } catch (err: any) {
      notify(`Ship confirm failed: ${err.message}`);
    }
  };

  if (loading || !order) {
    return (
      <div className="content-card" style={{ padding: 40, textAlign: "center" }}>
        <RefreshCcw size={24} className="spin" />
        <p style={{ marginTop: 12 }}>Loading Sales Order {id}...</p>
      </div>
    );
  }

  const isShippable = order.status === "Booked" && order.creditCheckStatus === "Passed";

  return (
    <div className="o2c-order-detail">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn" onClick={onBack}>← Back to Orders</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={loadDetail}><RefreshCcw size={14} /> Refresh</button>
          {isShippable && (
            <button className="btn btn-primary" onClick={() => setShowShipModal(true)}>
              <Truck size={14} /> Ship Confirm
            </button>
          )}
        </div>
      </div>

      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Order Number</small>
          <strong>{order.code}</strong>
        </div>
        <div>
          <small>Customer Account</small>
          <strong>{order.customerName}</strong>
        </div>
        <div>
          <small>Order Date</small>
          <strong>{order.orderDate}</strong>
        </div>
        <div>
          <small>Subtotal</small>
          <strong>₹ {order.totalAmount?.toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>GST (18%)</small>
          <strong>₹ {order.gstAmount?.toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Grand Total</small>
          <strong style={{ color: "var(--brand)" }}>₹ {order.grandTotal?.toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Status</small>
          <StatusBadge value={order.status} />
        </div>
      </div>

      {order.creditCheckStatus === "Credit Hold" && (
        <div className="warning-banner" style={{ marginBottom: 16 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Credit Limit Exceeded</strong>
            <p>This customer has exceeded their credit threshold. Order cannot be ship-confirmed until payment receipt is logged.</p>
          </div>
        </div>
      )}

      {/* Order Lines */}
      <section className="content-card" style={{ padding: 18, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Ordered Line Items</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Item Code</th>
                <th>Description</th>
                <th className="right">Ordered Qty</th>
                <th className="right">Shipped Qty</th>
                <th>UoM</th>
                <th className="right">Unit Price</th>
                <th className="right">Line Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.lines?.map((l: any) => (
                <tr key={l.lineNumber}>
                  <td>{l.lineNumber}</td>
                  <td><strong>{l.itemCode}</strong></td>
                  <td>{l.description}</td>
                  <td className="right tabular">{l.orderedQty}</td>
                  <td className="right tabular"><strong>{l.shippedQty}</strong></td>
                  <td>{l.uom}</td>
                  <td className="right tabular">₹ {(l.unitPrice || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">₹ {(l.lineAmount || 0).toLocaleString("en-IN")}.00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Linked Delivery & Invoice */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {order.delivery && (
          <section className="content-card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Linked Shipping Delivery</h2>
            <dl className="detail-list">
              <div><dt>Delivery Note</dt><dd><strong>{order.delivery.code}</strong></dd></div>
              <div><dt>Carrier</dt><dd>{order.delivery.carrierName}</dd></div>
              <div><dt>Vehicle Number</dt><dd>{order.delivery.vehicleNumber}</dd></div>
              <div><dt>E-Way Bill Number</dt><dd className="tabular">{order.delivery.ewayBillNumber}</dd></div>
              <div><dt>Dispatched Date</dt><dd>{order.delivery.deliveryDate}</dd></div>
            </dl>
          </section>
        )}

        {order.invoice && (
          <section className="content-card" style={{ padding: 18 }}>
            <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Linked AR Tax Invoice</h2>
            <dl className="detail-list">
              <div><dt>Invoice Code</dt><dd><strong>{order.invoice.code}</strong></dd></div>
              <div><dt>Invoice Date</dt><dd>{order.invoice.invoiceDate}</dd></div>
              <div><dt>Due Date</dt><dd>{order.invoice.dueDate}</dd></div>
              <div><dt>Total Amount</dt><dd>₹ {order.invoice.totalAmount?.toLocaleString("en-IN")}.00</dd></div>
              <div><dt>Status</dt><dd><StatusBadge value={order.invoice.status} /></dd></div>
            </dl>
          </section>
        )}
      </div>

      {/* Ship Confirm Modal */}
      {showShipModal && (
        <div className="modal-backdrop" onClick={() => setShowShipModal(false)}>
          <div className="modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleShipConfirm}>
              <div className="modal-head">
                <div>
                  <h2>Ship Confirm Order</h2>
                  <p>Issue delivery note, generate E-Way bill, and deduct finished goods stock</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowShipModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label className="wide">
                    Logistics Carrier *
                    <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                      <option value="VRL Logistics Ltd">VRL Logistics Ltd</option>
                      <option value="TCI Express Ltd">TCI Express Ltd</option>
                      <option value="Safechem Transport">Safechem Dedicated Transport</option>
                    </select>
                  </label>
                  <label>
                    Vehicle Number *
                    <input required value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
                  </label>
                  <label>
                    E-Way Bill Number *
                    <input required value={eway} onChange={(e) => setEway(e.target.value)} />
                  </label>
                  <label className="wide">
                    Lorry Receipt / Consignment LR *
                    <input required value={lr} onChange={(e) => setLr(e.target.value)} />
                  </label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowShipModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm & Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. SHIPPING WORKBENCH (/shipping)
// ---------------------------------------------------------------------------
export function O2CShippingWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.sales.deliveries();
      if (Array.isArray(res)) setDeliveries(res);
    } catch (err: any) {
      console.warn("Failed to load deliveries:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  return (
    <div className="o2c-shipping-workbench">
      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Outbound Deliveries</small>
          <strong>{deliveries.length} Shipments</strong>
        </div>
        <div>
          <small>Total Units Dispatched</small>
          <strong>
            {deliveries.reduce((sum, d) => sum + (d.totalQty || 0), 0).toLocaleString("en-IN")} Units
          </strong>
        </div>
        <div>
          <small>E-Way Bills Compliant</small>
          <strong style={{ color: "var(--success)" }}>100% Verified</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>Outbound Shipping & Delivery Register</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Delivery Note</th>
                <th>Sales Order</th>
                <th>Customer</th>
                <th>Dispatched Date</th>
                <th>Carrier</th>
                <th>Vehicle</th>
                <th>E-Way Bill</th>
                <th>Consignment LR</th>
                <th className="right">Dispatched Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((del) => (
                <tr key={del.id}>
                  <td><strong>{del.code}</strong></td>
                  <td>{del.soCode}</td>
                  <td>{del.customerName}</td>
                  <td className="tabular">{del.deliveryDate}</td>
                  <td>{del.carrierName}</td>
                  <td>{del.vehicleNumber}</td>
                  <td className="tabular">{del.ewayBillNumber}</td>
                  <td className="tabular">{del.lrNumber}</td>
                  <td className="right tabular"><strong>{del.totalQty}</strong></td>
                  <td><StatusBadge value={del.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. AR INVOICES WORKBENCH (/ar/invoices)
// ---------------------------------------------------------------------------
export function O2CARInvoicesWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.ar.invoices({ status: statusFilter });
      if (Array.isArray(res)) setInvoices(res);
    } catch (err: any) {
      console.warn("Failed to load AR invoices:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const summary = useMemo(() => {
    const total = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const paid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const balance = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
    return { total, paid, balance };
  }, [invoices]);

  return (
    <div className="o2c-arinvoices-workbench">
      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Total Invoiced (Gross)</small>
          <strong>₹ {summary.total.toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Collections Received</small>
          <strong style={{ color: "var(--success)" }}>₹ {summary.paid.toLocaleString("en-IN")}.00</strong>
        </div>
        <div>
          <small>Outstanding Receivables</small>
          <strong style={{ color: summary.balance > 0 ? "var(--warning)" : "inherit" }}>
            ₹ {summary.balance.toLocaleString("en-IN")}.00
          </strong>
        </div>
      </div>

      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Invoice Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Invoices</option>
            <option value="Open">Open</option>
            <option value="Paid">Paid</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="btn" onClick={loadInvoices}><RefreshCcw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>Accounts Receivable Tax Invoices</strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Invoice Code</th>
                <th>Sales Order</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th className="right">Taxable Amount</th>
                <th className="right">CGST</th>
                <th className="right">SGST</th>
                <th className="right">Total Amount</th>
                <th className="right">Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.code}</strong></td>
                  <td>{inv.soCode}</td>
                  <td>{inv.customerName}</td>
                  <td className="tabular">{inv.invoiceDate}</td>
                  <td className="tabular">{inv.dueDate}</td>
                  <td className="right tabular">₹ {(inv.taxableAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">₹ {(inv.cgstAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">₹ {(inv.sgstAmount || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular"><strong>₹ {(inv.totalAmount || 0).toLocaleString("en-IN")}.00</strong></td>
                  <td className="right tabular">
                    <strong style={{ color: inv.balanceDue > 0 ? "var(--warning)" : "var(--muted)" }}>
                      ₹ {(inv.balanceDue || 0).toLocaleString("en-IN")}.00
                    </strong>
                  </td>
                  <td><StatusBadge value={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. AR RECEIPTS WORKBENCH (/ar/receipts)
// ---------------------------------------------------------------------------
export function O2CARReceiptsWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCust, setSelectedCust] = useState("CUST-101");
  const [amount, setAmount] = useState("737500.00");
  const [method, setMethod] = useState("RTGS");
  const [reference, setReference] = useState(`UTR-HDFC-${Math.floor(1000000 + Math.random() * 9000000)}`);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, custs] = await Promise.all([
        api.ar.receipts(),
        api.sales.customers(),
      ]);
      if (Array.isArray(recs)) setReceipts(recs);
      if (Array.isArray(custs)) setCustomers(custs);
    } catch (err: any) {
      console.warn("Failed to load AR receipts:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.ar.createReceipt({
        customerId: selectedCust,
        receiptAmount: Number(amount),
        receiptMethod: method,
        reference,
      });
      notify(res.message || "Customer payment receipt processed and applied");
      loadData();
    } catch (err: any) {
      notify(`Receipt processing failed: ${err.message}`);
    }
  };

  return (
    <div className="o2c-receipts-workbench">
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
        {/* Receipt Voucher Entry Card */}
        <section className="content-card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 14px 0" }}>Record Customer Payment Receipt</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <label>
                Customer Account *
                <select value={selectedCust} onChange={(e) => setSelectedCust(e.target.value)}>
                  {customers.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Receipt Amount (₹) *
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label>
                Payment Method *
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="RTGS">RTGS (Real-Time Gross Settlement)</option>
                  <option value="NEFT">NEFT (Electronic Funds Transfer)</option>
                  <option value="Cheque">Corporate Cheque</option>
                </select>
              </label>
              <label>
                Bank UTR / Transaction Reference *
                <input required value={reference} onChange={(e) => setReference(e.target.value)} />
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                <CreditCard size={15} /> Apply Receipt & Release Credit
              </button>
            </div>
          </form>
        </section>

        {/* Historical Receipts Table */}
        <section className="content-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Settled Customer Receipts Register</h2>
            <button className="btn" onClick={loadData}><RefreshCcw size={14} /> Refresh</button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Receipt Voucher</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Bank Reference</th>
                  <th className="right">Receipt Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.code}</strong></td>
                    <td>{r.customerName}</td>
                    <td className="tabular">{r.receiptDate}</td>
                    <td><span className="status neutral">{r.receiptMethod}</span></td>
                    <td className="tabular">{r.reference}</td>
                    <td className="right tabular">
                      <strong style={{ color: "var(--success)" }}>
                        ₹ {(r.receiptAmount || 0).toLocaleString("en-IN")}.00
                      </strong>
                    </td>
                    <td><StatusBadge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

