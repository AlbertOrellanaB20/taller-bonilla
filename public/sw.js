// Service worker mínimo — solo lo necesario para que el navegador considere
// la app instalable como PWA. No cachea páginas con sesión: el sistema
// depende de datos en vivo de Supabase, así que siempre se pide la red
// primero y solo se cae a caché para el "shell" estático si no hay conexión.
const CACHE_NAME = "taller-bonilla-shell-v1";
const SHELL_ASSETS = ["/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
