import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--enable-features=SharedArrayBuffer',
  ],
});
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on('console', async m => {
  const args = await Promise.all(m.args().map(a => a.jsonValue().catch(() => a.toString())));
  console.log(`[${m.type()}]`, ...args);
});
page.on('pageerror', e => console.error('[page-error]', e.message));
page.on('requestfailed', r => console.error('[req-failed]', r.url(), r.failure()?.errorText));

await page.goto('http://localhost:3000/aleo/');
console.log('--- page loaded ---');

const coi = await page.evaluate(() => crossOriginIsolated);
console.log('--- crossOriginIsolated:', coi, '---');

if (!coi) {
  // Wait for SW to register and reload
  console.log('--- waiting for SW reload ---');
  await page.waitForTimeout(3000);
  await page.reload();
  await page.waitForTimeout(2000);
  const coi2 = await page.evaluate(() => crossOriginIsolated);
  console.log('--- crossOriginIsolated after reload:', coi2, '---');
}

console.log('--- proceeding ---');

// MT mode is default
// Click "Run all (1→2)"
await page.locator('button', { hasText: 'Run all' }).click();
console.log('--- clicked Run all ---');

// Wait for the bench to complete — proving can take minutes on ST
// Check every 5s if phase changed to done or error appeared
let done = false;
const deadline = Date.now() + 30 * 60_000;
while (!done && Date.now() < deadline) {
  done = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const cycleBtn = btns.find(b => /Run \d+ cycles/.test(b.textContent || ''));
    const errEl = document.querySelector('.err');
    return !!(cycleBtn && !cycleBtn.disabled) || !!errEl;
  });
  if (!done) await page.waitForTimeout(5000);
}

console.log('--- bench complete ---');
await new Promise(r => setTimeout(r, 2000));
await browser.close();
