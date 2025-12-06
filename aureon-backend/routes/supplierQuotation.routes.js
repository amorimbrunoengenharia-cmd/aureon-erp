/**
 * Supplier Quotation Routes
 * Rotas para gerenciamento de cotações de fornecedores
 */

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import supplierQuotationService from '../services/supplierQuotationService.js';

const router = express.Router();

/**
 * POST /api/suppliers/quotations
 * Criar nova cotação
 * Acesso: admin, gerente, compras
 */
router.post('/quotations', 
  authenticate, 
  authorize(['admin', 'gerente', 'compras']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const quotationData = req.body;

      // Validar campos obrigatórios
      const requiredFields = ['supplier_id', 'produto_id', 'preco_cotado', 'quantidade_minima', 'prazo_entrega_dias'];
      const missingFields = requiredFields.filter(field => !quotationData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Campos obrigatórios faltando',
          missing_fields: missingFields
        });
      }

      const quotation = await supplierQuotationService.createQuotation(tenantId, quotationData);

      res.status(201).json({
        message: 'Cotação criada com sucesso',
        quotation
      });
    } catch (error) {
      console.error('Erro ao criar cotação:', error);
      res.status(500).json({
        error: 'Erro ao criar cotação',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/suppliers/quotations/compare/:produtoId
 * Comparar preços entre fornecedores
 * Acesso: admin, gerente, compras, ceo
 */
router.get('/quotations/compare/:produtoId',
  authenticate,
  authorize(['admin', 'gerente', 'compras', 'ceo']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { produtoId } = req.params;
      const { status, includeExpired } = req.query;

      const options = {
        status: status || 'PENDENTE',
        includeExpired: includeExpired === 'true'
      };

      const comparison = await supplierQuotationService.compareQuotations(
        tenantId,
        parseInt(produtoId),
        options
      );

      res.json(comparison);
    } catch (error) {
      console.error('Erro ao comparar cotações:', error);
      res.status(500).json({
        error: 'Erro ao comparar cotações',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/suppliers/quotations/:id/approve
 * Aprovar cotação
 * Acesso: admin, gerente, compras
 */
router.put('/quotations/:id/approve',
  authenticate,
  authorize(['admin', 'gerente', 'compras']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { id } = req.params;
      const userId = req.user.id;

      const quotation = await supplierQuotationService.approveQuotation(
        tenantId,
        parseInt(id),
        userId
      );

      res.json({
        message: 'Cotação aprovada com sucesso',
        quotation
      });
    } catch (error) {
      console.error('Erro ao aprovar cotação:', error);
      res.status(400).json({
        error: 'Erro ao aprovar cotação',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/suppliers/quotations/:id/reject
 * Rejeitar cotação
 * Acesso: admin, gerente, compras
 */
router.put('/quotations/:id/reject',
  authenticate,
  authorize(['admin', 'gerente', 'compras']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { id } = req.params;
      const userId = req.user.id;
      const { motivo } = req.body;

      const quotation = await supplierQuotationService.rejectQuotation(
        tenantId,
        parseInt(id),
        userId,
        motivo
      );

      res.json({
        message: 'Cotação rejeitada com sucesso',
        quotation
      });
    } catch (error) {
      console.error('Erro ao rejeitar cotação:', error);
      res.status(400).json({
        error: 'Erro ao rejeitar cotação',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/performance
 * Analisar performance de fornecedor
 * Acesso: admin, gerente, compras, ceo
 */
router.get('/:supplierId/performance',
  authenticate,
  authorize(['admin', 'gerente', 'compras', 'ceo']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { supplierId } = req.params;

      const performance = await supplierQuotationService.analyzeSupplierPerformance(
        tenantId,
        parseInt(supplierId)
      );

      res.json(performance);
    } catch (error) {
      console.error('Erro ao analisar performance:', error);
      res.status(500).json({
        error: 'Erro ao analisar performance',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/suppliers/quotations/history/:produtoId
 * Histórico de preços de um produto
 * Acesso: admin, gerente, compras, ceo
 */
router.get('/quotations/history/:produtoId',
  authenticate,
  authorize(['admin', 'gerente', 'compras', 'ceo']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { produtoId } = req.params;
      const { limit, supplierId } = req.query;

      const options = {
        limit: limit || 20,
        supplierId: supplierId ? parseInt(supplierId) : null
      };

      const history = await supplierQuotationService.getPriceHistory(
        tenantId,
        parseInt(produtoId),
        options
      );

      res.json(history);
    } catch (error) {
      console.error('Erro ao buscar histórico de preços:', error);
      res.status(500).json({
        error: 'Erro ao buscar histórico de preços',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/suppliers/ranking
 * Ranking de fornecedores
 * Acesso: admin, gerente, compras, ceo
 */
router.get('/ranking',
  authenticate,
  authorize(['admin', 'gerente', 'compras', 'ceo']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;

      const ranking = await supplierQuotationService.getSupplierRanking(tenantId);

      res.json({
        total_fornecedores: ranking.length,
        ranking
      });
    } catch (error) {
      console.error('Erro ao gerar ranking:', error);
      res.status(500).json({
        error: 'Erro ao gerar ranking',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/suppliers/quotations/:id/deliver
 * Registrar entrega de cotação aprovada
 * Acesso: admin, gerente, compras, estoque
 */
router.put('/quotations/:id/deliver',
  authenticate,
  authorize(['admin', 'gerente', 'compras', 'estoque']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { id } = req.params;
      const { data_entrega_real } = req.body;

      if (!data_entrega_real) {
        return res.status(400).json({
          error: 'data_entrega_real é obrigatório'
        });
      }

      const { SupplierQuotation } = await import('../models/index.js');

      const quotation = await SupplierQuotation.findOne({
        where: {
          id: parseInt(id),
          tenant_id: tenantId,
          status: 'APROVADA'
        }
      });

      if (!quotation) {
        return res.status(404).json({
          error: 'Cotação não encontrada ou não está aprovada'
        });
      }

      await quotation.update({ data_entrega_real });

      const atraso = quotation.calcularAtraso();

      res.json({
        message: 'Entrega registrada com sucesso',
        quotation,
        atraso_dias: atraso
      });
    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
      res.status(500).json({
        error: 'Erro ao registrar entrega',
        details: error.message
      });
    }
  }
);

/**
 * PUT /api/suppliers/quotations/:id/rate
 * Avaliar qualidade e prazo da cotação
 * Acesso: admin, gerente, compras
 */
router.put('/quotations/:id/rate',
  authenticate,
  authorize(['admin', 'gerente', 'compras']),
  async (req, res) => {
    try {
      const tenantId = req.user.tenant_id;
      const { id } = req.params;
      const { avaliacao_qualidade, avaliacao_prazo } = req.body;

      // Validar avaliações (1-5)
      if (avaliacao_qualidade && (avaliacao_qualidade < 1 || avaliacao_qualidade > 5)) {
        return res.status(400).json({
          error: 'avaliacao_qualidade deve ser entre 1 e 5'
        });
      }

      if (avaliacao_prazo && (avaliacao_prazo < 1 || avaliacao_prazo > 5)) {
        return res.status(400).json({
          error: 'avaliacao_prazo deve ser entre 1 e 5'
        });
      }

      const { SupplierQuotation } = await import('../models/index.js');

      const quotation = await SupplierQuotation.findOne({
        where: {
          id: parseInt(id),
          tenant_id: tenantId,
          status: 'APROVADA'
        }
      });

      if (!quotation) {
        return res.status(404).json({
          error: 'Cotação não encontrada ou não está aprovada'
        });
      }

      const updateData = {};
      if (avaliacao_qualidade) updateData.avaliacao_qualidade = avaliacao_qualidade;
      if (avaliacao_prazo) updateData.avaliacao_prazo = avaliacao_prazo;

      await quotation.update(updateData);

      res.json({
        message: 'Avaliação registrada com sucesso',
        quotation
      });
    } catch (error) {
      console.error('Erro ao avaliar cotação:', error);
      res.status(500).json({
        error: 'Erro ao avaliar cotação',
        details: error.message
      });
    }
  }
);

export default router;
