"use client";

import { useEffect, useRef, useState } from "react";
import { saveBenchResult, isAutorun } from "../lib/results";

type Phase =
  | "idle"
  | "init"
  | "setup"
  | "transfer"
  | "cycles"
  | "done";

type ThreadMode = "st" | "mt";
type LogEntry = { ts: string; text: string };
type CycleSample = { cycle: number; durationMs: number };

type CyclesSummary = { cycles: number; transfer: PhaseStats };
type PhaseStats = {
  count: number; median: number; p25: number; p75: number;
  iqr: number; total: number; samples: number[];
};

// Fewer cycles than Miden/Aleo because each cycle includes ~72s block wait
const NUM_CYCLES_DEFAULT = 3;
const COOLDOWN_MS = 1500;
const TESTNET_RPC = "https://rpc.testnet.aztec-labs.com";

// Persist setup state so we don't redeploy on every run
const SETUP_KEY = "aztec-bench-setup";
type SetupState = {
  aliceSecret: string;
  aliceSalt: string;
  aliceAddress: string;
  bobSecret: string;
  bobSalt: string;
  bobAddress: string;
  tokenAddress: string;
};

function loadSetup(): SetupState | null {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSetup(s: SetupState) {
  localStorage.setItem(SETUP_KEY, JSON.stringify(s));
}

export default function AztecPage() {
  const [threadMode, setThreadMode] = useState<ThreadMode>("mt");

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto" }}>
      <a href={(process.env.NEXT_PUBLIC_BASE_PATH || "") + "/"} style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>&larr; Dashboard</a>
      <header style={{ marginBottom: 18 }}>
        <h1>Aztec Proving Bench</h1>
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 14 }}>
          UltraHonk (Barretenberg WASM) · EmbeddedWallet + PXE · testnet
        </p>
        <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 12 }}>
          One-time setup deploys account + token + mint (persisted to
          localStorage). Benchmark measures only the private transfer prove.
        </p>
      </header>

      <Tabs mode={threadMode} onChange={setThreadMode} />
      <BenchPanel key={threadMode} threadMode={threadMode} />
    </main>
  );
}

function Tabs({ mode, onChange }: { mode: ThreadMode; onChange: (m: ThreadMode) => void }) {
  return (
    <div className="tab-bar" role="tablist" style={{ marginBottom: 16 }}>
      <button type="button" role="tab" aria-selected={mode === "st"}
        className={`tab-btn${mode === "st" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("st")}>Single-threaded</button>
      <button type="button" role="tab" aria-selected={mode === "mt"}
        className={`tab-btn${mode === "mt" ? " tab-btn--active" : ""}`}
        onClick={() => onChange("mt")}>Multi-threaded</button>
    </div>
  );
}

function BenchPanel({ threadMode }: { threadMode: ThreadMode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [ready, setReady] = useState(false); // wallet connected + setup done
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<CyclesSummary | null>(null);
  const [cycleProgress, setCycleProgress] = useState<{ current: number; total: number } | null>(null);
  const [hasSetup, setHasSetup] = useState(() => !!loadSetup());

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const walletRef = useRef<any>(null);
  const tokenRef = useRef<any>(null);
  const aliceRef = useRef<any>(null);
  const bobRef = useRef<any>(null);
  const feePaymentRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const logRef = useRef<HTMLPreElement>(null);
  const cycleSamplesRef = useRef<CycleSample[]>([]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  function log(text: string) {
    const now = new Date();
    const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0")).join(":");
    setLogs((prev) => [...prev, { ts, text }]);
    console.log(`[proving-timing] ${text}`);
  }

  useEffect(() => {
    const cls = "bench-running";
    if (phase === "cycles" || phase === "transfer") document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Connect: create wallet + register FPC + reconnect to existing setup
  // ---------------------------------------------------------------------------
  async function connect(): Promise<boolean> {
    setError(null);
    setPhase("init");
    if (logs.length === 0) setLogs([]);

    try {
      const variant = `aztec-${threadMode}`;
      log(`info variant=${variant} connecting to ${TESTNET_RPC}`);

      const { EmbeddedWallet } = await import("@aztec/wallets/embedded");
      const { Fr } = await import("@aztec/aztec.js/fields");
      const { SponsoredFeePaymentMethod } = await import("@aztec/aztec.js/fee");
      const { getContractInstanceFromInstantiationParams } = await import("@aztec/aztec.js/contracts");

      const coi = typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : "n/a";
      log(`info variant=${variant} env crossOriginIsolated=${coi} hardwareConcurrency=${navigator.hardwareConcurrency}`);

      // Persistent PXE so IndexedDB retains notes/accounts across reloads
      const t0 = performance.now();
      const wallet = await EmbeddedWallet.create(TESTNET_RPC, {
        ephemeral: false,
        pxe: { proverEnabled: true },
      });
      walletRef.current = wallet;
      log(`info variant=${variant} EmbeddedWallet created in ${(performance.now() - t0).toFixed(0)}ms`);

      // Register SponsoredFPC
      const { SponsoredFPCContract } = await import("@aztec/noir-contracts.js/SponsoredFPC");
      let sponsoredSalt: InstanceType<typeof Fr>;
      try {
        const { SPONSORED_FPC_SALT } = await import("@aztec/constants");
        sponsoredSalt = new Fr(SPONSORED_FPC_SALT);
      } catch { sponsoredSalt = new Fr(0n); }
      const fpcInstance = await getContractInstanceFromInstantiationParams(
        SponsoredFPCContract.artifact, { salt: sponsoredSalt });
      await wallet.registerContract(fpcInstance, SponsoredFPCContract.artifact);
      feePaymentRef.current = new SponsoredFeePaymentMethod(fpcInstance.address);
      log(`info variant=${variant} SponsoredFPC registered`);

      // Check for existing setup
      const setup = loadSetup();
      if (setup) {
        log(`info variant=${variant} found existing setup, reconnecting...`);
        // Re-register accounts
        const acctMgr = await wallet.createSchnorrAccount(
          Fr.fromHexString(setup.aliceSecret), Fr.fromHexString(setup.aliceSalt));
        aliceRef.current = acctMgr.address;

        const bobMgr = await wallet.createSchnorrAccount(
          Fr.fromHexString(setup.bobSecret), Fr.fromHexString(setup.bobSalt));
        bobRef.current = bobMgr.address;

        // Reconnect to token contract
        const { TokenContract } = await import("@aztec/noir-contracts.js/Token");
        const { AztecAddress } = await import("@aztec/aztec.js/addresses");
        const tokenAddr = AztecAddress.fromString(setup.tokenAddress);
        tokenRef.current = await TokenContract.at(tokenAddr, wallet);

        log(`info variant=${variant} reconnected — Alice=${setup.aliceAddress.slice(0, 16)}... Token=${setup.tokenAddress.slice(0, 16)}...`);
        setReady(true);
        setHasSetup(true);
        setPhase("idle");
        return true;
      }

      log(`info variant=${variant} no existing setup found`);
      setPhase("idle");
      return true; // wallet connected but no setup
    } catch (e) {
      console.error(e);
      setError(String(e));
      setPhase("idle");
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Setup (one-time): deploy account + token + mint
  // ---------------------------------------------------------------------------
  async function setup(): Promise<boolean> {
    if (!walletRef.current || !feePaymentRef.current) {
      setError("Connect first.");
      return false;
    }
    setError(null);
    setPhase("setup");

    try {
      const variant = `aztec-${threadMode}`;
      const wallet = walletRef.current;
      const feePayment = feePaymentRef.current;
      const { Fr } = await import("@aztec/aztec.js/fields");
      const { NO_FROM } = await import("@aztec/aztec.js/account");

      // Create Alice
      const aliceSecret = Fr.random();
      const aliceSalt = Fr.random();
      log(`info variant=${variant} creating + deploying Alice account...`);
      const tAcct = performance.now();
      const acctMgr = await wallet.createSchnorrAccount(aliceSecret, aliceSalt);
      aliceRef.current = acctMgr.address;
      log(`info variant=${variant} Alice: ${acctMgr.address.toString().slice(0, 16)}...`);

      const deployMethod = await acctMgr.getDeployMethod();
      await (deployMethod as any).send({ from: NO_FROM, fee: { paymentMethod: feePayment } });
      log(`info variant=${variant} Alice deployed in ${(performance.now() - tAcct).toFixed(0)}ms`);

      // Create Bob (just register, no deploy needed for receiving)
      const bobSecret = Fr.random();
      const bobSalt = Fr.random();
      const bobMgr = await wallet.createSchnorrAccount(bobSecret, bobSalt);
      bobRef.current = bobMgr.address;
      log(`info variant=${variant} Bob: ${bobMgr.address.toString().slice(0, 16)}...`);

      // Deploy token
      const { TokenContract } = await import("@aztec/noir-contracts.js/Token");
      log(`info variant=${variant} deploying token...`);
      const tDeploy = performance.now();
      const { contract: token } = await TokenContract.deploy(
        wallet, aliceRef.current, "BenchToken", "BNCH", 18
      ).send({ from: aliceRef.current, fee: { paymentMethod: feePayment } });
      tokenRef.current = token;
      log(`info variant=${variant} token deployed in ${(performance.now() - tDeploy).toFixed(0)}ms`);

      // Mint
      log(`info variant=${variant} minting 10000 tokens to Alice...`);
      const tMint = performance.now();
      await token.methods.mint_to_private(aliceRef.current, 10000n)
        .send({ from: aliceRef.current, fee: { paymentMethod: feePayment } });
      log(`info variant=${variant} mint done in ${(performance.now() - tMint).toFixed(0)}ms`);

      // Save setup
      const setupState: SetupState = {
        aliceSecret: aliceSecret.toString(),
        aliceSalt: aliceSalt.toString(),
        aliceAddress: aliceRef.current.toString(),
        bobSecret: bobSecret.toString(),
        bobSalt: bobSalt.toString(),
        bobAddress: bobRef.current.toString(),
        tokenAddress: token.address.toString(),
      };
      saveSetup(setupState);
      setReady(true);
      setHasSetup(true);
      log(`info variant=${variant} setup saved to localStorage`);
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
  // Transfer (benchmarked operation)
  // ---------------------------------------------------------------------------
  async function runTransfer(): Promise<boolean> {
    if (!tokenRef.current || !feePaymentRef.current) {
      setError("Run Setup first.");
      return false;
    }
    setError(null);
    setPhase("transfer");

    try {
      const variant = `aztec-${threadMode}`;
      log(`info variant=${variant} private transfer (Alice -> Bob, 10 tokens)`);

      // Send and wait for inclusion (required — Aztec's UTXO model needs
      // each tx to be mined before the next can spend updated notes).
      // We time the full send including block wait. The prove portion is
      // ~15s; the rest is block inclusion (~72s on testnet).
      const t0 = performance.now();
      await tokenRef.current.methods
        .transfer(bobRef.current, 10n)
        .send({
          from: aliceRef.current,
          fee: { paymentMethod: feePaymentRef.current },
        });
      const ms = performance.now() - t0;
      log(`outer variant=${variant} prover=local duration_ms=${ms.toFixed(1)} (includes ~72s block wait)`);
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
      setError("Run Setup first.");
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
        log(`info variant=${variant} cycle ${i}/${numCycles} private transfer`);

        const t0 = performance.now();
        await tokenRef.current.methods
          .transfer(bobRef.current, 1n)
          .send({
            from: aliceRef.current,
            fee: { paymentMethod: feePaymentRef.current },
          });
        const ms = performance.now() - t0;
        log(`outer variant=${variant} prover=local duration_ms=${ms.toFixed(1)} (includes block wait)`);
        cycleSamplesRef.current.push({ cycle: i, durationMs: ms });
        // No cooldown needed — block wait already provides cooling
      }

      const summary = summarize(cycleSamplesRef.current, numCycles);
      setSummary(summary);
      log(`info variant=${variant} cycles complete — ${formatSummaryLine(summary)}`);
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

  // ---------------------------------------------------------------------------
  // Run all: connect → (setup if needed) → transfer → cycles
  // ---------------------------------------------------------------------------
  async function runAll() {
    if (!(await connect())) return;
    if (!ready && !(await setup())) return;
    if (!(await runTransfer())) return;
    await runCycles(NUM_CYCLES_DEFAULT);
  }

  // Autorun
  const autoranRef = useRef(false);
  useEffect(() => {
    if (autoranRef.current || !isAutorun()) return;
    autoranRef.current = true;
    runAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = phase !== "idle" && phase !== "done";

  return (
    <div className="glass" style={{ padding: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 14, justifyContent: "space-between" }}>
        <span className="section-label" style={{ margin: 0 }}>
          UltraHonk · private token transfer · testnet
        </span>
        {cycleProgress && phase === "cycles" && (
          <div className="progress" aria-live="polite">
            <span className="progress-dot" />
            Cycle {cycleProgress.current} / {cycleProgress.total}
          </div>
        )}
      </div>

      {hasSetup && (
        <p className="section-label" style={{ marginTop: -4, color: "#7ee0a3" }}>
          Setup found in localStorage — will skip account/token deployment.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Btn onClick={connect} disabled={busy} active={phase === "init"}>
          1. Connect
        </Btn>
        {!hasSetup && (
          <Btn onClick={setup} disabled={busy || !walletRef.current} active={phase === "setup"}>
            2. Setup <span style={{ opacity: 0.65, marginLeft: 4 }}>(deploy + mint, one-time)</span>
          </Btn>
        )}
        <Btn onClick={runTransfer} disabled={busy || !ready} active={phase === "transfer"}>
          {hasSetup ? "2" : "3"}. Transfer <span style={{ opacity: 0.65, marginLeft: 4 }}>(Alice → Bob, 10)</span>
        </Btn>
        <Btn onClick={runAll} disabled={busy} accent>
          Run all
        </Btn>
        <Btn onClick={() => runCycles(NUM_CYCLES_DEFAULT)} disabled={busy || !ready} active={phase === "cycles"} accent>
          Run {NUM_CYCLES_DEFAULT} cycles
        </Btn>
        {hasSetup && (
          <Btn onClick={() => { localStorage.removeItem(SETUP_KEY); setHasSetup(false); setReady(false); }} disabled={busy}>
            Reset setup
          </Btn>
        )}
      </div>

      {error && <pre className="err">{error}</pre>}
      {summary && <SummaryPanel summary={summary} threadMode={threadMode} />}

      <h3 style={{ marginBottom: 4 }}>[proving-timing] log</h3>
      <p style={{ color: "#9aa0a6", marginTop: 0, fontSize: 12 }}>
        <code>outer</code> wraps simulate + prove + submit + block inclusion
        (~72s on testnet). Subtract ~72s to estimate pure proving time.
        Setup (deploy, mint) is excluded — done once and persisted.
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

// --- UI components + stats (unchanged) ---

function SummaryPanel({ summary, threadMode }: { summary: CyclesSummary; threadMode: ThreadMode }) {
  return (
    <div className="glass summary" style={{ padding: 16, margin: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Cycles summary — <code style={{ color: "#7ee0a3" }}>aztec-{threadMode}</code></h3>
        <span style={{ color: "#9aa0a6", fontSize: 12 }}>{summary.cycles} cycle{summary.cycles === 1 ? "" : "s"}</span>
      </div>
      <pre style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.6, color: "#e6e6e6", margin: 0, whiteSpace: "pre", background: "transparent", border: 0, padding: 0 }}>
        {renderTable(summary)}
      </pre>
    </div>
  );
}

function renderTable(s: CyclesSummary): string {
  const h = "phase    | n  |   med ms |   p25 ms |   p75 ms |   iqr ms | total ms";
  const sep = "---------+----+----------+----------+----------+----------+----------";
  return [h, sep, formatRow("transfer", s.transfer), "", `median: ${s.transfer.median.toFixed(1)} ms`].join("\n");
}
function formatRow(phase: string, p: PhaseStats): string {
  const c = (n: number) => n.toFixed(1).padStart(8);
  return `${phase.padEnd(8)} | ${String(p.count).padStart(2)} | ${c(p.median)} | ${c(p.p25)} | ${c(p.p75)} | ${c(p.iqr)} | ${c(p.total)}`;
}
function formatSummaryLine(s: CyclesSummary): string {
  return `transfer median=${s.transfer.median.toFixed(1)}ms (n=${s.transfer.count}, iqr=${s.transfer.iqr.toFixed(0)}ms)`;
}
function summarize(samples: CycleSample[], cycles: number): CyclesSummary {
  return { cycles, transfer: stats(samples.map((s) => s.durationMs)) };
}
function quantile(sorted: number[], q: number): number {
  if (sorted.length <= 1) return sorted[0] || 0;
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] * (1 - (pos - lo)) + sorted[hi] * (pos - lo);
}
function stats(samples: number[]): PhaseStats {
  if (!samples.length) return { count: 0, median: 0, p25: 0, p75: 0, iqr: 0, total: 0, samples };
  const sorted = [...samples].sort((a, b) => a - b);
  const total = sorted.reduce((a, b) => a + b, 0);
  const [p25, median, p75] = [quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75)];
  return { count: sorted.length, median, p25, p75, iqr: p75 - p25, total, samples: sorted };
}

function Btn({ onClick, children, disabled, active, accent }: {
  onClick: () => void; children: React.ReactNode;
  disabled?: boolean; active?: boolean; accent?: boolean;
}) {
  const cls = ["btn"];
  if (active) cls.push("btn--active");
  else if (accent) cls.push("btn--accent");
  return <button type="button" className={cls.join(" ")} onClick={onClick} disabled={disabled}>{children}</button>;
}
