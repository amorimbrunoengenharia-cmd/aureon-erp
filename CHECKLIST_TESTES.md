# ✅ CHECKLIST DE TESTES - ALGORITMO DE REPOSIÇÃO

## 🎯 Objetivo
Validar o algoritmo avançado de reposição e as Foreign Key constraints.

---

## 🚀 PRÉ-REQUISITOS

✅ Servidor rodando em: **http://localhost:5174/**  
✅ Arquivos implementados:
- `src/services/ReplenishmentService.js` (282 linhas)
- `src/context/DataContext.jsx` (FK validations)
- `src/pages/PurchaseCenter.jsx` (UI integrada)

---

## 📋 TESTES FUNCIONAIS

### 1️⃣ **TESTE: Integridade de Dados (Foreign Keys)**

#### Teste 1.1: Movimentação de ENTRADA sem Fornecedor
**Passos:**
1. Acesse "Movimentações de Estoque"
2. Tente adicionar uma movimentação:
   - Tipo: **ENTRADA**
   - Produto: Qualquer
   - Fornecedor: **Deixe em branco**
   - Quantidade: 10

**Resultado Esperado:**
```
❌ Erro: "Movimentação de ENTRADA requer um fornecedor válido"
```

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 1.2: Movimentação com Produto Inexistente
**Passos:**
1. Abra o DevTools (F12)
2. Console: Execute:
```javascript
// Tente adicionar movimentação com produto ID 99999
dataContext.addMovimentacao({
  tipo: 'saida',
  produtoId: 99999,
  quantidade: 5,
  usuario: 'teste'
})
```

**Resultado Esperado:**
```
❌ Error: "Produto ID 99999 não encontrado. Violação de Foreign Key"
```

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 1.3: Fornecedor sem Nome
**Passos:**
1. Acesse "Inventário Unificado"
2. Tente adicionar fornecedor:
   - Nome: **deixe em branco**
   - Contato: "(11) 98765-4321"
   - Lead Time: 7

**Resultado Esperado:**
```
❌ Erro: "Fornecedor deve ter nome e contato"
```

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### 2️⃣ **TESTE: Algoritmo de Reposição**

#### Teste 2.1: Produto com Estoque Baixo
**Cenário:**
- Produto: Óculos Ray-Ban
- Estoque Atual: 5 unidades
- Vendas últimos 30 dias: 60 unidades (VMD = 2)
- Lead Time: 7 dias
- Meta Crescimento: 20%
- Fator Segurança: 3 dias

**Cálculo Manual:**
```
VMD = 60 ÷ 30 = 2 un/dia
VMD Projetada = 2 × 1.20 = 2.4 un/dia
Estoque Segurança = 2.4 × 3 = 7.2 ≈ 8 unidades
Ponto de Pedido = (2.4 × 7) + 8 = 16.8 + 8 = 24.8 ≈ 25 unidades
Sugestão = MAX(0, 25 - 5) = 20 unidades
```

**Passos:**
1. Acesse **Central de Compras**
2. Localize o produto "Óculos Ray-Ban"
3. Verifique os valores exibidos

**Resultado Esperado:**
- VMD Projetada: **~2.4**
- Estoque Segurança: **~8**
- Ponto de Pedido: **~25**
- Sugestão de Compra: **~20**
- Status: **🔴 COMPRAR**

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 2.2: Produto com Estoque Adequado
**Cenário:**
- Produto: Óculos Oakley
- Estoque Atual: 50 unidades
- Vendas últimos 30 dias: 30 unidades (VMD = 1)
- Lead Time: 5 dias
- Meta: 20%
- Fator: 3 dias

**Cálculo Manual:**
```
VMD = 30 ÷ 30 = 1 un/dia
VMD Projetada = 1 × 1.20 = 1.2 un/dia
Estoque Segurança = 1.2 × 3 = 3.6 ≈ 4 unidades
Ponto de Pedido = (1.2 × 5) + 4 = 6 + 4 = 10 unidades
Sugestão = MAX(0, 10 - 50) = 0 unidades
```

**Passos:**
1. Acesse **Central de Compras**
2. Produto NÃO deve aparecer na lista (ou aparecer com sugestão = 0)

**Resultado Esperado:**
- Produto **não aparece** OU
- Sugestão de Compra: **0**
- Status: **🟢 ESTOQUE OK**

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 2.3: Score de Prioridade
**Cenário:**
- Produto A: Margem 50% × Volume 100 = Score 5000
- Produto B: Margem 20% × Volume 200 = Score 4000

**Passos:**
1. Acesse **Central de Compras**
2. Verifique a ordem dos produtos

**Resultado Esperado:**
- **Produto A** aparece ANTES de **Produto B** (maior score primeiro)
- Badge mostra: **⭐ Score: 5000.0** e **⭐ Score: 4000.0**

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### 3️⃣ **TESTE: Interface e Visualização**

#### Teste 3.1: Estatísticas Dashboard
**Passos:**
1. Acesse **Central de Compras**
2. Verifique os 4 cards no topo

**Resultado Esperado:**
- Card 1: **Produtos Críticos** (número > 0 se houver)
- Card 2: **Necessita Reposição** (total de produtos)
- Card 3: **Investimento Necessário** (em R$)
- Card 4: **Unidades a Comprar** (quantidade total)

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 3.2: Fórmula Transparente
**Passos:**
1. Acesse **Central de Compras**
2. Clique em qualquer produto da lista
3. Verifique a seção de fórmulas

**Resultado Esperado:**
```
📈 Passo 1: VMD Projetada = X × (1 + Y%) = Z
🛡️ Passo 2: Estoque Segurança = Z × N dias = A
📍 Passo 3: Ponto de Pedido = (Z × L dias) + A = B
🎯 Passo 4: Sugestão = MAX(0, B - E) = S
⭐ Score Prioridade: Margem M% × Volume V = SCORE
```

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 3.3: Badges e Status
**Passos:**
1. Acesse **Central de Compras**
2. Verifique as badges dos produtos

**Resultado Esperado:**
- Prioridade: **🔴 CRÍTICO** ou **🟠 URGENTE** ou **🟡 MÉDIO** ou **🟢 BAIXO**
- Score: **⭐ Score: XXXX.X**
- Status: **🔴 COMPRAR** ou **🟢 ESTOQUE OK**

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### 4️⃣ **TESTE: Configurações**

#### Teste 4.1: Alterar Meta de Crescimento
**Passos:**
1. Abra DevTools (F12) → Console
2. Execute:
```javascript
// Alterar meta para 50%
const newConfig = {...config, metaCrescimento: 50};
setConfig(newConfig);
```
3. Acesse **Central de Compras**
4. Verifique se VMD Projetada aumentou

**Resultado Esperado:**
- VMD Projetada MAIOR que antes
- Sugestões de compra MAIORES
- Fórmula mostra: `× (1 + 50%) = ...`

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### Teste 4.2: Alterar Fator de Segurança
**Passos:**
1. DevTools → Console:
```javascript
// Alterar fator para 5 dias
const newConfig = {...config, fatorSeguranca: 5};
setConfig(newConfig);
```
2. Acesse **Central de Compras**
3. Verifique Estoque de Segurança

**Resultado Esperado:**
- Estoque Segurança MAIOR
- Sugestões de compra MAIORES
- Fórmula mostra: `× 5 dias = ...`

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### 5️⃣ **TESTE: Lead Time por Fornecedor**

#### Teste 5.1: Fornecedor com Lead Time 10 dias
**Cenário:**
- Fornecedor A: Lead Time = 10 dias
- Fornecedor B: Lead Time = 3 dias
- Produto com mesmo VMD

**Cálculo Manual:**
```
Fornecedor A: Ponto de Pedido = (VMD × 10) + Segurança
Fornecedor B: Ponto de Pedido = (VMD × 3) + Segurança

Fornecedor A requer MAIS estoque (lead time maior)
```

**Passos:**
1. Cadastre 2 fornecedores com lead times diferentes
2. Associe produtos similares a cada um
3. Compare sugestões de compra

**Resultado Esperado:**
- Produto com lead time 10 dias → **Sugestão MAIOR**
- Produto com lead time 3 dias → **Sugestão MENOR**

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

## 🐛 TESTES DE EDGE CASES

### Edge Case 1: Produto Sem Vendas
**Cenário:** VMD = 0 (nunca vendeu)

**Resultado Esperado:**
- VMD Projetada = 0
- Sugestão = 0 OU valor mínimo de segurança
- Status: **🟢 ESTOQUE OK** ou não aparece

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Edge Case 2: Meta de Crescimento 0%
**Cenário:** config.metaCrescimento = 0

**Resultado Esperado:**
- VMD Projetada = VMD Original (sem ajuste)
- Algoritmo funciona normalmente

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Edge Case 3: Fator de Segurança 0 dias
**Cenário:** config.fatorSeguranca = 0

**Resultado Esperado:**
- Estoque Segurança = 0
- Ponto de Pedido = VMD × Lead Time (sem buffer)
- Sistema funciona (não quebra)

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Edge Case 4: Lead Time 0 dias
**Cenário:** Fornecedor com leadTime = 0

**Resultado Esperado:**
- Ponto de Pedido = Estoque Segurança apenas
- Sugestão baseada apenas no buffer
- Sistema funciona

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

## 🔍 TESTES DE CONSOLE (DevTools)

### Teste Console 1: ReplenishmentService.calcularVMD()
```javascript
// Simular 30 vendas em 30 dias
const vendas = [
  { produtoId: 1, quantidade: 5, data: '2025-01-01' },
  { produtoId: 1, quantidade: 3, data: '2025-01-15' },
  { produtoId: 1, quantidade: 7, data: '2025-01-30' }
];

const vmd = ReplenishmentService.calcularVMD(vendas, 1, 30);
console.log('VMD:', vmd); // Deve retornar: (5+3+7)/30 = 0.5
```

**Resultado Esperado:** VMD ≈ 0.5

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste Console 2: ReplenishmentService.calcularSugestaoCompra()
```javascript
const resultado = ReplenishmentService.calcularSugestaoCompra({
  vmd: 2,
  lead_time: 7,
  estoque_atual: 10,
  meta_crescimento: 0.20,
  fator_seguranca: 3
});

console.log(resultado);
/* Esperado:
{
  vmd_projetada: 2.4,
  estoque_seguranca: 8,
  ponto_de_pedido: 25,
  sugestao_compra: 15,
  status: 'COMPRAR'
}
*/
```

**Resultado Esperado:** Sugestão ≈ 15 unidades

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

### Teste Console 3: ReplenishmentService.calcularScore()
```javascript
const score = ReplenishmentService.calcularScore(50, 100);
console.log('Score:', score); // Deve retornar: 5000
```

**Resultado Esperado:** Score = 5000

**Status:** [ ] ✅ Passou | [ ] ❌ Falhou

---

## 📊 RESULTADO FINAL

| Categoria | Total | Passou | Falhou |
|-----------|-------|--------|--------|
| Integridade (FK) | 3 | __ | __ |
| Algoritmo | 3 | __ | __ |
| Interface | 3 | __ | __ |
| Configurações | 2 | __ | __ |
| Lead Time | 1 | __ | __ |
| Edge Cases | 4 | __ | __ |
| Console Tests | 3 | __ | __ |
| **TOTAL** | **19** | **__** | **__** |

---

## ✅ CHECKLIST PRÉ-PRODUÇÃO

Antes de liberar para produção:

- [ ] Todos os testes funcionais passaram
- [ ] Edge cases validados
- [ ] Testes de console executados
- [ ] Interface responsiva (mobile/desktop)
- [ ] Documentação revisada
- [ ] Backup do banco de dados
- [ ] Treinamento da equipe
- [ ] Rollback plan definido

---

## 🚨 PROBLEMAS CONHECIDOS

### Problema 1: [DESCREVA SE ENCONTRAR]
**Descrição:**  
**Severidade:** 🔴 Alta | 🟡 Média | 🟢 Baixa  
**Solução:**

---

## 📝 NOTAS DE TESTE

[Espaço para anotações durante os testes]

---

**Data do Teste:** __/__/____  
**Testador:** _______________  
**Ambiente:** http://localhost:5174/  
**Status Geral:** [ ] ✅ Aprovado | [ ] ⚠️ Com Ressalvas | [ ] ❌ Reprovado
