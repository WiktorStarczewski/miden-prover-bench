import "./globals.css";

export const metadata = { title: "ZK Proving Bench" };

// Statically inlined at build time. Empty for local dev (yarn dev), set to
// "/miden-prover-bench" by the GitHub Pages CI workflow so asset URLs and the
// SW scope match the Pages subpath.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Inline COI bootstrap. Runs as early as possible (head-of-body) so the SW
// is registered before any heavy work. If the document was loaded without
// COOP/COEP (the normal GitHub Pages case), the SW gets registered and the
// page is reloaded — on reload the SW intercepts and adds the headers, so
// `crossOriginIsolated` flips to true and the SDK's MT pool can use SAB.
//
// In local `yarn dev` (where next.config.js's headers() already supplies
// COOP/COEP), `crossOriginIsolated` is true on first paint, so we skip the
// reload and the SW just sits idle.
const COI_BOOTSTRAP = `
(function () {
  if (typeof window === "undefined") return;
  if (window.crossOriginIsolated) return;
  if (!("serviceWorker" in navigator)) return;
  var basePath = ${JSON.stringify(BASE_PATH)};
  var swUrl = basePath + "/coi-serviceworker.js";
  var scope = basePath + "/";
  navigator.serviceWorker
    .register(swUrl, { scope: scope })
    .then(function (reg) {
      // If the SW just activated for the first time, the current document
      // wasn't fetched through it — reload so the next document fetch goes
      // through the SW and gets the COOP/COEP headers.
      if (reg.active && !navigator.serviceWorker.controller) {
        window.location.reload();
      }
    })
    .catch(function (err) {
      console.warn("[coi-serviceworker] registration failed", err);
    });
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: COI_BOOTSTRAP }} />
        {children}
      </body>
    </html>
  );
}
