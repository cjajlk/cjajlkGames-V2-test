const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.env.TEST_ROOT || path.join(__dirname,'../..'));
const overlay = process.env.TEST_OVERLAY && path.resolve(process.env.TEST_OVERLAY);
const output = path.resolve(process.env.TEST_OUTPUT || path.join(__dirname,'artifacts/collections'));
fs.mkdirSync(output,{recursive:true});
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep)) {res.writeHead(403);return res.end();}
  if (overlay && pathname.startsWith('/v2/')) {const candidate = path.resolve(overlay,'.'+pathname);if(fs.existsSync(candidate))file=candidate;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream'});res.end(error?'Not found':data);});
});
const fixture = balance => ({id:'collections-test',schemaVersion:2,pseudo:'Explorateur Nocturne',stats:{totalCJ:balance,byGame:{attrape:75,breaker:30},playTime:{totalSeconds:7200,byGame:{attrape:3600,breaker:3600}}},items:{unlockedBadges:{explorer:{unlockedAt:1}},unlockedCosmetics:{old_background:{unlockedAt:1}}},unlockedImages:{breaker_mascotte_1:true},selectedBadge:'explorer',preferences:{language:'fr'},custom:{keep:true}});
const checks=[], errors=[];
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const context=await browser.newContext();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/v2/#collections');
  assert.equal(await page.evaluate(()=>localStorage.length),0);
  assert.equal(await page.locator('.collection-preview img').count(),0);
  assert.equal(await page.locator('.buy-piece:disabled').count(),3);
  const setPlayer=async data=>{await page.evaluate(data=>{localStorage.setItem('cjPlayerData',JSON.stringify(data));localStorage.setItem('breaker-save','{"level":9}');localStorage.setItem('nocturnePlayerProfileV3','{"gems":987}');},data);await page.reload();};
  const read=()=>page.evaluate(()=>CJajlkAccount.getPlayer());
  const buy=(id,piece)=>page.evaluate(([id,piece])=>CJCollections.buy(id,piece),[id,piece]);
  const beach=page.locator('[data-collection=plage_volley]');
  const forest=page.locator('[data-collection=foret_enchantee]');
  await setPlayer(fixture(100));
  assert.equal(await page.evaluate(()=>CJCollectionsConfig.piecePriceCJ),2);
  assert.match(await beach.locator("button").textContent(), /2 CJ/);
  assert.equal(await page.locator('.collection-preview img').count(),0);
  // Count actual account commits and calls to the existing spendCJ method.
  await page.evaluate(()=>{window.commits=0;window.debits=0;const save=CJajlkAccount.savePlayer,spend=CJajlkAccount.spendCJ;CJajlkAccount.savePlayer=function(data){commits++;return save.call(this,data);};CJajlkAccount.spendCJ=function(price){debits++;return spend.call(this,price);};});
  await beach.locator('button').click();
  await page.waitForFunction(()=>CJCollections.read().cards[0].count===1);
  assert.equal((await read()).stats.totalCJ,98);
  assert.equal(await page.evaluate(()=>commits),1);
  assert.equal(await page.evaluate(()=>debits),1);
  assert.equal(await beach.locator('.revealed img').count(),1);
  assert.equal(await beach.locator('.masked').count(),3);
  assert.equal(await beach.locator('.masked img').count(),0);
  assert.equal(await beach.locator('.collection-complete-image').count(),0);
  assert.equal(await page.evaluate(()=>CJDashboardProfile.read().cosmetics.some(x=>x.id==='collection_plage_volley')),false);
  await page.reload();assert.equal(await beach.locator('.collection-count').textContent(),'1/4');
  const afterFirst=await read();
  assert.deepEqual(afterFirst.stats.byGame,fixture(100).stats.byGame);
  assert.deepEqual(afterFirst.stats.playTime,fixture(100).stats.playTime);
  assert.deepEqual(afterFirst.items,fixture(100).items);
  checks.push('Achat UI 1/4 : 2 CJ débités via spendCJ, une seule écriture compte, aucun morceau masqué visible, persistance après rechargement.');

  assert.equal((await buy('plage_volley',0)).code,'owned');
  assert.equal((await read()).stats.totalCJ,98);
  assert.equal((await buy('plage_volley',3)).code,'stale');
  for(const piece of [1,2,3])assert.equal((await buy('plage_volley',piece)).ok,true);
  assert.equal((await read()).stats.totalCJ,92);
  assert.equal(await beach.locator('.collection-count').textContent(),'4/4');
  assert.equal(await beach.locator('.masked').count(),0);
  assert.equal(await beach.locator('.collection-complete-image').count(),1);
  assert.equal(await beach.locator('button').count(),0);
  assert((await read()).items.unlockedCosmetics.collection_plage_volley);
  await page.reload();
  await beach.locator('a').click();
  await page.locator('#personalize').click();
  await page.locator('[data-choice="background:collection_plage_volley"]').click();
  await page.waitForFunction(()=>CJajlkAccount.getPlayer().profileV2?.background==='collection_plage_volley');
  assert.match(await page.locator('.profile-detail').getAttribute('style'),/collection_plage_volley/);
  await page.locator('[data-choice="background:"]').click();
  await page.waitForFunction(()=>CJajlkAccount.getPlayer().profileV2.background===null);
  assert((await read()).items.unlockedCosmetics.collection_plage_volley);
  assert((await read()).items.unlockedCosmetics.old_background);
  assert.equal(Object.keys((await read()).collectionsV1.entries.plage_volley.pieces).length,4);
  await page.keyboard.press('Escape');
  checks.push('4/4 : image complète, fond possédé et équipable via Personnaliser, déséquipement sans perte des morceaux ni des anciens fonds.');

  await setPlayer(fixture(1));await page.goto(base+'/v2/#collections');
  const poor=await read();assert.equal((await buy('plage_volley',0)).code,'funds');assert.deepEqual(await read(),poor);
  assert.equal(await beach.locator('button').isDisabled(),true);
  await setPlayer(fixture(2));assert.equal((await buy('plage_volley',0)).ok,true);assert.equal((await read()).stats.totalCJ,0);
  checks.push('Solde insuffisant refusé sans écriture ; solde exactement égal au prix accepté sans solde négatif.');

  await setPlayer(fixture(100));
  await beach.locator('button').dblclick();
  await page.waitForFunction(()=>CJCollections.read().cards[0].count===1);
  await page.waitForTimeout(750);
  assert.equal((await read()).stats.totalCJ,98);assert.equal(await beach.locator('.collection-count').textContent(),'1/4');
  const duplicate=await page.evaluate(()=>Promise.all(Array.from({length:12},()=>CJCollections.buy('foret_enchantee',0))));
  assert.equal(duplicate.filter(x=>x.code==='purchased').length,1);
  assert.equal((await read()).stats.totalCJ,96);
  checks.push('Double clic réel et 12 demandes répétées du même morceau : une seule acquisition et un seul débit.');

  const second=await context.newPage();second.on('pageerror',e=>errors.push(e.message));await second.goto(base+'/v2/#collections');
  await setPlayer(fixture(100));await second.reload();
  const parallel=await Promise.all([page.evaluate(()=>CJCollections.buy('plage_volley',0)),second.evaluate(()=>CJCollections.buy('plage_volley',0))]);
  assert.equal(parallel.filter(x=>x.code==='purchased').length,1);assert.equal((await read()).stats.totalCJ,98);
  await second.waitForFunction(()=>CJCollections.read().cards[0].count===1);
  // Different Collections also serialize against the SAME wallet.
  await setPlayer(fixture(2));await second.reload();
  const limited=await Promise.all([page.evaluate(()=>CJCollections.buy('plage_volley',0)),second.evaluate(()=>CJCollections.buy('foret_enchantee',0))]);
  assert.equal(limited.filter(x=>x.code==='purchased').length,1);assert.equal(limited.filter(x=>x.code==='funds').length,1);assert.equal((await read()).stats.totalCJ,0);
  await setPlayer(fixture(100));await second.reload();
  await Promise.all([page.evaluate(()=>CJCollections.buy('plage_volley',0)),second.evaluate(()=>CJDashboardProfile.equip('avatar','breaker_mascotte_1'))]);
  assert.equal((await read()).stats.totalCJ,98);assert.equal((await read()).profileV2.avatar,'breaker_mascotte_1');assert((await read()).collectionsV1.entries.plage_volley.pieces[0]);
  checks.push('Deux onglets : même morceau débité une fois, collections différentes respectant le solde commun, personnalisation simultanée sans écrasement des acquisitions.');

  await setPlayer(fixture(100));
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Test quota','QuotaExceededError');};});
  assert.equal((await buy('plage_volley',0)).code,'storage');assert.deepEqual(await read(),fixture(100));
  await page.reload();
  assert.equal((await buy('plage_volley',0)).ok,true);assert.equal((await read()).stats.totalCJ,98);
  // Fourth piece commit failure must not debit without granting the reward.
  await buy('plage_volley',1);await buy('plage_volley',2);const three=await read();
  await page.evaluate(()=>{CJajlkAccount.savePlayer=()=>{};});
  assert.equal((await buy('plage_volley',3)).code,'storage');assert.deepEqual(await read(),three);
  await page.reload();assert.equal((await buy('plage_volley',3)).code,'complete');assert((await read()).items.unlockedCosmetics.collection_plage_volley);
  checks.push('Échecs de stockage simulés au 1er et 4e morceau : aucun débit isolé, aucune perte, reprise après rechargement sans double débit.');

  await setPlayer({...fixture(100),collectionsV1:{version:99,entries:{untouched:true}}});const invalid=await read();assert.equal((await buy('plage_volley',0)).code,'invalid');assert.deepEqual(await read(),invalid);
  await setPlayer(fixture(100));
  await page.evaluate(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
  assert.equal((await buy('plage_volley',0)).code,'unsupported');assert.deepEqual(await read(),fixture(100));
  await page.reload();
  // A legacy concurrent change observed before commit is rejected, not overwritten.
  await page.evaluate(()=>{const spend=CJajlkAccount.spendCJ;CJajlkAccount.spendCJ=function(price){const actual=CJajlkAccount.getPlayer();actual.stats.totalCJ=101;CJajlkAccount.savePlayer(actual);return spend.call(this,price);};});
  assert.equal((await buy('plage_volley',0)).code,'conflict');assert.equal((await read()).stats.totalCJ,101);assert.equal((await read()).collectionsV1,undefined);
  checks.push('Version de sauvegarde inconnue conservée, achats refusés sans verrou inter-onglets, conflit de compte détecté avant validation.');

  // Screenshot fixture is produced using real purchase paths, not forged ownership.
  await setPlayer(fixture(150));await page.goto(base+'/v2/#collections');
  await buy('plage_volley',0);await buy('plage_volley',1);
  for(const piece of [0,1,2])await buy('foret_enchantee',piece);
  await forest.locator('button').click();
  await page.waitForFunction(()=>CJCollections.read().cards[1].count===4);
  assert.match(await page.locator('#collections-status').textContent(),/définitivement acquis/);
  await page.waitForTimeout(700);
  for(const width of [320,390,760,768,1024,1440]){
    await page.setViewportSize({width,height:width<768?844:1000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}`);
    for(const button of await page.locator('.buy-piece').all())assert((await button.boundingBox()).height>=48);
    for(const img of await page.locator('.collection-preview img').all())assert(await img.evaluate(img=>img.complete&&img.naturalWidth>0));
    if(width<=760){const boxes=await page.locator('.collection-card').all();assert((await boxes[1].boundingBox()).y>(await boxes[0].boundingBox()).y);}
    if([390,1440].includes(width)) {await page.evaluate(()=>{document.getElementById('main').focus({preventScroll:true});window.scrollTo(0,0);});await page.screenshot({path:path.join(output,`collections-${width}.png`),fullPage:true});}
  }
  await page.goto(base+'/v2/#profil');await page.locator('#personalize').click();
  await page.locator('[data-choice="background:collection_foret_enchantee"]').click();
  await page.waitForFunction(()=>CJajlkAccount.getPlayer().profileV2?.background==='collection_foret_enchantee');
  await page.keyboard.press('Escape');
  for(const width of [390,1440]){await page.setViewportSize({width,height:width===390?844:1000});await page.screenshot({path:path.join(output,`fond-collection-profil-${width}.png`),fullPage:true});}
  assert.equal(await page.evaluate(()=>localStorage.getItem('breaker-save')),'{"level":9}');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nocturnePlayerProfileV3')),'{"gems":987}');
  assert.equal(await page.locator('script[src*=cjEngine]').count(),0);
  assert.deepEqual(errors,[]);
  checks.push('Captures 2/4, 4/4 et 0/4, message de récompense, fond équipé ; six largeurs sans débordement, boutons ≥48 px, images chargées, aucune erreur applicative ni altération des sauvegardes de jeu/gemmes.');
  fs.writeFileSync(path.join(output,'collections-tests.json'),JSON.stringify({passed:true,checks,errors},null,2));
  console.log(JSON.stringify({passed:true,checks,errors},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
