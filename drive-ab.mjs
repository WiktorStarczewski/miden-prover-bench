// A/B per-phase prove timing. Runs the bench under one variant, captures
// per-span medians from the patched worker dump, then runs the second
// variant and prints a side-by-side delta table.
//
// Usage:
//   node drive-ab.mjs <a> <b> <auth>     e.g. node drive-ab.mjs mt gpu ecdsa
//
// Pass /F=N to set NUM_CYCLES (defaults to 10).

import { chromium } from 'playwright';

const a = process.argv[2] || 'mt';
const b = process.argv[3] || 'gpu';
const auth = process.argv[4] || 'ecdsa';

const SPAN_RE = /\[proving-timing\] span name="([^"]+)" total_ms=([\d.]+) count=(\d+)/;
const OUTER_RE = /outer variant=\S+ prover=local duration_ms=([\d.]+)/;

async function runOne(variant) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-features=SharedArrayBuffer,Vulkan', '--enable-unsafe-webgpu', '--use-angle=metal', '--enable-webgpu-developer-features'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  const proveBuckets = [];          // each prove = { duration, spans: { name -> ms } }
  let currentSpans = {};

  page.on('console', (msg) => {
    const txt = msg.text();
    if (!txt.includes('[proving-timing]')) return;
    const ms = txt.match(SPAN_RE);
    if (ms) {
      currentSpans[ms[1]] = Number(ms[2]);
      return;
    }
    const mo = txt.match(OUTER_RE);
    if (mo) {
      proveBuckets.push({ outer: Number(mo[1]), spans: currentSpans });
      currentSpans = {};
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  await page.waitForFunction(() => crossOriginIsolated === true);

  const variantLabel = { st: 'Single-threaded', mt: 'Multi-threaded', gpu: 'WebGPU' }[variant];
  await page.locator('.tab-btn').filter({ hasText: variantLabel }).first().click();
  const authLabel = auth === 'ecdsa' ? 'ECDSA' : 'Falcon';
  await page.locator('.seg button').filter({ hasText: new RegExp(`^${authLabel}$`) }).first().click();

  await page.locator('button', { hasText: 'Run all (1→4)' }).first().click();
  // Wait for the cycles button to be enabled.
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Run \d+ cycles/.test(b.textContent || ''));
    return btn && !btn.disabled;
  }, null, { timeout: 5 * 60_000 });
  await page.locator('button', { hasText: /Run \d+ cycles/ }).first().click();

  // Wait for "cycles complete" line.
  const t0 = Date.now();
  while (Date.now() - t0 < 25 * 60_000) {
    await new Promise((r) => setTimeout(r, 1000));
    if (proveBuckets.some((b) => false)) break;
    // approximate completion: 23 prove buckets (init mint + consume + send + 10*(send+consume))
    if (proveBuckets.length >= 23) break;
  }

  await browser.close();
  return proveBuckets;
}

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

const aBuckets = await runOne(a);
console.log(`\n[driver] ${a} got ${aBuckets.length} prove samples; running ${b}...\n`);
const bBuckets = await runOne(b);
console.log(`\n[driver] ${b} got ${bBuckets.length} prove samples`);

// Drop init prove (first sample is mint, includes JIT warmup); keep the rest.
const aValid = aBuckets.slice(1);
const bValid = bBuckets.slice(1);

const allSpans = new Set();
for (const x of [...aValid, ...bValid]) for (const k of Object.keys(x.spans)) allSpans.add(k);

const rows = [];
for (const span of allSpans) {
  const aSamples = aValid.map((x) => x.spans[span]).filter((v) => typeof v === 'number');
  const bSamples = bValid.map((x) => x.spans[span]).filter((v) => typeof v === 'number');
  const aMed = median(aSamples);
  const bMed = median(bSamples);
  if (aMed === null || bMed === null) continue;
  rows.push({ span, aMed, bMed, delta: bMed - aMed, ratio: bMed / aMed });
}

rows.sort((x, y) => Math.max(y.aMed, y.bMed) - Math.max(x.aMed, x.bMed));

const aOuter = median(aValid.map((x) => x.outer));
const bOuter = median(bValid.map((x) => x.outer));

console.log(`\n=== A/B (auth=${auth}, samples: a=${aValid.length} b=${bValid.length}) ===`);
console.log(`outer ${a}=${aOuter?.toFixed(0)}ms  ${b}=${bOuter?.toFixed(0)}ms  Δ=${(bOuter - aOuter).toFixed(0)}ms (${((bOuter / aOuter - 1) * 100).toFixed(1)}%)`);
console.log(`\n${'span'.padEnd(36)} ${a.padStart(10)} ${b.padStart(10)} ${'Δ ms'.padStart(10)} ${'ratio'.padStart(8)}`);
for (const r of rows) {
  const sign = r.delta > 0 ? '+' : '';
  console.log(`${r.span.padEnd(36)} ${r.aMed.toFixed(0).padStart(10)} ${r.bMed.toFixed(0).padStart(10)} ${(sign + r.delta.toFixed(0)).padStart(10)} ${(r.ratio.toFixed(2) + 'x').padStart(8)}`);
}
