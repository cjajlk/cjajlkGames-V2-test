const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const assert = require('assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../..');

function createServer() {
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
      if (error) {
        res.writeHead(404);
        res.end('missing');
        return;
      }

      const extension = path.extname(filePath);
      const contentType = {
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
      }[extension] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

function loadEventManager() {
  const source = fs.readFileSync(path.join(root, 'games/attrape/js/eventManager.js'), 'utf8');
  const sandbox = { window: {}, Date, console };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.EventManager;
}

function mockDateScript() {
  return ({
    dateIso
  }) => {
    const RealDate = Date;
    const fixedNow = new RealDate(dateIso).getTime();

    function MockDate(...args) {
      if (args.length > 0) {
        return new RealDate(...args);
      }
      return new RealDate(window.__seasonNow ?? fixedNow);
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

async function withBrowser(testFn) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });

  try {
    await testFn(browser, baseUrl);
  } finally {
    await browser.close();
    server.close();
  }
}

function eventClasses(bodyClassList) {
  return Array.from(bodyClassList).filter(name => name.startsWith('event-'));
}

(async () => {
  const eventManager = loadEventManager();

  assert.equal(eventManager.isEventActive('halloween', new Date('2026-10-15T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('halloween', new Date('2026-10-31T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('halloween', new Date('2026-11-05T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('halloween', new Date('2026-10-14T12:00:00Z')), false);
  assert.equal(eventManager.isEventActive('halloween', new Date('2026-11-06T12:00:00Z')), false);

  assert.equal(eventManager.isEventActive('noel', new Date('2026-12-01T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('noel', new Date('2027-01-05T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('noel', new Date('2027-01-06T12:00:00Z')), false);

  assert.equal(eventManager.isEventActive('valentin', new Date('2026-02-01T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('valentin', new Date('2026-02-20T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('valentin', new Date('2026-02-21T12:00:00Z')), false);

  assert.equal(eventManager.isEventActive('paques', new Date('2026-03-15T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('paques', new Date('2026-04-20T12:00:00Z')), true);
  assert.equal(eventManager.isEventActive('paques', new Date('2026-03-14T12:00:00Z')), false);
  assert.equal(eventManager.isEventActive('paques', new Date('2026-04-21T12:00:00Z')), false);

  await withBrowser(async (browser, baseUrl) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(mockDateScript(), { dateIso: '2026-10-31T12:00:00Z' });
    await page.goto(`${baseUrl}/games/attrape/index.html`);

    await page.waitForFunction(() => typeof window.showMainMenu === 'function' && typeof window.EventManager === 'object');
    await page.waitForFunction(() => eventClasses(document.body.classList).length === 1);

    assert.deepEqual(await page.evaluate(() => eventClasses(document.body.classList)), ['event-halloween']);

    await page.evaluate(() => {
      window.__seasonNow = new Date('2026-02-14T12:00:00Z').getTime();
      showMainMenu();
    });
    assert.deepEqual(await page.evaluate(() => eventClasses(document.body.classList)), []);

    await page.evaluate(() => {
      window.__seasonNow = new Date('2026-02-10T12:00:00Z').getTime();
      showMainMenu();
    });
    assert.deepEqual(await page.evaluate(() => eventClasses(document.body.classList)), ['event-valentin']);

    await page.evaluate(() => {
      window.__seasonNow = new Date('2026-04-20T12:00:00Z').getTime();
      showMainMenu();
    });
    assert.deepEqual(await page.evaluate(() => eventClasses(document.body.classList)), ['event-paques']);

    await context.close();
  });

  console.log('seasonal-events: ok');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});