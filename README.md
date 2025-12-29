# 🚀 AUREON ERP - Sistema de Gestão Empresarial

**Versão:** 2.0.0  
**Data:** Dezembro 2025  
**Status:** ✅ Produção

---

## 📋 Início Rápido

### 🎯 Leia Primeiro
1. **[INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)** - Índice completo de toda documentação
2. **[DOCUMENTACAO_CONSOLIDADA.md](DOCUMENTACAO_CONSOLIDADA.md)** - Guia completo do sistema

### 🚀 Para Desenvolvedores
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Setup e convenções
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Schema do banco
- **[ARQUITETURA_DIAGRAMA.md](ARQUITETURA_DIAGRAMA.md)** - Arquitetura do sistema

### 🧪 Para QA e Testes
- **[CHECKLIST_TESTES.md](CHECKLIST_TESTES.md)** - Checklist de testes
- **[RELATORIO_FINAL_TESTES_COMPLETO.md](RELATORIO_FINAL_TESTES_COMPLETO.md)** - Últimos resultados

### 🚀 Para Deploy
- **[DEPLOY.md](DEPLOY.md)** - Guia de deploy
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Checklist pré-produção

---

## 🎯 O que é o AUREON ERP?

Sistema completo de gestão empresarial focado em óticas, incluindo:

- ✅ **PDV (Ponto de Venda)** - Sistema de vendas completo
- ✅ **Gestão de Estoque** - Controle de inventário e movimentações
- ✅ **Central de Compras** - Algoritmo inteligente de reposição
- ✅ **Sistema Financeiro** - Contas a pagar/receber, DRE, fluxo de caixa
- ✅ **CRM** - Gestão de clientes e fornecedores
- ✅ **Prescrições Médicas** - Sistema oftalmológico com OCR
- ✅ **Notificações Real-time** - WebSocket + Push notifications
- ✅ **Multi-tenancy** - Múltiplas empresas em um sistema
- ✅ **RBAC** - Controle de acesso baseado em roles

---

## 🏗️ Arquitetura

### Frontend
- **Framework:** React 18 + Vite
- **UI:** TailwindCSS + Headless UI
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Estado:** Context API

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **ORM:** Sequelize
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
- **WebSocket:** Socket.io
- **Logging:** Winston + Morgan

### Infraestrutura
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Deploy:** PM2 + Nginx
- **Monitoramento:** Logs centralizados

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Setup Rápido

```bash
# 1. Clone o repositório
git clone <repo-url>
cd "Projeto AUREON ERP"

# 2. Instale dependências do backend
cd aureon-backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente

# 3. Instale dependências do frontend
cd ../aureon-os
npm install
cp .env.example .env
# Configure as variáveis de ambiente

# 4. Inicie o banco de dados (Docker)
cd ..
docker-compose up -d postgres

# 5. Execute migrations
cd aureon-backend
npm run migrate

# 6. (Opcional) Seed de dados demo
npm run seed

# 7. Inicie o backend
npm run dev

# 8. Em outro terminal, inicie o frontend
cd ../aureon-os
npm run dev
```

### Acesso
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Credenciais padrão:**
  - Usuário: `admin`
  - Senha: `admin123`

---

## 🎨 Principais Funcionalidades

### 1. Sistema de Vendas (PDV)
- Interface rápida e intuitiva
- Busca de produtos por nome, código ou scanner
- Aplicação de descontos
- Múltiplas formas de pagamento
- Vinculação com prescrições médicas
- Impressão de recibos

### 2. Gestão de Estoque
- Controle de entrada e saída
- Movimentações rastreáveis
- Alertas de estoque baixo
- Análise de giro de estoque
- Inventário periódico

### 3. Central de Compras
- **Algoritmo Inteligente de Reposição:**
  - Análise de histórico de vendas (30/60/90 dias)
  - Cálculo de estoque de segurança
  - Lead time dinâmico por fornecedor
  - Previsão de demanda
- Criação automática de pedidos
- Sistema de aprovação com workflow
- Histórico completo de compras

### 4. Sistema Financeiro
- Contas a pagar e receber
- Parcelamento de despesas
- Fluxo de caixa projetado
- DRE (Demonstrativo de Resultados)
- Conciliação bancária
- Relatórios financeiros

### 5. Prescrições Médicas (Oftalmológicas)
- Upload de receitas (PDF/JPG/PNG)
- OCR automático para parsing
- Validação de campos OD/OE
- Controle de expiração (180 dias)
- Vinculação com vendas
- Conformidade LGPD

### 6. Sistema de Notificações
- Notificações em tempo real (WebSocket)
- 10 tipos de notificações
- Níveis de prioridade
- Persistência em banco
- Auto-dismiss configurável

---

## 🔐 Perfis de Usuário (RBAC)

### CEO
- Acesso total ao sistema
- Visualização de todos os módulos
- Configurações globais

### VENDAS
- PDV e gestão de vendas
- Clientes e CRM
- Prescrições médicas
- Relatórios de vendas

### ESTOQUE
- Gestão de inventário
- Movimentações de estoque
- Produtos e categorias
- Relatórios de estoque

### COMPRAS
- Central de compras
- Gestão de fornecedores
- Aprovação de pedidos
- Previsão de demanda

### FINANCEIRO
- Contas a pagar/receber
- Fluxo de caixa
- DRE e relatórios
- Conciliação bancária

### IT TEAM
- Bug reports
- Logs do sistema (audit + event)
- Configurações técnicas
- Gestão de usuários

---

## 📊 Status do Projeto

### ✅ Completo (96%)
- 24/25 Tasks implementadas
- 75/75 Testes aprovados (100%)
- Sistema em produção
- Documentação completa

### 🔄 Em Desenvolvimento
- Integrações externas (Mercado Livre)
- Relatórios avançados
- App mobile

---

## 📚 Documentação

Toda a documentação está organizada e consolidada:

- **[INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)** - Índice completo
- **[DOCUMENTACAO_CONSOLIDADA.md](DOCUMENTACAO_CONSOLIDADA.md)** - Documentação principal
- **docs/** - Documentação técnica detalhada por módulo

---

## 🧪 Testes

### Executar Testes

```bash
# Backend
cd aureon-backend
npm test

# Frontend (E2E)
cd aureon-os
npm run test:e2e

# Smoke tests
npm run simulate:smoke
```

### Últimos Resultados
- **Data:** 10-15 Dezembro 2025
- **Total:** 75 testes
- **Passou:** 75 (100%)
- **Falhou:** 0 (0%)

---

## 🚀 Deploy

### Production

```bash
# Deploy completo
./scripts/deploy.sh

# Rollback (se necessário)
./scripts/rollback.sh
```

### Ambientes
- **Development:** http://localhost:5173
- **Staging:** https://staging.aureon-os.com.br
- **Production:** https://aureon-os.com.br

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit suas mudanças: `git commit -m 'Add nova feature'`
4. Push para a branch: `git push origin feature/nova-feature`
5. Abra um Pull Request

### Convenções
- **Commits:** Seguir [Conventional Commits](https://www.conventionalcommits.org/)
- **Código:** ESLint + Prettier configurados
- **Testes:** Obrigatório para novas features

---

## 📞 Suporte

### Documentação
- Ver **[INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)** para navegar na documentação completa

### Issues
- Reportar bugs via GitHub Issues
- Para bugs críticos, use o sistema interno de Bug Reports (role IT)

---

## 📝 Licença

Proprietário - AUREON ERP © 2025

---

## 🎉 Agradecimentos

Projeto desenvolvido com dedicação pela equipe de desenvolvimento, com foco em qualidade, performance e experiência do usuário.

**Última atualização:** 29 de Dezembro de 2025
