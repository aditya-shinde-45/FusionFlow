import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { DecimalSafe } from "../utils/currency.js";

export class CompensationService {
  static async getEmployeeCompensation(employeeId) {
    const records = await db.collection("compensation_records").find((c) => c.employeeId === employeeId);
    records.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
    return records;
  }

  static async submitSalaryRevision({ employeeId, effectiveDate, proposedBasic, proposedHra, proposedSpecial, reason }) {
    const employee = await db.collection("employees").findById(employeeId);
    if (!employee) {
      throw { statusCode: 404, code: "EMPLOYEE_NOT_FOUND", message: "Employee not found" };
    }

    const currentRecord = await db.collection("compensation_records").findOne((c) => c.employeeId === employeeId && c.status === "Active");

    const grossSalary = DecimalSafe.add(proposedBasic, proposedHra, proposedSpecial);
    const revision = {
      id: generateUUID(),
      employeeId,
      effectiveDate,
      basicSalary: proposedBasic,
      hra: proposedHra,
      specialAllowance: proposedSpecial,
      grossSalary,
      pfEligible: true,
      esiEligible: grossSalary <= 21000,
      status: "Pending approval",
      previousGross: currentRecord ? currentRecord.grossSalary : 0,
      reason: reason || "Annual compensation appraisal",
      createdAt: new Date().toISOString(),
    };

    const created = await db.collection("compensation_records").insert(revision);

    // Create workflow approval request
    await db.collection("approval_requests").insert({
      id: created.id,
      code: `SAL-REV-${Date.now().toString().slice(-4)}`,
      entityType: "SALARY_REVISION",
      title: `Salary Revision for ${employee.fullName}: ₹ ${grossSalary.toLocaleString("en-IN")}.00`,
      amountFormatted: `₹ ${grossSalary.toLocaleString("en-IN")}.00 Gross`,
      amount: grossSalary,
      requesterName: "HR Manager",
      requesterId: "EMP-1002",
      department: employee.department,
      stage: "Level 1 of 1",
      assignedToRole: "plant.head",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      history: [],
    });

    return created;
  }
}

