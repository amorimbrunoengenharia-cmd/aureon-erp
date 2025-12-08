/**
 * Utilitário para Cálculos de Produtos
 * Campos virtuais e derivados
 */

/**
 * Calcula o Lucro de um produto
 * Fórmula: Lucro = Preço de Venda - (Preço de Custo + Preço Importação)
 * 
 * @param {Object} produto - Objeto do produto
 * @returns {number} Lucro calculado
 */
export const calcularLucro = (produto) => {
  const precoVenda = parseFloat(produto.precoVenda || produto.valorVenda || 0);
  const precoCusto = parseFloat(produto.precoCusto || produto.valorCompra || 0);
  const precoImportacao = parseFloat(produto.precoImportacao || 0);
  
  return precoVenda - (precoCusto + precoImportacao);
};

/**
 * Calcula a Margem de Lucro percentual
 * Fórmula: Margem = (Lucro / Preço de Venda) * 100
 * 
 * @param {Object} produto - Objeto do produto
 * @returns {number} Margem em percentual (0-100)
 */
export const calcularMargem = (produto) => {
  const precoVenda = parseFloat(produto.precoVenda || produto.valorVenda || 0);
  
  if (precoVenda === 0) return 0;
  
  const lucro = calcularLucro(produto);
  return (lucro / precoVenda) * 100;
};

/**
 * Enriquece um produto com campos calculados
 * Adiciona: lucro, margem
 * 
 * @param {Object} produto - Objeto do produto
 * @returns {Object} Produto enriquecido
 */
export const enrichProduct = (produto) => {
  return {
    ...produto,
    lucro: calcularLucro(produto),
    margem: calcularMargem(produto)
  };
};

/**
 * Enriquece uma lista de produtos
 * 
 * @param {Array} produtos - Array de produtos
 * @returns {Array} Produtos enriquecidos
 */
export const enrichProducts = (produtos) => {
  return produtos.map(enrichProduct);
};

/**
 * Valida campos obrigatórios do produto (Single Source of Truth)
 * Conforme especificação: Cadastro via Fornecedores > Cadastrar Novo Item
 * 
 * @param {Object} produto - Objeto do produto
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateProduct = (produto) => {
  const errors = [];
  
  // Campos obrigatórios
  if (!produto.tipo) errors.push('Tipo do Item é obrigatório');
  if (!produto.modelo) errors.push('Modelo é obrigatório');
  if (!produto.quantidadeComprada && produto.quantidadeComprada !== 0) {
    errors.push('Quantidade é obrigatória');
  }
  if (!produto.precoCusto && produto.precoCusto !== 0) {
    errors.push('Preço de Custo é obrigatório');
  }
  if (!produto.precoImportacao && produto.precoImportacao !== 0) {
    errors.push('Preço de Importação/Transporte é obrigatório');
  }
  if (!produto.fornecedorId) {
    errors.push('Fornecedor é obrigatório');
  }
  
  // Observações é opcional (único campo não obrigatório)
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Formata valores monetários para exibição
 * 
 * @param {number} valor - Valor numérico
 * @returns {string} Valor formatado (ex: "R$ 1.234,56")
 */
export const formatCurrency = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

/**
 * Gera nome do produto baseado em tipo + modelo
 * Garante consistência (Single Source of Truth)
 * 
 * @param {string} tipo - Tipo do produto
 * @param {string} modelo - Modelo do produto
 * @returns {string} Nome gerado
 */
export const gerarNomeProduto = (tipo, modelo) => {
  return `${tipo} - ${modelo}`.trim();
};
