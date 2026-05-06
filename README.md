# Miden Proving Bench

Browser-based microbenchmark for the Miden zk-STARK prover running in WebAssembly.

Tests four corners of the matrix in two clicks each:

|                   | ECDSA-K256       | Falcon-512       |
| :---------------- | :--------------- | :--------------- |
| **Single-thread** | st tab + ECDSA   | st tab + Falcon  |
| **Multi-thread**  | mt tab + ECDSA   | mt tab + Falcon  |

For each cell you can run **N send → consume cycles** (10 by default) on testnet
and the page renders an avg / median / min / max / total table per phase, plus
the full per-prove `[proving-timing] outer` log.

The single-thread variant uses the `@miden-sdk/miden-sdk/lazy` subpath. The
multi-thread variant uses `@miden-sdk/miden-sdk/mt/lazy` and brings up
[wasm-bindgen-rayon](https://github.com/RReverser/wasm-bindgen-rayon) inside
the SDK's worker, sized to `navigator.hardwareConcurrency` threads. Cross-origin
isolation (required for `SharedArrayBuffer`) is provided locally by
`next.config.js` `headers()` and on GitHub Pages by a service worker shim
(`public/coi-serviceworker.js`).

## Running locally

```bash
yarn install
yarn dev
```

Open <http://localhost:3000/>. Both tabs render an Init / Mint / Consume / Send
column plus a "Run 10 cycles" button.

Per-cycle order is: `wallet sends 1 BNCH → recipient` (public note) →
`recipient consumes`. Wall-clock prove time is captured from each
`WasmWebClient.proveTransaction` call via a runtime patch.

> `crossOriginIsolated` must be `true` in DevTools after the first reload —
> otherwise the SDK falls back to single-thread regardless of which tab you're
> on. This is logged on Init.

## Production build

```bash
yarn build      # produces ./out
npx serve out   # serve locally to test the static output
```

## How the tabs differ

The single-thread WASM has no rayon at all (built without `--features mt-threads`,
`+atomics`, or `--shared-memory`). It runs on the SDK's worker thread but every
parallel-by-default loop in `miden-crypto` / `p3-maybe-rayon` falls through to
sequential code.

The multi-thread WASM is built with the full mt toolchain. When the SDK
constructs the `WebClient`, the worker calls `wasm.initThreadPool(N)` where
`N = navigator.hardwareConcurrency`. Subsequent prove calls use that pool.

A second main-thread `initThreadPool` would only be useful for diagnostic Rust
functions (`parallelSumBench`, etc.) running on the page itself — the prove
benchmark doesn't depend on it. We deliberately skip the main-thread call
because in `next dev` it spawns rayon helper workers whose webpack-mediated
sibling-chunk import fails, leaving zombie workers that compete with the
SDK worker's pool.

## Auth schemes

ECDSA-K256-Keccak (`AuthScheme.ECDSA`) is significantly cheaper to verify
inside the kernel than Falcon-512 (`AuthScheme.Falcon`). Switching the
segmented control changes the auth component used for all three accounts
created in Init (faucet / wallet / recipient). The wallet's account-code
commitment is logged so you can confirm the auth field actually propagated
to Rust — different schemes produce different commitments.

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs the static
export and publishes to GitHub Pages.

## SDK vendoring

The `@miden-sdk/miden-sdk` dependency points at a vendored copy in
`vendor/miden-sdk/` so the bench can build offline and on CI without needing
the upstream SDK repo. To refresh: build the SDK release variant (`pnpm run build`
in `web-sdk/crates/web-client`, **without** `MIDEN_FAST_BUILD=true`), copy its
`dist/` and `package.json` into `vendor/miden-sdk/`, and `yarn install`.
