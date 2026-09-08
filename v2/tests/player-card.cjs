const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const output = process.env.TEST_OUTPUT || path.join(__dirname, 'artifacts');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
  fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'Content-Type': type }); res.end(error ? 'Not found' : data); });
});
const checks = [];
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.storageWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { window.storageWrites.push({ method, args }); return original.apply(this, args); };
    }
  });
  await page.goto(`${base}/v2/`);
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  assert.deepEqual(await page.evaluate(() => window.storageWrites), []);
  checks.push('Fresh profile: no storage creation, migration, or write.');
  const player = { pseudo: 'CJ Test <img src=x onerror=alert(1)>', stats: { totalCJ: 147, byGame: { attrape: 80, breaker: 90 }, playTime: { totalSeconds: 7260, byGame: { attrape: 3600, breaker: 3660 } } }, items: { unlockedBadges: { explorer: {}, fidele: {} } }, selectedBadge: 'explorer' };
  await page.evaluate(data => { localStorage.setItem('cjPlayerData', JSON.stringify(data)); localStorage.setItem('nocturnePlayerProfileV3', '{"gems":987}'); }, player);
  await page.reload();
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  assert.equal(await page.locator('[data-profile=balance]').first().textContent(), '147');
  assert.equal(await page.locator('[data-profile=time]').first().textContent(), '2 h 1 min');
  assert.equal(await page.locator('[data-profile=badges]').first().textContent(), '2');
  assert.equal(await page.locator('[data-profile=pseudo] img').count(), 0);
  checks.push('Existing account: exact balance, time, badges; pseudo rendered as text.');
  await page.evaluate(() => { const data = JSON.parse(localStorage.getItem('cjPlayerData')); data.pseudo = 'Explorateur Nocturne'; localStorage.setItem('cjPlayerData', JSON.stringify(data)); });
  await page.reload();
  for (const width of [320, 390, 760, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const route of ['accueil', 'profil', 'jeux', 'boutique', 'collections', 'apropos']) {
      await page.goto(`${base}/v2/#${route}`);
      assert.equal(await page.locator('[data-page]:visible').getAttribute('data-page'), route);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${width}/${route}`);
    }
    await page.goto(`${base}/v2/`);
    if (width <= 760) {
      assert.equal(await page.locator('.mobile-tiles a:visible').count(), 5);
      assert.equal(await page.locator('.bottom-nav a:visible').count(), 4);
      for (const link of await page.locator('.mobile-tiles a, .bottom-nav a').all()) assert((await link.boundingBox()).height >= 44);
    } else assert(await page.locator('.sidebar').isVisible());
    if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
  }
  checks.push('All six routes: 320, 390, 760, 768, 1024, 1440 px; no horizontal overflow; five mobile tiles and touch targets >=44px.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mobile-tiles a[href="#collections"]').click();
  await page.locator('[data-page=collections]').waitFor({ state: 'visible' });
  await page.goBack();
  await page.locator('[data-page=accueil]').waitFor({ state: 'visible' });
  assert(await page.locator('[data-page=accueil]').isVisible());
  await page.locator('.bottom-nav a[href="#profil"]').click();
  await page.locator('[data-page=profil]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.bottom-nav [aria-current=page]').textContent(), '◉Profil');
  await page.screenshot({ path: path.join(output, 'profile-390.png'), fullPage: true });
  await page.goto(`${base}/v2/#unknown`);
  assert(await page.locator('[data-page=accueil]').isVisible());
  checks.push('Tile clicks, bottom navigation, browser back, unknown route fallback.');
  const links = await page.locator('[href],script[src],img[src]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href') || n.getAttribute('src')).filter(v => v && !v.startsWith('#') && !/^(https?:|mailto:)/.test(v)));
  for (const link of new Set(links)) assert.equal((await context.request.get(new URL(link, `${base}/v2/`).href)).status(), 200, link);
  assert.equal(await page.locator('script[src*="cjEngine"]').count(), 0);
  assert.deepEqual(await page.evaluate(() => window.storageWrites), []);
  assert.equal(await page.evaluate(() => localStorage.getItem('nocturnePlayerProfileV3')), '{"gems":987}');
  const actual = await page.evaluate(() => JSON.parse(localStorage.getItem('cjPlayerData')));
  assert.deepEqual({ ...actual, pseudo: player.pseudo }, player);
  checks.push('Every local link and resource resolves; no engine; account and gem library unchanged by dashboard.');
  const second = await context.newPage();
  await second.goto(`${base}/v2/`);
  await second.evaluate(() => { const data = JSON.parse(localStorage.getItem('cjPlayerData')); data.stats.totalCJ = 222; localStorage.setItem('cjPlayerData', JSON.stringify(data)); });
  await page.waitForFunction(() => document.querySelector('[data-profile=balance]').textContent === '222');
  checks.push('Cross-tab account refresh without dashboard writes.');
  await page.evaluate(() => localStorage.setItem('cjPlayerData', JSON.stringify({ pseudo: 'Ancien compte', stats: { totalCJ: 9 } })));
  await page.reload();
  assert.equal(await page.locator('[data-profile=time]').first().textContent(), '—');
  assert.deepEqual(await page.evaluate(() => window.storageWrites), []);
  await page.evaluate(() => localStorage.setItem('cjPlayerData', '{broken'));
  await page.reload();
  assert.equal(await page.locator('[data-profile=balance]').first().textContent(), '—');
  assert.deepEqual(await page.evaluate(() => window.storageWrites), []);
  checks.push('Legacy/incomplete and malformed profile handled without migration or fabricated data.');
  await page.route('**/core/cjAccount.js', route => route.abort());
  await page.reload();
  assert.match(await page.locator('[data-profile=status]').first().textContent(), /indisponible/);
  checks.push('Missing account API: visible unavailable state.');
  assert.deepEqual(errors, []);
    await page.unroute('**/core/cjAccount.js');
  const owned = { pseudo: 'Explorateur Nocturne', stats: { totalCJ: 147, byGame: { attrape: 80, breaker: 0, future: 0 }, playTime: { totalSeconds: 7260, byGame: { attrape: 7260, breaker: 0 } } }, items: { unlockedBadges: { explorer: {}, fidele: {}, centre: {}, paques: {} }, unlockedCosmetics: { forest_test: { unlockedAt: 123 } } }, unlockedImages: { breaker_mascotte_1: true, attrape_mascotte_1: true, attrape_mascotte_2: true }, selectedBadge: 'explorer', customUntouched: { save: 99 } };
  await page.evaluate(data => { localStorage.setItem('cjPlayerData', JSON.stringify(data)); localStorage.setItem('nocturnePlayerProfileV3', '{"gems":987}'); }, owned);
  await page.goto(`${base}/v2/#profil`);
  await page.reload();
  assert.equal(await page.locator('[data-profile=played]').textContent(), '1');
  assert.equal(await page.locator('#game-stats article').count(), 1);
  assert.equal(await page.evaluate(() => CJDashboardProfile.equip('avatar', 'breaker_mascotte_2')), false);
  assert.equal(await page.evaluate(() => CJDashboardProfile.equip('badge', 'not_owned')), false);
  await page.locator('#personalize').click();
  await page.locator('[data-choice="avatar:breaker_mascotte_1"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().profileV2?.avatar === 'breaker_mascotte_1');
  await page.locator('[data-choice="badge:centre"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().selectedBadge === 'centre');
  await page.keyboard.press('Escape');
  await page.reload();
  assert.match(await page.locator('.profile-detail .avatar img').getAttribute('src'), /aqua_idle/);
  assert.match(await page.locator('[data-profile=selected]').textContent(), /Compagnon du Centre/);
  const equipped = await page.evaluate(() => CJajlkAccount.getPlayer());
  assert.deepEqual({ ...equipped, selectedBadge: owned.selectedBadge, profileV2: undefined }, { ...owned, profileV2: undefined });
  assert.equal(await page.evaluate(() => localStorage.getItem('nocturnePlayerProfileV3')), '{"gems":987}');
  await page.evaluate(() => CJProfileCatalog.register({ id: 'forest_test', label: 'Forêt de test', type: 'background', src: '../assets/images/gallery/foret.png' }));
  await page.locator('#personalize').click();
  await page.locator('[data-choice="background:forest_test"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().profileV2?.background === 'forest_test');
  assert.match(await page.locator('.profile-detail').getAttribute('style'), /foret.png/);
  await page.locator('[data-choice="background:"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().profileV2?.background === null);
  await page.locator('[data-choice="badge:"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().selectedBadge === null);
  await page.locator('[data-choice="avatar:"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().profileV2?.avatar === null);
  assert.deepEqual(await page.evaluate(() => CJajlkAccount.getPlayer().items), owned.items);
  assert.deepEqual(await page.evaluate(() => CJajlkAccount.getPlayer().unlockedImages), owned.unlockedImages);
  await page.locator('[data-choice="avatar:breaker_mascotte_1"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().profileV2?.avatar === 'breaker_mascotte_1');
  await page.locator('[data-choice="badge:centre"]').click();
  await page.waitForFunction(() => CJajlkAccount.getPlayer().selectedBadge === 'centre');
  // Simulate a write failure; the current equipment and possessions must survive.
  await page.evaluate(() => { window.realSave = CJajlkAccount.savePlayer; CJajlkAccount.savePlayer = () => {}; });
  await page.locator('[data-choice="avatar:attrape_mascotte_1"]').click();
  await page.waitForFunction(() => document.getElementById('equipment-status').textContent.includes('Impossible'));
  assert.match(await page.locator('#equipment-status').textContent(), /Impossible/);
  assert.equal(await page.evaluate(() => CJajlkAccount.getPlayer().profileV2.avatar), 'breaker_mascotte_1');
  await page.evaluate(() => { CJajlkAccount.savePlayer = window.realSave; });
  await page.keyboard.press('Escape');
  await page.reload();
  await page.locator('#personalize').click();
  for (const width of [320, 390, 760, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Picker overflow ${width}`);
    assert(await page.evaluate(() => { const d = document.querySelector('dialog'); return d.scrollWidth <= d.clientWidth; }));
    if ([390, 1440].includes(width)) { await page.locator('dialog').evaluate(d => d.scrollTop = 0); await page.screenshot({ path: path.join(output, `personnaliser-${width}.png`), fullPage: true }); }
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'personalize');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({ path: path.join(output, `carte-joueur-${width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []);
  checks.push('Player card: only active games counted; owned items only; equip/unequip/reload; possessions, CJ, game data and gem library preserved; extensible background registered and equipped; storage failure shown; keyboard focus restored; picker responsive at six widths.');

  const legacy = await context.newPage();
  await legacy.goto(`${base}/v2/`);
  await legacy.evaluate(() => localStorage.removeItem('cjPlayerData'));
  await legacy.goto(`${base}/index.html`);
  await legacy.waitForFunction(() => JSON.parse(localStorage.getItem('cjPlayerData'))?.schemaVersion === 2);
  checks.push('Classic page still automatically initializes the account (default preserved).');
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ passed: true, checks, errors }, null, 2));
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
