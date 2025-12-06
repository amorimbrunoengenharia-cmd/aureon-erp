import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { StockMovement, Product, User } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

/**
 * GET /api/inventory/movements
 * Listar movimentações de estoque
 */
router.get('/movements', authenticate, async (req, res, next) => {
  try {
    const { tipo, produto_id, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (tipo) where.tipo = tipo;
    if (produto_id) where.produto_id = produto_id;
    
    if (data_inicio && data_fim) {
      where.data = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const offset = (page - 1) * limit;

    const { rows: movements, count } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'produto', 'tipo'] },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['data', 'DESC']]
    });

    res.json({
      success: true,
      data: movements,
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
 * POST /api/inventory/movements
 * Criar movimentação manual de estoque
 */
router.post(
  '/movements',
  authenticate,
  authorize('CEO', 'ESTOQUE'),
  [
    body('produto_id').isUUID().withMessage('Valid product ID is required'),
    body('tipo').isIn(['entrada', 'saida', 'ajuste', 'devolucao', 'perda']).withMessage('Invalid type'),
    body('quantidade').isInt().withMessage('Quantity must be an integer'),
    body('motivo').notEmpty().withMessage('Reason is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByPk(req.body.produto_id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const quantidade_anterior = product.quantidade_estoque;
      let quantidade_nova = quantidade_anterior;

      switch (req.body.tipo) {
        case 'entrada':
        case 'devolucao':
          quantidade_nova = quantidade_anterior + req.body.quantidade;
          break;
        case 'saida':
        case 'perda':
          quantidade_nova = quantidade_anterior - req.body.quantidade;
          break;
        case 'ajuste':
          quantidade_nova = req.body.quantidade;
          break;
      }

      const movement = await StockMovement.create({
        ...req.body,
        produto: product.produto,
        quantidade_anterior,
        quantidade_nova,
        responsavel_id: req.user.id,
        responsavel: req.user.username,
        data: new Date()
      });

      await product.update({ quantidade_estoque: quantidade_nova });

      logger.info(`Stock movement created: ${movement.id} - ${req.body.tipo} ${req.body.quantidade} units of ${product.produto} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: movement
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/inventory/low-stock
 * Produtos com estoque baixo
 */
router.get('/low-stock', authenticate, async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: {
        quantidade_estoque: {
          [Op.lte]: sequelize.col('estoque_minimo')
        },
        active: true
      },
      order: [['quantidade_estoque', 'ASC']]
    });

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/report
 * Relatório de valorização de estoque
 */
router.get('/report', authenticate, async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { active: true }
    });

    let totalQuantity = 0;
    let totalValue = 0;

    products.forEach(p => {
      totalQuantity += p.quantidade_estoque || 0;
      totalValue += (p.quantidade_estoque || 0) * parseFloat(p.preco_venda || 0);
    });

    res.json({
      success: true,
      data: {
        total_produtos: products.length,
        total_unidades: totalQuantity,
        valor_total_estoque: totalValue,
        produtos_baixo_estoque: products.filter(p => 
          (p.quantidade_estoque || 0) <= (p.estoque_minimo || 0)
        ).length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
