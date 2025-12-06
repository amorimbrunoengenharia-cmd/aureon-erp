import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import tenantService from '../services/tenantService.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Middleware para verificar se usuário é super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_super_admin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only super administrators can access this resource'
    });
  }
  next();
};

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Create new tenant (Super Admin only)
 *     tags: [Tenants]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/',
  authenticate,
  requireSuperAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
    body('contact_email').isEmail().withMessage('Valid email is required'),
    body('plan').optional().isIn(['free', 'basic', 'professional', 'enterprise'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const tenant = await tenantService.createTenant(req.body);

      res.status(201).json({
        success: true,
        tenant,
        message: 'Tenant created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: List all tenants (Super Admin only)
 *     tags: [Tenants]
 */
router.get(
  '/',
  authenticate,
  requireSuperAdmin,
  async (req, res, next) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        active: req.query.active ? req.query.active === 'true' : undefined,
        plan: req.query.plan,
        search: req.query.search
      };

      const result = await tenantService.listTenants(filters);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 */
router.get(
  '/:id',
  authenticate,
  async (req, res, next) => {
    try {
      // Super admin pode ver qualquer tenant
      // Usuários comuns só podem ver seu próprio tenant
      if (!req.user.is_super_admin && req.user.tenant_id !== req.params.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own tenant'
        });
      }

      const tenant = await tenantService.getTenantById(req.params.id);

      res.json({ tenant });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}/stats:
 *   get:
 *     summary: Get tenant statistics
 *     tags: [Tenants]
 */
router.get(
  '/:id/stats',
  authenticate,
  async (req, res, next) => {
    try {
      // Verificar acesso
      if (!req.user.is_super_admin && req.user.tenant_id !== req.params.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own tenant statistics'
        });
      }

      const stats = await tenantService.getTenantStats(req.params.id);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant (Super Admin or tenant CEO)
 *     tags: [Tenants]
 */
router.put(
  '/:id',
  authenticate,
  async (req, res, next) => {
    try {
      // Super admin pode atualizar qualquer tenant
      // CEO do tenant pode atualizar algumas informações
      const isSuperAdmin = req.user.is_super_admin;
      const isTenantCEO = req.user.tenant_id === req.params.id && req.user.role === 'CEO';

      if (!isSuperAdmin && !isTenantCEO) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only super admin or tenant CEO can update tenant'
        });
      }

      // Usuários não-super-admin não podem alterar alguns campos
      if (!isSuperAdmin) {
        delete req.body.slug;
        delete req.body.domain;
        delete req.body.plan;
        delete req.body.active;
        delete req.body.trial_ends_at;
        delete req.body.subscription_ends_at;
      }

      const tenant = await tenantService.updateTenant(req.params.id, req.body);

      res.json({
        success: true,
        tenant,
        message: 'Tenant updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}/settings:
 *   put:
 *     summary: Update tenant settings
 *     tags: [Tenants]
 */
router.put(
  '/:id/settings',
  authenticate,
  async (req, res, next) => {
    try {
      const isSuperAdmin = req.user.is_super_admin;
      const isTenantCEO = req.user.tenant_id === req.params.id && req.user.role === 'CEO';

      if (!isSuperAdmin && !isTenantCEO) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only super admin or tenant CEO can update settings'
        });
      }

      const tenant = await tenantService.updateSettings(req.params.id, req.body);

      res.json({
        success: true,
        tenant,
        message: 'Tenant settings updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}/activate:
 *   post:
 *     summary: Activate tenant (Super Admin only)
 *     tags: [Tenants]
 */
router.post(
  '/:id/activate',
  authenticate,
  requireSuperAdmin,
  async (req, res, next) => {
    try {
      const tenant = await tenantService.activateTenant(req.params.id);

      res.json({
        success: true,
        tenant,
        message: 'Tenant activated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}/deactivate:
 *   post:
 *     summary: Deactivate tenant (Super Admin only)
 *     tags: [Tenants]
 */
router.post(
  '/:id/deactivate',
  authenticate,
  requireSuperAdmin,
  async (req, res, next) => {
    try {
      const tenant = await tenantService.deactivateTenant(req.params.id);

      res.json({
        success: true,
        tenant,
        message: 'Tenant deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     summary: Delete tenant (Super Admin only, only if no data exists)
 *     tags: [Tenants]
 */
router.delete(
  '/:id',
  authenticate,
  requireSuperAdmin,
  async (req, res, next) => {
    try {
      const result = await tenantService.deleteTenant(req.params.id);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tenants/{id}/upgrade:
 *   post:
 *     summary: Upgrade tenant plan (Super Admin only)
 *     tags: [Tenants]
 */
router.post(
  '/:id/upgrade',
  authenticate,
  requireSuperAdmin,
  [
    body('plan').isIn(['free', 'basic', 'professional', 'enterprise']).withMessage('Invalid plan'),
    body('subscription_ends_at').optional().isISO8601().withMessage('Invalid date format')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const tenant = await tenantService.upgradePlan(
        req.params.id,
        req.body.plan,
        req.body.subscription_ends_at
      );

      res.json({
        success: true,
        tenant,
        message: `Tenant upgraded to ${req.body.plan} plan`
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
