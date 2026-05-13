"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Known testnet block times (seconds). Used to compute total user wait.
const BLOCK_TIME_S: Record<string, number> = {
  miden: 3,
  aleo: 15,
  aztec: 72,
};

const BENCHMARKS = [
  {
    key: "miden",
    name: "Miden",
    proof: "Plonky3 STARK",
    href: "/miden/",
    color: "#1f8a4c",
    description: "MidenClient SDK · testnet",
    operation: "client.transactions.send()",
  },
  {
    key: "aleo",
    name: "Aleo",
    proof: "Varuna V2 zk-SNARK",
    href: "/aleo/",
    color: "#4a6ee0",
    description: "@provablehq/wasm · testnet",
    operation: "buildTransferTransaction()",
  },
  {
    key: "aztec",
    name: "Aztec",
    proof: "UltraHonk (Barretenberg)",
    href: "/aztec/",
    color: "#a855f7",
    description: "EmbeddedWallet + PXE · testnet",
    operation: "token.transfer().send()",
  },
];

type BenchResult = {
  ecosystem: string;
  variant: string;
  median: number;          // send prove-only median (ms)
  p25: number;
  p75: number;
  iqr: number;
  n: number;
  samples: number[];
  consumeMedian?: number;  // consume prove median (ms) — Miden only
  blockWaitMs?: number;    // median block inclusion wait (ms)
  totalMs?: number;        // prove + block wait (ms)
  timestamp: number;
};

const STORAGE_KEY = "zk-bench-results";

function loadResults(): BenchResult[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [results, setResults] = useState<BenchResult[]>([]);
  const [running, setRunning] = useState<string | null>(null); // ecosystem key or null
  const [runLog, setRunLog] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const refresh = useCallback(() => setResults(loadResults()), []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  function clearResults() {
    localStorage.removeItem(STORAGE_KEY);
    setResults([]);
  }

  // Run all benchmarks sequentially via hidden iframes.
  // Each bench page detects ?autorun=1 and runs init → run all → 10 cycles,
  // then posts "bench-done" to the parent via postMessage.
  async function runAll() {
    setRunLog([]);
    for (const b of BENCHMARKS) {
      setRunning(b.key);
      setRunLog((prev) => [...prev, `Starting ${b.name}...`]);

      await new Promise<void>((resolve) => {
        // Listen for completion message from the iframe
        const onMessage = (e: MessageEvent) => {
          if (e.data?.type === "bench-done" && e.data?.ecosystem === b.key) {
            window.removeEventListener("message", onMessage);
            refresh();
            setRunLog((prev) => [
              ...prev,
              `${b.name} done — median ${e.data.median?.toFixed(0) ?? "?"}ms`,
            ]);
            resolve();
          }
        };
        window.addEventListener("message", onMessage);

        // Also set a timeout — if the bench doesn't complete in 30 min, skip
        const timeout = setTimeout(() => {
          window.removeEventListener("message", onMessage);
          setRunLog((prev) => [...prev, `${b.name} timed out`]);
          resolve();
        }, 30 * 60_000);

        // Also poll localStorage as fallback (iframe might not postMessage)
        const startCount = loadResults().filter(
          (r) => r.ecosystem === b.key
        ).length;
        const poll = setInterval(() => {
          const current = loadResults().filter(
            (r) => r.ecosystem === b.key
          ).length;
          if (current > startCount) {
            clearInterval(poll);
            clearTimeout(timeout);
            window.removeEventListener("message", onMessage);
            refresh();
            const latest = loadResults()
              .filter((r) => r.ecosystem === b.key)
              .sort((a, c) => c.timestamp - a.timestamp)[0];
            setRunLog((prev) => [
              ...prev,
              `${b.name} done — median ${latest?.median?.toFixed(0) ?? "?"}ms`,
            ]);
            resolve();
          }
        }, 3000);

        // Create iframe
        if (iframeRef.current) {
          iframeRef.current.remove();
        }
        const iframe = document.createElement("iframe");
        iframe.style.cssText =
          "position:fixed;bottom:0;right:0;width:400px;height:300px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;z-index:100;opacity:0.9;background:#07090c;";
        iframe.src = `${basePath}${b.href}?autorun=1`;
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      });
    }

    // Clean up iframe
    if (iframeRef.current) {
      iframeRef.current.remove();
      iframeRef.current = null;
    }
    setRunning(null);
    setRunLog((prev) => [...prev, "All benchmarks complete."]);
    refresh();
  }

  // Latest result per ecosystem
  const latest: Record<string, BenchResult> = {};
  for (const r of results) {
    if (!latest[r.ecosystem] || r.timestamp > latest[r.ecosystem].timestamp) {
      latest[r.ecosystem] = r;
    }
  }

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <h1>ZK Proving Bench</h1>
        <p style={{ color: "#d8dee5", margin: "0 0 6px", fontSize: 15 }}>
          One operation, three ecosystems:{" "}
          <strong>&quot;Alice sends 10 tokens to Bob.&quot;</strong>
        </p>
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 13, lineHeight: 1.6 }}>
          Each benchmark measures the same user action — creating a token
          transfer transaction, proving it locally in the browser (WASM), and
          waiting for it to land on-chain. We report prove time (local ZK
          proof generation) and block time (waiting for chain inclusion)
          separately.{" "}
          <Link href="/about/" style={{ color: "#7ee0a3" }}>
            Methodology &amp; caveats &rarr;
          </Link>
        </p>
      </header>

      {/* Run All + ecosystem cards */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className="btn btn--accent"
          style={{ fontSize: 15, padding: "12px 24px" }}
          disabled={!!running}
          onClick={runAll}
        >
          {running
            ? `Running ${BENCHMARKS.find((b) => b.key === running)?.name}...`
            : "Run All Benchmarks"}
        </button>
        {Object.keys(latest).length > 0 && (
          <button
            type="button"
            className="btn"
            style={{ fontSize: 13, padding: "10px 16px" }}
            onClick={clearResults}
            disabled={!!running}
          >
            Clear results
          </button>
        )}
      </div>

      {/* Run log */}
      {runLog.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(8, 11, 14, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            color: "#9aa0a6",
            lineHeight: 1.6,
          }}
        >
          {runLog.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {running && (
            <div className="progress" style={{ display: "inline-flex", marginTop: 6 }}>
              <span className="progress-dot" />
              Running...
            </div>
          )}
        </div>
      )}

      {/* Benchmark cards */}
      <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
        {BENCHMARKS.map((b) => (
          <Link
            key={b.key}
            href={b.href}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="glass"
              style={{
                padding: 18,
                cursor: "pointer",
                transition: "transform 160ms ease, box-shadow 200ms ease",
                borderLeft: `4px solid ${b.color}`,
                outline:
                  running === b.key
                    ? `2px solid ${b.color}`
                    : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${b.color}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: b.color,
                  }}
                >
                  {b.name}
                </h2>
                <span style={{ fontSize: 13, color: "#9aa0a6" }}>
                  {b.proof}
                </span>
                {latest[b.key] && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#e6e6e6",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, monospace",
                    }}
                  >
                    {latest[b.key].median.toFixed(0)} ms
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                {b.description} &middot;{" "}
                <code style={{ fontSize: 11 }}>{b.operation}</code>
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Animation + Comparison table */}
      {Object.keys(latest).length > 0 && (
        <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 4px" }}>
            Alice sends 10 tokens to Bob
          </h3>
          <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 16px" }}>
            Total time until Bob can spend the tokens. For Miden, Bob must
            consume the note (extra prove + block). For Aleo &amp; Aztec,
            Bob owns the tokens once Alice&apos;s tx lands.
          </p>

          <NoteAnimation results={latest} />
          <ComparisonTable results={latest} />

          <div style={{ color: "#6b7280", fontSize: 11, margin: "12px 0 0", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 4px" }}>
              <strong style={{ color: "#9aa0a6" }}>Send prove</strong> = Alice&apos;s
              local ZK proof (measured).{" "}
              <strong style={{ color: "#9aa0a6" }}>Block</strong> = testnet
              block time (Miden ~3s, Aleo ~15s, Aztec ~72s).{" "}
              <strong style={{ color: "#9aa0a6" }}>Consume</strong> = Bob
              proves consumption of the note (Miden only).
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Stick figure animation: note flies from Alice to Bob
// ---------------------------------------------------------------------------

// Live cycle state, updated via postMessage from iframe benchmarks
type CycleState = {
  ecosystem: string;
  cycle: number;
  startTime: number;    // performance.now() when cycle-start received
  durationMs?: number;  // set when cycle-end received
};

function NoteAnimation({
  results,
}: {
  results: Record<string, BenchResult>;
}) {
  const [activeCycles, setActiveCycles] = useState<Record<string, CycleState>>({});
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  // Listen for cycle-start / cycle-end from iframes
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "cycle-start") {
        setActiveCycles((prev) => ({
          ...prev,
          [e.data.ecosystem]: {
            ecosystem: e.data.ecosystem,
            cycle: e.data.cycle,
            startTime: performance.now(),
          },
        }));
      } else if (e.data?.type === "cycle-end") {
        setActiveCycles((prev) => {
          const copy = { ...prev };
          delete copy[e.data.ecosystem];
          return copy;
        });
        setCompletedCounts((prev) => ({
          ...prev,
          [e.data.ecosystem]: (prev[e.data.ecosystem] || 0) + 1,
        }));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const ecosystems = BENCHMARKS.map((b) => b.key);
  const hasAnyResults = ecosystems.some((k) => results[k]);
  if (!hasAnyResults) return null;

  return (
    <div style={{ margin: "0 0 20px", overflow: "hidden" }}>
      {ecosystems.map((key) => {
        const b = BENCHMARKS.find((x) => x.key === key)!;
        const active = activeCycles[key];
        const completed = completedCounts[key] || 0;
        const r = results[key];
        // Use last known median as expected duration, or 10s default
        const expectedMs = r?.median || 10000;

        return (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 10,
              height: 48,
              opacity: r ? 1 : 0.3,
            }}
          >
            {/* Alice */}
            <div style={{ width: 50, textAlign: "center", flexShrink: 0 }}>
              <StickFigure color={b.color} />
              <div style={{ fontSize: 9, color: "#6b7280", marginTop: -2 }}>Alice</div>
            </div>

            {/* Track */}
            <div
              style={{
                flex: 1,
                position: "relative",
                height: 28,
                borderBottom: `1px dashed ${b.color}33`,
              }}
            >
              {/* Flying note — only visible when a cycle is active */}
              {active && (
                <div
                  key={`${key}-${active.cycle}`}
                  style={{
                    position: "absolute",
                    bottom: -2,
                    left: 0,
                    fontSize: 18,
                    animation: `fly-${key} ${expectedMs}ms linear forwards`,
                  }}
                >
                  <span style={{ filter: `drop-shadow(0 0 6px ${b.color})` }}>
                    &#9993;
                  </span>
                </div>
              )}

              {/* Label: ecosystem name + status */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 12,
                  color: active ? b.color : "#6b7280",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  transition: "color 300ms",
                }}
              >
                {b.name}
                {active && (
                  <span style={{ color: "#9aa0a6", fontWeight: 400, marginLeft: 6 }}>
                    cycle {active.cycle}
                  </span>
                )}
                {!active && completed > 0 && r && (
                  <span style={{ color: "#9aa0a6", fontWeight: 400, marginLeft: 6 }}>
                    {(r.median / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>

            {/* Bob */}
            <div style={{ width: 50, textAlign: "center", flexShrink: 0 }}>
              <StickFigure color={b.color} />
              <div style={{ fontSize: 9, color: "#6b7280", marginTop: -2 }}>Bob</div>
            </div>
          </div>
        );
      })}

      <style>{`
        ${BENCHMARKS.map(
          (b) => `@keyframes fly-${b.key} {
          0% { left: 0%; opacity: 0; }
          3% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: calc(100% - 24px); opacity: 0; }
        }`
        ).join("\n")}
      `}</style>
    </div>
  );
}

function StickFigure({ color }: { color: string }) {
  return (
    <svg width="24" height="32" viewBox="0 0 24 32" style={{ display: "block", margin: "0 auto" }}>
      {/* Head */}
      <circle cx="12" cy="6" r="4" fill="none" stroke={color} strokeWidth="1.5" />
      {/* Body */}
      <line x1="12" y1="10" x2="12" y2="22" stroke={color} strokeWidth="1.5" />
      {/* Arms */}
      <line x1="4" y1="15" x2="20" y2="15" stroke={color} strokeWidth="1.5" />
      {/* Left leg */}
      <line x1="12" y1="22" x2="5" y2="30" stroke={color} strokeWidth="1.5" />
      {/* Right leg */}
      <line x1="12" y1="22" x2="19" y2="30" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function fmt(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms.toFixed(0)}ms`;
}

function ComparisonTable({
  results,
}: {
  results: Record<string, BenchResult>;
}) {
  const ecosystems = BENCHMARKS.map((b) => b.key).filter((k) => results[k]);
  if (ecosystems.length === 0) return null;

  const getBlockMs = (key: string) => (BLOCK_TIME_S[key] ?? 0) * 1000;

  // Total = send prove + block + (consume prove + block if Miden)
  const getTotal = (key: string) => {
    const r = results[key];
    const sendTotal = r.median + getBlockMs(key);
    if (r.consumeMedian) {
      return sendTotal + r.consumeMedian + getBlockMs(key);
    }
    return sendTotal;
  };

  const fastestProve = Math.min(...ecosystems.map((k) => results[k].median));
  const fastestTotal = Math.min(...ecosystems.map(getTotal));

  const thStyle = {
    textAlign: "right" as const,
    padding: "8px 10px",
    color: "#9aa0a6",
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <th style={{ ...thStyle, textAlign: "left" }}>Ecosystem</th>
            <th style={thStyle}>Send prove</th>
            <th style={thStyle}>Block</th>
            <th style={thStyle}>Consume prove</th>
            <th style={thStyle}>Block</th>
            <th style={thStyle}>Total</th>
            <th style={thStyle}>n</th>
          </tr>
        </thead>
        <tbody>
          {ecosystems.map((key) => {
            const r = results[key];
            const b = BENCHMARKS.find((x) => x.key === key)!;
            const blockMs = getBlockMs(key);
            const total = getTotal(key);
            const consumeMs = r.consumeMedian ?? 0;
            const isFastestProve = r.median === fastestProve && ecosystems.length > 1;
            const isFastestTotal = total === fastestTotal && ecosystems.length > 1;
            return (
              <tr
                key={key}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <td style={{ padding: "10px 10px", fontWeight: 600, color: b.color }}>
                  {b.name}
                </td>
                <td style={{
                  textAlign: "right", padding: "10px 10px",
                  fontWeight: 700, fontSize: 15,
                  color: isFastestProve ? "#7ee0a3" : "#e6e6e6",
                }}>
                  {fmt(r.median)}
                  {isFastestProve && (
                    <span style={{ marginLeft: 6, fontSize: 9, color: "#7ee0a3", fontWeight: 400 }}>fastest</span>
                  )}
                </td>
                <td style={{ textAlign: "right", padding: "10px 10px", color: "#f0a060" }}>
                  ~{fmt(blockMs)}
                </td>
                <td style={{
                  textAlign: "right", padding: "10px 10px",
                  color: consumeMs > 0 ? "#e6e6e6" : "#4a5568",
                }}>
                  {consumeMs > 0 ? fmt(consumeMs) : "—"}
                </td>
                <td style={{
                  textAlign: "right", padding: "10px 10px",
                  color: consumeMs > 0 ? "#f0a060" : "#4a5568",
                }}>
                  {consumeMs > 0 ? `~${fmt(blockMs)}` : "—"}
                </td>
                <td style={{
                  textAlign: "right", padding: "10px 10px",
                  fontWeight: 600, fontSize: 14,
                  color: isFastestTotal ? "#7ee0a3" : "#d8dee5",
                }}>
                  ~{fmt(total)}
                  {isFastestTotal && (
                    <span style={{ marginLeft: 6, fontSize: 9, color: "#7ee0a3", fontWeight: 400 }}>fastest</span>
                  )}
                </td>
                <td style={{ textAlign: "right", padding: "10px 10px", color: "#9aa0a6" }}>{r.n}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
