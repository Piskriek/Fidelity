// Set C: harder plants (logic inversions, sign flips, broken inverses, precision, table numbering)
// applied to the Pass R26 plan. Usage: node seed_setC.mjs <plan.md> <out_plan.md> <out_key.json>
import fs from 'node:fs';
const [src, out, keyOut] = process.argv.slice(2);
let text = fs.readFileSync(src, 'utf8');
const PLANTS = [
  { id: 'C1', diff: 'hard', cat: 'physics-sign', desc: 'Gravity numerator flipped to (q - q_star): attraction becomes repulsion',
    from: 'G M_k (\\mathbf{q}_{\\star, k} - \\mathbf{q})}{\\max(10^{-6}', to: 'G M_k (\\mathbf{q} - \\mathbf{q}_{\\star, k})}{\\max(10^{-6}' },
  { id: 'C2', diff: 'hard', cat: 'logic-min-max', desc: '4D progress uses max(1.0, ...) instead of min: progress is always >= 1 after one session (instant graduation)',
    from: 'Progress}_{4\\text{D}}^{\\text{next}} = \\min(1.0', to: 'Progress}_{4\\text{D}}^{\\text{next}} = \\max(1.0' },
  { id: 'C3', diff: 'hard', cat: 'logic-inversion', desc: 'Mask law inverted (=== false): unmasked actors become anonymous, masked actors get the grudge',
    from: 'If `actorWoreMask === true`', to: 'If `actorWoreMask === false`' },
  { id: 'C4', diff: 'medium', cat: 'inequality-flip', desc: 'Zero-G stability gate passes when S_stab <= 0.50 (unstable craft pass, stable ones fail); planetary branch still uses >= 0.50',
    from: '\\frac{\\tau_{\\text{arm}}}{2 \\max(10^{-3}, r_{\\text{RCS}})}\\right) \\ge 0.50', to: '\\frac{\\tau_{\\text{arm}}}{2 \\max(10^{-3}, r_{\\text{RCS}})}\\right) \\le 0.50' },
  { id: 'C5', diff: 'hard', cat: 'drift', desc: 'Reputation update uses (S + 0.5): every day raises reputation, it can never fall (neutral point lost)',
    from: 'R_{\\text{prev}} + 0.3 \\cdot (S_{\\text{day}} - 0.5)', to: 'R_{\\text{prev}} + 0.3 \\cdot (S_{\\text{day}} + 0.5)' },
  { id: 'C6', diff: 'medium', cat: 'unit-crossref', desc: 'E_max set to 1,200 MPa (1.2 GPa) while the same section spans Diamond at 1050 GPa',
    from: 'E_{\\max} = 1,200\\text{ GPa}', to: 'E_{\\max} = 1,200\\text{ MPa}' },
  { id: 'C7', diff: 'hard', cat: 'broken-inverse', desc: 'Inverse density map divides by ln(rho_max) instead of ln(rho_max/rho_min): V_tx(rho(V)) != V, not a bijection',
    from: '/ \\rho_{\\min})}{\\ln(\\rho_{\\max} / \\rho_{\\min})}', to: '/ \\rho_{\\min})}{\\ln(\\rho_{\\max})}' },
  { id: 'C8', diff: 'hard', cat: 'precision', desc: 'Local offset stored as Float16Array: spacing at 512 m is 0.5 m, contradicting the sub-millimetre precision claim',
    from: '`Float32Array(3)` bounded in', to: '`Float16Array(3)` bounded in' },
  { id: 'C9', diff: 'medium', cat: 'table-numbering', desc: 'Archetype table lists #11 twice (Enchantress and Hanged Man); #12 is missing from the Body complex 8..14',
    from: '**#12 The Hanged Man**', to: '**#11 The Hanged Man**' },
  { id: 'C10', diff: 'medium', cat: 'arithmetic', desc: 'VSA-4096 stated as Uint32Array(64) = 2048 bits / 256 bytes, not 4096 bits / 512 bytes',
    from: '`Uint32Array(128)`**, 512 bytes', to: '`Uint32Array(64)`**, 512 bytes' },
];
for (const p of PLANTS) {
  const n = text.split(p.from).length - 1;
  if (n !== 1) throw new Error(`${p.id}: expected exactly 1 match, found ${n}`);
  text = text.replace(p.from, () => p.to);
}
fs.writeFileSync(out, text);
fs.writeFileSync(keyOut, JSON.stringify(PLANTS.map(({ from, to, ...rest }) => rest), null, 2));
console.log(`planted ${PLANTS.length} set-C defects -> ${out}`);
