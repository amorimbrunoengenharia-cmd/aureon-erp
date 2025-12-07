/**
 * Testes de Autenticação
 * Testa login, registro, refresh token, e permissões RBAC
 */

import request from 'supertest';
import app from '../server.js';
import { sequelize } from '../../config/database.js';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  let testUser;
  let testTenant;
  let authToken;

  beforeEach(async () => {
    // Criar tenant de teste
    testTenant = await createTestTenant({
      slug: 'test-auth-company'
    });

    // Criar usuário de teste
    testUser = await createTestUser({
      username: 'authuser',
      email: 'auth@test.com',
      tenant_id: testTenant.id,
      role: 'CEO'
    });
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'Password123!',
          role: 'VENDAS',
          tenant_id: testTenant.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('username', 'newuser');
      expect(response.body.user).toHaveProperty('email', 'newuser@test.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('deve rejeitar registro com email duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: 'auth@test.com', // Email já existente
          password: 'Password123!',
          role: 'VENDAS',
          tenant_id: testTenant.id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve rejeitar registro com senha fraca', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'weakuser',
          email: 'weak@test.com',
          password: '123', // Senha muito fraca
          role: 'VENDAS',
          tenant_id: testTenant.id
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('deve rejeitar registro sem tenant_id (não super admin)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'notenant',
          email: 'notenant@test.com',
          password: 'Password123!',
          role: 'VENDAS'
          // tenant_id ausente
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', 'auth@test.com');
      expect(response.body.user).not.toHaveProperty('password');

      authToken = response.body.token;
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve rejeitar login com email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notexist@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve rejeitar login de usuário inativo', async () => {
      // Desativar usuário
      await testUser.update({ active: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('inativo');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Fazer login para obter refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'password123'
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('deve renovar token com refresh token válido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('deve rejeitar refresh token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Fazer login para obter token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('deve retornar dados do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', 'auth@test.com');
      expect(response.body).toHaveProperty('role', 'CEO');
      expect(response.body).not.toHaveProperty('password');
    });

    it('deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('RBAC - Role Based Access Control', () => {
    let ceoToken, vendasToken, estoqueToken;
    let ceoUser, vendasUser, estoqueUser;

    beforeEach(async () => {
      // Criar usuários com diferentes roles
      ceoUser = await createTestUser({
        username: 'ceo',
        email: 'ceo@test.com',
        role: 'CEO',
        tenant_id: testTenant.id
      });

      vendasUser = await createTestUser({
        username: 'vendas',
        email: 'vendas@test.com',
        role: 'VENDAS',
        tenant_id: testTenant.id
      });

      estoqueUser = await createTestUser({
        username: 'estoque',
        email: 'estoque@test.com',
        role: 'ESTOQUE',
        tenant_id: testTenant.id
      });

      // Obter tokens
      ceoToken = await generateTestToken(ceoUser.id, testTenant.id);
      vendasToken = await generateTestToken(vendasUser.id, testTenant.id);
      estoqueToken = await generateTestToken(estoqueUser.id, testTenant.id);
    });

    it('CEO deve ter acesso a todos os endpoints', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${ceoToken}`)
        .set('X-Tenant-ID', testTenant.id);

      expect(response.status).toBe(200);
    });

    it('VENDAS não deve ter acesso a endpoints de usuários', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${vendasToken}`)
        .set('X-Tenant-ID', testTenant.id);

      expect(response.status).toBe(403);
    });

    it('ESTOQUE não deve criar vendas', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${estoqueToken}`)
        .set('X-Tenant-ID', testTenant.id)
        .send({
          cliente_id: 'some-id',
          produto_id: 'some-id',
          quantidade: 1
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    it('deve fazer logout com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});
