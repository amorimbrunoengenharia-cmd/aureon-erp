import sequelize from '../config/database.js';
import Tenant from './Tenant.js';
import User from './User.js';
import Product from './Product.js';
import Client from './Client.js';
import Supplier from './Supplier.js';
import Sale from './Sale.js';
import Prescription from './Prescription.js';
import PrescriptionAttachment from './PrescriptionAttachment.js';
import PatientHistory from './PatientHistory.js';
import PrescriptionVersion from './PrescriptionVersion.js';
import SimulatorRun from './SimulatorRun.js';
import StockMovement from './StockMovement.js';
import FinanceTransaction from './FinanceTransaction.js';
import Event from './Event.js';
import AuditLog from './AuditLog.js';
import SavedSearch from './SavedSearch.js';
import MarketplaceIntegration from './MarketplaceIntegration.js';
import SupplierQuotation from './SupplierQuotation.js';
import BugReport from './BugReport.js';

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
Prescription.hasMany(PrescriptionAttachment, { foreignKey: 'prescription_id', as: 'attachments' });
Prescription.hasMany(PrescriptionVersion, { foreignKey: 'prescription_id', as: 'versions' });

// PrescriptionAttachment relationships
PrescriptionAttachment.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });
PrescriptionAttachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// PatientHistory relationships
PatientHistory.belongsTo(Client, { foreignKey: 'patient_id', as: 'patient' });
PatientHistory.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
Client.hasMany(PatientHistory, { foreignKey: 'patient_id', as: 'history' });

// PrescriptionVersion relationships
PrescriptionVersion.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });
PrescriptionVersion.belongsTo(User, { foreignKey: 'changed_by', as: 'changer' });

// SimulatorRun relationships
SimulatorRun.belongsTo(User, { foreignKey: 'executed_by', as: 'executor' });
User.hasMany(SimulatorRun, { foreignKey: 'executed_by', as: 'simulator_runs' });

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

// BugReport relationships
BugReport.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
BugReport.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });
BugReport.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
BugReport.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });
User.hasMany(BugReport, { foreignKey: 'reported_by', as: 'reported_bugs' });
User.hasMany(BugReport, { foreignKey: 'assigned_to', as: 'assigned_bugs' });
Tenant.hasMany(BugReport, { foreignKey: 'tenant_id', as: 'bug_reports' });

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
  PrescriptionAttachment,
  PatientHistory,
  PrescriptionVersion,
  SimulatorRun,
  StockMovement,
  FinanceTransaction,
  Event,
  AuditLog,
  SavedSearch,
  MarketplaceIntegration,
  SupplierQuotation,
  BugReport
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
  PrescriptionAttachment,
  PatientHistory,
  PrescriptionVersion,
  SimulatorRun,
  StockMovement,
  FinanceTransaction,
  Event,
  AuditLog,
  SavedSearch,
  MarketplaceIntegration,
  SupplierQuotation,
  BugReport
};
