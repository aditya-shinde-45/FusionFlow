import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../config/database.js";
import { errorResponse } from "../utils/response.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, {
        message: "Authentication token missing or invalid",
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return errorResponse(res, {
        message: "Token expired or invalid",
        code: "INVALID_TOKEN",
        statusCode: 401,
      });
    }

    // Lookup user in DB
    const user = await db.collection("users").findOne((u) => u.id === decoded.userId || u.username === decoded.username);
    if (!user || !user.active) {
      return errorResponse(res, {
        message: "User account not found or deactivated",
        code: "USER_DEACTIVATED",
        statusCode: 401,
      });
    }

    // Lookup associated employee if exists
    const employee = await db.collection("employees").findOne((e) => e.userId === user.id || e.workEmail === user.email || e.fullName === user.name);

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      reportsTo: user.reportsTo,
      email: user.email,
      employeeId: employee ? employee.id : null,
      employeeNumber: employee ? employee.employeeNumber : null,
      department: employee ? employee.department : null,
    };

    next();
  } catch (error) {
    return errorResponse(res, {
      message: "Authentication failure",
      code: "AUTH_ERROR",
      details: [error.message],
      statusCode: 500,
    });
  }
}

