# AUREON Backend API

Backend API REST para o AUREON ERP - Sistema Integrado de Gestão para Ótica/E-commerce

## 🚀 Stack Tecnológica

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize 6.35
- **Autenticação**: JWT (jsonwebtoken)
- **Segurança**: Helmet, bcryptjs, express-rate-limit
- **Logging**: Winston
- **Validação**: express-validator

## 📁 Estrutura do Projeto

```
aureon-backend/
├── config/
│   └── database.js          # Configuração Sequelize/PostgreSQL
├── middlewares/
│   ├── auth.js              # JWT authentication & RBAC authorization
│   ├── errorHandler.js      # Global error handling
│   └── rateLimiter.js       # Rate limiting
├── models/
│   ├── User.js              # Modelo de usuários
│   ├── Product.js           # Modelo de produtos
│   ├── Prescription.js      # Modelo de receitas médicas
│   └── ...                  # (outros modelos a serem criados)
├── routes/
│   ├── auth.routes.js       # Rotas de autenticação
│   ├── product.routes.js    # CRUD de produtos
│   ├── prescription.routes.js
│   └── ...
├── utils/
│   └── logger.js            # Winston logger
├── scripts/
│   ├── migrate.js           # Database migrations
│   └── migrateFromLocalStorage.js  # Migração de localStorage → DB
├── logs/                    # Log files (auto-generated)
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Template de variáveis
├── server.js                # Entry point
└── package.json
```

## ⚙️ Instalação

### 1. Instalar Dependências

```powershell
cd aureon-backend
npm install
```

### 2. Configurar PostgreSQL

Instale PostgreSQL 14+ e crie o banco de dados:

```sql
CREATE DATABASE aureon_erp;
CREATE USER aureon_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE aureon_erp TO aureon_user;
```

### 3. Configurar Variáveis de Ambiente

```powershell
Copy-Item .env.example .env
```

Edite o arquivo `.env` e configure:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aureon_erp
DB_USER=aureon_user
DB_PASSWORD=strong_password

JWT_SECRET=gere_uma_chave_aleatoria_segura_min_32_chars
JWT_REFRESH_SECRET=outra_chave_diferente_min_32_chars
```

**⚠️ IMPORTANTE**: Gere secrets seguros com:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Executar Migrations

```powershell
npm run migrate
```

### 5. Seed (Usuários Padrão)

```powershell
npm run seed
```

Usuários criados:
- `ceo` / `ceo123` (CEO)
- `vendedor` / `vendedor123` (VENDAS)
- `estoque` / `estoque123` (ESTOQUE)
- `compras` / `compras123` (COMPRAS)
- `financeiro` / `financeiro123` (FINANCEIRO)

## 🏃 Execução

### Desenvolvimento (com hot-reload)

```powershell
npm run dev
```

### Produção

```powershell
npm start
```

O servidor iniciará em `http://localhost:5000`

## 🔐 Autenticação

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "ceo",
  "password": "ceo123"
}
```

**Resposta:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "ceo",
    "role": "CEO"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Usar Token nas Requisições

```http
GET /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Renovar Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## 🛣️ Rotas da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obter usuário autenticado
- `POST /api/auth/logout` - Logout

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto (CEO, ESTOQUE)
- `GET /api/products/:id` - Detalhes do produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Receitas Médicas
- `GET /api/prescriptions` - Listar receitas
- `POST /api/prescriptions` - Criar receita
- `GET /api/prescriptions/:id` - Detalhes da receita
- `PUT /api/prescriptions/:id` - Atualizar receita
- `POST /api/prescriptions/:id/attach/:orderId` - Associar a pedido
- `POST /api/prescriptions/:id/upload` - Upload de anexo

### Vendas
- `GET /api/sales` - Listar vendas
- `POST /api/sales` - Registrar venda
- `GET /api/sales/:id` - Detalhes da venda

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients/:id` - Detalhes do cliente
- `PUT /api/clients/:id` - Atualizar cliente

### Financeiro
- `GET /api/finance/movimentacoes` - Movimentações financeiras
- `POST /api/finance/movimentacoes` - Criar movimentação
- `GET /api/finance/dashboard` - Dashboard financeiro (CEO, FINANCEIRO)

### Eventos
- `GET /api/events` - Listar eventos (CEO)
- `GET /api/events/:traceId` - Buscar por trace_id

### Audit Log
- `GET /api/audit` - Log de auditoria (CEO)

## 🔒 RBAC (Role-Based Access Control)

### Perfis de Usuário

| Perfil | Acesso |
|--------|--------|
| **CEO** | Acesso total a todas as rotas |
| **VENDAS** | Vendas, clientes, receitas, produtos (leitura) |
| **ESTOQUE** | Produtos, movimentações, fornecedores |
| **COMPRAS** | Compras, fornecedores, produtos (leitura) |
| **FINANCEIRO** | Módulo financeiro, relatórios |

### Uso no Código

```javascript
import { authenticate, authorize } from './middlewares/auth.js';

// Apenas autenticado
router.get('/products', authenticate, (req, res) => {
  // req.user disponível
});

// Apenas CEO e ESTOQUE
router.post('/products', authenticate, authorize('CEO', 'ESTOQUE'), (req, res) => {
  // ...
});
```

## 📊 Event System

Todos os eventos do frontend serão persistidos no banco:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(100),
  trace_id UUID,
  payload JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Migração de localStorage

Para migrar dados existentes do localStorage para o banco:

```powershell
npm run migrate:localStorage
```

Este script:
1. Lê todos os dados do localStorage (simulado via export JSON)
2. Cria registros no PostgreSQL
3. Mantém IDs e timestamps originais
4. Gera relatório de migração

## 🧪 Testes

```powershell
npm test
```

## 📦 Deploy (Produção)

### 1. Configurar Variáveis no Servidor

```bash
export NODE_ENV=production
export DB_HOST=seu_host_postgresql
export JWT_SECRET=secret_production_seguro
```

### 2. Executar Migrations

```bash
npm run migrate
```

### 3. Iniciar com PM2

```bash
pm2 start server.js --name aureon-backend
pm2 save
pm2 startup
```

## 📝 Logs

Logs são salvos em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

Visualizar logs em tempo real:

```powershell
Get-Content logs/combined.log -Wait
```

## 🔧 Troubleshooting

### Erro de Conexão com PostgreSQL

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução**: Verifique se o PostgreSQL está rodando:

```powershell
Get-Service -Name postgresql*
Start-Service postgresql-x64-14
```

### Token JWT Inválido

```
401 Unauthorized - Invalid token
```

**Solução**: Token expirado. Use `/api/auth/refresh` ou faça login novamente.

### Rate Limit Exceeded

```
429 Too Many Requests
```

**Solução**: Aguarde 15 minutos ou ajuste `RATE_LIMIT_MAX_REQUESTS` no `.env`.

## 📚 Próximos Passos (TASK-002 Continuação)

1. ✅ Estrutura backend criada
2. ✅ Autenticação JWT implementada
3. ✅ Models principais criados (User, Product, Prescription)
4. 🔄 **Próximo**: Implementar rotas completas (CRUD)
5. 🔄 **Próximo**: Criar models restantes (Sale, Client, Supplier, etc)
6. 🔄 **Próximo**: Script de migração localStorage → PostgreSQL
7. 🔄 **Próximo**: Atualizar frontend para usar API

---

**Desenvolvido para AUREON ERP** | Versão 1.0.0 | Dezembro 2025
