import React, { useState, useContext } from 'react';
import { Calculator, DollarSign, Truck, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { DataContext } from '../context/DataContext';

/**
 * Calculadora de Preço de Venda
 * Calcula o preço ideal considerando custos de importação e margens
 * Suporta múltiplos canais de venda configurados em Settings
 */
export default function PriceCalculator() {
  const { config } = useContext(DataContext);
  const [custoAlibaba, setCustoAlibaba] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [freteInternacional, setFreteInternacional] = useState('');
  const [freteNacional, setFreteNacional] = useState('15');
  const [margemLucro, setMargemLucro] = useState('40');
  const [regimeTributario, setRegimeTributario] = useState('MEI'); // MEI, ME, Lucro Presumido
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [sugestaoIA, setSugestaoIA] = useState(null);
  const [carregandoIA, setCarregandoIA] = useState(false);

  // Canais ativos (do config)
  const canaisAtivos = config?.canaisAtivos || ['mercado-livre', 'whatsapp', 'loja-fisica'];

  // Taxas por canal de venda
  const TAXAS_CANAIS = {
    'mercado-livre': { nome: 'Mercado Livre', taxa: 16.5, cor: '#FFE600', icon: '🛒' },
    'amazon': { nome: 'Amazon', taxa: 15, cor: '#FF9900', icon: '📦' },
    'shopee': { nome: 'Shopee', taxa: 12, cor: '#EE4D2D', icon: '🛍️' },
    'shein': { nome: 'Shein', taxa: 20, cor: '#000000', icon: '👗' },
    'instagram': { nome: 'Instagram', taxa: 5, cor: '#E4405F', icon: '📱' },
    'whatsapp': { nome: 'WhatsApp', taxa: 0, cor: '#25D366', icon: '💬' },
    'loja-fisica': { nome: 'Loja Física', taxa: 0, cor: '#4ade80', icon: '🏪' },
    'site-proprio': { nome: 'Site Próprio', taxa: 3, cor: '#60a5fa', icon: '🌐' }
  };

  // Regimes tributários
  const REGIMES = {
    'MEI': {
      nome: 'MEI - Microempreendedor Individual',
      impostos: 0, // Valor fixo mensal, não sobre produto
      simplificado: true,
      limiteAnual: 81000
    },
    'ME': {
      nome: 'ME - Simples Nacional',
      impostos: 4.5, // Alíquota inicial Simples (comércio)
      simplificado: true,
      limiteAnual: 360000
    },
    'LUCRO_PRESUMIDO': {
      nome: 'Lucro Presumido',
      impostos: 11.33, // IRPJ + CSLL + PIS + COFINS
      simplificado: false,
      limiteAnual: 78000000
    }
  };

  // Taxas e impostos de importação
  const TAXAS_BASE = {
    impostoImportacao: 60, // II (60%)
    ipi: 0, // Varia por NCM, usar 0 como padrão
    cotacaoDolar: 5.85,
    taxaDespacho: 150,
    siscomex: 214.50, // Taxa fixa Siscomex
    armazenagem: 50 // Estimativa
  };

  const calcularPrecoVenda = () => {
    const custo = parseFloat(custoAlibaba) || 0;
    const qtd = parseInt(quantidade) || 1;
    const freteInt = parseFloat(freteInternacional) || 0;
    const freteNac = parseFloat(freteNacional) || 0;
    const margem = parseFloat(margemLucro) || 0;
    const regime = REGIMES[regimeTributario];

    if (custo === 0) return null;

    // ETAPA 1: CUSTO FOB (produto + frete internacional)
    const custoFOB_USD = custo * qtd;
    const freteInternacional_USD = freteInt;
    const custoTotal_USD = custoFOB_USD + freteInternacional_USD;

    // ETAPA 2: CONVERTER PARA BRL
    const custoFOB_BRL = custoFOB_USD * TAXAS_BASE.cotacaoDolar;
    const freteInternacional_BRL = freteInternacional_USD * TAXAS_BASE.cotacaoDolar;
    const custoTotal_BRL = custoTotal_USD * TAXAS_BASE.cotacaoDolar;

    // ETAPA 3: IMPOSTOS DE IMPORTAÇÃO (sobre valor CIF)
    // II = (CIF + Seguro) * 60%
    const seguroEstimado = custoTotal_BRL * 0.01; // 1% do valor
    const valorCIF = custoTotal_BRL + seguroEstimado;
    const impostoImportacao = valorCIF * (TAXAS_BASE.impostoImportacao / 100);
    const ipi = (valorCIF + impostoImportacao) * (TAXAS_BASE.ipi / 100);

    // ETAPA 4: TAXAS FIXAS
    const taxasFixas = TAXAS_BASE.taxaDespacho + TAXAS_BASE.siscomex + TAXAS_BASE.armazenagem;

    // ETAPA 5: CUSTO TOTAL DE IMPORTAÇÃO
    const custoTotalImportacao = valorCIF + impostoImportacao + ipi + taxasFixas;
    
    // ETAPA 6: CUSTO POR UNIDADE (base para cálculo)
    let custoPorUnidade = custoTotalImportacao / qtd;
    
    // Adicionar frete nacional por unidade
    custoPorUnidade += freteNac;

    // ETAPA 7: ADICIONAR MARGEM DE LUCRO
    const precoBase = custoPorUnidade * (1 + margem / 100);

    // ETAPA 8: CALCULAR PREÇO FINAL PARA CADA CANAL
    const precosPorCanal = {};
    canaisAtivos.forEach(canalId => {
      const canal = TAXAS_CANAIS[canalId];
      if (!canal) return;

      // Fórmula correta: Preço = (Custo + Impostos) / (1 - Taxa do Canal - Impostos sobre Venda)
      let precoFinal;
      let impostoVenda = 0;
      let taxaCanal = canal.taxa / 100;

      if (regime.simplificado) {
        // MEI ou Simples Nacional
        impostoVenda = regime.impostos / 100;
        // Preço = Custo / (1 - Taxa Canal - Imposto)
        precoFinal = precoBase / (1 - taxaCanal - impostoVenda);
      } else {
        // Lucro Presumido
        impostoVenda = regime.impostos / 100;
        precoFinal = precoBase / (1 - taxaCanal - impostoVenda);
      }

      const taxaPaga = precoFinal * taxaCanal;
      const impostoPago = precoFinal * impostoVenda;
      const lucroLiquido = precoFinal - custoPorUnidade - taxaPaga - impostoPago;
      const margemReal = (lucroLiquido / custoPorUnidade) * 100;

      precosPorCanal[canalId] = {
        nome: canal.nome,
        icon: canal.icon,
        cor: canal.cor,
        taxa: canal.taxa,
        precoFinal,
        taxaPaga,
        impostoPago,
        lucroLiquido,
        margemReal
      };
    });

    return {
      custoFOB_USD,
      freteInternacional_USD,
      custoTotal_USD,
      custoFOB_BRL,
      freteInternacional_BRL,
      custoTotal_BRL,
      seguroEstimado,
      valorCIF,
      impostoImportacao,
      ipi,
      taxasFixas,
      custoTotalImportacao,
      custoPorUnidade,
      freteNacional: freteNac,
      precoBase,
      regime: regime.nome,
      precosPorCanal
    };
  };

  const analisarComIA = async () => {
    if (!resultado) return;
    
    setCarregandoIA(true);
    
    // Simular análise de IA (em produção, chamar API real)
    setTimeout(() => {
      const analise = {
        margemRecomendada: 35,
        justificativa: 'Com base na análise de mercado, uma margem de 35% oferece melhor competitividade mantendo lucratividade saudável.',
        insights: [
          `💡 Seu regime ${regimeTributario} tem vantagem fiscal significativa`,
          `📊 Produtos similares no mercado custam entre R$ ${(resultado.custoPorUnidade * 1.4).toFixed(2)} - R$ ${(resultado.custoPorUnidade * 1.8).toFixed(2)}`,
          `🎯 Margem de ${margemLucro}% está ${parseFloat(margemLucro) > 40 ? 'acima' : 'dentro'} da média do setor`,
          `⚡ Para vendas rápidas, reduza 10-15% no preço`,
          `💰 Para maximizar lucro, pode aumentar até 50% em canais diretos`
        ],
        alertas: [
          parseFloat(margemLucro) < 30 && '⚠️ Margem abaixo de 30% pode comprometer sustentabilidade',
          parseFloat(margemLucro) > 60 && '⚠️ Margem acima de 60% pode reduzir competitividade',
          parseFloat(quantidade) < 50 && '💡 Aumentar quantidade pode reduzir custo unitário'
        ].filter(Boolean)
      };
      
      setSugestaoIA(analise);
      setCarregandoIA(false);
    }, 1500);
  };

  const resultado = calcularPrecoVenda();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, var(--aureon-bg), var(--aureon-surface))',
      padding: '32px',
      color: '#fff'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            color: 'var(--aureon-gold)',
            fontSize: '32px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Calculator size={36} />
            Calculadora de Preço de Venda
          </h1>
          <p style={{ color: '#aaa', fontSize: '14px' }}>
            Calcule o preço ideal para vender no Mercado Livre considerando todos os custos de importação
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Formulário */}
          <div style={{
            background: 'var(--aureon-surface)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: 'var(--aureon-gold)', marginBottom: '20px', fontSize: '18px' }}>
              📦 Dados do Produto
            </h3>

            {/* Custo Alibaba */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--aureon-text)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                💵 Custo no Alibaba (USD por unidade)
              </label>
              <input
                type="number"
                step="0.01"
                value={custoAlibaba}
                onChange={(e) => setCustoAlibaba(e.target.value)}
                placeholder="Ex: 5.50"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--aureon-bg)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Quantidade */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--aureon-text)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                📦 Quantidade (MOQ)
              </label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex: 100"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--aureon-bg)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Frete Internacional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--aureon-text)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                ✈️ Frete Internacional (USD total)
              </label>
              <input
                type="number"
                step="0.01"
                value={freteInternacional}
                onChange={(e) => setFreteInternacional(e.target.value)}
                placeholder="Ex: 50.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--aureon-bg)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Frete Nacional */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--aureon-text)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                🚚 Frete Nacional (R$ por unidade)
              </label>
              <input
                type="number"
                step="0.01"
                value={freteNacional}
                onChange={(e) => setFreteNacional(e.target.value)}
                placeholder="Ex: 15.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--aureon-bg)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Regime Tributário */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--aureon-text)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                🏛️ Regime Tributário
              </label>
              <select
                value={regimeTributario}
                onChange={(e) => setRegimeTributario(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--aureon-bg)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <option value="MEI">MEI - Microempreendedor (0% sobre venda)</option>
                <option value="ME">ME - Simples Nacional (4.5%)</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido (11.33%)</option>
              </select>
            </div>

            {/* Margem de Lucro */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--aureon-text)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                📈 Margem de Lucro Desejada (%)
              </label>
              <input
                type="number"
                step="1"
                value={margemLucro}
                onChange={(e) => setMargemLucro(e.target.value)}
                placeholder="Ex: 40"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--aureon-bg)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Info sobre taxas */}
            <div style={{
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid #4ade80',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#4ade80'
            }}>
              <strong>💡 Configurações do cálculo:</strong>
              <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.6' }}>
                <li>Dólar: R$ {TAXAS_BASE.cotacaoDolar.toFixed(2)}</li>
                <li>Imposto de Importação: {TAXAS_BASE.impostoImportacao}%</li>
                <li>Regime: {REGIMES[regimeTributario].nome}</li>
                <li>Taxas fixas: R$ {(TAXAS_BASE.taxaDespacho + TAXAS_BASE.siscomex + TAXAS_BASE.armazenagem).toFixed(2)}</li>
              </ul>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(74, 222, 128, 0.3)' }}>
                <strong>📊 Canais ativos ({canaisAtivos.length}):</strong>
                <div style={{ marginTop: '4px' }}>
                  {canaisAtivos.map(id => TAXAS_CANAIS[id]).filter(Boolean).map(canal => (
                    <span key={canal.nome} style={{ marginRight: '8px', display: 'inline-block', marginBottom: '4px' }}>
                      {canal.icon} {canal.nome} ({canal.taxa}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div style={{
            background: 'var(--aureon-surface)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: 'var(--aureon-gold)', marginBottom: '20px', fontSize: '18px' }}>
              💰 Preços por Canal de Venda
            </h3>

            {resultado ? (
              <>
                {/* Custo Base */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>
                    💵 Custo Total por Unidade
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--aureon-gold)' }}>
                    R$ {resultado.custoPorUnidade.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    (com todos os impostos de importação)
                  </div>
                </div>

                {/* Preços por Canal */}
                <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                  {Object.entries(resultado.precosPorCanal).map(([canalId, dados]) => (
                    <div
                      key={canalId}
                      style={{
                        background: 'var(--aureon-bg)',
                        border: '2px solid ' + dados.cor,
                        borderRadius: '12px',
                        padding: '20px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Background com ícone */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        fontSize: '100px',
                        opacity: 0.05
                      }}>
                        {dados.icon}
                      </div>

                      {/* Header do canal */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '24px' }}>{dados.icon}</span>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: dados.cor }}>
                              {dados.nome}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              Taxa: {dados.taxa}%
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>Preço de Venda</div>
                          <div style={{ fontSize: '28px', fontWeight: 'bold', color: dados.cor }}>
                            R$ {dados.precoFinal.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Detalhes */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '12px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Taxa paga</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f87171' }}>
                            R$ {dados.taxaPaga.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Lucro líquido</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80' }}>
                            R$ {dados.lucroLiquido.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Margem real</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {dados.margemReal.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão IA */}
                <button
                  onClick={analisarComIA}
                  disabled={carregandoIA}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: carregandoIA ? 'not-allowed' : 'pointer',
                    marginBottom: '12px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: carregandoIA ? 0.7 : 1
                  }}
                >
                  {carregandoIA ? '⏳ Analisando...' : '🤖 Analisar com IA'}
                </button>

                {/* Resultado da IA */}
                {sugestaoIA && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
                    border: '2px solid #8b5cf6',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🤖</span>
                      <strong style={{ color: '#8b5cf6', fontSize: '16px' }}>Análise Inteligente</strong>
                    </div>
                    
                    <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Margem Recomendada</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {sugestaoIA.margemRecomendada}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                        {sugestaoIA.justificativa}
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                      {sugestaoIA.insights.map((insight, i) => (
                        <div key={i} style={{ color: '#ddd', marginBottom: '6px' }}>
                          {insight}
                        </div>
                      ))}
                    </div>

                    {sugestaoIA.alertas.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        {sugestaoIA.alertas.map((alerta, i) => (
                          <div key={i} style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '4px' }}>
                            {alerta}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setMargemLucro(sugestaoIA.margemRecomendada.toString())}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '10px',
                        background: '#8b5cf6',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      ✨ Aplicar Margem Recomendada
                    </button>
                  </div>
                )}

                {/* Botão Detalhes */}
                <button
                  onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid var(--aureon-gold)',
                    borderRadius: '8px',
                    color: 'var(--aureon-gold)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '20px'
                  }}
                >
                  {mostrarDetalhes ? '▲ Ocultar' : '▼ Ver'} Detalhamento Completo
                </button>

                {/* Detalhes Expandidos */}
                {mostrarDetalhes && (
                  <div style={{
                    background: 'var(--aureon-bg)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '13px'
                  }}>
                    <div style={{ color: 'var(--aureon-gold)', fontWeight: 'bold', marginBottom: '12px' }}>
                      📦 ETAPA 1: Custo FOB
                    </div>
                    <div style={{ marginBottom: '8px', paddingLeft: '12px', color: '#aaa' }}>
                      • Produto: ${resultado.custoFOB_USD.toFixed(2)} USD<br/>
                      • Frete internacional: ${resultado.freteInternacional_USD.toFixed(2)} USD<br/>
                      • <strong>Total USD: ${resultado.custoTotal_USD.toFixed(2)}</strong><br/>
                      • <strong>Total BRL: R$ {resultado.custoTotal_BRL.toFixed(2)}</strong>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <div style={{ color: 'var(--aureon-gold)', fontWeight: 'bold', marginBottom: '12px' }}>
                        🛃 ETAPA 2: Impostos de Importação
                      </div>
                      <div style={{ marginBottom: '8px', paddingLeft: '12px', color: '#aaa' }}>
                        • Valor CIF: R$ {resultado.valorCIF.toFixed(2)}<br/>
                        • II ({TAXAS_BASE.impostoImportacao}%): <span style={{ color: '#f87171' }}>R$ {resultado.impostoImportacao.toFixed(2)}</span><br/>
                        • IPI ({TAXAS_BASE.ipi}%): <span style={{ color: '#f87171' }}>R$ {resultado.ipi.toFixed(2)}</span><br/>
                        • Taxas (Despacho + Siscomex + Armaz.): <span style={{ color: '#f87171' }}>R$ {resultado.taxasFixas.toFixed(2)}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <div style={{ color: 'var(--aureon-gold)', fontWeight: 'bold', marginBottom: '12px' }}>
                        💰 ETAPA 3: Custo Final
                      </div>
                      <div style={{ marginBottom: '8px', paddingLeft: '12px' }}>
                        <div style={{ color: '#aaa', marginBottom: '4px' }}>
                          • Custo total de importação: R$ {resultado.custoTotalImportacao.toFixed(2)}<br/>
                          • Frete nacional/unidade: R$ {resultado.freteNacional.toFixed(2)}<br/>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80', marginTop: '8px' }}>
                          Custo/Unidade: R$ {resultado.custoPorUnidade.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <div style={{ color: 'var(--aureon-gold)', fontWeight: 'bold', marginBottom: '8px' }}>
                        🏛️ Regime Tributário
                      </div>
                      <div style={{ paddingLeft: '12px', color: '#aaa', fontSize: '12px' }}>
                        {resultado.regime} - Os impostos sobre venda já estão incluídos no preço final de cada canal
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--aureon-gold)' }}>
                      <div style={{ color: 'var(--aureon-gold)', fontWeight: 'bold', marginBottom: '12px' }}>
                        Resumo do Lote Completo ({quantidade} un)
                      </div>
                      <div style={{ color: '#aaa', fontSize: '12px' }}>
                        <strong>Investimento total:</strong> R$ {(resultado.custoPorUnidade * parseInt(quantidade || 1)).toFixed(2)}
                      </div>
                      <div style={{ marginTop: '12px', color: 'var(--aureon-gold)', fontWeight: 'bold' }}>
                        Receitas por canal:
                      </div>
                      {Object.entries(resultado.precosPorCanal).map(([canalId, dados]) => (
                        <div key={canalId} style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
                          {dados.icon} <strong>{dados.nome}:</strong><br/>
                          <span style={{ marginLeft: '24px' }}>
                            • Receita bruta: R$ {(dados.precoFinal * parseInt(quantidade || 1)).toFixed(2)}<br/>
                            • Lucro líquido: R$ {(dados.lucroLiquido * parseInt(quantidade || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <Calculator size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Preencha os campos ao lado para calcular o preço de venda</p>
              </div>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div style={{
          marginTop: '24px',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid #fbbf24',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'start'
        }}>
          <AlertCircle size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#fbbf24', lineHeight: '1.6' }}>
            <strong>⚠️ Atenção:</strong> Esta calculadora usa valores médios de impostos e taxas. 
            Os valores reais podem variar dependendo do tipo de produto (NCM), país de origem, 
            e acordos comerciais. Consulte um despachante aduaneiro para valores exatos. 
            A cotação do dólar é atualizada manualmente.
          </div>
        </div>
      </div>
    </div>
  );
}
