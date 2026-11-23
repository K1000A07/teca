// Service worker de teca: permite instalar la app y recibir notificaciones.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data.json() } catch { d = { title: 'teca', body: e.data?.text() || '' } }
  e.waitUntil(self.registration.showNotification(d.title || 'teca', {
    body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/favicon-64.png', data: { url: d.url || '/app' },
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL(e.notification.data?.url || '/app', self.location.origin).href
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) { if ('focus' in c) { await c.focus(); if ('navigate' in c) c.navigate(url); return } }
    return self.clients.openWindow(url)
  })())
})
