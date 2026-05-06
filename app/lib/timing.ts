// Outer JS-side measurement: wraps `WasmWebClient.prototype.proveTransaction`,
// the SDK method that dispatches to the worker (or, in environments without
// Web Workers, calls the WASM `proveTransaction*` directly on the main thread).
//
// This number INCLUDES: `_serializeWasmCall` queue wait, `transactionResult.serialize()`,
// `prover.serialize()`, postMessage round-trip, worker-side TransactionResult.deserialize +
// TransactionProver.deserialize + WASM prove + proven.serialize(),
// and main-thread `ProvenTransaction.deserialize`.
//
// The deeper [proving-timing] wasm log (emitted from inside the worker via the
// patch-package patch on web-client-methods-worker.{js,module.js}) measures
// just the WASM prove call. The diff between the two is dispatch overhead.

import type { TransactionProver } from "@miden-sdk/miden-sdk/lazy";

export type SdkVariant = "st" | "mt";

// Per-variant install marker: each subpath has its OWN WasmWebClient class
// (different module identity in webpack), so we need to patch each independently.
const installed: Record<SdkVariant, boolean> = { st: false, mt: false };

export async function installOuterProveTiming(variant: SdkVariant): Promise<void> {
  if (installed[variant]) return;
  installed[variant] = true;
  const sdk = variant === "mt"
    ? await import("@miden-sdk/miden-sdk/mt/lazy")
    : await import("@miden-sdk/miden-sdk/lazy");
  const proto = (sdk.WasmWebClient as unknown as { prototype: Record<string, unknown> }).prototype;
  if (!proto || typeof proto.proveTransaction !== "function") {
    console.warn(`[proving-timing] WasmWebClient.proveTransaction not found for variant=${variant}, skipping outer patch`);
    return;
  }
  const original = proto.proveTransaction as (...args: unknown[]) => Promise<unknown>;
  proto.proveTransaction = async function patched(transactionResult: unknown, prover?: TransactionProver) {
    let label = "default";
    if (prover) {
      try {
        const ep = (prover as { endpoint?: () => string | undefined }).endpoint?.();
        label = ep ? `remote(${ep})` : "local";
      } catch {
        label = "unknown";
      }
    }
    const start = performance.now();
    try {
      const result = await original.call(this, transactionResult, prover);
      const ms = performance.now() - start;
      console.log(`[proving-timing] outer variant=${variant} prover=${label} duration_ms=${ms.toFixed(1)}`);
      return result;
    } catch (err) {
      const ms = performance.now() - start;
      console.log(`[proving-timing] outer variant=${variant} prover=${label} FAILED after ${ms.toFixed(1)}ms`);
      throw err;
    }
  };
  console.log(`[proving-timing] installed outer (proveTransaction) timing wrapper for variant=${variant}`);
}
