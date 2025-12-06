/**
 * Cache Service
 * Simple in-memory cache with TTL support
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  /**
   * Set value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  set(key, value, ttl = 300) {
    this.cache.set(key, value);

    // Set expiration
    if (ttl > 0) {
      const expiresAt = Date.now() + (ttl * 1000);
      this.ttls.set(key, expiresAt);

      // Auto cleanup
      setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
    }

    return value;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    // Check if expired
    if (this.isExpired(key)) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    if (this.isExpired(key)) {
      this.delete(key);
      return false;
    }

    return this.cache.has(key);
  }

  /**
   * Delete key from cache
   */
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
    return true;
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.ttls.clear();
    return true;
  }

  /**
   * Check if key is expired
   */
  isExpired(key) {
    const expiresAt = this.ttls.get(key);
    if (!expiresAt) return false;
    return Date.now() > expiresAt;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory_estimate_bytes: 0
    };

    // Estimate memory usage
    for (const [key, value] of this.cache.entries()) {
      try {
        const valueStr = JSON.stringify(value);
        stats.memory_estimate_bytes += key.length + valueStr.length;
      } catch (error) {
        // Skip non-serializable values
      }
    }

    stats.memory_estimate_mb = (stats.memory_estimate_bytes / 1024 / 1024).toFixed(2);

    return stats;
  }

  /**
   * Wrapper for async functions with cache
   * @param {string} key - Cache key
   * @param {Function} fn - Async function to execute if cache miss
   * @param {number} ttl - TTL in seconds
   */
  async wrap(key, fn, ttl = 300) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Invalidate cache keys by pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    let cleaned = 0;

    for (const key of this.cache.keys()) {
      if (this.isExpired(key)) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Export singleton instance
const cacheService = new CacheService();

// Auto cleanup every 10 minutes
setInterval(() => {
  const cleaned = cacheService.cleanup();
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
  }
}, 10 * 60 * 1000);

export default cacheService;
