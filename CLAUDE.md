# CLAUDE.md — proving-bench-nextjs

Quick reference for an AI agent driving this bench programmatically.

## What this repo does

A Next.js app that benchmarks `@miden-sdk/miden-sdk` proving across three build
variants (ST / MT / GPU). The page exposes step buttons (1-Init, 2-Mint,
3-Consume, 4-Send, Run all 1→4, Run N cycles). Each prove emits a structured
`[proving-timing] ...` console line; cycle summaries emit medians + IQRs.

## Headless driver

Two Node scripts at the repo root run the bench end-to-end without manual
clicks. Both use Playwright (resolved from `node_modules/playwright` — see "Setup"
below) and a real Chromium.

### `drive-bench.mjs <variant> <auth> [cycles]`

Runs a single variant (`st` / `mt` / `gpu`) with one auth scheme (`ecdsa` /
`falcon`) for `Run all (1→4)` followed by `Run N cycles`. Captures every
`[proving-timing]` console line to stdout, parses `outer ... duration_ms=` for
prove durations, and prints a summary at the end:

```
node drive-bench.mjs mt ecdsa 10
node drive-bench.mjs gpu falcon 10
```

The `cycles` arg is informational; the actual cycle count is whatever the
bench's `NUM_CYCLES_DEFAULT` is set to (currently 10).

### `drive-ab.mjs <a> <b> <auth>`

Runs variant `a` then variant `b` back-to-back from the same Chromium launch,
captures both `outer` durations AND per-span `[proving-timing] span name="..."`
lines, and prints a side-by-side delta table:

```
node drive-ab.mjs mt gpu ecdsa
node drive-ab.mjs mt gpu falcon
```

The per-span timings only appear if the SDK's `web-client-methods-worker.js`
has been patched to dump `performance.getEntriesByType("measure")` after each
prove. See "Per-phase tracing" below — that patch lives upstream in the SDK
fork and is included automatically when `vendor/miden-sdk` is rebuilt.

### `quick-probe.mjs`

Minimal one-shot probe. Runs `Run all (1→4)` and prints raw `console.*`
events. Useful for verifying that span dumps are flowing through after a
fresh deploy — if you don't see `[proving-timing] span name=...` lines here,
the worker patch isn't in the deployed bundle.

```
node quick-probe.mjs
```

## Setup before running drivers

- The bench page must be served at **http://localhost:3000** with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers (required for `SharedArrayBuffer` → rayon → MT/GPU).
- `playwright` must resolve from `node_modules/`. If not present (`pnpm install` doesn't ship it as a direct dep), symlink the workspace's playwright: `ln -sf <wallet-repo>/node_modules/playwright node_modules/playwright`.
- `out/serve.json` must contain the COOP/COEP header config:
  ```json
  {"headers":[{"source":"**","headers":[{"key":"Cross-Origin-Opener-Policy","value":"same-origin"},{"key":"Cross-Origin-Embedder-Policy","value":"require-corp"}]}]}
  ```
  (Next.js's `headers()` config is dropped by `output: "export"`, so the static server has to send them itself.)
- Recommended local hosting:
  ```
  rm -rf .next out && pnpm build
  npx -y serve out -l 3000 -L
  ```
  Do **not** use `pnpm dev` for benching — dev-mode adds 5–10% noise vs prod.

## Per-phase tracing

The SDK is built with `tracing-wasm` enabled, which records every named span
(`info_span!("par_loop_eval", ...)` etc.) as a Performance API `measure` entry
in the worker's `performance` object. To dump these to console after each
prove, the worker JS needs a small wrapper around `wasmWebClient.proveTransaction*()`
calls. The wrapper is upstream in the `miden-client/web-client` fork's
`crates/web-client/js/workers/web-client-methods-worker.js` source file as
`__withProveSpanCapture__`.

If the deployed bundle is missing the wrapper (you'll see `[proving-timing] outer ...`
but no `[proving-timing] span name=...`), patch the deployed copies with
`/tmp/inject-helper.mjs` from the wallet worktree, or rebuild the SDK and
redeploy. The wrapper writes a line per span:

```
[proving-timing] span name="par_loop_eval" total_ms=1194.0 count=1
```

`drive-ab.mjs` parses these into per-prove buckets and aggregates medians.

## Span hierarchy

The named spans in the prove path are nested. Direct children of `prove`
(sequential, sum to ≈ outer):

```
prove
├─ commit to main traces            (LDE NTT + Merkle hash of trace)
├─ build_aux_trace                  (aux trace generation)
├─ commit to aux traces             (LDE + hash, smaller)
├─ evaluate constraints             ← contains par_loop_eval
│  └─ eval_instance
│     └─ par_loop_eval              (rayon par_chunks_mut over quotient domain)
├─ commit to quotient poly chunks   (LDE + hash, smallest)
└─ open                             (FRI proof generation)
   ├─ DEEP quotient                 (DEEP polynomial construction)
   ├─ DEEP reduce + assemble
   └─ FRI commit phase              (5 FRI rounds back-to-back)
      ├─ FRI fold (×N)
      └─ FRI round commit (×N)
```

Sums of children > parent: spans nest, and rayon-parallel work has multiple
threads enter the same span concurrently, each producing its own `measure`
entry. The aggregator sums all durations of a given name — that's wall-time
ONLY when the span runs serially. For rayon-parallel spans (par_loop_eval,
FRI fold), the sum is per-thread CPU time, not wall time.

## Debugging the bench itself

- **No spans flowing?** Run `quick-probe.mjs` and look for raw console output. If you see `[proving-timing] outer ...` but no `[proving-timing] span name=...`, the worker patch isn't in the deployed bundle — either redeploy the SDK or apply `/tmp/inject-helper.mjs` to `node_modules/@miden-sdk/miden-sdk/dist/{mt,gpu,st}/workers/web-client-methods-worker.{js,module.js}`.
- **`hardwareConcurrency` mismatch with deployed bench?** On Apple M-series, more workers ≠ faster — workers 9 and 10 land on E-cores and drag joins. To match a remote bench's worker count, spoof in DevTools console before running: `Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })`.
- **Run-to-run variance is ~5-10%.** A single A/B run is not enough to detect a 5% effect cleanly — bias toward 30+ samples per variant when the expected delta is small.
- **WebGPU adapter type matters.** In headless Chromium the GPU adapter info is empty (privacy gating) but `isFallbackAdapter !== true` and feature list including `subgroups` / `timestamp-query` confirms real Metal hardware on macOS.
