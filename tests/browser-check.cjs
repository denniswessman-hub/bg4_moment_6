// Run with Playwright available through NODE_PATH; no website runtime dependencies.
const { chromium, expect } = require('playwright/test');
const { createServer } = require('node:http');
const { readFileSync, mkdirSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(__dirname, 'artifacts');
mkdirSync(artifacts, { recursive: true });
const prior = new Map();
const release = '1.4.0';
const titles = ['TBL 5 § och 7 §', 'Två helt olika frågor', '5 § · hela lagtexten', '5 § · vad betyder orden?', '5 § TBL: rekvisiten', 'Scenario 1: Olycksplatsen', 'Gränsdragningen i praxis', '7 § · hela lagtexten', '7 § · vad betyder orden?', '7 § TBL: tre led', 'Två hovrättsfall', 'Från olycksplats till beslutsunderlag'];
let stage = 'fixed';
let holdOldWorker = false;
function getFile(name, ref) {
  if (!ref) return readFileSync(path.join(root, name));
  const key = `${ref}:${name}`;
  if (!prior.has(key)) prior.set(key, execFileSync(process.env.GIT_BIN || 'git', ['show', key], { cwd: root }));
  return prior.get(key);
}
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
  if (!path.resolve(root, name).startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const ref = name === 'service-worker.js' && holdOldWorker ? '51ef03c' : stage === 'old' ? '51ef03c' : stage === 'broken' ? '568881e' : null;
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png' })[path.extname(name)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(getFile(name, ref));
  } catch (_) { res.writeHead(404).end(); }
});
let browser;
const issues = [];
function watch(page) {
  page.on('pageerror', e => issues.push(e.message));
  page.on('console', e => { if (e.type() === 'error') issues.push(e.text()); });
}
async function checkQuiz(page) {
  const panel = page.locator('#classQuizPanel');
  if (!await panel.isVisible()) await page.locator('#classQuizButton').click();
  await expect(panel).toBeVisible();
  assert.equal(await panel.evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
  await expect(page.locator('#classQuizButton')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#classQuizReset').click();
  for (const [i, answer] of [0, 1, 1, 0, 2, 0, 1].entries()) {
    await expect(page.locator('#quizProgress')).toHaveText(`${i + 1} av 7`);
    await page.locator('.quiz-answer').nth(answer).click();
    await expect(page.locator('#quizFeedback')).toBeVisible();
    assert.equal(await panel.evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
    await expect(page.locator('#quizScore')).toHaveText(`${i + 1} rätt`);
    await page.locator('.quiz-answer').nth(answer).evaluate(button => button.click());
    await expect(page.locator('#quizScore')).toHaveText(`${i + 1} rätt`);
    await page.locator('#quizNext').click();
  }
  await expect(page.locator('#evidencePrompt')).toHaveText('Klart: 7 av 7 rätt');
  await expect(page.locator('#quizNext')).toBeHidden();
  await page.locator('#classQuizReset').click();
  await page.locator('.quiz-answer').nth(1).click();
  await expect(page.locator('#quizScore')).toHaveText('0 rätt');
  await expect(page.locator('#quizFeedback')).toContainText('Inte riktigt.');
  await expect(page.locator('.quiz-answer').nth(0)).toHaveClass(/is-correct/);
  await page.locator('#resetButton').click();
  await expect(page.locator('#quizProgress')).toHaveText('1 av 7');
  await expect(page.locator('#quizFeedback')).toBeHidden();
  await page.locator('#classQuizClose').click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#classQuizButton')).toBeFocused();
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage(); watch(page);
  let slideChecks = 0;
  for (const [width, height] of [[1440,900], [1024,768], [775,912], [390,844], [320,740], [844,390]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    assert.deepEqual(await page.locator('.slide').evaluateAll(xs => xs.map(x => x.dataset.title)), titles);
    assert.equal(await page.evaluate(() => window.speakerNotes.length), 12);
    for (let n = 1; n <= 12; n++) {
      await page.goto(`${base}#bild-${n}`);
      await expect(page.locator('.slide.is-active')).toHaveCount(1);
      await expect(page.locator('.slide.is-active')).toHaveAttribute('data-title', titles[n - 1]);
      await expect(page.locator('#progressLabel')).toHaveText(`${n} / 12`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('.slide.is-active').evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
      slideChecks++;
    }
    await checkQuiz(page);
    await page.locator('#classQuizButton').click();
    await page.screenshot({ path: path.join(artifacts, `quiz-${width}.png`) });
    await page.locator('#classQuizClose').click();
  }
  console.log(`PASS ${slideChecks} slide/viewport checks; quiz all seven answers, wrong answer, reset and close at six sizes`);
  await page.setViewportSize({ width:1440, height:900 });
  for (let n = 1; n <= 12; n++) {
    await page.goto(`${base}#bild-${n}`);
    for (const details of await page.locator('.slide.is-active details').all()) {
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
    }
    for (const button of await page.locator('.slide.is-active .choice').all()) {
      await button.click();
      await expect(button).toHaveClass(/is-selected/);
    }
    for (const button of await page.locator('.slide.is-active .step-card, .slide.is-active .case-reveal').all()) {
      await button.click(); await expect(button).toHaveAttribute('aria-expanded', 'true');
    }
    if (n === 5) {
      const count = await page.locator('.requisite').count();
      for (let i=1;i<count;i++) await page.locator('#revealNext').click();
      await expect(page.locator('#revealNext')).toBeDisabled();
      await expect(page.locator('#revealCount')).toHaveText(String(count));
    }
    await page.locator('#resetButton').click();
    assert.equal(await page.locator('.slide.is-active details[open], .slide.is-active .is-selected, .slide.is-active [aria-expanded="true"]').count(), 0);
  }
  console.log('PASS all slide details, polls, requisites, case reveals and resets');
  const popupEvent = page.waitForEvent('popup');
  await page.locator('#presenterButton').click();
  const presenter = await popupEvent; watch(presenter);
  for (let n = 1; n <= 12; n++) {
    await page.goto(`${base}#bild-${n}`);
    await expect(presenter.locator('#presenterTitle')).toHaveText(titles[n - 1]);
    const note = await page.evaluate(i => window.speakerNotes[i], n-1);
    await expect(presenter.locator('#presenterNotes')).toContainText(note[1]);
    await expect(presenter.locator('#presenterNotes')).toContainText(note[2]);
  }
  await presenter.locator('#presenterPrevious').click();
  await expect(page).toHaveURL(/#bild-11$/);
  await page.locator('.case-reveal').first().click();
  await presenter.locator('#presenterReset').click();
  await expect(page.locator('.case-reveal').first()).toHaveAttribute('aria-expanded','false');
  await presenter.locator('#timerToggle').click();
  await expect(presenter.locator('#timerDisplay')).not.toHaveText('00:00');
  await presenter.locator('#timerReset').click();
  await expect(presenter.locator('#timerDisplay')).toHaveText('00:00');
  await presenter.close();
  await page.locator('#sourcesButton').click();
  const dialog = page.locator('#sourceDialog');
  const before = await dialog.boundingBox();
  await page.mouse.move(before.x + 200, before.y + 30); await page.mouse.down();
  await page.mouse.move(before.x + 290, before.y + 65, { steps: 8 }); await page.mouse.up();
  assert.notEqual((await dialog.boundingBox()).x, before.x);
  await page.locator('[data-dialog-close]').click();
  await page.locator('#sourcesButton').click();
  assert.equal((await dialog.boundingBox()).x, before.x);
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
  await page.locator('#fullscreenButton').click();
  assert.equal(await page.evaluate(() => !!document.fullscreenElement), true);
  await page.locator('#fullscreenButton').click();
  // Stub sharing so QA does not write to the user's clipboard or send anything.
  await page.evaluate(() => { Object.defineProperty(navigator,'share',{value:undefined, configurable:true}); Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.testCopiedLink=text;}}, configurable:true}); });
  await page.locator('#shareButton').click();
  assert.equal(await page.evaluate(() => window.testCopiedLink), page.url());
  await page.goto(`${base}#bild-12`);
  await page.locator('#classQuizButton').click();
  await page.locator('.quiz-answer').first().focus();
  await page.keyboard.press('Enter'); await expect(page.locator('#quizScore')).toHaveText('1 rätt');
  await page.keyboard.press('ArrowLeft'); await expect(page).toHaveURL(/#bild-12$/);
  await page.keyboard.press('Escape'); await expect(page.locator('#classQuizPanel')).toBeHidden();
  await page.locator('[data-action="restart"]').click(); await expect(page).toHaveURL(/#bild-1$/);
  await page.keyboard.press('ArrowRight'); await expect(page).toHaveURL(/#bild-2$/);
  await page.keyboard.press('ArrowLeft'); await expect(page).toHaveURL(/#bild-1$/);
  assert.equal(await page.locator('#printButton').count(), 0);
  console.log('PASS 12 presenter notes, bidirectional sync, timer, draggable sources, keyboard, sharing fallback, fullscreen and restart');
  await context.close();

  // Reproduce an old cache paired with new HTML, then test the upgrade fix.
  stage = 'old'; holdOldWorker = true;
  const upgradeContext = await browser.newContext({ reducedMotion:'reduce' });
  const upgrade = await upgradeContext.newPage(); watch(upgrade);
  await upgrade.goto(`${base}#bild-12`);
  await upgrade.evaluate(() => navigator.serviceWorker.ready);
  await upgrade.reload();
  stage = 'broken';
  await upgrade.reload();
  await expect(upgrade.locator('#classQuizButton')).toBeVisible();
  await upgrade.locator('#classQuizButton').click();
  await expect(upgrade.locator('#classQuizDialog')).toBeHidden();
  assert.equal(await upgrade.locator('#evidencePrompt').count(), 0);
  console.log('REPRODUCED: old cached code + new HTML shows Testa klassen but click does nothing');
  stage = 'fixed';
  await upgrade.reload();
  await expect(upgrade.locator('body')).toHaveAttribute('data-version', release);
  await checkQuiz(upgrade);
  console.log('PASS fixed quiz works even while the old service worker still controls the page');
  holdOldWorker = false;
  await upgrade.evaluate(async () => { window.previousTestWorker = navigator.serviceWorker.controller; const r = await navigator.serviceWorker.ready; await r.update(); });
  await upgrade.waitForFunction(() => navigator.serviceWorker.controller !== window.previousTestWorker && navigator.serviceWorker.controller?.state === 'activated');
  await upgrade.reload();
  await upgradeContext.setOffline(true);
  await upgrade.reload();
  await expect(upgrade.locator('body')).toHaveAttribute('data-version', release);
  await checkQuiz(upgrade);
  assert.equal(await upgrade.evaluate(async () => (await fetch('./assets/bg4-oldboys.png')).ok), true);
  console.log('PASS upgraded offline cache: quiz, all versioned assets and cover');
  await upgradeContext.close();
  assert.deepEqual(issues, []);
  console.log('PASS no browser errors');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.closeAllConnections(); server.close();
});
