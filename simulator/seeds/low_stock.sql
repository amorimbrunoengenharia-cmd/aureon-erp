-- AUREON ERP - Low Stock Seed
-- Creates scenario with only 1 item in stock for concurrency tests

-- Tenant
INSERT OR IGNORE INTO tenants (id, nome, ativo) VALUES 
('tenant-1', 'Farmácia Simulação', 1);

-- Users
INSERT OR IGNORE INTO usuarios (id, username, password, role, tenant_id, ativo) VALUES
('user-ceo', 'ceo', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'CEO', 'tenant-1', 1),
('user-vendedor', 'vendedor', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'VENDEDOR', 'tenant-1', 1);

-- Product with ONLY 1 item in stock
INSERT OR IGNORE INTO produtos (id, nome, codigo_barras, preco_custo, preco_venda, estoque_atual, estoque_minimo, tenant_id, ativo) VALUES
('prod-low', 'Medicamento Raro', '7891234500000', 50.00, 120.00, 1, 1, 'tenant-1', 1);

-- Client
INSERT OR IGNORE INTO clientes (id, nome, cpf, telefone, tenant_id, ativo) VALUES
('client-1', 'João Silva', '12345678901', '11999999999', 'tenant-1', 1);
