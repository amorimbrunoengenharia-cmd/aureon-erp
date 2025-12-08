/**
 * PURCHASE ORDER SERVICE
 * Gerencia pedidos de compra com integração ao EventBus
 */

import eventBus from './EventBus';
import { EVENTS, createPurchaseOrderPayload } from './EventTypes';

class PurchaseOrderService {
  constructor() {
    this.storageKey = 'aureon_purchase_orders';
  }

  // ============================================
  // STORAGE HELPERS
  // ============================================
  
  loadOrders() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      return [];
    }
  }

  saveOrders(orders) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch (error) {
      console.error('Erro ao salvar pedidos:', error);
    }
  }

  // ============================================
  // PURCHASE ORDER CRUD
  // ============================================
  
  /**
   * Criar novo pedido de compra
   * @param {Object} orderData - Dados do pedido
   * @param {number} orderData.supplierId - ID do fornecedor
   * @param {string} orderData.supplierName - Nome do fornecedor
   * @param {Array} orderData.items - Lista de itens [{productId, productName, quantity, unitCost}]
   * @param {string} orderData.createdBy - Usuário criador
   * @param {string} orderData.notes - Observações
   */
  createOrder(orderData) {
    const orders = this.loadOrders();
    
    // Calcular totais
    const totalCost = orderData.items.reduce((acc, item) => {
      return acc + (item.quantity * item.unitCost);
    }, 0);
    
    const totalItems = orderData.items.reduce((acc, item) => acc + item.quantity, 0);
    
    // Calcular data prevista de entrega (lead time do fornecedor)
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + (orderData.leadTime || 7));
    
    const newOrder = {
      id: Date.now() + Math.floor(Math.random() * 1000000),
      supplierId: orderData.supplierId,
      supplierName: orderData.supplierName,
      items: orderData.items,
      totalCost,
      totalItems,
      status: 'draft', // draft, pending, approved, ordered, received, cancelled
      createdBy: orderData.createdBy || 'Sistema',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      expectedDelivery: expectedDelivery.toISOString(),
      actualDelivery: null,
      notes: orderData.notes || '',
      invoiceNumber: null,
      invoiceDate: null,
      paymentStatus: 'pending' // pending, paid, overdue
    };
    
    orders.push(newOrder);
    this.saveOrders(orders);
    
    // ✅ EVENT-DRIVEN: Emitir evento de pedido criado
    eventBus.emit(
      EVENTS.PURCHASE.ORDER_CREATED,
      createPurchaseOrderPayload(newOrder, { id: newOrder.supplierId, nome: newOrder.supplierName }, newOrder.items),
      { source: 'PurchaseOrderService.createOrder', user: orderData.createdBy }
    );
    
    console.log('✅ [PurchaseOrderService] Pedido criado:', newOrder.id);
    return newOrder;
  }

  /**
   * Aprovar pedido de compra
   * @param {number} orderId - ID do pedido
   * @param {string} approvedBy - Usuário aprovador
   */
  approveOrder(orderId, approvedBy) {
    const orders = this.loadOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado`);
    }
    
    if (order.status !== 'draft' && order.status !== 'pending') {
      throw new Error(`Pedido ${orderId} não pode ser aprovado (status atual: ${order.status})`);
    }
    
    order.status = 'approved';
    order.approvedBy = approvedBy;
    order.approvedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    
    this.saveOrders(orders);
    
    // ✅ EVENT-DRIVEN: Emitir evento de pedido aprovado (gatilho para criar despesa)
    eventBus.emit(
      EVENTS.PURCHASE.ORDER_APPROVED,
      {
        orderId: order.id,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        totalCost: order.totalCost,
        items: order.items,
        approvedBy,
        approvedAt: order.approvedAt,
        dueDate: order.expectedDelivery
      },
      { source: 'PurchaseOrderService.approveOrder', user: approvedBy }
    );
    
    console.log('✅ [PurchaseOrderService] Pedido aprovado:', orderId);
    return order;
  }

  /**
   * Registrar recebimento de pedido
   * @param {number} orderId - ID do pedido
   * @param {string} invoiceNumber - Número da nota fiscal
   * @param {string} invoiceDate - Data da nota fiscal
   * @param {string} receivedBy - Usuário que recebeu
   */
  receiveOrder(orderId, invoiceNumber, invoiceDate, receivedBy) {
    const orders = this.loadOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado`);
    }
    
    if (order.status !== 'approved' && order.status !== 'ordered') {
      throw new Error(`Pedido ${orderId} não pode ser recebido (status atual: ${order.status})`);
    }
    
    order.status = 'received';
    order.actualDelivery = new Date().toISOString();
    order.invoiceNumber = invoiceNumber;
    order.invoiceDate = invoiceDate;
    order.receivedBy = receivedBy;
    order.updatedAt = new Date().toISOString();
    
    this.saveOrders(orders);
    
    // ✅ EVENT-DRIVEN: Emitir evento de pedido recebido (gatilho para entrada de estoque)
    eventBus.emit(
      EVENTS.PURCHASE.ORDER_RECEIVED,
      {
        orderId: order.id,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        items: order.items,
        invoiceNumber,
        invoiceDate,
        receivedBy,
        receivedAt: order.actualDelivery
      },
      { source: 'PurchaseOrderService.receiveOrder', user: receivedBy }
    );
    
    // ✅ EVENT-DRIVEN: Emitir evento de nota fiscal recebida (gatilho para linkar despesa)
    eventBus.emit(
      EVENTS.PURCHASE.INVOICE_RECEIVED,
      {
        purchaseOrderId: order.id,
        invoiceNumber,
        invoiceDate,
        totalAmount: order.totalCost,
        supplierId: order.supplierId,
        receivedAt: order.actualDelivery
      },
      { source: 'PurchaseOrderService.receiveOrder', user: receivedBy }
    );
    
    console.log('✅ [PurchaseOrderService] Pedido recebido:', orderId);
    return order;
  }

  /**
   * Cancelar pedido
   * @param {number} orderId - ID do pedido
   * @param {string} reason - Motivo do cancelamento
   * @param {string} cancelledBy - Usuário que cancelou
   */
  cancelOrder(orderId, reason, cancelledBy) {
    const orders = this.loadOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado`);
    }
    
    if (order.status === 'received') {
      throw new Error(`Pedido ${orderId} já foi recebido e não pode ser cancelado`);
    }
    
    order.status = 'cancelled';
    order.cancelReason = reason;
    order.cancelledBy = cancelledBy;
    order.cancelledAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    
    this.saveOrders(orders);
    
    // ✅ EVENT-DRIVEN: Emitir evento de pedido cancelado
    eventBus.emit(
      EVENTS.PURCHASE.ORDER_CANCELLED,
      {
        orderId: order.id,
        supplierId: order.supplierId,
        reason,
        cancelledBy,
        cancelledAt: order.cancelledAt
      },
      { source: 'PurchaseOrderService.cancelOrder', user: cancelledBy }
    );
    
    console.log('✅ [PurchaseOrderService] Pedido cancelado:', orderId);
    return order;
  }

  /**
   * Obter todos os pedidos
   * @param {string} status - Filtro por status (opcional)
   */
  getOrders(status = null) {
    const orders = this.loadOrders();
    if (status) {
      return orders.filter(o => o.status === status);
    }
    return orders;
  }

  /**
   * Obter pedido por ID
   * @param {number} orderId - ID do pedido
   */
  getOrderById(orderId) {
    const orders = this.loadOrders();
    return orders.find(o => o.id === orderId);
  }

  /**
   * Obter pedidos por fornecedor
   * @param {number} supplierId - ID do fornecedor
   */
  getOrdersBySupplier(supplierId) {
    const orders = this.loadOrders();
    return orders.filter(o => o.supplierId === supplierId);
  }

  /**
   * Obter estatísticas de pedidos
   */
  getStatistics() {
    const orders = this.loadOrders();
    
    return {
      total: orders.length,
      byStatus: {
        draft: orders.filter(o => o.status === 'draft').length,
        pending: orders.filter(o => o.status === 'pending').length,
        approved: orders.filter(o => o.status === 'approved').length,
        ordered: orders.filter(o => o.status === 'ordered').length,
        received: orders.filter(o => o.status === 'received').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      },
      totalValue: orders.reduce((acc, o) => acc + o.totalCost, 0),
      totalItems: orders.reduce((acc, o) => acc + o.totalItems, 0),
      avgOrderValue: orders.length > 0 ? orders.reduce((acc, o) => acc + o.totalCost, 0) / orders.length : 0,
      pendingApproval: orders.filter(o => o.status === 'draft' || o.status === 'pending').length,
      awaitingDelivery: orders.filter(o => o.status === 'approved' || o.status === 'ordered').length
    };
  }
}

// Export singleton
export default new PurchaseOrderService();
