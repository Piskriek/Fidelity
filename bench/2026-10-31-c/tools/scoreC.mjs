// Scores set-C outputs. Keyword hits are CANDIDATES; confirm each by reading the row (--show).
// Usage: node scoreC.mjs <out_dir> [--show]
import fs from 'node:fs';
import path from 'node:path';

const [dir, flag] = process.argv.slice(2);
const KEY = {
  C1: /repuls|(q|\\mathbf\{q\}) - (q_|\\mathbf\{q\}_)\{?\\?star|sign[^|]*(gravit|g_\{?net|numerator)|(gravit|g_\{?net)[^|]*sign|away from the star/i,
  C2: /max\(1\.0|\\max\(1\.0|instant(ly)? graduat|always[^|]*(>=|≥|at least) ?1|progress[^|]*max/i,
  C3: /actorWoreMask|mask(ed)? (law|anonym)|unmasked/i,
  C4: /\\le 0\.50|≤ ?0\.50|<= ?0\.50|unstable[^|]*pass|S_\{?\\?text\{stab\}?\}?[^|]*(≤|<=|\\le)/i,
  C5: /S_\{?\\?text\{day\}?\}? ?\+ ?0\.5|\(S ?\+ ?0\.5\)|reputation[^|]*(never|only|always|monoton|drift|increase)/i,
  C6: /MPa/,
  C7: /(inverse|bijecti|round.?trip)[^|]*(rho|ρ|density|V_\{?tx|ln)|ln\(\\?rho_\{?\\?max\}?\)\}|ln\(ρ_max\)/i,
  C8: /Float16|float16|half.precision/i,
  C9: /#11[^|]*(twice|duplicate|Hanged)|Hanged Man[^|]*#11|#12[^|]*missing|missing[^|]*#12/i,
  C10: /Uint32Array\(64\)|2,?048 bits|256 bytes/i,
};
const files = fs.readdirSync(dir).filter(f => f.startsWith('C_') && f.endsWith('.md') && !f.includes('cards') && !f.includes('regrow'));
const table = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const body = text.split(/^## (Pass log|Self-report|Ladder)/m)[0];
  const rows = body.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
  const hit = {};
  for (const [id, re] of Object.entries(KEY)) {
    const m = rows.filter(r => re.test(r));
    if (m.length) hit[id] = m;
  }
  table.push({ file: f, findings: rows.length, candidates: Object.keys(hit).length, ids: Object.keys(hit).join(' ') });
  if (flag === '--show') {
    console.log(`\n===== ${f}`);
    for (const [id, ms] of Object.entries(hit)) for (const m of ms) console.log(`${id}: ${m.slice(0, 230)}`);
  }
}
console.table(table);
