import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

async function migrateAuditMethod() {
  try {
    logger.info('🔧 Iniciando migração: adicionar colunas na tabela audit_logs...');

    // Check if columns exist
    const [results] = await sequelize.query(
      "PRAGMA table_info(audit_logs);"
    );

    const methodColumnExists = results.some(col => col.name === 'method');
    const pathColumnExists = results.some(col => col.name === 'path');
    const statusCodeColumnExists = results.some(col => col.name === 'status_code');
    const requestBodyColumnExists = results.some(col => col.name === 'request_body');
    const responseBodyColumnExists = results.some(col => col.name === 'response_body');
    const queryParamsColumnExists = results.some(col => col.name === 'query_params');

    // Add method column
    if (methodColumnExists) {
      logger.info('✅ Coluna "method" já existe');
    } else {
      logger.info('📝 Adicionando coluna "method"...');
      await sequelize.query(`ALTER TABLE audit_logs ADD COLUMN method VARCHAR(10);`);
      logger.info('✅ Coluna "method" adicionada!');
    }

    // Add path column
    if (pathColumnExists) {
      logger.info('✅ Coluna "path" já existe');
    } else {
      logger.info('📝 Adicionando coluna "path"...');
      await sequelize.query(`ALTER TABLE audit_logs ADD COLUMN path VARCHAR(500);`);
      logger.info('✅ Coluna "path" adicionada!');
    }

    // Add status_code column
    if (statusCodeColumnExists) {
      logger.info('✅ Coluna "status_code" já existe');
    } else {
      logger.info('📝 Adicionando coluna "status_code"...');
      await sequelize.query(`ALTER TABLE audit_logs ADD COLUMN status_code INTEGER;`);
      logger.info('✅ Coluna "status_code" adicionada!');
    }

    // Add request_body column
    if (requestBodyColumnExists) {
      logger.info('✅ Coluna "request_body" já existe');
    } else {
      logger.info('📝 Adicionando coluna "request_body"...');
      await sequelize.query(`ALTER TABLE audit_logs ADD COLUMN request_body TEXT;`);
      logger.info('✅ Coluna "request_body" adicionada!');
    }

    // Add response_body column
    if (responseBodyColumnExists) {
      logger.info('✅ Coluna "response_body" já existe');
    } else {
      logger.info('📝 Adicionando coluna "response_body"...');
      await sequelize.query(`ALTER TABLE audit_logs ADD COLUMN response_body TEXT;`);
      logger.info('✅ Coluna "response_body" adicionada!');
    }

    // Add query_params column
    if (queryParamsColumnExists) {
      logger.info('✅ Coluna "query_params" já existe');
    } else {
      logger.info('📝 Adicionando coluna "query_params"...');
      await sequelize.query(`ALTER TABLE audit_logs ADD COLUMN query_params TEXT;`);
      logger.info('✅ Coluna "query_params" adicionada!');
    }

    logger.info('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrateAuditMethod();
