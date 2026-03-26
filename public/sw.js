// Service Worker for Push Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "PetGrooming", body: "", url: "/dashboard" };
  try {
    data = { ...data, ...event.data?.json() };
  } catch (e) {
    // fallback
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: { url: data.url },
        vibrate: [200, 100, 200],
        tag: "pet-grooming-notification",
        renotify: true,
      });

      // Set app badge if supported
      if (navigator.setAppBadge) {
        try {
          await navigator.setAppBadge();
        } catch (e) {
          // not supported on this platform
        }
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  // Clear app badge on click
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(() => {});
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
