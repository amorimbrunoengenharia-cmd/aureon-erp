/**
 * DEBUG HELPER - Console Script
 * Cole no Console do navegador para diagnosticar dados de simulação
 */

// ===== VERIFICAR DADOS DE SIMULAÇÃO =====
console.log('🔍 [DEBUG] Verificando dados de simulação...\n');

const prefix = sessionStorage.getItem('simulation_mode') === 'true' ? 'aureon_sim_' : 'aureon_';
console.log(`📊 Prefixo ativo: ${prefix}\n`);

// Carregar dados
const produtos = JSON.parse(localStorage.getItem(`${prefix}produtos`) || '[]');
const vendas = JSON.parse(localStorage.getItem(`${prefix}vendas`) || '[]');
const fornecedores = JSON.parse(localStorage.getItem(`${prefix}fornecedores`) || '[]');
const clientes = JSON.parse(localStorage.getItem(`${prefix}clientes`) || '[]');

console.log('📦 PRODUTOS:', produtos.length);
console.log('💰 VENDAS:', vendas.length);
console.log('🏭 FORNECEDORES:', fornecedores.length);
console.log('👥 CLIENTES:', clientes.length);

// Verificar estrutura de produto
if (produtos.length > 0) {
  console.log('\n📦 Exemplo de Produto:');
  console.log(produtos[0]);
  
  // Verificar campos críticos
  const produtoExemplo = produtos[0];
  console.log('\n✅ Campos Críticos:');
  console.log('  - preco:', produtoExemplo.preco || produtoExemplo.precoVenda);
  console.log('  - precoCusto:', produtoExemplo.precoCusto || produtoExemplo.valorCompra);
  console.log('  - estoque:', produtoExemplo.estoque);
}

// Verificar estrutura de venda
if (vendas.length > 0) {
  console.log('\n💰 Exemplo de Venda:');
  console.log(vendas[0]);
  
  // Verificar campos críticos
  const vendaExemplo = vendas[0];
  console.log('\n✅ Campos Críticos:');
  console.log('  - valorVenda:', vendaExemplo.valorVenda);
  console.log('  - custoProduto:', vendaExemplo.custoProduto);
  console.log('  - lucro:', vendaExemplo.lucro);
  console.log('  - data:', vendaExemplo.data);
}

// Calcular Valor Total em Estoque (método correto)
if (produtos.length > 0) {
  const valorEstoque = produtos.reduce((total, p) => {
    const estoque = Number(p.estoque) || 0;
    const precoCusto = Number(p.precoCusto) || Number(p.valorCompra) || 0;
    return total + (estoque * precoCusto);
  }, 0);
  
  console.log('\n💰 VALOR TOTAL EM ESTOQUE (precoCusto):');
  console.log(`  R$ ${valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

// Calcular Receita Total
if (vendas.length > 0) {
  const receitaTotal = vendas.reduce((total, v) => {
    return total + (Number(v.valorVenda) || Number(v.valorTotal) || 0);
  }, 0);
  
  const lucroTotal = vendas.reduce((total, v) => {
    return total + (Number(v.lucro) || 0);
  }, 0);
  
  console.log('\n💰 VENDAS:');
  console.log(`  Receita Total: R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lucro Total: R$ ${lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

console.log('\n✅ [DEBUG] Diagnóstico completo!');
