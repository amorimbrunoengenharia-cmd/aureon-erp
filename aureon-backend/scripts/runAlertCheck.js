/**
 * Script Cron: Verificação Automática de Alertas
 * 
 * Executa verificações de alertas do sistema periodicamente
 * 
 * Uso:
 * - node scripts/runAlertCheck.js
 * 
 * Cron job sugerido (a cada hora):
 * 0 * * * * cd /path/to/aureon-backend && NODE_ENV=production node scripts/runAlertCheck.js >> logs/alerts.log 2>&1
 * 
 * Ou durante horário comercial (8h-18h):
 * 0 8-18 * * * cd /path/to/aureon-backend && NODE_ENV=production node scripts/runAlertCheck.js >> logs/alerts.log 2>&1
 */

import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import alertService from '../services/alertService.js';
import models from '../models/index.js';

// Carregar variáveis de ambiente
dotenv.config();

async function main() {
  try {
    logger.info('🔍 Iniciando verificação automática de alertas');

    // Executar verificações
    const result = await alertService.runAllChecks();
    
    const summary = alertService.getSummary();
    
    logger.info('📊 Verificação de alertas concluída', {
      total: summary.total,
      critical: summary.critical,
      high: summary.high,
      medium: summary.medium,
      low: summary.low
    });

    // Log alertas críticos separadamente
    const criticalAlerts = alertService.getAlertsBySeverity('critical');
    if (criticalAlerts.length > 0) {
      logger.warn('⚠️  ALERTAS CRÍTICOS ENCONTRADOS:', {
        count: criticalAlerts.length,
        alerts: criticalAlerts.map(a => ({
          type: a.type,
          message: a.message
        }))
      });
    }

    // Log alertas de estoque baixo
    const lowStockAlerts = alertService.getAlertsByType('LOW_STOCK');
    if (lowStockAlerts.length > 0) {
      logger.info('📦 Alertas de estoque baixo:', {
        count: lowStockAlerts.length,
        products: lowStockAlerts.map(a => a.data.productName)
      });
    }

    // Log pagamentos atrasados
    const overduePayments = alertService.getAlertsByType('OVERDUE_PAYMENT');
    if (overduePayments.length > 0) {
      logger.warn('💰 Pagamentos atrasados:', {
        count: overduePayments.length,
        total_amount: overduePayments.reduce((sum, a) => sum + (a.data.amount || 0), 0)
      });
    }

    // Fechar conexão
    await models.sequelize.close();
    
    logger.info('✅ Script de verificação de alertas concluído com sucesso');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Erro fatal no script de alertas', {
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
