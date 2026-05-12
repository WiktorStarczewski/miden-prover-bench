"use client";

import { useEffect, useRef, useState } from "react";
import { saveBenchResult } from "../lib/results";

type Phase =
  | "idle"
  | "init"
  | "deploy-account"
  | "deploy-token"
  | "mint"
  | "transfer"
  | "cycles"
  | "done";

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
const TESTNET_RPC = "https://rpc.testnet.aztec-labs.com";

export default function AztecPage() {
  const [threadMode, setThreadMode] = useState<ThreadMode>("mt");

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto" }}>
      <a href="/" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>&larr; Dashboard</a>
      <header style={{ marginBottom: 18 }}>
        <h1>Aztec Proving Bench</h1>
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 14 }}>
          UltraHonk (Barretenberg WASM) · EmbeddedWallet + PXE · testnet
        </p>
        <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 12 }}>
          Full private token transfer: deploy account → deploy token → mint →
          transfer. Proving runs locally in-browser via Barretenberg WASM.
          Sponsored fees via SponsoredFPC.
        </p>
      </header>

      <Tabs mode={threadMode} onChange={setThreadMode} />
      <BenchPanel key={threadMode} threadMode={threadMode} />
    </main>
  );
}

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
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "mt"}
        className={`tab-btn${mode === "mt" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("mt")}
      >
        Multi-threaded
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BenchPanel — full PXE + EmbeddedWallet flow
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const walletRef = useRef<any>(null);
  const tokenRef = useRef<any>(null);
  const aliceRef = useRef<any>(null);  // AztecAddress
  const bobRef = useRef<any>(null);    // AztecAddress
  const feePaymentRef = useRef<any>(null);
  const noWaitRef = useRef<any>(null); // NO_WAIT constant
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const logRef = useRef<HTMLPreElement>(null);
  const cycleSamplesRef = useRef<CycleSample[]>([]);

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
  // Init: create EmbeddedWallet, deploy account, register SponsoredFPC
  // ---------------------------------------------------------------------------
  async function init(): Promise<boolean> {
    setError(null);
    setPhase("init");
    setLogs([]);
    setSummary(null);
    setCycleProgress(null);
    cycleSamplesRef.current = [];

    try {
      const variant = `aztec-${threadMode}`;
      log(`info variant=${variant} init() entered`);
      log(`info variant=${variant} connecting to ${TESTNET_RPC}`);

      // Dynamic imports to avoid SSR
      const { EmbeddedWallet } = await import("@aztec/wallets/embedded");
      const { Fr } = await import("@aztec/aztec.js/fields");
      const { SponsoredFeePaymentMethod } = await import("@aztec/aztec.js/fee");
      const { getContractInstanceFromInstantiationParams } = await import(
        "@aztec/aztec.js/contracts"
      );

      const coi =
        typeof crossOriginIsolated !== "undefined"
          ? crossOriginIsolated
          : "n/a";
      log(
        `info variant=${variant} env crossOriginIsolated=${coi} hardwareConcurrency=${navigator.hardwareConcurrency}`
      );

      // Create EmbeddedWallet with PXE
      const t0 = performance.now();
      const wallet = await EmbeddedWallet.create(TESTNET_RPC, {
        ephemeral: true,
        pxe: { proverEnabled: true },
      });
      walletRef.current = wallet;
      log(
        `info variant=${variant} EmbeddedWallet created in ${(performance.now() - t0).toFixed(0)}ms`
      );

      // Register SponsoredFPC for fee payment
      log(`info variant=${variant} registering SponsoredFPC...`);
      const { SponsoredFPCContract } = await import(
        "@aztec/noir-contracts.js/SponsoredFPC"
      );
      let sponsoredSalt: typeof Fr.prototype;
      try {
        const { SPONSORED_FPC_SALT } = await import("@aztec/constants");
        sponsoredSalt = new Fr(SPONSORED_FPC_SALT);
      } catch {
        sponsoredSalt = new Fr(0n);
      }
      const fpcInstance = await getContractInstanceFromInstantiationParams(
        SponsoredFPCContract.artifact,
        { salt: sponsoredSalt }
      );
      await wallet.registerContract(fpcInstance, SponsoredFPCContract.artifact);
      const feePayment = new SponsoredFeePaymentMethod(fpcInstance.address);
      feePaymentRef.current = feePayment;
      log(`info variant=${variant} SponsoredFPC registered`);

      // Create Alice account
      setPhase("deploy-account");
      log(`info variant=${variant} creating Schnorr account (Alice)...`);
      const tAcct = performance.now();
      const secretKey = Fr.random();
      const salt = Fr.random();
      const accountManager = await wallet.createSchnorrAccount(
        secretKey,
        salt
      );
      aliceRef.current = accountManager.address;
      log(
        `info variant=${variant} Alice address: ${aliceRef.current.toString().slice(0, 16)}...`
      );

      // NO_FROM for account deployment, NO_WAIT for prove-only timing
      const { NO_FROM } = await import("@aztec/aztec.js/account");
      // NO_WAIT is the literal string "NO_WAIT"
      noWaitRef.current = "NO_WAIT";
      log(`info variant=${variant} deploying Alice account contract...`);
      const deployMethod = await accountManager.getDeployMethod();
      await (deployMethod as any).send({
        from: NO_FROM,
        fee: { paymentMethod: feePayment },
      });
      log(
        `info variant=${variant} Alice account deployed in ${(performance.now() - tAcct).toFixed(0)}ms`
      );

      // Create Bob (just an address, no deployment needed for receiving)
      const bobSecret = Fr.random();
      const bobSalt = Fr.random();
      const bobManager = await wallet.createSchnorrAccount(bobSecret, bobSalt);
      bobRef.current = bobManager.address;
      log(`info variant=${variant} Bob address: ${bobRef.current.toString().slice(0, 16)}...`);

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
  // Deploy token + mint
  // ---------------------------------------------------------------------------
  async function deployAndMint(): Promise<boolean> {
    if (!walletRef.current || !feePaymentRef.current) {
      setError("Run Init first.");
      return false;
    }
    setError(null);
    setPhase("deploy-token");

    try {
      const variant = `aztec-${threadMode}`;
      const wallet = walletRef.current;
      const feePayment = feePaymentRef.current;
      const { TokenContract } = await import("@aztec/noir-contracts.js/Token");

      // Deploy token
      log(`info variant=${variant} deploying token contract...`);
      const tDeploy = performance.now();
      const { contract: token } = await TokenContract.deploy(
        wallet,
        aliceRef.current,
        "BenchToken",
        "BNCH",
        18
      ).send({
        from: aliceRef.current,
        fee: { paymentMethod: feePayment },
      });
      tokenRef.current = token;
      log(
        `info variant=${variant} token deployed in ${(performance.now() - tDeploy).toFixed(0)}ms`
      );

      // Mint to private
      setPhase("mint");
      log(`info variant=${variant} minting 1000 tokens to Alice (private)...`);
      const tMint = performance.now();
      await token.methods
        .mint_to_private(aliceRef.current, 1000n)
        .send({
          from: aliceRef.current,
          fee: { paymentMethod: feePayment },
        });
      log(
        `info variant=${variant} mint completed in ${(performance.now() - tMint).toFixed(0)}ms`
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

  // ---------------------------------------------------------------------------
  // Transfer: private token transfer (the benchmarked operation)
  // ---------------------------------------------------------------------------
  async function runTransfer(): Promise<boolean> {
    if (!tokenRef.current || !feePaymentRef.current) {
      setError("Deploy token and mint first.");
      return false;
    }
    setError(null);
    setPhase("transfer");

    try {
      const variant = `aztec-${threadMode}`;
      log(
        `info variant=${variant} starting private transfer (Alice -> Bob, 10 tokens)`
      );

      // Use NO_WAIT to measure simulate+prove only (skip block inclusion)
      const t0 = performance.now();
      await (tokenRef.current.methods
        .transfer(bobRef.current, 10n)
        .send as any)({
          from: aliceRef.current,
          fee: { paymentMethod: feePaymentRef.current },
          wait: noWaitRef.current,
        });
      const ms = performance.now() - t0;

      log(`outer variant=${variant} prover=local duration_ms=${ms.toFixed(1)}`);

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
  // Cycles
  // ---------------------------------------------------------------------------
  async function runCycles(numCycles: number = NUM_CYCLES_DEFAULT) {
    if (!tokenRef.current || !feePaymentRef.current) {
      setError("Deploy token and mint first.");
      return;
    }
    setError(null);
    setPhase("cycles");
    setSummary(null);
    cycleSamplesRef.current = [];

    try {
      const variant = `aztec-${threadMode}`;

      for (let i = 1; i <= numCycles; i++) {
        setCycleProgress({ current: i, total: numCycles });
        log(
          `info variant=${variant} cycle ${i}/${numCycles} private transfer (Alice -> Bob, 1 token)`
        );

        const t0 = performance.now();
        await (tokenRef.current.methods
          .transfer(bobRef.current, 1n)
          .send as any)({
            from: aliceRef.current,
            fee: { paymentMethod: feePaymentRef.current },
            wait: noWaitRef.current,
          });
        const ms = performance.now() - t0;

        log(`outer variant=${variant} prover=local duration_ms=${ms.toFixed(1)}`);
        cycleSamplesRef.current.push({ cycle: i, durationMs: ms });

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
        ecosystem: "aztec",
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

  async function runAll() {
    if (!(await init())) return;
    if (!(await deployAndMint())) return;
    await runTransfer();
  }

  const busy = phase !== "idle" && phase !== "done";
  const canTransfer = !!tokenRef.current;

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
          UltraHonk · Token private transfer · testnet (sponsored fees)
        </span>
        {cycleProgress && phase === "cycles" && (
          <div className="progress" aria-live="polite">
            <span className="progress-dot" />
            Cycle {cycleProgress.current} / {cycleProgress.total}
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
      >
        <Btn onClick={init} disabled={busy} active={phase === "init" || phase === "deploy-account"}>
          1. Init
          <span style={{ opacity: 0.65, marginLeft: 4 }}>(wallet + account)</span>
        </Btn>
        <Btn
          onClick={deployAndMint}
          disabled={busy || !initialized}
          active={phase === "deploy-token" || phase === "mint"}
        >
          2. Deploy + Mint
          <span style={{ opacity: 0.65, marginLeft: 4 }}>(token + 1000)</span>
        </Btn>
        <Btn
          onClick={runTransfer}
          disabled={busy || !canTransfer}
          active={phase === "transfer"}
        >
          3. Transfer
          <span style={{ opacity: 0.65, marginLeft: 4 }}>(Alice → Bob, 10)</span>
        </Btn>
        <Btn onClick={runAll} disabled={busy} accent>
          Run all (1→3)
        </Btn>
        <Btn
          onClick={() => runCycles(NUM_CYCLES_DEFAULT)}
          disabled={busy || !canTransfer}
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
        <code>outer</code> wraps simulate → prove → submit (NO_WAIT: does not
        wait for block inclusion). Proving is local (Barretenberg WASM).
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
// Summary + stats
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
          <code style={{ color: "#7ee0a3" }}>aztec-{threadMode}</code>
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
  return [header, sep, transfer, "", `median per cycle: ${s.transfer.median.toFixed(1)} ms`].join("\n");
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
    return { count: 0, median: 0, p25: 0, p75: 0, iqr: 0, total: 0, samples };
  const sorted = [...samples].sort((a, b) => a - b);
  const total = sorted.reduce((a, b) => a + b, 0);
  const median = quantile(sorted, 0.5);
  const p25 = quantile(sorted, 0.25);
  const p75 = quantile(sorted, 0.75);
  return { count: sorted.length, median, p25, p75, iqr: p75 - p25, total, samples: sorted };
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
