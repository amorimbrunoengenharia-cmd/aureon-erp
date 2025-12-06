/**
 * Script de Migração: localStorage → Database
 * 
 * Este script importa dados do localStorage do frontend para o banco de dados.
 * 
 * Uso:
 * 1. Exportar dados do localStorage do navegador:
 *    - Abrir DevTools → Console
 *    - Executar: copy(JSON.stringify(localStorage))
 *    - Colar o conteúdo em data/localStorage_export.json
 * 
 * 2. Executar o script:
 *    npm run migrate:localStorage
 * 
 * Ou passar arquivo customizado:
 *    node scripts/migrateFromLocalStorage.js path/to/export.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import models from '../models/index.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Product, Client, Supplier, Sale, Prescription, FinanceTransaction, StockMovement } = models;

class LocalStorageMigration {
  constructor(filePath) {
    this.filePath = filePath;
    this.stats = {
      products: { success: 0, failed: 0, skipped: 0 },
      clients: { success: 0, failed: 0, skipped: 0 },
      suppliers: { success: 0, failed: 0, skipped: 0 },
      sales: { success: 0, failed: 0, skipped: 0 },
      prescriptions: { success: 0, failed: 0, skipped: 0 },
      finance: { success: 0, failed: 0, skipped: 0 },
      movements: { success: 0, failed: 0, skipped: 0 }
    };
    this.errors = [];
  }

  async loadData() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // localStorage pode vir como objeto direto ou stringificado
      this.localStorageData = typeof data === 'string' ? JSON.parse(data) : data;
      
      logger.info('✅ localStorage data loaded successfully');
      logger.info(`Keys found: ${Object.keys(this.localStorageData).join(', ')}`);
      
      return true;
    } catch (error) {
      logger.error(`❌ Failed to load data: ${error.message}`);
      return false;
    }
  }

  parseLocalStorageItem(key) {
    try {
      const item = this.localStorageData[key];
      if (!item) return null;
      
      return typeof item === 'string' ? JSON.parse(item) : item;
    } catch (error) {
      logger.warn(`⚠️ Failed to parse ${key}: ${error.message}`);
      return null;
    }
  }

  async migrateProducts() {
    console.log('\n📦 Migrating Products...');
    const products = this.parseLocalStorageItem('products') || 
                     this.parseLocalStorageItem('aureon_products') ||
                     [];

    for (const product of products) {
      try {
        // Check if already exists
        const existing = await Product.findOne({
          where: { sku: product.sku || product.id }
        });

        if (existing) {
          this.stats.products.skipped++;
          continue;
        }

        await Product.create({
          id: product.id,
          produto: product.produto || product.nome || product.name,
          tipo: product.tipo || 'outro',
          categoria: product.categoria,
          preco_venda: parseFloat(product.preco_venda || product.preco || 0),
          preco_custo: parseFloat(product.preco_custo || product.custo || 0),
          margem_lucro: parseFloat(product.margem_lucro || 0),
          quantidade_estoque: parseInt(product.quantidade_estoque || product.estoque || 0),
          estoque_minimo: parseInt(product.estoque_minimo || 5),
          sku: product.sku || product.id,
          fornecedor_id: product.fornecedor_id,
          active: product.active !== false,
          metadata: product.metadata || {},
          created_at: product.created_at || product.createdAt || new Date(),
          updated_at: product.updated_at || product.updatedAt || new Date()
        });

        this.stats.products.success++;
      } catch (error) {
        this.stats.products.failed++;
        this.errors.push({ type: 'Product', id: product.id, error: error.message });
        logger.error(`Failed to migrate product ${product.id}: ${error.message}`);
      }
    }

    console.log(`✅ Products: ${this.stats.products.success} migrated, ${this.stats.products.skipped} skipped, ${this.stats.products.failed} failed`);
  }

  async migrateClients() {
    console.log('\n👥 Migrating Clients...');
    const clients = this.parseLocalStorageItem('clients') || 
                    this.parseLocalStorageItem('aureon_clients') ||
                    this.parseLocalStorageItem('customers') ||
                    [];

    for (const client of clients) {
      try {
        const existing = await Client.findOne({
          where: { email: client.email }
        });

        if (existing) {
          this.stats.clients.skipped++;
          continue;
        }

        await Client.create({
          id: client.id,
          nome: client.nome || client.name,
          email: client.email,
          telefone: client.telefone || client.phone,
          whatsapp: client.whatsapp || client.telefone,
          cpf_cnpj: client.cpf_cnpj || client.cpf || client.cnpj,
          endereco: client.endereco || client.address || {},
          data_nascimento: client.data_nascimento || client.birthDate,
          categoria: client.categoria || 'regular',
          origem: client.origem || 'outro',
          tags: client.tags || [],
          total_compras: parseFloat(client.total_compras || 0),
          total_pedidos: parseInt(client.total_pedidos || 0),
          ultima_compra: client.ultima_compra || client.lastPurchase,
          score_rfm: parseInt(client.score_rfm || 0),
          active: client.active !== false,
          created_at: client.created_at || client.createdAt || new Date(),
          updated_at: client.updated_at || client.updatedAt || new Date()
        });

        this.stats.clients.success++;
      } catch (error) {
        this.stats.clients.failed++;
        this.errors.push({ type: 'Client', id: client.id, error: error.message });
        logger.error(`Failed to migrate client ${client.id}: ${error.message}`);
      }
    }

    console.log(`✅ Clients: ${this.stats.clients.success} migrated, ${this.stats.clients.skipped} skipped, ${this.stats.clients.failed} failed`);
  }

  async migrateSuppliers() {
    console.log('\n🏭 Migrating Suppliers...');
    const suppliers = this.parseLocalStorageItem('suppliers') || 
                      this.parseLocalStorageItem('aureon_suppliers') ||
                      this.parseLocalStorageItem('fornecedores') ||
                      [];

    for (const supplier of suppliers) {
      try {
        const existing = await Supplier.findOne({
          where: { cnpj: supplier.cnpj }
        });

        if (existing) {
          this.stats.suppliers.skipped++;
          continue;
        }

        await Supplier.create({
          id: supplier.id,
          nome: supplier.nome || supplier.name,
          razao_social: supplier.razao_social || supplier.nome,
          cnpj: supplier.cnpj,
          email: supplier.email,
          telefone: supplier.telefone || supplier.phone,
          whatsapp: supplier.whatsapp,
          endereco: supplier.endereco || supplier.address || {},
          categoria: supplier.categoria || 'geral',
          prazo_entrega_dias: parseInt(supplier.prazo_entrega_dias || 7),
          valor_minimo_pedido: parseFloat(supplier.valor_minimo_pedido || 0),
          condicoes_pagamento: supplier.condicoes_pagamento,
          contatos: supplier.contatos || [],
          avaliacao: parseFloat(supplier.avaliacao || 0),
          total_pedidos: parseInt(supplier.total_pedidos || 0),
          total_comprado: parseFloat(supplier.total_comprado || 0),
          ultima_compra: supplier.ultima_compra,
          active: supplier.active !== false,
          created_at: supplier.created_at || supplier.createdAt || new Date(),
          updated_at: supplier.updated_at || supplier.updatedAt || new Date()
        });

        this.stats.suppliers.success++;
      } catch (error) {
        this.stats.suppliers.failed++;
        this.errors.push({ type: 'Supplier', id: supplier.id, error: error.message });
        logger.error(`Failed to migrate supplier ${supplier.id}: ${error.message}`);
      }
    }

    console.log(`✅ Suppliers: ${this.stats.suppliers.success} migrated, ${this.stats.suppliers.skipped} skipped, ${this.stats.suppliers.failed} failed`);
  }

  async migrateSales() {
    console.log('\n💰 Migrating Sales...');
    const sales = this.parseLocalStorageItem('sales') || 
                  this.parseLocalStorageItem('aureon_sales') ||
                  this.parseLocalStorageItem('vendas') ||
                  [];

    for (const sale of sales) {
      try {
        const existing = await Sale.findByPk(sale.id);

        if (existing) {
          this.stats.sales.skipped++;
          continue;
        }

        await Sale.create({
          id: sale.id,
          produto: sale.produto || sale.product,
          produto_id: sale.produto_id || sale.productId,
          cliente: sale.cliente || sale.customer,
          cliente_id: sale.cliente_id || sale.customerId,
          prescription_id: sale.prescription_id || sale.prescriptionId,
          valor_venda: parseFloat(sale.valor_venda || sale.price || 0),
          valor_custo: parseFloat(sale.valor_custo || sale.cost || 0),
          lucro: parseFloat(sale.lucro || sale.profit || 0),
          margem: parseFloat(sale.margem || 0),
          quantidade: parseInt(sale.quantidade || 1),
          canal: sale.canal || 'outro',
          status: sale.status || 'confirmado',
          data_venda: sale.data_venda || sale.date || new Date(),
          data_entrega: sale.data_entrega || sale.deliveryDate,
          forma_pagamento: sale.forma_pagamento || sale.paymentMethod,
          parcelas: parseInt(sale.parcelas || 1),
          vendedor_id: sale.vendedor_id || sale.sellerId,
          vendedor: sale.vendedor || sale.seller,
          marketplace_order_id: sale.marketplace_order_id,
          created_at: sale.created_at || sale.createdAt || new Date(),
          updated_at: sale.updated_at || sale.updatedAt || new Date()
        });

        this.stats.sales.success++;
      } catch (error) {
        this.stats.sales.failed++;
        this.errors.push({ type: 'Sale', id: sale.id, error: error.message });
        logger.error(`Failed to migrate sale ${sale.id}: ${error.message}`);
      }
    }

    console.log(`✅ Sales: ${this.stats.sales.success} migrated, ${this.stats.sales.skipped} skipped, ${this.stats.sales.failed} failed`);
  }

  async migratePrescriptions() {
    console.log('\n📝 Migrating Prescriptions...');
    const prescriptions = this.parseLocalStorageItem('prescriptions') || 
                          this.parseLocalStorageItem('aureon_prescriptions') ||
                          this.parseLocalStorageItem('receitas') ||
                          [];

    for (const prescription of prescriptions) {
      try {
        const existing = await Prescription.findByPk(prescription.id);

        if (existing) {
          this.stats.prescriptions.skipped++;
          continue;
        }

        await Prescription.create({
          id: prescription.id,
          cliente_id: prescription.cliente_id || prescription.clientId,
          cliente_nome: prescription.cliente_nome || prescription.clientName,
          medico_nome: prescription.medico_nome || prescription.doctorName,
          medico_crm: prescription.medico_crm || prescription.doctorCRM,
          data_emissao: prescription.data_emissao || prescription.issueDate || new Date(),
          data_validade: prescription.data_validade || prescription.expiryDate,
          tipo_lente: prescription.tipo_lente || 'visao-simples',
          olho_direito: prescription.olho_direito || prescription.rightEye || {},
          olho_esquerdo: prescription.olho_esquerdo || prescription.leftEye || {},
          observacoes: prescription.observacoes || prescription.notes,
          status: prescription.status || 'ativa',
          pedidos_associados: prescription.pedidos_associados || [],
          lgpd_consentimento: prescription.lgpd_consentimento !== false,
          lgpd_consentimento_data: prescription.lgpd_consentimento_data || new Date(),
          attachment_base64: prescription.attachment_base64,
          attachment_filename: prescription.attachment_filename,
          created_by: prescription.created_by,
          updated_by: prescription.updated_by,
          created_at: prescription.created_at || prescription.createdAt || new Date(),
          updated_at: prescription.updated_at || prescription.updatedAt || new Date()
        });

        this.stats.prescriptions.success++;
      } catch (error) {
        this.stats.prescriptions.failed++;
        this.errors.push({ type: 'Prescription', id: prescription.id, error: error.message });
        logger.error(`Failed to migrate prescription ${prescription.id}: ${error.message}`);
      }
    }

    console.log(`✅ Prescriptions: ${this.stats.prescriptions.success} migrated, ${this.stats.prescriptions.skipped} skipped, ${this.stats.prescriptions.failed} failed`);
  }

  async migrateFinance() {
    console.log('\n💵 Migrating Finance Transactions...');
    const transactions = this.parseLocalStorageItem('finance_transactions') || 
                         this.parseLocalStorageItem('aureon_finance') ||
                         this.parseLocalStorageItem('transacoes') ||
                         [];

    for (const transaction of transactions) {
      try {
        const existing = await FinanceTransaction.findByPk(transaction.id);

        if (existing) {
          this.stats.finance.skipped++;
          continue;
        }

        await FinanceTransaction.create({
          id: transaction.id,
          tipo: transaction.tipo || 'receita',
          categoria: transaction.categoria || 'outro',
          descricao: transaction.descricao || transaction.description,
          valor: parseFloat(transaction.valor || transaction.amount || 0),
          data: transaction.data || transaction.date || new Date(),
          status: transaction.status || 'pendente',
          forma_pagamento: transaction.forma_pagamento || transaction.paymentMethod,
          cliente_id: transaction.cliente_id || transaction.clientId,
          fornecedor_id: transaction.fornecedor_id || transaction.supplierId,
          sale_id: transaction.sale_id || transaction.saleId,
          conta_bancaria_id: transaction.conta_bancaria_id,
          comprovante_url: transaction.comprovante_url,
          recorrente: transaction.recorrente || false,
          recorrencia: transaction.recorrencia || null,
          parcelas: parseInt(transaction.parcelas || 1),
          parcela_atual: parseInt(transaction.parcela_atual || 1),
          responsavel_id: transaction.responsavel_id,
          responsavel: transaction.responsavel,
          created_at: transaction.created_at || transaction.createdAt || new Date(),
          updated_at: transaction.updated_at || transaction.updatedAt || new Date()
        });

        this.stats.finance.success++;
      } catch (error) {
        this.stats.finance.failed++;
        this.errors.push({ type: 'FinanceTransaction', id: transaction.id, error: error.message });
        logger.error(`Failed to migrate finance transaction ${transaction.id}: ${error.message}`);
      }
    }

    console.log(`✅ Finance: ${this.stats.finance.success} migrated, ${this.stats.finance.skipped} skipped, ${this.stats.finance.failed} failed`);
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION REPORT');
    console.log('='.repeat(60));

    const total = {
      success: 0,
      failed: 0,
      skipped: 0
    };

    for (const [resource, stats] of Object.entries(this.stats)) {
      console.log(`\n${resource.toUpperCase()}:`);
      console.log(`  ✅ Success: ${stats.success}`);
      console.log(`  ⏭️  Skipped: ${stats.skipped}`);
      console.log(`  ❌ Failed: ${stats.failed}`);
      
      total.success += stats.success;
      total.failed += stats.failed;
      total.skipped += stats.skipped;
    }

    console.log('\n' + '-'.repeat(60));
    console.log('TOTALS:');
    console.log(`  ✅ Total Success: ${total.success}`);
    console.log(`  ⏭️  Total Skipped: ${total.skipped}`);
    console.log(`  ❌ Total Failed: ${total.failed}`);
    console.log('='.repeat(60));

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.type} ${err.id}: ${err.error}`);
      });
    }
  }

  async saveReport() {
    const reportPath = path.join(__dirname, '../data/migration_report.json');
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors
    };

    try {
      await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${reportPath}`);
    } catch (error) {
      logger.error(`Failed to save report: ${error.message}`);
    }
  }

  async run() {
    console.log('🚀 Starting localStorage → Database Migration\n');
    
    const loaded = await this.loadData();
    if (!loaded) {
      console.log('❌ Migration aborted: Failed to load data');
      process.exit(1);
    }

    // Run migrations in order (respecting foreign keys)
    await this.migrateSuppliers();
    await this.migrateProducts();
    await this.migrateClients();
    await this.migratePrescriptions();
    await this.migrateSales();
    await this.migrateFinance();

    this.printReport();
    await this.saveReport();

    console.log('\n✅ Migration completed!\n');
  }
}

// Main execution
const filePath = process.argv[2] || path.join(__dirname, '../data/localStorage_export.json');

console.log(`Using file: ${filePath}\n`);

const migration = new LocalStorageMigration(filePath);
migration.run()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
