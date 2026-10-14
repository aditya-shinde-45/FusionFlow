/**
 * Standard enterprise response format
 */
export function successResponse(res, { data = {}, message = "Operation completed successfully", statusCode = 200, meta = undefined }) {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

export function errorResponse(res, { message = "An error occurred", code = "INTERNAL_ERROR", details = [], statusCode = 500 }) {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    details,
  });
}

export class ApiError extends Error {
  constructor(message, statusCode = 500, code = "API_ERROR", details = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendSuccess(res, data, message = "Success", statusCode = 200) {
  return successResponse(res, { data, message, statusCode });
}

export function sendCreated(res, data, message = "Created", statusCode = 201) {
  return successResponse(res, { data, message, statusCode });
}

export function sendError(res, message, statusCode = 500, code = "ERROR") {
  return errorResponse(res, { message, statusCode, code });
}



