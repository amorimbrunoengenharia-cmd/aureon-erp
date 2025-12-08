/**
 * Serviço de Integração com Mercado Livre
 * 
 * STATUS: ✅ CREDENCIAIS CONFIGURADAS
 * 
 * Credenciais:
 * - Client ID: 4040995724027537
 * - Client Secret: 0NdiRkBz4TLIEQ9s6FCzkW9ho5r995kT
 * - Redirect URI: http://localhost:5173/mercado-livre/callback
 */

// Credenciais do Mercado Livre
const ML_CLIENT_ID = '4040995724027537';
const ML_CLIENT_SECRET = '0NdiRkBz4TLIEQ9s6FCzkW9ho5r995kT';
const ML_REDIRECT_URI = window.location.origin + '/mercado-livre/callback';

const USE_MOCK = false;
const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const ML_API_URL = 'https://api.mercadolibre.com';

/**
 * Iniciar fluxo de autenticação OAuth
 * Redireciona para página de autorização do Mercado Livre
 */
export const iniciarAutenticacao = () => {
  const authUrl = `${ML_AUTH_URL}?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${encodeURIComponent(ML_REDIRECT_URI)}`;
  
  console.log('🔐 Iniciando autenticação Mercado Livre');
  console.log('Redirect URI:', ML_REDIRECT_URI);
  
  // Salvar estado para validar callback
  localStorage.setItem('ml_auth_started', Date.now().toString());
  
  // Redirecionar para página de autorização do Mercado Livre
  window.location.href = authUrl;
  return true;
};

/**
 * Trocar código de autorização por access token
 * @param {string} code - Código recebido após autorização
 * @returns {Promise<string|null>} Access token ou null se falhar
 */
export const trocarCodigoPorToken = async (code) => {
  try {
    console.log('🔄 Trocando código por token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', ML_CLIENT_ID);
    params.append('client_secret', ML_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', ML_REDIRECT_URI);
    
    const response = await fetch(`${ML_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro ao trocar código:', error);
      throw new Error('Erro ao trocar código por token');
    }
    
    const data = await response.json();
    console.log('✅ Token obtido com sucesso!');
    
    // Salvar tokens no localStorage
    localStorage.setItem('ml_token', data.access_token);
    localStorage.setItem('ml_refresh_token', data.refresh_token);
    localStorage.setItem('ml_expires', Date.now() + data.expires_in * 1000);
    localStorage.setItem('ml_user_id', data.user_id);
    localStorage.setItem('ml_connected', 'true');
    localStorage.removeItem('ml_auth_started');
    
    return data.access_token;
  } catch (error) {
    console.error('❌ Erro ao obter token:', error);
    return null;
  }
};

/**
 * Verificar se token está válido e renovar se necessário
 * @returns {Promise<string|null>} Token válido ou null
 */
export const getValidToken = async () => {
  const token = localStorage.getItem('ml_token');
  const expires = localStorage.getItem('ml_expires');
  
  if (!token || !expires) return null;
  
  // Se token expira em menos de 1 hora, renovar
  if (Date.now() > (parseInt(expires) - 3600000)) {
    return await renovarToken();
  }
  
  return token;
};

/**
 * Renovar access token usando refresh token
 * @returns {Promise<string|null>}
 */
export const renovarToken = async () => {
  if (USE_MOCK) return null;
  
  try {
    const refresh_token = localStorage.getItem('ml_refresh_token');
    
    if (!refresh_token) {
      throw new Error('Refresh token não encontrado');
    }
    
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token })
    });
    
    if (!response.ok) {
      throw new Error('Erro ao renovar token');
    }
    
    const { access_token, expires_in } = await response.json();
    
    localStorage.setItem('ml_token', access_token);
    localStorage.setItem('ml_expires', Date.now() + expires_in * 1000);
    
    return access_token;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    desconectar();
    return null;
  }
};

/**
 * Desconectar e limpar tokens
 */
export const desconectar = () => {
  localStorage.removeItem('ml_token');
  localStorage.removeItem('ml_refresh_token');
  localStorage.removeItem('ml_expires');
  localStorage.removeItem('ml_connected');
};

/**
 * Verificar se está conectado
 * @returns {boolean}
 */
export const isConectado = () => {
  return localStorage.getItem('ml_connected') === 'true';
};

/**
 * Buscar pedidos do Mercado Livre
 * @param {object} options - Opções de filtro
 * @returns {Promise<Array>} Lista de pedidos
 */
export const buscarPedidos = async (options = {}) => {
  if (USE_MOCK) return mockPedidos();
  
  try {
    const token = await getValidToken();
    
    if (!token) {
      throw new Error('Token inválido ou expirado');
    }
    
    const params = new URLSearchParams({
      sort: options.sort || 'date_desc',
      limit: options.limit || 50,
      offset: options.offset || 0
    });
    
    const response = await fetch(`${API_URL}/orders?${params}`, {
      headers: { access_token: token }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar pedidos');
    }
    
    const { orders } = await response.json();
    return orders;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
};

/**
 * Buscar produtos listados no Mercado Livre
 * @returns {Promise<Array>}
 */
export const buscarProdutos = async () => {
  if (USE_MOCK) return mockProdutos();
  
  try {
    const token = await getValidToken();
    
    if (!token) {
      throw new Error('Token inválido');
    }
    
    const response = await fetch(`${API_URL}/items`, {
      headers: { access_token: token }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    
    const { items } = await response.json();
    return items;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
};

/**
 * Criar anúncio no Mercado Livre
 * @param {object} produto - Dados do produto
 * @returns {Promise<object|null>}
 */
export const criarAnuncio = async (produto) => {
  if (USE_MOCK) {
    alert('🎉 Produto publicado com sucesso!\n\n(Modo simulação - Backend necessário para publicação real)');
    return { id: 'MLB' + Date.now(), success: true };
  }
  
  try {
    const token = await getValidToken();
    
    if (!token) {
      throw new Error('Token inválido');
    }
    
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: token
      },
      body: JSON.stringify({
        title: produto.title,
        price: produto.price,
        quantity: produto.quantity,
        description: produto.description,
        pictures: produto.pictures || []
      })
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar anúncio');
    }
    
    const { item } = await response.json();
    return item;
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    return null;
  }
};

/**
 * Sincronizar pedidos do ML com o ERP
 * @param {Function} addVenda - Função para adicionar venda no contexto
 * @returns {Promise<number>} Quantidade de pedidos importados
 */
export const sincronizarPedidos = async (addVenda) => {
  const pedidos = await buscarPedidos({ limit: 100 });
  
  let importados = 0;
  
  pedidos.forEach(pedido => {
    try {
      addVenda({
        data: new Date(pedido.date).toLocaleDateString('pt-BR'),
        canal: 'Mercado Livre',
        cliente: pedido.buyer,
        produtos: pedido.items.map(item => ({
          nome: item.title,
          quantidade: item.quantity,
          preco: item.unit_price
        })),
        total: pedido.total,
        status: pedido.status,
        idExterno: pedido.id,
        feedback: pedido.feedback || null
      });
      importados++;
    } catch (error) {
      console.error('Erro ao importar pedido:', pedido.id, error);
    }
  });
  
  return importados;
};

/**
 * Buscar dados completos do usuário do Mercado Livre
 * @returns {Promise<object|null>}
 */
export const buscarDadosUsuario = async () => {
  if (USE_MOCK) return mockUsuario();
  
  try {
    const token = await getValidToken();
    if (!token) throw new Error('Token inválido');
    
    const response = await fetch(`${ML_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Erro ao buscar dados do usuário');
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};

/**
 * Buscar feedback/avaliações recebidas
 * @returns {Promise<Array>}
 */
export const buscarFeedback = async () => {
  if (USE_MOCK) return mockFeedback();
  
  try {
    const token = await getValidToken();
    if (!token) throw new Error('Token inválido');
    
    const userId = localStorage.getItem('ml_user_id');
    const response = await fetch(`${ML_API_URL}/reviews/search?seller_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Erro ao buscar feedback');
    
    const { reviews } = await response.json();
    return reviews;
  } catch (error) {
    console.error('Erro ao buscar feedback:', error);
    return [];
  }
};

/**
 * Buscar devoluções/reclamações
 * @returns {Promise<Array>}
 */
export const buscarDevolucoes = async () => {
  if (USE_MOCK) return mockDevolucoes();
  
  try {
    const token = await getValidToken();
    if (!token) throw new Error('Token inválido');
    
    const userId = localStorage.getItem('ml_user_id');
    const response = await fetch(`${ML_API_URL}/claims/search?seller_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Erro ao buscar devoluções');
    
    const { claims } = await response.json();
    return claims;
  } catch (error) {
    console.error('Erro ao buscar devoluções:', error);
    return [];
  }
};

/**
 * Buscar clientes recentes
 * @returns {Promise<Array>}
 */
export const buscarClientes = async () => {
  if (USE_MOCK) return mockClientes();
  
  try {
    const pedidos = await buscarPedidos({ limit: 100 });
    
    // Extrair clientes únicos dos pedidos
    const clientesMap = new Map();
    
    pedidos.forEach(pedido => {
      if (pedido.buyer && pedido.buyer.id) {
        if (!clientesMap.has(pedido.buyer.id)) {
          clientesMap.set(pedido.buyer.id, {
            id: pedido.buyer.id,
            nome: pedido.buyer.nickname,
            email: pedido.buyer.email || 'N/A',
            telefone: pedido.buyer.phone?.number || 'N/A',
            totalCompras: 0,
            valorTotal: 0,
            ultimaCompra: pedido.date_created
          });
        }
        
        const cliente = clientesMap.get(pedido.buyer.id);
        cliente.totalCompras++;
        cliente.valorTotal += pedido.total_amount;
        
        // Atualizar data da última compra se mais recente
        if (new Date(pedido.date_created) > new Date(cliente.ultimaCompra)) {
          cliente.ultimaCompra = pedido.date_created;
        }
      }
    });
    
    return Array.from(clientesMap.values());
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
};

/**
 * Sincronização automática completa
 * @param {object} callbacks - Funções de callback para atualizar o sistema
 * @returns {Promise<object>} Estatísticas da sincronização
 */
export const sincronizacaoAutomatica = async ({ addVenda, addCliente, addDevolucao, updateVenda }) => {
  console.log('🔄 Iniciando sincronização automática...');
  
  const stats = {
    vendas: 0,
    clientes: 0,
    feedback: 0,
    devolucoes: 0,
    erros: []
  };
  
  try {
    // 1. Sincronizar vendas
    const pedidos = await buscarPedidos({ limit: 50 });
    pedidos.forEach(pedido => {
      try {
        addVenda({
          data: new Date(pedido.date_created).toLocaleDateString('pt-BR'),
          canal: 'Mercado Livre',
          cliente: pedido.buyer?.nickname || 'Cliente ML',
          valorVenda: pedido.total_amount,
          status: pedido.status,
          idExterno: pedido.id,
          feedback: pedido.feedback || null
        });
        stats.vendas++;
      } catch (err) {
        stats.erros.push(`Venda ${pedido.id}: ${err.message}`);
      }
    });
    
    // 2. Sincronizar clientes
    const clientes = await buscarClientes();
    clientes.forEach(cliente => {
      try {
        addCliente({
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          origem: 'Mercado Livre',
          idExterno: cliente.id,
          totalCompras: cliente.totalCompras,
          valorTotal: cliente.valorTotal
        });
        stats.clientes++;
      } catch (err) {
        stats.erros.push(`Cliente ${cliente.id}: ${err.message}`);
      }
    });
    
    // 3. Sincronizar feedback
    const feedbacks = await buscarFeedback();
    feedbacks.forEach(fb => {
      try {
        // Atualizar venda correspondente com feedback
        if (fb.order_id && updateVenda) {
          updateVenda(fb.order_id, {
            feedback: {
              rating: fb.rating,
              message: fb.message,
              data: new Date(fb.date_created).toLocaleDateString('pt-BR')
            }
          });
        }
        stats.feedback++;
      } catch (err) {
        stats.erros.push(`Feedback: ${err.message}`);
      }
    });
    
    // 4. Sincronizar devoluções
    const devolucoes = await buscarDevolucoes();
    devolucoes.forEach(dev => {
      try {
        addDevolucao({
          vendaId: dev.order_id,
          motivo: dev.reason,
          status: dev.status,
          valor: dev.amount,
          dataSolicitacao: new Date(dev.date_created).toLocaleDateString('pt-BR'),
          canal: 'Mercado Livre',
          idExterno: dev.id
        });
        stats.devolucoes++;
      } catch (err) {
        stats.erros.push(`Devolução ${dev.id}: ${err.message}`);
      }
    });
    
    console.log('✅ Sincronização concluída:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error);
    stats.erros.push(error.message);
    return stats;
  }
};

/**
 * 🎭 MOCKS - Dados simulados para testes
 */
const mockPedidos = () => [
  {
    id: 'MLB001',
    date_created: new Date().toISOString(),
    buyer: { id: 1, nickname: 'João Silva', email: 'joao@email.com', phone: { number: '11999999999' } },
    total_amount: 149.90,
    status: 'paid',
    items: [
      { title: 'Óculos de Sol Aviador', quantity: 1, unit_price: 149.90 }
    ],
    feedback: { rating: 5, message: 'Produto excelente!' }
  },
  {
    id: 'MLB002',
    date_created: new Date(Date.now() - 86400000).toISOString(),
    buyer: { id: 2, nickname: 'Maria Santos', email: 'maria@email.com' },
    total_amount: 299.80,
    status: 'shipped',
    items: [
      { title: 'Óculos Esportivo UV400', quantity: 2, unit_price: 149.90 }
    ]
  }
];

const mockProdutos = () => [
  {
    id: 'MLB123456',
    title: 'Óculos de Sol Aviador UV400',
    price: 149.90,
    available_quantity: 10,
    sold_quantity: 5,
    status: 'active',
    permalink: 'https://mercadolivre.com.br/...',
    thumbnail: 'https://http2.mlstatic.com/...'
  }
];

const mockUsuario = () => ({
  id: 123456789,
  nickname: 'LOJA_TESTE',
  email: 'loja@teste.com',
  points: 1250,
  seller_reputation: {
    level_id: 'gold',
    power_seller_status: 'gold',
    transactions: {
      completed: 150,
      canceled: 5
    }
  }
});

const mockFeedback = () => [
  {
    id: 1,
    order_id: 'MLB001',
    rating: 5,
    message: 'Excelente produto! Superou as expectativas.',
    date_created: new Date().toISOString(),
    buyer: { nickname: 'João Silva' }
  },
  {
    id: 2,
    order_id: 'MLB002',
    rating: 4,
    message: 'Bom produto, entrega rápida.',
    date_created: new Date(Date.now() - 172800000).toISOString(),
    buyer: { nickname: 'Maria Santos' }
  },
  {
    id: 3,
    order_id: 'MLB003',
    rating: 3,
    message: 'Produto ok, mas a embalagem veio danificada.',
    date_created: new Date(Date.now() - 259200000).toISOString(),
    buyer: { nickname: 'Carlos Oliveira' }
  }
];

const mockDevolucoes = () => [
  {
    id: 'DEV001',
    order_id: 'MLB005',
    reason: 'Produto com defeito',
    status: 'pending',
    amount: 149.90,
    date_created: new Date(Date.now() - 86400000).toISOString(),
    buyer: { nickname: 'Pedro Costa' }
  },
  {
    id: 'DEV002',
    order_id: 'MLB008',
    reason: 'Arrependimento da compra',
    status: 'approved',
    amount: 199.90,
    date_created: new Date(Date.now() - 172800000).toISOString(),
    buyer: { nickname: 'Ana Lima' }
  }
];

const mockClientes = () => [
  {
    id: 1,
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '11999999999',
    totalCompras: 3,
    valorTotal: 449.70,
    ultimaCompra: new Date().toISOString()
  },
  {
    id: 2,
    nome: 'Maria Santos',
    email: 'maria@email.com',
    telefone: '11988888888',
    totalCompras: 2,
    valorTotal: 299.80,
    ultimaCompra: new Date(Date.now() - 86400000).toISOString()
  }
];

/**
 * Validar se backend está disponível
 * @returns {Promise<boolean>}
 */
export const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export default {
  iniciarAutenticacao,
  trocarCodigoPorToken,
  getValidToken,
  renovarToken,
  desconectar,
  isConectado,
  buscarPedidos,
  buscarProdutos,
  criarAnuncio,
  sincronizarPedidos,
  checkBackendStatus
};
