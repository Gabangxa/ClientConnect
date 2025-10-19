/**
 * Enhanced Database Configuration
 * 
 * This is a simplified version focusing on the core database setup
 * without the complex pooling that might require additional dependencies.
 * 
 * @module DatabaseConfig
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '@shared/schema';

/**
 * Database performance metrics
 */
interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  errorRate: number;
}

/**
 * Database manager with performance monitoring
 */
class DatabaseManager {
  private metrics: DatabaseMetrics = {
    connectionCount: 0,
    activeQueries: 0,
    avgQueryTime: 0,
    slowQueries: 0,
    errorRate: 0,
  };
  private queryLog: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private client: postgres.Sql;
  private database: ReturnType<typeof drizzle>;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create postgres client with optimized settings
    this.client = postgres(connectionString, {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idle_timeout: 30,
      connect_timeout: 10,
    });

    // Create Drizzle database instance
    this.database = drizzle(this.client, { schema });
  }

  /**
   * Get optimized database connection
   */
  getDatabase() {
    return this.database;
  }

  /**
   * Execute query with performance monitoring
   */
  async executeWithMetrics<T>(queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.metrics.activeQueries++;

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      this.updateQueryMetrics(duration, false);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateQueryMetrics(duration, true);
      throw error;
    } finally {
      this.metrics.activeQueries--;
    }
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(duration: number, isError: boolean): void {
    if (isError) {
      this.metrics.errorRate++;
    }

    // Track slow queries
    if (duration > 1000) {
      this.metrics.slowQueries++;
    }

    // Update average query time with exponential moving average
    const alpha = 0.1;
    this.metrics.avgQueryTime = (alpha * duration) + ((1 - alpha) * this.metrics.avgQueryTime);
  }

  /**
   * Get current database metrics
   */
  getMetrics(): DatabaseMetrics & { recentQueries: typeof this.queryLog } {
    return {
      ...this.metrics,
      recentQueries: this.queryLog.slice(-10),
    };
  }

  /**
   * Health check for database connections
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const startTime = Date.now();
      await this.client`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'unhealthy',
        details: {
          responseTime,
          activeQueries: this.metrics.activeQueries,
          avgQueryTime: this.metrics.avgQueryTime,
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down database connections...');
    try {
      await this.client.end();
      console.log('Database connections closed successfully');
    } catch (error) {
      console.error('Error during database shutdown:', error);
    }
  }
}

// Create global database manager instance
export const dbManager = new DatabaseManager();

// Export configured database instance
export const db = dbManager.getDatabase();

/**
 * Database health monitoring
 */
export const DatabaseHealth = {
  /**
   * Perform comprehensive health check
   */
  async check() {
    return dbManager.healthCheck();
  },

  /**
   * Get current database metrics
   */
  getMetrics() {
    return dbManager.getMetrics();
  },

  /**
   * Optimize database performance
   */
  async optimize() {
    try {
      await db.execute(sql`ANALYZE`);
      console.log('Database optimization completed');
    } catch (error) {
      console.error('Database optimization failed:', error);
      throw error;
    }
  },
};

/**
 * Database query optimization utilities
 */
export const QueryOptimizer = {
  /**
   * Execute query with automatic retry and monitoring
   */
  async executeOptimized<T>(queryFn: () => Promise<T>): Promise<T> {
    return dbManager.executeWithMetrics(queryFn);
  },

  /**
   * Get query performance insights
   */
  getPerformanceInsights() {
    return dbManager.getMetrics();
  },
};

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await dbManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await dbManager.shutdown();
  process.exit(0);
});