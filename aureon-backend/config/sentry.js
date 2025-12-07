import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node'; // ⚠️ Export não disponível nesta versão

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Free tier: 5,000 events/month
 * 
 * Setup:
 * 1. Create account at https://sentry.io/signup/
 * 2. Create new Node.js project
 * 3. Copy DSN to .env as SENTRY_DSN
 * 4. Set SENTRY_ENABLED=true
 */
export function initializeSentry() {
  const sentryEnabled = process.env.SENTRY_ENABLED === 'true';
  const sentryDSN = process.env.SENTRY_DSN;

  if (!sentryEnabled) {
    console.log('ℹ️  Sentry error tracking disabled');
    return;
  }

  if (!sentryDSN || sentryDSN.includes('your-key')) {
    console.warn('⚠️  SENTRY_DSN not configured properly. Skipping Sentry initialization.');
    return;
  }

  Sentry.init({
    dsn: sentryDSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    
    // Profiling - desabilitado devido a incompatibilidade de versão
    // profilesSampleRate: 0.1,
    // integrations: [
    //   new ProfilingIntegration(),
    // ],

    // Release tracking
    release: process.env.npm_package_version,

    // Don't send errors in test environment
    enabled: process.env.NODE_ENV !== 'test',

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Don't send 404s to Sentry
      if (event.exception?.values?.[0]?.value?.includes('404')) {
        return null;
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized successfully');
}

/**
 * Capture exception with context
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context
 */
export function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category, data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Express error handler middleware (must be last)
 */
export function sentryErrorHandler() {
  if (!Sentry.Handlers) {
    return (err, req, res, next) => next(err); // No-op quando Sentry desabilitado
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Send all 500 errors to Sentry
      return error.status >= 500 || !error.status;
    },
  });
}

/**
 * Express request handler middleware (must be first)
 */
export function sentryRequestHandler() {
  if (!Sentry.Handlers) {
    return (req, res, next) => next(); // No-op quando Sentry desabilitado
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Express tracing middleware
 */
export function sentryTracingHandler() {
  if (!Sentry.Handlers) {
    return (req, res, next) => next(); // No-op quando Sentry desabilitado
  }
  return Sentry.Handlers.tracingHandler();
}

export default Sentry;
