# 📊 API de Analytics - Documentação

## Visão Geral

A API de Analytics fornece endpoints para análise detalhada de vendas, permitindo gerar relatórios, dashboards e insights sobre o desempenho do negócio.

**Base URL:** `http://localhost:5000/api/analytics`

**Autenticação:** Todas as rotas requerem token JWT no header `Authorization: Bearer <token>`

---

## Endpoints

### 1. GET /analytics/sales

Retorna análise completa de vendas por período com estatísticas detalhadas.

**Query Parameters:**
- `startDate` (required): Data inicial no formato ISO 8601 (ex: `2024-01-01`)
- `endDate` (required): Data final no formato ISO 8601 (ex: `2024-12-31`)
- `channel` (optional): Filtro por canal de venda (`Loja Física`, `WhatsApp`, `Site`, `Telefone`)
- `vendedor_id` (optional): Filtro por ID do vendedor
- `produto_id` (optional): Filtro por ID do produto
- `cliente_id` (optional): Filtro por ID do cliente

**Exemplo de Requisição:**
```bash
GET /api/analytics/sales?startDate=2024-11-01&endDate=2024-11-30&channel=WhatsApp
```

**Exemplo de Resposta:**
```json
{
  "period": {
    "start": "2024-11-01T00:00:00.000Z",
    "end": "2024-11-30T23:59:59.999Z"
  },
  "summary": {
    "total_sales": 145,
    "total_revenue": 45320.50,
    "total_cost": 28450.30,
    "total_profit": 16870.20,
    "avg_ticket": 312.56,
    "avg_margin": 37.23
  },
  "daily_sales": [
    {
      "date": "2024-11-01",
      "count": 5,
      "revenue": 1520.00,
      "profit": 580.00
    }
  ],
  "by_channel": [
    {
      "channel": "WhatsApp",
      "count": 85,
      "revenue": 26500.00,
      "profit": 10200.00
    }
  ],
  "by_payment_method": [
    {
      "method": "Pix",
      "count": 90,
      "revenue": 28000.00
    }
  ]
}
```

---

### 2. GET /analytics/top-products

Retorna os produtos mais vendidos no período.

**Query Parameters:**
- `startDate` (required): Data inicial
- `endDate` (required): Data final
- `limit` (optional, default: 10): Quantidade de produtos a retornar

**Exemplo de Requisição:**
```bash
GET /api/analytics/top-products?startDate=2024-11-01&endDate=2024-11-30&limit=5
```

**Exemplo de Resposta:**
```json
[
  {
    "produto_id": "uuid-123",
    "produto": "Paracetamol 500mg",
    "categoria": "Medicamentos",
    "tipo": "Genérico",
    "sales_count": 35,
    "total_quantity": 350,
    "total_revenue": 3500.00,
    "total_profit": 1200.00,
    "current_stock": 500
  }
]
```

---

### 3. GET /analytics/top-clients

Retorna os clientes que mais compraram no período.

**Query Parameters:**
- `startDate` (required): Data inicial
- `endDate` (required): Data final
- `limit` (optional, default: 10): Quantidade de clientes a retornar

**Exemplo de Requisição:**
```bash
GET /api/analytics/top-clients?startDate=2024-11-01&endDate=2024-11-30&limit=10
```

**Exemplo de Resposta:**
```json
[
  {
    "cliente_id": "uuid-456",
    "cliente": "João Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com",
    "telefone": "(11) 98765-4321",
    "purchase_count": 12,
    "total_spent": 4500.00,
    "avg_ticket": 375.00
  }
]
```

---

### 4. GET /analytics/salesman-performance

Retorna a performance de todos os vendedores no período.

**Query Parameters:**
- `startDate` (required): Data inicial
- `endDate` (required): Data final

**Exemplo de Requisição:**
```bash
GET /api/analytics/salesman-performance?startDate=2024-11-01&endDate=2024-11-30
```

**Exemplo de Resposta:**
```json
[
  {
    "vendedor_id": "uuid-789",
    "vendedor": "Maria Santos",
    "email": "maria@aureon.com",
    "role": "VENDAS",
    "sales_count": 75,
    "total_revenue": 23500.00,
    "total_profit": 8900.00,
    "avg_ticket": 313.33
  }
]
```

---

### 5. GET /analytics/categories

Retorna análise de vendas por categoria de produtos.

**Query Parameters:**
- `startDate` (required): Data inicial
- `endDate` (required): Data final

**Exemplo de Requisição:**
```bash
GET /api/analytics/categories?startDate=2024-11-01&endDate=2024-11-30
```

**Exemplo de Resposta:**
```json
[
  {
    "categoria": "Medicamentos",
    "sales_count": 95,
    "total_quantity": 850,
    "total_revenue": 28500.00,
    "total_profit": 10200.00,
    "avg_margin": 35.79
  },
  {
    "categoria": "Cosméticos",
    "sales_count": 50,
    "total_quantity": 120,
    "total_revenue": 16820.50,
    "total_profit": 6670.20,
    "avg_margin": 39.65
  }
]
```

---

### 6. GET /analytics/period-comparison

Compara dois períodos distintos (útil para comparar mês atual vs mês anterior).

**Query Parameters:**
- `currentStart` (required): Data inicial do período atual
- `currentEnd` (required): Data final do período atual
- `previousStart` (required): Data inicial do período anterior
- `previousEnd` (required): Data final do período anterior

**Exemplo de Requisição:**
```bash
GET /api/analytics/period-comparison?
  currentStart=2024-11-01&currentEnd=2024-11-30&
  previousStart=2024-10-01&previousEnd=2024-10-31
```

**Exemplo de Resposta:**
```json
{
  "current": {
    "total_sales": 145,
    "total_revenue": 45320.50,
    "total_profit": 16870.20,
    "avg_ticket": 312.56
  },
  "previous": {
    "total_sales": 130,
    "total_revenue": 38500.00,
    "total_profit": 14200.00,
    "avg_ticket": 296.15
  },
  "growth": {
    "revenue": 17.72,
    "profit": 18.81,
    "sales": 11.54,
    "avg_ticket": 5.54
  }
}
```

---

### 7. GET /analytics/dashboard

Retorna um dashboard completo com todas as análises em uma única requisição.

**Query Parameters:**
- `startDate` (required): Data inicial
- `endDate` (required): Data final
- `channel` (optional): Filtro por canal
- `vendedor_id` (optional): Filtro por vendedor

**Exemplo de Requisição:**
```bash
GET /api/analytics/dashboard?startDate=2024-11-01&endDate=2024-11-30
```

**Exemplo de Resposta:**
```json
{
  "period": {
    "start": "2024-11-01T00:00:00.000Z",
    "end": "2024-11-30T23:59:59.999Z"
  },
  "summary": {
    "total_sales": 145,
    "total_revenue": 45320.50,
    "total_cost": 28450.30,
    "total_profit": 16870.20,
    "avg_ticket": 312.56,
    "avg_margin": 37.23
  },
  "charts": {
    "daily_sales": [...],
    "by_channel": [...],
    "by_payment_method": [...],
    "by_category": [...]
  },
  "rankings": {
    "top_products": [...],
    "top_clients": [...],
    "salesman_performance": [...]
  }
}
```

**Benefícios:**
- Uma única chamada retorna todos os dados necessários para um dashboard
- Otimizado com `Promise.all` para execução paralela
- Reduz latência de rede
- Ideal para carregamento inicial da página

---

### 8. GET /analytics/export

Exporta dados de análise em formato JSON para download.

**Query Parameters:**
- `startDate` (required): Data inicial
- `endDate` (required): Data final
- `type` (optional, default: 'sales'): Tipo de exportação
  - `sales`: Análise completa de vendas
  - `products`: Lista de top produtos
  - `clients`: Lista de top clientes
  - `dashboard`: Dashboard completo

**Exemplo de Requisição:**
```bash
GET /api/analytics/export?startDate=2024-11-01&endDate=2024-11-30&type=dashboard
```

**Headers de Resposta:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="dashboard_2024-11-01_2024-11-30.json"
```

**Uso no Frontend:**
```javascript
const data = await ApiService.exportAnalytics('2024-11-01', '2024-11-30', 'dashboard');

// Criar download
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `dashboard_${startDate}_${endDate}.json`;
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(url);
document.body.removeChild(a);
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Bad Request - Parâmetros inválidos ou faltando |
| 401 | Unauthorized - Token JWT inválido ou expirado |
| 500 | Internal Server Error - Erro no servidor |

---

## Exemplos de Uso

### JavaScript/React

```javascript
import ApiService from './services/ApiService';

// Obter dashboard
const dashboard = await ApiService.getAnalyticsDashboard(
  '2024-11-01',
  '2024-11-30',
  { channel: 'WhatsApp' }
);

// Top produtos
const topProducts = await ApiService.getTopProducts(
  '2024-11-01',
  '2024-11-30',
  5
);

// Comparar períodos
const comparison = await ApiService.getPeriodComparison(
  '2024-11-01', '2024-11-30',  // Período atual
  '2024-10-01', '2024-10-31'   // Período anterior
);
```

### PowerShell

```powershell
# Obter token JWT
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Body (@{username="admin"; password="senha123"} | ConvertTo-Json) `
  -ContentType "application/json"

$token = $loginResponse.token

# Buscar analytics
$headers = @{
  Authorization = "Bearer $token"
}

$analytics = Invoke-RestMethod -Uri "http://localhost:5000/api/analytics/dashboard?startDate=2024-11-01&endDate=2024-11-30" `
  -Method GET `
  -Headers $headers

$analytics | ConvertTo-Json -Depth 10
```

### cURL

```bash
# Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}' \
  | jq -r '.token')

# Buscar analytics
curl -X GET "http://localhost:5000/api/analytics/dashboard?startDate=2024-11-01&endDate=2024-11-30" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

---

## Otimizações

### Indexação de Banco

As queries de analytics são otimizadas com os seguintes índices:

```sql
-- Sales
CREATE INDEX sales_data_venda ON sales(data_venda);
CREATE INDEX sales_canal ON sales(canal_venda);
CREATE INDEX sales_vendedor_id ON sales(vendedor_id);
CREATE INDEX sales_cliente_id ON sales(cliente_id);
CREATE INDEX sales_produto_id ON sales(produto_id);

-- Products
CREATE INDEX products_categoria ON products(categoria);
CREATE INDEX products_tipo ON products(tipo);
```

### Performance

- **Dashboard completo**: ~200-500ms para 1000 vendas
- **Top produtos**: ~50-100ms
- **Comparação de períodos**: ~400-800ms (2 queries paralelas)

---

## Limitações

1. **Período máximo**: Recomendado até 1 ano por requisição
2. **Limite de registros**: Top produtos/clientes limitado a 100
3. **Rate limiting**: 100 requisições por minuto por usuário
4. **Timeout**: 30 segundos por requisição

---

## Roadmap

### Próximas Features

- [ ] Exportação em CSV e Excel
- [ ] Gráficos de tendência (moving averages)
- [ ] Previsão de vendas (ML)
- [ ] Análise de sazonalidade
- [ ] Comparação com meta
- [ ] Drill-down interativo
- [ ] Alertas automáticos de performance
- [ ] Dashboard em PDF

---

## Suporte

Para reportar bugs ou solicitar features:
- GitHub Issues: [projeto/issues](https://github.com/seu-projeto/issues)
- Email: suporte@aureon.com

**Última atualização:** 05/12/2024
