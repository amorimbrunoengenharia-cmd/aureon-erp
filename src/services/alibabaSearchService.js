/**
 * Serviço de Busca de Produtos
 * 
 * Busca produtos redirecionando para Google Shopping e Alibaba
 * Simples e direto - sem APIs complexas
 */

const DEFAULT_API_KEY = '4f3864e869msh0523e53b41cbdbdp1f7d16jsnc62aedb3951f';

/**
 * Buscar produtos por palavra-chave
 * Retorna links para busca no Google Shopping e Alibaba
 * @param {string} searchTerm - O que você quer buscar
 */
export const searchAlibabaProducts = async (searchTerm) => {
  console.log('🔍 Gerando links de busca:', searchTerm);
  
  const googleUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchTerm)}`;
  const alibabaUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`;
  
  return [
    {
      id: 'google-' + Date.now(),
      name: `🔍 Buscar "${searchTerm}" no Google Shopping`,
      supplier: 'Google Shopping',
      rating: '⭐',
      orders: 0,
      price: { min: 0, max: 0, currency: 'USD' },
      moq: 1,
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234285F4" width="400" height="400"/%3E%3Ctext x="50%25" y="45%25" fill="white" font-size="60" text-anchor="middle" dominant-baseline="middle"%3EGoogle%3C/text%3E%3Ctext x="50%25" y="60%25" fill="white" font-size="30" text-anchor="middle" dominant-baseline="middle"%3EShopping%3C/text%3E%3C/svg%3E',
      link: googleUrl,
      description: 'Buscar produtos em milhares de lojas através do Google Shopping. Compare preços, avaliações e encontre as melhores ofertas.'
    },
    {
      id: 'alibaba-' + Date.now(),
      name: `🔍 Buscar "${searchTerm}" no Alibaba`,
      supplier: 'Alibaba.com',
      rating: '⭐',
      orders: 0,
      price: { min: 0, max: 0, currency: 'USD' },
      moq: 100,
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23FF6A00" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="60" font-weight="bold" text-anchor="middle" dominant-baseline="middle"%3EAlibaba%3C/text%3E%3C/svg%3E',
      link: alibabaUrl,
      description: 'Buscar fornecedores e produtos no atacado no Alibaba. Encontre fabricantes, compare preços e negocie diretamente com fornecedores chineses.'
    }
  ];
};

/**
 * Testar conexão (sempre funciona pois não usa API externa)
 */
export const testConnection = async () => {
  return {
    success: true,
    message: '✅ Sistema de busca pronto! Digite o que você procura e clique em Buscar.'
  };
};

/**
 * Obter detalhes de produto (não implementado)
 */
export const getProductDetails = async (productId) => {
  console.log('Detalhes não disponíveis para:', productId);
  return null;
};
