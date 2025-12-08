# 🔌 Guia de Integrações - AUREON ERP

## 📦 1. ALIBABA - Implementação Real

### Opção A: API Oficial (Recomendada para Produção)

#### Pré-requisitos
1. Conta no [Alibaba Open Platform](https://open.alibaba.com/)
2. Aplicação aprovada (demora 3-5 dias)
3. Backend Node.js ou Python

#### Credenciais Necessárias
```env
ALIBABA_APP_KEY=seu_app_key_aqui
ALIBABA_APP_SECRET=seu_app_secret_aqui
```

#### Backend Node.js - Exemplo
```javascript
// backend/routes/alibaba.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// Gerar assinatura para API do Alibaba
function generateSign(params, secret) {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});
  
  const string = Object.entries(sorted)
    .map(([k, v]) => `${k}${v}`)
    .join('');
  
  return crypto.createHmac('sha256', secret)
    .update(string)
    .digest('hex')
    .toUpperCase();
}

// Buscar produtos
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    const params = {
      method: 'alibaba.product.search',
      app_key: process.env.ALIBABA_APP_KEY,
      timestamp: Date.now(),
      format: 'json',
      v: '2.0',
      keyword: query,
      page_no: page,
      page_size: 20
    };
    
    params.sign = generateSign(params, process.env.ALIBABA_APP_SECRET);
    
    const response = await axios.get('https://gw.api.alibaba.com/openapi/param2/2/portals.open/api.protocol.do', {
      params
    });
    
    // Converter preços USD para BRL
    const exchangeRate = await getExchangeRate();
    
    const products = response.data.result.products.map(p => ({
      id: p.product_id,
      name: p.subject,
      supplier: p.company_name,
      price: {
        min: p.price_min * exchangeRate,
        max: p.price_max * exchangeRate,
        currency: 'BRL'
      },
      moq: p.moq,
      image: p.image_url,
      link: `https://www.alibaba.com/product-detail/_/${p.product_id}.html`
    }));
    
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cotação USD/BRL em tempo real
async function getExchangeRate() {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    return response.data.rates.BRL;
  } catch {
    return 5.40; // Fallback
  }
}

module.exports = router;
```

#### Frontend - Chamada Real
```javascript
// src/services/alibabaService.js
export const searchAlibaba = async (searchTerm) => {
  try {
    const response = await fetch(`http://localhost:3001/api/alibaba/search?query=${encodeURIComponent(searchTerm)}`);
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Erro ao buscar no Alibaba:', error);
    return [];
  }
};
```

---

### Opção B: Web Scraping (Mais Simples)

#### Backend Python com BeautifulSoup
```python
# backend/alibaba_scraper.py
from flask import Flask, jsonify, request
from bs4 import BeautifulSoup
import requests
import json

app = Flask(__name__)

@app.route('/api/alibaba/search')
def search_alibaba():
    query = request.args.get('query', '')
    page = request.args.get('page', 1)
    
    url = f"https://www.alibaba.com/trade/search?SearchText={query}&page={page}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    products = []
    items = soup.find_all('div', class_='organic-list-offer')
    
    for item in items[:20]:  # Primeiros 20 resultados
        try:
            name = item.find('h2', class_='search-card-e-title').text.strip()
            price = item.find('span', class_='search-card-e-price-main').text.strip()
            moq = item.find('span', class_='search-card-e-moq').text.strip()
            image = item.find('img')['src']
            link = item.find('a')['href']
            
            products.append({
                'name': name,
                'price': price,
                'moq': moq,
                'image': image,
                'link': f"https:{link}" if link.startswith('//') else link
            })
        except:
            continue
    
    return jsonify({'products': products})

if __name__ == '__main__':
    app.run(port=3001)
```

---

## 🛒 2. MERCADO LIVRE - Implementação Real

### Passo 1: Criar Aplicação

1. Acessar: https://developers.mercadolivre.com.br/
2. Criar nova aplicação
3. Configurar **Redirect URI**: `http://localhost:5173/callback/mercadolivre`
4. Obter credenciais

### Passo 2: Backend OAuth

```javascript
// backend/routes/mercadolivre.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5173/callback/mercadolivre';

// Rota para iniciar autenticação
router.get('/auth', (req, res) => {
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  res.json({ authUrl });
});

// Trocar código por token
router.post('/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    });
    
    // Salvar token no banco de dados
    const { access_token, refresh_token, expires_in } = response.data;
    
    res.json({ 
      success: true, 
      access_token,
      expires_in 
    });
  } catch (error) {
    res.status(400).json({ error: error.response?.data || error.message });
  }
});

// Refresh token quando expirar
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token
    });
    
    res.json({ 
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar pedidos
router.get('/orders', async (req, res) => {
  try {
    const { access_token } = req.headers;
    
    const response = await axios.get('https://api.mercadolibre.com/orders/search', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: {
        seller: 'me',
        sort: 'date_desc',
        limit: 50
      }
    });
    
    const orders = response.data.results.map(order => ({
      id: order.id,
      date: order.date_created,
      buyer: order.buyer.nickname,
      total: order.total_amount,
      status: order.status,
      items: order.order_items.map(item => ({
        title: item.item.title,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    }));
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar produtos do vendedor
router.get('/items', async (req, res) => {
  try {
    const { access_token } = req.headers;
    
    // Primeiro buscar o seller_id
    const userResponse = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const seller_id = userResponse.data.id;
    
    // Buscar itens do vendedor
    const itemsResponse = await axios.get(`https://api.mercadolibre.com/users/${seller_id}/items/search`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit: 50 }
    });
    
    // Buscar detalhes de cada item
    const itemsDetails = await Promise.all(
      itemsResponse.data.results.map(itemId =>
        axios.get(`https://api.mercadolibre.com/items/${itemId}`, {
          headers: { Authorization: `Bearer ${access_token}` }
        })
      )
    );
    
    const items = itemsDetails.map(res => ({
      id: res.data.id,
      title: res.data.title,
      price: res.data.price,
      available_quantity: res.data.available_quantity,
      sold_quantity: res.data.sold_quantity,
      status: res.data.status,
      permalink: res.data.permalink,
      thumbnail: res.data.thumbnail
    }));
    
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar anúncio
router.post('/items', async (req, res) => {
  try {
    const { access_token } = req.headers;
    const { title, price, quantity, description, pictures } = req.body;
    
    const response = await axios.post('https://api.mercadolibre.com/items', {
      title,
      category_id: 'MLB264586', // Óculos de Sol
      price,
      currency_id: 'BRL',
      available_quantity: quantity,
      buying_mode: 'buy_it_now',
      condition: 'new',
      listing_type_id: 'gold_special',
      description: { plain_text: description },
      pictures: pictures.map(url => ({ source: url }))
    }, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    res.json({ success: true, item: response.data });
  } catch (error) {
    res.status(400).json({ error: error.response?.data || error.message });
  }
});

module.exports = router;
```

### Passo 3: Webhooks para Notificações em Tempo Real

```javascript
// backend/routes/webhooks.js
const express = require('express');
const router = express.Router();

// Configurar webhook (fazer uma vez)
router.post('/setup', async (req, res) => {
  try {
    const { access_token } = req.headers;
    
    const response = await axios.post('https://api.mercadolibre.com/applications/{APP_ID}/webhooks', {
      topic: 'orders_v2',
      url: 'https://seu-dominio.com/webhook/mercadolivre'
    }, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Receber notificações
router.post('/mercadolivre', async (req, res) => {
  try {
    const { topic, resource } = req.body;
    
    console.log('Webhook recebido:', topic, resource);
    
    if (topic === 'orders_v2') {
      // Buscar detalhes do pedido
      const orderId = resource.split('/').pop();
      
      // Processar e salvar no banco
      // ... adicionar ao ERP automaticamente
      
      res.sendStatus(200);
    }
  } catch (error) {
    res.sendStatus(500);
  }
});

module.exports = router;
```

### Passo 4: Frontend - Componente de Autenticação

```javascript
// src/services/mercadoLivreService.js
const API_URL = 'http://localhost:3001/api/mercadolivre';

export const iniciarAutenticacao = async () => {
  try {
    const response = await fetch(`${API_URL}/auth`);
    const { authUrl } = await response.json();
    window.location.href = authUrl;
  } catch (error) {
    console.error('Erro ao iniciar autenticação:', error);
  }
};

export const trocarCodigoPorToken = async (code) => {
  try {
    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    const { access_token, expires_in } = await response.json();
    
    // Salvar no localStorage
    localStorage.setItem('ml_token', access_token);
    localStorage.setItem('ml_expires', Date.now() + expires_in * 1000);
    
    return access_token;
  } catch (error) {
    console.error('Erro ao trocar código por token:', error);
    return null;
  }
};

export const buscarPedidos = async () => {
  try {
    const token = localStorage.getItem('ml_token');
    
    const response = await fetch(`${API_URL}/orders`, {
      headers: { access_token: token }
    });
    
    const { orders } = await response.json();
    return orders;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
};

export const sincronizarPedidos = async (addVenda) => {
  const orders = await buscarPedidos();
  
  orders.forEach(order => {
    // Adicionar ao ERP automaticamente
    addVenda({
      data: new Date(order.date).toLocaleDateString('pt-BR'),
      canal: 'Mercado Livre',
      cliente: order.buyer,
      produtos: order.items.map(item => ({
        nome: item.title,
        quantidade: item.quantity,
        preco: item.unit_price
      })),
      total: order.total,
      status: order.status
    });
  });
};
```

---

## 🚀 Estrutura Backend Completa

```
backend/
├── package.json
├── .env
├── server.js
├── routes/
│   ├── alibaba.js
│   ├── mercadolivre.js
│   └── webhooks.js
└── utils/
    └── database.js
```

### package.json
```json
{
  "name": "aureon-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "crypto": "^1.0.1"
  }
}
```

### .env
```env
# Alibaba
ALIBABA_APP_KEY=seu_app_key
ALIBABA_APP_SECRET=seu_app_secret

# Mercado Livre
ML_CLIENT_ID=seu_client_id
ML_CLIENT_SECRET=seu_client_secret
ML_REDIRECT_URI=http://localhost:5173/callback/mercadolivre

# Servidor
PORT=3001
```

### server.js
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const alibabaRoutes = require('./routes/alibaba');
const mercadoLivreRoutes = require('./routes/mercadolivre');
const webhooksRoutes = require('./routes/webhooks');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/alibaba', alibabaRoutes);
app.use('/api/mercadolivre', mercadoLivreRoutes);
app.use('/webhook', webhooksRoutes);

app.listen(process.env.PORT, () => {
  console.log(`🚀 Backend rodando na porta ${process.env.PORT}`);
});
```

---

## 📝 Resumo - Ordem de Implementação

### Prioridade ALTA (Essencial)
1. ✅ Criar backend Node.js básico
2. ✅ Implementar autenticação Mercado Livre
3. ✅ Sincronizar pedidos do ML automaticamente
4. ✅ Adicionar cotação USD/BRL para Alibaba

### Prioridade MÉDIA
5. ⏳ Web scraping do Alibaba (alternativa simples)
6. ⏳ Webhooks do Mercado Livre
7. ⏳ Publicar produtos no ML direto do ERP

### Prioridade BAIXA (Futuro)
8. 🔜 API oficial do Alibaba
9. 🔜 Relatórios de performance por canal
10. 🔜 Análise de concorrência ML

---

## 💡 Alternativa Mais Simples (SEM Backend)

Se você não quer criar backend agora, pode:

1. **Alibaba**: Manter simulação atual mas melhorar UX
2. **Mercado Livre**: Usar extensão de navegador para importar pedidos manualmente
3. **Planilhas**: Exportar dados e fazer upload manual

Quer que eu implemente alguma dessas opções?
