# 🧪 PLANO DE TESTES - AUREON ERP

**Objetivo**: Validar correções aplicadas na Auditoria de Código  
**Data**: 12/01/2025  
**Escopo**: Business Logic Service Integration

---

## 📋 CHECKLIST PRÉ-TESTE

- [ ] Sistema rodando em `localhost:5174`
- [ ] Console do navegador aberto (F12)
- [ ] Modo Simulação ATIVADO (para dados de teste)
- [ ] SimulationSeederService populou dados (botão "Gerar Cenário E2E")

---

## 🎯 SUITE 1: DASHBOARD CEO

### Teste 1.1: Valor Total em Estoque (CRÍTICO)
**Objetivo**: Verificar se usa `precoCusto` em vez de `preco`

**Setup**:
```javascript
// Dados de teste (via Console ou Simulation)
const produto1 = {
  nome: "Notebook Dell",
  estoque: 10,
  precoCusto: 2000,  // Custo
  preco: 3500        // Venda
};
```

**Procedimento**:
1. Ir para Dashboard (aba "Visão Geral")
2. Localizar card "Valor Total em Estoque"
3. Abrir console e executar:
```javascript
// Cálculo esperado
const esperado = 10 * 2000; // 20.000
console.log('Esperado:', esperado);

// Cálculo real (via BusinessLogic)
import('../services/BusinessLogicService.js').then(BL => {
  const produtos = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');
  const resultado = BL.default.calcularValorTotalEstoque(produtos);
  console.log('Resultado:', resultado);
  console.log('✅ PASSOU:', resultado === esperado);
});
```

**Resultado Esperado**: `R$ 20.000,00` (não R$ 35.000,00)

**Status**: [ ] PASSOU  [ ] FALHOU

---

### Teste 1.2: Segmentação RFM - Cliente VIP
**Objetivo**: Verificar classificação correta de clientes VIP

**Setup**:
```javascript
// Cliente de teste
const clienteVIP = {
  nome: "João Silva",
  vendas: [
    { data: '01/01/2025', valorVenda: 1000 },
    { data: '05/01/2025', valorVenda: 1500 },
    { data: '08/01/2025', valorVenda: 2000 },
    { data: '10/01/2025', valorVenda: 1500 },
    { data: '12/01/2025', valorVenda: 1000 }
  ]
  // Total: 5 compras, R$ 7.000, última há ~3 dias
};
```

**Procedimento**:
1. Ir para Dashboard → Aba "CRM"
2. Procurar cliente "João Silva"
3. Verificar badge de segmento
4. Validar no console:
```javascript
import('../services/BusinessLogicService.js').then(BL => {
  const clientes = JSON.parse(localStorage.getItem('aureon_sim_clientes') || '[]');
  const vendas = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]');
  
  const clientesRFM = BL.default.calcularRFMClientes(clientes, vendas);
  const joao = clientesRFM.find(c => c.nome === 'João Silva');
  
  console.log('RFM:', joao.rfm);
  console.log('Score:', joao.score);
  console.log('Segmento:', joao.segmento);
  console.log('✅ É VIP:', joao.segmento === 'VIP');
});
```

**Resultado Esperado**:
- `rfm.recencia < 30` ✅
- `rfm.frequencia >= 5` ✅
- `rfm.monetario >= 5000` ✅
- `score >= 13` ✅
- `segmento === 'VIP'` ✅

**Status**: [ ] PASSOU  [ ] FALHOU

---

### Teste 1.3: Cliente Dormindo
**Objetivo**: Verificar detecção de clientes inativos

**Setup**:
```javascript
const clienteDormindo = {
  nome: "Maria Santos",
  vendas: [
    { data: '01/08/2024', valorVenda: 500 } // Última compra há 5+ meses
  ]
};
```

**Procedimento**:
1. Verificar que cliente aparece na lista "Inativos"
2. Validar segmento:
```javascript
// No console
const clientesRFM = BL.default.calcularRFMClientes(clientes, vendas);
const maria = clientesRFM.find(c => c.nome === 'Maria Santos');
console.log('✅ DORMINDO:', maria.segmento === 'DORMINDO');
```

**Resultado Esperado**: `segmento === 'DORMINDO'`

**Status**: [ ] PASSOU  [ ] FALHOU

---

## 🎯 SUITE 2: ESTOQUE & MOVIMENTAÇÕES

### Teste 2.1: Criação Automática de Movimentação na Venda
**Objetivo**: Verificar que vendas geram histórico automático

**Procedimento**:
1. Antes da venda, contar movimentações:
```javascript
const antes = JSON.parse(localStorage.getItem('aureon_sim_movimentacoes') || '[]').length;
console.log('Movimentações antes:', antes);
```

2. Criar venda (via PDV ou botão de teste):
   - Produto: "Mouse Logitech"
   - Quantidade: 2
   - Cliente: "João Silva"

3. Verificar movimentação criada:
```javascript
const depois = JSON.parse(localStorage.getItem('aureon_sim_movimentacoes') || '[]');
console.log('Movimentações depois:', depois.length);
console.log('Nova movimentação:', depois[0]);

// Validações
const ultimaMov = depois[0];
console.log('✅ Tipo correto:', ultimaMov.tipo === 'SAIDA');
console.log('✅ Motivo correto:', ultimaMov.motivo === 'Venda');
console.log('✅ Quantidade correta:', ultimaMov.quantidade === 2);
console.log('✅ Tem vendaId:', !!ultimaMov.vendaId);
```

**Resultado Esperado**:
- Quantidade de movimentações aumentou em +1
- `tipo === 'SAIDA'`
- `motivo === 'Venda'`
- `quantidade === 2`
- `vendaId` presente

**Status**: [ ] PASSOU  [ ] FALHOU

---

### Teste 2.2: Dedução de Estoque por Canal
**Objetivo**: Verificar que estoque é deduzido do canal correto

**Procedimento**:
1. Capturar estoque inicial:
```javascript
const produtos = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');
const mouse = produtos.find(p => p.nome === 'Mouse Logitech');
const estoqueInicial = mouse.estoqueCanais['Mercado Livre'] || 0;
console.log('Estoque ML antes:', estoqueInicial);
```

2. Criar venda:
   - Produto: "Mouse Logitech"
   - Canal: "Mercado Livre"
   - Quantidade: 1

3. Verificar dedução:
```javascript
const produtosApos = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');
const mouseApos = produtosApos.find(p => p.nome === 'Mouse Logitech');
const estoqueDepois = mouseApos.estoqueCanais['Mercado Livre'] || 0;
console.log('Estoque ML depois:', estoqueDepois);
console.log('✅ Deduzido:', estoqueDepois === estoqueInicial - 1);
```

**Resultado Esperado**: `estoqueDepois === estoqueInicial - 1`

**Status**: [ ] PASSOU  [ ] FALHOU

---

## 🎯 SUITE 3: CENTRO DE COMPRAS

### Teste 3.1: Sugestões de Reposição (Produto Crítico)
**Objetivo**: Verificar detecção de produtos zerados/baixos

**Setup**:
```javascript
// Criar produto com estoque crítico
const produtoCritico = {
  nome: "Teclado Mecânico",
  estoque: 1,  // Muito baixo
  precoCusto: 150,
  fornecedorId: 'forn_001'
};

// Simular vendas recentes (alta demanda)
const vendasTeclado = [
  { produtoId: produtoCritico.id, data: '10/01/2025', quantidade: 2 },
  { produtoId: produtoCritico.id, data: '11/01/2025', quantidade: 1 },
  { produtoId: produtoCritico.id, data: '12/01/2025', quantidade: 3 }
];
// Giro médio: 2 unid/dia
```

**Procedimento**:
1. Ir para "Centro de Compras" → Aba "Sugestões"
2. Localizar "Teclado Mecânico" na lista
3. Verificar prioridade e cálculo:
```javascript
import('../services/BusinessLogicService.js').then(BL => {
  const produtos = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');
  const vendas = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]');
  const fornecedores = JSON.parse(localStorage.getItem('aureon_sim_fornecedores') || '[]');
  
  const sugestoes = BL.default.gerarSugestoesReposicao(
    produtos, vendas, fornecedores,
    { metaCrescimento: 20, diasSeguranca: 3 }
  );
  
  const teclado = sugestoes.find(s => s.produto.nome === 'Teclado Mecânico');
  console.log('Sugestão:', teclado);
  console.log('✅ Prioridade CRÍTICA:', teclado.prioridade === 'CRITICA');
  console.log('✅ Quantidade > 0:', teclado.quantidadeComprar > 0);
  console.log('✅ Investimento calculado:', teclado.investimento > 0);
});
```

**Resultado Esperado**:
- Produto aparece na lista de sugestões
- `prioridade === 'CRITICA'` (estoque zerado)
- `quantidadeComprar > 0`
- `investimento === quantidadeComprar × precoCusto`
- `diasRestantes < 1` (crítico)

**Status**: [ ] PASSOU  [ ] FALHOU

---

### Teste 3.2: Cálculo de Giro de Estoque
**Objetivo**: Validar média de vendas por dia

**Procedimento**:
```javascript
import('../services/BusinessLogicService.js').then(BL => {
  const produtos = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');
  const vendas = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]');
  
  const notebook = produtos.find(p => p.nome === 'Notebook Dell');
  const giro = BL.default.calcularGiroEstoque(vendas, notebook, 30);
  
  console.log('Giro (vendas/dia):', giro);
  console.log('✅ Giro > 0:', giro > 0);
  
  // Validar manualmente
  const vendasNotebook = vendas.filter(v => v.produtoId === notebook.id);
  const totalQtd = vendasNotebook.reduce((acc, v) => acc + (v.quantidade || 1), 0);
  const esperado = totalQtd / 30;
  console.log('✅ Cálculo correto:', Math.abs(giro - esperado) < 0.01);
});
```

**Resultado Esperado**: Giro calculado corretamente (total vendas / 30 dias)

**Status**: [ ] PASSOU  [ ] FALHOU

---

### Teste 3.3: Análise de Fornecedor (Valor de Estoque)
**Objetivo**: Verificar se usa precoCusto na análise

**Procedimento**:
1. Ir para "Centro de Compras" → Aba "Fornecedores"
2. Clicar em fornecedor "TechSupply"
3. Verificar "Valor em Estoque" no console:
```javascript
const fornecedores = JSON.parse(localStorage.getItem('aureon_sim_fornecedores') || '[]');
const produtos = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');

const techSupply = fornecedores.find(f => f.nome === 'TechSupply');
const produtosForn = produtos.filter(p => p.fornecedorId === techSupply.id);

const valorEstoque = produtosForn.reduce((acc, p) => {
  const custo = p.precoCusto || p.valorCompra || 0;
  return acc + (p.estoque * custo);
}, 0);

console.log('Valor em Estoque (custo):', valorEstoque);
console.log('✅ Usa precoCusto:', valorEstoque < produtosForn.reduce((acc, p) => acc + (p.estoque * p.preco), 0));
```

**Resultado Esperado**: Valor baseado em `precoCusto` (menor que se usar `preco`)

**Status**: [ ] PASSOU  [ ] FALHOU

---

## 🎯 SUITE 4: INTEGRIDADE DE DADOS

### Teste 4.1: Transação Atômica (Venda Completa)
**Objetivo**: Verificar que venda executa todos os passos

**Procedimento**:
1. Capturar estados iniciais:
```javascript
const produtosAntes = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]').length;
const vendasAntes = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]').length;
const movimsAntes = JSON.parse(localStorage.getItem('aureon_sim_movimentacoes') || '[]').length;
```

2. Criar venda (produto: "Mouse Logitech", qtd: 1)

3. Verificar TODAS as operações:
```javascript
const produtosDepois = JSON.parse(localStorage.getItem('aureon_sim_produtos') || '[]');
const vendasDepois = JSON.parse(localStorage.getItem('aureon_sim_vendas') || '[]');
const movimsDepois = JSON.parse(localStorage.getItem('aureon_sim_movimentacoes') || '[]');

console.log('✅ Venda criada:', vendasDepois.length === vendasAntes + 1);
console.log('✅ Estoque deduzido:', /* verificar manualmente */);
console.log('✅ Movimentação registrada:', movimsDepois.length === movimsAntes + 1);
console.log('✅ totalVendido incrementado:', /* verificar produto */);
```

**Resultado Esperado**: 
- ✅ Venda criada em `aureon_sim_vendas`
- ✅ Estoque deduzido do produto
- ✅ Movimentação criada em `aureon_sim_movimentacoes`
- ✅ `produto.totalVendido` incrementado
- ✅ `produto.vendidosPorCanal[canal]` incrementado

**Status**: [ ] PASSOU  [ ] FALHOU

---

## 📊 RESULTADOS

### Resumo
| Suite | Testes | Passou | Falhou | Taxa |
|-------|--------|--------|--------|------|
| Dashboard CEO | 3 | - | - | -% |
| Estoque & Movimentações | 2 | - | - | -% |
| Centro de Compras | 3 | - | - | -% |
| Integridade de Dados | 1 | - | - | -% |
| **TOTAL** | **9** | **-** | **-** | **-%** |

### Bugs Encontrados
1. [ ] _Nenhum identificado ainda_

### Melhorias Sugeridas
1. [ ] _Adicionar validação de estoque negativo_
2. [ ] _Melhorar mensagens de erro no console_

---

## 🚀 TESTES AUTOMATIZADOS (Futuro)

```javascript
// src/tests/businessLogic.test.js
import { describe, it, expect } from 'vitest';
import BusinessLogic from '../services/BusinessLogicService';

describe('BusinessLogicService', () => {
  describe('calcularValorTotalEstoque', () => {
    it('deve usar precoCusto em vez de preco', () => {
      const produtos = [
        { estoque: 10, precoCusto: 100, preco: 200 }
      ];
      const resultado = BusinessLogic.calcularValorTotalEstoque(produtos);
      expect(resultado).toBe(1000); // 10 × 100, NÃO 2000
    });
  });

  describe('calcularRFMClientes', () => {
    it('deve classificar cliente como VIP', () => {
      const clientes = [{ id: 1, nome: 'João' }];
      const vendas = [
        { clienteId: 1, data: '12/01/2025', valorVenda: 2000 },
        { clienteId: 1, data: '10/01/2025', valorVenda: 1500 },
        { clienteId: 1, data: '08/01/2025', valorVenda: 1500 },
        { clienteId: 1, data: '05/01/2025', valorVenda: 1000 },
        { clienteId: 1, data: '01/01/2025', valorVenda: 1000 }
      ];
      
      const resultado = BusinessLogic.calcularRFMClientes(clientes, vendas);
      expect(resultado[0].segmento).toBe('VIP');
      expect(resultado[0].score).toBeGreaterThanOrEqual(13);
    });
  });
});
```

---

**Executado por**: _[Nome do Testador]_  
**Data**: _[Data dos Testes]_  
**Versão**: 2.1.0
