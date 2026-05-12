"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (1 - (pos - lo)) + sorted[hi] * (pos - lo);
}

export default function HomePage() {
  const [results, setResults] = useState<BenchResult[]>([]);

  // Read localStorage on mount, on visibility change, and poll periodically
  useEffect(() => {
    const refresh = () => setResults(loadResults());
    refresh();
    const interval = setInterval(refresh, 2000);
    // Also refresh when user switches back to this tab
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    // Refresh on popstate (browser back button)
    window.addEventListener("popstate", refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", refresh);
    };
  }, []);

  function clearResults() {
    localStorage.removeItem(STORAGE_KEY);
    setResults([]);
  }

  // Group latest result per ecosystem
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
      <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0 }}>Comparison</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.keys(latest).length > 0 && (
              <button
                type="button"
                className="btn"
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={clearResults}
              >
                Clear results
              </button>
            )}
          </div>
        </div>

        {Object.keys(latest).length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            No results yet. Open each benchmark page and run cycles — results
            are stored automatically and appear here.
          </p>
        ) : (
          <ComparisonTable results={latest} />
        )}

        <p
          style={{
            color: "#6b7280",
            fontSize: 11,
            margin: "12px 0 0",
            lineHeight: 1.5,
          }}
        >
          Results are stored in localStorage and persist across page reloads.
          Run each benchmark individually — the latest median from each
          ecosystem appears here automatically. All times are local proving
          only (no block inclusion wait).
        </p>
      </div>

      {/* How to run */}
      <div className="glass" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 10px" }}>Headless drivers (CLI)</h3>
        <pre
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#d8dee5",
            margin: 0,
            padding: 12,
            borderRadius: 10,
            background: "rgba(8, 11, 14, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            whiteSpace: "pre-wrap",
          }}
        >
          {`# Miden (ST / MT, ECDSA / Falcon)
node drive-bench.mjs st ecdsa 10
node drive-bench.mjs mt ecdsa 10

# Aleo (ST / MT, credits.aleo transfer_public)
node drive-bench-aleo.mjs st 10
node drive-bench-aleo.mjs mt 10

# Aztec (full PXE, run from browser /aztec/ route)`}
        </pre>
      </div>
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

  // Find fastest for highlighting
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
            <th style={{ textAlign: "left", padding: "8px 12px" }}>
              Ecosystem
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>
              Median
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>p25</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>p75</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>IQR</th>
            <th style={{ textAlign: "right", padding: "8px 12px" }}>n</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>
              Variant
            </th>
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
                <td
                  style={{
                    padding: "10px 12px",
                    fontWeight: 600,
                    color: b.color,
                  }}
                >
                  {b.name}
                  {isFastest && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        color: "#7ee0a3",
                        fontWeight: 400,
                      }}
                    >
                      fastest
                    </span>
                  )}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 12px",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {r.median.toFixed(0)} ms
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 12px",
                    color: "#9aa0a6",
                  }}
                >
                  {r.p25.toFixed(0)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 12px",
                    color: "#9aa0a6",
                  }}
                >
                  {r.p75.toFixed(0)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 12px",
                    color: "#9aa0a6",
                  }}
                >
                  {r.iqr.toFixed(0)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "10px 12px",
                    color: "#9aa0a6",
                  }}
                >
                  {r.n}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "#9aa0a6",
                    fontSize: 12,
                  }}
                >
                  {r.variant}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
