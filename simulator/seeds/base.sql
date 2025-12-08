-- AUREON ERP - Base Seed
-- Creates tenant, users, products, clients for simulation

-- Tenant
INSERT OR IGNORE INTO tenants (id, nome, ativo) VALUES 
('tenant-1', 'Farmácia Simulação', 1);

-- Users
INSERT OR IGNORE INTO usuarios (id, username, password, role, tenant_id, ativo) VALUES
('user-ceo', 'ceo', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'CEO', 'tenant-1', 1),
('user-vendedor', 'vendedor', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'VENDEDOR', 'tenant-1', 1),
('user-estoque', 'estoque', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'ESTOQUE', 'tenant-1', 1);

-- Products
INSERT OR IGNORE INTO produtos (id, nome, codigo_barras, preco_custo, preco_venda, estoque_atual, estoque_minimo, tenant_id, ativo) VALUES
('prod-1', 'Paracetamol 500mg', '7891234567890', 5.00, 12.50, 100, 10, 'tenant-1', 1),
('prod-2', 'Dipirona 1g', '7891234567891', 3.50, 8.00, 150, 20, 'tenant-1', 1),
('prod-3', 'Ibuprofeno 600mg', '7891234567892', 8.00, 18.00, 80, 15, 'tenant-1', 1);

-- Clients
INSERT OR IGNORE INTO clientes (id, nome, cpf, telefone, tenant_id, ativo) VALUES
('client-1', 'João Silva', '12345678901', '11999999999', 'tenant-1', 1),
('client-2', 'Maria Santos', '98765432109', '11988888888', 'tenant-1', 1);
