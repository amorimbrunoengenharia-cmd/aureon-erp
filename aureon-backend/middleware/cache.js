import { getCache, setCache, invalidatePattern } from '../config/redis.js';

/**
 * Cache middleware para endpoints
 * 
 * Uso:
 * router.get('/dashboard', cacheMiddleware(300), handler)
 * 
 * @param {number} duration - TTL em segundos (default: 300 = 5 min)
 * @param {function} keyGenerator - Função para gerar chave customizada
 */
export const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Ignorar cache se desabilitado ou método não é GET
    if (process.env.REDIS_ENABLED !== 'true' || req.method !== 'GET') {
      return next();
    }

    // Gerar chave do cache
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `cache:${req.originalUrl}:${req.user?.tenant_id || 'public'}`;

    try {
      // Tentar recuperar do cache
      const cached = await getCache(cacheKey);
      
      if (cached) {
        console.log('✅ Cache HIT:', cacheKey);
        return res.json(cached);
      }

      console.log('❌ Cache MISS:', cacheKey);
      
      // Interceptar res.json para cachear resposta
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Cachear apenas respostas de sucesso
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, duration).catch(err => {
            console.error('Error caching response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Middleware para invalidar cache após modificações
 * 
 * Uso:
 * router.post('/transaction', invalidateCacheAfter('financial'), handler)
 */
export const invalidateCacheAfter = (patterns) => {
  return async (req, res, next) => {
    // Interceptar res.json
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      // Invalidar cache se operação foi bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        
        for (const pattern of patternsArray) {
          const tenantId = req.user?.tenant_id;
          const cachePattern = tenantId 
            ? `cache:*${pattern}*:${tenantId}*`
            : `cache:*${pattern}*`;
            
          await invalidatePattern(cachePattern).catch(err => {
            console.error('Error invalidating cache:', err);
          });
        }
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Helper para invalidar cache manualmente
 */
export { invalidatePattern } from '../config/redis.js';

/**
 * Geradores de chave customizados
 */
export const cacheKeyGenerators = {
  /**
   * Cache por tenant + date range
   */
  dateRange: (req) => {
    const { startDate, endDate } = req.query;
    return `cache:${req.path}:${req.user?.tenant_id}:${startDate}:${endDate}`;
  },

  /**
   * Cache por tenant + filtros
   */
  filters: (req) => {
    const filters = JSON.stringify(req.query);
    return `cache:${req.path}:${req.user?.tenant_id}:${filters}`;
  },

  /**
   * Cache público (sem tenant)
   */
  public: (req) => {
    return `cache:public:${req.originalUrl}`;
  }
};
