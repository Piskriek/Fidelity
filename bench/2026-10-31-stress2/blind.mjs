// Blind the main-run outputs: shuffle within each item (seed 35), mask Skill-specific tokens, write blind/ and key.json.
// Usage: node blind.mjs   (run from this folder; reads outputs/<item>_<arm>_<n>.md)
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
let s = 35;
const rand = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mask = x => x
  .replace(/sq[-_ ]distortion[\w.-]*/gi, '[ref]')
  .replace(/Document-Audit/gi, '[ref]')
  .replace(/ΔBugs/g, '[ref]')
  .replace(/\bskill\b/gi, '[ref]')
  .replace(/\bC\d{1,2}\b/g, '[ref]');
const files = fs.readdirSync(path.join(dir, 'outputs')).filter(f => /^[AB]_[SN]_\d\.md$/.test(f)).sort();
fs.mkdirSync(path.join(dir, 'blind'), { recursive: true });
const key = {};
for (const item of ['A', 'B']) {
  const group = files.filter(f => f.startsWith(item + '_'));
  for (let i = group.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [group[i], group[j]] = [group[j], group[i]]; }
  group.forEach((f, i) => {
    const id = `${item}${String(i + 1).padStart(2, '0')}`;
    key[id] = f;
    const body = fs.readFileSync(path.join(dir, 'outputs', f), 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '');
    fs.writeFileSync(path.join(dir, 'blind', `${id}.md`), `# Output ${id}\n\n${mask(body)}`);
  });
}
fs.writeFileSync(path.join(dir, 'key.json'), JSON.stringify(key, null, 1));
console.log(`blinded ${Object.keys(key).length} outputs`);
