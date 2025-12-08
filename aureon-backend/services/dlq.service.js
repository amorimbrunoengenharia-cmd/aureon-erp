/**
 * DLQ (Dead Letter Queue) Retry Service
 * Processa automaticamente eventos falhados e implementa retry com backoff exponencial
 */

import { Event } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class DLQService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.config = {
      checkIntervalMs: 60000, // 1 minuto
      maxRetries: 5,
      baseDelayMs: 5000, // 5 segundos
      maxDelayMs: 300000, // 5 minutos
      batchSize: 50
    };
  }

  /**
   * Inicia o serviço de retry automático
   */
  start() {
    if (this.isRunning) {
      logger.warn('DLQ Service already running');
      return;
    }

    this.isRunning = true;
    logger.info('🔄 Starting DLQ Retry Service', {
      checkInterval: `${this.config.checkIntervalMs}ms`,
      maxRetries: this.config.maxRetries
    });

    // Processar imediatamente ao iniciar
    this.processRetries();

    // Configurar processamento periódico
    this.intervalId = setInterval(() => {
      this.processRetries();
    }, this.config.checkIntervalMs);
  }

  /**
   * Para o serviço de retry automático
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('🛑 DLQ Retry Service stopped');
  }

  /**
   * Processa eventos na DLQ elegíveis para retry
   */
  async processRetries() {
    if (!this.isRunning) {
      return;
    }

    try {
      const now = new Date();
      
      // Buscar eventos na DLQ prontos para retry
      const events = await Event.findAll({
        where: {
          status: 'dlq',
          retry_count: {
            [Op.lt]: this.config.maxRetries
          },
          [Op.or]: [
            { next_retry_at: null },
            { next_retry_at: { [Op.lte]: now } }
          ]
        },
        limit: this.config.batchSize,
        order: [['dlq_at', 'ASC']]
      });

      if (events.length === 0) {
        return;
      }

      logger.info(`📋 Processing ${events.length} events from DLQ`);

      for (const event of events) {
        await this.retryEvent(event);
      }

      logger.info(`✅ DLQ batch processed: ${events.length} events`);
    } catch (error) {
      logger.error('❌ Error processing DLQ retries:', error);
    }
  }

  /**
   * Tenta reprocessar um evento específico
   */
  async retryEvent(event) {
    const retryCount = event.retry_count + 1;
    const delay = this.calculateBackoff(retryCount);

    try {
      logger.info(`🔄 Retrying event ${event.id} (attempt ${retryCount}/${this.config.maxRetries})`);

      // Simular reprocessamento (aqui você integraria com seu sistema de eventos)
      // Por exemplo: await eventBus.reprocess(event);
      
      // Por enquanto, apenas marcamos como pending para retry
      await event.update({
        status: 'pending',
        retry_count: retryCount,
        next_retry_at: new Date(Date.now() + delay),
        processed_at: null,
        error_message: null
      });

      logger.info(`✅ Event ${event.id} scheduled for retry in ${delay}ms`);
    } catch (error) {
      logger.error(`❌ Failed to retry event ${event.id}:`, error);

      // Se exceder max retries, marcar como failed permanentemente
      if (retryCount >= this.config.maxRetries) {
        await event.update({
          status: 'failed',
          retry_count: retryCount,
          error_message: `Max retries (${this.config.maxRetries}) exceeded: ${error.message}`
        });

        logger.warn(`⚠️  Event ${event.id} permanently failed after ${retryCount} retries`);
      } else {
        // Agendar próximo retry com backoff
        const nextRetry = new Date(Date.now() + delay);
        await event.update({
          retry_count: retryCount,
          next_retry_at: nextRetry,
          error_message: error.message
        });

        logger.info(`🕐 Event ${event.id} will retry at ${nextRetry.toISOString()}`);
      }
    }
  }

  /**
   * Calcula delay de backoff exponencial
   */
  calculateBackoff(retryCount) {
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000; // 0-1s de jitter
    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelayMs);
    return Math.floor(delay);
  }

  /**
   * Retorna estatísticas da DLQ
   */
  async getStats() {
    try {
      const [total, pending, processing, dlq, failed, completed] = await Promise.all([
        Event.count(),
        Event.count({ where: { status: 'pending' } }),
        Event.count({ where: { status: 'processing' } }),
        Event.count({ where: { status: 'dlq' } }),
        Event.count({ where: { status: 'failed' } }),
        Event.count({ where: { status: 'completed' } })
      ]);

      const eligibleForRetry = await Event.count({
        where: {
          status: 'dlq',
          retry_count: { [Op.lt]: this.config.maxRetries },
          [Op.or]: [
            { next_retry_at: null },
            { next_retry_at: { [Op.lte]: new Date() } }
          ]
        }
      });

      return {
        total,
        byStatus: {
          pending,
          processing,
          dlq,
          failed,
          completed
        },
        eligibleForRetry,
        config: {
          isRunning: this.isRunning,
          checkIntervalMs: this.config.checkIntervalMs,
          maxRetries: this.config.maxRetries
        }
      };
    } catch (error) {
      logger.error('Error getting DLQ stats:', error);
      throw error;
    }
  }

  /**
   * Move evento de volta para pending (retry manual)
   */
  async manualRetry(eventId) {
    try {
      const event = await Event.findByPk(eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'dlq' && event.status !== 'failed') {
        throw new Error(`Event status must be 'dlq' or 'failed', got '${event.status}'`);
      }

      await event.update({
        status: 'pending',
        next_retry_at: new Date(),
        error_message: null
      });

      logger.info(`✅ Event ${eventId} manually scheduled for retry`);
      return event;
    } catch (error) {
      logger.error(`Failed to manually retry event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Limpa eventos antigos completados
   */
  async cleanup(olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await Event.destroy({
        where: {
          status: 'completed',
          processed_at: {
            [Op.lt]: cutoffDate
          }
        }
      });

      logger.info(`🗑️  Cleaned up ${deleted} events older than ${olderThanDays} days`);
      return deleted;
    } catch (error) {
      logger.error('Error cleaning up old events:', error);
      throw error;
    }
  }
}

// Singleton
const dlqService = new DLQService();

export default dlqService;
