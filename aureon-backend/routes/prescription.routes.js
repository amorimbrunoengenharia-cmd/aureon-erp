import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { Prescription, Client, User } from '../models/index.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * GET /api/prescriptions
 * Listar todas as receitas
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, cliente_id, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (cliente_id) where.cliente_id = cliente_id;

    const offset = (page - 1) * limit;

    const { rows: prescriptions, count } = await Prescription.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['id', 'nome', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: prescriptions,
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
 * GET /api/prescriptions/:id
 * Obter receita por ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: User, as: 'updater', attributes: ['id', 'username'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/prescriptions
 * Criar nova receita
 */
router.post(
  '/',
  authenticate,
  [
    body('cliente_id').isUUID().withMessage('Valid client ID is required'),
    body('cliente_nome').notEmpty().withMessage('Client name is required'),
    body('medico_nome').notEmpty().withMessage('Doctor name is required'),
    body('medico_crm').notEmpty().withMessage('CRM is required'),
    body('data_emissao').isISO8601().withMessage('Invalid emission date'),
    body('lgpd_consentimento').isBoolean().withMessage('LGPD consent is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.body.lgpd_consentimento) {
        return res.status(400).json({ error: 'LGPD consent is required' });
      }

      // Calculate data_validade (180 days if not provided)
      let dataValidade = req.body.data_validade;
      if (!dataValidade) {
        const emissao = new Date(req.body.data_emissao);
        emissao.setDate(emissao.getDate() + 180);
        dataValidade = emissao.toISOString().split('T')[0];
      }

      const prescription = await Prescription.create({
        ...req.body,
        data_validade: dataValidade,
        lgpd_consentimento_data: new Date(),
        created_by: req.user.id,
        updated_by: req.user.id
      });

      logger.info(`Prescription created: ${prescription.id} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: prescription
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/prescriptions/:id
 * Atualizar receita
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    await prescription.update({
      ...req.body,
      updated_by: req.user.id
    });

    logger.info(`Prescription updated: ${prescription.id} by ${req.user.username}`);

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/prescriptions/:id/attach/:orderId
 * Associar receita a um pedido
 */
router.post('/:id/attach/:orderId', authenticate, async (req, res, next) => {
  try {
    const prescription = await Prescription.findByPk(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check if expired
    if (new Date(prescription.data_validade) < new Date()) {
      return res.status(400).json({ error: 'Prescription is expired' });
    }

    const pedidos = prescription.pedidos_associados || [];
    if (!pedidos.includes(req.params.orderId)) {
      pedidos.push(req.params.orderId);
      await prescription.update({ pedidos_associados: pedidos });
    }

    logger.info(`Prescription ${prescription.id} attached to order ${req.params.orderId}`);

    res.json({
      success: true,
      message: 'Prescription attached to order',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/prescriptions/check-expired
 * Verificar e marcar receitas expiradas
 */
router.get('/check-expired', authenticate, async (req, res, next) => {
  try {
    const hoje = new Date();
    
    const expiredPrescriptions = await Prescription.findAll({
      where: {
        status: 'ativa',
        data_validade: {
          [Op.lt]: hoje
        }
      }
    });

    for (const prescription of expiredPrescriptions) {
      await prescription.update({ status: 'expirada' });
    }

    logger.info(`Marked ${expiredPrescriptions.length} prescriptions as expired`);

    res.json({
      success: true,
      message: `${expiredPrescriptions.length} prescriptions marked as expired`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
