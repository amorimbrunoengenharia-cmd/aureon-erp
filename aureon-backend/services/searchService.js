/**
 * Search Service - Busca Avançada Multi-Entidades
 * 
 * Features:
 * - Full-text search com ranking
 * - Busca em múltiplas entidades
 * - Filtros complexos
 * - Sugestões de busca
 * - Histórico de buscas
 */

import { Op } from 'sequelize';
import models from '../models/index.js';
import logger from '../utils/logger.js';

class SearchService {
  /**
   * Busca global em todas as entidades
   */
  async globalSearch(query, options = {}) {
    const {
      entities = ['products', 'clients', 'sales', 'suppliers'],
      limit = 10
    } = options;

    try {
      const results = {
        query,
        results: {},
        total: 0,
        timestamp: new Date().toISOString()
      };

      // Buscar em cada entidade em paralelo
      const searches = [];

      if (entities.includes('products')) {
        searches.push(this.searchProducts(query, { limit }).then(r => ({ type: 'products', data: r })));
      }
      if (entities.includes('clients')) {
        searches.push(this.searchClients(query, { limit }).then(r => ({ type: 'clients', data: r })));
      }
      if (entities.includes('sales')) {
        searches.push(this.searchSales(query, { limit }).then(r => ({ type: 'sales', data: r })));
      }
      if (entities.includes('suppliers')) {
        searches.push(this.searchSuppliers(query, { limit }).then(r => ({ type: 'suppliers', data: r })));
      }

      const allResults = await Promise.all(searches);

      // Organizar resultados
      allResults.forEach(({ type, data }) => {
        results.results[type] = data;
        results.total += data.length;
      });

      return {
        success: true,
        ...results
      };
    } catch (error) {
      logger.error('Error in globalSearch:', error);
      throw error;
    }
  }

  /**
   * Buscar produtos
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, filters = {} } = options;

    try {
      const where = {
        [Op.or]: [
          { nome: { [Op.iLike]: `%${query}%` } },
          { sku: { [Op.iLike]: `%${query}%` } },
          { descricao: { [Op.iLike]: `%${query}%` } },
          { categoria: { [Op.iLike]: `%${query}%` } }
        ]
      };

      // Aplicar filtros adicionais
      if (filters.categoria) where.categoria = filters.categoria;
      if (filters.tipo) where.tipo = filters.tipo;
      if (filters.active !== undefined) where.active = filters.active;
      if (filters.minPrice) where.preco_venda = { [Op.gte]: filters.minPrice };
      if (filters.maxPrice) {
        where.preco_venda = where.preco_venda || {};
        where.preco_venda[Op.lte] = filters.maxPrice;
      }
      if (filters.inStock) where.estoque = { [Op.gt]: 0 };

      const products = await models.Product.findAll({
        where,
        limit: parseInt(limit),
        order: [['nome', 'ASC']],
        attributes: [
          'id', 'nome', 'sku', 'descricao', 'categoria', 'tipo',
          'preco_venda', 'preco_custo', 'estoque', 'active'
        ]
      });

      return products;
    } catch (error) {
      logger.error('Error in searchProducts:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes
   */
  async searchClients(query, options = {}) {
    const { limit = 20, filters = {} } = options;

    try {
      const where = {
        [Op.or]: [
          { nome: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { telefone: { [Op.iLike]: `%${query}%` } },
          { cpf: { [Op.iLike]: `%${query}%` } },
          { endereco: { [Op.iLike]: `%${query}%` } }
        ]
      };

      // Filtros adicionais
      if (filters.categoria) where.categoria = filters.categoria;
      if (filters.origem) where.origem = filters.origem;
      if (filters.active !== undefined) where.active = filters.active;

      const clients = await models.Client.findAll({
        where,
        limit: parseInt(limit),
        order: [['nome', 'ASC']],
        attributes: [
          'id', 'nome', 'email', 'telefone', 'cpf', 'endereco',
          'categoria', 'origem', 'total_compras', 'active'
        ]
      });

      return clients;
    } catch (error) {
      logger.error('Error in searchClients:', error);
      throw error;
    }
  }

  /**
   * Buscar vendas
   */
  async searchSales(query, options = {}) {
    const { limit = 20, filters = {} } = options;

    try {
      const where = {
        [Op.or]: [
          { produto: { [Op.iLike]: `%${query}%` } },
          { vendedor: { [Op.iLike]: `%${query}%` } },
          { canal: { [Op.iLike]: `%${query}%` } }
        ]
      };

      // Filtros adicionais
      if (filters.status) where.status = filters.status;
      if (filters.canal) where.canal = filters.canal;
      if (filters.startDate && filters.endDate) {
        where.data_venda = {
          [Op.between]: [filters.startDate, filters.endDate]
        };
      }
      if (filters.minValue) where.valor_venda = { [Op.gte]: filters.minValue };
      if (filters.maxValue) {
        where.valor_venda = where.valor_venda || {};
        where.valor_venda[Op.lte] = filters.maxValue;
      }

      const sales = await models.Sale.findAll({
        where,
        limit: parseInt(limit),
        order: [['data_venda', 'DESC']],
        include: [
          {
            model: models.Client,
            as: 'client',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: models.Product,
            as: 'product',
            attributes: ['id', 'nome', 'sku']
          }
        ]
      });

      return sales;
    } catch (error) {
      logger.error('Error in searchSales:', error);
      throw error;
    }
  }

  /**
   * Buscar fornecedores
   */
  async searchSuppliers(query, options = {}) {
    const { limit = 20, filters = {} } = options;

    try {
      const where = {
        [Op.or]: [
          { nome: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { telefone: { [Op.iLike]: `%${query}%` } },
          { cnpj: { [Op.iLike]: `%${query}%` } }
        ]
      };

      // Filtros adicionais
      if (filters.categoria) where.categoria = filters.categoria;
      if (filters.active !== undefined) where.active = filters.active;

      const suppliers = await models.Supplier.findAll({
        where,
        limit: parseInt(limit),
        order: [['nome', 'ASC']],
        attributes: [
          'id', 'nome', 'email', 'telefone', 'cnpj',
          'categoria', 'active'
        ]
      });

      return suppliers;
    } catch (error) {
      logger.error('Error in searchSuppliers:', error);
      throw error;
    }
  }

  /**
   * Busca com filtros complexos
   */
  async advancedSearch(entity, filters = {}) {
    try {
      const { query, page = 1, limit = 50, sortBy = 'id', sortOrder = 'DESC', ...otherFilters } = filters;

      let results;

      switch (entity) {
        case 'products':
          results = await this.searchProducts(query || '', { limit: limit * page, filters: otherFilters });
          break;
        case 'clients':
          results = await this.searchClients(query || '', { limit: limit * page, filters: otherFilters });
          break;
        case 'sales':
          results = await this.searchSales(query || '', { limit: limit * page, filters: otherFilters });
          break;
        case 'suppliers':
          results = await this.searchSuppliers(query || '', { limit: limit * page, filters: otherFilters });
          break;
        default:
          throw new Error(`Unsupported entity: ${entity}`);
      }

      // Paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedResults = results.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedResults,
        pagination: {
          total: results.length,
          page: parseInt(page),
          pages: Math.ceil(results.length / limit),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error in advancedSearch:', error);
      throw error;
    }
  }

  /**
   * Sugestões de busca (autocomplete)
   */
  async getSuggestions(query, entity, limit = 10) {
    try {
      if (!query || query.length < 2) {
        return { success: true, suggestions: [] };
      }

      let suggestions = [];

      switch (entity) {
        case 'products':
          const products = await models.Product.findAll({
            where: {
              [Op.or]: [
                { nome: { [Op.iLike]: `${query}%` } },
                { sku: { [Op.iLike]: `${query}%` } }
              ],
              active: true
            },
            limit: parseInt(limit),
            attributes: ['id', 'nome', 'sku'],
            order: [['nome', 'ASC']]
          });
          suggestions = products.map(p => ({
            id: p.id,
            label: p.nome,
            subtitle: p.sku,
            type: 'product'
          }));
          break;

        case 'clients':
          const clients = await models.Client.findAll({
            where: {
              [Op.or]: [
                { nome: { [Op.iLike]: `${query}%` } },
                { email: { [Op.iLike]: `${query}%` } }
              ],
              active: true
            },
            limit: parseInt(limit),
            attributes: ['id', 'nome', 'email'],
            order: [['nome', 'ASC']]
          });
          suggestions = clients.map(c => ({
            id: c.id,
            label: c.nome,
            subtitle: c.email,
            type: 'client'
          }));
          break;

        default:
          throw new Error(`Unsupported entity: ${entity}`);
      }

      return {
        success: true,
        suggestions
      };
    } catch (error) {
      logger.error('Error in getSuggestions:', error);
      throw error;
    }
  }

  /**
   * Busca recente do usuário
   */
  async saveSearch(userId, searchData) {
    try {
      // Salvar em metadata do usuário ou em tabela separada
      const user = await models.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const settings = user.settings || {};
      const recentSearches = settings.recent_searches || [];

      // Adicionar nova busca no início
      recentSearches.unshift({
        query: searchData.query,
        entity: searchData.entity,
        filters: searchData.filters,
        timestamp: new Date().toISOString()
      });

      // Manter apenas últimas 20 buscas
      const updatedSearches = recentSearches.slice(0, 20);

      await user.update({
        settings: {
          ...settings,
          recent_searches: updatedSearches
        }
      });

      return {
        success: true,
        message: 'Search saved'
      };
    } catch (error) {
      logger.error('Error in saveSearch:', error);
      throw error;
    }
  }

  /**
   * Obter buscas recentes do usuário
   */
  async getRecentSearches(userId, limit = 10) {
    try {
      const user = await models.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const settings = user.settings || {};
      const recentSearches = settings.recent_searches || [];

      return {
        success: true,
        searches: recentSearches.slice(0, limit)
      };
    } catch (error) {
      logger.error('Error in getRecentSearches:', error);
      throw error;
    }
  }

  /**
   * Salvar busca personalizada
   */
  async saveSavedSearch(userId, searchData) {
    try {
      const savedSearch = await models.SavedSearch.create({
        user_id: userId,
        name: searchData.name,
        entity: searchData.entity,
        query: searchData.query || '',
        filters: JSON.stringify(searchData.filters || {}),
        is_favorite: searchData.is_favorite || false
      });

      return {
        success: true,
        data: savedSearch
      };
    } catch (error) {
      logger.error('Error in saveSavedSearch:', error);
      throw error;
    }
  }

  /**
   * Obter buscas salvas do usuário
   */
  async getSavedSearches(userId, filters = {}) {
    try {
      const where = { user_id: userId };
      
      if (filters.entity) where.entity = filters.entity;
      if (filters.is_favorite !== undefined) where.is_favorite = filters.is_favorite;

      const savedSearches = await models.SavedSearch.findAll({
        where,
        order: [['last_used_at', 'DESC'], ['created_at', 'DESC']]
      });

      // Parse filters JSON
      const parsed = savedSearches.map(s => {
        const data = s.toJSON();
        try {
          data.filters = JSON.parse(data.filters);
        } catch (e) {
          data.filters = {};
        }
        return data;
      });

      return {
        success: true,
        data: parsed
      };
    } catch (error) {
      logger.error('Error in getSavedSearches:', error);
      throw error;
    }
  }

  /**
   * Atualizar busca salva
   */
  async updateSavedSearch(searchId, userId, updates) {
    try {
      const savedSearch = await models.SavedSearch.findOne({
        where: { id: searchId, user_id: userId }
      });

      if (!savedSearch) {
        throw new Error('Saved search not found');
      }

      if (updates.filters) {
        updates.filters = JSON.stringify(updates.filters);
      }

      await savedSearch.update(updates);

      const result = savedSearch.toJSON();
      if (result.filters) {
        try {
          result.filters = JSON.parse(result.filters);
        } catch (e) {}
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error in updateSavedSearch:', error);
      throw error;
    }
  }

  /**
   * Deletar busca salva
   */
  async deleteSavedSearch(searchId, userId) {
    try {
      const deleted = await models.SavedSearch.destroy({
        where: { id: searchId, user_id: userId }
      });

      if (deleted === 0) {
        throw new Error('Saved search not found');
      }

      return {
        success: true,
        message: 'Saved search deleted'
      };
    } catch (error) {
      logger.error('Error in deleteSavedSearch:', error);
      throw error;
    }
  }

  /**
   * Usar busca salva (incrementar contador)
   */
  async useSavedSearch(searchId, userId) {
    try {
      const savedSearch = await models.SavedSearch.findOne({
        where: { id: searchId, user_id: userId }
      });

      if (!savedSearch) {
        throw new Error('Saved search not found');
      }

      await savedSearch.increment('use_count');
      await savedSearch.update({ last_used_at: new Date() });

      const result = savedSearch.toJSON();
      if (result.filters) {
        try {
          result.filters = JSON.parse(result.filters);
        } catch (e) {}
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Error in useSavedSearch:', error);
      throw error;
    }
  }
}

export default new SearchService();
