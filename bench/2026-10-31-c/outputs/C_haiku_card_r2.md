# Audit of PLAN_C.md (card: SQ_AUDIT_CARD.md, r2)

Scope: PLAN_C.md only (436 lines, read in full). Items B75–B117 in §8.1 were not re-reported. Every number below was computed with `node -e`. Line numbers refer to PLAN_C.md.

| # | Location (section + line) | Check # | Defect | Evidence (quote or computed value) | Severity H/M/L | Confidence 0-1 |
|---|---|---|---|---|---|---|
| 1 | Part 1 §2.1, L122 (ρ(V_tx) inverse) | 2, 5 | The inverse does not invert the forward map. V_tx(ρ) divides by ln(ρ_max), but the forward map needs ln(ρ_max/ρ_min). | V_tx(25000) = 1.9095 (must be 1.0). H2 ρ = 0.08988 gives V = 0.6716, which maps forward to ρ = 43.66 kg/m³. With denominator ln(ρ_max/ρ_min): V(25000) = 1.0000 and H2 round-trips to 0.08988. | H | 0.95 |
| 2 | Part 1 §2.1, L120 and L122 (E_Young bounds) | 3, 8 | The stated goal of "zero clamping loss" for Diamond (E = 1050 GPa) contradicts E_max = 1,200 MPa. GPa and MPa are mixed. | 1050 GPa / 1200 MPa = 875x the upper bound, so Diamond clamps to P_xd = 1. Probable intent: 1,200 GPa. | H | 0.9 |
| 3 | Part 1 §2.2, L126 (VSA-4096 bus) | 2, 7 | "VSA-4096 (Uint32Array(64), 512 bytes)" holds 2048 bits in 256 bytes, not 4096 bits in 512 bytes. | 64 x 32 = 2048 bits; 64 x 4 = 256 bytes. 4096 bits need Uint32Array(128) = 512 bytes. | H | 0.9 |
| 4 | Part 4 §1.2, L206 (multi-star gravity g_net) | 2 | Sign error. g = Σ G M_k (q − q_k)/|r|³ points away from the star (repulsion). Newtonian attraction needs (q_k − q). | Star at origin, GM = 1, observer at (1,0,0): plan gives g = (1, 0, 0), which is +x, away from the star. | H | 0.8 |
| 5 | Part 5 §3, L222 (reputationAfter) | 4, 2 | For any satisfaction S in [0,1], the +0.5 offset gives Δ in [+0.15, +0.45], so reputation never falls. The neutral point (S = −0.5) lies outside the domain. Probable intent: S − 0.5. | S = 0 from R = 0: R = 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.00 (day 7). | M | 0.6 |
| 6 | Part 7 §4, L359 (Progress_4D update) | 8, 4 | Inverted min/max. max(1.0, ·) is a floor, not a cap. The first symbiotic step sets progress to 1.0 whatever ΔH is, and nothing caps it above. Probable intent: min(1.0, ·). | Progress = 0, ΔH = 0 / 0.5 / 1.5: plan gives 1 / 1 / 1; min variant gives 0 / 0.09 / 0.27. | H | 0.85 |
| 7 | Part 3 §1, L163–164 (Ra archetype table) | 1 | Numbering error. Body Complex has "#11 The Enchantress" (Station 4) and "#11 The Hanged Man" (Station 5). #12 is absent. | Body column reads 8, 9, 10, 11, 11, 13, 14: seven entries, a duplicate 11, and a gap at 12. | M | 0.85 |
| 8 | Part 3 §2, L177 (E_vent) with Part 6 §2, L320 | 7, 9 | E_vent = 18.5 x Σ_strain [J] has no energy source and no floor. Its maximum exceeds the reserve cap in Part 6 (vitalReserveJoules clamped to [5, 100] J). | Σ = 2.2 (trigger) gives 40.7 J. Σ = 14 (all zones at κ = 1) gives 259 J, against a 100 J reserve cap. | M | 0.6 |
| 9 | Part 3 §2, L177 vs Part 6 §2, L320; state field L92 | 3, 9 | Two strain quantities. Syncope triggers on the dimensionless Σ_strain ≥ 2.2, but clears on somaticStrainJoules < 20 J. No mapping between the κ-sum and joules is given. | Trigger in units of κ-sum (dimensionless); clear in joules; state field E_STRAIN is in J (L92). | M | 0.5 |
| 10 | Part 4 §1.1, L203 (x_localSelf as Float16Array) | 12 | The local tier cannot carry the sub-millimetre precision the origin scheme is justified by (B45/B46/B65 text, L204). | Float16 ulp: 7.8 mm at |x| = 8 m; 31 mm at 32 m; 0.125 m at 128 m; 0.25 m at 256–512 m. | M | 0.5 |
| 11 | Part 4 §1.1, L204 (split-scale jump tuple) | 5 | The safe-BigInt conversion silently turns NaN and ±Infinity into a zero warp (0n). No error path. | `Number.isFinite(x) ? BigInt(Math.trunc(x)) : 0n` maps NaN to 0n. | L | 0.5 |
| 12 | Part 4 §2, L211 (hw: governor) | 5, 8 | No result is defined for NaN or unknown VRAM. The result depends on implementation. | `v<4?1:v<16?2:3` at NaN gives Tier 3. `v>=16?3:v>=4?2:1` at NaN gives Tier 1. | M | 0.5 |
| 13 | §4.2 Waves 2–6, L301–307, with §4.1 tree L258 and home map L282, L285, L286 | 10 | @hm/class-forge, @hm/anim-taste, @hm/governor and @hm/studio-core appear in no wave. Wave 5 mounts STUDIO_SCHEMATIC_2D and the Braun-Atelier HUD, which need studio-core, hudlayout and governor. | Waves 1–7 (L296–311) never name these four packages. | M | 0.55 |
| 14 | Part 7 §2, L337, L339, L340; Part 3 §1, L166; Part 5 §4.2, L309 | 10 | Named functions with no home in the tree (L226–262) or the home map (L273–293): evaluateSimulatedMusicResonance, enqueueShortTermMemoryBurst / flushStmAndVentToLongTermMem, stepBiologicalCompensatoryVent, evaluateHarvestChoice, v2EvaluateCrossTierModelDistillation. | The home map lists packages only. None of these names appears in it. | M | 0.5 |
| 15 | Part 7 §1.2, L333 and L335 vs Part 1 §1.1, L88–96 (StateIdx) | 10, 9 | Recovery Debt and Nemesis Grudge are in the latent vector s(0) and in V_Lyapunov, but the 24-float StateIdx has no slot for either. | StateIdx indices 0–23 (L88–96) contain strain, reserve and cybernetic slots only. No debt or grudge entry. | M | 0.7 |
| 16 | Part 7 §1.1, L326 (KL-regularized loss) | 5, 4 | ln(Π_i / Π_0,i) is undefined for Π_i ≤ 0, so "strictly non-negative" holds only for Π > 0. Π → 0 diverges. No floor is stated, although §1.2 anneals Π toward Π_0. | Term r − ln r − 1: r = 1 gives 0; r = 0 gives +Infinity; r = −0.1 gives NaN. | M | 0.6 |
| 17 | Part 7 §1.1, L325 (heading) | 12 | Attribution. "LeJEPA Anti-Collapse Regularizer" is attached to the KL term. LeJEPA's anti-collapse regularizer is SIGReg (Gaussian sketch), not a KL divergence. | Checked from memory only; no source was opened. | L | 0.5 |
| 18 | Part 7 §1.2, L330 and L335 (one-pass convergence) | 12 | Unsupported claim. "Convergence holds by construction (horizon ≥ debt + 4)". The horizon in B72 (L374) counts strain and debt only. The stop test E_ψ ≤ 1e-9 also needs Π annealed to Π_0, and no annealing rate or step count is given. | K = max(K_req, ceil(strain/25) + 4, debt + 4) has no term for Π decay. | M | 0.45 |
| 19 | Part 7 §2, L342 | 12 | Grounding claim with no source. "Yang-Mills non-Abelian vortex mass gap" is cited as frontier math grounding. The Yang–Mills mass gap is an open problem (Clay Millennium problem). | Factual; no citation given. | L | 0.5 |
| 20 | Part 5 §3, L224; Part 4 §4.2 Wave 3, L301; tree L266 | 12 | Performance figures with no benchmark, harness or command: "6,000 agents in < 0.5 ms", "S0a -> S3 in ~10 ms", "56 ms/s idle". | No test or reproduction named in the plan. | M | 0.55 |
| 21 | §4.2 Wave 7, L309–311; §8 row R26, L376 | 12 | The only evidence for the "measured" results is "Data: bench/2026-10-31/REPORT.md". That path is not in the §4.1 tree and no reproduction command is given. The +12–33% token and +2–4 min figures cannot be checked from the plan. Distinct from B110 (prototype provenance). | Path absent from the tree (L226–262). | M | 0.4 |
| 22 | Part 2 §2, L143–144 (Gate 2 S_stab) | 8, 3 | Semantics unclear. The zero-G branch writes "≤ 0.50" (cap) and the planetary branch writes "≥ 0.50" (threshold) in the same formula template. The cross product assumes unit n̂, but the guard only checks |n̂| > 1e-9. | L143: "S_stab = clamp01(...) ≤ 0.50". L144: "... ≥ 0.50". | M | 0.4 |
| 23 | Part 2 §2, L145 (Gate 3 S_sym) | 8 | Zero masses give perfect symmetry. The floor makes 0/1e-9 = 0, so a massless craft scores S_sym = 1. | m_L = m_R = 0 gives S_sym = 1. | L | 0.6 |
| 24 | Part 1 §1.2, L107 and L115 (CRC tail) | 9 | Seam. The example checks out: CRC-32 of the five body lines joined by \n (no trailing newline) is 499A7731, which matches the declared tail. The comparison `computedCrcHex === declaredCrcHex` does not fix hex case or the 0x prefix, and the example is uppercase. | Computed body CRC = 499A7731 (uppercase). A lowercase formatter would fail silently. | L | 0.35 |
| 25 | Header L2; Part 8, L362–377; body refs L192, L193, L224 | 11, 9 | Homeless references. "#06", "#07", "#17", "#35" cite defect numbers with no ledger row. The header says "#01–#117" but the ledger uses B01–B117. | Ledger rows (L364–377) use B-numbers only. | L | 0.5 |
| 26 | Part 1 spider, L50; §4.1 tree, L260 | 1 | Counts with no enumeration. "6-Theme UI Style Shelf" and "5-Rung ui: engine" give counts, but the plan never lists the themes or rungs. | No list of six themes or five rungs appears in the plan. | L | 0.4 |
| 27 | Part 1 §2.1, L122 vs Part 2 §1.2, L139 | 11, 8 | The symbol E_max means maximum Young's modulus in Part 1 and maximum epoch in Part 2. Burial depth z(e) = (E_max − e) x Δz + z0 gives a negative depth for e > E_max, with no guard. | e = E_max + 1 gives z0 − Δz. | L | 0.3 |
| 28 | Part 3 §2, L174 vs state enum L113 | 9 | Seam. The somatic cadences DULL_ACHE, SHARP_PAIN and EUREKA are not mapped to the mb stage enum (clear, congested, inflamed, runaway). | No mapping stated. | L | 0.35 |
| 29 | Part 7 §4, L360 (recursive child-universe ignition) | 7 (sacral-addiction preset) | No cap on count, depth or rate. Each S6 civilization at H_SMC ≥ 0.95 can seed children on rung k−1 with no limit. | No budget or limit appears at L360. | M | 0.4 |

Pass 1 (section order, §1 to §9): 26 new findings (#1–#26).
Pass 2 (check order 1–12): 2 new findings (#27, #28), both L. No new H or M.
Pass 3 (preset-map lens: root-apathy, root-reactivity, sacral-addiction, sacral-repression, solar-control/projection/pride, throat-actualization): 1 new finding (#29, M).
Converged: no. Pass 3 added an M, so passes 2 and 3 are not both zero. All three passes were one reader, so even a zero-yield result would count as saturation, not convergence.

Totals: 29 findings (5 H, 15 M, 9 L).

## Checks I could not run
- Check 2 on the Cayley-Padé resolvent: no matrices are given. B100 is already open.
- Check 11 against the SQ skill: only the two named files were read, so the skill's "21 SQ Antidote Presets" and Checks C1–C31 could not be checked.
- Check 12 external citations (arXiv:2506.09985, arXiv:2301.08243, LeJEPA SIGReg, Wang & Zahl, Pollack EZ water, Ra session numbers): not checked against sources. #17 is from memory.
- Benchmark report, 3,848 tests, audit scripts, commit 6519c461: outside the two files; not checked.
- Shorthand worst-case size (B102), the one-pass numerics of E_ψ, the Breadcrumb E range and sign, and B107 float equality: not run (listed in §8.1, or no numbers given).
- Gate 4 aspectRatio denominator: no guard is stated and no formula for aspectRatio is given. Not checked.
- Checks run and clean: check 6 (every example against its caps; the shorthand CRC example reproduces), and check 2 identities for weights (all sums equal 1), KL non-negativity for Π > 0, and the nem tier mapping at the boundaries 1, 2, 3.

## Self-report on the card
(a) Checks that produced findings:
- Check 1: #7, #26.
- Check 2: #1, #3, #4.
- Check 3: #2, #9, #22, #24.
- Check 4: #5, #6, #16.
- Check 5: #1, #11, #12, #16.
- Check 6: none. Examples sit inside their caps, and the CRC example reproduces.
- Check 7: #3, #8, #29.
- Check 8: #2, #6, #12, #22, #23, #27.
- Check 9: #8, #9, #15, #24, #28.
- Check 10: #13, #14, #15.
- Check 11: #25, #27.
- Check 12: #10, #17, #18, #19, #20, #21.

(b) What the card made me miss or over-report:
- Missed by the card's wording: the sign of physical laws (#4) and min/max direction (#6). Check 2 says "identities" and check 8 says "x = a", so neither prompts a sign or floor-versus-cap test. I found both only by computing.
- Check 1 (recount) does not prompt for duplicate or gapped numbered sets. #7 came from reading the table.
- Check 10 covers packages, files and functions, but not state-vector slots. #15 needed an extra reading.
- Over-report risk: check 12 flags every number that lacks a formula. I split those into performance figures (#20) and citations (#17, #19). Check 5 flags many divisions that already have floors. I had to check each one, and the floored ones were correctly excluded.
- The convergence rule ("different lenses") does not say how a single reader's passes count. I treated them as saturation.
- The preset map did not map cleanly onto the 12 checks. The preset lens added one item (#29).

(c) Concrete edits to the card:
1. Check 2: add "for each physical law, evaluate it at one test point with a known answer (sign and direction)".
2. Check 8: add "for each max(, min( or clamp, name the floor and the cap and test both sides".
3. Check 1: add "numbered sets: duplicates and gaps (tiers, archetypes, pins, defect IDs)".
4. Check 10: add "every named state-vector or record field has an index or key".
5. Check 12: split into 12a (performance figures need a harness or command) and 12b (citations are "not checked offline", not UNSUPPORTED).
6. Check 3: add "range bounds written in a different unit from the values they clamp (GPa vs MPa)".
7. Convergence: state that a single reader's passes count as saturation, and say how lenses are chosen.
