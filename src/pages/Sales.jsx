import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContextAPI';
import { usePrescription } from '../context/PrescriptionContext';
import { ShoppingCart, TrendingUp, DollarSign, Package, Calendar, Trash2, Plus, AlertCircle, Target, Eye, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { agruparVendasPorPeriodo } from '../utils/chartHelpers';

/**
 * Página de Vendas Completa
 * Registro de vendas + Análise + Gráficos
 */
export default function Sales() {
  const { vendas, produtos, clientes, addVenda, deleteVenda, config } = useContext(DataContext);
  const { getUserSettings, currentUser } = useAuth();
  const { prescriptions, getPrescriptionsByCliente, attachToOrder, createPrescription } = usePrescription();
  const [periodoGrafico, setPeriodoGrafico] = useState('mensal');
  const [mostrarFormReceita, setMostrarFormReceita] = useState(false);
  
  // ✅ Meta Pessoal (VENDAS)
  const userSettings = getUserSettings();
  const metaPessoal = userSettings.metaPessoal || 0;
  const exibirProgressoMeta = userSettings.exibirProgressoMeta !== false;
  
  // Formulário de nova venda
  const [novaVenda, setNovaVenda] = useState({
    produto: '',
    produtoId: '',
    cliente: '',
    clienteId: '',
    valorVenda: '',
    lucro: '',
    canal: 'whatsapp',
    data: new Date().toISOString().split('T')[0],
    prescriptionId: '' // Nova propriedade
  });

  // Receitas ativas do cliente selecionado
  const receitasClienteAtivas = useMemo(() => {
    if (!novaVenda.clienteId) return [];
    return getPrescriptionsByCliente(novaVenda.clienteId)
      .filter(p => p.status === 'ativa' && new Date(p.data_validade) > new Date())
      .sort((a, b) => new Date(b.data_emissao) - new Date(a.data_emissao));
  }, [novaVenda.clienteId, prescriptions]);

  // KPIs
  const totalVendas = vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const totalLucro = vendas.reduce((acc, v) => acc + (v.lucro || 0), 0);
  const margemMedia = totalVendas > 0 ? ((totalLucro / totalVendas) * 100) : 0;
  const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

  // Vendas por canal
  const vendasPorCanal = useMemo(() => {
    const canais = {};
    vendas.forEach(v => {
      const canal = v.canal || 'Outros';
      if (!canais[canal]) {
        canais[canal] = { name: canal, valor: 0, quantidade: 0 };
      }
      canais[canal].valor += v.valorVenda || 0;
      canais[canal].quantidade += 1;
    });
    return Object.values(canais);
  }, [vendas]);

  // Vendas por período
  const vendasPorPeriodo = useMemo(() => {
    return agruparVendasPorPeriodo(vendas, periodoGrafico);
  }, [vendas, periodoGrafico]);

  // Cores para gráficos
  const COLORS = ['var(--aureon-gold)', '#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa'];

  // Handler: Adicionar venda
  const handleAddVenda = () => {
    if (!novaVenda.produto || !novaVenda.valorVenda) {
      alert('⚠️ Preencha pelo menos o produto e valor da venda');
      return;
    }

    const produtoSelecionado = produtos.find(p => p.produto === novaVenda.produto);
    const clienteSelecionado = clientes.find(c => c.nome === novaVenda.cliente);

    // Verificar se produto requer receita (óculos de grau, lentes)
    const requerReceita = produtoSelecionado?.tipo === 'Óculos de Grau' || 
                          produtoSelecionado?.categoria?.toLowerCase().includes('grau') ||
                          produtoSelecionado?.produto?.toLowerCase().includes('grau');

    if (requerReceita && !novaVenda.prescriptionId) {
      const confirmar = window.confirm(
        '⚠️ Este produto geralmente requer receita médica.\n\nDeseja continuar sem associar uma receita?'
      );
      if (!confirmar) return;
    }

    const vendaData = {
      produto: novaVenda.produto,
      produtoId: produtoSelecionado?.id || null,
      cliente: novaVenda.cliente || 'Cliente Avulso',
      clienteId: clienteSelecionado?.id || null,
      valorVenda: parseFloat(novaVenda.valorVenda),
      lucro: parseFloat(novaVenda.lucro) || 0,
      canal: novaVenda.canal,
      data: novaVenda.data,
      prescriptionId: novaVenda.prescriptionId || null
    };

    const vendaCriada = addVenda(vendaData);

    // Associar receita ao pedido se selecionada
    if (novaVenda.prescriptionId && vendaCriada?.id) {
      const result = attachToOrder(novaVenda.prescriptionId, vendaCriada.id, currentUser?.username);
      if (result.success) {
        console.log('✅ Receita associada à venda com sucesso');
      }
    }

    // Resetar formulário
    setNovaVenda({
      produto: '',
      produtoId: '',
      cliente: '',
      clienteId: '',
      valorVenda: '',
      lucro: '',
      canal: 'whatsapp',
      data: new Date().toISOString().split('T')[0],
      prescriptionId: ''
    });
    setMostrarFormReceita(false);
  };

  // Todos os canais possíveis
  const todosCanais = {
    'mercado-livre': { nome: 'Mercado Livre', icon: '🛒' },
    'amazon': { nome: 'Amazon', icon: '📦' },
    'shopee': { nome: 'Shopee', icon: '🛍️' },
    'shein': { nome: 'Shein', icon: '👗' },
    'instagram': { nome: 'Instagram', icon: '📱' },
    'facebook': { nome: 'Facebook Marketplace', icon: '📘' },
    'whatsapp': { nome: 'WhatsApp', icon: '💬' },
    'tiktok': { nome: 'TikTok Shop', icon: '🎵' },
    'loja-fisica': { nome: 'Loja Física', icon: '🏪' },
    'site-proprio': { nome: 'Site Próprio', icon: '🌐' },
    'outros': { nome: 'Outros', icon: '📊' }
  };

  // Canais disponíveis (apenas os ativos nas configurações)
  const canaisDisponiveis = config?.canaisAtivos || Object.keys(todosCanais);

  // Função para obter nome do canal
  const getNomeCanal = (canal) => todosCanais[canal]?.nome || canal;

  const nomesCanais = Object.fromEntries(
    Object.entries(todosCanais).map(([key, value]) => [key, value.nome])
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-serif font-bold text-aureon-gold flex items-center gap-3">
            <ShoppingCart size={32} />
            Gestão de Vendas
          </h2>
          <p className="text-aureon-text text-sm mt-1">Registre vendas, analise desempenho e acompanhe métricas</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border border-aureon-gold/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Receita Total</span>
              <DollarSign size={24} className="text-aureon-gold" />
            </div>
            <div className="text-3xl font-bold text-aureon-gold mb-1">
              R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-aureon-text/70">{vendas.length} vendas registradas</div>
          </div>

          <div className="bg-gradient-to-br from-green-400/10 to-aureon-surface border border-green-400/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Lucro Total</span>
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-aureon-text/70">Margem: {margemMedia.toFixed(1)}%</div>
          </div>

          <div className="bg-gradient-to-br from-blue-400/10 to-aureon-surface border border-blue-400/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Ticket Médio</span>
              <ShoppingCart size={24} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-1">
              R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-aureon-text/70">Por venda</div>
          </div>

          <div className="bg-gradient-to-br from-purple-400/10 to-aureon-surface border border-purple-400/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Total de Vendas</span>
              <Calendar size={24} className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">{vendas.length}</div>
            <div className="text-xs text-aureon-text/70">Vendas realizadas</div>
          </div>
        </div>

        {/* Widget Meta Pessoal - VENDAS */}
        {currentUser?.role === 'VENDAS' && exibirProgressoMeta && metaPessoal > 0 && (
          <div className="bg-gradient-to-br from-orange-400/10 to-aureon-surface border border-orange-400/40 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target size={28} className="text-orange-400" />
                <div>
                  <h3 className="text-lg font-bold text-aureon-text">Meta Pessoal</h3>
                  <p className="text-xs text-aureon-text/70">Progresso do mês atual</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">
                  {totalVendas >= metaPessoal ? '✓' : Math.round((totalVendas / metaPessoal) * 100) + '%'}
                </div>
                <div className="text-xs text-aureon-text/70">
                  R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {metaPessoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-6 bg-aureon-surface/60 rounded-full overflow-hidden border border-aureon-gold/20">
              <div 
                className="absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full"
                style={{
                  width: `${Math.min((totalVendas / metaPessoal) * 100, 100)}%`,
                  background: totalVendas >= metaPessoal 
                    ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' // Verde se atingiu
                    : (totalVendas / metaPessoal) >= 0.7
                      ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)' // Amarelo se 70-99%
                      : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)' // Vermelho se < 70%
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {Math.round((totalVendas / metaPessoal) * 100)}%
                </span>
              </div>
            </div>

            {/* Mensagem motivacional */}
            <div className="mt-3 text-center text-xs text-aureon-text/70">
              {totalVendas >= metaPessoal && '🎉 Parabéns! Você atingiu sua meta!'}
              {totalVendas < metaPessoal && (totalVendas / metaPessoal) >= 0.7 && '💪 Quase lá! Continue assim!'}
              {(totalVendas / metaPessoal) < 0.7 && '🚀 Vamos acelerar! Falta R$ ' + (metaPessoal - totalVendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}

        {/* Canais Ativos */}
        {canaisDisponiveis.length > 0 && (
          <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-aureon-gold" />
              <span className="text-sm font-semibold text-aureon-gold">Canais de Venda Ativos ({canaisDisponiveis.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {canaisDisponiveis.map((canal) => (
                <span
                  key={canal}
                  className="px-3 py-1 bg-aureon-gold/10 border border-aureon-gold/30 rounded-full text-xs text-aureon-text flex items-center gap-1"
                >
                  {todosCanais[canal]?.icon} {todosCanais[canal]?.nome}
                </span>
              ))}
            </div>
            <p className="text-xs text-aureon-text/50 mt-2">
              💡 Configure mais canais em Configurações → Canais de Venda
            </p>
          </div>
        )}

        {/* Gráfico de Evolução de Vendas */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-aureon-gold flex items-center gap-2">
              <TrendingUp size={24} />
              Evolução de Vendas
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriodoGrafico('diario')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  periodoGrafico === 'diario'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/30 hover:bg-aureon-gold/10'
                }`}
              >
                Diário
              </button>
              <button
                onClick={() => setPeriodoGrafico('semanal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  periodoGrafico === 'semanal'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/30 hover:bg-aureon-gold/10'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setPeriodoGrafico('mensal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  periodoGrafico === 'mensal'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/30 hover:bg-aureon-gold/10'
                }`}
              >
                Mensal
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendasPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--aureon-gold)" opacity={0.1} />
              <XAxis dataKey="periodo" stroke="var(--aureon-text)" />
              <YAxis stroke="var(--aureon-text)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--aureon-surface)', border: '1px solid var(--aureon-gold)' }}
                labelStyle={{ color: 'var(--aureon-text)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="var(--aureon-gold)" strokeWidth={2} name="Vendas (R$)" />
              <Line type="monotone" dataKey="quantidade" stroke="#4ade80" strokeWidth={2} name="Quantidade" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Formulário de Nova Venda */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-aureon-gold flex items-center gap-2">
              <Plus size={24} />
              Registrar Nova Venda
            </h3>
            <button
              onClick={() => {
                // Simular sincronização do Mercado Livre
                alert('🔄 Sincronização com Mercado Livre iniciada!\n\n✅ Esta funcionalidade irá:\n• Buscar vendas do ML automaticamente\n• Atualizar clientes\n• Registrar produtos vendidos\n\n⚠️ API do Mercado Livre necessária');
              }}
              className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
            >
              🛒 Sincronizar Mercado Livre
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Produto */}
            <div>
              <label className="text-aureon-text text-sm mb-2 block">Produto *</label>
              <select
                value={novaVenda.produto}
                onChange={(e) => setNovaVenda({ ...novaVenda, produto: e.target.value })}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              >
                <option value="">Selecione um produto</option>
                {produtos.map((p, idx) => (
                  <option key={idx} value={p.produto}>{p.produto}</option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="text-aureon-text text-sm mb-2 block">Cliente</label>
              <select
                value={novaVenda.cliente}
                onChange={(e) => {
                  const clienteSelecionado = clientes.find(c => c.nome === e.target.value);
                  setNovaVenda({ 
                    ...novaVenda, 
                    cliente: e.target.value,
                    clienteId: clienteSelecionado?.id || '',
                    prescriptionId: '' // Resetar receita ao mudar cliente
                  });
                }}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              >
                <option value="">Cliente Avulso</option>
                {clientes.map((c, idx) => (
                  <option key={idx} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Receita Médica (se cliente selecionado) */}
            {novaVenda.clienteId && (
              <div className="col-span-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-aureon-text text-sm flex items-center gap-2">
                    <Eye size={16} className="text-blue-400" />
                    Receita Médica (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarFormReceita(!mostrarFormReceita)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Nova Receita Rápida
                  </button>
                </div>
                
                {receitasClienteAtivas.length > 0 ? (
                  <select
                    value={novaVenda.prescriptionId}
                    onChange={(e) => setNovaVenda({ ...novaVenda, prescriptionId: e.target.value })}
                    className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
                  >
                    <option value="">Sem receita</option>
                    {receitasClienteAtivas.map((rec) => {
                      const diasRestantes = Math.ceil(
                        (new Date(rec.data_validade) - new Date()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <option key={rec.id} value={rec.id}>
                          Dr(a). {rec.medico_nome} - {new Date(rec.data_emissao).toLocaleDateString('pt-BR')} 
                          ({diasRestantes} dias restantes) - {rec.tipo_lente}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} className="text-yellow-400" />
                    <span className="text-xs text-yellow-400">
                      Este cliente não possui receitas ativas. Clique em "Nova Receita Rápida" para criar.
                    </span>
                  </div>
                )}

                {/* Detalhes da receita selecionada */}
                {novaVenda.prescriptionId && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-blue-400 mt-1" />
                      <div className="flex-1">
                        {(() => {
                          const rec = receitasClienteAtivas.find(r => r.id === novaVenda.prescriptionId);
                          if (!rec) return null;
                          return (
                            <div className="space-y-1">
                              <p className="text-xs text-aureon-text font-semibold">
                                Receita Selecionada: {rec.tipo_lente}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-aureon-text/70">
                                <div>
                                  <span className="font-medium">OD:</span> Esf {rec.od.esferico > 0 ? '+' : ''}{rec.od.esferico}, 
                                  Cil {rec.od.cilindrico}, Eixo {rec.od.eixo}°
                                </div>
                                <div>
                                  <span className="font-medium">OE:</span> Esf {rec.oe.esferico > 0 ? '+' : ''}{rec.oe.esferico}, 
                                  Cil {rec.oe.cilindrico}, Eixo {rec.oe.eixo}°
                                </div>
                              </div>
                              <p className="text-xs text-blue-400">
                                Validade: {new Date(rec.data_validade).toLocaleDateString('pt-BR')} 
                                {rec.anexos.length > 0 && ` | ${rec.anexos.length} anexo(s)`}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Canal */}
            <div>
              <label className="text-aureon-text text-sm mb-2 block">
                Canal de Venda * 
                <span className="text-xs text-aureon-text/50 ml-2">(apenas canais ativos)</span>
              </label>
              <select
                value={novaVenda.canal}
                onChange={(e) => setNovaVenda({ ...novaVenda, canal: e.target.value })}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              >
                {canaisDisponiveis.map((canal) => (
                  <option key={canal} value={canal}>
                    {todosCanais[canal]?.icon} {todosCanais[canal]?.nome || canal}
                  </option>
                ))}
              </select>
              {canaisDisponiveis.length === 0 && (
                <p className="text-xs text-orange-400 mt-1">
                  ⚠️ Nenhum canal ativo. Configure em Configurações.
                </p>
              )}
            </div>

            {/* Valor da Venda */}
            <div>
              <label className="text-aureon-text text-sm mb-2 block">Valor da Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={novaVenda.valorVenda}
                onChange={(e) => setNovaVenda({ ...novaVenda, valorVenda: e.target.value })}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              />
            </div>

            {/* Lucro */}
            <div>
              <label className="text-aureon-text text-sm mb-2 block">Lucro (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={novaVenda.lucro}
                onChange={(e) => setNovaVenda({ ...novaVenda, lucro: e.target.value })}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              />
            </div>

            {/* Data */}
            <div>
              <label className="text-aureon-text text-sm mb-2 block">Data da Venda</label>
              <input
                type="date"
                value={novaVenda.data}
                onChange={(e) => setNovaVenda({ ...novaVenda, data: e.target.value })}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              />
            </div>
          </div>

          <button
            onClick={handleAddVenda}
            className="mt-4 px-6 py-3 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Registrar Venda
          </button>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Vendas por Período */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-aureon-gold flex items-center gap-2">
                <TrendingUp size={20} />
                Evolução de Vendas
              </h3>
              <div className="flex gap-1 bg-aureon-bg rounded-lg p-1 border border-aureon-gold/20">
                <button
                  onClick={() => setPeriodoGrafico('diario')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    periodoGrafico === 'diario' 
                      ? 'bg-aureon-gold text-black' 
                      : 'text-aureon-text hover:bg-aureon-gold/10'
                  }`}
                >
                  Diário
                </button>
                <button
                  onClick={() => setPeriodoGrafico('semanal')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    periodoGrafico === 'semanal' 
                      ? 'bg-aureon-gold text-black' 
                      : 'text-aureon-text hover:bg-aureon-gold/10'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setPeriodoGrafico('mensal')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    periodoGrafico === 'mensal' 
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
                <LineChart data={vendasPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                  <XAxis dataKey="periodo" stroke="var(--aureon-text)" fontSize={12} />
                  <YAxis stroke="var(--aureon-text)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--aureon-surface)', border: '1px solid var(--aureon-gold)', borderRadius: '8px' }}
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receita" stroke="var(--aureon-gold)" strokeWidth={3} name="Receita" />
                  <Line type="monotone" dataKey="lucro" stroke="#4ade80" strokeWidth={3} name="Lucro" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-aureon-text/50">
                Nenhuma venda registrada
              </div>
            )}
          </div>

          {/* Gráfico de Vendas por Canal */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-aureon-gold mb-4 flex items-center gap-2">
              <Package size={20} />
              Vendas por Canal
            </h3>
            {vendasPorCanal.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vendasPorCanal}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                  >
                    {vendasPorCanal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-aureon-text/50">
                Nenhuma venda registrada
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Vendas */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-aureon-gold/20">
            <h3 className="text-xl font-bold text-aureon-gold">Histórico de Vendas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-aureon-gold/10">
                <tr>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Data</th>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Produto</th>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Cliente</th>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Canal</th>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Valor</th>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Lucro</th>
                  <th className="px-6 py-3 text-left text-aureon-gold font-bold">Margem</th>
                  <th className="px-6 py-3 text-center text-aureon-gold font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...vendas].reverse().map((venda, idx) => {
                  const margem = venda.valorVenda > 0 ? ((venda.lucro / venda.valorVenda) * 100) : 0;
                  return (
                    <tr key={idx} className="border-t border-aureon-gold/10 hover:bg-aureon-gold/5">
                      <td className="px-6 py-4 text-aureon-text">{venda.data}</td>
                      <td className="px-6 py-4 text-aureon-text">{venda.produto}</td>
                      <td className="px-6 py-4 text-aureon-text">{venda.cliente || '-'}</td>
                      <td className="px-6 py-4 text-aureon-text">{nomesCanais[venda.canal] || venda.canal}</td>
                      <td className="px-6 py-4 text-aureon-gold font-bold">
                        R$ {(venda.valorVenda || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-green-400 font-bold">
                        R$ {(venda.lucro || 0).toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 font-bold ${margem >= 30 ? 'text-green-400' : margem >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {margem.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteVenda(vendas.length - 1 - idx)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          title="Deletar venda"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {vendas.length === 0 && (
              <div className="text-center py-12 text-aureon-text/50">
                <AlertCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p>Nenhuma venda registrada ainda</p>
                <p className="text-xs mt-2">Use o formulário acima para registrar sua primeira venda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

