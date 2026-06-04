self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nuovo messaggio', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { conversationId: data.conversationId },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const convId = event.notification.data?.conversationId;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) {
        return existing.focus().then(c => {
          // App già aperta: manda messaggio diretto senza reload
          c.postMessage({ type: 'OPEN_CONV', conversationId: convId });
        });
      }
      // App chiusa: apri con query param
      return clients.openWindow(convId ? `/?openConv=${convId}` : '/');
    })
  );
});
