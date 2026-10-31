// Pass R27 pre-commit fixes from the fresh diff review (bench/2026-10-31-c/outputs/R27_diff_review.md, items 1–24).
// Usage: node patch_r27_review.mjs <repoDir>
import fs from 'node:fs';
import path from 'node:path';
const repo = process.argv[2];
const files = { P: 'FIDELITY_COMPLETE_BRS_V2.md', R: 'ARGON_OPUS_MASTER_RESUME_V2.md', S: 'SQ_DISTORTION_CHECK_V9_SKILL.md' };
const text = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, fs.readFileSync(path.join(repo, f), 'utf8')]));
const log = [];
function edit(k, oldStr, newStr, item) {
  const n = text[k].split(oldStr).length - 1;
  if (n !== 1) throw new Error(`[${item}] ${files[k]}: expected 1 match, found ${n}: ${oldStr.slice(0, 80)}`);
  text[k] = text[k].replace(oldStr, () => newStr);
  log.push(`#${item} ${files[k]}`);
}

// 1 — Resume: restore the Section 1 heading and sentence start the R27 status regex swallowed.
edit('R', 'Drive copies are lossy (`B99`).**Argon (Overwatch)**', 'Drive copies are lossy (`B99`).\n\n## 1. The 3-Artifact Recursive Co-Evolution Loop (`Skill <-> Plan <-> Resume`)\nTo guarantee zero drift across usage resets between **Argon (Overwatch)**', 1);
// 2 — Plan tree: make the two artifact lines count-free so they never drift again.
edit('P', 'Founding Constitution (Branches 0–7 + R1–R26 Audit)', 'Founding Constitution (Branches 0–7 + audit ledger, Part 8)', 2);
edit('P', 'Master Checkpoint, Shorthand Memory & 117-Defect Ledger', 'Master Checkpoint, Shorthand Memory & Defect Ledger', 2);
// 3 — Resume: version matches the check range.
edit('R', '`sq-distortion-check` v9.1 (`Checks C1–C32`)', '`sq-distortion-check` v9.2 (`Checks C1–C32`)', 3);
// 4, 5 — §8.2 rows broken by unescaped pipes.
edit('P', '\\Pi(1 + \\kappa|\\varepsilon|))$', '\\Pi(1 + \\kappa \\lvert\\varepsilon\\rvert))$', 4);
edit('P', '`/\\bmoon_crater\\b|\\bA4-01\\b|\\.glb\\b|\\bleaks?_/`', '`/\\bmoon_crater\\b\\|\\bA4-01\\b\\|\\.glb\\b\\|\\bleaks?_/`', 5);
// 6 — B111: one-sided triggers (the symmetric one oscillated at −256).
edit('P', 'Canonical origin: local ∈ [−256, 256) m. When \\|local\\| ≥ 256, move 512 m into orbital; when \\|orbital\\| ≥ 65,536, carry into the sector.',
  'Canonical origin: local ∈ [−256, 256) m. If local ≥ 256, subtract 512 m and add it to orbital; if local < −256, add 512 m and subtract it from orbital. Carry orbital into the sector the same way at [−65,536, 65,536). This is the canonical form; the stored `(−512, 512)` bound stays as the physical limit.', 6);
// 7 — B109: a Lyapunov function each dual provably lowers.
edit('P', 'Measure V in rest cycles still needed: $V = \\text{strain}/25\\,\\text{J} + \\text{debt} + \\text{grudge}$. Each rest cycle lowers V by ≥ 1 while V > 0, so C20 is a one-line proof.',
  'Measure V in dual steps still needed: $V = \\lceil \\text{strain}/25\\,\\text{J} \\rceil + \\text{debt} + [\\text{grudge} > 0]$. A rest cycle lowers the first two terms by ≥ 1 while either is positive, and forgiveness zeroes the last, so each dual strictly lowers V on its own term (C20).', 7);
// 8 — Resume hole count matches the Plan and the generated map.
edit('R', '31 holes remain', '30 holes remain (7 once the §8.2 proposals are applied)', 8);
// 9 — B128: the cohort tick belongs to Wave 6.
edit('P', '**Cohort tick:** `stepLodPopulationTick`. ', '', 9);
edit('P', 'Wave 6 extends the tick with the cartridge gate (on import), circle evaluation and the universe bridge,', 'Wave 6 extends the tick with the cohort tick (`stepLodPopulationTick`), the cartridge gate (on import), circle evaluation and the universe bridge,', 9);
// 10 — §8.1 heading and intro cover both passes.
edit('P', '## 8.1 Pass R26 Register (`B75–B117`)', '## 8.1 Defect Register (Pass R26 onward)', 10);
edit('P', 'Found by Claude Opus 5.5 plus 9 Sonnet/Haiku audit runs (union, each item checked by hand).', '`B75–B117`: Claude Opus 5.5 plus 9 Sonnet/Haiku audit runs (R26). `B118` onward: the R27 set-C runs, the Fractal Gap Map and a fresh review of R27\'s own diff. Every item was checked by hand. FIXED = changed in the triad; OPEN = needs an owner/Argon decision.', 10);
// 11 — one precise count of R26-origin errors (seven, listed).
edit('S', '(Pass R27 found nine errors in Pass R26\'s own fixes, including a guard that let an empty craft score full symmetry)', '(Pass R27 found seven errors in Pass R26\'s own text and fixes — `B118`, `B119`, `B121`, `B122`, `B137`, `B140`, `B145` — and the review of R27\'s own draft found 24 more before it was committed)', 11);
edit('R', 'R27 found nine errors in R26\'s own fixes.', 'R27 found seven errors in R26\'s own text and fixes, and a fresh review of R27\'s draft found 24 more before commit.', 11);
edit('R', 'Fresh set-C readers found nine errors in R26\'s own text and fixes (benchmark arithmetic, "unconditionally passive", the child-seed count, a rounding, a symmetry guard that rewarded empty craft, the SQ-JEPA horizon note).', 'Fresh set-C readers found seven errors in R26\'s own text and fixes: benchmark arithmetic (`B118`), "unconditionally passive" (`B119`), the child-seed count (`B121`), a rounding (`B122`), a symmetry guard that rewarded empty craft (`B137`), the SQ-JEPA horizon note (`B140`) and a tier/peace contradiction (`B145`).', 11);
// 12 — one horizon formula everywhere (Ripple Check).
const K_OLD_A = '\\max(K_{\\text{req}}, \\lceil \\text{strain}/25 \\rceil + 4, \\text{debt} + 4)$';
const K_NEW_A = '\\max(K_{\\text{req}}, \\lceil \\text{strain}/25 \\rceil + 4, \\text{debt} + 4, 12)$ (capped at 72)';
edit('S', `K_{\\text{adaptive}} = ${K_OLD_A}`, `K_{\\text{adaptive}} = ${K_NEW_A}`, 12);
edit('P', `adaptive rollout horizon $K = ${K_OLD_A}.`, `adaptive rollout horizon $K = ${K_NEW_A}.`, 12);
edit('R', 'K_{\\text{adaptive}} = \\max(K_{\\text{req}}, \\lceil\\text{strain}/25\\rceil + 4, \\text{debt} + 4)$', 'K_{\\text{adaptive}} = \\max(K_{\\text{req}}, \\lceil\\text{strain}/25\\rceil + 4, \\text{debt} + 4, 12)$ (capped at 72)', 12);
// 13 — say why the exact-zero guard is enough.
edit('P', 'an empty craft earns no symmetry credit (`B83`, `B137`).', 'an empty craft earns no symmetry credit (`B83`, `B137`). A tiny but balanced craft still scores 1, which is correct; Gate 1 already rejects a craft with no chassis.', 13);
// 14 — the aspect-ratio fix must not add an unguarded division.
edit('P', '(aspectRatio = longest / shortest extent, so ≥ 1, `B155`)', '(aspectRatio = longest / max(10^{-3} m, shortest) extent, so ≥ 1, `B155`)', 14);
// 15 — B113 capacity holds even when everything is protected.
edit('P', 'items with `ex ≥ 0.9` or `mc open=1` are never shed; overflow sheds the lowest `ex`.', 'items with `ex ≥ 0.9` or `mc open=1` are shed last; overflow sheds the lowest `ex` first. If protected items alone exceed 64, coalesce them by catalyst, then shed the oldest and write a Chronicle warning, so the cap always holds.', 15);
// 16 — B102: complete eviction order, with its dependency.
edit('P', 'oldest `mc open=0` → oldest non-top-4 `me` → lowest-grudge `nem` → … `m`, `ms`, the top-4 `me` and the tail are never evicted.', 'oldest `mc open=0` → oldest `me` outside the top 4 by `ex` → lowest-`ache` `mb` with `stage=clear` → lowest-grudge `nem` → oldest `mc open=1`. Never evicted: `m`, `ms`, the top-4 `me` and the tail. Depends on `B103` (top-4 retention).', 16);
// 17 — B129: close the energy books for the rest cycle.
edit('P', 'The rest cycle\'s +30 J is drawn from it (like Indigo\'s 85/15), so conservation closes.', 'The rest cycle\'s +30 J is drawn from it (like Indigo\'s 85/15), and the 25 J of strain it dissipates goes to `E_THERMAL`, which the vent and plasmoid relaxation radiate away. Every joule then has a source and a sink.', 17);
// 18 — B106: make the unit choice explicit.
edit('P', 'smoothstep}(0.02, 0.08, g))$, g in m/s².', 'smoothstep}(0.02, 0.08, g))$ with g in m/s². This picks m/s² for `safeG`; if it is meant in G, scale the window by 9.81.', 18);
// 19 — B100: exact only in exact arithmetic; define y.
edit('P', 'Then $H^{k+1} - H^k \\le \\Delta t\\, u^T y$ exactly; the Cayley form is exact only for quadratic H.', 'Then $H^{k+1} - H^k \\le \\Delta t\\, u^T y$ with output $y = G^T \\bar\\nabla H$, exactly in exact arithmetic and to solver tolerance in floating point. The Cayley form has the same energy balance only for quadratic H.', 19);
// 20 — B139: units vs ranges.
edit('P', '14 of the 24 StateIdx slots have no unit or range (XI_X, XI_Z, MU_*, PI_*, A_AWARE, D_DISTORT, LAMBDA_FTLE, H_COHERENCE).', 'StateIdx: 12 slots have no unit (MU_*, PI_*, A_AWARE, D_DISTORT, LAMBDA_FTLE, H_COHERENCE) and 14 have no range (those 12 plus XI_X and XI_Z, which are in metres).', 20);
// 21 — "Deduced from" quotes must be verbatim.
edit('P', 'Skill C22 ("Four-Float + 22-Archetype soul cartridge"); the shorthand is the only cartridge format', 'Skill Step 0.5 ("a portable Four-Float + 22-Archetype soul cartridge"); the shorthand is the only cartridge format', 21);
edit('P', 'Skill 1.5 ("distortions are over-clamped precision"), Archetype #3 Catalyst / Left receptive channel', 'Skill Summary ("penalizes dogmatic precision" Π ≫ Π₀): distortion is over-precision, so something must raise Π; Archetype #3 Catalyst / Left receptive channel', 21);
// 22 — Skill ripple misses.
edit('S', 'Measured in Pass R26 (2026-10-31, 9 Sonnet/Haiku arms)', 'Measured in Pass R26 (2026-10-31, 9 Sonnet/Haiku runs) and Pass R27 (8 more runs on harder plants)', 22);
edit('S', 'relative to homeostatic baseline $\\Pi_0$ is strictly $\\ge 0$', 'relative to homeostatic baseline $\\Pi_0$ is strictly $\\ge 0$ for $\\Pi_i, \\Pi_{0,i} > 0$ (floor $10^{-3}$, `B120`)', 22);
// 23 — B104: the right reason for 10,240.
edit('P', 'and XOR of a ≤10-bit and a ≤14-bit integer yields only 10,240 distinct seeds', 'and XOR over the value ranges 0..1000 and 0..10000 yields only 10,240 distinct seeds from 10,011,001 input pairs', 23);
// 24 — B143: the tree gets the two new package folders too.
edit('P', '│   ├── class-forge/                  # Branch 3.7: WoW-Baseline (1.5s GCD) + Infinite Emergent LitRPG Class Synthesizer', '│   ├── class-forge/                  # Branch 3.7: WoW-Baseline (1.5s GCD) + Infinite Emergent LitRPG Class Synthesizer\n│   ├── anim-taste/                   # Branch 3D: 3-phase personality animation curve (B78/B143)\n│   ├── studio-core/                  # Branch 4: self-hosting studio core (B78/B143)', 24);

for (const [k, f] of Object.entries(files)) fs.writeFileSync(path.join(repo, f), text[k]);
console.log(`${log.length} edits applied for review items ${[...new Set(log.map(l => l.split(' ')[0]))].join(' ')}`);
