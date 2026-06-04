self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nuovo messaggio', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.conversationId ? `/?openConv=${data.conversationId}` : '/',
        conversationId: data.conversationId || null,
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  const conversationId = event.notification.data?.conversationId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (list) => {
      if (list.length > 0) {
        const client = list[0];
        // postMessage: funziona sia per app in foreground che risvegliata da background
        if (conversationId) {
          client.postMessage({ type: 'OPEN_CONV', conversationId });
        }
        if ('focus' in client) await client.focus();
        return;
      }
      // Nessun client aperto: apri nuova finestra con URL param
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
