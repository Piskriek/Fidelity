// Records the exact Plan sites of the set-C plants (bench/2026-10-31-c/) that a mutant_generator.mjs
// operator reproduces, in the same {op, ctx} form as tuning_sites_seed42.json, so the generator can
// count those mutants as "shown". C7 (inverse denominator) and C9 (#12 → #11) have no matching
// operator; their formulas are covered by --shown-specs instead.
// Usage: node plant_sites.mjs <plan.md> <out.json>
import fs from 'node:fs';
const [planPath, out] = process.argv.slice(2);
const plan = fs.readFileSync(planPath, 'utf8');
// [plant, operator, regex whose last capture group starts at the operator's site]
const PLANTS = [
  ['C1', 'swap a−b', /\\frac\{G M_k (\()\\mathbf\{q\}_\{\\star, k\} - \\mathbf\{q\}\)/],
  ['C2', 'min↔max', /\\text\{Progress\}_\{4\\text\{D\}\}\^\{\\text\{next\}\} = (\\min)\(1\.0, /],
  ['C3', 'true↔false', /actorWoreMask (=== true`)/],
  ['C4', '≥↔≤', /r_\{\\text\{RCS\}\}\)\}\\right\) (\\ge) 0\.50/],
  ['C5', '−↔+', /\(S_\{\\text\{day\}\}( )- 0\.5\)/],
  ['C6', 'unit swap', /E_\{\\max\} = [\d,]+\\text\{ (GPa)\}/],
  ['C8', 'type swap', /Local \$\\mathbf\{x\}_\{\\text\{localSelf\}\}\$\*\*: `(Float32)Array\(3\)`/],
  ['C10', 'type swap', /VSA-4096 \(\*\*`(Uint32Array\(128\))`/],
];
const sites = PLANTS.map(([id, op, re]) => {
  const m = plan.match(re);
  if (!m) throw new Error(`${id}: site not found`);
  const at = m.index + m[0].indexOf(m[1]);
  return { plant: id, op, ctx: plan.slice(Math.max(0, at - 40), at + 40) };
});
fs.writeFileSync(out, JSON.stringify(sites, null, 1));
console.log(`${sites.length} plant sites written`);
