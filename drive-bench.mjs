// Headless bench driver. Usage:
//   node drive-bench.mjs <variant> <auth> [cycles]
// Examples:
//   node drive-bench.mjs mt ecdsa 10
//   node drive-bench.mjs gpu ecdsa 10
//   node drive-bench.mjs gpu falcon 5
//
// Captures every line of console output that starts with "[proving-timing]"
// to stdout, plus a final JSON summary with parsed prove durations.
//
// Designed to be driven from a shell. The bench page must be running at
// http://localhost:3000 with COOP/COEP headers (so SharedArrayBuffer works).

import { chromium } from 'playwright';

const variant = process.argv[2] || 'mt';
const auth = process.argv[3] || 'ecdsa';
const cycles = Number(process.argv[4] ?? 10);

if (!['st', 'mt', 'gpu'].includes(variant)) throw new Error(`bad variant: ${variant}`);
if (!['ecdsa', 'falcon'].includes(auth)) throw new Error(`bad auth: ${auth}`);

const samples = [];
const lines = [];

const browser = await chromium.launch({
  headless: true,
  args: [
    // SAB requires same-origin isolation.
    '--enable-features=SharedArrayBuffer,Vulkan',
    // WebGPU in headless requires unsafe-webgpu + the Metal backend on macOS.
    '--enable-unsafe-webgpu',
    '--use-angle=metal',
    '--enable-webgpu-developer-features',
  ],
});

const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

page.on('console', (msg) => {
  const txt = msg.text();
  if (!txt.includes('[proving-timing]')) return;
  lines.push(txt);
  process.stdout.write(txt + '\n');
  // Parse "outer variant=<v> prover=local duration_ms=<n>"
  const m = txt.match(/outer variant=(\S+) prover=local duration_ms=([\d.]+)/);
  if (m) samples.push({ variant: m[1], duration_ms: Number(m[2]) });
});

await page.goto('http://localhost:3000', { waitUntil: 'load' });

// Sanity check — wait for crossOriginIsolated and the variant tabs.
await page.waitForFunction(() => crossOriginIsolated === true, null, { timeout: 30_000 });

// Probe WebGPU adapter info — verifies whether headless is using real Metal or
// a software fallback. Hardware adapters report architecture/vendor/device;
// software adapters typically report vendor="" or architecture="cpu".
const gpuInfo = await page.evaluate(async () => {
  if (!('gpu' in navigator)) return { available: false, reason: 'no navigator.gpu' };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { available: false, reason: 'requestAdapter returned null' };
    const info = adapter.info ?? {};
    return {
      available: true,
      isFallbackAdapter: !!adapter.isFallbackAdapter,
      vendor: info.vendor ?? '(none)',
      architecture: info.architecture ?? '(none)',
      device: info.device ?? '(none)',
      description: info.description ?? '(none)',
    };
  } catch (e) {
    return { available: false, reason: String(e) };
  }
});
console.log(`[driver] navigator.gpu adapter:`, JSON.stringify(gpuInfo));

// Click variant tab. Tab labels: "Single-threaded", "Multi-threaded", "WebGPU".
const variantLabel = { st: 'Single-threaded', mt: 'Multi-threaded', gpu: 'WebGPU' }[variant];
await page.locator('.tab-btn').filter({ hasText: variantLabel }).first().click();

// Click auth segmented control. Buttons literally say "ECDSA" / "Falcon".
const authLabel = auth === 'ecdsa' ? 'ECDSA' : 'Falcon';
await page.locator('.seg button').filter({ hasText: new RegExp(`^${authLabel}$`) }).first().click();

// Run all (init→mint→consume→send) — the panel button labelled "Run all (1→4)".
await page.locator('button', { hasText: 'Run all (1→4)' }).first().click();

// Wait for the cycles button to enable, then click it.
const cyclesBtn = page.locator('button', { hasText: /Run \d+ cycles/ }).first();
await cyclesBtn.waitFor({ state: 'attached' });
// Wait until enabled (cycleReady).
await page.waitForFunction(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /Run \d+ cycles/.test(b.textContent || '')
  );
  return btn && !btn.disabled;
}, null, { timeout: 5 * 60_000 });

await cyclesBtn.click();

// Wait for "cycles complete" log line.
await page.waitForFunction(
  () => false,
  null,
  { timeout: 60_000 } // reset timer; rely on the line listener below
).catch(() => {});

// Better: poll the captured lines until "cycles complete" appears.
const completionDeadline = Date.now() + 25 * 60_000; // 25 min ceiling
while (Date.now() < completionDeadline) {
  if (lines.some((l) => l.includes('cycles complete'))) break;
  await new Promise((r) => setTimeout(r, 1000));
}

// Compose summary.
const summaryLine = lines.find((l) => l.includes('cycles complete')) || '(no cycles complete line)';
console.log('\n--- DRIVER SUMMARY ---');
console.log(`variant=${variant} auth=${auth} cycles=${cycles}`);
console.log(`samples (n=${samples.length}):`, samples.map((s) => s.duration_ms).join(', '));
if (samples.length) {
  const sorted = [...samples.map((s) => s.duration_ms)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  console.log(`min=${min.toFixed(0)} median=${median.toFixed(0)} max=${max.toFixed(0)}`);
}
console.log('summary line:', summaryLine);

await browser.close();
