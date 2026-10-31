// Pass R26 patch for ARGON_OPUS_MASTER_RESUME_V2.md (recomputes the shorthand CRC-32 tail).
// Usage: node patch_resume_r26.mjs <ARGON_OPUS_MASTER_RESUME_V2.md>
import fs from 'node:fs';
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');

function edit(oldStr, newStr, { all = false } = {}) {
  const n = s.split(oldStr).length - 1;
  if (all ? n < 1 : n !== 1) throw new Error(`expected ${all ? '>=1' : '1'} match, found ${n}: ${oldStr.slice(0, 90)}`);
  s = all ? s.split(oldStr).join(newStr) : s.replace(oldStr, () => newStr);
}
function crc32Hex(text) {
  let crc = 0xFFFFFFFF;
  for (const b of Buffer.from(text, 'utf8')) { crc ^= b; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0); }
  return '0x' + ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

// --- Header ---
edit('**Checkpoint Timestamp:** `2026-10-30T22:45:00+02:00` (Mossel Bay, Western Cape, ZA)', '**Checkpoint Timestamp:** `2026-10-31T06:30:00+02:00` (Mossel Bay, Western Cape, ZA; Pass R26 by Claude Opus 5.5 — previous checkpoint `2026-10-30T22:45:00+02:00` by Argon)');
edit('**Active Skill Version:** `sq-distortion-check` **v9** (`Checks C1–C26` — _', '**Active Skill Version:** `sq-distortion-check` **v9.1** (`Checks C1–C31` + Document-Audit Mode — _');
edit('**Convergence Status:** **74 / 74 Historical & Red-Team Defects (**`#01–#74`** across Passes R1–R24) Resolved $\\to$ Pass R25 Fresh 3-Artifact Triad, **`SQ-JEPA`** Rollout & 2,704-Vector Adversarial Audit = **`0`** Defects (**`\\Delta\\text{Bugs} = 0, \\Delta L_{\\text{meta}} = 0`**)**',
  '**Convergence Status:** **117 Defects Logged (`#01–#117`, Passes R1–R26): 99 Closed / 18 Open.** Pass R26 (Claude Opus 5.5 independent audit + 9-arm Sonnet/Haiku benchmark) re-opened the R25 zero-yield claim. Canonical copies now live in the GitHub repo; Drive copies are lossy (`B99`).');

// --- §1 table + protocol ---
edit('(`Checks C1–C26` + `SQ-JEPA` Latent Rollout). Whenever updated', '(`Checks C1–C31` + Document-Audit Mode + `SQ-JEPA` Ripple Check). Whenever updated');
edit('| `v9`** (**`Checks C1–C26`**, **`#01–#74`** Encoded)** |', '| `v9.1` (`Checks C1–C31`, `#01–#117` encoded) |');
edit('and 6-Wave Build Queue. | `BRS V2`** (**`9/9`** Parts Complete, **`0`** Defects)** |', 'and 7-Wave Build Queue. | `BRS V2` (9/9 Parts; 18 open design items in Part 8.1) |');
edit('Cumulative `74/74` Defect Ledger, and 2:00 AM Execution Queue. | `Resume V2`** (**`hm:universe:v2`**, **`74/74`** Synced)** |', 'Cumulative 117-Defect Ledger, and Execution Queue. | `Resume V2` (`hm:universe:v2`, 117-defect ledger synced) |');
edit('encode it as a new check (`C26+`) in **The Skill** first.', 'encode it as a new check (`C32+`) in **The Skill** first.');
edit('- **Lockstep Triad Sync (**`Checks C23–C26`**)**: Fix every surfaced defect, recompute any `@hm/shorthand` CRC32 tails, increment the cumulative ledger count identically across **all 3 files**, and re-run `node adversarial_red_team_v9_audit.mjs` fresh until **$\\Delta\\text{Bugs} = 0$** AND **$\\Delta L_{\\text{meta}} \\le 0$** before saving to Drive/GitHub.',
  '- **Lockstep Triad Sync (**`Checks C23–C31`**)**: Fix every surfaced defect, recompute any `@hm/shorthand` CRC-32 tails, update the ledger identically across **all 3 files**, and run `node scripts/triad_semantic_audit.mjs` and `node scripts/adversarial_red_team_v9_audit.mjs` (both must pass) before committing to GitHub. Convergence is defined in the Skill\'s Document-Audit Mode (two consecutive passes with different lenses add 0 High/Medium defects).');

// --- §2 wake-up prompt ---
edit('1. Read the 3 Canonical Handoff Artifacts (+ Verification Suite) from Google Drive / Repo Root:', '1. Read the 3 Canonical Handoff Artifacts (+ Verification Suite) from the GitHub repo root (Drive copies are lossy):');
edit('(Checks C1-C26 + SQ-JEPA Latent Rollout)', '(Checks C1-C31 + Document-Audit Mode)');
edit('(Master Checkpoint, Shorthand Memory & 74/74 Ledger)', '(Master Checkpoint, Shorthand Memory & 117-Defect Ledger)');
edit('(Passes R15-R25 Automated Verification)', '(Passes R15-R25 operator fuzz) + `scripts/triad_semantic_audit.mjs` (S1-S14 semantic gates)');
edit('3. Enforce the 3-Artifact Recursive Loop (Checks C23-C26):', '3. Enforce the 3-Artifact Recursive Loop (Checks C23-C31):');
edit('run `node adversarial_red_team_v9_audit.mjs` against The Skill, The Plan, and The Resume until Yield == 0 (DeltaBugs == 0 && DeltaL_meta == 0).', 'run `node scripts/triad_semantic_audit.mjs` and `node scripts/adversarial_red_team_v9_audit.mjs` (both must pass), then audit with the Skill until two consecutive passes add 0 High/Medium defects, listing unexecuted checks.');

// --- §3 shorthand record: add the R26 episode and recompute the tail ---
edit('m of=preset:agent-argon-overwatch hard=0.05 bal=1.00 ch=0,0,0,0,0,0,0 inv=0.99 cyc=25', 'm of=preset:agent-argon-overwatch hard=0.05 bal=1.00 ch=0,0,0,0,0,0,0 inv=0.99 cyc=26');
edit('src=rule:check-c26-cross-tier-distillation\n', 'src=rule:check-c26-cross-tier-distillation\nme t=26 st=S5 cat=independent-audit-and-measured-benchmark ex=0.95 err=0.35 h=0.80 d=solar-pride by=throat-integrity src=rule:measure-dont-model-b95-b98\n');
edit('mc by=heart-humility d=solar-pride n=25 open=0', 'mc by=heart-humility d=solar-pride n=26 open=1');
const block = s.match(/```\r?\n(m of=preset:agent-argon-overwatch[\s\S]*?)\r?\n#TAIL\|schema:hm:universe:v2\|crc32:(0x[0-9A-F]{8})\r?\n```/);
if (!block) throw new Error('shorthand block not found');
const newCrc = crc32Hex(block[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n'));
edit(`#TAIL|schema:hm:universe:v2|crc32:${block[2]}`, `#TAIL|schema:hm:universe:v2|crc32:${newCrc}`);
edit(`(\`@hm/shorthand\` v2 Format — Verified CRC32 \`${block[2]}\`)`, `(\`@hm/shorthand\` v2 Format — CRC-32 \`${newCrc}\`, recomputed in Pass R26)`);

// --- §4 ledger ---
edit('## 4. Complete Cumulative Defect Ledger Summary (`Passes R1 -> R25`: `74 / 74` Closed, `0` Remaining)', '## 4. Complete Cumulative Defect Ledger Summary (`Passes R1 -> R26`: 117 Logged, 99 Closed, 18 Open)');
edit('  - `B74 (`**C26**`)`: Built `v2EvaluateCrossTierModelDistillation` (`@hm/sq-jepa`) and added **Wave 7 / §6** instructing Claude Opus to test **Claude Sonnet 4.6** and **Claude Haiku 4.5** on the same fresh plan with the skill after he finishes his own pass.',
  '  - `B74 (`**C26**`)`: Built `v2EvaluateCrossTierModelDistillation` (`@hm/sq-jepa`) and added **Wave 7 / §6** instructing Claude Opus to test **Claude Sonnet 4.6** and **Claude Haiku 4.5** on the same fresh plan with the skill after he finishes his own pass. *(R26: the operator returns hardcoded profiles; the real benchmark is in `bench/2026-10-31/`, see `B95`.)*\n' +
  '- **Pass R26 Independent Audit + 9-Arm Cross-Tier Benchmark (Claude Opus 5.5, 2026-10-31; `B75–B117` — 43 Defects: 25 Fixed, 18 Open)**. Full register in Plan §8.1. Highlights:\n' +
  '  - `B97`/`B98` (**C27/C28**): the v9 suite only ran inside Argon\'s sandbox, and its document checks passed a plan with 6 planted content errors. Fixed: portable paths + `scripts/triad_semantic_audit.mjs` (S1–S14).\n' +
  '  - `B95`/`B96` (**C29**): Wave 7 numbers were modeled, not measured, and SQ-JEPA is a hand-coded loop. Fixed: measured benchmark + implementation note.\n' +
  '  - `B99` (**C30**): Drive copies drop LaTeX `_`, frontmatter and code fences. Fixed: canonical `.md` in GitHub.\n' +
  '  - `B75–B94`: ledger 70≠74, 32≠41 sub-branches, stale light-year span, 16 homeless packages, self-failing CI gate, PH Δt, phase/pressure units, zero-denominator guards, tier and `runaway` definitions, seam mapping, wave order, wording.\n' +
  '  - **Open, needs a decision:** `B100` PH integrator form · `B101` nemesis tier saturation · `B102` 4 KB budget · `B103` top-4-ex retention · `B104` child-seed collisions · `B105` coherent starlight · `B106` safeG discontinuity · `B107` rest-cycle energy source · `B108` thrust bound + A4 cycles · `B109` V_Lyapunov · `B110` provenance · `B111` origin64 canonical form · `B112` genome variance · `B113` STM capacity · `B114` unclamped boosts · `B115` undefined symbols · `B116` 20 pillars · `B117` `leaks` token.');

// --- §5 execution checklist ---
edit('Run `node adversarial_red_team_v9_audit.mjs` to confirm `Pass R25` `twoZeroConvergenceAchieved: true` (`74/74` defects closed across `Skill`, `Plan`, and `Resume`).',
  'Run `node scripts/triad_semantic_audit.mjs` (14/14) and `node scripts/adversarial_red_team_v9_audit.mjs` (`twoZeroConvergenceAchieved: true`). Then decide or explicitly defer the 18 OPEN items in Plan §8.1; `B100` (PH integrator form) and `B102` (4 KB budget) block Wave 2.');
edit('Implement `@hm/kernel` (`v2PredictiveLossKL`), `@hm/sq-jepa` (`stepSqJepaLatentRollout`), `@hm/shorthand`', 'Implement `@hm/kernel` (`v2PredictiveLossKL`), `@hm/shorthand`');
edit('`@hm/class-forge`, and `@hm/rules-litrpg`.', '`@hm/class-forge`, and `@hm/rules-litrpg`, then `@hm/sq-jepa` (`stepSqJepaLatentRollout`) last, because it calls the rest-cycle and nemesis operators (`B89`).');
edit('then run `sq-distortion-check` v9 (`Checks C1–C26`) across the built repo', 'then run both audit scripts and `sq-distortion-check` v9.1 (`Checks C1–C31`) across the built repo');
const W7 = s.indexOf('- **Wave 7 (**`Post-Opus Cross-Tier');
if (W7 < 0) throw new Error('Wave 7 block not found');
s = s.slice(0, W7) + [
  '- **Wave 7 (Cross-Tier Skill Benchmark — first run done 2026-10-31, Pass R26)**:',
  '  - Ran 9 arms (Sonnet and Haiku × no skill / SQ skill v9 / Reduce skill) on a plan copy with 9 planted defects, plus a hold-out copy with 9 different plants. Every arm caught all 8 plants detectable from the plan alone (hold-out 8/9; Reduce 9/9). The SQ skill added only the plant that contradicts its own text, and cost +12–33% tokens. Argon\'s modeled profile (Haiku 34% → 91.5%, 97% fewer tokens) did not hold: unassisted Haiku scored 89–100%.',
  '  - Data, scripts and per-arm outputs: `bench/2026-10-31/`. Next: harder multi-seed plants, ≥ 3 runs per arm, and the two-agent blind Reduce protocol (`skills/reduce/SKILL.md`).',
  '',
].join('\n');

s = s.replaceAll('Checks C1–C26', 'Checks C1–C31');
fs.writeFileSync(file, s.endsWith('\n') ? s : s + '\n');
console.log(`resume patched for Pass R26 (shorthand CRC-32 ${block[2]} -> ${newCrc})`);
