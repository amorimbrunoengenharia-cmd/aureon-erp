# 🤖 Funcionalidades Avançadas de IA - AUREON ERP

## 📊 Visão Geral

O AUREON ERP agora conta com **7 funcionalidades de IA** alimentadas pela OpenAI (gpt-4o-mini):

### ✅ Implementadas

1. **Business Insights** - Análise estratégica de métricas gerais
2. **Trend Analysis** - Tendências sazonais e previsão de demanda
3. **Product Recommendations** - Sugestões inteligentes de produtos para venda
4. **Predictive Stock Alerts** - Alertas preditivos de ruptura de estoque
5. **Customer Behavior Analysis** - Segmentação RFM e análise de churn
6. **Boleto Data Extraction** - Extração automática de dados de boletos (OCR)
7. **Pricing Recommendations** - Sugestões de precificação estratégica

---

## 🎯 Funcionalidades Detalhadas

### 1️⃣ Business Insights
**Onde:** Dashboard principal (primeira seção)  
**O que faz:** Analisa métricas consolidadas (vendas, financeiro, estoque) e gera insights acionáveis  
**Exemplo de resposta:**
```
✅ Crescimento forte: Receita subiu 23% vs mês anterior
⚠️ Alerta de estoque: 3 produtos fora de estoque
💡 Oportunidade: Ticket médio pode crescer 15% com cross-sell
```

---

### 2️⃣ Trend Analysis (Tendências Sazonais)
**Onde:** Dashboard > Painel de Insights Avançados > Aba "Tendências"  
**O que faz:** Analisa histórico de 12 meses e identifica padrões sazonais  
**Informações fornecidas:**
- Tendência geral (crescimento/estável/declínio)
- Sazonalidade (alta/baixa temporada)
- Previsão para os próximos 3 meses
- Recomendações de estoque
- Oportunidades de promoção

**Exemplo de uso:**
```javascript
const trends = await analyzeTrends([
  { month: 'Jan', revenue: 45000, units: 230 },
  { month: 'Fev', revenue: 38000, units: 195 },
  // ... 12 meses
], 'Eletrônicos');
```

**Resposta esperada:**
```json
{
  "tendencia": "crescimento",
  "sazonalidade": "Alta em dezembro (Natal) e junho (Dia dos Namorados)",
  "previsao_proximos_meses": [
    "Janeiro: Queda de 15% após pico de fim de ano",
    "Fevereiro: Estabilização",
    "Março: Recuperação de 20%"
  ],
  "recomendacao_estoque": "Aumentar 30% para março-abril",
  "oportunidades": [
    "Liquidação em janeiro",
    "Pré-venda para março com desconto progressivo"
  ]
}
```

---

### 3️⃣ Product Recommendations (Recomendações Inteligentes)
**Onde:** Dashboard > Insights Avançados > Aba "Recomendações"  
**O que faz:** Sugere os 5 melhores produtos para recomendar a clientes baseado em histórico  
**Priorização:** Alta (🔴) | Média (🟡) | Baixa (🔵)

**Exemplo:**
```javascript
const recs = await getSmartProductRecommendations(
  {
    purchases: [
      { product: 'Notebook', price: 3500 },
      { product: 'Mouse', price: 80 }
    ],
    preferredCategory: 'Tecnologia',
    averageTicket: 500
  },
  productsCatalog
);
```

**Resposta:**
```json
[
  {
    "produto": "Mousepad Gamer",
    "motivo": "Complementa compra de mouse. Alta taxa de conversão.",
    "prioridade": "alta"
  },
  {
    "produto": "Fone Bluetooth",
    "motivo": "Cross-sell para usuários de notebook. Margem 40%.",
    "prioridade": "media"
  }
]
```

---

### 4️⃣ Predictive Stock Alerts (Alertas Preditivos)
**Onde:** Dashboard > Insights Avançados > Aba "Alertas de Estoque"  
**O que faz:** Prevê rupturas de estoque antes de acontecerem  
**Urgência:** Crítico (estoque acaba em <5 dias) | Alto (<10 dias) | Médio (<20 dias)

**Exemplo:**
```javascript
const alerts = await getPredictiveStockAlerts([
  {
    name: 'Papel A4',
    currentStock: 50,
    avgSalesPerMonth: 500,
    supplierLeadTime: 7
  }
]);
```

**Resposta:**
```json
[
  {
    "produto": "Papel A4",
    "urgencia": "critico",
    "dias_ate_ruptura": 3,
    "qtd_recomendada": 500,
    "acao": "URGENTE: Acionar fornecedor HOJE. Risco de ruptura em 3 dias."
  }
]
```

---

### 5️⃣ Customer Behavior Analysis (Análise RFM)
**Onde:** Dashboard > Insights Avançados > Aba "Comportamento"  
**O que faz:** Segmenta clientes usando análise RFM (Recência, Frequência, Monetário)  
**Segmentos:**
- **Campeões** - Compram frequentemente e gastam muito
- **Fiéis** - Compram regularmente, ticket pode crescer
- **Em Risco** - Valiosos mas inativos (>60 dias)
- **Hibernando** - Sem compras há >90 dias

**Exemplo:**
```javascript
const analysis = await analyzeCustomerBehavior([
  {
    id: 1,
    totalPurchases: 15,
    totalSpent: 8500,
    daysSinceLastPurchase: 12
  }
  // ... mais clientes
]);
```

**Resposta:**
```json
{
  "segmentacao": {
    "campeoes": {
      "quantidade": 45,
      "acao": "Programa VIP com benefícios exclusivos"
    },
    "em_risco": {
      "quantidade": 32,
      "acao": "Campanha de reativação com 15% de desconto"
    }
  },
  "churn_risk": [
    "João Silva (R$ 5.400) - 87 dias sem comprar"
  ],
  "campanhas_recomendadas": [
    {
      "nome": "Volta Campeão",
      "publico": "32 clientes em risco",
      "desconto": "15% + Frete Grátis",
      "roi_esperado": "R$ 18.000"
    }
  ]
}
```

---

### 6️⃣ Boleto Data Extraction
**Onde:** ExpensesManager (Gestão de Despesas)  
**O que faz:** Extrai automaticamente dados de boletos colados como texto  
**Campos extraídos:**
- Descrição
- Valor
- Data de vencimento
- Fornecedor
- Categoria
- Observações

---

### 7️⃣ Pricing Recommendations
**Onde:** Calculator (Calculadora de Preços)  
**O que faz:** Sugere preço ótimo baseado em custos, concorrência e demanda  
**Retorna:**
- Preço sugerido
- Preço mínimo (break-even + margem mínima)
- Preço máximo (teto de mercado)
- Justificativa estratégica

---

## 🔧 Como Usar

### Configuração Inicial

1. **Obter API Key:**
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma nova chave (formato: `sk-proj-...`)
   - Copie e guarde em local seguro

2. **Configurar no projeto:**
   ```bash
   cd aureon-os
   copy .env.example .env
   # Editar .env e adicionar:
   VITE_OPENAI_API_KEY=sk-proj-SUA_CHAVE_AQUI
   ```

3. **Reiniciar servidor:**
   ```bash
   npm run dev
   ```

### Uso Direto no Código

```javascript
import {
  generateBusinessInsights,
  analyzeTrends,
  getSmartProductRecommendations,
  getPredictiveStockAlerts,
  analyzeCustomerBehavior,
  extractBoletoData,
  getPricingRecommendations
} from '../services/OpenAIService';

// Insights gerais
const insights = await generateBusinessInsights(metricsData);

// Tendências
const trends = await analyzeTrends(salesHistory, 'Eletrônicos');

// Recomendações
const recs = await getSmartProductRecommendations(customerData, products);

// Alertas
const alerts = await getPredictiveStockAlerts(inventoryData);

// Comportamento
const behavior = await analyzeCustomerBehavior(customersList);
```

---

## 💰 Custos

| Função | Tokens Médios | Custo por Chamada |
|--------|--------------|-------------------|
| Business Insights | 500 | $0.001 |
| Trend Analysis | 800 | $0.0015 |
| Product Recs | 800 | $0.0015 |
| Stock Alerts | 800 | $0.0015 |
| Customer Analysis | 1000 | $0.002 |
| Boleto Extraction | 600 | $0.0012 |
| Pricing | 500 | $0.001 |

**Total estimado:** ~$0.01 por análise completa do dashboard

### Estimativas Mensais
- 30 análises/dia = $9/mês
- 100 análises/dia = $30/mês
- 300 análises/dia = $90/mês

---

## 🧪 Modo Mock (Sem API Key)

Todas as funcionalidades funcionam **SEM** API Key configurada:
- Sistema detecta automaticamente falta da chave
- Retorna dados simulados realistas
- Permite testar toda a interface
- Console exibe aviso: `⚠️ OpenAI API Key não configurada`

**Vantagens:**
- Desenvolvimento sem custos
- Demos e apresentações
- Testes de interface
- Prototipagem rápida

---

## 📈 Roadmap Futuro

### Funcionalidades Planejadas
- [ ] **Demand Forecasting** - Previsão de demanda com ML
- [ ] **Anomaly Detection** - Detecção automática de anomalias nas vendas
- [ ] **Automatic Report Generation** - Relatórios executivos automáticos
- [ ] **Voice Commands** - Comandos de voz para consultas
- [ ] **Sentiment Analysis** - Análise de feedback de clientes
- [ ] **Competitor Monitoring** - Monitoramento automático de concorrentes

### Melhorias Técnicas
- [ ] Cache de insights (evitar chamadas duplicadas)
- [ ] Rate limiting inteligente
- [ ] Batch processing para análises em massa
- [ ] Histórico de insights (comparar evolução)
- [ ] Export de relatórios em PDF
- [ ] Integração com WhatsApp (alertas)

---

## 🆘 Troubleshooting

### Erro: "API Key inválida"
**Causa:** Chave incorreta ou sem créditos  
**Solução:** Verifique a chave em https://platform.openai.com/api-keys

### Erro: "Rate limit exceeded"
**Causa:** Muitas requisições em pouco tempo  
**Solução:** Aguarde 1 minuto ou upgrade do plano OpenAI

### Insights não carregam
**Causa:** Problema de rede ou API offline  
**Solução:** Verifique console (F12) e status em https://status.openai.com

### Mock não aparece
**Causa:** Erro no código dos dados mock  
**Solução:** Verifique console para erros JavaScript

---

## 📞 Suporte

- **Documentação OpenAI:** https://platform.openai.com/docs
- **Status da API:** https://status.openai.com
- **Preços:** https://openai.com/pricing
- **Comunidade:** https://community.openai.com

---

## 🔒 Segurança

✅ **Boas práticas implementadas:**
- API Key em `.env` (não commitada)
- Variáveis `VITE_*` apenas em build
- HTTPS para comunicação
- Timeout de 30s em requisições
- Validação de respostas

⚠️ **Cuidados necessários:**
- Nunca exponha a chave em código público
- Rotacione a chave periodicamente
- Monitore uso em https://platform.openai.com/usage
- Configure limites de gastos no painel OpenAI

---

**Última atualização:** 05/12/2024  
**Versão:** 2.0 (Insights Avançados)
