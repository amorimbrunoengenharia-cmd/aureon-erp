/**
 * Marketplace Sync Service
 * Serviço para sincronização de produtos, estoque e pedidos com marketplaces
 */

import { MarketplaceIntegration, Product, Sale, Client } from '../models/index.js';
import { createMarketplaceAdapter } from './marketplaceAdapters.js';
import logger from '../utils/logger.js';
import cron from 'node-cron';

class MarketplaceSyncService {
  constructor() {
    this.syncJobs = new Map(); // Guarda jobs de sync automático
  }

  /**
   * Sincronizar produtos de um tenant para um marketplace
   */
  async syncProducts(tenantId, integrationId, productIds = []) {
    try {
      const integration = await MarketplaceIntegration.findOne({
        where: { id: integrationId, tenant_id: tenantId }
      });

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      if (integration.status !== 'ATIVA') {
        throw new Error('Integração não está ativa');
      }

      // Criar adapter
      const credenciais = integration.getCredenciais();
      if (!credenciais) {
        throw new Error('Credenciais não configuradas');
      }

      const adapter = createMarketplaceAdapter(
        integration.plataforma,
        credenciais,
        integration.config
      );

      // Buscar produtos a sincronizar
      const whereClause = {
        tenant_id: tenantId,
        ativo: true
      };

      if (productIds.length > 0) {
        whereClause.id = productIds;
      }

      const products = await Product.findAll({ where: whereClause });

      const results = {
        total: products.length,
        success: 0,
        errors: 0,
        details: []
      };

      // Sincronizar cada produto
      for (const product of products) {
        try {
          const result = await adapter.syncProduct(product);
          
          // Salvar ID do marketplace no produto
          const marketplaceKey = `${integration.plataforma.toLowerCase()}_product_id`;
          await product.update({
            metadata: {
              ...product.metadata,
              [marketplaceKey]: result.id || result.item_id || result.asin
            }
          });

          results.success++;
          results.details.push({
            product_id: product.id,
            produto: product.produto,
            status: 'success',
            marketplace_id: result.id
          });

          logger.info(`Produto ${product.id} sincronizado com ${integration.plataforma}`);
        } catch (error) {
          results.errors++;
          results.details.push({
            product_id: product.id,
            produto: product.produto,
            status: 'error',
            error: error.message
          });

          logger.error(`Erro ao sincronizar produto ${product.id}:`, error);
        }
      }

      // Atualizar estatísticas da integração
      await integration.update({
        total_produtos_sync: integration.total_produtos_sync + results.success,
        ultima_sync: new Date()
      });

      return results;
    } catch (error) {
      logger.error('Erro ao sincronizar produtos:', error);
      
      // Salvar erro na integração
      if (integration) {
        await integration.update({
          status: 'ERRO',
          ultimo_erro: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Sincronizar estoque de produtos
   */
  async syncStock(tenantId, integrationId, productIds = []) {
    try {
      const integration = await MarketplaceIntegration.findOne({
        where: { id: integrationId, tenant_id: tenantId }
      });

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      const credenciais = integration.getCredenciais();
      const adapter = createMarketplaceAdapter(
        integration.plataforma,
        credenciais,
        integration.config
      );

      const whereClause = { tenant_id: tenantId };
      if (productIds.length > 0) {
        whereClause.id = productIds;
      }

      const products = await Product.findAll({ where: whereClause });

      const results = {
        total: products.length,
        success: 0,
        errors: 0,
        details: []
      };

      for (const product of products) {
        try {
          // Obter ID do marketplace
          const marketplaceKey = `${integration.plataforma.toLowerCase()}_product_id`;
          const marketplaceProductId = product.metadata?.[marketplaceKey];

          if (!marketplaceProductId) {
            throw new Error('Produto não está vinculado ao marketplace');
          }

          await adapter.syncStock(marketplaceProductId, product.quantidade_estoque);

          results.success++;
          results.details.push({
            product_id: product.id,
            produto: product.produto,
            status: 'success',
            estoque: product.quantidade_estoque
          });
        } catch (error) {
          results.errors++;
          results.details.push({
            product_id: product.id,
            produto: product.produto,
            status: 'error',
            error: error.message
          });
        }
      }

      await integration.update({ ultima_sync: new Date() });

      return results;
    } catch (error) {
      logger.error('Erro ao sincronizar estoque:', error);
      throw error;
    }
  }

  /**
   * Importar pedidos de um marketplace
   */
  async importOrders(tenantId, integrationId, params = {}) {
    try {
      const integration = await MarketplaceIntegration.findOne({
        where: { id: integrationId, tenant_id: tenantId }
      });

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      const credenciais = integration.getCredenciais();
      const adapter = createMarketplaceAdapter(
        integration.plataforma,
        credenciais,
        integration.config
      );

      // Buscar pedidos do marketplace
      const ordersData = await adapter.getOrders(params);
      const orders = ordersData.orders || [];

      const results = {
        total: orders.length,
        imported: 0,
        skipped: 0,
        errors: 0,
        details: []
      };

      for (const order of orders) {
        try {
          // Verificar se pedido já foi importado
          const existingSale = await Sale.findOne({
            where: {
              tenant_id: tenantId,
              metadata: {
                marketplace_order_id: order.id,
                marketplace_plataforma: integration.plataforma
              }
            }
          });

          if (existingSale) {
            results.skipped++;
            continue;
          }

          // Criar cliente se necessário
          let client = await Client.findOne({
            where: {
              tenant_id: tenantId,
              email: order.buyer?.email
            }
          });

          if (!client && order.buyer) {
            client = await Client.create({
              tenant_id: tenantId,
              nome: order.buyer.nickname || order.buyer.first_name,
              email: order.buyer.email,
              telefone: order.buyer.phone?.number || null
            });
          }

          // Criar venda
          const sale = await Sale.create({
            tenant_id: tenantId,
            cliente_id: client?.id || null,
            valor_total: order.total_amount,
            quantidade: order.order_items?.length || 1,
            status: this.mapOrderStatus(order.status),
            forma_pagamento: order.payments?.[0]?.payment_type || 'OUTRO',
            metadata: {
              marketplace_order_id: order.id,
              marketplace_plataforma: integration.plataforma,
              marketplace_data: order
            }
          });

          results.imported++;
          results.details.push({
            order_id: order.id,
            sale_id: sale.id,
            status: 'imported'
          });

          logger.info(`Pedido ${order.id} importado como venda ${sale.id}`);
        } catch (error) {
          results.errors++;
          results.details.push({
            order_id: order.id,
            status: 'error',
            error: error.message
          });

          logger.error(`Erro ao importar pedido ${order.id}:`, error);
        }
      }

      // Atualizar estatísticas
      await integration.update({
        total_pedidos_importados: integration.total_pedidos_importados + results.imported,
        ultima_sync: new Date()
      });

      return results;
    } catch (error) {
      logger.error('Erro ao importar pedidos:', error);
      throw error;
    }
  }

  /**
   * Mapear status de pedido do marketplace para status interno
   */
  mapOrderStatus(marketplaceStatus) {
    const statusMap = {
      // Mercado Livre
      'confirmed': 'PENDENTE',
      'payment_required': 'PENDENTE',
      'payment_in_process': 'PENDENTE',
      'paid': 'CONCLUIDA',
      'shipped': 'CONCLUIDA',
      'delivered': 'CONCLUIDA',
      'cancelled': 'CANCELADA',
      
      // Shopee
      'UNPAID': 'PENDENTE',
      'READY_TO_SHIP': 'PENDENTE',
      'SHIPPED': 'CONCLUIDA',
      'COMPLETED': 'CONCLUIDA',
      'CANCELLED': 'CANCELADA',
      
      // Amazon
      'Pending': 'PENDENTE',
      'Unshipped': 'PENDENTE',
      'Shipped': 'CONCLUIDA',
      'Canceled': 'CANCELADA'
    };

    return statusMap[marketplaceStatus] || 'PENDENTE';
  }

  /**
   * Configurar sync automático para uma integração
   */
  setupAutoSync(integration) {
    const { sync_auto, sync_interval_minutes } = integration.config || {};

    if (!sync_auto) {
      return;
    }

    const interval = sync_interval_minutes || 60; // Default: 1 hora
    const cronExpression = `*/${interval} * * * *`; // A cada N minutos

    // Cancelar job existente
    const existingJob = this.syncJobs.get(integration.id);
    if (existingJob) {
      existingJob.stop();
    }

    // Criar novo job
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Executando sync automático para integração ${integration.id}`);

      try {
        // Sync estoque
        await this.syncStock(integration.tenant_id, integration.id);

        // Importar pedidos
        await this.importOrders(integration.tenant_id, integration.id);

        logger.info(`Sync automático concluído para integração ${integration.id}`);
      } catch (error) {
        logger.error(`Erro no sync automático da integração ${integration.id}:`, error);
      }
    });

    this.syncJobs.set(integration.id, job);
    logger.info(`Sync automático configurado para integração ${integration.id} (${cronExpression})`);
  }

  /**
   * Parar sync automático de uma integração
   */
  stopAutoSync(integrationId) {
    const job = this.syncJobs.get(integrationId);
    if (job) {
      job.stop();
      this.syncJobs.delete(integrationId);
      logger.info(`Sync automático parado para integração ${integrationId}`);
    }
  }

  /**
   * Inicializar sync automático para todas as integrações ativas
   */
  async initializeAutoSync() {
    try {
      const activeIntegrations = await MarketplaceIntegration.findAll({
        where: { status: 'ATIVA' }
      });

      for (const integration of activeIntegrations) {
        if (integration.config?.sync_auto) {
          this.setupAutoSync(integration);
        }
      }

      logger.info(`${activeIntegrations.length} integrações com sync automático inicializadas`);
    } catch (error) {
      logger.error('Erro ao inicializar sync automático:', error);
    }
  }
}

export default new MarketplaceSyncService();
