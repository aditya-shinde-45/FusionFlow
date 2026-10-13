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

