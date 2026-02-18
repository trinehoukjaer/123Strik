const CACHE_NAME = 'strikkeapp-v3'
const PDF_CACHE = 'strikkeapp-pdfs'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Installer: cache statiske filer
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Aktiver: ryd gamle caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== PDF_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Supabase requests - lad dem gaa direkte igennem (ingen interception)
  if (url.hostname.includes('supabase.co')) {
    // Kun cache PDF storage-filer for offline brug
    if (url.pathname.includes('/object/') && event.request.method === 'GET') {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const stableKey = url.origin + url.pathname
              const clone = response.clone()
              caches.open(PDF_CACHE).then((cache) => cache.put(stableKey, clone))
            }
            return response
          })
          .catch(async () => {
            // Offline fallback - proev cache
            const stableKey = url.origin + url.pathname
            const cache = await caches.open(PDF_CACHE)
            const cached = await cache.match(stableKey)
            return cached || new Response('Ikke tilgaengelig offline', { status: 503 })
          })
      )
    }
    return
  }

  // App assets - netvaerk foerst, cache som fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
