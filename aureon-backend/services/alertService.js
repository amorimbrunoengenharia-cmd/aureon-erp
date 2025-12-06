/**
 * Alert Service - Sistema de Alertas Inteligente
 * 
 * Monitora:
 * - Estoque baixo
 * - Produtos sem movimento (parados)
 * - Produtos próximos ao vencimento
 * - Metas não atingidas
 * - Clientes inativos
 * - Fornecedores atrasados
 */

import models from '../models/index.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import emailService from './emailService.js';

class AlertService {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      lowStock: 10,
      noMovementDays: 90,
      expiringDays: 30,
      inactiveCustomerDays: 180,
      delayedSupplierDays: 15
    };
  }

  /**
   * Executar todas as verificações de alertas
   */
  async runAllChecks() {
    logger.info('🔍 Iniciando verificação de alertas');
    
    this.alerts = [];
    
    try {
      await Promise.all([
        this.checkLowStock(),
        this.checkNoMovementProducts(),
        this.checkInactiveCustomers(),
        this.checkPendingPayments()
      ]);

      logger.info(`✅ Verificação concluída: ${this.alerts.length} alertas encontrados`);
      
      return {
        success: true,
        alertCount: this.alerts.length,
        alerts: this.alerts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Erro ao executar verificações de alertas', error);
      throw error;
    }
  }

  /**
   * Verificar produtos com estoque baixo
   */
  async checkLowStock() {
    try {
      const { Product } = models;
      
      const lowStockProducts = await Product.findAll({
        where: {
          estoque: {
            [Op.lte]: this.thresholds.lowStock
          },
          active: true
        },
        attributes: ['id', 'nome', 'sku', 'estoque', 'tipo', 'categoria']
      });

      lowStockProducts.forEach(product => {
        this.alerts.push({
          type: 'LOW_STOCK',
          severity: product.estoque === 0 ? 'critical' : 'high',
          title: 'Estoque Baixo',
          message: `Produto "${product.nome}" está com estoque de ${product.estoque} unidades`,
          resourceType: 'product',
          resourceId: product.id,
          data: {
            productName: product.nome,
            sku: product.sku,
            currentStock: product.estoque,
            threshold: this.thresholds.lowStock
          },
          createdAt: new Date()
        });
      });

      logger.info(`📦 Estoque baixo: ${lowStockProducts.length} produtos encontrados`);

      // Send email alert if there are critical low stock products
      if (lowStockProducts.length > 0) {
        try {
          // Get CEO users to send alert
          const { User } = models;
          const ceoUsers = await User.findAll({
            where: { role: 'CEO', active: true },
            attributes: ['email']
          });

          const products = lowStockProducts.map(p => ({
            name: p.nome,
            sku: p.sku,
            currentStock: p.estoque,
            threshold: this.thresholds.lowStock
          }));

          for (const ceo of ceoUsers) {
            if (ceo.email) {
              await emailService.sendLowStockAlert(products, ceo.email);
            }
          }

          logger.info(`Low stock alert emails sent to ${ceoUsers.length} CEOs`);
        } catch (emailError) {
          logger.error('Failed to send low stock alert emails:', emailError);
        }
      }
    } catch (error) {
      logger.error('Erro ao verificar estoque baixo', error);
    }
  }

  /**
   * Verificar produtos sem movimento (parados)
   */
  async checkNoMovementProducts() {
    try {
      const { Product, StockMovement } = models;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.thresholds.noMovementDays);

      // Buscar produtos que não tiveram movimentação nos últimos X dias
      const products = await Product.findAll({
        where: {
          active: true,
          estoque: {
            [Op.gt]: 0
          }
        },
        include: [{
          model: StockMovement,
          as: 'stock_movements',
          required: false,
          where: {
            data: {
              [Op.gte]: cutoffDate
            }
          }
        }]
      });

      // Filtrar produtos sem movimento recente
      const noMovementProducts = products.filter(p => 
        !p.stock_movements || p.stock_movements.length === 0
      );

      noMovementProducts.forEach(product => {
        this.alerts.push({
          type: 'NO_MOVEMENT',
          severity: 'medium',
          title: 'Produto Parado',
          message: `Produto "${product.nome}" sem movimentação há ${this.thresholds.noMovementDays} dias`,
          resourceType: 'product',
          resourceId: product.id,
          data: {
            productName: product.nome,
            sku: product.sku,
            currentStock: product.estoque,
            daysSinceLastMovement: this.thresholds.noMovementDays
          },
          createdAt: new Date()
        });
      });

      logger.info(`⏸️  Produtos parados: ${noMovementProducts.length} encontrados`);
    } catch (error) {
      logger.error('Erro ao verificar produtos parados', error);
    }
  }

  /**
   * Verificar clientes inativos
   */
  async checkInactiveCustomers() {
    try {
      const { Client, Sale } = models;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.thresholds.inactiveCustomerDays);

      const clients = await Client.findAll({
        where: {
          active: true,
          ultima_compra: {
            [Op.lt]: cutoffDate
          }
        },
        attributes: ['id', 'nome', 'email', 'telefone', 'ultima_compra', 'total_compras']
      });

      clients.forEach(client => {
        const daysSinceLastPurchase = Math.floor(
          (new Date() - new Date(client.ultima_compra)) / (1000 * 60 * 60 * 24)
        );

        this.alerts.push({
          type: 'INACTIVE_CUSTOMER',
          severity: 'low',
          title: 'Cliente Inativo',
          message: `Cliente "${client.nome}" sem compras há ${daysSinceLastPurchase} dias`,
          resourceType: 'client',
          resourceId: client.id,
          data: {
            customerName: client.nome,
            email: client.email,
            daysSinceLastPurchase,
            totalPurchases: client.total_compras || 0
          },
          createdAt: new Date()
        });
      });

      logger.info(`😴 Clientes inativos: ${clients.length} encontrados`);
    } catch (error) {
      logger.error('Erro ao verificar clientes inativos', error);
    }
  }

  /**
   * Verificar pagamentos pendentes/atrasados
   */
  async checkPendingPayments() {
    try {
      const { FinanceTransaction } = models;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overduePayments = await FinanceTransaction.findAll({
        where: {
          tipo: 'DESPESA',
          status: 'pending',
          data_vencimento: {
            [Op.lt]: today
          }
        },
        include: [
          { association: 'supplier', attributes: ['id', 'nome'] },
          { association: 'client', attributes: ['id', 'nome'] }
        ]
      });

      overduePayments.forEach(payment => {
        const daysOverdue = Math.floor(
          (today - new Date(payment.data_vencimento)) / (1000 * 60 * 60 * 24)
        );

        const relatedName = payment.supplier?.nome || payment.client?.nome || 'Não especificado';

        this.alerts.push({
          type: 'OVERDUE_PAYMENT',
          severity: daysOverdue > 30 ? 'critical' : 'high',
          title: 'Pagamento Atrasado',
          message: `Pagamento de R$ ${payment.valor.toFixed(2)} para "${relatedName}" atrasado há ${daysOverdue} dias`,
          resourceType: 'finance_transaction',
          resourceId: payment.id,
          data: {
            amount: payment.valor,
            dueDate: payment.data_vencimento,
            daysOverdue,
            relatedName,
            description: payment.descricao
          },
          createdAt: new Date()
        });
      });

      logger.info(`💰 Pagamentos atrasados: ${overduePayments.length} encontrados`);
    } catch (error) {
      logger.error('Erro ao verificar pagamentos atrasados', error);
    }
  }

  /**
   * Obter alertas por severidade
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Obter alertas por tipo
   */
  getAlertsByType(type) {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Obter resumo de alertas
   */
  getSummary() {
    return {
      total: this.alerts.length,
      critical: this.getAlertsBySeverity('critical').length,
      high: this.getAlertsBySeverity('high').length,
      medium: this.getAlertsBySeverity('medium').length,
      low: this.getAlertsBySeverity('low').length,
      byType: {
        lowStock: this.getAlertsByType('LOW_STOCK').length,
        noMovement: this.getAlertsByType('NO_MOVEMENT').length,
        inactiveCustomers: this.getAlertsByType('INACTIVE_CUSTOMER').length,
        overduePayments: this.getAlertsByType('OVERDUE_PAYMENT').length
      }
    };
  }

  /**
   * Configurar thresholds customizados
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('⚙️  Thresholds atualizados', this.thresholds);
  }
}

const alertService = new AlertService();
export default alertService;
