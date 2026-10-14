import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import {
  Boxes,
  Factory,
  RefreshCcw,
  Search,
  Plus,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  SlidersHorizontal,
  ArrowRightLeft,
  PackageCheck,
  Check,
  X,
  Layers,
  Wrench,
  Percent,
  Play,
  ClipboardCheck,
  BarChart3,
  TrendingDown,
  Info,
} from "lucide-react";

// Reusable Status Badge
export function StatusBadge({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const kind =
    /completed|active|released|passed|firmed|fully issued/i.test(v)
      ? "success"
      : /in progress|partially issued|recommended|urgent|warning|hold/i.test(v)
      ? "warning"
      : /closed|scrapped|rejected|failed|danger/i.test(v)
      ? "danger"
      : "neutral";
  return <span className={`status ${kind}`}>{value}</span>;
}

// ---------------------------------------------------------------------------
// 1. ITEM MASTER CATALOG (/items)
// ---------------------------------------------------------------------------
export function MfgItemMaster({ notify }: { notify: (msg: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [makeBuyFilter, setMakeBuyFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New item form state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Raw Material");
  const [newMakeBuy, setNewMakeBuy] = useState("Buy");
  const [newUom, setNewUom] = useState("EA");
  const [newCost, setNewCost] = useState("150");
  const [newPrice, setNewPrice] = useState("0");
  const [newLeadTime, setNewLeadTime] = useState("4");
  const [newSafetyStock, setNewSafetyStock] = useState("200");

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.items.list();
      if (Array.isArray(res)) {
        setItems(res);
      }
    } catch (err: any) {
      console.warn("Failed to load items:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const viewDetail = async (code: string) => {
    try {
      const res = await api.items.getById(code);
      setSelectedItem(res);
    } catch (err: any) {
      notify(`Failed to fetch item details: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.items.create({
        code: newCode,
        name: newName,
        category: newCategory,
        makeOrBuy: newMakeBuy,
        uom: newUom,
        standardCost: Number(newCost),
        listPrice: Number(newPrice),
        leadTimeDays: Number(newLeadTime),
        safetyStock: Number(newSafetyStock),
      });
      notify(`Item ${newCode} added to Item Master`);
      setShowCreateModal(false);
      loadItems();
    } catch (err: any) {
      notify(`Create error: ${err.message}`);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (makeBuyFilter !== "All" && item.makeOrBuy !== makeBuyFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, categoryFilter, makeBuyFilter, search]);

  return (
    <div className="mfg-items-workbench">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Search Items
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <label>
          Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Finished Goods">Finished Goods</option>
            <option value="Subassembly">Subassemblies</option>
            <option value="Raw Material">Raw Materials</option>
            <option value="Packaging">Packaging</option>
          </select>
        </label>
        <label>
          Make / Buy
          <select value={makeBuyFilter} onChange={(e) => setMakeBuyFilter(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Make">Make (In-House)</option>
            <option value="Buy">Buy (Procured)</option>
          </select>
        </label>
        <div className="filter-actions" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button className="btn" onClick={loadItems}>
            <RefreshCcw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create Item
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>
            {loading ? "Loading..." : `${filtered.length} Items in Item Master`}
          </strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>UoM</th>
                <th className="right">Standard Cost</th>
                <th className="right">List Price</th>
                <th className="right">Lead Time</th>
                <th className="right">Safety Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => viewDetail(item.code)}
                    >
                      {item.code}
                    </button>
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description && (
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.description}</div>
                    )}
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`status ${item.makeOrBuy === "Make" ? "info" : "neutral"}`}>
                      {item.makeOrBuy}
                    </span>
                  </td>
                  <td>{item.uom}</td>
                  <td className="right tabular">₹ {(item.standardCost || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">
                    {item.listPrice ? `₹ ${item.listPrice.toLocaleString("en-IN")}.00` : "—"}
                  </td>
                  <td className="right tabular">{item.leadTimeDays} days</td>
                  <td className="right tabular">{(item.safetyStock || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <StatusBadge value={item.status} />
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                    No items matching filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{selectedItem.code} · {selectedItem.name}</h2>
                <p>{selectedItem.category} · {selectedItem.makeOrBuy === "Make" ? "Manufactured In-House" : "Purchased from Supplier"}</p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <div className="summary-strip" style={{ marginBottom: 16 }}>
                <div>
                  <small>Standard Cost</small>
                  <strong>₹ {selectedItem.standardCost?.toLocaleString("en-IN")}.00</strong>
                </div>
                <div>
                  <small>Total On-Hand</small>
                  <strong>{selectedItem.totalOnhand?.toLocaleString("en-IN")} {selectedItem.uom}</strong>
                </div>
                <div>
                  <small>Available Stock</small>
                  <strong style={{ color: "var(--success)" }}>{selectedItem.totalAvailable?.toLocaleString("en-IN")} {selectedItem.uom}</strong>
                </div>
                <div>
                  <small>Safety Stock</small>
                  <strong>{selectedItem.safetyStock} {selectedItem.uom}</strong>
                </div>
              </div>

              <h3>Subinventory On-Hand Distribution</h3>
              <div className="table-scroll" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Subinventory</th>
                      <th>Locator</th>
                      <th className="right">On-Hand</th>
                      <th className="right">Reserved</th>
                      <th className="right">Available</th>
                      <th className="right">Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.onhandBreakdown?.map((oh: any) => (
                      <tr key={oh.id}>
                        <td><strong>{oh.subinventory}</strong></td>
                        <td>{oh.locator || "—"}</td>
                        <td className="right tabular">{oh.onhandQty}</td>
                        <td className="right tabular">{oh.reservedQty}</td>
                        <td className="right tabular"><strong>{oh.availableQty}</strong></td>
                        <td className="right tabular">₹ {(oh.totalValue || 0).toLocaleString("en-IN")}.00</td>
                      </tr>
                    ))}
                    {(!selectedItem.onhandBreakdown || selectedItem.onhandBreakdown.length === 0) && (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>No stock currently on hand</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedItem.bom && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--surface-subtle)", borderRadius: 6 }}>
                  <strong>Linked BOM Structure:</strong> {selectedItem.bom.code} (Rev {selectedItem.bom.revision}, Yield {selectedItem.bom.yieldPercent}%)
                </div>
              )}
              {selectedItem.routing && (
                <div style={{ marginTop: 8, padding: 12, background: "var(--surface-subtle)", borderRadius: 6 }}>
                  <strong>Linked Manufacturing Routing:</strong> {selectedItem.routing.code} ({selectedItem.routing.operations?.length} standard operations)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreate}>
              <div className="modal-head">
                <div>
                  <h2>Create Item Master Record</h2>
                  <p>Register new engineering part or procurement item</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label>Item Code *<input required placeholder="e.g. RM-208" value={newCode} onChange={(e) => setNewCode(e.target.value)} /></label>
                  <label>UoM *<select value={newUom} onChange={(e) => setNewUom(e.target.value)}><option value="EA">EA</option><option value="KG">KG</option><option value="SET">SET</option><option value="PKT">PKT</option><option value="BOX">BOX</option></select></label>
                  <label className="wide">Item Description *<input required placeholder="e.g. Copper Rivet Set" value={newName} onChange={(e) => setNewName(e.target.value)} /></label>
                  <label>Category *<select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}><option value="Finished Goods">Finished Goods</option><option value="Subassembly">Subassembly</option><option value="Raw Material">Raw Material</option><option value="Packaging">Packaging</option></select></label>
                  <label>Make or Buy *<select value={newMakeBuy} onChange={(e) => setNewMakeBuy(e.target.value)}><option value="Buy">Buy (Procured)</option><option value="Make">Make (Manufactured)</option></select></label>
                  <label>Standard Cost (₹) *<input type="number" required value={newCost} onChange={(e) => setNewCost(e.target.value)} /></label>
                  <label>List Price (₹)<input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} /></label>
                  <label>Lead Time (Days)<input type="number" value={newLeadTime} onChange={(e) => setNewLeadTime(e.target.value)} /></label>
                  <label>Safety Stock<input type="number" value={newSafetyStock} onChange={(e) => setNewSafetyStock(e.target.value)} /></label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. ON-HAND INVENTORY & TRANSFERS WORKBENCH (/inventory/onhand)
// ---------------------------------------------------------------------------
export function MfgOnhandWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [data, setData] = useState<{ records: any[]; summary: any }>({ records: [], summary: {} });
  const [subinventories, setSubinventories] = useState<any[]>([]);
  const [subFilter, setSubFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Transfer form
  const [xferItem, setXferItem] = useState("RM-204");
  const [xferFrom, setXferFrom] = useState("RM-STORES");
  const [xferTo, setXferTo] = useState("WIP-STAGING");
  const [xferQty, setXferQty] = useState("100");
  const [xferRef, setXferRef] = useState("Assembly line replenishment");

  const loadData = async () => {
    try {
      setLoading(true);
      const [onh, subs] = await Promise.all([
        api.inventory.onhand({ subinventory: subFilter }),
        api.inventory.subinventories(),
      ]);
      if (onh?.records) setData(onh);
      if (subs) setSubinventories(subs);
    } catch (err: any) {
      console.warn("Failed to load onhand:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subFilter]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.inventory.transfer({
        itemCode: xferItem,
        fromSubinventory: xferFrom,
        toSubinventory: xferTo,
        quantity: Number(xferQty),
        reference: xferRef,
      });
      notify(`Transfer successful: ${xferQty} ${xferItem} moved to ${xferTo} (Txn: ${res.txnNumber || "Recorded"})`);
      setShowTransferModal(false);
      loadData();
    } catch (err: any) {
      notify(`Transfer failed: ${err.message}`);
    }
  };

  return (
    <div className="mfg-onhand-workbench">
      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Total Valuation</small>
          <strong style={{ color: "var(--brand)" }}>
            ₹ {(data.summary?.totalValuation || 0).toLocaleString("en-IN")}.00
          </strong>
        </div>
        <div>
          <small>Total Physical Units</small>
          <strong>{(data.summary?.totalQuantity || 0).toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <small>Committed / Reserved</small>
          <strong>{(data.summary?.totalReserved || 0).toLocaleString("en-IN")}</strong>
        </div>
        <div>
          <small>Net Available</small>
          <strong style={{ color: "var(--success)" }}>
            {(data.summary?.totalAvailable || 0).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Subinventory Location
          <select value={subFilter} onChange={(e) => setSubFilter(e.target.value)}>
            <option value="All">All Subinventories</option>
            <option value="RM-STORES">RM-STORES · Raw Material Central Stores</option>
            <option value="WIP-STAGING">WIP-STAGING · Shop Floor Staging Buffer</option>
            <option value="FG-WAREHOUSE">FG-WAREHOUSE · Finished Goods Hub</option>
            <option value="QUALITY-HOLD">QUALITY-HOLD · Quarantine & Hold</option>
          </select>
        </label>
        <div className="filter-actions" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button className="btn" onClick={loadData}>
            <RefreshCcw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft size={14} /> Subinventory Transfer
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>
            {loading ? "Loading..." : `${data.records?.length || 0} Stock Allocations`}
          </strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Description</th>
                <th>Subinventory</th>
                <th>Locator</th>
                <th className="right">On-Hand</th>
                <th className="right">Reserved</th>
                <th className="right">Available</th>
                <th>UoM</th>
                <th className="right">Unit Cost</th>
                <th className="right">Valuation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.records?.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.itemCode}</strong></td>
                  <td>{r.itemName}</td>
                  <td>
                    <span className="status neutral">{r.subinventory}</span>
                  </td>
                  <td>{r.locator || "—"}</td>
                  <td className="right tabular">{r.onhandQty.toLocaleString("en-IN")}</td>
                  <td className="right tabular">{r.reservedQty.toLocaleString("en-IN")}</td>
                  <td className="right tabular">
                    <strong style={{ color: r.availableQty < 100 ? "var(--warning)" : "inherit" }}>
                      {r.availableQty.toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td>{r.uom}</td>
                  <td className="right tabular">₹ {(r.unitCost || 0).toLocaleString("en-IN")}.00</td>
                  <td className="right tabular">₹ {(r.totalValue || 0).toLocaleString("en-IN")}.00</td>
                  <td>
                    {r.availableQty === 0 ? (
                      <span className="status danger">Out of Stock</span>
                    ) : r.availableQty < 100 ? (
                      <span className="status warning">Low Buffer</span>
                    ) : (
                      <span className="status success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-backdrop" onClick={() => setShowTransferModal(false)}>
          <div className="modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleTransfer}>
              <div className="modal-head">
                <div>
                  <h2>Subinventory Transfer</h2>
                  <p>Move components between stores, shop floor WIP, and dispatch</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowTransferModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label className="wide">
                    Item *
                    <select value={xferItem} onChange={(e) => setXferItem(e.target.value)}>
                      <option value="RM-204">RM-204 · High-Tensile Steel Back Plate</option>
                      <option value="RM-205">RM-205 · Ceramic Friction Lining Compound</option>
                      <option value="RM-206">RM-206 · Hardened Rivets & Clips</option>
                      <option value="RM-207">RM-207 · Cushion Spring Steel Strip</option>
                      <option value="SA-301">SA-301 · Friction Disc Subassembly</option>
                      <option value="SA-302">SA-302 · Clutch Cover Subassembly</option>
                      <option value="FG-1001">FG-1001 · Ceramic Disc Brake Pads</option>
                      <option value="FG-1002">FG-1002 · Heavy Duty Clutch Plate</option>
                    </select>
                  </label>
                  <label>
                    From Subinventory *
                    <select value={xferFrom} onChange={(e) => setXferFrom(e.target.value)}>
                      <option value="RM-STORES">RM-STORES</option>
                      <option value="WIP-STAGING">WIP-STAGING</option>
                      <option value="FG-WAREHOUSE">FG-WAREHOUSE</option>
                      <option value="QUALITY-HOLD">QUALITY-HOLD</option>
                    </select>
                  </label>
                  <label>
                    To Subinventory *
                    <select value={xferTo} onChange={(e) => setXferTo(e.target.value)}>
                      <option value="WIP-STAGING">WIP-STAGING</option>
                      <option value="RM-STORES">RM-STORES</option>
                      <option value="FG-WAREHOUSE">FG-WAREHOUSE</option>
                      <option value="QUALITY-HOLD">QUALITY-HOLD</option>
                    </select>
                  </label>
                  <label>
                    Transfer Quantity *
                    <input
                      type="number"
                      required
                      min="1"
                      value={xferQty}
                      onChange={(e) => setXferQty(e.target.value)}
                    />
                  </label>
                  <label>
                    Reference / Reason
                    <input value={xferRef} onChange={(e) => setXferRef(e.target.value)} />
                  </label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. BILLS OF MATERIALS (BOM) WORKBENCH (/mfg/bom)
// ---------------------------------------------------------------------------
export function MfgBomWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [boms, setBoms] = useState<any[]>([]);
  const [selectedBom, setSelectedBom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBoms = async () => {
    try {
      setLoading(true);
      const res = await api.mfg.boms();
      if (Array.isArray(res)) {
        setBoms(res);
        if (res.length > 0) {
          const detail = await api.mfg.bomDetail(res[0].code);
          setSelectedBom(detail);
        }
      }
    } catch (err: any) {
      console.warn("Failed to load BOMs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoms();
  }, []);

  const selectBom = async (code: string) => {
    try {
      const detail = await api.mfg.bomDetail(code);
      setSelectedBom(detail);
    } catch (err: any) {
      notify(`Failed to load BOM: ${err.message}`);
    }
  };

  return (
    <div className="mfg-bom-workbench">
      <div className="dashboard-columns" style={{ gridTemplateColumns: "320px 1fr", gap: 16 }}>
        {/* Left Side: BOM List */}
        <aside className="content-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Bills of Materials</h2>
            <button className="icon-btn" onClick={loadBoms} title="Refresh">
              <RefreshCcw size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {boms.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBom(b.code)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: selectedBom?.code === b.code ? "var(--brand)" : "var(--border)",
                  background: selectedBom?.code === b.code ? "var(--surface-active)" : "var(--surface)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{b.code}</strong>
                  <StatusBadge value={`Rev ${b.revision}`} />
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{b.itemName}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {b.componentsCount || b.components?.length || 0} Components · Yield {b.yieldPercent}%
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Side: Exploded BOM Tree Structure */}
        <section className="content-card" style={{ padding: 20 }}>
          {selectedBom ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h1 style={{ fontSize: 20, margin: "0 0 4px 0" }}>{selectedBom.itemName}</h1>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    BOM Code: <strong>{selectedBom.code}</strong> · Assembly Part: <strong>{selectedBom.itemCode}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <StatusBadge value={selectedBom.status} />
                  <span className="status info">Yield: {selectedBom.yieldPercent}%</span>
                </div>
              </div>

              <div className="summary-strip" style={{ marginBottom: 20 }}>
                <div>
                  <small>Engineering Revision</small>
                  <strong>Revision {selectedBom.revision}</strong>
                </div>
                <div>
                  <small>Effective Date</small>
                  <strong>{selectedBom.effectiveFrom}</strong>
                </div>
                <div>
                  <small>Component Lines</small>
                  <strong>{selectedBom.components?.length} Required</strong>
                </div>
                <div>
                  <small>Routing Link</small>
                  <strong>{selectedBom.routing?.code || "Standard Progressive"}</strong>
                </div>
              </div>

              <h2 style={{ fontSize: 16, marginBottom: 10 }}>Multi-Level Component Explosion</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Op Seq</th>
                      <th>Component Item</th>
                      <th>Description</th>
                      <th className="right">Qty Per Assembly</th>
                      <th>UoM</th>
                      <th className="right">Scrap Allowance</th>
                      <th>Criticality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBom.components?.map((c: any) => (
                      <tr key={c.id}>
                        <td>
                          <span className="status neutral">Op {c.operationSeq}</span>
                        </td>
                        <td><strong>{c.itemCode}</strong></td>
                        <td>{c.itemName}</td>
                        <td className="right tabular"><strong>{c.quantityPer}</strong></td>
                        <td>{c.uom}</td>
                        <td className="right tabular">{c.scrapPercent}%</td>
                        <td>
                          {c.isCritical ? (
                            <span className="status warning">Critical Component</span>
                          ) : (
                            <span className="status neutral">Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedBom.routing && (
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ fontSize: 16, marginBottom: 10 }}>Associated Manufacturing Sequence</h2>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Sequence</th>
                          <th>Operation Description</th>
                          <th>Work Center</th>
                          <th className="right">Setup Hours</th>
                          <th className="right">Run Hours / Unit</th>
                          <th>Backflush</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBom.routing.operations?.map((op: any) => (
                          <tr key={op.seq}>
                            <td><strong>Op {op.seq}</strong></td>
                            <td>{op.name}</td>
                            <td><span className="status neutral">{op.workCenter}</span></td>
                            <td className="right tabular">{op.setupHours} h</td>
                            <td className="right tabular">{op.runHoursPerUnit} h</td>
                            <td>{op.autoBackflush ? <Check size={15} style={{ color: "var(--success)" }} /> : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
              Select a Bill of Materials to inspect hierarchy
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. ROUTINGS & WORK CENTERS WORKBENCH (/mfg/routings)
// ---------------------------------------------------------------------------
export function MfgRoutingsWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [routings, setRoutings] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rts, wcs] = await Promise.all([
        api.mfg.routings(),
        api.mfg.workCenters(),
      ]);
      if (rts) setRoutings(rts);
      if (wcs) setWorkCenters(wcs);
    } catch (err: any) {
      console.warn("Failed to load routings:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="mfg-routings-workbench">
      <section className="content-card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Work Centers & Machine Cells</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>Capacity planning, hourly labor and machine cost rates</p>
          </div>
          <button className="btn" onClick={loadData}><RefreshCcw size={14} /> Refresh</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Work Center</th>
                <th>Name</th>
                <th>Department</th>
                <th className="right">Daily Capacity</th>
                <th className="right">Labor Rate</th>
                <th className="right">Machine Rate</th>
                <th className="right">Efficiency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workCenters.map((wc) => (
                <tr key={wc.code}>
                  <td><strong>{wc.code}</strong></td>
                  <td>{wc.name}</td>
                  <td>{wc.department}</td>
                  <td className="right tabular">{wc.capacityHoursPerDay} hrs/day</td>
                  <td className="right tabular">₹ {wc.laborHourlyRate}.00 / hr</td>
                  <td className="right tabular">₹ {wc.machineHourlyRate}.00 / hr</td>
                  <td className="right tabular">{wc.efficiency}%</td>
                  <td><span className="status success">Available</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card" style={{ padding: 18 }}>
        <h2 style={{ margin: "0 0 14px 0" }}>Standard Manufacturing Routings</h2>
        {routings.map((r) => (
          <div key={r.id} style={{ marginBottom: 24, border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: 16 }}>{r.code} · {r.name}</strong>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Part: {r.itemCode} · Status: Active</div>
              </div>
              <StatusBadge value={r.active ? "Active" : "Draft"} />
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Operation Description</th>
                    <th>Work Center</th>
                    <th className="right">Setup Hours</th>
                    <th className="right">Run Hours / Unit</th>
                    <th>Auto-Backflush</th>
                  </tr>
                </thead>
                <tbody>
                  {r.operations?.map((op: any) => (
                    <tr key={op.seq}>
                      <td><strong>Op {op.seq}</strong></td>
                      <td>{op.name}</td>
                      <td><span className="status neutral">{op.workCenter}</span></td>
                      <td className="right tabular">{op.setupHours} h</td>
                      <td className="right tabular">{op.runHoursPerUnit} h</td>
                      <td>{op.autoBackflush ? <Check size={16} style={{ color: "var(--success)" }} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. WORK ORDERS LIST & DISPATCH (/mfg/work-orders)
// ---------------------------------------------------------------------------
export function MfgWorkOrderList({
  onSelectWorkOrder,
  notify,
}: {
  onSelectWorkOrder: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New WO state
  const [woItem, setWoItem] = useState("FG-1001");
  const [woQty, setWoQty] = useState("500");
  const [woPriority, setWoPriority] = useState("Normal");
  const [woLine, setWoLine] = useState("Pune Brake Pad Line 1");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.mfg.workOrders({ status: statusFilter });
      if (Array.isArray(res)) setOrders(res);
    } catch (err: any) {
      console.warn("Failed to load work orders:", err.message);
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
      const res = await api.mfg.createWorkOrder({
        itemCode: woItem,
        plannedQty: Number(woQty),
        priority: woPriority,
        assignedLine: woLine,
      });
      notify(`Work Order ${res.code} created and released to shop floor`);
      setShowCreateModal(false);
      loadOrders();
    } catch (err: any) {
      notify(`Failed to create work order: ${err.message}`);
    }
  };

  return (
    <div className="mfg-workorders-list">
      <div className="filter-grid" style={{ marginBottom: 14 }}>
        <label>
          Order Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Released">Released</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <div className="filter-actions" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button className="btn" onClick={loadOrders}><RefreshCcw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create Work Order
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>
            {loading ? "Loading..." : `${orders.length} Work Orders on Floor`}
          </strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Item</th>
                <th className="right">Planned</th>
                <th className="right">Completed</th>
                <th className="right">Scrapped</th>
                <th>Current Operation</th>
                <th>Line / Work Center</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((wo) => (
                <tr key={wo.id}>
                  <td>
                    <button
                      className="table-link"
                      style={{ fontWeight: 600, background: "none", border: 0, cursor: "pointer" }}
                      onClick={() => onSelectWorkOrder(wo.code || wo.id)}
                    >
                      {wo.code}
                    </button>
                  </td>
                  <td>
                    <strong>{wo.itemCode}</strong>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{wo.itemName}</div>
                  </td>
                  <td className="right tabular">{wo.plannedQty} {wo.uom}</td>
                  <td className="right tabular"><strong>{wo.completedQty}</strong></td>
                  <td className="right tabular" style={{ color: wo.scrappedQty > 0 ? "var(--danger)" : "inherit" }}>
                    {wo.scrappedQty}
                  </td>
                  <td>
                    <span className="status neutral">Op {wo.currentOpSeq}</span> {wo.currentOpName}
                  </td>
                  <td>{wo.assignedLine}</td>
                  <td>
                    <span className={`status ${wo.priority === "Urgent" ? "warning" : "neutral"}`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td style={{ minWidth: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${wo.completionPercent || 0}%`, height: "100%", background: "var(--brand)" }} />
                      </div>
                      <small style={{ fontSize: 11 }}>{wo.completionPercent || 0}%</small>
                    </div>
                  </td>
                  <td>
                    <StatusBadge value={wo.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create WO Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreate}>
              <div className="modal-head">
                <div>
                  <h2>Create & Release Work Order</h2>
                  <p>Dispatch new assembly batch to production lines</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label className="wide">
                    Assembly Item *
                    <select value={woItem} onChange={(e) => setWoItem(e.target.value)}>
                      <option value="FG-1001">FG-1001 · Ceramic Disc Brake Pads (Front Axle Set)</option>
                      <option value="FG-1002">FG-1002 · Heavy Duty Clutch Plate Assembly (380mm)</option>
                    </select>
                  </label>
                  <label>
                    Planned Quantity *
                    <input type="number" required min="1" value={woQty} onChange={(e) => setWoQty(e.target.value)} />
                  </label>
                  <label>
                    Priority
                    <select value={woPriority} onChange={(e) => setWoPriority(e.target.value)}>
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </label>
                  <label className="wide">
                    Production Line
                    <select value={woLine} onChange={(e) => setWoLine(e.target.value)}>
                      <option value="Pune Brake Pad Line 1">Pune Brake Pad Line 1</option>
                      <option value="Clutch Plate Line 2">Clutch Plate Line 2</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create & Release</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. WORK ORDER DETAIL & SHOP FLOOR STEPPER (/mfg/work-orders/:id)
// ---------------------------------------------------------------------------
export function MfgWorkOrderDetail({
  id,
  onBack,
  notify,
}: {
  id: string;
  onBack: () => void;
  notify: (msg: string) => void;
}) {
  const [wo, setWo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState<any | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Operation progress reporting
  const [reportedComplete, setReportedComplete] = useState("50");
  const [reportedScrap, setReportedScrap] = useState("0");
  const [scrapReason, setScrapReason] = useState("Surface Porosity");

  // Material Issue form
  const [issueItem, setIssueItem] = useState("");
  const [issueQty, setIssueQty] = useState("100");

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await api.mfg.workOrderDetail(id);
      setWo(res);
    } catch (err: any) {
      console.warn("Failed to load work order:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const openReportModal = (op: any) => {
    setSelectedOp(op);
    setReportedComplete(String(Math.max(0, op.plannedQty - op.completedQty)));
    setReportedScrap("0");
    setShowProgressModal(true);
  };

  const handleReportProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOp) return;
    try {
      const res = await api.mfg.reportOperation(wo.code, selectedOp.seq, {
        completedQty: Number(reportedComplete),
        scrapQty: Number(reportedScrap),
        scrapReason: Number(reportedScrap) > 0 ? scrapReason : undefined,
      });
      notify(res.message || `Operation ${selectedOp.seq} progress updated`);
      setShowProgressModal(false);
      loadDetail();
    } catch (err: any) {
      notify(`Progress update failed: ${err.message}`);
    }
  };

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.inventory.issueMaterial({
        workOrderId: wo.code,
        itemCode: issueItem,
        quantity: Number(issueQty),
      });
      notify(res.message || "Material issued successfully");
      setShowIssueModal(false);
      loadDetail();
    } catch (err: any) {
      notify(`Material issue failed: ${err.message}`);
    }
  };

  if (loading || !wo) {
    return (
      <div className="content-card" style={{ padding: 40, textAlign: "center" }}>
        <RefreshCcw size={24} className="spin" />
        <p style={{ marginTop: 12 }}>Loading Work Order {id}...</p>
      </div>
    );
  }

  return (
    <div className="mfg-workorder-detail">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn" onClick={onBack}>
          ← Back to Work Orders
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={loadDetail}><RefreshCcw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowIssueModal(true)}>
            <PackageCheck size={14} /> Issue Material
          </button>
        </div>
      </div>

      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Order Number</small>
          <strong>{wo.code}</strong>
        </div>
        <div>
          <small>Item Assembly</small>
          <strong>{wo.itemCode}</strong>
        </div>
        <div>
          <small>Planned Quantity</small>
          <strong>{wo.plannedQty} {wo.uom}</strong>
        </div>
        <div>
          <small>Completed Units</small>
          <strong style={{ color: "var(--success)" }}>{wo.completedQty}</strong>
        </div>
        <div>
          <small>Scrap Rate</small>
          <strong style={{ color: wo.scrappedQty > 0 ? "var(--danger)" : "inherit" }}>
            {wo.scrappedQty} ({Math.round(((wo.scrappedQty || 0) / wo.plannedQty) * 100)}%)
          </strong>
        </div>
        <div>
          <small>Status</small>
          <StatusBadge value={wo.status} />
        </div>
      </div>

      {/* Operation Progress Stepper */}
      <section className="content-card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Shop Floor Routing & Operation Stepper</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {wo.operations?.map((op: any, index: number) => {
            const isDone = op.status === "Completed";
            const isCurrent = op.seq === wo.currentOpSeq;
            return (
              <div
                key={op.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: isCurrent ? "var(--brand)" : isDone ? "var(--success)" : "var(--border)",
                  background: isCurrent ? "var(--surface-active)" : isDone ? "var(--surface-subtle)" : "var(--surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      background: isDone ? "var(--success)" : isCurrent ? "var(--brand)" : "var(--border)",
                      color: isDone || isCurrent ? "#fff" : "var(--muted)",
                    }}
                  >
                    {isDone ? <Check size={18} /> : op.seq}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>Op {op.seq} · {op.name}</strong>
                      <StatusBadge value={op.status} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      Work Center: <strong>{op.workCenter}</strong> · Operator: {op.operator || "Unassigned"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ textAlign: "right", fontSize: 12 }}>
                    <div>Completed: <strong>{op.completedQty} / {op.plannedQty}</strong></div>
                    {op.scrappedQty > 0 && (
                      <div style={{ color: "var(--danger)" }}>Scrap: {op.scrappedQty} ({op.scrapReason || "Defect"})</div>
                    )}
                  </div>
                  <button
                    className="btn btn-sm"
                    disabled={isDone}
                    onClick={() => openReportModal(op)}
                  >
                    <Play size={13} /> Report Progress
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Material Pick List & Issue Status */}
      <section className="content-card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>BOM Component Allocation & Pick List</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Description</th>
                <th className="right">Required Qty</th>
                <th className="right">Issued Qty</th>
                <th className="right">Remaining</th>
                <th>UoM</th>
                <th>Subinventory</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {wo.materials?.map((m: any) => (
                <tr key={m.id}>
                  <td><strong>{m.itemCode}</strong></td>
                  <td>{m.itemName}</td>
                  <td className="right tabular">{m.requiredQty}</td>
                  <td className="right tabular"><strong>{m.issuedQty}</strong></td>
                  <td className="right tabular">{Math.max(0, m.requiredQty - m.issuedQty)}</td>
                  <td>{m.uom}</td>
                  <td><span className="status neutral">{m.subinventory}</span></td>
                  <td><StatusBadge value={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Progress Reporting Modal */}
      {showProgressModal && selectedOp && (
        <div className="modal-backdrop" onClick={() => setShowProgressModal(false)}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleReportProgress}>
              <div className="modal-head">
                <div>
                  <h2>Report Operation Completion</h2>
                  <p>Op {selectedOp.seq} · {selectedOp.name}</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowProgressModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label>
                    Completed Good Units *
                    <input
                      type="number"
                      required
                      min="0"
                      value={reportedComplete}
                      onChange={(e) => setReportedComplete(e.target.value)}
                    />
                  </label>
                  <label>
                    Scrapped Units
                    <input
                      type="number"
                      min="0"
                      value={reportedScrap}
                      onChange={(e) => setReportedScrap(e.target.value)}
                    />
                  </label>
                  {Number(reportedScrap) > 0 && (
                    <label className="wide">
                      Scrap Defect Reason *
                      <select value={scrapReason} onChange={(e) => setScrapReason(e.target.value)}>
                        <option value="Surface Porosity">Surface Porosity</option>
                        <option value="Fine-blanking burr defect">Fine-blanking burr defect</option>
                        <option value="Dimensional Tolerance Failure">Dimensional Tolerance Failure</option>
                        <option value="Thermal Bonding Blister">Thermal Bonding Blister</option>
                      </select>
                    </label>
                  )}
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowProgressModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Progress</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Material Modal */}
      {showIssueModal && (
        <div className="modal-backdrop" onClick={() => setShowIssueModal(false)}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleIssueMaterial}>
              <div className="modal-head">
                <div>
                  <h2>Issue Component to Work Order</h2>
                  <p>Work Order: {wo.code}</p>
                </div>
                <button type="button" className="icon-btn" onClick={() => setShowIssueModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 18 }}>
                <div className="form-grid">
                  <label className="wide">
                    Select Material *
                    <select
                      value={issueItem || (wo.materials?.[0]?.itemCode || "")}
                      onChange={(e) => setIssueItem(e.target.value)}
                    >
                      {wo.materials?.map((m: any) => (
                        <option key={m.id} value={m.itemCode}>
                          {m.itemCode} · {m.itemName} (Remaining: {m.requiredQty - m.issuedQty} {m.uom})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Issue Quantity *
                    <input
                      type="number"
                      required
                      min="1"
                      value={issueQty}
                      onChange={(e) => setIssueQty(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-foot" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16 }}>
                <button type="button" className="btn" onClick={() => setShowIssueModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. PLANNER WORKBENCH (MRP) (/mfg/planner)
// ---------------------------------------------------------------------------
export function MfgPlannerWorkbench({ notify }: { notify: (msg: string) => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.mfg.getPlans();
      if (Array.isArray(res)) setPlans(res);
    } catch (err: any) {
      console.warn("Failed to load plans:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const runMrpEngine = async () => {
    try {
      setRunning(true);
      const res = await api.mfg.plannerRun();
      if (Array.isArray(res)) setPlans(res);
      notify("MRP Planning calculation completed: Recommended planned orders generated");
    } catch (err: any) {
      notify(`MRP Run error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const firmOrder = async (planId: string) => {
    try {
      const res = await api.mfg.firmPlan(planId);
      notify(res.message || "Planned order successfully firmed");
      loadPlans();
    } catch (err: any) {
      notify(`Failed to firm order: ${err.message}`);
    }
  };

  return (
    <div className="mfg-planner-workbench">
      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <div>
          <small>Planning Horizon</small>
          <strong>30 Days Rolling</strong>
        </div>
        <div>
          <small>Total Recommendations</small>
          <strong>{plans.length} Orders</strong>
        </div>
        <div>
          <small>Recommended PRs</small>
          <strong>
            {plans.filter((p) => p.suggestedAction === "CREATE_PURCHASE_REQUISITION").length} Sourcing
          </strong>
        </div>
        <div>
          <small>Recommended Work Orders</small>
          <strong style={{ color: "var(--brand)" }}>
            {plans.filter((p) => p.suggestedAction === "CREATE_WORK_ORDER").length} Assembly
          </strong>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Material Requirements Planning (MRP)</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>Gross-to-net demand matching and planned replenishment order suggestions</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={loadPlans}><RefreshCcw size={14} /> Refresh</button>
          <button className="btn btn-primary" disabled={running} onClick={runMrpEngine}>
            <BarChart3 size={14} className={running ? "spin" : ""} />
            {running ? "Calculating MRP..." : "Run Planning Engine"}
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>
            {loading ? "Loading..." : `${plans.length} Replenishment Recommendations Generated`}
          </strong>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th className="right">Gross Demand</th>
                <th className="right">Projected Stock</th>
                <th className="right">Safety Stock</th>
                <th className="right">Net Shortage</th>
                <th>Suggested Action</th>
                <th className="right">Suggested Qty</th>
                <th>Suggested Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const isFirmed = p.status === "Firmed";
                return (
                  <tr key={p.id}>
                    <td><strong>{p.itemCode}</strong></td>
                    <td>{p.itemName}</td>
                    <td>{p.category}</td>
                    <td className="right tabular">{p.grossDemand}</td>
                    <td className="right tabular">{p.projectedOnhand}</td>
                    <td className="right tabular">{p.safetyStock}</td>
                    <td className="right tabular" style={{ color: "var(--danger)", fontWeight: 600 }}>
                      {p.netShortage}
                    </td>
                    <td>
                      <span className={`status ${p.suggestedAction === "CREATE_WORK_ORDER" ? "info" : "warning"}`}>
                        {p.suggestedAction === "CREATE_WORK_ORDER" ? "Work Order" : "Requisition"}
                      </span>
                    </td>
                    <td className="right tabular"><strong>{p.suggestedQty} {p.uom}</strong></td>
                    <td>{p.suggestedDate}</td>
                    <td>
                      <StatusBadge value={p.status} />
                    </td>
                    <td>
                      {isFirmed ? (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          Firmed: <strong>{p.firmedRef}</strong>
                        </span>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => firmOrder(p.id)}>
                          <CheckCircle2 size={13} /> Firm Order
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

