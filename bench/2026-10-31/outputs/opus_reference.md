# Opus 5.5 reference pass — original (unseeded) plan + resume + audit script

Written before reading any agent output. Tools used: full read of all 3 artifacts + script, `verify_claims.mjs` (CRC32, counts, span, package diff), running the audit script.

## Verified TRUE (credit)
- V1 CRC32 tails `0x499A7731` (plan) and `0xAC5D6F83` (resume) recompute correctly over the shorthand body lines.
- V2 KL term x - ln x - 1 >= 0 with equality at x=1 (checked 0.5, 1, 2); formula in Part 7 is correct as written in the original.
- V3 Vacuum floor: p_eff(1e-3)^0.08 = 0.575 -> T_melt min = 28.8 K > 0. Claim holds.
- V4 Log-bijective rho/E maps are mutually inverse on the clamped range.
- V5 Plan state vector enum has exactly 24 slots (0..23), matching Float32Array(24).

## Natural defects (N)
| # | Location | Cat | Defect | Evidence | Sev |
|---|---|---|---|---|---|
| N1 | Part 8 heading + table | ledger | Heading says "ALL 70 DEFECTS CLOSED"; table rows sum to 70 and have no Pass R24 row (B71–B74), while every status line claims 74/74. | rows 23+13+5+12+6+3+4+4 = 70 | H |
| N2 | Part 8 R25 row | count | Row title "15 Operators" vs body "all 16 V2 operators" (script: 16). | | L |
| N3 | §2 spider heading | count | "32 Verified Sub-Branches" — diagram has 41 (6+6+10+5+5+5+4). | counted | M |
| N4 | Part 4 §1.1 | stale number | "spans ±9.75e7 ly": 2^63 × 131,072 m = ±1.278e8 ly. 9.75e7 is exactly the 100 km-sector value → stale from before B46. | node calc | M |
| N5 | Part 5 §4.1 tree | live-wiring (C8) | 16 packages are named as targets/ports elsewhere but have no folder in the tree: strata, somatic, archetypes, anim-taste, gauntlet, governor, studio-core, smc-nexus, open-host-sdk, harness, meshops, kitspec, kinematic, orbital, treegen, groundshader. Waves 3/4/6 tell the engineer to build @hm/strata, @hm/somatic, @hm/smc-nexus, @hm/open-host-sdk. | package diff | H |
| N6 | Part 5 §4.1 scripts | self-defeating gate | `verify-clean-slate.mjs` "fails if moon_crater, A4-01, leaks, or .glb exist", but the Plan (and Resume) sit at repo root and contain those tokens (3/3/3/8×). Gate fails on its own constitution unless scope is defined. "leaks" also matches ordinary English. | grep counts | H |
| N7 | Part 1 §1.1 | math/dimensional | Update mixes a Cayley resolvent with an implicit-midpoint gradient (double implicit), and `+ G u` has no Δt, so the control effect depends on step size. Passivity needs R ⪰ 0, J = −Jᵀ, M ≻ 0 — not stated. | | H |
| N8 | Part 4 §1.2 | physics/units | Phase term ω_k·|d| multiplies rad/s by metres (needs wavenumber k = ω/c). Separate stars are incoherent sources, so summing complex amplitudes invents interference fringes. | | M |
| N9 | Part 1 §2.1 | units | p_eff = max(1e-3, 0.08·Pxd, p_atm): dimensionless Pxd mixed with pressure; p_atm unit unstated (atm vs Pa changes p_eff from 1.0 to 2.52). | 101325^0.08 | M |
| N10 | Part 2 §2 Gates 2–3 | div-by-zero | S_sym divides by (m_L+m_R) (0/0 → NaN, and Math.max(0,NaN) = NaN); ω0 = sqrt(g/h_CoM) with h_CoM=0; r_RCS / r_support = 0 unguarded. | | M |
| N11 | Part 2 §2 Gate 2 | discontinuity | Hard switch at safeG = 0.05: just above it, ω0 → small, ξ → huge, S_stab → 0; just below, the zero-G formula may pass. The same craft flips pass/fail on low-g bodies. | | M |
| N12 | Part 3 §3 | spec gap | Nemesis score→tier thresholds never defined (score 0..10, 5 tiers). Example `score=2.23 tier=MURDEROUS` can't be validated. How temper multiplier combines with severity is unstated. | | H |
| N13 | Part 3 §2 | units/conservation | "Strain" means κ (dimensionless, Σκ ≥ 2.2) in Part 3 but somaticStrainJoules (J) in Part 6; E_vent = 18.5·Σκ J has no source or sink, so it breaks the conservation story. `runaway` stage isn't defined from κ/ticks. | | M |
| N14 | Part 1 §1.2 vs script | spec/impl | Grammar caps `me` at "top 4 ex + 28 recent"; reference parser keeps only the last 32 (slice(-32)), dropping high-ex episodes. | script L620 | M |
| N15 | Resume §3 vs grammar | schema | `mb ... held=none` — grammar requires `held=<SQId>`; `resist=elem:blind-red-team` isn't an element; `resist` value has 2 colons so the parser must split on the last one (unspecified). | | L |
| N16 | Part 2 §1.2 | symbol clash | E_max means 1200 GPa (Young's) in Part 1 and max epoch in strata burial formula. | | L |
| N17 | Part 4 §1.1 | representation | Orbital Float64 already spans the whole sector [−65536, 65536) and the local Float32 (−512, 512) adds on top, so one world point has many encodings. The rebasing rule isn't in the plan, which breaks equality and seed-replay (C18). | | M |
| N18 | Part 7 §4 | collision | Child-universe seed uses only Pxd and Lx (Vtx, Aq ignored; ~1e7 values), so distinct parents collide, contradicting C18 "divergence on distinct seeds". | | M |
| N19 | Part 5 §2 | div-by-zero/scale | H_circle divides by N_total (empty circle); uses ray ∈ [0,1] while `ch` rays are Int8 ±127. | | M |
| N20 | Part 7 §1.2, Skill 1.6, C25 | architectural overclaim | "SQ-JEPA" is described as encoder f_θ / predictor g_φ / energy head modelled on V-JEPA 2. The reference implementation is a hand-coded loop (rest cycle + forgiveness + precision decay) with no learned representation, and "converges in one pass" holds by construction (horizon = debt+4). Skill Step 1.6 asks a language model to roll out latent states to E ≤ 1e-9, which can't be executed or checked. | script L669–735 | H |
| N21 | Part 5 Wave 7, C26 | fabricated metric | `v2EvaluateCrossTierModelDistillation` returns hardcoded constants (Haiku 0.34→0.915, Sonnet 0.56→0.965, 2.5×, 60% savings). Wave 7 presents them as something to "record/verify". Model names Sonnet 4.6 / Haiku 4.5 are stale. | script L786–823 | H |
| N22 | Resume §1/§5, wake-up prompt | unrunnable gate | The audit reads `/working_dir/c_9eee056efdcd0303/...` (Argon's sandbox) and throws at B61 on any other machine. At least 6 recordBreakAndFix calls pass a literal `true` as their invariant (B58, B59, B62, B66, …). Document checks only test whether tokens are present (e.g. "74 / 74" present ≠ ledger sums to 74; N1 passes). | ran it | H |
| N23 | Part 1 §1, Part 8 | unverifiable provenance | Cited scripts (`sq_full_universe_fractal_audit.mjs`, `verify_pass9_twenty_pillars.mjs`, `verify_pass11_autopoietic_universe.mjs`) and prototype stats (3,848 tests, 2,606 mechanics, commit 6519c461) aren't in the repo or the Drive bundle. | | M |
| N24 | All 3 Drive docs | storage corruption | Markdown→Google Docs conversion stripped `_` pairs, e.g. `\mathcal{L}{\text{KL}}`, `\text{arrival}{01}`, `\mathbf{s}b`. The "canonical" formulas aren't the intended ones. | docx XML | H |
| N25 | Owner prompt vs files vs script | version drift | Wake-up prompt says C1–C25 / 70/70 / R15–R23; files say C1–C26 / 74/74 / R25; script header says C1–C25, 70/70, R15→R23, and `runPassR23` returns passId 'R25'. | | L |
| N26 | §2 diagram | structure | Branch 7 is drawn as a child of Branch 5 (`└── [BRANCH 7…]`) but treated as a primary branch everywhere else. | | L |
| N27 | Part 6 §1, Part 7 | undefined vars | Indigo gate uses Will, Faith, bal_rays with no range/source; Mask law "+0.25 town tension" has no cap or decay. | | L |
| N28 | Part 5 §1 A1 | units/realism | 0.45·P_in (N/W) implies v_e ≈ 4.4 m/s; unit not stated; ion/rocket presets from KSP/SE can't satisfy it, and they're Bucket B ports. | | M |
