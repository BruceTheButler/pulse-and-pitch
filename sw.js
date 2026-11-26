const CACHE = 'pulse-pitch-v8';
const ASSETS = ['./','./index.html','./style.css?v=8','./app.js','./pitch.js','./tempo.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('brass-') || key.startsWith('pulse-pitch-')) && key !== CACHE).map(key => caches.delete(key))))); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const response = await fetch(event.request);
      if (response.ok && ASSETS.some(asset => new URL(asset,self.registration.scope).href === event.request.url)) await cache.put(event.request,response.clone());
      return response;
    } catch {
      return (await cache.match(event.request)) || (event.request.mode === 'navigate' ? await cache.match('./index.html') : Response.error());
    }
  }));
});
