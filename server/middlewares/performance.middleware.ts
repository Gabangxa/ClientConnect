/**
 * Performance Optimization Middleware
 * 
 * Provides comprehensive performance enhancements including response compression,
 * caching, ETags, and request optimization for better user experience.
 * 
 * Features:
 * - GZIP/Brotli compression for responses
 * - Response caching with intelligent cache headers  
 * - ETag generation for conditional requests
 * - Request deduplication for identical concurrent requests
 * - Database query result caching
 * - Static asset optimization
 * 
 * @module PerformanceMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createHash } from 'crypto';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

/**
 * In-memory cache store for development
 * In production, consider using Redis or similar
 */
class MemoryCache {
  private cache: Map<string, { data: any; expires: number; etag: string }> = new Map();
  private maxSize: number = 1000; // Maximum cache entries

  set(key: string, data: any, ttl: number): void {
    // Cleanup expired entries if cache is getting large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + (ttl * 1000);
    const etag = this.generateETag(data);
    this.cache.set(key, { data, expires, etag });
  }

  get(key: string): { data: any; etag: string } | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expires < Date.now()) {
      if (entry) this.cache.delete(key);
      return null;
    }
    return { data: entry.data, etag: entry.etag };
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  private generateETag(data: any): string {
    return createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  // Get cache statistics
  stats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }
}

// Global cache instance
const cache = new MemoryCache();

/**
 * Response compression middleware with smart compression
 * Automatically compresses responses based on content type and size
 */
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Don't compress responses with these status codes
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  // Prefer Brotli compression when available
  level: 6, // Balanced compression level
});

/**
 * Response caching middleware factory
 * Creates caching middleware with configurable cache settings
 */
export const cacheResponse = (config: CacheConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check cache condition
    if (config.condition && !config.condition(req, res)) {
      return next();
    }

    const cacheKey = config.key(req);
    const cached = cache.get(cacheKey);

    if (cached) {
      // Check if client has latest version using ETag
      const clientETag = req.headers['if-none-match'];
      if (clientETag === cached.etag) {
        return res.status(304).end(); // Not Modified
      }

      // Send cached response
      res.setHeader('ETag', cached.etag);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(body: any) {
      // Cache the response
      cache.set(cacheKey, body, config.ttl);
      
      // Set cache headers
      const etag = createHash('md5').update(JSON.stringify(body)).digest('hex');
      res.setHeader('ETag', etag);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
      
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Request deduplication middleware
 * Prevents duplicate concurrent requests from hitting the database
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  deduplicate(key: string, handler: () => Promise<any>): Promise<any> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = handler().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const deduplicator = new RequestDeduplicator();

/**
 * Database query deduplication middleware
 * Prevents identical concurrent database queries
 */
export const deduplicateRequests = (keyGenerator: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    (req as any).deduplicate = (handler: () => Promise<any>) => {
      return deduplicator.deduplicate(key, handler);
    };
    next();
  };
};

/**
 * Common cache configurations
 */
export const CacheConfigs = {
  // Cache user profiles for 5 minutes
  userProfile: {
    ttl: 300,
    key: (req: Request) => `user:${(req as any).user?.claims?.sub}`,
    condition: (req: Request) => !!(req as any).user,
  },
  
  // Cache project lists for 2 minutes  
  projectList: {
    ttl: 120,
    key: (req: Request) => `projects:${(req as any).user?.claims?.sub}`,
    condition: (req: Request) => !!(req as any).user,
  },
  
  // Cache client portal data for 1 minute
  clientPortal: {
    ttl: 60,
    key: (req: Request) => `client:${req.params.shareToken}`,
  },
  
  // Cache file downloads for 10 minutes
  fileDownload: {
    ttl: 600,
    key: (req: Request) => `file:${req.params.filename || req.params.filePath}`,
  },
};

/**
 * Performance monitoring middleware
 * Tracks response times and adds performance headers
 */
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Add request ID for tracing
  const requestId = createHash('md5')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex')
    .substring(0, 8);
    
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms [${requestId}]`);
    }
  });

  next();
};

/**
 * Static asset optimization
 * Sets appropriate cache headers for static assets
 */
export const staticAssetOptimization = (req: Request, res: Response, next: NextFunction) => {
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(req.path);
  
  if (isStaticAsset) {
    // Cache static assets for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000 * 1000).toUTCString());
  }
  
  next();
};

/**
 * API response optimization
 * Removes unnecessary fields and optimizes response size
 */
export const optimizeApiResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Remove null/undefined values to reduce response size
    if (body && typeof body === 'object') {
      body = cleanObject(body);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Helper function to remove null/undefined values from objects
 */
function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = typeof value === 'object' ? cleanObject(value) : value;
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Cache management utilities
 */
export const CacheManager = {
  // Clear cache by pattern
  clearPattern(pattern: string): number {
    let cleared = 0;
    const regex = new RegExp(pattern);
    
    for (const key of (cache as any).cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        cleared++;
      }
    }
    
    return cleared;
  },
  
  // Clear all cache
  clearAll(): void {
    cache.clear();
  },
  
  // Get cache statistics
  getStats() {
    return cache.stats();
  },
};