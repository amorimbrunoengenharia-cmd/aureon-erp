/**
 * Cache Middleware
 * Caches GET requests automatically
 */

import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 60)
 * @param {Function} keyGenerator - Optional custom key generator
 */
export const cacheMiddleware = (ttl = 60, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `${req.originalUrl || req.url}:${req.user?.id || 'anonymous'}`;

      // Check cache
      const cached = cacheService.get(cacheKey);

      if (cached !== null) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.json(cached);
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data) {
        // Cache successful responses (status 200-299)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl);
          logger.debug(`Cached: ${cacheKey} (TTL: ${ttl}s)`);
        }

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Don't break the request on cache errors
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = (pattern) => {
  return (req, res, next) => {
    try {
      const deleted = cacheService.invalidatePattern(pattern);
      logger.info(`Cache invalidated: ${deleted} keys matching pattern ${pattern}`);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
    }
    next();
  };
};

/**
 * Clear all cache
 */
export const clearCache = (req, res, next) => {
  try {
    cacheService.clear();
    logger.info('All cache cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
  next();
};
