/**
 * Marketplace Adapters
 * Adaptadores para integração com diferentes marketplaces
 * Interface unificada para operações comuns
 */

import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Interface base para todos os adapters
 */
class MarketplaceAdapter {
  constructor(credenciais, config = {}) {
    this.credenciais = credenciais;
    this.config = config;
  }

  // Métodos que devem ser implementados por cada adapter
  async authenticate() {
    throw new Error('authenticate() deve ser implementado');
  }

  async listProducts(params = {}) {
    throw new Error('listProducts() deve ser implementado');
  }

  async getProduct(marketplaceProductId) {
    throw new Error('getProduct() deve ser implementado');
  }

  async syncProduct(product) {
    throw new Error('syncProduct() deve ser implementado');
  }

  async syncStock(productId, quantity) {
    throw new Error('syncStock() deve ser implementado');
  }

  async syncPrice(productId, price) {
    throw new Error('syncPrice() deve ser implementado');
  }

  async getOrders(params = {}) {
    throw new Error('getOrders() deve ser implementado');
  }

  async getOrder(orderId) {
    throw new Error('getOrder() deve ser implementado');
  }

  async updateOrderStatus(orderId, status) {
    throw new Error('updateOrderStatus() deve ser implementado');
  }
}

/**
 * Mercado Livre Adapter
 */
class MercadoLivreAdapter extends MarketplaceAdapter {
  constructor(credenciais, config = {}) {
    super(credenciais, config);
    this.baseUrl = 'https://api.mercadolibre.com';
    this.accessToken = credenciais.access_token;
    this.sellerId = credenciais.seller_id;
  }

  async authenticate() {
    // Refresh token se necessário
    if (!this.credenciais.refresh_token) {
      throw new Error('Refresh token não disponível');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'refresh_token',
        client_id: this.credenciais.client_id,
        client_secret: this.credenciais.client_secret,
        refresh_token: this.credenciais.refresh_token
      });

      this.accessToken = response.data.access_token;
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      };
    } catch (error) {
      logger.error('Erro ao autenticar no Mercado Livre:', error);
      throw error;
    }
  }

  async listProducts(params = {}) {
    try {
      const { offset = 0, limit = 50 } = params;
      
      const response = await axios.get(`${this.baseUrl}/users/${this.sellerId}/items/search`, {
        params: { offset, limit },
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      return {
        items: response.data.results || [],
        paging: response.data.paging || {}
      };
    } catch (error) {
      logger.error('Erro ao listar produtos do Mercado Livre:', error);
      throw error;
    }
  }

  async getProduct(marketplaceProductId) {
    try {
      const response = await axios.get(`${this.baseUrl}/items/${marketplaceProductId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar produto do Mercado Livre:', error);
      throw error;
    }
  }

  async syncProduct(product) {
    try {
      const mlProduct = {
        title: product.produto,
        category_id: product.ml_category_id || 'MLB1051', // Default category
        price: parseFloat(product.preco_venda),
        currency_id: 'BRL',
        available_quantity: product.quantidade_estoque,
        buying_mode: 'buy_it_now',
        condition: 'new',
        listing_type_id: 'gold_special',
        description: product.descricao || product.produto,
        pictures: product.imagens ? product.imagens.map(img => ({ source: img })) : []
      };

      // Se já existe no ML, atualizar. Senão, criar
      if (product.ml_product_id) {
        const response = await axios.put(
          `${this.baseUrl}/items/${product.ml_product_id}`,
          mlProduct,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        );
        return response.data;
      } else {
        const response = await axios.post(
          `${this.baseUrl}/items`,
          mlProduct,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        );
        return response.data;
      }
    } catch (error) {
      logger.error('Erro ao sincronizar produto no Mercado Livre:', error);
      throw error;
    }
  }

  async syncStock(productId, quantity) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/items/${productId}`,
        { available_quantity: quantity },
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('Erro ao sincronizar estoque no Mercado Livre:', error);
      throw error;
    }
  }

  async syncPrice(productId, price) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/items/${productId}`,
        { price: parseFloat(price) },
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('Erro ao sincronizar preço no Mercado Livre:', error);
      throw error;
    }
  }

  async getOrders(params = {}) {
    try {
      const { offset = 0, limit = 50, sort = 'date_desc' } = params;
      
      const response = await axios.get(`${this.baseUrl}/orders/search`, {
        params: {
          seller: this.sellerId,
          offset,
          limit,
          sort
        },
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      return {
        orders: response.data.results || [],
        paging: response.data.paging || {}
      };
    } catch (error) {
      logger.error('Erro ao buscar pedidos do Mercado Livre:', error);
      throw error;
    }
  }

  async getOrder(orderId) {
    try {
      const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar pedido do Mercado Livre:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status) {
    // Mercado Livre não permite update direto de status via API
    // Status é atualizado por ações (shipment, feedback, etc)
    logger.warn('updateOrderStatus não implementado para Mercado Livre');
    return { message: 'Status de pedidos gerenciado automaticamente pelo ML' };
  }
}

/**
 * Shopee Adapter
 */
class ShopeeAdapter extends MarketplaceAdapter {
  constructor(credenciais, config = {}) {
    super(credenciais, config);
    this.baseUrl = 'https://partner.shopeemobile.com/api/v2';
    this.partnerId = credenciais.partner_id;
    this.shopId = credenciais.shop_id;
    this.partnerKey = credenciais.partner_key;
  }

  async authenticate() {
    // Shopee usa partner_id + partner_key + signature
    // Não há refresh token, mas sim assinatura de cada request
    return { authenticated: true };
  }

  async listProducts(params = {}) {
    try {
      // Mock: Shopee API requer signature complexa
      // Em produção, implementar signature e chamada real
      logger.info('Listando produtos da Shopee (mock)');
      
      return {
        items: [],
        paging: { offset: 0, limit: 50, total: 0 }
      };
    } catch (error) {
      logger.error('Erro ao listar produtos da Shopee:', error);
      throw error;
    }
  }

  async getProduct(marketplaceProductId) {
    logger.info('Buscando produto da Shopee (mock)');
    return { item_id: marketplaceProductId };
  }

  async syncProduct(product) {
    logger.info('Sincronizando produto na Shopee (mock)');
    return { item_id: product.id, status: 'synced' };
  }

  async syncStock(productId, quantity) {
    logger.info('Sincronizando estoque na Shopee (mock)');
    return { success: true };
  }

  async syncPrice(productId, price) {
    logger.info('Sincronizando preço na Shopee (mock)');
    return { success: true };
  }

  async getOrders(params = {}) {
    logger.info('Buscando pedidos da Shopee (mock)');
    return { orders: [], paging: {} };
  }

  async getOrder(orderId) {
    logger.info('Buscando pedido da Shopee (mock)');
    return { order_id: orderId };
  }

  async updateOrderStatus(orderId, status) {
    logger.info('Atualizando status de pedido na Shopee (mock)');
    return { success: true };
  }
}

/**
 * Amazon Adapter
 */
class AmazonAdapter extends MarketplaceAdapter {
  constructor(credenciais, config = {}) {
    super(credenciais, config);
    this.baseUrl = 'https://sellingpartnerapi-na.amazon.com';
    this.sellerId = credenciais.seller_id;
    this.accessToken = credenciais.access_token;
  }

  async authenticate() {
    // Amazon SP-API usa LWA (Login with Amazon) para autenticação
    logger.info('Autenticando na Amazon SP-API (mock)');
    return { authenticated: true };
  }

  async listProducts(params = {}) {
    logger.info('Listando produtos da Amazon (mock)');
    return { items: [], paging: {} };
  }

  async getProduct(marketplaceProductId) {
    logger.info('Buscando produto da Amazon (mock)');
    return { asin: marketplaceProductId };
  }

  async syncProduct(product) {
    logger.info('Sincronizando produto na Amazon (mock)');
    return { asin: product.id, status: 'synced' };
  }

  async syncStock(productId, quantity) {
    logger.info('Sincronizando estoque na Amazon (mock)');
    return { success: true };
  }

  async syncPrice(productId, price) {
    logger.info('Sincronizando preço na Amazon (mock)');
    return { success: true };
  }

  async getOrders(params = {}) {
    logger.info('Buscando pedidos da Amazon (mock)');
    return { orders: [], paging: {} };
  }

  async getOrder(orderId) {
    logger.info('Buscando pedido da Amazon (mock)');
    return { amazon_order_id: orderId };
  }

  async updateOrderStatus(orderId, status) {
    logger.info('Atualizando status de pedido na Amazon (mock)');
    return { success: true };
  }
}

/**
 * Factory para criar adapter apropriado
 */
export function createMarketplaceAdapter(plataforma, credenciais, config = {}) {
  switch (plataforma) {
    case 'MERCADO_LIVRE':
      return new MercadoLivreAdapter(credenciais, config);
    case 'SHOPEE':
      return new ShopeeAdapter(credenciais, config);
    case 'AMAZON':
      return new AmazonAdapter(credenciais, config);
    default:
      throw new Error(`Plataforma não suportada: ${plataforma}`);
  }
}

export {
  MarketplaceAdapter,
  MercadoLivreAdapter,
  ShopeeAdapter,
  AmazonAdapter
};
