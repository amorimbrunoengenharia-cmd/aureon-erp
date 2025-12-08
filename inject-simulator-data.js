// Script para atualizar o simulador diretamente no navegador
// Execute: node inject-simulator-data.js

const prefix = 'aureon_sim_';

const updateScript = `
(function() {
  const prefix = '${prefix}';
  console.clear();
  console.log('%c🔧 ATUALIZANDO SIMULADOR...', 'font-size: 16px; font-weight: bold; color: #3b82f6;');

  // 1. PRODUTOS
  console.log('\\n📦 Corrigindo produtos...');
  const produtos = JSON.parse(localStorage.getItem(prefix + 'produtos') || '[]');
  
  let produtosCorrigidos = 0;
  const produtosAtualizados = produtos.map(p => {
    const precoCusto = p.precoCusto || (Math.random() * 70 + 50);
    const precoImportacao = p.precoImportacao || (Math.random() * 20 + 10);
    const precoVenda = p.preco || ((precoCusto + precoImportacao) * 2.5);
    
    produtosCorrigidos++;
    
    return {
      ...p,
      precoCusto: parseFloat(precoCusto.toFixed(2)),
      valorCompra: parseFloat(precoCusto.toFixed(2)),
      precoImportacao: parseFloat(precoImportacao.toFixed(2)),
      preco: parseFloat(precoVenda.toFixed(2)),
      precoVenda: parseFloat(precoVenda.toFixed(2)),
      estoque: p.estoque || Math.floor(Math.random() * 100 + 20),
      estoqueCanais: p.estoqueCanais || {
        loja: Math.floor(Math.random() * 50 + 10),
        online: Math.floor(Math.random() * 30 + 5),
        marketplace: Math.floor(Math.random() * 20 + 5)
      }
    };
  });

  localStorage.setItem(prefix + 'produtos', JSON.stringify(produtosAtualizados));
  console.log('✅ ' + produtosCorrigidos + ' produtos atualizados');

  const valorEstoque = produtosAtualizados.reduce((total, p) => total + (p.estoque * p.precoCusto), 0);
  console.log('   💰 Valor Estoque: R$ ' + valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

  // 2. FORNECEDORES
  console.log('\\n🏭 Corrigindo fornecedores...');
  const fornecedores = JSON.parse(localStorage.getItem(prefix + 'fornecedores') || '[]');

  let fornecedoresCorrigidos = 0;
  let totalItensAdicionados = 0;

  const fornecedoresAtualizados = fornecedores.map(f => {
    if (!f.itens || f.itens.length === 0) {
      const numItens = Math.floor(Math.random() * 5) + 3;
      const itens = [];
      
      for (let i = 0; i < numItens; i++) {
        itens.push({
          id: Date.now() + Math.random(),
          modelo: 'Item ' + (i + 1) + ' - ' + f.nome,
          quantidade: Math.floor(Math.random() * 200) + 50,
          precoCusto: parseFloat((Math.random() * 80 + 40).toFixed(2)),
          dataUltimaCompra: new Date().toISOString()
        });
      }
      
      fornecedoresCorrigidos++;
      totalItensAdicionados += numItens;
      
      return { ...f, itens };
    }
    return f;
  });

  localStorage.setItem(prefix + 'fornecedores', JSON.stringify(fornecedoresAtualizados));
  console.log('✅ ' + fornecedoresCorrigidos + ' fornecedores corrigidos');
  console.log('   📦 ' + totalItensAdicionados + ' itens adicionados');

  const totalItens = fornecedoresAtualizados.reduce((total, f) => {
    return total + (f.itens?.reduce((sum, item) => sum + item.quantidade, 0) || 0);
  }, 0);
  console.log('   🔢 Total unidades: ' + totalItens.toLocaleString('pt-BR'));

  // 3. DESPESAS
  console.log('\\n💸 Corrigindo despesas...');
  let despesas = JSON.parse(localStorage.getItem(prefix + 'despesas') || '[]');

  if (despesas.length === 0) {
    despesas = [
      { id: Date.now() + 1, categoria: 'Aluguel', descricao: 'Aluguel da loja', valor: 3500, data: new Date().toISOString(), status: 'pago' },
      { id: Date.now() + 2, categoria: 'Energia', descricao: 'Conta de luz', valor: 850, data: new Date().toISOString(), status: 'pago' },
      { id: Date.now() + 3, categoria: 'Internet', descricao: 'Internet e telefone', valor: 320, data: new Date().toISOString(), status: 'pago' },
      { id: Date.now() + 4, categoria: 'Salários', descricao: 'Folha de pagamento', valor: 8500, data: new Date().toISOString(), status: 'pago' },
      { id: Date.now() + 5, categoria: 'Marketing', descricao: 'Campanhas digitais', valor: 650, data: new Date().toISOString(), status: 'pendente' }
    ];
    
    localStorage.setItem(prefix + 'despesas', JSON.stringify(despesas));
    console.log('✅ ' + despesas.length + ' despesas criadas');
  } else {
    console.log('✅ ' + despesas.length + ' despesas já existem');
  }

  const totalDespesas = despesas.reduce((total, d) => total + d.valor, 0);
  console.log('   💰 Total despesas: R$ ' + totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

  // 4. VENDAS
  console.log('\\n🛒 Verificando vendas...');
  const vendas = JSON.parse(localStorage.getItem(prefix + 'vendas') || '[]');

  let vendasCorrigidas = 0;
  const vendasAtualizadas = vendas.map(v => {
    if (!v.valorVenda || v.valorVenda === 0) {
      const produto = produtosAtualizados.find(p => p.id === v.produtoId);
      if (produto) {
        vendasCorrigidas++;
        return {
          ...v,
          valorVenda: produto.precoVenda || produto.preco || 100,
          custoProduto: produto.precoCusto || 50
        };
      }
    }
    return v;
  });

  if (vendasCorrigidas > 0) {
    localStorage.setItem(prefix + 'vendas', JSON.stringify(vendasAtualizadas));
    console.log('✅ ' + vendasCorrigidas + ' vendas corrigidas');
  } else {
    console.log('✅ ' + vendas.length + ' vendas já estão corretas');
  }

  // RELATÓRIO
  console.log('\\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981;');
  console.log('%c✅ SIMULADOR ATUALIZADO COM SUCESSO!', 'font-size: 16px; font-weight: bold; color: #10b981;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981;');

  console.log('\\n📊 RESUMO:');
  console.log('   📦 Produtos: ' + produtosAtualizados.length + ' (' + produtosCorrigidos + ' corrigidos)');
  console.log('   💰 Valor Estoque: R$ ' + valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  console.log('   🏭 Fornecedores: ' + fornecedoresAtualizados.length + ' (' + fornecedoresCorrigidos + ' corrigidos)');
  console.log('   📦 Total Itens: ' + totalItens.toLocaleString('pt-BR') + ' unidades');
  console.log('   💸 Despesas: ' + despesas.length + ' (R$ ' + totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ')');
  console.log('   🛒 Vendas: ' + vendas.length + ' registros');

  console.log('\\n%c🔄 Recarregando página em 2 segundos...', 'font-size: 14px; font-weight: bold; color: #f59e0b;');
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
})();
`;

console.log('═══════════════════════════════════════════════════════════');
console.log('  SCRIPT DE ATUALIZAÇÃO DO SIMULADOR');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📋 INSTRUÇÕES:\n');
console.log('1. Abra o navegador em: http://localhost:5174');
console.log('2. Entre no modo SIMULAÇÃO (banner vermelho deve estar visível)');
console.log('3. Pressione F12 para abrir o Console');
console.log('4. Cole o código abaixo e pressione ENTER:\n');

console.log('─────────────────────────────────────────────────────────────');
console.log(updateScript);
console.log('─────────────────────────────────────────────────────────────\n');

console.log('✅ A página será recarregada automaticamente após 2 segundos');
console.log('✅ Todos os valores serão atualizados no simulador\n');
