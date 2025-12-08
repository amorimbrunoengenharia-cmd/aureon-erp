/**
 * Redis Cache Service
 * Camada de cache opcional - funciona com ou sem Redis
 */

import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.memoryCache = new Map(); // Fallback em memória
    this.ttlTimers = new Map(); // Timers para expiração em memória
  }

  /**
   * Inicializa conexão com Redis (opcional)
   */
  async initialize() {
    try {
      // Tentar importar redis dinamicamente
      const { createClient } = await import('redis');
      
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = createClient({ url: redisUrl });
      
      this.redis.on('error', (err) => {
        logger.warn('Redis Client Error (fallback to memory cache):', err.message);
        this.enabled = false;
      });

      this.redis.on('connect', () => {
        logger.info('✅ Redis cache connected');
        this.enabled = true;
      });

      await this.redis.connect();
    } catch (error) {
      logger.warn('⚠️  Redis not available, using memory cache fallback');
      this.enabled = false;
    }
  }

  /**
   * Buscar valor do cache
   */
  async get(key) {
    try {
      if (this.enabled && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
      
      // Fallback: memory cache
      return this.memoryCache.get(key) || null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Armazenar valor no cache
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      const serialized = JSON.stringify(value);
      
      if (this.enabled && this.redis) {
        await this.redis.setEx(key, ttlSeconds, serialized);
      } else {
        // Fallback: memory cache com TTL
        this.memoryCache.set(key, value);
        
        // Clear timer antigo se existir
        if (this.ttlTimers.has(key)) {
          clearTimeout(this.ttlTimers.get(key));
        }
        
        // Criar novo timer para expiração
        const timer = setTimeout(() => {
          this.memoryCache.delete(key);
          this.ttlTimers.delete(key);
        }, ttlSeconds * 1000);
        
        this.ttlTimers.set(key, timer);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Deletar do cache
   */
  async del(key) {
    try {
      if (this.enabled && this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
        if (this.ttlTimers.has(key)) {
          clearTimeout(this.ttlTimers.get(key));
          this.ttlTimers.delete(key);
        }
      }
      return true;
    } catch (error) {
      logger.error('Cache del error:', error);
      return false;
    }
  }

  /**
   * Deletar por padrão (ex: user:*)
   */
  async delPattern(pattern) {
    try {
      if (this.enabled && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } else {
        // Memory cache: deletar chaves que matcham o padrão
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            if (this.ttlTimers.has(key)) {
              clearTimeout(this.ttlTimers.get(key));
              this.ttlTimers.delete(key);
            }
          }
        }
      }
      return true;
    } catch (error) {
      logger.error('Cache delPattern error:', error);
      return false;
    }
  }

  /**
   * Limpar todo o cache
   */
  async flush() {
    try {
      if (this.enabled && this.redis) {
        await this.redis.flushDb();
      } else {
        this.memoryCache.clear();
        for (const timer of this.ttlTimers.values()) {
          clearTimeout(timer);
        }
        this.ttlTimers.clear();
      }
      logger.info('✅ Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Wrapper para cache-aside pattern
   */
  async getOrSet(key, fetchFn, ttlSeconds = 3600) {
    try {
      // Tentar buscar do cache
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug(`Cache HIT: ${key}`);
        return cached;
      }

      // Cache miss - buscar da fonte
      logger.debug(`Cache MISS: ${key}`);
      const value = await fetchFn();
      
      // Armazenar no cache
      await this.set(key, value, ttlSeconds);
      
      return value;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      // Se falhar, executar fetchFn diretamente
      return await fetchFn();
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  async getStats() {
    try {
      if (this.enabled && this.redis) {
        const info = await this.redis.info('stats');
        return {
          type: 'redis',
          enabled: true,
          info
        };
      }
      
      return {
        type: 'memory',
        enabled: true,
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys())
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        type: 'unknown',
        enabled: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect (graceful shutdown)
   */
  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('Redis cache disconnected');
      }
      
      // Limpar timers
      for (const timer of this.ttlTimers.values()) {
        clearTimeout(timer);
      }
      this.ttlTimers.clear();
    } catch (error) {
      logger.error('Cache disconnect error:', error);
    }
  }
}

// Singleton
const cacheService = new CacheService();

// Helpers para casos comuns

/**
 * Cache de usuário
 */
export const cacheUser = (userId, userData, ttl = 3600) => {
  return cacheService.set(`user:${userId}`, userData, ttl);
};

export const getCachedUser = (userId) => {
  return cacheService.get(`user:${userId}`);
};

export const invalidateUser = (userId) => {
  return cacheService.del(`user:${userId}`);
};

/**
 * Cache de produtos
 */
export const cacheProduct = (productId, productData, ttl = 1800) => {
  return cacheService.set(`product:${productId}`, productData, ttl);
};

export const getCachedProduct = (productId) => {
  return cacheService.get(`product:${productId}`);
};

export const invalidateProduct = (productId) => {
  return cacheService.del(`product:${productId}`);
};

/**
 * Cache de queries (para listas)
 */
export const cacheQuery = (queryKey, data, ttl = 300) => {
  return cacheService.set(`query:${queryKey}`, data, ttl);
};

export const getCachedQuery = (queryKey) => {
  return cacheService.get(`query:${queryKey}`);
};

export const invalidateQueryPattern = (pattern) => {
  return cacheService.delPattern(`query:${pattern}`);
};

export default cacheService;
