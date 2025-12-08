import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const STATUS_COLORS = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  PROCESSANDO: 'bg-blue-100 text-blue-800'
};

const STATUS_LABELS = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  PROCESSANDO: 'Processando'
};

const CustomerPortal = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, history, profile

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchOrders(),
        fetchHistory(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/customer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/customer/orders?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      if (result.success) {
        setOrders(result.data.orders);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/customer/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/customer/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch(`http://localhost:5000/api/customer/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      if (result.success) {
        setSelectedOrder(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bem-vindo, {profile?.nome}!
          </h1>
          <p className="text-gray-600">Acompanhe seus pedidos e histórico de compras</p>
        </div>

        {/* Cards de Estatísticas */}
        {history && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Total de Pedidos</h3>
              <p className="text-3xl font-bold">{history.resumo.total_pedidos}</p>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Total Gasto</h3>
              <p className="text-3xl font-bold">{formatCurrency(history.resumo.total_gasto)}</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Ticket Médio</h3>
              <p className="text-3xl font-bold">{formatCurrency(history.resumo.ticket_medio)}</p>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Últimos 30 Dias</h3>
              <p className="text-3xl font-bold">
                {stats?.ultimos_30_dias?.quantidade_pedidos || 0}
              </p>
              <p className="text-sm opacity-80 mt-1">
                {formatCurrency(stats?.ultimos_30_dias?.valor_total || 0)}
              </p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Meus Pedidos
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Histórico
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Meu Perfil
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'orders' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Meus Pedidos</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">Nenhum pedido encontrado</p>
                <p className="text-sm">Seus pedidos aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => fetchOrderDetails(order.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          Pedido #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[order.status]
                      }`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Produto</p>
                        <p className="font-semibold">{order.Product?.produto || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Quantidade</p>
                        <p className="font-semibold">{order.quantidade}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Valor Total</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(order.valor_total)}
                        </p>
                      </div>
                    </div>

                    {order.forma_pagamento && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">Forma de Pagamento: </span>
                        <span className="font-semibold">{order.forma_pagamento}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'history' && history && (
          <div className="space-y-6">
            {/* Top Produtos */}
            <Card>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Produtos Mais Comprados
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Produto
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                        Quantidade
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                        Valor Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.top_produtos.map((produto, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{produto.produto}</td>
                        <td className="px-4 py-3 text-sm text-right">{produto.quantidade}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {formatCurrency(produto.valor_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Compras por Mês */}
            <Card>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Histórico Mensal
              </h2>
              <div className="space-y-3">
                {history.compras_por_mes.map((mes, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">
                        {new Date(mes.mes + '-01').toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{mes.quantidade} pedidos</p>
                    </div>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(mes.valor_total)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pedidos Recentes */}
            <Card>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Pedidos Recentes
              </h2>
              <div className="space-y-2">
                {history.pedidos_recentes.map(order => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center p-3 border-b hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">Pedido #{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)} - {order.Product?.produto}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(order.valor_total)}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[order.status]
                      }`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'profile' && profile && (
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Meu Perfil</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <p className="text-lg font-semibold">{profile.nome}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-lg">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <p className="text-lg">{profile.telefone || 'Não informado'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ
                  </label>
                  <p className="text-lg">{profile.cpf_cnpj || 'Não informado'}</p>
                </div>
              </div>

              {profile.endereco && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <p className="text-lg">
                    {profile.endereco}
                    {profile.cidade && `, ${profile.cidade}`}
                    {profile.estado && ` - ${profile.estado}`}
                    {profile.cep && ` - CEP: ${profile.cep}`}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente desde
                </label>
                <p className="text-lg">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de Detalhes do Pedido */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Pedido #{selectedOrder.id}</h2>
                    <p className="text-gray-600">{formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      STATUS_COLORS[selectedOrder.status]
                    }`}>
                      {STATUS_LABELS[selectedOrder.status]}
                    </span>
                  </div>

                  {/* Produto */}
                  <div>
                    <h3 className="font-semibold mb-2">Produto</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="font-bold text-lg">{selectedOrder.Product?.produto}</p>
                      {selectedOrder.Product?.descricao && (
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedOrder.Product.descricao}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Categoria</p>
                          <p className="font-semibold">{selectedOrder.Product?.categoria || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Marca</p>
                          <p className="font-semibold">{selectedOrder.Product?.marca || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valores */}
                  <div>
                    <h3 className="font-semibold mb-2">Valores</h3>
                    <div className="bg-gray-50 p-4 rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Quantidade:</span>
                        <span className="font-semibold">{selectedOrder.quantidade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Forma de Pagamento:</span>
                        <span className="font-semibold">{selectedOrder.forma_pagamento}</span>
                      </div>
                      <div className="flex justify-between text-lg border-t pt-2">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(selectedOrder.valor_total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transações Financeiras */}
                  {selectedOrder.finance_transactions && selectedOrder.finance_transactions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Transações Financeiras</h3>
                      <div className="space-y-2">
                        {selectedOrder.finance_transactions.map(trans => (
                          <div key={trans.id} className="bg-gray-50 p-3 rounded flex justify-between">
                            <div>
                              <p className="font-semibold">{trans.categoria}</p>
                              <p className="text-sm text-gray-600">{formatDate(trans.data)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${
                                trans.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {trans.tipo === 'ENTRADA' ? '+' : '-'} {formatCurrency(trans.valor)}
                              </p>
                              <p className="text-xs text-gray-600">{trans.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(null)}
                    className="w-full"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPortal;
