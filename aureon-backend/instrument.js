// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

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
});

// Log that Sentry has been initialized
console.log('✅ Sentry initialized successfully');

module.exports = Sentry;
