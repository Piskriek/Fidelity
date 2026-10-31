// Plants known defects into a copy of the plan so agent recall can be scored objectively.
// Usage: node seed_plan.mjs <plan.md> <out_plan.md> <out_key.json>
import fs from 'node:fs';

const [src, out, keyOut] = process.argv.slice(2);
let text = fs.readFileSync(src, 'utf8');

const PLANTS = [
  { id: 'P1', cat: 'math/weights', desc: 'daySatisfaction weights sum to 1.10 (exit weight 0.20 -> 0.30), so satisfaction can exceed 1',
    from: '0.40 \\cdot \\text{arrival}{01} + 0.20 \\cdot \\text{exit}{01}', to: '0.40 \\cdot \\text{arrival}{01} + 0.30 \\cdot \\text{exit}{01}' },
  { id: 'P2', cat: 'cap-violation', desc: 'nem example line resist=0.95 exceeds the 0.85 resistance cap stated in the grammar and Part 3',
    from: 'resist=elem:plasma-arc:0.35`', to: 'resist=elem:plasma-arc:0.95`' },
  { id: 'P3', cat: 'boundary-gap', desc: 'VRAM governor thresholds leave exactly 16 GB unassigned (<16GB Tier 2, >16GB Tier 3)',
    from: '`>=16GB -> Tier 3`', to: '`>16GB -> Tier 3`' },
  { id: 'P4', cat: 'math/sign', desc: 'Part 7 KL term sign flipped (+ln instead of -ln): x + ln x - 1 is negative for x<1, contradicting the >= 0 claim and the skill formula',
    from: '\\left(\\frac{\\Pi_i}{\\Pi_{0,i}} - \\ln\\frac{\\Pi_i}{\\Pi_{0,i}} - 1\\right) \\ge 0$$\n### 1.2', to: '\\left(\\frac{\\Pi_i}{\\Pi_{0,i}} + \\ln\\frac{\\Pi_i}{\\Pi_{0,i}} - 1\\right) \\ge 0$$\n### 1.2' },
  { id: 'P5', cat: 'unbounded-growth', desc: 'Recovery debt 2^(n-1) has no cap (was 2^min(6,n-1)); unbounded exponent, contradicts 64-debt ceiling elsewhere',
    from: '$2^{\\min(6, n-1)}$', to: '$2^{n-1}$' },
  { id: 'P6', cat: 'seam-mismatch', desc: 'nemesisEntry emits field `grudge` but the nem shorthand grammar / formatter expects `score`',
    from: '`{ vs, tier, score, temper, scar, resistKey, resistVal }`', to: '`{ vs, tier, grudge, temper, scar, resistKey, resistVal }`' },
  { id: 'P7', cat: 'div-by-zero', desc: 'Breadcrumb excitement divides by |P_b| with no guard (was max(1,|P_b|)); a breadcrumb with zero pins gives 0/0 = NaN',
    from: '\\frac{|P_c \\cap P_b|}{\\max(1, |P_b|)}', to: '\\frac{|P_c \\cap P_b|}{|P_b|}' },
  { id: 'P8', cat: 'arithmetic', desc: 'Part 4 says 131,072 m = 128 x 512 m; 128 x 512 = 65,536 (should be 256)',
    from: '131,072\\text{ m} = 256 \\times 512\\text{ m}$ (spans', to: '131,072\\text{ m} = 128 \\times 512\\text{ m}$ (spans' },
  { id: 'P9', cat: 'cross-artifact', desc: 'Part 3 syncope threshold changed to >=4 runaway zones; skill C7, spider diagram text and resume all say >=3 (skill-advantaged plant)',
    from: 'When $\\ge 3$ zones hit `runaway`', to: 'When $\\ge 4$ zones hit `runaway`' },
];

for (const p of PLANTS) {
  const n = text.split(p.from).length - 1;
  if (n !== 1) throw new Error(`${p.id}: expected exactly 1 match, found ${n}`);
  text = text.replace(p.from, p.to);
}
fs.writeFileSync(out, text);
fs.writeFileSync(keyOut, JSON.stringify(PLANTS.map(({ from, to, ...rest }) => rest), null, 2));
console.log(`planted ${PLANTS.length} defects -> ${out}`);
