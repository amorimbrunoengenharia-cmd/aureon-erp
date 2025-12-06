# 🗄️ DATABASE SCHEMA - ERP AUREON (Normalizado)

## 📋 VISÃO GERAL
Schema completo com Foreign Keys, RBAC, e Audit Log para garantir integridade relacional.

---

## 📐 DIAGRAMA RELACIONAL

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ username        │
│ password_hash   │
│ email           │
│ role (FK)       │──┐
│ active          │  │
│ created_at      │  │
│ last_login      │  │
└─────────────────┘  │
                     │
┌────────────────────▼─────┐
│      USER_ROLES          │
├──────────────────────────┤
│ id (PK)                  │
│ role_name (CEO, ESTOQUE, │
│            COMPRAS, VENDAS)│
│ permissions_json         │
└──────────────────────────┘

┌─────────────────────────────┐
│      USER_SETTINGS          │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK → USERS)        │
│ settings_json               │
│   ├─ CEO: { metaCrescimento, auditView }
│   ├─ ESTOQUE: { ocultarValores, alertaEstoqueMinimo }
│   ├─ COMPRAS: { diasSeguranca, leadTimePadrao }
│   └─ VENDAS: { metaPessoal, readonly: true }
│ updated_at                  │
└─────────────────────────────┘

┌─────────────────┐
│   FORNECEDORES  │
├─────────────────┤
│ id (PK)         │
│ nome (NOT NULL) │
│ contato         │
│ email           │
│ lead_time (days)│
│ ativo           │
│ created_at      │
└─────────────────┘
        ▲
        │ FK
        │
┌───────┴──────────┐
│    PRODUTOS      │
├──────────────────┤
│ id (PK)          │
│ nome (NOT NULL)  │
│ preco_custo      │
│ preco_venda      │
│ quantidade_estoque│
│ fornecedor_id (FK → FORNECEDORES, NOT NULL) │
│ created_at       │
│ updated_at       │
└──────────────────┘
        ▲
        │ FK
        │
┌───────┴──────────────────────┐
│      MOVIMENTACOES           │
├──────────────────────────────┤
│ id (PK)                      │
│ produto_id (FK → PRODUTOS, NOT NULL) │
│ fornecedor_id (FK → FORNECEDORES, NOT NULL) ← NOVO │
│ tipo (ENUM: 'entrada', 'saida') │
│ quantidade                   │
│ usuario_id (FK → USERS)      │
│ data                         │
│ hora                         │
│ observacao                   │
└──────────────────────────────┘
        ▲
        │
┌───────┴───────────┐
│      VENDAS       │
├───────────────────┤
│ id (PK)           │
│ produto_id (FK)   │
│ cliente_id (FK)   │
│ quantidade        │
│ valor_unitario    │
│ valor_total       │
│ canal             │
│ data              │
│ vendedor_id (FK → USERS) │
└───────────────────┘

┌─────────────────────────────┐
│        AUDIT_LOG            │
├─────────────────────────────┤
│ id (PK)                     │
│ user_id (FK → USERS)        │
│ action (ENUM)               │
│   ├─ PRICE_CHANGE           │
│   ├─ SUPPLIER_CHANGE        │
│   ├─ CONFIG_CHANGE          │
│   ├─ USER_CREATE            │
│   └─ PERMISSION_CHANGE      │
│ table_name                  │
│ record_id                   │
│ old_value_json              │
│ new_value_json              │
│ timestamp                   │
│ ip_address                  │
└─────────────────────────────┘

┌─────────────────┐
│   CLIENTES      │
├─────────────────┤
│ id (PK)         │
│ nome            │
│ cpf_cnpj        │
│ email           │
│ telefone        │
│ endereco        │
│ data_cadastro   │
└─────────────────┘
```

---

## 🔑 CONSTRAINTS & REGRAS

### 1. **FOREIGN KEY CONSTRAINTS**

```sql
-- Produtos devem ter fornecedor válido
ALTER TABLE produtos
  ADD CONSTRAINT fk_produto_fornecedor
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
  ON DELETE RESTRICT;

-- Movimentações devem ter produto E fornecedor válidos
ALTER TABLE movimentacoes
  ADD CONSTRAINT fk_mov_produto
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
  ON DELETE CASCADE;

ALTER TABLE movimentacoes
  ADD CONSTRAINT fk_mov_fornecedor
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
  ON DELETE RESTRICT;

-- Validação: fornecedor_id NOT NULL para tipo='entrada'
ALTER TABLE movimentacoes
  ADD CONSTRAINT ck_fornecedor_entrada
  CHECK (tipo != 'entrada' OR fornecedor_id IS NOT NULL);

-- Users devem ter role válida
ALTER TABLE users
  ADD CONSTRAINT fk_user_role
  FOREIGN KEY (role) REFERENCES user_roles(id)
  ON DELETE RESTRICT;

-- User Settings vinculada a User
ALTER TABLE user_settings
  ADD CONSTRAINT fk_settings_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;
```

### 2. **NOT NULL CONSTRAINTS**

```sql
-- Produtos
ALTER TABLE produtos
  MODIFY COLUMN nome VARCHAR(255) NOT NULL,
  MODIFY COLUMN preco_custo DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN preco_venda DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN fornecedor_id INT NOT NULL;

-- Fornecedores
ALTER TABLE fornecedores
  MODIFY COLUMN nome VARCHAR(255) NOT NULL,
  MODIFY COLUMN contato VARCHAR(100) NOT NULL;

-- Movimentações
ALTER TABLE movimentacoes
  MODIFY COLUMN produto_id INT NOT NULL,
  MODIFY COLUMN quantidade INT NOT NULL,
  MODIFY COLUMN tipo ENUM('entrada', 'saida') NOT NULL;
```

### 3. **CHECK CONSTRAINTS**

```sql
-- Preços devem ser positivos
ALTER TABLE produtos
  ADD CONSTRAINT ck_preco_custo_positivo CHECK (preco_custo > 0),
  ADD CONSTRAINT ck_preco_venda_positivo CHECK (preco_venda > 0);

-- Estoque não pode ser negativo
ALTER TABLE produtos
  ADD CONSTRAINT ck_estoque_positivo CHECK (quantidade_estoque >= 0);

-- Quantidade de movimentação deve ser positiva
ALTER TABLE movimentacoes
  ADD CONSTRAINT ck_quantidade_positiva CHECK (quantidade > 0);

-- Lead time deve ser >= 0
ALTER TABLE fornecedores
  ADD CONSTRAINT ck_lead_time_positivo CHECK (lead_time >= 0);
```

### 4. **UNIQUE CONSTRAINTS**

```sql
-- Username único
ALTER TABLE users
  ADD CONSTRAINT uk_username UNIQUE (username);

-- Email único
ALTER TABLE users
  ADD CONSTRAINT uk_email UNIQUE (email);

-- CPF/CNPJ único por cliente
ALTER TABLE clientes
  ADD CONSTRAINT uk_cpf_cnpj UNIQUE (cpf_cnpj);
```

---

## 🎯 RBAC - ROLE-BASED ACCESS CONTROL

### Estrutura de Permissões

```javascript
// Tabela: USER_ROLES
const roles = {
  CEO: {
    id: 1,
    role_name: 'CEO',
    permissions: {
      produtos: { create: true, read: true, update: true, delete: true },
      vendas: { create: true, read: true, update: true, delete: true },
      fornecedores: { create: true, read: true, update: true, delete: true },
      clientes: { create: true, read: true, update: true, delete: true },
      movimentacoes: { create: true, read: true, update: true, delete: true },
      relatorios: { read: true, export: true },
      configuracoes: { read: true, update: true },
      audit_log: { read: true }, // ✅ EXCLUSIVO CEO
      users: { create: true, read: true, update: true, delete: true }
    },
    ui_restrictions: {
      hide_values: false, // Vê todos os valores
      readonly_prices: false // Pode editar preços
    }
  },
  
  ESTOQUE: {
    id: 2,
    role_name: 'ESTOQUE',
    permissions: {
      produtos: { create: false, read: true, update: 'quantity_only', delete: false },
      vendas: { create: false, read: true, update: false, delete: false },
      fornecedores: { create: false, read: true, update: false, delete: false },
      clientes: { create: false, read: true, update: false, delete: false },
      movimentacoes: { create: true, read: true, update: false, delete: false },
      relatorios: { read: 'limited', export: false },
      configuracoes: { read: 'limited', update: 'alertas_only' },
      audit_log: { read: false },
      users: { create: false, read: false, update: false, delete: false }
    },
    ui_restrictions: {
      hide_values: true, // ✅ Toggle para ocultar custos/lucro
      readonly_prices: true // ✅ Preços readonly
    }
  },
  
  COMPRAS: {
    id: 3,
    role_name: 'COMPRAS',
    permissions: {
      produtos: { create: false, read: true, update: false, delete: false },
      vendas: { create: false, read: true, update: false, delete: false },
      fornecedores: { create: true, read: true, update: true, delete: false },
      clientes: { create: false, read: false, update: false, delete: false },
      movimentacoes: { create: true, read: true, update: false, delete: false },
      relatorios: { read: 'compras_only', export: true },
      configuracoes: { read: 'limited', update: 'lead_time_only' },
      audit_log: { read: false },
      users: { create: false, read: false, update: false, delete: false }
    },
    ui_restrictions: {
      hide_values: false,
      readonly_prices: true, // ✅ Vê preços mas não edita
      can_manage_lead_time: true // ✅ Gerencia lead time
    }
  },
  
  VENDAS: {
    id: 4,
    role_name: 'VENDAS',
    permissions: {
      produtos: { create: false, read: true, update: false, delete: false },
      vendas: { create: true, read: true, update: 'own_only', delete: false },
      fornecedores: { create: false, read: false, update: false, delete: false },
      clientes: { create: true, read: true, update: true, delete: false },
      movimentacoes: { create: false, read: false, update: false, delete: false },
      relatorios: { read: 'vendas_only', export: false },
      configuracoes: { read: 'meta_pessoal_only', update: 'meta_pessoal_only' },
      audit_log: { read: false },
      users: { create: false, read: false, update: false, delete: false }
    },
    ui_restrictions: {
      hide_values: false, // Vê preços de venda
      readonly_prices: true, // ✅ READONLY ESTRITO em custos
      readonly_costs: true, // ✅ NUNCA vê custos
      can_view_personal_meta: true // ✅ Barra de progresso própria
    }
  }
};
```

---

## ⚙️ USER_SETTINGS (Configurações por Perfil)

```javascript
// Tabela: USER_SETTINGS
const userSettingsSchema = {
  CEO: {
    metaCrescimento: 20, // % de crescimento global (Float)
    auditView: true, // Acesso ao audit log
    alertasCriticos: true,
    theme: 'dark'
  },
  
  ESTOQUE: {
    ocultarValores: false, // ✅ Toggle para ocultar custos/lucro
    alertaEstoqueMinimo: 5, // Alerta quando estoque < 5
    alertaEstoqueCritico: 0, // Alerta quando estoque = 0
    notificacoesAtivas: true
  },
  
  COMPRAS: {
    diasSeguranca: 3, // ✅ Dias de segurança para algoritmo
    leadTimePadrao: 7, // ✅ Lead time padrão para novos fornecedores
    alertasReposicao: true,
    exibirFormulas: true // Mostrar fórmulas do algoritmo
  },
  
  VENDAS: {
    metaPessoal: 15000, // ✅ Meta pessoal do vendedor (Float)
    exibirProgressoMeta: true, // ✅ Barra de progresso
    notificacoesClientes: true,
    canaisPreferidos: ['Instagram', 'WhatsApp']
  }
};
```

---

## 📊 AUDIT_LOG (Rastreabilidade)

### Eventos Auditados:

```javascript
// Tabela: AUDIT_LOG
const auditEvents = {
  PRICE_CHANGE: {
    table: 'produtos',
    fields: ['preco_custo', 'preco_venda'],
    requires_role: ['CEO'], // Apenas CEO vê
    log_format: {
      user_id: 1,
      action: 'PRICE_CHANGE',
      record_id: 123,
      old_value: { preco_venda: 100.00 },
      new_value: { preco_venda: 120.00 },
      timestamp: '2025-12-04 14:30:00'
    }
  },
  
  SUPPLIER_CHANGE: {
    table: 'produtos',
    fields: ['fornecedor_id'],
    requires_role: ['CEO'],
    log_format: {
      user_id: 1,
      action: 'SUPPLIER_CHANGE',
      record_id: 456,
      old_value: { fornecedor_id: 5 },
      new_value: { fornecedor_id: 8 },
      timestamp: '2025-12-04 15:00:00'
    }
  },
  
  CONFIG_CHANGE: {
    table: 'user_settings',
    fields: ['metaCrescimento', 'diasSeguranca'],
    requires_role: ['CEO'],
    log_format: {
      user_id: 1,
      action: 'CONFIG_CHANGE',
      record_id: 1,
      old_value: { metaCrescimento: 20 },
      new_value: { metaCrescimento: 30 },
      timestamp: '2025-12-04 16:00:00'
    }
  },
  
  USER_CREATE: {
    table: 'users',
    fields: ['username', 'role'],
    requires_role: ['CEO']
  },
  
  PERMISSION_CHANGE: {
    table: 'user_roles',
    fields: ['permissions_json'],
    requires_role: ['CEO']
  }
};
```

---

## 🔧 IMPLEMENTAÇÃO - DataContext

### Validações a Adicionar:

```javascript
// 1. Validação de FK em addMovimentacao
const addMovimentacao = (mov) => {
  // ✅ FK: Produto deve existir
  const produto = produtos.find(p => p.id === parseInt(mov.produto_id));
  if (!produto) {
    throw new Error(`FK Constraint Failed: Produto ID ${mov.produto_id} não existe`);
  }
  
  // ✅ FK: Fornecedor obrigatório para entrada
  if (mov.tipo === 'entrada' && !mov.fornecedor_id) {
    throw new Error('FK Constraint Failed: fornecedor_id é obrigatório para movimentações de ENTRADA');
  }
  
  // ✅ FK: Fornecedor deve existir
  if (mov.fornecedor_id) {
    const fornecedor = fornecedores.find(f => f.id === parseInt(mov.fornecedor_id));
    if (!fornecedor) {
      throw new Error(`FK Constraint Failed: Fornecedor ID ${mov.fornecedor_id} não existe`);
    }
  }
  
  // ✅ CHECK: Quantidade positiva
  if (mov.quantidade <= 0) {
    throw new Error('Check Constraint Failed: quantidade deve ser > 0');
  }
  
  // Prosseguir com insert...
};

// 2. Validação de FK em addProduto
const addProduto = (produto) => {
  // ✅ NOT NULL: Campos obrigatórios
  if (!produto.nome || !produto.preco_custo || !produto.preco_venda || !produto.fornecedor_id) {
    throw new Error('Validation Failed: Todos os campos são obrigatórios (nome, preco_custo, preco_venda, fornecedor_id)');
  }
  
  // ✅ FK: Fornecedor deve existir
  const fornecedor = fornecedores.find(f => f.id === parseInt(produto.fornecedor_id));
  if (!fornecedor) {
    throw new Error(`FK Constraint Failed: Fornecedor ID ${produto.fornecedor_id} não existe`);
  }
  
  // ✅ CHECK: Preços positivos
  if (produto.preco_custo <= 0 || produto.preco_venda <= 0) {
    throw new Error('Check Constraint Failed: preços devem ser > 0');
  }
  
  // Prosseguir com insert...
};
```

---

## 📦 DTO - Data Transfer Objects

### ProductDTO (Para Grid)

```javascript
const ProductDTO = {
  id: 1,
  nome: 'Óculos Ray-Ban Aviator',
  preco_custo: 80.00,
  preco_venda: 200.00,
  quantidade_estoque: 15,
  fornecedor_nome: 'Óptica Global', // ✅ JOIN com fornecedores
  fornecedor_lead_time: 10,
  margem_lucro: 60.0, // Calculado: ((venda - custo) / venda) * 100
  
  // Campos adicionais para RBAC
  _readonly: {
    nome: false, // Editável apenas por CEO
    preco_custo: false, // Editável apenas por CEO
    preco_venda: false, // Editável apenas por CEO
    quantidade_estoque: true, // ✅ SEMPRE editável (inline)
    fornecedor_nome: false // Editável via dropdown
  }
};
```

---

## 🚀 MIGRATION PLAN

### Passo 1: Backup
```javascript
const exportarBackup = () => {
  const dados = {
    produtos,
    fornecedores,
    movimentacoes,
    vendas,
    clientes,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('backup_pre_migration', JSON.stringify(dados));
};
```

### Passo 2: Adicionar Campos
```javascript
// Adicionar user_id, role, permissions
const migrateUsers = () => {
  const defaultUsers = [
    { id: 1, username: 'admin', role: 'CEO', active: true },
    { id: 2, username: 'estoque1', role: 'ESTOQUE', active: true },
    { id: 3, username: 'compras1', role: 'COMPRAS', active: true },
    { id: 4, username: 'vendedor1', role: 'VENDAS', active: true }
  ];
  localStorage.setItem('aureon_users', JSON.stringify(defaultUsers));
};

// Adicionar fornecedor_id em movimentacoes antigas
const migrateMovimentacoes = () => {
  const movs = JSON.parse(localStorage.getItem('aureon_movimentacoes') || '[]');
  const updatedMovs = movs.map(mov => ({
    ...mov,
    fornecedor_id: mov.fornecedor_id || produtos.find(p => p.id === mov.produto_id)?.fornecedor_id || null
  }));
  localStorage.setItem('aureon_movimentacoes', JSON.stringify(updatedMovs));
};
```

### Passo 3: Validar Integridade
```javascript
const validateIntegrity = () => {
  const errors = [];
  
  // Produtos sem fornecedor
  produtos.forEach(p => {
    if (!p.fornecedor_id || !fornecedores.find(f => f.id === p.fornecedor_id)) {
      errors.push(`Produto ${p.id} sem fornecedor válido`);
    }
  });
  
  // Movimentações de entrada sem fornecedor
  movimentacoes.forEach(m => {
    if (m.tipo === 'entrada' && !m.fornecedor_id) {
      errors.push(`Movimentação ${m.id} de entrada sem fornecedor`);
    }
  });
  
  return errors;
};
```

---

## 📚 DOCUMENTAÇÃO TÉCNICA

### Endpoints Sugeridos (Backend Futuro)

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/users/me
PUT    /api/users/settings

GET    /api/produtos?role=CEO
POST   /api/produtos (validação FK)
PUT    /api/produtos/:id (log audit)
DELETE /api/produtos/:id (RESTRICT se FK)

POST   /api/movimentacoes (validação FK obrigatória)
GET    /api/movimentacoes?filter=entrada

GET    /api/audit-log (CEO only)
POST   /api/audit-log (auto trigger)

GET    /api/fornecedores
PUT    /api/fornecedores/:id/lead-time (COMPRAS role)
```

---

**Status:** ✅ Schema completo  
**Próximo Passo:** Implementar no DataContext.jsx e criar AuthContext.jsx
