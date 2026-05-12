"use client";

import { useEffect, useRef, useState } from "react";

import { installOuterProveTiming, type SdkVariant } from "../lib/timing";
import { saveBenchResult } from "../lib/results";

// Both subpaths re-export the same surface from a shared crate; we just pick
// the type alias from one of them. Runtime imports below are variant-aware.
type Sdk = typeof import("@miden-sdk/miden-sdk/lazy");
type Client = InstanceType<Sdk["MidenClient"]>;
type Account = Awaited<ReturnType<Client["accounts"]["create"]>>;

type Phase = "idle" | "init" | "mint" | "consume" | "send" | "cycles" | "done";

type AuthChoice = "falcon" | "ecdsa";

type LogEntry = {
  ts: string;
  text: string;
};

type CycleSample = {
  cycle: number;
  phase: "send" | "consume";
  durationMs: number;
};

type CyclesSummary = {
  cycles: number;
  send: PhaseStats;
  consume: PhaseStats;
};

type PhaseStats = {
  count: number;
  median: number;
  p25: number;
  p75: number;
  iqr: number;
  total: number;
  samples: number[];
};

const NUM_CYCLES_DEFAULT = 10;

// Cooldown between cycles (ms). Lets Apple-Silicon-class SoCs drop
// temperature so the rayon worker doesn't get migrated off P-cores by
// macOS's scheduler mid-cycle. Each cycle is heavy WASM SIMD compute;
// without a cooldown the 5th-10th cycle frequently runs at 2-5× the
// median because the worker lands on E-cores. 1500ms is empirical —
// enough to drop temp on M-series, not so long that the bench becomes
// tedious.
const COOLDOWN_MS = 1500;

export default function Page() {
  const [variant, setVariant] = useState<SdkVariant>("st");

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto" }}>
      <a href="/" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>&larr; Dashboard</a>
      <header style={{ marginBottom: 18 }}>
        <h1>Miden Proving Bench</h1>
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 14 }}>
          Testnet · explicit local prover · SDK worker path enabled by default.
        </p>
        <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 12 }}>
          Tip: switching tabs unmounts the previous panel — note the summary
          before flipping. Run one variant at a time to avoid two SDK workers
          competing for cores.
        </p>
      </header>

      <Tabs variant={variant} onChange={setVariant} />

      {/* Only mount the active variant's panel. We used to keep both mounted
          and toggle CSS visibility, but if the user clicked Init on both,
          two MidenClients and two SDK workers stayed alive (and on MT, each
          worker spawns N rayon helpers). That contention serialized prove
          work and pinned the system at >100% CPU per worker. Switching
          tabs now unmounts the previous panel; React's GC reclaims the
          worker shortly after. The trade-off is losing the previous tab's
          log + summary on switch — note them externally before flipping. */}
      <BenchPanel key={variant} variant={variant} />
    </main>
  );
}

function Tabs({ variant, onChange }: { variant: SdkVariant; onChange: (v: SdkVariant) => void }) {
  return (
    <div className="tab-bar" role="tablist" style={{ marginBottom: 16 }}>
      <button
        type="button"
        role="tab"
        aria-selected={variant === "st"}
        className={`tab-btn${variant === "st" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("st")}
      >
        Single-threaded
        <span style={{ opacity: 0.65, marginLeft: 8, fontWeight: 400, fontSize: 12 }}>/lazy</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={variant === "mt"}
        className={`tab-btn${variant === "mt" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("mt")}
      >
        Multi-threaded
        <span style={{ opacity: 0.65, marginLeft: 8, fontWeight: 400, fontSize: 12 }}>/mt/lazy</span>
      </button>
    </div>
  );
}

function BenchPanel({ variant }: { variant: SdkVariant }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cycleProgress, setCycleProgress] = useState<{ current: number; total: number } | null>(null);
  const [summary, setSummary] = useState<CyclesSummary | null>(null);
  const [authChoice, setAuthChoice] = useState<AuthChoice>("ecdsa");
  const [initialized, setInitialized] = useState(false);

  const sdkRef = useRef<Sdk | null>(null);
  const clientRef = useRef<Client | null>(null);
  const faucetRef = useRef<Account | null>(null);
  const walletRef = useRef<Account | null>(null);
  const recipientRef = useRef<Account | null>(null);
  const logRef = useRef<HTMLPreElement | null>(null);

  // When set, every captured `[proving-timing] outer` log line is also recorded
  // as a CycleSample tagged with this cycle/phase. Cleared between cycle stages.
  const samplePhaseRef = useRef<{ cycle: number; phase: "send" | "consume" } | null>(null);
  const cycleSamplesRef = useRef<CycleSample[]>([]);

  // Intercept console.log so [proving-timing] lines appear in the panel log,
  // and so we can attribute `outer` durations to the active cycle phase.
  // Both panels run this effect — each filters by `variant=` tag so they only
  // record their own variant's lines, with info lines passed through to both.
  useEffect(() => {
    const origLog = console.log.bind(console);
    console.log = (...args: unknown[]) => {
      origLog(...args);
      const text = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
      if (!text.startsWith("[proving-timing]")) return;
      const variantMatch = text.match(/variant=(st|mt)/);
      if (variantMatch && variantMatch[1] !== variant) return;
      setLogs((l) => [
        ...l,
        {
          ts: new Date().toLocaleTimeString(),
          text,
        },
      ]);
      if (samplePhaseRef.current && /\[proving-timing\] outer\b/.test(text)) {
        const m = text.match(/duration_ms=([0-9.]+)/);
        if (m) {
          cycleSamplesRef.current.push({
            cycle: samplePhaseRef.current.cycle,
            phase: samplePhaseRef.current.phase,
            durationMs: parseFloat(m[1]),
          });
        }
      }
    };
    return () => {
      console.log = origLog;
    };
  }, [variant]);

  // Auto-scroll the log to bottom when new lines arrive.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  // Pause the animated backdrop during cycle runs. The macOS compositor
  // (WindowServer) burns ~50% of a P-core compositing the drifting radial
  // gradients, which fights the SDK worker for SoC budget and inflates
  // prove-time variance. Removing the animation drops it to near-zero
  // while runs are in flight; the gradient stays painted (last frame) so
  // the page doesn't visually flicker.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const cls = "bench-running";
    if (phase === "cycles") {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [phase]);

  async function loadSdk(): Promise<Sdk> {
    if (sdkRef.current) return sdkRef.current;
    const mod = variant === "mt"
      ? ((await import("@miden-sdk/miden-sdk/mt/lazy")) as unknown as Sdk)
      : await import("@miden-sdk/miden-sdk/lazy");
    sdkRef.current = mod;
    return mod;
  }

  async function init(): Promise<boolean> {
    console.log(`[proving-timing] info variant=${variant} init() entered (auth=${authChoice})`);
    setError(null);
    setPhase("init");
    setLogs([]);
    setSummary(null);
    setCycleProgress(null);
    cycleSamplesRef.current = [];
    try {
      console.log(`[proving-timing] info variant=${variant} before installOuterProveTiming`);
      await installOuterProveTiming(variant);
      console.log(`[proving-timing] info variant=${variant} before loadSdk`);
      const sdk = await loadSdk();
      console.log(`[proving-timing] info variant=${variant} loadSdk returned`);

      const sdkAny = sdk as unknown as {
        initThreadPool?: (n: number) => Promise<void>;
      };

      // Create the client FIRST so the SDK lazy-loads WASM (it does
      // import('./Cargo-*.js') + __wbg_init internally as part of resolving
      // its inner WebClient). With the wasm-bindgen `wasm` namespace
      // populated, `initThreadPool` (which calls `wasm.initThreadPool(...)`)
      // succeeds. Calling initThreadPool BEFORE WASM load throws
      // "Cannot read properties of undefined (reading 'initThreadPool')".
      const t0 = performance.now();
      const client = await sdk.MidenClient.create({
        rpcUrl: "testnet",
        noteTransportUrl: "testnet",
        autoSync: false,
      });
      console.log(
        `[proving-timing] info variant=${variant} MidenClient.create took ${(performance.now() - t0).toFixed(0)}ms`
      );

      // We deliberately do NOT call `sdk.initThreadPool` on the main thread.
      //
      // The SDK's internal worker (web-client-methods-worker) calls
      // `wasm.initThreadPool(numThreads)` on its OWN WASM instance when
      // `MidenClient.create` constructs the WebClient — that's the pool the
      // prove dispatch actually uses, and it's already running by the time
      // we get here.
      //
      // The main-thread call would only matter for diagnostic Rust functions
      // running on the page (parallelSumBench, etc.). It's not just useless
      // for the prove benchmark — it actively *hurts* it in Next.js dev:
      // wasm-bindgen-rayon spawns N rayon helper Web Workers via
      // `new Worker(new URL('./workerHelpers.js', import.meta.url))`. In
      // dev, webpack rewrites that URL such that each helper's sibling
      // Cargo chunk import (`await import('./Cargo-*.js')`) fails to
      // resolve. The pool builder's unwrap_throw fires only AFTER some
      // helpers have already spawned — and those zombie workers (a) hold
      // browser per-origin worker slots and (b) compete with the SDK
      // worker's own sub-workers for CPU, slowing down the prove pool that
      // *does* work.
      //
      // Skipping the call entirely keeps the prove pool clean.
      if (typeof sdkAny.initThreadPool === "function") {
        console.log(
          `[proving-timing] info variant=${variant} main-thread initThreadPool intentionally skipped (the SDK worker's pool is the only one that matters for prove)`
        );
      }

      const auth = authChoice === "falcon" ? sdk.AuthScheme.Falcon : sdk.AuthScheme.ECDSA;
      const authLabel = authChoice === "falcon" ? "Falcon" : "ECDSA";

      // Diagnostics: confirm the env can spin up MT and that the auth string
      // resolves to the right numeric scheme before any account is created.
      try {
        const coi = typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : "n/a";
        const hwc = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : "n/a";
        console.log(
          `[proving-timing] info variant=${variant} env crossOriginIsolated=${coi} hardwareConcurrency=${hwc}`
        );
      } catch {}
      try {
        const sdkAnyForResolve = sdk as unknown as {
          resolveAuthScheme?: (s: string) => number;
          AuthScheme?: { Falcon: string; ECDSA: string };
        };
        const resolved = sdkAnyForResolve.resolveAuthScheme?.(auth);
        // 1 = AuthEcdsaK256Keccak, 2 = AuthRpoFalcon512 (per SDK Cargo enum)
        const resolvedLabel = resolved === 1 ? "AuthEcdsaK256Keccak" : resolved === 2 ? "AuthRpoFalcon512" : "?";
        console.log(
          `[proving-timing] info variant=${variant} authChoice=${authChoice} -> AuthScheme.${authLabel} ("${auth}") -> resolveAuthScheme=${resolved} (${resolvedLabel})`
        );
      } catch (err) {
        console.log(`[proving-timing] info variant=${variant} resolveAuthScheme diag failed: ${String(err).slice(0, 120)}`);
      }

      const tFaucet = performance.now();
      const faucet: Account = await client.accounts.create({
        type: sdk.AccountType.FungibleFaucet,
        storage: "public",
        auth,
        symbol: "BNCH",
        decimals: 6,
        maxSupply: 1_000_000_000_000n,
      });
      console.log(
        `[proving-timing] info variant=${variant} create faucet (${authLabel}) took ${(performance.now() - tFaucet).toFixed(0)}ms id=${faucet.id().toString()}`
      );

      const tWallet = performance.now();
      const wallet: Account = await client.accounts.create({
        storage: "private",
        auth,
      });
      console.log(
        `[proving-timing] info variant=${variant} create wallet (${authLabel}) took ${(performance.now() - tWallet).toFixed(0)}ms id=${wallet.id().toString()}`
      );

      // Wallet account-code commitment is auth-scheme dependent: Falcon-512
      // and ECDSA-K256 use different auth procedures, so their MAST roots
      // (and therefore the AccountCode commitment) differ. Logging it lets
      // you compare across runs to verify the auth field actually flowed
      // through — same authChoice should give the same hex; switching to
      // the other auth should give a different hex.
      try {
        const walletAny = wallet as unknown as { code?: () => { commitment: () => { toHex: () => string } } };
        const walletCommit = walletAny.code?.().commitment?.().toHex?.();
        console.log(
          `[proving-timing] info variant=${variant} wallet code commitment=${walletCommit ?? "(unavailable)"} (auth=${authLabel}; differs by scheme — compare ECDSA vs Falcon hex to confirm propagation)`
        );
      } catch (err) {
        console.log(`[proving-timing] info variant=${variant} wallet code commitment introspection failed: ${String(err).slice(0, 120)}`);
      }

      const tRecipient = performance.now();
      const recipient: Account = await client.accounts.create({
        storage: "private",
        auth,
      });
      console.log(
        `[proving-timing] info variant=${variant} create recipient (${authLabel}) took ${(performance.now() - tRecipient).toFixed(0)}ms id=${recipient.id().toString()}`
      );

      const tSync = performance.now();
      await client.sync();
      console.log(`[proving-timing] info variant=${variant} initial sync took ${(performance.now() - tSync).toFixed(0)}ms`);

      clientRef.current = client;
      faucetRef.current = faucet;
      walletRef.current = wallet;
      recipientRef.current = recipient;
      setInitialized(true);
      setPhase("idle");
      return true;
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
      return false;
    }
  }

  async function runMint(): Promise<boolean> {
    if (!clientRef.current || !faucetRef.current || !walletRef.current) {
      setError("Run Init first.");
      return false;
    }
    setError(null);
    setPhase("mint");
    try {
      const sdk = await loadSdk();
      const localProver = sdk.TransactionProver.newLocalProver();
      console.log(`[proving-timing] info variant=${variant} starting mint (faucet -> wallet, 100, public, local prover)`);
      const { txId } = await clientRef.current.transactions.mint({
        account: faucetRef.current,
        to: walletRef.current,
        amount: 100n,
        type: "public",
        prover: localProver,
      });
      console.log(`[proving-timing] info variant=${variant} mint submitted txId=${txId.toHex()}`);
      setPhase("idle");
      return true;
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
      return false;
    }
  }

  async function waitForConsumable(
    client: Client,
    account: Account,
    label: string,
    deadlineMs = 90_000,
    pollMs = 3_000,
  ) {
    const deadline = Date.now() + deadlineMs;
    let consumable: Awaited<ReturnType<Client["notes"]["listAvailable"]>> = [];
    while (Date.now() < deadline) {
      await client.sync();
      consumable = await client.notes.listAvailable({ account });
      if (consumable.length > 0) return consumable;
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new Error(`Timed out waiting for ${label} to see a consumable note.`);
  }

  async function runConsume(): Promise<boolean> {
    if (!clientRef.current || !walletRef.current) {
      setError("Run Init first.");
      return false;
    }
    setError(null);
    setPhase("consume");
    try {
      const sdk = await loadSdk();
      console.log(`[proving-timing] info variant=${variant} syncing to discover minted note ...`);
      const consumable = await waitForConsumable(clientRef.current, walletRef.current, "wallet");
      console.log(`[proving-timing] info variant=${variant} found ${consumable.length} consumable note(s); consuming all`);

      const localProver = sdk.TransactionProver.newLocalProver();
      const result = await clientRef.current.transactions.consumeAll({
        account: walletRef.current,
        prover: localProver,
      });
      console.log(
        `[proving-timing] info variant=${variant} consume submitted txId=${result.txId?.toHex() ?? "(none)"} remaining=${result.remaining}`
      );
      setPhase("idle");
      return true;
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
      return false;
    }
  }

  async function runSend(): Promise<boolean> {
    if (!clientRef.current || !walletRef.current || !recipientRef.current || !faucetRef.current) {
      setError("Run Init first.");
      return false;
    }
    setError(null);
    setPhase("send");
    try {
      const sdk = await loadSdk();
      const tSync = performance.now();
      await clientRef.current.sync();
      console.log(`[proving-timing] info variant=${variant} pre-send sync took ${(performance.now() - tSync).toFixed(0)}ms`);

      const localProver = sdk.TransactionProver.newLocalProver();
      console.log(`[proving-timing] info variant=${variant} starting send (wallet -> recipient, 50, public, local prover)`);
      const { txId } = await clientRef.current.transactions.send({
        account: walletRef.current,
        to: recipientRef.current,
        token: faucetRef.current,
        amount: 50n,
        type: "public",
        prover: localProver,
      });
      console.log(`[proving-timing] info variant=${variant} send submitted txId=${txId.toHex()}`);
      setPhase("done");
      return true;
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
      return false;
    }
  }

  async function runCycles(numCycles: number = NUM_CYCLES_DEFAULT) {
    if (!clientRef.current || !walletRef.current || !recipientRef.current || !faucetRef.current) {
      setError("Run Init (and at least one Mint) first — wallet needs a balance to send from.");
      return;
    }
    setError(null);
    setPhase("cycles");
    setSummary(null);
    cycleSamplesRef.current = [];

    try {
      const sdk = await loadSdk();
      const localProver = sdk.TransactionProver.newLocalProver();
      const client = clientRef.current;
      const wallet = walletRef.current;
      const recipient = recipientRef.current;
      const token = faucetRef.current;

      for (let i = 1; i <= numCycles; i++) {
        // Show "Cycle i / N" while cycle i is in progress (start at 1, not 0).
        setCycleProgress({ current: i, total: numCycles });

        // ── send phase ─────────────────────────────────────────────────
        samplePhaseRef.current = { cycle: i, phase: "send" };
        console.log(`[proving-timing] info variant=${variant} cycle ${i}/${numCycles} send wallet -> recipient (1, public)`);
        await client.sync();
        const { txId: sendTxId } = await client.transactions.send({
          account: wallet,
          to: recipient,
          token,
          amount: 1n,
          type: "public",
          prover: localProver,
        });
        console.log(`[proving-timing] info variant=${variant} cycle ${i} send submitted txId=${sendTxId.toHex()}`);

        // ── consume phase (recipient consumes the just-sent note) ──────
        samplePhaseRef.current = { cycle: i, phase: "consume" };
        const consumable = await waitForConsumable(client, recipient, `recipient (cycle ${i})`);
        console.log(`[proving-timing] info variant=${variant} cycle ${i} recipient sees ${consumable.length} consumable note(s)`);
        const result = await client.transactions.consumeAll({
          account: recipient,
          prover: localProver,
        });
        console.log(
          `[proving-timing] info variant=${variant} cycle ${i} consume submitted txId=${result.txId?.toHex() ?? "(none)"} remaining=${result.remaining}`
        );

        // Cooldown — see COOLDOWN_MS comment. Skip after the last cycle.
        if (i < numCycles && COOLDOWN_MS > 0) {
          console.log(
            `[proving-timing] info variant=${variant} cycle ${i} cooldown ${COOLDOWN_MS}ms`
          );
          await new Promise((r) => setTimeout(r, COOLDOWN_MS));
        }
      }

      samplePhaseRef.current = null;

      const summary = summarize(cycleSamplesRef.current, numCycles);
      setSummary(summary);
      console.log(`[proving-timing] info variant=${variant} cycles complete — ${formatSummaryLine(summary)}`);
      saveBenchResult({
        ecosystem: "miden",
        variant,
        median: summary.send.median,
        p25: summary.send.p25,
        p75: summary.send.p75,
        iqr: summary.send.iqr,
        n: summary.send.count,
        samples: summary.send.samples,
        timestamp: Date.now(),
      });
      setPhase("done");
    } catch (e) {
      samplePhaseRef.current = null;
      console.error(e);
      setError(String(e));
      setPhase("idle");
    }
  }

  async function runAll() {
    if (!(await init())) return;
    if (!(await runMint())) return;
    if (!(await runConsume())) return;
    await runSend();
  }

  const busy = phase !== "idle" && phase !== "done";
  const cycleReady = !!(clientRef.current && walletRef.current && recipientRef.current && faucetRef.current);

  return (
    <div className="glass" style={{ padding: 18 }}>
      {/* Top control row: auth scheme + run-all/cycles */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
          justifyContent: "space-between",
        }}
      >
        <AuthSwitcher value={authChoice} onChange={setAuthChoice} disabled={initialized || busy} />
        {cycleProgress && phase === "cycles" && (
          <div className="progress" aria-live="polite">
            <span className="progress-dot" />
            Cycle {cycleProgress.current} / {cycleProgress.total}
          </div>
        )}
      </div>

      {initialized && (
        <p className="section-label" style={{ marginTop: -4 }}>
          Auth scheme is locked once Init has created accounts. Reload the page to switch.
        </p>
      )}

      {/* Step buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Btn onClick={init} disabled={busy} active={phase === "init"}>
          1. Init
        </Btn>
        <Btn onClick={runMint} disabled={busy} active={phase === "mint"}>
          2. Mint <span style={{ opacity: 0.65, marginLeft: 4 }}>(faucet → wallet, 100)</span>
        </Btn>
        <Btn onClick={runConsume} disabled={busy} active={phase === "consume"}>
          3. Consume <span style={{ opacity: 0.65, marginLeft: 4 }}>(wallet)</span>
        </Btn>
        <Btn onClick={runSend} disabled={busy} active={phase === "send"}>
          4. Send <span style={{ opacity: 0.65, marginLeft: 4 }}>(wallet → recipient, 50)</span>
        </Btn>
        <Btn onClick={runAll} disabled={busy} accent>
          Run all (1→4)
        </Btn>
        <Btn
          onClick={() => runCycles(NUM_CYCLES_DEFAULT)}
          disabled={busy || !cycleReady}
          active={phase === "cycles"}
          accent
        >
          Run {NUM_CYCLES_DEFAULT} cycles (send → consume)
        </Btn>
      </div>

      {error && <pre className="err">{error}</pre>}

      {summary && <SummaryPanel summary={summary} variant={variant} />}

      <h3 style={{ marginBottom: 4 }}>[proving-timing] log (main thread)</h3>
      <p style={{ color: "#9aa0a6", marginTop: 0, fontSize: 12 }}>
        Two relevant lines fire per prove: <code>outer</code> (this panel + DevTools) wraps the JS
        method including queue + dispatch + serialize. <code>wasm</code> (DevTools only) wraps just
        the wasm-bindgen prove call inside the worker. The difference is dispatch overhead.
      </p>
      <pre ref={logRef} className="log">
        {logs.length === 0 ? <span style={{ color: "#666" }}>(no events yet)</span> : null}
        {logs.map((l, i) => (
          <div key={i} className="log-row">
            <span className="log-ts">{l.ts}</span>
            {l.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

function AuthSwitcher({
  value,
  onChange,
  disabled,
}: {
  value: AuthChoice;
  onChange: (v: AuthChoice) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="section-label" style={{ margin: 0 }}>
        Auth
      </span>
      <div className="seg" role="group" aria-label="Auth scheme">
        <button
          type="button"
          disabled={disabled}
          className={`seg-btn${value === "ecdsa" ? " seg-btn--active" : ""}`}
          onClick={() => onChange("ecdsa")}
        >
          ECDSA
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`seg-btn${value === "falcon" ? " seg-btn--active" : ""}`}
          onClick={() => onChange("falcon")}
        >
          Falcon
        </button>
      </div>
    </div>
  );
}

function SummaryPanel({ summary, variant }: { summary: CyclesSummary; variant: SdkVariant }) {
  return (
    <div className="glass summary" style={{ padding: 16, margin: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>
          Cycles summary — variant <code style={{ color: "#7ee0a3" }}>{variant}</code>
        </h3>
        <span style={{ color: "#9aa0a6", fontSize: 12 }}>
          {summary.cycles} cycle{summary.cycles === 1 ? "" : "s"} (send + consume per cycle)
        </span>
      </div>
      <pre
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#e6e6e6",
          margin: 0,
          whiteSpace: "pre",
          background: "transparent",
          border: 0,
          padding: 0,
        }}
      >
{renderTable(summary)}
      </pre>
    </div>
  );
}

function renderTable(s: CyclesSummary): string {
  // Median + IQR is robust to thermal-throttle outliers (which Apple-Silicon
  // hits hard on cycles 5-10 of sustained WASM proving). Tail values
  // (avg/min/max) get pulled by those and don't represent typical-case
  // experience. p25..p75 gives the spread of the *bulk* of the distribution.
  const header = "phase    | n  |   med ms |   p25 ms |   p75 ms |   iqr ms | total ms";
  const sep = "---------+----+----------+----------+----------+----------+----------";
  const send = formatRow("send", s.send);
  const consume = formatRow("consume", s.consume);
  const totalMed = (s.send.median + s.consume.median).toFixed(1);
  const grand = `combined median per cycle (send + consume): ${totalMed} ms`;
  return [header, sep, send, consume, "", grand].join("\n");
}

function formatRow(phase: string, p: PhaseStats): string {
  const cell = (n: number) => n.toFixed(1).padStart(8);
  const nCell = String(p.count).padStart(2);
  return `${phase.padEnd(8)} | ${nCell} | ${cell(p.median)} | ${cell(p.p25)} | ${cell(p.p75)} | ${cell(p.iqr)} | ${cell(p.total)}`;
}

function formatSummaryLine(s: CyclesSummary): string {
  return `send median=${s.send.median.toFixed(1)}ms (n=${s.send.count}, iqr=${s.send.iqr.toFixed(0)}ms); consume median=${s.consume.median.toFixed(1)}ms (n=${s.consume.count}, iqr=${s.consume.iqr.toFixed(0)}ms)`;
}

function summarize(samples: CycleSample[], cycles: number): CyclesSummary {
  const sendSamples = samples.filter((s) => s.phase === "send").map((s) => s.durationMs);
  const consumeSamples = samples.filter((s) => s.phase === "consume").map((s) => s.durationMs);
  return {
    cycles,
    send: stats(sendSamples),
    consume: stats(consumeSamples),
  };
}

// Linear-interpolation quantile (type-7 / Excel default). Standard for
// "what value sits at the q-th percentile of this distribution".
function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

function stats(samples: number[]): PhaseStats {
  if (samples.length === 0) {
    return { count: 0, median: 0, p25: 0, p75: 0, iqr: 0, total: 0, samples };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const total = sorted.reduce((a, b) => a + b, 0);
  const median = quantile(sorted, 0.5);
  const p25 = quantile(sorted, 0.25);
  const p75 = quantile(sorted, 0.75);
  return {
    count: sorted.length,
    median,
    p25,
    p75,
    iqr: p75 - p25,
    total,
    samples: sorted,
  };
}

function Btn({
  onClick,
  children,
  disabled,
  active,
  accent,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  accent?: boolean;
}) {
  const cls = ["btn"];
  if (active) cls.push("btn--active");
  else if (accent) cls.push("btn--accent");
  return (
    <button type="button" className={cls.join(" ")} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
