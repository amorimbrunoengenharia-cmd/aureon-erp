import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContextAPI';
import { ShoppingBag, AlertTriangle, TrendingDown, CheckCircle, Plus, DollarSign, TrendingUp, Target, Zap } from 'lucide-react';
import ReplenishmentService from '../services/ReplenishmentService';
import BusinessLogic from '../services/BusinessLogicService';

/**
 * CENTRAL DE COMPRAS - Otimização de Reposição
 * Sistema inteligente para gerenciar compras e fornecedores
 */
export default function PurchaseCenter() {
  const dataContext = useContext(DataContext);
  const { produtos, fornecedores, itensEstoque = [], addProduto, vendas = [], config = {} } = dataContext;
  const { getUserSettings } = useAuth();
  const [view, setView] = useState('sugestoes'); // sugestoes | fornecedores | historico
  
  // ✅ RBAC: Obter configurações do usuário (perfil Compras pode configurar diasSeguranca)
  const userSettings = getUserSettings();
  const diasSeguranca = userSettings.diasSeguranca || config.fatorSeguranca || 3;

  // ✅ ALGORITMO AVANÇADO DE REPOSIÇÃO (BusinessLogicService)
  const produtosParaRepor = useMemo(() => {
    try {
      // ✅ FIX: Usar BusinessLogicService em vez de ReplenishmentService
      const configComUserSettings = {
        ...config,
        metaCrescimento: config.metaCrescimento || 20,
        diasSeguranca: diasSeguranca
      };
      const sugestoes = BusinessLogic.gerarSugestoesReposicao(
        produtos,
        vendas,
        fornecedores,
        configComUserSettings
      );
      return sugestoes;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }, [produtos, vendas, fornecedores, config, diasSeguranca]);

  // Relatório consolidado
  const relatorioCompras = useMemo(() => {
    if (produtosParaRepor.length === 0) return null;
    return ReplenishmentService.gerarRelatorio(produtosParaRepor);
  }, [produtosParaRepor]);

  // Análise de fornecedores - ✅ FIX: Usar precoCusto
  const analiseFornecedores = useMemo(() => {
    return fornecedores.map(forn => {
      const produtosFornecedor = produtos.filter(p => p.fornecedorId === forn.id);
      const totalEstoque = produtosFornecedor.reduce((acc, p) => acc + (p.estoque || 0), 0);
      // ✅ FIX: Usar precoCusto em vez de preco
      const valorEstoque = produtosFornecedor.reduce((acc, p) => {
        const custo = p.precoCusto || p.valorCompra || 0;
        return acc + (p.estoque || 0) * custo;
      }, 0);
      
      return {
        ...forn,
        qtdProdutos: produtosFornecedor.length,
        totalEstoque,
        valorEstoque,
        produtosCriticos: produtosFornecedor.filter(p => (p.estoque || 0) < 5).length
      };
    }).sort((a, b) => b.produtosCriticos - a.produtosCriticos);
  }, [fornecedores, produtos]);

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade?.toUpperCase()) {
      case 'CRITICA': return 'bg-red-600/30 text-red-300 border-red-400/50';
      case 'ALTA': return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'MEDIA': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'BAIXA': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      default: return 'bg-aureon-muted/20 text-aureon-muted border-aureon-muted/30';
    }
  };

  const getPrioridadeLabel = (prioridade) => {
    switch (prioridade?.toUpperCase()) {
      case 'CRITICA': return '🔴 CRÍTICO';
      case 'ALTA': return '🟠 URGENTE';
      case 'MEDIA': return '🟡 MÉDIO';
      case 'BAIXA': return '🟢 BAIXO';
      default: return '⚪ N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-aureon-gold mb-2 flex items-center gap-3">
            <ShoppingBag size={36} />
            Central de Compras
          </h1>
          <p className="text-aureon-text/70">Sistema inteligente de reposição e gestão de fornecedores</p>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500/10 to-aureon-surface border border-red-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Produtos Críticos</span>
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">
              {relatorioCompras?.produtos_criticos || 0}
            </p>
            <p className="text-xs text-aureon-text/50 mt-1">Estoque zero ou muito baixo</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-aureon-surface border border-orange-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Necessita Reposição</span>
              <TrendingUp size={20} className="text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-orange-400">
              {relatorioCompras?.total_produtos || 0}
            </p>
            <p className="text-xs text-aureon-text/50 mt-1">Abaixo do ponto de pedido</p>
          </div>

          <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Investimento Necessário</span>
              <Target size={20} className="text-aureon-gold" />
            </div>
            <p className="text-3xl font-bold text-aureon-gold">
              R$ {relatorioCompras?.investimento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </p>
            <p className="text-xs text-aureon-text/50 mt-1">Para atender demanda</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-aureon-surface border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Unidades a Comprar</span>
              <Zap size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">
              {relatorioCompras?.unidades_totais || 0}
            </p>
            <p className="text-xs text-aureon-text/50 mt-1">Meta de crescimento: {config.metaCrescimento || 20}%</p>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('sugestoes')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'sugestoes'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text/70 border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            🔔 Sugestões de Compra
          </button>
          <button
            onClick={() => setView('fornecedores')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'fornecedores'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text/70 border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            📊 Análise de Fornecedores
          </button>
        </div>

        {/* Conteúdo */}
        {view === 'sugestoes' && (
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-aureon-gold mb-2 flex items-center gap-2">
                🤖 Lista de Reposição Inteligente
              </h2>
              <p className="text-sm text-aureon-text/70">
                Algoritmo Avançado: <span className="text-aureon-gold">VMD Projetada</span> • <span className="text-yellow-400">Estoque Segurança</span> • <span className="text-orange-400">Ponto de Pedido</span> • <span className="text-purple-400">Score Prioridade</span> • <span className="text-green-400">Meta {config.metaCrescimento || 20}%</span>
              </p>
            </div>
            
            {produtosParaRepor.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
                <p className="text-xl text-aureon-text/70">✅ Todos os produtos estão com estoque adequado!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {produtosParaRepor.map(produto => (
                  <div key={produto.id} className="bg-aureon-bg border-l-4 border-aureon-gold rounded-lg p-5 hover:bg-aureon-surface/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-aureon-text">{produto.produto || produto.nome}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPrioridadeColor(produto.prioridade)}`}>
                            {getPrioridadeLabel(produto.prioridade)}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-bold bg-purple-400/20 text-purple-400">
                            ⭐ Score: {produto.score.toFixed(1)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            produto.status === 'COMPRAR' ? 'bg-red-400/20 text-red-400' : 'bg-green-400/20 text-green-400'
                          }`}>
                            {produto.status === 'COMPRAR' ? '🔴 COMPRAR' : '🟢 ESTOQUE OK'}
                          </span>
                        </div>
                        
                        {/* Métricas Inteligentes - Algoritmo Avançado */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                          <div className="bg-red-400/10 border border-red-400/30 rounded p-3">
                            <span className="block text-xs text-red-400/70 mb-1">Estoque Atual</span>
                            <span className="text-2xl font-bold text-red-400">{produto.estoque_atual}</span>
                          </div>
                          <div className="bg-blue-400/10 border border-blue-400/30 rounded p-3">
                            <span className="block text-xs text-blue-400/70 mb-1">VMD Projetada</span>
                            <span className="text-2xl font-bold text-blue-400">{produto.vmd_projetada.toFixed(1)}</span>
                          </div>
                          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded p-3">
                            <span className="block text-xs text-yellow-400/70 mb-1">Est. Segurança</span>
                            <span className="text-2xl font-bold text-yellow-400">{produto.estoque_seguranca}</span>
                          </div>
                          <div className="bg-orange-400/10 border border-orange-400/30 rounded p-3">
                            <span className="block text-xs text-orange-400/70 mb-1">Ponto Pedido</span>
                            <span className="text-2xl font-bold text-orange-400">{produto.ponto_de_pedido}</span>
                          </div>
                          <div className="bg-green-400/10 border border-green-400/30 rounded p-3">
                            <span className="block text-xs text-green-400/70 mb-1">🎯 Comprar</span>
                            <span className="text-2xl font-bold text-green-400">{produto.sugestao_compra} un</span>
                          </div>
                          <div className="bg-aureon-gold/10 border border-aureon-gold/30 rounded p-3">
                            <span className="block text-xs text-aureon-gold/70 mb-1">💰 Custo</span>
                            <span className="text-lg font-bold text-aureon-gold">
                              R$ {produto.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Fórmula Transparente */}
                        <div className="bg-aureon-bg/50 border border-aureon-gold/20 rounded p-3 mb-3">
                          <div className="text-xs text-aureon-text/50 space-y-1">
                            <p>📈 <strong>Passo 1:</strong> VMD Projetada = {produto.vmd_original.toFixed(2)} × (1 + {config.metaCrescimento || 20}%) = <span className="text-blue-400">{produto.vmd_projetada.toFixed(2)}</span></p>
                            <p>🛡️ <strong>Passo 2:</strong> Estoque Segurança = {produto.vmd_projetada.toFixed(2)} × {config.fatorSeguranca || 3} dias = <span className="text-yellow-400">{produto.estoque_seguranca}</span></p>
                            <p>📍 <strong>Passo 3:</strong> Ponto de Pedido = ({produto.vmd_projetada.toFixed(2)} × {produto.lead_time} dias) + {produto.estoque_seguranca} = <span className="text-orange-400">{produto.ponto_de_pedido}</span></p>
                            <p>🎯 <strong>Passo 4:</strong> Sugestão = MAX(0, {produto.ponto_de_pedido} - {produto.estoque_atual}) = <span className="text-green-400">{produto.sugestao_compra}</span></p>
                            <p>⭐ <strong>Score Prioridade:</strong> Margem {produto.margem_lucro.toFixed(1)}% × Volume {produto.volume_vendas} = <span className="text-purple-400">{produto.score.toFixed(1)}</span></p>
                          </div>
                        </div>

                        {/* Dados do Produto */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-aureon-text/50">💵 Valor Compra:</span>
                            <span className="ml-2 text-green-400 font-semibold">R$ {produto.valor_compra.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-aureon-text/50">💰 Valor Venda:</span>
                            <span className="ml-2 text-aureon-gold font-semibold">R$ {produto.valor_venda.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-aureon-text/50">📊 Margem Lucro:</span>
                            <span className="ml-2 text-purple-400 font-semibold">{produto.margem_lucro.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-aureon-text/50">📈 Volume Vendas:</span>
                            <span className="ml-2 text-blue-400 font-semibold">{produto.volume_vendas} un</span>
                          </div>
                        </div>

                        {produto.fornecedor && (
                          <div className="mt-3 p-3 bg-aureon-gold/10 rounded border border-aureon-gold/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-aureon-text/70 mb-1">🏢 Fornecedor</p>
                                <p className="text-sm font-semibold text-aureon-gold">{produto.fornecedor.nome}</p>
                              </div>
                              <div>
                                <p className="text-xs text-aureon-text/70 mb-1">⏱️ Lead Time</p>
                                <p className="text-sm font-semibold text-blue-400">{produto.lead_time} dias</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-aureon-text/70 mb-1">Contato</p>
                                <p className="text-xs text-aureon-text">
                                  📞 {produto.fornecedor.contato}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button className="ml-4 px-4 py-2 bg-aureon-gold text-aureon-bg rounded-lg font-semibold hover:bg-aureon-text transition-all">
                        <Plus size={16} className="inline mr-1" />
                        Realizar Pedido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'fornecedores' && (
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-aureon-gold mb-4">Análise Comparativa de Fornecedores</h2>
            
            <div className="space-y-4">
              {analiseFornecedores.map((forn, idx) => (
                <div key={idx} className="bg-aureon-bg border border-aureon-gold/10 rounded-lg p-6 hover:border-aureon-gold/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-aureon-text mb-1">{forn.nome}</h3>
                      <p className="text-sm text-aureon-text/60">{forn.empresa} | {forn.tipo}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                        {forn.origem}
                      </span>
                    </div>
                    
                    {forn.produtosCriticos > 0 && (
                      <div className="px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-lg text-center">
                        <AlertTriangle size={20} className="text-red-400 mx-auto mb-1" />
                        <p className="text-xs text-red-400 font-semibold">{forn.produtosCriticos} Críticos</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-aureon-surface/50 rounded-lg">
                    <div>
                      <p className="text-xs text-aureon-text/50 mb-1">Produtos Cadastrados</p>
                      <p className="text-2xl font-bold text-aureon-gold">{forn.qtdProdutos}</p>
                    </div>
                    <div>
                      <p className="text-xs text-aureon-text/50 mb-1">Total em Estoque</p>
                      <p className="text-2xl font-bold text-blue-400">{forn.totalEstoque} un</p>
                    </div>
                    <div>
                      <p className="text-xs text-aureon-text/50 mb-1">Valor do Estoque</p>
                      <p className="text-2xl font-bold text-green-400">R$ {forn.valorEstoque.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={`mailto:${forn.email}`}
                      className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-lg text-center font-semibold hover:bg-blue-500/30 transition-all"
                    >
                      📧 Enviar Email
                    </a>
                    <a
                      href={`https://wa.me/${forn.contato.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 border border-green-400/30 rounded-lg text-center font-semibold hover:bg-green-500/30 transition-all"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

