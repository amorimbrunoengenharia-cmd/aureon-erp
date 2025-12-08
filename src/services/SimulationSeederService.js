/**
 * SIMULATION SEEDER SERVICE
 * IA Generativa para preencher formulários automaticamente com dados sintéticos
 * 
 * FEATURES:
 * - Geração de dados realistas e consistentes
 * - Validação automática (respeitando regras de negócio)
 * - Integração com banco simulado
 * - Cenários de teste pré-configurados
 */

// ===== DADOS BASE PARA GERAÇÃO =====
const NOMES_PRODUTOS = [
  'Ray-Ban Aviator', 'Oakley Holbrook', 'Carrera Champion', 'Prada Sport',
  'Gucci Signature', 'Tom Ford Butterfly', 'Persol Vintage', 'Versace Medusa',
  'Dior Stellaire', 'Chanel Classic', 'Armani Exchange', 'Polo Ralph Lauren'
];

const MODELOS = [
  'Classic', 'Sport', 'Premium', 'Vintage', 'Modern', 'Retro',
  'Aviator', 'Wayfarer', 'Cat Eye', 'Round', 'Square', 'Polarized'
];

const TIPOS_OCULOS = [
  'Óculos de Sol',
  'Proteção Individual',
  'Esportivos',
  'Vintage',
  'Polarizados'
];

const FORNECEDORES_MOCK = [
  { nome: 'Alibaba Eyewear Co.', tipo: 'Óculos de Sol', origem: 'China' },
  { nome: 'Shenzhen Optics', tipo: 'Proteção Individual', origem: 'China' },
  { nome: 'Guangzhou Fashion', tipo: 'Esportivos', origem: 'China' },
  { nome: 'Beijing Vintage', tipo: 'Vintage', origem: 'China' },
  { nome: 'Shanghai Premium', tipo: 'Polarizados', origem: 'China' }
];

const NOMES_CLIENTES = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
  'Carlos Ferreira', 'Juliana Lima', 'Ricardo Alves', 'Fernanda Rocha',
  'Lucas Martins', 'Patricia Souza', 'Rafael Barbosa', 'Amanda Ribeiro'
];

const EMAILS = [
  'joao.silva@email.com', 'maria.santos@email.com', 'pedro.oliveira@email.com',
  'ana.costa@email.com', 'carlos.ferreira@email.com', 'juliana.lima@email.com'
];

const TELEFONES = [
  '(11) 98765-4321', '(21) 97654-3210', '(31) 96543-2109', '(41) 95432-1098',
  '(51) 94321-0987', '(61) 93210-9876', '(71) 92109-8765', '(81) 91098-7654'
];

const CANAIS_VENDA = [
  'Pessoal', 'Instagram', 'WhatsApp', 'Mercado Livre', 'Shopee', 'Amazon', 'Shein'
];

// ===== FUNÇÕES AUXILIARES =====
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (array) => array[random(0, array.length - 1)];
const randomFloat = (min, max, decimals = 2) => 
  (Math.random() * (max - min) + min).toFixed(decimals);

// ===== GERADORES DE DADOS =====

/**
 * Gerar Fornecedor Sintético
 */
export const generateFornecedor = () => {
  const fornecedor = randomItem(FORNECEDORES_MOCK);
  const leadTime = random(7, 30);

  return {
    nome: fornecedor.nome,
    contato: randomItem(NOMES_CLIENTES),
    email: randomItem(EMAILS),
    empresa: fornecedor.nome,
    tipo: fornecedor.tipo,
    origem: fornecedor.origem,
    leadTime: leadTime,
    itens: [] // Será preenchido depois
  };
};

/**
 * Gerar Item de Fornecedor Sintético
 */
export const generateItemFornecedor = (tipoFornecedor) => {
  const tipo = tipoFornecedor || randomItem(TIPOS_OCULOS);
  const modelo = randomItem(MODELOS);
  const quantidade = random(50, 500);
  const precoCusto = parseFloat(randomFloat(20, 100));
  const precoImportacao = parseFloat(randomFloat(5, 30));

  return {
    tipo: tipo,
    modelo: modelo,
    quantidade: quantidade,
    precoCusto: precoCusto,
    precoImportacao: precoImportacao,
    observacoes: `Item gerado automaticamente para teste`
  };
};

/**
 * Gerar Produto Completo (Single Source of Truth)
 * ✅ VALIDAÇÃO: Todos os campos obrigatórios preenchidos
 */
export const generateProduto = (fornecedorId = null) => {
  const tipo = randomItem(TIPOS_OCULOS);
  const modelo = randomItem(MODELOS);
  const nome = `${tipo} - ${modelo}`;
  
  const precoCusto = parseFloat(randomFloat(30, 150));
  const precoImportacao = parseFloat(randomFloat(10, 40));
  const margemLucro = parseFloat(randomFloat(1.5, 3.0, 1)); // 150% a 300%
  const precoVenda = parseFloat((precoCusto + precoImportacao) * margemLucro);
  
  const quantidadeComprada = random(20, 200);
  const estoque = random(10, quantidadeComprada);

  return {
    // ✅ Campos Obrigatórios (Single Source of Truth)
    tipo: tipo,
    modelo: modelo,
    nome: nome, // Será sobrescrito por gerarNomeProduto()
    produto: nome, // Alias para compatibilidade
    
    // ✅ Custos Obrigatórios (compatível com BusinessLogicService)
    precoCusto: precoCusto,
    valorCompra: precoCusto, // Alias para compatibilidade
    precoImportacao: precoImportacao,
    
    // ✅ Preço de Venda (compatível com DataContext)
    precoVenda: precoVenda,
    preco: precoVenda, // Alias para compatibilidade
    
    // ✅ Quantidades
    quantidadeComprada: quantidadeComprada,
    estoque: estoque,
    estoqueCanais: {
      'Pessoal': Math.floor(estoque * 0.4),
      'Mercado Livre': Math.floor(estoque * 0.3),
      'Shopee': Math.floor(estoque * 0.2),
      'WhatsApp': Math.floor(estoque * 0.1)
    },
    
    // ✅ Fornecedor Obrigatório
    fornecedorId: fornecedorId || 'Fornecedor Genérico',
    
    // Opcional
    observacoes: `Produto gerado automaticamente via IA - Lucro: R$ ${(precoVenda - precoCusto - precoImportacao).toFixed(2)}`
  };
};

/**
 * Gerar Cliente Sintético
 */
export const generateCliente = () => {
  return {
    nome: randomItem(NOMES_CLIENTES),
    email: randomItem(EMAILS),
    telefone: randomItem(TELEFONES),
    endereco: `Rua ${random(1, 999)}, Centro`,
    cpf: generateCPF(),
    dataCadastro: new Date().toISOString()
  };
};

/**
 * Gerar Venda Sintética
 * ✅ Baseada em produto existente
 * ✅ Compatível com addVenda do DataContext
 */
export const generateVenda = (produtos = [], clientes = []) => {
  if (produtos.length === 0) {
    throw new Error('Nenhum produto disponível para gerar venda');
  }

  const produto = randomItem(produtos);
  const cliente = clientes.length > 0 ? randomItem(clientes) : null;
  const quantidade = random(1, Math.min(3, produto.estoque || 10));
  const canal = randomItem(CANAIS_VENDA);
  
  // Calcular valores (sem desconto para simplificar)
  const precoVenda = produto.preco || produto.precoVenda || 0;
  const custoProduto = (produto.precoCusto || 0) + (produto.precoImportacao || 0);
  const valorVenda = precoVenda * quantidade;
  const custoTotal = custoProduto * quantidade;

  return {
    // ✅ Campos compatíveis com DataContext.addVenda
    produtoId: produto.id,
    produto: produto.nome || produto.produto,
    cliente: cliente?.nome || 'Cliente Anônimo',
    clienteId: cliente?.id || null,
    quantidade: quantidade,
    valorVenda: valorVenda, // ✅ Campo correto para receita
    custoProduto: custoTotal, // ✅ Campo correto para custo
    canal: canal,
    usuario: 'Sistema Simulação',
    status: 'completed',
    observacoes: 'Venda gerada automaticamente para teste'
  };
};

/**
 * Gerar Movimentação de Estoque
 */
export const generateMovimentacao = (produtos = []) => {
  if (produtos.length === 0) {
    throw new Error('Nenhum produto disponível para gerar movimentação');
  }

  const produto = randomItem(produtos);
  const tipo = randomItem(['ENTRADA', 'SAIDA', 'AJUSTE']);
  const quantidade = random(5, 50);
  const motivos = {
    ENTRADA: ['Compra de fornecedor', 'Devolução de cliente', 'Ajuste de inventário'],
    SAIDA: ['Venda', 'Perda', 'Doação', 'Amostra'],
    AJUSTE: ['Contagem física', 'Correção de erro', 'Recontagem']
  };

  return {
    produtoId: produto.id,
    produtoNome: produto.nome || produto.produto,
    tipo: tipo,
    quantidade: quantidade,
    motivo: randomItem(motivos[tipo]),
    data: new Date().toISOString(),
    usuario: 'Sistema (IA)',
    observacoes: 'Movimentação gerada automaticamente para teste'
  };
};

/**
 * Gerar CPF válido (algoritmo simplificado)
 */
function generateCPF() {
  const n = () => random(0, 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

// ===== CENÁRIOS DE TESTE PRÉ-CONFIGURADOS =====

/**
 * CENÁRIO 1: Fluxo Completo E2E - VERSÃO COMPLETA
 * ✅ Cria dados suficientes para popular Dashboard e Estoque
 * 1. Criar 5 Fornecedores
 * 2. Criar 20 Produtos (distribuídos entre fornecedores)
 * 3. Criar 10 Clientes
 * 4. Realizar 30 Vendas
 */
export const executarCenarioE2E = async (context) => {
  console.log('🎬 [SCENARIO E2E] Iniciando fluxo completo EXPANDIDO...');

  try {
    const { addFornecedor, addProduto, addCliente, addVenda } = context;

    // 1. Criar 5 Fornecedores
    console.log('  1️⃣ Criando 5 fornecedores...');
    const fornecedoresCriados = [];
    for (let i = 0; i < 5; i++) {
      const fornecedor = generateFornecedor();
      addFornecedor(fornecedor);
      fornecedoresCriados.push(fornecedor);
    }

    // 2. Criar 20 Produtos (4 por fornecedor)
    console.log('  2️⃣ Criando 20 produtos...');
    const produtosCriados = [];
    fornecedoresCriados.forEach(forn => {
      for (let i = 0; i < 4; i++) {
        const produto = generateProduto(forn.nome);
        addProduto(produto);
        produtosCriados.push(produto);
      }
    });

    // 3. Criar 10 Clientes
    console.log('  3️⃣ Criando 10 clientes...');
    const clientesCriados = [];
    for (let i = 0; i < 10; i++) {
      const cliente = generateCliente();
      addCliente(cliente);
      clientesCriados.push(cliente);
    }

    // 4. Aguardar produtos serem salvos no state (React setState é assíncrono)
    await new Promise(resolve => setTimeout(resolve, 800));

    // 5. Criar 30 Vendas (usando produtos do localStorage atualizado)
    console.log('  4️⃣ Gerando 30 vendas...');
    setTimeout(() => {
      // ✅ Buscar produtos do localStorage para ter IDs corretos
      const dbPrefix = context.getPrefix ? context.getPrefix() : 'aureon_';
      const produtosComId = JSON.parse(localStorage.getItem(`${dbPrefix}produtos`) || '[]');
      
      if (produtosComId.length > 0) {
        for (let i = 0; i < 30; i++) {
          try {
            const venda = generateVenda(produtosComId, clientesCriados);
            addVenda(venda);
          } catch (error) {
            console.warn(`Erro ao criar venda ${i + 1}:`, error.message);
          }
        }
        console.log('✅ [SCENARIO E2E] Fluxo completo executado com sucesso!');
        console.log('📊 Resumo: 5 fornecedores, 20 produtos, 10 clientes, 30 vendas');
      } else {
        console.error('❌ Produtos não encontrados no localStorage após 800ms');
      }
    }, 1000);

  } catch (error) {
    console.error('❌ [SCENARIO E2E] Erro ao executar cenário:', error);
    throw error;
  }
};

/**
 * CENÁRIO 2: Carga de Massa (Bulk Load)
 * Popula banco com quantidade massiva de dados
 */
export const executarCenarioBulkLoad = (context, quantidade = 10) => {
  console.log(`🚀 [SCENARIO BULK] Carregando ${quantidade} registros de cada tipo...`);

  const { addFornecedor, addProduto, addCliente } = context;

  // Fornecedores
  for (let i = 0; i < quantidade; i++) {
    const fornecedor = generateFornecedor();
    addFornecedor(fornecedor);
  }

  // Produtos
  for (let i = 0; i < quantidade * 3; i++) {
    const produto = generateProduto();
    addProduto(produto);
  }

  // Clientes
  for (let i = 0; i < quantidade * 2; i++) {
    const cliente = generateCliente();
    addCliente(cliente);
  }

  console.log('✅ [SCENARIO BULK] Carga de massa concluída!');
};

/**
 * Auto-Fill de Formulário
 * Preenche campos de um formulário específico
 */
export const autoFillForm = (formType) => {
  switch (formType) {
    case 'fornecedor':
      return generateFornecedor();
    
    case 'produto':
      return generateProduto();
    
    case 'cliente':
      return generateCliente();
    
    case 'item_fornecedor':
      return generateItemFornecedor();
    
    default:
      throw new Error(`Tipo de formulário desconhecido: ${formType}`);
  }
};

// ===== GERADORES FINANCEIROS =====

const CATEGORIAS_DESPESA = [
  'Aluguel', 'Salários', 'Fornecedores', 'Marketing', 
  'Energia', 'Internet', 'Telefone', 'Manutenção',
  'Impostos', 'Contador', 'Transporte', 'Material Escritório'
];

const BANCOS = [
  { nome: 'Nubank', tipo: 'Corrente' },
  { nome: 'Banco do Brasil', tipo: 'Corrente' },
  { nome: 'Caixa Econômica', tipo: 'Poupança' },
  { nome: 'BTG Pactual', tipo: 'Investimento' },
  { nome: 'Caixa Física', tipo: 'Caixa' }
];

/**
 * Gerar Despesa Sintética
 */
export const generateDespesa = (mes = null) => {
  const hoje = new Date();
  const dataBase = mes ? new Date(mes) : hoje;
  const dia = random(1, 28);
  const data = new Date(dataBase.getFullYear(), dataBase.getMonth(), dia);
  
  const categoria = randomItem(CATEGORIAS_DESPESA);
  const valor = parseFloat(randomFloat(100, 5000));
  const status = random(1, 10) > 7 ? 'pendente' : 'paga';
  
  return {
    descricao: `${categoria} - ${data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
    valor: valor,
    categoria: categoria,
    data: data.toISOString().split('T')[0],
    vencimento: new Date(data.getTime() + random(0, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: status,
    pagamento: status === 'paga' ? randomItem(['PIX', 'Boleto', 'TED', 'Débito Automático']) : null,
    observacoes: status === 'pendente' ? 'Aguardando vencimento' : 'Pagamento realizado'
  };
};

/**
 * Gerar Conta a Receber Sintética
 */
export const generateContaReceber = (mes = null) => {
  const hoje = new Date();
  const dataBase = mes ? new Date(mes) : hoje;
  const dia = random(1, 28);
  const emissao = new Date(dataBase.getFullYear(), dataBase.getMonth(), dia);
  
  const valor = parseFloat(randomFloat(500, 10000));
  const status = random(1, 10) > 6 ? 'pendente' : 'recebido';
  const parcelas = randomItem([1, 2, 3, 6, 12]);
  
  return {
    cliente: randomItem(NOMES_CLIENTES),
    descricao: `Venda ${randomItem(CANAIS_VENDA)} - ${emissao.toLocaleDateString('pt-BR')}`,
    valor: valor,
    parcelas: parcelas,
    valorParcela: (valor / parcelas).toFixed(2),
    dataEmissao: emissao.toISOString().split('T')[0],
    vencimento: new Date(emissao.getTime() + random(30, 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: status,
    pagamento: status === 'recebido' ? randomItem(['PIX', 'Cartão Crédito', 'TED', 'Boleto']) : null,
    observacoes: status === 'pendente' ? `Parcelado em ${parcelas}x` : `Recebido via ${status === 'recebido' ? 'PIX' : 'Boleto'}`
  };
};

/**
 * Gerar Conta Bancária Sintética
 */
export const generateContaBancaria = () => {
  const banco = randomItem(BANCOS);
  const saldo = parseFloat(randomFloat(1000, 50000));
  
  return {
    banco: banco.nome,
    agencia: `${random(1000, 9999)}`,
    conta: `${random(10000, 99999)}-${random(0, 9)}`,
    tipo: banco.tipo,
    saldo: saldo,
    ativo: true
  };
};

/**
 * Cenário E2E Financeiro
 * Popula todos os módulos financeiros com dados realistas
 */
export const executarCenarioFinanceiro = async (financeContext) => {
  console.log('🎭 [CENÁRIO FINANCEIRO] Iniciando população...');
  
  const { addDespesa, addContaReceber, addContaBancaria } = financeContext;
  
  // 1. Criar 3 contas bancárias
  console.log('💳 Criando contas bancárias...');
  for (let i = 0; i < 3; i++) {
    const conta = generateContaBancaria();
    addContaBancaria(conta);
  }
  
  // 2. Criar despesas dos últimos 3 meses
  console.log('💸 Criando despesas...');
  const hoje = new Date();
  for (let mes = 0; mes < 3; mes++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - mes, 1);
    for (let i = 0; i < 10; i++) {
      const despesa = generateDespesa(data);
      addDespesa(despesa);
    }
  }
  
  // 3. Criar contas a receber
  console.log('💰 Criando contas a receber...');
  for (let mes = 0; mes < 3; mes++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - mes, 1);
    for (let i = 0; i < 8; i++) {
      const conta = generateContaReceber(data);
      addContaReceber(conta);
    }
  }
  
  console.log('✅ [CENÁRIO FINANCEIRO] População concluída!');
  console.log('📊 Criado:\n- 3 contas bancárias\n- 30 despesas (3 meses)\n- 24 contas a receber');
};

export default {
  generateFornecedor,
  generateItemFornecedor,
  generateProduto,
  generateCliente,
  generateVenda,
  generateMovimentacao,
  executarCenarioE2E,
  executarCenarioBulkLoad,
  autoFillForm,
  // Financeiro
  generateDespesa,
  generateContaReceber,
  generateContaBancaria,
  executarCenarioFinanceiro
};
