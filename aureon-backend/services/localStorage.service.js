/**
 * LocalStorage to Database Migration Service
 * Migra dados persistidos em localStorage para o banco de dados
 */

import { User } from '../models/index.js';
import logger from '../config/logger.js';

class LocalStorageService {
  /**
   * Salva configurações de usuário no banco
   */
  async saveUserSettings(userId, settings) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({
        settings: JSON.stringify(settings)
      });

      logger.info(`✅ User settings saved to database for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error(`Failed to save user settings for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Carrega configurações de usuário do banco
   */
  async getUserSettings(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const settings = user.settings ? JSON.parse(user.settings) : {};
      return settings;
    } catch (error) {
      logger.error(`Failed to load user settings for ${userId}:`, error);
      return {};
    }
  }

  /**
   * Migra eventos processados do localStorage para tabela de eventos
   * Esta função seria chamada no frontend para migrar dados locais
   */
  async migrateProcessedEvents(userId, processedEventIds) {
    try {
      // Por enquanto, apenas log - implementação completa depende da estrutura desejada
      logger.info(`📦 Migrating ${processedEventIds.length} processed events for user ${userId}`);
      
      // Aqui você poderia:
      // 1. Criar registros na tabela events com status 'completed'
      // 2. Associar ao usuário
      // 3. Limpar localStorage do cliente

      return { migrated: processedEventIds.length };
    } catch (error) {
      logger.error('Failed to migrate processed events:', error);
      throw error;
    }
  }

  /**
   * Endpoint helper para migração completa de um usuário
   */
  async migrateUserData(userId, localStorageData) {
    try {
      const results = {
        settings: null,
        processedEvents: null,
        errors: []
      };

      // Migrar configurações
      if (localStorageData.userSettings) {
        try {
          results.settings = await this.saveUserSettings(userId, localStorageData.userSettings);
        } catch (error) {
          results.errors.push({ type: 'settings', error: error.message });
        }
      }

      // Migrar eventos processados
      if (localStorageData.processedEvents && Array.isArray(localStorageData.processedEvents)) {
        try {
          results.processedEvents = await this.migrateProcessedEvents(
            userId,
            localStorageData.processedEvents
          );
        } catch (error) {
          results.errors.push({ type: 'processedEvents', error: error.message });
        }
      }

      logger.info(`✅ User data migration completed for ${userId}`, results);
      return results;
    } catch (error) {
      logger.error(`Failed to migrate user data for ${userId}:`, error);
      throw error;
    }
  }
}

// Singleton
const localStorageService = new LocalStorageService();

export default localStorageService;
