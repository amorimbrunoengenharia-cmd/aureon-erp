# 🚀 Exemplo de Uso - Redis Cache

## Instalação Rápida

```bash
# Instalar Redis localmente (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar se está rodando
redis-cli ping
# Deve retornar: PONG

# Instalar cliente Node.js
cd aureon-backend
npm install ioredis --save
```

## Configurar .env

```env
# Redis Cache
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 1. Aplicar Cache ao Dashboard Financeiro

**`routes/financial.routes.js`:**

```javascript
import { cacheMiddleware, invalidateCacheAfter, cacheKeyGenerators } from '../middleware/cache.js';

// GET Dashboard - Cache de 5 minutos (300s)
router.get('/dashboard', 
  cacheMiddleware(300, cacheKeyGenerators.dateRange),  // ✅ Cache ativado
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const tenantId = req.user.tenant_id;

      const dashboard = await financialDashboardService.getDashboardData(
        tenantId,
        startDate,
        endDate
      );

      res.json(dashboard);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST Transaction - Invalida cache após criar
router.post('/transaction',
  invalidateCacheAfter(['financial', 'dashboard']),  // ✅ Invalida cache
  async (req, res) => {
    try {
      const transaction = await FinanceTransaction.create(req.body);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

## 2. Cache em Produtos

**`routes/product.routes.js`:**

```javascript
import { cacheMiddleware, invalidateCacheAfter } from '../middleware/cache.js';

// Lista de produtos - Cache 10 minutos
router.get('/',
  cacheMiddleware(600),  // 10 minutos
  async (req, res) => {
    const products = await Product.findAll({
      where: { tenant_id: req.user.tenant_id, active: true },
      attributes: ['id', 'nome', 'preco_venda', 'estoque_atual'],
      order: [['nome', 'ASC']]
    });
    res.json(products);
  }
);

// Criar produto - Invalida cache
router.post('/',
  invalidateCacheAfter('products'),
  async (req, res) => {
    const product = await Product.create({
      ...req.body,
      tenant_id: req.user.tenant_id
    });
    res.json(product);
  }
);

// Atualizar produto - Invalida cache
router.put('/:id',
  invalidateCacheAfter('products'),
  async (req, res) => {
    await Product.update(req.body, {
      where: { id: req.params.id, tenant_id: req.user.tenant_id }
    });
    res.json({ success: true });
  }
);
```

## 3. Cache Manual (Service Layer)

**`services/reportsService.js`:**

```javascript
import { getCache, setCache, invalidatePattern } from '../config/redis.js';

export async function getSalesReport(tenantId, startDate, endDate) {
  // Gerar chave única
  const cacheKey = `report:sales:${tenantId}:${startDate}:${endDate}`;
  
  // Tentar pegar do cache
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('✅ Report from cache');
    return cached;
  }

  // Gerar relatório (pesado)
  console.log('⏳ Generating report...');
  const report = await Sale.findAll({
    where: {
      tenant_id: tenantId,
      created_at: { [Op.between]: [startDate, endDate] }
    },
    include: [
      { model: Customer, as: 'customer' },
      { model: SaleItem, as: 'items' }
    ]
  });

  // Processar dados
  const processed = {
    total_sales: report.length,
    total_revenue: report.reduce((sum, s) => sum + s.valor_venda, 0),
    sales: report
  };

  // Cachear por 1 hora
  await setCache(cacheKey, processed, 3600);

  return processed;
}

// Invalidar quando venda for criada/atualizada
export async function invalidateSalesCache(tenantId) {
  await invalidatePattern(`report:sales:${tenantId}:*`);
}
```

## 4. Health Check com Cache Stats

**`routes/health.routes.js`:**

```javascript
import { getCacheStats } from '../config/redis.js';

router.get('/cache-stats', async (req, res) => {
  const stats = await getCacheStats();
  res.json(stats);
});

// Exemplo de resposta:
// {
//   "enabled": true,
//   "totalKeys": 127,
//   "info": "...redis stats..."
// }
```

## 5. Limpeza de Cache (Admin)

**`routes/admin.routes.js`:**

```javascript
import { invalidatePattern } from '../middleware/cache.js';

router.post('/cache/clear', async (req, res) => {
  const { pattern } = req.body;
  
  // Limpar cache específico
  await invalidatePattern(pattern || 'cache:*');
  
  res.json({ success: true, message: 'Cache cleared' });
});

// Exemplos de uso:
// POST /admin/cache/clear
// { "pattern": "cache:financial:*" }  // Limpa cache financeiro
// { "pattern": "cache:*:123:*" }      // Limpa cache do tenant 123
// { }                                 // Limpa TUDO
```

## 6. Testes de Performance

**`tests/cache.test.js`:**

```javascript
import { getCache, setCache, invalidatePattern } from '../config/redis.js';

describe('Cache Performance', () => {
  test('should cache and retrieve data', async () => {
    const data = { test: 'data', value: 123 };
    
    // Set cache
    await setCache('test-key', data, 60);
    
    // Get cache
    const cached = await getCache('test-key');
    
    expect(cached).toEqual(data);
  });

  test('should invalidate pattern', async () => {
    await setCache('cache:test:1', { id: 1 }, 60);
    await setCache('cache:test:2', { id: 2 }, 60);
    await setCache('cache:other:1', { id: 3 }, 60);
    
    // Invalidar apenas cache:test:*
    await invalidatePattern('cache:test:*');
    
    expect(await getCache('cache:test:1')).toBeNull();
    expect(await getCache('cache:test:2')).toBeNull();
    expect(await getCache('cache:other:1')).not.toBeNull();
  });
});
```

## 7. Monitorar Cache

```bash
# Ver estatísticas do Redis
redis-cli info stats

# Ver todas as chaves
redis-cli keys "cache:*"

# Ver valor de uma chave
redis-cli get "cache:/api/financial/dashboard:123"

# Limpar tudo
redis-cli flushall

# Monitorar em tempo real
redis-cli monitor
```

## 8. Cache Upstash (Cloud GRATUITO)

Se não quiser instalar Redis localmente:

1. Criar conta: https://upstash.com
2. Criar database Redis (10k requests/dia grátis)
3. Copiar credenciais

**`.env`:**

```env
REDIS_ENABLED=true
REDIS_HOST=seu-redis-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha-aqui
```

## Resultados Esperados

### Antes (Sem Cache)
```
GET /api/financial/dashboard
Response time: 847ms
Database queries: 12
```

### Depois (Com Cache)
```
GET /api/financial/dashboard (primeira vez)
Response time: 845ms
Database queries: 12
Cache: MISS

GET /api/financial/dashboard (segunda vez)
Response time: 23ms  ✅ 97% mais rápido!
Database queries: 0   ✅ 0 queries!
Cache: HIT
```

## Estratégia de Cache

| Endpoint | TTL | Invalidação |
|----------|-----|-------------|
| Dashboard Financeiro | 5min (300s) | Após criar transação |
| Lista de Produtos | 10min (600s) | Após criar/editar produto |
| Relatórios | 1h (3600s) | Após criar venda |
| Configurações | 30min (1800s) | Após alterar config |
| Catálogo Público | 1h (3600s) | Manual |

## Troubleshooting

### Cache não está funcionando

```bash
# Verificar se Redis está rodando
sudo systemctl status redis-server

# Testar conexão
redis-cli ping

# Ver logs
sudo tail -f /var/log/redis/redis-server.log

# Ver variável de ambiente
node -e "console.log(process.env.REDIS_ENABLED)"
```

### Memória do Redis crescendo muito

```bash
# Ver uso de memória
redis-cli info memory

# Configurar limite de memória (512MB)
redis-cli config set maxmemory 512mb
redis-cli config set maxmemory-policy allkeys-lru
```

### Ver cache hits vs misses

```javascript
// Adicionar contador no middleware/cache.js
let cacheStats = { hits: 0, misses: 0 };

export function getCacheMetrics() {
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    hitRate: (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2) + '%'
  };
}
```

---

**Meta de Cache Hit Rate:** > 80%

Se conseguir 80%+ de cache hits, você vai reduzir drasticamente a carga no banco! 🎉
