import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [],
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Ting Tong';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/',
    },
  };

  const notificationPromise = self.registration.showNotification(title, options);

  const broadcastPromise = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage(data);
    });
  });

  event.waitUntil(Promise.all([notificationPromise, broadcastPromise]));

  if ('setAppBadge' in navigator && data.badge) {
    navigator.setAppBadge(data.badge);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(client => client.navigate(urlToOpen));
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});
