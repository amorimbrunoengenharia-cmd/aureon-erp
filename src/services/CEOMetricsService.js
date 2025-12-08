/**
 * CEO METRICS SERVICE
 * Serviço centralizado para cálculo e agregação de métricas do CEO Dashboard
 * Atualização em tempo real via EventBus
 */

import eventBus from './EventBus';
import { EVENTS } from './EventTypes';
import eventLogger from './EventLogger';

class CEOMetricsService {
  constructor() {
    this.metrics = this.loadMetrics();
    this.listeners = [];
    this.setupEventListeners();
  }

  /**
   * Carregar métricas do localStorage
   */
  loadMetrics() {
    try {
      const stored = localStorage.getItem('aureon_ceo_metrics');
      return stored ? JSON.parse(stored) : this.getDefaultMetrics();
    } catch (error) {
      eventLogger.error('Erro ao carregar métricas CEO', { error: error.message });
      return this.getDefaultMetrics();
    }
  }

  /**
   * Métricas padrão
   */
  getDefaultMetrics() {
    return {
      sales: {
        total: 0,
        count: 0,
        averageTicket: 0,
        growth: 0,
        todayTotal: 0,
        monthTotal: 0
      },
      inventory: {
        totalValue: 0,
        itemsCount: 0,
        lowStock: 0,
        outOfStock: 0,
        turnoverRate: 0
      },
      finance: {
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0,
        receivables: 0,
        payables: 0,
        cashflow: 0
      },
      customers: {
        total: 0,
        active: 0,
        new: 0,
        retention: 0
      },
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Configurar listeners de eventos
   */
  setupEventListeners() {
    // Vendas
    eventBus.on(EVENTS.SALES.ORDER_CREATED, (event) => this.handleSaleCreated(event));
    eventBus.on(EVENTS.SALES.ORDER_PAID, (event) => this.handleSalePaid(event));
    eventBus.on(EVENTS.SALES.ORDER_CANCELLED, (event) => this.handleSaleCancelled(event));

    // Estoque
    eventBus.on(EVENTS.INVENTORY.STOCK_ADJUSTED, (event) => this.handleStockAdjusted(event));
    eventBus.on(EVENTS.INVENTORY.ALERT_LOW_STOCK, (event) => this.handleLowStock(event));
    eventBus.on(EVENTS.INVENTORY.ALERT_OUT_OF_STOCK, (event) => this.handleOutOfStock(event));

    // Financeiro
    eventBus.on(EVENTS.FINANCE.PAYMENT_RECEIVED, (event) => this.handlePaymentReceived(event));
    eventBus.on(EVENTS.FINANCE.EXPENSE_CREATED, (event) => this.handleExpenseCreated(event));
    eventBus.on(EVENTS.FINANCE.RECEIVABLE_CREATED, (event) => this.handleReceivableCreated(event));

    if (import.meta.env.DEV) {
      eventLogger.debug('CEOMetricsService: Event listeners configurados (9 eventos)');
    }
  }

  /**
   * Handler: Venda criada
   */
  handleSaleCreated(event) {
    const { payload, metadata } = event;
    
    this.metrics.sales.count += 1;
    
    eventLogger.debug('Métrica atualizada: venda criada', {
      trace_id: metadata.trace_id,
      sale_id: payload.id,
      total_sales: this.metrics.sales.count
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Venda paga
   */
  handleSalePaid(event) {
    const { payload, metadata } = event;
    const amount = payload.valorTotal || 0;
    
    this.metrics.sales.total += amount;
    this.metrics.sales.todayTotal += amount;
    this.metrics.sales.monthTotal += amount;
    this.metrics.sales.averageTicket = this.metrics.sales.count > 0 
      ? this.metrics.sales.total / this.metrics.sales.count 
      : 0;

    this.metrics.finance.revenue += amount;
    this.recalculateFinance();

    eventLogger.debug('Métrica atualizada: venda paga', {
      trace_id: metadata.trace_id,
      amount,
      total_revenue: this.metrics.sales.total
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Venda cancelada
   */
  handleSaleCancelled(event) {
    const { payload, metadata } = event;
    const amount = payload.valorTotal || 0;
    
    this.metrics.sales.count = Math.max(0, this.metrics.sales.count - 1);
    this.metrics.sales.total = Math.max(0, this.metrics.sales.total - amount);
    this.metrics.sales.averageTicket = this.metrics.sales.count > 0 
      ? this.metrics.sales.total / this.metrics.sales.count 
      : 0;

    this.metrics.finance.revenue = Math.max(0, this.metrics.finance.revenue - amount);
    this.recalculateFinance();

    eventLogger.debug('Métrica atualizada: venda cancelada', {
      trace_id: metadata.trace_id,
      amount
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Estoque ajustado
   */
  handleStockAdjusted(event) {
    const { metadata } = event;
    
    // Recalcular do zero baseado no localStorage
    this.recalculateInventoryMetrics();

    eventLogger.debug('Métrica atualizada: estoque ajustado', {
      trace_id: metadata.trace_id
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Estoque baixo
   */
  handleLowStock(event) {
    const { metadata } = event;
    
    this.metrics.inventory.lowStock += 1;

    eventLogger.warn('Alerta: estoque baixo', {
      trace_id: metadata.trace_id,
      total_low_stock: this.metrics.inventory.lowStock
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Sem estoque
   */
  handleOutOfStock(event) {
    const { metadata } = event;
    
    this.metrics.inventory.outOfStock += 1;

    eventLogger.error('Alerta: sem estoque', {
      trace_id: metadata.trace_id,
      total_out_of_stock: this.metrics.inventory.outOfStock
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Pagamento recebido
   */
  handlePaymentReceived(event) {
    const { payload, metadata } = event;
    const amount = payload.valor || 0;
    
    this.metrics.finance.cashflow += amount;

    eventLogger.debug('Métrica atualizada: pagamento recebido', {
      trace_id: metadata.trace_id,
      amount,
      cashflow: this.metrics.finance.cashflow
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Despesa criada
   */
  handleExpenseCreated(event) {
    const { payload, metadata } = event;
    const amount = payload.valor || 0;
    
    this.metrics.finance.expenses += amount;
    this.recalculateFinance();

    eventLogger.debug('Métrica atualizada: despesa criada', {
      trace_id: metadata.trace_id,
      amount,
      total_expenses: this.metrics.finance.expenses
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Handler: Conta a receber criada
   */
  handleReceivableCreated(event) {
    const { payload, metadata } = event;
    const amount = payload.valor || 0;
    
    this.metrics.finance.receivables += amount;

    eventLogger.debug('Métrica atualizada: conta a receber', {
      trace_id: metadata.trace_id,
      amount,
      total_receivables: this.metrics.finance.receivables
    });

    this.saveAndNotify(metadata.trace_id);
  }

  /**
   * Recalcular métricas financeiras
   */
  recalculateFinance() {
    this.metrics.finance.profit = this.metrics.finance.revenue - this.metrics.finance.expenses;
    this.metrics.finance.profitMargin = this.metrics.finance.revenue > 0
      ? (this.metrics.finance.profit / this.metrics.finance.revenue) * 100
      : 0;
  }

  /**
   * Recalcular métricas de estoque do zero
   */
  recalculateInventoryMetrics() {
    try {
      const itensEstoque = JSON.parse(localStorage.getItem('aureon_itensEstoque') || '[]');
      
      this.metrics.inventory.itemsCount = itensEstoque.length;
      this.metrics.inventory.totalValue = itensEstoque.reduce((sum, item) => {
        return sum + (item.quantidade * item.custoUnitario);
      }, 0);

      this.metrics.inventory.lowStock = itensEstoque.filter(item => {
        const estoque = item.quantidade || 0;
        const minimo = item.estoqueMinimo || 0;
        return estoque > 0 && estoque <= minimo;
      }).length;

      this.metrics.inventory.outOfStock = itensEstoque.filter(item => {
        return (item.quantidade || 0) === 0;
      }).length;

    } catch (error) {
      eventLogger.error('Erro ao recalcular métricas de estoque', { error: error.message });
    }
  }

  /**
   * Recalcular todas as métricas do zero
   */
  recalculateAll() {
    if (import.meta.env.DEV) {
      eventLogger.debug('Recalculando métricas CEO...');
    }

    try {
      // Vendas
      const vendas = JSON.parse(localStorage.getItem('aureon_vendas') || '[]');
      const vendasPagas = vendas.filter(v => v.status === 'pago');
      
      this.metrics.sales.count = vendasPagas.length;
      this.metrics.sales.total = vendasPagas.reduce((sum, v) => sum + (v.valorTotal || 0), 0);
      this.metrics.sales.averageTicket = this.metrics.sales.count > 0
        ? this.metrics.sales.total / this.metrics.sales.count
        : 0;

      // Vendas hoje
      const hoje = new Date().toISOString().split('T')[0];
      this.metrics.sales.todayTotal = vendasPagas
        .filter(v => v.data?.startsWith(hoje))
        .reduce((sum, v) => sum + (v.valorTotal || 0), 0);

      // Estoque
      this.recalculateInventoryMetrics();

      // Financeiro
      const despesas = JSON.parse(localStorage.getItem('aureon_despesas') || '[]');
      const contasReceber = JSON.parse(localStorage.getItem('aureon_contasReceber') || '[]');

      this.metrics.finance.revenue = this.metrics.sales.total;
      this.metrics.finance.expenses = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
      this.metrics.finance.receivables = contasReceber
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + (c.valor || 0), 0);

      this.recalculateFinance();

      // Clientes
      const clientes = JSON.parse(localStorage.getItem('aureon_clientes') || '[]');
      this.metrics.customers.total = clientes.length;

      this.metrics.lastUpdate = new Date().toISOString();

      this.saveAndNotify();

      if (import.meta.env.DEV) {
        eventLogger.debug('Métricas CEO recalculadas', {
          sales: this.metrics.sales.count,
          inventory: this.metrics.inventory.itemsCount,
          revenue: this.metrics.finance.revenue
        });
      }

    } catch (error) {
      eventLogger.error('Erro ao recalcular métricas', { error: error.message });
    }
  }

  /**
   * Salvar métricas e notificar listeners
   */
  saveAndNotify(trace_id = null) {
    this.metrics.lastUpdate = new Date().toISOString();

    try {
      localStorage.setItem('aureon_ceo_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      eventLogger.error('Erro ao salvar métricas CEO', { error: error.message });
    }

    // Notificar todos os listeners
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics, trace_id);
      } catch (error) {
        eventLogger.error('Erro ao notificar listener de métricas', { 
          error: error.message,
          trace_id 
        });
      }
    });
  }

  /**
   * Registrar listener para mudanças nas métricas
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Enviar métricas atuais imediatamente
    callback(this.metrics);

    // Retornar função de unsubscribe
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Obter métricas atuais
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Resetar métricas (útil para testes)
   */
  reset() {
    this.metrics = this.getDefaultMetrics();
    this.saveAndNotify();
    eventLogger.warn('Métricas CEO resetadas');
  }
}

// Singleton
const ceoMetricsService = new CEOMetricsService();

// Recalcular métricas na inicialização
ceoMetricsService.recalculateAll();

export default ceoMetricsService;
