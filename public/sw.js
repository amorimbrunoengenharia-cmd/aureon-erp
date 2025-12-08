/**
 * Service Worker para AUREON ERP
 * Implementa cache offline e estratégias de network-first
 */

const CACHE_VERSION = 'aureon-v1';
const RUNTIME_CACHE = 'aureon-runtime';

// Assets para cache na instalação
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Estratégia: Network-first para API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Estratégia: Cache-first para assets
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estratégia: Stale-while-revalidate para outras requisições
  event.respondWith(staleWhileRevalidate(request));
});

/**
 * Network-first strategy
 * Tenta buscar da rede primeiro, fallback para cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Cachear resposta se bem-sucedida
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache...', error);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback response para API offline
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Você está offline. Esta funcionalidade requer conexão com a internet.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first strategy
 * Tenta buscar do cache primeiro, fallback para rede
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Cache and network failed for:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale-while-revalidate strategy
 * Retorna cache imediatamente, atualiza em background
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  // Buscar da rede em background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => {
    // Ignorar erros de rede silenciosamente
  });

  // Retornar cache imediatamente se disponível
  return cached || fetchPromise;
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Aqui você implementaria a sincronização de dados offline
    console.log('[SW] Syncing offline data...');
    
    // Exemplo: buscar dados pendentes do IndexedDB e enviar para API
    // const pendingData = await getPendingDataFromIndexedDB();
    // await sendToAPI(pendingData);
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Failed to sync offline data:', error);
    return Promise.reject(error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do AUREON ERP',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AUREON ERP', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker loaded');
