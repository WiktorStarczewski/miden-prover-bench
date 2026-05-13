// Aleo proving worker — uses raw @provablehq/wasm primitives directly.
// No top-level await so onmessage is set immediately.
//
// Supports:
// - "init": load WASM, init thread pool, set up account
// - "fetchCreditsKeys": download proving key from CDN, load embedded verifying key
// - "run": offline execution (no chain state)
// - "transferOnChain": real credits.aleo::transfer_public via buildTransferTransaction
//   (fetches inclusion proofs from testnet, proves locally)

const TESTNET_API = "https://api.provable.com/v2";

let mod = null;
let aliceKey = null;
let aliceAddr = "";
let bobAddr = "";
let cachedProvingKey = null;
let cachedVerifyingKey = null;
let feeProvingKey = null;
let feeVerifyingKey = null;
let creditsProgramSource = null;

function post(msg) {
  postMessage(msg);
}

function log(text) {
  post({ type: "log", text });
}

async function loadWasm() {
  if (mod) return mod;
  log("worker: importing wasm.js...");
  mod = await import("./wasm.js");
  log("worker: wasm.js imported successfully");
  return mod;
}

async function handleInit(threads, privateKeyStr) {
  const wasm = await loadWasm();

  log(`worker: calling initThreadPool(${threads})`);
  const t0 = performance.now();
  await wasm.initThreadPool(threads);
  log(
    `worker: initThreadPool(${threads}) took ${(performance.now() - t0).toFixed(0)}ms`
  );

  // Use provided private key (persistent bench account) or generate new
  if (privateKeyStr) {
    aliceKey = wasm.PrivateKey.from_string(privateKeyStr);
    log("worker: using provided private key");
  } else {
    aliceKey = new wasm.PrivateKey();
    log("worker: generated new private key");
  }
  aliceAddr = wasm.Address.from_private_key(aliceKey).to_string();

  // Bob is always a fresh random address
  const bobKey = new wasm.PrivateKey();
  bobAddr = wasm.Address.from_private_key(bobKey).to_string();

  // Cache the credits.aleo program source from WASM
  creditsProgramSource = wasm.Program.getCreditsProgram().toString();
  log(`worker: credits.aleo program loaded (${creditsProgramSource.length} chars)`);

  post({ type: "init", ok: true, alice: aliceAddr, bob: bobAddr });
}

async function handleFetchCreditsKeys() {
  if (!mod) throw new Error("Not initialized");
  const wasm = mod;
  const t0 = performance.now();

  // --- transfer_public keys ---
  const meta = wasm.Metadata.transfer_public();
  log(`worker: fetching transfer_public proving key from CDN...`);
  const pkResp = await fetch(meta.prover);
  if (!pkResp.ok) throw new Error(`Failed to fetch transfer proving key: ${pkResp.status}`);
  const pkBytes = new Uint8Array(await pkResp.arrayBuffer());
  log(`worker: transfer proving key (${(pkBytes.length / 1024 / 1024).toFixed(1)} MB) downloaded in ${(performance.now() - t0).toFixed(0)}ms`);
  cachedProvingKey = wasm.ProvingKey.fromBytes(pkBytes);
  cachedVerifyingKey = wasm.VerifyingKey[meta.verifyingKey]();

  // --- fee_public keys ---
  const feeMeta = wasm.Metadata.fee_public();
  log(`worker: fetching fee_public proving key from CDN...`);
  const t1 = performance.now();
  const feeResp = await fetch(feeMeta.prover);
  if (!feeResp.ok) throw new Error(`Failed to fetch fee proving key: ${feeResp.status}`);
  const feeBytes = new Uint8Array(await feeResp.arrayBuffer());
  log(`worker: fee proving key (${(feeBytes.length / 1024 / 1024).toFixed(1)} MB) downloaded in ${(performance.now() - t1).toFixed(0)}ms`);
  feeProvingKey = wasm.ProvingKey.fromBytes(feeBytes);
  feeVerifyingKey = wasm.VerifyingKey[feeMeta.verifyingKey]();

  const totalMs = performance.now() - t0;
  log(`worker: all credits keys ready in ${totalMs.toFixed(0)}ms`);
  post({ type: "fetchCreditsKeys", ok: true, durationMs: totalMs });
}

async function handleTransferOnChain(recipient, amountCredits, priorityFee) {
  if (!aliceKey) throw new Error("Not initialized");
  if (!cachedProvingKey) throw new Error("Keys not fetched");
  const wasm = mod;

  // --- Phase 1: Build + prove (timed as proveMs) ---
  log(`worker: buildTransferTransaction (transfer_public, ${amountCredits} credits -> ${recipient.slice(0, 16)}...)`);
  const t0 = performance.now();
  const tx = await wasm.ProgramManager.buildTransferTransaction(
    aliceKey,
    amountCredits,
    recipient,
    "public",
    null,
    priorityFee,
    null,
    TESTNET_API,
    cachedProvingKey,
    cachedVerifyingKey,
    feeProvingKey,
    feeVerifyingKey
  );
  const proveMs = performance.now() - t0;

  let txId = "unknown";
  try { txId = tx.transactionId?.() || tx.id?.() || tx.toString().slice(0, 32); } catch {}
  log(`worker: proved in ${proveMs.toFixed(0)}ms, txId=${txId}`);

  // --- Phase 2: Submit transaction ---
  log(`worker: submitting tx to ${TESTNET_API}...`);
  const tSubmit = performance.now();
  try {
    const txStr = tx.toString();
    const resp = await fetch(TESTNET_API + "/testnet/transaction/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txStr),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      log(`worker: broadcast failed (${resp.status}): ${errText.slice(0, 200)}`);
    } else {
      log(`worker: broadcast ok in ${(performance.now() - tSubmit).toFixed(0)}ms`);
    }
  } catch (e) {
    log(`worker: broadcast error: ${e}`);
  }

  // --- Phase 3: Wait for on-chain confirmation ---
  log(`worker: waiting for on-chain confirmation...`);
  const tWait = performance.now();
  let blockWaitMs = 0;
  try {
    const pollUrl = TESTNET_API + "/testnet/transaction/" + txId;
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const resp = await fetch(pollUrl);
        if (resp.ok) {
          blockWaitMs = performance.now() - tWait;
          log(`worker: confirmed on-chain in ${(blockWaitMs / 1000).toFixed(1)}s`);
          break;
        }
      } catch { /* keep polling */ }
    }
    if (blockWaitMs === 0) {
      blockWaitMs = performance.now() - tWait;
      log(`worker: confirmation timed out after ${(blockWaitMs / 1000).toFixed(0)}s`);
    }
  } catch (e) {
    blockWaitMs = performance.now() - tWait;
    log(`worker: confirmation poll error: ${e}`);
  }

  post({
    type: "transferOnChain",
    ok: true,
    durationMs: proveMs,
    blockWaitMs,
    txId,
  });
}

async function handleRun(program, fn, inputs) {
  if (!aliceKey) throw new Error("Not initialized");
  const wasm = mod;
  const programSource = program === "credits.aleo" ? creditsProgramSource : program;
  const t0 = performance.now();
  const response = await wasm.ProgramManager.executeFunctionOffline(
    aliceKey,
    programSource,
    fn,
    inputs,
    true,
    false,
    null,
    cachedProvingKey,
    cachedVerifyingKey
  );
  const ms = performance.now() - t0;
  const outputs = response.getOutputs();
  post({ type: "run", ok: true, durationMs: ms, outputs });
}

log("worker: ready");

onmessage = async function (e) {
  log("worker: received message type=" + e.data.type);
  try {
    switch (e.data.type) {
      case "init":
        await handleInit(e.data.threads, e.data.privateKey);
        break;
      case "fetchCreditsKeys":
        await handleFetchCreditsKeys();
        break;
      case "transferOnChain":
        await handleTransferOnChain(e.data.recipient, e.data.amount, e.data.priorityFee || 0);
        break;
      case "run":
        await handleRun(e.data.program, e.data.fn, e.data.inputs);
        break;
    }
  } catch (err) {
    post({ type: "error", source: e.data.type, message: String(err) });
  }
};
