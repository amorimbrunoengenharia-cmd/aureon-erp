/**
 * Script para criar super admin
 */

import { sequelize } from '../config/database.js';
import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

async function createSuperAdmin() {
  try {
    logger.info('Criando super admin...');

    // Verificar se já existe
    const existing = await User.findOne({ where: { email: 'superadmin@aureon.com' } });
    if (existing) {
      logger.warn('Super admin já existe!');
      process.exit(0);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar super admin
    const superAdmin = await User.create({
      username: 'superadmin',
      password: hashedPassword,
      email: 'superadmin@aureon.com',
      role: 'CEO',
      is_super_admin: true,
      active: true,
      tenant_id: null // Super admin não pertence a nenhum tenant
    });

    logger.info('✅ Super admin criado com sucesso!');
    logger.info('');
    logger.info('Credenciais:');
    logger.info('Username: superadmin');
    logger.info('Email: superadmin@aureon.com');
    logger.info('Senha: admin123');
    logger.info('');
    logger.info('Use estas credenciais para fazer login e criar tenants.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao criar super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
