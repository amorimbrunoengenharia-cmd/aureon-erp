/**
 * Script para criar tenant de demonstração
 */

import { sequelize } from '../config/database.js';
import { Tenant, User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

async function createDemoTenant() {
  try {
    logger.info('Criando tenant de demonstração...');

    // Verificar se já existe
    const existing = await Tenant.findOne({ where: { slug: 'empresa-demo' } });
    if (existing) {
      logger.warn('Tenant demo já existe!');
      process.exit(0);
    }

    // Criar tenant
    const tenant = await Tenant.create({
      name: 'Empresa Demo',
      slug: 'empresa-demo',
      domain: null, // Sem domínio customizado
      plan: 'professional',
      active: true,
      contact_email: 'contato@empresa-demo.com',
      contact_phone: '(11) 98765-4321',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      settings: {
        features: {
          multiCurrency: true,
          advancedReports: true,
          apiAccess: true,
          customBranding: true
        },
        limits: {
          maxUsers: 50,
          maxProducts: 10000,
          maxStorage: 20 * 1024 * 1024 * 1024 // 20GB
        },
        branding: {
          primaryColor: '#1a73e8',
          logo: null,
          favicon: null
        }
      }
    });

    logger.info(`✅ Tenant criado com sucesso! ID: ${tenant.id}`);

    // Criar usuário CEO para o tenant
    const hashedPassword = await bcrypt.hash('ceo123', 10);
    const ceo = await User.create({
      username: 'ceo-demo',
      password: hashedPassword,
      email: 'ceo@empresa-demo.com',
      role: 'CEO',
      is_super_admin: false,
      active: true,
      tenant_id: tenant.id
    });

    logger.info(`✅ Usuário CEO criado! ID: ${ceo.id}`);
    logger.info('');
    logger.info('=== TENANT DEMO CRIADO ===');
    logger.info('');
    logger.info('Tenant:');
    logger.info(`  Nome: ${tenant.name}`);
    logger.info(`  Slug: ${tenant.slug}`);
    logger.info(`  Plano: ${tenant.plan}`);
    logger.info(`  ID: ${tenant.id}`);
    logger.info('');
    logger.info('Usuário CEO:');
    logger.info(`  Username: ceo-demo`);
    logger.info(`  Email: ceo@empresa-demo.com`);
    logger.info(`  Senha: ceo123`);
    logger.info('');
    logger.info('Formas de identificação do tenant:');
    logger.info(`  1. Header X-Tenant-ID: ${tenant.id}`);
    logger.info(`  2. Header X-Tenant-Slug: ${tenant.slug}`);
    logger.info(`  3. Subdomain: ${tenant.slug}.aureon.com (se configurado)`);
    logger.info('');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao criar tenant demo:', error);
    process.exit(1);
  }
}

createDemoTenant();
