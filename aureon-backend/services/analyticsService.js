import { Sequelize, Op } from 'sequelize';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

class AnalyticsService {
  /**
   * Retorna análise de vendas por período
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @param {Object} filters - Filtros adicionais (channel, vendedor_id, etc)
   */
  async getSalesAnalytics(startDate, endDate, filters = {}) {
    try {
      const whereClause = {
        data_venda: {
          [Op.between]: [startDate, endDate]
        }
      };

      // Aplicar filtros adicionais
      if (filters.channel) {
        whereClause.canal_venda = filters.channel;
      }
      if (filters.vendedor_id) {
        whereClause.vendedor_id = filters.vendedor_id;
      }
      if (filters.produto_id) {
        whereClause.produto_id = filters.produto_id;
      }
      if (filters.cliente_id) {
        whereClause.cliente_id = filters.cliente_id;
      }

      // Estatísticas gerais
      const generalStats = await Sale.findAll({
        where: whereClause,
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_sales'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'total_revenue'],
          [Sequelize.fn('SUM', Sequelize.col('valor_custo')), 'total_cost'],
          [Sequelize.fn('SUM', Sequelize.col('lucro')), 'total_profit'],
          [Sequelize.fn('AVG', Sequelize.col('valor_venda')), 'avg_ticket'],
          [Sequelize.fn('AVG', Sequelize.col('margem_percentual')), 'avg_margin']
        ],
        raw: true
      });

      // Vendas por dia
      const dailySales = await Sale.findAll({
        where: whereClause,
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('data_venda')), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'revenue'],
          [Sequelize.fn('SUM', Sequelize.col('lucro')), 'profit']
        ],
        group: [Sequelize.fn('DATE', Sequelize.col('data_venda'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('data_venda')), 'ASC']],
        raw: true
      });

      // Vendas por canal
      const salesByChannel = await Sale.findAll({
        where: whereClause,
        attributes: [
          'canal_venda',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'revenue'],
          [Sequelize.fn('SUM', Sequelize.col('lucro')), 'profit']
        ],
        group: ['canal_venda'],
        order: [[Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'DESC']],
        raw: true
      });

      // Vendas por forma de pagamento
      const salesByPaymentMethod = await Sale.findAll({
        where: whereClause,
        attributes: [
          'forma_pagamento',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'revenue']
        ],
        group: ['forma_pagamento'],
        order: [[Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'DESC']],
        raw: true
      });

      return {
        period: {
          start: startDate,
          end: endDate
        },
        summary: {
          total_sales: parseInt(generalStats[0].total_sales) || 0,
          total_revenue: parseFloat(generalStats[0].total_revenue) || 0,
          total_cost: parseFloat(generalStats[0].total_cost) || 0,
          total_profit: parseFloat(generalStats[0].total_profit) || 0,
          avg_ticket: parseFloat(generalStats[0].avg_ticket) || 0,
          avg_margin: parseFloat(generalStats[0].avg_margin) || 0
        },
        daily_sales: dailySales.map(d => ({
          date: d.date,
          count: parseInt(d.count),
          revenue: parseFloat(d.revenue),
          profit: parseFloat(d.profit)
        })),
        by_channel: salesByChannel.map(c => ({
          channel: c.canal_venda || 'N/A',
          count: parseInt(c.count),
          revenue: parseFloat(c.revenue),
          profit: parseFloat(c.profit)
        })),
        by_payment_method: salesByPaymentMethod.map(p => ({
          method: p.forma_pagamento || 'N/A',
          count: parseInt(p.count),
          revenue: parseFloat(p.revenue)
        }))
      };
    } catch (error) {
      logger.error('Erro ao obter analytics de vendas:', error);
      throw error;
    }
  }

  /**
   * Retorna top produtos mais vendidos
   */
  async getTopProducts(startDate, endDate, limit = 10) {
    try {
      const topProducts = await Sale.findAll({
        where: {
          data_venda: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          'produto_id',
          'produto',
          [Sequelize.fn('COUNT', Sequelize.col('Sale.id')), 'sales_count'],
          [Sequelize.fn('SUM', Sequelize.col('quantidade')), 'total_quantity'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'total_revenue'],
          [Sequelize.fn('SUM', Sequelize.col('lucro')), 'total_profit']
        ],
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['categoria', 'tipo', 'quantidade_estoque'],
          required: false
        }],
        group: ['produto_id', 'produto', 'Product.id'],
        order: [[Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'DESC']],
        limit,
        subQuery: false
      });

      return topProducts.map(p => ({
        produto_id: p.produto_id,
        produto: p.produto,
        categoria: p.Product?.categoria || 'N/A',
        tipo: p.Product?.tipo || 'N/A',
        sales_count: parseInt(p.dataValues.sales_count),
        total_quantity: parseInt(p.dataValues.total_quantity),
        total_revenue: parseFloat(p.dataValues.total_revenue),
        total_profit: parseFloat(p.dataValues.total_profit),
        current_stock: p.Product?.quantidade_estoque || 0
      }));
    } catch (error) {
      logger.error('Erro ao obter top produtos:', error);
      throw error;
    }
  }

  /**
   * Retorna top clientes
   */
  async getTopClients(startDate, endDate, limit = 10) {
    try {
      const topClients = await Sale.findAll({
        where: {
          data_venda: {
            [Op.between]: [startDate, endDate]
          },
          cliente_id: {
            [Op.not]: null
          }
        },
        attributes: [
          'cliente_id',
          'cliente',
          [Sequelize.fn('COUNT', Sequelize.col('Sale.id')), 'purchase_count'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'total_spent'],
          [Sequelize.fn('AVG', Sequelize.col('valor_venda')), 'avg_ticket']
        ],
        include: [{
          model: Client,
          as: 'Client',
          attributes: ['cpf', 'email', 'telefone'],
          required: false
        }],
        group: ['cliente_id', 'cliente', 'Client.id'],
        order: [[Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'DESC']],
        limit,
        subQuery: false
      });

      return topClients.map(c => ({
        cliente_id: c.cliente_id,
        cliente: c.cliente,
        cpf: c.Client?.cpf,
        email: c.Client?.email,
        telefone: c.Client?.telefone,
        purchase_count: parseInt(c.dataValues.purchase_count),
        total_spent: parseFloat(c.dataValues.total_spent),
        avg_ticket: parseFloat(c.dataValues.avg_ticket)
      }));
    } catch (error) {
      logger.error('Erro ao obter top clientes:', error);
      throw error;
    }
  }

  /**
   * Retorna performance de vendedores
   */
  async getSalesmanPerformance(startDate, endDate) {
    try {
      const performance = await Sale.findAll({
        where: {
          data_venda: {
            [Op.between]: [startDate, endDate]
          },
          vendedor_id: {
            [Op.not]: null
          }
        },
        attributes: [
          'vendedor_id',
          'vendedor',
          [Sequelize.fn('COUNT', Sequelize.col('Sale.id')), 'sales_count'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'total_revenue'],
          [Sequelize.fn('SUM', Sequelize.col('lucro')), 'total_profit'],
          [Sequelize.fn('AVG', Sequelize.col('valor_venda')), 'avg_ticket']
        ],
        include: [{
          model: User,
          as: 'Salesman',
          attributes: ['email', 'role'],
          required: false
        }],
        group: ['vendedor_id', 'vendedor', 'Salesman.id'],
        order: [[Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'DESC']],
        subQuery: false
      });

      return performance.map(p => ({
        vendedor_id: p.vendedor_id,
        vendedor: p.vendedor,
        email: p.Salesman?.email,
        role: p.Salesman?.role,
        sales_count: parseInt(p.dataValues.sales_count),
        total_revenue: parseFloat(p.dataValues.total_revenue),
        total_profit: parseFloat(p.dataValues.total_profit),
        avg_ticket: parseFloat(p.dataValues.avg_ticket)
      }));
    } catch (error) {
      logger.error('Erro ao obter performance de vendedores:', error);
      throw error;
    }
  }

  /**
   * Retorna análise de categorias de produtos
   */
  async getCategoryAnalysis(startDate, endDate) {
    try {
      const categoryStats = await Sale.findAll({
        where: {
          data_venda: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['categoria', 'tipo'],
          required: true
        }],
        attributes: [
          [Sequelize.col('Product.categoria'), 'categoria'],
          [Sequelize.fn('COUNT', Sequelize.col('Sale.id')), 'sales_count'],
          [Sequelize.fn('SUM', Sequelize.col('quantidade')), 'total_quantity'],
          [Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'total_revenue'],
          [Sequelize.fn('SUM', Sequelize.col('lucro')), 'total_profit'],
          [Sequelize.fn('AVG', Sequelize.col('margem_percentual')), 'avg_margin']
        ],
        group: ['Product.categoria'],
        order: [[Sequelize.fn('SUM', Sequelize.col('valor_venda')), 'DESC']],
        subQuery: false,
        raw: true
      });

      return categoryStats.map(c => ({
        categoria: c.categoria || 'Sem Categoria',
        sales_count: parseInt(c.sales_count),
        total_quantity: parseInt(c.total_quantity),
        total_revenue: parseFloat(c.total_revenue),
        total_profit: parseFloat(c.total_profit),
        avg_margin: parseFloat(c.avg_margin)
      }));
    } catch (error) {
      logger.error('Erro ao obter análise de categorias:', error);
      throw error;
    }
  }

  /**
   * Retorna comparação entre períodos
   */
  async getPeriodComparison(currentStart, currentEnd, previousStart, previousEnd) {
    try {
      const [currentPeriod, previousPeriod] = await Promise.all([
        this.getSalesAnalytics(currentStart, currentEnd),
        this.getSalesAnalytics(previousStart, previousEnd)
      ]);

      const calculateGrowth = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        current: currentPeriod.summary,
        previous: previousPeriod.summary,
        growth: {
          revenue: calculateGrowth(
            currentPeriod.summary.total_revenue,
            previousPeriod.summary.total_revenue
          ),
          profit: calculateGrowth(
            currentPeriod.summary.total_profit,
            previousPeriod.summary.total_profit
          ),
          sales: calculateGrowth(
            currentPeriod.summary.total_sales,
            previousPeriod.summary.total_sales
          ),
          avg_ticket: calculateGrowth(
            currentPeriod.summary.avg_ticket,
            previousPeriod.summary.avg_ticket
          )
        }
      };
    } catch (error) {
      logger.error('Erro ao comparar períodos:', error);
      throw error;
    }
  }

  /**
   * Retorna dashboard completo
   */
  async getDashboard(startDate, endDate, filters = {}) {
    try {
      const [
        salesAnalytics,
        topProducts,
        topClients,
        salesmanPerformance,
        categoryAnalysis
      ] = await Promise.all([
        this.getSalesAnalytics(startDate, endDate, filters),
        this.getTopProducts(startDate, endDate, 5),
        this.getTopClients(startDate, endDate, 5),
        this.getSalesmanPerformance(startDate, endDate),
        this.getCategoryAnalysis(startDate, endDate)
      ]);

      return {
        period: salesAnalytics.period,
        summary: salesAnalytics.summary,
        charts: {
          daily_sales: salesAnalytics.daily_sales,
          by_channel: salesAnalytics.by_channel,
          by_payment_method: salesAnalytics.by_payment_method,
          by_category: categoryAnalysis
        },
        rankings: {
          top_products: topProducts,
          top_clients: topClients,
          salesman_performance: salesmanPerformance
        }
      };
    } catch (error) {
      logger.error('Erro ao gerar dashboard:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
