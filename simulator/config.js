/**
 * AUREON ERP - Simulator Configuration
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    retries: 3
  },

  // Frontend Configuration
  frontend: {
    baseUrl: process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0')
  },

  // Database Configuration
  database: {
    seedPath: './simulator/seeds',
    snapshotPath: './simulator/snapshots'
  },

  // Report Configuration
  reports: {
    localPath: './simulator/reports',
    format: ['json', 'html'],
    s3: {
      enabled: process.env.S3_ENABLED === 'true',
      bucket: process.env.S3_BUCKET || 'aureon-simulation-reports',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },

  // Scenario Configuration
  scenarios: {
    path: './simulator/scenarios',
    timeout: 60000,
    parallel: parseInt(process.env.PARALLEL || '1'),
    seed: parseInt(process.env.SEED || Date.now())
  },

  // Mock Services Configuration
  mocks: {
    paymentGateway: {
      port: 5001,
      enabled: true,
      defaultDelay: 500,
      failureRate: 0.0 // 0-1 (0% to 100%)
    },
    marketplace: {
      port: 5002,
      enabled: true,
      defaultDelay: 1000,
      failureRate: 0.0
    }
  },

  // Failure Injection Configuration
  failures: {
    enabled: process.env.INJECT_FAILURES === 'true',
    networkDelay: {
      min: 1000,
      max: 5000
    },
    httpErrors: [400, 401, 403, 404, 500, 502, 503, 504],
    dbErrors: ['connection', 'timeout', 'constraint', 'unique']
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production',
    file: './simulator/reports/simulation.log'
  },

  // Default credentials for testing
  credentials: {
    ceo: {
      username: 'ceo',
      password: 'ceo123'
    },
    vendedor: {
      username: 'vendedor',
      password: 'vendedor123'
    },
    estoque: {
      username: 'estoque',
      password: 'estoque123'
    }
  }
};

export default config;
