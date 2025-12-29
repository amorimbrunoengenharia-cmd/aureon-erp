import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { AuditLog, User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';
import auditService from '../services/auditService.js';

const router = express.Router();

/**
 * GET /api/audit
 * Listar logs de auditoria (CEO e IT)
 */
router.get('/', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const { user_id, action, resource_type, resource_id, data_inicio, data_fim, page = 1, limit = 100 } = req.query;
    
    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (resource_type) where.resource_type = resource_type;
    if (resource_id) where.resource_id = resource_id;
    
    if (data_inicio && data_fim) {
      where.created_at = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const offset = (page - 1) * limit;

    const { rows: logs, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'role'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: logs,
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
 * GET /api/audit/user/:userId
 * Histórico de atividades de um usuário específico
 */
router.get('/user/:userId', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const { action, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
    
    const where = { user_id: req.params.userId };
    if (action) where.action = action;
    
    if (data_inicio && data_fim) {
      where.created_at = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const offset = (page - 1) * limit;

    const { rows: logs, count } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'role'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    if (logs.length === 0) {
      return res.status(404).json({ error: 'No audit logs found for this user' });
    }

    res.json({
      success: true,
      user_id: req.params.userId,
      data: logs,
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
 * GET /api/audit/stats
 * Estatísticas de auditoria
 */
router.get('/stats', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const where = {};
    if (data_inicio && data_fim) {
      where.created_at = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const logs = await AuditLog.findAll({ where });

    const stats = {
      total: logs.length,
      by_action: {
        CREATE: logs.filter(l => l.action === 'CREATE').length,
        UPDATE: logs.filter(l => l.action === 'UPDATE').length,
        DELETE: logs.filter(l => l.action === 'DELETE').length,
        LOGIN: logs.filter(l => l.action === 'LOGIN').length,
        LOGOUT: logs.filter(l => l.action === 'LOGOUT').length
      },
      by_resource: logs.reduce((acc, log) => {
        acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
        return acc;
      }, {}),
      unique_users: new Set(logs.map(l => l.user_id)).size
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
 * POST /api/audit/log
 * Criar log de auditoria manualmente (para ações do frontend)
 */
router.post('/log', authenticate, async (req, res, next) => {
  try {
    const { action, resource_type, resource_id, changes } = req.body;

    if (!action || !resource_type) {
      return res.status(400).json({ error: 'action and resource_type are required' });
    }

    const log = await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action,
      resource_type,
      resource_id,
      changes,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    logger.info(`Audit log created: ${action} on ${resource_type} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/user/:userId
 * Obter atividades de um usuário específico
 */
router.get('/user/:userId', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const result = await auditService.getUserActivity(req.params.userId, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/resource/:resourceType/:resourceId
 * Obter histórico de um recurso específico
 */
router.get('/resource/:resourceType/:resourceId', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const result = await auditService.getResourceHistory(resourceType, resourceId, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/report
 * Gerar relatório de auditoria com filtros avançados
 */
router.get('/report', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const result = await auditService.getAuditReport(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/recent
 * Obter mudanças recentes
 */
router.get('/recent', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const result = await auditService.getRecentChanges(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/export
 * Exportar logs de auditoria
 */
router.get('/export', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const { format = 'json', ...filters } = req.query;
    const result = await auditService.exportAuditLog(filters, format);

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename=audit_export_${Date.now()}.json`);
      res.setHeader('Content-Type', 'application/json');
      res.json(result);
    } else if (format === 'csv') {
      const csv = [
        result.headers.join(','),
        ...result.rows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Disposition', `attachment; filename=audit_export_${Date.now()}.csv`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/statistics
 * Obter estatísticas de auditoria
 */
router.get('/statistics/:period?', authenticate, authorize(['CEO', 'IT']), async (req, res, next) => {
  try {
    const period = req.params.period || '30d';
    const result = await auditService.getAuditStatistics(period);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
