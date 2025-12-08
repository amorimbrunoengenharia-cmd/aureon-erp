# Guia de Testes de Integração - Sistema Event-Driven

## Visão Geral

Este documento descreve os cenários de teste para validar a integração completa do sistema event-driven com propagação de `trace_id` entre módulos.

## Objetivos dos Testes

- ✅ Validar propagação de `trace_id` em toda cadeia de eventos
- ✅ Verificar automações entre módulos (vendas → estoque → finanças)
- ✅ Confirmar funcionamento do EventLogger e rastreabilidade
- ✅ Testar CEOMetricsService com dados reais
- ✅ Validar ReconciliationService detecta divergências
- ✅ Verificar DLQ (Dead Letter Queue) em cenários de erro

---

## 1. Teste de Fluxo Completo: Venda com Pagamento

### Objetivo
Validar que uma venda gera eventos em cascata: criação → reserva de estoque → pagamento → receivable → métricas

### Passos

1. **Preparação**
   ```javascript
   // Limpar logs anteriores
   eventLogger.clearLogs();
   
   // Criar produto no estoque
   const produto = {
     nome: "Produto Teste",
     codigo: "TEST-001",
     quantidade: 100,
     preco: 50.00
   };
   ```

2. **Criar Pedido de Venda**
   ```javascript
   const pedido = {
     clienteId: 1,
     clienteNome: "Cliente Teste",
     items: [
       { produtoId: produto.id, quantidade: 5, precoUnitario: 50.00 }
     ],
     total: 250.00,
     status: "aprovado"
   };
   
   // Ação: addPedidoVenda(pedido)
   // Evento esperado: SALES.ORDER_CREATED
   ```

3. **Verificar Reserva de Estoque**
   ```javascript
   // Verificar no EventLogger
   const logs = eventLogger.search({ event_type: 'INVENTORY.STOCK_RESERVED' });
   
   // Validações:
   // ✓ Log existe com mesmo trace_id do pedido
   // ✓ Quantidade reservada = 5
   // ✓ Estoque disponível reduzido de 100 para 95
   // ✓ Estoque reservado aumentado em 5
   ```

4. **Confirmar Pagamento**
   ```javascript
   // Ação: marcarPedidoPago(pedidoId, 'PIX', contaBancariaId)
   // Eventos esperados:
   // - SALES.ORDER_PAID
   // - FINANCE.RECEIVABLE_CREATED (automático)
   // - FINANCE.PAYMENT_RECEIVED (automático)
   ```

5. **Validar Trace History**
   ```javascript
   const traceHistory = eventLogger.getTraceHistory(trace_id);
   
   // Deve conter na ordem:
   // 1. SALES.ORDER_CREATED
   // 2. INVENTORY.STOCK_RESERVED
   // 3. SALES.ORDER_PAID
   // 4. FINANCE.RECEIVABLE_CREATED
   // 5. FINANCE.PAYMENT_RECEIVED
   
   console.log('✅ Cadeia completa de eventos com trace_id:', trace_id);
   ```

6. **Verificar Métricas CEO**
   ```javascript
   const metrics = ceoMetricsService.getMetrics();
   
   // Validações:
   // ✓ sales.total aumentou em R$ 250
   // ✓ sales.count aumentou em 1
   // ✓ finance.revenue aumentou em R$ 250
   // ✓ inventory.totalValue reflete estoque reservado
   ```

7. **Executar Reconciliação**
   ```javascript
   const report = await reconciliationService.reconcile();
   
   // Validações:
   // ✓ Sem divergências críticas
   // ✓ Vendas = Receivables
   // ✓ Estoque físico + reservado = total
   ```

### Resultado Esperado
✅ **SUCESSO**: Todos eventos propagados com mesmo trace_id, automações funcionando, métricas atualizadas, reconciliação OK

---

## 2. Teste de Cancelamento de Pedido

### Objetivo
Validar liberação de estoque reservado quando pedido é cancelado

### Passos

1. **Criar pedido aprovado** (mesmo processo do Teste 1)
2. **Cancelar pedido**
   ```javascript
   // Ação: cancelarPedido(pedidoId, motivo)
   // Evento esperado: SALES.ORDER_CANCELLED
   ```

3. **Verificar Liberação de Estoque**
   ```javascript
   const logs = eventLogger.search({ event_type: 'INVENTORY.STOCK_RELEASED' });
   
   // Validações:
   // ✓ Estoque reservado volta para disponível
   // ✓ Mesmo trace_id do pedido original
   // ✓ EventLogger registra liberação
   ```

4. **Verificar Métricas**
   ```javascript
   // Vendas canceladas devem reduzir métricas totais
   // ✓ sales.total reduzido
   // ✓ inventory disponível restaurado
   ```

### Resultado Esperado
✅ **SUCESSO**: Estoque liberado corretamente, trace_id propagado, métricas ajustadas

---

## 3. Teste de Expedição (Shipment)

### Objetivo
Validar redução de estoque físico ao despachar pedido

### Passos

1. **Criar pedido aprovado e pago**
2. **Despachar pedido**
   ```javascript
   // Ação: despacharPedido(pedidoId, tracking)
   // Evento esperado: SHIPMENT.DISPATCHED
   ```

3. **Verificar Redução de Estoque**
   ```javascript
   const logs = eventLogger.search({ event_type: 'INVENTORY.STOCK_SHIPPED' });
   
   // Validações:
   // ✓ Estoque reservado reduzido
   // ✓ Estoque físico reduzido
   // ✓ Trace_id propagado do pedido original
   ```

### Resultado Esperado
✅ **SUCESSO**: Estoque físico reduzido, reserva liberada, trace_id mantido

---

## 4. Teste de Compras: Pedido Aprovado → Despesa

### Objetivo
Validar criação automática de despesa quando pedido de compra é aprovado

### Passos

1. **Criar pedido de compra**
   ```javascript
   const pedidoCompra = {
     fornecedorId: 1,
     fornecedorNome: "Fornecedor Teste",
     items: [
       { produtoId: 1, quantidade: 50, precoUnitario: 30.00 }
     ],
     total: 1500.00,
     status: "pendente"
   };
   ```

2. **Aprovar pedido**
   ```javascript
   // Ação: aprovarPedidoCompra(pedidoId)
   // Evento esperado: PURCHASE.ORDER_APPROVED
   ```

3. **Verificar Criação Automática de Despesa**
   ```javascript
   const logs = eventLogger.search({ event_type: 'FINANCE.EXPENSE_CREATED' });
   
   // Validações:
   // ✓ Despesa criada automaticamente
   // ✓ Valor = R$ 1.500
   // ✓ Trace_id do pedido de compra propagado
   // ✓ Status inicial = "pendente"
   ```

4. **Receber Nota Fiscal**
   ```javascript
   // Ação: receberNotaFiscal(pedidoId, nfNumero, data)
   // Evento esperado: PURCHASE.INVOICE_RECEIVED
   ```

5. **Verificar Atualização da Despesa**
   ```javascript
   // Validações:
   // ✓ Despesa vinculada atualizada com NF
   // ✓ Trace_id propagado
   // ✓ EventLogger registra vinculação
   ```

### Resultado Esperado
✅ **SUCESSO**: Despesa criada automaticamente, NF vinculada, trace_id completo

---

## 5. Teste de Erro e Dead Letter Queue

### Objetivo
Validar que eventos com erro são salvos na DLQ e podem ser reprocessados

### Passos

1. **Simular Erro no Listener**
   ```javascript
   // Temporariamente forçar erro em um listener
   eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
     throw new Error('Erro simulado para teste DLQ');
   });
   ```

2. **Criar Pedido**
   ```javascript
   // Ação: addPedidoVenda(pedido)
   // Evento esperado: Erro capturado, evento vai para DLQ
   ```

3. **Verificar DLQ**
   ```javascript
   const dlq = eventBus.getDLQ();
   
   // Validações:
   // ✓ Evento está na DLQ
   // ✓ Retry count = 3 (após backoff)
   // ✓ Error message registrado
   // ✓ Trace_id preservado
   ```

4. **Reprocessar da DLQ**
   ```javascript
   // Corrigir listener (remover erro)
   // Ação: eventBus.retryFromDLQ(eventId)
   // Validação: Evento processado com sucesso
   ```

### Resultado Esperado
✅ **SUCESSO**: Erro capturado, DLQ funcionando, retry com backoff, reprocessamento OK

---

## 6. Teste de Reconciliação com Divergência

### Objetivo
Validar que ReconciliationService detecta inconsistências

### Passos

1. **Criar Cenário com Divergência**
   ```javascript
   // Método 1: Editar localStorage diretamente
   const vendas = JSON.parse(localStorage.getItem('aureon_pedidos_venda'));
   vendas[0].total = 9999999; // Valor inválido
   localStorage.setItem('aureon_pedidos_venda', JSON.stringify(vendas));
   ```

2. **Executar Reconciliação**
   ```javascript
   const report = await reconciliationService.reconcile();
   
   // Validações:
   // ✓ Divergência detectada no módulo "vendas"
   // ✓ Tipo: "critical"
   // ✓ Descrição clara do problema
   ```

3. **Verificar Dashboard**
   ```javascript
   // Acessar ReconciliationDashboard
   // Validações visuais:
   // ✓ Card "Divergências Críticas" em vermelho
   // ✓ Lista de divergências mostra problema
   // ✓ Timestamp correto
   ```

4. **Corrigir e Re-reconciliar**
   ```javascript
   // Restaurar valor correto
   // Executar nova reconciliação
   // Validação: Sem divergências
   ```

### Resultado Esperado
✅ **SUCESSO**: Divergência detectada, dashboard atualizado, correção validada

---

## 7. Teste de Performance: 100 Eventos Simultâneos

### Objetivo
Validar que EventBus aguenta carga e trace_id não se perde

### Passos

1. **Criar 100 Pedidos Rapidamente**
   ```javascript
   const startTime = performance.now();
   const trace_ids = [];
   
   for (let i = 0; i < 100; i++) {
     const pedido = {
       clienteId: i,
       clienteNome: `Cliente ${i}`,
       items: [{ produtoId: 1, quantidade: 1, precoUnitario: 10 }],
       total: 10,
       status: "aprovado"
     };
     
     const result = addPedidoVenda(pedido);
     trace_ids.push(result.trace_id);
   }
   
   const endTime = performance.now();
   console.log(`Tempo total: ${endTime - startTime}ms`);
   ```

2. **Verificar Todos Trace IDs**
   ```javascript
   trace_ids.forEach(trace_id => {
     const history = eventLogger.getTraceHistory(trace_id);
     
     // Validações:
     // ✓ Cada trace_id tem seus eventos
     // ✓ Nenhum evento perdido
     // ✓ Ordem cronológica correta
   });
   ```

3. **Verificar Métricas Finais**
   ```javascript
   const metrics = ceoMetricsService.getMetrics();
   
   // Validações:
   // ✓ sales.count = 100
   // ✓ sales.total = R$ 1.000
   // ✓ Sem erros na DLQ
   ```

### Resultado Esperado
✅ **SUCESSO**: Todos eventos processados, trace_ids únicos, métricas corretas, performance < 5s

---

## 8. Teste de Export de Logs

### Objetivo
Validar exportação de logs para análise externa

### Passos

1. **Executar Fluxo Completo** (Teste 1)
2. **Exportar Logs**
   ```javascript
   const exportData = eventLogger.exportLogs();
   
   // Validações:
   // ✓ JSON válido
   // ✓ Contém metadata (exportedAt, totalLogs)
   // ✓ Logs em ordem cronológica
   // ✓ Todos campos presentes (trace_id, level, message, context)
   ```

3. **Filtrar e Exportar**
   ```javascript
   const filtered = eventLogger.search({
     level: 'error',
     startDate: new Date('2025-12-01'),
     endDate: new Date('2025-12-31')
   });
   
   // Validação: Apenas erros de dezembro
   ```

### Resultado Esperado
✅ **SUCESSO**: Export completo, filtros funcionando, dados íntegros

---

## Checklist de Validação Final

Antes de considerar o sistema pronto para produção:

- [ ] Teste 1: Fluxo completo venda → estoque → finanças ✅
- [ ] Teste 2: Cancelamento libera estoque ✅
- [ ] Teste 3: Expedição reduz estoque físico ✅
- [ ] Teste 4: Compra aprovada cria despesa ✅
- [ ] Teste 5: DLQ captura erros ✅
- [ ] Teste 6: Reconciliação detecta divergências ✅
- [ ] Teste 7: Performance com 100 eventos ✅
- [ ] Teste 8: Export de logs funciona ✅
- [ ] Todos trace_ids únicos e rastreáveis ✅
- [ ] EventLogger sem erros de persistência ✅
- [ ] CEOMetricsService calculando corretamente ✅
- [ ] ReconciliationService sem falsos positivos ✅
- [ ] Nenhum listener vazando memória ✅
- [ ] Código sem linting errors ✅

---

## Ferramentas de Debug

### Inspecionar Evento Específico
```javascript
const trace_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
const history = eventLogger.getTraceHistory(trace_id);
console.table(history);
```

### Ver Estatísticas Globais
```javascript
const stats = eventLogger.getStats();
console.log('Total de logs:', stats.total);
console.log('Por nível:', stats.byLevel);
console.log('Por tipo:', stats.byEventType);
```

### Verificar DLQ
```javascript
const dlq = eventBus.getDLQ();
console.log('Eventos falhados:', dlq.length);
dlq.forEach(e => console.log(e.error));
```

### Métricas em Tempo Real
```javascript
ceoMetricsService.subscribe((metrics) => {
  console.log('Métricas atualizadas:', metrics);
});
```

---

## Conclusão

Este guia cobre os principais cenários de teste para validar a arquitetura event-driven. Execute todos os testes em sequência antes do deploy em produção.

**Status**: 🚀 Pronto para teste
**Última atualização**: 05/12/2025
