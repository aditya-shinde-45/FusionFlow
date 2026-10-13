import { logger } from "../utils/logger.js";
import { errorResponse } from "../utils/response.js";

export function notFoundHandler(req, res) {
  return errorResponse(res, {
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    code: "NOT_FOUND",
    statusCode: 404,
  });
}

export function errorHandler(err, req, res, next) {
  logger.error("Unhandled API error", {
    url: req.originalUrl,
    method: req.method,
    errorMessage: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  const statusCode = err.statusCode || (err.status && typeof err.status === "number" ? err.status : 500);
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred processing your request";

  return errorResponse(res, {
    message,
    code,
    details: err.details || [],
    statusCode,
  });
}

