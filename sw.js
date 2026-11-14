/* QUEST DAY 1.1 — network first, offline fallback */
const CACHE_NAME = "quest-day-cache-v47";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./upgrade-1.1.js",
  "./upgrade-1.2.js",
  "./hero-portraits.js?v=20261115-16",
  "./upgrade-1.3.js?v=20261115-16",
  "./upgrade-1.4.js?v=20261115-6",
  "./upgrade-1.5-friends.js",
  "./realtime-config.js?v=20261114-1",
  "./upgrade-1.6-realtime.js?v=20261114-13",
  "./upgrade-1.7-social.js?v=20261114-6",
  "./upgrade-1.9-cloud.js?v=20261114-16",
  "./upgrade-2.0-auth.js?v=20261114-21",
  "./upgrade-2.1-mobile.js?v=20261114-21",
  "./characters-1.3.json",
  "./art/painted/individual/hero_aren-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_aren-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_aren-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_lyra-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_lyra-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_lyra-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_kyle-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_kyle-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_kyle-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_sera-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_sera-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_sera-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_zed-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_zed-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_zed-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_elin-stage1.svg?v=20261115-16",
  "./art/painted/individual/hero_elin-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_elin-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_rohan-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_rohan-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_rohan-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_eve-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_eve-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_eve-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_baruk-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_baruk-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_baruk-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_nia-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_nia-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_nia-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_sion-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_sion-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_sion-stage3.webp?v=20261115-16",
  "./art/painted/individual/hero_lumi-stage1.webp?v=20261115-16",
  "./art/painted/individual/hero_lumi-stage2.webp?v=20261115-16",
  "./art/painted/individual/hero_lumi-stage3.webp?v=20261115-16",
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
