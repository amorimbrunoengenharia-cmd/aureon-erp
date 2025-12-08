import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Edit2, Trash2, Building2, DollarSign, TrendingUp, CreditCard, Eye, EyeOff } from 'lucide-react';

/**
 * Gerenciador de Contas Bancárias
 * CRUD de contas + Visualização de saldos
 */
export default function BankAccountsManager() {
  const {
    contasBancarias,
    addContaBancaria,
    updateContaBancaria,
    setSaldoConta
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaldos, setShowSaldos] = useState(true);

  const [formData, setFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo: 'Corrente',
    saldoInicial: '',
    ativo: true,
    observacoes: ''
  });

  // Tipos de conta
  const tiposConta = ['Corrente', 'Poupança', 'Investimento', 'Caixa'];

  // Principais bancos brasileiros
  const bancosBrasileiros = [
    'Banco do Brasil',
    'Bradesco',
    'Itaú',
    'Santander',
    'Caixa Econômica Federal',
    'Nubank',
    'Inter',
    'C6 Bank',
    'PagBank',
    'Banco Original',
    'Safra',
    'Sicoob',
    'Sicredi',
    'BTG Pactual',
    'Neon',
    'Outro'
  ];

  // ============================================
  // FILTROS E CÁLCULOS
  // ============================================

  const contasFiltradas = useMemo(() => {
    let resultado = [...contasBancarias];

    if (searchTerm) {
      resultado = resultado.filter(c =>
        c.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.conta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.agencia.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return resultado;
  }, [contasBancarias, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const saldoTotal = contasBancarias
      .filter(c => c.ativo)
      .reduce((sum, c) => sum + c.saldoAtual, 0);

    const contasAtivas = contasBancarias.filter(c => c.ativo).length;
    const contasInativas = contasBancarias.filter(c => !c.ativo).length;

    const porTipo = tiposConta.reduce((acc, tipo) => {
      const saldo = contasBancarias
        .filter(c => c.tipo === tipo && c.ativo)
        .reduce((sum, c) => sum + c.saldoAtual, 0);
      acc[tipo] = saldo;
      return acc;
    }, {});

    return { saldoTotal, contasAtivas, contasInativas, porTipo };
  }, [contasBancarias]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSubmit = (e) => {
    e.preventDefault();

    const conta = {
      banco: formData.banco,
      agencia: formData.agencia,
      conta: formData.conta,
      tipo: formData.tipo,
      saldoInicial: parseFloat(formData.saldoInicial),
      saldoAtual: editingId ? undefined : parseFloat(formData.saldoInicial),
      ativo: formData.ativo,
      observacoes: formData.observacoes || ''
    };

    if (editingId) {
      updateContaBancaria(editingId, conta);
    } else {
      addContaBancaria(conta);
    }

    resetForm();
  };

  const handleEdit = (conta) => {
    setEditingId(conta.id);
    setFormData({
      banco: conta.banco,
      agencia: conta.agencia,
      conta: conta.conta,
      tipo: conta.tipo,
      saldoInicial: conta.saldoInicial.toString(),
      ativo: conta.ativo,
      observacoes: conta.observacoes || ''
    });
    setShowModal(true);
  };

  const handleAjusteSaldo = (conta) => {
    const novoSaldo = prompt(
      `Saldo atual: ${formatCurrency(conta.saldoAtual)}\n\nDigite o novo saldo:`,
      conta.saldoAtual
    );

    if (novoSaldo !== null && !isNaN(parseFloat(novoSaldo))) {
      setSaldoConta(conta.id, parseFloat(novoSaldo));
    }
  };

  const resetForm = () => {
    setFormData({
      banco: '',
      agencia: '',
      conta: '',
      tipo: 'Corrente',
      saldoInicial: '',
      ativo: true,
      observacoes: ''
    });
    setEditingId(null);
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

  const getTipoIcon = (tipo) => {
    const icons = {
      'Corrente': <CreditCard size={20} />,
      'Poupança': <DollarSign size={20} />,
      'Investimento': <TrendingUp size={20} />,
      'Caixa': <Building2 size={20} />
    };
    return icons[tipo] || <CreditCard size={20} />;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'Corrente': 'blue',
      'Poupança': 'green',
      'Investimento': 'purple',
      'Caixa': 'orange'
    };
    return colors[tipo] || 'blue';
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-6 bg-aureon-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-aureon-purple mb-2">Contas Bancárias</h1>
          <p className="text-aureon-text/70">Gerenciamento de contas e saldos</p>
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
        <div className="bg-gradient-to-br from-green-400/20 to-aureon-bg border border-green-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Saldo Total</span>
            <button
              onClick={() => setShowSaldos(!showSaldos)}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              {showSaldos ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {showSaldos ? formatCurrency(stats.saldoTotal) : '••••••'}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">
            {stats.contasAtivas} conta(s) ativa(s)
          </p>
        </div>

        {Object.entries(stats.porTipo).slice(0, 3).map(([tipo, saldo]) => (
          <div key={tipo} className={`bg-aureon-surface border border-${getTipoColor(tipo)}-400/30 rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">{tipo}</span>
              <span className={`text-${getTipoColor(tipo)}-400`}>
                {getTipoIcon(tipo)}
              </span>
            </div>
            <p className={`text-2xl font-bold text-${getTipoColor(tipo)}-400`}>
              {showSaldos ? formatCurrency(saldo) : '••••••'}
            </p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-aureon-text/50" />
          <input
            type="text"
            placeholder="Buscar por banco, agência ou conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-aureon-bg border border-aureon-purple/20 rounded-lg pl-10 pr-4 py-2 text-aureon-text placeholder-aureon-text/30 focus:outline-none focus:border-aureon-purple"
          />
        </div>
      </div>

      {/* Grid de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contasFiltradas.length === 0 ? (
          <div className="col-span-full bg-aureon-surface border border-aureon-purple/30 rounded-xl p-8 text-center text-aureon-text/50">
            Nenhuma conta bancária cadastrada
          </div>
        ) : (
          contasFiltradas.map(conta => (
            <div
              key={conta.id}
              className={`bg-aureon-surface border rounded-xl p-6 transition-all hover:shadow-lg ${
                conta.ativo
                  ? `border-${getTipoColor(conta.tipo)}-400/30 hover:border-${getTipoColor(conta.tipo)}-400/50`
                  : 'border-aureon-muted/30 opacity-60'
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-${getTipoColor(conta.tipo)}-400/10 rounded-lg`}>
                    <span className={`text-${getTipoColor(conta.tipo)}-400`}>
                      {getTipoIcon(conta.tipo)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-aureon-text">{conta.banco}</h3>
                    <p className="text-xs text-aureon-text/60">{conta.tipo}</p>
                  </div>
                </div>
                {!conta.ativo && (
                  <span className="px-2 py-1 bg-aureon-muted/20 text-aureon-muted text-xs rounded-full">
                    Inativa
                  </span>
                )}
              </div>

              {/* Informações da Conta */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-aureon-text/70">Agência:</span>
                  <span className="text-aureon-text font-mono">{conta.agencia}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-aureon-text/70">Conta:</span>
                  <span className="text-aureon-text font-mono">{conta.conta}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-aureon-purple/10">
                  <span className="text-aureon-text/70">Saldo Inicial:</span>
                  <span className="text-aureon-text">
                    {showSaldos ? formatCurrency(conta.saldoInicial) : '••••••'}
                  </span>
                </div>
              </div>

              {/* Saldo Atual */}
              <div className={`bg-${getTipoColor(conta.tipo)}-400/10 border border-${getTipoColor(conta.tipo)}-400/30 rounded-lg p-3 mb-4`}>
                <div className="text-xs text-aureon-text/70 mb-1">Saldo Atual</div>
                <div className={`text-2xl font-bold text-${getTipoColor(conta.tipo)}-400`}>
                  {showSaldos ? formatCurrency(conta.saldoAtual) : '••••••••'}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAjusteSaldo(conta)}
                  className={`flex-1 bg-${getTipoColor(conta.tipo)}-400/10 hover:bg-${getTipoColor(conta.tipo)}-400/20 border border-${getTipoColor(conta.tipo)}-400/30 text-${getTipoColor(conta.tipo)}-400 px-3 py-2 rounded-lg transition-colors text-sm font-semibold`}
                >
                  Ajustar Saldo
                </button>
                <button
                  onClick={() => handleEdit(conta)}
                  className="p-2 bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
              </div>

              {conta.observacoes && (
                <div className="mt-3 pt-3 border-t border-aureon-purple/10">
                  <p className="text-xs text-aureon-text/60">{conta.observacoes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-aureon-bg/90 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-aureon-purple mb-6">
              {editingId ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Banco e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Banco *</label>
                  <select
                    value={formData.banco}
                    onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  >
                    <option value="">Selecione o banco...</option>
                    {bancosBrasileiros.map(banco => (
                      <option key={banco} value={banco}>{banco}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Tipo de Conta *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  >
                    {tiposConta.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agência e Conta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Agência *</label>
                  <input
                    type="text"
                    value={formData.agencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, agencia: e.target.value }))}
                    placeholder="Ex: 1234"
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Número da Conta *</label>
                  <input
                    type="text"
                    value={formData.conta}
                    onChange={(e) => setFormData(prev => ({ ...prev, conta: e.target.value }))}
                    placeholder="Ex: 12345-6"
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>
              </div>

              {/* Saldo Inicial */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">
                  Saldo Inicial * {editingId && '(não altera o saldo atual)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.saldoInicial}
                  onChange={(e) => setFormData(prev => ({ ...prev, saldoInicial: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  required
                />
                <p className="text-xs text-aureon-text/60 mt-1">
                  {editingId
                    ? 'Use "Ajustar Saldo" no card da conta para alterar o saldo atual'
                    : 'Este será o saldo inicial da conta'}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="ativo" className="text-sm text-aureon-text">
                  Conta ativa
                </label>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  rows="3"
                  placeholder="Informações adicionais sobre a conta..."
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
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

