# 🧪 SCRIPT DE TESTES - AUREON ERP EVENT-DRIVEN

## Testes Automatizados para Validar Integração

### 1. Teste: Venda → Finance (Automático)

```javascript
// Cole este código no Console do navegador (F12)

// 1. Obter contextos
const dataContext = window.__AUREON_DATA_CONTEXT__;
const financeContext = window.__AUREON_FINANCE_CONTEXT__;

// 2. Verificar estado inicial
console.log('📊 ESTADO INICIAL:');
console.log('Contas a Receber:', financeContext.contasReceber.length);

// 3. Criar venda
const novaVenda = {
  produtoId: 1,
  produto: 'Óculos Teste',
  cliente: 'Cliente Teste',
  clienteId: 1,
  valorVenda: 150,
  quantidade: 1,
  canal: 'Pessoal',
  custoProduto: 50,
  status: 'completed' // IMPORTANTE: status completed dispara evento
};

dataContext.addVenda(novaVenda);

// 4. Aguardar processamento (assíncrono)
setTimeout(() => {
  console.log('✅ APÓS VENDA:');
  console.log('Contas a Receber:', financeContext.contasReceber.length);
  console.log('Última conta:', financeContext.contasReceber[financeContext.contasReceber.length - 1]);
  
  // Verificar se conta foi criada automaticamente
  const contaCriada = financeContext.contasReceber.find(c => c.vendaId === novaVenda.id);
  
  if (contaCriada) {
    console.log('🎉 SUCESSO! Conta a receber criada automaticamente!');
    console.log('ID da Conta:', contaCriada.id);
    console.log('Valor:', contaCriada.valorTotal);
    console.log('Status:', contaCriada.statusGeral);
  } else {
    console.error('❌ FALHA! Conta não foi criada automaticamente.');
  }
}, 1000);
```

**Resultado Esperado:**
```
📊 ESTADO INICIAL:
Contas a Receber: 5

🔔 [FinanceContext] Venda paga detectada: {orderId: 1234567890...}
✅ [FinanceContext] Conta a receber criada automaticamente: 9876543210

✅ APÓS VENDA:
Contas a Receber: 6
🎉 SUCESSO! Conta a receber criada automaticamente!
ID da Conta: 9876543210
Valor: 150
Status: recebido
```

---

### 2. Teste: Sistema de Reserva de Estoque

```javascript
// Cole este código no Console

import { eventBus } from './services/EventBus';
import { EVENTS } from './services/EventTypes';

// 1. Escolher produto
const produto = dataContext.produtos[0];
console.log('📦 Produto Teste:', produto.nome);
console.log('Estoque Físico:', produto.estoque);
console.log('Estoque Reservado:', produto.reserved || 0);
console.log('Estoque Disponível:', (produto.estoque || 0) - (produto.reserved || 0));

// 2. Criar venda (dispara reserva automática)
const venda = {
  produtoId: produto.id,
  produto: produto.nome,
  cliente: 'Cliente Teste Reserva',
  valorVenda: 200,
  quantidade: 5,
  canal: 'Pessoal',
  status: 'pending' // Status pending para testar reserva
};

dataContext.addVenda(venda);

// 3. Verificar reserva após 1 segundo
setTimeout(() => {
  const produtoAtualizado = dataContext.produtos.find(p => p.id === produto.id);
  
  console.log('✅ APÓS RESERVA:');
  console.log('Estoque Físico:', produtoAtualizado.estoque);
  console.log('Estoque Reservado:', produtoAtualizado.reserved || 0);
  console.log('Estoque Disponível:', (produtoAtualizado.estoque || 0) - (produtoAtualizado.reserved || 0));
  
  if ((produtoAtualizado.reserved || 0) >= venda.quantidade) {
    console.log('🎉 SUCESSO! Estoque reservado corretamente!');
  } else {
    console.error('❌ FALHA! Reserva não funcionou.');
  }
}, 1000);

// 4. Testar oversell (tentar vender mais do que disponível)
setTimeout(() => {
  try {
    const vendaOversell = {
      produtoId: produto.id,
      produto: produto.nome,
      quantidade: 1000, // Muito mais do que disponível
      valorVenda: 100
    };
    
    dataContext.addVenda(vendaOversell);
    console.error('❌ FALHA! Deveria ter bloqueado oversell.');
  } catch (error) {
    console.log('🎉 SUCESSO! Oversell foi bloqueado:');
    console.log('Erro:', error.message);
  }
}, 2000);
```

**Resultado Esperado:**
```
📦 Produto Teste: Óculos de Sol Premium
Estoque Físico: 50
Estoque Reservado: 0
Estoque Disponível: 50

🔔 [DataContext] Venda criada, reservando estoque
✅ [DataContext] Estoque reservado: Produto 1, Quantidade 5

✅ APÓS RESERVA:
Estoque Físico: 50
Estoque Reservado: 5
Estoque Disponível: 45
🎉 SUCESSO! Estoque reservado corretamente!

❌ Estoque insuficiente para reserva. Disponível: 45, Solicitado: 1000
🎉 SUCESSO! Oversell foi bloqueado!
```

---

### 3. Teste: Compra → Finance (Automático)

```javascript
// Cole este código no Console

import PurchaseOrderService from './services/PurchaseOrderService';

// 1. Verificar despesas iniciais
console.log('📊 Despesas Iniciais:', financeContext.despesas.length);

// 2. Criar pedido de compra
const pedido = PurchaseOrderService.createOrder({
  supplierId: 1,
  supplierName: "Fornecedor Teste",
  items: [
    {
      productId: 1,
      productName: "Óculos Aviador",
      quantity: 100,
      unitCost: 25
    },
    {
      productId: 2,
      productName: "Óculos Wayfarer",
      quantity: 50,
      unitCost: 30
    }
  ],
  leadTime: 7,
  createdBy: "teste@aureon.com",
  notes: "Pedido de teste automático"
});

console.log('✅ Pedido Criado:', pedido.id);
console.log('Valor Total:', pedido.totalCost); // (100×25) + (50×30) = 2500 + 1500 = 4000

// 3. Aprovar pedido (dispara criação automática de despesa)
PurchaseOrderService.approveOrder(pedido.id, "admin@aureon.com");

// 4. Verificar despesa criada após 1 segundo
setTimeout(() => {
  console.log('✅ Despesas Após Aprovação:', financeContext.despesas.length);
  
  const despesaCriada = financeContext.despesas.find(d => d.pedidoId === pedido.id);
  
  if (despesaCriada) {
    console.log('🎉 SUCESSO! Despesa criada automaticamente!');
    console.log('ID da Despesa:', despesaCriada.id);
    console.log('Categoria:', despesaCriada.categoria); // "Compras"
    console.log('Valor:', despesaCriada.valor); // 4000
    console.log('Status:', despesaCriada.status); // "pendente"
    console.log('Fornecedor:', despesaCriada.fornecedor);
  } else {
    console.error('❌ FALHA! Despesa não foi criada automaticamente.');
  }
}, 1000);
```

**Resultado Esperado:**
```
📊 Despesas Iniciais: 12

✅ Pedido Criado: 1234567890
Valor Total: 4000

🔔 [FinanceContext] Pedido de compra aprovado: {orderId: 1234567890...}
✅ [FinanceContext] Despesa criada automaticamente: 9876543210

✅ Despesas Após Aprovação: 13
🎉 SUCESSO! Despesa criada automaticamente!
ID da Despesa: 9876543210
Categoria: Compras
Valor: 4000
Status: pendente
Fornecedor: Fornecedor Teste
```

---

### 4. Teste: EventBus e Estatísticas

```javascript
// Cole este código no Console

import { eventBus } from './services/EventBus';

// 1. Obter estatísticas do EventBus
const stats = eventBus.getStats();

console.log('📊 ESTATÍSTICAS DO EVENT BUS:');
console.log('─────────────────────────────────');
console.log('Total de Eventos:', stats.totalEvents);
console.log('Total de Listeners:', stats.totalListeners);
console.log('Eventos no DLQ:', stats.dlqSize);
console.log('Taxa de Sucesso:', ((1 - stats.dlqSize / stats.totalEvents) * 100).toFixed(2) + '%');

console.log('\n🔥 TOP 10 EVENTOS:');
console.log('─────────────────────────────────');
stats.topEvents.slice(0, 10).forEach(([eventType, count], idx) => {
  console.log(`${idx + 1}. ${eventType}: ${count} eventos`);
});

// 2. Ver event log completo
console.log('\n📜 ÚLTIMOS 5 EVENTOS:');
console.log('─────────────────────────────────');
stats.eventLog.slice(-5).forEach(event => {
  console.log(`${event.type} | ${new Date(event.timestamp).toLocaleTimeString('pt-BR')}`);
  console.log('Payload:', event.payload);
  console.log('---');
});

// 3. Ver DLQ (eventos falhados)
if (stats.dlq.length > 0) {
  console.log('\n⚠️  DEAD LETTER QUEUE:');
  console.log('─────────────────────────────────');
  stats.dlq.forEach(item => {
    console.log(`Evento: ${item.event.type}`);
    console.log(`Erro: ${item.error.message}`);
    console.log(`Tentativas: ${item.event.retryCount || 0}`);
    console.log('---');
  });
} else {
  console.log('\n✅ DLQ VAZIA - Nenhum evento falhado!');
}
```

**Resultado Esperado:**
```
📊 ESTATÍSTICAS DO EVENT BUS:
─────────────────────────────────
Total de Eventos: 1247
Total de Listeners: 14
Eventos no DLQ: 0
Taxa de Sucesso: 100.00%

🔥 TOP 10 EVENTOS:
─────────────────────────────────
1. sales.order.paid: 423 eventos
2. finance.receivable.created: 402 eventos
3. inventory.stock.shipped: 281 eventos
4. inventory.stock.received: 189 eventos
5. finance.expense.created: 87 eventos
6. purchase.order.approved: 76 eventos
7. sales.order.created: 423 eventos
8. inventory.stock.reserved: 401 eventos
9. finance.payment.received: 134 eventos
10. system.reconciliation.completed: 12 eventos

📜 ÚLTIMOS 5 EVENTOS:
─────────────────────────────────
sales.order.paid | 14:32:45
Payload: {orderId: 123, customerId: 45, total: 150...}
---
finance.receivable.created | 14:32:45
Payload: {receivableId: 789, orderId: 123...}
---
...

✅ DLQ VAZIA - Nenhum evento falhado!
```

---

### 5. Teste: Reconciliação de Dados

```javascript
// Cole este código no Console

import ReconciliationService from './services/ReconciliationService';

// Executar reconciliação
const report = ReconciliationService.reconcile({
  vendas: dataContext.vendas,
  contasReceber: financeContext.contasReceber,
  despesas: financeContext.despesas,
  purchaseOrders: JSON.parse(localStorage.getItem('aureon_purchase_orders') || '[]'),
  produtos: dataContext.produtos,
  movimentacoes: dataContext.movimentacoes,
  clientes: dataContext.clientes,
  fornecedores: dataContext.fornecedores
});

console.log('📊 RELATÓRIO DE RECONCILIAÇÃO:');
console.log('═════════════════════════════════════');
console.log('Status:', report.status);
console.log('Tempo de Execução:', report.elapsedTimeMs + 'ms');

console.log('\n📈 RESUMO:');
console.log('─────────────────────────────────');
console.log('Total Divergências:', report.summary.totalDivergences);
console.log('Críticas:', report.summary.criticalDivergences);
console.log('Avisos:', report.summary.warningDivergences);
console.log('Informações:', report.summary.infoDivergences);

console.log('\n🔍 MÓDULOS:');
console.log('─────────────────────────────────');
console.log('Vendas ↔ Finance:', report.modules.salesReconciliation.status);
console.log('  - Vendas Pagas:', report.modules.salesReconciliation.totalSales);
console.log('  - Correspondentes:', report.modules.salesReconciliation.matched);
console.log('  - Faltando Recebível:', report.modules.salesReconciliation.missing);

console.log('\nCompras ↔ Finance:', report.modules.purchaseReconciliation.status);
console.log('  - Pedidos Aprovados:', report.modules.purchaseReconciliation.totalPurchaseOrders);
console.log('  - Correspondentes:', report.modules.purchaseReconciliation.matched);
console.log('  - Faltando Despesa:', report.modules.purchaseReconciliation.missing);

console.log('\nEstoque ↔ Movimentações:', report.modules.inventoryReconciliation.status);
console.log('  - Produtos Verificados:', report.modules.inventoryReconciliation.totalProducts);
console.log('  - Divergências:', report.modules.inventoryReconciliation.discrepancies);

if (report.divergences.length > 0) {
  console.log('\n⚠️  DIVERGÊNCIAS ENCONTRADAS:');
  console.log('═════════════════════════════════════');
  report.divergences.forEach((div, idx) => {
    console.log(`\n${idx + 1}. ${div.type} [${div.severity.toUpperCase()}]`);
    console.log(`Módulo: ${div.module}`);
    console.log(`Descrição: ${div.description}`);
    console.log(`Ação Sugerida: ${div.suggestedAction}`);
    console.log('Dados:', div.data);
  });
} else {
  console.log('\n✅ SISTEMA 100% ÍNTEGRO - Nenhuma divergência encontrada!');
}
```

**Resultado Esperado (Sistema Íntegro):**
```
📊 RELATÓRIO DE RECONCILIAÇÃO:
═════════════════════════════════════
Status: OK
Tempo de Execução: 234ms

📈 RESUMO:
─────────────────────────────────
Total Divergências: 0
Críticas: 0
Avisos: 0
Informações: 0

🔍 MÓDULOS:
─────────────────────────────────
Vendas ↔ Finance: OK
  - Vendas Pagas: 423
  - Correspondentes: 423
  - Faltando Recebível: 0

Compras ↔ Finance: OK
  - Pedidos Aprovados: 76
  - Correspondentes: 76
  - Faltando Despesa: 0

Estoque ↔ Movimentações: OK
  - Produtos Verificados: 234
  - Divergências: 0

✅ SISTEMA 100% ÍNTEGRO - Nenhuma divergência encontrada!
```

---

### 6. Teste: Dashboard Real-Time

```javascript
// TESTE MANUAL:

// 1. Abrir Dashboard Executivo
// 2. Observar badge "LIVE" no header
// 3. Em outra aba do navegador:
//    - Registrar uma venda
//    - Criar um pedido de compra
//    - Aprovar um pedido
// 4. VOLTAR ao Dashboard (SEM dar refresh!)
// 5. Verificar:
//    - Badge "LIVE" mostra contador de eventos aumentando
//    - KPIs atualizados automaticamente
//    - Último evento aparece no subtítulo

// Para testar programaticamente:

// Simular evento
eventBus.emit('sales.order.paid', {
  orderId: 999,
  total: 300
});

// Dashboard deve atualizar em < 100ms
setTimeout(() => {
  console.log('✅ Dashboard deve ter atualizado!');
  console.log('Verifique o badge LIVE e os KPIs.');
}, 100);
```

---

### 7. Teste de Carga (Performance)

```javascript
// Testar throughput do EventBus

console.log('🚀 INICIANDO TESTE DE CARGA...');

const startTime = Date.now();
const eventCount = 1000;

for (let i = 0; i < eventCount; i++) {
  eventBus.emit('test.load.event', {
    index: i,
    timestamp: Date.now()
  });
}

const endTime = Date.now();
const elapsedMs = endTime - startTime;
const throughput = (eventCount / elapsedMs * 1000).toFixed(0);

console.log('✅ TESTE CONCLUÍDO:');
console.log(`Eventos Processados: ${eventCount}`);
console.log(`Tempo Total: ${elapsedMs}ms`);
console.log(`Throughput: ${throughput} eventos/segundo`);
console.log(`Latência Média: ${(elapsedMs / eventCount).toFixed(2)}ms por evento`);

// Verificar se todos foram persistidos
const stats = eventBus.getStats();
console.log(`\n📊 Eventos no Log: ${stats.totalEvents}`);
console.log(`Eventos no DLQ: ${stats.dlqSize}`);
console.log(`Taxa de Sucesso: ${((1 - stats.dlqSize / stats.totalEvents) * 100).toFixed(2)}%`);
```

**Resultado Esperado:**
```
🚀 INICIANDO TESTE DE CARGA...
✅ TESTE CONCLUÍDO:
Eventos Processados: 1000
Tempo Total: 87ms
Throughput: 11494 eventos/segundo
Latência Média: 0.09ms por evento

📊 Eventos no Log: 2247
Eventos no DLQ: 0
Taxa de Sucesso: 100.00%
```

---

## 🎯 Checklist de Validação

Execute todos os testes acima e marque:

- [ ] Teste 1: Venda → Finance automático ✅
- [ ] Teste 2: Sistema de reserva de estoque ✅
- [ ] Teste 3: Compra → Finance automático ✅
- [ ] Teste 4: EventBus e estatísticas ✅
- [ ] Teste 5: Reconciliação de dados ✅
- [ ] Teste 6: Dashboard real-time ✅
- [ ] Teste 7: Teste de carga (performance) ✅

**Se todos os testes passarem, o sistema está 100% funcional! 🎉**

---

## 🐛 Troubleshooting

### Erro: "eventBus is not defined"
**Solução:** Importar no console:
```javascript
import { eventBus } from './services/EventBus';
```

### Erro: "Cannot read property 'addVenda' of undefined"
**Solução:** Contextos não expostos. Adicione ao App.jsx:
```javascript
window.__AUREON_DATA_CONTEXT__ = dataContext;
window.__AUREON_FINANCE_CONTEXT__ = financeContext;
```

### Performance lenta (> 100ms por evento)
**Solução:** 
1. Verificar se há listeners excessivos
2. Verificar console para erros
3. Limpar event log: `localStorage.removeItem('aureon_event_log')`

---

**Todos os testes documentados e prontos para execução! 🚀**
