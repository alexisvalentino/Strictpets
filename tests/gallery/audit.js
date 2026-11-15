// End-to-end responsive audit: measures real layout geometry across many
// viewports and reports concrete defects (clipping, overflow, tiny tap
// targets, left-aligned content on wide screens).
//   node tests/gallery/audit.js [tab]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { MiniWs } = require('./ws');

const root = path.resolve(__dirname, '../..');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const tab = process.argv[2] || 'home';

// Phones, small tablets, iPad portrait/landscape, and desktop widths.
const SIZES = [
  { w: 320, h: 568, n: 'iPhone SE (1st)' },
  { w: 360, h: 640, n: 'Android small' },
  { w: 375, h: 667, n: 'iPhone SE2/8' },
  { w: 390, h: 844, n: 'iPhone 14' },
  { w: 414, h: 896, n: 'iPhone XR' },
  { w: 430, h: 932, n: 'iPhone 15 Pro Max' },
  // Landscape phones: short and wide is where a fixed-height app shell breaks.
  { w: 568, h: 320, n: 'iPhone SE landscape' },
  { w: 667, h: 375, n: 'iPhone 8 landscape' },
  { w: 844, h: 390, n: 'iPhone 14 landscape' },
  { w: 932, h: 430, n: 'iPhone 15 PM landscape' },
  { w: 600, h: 960, n: 'small tablet' },
  { w: 768, h: 1024, n: 'iPad portrait' },
  { w: 820, h: 1180, n: 'iPad Air portrait' },
  { w: 834, h: 1112, n: 'iPad Pro 11 portrait' },
  { w: 1024, h: 768, n: 'iPad landscape' },
  { w: 1180, h: 820, n: 'iPad Air landscape' },
  { w: 1366, h: 1024, n: 'iPad Pro 12.9 landscape' },
];

const port = 9226;
const profile = path.join(root, '.tmp-gallery', 'cdp-profile-audit');

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
  var tries = 0, clicked = false;
  var go = function () {
    var el = document.querySelector('.snap-x');
    var buttons = document.querySelectorAll('nav button');
    if (!el || !el.clientWidth || buttons.length < 3) return setTimeout(go, 100);
    el.style.scrollBehavior = 'auto';
    el.style.scrollSnapType = 'none';
    if (!clicked) { buttons[idx].click(); clicked = true; }
    el.scrollLeft = idx * el.clientWidth;
    if (++tries < 40) requestAnimationFrame(go);
  };
  setTimeout(go, 3000);
})();`;

const outHtml = path.join(root, '.tmp-gallery', 'audit.html');
const html = fs
  .readFileSync(path.join(root, 'out/index.html'), 'utf8')
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
    let body = '';
    res.on('data', c => (body += c));
    res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
  }).on('error', reject);
});
const wait = ms => new Promise(r => setTimeout(r, ms));

// Everything measured inside the page. Runs once per viewport.
const PROBE = String.raw`(() => {
  const R = {};
  const car = document.querySelector('.snap-x');
  R.vw = innerWidth; R.vh = innerHeight;
  R.docScrollW = document.documentElement.scrollWidth;
  R.hOverflow = R.docScrollW - R.vw;

  // The active page element
  const idx = car ? Math.round(car.scrollLeft / car.clientWidth) : 0;
  const page = car ? car.children[idx] : document.body;
  R.pageIdx = idx;
  if (!page) return R;

  const pr = page.getBoundingClientRect();
  R.pageRect = { left: Math.round(pr.left), width: Math.round(pr.width) };

  // The content wrapper (first child of the page)
  const wrap = page.firstElementChild;
  if (wrap) {
    const wr = wrap.getBoundingClientRect();
    R.wrapRect = { left: Math.round(wr.left), right: Math.round(wr.right), width: Math.round(wr.width) };
    // Is it horizontally centered inside the page?
    const leftGap = wr.left - pr.left;
    const rightGap = pr.right - wr.right;
    R.centerOffset = Math.round(leftGap - rightGap);
  }

  const label = el => {
    const cls = typeof el.className === 'string' ? el.className : '';
    const txt = (el.textContent || '').trim().slice(0, 34).replace(/\s+/g, ' ');
    return el.tagName.toLowerCase() + (cls ? '.' + cls.split(/\s+/).slice(0, 4).join('.') : '') + (txt ? ' :: ' + txt : '');
  };

  // 1. Elements whose own content is wider/taller than the box, clipped.
  const clipped = [];
  const all = page.querySelectorAll('*');
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (el.children.length) continue; // only leaf-ish nodes; wrappers inherit
    const ovX = cs.overflowX, ovY = cs.overflowY;
    if ((ovX === 'hidden' || ovY === 'hidden') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      clipped.push({ el: label(el), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
    }
  }
  R.clipped = clipped.slice(0, 14);

  // 2. Text nodes that overflow an ancestor with overflow:hidden
  const textClip = [];
  for (const el of all) {
    if (el.children.length) continue;
    const txt = (el.textContent || '').trim();
    if (!txt) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Walk up to find a clipping ancestor and compare
    let a = el.parentElement, guard = 0;
    while (a && guard++ < 6) {
      const acs = getComputedStyle(a);
      if (acs.overflowX === 'hidden' || acs.overflowY === 'hidden') {
        const ar = a.getBoundingClientRect();
        const dx = Math.max(0, r.right - ar.right) + Math.max(0, ar.left - r.left);
        const dy = Math.max(0, r.bottom - ar.bottom) + Math.max(0, ar.top - r.top);
        if (dx > 1 || dy > 1) {
          textClip.push({ el: label(el), dx: Math.round(dx), dy: Math.round(dy), txt: txt.slice(0, 40) });
        }
        break;
      }
      a = a.parentElement;
    }
  }
  R.textClip = textClip.slice(0, 14);

  // 3. Interactive elements below the 44x44 touch minimum.
  // Disabled controls are not tappable, so they are not tap targets.
  const small = [];
  for (const el of page.querySelectorAll('button, a, [role="button"], input, select')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
    if (el.closest('[disabled]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.width < 44 || r.height < 44) {
      small.push({ el: label(el).slice(0, 70), w: Math.round(r.width), h: Math.round(r.height), area: Math.round(r.width * r.height) });
    }
  }
  R.smallTargets = small.slice(0, 20);
  R.smallCount = small.length;

  // 4. Font size census (below 12px is hard to read on a phone)
  const fonts = {};
  for (const el of all) {
    if (el.children.length) continue;
    if (!(el.textContent || '').trim()) continue;
    const fs2 = getComputedStyle(el).fontSize;
    fonts[fs2] = (fonts[fs2] || 0) + 1;
  }
  R.fonts = fonts;

  // 5. Banner card clipping specifically (EventBannerRow)
  const banners = [...page.querySelectorAll('[class*="from-brand-500"], [class*="from-emerald-500"], [class*="from-sky-500"], [class*="from-amber-500"]')];
  R.bannerClip = banners.slice(0, 6).map(b => {
    const r = b.getBoundingClientRect();
    return {
      h: Math.round(r.height), w: Math.round(r.width),
      sh: b.scrollHeight, ch: b.clientHeight,
      over: b.scrollHeight - b.clientHeight,
    };
  }).filter(x => x.over > 1);

  return R;
})()`;

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

  const out = [];
  for (const s of SIZES) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.w, height: s.h, deviceScaleFactor: 1, mobile: s.w < 700,
    });
    await send('Page.navigate', { url });
    await wait(4500);
    const res = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
    const v = res.result && res.result.value;
    if (!v) { console.log('PROBE FAILED at', s.n); continue; }
    out.push({ size: s, data: v });
    console.log('\n===== ' + s.n + '  (' + s.w + 'x' + s.h + ') =====');
    console.log('  hOverflow=' + v.hOverflow + '  centerOffset=' + (v.centerOffset ?? 'n/a') +
      '  wrapW=' + (v.wrapRect ? v.wrapRect.width : 'n/a') + ' wrapLeft=' + (v.wrapRect ? v.wrapRect.left : 'n/a'));
    if (v.textClip.length) { console.log('  TEXT CLIPPED (' + v.textClip.length + '):'); v.textClip.forEach(c => console.log('    - ' + c.el + '  dx=' + c.dx + ' dy=' + c.dy)); }
    if (v.clipped.length) { console.log('  BOX OVERFLOW (' + v.clipped.length + '):'); v.clipped.forEach(c => console.log('    - ' + c.el + '  w ' + c.cw + '->' + c.sw + '  h ' + c.ch + '->' + c.sh)); }
    if (v.smallCount) { console.log('  SMALL TAP TARGETS: ' + v.smallCount); v.smallTargets.slice(0, 8).forEach(c => console.log('    - ' + c.w + 'x' + c.h + '  ' + c.el)); }
    if (v.bannerClip.length) { console.log('  BANNER CLIPPED: ' + JSON.stringify(v.bannerClip)); }
    console.log('  fonts=' + JSON.stringify(v.fonts));
  }

  fs.writeFileSync(path.join(root, '.tmp-gallery', 'audit-' + tab + '.json'), JSON.stringify(out, null, 2));
  ws.close();
  child.kill();
  process.exit(0);
})().catch(e => { console.error(e); child.kill(); process.exit(1); });
