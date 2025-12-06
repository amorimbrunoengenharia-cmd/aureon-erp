/**
 * Setup global para testes
 * Configurações e mocks compartilhados
 */

import { sequelize } from '../config/database.js';

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.USE_POSTGRES = 'false';
process.env.LOG_LEVEL = 'error'; // Reduzir logs durante testes

// Setup antes de todos os testes
beforeAll(async () => {
  try {
    // Conectar ao banco de dados
    await sequelize.authenticate();
    
    // Sincronizar modelos (criar tabelas)
    await sequelize.sync({ force: true });
    
    console.log('✅ Database setup complete for tests');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
});

// Cleanup após todos os testes
afterAll(async () => {
  try {
    // Fechar conexão com o banco
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Failed to close database:', error);
  }
});

// Limpar dados entre testes
afterEach(async () => {
  try {
    // Limpar todas as tabelas mantendo a estrutura
    const tables = Object.keys(sequelize.models);
    for (const table of tables) {
      await sequelize.models[table].destroy({ where: {}, force: true });
    }
  } catch (error) {
    console.error('❌ Failed to clean database:', error);
  }
});

// Mock para serviços externos (email, etc)
global.mockEmailService = {
  sendWelcomeEmail: () => Promise.resolve(true),
  sendOrderConfirmation: () => Promise.resolve(true),
  sendLowStockAlert: () => Promise.resolve(true),
  sendPasswordReset: () => Promise.resolve(true),
  sendPaymentReminder: () => Promise.resolve(true),
  sendBackupNotification: () => Promise.resolve(true)
};

// Helper: criar usuário de teste
global.createTestUser = async (userData = {}) => {
  const { User } = sequelize.models;
  const bcrypt = await import('bcryptjs');
  
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: await bcrypt.default.hash('password123', 10),
    role: 'VENDAS',
    active: true,
    ...userData
  };
  
  return await User.create(defaultUser);
};

// Helper: criar tenant de teste
global.createTestTenant = async (tenantData = {}) => {
  const { Tenant } = sequelize.models;
  
  const defaultTenant = {
    name: 'Test Company',
    slug: 'test-company',
    plan: 'professional',
    active: true,
    ...tenantData
  };
  
  return await Tenant.create(defaultTenant);
};

// Helper: gerar token JWT
global.generateTestToken = async (userId, tenantId = null) => {
  const jwt = await import('jsonwebtoken');
  
  return jwt.default.sign(
    { id: userId, tenant_id: tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Timeout configurado no jest.config.js
