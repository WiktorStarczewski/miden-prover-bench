import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--enable-features=SharedArrayBuffer','--enable-unsafe-webgpu','--use-angle=metal'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', m => console.log(`[${m.type()}]`, m.text()));
await page.goto('http://localhost:3000/miden/');
await page.waitForFunction(() => crossOriginIsolated === true);
await page.locator('.tab-btn').filter({ hasText: 'Multi-threaded' }).click();
await page.locator('.seg button').filter({ hasText: /^ECDSA$/ }).click();
await page.locator('button', { hasText: 'Run all (1→4)' }).click();
// wait until init+mint+consume+send done
await page.waitForFunction(() => {
  const el = document.querySelector('button');
  return [...document.querySelectorAll('button')].some(b => /Run \d+ cycles/.test(b.textContent || '') && !b.disabled);
}, { timeout: 5*60_000 });
await new Promise(r => setTimeout(r, 5000));
await browser.close();
