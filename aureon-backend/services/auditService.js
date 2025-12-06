/**
 * Audit Service - Consultas e Relatórios de Auditoria
 * 
 * Funcionalidades:
 * - Histórico de atividades do usuário
 * - Histórico de mudanças de recurso
 * - Relatórios de auditoria com filtros
 * - Mudanças recentes
 * - Exportação de logs
 */

import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

class AuditService {
  /**
   * Obter atividades de um usuário
   */
  async getUserActivity(userId, options = {}) {
    const {
      startDate,
      endDate,
      action,
      resourceType,
      page = 1,
      limit = 50
    } = options;

    try {
      const where = { user_id: userId };

      // Filtros de data
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }

      // Filtros adicionais
      if (action) where.action = action;
      if (resourceType) where.resource_type = resourceType;

      const offset = (page - 1) * limit;

      const { rows: logs, count } = await AuditLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'role']
          }
        ]
      });

      // Parse JSON fields
      const parsedLogs = logs.map(log => {
        const logData = log.toJSON();
        try {
          if (logData.changes) logData.changes = JSON.parse(logData.changes);
        } catch (e) {}
        try {
          if (logData.request_body) logData.request_body = JSON.parse(logData.request_body);
        } catch (e) {}
        try {
          if (logData.query_params) logData.query_params = JSON.parse(logData.query_params);
        } catch (e) {}
        return logData;
      });

      return {
        success: true,
        data: parsedLogs,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de mudanças de um recurso
   */
  async getResourceHistory(resourceType, resourceId, options = {}) {
    const {
      startDate,
      endDate,
      action,
      page = 1,
      limit = 50
    } = options;

    try {
      const where = {
        resource_type: resourceType,
        resource_id: resourceId
      };

      // Filtros de data
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }

      // Filtro de ação
      if (action) where.action = action;

      const offset = (page - 1) * limit;

      const { rows: logs, count } = await AuditLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'role']
          }
        ]
      });

      // Parse JSON fields
      const parsedLogs = logs.map(log => {
        const logData = log.toJSON();
        try {
          if (logData.changes) logData.changes = JSON.parse(logData.changes);
        } catch (e) {}
        return logData;
      });

      return {
        success: true,
        data: parsedLogs,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error getting resource history:', error);
      throw error;
    }
  }

  /**
   * Obter relatório de auditoria com filtros avançados
   */
  async getAuditReport(filters = {}) {
    const {
      startDate,
      endDate,
      userId,
      action,
      resourceType,
      resourceId,
      minStatusCode,
      maxStatusCode,
      search,
      page = 1,
      limit = 100
    } = filters;

    try {
      const where = {};

      // Filtros de data
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }

      // Filtros específicos
      if (userId) where.user_id = userId;
      if (action) where.action = action;
      if (resourceType) where.resource_type = resourceType;
      if (resourceId) where.resource_id = resourceId;

      // Filtro de status code
      if (minStatusCode || maxStatusCode) {
        where.status_code = {};
        if (minStatusCode) where.status_code[Op.gte] = minStatusCode;
        if (maxStatusCode) where.status_code[Op.lte] = maxStatusCode;
      }

      // Busca por texto (username ou path)
      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { path: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { rows: logs, count } = await AuditLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'role']
          }
        ]
      });

      // Parse JSON fields and calculate statistics
      const parsedLogs = logs.map(log => {
        const logData = log.toJSON();
        try {
          if (logData.changes) logData.changes = JSON.parse(logData.changes);
        } catch (e) {}
        try {
          if (logData.request_body) logData.request_body = JSON.parse(logData.request_body);
        } catch (e) {}
        return logData;
      });

      // Calculate statistics
      const stats = {
        total: count,
        by_action: {},
        by_resource: {},
        by_status: {},
        by_user: {}
      };

      logs.forEach(log => {
        // By action
        stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
        
        // By resource type
        stats.by_resource[log.resource_type] = (stats.by_resource[log.resource_type] || 0) + 1;
        
        // By status code
        if (log.status_code) {
          const statusGroup = `${Math.floor(log.status_code / 100)}xx`;
          stats.by_status[statusGroup] = (stats.by_status[statusGroup] || 0) + 1;
        }
        
        // By user
        if (log.username) {
          stats.by_user[log.username] = (stats.by_user[log.username] || 0) + 1;
        }
      });

      return {
        success: true,
        data: parsedLogs,
        statistics: stats,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error getting audit report:', error);
      throw error;
    }
  }

  /**
   * Obter mudanças recentes (últimas 24h por padrão)
   */
  async getRecentChanges(options = {}) {
    const {
      hours = 24,
      action = ['create', 'update', 'delete'],
      limit = 50
    } = options;

    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const where = {
        created_at: { [Op.gte]: since },
        action: Array.isArray(action) ? { [Op.in]: action } : action
      };

      const logs = await AuditLog.findAll({
        where,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'role']
          }
        ]
      });

      // Parse JSON fields
      const parsedLogs = logs.map(log => {
        const logData = log.toJSON();
        try {
          if (logData.changes) logData.changes = JSON.parse(logData.changes);
        } catch (e) {}
        return logData;
      });

      return {
        success: true,
        data: parsedLogs,
        period: `Last ${hours} hours`,
        count: logs.length
      };
    } catch (error) {
      logger.error('Error getting recent changes:', error);
      throw error;
    }
  }

  /**
   * Exportar logs de auditoria em formato JSON
   */
  async exportAuditLog(filters = {}, format = 'json') {
    try {
      const result = await this.getAuditReport({ ...filters, limit: 10000 });

      if (format === 'json') {
        return {
          success: true,
          data: result.data,
          statistics: result.statistics,
          exported_at: new Date().toISOString(),
          total_records: result.data.length
        };
      }

      // CSV format
      if (format === 'csv') {
        const headers = [
          'timestamp',
          'username',
          'action',
          'resource_type',
          'resource_id',
          'method',
          'path',
          'status_code',
          'ip_address'
        ];

        const rows = result.data.map(log => [
          log.created_at,
          log.username,
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.method,
          log.path,
          log.status_code || '',
          log.ip_address || ''
        ]);

        return {
          success: true,
          format: 'csv',
          headers,
          rows,
          exported_at: new Date().toISOString()
        };
      }

      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      logger.error('Error exporting audit log:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de auditoria
   */
  async getAuditStatistics(period = '30d') {
    try {
      // Parse period (30d, 7d, 24h, etc)
      const match = period.match(/^(\d+)([dhm])$/);
      if (!match) {
        throw new Error('Invalid period format. Use: 30d, 7d, 24h, 60m');
      }

      const [, value, unit] = match;
      const since = new Date();

      switch (unit) {
        case 'd':
          since.setDate(since.getDate() - parseInt(value));
          break;
        case 'h':
          since.setHours(since.getHours() - parseInt(value));
          break;
        case 'm':
          since.setMinutes(since.getMinutes() - parseInt(value));
          break;
      }

      const logs = await AuditLog.findAll({
        where: {
          created_at: { [Op.gte]: since }
        },
        attributes: ['action', 'resource_type', 'status_code', 'username', 'created_at']
      });

      const stats = {
        period,
        total_logs: logs.length,
        by_action: {},
        by_resource: {},
        by_status: {},
        by_user: {},
        top_users: [],
        top_resources: [],
        failed_requests: 0,
        timeline: {}
      };

      logs.forEach(log => {
        // By action
        stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
        
        // By resource
        stats.by_resource[log.resource_type] = (stats.by_resource[log.resource_type] || 0) + 1;
        
        // By status
        if (log.status_code) {
          const group = `${Math.floor(log.status_code / 100)}xx`;
          stats.by_status[group] = (stats.by_status[group] || 0) + 1;
          
          if (log.status_code >= 400) {
            stats.failed_requests++;
          }
        }
        
        // By user
        if (log.username) {
          stats.by_user[log.username] = (stats.by_user[log.username] || 0) + 1;
        }

        // Timeline (by day)
        const day = log.created_at.toISOString().split('T')[0];
        stats.timeline[day] = (stats.timeline[day] || 0) + 1;
      });

      // Top users
      stats.top_users = Object.entries(stats.by_user)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([user, count]) => ({ user, count }));

      // Top resources
      stats.top_resources = Object.entries(stats.by_resource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([resource, count]) => ({ resource, count }));

      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      logger.error('Error getting audit statistics:', error);
      throw error;
    }
  }
}

export default new AuditService();
