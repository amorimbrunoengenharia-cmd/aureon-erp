# 📊 MÓDULO FINANCEIRO - ARQUITETURA COMPLETA

## 📋 ANÁLISE DO SISTEMA ATUAL

### Estado Atual da Aplicação
- **Stack**: React + localStorage como banco de dados
- **Arquitetura**: Context API (DataContext, AuthContext, SimulationContext)
- **RBAC**: Sistema de permissões por perfil (CEO, ESTOQUE, COMPRAS, VENDAS)
- **Dados Existentes**:
  - ✅ `vendas`: Array com valorVenda, custoProduto, data, canal
  - ✅ `despesas`: Array com categoria, valor, status (pago/pendente), data
  - ✅ `produtos`: Array com precoCusto, precoVenda, estoque
  - ✅ `clientes`: Array com nome, email, telefone
  - ✅ `fornecedores`: Array com itens, precoCusto
  - ✅ `movimentacoes`: Array com tipo (entrada/saida), quantidade, data

### Integração Identificada
- **Reports.jsx** já possui aba "Financeiro" básica (receitas vs despesas)
- **DataContext** possui campo `config.despesasMensais` para tracking mensal
- **PDVAtomic** possui campo `formaPagamento` nas vendas
- **BusinessLogicService** calcula margens e lucros
- Não existe módulo dedicado para gestão financeira profunda

---

## 🎯 ESCOPO DO MÓDULO FINANCEIRO

### 1. FUNCIONALIDADES ESSENCIAIS

#### 1.1 Contas a Pagar (Despesas)
**Status Atual**: Despesas básicas existem, mas sem gestão avançada

**Funcionalidades Novas**:
- ✅ **CRUD Completo de Despesas**
  - Criar despesa com vencimento, recorrência, centro de custo
  - Editar status (pendente → pago), data de pagamento real
  - Deletar despesas (com confirmação)
  - Visualizar histórico completo
  
- ✅ **Categorização Avançada**
  - Despesas Fixas (Aluguel, Salários, Internet)
  - Despesas Variáveis (Comissões, Marketing, Energia)
  - Despesas Pontuais (Manutenção, Equipamentos)
  - Centro de Custo (Loja, Online, Administrativo)

- ✅ **Gestão de Boletos**
  - Upload de boletos (base64/arquivo)
  - Código de barras
  - Status: Aguardando → Vencido → Pago
  - Alertas de vencimento (7 dias, 3 dias, hoje)
  - Histórico de pagamentos

- ✅ **Recorrência**
  - Despesas mensais automáticas
  - Despesas trimestrais/anuais
  - Previsão de próximos pagamentos

#### 1.2 Contas a Receber
**Status Atual**: Vendas registradas, mas sem controle de recebíveis

**Funcionalidades Novas**:
- ✅ **Gestão de Recebíveis**
  - Vendas a prazo (parceladas)
  - Status: Pendente → Recebido parcial → Recebido total
  - Previsão de recebimentos por data
  - Baixa manual de recebimentos

- ✅ **Antecipação de Recebíveis**
  - Calcular taxas de antecipação
  - Registrar antecipações (desconto aplicado)
  - Comparar ROI (esperar vs antecipar)

#### 1.3 Fluxo de Caixa
**Status Atual**: Não existe

**Funcionalidades Novas**:
- ✅ **Dashboard de Fluxo de Caixa**
  - Saldo atual em caixa
  - Entradas previstas (vendas a receber)
  - Saídas previstas (contas a pagar)
  - Projeção de caixa (7, 15, 30 dias)
  - Gráfico de linha temporal

- ✅ **Alertas Proativos**
  - Alerta de caixa baixo (< 10% das despesas mensais)
  - Alerta de saldo negativo projetado
  - Sugestão de ações corretivas

#### 1.4 DRE (Demonstração do Resultado do Exercício)
**Status Atual**: Cálculo básico em Reports.jsx

**Funcionalidades Novas**:
- ✅ **DRE Completo**
  - Receita Bruta (vendas totais)
  - (-) Impostos e Taxas (7.65% padrão, configurável)
  - = Receita Líquida
  - (-) CMV (Custo Mercadoria Vendida)
  - = Lucro Bruto
  - (-) Despesas Operacionais (fixas + variáveis)
  - = EBITDA (antes juros, impostos, depreciação)
  - = Lucro Líquido
  - Margem de Lucro (%)

- ✅ **Comparativos**
  - DRE Mensal
  - DRE Trimestral
  - DRE Anual
  - Comparação mês a mês (YoY, MoM)

#### 1.5 Conciliação Bancária
**Status Atual**: Não existe

**Funcionalidades Novas**:
- ✅ **Contas Bancárias**
  - Cadastro de contas (banco, agência, conta)
  - Saldo inicial
  - Tipo (corrente, poupança, investimento)

- ✅ **Lançamentos Bancários**
  - Import manual de extratos (CSV)
  - Categorização automática (ML/regex)
  - Conciliação com vendas/despesas
  - Status: Pendente → Conciliado

- ✅ **Relatório de Divergências**
  - Lançamentos sem correspondência
  - Diferenças de valor
  - Sugestões de conciliação

#### 1.6 Gestão de Impostos
**Status Atual**: Taxa fixa 7.65% em config

**Funcionalidades Novas**:
- ✅ **Cálculo de Impostos**
  - Simples Nacional (faixas progressivas)
  - MEI (taxa fixa)
  - Lucro Presumido
  - Customizável por regime

- ✅ **Provisões**
  - Valor a pagar no mês seguinte
  - Histórico de pagamentos
  - Comparação com faturamento

#### 1.7 Análises Proativas (IA/Sugestões)
**Status Atual**: Não existe

**Funcionalidades Novas**:
- ✅ **Insights Automáticos**
  - Despesas crescendo acima da receita
  - Categoria de despesa com maior aumento
  - Recomendação de corte de custos
  - Oportunidades de renegociação (fornecedores)

- ✅ **Previsões**
  - Faturamento esperado (baseado em histórico)
  - Despesas projetadas
  - Ponto de equilíbrio (Break-even)
  - Necessidade de capital de giro

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### Schema Detalhado (localStorage)

```javascript
// ============================================
// 1. DESPESAS (Expandido)
// ============================================
const despesas = [
  {
    id: 1733340000000,
    categoria: 'Aluguel',              // Fixo: Aluguel, Salários, Internet, Água, Energia
    descricao: 'Aluguel da loja física',
    valor: 3500,
    
    // ✅ Novos campos
    tipo: 'Fixo',                      // Fixo | Variável | Pontual
    centroCusto: 'Loja',               // Loja | Online | Administrativo | Marketing
    
    status: 'pago',                    // pendente | vencido | pago | cancelado
    dataVencimento: '2025-01-10',      // ISO 8601
    dataPagamento: '2025-01-09',       // ISO 8601 (quando pago)
    
    formaPagamento: 'Transferência',   // Dinheiro | PIX | Boleto | Cartão | Transferência
    contaBancaria: 1,                  // FK: contasBancarias.id
    
    recorrente: true,                  // true | false
    frequencia: 'Mensal',              // Mensal | Trimestral | Anual | Único
    proximoVencimento: '2025-02-10',   // Próxima cobrança (se recorrente)
    
    boleto: {                          // Opcional
      codigoBarras: '23793.38128 60000.074856 84600.000009 1 95770000003500',
      linhaDigitavel: '23793381286000007485684600000009195770000003500',
      arquivo: 'base64_string_do_pdf', // Base64 do PDF do boleto
      urlDownload: 'https://...'       // URL externa (se aplicável)
    },
    
    fornecedor: 'Imobiliária XYZ',     // Opcional: nome do fornecedor/beneficiário
    observacoes: 'Referente ao mês 01/2025',
    
    dataCriacao: '2024-12-04T10:30:00Z',
    ultimaAtualizacao: '2025-01-09T08:15:00Z',
    usuarioCriacao: 'ceo@aureon.com'
  }
];

// ============================================
// 2. CONTAS A RECEBER (Novo)
// ============================================
const contasReceber = [
  {
    id: 1733340100000,
    vendaId: 1733340050000,            // FK: vendas.id
    clienteId: 1733339900000,          // FK: clientes.id
    clienteNome: 'João Silva',
    
    valorTotal: 1200,                  // Valor total da venda
    valorRecebido: 400,                // Já recebido
    valorPendente: 800,                // Ainda a receber
    
    parcelas: [                        // Array de parcelas
      {
        numero: 1,
        valor: 400,
        dataVencimento: '2025-01-15',
        dataPagamento: '2025-01-14',
        status: 'recebido',            // pendente | atrasado | recebido
        formaPagamento: 'PIX',
        juros: 0,
        desconto: 0
      },
      {
        numero: 2,
        valor: 400,
        dataVencimento: '2025-02-15',
        dataPagamento: null,
        status: 'pendente',
        formaPagamento: 'Cartão Crédito',
        juros: 0,
        desconto: 0
      },
      {
        numero: 3,
        valor: 400,
        dataVencimento: '2025-03-15',
        dataPagamento: null,
        status: 'pendente',
        formaPagamento: 'Cartão Crédito',
        juros: 0,
        desconto: 0
      }
    ],
    
    statusGeral: 'parcial',            // pendente | parcial | recebido | cancelado
    antecipado: false,                 // Se foi antecipado
    valorAntecipacao: 0,               // Valor recebido na antecipação
    taxaAntecipacao: 0,                // % de desconto na antecipação
    dataAntecipacao: null,
    
    dataCriacao: '2025-01-10T14:30:00Z',
    ultimaAtualizacao: '2025-01-14T09:00:00Z'
  }
];

// ============================================
// 3. CONTAS BANCÁRIAS (Novo)
// ============================================
const contasBancarias = [
  {
    id: 1,
    banco: 'Banco do Brasil',
    codigoBanco: '001',
    agencia: '1234-5',
    conta: '67890-1',
    tipo: 'Corrente',                  // Corrente | Poupança | Investimento
    saldoInicial: 10000,               // Saldo na data de cadastro
    saldoAtual: 15230.50,              // Calculado automaticamente
    ativo: true,
    dataCadastro: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    banco: 'Nubank',
    codigoBanco: '260',
    agencia: '0001',
    conta: '12345678-9',
    tipo: 'Corrente',
    saldoInicial: 5000,
    saldoAtual: 8450.75,
    ativo: true,
    dataCadastro: '2024-06-15T00:00:00Z'
  }
];

// ============================================
// 4. LANÇAMENTOS BANCÁRIOS (Novo)
// ============================================
const lancamentosBancarios = [
  {
    id: 1733340200000,
    contaBancariaId: 1,                // FK: contasBancarias.id
    tipo: 'entrada',                   // entrada | saida
    valor: 1200,
    data: '2025-01-14',
    descricao: 'Recebimento venda #12345',
    categoria: 'Vendas',               // Vendas | Despesas | Transferência | Outros
    
    // Conciliação
    conciliado: true,
    vendaId: 1733340050000,            // FK: vendas.id (se aplicável)
    despesaId: null,                   // FK: despesas.id (se aplicável)
    contaReceberId: 1733340100000,     // FK: contasReceber.id (se aplicável)
    
    origem: 'manual',                  // manual | importacao | integracao
    arquivoImportacao: 'extrato_jan2025.csv',
    
    dataCriacao: '2025-01-15T10:00:00Z'
  }
];

// ============================================
// 5. IMPOSTOS (Novo)
// ============================================
const impostos = [
  {
    id: 1,
    mes: '2025-01',                    // Mês de referência
    regime: 'Simples Nacional',        // Simples Nacional | MEI | Lucro Presumido
    faixa: 1,                          // Faixa do Simples (1-6)
    aliquota: 7.65,                    // % aplicado
    
    faturamentoBruto: 50000,           // Receita bruta do mês
    baseCalculo: 50000,                // Base de cálculo (pode ter deduções)
    valorImposto: 3825,                // Valor a pagar
    
    status: 'pendente',                // pendente | pago | atrasado
    dataVencimento: '2025-02-20',
    dataPagamento: null,
    valorPago: 0,
    multa: 0,
    juros: 0,
    
    detalhamento: {                    // Breakdown por tipo de imposto
      IRPJ: 900,
      CSLL: 600,
      Cofins: 750,
      PIS: 375,
      CPP: 1050,
      ICMS: 150
    },
    
    dataCriacao: '2025-02-01T00:00:00Z'
  }
];

// ============================================
// 6. FLUXO DE CAIXA (Novo - View/Calculado)
// ============================================
// Não é persistido, é calculado em tempo real
const fluxoCaixa = {
  hoje: '2025-01-15',
  saldoAtual: 23681.25,                // Soma de todas contasBancarias.saldoAtual
  
  proximosDias: [
    {
      data: '2025-01-16',
      entradas: [
        { tipo: 'venda', valor: 1500, descricao: 'Venda #123' },
        { tipo: 'recebivel', valor: 400, descricao: 'Parcela 2/3 - João Silva' }
      ],
      saidas: [
        { tipo: 'despesa', valor: 850, descricao: 'Energia Elétrica' }
      ],
      saldoPrevisto: 24731.25
    },
    {
      data: '2025-01-20',
      entradas: [],
      saidas: [
        { tipo: 'despesa', valor: 12500, descricao: 'Folha de pagamento' },
        { tipo: 'imposto', valor: 3825, descricao: 'Simples Nacional - Dez/2024' }
      ],
      saldoPrevisto: 8406.25,          // ALERTA: Saldo baixo!
      alertas: ['Saldo abaixo de 20% das despesas mensais']
    }
  ],
  
  resumoMensal: {
    receitaPrevista: 55000,
    despesasPrevistas: 25000,
    saldoFinalProjetado: 30000
  }
};

// ============================================
// 7. DRE (Novo - View/Calculado)
// ============================================
const dre = {
  periodo: '2025-01',
  
  receitaBruta: 52000,                 // Soma vendas.valorVenda
  impostos: 3978,                      // impostos.valorImposto
  receitaLiquida: 48022,               // receitaBruta - impostos
  
  cmv: 20800,                          // Custo Mercadoria Vendida (vendas.custoProduto)
  lucroBruto: 27222,                   // receitaLiquida - cmv
  margemBruta: 52.3,                   // (lucroBruto / receitaLiquida) * 100
  
  despesasOperacionais: {
    fixas: 18500,                      // Aluguel, Salários, etc
    variaveis: 3200,                   // Comissões, Marketing variável
    total: 21700
  },
  
  ebitda: 5522,                        // lucroBruto - despesasOperacionais
  lucroLiquido: 5522,                  // Assumindo sem juros/depreciação
  margemLiquida: 10.6,                 // (lucroLiquido / receitaBruta) * 100
  
  pontoEquilibrio: 41500,              // Receita necessária para lucro zero
  atingiuEquilibrio: true
};

// ============================================
// 8. VENDAS (Atualização - Campos Novos)
// ============================================
const vendas = [
  {
    id: 1733340050000,
    produtoId: 123,
    produtoNome: 'Óculos RayMax Polarizado',
    clienteId: 456,
    clienteNome: 'João Silva',
    quantidade: 2,
    
    valorVenda: 1200,                  // Preço total
    custoProduto: 480,                 // Custo total (quantidade * precoCusto)
    lucro: 720,                        // valorVenda - custoProduto
    
    // ✅ Novos campos financeiros
    formaPagamento: 'Cartão Crédito',  // Dinheiro | PIX | Boleto | Cartão Débito | Cartão Crédito | Parcelado
    numeroParcelas: 3,                 // Se parcelado
    taxaParcela: 2.5,                  // % por parcela (se cartão crédito)
    valorTaxa: 30,                     // Valor total de taxas
    valorLiquido: 1170,                // valorVenda - valorTaxa
    
    contaBancariaId: 1,                // FK: contasBancarias.id (onde caiu o dinheiro)
    
    statusRecebimento: 'pendente',     // pendente | parcial | recebido
    gerarContaReceber: true,           // Se deve gerar em contasReceber (se parcelado)
    
    data: '10/01/2025',
    canal: 'Loja',
    status: 'concluída'
  }
];
```

---

## 🔒 PERMISSÕES RBAC (Role-Based Access Control)

### Matriz de Permissões

```javascript
const FINANCIAL_PERMISSIONS = {
  CEO: {
    despesas: { create: true, read: true, update: true, delete: true },
    contasReceber: { create: true, read: true, update: true, delete: true },
    contasBancarias: { create: true, read: true, update: true, delete: true },
    lancamentosBancarios: { create: true, read: true, update: true, delete: true },
    impostos: { create: true, read: true, update: true, delete: true },
    fluxoCaixa: { read: true },
    dre: { read: true, export: true },
    conciliacaoBancaria: { read: true, execute: true },
    insights: { read: true }
  },
  
  FINANCEIRO: {
    despesas: { create: true, read: true, update: true, delete: true },
    contasReceber: { create: true, read: true, update: true, delete: false }, // Não deleta
    contasBancarias: { create: true, read: true, update: true, delete: false },
    lancamentosBancarios: { create: true, read: true, update: true, delete: false },
    impostos: { create: true, read: true, update: true, delete: false },
    fluxoCaixa: { read: true },
    dre: { read: true, export: true },
    conciliacaoBancaria: { read: true, execute: true },
    insights: { read: true }
  },
  
  VENDAS: {
    despesas: { create: false, read: false, update: false, delete: false },
    contasReceber: { create: false, read: true, update: false, delete: false }, // Vê apenas seus recebíveis
    contasBancarias: { create: false, read: false, update: false, delete: false },
    lancamentosBancarios: { create: false, read: false, update: false, delete: false },
    impostos: { create: false, read: false, update: false, delete: false },
    fluxoCaixa: { read: false },
    dre: { read: false, export: false },
    conciliacaoBancaria: { read: false, execute: false },
    insights: { read: false }
  },
  
  ESTOQUE: {
    // Bloqueio total
    despesas: { create: false, read: false, update: false, delete: false },
    contasReceber: { create: false, read: false, update: false, delete: false },
    contasBancarias: { create: false, read: false, update: false, delete: false },
    lancamentosBancarios: { create: false, read: false, update: false, delete: false },
    impostos: { create: false, read: false, update: false, delete: false },
    fluxoCaixa: { read: false },
    dre: { read: false, export: false },
    conciliacaoBancaria: { read: false, execute: false },
    insights: { read: false }
  },
  
  COMPRAS: {
    // Bloqueio total (não precisa de dados financeiros)
    despesas: { create: false, read: false, update: false, delete: false },
    contasReceber: { create: false, read: false, update: false, delete: false },
    contasBancarias: { create: false, read: false, update: false, delete: false },
    lancamentosBancarios: { create: false, read: false, update: false, delete: false },
    impostos: { create: false, read: false, update: false, delete: false },
    fluxoCaixa: { read: false },
    dre: { read: false, export: false },
    conciliacaoBancaria: { read: false, execute: false },
    insights: { read: false }
  }
};
```

### Implementação em AuthContext.jsx

```javascript
// Adicionar ao ROLES existente
FINANCEIRO: {
  id: 'FINANCEIRO',
  nome: 'Financeiro',
  cor: '#8B5CF6', // Roxo
  permissions: {
    // Permissões existentes (readonly nas outras áreas)
    produtos: { create: false, read: true, update: false, delete: false },
    vendas: { create: false, read: true, update: false, delete: false },
    fornecedores: { create: false, read: true, update: false, delete: false },
    clientes: { create: false, read: true, update: false, delete: false },
    
    // Permissões financeiras (ACESSO TOTAL)
    despesas: { create: true, read: true, update: true, delete: true },
    contasReceber: { create: true, read: true, update: true, delete: false },
    contasBancarias: { create: true, read: true, update: true, delete: false },
    lancamentosBancarios: { create: true, read: true, update: true, delete: false },
    impostos: { create: true, read: true, update: true, delete: false },
    fluxoCaixa: { read: true },
    dre: { read: true, export: true },
    conciliacaoBancaria: { read: true, execute: true },
    
    // Sem acesso a audit log e usuários
    auditLog: { read: false },
    users: { create: false, read: false, update: false, delete: false }
  },
  defaultSettings: {
    alertaDespesasAltas: true,
    alertaCaixaBaixo: 10, // % mínimo
    alertaVencimentos: 7, // Dias antes
    notificacoesAtivas: true
  }
}
```

---

## 🎨 ESTRUTURA DE COMPONENTES

### Hierarquia de Componentes

```
📁 src/
├── 📁 pages/
│   └── 📄 FinanceModule.jsx (Container principal)
│
├── 📁 components/
│   └── 📁 finance/
│       ├── 📄 FinanceDashboard.jsx (Overview)
│       ├── 📄 ExpensesManager.jsx (Contas a Pagar)
│       ├── 📄 ReceivablesManager.jsx (Contas a Receber)
│       ├── 📄 CashFlowChart.jsx (Fluxo de Caixa)
│       ├── 📄 DREReport.jsx (DRE Completo)
│       ├── 📄 BankAccounts.jsx (Contas Bancárias)
│       ├── 📄 BankReconciliation.jsx (Conciliação)
│       ├── 📄 TaxManager.jsx (Impostos)
│       ├── 📄 FinancialInsights.jsx (Análises IA)
│       ├── 📄 BoletoUpload.jsx (Upload de Boletos)
│       └── 📄 ExpenseForm.jsx (Formulário Despesa)
│
├── 📁 context/
│   └── 📄 FinanceContext.jsx (Estado financeiro global)
│
├── 📁 services/
│   └── 📄 FinanceService.js (Lógica de negócio)
│
└── 📁 utils/
    ├── 📄 financeCalculations.js (Cálculos)
    └── 📄 financeValidations.js (Validações)
```

---

## 📊 WIREFRAMES DAS TELAS

### 1. Dashboard Financeiro (Visão Geral)

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 FINANCEIRO - Dashboard                          [Mês ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 💵 Caixa│  │ 📈 A Rec│  │ 📉 A Pag│  │ 💰 Lucro│       │
│  │ R$ 23k  │  │ R$ 15k  │  │ R$ 8k   │  │ R$ 5.5k │       │
│  │  Atual  │  │ 30 dias │  │ Vencendo│  │  Líquido│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                               │
│  ┌─────────────────────────────┐  ┌───────────────────┐    │
│  │ 📊 Fluxo de Caixa (30 dias)│  │ 🎯 DRE Resumido  │    │
│  │                              │  │                    │    │
│  │      ╱╲                      │  │ Receita: R$ 52k   │    │
│  │     ╱  ╲                     │  │ CMV: R$ 20.8k     │    │
│  │    ╱    ╲___                 │  │ Lucro Bruto: 52%  │    │
│  │   ╱         ╲                │  │ Despesas: R$ 21k  │    │
│  │  ╱           ╲___            │  │ Lucro Líq: 10.6%  │    │
│  │ ╱                            │  │                    │    │
│  └─────────────────────────────┘  └───────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ Alertas e Insights                               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🔴 Saldo projetado negativo em 20/01 (-R$ 2.5k)    │   │
│  │ 🟡 3 boletos vencendo nos próximos 7 dias (R$ 5k)  │   │
│  │ 🟢 Margem de lucro 5% acima da meta este mês       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [📝 Contas a Pagar] [💵 A Receber] [🏦 Bancos] [📊 DRE]   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Contas a Pagar (Despesas)

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 CONTAS A PAGAR                              [+ Nova]      │
├─────────────────────────────────────────────────────────────┤
│ Filtros: [Status ▼] [Categoria ▼] [Jan/2025] [🔍 Buscar]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🔴 VENCENDO HOJE                                    │    │
│ ├─────────────────────────────────────────────────────┤    │
│ │ Energia Elétrica              Venc: 15/01  R$ 850   │    │
│ │ [💰 Pagar Agora] [📄 Ver Boleto] [✏️ Editar]       │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                               │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🟡 VENCIMENTO PRÓXIMO (7 dias)                      │    │
│ ├─────────────────────────────────────────────────────┤    │
│ │ Folha de Pagamento            Venc: 20/01  R$ 12.5k│    │
│ │ Simples Nacional Dez/24       Venc: 20/01  R$ 3.8k │    │
│ │ Internet + Telefone           Venc: 22/01  R$ 320  │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                               │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🟢 PAGAS ESTE MÊS                                   │    │
│ ├─────────────────────────────────────────────────────┤    │
│ │ ✅ Aluguel                     Pago: 09/01  R$ 3.5k│    │
│ │ ✅ Água                        Pago: 12/01  R$ 180 │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                               │
│ Totais: Pendente R$ 17.4k | Pago R$ 3.7k | Total R$ 21.1k  │
└─────────────────────────────────────────────────────────────┘
```

### 3. Fluxo de Caixa (30 dias)

```
┌─────────────────────────────────────────────────────────────┐
│ 💵 FLUXO DE CAIXA - Projeção 30 dias             [Período ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Saldo Atual: R$ 23,681.25                     ⬆️ +15% mês  │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                     │     │
│  │  30k │     ╱╲        ╱╲                            │     │
│  │      │    ╱  ╲      ╱  ╲                           │     │
│  │  25k │   ╱    ╲____╱    ╲____                      │     │
│  │      │  ╱                     ╲                     │     │
│  │  20k │ ╱                       ╲                    │     │
│  │      │╱                         ╲                   │     │
│  │  15k │                           ╲___               │     │
│  │      │                               ╲              │     │
│  │  10k │                                ╲             │     │
│  │      │                                 ╲            │     │
│  │   5k │                                  ╲🔴ALERTA   │     │
│  │      └──────────────────────────────────────────   │     │
│  │       15  17  20  23  26  29  02  05  08  11  14   │     │
│  │       Jan ────────────────────────────── Fev        │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌──────────────────────┐  ┌───────────────────────┐       │
│  │ ⬆️ Entradas Previstas│  │ ⬇️ Saídas Previstas   │       │
│  ├──────────────────────┤  ├───────────────────────┤       │
│  │ 16/01 - R$ 1.9k      │  │ 15/01 - R$ 850 ⚠️      │       │
│  │ 20/01 - R$ 3.2k      │  │ 20/01 - R$ 16.3k 🔴   │       │
│  │ 25/01 - R$ 2.5k      │  │ 22/01 - R$ 320        │       │
│  │ 30/01 - R$ 4.1k      │  │ 10/02 - R$ 3.5k       │       │
│  └──────────────────────┘  └───────────────────────┘       │
│                                                               │
│  ⚠️ Alerta: Saldo projetado negativo em 20/01              │
│  💡 Sugestão: Antecipar R$ 5k em recebíveis ou adiar        │
│     pagamento da folha para 25/01                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### Fase 1 - Fundação (Sprint 1-2) ⏱️ 2 semanas
- ✅ Criar FinanceContext com estado inicial
- ✅ Expandir schema de despesas (boleto, recorrência, status)
- ✅ Criar ExpensesManager (CRUD completo)
- ✅ Implementar upload de boletos (base64)
- ✅ Dashboard básico (KPIs: caixa, a pagar, a receber)
- ✅ Adicionar perfil FINANCEIRO no AuthContext
- ✅ Implementar RBAC (bloquear VENDAS/ESTOQUE/COMPRAS)

### Fase 2 - Contas a Receber (Sprint 3) ⏱️ 1 semana
- ✅ Criar schema contasReceber
- ✅ Integrar com vendas (ao criar venda parcelada → gera conta)
- ✅ Componente ReceivablesManager (visualizar, baixar, antecipar)
- ✅ Alertas de recebimentos próximos

### Fase 3 - Fluxo de Caixa (Sprint 4) ⏱️ 1 semana
- ✅ Criar contasBancarias e lancamentosBancarios
- ✅ Componente BankAccounts (CRUD de contas)
- ✅ Lógica de cálculo de fluxo projetado (30 dias)
- ✅ Componente CashFlowChart (gráfico + alertas)
- ✅ Sistema de alertas proativos (caixa baixo, saldo negativo)

### Fase 4 - DRE e Impostos (Sprint 5) ⏱️ 1 semana
- ✅ Criar schema impostos
- ✅ Lógica de cálculo DRE (receita, CMV, despesas, lucro)
- ✅ Componente DREReport (visualização + export PDF)
- ✅ Componente TaxManager (provisão, pagamento, histórico)
- ✅ Integração com diferentes regimes (Simples, MEI, Lucro Presumido)

### Fase 5 - Conciliação Bancária (Sprint 6) ⏱️ 1 semana
- ✅ Import de extratos CSV
- ✅ Lógica de conciliação automática (regex + ML básico)
- ✅ Componente BankReconciliation (match manual, sugestões)
- ✅ Relatório de divergências

### Fase 6 - Insights e IA (Sprint 7) ⏱️ 1 semana
- ✅ Análise de padrões de despesas
- ✅ Previsão de faturamento (baseado em histórico)
- ✅ Cálculo de ponto de equilíbrio
- ✅ Recomendações automáticas (corte de custos, renegociação)
- ✅ Componente FinancialInsights (cards com sugestões)

### Fase 7 - Polimento e Testes (Sprint 8) ⏱️ 1 semana
- ✅ Testes E2E de todos os fluxos
- ✅ Validação de permissões RBAC
- ✅ Otimização de performance
- ✅ Documentação de usuário
- ✅ Treinamento de stakeholders

---

## 📈 MÉTRICAS DE SUCESSO

### KPIs do Módulo
- ✅ Tempo médio para lançar despesa: < 30 segundos
- ✅ Taxa de conciliação automática: > 80%
- ✅ Redução de boletos vencidos: -50% em 3 meses
- ✅ Precisão de projeção de caixa: ±10%
- ✅ Adoção por usuários financeiros: 100%
- ✅ Satisfação NPS: > 8/10

### Impacto no Negócio
- ✅ Visibilidade financeira em tempo real
- ✅ Redução de custos operacionais (identificação de despesas desnecessárias)
- ✅ Melhoria no fluxo de caixa (antecipação de problemas)
- ✅ Compliance fiscal (impostos calculados corretamente)
- ✅ Decisões baseadas em dados (DRE + insights)

---

## 🔐 SEGURANÇA E COMPLIANCE

### Medidas de Segurança
- ✅ Criptografia de dados sensíveis (boletos, contas bancárias)
- ✅ Audit log de todas operações financeiras
- ✅ Autenticação obrigatória (não permite acesso anônimo)
- ✅ RBAC rigoroso (zero acesso para perfis não autorizados)
- ✅ Backup automático diário do localStorage

### Compliance
- ✅ LGPD: Dados financeiros com consentimento explícito
- ✅ Nota Fiscal: Integração futura com API de NF-e
- ✅ Contabilidade: Export para formato SPED (CSV)
- ✅ Auditoria: Histórico completo de alterações

---

## 📦 ENTREGÁVEIS

### Código
- ✅ 8 novos componentes React
- ✅ 1 Context (FinanceContext)
- ✅ 1 Service (FinanceService.js)
- ✅ Utilitários de cálculo e validação
- ✅ Schemas de banco atualizados

### Documentação
- ✅ Manual de usuário (PDF)
- ✅ Guia de permissões RBAC
- ✅ API documentation (JSDoc)
- ✅ Diagramas de fluxo

### Testes
- ✅ Testes unitários (Jest)
- ✅ Testes de integração
- ✅ Testes E2E (Cypress)
- ✅ Testes de permissões RBAC

---

## 🎓 PRÓXIMOS PASSOS

1. **Aprovação do Escopo**: Review deste documento com stakeholders
2. **Priorização de Funcionalidades**: Validar roadmap de sprints
3. **Início do Desenvolvimento**: Criar branch `feature/modulo-financeiro`
4. **Setup de Ambiente**: Configurar FinanceContext e estrutura base
5. **Sprint 1**: Implementar CRUD de despesas + boletos

---

**Última atualização**: 04/12/2025
**Autor**: GitHub Copilot (Product Manager AI)
**Status**: ✅ Pronto para Implementação
