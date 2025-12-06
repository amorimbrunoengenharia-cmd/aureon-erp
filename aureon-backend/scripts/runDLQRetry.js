/**
 * Script Cron: DLQ Retry Automático
 * 
 * Executa retry automático de eventos na Dead Letter Queue
 * 
 * Uso:
 * - node scripts/runDLQRetry.js
 * 
 * Cron job sugerido (a cada 15 minutos):
 * */15 * * * * cd /path/to/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
 * 
 * Ou para executar apenas em horários de baixo movimento (6h-22h):
 * */15 6-22 * * * cd /path/to/aureon-backend && NODE_ENV=production node scripts/runDLQRetry.js >> logs/dlq-retry.log 2>&1
 */

import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import dlqRetryService from '../services/dlqRetryService.js';
import models from '../models/index.js';

// Carregar variáveis de ambiente
dotenv.config();

async function main() {
  try {
    logger.info('🚀 Iniciando script de DLQ retry');

    // Executar retry automático
    await dlqRetryService.runAutomatedRetry();

    // Obter estatísticas
    const stats = dlqRetryService.getStats();
    
    logger.info('📊 Estatísticas do retry', stats);

    // Obter estatísticas da DLQ atual
    const { Event } = models;
    const dlqCount = await Event.count({ where: { status: 'dlq' } });
    const failedCount = await Event.count({ where: { status: 'failed' } });
    
    logger.info('📋 Status atual da fila', {
      dlq_count: dlqCount,
      failed_count: failedCount,
      total_pending: dlqCount + failedCount
    });

    // Alerta se DLQ estiver muito grande
    if (dlqCount > 100) {
      logger.warn('⚠️  DLQ está muito grande', {
        dlq_count: dlqCount,
        threshold: 100
      });
    }

    // Fechar conexão
    await models.sequelize.close();
    
    logger.info('✅ Script DLQ retry concluído com sucesso');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erro fatal no script DLQ retry', {
      error: error.message,
      stack: error.stack
    });
    
    // Tentar fechar conexão
    try {
      await models.sequelize.close();
    } catch (e) {
      // Ignorar erro ao fechar
    }
    
    process.exit(1);
  }
}

// Executar
main();
