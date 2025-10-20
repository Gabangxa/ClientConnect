/**
 * Production-Safe Logger
 * 
 * Centralized logging utility that respects environment settings.
 * Prevents debug logs from appearing in production while maintaining
 * proper error logging for monitoring and debugging.
 * 
 * Features:
 * - Environment-aware logging levels
 * - Structured log formatting
 * - Performance-safe in production
 * - TypeScript support with proper types
 * 
 * @module Logger
 */

interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log error messages - always shown in all environments
   */
  error(message: string, data?: any): void {
    if (data) {
      console.error(`[ERROR] ${message}`, data);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log warning messages - shown in development and staging
   */
  warn(message: string, data?: any): void {
    if (this.isProduction) return;
    
    if (data) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log informational messages - shown in development only
   */
  info(message: string, data?: any): void {
    if (!this.isDevelopment) return;
    
    if (data) {
      console.info(`[INFO] ${message}`, data);
    } else {
      console.info(`[INFO] ${message}`);
    }
  }

  /**
   * Log debug messages - shown in development only
   */
  debug(message: string, data?: any): void {
    if (!this.isDevelopment) return;
    
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }

  /**
   * Log WebSocket events - development only
   */
  websocket(event: string, data?: any): void {
    if (!this.isDevelopment) return;
    
    if (data) {
      console.log(`[WS] ${event}`, data);
    } else {
      console.log(`[WS] ${event}`);
    }
  }

  /**
   * Log database operations - development only
   */
  database(operation: string, data?: any): void {
    if (!this.isDevelopment) return;
    
    if (data) {
      console.log(`[DB] ${operation}`, data);
    } else {
      console.log(`[DB] ${operation}`);
    }
  }

  /**
   * Log API requests - development only
   */
  api(method: string, path: string, status?: number, duration?: number): void {
    if (!this.isDevelopment) return;
    
    let message = `${method} ${path}`;
    if (status) message += ` ${status}`;
    if (duration) message += ` (${duration}ms)`;
    
    console.log(`[API] ${message}`);
  }

  /**
   * Log authentication events - development only
   */
  auth(event: string, data?: any): void {
    if (!this.isDevelopment) return;
    
    if (data) {
      // Be careful not to log sensitive data
      const safeData = typeof data === 'object' ? 
        { ...data, password: '[REDACTED]', token: '[REDACTED]' } : 
        data;
      console.log(`[AUTH] ${event}`, safeData);
    } else {
      console.log(`[AUTH] ${event}`);
    }
  }

  /**
   * Create a scoped logger for a specific module
   */
  scope(moduleName: string) {
    return {
      error: (message: string, data?: any) => this.error(`[${moduleName}] ${message}`, data),
      warn: (message: string, data?: any) => this.warn(`[${moduleName}] ${message}`, data),
      info: (message: string, data?: any) => this.info(`[${moduleName}] ${message}`, data),
      debug: (message: string, data?: any) => this.debug(`[${moduleName}] ${message}`, data),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { error, warn, info, debug, websocket, database, api, auth } = logger;

// Export log levels
export { LOG_LEVELS };