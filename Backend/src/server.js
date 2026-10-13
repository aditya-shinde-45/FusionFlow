import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`FusionFlow H2R Backend server listening on port ${env.PORT}`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    swaggerDocs: `http://localhost:${env.PORT}/api/docs`,
    healthEndpoint: `http://localhost:${env.PORT}/health`,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated.");
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated.");
  });
});

export default server;

