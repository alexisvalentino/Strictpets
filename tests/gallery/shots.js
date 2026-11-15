// Responsive screenshots of the built app at several viewports.
//   node tests/gallery/shots.js [tab] [scroll]
// Spawns headless Chrome with a DevTools protocol connection so page-level
// scroll offsets (Electron/Ionic inner scroll containers) can be captured.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const root = path.resolve(__dirname, '../..');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const tab = process.argv[2] || 'home';
const scroll = process.argv[3] || '0';
const sizes = [
  { w: 320, h: 640, name: 'phone-320' },
  { w: 390, h: 844, name: 'phone-390' },
  { w: 768, h: 1024, name: 'ipad-portrait' },
  { w: 1024, h: 768, name: 'ipad-landscape' },
];

const outHtml = path.join(root, '.tmp-gallery', 'session.html');
const seed = String.raw`(function(){
  var p = new URLSearchParams(location.search);
  var d = new Date();
  var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  localStorage.setItem('focus-tracker:game', JSON.stringify({
    coins: 140, currentStreak: 4, bestStreak: 4, lastFocusDate: today,
    dailyProgressDate: today, minutesToday: 45, completedToday: 3,
    totalSessions: 12, focusSeconds: 45 * 60,
    focusLog: [{ date: today, sessions: 1, seconds: 1500 }],
    ownedMascots: ['bear'], activeMascot: 'bear'
  }));
  var tab = p.get('tab');
  if (!tab) return;
  var idx = tab === 'home' ? 0 : tab === 'rewards' ? 2 : 1;
  var tries = 0;
  var clicked = false;
  var go = function () {
    var el = document.querySelector('.snap-x');
    var buttons = document.querySelectorAll('nav button');
    if (!el || !el.clientWidth || buttons.length < 3) return setTimeout(go, 100);
    el.style.scrollBehavior = 'auto';
    el.style.scrollSnapType = 'none';
    if (!clicked) { buttons[idx].click(); clicked = true; }
    // Force the rest position every frame so no smooth scroll is in flight
    // when the screenshot is taken.
    el.scrollLeft = idx * el.clientWidth;
    if (++tries < 40) requestAnimationFrame(go);
  };
  setTimeout(go, 4000);
})();`;

// Inline the seed so the page works from file:// without extra scripts.
const html = fs
  .readFileSync(path.join(root, 'out/index.html'), 'utf8')
  .replace(/(src|href)="\//g, `$1="file:///${root.replace(/\\/g, '/')}/out/`)
  .replace('<head>', `<head><script>${seed}</script>`);
fs.writeFileSync(outHtml, html);
const url = `file:///${outHtml.replace(/\\/g, '/')}?tab=${tab}&scroll=${scroll}&min=45&sessions=3`;

const port = 9223;
const profile = path.join(root, '.tmp-gallery', 'cdp-profile');
const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--allow-file-access-from-files', `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`, 'about:blank',
], { stdio: 'ignore' });

const getJson = p =>
  new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: p }, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let targets = [];
  for (let i = 0; i < 60; i++) {
    try { targets = await getJson('/json/list'); if (targets.length) break; } catch {}
    await wait(250);
  }
  const page = targets.find(t => t.type === 'page');
  const { MiniWs: WebSocket } = require('./ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = raw => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  };
  await ws.ready;
  const send = (method, params = {}) =>
    new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });

  await send('Page.enable');
  const results = [];
  for (const s of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 2, mobile: s.w < 700 });
    await send('Page.navigate', { url });
    await wait(5000);
    // Scroll the visible page's inner container to the requested offset.
    await send('Runtime.evaluate', {
      expression: `(() => { const el = document.querySelector('.snap-x'); const page = el && el.children[${tab === 'home' ? 0 : 2}]; if (page) page.scrollTop = Number(${Number(scroll) || 0}); return { cw: innerWidth, ch: innerHeight, docW: document.documentElement.scrollWidth, sy: page ? page.scrollTop : -1 }; })()`,
      returnByValue: true,
    }).then(r => console.log(s.name, JSON.stringify(r.result.value)));
    await wait(600);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(root, '.tmp-gallery', `shot-${tab}-${s.name}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    results.push(file);
  }
  console.log(results.join('\n'));
  ws.close();
  child.kill();
  process.exit(0);
})().catch(e => { console.error(e); child.kill(); process.exit(1); });
