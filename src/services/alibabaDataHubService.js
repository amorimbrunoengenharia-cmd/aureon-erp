/**
 * Serviço de Integração com Alibaba DataHub via RapidAPI
 * 
 * API: https://rapidapi.com/datahub/api/alibaba-datahub
 * 
 * Endpoints Documentados:
 * - /item_detail?itemId=xxx - Detalhes do produto
 * - /item_sku?itemId=xxx - SKUs/Variações
 * - /item_reviews?itemId=xxx - Avaliações
 * 
 * NOTA: Esta API não tem endpoint de busca (/search)
 * Ela funciona apenas com itemId específico do Alibaba
 */

const DATAHUB_HOST = 'alibaba-datahub.p.rapidapi.com';
const DATAHUB_BASE_URL = 'https://alibaba-datahub.p.rapidapi.com';

/**
 * MOCK: Buscar produtos (API DataHub não tem endpoint de busca)
 * Para buscar produtos, use a API "Alibaba API" em vez desta
 */
export const searchAlibabaDataHub = async (searchTerm, page = 1) => {
  const apiKey = localStorage.getItem('rapidapi_key');
  
  if (!apiKey) {
    console.warn('⚠️ Configure sua RapidAPI Key em: Configurações > Integrações');
    return [];
  }

  // NOTA: Alibaba DataHub NÃO tem endpoint de busca
  // Retornando produtos de exemplo com itemIds reais do Alibaba
  console.warn('⚠️ Alibaba DataHub não tem endpoint de busca.');
  console.warn('💡 Use itemIds específicos ou assine a API "Alibaba API" para buscar.');
  
  // Produtos de exemplo com itemIds reais
  const mockProducts = [
    {
      id: '1600798906682',
      itemId: '1600798906682',
      name: 'Fashion Sunglasses UV400 Protection',
      description: 'High quality sunglasses with UV400 protection',
      supplier: 'Exemplo - Use itemId real',
      rating: '4.8',
      orders: 1500,
      price: { min: 2.5, max: 5.0, currency: 'USD' },
      moq: 100,
      image: 'https://via.placeholder.com/400x400/0A0A0C/D4AF37?text=Use+itemId+Real',
      link: 'https://www.alibaba.com/product-detail/1600798906682',
      realData: false
    }
  ];
  
  return mockProducts;
};

/**
 * Obter detalhes de um produto específico
 * Equivalente ao código XMLHttpRequest da RapidAPI convertido para fetch moderno
 */
export const getProductDetails = async (itemId) => {
  const apiKey = localStorage.getItem('rapidapi_key');
  
  if (!apiKey) {
    throw new Error('API Key não configurada');
  }

  try {
    const url = `${DATAHUB_BASE_URL}/item_detail?itemId=${itemId}`;
    
    console.log('🔄 Buscando detalhes do produto:', itemId);
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': DATAHUB_HOST
      }
    });

    console.log('📥 Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dados recebidos:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao obter detalhes do produto:', error);
    throw error;
  }
};

/**
 * Obter SKUs/Variações de um produto
 * Este é o exato endpoint que você testou: item_sku?itemId=1600798906682
 */
export const getProductSKUs = async (itemId) => {
  const apiKey = localStorage.getItem('rapidapi_key');
  
  if (!apiKey) {
    throw new Error('API Key não configurada');
  }

  try {
    // Mesmo endpoint do exemplo que você recebeu
    const url = `${DATAHUB_BASE_URL}/item_sku?itemId=${itemId}`;
    
    console.log('🔄 Buscando SKUs do produto:', itemId);
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': DATAHUB_HOST
      }
    });

    console.log('📥 Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ SKUs recebidos:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao obter SKUs:', error);
    throw error;
  }
};

/**
 * Processar resultados da API DataHub
 */
function processDataHubResults(data) {
  if (!data || !data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item, index) => ({
    id: item.itemId || `item-${Date.now()}-${index}`,
    name: item.title || item.subject || 'Produto sem nome',
    description: item.description || '',
    supplier: item.companyName || item.sellerName || 'Fornecedor',
    rating: item.tradeScore || item.rating || '4.5',
    orders: item.saleCount || item.orderCount || 0,
    price: {
      min: parseFloat(item.minPrice || item.priceRange?.min || 0),
      max: parseFloat(item.maxPrice || item.priceRange?.max || 0),
      currency: item.currency || 'USD'
    },
    moq: item.moq || item.minOrderQuantity || 100,
    image: processImageUrl(item.imageUrl || item.productImage || item.image),
    link: item.detailUrl || item.productUrl || `https://www.alibaba.com/product-detail/${item.itemId}`,
    realData: true,
    itemId: item.itemId
  }));
}

/**
 * Processar URL da imagem
 */
function processImageUrl(url) {
  if (!url) return 'https://via.placeholder.com/400x400/0A0A0C/D4AF37?text=Produto';
  
  // Se já é URL completa
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Se começa com //
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // URL relativa
  return 'https://sc04.alicdn.com' + url;
}

/**
 * Obter taxa de câmbio USD → BRL
 */
export const getExchangeRate = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.BRL || 5.0; // Fallback 5.0
  } catch (error) {
    console.error('Erro ao obter taxa de câmbio:', error);
    return 5.0; // Taxa padrão
  }
};

/**
 * Converter preço USD para BRL
 */
export const convertToBRL = async (priceUSD) => {
  const rate = await getExchangeRate();
  return priceUSD * rate;
};

/**
 * Testar conexão com a API usando itemId de exemplo
 */
export const testConnection = async () => {
  const apiKey = localStorage.getItem('rapidapi_key');
  
  if (!apiKey) {
    return {
      success: false,
      message: 'API Key não configurada'
    };
  }

  try {
    // Testar com itemId do exemplo que você recebeu
    const itemId = '1600798906682';
    const details = await getProductDetails(itemId);
    
    return {
      success: true,
      message: `✅ Conexão OK! API funcionando corretamente`,
      data: details
    };
    
  } catch (error) {
    return {
      success: false,
      message: `❌ Erro: ${error.message}`,
      error: error.message
    };
  }
};

export default {
  searchAlibabaDataHub,
  getProductDetails,
  getProductSKUs,
  getExchangeRate,
  convertToBRL,
  testConnection
};
