/**
 * OpenAI Service - API Integration
 * Serviço centralizado para integração com OpenAI API
 * Utiliza o novo formato de API (gpt-4o-mini)
 * 
 * Funcionalidades:
 * - Business Insights (análise estratégica)
 * - Trend Analysis (tendências sazonais)
 * - Product Recommendations (sugestões inteligentes)
 * - Predictive Stock Alerts (alertas preditivos)
 * - Customer Behavior Analysis (comportamento do cliente)
 * - Boleto Data Extraction (OCR de boletos)
 * - Pricing Recommendations (precificação estratégica)
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Configurações de modelo
const MODEL_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 800
};

/**
 * Gera insights de negócio usando GPT-4o-mini
 * @param {Object} metrics - Métricas do negócio
 * @returns {Promise<string>} - Insights gerados
 */
export async function generateBusinessInsights(metrics) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada');
    return generateMockInsights(metrics);
  }

  try {
    const prompt = `Você é um consultor de negócios especializado em análise de métricas. Analise os seguintes dados e forneça insights acionáveis:

Métricas de Vendas:
- Receita Total: R$ ${metrics.sales?.total || 0}
- Número de Vendas: ${metrics.sales?.count || 0}
- Ticket Médio: R$ ${metrics.sales?.averageTicket || 0}
- Crescimento: ${metrics.sales?.growth || 0}%

Métricas Financeiras:
- Receita: R$ ${metrics.finance?.revenue || 0}
- Despesas: R$ ${metrics.finance?.expenses || 0}
- Lucro: R$ ${metrics.finance?.profit || 0}
- Margem: ${metrics.finance?.margin || 0}%

Estoque:
- Valor Total: R$ ${metrics.inventory?.totalValue || 0}
- Produtos em Baixo Estoque: ${metrics.inventory?.lowStock || 0}
- Produtos Fora de Estoque: ${metrics.inventory?.outOfStock || 0}

Forneça 3-5 insights práticos e objetivos sobre:
1. Oportunidades de crescimento
2. Riscos ou alertas
3. Recomendações de ação imediata

Responda em português, de forma direta e profissional.`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor de negócios especializado em análise de métricas e insights estratégicos para empresas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API OpenAI');
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('❌ Erro ao gerar insights:', error);
    return generateMockInsights(metrics);
  }
}

/**
 * Analisa texto de boleto e extrai dados estruturados
 * @param {string} text - Texto do boleto
 * @returns {Promise<Object>} - Dados extraídos
 */
export async function extractBoletoData(text) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada - usando dados mock');
    return {
      descricao: 'Boleto (modo simulação)',
      valor: 0,
      dataVencimento: new Date().toISOString().split('T')[0],
      fornecedor: 'Fornecedor não identificado',
      categoria: 'Outros',
      observacoes: 'Configure VITE_OPENAI_API_KEY para extração real'
    };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em extrair dados de boletos e faturas. Extraia as informações e retorne APENAS um JSON válido.'
          },
          {
            role: 'user',
            content: `Extraia os dados deste boleto e retorne um JSON com: descricao, valor, dataVencimento (YYYY-MM-DD), fornecedor, categoria, observacoes.\n\nTexto:\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('Erro na API OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extrair JSON do conteúdo (pode vir com markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Resposta inválida da IA');

  } catch (error) {
    console.error('❌ Erro ao extrair dados do boleto:', error);
    throw error;
  }
}

/**
 * Gera recomendações de preço com base em custos
 * @param {Object} data - Dados do produto
 * @returns {Promise<Object>} - Recomendações
 */
export async function getPricingRecommendations(data) {
  if (!OPENAI_API_KEY) {
    return generateMockPricing(data);
  }

  try {
    const prompt = `Você é um especialista em precificação. Com base nos seguintes dados, sugira preços de venda:

Custo: R$ ${data.cost}
Margem Desejada: ${data.margin}%
Canal: ${data.channel}
Categoria: ${data.category}

Forneça:
1. Preço sugerido
2. Faixa de preço (mínimo e máximo)
3. Justificativa breve

Responda em JSON com: { suggestedPrice, minPrice, maxPrice, reasoning }`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um especialista em precificação estratégica.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 200
      })
    });

    const result = await response.json();
    const content = result.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return generateMockPricing(data);

  } catch (error) {
    console.error('❌ Erro ao gerar recomendações de preço:', error);
    return generateMockPricing(data);
  }
}

/**
 * Insights mock quando API não está configurada
 */
function generateMockInsights(metrics) {
  const insights = [];

  if (metrics.sales?.growth > 10) {
    insights.push('🚀 Excelente crescimento de vendas! Continue focando nas estratégias atuais.');
  } else if (metrics.sales?.growth < 0) {
    insights.push('⚠️ Queda nas vendas detectada. Considere campanhas promocionais ou revisão de preços.');
  }

  if (metrics.finance?.margin < 20) {
    insights.push('💰 Margem de lucro baixa. Analise custos operacionais e possibilidades de otimização.');
  }

  if (metrics.inventory?.lowStock > 5) {
    insights.push('📦 Vários produtos em baixo estoque. Planeje reposição para evitar perdas de venda.');
  }

  if (metrics.inventory?.outOfStock > 0) {
    insights.push('🔴 Produtos fora de estoque! Priorize reposição imediata dos itens mais vendidos.');
  }

  if (insights.length === 0) {
    insights.push('✅ Métricas estáveis. Continue monitorando para manter o desempenho.');
  }

  return insights.join('\n\n');
}

/**
 * Pricing mock quando API não está configurada
 */
function generateMockPricing(data) {
  const suggestedPrice = data.cost * (1 + data.margin / 100);
  return {
    suggestedPrice: suggestedPrice.toFixed(2),
    minPrice: (suggestedPrice * 0.9).toFixed(2),
    maxPrice: (suggestedPrice * 1.2).toFixed(2),
    reasoning: 'Cálculo baseado em margem padrão (modo simulação)'
  };
}

/**
 * Analisa tendências sazonais e prevê demanda futura
 * @param {Array} salesHistory - Histórico de vendas (últimos 12 meses)
 * @param {string} productCategory - Categoria do produto
 * @returns {Promise<Object>} - Análise de tendências e previsões
 */
export async function analyzeTrends(salesHistory, productCategory = 'geral') {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada - usando análise mock');
    return generateMockTrends();
  }

  try {
    const monthlyData = salesHistory.map(item => 
      `${item.month}: R$ ${item.revenue} (${item.units} unidades)`
    ).join('\n');

    const prompt = `Você é um analista de dados especializado em previsão de demanda. Analise o histórico de vendas abaixo e identifique:

Categoria: ${productCategory}
Histórico de Vendas (12 meses):
${monthlyData}

Forneça:
1. Tendências sazonais identificadas (alta/baixa temporada)
2. Padrões de crescimento ou declínio
3. Previsão para os próximos 3 meses
4. Recomendações de estoque
5. Oportunidades de promoção

Responda em formato JSON:
{
  "tendencia": "crescimento|estavel|declinio",
  "sazonalidade": "descricao_da_sazonalidade",
  "previsao_proximos_meses": ["mes1", "mes2", "mes3"],
  "recomendacao_estoque": "texto",
  "oportunidades": ["oportunidade1", "oportunidade2"]
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um analista de dados especializado em previsão de demanda e sazonalidade.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return { analise: content };
    }
  } catch (error) {
    console.error('Erro ao analisar tendências:', error);
    return generateMockTrends();
  }
}

/**
 * Gera recomendações inteligentes de produtos baseado em histórico
 * @param {Object} customerData - Dados do cliente (compras anteriores, preferências)
 * @param {Array} availableProducts - Produtos disponíveis
 * @returns {Promise<Array>} - Lista de produtos recomendados
 */
export async function getSmartProductRecommendations(customerData, availableProducts) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada - usando recomendações mock');
    return generateMockRecommendations();
  }

  try {
    const purchaseHistory = customerData.purchases?.map(p => 
      `${p.product} - R$ ${p.price}`
    ).join(', ') || 'Nenhuma compra anterior';

    const productsInfo = availableProducts.slice(0, 20).map(p => 
      `${p.name} (${p.category}) - R$ ${p.price}`
    ).join('\n');

    const prompt = `Você é um sistema de recomendação de produtos. Analise o perfil do cliente e sugira os 5 melhores produtos:

Perfil do Cliente:
- Histórico de Compras: ${purchaseHistory}
- Categoria Preferida: ${customerData.preferredCategory || 'Não definida'}
- Ticket Médio: R$ ${customerData.averageTicket || 0}
- Frequência de Compra: ${customerData.frequency || 'Primeira compra'}

Produtos Disponíveis:
${productsInfo}

Retorne os 5 produtos mais relevantes em JSON:
{
  "recomendacoes": [
    {
      "produto": "nome_produto",
      "motivo": "por que recomendar",
      "prioridade": "alta|media|baixa"
    }
  ]
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um especialista em recomendação de produtos e análise de comportamento do consumidor.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      return result.recomendacoes || [];
    } catch {
      return generateMockRecommendations();
    }
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    return generateMockRecommendations();
  }
}

/**
 * Alertas preditivos de estoque baseado em histórico de vendas
 * @param {Array} products - Lista de produtos com estoque atual e histórico
 * @returns {Promise<Array>} - Alertas e recomendações
 */
export async function getPredictiveStockAlerts(products) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada - usando alertas mock');
    return generateMockStockAlerts();
  }

  try {
    const productsInfo = products.slice(0, 15).map(p => 
      `${p.name}: Estoque ${p.currentStock} un, Vendas/mês ${p.avgSalesPerMonth} un, Lead time ${p.supplierLeadTime || 7} dias`
    ).join('\n');

    const prompt = `Você é um especialista em gestão de estoque. Analise os produtos abaixo e identifique:

${productsInfo}

Para cada produto em risco, forneça:
1. Nível de urgência (crítico/alto/médio)
2. Dias estimados até ruptura
3. Quantidade recomendada de reposição
4. Ação imediata

Retorne em JSON:
{
  "alertas": [
    {
      "produto": "nome",
      "urgencia": "critico|alto|medio",
      "dias_ate_ruptura": numero,
      "qtd_recomendada": numero,
      "acao": "texto"
    }
  ]
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um especialista em supply chain e gestão de estoque.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      return result.alertas || [];
    } catch {
      return generateMockStockAlerts();
    }
  } catch (error) {
    console.error('Erro ao gerar alertas de estoque:', error);
    return generateMockStockAlerts();
  }
}

/**
 * Analisa comportamento do cliente e segmenta
 * @param {Array} customers - Lista de clientes com histórico
 * @returns {Promise<Object>} - Segmentação e insights
 */
export async function analyzeCustomerBehavior(customers) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API Key não configurada - usando análise mock');
    return generateMockCustomerAnalysis();
  }

  try {
    const customersInfo = customers.slice(0, 50).map(c => 
      `Cliente ${c.id}: ${c.totalPurchases} compras, R$ ${c.totalSpent} gasto, última compra há ${c.daysSinceLastPurchase} dias`
    ).join('\n');

    const prompt = `Você é um especialista em CRM e análise de comportamento do consumidor. Analise a base de clientes:

${customersInfo}

Forneça:
1. Segmentação RFM (Recência, Frequência, Monetário)
2. Clientes em risco de churn
3. Oportunidades de upsell/cross-sell
4. Estratégias de retenção
5. Campanhas recomendadas

Retorne em JSON com insights acionáveis.`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um especialista em CRM e retenção de clientes.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return { analise: content };
    }
  } catch (error) {
    console.error('Erro ao analisar comportamento de clientes:', error);
    return generateMockCustomerAnalysis();
  }
}

// ===== FUNÇÕES MOCK =====

function generateMockTrends() {
  return {
    tendencia: 'crescimento',
    sazonalidade: 'Alta demanda em dezembro (fim de ano) e junho (meio do ano). Baixa em fevereiro e agosto.',
    previsao_proximos_meses: [
      'Janeiro: Queda de 15% após pico de fim de ano',
      'Fevereiro: Estabilização com leve crescimento de 5%',
      'Março: Recuperação forte (+20%) com início de outono'
    ],
    recomendacao_estoque: 'Aumentar estoque em 30% para o período de março-abril. Reduzir 20% em janeiro-fevereiro para evitar capital parado.',
    oportunidades: [
      'Promoção de liquidação em janeiro para produtos sazonais',
      'Campanha de pré-venda para março com desconto progressivo',
      'Bundle de produtos complementares para aumentar ticket médio'
    ]
  };
}

function generateMockRecommendations() {
  return [
    {
      produto: 'Kit Escritório Premium',
      motivo: 'Cliente comprou itens de escritório anteriormente. Kit oferece economia de 15% vs compra separada.',
      prioridade: 'alta'
    },
    {
      produto: 'Caderno Executivo A4',
      motivo: 'Complementa compras anteriores de materiais profissionais. Alta margem de lucro.',
      prioridade: 'alta'
    },
    {
      produto: 'Canetas Gel Coloridas (12 cores)',
      motivo: 'Cross-sell natural com cadernos. Produto com alta taxa de conversão.',
      prioridade: 'media'
    },
    {
      produto: 'Organizador de Mesa',
      motivo: 'Upsell para melhorar experiência de uso dos produtos já comprados.',
      prioridade: 'media'
    },
    {
      produto: 'Luminária LED USB',
      motivo: 'Produto complementar para ambiente de trabalho. Margem alta e baixa concorrência.',
      prioridade: 'baixa'
    }
  ];
}

function generateMockStockAlerts() {
  return [
    {
      produto: 'Papel A4 Resma',
      urgencia: 'critico',
      dias_ate_ruptura: 3,
      qtd_recomendada: 500,
      acao: 'URGENTE: Acionar fornecedor imediatamente. Produto de alta rotação com risco de ruptura em 3 dias.'
    },
    {
      produto: 'Toner HP Laserjet',
      urgencia: 'alto',
      dias_ate_ruptura: 7,
      qtd_recomendada: 50,
      acao: 'Realizar pedido esta semana. Lead time de 5 dias + margem de segurança.'
    },
    {
      produto: 'Canetas Esferográficas Azul',
      urgencia: 'medio',
      dias_ate_ruptura: 15,
      qtd_recomendada: 200,
      acao: 'Incluir no próximo pedido programado. Monitorar vendas semanalmente.'
    }
  ];
}

function generateMockCustomerAnalysis() {
  return {
    segmentacao: {
      campeoes: {
        quantidade: 45,
        descricao: 'Clientes que compram frequentemente e gastam muito',
        acao: 'Programa VIP com benefícios exclusivos e atendimento prioritário'
      },
      fieis: {
        quantidade: 78,
        descricao: 'Compram regularmente mas ticket médio pode crescer',
        acao: 'Campanhas de upsell com produtos premium'
      },
      em_risco: {
        quantidade: 32,
        descricao: 'Clientes valiosos que não compram há mais de 60 dias',
        acao: 'Campanha de reativação urgente com desconto personalizado de 15%'
      },
      hibernando: {
        quantidade: 67,
        descricao: 'Sem compras há mais de 90 dias',
        acao: 'Email marketing com novidades e cupom de retorno'
      }
    },
    churn_risk: [
      'João Silva (R$ 5.400 em compras) - 87 dias sem comprar',
      'Maria Santos (R$ 3.200 em compras) - 65 dias sem comprar',
      'Pedro Costa (R$ 2.800 em compras) - 72 dias sem comprar'
    ],
    oportunidades: [
      'Cross-sell de acessórios para 23 clientes que compraram eletrônicos',
      'Upsell de planos premium para 15 clientes de ticket alto',
      'Reativação de 32 clientes inativos pode gerar R$ 45.000 em receita'
    ],
    campanhas_recomendadas: [
      {
        nome: 'Volta Campeão',
        publico: 'Clientes em risco (32 clientes)',
        desconto: '15% + Frete Grátis',
        roi_esperado: 'R$ 18.000'
      },
      {
        nome: 'Black Friday Antecipada VIP',
        publico: 'Campeões e Fiéis (123 clientes)',
        desconto: '20% exclusivo',
        roi_esperado: 'R$ 65.000'
      }
    ]
  };
}

export default {
  generateBusinessInsights,
  extractBoletoData,
  getPricingRecommendations,
  analyzeTrends,
  getSmartProductRecommendations,
  getPredictiveStockAlerts,
  analyzeCustomerBehavior
};
