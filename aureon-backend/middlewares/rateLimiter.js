import rateLimit from 'express-rate-limit';

// Mais permissivo em desenvolvimento
const isDevelopment = process.env.NODE_ENV !== 'production';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // 1000 em dev
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.ip === '::1' // Skip localhost em dev
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // 100 tentativas em dev, 5 em prod
  message: {
    error: 'Too many login attempts, please try again after 15 minutes'
  },
  skipSuccessfulRequests: true,
  skip: (req) => isDevelopment && req.ip === '::1' // Skip localhost em dev
});

/**
 * Rate limiter por tenant com limites personalizados
 * Baseado no tenant_id do usuário autenticado
 */
export const tenantRateLimiter = (options = {}) => {
  // Mapa de limites por plano (pode vir de configuração ou DB)
  const planLimits = {
    free: { windowMs: 60 * 60 * 1000, max: 100 },      // 100 req/hour
    basic: { windowMs: 60 * 60 * 1000, max: 500 },     // 500 req/hour
    professional: { windowMs: 60 * 60 * 1000, max: 2000 }, // 2000 req/hour
    enterprise: { windowMs: 60 * 60 * 1000, max: 10000 },  // 10000 req/hour
    ...options.planLimits
  };

  // Store para rastrear requests por tenant
  const tenantStore = new Map();

  return (req, res, next) => {
    // Se não autenticado, usar rate limiter geral
    if (!req.user || !req.user.tenant_id) {
      return rateLimiter(req, res, next);
    }

    const tenantId = req.user.tenant_id;
    const tenantPlan = req.user.tenant_plan || 'free';
    const limits = planLimits[tenantPlan] || planLimits.free;

    // Obter ou criar contador para o tenant
    if (!tenantStore.has(tenantId)) {
      tenantStore.set(tenantId, {
        count: 0,
        resetTime: Date.now() + limits.windowMs
      });
    }

    const tenantData = tenantStore.get(tenantId);

    // Reset se janela expirou
    if (Date.now() > tenantData.resetTime) {
      tenantData.count = 0;
      tenantData.resetTime = Date.now() + limits.windowMs;
    }

    // Incrementar contador
    tenantData.count++;

    // Headers informativos
    res.setHeader('X-RateLimit-Limit', limits.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limits.max - tenantData.count));
    res.setHeader('X-RateLimit-Reset', new Date(tenantData.resetTime).toISOString());
    res.setHeader('X-RateLimit-Plan', tenantPlan);

    // Verificar se excedeu limite
    if (tenantData.count > limits.max) {
      return res.status(429).json({
        error: 'Rate limit exceeded for your plan',
        plan: tenantPlan,
        limit: limits.max,
        windowMs: limits.windowMs,
        retryAfter: Math.ceil((tenantData.resetTime - Date.now()) / 1000),
        message: `Your ${tenantPlan} plan allows ${limits.max} requests per hour. Upgrade for higher limits.`
      });
    }

    next();
  };
};

/**
 * Cleanup periódico do store de tenants
 * Chamado em intervalo para evitar memory leak
 */
export const cleanupTenantStore = (tenantStore) => {
  const now = Date.now();
  for (const [tenantId, data] of tenantStore.entries()) {
    if (now > data.resetTime + 3600000) { // 1 hora após reset
      tenantStore.delete(tenantId);
    }
  }
};
