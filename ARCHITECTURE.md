# Arquitetura do AUREON ERP

## 📋 Visão Geral

O AUREON ERP é um sistema de gestão empresarial moderno construído com arquitetura frontend-first, utilizando React e integrações com serviços externos para maximizar funcionalidades.

```
┌─────────────────────────────────────────────────────────────────┐
│                         AUREON ERP                              │
│                    (Sistema de Gestão)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌────────▼────────┐
        │   Frontend      │         │  Integrações    │
        │   React + Vite  │         │   Externas      │
        └───────┬────────┘         └────────┬────────┘
                │                           │
    ┌───────────┼───────────┬───────────────┼──────────┐
    │           │           │               │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐      ┌────▼────┐ ┌──▼─────┐
│9 Mód. │  │Simul. │  │  IA   │      │Mercado  │ │Alibaba │
│Integr.│  │46 Cen.│  │OpenAI │      │ Livre   │ │RapidAPI│
└───────┘  └───────┘  └───────┘      └─────────┘ └────────┘
```

## 🏗️ Arquitetura Frontend

### Stack Tecnológico

```
┌──────────────────────────────────────────────────┐
│                  Camada de UI                     │
│  React 18 + TailwindCSS 3.4 + Recharts          │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│            Camada de Estado                       │
│  Context API + localStorage + EventBus           │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│         Camada de Serviços                        │
│  API Clients + Integrations + Simulador          │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│            Camada de Dados                        │
│  localStorage + IndexedDB + External APIs        │
└──────────────────────────────────────────────────┘
```

### Estrutura de Diretórios

```
aureon-os/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   └── ...
│   ├── context/            # Estado global (Context API)
│   │   └── DataContext.jsx # Gerenciamento centralizado
│   ├── pages/              # Páginas dos módulos
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── Calculator.jsx
│   │   └── ...
│   ├── assets/             # Imagens, ícones, fonts
│   ├── App.jsx             # Componente raiz + roteamento
│   └── main.jsx            # Entry point
├── simulator/              # Sistema de simulação
│   ├── scenarios/          # 46 cenários E2E
│   ├── core/               # Motor de simulação
│   └── reports/            # Relatórios de execução
├── tests/                  # Testes unitários
└── public/                 # Assets estáticos
```

## 🎯 Módulos do Sistema

### 1. Dashboard
**Responsabilidade**: Visão geral do negócio

```
Dashboard
├── Métricas em Tempo Real
│   ├── Vendas do Dia
│   ├── Estoque Crítico
│   ├── Tarefas Pendentes
│   └── Receita Mensal
├── Gráficos Analíticos
│   ├── Vendas por Período (Recharts)
│   ├── Top Produtos
│   └── Performance por Vendedor
└── Widgets Interativos
    ├── Notificações
    ├── Atalhos Rápidos
    └── Status do Sistema
```

**Tecnologias**: React, Recharts, Context API

### 2. Estoque (Inventory)
**Responsabilidade**: Gerenciamento de produtos

```
Estoque
├── Cadastro de Produtos
│   ├── Informações Básicas
│   ├── Preços e Custos
│   ├── Imagens (upload)
│   └── Categorias
├── Controle de Quantidade
│   ├── Entradas
│   ├── Saídas
│   └── Transferências
├── Alertas Automáticos
│   ├── Estoque Mínimo
│   ├── Produtos Vencendo
│   └── Ruptura de Estoque
└── Integrações
    ├── Mercado Livre (sync preços)
    └── Alibaba (busca fornecedores)
```

**Fluxo de Dados**:
```
Produto → localStorage → EventBus → Outros Módulos
                ↓
         Integração ML/Alibaba
```

### 3. Vendas (Sales)
**Responsabilidade**: Gestão de pedidos e vendas

```
Vendas
├── PDV (Ponto de Venda)
│   ├── Busca Rápida de Produtos
│   ├── Carrinho de Compras
│   ├── Formas de Pagamento
│   └── Impressão de Cupom
├── Histórico de Vendas
│   ├── Filtros Avançados
│   ├── Relatórios
│   └── Exportação
└── Análises
    ├── Ticket Médio
    ├── Conversão
    └── Sazonalidade
```

**EventBus**: Emite `vendaRealizada` → Atualiza Estoque, Financeiro, Metas

### 4. CRM
**Responsabilidade**: Relacionamento com clientes

```
CRM
├── Cadastro de Clientes
│   ├── Dados Pessoais
│   ├── Histórico de Compras
│   └── Preferências
├── Oportunidades
│   ├── Pipeline de Vendas
│   ├── Follow-ups
│   └── Propostas
└── Comunicação
    ├── Envio de Emails
    ├── WhatsApp Integration
    └── Notificações Push
```

### 5. Comunicação
**Responsabilidade**: Canal unificado de mensagens

```
Comunicação
├── Emails
│   ├── Composer
│   ├── Templates
│   └── Agendamento
├── WhatsApp Business
│   ├── Mensagens Individuais
│   ├── Listas de Transmissão
│   └── Automações
└── Notificações
    ├── In-app
    ├── Push
    └── SMS
```

### 6. Análises (Analytics)
**Responsabilidade**: Business Intelligence

```
Análises
├── IA Preditiva (OpenAI)
│   ├── Previsão de Vendas
│   ├── Detecção de Tendências
│   ├── Recomendações
│   └── Insights Automáticos
├── Dashboards Personalizados
│   ├── KPIs Custom
│   ├── Filtros Dinâmicos
│   └── Exportação
└── Relatórios
    ├── Financeiros
    ├── Operacionais
    └── Gerenciais
```

**Integração com IA**:
```javascript
// Exemplo de análise preditiva
const previsao = await openai.analisar({
  dados: vendasUltimos12Meses,
  objetivo: 'prever_proximos_3_meses',
  contexto: { sazonalidade, promocoes, mercado }
});
```

### 7. Metas (Goals)
**Responsabilidade**: Gestão de objetivos

```
Metas
├── Definição de Metas
│   ├── Individuais
│   ├── Por Equipe
│   └── Globais
├── Tracking em Tempo Real
│   ├── Progress Bars
│   ├── Gamificação
│   └── Rankings
└── Notificações
    ├── Alertas de Progresso
    ├── Conquistas
    └── Bonificações
```

### 8. Compras (Purchases)
**Responsabilidade**: Gestão de fornecedores e compras

```
Compras
├── Pedidos de Compra
│   ├── Criação
│   ├── Aprovação
│   └── Recebimento
├── Fornecedores
│   ├── Cadastro
│   ├── Avaliação
│   └── Histórico
└── Integração Alibaba
    ├── Busca de Produtos
    ├── Comparação de Preços
    └── Negociação
```

### 9. Configurações (Settings)
**Responsabilidade**: Administração do sistema

```
Configurações
├── Usuários e Permissões
│   ├── Cadastro
│   ├── Roles (Admin, Vendedor, etc.)
│   └── Auditoria
├── Sistema
│   ├── Tema (light/dark)
│   ├── Idioma
│   └── Notificações
└── Integrações
    ├── API Keys
    ├── Webhooks
    └── Logs
```

## 🔄 Arquitetura de Eventos (EventBus)

```javascript
// EventBus - Sistema de comunicação entre módulos
EventBus
├── Eventos de Negócio
│   ├── vendaRealizada
│   ├── estoqueAtualizado
│   ├── clienteCadastrado
│   ├── metaAlcancada
│   └── ...
├── Trace ID
│   └── Rastreamento end-to-end
└── Subscribers
    ├── Dashboard (atualiza métricas)
    ├── Estoque (baixa produtos)
    ├── Financeiro (registra receita)
    └── Metas (atualiza progresso)
```

**Exemplo de Uso**:
```javascript
// Módulo de Vendas emite evento
EventBus.emit('vendaRealizada', {
  traceId: 'abc-123',
  venda: { id, produtos, total, cliente }
});

// Módulo de Estoque recebe e processa
EventBus.on('vendaRealizada', async ({ venda, traceId }) => {
  await baixarEstoque(venda.produtos, traceId);
  console.log(`[${traceId}] Estoque atualizado`);
});
```

## 🤖 Sistema de Simulação

### Arquitetura do Simulador

```
Simulador (46 Cenários)
├── Core Engine
│   ├── Playwright Runner
│   ├── Data Seeding (IA Generativa)
│   ├── Isolation Manager
│   └── Report Generator
├── Scenarios
│   ├── Smoke Tests (5)
│   ├── E2E Flows (20)
│   ├── Integration Tests (15)
│   └── Stress Tests (6)
└── Reports
    ├── JSON (machine-readable)
    ├── HTML (visual)
    └── Logs (debug)
```

**Isolamento de Dados**:
```
Modo Produção          Modo Simulação
localStorage           localStorage_SIMULATION
     ↓                        ↓
 Dados Reais           Dados Sintéticos (IA)
```

**Geração de Dados com IA**:
```javascript
// Cria dados realistas para testes
const dadosTeste = await openai.gerar({
  tipo: 'clientes',
  quantidade: 50,
  criterios: {
    distribuicao: 'brasileira',
    setores: ['varejo', 'servicos'],
    ticket_medio: 500
  }
});
```

## 🔗 Integrações Externas

### 1. OpenAI (IA Generativa)

```
OpenAI API
├── Modelo: GPT-4o-mini
├── Casos de Uso:
│   ├── Análises Preditivas
│   ├── Insights Automáticos
│   ├── Geração de Dados de Teste
│   └── Recomendações Personalizadas
└── Configuração:
    ├── VITE_OPENAI_API_KEY
    └── Mock Mode (sem API key)
```

### 2. Mercado Livre

```
Mercado Livre OAuth 2.0
├── Autenticação: 3-legged
├── Funcionalidades:
│   ├── Sincronizar Produtos
│   ├── Atualizar Preços
│   ├── Gerenciar Estoque
│   └── Processar Vendas
└── Configuração:
    ├── VITE_ML_CLIENT_ID
    ├── VITE_ML_CLIENT_SECRET
    └── VITE_ML_REDIRECT_URI
```

### 3. Alibaba (via RapidAPI)

```
Alibaba API
├── Busca de Produtos
├── Comparação de Preços
├── Contato com Fornecedores
└── Configuração:
    ├── VITE_RAPIDAPI_KEY
    └── VITE_RAPIDAPI_HOST
```

## 💾 Persistência de Dados

### localStorage Strategy

```javascript
localStorage
├── users              // Usuários do sistema
├── products           // Catálogo de produtos
├── clientes           // Base de clientes
├── vendas             // Histórico de vendas
├── metas              // Metas configuradas
├── configuracoes      // Settings do usuário
└── auth               // Token de autenticação
```

**Estrutura de Dados**:
```javascript
// Exemplo: Produto
{
  id: 'uuid',
  nome: 'Produto X',
  preco: 99.90,
  estoque: 50,
  categoria: 'eletrônicos',
  imagem: 'base64...',
  fornecedor: { id, nome },
  historico: [
    { data, acao: 'entrada', quantidade: 100 },
    { data, acao: 'venda', quantidade: 50 }
  ],
  integracao: {
    mercadoLivre: { id: 'MLB123', sincronizado: true },
    alibaba: { sku: 'ALI456' }
  }
}
```

## 🚀 Fluxo de Deploy

```
Desenvolvimento → CI/CD → Produção
      │              │         │
      ↓              ↓         ↓
  npm run dev   GitHub      Docker
                Actions    Container
                   │           │
                   ├→ Tests    ├→ Build
                   ├→ Lint     ├→ Nginx
                   └→ Build    └→ SSL
```

### CI/CD Pipeline (GitHub Actions)

```yaml
Workflow: ci-cd.yml
├── Trigger: push/PR on main
├── Jobs:
│   ├── test (Node 18, 20)
│   │   ├── Install deps
│   │   ├── Run lint
│   │   ├── Run tests
│   │   └── Upload coverage
│   ├── build
│   │   ├── npm run build
│   │   └── Upload artifacts
│   ├── security
│   │   ├── npm audit
│   │   └── Snyk scan
│   └── deploy
│       ├── staging (develop)
│       └── production (main)
└── Notifications
```

### Docker Deployment

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Segurança

```
Camadas de Segurança
├── Frontend
│   ├── Input Sanitization
│   ├── XSS Protection
│   └── CSRF Tokens
├── Autenticação
│   ├── JWT (futuro backend)
│   ├── Password Hashing
│   └── Rate Limiting
├── APIs Externas
│   ├── API Keys em .env
│   ├── OAuth 2.0 (ML)
│   └── HTTPS Only
└── Dados
    ├── localStorage Encryption (futuro)
    ├── Backup Automático
    └── Auditoria de Acessos
```

## 📊 Performance

### Otimizações

```
Performance Strategy
├── Code Splitting
│   └── Lazy loading de páginas
├── Asset Optimization
│   ├── Image compression
│   ├── Minification
│   └── Tree shaking
├── Caching
│   ├── Service Worker (futuro)
│   ├── localStorage cache
│   └── API response cache
└── Monitoring
    ├── Lighthouse CI
    ├── Bundle size tracking
    └── Error tracking (Sentry)
```

### Métricas Alvo

- ⚡ First Contentful Paint: < 1.5s
- 🎨 Largest Contentful Paint: < 2.5s
- 🔄 Time to Interactive: < 3.5s
- 📦 Bundle Size: < 500KB (gzipped)

## 🧪 Estratégia de Testes

```
Pirâmide de Testes
├── E2E (Playwright) - 46 scenarios
│   ├── Smoke Tests
│   ├── User Journeys
│   └── Integration Flows
├── Integration Tests - Vitest
│   ├── Context API
│   ├── EventBus
│   └── API Clients
└── Unit Tests - Vitest
    ├── Components
    ├── Utils
    └── Business Logic
```

## 🔮 Roadmap Arquitetural

### Fase 1 (Atual) - Frontend-First ✅
- React SPA com localStorage
- Integrações com APIs externas
- Sistema de simulação completo

### Fase 2 (Próxima) - Backend Integration 🚧
```
Backend (Node.js + Express)
├── REST API
├── PostgreSQL Database
├── Redis Cache
├── JWT Authentication
└── WebSocket (real-time)
```

### Fase 3 (Futuro) - Microservices 🔮
```
Microservices Architecture
├── API Gateway
├── Auth Service
├── Inventory Service
├── Sales Service
├── Analytics Service (Python + ML)
└── Message Queue (RabbitMQ)
```

## 📚 Recursos Adicionais

- **Documentação API**: (futuro) `/docs/api`
- **Componentes Storybook**: (futuro) `/docs/storybook`
- **Guia de Estilo**: Ver `CONTRIBUTING.md`
- **Changelog**: Ver `CHANGELOG.md`

## 🤝 Contribuindo com Arquitetura

Ao propor mudanças arquiteturais:

1. Crie uma RFC (Request for Comments) em Discussions
2. Descreva o problema atual e solução proposta
3. Inclua diagramas e exemplos de código
4. Discuta trade-offs e alternativas
5. Aguarde feedback da comunidade

---

**Última Atualização**: 2025-12-08  
**Versão**: 2.0.0  
**Mantenedor**: @amorimbrunoengenharia-cmd
