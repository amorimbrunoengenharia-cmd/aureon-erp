import sequelize from '../config/database.js';
import Tenant from './Tenant.js';
import User from './User.js';
import Product from './Product.js';
import Client from './Client.js';
import Supplier from './Supplier.js';
import Sale from './Sale.js';
import Prescription from './Prescription.js';
import StockMovement from './StockMovement.js';
import FinanceTransaction from './FinanceTransaction.js';
import Event from './Event.js';
import AuditLog from './AuditLog.js';
import SavedSearch from './SavedSearch.js';
import MarketplaceIntegration from './MarketplaceIntegration.js';
import SupplierQuotation from './SupplierQuotation.js';

// ===== RELACIONAMENTOS =====

// Tenant relationships
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
Tenant.hasMany(Product, { foreignKey: 'tenant_id', as: 'products' });
Tenant.hasMany(Client, { foreignKey: 'tenant_id', as: 'clients' });
Tenant.hasMany(Supplier, { foreignKey: 'tenant_id', as: 'suppliers' });
Tenant.hasMany(Sale, { foreignKey: 'tenant_id', as: 'sales' });

// User relationships
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
User.hasMany(Sale, { foreignKey: 'vendedor_id', as: 'sales' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
User.hasMany(StockMovement, { foreignKey: 'responsavel_id', as: 'stock_movements' });
User.hasMany(FinanceTransaction, { foreignKey: 'responsavel_id', as: 'finance_transactions' });
User.hasMany(Prescription, { foreignKey: 'created_by', as: 'prescriptions_created' });
User.hasMany(SavedSearch, { foreignKey: 'user_id', as: 'saved_searches' });

// Product relationships
Product.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Product.belongsTo(Supplier, { foreignKey: 'fornecedor_id', as: 'supplier' });
Product.hasMany(Sale, { foreignKey: 'produto_id', as: 'sales' });
Product.hasMany(StockMovement, { foreignKey: 'produto_id', as: 'stock_movements' });

// Client relationships
Client.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Client.hasMany(Sale, { foreignKey: 'cliente_id', as: 'sales' });
Client.hasMany(Prescription, { foreignKey: 'cliente_id', as: 'prescriptions' });
Client.hasMany(FinanceTransaction, { foreignKey: 'cliente_id', as: 'finance_transactions' });

// Supplier relationships
Supplier.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Supplier.hasMany(Product, { foreignKey: 'fornecedor_id', as: 'products' });
Supplier.hasMany(FinanceTransaction, { foreignKey: 'fornecedor_id', as: 'finance_transactions' });

// Sale relationships
Sale.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Sale.belongsTo(Product, { foreignKey: 'produto_id', as: 'product' });
Sale.belongsTo(Client, { foreignKey: 'cliente_id', as: 'client' });
Sale.belongsTo(User, { foreignKey: 'vendedor_id', as: 'seller' });
Sale.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });
Sale.hasMany(FinanceTransaction, { foreignKey: 'sale_id', as: 'finance_transactions' });

// Prescription relationships
Prescription.belongsTo(Client, { foreignKey: 'cliente_id', as: 'client' });
Prescription.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Prescription.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
Prescription.hasMany(Sale, { foreignKey: 'prescription_id', as: 'sales' });

// StockMovement relationships
StockMovement.belongsTo(Product, { foreignKey: 'produto_id', as: 'product' });
StockMovement.belongsTo(User, { foreignKey: 'responsavel_id', as: 'responsible' });

// FinanceTransaction relationships
FinanceTransaction.belongsTo(Client, { foreignKey: 'cliente_id', as: 'client' });
FinanceTransaction.belongsTo(Supplier, { foreignKey: 'fornecedor_id', as: 'supplier' });
FinanceTransaction.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
FinanceTransaction.belongsTo(User, { foreignKey: 'responsavel_id', as: 'responsible' });

// AuditLog relationships
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// MarketplaceIntegration relationships
MarketplaceIntegration.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(MarketplaceIntegration, { foreignKey: 'tenant_id', as: 'marketplace_integrations' });

// SupplierQuotation relationships
SupplierQuotation.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
SupplierQuotation.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
SupplierQuotation.belongsTo(Product, { foreignKey: 'produto_id', as: 'product' });
SupplierQuotation.belongsTo(User, { foreignKey: 'aprovado_por', as: 'approver' });
Supplier.hasMany(SupplierQuotation, { foreignKey: 'supplier_id', as: 'quotations' });
Product.hasMany(SupplierQuotation, { foreignKey: 'produto_id', as: 'quotations' });

// ===== EXPORTS =====

const models = {
  sequelize,
  Tenant,
  User,
  Product,
  Client,
  Supplier,
  Sale,
  Prescription,
  StockMovement,
  FinanceTransaction,
  Event,
  AuditLog,
  SavedSearch,
  MarketplaceIntegration,
  SupplierQuotation
};

export default models;
export {
  sequelize,
  Tenant,
  User,
  Product,
  Client,
  Supplier,
  Sale,
  Prescription,
  StockMovement,
  FinanceTransaction,
  Event,
  AuditLog,
  SavedSearch,
  MarketplaceIntegration,
  SupplierQuotation
};
