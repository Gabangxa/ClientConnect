import * as Sentry from '@sentry/node';
import { logger } from '../middlewares/logging.middleware';

// Initialize Sentry for error monitoring
export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        Sentry.httpIntegration({ tracing: true }),
        Sentry.expressIntegration(),
      ],
    });
    
    logger.info('Sentry error monitoring initialized');
  } else {
    logger.warn('SENTRY_DSN not provided, error monitoring disabled');
  }
}

// Express middleware for Sentry
export const sentryRequestHandler = Sentry.setupExpressErrorHandler;
export const sentryTracingHandler = Sentry.expressIntegration();
export const sentryErrorHandler = Sentry.setupExpressErrorHandler;

// Helper function to capture exceptions
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
  
  logger.error({ error, context }, 'Exception captured');
}

// Helper function to add user context
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export { Sentry };