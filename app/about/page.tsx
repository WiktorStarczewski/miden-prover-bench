"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href={(process.env.NEXT_PUBLIC_BASE_PATH || "") + "/"}
          style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}
        >
          &larr; Back to dashboard
        </Link>
        <h1 style={{ marginTop: 12 }}>About this benchmark</h1>
      </header>

      <div className="glass" style={{ padding: 24 }}>
        <Section title="What we measure">
          <p>
            Each benchmark measures the same user-facing operation:{" "}
            <strong>Alice sends tokens to Bob</strong>. Specifically, we time
            the local proving step — the computation that generates a
            zero-knowledge proof of the transaction&apos;s validity. This is the
            bottleneck that determines how long a user waits in their wallet
            before a transaction can be submitted.
          </p>
          <p>
            We do NOT measure block inclusion time, network latency, or
            sequencer processing. Those depend on chain infrastructure, not
            prover performance.
          </p>
        </Section>

        <Section title="Why this comparison matters">
          <p>
            Privacy-preserving blockchains require users to generate
            zero-knowledge proofs locally — in the browser, on their device.
            Unlike L1s where a signature takes milliseconds, ZK transaction
            proving can take seconds to minutes. This directly impacts UX: a
            user staring at a spinner for 15 seconds has a fundamentally
            different experience than one waiting 5 seconds.
          </p>
          <p>
            As these ecosystems mature and wallets ship browser-based proving,
            prover performance becomes a key competitive differentiator. This
            benchmark provides an objective, reproducible measurement.
          </p>
        </Section>

        <Section title="The ecosystems">
          <Table
            headers={["", "Miden", "Aleo", "Aztec"]}
            rows={[
              [
                "Proof system",
                "Plonky3 (STARK)",
                "Varuna V2 (zk-SNARK)",
                "UltraHonk (Barretenberg)",
              ],
              [
                "Execution model",
                "Miden VM (stack-based)",
                "Aleo VM (register-based)",
                "Noir circuits (static)",
              ],
              [
                "Privacy model",
                "Notes (UTXO-like)",
                "Records (UTXO) + Mappings (public)",
                "Notes (UTXO) + public state",
              ],
              [
                "WASM prover",
                "rayon (wasm-bindgen)",
                "rayon (custom bridge)",
                "Barretenberg WASM",
              ],
              [
                "Threading",
                "Separate ST/MT builds",
                "Runtime initThreadPool(N)",
                "Auto-detect (SharedArrayBuffer)",
              ],
            ]}
          />
        </Section>

        <Section title="What each benchmark does">
          <h4 style={{ color: "#1f8a4c", margin: "0 0 6px" }}>Miden</h4>
          <p>
            Uses the official <code>@miden-sdk/miden-sdk</code> — the same SDK
            a browser wallet uses. Creates a MidenClient connected to testnet,
            deploys accounts locally, and calls{" "}
            <code>client.transactions.send()</code>. The timing wrapper captures{" "}
            <code>proveTransaction()</code> — the WASM proving step inside the
            SDK&apos;s Web Worker. Includes serialization, STARK proof
            generation (Plonky3), and deserialization. Does NOT include chain
            sync or HTTP submission.
          </p>

          <h4 style={{ color: "#4a6ee0", margin: "16px 0 6px" }}>Aleo</h4>
          <p>
            Uses <code>@provablehq/wasm</code> directly (the raw WASM bindings
            from SnarkVM). Runs inside a Web Worker (required for{" "}
            <code>Atomics.wait</code> / rayon). Calls{" "}
            <code>ProgramManager.buildTransferTransaction()</code> which fetches
            state inclusion proofs from the Aleo testnet, then proves both the{" "}
            <code>transfer_public</code> execution AND the{" "}
            <code>fee_public</code> execution locally (two Varuna V2 proofs per
            transaction). The timing includes the network roundtrip for
            inclusion proofs.
          </p>

          <h4 style={{ color: "#a855f7", margin: "16px 0 6px" }}>Aztec</h4>
          <p>
            Uses the full <code>EmbeddedWallet</code> + PXE (Private Execution
            Environment) from <code>@aztec/wallets</code>, connected to the
            Aztec testnet. Creates a Schnorr account, deploys a TokenContract,
            mints tokens, then measures{" "}
            <code>token.methods.transfer().send(NO_WAIT)</code>. This includes
            private function simulation, kernel circuit proving (UltraHonk via
            Barretenberg WASM), and HTTP submission — but NOT block inclusion
            wait (~72s on testnet). Uses SponsoredFPC for fee payment.
          </p>
        </Section>

        <Section title="Caveats and fairness">
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <strong>Not pure proving time.</strong> Each benchmark includes
              slightly different overhead: Miden measures just{" "}
              <code>proveTransaction</code>, Aleo includes network fetch of
              inclusion proofs, Aztec includes simulation + HTTP submit. The
              proving itself dominates in all cases.
            </li>
            <li>
              <strong>Different proof systems prove different things.</strong>{" "}
              Miden proves full VM execution (including ECDSA auth). Aleo
              proves two separate program executions (transfer + fee). Aztec
              proves a private function execution plus kernel circuits. The
              &quot;amount of computation being proven&quot; differs.
            </li>
            <li>
              <strong>Proof sizes and verification costs differ.</strong> STARKs
              (Miden) produce larger proofs but don&apos;t need trusted setup.
              SNARKs (Aleo, Aztec) produce smaller proofs but have different
              trust assumptions.
            </li>
            <li>
              <strong>Run-to-run variance is 5-15%.</strong> WASM performance
              is affected by JIT compilation, thermal throttling (especially on
              Apple Silicon), and garbage collection. The median over 10 cycles
              with cooldown is the most reliable metric.
            </li>
            <li>
              <strong>All benchmarks use testnet.</strong> Production
              performance may differ due to different circuit sizes, proving
              key sizes, or state tree depths.
            </li>
          </ul>
        </Section>

        <Section title="Reproducibility">
          <p>
            All benchmarks run in headless Chromium via Playwright or in any
            modern browser with COOP/COEP headers (required for{" "}
            <code>SharedArrayBuffer</code>). The code is open-source at{" "}
            <a
              href="https://github.com/WiktorStarczewski/miden-prover-bench"
              style={{ color: "#7ee0a3" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              WiktorStarczewski/miden-prover-bench
            </a>
            .
          </p>
          <p>
            To reproduce: clone the repo, <code>yarn install</code>,{" "}
            <code>yarn build</code>, serve with COOP/COEP headers, then run the
            headless drivers or open the bench pages in a browser.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <div style={{ color: "#d8dee5", fontSize: 14, lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  color: "#9aa0a6",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "8px 10px",
                    color: j === 0 ? "#9aa0a6" : "#d8dee5",
                    fontWeight: j === 0 ? 500 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
