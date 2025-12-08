/**
 * Utilitários para processamento de dados para gráficos
 */

/**
 * Agrupa vendas por período (diário, semanal, mensal)
 * @param {Array} vendas - Array de vendas
 * @param {string} periodo - 'diario' | 'semanal' | 'mensal'
 * @returns {Array} Dados agrupados para gráfico
 */
export const agruparVendasPorPeriodo = (vendas, periodo = 'diario') => {
  if (!vendas || vendas.length === 0) return [];

  const grupos = {};

  vendas.forEach(venda => {
    const [dia, mes, ano] = venda.data.split('/');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    
    let chave;
    
    if (periodo === 'diario') {
      // Formato: DD/MM
      chave = `${dia}/${mes}`;
    } else if (periodo === 'semanal') {
      // Agrupar por semana do ano
      const primeiroDia = new Date(data.getFullYear(), 0, 1);
      const diasPassados = Math.floor((data - primeiroDia) / (24 * 60 * 60 * 1000));
      const numeroSemana = Math.ceil((diasPassados + primeiroDia.getDay() + 1) / 7);
      chave = `Sem ${numeroSemana}/${ano}`;
    } else if (periodo === 'mensal') {
      // Formato: MM/YYYY
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      chave = `${meses[parseInt(mes) - 1]}/${ano}`;
    }

    if (!grupos[chave]) {
      grupos[chave] = {
        periodo: chave,
        vendas: 0,
        receita: 0,
        lucro: 0,
        quantidade: 0
      };
    }

    grupos[chave].vendas += 1;
    grupos[chave].receita += venda.valorVenda || 0;
    grupos[chave].lucro += venda.lucro || 0;
    grupos[chave].quantidade += 1;
  });

  // Converter para array e ordenar
  return Object.values(grupos).sort((a, b) => {
    // Ordenação simplificada - pode ser melhorada para datas complexas
    return 0;
  }).slice(-30); // Últimos 30 períodos
};

/**
 * Agrupa despesas por mês
 * @param {Object} despesasMensais - Objeto com chave ano-mes e valor
 * @returns {Array} Dados formatados para gráfico
 */
export const formatarDespesasMensais = (despesasMensais) => {
  if (!despesasMensais || Object.keys(despesasMensais).length === 0) return [];

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  return Object.entries(despesasMensais)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, valor]) => {
      const [ano, mes] = key.split('-');
      return {
        periodo: `${meses[parseInt(mes) - 1]}/${ano}`,
        despesas: valor
      };
    })
    .slice(-12); // Últimos 12 meses
};

/**
 * Calcula análise financeira completa (Gastos x Faturamento x Lucro)
 * @param {Array} vendas - Array de vendas
 * @param {Object} despesasMensais - Despesas mensais
 * @returns {Array} Dados completos para análise financeira
 */
export const analisarFinanceiroMensal = (vendas, despesasMensais = {}) => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const grupos = {};

  // Agrupar vendas por mês
  vendas.forEach(venda => {
    const [dia, mes, ano] = venda.data.split('/');
    const chaveOriginal = `${ano}-${mes.padStart(2, '0')}`;
    const chave = `${meses[parseInt(mes) - 1]}/${ano}`;

    if (!grupos[chave]) {
      grupos[chave] = {
        periodo: chave,
        faturamento: 0,
        custos: 0,
        lucro: 0,
        despesas: despesasMensais[chaveOriginal] || 0,
        chaveOriginal
      };
    }

    grupos[chave].faturamento += venda.valorVenda || 0;
    grupos[chave].custos += venda.custoProduto || 0;
    grupos[chave].lucro += venda.lucro || 0;
  });

  // Adicionar meses com apenas despesas (sem vendas)
  Object.entries(despesasMensais).forEach(([chaveOriginal, valor]) => {
    const [ano, mes] = chaveOriginal.split('-');
    const chave = `${meses[parseInt(mes) - 1]}/${ano}`;
    
    if (!grupos[chave]) {
      grupos[chave] = {
        periodo: chave,
        faturamento: 0,
        custos: 0,
        lucro: 0,
        despesas: valor,
        chaveOriginal
      };
    }
  });

  // Calcular lucro líquido (lucro - despesas)
  return Object.values(grupos)
    .sort((a, b) => a.chaveOriginal.localeCompare(b.chaveOriginal))
    .map(item => ({
      ...item,
      lucroLiquido: item.lucro - item.despesas
    }))
    .slice(-12); // Últimos 12 meses
};

/**
 * Prediz despesas mensais usando média móvel simples
 * @param {Object} despesasMensais - Histórico de despesas
 * @returns {number} Valor previsto para próximo mês
 */
export const preverDespesasProximoMes = (despesasMensais) => {
  const valores = Object.values(despesasMensais);
  if (valores.length === 0) return 0;
  
  // Média dos últimos 3 meses (se disponível)
  const ultimos = valores.slice(-3);
  const media = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
  
  // Adicionar tendência de crescimento (2% ao mês como padrão)
  return Math.round(media * 1.02);
};

/**
 * Gera insights sobre padrão de despesas
 * @param {Object} despesasMensais - Histórico de despesas
 * @param {Array} vendas - Array de vendas
 * @returns {Object} Insights sobre despesas
 */
export const analisarPadraoDespesas = (despesasMensais, vendas) => {
  const valores = Object.values(despesasMensais);
  if (valores.length < 2) {
    return {
      tendencia: 'estavel',
      media: valores[0] || 0,
      variacao: 0,
      insight: 'Dados insuficientes para análise de tendência'
    };
  }

  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const ultimoMes = valores[valores.length - 1];
  const penultimoMes = valores[valores.length - 2];
  
  const variacao = ((ultimoMes - penultimoMes) / penultimoMes) * 100;
  
  let tendencia = 'estavel';
  let insight = '';
  
  if (variacao > 10) {
    tendencia = 'crescente';
    insight = `Despesas aumentaram ${variacao.toFixed(1)}% no último mês. Revise custos operacionais.`;
  } else if (variacao < -10) {
    tendencia = 'decrescente';
    insight = `Despesas reduziram ${Math.abs(variacao).toFixed(1)}% no último mês. Ótimo controle!`;
  } else {
    insight = 'Despesas mantêm-se estáveis. Continue monitorando.';
  }

  // Calcular percentual de despesas sobre faturamento
  const faturamentoTotal = vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const despesasTotal = valores.reduce((a, b) => a + b, 0);
  const percentualSobreFaturamento = faturamentoTotal > 0 ? (despesasTotal / faturamentoTotal * 100) : 0;

  return {
    tendencia,
    media,
    variacao,
    insight,
    percentualSobreFaturamento: percentualSobreFaturamento.toFixed(1)
  };
};
