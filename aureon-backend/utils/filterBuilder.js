/**
 * Filter Builder Utility
 * 
 * Helpers para construir queries Sequelize complexas
 * a partir de objetos de filtros
 */

import { Op } from 'sequelize';

class FilterBuilder {
  /**
   * Construir cláusula WHERE a partir de filtros
   */
  static buildWhere(filters = {}) {
    const where = {};

    // String filters (exact match)
    if (filters.categoria) where.categoria = filters.categoria;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.status) where.status = filters.status;
    if (filters.origem) where.origem = filters.origem;
    if (filters.canal) where.canal = filters.canal;

    // Boolean filters
    if (filters.active !== undefined) {
      where.active = filters.active === 'true' || filters.active === true;
    }

    // Numeric range filters
    if (filters.minPrice || filters.maxPrice) {
      where.preco_venda = {};
      if (filters.minPrice) where.preco_venda[Op.gte] = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.preco_venda[Op.lte] = parseFloat(filters.maxPrice);
    }

    if (filters.minValue || filters.maxValue) {
      where.valor_venda = {};
      if (filters.minValue) where.valor_venda[Op.gte] = parseFloat(filters.minValue);
      if (filters.maxValue) where.valor_venda[Op.lte] = parseFloat(filters.maxValue);
    }

    if (filters.minStock !== undefined) {
      where.estoque = { [Op.gte]: parseInt(filters.minStock) };
    }

    if (filters.maxStock !== undefined) {
      where.estoque = where.estoque || {};
      where.estoque[Op.lte] = parseInt(filters.maxStock);
    }

    // Date range filters
    if (filters.startDate || filters.endDate) {
      const dateField = filters.dateField || 'created_at';
      where[dateField] = {};
      if (filters.startDate) where[dateField][Op.gte] = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        where[dateField][Op.lte] = endDate;
      }
    }

    // Array filters (IN)
    if (filters.categorias && Array.isArray(filters.categorias)) {
      where.categoria = { [Op.in]: filters.categorias };
    }

    if (filters.tipos && Array.isArray(filters.tipos)) {
      where.tipo = { [Op.in]: filters.tipos };
    }

    if (filters.statuses && Array.isArray(filters.statuses)) {
      where.status = { [Op.in]: filters.statuses };
    }

    // Special filters
    if (filters.inStock) {
      where.estoque = { [Op.gt]: 0 };
    }

    if (filters.lowStock) {
      where.estoque = { [Op.lte]: 10 };
    }

    if (filters.hasEmail) {
      where.email = { [Op.ne]: null };
    }

    return where;
  }

  /**
   * Construir cláusula de busca (OR)
   */
  static buildSearch(query, fields = []) {
    if (!query || fields.length === 0) {
      return {};
    }

    return {
      [Op.or]: fields.map(field => ({
        [field]: { [Op.iLike]: `%${query}%` }
      }))
    };
  }

  /**
   * Combinar WHERE e SEARCH
   */
  static combine(query, fields, filters) {
    const where = this.buildWhere(filters);
    const search = this.buildSearch(query, fields);

    if (Object.keys(search).length > 0) {
      return { ...where, ...search };
    }

    return where;
  }

  /**
   * Construir opções de ordenação
   */
  static buildOrder(sortBy = 'id', sortOrder = 'DESC') {
    const validOrders = ['ASC', 'DESC', 'asc', 'desc'];
    const order = validOrders.includes(sortOrder) ? sortOrder.toUpperCase() : 'DESC';
    
    return [[sortBy, order]];
  }

  /**
   * Construir opções de paginação
   */
  static buildPagination(page = 1, limit = 50) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 1000); // Max 1000
    const offset = (pageNum - 1) * limitNum;

    return {
      limit: limitNum,
      offset,
      page: pageNum
    };
  }

  /**
   * Build complete query options
   */
  static buildQueryOptions(params = {}) {
    const {
      query,
      searchFields = [],
      sortBy,
      sortOrder,
      page,
      limit,
      ...filters
    } = params;

    const where = this.combine(query, searchFields, filters);
    const order = this.buildOrder(sortBy, sortOrder);
    const pagination = this.buildPagination(page, limit);

    return {
      where,
      order,
      ...pagination
    };
  }

  /**
   * Filtros de data pré-definidos
   */
  static getDatePreset(preset) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return {
          startDate: today,
          endDate: now
        };
      
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday,
          endDate: today
        };
      
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return {
          startDate: last7,
          endDate: now
        };
      
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return {
          startDate: last30,
          endDate: now
        };
      
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart,
          endDate: now
        };
      
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: lastMonthStart,
          endDate: lastMonthEnd
        };
      
      case 'thisYear':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: yearStart,
          endDate: now
        };
      
      default:
        return null;
    }
  }

  /**
   * Validar e sanitizar filtros
   */
  static sanitizeFilters(filters = {}) {
    const sanitized = {};

    // Remove empty values
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        sanitized[key] = value;
      }
    });

    // Convert string booleans
    if (sanitized.active === 'true') sanitized.active = true;
    if (sanitized.active === 'false') sanitized.active = false;
    if (sanitized.inStock === 'true') sanitized.inStock = true;
    if (sanitized.lowStock === 'true') sanitized.lowStock = true;

    // Parse numbers
    if (sanitized.minPrice) sanitized.minPrice = parseFloat(sanitized.minPrice);
    if (sanitized.maxPrice) sanitized.maxPrice = parseFloat(sanitized.maxPrice);
    if (sanitized.minValue) sanitized.minValue = parseFloat(sanitized.minValue);
    if (sanitized.maxValue) sanitized.maxValue = parseFloat(sanitized.maxValue);
    if (sanitized.minStock) sanitized.minStock = parseInt(sanitized.minStock);
    if (sanitized.maxStock) sanitized.maxStock = parseInt(sanitized.maxStock);

    // Parse arrays from comma-separated strings
    if (typeof sanitized.categorias === 'string') {
      sanitized.categorias = sanitized.categorias.split(',').map(s => s.trim());
    }
    if (typeof sanitized.tipos === 'string') {
      sanitized.tipos = sanitized.tipos.split(',').map(s => s.trim());
    }
    if (typeof sanitized.statuses === 'string') {
      sanitized.statuses = sanitized.statuses.split(',').map(s => s.trim());
    }

    return sanitized;
  }

  /**
   * Get filter summary for display
   */
  static getFilterSummary(filters = {}) {
    const summary = [];

    if (filters.categoria) summary.push(`Categoria: ${filters.categoria}`);
    if (filters.tipo) summary.push(`Tipo: ${filters.tipo}`);
    if (filters.status) summary.push(`Status: ${filters.status}`);
    if (filters.active !== undefined) summary.push(`Ativo: ${filters.active ? 'Sim' : 'Não'}`);
    if (filters.minPrice || filters.maxPrice) {
      const range = [];
      if (filters.minPrice) range.push(`≥ R$ ${filters.minPrice}`);
      if (filters.maxPrice) range.push(`≤ R$ ${filters.maxPrice}`);
      summary.push(`Preço: ${range.join(' e ')}`);
    }
    if (filters.startDate || filters.endDate) {
      const range = [];
      if (filters.startDate) range.push(`De: ${filters.startDate}`);
      if (filters.endDate) range.push(`Até: ${filters.endDate}`);
      summary.push(range.join(' '));
    }
    if (filters.inStock) summary.push('Em estoque');
    if (filters.lowStock) summary.push('Estoque baixo');

    return summary;
  }
}

export default FilterBuilder;
