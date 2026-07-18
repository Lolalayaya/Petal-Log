// 極簡 Service Worker：唯一目的是讓 registration.showNotification() 可用（見 SDD 14.1），
// 刻意不做離線快取——Vite 輸出的 hashed 檔名若要做離線快取，需要額外處理版本失效，超出目前範圍。

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) return clients[0].focus()
      return self.clients.openWindow('.')
    })
  )
})
