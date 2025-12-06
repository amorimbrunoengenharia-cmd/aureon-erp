# AUREON ERP - API Documentation

## Visão Geral

API RESTful completa para o sistema AUREON ERP (Optical Business Management).

**Base URL**: `http://localhost:5000/api`

**Autenticação**: Todas as rotas (exceto `/auth/login` e `/auth/register`) requerem JWT token no header:
```
Authorization: Bearer <token>
```

---

## 📋 Índice

1. [Autenticação](#autenticação)
2. [Produtos](#produtos)
3. [Clientes](#clientes)
4. [Fornecedores](#fornecedores)
5. [Vendas](#vendas)
6. [Receitas Médicas](#receitas-médicas)
7. [Finanças](#finanças)
8. [Inventário](#inventário)

---

## 🔐 Autenticação

### POST /api/auth/login
Login de usuário

**Body:**
```json
{
  "username": "ceo",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "ceo",
    "role": "CEO",
    "email": "ceo@aureon.com"
  }
}
```

### POST /api/auth/register
Criar novo usuário (requer autenticação)

**Body:**
```json
{
  "username": "novo_usuario",
  "password": "senha123",
  "email": "usuario@example.com",
  "role": "VENDAS"
}
```

---

## 📦 Produtos

### GET /api/products
Listar produtos com paginação e filtros

**Query Params:**
- `page` (default: 1)
- `limit` (default: 50)
- `active` (true/false)
- `tipo` (armacao, lente, acessorio, etc)
- `categoria`
- `fornecedor_id` (UUID)
- `search` (busca no nome do produto)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "produto": "Armação Ray-Ban Aviador",
      "tipo": "armacao",
      "preco_venda": 450.00,
      "quantidade_estoque": 15,
      "supplier": {
        "id": "uuid",
        "nome": "Luxottica"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 3,
    "limit": 50
  }
}
```

### GET /api/products/:id
Obter produto por ID

### POST /api/products
Criar produto (requer CEO ou ESTOQUE)

**Body:**
```json
{
  "produto": "Lente Transitions Gen8",
  "tipo": "lente",
  "categoria": "fotossensiveis",
  "preco_venda": 320.00,
  "preco_custo": 180.00,
  "quantidade_estoque": 50,
  "estoque_minimo": 10,
  "fornecedor_id": "uuid"
}
```

### PUT /api/products/:id
Atualizar produto (requer CEO ou ESTOQUE)

### DELETE /api/products/:id
Deletar produto (soft delete, requer CEO ou ESTOQUE)

### PATCH /api/products/:id/stock
Atualizar estoque de produto (requer CEO ou ESTOQUE)

**Body:**
```json
{
  "quantidade": 20
}
```

---

## 👥 Clientes

### GET /api/clients
Listar clientes

**Query Params:**
- `page`, `limit`
- `active` (true/false)
- `categoria` (vip, gold, regular, novo)
- `origem` (indicacao, google, instagram, facebook, marketplace)
- `search` (busca no nome)

### GET /api/clients/:id
Obter cliente com vendas e receitas médicas

### POST /api/clients
Criar cliente

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "(11) 98888-8888",
  "whatsapp": "(11) 98888-8888",
  "cpf_cnpj": "123.456.789-00",
  "data_nascimento": "1990-05-15",
  "categoria": "regular",
  "origem": "instagram",
  "endereco": {
    "rua": "Av. Paulista",
    "numero": "1000",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}
```

### PUT /api/clients/:id
Atualizar cliente

### DELETE /api/clients/:id
Deletar cliente (soft delete, requer CEO)

---

## 🏭 Fornecedores

### GET /api/suppliers
Listar fornecedores

**Query Params:**
- `page`, `limit`
- `active` (true/false)
- `categoria`

### GET /api/suppliers/:id
Obter fornecedor com produtos

### POST /api/suppliers
Criar fornecedor (requer CEO ou COMPRAS)

**Body:**
```json
{
  "nome": "Essilor do Brasil",
  "razao_social": "Essilor Produtos Ópticos Ltda",
  "cnpj": "12.345.678/0001-90",
  "email": "vendas@essilor.com.br",
  "telefone": "(11) 3000-0000",
  "categoria": "lentes",
  "prazo_entrega_dias": 7,
  "valor_minimo_pedido": 500.00,
  "condicoes_pagamento": "30/60/90 dias",
  "endereco": {
    "rua": "Av. Industrial",
    "cidade": "São Paulo",
    "estado": "SP"
  }
}
```

### PUT /api/suppliers/:id
Atualizar fornecedor (requer CEO ou COMPRAS)

### DELETE /api/suppliers/:id
Deletar fornecedor (soft delete, requer CEO)

---

## 💰 Vendas

### GET /api/sales
Listar vendas

**Query Params:**
- `page`, `limit`
- `canal` (whatsapp, mercado-livre, amazon, shopee, loja-fisica)
- `status` (pendente, confirmado, pago, enviado, entregue, cancelado)
- `data_inicio`, `data_fim` (formato ISO 8601)
- `cliente_id` (UUID)

### GET /api/sales/:id
Obter venda com produto, cliente, receita e vendedor

### POST /api/sales
Criar venda

**Body:**
```json
{
  "produto": "Óculos Completo Ray-Ban + Lentes Transitions",
  "produto_id": "uuid",
  "cliente_id": "uuid",
  "prescription_id": "uuid",
  "valor_venda": 850.00,
  "valor_custo": 520.00,
  "lucro": 330.00,
  "margem": 38.82,
  "quantidade": 1,
  "canal": "whatsapp",
  "status": "confirmado",
  "data_venda": "2025-12-05",
  "forma_pagamento": "pix",
  "parcelas": 1
}
```

**Features:**
- Atualiza automaticamente o estoque do produto
- Atualiza estatísticas do cliente (total_compras, total_pedidos, ultima_compra)

### PUT /api/sales/:id
Atualizar venda

### GET /api/sales/stats/summary
Estatísticas de vendas

**Query Params:**
- `data_inicio`, `data_fim`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_vendas": 45600.00,
    "total_lucro": 15800.00,
    "margem_media": 34.65,
    "quantidade_vendas": 68,
    "ticket_medio": 670.59
  }
}
```

---

## 📝 Receitas Médicas

### GET /api/prescriptions
Listar receitas médicas

**Query Params:**
- `page`, `limit`
- `status` (ativa, expirada, cancelada)
- `cliente_id` (UUID)

### GET /api/prescriptions/:id
Obter receita com cliente e responsáveis

### POST /api/prescriptions
Criar receita médica

**Body:**
```json
{
  "cliente_id": "uuid",
  "cliente_nome": "João Silva",
  "medico_nome": "Dr. Pedro Oliveira",
  "medico_crm": "CRM/SP 123456",
  "data_emissao": "2025-12-05",
  "data_validade": "2026-06-05",
  "tipo_lente": "multifocal",
  "olho_direito": {
    "esferico": -2.50,
    "cilindrico": -1.00,
    "eixo": 180,
    "adicao": 2.00,
    "dnp": 32
  },
  "olho_esquerdo": {
    "esferico": -2.75,
    "cilindrico": -0.75,
    "eixo": 10,
    "adicao": 2.00,
    "dnp": 31
  },
  "observacoes": "Cliente prefere lentes antirreflexo",
  "lgpd_consentimento": true
}
```

**Validações:**
- LGPD consent obrigatório
- CRM do médico obrigatório
- data_validade calculada automaticamente (180 dias se não fornecida)

### PUT /api/prescriptions/:id
Atualizar receita

### POST /api/prescriptions/:id/attach/:orderId
Associar receita a um pedido

### GET /api/prescriptions/check-expired
Verificar e marcar receitas expiradas (útil para cron job)

---

## 💵 Finanças

### GET /api/finance/transactions
Listar transações financeiras

**Query Params:**
- `page`, `limit`
- `tipo` (receita, despesa, transferencia)
- `categoria` (venda, fornecedor, salario, aluguel, etc)
- `status` (pendente, pago, recebido, cancelado)
- `data_inicio`, `data_fim`

### GET /api/finance/transactions/:id
Obter transação com relações

### POST /api/finance/transactions
Criar transação (requer CEO ou FINANCEIRO)

**Body:**
```json
{
  "tipo": "receita",
  "categoria": "venda",
  "descricao": "Venda Óculos Completo - Cliente João Silva",
  "valor": 850.00,
  "data": "2025-12-05",
  "status": "recebido",
  "forma_pagamento": "pix",
  "sale_id": "uuid",
  "cliente_id": "uuid"
}
```

### PUT /api/finance/transactions/:id
Atualizar transação (requer CEO ou FINANCEIRO)

### PATCH /api/finance/transactions/:id/status
Atualizar status da transação (requer CEO ou FINANCEIRO)

**Body:**
```json
{
  "status": "pago"
}
```

### GET /api/finance/dashboard
Dashboard financeiro

**Query Params:**
- `data_inicio`, `data_fim`

**Response:**
```json
{
  "success": true,
  "data": {
    "receitas": 85600.00,
    "despesas": 42300.00,
    "saldo": 43300.00,
    "pendentes": 12800.00,
    "total_transacoes": 145
  }
}
```

---

## 📊 Inventário

### GET /api/inventory/movements
Listar movimentações de estoque

**Query Params:**
- `page`, `limit`
- `tipo` (entrada, saida, ajuste, devolucao, perda)
- `produto_id` (UUID)
- `data_inicio`, `data_fim`

### POST /api/inventory/movements
Criar movimentação manual (requer CEO ou ESTOQUE)

**Body:**
```json
{
  "produto_id": "uuid",
  "tipo": "entrada",
  "quantidade": 50,
  "motivo": "Compra fornecedor Essilor - NF 12345",
  "observacoes": "Lote #2025-12-A"
}
```

**Tipos de movimentação:**
- `entrada`: Adiciona ao estoque
- `saida`: Remove do estoque
- `ajuste`: Define quantidade exata
- `devolucao`: Adiciona ao estoque
- `perda`: Remove do estoque

### GET /api/inventory/low-stock
Produtos com estoque baixo (quantidade <= estoque_minimo)

### GET /api/inventory/report
Relatório de valorização de estoque

**Response:**
```json
{
  "success": true,
  "data": {
    "total_produtos": 245,
    "total_unidades": 3456,
    "valor_total_estoque": 145600.00,
    "produtos_baixo_estoque": 12
  }
}
```

---

## 🔒 Controle de Acesso (RBAC)

### Roles disponíveis:
- **CEO**: Acesso total
- **VENDAS**: Criar/editar vendas, clientes, receitas
- **ESTOQUE**: Gerenciar produtos e estoque
- **COMPRAS**: Gerenciar fornecedores e compras
- **FINANCEIRO**: Gerenciar transações financeiras

### Estrutura de permissões:

| Recurso | GET | POST | PUT | DELETE |
|---------|-----|------|-----|--------|
| Products | All | CEO, ESTOQUE | CEO, ESTOQUE | CEO, ESTOQUE |
| Clients | All | All | All | CEO |
| Suppliers | All | CEO, COMPRAS | CEO, COMPRAS | CEO |
| Sales | All | All | All | CEO |
| Prescriptions | All | CEO, VENDAS | CEO, VENDAS | CEO |
| Finance | All | CEO, FINANCEIRO | CEO, FINANCEIRO | CEO |
| Inventory | All | CEO, ESTOQUE | CEO, ESTOQUE | CEO |

---

## 📄 Modelos de Dados

### User
```javascript
{
  id: UUID,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: ENUM ['CEO', 'VENDAS', 'ESTOQUE', 'COMPRAS', 'FINANCEIRO'],
  active: Boolean,
  settings: JSONB,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Product
```javascript
{
  id: UUID,
  produto: String,
  tipo: ENUM ['armacao', 'lente', 'clip-on', 'acessorio', 'outro'],
  categoria: String,
  preco_venda: Decimal,
  preco_custo: Decimal,
  margem_lucro: Decimal,
  quantidade_estoque: Integer,
  estoque_minimo: Integer,
  sku: String (unique),
  fornecedor_id: UUID (FK),
  active: Boolean,
  metadata: JSONB
}
```

### Client
```javascript
{
  id: UUID,
  nome: String,
  email: String (unique),
  telefone: String,
  whatsapp: String,
  cpf_cnpj: String (unique),
  endereco: JSONB,
  data_nascimento: Date,
  categoria: ENUM ['vip', 'gold', 'regular', 'novo'],
  origem: ENUM ['indicacao', 'google', 'instagram', 'facebook', 'marketplace'],
  tags: JSONB Array,
  total_compras: Decimal,
  total_pedidos: Integer,
  ultima_compra: DateTime,
  score_rfm: Integer,
  active: Boolean
}
```

### Sale
```javascript
{
  id: UUID,
  produto: String,
  produto_id: UUID (FK),
  cliente: String,
  cliente_id: UUID (FK),
  prescription_id: UUID (FK),
  valor_venda: Decimal,
  valor_custo: Decimal,
  lucro: Decimal,
  margem: Decimal,
  quantidade: Integer,
  canal: ENUM ['whatsapp', 'mercado-livre', 'amazon', 'shopee', 'loja-fisica'],
  status: ENUM ['pendente', 'confirmado', 'pago', 'enviado', 'entregue', 'cancelado'],
  data_venda: Date,
  data_entrega: Date,
  forma_pagamento: String,
  parcelas: Integer,
  vendedor_id: UUID (FK),
  vendedor: String,
  marketplace_order_id: String
}
```

### Prescription
```javascript
{
  id: UUID,
  cliente_id: UUID (FK),
  cliente_nome: String,
  medico_nome: String,
  medico_crm: String,
  data_emissao: Date,
  data_validade: Date,
  tipo_lente: ENUM ['visao-simples', 'multifocal', 'bifocal', 'progressiva'],
  olho_direito: JSONB {
    esferico: Float,
    cilindrico: Float,
    eixo: Integer,
    adicao: Float,
    dnp: Integer
  },
  olho_esquerdo: JSONB,
  observacoes: Text,
  status: ENUM ['ativa', 'expirada', 'cancelada'],
  pedidos_associados: JSONB Array,
  lgpd_consentimento: Boolean,
  lgpd_consentimento_data: DateTime,
  created_by: UUID (FK),
  updated_by: UUID (FK)
}
```

---

## 📊 Analytics & Reports

### GET /api/analytics/sales
Get comprehensive sales analytics with customizable time periods.

**Query Parameters**:
- `period`: today, week, month, year, custom
- `startDate`: ISO 8601 date (required if period=custom)
- `endDate`: ISO 8601 date (required if period=custom)

**Response**:
```json
{
  "summary": {
    "total_sales": 145,
    "total_revenue": 125450.00,
    "average_ticket": 865.17,
    "best_day": "2024-01-15"
  },
  "by_channel": {
    "loja_fisica": { "sales": 98, "revenue": 89200.00 },
    "mercado_livre": { "sales": 32, "revenue": 28100.00 }
  },
  "by_payment": {
    "credito": 65,
    "pix": 45,
    "debito": 35
  },
  "top_products": [
    {
      "nome": "Lente Varilux",
      "quantity": 45,
      "revenue": 20250.00
    }
  ]
}
```

### GET /api/analytics/performance
Get seller performance metrics and conversion rates.

### GET /api/analytics/dashboard
Get dashboard summary with key metrics for current period.

---

## 🔍 Advanced Search & Filters

### POST /api/search/global
Multi-entity search across products, clients, sales, and suppliers.

**Body**:
```json
{
  "query": "progressive lens",
  "entities": ["products", "clients", "sales"],
  "limit": 10
}
```

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "nome": "Lente Progressiva Varilux",
      "score": 0.95
    }
  ],
  "clients": [],
  "sales": [
    {
      "id": "uuid",
      "produto": "Lente Progressiva",
      "score": 0.87
    }
  ]
}
```

### POST /api/search/products
Advanced product search with complex filters.

**Body**:
```json
{
  "query": "varilux",
  "filters": {
    "categoria": "lentes",
    "minPrice": 300,
    "maxPrice": 600,
    "inStock": true,
    "datePreset": "last30days"
  },
  "sortBy": "preco_venda",
  "sortOrder": "asc",
  "page": 1,
  "limit": 20
}
```

**Supported Filters**:
- **Strings**: categoria, tipo, status, origem, canal
- **Booleans**: active, inStock, lowStock, hasEmail
- **Numeric ranges**: minPrice/maxPrice, minValue/maxValue, minStock/maxStock
- **Date ranges**: startDate/endDate, dateField, datePreset
- **Arrays**: categorias[], tipos[], statuses[]

**Date Presets**: today, yesterday, last7days, last30days, thisMonth, lastMonth, thisYear

### POST /api/search/clients
Search clients with filters (nome, email, telefone, cpf, categoria, origem).

### POST /api/search/sales
Search sales with filters (produto, vendedor, canal, forma_pagamento).

### POST /api/search/suppliers
Search suppliers with filters (nome, email, cnpj).

### GET /api/search/suggestions
Get autocomplete suggestions for search queries.

**Query Parameters**:
- `query`: Search term (min 2 characters)
- `entity`: products, clients, sales, suppliers
- `limit`: Max suggestions (default: 5)

**Response**:
```json
{
  "suggestions": [
    "Lente Progressiva Varilux",
    "Lente CR39",
    "Lente Transitions"
  ]
}
```

### POST /api/search/saved
Create a saved search for quick access.

**Body**:
```json
{
  "name": "Lentes em Promoção",
  "entity": "products",
  "query": "lente",
  "filters": {
    "categoria": "lentes",
    "maxPrice": 300
  },
  "is_favorite": true
}
```

### GET /api/search/saved
List user's saved searches with pagination and filters.

### PUT /api/search/saved/:id
Update a saved search (name, filters, is_favorite).

### DELETE /api/search/saved/:id
Delete a saved search.

### POST /api/search/saved/:id/use
Execute a saved search and increment use counter.

### GET /api/search/recent
Get recent search history (last 20 searches auto-saved).

### GET /api/search/filters/presets
Get available date filter presets.

### POST /api/search/filters/summary
Get human-readable summary of applied filters.

---

## 📝 Audit Trail System

**Permissions**: All audit endpoints require CEO role.

### GET /api/audit
Get paginated audit logs with filters.

**Query Parameters**:
- `userId`: Filter by user
- `action`: create, update, delete, login, logout
- `resourceType`: product, client, sale, supplier, etc.
- `startDate`, `endDate`: Date range
- `page`, `limit`: Pagination

**Response**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "update",
      "resource_type": "product",
      "resource_id": "uuid",
      "details": {
        "before": { "preco_venda": 400.00 },
        "after": { "preco_venda": 450.00 }
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "method": "PUT",
      "path": "/api/products/uuid",
      "status_code": 200,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "pages": 50,
    "limit": 10
  }
}
```

### GET /api/audit/user/:userId
Get complete activity history for a specific user.

**Query Parameters**:
- `action`: Filter by action type
- `resourceType`: Filter by resource
- `startDate`, `endDate`: Date range
- `page`, `limit`: Pagination

### GET /api/audit/resource/:type/:id
Get complete change history for a specific resource (product, client, sale, etc).

**Example**: `GET /api/audit/resource/product/uuid`

Shows all creates, updates, and deletes for that product with before/after snapshots.

### GET /api/audit/report
Get advanced audit report with statistics.

**Query Parameters**:
- `userId`, `action`, `resourceType`
- `startDate`, `endDate`
- `includeStats`: true/false (default: true)

**Response includes**:
- Filtered audit logs
- Statistics: by_action, by_resource, by_status, by_user
- Top users, top resources
- Timeline of activity

### GET /api/audit/recent
Get recent changes (last 24 hours by default).

**Query Parameters**:
- `hours`: Number of hours to look back (default: 24)
- `limit`: Max results

### GET /api/audit/export?format=csv
Export audit logs in JSON or CSV format.

**Query Parameters**:
- `format`: json, csv
- Same filters as GET /api/audit
- Max 10,000 records per export

### GET /api/audit/statistics/:period
Get aggregated audit statistics.

**Periods**: 24h, 7d, 30d, 90d, 1y

**Response**:
```json
{
  "period": "30d",
  "total_actions": 1250,
  "unique_users": 8,
  "by_action": {
    "create": 450,
    "update": 620,
    "delete": 180
  },
  "by_resource": {
    "product": 520,
    "sale": 430,
    "client": 300
  },
  "timeline": [
    { "date": "2024-01-01", "count": 45 },
    { "date": "2024-01-02", "count": 52 }
  ],
  "top_users": [
    { "username": "admin", "count": 450 }
  ]
}
```

### POST /api/audit/log
Manually create an audit log entry.

**Body**:
```json
{
  "action": "custom_action",
  "resource_type": "custom",
  "resource_id": "id",
  "details": {
    "description": "Manual log entry"
  }
}
```

---

## 💾 Backup & Restore

**Permissions**: All backup endpoints require CEO role.

### POST /api/backup/create
Create a new database backup.

**Body** (optional):
```json
{
  "description": "Backup antes da atualização"
}
```

**Response**:
```json
{
  "success": true,
  "backup": {
    "id": "uuid",
    "filename": "backup_20240115_143022.sql",
    "size": 2458624,
    "description": "Backup antes da atualização",
    "created_at": "2024-01-15T14:30:22Z",
    "created_by": "admin"
  }
}
```

### GET /api/backup/list
List all available backups with metadata.

**Response**:
```json
{
  "backups": [
    {
      "id": "uuid",
      "filename": "backup_20240115_143022.sql",
      "size": 2458624,
      "created_at": "2024-01-15T14:30:22Z",
      "created_by": "admin",
      "description": "Backup antes da atualização"
    }
  ]
}
```

### GET /api/backup/download/:id
Download a specific backup file.

### POST /api/backup/restore/:id
Restore database from a backup.

**⚠️ Warning**: This will overwrite the current database. Creates automatic backup before restore.

**Response**:
```json
{
  "success": true,
  "message": "Database restored successfully",
  "backup_before_restore": {
    "id": "uuid",
    "filename": "backup_before_restore_20240115_143530.sql"
  }
}
```

### DELETE /api/backup/:id
Delete a backup file.

### POST /api/backup/schedule
Configure automatic backup schedule (daily, weekly, monthly).

**Body**:
```json
{
  "frequency": "daily",
  "time": "02:00",
  "retention_days": 30
}
```

---

## 📧 Email Notifications

### POST /api/email/send
Send an email using predefined templates or custom content.

**Body**:
```json
{
  "to": "client@email.com",
  "subject": "Seu pedido está pronto!",
  "template": "order_ready",
  "data": {
    "client_name": "João Silva",
    "order_number": "12345",
    "pickup_date": "2024-01-20"
  }
}
```

**Available Templates**:
- `sale_confirmation`: Sent after sale creation
- `order_ready`: Notify client order is ready for pickup
- `low_stock_alert`: Alert managers about low stock
- `daily_report`: Daily sales and inventory summary
- `custom`: Free-form email (requires `html` or `text` field)

**Custom Email Body**:
```json
{
  "to": "user@email.com",
  "subject": "Custom Subject",
  "template": "custom",
  "html": "<h1>Custom HTML</h1>",
  "text": "Plain text fallback"
}
```

### POST /api/email/send-bulk
Send emails to multiple recipients.

**Body**:
```json
{
  "recipients": ["user1@email.com", "user2@email.com"],
  "subject": "Promoção de Lentes",
  "template": "promotion",
  "data": {
    "promotion_name": "Lentes 30% OFF",
    "valid_until": "2024-01-31"
  }
}
```

### GET /api/email/history
Get email sending history with filters.

**Query Parameters**:
- `startDate`, `endDate`: Date range
- `status`: sent, failed, pending
- `template`: Filter by template name
- `page`, `limit`: Pagination

**Response**:
```json
{
  "emails": [
    {
      "id": "uuid",
      "to": "client@email.com",
      "subject": "Seu pedido está pronto!",
      "template": "order_ready",
      "status": "sent",
      "sent_at": "2024-01-15T10:00:00Z",
      "error": null
    }
  ]
}
```

### GET /api/email/templates
List available email templates with descriptions.

### POST /api/email/test
Send a test email to verify configuration.

**Body**:
```json
{
  "to": "admin@aureon.com",
  "template": "sale_confirmation"
}
```

---

## 🔔 Alerts System

### GET /api/alerts
Get active alerts with filters.

**Query Parameters**:
- `type`: low_stock, out_of_stock, price_change, system_error
- `severity`: low, medium, high, critical
- `status`: active, acknowledged, resolved
- `page`, `limit`: Pagination

**Response**:
```json
{
  "alerts": [
    {
      "id": "uuid",
      "type": "low_stock",
      "severity": "high",
      "message": "Lente CR39 abaixo do estoque mínimo",
      "produto_id": "uuid",
      "details": {
        "current_stock": 2,
        "min_stock": 5
      },
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/alerts/:id/acknowledge
Mark an alert as acknowledged.

### POST /api/alerts/:id/resolve
Mark an alert as resolved.

### GET /api/alerts/summary
Get summary of alerts by type and severity.

---

## 🚀 Interactive API Documentation

Access Swagger UI for interactive API testing:

**URL**: `http://localhost:5000/api-docs`

**Features**:
- Try all endpoints directly from browser
- See request/response examples
- Authentication with JWT tokens
- Schema definitions
- Response codes and error messages

**OpenAPI Spec**: `http://localhost:5000/api-docs.json`

---

## 🔒 Security & Rate Limiting

### Rate Limits
- **Default**: 100 requests / 15 minutes per IP
- **Auth endpoints**: 5 requests / 15 minutes
- **Backup/Export**: 10 requests / hour

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

### Authentication
All endpoints (except `/auth/login` and `/health`) require JWT token:

```
Authorization: Bearer <token>
```

**Token Expiration**: 24 hours  
**Refresh**: Login again to get new token

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| CEO | Full system access |
| VENDAS | Sales, clients, products (read) |
| ESTOQUE | Inventory, products, stock movements |
| COMPRAS | Suppliers, purchases, products |
| FINANCEIRO | Finance, sales reports, analytics |

---

## 📊 Status & Implementation Progress

### ✅ Fully Implemented (14/25 tasks - 56%)
1. ✅ Medical Prescriptions
2. ✅ Backend Structure (50+ endpoints, 11 models)
4. ✅ Event Log Persistence
5. ✅ DLQ Intelligent Retry
6. ✅ Frontend API Integration Phase 1
9. ✅ Dashboard Real-time Updates
10. ✅ Inventory Alerts System
11. ✅ Sales Analytics & Reports
13. ✅ Backup & Restore System
14. ✅ Audit Trail System
15. ✅ Performance Optimization
16. ✅ API Documentation (Swagger + Markdown)
19. ✅ Email Notifications
20. ✅ Advanced Search & Filters

### ⏳ In Progress (4 tasks)
3. ⏳ trace_id (60% - disabled for debugging)
7. ⏳ Server Crash Fix (80% - workaround active)
8. ⏳ Frontend API Integration Phase 2 (20%)

### 📋 Pending (11 tasks)
Tasks 12, 17, 18, 21, 22, 23, 24, 25

---

## 🛠️ Development & Testing

### Start Development Server
```bash
cd aureon-backend
npm run dev
```

### Run Tests
```bash
npm test
npm run test:coverage
```

### Environment Variables
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Database Migrations
```bash
npm run migrate
npm run migrate:undo
npm run seed
```

---

## 📞 Support & Contact

**API Health**: http://localhost:5000/health  
**Interactive Docs**: http://localhost:5000/api-docs  
**Email**: dev@aureon.com

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready (56% complete, core features operational)
