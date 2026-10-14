import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { ApiError } from "../utils/response.js";

export class SupplierService {
  static async list({ search = "", category = "", status = "" } = {}) {
    const suppliers = await db.collection("suppliers").find((s) => {
      if (category && category !== "All" && s.category !== category) return false;
      if (status && status !== "All" && s.status.toLowerCase() !== status.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.taxId && s.taxId.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return suppliers;
  }

  static async getById(id) {
    const supplier = await db.collection("suppliers").findById(id);
    if (!supplier) {
      throw new ApiError(`Supplier ${id} not found`, 404);
    }
    return supplier;
  }

  static async create(data, currentUser = null) {
    const existing = await db.collection("suppliers").findOne(
      (s) => s.taxId && s.taxId.toUpperCase() === data.taxId.toUpperCase()
    );
    if (existing) {
      throw new ApiError(`Supplier with Tax ID / GSTIN "${data.taxId}" already exists (${existing.name})`, 409);
    }

    const count = await db.collection("suppliers").count();
    const code = `SUP-${100 + count + 1}`;

    const newSupplier = {
      id: code,
      code,
      name: data.name,
      taxId: data.taxId.toUpperCase(),
      category: data.category || "Direct Materials",
      status: "Pending approval",
      paymentTerms: data.paymentTerms || "Net 30",
      primaryContact: data.primaryContact || "Contact Person",
      email: data.email || null,
      phone: data.phone || null,
      pan: data.taxId.length >= 12 ? data.taxId.slice(2, 12) : null,
      currency: "INR",
      sites: [
        {
          siteCode: data.primarySite || "PUNE-01",
          purpose: "Purchasing and payment",
          address: data.address || "Pune Industrial MIDC",
          city: data.city || "Pune",
          status: "Active",
        },
      ],
      bankAccounts: data.bankAccount
        ? [
            {
              bankName: data.bankName || "HDFC Bank",
              accountNumber: data.bankAccount,
              ifscCode: data.bankIfsc || "HDFC0000486",
              branch: "Pune Main",
              status: "Pending approval",
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    };

    const saved = await db.collection("suppliers").insert(newSupplier);

    // Auto-create approval item for Plant Head
    await db.collection("approvals").insert({
      id: `SUP-${1000 + count + 1}`,
      code: `SUP-${1000 + count + 1}`,
      entityType: "SUPPLIER_REGISTRATION",
      title: `Supplier Registration ${data.name}`,
      amountFormatted: data.name,
      amount: 0,
      requesterName: currentUser?.name || "Vikram Jadhav",
      requesterId: currentUser?.id || "EMP-1009",
      department: "Stores and Purchase",
      stage: "Level 1 of 1",
      assignedToRole: "plant.head",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      details: { supplierId: saved.id, supplierName: saved.name },
      history: [
        { level: 1, approver: "Suresh Rane", role: "plant.head", action: "Pending", timestamp: null, comment: null },
      ],
    });

    return saved;
  }

  static async update(id, updates) {
    const existing = await db.collection("suppliers").findById(id);
    if (!existing) {
      throw new ApiError(`Supplier ${id} not found`, 404);
    }
    const updated = await db.collection("suppliers").updateById(id, updates);
    return updated;
  }
}

