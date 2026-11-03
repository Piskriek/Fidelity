// Pass R27 patch for SQ_DISTORTION_CHECK_V9_SKILL.md -> v9.2 (C32 Fractal Gap Map, re-audit-your-diff rule).
// Usage: node patch_skill_r27.mjs <SKILL.md> <lastDefectNumber>
import fs from 'node:fs';
const [file, lastB] = process.argv.slice(2);
if (!/^\d+$/.test(lastB ?? '')) throw new Error('pass the last defect number, e.g. 140');
let s = fs.readFileSync(file, 'utf8');
function edit(oldStr, newStr) {
  const n = s.split(oldStr).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = s.replace(oldStr, () => newStr);
}

edit('description: Always-on reasoning framework (v9.1 — Document-Audit Mode, SQ-JEPA Ripple Check,', 'description: Always-on reasoning framework (v9.2 — Document-Audit Mode, Fractal Gap Map, SQ-JEPA Ripple Check,');
edit('Cross-Universe Symbiotic Bridge & 31-Point Lyapunov Edition).', 'Cross-Universe Symbiotic Bridge & 32-Point Lyapunov Edition).');
edit('and 31-Point Recursive Verification Matrix (Checks C1-C31).', 'and 32-Point Recursive Verification Matrix (Checks C1-C32).');
edit('Symbiotic Cosmogenesis Framework (v9.1)', 'Symbiotic Cosmogenesis Framework (v9.2)');
edit('### 1.5 KL-Regularized Predictive Loss (`Defect B44 Fix` / `LeJEPA` Anti-Collapse Regularizer)', '### 1.5 KL-Regularized Predictive Loss (`Defect B44 Fix` — KL anti-collapse regularizer; LeJEPA itself uses SIGReg, `B141`)');
edit("12. **Evidence**: every \"verified / benchmarked / 0 defects\" claim points to something in the repo that reproduces it; otherwise mark it UNSUPPORTED.",
  "12. **Evidence**: every \"verified / benchmarked / 0 defects\" claim points to something in the repo that reproduces it; otherwise mark it UNSUPPORTED.\n" +
  "13. **Gap map (whole-plan completeness, C32)**: run `node scripts/fractal_gap_map.mjs`. Every empty cell is a candidate missing link: fill it, propose a fill, or ask the owner whether it is deliberate.");
edit("One reader rereading the same text is saturation, not convergence.",
  "One reader rereading the same text is saturation, not convergence. **Re-audit your own diff:** the pass that fixes defects also introduces them (Pass R27 found nine errors in Pass R26's own fixes, including a guard that let an empty craft score full symmetry). Before closing a pass, have a fresh reader audit only the changed lines.");
edit('re-execute all 31 checks (`Checks C1–C31`;', 're-execute all 32 checks (`Checks C1–C32`;');
// Counts live only in the Plan and Resume (verified by triad_semantic_audit S1), so the Skill never needs a per-pass count edit.
edit('All logged defects (`#01–#117`) encoded in `Checks C1–C31`', `All logged defects (the Plan's Part 8 ledger, \`#01–#${lastB}\` as of Pass R27) encoded in \`Checks C1–C32\``);
edit('declare the exact same ledger (`117 Defects Logged`, `#01–#117`, same Closed/Open split), and reference `Checks C1–C31`', 'declare the exact same ledger (same "N Defects Logged" total, same `#01–#N` range, same Closed/Open split), and reference `Checks C1–C32`');

s = s.replace(/\n*$/, '\n') + [
  '- **Lens J — Fractal Point-Cloud Completeness (**`Pass R27 — v9.2`**)**:',
  '  - `C32 [R27-Fractal-Gap-Map]`: Keep `spine/fidelity_point_cloud.json` as the reduced point cloud of the plan: every operator and stateful quantity, each grounded in the plan text. `scripts/fractal_gap_map.mjs` places them on the framework\'s own axes (4 Folds inside, C11; 4 Neighbours around, C12; Lateral Duals, C20; seams into the cartridge, C22; homes and build order, C8; units, C31) and lists the empty cells. Every hole ends as **filled**, **proposed** (Plan §8.2) or **confirmed deliberate by the owner** (Plan §8.3). `--strict` fails when the cloud no longer matches the plan (`B126–B136`).',
  '',
].join('\n');

s = s.replaceAll('C1–C31', 'C1–C32').replaceAll('C1-C31', 'C1-C32').replaceAll('C23–C31', 'C23–C32').replaceAll('31-Point', '32-Point');
fs.writeFileSync(file, s);
console.log('skill patched to v9.2');
