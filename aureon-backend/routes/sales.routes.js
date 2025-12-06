import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { Sale, Product, Client, Prescription, User } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import emailService from '../services/emailService.js';
import { auditResource } from '../middlewares/audit.js';

const router = express.Router();

/**
 * GET /api/sales
 * Listar todas as vendas
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { canal, status, data_inicio, data_fim, cliente_id, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (canal) where.canal = canal;
    if (status) where.status = status;
    if (cliente_id) where.cliente_id = cliente_id;
    
    if (data_inicio && data_fim) {
      where.data_venda = {
        [sequelize.Op.between]: [data_inicio, data_fim]
      };
    }

    const offset = (page - 1) * limit;

    const { rows: sales, count } = await Sale.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'produto', 'tipo'] },
        { model: Client, as: 'client', attributes: ['id', 'nome', 'email'] },
        { model: Prescription, as: 'prescription', attributes: ['id', 'tipo_lente', 'status'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['data_venda', 'DESC']]
    });

    res.json({
      success: true,
      data: sales,
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
 * GET /api/sales/:id
 * Obter venda por ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' },
        { model: Client, as: 'client' },
        { model: Prescription, as: 'prescription' },
        { model: User, as: 'seller', attributes: ['id', 'username', 'role'] }
      ]
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sales
 * Criar nova venda
 */
router.post(
  '/',
  authenticate,
  auditResource('sale'),
  [
    body('produto').notEmpty().withMessage('Product is required'),
    body('valor_venda').isFloat({ min: 0 }).withMessage('Sale value must be >= 0'),
    body('canal').notEmpty().withMessage('Channel is required'),
    body('data_venda').isISO8601().withMessage('Invalid date')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const sale = await Sale.create({
        ...req.body,
        vendedor_id: req.user.id,
        vendedor: req.user.username
      });

      // Update product stock if produto_id exists
      if (sale.produto_id) {
        const product = await Product.findByPk(sale.produto_id);
        if (product) {
          await product.update({
            quantidade_estoque: product.quantidade_estoque - (sale.quantidade || 1)
          });
        }
      }

      // Update client stats and send confirmation email if cliente_id exists
      if (sale.cliente_id) {
        const client = await Client.findByPk(sale.cliente_id);
        if (client) {
          await client.update({
            total_compras: parseFloat(client.total_compras) + parseFloat(sale.valor_venda),
            total_pedidos: client.total_pedidos + 1,
            ultima_compra: new Date()
          });

          // Send order confirmation email
          if (client.email) {
            try {
              await emailService.sendOrderConfirmation(sale, client);
              logger.info(`Order confirmation email sent to ${client.email}`);
            } catch (emailError) {
              logger.error('Failed to send order confirmation:', emailError);
              // Don't fail the sale if email fails
            }
          }
        }
      }

      logger.info(`Sale created: ${sale.id} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: sale
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/sales/:id
 * Atualizar venda
 */
router.put('/:id', authenticate, auditResource('sale'), async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    await sale.update(req.body);

    logger.info(`Sale updated: ${sale.id} by ${req.user.username}`);

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sales/stats/summary
 * Estatísticas de vendas
 */
router.get('/stats/summary', authenticate, async (req, res, next) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const where = {};
    if (data_inicio && data_fim) {
      where.data_venda = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const sales = await Sale.findAll({ where });

    const totalVendas = sales.reduce((sum, s) => sum + parseFloat(s.valor_venda), 0);
    const totalLucro = sales.reduce((sum, s) => sum + parseFloat(s.lucro || 0), 0);
    const margemMedia = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_vendas: totalVendas,
        total_lucro: totalLucro,
        margem_media: margemMedia,
        quantidade_vendas: sales.length,
        ticket_medio: sales.length > 0 ? totalVendas / sales.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
