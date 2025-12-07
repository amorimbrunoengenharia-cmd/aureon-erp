# ⚡ AUREON ERP - Performance Optimization Guide

Guia completo de otimizações de performance (todas gratuitas).

## 📊 Status Atual

✅ **Já implementado:**
- Sentry error tracking (5k events/mês grátis)
- Swagger documentation
- CI/CD com GitHub Actions
- Developer onboarding guide

🎯 **Este guia cobre:**
- Database optimization
- Caching strategies  
- Query optimization
- Frontend performance
- Monitoring gratuito

---

## 🗄️ Database Optimization

### 1. Índices PostgreSQL (Produção)

```sql
-- Performance crítica
CREATE INDEX CONCURRENTLY idx_sales_tenant_data 
ON sales(tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_sales_status 
ON sales(status) WHERE status != 'cancelled';

CREATE INDEX CONCURRENTLY idx_finance_data 
ON finance_transactions(data DESC);

CREATE INDEX CONCURRENTLY idx_products_tenant 
ON products(tenant_id) WHERE active = true;

CREATE INDEX CONCURRENTLY idx_customers_tenant 
ON customers(tenant_id);

-- Índice para busca de texto
CREATE INDEX CONCURRENTLY idx_products_search 
ON products USING gin(to_tsvector('portuguese', nome || ' ' || COALESCE(descricao, '')));
```

**Aplicar:**
```bash
psql -U aureon -d aureon_erp -f scripts/add-indexes.sql
```

### 2. Analyze & Vacuum

```bash
# Adicionar ao cron (diário às 3h)
crontab -e

# Adicionar:
0 3 * * * psql -U aureon -d aureon_erp -c "VACUUM ANALYZE;"
```

### 3. Connection Pooling (já configurado)

```javascript
// config/database.js
pool: {
  max: 20,      // Máximo de conexões
  min: 5,       // Mínimo ativo
  acquire: 30000,
  idle: 10000
}
```

---

## 💾 Redis Cache (GRATUITO)

### Instalação

```bash
# Ubuntu/Debian
sudo apt install redis-server

# Configurar para iniciar automaticamente
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Integração Backend

```bash
cd aureon-backend
npm install ioredis --save
```

**Criar `config/redis.js`:**

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

export default redis;
```

**Adicionar ao `.env`:**

```env
# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_ENABLED=true
REDIS_TTL=300  # 5 minutos default
```

### Cache Middleware

**Criar `middleware/cache.js`:**

```javascript
import redis from '../config/redis.js';

/**
 * Cache middleware para endpoints
 * Uso: app.get('/endpoint', cacheMiddleware(300), handler)
 */
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (process.env.REDIS_ENABLED !== 'true') {
      return next();
    }

    const key = `cache:${req.originalUrl}:${req.user?.tenant_id}`;

    try {
      const cached = await redis.get(key);
      
      if (cached) {
        console.log('✅ Cache HIT:', key);
        return res.json(JSON.parse(cached));
      }

      console.log('❌ Cache MISS:', key);
      
      // Sobrescrever res.json para cachear resposta
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data)).catch(console.error);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

/**
 * Invalidar cache por padrão
 */
export const invalidateCache = async (pattern) => {
  if (process.env.REDIS_ENABLED !== 'true') return;

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`🗑️ Invalidated ${keys.length} cache keys`);
  }
};
```

### Aplicar Cache aos Endpoints

**`routes/financial.routes.js`:**

```javascript
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';

// GET com cache de 5 minutos
router.get('/dashboard', cacheMiddleware(300), async (req, res) => {
  // ... código existente
});

// POST invalida cache
router.post('/transaction', async (req, res) => {
  // ... criar transação
  await invalidateCache('cache:/api/financial/*');
  res.json(result);
});
```

**Benefício:** Reduz carga no banco em 70-90% para dashboards.

---

## 🚀 Query Optimization

### 1. Limitar Campos (SELECT)

```javascript
// ❌ ANTES - Busca tudo
const products = await Product.findAll({ where });

// ✅ DEPOIS - Apenas campos necessários
const products = await Product.findAll({
  where,
  attributes: ['id', 'nome', 'preco_venda', 'estoque_atual']
});
```

### 2. Paginação Obrigatória

```javascript
// ❌ ANTES - Sem limite
const sales = await Sale.findAll({ where });

// ✅ DEPOIS - Com paginação
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const offset = (parseInt(req.query.page) || 0) * limit;

const { rows, count } = await Sale.findAndCountAll({
  where,
  limit,
  offset,
  order: [['created_at', 'DESC']]
});

res.json({
  data: rows,
  pagination: {
    total: count,
    page: Math.floor(offset / limit),
    limit,
    pages: Math.ceil(count / limit)
  }
});
```

### 3. Eager Loading Otimizado

```javascript
// ❌ ANTES - N+1 queries
const sales = await Sale.findAll();
for (const sale of sales) {
  sale.customer = await Customer.findByPk(sale.customer_id);
}

// ✅ DEPOIS - 1 query apenas
const sales = await Sale.findAll({
  include: [
    {
      model: Customer,
      as: 'customer',
      attributes: ['id', 'nome', 'email']  // Apenas campos necessários
    }
  ]
});
```

---

## 🎨 Frontend Performance

### 1. React.memo & useMemo

**`components/ProductList.jsx`:**

```javascript
import { memo, useMemo } from 'react';

// Memoizar componente
const ProductCard = memo(({ product }) => {
  return (
    <div className="card">
      <h3>{product.nome}</h3>
      <p>{product.preco_venda}</p>
    </div>
  );
});

// Memoizar cálculos pesados
const ProductList = ({ products, filters }) => {
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.nome.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [products, filters.search]);

  return filteredProducts.map(p => <ProductCard key={p.id} product={p} />);
};
```

### 2. Lazy Loading de Rotas

**`App.jsx`:**

```javascript
import { lazy, Suspense } from 'react';

// Lazy load páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Financial = lazy(() => import('./pages/Financial'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/financial" element={<Financial />} />
      </Routes>
    </Suspense>
  );
}
```

### 3. Debounce em Buscas

**`hooks/useDebounce.js`:**

```javascript
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**Uso:**

```javascript
function SearchBar() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch) {
      fetchProducts(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={search} onChange={e => setSearch(e.target.value)} />;
}
```

### 4. Virtual Scrolling (Listas Grandes)

```bash
npm install react-window --save
```

**`components/VirtualList.jsx`:**

```javascript
import { FixedSizeList } from 'react-window';

function ProductList({ products }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {products[index].nome}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={products.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## 📊 Monitoring Gratuito

### 1. Uptime Robot (GRATUITO)

**Setup:**
1. Criar conta: https://uptimerobot.com
2. Adicionar monitor HTTP:
   - URL: `https://api.seudominio.com/health`
   - Intervalo: 5 minutos
   - Alertas: Email/Telegram
3. Adicionar monitor para frontend

**Benefício:** Alertas automáticos se API cair.

### 2. Google Lighthouse (Built-in Chrome)

```bash
# Rodar localmente
npm install -g lighthouse

lighthouse http://localhost:5173 --view
```

**Métricas importantes:**
- Performance > 90
- Best Practices > 95
- SEO > 90

### 3. PostgreSQL Slow Query Log

**`postgresql.conf`:**

```conf
log_min_duration_statement = 1000  # Log queries > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'all'
```

**Ver queries lentas:**

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log | grep "duration:"
```

---

## 🔧 Backend Improvements

### 1. Compression Middleware

```bash
npm install compression --save
```

**`server.js`:**

```javascript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6  // Balanço entre compressão e CPU
}));
```

**Benefício:** Reduz tamanho de respostas em 70-80%.

### 2. Request Rate Limiting

```bash
npm install express-rate-limit --save
```

**`middleware/rateLimiter.js`:**

```javascript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,  // Máximo 100 requests
  message: 'Muitas requisições, tente novamente em 15 minutos',
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Máximo 5 tentativas de login
  message: 'Muitas tentativas de login, tente novamente em 15 minutos'
});
```

**Aplicar:**

```javascript
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

### 3. Helmet Security Headers

```bash
npm install helmet --save
```

**`server.js`:**

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 📈 Performance Checklist

### Backend
- [ ] Redis cache implementado
- [ ] Índices PostgreSQL criados
- [ ] Paginação em todos os endpoints
- [ ] Query optimization (SELECT específico)
- [ ] Compression habilitado
- [ ] Rate limiting configurado
- [ ] Helmet security headers
- [ ] Logs de slow queries ativos

### Frontend
- [ ] React.memo em componentes pesados
- [ ] useMemo para cálculos complexos
- [ ] Lazy loading de rotas
- [ ] Debounce em buscas
- [ ] Virtual scrolling para listas grandes
- [ ] Lighthouse score > 90

### Database
- [ ] Índices criados
- [ ] VACUUM ANALYZE agendado
- [ ] Connection pool configurado
- [ ] Slow query log ativo

### Monitoring
- [ ] Sentry configurado
- [ ] Uptime Robot monitorando
- [ ] PM2 monitoramento ativo
- [ ] Logs centralizados

---

## 🎯 Resultados Esperados

Com todas otimizações implementadas:

- **API Response Time:** < 100ms (p95)
- **Dashboard Load:** < 2s
- **Database Queries:** < 50ms média
- **Cache Hit Rate:** > 80%
- **Lighthouse Performance:** > 90
- **Concurrent Users:** 100+ simultâneos

---

## 📞 Próximos Passos

1. **Implementar Redis** (maior impacto)
2. **Criar índices PostgreSQL**
3. **Aplicar caching aos endpoints**
4. **Otimizar queries (SELECT + paginação)**
5. **Frontend lazy loading**
6. **Configurar Uptime Robot**
7. **Monitorar e ajustar**

---

**Todas estas otimizações são GRATUITAS!** 🎉

**Última atualização:** 2025-12-06
