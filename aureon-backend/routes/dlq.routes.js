/**
 * DLQ (Dead Letter Queue) Management Routes
 * Endpoints para monitorar e controlar a fila de eventos falhados
 */

import express from 'express';
import dlqService from '../services/dlq.service.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/dlq/stats
 * Retorna estatísticas da DLQ
 */
router.get('/stats', authenticate, authorize(['admin', 'gerente']), async (req, res, next) => {
  try {
    const stats = await dlqService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dlq/retry/:eventId
 * Retry manual de um evento específico
 */
router.post('/retry/:eventId', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await dlqService.manualRetry(eventId);
    
    res.json({
      success: true,
      message: 'Event scheduled for retry',
      data: event
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dlq/cleanup
 * Limpa eventos antigos completados
 */
router.post('/cleanup', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { olderThanDays = 30 } = req.body;
    const deleted = await dlqService.cleanup(olderThanDays);
    
    res.json({
      success: true,
      message: `Cleaned up ${deleted} old events`,
      data: { deleted, olderThanDays }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dlq/start
 * Inicia o serviço de retry (caso tenha sido parado)
 */
router.post('/start', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    dlqService.start();
    res.json({
      success: true,
      message: 'DLQ service started'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dlq/stop
 * Para o serviço de retry
 */
router.post('/stop', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    dlqService.stop();
    res.json({
      success: true,
      message: 'DLQ service stopped'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
