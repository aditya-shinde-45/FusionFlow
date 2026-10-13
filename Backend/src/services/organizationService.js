import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";

export class OrganizationService {
  // Departments
  static async listDepartments() {
    const departments = await db.collection("departments").find();
    const employees = await db.collection("employees").find((e) => e.status === "Active");

    return departments.map((d) => {
      const headcount = employees.filter((e) => e.department === d.name || e.departmentId === d.id).length;
      return { ...d, headcount };
    });
  }

  static async getDepartmentById(id) {
    const dept = await db.collection("departments").findOne((d) => d.id === id || d.code === id);
    if (!dept) {
      throw { statusCode: 404, code: "DEPARTMENT_NOT_FOUND", message: `Department not found: ${id}` };
    }
    const employees = await db.collection("employees").find((e) => e.department === dept.name || e.departmentId === dept.id);
    return { ...dept, headcount: employees.length, employees };
  }

  static async createDepartment(data) {
    const existing = await db.collection("departments").findOne((d) => d.code === data.code);
    if (existing) {
      throw { statusCode: 409, code: "DUPLICATE_DEPARTMENT", message: `Department with code ${data.code} already exists` };
    }
    return db.collection("departments").insert({
      id: generateUUID(),
      code: data.code,
      name: data.name,
      headId: data.headId || null,
      headName: data.headName || "Unassigned",
      businessUnit: data.businessUnit || "Pune Manufacturing",
      active: true,
    });
  }

  // Jobs & Grades
  static async listJobs() {
    return db.collection("jobs").find();
  }

  static async createJob(data) {
    return db.collection("jobs").insert({
      id: generateUUID(),
      code: data.code,
      title: data.title,
      grade: data.grade,
      departmentId: data.departmentId || null,
    });
  }

  // Positions
  static async listPositions() {
    return db.collection("positions").find();
  }

  static async createPosition(data) {
    return db.collection("positions").insert({
      id: generateUUID(),
      code: data.code,
      title: data.title,
      jobId: data.jobId,
      departmentId: data.departmentId,
      headcount: data.headcount || 1,
      currentEmployeeId: null,
      status: "Open",
    });
  }

  // Locations
  static async listLocations() {
    return db.collection("locations").find();
  }
}

