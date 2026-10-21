self.addEventListener('push', function(event) {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {}
  const title = payload.title || 'إشعار جمعية السيدة فاطمة الخيرية';
  const options = {
    body: payload.body || 'لديك إشعار جديد',
    icon: '/assets/logo.png',
    badge: '/assets/logo.png',
    data: { url: payload.url || '/' },
    tag: payload.tag || 'warith-notification'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
    for (const client of list) {
      if (client.focus) {
        client.navigate(url);
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});