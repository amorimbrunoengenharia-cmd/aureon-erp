import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    channel: '',
    vendedor_id: ''
  });

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAnalyticsDashboard(
        dateRange.startDate,
        dateRange.endDate,
        filters
      );
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (type) => {
    try {
      const data = await ApiService.exportAnalytics(
        dateRange.startDate,
        dateRange.endDate,
        type
      );
      
      // Download do JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${dateRange.startDate}_${dateRange.endDate}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Analytics de Vendas</h1>
        <p className="text-gray-600">Análise detalhada do desempenho de vendas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Canal
            </label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Loja Física">Loja Física</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Site">Site</option>
              <option value="Telefone">Telefone</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDashboard}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Botões de exportação */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handleExport('dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
          >
            📥 Exportar Dashboard
          </button>
          <button
            onClick={() => handleExport('sales')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
          >
            📥 Exportar Vendas
          </button>
          <button
            onClick={() => handleExport('products')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
          >
            📥 Exportar Produtos
          </button>
        </div>
      </div>

      {dashboard && (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="text-sm font-medium opacity-90 mb-1">Total de Vendas</div>
              <div className="text-3xl font-bold">{dashboard.summary.total_sales}</div>
              <div className="text-sm opacity-75 mt-2">vendas realizadas</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="text-sm font-medium opacity-90 mb-1">Receita Total</div>
              <div className="text-3xl font-bold">{formatCurrency(dashboard.summary.total_revenue)}</div>
              <div className="text-sm opacity-75 mt-2">em vendas</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="text-sm font-medium opacity-90 mb-1">Lucro Total</div>
              <div className="text-3xl font-bold">{formatCurrency(dashboard.summary.total_profit)}</div>
              <div className="text-sm opacity-75 mt-2">margem {formatPercent(dashboard.summary.avg_margin)}</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
              <div className="text-sm font-medium opacity-90 mb-1">Ticket Médio</div>
              <div className="text-3xl font-bold">{formatCurrency(dashboard.summary.avg_ticket)}</div>
              <div className="text-sm opacity-75 mt-2">por venda</div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Vendas por Canal */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Vendas por Canal</h3>
              <div className="space-y-3">
                {dashboard.charts.by_channel.map((channel, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-32 text-sm font-medium text-gray-700">
                        {channel.channel}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full flex items-center justify-end px-2 text-white text-xs font-medium"
                            style={{
                              width: `${(channel.revenue / dashboard.summary.total_revenue * 100)}%`
                            }}
                          >
                            {channel.count}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 w-28 text-right">
                      {formatCurrency(channel.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Formas de Pagamento</h3>
              <div className="space-y-3">
                {dashboard.charts.by_payment_method.map((method, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-32 text-sm font-medium text-gray-700">
                        {method.method}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-green-500 h-full flex items-center justify-end px-2 text-white text-xs font-medium"
                            style={{
                              width: `${(method.revenue / dashboard.summary.total_revenue * 100)}%`
                            }}
                          >
                            {method.count}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 w-28 text-right">
                      {formatCurrency(method.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categorias */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Vendas por Categoria</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoria</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Vendas</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Qtd</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Receita</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Lucro</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.charts.by_category.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.categoria}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{cat.sales_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{cat.total_quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(cat.total_revenue)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(cat.total_profit)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cat.avg_margin >= 30 ? 'bg-green-100 text-green-800' :
                          cat.avg_margin >= 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercent(cat.avg_margin)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Produtos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">🏆 Top 5 Produtos</h3>
              <div className="space-y-3">
                {dashboard.rankings.top_products.map((product, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {idx + 1}. {product.produto}
                      </span>
                      <span className="text-xs text-gray-500">{product.categoria}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{product.sales_count} vendas</span>
                      <span className="font-semibold text-green-600">{formatCurrency(product.total_revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Clientes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">👥 Top 5 Clientes</h3>
              <div className="space-y-3">
                {dashboard.rankings.top_clients.map((client, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {idx + 1}. {client.cliente}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{client.purchase_count} compras</span>
                      <span className="font-semibold text-green-600">{formatCurrency(client.total_spent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Vendedores */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">💼 Performance Vendedores</h3>
              <div className="space-y-3">
                {dashboard.rankings.salesman_performance.map((salesman, idx) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-3 py-2 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {idx + 1}. {salesman.vendedor}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{salesman.sales_count} vendas</span>
                      <span className="font-semibold text-green-600">{formatCurrency(salesman.total_revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesAnalytics;
