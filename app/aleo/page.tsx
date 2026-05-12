"use client";

import { useEffect, useRef, useState } from "react";
import { saveBenchResult, isAutorun } from "../lib/results";
// Worker messages — must match public/aleo-sdk/bench-worker.js protocol
// Persistent testnet bench account — fund this address with testnet credits
const BENCH_PRIVATE_KEY =
  "APrivateKey1zkp7kKZ3Ue41cgAz8FnrbH4cqFY618HooHRvxdveg8YqEvd";

type WorkerRequest =
  | { type: "init"; threads: number; privateKey?: string }
  | { type: "fetchCreditsKeys" }
  | { type: "transferOnChain"; recipient: string; amount: number; priorityFee?: number }
  | { type: "run"; program: string; fn: string; inputs: string[] };

type WorkerResponse =
  | { type: "init"; ok: true; alice: string; bob: string }
  | { type: "fetchCreditsKeys"; ok: true; durationMs: number }
  | { type: "transferOnChain"; ok: true; durationMs: number; txId: string }
  | { type: "run"; ok: true; durationMs: number; outputs: string[] }
  | { type: "error"; source: string; message: string }
  | { type: "log"; text: string };

type Phase = "idle" | "init" | "keygen" | "transfer" | "cycles" | "done";

type ThreadMode = "st" | "mt";

type LogEntry = { ts: string; text: string };

type CycleSample = { cycle: number; durationMs: number };

type CyclesSummary = {
  cycles: number;
  transfer: PhaseStats;
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
const COOLDOWN_MS = 1500;

export default function AleoPage() {
  const [threadMode, setThreadMode] = useState<ThreadMode>("mt");

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto" }}>
      <a href={(process.env.NEXT_PUBLIC_BASE_PATH || "") + "/"} style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>&larr; Dashboard</a>
      <header style={{ marginBottom: 18 }}>
        <h1>Aleo Proving Bench</h1>
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 14 }}>
          Testnet (Varuna V2 zk-SNARK) · local prover · @provablehq/sdk
        </p>
        <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 12 }}>
          SDK runs inside a Web Worker (required for Atomics.wait / rayon
          thread pool). Switching tabs unmounts the worker — reload to switch
          thread mode after Init.
        </p>
      </header>

      <Tabs mode={threadMode} onChange={setThreadMode} />

      <BenchPanel key={threadMode} threadMode={threadMode} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function Tabs({
  mode,
  onChange,
}: {
  mode: ThreadMode;
  onChange: (m: ThreadMode) => void;
}) {
  return (
    <div className="tab-bar" role="tablist" style={{ marginBottom: 16 }}>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "st"}
        className={`tab-btn${mode === "st" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("st")}
      >
        Single-threaded
        <span
          style={{
            opacity: 0.65,
            marginLeft: 8,
            fontWeight: 400,
            fontSize: 12,
          }}
        >
          initThreadPool(1)
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "mt"}
        className={`tab-btn${mode === "mt" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("mt")}
      >
        Multi-threaded
        <span
          style={{
            opacity: 0.65,
            marginLeft: 8,
            fontWeight: 400,
            fontSize: 12,
          }}
        >
          initThreadPool(N)
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worker RPC helper
// ---------------------------------------------------------------------------

function createWorkerRpc(onLog: (text: string) => void) {
  // Use the standalone worker in public/ — it loads the pre-built
  // @provablehq/wasm directly, avoiding webpack WASM bundling issues.
  // Module type is required for dynamic import() of the WASM ES module.
  // Respect basePath for GitHub Pages deployment.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const worker = new Worker(`${basePath}/aleo-sdk/bench-worker.js`, {
    type: "module",
  });

  // Pending request — only one at a time (proving is sequential).
  let pending: {
    resolve: (msg: WorkerResponse) => void;
    reject: (err: Error) => void;
  } | null = null;

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const msg = e.data;
    if (msg.type === "log") {
      onLog(msg.text);
      return;
    }
    if (pending) {
      const p = pending;
      pending = null;
      if (msg.type === "error") {
        p.reject(new Error(`[${msg.source}] ${msg.message}`));
      } else {
        p.resolve(msg);
      }
    }
  };

  worker.onerror = (e) => {
    onLog(`WORKER ERROR: ${e.message} (${e.filename}:${e.lineno})`);
    if (pending) {
      const p = pending;
      pending = null;
      p.reject(new Error(e.message));
    }
  };

  function send(req: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      pending = { resolve, reject };
      worker.postMessage(req);
    });
  }

  function terminate() {
    worker.terminate();
  }

  return { send, terminate };
}

// ---------------------------------------------------------------------------
// BenchPanel
// ---------------------------------------------------------------------------

function BenchPanel({ threadMode }: { threadMode: ThreadMode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<CyclesSummary | null>(null);
  const [cycleProgress, setCycleProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const rpcRef = useRef<ReturnType<typeof createWorkerRpc> | null>(null);
  const logRef = useRef<HTMLPreElement>(null);
  const cycleSamplesRef = useRef<CycleSample[]>([]);
  const accountsRef = useRef<{ alice: string; bob: string } | null>(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  function log(text: string) {
    const now = new Date();
    const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    setLogs((prev) => [...prev, { ts, text }]);
    console.log(`[proving-timing] ${text}`);
  }

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      rpcRef.current?.terminate();
    };
  }, []);

  // Pause backdrop animation during bench runs
  useEffect(() => {
    const cls = "bench-running";
    if (phase === "cycles" || phase === "transfer") {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Phase: Init
  // ---------------------------------------------------------------------------
  async function init(): Promise<boolean> {
    setError(null);
    setPhase("init");
    setLogs([]);
    setSummary(null);
    setCycleProgress(null);
    cycleSamplesRef.current = [];

    try {
      const variant = `aleo-${threadMode}`;
      log(`info variant=${variant} init() entered`);

      // Create worker
      const rpc = createWorkerRpc((text) => log(`worker: ${text}`));
      rpcRef.current = rpc;

      // Init thread pool + accounts inside worker
      const threads =
        threadMode === "st" ? 1 : navigator.hardwareConcurrency;
      log(`info variant=${variant} spawning worker, threads=${threads}`);

      const coi =
        typeof crossOriginIsolated !== "undefined"
          ? crossOriginIsolated
          : "n/a";
      const hwc =
        typeof navigator !== "undefined"
          ? navigator.hardwareConcurrency
          : "n/a";
      log(
        `info variant=${variant} env crossOriginIsolated=${coi} hardwareConcurrency=${hwc}`
      );

      const initRes = await rpc.send({
        type: "init",
        threads,
        privateKey: BENCH_PRIVATE_KEY,
      });
      if (initRes.type !== "init") throw new Error("Unexpected response");

      accountsRef.current = {
        alice: initRes.alice,
        bob: initRes.bob,
      };
      log(
        `info variant=${variant} alice=${initRes.alice.slice(0, 16)}...`
      );
      log(
        `info variant=${variant} bob=${initRes.bob.slice(0, 16)}...`
      );

      // Fetch real credits.aleo proving keys from CDN
      log(`info variant=${variant} fetching credits.aleo transfer_public keys from CDN...`);
      setPhase("keygen");
      const keyRes = await rpc.send({ type: "fetchCreditsKeys" });
      if (keyRes.type !== "fetchCreditsKeys") throw new Error("Unexpected response");
      log(
        `info variant=${variant} credits keys fetched in ${keyRes.durationMs.toFixed(0)}ms`
      );

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

  // ---------------------------------------------------------------------------
  // Phase: Transfer
  // ---------------------------------------------------------------------------
  async function runTransfer(): Promise<boolean> {
    if (!rpcRef.current || !accountsRef.current) {
      setError("Run Init first.");
      return false;
    }
    setError(null);
    setPhase("transfer");

    try {
      const variant = `aleo-${threadMode}`;
      log(
        `info variant=${variant} starting transfer_public (alice -> bob, 10 tokens)`
      );

      // Try on-chain first, fall back to offline if account not funded
      let res;
      try {
        res = await rpcRef.current.send({
          type: "transferOnChain",
          recipient: accountsRef.current.bob,
          amount: 0.1,
          priorityFee: 0,
        });
      } catch {
        log(`info variant=${variant} on-chain failed (account not funded?), using offline mode`);
        res = await rpcRef.current.send({
          type: "run",
          program: "credits.aleo",
          fn: "transfer_public",
          inputs: [accountsRef.current.bob, "10u64"],
        });
      }
      if (res.type !== "transferOnChain" && res.type !== "run") throw new Error("Unexpected response");

      log(
        `outer variant=${variant} prover=local duration_ms=${res.durationMs.toFixed(1)}`
      );

      setPhase("done");
      return true;
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: Cycles
  // ---------------------------------------------------------------------------
  async function runCycles(numCycles: number = NUM_CYCLES_DEFAULT) {
    if (!rpcRef.current || !accountsRef.current) {
      setError("Run Init first.");
      return;
    }
    setError(null);
    setPhase("cycles");
    setSummary(null);
    cycleSamplesRef.current = [];

    try {
      const variant = `aleo-${threadMode}`;

      for (let i = 1; i <= numCycles; i++) {
        setCycleProgress({ current: i, total: numCycles });
        log(
          `info variant=${variant} cycle ${i}/${numCycles} transfer_public (alice -> bob, 10)`
        );

        let res;
        try {
          res = await rpcRef.current!.send({
            type: "transferOnChain",
            recipient: accountsRef.current!.bob,
            amount: 0.1,
            priorityFee: 0,
          });
        } catch {
          res = await rpcRef.current!.send({
            type: "run",
            program: "credits.aleo",
            fn: "transfer_public",
            inputs: [accountsRef.current!.bob, "10u64"],
          });
        }
        if (res.type !== "transferOnChain" && res.type !== "run") throw new Error("Unexpected response");

        log(
          `outer variant=${variant} prover=local duration_ms=${res.durationMs.toFixed(1)}`
        );
        cycleSamplesRef.current.push({ cycle: i, durationMs: res.durationMs });

        if (i < numCycles && COOLDOWN_MS > 0) {
          log(`info variant=${variant} cycle ${i} cooldown ${COOLDOWN_MS}ms`);
          await new Promise((r) => setTimeout(r, COOLDOWN_MS));
        }
      }

      const summary = summarize(cycleSamplesRef.current, numCycles);
      setSummary(summary);
      log(
        `info variant=${variant} cycles complete — ${formatSummaryLine(summary)}`
      );
      saveBenchResult({
        ecosystem: "aleo",
        variant,
        median: summary.transfer.median,
        p25: summary.transfer.p25,
        p75: summary.transfer.p75,
        iqr: summary.transfer.iqr,
        n: summary.transfer.count,
        samples: summary.transfer.samples,
        timestamp: Date.now(),
      });
      setPhase("done");
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
    }
  }

  // ---------------------------------------------------------------------------
  // Run all
  // ---------------------------------------------------------------------------
  async function runAll() {
    if (!(await init())) return;
    await runTransfer();
  }

  // Autorun: if ?autorun=1, run all + cycles automatically
  const autoranRef = useRef(false);
  useEffect(() => {
    if (autoranRef.current || !isAutorun()) return;
    autoranRef.current = true;
    (async () => {
      if (!(await init())) return;
      if (!(await runTransfer())) return;
      await runCycles(NUM_CYCLES_DEFAULT);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = phase !== "idle" && phase !== "done";
  const cycleReady = initialized;

  return (
    <div className="glass" style={{ padding: 18 }}>
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
        <span className="section-label" style={{ margin: 0 }}>
          Varuna V2 · credits.aleo · transfer_public (on-chain)
        </span>
        {cycleProgress && phase === "cycles" && (
          <div className="progress" aria-live="polite">
            <span className="progress-dot" />
            Cycle {cycleProgress.current} / {cycleProgress.total}
          </div>
        )}
      </div>

      {initialized && (
        <p className="section-label" style={{ marginTop: -4 }}>
          Thread pool is locked after Init. Reload the page to switch ST / MT.
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <Btn
          onClick={init}
          disabled={busy}
          active={phase === "init" || phase === "keygen"}
        >
          1. Init
          <span style={{ opacity: 0.65, marginLeft: 4 }}>(SDK + keys)</span>
        </Btn>
        <Btn
          onClick={runTransfer}
          disabled={busy || !initialized}
          active={phase === "transfer"}
        >
          2. Transfer
          <span style={{ opacity: 0.65, marginLeft: 4 }}>
            (alice → bob, 10)
          </span>
        </Btn>
        <Btn onClick={runAll} disabled={busy} accent>
          Run all (1→2)
        </Btn>
        <Btn
          onClick={() => runCycles(NUM_CYCLES_DEFAULT)}
          disabled={busy || !cycleReady}
          active={phase === "cycles"}
          accent
        >
          Run {NUM_CYCLES_DEFAULT} cycles
        </Btn>
      </div>

      {error && <pre className="err">{error}</pre>}

      {summary && <SummaryPanel summary={summary} threadMode={threadMode} />}

      <h3 style={{ marginBottom: 4 }}>[proving-timing] log</h3>
      <p style={{ color: "#9aa0a6", marginTop: 0, fontSize: 12 }}>
        <code>outer</code> wraps the full ProgramManager.run() call including
        local execution + Varuna proof generation. Key synthesis time is
        reported separately during Init.
      </p>
      <pre ref={logRef} className="log">
        {logs.length === 0 ? (
          <span style={{ color: "#666" }}>(no events yet)</span>
        ) : null}
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

// ---------------------------------------------------------------------------
// Summary panel
// ---------------------------------------------------------------------------

function SummaryPanel({
  summary,
  threadMode,
}: {
  summary: CyclesSummary;
  threadMode: ThreadMode;
}) {
  return (
    <div className="glass summary" style={{ padding: 16, margin: "12px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>
          Cycles summary — variant{" "}
          <code style={{ color: "#7ee0a3" }}>aleo-{threadMode}</code>
        </h3>
        <span style={{ color: "#9aa0a6", fontSize: 12 }}>
          {summary.cycles} cycle{summary.cycles === 1 ? "" : "s"}
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
  const header =
    "phase    | n  |   med ms |   p25 ms |   p75 ms |   iqr ms | total ms";
  const sep =
    "---------+----+----------+----------+----------+----------+----------";
  const transfer = formatRow("transfer", s.transfer);
  return [
    header,
    sep,
    transfer,
    "",
    `median per cycle: ${s.transfer.median.toFixed(1)} ms`,
  ].join("\n");
}

function formatRow(phase: string, p: PhaseStats): string {
  const cell = (n: number) => n.toFixed(1).padStart(8);
  const nCell = String(p.count).padStart(2);
  return `${phase.padEnd(8)} | ${nCell} | ${cell(p.median)} | ${cell(p.p25)} | ${cell(p.p75)} | ${cell(p.iqr)} | ${cell(p.total)}`;
}

function formatSummaryLine(s: CyclesSummary): string {
  return `transfer median=${s.transfer.median.toFixed(1)}ms (n=${s.transfer.count}, iqr=${s.transfer.iqr.toFixed(0)}ms)`;
}

function summarize(samples: CycleSample[], cycles: number): CyclesSummary {
  const durations = samples.map((s) => s.durationMs);
  return { cycles, transfer: stats(durations) };
}

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
  if (samples.length === 0)
    return {
      count: 0,
      median: 0,
      p25: 0,
      p75: 0,
      iqr: 0,
      total: 0,
      samples,
    };
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
    <button
      type="button"
      className={cls.join(" ")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
