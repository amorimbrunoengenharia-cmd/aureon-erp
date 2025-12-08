import { BugReport, User, AuditLog } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

class BugReportService {
  /**
   * Create new bug report
   */
  async createBugReport(data, currentUser) {
    try {
      const bugReport = await BugReport.create({
        title: data.title,
        description: data.description,
        severity: data.severity || 'medium',
        priority: data.priority || 'medium',
        category: data.category,
        reported_by: currentUser.id,
        tenant_id: currentUser.tenant_id,
        error_stack: data.error_stack,
        error_message: data.error_message,
        component_name: data.component_name,
        user_agent: data.user_agent,
        url: data.url,
        steps_to_reproduce: data.steps_to_reproduce,
        expected_behavior: data.expected_behavior,
        actual_behavior: data.actual_behavior,
        attachments: data.attachments || [],
        metadata: data.metadata || {}
      });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'CREATE_BUG_REPORT',
        resource_type: 'bug_report',
        resource_id: bugReport.id,
        details: {
          title: bugReport.title,
          severity: bugReport.severity,
          priority: bugReport.priority
        }
      });

      return bugReport;
    } catch (error) {
      logger.error('Error creating bug report:', error);
      throw error;
    }
  }

  /**
   * List bug reports with filters and pagination
   */
  async listBugReports(filters = {}, pagination = { page: 1, limit: 50 }) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const where = {};
      if (filters.status) where.status = filters.status;
      if (filters.severity) where.severity = filters.severity;
      if (filters.priority) where.priority = filters.priority;
      if (filters.assigned_to) where.assigned_to = filters.assigned_to;
      if (filters.reported_by) where.reported_by = filters.reported_by;
      if (filters.tenant_id) where.tenant_id = filters.tenant_id;

      const { rows: bugReports, count } = await BugReport.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'username', 'email', 'role']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'username', 'email', 'role']
          },
          {
            model: User,
            as: 'resolver',
            attributes: ['id', 'username', 'email']
          }
        ],
        limit,
        offset,
        order: [
          ['priority', 'DESC'],
          ['severity', 'DESC'],
          ['created_at', 'DESC']
        ]
      });

      return {
        bugReports,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      };
    } catch (error) {
      logger.error('Error listing bug reports:', error);
      throw error;
    }
  }

  /**
   * Get bug report statistics
   */
  async getBugReportStats() {
    try {
      const [
        totalCount,
        byStatus,
        bySeverity,
        byPriority,
        recentCount
      ] = await Promise.all([
        BugReport.count(),
        BugReport.findAll({
          attributes: [
            'status',
            [BugReport.sequelize.fn('COUNT', BugReport.sequelize.col('id')), 'count']
          ],
          group: ['status']
        }),
        BugReport.findAll({
          attributes: [
            'severity',
            [BugReport.sequelize.fn('COUNT', BugReport.sequelize.col('id')), 'count']
          ],
          group: ['severity']
        }),
        BugReport.findAll({
          attributes: [
            'priority',
            [BugReport.sequelize.fn('COUNT', BugReport.sequelize.col('id')), 'count']
          ],
          group: ['priority']
        }),
        BugReport.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      return {
        total: totalCount,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, item) => {
          acc[item.severity] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        recentCount
      };
    } catch (error) {
      logger.error('Error getting bug report stats:', error);
      throw error;
    }
  }

  /**
   * Get bug report by ID
   */
  async getBugReportById(bugReportId, currentUser) {
    try {
      const bugReport = await BugReport.findByPk(bugReportId, {
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'username', 'email', 'role']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'username', 'email', 'role']
          },
          {
            model: User,
            as: 'resolver',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!bugReport) {
        throw new Error('Bug report not found');
      }

      // Check access: CEO/GERENTE see all, others only their own
      if (!['CEO', 'GERENTE'].includes(currentUser.role) && 
          bugReport.reported_by !== currentUser.id) {
        throw new Error('Access denied');
      }

      return bugReport;
    } catch (error) {
      logger.error('Error getting bug report:', error);
      throw error;
    }
  }

  /**
   * Update bug report
   */
  async updateBugReport(bugReportId, updates, currentUser) {
    try {
      const bugReport = await BugReport.findByPk(bugReportId);

      if (!bugReport) {
        throw new Error('Bug report not found');
      }

      // Check permissions
      const canUpdate = 
        ['CEO', 'GERENTE'].includes(currentUser.role) ||
        bugReport.reported_by === currentUser.id ||
        bugReport.assigned_to === currentUser.id;

      if (!canUpdate) {
        throw new Error('Access denied');
      }

      // Track changes
      const changes = {};
      if (updates.status && updates.status !== bugReport.status) {
        changes.status = { from: bugReport.status, to: updates.status };
      }
      if (updates.severity && updates.severity !== bugReport.severity) {
        changes.severity = { from: bugReport.severity, to: updates.severity };
      }
      if (updates.priority && updates.priority !== bugReport.priority) {
        changes.priority = { from: bugReport.priority, to: updates.priority };
      }

      await bugReport.update(updates);

      // Create audit log
      if (Object.keys(changes).length > 0) {
        await AuditLog.create({
          user_id: currentUser.id,
          action: 'UPDATE_BUG_REPORT',
          resource_type: 'bug_report',
          resource_id: bugReport.id,
          details: { changes, title: bugReport.title }
        });
      }

      return bugReport;
    } catch (error) {
      logger.error('Error updating bug report:', error);
      throw error;
    }
  }

  /**
   * Assign bug report to user
   */
  async assignBugReport(bugReportId, assignedToUserId, currentUser) {
    try {
      const bugReport = await BugReport.findByPk(bugReportId);

      if (!bugReport) {
        throw new Error('Bug report not found');
      }

      // Verify assignee exists
      const assignee = await User.findByPk(assignedToUserId);
      if (!assignee) {
        throw new Error('Assignee user not found');
      }

      await bugReport.update({ 
        assigned_to: assignedToUserId,
        status: 'in_progress'
      });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'ASSIGN_BUG_REPORT',
        resource_type: 'bug_report',
        resource_id: bugReport.id,
        details: {
          title: bugReport.title,
          assigned_to: assignee.username,
          assigned_by: currentUser.username
        }
      });

      return bugReport;
    } catch (error) {
      logger.error('Error assigning bug report:', error);
      throw error;
    }
  }

  /**
   * Resolve bug report
   */
  async resolveBugReport(bugReportId, resolutionNotes, currentUser) {
    try {
      const bugReport = await BugReport.findByPk(bugReportId);

      if (!bugReport) {
        throw new Error('Bug report not found');
      }

      // Check permissions
      const canResolve = 
        ['CEO', 'GERENTE'].includes(currentUser.role) ||
        bugReport.assigned_to === currentUser.id;

      if (!canResolve) {
        throw new Error('Access denied');
      }

      await bugReport.update({
        status: 'resolved',
        resolved_at: new Date(),
        resolved_by: currentUser.id,
        resolution_notes: resolutionNotes
      });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'RESOLVE_BUG_REPORT',
        resource_type: 'bug_report',
        resource_id: bugReport.id,
        details: {
          title: bugReport.title,
          resolution_notes: resolutionNotes
        }
      });

      return bugReport;
    } catch (error) {
      logger.error('Error resolving bug report:', error);
      throw error;
    }
  }

  /**
   * Delete bug report
   */
  async deleteBugReport(bugReportId, currentUser) {
    try {
      const bugReport = await BugReport.findByPk(bugReportId);

      if (!bugReport) {
        throw new Error('Bug report not found');
      }

      const title = bugReport.title;

      await bugReport.destroy();

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'DELETE_BUG_REPORT',
        resource_type: 'bug_report',
        resource_id: bugReportId,
        details: { title }
      });

      return true;
    } catch (error) {
      logger.error('Error deleting bug report:', error);
      throw error;
    }
  }
}

export default new BugReportService();
