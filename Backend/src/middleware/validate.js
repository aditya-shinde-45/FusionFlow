import { errorResponse } from "../utils/response.js";

export function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      const details = err.errors ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`) : [err.message];
      return errorResponse(res, {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
        statusCode: 422,
      });
    }
  };
}

