/**
 * EventLogger Unit Tests
 * 
 * Testa funcionalidades do EventLogger:
 * - Logging em diferentes níveis
 * - Persistência no localStorage
 * - Busca e filtros
 * - Trace history
 * - Export de logs
 * - Rotação automática (max 1000)
 */

import { eventLogger } from '../src/utils/EventLogger';

describe('EventLogger', () => {
  beforeEach(() => {
    localStorage.clear();
    eventLogger.clearLogs();
  });

  describe('Logging Básico', () => {
    test('deve registrar log info', () => {
      eventLogger.info('Test message', { trace_id: 'abc123', key: 'value' });

      const logs = eventLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].context.trace_id).toBe('abc123');
    });

    test('deve registrar log success', () => {
      eventLogger.success('Operation completed', { trace_id: 'abc123' });

      const logs = eventLogger.getLogs();
      expect(logs[0].level).toBe('success');
    });

    test('deve registrar log warn', () => {
      eventLogger.warn('Warning message', { trace_id: 'abc123' });

      const logs = eventLogger.getLogs();
      expect(logs[0].level).toBe('warn');
    });

    test('deve registrar log error', () => {
      eventLogger.error('Error occurred', { trace_id: 'abc123', error: 'details' });

      const logs = eventLogger.getLogs();
      expect(logs[0].level).toBe('error');
      expect(logs[0].context.error).toBe('details');
    });

    test('deve registrar log debug', () => {
      eventLogger.debug('Debug info', { trace_id: 'abc123' });

      const logs = eventLogger.getLogs();
      expect(logs[0].level).toBe('debug');
    });

    test('deve incluir timestamp em cada log', () => {
      eventLogger.info('Test', { trace_id: 'abc123' });

      const logs = eventLogger.getLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(new Date(logs[0].timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Persistência', () => {
    test('deve persistir logs no localStorage', () => {
      eventLogger.info('Test message', { trace_id: 'abc123' });

      const stored = JSON.parse(localStorage.getItem('aureon_event_logs'));
      expect(stored).toBeDefined();
      expect(stored.length).toBe(1);
      expect(stored[0].message).toBe('Test message');
    });

    test('deve carregar logs do localStorage ao inicializar', () => {
      // Simular logs já existentes
      const existingLogs = [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Existing log',
          context: { trace_id: 'abc123' }
        }
      ];

      localStorage.setItem('aureon_event_logs', JSON.stringify(existingLogs));

      // Recarregar
      eventLogger.loadLogs();

      const logs = eventLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Existing log');
    });

    test('deve limpar logs', () => {
      eventLogger.info('Test 1', { trace_id: 'abc123' });
      eventLogger.info('Test 2', { trace_id: 'abc123' });

      expect(eventLogger.getLogs().length).toBe(2);

      eventLogger.clearLogs();

      expect(eventLogger.getLogs().length).toBe(0);
      expect(localStorage.getItem('aureon_event_logs')).toBe('[]');
    });
  });

  describe('Rotação de Logs (Max 1000)', () => {
    test('deve remover logs mais antigos quando exceder 1000', () => {
      // Adicionar 1005 logs
      for (let i = 0; i < 1005; i++) {
        eventLogger.info(`Log ${i}`, { trace_id: `trace-${i}` });
      }

      const logs = eventLogger.getLogs();
      expect(logs.length).toBe(1000);

      // Verificar que os mais antigos foram removidos
      expect(logs[0].message).toBe('Log 5');
      expect(logs[999].message).toBe('Log 1004');
    });
  });

  describe('Busca e Filtros', () => {
    beforeEach(() => {
      // Preparar logs de teste
      eventLogger.info('Order created', { trace_id: 'trace-1', event_type: 'SALES.ORDER_CREATED' });
      eventLogger.success('Stock reserved', { trace_id: 'trace-1', event_type: 'INVENTORY.STOCK_RESERVED' });
      eventLogger.error('Payment failed', { trace_id: 'trace-2', event_type: 'FINANCE.PAYMENT_FAILED' });
      eventLogger.warn('Low stock', { trace_id: 'trace-3', event_type: 'INVENTORY.ALERT.LOW_STOCK' });
    });

    test('deve buscar por trace_id', () => {
      const results = eventLogger.search({ trace_id: 'trace-1' });

      expect(results.length).toBe(2);
      expect(results[0].context.trace_id).toBe('trace-1');
      expect(results[1].context.trace_id).toBe('trace-1');
    });

    test('deve buscar por level', () => {
      const results = eventLogger.search({ level: 'error' });

      expect(results.length).toBe(1);
      expect(results[0].level).toBe('error');
      expect(results[0].message).toBe('Payment failed');
    });

    test('deve buscar por event_type', () => {
      const results = eventLogger.search({ event_type: 'INVENTORY.STOCK_RESERVED' });

      expect(results.length).toBe(1);
      expect(results[0].context.event_type).toBe('INVENTORY.STOCK_RESERVED');
    });

    test('deve buscar por múltiplos filtros', () => {
      const results = eventLogger.search({
        level: 'info',
        trace_id: 'trace-1'
      });

      expect(results.length).toBe(1);
      expect(results[0].message).toBe('Order created');
    });

    test('deve buscar por intervalo de datas', () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = eventLogger.search({
        startDate: yesterday,
        endDate: tomorrow
      });

      expect(results.length).toBe(4); // Todos logs de hoje
    });
  });

  describe('Trace History', () => {
    test('deve retornar histórico completo de um trace_id', () => {
      const trace_id = 'trace-complete-flow';

      eventLogger.info('Order created', { trace_id, step: 1 });
      eventLogger.success('Stock reserved', { trace_id, step: 2 });
      eventLogger.info('Payment processed', { trace_id, step: 3 });
      eventLogger.success('Order completed', { trace_id, step: 4 });

      const history = eventLogger.getTraceHistory(trace_id);

      expect(history.length).toBe(4);
      expect(history[0].context.step).toBe(1);
      expect(history[3].context.step).toBe(4);
    });

    test('deve retornar array vazio para trace_id inexistente', () => {
      const history = eventLogger.getTraceHistory('nonexistent-trace');

      expect(history).toEqual([]);
    });

    test('deve retornar histórico em ordem cronológica', () => {
      const trace_id = 'trace-order-test';

      eventLogger.info('First', { trace_id });
      setTimeout(() => {
        eventLogger.info('Second', { trace_id });
      }, 10);
      setTimeout(() => {
        eventLogger.info('Third', { trace_id });
      }, 20);

      // Aguardar timeouts
      setTimeout(() => {
        const history = eventLogger.getTraceHistory(trace_id);

        expect(history[0].message).toBe('First');
        expect(history[1].message).toBe('Second');
        expect(history[2].message).toBe('Third');
      }, 30);
    });
  });

  describe('Export de Logs', () => {
    test('deve exportar logs como JSON', () => {
      eventLogger.info('Test 1', { trace_id: 'abc123' });
      eventLogger.error('Test 2', { trace_id: 'abc456' });

      const exported = eventLogger.exportLogs();

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.totalLogs).toBe(2);
      expect(parsed.logs.length).toBe(2);
    });

    test('deve incluir metadata no export', () => {
      eventLogger.info('Test', { trace_id: 'abc123' });

      const exported = JSON.parse(eventLogger.exportLogs());

      expect(exported.metadata).toBeDefined();
      expect(exported.metadata.version).toBe('1.0');
      expect(exported.metadata.system).toBe('AUREON ERP');
    });

    test('deve permitir download do export', () => {
      // Mock para createElement e download
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      eventLogger.info('Test', { trace_id: 'abc123' });
      eventLogger.downloadLogs();

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/aureon-logs-.*\.json/);
    });
  });

  describe('Estatísticas', () => {
    beforeEach(() => {
      eventLogger.info('Info 1', { trace_id: 'abc' });
      eventLogger.info('Info 2', { trace_id: 'def' });
      eventLogger.success('Success 1', { trace_id: 'ghi' });
      eventLogger.error('Error 1', { trace_id: 'jkl' });
      eventLogger.warn('Warn 1', { trace_id: 'mno' });
      eventLogger.warn('Warn 2', { trace_id: 'pqr' });
    });

    test('deve calcular estatísticas corretamente', () => {
      const stats = eventLogger.getStats();

      expect(stats.total).toBe(6);
      expect(stats.byLevel.info).toBe(2);
      expect(stats.byLevel.success).toBe(1);
      expect(stats.byLevel.error).toBe(1);
      expect(stats.byLevel.warn).toBe(2);
    });

    test('deve contar trace_ids únicos', () => {
      const stats = eventLogger.getStats();

      expect(stats.uniqueTraceIds).toBe(6);
    });

    test('deve incluir período dos logs', () => {
      const stats = eventLogger.getStats();

      expect(stats.period).toBeDefined();
      expect(stats.period.firstLog).toBeDefined();
      expect(stats.period.lastLog).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('deve adicionar 1000 logs em < 100ms', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        eventLogger.info(`Log ${i}`, { trace_id: `trace-${i}` });
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(eventLogger.getLogs().length).toBe(1000);
    });

    test('deve buscar em 1000 logs em < 50ms', () => {
      // Preparar 1000 logs
      for (let i = 0; i < 1000; i++) {
        eventLogger.info(`Log ${i}`, { trace_id: i % 10 === 0 ? 'target-trace' : `trace-${i}` });
      }

      const start = performance.now();
      const results = eventLogger.search({ trace_id: 'target-trace' });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(results.length).toBe(100); // 1000 / 10
    });
  });

  describe('Edge Cases', () => {
    test('deve lidar com contexto vazio', () => {
      eventLogger.info('Test without context');

      const logs = eventLogger.getLogs();
      expect(logs[0].context).toEqual({});
    });

    test('deve lidar com contexto muito grande', () => {
      const largeContext = {
        trace_id: 'abc123',
        data: 'x'.repeat(10000) // 10KB de dados
      };

      eventLogger.info('Large context', largeContext);

      const logs = eventLogger.getLogs();
      expect(logs[0].context.data).toBe(largeContext.data);
    });

    test('deve lidar com mensagem null/undefined', () => {
      eventLogger.info(null, { trace_id: 'abc123' });
      eventLogger.info(undefined, { trace_id: 'def456' });

      const logs = eventLogger.getLogs();
      expect(logs.length).toBe(2);
    });

    test('deve lidar com localStorage cheio', () => {
      // Mock localStorage.setItem para simular erro
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Não deve lançar erro, apenas logar no console
      expect(() => {
        eventLogger.info('Test', { trace_id: 'abc123' });
      }).not.toThrow();
    });
  });
});
