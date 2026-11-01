# Evidence for "The bridge, Pass R39"

One section per run, in the order they ran. Each gives what ran, the main results with their labels, and the caveats.

The labels are those in `REPORT.md`. Numbers are copied from the run records; only the seven repository gates were re-run for this file.

The working files of these runs (scripts, outputs, prototypes and saved web pages) are outside this repository. Two automatic web reads saved PDF files outside the repository, against the project's no-download rule. Neither was opened, and they are listed for deletion in the run notes, not here.

## 1. The Skill's "four paths, one end" run (2026-10-31)

**What ran.** Three readings ran in parallel: physics, design and adversary. Each asked whether Piskriek's four groups reach one end:
- plasma_helicity: #1, #2, #5, #6, #14;
- three_six_nine: #3, #4;
- resonance_gate: #12, #13;
- nested_ledgers: #8, #9, #10.

A decision step then reconciled them and proposed a plan, and a fresh claim-strength reviewer read everything.

**Physics reading** [published, measured; the PRL and the oscillator paper were read from their text]:
- **The MST device** (McCollam et al., PRL 96, 035003, 2006; Nonn et al., Rev. Sci. Instrum. 82, 064701, 2011):
  - two tuned tank circuits run at about 280 Hz, with their relative phase set by trigger timing;
  - injection goes as sin δ;
  - antidrive lowered the current, and a single oscillator gives no net injection;
  - the sawtooth crashes became periodic, locked to the drive;
  - efficiency is about 0.1 A/W;
  - the current peaked near π/8.
- **HIT-SI** served as a cross-check [published; part conference-level].
- **Model checks of established algebra:**
  - the rate formula;
  - helicity per cycle equals 2 × the signed area of the flux orbit;
  - a bare LC frequency of 269 Hz;
  - three injectors at 60° or 120° give a constant total.

**Design reading** [model, one parameter set, in-sample]. It built a composed prototype of the gateway.
- Ten invariants passed:
  - bitwise non-regression against `drawGateway` over 300 steps;
  - the 22 existing tests;
  - scale covariance to 9.4e-15.
- **Relay starvation.** With the same ratio, 1.25, at both ports, the life draw fell to 3e-12 W. The flow came back at a top ratio of 3.75 or more: 0.881 W.
- A naive two-sided cap left the source 103 J below its floor.
- Four planted defects passed their own path's checks and were caught only by the composed tests.
- The resonant sharing law gave 17.2% less than test T3b's exact value at C = 0.396.
- With the helicity port, a mean-1 clock table changed nothing: 56.306 J in every case.
- The steady-state identity P = (Λ/2)·K/τ_K held to 1.0005, which is the step-splitting error.

**Adversary reading** [model + established].
- The groups are layers, not paths.
- A probe of the six-step clock on two axes:
  - generator 2 injected +0.144 per cycle, and generator 5 injected −0.144;
  - the {3,6} channel injected 0;
  - a single coil, and generators 2 and 5 together, injected about 1e-18 (zero to rounding).
- In a reduced toroid:
  - 10 J of forward drive locked 10 J;
  - inverse drive released 10 J, sending 20 J to heat;
  - single-phase drives sent everything to heat.
- Steelman: {3,6,9} as a balance meter.

**Decision** [inference]. The owner is partly right: energy going down has one end, as four layers of one port, and harvest going up has no shared end.
- It re-ran the design prototype: 22 of 22, and the tower case reproduced.
- It proposed a report and a build in parallel, the harvest check after the owner's answer, and an optional triage.
- It folded the 12 unchecked candidates, from summaries only.

**Fresh claim reviewer.** The verdict as first worded does not hold. Corrections:
- "One machine holds all four groups [published, measured]" becomes: the device facts are measured, and the matching is inference.
- "Four necessary layers": showing that no group is sufficient alone does not show that each is necessary. The prototype has no drive rotation, takes its sign from K and shares proportionally. So two groups carry the load.
- "Converged" fails the Skill's convergence rule. The readings ran in parallel and disagreed on the count (4, 3, 0). Their identical verdict strings suggest a fixed list of options.
- Gate Q3 was applied unevenly: "one object at the end" is partly built in by the search.
- "Energy going down holds [measured]" holds only in a trivial sense: one lab device.
- **Physics-reading errors:**
  - energy and charge are tied at any injector port, not only in a relaxed state (P/(dK/dt) = I/(2Ψ), and the Woltjer bound) [established];
  - "1 MW" is the circuits' capability; the shots were roughly 0.2 MW [inference];
  - its claims made from absence about counter-rotating fields were overstated.
- **Adversary errors:**
  - zero-sequence current is zero for a balanced linear load on a 4-wire system, and a 3-wire system carries none whatever the imbalance [established];
  - "a steady draw needs AC" holds only for an inductive port, since DC coaxial injection is steady [published].
- **Design-reading errors:**
  - the global-circuit arithmetic, corrected to about 0.5–2 µW/m²;
  - its decisive test checks conservation that was designed into the port, so it tests the code, not convergence;
  - its 3-6-9 negative was read at a saturation bound.
- **Credit fix.** The G·C·P form came from the Sonnet physics brief. P_local and the fractal principle are the owner's, and 0.81/0.09 is Argon's.
- **Missing items it added:**
  - Argon's 3-6-9 steelman, through harmonic sequences;
  - measured forms of the counter-spun pair: a single oscillator gives no net helicity on MST, and counter-helicity merging (TS-3/TS-4) heats ions [published];
  - a dynamo variant of "the charge goes up";
  - the relay rule matches published high-λ-to-low-λ helicity flow (Jarboe et al., arXiv:1712.01247);
  - the port type decides whether a phase layer is needed at all.

**Caveats:**
- The 14 "holds" results that fed the run are in-sample, one candidate at a time.
- This was one pass.
- Some sources are search-level.
- The reviewer did not re-run the prototype numbers or the repository gates.

## 2. The sweep (2026-10-31)

**What ran.** Four researchers covered sacred geometry, ley lines and Earth grids, the pyramid scans, and the topics around Ra's gaps. Each was followed by an adversarial checker told to push against both believers and debunkers. One synthesis then used only the corrected forms.

**Main results** (details and every label in `four_areas_note.md`):
- **No new source of energy** [inference].
- **Exact facts:**
  - Poincaré–Hopf: only the torus carries a field with no zero [established];
  - helicity equals linking (Moffatt 1969) [established];
  - the Flower of Life lattice and three-phase power share the cube roots of one [established];
  - the golden ratio is the least approximable number [established].
- **Measured examples:**
  - 565 of 768 sunflower spiral counts were Fibonacci numbers;
  - nautilus shells measure about 1.31–1.33, not 1.618;
  - the north magnetic pole drifted about 36 km in 2025;
  - Birkeland currents run at 2.7–5.2 MA;
  - the Big Void (2017) and the North Face Corridor (2023) were found.
- **Chance baselines** [model]:
  - with 10 unrelated lengths at ±2%, some pair looks "golden" 60% of the time;
  - by pure chance, a 40 × 40 km map holds about 175 sets of four and about 10 sets of five churches in a 50 m line, and clustering raises this 1.5–2 times.
- **Published:**
  - the Sun-to-Earth coupling is about 3 times larger by field direction for total energy, and 30–100 times for storm energy;
  - the Khafre method paper was retracted on 10 August 2026.
- **Ra:**
  - a stated policy of giving principles and withholding specifics (6.26, 29.31, 64.9) [RA; GUIDE];
  - topics never asked about, by keyword search across 106 sessions [measured, keyword search only];
  - Ra's numbers conflict with the record (1.16 against 6.28; Giza and Nazca dates);
  - harvest as a read-out (51.1) [RA; GUIDE].
- Eleven bridge additions [design], each with a test that can fail, and three owner questions.
- **Ra checks** [measured]: 35 session pages were fetched. 66 quotations with citations were tested word for word against their session.question, and all 66 passed. Four planted false quotations all failed.

**Caveats:**
- The figures come from the topic reports as corrected by their checks; they were not recomputed in the synthesis.
- The absence claims rest on keyword searches. Two independent checks reproduced them, but the synthesis did not rerun them.
- Several sources are search-level.
- A fresh claim-strength reader checked the public copy against the synthesis before commit, without recomputing figures.
- In this public folder, Ra's words are paraphrased.

## 3. Check of Argon's R39 module (code audit)

**What ran.** A Skill check on a byte copy of Argon's module, identical to the copy Argon showed in its Canvas. It included:
- planted defects inside copies of the module's functions;
- probes of each claim;
- a run of the repository's 22 tests through an adapter;
- 5,000 random trials for brittleness.

**Results** [measured, on a copy].

**Planted defects:** 30 planted, 10 caught by Argon's suite. By function:

| Function | Caught / planted |
|---|---|
| gateway step | 6/15 |
| aperture | 0/3 |
| smoothstep gate | 1/1 |
| phased drive | 1/4 |
| D2 rebirth | 2/6 |
| amplitude bound | 0/1 |

**Defaults** (High). The module departs from R38 in five ways:
- strain carried at death;
- the floor on;
- a 0.707 phase factor;
- a missing balance opening the gate (309 J);
- an unknown stage drawing 515 J.

**Constants labelled approved without approval** (High): Λ = 9 and a 0.15 floor. Neither appears in Plan §8.6, B179 or the repository.

**Units** (Medium). It used no time step: 255.4 J per call, against the reference's 361.2 J (one step of 1) or 84.3 J (ten steps of 0.1). It also scaled by the target's P_local.

**Wiring** (Medium):

| Swapped in | Repository tests passed |
|---|---|
| draw only | 20/22 |
| gate only | 20/22 |
| rebirth only | 21/22 |
| all three | 17/22 |
| the earlier composed prototype, for comparison | 22/22 |

With no Wmax cap, a target overfilled to 25,774 J in 50 steps.

**Inert flags** (Medium):
- d1, d3, d5, d7 and d9 had no effect;
- "HYBRID" had no branch;
- the harvest mode only echoed its name;
- D8 multiplied its effect by 0;
- the D6 loss read no misuse record, costing 25% at the default phase (387.9 J against 515.5 J).

**Signs** (Medium):
- antidrive was clamped to 0;
- a left-handed K = −5 ended at +57.3;
- the loss made antidrive stronger (−0.707 became −1.207);
- the loss was not booked as heat;
- the coded peak runs from π/2 (misuse 0) to about π/6 (misuse 1), so it cannot reach π/8.

**Checks by construction** (Medium):
- the covariance ratio is constant by construction while no cap binds;
- the exact-zero helicity check false-alarmed in 5,906 of 25,000 steps;
- 4 trials had every draw at 0, where the check passes vacuously.

**Low:**
- the D2 function's field names do not match the `ms` grammar;
- debt is not capped at 64.

**Credit:**
- the gate never leaked in 360,000 random evaluations;
- the R38 constants match;
- the classifier signs are right;
- the amplitude bound is right (0.4 at c = 0.6);
- the D2 debt fix works;
- Argon's self-reported bug reproduces;
- its exact 6-decimal check catches a 1e-5 J fee.

A draft improved suite caught 29 of 30 (in-sample, written after the mutants) but missed that fee.

**Caveats:**
- The mutants were chosen after reading the code, many aimed at suspected gaps, so 10 of 30 is not a detection rate.
- The adapter mapping is the checker's own construction; the failures came from missing parameters, not from the mapping.

## 4. Check of Argon's R39 reply

**What ran.** A claim-strength and correctness check of the reply against the module, the Plan, published MST work (abstracts and search summaries) and the brief, with the algebra recomputed.

**What holds:**
- **The MST algebra** [established]: the peak is at sin δ = a/(2b). A ratio b/a = 1.3 gives 22.6°, against π/8 = 22.5°; exactly π/8 needs 1.3066.
- **The MST facts, and the dissipation half** [published, search-level; credit to Argon].
- **The D4 arithmetic** [established]: the logistic gives 0.5000 at 0.81 and 0.1192 at 0.63.
- **Argon's self-reported bug** reproduces [measured].
- **The module** has no side effects on import.
- **The rulings** are framed as proposals.
- **The plan fits the budget** as staffed: 5–7 agents now, up to 9 with the harvest check.

**Findings:**
- **High:**
  - the sin²δ law was labelled published, but it is an unpublished ansatz;
  - "default-off, zero regression" was false as delivered.
- **Medium:**
  - MST's second port is real: its main transformer;
  - the module cannot reach π/8;
  - D6 is given three meanings, and a clean record still pays a cost;
  - Λ and the floor were labelled approved;
  - the D2 code carries strain across death;
  - step 2 understaffed: 5 checks on 2 agents;
  - the skip row: 12 unchecked candidates, not 10, the triage's label, and #25 and #26 dropped;
  - the covariance check holds by construction.
- **Low:**
  - a result labelled [model] in the brief was relayed as [measured];
  - several labels were one step too strong: a mirrored ledger called "established", checks that "never break", the "balanced" qualifier dropped from Fortescue, and (0,0,0) called a fibre rather than a regular point on the axis fibre;
  - two Ra date conflicts were merged into one;
  - the Landauer flag is not implemented, and the port-type rationale leaves out the DC trade-off.

**The ansatz's predictions** [established algebra, tuned to π/8]:

| δ | −π/2 | 0 | π/8 | π/4 | π/2 | 7π/8 |
|---|---|---|---|---|---|---|
| J/a | −2.31 | 0 | 0.191 | 0.054 | −0.307 | 0.191 |

The zero crossing is at 49.9°. The earliest peak with J(π/2) ≥ 0 is π/6.

**Caveats:**
- The published items come from abstracts and search summaries.
- The sign of MST's added current at π/2 was not confirmed.
- One web read saved a PDF, which was not opened.

## 5. Checks of candidates #13 and #14

**What ran.** One agent ran the correctness and buildability checks for both candidates. That makes two-agent cross-checking together with the fold check, not independent passes. It used:
- new integrators: implicit midpoint with an exact discrete gradient for #13, and Newton implicit midpoint for #14;
- parameter sweeps;
- prototypes built against the reference, imported read-only;
- planted defects.

**#13, the synchronous tie** [established, recomputed; model where marked]:
- **Lock.** Served/demand was 1.000000 at 0.5, 0.95 and 0.99 of P_max, with the lag matching asin to 5 digits.
- **Step limit.** Undamped, it is 0.724611. It does not depend on J only while the first swing stays slower than the field; at J = 0.3 it moved to 0.822. Damping raises it: 0.75, 0.864 and 1.0 at D = 0.05, 0.3 and 1.
- **Energy balance.** Residual at most 2e-12 with the gate term. Without it: 1.6% (gate closing under load), 100% (gate opening) and 0.36% (headroom drift).
- **Adler slip** [model]: 0.0399 against 0.0402, and 0.3381 against 0.3317.
- **No hard cap** [model]. A linear damper let the inflow reach 4.67× P_max and the served power 1.30× P_max.
- **Re-lock thresholds at D = 0.05** [model]: 0.63 (J = 1), 0.85 (J = 0.3) and 0.21 (J = 3), the same at three time steps.
- **Ungated damper** [model]: 7.6 J crossed a closed gate.
- **Finite bus** [model, one topology]:
  - two entities at 0.6: each was served 0.037;
  - a greedy 0.7 beside a modest 0.4: both collapsed (0.007 and 0.129);
  - 0.7 beside 0.25: both held.
- **Prototype:** tests S1–S6 pass, and 5 of 5 #13 mutants were killed.

**#14, the counter-spun pair** [established, recomputed; model where marked]:
- **A single field with no momentum sink** gives total energy equal to Ω times the angular momentum it can absorb; late power falls to 2e-14. With a sink, it draws 0.043 or 0.150.
- **The differential law** matched to 4 digits:

| Second field | Steady draw |
|---|---|
| counter-rotating (+1 against −1) | 1.19 |
| +0.5 | 0.67 |
| static | 0.30 |
| same sense, slower | 0.074 |
| co-rotating | 0 |

- **One rotor in a pulsating field** runs at 0.995 and draws 0.2. Stalled, it draws 0.396, all as heat.
- **Hysteresis** [model]: a window from 0.6 to 1.5 at sm 0.1, and none at sm 1 or with a linear law.
- **The low branch** draws 0.16–0.38, which is 14–32% of the high branch [model].
- **Sources:** Clemente (1998) abstract, via a university repository [published, search-level]. The Visentin thesis returned an error, so it is known from search summaries only.
- **Corrections to #14's own test:** it must say "with no momentum sink", and the zero-torque check is only a consistency check.
- **Prototype:** tests K1–K5 pass, and 3 of 3 mutants were killed.

**Combined** [measured, in-sample]:
- the prototype tests pass 11 of 11;
- 8 of 8 planted defects were killed;
- the reference's own suite still passes 31 of 31, unmodified.

**Caveats:**
- Some citations are recalled from memory and labelled so (Adler; Stewart-McCumber; RSJ).
- The finite bus used one topology.
- The checker chose the parameters.
- The prototypes are outside this repository.

## 6. Check of the fold (#15–#26)

**What ran.** One agent read the full texts of #15–#26 against:
- the D1–D10 syntheses;
- the verdicts on #5 and #9;
- the Plan;
- the reference, imported read-only.

It also ran arithmetic and ledger probes.

**Results.** The placements are inference; the probes are arithmetic or in-sample runs on the reference.

| # | Placement | Verdict | Key point |
|---|---|---|---|
| 15 | #3 and #5 | holds, corrected | Only inside #5's amplitude band. Argon's full-amplitude T1 forces K = 0 at phases 0 and 3. The injected charge is set by the quadrature term (#15's s2), not by its "latitude s3". Argon's T1 test passes with a planted defect. |
| 16 | #9 | holds | The block discrete gradient is necessary, not sufficient (one of six conditions). A build requirement, not an owner decision. |
| 17 | #9, plus the harvest step | fails | Its host-budget port contradicts D8's guard rail and P_local = 9·3^k. The cost of forgetting arises under any choice. |
| 18 | the harvest step | holds, corrected | Its rival gate gives 0.1887 at balance 0.855 against 0.5; its C and P_local also replace approved forms. Keep only the information ledger. |
| 19 | D1 and D7 | holds, corrected | Replay must not write the bias more than once. RELEASED must not close an open cause. Rank by `err=`, not `ex=`. |
| 20 | the harvest step | holds, corrected | A provenance defect in `stepSymbioticUniverseBridge`. The host model as higher self is a consent question. Aggregate packets carry about 0 bits. |
| 21 | D4 | holds, corrected | It argues for D4's option C or b_eff, not A. Its gate first opens at 0.9405 and is 0 at 0.855. |
| 22 | D9 | holds, corrected | Draw-time misuse contradicts D6. Purpose binding is open. |
| 23 | D2 | fails | The forgiveness mechanic belongs in §8.4 Q3. Its karmic energy breaks the world ledger (residual 0.5). |
| 24 | the harvest step, #9/#10 | fails | Both halves belong in D2. The vessel's energy vanishes at death, and chemical debt staying with the body conflicts with D2. |
| 25 | D5 | holds, corrected | A stored Choice flag contradicts D3. W(0.5, 0.5) = 0.9989. 47.5% pass the harvest line by noise. |
| 26 | D4 and the R38 gate | fails | Reading violet contradicts B162. The Indigo merge is D9(g). Adepts only is an open question. |

**Process notes:**
- The Landauer half of #17 was gated on the wrong condition.
- Losing #21 removes one of the two candidates behind the design reading's stopping rule.
- The fold map's per-reading labels "D1" and "D4" collide with the owner's decision numbers.

**Caveats.** The placement judgements are inference. Everything run was arithmetic, or in-sample on reference behaviour.

## 7. The build, its audit and its fix

### Builder

**What it added.** A Bridge section at the end of the reference, plus two marked option additions (`createEnergyLedger`, `rebirthTransfer`). Nine tests were added, 22 to 31, with 0 lines of the original 22 changed.

**Mutation** [measured, in-sample]: 47 planted defects, 46 caught. The one survivor is a near-equivalent guard.

**Every choice the builder made is listed as an owner decision.**

**Ported from the earlier composed prototype:**
- the two-sided source;
- the shared tag;
- mirrored helicity;
- the tower check;
- the merge guard.

**Not ported from it:**
- joint or resonant allocation;
- heat up-ports;
- the scale-role table;
- its λ ratio, replaced by an explicit Λ.

**Ported from Argon's module:**
- the three-phase classifier, which now throws on a bad order instead of defaulting to 9;
- the amplitude bound;
- the D2 review share and q, as options.

**Not ported from Argon's module:**
- its defaults;
- Λ = 9 and the 0.15 floor;
- its unused flags;
- D4, D6 and D8;
- antidrive clamped to 0;
- its by-construction tests.

### Auditor (different lens)

**Findings:** 1 High, 2 Medium and 7 Low.
- **High:** reverse could carry K through zero.
- **Medium:**
  - a double negative drove forward;
  - the tower check's individual checks were never shown failing.

**The default path is identical** [measured]:
- its own differential ran 60,220 checks with 0 differences;
- the new tests, run against the R38 module, matched the recorded digest;
- 20,000 random draws matched `drawGateway`.

**Mutation** [measured, in-sample]: 76 of 88 non-equivalent mutants caught (86%).

**Privacy:** a scan of the 616 added lines found no local paths, user names or e-mail addresses.

### Fixer

**Fixes:**
- the High: a reversed flow now stops at K = 0;
- the first Medium: a double negative is now antidrive, and both sign conventions are named as owner decisions;
- the second Medium: six broken towers, each of which must fail on its own check.

**Mutation** [measured, in-sample]:
- its own 19 mutants: 18 caught;
- the auditor's set re-run on the fixed code: 82 of 91 caught.

**Differential:** the auditor's script, re-run on the final module: 301,031 seeded comparisons against R38, 0 differences. The differential tool flags 6 of 6 planted default-path changes.

**Gates:** all seven pass.

### Follow-up edit (verified for this file by reading the code and the tests)

Tests now cover:
- merge only when `merge` is exactly true;
- a negative amplitude beyond the bound;
- the helicity ledger's magnitude.

Code changes:
- the tower check reports a level with no energy ledger instead of crashing;
- the default-path test compares the module with a frozen copy of the R38 module (`scripts/fixtures/`) instead of a digest recorded on Node 24.

Comments now state:
- the D2 departure from R34;
- the unbooked K in a merge without helicity ledgers;
- the headroom scaling of reverse flow;
- that the MST citation is cited, not reproduced in this repository.

This edit was not re-measured by mutation.

### Re-run for this file [measured]

All seven gates pass on the working copy:
- semantic 15/15;
- formula spine 47/47;
- the count audit agrees (153 keys);
- the gap map --strict exits 0;
- the red-team audit verifies all invariants;
- the reference tests pass 31/31;
- the gate mutation test catches all 11 of its mutants.

**Caveats:**
- All mutation figures are in-sample.
- All runs here were on Node 24; CI runs Node 22. The default-path test now compares the module with a frozen R38 copy on whichever Node runs it, so it no longer depends on the digest recorded on Node 24.
- The fixer's one survivor is a boundary difference below rounding: a reversed flow stops about 1e-16 above K = 0.

## 8. Argon's overnight check-in reply (2026-11-01, about 00:40 UTC+2)

**What happened.** Opus sent Argon the R39 audit results with four questions. Argon's reply was captured from the page; the duplicated maths rendering was removed.

**Results:**
- **Plan change.** Argon agreed with the replacement plan: port only verified pieces, strip the defaults from every unapproved option, and plant defects inside the target functions. It agreed that step 2 was two-agent cross-checking, and that 12 candidates are unchecked.
- **(a) Antidrive.** Two options for the ballot:
  - A1, a rectified "diode" port;
  - A2, a signed reversible transfer, default-off, which Argon recommends. A2 has three guards: the target's gate still applies, the target has a floor, and only the reactive part reverses while dissipation stays local and irreversible [design].
- **(b) Whose P_local.** Use the enclosing source's P_local·Δt, matching §8.6. Adjacent rungs differ by exactly 3, so a per-port coupling of at most 1/3, or a crowding share, keeps covariance. For links that skip levels, use two-sided scaling. Whether such links exist is for the ballot [design].
- **(c) The sin²δ loss.** Argon accepted relabelling it [hypothesis: unpublished ansatz], and split it as follows:
  - [published]: injection goes as sin δ, phase-dependent decay is largest near π/2, current peaks near π/8, and the main transformer carries about 90%;
  - [hypothesis]: the analytic b·sin²δ;
  - [design]: coupling it to D6.
  - It offered a two-parameter form, sin δ/(1 + β sin²δ), as context only.
- **(d) Re-check of the audit.** Argon said none of the measured audit findings is wrong. It added two defects of its own draft to leave out when porting:
  - 6-decimal rounding of returned ledger values;
  - sign erasure in its harmonic classifier.
  - It also asked that missing stages and reserves throw rather than fall back.

**Opus checks of Argon's new algebra** [established algebra]:
- For f = sin δ/(1 + β sin²δ), f′ is proportional to cos δ (1 − β sin²δ). So the peak is at sin²δ = 1/β.
- β = csc²(π/8) ≈ 6.8284 puts the peak at π/8, with f(π/2) = 1/(1 + β) > 0.
- Tuning the polynomial form to π/8 needs b/a = 1/(2 sin(π/8)) ≈ 1.30656, which forces a −30.7% net value at π/2.
- The coded coefficient b = 0.35 + 0.65·misuse gives no peak shift for misuse ≤ 3/13 ≈ 0.2308.
- All of these are correct. But two free parameters fitted to one observed peak are still not evidence for the form (C29).

**Caveats:**
- The reply was captured from page text.
- Argon's endorsements are proposals, not Piskriek's rulings.
