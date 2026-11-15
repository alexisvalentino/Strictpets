// Visual review: render every pet in every mood to an HTML page.
//   npx tsc -p tests/gallery/tsconfig.json && node tests/gallery/render.js
// Output: .tmp-gallery/gallery.html (open it, or screenshot with headless Chrome).
const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '../..');
const Mascot = require(path.join(root, '.tmp-gallery/components/Mascot.js')).default;
const { MASCOT_CATALOG } = require(path.join(root, '.tmp-gallery/lib/gameState.js'));

const moods = process.argv.includes('--big') ? ['idle', 'happy'] : ['idle', 'running', 'happy', 'sad'];
const size = process.argv.includes('--big') ? 150 : 72;
const cells = MASCOT_CATALOG.map(p => {
  const faces = moods
    .map(mood =>
      renderToStaticMarkup(
        React.createElement(
          'div',
          { className: 'face' },
          React.createElement(Mascot, { mood, variant: p.id, still: true, className: 'pet' }),
        ),
      ),
    )
    .join('');
  return `<div class="cell"><div class="row">${faces}</div><p>${p.emoji} ${p.name}</p></div>`;
});

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:12px;background:#f0f9ff;font:700 13px system-ui}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.cell{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:6px;text-align:center}
.row{display:flex;justify-content:center}
.face{width:${size}px;height:${size}px;position:relative;overflow:hidden}
.pet{width:${size}px;height:${size}px}
.pet svg{width:100%;height:100%}
p{margin:4px 0 0}
/* hide confetti / tears animation leftovers in a static shot */
.mascot-confetti,.mascot-confetti-shockwave,.mascot-confetti-shockwave-secondary{display:none}
.mascot-tear{opacity:1!important}
</style><div class="grid">${cells.join('')}</div>`;

const out = path.join(root, '.tmp-gallery/gallery.html');
fs.writeFileSync(out, html);
console.log('wrote', out);
