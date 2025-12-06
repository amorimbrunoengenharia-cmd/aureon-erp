# 🚀 GUIA RÁPIDO - ALGORITMO DE REPOSIÇÃO AVANÇADO

## ⚡ Como Usar o Novo Sistema

### 1️⃣ Configuração Inicial

Acesse as **Configurações** do sistema e defina:

```javascript
// Já está configurado com valores padrão:
Meta de Crescimento: 20%      // Quanto você quer crescer
Fator de Segurança: 3 dias    // Buffer contra imprevistos
```

### 2️⃣ Cadastrar Fornecedores com Lead Time

Ao adicionar/editar fornecedores:
```
Nome: Óptica Global
Contato: (11) 98765-4321
Lead Time: 10 dias  ⬅️ NOVO CAMPO (padrão: 7 dias)
```

### 3️⃣ Acessar Central de Compras

1. Navegue até **"Central de Compras"**
2. Veja o dashboard com:
   - 🔴 **Produtos Críticos** (estoque zero)
   - 📊 **Necessita Reposição** (abaixo do ponto de pedido)
   - 💰 **Investimento Necessário** (valor total)
   - ⚡ **Unidades a Comprar** (quantidade total)

### 4️⃣ Interpretar Sugestões

Cada produto exibe:

```
┌─────────────────────────────────────────┐
│ Ray-Ban Aviator                         │
│ 🔴 CRÍTICO | ⭐ Score: 3600.0 | 🔴 COMPRAR │
├─────────────────────────────────────────┤
│ Estoque Atual:     15                   │
│ VMD Projetada:     2.5                  │
│ Est. Segurança:    10                   │
│ Ponto Pedido:      35                   │
│ 🎯 Comprar:        20 un                │
│ 💰 Custo:          R$ 1.600,00          │
├─────────────────────────────────────────┤
│ 📈 Passo 1: VMD = 2.00 × 1.20 = 2.50   │
│ 🛡️ Passo 2: Seg = 2.50 × 3 = 10        │
│ 📍 Passo 3: PP = (2.50×10)+10 = 35     │
│ 🎯 Passo 4: Sug = 35 - 15 = 20         │
│ ⭐ Score: 60.0% × 60 = 3600.0           │
└─────────────────────────────────────────┘
```

---

## 🎯 Entendendo as Métricas

### **VMD Projetada** (Azul)
- Venda Média Diária ajustada pela meta de crescimento
- Exemplo: Se você vende 10/dia e quer crescer 20%, VMD Projetada = 12/dia

### **Estoque de Segurança** (Amarelo)
- Buffer para proteger contra atrasos ou picos de demanda
- Calculado em dias (padrão: 3 dias de VMD projetada)

### **Ponto de Pedido** (Laranja)
- Nível de estoque que dispara a reposição
- Considera: lead time do fornecedor + estoque de segurança

### **Sugestão de Compra** (Verde)
- Quantidade exata a comprar
- Garante que você atinja o ponto de pedido

### **Score de Prioridade** (Roxo)
- Maior score = maior prioridade
- Fórmula: Margem de Lucro × Volume de Vendas
- Prioriza produtos rentáveis e de alto giro

---

## 🔥 Prioridades

### 🔴 **CRÍTICO**
- Estoque ZERO
- ⚠️ Comprar IMEDIATAMENTE

### 🟠 **URGENTE**
- Score > 500 e estoque baixo
- ⏰ Comprar em 24-48h

### 🟡 **MÉDIO**
- Score > 100
- 📅 Comprar esta semana

### 🟢 **BAIXO**
- Score < 100
- 📆 Avaliar necessidade

---

## 📊 Exemplo Prático

### Cenário Real:
```
Produto: Óculos Oakley Esportivo
Vendas últimos 30 dias: 90 unidades
Estoque atual: 25 unidades
Fornecedor: SportVision (Lead Time: 5 dias)
Valor Compra: R$ 120,00
Valor Venda: R$ 300,00
```

### Cálculo Automático:
```
1. VMD = 90 ÷ 30 = 3 un/dia
2. VMD Projetada = 3 × 1.20 = 3.6 un/dia
3. Estoque Segurança = 3.6 × 3 = 11 unidades
4. Ponto de Pedido = (3.6 × 5) + 11 = 18 + 11 = 29 unidades
5. Sugestão = MAX(0, 29 - 25) = 4 unidades
```

### Investimento:
```
4 unidades × R$ 120,00 = R$ 480,00
```

### Score:
```
Margem = ((300-120)/300) × 100 = 60%
Score = 60 × 90 = 5400 pontos
🔴 PRIORIDADE: CRÍTICO
```

---

## ⚙️ Ajustar Configurações

### Crescimento Agressivo (30-50%)
```javascript
config.metaCrescimento = 50  // 50% de crescimento
```
✅ Ideal para: Lançamentos, Black Friday, campanhas

### Crescimento Conservador (5-10%)
```javascript
config.metaCrescimento = 5   // 5% de crescimento
```
✅ Ideal para: Mercados estáveis, baixa sazonalidade

### Maior Segurança (5-7 dias)
```javascript
config.fatorSeguranca = 7    // 7 dias de buffer
```
✅ Ideal para: Fornecedores instáveis, alta variação de demanda

### Menor Segurança (1-2 dias)
```javascript
config.fatorSeguranca = 1    // 1 dia de buffer
```
✅ Ideal para: Fornecedores confiáveis, demanda previsível

---

## 🛡️ Integridade de Dados

### ✅ O que está protegido:

1. **Movimentações de Entrada SEM fornecedor** → ❌ BLOQUEADO
   ```
   Erro: "Movimentação de ENTRADA requer um fornecedor válido"
   ```

2. **Produto inexistente** → ❌ BLOQUEADO
   ```
   Erro: "Produto ID 999 não encontrado. Violação de Foreign Key"
   ```

3. **Fornecedor inválido** → ❌ BLOQUEADO
   ```
   Erro: "Fornecedor ID 123 não encontrado. Violação de Foreign Key"
   ```

4. **Fornecedor sem nome/contato** → ❌ BLOQUEADO
   ```
   Erro: "Fornecedor deve ter nome e contato"
   ```

---

## 📈 Boas Práticas

### 1. **Revise Sugestões Semanalmente**
- Acesse Central de Compras toda segunda-feira
- Priorize produtos com 🔴 CRÍTICO e 🟠 URGENTE

### 2. **Ajuste Lead Times Realisticamente**
- Use o tempo REAL de entrega do fornecedor
- Considere: tempo de pedido + transporte + recebimento

### 3. **Configure Meta de Crescimento Por Período**
- **Janeiro/Fevereiro**: 10% (baixa)
- **Março-Novembro**: 20% (normal)
- **Dezembro/Black Friday**: 50% (alta)

### 4. **Monitore o Score**
- Produtos com score > 5000 → Considere comprar mais que sugerido
- Produtos com score < 100 → Avalie se vale a pena manter no catálogo

### 5. **Use Relatórios**
- Compare investimento necessário vs capital disponível
- Priorize compras por score (ROI máximo)

---

## 🎓 Dicas Avançadas

### Como Aumentar o Score de um Produto?
```
Score = Margem × Volume

Opção 1: Aumentar Margem
- Negociar melhor preço com fornecedor ✅
- Aumentar preço de venda (cuidado!) ⚠️

Opção 2: Aumentar Volume
- Marketing mais agressivo ✅
- Promoções estratégicas ✅
- Cross-selling ✅
```

### Como Reduzir Investimento Total?
```
1. Compre apenas produtos CRÍTICOS (estoque zero)
2. Ignore produtos com score < 50 (baixa prioridade)
3. Negocie melhores condições de pagamento
4. Ajuste meta de crescimento (temporariamente)
```

### Como Evitar Ruptura de Estoque?
```
1. Nunca ignore produtos CRÍTICOS
2. Aumente fator de segurança (3 → 5 dias)
3. Reduza lead time (fornecedores mais rápidos)
4. Mantenha relacionamento com fornecedores backup
```

---

## 🚨 Troubleshooting

### "Sugestão é zero mas produto está vendendo"
**Causa:** Estoque ainda acima do ponto de pedido  
**Solução:** Normal. Aguarde até atingir o ponto de pedido

### "Sugestão muito alta"
**Causa:** Meta de crescimento ou fator de segurança alto  
**Solução:** Ajuste config (reduzir crescimento ou fator)

### "Produto não aparece nas sugestões"
**Causa:** Estoque acima do ponto de pedido  
**Solução:** Produto está OK. Sugestão só aparece quando necessário

### "Score muito baixo"
**Causa:** Margem baixa OU volume baixo  
**Solução:** Avaliar se produto é estratégico ou se deve sair do catálogo

---

## 📞 Suporte

Configurações críticas:
- `src/context/DataContext.jsx` → Linha 16-22
- `src/services/ReplenishmentService.js` → Algoritmo completo
- `src/pages/PurchaseCenter.jsx` → Interface visual

---

**Sistema desenvolvido com algoritmos de Inventory Management (EOQ, Safety Stock, Reorder Point)**  
**Arquitetura Senior Software Architect Pattern**  
**Status:** ✅ Produção
