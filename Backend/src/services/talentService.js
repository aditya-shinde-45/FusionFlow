import { db } from "../config/database.js";
import { generateCode, generateUUID } from "../utils/idGenerator.js";

export class TalentService {
  // Performance Review Cycles
  static async listCycles() {
    return db.collection("performance_cycles").find();
  }

  static async createCycle(data) {
    return db.collection("performance_cycles").insert({
      id: generateUUID(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: "Active",
    });
  }

  // Goals & OKRs
  static async listGoals({ employeeId, cycleId }) {
    return db.collection("performance_goals").find((g) => {
      if (employeeId && g.employeeId !== employeeId) return false;
      if (cycleId && g.cycleId !== cycleId) return false;
      return true;
    });
  }

  static async createGoal(data) {
    return db.collection("performance_goals").insert({
      id: generateCode("GOAL"),
      cycleId: data.cycleId || "pc-2026",
      employeeId: data.employeeId,
      title: data.title,
      category: data.category || "General",
      weight: data.weight || 20,
      progress: data.progress || 0,
      status: "In progress",
      targetDate: data.targetDate,
    });
  }

  static async updateGoalProgress(goalId, { progress, status }) {
    const goal = await db.collection("performance_goals").findById(goalId);
    if (!goal) {
      throw { statusCode: 404, code: "GOAL_NOT_FOUND", message: "Goal not found" };
    }

    const newStatus = status || (progress >= 100 ? "Completed" : "In progress");
    return db.collection("performance_goals").updateById(goalId, {
      progress,
      status: newStatus,
    });
  }

  // Performance Reviews
  static async listReviews({ employeeId, cycleId, status }) {
    return db.collection("performance_reviews").find((r) => {
      if (employeeId && r.employeeId !== employeeId) return false;
      if (cycleId && r.cycleId !== cycleId) return false;
      if (status && r.status.toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });
  }

  static async initiateReview({ employeeId, cycleId, managerId }) {
    const code = generateCode("REV");
    return db.collection("performance_reviews").insert({
      id: code,
      cycleId: cycleId || "pc-2026",
      employeeId,
      managerId: managerId || "EMP-1004",
      selfRating: null,
      selfComments: null,
      managerRating: null,
      managerComments: null,
      status: "Draft",
    });
  }

  static async submitSelfAssessment(reviewId, { selfRating, selfComments }) {
    const review = await db.collection("performance_reviews").findById(reviewId);
    if (!review) {
      throw { statusCode: 404, code: "REVIEW_NOT_FOUND", message: "Performance review not found" };
    }

    return db.collection("performance_reviews").updateById(reviewId, {
      selfRating,
      selfComments,
      status: "Submitted by Employee",
    });
  }

  static async submitManagerAssessment(reviewId, { managerRating, managerComments, recommendation }) {
    const review = await db.collection("performance_reviews").findById(reviewId);
    if (!review) {
      throw { statusCode: 404, code: "REVIEW_NOT_FOUND", message: "Performance review not found" };
    }

    return db.collection("performance_reviews").updateById(reviewId, {
      managerRating,
      managerComments,
      recommendation: recommendation || "Standard Increment",
      status: "Approved",
      completedAt: new Date().toISOString(),
    });
  }

  // Learning & Development
  static async listCourses({ category }) {
    return db.collection("courses").find((c) => {
      if (category && c.category.toLowerCase() !== category.toLowerCase()) return false;
      return true;
    });
  }

  static async createCourse(data) {
    return db.collection("courses").insert({
      id: generateCode("CRS"),
      title: data.title,
      code: data.code,
      durationHours: data.durationHours || 8,
      category: data.category || "Technical",
      mandatory: !!data.mandatory,
    });
  }

  static async listEnrollments({ employeeId, courseId, status }) {
    return db.collection("course_enrollments").find((e) => {
      if (employeeId && e.employeeId !== employeeId) return false;
      if (courseId && e.courseId !== courseId) return false;
      if (status && e.status.toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });
  }

  static async enrollInCourse({ employeeId, courseId }) {
    const course = await db.collection("courses").findById(courseId);
    if (!course) {
      throw { statusCode: 404, code: "COURSE_NOT_FOUND", message: "Course not found" };
    }

    const existing = await db.collection("course_enrollments").findOne((e) => e.employeeId === employeeId && e.courseId === courseId);
    if (existing) {
      throw { statusCode: 400, code: "ALREADY_ENROLLED", message: "Employee already enrolled in this course" };
    }

    return db.collection("course_enrollments").insert({
      id: generateUUID(),
      courseId,
      employeeId,
      enrolledAt: new Date().toISOString().split("T")[0],
      status: "In progress",
      progress: 0,
      score: null,
      certificationExpiry: null,
    });
  }

  static async completeEnrollment(enrollmentId, { score, certificationValidityYears = 2 }) {
    const enrollment = await db.collection("course_enrollments").findById(enrollmentId);
    if (!enrollment) {
      throw { statusCode: 404, code: "ENROLLMENT_NOT_FOUND", message: "Enrollment not found" };
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + certificationValidityYears);

    return db.collection("course_enrollments").updateById(enrollmentId, {
      status: "Completed",
      progress: 100,
      score: score || 100,
      completedAt: new Date().toISOString().split("T")[0],
      certificationExpiry: expiryDate.toISOString().split("T")[0],
    });
  }
}

