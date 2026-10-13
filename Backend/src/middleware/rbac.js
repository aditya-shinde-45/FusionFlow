import { ROLE_PERMISSIONS, ROLES } from "../constants/roles.js";
import { errorResponse } from "../utils/response.js";

export function authorizePermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        message: "Authentication required",
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    const userRole = req.user.role;
    // Admin has superuser access
    if (userRole === ROLES.ADMIN) {
      return next();
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasAll = requiredPermissions.every((perm) => {
      if (userPermissions.includes(perm)) return true;
      if (userPermissions.includes(`${perm}_all`)) return true;
      return false;
    });

    if (!hasAll) {
      return errorResponse(res, {
        message: "You do not have permission to perform this action",
        code: "FORBIDDEN",
        details: [`Required permissions: ${requiredPermissions.join(", ")}`],
        statusCode: 403,
      });
    }

    next();
  };
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        message: "Authentication required",
        code: "UNAUTHORIZED",
        statusCode: 401,
      });
    }

    if (req.user.role === ROLES.ADMIN || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return errorResponse(res, {
      message: "Access forbidden for your current role",
      code: "FORBIDDEN",
      details: [`Allowed roles: ${allowedRoles.join(", ")}`],
      statusCode: 403,
    });
  };
}

/**
 * Ensures user can only query/mutate their own employee data unless they have manager/HR/admin access
 */
export function scopeEmployeeAccess() {
  return (req, res, next) => {
    const targetEmployeeId = req.params.employeeId || req.params.id || req.body.employeeId || req.query.employeeId;
    const userRole = req.user.role;

    // HR and Admin can access any employee
    if ([ROLES.ADMIN, ROLES.PLANT_HEAD, ROLES.HR_MANAGER, ROLES.HR_SPECIALIST, ROLES.AUDITOR].includes(userRole)) {
      return next();
    }

    // Line managers can access themselves or their direct reports
    if (targetEmployeeId && req.user.employeeId === targetEmployeeId) {
      return next();
    }

    // For line managers, we let controller verify reporting hierarchy if accessing another employee
    req.isSelfAccess = req.user.employeeId === targetEmployeeId;
    next();
  };
}
