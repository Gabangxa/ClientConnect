import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import rateLimit from 'express-rate-limit';

// Initialize pino logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  } : undefined
});

// Request logging middleware with pino
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to log completion
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    // Add error info for failed requests
    if (res.statusCode >= 400 && chunk) {
      logData.error = chunk.toString().substring(0, 100);
    }
    
    if (res.statusCode >= 500) {
      logger.error(logData, 'Server error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Client error');
    } else {
      logger.info(logData, 'Request completed');
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Export logger for use in other modules
export { logger };

// Production-ready rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
    }, 'Rate limit exceeded');
    
    res.status(429).json({
      message: "Too many requests from this IP, please try again later.",
    });
  }
});

// Stricter rate limiting for authentication routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    message: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true,
});