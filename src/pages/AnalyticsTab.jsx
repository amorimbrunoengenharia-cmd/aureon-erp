import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart, ComposedChart } from 'recharts';
import { BarChart3, Target, TrendingUp, Package, Users, AlertTriangle, Save, Sparkles, Lightbulb, Brain, Calendar, DollarSign } from 'lucide-react';
import { 
  analyzeVendas, 
  analyzeEstoque, 
  analyzeClientes, 
  predictVendas, 
  generateRecommendations 
} from '../services/aiAnalytics';
import { 
  agruparVendasPorPeriodo, 
  formatarDespesasMensais, 
  analisarFinanceiroMensal,
  preverDespesasProximoMes,
  analisarPadraoDespesas
} from '../utils/chartHelpers';

const COLORS = ['#D4AF37', '#4ade80', '#60a5fa', '#c084fc', '#f87171', '#F3E5AB'];

export default function AnalyticsTab() {
  const { produtos, clientes, vendas = [], devolucoes = [], config, setConfig } = useContext(DataContext);
  const [viewType, setViewType] = useState('analytics'); // 'analytics' | 'goals'
  const [editMode, setEditMode] = useState(false);
  const [periodoVendas, setPeriodoVendas] = useState('diario'); // 'diario' | 'semanal' | 'mensal'
  const [editDespesas, setEditDespesas] = useState(false);
  const [despesaMesAtual, setDespesaMesAtual] = useState('');
  
  const [goals, setGoals] = useState({
    metaMensal: config?.metaMensalVendas || 50000,
    margemMinima: config?.margemMinima || 30,
    metaClientes: config?.metaClientes || 100,
    metaProdutos: config?.metaProdutos || 1000,
  });

  // Dados de vendas agrupados por período
  const vendasPorPeriodo = useMemo(() => 
    agruparVendasPorPeriodo(vendas, periodoVendas), 
    [vendas, periodoVendas]
  );

  // Análise financeira completa (Gastos x Faturamento x Lucro)
  const analiseFinanceira = useMemo(() => 
    analisarFinanceiroMensal(vendas, config?.despesasMensais || {}),
    [vendas, config?.despesasMensais]
  );

  // Previsão de despesas e insights
  const insightsDespesas = useMemo(() => 
    analisarPadraoDespesas(config?.despesasMensais || {}, vendas),
    [config?.despesasMensais, vendas]
  );

  const despesaPrevista = useMemo(() => 
    preverDespesasProximoMes(config?.despesasMensais || {}),
    [config?.despesasMensais]
  );

  // IA Insights
  const aiInsights = useMemo(() => ({
    vendas: analyzeVendas(vendas, produtos, config),
    estoque: analyzeEstoque(produtos),
    clientes: analyzeClientes(clientes, vendas),
    previsao: predictVendas(vendas, 30),
    recomendacoes: generateRecommendations(vendas, produtos, clientes, config)
  }), [vendas, produtos, clientes, config]);

  // Análise de Inventário
  const inventoryAnalysis = useMemo(() => {
    const total = produtos.reduce((a, p) => a + (p.estoque || 0), 0);
    const valor = produtos.reduce((a, p) => a + ((p.estoque || 0) * (p.preco || 0)), 0);
    const outOfStock = produtos.filter(p => p.estoque === 0).length;
    const lowStock = produtos.filter(p => p.estoque > 0 && p.estoque < 10).length;

    return { total, valor, outOfStock, lowStock, produtos };
  }, [produtos]);

  // Análise de Clientes
  const clientAnalysis = useMemo(() => {
    const total = clientes.length;
    const comCompras = clientes.filter(c => (c.compras || 0) > 0).length;
    const totalGasto = clientes.reduce((a, c) => a + (c.totalGasto || 0), 0);
    const gastoMedio = total > 0 ? totalGasto / total : 0;

    return { total, comCompras, totalGasto, gastoMedio };
  }, [clientes]);

  // Recomendações de Compra
  const buyingRecommendations = useMemo(() => {
    return produtos
      .filter(p => p.estoque < 10)
      .sort((a, b) => a.estoque - b.estoque)
      .slice(0, 5)
      .map(p => ({
        nome: p.produto,
        estoque: p.estoque,
        recomendado: p.estoque === 0 ? 20 : 10 - p.estoque,
        urgencia: p.estoque === 0 ? 'Alta' : p.estoque < 5 ? 'Média' : 'Baixa'
      }));
  }, [produtos]);

  // Cálculos para Metas
  const totalVendas = vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const totalLucro = vendas.reduce((acc, v) => acc + (v.lucro || 0), 0);
  const margemAtual = totalVendas > 0 ? ((totalLucro / totalVendas) * 100) : 0;
  
  const progress = {
    vendas: Math.round((totalVendas / goals.metaMensal) * 100),
    margem: margemAtual.toFixed(1),
    clientes: Math.round((clientes.length / goals.metaClientes) * 100),
    produtos: Math.round((produtos.length / goals.metaProdutos) * 100),
  };

  const handleSaveGoals = () => {
    setConfig({
      ...config,
      metaMensalVendas: goals.metaMensal,
      margemMinima: goals.margemMinima,
      metaClientes: goals.metaClientes,
      metaProdutos: goals.metaProdutos,
    });
    setEditMode(false);
    alert('Metas salvas com sucesso!');
  };

  const handleSaveDespesaMensal = () => {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    
    const novasDespesas = {
      ...(config?.despesasMensais || {}),
      [mesAtual]: parseFloat(despesaMesAtual) || 0
    };

    setConfig({
      ...config,
      despesasMensais: novasDespesas
    });
    
    setEditDespesas(false);
    setDespesaMesAtual('');
    alert('Despesa mensal salva com sucesso!');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header com Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-aureon-gold flex items-center gap-3">
              <BarChart3 size={32} />
              Análises & Metas
            </h2>
            <p className="text-aureon-text text-sm mt-1">Insights, métricas e acompanhamento de objetivos</p>
          </div>
          
          {/* Toggle de Visualização */}
          <div className="flex gap-2 bg-aureon-surface p-1 rounded-lg border border-aureon-gold/20 flex-wrap">
            <button
              onClick={() => setViewType('analytics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'analytics'
                  ? 'bg-aureon-gold text-aureon-bg'
                  : 'text-aureon-text hover:bg-aureon-gold/10'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Análises Gerais
            </button>
            <button
              onClick={() => setViewType('goals')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'goals'
                  ? 'bg-gradient-to-r from-purple-500 to-[#D4AF37] text-white'
                  : 'text-aureon-text hover:bg-purple-500/10'
              }`}
            >
              <Brain size={16} className="inline mr-2" />
              <Target size={16} className="inline mr-2" />
              IA + Metas
            </button>
          </div>
        </div>

        {viewType === 'analytics' ? (
          <>
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-[#D4AF37]/10 to-aureon-surface border border-aureon-gold/40 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Total em Estoque</span>
                  <Package size={24} className="text-aureon-gold" />
                </div>
                <div className="text-3xl font-bold text-aureon-gold mb-1">{inventoryAnalysis.total}</div>
                <div className="text-xs text-aureon-text/70">
                  Valor: R$ {inventoryAnalysis.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-400/10 to-aureon-surface border border-blue-400/40 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Clientes Ativos</span>
                  <Users size={24} className="text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{clientAnalysis.comCompras}</div>
                <div className="text-xs text-aureon-text/70">
                  De {clientAnalysis.total} cadastrados ({clientAnalysis.total > 0 ? ((clientAnalysis.comCompras / clientAnalysis.total * 100).toFixed(0)) : 0}%)
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-400/10 to-aureon-surface border border-red-400/40 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Alertas de Estoque</span>
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {inventoryAnalysis.lowStock + inventoryAnalysis.outOfStock}
                </div>
                <div className="text-xs text-aureon-text/70">Produtos precisam atenção</div>
              </div>

              <div className={`bg-gradient-to-br ${
                devolucoes.length > 0 && (devolucoes.length / vendas.length * 100) > 5
                  ? 'from-orange-500/10 border-orange-500/40' 
                  : 'from-green-500/10 border-green-500/40'
              } to-aureon-surface border rounded-xl p-6 shadow-xl`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Taxa de Devolução</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={
                    devolucoes.length > 0 && (devolucoes.length / vendas.length * 100) > 5 ? 'text-orange-400' : 'text-green-400'
                  }>
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                </div>
                <div className={`text-3xl font-bold mb-1 ${
                  devolucoes.length > 0 && (devolucoes.length / vendas.length * 100) > 5 ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {vendas.length > 0 ? ((devolucoes.length / vendas.length * 100).toFixed(1)) : '0.0'}%
                </div>
                <div className="text-xs text-aureon-text/70">
                  {devolucoes.length} devoluções de {vendas.length} vendas
                </div>
              </div>
            </div>

            {/* Gráfico de Vendas por Período */}
            <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={24} className="text-aureon-gold" />
                  <h3 className="text-xl font-bold text-aureon-gold">Evolução de Vendas</h3>
                </div>
                {/* Toggle de Período */}
                <div className="flex gap-2 bg-aureon-bg rounded-lg p-1 border border-aureon-gold/20">
                  <button
                    onClick={() => setPeriodoVendas('diario')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      periodoVendas === 'diario' 
                        ? 'bg-aureon-gold text-black' 
                        : 'text-aureon-text hover:bg-aureon-gold/10'
                    }`}
                  >
                    Diário
                  </button>
                  <button
                    onClick={() => setPeriodoVendas('semanal')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      periodoVendas === 'semanal' 
                        ? 'bg-aureon-gold text-black' 
                        : 'text-aureon-text hover:bg-aureon-gold/10'
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setPeriodoVendas('mensal')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      periodoVendas === 'mensal' 
                        ? 'bg-aureon-gold text-black' 
                        : 'text-aureon-text hover:bg-aureon-gold/10'
                    }`}
                  >
                    Mensal
                  </button>
                </div>
              </div>

              {vendasPorPeriodo.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={vendasPorPeriodo}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                    <XAxis 
                      dataKey="periodo" 
                      stroke="#F3E5AB" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#F3E5AB" 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0A0A0C', 
                        border: '1px solid #D4AF37',
                        borderRadius: '8px',
                        color: '#F3E5AB'
                      }}
                      formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#D4AF37" 
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
              ) : (
                <div className="text-center py-12 text-aureon-text/50">
                  <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhuma venda registrada ainda</p>
                </div>
              )}
            </div>

            {/* Alertas e Recomendações */}
            {buyingRecommendations.length > 0 && (
              <div className="bg-aureon-surface border border-yellow-400/30 rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-yellow-400 font-serif text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Recomendações Urgentes de Compra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buyingRecommendations.map((rec, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${
                      rec.urgencia === 'Alta' 
                        ? 'bg-red-500/10 border-red-400/40' 
                        : rec.urgencia === 'Média' 
                        ? 'bg-yellow-500/10 border-yellow-400/40' 
                        : 'bg-orange-500/10 border-orange-400/40'
                    }`}>
                      <p className="text-aureon-text font-semibold mb-2">{rec.nome}</p>
                      <p className="text-sm text-aureon-text/70 mb-1">
                        Estoque: <span className={`font-bold ${rec.estoque === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {rec.estoque} unid.
                        </span>
                      </p>
                      <p className="text-sm text-aureon-text/70 mb-3">
                        Comprar: <span className="font-bold text-green-400">+{rec.recomendado} unid.</span>
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        rec.urgencia === 'Alta' 
                          ? 'bg-red-400 text-white' 
                          : rec.urgencia === 'Média' 
                          ? 'bg-yellow-400 text-aureon-bg' 
                          : 'bg-orange-400 text-white'
                      }`}>
                        {rec.urgencia}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* VISUALIZAÇÃO UNIFICADA: IA + METAS */
          <div className="space-y-6">
            
            {/* Header IA + Metas */}
            <div className="bg-gradient-to-r from-purple-500/20 via-[#D4AF37]/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Brain size={32} className="text-purple-400" />
                <Target size={32} className="text-aureon-gold" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-[#D4AF37] bg-clip-text text-transparent">
                  IA + Metas Inteligentes
                </h3>
              </div>
              <p className="text-aureon-text/80">
                Análises automáticas, insights inteligentes e acompanhamento de objetivos em um só lugar
              </p>
            </div>

            {/* IA Insights Cards - Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Vendas AI */}
              <div className="bg-aureon-surface border border-purple-400/30 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-purple-400" />
                  <h4 className="text-purple-400 font-semibold">Análise de Vendas</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-aureon-text">
                    <strong>Insights Gerados:</strong> <span className="text-purple-400">{aiInsights.vendas?.length || 0}</span>
                  </p>
                  {aiInsights.vendas?.[0] && (
                    <>
                      <div className={`p-2 rounded ${
                        aiInsights.vendas[0].type === 'success' ? 'bg-green-500/10' :
                        aiInsights.vendas[0].type === 'warning' ? 'bg-yellow-500/10' :
                        'bg-blue-500/10'
                      }`}>
                        <p className="font-semibold text-aureon-text mb-1">{aiInsights.vendas[0].title}</p>
                        <p className="text-aureon-text/70 text-xs">{aiInsights.vendas[0].message}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Estoque AI */}
              <div className="bg-aureon-surface border border-blue-400/30 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} className="text-blue-400" />
                  <h4 className="text-blue-400 font-semibold">Análise de Estoque</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-aureon-text">
                    <strong>Alertas:</strong> <span className="text-blue-400">{aiInsights.estoque?.length || 0}</span>
                  </p>
                  {aiInsights.estoque?.[0] && (
                    <div className={`p-2 rounded ${
                      aiInsights.estoque[0].priority === 'critical' ? 'bg-red-500/10' :
                      aiInsights.estoque[0].type === 'error' ? 'bg-red-500/10' :
                      'bg-yellow-500/10'
                    }`}>
                      <p className="font-semibold text-aureon-text mb-1">{aiInsights.estoque[0].title}</p>
                      <p className="text-aureon-text/70 text-xs">{aiInsights.estoque[0].message}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Clientes AI */}
              <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={20} className="text-green-400" />
                  <h4 className="text-green-400 font-semibold">Análise de Clientes</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-aureon-text">
                    <strong>Insights:</strong> <span className="text-green-400">{aiInsights.clientes?.length || 0}</span>
                  </p>
                  {aiInsights.clientes?.[0] && (
                    <div className={`p-2 rounded ${
                      aiInsights.clientes[0].type === 'success' ? 'bg-green-500/10' :
                      'bg-yellow-500/10'
                    }`}>
                      <p className="font-semibold text-aureon-text mb-1">{aiInsights.clientes[0].title}</p>
                      <p className="text-aureon-text/70 text-xs">{aiInsights.clientes[0].message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Previsão de Vendas IA */}
            {aiInsights.previsao?.prediction && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-6 shadow-lg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={24} className="text-purple-400" />
                  <h3 className="text-xl font-bold text-purple-400">Previsão de Vendas (30 dias)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-aureon-text/70 mb-2">Cenário Pessimista (-20%)</p>
                    <p className="text-2xl font-bold text-red-400">
                      R$ {(aiInsights.previsao.prediction * 0.8).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-aureon-text/70 mb-2">Cenário Realista</p>
                    <p className="text-3xl font-bold text-aureon-gold">
                      R$ {aiInsights.previsao.prediction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-aureon-text/60 mt-1">
                      Média diária: R$ {aiInsights.previsao.dailyAverage.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-aureon-text/70 mb-2">Cenário Otimista (+20%)</p>
                    <p className="text-2xl font-bold text-green-400">
                      R$ {(aiInsights.previsao.prediction * 1.2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-lg ${
                  aiInsights.previsao.confidence === 'high' ? 'bg-green-500/20 border border-green-500/30' :
                  aiInsights.previsao.confidence === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  'bg-orange-500/20 border border-orange-500/30'
                }`}>
                  <p className="text-sm text-center">
                    <span className="font-semibold">Confiança da Previsão: </span>
                    <span className={
                      aiInsights.previsao.confidence === 'high' ? 'text-green-400' :
                      aiInsights.previsao.confidence === 'medium' ? 'text-yellow-400' :
                      'text-orange-400'
                    }>
                      {aiInsights.previsao.confidence === 'high' ? 'Alta ✓' : 
                       aiInsights.previsao.confidence === 'medium' ? 'Média ~' : 'Baixa ⚠️'}
                    </span>
                    {aiInsights.previsao.growthRate && (
                      <span className={`ml-3 font-bold ${aiInsights.previsao.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Crescimento: {aiInsights.previsao.growthRate >= 0 ? '+' : ''}{aiInsights.previsao.growthRate.toFixed(1)}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Análise Financeira: Gastos x Faturamento x Lucro */}
            <div className="bg-aureon-surface border border-cyan-400/30 rounded-xl p-6 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <DollarSign size={24} className="text-cyan-400" />
                  <h3 className="text-xl font-bold text-cyan-400">Análise Financeira Mensal</h3>
                </div>
                <button
                  onClick={() => setEditDespesas(!editDespesas)}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-all border border-cyan-400/30"
                >
                  {editDespesas ? 'Cancelar' : '+ Adicionar Despesa'}
                </button>
              </div>

              {/* Formulário de Despesa Mensal */}
              {editDespesas && (
                <div className="mb-6 p-4 bg-aureon-bg rounded-lg border border-cyan-400/20">
                  <h4 className="text-sm font-semibold text-cyan-400 mb-3">Registrar Despesa do Mês Atual</h4>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Ex: 5000.00"
                      value={despesaMesAtual}
                      onChange={(e) => setDespesaMesAtual(e.target.value)}
                      className="flex-1 px-4 py-2 bg-aureon-surface border border-cyan-400/30 rounded-lg text-aureon-text placeholder-aureon-text/40 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={handleSaveDespesaMensal}
                      disabled={!despesaMesAtual}
                      className="px-6 py-2 bg-cyan-400 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-all"
                    >
                      Salvar
                    </button>
                  </div>
                  {despesaPrevista > 0 && (
                    <p className="text-xs text-aureon-text/60 mt-2">
                      💡 Sugestão IA: R$ {despesaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      <span className="text-cyan-400 ml-1">(baseado na média dos últimos meses)</span>
                    </p>
                  )}
                </div>
              )}

              {/* Insights de Despesas */}
              {insightsDespesas && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  insightsDespesas.tendencia === 'crescente' ? 'bg-red-500/10 border-red-400/30' :
                  insightsDespesas.tendencia === 'decrescente' ? 'bg-green-500/10 border-green-400/30' :
                  'bg-blue-500/10 border-blue-400/30'
                }`}>
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} className={
                      insightsDespesas.tendencia === 'crescente' ? 'text-red-400' :
                      insightsDespesas.tendencia === 'decrescente' ? 'text-green-400' :
                      'text-blue-400'
                    } />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-aureon-text mb-1">Análise de Despesas</p>
                      <p className="text-xs text-aureon-text/80">{insightsDespesas.insight}</p>
                      {insightsDespesas.percentualSobreFaturamento && (
                        <p className="text-xs text-aureon-text/60 mt-2">
                          📊 Despesas representam <span className="font-bold text-cyan-400">
                            {insightsDespesas.percentualSobreFaturamento}%
                          </span> do faturamento total
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Gráfico Financeiro */}
              {analiseFinanceira.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={analiseFinanceira}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                    <XAxis 
                      dataKey="periodo" 
                      stroke="#F3E5AB" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#F3E5AB" 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0A0A0C', 
                        border: '1px solid #D4AF37',
                        borderRadius: '8px',
                        color: '#F3E5AB'
                      }}
                      formatter={(value, name) => {
                        const labels = {
                          faturamento: 'Faturamento',
                          despesas: 'Despesas',
                          lucro: 'Lucro Bruto',
                          lucroLiquido: 'Lucro Líquido'
                        };
                        return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, labels[name] || name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="faturamento" fill="#D4AF37" name="Faturamento" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                    <Line 
                      type="monotone" 
                      dataKey="lucro" 
                      stroke="#4ade80" 
                      strokeWidth={2}
                      name="Lucro Bruto"
                      dot={{ fill: '#4ade80', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lucroLiquido" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                      name="Lucro Líquido"
                      dot={{ fill: '#60a5fa', r: 4 }}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-aureon-text/50">
                  <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum dado financeiro disponível ainda</p>
                  <p className="text-xs mt-2">Adicione vendas e despesas para visualizar a análise</p>
                </div>
              )}
            </div>

            {/* Recomendações IA */}
            {aiInsights.recomendacoes && aiInsights.recomendacoes.length > 0 && (
              <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 shadow-lg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={24} className="text-aureon-gold" />
                  <h3 className="text-xl font-bold text-aureon-gold">Recomendações Inteligentes</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiInsights.recomendacoes.map((rec, idx) => (
                    <div key={idx} className="bg-aureon-bg p-5 rounded-lg border border-purple-400/20">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-purple-500/20 rounded text-xs font-semibold text-purple-400">
                          {rec.category}
                        </span>
                      </div>
                      <h5 className="text-aureon-gold font-bold mb-2">{rec.title}</h5>
                      <p className="text-aureon-text/80 text-sm mb-3">{rec.description}</p>
                      {rec.actions && rec.actions.length > 0 && (
                        <ul className="space-y-1">
                          {rec.actions.map((action, i) => (
                            <li key={i} className="text-xs text-aureon-text/70 flex items-start gap-2">
                              <span className="text-purple-400">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuração de Metas */}
            <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 shadow-lg mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-aureon-gold font-serif text-lg">Configurar Metas</h3>
                <button
                  onClick={() => editMode ? handleSaveGoals() : setEditMode(true)}
                  className="bg-aureon-gold text-aureon-bg px-4 py-2 rounded-lg font-semibold hover:bg-aureon-text transition-all flex items-center gap-2"
                >
                  {editMode ? (
                    <>
                      <Save size={16} />
                      Salvar Metas
                    </>
                  ) : (
                    'Editar Metas'
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-aureon-text mb-2 font-semibold">Meta Mensal de Vendas (R$)</label>
                  <input
                    type="number"
                    value={goals.metaMensal}
                    onChange={(e) => setGoals({...goals, metaMensal: parseFloat(e.target.value)})}
                    disabled={!editMode}
                    className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-text disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-aureon-text mb-2 font-semibold">Margem Mínima (%)</label>
                  <input
                    type="number"
                    value={goals.margemMinima}
                    onChange={(e) => setGoals({...goals, margemMinima: parseFloat(e.target.value)})}
                    disabled={!editMode}
                    className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-text disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-aureon-text mb-2 font-semibold">Meta de Clientes</label>
                  <input
                    type="number"
                    value={goals.metaClientes}
                    onChange={(e) => setGoals({...goals, metaClientes: parseInt(e.target.value)})}
                    disabled={!editMode}
                    className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-text disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-aureon-text mb-2 font-semibold">Meta de Produtos no Catálogo</label>
                  <input
                    type="number"
                    value={goals.metaProdutos}
                    onChange={(e) => setGoals({...goals, metaProdutos: parseInt(e.target.value)})}
                    disabled={!editMode}
                    className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-text disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Progresso das Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meta de Vendas */}
              <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 shadow-lg">
                <h4 className="text-aureon-text font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-aureon-gold" />
                  Vendas Mensais
                </h4>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Realizado</span>
                    <span className="text-aureon-gold font-bold">
                      R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Meta</span>
                    <span className="text-aureon-text">
                      R$ {goals.metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="w-full h-6 bg-aureon-bg rounded-full overflow-hidden border border-aureon-gold/20">
                  <div
                    className={`h-full flex items-center justify-center text-xs font-bold transition-all ${
                      progress.vendas >= 100 ? 'bg-green-400 text-white' :
                      progress.vendas >= 70 ? 'bg-yellow-400 text-aureon-bg' :
                      'bg-red-400 text-white'
                    }`}
                    style={{ width: `${Math.min(progress.vendas, 100)}%` }}
                  >
                    {progress.vendas >= 15 && `${progress.vendas}%`}
                  </div>
                </div>
                {progress.vendas < 15 && (
                  <p className="text-center text-sm font-bold mt-2 text-red-400">{progress.vendas}%</p>
                )}
              </div>

              {/* Meta de Margem */}
              <div className="bg-aureon-surface border border-green-400/20 rounded-xl p-6 shadow-lg">
                <h4 className="text-aureon-text font-semibold mb-4 flex items-center gap-2">
                  <Target size={18} className="text-green-400" />
                  Margem de Lucro
                </h4>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Margem Atual</span>
                    <span className="text-green-400 font-bold">{progress.margem}%</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Meta Mínima</span>
                    <span className="text-aureon-text">{goals.margemMinima}%</span>
                  </div>
                </div>
                <div className="w-full h-6 bg-aureon-bg rounded-full overflow-hidden border border-green-400/20">
                  <div
                    className={`h-full flex items-center justify-center text-xs font-bold transition-all ${
                      parseFloat(progress.margem) >= goals.margemMinima ? 'bg-green-400 text-white' :
                      parseFloat(progress.margem) >= goals.margemMinima * 0.7 ? 'bg-yellow-400 text-aureon-bg' :
                      'bg-red-400 text-white'
                    }`}
                    style={{ width: `${Math.min((parseFloat(progress.margem) / goals.margemMinima) * 100, 100)}%` }}
                  >
                    {((parseFloat(progress.margem) / goals.margemMinima) * 100) >= 15 && `${((parseFloat(progress.margem) / goals.margemMinima) * 100).toFixed(0)}%`}
                  </div>
                </div>
              </div>

              {/* Meta de Clientes */}
              <div className="bg-aureon-surface border border-blue-400/20 rounded-xl p-6 shadow-lg">
                <h4 className="text-aureon-text font-semibold mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />
                  Clientes Cadastrados
                </h4>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Total</span>
                    <span className="text-blue-400 font-bold">{clientes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Meta</span>
                    <span className="text-aureon-text">{goals.metaClientes}</span>
                  </div>
                </div>
                <div className="w-full h-6 bg-aureon-bg rounded-full overflow-hidden border border-blue-400/20">
                  <div
                    className={`h-full flex items-center justify-center text-xs font-bold transition-all ${
                      progress.clientes >= 100 ? 'bg-blue-400 text-white' :
                      progress.clientes >= 70 ? 'bg-cyan-400 text-aureon-bg' :
                      'bg-blue-600 text-white'
                    }`}
                    style={{ width: `${Math.min(progress.clientes, 100)}%` }}
                  >
                    {progress.clientes >= 15 && `${progress.clientes}%`}
                  </div>
                </div>
              </div>

              {/* Meta de Produtos */}
              <div className="bg-aureon-surface border border-purple-400/20 rounded-xl p-6 shadow-lg">
                <h4 className="text-aureon-text font-semibold mb-4 flex items-center gap-2">
                  <Package size={18} className="text-purple-400" />
                  Produtos no Catálogo
                </h4>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Total</span>
                    <span className="text-purple-400 font-bold">{produtos.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-aureon-text/70">Meta</span>
                    <span className="text-aureon-text">{goals.metaProdutos}</span>
                  </div>
                </div>
                <div className="w-full h-6 bg-aureon-bg rounded-full overflow-hidden border border-purple-400/20">
                  <div
                    className={`h-full flex items-center justify-center text-xs font-bold transition-all ${
                      progress.produtos >= 100 ? 'bg-purple-400 text-white' :
                      progress.produtos >= 70 ? 'bg-purple-300 text-aureon-bg' :
                      'bg-purple-600 text-white'
                    }`}
                    style={{ width: `${Math.min(progress.produtos, 100)}%` }}
                  >
                    {progress.produtos >= 15 && `${progress.produtos}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

