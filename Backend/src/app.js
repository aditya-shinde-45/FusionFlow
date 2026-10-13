import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openapiSpec } from "./config/swagger.js";
import { db } from "./config/database.js";
import { standardRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import apiRouter from "./routes/index.js";
import { successResponse } from "./utils/response.js";

const app = express();

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false })); // allow swagger assets
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// Global Rate Limiting
app.use("/api", standardRateLimiter);

// Health Check Endpoints
const healthCheck = async (req, res) => {
  const dbHealth = await db.ping();
  return successResponse(res, {
    data: {
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      database: dbHealth,
    },
    message: "FusionFlow HCM Service is healthy",
  });
};

app.get("/health", healthCheck);
app.get("/api/v1/health", healthCheck);

// Swagger / OpenAPI UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));
app.get("/api/docs.json", (req, res) => res.json(openapiSpec));

// Versioned API Routes
app.use("/api/v1", apiRouter);

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;

