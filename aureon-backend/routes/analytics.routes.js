import express from 'express';
import analyticsService from '../services/analyticsService.js';
import { authenticate } from '../middlewares/auth.js';
import { cacheMiddleware } from '../middlewares/cache.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticate);

/**
 * GET /api/analytics/sales
 * Retorna análise de vendas por período
 * Query params:
 *   - startDate (required): Data inicial (ISO 8601)
 *   - endDate (required): Data final (ISO 8601)
 *   - channel (optional): Canal de venda
 *   - vendedor_id (optional): ID do vendedor
 *   - produto_id (optional): ID do produto
 *   - cliente_id (optional): ID do cliente
 * Cache: 5 minutos
 */
router.get('/sales', cacheMiddleware(300), async (req, res) => {
  try {
    const { startDate, endDate, channel, vendedor_id, produto_id, cliente_id } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Datas inválidas'
      });
    }

    const filters = {};
    if (channel) filters.channel = channel;
    if (vendedor_id) filters.vendedor_id = vendedor_id;
    if (produto_id) filters.produto_id = produto_id;
    if (cliente_id) filters.cliente_id = cliente_id;

    const analytics = await analyticsService.getSalesAnalytics(start, end, filters);

    res.json(analytics);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/sales:', error);
    res.status(500).json({ error: 'Erro ao obter análise de vendas' });
  }
});

/**
 * GET /api/analytics/top-products
 * Retorna produtos mais vendidos
 * Cache: 5 minutos
 */
router.get('/top-products', cacheMiddleware(300), async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const topProducts = await analyticsService.getTopProducts(start, end, parseInt(limit));

    res.json(topProducts);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/top-products:', error);
    res.status(500).json({ error: 'Erro ao obter top produtos' });
  }
});

/**
 * GET /api/analytics/top-clients
 * Retorna clientes que mais compraram
 */
router.get('/top-clients', async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const topClients = await analyticsService.getTopClients(start, end, parseInt(limit));

    res.json(topClients);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/top-clients:', error);
    res.status(500).json({ error: 'Erro ao obter top clientes' });
  }
});

/**
 * GET /api/analytics/salesman-performance
 * Retorna performance dos vendedores
 */
router.get('/salesman-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const performance = await analyticsService.getSalesmanPerformance(start, end);

    res.json(performance);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/salesman-performance:', error);
    res.status(500).json({ error: 'Erro ao obter performance de vendedores' });
  }
});

/**
 * GET /api/analytics/categories
 * Retorna análise de categorias
 * Cache: 5 minutos
 */
router.get('/categories', cacheMiddleware(300), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const categoryAnalysis = await analyticsService.getCategoryAnalysis(start, end);

    res.json(categoryAnalysis);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/categories:', error);
    res.status(500).json({ error: 'Erro ao obter análise de categorias' });
  }
});

/**
 * GET /api/analytics/period-comparison
 * Retorna comparação entre dois períodos
 * Query params:
 *   - currentStart, currentEnd: Período atual
 *   - previousStart, previousEnd: Período anterior
 */
router.get('/period-comparison', async (req, res) => {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } = req.query;

    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
      return res.status(400).json({
        error: 'Todos os parâmetros de data são obrigatórios'
      });
    }

    const comparison = await analyticsService.getPeriodComparison(
      new Date(currentStart),
      new Date(currentEnd),
      new Date(previousStart),
      new Date(previousEnd)
    );

    res.json(comparison);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/period-comparison:', error);
    res.status(500).json({ error: 'Erro ao comparar períodos' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Retorna dashboard completo com todas as análises
 * Cache: 2 minutos
 */
router.get('/dashboard', cacheMiddleware(120), async (req, res) => {
  try {
    const { startDate, endDate, channel, vendedor_id } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const filters = {};
    if (channel) filters.channel = channel;
    if (vendedor_id) filters.vendedor_id = vendedor_id;

    const dashboard = await analyticsService.getDashboard(start, end, filters);

    res.json(dashboard);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/dashboard:', error);
    res.status(500).json({ error: 'Erro ao gerar dashboard' });
  }
});

/**
 * GET /api/analytics/export
 * Exporta dados de análise em formato CSV
 */
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, type = 'sales' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate e endDate são obrigatórios'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let data;
    let filename;

    switch (type) {
      case 'sales':
        data = await analyticsService.getSalesAnalytics(start, end);
        filename = `vendas_${startDate}_${endDate}.json`;
        break;
      case 'products':
        data = await analyticsService.getTopProducts(start, end, 100);
        filename = `produtos_${startDate}_${endDate}.json`;
        break;
      case 'clients':
        data = await analyticsService.getTopClients(start, end, 100);
        filename = `clientes_${startDate}_${endDate}.json`;
        break;
      case 'dashboard':
        data = await analyticsService.getDashboard(start, end);
        filename = `dashboard_${startDate}_${endDate}.json`;
        break;
      default:
        return res.status(400).json({ error: 'Tipo de exportação inválido' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (error) {
    logger.error('Erro em GET /api/analytics/export:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

export default router;
