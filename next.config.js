// Statically inlined at build time. Empty for local dev (yarn dev), set to
// "/miden-prover-bench" by the GitHub Pages CI workflow so asset URLs and the
// SW scope match the Pages subpath.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the result can be deployed to GitHub Pages (no Node
  // server, just files). Webpack still bundles the WASM + workers; the
  // service worker shim handles cross-origin isolation since GH Pages
  // can't set COOP/COEP itself.
  output: "export",
  reactStrictMode: true,
  // basePath / assetPrefix are required when serving from a project page
  // (https://<user>.github.io/<repo>/). For local dev we leave them blank
  // so the app runs at the root of localhost:3000.
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // next/image's default loader requires a runtime; static export disables
  // it. The bench has no <Image> usage, but keep this set to avoid surprises.
  images: { unoptimized: true },
  // Trailing slash makes Pages happy when the URL is `<base>/` (Pages serves
  // `<base>/index.html` for that path; without trailing slash some link
  // resolutions get confused).
  trailingSlash: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    // The SDK's eager entry does `await getWasmOrThrow()` at module top
    // level. Webpack accepts that only with topLevelAwait experiment on.
    config.experiments = { ...(config.experiments || {}), topLevelAwait: true };
    return config;
  },
  // wasm-bindgen-rayon spawns rayon worker threads as Web Workers backed by
  // SharedArrayBuffer. SAB is gated on the page being cross-origin-isolated,
  // which requires both headers below.
  //
  // These headers() entries are honored by `next dev` and `next start`
  // (both of which ARE Node servers). Static export ignores headers() — for
  // the GitHub Pages deploy, public/coi-serviceworker.js synthesizes the
  // same headers at runtime.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
