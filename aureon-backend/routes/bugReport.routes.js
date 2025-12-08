import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { body, validationResult } from 'express-validator';
import bugReportService from '../services/bugReportService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /api/it/bug-reports
 * Create new bug report (All authenticated users)
 */
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('category').optional().trim().isLength({ max: 100 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bugReport = await bugReportService.createBugReport(req.body, req.user);

      logger.info('Bug report created', { 
        bugReportId: bugReport.id, 
        severity: bugReport.severity,
        by: req.user.username 
      });

      res.status(201).json({
        success: true,
        bugReport
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/it/bug-reports
 * List bug reports with filters (CEO/GERENTE see all, others see own)
 */
router.get(
  '/',
  async (req, res, next) => {
    try {
      const { 
        status, 
        severity, 
        priority, 
        assigned_to,
        reported_by,
        page = 1, 
        limit = 50 
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (priority) filters.priority = priority;
      if (assigned_to) filters.assigned_to = assigned_to;
      if (reported_by) filters.reported_by = reported_by;

      // Non-admin users only see their own reports
      if (!['CEO', 'GERENTE'].includes(req.user.role)) {
        filters.reported_by = req.user.id;
      }

      const result = await bugReportService.listBugReports(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.bugReports,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/it/bug-reports/stats
 * Get bug report statistics (CEO/GERENTE only)
 */
router.get(
  '/stats',
  authorize(['CEO', 'GERENTE']),
  async (req, res, next) => {
    try {
      const stats = await bugReportService.getBugReportStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/it/bug-reports/:id
 * Get bug report by ID
 */
router.get(
  '/:id',
  async (req, res, next) => {
    try {
      const bugReport = await bugReportService.getBugReportById(req.params.id, req.user);

      res.json({
        success: true,
        bugReport
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/it/bug-reports/:id
 * Update bug report (CEO/GERENTE or reporter)
 */
router.patch(
  '/:id',
  [
    body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed', 'wont_fix']),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('assigned_to').optional().isUUID()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bugReport = await bugReportService.updateBugReport(
        req.params.id, 
        req.body, 
        req.user
      );

      logger.info('Bug report updated', { 
        bugReportId: bugReport.id, 
        by: req.user.username 
      });

      res.json({
        success: true,
        bugReport
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/it/bug-reports/:id/assign
 * Assign bug report to user (CEO/GERENTE only)
 */
router.post(
  '/:id/assign',
  authorize(['CEO', 'GERENTE']),
  [
    body('assigned_to').isUUID().withMessage('Valid user ID required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bugReport = await bugReportService.assignBugReport(
        req.params.id,
        req.body.assigned_to,
        req.user
      );

      logger.info('Bug report assigned', {
        bugReportId: bugReport.id,
        assignedTo: req.body.assigned_to,
        by: req.user.username
      });

      res.json({
        success: true,
        bugReport
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/it/bug-reports/:id/resolve
 * Resolve bug report (CEO/GERENTE or assignee)
 */
router.post(
  '/:id/resolve',
  [
    body('resolution_notes').trim().isLength({ min: 10 }).withMessage('Resolution notes required (min 10 chars)')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const bugReport = await bugReportService.resolveBugReport(
        req.params.id,
        req.body.resolution_notes,
        req.user
      );

      logger.info('Bug report resolved', {
        bugReportId: bugReport.id,
        by: req.user.username
      });

      res.json({
        success: true,
        bugReport
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/it/bug-reports/:id
 * Delete bug report (CEO only)
 */
router.delete(
  '/:id',
  authorize(['CEO']),
  async (req, res, next) => {
    try {
      await bugReportService.deleteBugReport(req.params.id, req.user);

      logger.warn('Bug report deleted', {
        bugReportId: req.params.id,
        by: req.user.username
      });

      res.json({
        success: true,
        message: 'Bug report deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
