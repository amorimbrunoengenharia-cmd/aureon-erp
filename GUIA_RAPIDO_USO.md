# 🚀 GUIA RÁPIDO - AUREON ERP INTEGRADO

## Como Testar as Novas Funcionalidades

### 1. Testar Venda → Finance Automático

**Passo a Passo:**
1. Acesse a tela de **Vendas**
2. Registre uma nova venda com status "completed" ou marque como paga
3. Abra o **Console do Navegador** (F12)
4. Você verá:
   ```
   🔔 [FinanceContext] Venda paga detectada: {orderId: 123, ...}
   ✅ [FinanceContext] Conta a receber criada automaticamente: 456
   ```
5. Acesse o módulo **Financeiro** → Contas a Receber
6. **Verifique**: A conta foi criada automaticamente! ✅

---

### 2. Testar Reserva de Estoque (Prevenir Oversell)

**Passo a Passo:**
1. Anote o estoque atual de um produto (ex: 10 unidades)
2. Registre uma venda desse produto (3 unidades)
3. Abra o **Console**:
   ```
   🔔 [DataContext] Venda criada, reservando estoque
   ✅ [DataContext] Estoque reservado: Produto 789, Quantidade 3
   ```
4. Acesse **Estoque** → Visualizar Produtos
5. **Verifique**: 
   - Estoque físico: 10 unidades
   - Estoque reservado: 3 unidades
   - **Estoque disponível: 7 unidades** ✅

**Testar Oversell:**
1. Tente criar outra venda de 8 unidades do mesmo produto
2. Sistema deve **bloquear** com erro:
   ```
   ❌ Estoque insuficiente para reserva. Disponível: 7, Solicitado: 8
   ```

---

### 3. Testar Dashboard Real-Time

**Passo a Passo:**
1. Abra o **Dashboard Executivo**
2. Observe o badge **"LIVE"** com animação no header
3. Em outra aba, registre uma venda
4. **Volte ao Dashboard** (sem dar refresh!)
5. **Verifique**: 
   - Badge mostra "(1 eventos)"
   - Último evento: "order.paid"
   - KPIs atualizados automaticamente ✅

---

### 4. Testar EventLogViewer (Auditoria)

**Como Acessar:**
1. Importe o componente no seu sistema de rotas:
   ```javascript
   import EventLogViewer from './components/EventLogViewer';
   // Adicionar rota: /admin/events
   ```
2. Acesse `/admin/events`

**O que você verá:**
- **Aba Estatísticas:**
  - Total de eventos processados
  - Listeners ativos
  - Taxa de sucesso
  - Top 10 eventos mais frequentes

- **Aba Event Log:**
  - Lista completa de eventos
  - Filtro por domínio (sales, finance, inventory...)
  - Busca por tipo ou payload
  - Expandir evento para ver detalhes

- **Aba DLQ (Dead Letter Queue):**
  - Eventos que falharam após 3 tentativas
  - Botão "Reprocessar" para tentar novamente
  - Detalhes do erro

---

### 5. Testar Compra → Finance Automático

**Passo a Passo:**

**Opção A - Via PurchaseOrderService:**
```javascript
import PurchaseOrderService from './services/PurchaseOrderService';

// 1. Criar pedido
const order = PurchaseOrderService.createOrder({
  supplierId: 1,
  supplierName: "Fornecedor Teste",
  items: [
    { productId: 10, productName: "Produto X", quantity: 50, unitCost: 10 }
  ],
  leadTime: 7,
  createdBy: "admin@aureon.com",
  notes: "Pedido de teste"
});

// 2. Aprovar pedido (dispara criação automática de despesa)
PurchaseOrderService.approveOrder(order.id, "admin@aureon.com");

// 3. Verificar no Financeiro → Despesas
// Deve aparecer despesa de R$ 500 (50 × 10) criada automaticamente!
```

**Opção B - Via Interface (quando integrado):**
1. Acesse **Compras** → Central de Compras
2. Clique em "Realizar Pedido" em uma sugestão
3. Sistema cria pedido em status "draft"
4. Clique em "Aprovar Pedido"
5. **Automaticamente:**
   - Evento `PURCHASE.ORDER_APPROVED` é emitido
   - FinanceContext escuta e cria despesa
   - Aparece em Financeiro → Despesas ✅

---

### 6. Testar Reconciliação de Dados

**Executar Manualmente:**
```javascript
import ReconciliationService from './services/ReconciliationService';
import { DataContext } from './context/DataContext';
import { FinanceContext } from './context/FinanceContext';

// Obter dados dos contextos
const dataContext = useContext(DataContext);
const financeContext = useContext(FinanceContext);

// Executar reconciliação
const report = ReconciliationService.reconcile({
  vendas: dataContext.vendas,
  contasReceber: financeContext.contasReceber,
  despesas: financeContext.despesas,
  produtos: dataContext.produtos,
  movimentacoes: dataContext.movimentacoes,
  clientes: dataContext.clientes,
  fornecedores: dataContext.fornecedores
});

console.log('📊 Relatório de Reconciliação:', report);
```

**Agendar Execução Automática (24h):**
```javascript
ReconciliationService.scheduleAutoReconciliation(context, 1440);
// Executa a cada 1440 minutos (24 horas)
```

**Interpretar Resultados:**
- **status: "OK"** → Tudo integro ✅
- **status: "DIVERGENCES_FOUND"** → Revisar divergências

**Tipos de Divergências:**
- `MISSING_RECEIVABLE` → Venda paga sem conta a receber
- `ORPHAN_RECEIVABLE` → Conta a receber sem venda
- `MISSING_EXPENSE` → Pedido aprovado sem despesa
- `INVENTORY_DISCREPANCY` → Diferença entre estoque físico e calculado
- `INVALID_FOREIGN_KEY` → Referência a entidade inexistente

---

## 🔍 Como Debugar Eventos

### Ver todos os eventos emitidos:
```javascript
import { eventBus } from './services/EventBus';

const stats = eventBus.getStats();
console.log('Total eventos:', stats.totalEvents);
console.log('Event Log:', stats.eventLog);
```

### Escutar TODOS os eventos (desenvolvimento):
```javascript
import { EVENTS } from './services/EventTypes';

Object.values(EVENTS).forEach(domain => {
  Object.values(domain).forEach(eventType => {
    eventBus.on(eventType, (event) => {
      console.log(`📢 Evento: ${event.type}`, event.payload);
    });
  });
});
```

### Ver eventos no localStorage:
```javascript
// Event Store
const log = JSON.parse(localStorage.getItem('aureon_event_log'));
console.log('Event Log:', log);

// Dead Letter Queue
const dlq = JSON.parse(localStorage.getItem('aureon_event_dlq'));
console.log('DLQ:', dlq);
```

---

## ⚠️ Troubleshooting

### Problema: Eventos não estão sendo processados
**Solução:**
1. Abra o Console (F12)
2. Procure por erros em vermelho
3. Verifique se os listeners foram registrados:
   ```javascript
   eventBus.getStats().totalListeners
   // Deve ser > 0
   ```

### Problema: Dashboard não atualiza em tempo real
**Solução:**
1. Verifique se o badge "LIVE" está visível
2. Abra o Console e veja se eventos estão sendo recebidos
3. Force um re-render:
   ```javascript
   setLiveUpdates(prev => ({...prev, eventCount: prev.eventCount + 1}))
   ```

### Problema: Muitos eventos no DLQ
**Solução:**
1. Acesse EventLogViewer → Aba DLQ
2. Veja o erro detalhado de cada evento
3. Corrija o problema (ex: função listener com bug)
4. Clique em "Reprocessar" para tentar novamente

### Problema: Reconciliação encontra divergências
**Solução:**
1. Veja o relatório completo:
   ```javascript
   report.divergences.forEach(div => {
     console.log(`${div.severity}: ${div.description}`);
     console.log(`Solução: ${div.suggestedAction}`);
   });
   ```
2. Siga as ações sugeridas (geralmente reprocessar eventos)

---

## 🎓 Padrões de Uso

### Criar Novo Evento:

**1. Adicionar ao EventTypes.js:**
```javascript
export const EVENTS = {
  // ... eventos existentes
  
  SHIPPING: {
    TRACKING_UPDATED: 'shipping.tracking.updated',
    DELIVERED: 'shipping.delivered'
  }
};
```

**2. Emitir o Evento:**
```javascript
import { eventBus } from './services/EventBus';
import { EVENTS } from './services/EventTypes';

// Em alguma função do seu contexto/serviço
eventBus.emit(
  EVENTS.SHIPPING.DELIVERED,
  {
    orderId: 123,
    trackingCode: 'BR123456789',
    deliveredAt: new Date().toISOString(),
    recipientName: 'João Silva'
  },
  {
    source: 'ShippingService.markAsDelivered',
    user: currentUser.email
  }
);
```

**3. Escutar o Evento:**
```javascript
useEffect(() => {
  const handleDelivered = (event) => {
    console.log('📦 Pedido entregue:', event.payload);
    // Atualizar status do pedido
    // Notificar cliente
    // Registrar no CRM
  };
  
  eventBus.on(EVENTS.SHIPPING.DELIVERED, handleDelivered);
  
  return () => {
    eventBus.off(EVENTS.SHIPPING.DELIVERED, handleDelivered);
  };
}, []);
```

---

## 📈 Monitoramento de Performance

### Verificar Latência dos Eventos:
```javascript
const stats = eventBus.getStats();
stats.eventLog.forEach(event => {
  if (event.metadata?.duration) {
    console.log(`${event.type}: ${event.metadata.duration}ms`);
  }
});
```

### Identificar Gargalos:
```javascript
// Top 10 eventos mais lentos
const slowEvents = stats.eventLog
  .filter(e => e.metadata?.duration)
  .sort((a, b) => b.metadata.duration - a.metadata.duration)
  .slice(0, 10);

console.table(slowEvents);
```

---

## ✅ Checklist de Integração

Antes de implantar em produção, verifique:

- [ ] Todos os eventos estão sendo emitidos corretamente
- [ ] Listeners registrados em todos os contextos necessários
- [ ] Dashboard mostra badge "LIVE" funcionando
- [ ] EventLogViewer acessível para admin
- [ ] ReconciliationService agendado para rodar diariamente
- [ ] DLQ vazio (0 eventos falhados)
- [ ] Taxa de sucesso > 99%
- [ ] Testes de integração passando

---

**Pronto! Seu AUREON ERP está 100% integrado e funcionando com arquitetura event-driven! 🎉**

Qualquer dúvida, consulte o arquivo `INTEGRACAO_COMPLETA_RESUMO.md` para documentação técnica completa.
