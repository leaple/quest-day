/* QUEST DAY 1.1 — network first, offline fallback */
const CACHE_NAME = "quest-day-cache-v29";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./upgrade-1.1.js",
  "./upgrade-1.2.js",
  "./upgrade-1.3.js",
  "./upgrade-1.4.js",
  "./upgrade-1.5-friends.js",
  "./realtime-config.js?v=20261114-1",
  "./upgrade-1.6-realtime.js?v=20261114-13",
  "./upgrade-1.7-social.js?v=20261114-6",
  "./upgrade-1.9-cloud.js?v=20261114-16",
  "./upgrade-2.0-auth.js?v=20261114-17",
  "./upgrade-2.1-mobile.js?v=20261114-18",
  "./characters-1.3.json",
  "./art/sprout.png?v=4",
  "./art/paper_messenger.png?v=4",
  "./art/dawn_runner.png?v=4",
  "./art/sunset_scribe.png?v=4",
  "./art/forest.png?v=4",
  "./art/clockkeeper.png?v=4",
  "./art/star_scribe.png?v=4",
  "./art/ninja.png?v=4",
  "./art/mage.png?v=4",
  "./art/knight.png?v=4",
  "./art/dream_whale.png?v=4",
  "./art/time_guardian.png?v=4"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" ||
      new URL(request.url).origin !== self.location.origin) return;

  // Character portraits are immutable within a version: read them from cache first.
  // The ?v= query changes when artwork is replaced, so updates remain fresh.
  const url = new URL(request.url);
  if (url.pathname.includes("/art/") && url.pathname.endsWith(".png")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        return Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const offlinePage = await cache.match("./index.html");
        if (offlinePage) return offlinePage;
      }
      return Response.error();
    }
  })());
});
