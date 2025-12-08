import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { Product, Supplier } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { auditResource } from '../middlewares/audit.js';

const router = express.Router();

/**
 * GET /api/products
 * Listar todos os produtos
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { active, tipo, categoria, fornecedor_id, search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (active !== undefined) where.active = active === 'true';
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (fornecedor_id) where.fornecedor_id = fornecedor_id;
    
    // Search by name
    if (search) {
      where.produto = { [sequelize.Op.like]: `%${search}%` };
    }

    const offset = (page - 1) * limit;

    const { rows: products, count } = await Product.findAndCountAll({
      where,
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'nome'] }],
      limit: parseInt(limit),
      offset,
      order: [['produto', 'ASC']]
    });

    res.json({
      success: true,
      data: products,
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
 * GET /api/products/:id
 * Obter produto por ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Supplier, as: 'supplier' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products
 * Criar novo produto
 */
router.post(
  '/',
  authenticate,
  authorize('CEO', 'ESTOQUE'),
  auditResource('product'),
  [
    body('produto').notEmpty().withMessage('Product name is required'),
    body('preco_venda').isFloat({ min: 0 }).withMessage('Sale price must be >= 0'),
    body('quantidade_estoque').optional().isInt({ min: 0 }).withMessage('Stock must be >= 0')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.create({
        ...req.body,
        tenant_id: req.user.tenant_id, // Auto-populate from authenticated user
        metadata: {
          ...req.body.metadata,
          created_by: req.user.username
        }
      });

      logger.info(`Product created: ${product.id} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/products/:id
 * Atualizar produto
 */
router.put(
  '/:id',
  authenticate,
  authorize('CEO', 'ESTOQUE'),
  [
    body('preco_venda').optional().isFloat({ min: 0 }),
    body('quantidade_estoque').optional().isInt({ min: 0 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.update({
        ...req.body,
        metadata: {
          ...product.metadata,
          updated_by: req.user.username,
          updated_at: new Date()
        }
      });

      logger.info(`Product updated: ${product.id} by ${req.user.username}`);

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/products/:id
 * Deletar produto (soft delete)
 */
router.delete('/:id', authenticate, authorize('CEO', 'ESTOQUE'), async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update({ active: false });

    logger.info(`Product deleted: ${product.id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/products/:id/stock
 * Atualizar estoque
 */
router.patch(
  '/:id/stock',
  authenticate,
  authorize('CEO', 'ESTOQUE'),
  [body('quantidade').isInt().withMessage('Quantity is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const oldStock = product.quantidade_estoque;
      const newStock = oldStock + parseInt(req.body.quantidade);

      await product.update({ quantidade_estoque: newStock });

      logger.info(`Stock updated for product ${product.id}: ${oldStock} -> ${newStock}`);

      res.json({
        success: true,
        data: {
          product_id: product.id,
          old_stock: oldStock,
          new_stock: newStock,
          change: req.body.quantidade
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
