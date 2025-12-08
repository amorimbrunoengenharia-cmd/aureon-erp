import React, { useState, useMemo, useContext } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DataContext } from '../context/DataContext';
import { Plus, Search, Filter, Download, DollarSign, AlertCircle, Check, Edit2, Trash2, TrendingDown, Calendar } from 'lucide-react';

/**
 * Gerenciador de Contas a Receber
 * Gestão de recebíveis com parcelas + Antecipação
 */
export default function ReceivablesManager() {
  const {
    contasReceber,
    addContaReceber,
    updateContaReceber,
    receberParcela
  } = useFinance();

  const { clientes, vendas } = useContext(DataContext);

  const [showModal, setShowModal] = useState(false);
  const [showAntecipacaoModal, setShowAntecipacaoModal] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas'); // todas | pendente | recebido_parcial | recebido_total | vencido
  const [sortBy, setSortBy] = useState('vencimento'); // vencimento | valor | cliente

  const [formData, setFormData] = useState({
    clienteId: '',
    descricao: '',
    valorTotal: '',
    dataEmissao: '',
    numeroParcelas: '1',
    diaVencimento: '10',
    observacoes: ''
  });

  const [antecipacaoData, setAntecipacaoData] = useState({
    valorAntecipado: '',
    taxaMensal: '2.5',
    dataAntecipacao: new Date().toISOString().split('T')[0]
  });

  // ============================================
  // FILTROS E CÁLCULOS
  // ============================================
  
  const contasFiltradas = useMemo(() => {
    let resultado = [...contasReceber];

    // Busca por texto
    if (searchTerm) {
      resultado = resultado.filter(c => {
        const cliente = clientes.find(cli => cli.id === c.clienteId);
        const clienteNome = cliente?.nome || '';
        return (
          clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filtro por status
    if (filterStatus !== 'todas') {
      if (filterStatus === 'vencido') {
        resultado = resultado.filter(c => {
          if (!c.parcelas || !Array.isArray(c.parcelas)) return false;
          const hoje = new Date();
          return c.parcelas.some(p => {
            const vencimento = new Date(p.dataVencimento + 'T00:00:00');
            return p.status === 'pendente' && vencimento < hoje;
          });
        });
      } else {
        resultado = resultado.filter(c => c.status === filterStatus);
      }
    }

    // Ordenação
    resultado.sort((a, b) => {
      if (sortBy === 'vencimento') {
        const parcelasA = Array.isArray(a.parcelas) ? a.parcelas : [];
        const parcelasB = Array.isArray(b.parcelas) ? b.parcelas : [];
        const proximoVencA = parcelasA.find(p => p.status === 'pendente')?.dataVencimento || '9999-12-31';
        const proximoVencB = parcelasB.find(p => p.status === 'pendente')?.dataVencimento || '9999-12-31';
        return proximoVencA.localeCompare(proximoVencB);
      } else if (sortBy === 'valor') {
        return b.valorTotal - a.valorTotal;
      } else if (sortBy === 'cliente') {
        const nomeA = clientes.find(c => c.id === a.clienteId)?.nome || '';
        const nomeB = clientes.find(c => c.id === b.clienteId)?.nome || '';
        return nomeA.localeCompare(nomeB);
      }
      return 0;
    });

    return resultado;
  }, [contasReceber, searchTerm, filterStatus, sortBy, clientes]);

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = new Date();
    
    const totalPendente = contasReceber.reduce((sum, c) => {
      if (!c.parcelas || !Array.isArray(c.parcelas)) return sum;
      const pendente = c.parcelas
        .filter(p => p.status === 'pendente')
        .reduce((s, p) => s + p.valor, 0);
      return sum + pendente;
    }, 0);
    
    const totalRecebido = contasReceber.reduce((sum, c) => {
      if (!c.parcelas || !Array.isArray(c.parcelas)) return sum;
      const recebido = c.parcelas
        .filter(p => p.status === 'recebido')
        .reduce((s, p) => s + p.valor, 0);
      return sum + recebido;
    }, 0);
    
    const parcelasVencidas = contasReceber
      .filter(c => c.parcelas && Array.isArray(c.parcelas))
      .flatMap(c => c.parcelas)
      .filter(p => {
        if (p.status !== 'pendente') return false;
        const vencimento = new Date(p.dataVencimento + 'T00:00:00');
        return vencimento < hoje;
      });
    
    const vencendoEm7Dias = contasReceber
      .filter(c => c.parcelas && Array.isArray(c.parcelas))
      .flatMap(c => c.parcelas)
      .filter(p => {
        if (p.status !== 'pendente') return false;
        const vencimento = new Date(p.dataVencimento + 'T00:00:00');
      const em7Dias = new Date(hoje);
      em7Dias.setDate(em7Dias.getDate() + 7);
      return vencimento >= hoje && vencimento <= em7Dias;
    });

    return {
      totalPendente,
      totalRecebido,
      parcelasVencidas: parcelasVencidas.length,
      totalVencidas: parcelasVencidas.reduce((s, p) => s + p.valor, 0),
      vencendoEm7Dias: vencendoEm7Dias.length,
      totalVencendo7Dias: vencendoEm7Dias.reduce((s, p) => s + p.valor, 0)
    };
  }, [contasReceber]);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleSubmit = (e) => {
    e.preventDefault();

    const valorTotal = parseFloat(formData.valorTotal);
    const numParcelas = parseInt(formData.numeroParcelas);
    const valorParcela = valorTotal / numParcelas;

    // Gerar parcelas
    const parcelas = [];
    const dataBase = new Date(formData.dataEmissao + 'T00:00:00');
    
    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(dataBase);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      dataVencimento.setDate(parseInt(formData.diaVencimento));
      
      parcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente',
        dataPagamento: null
      });
    }

    const conta = {
      clienteId: parseInt(formData.clienteId),
      descricao: formData.descricao,
      valorTotal,
      dataEmissao: formData.dataEmissao,
      observacoes: formData.observacoes || '',
      parcelas,
      status: 'pendente'
    };

    addContaReceber(conta);
    resetForm();
  };

  const handleReceberParcela = (contaId, parcelaIndex, contaBancariaId = null) => {
    receberParcela(contaId, parcelaIndex, contaBancariaId);
  };

  const handleAbrirAntecipacao = (conta) => {
    setSelectedConta(conta);
    const pendente = conta.parcelas
      .filter(p => p.status === 'pendente')
      .reduce((s, p) => s + p.valor, 0);
    setAntecipacaoData(prev => ({ ...prev, valorAntecipado: pendente.toString() }));
    setShowAntecipacaoModal(true);
  };

  const calcularAntecipacao = () => {
    const valor = parseFloat(antecipacaoData.valorAntecipado);
    const taxa = parseFloat(antecipacaoData.taxaMensal) / 100;
    const hoje = new Date(antecipacaoData.dataAntecipacao);
    
    if (!selectedConta) return null;
    if (!selectedConta.parcelas || !Array.isArray(selectedConta.parcelas)) return null;

    const parcelasPendentes = selectedConta.parcelas.filter(p => p.status === 'pendente');
    let descontoTotal = 0;

    parcelasPendentes.forEach(parcela => {
      const vencimento = new Date(parcela.dataVencimento + 'T00:00:00');
      const diasAntecipacao = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
      const mesesAntecipacao = diasAntecipacao / 30;
      const desconto = parcela.valor * taxa * mesesAntecipacao;
      descontoTotal += desconto;
    });

    const valorLiquido = valor - descontoTotal;
    const taxaEfetiva = (descontoTotal / valor) * 100;

    return {
      valorBruto: valor,
      desconto: descontoTotal,
      valorLiquido,
      taxaEfetiva
    };
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      descricao: '',
      valorTotal: '',
      dataEmissao: '',
      numeroParcelas: '1',
      diaVencimento: '10',
      observacoes: ''
    });
    setShowModal(false);
  };

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

  const getStatusBadge = (conta) => {
    if (conta.status === 'recebido_total') {
      return <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full">Recebido</span>;
    }
    if (conta.status === 'recebido_parcial') {
      return <span className="px-2 py-1 bg-blue-400/20 text-blue-400 text-xs rounded-full">Parcial</span>;
    }
    
    const hoje = new Date();
    if (!conta.parcelas || !Array.isArray(conta.parcelas)) return <span className="px-2 py-1 bg-aureon-muted/20 text-aureon-muted text-xs rounded-full">N/A</span>;
    const temVencida = conta.parcelas.some(p => {
      if (p.status !== 'pendente') return false;
      const vencimento = new Date(p.dataVencimento + 'T00:00:00');
      return vencimento < hoje;
    });
    
    if (temVencida) {
      return <span className="px-2 py-1 bg-red-400/20 text-red-400 text-xs rounded-full">Vencido</span>;
    }
    
    return <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs rounded-full">Pendente</span>;
  };

  const getParcelaStatusBadge = (parcela) => {
    if (parcela.status === 'recebido') {
      return <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full">Recebido</span>;
    }
    
    const hoje = new Date();
    const vencimento = new Date(parcela.dataVencimento + 'T00:00:00');
    
    if (vencimento < hoje) {
      return <span className="px-2 py-1 bg-red-400/20 text-red-400 text-xs rounded-full">Vencido</span>;
    }
    
    return <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs rounded-full">Pendente</span>;
  };

  const getClienteNome = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || `Cliente #${clienteId}`;
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="p-6 bg-aureon-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-aureon-purple mb-2">Contas a Receber</h1>
          <p className="text-aureon-text/70">Gerenciamento de recebíveis e parcelas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-[#8B5CF6]/30 transition-all"
        >
          <Plus size={20} />
          Nova Conta
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-aureon-surface border border-yellow-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Total a Receber</span>
            <AlertCircle size={18} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.totalPendente)}</p>
        </div>

        <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Total Recebido</span>
            <Check size={18} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalRecebido)}</p>
        </div>

        <div className="bg-aureon-surface border border-red-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Parcelas Vencidas</span>
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {stats.parcelasVencidas} ({formatCurrency(stats.totalVencidas)})
          </p>
        </div>

        <div className="bg-aureon-surface border border-orange-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Vence em 7 dias</span>
            <Calendar size={18} className="text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">
            {stats.vencendoEm7Dias} ({formatCurrency(stats.totalVencendo7Dias)})
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-aureon-text/50" />
            <input
              type="text"
              placeholder="Buscar por cliente ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-aureon-bg border border-aureon-purple/20 rounded-lg pl-10 pr-4 py-2 text-aureon-text placeholder-[var(--aureon-text)]/30 focus:outline-none focus:border-aureon-purple"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-aureon-bg border border-aureon-purple/20 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
          >
            <option value="todas">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="recebido_parcial">Recebido Parcial</option>
            <option value="recebido_total">Recebido Total</option>
            <option value="vencido">Vencido</option>
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-aureon-bg border border-aureon-purple/20 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
          >
            <option value="vencimento">Ordenar por Vencimento</option>
            <option value="valor">Ordenar por Valor</option>
            <option value="cliente">Ordenar por Cliente</option>
          </select>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="space-y-4">
        {contasFiltradas.length === 0 ? (
          <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-8 text-center text-aureon-text/50">
            Nenhuma conta a receber encontrada
          </div>
        ) : (
          contasFiltradas.map(conta => {
            const parcelas = conta.parcelas && Array.isArray(conta.parcelas) ? conta.parcelas : [];
            const totalRecebido = parcelas.filter(p => p.status === 'recebido').length;
            const totalParcelas = parcelas.length;
            const progressoRecebimento = totalParcelas > 0 ? (totalRecebido / totalParcelas) * 100 : 0;

            return (
              <div key={conta.id} className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6">
                {/* Header da Conta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-aureon-text">{getClienteNome(conta.clienteId)}</h3>
                      {getStatusBadge(conta)}
                    </div>
                    <p className="text-sm text-aureon-text/70 mb-1">{conta.descricao}</p>
                    <div className="flex items-center gap-4 text-xs text-aureon-text/60">
                      <span>Emissão: {formatDate(conta.dataEmissao)}</span>
                      <span>•</span>
                      <span>Total: {formatCurrency(conta.valorTotal)}</span>
                      <span>•</span>
                      <span>{totalParcelas}x de {formatCurrency(conta.valorTotal / totalParcelas)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAbrirAntecipacao(conta)}
                    className="flex items-center gap-2 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/30 text-blue-400 px-4 py-2 rounded-lg transition-colors text-sm"
                    disabled={conta.status === 'recebido_total'}
                  >
                    <TrendingDown size={16} />
                    Antecipar
                  </button>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-aureon-text/70 mb-1">
                    <span>Progresso do Recebimento</span>
                    <span>{totalRecebido}/{totalParcelas} parcelas</span>
                  </div>
                  <div className="h-2 bg-aureon-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
                      style={{ width: `${progressoRecebimento}%` }}
                    />
                  </div>
                </div>

                {/* Tabela de Parcelas */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-aureon-purple/10 border-b border-aureon-purple/30">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-aureon-purple">Parcela</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-aureon-purple">Vencimento</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-aureon-purple">Valor</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-aureon-purple">Status</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-aureon-purple">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8B5CF6]/10">
                      {(conta.parcelas && Array.isArray(conta.parcelas) ? conta.parcelas : []).map((parcela, index) => (
                        <tr key={index} className="hover:bg-aureon-purple/5 transition-colors">
                          <td className="px-3 py-2 text-sm text-aureon-text">{parcela.numero}/{totalParcelas}</td>
                          <td className="px-3 py-2 text-sm text-aureon-text">{formatDate(parcela.dataVencimento)}</td>
                          <td className="px-3 py-2 text-sm text-right font-semibold text-aureon-text">
                            {formatCurrency(parcela.valor)}
                          </td>
                          <td className="px-3 py-2 text-center">{getParcelaStatusBadge(parcela)}</td>
                          <td className="px-3 py-2 text-center">
                            {parcela.status === 'pendente' ? (
                              <button
                                onClick={() => handleReceberParcela(conta.id, index)}
                                className="p-2 bg-green-400/10 hover:bg-green-400/20 text-green-400 rounded-lg transition-colors"
                                title="Registrar recebimento"
                              >
                                <Check size={16} />
                              </button>
                            ) : (
                              <span className="text-xs text-aureon-text/50">
                                {formatDate(parcela.dataPagamento)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Nova Conta */}
      {showModal && (
        <div className="fixed inset-0 bg-aureon-bg/90 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-aureon-purple mb-6">Nova Conta a Receber</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Cliente *</label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Venda de produtos, Serviço prestado..."
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor Total */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Valor Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorTotal}
                    onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>

                {/* Data Emissão */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Data Emissão *</label>
                  <input
                    type="date"
                    value={formData.dataEmissao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número de Parcelas */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Número de Parcelas *</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={formData.numeroParcelas}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroParcelas: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>

                {/* Dia Vencimento */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Dia do Vencimento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.diaVencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, diaVencimento: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>
              </div>

              {/* Preview das Parcelas */}
              {formData.valorTotal && formData.numeroParcelas && (
                <div className="bg-aureon-purple/5 border border-aureon-purple/20 rounded-lg p-4">
                  <p className="text-sm text-aureon-text/70 mb-2">Preview:</p>
                  <p className="text-aureon-text">
                    {formData.numeroParcelas}x de {formatCurrency(parseFloat(formData.valorTotal) / parseInt(formData.numeroParcelas))}
                  </p>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  rows="3"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-aureon-bg border border-aureon-purple/30 text-aureon-text px-6 py-3 rounded-lg hover:bg-aureon-purple/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-[#8B5CF6]/30 transition-all"
                >
                  Cadastrar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Antecipação */}
      {showAntecipacaoModal && selectedConta && (
        <div className="fixed inset-0 bg-aureon-bg/90 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-aureon-purple mb-4">Simulação de Antecipação</h2>
            <p className="text-aureon-text/70 mb-6">Cliente: {getClienteNome(selectedConta.clienteId)}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Valor a Antecipar</label>
                <input
                  type="number"
                  step="0.01"
                  value={antecipacaoData.valorAntecipado}
                  onChange={(e) => setAntecipacaoData(prev => ({ ...prev, valorAntecipado: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                />
              </div>

              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Taxa Mensal (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={antecipacaoData.taxaMensal}
                  onChange={(e) => setAntecipacaoData(prev => ({ ...prev, taxaMensal: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                />
              </div>

              {/* Resultado da Simulação */}
              {antecipacaoData.valorAntecipado && calcularAntecipacao() && (
                <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-aureon-text/70">Valor Bruto:</span>
                    <span className="text-aureon-text font-semibold">
                      {formatCurrency(calcularAntecipacao().valorBruto)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-aureon-text/70">Desconto:</span>
                    <span className="text-red-400 font-semibold">
                      - {formatCurrency(calcularAntecipacao().desconto)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-aureon-text/70">Taxa Efetiva:</span>
                    <span className="text-orange-400 font-semibold">
                      {calcularAntecipacao().taxaEfetiva.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-blue-400/20">
                    <span className="text-aureon-text font-bold">Valor Líquido:</span>
                    <span className="text-green-400 font-bold">
                      {formatCurrency(calcularAntecipacao().valorLiquido)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAntecipacaoModal(false);
                    setSelectedConta(null);
                  }}
                  className="flex-1 bg-aureon-bg border border-aureon-purple/30 text-aureon-text px-6 py-3 rounded-lg hover:bg-aureon-purple/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
