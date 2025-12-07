/**
 * Financial Dashboard Routes
 * Rotas para análises financeiras: DRE, Fluxo de Caixa, Indicadores, Projeções
 */

import express from 'express';
import financialDashboardService from '../services/financialDashboardService.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { tenantMiddleware } from '../middlewares/tenant.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware: Autenticação + Multi-tenant
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/financial/dre
 * Demonstração de Resultado do Exercício
 * Permissões: admin, gerente, ceo
 */
router.get('/dre', authorize(['admin', 'gerente', 'ceo']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate e endDate (formato: YYYY-MM-DD)'
      });
    }

    const dre = await financialDashboardService.getDRE(req.tenantId, startDate, endDate);

    logger.info(`DRE gerado para tenant ${req.tenantId} - Período: ${startDate} a ${endDate}`);

    res.json({
      success: true,
      data: dre
    });
  } catch (error) {
    logger.error('Erro ao gerar DRE:', error);
    res.status(500).json({
      error: 'Erro ao gerar DRE',
      message: error.message
    });
  }
});

/**
 * GET /api/financial/cash-flow
 * Fluxo de Caixa
 * Permissões: admin, gerente, ceo
 */
router.get('/cash-flow', authorize(['admin', 'gerente', 'ceo']), async (req, res) => {
  try {
    const { startDate, endDate, agrupamento = 'dia' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate e endDate (formato: YYYY-MM-DD)'
      });
    }

    if (!['dia', 'semana', 'mes'].includes(agrupamento)) {
      return res.status(400).json({
        error: 'Agrupamento inválido. Use: dia, semana ou mes'
      });
    }

    const fluxoCaixa = await financialDashboardService.getFluxoCaixa(
      req.tenantId,
      startDate,
      endDate,
      agrupamento
    );

    logger.info(`Fluxo de caixa gerado para tenant ${req.tenantId} - Agrupamento: ${agrupamento}`);

    res.json({
      success: true,
      data: fluxoCaixa
    });
  } catch (error) {
    logger.error('Erro ao gerar fluxo de caixa:', error);
    res.status(500).json({
      error: 'Erro ao gerar fluxo de caixa',
      message: error.message
    });
  }
});

/**
 * GET /api/financial/indicators
 * Indicadores Financeiros (KPIs)
 * Permissões: admin, gerente, ceo
 */
router.get('/indicators', authorize(['admin', 'gerente', 'ceo']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate e endDate (formato: YYYY-MM-DD)'
      });
    }

    const indicadores = await financialDashboardService.getIndicadores(
      req.tenantId,
      startDate,
      endDate
    );

    logger.info(`Indicadores financeiros gerados para tenant ${req.tenantId}`);

    res.json({
      success: true,
      data: indicadores
    });
  } catch (error) {
    logger.error('Erro ao calcular indicadores:', error);
    res.status(500).json({
      error: 'Erro ao calcular indicadores financeiros',
      message: error.message
    });
  }
});

/**
 * GET /api/financial/projections
 * Projeções Financeiras
 * Permissões: admin, gerente, ceo
 */
router.get('/projections', authorize(['admin', 'gerente', 'ceo']), async (req, res) => {
  try {
    const { mesesFuturos = 3 } = req.query;

    const meses = parseInt(mesesFuturos);
    if (isNaN(meses) || meses < 1 || meses > 12) {
      return res.status(400).json({
        error: 'mesesFuturos deve ser um número entre 1 e 12'
      });
    }

    const projecoes = await financialDashboardService.getProjecoes(req.tenantId, meses);

    logger.info(`Projeções financeiras geradas para tenant ${req.tenantId} - ${meses} meses`);

    res.json({
      success: true,
      data: projecoes
    });
  } catch (error) {
    logger.error('Erro ao gerar projeções:', error);
    res.status(500).json({
      error: 'Erro ao gerar projeções financeiras',
      message: error.message
    });
  }
});

/**
 * GET /api/financial/dashboard
 * Dashboard Completo (DRE + Fluxo + Indicadores + Projeções)
 * Permissões: admin, gerente, ceo, financeiro
 */
router.get('/dashboard', authorize(['admin', 'gerente', 'ceo', 'financeiro']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate e endDate (formato: YYYY-MM-DD)'
      });
    }

    const dashboard = await financialDashboardService.getDashboardCompleto(
      req.tenantId,
      startDate,
      endDate
    );

    logger.info(`Dashboard financeiro completo gerado para tenant ${req.tenantId}`);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Erro ao gerar dashboard financeiro:', error);
    res.status(500).json({
      error: 'Erro ao gerar dashboard financeiro',
      message: error.message
    });
  }
});

/**
 * GET /api/financial/summary
 * Resumo financeiro rápido (últimos 30 dias)
 * Permissões: todos os usuários autenticados
 */
router.get('/summary', async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const indicadores = await financialDashboardService.getIndicadores(
      req.tenantId,
      startStr,
      endStr
    );

    res.json({
      success: true,
      periodo: '30 dias',
      data: {
        totalVendas: indicadores.vendas.total,
        ticketMedio: indicadores.vendas.ticketMedio,
        margemLucro: indicadores.lucratividade.margemLucro,
        roi: indicadores.lucratividade.roi,
        quantidadeVendas: indicadores.vendas.quantidade
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar resumo financeiro:', error);
    res.status(500).json({
      error: 'Erro ao gerar resumo financeiro',
      message: error.message
    });
  }
});

export default router;
