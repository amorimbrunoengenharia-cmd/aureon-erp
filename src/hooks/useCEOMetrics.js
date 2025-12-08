/**
 * useCEOMetrics Hook
 * React hook para consumir métricas do CEO Dashboard em tempo real
 */

import { useState, useEffect } from 'react';
import ceoMetricsService from '../services/CEOMetricsService';

export function useCEOMetrics(autoRefreshInterval = null) {
  const [metrics, setMetrics] = useState(ceoMetricsService.getMetrics());
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Subscrever para atualizações em tempo real
    const unsubscribe = ceoMetricsService.subscribe((newMetrics, trace_id) => {
      setMetrics(newMetrics);
      setLastUpdate(new Date());
      
      if (trace_id) {
        console.log('📊 Métricas CEO atualizadas', { trace_id });
      }
    });

    // Setup auto-refresh se configurado
    let intervalId;
    if (autoRefreshInterval) {
      intervalId = setInterval(() => {
        refresh();
      }, autoRefreshInterval);
    }

    // Cleanup
    return () => {
      unsubscribe();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefreshInterval]);

  /**
   * Forçar recálculo de todas as métricas
   */
  const refresh = async () => {
    setLoading(true);
    try {
      ceoMetricsService.recalculateAll();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetar métricas (útil para testes)
   */
  const reset = () => {
    ceoMetricsService.reset();
  };

  return {
    metrics,
    loading,
    lastUpdate,
    refresh,
    reset
  };
}

export default useCEOMetrics;
