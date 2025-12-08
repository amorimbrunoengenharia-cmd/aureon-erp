import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const AlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, critical, high, medium, low

  useEffect(() => {
    loadAlerts();
    // Recarregar alertas a cada 5 minutos
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { severity: filter } : {};
      const response = await ApiService.get('/api/alerts', { params });
      
      if (response.data.success) {
        setAlerts(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[severity] || colors.low;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    };
    return icons[severity] || '🔵';
  };

  const getTypeLabel = (type) => {
    const labels = {
      LOW_STOCK: 'Estoque Baixo',
      NO_MOVEMENT: 'Produto Parado',
      INACTIVE_CUSTOMER: 'Cliente Inativo',
      OVERDUE_PAYMENT: 'Pagamento Atrasado'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🚨 Alertas do Sistema</h2>
        <button
          onClick={loadAlerts}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⏳ Atualizando...' : '🔄 Atualizar'}
        </button>
      </div>

      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-3xl font-bold text-gray-800">{summary.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded cursor-pointer" onClick={() => setFilter('critical')}>
            <div className="text-3xl font-bold text-red-600">{summary.critical}</div>
            <div className="text-sm text-red-600">Críticos</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded cursor-pointer" onClick={() => setFilter('high')}>
            <div className="text-3xl font-bold text-orange-600">{summary.high}</div>
            <div className="text-sm text-orange-600">Altos</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded cursor-pointer" onClick={() => setFilter('medium')}>
            <div className="text-3xl font-bold text-yellow-600">{summary.medium}</div>
            <div className="text-sm text-yellow-600">Médios</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded cursor-pointer" onClick={() => setFilter('low')}>
            <div className="text-3xl font-bold text-blue-600">{summary.low}</div>
            <div className="text-sm text-blue-600">Baixos</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded ${filter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
        >
          Críticos
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded ${filter === 'high' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}
        >
          Altos
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-4 py-2 rounded ${filter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
        >
          Médios
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded ${filter === 'low' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Baixos
        </button>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ✅ Nenhum alerta encontrado. Sistema operando normalmente!
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                    <span className="font-semibold">{alert.title}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded">
                      {getTypeLabel(alert.type)}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{alert.message}</p>
                  {alert.data && (
                    <div className="text-xs space-y-1 text-gray-600">
                      {alert.data.productName && <div>📦 Produto: {alert.data.productName}</div>}
                      {alert.data.sku && <div>🔖 SKU: {alert.data.sku}</div>}
                      {alert.data.currentStock !== undefined && <div>📊 Estoque: {alert.data.currentStock} un.</div>}
                      {alert.data.customerName && <div>👤 Cliente: {alert.data.customerName}</div>}
                      {alert.data.amount && <div>💰 Valor: R$ {alert.data.amount.toFixed(2)}</div>}
                      {alert.data.daysOverdue && <div>⏰ Atraso: {alert.data.daysOverdue} dias</div>}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.createdAt).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;
