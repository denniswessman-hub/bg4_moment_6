const { chromium, expect } = require('playwright/test');
const assert = require('node:assert/strict');
const base = 'https://denniswessman-hub.github.io/bg4_moment_6/';
let browser;
(async () => {
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width:775, height:912 }, reducedMotion:'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if(e.type() === 'error') errors.push(e.text()); });
  await page.goto(`${base}#bild-12`);
  await expect(page.locator('body')).toHaveAttribute('data-version', '1.4.0');
  await expect(page.locator('.slide')).toHaveCount(12);
  await expect(page.locator('#printButton')).toHaveCount(0);
  for (let n=1;n<=12;n++) {
    await page.goto(`${base}#bild-${n}`);
    await expect(page.locator('#progressLabel')).toHaveText(`${n} / 12`);
  }
  await page.locator('#classQuizButton').click();
  await expect(page.locator('.slide.is-active #classQuizPanel')).toBeVisible();
  for (const answer of [0,1,1,0,2,0,1]) {
    await page.locator('.quiz-answer').nth(answer).click();
    await page.locator('#quizNext').click();
  }
  await expect(page.locator('#evidencePrompt')).toHaveText('Klart: 7 av 7 rätt');
  await page.locator('#classQuizReset').click();
  await expect(page.locator('#quizProgress')).toHaveText('1 av 7');
  const popupPromise = page.waitForEvent('popup');
  await page.locator('#presenterButton').click();
  const presenter = await popupPromise;
  await expect(presenter.locator('#presenterPosition')).toHaveText('12 / 12');
  await expect(presenter.locator('#presenterNotes')).toContainText('direkt på bild 12');
  await presenter.close();
  await page.locator('#sourcesButton').click();
  await expect(page.locator('#sourceDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-version', '1.4.0');
  await page.locator('#classQuizButton').click();
  await expect(page.locator('#quizProgress')).toHaveText('1 av 7');
  assert.equal(await page.evaluate(async () => (await fetch('./assets/bg4-oldboys.png')).ok), true);
  assert.deepEqual(errors, []);
  console.log('LIVE PASS: version 1.4.0; 12 slides; inline quiz 7/7; reset; notes; sources; offline; no browser errors');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if(browser) await browser.close(); });
