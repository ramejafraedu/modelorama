const STATIC_CACHE = 'modelorama-static-v2';
const DYNAMIC_CACHE = 'modelorama-dynamic-v2';
const CDN_CACHE = 'modelorama-cdn-v2';

// Recursos estáticos locales - Cache First
const STATIC_ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/styles.css',
  './js/script.js',
  './js/products.js',
  './js/map.js',
  './js/admin.js',
  './manifest.json',
  './modelorama-vector-logo-seeklogo/modelorama-seeklogo.png'
];

// Recursos CDN - Stale While Revalidate
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalación: Cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Precachear CDN en background
        return caches.open(CDN_CACHE);
      })
      .then((cache) => {
        console.log('[SW] Caching CDN resources');
        return Promise.all(
          CDN_URLS.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(response => cache.put(url, response))
              .catch(err => console.log('[SW] Failed to cache CDN:', url))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('modelorama-') &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== CDN_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estrategias diferenciadas
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Estrategia CACHE-FIRST para recursos estáticos locales
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. Estrategia STALE-WHILE-REVALIDATE para CDN
  if (isCDNResource(url)) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  // 3. Estrategia NETWORK-FIRST para Firebase/APIs
  if (isFirebaseOrAPI(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // 4. Default: Network con fallback a cache
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// ============ ESTRATEGIAS DE CACHÉ ============

// CACHE FIRST: Para recursos estáticos locales
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Fetch failed, serving from cache:', request.url);
    return cached || new Response('Offline', { status: 503 });
  }
}

// NETWORK FIRST: Para APIs y Firebase
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Respuesta offline para datos
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// STALE WHILE REVALIDATE: Para CDN (rápido + actualizado)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] CDN fetch failed:', error);
      return cached;
    });

  // Devolver caché inmediatamente si existe, o esperar red
  return cached || fetchPromise;
}

// ============ HELPERS ============

function isStaticAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  );
}

function isCDNResource(url) {
  return CDN_URLS.some(cdnUrl => url.href.includes(cdnUrl)) ||
         url.hostname.includes('cdn.jsdelivr.net') ||
         url.hostname.includes('unpkg.com') ||
         url.hostname.includes('cdn-icons') ||
         url.hostname.includes('fonts.googleapis') ||
         url.hostname.includes('fonts.gstatic');
}

function isFirebaseOrAPI(url) {
  return url.hostname.includes('firebaseio.com') ||
         url.hostname.includes('googleapis.com') ||
         url.hostname.includes('firebasestorage.app') ||
         url.pathname.includes('identitytoolkit');
}