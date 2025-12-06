import backupService from '../services/backupService.js';
import logger from '../utils/logger.js';

/**
 * Script para criar backup automático do banco de dados
 * 
 * Uso:
 *   node scripts/runBackup.js
 * 
 * Configurar no cron:
 *   # Backup diário às 2h da manhã
 *   0 2 * * * cd /path/to/aureon-backend && node scripts/runBackup.js
 * 
 *   # Backup a cada 6 horas
 *   0 */6 * * * cd /path/to/aureon-backend && node scripts/runBackup.js
 */

async function main() {
  try {
    logger.info('═══════════════════════════════════════════════');
    logger.info('🚀 Iniciando backup automático');
    logger.info('═══════════════════════════════════════════════');

    // Criar backup completo
    const result = await backupService.createFullBackup();

    logger.info('');
    logger.info('📊 Estatísticas do Backup:');
    logger.info(`   ✓ Arquivo: ${result.filename}`);
    logger.info(`   ✓ Tamanho: ${result.size_mb} MB`);
    logger.info(`   ✓ Registros: ${result.metadata.total_records}`);
    logger.info(`   ✓ Tabelas: ${result.metadata.tables}`);
    logger.info(`   ✓ Duração: ${result.metadata.duration_ms}ms`);
    logger.info('');

    // Limpar backups antigos (manter últimos 10)
    logger.info('🧹 Limpando backups antigos...');
    const cleanup = await backupService.cleanupOldBackups(10);
    
    if (cleanup.removed > 0) {
      logger.info(`   ✓ ${cleanup.removed} backups antigos removidos`);
      logger.info(`   ✓ ${cleanup.kept} backups mantidos`);
    } else {
      logger.info('   ✓ Nenhum backup foi removido');
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════');
    logger.info('✅ Backup concluído com sucesso!');
    logger.info('═══════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    logger.error('═══════════════════════════════════════════════');
    logger.error('❌ ERRO ao executar backup:');
    logger.error('═══════════════════════════════════════════════');
    logger.error(error);
    logger.error('');
    
    process.exit(1);
  }
}

// Executar
main();
