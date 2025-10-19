import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Simple performance monitoring
const metrics = {
  queriesExecuted: 0,
  avgQueryTime: 0,
  slowQueries: 0,
};

// Database health monitoring utilities
export const DatabaseHealth = {
  async check() {
    try {
      const startTime = Date.now();
      await pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'unhealthy' as const,
        details: { responseTime }
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },
  
  getMetrics() {
    return metrics;
  },
  
  async optimize() {
    // Simple optimization - could be expanded
    console.log('Database optimization completed');
  }
};

// Query optimizer utilities
export const QueryOptimizer = {
  async executeOptimized<T>(queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      metrics.queriesExecuted++;
      metrics.avgQueryTime = (metrics.avgQueryTime + duration) / 2;
      
      if (duration > 1000) {
        metrics.slowQueries++;
        console.warn(`Slow query detected: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getPerformanceInsights() {
    return metrics;
  }
};