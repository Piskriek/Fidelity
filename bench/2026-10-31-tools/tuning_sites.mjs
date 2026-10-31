// Reconstructs the exact mutant sample that specs F29–F47 were tuned on: the first seed-42 run of
// mutant_generator.mjs (operators as they were then) on the Pass R28 plan. Sites are keyed by
// content (operator + 40 chars of context either side), so they can be matched in later plan versions.
// Usage: node tuning_sites.mjs <R28 plan.md> <out.json>
import fs from 'node:fs';
const [planPath, out] = process.argv.slice(2);
const plan = fs.readFileSync(planPath, 'utf8');
const start = plan.indexOf('# PART 1:'), end = plan.indexOf('# PART 8:');
const blocked = [...plan.matchAll(/```[\s\S]*?```/g)].map(m => [m.index, m.index + m[0].length]);
const inRegion = i => i >= start && i < end && !blocked.some(([a, b]) => i >= a && i < b);
// Operator regexes exactly as in the first run (before the R29 review widened min↔max and −↔+).
const OPS = [
  ['min↔max', /\\(min|max)\(/g], ['≥↔≤', /\\(ge|le)\b/g], ['>=→>', /(`[^`\n]*?)>=([^`\n]*`)/g], ['true↔false', /=== (true|false)`/g],
  ['swap a−b', /\(([^()$\n]{1,40}) - ([^()$\n]{1,40})\)/g], ['−↔+', /(\$[^$\n]{0,200}?) (-|\+) /g], ['coefficient ±0.1', /(?<![\d.])(0\.\d\d?)(?![\d])/g],
  ['integer ×2', /(?<![\d.,^{])(\d{2,6})(?![\d.,}%])/g], ['unit swap', /(GPa|MPa|\bkJ\b|(?<=\d )J\b|kg\/m)/g], ['drop guard', /\\max\((1|10\^\{-\d+\}), /g],
  ['type swap', /(Float32|Float16|Float64|Uint32Array\(128\))/g], ['exponent', /\^\{(3\/2|1\/2)\}|\|\^(2)\b/g], ['drop enum member', /<([A-Z_]+(?:\|[A-Z_]+){2,})>/g],
];
let s = 42 >>> 0;
const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// The changed operator kept its name but its sites moved; key the −↔+ sites by the sign position.
const sites = [];
for (const [name, re] of OPS) {
  for (const m of shuffle([...plan.matchAll(re)].filter(x => inRegion(x.index))).slice(0, 10)) {
    const at = name === '−↔+' ? m.index + m[1].length : m.index;
    sites.push({ op: name, ctx: plan.slice(Math.max(0, at - 40), at + 40) });
  }
}
fs.writeFileSync(out, JSON.stringify(sites, null, 1));
console.log(`${sites.length} tuning sites written`);
