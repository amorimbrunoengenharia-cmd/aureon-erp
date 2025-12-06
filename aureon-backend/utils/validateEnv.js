/**
 * Environment Variables Validation
 * Validates required environment variables on startup
 */

import logger from './logger.js';

const requiredVars = {
  development: [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ],
  production: [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'MARKETPLACE_ENCRYPTION_KEY',
    'SESSION_SECRET'
  ]
};

const recommendedVars = {
  production: [
    'SENTRY_DSN',
    'CORS_ORIGIN',
    'DB_SSL',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ]
};

/**
 * Validate environment variables
 */
export function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredVars[env] || requiredVars.development;
  const missing = [];

  // Check required variables
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check recommended variables (warnings only)
  if (env === 'production' && recommendedVars.production) {
    const missingRecommended = recommendedVars.production.filter(
      varName => !process.env[varName]
    );

    if (missingRecommended.length > 0) {
      logger.warn('⚠️  Missing recommended environment variables:', missingRecommended);
    }
  }

  // Validate JWT secrets strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('⚠️  JWT_SECRET is too short. Recommended: at least 32 characters');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    logger.warn('⚠️  JWT_REFRESH_SECRET is too short. Recommended: at least 32 characters');
  }

  // Validate marketplace encryption key
  if (process.env.MARKETPLACE_ENCRYPTION_KEY) {
    const key = process.env.MARKETPLACE_ENCRYPTION_KEY;
    if (key.length !== 64) { // 32 bytes = 64 hex characters
      logger.warn('⚠️  MARKETPLACE_ENCRYPTION_KEY should be 64 hex characters (32 bytes)');
    }
  }

  // Validate database configuration
  if (process.env.USE_POSTGRES === 'true' || env === 'production') {
    const dbVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingDb = dbVars.filter(v => !process.env[v]);
    
    if (missingDb.length > 0) {
      logger.error('❌ PostgreSQL is enabled but missing DB configuration:', missingDb);
      throw new Error(`Missing database configuration: ${missingDb.join(', ')}`);
    }
  }

  // Production-specific validations
  if (env === 'production') {
    // Check for default/weak values
    const defaults = {
      JWT_SECRET: 'your_super_secret_jwt_key',
      JWT_REFRESH_SECRET: 'your_super_secret_refresh_key',
      DB_PASSWORD: 'postgres',
      SESSION_SECRET: 'your_session_secret',
      MARKETPLACE_ENCRYPTION_KEY: 'your_32_byte_hex_encryption_key'
    };

    Object.entries(defaults).forEach(([key, defaultValue]) => {
      if (process.env[key] && process.env[key].includes(defaultValue.substring(0, 20))) {
        logger.error(`❌ ${key} appears to be using default value in production!`);
        throw new Error(`${key} must be changed from default value in production`);
      }
    });

    // SSL should be enabled in production
    if (process.env.USE_POSTGRES === 'true' && process.env.DB_SSL !== 'true') {
      logger.warn('⚠️  DB_SSL is not enabled. Highly recommended for production!');
    }

    // HTTPS should be enforced
    if (process.env.FORCE_HTTPS !== 'true') {
      logger.warn('⚠️  FORCE_HTTPS is not enabled. Recommended for production!');
    }
  }

  logger.info('✅ Environment variables validated successfully');
}

/**
 * Generate a secure random key
 */
export function generateSecureKey(bytes = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Print environment configuration summary
 */
export function printEnvSummary() {
  const env = process.env.NODE_ENV || 'development';
  const usePostgres = process.env.USE_POSTGRES === 'true' || env === 'production';

  logger.info('📋 Environment Configuration:');
  logger.info(`   Environment: ${env}`);
  logger.info(`   Port: ${process.env.PORT || 5000}`);
  logger.info(`   Database: ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);
  
  if (usePostgres) {
    logger.info(`   DB Host: ${process.env.DB_HOST || 'localhost'}`);
    logger.info(`   DB Port: ${process.env.DB_PORT || 5432}`);
    logger.info(`   DB Name: ${process.env.DB_NAME || 'aureon_erp'}`);
    logger.info(`   DB SSL: ${process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'}`);
    logger.info(`   Pool Max: ${process.env.DB_POOL_MAX || 20}`);
    logger.info(`   Pool Min: ${process.env.DB_POOL_MIN || 5}`);
  }
  
  logger.info(`   CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  logger.info(`   Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000) / 60000} minutes`);
  logger.info(`   Audit Log: ${process.env.ENABLE_AUDIT_LOG !== 'false' ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Marketplace Sync: ${process.env.ENABLE_MARKETPLACE_SYNC !== 'false' ? 'Enabled' : 'Disabled'}`);
  
  if (process.env.SENTRY_DSN) {
    logger.info('   Sentry: Enabled');
  }
}

export default {
  validateEnv,
  generateSecureKey,
  printEnvSummary
};
