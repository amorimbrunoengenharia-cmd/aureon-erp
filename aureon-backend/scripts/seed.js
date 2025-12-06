import User from '../models/User.js';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

const defaultUsers = [
  {
    username: 'ceo',
    password: 'ceo123',
    email: 'ceo@aureon.com',
    role: 'CEO',
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
    settings: {
      theme: 'dark'
    }
  },
  {
    username: 'compras',
    password: 'compras123',
    email: 'compras@aureon.com',
    role: 'COMPRAS',
    settings: {
      theme: 'dark'
    }
  },
  {
    username: 'financeiro',
    password: 'financeiro123',
    email: 'financeiro@aureon.com',
    role: 'FINANCEIRO',
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

    // Criar usuários padrão
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ where: { username: userData.username } });
      
      if (!existingUser) {
        await User.create(userData);
        logger.info(`✅ User created: ${userData.username} (${userData.role})`);
      } else {
        logger.info(`⏭️ User already exists: ${userData.username}`);
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
