/**
 * Comprehensive Security Middleware
 * Implements file upload security, rate limiting, and brute force protection
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// File type validation
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.rtf', '.odt', '.ods', '.odp',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.mp3', '.wav', '.ogg', '.m4a',
  '.zip', '.rar', '.7z', '.tar', '.gz'
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip'
];

// Rate limiting stores
const rateLimitStores = {
  global: new Map<string, number[]>(),
  login: new Map<string, number[]>(),
  fileUpload: new Map<string, number[]>(),
  messaging: new Map<string, number[]>(),
};

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  skipSuccessfulRequests?: boolean;
}

const rateLimits: Record<string, RateLimitConfig> = {
  // More generous limits for development, can be tightened in production
  global: { windowMs: 60 * 1000, maxAttempts: process.env.NODE_ENV === 'development' ? 1000 : 100 }, // 1000 per minute in dev
  login: { windowMs: 15 * 60 * 1000, maxAttempts: process.env.NODE_ENV === 'development' ? 50 : 5 }, // 50 per 15 minutes in dev
  fileUpload: { windowMs: 60 * 1000, maxAttempts: process.env.NODE_ENV === 'development' ? 50 : 10 }, // 50 per minute in dev
  messaging: { windowMs: 60 * 1000, maxAttempts: process.env.NODE_ENV === 'development' ? 100 : 30 }, // 100 per minute in dev
};

/**
 * Create rate limiter for specific endpoint type
 */
export const createRateLimiter = (type: keyof typeof rateLimits) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const config = rateLimits[type];
    const store = rateLimitStores[type as keyof typeof rateLimitStores];
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store.has(ip)) {
      store.set(ip, []);
    }

    const requests = store.get(ip)!;

    // Remove expired requests
    while (requests.length > 0 && requests[0] < now - config.windowMs) {
      requests.shift();
    }

    // Check if limit exceeded
    if (requests.length >= config.maxAttempts) {
      const retryAfter = Math.ceil((requests[0] + config.windowMs - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many ${type} attempts. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    // Add current request
    requests.push(now);
    next();
  };
};

/**
 * Generate secure random filename
 */
export const generateSecureFilename = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomId = nanoid(12);
  const hash = crypto.createHash('md5').update(originalName + timestamp).digest('hex').substring(0, 8);
  
  return `${timestamp}-${randomId}-${hash}${ext}`;
};

/**
 * Validate file security
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  
  if (!file) {
    return next();
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: `File extension '${ext}' is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    });
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid MIME type',
      message: `MIME type '${file.mimetype}' is not allowed.`,
    });
  }

  // Check for suspicious file content (basic checks)
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return res.status(400).json({
      error: 'Invalid filename',
      message: 'Filename contains invalid characters.',
    });
  }

  // Check file size (additional check beyond multer)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return res.status(400).json({
      error: 'File too large',
      message: `File size must be less than ${maxSize / 1024 / 1024}MB.`,
    });
  }

  // Generate secure filename
  (file as any).secureFilename = generateSecureFilename(file.originalname);

  next();
};

/**
 * Enhanced brute force protection for authentication
 */
const failedAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const maxFailedAttempts = 5;
  const blockDuration = 15 * 60 * 1000; // 15 minutes
  const attemptWindow = 15 * 60 * 1000; // 15 minutes

  const attempts = failedAttempts.get(ip);

  // Check if IP is currently blocked
  if (attempts?.blockedUntil && now < attempts.blockedUntil) {
    const remainingTime = Math.ceil((attempts.blockedUntil - now) / 1000 / 60);
    return res.status(429).json({
      error: 'IP temporarily blocked',
      message: `Too many failed login attempts. Try again in ${remainingTime} minutes.`,
    });
  }

  // Reset attempts if window has passed
  if (attempts && (now - attempts.lastAttempt) > attemptWindow) {
    failedAttempts.delete(ip);
  }

  // Store request for potential failure tracking
  req.authAttemptTracking = {
    ip,
    recordFailure: () => {
      const current = failedAttempts.get(ip) || { count: 0, lastAttempt: now };
      current.count += 1;
      current.lastAttempt = now;

      if (current.count >= maxFailedAttempts) {
        current.blockedUntil = now + blockDuration;
      }

      failedAttempts.set(ip, current);
    },
    recordSuccess: () => {
      failedAttempts.delete(ip);
    }
  };

  next();
};

/**
 * Secure headers middleware
 */
export const secureHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self';"
  );

  next();
};

// Export rate limiters for specific endpoints
export const rateLimiters = {
  global: createRateLimiter('global'),
  login: createRateLimiter('login'),
  fileUpload: createRateLimiter('fileUpload'),
  messaging: createRateLimiter('messaging'),
};

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      authAttemptTracking?: {
        ip: string;
        recordFailure: () => void;
        recordSuccess: () => void;
      };
    }
  }
}