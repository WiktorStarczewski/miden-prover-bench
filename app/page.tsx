"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const BENCHMARKS = [
  {
    key: "miden",
    name: "Miden",
    proof: "Plonky3 STARK",
    href: "/miden/",
    color: "#1f8a4c",
    description: "MidenClient SDK · testnet · local prover",
    operation: "transactions.send() — note creation + auth (ECDSA)",
  },
  {
    key: "aleo",
    name: "Aleo",
    proof: "Varuna V2 zk-SNARK",
    href: "/aleo/",
    color: "#4a6ee0",
    description: "@provablehq/wasm · testnet · credits.aleo",
    operation: "buildTransferTransaction — transfer_public + fee_public",
  },
  {
    key: "aztec",
    name: "Aztec",
    proof: "UltraHonk (Barretenberg)",
    href: "/aztec/",
    color: "#a855f7",
    description: "EmbeddedWallet + PXE · testnet · private token transfer",
    operation: "token.transfer().send(NO_WAIT) — simulate + prove",
  },
];

type BenchResult = {
  ecosystem: string;
  variant: string;
  median: number;
  p25: number;
  p75: number;
  iqr: number;
  n: number;
  samples: number[];
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
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 14 }}>
          Browser-based proving benchmarks: how long does a user wait to prove
          &quot;Alice sends tokens to Bob&quot; in each ZK ecosystem?{" "}
          <Link href="/about/" style={{ color: "#7ee0a3" }}>
            Why this comparison matters &rarr;
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

      {/* Comparison table */}
      {Object.keys(latest).length > 0 && (
        <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 14px" }}>Comparison</h3>
          <ComparisonTable results={latest} />
          <p
            style={{
              color: "#6b7280",
              fontSize: 11,
              margin: "12px 0 0",
              lineHeight: 1.5,
            }}
          >
            All times are local proving only (no block inclusion wait). Results
            persist in localStorage across page reloads.
          </p>
        </div>
      )}
    </main>
  );
}

function ComparisonTable({
  results,
}: {
  results: Record<string, BenchResult>;
}) {
  const ecosystems = BENCHMARKS.map((b) => b.key).filter((k) => results[k]);
  if (ecosystems.length === 0) return null;

  const medians = ecosystems.map((k) => results[k].median);
  const fastest = Math.min(...medians);

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
          <tr
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              color: "#9aa0a6",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Ecosystem</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>Median</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>p25</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>p75</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>IQR</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>n</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Variant</th>
          </tr>
        </thead>
        <tbody>
          {ecosystems.map((key) => {
            const r = results[key];
            const b = BENCHMARKS.find((x) => x.key === key)!;
            const isFastest = r.median === fastest && ecosystems.length > 1;
            return (
              <tr
                key={key}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  color: isFastest ? "#7ee0a3" : "#e6e6e6",
                }}
              >
                <td style={{ padding: "10px 12px", fontWeight: 600, color: b.color }}>
                  {b.name}
                  {isFastest && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: "#7ee0a3", fontWeight: 400 }}>
                      fastest
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, fontSize: 15 }}>
                  {r.median.toFixed(0)} ms
                </td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#9aa0a6" }}>{r.p25.toFixed(0)}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#9aa0a6" }}>{r.p75.toFixed(0)}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#9aa0a6" }}>{r.iqr.toFixed(0)}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#9aa0a6" }}>{r.n}</td>
                <td style={{ padding: "10px 12px", color: "#9aa0a6", fontSize: 12 }}>{r.variant}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
