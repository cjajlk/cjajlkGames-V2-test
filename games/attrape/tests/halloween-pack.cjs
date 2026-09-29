const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../..');

function loadHtmlServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let filePath = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!filePath.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (error, data) => {
      const type = {
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
      }[path.extname(filePath)] || 'application/octet-stream';
      res.writeHead(error ? 404 : 200, { 'Content-Type': type });
      res.end(error ? 'missing' : data);
    });
  });
}

function mockDateScript() {
  return ({ dateIso }) => {
    const RealDate = Date;
    const fixedNow = new RealDate(dateIso).getTime();
    function MockDate(...args) {
      return args.length ? new RealDate(...args) : new RealDate(window.__seasonNow ?? fixedNow);
    }
    MockDate.now = () => window.__seasonNow ?? fixedNow;
    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    MockDate.prototype = RealDate.prototype;
    window.__seasonNow = fixedNow;
    window.Date = MockDate;
    self.Date = MockDate;
  };
}

async function createPage(browser, baseUrl, dateIso) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(mockDateScript(), { dateIso });
  await page.goto(`${baseUrl}/games/attrape/index.html`);
  await page.waitForFunction(() => typeof window.initShop === 'function' && typeof window.loadAllGameData === 'function');
  return { context, page };
}

(async () => {
  const server = loadHtmlServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });

  try {
    const { context, page } = await createPage(browser, baseUrl, '2026-09-29T12:00:00Z');

    const pack = await page.evaluate(() => {
      return (GameData.packs || []).find(item => item.id === 'pack_halloween');
    });
    assert.ok(pack, 'Pack Halloween absent des données');
    assert.equal(pack.eventId, 'halloween');
    assert.equal(pack.costCoins || 0, 0);
    assert.equal(pack.costGems, 6000);
    assert.deepEqual(pack.items.mascotte, ['jane-sorciere', 'eve-violette', 'cjajlk-vampire', 'halloween-fantome']);
    assert.ok(!pack.items.orbes && !pack.items.backgrounds, 'Le pack Halloween ne doit contenir ni orbe ni fond');

    await page.evaluate(() => {
      selectedTab = 'packs';
      updateShop();
    });

    const cardText = await page.locator('.shop-pack').filter({ hasText: 'Pack Halloween 🎃' }).textContent();
    assert.match(cardText || '', /4 mascottes/);
    assert.match(cardText || '', /6\s*000|6000\s*💎/);
    const outOfSeasonButton = await page.locator('.shop-pack').filter({ hasText: 'Pack Halloween 🎃' }).getByRole('button').textContent();
    assert.equal(outOfSeasonButton, 'Hors saison');

    await page.evaluate(() => {
      window.__seasonNow = new Date('2026-10-31T12:00:00Z').getTime();
      coins = 0;
      gems = 6000;
      selectedTab = 'packs';
      updateCurrenciesHUD();
      updateShop();
    });
    const inSeasonButton = await page.locator('.shop-pack').filter({ hasText: 'Pack Halloween 🎃' }).getByRole('button').textContent();
    assert.equal(inSeasonButton, 'Obtenir');

    await page.locator('.shop-pack').filter({ hasText: 'Pack Halloween 🎃' }).getByRole('button').click();
    await page.waitForTimeout(200);
    const ownership = await page.evaluate(() => ({
      ownedPacks: ownedPacks.slice(),
      ownedMascotte: ownedMascotte.slice(),
      button: Array.from(document.querySelectorAll('.shop-pack')).find(card => card.textContent.includes('Pack Halloween 🎃'))?.querySelector('button')?.textContent || null
    }));

    const halloweenMascottes = await page.evaluate(() => (GameData.mascotteSkins || []).filter(item => item.category === 'halloween').map(item => item.id));
    assert.deepEqual(halloweenMascottes, ['jane-sorciere', 'eve-violette', 'cjajlk-vampire', 'halloween-fantome']);
    assert.ok(ownership.ownedPacks.includes('pack_halloween'));
    assert.deepEqual(ownership.ownedMascotte.filter(id => ['jane-sorciere', 'eve-violette', 'cjajlk-vampire', 'halloween-fantome'].includes(id)), ['jane-sorciere', 'eve-violette', 'cjajlk-vampire', 'halloween-fantome']);
    assert.equal(ownership.button, 'Débloqué ✓');

    await context.close();
    console.log('halloween-pack: ok');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});