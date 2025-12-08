import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  analyzeTrends,
  getSmartProductRecommendations,
  getPredictiveStockAlerts,
  analyzeCustomerBehavior
} from '../services/OpenAIService';

/**
 * Painel de Insights Avançados de IA
 * Exibe análises inteligentes: tendências, recomendações, alertas e comportamento
 */
export default function AIInsightsPanel({ salesData, productsData, customersData }) {
  const [activeTab, setActiveTab] = useState('trends');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState({
    trends: null,
    recommendations: null,
    stockAlerts: null,
    customerBehavior: null
  });

  // Tabs de navegação
  const tabs = [
    { id: 'trends', label: 'Tendências', icon: TrendingUp },
    { id: 'recommendations', label: 'Recomendações', icon: Sparkles },
    { id: 'stockAlerts', label: 'Alertas de Estoque', icon: Package },
    { id: 'customerBehavior', label: 'Comportamento', icon: Users }
  ];

  // Carregar insights da IA
  const loadInsights = async () => {
    setLoading(true);
    
    // ✅ LOG DETALHADO: Dados enviados para IA
    console.group('🤖 [AIInsightsPanel] Dados enviados para análise');
    console.log('📊 salesData:', salesData ? {
      tipo: typeof salesData,
      tamanho: Array.isArray(salesData) ? salesData.length : 'não é array',
      amostra: Array.isArray(salesData) ? salesData.slice(0, 2) : salesData
    } : '❌ NULL');
    
    console.log('📦 productsData:', productsData ? {
      available: productsData.available ? `${productsData.available.length} produtos` : '❌ NULL',
      inventory: productsData.inventory ? `${productsData.inventory.length} items` : '❌ NULL',
      amostraAvailable: productsData.available?.slice(0, 2),
      amostraInventory: productsData.inventory?.slice(0, 2)
    } : '❌ NULL');
    
    console.log('👥 customersData:', customersData ? {
      tipo: typeof customersData,
      tamanho: Array.isArray(customersData) ? customersData.length : 'não é array',
      amostra: Array.isArray(customersData) ? customersData.slice(0, 2) : customersData
    } : '❌ NULL');
    console.groupEnd();
    
    try {
      // ✅ Validar dados antes de chamar IA
      const hasValidSales = Array.isArray(salesData) && salesData.length > 0;
      const hasValidProducts = productsData?.available && productsData.available.length > 0;
      const hasValidInventory = productsData?.inventory && productsData.inventory.length > 0;
      const hasValidCustomers = Array.isArray(customersData) && customersData.length > 0;

      const [trends, recommendations, stockAlerts, customerBehavior] = await Promise.all([
        hasValidSales ? analyzeTrends(salesData, 'geral') : Promise.resolve(null),
        hasValidProducts ? getSmartProductRecommendations(
          { purchases: [], preferredCategory: 'Geral', averageTicket: 100 },
          productsData.available
        ) : Promise.resolve(null),
        hasValidInventory ? getPredictiveStockAlerts(productsData.inventory) : Promise.resolve(null),
        hasValidCustomers ? analyzeCustomerBehavior(customersData) : Promise.resolve(null)
      ]);

      // ✅ LOG DETALHADO: Respostas da IA
      console.group('🤖 [AIInsightsPanel] Respostas da IA');
      console.log('📈 trends:', trends);
      console.log('💡 recommendations:', recommendations);
      console.log('⚠️ stockAlerts:', stockAlerts);
      console.log('👤 customerBehavior:', customerBehavior);
      console.groupEnd();

      setInsights({ trends, recommendations, stockAlerts, customerBehavior });
    } catch (error) {
      console.error('❌ [AIInsightsPanel] Erro ao carregar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salesData || productsData || customersData) {
      loadInsights();
    }
  }, [salesData, productsData, customersData]);

  return (
    <div className="bg-aureon-surface border border-blue-400/30 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-blue-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Sparkles size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-blue-400">Insights Avançados de IA</h2>
              <p className="text-sm text-aureon-text/70">Análises inteligentes para tomada de decisão</p>
            </div>
          </div>
          <button
            onClick={loadInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-aureon-gold/20 bg-aureon-bg/50">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/10 border-b-2 border-blue-400 text-blue-400'
                  : 'text-aureon-text/60 hover:text-aureon-text hover:bg-aureon-bg/80'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw size={48} className="text-blue-400 animate-spin mb-4" />
            <p className="text-aureon-text/70">Analisando dados com IA...</p>
          </div>
        ) : (
          <>
            {/* Tendências Sazonais */}
            {activeTab === 'trends' && (
              insights.trends ? (
                <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className={`${
                    insights.trends.tendencia === 'crescimento' ? 'text-green-400' :
                    insights.trends.tendencia === 'declinio' ? 'text-red-400' : 'text-yellow-400'
                  }`} size={24} />
                  <h3 className="text-lg font-semibold text-aureon-text capitalize">
                    Tendência: {insights.trends.tendencia}
                  </h3>
                </div>

                <div className="bg-aureon-bg p-4 rounded-lg border border-aureon-gold/10">
                  <h4 className="text-blue-400 font-medium mb-2">📊 Sazonalidade</h4>
                  <p className="text-aureon-text/80">{insights.trends.sazonalidade}</p>
                </div>

                <div className="bg-aureon-bg p-4 rounded-lg border border-aureon-gold/10">
                  <h4 className="text-blue-400 font-medium mb-3">🔮 Previsão (3 meses)</h4>
                  <ul className="space-y-2">
                    {insights.trends.previsao_proximos_meses?.map((prev, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-aureon-text/80">
                        <ChevronRight size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                        <span>{prev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-aureon-bg p-4 rounded-lg border border-aureon-gold/10">
                  <h4 className="text-blue-400 font-medium mb-2">📦 Recomendação de Estoque</h4>
                  <p className="text-aureon-text/80">{insights.trends.recomendacao_estoque}</p>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-400/20">
                  <h4 className="text-green-400 font-medium mb-3">💡 Oportunidades</h4>
                  <ul className="space-y-2">
                    {insights.trends.oportunidades?.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-aureon-text/80">
                        <ChevronRight size={16} className="text-green-400 mt-1 flex-shrink-0" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp size={48} className="text-aureon-muted mx-auto mb-4" />
                  <p className="text-aureon-text/60 text-lg mb-2">Sem dados de vendas suficientes</p>
                  <p className="text-aureon-text/40 text-sm">Registre vendas para ver análises de tendências sazonais e previsões</p>
                </div>
              )
            )}

            {/* Recomendações de Produtos */}
            {activeTab === 'recommendations' && (
              insights.recommendations && insights.recommendations.length > 0 ? (
                <div className="space-y-3">
                <h3 className="text-lg font-semibold text-aureon-text mb-4 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-blue-400" />
                  Produtos Recomendados para Venda
                </h3>
                {insights.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      rec.prioridade === 'alta'
                        ? 'bg-red-500/5 border-red-400/30'
                        : rec.prioridade === 'media'
                        ? 'bg-yellow-500/5 border-yellow-400/30'
                        : 'bg-blue-500/5 border-blue-400/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-aureon-text">{rec.produto}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.prioridade === 'alta'
                            ? 'bg-red-400/20 text-red-400'
                            : rec.prioridade === 'media'
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : 'bg-blue-400/20 text-blue-400'
                        }`}
                      >
                        {rec.prioridade.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-aureon-text/70 text-sm">{rec.motivo}</p>
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="text-aureon-muted mx-auto mb-4" />
                  <p className="text-aureon-text/60 text-lg mb-2">Sem produtos cadastrados</p>
                  <p className="text-aureon-text/40 text-sm">Cadastre produtos no estoque para receber recomendações inteligentes de vendas</p>
                </div>
              )
            )}

            {/* Alertas de Estoque */}
            {activeTab === 'stockAlerts' && insights.stockAlerts && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-aureon-text mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-yellow-400" />
                  Alertas Preditivos de Estoque
                </h3>
                {insights.stockAlerts.length === 0 ? (
                  <div className="text-center py-8 text-aureon-text/50">
                    ✅ Nenhum alerta crítico no momento
                  </div>
                ) : (
                  insights.stockAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        alert.urgencia === 'critico'
                          ? 'bg-red-500/10 border-red-400/30'
                          : alert.urgencia === 'alto'
                          ? 'bg-orange-500/10 border-orange-400/30'
                          : 'bg-yellow-500/10 border-yellow-400/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-aureon-text">{alert.produto}</h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              alert.urgencia === 'critico'
                                ? 'bg-red-500 text-white'
                                : alert.urgencia === 'alto'
                                ? 'bg-orange-500 text-white'
                                : 'bg-yellow-500 text-black'
                            }`}
                          >
                            {alert.urgencia.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className="text-aureon-text/60">Dias até ruptura:</span>
                          <span className="ml-2 font-bold text-red-400">{alert.dias_ate_ruptura} dias</span>
                        </div>
                        <div>
                          <span className="text-aureon-text/60">Qtd. recomendada:</span>
                          <span className="ml-2 font-bold text-green-400">{alert.qtd_recomendada} un</span>
                        </div>
                      </div>
                      <div className="bg-aureon-bg/50 p-3 rounded border border-aureon-gold/10">
                        <p className="text-aureon-text/80 text-sm">{alert.acao}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Comportamento de Clientes */}
            {activeTab === 'customerBehavior' && (
              insights.customerBehavior ? (
                <div className="space-y-4">
                <h3 className="text-lg font-semibold text-aureon-text mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-400" />
                  Análise de Comportamento (RFM)
                </h3>

                {/* Segmentação */}
                {insights.customerBehavior.segmentacao && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(insights.customerBehavior.segmentacao).map(([key, segment]) => (
                      <div key={key} className="bg-aureon-bg p-4 rounded-lg border border-aureon-gold/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-aureon-gold capitalize">{key.replace('_', ' ')}</h4>
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-bold">
                            {segment.quantidade}
                          </span>
                        </div>
                        <p className="text-aureon-text/70 text-sm mb-2">{segment.descricao}</p>
                        <div className="bg-blue-500/10 p-2 rounded border border-blue-400/20">
                          <p className="text-xs text-blue-400">💡 {segment.acao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clientes em Risco de Churn */}
                {insights.customerBehavior.churn_risk && (
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-400/30">
                    <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} />
                      Clientes em Risco de Churn
                    </h4>
                    <ul className="space-y-2">
                      {insights.customerBehavior.churn_risk.map((client, idx) => (
                        <li key={idx} className="text-aureon-text/80 text-sm flex items-center gap-2">
                          <ChevronRight size={14} className="text-red-400" />
                          {client}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Oportunidades */}
                {insights.customerBehavior.oportunidades && (
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-400/30">
                    <h4 className="text-green-400 font-semibold mb-3">💰 Oportunidades</h4>
                    <ul className="space-y-2">
                      {insights.customerBehavior.oportunidades.map((opp, idx) => (
                        <li key={idx} className="text-aureon-text/80 text-sm flex items-center gap-2">
                          <ChevronRight size={14} className="text-green-400" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Campanhas Recomendadas */}
                {insights.customerBehavior.campanhas_recomendadas && (
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-3">📧 Campanhas Recomendadas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {insights.customerBehavior.campanhas_recomendadas.map((campanha, idx) => (
                        <div key={idx} className="bg-aureon-bg p-4 rounded-lg border border-blue-400/20">
                          <h5 className="font-semibold text-aureon-text mb-2">{campanha.nome}</h5>
                          <div className="space-y-1 text-sm text-aureon-text/70">
                            <p><strong>Público:</strong> {campanha.publico}</p>
                            <p><strong>Oferta:</strong> {campanha.desconto}</p>
                            <p className="text-green-400 font-bold">ROI Esperado: {campanha.roi_esperado}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={48} className="text-aureon-muted mx-auto mb-4" />
                  <p className="text-aureon-text/60 text-lg mb-2">Sem clientes cadastrados</p>
                  <p className="text-aureon-text/40 text-sm">Cadastre clientes e registre vendas para ver análise de comportamento RFM</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
