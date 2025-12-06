import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import alertService from '../services/alertService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Obter todos os alertas ativos
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { severity, type } = req.query;
    
    // Executar verificações
    const result = await alertService.runAllChecks();
    
    let alerts = result.alerts;
    
    // Filtrar por severidade se especificado
    if (severity) {
      alerts = alertService.getAlertsBySeverity(severity);
    }
    
    // Filtrar por tipo se especificado
    if (type) {
      alerts = alertService.getAlertsByType(type);
    }
    
    res.json({
      success: true,
      data: alerts,
      summary: alertService.getSummary(),
      timestamp: result.timestamp
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/summary
 * Obter resumo de alertas
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    await alertService.runAllChecks();
    
    const summary = alertService.getSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/critical
 * Obter apenas alertas críticos
 */
router.get('/critical', authenticate, async (req, res, next) => {
  try {
    await alertService.runAllChecks();
    
    const criticalAlerts = alertService.getAlertsBySeverity('critical');
    
    res.json({
      success: true,
      count: criticalAlerts.length,
      data: criticalAlerts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/thresholds
 * Configurar thresholds de alertas (apenas CEO)
 */
router.put('/thresholds', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const { lowStock, noMovementDays, expiringDays, inactiveCustomerDays, delayedSupplierDays } = req.body;
    
    const newThresholds = {};
    if (lowStock !== undefined) newThresholds.lowStock = parseInt(lowStock);
    if (noMovementDays !== undefined) newThresholds.noMovementDays = parseInt(noMovementDays);
    if (expiringDays !== undefined) newThresholds.expiringDays = parseInt(expiringDays);
    if (inactiveCustomerDays !== undefined) newThresholds.inactiveCustomerDays = parseInt(inactiveCustomerDays);
    if (delayedSupplierDays !== undefined) newThresholds.delayedSupplierDays = parseInt(delayedSupplierDays);
    
    alertService.setThresholds(newThresholds);
    
    logger.info(`Thresholds atualizados por ${req.user.username}`, newThresholds);
    
    res.json({
      success: true,
      message: 'Thresholds atualizados com sucesso',
      data: alertService.thresholds
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/check
 * Forçar verificação de alertas manualmente
 */
router.post('/check', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    logger.info(`Verificação manual de alertas iniciada por ${req.user.username}`);
    
    const result = await alertService.runAllChecks();
    
    res.json({
      success: true,
      message: 'Verificação concluída',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
