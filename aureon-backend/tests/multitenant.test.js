/**
 * Testes de Multi-Tenant
 * Testa isolamento de dados, identificação de tenant, e limites por plano
 */

import request from 'supertest';
import app from '../server.js';
import { sequelize } from '../../config/database.js';

describe('Multi-Tenant System', () => {
  let tenant1, tenant2;
  let user1, user2, superAdmin;
  let token1, token2, superAdminToken;

  beforeEach(async () => {
    // Criar dois tenants diferentes
    tenant1 = await createTestTenant({
      name: 'Company 1',
      slug: 'company-1',
      plan: 'basic'
    });

    tenant2 = await createTestTenant({
      name: 'Company 2',
      slug: 'company-2',
      plan: 'professional'
    });

    // Criar usuários em cada tenant
    user1 = await createTestUser({
      username: 'user1',
      email: 'user1@company1.com',
      tenant_id: tenant1.id,
      role: 'CEO'
    });

    user2 = await createTestUser({
      username: 'user2',
      email: 'user2@company2.com',
      tenant_id: tenant2.id,
      role: 'CEO'
    });

    // Criar super admin
    superAdmin = await createTestUser({
      username: 'superadmin',
      email: 'super@aureon.com',
      tenant_id: null,
      is_super_admin: true,
      role: 'CEO'
    });

    // Gerar tokens
    token1 = await generateTestToken(user1.id, tenant1.id);
    token2 = await generateTestToken(user2.id, tenant2.id);
    superAdminToken = await generateTestToken(superAdmin.id, null);
  });

  describe('Tenant Identification', () => {
    it('deve identificar tenant via X-Tenant-ID header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id);

      expect(response.status).toBe(200);
      expect(response.body.tenant_id).toBe(tenant1.id);
    });

    it('deve identificar tenant via X-Tenant-Slug header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-Slug', 'company-1');

      expect(response.status).toBe(200);
      expect(response.body.tenant_id).toBe(tenant1.id);
    });

    it('deve rejeitar requisição sem identificação de tenant', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token1}`);
      // Sem header X-Tenant-ID ou X-Tenant-Slug

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Tenant');
    });

    it('deve rejeitar tenant inválido', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', 'invalid-uuid');

      expect(response.status).toBe(404);
    });

    it('super admin não precisa de tenant header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.is_super_admin).toBe(true);
    });
  });

  describe('Data Isolation', () => {
    let product1, product2, client1, client2;

    beforeEach(async () => {
      const { Product, Client } = sequelize.models;

      // Criar produtos para cada tenant
      product1 = await Product.create({
        produto: 'Product Tenant 1',
        sku: 'SKU-001-T1',
        preco_venda: 100,
        estoque_minimo: 10,
        estoque_atual: 50,
        tipo: 'ARMACAO',
        tenant_id: tenant1.id
      });

      product2 = await Product.create({
        produto: 'Product Tenant 2',
        sku: 'SKU-001-T2',
        preco_venda: 200,
        estoque_minimo: 5,
        estoque_atual: 25,
        tipo: 'LENTE',
        tenant_id: tenant2.id
      });

      // Criar clientes para cada tenant
      client1 = await Client.create({
        nome: 'Client Tenant 1',
        email: 'client1@tenant1.com',
        tenant_id: tenant1.id
      });

      client2 = await Client.create({
        nome: 'Client Tenant 2',
        email: 'client2@tenant2.com',
        tenant_id: tenant2.id
      });
    });

    it('tenant 1 só deve ver seus próprios produtos', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(product1.id);
      expect(response.body[0].produto).toBe('Product Tenant 1');
    });

    it('tenant 2 só deve ver seus próprios produtos', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token2}`)
        .set('X-Tenant-ID', tenant2.id);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(product2.id);
      expect(response.body[0].produto).toBe('Product Tenant 2');
    });

    it('tenant 1 não deve acessar produto do tenant 2', async () => {
      const response = await request(app)
        .get(`/api/products/${product2.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id);

      expect(response.status).toBe(404);
    });

    it('tenant 2 não deve acessar cliente do tenant 1', async () => {
      const response = await request(app)
        .get(`/api/clients/${client1.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .set('X-Tenant-ID', tenant2.id);

      expect(response.status).toBe(404);
    });

    it('super admin deve ver dados de todos os tenants', async () => {
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tenants.length).toBeGreaterThanOrEqual(2);
    });

    it('usuário não pode criar recurso em outro tenant', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant2.id) // Tentando criar no tenant 2
        .send({
          produto: 'Hack Product',
          sku: 'HACK-001',
          preco_venda: 100,
          estoque_minimo: 10,
          estoque_atual: 50,
          tipo: 'ARMACAO'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Plan Limits', () => {
    beforeEach(async () => {
      const { Tenant } = sequelize.models;
      
      // Configurar tenant com plano free (3 usuários max)
      await tenant1.update({
        plan: 'free',
        settings: {
          limits: {
            maxUsers: 3,
            maxProducts: 100,
            maxStorage: 1073741824 // 1GB
          }
        }
      });
    });

    it('deve permitir criar recurso dentro do limite', async () => {
      const { Product } = sequelize.models;

      // Criar 50 produtos (limite é 100)
      for (let i = 0; i < 50; i++) {
        await Product.create({
          produto: `Product ${i}`,
          sku: `SKU-${i}`,
          preco_venda: 100,
          estoque_minimo: 10,
          estoque_atual: 50,
          tipo: 'ARMACAO',
          tenant_id: tenant1.id
        });
      }

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id)
        .send({
          produto: 'New Product',
          sku: 'SKU-NEW',
          preco_venda: 100,
          estoque_minimo: 10,
          estoque_atual: 50,
          tipo: 'ARMACAO'
        });

      expect(response.status).toBe(201);
    });

    it('deve verificar limites do plano antes de criar usuário', async () => {
      // Criar 3 usuários (limite do plano free)
      for (let i = 0; i < 3; i++) {
        await createTestUser({
          username: `user${i}`,
          email: `user${i}@tenant1.com`,
          tenant_id: tenant1.id,
          role: 'VENDAS'
        });
      }

      // Tentar criar o 4º usuário (deve falhar)
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id)
        .send({
          username: 'user4',
          email: 'user4@tenant1.com',
          password: 'password123',
          role: 'VENDAS'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('limite');
    });
  });

  describe('Tenant Management API', () => {
    it('super admin pode criar tenant', async () => {
      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'New Company',
          slug: 'new-company',
          plan: 'basic',
          contact_email: 'contact@newcompany.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Company');
    });

    it('usuário normal não pode criar tenant', async () => {
      const response = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id)
        .send({
          name: 'Hack Company',
          slug: 'hack-company',
          plan: 'enterprise'
        });

      expect(response.status).toBe(403);
    });

    it('super admin pode listar todos os tenants', async () => {
      const response = await request(app)
        .get('/api/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tenants.length).toBeGreaterThanOrEqual(2);
    });

    it('CEO pode ver estatísticas do próprio tenant', async () => {
      const response = await request(app)
        .get(`/api/tenants/${tenant1.id}/stats`)
        .set('Authorization', `Bearer ${token1}`)
        .set('X-Tenant-ID', tenant1.id);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('limits');
    });

    it('super admin pode desativar tenant', async () => {
      const response = await request(app)
        .post(`/api/tenants/${tenant1.id}/deactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.active).toBe(false);
    });

    it('usuário de tenant inativo não pode fazer login', async () => {
      // Desativar tenant
      await tenant1.update({ active: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@company1.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('inativo');
    });
  });
});
