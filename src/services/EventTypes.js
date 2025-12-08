/**
 * EVENTOS DO SISTEMA - Convenção de Nomenclatura
 * Padrão: <domínio>.<entidade>.<ação>
 * 
 * Features:
 * - Helper functions para criar eventos com trace_id
 * - Metadados padronizados
 * - Rastreamento end-to-end
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Criar metadata padrão para eventos
 */
export function createEventMetadata(options = {}) {
  return {
    trace_id: options.trace_id || uuidv4(),
    timestamp: new Date().toISOString(),
    userId: options.userId || 'system',
    source: options.source || 'frontend',
    correlationId: options.correlationId || null,
    ...options
  };
}

/**
 * Helper para propagar trace_id entre eventos relacionados
 */
export function propagateTraceId(originalEvent) {
  return originalEvent?.metadata?.trace_id || uuidv4();
}

/**
 * Criar payload de evento com metadados
 */
export function createEventPayload(eventType, data, metadata = {}) {
  return {
    type: eventType,
    payload: data,
    metadata: createEventMetadata(metadata)
  };
}

export const EVENTS = {
  // ===== VENDAS =====
  SALES: {
    ORDER_CREATED: 'sales.order.created',
    ORDER_CONFIRMED: 'sales.order.confirmed',
    ORDER_PAID: 'sales.order.paid',
    ORDER_CANCELLED: 'sales.order.cancelled',
    ORDER_REFUNDED: 'sales.order.refunded',
    SHIPMENT_DISPATCHED: 'sales.shipment.dispatched'
  },

  // ===== ESTOQUE =====
  INVENTORY: {
    STOCK_RESERVED: 'inventory.stock.reserved',
    STOCK_RELEASED: 'inventory.stock.released',
    STOCK_ADJUSTED: 'inventory.stock.adjusted',
    STOCK_RECEIVED: 'inventory.stock.received',
    STOCK_SHIPPED: 'inventory.stock.shipped',
    ALERT_LOW_STOCK: 'inventory.alert.low_stock',
    ALERT_OUT_OF_STOCK: 'inventory.alert.out_of_stock'
  },

  // ===== COMPRAS =====
  PURCHASE: {
    ORDER_CREATED: 'purchase.order.created',
    ORDER_APPROVED: 'purchase.order.approved',
    ORDER_CANCELLED: 'purchase.order.cancelled',
    ORDER_RECEIVED: 'purchase.order.received',
    INVOICE_RECEIVED: 'purchase.invoice.received',
    PAYMENT_SCHEDULED: 'purchase.payment.scheduled'
  },

  // ===== FINANCEIRO =====
  FINANCE: {
    INVOICE_ISSUED: 'finance.invoice.issued',
    PAYMENT_RECEIVED: 'finance.payment.received',
    PAYMENT_SENT: 'finance.payment.sent',
    PAYMENT_MADE: 'finance.payment.made', // Alias para PAYMENT_SENT
    PAYMENT_RECONCILED: 'finance.payment.reconciled',
    INSTALLMENT_OVERDUE: 'finance.installment.overdue',
    CASHFLOW_CALCULATED: 'finance.cashflow.calculated',
    RECEIVABLE_CREATED: 'finance.receivable.created',
    EXPENSE_CREATED: 'finance.expense.created'
  },

  // ===== LOGÍSTICA =====
  OPS: {
    SHIPMENT_DISPATCHED: 'ops.shipment.dispatched',
    SHIPMENT_IN_TRANSIT: 'ops.shipment.in_transit',
    SHIPMENT_DELIVERED: 'ops.shipment.delivered',
    SHIPMENT_FAILED: 'ops.shipment.failed',
    TRACKING_UPDATED: 'ops.tracking.updated'
  },

  // ===== CRM =====
  CRM: {
    CUSTOMER_REGISTERED: 'crm.customer.registered',
    CUSTOMER_UPDATED: 'crm.customer.updated',
    RFM_CALCULATED: 'crm.rfm.calculated',
    CHURN_DETECTED: 'crm.churn.detected',
    LOYALTY_TIER_CHANGED: 'crm.loyalty.tier_changed'
  },

  // ===== RECEITAS MÉDICAS (PRESCRIPTIONS) =====
  PRESCRIPTION: {
    CREATED: 'prescription.created',
    UPDATED: 'prescription.updated',
    DELETED: 'prescription.deleted',
    ATTACHED_TO_ORDER: 'prescription.attached_to_order',
    EXPIRED: 'prescription.expired',
    ATTACHMENT_UPLOADED: 'prescription.attachment.uploaded'
  },

  // ===== MARKETPLACE =====
  MARKETPLACE: {
    ORDER_IMPORTED: 'marketplace.order.imported',
    PRODUCT_SYNCED: 'marketplace.product.synced',
    STOCK_SYNCED: 'marketplace.stock.synced',
    PRICE_UPDATED: 'marketplace.price.updated'
  },

  // ===== SISTEMA =====
  SYSTEM: {
    USER_LOGGED_IN: 'system.user.logged_in',
    USER_LOGGED_OUT: 'system.user.logged_out',
    BACKUP_CREATED: 'system.backup.created',
    RECONCILIATION_STARTED: 'system.reconciliation.started',
    RECONCILIATION_COMPLETED: 'system.reconciliation.completed'
  }
};

/**
 * Helpers para criar payloads padronizados
 */
export const createSalesOrderPayload = (venda, cliente, produtos) => ({
  orderId: venda.id,
  customerId: cliente?.id,
  customerName: cliente?.nome,
  items: produtos.map(p => ({
    productId: p.id,
    productName: p.nome || p.produto,
    quantity: p.quantidade,
    unitPrice: p.precoVenda,
    total: p.valorVenda
  })),
  total: venda.valorVenda,
  paymentMethod: venda.formaPagamento || 'unknown',
  channel: venda.canal,
  timestamp: venda.data + ' ' + venda.hora
});

export const createInventoryReservationPayload = (produtos, orderId) => ({
  orderId,
  items: produtos.map(p => ({
    productId: p.id,
    quantity: p.quantidade,
    previousStock: p.estoque,
    reservedStock: p.quantidade
  })),
  reservationId: `RES-${Date.now()}`,
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30min
});

export const createPurchaseOrderPayload = (pedido, fornecedor, itens) => ({
  orderId: pedido.id,
  supplierId: fornecedor.id,
  supplierName: fornecedor.nome,
  items: itens.map(item => ({
    productId: item.produtoId,
    productName: item.nome,
    quantity: item.quantidade,
    unitCost: item.precoCusto,
    total: item.quantidade * item.precoCusto
  })),
  total: itens.reduce((sum, i) => sum + (i.quantidade * i.precoCusto), 0),
  expectedDelivery: pedido.dataEntregaPrevista,
  status: pedido.status
});

export const createFinanceReceivablePayload = (venda, parcelas) => ({
  saleId: venda.id,
  customerId: venda.clienteId,
  totalAmount: venda.valorVenda,
  installments: parcelas.map((p, i) => ({
    number: i + 1,
    amount: p.valor,
    dueDate: p.dataVencimento,
    status: 'pending'
  })),
  createdFrom: 'sales.order.paid'
});

export const createFinanceExpensePayload = (pedido, tipo = 'compra') => ({
  purchaseOrderId: pedido.id,
  supplierId: pedido.fornecedorId,
  amount: pedido.valorTotal,
  category: tipo === 'compra' ? 'Fornecedores' : 'Outros',
  description: `Pedido #${pedido.id} - ${pedido.fornecedorNome}`,
  dueDate: pedido.dataVencimento,
  status: 'pending',
  createdFrom: 'purchase.order.approved'
});

export default EVENTS;
