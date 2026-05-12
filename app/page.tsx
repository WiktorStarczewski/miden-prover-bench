"use client";

import Link from "next/link";

const BENCHMARKS = [
  {
    name: "Miden",
    proof: "Plonky3 STARK",
    href: "/miden/",
    color: "#1f8a4c",
    description: "MidenClient SDK · testnet · local prover",
    operation: "transactions.send() — note creation + auth (ECDSA/Falcon)",
  },
  {
    name: "Aleo",
    proof: "Varuna V2 zk-SNARK",
    href: "/aleo/",
    color: "#4a6ee0",
    description: "@provablehq/wasm · testnet · credits.aleo",
    operation: "buildTransferTransaction — transfer_public + fee_public",
  },
  {
    name: "Aztec",
    proof: "UltraHonk (Barretenberg)",
    href: "/aztec/",
    color: "#a855f7",
    description: "EmbeddedWallet + PXE · testnet · private token transfer",
    operation: "token.transfer().send(NO_WAIT) — simulate + prove",
  },
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1040, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <h1>ZK Proving Bench</h1>
        <p style={{ color: "#9aa0a6", margin: 0, fontSize: 14 }}>
          Browser-based proving benchmarks across ZK ecosystems.
          Each benchmark measures the local proving time for
          &quot;Alice sends tokens to Bob&quot; — a real transaction on each
          ecosystem&apos;s testnet.
        </p>
      </header>

      <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {BENCHMARKS.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="glass"
              style={{
                padding: 20,
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
                  marginBottom: 6,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    color: b.color,
                  }}
                >
                  {b.name}
                </h2>
                <span
                  style={{ fontSize: 13, color: "#9aa0a6", fontWeight: 400 }}
                >
                  {b.proof}
                </span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#d8dee5" }}>
                {b.description}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                <code>{b.operation}</code>
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="glass" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Benchmark comparison</h3>
        <p style={{ color: "#9aa0a6", fontSize: 13, margin: "0 0 16px" }}>
          Each benchmark has ST (single-threaded) and MT (multi-threaded) modes.
          Click a benchmark above to run it individually, or use the headless
          drivers for automated runs:
        </p>
        <pre
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12.5,
            lineHeight: 1.6,
            color: "#d8dee5",
            margin: 0,
            padding: 14,
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

# Aztec (MT, private token transfer via PXE)
# Run from browser — /aztec/ route`}
        </pre>

        <h4 style={{ margin: "20px 0 8px", fontWeight: 600 }}>
          Latest results (Apple M4 Pro, 12 cores, MT)
        </h4>
        <pre
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            lineHeight: 1.7,
            color: "#e6e6e6",
            margin: 0,
            padding: 14,
            borderRadius: 10,
            background: "rgba(8, 11, 14, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
{`ecosystem | proof system      |   med ms | operation
----------+------------------+----------+-----------------------------
Miden     | Plonky3 STARK    |   5,968  | send (note creation + ECDSA)
Aleo      | Varuna V2 SNARK  |  11,854  | transfer_public + fee_public
Aztec     | UltraHonk        |  14,652  | private token transfer`}
        </pre>
        <p style={{ color: "#6b7280", fontSize: 11, margin: "8px 0 0" }}>
          Miden measures proveTransaction only. Aleo includes network fetch of
          inclusion proofs + two Varuna proofs (transfer + fee). Aztec includes
          simulation + kernel proving + HTTP submit (NO_WAIT, no block
          inclusion).
        </p>
      </div>
    </main>
  );
}
