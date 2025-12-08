import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { AlertTriangle, TrendingUp, TrendingDown, Target, CheckCircle, Clock, DollarSign, Package, Users, ShoppingCart, Bell, Award, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { parseDataBR } from '../utils/dateUtils';

/**
 * CENTRO DE COMANDO - Dashboard Executivo CEO
 * Alertas em tempo real + Decisões baseadas em dados + Relatório One-Page
 */
export default function CommandCenter() {
  const { vendas = [], produtos = [], fornecedores = [], clientes = [], despesas = [], config } = useContext(DataContext);
  const [periodoComparativo, setPeriodoComparativo] = useState('mes'); // 'mes' | 'trimestre' | 'ano'

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // ===== ALERTAS CRÍTICOS =====
  const alertasCriticos = useMemo(() => {
    const alertas = [];

    // 1. Produtos sem estoque
    const semEstoque = produtos.filter(p => (p.estoque || 0) === 0);
    if (semEstoque.length > 0) {
      alertas.push({
        id: 1,
        prioridade: 'alta',
        tipo: 'estoque',
        titulo: `${semEstoque.length} produtos sem estoque`,
        descricao: 'Perda potencial de vendas',
        acao: 'Repor estoque urgentemente',
        icon: Package,
        produtos: semEstoque.slice(0, 3).map(p => p.nome)
      });
    }

    // 2. Estoque crítico (< 5 unidades)
    const estoqueBaixo = produtos.filter(p => (p.estoque || 0) > 0 && (p.estoque || 0) < 5);
    if (estoqueBaixo.length > 0) {
      alertas.push({
        id: 2,
        prioridade: 'media',
        tipo: 'estoque',
        titulo: `${estoqueBaixo.length} produtos com estoque baixo`,
        descricao: 'Menos de 5 unidades disponíveis',
        acao: 'Programar reposição',
        icon: AlertTriangle,
        produtos: estoqueBaixo.slice(0, 3).map(p => `${p.nome} (${p.estoque})`)
      });
    }

    // 3. Meta mensal não atingida (últimos 7 dias do mês)
    const diaDoMes = hoje.getDate();
    const ultimosDias = new Date(anoAtual, mesAtual + 1, 0).getDate() - diaDoMes <= 7;
    const totalMes = vendas
      .filter(v => {
        const data = parseDataBR(v.data);
        return data && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      })
      .reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    
    const metaMensal = config?.meta || 50000;
    const atingimento = (totalMes / metaMensal) * 100;
    
    if (ultimosDias && atingimento < 90) {
      alertas.push({
        id: 3,
        prioridade: 'alta',
        tipo: 'vendas',
        titulo: `Meta mensal em ${atingimento.toFixed(0)}%`,
        descricao: `Faltam R$ ${(metaMensal - totalMes).toFixed(2)} para meta`,
        acao: 'Intensificar esforço de vendas',
        icon: Target
      });
    }

    // 4. Clientes inativos (> 60 dias sem comprar)
    const clientesInativos = clientes.filter(cliente => {
      const vendasCliente = vendas.filter(v => v.cliente === cliente.nome);
      if (vendasCliente.length === 0) return true;
      
      const ultimaVenda = vendasCliente[vendasCliente.length - 1];
      const data = parseDataBR(ultimaVenda.data);
      if (!data) return false;
      
      const diasSemComprar = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
      return diasSemComprar > 60;
    });

    if (clientesInativos.length > 5) {
      alertas.push({
        id: 4,
        prioridade: 'media',
        tipo: 'crm',
        titulo: `${clientesInativos.length} clientes inativos`,
        descricao: 'Sem compras há mais de 60 dias',
        acao: 'Campanha de reativação',
        icon: Users
      });
    }

    // 5. Fornecedores sem compras recentes
    const fornecedoresSemCompra = fornecedores.filter(f => {
      const produtosVinculados = produtos.filter(p => p.fornecedorId === f.id);
      return produtosVinculados.length === 0;
    });

    if (fornecedoresSemCompra.length > 0) {
      alertas.push({
        id: 5,
        prioridade: 'baixa',
        tipo: 'compras',
        titulo: `${fornecedoresSemCompra.length} fornecedores sem produtos vinculados`,
        descricao: 'Potencial otimização de fornecedores',
        acao: 'Revisar contratos',
        icon: ShoppingCart
      });
    }

    return alertas.sort((a, b) => {
      const prioridadeMap = { alta: 3, media: 2, baixa: 1 };
      return prioridadeMap[b.prioridade] - prioridadeMap[a.prioridade];
    });
  }, [produtos, vendas, clientes, fornecedores, config]);

  // ===== RELATÓRIO ONE-PAGE =====
  const relatorioExecutivo = useMemo(() => {
    // Período atual
    const vendasMesAtual = vendas.filter(v => {
      const data = parseDataBR(v.data);
      return data && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });

    // Período anterior
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    const vendasMesAnterior = vendas.filter(v => {
      const data = parseDataBR(v.data);
      return data && data.getMonth() === mesAnterior && data.getFullYear() === anoAnterior;
    });

    const receitaAtual = vendasMesAtual.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    const receitaAnterior = vendasMesAnterior.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    const lucroAtual = vendasMesAtual.reduce((acc, v) => acc + (v.lucro || 0), 0);
    const lucroAnterior = vendasMesAnterior.reduce((acc, v) => acc + (v.lucro || 0), 0);

    const ticketMedioAtual = vendasMesAtual.length > 0 ? receitaAtual / vendasMesAtual.length : 0;
    const ticketMedioAnterior = vendasMesAnterior.length > 0 ? receitaAnterior / vendasMesAnterior.length : 0;

    const crescimentoReceita = receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior * 100) : 0;
    const crescimentoLucro = lucroAnterior > 0 ? ((lucroAtual - lucroAnterior) / lucroAnterior * 100) : 0;
    const crescimentoTicket = ticketMedioAnterior > 0 ? ((ticketMedioAtual - ticketMedioAnterior) / ticketMedioAnterior * 100) : 0;

    return {
      receitaAtual,
      receitaAnterior,
      crescimentoReceita,
      lucroAtual,
      lucroAnterior,
      crescimentoLucro,
      ticketMedioAtual,
      ticketMedioAnterior,
      crescimentoTicket,
      qtdVendasAtual: vendasMesAtual.length,
      qtdVendasAnterior: vendasMesAnterior.length,
      crescimentoVendas: vendasMesAnterior.length > 0 ? ((vendasMesAtual.length - vendasMesAnterior.length) / vendasMesAnterior.length * 100) : 0
    };
  }, [vendas, mesAtual, anoAtual]);

  // ===== ANÁLISE PREDITIVA =====
  const previsaoVendas = useMemo(() => {
    if (vendas.length < 30) return { proximos30Dias: 0, tendencia: 'neutro', confianca: 'baixa' };

    // Últimos 30 dias
    const ultimos30Dias = vendas.filter(v => {
      const data = parseDataBR(v.data);
      if (!data) return false;
      const diasAtras = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
      return diasAtras <= 30;
    });

    const mediaUltimos30 = ultimos30Dias.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    
    // Calcular tendência (últimos 15 vs anteriores 15)
    const ultimos15 = ultimos30Dias.slice(0, 15).reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    const anteriores15 = ultimos30Dias.slice(15, 30).reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    
    const variacao = anteriores15 > 0 ? ((ultimos15 - anteriores15) / anteriores15) : 0;
    const tendencia = variacao > 0.1 ? 'alta' : variacao < -0.1 ? 'baixa' : 'estavel';
    
    // Projeção com ajuste de tendência
    const fatorTendencia = tendencia === 'alta' ? 1.1 : tendencia === 'baixa' ? 0.9 : 1;
    const previsao = mediaUltimos30 * fatorTendencia;

    return {
      proximos30Dias: previsao,
      tendencia,
      confianca: ultimos30Dias.length >= 20 ? 'alta' : 'media',
      variacao: (variacao * 100).toFixed(1)
    };
  }, [vendas, hoje]);

  // ===== PRINCIPAIS INDICADORES =====
  const kpisEstrategicos = useMemo(() => {
    const totalVendas = vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    const totalLucro = vendas.reduce((acc, v) => acc + (v.lucro || 0), 0);
    const valorEstoque = produtos.reduce((acc, p) => acc + ((p.estoque || 0) * (p.preco || 0)), 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);

    return {
      roi: valorEstoque > 0 ? ((totalLucro / valorEstoque) * 100).toFixed(1) : 0,
      margemLucro: totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0,
      lucroLiquido: totalLucro - totalDespesas,
      giroEstoque: valorEstoque > 0 ? (totalVendas / valorEstoque).toFixed(2) : 0
    };
  }, [vendas, produtos, despesas]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return { bg: 'from-red-500/20', border: 'border-red-400/40', text: 'text-red-400', badge: 'bg-red-500/20' };
      case 'media': return { bg: 'from-orange-500/20', border: 'border-orange-400/40', text: 'text-orange-400', badge: 'bg-orange-500/20' };
      case 'baixa': return { bg: 'from-blue-500/20', border: 'border-blue-400/40', text: 'text-blue-400', badge: 'bg-blue-500/20' };
      default: return { bg: 'from-aureon-muted/20', border: 'border-aureon-muted/40', text: 'text-aureon-muted', badge: 'bg-aureon-muted/20' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-aureon-gold mb-2 flex items-center gap-3">
            <Award size={36} />
            Centro de Comando - CEO
          </h1>
          <p className="text-aureon-text/70">
            Visão estratégica completa • Alertas em tempo real • Decisões baseadas em dados
          </p>
        </div>

        {/* Alertas Críticos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif text-aureon-gold flex items-center gap-2">
              <Bell size={24} />
              Alertas Prioritários ({alertasCriticos.length})
            </h2>
            <span className="px-3 py-1 bg-aureon-gold/20 text-aureon-gold rounded-full text-sm font-semibold">
              Atualização: Tempo Real
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {alertasCriticos.length === 0 ? (
              <div className="bg-gradient-to-br from-green-500/10 to-aureon-surface border border-green-400/30 rounded-xl p-8 text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Sistema Operando Normalmente</h3>
                <p className="text-aureon-text/70">Nenhum alerta crítico no momento</p>
              </div>
            ) : (
              alertasCriticos.map(alerta => {
                const colors = getPrioridadeColor(alerta.prioridade);
                const Icon = alerta.icon;
                
                return (
                  <div
                    key={alerta.id}
                    className={`bg-gradient-to-br ${colors.bg} to-aureon-surface border ${colors.border} rounded-xl p-6 transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 ${colors.badge} rounded-lg`}>
                          <Icon size={24} className={colors.text} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-lg font-bold ${colors.text}`}>{alerta.titulo}</h3>
                            <span className={`px-2 py-0.5 ${colors.badge} ${colors.text} rounded-full text-xs font-semibold uppercase`}>
                              {alerta.prioridade}
                            </span>
                          </div>
                          <p className="text-aureon-text mb-2">{alerta.descricao}</p>
                          {alerta.produtos && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {alerta.produtos.map((prod, idx) => (
                                <span key={idx} className="px-2 py-1 bg-aureon-surface border border-aureon-gold/20 rounded text-xs text-aureon-text">
                                  {prod}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className={`w-full px-4 py-2 ${colors.badge} ${colors.text} border ${colors.border} rounded-lg font-semibold hover:bg-opacity-30 transition-all flex items-center justify-center gap-2`}>
                      {alerta.acao}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Relatório One-Page */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-serif text-aureon-gold mb-6 flex items-center gap-2">
            <TrendingUp size={24} />
            Relatório Executivo - Mês Atual
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Receita */}
            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-aureon-bg border border-aureon-gold/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-aureon-text/70">Receita</span>
                <DollarSign size={20} className="text-aureon-gold" />
              </div>
              <p className="text-3xl font-bold text-aureon-gold mb-2">
                {formatCurrency(relatorioExecutivo.receitaAtual)}
              </p>
              <div className="flex items-center gap-2">
                {relatorioExecutivo.crescimentoReceita >= 0 ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <span className={`text-sm font-semibold ${relatorioExecutivo.crescimentoReceita >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {relatorioExecutivo.crescimentoReceita.toFixed(1)}% vs mês anterior
                </span>
              </div>
              <p className="text-xs text-aureon-text/50 mt-1">Anterior: {formatCurrency(relatorioExecutivo.receitaAnterior)}</p>
            </div>

            {/* Lucro */}
            <div className="bg-gradient-to-br from-green-500/10 to-aureon-bg border border-green-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-aureon-text/70">Lucro</span>
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400 mb-2">
                {formatCurrency(relatorioExecutivo.lucroAtual)}
              </p>
              <div className="flex items-center gap-2">
                {relatorioExecutivo.crescimentoLucro >= 0 ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <span className={`text-sm font-semibold ${relatorioExecutivo.crescimentoLucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {relatorioExecutivo.crescimentoLucro.toFixed(1)}% vs mês anterior
                </span>
              </div>
              <p className="text-xs text-aureon-text/50 mt-1">Anterior: {formatCurrency(relatorioExecutivo.lucroAnterior)}</p>
            </div>

            {/* Ticket Médio */}
            <div className="bg-gradient-to-br from-blue-500/10 to-aureon-bg border border-blue-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-aureon-text/70">Ticket Médio</span>
                <ShoppingCart size={20} className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-400 mb-2">
                {formatCurrency(relatorioExecutivo.ticketMedioAtual)}
              </p>
              <div className="flex items-center gap-2">
                {relatorioExecutivo.crescimentoTicket >= 0 ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <span className={`text-sm font-semibold ${relatorioExecutivo.crescimentoTicket >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {relatorioExecutivo.crescimentoTicket.toFixed(1)}% vs mês anterior
                </span>
              </div>
              <p className="text-xs text-aureon-text/50 mt-1">Anterior: {formatCurrency(relatorioExecutivo.ticketMedioAnterior)}</p>
            </div>

            {/* Quantidade de Vendas */}
            <div className="bg-gradient-to-br from-purple-500/10 to-aureon-bg border border-purple-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-aureon-text/70">Vendas</span>
                <Package size={20} className="text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-purple-400 mb-2">
                {relatorioExecutivo.qtdVendasAtual}
              </p>
              <div className="flex items-center gap-2">
                {relatorioExecutivo.crescimentoVendas >= 0 ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <span className={`text-sm font-semibold ${relatorioExecutivo.crescimentoVendas >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {relatorioExecutivo.crescimentoVendas.toFixed(1)}% vs mês anterior
                </span>
              </div>
              <p className="text-xs text-aureon-text/50 mt-1">Anterior: {relatorioExecutivo.qtdVendasAnterior} vendas</p>
            </div>
          </div>

          {/* KPIs Estratégicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4">
              <p className="text-xs text-aureon-text/70 mb-1">ROI</p>
              <p className="text-2xl font-bold text-aureon-gold">{kpisEstrategicos.roi}%</p>
            </div>
            <div className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4">
              <p className="text-xs text-aureon-text/70 mb-1">Margem de Lucro</p>
              <p className="text-2xl font-bold text-aureon-gold">{kpisEstrategicos.margemLucro}%</p>
            </div>
            <div className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4">
              <p className="text-xs text-aureon-text/70 mb-1">Lucro Líquido</p>
              <p className="text-2xl font-bold text-aureon-gold">{formatCurrency(kpisEstrategicos.lucroLiquido)}</p>
            </div>
            <div className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4">
              <p className="text-xs text-aureon-text/70 mb-1">Giro de Estoque</p>
              <p className="text-2xl font-bold text-aureon-gold">{kpisEstrategicos.giroEstoque}x</p>
            </div>
          </div>
        </div>

        {/* Previsão de Vendas */}
        <div className="bg-gradient-to-br from-purple-500/10 to-aureon-surface border border-purple-400/30 rounded-xl p-8">
          <h2 className="text-2xl font-serif text-purple-400 mb-6 flex items-center gap-2">
            <Clock size={24} />
            Análise Preditiva - Próximos 30 Dias
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-aureon-text/70 mb-2">Previsão de Vendas</p>
              <p className="text-4xl font-bold text-purple-400 mb-1">{formatCurrency(previsaoVendas.proximos30Dias)}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                previsaoVendas.confianca === 'alta' ? 'bg-green-500/20 text-green-400' : 
                previsaoVendas.confianca === 'media' ? 'bg-orange-500/20 text-orange-400' : 
                'bg-red-500/20 text-red-400'
              }`}>
                Confiança: {previsaoVendas.confianca.toUpperCase()}
              </span>
            </div>

            <div>
              <p className="text-sm text-aureon-text/70 mb-2">Tendência</p>
              <div className="flex items-center gap-3 mb-2">
                {previsaoVendas.tendencia === 'alta' ? (
                  <TrendingUp size={48} className="text-green-400" />
                ) : previsaoVendas.tendencia === 'baixa' ? (
                  <TrendingDown size={48} className="text-red-400" />
                ) : (
                  <div className="w-12 h-1 bg-aureon-gold rounded"></div>
                )}
                <div>
                  <p className={`text-2xl font-bold ${
                    previsaoVendas.tendencia === 'alta' ? 'text-green-400' : 
                    previsaoVendas.tendencia === 'baixa' ? 'text-red-400' : 
                    'text-aureon-gold'
                  }`}>
                    {previsaoVendas.tendencia === 'alta' ? 'Em Alta' : 
                     previsaoVendas.tendencia === 'baixa' ? 'Em Baixa' : 'Estável'}
                  </p>
                  <p className="text-sm text-aureon-text/70">{previsaoVendas.variacao}% de variação</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-aureon-text/70 mb-2">Recomendação Estratégica</p>
              <div className="bg-aureon-surface border border-aureon-gold/20 rounded-lg p-4">
                <p className="text-aureon-text text-sm">
                  {previsaoVendas.tendencia === 'alta' 
                    ? '✅ Aumentar estoque dos produtos top. Manter estratégia atual.'
                    : previsaoVendas.tendencia === 'baixa'
                    ? '⚠️ Intensificar marketing. Revisar preços e produtos.'
                    : '📊 Manter operação normal. Monitorar semanalmente.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

