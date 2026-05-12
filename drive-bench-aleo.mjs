// Headless Aleo bench driver. Usage:
//   node drive-bench-aleo.mjs <variant> [cycles]
// Examples:
//   node drive-bench-aleo.mjs st
//   node drive-bench-aleo.mjs mt 10
//
// Captures every line of console output that starts with "[proving-timing]"
// to stdout, plus a final JSON summary with parsed prove durations.
//
// The bench page must be running at http://localhost:3000 with COOP/COEP
// headers (so SharedArrayBuffer works for MT rayon thread pool).

import { chromium } from 'playwright';

const variant = process.argv[2] || 'mt';
const cycles = Number(process.argv[3] ?? 10);

if (!['st', 'mt'].includes(variant)) throw new Error(`bad variant: ${variant} (expected st|mt)`);

const samples = [];
const lines = [];

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-features=SharedArrayBuffer'],
});

const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

page.on('console', (msg) => {
  const txt = msg.text();
  if (!txt.includes('[proving-timing]')) return;
  lines.push(txt);
  process.stdout.write(txt + '\n');
  const m = txt.match(/outer variant=(\S+) prover=local duration_ms=([\d.]+)/);
  if (m) samples.push({ variant: m[1], duration_ms: Number(m[2]) });
});

await page.goto('http://localhost:3000/aleo/', { waitUntil: 'load' });

// Handle COI service worker — may need a reload
const coi = await page.evaluate(() => crossOriginIsolated);
if (!coi) {
  console.log('[driver] crossOriginIsolated=false, waiting for SW reload...');
  await page.waitForTimeout(3000);
  await page.reload();
  await page.waitForTimeout(2000);
  const coi2 = await page.evaluate(() => crossOriginIsolated);
  if (!coi2) throw new Error('crossOriginIsolated still false after SW reload');
}
console.log('[driver] crossOriginIsolated=true');

// Select thread mode tab
const variantLabel = { st: 'Single-threaded', mt: 'Multi-threaded' }[variant];
await page.locator('.tab-btn').filter({ hasText: variantLabel }).first().click();

// Run all (init + transfer)
await page.locator('button', { hasText: 'Run all' }).first().click();
console.log(`[driver] clicked "Run all" for variant=${variant}`);

// Wait for the cycles button to enable (init + first transfer done)
const completionDeadline = Date.now() + 30 * 60_000;
let done = false;
while (!done && Date.now() < completionDeadline) {
  done = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const cycleBtn = btns.find(b => /Run \d+ cycles/.test(b.textContent || ''));
    const errEl = document.querySelector('.err');
    return !!(cycleBtn && !cycleBtn.disabled) || !!errEl;
  });
  if (!done) await page.waitForTimeout(5000);
}

const hasErr = await page.evaluate(() => !!document.querySelector('.err'));
if (hasErr) {
  const errText = await page.evaluate(() => document.querySelector('.err')?.textContent || '');
  console.error('[driver] ERROR:', errText);
  await browser.close();
  process.exit(1);
}

console.log('[driver] init + first transfer complete');

// Run N cycles
const cyclesBtn = page.locator('button', { hasText: /Run \d+ cycles/ }).first();
await cyclesBtn.click();
console.log(`[driver] running ${cycles} cycles...`);

// Wait for "cycles complete"
const cycleDeadline = Date.now() + 60 * 60_000; // 60 min for cycles
while (Date.now() < cycleDeadline) {
  if (lines.some((l) => l.includes('cycles complete'))) break;
  await new Promise((r) => setTimeout(r, 2000));
}

// Summary
const summaryLine = lines.find((l) => l.includes('cycles complete')) || '(no cycles complete line)';
console.log('\n--- DRIVER SUMMARY ---');
console.log(`variant=aleo-${variant} cycles=${cycles}`);
console.log(`samples (n=${samples.length}):`, samples.map((s) => s.duration_ms.toFixed(1)).join(', '));
if (samples.length) {
  const sorted = [...samples.map((s) => s.duration_ms)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  console.log(`min=${min.toFixed(0)} median=${median.toFixed(0)} max=${max.toFixed(0)}`);
}
console.log('summary line:', summaryLine);

await browser.close();
