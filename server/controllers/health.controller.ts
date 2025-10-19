/**
 * Health Check Controller
 * 
 * Provides comprehensive health monitoring endpoints for the application,
 * including database health, cache performance, and system metrics.
 * 
 * Features:
 * - Database connectivity and performance monitoring
 * - Cache hit rates and performance metrics
 * - System resource utilization
 * - Configuration validation status
 * - Overall system health assessment
 * 
 * @module HealthController
 */

import { Request, Response } from 'express';
import { DatabaseHealth } from '../db';
import { CacheManager } from '../middlewares/performance.middleware';

/**
 * Get comprehensive system health status
 * 
 * Performs checks on all critical system components and returns
 * a detailed health report including performance metrics.
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const getHealthStatus = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Database health check
    const databaseHealth = await DatabaseHealth.check();
    const cacheStats = CacheManager.getStats();
    const systemHealth = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
    };

    // Determine overall system status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    }

    const healthReport = {
      status: overallStatus,
      checks: {
        database: databaseHealth,
        cache: {
          status: 'healthy',
          details: cacheStats,
        },
        system: systemHealth,
      },
      performance: {
        database: await DatabaseHealth.getMetrics(),
        cache: cacheStats,
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
        },
      },
    };

    // Set appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(healthReport);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get database performance metrics
 * 
 * Returns detailed database performance information including
 * query times, connection stats, and optimization insights.
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const getDatabaseMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await DatabaseHealth.getMetrics();
    
    res.json({
      status: 'success',
      data: {
        metrics,
        optimization: {
          recommendations: generateOptimizationRecommendations(metrics),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database metrics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve database metrics',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get cache performance metrics
 * 
 * Returns cache statistics, hit rates, and performance insights.
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const getCacheMetrics = (req: Request, res: Response) => {
  try {
    const stats = CacheManager.getStats();
    
    res.json({
      status: 'success',
      data: {
        cache: stats,
        recommendations: generateCacheRecommendations(stats),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve cache metrics',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Clear cache (development/admin only)
 * 
 * Allows clearing cache entries by pattern or entirely.
 * Should be protected in production.
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const clearCache = (req: Request, res: Response) => {
  try {
    const { pattern } = req.query;
    
    let clearedCount = 0;
    if (pattern && typeof pattern === 'string') {
      clearedCount = CacheManager.clearPattern(pattern);
    } else {
      CacheManager.clearAll();
      clearedCount = -1; // Indicates all cleared
    }
    
    res.json({
      status: 'success',
      message: clearedCount === -1 ? 'All cache cleared' : `Cleared ${clearedCount} cache entries`,
      pattern: pattern || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cache',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Run database optimization (admin only)
 * 
 * Triggers database optimization tasks like ANALYZE.
 * Should be protected in production.
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const optimizeDatabase = async (req: Request, res: Response) => {
  try {
    await DatabaseHealth.optimize();
    
    res.json({
      status: 'success',
      message: 'Database optimization completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database optimization error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database optimization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Generate optimization recommendations based on database metrics
 */
function generateOptimizationRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (metrics.avgQueryTime > 500) {
    recommendations.push('Consider optimizing slow queries or adding database indices');
  }
  
  if (metrics.activeQueries > 10) {
    recommendations.push('High concurrent query load - consider connection pooling optimization');
  }
  
  if (metrics.errorRate > 5) {
    recommendations.push('High database error rate - investigate connection issues');
  }
  
  if (metrics.connectionCount > 50) {
    recommendations.push('High connection count - review connection pooling configuration');
  }
  
  return recommendations;
}

/**
 * Generate cache optimization recommendations
 */
function generateCacheRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (stats.hitRate < 70) {
    recommendations.push('Cache hit rate is low - consider increasing TTL or cache size');
  }
  
  if (stats.size > 800) {
    recommendations.push('Cache size is near limit - consider implementing LRU eviction');
  }
  
  return recommendations;
}

/**
 * Get system performance metrics
 * 
 * Returns system-level performance information.
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const getSystemMetrics = (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      status: 'success',
      data: {
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: process.uptime(),
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve system metrics',
      timestamp: new Date().toISOString(),
    });
  }
};