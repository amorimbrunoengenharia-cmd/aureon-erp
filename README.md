# 🏢 AUREON ERP - Sistema de Gestão Empresarial Completo

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![CI/CD](https://github.com/amorimbrunoengenharia-cmd/aureon-erp/actions/workflows/ci-cd.yml/badge.svg)
![Simulation Tests](https://github.com/amorimbrunoengenharia-cmd/aureon-erp/actions/workflows/simulate-smoke.yml/badge.svg)

![GitHub Stars](https://img.shields.io/github/stars/amorimbrunoengenharia-cmd/aureon-erp?style=social)
![GitHub Forks](https://img.shields.io/github/forks/amorimbrunoengenharia-cmd/aureon-erp?style=social)
![GitHub Issues](https://img.shields.io/github/issues/amorimbrunoengenharia-cmd/aureon-erp)
![GitHub Last Commit](https://img.shields.io/github/last-commit/amorimbrunoengenharia-cmd/aureon-erp)
![GitHub Contributors](https://img.shields.io/github/contributors/amorimbrunoengenharia-cmd/aureon-erp)

**ERP moderno para farmácias com PDV, controle de estoque, prescrições digitais, integração com marketplace e sistema de simulação completo**

[🚀 Quick Start](#-quick-start) •
[📖 Documentação](#-documentação) •
[🧪 Testes](#-testes) •
[🤝 Contribuir](#-contribuir)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Quick Start](#-quick-start)
- [Funcionalidades](#-funcionalidades-principais)
- [Scripts Úteis](#-scripts-úteis)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Banco de Dados](#-banco-de-dados)
- [Testes](#-testes)
- [Build & Deploy](#-build--deploy)
- [Troubleshooting](#-troubleshooting)
- [Documentação](#-documentação)
- [Contribuir](#-contribuir)
- [Licença](#-licença)

---

## 🎯 Visão Geral

AUREON ERP é um sistema completo de gestão empresarial desenvolvido especificamente para farmácias, combinando:

- **Frontend React**: Interface moderna com React 18 + Vite + Tailwind CSS
- **Sistema de Simulação**: 46 cenários de teste automatizados (cobertura 100%)
- **Arquitetura Event-Driven**: Sistema de eventos com trace_id para rastreabilidade
- **IA Integrada**: OpenAI GPT-4o-mini para insights e análises
- **Integrações**: Mercado Livre, Alibaba (via RapidAPI)

### **Stack Tecnológico**

| Categoria | Tecnologias |
|-----------|-------------|
| **Frontend** | React 18.2, Vite 5.1, Tailwind CSS 3.4 |
| **State** | React Context API, localStorage |
| **Charts** | Recharts 3.5 |
| **Icons** | Lucide React 0.344 |
| **Testes** | Vitest, @testing-library/react, Playwright |
| **IA** | OpenAI API (gpt-4o-mini) |
| **Integrações** | Mercado Livre OAuth, RapidAPI (Alibaba) |

---

## 🚀 Quick Start

### **Pré-requisitos**

- Node.js 18+ (recomendado: 20.x)
- npm 9+ ou yarn 1.22+
- Git

### **Instalação (Dev)**

```bash
# 1. Clonar repositório
git clone https://github.com/amorimbrunoengenharia-cmd/aureon-erp.git
cd aureon-erp/aureon-os

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua VITE_OPENAI_API_KEY (opcional)

# 4. Iniciar servidor de desenvolvimento
npm run dev

# 5. Abrir no navegador
# http://localhost:5173
```

### **Login de Teste**

| Perfil | Usuário | Senha |
|--------|---------|-------|
| **CEO** | admin | admin123 |
| **Vendedor** | vendedor | vend123 |
| **Estoque** | estoque | est123 |
| **Compras** | compras | comp123 |

---

## 📸 Screenshots

<div align="center">

### Dashboard Principal
*Visão geral com KPIs em tempo real, gráficos de vendas e alertas*

### PDV (Ponto de Venda)
*Interface intuitiva para vendas rápidas com busca de produtos e múltiplas formas de pagamento*

### Gestão de Estoque
*Controle completo de produtos com alertas de estoque mínimo e integração com marketplaces*

### Sistema de Simulação
*46 cenários de teste automatizados com relatórios detalhados*

> 📝 **Nota**: Screenshots serão adicionados em breve. Sistema já está 100% funcional!

</div>

---

## ✨ Funcionalidades Principais

### **9 Módulos Completos**

| Módulo | Descrição | Status |
|--------|-----------|--------|
| 📊 **Dashboard** | KPIs tempo real, gráficos, análises | ✅ |
| 📦 **Estoque** | Produtos, alertas, movimentações | ✅ |
| 💰 **Vendas** | PDV, vendas multicanal, relatórios | ✅ |
| 👥 **CRM** | Gestão de clientes, histórico | ✅ |
| 💬 **Comunicação** | Templates WhatsApp/Email, campanhas | ✅ |
| 📊 **Análises** | Insights, recomendações de compra | ✅ |
| 🎯 **Metas** | Definição e acompanhamento de metas | ✅ |
| 🛒 **Compras** | Pedidos, fornecedores, reconciliação | ✅ |
| ⚙️ **Configurações** | Backup, idiomas, preferências | ✅ |

### **Diferenciais**

- ✅ **PDV Atômico**: Transações ACID com lock otimista
- ✅ **Prescrições Digitais**: Validação com Certificação Digital
- ✅ **Marketplace**: Sincronização bidirecional Mercado Livre
- ✅ **EventBus**: Arquitetura event-driven com trace_id
- ✅ **Modo Simulação**: Sandbox com IA generativa para testes
- ✅ **46 Cenários de Teste**: Cobertura 100% fluxos críticos

---

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento
npm run dev                    # Servidor dev (porta 5173)
npm run dev:debug              # Dev com source maps detalhados

# Build
npm run build                  # Build produção
npm run preview                # Preview build local

# Testes
npm test                       # Executar todos os testes
npm run test:ui                # Interface gráfica Vitest
npm run test:coverage          # Coverage report
npm run simulate:smoke         # Smoke tests (< 60s)
npm run simulate:full          # Todos os 46 cenários

# Qualidade de Código
npm run lint                   # ESLint check
npm run lint:fix               # Auto-fix linting
npm run format                 # Prettier format

# Simulador (Backend necessário)
npm run simulate -- --scenario=venda-completa-happy
npm run simulate -- --suite=sales --inject-failures
npm run simulate:concurrency   # Testes de carga
```

---

## 🔐 Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto:

```bash
# OpenAI API (OPCIONAL - sistema funciona em modo mock sem isso)
VITE_OPENAI_API_KEY=sk-proj-SEU_TOKEN_AQUI

# URLs Backend (se usar backend real)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000

# Mercado Livre OAuth (OPCIONAL)
VITE_ML_CLIENT_ID=seu_client_id
VITE_ML_CLIENT_SECRET=seu_client_secret
VITE_ML_REDIRECT_URI=http://localhost:5173/ml-callback

# RapidAPI Alibaba (OPCIONAL)
VITE_RAPIDAPI_KEY=sua_key_aqui
VITE_RAPIDAPI_HOST=alibaba-api.p.rapidapi.com

# Modo de desenvolvimento
VITE_ENABLE_SIMULATION_MODE=true
```

### **Obter Chaves de API**

| Serviço | Link | Custo |
|---------|------|-------|
| **OpenAI** | https://platform.openai.com/api-keys | ~$0.0001/req (gpt-4o-mini) |
| **RapidAPI** | https://rapidapi.com/alibaba-api/api/alibaba-product-search | Freemium (100 req/mês grátis) |
| **Mercado Livre** | https://developers.mercadolivre.com.br | Grátis |

---

## 💾 Banco de Dados

### **Estrutura (localStorage - Frontend)**

```javascript
// Principais collections
{
  "products": [],      // Produtos cadastrados
  "sales": [],         // Histórico de vendas
  "customers": [],     // Clientes (CRM)
  "movements": [],     // Movimentações de estoque
  "events": [],        // EventBus log
  "audit_logs": [],    // Auditoria
  "reconciliation": [] // Reconciliação financeira
}
```

### **Backup & Restore**

```javascript
// Via UI: Configurações > Backup/Restore
// Ou manualmente:
localStorage.setItem('backup_aureon', JSON.stringify({
  products: JSON.parse(localStorage.getItem('products') || '[]'),
  sales: JSON.parse(localStorage.getItem('sales') || '[]'),
  // ... outras collections
}));
```

### **Seeds (Simulador - Backend)**

```bash
# Seed base (tenant, users, products)
psql -U postgres -d aureon_dev < simulator/seeds/base.sql

# Seed estoque baixo (testes concorrência)
psql -U postgres -d aureon_dev < simulator/seeds/low_stock.sql
```

---

## 🧪 Testes

### **Testes Unitários & Integração**

```bash
# Executar todos os testes
npm test

# Watch mode (dev)
npm run test:watch

# Coverage report
npm run test:coverage
# Abrir: coverage/index.html

# Testes específicos
npm test -- EventBus
npm test -- src/services/
```

### **Simulador (46 Cenários)**

```bash
# Smoke tests (6 cenários críticos < 60s)
npm run simulate:smoke

# Suite específica
npm run simulate:sales         # Cenários de vendas
npm run simulate:concurrency   # Testes de carga

# Cenário individual
npm run simulate -- --scenario=venda-completa-happy

# Com injeção de falhas
npm run simulate -- --suite=sales --inject-failures

# Dry-run (validar JSONs)
npm run simulate:dry-run
```

### **Cobertura Esperada**

| Tipo | Cenários | Tempo |
|------|----------|-------|
| **XS (Critical)** | 6 | < 60s |
| **S (High)** | 12 | ~5min |
| **M (Medium)** | 20 | ~15min |
| **L (Low)** | 8 | ~30min |
| **TOTAL** | **46** | **~50min** |

Documentação completa: [simulator/README.md](./simulator/README.md)

---

## 🏗️ Build & Deploy

### **Build Local**

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
# Acesse: http://localhost:4173
```

### **Deploy (Docker)**

```dockerfile
# Dockerfile já incluído
docker build -t aureon-erp .
docker run -p 8080:80 aureon-erp
```

### **Deploy (Vercel/Netlify)**

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

### **Variáveis de Ambiente (Produção)**

```bash
# No Vercel/Netlify, configure:
VITE_OPENAI_API_KEY=sk-proj-...
VITE_API_BASE_URL=https://api.seudominio.com
```

---

## 🆘 Troubleshooting

### **Problemas Comuns**

#### ❌ Erro: "OpenAI API Key inválida"

```bash
# Solução 1: Verificar .env
cat .env | grep VITE_OPENAI_API_KEY

# Solução 2: Usar modo mock
# Remova a linha VITE_OPENAI_API_KEY do .env
# Sistema funcionará com dados simulados
```

#### ❌ Erro: "localStorage quota exceeded"

```javascript
// Limpar dados antigos
localStorage.clear();
// Ou via UI: Configurações > Resetar Sistema
```

#### ❌ Simulador falha: "Backend not running"

```bash
# Verificar se backend está rodando
curl http://localhost:5000/health

# Se não estiver, iniciar backend:
cd ../aureon-backend
npm start
```

#### ❌ Testes falhando

```bash
# Limpar cache
npm run test:clear

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar versão Node
node -v  # Deve ser >= 18.0.0
```

### **Health Checks**

```bash
# Frontend
curl http://localhost:5173

# Backend (se aplicável)
curl http://localhost:5000/health

# Simulador
npm run simulate -- --scenario=health-check
```

---

## 📚 Documentação

### **Guias Técnicos**

| Documento | Descrição |
|-----------|-----------|
| [📐 ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitetura Event-Driven, análise técnica |
| [🔌 INTEGRATIONS.md](./docs/INTEGRATIONS.md) | Alibaba, Mercado Livre, RapidAPI |
| [🧪 TESTING.md](./docs/TESTING.md) | Guias de testes integrados |
| [🤖 AI_FEATURES.md](./docs/AI_FEATURES.md) | Funcionalidades de IA (OpenAI) |
| [🎭 SIMULATION_MODE.md](./docs/SIMULATION_MODE.md) | Sandbox Mode global |

### **Links Úteis**

- **Repositório GitHub**: https://github.com/amorimbrunoengenharia-cmd/aureon-erp
- **Issues**: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/issues
- **Wiki**: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/wiki
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)

---

## 🤝 Contribuir

### **Como Contribuir**

1. **Fork** o repositório
2. **Clone** seu fork: `git clone https://github.com/SEU_USER/aureon-erp.git`
3. **Branch**: `git checkout -b feature/minha-feature`
4. **Commit**: `git commit -m "feat: adiciona funcionalidade X"`
5. **Push**: `git push origin feature/minha-feature`
6. **Pull Request**: Abra um PR no GitHub

### **Padrões de Commit**

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

### **Checklist PR**

- [ ] Testes passando (`npm test`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Coverage >= 80%
- [ ] Documentação atualizada
- [ ] Screenshots (se UI changes)

---

## 📞 Suporte

### **Contato**

- **Email**: aureon@erp.local
- **GitHub Issues**: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/issues
- **Documentação**: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/wiki

### **Ops Tools**

- **Runbooks**: [docs/runbooks/](./docs/runbooks/)
- **Backups**: Configurações > Backup/Restore
- **Simulação**: `npm run simulate:smoke`

---

## 📄 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.

---

## 🏆 Créditos

Desenvolvido com ❤️ por **AUREON Team**

**Tecnologias**: React • Vite • Tailwind CSS • OpenAI • Recharts

---

<div align="center">

**[⬆ Voltar ao topo](#-aureon-erp---sistema-de-gestão-empresarial-completo)**

Made with 💙 by AUREON Team • © 2025

</div>
