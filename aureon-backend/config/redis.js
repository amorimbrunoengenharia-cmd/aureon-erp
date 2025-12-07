import Redis from 'ioredis';

/**
 * Redis Client Configuration
 * 
 * Instalação: npm install ioredis --save
 * 
 * Redis gratuito:
 * - Local: sudo apt install redis-server
 * - Cloud: Upstash (10k requests/day grátis) - https://upstash.com
 */

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let redis = null;

if (REDIS_ENABLED) {
  redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  redis.on('connect', () => {
    console.log('🔗 Redis connecting...');
  });

  redis.on('ready', () => {
    console.log('✅ Redis connected and ready');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });
} else {
  console.log('ℹ️ Redis cache disabled');
}

/**
 * Get cached value
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  if (!redis) return null;
  
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cache value with TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - Time to live in seconds (default: 300)
 */
export async function setCache(key, value, ttl = 300) {
  if (!redis) return;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cache key(s)
 * @param {string|string[]} keys 
 */
export async function deleteCache(keys) {
  if (!redis) return;
  
  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length > 0) {
      await redis.del(...keysArray);
    }
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Ex: 'cache:financial:*'
 */
export async function invalidatePattern(pattern) {
  if (!redis) return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  if (!redis) return { enabled: false };
  
  try {
    const info = await redis.info('stats');
    const keys = await redis.dbsize();
    
    return {
      enabled: true,
      totalKeys: keys,
      info: info
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { enabled: true, error: error.message };
  }
}

export default redis;
