/**
 * Script de migração para adicionar suporte multi-tenant
 * CUIDADO: Este script modificará o banco de dados
 * Faça backup antes de executar!
 */

import { sequelize } from '../config/database.js';
import logger from '../utils/logger.js';

async function addMultiTenantSupport() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    logger.info('Iniciando migração multi-tenant...');

    // 1. Criar tabela tenants
    await queryInterface.createTable('tenants', {
      id: {
        type: 'UUID',
        primaryKey: true
      },
      name: {
        type: 'VARCHAR(100)',
        allowNull: false
      },
      slug: {
        type: 'VARCHAR(50)',
        allowNull: false,
        unique: true
      },
      domain: {
        type: 'VARCHAR(255)',
        unique: true
      },
      settings: {
        type: 'TEXT'
      },
      plan: {
        type: 'VARCHAR(20)',
        defaultValue: 'free'
      },
      active: {
        type: 'BOOLEAN',
        defaultValue: true
      },
      logo: {
        type: 'TEXT'
      },
      contact_email: {
        type: 'VARCHAR(255)'
      },
      contact_phone: {
        type: 'VARCHAR(20)'
      },
      trial_ends_at: {
        type: 'DATETIME'
      },
      subscription_ends_at: {
        type: 'DATETIME'
      },
      created_at: {
        type: 'DATETIME',
        allowNull: false
      },
      updated_at: {
        type: 'DATETIME',
        allowNull: false
      }
    });

    logger.info('✅ Tabela tenants criada');

    // 2. Adicionar tenant_id e is_super_admin em users
    await queryInterface.addColumn('users', 'tenant_id', {
      type: 'UUID',
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('users', 'is_super_admin', {
      type: 'BOOLEAN',
      defaultValue: false
    });

    logger.info('✅ Campos adicionados em users');

    // 3. Adicionar tenant_id em products
    await queryInterface.addColumn('products', 'tenant_id', {
      type: 'UUID',
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    logger.info('✅ Campo tenant_id adicionado em products');

    // 4. Adicionar tenant_id em clients
    await queryInterface.addColumn('clients', 'tenant_id', {
      type: 'UUID',
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    logger.info('✅ Campo tenant_id adicionado em clients');

    // 5. Adicionar tenant_id em sales
    await queryInterface.addColumn('sales', 'tenant_id', {
      type: 'UUID',
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    logger.info('✅ Campo tenant_id adicionado em sales');

    // 6. Adicionar tenant_id em suppliers
    await queryInterface.addColumn('suppliers', 'tenant_id', {
      type: 'UUID',
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    logger.info('✅ Campo tenant_id adicionado em suppliers');

    // 7. Criar índices
    await queryInterface.addIndex('users', ['tenant_id']);
    await queryInterface.addIndex('products', ['tenant_id']);
    await queryInterface.addIndex('clients', ['tenant_id']);
    await queryInterface.addIndex('sales', ['tenant_id']);
    await queryInterface.addIndex('suppliers', ['tenant_id']);

    logger.info('✅ Índices criados');

    logger.info('🎉 Migração multi-tenant concluída com sucesso!');
    logger.info('');
    logger.info('Próximos passos:');
    logger.info('1. Criar um tenant de teste');
    logger.info('2. Atualizar usuários existentes com tenant_id');
    logger.info('3. Atualizar produtos/clientes/vendas com tenant_id');

  } catch (error) {
    logger.error('❌ Erro na migração:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar migração
addMultiTenantSupport()
  .then(() => {
    console.log('Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro na migração:', error);
    process.exit(1);
  });
