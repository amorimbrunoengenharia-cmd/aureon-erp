/**
 * 🔥 CORREÇÃO URGENTE - MODO SIMULAÇÃO
 * Script otimizado para banco aureon_sim_*
 */

console.clear();
console.log('🔥 INICIANDO CORREÇÃO MODO SIMULAÇÃO...\n');

// Forçar modo simulação
const prefix = 'aureon_sim_';
console.log(`✅ Usando banco: ${prefix}*\n`);

// ===== 1. CORRIGIR PRODUTOS (Preços zerados) =====
console.log('📦 [1/3] Corrigindo produtos...');
const produtos = JSON.parse(localStorage.getItem(`${prefix}produtos`) || '[]');

const produtosCorrigidos = produtos.map(p => {
  const precoCusto = p.precoCusto || Math.random() * (120 - 50) + 50;
  const precoImportacao = p.precoImportacao || Math.random() * (30 - 10) + 10;
  const precoVenda = p.preco || p.precoVenda || (precoCusto + precoImportacao) * 2.5;
  
  return {
    ...p,
    precoCusto: parseFloat(precoCusto.toFixed(2)),
    valorCompra: parseFloat(precoCusto.toFixed(2)),
    precoImportacao: parseFloat(precoImportacao.toFixed(2)),
    preco: parseFloat(precoVenda.toFixed(2)),
    precoVenda: parseFloat(precoVenda.toFixed(2)),
    lucro: parseFloat((precoVenda - precoCusto - precoImportacao).toFixed(2))
  };
});

localStorage.setItem(`${prefix}produtos`, JSON.stringify(produtosCorrigidos));
console.log(`✅ ${produtosCorrigidos.length} produtos corrigidos\n`);

// ===== 2. CORRIGIR FORNECEDORES (Itens zerados) =====
console.log('🏭 [2/3] Corrigindo fornecedores...');
const fornecedores = JSON.parse(localStorage.getItem(`${prefix}fornecedores`) || '[]');

const fornecedoresCorrigidos = fornecedores.map(f => {
  // Se já tem itens, manter
  if (f.itens && f.itens.length > 0) return f;
  
  // Gerar 3-7 itens aleatórios
  const numItens = Math.floor(Math.random() * 5) + 3;
  const itens = [];
  
  const tipos = ['Óculos de Sol', 'Lentes', 'Armações', 'Esportivos', 'Polarizados'];
  const modelos = ['Premium', 'Classic', 'Sport', 'Modern', 'Vintage'];
  
  for (let i = 0; i < numItens; i++) {
    itens.push({
      modelo: `${tipos[Math.floor(Math.random() * tipos.length)]} ${modelos[Math.floor(Math.random() * modelos.length)]}`,
      quantidade: Math.floor(Math.random() * 200) + 50,
      precoCusto: parseFloat((Math.random() * 100 + 40).toFixed(2)),
      precoImportacao: parseFloat((Math.random() * 30 + 10).toFixed(2)),
      observacoes: 'Item disponível para compra'
    });
  }
  
  return { ...f, itens };
});

localStorage.setItem(`${prefix}fornecedores`, JSON.stringify(fornecedoresCorrigidos));

// Calcular total de itens
const totalItens = fornecedoresCorrigidos.reduce((acc, f) => 
  acc + (f.itens?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0), 0
);
console.log(`✅ ${fornecedoresCorrigidos.length} fornecedores com ${totalItens} itens\n`);

// ===== 3. CRIAR DESPESAS =====
console.log('💸 [3/3] Criando despesas...');
const despesas = [
  { id: 1, descricao: 'Aluguel', tipo: 'Fixo', valor: 3500, data: '01/12/2025', categoria: 'Infraestrutura' },
  { id: 2, descricao: 'Energia', tipo: 'Fixo', valor: 450, data: '01/12/2025', categoria: 'Utilidades' },
  { id: 3, descricao: 'Internet', tipo: 'Fixo', valor: 250, data: '01/12/2025', categoria: 'Comunicação' },
  { id: 4, descricao: 'Salários', tipo: 'Fixo', valor: 8500, data: '01/12/2025', categoria: 'Pessoal' },
  { id: 5, descricao: 'Marketing', tipo: 'Variável', valor: 1200, data: '01/12/2025', categoria: 'Marketing' },
  { id: 6, descricao: 'Manutenção', tipo: 'Variável', valor: 680, data: '05/12/2025', categoria: 'Infraestrutura' }
];

localStorage.setItem(`${prefix}despesas`, JSON.stringify(despesas));
console.log(`✅ ${despesas.length} despesas criadas\n`);

// ===== RELATÓRIO FINAL =====
console.log('═══════════════════════════════════════');
console.log('✅ CORREÇÃO COMPLETA!\n');

// Calcular valor de estoque
const valorEstoque = produtosCorrigidos.reduce((total, p) => {
  return total + ((p.estoque || 0) * (p.precoCusto || 0));
}, 0);

const baixoEstoque = produtosCorrigidos.filter(p => (p.estoque || 0) < 10 && (p.estoque || 0) > 0).length;
const semEstoque = produtosCorrigidos.filter(p => (p.estoque || 0) === 0).length;

console.log(`📦 ESTOQUE:`);
console.log(`   Valor Total: R$ ${valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
console.log(`   Baixo: ${baixoEstoque} | Zero: ${semEstoque}\n`);

console.log(`🏭 FORNECEDORES:`);
console.log(`   Total: ${fornecedoresCorrigidos.length}`);
console.log(`   Itens Disponíveis: ${totalItens} unidades\n`);

const despesasTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
console.log(`💸 DESPESAS:`);
console.log(`   Total: R$ ${despesasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`);

console.log('═══════════════════════════════════════');
console.log('🔄 RECARREGUE A PÁGINA AGORA (F5)');
console.log('═══════════════════════════════════════');
