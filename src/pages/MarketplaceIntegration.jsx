import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PLATFORMS = {
  MERCADO_LIVRE: {
    name: 'Mercado Livre',
    icon: '🛒',
    logo: 'https://github.com/user-attachments/assets/b55f75eb-ae33-4cbb-ab86-ad8b45e9cdc7',
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134 30" fill="#FFE600"><path fill="#2D3277" d="M122.5 14.8c0 3.2-2.4 5.7-5.8 5.7-3.3 0-5.8-2.5-5.8-5.7 0-3.2 2.5-5.7 5.8-5.7 3.4 0 5.8 2.5 5.8 5.7m-5.8-8.3c-4.7 0-8.5 3.6-8.5 8.3s3.8 8.3 8.5 8.3 8.5-3.6 8.5-8.3-3.8-8.3-8.5-8.3M106.5 7.8h-2.7v15.3h2.7V7.8zM78 14.8c0 3.2-2.4 5.7-5.8 5.7-3.3 0-5.8-2.5-5.8-5.7 0-3.2 2.5-5.7 5.8-5.7 3.4 0 5.8 2.5 5.8 5.7m-5.8-8.3c-4.7 0-8.5 3.6-8.5 8.3s3.8 8.3 8.5 8.3 8.5-3.6 8.5-8.3-3.8-8.3-8.5-8.3M53.8 7.8v1.5c-1.3-1.2-3.1-2-5.2-2-4.4 0-7.9 3.6-7.9 8.3s3.5 8.3 7.9 8.3c2 0 3.9-.8 5.2-2v1.5h2.7V7.8h-2.7zm-4.9 12.7c-3.3 0-5.8-2.5-5.8-5.7 0-3.2 2.5-5.7 5.8-5.7s5.8 2.5 5.8 5.7c0 3.2-2.5 5.7-5.8 5.7M103.5 9.1c-1.3-1.2-3.1-2-5.2-2-4.4 0-7.9 3.6-7.9 8.3s3.5 8.3 7.9 8.3c2 0 3.9-.8 5.2-2v1.5h2.7V7.8h-2.7v1.3zm-4.9 11.4c-3.3 0-5.8-2.5-5.8-5.7 0-3.2 2.5-5.7 5.8-5.7s5.8 2.5 5.8 5.7c0 3.2-2.5 5.7-5.8 5.7M27 14.8c0 3.2-2.5 5.7-5.8 5.7-3.4 0-5.8-2.5-5.8-5.7 0-3.2 2.4-5.7 5.8-5.7 3.3 0 5.8 2.5 5.8 5.7m-5.8-8.3c-2.1 0-3.9.8-5.2 2V.8h-2.7v22.3H16v-1.5c1.3 1.2 3.1 2 5.2 2 4.4 0 7.9-3.6 7.9-8.3s-3.5-8.3-7.9-8.3M134 14.8c0 4.5-3.7 8.2-8.3 8.2-2.5 0-4.7-1.1-6.2-2.8l2-1.7c1.2 1.3 2.8 2 4.7 2 2.9 0 5.3-2.4 5.3-5.3V.8h2.5v14z"/></svg>`,
    color: '#FFE600',
    bgColor: '#FFF159',
    textColor: '#2D3277',
    fields: ['client_id', 'client_secret', 'access_token', 'refresh_token', 'seller_id']
  },
  SHOPEE: {
    name: 'Shopee',
    icon: '🛍️',
    logo: 'https://github.com/user-attachments/assets/d8a28bca-c9c8-4db7-b4f8-3f4ed1a82f8e',
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 65" fill="#EE4D2D"><path d="M35.6 12.8c-7.5-2-14 2-14 2l-.5-2S27 7.7 35.6 9.7c8 2 13.5 12 13.5 12l-2 1.2s-4-8.1-11.5-10.1M28 21.5c-5.3 0-9.5 4.3-9.5 9.5s4.3 9.5 9.5 9.5c5.3 0 9.5-4.3 9.5-9.5s-4.2-9.5-9.5-9.5m31.2 18.9c-5.3 0-9.5-4.3-9.5-9.5s4.3-9.5 9.5-9.5c5.3 0 9.5 4.3 9.5 9.5s-4.2 9.5-9.5 9.5M127 0h-8v43h8V0zm-21 20c-6 0-10 4-10 10v13h8V30c0-2 1-4 3-4s3 2 3 4v13h8V29c0-6-4-10-10-10h-2zm-43 0c-6 0-11 5-11 11s5 11 11 11c4 0 7-2 9-5l-6-4c-1 1-2 2-3 2-3 0-5-2-5-5s2-5 5-5c1 0 2 1 3 2l6-4c-2-3-5-5-9-5zm83 0c-6 0-11 5-11 11s5 11 11 11c4 0 7-2 9-5l-6-4c-1 1-2 2-3 2-3 0-5-2-5-5s2-5 5-5c1 0 2 1 3 2l6-4c-2-3-5-5-9-5zm-62 0c-6 0-11 5-11 11v19h8V41c2 1 4 1 6 1 6 0 11-5 11-11s-5-11-11-11h-3zm0 7c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5z"/></svg>`,
    color: '#EE4D2D',
    bgColor: '#EE4D2D',
    textColor: '#FFFFFF',
    fields: ['partner_id', 'partner_key', 'shop_id']
  },
  AMAZON: {
    name: 'Amazon',
    icon: '📦',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png',
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 603 182"><g fill="#FF9900"><path d="M374 120.9c-33 24-81 37-122 37-58 0-110-21-149-57-3-3 0-7 3-5 42 24 94 39 148 39 36 0 76-8 113-23 6-2 10 4 7 9M387 105c-4-6-28-3-39-1-3 0-4-3 0-5 19-13 50-9 54-5s-1 32-17 45c-3 2-6 1-4-2 4-9 12-30 8-36"/></g><g fill="#221F1F"><path d="M346 26V13c0-2 2-3 3-3h62c2 0 3 1 3 3v11c0 2-2 4-3 7l-32 46c12 0 24 2 35 8 2 1 3 3 3 5v14c0 2-2 4-4 3-16-9-38-10-56 0-2 1-4-1-4-3V87c0-2 0-6 2-9l37-53h-32c-2 0-3-1-3-3m-111 69c-6 0-11-5-11-11V12c0-2 2-4 4-4h16c2 0 4 2 4 4v9h0c4-10 12-15 22-15 10 0 17 5 21 15 4-10 14-15 23-15 7 0 15 3 20 10 5 7 4 17 4 26v41c0 6-5 11-11 11h-16c-6 0-11-5-11-11V46c0-4 0-13-1-16-1-5-4-7-9-7-4 0-8 3-10 6-2 4-2 10-2 16v39c0 6-5 11-11 11h-16c-6 0-11-5-11-11V46c0-8 1-20-10-20-11 0-10 12-10 20v38c0 6-5 11-11 11h-16m229-65c24 0 37 21 37 47 0 26-15 46-37 46-24 0-36-21-36-46 0-26 13-47 36-47m0 17c-12 0-13 16-13 26 0 10 0 31 13 31 12 0 13-17 13-28 0-7 0-15-2-21-1-5-4-8-8-8h-3m66 48c-6 0-11-5-11-11V12c0-6 6-10 12-10h15c6 0 10 4 10 9v10h0c4-14 11-21 25-21 8 0 16 3 21 11 5 7 5 19 5 28v45c0 6-6 11-12 11h-16c-6 0-10-5-10-10V49c0-12 1-29-13-29-5 0-10 3-12 8-3 6-4 12-4 18v38c0 6-5 11-11 11l-16-1M80 10c21 0 32 18 32 40 0 22-12 39-32 39-20 0-31-18-31-39C49 28 60 10 80 10m0 14c-10 0-11 14-11 23 0 8 0 27 11 27s11-15 11-24c0-6 0-13-2-19-1-5-3-7-7-7h-2m-47 71c-6 0-11-5-11-11V12c0-6 6-10 12-10h15c6 0 10 4 10 9v10h0c4-14 11-21 25-21 8 0 16 3 21 11 5 7 5 19 5 28v45c0 6-6 11-12 11H82c-6 0-10-5-10-10V49c0-12 1-29-13-29-5 0-10 3-12 8-3 6-4 12-4 18v38c0 6-5 11-11 11l-16-1"/></g></svg>`,
    color: '#FF9900',
    bgColor: '#232F3E',
    textColor: '#FFFFFF',
    fields: ['seller_id', 'access_token', 'marketplace_id']
  },
  B2W: {
    name: 'Americanas',
    icon: '🏪',
    logo: 'https://github.com/user-attachments/assets/2de38fce-19e2-46a0-943e-42c36e0406ba',
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><g fill="#E31F26"><path d="M15 35l-2-5H5l-2 5H0L10 5h5l10 30h-3zm-6-8l-4-11-4 11h8zM40 35V19l-6 16h-3l-6-16v16h-3V5h4l7 18 7-18h4v30h-3zM60 35V8h-7V5h17v3h-7v27h-3zM88 8v9h9v3h-9v12h10v3H75V5h23v3h-10zM115 35l-2-5h-8l-2 5h-3L110 5h5l10 30h-3zm-6-8l-4-11-4 11h8zM140 35l-4-8h-6v8h-3V5h10c5 0 9 4 9 9v4c0 4-3 7-7 8l4 9h-3zm-10-11h7c3 0 6-2 6-6V14c0-4-3-6-6-6h-7v16zM160 35V5h3v30h-3zM185 35l-2-5h-8l-2 5h-3L180 5h5l10 30h-3zm-6-8l-4-11-4 11h8zM200 35V5h3v27h10v3h-13z"/></g></svg>`,
    color: '#E31F26',
    bgColor: '#E31F26',
    textColor: '#FFFFFF',
    fields: ['client_id', 'client_secret', 'seller_id']
  },
  MAGALU: {
    name: 'Magazine Luiza',
    icon: '🏬',
    logo: 'https://github.com/user-attachments/assets/0d74e0b8-8a4c-412d-a82c-54dac1097d28',
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><g fill="#0086FF"><path d="M20 10l-5 30H5L0 10h5l3 22 3-22h4l3 22 3-22h5zM45 40l-1-3h-12l-1 3h-5l10-30h8l10 30h-9zm-8-12l-3-12-3 12h6zM80 25v15h-5V25c0-4-2-7-6-7s-6 3-6 7v15h-5V10h5v2c2-2 4-3 7-3 6 0 10 4 10 10v6zM105 40c-7 0-12-5-12-12v-8c0-7 5-12 12-12s12 5 12 12v8c0 7-5 12-12 12zm0-4c4 0 7-3 7-8v-8c0-5-3-8-7-8s-7 3-7 8v8c0 5 3 8 7 8zM147 23c0 8-6 14-14 14h-8V10h8c8 0 14 6 14 14v-1zm-5 0c0-5-4-9-9-9h-3v18h3c5 0 9-4 9-9zM172 40l-1-3h-12l-1 3h-5l10-30h8l10 30h-9zm-8-12l-3-12-3 12h6zM200 40h-5V14h-6v-4h17v4h-6v26z"/></g></svg>`,
    color: '#0086FF',
    bgColor: '#0086FF',
    textColor: '#FFFFFF',
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

  // Buscar canais ativos das configurações
  const getCanaisAtivos = () => {
    const configStr = localStorage.getItem('aureon_config');
    if (configStr) {
      const config = JSON.parse(configStr);
      return config.canaisAtivos || [];
    }
    return ['mercado-livre', 'whatsapp', 'loja-fisica']; // Default
  };

  const canaisAtivos = getCanaisAtivos();

  // Mapear plataformas para IDs de canais
  const platformToChannelMap = {
    'MERCADO_LIVRE': 'mercado-livre',
    'SHOPEE': 'shopee',
    'AMAZON': 'amazon',
    'B2W': 'americanas',
    'MAGALU': 'magazine-luiza'
  };

  // Filtrar plataformas disponíveis baseado nos canais ativos
  const platformsDisponiveis = Object.entries(PLATFORMS).filter(([key, platform]) => {
    const channelId = platformToChannelMap[key];
    return channelId && canaisAtivos.includes(channelId);
  });

  useEffect(() => {
    fetchIntegrations();
    fetchStats();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch(`${API_URL}/marketplace/integrations`, {
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
      // Silenciar erro se backend não estiver disponível
      if (error.message?.includes('Failed to fetch')) {
        console.warn('⚠️ Backend não disponível (porta 5000). Usando modo offline.');
        setIntegrations([]);
      } else {
        console.error('Erro ao buscar integrações:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('aureon_token');
      const tenantId = localStorage.getItem('tenantId');

      const response = await fetch(`${API_URL}/marketplace/stats`, {
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
      // Silenciar erro se backend não estiver disponível
      if (error.message?.includes('Failed to fetch')) {
        console.warn('⚠️ Backend não disponível (porta 5000). Stats não carregadas.');
        setStats(null);
      } else {
        console.error('Erro ao buscar estatísticas:', error);
      }
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

      const response = await fetch(`${API_URL}/marketplace/integrations`, {
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

      const response = await fetch(`${API_URL}/marketplace/test-connection`, {
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

      const response = await fetch(`${API_URL}/marketplace/sync/products`, {
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

      const response = await fetch(`${API_URL}/marketplace/sync/stock`, {
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

      const response = await fetch(`${API_URL}/marketplace/import/orders`, {
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

      const response = await fetch(`${API_URL}/marketplace/integrations/${integration.id}`, {
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

      const response = await fetch(`${API_URL}/marketplace/integrations/${integrationId}`, {
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
    <div className="p-6 min-h-screen tab-content-transition">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Integrações com Marketplaces</h1>
          <p className="text-white/80">Conecte sua loja com Mercado Livre, Shopee, Amazon e outros marketplaces</p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="card-aureon-interactive bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-700/50 text-white">
              <h3 className="text-sm font-semibold text-blue-300 mb-1">Total de Integrações</h3>
              <p className="text-3xl font-bold">{stats.total_integrations}</p>
              <p className="text-sm text-blue-200 mt-1">{stats.active} ativas</p>
            </Card>

            <Card className="card-aureon-interactive bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-700/50 text-white">
              <h3 className="text-sm font-semibold text-green-300 mb-1">Produtos Sincronizados</h3>
              <p className="text-3xl font-bold">{stats.total_products_synced}</p>
            </Card>

            <Card className="card-aureon-interactive bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-700/50 text-white">
              <h3 className="text-sm font-semibold text-purple-300 mb-1">Pedidos Importados</h3>
              <p className="text-3xl font-bold">{stats.total_orders_imported}</p>
            </Card>

            <Card className="card-aureon-interactive bg-gradient-to-br from-orange-900/40 to-orange-800/40 border-orange-700/50 text-white">
              <h3 className="text-sm font-semibold text-orange-300 mb-1">Plataformas Disponíveis</h3>
              <p className="text-3xl font-bold">{platformsDisponiveis.length}</p>
            </Card>
          </div>
        )}

        {/* Marketplaces Disponíveis */}
        <Card className="mb-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Conectar Novo Marketplace</h2>
          
          {platformsDisponiveis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">Nenhum marketplace disponível</p>
              <p className="text-sm text-gray-500">Ative canais em Configurações → Canais para conectar marketplaces</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {platformsDisponiveis.map(([key, platform]) => {
                const hasIntegration = integrations.some(i => i.plataforma === key);
                
                return (
                  <button
                    key={key}
                    onClick={() => !hasIntegration && handleOpenModal(key)}
                    disabled={hasIntegration}
                    style={{ backgroundColor: hasIntegration ? undefined : platform.bgColor + '20' }}
                    className={`p-6 border-2 rounded-xl text-center transition-all ${
                      hasIntegration
                        ? 'border-gray-600 bg-gray-700/50 cursor-not-allowed opacity-50'
                        : 'border-gray-700 hover:scale-105 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                  <div className="flex justify-center items-center h-16 mb-3">
                    <img 
                      src={platform.logo} 
                      alt={platform.name}
                      className="max-h-12 max-w-full object-contain filter drop-shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="text-4xl hidden">{platform.icon}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-200">{platform.name}</div>
                  {hasIntegration && (
                    <div className="text-xs text-green-400 mt-2 flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Conectado
                    </div>
                  )}
                </button>
              );
            })}
            </div>
          )}
        </Card>

        {/* Lista de Integrações */}
        <Card className="bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Integrações Configuradas</h2>
          
          {integrations.length === 0 ? (
            <div className="text-center py-12 text-white/80">
              <p className="text-lg mb-2">Nenhuma integração configurada</p>
              <p className="text-sm">Conecte um marketplace para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map(integration => {
                const platform = PLATFORMS[integration.plataforma];
                
                return (
                  <div key={integration.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg p-2">
                          <img 
                            src={platform?.logo} 
                            alt={platform?.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="text-2xl hidden">{platform?.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{platform?.name}</h3>
                          <p className="text-sm text-white/80">
                            {integration.nome_integracao || integration.plataforma}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          integration.status === 'ATIVA' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                          integration.status === 'ERRO' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                          'bg-gray-700/50 text-white/90 border border-gray-600'
                        }`}>
                          {integration.status}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-white/80">Produtos Sync</p>
                        <p className="font-semibold text-gray-200">{integration.total_produtos_sync}</p>
                      </div>
                      <div>
                        <p className="text-white/80">Pedidos Importados</p>
                        <p className="font-semibold text-gray-200">{integration.total_pedidos_importados}</p>
                      </div>
                      <div>
                        <p className="text-white/80">Última Sync</p>
                        <p className="font-semibold text-gray-200">
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
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Conectar {PLATFORMS[selectedPlatform].name}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-1">
                      Nome da Integração (opcional)
                    </label>
                    <input
                      type="text"
                      name="nome_integracao"
                      value={formData.nome_integracao || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Ex: Loja Principal"
                    />
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="font-semibold mb-3 text-white">Credenciais</h3>
                    {PLATFORMS[selectedPlatform].fields.map(field => (
                      <div key={field} className="mb-3">
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          name={`credenciais.${field}`}
                          value={formData.credenciais?.[field] || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder={`Digite o ${field}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="font-semibold mb-3 text-white">Configurações</h3>
                    
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        name="config.sync_auto"
                        checked={formData.config?.sync_auto || false}
                        onChange={handleInputChange}
                        className="mr-2 bg-gray-900 border-gray-600"
                      />
                      <label className="text-sm font-medium text-white/90">
                        Sincronização Automática
                      </label>
                    </div>

                    {formData.config?.sync_auto && (
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Intervalo (minutos)
                        </label>
                        <input
                          type="number"
                          name="config.sync_interval_minutes"
                          value={formData.config?.sync_interval_minutes || 60}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
