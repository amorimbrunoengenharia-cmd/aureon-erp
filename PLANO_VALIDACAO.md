# 🧪 PLANO DE TESTES - Validação das Correções

> **Scripts e testes práticos para validar que todos os erros foram corrigidos**

---

## 📋 SUMÁRIO DE TESTES

| Teste | Objetivo | Tempo | Status |
|-------|----------|-------|--------|
| T1 | Validar IDs únicos | 2 min | ⏳ Pendente |
| T2 | Validar Sales.jsx (DOM) | 1 min | ⏳ Pendente |
| T3 | Validar PrescriptionManager | 2 min | ⏳ Pendente |
| T4 | Smoke Tests CI/CD | 3 min | ⏳ Pendente |
| T5 | Teste de stress (IDs) | 5 min | ⏳ Pendente |

---

## 🧪 TESTE 1: Validar IDs Únicos

### **Objetivo:**
Garantir que `generateUniqueId()` nunca gera IDs duplicados

### **Como testar:**
```javascript
// 1. Abrir DevTools Console em http://localhost:5173
// 2. Copiar e colar este código:

// Importar o gerador
const { generateUniqueId } = await import('./src/utils/idGenerator.js');

// Gerar 10.000 IDs rapidamente
const ids = [];
const startTime = performance.now();

for (let i = 0; i < 10000; i++) {
  ids.push(generateUniqueId());
}

const endTime = performance.now();

// Verificar duplicados
const uniqueIds = new Set(ids);
const duplicates = ids.length - uniqueIds.size;

// Resultados
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 TESTE DE IDs ÚNICOS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✓ IDs gerados: ${ids.length}`);
console.log(`✓ IDs únicos: ${uniqueIds.size}`);
console.log(`✓ Duplicados: ${duplicates}`);
console.log(`✓ Tempo: ${(endTime - startTime).toFixed(2)}ms`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Validação
if (duplicates === 0) {
  console.log('✅ TESTE PASSOU: Nenhum ID duplicado!');
} else {
  console.error('❌ TESTE FALHOU: ' + duplicates + ' duplicados encontrados!');
}
```

### **Resultado Esperado:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TESTE DE IDs ÚNICOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ IDs gerados: 10000
✓ IDs únicos: 10000
✓ Duplicados: 0
✓ Tempo: ~15ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TESTE PASSOU: Nenhum ID duplicado!
```

---

## 🧪 TESTE 2: Validar Sales.jsx (DOM)

### **Objetivo:**
Garantir que não há mais erros de `removeChild` no componente Sales

### **Pré-requisitos:**
```bash
# Backend rodando
cd backend
npm run dev

# Frontend rodando
cd aureon-os
npm run dev
```

### **Como testar:**

#### **Passo 1: Limpar console**
```javascript
// DevTools Console
console.clear();
```

#### **Passo 2: Navegar para Sales**
1. Abrir http://localhost:5173
2. Fazer login (qualquer usuário)
3. Clicar em **"Vendas"** no menu
4. Esperar página carregar completamente

#### **Passo 3: Interagir com gráficos**
1. Trocar período: Mensal → Semanal → Diário
2. Adicionar uma venda nova
3. Deletar uma venda existente
4. Navegar para outra página
5. Voltar para Vendas

#### **Passo 4: Verificar console**
```javascript
// Deve estar vazio (0 erros)
// Especificamente NÃO deve ter:
// ❌ "NotFoundError: Failed to execute 'removeChild'"
// ❌ "The node to be removed is not a child"
```

### **Resultado Esperado:**
```
✅ Console limpo (0 erros)
✅ Gráficos renderizam corretamente
✅ Troca de período funciona
✅ CRUD de vendas funciona
✅ Navegação não causa erros
```

---

## 🧪 TESTE 3: Validar PrescriptionManager

### **Objetivo:**
Garantir que não há mais warnings de "duplicate keys"

### **Como testar:**

#### **Passo 1: Limpar console e habilitar warnings**
```javascript
// DevTools Console
console.clear();
// Console deve mostrar warnings (não apenas erros)
```

#### **Passo 2: Navegar para Prescrições**
1. Abrir http://localhost:5173
2. Clicar em **"Prescrições"** no menu
3. Esperar página carregar

#### **Passo 3: Criar múltiplos clientes rapidamente**
```javascript
// DevTools Console
// Simular criação rápida de clientes

// NOTA: Esta função deve estar no DataContext
// Se não estiver disponível, criar manualmente pela UI

// Verificar se há warnings de duplicate keys
// Procurar por:
// ⚠️ "Warning: Encountered two children with the same key"
```

#### **Passo 4: Interagir com selects**
1. Abrir dropdown de clientes
2. Selecionar diferentes clientes
3. Criar nova prescrição
4. Verificar console

### **Resultado Esperado:**
```
✅ Console limpo (0 warnings)
✅ Especificamente NÃO deve ter:
   ❌ "Encountered two children with the same key"
✅ Selects funcionam corretamente
✅ Todas as options são renderizadas
```

---

## 🧪 TESTE 4: Smoke Tests CI/CD

### **Objetivo:**
Validar que os testes automáticos do GitHub Actions passam

### **Pré-requisito:**
```bash
# Invalidar cache primeiro
cd "c:\Users\Usuario\Desktop\Projeto AUREON ERP\aureon-os"
git commit --allow-empty -m "chore: invalidate CI cache"
git push
```

### **Como testar:**

#### **Opção 1: GitHub UI**
1. Ir para: https://github.com/amorimbrunoengenharia-cmd/aureon-erp
2. Clicar na aba **"Actions"**
3. Ver workflow mais recente
4. Esperar completar (~2-3 minutos)

#### **Opção 2: CLI (gh)**
```bash
# Instalar GitHub CLI se necessário:
# winget install GitHub.cli

# Ver status do workflow
gh run list --limit 1

# Ver logs em tempo real
gh run watch
```

#### **Opção 3: Local (simular)**
```bash
cd "c:\Users\Usuario\Desktop\Projeto AUREON ERP\aureon-os"

# Rodar os mesmos testes que o CI
npm run simulate:smoke
```

### **Resultado Esperado:**

#### **GitHub Actions:**
```
✅ Run npm install
✅ Run npm run simulate:smoke
✅ All scenarios passed! 🎉
✅ Exit code: 0
```

#### **Local:**
```powershell
> npm run simulate:smoke

🚀 Starting AUREON ERP Simulation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Scenario: Login flow (500ms)
✓ Scenario: Create sale (1.2s)
✓ Scenario: Stock adjustment (800ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
  • Total: 3
  • Passed: 3
  • Failed: 0
  • Skipped: 0
  • Duration: 2.50s

✅ All scenarios passed! 🎉
```

---

## 📊 DASHBOARD DE TESTES

### **Resumo de Execução:**

```
┌──────────────────────────────────────────────────┐
│  🧪 RESULTADO DOS TESTES                          │
├──────────────────────────────────────────────────┤
│  T1 - IDs Únicos              [ ] ⏳ Pendente     │
│  T2 - Sales.jsx (DOM)         [ ] ⏳ Pendente     │
│  T3 - PrescriptionManager     [ ] ⏳ Pendente     │
│  T4 - Smoke Tests CI/CD       [ ] ⏳ Pendente     │
├──────────────────────────────────────────────────┤
│  TOTAL: 0/4 (0%)                                 │
└──────────────────────────────────────────────────┘
```

---

**Criado por:** GitHub Copilot  
**Data:** 09/12/2025  
**Status:** 📋 Plano de testes pronto para execução
