const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const output = process.env.TEST_OUTPUT || path.join(__dirname, 'artifacts');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
  fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'Content-Type': type }); res.end(error ? 'Not found' : data); });
});
function completeAccount(player) {
  return {schemaVersion:2,id:'synthetic-hub-test',createdAt:123,preferences:{language:'fr',volume:true},selectedBadge:null,...player,
    stats:{...player.stats,byGame:{attrape:0,breaker:0,...player.stats?.byGame},playTime:{totalSeconds:0,...player.stats?.playTime,byGame:{attrape:0,breaker:0,...player.stats?.playTime?.byGame}}},
    items:{unlockedBadges:{},unlockedCosmetics:{},...player.items}};
}
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext(), page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.hubWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) { hubWrites.push([method, ...args]); return original.apply(this, args); };
    }
  });
  await page.goto(`${base}/v2/#profil`);
  const ids = ['attrape', 'breaker', 'farm', 'velocity', 'shift', 'nyr', 'jetclash', 'lumi', 'runner'];
  assert.deepEqual(await page.locator('#game-stats article').evaluateAll(cards => cards.map(card => card.dataset.game)), ids);
  assert.equal(await page.locator('#game-stats [data-activity="recorded"]').count(), 0);
  await page.waitForFunction(() => window.CJajlkAccount?.isIdentityReady());
  assert.equal(await page.evaluate(() => hubWrites.length), 1);
  const saves = {
    cjPlayerData: JSON.stringify(completeAccount({ pseudo: 'CJ audit', stats: { totalCJ: 42, byGame: { attrape: 10, breaker: 20, velocity: 5, shift: 7 }, playTime: { totalSeconds: 240, byGame: { attrape: 60, breaker: 60, velocity: 60, shift: 60 } } }, items: { unlockedBadges: {} }, untouched: { keep: true } })),
    cjajlkFarmV1: JSON.stringify({ level: 4, savedAt: 123456, zones: { main: { farm: [] } }, stock: { wheat: 7 } }),
    nyrStatisticsV1: JSON.stringify({ version: 1, totals: { completedRuns: 3, bestScore: 725 } }),
    'jetclash.etape2.profile.v1': JSON.stringify({ xp: 340, completed: ['one', 'two'], stats: { matches: 2 }, settings: { sound: false } })
  };
  await page.evaluate(saves => { for (const [key, value] of Object.entries(saves)) localStorage.setItem(key, value); hubWrites.length = 0; }, saves);
  await page.reload();
  assert.equal(await page.locator('#game-stats [data-activity="recorded"]').count(), 7);
  assert.equal(await page.locator('[data-page="profil"] [data-profile="played"]').textContent(), '7');
  assert.match(await page.locator('[data-game="velocity"]').textContent(), /Nocturne Velocity/);
  assert.match(await page.locator('[data-game="farm"]').textContent(), /Sauvegarde de ferme disponible · Niveau 4/);
  assert.match(await page.locator('[data-game="nyr"]').textContent(), /3 parties terminées · Meilleur score : 725/);
  assert.match(await page.locator('[data-game="jetclash"]').textContent(), /2 matchs terminés · 340 XP JetClash/);
  assert.doesNotMatch(await page.locator('[data-game="jetclash"]').textContent(), /340 CJ/);
  assert.equal(await page.locator('[data-profile="balance"]').first().textContent(), '42');
  assert.deepEqual(await page.evaluate(saves => Object.fromEntries(Object.keys(saves).map(key => [key, localStorage.getItem(key)])), saves), saves);
  assert.deepEqual(await page.evaluate(() => hubWrites), []);
  const other = await context.newPage();await other.goto(`${base}/v2/`);
  await other.evaluate(() => localStorage.setItem('nyrStatisticsV1', JSON.stringify({ version: 1, totals: { completedRuns: 4, bestScore: 900 } })));
  await page.waitForFunction(() => document.querySelector('[data-game="nyr"]').textContent.includes('4 parties'));
  await other.evaluate(() => localStorage.setItem('jetclash.etape2.profile.v1', JSON.stringify({ xp: 0, completed: [], challenges: { daily: { entries: { 'd-training': { progress: 1 } } } } })));
  await page.waitForFunction(() => document.querySelector('[data-game="jetclash"]').textContent.includes('Entraînement enregistré'));
  await other.evaluate(() => localStorage.setItem('cjajlkFarmV1', '{bad'));
  await page.waitForFunction(() => document.querySelector('[data-game="farm"]').dataset.activity === 'empty');
  assert.equal(await page.locator('[data-game="nyr"]').getAttribute('data-activity'), 'recorded');
  await page.evaluate(() => {
    localStorage.setItem('nyrStatisticsV1', JSON.stringify({ version: 1, totals: { completedRuns: 0, bestCombo: 1 } }));
    localStorage.setItem('jetclash.etape2.profile.v1', JSON.stringify({ xp: 0, completed: [] }));
    hubWrites.length = 0;
  });
  await page.reload();assert.equal(await page.locator('[data-page="profil"] [data-profile="played"]').textContent(), '4');assert.deepEqual(await page.evaluate(() => hubWrites), []);
  await page.evaluate(() => { localStorage.removeItem('cjPlayerData');localStorage.setItem('nyrStatisticsV1', JSON.stringify({ version: 1, totals: { completedRuns: 1, bestScore: 5 } }));hubWrites.length = 0; });
  await page.reload();await page.waitForFunction(() => window.CJajlkAccount?.isIdentityReady());assert.equal(await page.locator('[data-page="profil"] [data-profile="played"]').textContent(), '1');assert.match(await page.locator('[data-game="nyr"]').textContent(), /1 partie terminée/);assert.equal(await page.evaluate(() => hubWrites.length), 1);
  await other.close();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.goto(`${base}/v2/#jeux`);
    const runner = page.locator('[aria-labelledby="runner-title"]');
    assert.equal(await runner.count(), 1);assert.match(await runner.textContent(), /Nocturne Runner/);assert.equal(await runner.getAttribute('href'), 'https://cjajlk.github.io/nocturne-runner/');
    assert.equal(await runner.getAttribute('target'), '_blank');
    assert.equal(await page.locator('[data-page="jeux"] a.game-card').count(), 9);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await runner.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const img = document.querySelector('.runner-card-image'); return img.complete && img.naturalWidth > 0; });
    if (width === 390) await runner.screenshot({ path: path.join(output, 'Hub-Nocturne-Runner.png') });
    await page.goto(`${base}/v2/#profil`);
    assert.equal(await page.locator('#game-stats article').count(), 9);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (width === 1440) await page.screenshot({ path: path.join(output, 'Hub-Mes-aventures.png'), fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('OK : 9 jeux référencés, activités globales/locales réelles, sauvegardes et CJ préservés, aucun crédit fictif, synchronisation entre onglets, carte Runner reliée au jeu et responsive 320/390/768/1440.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
