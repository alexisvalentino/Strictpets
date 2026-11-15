// Measures the layout geometry of the running app at a given viewport so
// overflow / clipping bugs can be found precisely.
//   node tests/gallery/measure.js [tab] [width] [height]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { MiniWs } = require('./ws');

const root = path.resolve(__dirname, '../..');
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const tab = process.argv[2] || 'home';
const width = Number(process.argv[3] || 320);
const height = Number(process.argv[4] || 640);
const port = 9224;
const profile = path.join(root, '.tmp-gallery', 'cdp-profile');

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
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
  const url = `file:///${path.join(root, '.tmp-gallery', 'session.html').replace(/\\/g, '/')}?tab=${tab}`;
  await send('Page.navigate', { url });
  await wait(5000);

  const expr = `(() => {
    const out = { vw: innerWidth, carouselScroll: null, pages: [] };
    const car = document.querySelector('.snap-x');
    if (car) {
      out.carousel = { clientWidth: car.clientWidth, scrollWidth: car.scrollWidth, scrollLeft: car.scrollLeft };
      [...car.children].forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const inner = p.firstElementChild ? p.firstElementChild.getBoundingClientRect() : null;
        out.pages.push({ i, left: Math.round(r.left), width: Math.round(r.width), innerLeft: inner && Math.round(inner.left), innerWidth: inner && Math.round(inner.width) });
      });
    }
    const widest = [...document.querySelectorAll('*')].map(el => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''), right: Math.round(r.right), width: Math.round(r.width) };
    }).sort((a, b) => b.right - a.right).slice(0, 6);
    out.widest = widest;
    out.docScrollWidth = document.documentElement.scrollWidth;
    return out;
  })()`;

  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
  child.kill();
  process.exit(0);
})().catch(e => { console.error(e); child.kill(); process.exit(1); });
