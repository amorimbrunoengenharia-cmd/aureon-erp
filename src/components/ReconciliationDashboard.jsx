/**
 * ReconciliationDashboard Component
 * Dashboard visual para monitoramento de reconciliação de dados
 */

import React from 'react';
import useReconciliation from '../hooks/useReconciliation';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Trash2, Power, Clock, TrendingUp } from 'lucide-react';

export default function ReconciliationDashboard() {
  const {
    lastReport,
    stats,
    criticalDivergences,
    isReconciling,
    runReconciliation,
    clearHistory,
    setAutoReconcile,
    getAllReports
  } = useReconciliation(true, 60000); // Auto-refresh a cada 1 minuto

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'info':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default:
        return 'text-aureon-text bg-aureon-surface border-aureon-gold/20';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'info':
        return <CheckCircle size={16} className="text-blue-400" />;
      default:
        return <CheckCircle size={16} className="text-green-400" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-aureon-gold flex items-center gap-3">
              <Shield size={32} />
              Reconciliação de Dados
            </h2>
            <p className="text-aureon-text text-sm mt-1">
              Monitoramento de integridade e consistência do sistema
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setAutoReconcile(!stats.autoReconcileEnabled)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                stats.autoReconcileEnabled
                  ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                  : 'bg-aureon-surface text-aureon-text border border-aureon-gold/20'
              }`}
            >
              <Power size={16} />
              Auto-Reconciliação: {stats.autoReconcileEnabled ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={runReconciliation}
              disabled={isReconciling}
              className="px-4 py-2 bg-aureon-gold text-aureon-bg rounded-lg text-sm font-medium hover:bg-aureon-gold/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isReconciling ? 'animate-spin' : ''} />
              {isReconciling ? 'Reconciliando...' : 'Reconciliar Agora'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Reports */}
          <div className="bg-gradient-to-br from-aureon-gold/10 to-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">
                Relatórios
              </span>
              <Shield size={24} className="text-aureon-gold" />
            </div>
            <div className="text-3xl font-bold text-aureon-gold mb-1">
              {stats.totalReports}
            </div>
            <div className="text-xs text-aureon-text/70">Total de verificações</div>
          </div>

          {/* Critical Divergences */}
          <div className={`bg-gradient-to-br rounded-xl p-6 border ${
            stats.criticalCount > 0
              ? 'from-red-400/10 border-red-400/30'
              : 'from-green-400/10 border-green-400/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">
                Críticas
              </span>
              <AlertTriangle size={24} className={stats.criticalCount > 0 ? 'text-red-400' : 'text-green-400'} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              stats.criticalCount > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {stats.criticalCount}
            </div>
            <div className="text-xs text-aureon-text/70">
              {stats.criticalCount > 0 ? 'Requer atenção imediata' : 'Sistema OK'}
            </div>
          </div>

          {/* Average Divergences */}
          <div className="bg-gradient-to-br from-blue-400/10 to-aureon-surface border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">
                Média (7 dias)
              </span>
              <TrendingUp size={24} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {stats.averageDivergences}
            </div>
            <div className="text-xs text-aureon-text/70">Divergências por relatório</div>
          </div>

          {/* Last Run */}
          <div className="bg-gradient-to-br from-purple-400/10 to-aureon-surface border border-purple-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">
                Última Execução
              </span>
              <Clock size={24} className="text-purple-400" />
            </div>
            <div className="text-lg font-bold text-purple-400 mb-1">
              {stats.lastRun
                ? new Date(stats.lastRun).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Nunca'}
            </div>
            <div className="text-xs text-aureon-text/70">
              {stats.lastRun
                ? new Date(stats.lastRun).toLocaleDateString('pt-BR')
                : 'Aguardando primeira execução'}
            </div>
          </div>
        </div>

        {/* Last Report Summary */}
        {lastReport && (
          <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-serif font-bold text-aureon-gold mb-4 flex items-center gap-2">
              <CheckCircle size={24} />
              Último Relatório
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-aureon-bg rounded-lg p-4 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Status</div>
                <div className={`text-lg font-bold ${
                  lastReport.status === 'OK' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {lastReport.status === 'OK' ? '✓ OK' : '⚠ Divergências'}
                </div>
              </div>

              <div className="bg-aureon-bg rounded-lg p-4 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Total</div>
                <div className="text-lg font-bold text-aureon-text">
                  {lastReport.summary.totalDivergences}
                </div>
              </div>

              <div className="bg-aureon-bg rounded-lg p-4 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Críticas</div>
                <div className="text-lg font-bold text-red-400">
                  {lastReport.summary.criticalDivergences}
                </div>
              </div>

              <div className="bg-aureon-bg rounded-lg p-4 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Tempo</div>
                <div className="text-lg font-bold text-aureon-text">
                  {lastReport.elapsedTimeMs}ms
                </div>
              </div>
            </div>

            {/* Module Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-aureon-bg rounded-lg p-3 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Vendas ↔ Finanças</div>
                <div className={`text-sm font-bold ${
                  lastReport.modules.salesReconciliation.status === 'OK'
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {lastReport.modules.salesReconciliation.status}
                </div>
              </div>

              <div className="bg-aureon-bg rounded-lg p-3 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Compras ↔ Despesas</div>
                <div className={`text-sm font-bold ${
                  lastReport.modules.purchaseReconciliation.status === 'OK'
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {lastReport.modules.purchaseReconciliation.status}
                </div>
              </div>

              <div className="bg-aureon-bg rounded-lg p-3 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Estoque ↔ Movimentações</div>
                <div className={`text-sm font-bold ${
                  lastReport.modules.inventoryReconciliation.status === 'OK'
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {lastReport.modules.inventoryReconciliation.status}
                </div>
              </div>

              <div className="bg-aureon-bg rounded-lg p-3 border border-aureon-gold/10">
                <div className="text-xs text-aureon-text/70 mb-1">Integridade Referencial</div>
                <div className={`text-sm font-bold ${
                  lastReport.modules.referentialIntegrity.status === 'OK'
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {lastReport.modules.referentialIntegrity.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Critical Divergences */}
        {criticalDivergences.length > 0 && (
          <div className="bg-red-400/5 border border-red-400/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-serif font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={24} />
              Divergências Críticas ({criticalDivergences.length})
            </h3>

            <div className="space-y-3">
              {criticalDivergences.map((divergence, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getSeverityColor(divergence.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(divergence.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{divergence.type}</span>
                        <span className="text-xs px-2 py-1 bg-black/20 rounded">
                          {divergence.module}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{divergence.description}</p>
                      {divergence.suggestedAction && (
                        <div className="text-xs bg-black/20 rounded p-2 mt-2">
                          <strong>Ação sugerida:</strong> {divergence.suggestedAction}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Divergences */}
        {lastReport && lastReport.divergences.length > 0 && (
          <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-serif font-bold text-aureon-gold mb-4">
              Todas as Divergências ({lastReport.divergences.length})
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lastReport.divergences.map((divergence, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getSeverityColor(divergence.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(divergence.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{divergence.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-black/20 rounded">
                            {divergence.module}
                          </span>
                          <span className="text-xs px-2 py-1 bg-black/20 rounded uppercase">
                            {divergence.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{divergence.description}</p>
                      {divergence.suggestedAction && (
                        <div className="text-xs bg-black/20 rounded p-2">
                          <strong>Ação:</strong> {divergence.suggestedAction}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-400/20 text-red-400 border border-red-400/30 rounded-lg text-sm font-medium hover:bg-red-400/30 transition-all flex items-center gap-2"
          >
            <Trash2 size={16} />
            Limpar Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
