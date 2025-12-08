import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Package, TrendingUp, TrendingDown, ArrowRightLeft, RotateCcw, Plus, Search, Filter, Calendar } from 'lucide-react';

/**
 * MOVIMENTAÇÕES DE ESTOQUE
 * Sistema completo de entrada/saída com rastreabilidade
 */
export default function StockMovements() {
  const { produtos, movimentacoes = [], addMovimentacao, itensEstoque = [], fornecedores = [] } = useContext(DataContext);
  const [filtro, setFiltro] = useState({ tipo: 'todos', periodo: '30dias', produto: '' });
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    produtoId: '',
    tipo: 'entrada', // entrada, saida, ajuste, transferencia, devolucao
    quantidade: '',
    motivo: '',
    fornecedorId: '', // ✅ Agora usa ID do fornecedor (não permite digitação livre)
    custo: '',
    observacoes: ''
  });

  const handleAddMovimentacao = () => {
    if (!novaMovimentacao.produtoId || !novaMovimentacao.quantidade) {
      alert('⚠️ Preencha produto e quantidade');
      return;
    }

    addMovimentacao({
      ...novaMovimentacao,
      quantidade: parseInt(novaMovimentacao.quantidade),
      custo: parseFloat(novaMovimentacao.custo) || 0,
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
      usuario: 'Admin' // TODO: Sistema de usuários
    });

    setNovaMovimentacao({
      produtoId: '',
      tipo: 'entrada',
      quantidade: '',
      motivo: '',
      fornecedorId: '',
      custo: '',
      observacoes: ''
    });

    alert('✅ Movimentação registrada com sucesso!');
  };

  const movimentacoesFiltradas = useMemo(() => {
    return (movimentacoes || []).filter(mov => {
      if (filtro.tipo !== 'todos' && mov.tipo !== filtro.tipo) return false;
      if (filtro.produto && !mov.produtoNome.toLowerCase().includes(filtro.produto.toLowerCase())) return false;
      return true;
    });
  }, [movimentacoes, filtro]);

  const estatisticas = useMemo(() => {
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0);
    const saidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0);
    const saldoAtual = produtos.reduce((acc, p) => acc + (p.estoque || 0), 0);
    
    return { entradas, saidas, saldoAtual, totalMovimentacoes: movimentacoes.length };
  }, [movimentacoes, produtos]);

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'entrada': return { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/20' };
      case 'saida': return { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-400/20' };
      case 'ajuste': return { icon: ArrowRightLeft, color: 'text-blue-400', bg: 'bg-blue-400/20' };
      case 'devolucao': return { icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-400/20' };
      default: return { icon: Package, color: 'text-aureon-gold', bg: 'bg-aureon-gold/20' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-aureon-gold mb-2 flex items-center gap-3">
            <Package size={36} />
            Movimentações de Estoque
          </h1>
          <p className="text-aureon-text/70">Controle completo de entrada e saída com rastreabilidade</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-aureon-surface border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Total Entradas</span>
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{estatisticas.entradas}</p>
            <p className="text-xs text-aureon-text/50 mt-1">unidades</p>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-aureon-surface border border-red-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Total Saídas</span>
              <TrendingDown size={20} className="text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">{estatisticas.saidas}</p>
            <p className="text-xs text-aureon-text/50 mt-1">unidades</p>
          </div>

          <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Saldo Atual</span>
              <Package size={20} className="text-aureon-gold" />
            </div>
            <p className="text-3xl font-bold text-aureon-gold">{estatisticas.saldoAtual}</p>
            <p className="text-xs text-aureon-text/50 mt-1">em estoque</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-aureon-surface border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Movimentações</span>
              <ArrowRightLeft size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{estatisticas.totalMovimentacoes}</p>
            <p className="text-xs text-aureon-text/50 mt-1">registros</p>
          </div>
        </div>

        {/* Formulário Nova Movimentação */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-aureon-gold mb-4">Registrar Movimentação</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select
              value={novaMovimentacao.produtoId}
              onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, produtoId: e.target.value })}
              className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
            >
              <option value="">Selecione o Produto *</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.estoque})</option>
              ))}
            </select>

            <select
              value={novaMovimentacao.tipo}
              onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, tipo: e.target.value })}
              className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
            >
              <option value="entrada">📥 Entrada</option>
              <option value="saida">📤 Saída</option>
              <option value="ajuste">🔧 Ajuste</option>
              <option value="transferencia">🔄 Transferência</option>
              <option value="devolucao">↩️ Devolução</option>
            </select>

            <input
              type="number"
              placeholder="Quantidade *"
              value={novaMovimentacao.quantidade}
              onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, quantidade: e.target.value })}
              className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Motivo"
              value={novaMovimentacao.motivo}
              onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, motivo: e.target.value })}
              className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
            />

            <select
              value={novaMovimentacao.fornecedorId}
              onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, fornecedorId: e.target.value })}
              className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
            >
              <option value="">Selecione o Fornecedor (se entrada)</option>
              {fornecedores.map((forn, idx) => (
                <option key={idx} value={forn.id || idx}>
                  {forn.nome} - {forn.empresa}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              placeholder="Custo Unitário (R$)"
              value={novaMovimentacao.custo}
              onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, custo: e.target.value })}
              className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
            />
          </div>

          <textarea
            placeholder="Observações"
            value={novaMovimentacao.observacoes}
            onChange={(e) => setNovaMovimentacao({ ...novaMovimentacao, observacoes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold mb-4"
          />

          <button
            onClick={handleAddMovimentacao}
            className="w-full px-6 py-3 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all"
          >
            <Plus size={20} className="inline mr-2" />
            Registrar Movimentação
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-4 mb-6 flex flex-wrap gap-4">
          <select
            value={filtro.tipo}
            onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
            <option value="ajuste">Ajustes</option>
            <option value="devolucao">Devoluções</option>
          </select>

          <input
            type="text"
            placeholder="🔍 Buscar produto..."
            value={filtro.produto}
            onChange={(e) => setFiltro({ ...filtro, produto: e.target.value })}
            className="flex-1 px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
        </div>

        {/* Lista de Movimentações */}
        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-aureon-gold mb-4">Histórico de Movimentações</h2>
          
          <div className="space-y-3">
            {movimentacoesFiltradas.length === 0 ? (
              <div className="text-center py-12 text-aureon-text/50">
                Nenhuma movimentação registrada
              </div>
            ) : (
              movimentacoesFiltradas.map((mov, idx) => {
                const tipoInfo = getTipoIcon(mov.tipo);
                const Icon = tipoInfo.icon;
                
                return (
                  <div key={idx} className="bg-aureon-bg border border-aureon-gold/10 rounded-lg p-4 hover:border-aureon-gold/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 ${tipoInfo.bg} rounded-lg`}>
                          <Icon size={20} className={tipoInfo.color} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-aureon-text font-semibold">{mov.produtoNome}</h3>
                            <span className={`px-2 py-0.5 ${tipoInfo.bg} ${tipoInfo.color} rounded-full text-xs font-semibold uppercase`}>
                              {mov.tipo}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-aureon-text/70">
                            <span>Qtd: <strong className={tipoInfo.color}>{mov.quantidade}</strong></span>
                            <span>Data: {mov.data} {mov.hora}</span>
                            {mov.fornecedor && <span>Fornecedor: {mov.fornecedor}</span>}
                            {mov.custo > 0 && <span>Custo: R$ {mov.custo.toFixed(2)}</span>}
                          </div>
                          {mov.motivo && (
                            <p className="text-xs text-aureon-text/60 mt-2">Motivo: {mov.motivo}</p>
                          )}
                          {mov.observacoes && (
                            <p className="text-xs text-aureon-text/50 mt-1">Obs: {mov.observacoes}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-aureon-text/50">{mov.usuario}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

