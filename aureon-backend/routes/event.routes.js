import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import Event from '../models/Event.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';
import dlqRetryService from '../services/dlqRetryService.js';

const router = express.Router();

/**
 * GET /api/events
 * Listar eventos do sistema
 * Nota: Permite acesso sem autenticação com limite de 1000 eventos para o EventBus
 */
router.get('/', async (req, res, next) => {
  try {
    const { event_type, status, trace_id, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (event_type) where.event_type = event_type;
    if (status) where.status = status;
    if (trace_id) where.trace_id = trace_id;
    
    if (data_inicio && data_fim) {
      where.created_at = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const offset = (page - 1) * limit;

    const { rows: events, count } = await Event.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: events,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events
 * Criar novo evento (público - usado pelo EventBus do frontend)
 */
router.post('/', async (req, res, next) => {
  try {
    const { trace_id, event_type, payload, metadata, status = 'pending' } = req.body;
    
    const event = await Event.create({
      trace_id,
      event_type,
      payload,
      metadata,
      status
    });

    logger.info(`Evento criado via API`, {
      event_id: event.id,
      event_type: event.event_type,
      trace_id: event.trace_id
    });

    res.status(201).json({
      success: true,
      message: 'Evento criado com sucesso',
      data: event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/trace/:traceId
 * Obter todos os eventos de um trace_id (distributed tracing)
 */
router.get('/trace/:traceId', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { trace_id: req.params.traceId },
      order: [['created_at', 'ASC']]
    });

    if (events.length === 0) {
      return res.status(404).json({ error: 'No events found for this trace_id' });
    }

    res.json({
      success: true,
      trace_id: req.params.traceId,
      event_count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/dlq
 * Listar eventos na Dead Letter Queue (status=dlq)
 */
router.get('/dlq', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { status: 'dlq' },
      order: [['dlq_at', 'DESC']]
    });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:id/retry
 * Retry de evento que falhou ou está na DLQ
 */
router.post('/:id/retry', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!['failed', 'dlq'].includes(event.status)) {
      return res.status(400).json({ 
        error: 'Can only retry failed or DLQ events',
        current_status: event.status
      });
    }

    // Reset event for retry
    await event.update({
      status: 'pending',
      retry_count: event.retry_count + 1,
      error_message: null,
      processed_at: null,
      dlq_at: null
    });

    logger.info(`Event ${event.id} (${event.event_type}) retry initiated by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Event queued for retry',
      data: event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/stats
 * Estatísticas de eventos
 */
router.get('/stats', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const where = {};
    if (data_inicio && data_fim) {
      where.created_at = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const events = await Event.findAll({ where });

    const stats = {
      total: events.length,
      pending: events.filter(e => e.status === 'pending').length,
      processing: events.filter(e => e.status === 'processing').length,
      completed: events.filter(e => e.status === 'completed').length,
      failed: events.filter(e => e.status === 'failed').length,
      dlq: events.filter(e => e.status === 'dlq').length,
      success_rate: events.length > 0 
        ? ((events.filter(e => e.status === 'completed').length / events.length) * 100).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/retry-batch
 * Retry em lote de eventos DLQ
 */
router.post('/retry-batch', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const { limit = 10, priority } = req.body;
    
    logger.info('Iniciando retry em lote via API', {
      user: req.user.username,
      limit,
      priority
    });

    const result = await dlqRetryService.retryBatch(limit, priority);
    
    res.json({
      success: true,
      message: 'Retry em lote executado',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/retry-stats
 * Obter estatísticas do DLQ retry service
 */
router.get('/retry-stats', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const stats = dlqRetryService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/run-automated-retry
 * Executar retry automático manualmente
 */
router.post('/run-automated-retry', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    logger.info('Executando retry automático via API', {
      user: req.user.username
    });

    // Executar em background
    dlqRetryService.runAutomatedRetry().catch(error => {
      logger.error('Erro no retry automático', { error: error.message });
    });
    
    res.json({
      success: true,
      message: 'Retry automático iniciado em background'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
