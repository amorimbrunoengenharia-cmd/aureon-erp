// IMPORTANT: This file must be imported at the very top of your entry file
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://e372ed2ca282008b5ac271f268a40ec5@o4510500156014592.ingest.us.sentry.io/4510500158439424",
  integrations: [
    nodeProfilingIntegration(),
  ],

  // Send structured logs to Sentry
  enableLogs: true,
  
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  
  // Set sampling rate for profiling - this is evaluated only once per SDK.init call
  profileSessionSampleRate: 1.0,
  
  // Trace lifecycle automatically enables profiling during active traces
  profileLifecycle: 'trace',
  
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,

  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release version
  release: process.env.npm_package_version || '1.0.0',

  // Only enable Sentry in production
  enabled: process.env.NODE_ENV === 'production',
});

// Log that Sentry has been initialized
if (process.env.NODE_ENV === 'production') {
  console.log('✅ Sentry initialized successfully');
} else {
  console.log('ℹ️  Sentry disabled (development mode)');
}

export default Sentry;
