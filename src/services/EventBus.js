/**
 * EVENT BUS - Arquitetura Event-Driven
 * Pub/Sub pattern para comunicação assíncrona entre módulos
 * 
 * Features:
 * - Idempotência (UUID)
 * - Event Store (Audit Log)
 * - Retry automático com backoff exponencial
 * - Dead Letter Queue (DLQ) persistente
 * - Trace ID para rastreamento end-to-end
 * - Timeout handling
 * - Logging integrado
 */

import { v4 as uuidv4 } from 'uuid';
import eventLogger from './EventLogger';
import apiService from './ApiService';

class EventBus {
  constructor() {
    // ✅ Singleton check
    if (EventBus.instance) {
      return EventBus.instance;
    }
    
    this.listeners = new Map();
    this.listenerRegistry = new Map(); // ✅ Track listeners for dedupe
    this.eventLog = [];
    this.processedEvents = new Set();
    this.dlq = []; // Dead Letter Queue
    this.maxRetries = 3;
    this.eventTimeout = 30000; // 30 segundos
    this.useAPI = import.meta.env.VITE_USE_API === 'true';
    this.initialized = false; // ✅ Initialization flag
    this.initPromise = this.initialize(); // ✅ Async init
    
    EventBus.instance = this;
  }

  /**
   * ✅ Async initialization
   */
  async initialize() {
    try {
      await this.loadPersistedData();
      this.initialized = true;
      if (import.meta.env.DEV) {
        console.log('✅ EventBus initialized');
      }
    } catch (error) {
      console.error('❌ EventBus initialization failed:', error);
    }
  }

  /**
   * ✅ Wait for initialization
   */
  async waitForInitialized() {
    if (this.initialized) return true;
    await this.initPromise;
    return this.initialized;
  }

  /**
   * ✅ Registrar listener com dedupe
   */
  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    // ✅ Dedupe: Check if listener already registered
    const listeners = this.listeners.get(eventType);
    const listenerId = listener.name || listener.toString();
    
    if (!this.listenerRegistry.has(listenerId)) {
      listeners.push(listener);
      this.listenerRegistry.set(listenerId, { eventType, listener });
      
      if (import.meta.env.DEV) {
        console.debug(`[EventBus] Registered listener for ${eventType}`);
      }
    } else if (import.meta.env.DEV) {
      console.warn(`[EventBus] Listener already registered for ${eventType}, skipping`);
    }
  }

  /**
   * ✅ Remover listener (cleanup)
   */
  off(eventType, listener) {
    const listeners = this.listeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    
    if (index > -1) {
      listeners.splice(index, 1);
      const listenerId = listener.name || listener.toString();
      this.listenerRegistry.delete(listenerId);
      
      if (import.meta.env.DEV) {
        console.debug(`[EventBus] Removed listener for ${eventType}`);
      }
    }
  }

  /**
   * Emitir evento
   */
  emit(eventType, payload, metadata = {}) {
    const event = {
      id: uuidv4(),
      type: eventType,
      payload,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        userId: metadata.userId || 'system',
        source: metadata.source || 'frontend',
        trace_id: metadata.trace_id || uuidv4() // Novo: Trace ID para rastreamento
      },
      retryCount: 0
    };

    // Verificar idempotência
    if (this.processedEvents.has(event.id)) {
      eventLogger.warn(`Evento duplicado ignorado`, {
        event_id: event.id,
        event_type: eventType,
        trace_id: event.metadata.trace_id
      });
      return event.id;
    }

    // Salvar no Event Store
    this.saveToEventStore(event);

    // Marcar como processado
    this.processedEvents.add(event.id);
    
    // ✅ Persistir processedEvents em localStorage (idempotência)
    localStorage.setItem('aureon_processed_events', JSON.stringify([...this.processedEvents]));

    // Notificar listeners
    const listeners = this.listeners.get(eventType) || [];
    
    eventLogger.info(`Emitindo evento: ${eventType}`, {
      event_id: event.id,
      event_type: eventType,
      trace_id: event.metadata.trace_id,
      listeners: listeners.length,
      payload: payload
    });

    listeners.forEach(listener => {
      this.executeWithTimeout(listener, event, eventType);
    });

    return event.id;
  }

  /**
   * Executar listener com timeout
   */
  async executeWithTimeout(listener, event, eventType) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), this.eventTimeout);
    });

    const listenerPromise = Promise.resolve().then(() => listener(event));

    try {
      await Promise.race([listenerPromise, timeoutPromise]);
    } catch (error) {
      eventLogger.error(`Erro ao processar evento: ${eventType}`, {
        event_id: event.id,
        event_type: eventType,
        trace_id: event.metadata.trace_id,
        error: error.message
      });
      this.handleEventError(event, listener, error);
    }
  }

  /**
   * Registrar listener
   */
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    // ✅ Guard: Verificar se handler já existe para evitar duplicação
    const existingListeners = this.listeners.get(eventType);
    if (existingListeners.includes(handler)) {
      eventLogger.debug(`Listener já registrado (ignorando duplicação): ${eventType}`, {
        event_type: eventType,
        total_listeners: existingListeners.length
      });
      return; // Não registrar novamente
    }
    
    existingListeners.push(handler);
    
    // Log apenas se houver problema de duplicação (já logado acima no guard)
  }

  /**
   * Remover listener
   */
  off(eventType, handler) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Salvar evento no Event Store
   */
  async saveToEventStore(event) {
    this.eventLog.push(event);
    
    // Tentar salvar na API primeiro
    if (this.useAPI) {
      try {
        await apiService.createEvent({
          trace_id: event.metadata.trace_id,
          event_type: event.type,
          payload: event.payload,
          metadata: event.metadata,
          status: 'pending'
        });
        
        eventLogger.debug(`Evento salvo no banco de dados via API`, {
          event_id: event.id,
          event_type: event.type,
          trace_id: event.metadata.trace_id
        });
        return; // Sucesso na API, não precisa localStorage
      } catch (error) {
        eventLogger.warn('Falha ao salvar evento na API, usando localStorage como fallback', {
          event_id: event.id,
          error: error.message
        });
      }
    }
    
    // Fallback: Persistir no localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('aureon_event_log') || '[]');
      stored.push(event);
      
      // Manter apenas últimos 1000 eventos
      if (stored.length > 1000) {
        stored.shift();
      }
      
      localStorage.setItem('aureon_event_log', JSON.stringify(stored));
      
      eventLogger.debug(`Evento salvo no Event Store (localStorage)`, {
        event_id: event.id,
        event_type: event.type,
        trace_id: event.metadata.trace_id
      });
    } catch (e) {
      eventLogger.error('Erro ao persistir event log', { error: e.message });
    }
  }

  /**
   * Tratar erros de processamento com retry backoff exponencial
   */
  handleEventError(event, handler, error) {
    event.retryCount = (event.retryCount || 0) + 1;
    event.lastError = error.message;

    if (event.retryCount < this.maxRetries) {
      // Retry com backoff exponencial: 2s, 4s, 8s
      const delay = Math.pow(2, event.retryCount) * 1000;
      
      eventLogger.warn(`Retry ${event.retryCount}/${this.maxRetries} agendado`, {
        event_id: event.id,
        event_type: event.type,
        trace_id: event.metadata.trace_id,
        delay_ms: delay,
        error: error.message
      });
      
      setTimeout(() => {
        this.executeWithTimeout(handler, event, event.type);
      }, delay);
    } else {
      // Mover para DLQ
      const dlqEntry = {
        event,
        error: error.message,
        timestamp: new Date().toISOString(),
        trace_id: event.metadata.trace_id
      };
      
      this.dlq.push(dlqEntry);
      
      eventLogger.error(`Evento movido para DLQ após ${this.maxRetries} tentativas`, {
        event_id: event.id,
        event_type: event.type,
        trace_id: event.metadata.trace_id,
        error: error.message
      });
      
      // Persistir DLQ
      this.persistDLQ();
    }
  }

  /**
   * Persistir DLQ no localStorage
   */
  persistDLQ() {
    try {
      localStorage.setItem('aureon_event_dlq', JSON.stringify(this.dlq));
      eventLogger.debug('DLQ persistida', { dlq_size: this.dlq.length });
    } catch (e) {
      eventLogger.error('Erro ao persistir DLQ', { error: e.message });
    }
  }

  /**
   * Carregar dados persistidos
   */
  async loadPersistedData() {
    // Tentar carregar da API primeiro
    if (this.useAPI) {
      try {
        const response = await apiService.getEvents({ limit: 1000 });
        const events = Array.isArray(response) ? response : (response?.data || response?.events || []);
        
        this.eventLog = events.map(e => ({
          id: e.event_id || uuidv4(),
          type: e.event_type,
          payload: e.payload,
          metadata: e.metadata || { trace_id: e.trace_id, timestamp: e.created_at },
          retryCount: e.retry_count || 0
        }));
        
        // Tentar carregar DLQ (pode não estar disponível/autenticado)
        try {
          const dlqResponse = await apiService.getDLQEvents();
          const dlqEvents = Array.isArray(dlqResponse) ? dlqResponse : (dlqResponse?.data || dlqResponse?.events || []);
          
          this.dlq = dlqEvents.map(e => ({
            event: {
              id: e.event_id,
              type: e.event_type,
              payload: e.payload,
              metadata: e.metadata || { trace_id: e.trace_id },
              retryCount: e.retry_count || 0
            },
            error: e.error_message,
            timestamp: e.dlq_at,
            trace_id: e.trace_id
          }));
        } catch (dlqError) {
          // DLQ endpoint pode não existir ou requerer autenticação
          eventLogger.debug('DLQ não disponível, usando localStorage', {
            error: dlqError.message
          });
          this.dlq = JSON.parse(localStorage.getItem('aureon_event_dlq') || '[]');
        }
        
        if (import.meta.env.DEV) {
          eventLogger.debug('EventBus inicializado (API)', {
            events: this.eventLog.length,
            dlq: this.dlq.length
          });
        }
        return;
      } catch (error) {
        eventLogger.warn('Falha ao carregar eventos da API, usando localStorage', {
          error: error.message
        });
      }
    }
    
    // Fallback: localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('aureon_event_log') || '[]');
      this.eventLog = stored;
      
      const dlq = JSON.parse(localStorage.getItem('aureon_event_dlq') || '[]');
      this.dlq = dlq;
      
      // ✅ Carregar processedEvents para idempotência
      const processedIds = JSON.parse(localStorage.getItem('aureon_processed_events') || '[]');
      this.processedEvents = new Set(processedIds);
      
      if (import.meta.env.DEV) {
        eventLogger.debug('EventBus inicializado (localStorage)', {
          events: stored.length,
          dlq: dlq.length,
          processedEvents: processedIds.length
        });
      }
    } catch (e) {
      eventLogger.error('Erro ao carregar dados persistidos', { error: e.message });
    }
  }

  /**
   * Obter eventos do log
   */
  getEventLog(filter = {}) {
    let events = [...this.eventLog];

    if (filter.type) {
      events = events.filter(e => e.type === filter.type);
    }

    if (filter.startDate) {
      events = events.filter(e => new Date(e.metadata.timestamp) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      events = events.filter(e => new Date(e.metadata.timestamp) <= new Date(filter.endDate));
    }

    return events;
  }

  /**
   * Obter DLQ
   */
  getDeadLetterQueue() {
    return [...this.dlq];
  }

  /**
   * Reprocessar eventos da DLQ
   */
  reprocessDLQ() {
    const toRetry = [...this.dlq];
    this.dlq = [];

    eventLogger.info(`Reprocessando DLQ`, { total_events: toRetry.length });

    toRetry.forEach(({ event }) => {
      event.retryCount = 0;
      this.emit(event.type, event.payload, event.metadata);
    });
    
    this.persistDLQ();
  }

  /**
   * Limpar event log antigo
   */
  cleanOldEvents(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const before = this.eventLog.length;
    this.eventLog = this.eventLog.filter(
      e => new Date(e.metadata.timestamp) > cutoffDate
    );
    const removed = before - this.eventLog.length;

    eventLogger.info(`Eventos antigos removidos`, {
      days,
      removed,
      remaining: this.eventLog.length
    });
    
    // Atualizar localStorage
    try {
      localStorage.setItem('aureon_event_log', JSON.stringify(this.eventLog));
    } catch (e) {
      eventLogger.error('Erro ao persistir após limpeza', { error: e.message });
    }
  }

  /**
   * Estatísticas
   */
  getStats() {
    const typeCount = {};
    
    this.eventLog.forEach(event => {
      typeCount[event.type] = (typeCount[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.eventLog.length,
      totalListeners: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      dlqSize: this.dlq.length,
      eventTypes: Object.keys(typeCount).length,
      topEvents: Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([type, count]) => ({ type, count }))
    };
  }

  /**
   * Replay de eventos (debug)
   */
  replay(eventType, filter = {}) {
    const events = this.getEventLog({ type: eventType, ...filter });
    
    console.log(`[EventBus] 🎬 Replay: ${eventType} (${events.length} eventos)`);

    events.forEach(event => {
      const listeners = this.listeners.get(event.type) || [];
      listeners.forEach(listener => listener(event));
    });
  }
}

// Singleton
const eventBus = new EventBus();

export default eventBus;
