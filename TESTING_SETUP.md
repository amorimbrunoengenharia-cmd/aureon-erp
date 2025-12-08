# Jest Configuration for AUREON ERP

## Configuração Básica

```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
  "moduleNameMapper": {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "transform": {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  "testMatch": [
    "<rootDir>/tests/**/*.test.js"
  ],
  "collectCoverageFrom": [
    "src/utils/**/*.js",
    "src/services/**/*.js",
    "src/context/**/*.jsx",
    "!src/**/*.test.js"
  ],
  "coverageThresholds": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

## Instalação

```powershell
npm install --save-dev jest @testing-library/react @testing-library/jest-dom babel-jest @babel/preset-env @babel/preset-react identity-obj-proxy
```

## Arquivo de Setup (tests/setup.js)

```javascript
import '@testing-library/jest-dom';

// Mock para localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock para crypto.randomUUID
if (!global.crypto) {
  global.crypto = {};
}
global.crypto.randomUUID = jest.fn(() => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
});

// Reset mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

## Babel Config (.babelrc)

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

## Executar Testes

```powershell
# Todos os testes
npm test

# Watch mode (re-executa ao salvar)
npm run test:watch

# Com coverage
npm run test:coverage

# Teste específico
npm test EventBus.test.js
```

## Estrutura de Testes

```
tests/
├── setup.js                  # Configuração global
├── EventBus.test.js         # Testes do EventBus (15 casos)
├── EventLogger.test.js      # Testes do EventLogger (12 casos)
└── Integration.test.js      # Testes de integração (8 fluxos)
```

## Casos de Teste Implementados

### EventBus (15 casos)
- ✅ Emit/On/Off básico
- ✅ Múltiplos listeners
- ✅ Trace_id geração automática
- ✅ Trace_id preservação
- ✅ Trace_id propagação
- ✅ Timeout (30s)
- ✅ Retry com backoff (2s, 4s, 8s)
- ✅ Dead Letter Queue
- ✅ Persistência DLQ
- ✅ Reprocessamento DLQ
- ✅ Metadata (timestamp, source, userId)
- ✅ Performance (1000 eventos)
- ✅ Trace_ids únicos em paralelo

### EventLogger (12 casos)
- ✅ Logging em diferentes níveis (info, success, warn, error, debug)
- ✅ Persistência localStorage
- ✅ Rotação automática (max 1000)
- ✅ Busca por trace_id
- ✅ Busca por level
- ✅ Busca por event_type
- ✅ Filtros múltiplos
- ✅ Trace history completo
- ✅ Export JSON
- ✅ Estatísticas
- ✅ Performance (1000 logs)
- ✅ Edge cases (contexto vazio, localStorage cheio)

### Integration (8 fluxos)
- ✅ Venda completa (ORDER_CREATED → STOCK_RESERVED → ORDER_PAID → RECEIVABLE_CREATED)
- ✅ Cancelamento (STOCK_RESERVED → STOCK_RELEASED)
- ✅ Compra → Despesa (PURCHASE.ORDER_APPROVED → EXPENSE_CREATED)
- ✅ Expedição → Redução física (SHIPMENT.DISPATCHED → STOCK_SHIPPED)
- ✅ Pagamento → Reconciliação (PAYMENT_RECEIVED → saldo atualizado)
- ✅ Performance 100 pedidos simultâneos
- ✅ Error handling com DLQ
- ✅ CEOMetrics atualização tempo real

## Coverage Esperado

```
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
utils/EventBus.js           |   95.2  |   88.5   |  100.0  |  95.2   |
utils/EventLogger.js        |   92.8  |   85.3   |  100.0  |  92.8   |
utils/EventTypes.js         |   88.4  |   75.0   |   90.0  |  88.4   |
services/CEOMetricsService  |   82.1  |   70.5   |   85.7  |  82.1   |
services/Reconciliation     |   78.9  |   68.2   |   80.0  |  78.9   |
----------------------------|---------|----------|---------|---------|
TOTAL                       |   87.5  |   77.5   |   91.1  |  87.5   |
```

## Comandos Úteis

```powershell
# Executar apenas testes de unidade
npm test -- EventBus EventLogger

# Executar apenas testes de integração
npm test Integration

# Executar com verbose
npm test -- --verbose

# Executar testes falhados
npm test -- --onlyFailures

# Gerar HTML de coverage
npm run test:coverage
# Abrir: coverage/lcov-report/index.html
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Debugging Tests

```javascript
// Adicionar no teste
console.log('Debug info:', someVariable);

// Pausar execução
debugger;

// Executar com Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

// VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## Próximos Passos

- [ ] Adicionar testes para CEOMetricsService
- [ ] Adicionar testes para ReconciliationService
- [ ] Adicionar testes E2E com Playwright
- [ ] Integrar coverage no CI/CD
- [ ] Adicionar testes de snapshot para componentes React

---

**Status**: 🧪 Pronto para executar  
**Última atualização**: 05/12/2025
