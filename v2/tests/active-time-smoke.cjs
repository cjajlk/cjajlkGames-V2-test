const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.TEST_ROOT||path.resolve(__dirname,'../..');
const velocity=process.env.VELOCITY_ROOT||path.resolve(root,'../nocturne velocity');
const output=process.env.TEST_OUTPUT||path.resolve('outputs/active-time');fs.mkdirSync(output,{recursive:true});
const sources={attrape:fs.readFileSync(root+'/games/attrape/js/game.js','utf8'),breaker:fs.readFileSync(root+'/games/breaker/js/gameplay.js','utf8'),velocity:fs.readFileSync(velocity+'/gameplay.js','utf8')};
const adapters=Object.fromEntries(Object.entries(sources).map(([id,s])=>[id,s.match(/window\.getGameState = function \(\) \{[\s\S]*?\n\};/)[0]]));
const globals={attrape:'window.Game={running:true};window.isGameRunning=true;window.gameStarted=true;window.timerRunning=false;window.inLevelTransition=false;window.isGamePaused=false;',breaker:'window.state={running:true};window.ball={launched:true};',velocity:'window.ui={gameOver:false};window.leavingGameplay=false;window.runMetricsCommitted=false;'};
const harness=id=>`<!doctype html><body><script>window.testNow=0;performance.now=()=>testNow;window.visible=true;window.focused=true;Object.defineProperty(document,'visibilityState',{get:()=>visible?'visible':'hidden'});Object.defineProperty(document,'hidden',{get:()=>!visible});document.hasFocus=()=>focused;${globals[id]}${adapters[id]}</script><script src='/core/cjAccount.js'></script><script src='/core/cjEngine.js'></script></body>`;
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local');if(url.pathname==='/harness'){res.setHeader('Content-Type','text/html');return res.end(harness(url.searchParams.get('game')));}let activeRoot=root;let pathname=decodeURIComponent(url.pathname);if(pathname.startsWith('/cjajlkGames/'))pathname=pathname.slice(12);if(pathname.startsWith('/velocity/')){activeRoot=velocity;pathname=pathname.slice(9);}let f=path.resolve(activeRoot,'.'+pathname);if(!f.startsWith(path.resolve(activeRoot)+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');fs.readFile(f,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}[path.extname(f)]||'application/octet-stream'});res.end(e?'missing':data);});});

let browser;const results={};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,channel:'msedge'});
for(const id of ['attrape','breaker','velocity','standalone']){
const c=await browser.newContext(),p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(()=>localStorage.setItem('playerName','Audit test'));
if(id==='standalone')await p.route('**/cjajlkGames/core/*',route=>route.abort());
const route=id==='attrape'?'/games/attrape/index.html':id==='breaker'?'/games/breaker/pages/gameplay.html':'/velocity/game.html';await p.goto(base+route);await p.bringToFront();await p.waitForTimeout(500);
if(id==='attrape')await p.evaluate(()=>startNormalMode());
if(id==='breaker'){for(let i=0;i<12;i++){await p.locator('canvas').dispatchEvent('click');await p.waitForTimeout(200);}}
await p.waitForTimeout(1800);
results[id]=await p.evaluate(()=>({state:window.getGameState?.(),tracking:window.CJEngine?.isTracking?.(),seconds:window.CJajlkAccount?.getPlayer()?.stats.playTime.totalSeconds||0,localSeconds:typeof runMetrics!=="undefined"?runMetrics.playTime:null}));results[id].errors=errs;
if(id==='attrape'){
await p.evaluate(()=>openPause());await p.waitForTimeout(150);const before=await p.evaluate(()=>CJajlkAccount.getPlayer().stats.playTime.totalSeconds);await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>CJajlkAccount.getPlayer().stats.playTime.totalSeconds),before);results[id].pauseVerified=true;
await p.evaluate(()=>closePause());await p.waitForTimeout(1400);assert((await p.evaluate(()=>CJajlkAccount.getPlayer().stats.playTime.totalSeconds))>before);results[id].resumeVerified=true;
}
console.log(id,JSON.stringify(results[id]));assert(results[id].state,'actual getGameState '+id);if(id!=='standalone')assert(results[id].seconds>=1,'real frame time '+id);else {assert.equal(results[id].seconds,0);assert(results[id].localSeconds>=1,'standalone local time');}
await c.close();
}
fs.writeFileSync(path.join(output,'actual-games-smoke.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});


