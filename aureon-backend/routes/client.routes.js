import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { Client, Sale, Prescription } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import { auditResource } from '../middlewares/audit.js';

const router = express.Router();

/**
 * GET /api/clients
 * Listar todos os clientes
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { active, categoria, origem, search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (active !== undefined) where.active = active === 'true';
    if (categoria) where.categoria = categoria;
    if (origem) where.origem = origem;
    
    if (search) {
      where.nome = { [Op.like]: `%${search}%` };
    }

    const offset = (page - 1) * limit;

    const { rows: clients, count } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['nome', 'ASC']]
    });

    res.json({
      success: true,
      data: clients,
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
 * GET /api/clients/:id
 * Obter cliente por ID com vendas e receitas
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        { model: Sale, as: 'sales', limit: 10, order: [['data_venda', 'DESC']] },
        { model: Prescription, as: 'prescriptions', where: { status: 'ativa' }, required: false }
      ]
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/clients
 * Criar novo cliente
 */
router.post(
  '/',
  authenticate,
  auditResource('client'),
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

      const client = await Client.create({
        ...req.body,
        tenant_id: req.user.tenant_id // Auto-populate from authenticated user
      });

      logger.info(`Client created: ${client.id} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: client
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/clients/:id
 * Atualizar cliente
 */
router.put('/:id', authenticate, auditResource('client'), async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.update(req.body);

    logger.info(`Client updated: ${client.id} by ${req.user.username}`);

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id
 * Deletar cliente (soft delete)
 */
router.delete('/:id', authenticate, authorize('CEO'), auditResource('client'), async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.update({ active: false });

    logger.info(`Client deleted: ${client.id} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
