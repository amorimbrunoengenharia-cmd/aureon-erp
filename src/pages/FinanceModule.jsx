import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useSimulation } from '../context/SimulationContext';
import { useAuth } from '../context/AuthContextAPI';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, CreditCard, FileText, PieChart, Calendar, Download, Building2, BarChart3, Sparkles } from 'lucide-react';
import ExpensesManager from './ExpensesManager';
import ReceivablesManager from './ReceivablesManager';
import BankAccountsManager from './BankAccountsManager';
import DREReport from './DREReport';
import { executarCenarioFinanceiro } from '../services/SimulationSeederService';

/**
 * Módulo Financeiro - Dashboard Principal
 * Contas a Pagar, Contas a Receber, Fluxo de Caixa, DRE
 */
export default function FinanceModule() {
  const { currentUser } = useAuth();
  const { isSimulationMode } = useSimulation();
  const {
    despesas,
    contasReceber,
    contasBancarias,
    calcularSaldoTotal,
    calcularDespesasPendentes,
    calcularRecebivesPendentes,
    getDespesasVencendo,
    addDespesa,
    addContaReceber,
    addContaBancaria
  } = useFinance();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | despesas | receber | bancos | dre
  const [loadingSimulation, setLoadingSimulation] = useState(false);

  // ============================================
  // SIMULAÇÃO FINANCEIRA (CEO Only)
  // ============================================

  const handleSimulacaoFinanceira = async () => {
    if (!isSimulationMode) {
      alert('⚠️ Ative o Modo Simulação primeiro!\n\nVá até o Dashboard CEO e clique em "Modo Simulação".');
      return;
    }

    setLoadingSimulation(true);
    try {
      const financeContext = {
        addDespesa,
        addContaReceber,
        addContaBancaria
      };

      await executarCenarioFinanceiro(financeContext);
      
      alert('✅ Simulação Financeira completa concluída!\n\n📊 Dados criados:\n- 3 contas bancárias\n- 30 despesas (últimos 3 meses)\n- 24 contas a receber\n\nAtualize a página para ver os dados!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ Erro na simulação:', error);
      alert('❌ Erro ao executar simulação: ' + error.message);
    } finally {
      setLoadingSimulation(false);
    }
  };

  // ============================================
  // CÁLCULOS (SEMPRE executar hooks antes de qualquer return condicional)
  // ============================================
  
  const saldoTotal = useMemo(() => calcularSaldoTotal(), [calcularSaldoTotal, contasBancarias]);
  const despesasPendentes = useMemo(() => calcularDespesasPendentes(), [calcularDespesasPendentes, despesas]);
  const recebiveisPendentes = useMemo(() => calcularRecebivesPendentes(), [calcularRecebivesPendentes, contasReceber]);
  const despesasVencendo = useMemo(() => getDespesasVencendo(7), [getDespesasVencendo, despesas]);

  // Projeção de caixa simplificada (7 dias)
  const projecaoCaixa = useMemo(() => {
    const hoje = new Date();
    const proximosDias = [];
    
    for (let i = 0; i < 7; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      
      // Entradas previstas
      const entradasDia = contasReceber
        .flatMap(c => c.parcelas)
        .filter(p => p.dataVencimento === dataStr && p.status === 'pendente')
        .reduce((total, p) => total + p.valor, 0);
      
      // Saídas previstas
      const saidasDia = despesas
        .filter(d => d.dataVencimento === dataStr && d.status === 'pendente')
        .reduce((total, d) => total + d.valor, 0);
      
      proximosDias.push({
        data: dataStr,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo: (proximosDias[i - 1]?.saldo || saldoTotal) + entradasDia - saidasDia
      });
    }
    
    return proximosDias;
  }, [saldoTotal, contasReceber, despesas]);

  // Alerta de caixa baixo
  const alertaCaixaBaixo = saldoTotal < (despesasPendentes * 0.2);

  // ============================================
  // FORMATADORES
  // ============================================
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  // ============================================
  // RENDER DASHBOARD
  // ============================================
  
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`bg-gradient-to-br ${alertaCaixaBaixo ? 'from-red-400/20 border-red-400/30' : 'from-green-400/20 border-green-400/30'} to-aureon-bg border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Saldo em Caixa</span>
            <DollarSign size={20} className={alertaCaixaBaixo ? 'text-red-400' : 'text-green-400'} />
          </div>
          <p className={`text-3xl font-bold ${alertaCaixaBaixo ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(saldoTotal)}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">
            {contasBancarias.filter(c => c.ativo).length} conta(s)
          </p>
          {alertaCaixaBaixo && (
            <div className="mt-2 flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle size={12} />
              <span>Saldo baixo!</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">A Receber (30d)</span>
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {formatCurrency(recebiveisPendentes)}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">
            {contasReceber.filter(c => c.statusGeral !== 'recebido').length} pendente(s)
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-400/20 to-aureon-bg border border-red-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">A Pagar</span>
            <TrendingDown size={20} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">
            {formatCurrency(despesasPendentes)}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">
            {despesas.filter(d => d.status === 'pendente' || d.status === 'vencido').length} pendente(s)
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-400/20 to-aureon-bg border border-purple-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Projeção 7 dias</span>
            <Calendar size={20} className="text-purple-400" />
          </div>
          <p className={`text-3xl font-bold ${projecaoCaixa[6]?.saldo >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
            {formatCurrency(projecaoCaixa[6]?.saldo || 0)}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">
            {projecaoCaixa[6]?.saldo >= saldoTotal ? '↗' : '↘'} {Math.abs(((projecaoCaixa[6]?.saldo - saldoTotal) / saldoTotal * 100) || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Alertas */}
      {(alertaCaixaBaixo || despesasVencendo.length > 0) && (
        <div className="bg-aureon-surface border border-orange-400/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-400">Alertas Financeiros</h3>
          </div>
          <div className="space-y-2">
            {alertaCaixaBaixo && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3">
                <p className="text-red-400 font-semibold">🔴 Saldo em caixa abaixo do mínimo recomendado</p>
                <p className="text-aureon-text/70 text-sm mt-1">
                  Saldo atual representa apenas {((saldoTotal / despesasPendentes) * 100).toFixed(0)}% das despesas pendentes.
                </p>
              </div>
            )}
            {despesasVencendo.length > 0 && (
              <div className="bg-orange-400/10 border border-orange-400/30 rounded-lg p-3">
                <p className="text-orange-400 font-semibold">🟡 {despesasVencendo.length} despesa(s) vencendo em 7 dias</p>
                <p className="text-aureon-text/70 text-sm mt-1">
                  Total: {formatCurrency(despesasVencendo.reduce((acc, d) => acc + d.valor, 0))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fluxo de Caixa (7 dias) */}
      <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
        <h3 className="text-aureon-gold font-serif text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Fluxo de Caixa - Próximos 7 dias
        </h3>
        <div className="space-y-2">
          {projecaoCaixa.map((dia, index) => (
            <div key={index} className="bg-aureon-bg border border-aureon-gold/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-aureon-text font-semibold">{formatDate(dia.data)}</p>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-green-400">↗ {formatCurrency(dia.entradas)}</span>
                    <span className="text-red-400">↘ {formatCurrency(dia.saidas)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${dia.saldo >= 0 ? 'text-aureon-gold' : 'text-red-400'}`}>
                    {formatCurrency(dia.saldo)}
                  </p>
                  {dia.saldo < 0 && (
                    <span className="text-red-400 text-xs flex items-center gap-1 justify-end">
                      <AlertCircle size={12} />
                      Negativo!
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('despesas')}
          className="bg-aureon-surface border-2 border-aureon-gold/30 hover:border-aureon-gold rounded-xl p-6 transition-all text-left"
        >
          <FileText size={24} className="text-aureon-gold mb-2" />
          <h4 className="text-aureon-text font-semibold">Contas a Pagar</h4>
          <p className="text-aureon-text/60 text-sm mt-1">Gerenciar despesas</p>
        </button>

        <button
          onClick={() => setActiveTab('receber')}
          className="bg-aureon-surface border-2 border-blue-400/30 hover:border-blue-400 rounded-xl p-6 transition-all text-left"
        >
          <CreditCard size={24} className="text-blue-400 mb-2" />
          <h4 className="text-aureon-text font-semibold">Contas a Receber</h4>
          <p className="text-aureon-text/60 text-sm mt-1">Gerenciar recebíveis</p>
        </button>

        <button
          onClick={() => setActiveTab('bancos')}
          className="bg-aureon-surface border-2 border-green-400/30 hover:border-green-400 rounded-xl p-6 transition-all text-left"
        >
          <DollarSign size={24} className="text-green-400 mb-2" />
          <h4 className="text-aureon-text font-semibold">Contas Bancárias</h4>
          <p className="text-aureon-text/60 text-sm mt-1">Gerenciar contas</p>
        </button>

        <button
          onClick={() => setActiveTab('dre')}
          className="bg-aureon-surface border-2 border-purple-400/30 hover:border-purple-400 rounded-xl p-6 transition-all text-left"
        >
          <PieChart size={24} className="text-purple-400 mb-2" />
          <h4 className="text-aureon-text font-semibold">DRE</h4>
          <p className="text-aureon-text/60 text-sm mt-1">Demonstração resultados</p>
        </button>
      </div>
    </div>
  );

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-aureon-purple font-serif flex items-center gap-2">
            <DollarSign size={28} />
            Módulo Financeiro
          </h1>
          
          {/* Botão de Simulação ao lado do título */}
          <button
            onClick={handleSimulacaoFinanceira}
            disabled={loadingSimulation || !isSimulationMode}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30"
            title={!isSimulationMode ? 'Ative o Modo Simulação primeiro' : 'Clique para gerar dados de teste'}
          >
            <Sparkles size={20} />
            {loadingSimulation ? 'Gerando Dados...' : '✨ Executar Simulação Financeira'}
          </button>
        </div>
        <p className="text-aureon-text/70 text-sm">
          Gestão completa de finanças, contas a pagar e receber
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-aureon-purple text-white'
                : 'bg-aureon-surface text-aureon-text border border-aureon-purple/30 hover:border-aureon-purple'
            }`}
          >
            <PieChart size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('despesas')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'despesas'
                ? 'bg-aureon-purple text-white'
                : 'bg-aureon-surface text-aureon-text border border-aureon-purple/30 hover:border-aureon-purple'
            }`}
          >
            <FileText size={18} />
            Contas a Pagar
          </button>
          <button
            onClick={() => setActiveTab('receber')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'receber'
                ? 'bg-aureon-purple text-white'
                : 'bg-aureon-surface text-aureon-text border border-aureon-purple/30 hover:border-aureon-purple'
            }`}
          >
            <CreditCard size={18} />
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveTab('bancos')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'bancos'
                ? 'bg-aureon-purple text-white'
                : 'bg-aureon-surface text-aureon-text border border-aureon-purple/30 hover:border-aureon-purple'
            }`}
          >
            <Building2 size={18} />
            Contas Bancárias
          </button>
          <button
            onClick={() => setActiveTab('dre')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'dre'
                ? 'bg-aureon-purple text-white'
                : 'bg-aureon-surface text-aureon-text border border-aureon-purple/30 hover:border-aureon-purple'
            }`}
          >
            <BarChart3 size={18} />
            DRE
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'despesas' && <ExpensesManager />}
      {activeTab === 'receber' && <ReceivablesManager />}
      {activeTab === 'bancos' && <BankAccountsManager />}
      {activeTab === 'dre' && <DREReport />}
    </div>
  );
}

