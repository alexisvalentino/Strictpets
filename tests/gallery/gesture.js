// Gesture check: the tab carousel must respond to a horizontal swipe and the
// page-scroll axis must not hijack it. Synthesized touch through CDP; this
// runs on Chromium, not Safari, so it proves the handler and the scroll axis
// but not iOS WebKit's own gesture arbitration.
//   node tests/gallery/gesture.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { MiniWs } = require('./ws');

const root = path.resolve(__dirname, '../..');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9228;
const profile = path.join(root, '.tmp-gallery', 'cdp-profile-gesture');

const seed = String.raw`(function(){
  var d = new Date();
  var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  localStorage.setItem('focus-tracker:game', JSON.stringify({
    coins: 140, currentStreak: 4, bestStreak: 4, lastFocusDate: today,
    dailyProgressDate: today, minutesToday: 45, completedToday: 3,
    totalSessions: 12, focusSeconds: 45*60,
    focusLog: [{date: today, sessions: 1, seconds: 1500}],
    ownedMascots: ['bear'], activeMascot: 'bear'
  }));
})();`;

const outHtml = path.join(root, '.tmp-gallery', 'gesture.html');
const html = fs.readFileSync(path.join(root, 'out/index.html'), 'utf8')
  .replace(/(src|href)="\//g, `$1="file:///${root.replace(/\\/g, '/')}/out/`)
  .replace('<head>', `<head><script>${seed}</script>`);
fs.writeFileSync(outHtml, html);
const url = `file:///${outHtml.replace(/\\/g, '/')}`;

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
  const evalJs = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;

  await send('Page.enable');
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url });
  await wait(4500);

  const state = () => evalJs(`(() => {
    const car = document.querySelector('.snap-x');
    return {
      scrollLeft: Math.round(car.scrollLeft),
      clientWidth: car.clientWidth,
      idx: Math.round(car.scrollLeft / car.clientWidth),
      activeTabLabel: (document.querySelector('nav[aria-label="Primary"] [aria-current="page"]') || {}).textContent,
      overflowX: getComputedStyle(car).overflowX,
    };
  })()`);

  console.log('start  ', JSON.stringify(await state()));

  // Horizontal swipe left (drag from right to left) — should advance a page.
  const swipe = async (fromX, toX, y, steps = 12) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fromX, y, id: 1 }] });
    for (let i = 1; i <= steps; i++) {
      const x = fromX + ((toX - fromX) * i) / steps;
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1 }] });
      await wait(16);
    }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(900);
  };

  await swipe(330, 60, 500);
  console.log('swipe<-', JSON.stringify(await state()));

  await swipe(60, 330, 500);
  console.log('swipe->', JSON.stringify(await state()));

  // Vertical swipe on the same surface must scroll the page, not the tab.
  const beforeV = await state();
  const swipeV = async (x, fromY, toY, steps = 12) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY, id: 2 }] });
    for (let i = 1; i <= steps; i++) {
      const y = fromY + ((toY - fromY) * i) / steps;
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 2 }] });
      await wait(16);
    }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(900);
  };
  await swipeV(195, 700, 250);
  const afterV = await evalJs(`(() => {
    const car = document.querySelector('.snap-x');
    const page = car.children[Math.round(car.scrollLeft / car.clientWidth)];
    return { pageScrollTop: page ? Math.round(page.scrollTop) : -1, carLeft: Math.round(car.scrollLeft) };
  })()`);
  console.log('vscroll', JSON.stringify(afterV), '(before carLeft=' + beforeV.scrollLeft + ')');
  console.log('  -> ' + (afterV.carLeft === beforeV.scrollLeft
    ? 'vertical swipe did NOT change the tab (ok)'
    : 'VERTICAL SWIPE CHANGED THE TAB (bug)') +
    ', pageScrollTop=' + afterV.pageScrollTop + (afterV.pageScrollTop > 0 ? ' (page scrolled, ok)' : ' (page did not scroll)'));

  // Banner scroller lives on the Home page: click the Home tab directly.
  await evalJs(`(() => {
    const btns = document.querySelectorAll('nav[aria-label="Primary"] button');
    if (btns[0]) btns[0].click();
    return true;
  })()`);
  await wait(1200);
  const home = await state();
  console.log('at home ', JSON.stringify(home));

  const bannerState = () => evalJs(`(() => {
    const b = document.querySelector('.no-scrollbar.snap-x.snap-mandatory.gap-3.overflow-x-auto');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { left: Math.round(b.scrollLeft), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
  })()`);

  // Vertical scroll on Home (this page has far more content than the viewport).
  const vBefore = await evalJs(`(() => {
    const car = document.querySelector('.snap-x');
    const page = car.children[Math.round(car.scrollLeft / car.clientWidth)];
    return { top: Math.round(page.scrollTop), carLeft: Math.round(car.scrollLeft), scrollH: page.scrollHeight, clientH: page.clientHeight };
  })()`);
  await swipeV(195, 700, 200);
  const vAfter = await evalJs(`(() => {
    const car = document.querySelector('.snap-x');
    const page = car.children[Math.round(car.scrollLeft / car.clientWidth)];
    return { top: Math.round(page.scrollTop), carLeft: Math.round(car.scrollLeft) };
  })()`);
  console.log('home vscroll', JSON.stringify(vBefore), '->', JSON.stringify(vAfter));
  console.log('  -> page scrolled: ' + (vAfter.top > vBefore.top ? 'YES (ok)' : 'NO (bug: content is cut off)') +
    ' | tab stayed: ' + (vAfter.carLeft === vBefore.carLeft ? 'YES (ok)' : 'NO (bug)'));

  // Back to the top before the banner test.
  await evalJs(`(() => {
    const car = document.querySelector('.snap-x');
    const page = car.children[Math.round(car.scrollLeft / car.clientWidth)];
    page.scrollTop = 0;
    return true;
  })()`);
  await wait(500);

  const b0 = await bannerState();
  const carBefore = (await state()).scrollLeft;
  if (b0) {
    // Swipe horizontally across the banner strip's own centre.
    await swipe(b0.cx + 120, b0.cx - 120, b0.cy);
    const b1 = await bannerState();
    const carAfter = (await state()).scrollLeft;
    console.log('banner  left ' + b0.left + ' -> ' + b1.left +
      ' | pageCarousel ' + carBefore + ' -> ' + carAfter +
      ' -> ' + (b1.left > b0.left ? 'BANNER MOVED (ok)' : 'BANNER DID NOT MOVE (bug)') +
      ', ' + (carAfter === carBefore ? 'page carousel stayed (ok)' : 'PAGE CAROUSEL HIJACKED (bug)'));
  } else {
    console.log('banner scroller not found on Home');
  }

  ws.close(); child.kill(); process.exit(0);
})().catch(e => { console.error(e); child.kill(); process.exit(1); });
