import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { Users, MessageSquare, Star, TrendingUp, Clock, Send, Mail, MessageCircle, Trash2 } from 'lucide-react';

/**
 * CRM & Comunicação Unificados
 * Gestão de clientes + Templates de mensagens
 */
export default function UnifiedCRM() {
  const { clientes, addCliente, deleteCliente, vendas } = useContext(DataContext);
  const [viewMode, setViewMode] = useState('clients'); // 'clients' | 'communication'
  
  // Estado CRM
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' });
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  // Estado Comunicação
  const [tipoMensagem, setTipoMensagem] = useState('promocao');
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [mensagemCustom, setMensagemCustom] = useState('');
  const [copiado, setCopiado] = useState(false);

  const mostrarMensagem = (texto) => {
    setMensagemFeedback(texto);
    setTimeout(() => setMensagemFeedback(''), 3000);
  };

  // ======= ANÁLISE AVANÇADA DE CLIENTES =======
  const clientesComAnalise = useMemo(() => {
    const hoje = new Date();
    
    return clientes.map(cliente => {
      const vendasCliente = vendas.filter(v => 
        v.clienteId === cliente.id || v.clienteNome === cliente.nome
      );
      
      const totalGasto = vendasCliente.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
      const quantidadeCompras = vendasCliente.length;
      const ticketMedio = quantidadeCompras > 0 ? totalGasto / quantidadeCompras : 0;

      // Calcular dias desde última compra
      let diasUltimaCompra = Infinity;
      let segmento = 'Novo';
      
      if (vendasCliente.length > 0) {
        const ultimaVenda = vendasCliente[vendasCliente.length - 1];
        const dataPartes = ultimaVenda.data.split('/');
        const dataUltima = new Date(
          parseInt(dataPartes[2]),
          parseInt(dataPartes[1]) - 1,
          parseInt(dataPartes[0])
        );
        diasUltimaCompra = Math.floor((hoje - dataUltima) / (1000 * 60 * 60 * 24));
      }

      // Segmentação
      if (quantidadeCompras === 0) {
        segmento = 'Novo';
      } else if (quantidadeCompras >= 10 && totalGasto > 1000) {
        segmento = 'VIP';
      } else if (diasUltimaCompra > 60) {
        segmento = 'Dormindo';
      } else if (quantidadeCompras >= 3) {
        segmento = 'Regular';
      } else {
        segmento = 'Ocasional';
      }

      return {
        ...cliente,
        totalGasto,
        quantidadeCompras,
        ticketMedio,
        diasUltimaCompra,
        segmento
      };
    });
  }, [clientes, vendas]);

  // ======= HANDLERS CRM =======
  const handleAddCustomer = () => {
    if (!formData.nome || !formData.email) {
      mostrarMensagem('⚠️ Nome e email são obrigatórios');
      return;
    }
    addCliente({
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone
    });
    setFormData({ nome: '', email: '', telefone: '' });
    mostrarMensagem('✅ Cliente adicionado com sucesso!');
  };

  const handleSincronizarML = () => {
    // Simular sincronização com Mercado Livre
    const clientesML = [
      { nome: 'Cliente ML 1', email: 'cliente1@ml.com', telefone: '(11) 98888-1111', origem: 'Mercado Livre' },
      { nome: 'Cliente ML 2', email: 'cliente2@ml.com', telefone: '(11) 98888-2222', origem: 'Mercado Livre' }
    ];
    
    let adicionados = 0;
    clientesML.forEach(clienteML => {
      const existe = clientes.find(c => c.email === clienteML.email);
      if (!existe) {
        addCliente(clienteML);
        adicionados++;
      }
    });
    
    if (adicionados > 0) {
      mostrarMensagem(`✅ ${adicionados} cliente(s) importados do Mercado Livre!`);
    } else {
      mostrarMensagem('ℹ️ Nenhum cliente novo encontrado');
    }
  };

  const handleDeleteCustomer = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja deletar o cliente "${nome}"?`)) {
      deleteCliente(id);
      mostrarMensagem('🗑️ Cliente removido');
    }
  };

  // ======= HANDLERS COMUNICAÇÃO =======
  const templates = {
    promocao: {
      titulo: '🎉 Promoção Especial',
      texto: `Olá! 👋\n\nVisita nossos óculos em promoção especial! 🕶️\n\n✨ Até 30% de desconto\n📦 Frete Grátis\n💳 Pague em até 12x\n\nEntre em contato para saber mais!`
    },
    desconto: {
      titulo: '💰 Cupom de Desconto',
      texto: `Olá! 👋\n\nTemos um cupom especial para você! 🎁\n\n💝 CUPOM: AUREON20\n📊 Desconto: 20% em toda compra\n⏰ Validade: 7 dias\n\nNão deixe passar! 😊`
    },
    'nova-colecao': {
      titulo: '✨ Nova Coleção',
      texto: `Olá! 👋\n\n✨ NOVA COLEÇÃO CHEGOU! ✨\n\nConfira os novos modelos:\n🕶️ Óculos Polarizados\n🎨 Designs Exclusivos\n⭐ Qualidade Premium\n\nVenha conferir! 👀`
    },
    reativacao: {
      titulo: '👋 Volte a Nos Visitar',
      texto: `Olá! 👋\n\nSentimos sua falta! 😢\n\nVoltou interesse em óculos de qualidade?\n\n🎁 Desconto especial: 25% OFF\n📞 Entre em contato conosco\n\nEsperamos você! 🤗`
    }
  };

  const templateAtual = templates[tipoMensagem];
  const clienteSelecionadoObj = clientesComAnalise.find(c => c.id === parseInt(clienteSelecionado));

  const copiarMensagem = (texto) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhatsApp = () => {
    if (!clienteSelecionadoObj || !mensagemCustom) {
      mostrarMensagem('⚠️ Selecione um cliente e escreva a mensagem');
      return;
    }
    
    const telefone = clienteSelecionadoObj.telefone?.replace(/\D/g, '') || '';
    if (!telefone) {
      mostrarMensagem('⚠️ Cliente não possui telefone cadastrado');
      return;
    }

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagemCustom)}`;
    window.open(url, '_blank');
    mostrarMensagem('✅ WhatsApp aberto!');
  };

  const enviarEmail = () => {
    if (!clienteSelecionadoObj || !mensagemCustom) {
      mostrarMensagem('⚠️ Selecione um cliente e escreva a mensagem');
      return;
    }

    const mailto = `mailto:${clienteSelecionadoObj.email}?subject=${encodeURIComponent(templateAtual.titulo)}&body=${encodeURIComponent(mensagemCustom)}`;
    window.location.href = mailto;
    mostrarMensagem('✅ Email aberto!');
  };

  // Cores dos segmentos
  const segmentColors = {
    'VIP': 'var(--aureon-gold)',
    'Regular': '#4ade80',
    'Ocasional': '#60a5fa',
    'Novo': '#a78bfa',
    'Dormindo': '#fb923c'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      {/* Header com Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-aureon-gold font-serif">CRM & Comunicação</h1>
          <button
            onClick={handleSincronizarML}
            className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
          >
            🛒 Sincronizar Mercado Livre
          </button>
        </div>
        <p className="text-aureon-text/70 text-sm mb-4">Gestão de clientes e relacionamento</p>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('clients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'clients'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            <Users size={18} />
            Clientes
          </button>
          <button
            onClick={() => setViewMode('communication')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'communication'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            <MessageSquare size={18} />
            Comunicação
          </button>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {mensagemFeedback && (
        <div className={`mb-4 p-3 rounded-lg border ${
          mensagemFeedback.includes('✅') 
            ? 'bg-green-500/20 border-green-500 text-green-400'
            : 'bg-orange-500/20 border-orange-500 text-orange-400'
        }`}>
          {mensagemFeedback}
        </div>
      )}

      {/* ========== VIEW: CLIENTES ========== */}
      {viewMode === 'clients' && (
        <div>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-aureon-surface border border-purple-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-purple-400" />
                <span className="text-aureon-text/70 text-sm">Total Clientes</span>
              </div>
              <p className="text-2xl font-bold text-aureon-gold">{clientes.length}</p>
            </div>

            <div className="bg-aureon-surface border border-green-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={20} className="text-green-400" />
                <span className="text-aureon-text/70 text-sm">VIPs</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {clientesComAnalise.filter(c => c.segmento === 'VIP').length}
              </p>
            </div>

            <div className="bg-aureon-surface border border-orange-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-orange-400" />
                <span className="text-aureon-text/70 text-sm">Dormindo</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {clientesComAnalise.filter(c => c.segmento === 'Dormindo').length}
              </p>
            </div>

            <div className="bg-aureon-surface border border-blue-400/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-blue-400" />
                <span className="text-aureon-text/70 text-sm">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                R$ {clientesComAnalise.length > 0
                  ? (clientesComAnalise.reduce((acc, c) => acc + c.ticketMedio, 0) / clientesComAnalise.length).toFixed(2)
                  : '0.00'
                }
              </p>
            </div>
          </div>

          {/* Formulário Adicionar Cliente */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Adicionar Novo Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nome do Cliente *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="px-3 py-2 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text placeholder-[var(--aureon-text)]/50 focus:outline-none focus:border-aureon-gold"
              />
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-3 py-2 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text placeholder-[var(--aureon-text)]/50 focus:outline-none focus:border-aureon-gold"
              />
              <input
                type="tel"
                placeholder="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="px-3 py-2 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text placeholder-[var(--aureon-text)]/50 focus:outline-none focus:border-aureon-gold"
              />
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-aureon-gold text-aureon-bg rounded-lg font-bold hover:bg-aureon-text transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-aureon-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-aureon-gold font-semibold">Nome</th>
                    <th className="px-4 py-3 text-left text-aureon-gold font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-aureon-gold font-semibold">Telefone</th>
                    <th className="px-4 py-3 text-center text-aureon-gold font-semibold">Compras</th>
                    <th className="px-4 py-3 text-center text-aureon-gold font-semibold">Total Gasto</th>
                    <th className="px-4 py-3 text-center text-aureon-gold font-semibold">Segmento</th>
                    <th className="px-4 py-3 text-center text-aureon-gold font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesComAnalise.length > 0 ? (
                    clientesComAnalise.map((cliente, index) => (
                      <tr key={`cliente-${cliente.id}-${index}`} className="border-t border-aureon-gold/10 hover:bg-aureon-bg/50">
                        <td className="px-4 py-3 text-aureon-text">{cliente.nome}</td>
                        <td className="px-4 py-3 text-aureon-text">{cliente.email}</td>
                        <td className="px-4 py-3 text-aureon-text">{cliente.telefone || '-'}</td>
                        <td className="px-4 py-3 text-center text-aureon-text">{cliente.quantidadeCompras}</td>
                        <td className="px-4 py-3 text-center text-green-400 font-semibold">
                          R$ {cliente.totalGasto.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${segmentColors[cliente.segmento]}33`,
                              color: segmentColors[cliente.segmento]
                            }}
                          >
                            {cliente.segmento}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteCustomer(cliente.id, cliente.nome)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-aureon-text/50">
                        Nenhum cliente cadastrado ainda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== VIEW: COMUNICAÇÃO ========== */}
      {viewMode === 'communication' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Templates */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Templates de Mensagem</h3>
            
            <div className="space-y-3 mb-4">
              {Object.keys(templates).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => {
                    setTipoMensagem(tipo);
                    setMensagemCustom(templates[tipo].texto);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    tipoMensagem === tipo
                      ? 'bg-aureon-gold text-aureon-bg font-bold'
                      : 'bg-aureon-bg text-aureon-text border border-aureon-gold/20 hover:border-aureon-gold'
                  }`}
                >
                  {templates[tipo].titulo}
                </button>
              ))}
            </div>

            <div className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4">
              <h4 className="text-aureon-gold font-semibold mb-2">Preview</h4>
              <p className="text-aureon-text text-sm whitespace-pre-wrap">
                {templateAtual.texto}
              </p>
              <button
                onClick={() => copiarMensagem(templateAtual.texto)}
                className="mt-3 px-4 py-2 bg-aureon-gold/20 text-aureon-gold rounded-lg hover:bg-aureon-gold/30 transition-colors text-sm"
              >
                {copiado ? '✓ Copiado!' : '📋 Copiar Template'}
              </button>
            </div>
          </div>

          {/* Enviar Mensagem */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Enviar Mensagem</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-aureon-text text-sm mb-2">Selecionar Cliente</label>
                <select
                  value={clienteSelecionado}
                  onChange={(e) => setClienteSelecionado(e.target.value)}
                  className="w-full px-3 py-2 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
                >
                  <option value="">Escolha um cliente...</option>
                  {clientesComAnalise.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.segmento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-aureon-text text-sm mb-2">Mensagem</label>
                <textarea
                  value={mensagemCustom}
                  onChange={(e) => setMensagemCustom(e.target.value)}
                  rows="10"
                  placeholder="Digite sua mensagem..."
                  className="w-full px-3 py-2 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text placeholder-[var(--aureon-text)]/50 focus:outline-none focus:border-aureon-gold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={enviarWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>
                <button
                  onClick={enviarEmail}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Mail size={18} />
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

