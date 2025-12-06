# 📦 Guia de Migração: localStorage → Database

Este guia explica como migrar dados do localStorage do frontend (navegador) para o banco de dados PostgreSQL/SQLite do backend.

---

## 🎯 Objetivo

Transferir todos os dados armazenados no localStorage do navegador (produtos, clientes, vendas, etc.) para o banco de dados do backend, mantendo:
- IDs originais (para preservar relacionamentos)
- Timestamps originais (created_at, updated_at)
- Estrutura de dados existente

---

## 📋 Pré-requisitos

1. ✅ Backend instalado e configurado
2. ✅ Banco de dados criado e sincronizado
3. ✅ Dados no localStorage do navegador

---

## 🚀 Passo a Passo

### 1. Exportar dados do localStorage

**Opção A: Console do Navegador (Recomendado)**

1. Abra o frontend no navegador (http://localhost:5173)
2. Abra DevTools (F12 ou Ctrl+Shift+I)
3. Vá para a aba **Console**
4. Execute o seguinte comando:

```javascript
// Exportar TODOS os dados do localStorage
copy(JSON.stringify(localStorage))
```

5. O comando copiará todos os dados para sua área de transferência

**Opção B: Application/Storage Tab**

1. DevTools → Application (ou Storage)
2. Sidebar → Local Storage → http://localhost:5173
3. Clique com botão direito → "Clear" para ver todos os itens
4. Copie manualmente cada chave

**Opção C: Script Automatizado**

Execute no console:

```javascript
const data = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  data[key] = localStorage.getItem(key);
}
copy(JSON.stringify(data));
console.log('✅ Dados copiados!');
```

### 2. Salvar dados em arquivo

1. Crie a pasta `data` no backend (se não existir):
```bash
mkdir aureon-backend/data
```

2. Cole o conteúdo copiado em um arquivo:
```bash
# Windows PowerShell
notepad aureon-backend/data/localStorage_export.json
# Cole o conteúdo e salve (Ctrl+V, Ctrl+S)
```

O arquivo deve ter esta estrutura:
```json
{
  "products": "[{\"id\":\"uuid\",\"produto\":\"...\"}]",
  "clients": "[{\"id\":\"uuid\",\"nome\":\"...\"}]",
  "sales": "[...]",
  ...
}
```

### 3. Executar migração

```bash
cd aureon-backend
npm run migrate:localStorage
```

**Ou com arquivo customizado:**
```bash
node scripts/migrateFromLocalStorage.js path/to/custom_export.json
```

### 4. Acompanhar progresso

O script mostrará o progresso em tempo real:

```
🚀 Starting localStorage → Database Migration

✅ localStorage data loaded successfully
Keys found: products, clients, sales, prescriptions, ...

📦 Migrating Products...
✅ Products: 45 migrated, 3 skipped, 0 failed

👥 Migrating Clients...
✅ Clients: 120 migrated, 5 skipped, 0 failed

💰 Migrating Sales...
✅ Sales: 200 migrated, 0 skipped, 2 failed

...

============================================================
📊 MIGRATION REPORT
============================================================

PRODUCTS:
  ✅ Success: 45
  ⏭️  Skipped: 3
  ❌ Failed: 0

CLIENTS:
  ✅ Success: 120
  ⏭️  Skipped: 5
  ❌ Failed: 0

...

TOTALS:
  ✅ Total Success: 450
  ⏭️  Total Skipped: 15
  ❌ Total Failed: 2
============================================================

📄 Report saved to: aureon-backend/data/migration_report.json

✅ Migration completed!
```

---

## 🔍 Entendendo o Relatório

### Estatísticas

- **Success**: Registros migrados com sucesso
- **Skipped**: Registros que já existiam no banco (evita duplicatas)
- **Failed**: Registros que falharam (veja erros no relatório)

### Arquivo de Relatório

Um relatório detalhado é salvo em `data/migration_report.json`:

```json
{
  "timestamp": "2025-12-05T19:30:00.000Z",
  "stats": {
    "products": { "success": 45, "failed": 0, "skipped": 3 },
    "clients": { "success": 120, "failed": 0, "skipped": 5 },
    ...
  },
  "errors": [
    {
      "type": "Sale",
      "id": "uuid-123",
      "error": "Foreign key constraint failed"
    }
  ]
}
```

---

## 📊 Dados Migrados

O script migra os seguintes recursos:

| Recurso | localStorage Key | Model |
|---------|-----------------|-------|
| Produtos | `products`, `aureon_products` | Product |
| Clientes | `clients`, `aureon_clients`, `customers` | Client |
| Fornecedores | `suppliers`, `aureon_suppliers`, `fornecedores` | Supplier |
| Vendas | `sales`, `aureon_sales`, `vendas` | Sale |
| Receitas | `prescriptions`, `aureon_prescriptions`, `receitas` | Prescription |
| Finanças | `finance_transactions`, `aureon_finance`, `transacoes` | FinanceTransaction |

---

## 🛡️ Segurança

### Proteção contra Duplicatas

O script verifica se cada registro já existe no banco antes de inserir:

- **Products**: Verifica por `sku`
- **Clients**: Verifica por `email`
- **Suppliers**: Verifica por `cnpj`
- **Sales**: Verifica por `id`
- **Prescriptions**: Verifica por `id`
- **Finance**: Verifica por `id`

### Preservação de IDs

O script mantém os UUIDs originais para preservar relacionamentos entre tabelas:

```javascript
Sale.prescription_id → Prescription.id
Sale.cliente_id → Client.id
Product.fornecedor_id → Supplier.id
```

---

## 🐛 Troubleshooting

### Erro: "Failed to load data"

**Causa**: Arquivo não encontrado ou JSON inválido

**Solução**:
1. Verifique se o arquivo existe: `ls aureon-backend/data/localStorage_export.json`
2. Valide o JSON: https://jsonlint.com/
3. Certifique-se de que copiou o conteúdo completo

### Erro: "Foreign key constraint failed"

**Causa**: Tentando inserir um registro que referencia outro que não existe

**Exemplo**: Sale com `cliente_id` que não está na tabela `clients`

**Solução**:
1. Certifique-se de exportar TODOS os dados relacionados
2. O script já migra na ordem correta (Suppliers → Products → Clients → Prescriptions → Sales)
3. Verifique se os IDs no localStorage são válidos UUIDs

### Erro: "Unique constraint violation"

**Causa**: Tentando inserir registro duplicado (email, cpf, cnpj único)

**Solução**: O script automaticamente pula duplicatas (status: "skipped")

### Muitos registros "skipped"

**Causa**: Os dados já foram migrados anteriormente

**Solução**: 
- Se quiser re-migrar, delete os dados do banco primeiro:
```bash
npm run migrate:reset  # Reset database
npm run migrate:localStorage  # Re-run migration
```

---

## 🔄 Re-executar Migração

Se precisar executar novamente:

```bash
# Limpar banco de dados (CUIDADO: deleta tudo!)
npm run migrate:reset

# Recriar estrutura
npm run migrate

# Seed de usuários padrão
npm run seed

# Re-executar migração
npm run migrate:localStorage
```

---

## ✅ Validação Pós-Migração

Após migrar, verifique se os dados foram importados corretamente:

### 1. Verificar contagem de registros

```bash
# Abrir SQLite CLI
sqlite3 aureon-backend/database.sqlite

# Contar registros
SELECT 'Products' as table, COUNT(*) as count FROM products
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Sales', COUNT(*) FROM sales
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions;

.quit
```

### 2. Testar API

```bash
# Listar produtos
curl http://localhost:5000/api/products

# Listar clientes
curl http://localhost:5000/api/clients

# Listar vendas
curl http://localhost:5000/api/sales
```

### 3. Verificar relacionamentos

```bash
# Venda com cliente e produto
curl http://localhost:5000/api/sales/:id

# Cliente com vendas
curl http://localhost:5000/api/clients/:id
```

---

## 🎓 Exemplo Completo

```bash
# 1. Exportar do navegador (Console)
copy(JSON.stringify(localStorage))

# 2. Salvar arquivo
# Cole em: aureon-backend/data/localStorage_export.json

# 3. Executar migração
cd aureon-backend
npm run migrate:localStorage

# 4. Verificar resultado
# ✅ Total Success: 500
# ⏭️  Total Skipped: 10
# ❌ Total Failed: 0

# 5. Testar no frontend
# Abrir http://localhost:5173
# Login com credenciais
# Verificar se os dados aparecem
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `aureon-backend/logs/combined.log`
2. Veja o relatório: `aureon-backend/data/migration_report.json`
3. Logs em tempo real: `tail -f aureon-backend/logs/combined.log`

---

## 🎉 Próximos Passos

Após migração bem-sucedida:

1. ✅ Atualizar frontend para usar API ao invés de localStorage
2. ✅ Configurar autenticação JWT no frontend
3. ✅ Remover código relacionado ao localStorage
4. ✅ Implementar sincronização em tempo real (WebSockets - opcional)

---

**Última atualização**: 05/12/2025
