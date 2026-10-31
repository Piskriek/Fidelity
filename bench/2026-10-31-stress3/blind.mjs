// Blind the main-run outputs and the two controls: shuffle (seed 36), mask neutrally, write blind/ and key.json.
// Usage: node blind.mjs   (run from this folder; reads outputs/T_<arm>_<n>.md and controls/PC*.md)
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
let s = 36;
const rand = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// Neutral masking, identical for every file: check codes C5–C35 are deleted (C0–C4 are log case names), Skill words become plain words.
const mask = x => x
  .replace(/\s?\((?:C(?:[5-9]|[12]\d|3[0-5]))(?:[,;/ ]+C(?:[5-9]|[12]\d|3[0-5]))*\)/g, '')
  .replace(/\s?\bC(?:[5-9]|[12]\d|3[0-5])\b/g, '')
  .replace(/sq[-_ ]distortion[\w.-]*/gi, 'notes')
  .replace(/Document-Audit/gi, 'review')
  .replace(/\bchecklists?\b/gi, 'notes')
  .replace(/\bskills?\b/gi, 'notes');
const files = [
  ...fs.readdirSync(path.join(dir, 'outputs')).filter(f => /^T_[SN]_\d\.md$/.test(f)).map(f => ['outputs', f]),
  ...fs.readdirSync(path.join(dir, 'controls')).filter(f => /^PC\d\.md$/.test(f)).map(f => ['controls', f]),
].sort((a, b) => a[1].localeCompare(b[1]));
for (let i = files.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [files[i], files[j]] = [files[j], files[i]]; }
fs.mkdirSync(path.join(dir, 'blind'), { recursive: true });
const key = {};
files.forEach(([sub, f], i) => {
  const id = `T${String(i + 1).padStart(2, '0')}`;
  key[id] = f;
  const body = fs.readFileSync(path.join(dir, sub, f), 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '');
  fs.writeFileSync(path.join(dir, 'blind', `${id}.md`), `# Output ${id}\n\n${mask(body)}`);
});
fs.writeFileSync(path.join(dir, 'key.json'), JSON.stringify(key, null, 1));
console.log(`blinded ${files.length} files`);
