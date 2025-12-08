/**
 * BUSINESS LOGIC SERVICE
 * Serviço centralizado para regras de negócio e cálculos em tempo real
 * 
 * FILOSOFIA: Zero Dados Mockados - Tudo vem de queries reais
 */

// ===== ESTOQUE & INVENTÁRIO =====

/**
 * Calcular valor total em estoque
 * @param {Array} produtos - Lista de produtos
 * @returns {number} - Valor total (quantidade × preço de custo)
 */
export function calcularValorTotalEstoque(produtos) {
  return produtos.reduce((total, produto) => {
    const quantidade = Number(produto.estoque) || 0;
    const precoCusto = Number(produto.precoCusto) || Number(produto.valorCompra) || 0;
    return total + (quantidade * precoCusto);
  }, 0);
}

/**
 * Identificar produtos com estoque crítico
 * @param {Array} produtos - Lista de produtos
 * @param {number} limiteMinimo - Quantidade mínima aceitável
 * @returns {Object} - { zerados, baixos, ok }
 */
export function analisarStatusEstoque(produtos, limiteMinimo = 10) {
  return produtos.reduce((acc, produto) => {
    const estoque = Number(produto.estoque) || 0;
    
    if (estoque === 0) {
      acc.zerados.push(produto);
    } else if (estoque < limiteMinimo) {
      acc.baixos.push(produto);
    } else {
      acc.ok.push(produto);
    }
    
    return acc;
  }, { zerados: [], baixos: [], ok: [] });
}

/**
 * Calcular giro de estoque (turnover)
 * @param {Array} vendas - Histórico de vendas
 * @param {Object} produto - Produto a analisar
 * @param {number} diasPeriodo - Período de análise (padrão: 30 dias)
 * @returns {number} - Vendas médias por dia
 */
export function calcularGiroEstoque(vendas, produto, diasPeriodo = 30) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasPeriodo);
  
  const vendasProduto = vendas.filter(venda => {
    const matchProduto = 
      venda.produtoId === produto.id || 
      venda.produto === produto.nome || 
      venda.produto === produto.produto;
    
    if (!matchProduto) return false;
    
    // Parse data BR (dd/mm/yyyy)
    if (venda.data) {
      const [dia, mes, ano] = venda.data.split('/');
      const dataVenda = new Date(ano, mes - 1, dia);
      return dataVenda >= dataLimite;
    }
    
    return true; // Se não tem data, incluir (dados recentes)
  });
  
  const quantidadeVendida = vendasProduto.reduce((total, venda) => {
    return total + (Number(venda.quantidade) || 1);
  }, 0);
  
  return quantidadeVendida / diasPeriodo; // Média diária
}

// ===== VENDAS & RECEITA =====

/**
 * Calcular receita total de vendas
 * @param {Array} vendas - Lista de vendas
 * @param {Object} filtros - { periodo: 'mes', status: 'completed' }
 * @returns {number} - Receita total
 */
export function calcularReceitaTotal(vendas, filtros = {}) {
  let vendasFiltradas = vendas;
  
  // Filtro de período
  if (filtros.periodo) {
    vendasFiltradas = filtrarPorPeriodo(vendas, filtros.periodo);
  }
  
  // Filtro de status
  if (filtros.status) {
    vendasFiltradas = vendasFiltradas.filter(v => 
      v.status === filtros.status || !v.status // Se não tem status, considerar completed
    );
  }
  
  return vendasFiltradas.reduce((total, venda) => {
    const valor = Number(venda.valorVenda) || Number(venda.valorTotal) || 0;
    return total + valor;
  }, 0);
}

/**
 * Calcular lucro total
 * @param {Array} vendas - Lista de vendas
 * @param {Array} produtos - Lista de produtos (para custos)
 * @returns {number} - Lucro total
 */
export function calcularLucroTotal(vendas, produtos) {
  return vendas.reduce((total, venda) => {
    // Opção 1: Lucro já calculado na venda
    if (venda.lucro !== undefined) {
      return total + Number(venda.lucro);
    }
    
    // Opção 2: Calcular lucro on-the-fly
    const produto = produtos.find(p => 
      p.id === venda.produtoId || 
      p.nome === venda.produto ||
      p.produto === venda.produto
    );
    
    if (!produto) return total;
    
    const receita = Number(venda.valorVenda) || Number(venda.valorTotal) || 0;
    const precoCusto = Number(produto.precoCusto) || Number(produto.valorCompra) || 0;
    const precoImportacao = Number(produto.precoImportacao) || 0;
    const quantidade = Number(venda.quantidade) || 1;
    
    const custoTotal = (precoCusto + precoImportacao) * quantidade;
    const lucro = receita - custoTotal;
    
    return total + lucro;
  }, 0);
}

/**
 * Calcular ticket médio
 * @param {Array} vendas - Lista de vendas
 * @returns {number} - Valor médio por venda
 */
export function calcularTicketMedio(vendas) {
  if (vendas.length === 0) return 0;
  
  const total = calcularReceitaTotal(vendas);
  return total / vendas.length;
}

/**
 * Agrupar vendas por período
 * @param {Array} vendas - Lista de vendas
 * @param {string} periodo - 'dia' | 'semana' | 'mes' | 'ano'
 * @returns {Array} - Vendas agrupadas
 */
export function agruparVendasPorPeriodo(vendas, periodo = 'mes') {
  const grupos = {};
  
  vendas.forEach(venda => {
    if (!venda.data) return;
    
    const [dia, mes, ano] = venda.data.split('/');
    const data = new Date(ano, mes - 1, dia);
    
    let chave;
    if (periodo === 'dia') {
      chave = venda.data; // dd/mm/yyyy
    } else if (periodo === 'semana') {
      const semana = Math.ceil(dia / 7);
      chave = `${ano}-${mes}-S${semana}`;
    } else if (periodo === 'mes') {
      chave = `${mes}/${ano}`;
    } else if (periodo === 'ano') {
      chave = ano;
    }
    
    if (!grupos[chave]) {
      grupos[chave] = {
        periodo: chave,
        vendas: [],
        receita: 0,
        quantidade: 0
      };
    }
    
    grupos[chave].vendas.push(venda);
    grupos[chave].receita += Number(venda.valorVenda) || Number(venda.valorTotal) || 0;
    grupos[chave].quantidade += Number(venda.quantidade) || 1;
  });
  
  return Object.values(grupos).sort((a, b) => {
    // Ordenar por período (mais recente primeiro)
    return b.periodo.localeCompare(a.periodo);
  });
}

// ===== CLIENTES & CRM =====

/**
 * Análise RFM (Recência, Frequência, Monetário)
 * @param {Array} clientes - Lista de clientes
 * @param {Array} vendas - Lista de vendas
 * @returns {Array} - Clientes com score RFM
 */
export function calcularRFMClientes(clientes, vendas) {
  const hoje = new Date();
  
  return clientes.map(cliente => {
    const vendasCliente = vendas.filter(v => 
      v.clienteId === cliente.id || 
      v.cliente === cliente.nome ||
      v.clienteNome === cliente.nome
    );
    
    if (vendasCliente.length === 0) {
      return {
        ...cliente,
        rfm: { recencia: 0, frequencia: 0, monetario: 0 },
        score: 0,
        segmento: 'DORMINDO',
        totalGasto: 0,
        ultimaCompra: null
      };
    }
    
    // RECÊNCIA: Dias desde última compra
    const vendasOrdenadas = vendasCliente.sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/');
      const [diaB, mesB, anoB] = b.data.split('/');
      const dataA = new Date(anoA, mesA - 1, diaA);
      const dataB = new Date(anoB, mesB - 1, diaB);
      return dataB - dataA;
    });
    
    const ultimaVenda = vendasOrdenadas[0];
    const [dia, mes, ano] = ultimaVenda.data.split('/');
    const dataUltima = new Date(ano, mes - 1, dia);
    const diasRecencia = Math.floor((hoje - dataUltima) / (1000 * 60 * 60 * 24));
    
    // FREQUÊNCIA: Número de compras
    const frequencia = vendasCliente.length;
    
    // MONETÁRIO: Total gasto
    const monetario = vendasCliente.reduce((total, v) => {
      return total + (Number(v.valorVenda) || Number(v.valorTotal) || 0);
    }, 0);
    
    // SCORE RFM (quanto maior, melhor)
    // Recência: inverso (menos dias = melhor)
    const scoreRecencia = diasRecencia < 30 ? 5 : diasRecencia < 60 ? 4 : diasRecencia < 90 ? 3 : diasRecencia < 180 ? 2 : 1;
    // Frequência: direto
    const scoreFrequencia = frequencia >= 10 ? 5 : frequencia >= 5 ? 4 : frequencia >= 3 ? 3 : frequencia >= 2 ? 2 : 1;
    // Monetário: direto
    const scoreMonetario = monetario >= 5000 ? 5 : monetario >= 2000 ? 4 : monetario >= 1000 ? 3 : monetario >= 500 ? 2 : 1;
    
    const scoreFinal = scoreRecencia + scoreFrequencia + scoreMonetario;
    
    // SEGMENTAÇÃO
    let segmento;
    if (scoreFinal >= 13) segmento = 'VIP';
    else if (scoreFinal >= 10) segmento = 'ATIVO';
    else if (scoreFinal >= 7) segmento = 'REGULAR';
    else if (diasRecencia > 90) segmento = 'DORMINDO';
    else segmento = 'NOVO';
    
    return {
      ...cliente,
      rfm: {
        recencia: diasRecencia,
        frequencia: frequencia,
        monetario: monetario
      },
      score: scoreFinal,
      segmento: segmento,
      totalGasto: monetario,
      ultimaCompra: ultimaVenda.data,
      ticketMedio: monetario / frequencia
    };
  }).sort((a, b) => b.score - a.score);
}

// ===== PREVISÃO & REPOSIÇÃO =====

/**
 * Calcular ponto de pedido (quando repor estoque)
 * @param {Object} produto - Produto a analisar
 * @param {Array} vendas - Histórico de vendas
 * @param {number} leadTime - Tempo de entrega do fornecedor (dias)
 * @param {number} diasSeguranca - Margem de segurança (dias)
 * @returns {number} - Quantidade mínima antes de repor
 */
export function calcularPontoPedido(produto, vendas, leadTime = 14, diasSeguranca = 3) {
  const giroDiario = calcularGiroEstoque(vendas, produto, 30);
  const demandaLeadTime = giroDiario * leadTime;
  const estoqueSeguranca = giroDiario * diasSeguranca;
  
  return Math.ceil(demandaLeadTime + estoqueSeguranca);
}

/**
 * Calcular quantidade ideal de reposição
 * @param {Object} produto - Produto a analisar
 * @param {Array} vendas - Histórico de vendas
 * @param {number} metaCrescimento - Meta de crescimento (%)
 * @param {number} diasCobertura - Dias de cobertura desejados
 * @returns {number} - Quantidade a comprar
 */
export function calcularQuantidadeReposicao(produto, vendas, metaCrescimento = 20, diasCobertura = 30) {
  const giroDiario = calcularGiroEstoque(vendas, produto, 30);
  const projecaoCrescimento = giroDiario * (1 + metaCrescimento / 100);
  const demandaFutura = projecaoCrescimento * diasCobertura;
  const estoqueAtual = Number(produto.estoque) || 0;
  
  const quantidadeComprar = Math.ceil(demandaFutura - estoqueAtual);
  
  return Math.max(0, quantidadeComprar);
}

/**
 * Gerar lista completa de sugestões de reposição
 * @param {Array} produtos - Lista de produtos
 * @param {Array} vendas - Histórico de vendas
 * @param {Array} fornecedores - Lista de fornecedores
 * @param {Object} config - Configurações (metaCrescimento, diasSeguranca)
 * @returns {Array} - Lista de sugestões priorizadas
 */
export function gerarSugestoesReposicao(produtos, vendas, fornecedores, config = {}) {
  const { metaCrescimento = 20, diasSeguranca = 3 } = config;
  
  const sugestoes = produtos.map(produto => {
    const giroDiario = calcularGiroEstoque(vendas, produto, 30);
    const fornecedor = fornecedores.find(f => 
      f.id === produto.fornecedorId || 
      f.nome === produto.fornecedorId
    );
    const leadTime = fornecedor?.leadTime || 14;
    
    const pontoPedido = calcularPontoPedido(produto, vendas, leadTime, diasSeguranca);
    const quantidadeComprar = calcularQuantidadeReposicao(produto, vendas, metaCrescimento, 30);
    const estoqueAtual = Number(produto.estoque) || 0;
    
    // Determinar prioridade
    let prioridade;
    if (estoqueAtual === 0) {
      prioridade = 'CRITICA';
    } else if (estoqueAtual <= pontoPedido * 0.3) {
      prioridade = 'ALTA';
    } else if (estoqueAtual <= pontoPedido) {
      prioridade = 'MEDIA';
    } else {
      prioridade = 'BAIXA';
    }
    
    const precoCusto = Number(produto.precoCusto) || Number(produto.valorCompra) || 0;
    const precoImportacao = Number(produto.precoImportacao) || 0;
    const custoUnitario = precoCusto + precoImportacao;
    const investimento = quantidadeComprar * custoUnitario;
    
    return {
      produto,
      estoqueAtual,
      pontoPedido,
      quantidadeComprar,
      giroDiario,
      leadTime,
      prioridade,
      fornecedor: fornecedor?.nome || 'Não definido',
      custoUnitario,
      investimento,
      diasRestantes: estoqueAtual / (giroDiario || 0.1) // Evitar divisão por zero
    };
  });
  
  // Filtrar apenas produtos que precisam reposição
  return sugestoes
    .filter(s => s.quantidadeComprar > 0)
    .sort((a, b) => {
      // Ordenar por prioridade, depois por dias restantes
      const prioridadeOrdem = { 'CRITICA': 0, 'ALTA': 1, 'MEDIA': 2, 'BAIXA': 3 };
      if (prioridadeOrdem[a.prioridade] !== prioridadeOrdem[b.prioridade]) {
        return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
      }
      return a.diasRestantes - b.diasRestantes;
    });
}

// ===== MOVIMENTAÇÕES & HISTÓRICO =====

/**
 * Registrar movimentação de estoque (TRANSAÇÃO COMPLETA)
 * @param {Object} movimentacao - Dados da movimentação
 * @param {Array} produtos - Lista de produtos (para atualizar)
 * @param {Function} updateProduto - Função para atualizar produto
 * @param {Function} addMovimentacao - Função para adicionar ao histórico
 * @returns {Object} - Resultado da operação
 */
export function processarMovimentacao(movimentacao, produtos, updateProduto, addMovimentacao) {
  const { produtoId, tipo, quantidade, motivo, usuario } = movimentacao;
  
  // 1. Validar produto existe
  const produto = produtos.find(p => p.id === produtoId);
  if (!produto) {
    throw new Error('Produto não encontrado');
  }
  
  // 2. Validar quantidade
  if (!quantidade || quantidade <= 0) {
    throw new Error('Quantidade deve ser maior que zero');
  }
  
  // 3. Calcular novo estoque
  const estoqueAtual = Number(produto.estoque) || 0;
  let novoEstoque;
  
  if (tipo === 'ENTRADA') {
    novoEstoque = estoqueAtual + quantidade;
  } else if (tipo === 'SAIDA') {
    if (estoqueAtual < quantidade) {
      throw new Error('Estoque insuficiente para saída');
    }
    novoEstoque = estoqueAtual - quantidade;
  } else if (tipo === 'AJUSTE') {
    novoEstoque = quantidade; // Ajuste absoluto
  } else {
    throw new Error('Tipo de movimentação inválido');
  }
  
  // 4. Criar registro de movimentação
  const movimentacaoCompleta = {
    ...movimentacao,
    id: Date.now(),
    produtoNome: produto.nome || produto.produto,
    estoqueAnterior: estoqueAtual,
    estoqueNovo: novoEstoque,
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR'),
    usuario: usuario || 'Sistema'
  };
  
  // 5. Atualizar produto
  updateProduto(produtoId, { estoque: novoEstoque });
  
  // 6. Salvar histórico
  addMovimentacao(movimentacaoCompleta);
  
  return {
    success: true,
    movimentacao: movimentacaoCompleta,
    estoqueAnterior: estoqueAtual,
    estoqueNovo: novoEstoque
  };
}

// ===== HELPERS & FILTROS =====

/**
 * Filtrar vendas por período
 * @param {Array} vendas - Lista de vendas
 * @param {string} periodo - 'hoje' | 'semana' | 'mes' | 'ano'
 * @returns {Array} - Vendas filtradas
 */
function filtrarPorPeriodo(vendas, periodo) {
  const hoje = new Date();
  
  return vendas.filter(venda => {
    if (!venda.data) return false;
    
    const [dia, mes, ano] = venda.data.split('/');
    const dataVenda = new Date(ano, mes - 1, dia);
    
    switch (periodo) {
      case 'hoje':
        return dataVenda.toDateString() === hoje.toDateString();
      
      case 'semana': {
        const umaSemanaAtras = new Date(hoje);
        umaSemanaAtras.setDate(hoje.getDate() - 7);
        return dataVenda >= umaSemanaAtras;
      }
      
      case 'mes': {
        return dataVenda.getMonth() === hoje.getMonth() && 
               dataVenda.getFullYear() === hoje.getFullYear();
      }
      
      case 'ano': {
        return dataVenda.getFullYear() === hoje.getFullYear();
      }
      
      default:
        return true;
    }
  });
}

export default {
  // Estoque
  calcularValorTotalEstoque,
  analisarStatusEstoque,
  calcularGiroEstoque,
  
  // Vendas
  calcularReceitaTotal,
  calcularLucroTotal,
  calcularTicketMedio,
  agruparVendasPorPeriodo,
  
  // CRM
  calcularRFMClientes,
  
  // Reposição
  calcularPontoPedido,
  calcularQuantidadeReposicao,
  gerarSugestoesReposicao,
  
  // Movimentações
  processarMovimentacao
};
