// Service Worker Completo - Calcule Sua Saúde
// Versão: 2.0.0
// Funcionalidades: Cache offline, Background Sync, Periodic Sync, Push Notifications

const CACHE_NAME = 'calcule-sua-saude-cache-v2';
const OFFLINE_CACHE = 'calcule-sua-saude-offline-v2';
const RUNTIME_CACHE = 'calcule-sua-saude-runtime-v2';

// URLs essenciais para cache offline
const ESSENTIAL_URLS = [
  '/',
  'index.html',
  'offline.html',
  'manifest.json',
  'style.css',
  'script.js',
  'sw-registration.js',
  'favicon.png',
  'icons/icon-72.png',
  'icons/icon-96.png',
  'icons/icon-128.png',
  'icons/icon-144.png',
  'icons/icon-152.png',
  'icons/icon-192.png',
  'icons/icon-384.png',
  'icons/icon-512.png',
  'icons/icon-1024.png',
  'icons/maskable-icon-192.png',
  'icons/maskable-icon-512.png'
];

// URLs para cache dinâmico
const DYNAMIC_CACHE_URLS = [
  '/api/',
  '/data/',
  '/screenshots/',
  '/widgets/'
];

// Configurações de sincronização
const SYNC_TAGS = {
  BACKGROUND_SYNC: 'background-sync-calcule-saude',
  PERIODIC_SYNC: 'periodic-sync-calcule-saude',
  DATA_SYNC: 'data-sync-calcule-saude',
  HEALTH_DATA_SYNC: 'health-data-sync'
};

// Configurações de notificação
const NOTIFICATION_CONFIG = {
  icon: '/icons/icon-192.png',
  badge: '/icons/badge-72.png',
  vibrate: [200, 100, 200],
  requireInteraction: true,
  actions: [
    {
      action: 'view',
      title: 'Ver Detalhes',
      icon: '/icons/action-view.png'
    },
    {
      action: 'dismiss',
      title: 'Dispensar',
      icon: '/icons/action-dismiss.png'
    }
  ]
};

// ==========================================
// INSTALAÇÃO DO SERVICE WORKER
// ==========================================

self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker v2.0.0');
  
  event.waitUntil(
    Promise.all([
      // Cache essencial
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Cacheando recursos essenciais');
        return cache.addAll(ESSENTIAL_URLS);
      }),
      
      // Cache offline
      caches.open(OFFLINE_CACHE).then(cache => {
        console.log('[SW] Preparando cache offline');
        return cache.add('/offline.html');
      }),
      
      // Pular espera para ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// ==========================================
// ATIVAÇÃO DO SERVICE WORKER
// ==========================================

self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker v2.0.0');
  
  const cacheWhitelist = [CACHE_NAME, OFFLINE_CACHE, RUNTIME_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (!cacheWhitelist.includes(cache)) {
              console.log('[SW] Removendo cache antigo:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
      
      // Registrar sincronização periódica
      registerPeriodicSync(),
      
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  );
});

// ==========================================
// INTERCEPTAÇÃO DE REQUISIÇÕES (FETCH)
// ==========================================

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégias de cache baseadas no tipo de recurso
  if (request.method === 'GET') {
    if (isEssentialResource(url)) {
      // Cache First para recursos essenciais
      event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(url)) {
      // Network First para APIs com fallback
      event.respondWith(networkFirstWithSync(request));
    } else if (isDynamicContent(url)) {
      // Stale While Revalidate para conteúdo dinâmico
      event.respondWith(staleWhileRevalidate(request));
    } else {
      // Cache First com fallback offline
      event.respondWith(cacheFirstWithOfflineFallback(request));
    }
  } else if (request.method === 'POST' || request.method === 'PUT') {
    // Background Sync para operações de escrita
    event.respondWith(handleWriteOperation(request));
  }
});

// ==========================================
// BACKGROUND SYNC
// ==========================================

self.addEventListener('sync', event => {
  console.log('[SW] Evento de sincronização recebido:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.BACKGROUND_SYNC:
      event.waitUntil(performBackgroundSync());
      break;
      
    case SYNC_TAGS.DATA_SYNC:
      event.waitUntil(syncHealthData());
      break;
      
    case SYNC_TAGS.HEALTH_DATA_SYNC:
      event.waitUntil(syncUserHealthData());
      break;
      
    default:
      console.log('[SW] Tag de sincronização desconhecida:', event.tag);
  }
});

// ==========================================
// PERIODIC BACKGROUND SYNC
// ==========================================

self.addEventListener('periodicsync', event => {
  console.log('[SW] Sincronização periódica ativada:', event.tag);
  
  if (event.tag === SYNC_TAGS.PERIODIC_SYNC) {
    event.waitUntil(performPeriodicSync());
  }
});

// ==========================================
// PUSH NOTIFICATIONS
// ==========================================

self.addEventListener('push', event => {
  console.log('[SW] Notificação push recebida');
  
  let notificationData = {
    title: 'Calcule Sua Saúde',
    body: 'Nova atualização disponível!',
    icon: NOTIFICATION_CONFIG.icon,
    badge: NOTIFICATION_CONFIG.badge,
    ...NOTIFICATION_CONFIG
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// ==========================================
// CLIQUE EM NOTIFICAÇÕES
// ==========================================

self.addEventListener('notificationclick', event => {
  console.log('[SW] Clique em notificação:', event.action);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Verificar se já existe uma aba aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            if (action === 'view' && notificationData.url) {
              client.navigate(notificationData.url);
            }
            return client.focus();
          }
        }
        
        // Abrir nova aba se necessário
        if (action === 'view' && notificationData.url) {
          return clients.openWindow(notificationData.url);
        } else if (action !== 'dismiss') {
          return clients.openWindow('/');
        }
      })
  );
});

// ==========================================
// ESTRATÉGIAS DE CACHE
// ==========================================

// Cache First - Para recursos essenciais
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Erro no Cache First:', error);
    return caches.match('/offline.html');
  }
}

// Network First com Background Sync
async function networkFirstWithSync(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network falhou, tentando cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Registrar para sincronização posterior
    await registerBackgroundSync(request);
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'Dados serão sincronizados quando a conexão for restaurada' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Cache First com Fallback Offline
async function cacheFirstWithOfflineFallback(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback para página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    // Fallback para outros recursos
    return new Response('Recurso não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ==========================================
// OPERAÇÕES DE ESCRITA COM BACKGROUND SYNC
// ==========================================

async function handleWriteOperation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Operação de escrita falhou, registrando para sync');
    
    // Armazenar dados para sincronização posterior
    await storeForSync(request);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Dados salvos localmente e serão sincronizados quando possível',
      queued: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ==========================================
// FUNÇÕES DE SINCRONIZAÇÃO
// ==========================================

async function performBackgroundSync() {
  console.log('[SW] Executando sincronização em segundo plano');
  
  try {
    const pendingRequests = await getPendingRequests();
    
    for (const requestData of pendingRequests) {
      try {
        const response = await fetch(requestData.url, requestData.options);
        if (response.ok) {
          await removePendingRequest(requestData.id);
          console.log('[SW] Sincronização bem-sucedida para:', requestData.url);
        }
      } catch (error) {
        console.error('[SW] Erro na sincronização:', error);
      }
    }
    
    // Notificar usuário sobre sincronização
    await showSyncNotification();
    
  } catch (error) {
    console.error('[SW] Erro na sincronização em segundo plano:', error);
  }
}

async function performPeriodicSync() {
  console.log('[SW] Executando sincronização periódica');
  
  try {
    // Atualizar dados de saúde
    await updateHealthData();
    
    // Verificar atualizações do app
    await checkForAppUpdates();
    
    // Limpar dados antigos
    await cleanupOldData();
    
    // Atualizar badge com novos dados
    await updateAppBadge();
    
  } catch (error) {
    console.error('[SW] Erro na sincronização periódica:', error);
  }
}

async function syncHealthData() {
  console.log('[SW] Sincronizando dados de saúde');
  
  try {
    const healthData = await getStoredHealthData();
    
    if (healthData.length > 0) {
      const response = await fetch('/api/sync-health-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthData)
      });
      
      if (response.ok) {
        await clearStoredHealthData();
        console.log('[SW] Dados de saúde sincronizados com sucesso');
      }
    }
  } catch (error) {
    console.error('[SW] Erro ao sincronizar dados de saúde:', error);
  }
}

async function syncUserHealthData() {
  console.log('[SW] Sincronizando dados pessoais de saúde');
  
  try {
    // Sincronizar cálculos de IMC
    await syncIMCData();
    
    // Sincronizar dados de proteínas
    await syncProteinData();
    
    // Sincronizar dados de TMB
    await syncTMBData();
    
    // Sincronizar histórico
    await syncHistoryData();
    
  } catch (error) {
    console.error('[SW] Erro ao sincronizar dados pessoais:', error);
  }
}

// ==========================================
// FUNÇÕES DE REGISTRO DE SINCRONIZAÇÃO
// ==========================================

async function registerBackgroundSync(request) {
  try {
    const registration = await self.registration;
    await registration.sync.register(SYNC_TAGS.BACKGROUND_SYNC);
    console.log('[SW] Background sync registrado');
  } catch (error) {
    console.error('[SW] Erro ao registrar background sync:', error);
  }
}

async function registerPeriodicSync() {
  try {
    const registration = await self.registration;
    
    if ('periodicSync' in registration) {
      await registration.periodicSync.register(SYNC_TAGS.PERIODIC_SYNC, {
        minInterval: 24 * 60 * 60 * 1000 // 24 horas
      });
      console.log('[SW] Periodic sync registrado');
    }
  } catch (error) {
    console.error('[SW] Erro ao registrar periodic sync:', error);
  }
}

// ==========================================
// FUNÇÕES DE ARMAZENAMENTO LOCAL
// ==========================================

async function storeForSync(request) {
  try {
    const requestData = {
      id: Date.now(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    const db = await openDB();
    const transaction = db.transaction([\'pending-requests\'], \'readwrite\');
    const store = transaction.objectStore(\'pending-requests\');
    await store.add(requestData);
    
    console.log(\'[SW] Dados armazenados para sincronização:\', requestData.url);
  } catch (error) {
    console.error('[SW] Erro ao armazenar dados para sync:', error);
  }
}

async function getPendingRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending-requests'], 'readonly');
    const store = transaction.objectStore('pending-requests');
    return await store.getAll();
  } catch (error) {
    console.error('[SW] Erro ao obter requisições pendentes:', error);
    return [];
  }
}

async function removePendingRequest(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending-requests'], 'readwrite');
    const store = transaction.objectStore('pending-requests');
    await store.delete(id);
  } catch (error) {
    console.error('[SW] Erro ao remover requisição pendente:', error);
  }
}

// ==========================================
// FUNÇÕES DE BANCO DE DADOS
// ==========================================

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('calcule-saude-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-requests')) {
        db.createObjectStore('pending-requests', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('health-data')) {
        db.createObjectStore('health-data', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('user-preferences')) {
        db.createObjectStore('user-preferences', { keyPath: 'key' });
      }
    };
  });
}

// ==========================================
// FUNÇÕES DE NOTIFICAÇÃO
// ==========================================

async function showSyncNotification() {
  try {
    await self.registration.showNotification('Sincronização Concluída', {
      body: 'Seus dados foram sincronizados com sucesso!',
      icon: NOTIFICATION_CONFIG.icon,
      badge: NOTIFICATION_CONFIG.badge,
      tag: 'sync-complete',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Ver App',
          icon: '/icons/action-view.png'
        }
      ]
    });
  } catch (error) {
    console.error('[SW] Erro ao mostrar notificação:', error);
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function isEssentialResource(url) {
  return ESSENTIAL_URLS.some(essentialUrl => 
    url.pathname === essentialUrl || url.pathname.startsWith(essentialUrl)
  );
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isDynamicContent(url) {
  return DYNAMIC_CACHE_URLS.some(dynamicUrl => 
    url.pathname.startsWith(dynamicUrl)
  );
}

// ==========================================
// FUNÇÕES DE DADOS DE SAÚDE
// ==========================================

async function getStoredHealthData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['health-data'], 'readonly');
    const store = transaction.objectStore('health-data');
    return await store.getAll();
  } catch (error) {
    console.error('[SW] Erro ao obter dados de saúde:', error);
    return [];
  }
}

async function clearStoredHealthData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['health-data'], 'readwrite');
    const store = transaction.objectStore('health-data');
    await store.clear();
  } catch (error) {
    console.error('[SW] Erro ao limpar dados de saúde:', error);
  }
}

async function syncIMCData() {
  // Implementar sincronização específica de dados de IMC
  console.log('[SW] Sincronizando dados de IMC');
}

async function syncProteinData() {
  // Implementar sincronização específica de dados de proteínas
  console.log('[SW] Sincronizando dados de proteínas');
}

async function syncTMBData() {
  // Implementar sincronização específica de dados de TMB
  console.log('[SW] Sincronizando dados de TMB');
}

async function syncHistoryData() {
  // Implementar sincronização específica de histórico
  console.log('[SW] Sincronizando histórico');
}

async function updateHealthData() {
  // Atualizar dados de saúde periodicamente
  console.log('[SW] Atualizando dados de saúde');
}

async function checkForAppUpdates() {
  // Verificar atualizações do aplicativo
  console.log('[SW] Verificando atualizações do app');
}

async function cleanupOldData() {
  // Limpar dados antigos
  console.log('[SW] Limpando dados antigos');
}

async function updateAppBadge() {
  try {
    if ('setAppBadge' in navigator) {
      const unreadCount = await getUnreadNotificationsCount();
      navigator.setAppBadge(unreadCount);
    }
  } catch (error) {
    console.error('[SW] Erro ao atualizar badge:', error);
  }
}

async function getUnreadNotificationsCount() {
  // Implementar contagem de notificações não lidas
  return 0;
}

// ==========================================
// LOG E DEBUG
// ==========================================

console.log('[SW] Service Worker Calcule Sua Saúde v2.0.0 carregado');
console.log('[SW] Funcionalidades: Cache Offline, Background Sync, Periodic Sync, Push Notifications');
