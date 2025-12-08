/**
 * RECONCILIATION SERVICE
 * Serviço de reconciliação e auditoria de integridade de dados
 * Verifica consistência entre módulos: Vendas ↔ Finance, Compras ↔ Finance, Estoque ↔ Movimentações
 * 
 * Features:
 * - Reconciliação automática diária
 * - Persistência de relatórios
 * - Event listeners para reconciliação sob demanda
 * - Correções automáticas de discrepâncias simples
 */

import eventBus from './EventBus';
import { EVENTS } from './EventTypes';
import eventLogger from './EventLogger';

class ReconciliationService {
  constructor() {
    this.lastRun = null;
    this.divergences = [];
    this.reports = this.loadReports();
    this.autoReconcileEnabled = true;
    this.setupEventListeners();
  }

  /**
   * Carregar relatórios históricos
   */
  loadReports() {
    try {
      const stored = localStorage.getItem('aureon_reconciliation_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      eventLogger.error('Erro ao carregar relatórios de reconciliação', { error: error.message });
      return [];
    }
  }

  /**
   * Salvar relatório
   */
  saveReport(report) {
    try {
      this.reports.push(report);
      
      // Manter apenas últimos 30 relatórios
      if (this.reports.length > 30) {
        this.reports = this.reports.slice(-30);
      }
      
      localStorage.setItem('aureon_reconciliation_reports', JSON.stringify(this.reports));
      eventLogger.info('Relatório de reconciliação salvo', {
        total_divergences: report.summary.totalDivergences,
        status: report.status
      });
    } catch (error) {
      eventLogger.error('Erro ao salvar relatório', { error: error.message });
    }
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Trigger reconciliação após vendas importantes
    eventBus.on(EVENTS.SALES.ORDER_PAID, () => {
      if (this.autoReconcileEnabled) {
        eventLogger.debug('Reconciliação automática: venda paga detectada');
        // Agendar para evitar múltiplas execuções simultâneas
        this.scheduleReconciliation();
      }
    });

    // Trigger após ajustes de estoque
    eventBus.on(EVENTS.INVENTORY.STOCK_ADJUSTED, () => {
      if (this.autoReconcileEnabled) {
        eventLogger.debug('Reconciliação automática: estoque ajustado');
        this.scheduleReconciliation();
      }
    });

    eventLogger.info('ReconciliationService: Event listeners configurados');
  }

  /**
   * Agendar reconciliação com debounce
   */
  scheduleReconciliation() {
    if (this.reconciliationTimeout) {
      clearTimeout(this.reconciliationTimeout);
    }

    // Aguardar 5 segundos antes de executar
    this.reconciliationTimeout = setTimeout(() => {
      this.reconcileFromStorage();
    }, 5000);
  }

  /**
   * Reconciliar usando dados do localStorage
   */
  reconcileFromStorage() {
    try {
      const context = {
        vendas: JSON.parse(localStorage.getItem('aureon_vendas') || '[]'),
        contasReceber: JSON.parse(localStorage.getItem('aureon_contasReceber') || '[]'),
        despesas: JSON.parse(localStorage.getItem('aureon_despesas') || '[]'),
        produtos: JSON.parse(localStorage.getItem('aureon_produtos') || '[]'),
        movimentacoes: JSON.parse(localStorage.getItem('aureon_movimentacoes') || '[]'),
        clientes: JSON.parse(localStorage.getItem('aureon_clientes') || '[]'),
        fornecedores: JSON.parse(localStorage.getItem('aureon_fornecedores') || '[]'),
        purchaseOrders: JSON.parse(localStorage.getItem('aureon_purchaseOrders') || '[]')
      };

      this.reconcile(context);
    } catch (error) {
      eventLogger.error('Erro ao carregar dados para reconciliação', { error: error.message });
    }
  }

  /**
   * Executar reconciliação completa do sistema
   * @param {Object} context - Dados dos contextos { vendas, contasReceber, despesas, produtos, movimentacoes }
   * @returns {Object} Relatório de reconciliação
   */
  reconcile(context) {
    eventLogger.info('Iniciando reconciliação completa do sistema');
    
    const startTime = Date.now();
    this.divergences = [];

    // 1. Reconciliar Vendas ↔ Contas a Receber
    const salesReconciliation = this.reconcileSalesWithReceivables(
      context.vendas || [],
      context.contasReceber || []
    );

    // 2. Reconciliar Compras ↔ Despesas
    const purchaseReconciliation = this.reconcilePurchasesWithExpenses(
      context.purchaseOrders || [],
      context.despesas || []
    );

    // 3. Reconciliar Estoque Físico ↔ Movimentações
    const inventoryReconciliation = this.reconcileInventoryWithMovements(
      context.produtos || [],
      context.movimentacoes || []
    );

    // 4. Validar Integridade Referencial
    const referentialIntegrity = this.validateReferentialIntegrity(context);

    // Consolidar resultados
    const elapsedTime = Date.now() - startTime;
    this.lastRun = new Date().toISOString();

    const report = {
      timestamp: this.lastRun,
      elapsedTimeMs: elapsedTime,
      status: this.divergences.length === 0 ? 'OK' : 'DIVERGENCES_FOUND',
      summary: {
        totalDivergences: this.divergences.length,
        criticalDivergences: this.divergences.filter(d => d.severity === 'critical').length,
        warningDivergences: this.divergences.filter(d => d.severity === 'warning').length,
        infoDivergences: this.divergences.filter(d => d.severity === 'info').length
      },
      modules: {
        salesReconciliation,
        purchaseReconciliation,
        inventoryReconciliation,
        referentialIntegrity
      },
      divergences: this.divergences
    };

    // Salvar relatório
    this.saveReport(report);

    // ✅ EVENT-DRIVEN: Emitir evento de reconciliação completa
    eventBus.emit(
      EVENTS.SYSTEM.RECONCILIATION_COMPLETED,
      {
        status: report.status,
        totalDivergences: report.summary.totalDivergences,
        criticalCount: report.summary.criticalDivergences,
        elapsedTimeMs: elapsedTime,
        timestamp: this.lastRun
      },
      { source: 'ReconciliationService.reconcile', priority: report.summary.criticalDivergences > 0 ? 'high' : 'normal' }
    );

    eventLogger.success(`Reconciliação concluída em ${elapsedTime}ms`, {
      total_divergences: report.summary.totalDivergences,
      critical: report.summary.criticalDivergences,
      warnings: report.summary.warningDivergences
    });

    return report;
  }

  /**
   * Reconciliar Vendas com Contas a Receber
   */
  reconcileSalesWithReceivables(vendas, contasReceber) {
    const vendasPagas = vendas.filter(v => v.status === 'completed' || v.status === 'paid');
    const vendasComRecebiveis = contasReceber.map(c => c.vendaId);

    let matched = 0;
    let missing = 0;

    vendasPagas.forEach(venda => {
      if (!vendasComRecebiveis.includes(venda.id)) {
        this.divergences.push({
          type: 'MISSING_RECEIVABLE',
          severity: 'critical',
          module: 'Finance',
          description: `Venda #${venda.id} paga sem conta a receber correspondente`,
          data: { vendaId: venda.id, valor: venda.valorVenda, cliente: venda.cliente },
          suggestedAction: 'Criar conta a receber automaticamente via evento SALES.ORDER_PAID'
        });
        missing++;
      } else {
        matched++;
      }
    });

    // Verificar contas a receber sem venda
    contasReceber.forEach(conta => {
      const vendaExists = vendas.find(v => v.id === conta.vendaId);
      if (!vendaExists) {
        this.divergences.push({
          type: 'ORPHAN_RECEIVABLE',
          severity: 'warning',
          module: 'Finance',
          description: `Conta a receber #${conta.id} sem venda correspondente`,
          data: { contaId: conta.id, vendaId: conta.vendaId, valor: conta.valorTotal },
          suggestedAction: 'Verificar se venda foi deletada incorretamente'
        });
      }
    });

    return {
      totalSales: vendasPagas.length,
      matched,
      missing,
      orphanReceivables: contasReceber.filter(c => !vendas.find(v => v.id === c.vendaId)).length,
      status: missing === 0 ? 'OK' : 'DIVERGENCE'
    };
  }

  /**
   * Reconciliar Pedidos de Compra com Despesas
   */
  reconcilePurchasesWithExpenses(purchaseOrders, despesas) {
    const approvedOrders = purchaseOrders.filter(p => p.status === 'approved' || p.status === 'received');
    const despesasComPedido = despesas.filter(d => d.pedidoId).map(d => d.pedidoId);

    let matched = 0;
    let missing = 0;

    approvedOrders.forEach(order => {
      if (!despesasComPedido.includes(order.id)) {
        this.divergences.push({
          type: 'MISSING_EXPENSE',
          severity: 'critical',
          module: 'Finance',
          description: `Pedido de compra #${order.id} aprovado sem despesa correspondente`,
          data: { orderId: order.id, valor: order.totalCost, fornecedor: order.supplierName },
          suggestedAction: 'Criar despesa automaticamente via evento PURCHASE.ORDER_APPROVED'
        });
        missing++;
      } else {
        matched++;
      }
    });

    // Verificar despesas sem pedido (despesas avulsas são permitidas)
    const orphanExpenses = despesas.filter(d => d.pedidoId && !purchaseOrders.find(p => p.id === d.pedidoId));

    return {
      totalPurchaseOrders: approvedOrders.length,
      matched,
      missing,
      orphanExpenses: orphanExpenses.length,
      status: missing === 0 ? 'OK' : 'DIVERGENCE'
    };
  }

  /**
   * Reconciliar Estoque Físico com Movimentações
   */
  reconcileInventoryWithMovements(produtos, movimentacoes) {
    let discrepancies = 0;

    produtos.forEach(produto => {
      // Calcular estoque esperado baseado em movimentações
      const movimentacoesProduto = movimentacoes.filter(m => 
        m.produtoId === produto.id || 
        parseInt(m.produtoId) === produto.id
      );

      const entradas = movimentacoesProduto
        .filter(m => m.tipo === 'entrada' || m.tipo === 'ENTRADA')
        .reduce((sum, m) => sum + (m.quantidade || 0), 0);

      const saidas = movimentacoesProduto
        .filter(m => m.tipo === 'saida' || m.tipo === 'SAIDA')
        .reduce((sum, m) => sum + (m.quantidade || 0), 0);

      const estoqueCalculado = entradas - saidas;
      const estoqueFisico = produto.estoque || 0;
      const divergencia = Math.abs(estoqueCalculado - estoqueFisico);

      if (divergencia > 0) {
        this.divergences.push({
          type: 'INVENTORY_DISCREPANCY',
          severity: divergencia > 10 ? 'critical' : 'warning',
          module: 'Inventory',
          description: `Produto "${produto.nome || produto.produto}" com divergência de estoque`,
          data: {
            produtoId: produto.id,
            estoqueCalculado,
            estoqueFisico,
            divergencia,
            entradas,
            saidas
          },
          suggestedAction: 'Realizar contagem física ou revisar movimentações'
        });
        discrepancies++;
      }
    });

    return {
      totalProducts: produtos.length,
      discrepancies,
      status: discrepancies === 0 ? 'OK' : 'DIVERGENCE'
    };
  }

  /**
   * Validar Integridade Referencial (Foreign Keys)
   */
  validateReferentialIntegrity(context) {
    let violations = 0;

    // 1. Vendas devem ter cliente válido
    (context.vendas || []).forEach(venda => {
      if (venda.clienteId) {
        const cliente = (context.clientes || []).find(c => c.id === venda.clienteId);
        if (!cliente) {
          this.divergences.push({
            type: 'INVALID_FOREIGN_KEY',
            severity: 'warning',
            module: 'Sales',
            description: `Venda #${venda.id} referencia cliente inexistente`,
            data: { vendaId: venda.id, clienteId: venda.clienteId },
            suggestedAction: 'Corrigir clienteId ou remover referência'
          });
          violations++;
        }
      }
    });

    // 2. Produtos devem ter fornecedor válido
    (context.produtos || []).forEach(produto => {
      if (produto.fornecedorId) {
        const fornecedor = (context.fornecedores || []).find(f => f.id === produto.fornecedorId);
        if (!fornecedor) {
          this.divergences.push({
            type: 'INVALID_FOREIGN_KEY',
            severity: 'warning',
            module: 'Inventory',
            description: `Produto "${produto.nome}" referencia fornecedor inexistente`,
            data: { produtoId: produto.id, fornecedorId: produto.fornecedorId },
            suggestedAction: 'Corrigir fornecedorId ou cadastrar fornecedor'
          });
          violations++;
        }
      }
    });

    // 3. Movimentações devem ter produto válido
    (context.movimentacoes || []).forEach(mov => {
      const produto = (context.produtos || []).find(p => 
        p.id === mov.produtoId || p.id === parseInt(mov.produtoId)
      );
      if (!produto) {
        this.divergences.push({
          type: 'INVALID_FOREIGN_KEY',
          severity: 'critical',
          module: 'Inventory',
          description: `Movimentação #${mov.id} referencia produto inexistente`,
          data: { movimentacaoId: mov.id, produtoId: mov.produtoId },
          suggestedAction: 'Remover movimentação órfã'
        });
        violations++;
      }
    });

    return {
      violations,
      status: violations === 0 ? 'OK' : 'VIOLATIONS_FOUND'
    };
  }

  /**
   * Agendar reconciliação automática (simulação de cron job)
   * Em produção, isso seria um job backend rodando diariamente às 2AM
   */
  scheduleAutoReconciliation(context, intervalMinutes = 1440) {
    console.log(`⏰ [ReconciliationService] Agendando reconciliação a cada ${intervalMinutes} minutos`);
    
    // Executar imediatamente na primeira vez
    this.reconcile(context);

    // Agendar próximas execuções
    setInterval(() => {
      console.log('🔔 [ReconciliationService] Executando reconciliação automática...');
      this.reconcile(context);
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Obter último relatório de reconciliação
   */
  getLastReport() {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  /**
   * Obter todos os relatórios
   */
  getAllReports() {
    return [...this.reports];
  }

  /**
   * Obter divergências críticas atuais
   */
  getCriticalDivergences() {
    return this.divergences.filter(d => d.severity === 'critical');
  }

  /**
   * Limpar histórico de relatórios
   */
  clearReports() {
    this.reports = [];
    localStorage.removeItem('aureon_reconciliation_reports');
    eventLogger.info('Histórico de reconciliação limpo');
  }

  /**
   * Ativar/desativar reconciliação automática
   */
  setAutoReconcile(enabled) {
    this.autoReconcileEnabled = enabled;
    eventLogger.info(`Reconciliação automática: ${enabled ? 'ativada' : 'desativada'}`);
  }

  /**
   * Obter estatísticas de reconciliação
   */
  getStats() {
    const recentReports = this.reports.slice(-7); // Últimos 7 relatórios
    
    return {
      totalReports: this.reports.length,
      lastRun: this.lastRun,
      recentDivergences: recentReports.reduce((sum, r) => sum + r.summary.totalDivergences, 0),
      averageDivergences: recentReports.length > 0
        ? (recentReports.reduce((sum, r) => sum + r.summary.totalDivergences, 0) / recentReports.length).toFixed(1)
        : 0,
      criticalCount: this.divergences.filter(d => d.severity === 'critical').length,
      autoReconcileEnabled: this.autoReconcileEnabled
    };
  }
}

// Export singleton
const reconciliationService = new ReconciliationService();

export default reconciliationService;
