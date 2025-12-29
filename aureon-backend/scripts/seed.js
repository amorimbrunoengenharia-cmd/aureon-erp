import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

// Tenant padrão para desenvolvimento
const defaultTenant = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Aureon Demo',
  slug: 'aureon-demo',
  domain: 'demo.aureon.local',
  contact_email: 'contato@aureondemo.com',
  contact_phone: '(11) 99999-9999',
  plan: 'enterprise',
  active: true,
  settings: {
    theme: 'dark',
    notifications: true,
    address: {
      logradouro: 'Rua Demo',
      numero: '123',
      complemento: 'Sala 1',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000'
    }
  }
};

const defaultUsers = [
  {
    username: 'ceo',
    password: 'ceo123',
    email: 'ceo@aureon.com',
    role: 'CEO',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    settings: {
      theme: 'dark',
      metaPessoal: 50000,
      exibirProgressoMeta: true
    }
  },
  {
    username: 'vendedor',
    password: 'vendedor123',
    email: 'vendas@aureon.com',
    role: 'VENDAS',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    settings: {
      theme: 'dark',
      metaPessoal: 30000,
      exibirProgressoMeta: true
    }
  },
  {
    username: 'estoque',
    password: 'estoque123',
    email: 'estoque@aureon.com',
    role: 'ESTOQUE',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    settings: {
      theme: 'dark'
    }
  },
  {
    username: 'compras',
    password: 'compras123',
    email: 'compras@aureon.com',
    role: 'COMPRAS',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    settings: {
      theme: 'dark'
    }
  },
  {
    username: 'financeiro',
    password: 'financeiro123',
    email: 'financeiro@aureon.com',
    role: 'FINANCEIRO',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    settings: {
      theme: 'dark'
    }
  },
  {
    username: 'itteam',
    password: 'it123',
    email: 'it@aureon.com',
    role: 'IT',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    settings: {
      theme: 'dark'
    }
  }
];

async function seed() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    await sequelize.sync({ force: false });
    logger.info('Database synced');

    // Criar tenant padrão
    const existingTenant = await Tenant.findByPk(defaultTenant.id);
    if (!existingTenant) {
      await Tenant.create(defaultTenant);
      logger.info(`✅ Tenant created: ${defaultTenant.name} (${defaultTenant.slug})`);
    } else {
      logger.info(`⏭️ Tenant already exists: ${defaultTenant.name}`);
    }

    // Criar usuários padrão
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ where: { username: userData.username } });
      
      if (!existingUser) {
        await User.create(userData);
        logger.info(`✅ User created: ${userData.username} (${userData.role})`);
      } else {
        // Atualizar tenant_id se o usuário já existe mas não tem tenant
        if (!existingUser.tenant_id) {
          await existingUser.update({ tenant_id: userData.tenant_id });
          logger.info(`✅ User updated with tenant_id: ${userData.username}`);
        } else {
          logger.info(`⏭️ User already exists: ${userData.username}`);
        }
      }
    }

    logger.info('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
