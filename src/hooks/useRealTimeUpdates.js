/**
 * useRealTimeUpdates Hook
 * 
 * Hook React para receber updates em tempo real via EventBus
 * Automaticamente se inscreve e desinscreve de eventos
 */

import { useEffect, useCallback, useRef } from 'react';
import eventBus from '../services/EventBus';
import { EVENTS } from '../services/EventTypes';

export const useRealTimeUpdates = (eventTypes, callback) => {
  const callbackRef = useRef(callback);

  // Atualizar ref quando callback mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handlers = [];

    // Registrar handlers para cada tipo de evento
    eventTypes.forEach(eventType => {
      const handler = (event) => {
        callbackRef.current(event);
      };
      
      eventBus.on(eventType, handler);
      handlers.push({ eventType, handler });
    });

    // Cleanup: desregistrar todos os handlers
    return () => {
      handlers.forEach(({ eventType, handler }) => {
        eventBus.off(eventType, handler);
      });
    };
  }, [eventTypes]);
};

/**
 * Hook específico para updates de vendas
 */
export const useSalesUpdates = (callback) => {
  useRealTimeUpdates([
    EVENTS.SALES.ORDER_CREATED,
    EVENTS.SALES.ORDER_UPDATED,
    EVENTS.SALES.ORDER_CANCELLED,
    EVENTS.SALES.ORDER_PAID
  ], callback);
};

/**
 * Hook específico para updates de estoque
 */
export const useInventoryUpdates = (callback) => {
  useRealTimeUpdates([
    EVENTS.INVENTORY.STOCK_RECEIVED,
    EVENTS.INVENTORY.STOCK_SHIPPED,
    EVENTS.INVENTORY.STOCK_RESERVED,
    EVENTS.INVENTORY.STOCK_RELEASED,
    EVENTS.INVENTORY.ALERT_LOW_STOCK
  ], callback);
};

/**
 * Hook específico para updates de clientes
 */
export const useCustomerUpdates = (callback) => {
  useRealTimeUpdates([
    EVENTS.CUSTOMER.CREATED,
    EVENTS.CUSTOMER.UPDATED,
    EVENTS.CUSTOMER.DELETED
  ], callback);
};

/**
 * Hook específico para updates de produtos
 */
export const useProductUpdates = (callback) => {
  useRealTimeUpdates([
    EVENTS.PRODUCT.CREATED,
    EVENTS.PRODUCT.UPDATED,
    EVENTS.PRODUCT.DELETED,
    EVENTS.PRODUCT.PRICE_CHANGED
  ], callback);
};

/**
 * Hook para notificações do sistema
 */
export const useSystemNotifications = (callback) => {
  useRealTimeUpdates([
    EVENTS.SYSTEM.ERROR,
    EVENTS.SYSTEM.WARNING,
    EVENTS.SYSTEM.INFO
  ], callback);
};

export default useRealTimeUpdates;
