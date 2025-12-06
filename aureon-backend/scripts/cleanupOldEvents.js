/**
 * Script de limpeza de eventos antigos
 * Remove eventos do banco de dados com mais de X dias
 * 
 * Uso:
 * - node scripts/cleanupOldEvents.js [dias]
 * - Padrão: 90 dias
 * 
 * Cron job sugerido (diariamente às 3h):
 * 0 3 * * * cd /path/to/aureon-backend && NODE_ENV=production node scripts/cleanupOldEvents.js >> logs/cleanup.log 2>&1
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import models from '../models/index.js';
import logger from '../utils/logger.js';

// Carregar variáveis de ambiente
dotenv.config();

const { Event, AuditLog } = models;

/**
 * Limpar eventos antigos
 */
async function cleanupOldEvents(retentionDays = 90) {
  try {
    logger.info(`Iniciando limpeza de eventos antigos (retenção: ${retentionDays} dias)`);

    // Calcular data de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Contar eventos antes da limpeza
    const totalEventsBefore = await Event.count();
    const oldEventsCount = await Event.count({
      where: {
        created_at: {
          [Sequelize.Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Total de eventos no banco: ${totalEventsBefore}`);
    logger.info(`Eventos a serem removidos: ${oldEventsCount}`);

    if (oldEventsCount === 0) {
      logger.info('Nenhum evento antigo para remover');
      return {
        removed: 0,
        remaining: totalEventsBefore,
        cutoffDate: cutoffDate.toISOString()
      };
    }

    // Remover eventos antigos
    const deleted = await Event.destroy({
      where: {
        created_at: {
          [Sequelize.Op.lt]: cutoffDate
        },
        status: {
          [Sequelize.Op.notIn]: ['pending', 'dlq'] // Preservar eventos pendentes e DLQ
        }
      }
    });

    const totalEventsAfter = await Event.count();

    logger.info(`✅ Limpeza concluída`, {
      removed: deleted,
      remaining: totalEventsAfter,
      cutoff_date: cutoffDate.toISOString(),
      retention_days: retentionDays
    });

    // Registrar no audit log
    await AuditLog.create({
      user_id: null, // Sistema
      action: 'CLEANUP',
      resource_type: 'events',
      resource_id: null,
      details: {
        removed: deleted,
        remaining: totalEventsAfter,
        cutoff_date: cutoffDate.toISOString(),
        retention_days: retentionDays
      },
      ip_address: '127.0.0.1',
      user_agent: 'cleanup-script'
    });

    return {
      removed: deleted,
      remaining: totalEventsAfter,
      cutoffDate: cutoffDate.toISOString()
    };

  } catch (error) {
    logger.error('Erro ao limpar eventos antigos', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Limpar audit logs antigos
 */
async function cleanupOldAuditLogs(retentionDays = 365) {
  try {
    logger.info(`Iniciando limpeza de audit logs antigos (retenção: ${retentionDays} dias)`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const totalBefore = await AuditLog.count();
    const oldLogsCount = await AuditLog.count({
      where: {
        created_at: {
          [Sequelize.Op.lt]: cutoffDate
        }
      }
    });

    logger.info(`Total de audit logs: ${totalBefore}`);
    logger.info(`Audit logs a serem removidos: ${oldLogsCount}`);

    if (oldLogsCount === 0) {
      logger.info('Nenhum audit log antigo para remover');
      return {
        removed: 0,
        remaining: totalBefore,
        cutoffDate: cutoffDate.toISOString()
      };
    }

    const deleted = await AuditLog.destroy({
      where: {
        created_at: {
          [Sequelize.Op.lt]: cutoffDate
        }
      }
    });

    const totalAfter = await AuditLog.count();

    logger.info(`✅ Limpeza de audit logs concluída`, {
      removed: deleted,
      remaining: totalAfter,
      cutoff_date: cutoffDate.toISOString(),
      retention_days: retentionDays
    });

    return {
      removed: deleted,
      remaining: totalAfter,
      cutoffDate: cutoffDate.toISOString()
    };

  } catch (error) {
    logger.error('Erro ao limpar audit logs antigos', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  try {
    const retentionDays = parseInt(process.argv[2]) || 90;
    const auditRetentionDays = parseInt(process.argv[3]) || 365;

    logger.info('🧹 Iniciando processo de limpeza');

    // Limpar eventos
    const eventsResult = await cleanupOldEvents(retentionDays);
    
    // Limpar audit logs
    const auditResult = await cleanupOldAuditLogs(auditRetentionDays);

    // Otimizar banco de dados (SQLite)
    if (process.env.DB_DIALECT === 'sqlite' || !process.env.DB_DIALECT) {
      logger.info('Otimizando banco de dados SQLite...');
      await models.sequelize.query('VACUUM');
      logger.info('✅ Otimização concluída');
    }

    logger.info('🎉 Processo de limpeza finalizado', {
      events: eventsResult,
      audit_logs: auditResult
    });

    // Fechar conexão
    await models.sequelize.close();
    process.exit(0);

  } catch (error) {
    logger.error('Erro fatal no processo de limpeza', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupOldEvents, cleanupOldAuditLogs };
