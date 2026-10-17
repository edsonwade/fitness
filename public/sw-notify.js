/*
 * Tocar num aviso da app traz a app para a frente — skill phase-026-notificacoes.
 * Entra no service worker do Workbox por `workbox.importScripts` em vite.config.ts.
 * Com a app aberta num separador, foca-o; sem nenhum, abre-a.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      if (open) return open.focus();
      return self.clients.openWindow(self.registration.scope);
    }),
  );
});
