/**
 * Marketplace Routes
 * Rotas para gerenciar integrações com marketplaces
 */

import express from 'express';
import { MarketplaceIntegration } from '../models/index.js';
import marketplaceSyncService from '../services/marketplaceSyncService.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { tenantMiddleware } from '../middlewares/tenant.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware: Autenticação + Multi-tenant
router.use(authenticate);
router.use(tenantMiddleware);

/**
 * GET /api/marketplace/integrations
 * Listar integrações do tenant
 */
router.get('/integrations', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const integrations = await MarketplaceIntegration.findAll({
      where: { tenant_id: req.tenantId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    logger.error('Erro ao listar integrações:', error);
    res.status(500).json({
      error: 'Erro ao listar integrações',
      message: error.message
    });
  }
});

/**
 * GET /api/marketplace/integrations/:id
 * Buscar integração específica
 */
router.get('/integrations/:id', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const integration = await MarketplaceIntegration.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.tenantId
      }
    });

    if (!integration) {
      return res.status(404).json({
        error: 'Integração não encontrada'
      });
    }

    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Erro ao buscar integração:', error);
    res.status(500).json({
      error: 'Erro ao buscar integração',
      message: error.message
    });
  }
});

/**
 * POST /api/marketplace/integrations
 * Criar nova integração
 */
router.post('/integrations', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const {
      plataforma,
      nome_integracao,
      credenciais,
      config
    } = req.body;

    if (!plataforma) {
      return res.status(400).json({
        error: 'Campo obrigatório: plataforma'
      });
    }

    // Validar plataforma
    const plataformasValidas = ['MERCADO_LIVRE', 'SHOPEE', 'AMAZON', 'B2W', 'MAGALU', 'VIA_VAREJO', 'OUTROS'];
    if (!plataformasValidas.includes(plataforma)) {
      return res.status(400).json({
        error: 'Plataforma inválida',
        plataformas_validas: plataformasValidas
      });
    }

    // Criar integração
    const integration = await MarketplaceIntegration.create({
      tenant_id: req.tenantId,
      plataforma,
      nome_integracao,
      config: config || {}
    });

    // Salvar credenciais (criptografadas)
    if (credenciais) {
      integration.setCredenciais(credenciais);
      await integration.save();
    }

    // Se sync_auto está habilitado, configurar job
    if (config?.sync_auto) {
      marketplaceSyncService.setupAutoSync(integration);
    }

    logger.info(`Integração criada: ${integration.id} - ${plataforma}`);

    res.status(201).json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Erro ao criar integração:', error);
    res.status(500).json({
      error: 'Erro ao criar integração',
      message: error.message
    });
  }
});

/**
 * PUT /api/marketplace/integrations/:id
 * Atualizar integração
 */
router.put('/integrations/:id', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const integration = await MarketplaceIntegration.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.tenantId
      }
    });

    if (!integration) {
      return res.status(404).json({
        error: 'Integração não encontrada'
      });
    }

    const {
      nome_integracao,
      status,
      credenciais,
      config
    } = req.body;

    // Atualizar campos
    if (nome_integracao !== undefined) integration.nome_integracao = nome_integracao;
    if (status !== undefined) integration.status = status;
    if (config !== undefined) integration.config = config;

    // Atualizar credenciais
    if (credenciais) {
      integration.setCredenciais(credenciais);
    }

    await integration.save();

    // Gerenciar sync automático
    if (config) {
      if (config.sync_auto && status === 'ATIVA') {
        marketplaceSyncService.setupAutoSync(integration);
      } else {
        marketplaceSyncService.stopAutoSync(integration.id);
      }
    }

    logger.info(`Integração atualizada: ${integration.id}`);

    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Erro ao atualizar integração:', error);
    res.status(500).json({
      error: 'Erro ao atualizar integração',
      message: error.message
    });
  }
});

/**
 * DELETE /api/marketplace/integrations/:id
 * Remover integração
 */
router.delete('/integrations/:id', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const integration = await MarketplaceIntegration.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.tenantId
      }
    });

    if (!integration) {
      return res.status(404).json({
        error: 'Integração não encontrada'
      });
    }

    // Parar sync automático
    marketplaceSyncService.stopAutoSync(integration.id);

    await integration.destroy();

    logger.info(`Integração removida: ${integration.id}`);

    res.json({
      success: true,
      message: 'Integração removida com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover integração:', error);
    res.status(500).json({
      error: 'Erro ao remover integração',
      message: error.message
    });
  }
});

/**
 * POST /api/marketplace/sync/products
 * Sincronizar produtos com marketplace
 */
router.post('/sync/products', authorize(['admin', 'ceo', 'estoque']), async (req, res) => {
  try {
    const { integration_id, product_ids } = req.body;

    if (!integration_id) {
      return res.status(400).json({
        error: 'Campo obrigatório: integration_id'
      });
    }

    const results = await marketplaceSyncService.syncProducts(
      req.tenantId,
      integration_id,
      product_ids || []
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Erro ao sincronizar produtos:', error);
    res.status(500).json({
      error: 'Erro ao sincronizar produtos',
      message: error.message
    });
  }
});

/**
 * POST /api/marketplace/sync/stock
 * Sincronizar estoque com marketplace
 */
router.post('/sync/stock', authorize(['admin', 'ceo', 'estoque']), async (req, res) => {
  try {
    const { integration_id, product_ids } = req.body;

    if (!integration_id) {
      return res.status(400).json({
        error: 'Campo obrigatório: integration_id'
      });
    }

    const results = await marketplaceSyncService.syncStock(
      req.tenantId,
      integration_id,
      product_ids || []
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Erro ao sincronizar estoque:', error);
    res.status(500).json({
      error: 'Erro ao sincronizar estoque',
      message: error.message
    });
  }
});

/**
 * POST /api/marketplace/import/orders
 * Importar pedidos do marketplace
 */
router.post('/import/orders', authorize(['admin', 'ceo', 'vendas']), async (req, res) => {
  try {
    const { integration_id, ...params } = req.body;

    if (!integration_id) {
      return res.status(400).json({
        error: 'Campo obrigatório: integration_id'
      });
    }

    const results = await marketplaceSyncService.importOrders(
      req.tenantId,
      integration_id,
      params
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Erro ao importar pedidos:', error);
    res.status(500).json({
      error: 'Erro ao importar pedidos',
      message: error.message
    });
  }
});

/**
 * POST /api/marketplace/test-connection
 * Testar conexão com marketplace
 */
router.post('/test-connection', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const { integration_id } = req.body;

    if (!integration_id) {
      return res.status(400).json({
        error: 'Campo obrigatório: integration_id'
      });
    }

    const integration = await MarketplaceIntegration.findOne({
      where: {
        id: integration_id,
        tenant_id: req.tenantId
      }
    });

    if (!integration) {
      return res.status(404).json({
        error: 'Integração não encontrada'
      });
    }

    const credenciais = integration.getCredenciais();
    if (!credenciais) {
      return res.status(400).json({
        error: 'Credenciais não configuradas'
      });
    }

    const { createMarketplaceAdapter } = await import('../services/marketplaceAdapters.js');
    const adapter = createMarketplaceAdapter(
      integration.plataforma,
      credenciais,
      integration.config
    );

    // Testar autenticação
    await adapter.authenticate();

    // Testar listagem de produtos (apenas 1)
    const productsTest = await adapter.listProducts({ limit: 1 });

    await integration.update({
      status: 'ATIVA',
      ultimo_erro: null
    });

    res.json({
      success: true,
      message: 'Conexão estabelecida com sucesso',
      data: {
        plataforma: integration.plataforma,
        products_available: productsTest.paging?.total || 0
      }
    });
  } catch (error) {
    logger.error('Erro ao testar conexão:', error);
    
    // Atualizar status da integração
    if (integration) {
      await integration.update({
        status: 'ERRO',
        ultimo_erro: error.message
      });
    }

    res.status(500).json({
      error: 'Erro ao testar conexão',
      message: error.message
    });
  }
});

/**
 * GET /api/marketplace/stats
 * Estatísticas de integrações
 */
router.get('/stats', authorize(['admin', 'ceo']), async (req, res) => {
  try {
    const integrations = await MarketplaceIntegration.findAll({
      where: { tenant_id: req.tenantId }
    });

    const stats = {
      total_integrations: integrations.length,
      active: integrations.filter(i => i.status === 'ATIVA').length,
      inactive: integrations.filter(i => i.status === 'INATIVA').length,
      error: integrations.filter(i => i.status === 'ERRO').length,
      total_products_synced: integrations.reduce((sum, i) => sum + i.total_produtos_sync, 0),
      total_orders_imported: integrations.reduce((sum, i) => sum + i.total_pedidos_importados, 0),
      by_platform: {}
    };

    integrations.forEach(integration => {
      if (!stats.by_platform[integration.plataforma]) {
        stats.by_platform[integration.plataforma] = {
          count: 0,
          products_synced: 0,
          orders_imported: 0
        };
      }
      stats.by_platform[integration.plataforma].count++;
      stats.by_platform[integration.plataforma].products_synced += integration.total_produtos_sync;
      stats.by_platform[integration.plataforma].orders_imported += integration.total_pedidos_importados;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      message: error.message
    });
  }
});

export default router;
