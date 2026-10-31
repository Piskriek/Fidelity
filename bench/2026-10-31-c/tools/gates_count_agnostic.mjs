// Makes the v9 token gate and the mutation test independent of the current defect count and
// check range (the semantic audit verifies the numbers). Usage: node gates_count_agnostic.mjs <repo>
import fs from 'node:fs';
import path from 'node:path';
const repo = process.argv[2];

function patch(rel, pairs) {
  const f = path.join(repo, rel);
  let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of pairs) {
    if (s.split(a).length !== 2) throw new Error(`${rel}: no unique match for ${a.slice(0, 70)}`);
    s = s.replace(a, () => b);
  }
  fs.writeFileSync(f, s);
  console.log(`patched ${rel}`);
}

patch('scripts/adversarial_red_team_v9_audit.mjs', [
  ['  for (let c = 1; c <= 31; c++) {', '  // Check range is read from the skill itself ("Checks C1–C<n>"), so new checks need no edit here.\n  const maxCheck = Math.max(26, ...[...skillText.matchAll(/Checks C1[–-]C(\\d+)/g)].map(m => +m[1]));\n  for (let c = 1; c <= maxCheck; c++) {'],
  ["'#1 The Magician', '#22 The Fool', '117 Defects Logged', 'B74', 'B117', 'Checks C1–C31',", "'#1 The Magician', '#22 The Fool', 'Defects Logged', 'B74', 'Checks C1–C',"],
  ["    '117 Defects Logged',\n    'Checks C1–C31',\n    'B117',", "    'Defects Logged',\n    'Checks C1–C',"],
]);

patch('scripts/mutation_test_audits.mjs', [
  ["  ['M8', 'Ledger heading drifts', PLAN, '117 DEFECTS LOGGED', '113 DEFECTS LOGGED'],", "  ['M8', 'Ledger heading drifts', PLAN, ...(() => { const n = +fs.readFileSync(path.join(ROOT, PLAN), 'utf8').match(/(\\d+) DEFECTS LOGGED/)[1]; return [`${n} DEFECTS LOGGED`, `${n - 4} DEFECTS LOGGED`]; })()],"],
]);
