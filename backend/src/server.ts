import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { assetsRoutes } from "./routes/assets";
import { collectionsRoutes } from "./routes/collection";
import { transfersRoutes } from "./routes/transfers";
import { statsRoutes } from "./routes/stats";
import { reportsRoutes } from "./routes/reports";
import { openapiSpec } from "lib/util";

const port = parseInt(process.env.PORT || "3000");

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
  },
});

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : defaultOrigins;

fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl, mobile apps, etc.

    // Allow if explicitly whitelisted
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    // Allow any localhost port
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }

    // Otherwise, reject
    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
});

// fastify.register(cors, {
//   origin: (origin, cb) => {
//     // Allow requests with no origin (like curl or mobile apps)
//     if (!origin) return cb(null, true);

//        // Allow if explicitly whitelisted
//     if (allowedOrigins.includes(origin)) {
//       return cb(null, true);
//     }

//     // Allow any localhost port
//     if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
//       return cb(null, true);
//     }

//     if (allowedOrigins.includes(origin)) {
//       cb(null, true);

//     } else {
//       cb(new Error("Not allowed by CORS"), false);
//     }
//   },
//   credentials: true,
// });

// --- Swagger Setup ---
fastify.register(swagger, {
  openapi: openapiSpec,
});

fastify.register(swaggerUI, {
  routePrefix: "/docs",
});

// Add global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error(error);

  if (error.validation) {
    reply.status(400).send({
      error: "Validation Error",
      details: error.validation,
    });
    return;
  }

  reply.status(500).send({
    error: "Internal Server Error",
  });
});

// Add global preHandler for request logging
fastify.addHook("preHandler", async (request, reply) => {
  fastify.log.info(
    {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
    "Incoming request"
  );
});

// Register routes
fastify.register(assetsRoutes, { prefix: "/api" });
fastify.register(collectionsRoutes, { prefix: "/api" });
fastify.register(transfersRoutes, { prefix: "/api" });
fastify.register(statsRoutes, { prefix: "/api" });
fastify.register(reportsRoutes, { prefix: "/api" });

// Root endpoint
fastify.get("/", async (request, reply) => {
  reply.send({
    message: "NFT Indexer API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      assets: "/api/assets",
      collections: "/api/collections",
      transfers: "/api/transfers",
      stats: "/api/stats",
      reports: "/api/reports",
    },
    documentation:
      process.env.NODE_ENV === "production"
        ? "https://github.com/your-repo/nft-indexer-api"
        : `http://localhost:${port}/docs`,
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info("Starting graceful shutdown...");

  try {
    await fastify.close();
    fastify.log.info("Server closed successfully");
    process.exit(0);
  } catch (error: any) {
    fastify.log.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const start = async () => {
  try {
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });

    fastify.log.info(`
🚀 NFT Indexer API Server running!
📍 Address: http://${host}:${port}
🏥 Health: http://${host}:${port}/health
📚 API Base: http://${host}:${port}/api
    `);
  } catch (err: any) {
    fastify.log.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error: any) => {
  fastify.log.fatal("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  fastify.log.fatal(`Unhandled Rejection at:${reason}`);
  process.exit(1);
});

start();
