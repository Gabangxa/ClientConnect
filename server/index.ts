import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import modularRouter from "./router"; // Import the new modular router
import { setupAuth } from "./googleAuth";
import { setupVite, serveStatic, log } from "./vite";
import { initializeWebSocket } from "./services/websocket.service";
import { initializeSecurityCleanup, secureHeaders, rateLimiters } from "./middlewares/security.middleware";
import { queueService } from "./services/queue.service";
import fs from "fs";
import path from "path";

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket service
const webSocketService = initializeWebSocket(httpServer);

// Initialize security cleanup timer
const securityCleanupTimer = initializeSecurityCleanup();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware
app.use(secureHeaders);
app.use(rateLimiters.global);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure uploads directory exists (legacy support)
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Auth setup
  await setupAuth(app);

  // Register modular routes
  app.use("/api", modularRouter);

  // Start background job worker
  queueService.start();

  // Setup Vite
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Error handling
  const { errorHandler, notFoundHandler } = await import("./middlewares");
  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = parseInt(process.env.PORT || '5000', 10);
  
  httpServer.listen(port, "0.0.0.0", () => {
    log(`Server with WebSocket support serving on port ${port}`);
    log(`Background job worker started`);
  });
})();
