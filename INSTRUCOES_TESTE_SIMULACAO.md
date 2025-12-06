# 🧪 INSTRUÇÕES PARA TESTAR SIMULAÇÃO

**Data**: 04/12/2025  
**Problema Corrigido**: Valor Total de Estoque e Vendas não aparecendo no Dashboard

---

## 🚀 PASSOS PARA TESTAR

### 1. Ativar Modo Simulação
1. Faça login no sistema
2. Na tela de login, clique no botão **"Modo Simulação"** (ícone de experimento)
3. Você verá uma barra vermelha no topo indicando que está em modo de teste

### 2. Gerar Dados de Teste
1. Vá para **Dashboard Executivo** (ícone de gráfico)
2. Procure o **Simulation Control Panel** (painel roxo no topo)
3. Clique no botão **"▶ Executar E2E Completo"**
4. Aguarde ~3 segundos
5. Um alerta aparecerá dizendo:
   ```
   ✅ Cenário E2E executado com sucesso!
   
   📊 Criado:
   - 5 fornecedores
   - 20 produtos
   - 10 clientes
   - 30 vendas
   ```
6. A página será recarregada automaticamente

### 3. Verificar Dashboard Executivo
Após o reload, verifique os seguintes cards:

#### Card "Receita do Mês"
- Deve mostrar valor **maior que R$ 0,00**
- Exemplo esperado: `R$ 15.000,00` a `R$ 50.000,00`

#### Card "Ticket Médio"
- Deve mostrar valor **maior que R$ 0,00**
- Exemplo esperado: `R$ 500,00` a `R$ 2.000,00`

#### Card "Margem Média"
- Deve mostrar percentual **maior que 0%**
- Exemplo esperado: `30%` a `80%`

#### Card "Taxa de Devolução"
- Pode ser `0.0%` (normal se não houver devoluções)

#### Gráfico "Evolução de Vendas"
- Deve mostrar barras com valores
- Se estiver vazio, aguardar mais vendas serem criadas

### 4. Verificar Gestão de Estoque
1. Vá para **Gestão de Estoque** (ícone de caixa)
2. Procure o card **"Valor Total"**
3. Deve mostrar valor **maior que R$ 0,00**
4. Exemplo esperado: `R$ 5.000,00` a `R$ 30.000,00`

#### Status de Produtos
- **OK**: Produtos com estoque >= 10 (verde)
- **Baixo**: Produtos com estoque < 10 (laranja)
- **Zero**: Produtos sem estoque (vermelho)

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Problema 1: "Valor Total em Estoque = R$ 0,00"
**Causa**: Produtos não têm `precoCusto` definido

**Solução**:
1. Abra o **Console do navegador** (F12)
2. Cole o script de debug (arquivo `DEBUG_SIMULATION.js`)
3. Verifique se produtos têm `precoCusto` ou `valorCompra`
4. Se não tiver, execute o cenário E2E novamente

### Problema 2: "Receita do Mês = R$ 0,00"
**Causa**: Vendas não estão sendo criadas ou campos incorretos

**Solução**:
1. Abra o Console (F12)
2. Digite:
   ```javascript
   const vendas = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]');
   console.log('Total de vendas:', vendas.length);
   console.log('Exemplo de venda:', vendas[0]);
   ```
3. Verifique se:
   - `vendas.length > 0` (tem vendas criadas)
   - `vendas[0].valorVenda` existe e é maior que 0
   - `vendas[0].data` está no formato `dd/mm/yyyy`

### Problema 3: "Vendas aparecem mas valores zerados"
**Causa**: Campo `valorVenda` incorreto ou `lucro` não calculado

**Solução**:
1. Console (F12):
   ```javascript
   const vendas = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]');
   vendas.forEach((v, i) => {
     console.log(`Venda ${i + 1}:`, {
       valorVenda: v.valorVenda,
       custoProduto: v.custoProduto,
       lucro: v.lucro
     });
   });
   ```
2. Se `valorVenda` for `undefined`, execute o cenário E2E novamente

---

## 🔍 DIAGNÓSTICO MANUAL

### Verificar Prefixo de Simulação
```javascript
// Cole no Console (F12)
const prefix = sessionStorage.getItem('simulation_mode') === 'true' ? 'aureon_sim_' : 'aureon_';
console.log('Prefixo ativo:', prefix);
```

Resultado esperado: `aureon_sim_` (se modo simulação estiver ativo)

### Verificar Dados Salvos
```javascript
// Cole no Console (F12)
const prefix = 'aureon_sim_';
const produtos = JSON.parse(localStorage.getItem(`${prefix}produtos`) || '[]');
const vendas = JSON.parse(localStorage.getItem(`${prefix}vendas`) || '[]');

console.log('📦 Produtos:', produtos.length);
console.log('💰 Vendas:', vendas.length);

// Calcular valor total em estoque
const valorEstoque = produtos.reduce((total, p) => {
  const estoque = Number(p.estoque) || 0;
  const precoCusto = Number(p.precoCusto) || Number(p.valorCompra) || 0;
  return total + (estoque * precoCusto);
}, 0);

console.log('💰 Valor Total em Estoque:', valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

// Calcular receita total
const receitaTotal = vendas.reduce((total, v) => {
  return total + (Number(v.valorVenda) || 0);
}, 0);

console.log('💰 Receita Total:', receitaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
```

### Limpar Dados de Simulação
Se quiser recomeçar do zero:

```javascript
// Cole no Console (F12)
const prefix = 'aureon_sim_';
const tables = ['produtos', 'vendas', 'fornecedores', 'clientes', 'movimentacoes'];

tables.forEach(table => {
  localStorage.removeItem(`${prefix}${table}`);
});

console.log('✅ Dados de simulação limpos! Recarregue a página.');
location.reload();
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Modo Simulação ativado (barra vermelha visível)
- [ ] Cenário E2E executado (alerta de sucesso recebido)
- [ ] Dashboard CEO mostra valores > R$ 0,00
- [ ] Estoque mostra "Valor Total" > R$ 0,00
- [ ] Produtos aparecem na listagem (20 produtos)
- [ ] Vendas aparecem no histórico (30 vendas)
- [ ] Console não mostra erros críticos (F12)

---

## 📊 VALORES ESPERADOS

### Dashboard Executivo
| Métrica | Valor Esperado |
|---------|----------------|
| Receita do Mês | R$ 15.000 - R$ 50.000 |
| Ticket Médio | R$ 500 - R$ 2.000 |
| Margem Média | 30% - 80% |
| Vendas (quantidade) | 30 vendas |

### Gestão de Estoque
| Métrica | Valor Esperado |
|---------|----------------|
| Total Produtos | 20 produtos |
| Valor Total | R$ 5.000 - R$ 30.000 |
| Estoque Total | 500 - 2.000 unidades |

---

## 🆘 SUPORTE

Se os problemas persistirem após seguir estas instruções:

1. Tire **screenshots** do:
   - Dashboard Executivo (card Receita do Mês)
   - Gestão de Estoque (card Valor Total)
   - Console do navegador (F12 → aba Console)

2. Execute o script de debug completo:
   ```javascript
   // Cole no Console
   const script = document.createElement('script');
   script.src = '/DEBUG_SIMULATION.js';
   document.body.appendChild(script);
   ```

3. Copie os logs do console e envie para análise

---

**Última atualização**: 04/12/2025  
**Versão**: 2.1.1 (Correção de Simulação)
