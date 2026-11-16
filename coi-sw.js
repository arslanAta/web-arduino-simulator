/*
 * Makes the site cross-origin isolated on hosts that cannot send HTTP headers of their own
 * (GitHub Pages): every answer from the site gets the two headers that isolation needs. The
 * Raspberry Pi boards need it: their Python runs in a worker that shares memory with the page.
 *
 * The technique is that of mini-coi by Andrea Giammarchi (https://github.com/WebReflection/mini-coi)
 * and coi-serviceworker by Guido Zuidhof (https://github.com/gzuidhof/coi-serviceworker),
 * both under the MIT licence.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Other sites (the compile server) are reached directly and answer for themselves.
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  event.respondWith(
    fetch(request).then((response) => {
      if (response.status === 0) return response;
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      const { status, statusText } = response;
      return new Response(response.body, { status, statusText, headers });
    }),
  );
});
