const CACHE_PREFIX = `tbl-5-7:${self.registration.scope}:`;
const VERSION = '1.4.0';
const CACHE_NAME = `${CACHE_PREFIX}v${VERSION}`;
// Versioned URLs keep new HTML from loading old cached application code.
const CORE_FILES = ["./index.html", `./styles.css?v=${VERSION}`, `./speaker-notes.js?v=${VERSION}`, `./curriculum.js?v=${VERSION}`, `./app.js?v=${VERSION}`, "./assets/bg4-oldboys.png"];
const CORE_URLS = new Set(CORE_FILES.map(file => new URL(file, self.registration.scope).href));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES.map(file => new Request(new URL(file, self.registration.scope), { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch(event.request, { cache: 'no-cache', signal: controller.signal });
        if (!response.ok) return (await cache.match('./index.html')) || response;
        // Do not replace this release's offline entry with another release's HTML.
        if ((await response.clone().text()).includes(`data-version="${VERSION}"`)) {
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await cache.match('./index.html')) || Response.error();
      } finally {
        clearTimeout(timeout);
      }
    })());
    return;
  }

  if (!CORE_URLS.has(requestUrl.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  })());
});
