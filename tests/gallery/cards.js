// Visual review of the pet UI cards (Home "next friend" card + Pet Collection)
// rendered directly, independent of app navigation.
//   npx tsc -p tests/gallery/tsconfig.json && node tests/gallery/cards.js
const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '../..');
const lib = p => require(path.join(root, '.tmp-gallery', p));
const MascotCard = lib('components/MascotCard.js').default;
const PetCollection = lib('components/PetCollection.js').default;
const gs = lib('lib/gameState.js');

const make = stats => gs.unlockEarnedPets({ ...gs.defaultGameState(), ...stats }).state;
const early = make({ focusSeconds: 45 * 60, totalSessions: 3, bestStreak: 2 });
const done = make({ focusSeconds: 999999 * 60, totalSessions: 999, bestStreak: 999 });

const card = s =>
  renderToStaticMarkup(
    React.createElement(MascotCard, {
      streak: 2, mascot: s.activeMascot, accessory: null,
      nextPet: gs.nextPetGoal(s), stats: s, ownedCount: s.ownedMascots.length,
    }),
  );
const collection = renderToStaticMarkup(
  React.createElement(PetCollection, {
    stats: early, ownedMascots: early.ownedMascots, activeMascot: 'frog', onEquip: () => {},
  }),
);

const css = fs
  .readdirSync(path.join(root, 'out/_next/static/css'))
  .map(f => `<link rel="stylesheet" href="file:///${path.join(root, 'out/_next/static/css', f).replace(/\\/g, '/')}">`)
  .join('');
// Ionic's core.css hides <body> until it hydrates; this static page never does.
const html = `<!doctype html><html class="hydrated"><meta charset="utf-8">${css}<style>body{margin:0;padding:16px;background:#f0f9ff;width:380px}</style>
${card(early)}${card(done)}${collection}`;
fs.writeFileSync(path.join(root, '.tmp-gallery/cards.html'), html);
console.log('wrote cards.html');
