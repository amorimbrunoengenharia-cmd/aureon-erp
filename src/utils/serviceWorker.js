/**
 * Service Worker Registration
 * Registra e gerencia o ciclo de vida do Service Worker
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser');
    return null;
  }

  try {
    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('✅ Service Worker registered:', registration.scope);

    // Verificar atualizações periodicamente (a cada hora)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Listener para atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova versão disponível
          console.log('🔄 Nova versão do app disponível');
          
          // Você pode mostrar notificação ao usuário aqui
          if (window.confirm('Nova versão disponível! Atualizar agora?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Listener para quando o SW assume controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Desregistrar Service Worker (útil para desenvolvimento)
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    console.log('✅ Service Worker unregistered');
    return true;
  } catch (error) {
    console.error('❌ Service Worker unregister failed:', error);
    return false;
  }
}

/**
 * Verificar status de conexão e cache
 */
export function isOnline() {
  return navigator.onLine;
}

export function getConnectionStatus() {
  return {
    online: navigator.onLine,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || null,
    rtt: navigator.connection?.rtt || null
  };
}

/**
 * Solicitar permissão para notificações
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Enviar notificação
 */
export async function showNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options
    });
    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
}

/**
 * Listeners para eventos de conectividade
 */
export function setupConnectivityListeners(callbacks = {}) {
  const { onOnline, onOffline } = callbacks;

  const handleOnline = () => {
    console.log('🟢 App is online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('🔴 App is offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
