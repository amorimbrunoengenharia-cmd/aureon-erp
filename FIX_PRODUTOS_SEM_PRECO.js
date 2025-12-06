/**
 * SCRIPT DE CORREÇÃO - Adicionar Preços aos Produtos Existentes
 * 
 * PROBLEMA: Produtos foram criados sem campos de preço
 * SOLUÇÃO: Adicionar precoCusto, preco, precoVenda com valores realistas
 * 
 * INSTRUÇÕES:
 * 1. Abra o Console do navegador (F12)
 * 2. Cole este script completo
 * 3. Pressione Enter
 * 4. Recarregue a página (F5)
 */

console.log('🔧 [FIX] Iniciando correção de produtos sem preço...\n');

// Detectar modo (simulação ou produção)
const isSimulation = sessionStorage.getItem('simulation_mode') === 'true';
const prefix = isSimulation ? 'aureon_sim_' : 'aureon_';

console.log(`📊 Modo: ${isSimulation ? 'SIMULAÇÃO' : 'PRODUÇÃO'}`);
console.log(`📂 Prefixo: ${prefix}\n`);

// Carregar produtos
const produtos = JSON.parse(localStorage.getItem(`${prefix}produtos`) || '[]');
console.log(`📦 Total de produtos: ${produtos.length}`);

if (produtos.length === 0) {
  console.log('⚠️ Nenhum produto encontrado. Execute o cenário E2E primeiro.');
} else {
  // Contar produtos sem preço
  const produtosSemPreco = produtos.filter(p => 
    !p.preco && !p.precoVenda && !p.precoCusto
  );
  
  console.log(`🔍 Produtos sem preço: ${produtosSemPreco.length}\n`);
  
  if (produtosSemPreco.length > 0) {
    console.log('🛠️ Corrigindo produtos...\n');
    
    // Adicionar preços a cada produto
    const produtosCorrigidos = produtos.map(p => {
      // Se já tem preço, manter
      if (p.preco || p.precoVenda || p.precoCusto) {
        return p;
      }
      
      // Gerar preços realistas baseados no tipo
      const tipo = p.tipo || 'Óculos de Sol';
      let precoCusto, precoImportacao, precoVenda;
      
      // Preços base por tipo
      if (tipo.includes('Polarizado') || tipo.includes('Premium')) {
        precoCusto = Math.random() * (150 - 80) + 80; // R$ 80-150
        precoImportacao = Math.random() * (40 - 20) + 20; // R$ 20-40
      } else if (tipo.includes('Vintage') || tipo.includes('Sport')) {
        precoCusto = Math.random() * (120 - 60) + 60; // R$ 60-120
        precoImportacao = Math.random() * (30 - 15) + 15; // R$ 15-30
      } else {
        precoCusto = Math.random() * (100 - 40) + 40; // R$ 40-100
        precoImportacao = Math.random() * (25 - 10) + 10; // R$ 10-25
      }
      
      // Calcular preço de venda (margem 2x a 3x)
      const margemLucro = Math.random() * (3.0 - 2.0) + 2.0;
      precoVenda = (precoCusto + precoImportacao) * margemLucro;
      
      // Retornar produto corrigido
      return {
        ...p,
        precoCusto: parseFloat(precoCusto.toFixed(2)),
        valorCompra: parseFloat(precoCusto.toFixed(2)), // Alias
        precoImportacao: parseFloat(precoImportacao.toFixed(2)),
        precoVenda: parseFloat(precoVenda.toFixed(2)),
        preco: parseFloat(precoVenda.toFixed(2)), // Alias
        lucro: parseFloat((precoVenda - precoCusto - precoImportacao).toFixed(2))
      };
    });
    
    // Salvar produtos corrigidos
    localStorage.setItem(`${prefix}produtos`, JSON.stringify(produtosCorrigidos));
    
    console.log('✅ Produtos corrigidos com sucesso!\n');
    
    // Mostrar exemplos
    console.log('📊 Exemplos de produtos corrigidos:');
    produtosCorrigidos.slice(0, 3).forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.nome || p.produto}`);
      console.log(`   Custo: R$ ${p.precoCusto.toFixed(2)}`);
      console.log(`   Importação: R$ ${p.precoImportacao.toFixed(2)}`);
      console.log(`   Venda: R$ ${p.preco.toFixed(2)}`);
      console.log(`   Lucro: R$ ${p.lucro.toFixed(2)}`);
      console.log(`   Estoque: ${p.estoque} unidades`);
      console.log(`   Valor Total: R$ ${(p.estoque * p.precoCusto).toFixed(2)}`);
    });
    
    // Calcular valor total em estoque
    const valorTotalEstoque = produtosCorrigidos.reduce((total, p) => {
      const estoque = Number(p.estoque) || 0;
      const precoCusto = Number(p.precoCusto) || 0;
      return total + (estoque * precoCusto);
    }, 0);
    
    console.log(`\n💰 VALOR TOTAL EM ESTOQUE: R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    console.log('\n🔄 Recarregue a página (F5) para ver as alterações!');
    
  } else {
    console.log('✅ Todos os produtos já têm preços definidos!');
  }
}

// Verificar vendas também
const vendas = JSON.parse(localStorage.getItem(`${prefix}vendas`) || '[]');
console.log(`\n💼 Total de vendas: ${vendas.length}`);

if (vendas.length > 0) {
  const vendasSemValor = vendas.filter(v => !v.valorVenda && !v.valorTotal);
  if (vendasSemValor.length > 0) {
    console.log(`⚠️ ${vendasSemValor.length} vendas sem valor detectadas`);
    console.log('💡 Execute o cenário E2E novamente para corrigir');
  }
}

// Verificar clientes
const clientes = JSON.parse(localStorage.getItem(`${prefix}clientes`) || '[]');
console.log(`\n👥 Total de clientes: ${clientes.length}`);

// Verificar fornecedores
const fornecedores = JSON.parse(localStorage.getItem(`${prefix}fornecedores`) || '[]');
console.log(`🏭 Total de fornecedores: ${fornecedores.length}`);

console.log('\n✅ [FIX] Diagnóstico completo!');
