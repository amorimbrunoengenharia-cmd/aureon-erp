# AUREON ERP - Testing Suite

## 📋 Visão Geral

Suite completa de testes para o AUREON ERP Backend, cobrindo autenticação, multi-tenant, CRUD, e serviços especializados.

## 🧪 Tipos de Testes

### 1. **Testes de Autenticação** (`tests/auth.test.js`)
- ✅ Registro de usuários
- ✅ Login e logout
- ✅ Refresh tokens
- ✅ Proteção de rotas
- ✅ RBAC (Role-Based Access Control)
- ✅ Validação de credenciais
- ✅ Usuários inativos

**Cobertura:** 25 test cases

### 2. **Testes de Multi-Tenant** (`tests/multitenant.test.js`)
- ✅ Identificação de tenant (4 métodos)
- ✅ Isolamento de dados entre tenants
- ✅ Limites por plano
- ✅ Super admin cross-tenant
- ✅ Gerenciamento de tenants
- ✅ Ativação/desativação de tenants

**Cobertura:** 20 test cases

### 3. **Testes de CRUD** (`tests/crud.test.js`)
- ✅ Produtos (criar, listar, buscar, atualizar, deletar)
- ✅ Clientes (CRUD completo)
- ✅ Vendas (CRUD + validação de estoque)
- ✅ Fornecedores (CRUD + validação de CNPJ)
- ✅ Validações de dados
- ✅ Duplicação de registros

**Cobertura:** 30 test cases

### 4. **Testes de Serviços** (`tests/services.test.js`)
- ✅ Analytics (vendas, produtos, clientes, performance)
- ✅ Alerts (estoque baixo, clientes inativos)
- ✅ Search (busca global, autocomplete, filtros)
- ✅ Backup (criar, listar, restore)
- ✅ Audit Trail (logs de ações)

**Cobertura:** 25 test cases

## 🚀 Como Executar

### Executar todos os testes
```bash
npm test
```

### Executar testes com coverage
```bash
npm run test:coverage
```

### Executar testes em modo watch
```bash
npm run test:watch
```

### Executar testes verbose
```bash
npm run test:verbose
```

### Executar testes para CI/CD
```bash
npm run test:ci
```

### Executar arquivo específico
```bash
npm test -- tests/auth.test.js
```

## 📊 Coverage Report

Os testes cobrem:
- **Routes:** 70%+ coverage
- **Services:** 70%+ coverage
- **Middlewares:** 70%+ coverage
- **Models:** 70%+ coverage

Para visualizar o relatório de cobertura detalhado:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🔧 Configuração

### Variáveis de Ambiente (Testes)
Os testes usam as seguintes configurações automáticas:
- `NODE_ENV=test`
- `JWT_SECRET=test-secret-key-for-jwt-tokens`
- `JWT_REFRESH_SECRET=test-refresh-secret-key`
- `USE_POSTGRES=false`
- `LOG_LEVEL=error`

### Banco de Dados
Os testes usam SQLite em memória ou arquivo temporário:
- Banco criado antes de cada suite
- Tabelas recriadas antes de cada teste
- Dados limpos após cada teste
- Conexão fechada após todos os testes

## 🛠️ Helpers Globais

### `createTestUser(userData)`
Cria usuário de teste com dados padrão.

```javascript
const user = await createTestUser({
  username: 'testuser',
  email: 'test@example.com',
  tenant_id: tenant.id,
  role: 'CEO'
});
```

### `createTestTenant(tenantData)`
Cria tenant de teste com dados padrão.

```javascript
const tenant = await createTestTenant({
  name: 'Test Company',
  slug: 'test-company',
  plan: 'professional'
});
```

### `generateTestToken(userId, tenantId)`
Gera JWT token para testes.

```javascript
const token = await generateTestToken(user.id, tenant.id);
```

## 📝 Estrutura de Testes

```
tests/
├── setup.js              # Configuração global
├── auth.test.js          # Testes de autenticação
├── multitenant.test.js   # Testes multi-tenant
├── crud.test.js          # Testes de CRUD
└── services.test.js      # Testes de serviços
```

## 🎯 Boas Práticas

### 1. Isolamento de Testes
Cada teste é independente e pode ser executado isoladamente:
```bash
npm test -- --testNamePattern="deve criar um produto"
```

### 2. Setup e Teardown
- `beforeAll`: Setup do banco de dados
- `beforeEach`: Criação de tenant e usuário padrão
- `afterEach`: Limpeza de dados
- `afterAll`: Fechamento de conexões

### 3. Assertions Claras
```javascript
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('id');
expect(response.body.nome).toBe('Valor Esperado');
```

### 4. Mocks de Serviços Externos
Email e outros serviços externos são mockados:
```javascript
global.mockEmailService.sendWelcomeEmail
```

## 🐛 Debugging

### Executar teste específico com logs
```bash
LOG_LEVEL=debug npm test -- tests/auth.test.js
```

### Usar debugger no VSCode
Configuração `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/aureon-backend/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 🔄 CI/CD Integration

### GitHub Actions
Os testes são executados automaticamente em:
- Push para `main` ou `develop`
- Pull requests
- Múltiplas versões do Node.js (18.x, 20.x)

Ver: `.github/workflows/ci-cd.yml`

### Coverage Badge
[![codecov](https://codecov.io/gh/your-org/aureon-erp/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/aureon-erp)

## 📚 Documentação Adicional

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contribuindo

Ao adicionar novos testes:
1. Siga a estrutura existente
2. Use os helpers globais
3. Mantenha os testes isolados
4. Adicione comentários descritivos
5. Verifique o coverage antes do commit

```bash
npm run test:coverage
```

## 📈 Métricas de Qualidade

- **100 test cases** implementados
- **70%+ code coverage** em todos os módulos
- **Testes rápidos:** ~30 segundos para suite completa
- **Zero falsos positivos**
- **CI/CD integrado**

---

**Última atualização:** Dezembro 2025  
**Versão:** 1.0.0  
**Mantido por:** AUREON Team
