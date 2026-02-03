import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for error tracking and performance monitoring
export const initSentry = () => {
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      
      // Performance monitoring
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        nodeProfilingIntegration(),
      ],
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Profile sampling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Error reporting
      beforeSend(event) {
        // Filter out sensitive information
        if (event.exception) {
          const exception = event.exception.values[0];
          if (exception.stacktrace) {
            exception.stacktrace.frames = exception.stacktrace.frames.map(frame => ({
              ...frame,
              vars: undefined // Remove local variables for privacy
            }));
          }
        }
        return event;
      },
      
      // Custom tags and context
      initialScope: {
        tags: {
          service: 'bloodbank-backend',
          version: process.env.npm_package_version || '1.0.0'
        },
        user: {
          id: 'system'
        }
      }
    });
    
    console.log('✅ Sentry initialized for error tracking and performance monitoring');
  }
};

// Capture errors with context
export const captureError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser(context.user);
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    Sentry.captureException(error);
  });
};

// Capture messages
export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    Sentry.captureMessage(message, level);
  });
};

// Performance monitoring
export const startTransaction = (name, op = 'http.server') => {
  return Sentry.startTransaction({
    name,
    op,
    data: {
      service: 'bloodbank-backend'
    }
  });
};

// Health check for Sentry
export const checkSentryHealth = () => {
  try {
    const client = Sentry.getCurrentHub().getClient();
    return {
      status: 'healthy',
      dsn: !!process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      clientInitialized: !!client
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};
