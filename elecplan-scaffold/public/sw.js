const CACHE_NAME = "yourplan-shell-v2";
const IS_QLS = self.location.hostname === "qls.your-plan.com.au";
const DEFAULT_ICON = IS_QLS ? "/qls-logo-transparent.svg" : "/elecplan-app-icon.svg";
const DEFAULT_TITLE = IS_QLS ? "Quality Landscape Solutions Team" : "Team update";
const SAFE_ASSETS = [DEFAULT_ICON, "/manifest.webmanifest"];

function safeInternalUrl(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/team-chat";
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SAFE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !SAFE_ASSETS.includes(url.pathname)) return;

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || DEFAULT_TITLE, {
    body: data.body || "New team message",
    icon: typeof data.icon === "string" && data.icon.startsWith("/") ? data.icon : DEFAULT_ICON,
    badge: typeof data.badge === "string" && data.badge.startsWith("/") ? data.badge : DEFAULT_ICON,
    tag: data.tag || "yourplan-chat",
    data: { url: safeInternalUrl(data.url) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safeInternalUrl(event.notification.data?.url);
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ("focus" in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
