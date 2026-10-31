// Which pre-existing (natural, unplanted) defects did each arm report? Keyword candidates only;
// rows are printed with --show for manual confirmation.
// Usage: node natural_coverage.mjs <out_dir> [--show]
import fs from 'node:fs';
import path from 'node:path';

const [outDir, flag] = process.argv.slice(2);
const NATURAL = {
  'N1 ledger 70 vs 74': /\b70\b[^|]*\b74\b|\b74\b[^|]*\b70\b/,
  'N3 32 vs 41 sub-branches': /sub-branch/i,
  'N4 span 9.75e7 ly': /9\.75|light-year/i,
  'N5 packages missing from tree': /(strata|somatic|archetypes|smc-nexus|open-host-sdk|gauntlet|governor|studio-core|anim-taste)[^|]*(tree|missing|absent|not (in|listed))|(tree|layout)[^|]*(missing|lacks|omits)/i,
  'N6 CI gate hits own docs': /verify-clean-slate|banned token|forbidden token|moon_crater/i,
  'N7 Gu lacks dt / Cayley': /G ?u|u_\{?\\?text\{policy|Cayley|resolvent/i,
  'N8 omega*distance / coherence': /ω_?k|\\omega_k|omega_k|wavenumber|incoherent/i,
  'N9 p_atm unit': /p_\{?\\?text\{atm|p_atm|pressure unit|0\.08 ?\\?cdot ?P_\{?xd/i,
  'N10 S_sym / h_CoM div0': /m_L ?\+ ?m_R|S_\{?\\?text\{sym|S_sym|h_\{?\\?text\{CoM|h_CoM|r_\{?\\?text\{RCS|r_RCS|r_support/i,
  'N11 safeG discontinuity': /discontinu/i,
  'N12 nemesis tier thresholds': /threshold[^|]*tier|tier[^|]*threshold|score.to.tier|score→tier/i,
  'N13 kappa vs Joules strain': /κ|kappa/i,
  'N14 me top-4 ex retention': /top.?4|top 4/i,
  'N18 child seed collision': /child.universe seed|seed[^|]*collision|0x4D4E4557|Vtx[^|]*Aq[^|]*(ignored|unused)/i,
  'N20 JEPA overclaim': /JEPA[^|]*(encoder|predictor|learned|trained|overclaim|metaphor)|no (trained|learned) /i,
  'N23 unverifiable provenance': /3,848|sq_full_universe|verify_pass9|verify_pass11|6519c461/i,
  'N24 garbled LaTeX': /garbled|malformed|missing subscript|underscore|subscript/i,
  'X1 4KB budget exceeded': /4 ?KB|4096|4,096/i,
  'X2 wave order (sq-jepa before deps)': /Wave 2[^|]*(Wave 4|depend)|depend[^|]*Wave/i,
  'X3 ray 7 unclassified': /ray 7|Ray 7|7 rays?[^|]*(neither|uncovered)/i,
};

const files = fs.readdirSync(outDir).filter(f => f.endsWith('.md') && !f.startsWith('B_') && f !== 'opus_reference.md');
const table = {};
for (const f of files) {
  const text = fs.readFileSync(path.join(outDir, f), 'utf8').split(/^## (Pass log|Ladder|Self-report)/m)[0];
  const rows = text.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
  const col = {};
  if (flag === '--show') console.log(`\n===== ${f}`);
  for (const [id, re] of Object.entries(NATURAL)) {
    const hits = rows.filter(r => re.test(r));
    col[id] = hits.length ? hits.map(r => r.match(/^\|\s*(\d+)/)[1]).join(',') : '';
    if (flag === '--show') for (const h of hits) console.log(`${id.split(' ')[0]}: ${h.slice(0, 200)}`);
  }
  table[f.replace('.md', '')] = col;
}
console.table(table);
