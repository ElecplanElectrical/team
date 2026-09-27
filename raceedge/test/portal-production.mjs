import { chromium } from 'playwright';

const base = process.env.RACEEDGE_BASE_URL || 'https://raceedge-v1-production.up.railway.app';

async function waitForPortal(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#viewRoot .hero-card, #viewRoot .meeting-grid', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('#liveText')?.textContent !== 'CONNECTING', null, { timeout: 30000 });
}

async function clickAndWait(page, selector, expected) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  await el.click();
  await page.locator(expected).first().waitFor({ state: 'visible', timeout: 15000 });
}

async function runViewport(name, viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  page.on('response', r => {
    const u = r.url();
    if (u.startsWith(base) && r.status() >= 500) errors.push('http ' + r.status() + ': ' + u);
  });

  await waitForPortal(page);

  const logo = page.locator('#brandLogo');
  await logo.waitFor({ state: 'visible' });
  const logoOk = await logo.evaluate(img => img.complete && img.naturalWidth > 0);
  if (!logoOk) throw new Error('RaceEdge approved logo did not render');

  await clickAndWait(page, '[data-nav="races"]', '.meeting-card');
  await page.locator('[data-code="R"]').click();
  await page.locator('[data-code="ALL"]').click();

  await clickAndWait(page, '.meeting-card', '.race-card');
  await clickAndWait(page, '.race-card', '[data-racetab="tips"]');

  for (const tab of ['tips','form','analysis','pace']) {
    await page.locator(`[data-racetab="${tab}"]`).click();
    await page.waitForTimeout(150);
  }

  await page.locator('[data-racetab="form"]').click();
  const runnerCount = await page.locator('.runner-card').count();
  if (runnerCount > 0) {
    await clickAndWait(page, '.runner-card', '[data-runnertab="form"]');
    for (const tab of ['form','stats','track','history']) {
      await page.locator(`[data-runnertab="${tab}"]`).click();
      await page.waitForTimeout(150);
    }
  }

  for (const nav of ['tips','results','more','home']) {
    await page.locator(`[data-nav="${nav}"]`).first().click();
    await page.waitForTimeout(200);
  }

  if (name === 'mobile') {
    const mobileNavVisible = await page.locator('.mobile-nav').evaluate(el => getComputedStyle(el).display !== 'none');
    if (!mobileNavVisible) throw new Error('Mobile navigation is not visible on mobile viewport');
  }

  await page.screenshot({ path: `/tmp/raceedge-${name}.png`, fullPage: true });

  if (errors.length) {
    throw new Error(`Browser errors detected:\n${errors.join('\n')}`);
  }

  console.log(JSON.stringify({
    viewport: name,
    title: await page.title(),
    liveStatus: await page.locator('#liveText').textContent(),
    meetings: await page.locator('.meeting-card').count(),
    runnerDrilldownTested: runnerCount > 0
  }));

  await browser.close();
}

await runViewport('desktop', { width: 1440, height: 1000 });
await runViewport('mobile', { width: 390, height: 844 });
