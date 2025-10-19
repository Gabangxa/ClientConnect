import { Request, Response, NextFunction } from 'express';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request start
  console.log(`${new Date().toISOString()} [${req.method}] ${req.path} - Started`);
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log completion
  res.end = function(this: Response, chunk?: any, encoding?: any, cb?: any): any {
    const duration = Date.now() - start;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    // Prepare log message
    const logMessage = `${timestamp} [express] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
    
    // Add additional info for specific status codes
    if (res.statusCode >= 400) {
      const errorInfo = chunk ? ` :: ${chunk.toString().substring(0, 100)}` : '';
      console.log(`${logMessage}${errorInfo}`);
    } else {
      console.log(logMessage);
    }
    
    // Call original end function and return the result
    return originalEnd.call(this, chunk, encoding, cb);
  } as any;
  
  next();
};

// Rate limiting middleware (basic implementation)
const requestCounts = new Map();
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // per window per IP

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  
  // Remove old requests outside the window
  while (requests.length > 0 && requests[0] < now - WINDOW_SIZE) {
    requests.shift();
  }
  
  // Check if limit exceeded
  if (requests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  }
  
  // Add current request
  requests.push(now);
  
  next();
};