const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.TEST_ROOT||path.resolve(__dirname,'../..');
const velocity=process.env.VELOCITY_ROOT||path.resolve(root,'../nocturne velocity');
const output=process.env.TEST_OUTPUT||path.resolve('outputs/active-time');fs.mkdirSync(output,{recursive:true});
const sources={attrape:fs.readFileSync(root+'/games/attrape/js/game.js','utf8'),breaker:fs.readFileSync(root+'/games/breaker/js/gameplay.js','utf8'),velocity:fs.readFileSync(velocity+'/gameplay.js','utf8')};
const adapters=Object.fromEntries(Object.entries(sources).map(([id,s])=>[id,s.match(/window\.getGameState = function \(\) \{[\s\S]*?\n\};/)[0]]));
const globals={attrape:'window.Game={running:true};window.isGameRunning=true;window.gameStarted=true;window.timerRunning=false;window.inLevelTransition=false;window.isGamePaused=false;',breaker:'window.state={running:true};window.ball={launched:true};',velocity:'window.ui={gameOver:false};window.leavingGameplay=false;window.runMetricsCommitted=false;'};
const harness=id=>`<!doctype html><body><script>window.testNow=0;performance.now=()=>testNow;window.visible=true;window.focused=true;Object.defineProperty(document,'visibilityState',{get:()=>visible?'visible':'hidden'});Object.defineProperty(document,'hidden',{get:()=>!visible});document.hasFocus=()=>focused;${globals[id]}${adapters[id]}</script><script src='/core/cjAccount.js'></script><script src='/core/cjEngine.js'></script></body>`;
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');if(url.pathname==='/harness'){res.setHeader('Content-Type','text/html');return res.end(harness(url.searchParams.get('game')));}let f=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!f.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');fs.readFile(f,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}[path.extname(f)]||'application/octet-stream'});res.end(e?'missing':data);});});
let browser;const checks={},errors=[];
(async()=>{
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({headless:true,channel:'msedge'});
const read=p=>p.evaluate(()=>CJajlkAccount.getPlayer());
async function ready(p,id){await p.waitForFunction(()=>CJEngine.isTracking());await p.evaluate(id=>{testNow+=16;CJEngine.tick(16,id);},id);}
async function ticks(p,id,ms){return p.evaluate(([id,ms])=>{let accepted=0;for(let left=ms;left>0;){let d=Math.min(200,left);testNow+=d;accepted+=CJEngine.tick(d,id);left-=d;}return accepted;},[id,ms]);}
async function paused(p,id,on){await p.evaluate(([id,on])=>{if(id==='attrape')isGamePaused=on;else if(id==='breaker'){document.querySelector('.popup-overlay')?.remove();if(on){const el=document.createElement('div');el.className='popup-overlay';document.body.append(el);}}else focused=!on;CJEngine.tick(16,id);},[id,on]);}
async function menu(p,id,on){await p.evaluate(([id,on])=>{if(id==='attrape')Game.running=!on;else if(id==='breaker')state.running=!on;else leavingGameplay=on;CJEngine.tick(16,id);},[id,on]);}
for(const id of ['attrape','breaker','velocity']){
const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>errors.push(id+': '+e.message));await p.goto(base+'/harness?game='+id);await ready(p,id);
await p.evaluate(()=>{localStorage.setItem('local-game-save','{"coins":321,"level":7}');});
assert.equal(await ticks(p,id,100000),100000);let player=await read(p);assert.equal(player.stats.playTime.byGame[id],100);assert.equal(player.stats.totalCJ,0);
await paused(p,id,true);assert.equal(await ticks(p,id,300000),0);await paused(p,id,false);await ready(p,id);
assert.equal(await ticks(p,id,50000),50000);
await p.evaluate(()=>{visible=false;document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await ticks(p,id,300000),0);
await p.evaluate(()=>{visible=true;document.dispatchEvent(new Event('visibilitychange'));});await ready(p,id);
assert.equal(await p.evaluate(id=>{testNow+=300000;return CJEngine.tick(50,id);},id),0,'clamped hidden delta rejected');
assert.equal(await ticks(p,id,50000),50000);
await menu(p,id,true);assert.equal(await ticks(p,id,300000),0);await menu(p,id,false);await ready(p,id);
assert.equal((await read(p)).stats.playTime.byGame[id],200);
assert.equal(await ticks(p,id,399000),399000);assert.equal((await read(p)).stats.totalCJ,0);
await p.reload();await ready(p,id);assert.equal((await read(p)).stats.playTime.byGame[id],599);
assert.equal(await ticks(p,id,1000),1000);player=await read(p);assert.equal(player.stats.totalCJ,1);assert.equal(player.stats.byGame[id],1);assert.equal(player.stats.playTime.byGame[id],600);assert.equal(player.stats.playTime.totalSeconds,600);
await p.reload();await ready(p,id);assert.equal((await read(p)).stats.totalCJ,1);assert.equal(await p.evaluate(id=>CJEngine.getStats(id).activeMs,id),0);
assert.equal(await ticks(p,id,500),500);await p.reload();await ready(p,id);assert.equal(await ticks(p,id,500),500);assert.equal((await read(p)).stats.playTime.byGame[id],601);
assert.equal(await p.evaluate(()=>localStorage.getItem('local-game-save')),'{"coins":321,"level":7}');
// Two visible/focused test surfaces deliberately compete: one owner only.
const q=await c.newPage();q.on('pageerror',e=>errors.push(e.message));await q.goto(base+'/harness?game='+id);await p.waitForTimeout(150);
let owner=(await p.evaluate(()=>CJEngine.isTracking()))?p:q;let other=owner===p?q:p;await ready(owner,id);
assert.equal(await other.evaluate(()=>CJEngine.isTracking()),false);const baseline=(await read(owner)).stats.playTime.byGame[id];
const accepted=await Promise.all([ticks(owner,id,10000),ticks(other,id,10000)]);assert.equal(accepted[0]+accepted[1],10000);assert.equal((await read(owner)).stats.playTime.byGame[id],baseline+10);
await owner.evaluate(()=>{visible=false;document.dispatchEvent(new Event('visibilitychange'));});await ready(other,id);assert.equal(await ticks(other,id,10000),10000);assert.equal((await read(other)).stats.playTime.byGame[id],baseline+20);
// Failed atomic save must not credit the elapsed second or reward.
const original=await read(other);await other.evaluate(()=>{window.savedMethod=CJajlkAccount.savePlayer;CJajlkAccount.savePlayer=()=>{};});assert.equal(await ticks(other,id,1000),0);assert.deepEqual(await read(other),original);await other.evaluate(()=>CJajlkAccount.savePlayer=savedMethod);
checks[id]=['100 s actives','pause 5 min exclue','onglet masqué 5 min exclu','delta de retour plafonné rejeté','menu exclu','reprise','599 s + rechargement + 1 s = exactement 1 CJ et 600 s','fractions persistées au rechargement','2 onglets : un seul propriétaire puis transfert sans doublon','échec de sauvegarde sans crédit fantôme'];
if(id==='attrape'){
await other.evaluate(()=>{gameStarted=false;timerRunning=true;});await ready(other,id);assert.equal(await ticks(other,id,1000),1000);
await other.evaluate(()=>{gameStarted=true;timerRunning=false;inLevelTransition=true;CJEngine.tick(16,'attrape');});assert.equal(await ticks(other,id,1000),0);
await other.evaluate(()=>{inLevelTransition=false;});await ready(other,id);assert.equal(await ticks(other,id,1000),1000);checks[id].push('états Timer et Campagne, transition exclue');
}
if(id==='breaker'){await other.evaluate(()=>{ball.launched=false;CJEngine.tick(16,'breaker');});assert.equal(await ticks(other,id,1000),0);checks[id].push('balle non lancée exclue');}
if(id==='velocity'){await other.evaluate(()=>{ui.gameOver=true;CJEngine.tick(16,'velocity');});assert.equal(await ticks(other,id,1000),0);checks[id].push('game over exclu');}
await c.close();
}
// Preserve the old partially earned timer without retroactively fabricating play time.
const c=await browser.newContext(),p=await c.newPage();await p.goto(base+'/harness?game=attrape');await p.evaluate(()=>{localStorage.removeItem('cjPlayerData');localStorage.setItem('CJEngine_version','older-version');localStorage.setItem('cjEngineTimers','{"attrape":599000}');});await p.reload();await ready(p,'attrape');await ticks(p,'attrape',1000);assert.equal((await read(p)).stats.totalCJ,1);assert.equal((await read(p)).stats.playTime.totalSeconds,1);await c.close();
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'active-time-tests.json'),JSON.stringify({passed:true,checks,legacyMigration:true,errors},null,2));console.log(JSON.stringify({passed:true,checks,legacyMigration:true},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});

