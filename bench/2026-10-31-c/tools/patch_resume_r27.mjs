// Pass R27 patch for ARGON_OPUS_MASTER_RESUME_V2.md (recomputes the shorthand CRC-32 tail).
// Usage: node patch_resume_r27.mjs <RESUME.md> <logged> <closed> <open> <timestamp>
import fs from 'node:fs';
const [file, logged, closed, open, ts] = process.argv.slice(2);
if (+closed + +open !== +logged) throw new Error('closed + open must equal logged');
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

edit('`2026-10-31T06:30:00+02:00` (Mossel Bay, Western Cape, ZA; Pass R26 by Claude Opus 5.5 — previous checkpoint `2026-10-30T22:45:00+02:00` by Argon)', `\`${ts}\` (Mossel Bay, Western Cape, ZA; Pass R27 by Claude Opus 5.5 — R26 \`2026-10-31T06:30:00+02:00\`, R25 \`2026-10-30T22:45:00+02:00\` by Argon)`);
edit('**v9.1** (`Checks C1–C31` + Document-Audit Mode — _', '**v9.2** (`Checks C1–C32` + Document-Audit Mode + Fractal Gap Map — _');
// [^*\n]*: stop at the end of the status line. The first version used [^*]* and swallowed the
// "## 1." heading below it (caught by the R27 diff review, item 1, and repaired by patch_r27_review.mjs).
const statusRe = /\*\*Convergence Status:\*\* \*\*117 Defects Logged \(`#01–#117`, Passes R1–R26\): 99 Closed \/ 18 Open\.\*\*[^*\n]*/;
if (!statusRe.test(s)) throw new Error('status line not found');
s = s.replace(statusRe, () => `**Convergence Status:** **${logged} Defects Logged (\`#01–#${logged}\`, Passes R1–R27): ${closed} Closed / ${open} Open.** Pass R27 corrected Pass R26's own text, ran the Fractal Gap Map, and proposed fills (Plan §8.2). Owner questions that unblock the open items are in Plan §8.3. Canonical copies live in the GitHub repo; Drive copies are lossy (\`B99\`).`);

edit('(`Checks C1–C31` + Document-Audit Mode + `SQ-JEPA` Ripple Check)', '(`Checks C1–C32` + Document-Audit Mode + Fractal Gap Map + `SQ-JEPA` Ripple Check)');
edit('| `v9.1` (`Checks C1–C31`, `#01–#117` encoded) |', `| \`v9.2\` (\`Checks C1–C32\`, \`#01–#${logged}\` encoded) |`);
edit('| `BRS V2` (9/9 Parts; 18 open design items in Part 8.1) |', `| \`BRS V2\` (9/9 Parts; ${open} open items in Part 8.1, proposals in 8.2, owner questions in 8.3) |`);
edit('Cumulative 117-Defect Ledger, and Execution Queue. | `Resume V2` (`hm:universe:v2`, 117-defect ledger synced) |', `Cumulative ${logged}-Defect Ledger, and Execution Queue. | \`Resume V2\` (\`hm:universe:v2\`, ${logged}-defect ledger synced) |`);
edit('encode it as a new check (`C32+`) in **The Skill** first.', 'encode it as a new check (`C33+`) in **The Skill** first.');
edit('- **Lockstep Triad Sync (**`Checks C23–C31`**)**', '- **Lockstep Triad Sync (**`Checks C23–C32`**)**');
edit('and run `node scripts/triad_semantic_audit.mjs` and `node scripts/adversarial_red_team_v9_audit.mjs` (both must pass) before committing to GitHub.', 'and run `node scripts/triad_semantic_audit.mjs`, `node scripts/adversarial_red_team_v9_audit.mjs` and `node scripts/fractal_gap_map.mjs --strict` (all must pass) before committing to GitHub. Then have a fresh reader audit only the changed lines: R27 found nine errors in R26\'s own fixes.');

edit('(Checks C1-C31 + Document-Audit Mode)', '(Checks C1-C32 + Document-Audit Mode + Fractal Gap Map)');
edit('(Master Checkpoint, Shorthand Memory & 117-Defect Ledger)', `(Master Checkpoint, Shorthand Memory & ${logged}-Defect Ledger)`);
edit('3. Enforce the 3-Artifact Recursive Loop (Checks C23-C31):', '3. Enforce the 3-Artifact Recursive Loop (Checks C23-C32):');
edit('run `node scripts/triad_semantic_audit.mjs` and `node scripts/adversarial_red_team_v9_audit.mjs` (both must pass), then audit with the Skill', 'run `node scripts/triad_semantic_audit.mjs`, `node scripts/adversarial_red_team_v9_audit.mjs` and `node scripts/fractal_gap_map.mjs --strict` (all must pass), then audit with the Skill');

// Shorthand: add the R27 episode and recompute the tail.
edit('inv=0.99 cyc=26', 'inv=0.99 cyc=27');
edit('src=rule:measure-dont-model-b95-b98\n', 'src=rule:measure-dont-model-b95-b98\nme t=27 st=S5 cat=fractal-gap-map-and-self-correction ex=0.92 err=0.20 h=0.85 d=solar-pride by=thirdeye-balance src=rule:reaudit-own-diff-b118-b158\n');
edit('mc by=heart-humility d=solar-pride n=26 open=1', 'mc by=heart-humility d=solar-pride n=27 open=1');
const block = s.match(/```\r?\n(m of=preset:agent-argon-overwatch[\s\S]*?)\r?\n#TAIL\|schema:hm:universe:v2\|crc32:(0x[0-9A-F]{8})\r?\n```/);
const newCrc = crc32Hex(block[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n'));
edit(`#TAIL|schema:hm:universe:v2|crc32:${block[2]}`, `#TAIL|schema:hm:universe:v2|crc32:${newCrc}`);
edit(`CRC-32 \`${block[2]}\`, recomputed in Pass R26`, `CRC-32 \`${newCrc}\`, recomputed in Pass R27`);

// Ledger.
edit('(`Passes R1 -> R26`: 117 Logged, 99 Closed, 18 Open)', `(\`Passes R1 -> R27\`: ${logged} Logged, ${closed} Closed, ${open} Open)`);
edit('- **Pass R26 Independent Audit + 9-Arm Cross-Tier Benchmark', '- **Pass R26 Independent Audit + 9-Run Cross-Tier Benchmark');
const lastLedgerLine = s.indexOf('  - **Open, needs a decision:**');
const lineEnd = s.indexOf('\n', lastLedgerLine);
s = s.slice(0, lineEnd) + '\n' +
  `- **Pass R27 Self-Correction, Fractal Gap Map & Set-C Benchmark (Claude Opus 5.5; \`B118–B${logged}\`)**. Detail in Plan §8.1–§8.3.\n` +
  '  - Fresh set-C readers found nine errors in R26\'s own text and fixes (benchmark arithmetic, "unconditionally passive", the child-seed count, a rounding, a symmetry guard that rewarded empty craft, the SQ-JEPA horizon note). All are fixed. Lesson encoded in the Skill: re-audit your own diff with a fresh reader.\n' +
  '  - The Fractal Gap Map (`spine/`, C32) placed 24 quantities and 35 operators on the framework\'s own axes. 31 holes remain: the soul cartridge can\'t carry the soul (`B126`), there is no world save format (`B127`), there is no call graph (`B128`), and seven one-way quantities have no lateral dual (`B129–B135`). Proposed fills are in Plan §8.2.\n' +
  '  - **Owner questions (Plan §8.3):** do universes end; can 4D progress fall; are scars permanent; is starlight a magical carrier wave; which 20 pillars; 4 KB budget or larger; where is the prototype repo.' +
  s.slice(lineEnd);

// Execution checklist.
edit('Then decide or explicitly defer the 18 OPEN items in Plan §8.1; `B100` (PH integrator form) and `B102` (4 KB budget) block Wave 2.', `Also run \`node scripts/fractal_gap_map.mjs --strict\`. Then confirm, amend or defer the proposals in Plan §8.2 and answer §8.3; \`B100\` (PH integrator form), \`B102\` (4 KB budget) and \`B126\` (soul cartridge fields) block Wave 2.`);
edit('`@hm/class-forge`, and `@hm/rules-litrpg`, then `@hm/sq-jepa`', '`@hm/class-forge`, `@hm/anim-taste`, and `@hm/rules-litrpg`, then `@hm/sq-jepa`');
edit('Mount `apps/universe` 4-Screen State Machine,', 'Mount `apps/universe` 4-Screen State Machine with `@hm/studio-core` and the `hw:` governor,');
edit('  - Ran 9 arms (Sonnet and Haiku × no skill / SQ skill v9 / Reduce skill) on a plan copy with 9 planted defects, plus a hold-out copy with 9 different plants.', '  - Ran 9 runs: 6 arms (Sonnet and Haiku × no skill / SQ skill v9 / Reduce skill) on a plan copy with 9 planted defects, plus 3 Haiku arms on a hold-out copy with 9 different plants. R27 added set C (10 harder plants: sign flips, min/max and logic inversions, a broken inverse, precision, table numbering) across 8 more runs; see `bench/2026-10-31-c/`.');

s = s.replaceAll('Checks C1–C31', 'Checks C1–C32');
fs.writeFileSync(file, s);
console.log(`resume patched for Pass R27 (${logged}/${closed}/${open}; CRC ${block[2]} -> ${newCrc})`);
