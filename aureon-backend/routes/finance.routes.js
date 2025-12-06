import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { FinanceTransaction, Client, Supplier, Sale, User } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * GET /api/finance/transactions
 * Listar todas as transações financeiras
 */
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { tipo, categoria, status, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (status) where.status = status;
    
    if (data_inicio && data_fim) {
      where.data = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const offset = (page - 1) * limit;

    const { rows: transactions, count } = await FinanceTransaction.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'nome'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'nome'] },
        { model: Sale, as: 'sale', attributes: ['id', 'produto', 'valor_venda'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['data', 'DESC']]
    });

    res.json({
      success: true,
      data: transactions,
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
 * GET /api/finance/transactions/:id
 * Obter transação por ID
 */
router.get('/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Supplier, as: 'supplier' },
        { model: Sale, as: 'sale' },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/finance/transactions
 * Criar nova transação
 */
router.post(
  '/transactions',
  authenticate,
  authorize('CEO', 'FINANCEIRO'),
  [
    body('tipo').isIn(['receita', 'despesa', 'transferencia']).withMessage('Invalid type'),
    body('categoria').notEmpty().withMessage('Category is required'),
    body('descricao').notEmpty().withMessage('Description is required'),
    body('valor').isFloat({ min: 0.01 }).withMessage('Value must be > 0'),
    body('data').isISO8601().withMessage('Invalid date')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const transaction = await FinanceTransaction.create({
        ...req.body,
        responsavel_id: req.user.id,
        responsavel: req.user.username
      });

      logger.info(`Finance transaction created: ${transaction.id} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/finance/transactions/:id
 * Atualizar transação
 */
router.put('/transactions/:id', authenticate, authorize('CEO', 'FINANCEIRO'), async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.update(req.body);

    logger.info(`Finance transaction updated: ${transaction.id} by ${req.user.username}`);

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/finance/transactions/:id/status
 * Atualizar status da transação
 */
router.patch('/transactions/:id/status', authenticate, authorize('CEO', 'FINANCEIRO'), async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pendente', 'pago', 'recebido', 'cancelado'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const transaction = await FinanceTransaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.update({ status });

    logger.info(`Finance transaction ${transaction.id} status updated to ${status} by ${req.user.username}`);

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/finance/dashboard
 * Dashboard financeiro
 */
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    const where = {};
    if (data_inicio && data_fim) {
      where.data = {
        [Op.between]: [data_inicio, data_fim]
      };
    }

    const transactions = await FinanceTransaction.findAll({ where });

    const receitas = transactions
      .filter(t => t.tipo === 'receita' && t.status === 'recebido')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const despesas = transactions
      .filter(t => t.tipo === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const pendentes = transactions
      .filter(t => t.status === 'pendente')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    res.json({
      success: true,
      data: {
        receitas,
        despesas,
        saldo: receitas - despesas,
        pendentes,
        total_transacoes: transactions.length
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
