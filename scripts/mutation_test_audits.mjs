#!/usr/bin/env node
/**
 * MUTATION TEST FOR THE AUDIT GATES (Check C27)
 *
 * "An audit that passes a known-bad plan is not an audit." Copies the triad into a temp dir,
 * plants one known defect at a time, and runs every gate (semantic audit, gap map --strict, v9 suite).
 * At least one gate must fail on every mutant. The per-gate columns show which gate guards what:
 * the v9 suite only catches edits inside the CRC-protected shorthand block.
 *
 * Usage: node scripts/mutation_test_audits.mjs   (exit code 1 if every gate passes a mutant)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRIAD = ['SQ_DISTORTION_CHECK_V9_SKILL.md', 'FIDELITY_COMPLETE_BRS_V2.md', 'ARGON_OPUS_MASTER_RESUME_V2.md'];
const PLAN = 'FIDELITY_COMPLETE_BRS_V2.md';

// Each mutant: [id, description, file, from, to]. `from` must occur exactly once.
const MUTANTS = [
  ['M1', 'VRAM tier gap at exactly 16 GB', PLAN, '`>=16GB -> Tier 3`', '`>16GB -> Tier 3`'],
  ['M2', 'Wrong factorisation 128 x 512', PLAN, '256 \\times 512\\text{ m}$ (spans', '128 \\times 512\\text{ m}$ (spans'],
  ['M3', 'Syncope threshold drifts from the Skill', PLAN, 'When $\\ge 3$ zones hit', 'When $\\ge 4$ zones hit'],
  ['M4', 'Recovery debt exponent uncapped', PLAN, '$2^{\\min(6, n-1)}$', '$2^{n-1}$'],
  ['M5', 'KL term sign flipped', PLAN, '- \\ln\\frac{\\Pi_i}{\\Pi_{0,i}} - 1\\right) \\ge 0$$\n### 1.2', '+ \\ln\\frac{\\Pi_i}{\\Pi_{0,i}} - 1\\right) \\ge 0$$\n### 1.2'],
  ['M6', 'daySatisfaction weights sum to 1.10', PLAN, '0.20 \\cdot \\text{exit}_{01}', '0.30 \\cdot \\text{exit}_{01}'],
  ['M7', 'nem example exceeds resist cap', PLAN, 'resist=elem:plasma-arc:0.35', 'resist=elem:plasma-arc:0.95'],
  ['M8', 'Ledger heading drifts', PLAN, ...(() => { const n = +fs.readFileSync(path.join(ROOT, PLAN), 'utf8').match(/(\d+) DEFECTS LOGGED/)[1]; return [`${n} DEFECTS LOGGED`, `${n - 4} DEFECTS LOGGED`]; })()],
  ['M9', 'Sub-branch count drifts', PLAN, '+ 41 Sub-Branches', '+ 32 Sub-Branches'],
  ['M10', 'Package loses its home', PLAN, '| `@hm/strata` | `packages/genesis` (sub-module) |', '| strata (unplaced) | — |'],
  ['M11', 'Operator renamed everywhere in the plan (spine not updated)', PLAN, 'stepLodPopulationTick', 'stepLodTick', 'all'],
];

// A mutant is caught when at least one of the project's gates fails on it.
const GATES = [
  ['semantic', ['triad_semantic_audit.mjs']],
  ['gapmap', ['fractal_gap_map.mjs', '--strict']],
  ['v9', ['adversarial_red_team_v9_audit.mjs']],
];
function gatePasses([script, ...flags], dir) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), dir, ...flags], { encoding: 'utf8' });
  return r.status === 0;
}

let missed = 0;
const rows = [];
for (const [id, desc, file, from, to, scope] of MUTANTS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `fidelity-${id}-`));
  for (const f of TRIAD) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  const target = path.join(dir, file);
  const text = fs.readFileSync(target, 'utf8');
  const hits = text.split(from).length - 1;
  if (scope === 'all' ? hits < 1 : hits !== 1) throw new Error(`${id}: anchor not found ${scope === 'all' ? 'at all' : 'exactly once'} — update the mutant`);
  fs.writeFileSync(target, scope === 'all' ? text.split(from).join(to) : text.replace(from, () => to));
  const row = { id, mutant: desc };
  let caught = false;
  for (const [name, cmd] of GATES) {
    const passed = gatePasses(cmd, dir);
    row[name] = passed ? '-' : 'caught';
    caught ||= !passed;
  }
  if (!caught) missed++;
  rows.push({ ...row, result: caught ? 'caught' : 'MISSED' });
  fs.rmSync(dir, { recursive: true, force: true });
}
console.table(rows);
console.log(missed ? `gates missed ${missed} of ${MUTANTS.length} mutants` : `gates caught all ${MUTANTS.length} mutants`);
process.exitCode = missed ? 1 : 0;
