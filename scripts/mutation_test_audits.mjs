#!/usr/bin/env node
/**
 * MUTATION TEST FOR THE AUDIT GATES (Check C27)
 *
 * "An audit that passes a known-bad plan is not an audit." Copies the triad into a temp dir,
 * plants one known defect at a time, and runs both gates. The semantic audit must fail every
 * mutant; the v9 suite's result is reported for comparison (it only catches edits inside the
 * CRC-protected shorthand block).
 *
 * Usage: node scripts/mutation_test_audits.mjs   (exit code 1 if the semantic audit misses a mutant)
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
  ['M8', 'Ledger heading drifts', PLAN, '117 DEFECTS LOGGED', '113 DEFECTS LOGGED'],
  ['M9', 'Sub-branch count drifts', PLAN, '+ 41 Sub-Branches', '+ 32 Sub-Branches'],
  ['M10', 'Package loses its home', PLAN, '| `@hm/strata` | `packages/genesis` (sub-module) |', '| strata (unplaced) | — |'],
];

function runGate(script, dir) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), dir], { encoding: 'utf8' });
  return r.status === 0;
}

let missed = 0;
const rows = [];
for (const [id, desc, file, from, to] of MUTANTS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `fidelity-${id}-`));
  for (const f of TRIAD) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  const target = path.join(dir, file);
  const text = fs.readFileSync(target, 'utf8');
  if (text.split(from).length !== 2) throw new Error(`${id}: anchor not found exactly once — update the mutant`);
  fs.writeFileSync(target, text.replace(from, () => to));
  const semanticPassed = runGate('triad_semantic_audit.mjs', dir);
  const v9Passed = runGate('adversarial_red_team_v9_audit.mjs', dir);
  if (semanticPassed) missed++;
  rows.push({ id, mutant: desc, semantic: semanticPassed ? 'MISSED' : 'caught', v9: v9Passed ? 'missed' : 'caught' });
  fs.rmSync(dir, { recursive: true, force: true });
}
console.table(rows);
console.log(missed ? `semantic audit missed ${missed} mutant(s)` : `semantic audit caught all ${MUTANTS.length} mutants`);
process.exitCode = missed ? 1 : 0;
