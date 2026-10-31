// Moves register rows that landed after Part 9 back under §8.1 (after the last earlier row),
// and restores the blank line before "## 8.2". Usage: node fix_register_placement.mjs <plan.md>
import fs from 'node:fs';
const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split('\n');
const part9 = lines.findIndex(l => l.startsWith('# PART 9:'));
const isRow = l => /^\| `B\d+` \| \*\*(FIXED|OPEN)\*\*/.test(l);
const strays = lines.filter((l, i) => i > part9 && isRow(l));
if (!strays.length) { console.log('nothing to move'); process.exit(0); }
const kept = lines.filter((l, i) => !(i > part9 && isRow(l)));
while (kept.length && kept.at(-1) === '' && kept.at(-2) === '') kept.pop();
const lastRow = kept.reduce((acc, l, i) => (isRow(l) && i < kept.findIndex(x => x.startsWith('# PART 9:')) ? i : acc), -1);
kept.splice(lastRow + 1, 0, ...strays);
const h82 = kept.findIndex(l => l.startsWith('## 8.2'));
if (h82 > 0 && kept[h82 - 1] !== '') kept.splice(h82, 0, '');
fs.writeFileSync(file, kept.join('\n'));
console.log(`moved ${strays.length} register rows under §8.1`);
