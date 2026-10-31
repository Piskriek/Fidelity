// Hold-out plant set B (different locations from set A), used to check skills weren't tuned to set A.
// Usage: node seed_holdout.mjs <plan.md> <out_plan.md> <out_key.json>
import fs from 'node:fs';
const [src, out, keyOut] = process.argv.slice(2);
let text = fs.readFileSync(src, 'utf8');
const PLANTS = [
  { id: 'H1', cat: 'unit', desc: 'Rest cycle clears hibernation below 20 kJ while every other strain quantity is in J (25 J steps, 45 J doses)', from: 'drops below `20 J`', to: 'drops below `20 kJ`' },
  { id: 'H2', cat: 'coverage-gap', desc: 'Orbital range [-32768, 32768) no longer covers the 131,072 m sector (half-sector = 65,536 m); points in the outer half of a sector are unrepresentable', from: 'bounded in $[-65536, +65536)\\text{ m}$', to: 'bounded in $[-32768, +32768)\\text{ m}$' },
  { id: 'H3', cat: 'recount', desc: 'mb cap says 12 zones but 1..7 x L|R = 14 (and Part 3 says 14 zones)', from: 'Capped at 14 zones', to: 'Capped at 12 zones' },
  { id: 'H4', cat: 'dependency-order', desc: 'Wave 3 genesis is gated on the Wave 5 app state machine: build order is circular/inverted', from: '(`S0a -> S3` in `~10 ms`)', to: '(`S0a -> S3` in `~10 ms`, gated on the Wave 5 `apps/universe` state machine being mounted)' },
  { id: 'H5', cat: 'weights', desc: 'Taste total weights 0.40+0.35+0.35 = 1.10', from: '0.25 S_{\\text{prop}} \\ge 0.65', to: '0.35 S_{\\text{prop}} \\ge 0.65' },
  { id: 'H6', cat: 'physics', desc: 'Gravity denominator exponent 1/2 with a vector numerator gives |g| constant in r, not 1/r^2', from: '|\\mathbf{q}{\\star, k} - \\mathbf{q}|2^2)^{3/2}', to: '|\\mathbf{q}{\\star, k} - \\mathbf{q}|2^2)^{1/2}' },
  { id: 'H7', cat: 'seam', desc: 'nem grammar drops DRIFTER, but Part 3 temper list includes DRIFTER: that NPC cannot be serialized', from: 'temper=<HOTHEAD|PROUD|COLD|COWARD|GREEDY|LOYAL|DRIFTER>', to: 'temper=<HOTHEAD|PROUD|COLD|COWARD|GREEDY|LOYAL>' },
  { id: 'H8', cat: 'boundary', desc: 'Zero-G branch is safeG < 0.05, planetary branch now safeG > 0.05: g == 0.05 is unhandled', from: 'In planetary gravity (`safeG >= 0.05`)', to: 'In planetary gravity (`safeG > 0.05`)' },
  { id: 'H9', cat: 'unsupported-claim', desc: 'Fabricated benchmark with no evidence file; also inconsistent with the ~10 ms S0a->S3 figure', from: 'forming procedural underground dungeons and relic caches.', to: 'forming procedural underground dungeons and relic caches. Benchmarked on the prototype: 10,000 epochs complete in 4 ms on a mid-range laptop (`bench_genesis.mjs`, 0 regressions).' },
];
for (const p of PLANTS) {
  const n = text.split(p.from).length - 1;
  if (n !== 1) throw new Error(`${p.id}: expected exactly 1 match, found ${n}`);
  text = text.replace(p.from, p.to);
}
fs.writeFileSync(out, text);
fs.writeFileSync(keyOut, JSON.stringify(PLANTS.map(({ from, to, ...rest }) => rest), null, 2));
console.log(`planted ${PLANTS.length} hold-out defects -> ${out}`);
