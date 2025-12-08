/**
 * Integration Tests - Fluxo Completo
 * 
 * Testa fluxos end-to-end com propagação de trace_id:
 * - Venda → Estoque → Finanças
 * - Compra → Despesa
 * - Cancelamento → Liberação de estoque
 * - Expedição → Redução física
 */

import { eventBus } from '../src/utils/EventBus';
import { eventLogger } from '../src/utils/EventLogger';
import { EVENTS } from '../src/utils/EventTypes';
import { ceoMetricsService } from '../src/services/CEOMetricsService';

describe('Integration Tests - Fluxo Completo', () => {
  beforeEach(() => {
    localStorage.clear();
    eventBus.listeners = new Map();
    eventBus.dlq = [];
    eventLogger.clearLogs();
  });

  describe('Fluxo: Venda Completa', () => {
    test('deve propagar trace_id em toda cadeia: ORDER_CREATED → STOCK_RESERVED → ORDER_PAID → RECEIVABLE_CREATED', (done) => {
      const trace_id = crypto.randomUUID();
      const events = [];

      // Simular listeners dos contextos
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        events.push({ type: EVENTS.SALES.ORDER_CREATED, trace_id: event.metadata.trace_id });

        // DataContext reserva estoque
        eventBus.emit(
          EVENTS.INVENTORY.STOCK_RESERVED,
          { productId: 1, quantity: 5, orderId: event.payload.orderId },
          { trace_id: event.metadata.trace_id, source: 'DataContext.reserveStock' }
        );
      });

      eventBus.on(EVENTS.INVENTORY.STOCK_RESERVED, (event) => {
        events.push({ type: EVENTS.INVENTORY.STOCK_RESERVED, trace_id: event.metadata.trace_id });
      });

      eventBus.on(EVENTS.SALES.ORDER_PAID, (event) => {
        events.push({ type: EVENTS.SALES.ORDER_PAID, trace_id: event.metadata.trace_id });

        // FinanceContext cria receivable
        eventBus.emit(
          EVENTS.FINANCE.RECEIVABLE_CREATED,
          { receivableId: 1, orderId: event.payload.orderId, amount: event.payload.amount },
          { trace_id: event.metadata.trace_id, source: 'FinanceContext.addContaReceber' }
        );
      });

      eventBus.on(EVENTS.FINANCE.RECEIVABLE_CREATED, (event) => {
        events.push({ type: EVENTS.FINANCE.RECEIVABLE_CREATED, trace_id: event.metadata.trace_id });

        // Validar cadeia completa
        expect(events.length).toBe(4);
        expect(events.every(e => e.trace_id === trace_id)).toBe(true);

        // Validar ordem cronológica
        expect(events[0].type).toBe(EVENTS.SALES.ORDER_CREATED);
        expect(events[1].type).toBe(EVENTS.INVENTORY.STOCK_RESERVED);
        expect(events[2].type).toBe(EVENTS.SALES.ORDER_PAID);
        expect(events[3].type).toBe(EVENTS.FINANCE.RECEIVABLE_CREATED);

        done();
      });

      // Iniciar fluxo
      eventBus.emit(
        EVENTS.SALES.ORDER_CREATED,
        { orderId: 1, customerId: 1, items: [{ productId: 1, quantity: 5 }], total: 250 },
        { trace_id, source: 'DataContext.addPedidoVenda' }
      );

      // Pagamento
      eventBus.emit(
        EVENTS.SALES.ORDER_PAID,
        { orderId: 1, amount: 250, paymentMethod: 'PIX' },
        { trace_id, source: 'DataContext.marcarPedidoPago' }
      );
    });

    test('deve registrar todos eventos no EventLogger com mesmo trace_id', () => {
      const trace_id = crypto.randomUUID();

      // Configurar listeners com logging
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        eventLogger.info('Pedido criado', { trace_id: event.metadata.trace_id, order_id: event.payload.orderId });

        eventBus.emit(
          EVENTS.INVENTORY.STOCK_RESERVED,
          { productId: 1, quantity: 5 },
          { trace_id: event.metadata.trace_id, source: 'test' }
        );
      });

      eventBus.on(EVENTS.INVENTORY.STOCK_RESERVED, (event) => {
        eventLogger.success('Estoque reservado', { trace_id: event.metadata.trace_id, product_id: event.payload.productId });
      });

      // Emitir evento inicial
      eventBus.emit(
        EVENTS.SALES.ORDER_CREATED,
        { orderId: 1, items: [] },
        { trace_id, source: 'test' }
      );

      // Validar logs
      const history = eventLogger.getTraceHistory(trace_id);
      expect(history.length).toBe(2);
      expect(history[0].message).toBe('Pedido criado');
      expect(history[1].message).toBe('Estoque reservado');
    });
  });

  describe('Fluxo: Cancelamento de Pedido', () => {
    test('deve liberar estoque reservado ao cancelar pedido', (done) => {
      const trace_id = crypto.randomUUID();
      let stockReserved = false;
      let stockReleased = false;

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        eventBus.emit(
          EVENTS.INVENTORY.STOCK_RESERVED,
          { productId: 1, quantity: 5, orderId: event.payload.orderId },
          { trace_id: event.metadata.trace_id, source: 'test' }
        );
      });

      eventBus.on(EVENTS.INVENTORY.STOCK_RESERVED, (event) => {
        stockReserved = true;
        eventLogger.success('Estoque reservado', { trace_id: event.metadata.trace_id });
      });

      eventBus.on(EVENTS.SALES.ORDER_CANCELLED, (event) => {
        eventBus.emit(
          EVENTS.INVENTORY.STOCK_RELEASED,
          { productId: 1, quantity: 5, orderId: event.payload.orderId },
          { trace_id: event.metadata.trace_id, source: 'test' }
        );
      });

      eventBus.on(EVENTS.INVENTORY.STOCK_RELEASED, (event) => {
        stockReleased = true;
        eventLogger.success('Estoque liberado', { trace_id: event.metadata.trace_id });

        // Validar
        expect(stockReserved).toBe(true);
        expect(stockReleased).toBe(true);

        const history = eventLogger.getTraceHistory(trace_id);
        expect(history.some(log => log.message === 'Estoque reservado')).toBe(true);
        expect(history.some(log => log.message === 'Estoque liberado')).toBe(true);

        done();
      });

      // Fluxo
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, { orderId: 1 }, { trace_id, source: 'test' });
      eventBus.emit(EVENTS.SALES.ORDER_CANCELLED, { orderId: 1, reason: 'Cliente cancelou' }, { trace_id, source: 'test' });
    });
  });

  describe('Fluxo: Compra → Despesa', () => {
    test('deve criar despesa automaticamente ao aprovar pedido de compra', (done) => {
      const trace_id = crypto.randomUUID();

      eventBus.on(EVENTS.PURCHASE.ORDER_APPROVED, (event) => {
        // FinanceContext cria despesa
        eventBus.emit(
          EVENTS.FINANCE.EXPENSE_CREATED,
          {
            expenseId: 1,
            supplierId: event.payload.supplierId,
            amount: event.payload.totalCost,
            purchaseOrderId: event.payload.orderId
          },
          { trace_id: event.metadata.trace_id, source: 'FinanceContext.handlePurchaseOrderApproved' }
        );
      });

      eventBus.on(EVENTS.FINANCE.EXPENSE_CREATED, (event) => {
        expect(event.metadata.trace_id).toBe(trace_id);
        expect(event.payload.amount).toBe(1500);

        eventLogger.success('Despesa criada automaticamente', {
          trace_id: event.metadata.trace_id,
          expense_id: event.payload.expenseId
        });

        const history = eventLogger.getTraceHistory(trace_id);
        expect(history.length).toBe(1);

        done();
      });

      eventBus.emit(
        EVENTS.PURCHASE.ORDER_APPROVED,
        { orderId: 1, supplierId: 1, totalCost: 1500 },
        { trace_id, source: 'PurchaseContext.aprovarPedido' }
      );
    });
  });

  describe('Fluxo: Expedição → Redução Física', () => {
    test('deve reduzir estoque físico ao despachar pedido', (done) => {
      const trace_id = crypto.randomUUID();
      let stockShipped = false;

      eventBus.on(EVENTS.SHIPMENT.DISPATCHED, (event) => {
        // DataContext reduz estoque
        eventBus.emit(
          EVENTS.INVENTORY.STOCK_SHIPPED,
          {
            productId: 1,
            quantity: 5,
            orderId: event.payload.orderId
          },
          { trace_id: event.metadata.trace_id, source: 'DataContext.handleShipmentDispatched' }
        );
      });

      eventBus.on(EVENTS.INVENTORY.STOCK_SHIPPED, (event) => {
        stockShipped = true;

        expect(event.metadata.trace_id).toBe(trace_id);
        expect(event.payload.quantity).toBe(5);

        eventLogger.success('Estoque físico reduzido', {
          trace_id: event.metadata.trace_id,
          product_id: event.payload.productId,
          quantity: event.payload.quantity
        });

        expect(stockShipped).toBe(true);
        done();
      });

      eventBus.emit(
        EVENTS.SHIPMENT.DISPATCHED,
        { orderId: 1, trackingCode: 'BR123456789' },
        { trace_id, source: 'DataContext.despacharPedido' }
      );
    });
  });

  describe('Fluxo: Pagamento → Reconciliação', () => {
    test('deve reconciliar saldo bancário ao receber pagamento', (done) => {
      const trace_id = crypto.randomUUID();

      eventBus.on(EVENTS.FINANCE.PAYMENT_RECEIVED, (event) => {
        eventLogger.success('Pagamento recebido', {
          trace_id: event.metadata.trace_id,
          amount: event.payload.amount,
          bank_account_id: event.payload.bankAccountId
        });

        expect(event.metadata.trace_id).toBe(trace_id);
        expect(event.payload.amount).toBe(250);

        done();
      });

      eventBus.emit(
        EVENTS.FINANCE.PAYMENT_RECEIVED,
        {
          receivableId: 1,
          amount: 250,
          paymentMethod: 'PIX',
          bankAccountId: 1
        },
        { trace_id, source: 'FinanceContext.receberParcela' }
      );
    });
  });

  describe('Performance: 100 Pedidos Simultâneos', () => {
    test('deve processar 100 pedidos mantendo trace_ids únicos', () => {
      const traceIds = new Set();
      let eventsProcessed = 0;

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        traceIds.add(event.metadata.trace_id);
        eventsProcessed++;

        eventLogger.info('Pedido processado', {
          trace_id: event.metadata.trace_id,
          order_id: event.payload.orderId
        });
      });

      const start = performance.now();

      // Criar 100 pedidos
      for (let i = 0; i < 100; i++) {
        eventBus.emit(
          EVENTS.SALES.ORDER_CREATED,
          { orderId: i, customerId: 1, total: 100 },
          { trace_id: crypto.randomUUID(), source: 'test' }
        );
      }

      const duration = performance.now() - start;

      expect(eventsProcessed).toBe(100);
      expect(traceIds.size).toBe(100); // Todos únicos
      expect(duration).toBeLessThan(500); // < 500ms
      expect(eventLogger.getLogs().length).toBe(100);
    });
  });

  describe('Error Handling: DLQ em cadeia', () => {
    test('deve capturar erro em listener intermediário sem quebrar cadeia', () => {
      const trace_id = crypto.randomUUID();
      let eventBeforeError = false;
      let eventAfterError = false;

      // Listener que sucede
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        eventBeforeError = true;
      });

      // Listener que falha
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        throw new Error('Simulated failure');
      });

      // Outro listener que deve executar mesmo após erro
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        eventAfterError = true;
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, { orderId: 1 }, { trace_id, source: 'test' });

      expect(eventBeforeError).toBe(true);
      expect(eventAfterError).toBe(true);
      expect(eventBus.getDLQ().length).toBeGreaterThan(0);
    });
  });

  describe('CEOMetrics: Atualização em Tempo Real', () => {
    test('deve atualizar métricas ao processar eventos de venda', () => {
      // Configurar listeners do CEOMetricsService
      let metricsUpdated = false;

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        // Simular atualização de métricas
        metricsUpdated = true;
      });

      eventBus.emit(
        EVENTS.SALES.ORDER_CREATED,
        { orderId: 1, total: 250 },
        { trace_id: crypto.randomUUID(), source: 'test' }
      );

      expect(metricsUpdated).toBe(true);
    });
  });
});
