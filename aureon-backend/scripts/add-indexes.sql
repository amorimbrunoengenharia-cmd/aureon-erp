-- ⚡ Performance Indexes for AUREON ERP PostgreSQL
-- Run with: psql -U aureon -d aureon_erp -f scripts/add-indexes.sql

-- 1. Sales Performance (Dashboard crítico)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_tenant_date 
ON sales(tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_status 
ON sales(status) WHERE status != 'cancelled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_customer 
ON sales(customer_id);

-- 2. Finance Transactions (Fluxo de Caixa)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_data 
ON finance_transactions(data DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_tipo_valor 
ON finance_transactions(tipo, valor);

-- 3. Products (Inventário)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_active 
ON products(tenant_id, active) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category 
ON products(category_id);

-- Full-text search para produtos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search 
ON products USING gin(
  to_tsvector('portuguese', nome || ' ' || COALESCE(descricao, ''))
);

-- 4. Customers (Clientes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant 
ON customers(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email 
ON customers(email) WHERE email IS NOT NULL;

-- Full-text search para clientes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search 
ON customers USING gin(
  to_tsvector('portuguese', nome || ' ' || COALESCE(cpf, '') || ' ' || COALESCE(email, ''))
);

-- 5. Sale Items (Itens de Venda)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_items_sale 
ON sale_items(sale_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_items_product 
ON sale_items(product_id);

-- 6. Users (Autenticação)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant 
ON users(tenant_id);

-- 7. Stock Movements (Movimentações)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_product_date 
ON stock_movements(product_id, created_at DESC);

-- Verificar indexes criados
\echo '✅ Indexes criados com sucesso!'
\echo 'Para ver todos os indexes:'
\echo 'SELECT tablename, indexname FROM pg_indexes WHERE schemaname = '\''public'\'' ORDER BY tablename, indexname;'
