// In-sample check: the audit alone on every integer ×2 mutant in Plan Parts 1–7 (the generator's operator),
// split by whether the other gates already caught it (spine/MUTANTS_all_sites.md survivors).
// Usage: node eval_counts_plan.mjs <audit.mjs> <repoDir>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const [audit, repo] = process.argv.slice(2);
const FILES = ['SQ_DISTORTION_CHECK_V9_SKILL.md', 'FIDELITY_COMPLETE_BRS_V2.md', 'ARGON_OPUS_MASTER_RESUME_V2.md'];
const plan = fs.readFileSync(path.join(repo, FILES[1]), 'utf8');
const start = plan.indexOf('# PART 1:'), end = plan.indexOf('# PART 8:');
const blocked = [...plan.matchAll(/```[\s\S]*?```/g)].map(m => [m.index, m.index + m[0].length]);
const inRegion = i => i >= start && i < end && !blocked.some(([a, b]) => i >= a && i < b);
const surv = fs.readFileSync(path.join(repo, 'spine/MUTANTS_all_sites.md'), 'utf8');
const survivorCtx = [...surv.matchAll(/^\| integer ×2 \| `(\d+)` → `\d+` \| (\w+) \| …(.*)… \|$/gm)].map(m => ({ n: m[1], tier: m[2], ctx: m[3].replace(/\\\|/g, '|') }));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'counts-plan-'));
for (const f of FILES) fs.copyFileSync(path.join(repo, f), path.join(dir, f));
// A catch is a finding the unmutated triad does not already have (positions stripped, since edits shift them).
const msgs = () => new Set(spawnSync(process.execPath, [path.resolve(audit), dir], { encoding: 'utf8' }).stdout.split('\n').filter(l => l.startsWith('FAIL')).map(l => l.replace(/@\d+/, '')));
const base = msgs();
console.log('baseline findings: ' + base.size);
let n = 0, caught = 0, survN = 0, survCaught = 0;
const caughtSurvivors = [];
for (const m of plan.matchAll(/(?<![\w.,^{-])(\d{2,6})(?![\d.,}%\w-])/g)) {
  if (!inRegion(m.index)) continue;
  n++;
  fs.writeFileSync(path.join(dir, FILES[1]), plan.slice(0, m.index) + String(+m[1] * 2) + plan.slice(m.index + m[1].length));
  const fresh = [...msgs()].filter(x => !base.has(x));
  const hit = fresh.length > 0;
  caught += hit;
  if (hit) console.log(`  caught ${m[1]}→${+m[1] * 2}: ${fresh[0].slice(0, 130)}`);
  const ctx = plan.slice(Math.max(0, m.index - 50), m.index + m[1].length + 50).replace(/\n/g, ' ');
  const s = survivorCtx.find(x => x.n === m[1] && x.ctx === ctx);
  if (s) { survN++; survCaught += hit; if (hit) caughtSurvivors.push(`${s.tier}: …${ctx.slice(30, 90)}…`); }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log(`integer ×2 mutants in Plan Parts 1–7: ${n}; audit catches ${caught}`);
console.log(`of the ${survN} that survived every other gate: audit catches ${survCaught}`);
for (const c of caughtSurvivors) console.log('   ', c);
