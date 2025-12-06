/**
 * Health Check Service
 * Monitors application health and provides circuit breaker functionality
 */

import logger from './logger.js';

class HealthCheckService {
  constructor() {
    this.checks = {
      database: { healthy: true, lastCheck: Date.now(), errors: 0 },
      memory: { healthy: true, lastCheck: Date.now(), errors: 0 },
      api: { healthy: true, lastCheck: Date.now(), errors: 0 }
    };
    
    this.thresholds = {
      database: { maxErrors: 5, resetTime: 60000 }, // 1 minute
      memory: { maxHeapUsedPercent: 90 },
      api: { maxResponseTime: 5000 }
    };

    this.startPeriodicChecks();
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    // Check every 30 seconds
    setInterval(() => {
      this.checkMemoryHealth();
      this.resetErrorCounts();
    }, 30000);
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth(sequelize) {
    try {
      const start = Date.now();
      await sequelize.authenticate();
      const latency = Date.now() - start;

      this.checks.database.healthy = true;
      this.checks.database.lastCheck = Date.now();
      this.checks.database.latency = latency;
      
      return { healthy: true, latency };
    } catch (error) {
      this.checks.database.errors++;
      this.checks.database.lastCheck = Date.now();
      
      if (this.checks.database.errors >= this.thresholds.database.maxErrors) {
        this.checks.database.healthy = false;
        logger.error('❌ Database circuit breaker OPEN - too many errors');
      }
      
      logger.error('Database health check failed:', error.message);
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check memory health
   */
  checkMemoryHealth() {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    this.checks.memory.heapUsedPercent = heapUsedPercent;
    this.checks.memory.lastCheck = Date.now();

    if (heapUsedPercent > this.thresholds.memory.maxHeapUsedPercent) {
      this.checks.memory.healthy = false;
      logger.warn(`⚠️  High memory usage: ${heapUsedPercent.toFixed(2)}%`);
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('🗑️  Manual garbage collection triggered');
      }
    } else {
      this.checks.memory.healthy = true;
    }

    return {
      healthy: this.checks.memory.healthy,
      heapUsedPercent: heapUsedPercent.toFixed(2),
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
    };
  }

  /**
   * Record API request for health monitoring
   */
  recordApiRequest(duration) {
    this.checks.api.lastCheck = Date.now();
    
    if (duration > this.thresholds.api.maxResponseTime) {
      this.checks.api.errors++;
      logger.warn(`⚠️  Slow API response: ${duration}ms`);
    }
  }

  /**
   * Reset error counts after threshold time
   */
  resetErrorCounts() {
    const now = Date.now();
    
    Object.keys(this.checks).forEach(key => {
      const check = this.checks[key];
      const threshold = this.thresholds[key];
      
      if (threshold && threshold.resetTime) {
        if (now - check.lastCheck > threshold.resetTime) {
          check.errors = 0;
          check.healthy = true;
        }
      }
    });
  }

  /**
   * Get overall health status
   */
  getHealthStatus() {
    const overallHealthy = Object.values(this.checks).every(check => check.healthy);
    
    return {
      healthy: overallHealthy,
      timestamp: new Date().toISOString(),
      checks: this.checks
    };
  }

  /**
   * Check if database circuit is open
   */
  isDatabaseCircuitOpen() {
    return !this.checks.database.healthy;
  }
}

export default new HealthCheckService();
