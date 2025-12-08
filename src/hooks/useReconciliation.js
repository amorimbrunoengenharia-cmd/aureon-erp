/**
 * useReconciliation Hook
 * React hook para consumir status de reconciliação em tempo real
 */

import { useState, useEffect, useCallback } from 'react';
import reconciliationService from '../services/ReconciliationService';
import eventBus from '../services/EventBus';
import { EVENTS } from '../services/EventTypes';

export function useReconciliation(autoRefresh = false, refreshInterval = 60000) {
  const [lastReport, setLastReport] = useState(reconciliationService.getLastReport());
  const [stats, setStats] = useState(reconciliationService.getStats());
  const [isReconciling, setIsReconciling] = useState(false);
  const [criticalDivergences, setCriticalDivergences] = useState([]);

  /**
   * Atualizar dados locais
   */
  const updateData = useCallback(() => {
    setLastReport(reconciliationService.getLastReport());
    setStats(reconciliationService.getStats());
    setCriticalDivergences(reconciliationService.getCriticalDivergences());
  }, []);

  /**
   * Executar reconciliação manual
   */
  const runReconciliation = useCallback(async () => {
    setIsReconciling(true);
    try {
      await reconciliationService.reconcileFromStorage();
      updateData();
    } catch (error) {
      console.error('Erro ao executar reconciliação:', error);
    } finally {
      setIsReconciling(false);
    }
  }, [updateData]);

  /**
   * Limpar histórico
   */
  const clearHistory = useCallback(() => {
    reconciliationService.clearReports();
    updateData();
  }, [updateData]);

  /**
   * Ativar/desativar auto-reconciliação
   */
  const setAutoReconcile = useCallback((enabled) => {
    reconciliationService.setAutoReconcile(enabled);
    updateData();
  }, [updateData]);

  /**
   * Obter todos os relatórios
   */
  const getAllReports = useCallback(() => {
    return reconciliationService.getAllReports();
  }, []);

  useEffect(() => {
    // Event listener para reconciliação completa
    const handleReconciliationComplete = () => {
      updateData();
      setIsReconciling(false);
    };

    eventBus.on(EVENTS.SYSTEM.RECONCILIATION_COMPLETED, handleReconciliationComplete);

    // Auto-refresh se configurado
    let intervalId;
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        updateData();
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      eventBus.off(EVENTS.SYSTEM.RECONCILIATION_COMPLETED, handleReconciliationComplete);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, updateData]);

  return {
    lastReport,
    stats,
    criticalDivergences,
    isReconciling,
    runReconciliation,
    clearHistory,
    setAutoReconcile,
    getAllReports,
    refresh: updateData
  };
}

export default useReconciliation;
