/**
 * EventBus Unit Tests
 * 
 * Testa funcionalidades core do EventBus:
 * - Emit/On/Off básico
 * - Propagação de trace_id
 * - Timeout handling
 * - Retry com backoff
 * - Dead Letter Queue (DLQ)
 */

import { eventBus } from '../src/utils/EventBus';
import { EVENTS } from '../src/utils/EventTypes';

describe('EventBus', () => {
  beforeEach(() => {
    // Limpar listeners antes de cada teste
    eventBus.listeners = new Map();
    eventBus.dlq = [];
    localStorage.clear();
  });

  describe('Básico - Emit/On/Off', () => {
    test('deve emitir e receber evento', (done) => {
      const payload = { test: 'data' };
      const metadata = { source: 'test' };

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        expect(event.type).toBe(EVENTS.SALES.ORDER_CREATED);
        expect(event.payload).toEqual(payload);
        expect(event.metadata.source).toBe('test');
        done();
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, payload, metadata);
    });

    test('deve permitir múltiplos listeners no mesmo evento', () => {
      let count = 0;

      eventBus.on(EVENTS.SALES.ORDER_CREATED, () => count++);
      eventBus.on(EVENTS.SALES.ORDER_CREATED, () => count++);
      eventBus.on(EVENTS.SALES.ORDER_CREATED, () => count++);

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});

      expect(count).toBe(3);
    });

    test('deve remover listener com off()', () => {
      let called = false;
      const listener = () => { called = true; };

      eventBus.on(EVENTS.SALES.ORDER_CREATED, listener);
      eventBus.off(EVENTS.SALES.ORDER_CREATED, listener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});

      expect(called).toBe(false);
    });
  });

  describe('Trace ID', () => {
    test('deve gerar trace_id automaticamente se não fornecido', () => {
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        expect(event.metadata.trace_id).toBeDefined();
        expect(event.metadata.trace_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {}, { source: 'test' });
    });

    test('deve preservar trace_id fornecido', () => {
      const trace_id = 'custom-trace-123';

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        expect(event.metadata.trace_id).toBe(trace_id);
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {}, { trace_id, source: 'test' });
    });

    test('deve propagar trace_id entre eventos', () => {
      const trace_id = crypto.randomUUID();
      let receivedTraceId;

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        // Emitir evento filho com mesmo trace_id
        eventBus.emit(
          EVENTS.INVENTORY.STOCK_RESERVED,
          {},
          { trace_id: event.metadata.trace_id, source: 'test-handler' }
        );
      });

      eventBus.on(EVENTS.INVENTORY.STOCK_RESERVED, (event) => {
        receivedTraceId = event.metadata.trace_id;
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {}, { trace_id, source: 'test' });

      expect(receivedTraceId).toBe(trace_id);
    });
  });

  describe('Timeout Handling', () => {
    test('deve timeout listener que demora > 30s', async () => {
      jest.useFakeTimers();

      const slowListener = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 35000));
      });

      eventBus.on(EVENTS.SALES.ORDER_CREATED, slowListener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});

      // Avançar timer para simular timeout
      jest.advanceTimersByTime(31000);

      await Promise.resolve(); // Permitir promises resolverem

      // Verificar que evento foi para DLQ
      expect(eventBus.getDLQ().length).toBe(1);
      expect(eventBus.getDLQ()[0].error).toContain('timeout');

      jest.useRealTimers();
    });
  });

  describe('Retry e Backoff', () => {
    test('deve fazer retry 3x com backoff exponencial', async () => {
      jest.useFakeTimers();
      let attempts = 0;

      const failingListener = jest.fn(() => {
        attempts++;
        throw new Error('Test error');
      });

      eventBus.on(EVENTS.SALES.ORDER_CREATED, failingListener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});

      // Tentativa inicial
      await Promise.resolve();
      expect(attempts).toBe(1);

      // Retry 1: 2s
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      expect(attempts).toBe(2);

      // Retry 2: 4s
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
      expect(attempts).toBe(3);

      // Retry 3: 8s
      jest.advanceTimersByTime(8000);
      await Promise.resolve();
      expect(attempts).toBe(4);

      // Após 3 retries, deve ir para DLQ
      expect(eventBus.getDLQ().length).toBe(1);
      expect(eventBus.getDLQ()[0].retryCount).toBe(3);

      jest.useRealTimers();
    });

    test('não deve fazer retry se listener suceder', () => {
      let callCount = 0;

      eventBus.on(EVENTS.SALES.ORDER_CREATED, () => {
        callCount++;
        // Sucesso - sem throw
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});

      expect(callCount).toBe(1);
      expect(eventBus.getDLQ().length).toBe(0);
    });
  });

  describe('Dead Letter Queue (DLQ)', () => {
    test('deve adicionar evento falhado à DLQ', () => {
      const failingListener = () => {
        throw new Error('Test failure');
      };

      eventBus.on(EVENTS.SALES.ORDER_CREATED, failingListener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, { test: 'data' });

      const dlq = eventBus.getDLQ();
      expect(dlq.length).toBe(1);
      expect(dlq[0].error).toContain('Test failure');
      expect(dlq[0].payload.test).toBe('data');
    });

    test('deve persistir DLQ no localStorage', () => {
      const failingListener = () => {
        throw new Error('Test failure');
      };

      eventBus.on(EVENTS.SALES.ORDER_CREATED, failingListener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, { test: 'data' });

      // Verificar localStorage
      const stored = JSON.parse(localStorage.getItem('aureon_event_dlq'));
      expect(stored).toBeDefined();
      expect(stored.length).toBe(1);
    });

    test('deve reprocessar evento da DLQ', () => {
      let attempts = 0;

      const listener = () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('First attempt fails');
        }
        // Segunda tentativa sucede
      };

      eventBus.on(EVENTS.SALES.ORDER_CREATED, listener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, { test: 'data' });

      expect(eventBus.getDLQ().length).toBe(1);

      // Reprocessar
      const failedEvent = eventBus.getDLQ()[0];
      eventBus.retryFromDLQ(failedEvent.id);

      expect(attempts).toBe(2);
      expect(eventBus.getDLQ().length).toBe(0);
    });

    test('deve limpar DLQ', () => {
      const failingListener = () => {
        throw new Error('Test failure');
      };

      eventBus.on(EVENTS.SALES.ORDER_CREATED, failingListener);
      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});

      expect(eventBus.getDLQ().length).toBe(1);

      eventBus.clearDLQ();

      expect(eventBus.getDLQ().length).toBe(0);
      expect(localStorage.getItem('aureon_event_dlq')).toBe('[]');
    });
  });

  describe('Persistência', () => {
    test('deve carregar DLQ do localStorage ao inicializar', () => {
      // Simular DLQ já existente
      const existingDLQ = [
        {
          id: 'event-1',
          type: EVENTS.SALES.ORDER_CREATED,
          payload: { test: 'data' },
          error: 'Previous error',
          retryCount: 2
        }
      ];

      localStorage.setItem('aureon_event_dlq', JSON.stringify(existingDLQ));

      // Criar nova instância do EventBus (simular reload)
      eventBus.loadPersistedData();

      expect(eventBus.getDLQ().length).toBe(1);
      expect(eventBus.getDLQ()[0].id).toBe('event-1');
    });
  });

  describe('Metadata', () => {
    test('deve incluir timestamp em metadata', (done) => {
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        expect(event.metadata.timestamp).toBeDefined();
        expect(new Date(event.metadata.timestamp)).toBeInstanceOf(Date);
        done();
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {});
    });

    test('deve incluir source em metadata', (done) => {
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        expect(event.metadata.source).toBe('test-source');
        done();
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {}, { source: 'test-source' });
    });

    test('deve incluir userId se fornecido', (done) => {
      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        expect(event.metadata.userId).toBe('user@test.com');
        done();
      });

      eventBus.emit(EVENTS.SALES.ORDER_CREATED, {}, { userId: 'user@test.com' });
    });
  });

  describe('Performance', () => {
    test('deve processar 1000 eventos em < 100ms', () => {
      let count = 0;
      eventBus.on(EVENTS.SALES.ORDER_CREATED, () => count++);

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        eventBus.emit(EVENTS.SALES.ORDER_CREATED, { id: i });
      }

      const duration = performance.now() - start;

      expect(count).toBe(1000);
      expect(duration).toBeLessThan(100);
    });

    test('deve manter trace_ids únicos em emissões paralelas', () => {
      const traceIds = new Set();

      eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => {
        traceIds.add(event.metadata.trace_id);
      });

      for (let i = 0; i < 100; i++) {
        eventBus.emit(EVENTS.SALES.ORDER_CREATED, { id: i });
      }

      expect(traceIds.size).toBe(100);
    });
  });
});
