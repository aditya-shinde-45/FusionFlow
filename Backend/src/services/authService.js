import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";

export class AuthService {
  static async login(username, password) {
    const user = await db.collection("users").findOne((u) => u.username === username);
    if (!user) {
      throw { statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid username or password" };
    }

    if (!user.active) {
      throw { statusCode: 403, code: "ACCOUNT_DISABLED", message: "User account is disabled" };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid username or password" };
    }

    // Lookup employee profile
    const employee = await db.collection("employees").findOne((e) => e.userId === user.id || e.workEmail === user.email || e.fullName === user.name);

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      employeeId: employee ? employee.id : null,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
    const refreshToken = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });

    const permissions = ROLE_PERMISSIONS[user.role] || [];

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        reportsTo: user.reportsTo,
        initials: user.initials,
        email: user.email,
        employeeId: employee ? employee.id : null,
        employeeNumber: employee ? employee.employeeNumber : null,
        department: employee ? employee.department : null,
        permissions,
      },
    };
  }

  static async getCurrentUser(userId) {
    const user = await db.collection("users").findById(userId);
    if (!user) {
      throw { statusCode: 404, code: "NOT_FOUND", message: "User not found" };
    }

    const employee = await db.collection("employees").findOne((e) => e.userId === user.id || e.workEmail === user.email || e.fullName === user.name);
    const permissions = ROLE_PERMISSIONS[user.role] || [];

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      reportsTo: user.reportsTo,
      initials: user.initials,
      email: user.email,
      employeeId: employee ? employee.id : null,
      employeeNumber: employee ? employee.employeeNumber : null,
      department: employee ? employee.department : null,
      permissions,
    };
  }
}

