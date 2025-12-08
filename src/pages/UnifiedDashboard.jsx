import React, { useContext, useMemo, useState, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import { useFinance } from '../context/FinanceContext';
import { useSimulation } from '../context/SimulationContext';
import { LayoutDashboard, Briefcase, TrendingUp, TrendingDown, AlertTriangle, Target, Package, ShoppingCart, DollarSign, AlertCircle, CheckCircle, ArrowUp, ArrowDown, Award, Users, Radio, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { parseDataBR } from '../utils/dateUtils';
import { agruparVendasPorPeriodo } from '../utils/chartHelpers';
import SimulationControlPanel from '../components/SimulationControlPanel';
import BusinessLogic from '../services/BusinessLogicService';
import eventBus from '../services/EventBus';
import { EVENTS } from '../services/EventTypes';
import useCEOMetrics from '../hooks/useCEOMetrics';
import { generateBusinessInsights } from '../services/OpenAIService';
import AIInsightsPanel from '../components/AIInsightsPanel';

/**
 * Dashboard Unificado - Visão Geral + Executiva
 * Combina métricas operacionais com análises estratégicas CEO-level
 * ✅ Inclui Simulation Control Panel quando modo simulação está ativo
 */
export default function UnifiedDashboard() {
  const { vendas = [], produtos = [], metasPorCanal = {}, clientes = [], devolucoes = [], fornecedores = [] } = useContext(DataContext);
  const { despesas = [], contasReceber = [], contasBancarias = [] } = useFinance();
  const { isSimulationMode } = useSimulation();
  const [periodoVendas, setPeriodoVendas] = useState('mensal'); // 'diario' | 'semanal' | 'mensal'
  const [aiInsights, setAiInsights] = useState('Carregando insights...');
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  // ✅ CEO Metrics em tempo real
  const { metrics: ceoMetrics, loading: metricsLoading, lastUpdate, refresh: refreshMetrics } = useCEOMetrics();
  
  // ✅ REAL-TIME UPDATES: Estado para indicador "Live" e notificações
  const [liveUpdates, setLiveUpdates] = useState({
    lastEvent: null,
    eventCount: 0,
    isActive: true,
    lastTimestamp: null
  });
  
  // Dados de vendas agrupados por período
  const vendasPorPeriodo = useMemo(() => 
    agruparVendasPorPeriodo(vendas, periodoVendas), 
    [vendas, periodoVendas]
  );

  // ============================================
  // ✅ REAL-TIME EVENT LISTENERS - Atualização automática do Dashboard
  // ============================================
  
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('📊 [UnifiedDashboard] Configurando listeners...');
    }
    
    // Handler genérico para qualquer evento
    const handleEvent = (event) => {
      setLiveUpdates(prev => ({
        lastEvent: event.type,
        eventCount: prev.eventCount + 1,
        isActive: true,
        lastTimestamp: new Date().toISOString()
      }));
      
      if (import.meta.env.DEV) {
        console.log(`🔔 [Dashboard] Evento: ${event.type}`);
      }
      
      // Dashboard é reativo aos contextos, então não precisa atualizar manualmente
      // O React já vai re-renderizar quando vendas, despesas, etc mudarem
    };
    
    // Registrar listeners para eventos críticos
    const eventsToListen = [
      EVENTS.SALES.ORDER_CREATED,
      EVENTS.SALES.ORDER_PAID,
      EVENTS.SALES.ORDER_CANCELLED,
      EVENTS.FINANCE.RECEIVABLE_CREATED,
      EVENTS.FINANCE.EXPENSE_CREATED,
      EVENTS.FINANCE.PAYMENT_RECEIVED,
      EVENTS.FINANCE.PAYMENT_MADE,
      EVENTS.INVENTORY.STOCK_RECEIVED,
      EVENTS.INVENTORY.STOCK_SHIPPED,
      EVENTS.INVENTORY.ALERT_LOW_STOCK,
      EVENTS.PURCHASE.ORDER_CREATED,
      EVENTS.PURCHASE.ORDER_APPROVED,
      EVENTS.PURCHASE.ORDER_RECEIVED,
      EVENTS.SYSTEM.RECONCILIATION_COMPLETED
    ];
    
    eventsToListen.forEach(eventType => {
      eventBus.on(eventType, handleEvent);
    });
    
    if (import.meta.env.DEV) {
      console.log('✅ [UnifiedDashboard] Listeners registrados:', eventsToListen.length);
    }
    
    // Cleanup na desmontagem
    return () => {
      eventsToListen.forEach(eventType => {
        eventBus.off(eventType, handleEvent);
      });
      if (import.meta.env.DEV) {
        console.log('🔌 [UnifiedDashboard] Listeners desconectados');
      }
    };
  }, []); // Executar apenas uma vez no mount

  // ✅ CARREGAR INSIGHTS DE IA
  useEffect(() => {
    const loadAIInsights = async () => {
      if (metricsLoading || !ceoMetrics) return;
      
      setLoadingInsights(true);
      try {
        const insights = await generateBusinessInsights(ceoMetrics);
        setAiInsights(insights);
      } catch (error) {
        console.error('Erro ao carregar insights:', error);
        setAiInsights('Não foi possível carregar insights no momento.');
      } finally {
        setLoadingInsights(false);
      }
    };

    // Carregar insights quando métricas mudarem
    if (ceoMetrics && !metricsLoading) {
      loadAIInsights();
    }
  }, [ceoMetrics, metricsLoading]);

  // ===== CÁLCULOS COMPARTILHADOS =====
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Vendas do mês atual e anterior
  const { vendasMesAtual, vendasMesPassado } = useMemo(() => {
    const mesPassado = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesPassado = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const mesAtu = (vendas || []).filter(v => {
      if (!v.data) return false;
      const [dia, mes, ano] = v.data.split('/');
      return parseInt(mes) - 1 === mesAtual && parseInt(ano) === anoAtual;
    });

    const mesPass = (vendas || []).filter(v => {
      if (!v.data) return false;
      const [dia, mes, ano] = v.data.split('/');
      return parseInt(mes) - 1 === mesPassado && parseInt(ano) === anoMesPassado;
    });

    return { vendasMesAtual: mesAtu, vendasMesPassado: mesPass };
  }, [vendas, mesAtual, anoAtual]);

  const receitaMesAtual = vendasMesAtual.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const receitaMesPassado = vendasMesPassado.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const lucroMesAtual = vendasMesAtual.reduce((acc, v) => acc + (v.lucro || 0), 0);
  const crescimentoMoM = receitaMesPassado > 0 ? (((receitaMesAtual - receitaMesPassado) / receitaMesPassado) * 100).toFixed(1) : 0;

  const totalVendas = vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const totalLucro = vendas.reduce((acc, v) => acc + (v.lucro || 0), 0);
  const totalEstoque = produtos.reduce((acc, p) => acc + (p.estoque || 0), 0);
  const margemMedia = totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0;
  const ticketMedio = vendas.length > 0 ? (totalVendas / vendas.length) : 0;

  // Análise de clientes ativos/inativos - USANDO RFM COMPLETO
  const analiseClientes = useMemo(() => {
    // ✅ FIX: Implementar RFM completo (Recência, Frequência, Monetário)
    const clientesComRFM = BusinessLogic.calcularRFMClientes(clientes, vendas);
    
    const vip = clientesComRFM.filter(c => c.segmento === 'VIP');
    const ativos = clientesComRFM.filter(c => c.segmento === 'ATIVO');
    const regulares = clientesComRFM.filter(c => c.segmento === 'REGULAR');
    const novos = clientesComRFM.filter(c => c.segmento === 'NOVO');
    const dormindo = clientesComRFM.filter(c => c.segmento === 'DORMINDO');
    
    return { 
      ativos: [...vip, ...ativos], 
      inativos: dormindo, 
      total: clientes.length,
      vip,
      regulares,
      novos,
      clientesComRFM // Dados completos para detalhamento
    };
  }, [clientes, vendas]);

  // Meta consolidada
  const metaTotal = Object.values(metasPorCanal || {}).reduce((acc, meta) => acc + (meta || 0), 0) || 50000;
  const atingimentoMeta = metaTotal > 0 ? ((receitaMesAtual / metaTotal) * 100).toFixed(1) : 0;

  // Vendas por mês (últimos 6 meses)
  const vendasPorMes = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dados = [];
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = meses[data.getMonth()];
      const vendasMes = vendas.filter(v => {
        if (!v.data) return false;
        const [dia, mesV, ano] = v.data.split('/');
        return parseInt(mesV) - 1 === data.getMonth() && parseInt(ano) === data.getFullYear();
      });
      
      dados.push({
        month: mes,
        vendas: vendasMes.reduce((acc, v) => acc + (v.valorVenda || 0), 0),
        margem: vendasMes.reduce((acc, v) => acc + (v.lucro || 0), 0)
      });
    }
    return dados;
  }, [vendas]);

  // Vendas por canal
  const vendasPorCanal = useMemo(() => {
    const porCanal = {};
    vendas.forEach(v => {
      const canal = v.canal || 'Outros';
      porCanal[canal] = (porCanal[canal] || 0) + (v.valorVenda || 0);
    });
    
    const total = Object.values(porCanal).reduce((acc, val) => acc + val, 0);
    return Object.entries(porCanal).map(([name, valor]) => ({
      name,
      valor,
      percentual: total > 0 ? ((valor / total) * 100).toFixed(1) : 0
    }));
  }, [vendas]);

  // Análise de fornecedores para CEO
  const analiseFornecedores = useMemo(() => {
    const totalFornecedores = fornecedores.length;
    const itensDisponiveis = fornecedores.reduce((acc, f) => acc + (f.itens?.length || 0), 0);
    const produtosVinculados = produtos.filter(p => p.fornecedorId).length;
    
    return { totalFornecedores, itensDisponiveis, produtosVinculados };
  }, [fornecedores, produtos]);

  // ROI e eficiência operacional - USANDO BUSINESS LOGIC SERVICE
  const metricasOperacionais = useMemo(() => {
    // ✅ FIX: Usar precoCusto em vez de preco
    const valorEstoque = BusinessLogic.calcularValorTotalEstoque(produtos);
    const giroEstoque = valorEstoque > 0 ? (totalVendas / valorEstoque).toFixed(2) : 0;
    const taxaConversao = clientes.length > 0 ? ((vendas.length / clientes.length) * 100).toFixed(1) : 0;
    const produtosMaisVendidos = produtos
      .map(p => ({
        nome: p.produto,
        vendas: vendas.filter(v => v.produto === p.produto).length
      }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 3);
    
    return { valorEstoque, giroEstoque, taxaConversao, produtosMaisVendidos };
  }, [produtos, vendas, clientes, totalVendas]);

  // ===== MÉTRICAS FINANCEIRAS =====
  const metricasFinanceiras = useMemo(() => {
    const hoje = new Date();
    
    // Saldo total em contas bancárias
    const saldoTotal = contasBancarias
      .filter(c => c.ativo)
      .reduce((sum, c) => sum + (c.saldoAtual || 0), 0);
    
    // Contas a pagar pendentes
    const despesasPendentes = despesas
      .filter(d => d.status === 'pendente')
      .reduce((sum, d) => sum + (d.valor || 0), 0);
    
    // Despesas vencidas
    const despesasVencidas = despesas.filter(d => {
      if (d.status !== 'pendente') return false;
      const vencimento = new Date(d.dataVencimento + 'T00:00:00');
      return vencimento < hoje;
    }).reduce((sum, d) => sum + (d.valor || 0), 0);
    
    // Contas a receber pendentes
    const contasReceberPendentes = contasReceber
      .filter(c => c.parcelas && Array.isArray(c.parcelas))
      .reduce((sum, c) => {
        const pendente = c.parcelas
          .filter(p => p.status === 'pendente')
          .reduce((s, p) => s + (p.valor || 0), 0);
        return sum + pendente;
      }, 0);
    
    // Parcelas vencidas
    const parcelasVencidas = contasReceber
      .filter(c => c.parcelas && Array.isArray(c.parcelas))
      .flatMap(c => c.parcelas)
      .filter(p => {
        if (p.status !== 'pendente') return false;
        const vencimento = new Date(p.dataVencimento + 'T00:00:00');
        return vencimento < hoje;
      })
      .reduce((sum, p) => sum + (p.valor || 0), 0);
    
    // Fluxo de caixa previsto (receitas - despesas pendentes)
    const fluxoCaixaPrevisto = contasReceberPendentes - despesasPendentes;
    
    return {
      saldoTotal,
      despesasPendentes,
      despesasVencidas,
      contasReceberPendentes,
      parcelasVencidas,
      fluxoCaixaPrevisto
    };
  }, [contasBancarias, despesas, contasReceber]);

  // ===== ANÁLISES EXECUTIVAS =====
  const diagnostico = useMemo(() => {
    const problemas = [];
    
    // 1. Meta não atingida
    if (atingimentoMeta < 100) {
      const deficit = metaTotal - receitaMesAtual;
      problemas.push({
        tipo: 'meta',
        severidade: atingimentoMeta < 70 ? 'alta' : 'media',
        titulo: `Meta ${atingimentoMeta}% atingida`,
        descricao: `Faltam R$ ${deficit.toFixed(2)} para atingir a meta mensal`,
        acao: 'Intensificar vendas nos canais mais rentáveis'
      });
    }

    // 2. Queda nas vendas MoM
    if (crescimentoMoM < 0) {
      problemas.push({
        tipo: 'queda',
        severidade: 'alta',
        titulo: `Queda de ${Math.abs(crescimentoMoM)}% nas vendas`,
        descricao: 'Receita menor que o mês anterior',
        acao: 'Revisar estratégia de precificação e campanhas'
      });
    }

    // 3. Produtos estagnados
    const produtosParados = produtos.filter(p => {
      const vendasProduto = vendas.filter(v => v.produto === p.produto);
      const ultimaVenda = vendasProduto[vendasProduto.length - 1];
      if (!ultimaVenda || !ultimaVenda.data) return false;
      const [dia, mes, ano] = ultimaVenda.data.split('/');
      const dataUltimaVenda = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      const diasSemVenda = (hoje - dataUltimaVenda) / (1000 * 60 * 60 * 24);
      return diasSemVenda > 30;
    });

    if (produtosParados.length > 0) {
      problemas.push({
        tipo: 'estoque',
        severidade: 'media',
        titulo: `${produtosParados.length} produtos sem venda há 30+ dias`,
        descricao: 'Produtos estagnados no estoque',
        acao: 'Considerar promoções ou remoção do catálogo'
      });
    }

    // 4. Margem baixa
    if (margemMedia < 20) {
      problemas.push({
        tipo: 'margem',
        severidade: 'alta',
        titulo: `Margem de apenas ${margemMedia}%`,
        descricao: 'Margem abaixo do recomendado (mín. 20%)',
        acao: 'Revisar custos de fornecedores e precificação'
      });
    }

    return problemas;
  }, [atingimentoMeta, crescimentoMoM, produtos, vendas, margemMedia]);

  // Produtos top e bottom
  const rankingProdutos = useMemo(() => {
    const vendasPorProduto = {};
    
    vendas.forEach(v => {
      const prod = v.produto || 'Desconhecido';
      if (!vendasPorProduto[prod]) {
        vendasPorProduto[prod] = { produto: prod, receita: 0, quantidade: 0 };
      }
      vendasPorProduto[prod].receita += v.valorVenda || 0;
      vendasPorProduto[prod].quantidade += v.quantidade || 1;
    });

    const ranking = Object.values(vendasPorProduto).sort((a, b) => b.receita - a.receita);
    
    return {
      top5: ranking.slice(0, 5),
      bottom5: ranking.slice(-5).reverse()
    };
  }, [vendas]);

  // Análise de devoluções por fornecedor
  const devolucoesPorFornecedor = useMemo(() => {
    const analise = {};
    
    // Mapear produtos para fornecedores
    const produtoFornecedorMap = {};
    produtos.forEach(p => {
      if (p.fornecedorId) {
        produtoFornecedorMap[p.produto] = p.fornecedorId;
      }
    });
    
    // Contabilizar devoluções por fornecedor
    devolucoes.forEach(dev => {
      const vendaRelacionada = vendas.find(v => v.id === dev.vendaId);
      if (vendaRelacionada && vendaRelacionada.produto) {
        const fornecedorId = produtoFornecedorMap[vendaRelacionada.produto];
        if (fornecedorId) {
          const fornecedor = fornecedores.find(f => f.id === fornecedorId);
          const nomeFornecedor = fornecedor?.nome || 'Fornecedor Desconhecido';
          
          if (!analise[nomeFornecedor]) {
            analise[nomeFornecedor] = {
              nome: nomeFornecedor,
              devolucoes: 0,
              vendasTotais: 0,
              produtosAfetados: new Set(),
              valorDevolvido: 0
            };
          }
          
          analise[nomeFornecedor].devolucoes++;
          analise[nomeFornecedor].produtosAfetados.add(vendaRelacionada.produto);
          analise[nomeFornecedor].valorDevolvido += dev.valor || vendaRelacionada.valorVenda || 0;
        }
      }
    });
    
    // Contar vendas totais por fornecedor
    vendas.forEach(v => {
      if (v.produto && produtoFornecedorMap[v.produto]) {
        const fornecedorId = produtoFornecedorMap[v.produto];
        const fornecedor = fornecedores.find(f => f.id === fornecedorId);
        const nomeFornecedor = fornecedor?.nome || 'Fornecedor Desconhecido';
        
        if (analise[nomeFornecedor]) {
          analise[nomeFornecedor].vendasTotais++;
        }
      }
    });
    
    // Calcular taxa de devolução e converter Set para array
    return Object.values(analise).map(f => ({
      ...f,
      produtosAfetados: Array.from(f.produtosAfetados),
      taxaDevolucao: f.vendasTotais > 0 ? ((f.devolucoes / f.vendasTotais) * 100).toFixed(1) : 0
    })).sort((a, b) => b.devolucoes - a.devolucoes);
  }, [devolucoes, vendas, produtos, fornecedores]);

  // Devoluções gerais
  const taxaDevolucaoGeral = vendas.length > 0 ? ((devolucoes.length / vendas.length) * 100).toFixed(1) : 0;

  // Cores para gráficos
  const COLORS = [
    'var(--aureon-gold)',      // Dourado principal
    'var(--aureon-green)',     // Verde (sucesso)
    'var(--aureon-blue)',      // Azul (info)
    'var(--aureon-purple)',    // Roxo (destaque)
    'var(--aureon-teal)',      // Teal (secundário)
    'var(--aureon-yellow)'     // Amarelo (atenção)
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ SIMULATION CONTROL PANEL (Visível apenas em modo simulação) */}
        {isSimulationMode && (
          <div className="mb-6">
            <SimulationControlPanel />
          </div>
        )}

        {/* Header com Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-serif font-bold text-aureon-gold flex items-center gap-3">
                <LayoutDashboard size={32} />
                Dashboard Executivo
              </h2>
              
              {/* ✅ LIVE BADGE - Indicador de Atualização em Tempo Real */}
              {liveUpdates.isActive && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-full animate-pulse">
                  <Radio size={14} className="text-green-400" />
                  <span className="text-xs font-semibold text-green-400">LIVE</span>
                  {liveUpdates.eventCount > 0 && (
                    <span className="text-xs text-green-400/70">
                      ({liveUpdates.eventCount} eventos)
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-aureon-text text-sm mt-1">
              Visão completa do seu negócio
              {liveUpdates.lastEvent && (
                <span className="ml-2 text-aureon-text/50">
                  • Último evento: {liveUpdates.lastEvent.split('.').pop()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* KPIs Principais - ✅ Usando CEO Metrics em Tempo Real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Receita Mensal */}
          <div className={`bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 ${
            atingimentoMeta >= 100 ? 'border-green-400/40' : atingimentoMeta >= 70 ? 'border-yellow-400/40' : 'border-red-400/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Receita do Mês</span>
              <DollarSign size={24} className="text-aureon-gold" />
            </div>
            <div className="text-3xl font-bold text-aureon-gold mb-1">
              R$ {(ceoMetrics.sales.monthTotal || receitaMesAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {(ceoMetrics.sales.growth || crescimentoMoM) >= 0 ? (
                <ArrowUp size={16} className="text-green-400" />
              ) : (
                <ArrowDown size={16} className="text-red-400" />
              )}
              <span className={(ceoMetrics.sales.growth || crescimentoMoM) >= 0 ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(ceoMetrics.sales.growth || crescimentoMoM)}% vs mês anterior
              </span>
            </div>
          </div>

          {/* Atingimento de Meta */}
          <div className={`bg-gradient-to-br from-green-400/10 to-aureon-surface border rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 ${
            atingimentoMeta >= 100 ? 'border-green-400/40' : atingimentoMeta >= 70 ? 'border-yellow-400/40' : 'border-red-400/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Atingimento de Meta</span>
              <Target size={24} className={atingimentoMeta >= 100 ? 'text-green-400' : atingimentoMeta >= 70 ? 'text-yellow-400' : 'text-red-400'} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${atingimentoMeta >= 100 ? 'text-green-400' : atingimentoMeta >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {atingimentoMeta}%
            </div>
            <div className="text-xs text-aureon-text/70">
              Meta: R$ {metaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="bg-gradient-to-br from-blue-400/10 to-aureon-surface border border-blue-400/40 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Ticket Médio</span>
              <ShoppingCart size={24} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-1">
              R$ {(ceoMetrics.sales.averageTicket || ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-aureon-text/70">
              {ceoMetrics.sales.count || vendas.length} vendas realizadas
            </div>
          </div>

          {/* Margem Média */}
          <div className="bg-gradient-to-br from-purple-400/10 to-aureon-surface border border-purple-400/40 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Margem Média</span>
              <TrendingUp size={24} className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {(ceoMetrics.finance.profitMargin || margemMedia).toFixed(1)}%
            </div>
            <div className="text-xs text-aureon-text/70">
              Lucro: R$ {(ceoMetrics.finance.profit || totalLucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Taxa de Devolução */}
          <div className={`bg-gradient-to-br ${
            parseFloat(taxaDevolucaoGeral) > 5
              ? 'from-red-400/10 border-red-400/40'
              : parseFloat(taxaDevolucaoGeral) > 2
              ? 'from-orange-400/10 border-orange-400/40'
              : 'from-green-400/10 border-green-400/40'
          } to-aureon-surface border rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Taxa de Devolução</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={
                parseFloat(taxaDevolucaoGeral) > 5 ? 'text-red-400' : parseFloat(taxaDevolucaoGeral) > 2 ? 'text-orange-400' : 'text-green-400'
              }>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              parseFloat(taxaDevolucaoGeral) > 5 ? 'text-red-400' : parseFloat(taxaDevolucaoGeral) > 2 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {taxaDevolucaoGeral}%
            </div>
            <div className="text-xs text-aureon-text/70">
              {devolucoes.length} de {vendas.length} vendas
            </div>
          </div>
        </div>

        {/* ✅ Indicador de Atualização em Tempo Real */}
        {!metricsLoading && (
          <div className="bg-gradient-to-r from-aureon-gold/10 to-aureon-surface border border-aureon-gold/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio size={20} className="text-aureon-gold animate-pulse" />
                <div>
                  <div className="text-sm font-semibold text-aureon-gold">Métricas Atualizadas em Tempo Real</div>
                  <div className="text-xs text-aureon-text/60">
                    Última atualização: {new Date(lastUpdate).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
              <button
                onClick={refreshMetrics}
                className="px-4 py-2 bg-aureon-gold/20 hover:bg-aureon-gold/30 text-aureon-gold rounded-lg text-sm font-medium transition-all"
              >
                Atualizar Agora
              </button>
            </div>
          </div>
        )}

        {/* KPIs Financeiros */}
        <div className="bg-gradient-to-br from-[#8B5CF6]/5 to-aureon-surface border border-aureon-purple/30 rounded-xl p-6 mb-8">
          <h3 className="text-aureon-purple font-serif text-xl mb-4 flex items-center gap-2">
            <Briefcase size={24} />
            Situação Financeira
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Saldo em Caixa */}
            <div className="bg-aureon-surface border border-aureon-purple/20 rounded-lg p-4">
              <div className="text-xs text-aureon-text/70 mb-1">Saldo em Caixa</div>
              <div className="text-2xl font-bold text-aureon-purple">
                R$ {metricasFinanceiras.saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-aureon-text/50 mt-1">{contasBancarias.filter(c => c.ativo).length} contas</div>
            </div>

            {/* Contas a Pagar */}
            <div className="bg-aureon-surface border border-red-400/20 rounded-lg p-4">
              <div className="text-xs text-aureon-text/70 mb-1">Contas a Pagar</div>
              <div className="text-2xl font-bold text-red-400">
                R$ {metricasFinanceiras.despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-aureon-text/50 mt-1">
                {despesas.filter(d => d.status === 'pendente').length} pendentes
              </div>
            </div>

            {/* Contas Vencidas */}
            <div className="bg-aureon-surface border border-orange-400/20 rounded-lg p-4">
              <div className="text-xs text-aureon-text/70 mb-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                Vencidas (Pagar)
              </div>
              <div className="text-2xl font-bold text-orange-400">
                R$ {metricasFinanceiras.despesasVencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-orange-400/70 mt-1">Atenção!</div>
            </div>

            {/* Contas a Receber */}
            <div className="bg-aureon-surface border border-green-400/20 rounded-lg p-4">
              <div className="text-xs text-aureon-text/70 mb-1">Contas a Receber</div>
              <div className="text-2xl font-bold text-green-400">
                R$ {(ceoMetrics.finance.receivables || metricasFinanceiras.contasReceberPendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-aureon-text/50 mt-1">
                {contasReceber.filter(c => c.statusGeral !== 'recebido').length} pendentes
              </div>
            </div>

            {/* Parcelas Vencidas */}
            <div className="bg-aureon-surface border border-yellow-400/20 rounded-lg p-4">
              <div className="text-xs text-aureon-text/70 mb-1 flex items-center gap-1">
                <AlertCircle size={12} />
                Vencidas (Receber)
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                R$ {metricasFinanceiras.parcelasVencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-yellow-400/70 mt-1">Cobrar!</div>
            </div>

            {/* Fluxo de Caixa Previsto */}
            <div className={`bg-aureon-surface border rounded-lg p-4 ${
              metricasFinanceiras.fluxoCaixaPrevisto >= 0 ? 'border-blue-400/20' : 'border-red-400/20'
            }`}>
              <div className="text-xs text-aureon-text/70 mb-1">Fluxo Previsto</div>
              <div className={`text-2xl font-bold ${
                metricasFinanceiras.fluxoCaixaPrevisto >= 0 ? 'text-blue-400' : 'text-red-400'
              }`}>
                R$ {metricasFinanceiras.fluxoCaixaPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-aureon-text/50 mt-1">Receber - Pagar</div>
            </div>
          </div>
        </div>

        {/* Conteúdo Consolidado */}
        <>
          {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Vendas por Período com Toggle */}
              <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-aureon-gold font-serif text-lg flex items-center gap-2">
                    <TrendingUp size={20} />
                    Evolução de Vendas
                  </h3>
                  {/* Toggle de Período */}
                  <div className="flex gap-1 bg-aureon-bg rounded-lg p-1 border border-aureon-gold/20">
                    <button
                      onClick={() => setPeriodoVendas('diario')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        periodoVendas === 'diario' 
                          ? 'bg-aureon-gold text-black' 
                          : 'text-aureon-text hover:bg-aureon-gold/10'
                      }`}
                    >
                      Diário
                    </button>
                    <button
                      onClick={() => setPeriodoVendas('semanal')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        periodoVendas === 'semanal' 
                          ? 'bg-aureon-gold text-black' 
                          : 'text-aureon-text hover:bg-aureon-gold/10'
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => setPeriodoVendas('mensal')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        periodoVendas === 'mensal' 
                          ? 'bg-aureon-gold text-black' 
                          : 'text-aureon-text hover:bg-aureon-gold/10'
                      }`}
                    >
                      Mensal
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={vendasPorPeriodo}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--aureon-gold)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--aureon-gold)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="periodo" 
                      stroke="var(--aureon-text)"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis stroke="var(--aureon-text)" />
                    <Tooltip
                      contentStyle={{ background: 'var(--aureon-surface)', border: '1px solid var(--aureon-gold)' }}
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="var(--aureon-gold)" 
                      fillOpacity={1} 
                      fill="url(#colorReceita)"
                      name="Receita"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lucro" 
                      stroke="#4ade80" 
                      fillOpacity={1} 
                      fill="url(#colorLucro)"
                      name="Lucro"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Vendas por Canal */}
              <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
                <h3 className="text-aureon-gold font-serif text-lg mb-4 flex items-center gap-2">
                  <Package size={20} />
                  Distribuição por Canal
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vendasPorCanal}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentual }) => `${name}: ${percentual}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {vendasPorCanal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resumo por Canal */}
            <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
              <h3 className="text-aureon-gold font-serif text-lg mb-4">Desempenho por Canal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendasPorCanal.map((canal, index) => (
                  <div key={canal.name} className="bg-aureon-bg p-4 rounded-lg border border-aureon-gold/10 hover:border-aureon-gold/30 transition-all">
                    <h4 className="text-aureon-text font-semibold mb-2">{canal.name}</h4>
                    <p className="text-2xl font-bold text-aureon-gold mb-1">
                      R$ {canal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-aureon-text/70">{canal.percentual}% do total</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Business Insights */}
            <div className="bg-aureon-surface border border-blue-400/30 rounded-xl p-6 shadow-lg mb-8">
              <h3 className="text-blue-400 font-serif text-lg mb-4 flex items-center gap-2">
                <Briefcase size={20} />
                Insights de IA - Análise Estratégica
              </h3>
              {loadingInsights ? (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin mx-auto mb-4" size={32} color="#60a5fa" />
                  <p className="text-aureon-text">Analisando métricas de negócio...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-aureon-text whitespace-pre-line leading-relaxed">{aiInsights}</p>
                </div>
              )}
            </div>

            {/* AI Insights Avançados - Painel Completo */}
            <div className="mb-8">
              <AIInsightsPanel 
                salesData={vendasPorMes.map((m, idx) => ({
                  month: m.mes,
                  revenue: m.receita,
                  units: m.vendas
                }))}
                productsData={{
                  available: produtos.map(p => ({
                    name: p.nome || 'Sem nome',
                    category: p.categoria || 'Geral',
                    price: p.preco || 0,
                    sku: p.sku || '',
                    supplier: p.fornecedor || 'N/A'
                  })),
                  inventory: produtos
                    .filter(p => (p.estoque || 0) > 0)
                    .map(p => {
                      // ✅ Calcular vendas reais do produto nos últimos 90 dias
                      const vendasDoProduto = vendas.filter(v => 
                        (v.produtoId === p.id || v.produto === p.nome || v.produto === p.produto) &&
                        v.data &&
                        (() => {
                          const [dia, mes, ano] = v.data.split('/');
                          const dataVenda = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                          const tresMesesAtras = new Date();
                          tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
                          return dataVenda >= tresMesesAtras;
                        })()
                      );
                      const totalVendidoUltimos90dias = vendasDoProduto.reduce((acc, v) => acc + (v.quantidade || 1), 0);
                      const avgSalesPerMonth = totalVendidoUltimos90dias > 0 ? Math.ceil(totalVendidoUltimos90dias / 3) : 0;
                      
                      return {
                        name: p.nome || 'Sem nome',
                        currentStock: p.estoque || 0,
                        avgSalesPerMonth, // ✅ Vendas reais (média últimos 3 meses)
                        supplierLeadTime: 7, // TODO: Pegar do cadastro de fornecedor
                        sku: p.sku || ''
                      };
                    })
                }}
                customersData={analiseClientes.clientesComRFM.length > 0 ? analiseClientes.clientesComRFM.map((c, idx) => ({
                  id: c.id || idx + 1,
                  name: c.nome || c.name || `Cliente ${idx + 1}`,
                  totalPurchases: c.frequencia || 0,
                  totalSpent: c.valorTotal || 0,
                  daysSinceLastPurchase: c.diasUltimaCompra || 0,
                  segment: c.segmento || 'REGULAR'
                })) : []}
              />
            </div>

            {/* Diagnósticos e Alertas */}
            {diagnostico.length > 0 && (
              <div className="bg-aureon-surface border border-yellow-400/30 rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-yellow-400 font-serif text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Por que não atingimos as metas?
                </h3>
                <div className="space-y-4">
                  {diagnostico.map((prob, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        prob.severidade === 'alta'
                          ? 'bg-red-500/10 border-red-400/30'
                          : 'bg-yellow-500/10 border-yellow-400/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          size={20}
                          className={prob.severidade === 'alta' ? 'text-red-400 mt-1' : 'text-yellow-400 mt-1'}
                        />
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-1 ${prob.severidade === 'alta' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {prob.titulo}
                          </h4>
                          <p className="text-sm text-aureon-text mb-2">{prob.descricao}</p>
                          <p className="text-xs text-aureon-text/70">💡 Ação recomendada: {prob.acao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 e Bottom 5 Produtos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top 5 */}
              <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-6 shadow-lg">
                <h3 className="text-green-400 font-serif text-lg mb-4 flex items-center gap-2">
                  <Award size={20} />
                  Top 5 Produtos (Receita)
                </h3>
                <div className="space-y-3">
                  {rankingProdutos.top5.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg border border-green-400/20">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-green-400">#{idx + 1}</span>
                        <div>
                          <p className="text-aureon-text font-semibold">{prod.produto}</p>
                          <p className="text-xs text-aureon-text/70">{prod.quantidade} unidades</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-400">
                        R$ {prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 5 */}
              <div className="bg-aureon-surface border border-red-400/30 rounded-xl p-6 shadow-lg">
                <h3 className="text-red-400 font-serif text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Bottom 5 Produtos (Receita)
                </h3>
                <div className="space-y-3">
                  {rankingProdutos.bottom5.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg border border-red-400/20">
                      <div>
                        <p className="text-aureon-text font-semibold">{prod.produto}</p>
                        <p className="text-xs text-aureon-text/70">{prod.quantidade} unidades</p>
                      </div>
                      <p className="text-lg font-bold text-red-400">
                        R$ {prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Devoluções por Fornecedor */}
            {devolucoesPorFornecedor.length > 0 && (
              <div className="bg-aureon-surface border border-orange-400/30 rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-orange-400 font-serif text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                  Análise de Devoluções por Fornecedor
                </h3>
                <p className="text-sm text-aureon-text/70 mb-6">
                  Identifique fornecedores com alta taxa de devolução para tomar ações corretivas.
                </p>
                
                <div className="space-y-4">
                  {devolucoesPorFornecedor.map((forn, idx) => {
                    const alerta = parseFloat(forn.taxaDevolucao) > 5;
                    const atencao = parseFloat(forn.taxaDevolucao) > 2 && parseFloat(forn.taxaDevolucao) <= 5;
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          alerta 
                            ? 'bg-red-500/10 border-red-400/30' 
                            : atencao 
                            ? 'bg-orange-500/10 border-orange-400/30' 
                            : 'bg-green-500/10 border-green-400/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className={`font-bold text-lg ${
                              alerta ? 'text-red-400' : atencao ? 'text-orange-400' : 'text-green-400'
                            }`}>
                              {forn.nome}
                            </h4>
                            <p className="text-sm text-aureon-text/70 mt-1">
                              {forn.produtosAfetados.length} produto(s) com devoluções
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${
                              alerta ? 'text-red-400' : atencao ? 'text-orange-400' : 'text-green-400'
                            }`}>
                              {forn.taxaDevolucao}%
                            </div>
                            <p className="text-xs text-aureon-text/70">Taxa de Devolução</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-aureon-text/10">
                          <div>
                            <p className="text-xs text-aureon-text/70 mb-1">Devoluções</p>
                            <p className={`text-xl font-bold ${
                              alerta ? 'text-red-400' : atencao ? 'text-orange-400' : 'text-green-400'
                            }`}>
                              {forn.devolucoes}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-aureon-text/70 mb-1">Vendas Totais</p>
                            <p className="text-xl font-bold text-aureon-text">{forn.vendasTotais}</p>
                          </div>
                          <div>
                            <p className="text-xs text-aureon-text/70 mb-1">Valor Devolvido</p>
                            <p className="text-xl font-bold text-aureon-gold">
                              R$ {forn.valorDevolvido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-aureon-text/10">
                          <p className="text-xs text-aureon-text/70 mb-2">Produtos com devolução:</p>
                          <div className="flex flex-wrap gap-2">
                            {forn.produtosAfetados.map((prod, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-aureon-bg rounded text-xs text-aureon-text"
                              >
                                {prod}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {alerta && (
                          <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                            <p className="text-xs text-red-400">
                              ⚠️ <strong>ALERTA CRÍTICO:</strong> Taxa superior a 5%. Avalie urgentemente a qualidade dos produtos deste fornecedor.
                            </p>
                          </div>
                        )}
                        {atencao && (
                          <div className="mt-4 p-3 bg-orange-500/20 rounded-lg border border-orange-400/30">
                            <p className="text-xs text-orange-400">
                              ⚠️ <strong>ATENÇÃO:</strong> Taxa entre 2% e 5%. Monitore este fornecedor mais de perto.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {devolucoesPorFornecedor.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle size={48} color="#4ade80" className="mx-auto mb-4" />
                    <p className="text-green-400 font-semibold">Nenhuma devolução registrada!</p>
                    <p className="text-sm text-aureon-text/70 mt-2">
                      Seus fornecedores estão entregando produtos de qualidade.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Análise de Clientes - Ativos vs Inativos */}
            <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg mb-8">
              <h3 className="text-aureon-gold font-serif text-lg mb-4 flex items-center gap-2">
                <Users size={20} />
                Base de Clientes - Análise Automática
              </h3>
              
              {/* KPIs de Clientes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-400/10 to-aureon-bg border border-green-400/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase text-aureon-text/70">Clientes Ativos</span>
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-400">{analiseClientes.ativos.length}</div>
                  <div className="text-xs text-aureon-text/60 mt-1">Compraram nos últimos 30 dias</div>
                </div>

                <div className="bg-gradient-to-br from-orange-400/10 to-aureon-bg border border-orange-400/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase text-aureon-text/70">Clientes Inativos</span>
                    <AlertCircle size={20} className="text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold text-orange-400">{analiseClientes.inativos.length}</div>
                  <div className="text-xs text-aureon-text/60 mt-1">Sem compras há mais de 30 dias</div>
                </div>

                <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-bg border border-aureon-gold/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase text-aureon-text/70">Total Cadastrados</span>
                    <Users size={20} className="text-aureon-gold" />
                  </div>
                  <div className="text-3xl font-bold text-aureon-gold">{analiseClientes.total}</div>
                  <div className="text-xs text-aureon-text/60 mt-1">
                    Taxa de ativação: {analiseClientes.total > 0 ? ((analiseClientes.ativos.length / analiseClientes.total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              {/* Lista de Clientes Inativos - Oportunidade de Reativação */}
              {analiseClientes.inativos.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4 mb-4">
                  <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Oportunidade: Clientes para Reativar ({analiseClientes.inativos.slice(0, 5).length})
                  </h4>
                  <div className="space-y-2">
                    {analiseClientes.inativos.slice(0, 5).map((cliente, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-aureon-bg p-3 rounded border border-orange-400/20">
                        <div>
                          <p className="text-aureon-text font-semibold">{cliente.nome}</p>
                          <p className="text-xs text-aureon-text/60">
                            {cliente.diasSemComprar ? `${cliente.diasSemComprar} dias sem comprar` : 'Nunca comprou'} 
                            {cliente.totalGasto > 0 && ` • Já gastou: R$ ${cliente.totalGasto.toFixed(2)}`}
                          </p>
                        </div>
                        <button className="px-3 py-1 bg-orange-400/20 text-orange-400 rounded hover:bg-orange-400/30 text-xs font-bold">
                          📧 Enviar Oferta
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-orange-400/70 mt-3">
                    💡 Sugestão: Crie campanhas de reativação com descontos exclusivos para estes clientes
                  </p>
                </div>
              )}

              {/* Top Clientes Ativos */}
              {analiseClientes.ativos.length > 0 && (
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                    <Award size={18} />
                    Top Clientes Ativos
                  </h4>
                  <div className="space-y-2">
                    {analiseClientes.ativos
                      .sort((a, b) => b.totalGasto - a.totalGasto)
                      .slice(0, 5)
                      .map((cliente, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-aureon-bg p-3 rounded border border-green-400/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                              <span className="text-green-400 font-bold text-sm">#{idx + 1}</span>
                            </div>
                            <div>
                              <p className="text-aureon-text font-semibold">{cliente.nome}</p>
                              <p className="text-xs text-aureon-text/60">
                                Última compra: há {cliente.diasSemComprar} dias
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">R$ {cliente.totalGasto.toFixed(2)}</p>
                            <p className="text-xs text-aureon-text/60">Total gasto</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Métricas Operacionais Avançadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
                <h3 className="text-aureon-gold font-serif text-lg mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Eficiência Operacional
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-aureon-bg rounded border border-aureon-gold/10">
                    <span className="text-aureon-text">Giro de Estoque</span>
                    <span className="text-aureon-gold font-bold">{metricasOperacionais.giroEstoque}x</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-aureon-bg rounded border border-aureon-gold/10">
                    <span className="text-aureon-text">Taxa de Conversão</span>
                    <span className="text-aureon-gold font-bold">{metricasOperacionais.taxaConversao}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-aureon-bg rounded border border-aureon-gold/10">
                    <span className="text-aureon-text">Valor em Estoque</span>
                    <span className="text-aureon-gold font-bold">R$ {metricasOperacionais.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
                <h3 className="text-aureon-gold font-serif text-lg mb-4 flex items-center gap-2">
                  <Package size={20} />
                  Produtos Mais Vendidos
                </h3>
                <div className="space-y-3">
                  {metricasOperacionais.produtosMaisVendidos.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-aureon-bg rounded border border-aureon-gold/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-aureon-gold/20 rounded-full flex items-center justify-center">
                          <span className="text-aureon-gold font-bold text-xs">#{idx + 1}</span>
                        </div>
                        <span className="text-aureon-text">{prod.nome}</span>
                      </div>
                      <span className="text-aureon-gold font-bold">{prod.vendas} vendas</span>
                    </div>
                  ))}
                  {metricasOperacionais.produtosMaisVendidos.length === 0 && (
                    <p className="text-center text-aureon-text/50 py-4">Nenhuma venda registrada ainda</p>
                  )}
                </div>
              </div>
            </div>

            {/* Análise de Fornecedores */}
            <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
              <h3 className="text-aureon-gold font-serif text-lg mb-4 flex items-center gap-2">
                <Briefcase size={20} />
                Rede de Fornecedores
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-aureon-bg p-4 rounded border border-aureon-gold/10">
                  <p className="text-aureon-text/70 text-sm mb-1">Total de Fornecedores</p>
                  <p className="text-3xl font-bold text-aureon-gold">{analiseFornecedores.totalFornecedores}</p>
                </div>
                <div className="bg-aureon-bg p-4 rounded border border-aureon-gold/10">
                  <p className="text-aureon-text/70 text-sm mb-1">Itens Disponíveis</p>
                  <p className="text-3xl font-bold text-aureon-gold">{analiseFornecedores.itensDisponiveis}</p>
                </div>
                <div className="bg-aureon-bg p-4 rounded border border-aureon-gold/10">
                  <p className="text-aureon-text/70 text-sm mb-1">Produtos Vinculados</p>
                  <p className="text-3xl font-bold text-aureon-gold">{analiseFornecedores.produtosVinculados}</p>
                </div>
              </div>
            </div>
          </>
      </div>
    </div>
  );
}

