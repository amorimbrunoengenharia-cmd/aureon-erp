import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sequelize from '../config/database.js';
import models from '../models/index.js';
import logger from '../utils/logger.js';
import emailService from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Garante que o diretório de backups existe
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('📁 Diretório de backups criado');
    }
  }

  /**
   * Gera nome de arquivo de backup com timestamp
   */
  generateBackupFilename(prefix = 'backup') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${timestamp}.json`;
  }

  /**
   * Exporta todos os dados do banco de dados
   */
  async createFullBackup(options = {}) {
    const startTime = Date.now();
    logger.info('🔄 Iniciando backup completo do banco de dados');

    try {
      const backup = {
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          database_type: process.env.USE_POSTGRES === 'true' ? 'postgresql' : 'sqlite'
        },
        data: {}
      };

      // Ordem de exportação (respeitando foreign keys)
      const exportOrder = [
        'User',
        'Supplier',
        'Product',
        'Client',
        'Prescription',
        'Sale',
        'StockMovement',
        'FinanceTransaction',
        'Event',
        'AuditLog'
      ];

      // Exportar cada model
      for (const modelName of exportOrder) {
        const Model = models[modelName];
        if (!Model) {
          logger.warn(`⚠️ Model ${modelName} não encontrado, pulando...`);
          continue;
        }

        try {
          const data = await Model.findAll({
            raw: true,
            nest: false
          });

          backup.data[modelName] = data;
          logger.info(`✅ ${modelName}: ${data.length} registros exportados`);
        } catch (error) {
          logger.error(`❌ Erro ao exportar ${modelName}:`, error);
          throw error;
        }
      }

      // Calcular estatísticas
      const totalRecords = Object.values(backup.data).reduce(
        (sum, data) => sum + data.length,
        0
      );

      backup.metadata.total_records = totalRecords;
      backup.metadata.tables = Object.keys(backup.data).length;
      backup.metadata.duration_ms = Date.now() - startTime;

      // Salvar backup em arquivo
      const filename = this.generateBackupFilename('full');
      const filepath = path.join(this.backupDir, filename);

      await fs.promises.writeFile(
        filepath,
        JSON.stringify(backup, null, 2),
        'utf8'
      );

      const fileSize = fs.statSync(filepath).size;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

      logger.info(`✅ Backup completo criado: ${filename}`);
      logger.info(`📊 Total de registros: ${totalRecords}`);
      logger.info(`💾 Tamanho do arquivo: ${fileSizeMB} MB`);
      logger.info(`⏱️ Tempo de execução: ${backup.metadata.duration_ms}ms`);

      const result = {
        success: true,
        filename,
        filepath,
        metadata: backup.metadata,
        size_bytes: fileSize,
        size_mb: fileSizeMB
      };

      // Send backup notification email to CEOs
      try {
        const { User } = models;
        const ceoUsers = await User.findAll({
          where: { role: 'CEO', active: true },
          attributes: ['email']
        });

        for (const ceo of ceoUsers) {
          if (ceo.email) {
            await emailService.sendBackupNotification(result, ceo.email);
          }
        }

        logger.info(`Backup notification emails sent to ${ceoUsers.length} CEOs`);
      } catch (emailError) {
        logger.error('Failed to send backup notification emails:', emailError);
      }

      return result;
    } catch (error) {
      logger.error('❌ Erro ao criar backup:', error);
      throw error;
    }
  }

  /**
   * Restaura backup completo
   */
  async restoreFullBackup(filename, options = {}) {
    const startTime = Date.now();
    logger.info(`🔄 Iniciando restore do backup: ${filename}`);

    try {
      const filepath = path.join(this.backupDir, filename);

      // Verificar se arquivo existe
      if (!fs.existsSync(filepath)) {
        throw new Error(`Arquivo de backup não encontrado: ${filename}`);
      }

      // Ler backup
      const backupContent = await fs.promises.readFile(filepath, 'utf8');
      const backup = JSON.parse(backupContent);

      logger.info(`📋 Backup criado em: ${backup.metadata.created_at}`);
      logger.info(`📊 Total de registros: ${backup.metadata.total_records}`);

      // Confirmar se deve limpar dados existentes
      if (options.clearExisting !== false) {
        logger.warn('⚠️ Limpando dados existentes...');
        await this.clearAllData();
      }

      // Ordem de importação (respeitando foreign keys)
      const importOrder = [
        'User',
        'Supplier',
        'Product',
        'Client',
        'Prescription',
        'Sale',
        'StockMovement',
        'FinanceTransaction',
        'Event',
        'AuditLog'
      ];

      let totalImported = 0;

      // Importar cada model
      for (const modelName of importOrder) {
        const Model = models[modelName];
        const data = backup.data[modelName];

        if (!Model || !data || data.length === 0) {
          logger.info(`⏭️ ${modelName}: sem dados para importar`);
          continue;
        }

        try {
          // Importar em batches para melhor performance
          const batchSize = 100;
          let imported = 0;

          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            await Model.bulkCreate(batch, {
              validate: false,
              hooks: false,
              ignoreDuplicates: options.ignoreDuplicates || false
            });
            imported += batch.length;
          }

          totalImported += imported;
          logger.info(`✅ ${modelName}: ${imported} registros importados`);
        } catch (error) {
          logger.error(`❌ Erro ao importar ${modelName}:`, error);
          if (!options.continueOnError) {
            throw error;
          }
        }
      }

      const duration = Date.now() - startTime;

      logger.info(`✅ Restore concluído com sucesso!`);
      logger.info(`📊 Total de registros importados: ${totalImported}`);
      logger.info(`⏱️ Tempo de execução: ${duration}ms`);

      return {
        success: true,
        filename,
        total_imported: totalImported,
        duration_ms: duration
      };
    } catch (error) {
      logger.error('❌ Erro ao restaurar backup:', error);
      throw error;
    }
  }

  /**
   * Limpa todos os dados do banco
   */
  async clearAllData() {
    try {
      // Ordem inversa para respeitar foreign keys
      const clearOrder = [
        'AuditLog',
        'Event',
        'FinanceTransaction',
        'StockMovement',
        'Sale',
        'Prescription',
        'Client',
        'Product',
        'Supplier',
        'User'
      ];

      for (const modelName of clearOrder) {
        const Model = models[modelName];
        if (Model) {
          await Model.destroy({ where: {}, truncate: true });
          logger.info(`🗑️ ${modelName}: dados removidos`);
        }
      }

      logger.info('✅ Todos os dados foram removidos');
    } catch (error) {
      logger.error('❌ Erro ao limpar dados:', error);
      throw error;
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups() {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.endsWith('.json'));

      const backups = await Promise.all(
        backupFiles.map(async (filename) => {
          const filepath = path.join(this.backupDir, filename);
          const stats = await fs.promises.stat(filepath);
          
          // Tentar ler metadata
          let metadata = null;
          try {
            const content = await fs.promises.readFile(filepath, 'utf8');
            const backup = JSON.parse(content);
            metadata = backup.metadata;
          } catch (error) {
            logger.warn(`⚠️ Não foi possível ler metadata de ${filename}`);
          }

          return {
            filename,
            filepath,
            size_bytes: stats.size,
            size_mb: (stats.size / 1024 / 1024).toFixed(2),
            created_at: stats.birthtime,
            modified_at: stats.mtime,
            metadata
          };
        })
      );

      // Ordenar por data de criação (mais recente primeiro)
      backups.sort((a, b) => b.created_at - a.created_at);

      return backups;
    } catch (error) {
      logger.error('❌ Erro ao listar backups:', error);
      throw error;
    }
  }

  /**
   * Remove backup antigo
   */
  async deleteBackup(filename) {
    try {
      const filepath = path.join(this.backupDir, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error(`Backup não encontrado: ${filename}`);
      }

      await fs.promises.unlink(filepath);
      logger.info(`🗑️ Backup removido: ${filename}`);

      return { success: true, filename };
    } catch (error) {
      logger.error('❌ Erro ao remover backup:', error);
      throw error;
    }
  }

  /**
   * Remove backups antigos (manter apenas N mais recentes)
   */
  async cleanupOldBackups(keepCount = 10) {
    try {
      const backups = await this.listBackups();

      if (backups.length <= keepCount) {
        logger.info(`✅ Apenas ${backups.length} backups, nenhum será removido`);
        return { removed: 0, kept: backups.length };
      }

      const toRemove = backups.slice(keepCount);
      let removed = 0;

      for (const backup of toRemove) {
        try {
          await this.deleteBackup(backup.filename);
          removed++;
        } catch (error) {
          logger.error(`❌ Erro ao remover ${backup.filename}:`, error);
        }
      }

      logger.info(`✅ ${removed} backups antigos removidos, ${keepCount} mantidos`);

      return { removed, kept: keepCount };
    } catch (error) {
      logger.error('❌ Erro ao limpar backups antigos:', error);
      throw error;
    }
  }

  /**
   * Cria backup incremental (apenas eventos recentes)
   */
  async createIncrementalBackup(since) {
    const startTime = Date.now();
    logger.info(`🔄 Criando backup incremental desde ${since}`);

    try {
      const backup = {
        metadata: {
          version: '1.0.0',
          type: 'incremental',
          created_at: new Date().toISOString(),
          since: since
        },
        data: {}
      };

      // Exportar apenas dados modificados
      const sinceDate = new Date(since);

      // Events
      const events = await models.Event.findAll({
        where: {
          created_at: { [sequelize.Sequelize.Op.gte]: sinceDate }
        },
        raw: true
      });

      // Sales
      const sales = await models.Sale.findAll({
        where: {
          data_venda: { [sequelize.Sequelize.Op.gte]: sinceDate }
        },
        raw: true
      });

      // AuditLogs
      const auditLogs = await models.AuditLog.findAll({
        where: {
          created_at: { [sequelize.Sequelize.Op.gte]: sinceDate }
        },
        raw: true
      });

      backup.data = {
        Event: events,
        Sale: sales,
        AuditLog: auditLogs
      };

      const totalRecords = events.length + sales.length + auditLogs.length;
      backup.metadata.total_records = totalRecords;
      backup.metadata.duration_ms = Date.now() - startTime;

      // Salvar
      const filename = this.generateBackupFilename('incremental');
      const filepath = path.join(this.backupDir, filename);

      await fs.promises.writeFile(
        filepath,
        JSON.stringify(backup, null, 2),
        'utf8'
      );

      logger.info(`✅ Backup incremental criado: ${filename}`);
      logger.info(`📊 Total de registros: ${totalRecords}`);

      return {
        success: true,
        filename,
        filepath,
        metadata: backup.metadata
      };
    } catch (error) {
      logger.error('❌ Erro ao criar backup incremental:', error);
      throw error;
    }
  }
}

export default new BackupService();
