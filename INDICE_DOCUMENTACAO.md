# 📑 ÍNDICE DE DOCUMENTAÇÃO - AUREON ERP

**Data:** 29 de Dezembro de 2025  
**Status:** ✅ Documentação Organizada

---

## 🎯 LEITURA OBRIGATÓRIA

### 1. **DOCUMENTACAO_CONSOLIDADA.md** ⭐ **COMECE AQUI**
   - Visão geral completa do projeto
   - Todas as auditorias e correções consolidadas
   - Implementações resumidas
   - Guias de uso essenciais
   - Testes e validações
   - Deploy e produção

---

## 📚 DOCUMENTAÇÃO TÉCNICA ESSENCIAL

### Arquitetura e Schema

#### **DATABASE_SCHEMA.md**
- Schema completo do banco de dados
- Modelos e relacionamentos
- Estrutura multi-tenant
- RBAC e permissões

#### **ARQUITETURA_DIAGRAMA.md**
- Diagramas de arquitetura
- Fluxo de dados
- Integrações entre módulos

#### **MODULO_FINANCEIRO_ARQUITETURA.md**
- Arquitetura específica do módulo financeiro
- Estrutura de contas
- Fluxo de caixa

---

### Desenvolvimento

#### **DEVELOPER_GUIDE.md**
- Guia para novos desenvolvedores
- Setup do ambiente
- Convenções de código
- Estrutura do projeto

#### **TECH_LEAD_IMPLEMENTATION.md**
- Decisões técnicas arquiteturais
- Padrões implementados
- Best practices

---

### Performance e Otimização

#### **PERFORMANCE_GUIDE.md**
- Otimizações implementadas
- Benchmarks
- Monitoramento
- Técnicas de cache

---

## 🔍 AUDITORIAS E QA

### **AUDITORIA_COMPLETA_QA.md**
- Auditoria completa de qualidade (15/12/2025)
- Acessibilidade (WCAG AA)
- Problemas identificados e resolvidos
- Role IT Team implementado

### **AUDITORIA_COMPLETA_ERROS.md**
- Auditoria de erros (09/12/2025)
- Erros React corrigidos (18 correções)
- SyntaxError CI/CD (cache)
- Correções aplicadas

---

## 🚀 IMPLEMENTAÇÕES

### **IMPLEMENTACOES_COMPLETAS_10DEZ2025.md**
- 8 features implementadas (Dezembro 2025)
- Dashboard avançado
- Alertas de estoque
- Filtros de período
- Gráfico de giro de estoque
- Sistema de prescrições médicas
- Central de compras

### **PROGRESS.md**
- Progresso geral do projeto
- 24/25 Tasks completas (96%)
- Status de cada módulo
- Histórico de implementações

---

## 📖 GUIAS PRÁTICOS

### **GUIA_RAPIDO_USO.md**
- Início rápido do sistema
- Navegação básica
- Funcionalidades principais
- Dicas de uso

### **GUIA_RAPIDO_ALGORITMO.md**
- Como usar o algoritmo de reposição
- Parâmetros configuráveis
- Interpretação de resultados
- Casos de uso

### **GUIA-DOMINIO-E-ALERTAS.md**
- Configuração de domínio personalizado
- Sistema de alertas
- Notificações

---

## 🧪 TESTES

### **CHECKLIST_TESTES.md**
- Checklist completo de testes manuais
- Testes de integração
- Validação de funcionalidades

### **RELATORIO_FINAL_TESTES_COMPLETO.md**
- Relatório final de testes (10-15/12/2025)
- 75 testes executados (100% passou)
- Smoke tests, integração e manuais
- Sistema aprovado para produção

### **TESTING_GUIDE.md**
- Estratégias de teste
- Testes automatizados
- Configuração de ambiente de testes

---

## 🚀 DEPLOY E PRODUÇÃO

### **DEPLOY.md**
- Guia completo de deploy
- Ambientes (dev/staging/prod)
- Scripts de deploy
- Variáveis de ambiente

### **DEPLOYMENT.md**
- Estratégias de deployment
- CI/CD pipeline
- Rollback procedures

### **PRODUCTION_CHECKLIST.md**
- Checklist pré-deploy
- Validações necessárias
- Health checks
- Monitoramento

### **QUICK_COMMANDS.md**
- Comandos rápidos úteis
- Scripts de manutenção
- Troubleshooting

---

## 📋 DOCUMENTOS DE REFERÊNCIA

### **EXECUTIVE_SUMMARY.md**
- Resumo executivo para stakeholders
- Métricas de negócio
- ROI e benefícios

### **MERCADO_LIVRE_CONFIG.md**
- Configuração de integração com Mercado Livre
- API keys
- Webhooks

---

## 📂 ESTRUTURA DE SCRIPTS

### **scripts/** (pasta raiz)
- **deploy.sh** - Script de deploy automatizado
- **rollback.sh** - Rollback para versão anterior

### **aureon-backend/scripts/**
- **seed.js** - Seed de dados de teste
- **runDLQRetry.js** - Retry de mensagens DLQ
- **runBackup.js** - Backup automático
- **optimizeDatabase.js** - Otimizações de BD
- **runAlertCheck.js** - Verificação de alertas
- **migrateFromLocalStorage.js** - Migração de localStorage
- **migrate-multitenant.js** - Migração multi-tenant
- **migrate-audit-method.js** - Migração de auditoria
- **create-super-admin.js** - Criar super admin
- **create-demo-tenant.js** - Criar tenant demo
- **cleanupOldEvents.js** - Limpeza de eventos antigos
- **add-indexes.sql** - Adicionar índices ao BD

### **aureon-os/scripts/**
- **simulate.js** - Simulador de dados
- **simulate-smoke.js** - Smoke tests
- **validate-commit-msg.js** - Validação de commits

---

## 🗂️ ARQUIVOS DE CONFIGURAÇÃO

### Raiz do Projeto
- **docker-compose.yml** - Orquestração de containers
- **tailwind.config.js** - Configuração do Tailwind CSS
- **.env.production.example** - Exemplo de variáveis de produção
- **.env.staging.example** - Exemplo de variáveis de staging
- **package-lock.json** - Lock de dependências

---

## 📝 NOTAS IMPORTANTES

### ✅ Limpeza Realizada (29/12/2025)

**Arquivos Removidos:**
- ✓ Auditorias duplicadas (7 arquivos)
- ✓ Implementações duplicadas (8 arquivos)
- ✓ Relatórios de testes individuais (3 arquivos)
- ✓ Guias e instruções obsoletos (4 arquivos)
- ✓ Scripts de debug/correção temporários (13 arquivos .js)
- ✓ Correções e resumos antigos (5 arquivos)
- ✓ Planos de testes obsoletos (4 arquivos)
- ✓ Documentos de fases antigas (2 arquivos)
- ✓ Outros duplicados (3 arquivos)

**Total Removido:** 49 arquivos obsoletos/duplicados

**Resultado:**
- 📄 Documentação consolidada em **DOCUMENTACAO_CONSOLIDADA.md**
- 🗂️ Estrutura organizada e limpa
- 📖 Fácil navegação e manutenção
- ✨ Sem redundâncias

---

## 🔍 COMO USAR ESTE ÍNDICE

1. **Novo no projeto?** → Leia **DOCUMENTACAO_CONSOLIDADA.md** primeiro
2. **Precisa implementar algo?** → Consulte **DEVELOPER_GUIDE.md**
3. **Vai fazer deploy?** → Siga **DEPLOY.md** e **PRODUCTION_CHECKLIST.md**
4. **Precisa testar?** → Use **CHECKLIST_TESTES.md**
5. **Dúvidas sobre arquitetura?** → Veja **ARQUITETURA_DIAGRAMA.md** e **DATABASE_SCHEMA.md**
6. **Quer usar uma funcionalidade?** → Consulte **GUIA_RAPIDO_USO.md**

---

## 📞 SUPORTE

**Documentação sempre atualizada em:** `/docs` na raiz do projeto

**Última atualização:** 29 de Dezembro de 2025

**Manutenção:** Documentação revisada e organizada por IA Assistant
