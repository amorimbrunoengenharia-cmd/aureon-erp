import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { Supplier, Product } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/suppliers
 * Listar todos os fornecedores
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { active, categoria, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (active !== undefined) where.active = active === 'true';
    if (categoria) where.categoria = categoria;

    const offset = (page - 1) * limit;

    const { rows: suppliers, count } = await Supplier.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['nome', 'ASC']]
    });

    res.json({
      success: true,
      data: suppliers,
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
 * GET /api/suppliers/:id
 * Obter fornecedor por ID com produtos
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'products', limit: 20 }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/suppliers
 * Criar novo fornecedor
 */
router.post(
  '/',
  authenticate,
  authorize('CEO', 'COMPRAS'),
  [
    body('nome').notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Invalid email')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const supplier = await Supplier.create(req.body);

      logger.info(`Supplier created: ${supplier.id} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/suppliers/:id
 * Atualizar fornecedor
 */
router.put('/:id', authenticate, authorize('CEO', 'COMPRAS'), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await supplier.update(req.body);

    logger.info(`Supplier updated: ${supplier.id} by ${req.user.username}`);

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/suppliers/:id
 * Deletar fornecedor (soft delete)
 */
router.delete('/:id', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await supplier.update({ active: false });

    logger.info(`Supplier deleted: ${supplier.id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
