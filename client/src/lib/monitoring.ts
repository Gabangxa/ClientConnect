import * as Sentry from '@sentry/react';
import { logger } from '@shared/logger';

/**
 * Initialize Sentry monitoring
 * This should be called as early as possible in the application lifecycle
 */
export const initializeMonitoring = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn) {
    logger.info('Initializing Sentry monitoring...');
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Tracing
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ["localhost", /^\//],
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.

      environment: import.meta.env.MODE,
    });
  } else {
    logger.info('Sentry DSN not found, skipping initialization');
  }
};

/**
 * Capture an exception and send it to Sentry
 *
 * @param error The error object
 * @param context Additional context to attach to the error
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn) {
    Sentry.captureException(error, {
      extra: context
    });
  } else {
    // If Sentry is not configured, we just rely on the existing logger
    // which should have already been called by the ErrorBoundary or the caller.
    // However, we log a debug message to indicate we would have sent it.
    logger.debug('Mock sending error to monitoring service', { error: error.message, context });
  }
};
