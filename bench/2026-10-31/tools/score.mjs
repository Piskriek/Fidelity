// Scores benchmark outputs against planted-defect keys. Keyword hits are CANDIDATES:
// each printed row must be eyeballed before it counts (see --show).
// Usage: node score.mjs <out_dir> [--show]
import fs from 'node:fs';
import path from 'node:path';

const [outDir, flag] = process.argv.slice(2);
const SET_A = {
  P1: /daySatisfaction|satisfaction.*(1\.1|exceed)|(weights?|coefficients?).*1\.10?\b/i,
  P2: /0\.95/,
  P3: /16 ?GB|VRAM.*(gap|boundary|exactly)/i,
  P4: /\+ ?\\?ln|x \+ ln|ln.*(negative|sign)|(negative|sign).*\bKL\b|KL.*(negative|sign)/i,
  P5: /2\^\{?n-1\}?|2\^\(n-1\)|(recovery|doubling) debt.*(unbound|uncap|no cap|cap)|uncapped.*debt|debt.*(unbound|uncap)/i,
  P6: /\bgrudge\b.*\bscore\b|\bscore\b.*\bgrudge\b|nemesisEntry/i,
  P7: /\|P_b\|.*(zero|guard|NaN|divi)|(zero|empty).*P_b|P_b.*(zero|empty)|breadcrumb.*(divi|zero pins|0\/0)/i,
  P8: /128 ?(\\times|x|×|\*) ?512|65,?536.*(≠|!=|not|but)|128.*512/i,
  P9: /(≥|>=|\\ge) ?\$?4|four zones|4 zones|syncope.*(3|4)/i,
};
const SET_B = {
  H1: /20 ?kJ|\bkJ\b/,
  H2: /32,?768/,
  H3: /12 zones|Capped at 12|\b12\b.*\b14\b|\b14\b.*\b12\b/i,
  H4: /gated on the Wave 5|Wave 3.*Wave 5|Wave 5.*Wave 3|circular|build.order|dependency.order/i,
  H5: /taste.*(1\.1|weights)|0\.40 ?\+ ?0\.35 ?\+ ?0\.35|(S_prop|S_\{?\\text\{prop).*0\.35/i,
  H6: /\^\{?1\/2\}?|inverse.square|1\/r\^?2|exponent.*(3\/2|1\/2)|(3\/2|1\/2).*exponent/i,
  H7: /DRIFTER/,
  H8: /safeG.*0\.05|0\.05.*(boundary|exactly|gap|unhandled)|g ?== ?0\.05/i,
  H9: /4 ms|bench_genesis|10,000 epochs/i,
};

const files = fs.readdirSync(outDir).filter(f => f.endsWith('.md') && f !== 'opus_reference.md');
const summary = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(outDir, f), 'utf8');
  const findingsPart = text.split(/^## (Pass log|Ladder|Self-report)/m)[0];
  const rows = findingsPart.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
  const key = f.startsWith('B_') ? SET_B : SET_A;
  const hits = {};
  for (const [id, re] of Object.entries(key)) {
    const matched = rows.filter(r => re.test(r));
    if (matched.length) hits[id] = matched.map(r => r.slice(0, 220));
  }
  const sev = s => rows.filter(r => new RegExp(`\\|\\s*${s}\\s*\\|`).test(r)).length;
  summary.push({ file: f, findings: rows.length, H: sev('H'), M: sev('M'), L: sev('L'), plantsCandidate: Object.keys(hits).length, of: Object.keys(key).length, ids: Object.keys(hits).join(' ') });
  if (flag === '--show') {
    console.log(`\n===== ${f} =====`);
    for (const [id, ms] of Object.entries(hits)) for (const m of ms) console.log(`${id}: ${m}`);
  }
}
console.table(summary);
