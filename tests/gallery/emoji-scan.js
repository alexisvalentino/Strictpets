// Lists every emoji glyph still present in UI source, with line numbers.
//   node tests/gallery/emoji-scan.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const files = fs
  .readdirSync(path.join(root, 'components'))
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join('components', f));
const re = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/u;
let total = 0;
for (const f of files) {
  const lines = fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (re.test(line)) {
      total++;
      console.log(`${f}:${i + 1}: ${line.trim().slice(0, 110)}`);
    }
  });
}
console.log(`\n${total} line(s) with emoji`);
process.exitCode = total ? 1 : 0;
