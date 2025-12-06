import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import searchService from '../services/searchService.js';
import FilterBuilder from '../utils/filterBuilder.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/search/global
 * Busca global em todas as entidades
 */
router.post('/global', authenticate, async (req, res, next) => {
  try {
    const { query, entities, limit } = req.body;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const result = await searchService.globalSearch(query, { entities, limit });

    // Salvar busca no histórico do usuário
    await searchService.saveSearch(req.user.id, {
      query,
      entity: 'global',
      filters: { entities }
    }).catch(err => logger.warn('Failed to save search:', err));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/products
 * Busca avançada de produtos
 */
router.post('/products', authenticate, async (req, res, next) => {
  try {
    const { query = '', ...filters } = req.body;
    const sanitized = FilterBuilder.sanitizeFilters(filters);

    const result = await searchService.advancedSearch('products', {
      query,
      ...sanitized
    });

    // Salvar busca
    await searchService.saveSearch(req.user.id, {
      query,
      entity: 'products',
      filters: sanitized
    }).catch(err => logger.warn('Failed to save search:', err));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/clients
 * Busca avançada de clientes
 */
router.post('/clients', authenticate, async (req, res, next) => {
  try {
    const { query = '', ...filters } = req.body;
    const sanitized = FilterBuilder.sanitizeFilters(filters);

    const result = await searchService.advancedSearch('clients', {
      query,
      ...sanitized
    });

    // Salvar busca
    await searchService.saveSearch(req.user.id, {
      query,
      entity: 'clients',
      filters: sanitized
    }).catch(err => logger.warn('Failed to save search:', err));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/sales
 * Busca avançada de vendas
 */
router.post('/sales', authenticate, async (req, res, next) => {
  try {
    const { query = '', ...filters } = req.body;
    const sanitized = FilterBuilder.sanitizeFilters(filters);

    const result = await searchService.advancedSearch('sales', {
      query,
      ...sanitized
    });

    // Salvar busca
    await searchService.saveSearch(req.user.id, {
      query,
      entity: 'sales',
      filters: sanitized
    }).catch(err => logger.warn('Failed to save search:', err));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/suppliers
 * Busca avançada de fornecedores
 */
router.post('/suppliers', authenticate, async (req, res, next) => {
  try {
    const { query = '', ...filters } = req.body;
    const sanitized = FilterBuilder.sanitizeFilters(filters);

    const result = await searchService.advancedSearch('suppliers', {
      query,
      ...sanitized
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/suggestions
 * Autocomplete - sugestões de busca
 */
router.get('/suggestions', authenticate, async (req, res, next) => {
  try {
    const { query, entity = 'products', limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const result = await searchService.getSuggestions(query, entity, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/recent
 * Buscas recentes do usuário
 */
router.get('/recent', authenticate, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const result = await searchService.getRecentSearches(req.user.id, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/filters/presets
 * Obter presets de filtros de data
 */
router.get('/filters/presets', authenticate, (req, res) => {
  const presets = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: 'last7days', label: 'Últimos 7 dias' },
    { id: 'last30days', label: 'Últimos 30 dias' },
    { id: 'thisMonth', label: 'Este mês' },
    { id: 'lastMonth', label: 'Mês passado' },
    { id: 'thisYear', label: 'Este ano' }
  ];

  res.json({
    success: true,
    presets
  });
});

/**
 * POST /api/search/filters/summary
 * Resumo de filtros aplicados
 */
router.post('/filters/summary', authenticate, (req, res) => {
  try {
    const filters = FilterBuilder.sanitizeFilters(req.body);
    const summary = FilterBuilder.getFilterSummary(filters);

    res.json({
      success: true,
      summary,
      count: summary.length
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid filters' });
  }
});

/**
 * POST /api/search/saved
 * Salvar busca personalizada
 */
router.post('/saved', authenticate, async (req, res, next) => {
  try {
    const { name, entity, query, filters, is_favorite } = req.body;

    if (!name || !entity) {
      return res.status(400).json({ error: 'name and entity are required' });
    }

    const result = await searchService.saveSavedSearch(req.user.id, {
      name,
      entity,
      query,
      filters,
      is_favorite
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/saved
 * Obter buscas salvas do usuário
 */
router.get('/saved', authenticate, async (req, res, next) => {
  try {
    const { entity, is_favorite } = req.query;
    const result = await searchService.getSavedSearches(req.user.id, { entity, is_favorite });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/search/saved/:id
 * Atualizar busca salva
 */
router.put('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const result = await searchService.updateSavedSearch(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/search/saved/:id
 * Deletar busca salva
 */
router.delete('/saved/:id', authenticate, async (req, res, next) => {
  try {
    const result = await searchService.deleteSavedSearch(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/saved/:id/use
 * Usar busca salva (incrementar contador)
 */
router.post('/saved/:id/use', authenticate, async (req, res, next) => {
  try {
    const result = await searchService.useSavedSearch(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
