/**
 * Serviço de Integração com Alibaba via RapidAPI
 * 
 * STATUS: 🟢 FUNCIONAL (RapidAPI)
 * 
 * APIs disponíveis:
 * 1. Alibaba API (https://rapidapi.com/logicbuilder/api/alibaba-api)
 * 2. AliExpress Unofficial (https://rapidapi.com/logicbuilder/api/aliexpress-unofficial)
 * 
 * Para ativar:
 * 1. Criar conta em https://rapidapi.com (gratuito)
 * 2. Assinar API do Alibaba (plano gratuito: 100 req/mês)
 * 3. Copiar API Key e adicionar em Settings do ERP
 */

const USE_RAPIDAPI = true; // true = RapidAPI, false = Mock
const USE_MOCK = false; // Fallback se RapidAPI falhar

// RapidAPI endpoints
const RAPIDAPI_HOST = 'alibaba-api3.p.rapidapi.com';
const RAPIDAPI_ENDPOINT = 'https://alibaba-api3.p.rapidapi.com/search';

/**
 * Buscar produtos no Alibaba via RapidAPI
 * @param {string} searchTerm - Termo de busca
 * @param {number} page - Página (default: 1)
 * @param {string} apiKey - Chave da RapidAPI (opcional, usa do localStorage)
 * @returns {Promise<Array>} Lista de produtos
 */
export const searchAlibaba = async (searchTerm, page = 1, apiKey = null) => {
  // Buscar API key do localStorage se não fornecida
  const key = apiKey || localStorage.getItem('rapidapi_key');
  
  // Se não tem API key, usar mock
  if (USE_RAPIDAPI && !key) {
    console.warn('⚠️ API Key da RapidAPI não configurada. Usando dados mock.');
    console.warn('Configure em: Configurações > Sistema > Integrações');
    return await searchMock(searchTerm, page);
  }
  
  if (USE_RAPIDAPI && key) {
    try {
      return await searchRapidAPI(searchTerm, page, key);
    } catch (error) {
      console.error('Erro na RapidAPI, usando mock:', error);
      return await searchMock(searchTerm, page);
    }
  }
  
  return await searchMock(searchTerm, page);
};

/**
 * Buscar produtos via RapidAPI - Alibaba API
 * @param {string} searchTerm - Termo de busca
 * @param {number} page - Página
 * @param {string} apiKey - Chave da API
 * @returns {Promise<Array>} Lista de produtos
 */
const searchRapidAPI = async (searchTerm, page, apiKey) => {
  try {
    const response = await fetch(`${RAPIDAPI_ENDPOINT}?keyword=${encodeURIComponent(searchTerm)}&page=${page}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Converter para formato do ERP
    const exchangeRate = await getExchangeRate();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Nenhum resultado encontrado');
    }
    
    return data.results.map((item, index) => {
      // Garantir que a imagem seja do Alibaba (prioridade máxima)
      let imageUrl = 'https://via.placeholder.com/400?text=No+Image';
      
      if (item.image_url || item.image || item.thumb || item.picture || item.img) {
        const rawImage = item.image_url || item.image || item.thumb || item.picture || item.img;
        
        // Se começar com //, adicionar https:
        if (rawImage.startsWith('//')) {
          imageUrl = `https:${rawImage}`;
        } 
        // Se começar com http já está ok
        else if (rawImage.startsWith('http')) {
          imageUrl = rawImage;
        }
        // Se for path relativo do Alibaba
        else if (rawImage.startsWith('/')) {
          imageUrl = `https://s.alicdn.com${rawImage}`;
        }
        // Caso contrário, assumir que é URL completa
        else {
          imageUrl = rawImage;
        }
        
        // Adicionar parâmetros para melhorar qualidade
        if (imageUrl.includes('alicdn.com')) {
          imageUrl = imageUrl.split('_').join('_') + '_.webp'; // Formato WebP para melhor qualidade
        }
      }
      
      return {
        id: item.product_id || `rapid_${page}_${index}`,
        name: item.title || item.name || searchTerm,
        supplier: item.supplier_name || item.company_name || item.seller_name || 'Alibaba Supplier',
        price: {
          min: parseFloat(item.min_price || item.price || item.min_order_price || 0),
          max: parseFloat(item.max_price || item.price * 2 || item.max_order_price || 0),
          currency: 'USD'
        },
        priceBRL: {
          min: (parseFloat(item.min_price || item.price || 0) * exchangeRate).toFixed(2),
          max: (parseFloat(item.max_price || item.price * 2 || 0) * exchangeRate).toFixed(2)
        },
        moq: parseInt(item.moq || item.min_order || item.minimum_order_quantity || 100),
        rating: parseFloat(item.rating || item.star_rating || 4.5),
        orders: parseInt(item.trade_quantity || item.orders || item.sales_count || 0),
        image: imageUrl,
        description: item.description || item.short_description || `${searchTerm} - High Quality Wholesale`,
        link: item.url || item.link || item.detail_url || `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
        realData: true // Flag para indicar que são dados reais
      };
    });
  } catch (error) {
    console.error('Erro ao buscar na RapidAPI:', error);
    throw error;
  }
};

/**
 * Obter cotação USD/BRL em tempo real
 * @returns {Promise<number>} Taxa de câmbio
 */
export const getExchangeRate = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.BRL || 5.40;
  } catch (error) {
    console.error('Erro ao obter taxa de câmbio:', error);
    return 5.40; // Fallback
  }
};

/**
 * Converter preço USD para BRL
 * @param {number} priceUSD - Preço em dólares
 * @returns {Promise<number>} Preço em reais
 */
export const convertUSDtoBRL = async (priceUSD) => {
  const rate = await getExchangeRate();
  return (priceUSD * rate).toFixed(2);
};

/**
 * 🎭 SIMULAÇÃO - Busca mock para testes
 * (Remover quando backend estiver pronto)
 */
const searchMock = async (searchTerm, page = 1) => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const searchLower = searchTerm.toLowerCase();
  
  // Detectar categoria do produto e buscar imagens relevantes do Unsplash
  const getRelevantImages = async (query) => {
    try {
      // Usando Unsplash API para buscar imagens relevantes (gratuito, sem necessidade de key para básico)
      const unsplashQuery = query.replace(/\s+/g, '+');
      const response = await fetch(`https://source.unsplash.com/featured/300x300/?${unsplashQuery}`);
      
      // Se conseguir imagem específica, usar. Senão, fallback para imagens fixas
      if (response.ok) {
        return [response.url];
      }
    } catch (error) {
      console.log('Usando imagens de fallback');
    }
    
    // Fallback: imagens fixas por categoria
    if (searchLower.includes('oculos') || searchLower.includes('óculos') || 
        searchLower.includes('glasses') || searchLower.includes('sunglasses')) {
      return [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80', // Óculos aviador
        'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&q=80', // Óculos quadrado
        'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&q=80', // Óculos redondo
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80', // Óculos fashion
        'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&q=80', // Óculos de sol preto
        'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&q=80', // Óculos retro
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80', // Óculos cat eye
        'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80', // Óculos vintage
        'https://images.unsplash.com/photo-1606522468926-871f1b010ed8?w=400&q=80', // Óculos sport
        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&q=80'  // Óculos polarizado
      ];
    }
    
    // Imagens genéricas para outros produtos
    return [
      `https://source.unsplash.com/400x400/?${unsplashQuery},product`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},wholesale`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},fashion`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},modern`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},style`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},design`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},luxury`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},quality`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},premium`,
      `https://source.unsplash.com/400x400/?${unsplashQuery},collection`
    ];
  };
  
  const images = await getRelevantImages(searchTerm);
  
  const mockResults = [
    {
      id: `${page}_1`,
      name: `${searchTerm} - Premium UV400 Protection`,
      supplier: 'Guangzhou Optical Trading Co.',
      price: { min: 2.50, max: 5.00, currency: 'USD' },
      priceBRL: { min: 13.50, max: 27.00 },
      moq: 100,
      rating: 4.8,
      orders: 1250,
      image: images[0],
      description: 'Alta qualidade, proteção UV400, lentes polarizadas',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_2`,
      name: `${searchTerm} - Wholesale Fashion Collection`,
      supplier: 'Shenzhen Eyewear Manufacturing Ltd.',
      price: { min: 1.80, max: 4.20, currency: 'USD' },
      priceBRL: { min: 9.72, max: 22.68 },
      moq: 500,
      rating: 4.5,
      orders: 890,
      image: images[1],
      description: 'Design moderno, cores variadas, estoque disponível',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_3`,
      name: `${searchTerm} - Factory Direct Supply`,
      supplier: 'Shanghai Export Group',
      price: { min: 3.00, max: 6.50, currency: 'USD' },
      priceBRL: { min: 16.20, max: 35.10 },
      moq: 200,
      rating: 4.9,
      orders: 2100,
      image: images[2],
      description: 'Preço de fábrica, customização disponível',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_4`,
      name: `${searchTerm} - Sports Edition`,
      supplier: 'Dongguan Sports Goods Co.',
      price: { min: 3.50, max: 7.00, currency: 'USD' },
      priceBRL: { min: 18.90, max: 37.80 },
      moq: 150,
      rating: 4.7,
      orders: 670,
      image: images[3],
      description: 'Modelo esportivo, resistente a impactos',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_5`,
      name: `${searchTerm} - Luxury Designer Style`,
      supplier: 'Beijing Fashion Goods',
      price: { min: 5.00, max: 12.00, currency: 'USD' },
      priceBRL: { min: 27.00, max: 64.80 },
      moq: 50,
      rating: 4.9,
      orders: 1850,
      image: images[4],
      description: 'Estilo luxo, acabamento premium',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_6`,
      name: `${searchTerm} - Kids Collection`,
      supplier: 'Guangzhou Kids Fashion',
      price: { min: 1.50, max: 3.50, currency: 'USD' },
      priceBRL: { min: 8.10, max: 18.90 },
      moq: 300,
      rating: 4.6,
      orders: 540,
      image: images[5],
      description: 'Linha infantil, cores vibrantes, seguro',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_7`,
      name: `${searchTerm} - Vintage Retro`,
      supplier: 'Shanghai Retro Style Co.',
      price: { min: 4.00, max: 8.00, currency: 'USD' },
      priceBRL: { min: 21.60, max: 43.20 },
      moq: 100,
      rating: 4.8,
      orders: 920,
      image: images[6],
      description: 'Estilo retrô vintage, tendência atual',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_8`,
      name: `${searchTerm} - Polarized HD Vision`,
      supplier: 'Shenzhen Optical Tech',
      price: { min: 6.00, max: 14.00, currency: 'USD' },
      priceBRL: { min: 32.40, max: 75.60 },
      moq: 80,
      rating: 4.9,
      orders: 1650,
      image: images[7],
      description: 'Lentes polarizadas HD, anti-reflexo',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_9`,
      name: `${searchTerm} - Aviator Classic`,
      supplier: 'Guangdong Classic Eyewear',
      price: { min: 2.80, max: 5.50, currency: 'USD' },
      priceBRL: { min: 15.12, max: 29.70 },
      moq: 200,
      rating: 4.7,
      orders: 780,
      image: images[8],
      description: 'Modelo aviador clássico, metal premium',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    },
    {
      id: `${page}_10`,
      name: `${searchTerm} - Fashion Cat Eye`,
      supplier: 'Beijing Trendy Fashion',
      price: { min: 3.20, max: 6.80, currency: 'USD' },
      priceBRL: { min: 17.28, max: 36.72 },
      moq: 150,
      rating: 4.8,
      orders: 1120,
      image: images[9],
      description: 'Modelo cat eye feminino, super tendência',
      link: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
      realData: false
    }
  ];
  
  return mockResults;
};

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
  searchAlibaba,
  getExchangeRate,
  convertUSDtoBRL,
  checkBackendStatus
};
