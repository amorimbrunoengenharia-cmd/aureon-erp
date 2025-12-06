/**
 * Customer Portal Routes
 * Rotas para portal do cliente (pedidos, histórico, downloads)
 */

import express from 'express';
import { Sale, Client, Product, FinanceTransaction } from '../models/index.js';
import { authenticate } from '../middlewares/auth.js';
import { tenantMiddleware } from '../middlewares/tenant.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

const router = express.Router();

// Middleware: Autenticação + Multi-tenant
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/customer/profile
 * Buscar perfil do cliente logado
 */
router.get('/profile', async (req, res) => {
  try {
    // Cliente identificado pelo user autenticado
    const client = await Client.findOne({
      where: {
        tenant_id: req.tenantId,
        email: req.user.email // Assume que cliente tem mesmo email do user
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        message: 'Nenhum cliente vinculado a este usuário'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error('Erro ao buscar perfil do cliente:', error);
    res.status(500).json({
      error: 'Erro ao buscar perfil',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/orders
 * Listar pedidos do cliente
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // Buscar cliente pelo email do usuário
    const client = await Client.findOne({
      where: {
        tenant_id: req.tenantId,
        email: req.user.email
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    const whereClause = {
      tenant_id: req.tenantId,
      cliente_id: client.id
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const { count, rows: orders } = await Sale.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['id', 'produto', 'preco_venda', 'categoria']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao listar pedidos do cliente:', error);
    res.status(500).json({
      error: 'Erro ao listar pedidos',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/orders/:id
 * Buscar detalhes de um pedido específico
 */
router.get('/orders/:id', async (req, res) => {
  try {
    // Buscar cliente
    const client = await Client.findOne({
      where: {
        tenant_id: req.tenantId,
        email: req.user.email
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    // Buscar pedido
    const order = await Sale.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.tenantId,
        cliente_id: client.id // Garantir que é pedido do cliente
      },
      include: [
        {
          model: Product,
          attributes: ['id', 'produto', 'descricao', 'preco_venda', 'categoria', 'marca']
        },
        {
          model: FinanceTransaction,
          as: 'finance_transactions',
          attributes: ['id', 'tipo', 'valor', 'categoria', 'data', 'status']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Erro ao buscar detalhes do pedido:', error);
    res.status(500).json({
      error: 'Erro ao buscar pedido',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/history
 * Histórico completo de compras do cliente
 */
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Buscar cliente
    const client = await Client.findOne({
      where: {
        tenant_id: req.tenantId,
        email: req.user.email
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    const whereClause = {
      tenant_id: req.tenantId,
      cliente_id: client.id,
      status: 'CONCLUIDA'
    };

    // Filtro de período
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Buscar todas as compras concluídas
    const orders = await Sale.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['id', 'produto', 'preco_venda', 'categoria']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calcular estatísticas
    const totalGasto = orders.reduce((sum, order) => sum + parseFloat(order.valor_total || 0), 0);
    const totalPedidos = orders.length;
    const ticketMedio = totalPedidos > 0 ? totalGasto / totalPedidos : 0;

    // Produtos mais comprados
    const produtosMap = {};
    orders.forEach(order => {
      const produtoId = order.produto_id;
      if (!produtosMap[produtoId]) {
        produtosMap[produtoId] = {
          produto_id: produtoId,
          produto: order.Product?.produto,
          quantidade: 0,
          valor_total: 0
        };
      }
      produtosMap[produtoId].quantidade += order.quantidade;
      produtosMap[produtoId].valor_total += parseFloat(order.valor_total || 0);
    });

    const topProdutos = Object.values(produtosMap)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // Compras por mês
    const comprasPorMes = {};
    orders.forEach(order => {
      const mes = new Date(order.created_at).toISOString().substring(0, 7); // YYYY-MM
      if (!comprasPorMes[mes]) {
        comprasPorMes[mes] = {
          mes,
          quantidade: 0,
          valor_total: 0
        };
      }
      comprasPorMes[mes].quantidade++;
      comprasPorMes[mes].valor_total += parseFloat(order.valor_total || 0);
    });

    res.json({
      success: true,
      data: {
        cliente: {
          id: client.id,
          nome: client.nome,
          email: client.email,
          telefone: client.telefone
        },
        resumo: {
          total_pedidos: totalPedidos,
          total_gasto: totalGasto.toFixed(2),
          ticket_medio: ticketMedio.toFixed(2),
          primeira_compra: orders.length > 0 ? orders[orders.length - 1].created_at : null,
          ultima_compra: orders.length > 0 ? orders[0].created_at : null
        },
        top_produtos: topProdutos,
        compras_por_mes: Object.values(comprasPorMes).sort((a, b) => b.mes.localeCompare(a.mes)),
        pedidos_recentes: orders.slice(0, 10)
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar histórico do cliente:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/stats
 * Estatísticas do cliente
 */
router.get('/stats', async (req, res) => {
  try {
    const client = await Client.findOne({
      where: {
        tenant_id: req.tenantId,
        email: req.user.email
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    // Contar pedidos por status
    const pedidosPorStatus = await Sale.findAll({
      where: {
        tenant_id: req.tenantId,
        cliente_id: client.id
      },
      attributes: [
        'status',
        [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'quantidade'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('valor_total')), 'valor_total']
      ],
      group: ['status'],
      raw: true
    });

    // Últimas 30 dias
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);

    const pedidosRecentes = await Sale.count({
      where: {
        tenant_id: req.tenantId,
        cliente_id: client.id,
        created_at: {
          [Op.gte]: dataInicio
        }
      }
    });

    const valorRecente = await Sale.sum('valor_total', {
      where: {
        tenant_id: req.tenantId,
        cliente_id: client.id,
        status: 'CONCLUIDA',
        created_at: {
          [Op.gte]: dataInicio
        }
      }
    });

    res.json({
      success: true,
      data: {
        pedidos_por_status: pedidosPorStatus,
        ultimos_30_dias: {
          quantidade_pedidos: pedidosRecentes,
          valor_total: (valorRecente || 0).toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas do cliente:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      message: error.message
    });
  }
});

/**
 * PUT /api/customer/profile
 * Atualizar perfil do cliente
 */
router.put('/profile', async (req, res) => {
  try {
    const client = await Client.findOne({
      where: {
        tenant_id: req.tenantId,
        email: req.user.email
      }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    const { nome, telefone, endereco, cidade, estado, cep } = req.body;

    // Atualizar apenas campos permitidos
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (endereco !== undefined) updateData.endereco = endereco;
    if (cidade !== undefined) updateData.cidade = cidade;
    if (estado !== undefined) updateData.estado = estado;
    if (cep !== undefined) updateData.cep = cep;

    await client.update(updateData);

    logger.info(`Cliente ${client.id} atualizou perfil`);

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil do cliente:', error);
    res.status(500).json({
      error: 'Erro ao atualizar perfil',
      message: error.message
    });
  }
});

export default router;
