import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeWebSocket } from "./services/websocket.service";
// Performance middleware imports (to be added later)
// import { 
//   compressionMiddleware, 
//   performanceMonitoring, 
//   staticAssetOptimization,
//   optimizeApiResponse 
// } from "./middlewares/performance.middleware";

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket service
const webSocketService = initializeWebSocket(httpServer);

// Apply performance optimizations early in middleware chain (to be added later)
// app.use(compressionMiddleware);
// app.use(performanceMonitoring);
// app.use(staticAssetOptimization);
// app.use(optimizeApiResponse);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Import and use centralized error handling middleware AFTER Vite setup
  const { errorHandler, notFoundHandler } = await import("./middlewares");
  
  // Apply centralized error handling last to catch any remaining unhandled routes
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Use httpServer instead of server for WebSocket support
  httpServer.listen(port, "0.0.0.0", () => {
    log(`Server with WebSocket support serving on port ${port}`);
  });
})();
