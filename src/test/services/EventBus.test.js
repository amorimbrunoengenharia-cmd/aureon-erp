import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock ApiService antes de importar EventBus
vi.mock('../../services/ApiService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Importar EventBus DEPOIS do mock
const EventBusModule = await import('../../services/EventBus');
const EventBus = EventBusModule.default;

describe('EventBus - Singleton & Dedupe', () => {
  let eventBus1;
  let eventBus2;

  beforeEach(() => {
    // Reset singleton instance
    EventBus.instance = null;
    
    eventBus1 = new EventBus();
    eventBus2 = new EventBus();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância em múltiplas chamadas', () => {
      expect(eventBus1).toBe(eventBus2);
      expect(EventBus.instance).toBe(eventBus1);
    });

    it('deve ter initialized flag', () => {
      expect(eventBus1.initialized).toBeDefined();
    });

    it('deve ter initPromise para esperar inicialização', async () => {
      expect(eventBus1.initPromise).toBeDefined();
      await eventBus1.initPromise;
      expect(eventBus1.initialized).toBe(true);
    });
  });

  describe('Listener Deduplication', () => {
    it('deve evitar adicionar o mesmo listener duas vezes', () => {
      const handler = vi.fn();
      
      eventBus1.on('TEST_EVENT', handler);
      eventBus1.on('TEST_EVENT', handler); // Duplicate
      
      eventBus1.emit('TEST_EVENT', { data: 'test' });
      
      // Handler should be called only once despite being added twice
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('deve ter listenerRegistry Map', () => {
      expect(eventBus1.listenerRegistry).toBeInstanceOf(Map);
    });

    it('deve registrar listener no listenerRegistry', () => {
      const handler = vi.fn();
      const handlerId = handler.name || handler.toString();
      
      eventBus1.on('TEST_EVENT', handler);
      
      expect(eventBus1.listenerRegistry.has(handlerId)).toBe(true);
    });
  });

  describe('on() e off() methods', () => {
    it('deve adicionar listener com on()', () => {
      const handler = vi.fn();
      
      eventBus1.on('TEST_EVENT', handler);
      eventBus1.emit('TEST_EVENT', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('deve remover listener com off()', () => {
      const handler = vi.fn();
      
      eventBus1.on('TEST_EVENT', handler);
      eventBus1.off('TEST_EVENT', handler);
      eventBus1.emit('TEST_EVENT', { data: 'test' });
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('deve remover listener do listenerRegistry ao chamar off()', () => {
      const handler = vi.fn();
      const handlerId = handler.name || handler.toString();
      
      eventBus1.on('TEST_EVENT', handler);
      expect(eventBus1.listenerRegistry.has(handlerId)).toBe(true);
      
      eventBus1.off('TEST_EVENT', handler);
      expect(eventBus1.listenerRegistry.has(handlerId)).toBe(false);
    });
  });

  describe('waitForInitialized()', () => {
    it('deve resolver quando EventBus estiver inicializado', async () => {
      await expect(eventBus1.waitForInitialized()).resolves.toBeUndefined();
      expect(eventBus1.initialized).toBe(true);
    });
  });
});
