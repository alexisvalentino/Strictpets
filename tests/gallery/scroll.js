// Scrollability: on short viewports the fixed-height shell can trap content.
// Every page must be able to reach its last element.
//   node tests/gallery/scroll.js [tab]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { MiniWs } = require('./ws');

const root = path.resolve(__dirname, '../..');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const tab = process.argv[2] || 'home';
const port = 9229;
const profile = path.join(root, '.tmp-gallery', 'cdp-profile-scroll');

const SIZES = [
  { w: 320, h: 568, n: 'SE1' },
  { w: 568, h: 320, n: 'SE1 landscape' },
  { w: 667, h: 375, n: 'iPhone8 landscape' },
  { w: 844, h: 390, n: 'iPhone14 landscape' },
  { w: 768, h: 1024, n: 'iPad portrait' },
  { w: 1366, h: 1024, n: 'iPad Pro landscape' },
];

const seed = String.raw`(function(){
  var p = new URLSearchParams(location.search);
  var d = new Date();
  var today = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  localStorage.setItem('focus-tracker:game', JSON.stringify({
    coins: 140, currentStreak: 4, bestStreak: 4, lastFocusDate: today,
    dailyProgressDate: today, minutesToday: 45, completedToday: 3,
    totalSessions: 12, focusSeconds: 45*60,
    focusLog: [{date: today, sessions: 1, seconds: 1500}],
    ownedMascots: ['bear'], activeMascot: 'bear'
  }));
  var tab = p.get('tab'); if (!tab) return;
  var idx = tab === 'home' ? 0 : tab === 'rewards' ? 2 : 1;
  var tries = 0, clicked = false;
  var go = function () {
    var el = document.querySelector('.snap-x');
    var buttons = document.querySelectorAll('nav button');
    if (!el || !el.clientWidth || buttons.length < 3) return setTimeout(go, 100);
    el.style.scrollBehavior = 'auto'; el.style.scrollSnapType = 'none';
    if (!clicked) { buttons[idx].click(); clicked = true; }
    el.scrollLeft = idx * el.clientWidth;
    if (++tries < 40) requestAnimationFrame(go);
  };
  setTimeout(go, 3000);
})();`;

const outHtml = path.join(root, '.tmp-gallery', 'scroll.html');
const html = fs.readFileSync(path.join(root, 'out/index.html'), 'utf8')
  .replace(/(src|href)="\//g, `$1="file:///${root.replace(/\\/g, '/')}/out/`)
  .replace('<head>', `<head><script>${seed}</script>`);
fs.writeFileSync(outHtml, html);
const url = `file:///${outHtml.replace(/\\/g, '/')}?tab=${tab}`;

const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--allow-file-access-from-files', `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`, 'about:blank',
], { stdio: 'ignore' });

const getJson = p => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: p }, res => {
    let b = ''; res.on('data', c => (b += c));
    res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { reject(e); } });
  }).on('error', reject);
});
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let targets = [];
  for (let i = 0; i < 60; i++) {
    try { targets = await getJson('/json/list'); if (targets.length) break; } catch {}
    await wait(250);
  }
  const ws = new MiniWs(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await ws.ready;
  let id = 0;
  const pending = new Map();
  ws.onmessage = raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

  await send('Page.enable');
  for (const s of SIZES) {
    await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 900 });
    await send('Page.navigate', { url });
    await wait(4500);
    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const car = document.querySelector('.snap-x');
        const idx = Math.round(car.scrollLeft / car.clientWidth);
        const page = car.children[idx];
        const before = Math.round(page.scrollTop);
        page.scrollTop = 999999;
        const after = Math.round(page.scrollTop);
        const maxScroll = page.scrollHeight - page.clientHeight;
        // Can the last real element be reached?
        const kids = [...page.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height > 0);
        const last = kids[kids.length - 1];
        const lr = last ? last.getBoundingClientRect() : null;
        const pr = page.getBoundingClientRect();
        const reachable = lr ? lr.bottom <= pr.bottom + 2 : null;
        page.scrollTop = before;
        return {
          idx, scrollH: page.scrollHeight, clientH: page.clientHeight,
          maxScroll, canScroll: maxScroll > 0, scrolledTo: after,
          lastVisibleBeyondViewport: reachable,
          lastTag: last ? last.tagName + '.' + String(last.className || '').split(' ').slice(0,2).join('.') : null,
        };
      })()`,
      returnByValue: true,
    });
    const v = r.result.value;
    const ok = v.maxScroll === 0 || Math.abs(v.scrolledTo - v.maxScroll) <= 2;
    console.log(`${s.n.padEnd(22)} (${s.w}x${s.h})  contentH=${v.scrollH} viewH=${v.clientH} maxScroll=${v.maxScroll} ` +
      `reachEnd=${ok ? 'YES' : 'NO'} lastVisible=${v.lastVisibleBeyondViewport ? 'YES' : 'NO'}`);
  }
  ws.close(); child.kill(); process.exit(0);
})().catch(e => { console.error(e); child.kill(); process.exit(1); });
