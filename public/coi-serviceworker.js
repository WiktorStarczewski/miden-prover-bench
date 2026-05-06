// Cross-Origin Isolation service worker.
//
// GitHub Pages (and many other static hosts) cannot set `Cross-Origin-Opener-Policy`
// or `Cross-Origin-Embedder-Policy` response headers. Without those, the browser
// refuses to enable cross-origin isolation, which means SharedArrayBuffer is
// disabled — and wasm-bindgen-rayon's thread pool init throws because rayon
// helpers cannot share memory with the spawning thread.
//
// This SW intercepts every fetch and re-emits the response with the required
// COOP/COEP headers attached, which lets the browser flip
// `crossOriginIsolated` to true on the next document load.
//
// Flow on first visit:
//   1. Page loads without COOP/COEP → `crossOriginIsolated === false`.
//   2. Inline registration script in <head> registers this SW.
//   3. SW activates and `clients.claim()`s the page.
//   4. Page detects `!crossOriginIsolated` and reloads.
//   5. On reload, SW intercepts the document fetch, adds the headers, and
//      `crossOriginIsolated` flips to true. SDK + WASM rayon now work.
//
// Cribbed from coi-serviceworker (MIT-licensed) with minor adjustments.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  // Skip request-only-from-cache + cross-origin: same-origin policy on cache
  // means returning a synthesized response could violate consistency.
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // `status: 0` typically means an opaque (no-cors) response — passing
        // it through new Response() throws. Just forward as-is.
        if (response.status === 0) return response;

        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        // CORP is needed for cross-origin assets (fonts, images, CDN scripts).
        // We only intercept same-origin requests, so this is a defensive set.
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch((err) => {
        // Network failure or fetch rejection — let the browser handle it.
        console.error("[coi-serviceworker]", err);
      })
  );
});
