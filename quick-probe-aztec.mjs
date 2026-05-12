import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-features=SharedArrayBuffer'],
});
const ctx = await browser.newContext();
const page = await ctx.newPage();

page.on('console', async m => {
  const args = await Promise.all(m.args().map(a => a.jsonValue().catch(() => a.toString())));
  console.log(`[${m.type()}]`, ...args);
});
page.on('pageerror', e => console.error('[page-error]', e.message));

await page.goto('http://localhost:3000/aztec/');
const coi = await page.evaluate(() => crossOriginIsolated);
if (!coi) {
  await page.waitForTimeout(3000);
  await page.reload();
  await page.waitForTimeout(2000);
}
console.log('--- crossOriginIsolated:', await page.evaluate(() => crossOriginIsolated), '---');

// Click "Run all (1→2)"
await page.locator('button', { hasText: 'Run all' }).click();
console.log('--- clicked Run all ---');

// Wait for completion
let done = false;
const deadline = Date.now() + 15 * 60_000;
while (!done && Date.now() < deadline) {
  done = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const cycleBtn = btns.find(b => /Run \d+ cycles/.test(b.textContent || ''));
    const errEl = document.querySelector('.err');
    return !!(cycleBtn && !cycleBtn.disabled) || !!errEl;
  });
  if (!done) await page.waitForTimeout(3000);
}

console.log('--- bench complete ---');
await new Promise(r => setTimeout(r, 2000));
await browser.close();
