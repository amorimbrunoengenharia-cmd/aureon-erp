import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { body, validationResult } from 'express-validator';
import userService from '../services/userService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /api/users
 * Create new user (CEO only)
 */
router.post(
  '/',
  authorize(['CEO']),
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['CEO', 'VENDAS', 'ESTOQUE', 'COMPRAS', 'FINANCEIRO']).withMessage('Invalid role'),
    body('tenant_id').optional().isUUID().withMessage('Invalid tenant ID')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await userService.createUser(req.body, req.user);

      logger.info('User created', { userId: user.id, username: user.username, by: req.user.username });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          active: user.active
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users
 * List all users (CEO only)
 */
router.get(
  '/',
  authorize(['CEO']),
  async (req, res, next) => {
    try {
      const { role, active, tenant_id, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (role) filters.role = role;
      if (active !== undefined) filters.active = active === 'true';
      if (tenant_id) filters.tenant_id = tenant_id;

      const result = await userService.listUsers(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users/:id
 * Get user by ID (CEO only)
 */
router.get(
  '/:id',
  authorize(['CEO']),
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/users/:id
 * Update user (CEO only)
 */
router.patch(
  '/:id',
  authorize(['CEO']),
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['CEO', 'VENDAS', 'ESTOQUE', 'COMPRAS', 'FINANCEIRO']).withMessage('Invalid role'),
    body('active').optional().isBoolean().withMessage('Active must be boolean'),
    body('settings').optional().isObject().withMessage('Settings must be an object')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await userService.updateUser(req.params.id, req.body, req.user);

      logger.info('User updated', { userId: user.id, by: req.user.username });

      res.json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/users/:id
 * Deactivate user (CEO only)
 */
router.delete(
  '/:id',
  authorize(['CEO']),
  async (req, res, next) => {
    try {
      await userService.deactivateUser(req.params.id, req.user);

      logger.warn('User deactivated', { userId: req.params.id, by: req.user.username });

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users/:id/reset-password
 * Reset user password (CEO or self)
 */
router.post(
  '/:id/reset-password',
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      // Check if user is CEO or resetting own password
      if (req.user.role !== 'CEO' && req.user.id !== id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only reset your own password'
        });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          error: 'Invalid password',
          message: 'Password must be at least 6 characters'
        });
      }

      await userService.resetPassword(id, newPassword, req.user);

      logger.info('Password reset', { userId: id, by: req.user.username });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users/invite
 * Send invite email (CEO only)
 */
router.post(
  '/invite',
  authorize(['CEO']),
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').isIn(['CEO', 'VENDAS', 'ESTOQUE', 'COMPRAS', 'FINANCEIRO']).withMessage('Invalid role')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const invite = await userService.inviteUser(req.body.email, req.body.role, req.user);

      logger.info('User invited', { email: req.body.email, by: req.user.username });

      res.status(201).json({
        success: true,
        message: 'Invite sent successfully',
        inviteToken: invite.token,
        expiresAt: invite.expiresAt
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/users/accept-invite/:token
 * Accept invite and set password (public)
 */
router.post(
  '/accept-invite/:token',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await userService.acceptInvite(
        req.params.token,
        req.body.username,
        req.body.password
      );

      logger.info('Invite accepted', { userId: user.id, username: user.username });

      res.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
