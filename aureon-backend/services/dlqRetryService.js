/**
 * DLQ Retry Service
 * Sistema inteligente de retry para eventos na Dead Letter Queue
 * 
 * Features:
 * - Exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - Configuração de max_attempts por event_type
 * - Alertas webhook/email para eventos em DLQ
 * - Retry em lote ou individual
 * - Estatísticas de sucesso/falha
 */

import models from '../models/index.js';
import logger from '../utils/logger.js';
import { Sequelize } from 'sequelize';

const { Event, AuditLog } = models;

// Configuração de retry por tipo de evento
const RETRY_CONFIG = {
  // Eventos críticos: mais tentativas
  'sale.created': { maxAttempts: 5, priority: 'high' },
  'sale.completed': { maxAttempts: 5, priority: 'high' },
  'payment.received': { maxAttempts: 5, priority: 'high' },
  'prescription.expired': { maxAttempts: 5, priority: 'high' },
  
  // Eventos importantes: tentativas moderadas
  'product.stock_low': { maxAttempts: 3, priority: 'medium' },
  'client.created': { maxAttempts: 3, priority: 'medium' },
  'product.created': { maxAttempts: 3, priority: 'medium' },
  
  // Eventos de baixa prioridade: poucas tentativas
  'audit.log': { maxAttempts: 2, priority: 'low' },
  'stats.updated': { maxAttempts: 1, priority: 'low' },
  
  // Padrão
  'default': { maxAttempts: 3, priority: 'medium' }
};

// Delays do exponential backoff (ms)
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000]; // 1s, 2s, 4s, 8s, 16s

class DLQRetryService {
  constructor() {
    this.isRunning = false;
    this.stats = {
      totalRetried: 0,
      successful: 0,
      failed: 0,
      movedToDLQ: 0
    };
  }

  /**
   * Obter configuração para tipo de evento
   */
  getRetryConfig(eventType) {
    return RETRY_CONFIG[eventType] || RETRY_CONFIG['default'];
  }

  /**
   * Calcular delay do exponential backoff
   */
  getBackoffDelay(retryCount) {
    const index = Math.min(retryCount, BACKOFF_DELAYS.length - 1);
    return BACKOFF_DELAYS[index];
  }

  /**
   * Retry de evento individual
   */
  async retryEvent(eventId) {
    try {
      const event = await Event.findByPk(eventId);
      
      if (!event) {
        throw new Error(`Evento ${eventId} não encontrado`);
      }

      if (event.status !== 'dlq' && event.status !== 'failed') {
        throw new Error(`Evento ${eventId} não está em DLQ (status: ${event.status})`);
      }

      const config = this.getRetryConfig(event.event_type);
      const currentRetries = event.retry_count || 0;

      // Verificar se excedeu max_attempts
      if (currentRetries >= config.maxAttempts) {
        logger.warn(`Evento ${eventId} excedeu max_attempts (${config.maxAttempts})`, {
          event_id: eventId,
          event_type: event.event_type,
          retry_count: currentRetries,
          max_attempts: config.maxAttempts
        });
        
        // Enviar alerta
        await this.sendAlert(event, 'max_attempts_exceeded');
        
        return {
          success: false,
          reason: 'max_attempts_exceeded',
          event_id: eventId
        };
      }

      // Atualizar status para retry
      await event.update({
        status: 'retrying',
        retry_count: currentRetries + 1,
        processed_at: new Date()
      });

      logger.info(`Retrying evento ${eventId}`, {
        event_id: eventId,
        event_type: event.event_type,
        retry_count: currentRetries + 1,
        max_attempts: config.maxAttempts,
        trace_id: event.trace_id
      });

      // Simular processamento do evento
      // Em produção, isso deve chamar o handler real do evento
      await this.processEvent(event);

      // Atualizar status para processado
      await event.update({
        status: 'processed',
        processed_at: new Date(),
        dlq_at: null
      });

      logger.info(`✅ Evento ${eventId} reprocessado com sucesso`, {
        event_id: eventId,
        event_type: event.event_type,
        retry_count: currentRetries + 1,
        trace_id: event.trace_id
      });

      // Registrar no audit log
      await AuditLog.create({
        user_id: null,
        action: 'RETRY_SUCCESS',
        resource_type: 'events',
        resource_id: eventId,
        details: {
          event_type: event.event_type,
          retry_count: currentRetries + 1,
          trace_id: event.trace_id
        },
        ip_address: '127.0.0.1',
        user_agent: 'dlq-retry-service'
      });

      this.stats.successful++;
      
      return {
        success: true,
        event_id: eventId,
        retry_count: currentRetries + 1
      };

    } catch (error) {
      logger.error(`Erro ao fazer retry do evento ${eventId}`, {
        event_id: eventId,
        error: error.message,
        stack: error.stack
      });

      // Atualizar evento com erro
      const event = await Event.findByPk(eventId);
      if (event) {
        const currentRetries = event.retry_count || 0;
        const config = this.getRetryConfig(event.event_type);

        if (currentRetries + 1 >= config.maxAttempts) {
          // Mover definitivamente para DLQ
          await event.update({
            status: 'dlq',
            error_message: error.message,
            dlq_at: new Date()
          });
          
          await this.sendAlert(event, 'permanent_failure');
          this.stats.movedToDLQ++;
        } else {
          // Manter em failed para retry posterior
          await event.update({
            status: 'failed',
            error_message: error.message
          });
        }
      }

      this.stats.failed++;
      
      return {
        success: false,
        reason: 'processing_error',
        error: error.message,
        event_id: eventId
      };
    }
  }

  /**
   * Processar evento (placeholder)
   * Em produção, deve chamar o handler real baseado em event_type
   */
  async processEvent(event) {
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simular falha aleatória (20% de chance)
    if (Math.random() < 0.2) {
      throw new Error('Simulated processing error');
    }
    
    logger.debug(`Evento processado: ${event.event_type}`, {
      event_id: event.id,
      trace_id: event.trace_id
    });
  }

  /**
   * Retry em lote de eventos DLQ
   */
  async retryBatch(limit = 10, priority = null) {
    try {
      this.isRunning = true;
      
      logger.info('Iniciando retry em lote de eventos DLQ', { limit, priority });

      // Buscar eventos DLQ
      const where = {
        status: 'dlq'
      };

      // Filtrar por prioridade se especificado
      if (priority) {
        const eventTypes = Object.entries(RETRY_CONFIG)
          .filter(([_, config]) => config.priority === priority)
          .map(([type, _]) => type);
        
        where.event_type = {
          [Sequelize.Op.in]: eventTypes
        };
      }

      const events = await Event.findAll({
        where,
        limit,
        order: [['dlq_at', 'ASC']] // Mais antigos primeiro
      });

      logger.info(`Encontrados ${events.length} eventos DLQ para retry`);

      const results = [];
      
      for (const event of events) {
        const retryCount = event.retry_count || 0;
        const delay = this.getBackoffDelay(retryCount);
        
        logger.debug(`Aguardando ${delay}ms antes de retry...`, {
          event_id: event.id,
          retry_count: retryCount
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const result = await this.retryEvent(event.id);
        results.push(result);
        
        this.stats.totalRetried++;
      }

      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };

      logger.info('✅ Retry em lote concluído', summary);

      this.isRunning = false;
      
      return summary;

    } catch (error) {
      this.isRunning = false;
      logger.error('Erro no retry em lote', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Enviar alerta (webhook/email)
   */
  async sendAlert(event, alertType) {
    try {
      const alertData = {
        type: alertType,
        event_id: event.id,
        event_type: event.event_type,
        trace_id: event.trace_id,
        retry_count: event.retry_count,
        error_message: event.error_message,
        timestamp: new Date().toISOString()
      };

      logger.warn(`🚨 Alerta DLQ: ${alertType}`, alertData);

      // TODO: Implementar webhook/email real
      // await fetch(process.env.ALERT_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(alertData)
      // });

      // Registrar alerta no audit log
      await AuditLog.create({
        user_id: null,
        action: 'DLQ_ALERT',
        resource_type: 'events',
        resource_id: event.id,
        details: alertData,
        ip_address: '127.0.0.1',
        user_agent: 'dlq-retry-service'
      });

    } catch (error) {
      logger.error('Erro ao enviar alerta', {
        error: error.message,
        event_id: event.id
      });
    }
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning
    };
  }

  /**
   * Resetar estatísticas
   */
  resetStats() {
    this.stats = {
      totalRetried: 0,
      successful: 0,
      failed: 0,
      movedToDLQ: 0
    };
  }

  /**
   * Retry automático contínuo (para ser executado por cron)
   */
  async runAutomatedRetry() {
    if (this.isRunning) {
      logger.warn('Retry automático já está em execução');
      return;
    }

    try {
      logger.info('🤖 Iniciando retry automático de eventos DLQ');

      // Retry de eventos de alta prioridade primeiro
      await this.retryBatch(5, 'high');
      
      // Aguardar 5 segundos
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Retry de eventos de prioridade média
      await this.retryBatch(10, 'medium');
      
      // Aguardar 10 segundos
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Retry de eventos de baixa prioridade
      await this.retryBatch(20, 'low');

      logger.info('✅ Retry automático concluído', this.getStats());

    } catch (error) {
      logger.error('Erro no retry automático', {
        error: error.message,
        stack: error.stack
      });
    }
  }
}

// Singleton
const dlqRetryService = new DLQRetryService();

export default dlqRetryService;
