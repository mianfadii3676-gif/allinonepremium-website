/*
 * Service worker for the Allinonepermium admin app (scope /admin/).
 * - Makes the admin panel installable and shows an offline notice when there is no network.
 * - Displays new-order notifications and focuses the app when one is tapped.
 * Admin data is never cached: every page and API request goes to the network.
 */
const OFFLINE_URL = "/admin-offline.html";
const CACHE = "aop-admin-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/admin-icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only page navigations get the offline fallback; everything else passes straight through.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "new-order") return;
  self.registration.showNotification(data.title, {
    body: data.body,
    tag: data.tag,
    icon: "/admin-icons/icon-192.png",
    badge: "/admin-icons/icon-192.png",
    data: { url: data.url },
    requireInteraction: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/orders";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).pathname.startsWith("/admin"));
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
