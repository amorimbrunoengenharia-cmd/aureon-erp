/**
 * Serviço de IA para Análises Inteligentes
 * Análise de dados de vendas, estoque e clientes com insights automáticos
 */

/**
 * Gera insights inteligentes sobre vendas
 */
export const analyzeVendas = (vendas, produtos, config) => {
  const insights = [];
  
  if (!vendas || vendas.length === 0) {
    return [{
      type: 'info',
      title: 'Sem dados suficientes',
      message: 'Adicione vendas para obter análises inteligentes.',
      priority: 'low'
    }];
  }

  // Análise de tendência de vendas
  const ultimasVendas = vendas.slice(-10);
  const vendasAnteriores = vendas.slice(-20, -10);
  
  const mediaRecente = ultimasVendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0) / ultimasVendas.length;
  const mediaAnterior = vendasAnteriores.length > 0 
    ? vendasAnteriores.reduce((acc, v) => acc + (v.valorVenda || 0), 0) / vendasAnteriores.length 
    : mediaRecente;
  
  const crescimento = ((mediaRecente - mediaAnterior) / mediaAnterior) * 100;
  
  if (crescimento > 20) {
    insights.push({
      type: 'success',
      title: '📈 Vendas em Alta!',
      message: `Suas vendas cresceram ${crescimento.toFixed(1)}% recentemente. Continue com a estratégia atual!`,
      priority: 'high',
      action: 'Considere aumentar o estoque dos produtos mais vendidos.'
    });
  } else if (crescimento < -20) {
    insights.push({
      type: 'warning',
      title: '📉 Atenção: Queda nas Vendas',
      message: `Vendas caíram ${Math.abs(crescimento).toFixed(1)}%. É hora de revisar sua estratégia.`,
      priority: 'high',
      action: 'Sugestão: Lance promoções ou revise seus canais de venda.'
    });
  }

  // Análise de margem de lucro
  const margemMedia = vendas.reduce((acc, v) => {
    const produto = produtos.find(p => p.id === v.produtoId);
    if (!produto) return acc;
    const margem = ((v.valorVenda - produto.custoAlibaba) / v.valorVenda) * 100;
    return acc + margem;
  }, 0) / vendas.length;

  const margemMinima = config?.margemMinima || 30;
  
  if (margemMedia < margemMinima) {
    insights.push({
      type: 'error',
      title: '⚠️ Margem Abaixo do Ideal',
      message: `Margem média de ${margemMedia.toFixed(1)}% está abaixo dos ${margemMinima}% desejados.`,
      priority: 'high',
      action: 'Revise seus preços ou negocie melhores custos com fornecedores.'
    });
  } else if (margemMedia > margemMinima * 1.5) {
    insights.push({
      type: 'success',
      title: '💰 Excelente Margem de Lucro',
      message: `Margem de ${margemMedia.toFixed(1)}% está muito acima da meta!`,
      priority: 'medium',
      action: 'Você pode considerar reduzir preços para aumentar volume de vendas.'
    });
  }

  // Análise de sazonalidade
  const vendasPorMes = {};
  vendas.forEach(v => {
    const mes = v.data.split('/')[1];
    vendasPorMes[mes] = (vendasPorMes[mes] || 0) + 1;
  });
  
  const meses = Object.keys(vendasPorMes);
  if (meses.length >= 3) {
    const melhorMes = Object.keys(vendasPorMes).reduce((a, b) => 
      vendasPorMes[a] > vendasPorMes[b] ? a : b
    );
    const nomeMes = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][melhorMes];
    
    insights.push({
      type: 'info',
      title: '📅 Padrão de Sazonalidade',
      message: `${nomeMes} é seu melhor mês com ${vendasPorMes[melhorMes]} vendas.`,
      priority: 'medium',
      action: 'Prepare estoque extra antes deste período.'
    });
  }

  return insights;
};

/**
 * Analisa estoque e sugere reposições
 */
export const analyzeEstoque = (produtos) => {
  const insights = [];
  
  const produtosCriticos = produtos.filter(p => p.estoque < 10);
  const produtosForaEstoque = produtos.filter(p => p.estoque === 0);
  
  if (produtosForaEstoque.length > 0) {
    insights.push({
      type: 'error',
      title: '🚨 Produtos Fora de Estoque',
      message: `${produtosForaEstoque.length} produtos sem estoque. Você está perdendo vendas!`,
      priority: 'critical',
      action: `Reabasteça: ${produtosForaEstoque.slice(0, 3).map(p => p.produto).join(', ')}`,
      produtos: produtosForaEstoque
    });
  }
  
  if (produtosCriticos.length > produtosForaEstoque.length) {
    insights.push({
      type: 'warning',
      title: '⚠️ Estoque Baixo',
      message: `${produtosCriticos.length - produtosForaEstoque.length} produtos com estoque crítico.`,
      priority: 'high',
      action: 'Faça pedidos de reposição urgentes.',
      produtos: produtosCriticos
    });
  }

  // Análise de produtos parados
  const produtosParados = produtos.filter(p => p.estoque > 50);
  if (produtosParados.length > 0) {
    insights.push({
      type: 'info',
      title: '📦 Estoque Excedente',
      message: `${produtosParados.length} produtos com estoque alto. Considere promoções.`,
      priority: 'low',
      action: 'Lance descontos para girar o estoque.',
      produtos: produtosParados.slice(0, 5)
    });
  }

  return insights;
};

/**
 * Analisa comportamento de clientes
 */
export const analyzeClientes = (clientes, vendas) => {
  const insights = [];
  
  const hoje = new Date();
  const clientesInativos = clientes.filter(cliente => {
    const vendasCliente = vendas.filter(v => 
      v.clienteId === cliente.id || v.clienteNome === cliente.nome
    );
    
    if (vendasCliente.length === 0) return false;
    
    const ultimaVenda = vendasCliente[vendasCliente.length - 1];
    const [dia, mes, ano] = ultimaVenda.data.split('/');
    const dataUltima = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    const diasSemComprar = Math.floor((hoje - dataUltima) / (1000 * 60 * 60 * 24));
    
    return diasSemComprar > 60;
  });

  if (clientesInativos.length > 0) {
    insights.push({
      type: 'warning',
      title: '😴 Clientes Dormindo',
      message: `${clientesInativos.length} clientes não compram há mais de 60 dias.`,
      priority: 'high',
      action: 'Envie campanhas de reativação com descontos especiais.',
      clientes: clientesInativos.slice(0, 10)
    });
  }

  // Análise de clientes VIP
  const clientesVIP = clientes.filter(cliente => {
    const vendasCliente = vendas.filter(v => 
      v.clienteId === cliente.id || v.clienteNome === cliente.nome
    );
    const totalGasto = vendasCliente.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    return vendasCliente.length >= 10 || totalGasto > 1000;
  });

  if (clientesVIP.length > 0) {
    insights.push({
      type: 'success',
      title: '⭐ Clientes VIP',
      message: `Você tem ${clientesVIP.length} clientes VIP. Eles são seu maior patrimônio!`,
      priority: 'medium',
      action: 'Crie programa de fidelidade exclusivo para eles.',
      clientes: clientesVIP
    });
  }

  return insights;
};

/**
 * Previsão de vendas usando IA simples (regressão linear)
 */
export const predictVendas = (vendas, diasFuturos = 30) => {
  if (vendas.length < 7) {
    return {
      prediction: null,
      confidence: 'low',
      message: 'Dados insuficientes para previsão confiável.'
    };
  }

  // Agrupa vendas por dia
  const vendasPorDia = {};
  vendas.forEach(v => {
    const data = v.data;
    vendasPorDia[data] = (vendasPorDia[data] || 0) + (v.valorVenda || 0);
  });

  const valores = Object.values(vendasPorDia);
  const n = valores.length;
  
  // Cálculo de média móvel simples
  const ultimosDias = valores.slice(-7);
  const media = ultimosDias.reduce((a, b) => a + b, 0) / ultimosDias.length;
  
  // Tendência (simples)
  const metadeAntes = valores.slice(0, Math.floor(n/2));
  const metadeDepois = valores.slice(Math.floor(n/2));
  
  const mediaAntes = metadeAntes.reduce((a, b) => a + b, 0) / metadeAntes.length;
  const mediaDepois = metadeDepois.reduce((a, b) => a + b, 0) / metadeDepois.length;
  
  const taxaCrescimento = (mediaDepois - mediaAntes) / mediaAntes;
  const previsao = media * (1 + taxaCrescimento) * diasFuturos;

  return {
    prediction: previsao,
    dailyAverage: media,
    growthRate: taxaCrescimento * 100,
    confidence: n > 30 ? 'high' : n > 14 ? 'medium' : 'low',
    message: `Previsão para próximos ${diasFuturos} dias: R$ ${previsao.toFixed(2)}`
  };
};

/**
 * Gera recomendações personalizadas
 */
export const generateRecommendations = (vendas, produtos, clientes, config) => {
  const recommendations = [];

  // Recomendação baseada em meta
  const totalVendas = vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
  const metaMensal = config?.metaMensalVendas || config?.meta || 50000;
  const progressoMeta = (totalVendas / metaMensal) * 100;

  if (progressoMeta < 50) {
    recommendations.push({
      category: 'Estratégia',
      title: 'Acelere suas vendas',
      description: 'Você está abaixo de 50% da meta. Hora de agir!',
      actions: [
        'Lance promoções agressivas',
        'Aumente presença nas redes sociais',
        'Entre em contato com clientes inativos',
        'Considere novos canais de venda'
      ]
    });
  }

  // Recomendação de produtos
  const produtosMaisVendidos = produtos
    .map(p => ({
      ...p,
      totalVendido: vendas.filter(v => v.produtoId === p.id).length
    }))
    .sort((a, b) => b.totalVendido - a.totalVendido)
    .slice(0, 3);

  if (produtosMaisVendidos.length > 0 && produtosMaisVendidos[0].totalVendido > 0) {
    recommendations.push({
      category: 'Estoque',
      title: 'Foque nos campeões',
      description: 'Invista mais nos seus produtos mais vendidos',
      actions: produtosMaisVendidos.map(p => 
        `${p.produto}: ${p.totalVendido} vendas - Mantenha estoque alto`
      )
    });
  }

  // Recomendação de canais
  const vendasPorCanal = {};
  vendas.forEach(v => {
    vendasPorCanal[v.canal] = (vendasPorCanal[v.canal] || 0) + 1;
  });

  const melhorCanal = Object.keys(vendasPorCanal).reduce((a, b) => 
    vendasPorCanal[a] > vendasPorCanal[b] ? a : b, ''
  );

  if (melhorCanal) {
    recommendations.push({
      category: 'Canais',
      title: `${melhorCanal} é seu melhor canal`,
      description: `${vendasPorCanal[melhorCanal]} vendas realizadas`,
      actions: [
        `Invista mais em ${melhorCanal}`,
        'Replique estratégias para outros canais',
        'Crie conteúdo exclusivo para este canal'
      ]
    });
  }

  return recommendations;
};
