import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const PLATFORMS = {
  MERCADO_LIVRE: {
    name: 'Mercado Livre',
    icon: '🛒',
    color: 'yellow',
    fields: ['client_id', 'client_secret', 'access_token', 'refresh_token', 'seller_id']
  },
  SHOPEE: {
    name: 'Shopee',
    icon: '🛍️',
    color: 'orange',
    fields: ['partner_id', 'partner_key', 'shop_id']
  },
  AMAZON: {
    name: 'Amazon',
    icon: '📦',
    color: 'blue',
    fields: ['seller_id', 'access_token', 'marketplace_id']
  },
  B2W: {
    name: 'B2W (Americanas/Submarino)',
    icon: '🏪',
    color: 'red',
    fields: ['client_id', 'client_secret', 'seller_id']
  },
  MAGALU: {
    name: 'Magazine Luiza',
    icon: '🏬',
    color: 'blue',
    fields: ['api_key', 'seller_id']
  }
};

const MarketplaceIntegration = () => {
  const [integrations, setIntegrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [formData, setFormData] = useState({});
  const [syncLoading, setSyncLoading] = useState({});

  useEffect(() => {
    fetchIntegrations();
    fetchStats();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      if (result.success) {
        setIntegrations(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/stats', {
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

  const handleOpenModal = (platform) => {
    setSelectedPlatform(platform);
    setFormData({
      plataforma: platform,
      nome_integracao: '',
      credenciais: {},
      config: {
        sync_auto: false,
        sync_interval_minutes: 60
      }
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlatform(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('credenciais.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        credenciais: {
          ...prev.credenciais,
          [field]: value
        }
      }));
    } else if (name.startsWith('config.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/integrations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Integração criada com sucesso!');
        handleCloseModal();
        fetchIntegrations();
        fetchStats();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao criar integração:', error);
      alert('Erro ao criar integração');
    }
  };

  const handleTestConnection = async (integrationId) => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integration_id: integrationId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Conexão estabelecida com sucesso!');
        fetchIntegrations();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('Erro ao testar conexão');
    }
  };

  const handleSyncProducts = async (integrationId) => {
    setSyncLoading(prev => ({ ...prev, [`products_${integrationId}`]: true }));

    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/sync/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integration_id: integrationId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Sincronização concluída!\n${result.data.success} produtos sincronizados\n${result.data.errors} erros`);
        fetchIntegrations();
        fetchStats();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error);
      alert('Erro ao sincronizar produtos');
    } finally {
      setSyncLoading(prev => ({ ...prev, [`products_${integrationId}`]: false }));
    }
  };

  const handleSyncStock = async (integrationId) => {
    setSyncLoading(prev => ({ ...prev, [`stock_${integrationId}`]: true }));

    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/sync/stock', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integration_id: integrationId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Estoque sincronizado!\n${result.data.success} produtos atualizados`);
        fetchIntegrations();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar estoque:', error);
      alert('Erro ao sincronizar estoque');
    } finally {
      setSyncLoading(prev => ({ ...prev, [`stock_${integrationId}`]: false }));
    }
  };

  const handleSyncOrders = async (integrationId) => {
    setSyncLoading(prev => ({ ...prev, [`orders_${integrationId}`]: true }));

    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch('http://localhost:5000/api/marketplace/import/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integration_id: integrationId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Pedidos importados!\n${result.data.imported} novos pedidos\n${result.data.skipped} já existentes`);
        fetchIntegrations();
        fetchStats();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao importar pedidos:', error);
      alert('Erro ao importar pedidos');
    } finally {
      setSyncLoading(prev => ({ ...prev, [`orders_${integrationId}`]: false }));
    }
  };

  const handleToggleStatus = async (integration) => {
    const newStatus = integration.status === 'ATIVA' ? 'INATIVA' : 'ATIVA';

    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch(`http://localhost:5000/api/marketplace/integrations/${integration.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        fetchIntegrations();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleDelete = async (integrationId) => {
    if (!confirm('Tem certeza que deseja remover esta integração?')) {
      return;
    }

    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch(`http://localhost:5000/api/marketplace/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Integração removida com sucesso!');
        fetchIntegrations();
        fetchStats();
      } else {
        alert(`Erro: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('Erro ao remover integração:', error);
      alert('Erro ao remover integração');
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Integrações com Marketplaces</h1>
          <p className="text-gray-600">Conecte sua loja com Mercado Livre, Shopee, Amazon e outros marketplaces</p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Total de Integrações</h3>
              <p className="text-3xl font-bold">{stats.total_integrations}</p>
              <p className="text-sm opacity-80 mt-1">{stats.active} ativas</p>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Produtos Sincronizados</h3>
              <p className="text-3xl font-bold">{stats.total_products_synced}</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Pedidos Importados</h3>
              <p className="text-3xl font-bold">{stats.total_orders_imported}</p>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Plataformas</h3>
              <p className="text-3xl font-bold">{Object.keys(stats.by_platform).length}</p>
            </Card>
          </div>
        )}

        {/* Marketplaces Disponíveis */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Conectar Novo Marketplace</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(PLATFORMS).map(([key, platform]) => {
              const hasIntegration = integrations.some(i => i.plataforma === key);
              
              return (
                <button
                  key={key}
                  onClick={() => !hasIntegration && handleOpenModal(key)}
                  disabled={hasIntegration}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    hasIntegration
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                      : 'border-gray-300 hover:border-blue-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="text-4xl mb-2">{platform.icon}</div>
                  <div className="text-sm font-semibold text-gray-700">{platform.name}</div>
                  {hasIntegration && (
                    <div className="text-xs text-green-600 mt-1">✓ Conectado</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Lista de Integrações */}
        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Integrações Configuradas</h2>
          
          {integrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Nenhuma integração configurada</p>
              <p className="text-sm">Conecte um marketplace para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map(integration => {
                const platform = PLATFORMS[integration.plataforma];
                
                return (
                  <div key={integration.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{platform?.icon}</span>
                        <div>
                          <h3 className="font-bold text-lg">{platform?.name}</h3>
                          <p className="text-sm text-gray-600">
                            {integration.nome_integracao || integration.plataforma}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          integration.status === 'ATIVA' ? 'bg-green-100 text-green-700' :
                          integration.status === 'ERRO' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {integration.status}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-gray-600">Produtos Sync</p>
                        <p className="font-semibold">{integration.total_produtos_sync}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Pedidos Importados</p>
                        <p className="font-semibold">{integration.total_pedidos_importados}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Última Sync</p>
                        <p className="font-semibold">
                          {integration.ultima_sync
                            ? new Date(integration.ultima_sync).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(integration.id)}
                      >
                        Testar Conexão
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSyncProducts(integration.id)}
                        disabled={syncLoading[`products_${integration.id}`]}
                      >
                        {syncLoading[`products_${integration.id}`] ? 'Sincronizando...' : 'Sync Produtos'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSyncStock(integration.id)}
                        disabled={syncLoading[`stock_${integration.id}`]}
                      >
                        {syncLoading[`stock_${integration.id}`] ? 'Sincronizando...' : 'Sync Estoque'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleImportOrders(integration.id)}
                        disabled={syncLoading[`orders_${integration.id}`]}
                      >
                        {syncLoading[`orders_${integration.id}`] ? 'Importando...' : 'Importar Pedidos'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={integration.status === 'ATIVA' ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(integration)}
                      >
                        {integration.status === 'ATIVA' ? 'Desativar' : 'Ativar'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(integration.id)}
                      >
                        Remover
                      </Button>
                    </div>

                    {integration.ultimo_erro && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Último erro:</strong> {integration.ultimo_erro}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Modal de Configuração */}
        {showModal && selectedPlatform && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Conectar {PLATFORMS[selectedPlatform].name}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Integração (opcional)
                    </label>
                    <input
                      type="text"
                      name="nome_integracao"
                      value={formData.nome_integracao || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ex: Loja Principal"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Credenciais</h3>
                    {PLATFORMS[selectedPlatform].fields.map(field => (
                      <div key={field} className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          name={`credenciais.${field}`}
                          value={formData.credenciais?.[field] || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder={`Digite o ${field}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Configurações</h3>
                    
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        name="config.sync_auto"
                        checked={formData.config?.sync_auto || false}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Sincronização Automática
                      </label>
                    </div>

                    {formData.config?.sync_auto && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Intervalo (minutos)
                        </label>
                        <input
                          type="number"
                          name="config.sync_interval_minutes"
                          value={formData.config?.sync_interval_minutes || 60}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          min="15"
                          max="1440"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" className="flex-1">
                      Conectar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceIntegration;
