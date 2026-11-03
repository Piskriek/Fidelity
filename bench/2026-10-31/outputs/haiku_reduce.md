## Findings

Line numbers refer to PLAN.md. Categories follow the skill: MATH, CONFLICT, GAP, UNSUPPORTED, OPAQUE. Framing and cosmological content is excluded.

| # | Location (Part/section + line no.) | Category | Defect | Evidence (quote or calculation) | Severity H/M/L | Confidence 0-1 |
|---|---|---|---|---|---|---|
| 1 | Header L2; Part 8 L326–338; Wave 7 L275 | MATH / CONFLICT | Header claims 74/74 defects (#01–#74, passes R1–R24). The ledger rows sum to 70 (B01–B70) and the Part 8 title says 70. No rows exist for R19, R21, R23, R24. Wave 7 cites B74, which is not in the ledger. | node: 23+13+5+12+6+3+4+4 = 70. L2 "74 / 74"; L326 "ALL 70 DEFECTS CLOSED"; L275 "B74" | M | 0.95 |
| 2 | Section 2 spider, L17 vs L19–24, L27–36, L47–51, L54–58, L60–63 | MATH | "32 Verified Sub-Branches", but the numbered sub-branches total 41 (B1 6, B2 6, B3 10, B4 5, B5 5, B6 5, B7 4). "Verified" is also unsupported. | Count of numbered items; node sum = 41 | L | 0.95 |
| 3 | Section 2 spider L33–34 vs Part 4 §1.2 L196–197 and tree L244 | CONFLICT | Multi-star wave superposition sits under @hm/alchemy-catalyst (B45) in the spider. Part 4 §1.2 and the monorepo tree place it in @hm/origin64. | Text comparison | L | 0.9 |
| 4 | Section 2 spider L54 vs Part 5 §1 L207–209 | GAP | Spider cites "Audits A1-A5". Part 5 §1 defines only A1, A2/A3 and A4. A5 is never specified. | Text search | M | 0.9 |
| 5 | Part 1 §1.1 L78 | MATH / GAP / UNSUPPORTED | Cayley update: M^-1 appears only inside the resolvent, while the right-hand side is (J−R)∇H with no M^-1. The dimensionless factor Δt/2·(J−R)M^-1 needs (J−R)M^-1 in 1/s, which is not stated. ∇H is evaluated at the midpoint, which contains x^{k+1}, so the step is implicit, with no solver or tolerance. "Unconditionally passive" is asserted without proof. | Formula text | M | 0.55 |
| 6 | Part 1 §1.2 L100 vs L107 and Part 3 §3 L178 | MATH (self-consistency) | The example nem line has resist=elem:plasma-arc:0.95. The stated cap is 0.85 (L107) and the B63 cap is 0.85 (L178). | 0.95 > 0.85 | H | 0.95 |
| 7 | Part 1 §1.2 L101 vs L108 | UNSUPPORTED / GAP | The example `crc32:0x499A7731` does not match the CRC32 of the preceding lines under seven byte canonicalisations (LF, LF+trailing NL, CRLF, CRLF+trailing, and tail-prefix variants). L108 does not define the canonicalisation, hex case, or 0x prefix that `computedCrcHex === declaredCrcHex` requires. | node CRC32: B3759FBB, 6ED71908, 4AED797C, BEF13023, E335A493, C0EDA557, D6834976 vs target 499A7731 | M | 0.6 |
| 8 | Part 1 §1.2 L94, L104–107 | MATH / GAP (invariant conflict) | The "<= 4096 byte" invariant cannot hold at full slot caps for the example's own field widths. Eviction is undefined for the me overlap (top 4 ex + 28 recent) and for mc (16 slots). | node: 32×me + 16×mc = 4,480 B at example widths; full record at example widths = 6,395 B; minimal-token worst case = 3,414 B. No overflow rule (reject, truncate or evict). | H | 0.85 |
| 9 | L82, L89–92, L114–115, L117 (Part 1); L124, L128, L130 (Part 2 §1); L137 (Part 2 §2); L211 (Part 5 §2); L278 (Part 5 §4.2); L299 (Part 7 §1.2) | GAP | Undefined quantities used in formulas: K_niches (L124); ξ_symplectic distribution (L128); z_0, Δz_epoch, and an epoch E_max that clashes with Young's E_max (L130 vs L113); aspectRatio (L137); Δ_complement (L211); V_Lyapunov (L299); ΔR_lift and ρ_compress (L278). Stage S0b (L82) is defined nowhere. Units or ranges are missing for p_atm (L115), σ_cond (L114), the VSA Hamming normalisation (L117 gives [−1,1] without a formula), and StateIdx 12–23 (L89–92). | Symbol search over the text | M | 0.85 |
| 10 | Part 2 §1.1 L124 | MATH (operator breakers) | |P_b| in the denominator has no guard (empty pin set gives 0/0). 1/K_niches has no guard (K = 0). Only the cosine denominator has the 1e-9 guard. The cosine term is in [−1,1], so E can be negative, and its range is not stated. | Operator text | M | 0.85 |
| 11 | Part 2 §2 L134–135 | MATH (units) | Dimension error in the planetary branch. ξ_offset = norm(x)² + norm(v)²/ω0 adds m² to m²/s, since (m/s)²/(1/s) = m²/s. Then ξ/(2.2·r_support) is m²/m, not dimensionless, but is passed to clamp01(1−…). The zero-G branch uses an un-squared norm, so the two branches disagree on convention. | Units: (m/s)² ÷ (1/s) = m²/s; m²/m = m | H | 0.9 |
| 12 | Part 2 §2 L134–137 | MATH (operator breakers) | S_sym divides by (m_L + m_R). With both zero it gives NaN (node: Math.max(0, NaN) = NaN). ω0 = sqrt(g/h_CoM) divides by zero at h_CoM = 0 and is NaN for negative h. Divisors 2·r_RCS and 2.2·r_support have no guard for r = 0. The normalisation of n̂ is not stated. | node: 1 − 2·|0−0|/(0+0) = NaN | M | 0.85 |
| 13 | Part 3 §2 L164 | GAP | Ray 7 has no role. Holding is rays 1–3 and aching is rays 4–6, so zones 7:L and 7:R are unassigned, yet the body has 14 zones (7 rays × L/R). | Text | L | 0.85 |
| 14 | Part 3 §3 L174 vs L107 | GAP | enRAGE tier thresholds (NONE → RESENTFUL → VENGEFUL → MURDEROUS → SOVEREIGN) are not defined. score is 0..10 (L107), but grudgeScore has no stated scale. The example `tier=MURDEROUS score=2.23` cannot be checked. | Text | M | 0.8 |
| 15 | Part 3 §3 L178 vs L107 | CONFLICT (seam) | Producer nemesisEntry {vs, tier, grudge, temper, scar, resistKey, resistVal} feeds formatShorthandRecordV2, whose nem line has score=<0..10> and a composite resist=elem:id:val. grudge is never mapped to score (no scale given), and resistKey/resistVal are not mapped to the composite. | Field lists compared | M | 0.8 |
| 16 | Part 4 §1.1 L192 | MATH | "2^17 m = 131,072 m = 128 × 512 m" is wrong. 128 × 512 = 65,536 = 2^16. 131,072 = 256 × 512. The mod-512 conclusion still holds; the factorisation does not. | node: 128·512 = 65536; 2^17 = 131072; 256·512 = 131072 | M | 0.95 |
| 17 | Part 4 §1.1 L192 | MATH | "spans ±9.75 × 10^7 light-years". 2^63 sectors × 2^17 m = 2^80 m ≈ 1.28 × 10^8 ly. | node: 2^63·2^17 / 9.4607e15 = 1.2778e8 ly | L | 0.9 |
| 18 | Part 4 §1.1 L192–194 | GAP (boundary) | Local x is the open interval (−512, +512) and orbital is half-open [−65536, +65536). No rule says what happens at x = ±512 exactly, what triggers a rebase, or how a sub-sector jump with |deltaSubSectorF64| ≥ 2^17 m carries into the sector term. | Interval text | M | 0.7 |
| 19 | Part 4 §2 L202 | GAP (boundary) | VRAM tiers "<4GB → Tier 1, <16GB → Tier 2, >16GB → Tier 3" leave exactly 16 GB with no tier. GB versus GiB is not stated. | Interval text | L | 0.95 |
| 20 | Part 5 §1 L207 | MATH (units) | F_thrust ≤ min(250·m_kg, 0.45·P_in[W]). The first argument is in N and the second is in W (J/s). A dimensionless 0.45 cannot convert W to N; a 1/velocity term is required. | Units: N compared with W | H | 0.9 |
| 21 | Part 5 §2 L211 | MATH (operator breakers) | H_circle divides by N_total, which is 0 for an empty circle. The max over an empty Circle is undefined. Δ_complement is undefined. | Text | M | 0.8 |
| 22 | Part 5 §3 L213 | MATH | daySatisfaction weights 0.40 + 0.30 + 0.20 + 0.20 = 1.10, so S_day ∈ [0, 1.1] even with clamped inputs. The reputation update assumes a [0,1] input (midpoint 0.5). | node: 1.0999999999999999 | M | 0.95 |
| 23 | Part 5 §3 L215; §4.1 L255; §4.2 L267 | UNSUPPORTED | "6,000 agents in < 0.5 ms", "S0a → S3 in ~10 ms" and "56 ms/s idle" have no benchmark. "56 ms/s" has no defined unit. | Text | L | 0.8 |
| 24 | Header L2; L72; L225; L263; L344 | GAP | The CI gate forbids .glb and other tokens, but the plan itself, committed as FIDELITY_COMPLETE_BRS_V2.md (tree L222), contains ".glb" at L2, L72, L225, L263 and L344. The gate's scan scope and exclusions are undefined. L225 says "exist" (files), L263 says "occurrences" (text). | Text search | L | 0.6 |
| 25 | Section 3 L70; Part 2 header L121; Part 3 L146; Part 4 L187; Part 5 L205 vs tree L229–251 | GAP (homes) | 16 named packages have no tree entry: @hm/strata, @hm/anim-taste, @hm/archetypes, @hm/somatic, @hm/studio-core, @hm/governor, @hm/smc-nexus, @hm/open-host-sdk, @hm/gauntlet, and Bucket A's @hm/meshops, @hm/kitspec, @hm/kinematic, @hm/orbital, @hm/treegen, @hm/groundshader, @hm/harness. Some are folded silently into soul, rules-litrpg, hudlayout and gamebridge with no rule. | Name diff: 9 + 7 = 16 | M | 0.9 |
| 26 | Part 5 §4.1 L225–227 vs Part 8 L330–332 | GAP (homes) | The ledger cites sq_full_universe_fractal_audit.mjs, verify_pass9_twenty_pillars.mjs and verify_pass11_autopoietic_universe.mjs. The scripts/ tree lists only verify-clean-slate, port-clean-packages and adversarial_red_team_v9_audit. | Name diff | L | 0.85 |
| 27 | Part 5 §4.2 L278 | MATH / GAP | ΔR_lift and ρ_compress are undefined. η_token divides by a token count, and Passes_raw / Passes_skill divides by a pass count. Neither has a guard against 0. | Text | L | 0.7 |
| 28 | Part 6 §2 L286–287 | MATH / GAP (unbounded growth) | Recovery debt 2^(n−1) has no cap and n is undefined. The restorative dual decrements debt by 1 per cycle, but in IEEE doubles (2^54 − 1) === 2^54, so once debt ≥ 2^53 the decrement is a no-op and debt == 0 is never reached. | node: (2**54 − 1) === 2**54 → true; 2^53 = 9007199254740992 | M | 0.85 |
| 29 | Part 3 §2 L168 vs Part 6 §2 L287; StateIdx E_STRAIN [J] L88 | CONFLICT (units) | The hibernation trigger uses dimensionless Σκ (≥ 2.2, or ≥ 4 runaway zones). The clear rule uses somaticStrainJoules < 20 J. E_vent = 18.5·Σ is in J only through an unstated coefficient. Trigger and clear use different variables. | Text | M | 0.75 |
| 30 | Part 7 §1.1 L293 | MATH | L_KL includes ln(Π_i/Π0_i). Π_i = 0 gives ln 0 = −∞, and Π0_i = 0 divides by zero. There is no guard, so the "≥ 0" invariant fails. The mapping from Π indices to the four floats is not stated. | node: Math.log(0) = −Infinity, so the term is −∞ | H | 0.9 |
| 31 | Part 7 §1.2 L299 | GAP / UNSUPPORTED | "Rolls out k = 0…K … until E ≤ 1e-9": no maximum K is given, so a non-decaying E never returns. V_Lyapunov is undefined, so E ≥ 0 cannot be checked. "convergedInOnePass" is asserted, not derived. | Text | H | 0.75 |
| 32 | Part 3 §3 L175; Part 6 §2 L286; Part 7 §2 L301 | GAP | Additive deltas to bounded quantities with no clamp: excitement +0.35 (L301), local tension +0.25 (L175), Veil −0.55 and Wisdom +0.30 (L286). Values can leave [0,1]. | Text | L | 0.6 |
| 33 | Part 7 §2 L305–306 | UNSUPPORTED | The Yang-Mills non-Abelian vortex mass gap is cited as "grounding", but the mass gap is an open problem. EZ water (H3O2) is a contested hypothesis presented as grounding. These are scientific claims, not framing. | Text | L | 0.75 |
| 34 | Header L2; L5; L299; L338; L345 | UNSUPPORTED | Zero-defect convergence, the "2,704-vector adversarial audit", the "Dynamical Lyapunov Proof", "twoZeroConvergenceAchieved: true", "3,848 unit tests" and ΔL_meta are asserted. The scripts and results they cite are not in the inputs. 2,704 is not derivable from any stated matrix. | Text; cited artifacts not provided | M | 0.9 |
| 35 | Part 8 L338 | CONFLICT | The row title says "15 Operators"; the same row says "all 16 V2 operators". | Text | L | 0.95 |
| 36 | L82 (Part 1); L154–157 (Part 3 §1); L241 (tree); L298 (Part 7 §1.2); L303 (Part 7 §2) | OPAQUE | Operational terms with no behaviour defined: stage S0b; W2 recordExperience and W3 dream.ts with higherSelfCue (named, not specified); Veiled Ego; the 21 SQ Antidote Presets; the STM MDL coalescing queue. Logged as operational gaps, not as framing. | Text | L | 0.6 |

## Ladder and verdict

R0: A headless multi-universe simulator that evolves presets, renders them through a translator, and shares ≤4 KB cartridges. It works when every formula is unit-consistent, state stays bounded, records stay within 4 KB, and the clean-slate CI gate passes.

R1 (7 elements):
1. Kernel: Four-Floats state, 24-float Cayley step, KL loss, SQ-JEPA rollout.
2. Codec: m/me/mc/mb/nem records with CRC tail and slot caps.
3. Elements and units: log-bijective phase map, SI normaliser, VSA-4096 bus.
4. Genesis and taste: breadcrumb excitement, pin reproduction, 4-gate taste sieve, strata.
5. Soul, body, nemesis, voice: archetype table, 14-zone somatic cascade, enRAGE, animation, voice tiers.
6. Space, governor, magic: BigInt64 origin, multi-star field, Gauntlet, Indigo and alchemy, VRAM tiers.
7. Community and bridge: cartridge gate, CapitalEmpire cohorts, universe bridge, verification ledger.

R2 cards were held in working memory and are not reproduced.

Verdict:
- R1 covers R0 in name, but R0's "how you would know it works" rests on scripts and a zero-defect ledger that are not in the inputs.
- Highest risk: the codec size and CRC contract (#6, #7, #8) and the kernel loss guards (#30, #31). The taste and origin64 formulas (#11, #20) would produce wrong numbers silently.
- Smallest falsifying experiment: encode a worst-case record at the example's field widths and test ≤ 4096 B; run a unit-scaling test on the Gate 2 planetary formula (scale lengths and time, check invariance).
- Ornament: the Ra archetype table and the Part 7 §3 mimetic table feed no formula or invariant. Treated as framing, not as defects.
- Approach: the convergence claim (0 defects) is not evidence in itself. Treat it as unverified until the cited scripts run.

Not checked:
- No referenced script, test, or triad artifact was run or read; the inputs were limited to the two files. The 3,848 tests, the 2,606 presets and the zero-defect ledger are unverified.
- CRC: only seven byte canonicalisations were tried. The intended canonicalisation may be defined elsewhere.
- Physical constants (H2 density, Young's modulus range, Cp range) were checked for range only, not against data sources.
- Ra, Law-of-One and other cosmological citations (framing, excluded) and the Kakeya citation were not checked.
- No stability or convergence simulation of the Cayley step, SQ-JEPA rollout or Kuramoto ratios was run.
- Gate 2 normal-vector normalisation and the taste-curve percentages were checked for internal consistency only.

## Pass log

- Sweep 1 (Step 1 translation; Step 2 checks 1–8 on the cards): 32 new (#1–12, 14–17, 19–26, 28–31, 33–36).
- Sweep 2 (Step 3 regrowth and diff, then Step 2 re-check on the regrown cards): 4 new (#13, #18, #27, #32).
- Sweep 3 (Step 2 re-check on the final cards): 0 new. Stopped.

## Self-report on the skill

(a) Steps executed and shortcuts.
- Step 1: R0 and R1 written. R2 cards were kept in working memory, not written out. The translation rule was applied, and OPAQUE was used once (#36).
- Step 2: all eight checks were run. node was used for the ledger sum, the spider count, the sector span, the weight sum, the CRC variants, the 4096 worst case, the 2^53 decrement and the NaN and −∞ guards. A float re-sum test on a 85/15 split returned 0 failures out of 2000 and was dropped.
- Step 3: shortcut. The full plan was already in context, so the "without re-reading" condition was not met. I regrew only the elements where I had already seen seam, boundary or undefined-symbol issues (Branch 0, Taste, origin64, somatic, Wave 7, Part 5 CapitalEmpire, Part 6), not all seven at ≤ 10 lines each. The diff was informal.
- Step 4 and output items 1–3 were done. Sweep 3 "0 new" is a re-check of my own cards, not an independent pass.

(b) Findings that Reduce, Regrow or Diff produced and a normal read would likely miss: #13 (ray 7 unassigned), #18 (open interval at ±512 with no rebase trigger), #27 (Wave 7 denominators), #32 (unclamped deltas), and #36 (operational OPAQUE terms). #15 (grudge versus score) and #9 (undefined symbols) came from the seam and homes checks. The high-impact items (#6, #8, #11, #20, #28, #30) came from the recount, operator-breaker and units checks on the cards. Those are recount payoff, not Reduce payoff.

(c) Attention without payoff, and ambiguity.
- The OPAQUE translation rule produced term-level notes on framing vocabulary (W2/W3, Veiled Ego, SQ antidote presets). That costs review effort, and framing is excluded from defects.
- Regrowth was the most expensive step and added only 4 items in sweep 2. The blind condition cannot be enforced in one context.
- Ambiguous: whether R2 cards are output; whether a "sweep" includes Step 3; whether "ornament" overlaps the framing exclusion; and a single zero-sweep stop rule, which is weak.

(d) Suggested concrete edits to the skill.
1. Step 3: run regrowth in a fresh subagent or cleared context, passing only the cards. Otherwise state that the diff is not independent.
2. Step 1: define OPAQUE as "term used in a formula, invariant or seam", and exclude framing vocabulary explicitly.
3. Step 2: add a units pass. Give each formula a dimension vector and require matching operands for +, min, max and comparisons (catches #6, #11, #20).
4. Step 2: add a float pass. Check counters and decrements past 2^53, and test exact float equality with a tolerance (catches #28).
5. Step 2: add a size pass. Compare sum(slot cap × worst line length) against any byte invariant (catches #8).
6. Step 2.7: make homes mechanical. Diff every package and script name in headers, bucket lists and the ledger against the tree (catches #25, #26).
7. Step 2: recount every headline number in the header and ledger (catches #1, #2, #35).
8. Stopping rule: define a sweep as Step 2 plus the Step 3 diff, and require two consecutive zero sweeps.
