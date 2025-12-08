import React, { useState, useEffect } from 'react';
import { useSalesUpdates, useInventoryUpdates } from '../hooks/useRealTimeUpdates';
import ApiService from '../services/ApiService';
import AlertsWidget from '../components/AlertsWidget';

const DashboardRealTime = () => {
  const [stats, setStats] = useState({
    salesToday: 0,
    revenueToday: 0,
    lowStockProducts: 0,
    pendingOrders: 0
  });
  
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular carregamento de stats
      // TODO: Implementar endpoints específicos de dashboard
      setStats({
        salesToday: 0,
        revenueToday: 0,
        lowStockProducts: 0,
        pendingOrders: 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Updates em tempo real de vendas
  useSalesUpdates((event) => {
    console.log('📊 Update de venda recebido:', event);
    
    // Adicionar evento à lista recente
    setRecentEvents(prev => [
      {
        type: 'sale',
        icon: '🛒',
        title: 'Nova Venda',
        message: `Pedido ${event.payload.orderId} criado`,
        time: new Date().toLocaleTimeString('pt-BR'),
        data: event
      },
      ...prev.slice(0, 9) // Manter apenas os 10 mais recentes
    ]);

    // Atualizar stats
    if (event.eventType === 'sales.order.created') {
      setStats(prev => ({
        ...prev,
        salesToday: prev.salesToday + 1,
        revenueToday: prev.revenueToday + (event.payload.total || 0)
      }));
    }
  });

  // Updates em tempo real de estoque
  useInventoryUpdates((event) => {
    console.log('📦 Update de estoque recebido:', event);
    
    const icons = {
      'inventory.stock.received': '📥',
      'inventory.stock.shipped': '📤',
      'inventory.stock.reserved': '🔒',
      'inventory.stock.released': '🔓',
      'inventory.alert.low_stock': '⚠️'
    };

    const titles = {
      'inventory.stock.received': 'Estoque Recebido',
      'inventory.stock.shipped': 'Estoque Enviado',
      'inventory.stock.reserved': 'Estoque Reservado',
      'inventory.stock.released': 'Reserva Liberada',
      'inventory.alert.low_stock': 'Alerta: Estoque Baixo'
    };

    setRecentEvents(prev => [
      {
        type: 'inventory',
        icon: icons[event.eventType] || '📦',
        title: titles[event.eventType] || 'Atualização de Estoque',
        message: `Produto: ${event.payload.productName || 'N/A'}`,
        time: new Date().toLocaleTimeString('pt-BR'),
        data: event
      },
      ...prev.slice(0, 9)
    ]);

    // Atualizar contagem de produtos com estoque baixo
    if (event.eventType === 'inventory.alert.low_stock') {
      setStats(prev => ({
        ...prev,
        lowStockProducts: prev.lowStockProducts + 1
      }));
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            📊 Dashboard em Tempo Real
          </h1>
          <p className="text-gray-600">
            Atualizações automáticas via EventBus
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vendas Hoje</p>
                <p className="text-3xl font-bold text-blue-600">{stats.salesToday}</p>
              </div>
              <div className="text-4xl">🛒</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {stats.revenueToday.toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-3xl font-bold text-orange-600">{stats.lowStockProducts}</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pedidos Pendentes</p>
                <p className="text-3xl font-bold text-purple-600">{stats.pendingOrders}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eventos Recentes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🔔 Eventos Recentes
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aguardando eventos...
                </div>
              ) : (
                recentEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="text-2xl">{event.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{event.title}</div>
                      <div className="text-sm text-gray-600">{event.message}</div>
                    </div>
                    <div className="text-xs text-gray-500">{event.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alertas do Sistema */}
          <div>
            <AlertsWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardRealTime;
