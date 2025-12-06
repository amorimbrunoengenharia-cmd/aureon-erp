/**
 * Testes de Serviços Especializados
 * Testa analytics, alerts, backup, e search
 */

import request from 'supertest';
import app from '../../server.js';
import { sequelize } from '../../config/database.js';

describe('Specialized Services', () => {
  let tenant, user, authToken;

  beforeEach(async () => {
    tenant = await createTestTenant({
      slug: 'services-test-company'
    });

    user = await createTestUser({
      username: 'servicesuser',
      email: 'services@test.com',
      tenant_id: tenant.id,
      role: 'CEO'
    });

    authToken = await generateTestToken(user.id, tenant.id);
  });

  describe('Analytics Service', () => {
    let product, client, sales;

    beforeEach(async () => {
      const { Product, Client, Sale } = sequelize.models;

      // Criar produto
      product = await Product.create({
        produto: 'Produto Analytics',
        sku: 'ANA-001',
        preco_custo: 50,
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        categoria: 'Premium',
        tenant_id: tenant.id
      });

      // Criar cliente
      client = await Client.create({
        nome: 'Cliente Analytics',
        email: 'analytics@client.com',
        tenant_id: tenant.id
      });

      // Criar vendas
      sales = [];
      for (let i = 0; i < 5; i++) {
        const sale = await Sale.create({
          cliente_id: client.id,
          produto_id: product.id,
          quantidade: i + 1,
          preco_unitario: 100,
          valor_total: 100 * (i + 1),
          forma_pagamento: 'DINHEIRO',
          canal: 'LOJA_FISICA',
          status: 'CONCLUIDA',
          vendedor_id: user.id,
          tenant_id: tenant.id,
          data_venda: new Date()
        });
        sales.push(sale);
      }
    });

    it('deve retornar analytics de vendas', async () => {
      const response = await request(app)
        .get('/api/analytics/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSales');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body.totalSales).toBe(5);
    });

    it('deve retornar top produtos', async () => {
      const response = await request(app)
        .get('/api/analytics/top-products')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('produto');
      expect(response.body[0]).toHaveProperty('totalVendido');
    });

    it('deve retornar top clientes', async () => {
      const response = await request(app)
        .get('/api/analytics/top-clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('nome');
      expect(response.body[0]).toHaveProperty('totalGasto');
    });

    it('deve retornar performance de vendedores', async () => {
      const response = await request(app)
        .get('/api/analytics/salesman-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar dashboard completo', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sales');
      expect(response.body).toHaveProperty('topProducts');
      expect(response.body).toHaveProperty('topClients');
    });
  });

  describe('Alerts Service', () => {
    beforeEach(async () => {
      const { Product } = sequelize.models;

      // Criar produtos com estoque baixo
      await Product.create({
        produto: 'Produto Estoque Baixo',
        sku: 'LOW-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 3, // Abaixo do mínimo
        tipo: 'ARMACAO',
        tenant_id: tenant.id
      });

      // Criar produto com estoque ok
      await Product.create({
        produto: 'Produto Estoque OK',
        sku: 'OK-001',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'LENTE',
        tenant_id: tenant.id
      });
    });

    it('deve retornar alertas de estoque baixo', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ category: 'LOW_STOCK' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('severity');
      expect(response.body[0]).toHaveProperty('message');
    });

    it('deve retornar resumo de alertas', async () => {
      const response = await request(app)
        .get('/api/alerts/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('bySeverity');
    });

    it('deve retornar apenas alertas críticos', async () => {
      const response = await request(app)
        .get('/api/alerts/critical')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve permitir configurar thresholds de alertas', async () => {
      const response = await request(app)
        .put('/api/alerts/thresholds')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          lowStock: 5,
          noMovement: 60,
          inactiveClient: 120
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('thresholds');
    });
  });

  describe('Search Service', () => {
    beforeEach(async () => {
      const { Product, Client } = sequelize.models;

      // Criar produtos para busca
      await Product.create({
        produto: 'Armação Ray-Ban Aviator',
        sku: 'RB-AVIATOR',
        preco_venda: 500,
        estoque_minimo: 5,
        estoque_atual: 20,
        tipo: 'ARMACAO',
        marca: 'Ray-Ban',
        tenant_id: tenant.id
      });

      await Product.create({
        produto: 'Lente Transitions',
        sku: 'LENS-TRANS',
        preco_venda: 300,
        estoque_minimo: 10,
        estoque_atual: 30,
        tipo: 'LENTE',
        marca: 'Transitions',
        tenant_id: tenant.id
      });

      // Criar clientes para busca
      await Client.create({
        nome: 'Maria Santos',
        email: 'maria@example.com',
        cpf_cnpj: '123.456.789-00',
        tenant_id: tenant.id
      });

      await Client.create({
        nome: 'João Silva',
        email: 'joao@example.com',
        cpf_cnpj: '987.654.321-00',
        tenant_id: tenant.id
      });
    });

    it('deve buscar produtos por termo', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ q: 'Ray-Ban' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].produto).toContain('Ray-Ban');
    });

    it('deve buscar clientes por termo', async () => {
      const response = await request(app)
        .get('/api/search/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ q: 'Maria' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].nome).toContain('Maria');
    });

    it('deve fazer busca global', async () => {
      const response = await request(app)
        .get('/api/search/global')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ q: 'Ray' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('clients');
    });

    it('deve retornar sugestões de autocomplete', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ q: 'Ray', entity: 'products' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve fazer busca avançada com filtros', async () => {
      const response = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          entity: 'products',
          filters: {
            tipo: 'ARMACAO',
            preco_min: 400
          }
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].tipo).toBe('ARMACAO');
        expect(response.body[0].preco_venda).toBeGreaterThanOrEqual(400);
      }
    });

    it('deve salvar busca favorita', async () => {
      const response = await request(app)
        .post('/api/search/saved')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          name: 'Armações Premium',
          entity: 'products',
          filters: {
            tipo: 'ARMACAO',
            preco_min: 500
          },
          is_favorite: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Armações Premium');
    });
  });

  describe('Backup Service', () => {
    it('deve criar backup completo', async () => {
      const response = await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('size');
      expect(response.body.filename).toContain('.json');
    });

    it('deve listar backups existentes', async () => {
      // Criar um backup primeiro
      await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      const response = await request(app)
        .get('/api/backup/list')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('filename');
      expect(response.body[0]).toHaveProperty('size');
      expect(response.body[0]).toHaveProperty('created_at');
    });

    it('usuário não-CEO não pode criar backup', async () => {
      // Criar usuário VENDAS
      const vendasUser = await createTestUser({
        username: 'vendas',
        email: 'vendas@test.com',
        tenant_id: tenant.id,
        role: 'VENDAS'
      });

      const vendasToken = await generateTestToken(vendasUser.id, tenant.id);

      const response = await request(app)
        .post('/api/backup/create')
        .set('Authorization', `Bearer ${vendasToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(403);
    });
  });

  describe('Audit Trail', () => {
    it('deve registrar ações no audit log', async () => {
      // Criar um produto (deve gerar log de auditoria)
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .send({
          produto: 'Produto Auditoria',
          sku: 'AUD-001',
          preco_venda: 100,
          estoque_minimo: 10,
          estoque_atual: 50,
          tipo: 'ARMACAO'
        });

      // Buscar logs de auditoria
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar logs por ação', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ action: 'CREATE' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar logs por tipo de recurso', async () => {
      const response = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', tenant.id)
        .query({ resource_type: 'product' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
