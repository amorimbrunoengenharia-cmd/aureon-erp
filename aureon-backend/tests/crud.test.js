/**
 * Testes de CRUD Básico
 * Testa operações de produtos, clientes, vendas e fornecedores
 */

import request from 'supertest';
import app from '../server.js';
import { sequelize } from '../../config/database.js';

describe('CRUD Operations', () => {
  let tenant, user, authToken;

  beforeEach(async () => {
    tenant = await createTestTenant({
      slug: 'crud-test-company'
    });

    user = await createTestUser({
      username: 'cruduser',
      email: 'crud@test.com',
      tenant_id: tenant.id,
      role: 'CEO'
    });

    authToken = await generateTestToken(user.id, tenant.id);
  });

  describe('Products API', () => {
    it('deve criar um produto', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          produto: 'Armação Ray-Ban',
          sku: 'RB-001',
          preco_custo: 150,
          preco_venda: 300,
          estoque_minimo: 5,
          estoque_atual: 20,
          tipo: 'ARMACAO',
          categoria: 'Premium',
          marca: 'Ray-Ban'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.produto).toBe('Armação Ray-Ban');
      expect(response.body.sku).toBe('RB-001');
      expect(response.body.tenant_id).toBe(tenant.id);
    });

    it('deve listar produtos', async () => {
      const { Product } = sequelize.models;

      // Criar alguns produtos
      await Product.create({
        produto: 'Produto 1',
        sku: 'SKU-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      await Product.create({
        produto: 'Produto 2',
        sku: 'SKU-002',
        preco_venda: 200,
        estoque_minimo: 5,
        estoque_atual: 25,
        tipo: 'LENTE',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('deve buscar produto por ID', async () => {
      const { Product } = sequelize.models;

      const product = await Product.create({
        produto: 'Teste Produto',
        sku: 'TEST-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(product.id);
      expect(response.body.produto).toBe('Teste Produto');
    });

    it('deve atualizar produto', async () => {
      const { Product } = sequelize.models;

      const product = await Product.create({
        produto: 'Produto Antigo',
        sku: 'OLD-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          produto: 'Produto Atualizado',
          preco_venda: 150
        });

      expect(response.status).toBe(200);
      expect(response.body.produto).toBe('Produto Atualizado');
      expect(response.body.preco_venda).toBe(150);
    });

    it('deve deletar produto', async () => {
      const { Product } = sequelize.models;

      const product = await Product.create({
        produto: 'Produto para Deletar',
        sku: 'DEL-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);

      // Verificar se foi deletado
      const checkResponse = await request(app)
        .get(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(checkResponse.status).toBe(404);
    });

    it('deve rejeitar criação com SKU duplicado', async () => {
      const { Product } = sequelize.models;

      await Product.create({
        produto: 'Produto 1',
        sku: 'DUP-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          produto: 'Produto 2',
          sku: 'DUP-001', // SKU duplicado
          preco_venda: 200,
          estoque_minimo: 5,
          estoque_atual: 25,
          tipo: 'LENTE'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Clients API', () => {
    it('deve criar um cliente', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '(11) 98765-4321',
          cpf_cnpj: '123.456.789-00',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('João Silva');
      expect(response.body.tenant_id).toBe(tenant.id);
    });

    it('deve listar clientes', async () => {
      const { Client } = sequelize.models;

      await Client.create({
        nome: 'Cliente 1',
        email: 'cliente1@test.com',
        tenant_id: tenant.id
      });

      await Client.create({
        nome: 'Cliente 2',
        email: 'cliente2@test.com',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('deve buscar cliente por ID', async () => {
      const { Client } = sequelize.models;

      const client = await Client.create({
        nome: 'Cliente Teste',
        email: 'teste@client.com',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(client.id);
      expect(response.body.nome).toBe('Cliente Teste');
    });

    it('deve atualizar cliente', async () => {
      const { Client } = sequelize.models;

      const client = await Client.create({
        nome: 'Cliente Antigo',
        email: 'old@client.com',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          nome: 'Cliente Atualizado',
          telefone: '(11) 99999-9999'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Cliente Atualizado');
      expect(response.body.telefone).toBe('(11) 99999-9999');
    });
  });

  describe('Sales API', () => {
    let product, client;

    beforeEach(async () => {
      const { Product, Client } = sequelize.models;

      product = await Product.create({
        produto: 'Produto Venda',
        sku: 'SALE-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      client = await Client.create({
        nome: 'Cliente Venda',
        email: 'venda@client.com',
        tenant_id: tenant.id
      });
    });

    it('deve criar uma venda', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          cliente_id: client.id,
          produto_id: product.id,
          quantidade: 2,
          preco_unitario: 100,
          valor_total: 200,
          forma_pagamento: 'DINHEIRO',
          canal: 'LOJA_FISICA',
          status: 'CONCLUIDA'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.quantidade).toBe(2);
      expect(response.body.valor_total).toBe(200);
      expect(response.body.tenant_id).toBe(tenant.id);
    });

    it('deve listar vendas', async () => {
      const { Sale } = sequelize.models;

      await Sale.create({
        cliente_id: client.id,
        produto_id: product.id,
        quantidade: 1,
        valor_total: 100,
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve buscar venda por ID', async () => {
      const { Sale } = sequelize.models;

      const sale = await Sale.create({
        cliente_id: client.id,
        produto_id: product.id,
        quantidade: 1,
        valor_total: 100,
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get(`/api/sales/${sale.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(sale.id);
    });

    it('deve validar estoque ao criar venda', async () => {
      // Atualizar estoque para 0
      await product.update({ estoque_atual: 0 });

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          cliente_id: client.id,
          produto_id: product.id,
          quantidade: 1,
          preco_unitario: 100,
          valor_total: 100,
          forma_pagamento: 'DINHEIRO',
          canal: 'LOJA_FISICA'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('estoque');
    });
  });

  describe('Suppliers API', () => {
    it('deve criar um fornecedor', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          nome: 'Fornecedor Teste',
          cnpj: '12.345.678/0001-90',
          email: 'contato@fornecedor.com',
          telefone: '(11) 3333-4444',
          endereco: 'Av. Fornecedor, 100',
          categoria: 'ARMACOES'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Fornecedor Teste');
      expect(response.body.tenant_id).toBe(tenant.id);
    });

    it('deve listar fornecedores', async () => {
      const { Supplier } = sequelize.models;

      await Supplier.create({
        nome: 'Fornecedor 1',
        cnpj: '11.111.111/0001-11',
        tenant_id: tenant.id
      });

      await Supplier.create({
        nome: 'Fornecedor 2',
        cnpj: '22.222.222/0001-22',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('deve rejeitar CNPJ duplicado', async () => {
      const { Supplier } = sequelize.models;

      await Supplier.create({
        nome: 'Fornecedor 1',
        cnpj: '12.345.678/0001-90',
        tenant_id: tenant.id
      });

      const response = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          nome: 'Fornecedor 2',
          cnpj: '12.345.678/0001-90', // CNPJ duplicado
          email: 'outro@fornecedor.com'
        });

      expect(response.status).toBe(400);
    });
  });
});
