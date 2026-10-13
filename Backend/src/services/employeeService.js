import { db } from "../config/database.js";
import { generateCode, generateUUID } from "../utils/idGenerator.js";

export class EmployeeService {
  static async listEmployees({ department, status, search, managerId, page = 1, limit = 25 }) {
    const all = await db.collection("employees").find((emp) => {
      if (department && emp.department !== department && emp.departmentId !== department) return false;
      if (status && emp.status.toLowerCase() !== status.toLowerCase()) return false;
      if (managerId && emp.managerId !== managerId) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeNumber.toLowerCase().includes(q) ||
          emp.workEmail.toLowerCase().includes(q) ||
          emp.job.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const items = all.slice(startIndex, startIndex + limit);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getEmployeeById(id) {
    const employee = await db.collection("employees").findOne((e) => e.id === id || e.employeeNumber === id);
    if (!employee) {
      throw { statusCode: 404, code: "EMPLOYEE_NOT_FOUND", message: `Employee not found with id or number: ${id}` };
    }

    // Include employment history
    const history = await db.collection("employment_history").find((h) => h.employeeId === employee.id);
    // Include compensation overview
    const comp = await db.collection("compensation_records").findOne((c) => c.employeeId === employee.id && c.status === "Active");
    // Include direct reports
    const directReports = await db.collection("employees").find((e) => e.managerId === employee.id);
    // Include documents
    const documents = await db.collection("onboarding_tasks").find((d) => d.employeeId === employee.id);

    return {
      ...employee,
      history,
      compensation: comp || null,
      directReports: directReports.map((dr) => ({
        id: dr.id,
        employeeNumber: dr.employeeNumber,
        fullName: dr.fullName,
        job: dr.job,
        grade: dr.grade,
        department: dr.department,
        status: dr.status,
      })),
      documents,
    };
  }

  static async createEmployee(data) {
    // Generate EMP number if not provided
    const employeeNumber = data.employeeNumber || generateCode("EMP");

    // Check for duplicate employeeNumber or workEmail
    const existing = await db.collection("employees").findOne(
      (e) => e.employeeNumber === employeeNumber || (data.workEmail && e.workEmail.toLowerCase() === data.workEmail.toLowerCase())
    );
    if (existing) {
      throw { statusCode: 409, code: "DUPLICATE_EMPLOYEE", message: "An employee with this number or email already exists" };
    }

    const employeeRecord = {
      id: employeeNumber,
      employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      workEmail: data.workEmail || `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@sahyadriauto.in`,
      phone: data.phone || "",
      gender: data.gender || "Not specified",
      dob: data.dob || "1995-01-01",
      hireDate: data.hireDate || new Date().toISOString().split("T")[0],
      status: data.status || "Active",
      workerType: data.workerType || "Permanent",
      department: data.department || "Production",
      departmentId: data.departmentId || "dept-01",
      job: data.job || "Production Operator",
      grade: data.grade || "G2",
      managerId: data.managerId || "EMP-1004",
      managerName: data.managerName || "Anil Deshmukh",
      location: data.location || "Pune Manufacturing Plant",
      businessUnit: data.businessUnit || "Pune Manufacturing",
      legalEmployer: data.legalEmployer || "Sahyadri Auto Components Pvt Ltd",
      pan: data.pan || "",
      uan: data.uan || "",
      bankAccount: data.bankAccount || "",
      bankName: data.bankName || "HDFC Bank",
      bankIfsc: data.bankIfsc || "HDFC0000486",
      userId: data.userId || null,
    };

    const created = await db.collection("employees").insert(employeeRecord);

    // Record initial hire event in employment history
    await db.collection("employment_history").insert({
      id: generateUUID(),
      employeeId: created.id,
      effectiveDate: created.hireDate,
      event: "Hire",
      action: `Hired as ${created.job}, Grade ${created.grade}`,
      grade: created.grade,
      department: created.department,
    });

    // Create default leave balances for the new employee
    const leaveTypes = await db.collection("leave_types").find();
    for (const lt of leaveTypes) {
      await db.collection("leave_balances").insert({
        id: `lb-${created.id}-${lt.code.toLowerCase()}`,
        employeeId: created.id,
        leaveTypeCode: lt.code,
        allocated: lt.annualQuota,
        used: 0,
        pending: 0,
        balance: lt.annualQuota,
      });
    }

    return created;
  }

  static async updateEmployee(id, updates) {
    const employee = await db.collection("employees").findOne((e) => e.id === id || e.employeeNumber === id);
    if (!employee) {
      throw { statusCode: 404, code: "EMPLOYEE_NOT_FOUND", message: `Employee not found: ${id}` };
    }

    // Disallow altering immutable keys directly
    delete updates.id;
    delete updates.employeeNumber;

    if (updates.firstName || updates.lastName) {
      const fn = updates.firstName || employee.firstName;
      const ln = updates.lastName || employee.lastName;
      updates.fullName = `${fn} ${ln}`;
    }

    const updated = await db.collection("employees").updateById(employee.id, updates);
    return updated;
  }

  static async performEmploymentAction(id, { action, effectiveDate, reason, proposedGrade, proposedManager, proposedDepartment, comments }) {
    const employee = await db.collection("employees").findOne((e) => e.id === id || e.employeeNumber === id);
    if (!employee) {
      throw { statusCode: 404, code: "EMPLOYEE_NOT_FOUND", message: `Employee not found: ${id}` };
    }

    const eventRecord = {
      id: generateUUID(),
      employeeId: employee.id,
      effectiveDate: effectiveDate || new Date().toISOString().split("T")[0],
      event: action,
      reason: reason || "Administrative update",
      comments: comments || "",
    };

    const updates = {};

    switch (action.toUpperCase()) {
      case "PROMOTE":
        eventRecord.action = `Promoted from ${employee.grade} to ${proposedGrade}`;
        eventRecord.previousGrade = employee.grade;
        eventRecord.grade = proposedGrade;
        updates.grade = proposedGrade;
        break;

      case "TRANSFER":
        eventRecord.action = `Transferred to ${proposedDepartment || employee.department}`;
        eventRecord.department = proposedDepartment;
        if (proposedDepartment) updates.department = proposedDepartment;
        break;

      case "CHANGE_MANAGER":
        eventRecord.action = `Manager reassigned from ${employee.managerName} to ${proposedManager}`;
        updates.managerName = proposedManager;
        break;

      case "TERMINATE":
      case "SEPARATION":
        eventRecord.action = `Employment terminated (${reason})`;
        updates.status = "Terminated";
        break;

      case "SUSPEND":
        eventRecord.action = `Employee suspended (${reason})`;
        updates.status = "Suspended";
        break;

      case "REHIRE":
        eventRecord.action = "Employee reinstated/rehired";
        updates.status = "Active";
        break;

      default:
        eventRecord.action = `Action: ${action}`;
    }

    await db.collection("employment_history").insert(eventRecord);
    if (Object.keys(updates).length > 0) {
      await db.collection("employees").updateById(employee.id, updates);
    }

    return {
      message: `Employment action '${action}' recorded successfully`,
      action: eventRecord,
      updatedEmployee: await db.collection("employees").findById(employee.id),
    };
  }

  static async getOrgChart() {
    const allEmployees = await db.collection("employees").find((e) => e.status === "Active");
    const roots = allEmployees.filter((e) => !e.managerId || e.managerId === "None" || e.managerName === "None");

    const buildTree = (manager) => {
      const reports = allEmployees.filter((e) => e.managerId === manager.id || e.managerName === manager.fullName);
      return {
        id: manager.id,
        name: manager.fullName,
        role: manager.job,
        grade: manager.grade,
        department: manager.department,
        initials: manager.firstName[0] + manager.lastName[0],
        children: reports.map(buildTree),
      };
    };

    return roots.map(buildTree);
  }
}

