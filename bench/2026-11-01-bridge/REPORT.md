# The bridge, Pass R39: report and ballot

*For Piskriek, 2026-11-01. Written by Opus (Claude) from the records of the overnight runs. You asked Argon to choose where the bridge work goes next. This report says what Argon chose, what ran, what the checks found, and which decisions are yours. Nothing here is ruled until you rule. The full ballot is §10; `BALLOT.md` in this folder is a one-page answer sheet for it.*

**Labels.** Every claim carries one:
- [measured]: counted or run in these passes ("by reading" means checked by reading the code or text)
- [established]: textbook
- [published]: peer-reviewed, not settled. "Abstract level" or "search level" means only an abstract or a search summary was read.
- [model]: a computation from these runs, with settings its author chose
- [inference], [hypothesis], [metaphor]
- [design]: a choice for the simulation, and yours to make
- For Ra: [RA] Ra's statement at the address given, paraphrased in this public copy (in the working copy, a quotation checked word for word by script against lawofone.info); [GUIDE] our inference; [COMMON] an unverified community reading.

"In-sample" means the test or the planted defect was written by someone who had already read the code or chosen the settings. It shows that a check *can* fail; it is not a rate at which unseen defects are caught. "One parameter set" means one run's settings.

**Words used.**
- *G*, the gate: exactly 0 at or below balance 0.81, rising smoothly to 1 at 0.90 [design, approved in R38].
- *C*: how coherent the toroid is, times its headroom.
- *Headroom*: how far the toroid is from full, 1 − W/Wmax.
- *P_local*: the power the enclosing level supplies locally, 9·3^k by stage [design, approved in R38]. A draw gets P = G·C·P_local.
- *Helicity* (K): the twist of the toroid's field, the "charge" it carries. Its sign is its handedness.
- *Taylor floor*: the least energy a toroid can hold with a given twist.
- *Λ*: the energy carried per unit of helicity moved through the port.
- *Antidrive*: running the port backwards.
- *MST* and *OFCD*: a real plasma device (the Madison Symmetric Torus) and its oscillating-field current drive, which charges a plasma ring with helicity using two phased voltages [published].

## 1. In short

- **Argon chose the order** [measured, from Argon's reply]: build the composed gateway into the reference code with everything off by default; finish the checks on #13 and #14 and check the fold of the 12 unchecked candidates; write this report and ballot; run a harvest check only if you rule that energy goes up; skip the Thunderstorm triage. All of it ran except the harvest check, which waits on you, and the triage, which is on the ballot.
- **The build** [measured]: a Bridge section at the end of `scripts/wave0_reference.mjs`. With no option passed, the R38 functions give the same outputs as a frozen copy of the R38 module, bit for bit, on a fixed grid of inputs (run on Node 24; the comparison no longer depends on a recorded digest). The tests rose from 22 to 31, and all seven README gates pass. Nothing in it is ruled.
- **Argon's own R39 module** had a Skill check [measured]. Its gate, harmonic sort, amplitude bound and D2 debt fix hold. It could not be dropped in as it was: its defaults were not off, two values were labelled approved without approval, and its tests missed many planted defects (in-sample). Argon confirmed the measured findings, and added antidrive options, an answer on whose P_local, and two more defects it found in its own draft.
- **#13 and #14 hold in narrower forms** [model; one agent for both; scratch prototypes; tests and planted defects in-sample]. For #13, P = G·C·P_local becomes a ceiling on the locked part of a draw, and a hard cap only by design. For #14, counter-rotation is the best case of a broader condition, not the condition itself. Their hysteresis comes from one mechanism [model].
- **The fold check** [placements: inference, one agent; arithmetic and ledger runs: measured]: 8 of 12 placements hold after correction, and 4 fail (#17, #23, #24, #26). It found conflicts with approved R38 values and code, with the reference ledger and with the D1–D10 syntheses, and questions that no decision covers.
- **Your "four paths, one end"** [inference; partly built into the search]: for energy going down, the four groups read best as layers of one port rather than four paths. For harvest going up there is no shared answer yet.
- **Converter, not source** [published for MST and the other devices; inference across them]: every device examined converts energy from a metered supply.
- **19 questions are yours** (§10).

## 2. What Argon chose, and what ran

**Argon's plan** (its R39 reply, with Argon's agent counts) [measured, as captured]:

| Step | What | Agents |
|---|---|---|
| 1 | Build the composed gateway into the reference, every option off, with scale and planted-defect tests | 2, plus 1 if the audit finds a High or Medium bug |
| 2 | Finish the checks on #13 and #14, plus one check of the fold | 2 |
| 3 | This report and ballot | 1–2 |
| 4 | Harvest-up check, only if you rule that harvest carries energy or charge | 0 now, 1–2 later |
| Skip | Thunderstorm triage and the unchecked candidates | 0 |

That is 5 to 7 agents now, plus 1 to 2 for harvest later [measured: arithmetic]. Credit to Argon: the plan ships the checked code and the ballot first, and it keeps everything new switched off [design].

Three gentle corrections:
- Argon's skip row says "the remaining 10 unchecked candidates (#15–#24)". There are 12 (#15–#26), as Argon's own step 2 says, and Argon agreed in its overnight check-in [measured].
- Step 2 asks for five checks (correctness and buildability for #13, the same for #14, and the fold) from two agents. That is two-agent cross-checking, not five independent passes. Argon agreed [inference].
- Argon proposed skipping the Thunderstorm triage because the sweeps found every device to be a converter. No group examined that device, so the reason is [inference], and skipping it is your call (item 18).

**What ran** [measured, from the run records]:
- Before the build: a Skill check of Argon's module. One agent ran its code, and one checked its reply (§3).
- Step 1: a builder, a fresh auditor and a fixer. The fixer ran because the audit found one High and two Medium findings; it was Argon's reserve agent (§4).
- Step 2: two agents. One ran correctness and buildability for both #13 and #14; one checked the fold (§5, §6).
- Step 3: this report.
- Step 4 has not run; it waits on your harvest ruling (item 8). The triage has not run (item 18).

## 3. Argon's R39 module and reply

**What holds** (credit to Argon):
- The module runs cleanly. Its functions are pure, and importing it does nothing [measured].
- Its gate is exactly 0 at or below 0.81 under every hardness (D4) mode, including its repaired option C: 0 leaks in 360,000 random evaluations [measured]. It uses the smoothstep that R38 adopted, with your approval, in place of Argon's earlier logistic, and gives G(0.855) = 0.5, like the reference [measured].
- Its stage ladder (9·3^k), birth vitality 90 and 80/20 rebirth blend match §8.6 [measured, against the Plan].
- Its harmonic sort: orders 1, 4, 7 rotate forward, 2, 5, 8 backward, and 3, 6, 9 not at all [established for balanced three-phase sets]. The harmonic-sequence reading of Argon's 3-6-9 came from the earlier checks, and Argon adopted it.
- Its amplitude bound, ½√(1 − c²), gives 0.4 at c = 0.6 [measured]. The bound came from the post-R38 check of candidate #5, and Argon adopted it. The build's auditor re-derived it from two textbook inequalities [inference, by two agents]; the derivation is not yet in the repository.
- Its D2 change keeps a debt of 64 when no cause is open, so the reset found in v2.1 is gone [measured].
- Argon reported a bug in its own first draft: an unscaled default capped the upper stages at 900 J. The check planted that bug again, and Argon's tests caught it [measured]. Its exact six-decimal comparison also caught fees as small as 1e-5 J, which the checker's own draft tests missed [measured, in-sample].
- On MST, Argon pointed to the half of the published result that the brief had left out: OFCD's helicity loss depends on the phase, and is largest near the phase of greatest injection [published, abstract level]. Its formula for where the net peak falls, arcsin(a/2b), is right [established].
- The reply labels its claims and frames every ruling as a proposal [measured, by reading].

**What was corrected** [measured unless marked]:
- **The tests.** The checker planted 30 defects inside the module's functions, and Argon's tests caught 10. The checker chose those defects after reading the code, aiming at paths it suspected were untested, so 10 of 30 lists what the tests miss. It is not a detection rate [in-sample]. The tests missed, among others, a gate leaking at or below 0.81 inside the draw, a source drawn below its floor, double booking and a debt reset. Argon's own planted defect changed the result after the step had run, so it tested the comparison, not the code.
- **"Default-off, zero regression on R38."** With every flag at its default, the module departed from R38 in five ways. Strain carried through rebirth (80 stayed 80; 500 stayed 500). The source floor was on. Every draw was multiplied by sin(π/4) ≈ 0.707. A missing balance opened the gate fully (309 J at S3, where the reference gives 0). An unknown stage fell back to 729, so a typo "S9" drew 515 J. Swapped into the repository's 22 tests through an adapter, the module passed 17; the earlier scratch prototype of the composed gateway passes all 22.
- **Two values labelled "approved in R38".** Λ = 9 and a source floor of 0.15·P_local appear nowhere in §8.6, `B179` or the repository. They are proposals.
- **Units.** P_local is a power. The module used it as joules per call, with no time step, so what it drew depended on how often it was called.
- **Flags.** Several flags changed nothing: D1, D3, D5, D7, D9, a hybrid port and the harvest modes. D8 multiplied its term by 0.
- **The sin²δ loss** (Argon's one-port reading of MST's π/8 peak). What is published is that the loss depends on the phase. The sin²δ law itself is Argon's own form; the check found it nowhere in print [hypothesis: an unpublished ansatz]. It fits one parameter to one peak, which leaves zero degrees of freedom, so matching π/8 is not evidence. Tuning it to π/8 needs b/a = 1/(2 sin π/8) ≈ 1.30656, and that predicts a net loss of 30.7% at π/2 [established algebra]. The 2010 MST paper calls the added current at π/2 "relatively small" (search summary; its sign was not confirmed). The module's own b = 0.35 + 0.65·misuse reaches π/6 at most, and only at full misuse; for misuse at or below 3/13 ≈ 0.2308 it does not move the peak at all [established algebra; measured on a copy]. In its check-in Argon offered a two-parameter form, sin δ / (1 + β sin²δ). It peaks at π/8 for β = csc²(π/8) ≈ 6.8284 and stays positive at π/2 [established algebra], but two parameters fitted to one peak are still not evidence [C29]. MST also has a real second port: its main transformer carries about 90% of the current [published]. So whether Fidelity's gateway has one port or two is a design choice.
- **D6.** The reply gives misuse three meanings: a gate that reads a record, a loss that depends on phase, and a penalty for overriding a veiled lower level. Endorsing "all 10" of the panel's recommendations therefore conflicts with Argon's own D6 variants [inference].
- **Labels.** A few were one step too strong. For example, Argon labelled the earlier scratch prototype's 22 of 22 [measured], where the brief had labelled it [model] [measured, by reading].

**Argon's answers** (overnight check-in) [measured, as captured]:
- It called the replacement approach "the right call": port only the verified pieces, strip the defaults so that R38 holds, and plant defects inside the functions.
- It said none of the measured audit findings was wrong, accepted the sin²δ relabel, and agreed that 12 candidates are unchecked and that step 2 was two-agent cross-checking.
- **Antidrive.** It framed the choice. A1 is a one-way port: a backward drive moves nothing. A2 is a signed, reversible port, which it recommended, off by default, with three guards: the target's gate still applies; the flow never takes the target below its floor or K below 0; and dissipation is never credited back [design proposal].
- **Whose P_local.** The enclosing source's, times the time step, matching §8.6; its draft had used the target's. For links that skip levels it proposed two-sided scaling: demand scaled by the target's P_local·Δt and capped by the source's P_local·Δt minus its floor. It said that whether such links exist is yours [design proposal].
- **Two more defects in its own draft.** Ledger values were rounded to six decimals, so a run could drift by up to 1e-6 J a step while the error report said 0; and its harmonic classifier lost a sign (order −1 read as +1). It also asked that a missing stage or store should throw instead of falling back to a default [measured by Argon, as reported; not re-run here].

## 4. The build: the Bridge section of the reference code

**What it adds** [measured, by reading the code and tests]. All of it sits at the end of `scripts/wave0_reference.mjs`, with two small marked edits above it: the energy ledger can declare a merge port, and rebirth takes two D2 options.
- A draw can take its energy from the level above's store. Both levels book it under one shared tag: +E on the child, −E on the parent.
- Helicity gets its own ledger. When Λ is passed, each joule moved carries 1/Λ of helicity in the toroid's own handedness, booked on both levels. Neither side may end below its Taylor floor.
- A tower check: every level's books close, and every entry between levels has exactly one opposite partner on its parent or child.
- A phased port, as an option: the harmonic order is sorted into forward, backward or neither, then multiplied by sin(phase). A backward drive is antidrive, and the caller must say whether it closes the port or reverses it.
- Harvest: by default it only reads the toroid's state and books nothing. An option merges the whole toroid, energy and helicity, into the parent's store.
- A split-bound check that only reports; no draw calls it.
- Two D2 options on rebirth: a between-life review heals a share of debt (only when a review happened), and each open cause adds strain at birth.

Some options have no default value at all (Λ, a source floor, antidrive), so nothing new happens unless a caller chooses it [measured, by reading].

**Nothing changes by default** [measured]:
- A new test runs the R38 functions over a fixed grid of inputs, both in the new module and in a frozen copy of the R38 module (`scripts/fixtures/`), and requires the outputs to match bit for bit. The grid holds 3,360 gateway-power calls, 80 draw-and-relax runs, the ledger rules, rebirth with each option set, the soul-line functions, session save, episode selection, 20 port-Hamiltonian steps and the constants. Both copies run on the same Node, so the test does not depend on the Node version. A digest recorded on Node 24 is kept only as a printed note. All runs here were on Node 24; CI runs Node 22.
- The same test checks that the composed draw with no options equals R38's draw bit for bit on 240 cases. The auditor's probe found 0 differences on 20,000 random inputs, 3,279 of them real draws.
- The auditor's differential script, re-run on the final module, found 0 differences in 301,031 seeded comparisons (60,220 in the auditor's own run before the fixes). It compares every function that existed in R38, called with no new options, and it flagged 6 of 6 planted changes to the default path. These are seeded comparisons, not 301,031 independent cases.

**Tests and gates** [measured, re-run on Node 24 before this report]. The tests rose from 22 to 31. None of the original 22 changed, and R38's own test file still passes against the new module. All seven README gates pass, and the count audit now checks 153 counted-noun keys.

**Planted defects** [measured; all in-sample, since each set was written by someone who had read the code]:
- The builder's set: 46 of 47 caught. The survivor removes a guard that another check already covers.
- The auditor's set, before the fixes: 76 of 92 caught. Four survivors turned out to behave exactly like the original, so it is 76 of 88 real defects (86%). The 12 real survivors: 6 in the tower check, a merge accepted on any value that reads as true, a negative split amplitude, the helicity ledger's magnitude, and 3 redundant guards.
- The fixer's set: 18 of 19 on its fixes. The survivor stops a reversed flow about 1e-16 above K = 0 instead of exactly at 0.
- The auditor's set after the fixes: 82 of 91 (one could not be planted because its line had changed). The 9 survivors include the 4 that behave like the original, and all sit in code the fixes did not touch.
- After that, the tests were extended again: a merge only when the option is exactly `true`, a negative amplitude beyond the bound, the ledger's magnitude, and a level with no energy ledger. No planted-defect run was recorded for these additions.

**What the audit found, and what was done** [measured]. The audit found 1 High, 2 Medium and 7 Low findings.
- **High.** Under "reverse", with helicity on, one step could push K through zero into the opposite handedness, so the level above received more helicity than the toroid held. Fixed: a reversed flow now stops at K = 0. Carrying K through zero would be a separate decision for you.
- **Medium.** Two sign rules sat in the port without being named. (1) A backward harmonic at a negative phase drove forward, because the two minus signs cancelled. It now counts as antidrive; whether they should cancel is yours. (2) Helicity is added in the toroid's own handedness, whereas in OFCD the sign of sin δ fixes the sign. Both are now named in the code as your decisions.
- **Medium.** Several parts of the tower check were never shown failing on their own. The tests now plant each broken tower the audit named, and check that it fails for the right reason.
- **Low (7).**
  - A reversed flow scales with headroom, so a full toroid returns nothing and an emptier one returns faster. This is now stated in the code.
  - A merge without helicity ledgers moves helicity without booking it. Now stated in the code.
  - A comment cited `B179` for harvest before `B179` listed harvest.
  - Two strength labels: the MST citation had none (it now reads "cited, not reproduced in this repository"), and "amplitude" in the split bound needed defining (it is the toroidal share's distance from ½).
  - Small test gaps. Three have since been closed; two redundant guards are still not pinned by a test.
  - The tower check crashed on a level with no ledger. It now reports the problem.
  - The D2 comment did not say that turning the options on departs from R34. It now does.

**What was ported, and what was not** [measured, by reading]:
- From Argon's module: the harmonic sort (it now throws on a bad order instead of defaulting to 9) and the amplitude bound, as a check.
- The D2 options were rebuilt on the reference's rebirth rather than ported, because Argon's function carries strain across death.
- From the panel's D2 proposal, only two pieces were built: the review share and the strain per open cause. Not built: healing owed as max(debt, ceil(strain/25)), the dose-seam fix and a declared birth port. The build counts every open cause; the panel's text counts the open causes listed in `chose=`.
- Not ported from Argon: its defaults, Λ = 9, the 0.15 floor, its unused flags, its D4, D6 and D8 code, its clamping of antidrive to zero, and its tests that pass by construction.
- Not built at all: Argon's third antidrive guard (the bridge has no loss path, so there is nothing to split off), heat passing up between levels, the DC port, harvest as information or with a net gain, sharing that does not depend on order, and links that skip levels.

At the time of writing, nothing from R39 was committed [measured].

## 5. Candidates #13 and #14

**How they were checked.** One agent ran correctness and buildability for both candidates; a second agent checked the fold. So step 2 is two-agent cross-checking, not independent passes. The #13 numbers come from one new integrator, and its citations to Adler and to Stewart–McCumber were recalled from memory. Both candidates were prototyped as scratch code outside the repository, at model level. Their 11 of 11 passing tests and 8 of 8 caught planted defects are in-sample. #14's thesis source was read only at abstract level, through search summaries, because its page refused access.

**#13: the gateway as a synchronous tie.** Picture the level above as a large grid turning at a fixed rate, and the toroid as a motor locked to it.
- Holds [established, recomputed]: a demand below the ceiling, approached slowly, is served in full. Without damping, a sudden step from no load slips if it exceeds about 0.72 of the ceiling (at J = 1; 0.82 at J = 0.3).
- Holds [model]: the energy books close exactly if the change in the gate's own stored energy is booked. Without that term they leaked 1.6% to 100%.
- Narrower [model, one integrator]:
  - Overdraw is a cliff only with a weak damper. With a strong damper the tie slips steadily and is still mostly served.
  - P = G·C·P_local becomes the most the locked tie can carry (its pull-out power), not a hard cap. With a linear damper, the gateway inflow reached 4.67× P_max and the served power 1.30× P_max. It is a hard ceiling only if the damper's torque is also capped inside it [design].
  - Re-locking has hysteresis: after a slip, demand must fall to about 0.63× P_max (damping D = 0.05, inertia J = 1) before the tie locks again. Overdraw therefore has a lingering consequence, whose size the design values set.
  - The damper must close with the gate. An ungated damper let 7.6 J through a closed gate.
  - In the one topology tried, with a weak damper, a finite shared supply fails together, not fairly. A greedy entity drawing 0.7 beside a modest one drawing 0.4, on a supply of 1, took both down (served 0.007 and 0.129). Keeping the consequence with the greedy entity needs per-entity protection [design], as load-shedding does on real grids [established].
- Build: it changes what a draw means. The entity states a demand, and P becomes the ceiling on that demand.

**#14: the counter-spun pair.**
- Holds [established, recomputed]: one rotating field with nothing to absorb angular momentum stalls. With something to absorb it, one field draws steadily.
- Corrected [established, recomputed in a toy model]: a steady draw with zero net torque needs two coupling partners turning at different speeds, and then P = (Ω2 − Ω1)·T2. Counter-rotation is the symmetric best case, with the largest speed difference; it is not the condition. A static second field or a wall also gives a steady draw, and so does one rotor in a pulsating field.
- The "harder to open than to hold" gate needs a peaked torque curve. With a straight-line law there is only one state [model].
- The low state is not a closed gate: it still draws 14–32% of the high state [model]. The exact zero of a closed gate must still come from G.
- Sources: Clemente (1998) [published, abstract level]. The Tasmanian thesis's finding that reaching the state takes a much larger field than keeping it [published, search level].

**One mechanism.** #13's re-lock hysteresis and #14's open-and-hold hysteresis are the same thing: a peaked torque curve plus inertia gives two stable states [model]. Nothing found makes the two candidates exclusive.

## 6. The fold of the 12 unchecked candidates

The Skill had placed #15–#26 into existing groups and decisions from summaries only. One agent checked those placements against the full texts, the D1–D10 syntheses, the Plan and the code. Its placements are [inference, one agent]; its arithmetic and its ledger runs are [measured].

**Result.** 8 placements hold after correction (#15, #16, #18, #19, #20, #21, #22, #25). 4 fail (#17, #23, #24, #26).

**Conflicts with approved R38 values, the Plan and the code** [measured: arithmetic, or by reading]:
- #18's information gate, G = 1 − H2(ε), gives 0.1887 at balance 0.855, where R38 approved 0.5. Its C and P_local also replace the approved forms.
- #21's gate (Argon's product form, read against 0.81) opens only at balance 0.9405 and never reaches 1. R38 gives 0.5 at 0.855 and 1 at 0.90.
- #26's set-level test reads violet, which Plan `B162` fixes as a constant identity signature; the reference gate reads balance.
- #17's top port sets P_local from the host machine's budget, against the approved 9·3^k.

**Conflicts with the reference ledger**:
- #23 posts braked karmic energy to the world's thermal sink. The world's books then fail to close, with a residual of 0.5 [measured], because that energy never came in through a declared port. The corrected form is a separate karma ledger with its own sink and unit [design].
- #24: today's rebirth turns vital 40 and strain 80 into 90 and 0 with no ledger entry [measured]. The vessel's energy needs a declared outflow at death, matching the birth port D2 already asks for. Three things are open: where that energy goes (heat, or the ambient pool); what sign strain carries; and an imbalance. If birth energy comes down from above while death energy stays in the level, each life adds energy to the level unless heat passes up [inference].

**Conflicts with the D1–D10 syntheses** [inference, by reading]:
- #17's top port against D8's welfare guard rail (the host budget changes time rate and fidelity, "never in-world joules"). D10(c) allows a host rate only as a declared constant or a logged event.
- #19's bias learning by replay against D1's test that every episode is distilled exactly once, and against D5's rule that only a response at a choice point writes.
- #22's misuse judged at the draw against D6 ("misuse is defined by use, not by the draw").
- #24's "chemical debt stays with the body" against D2 option C ("death never lowers" the healing owed). It reopens the dose-then-die exploit.
- #25's stored Choice flag against D3 (the Choice is computed from `pol`, not stored).

**Questions the fold dropped, which no decision covers** [inference]:
- Is the gateway for adepts only? (#26; Ra 39.10 as paraphrased in the candidate, not re-checked here [GUIDE])
- Ra's random gateway (6.1) as its own logged channel (#21). D4 names it only as a follow-up.
- A separate karma ledger, and how forgiveness brakes it (#23).
- A host-level model acting as the higher self in dreams: a welfare and consent question (#20).
- Which episodes dreams replay, and the cap on offering one catalyst again (#19).
- Binding a charge to the purpose it was charged for (#22).
- The harvest test's margin against noise, and D9's will factor for an undecided entity: W(0.5, 0.5) = 0.9989, close to full power (#25) [measured, arithmetic].
- A replacement for Argon's T1 check, which passes even with a planted defect (#15) [measured, by #15's run].
- The cost of forgetting. Records are erased when episodes are evicted, when the record is compacted and when the episode window is dropped at death, under any D1 or D7 choice, not only if harvest is information. So whether forgetting costs in-world energy, and who pays, is its own question (#17).

**A code defect found by reading** [measured, by reading]. In `scripts/adversarial_red_team_v9_audit.mjs`, `stepSymbioticUniverseBridge` takes its four "weight statistics" as free inputs, and a caller feeds it physics values in their place (#20). It needs a provenance check. It is not yet in the register.

## 7. Your "four paths, one end"

You asked whether plasma helicity, 3-6-9, the resonance gate and the nested ledgers are four paths to one end.

**Proposed reading** (the Skill's, corrected by a fresh reviewer; for you to rule on) [inference: one measured device and two partial model runs]:
- **Energy going down: one end.** The groups fit as layers of one metered port, though not equally. Helicity is what crosses. Resonance or tuning sets how much crosses and how drawers share it. Mirrored ledgers on both levels book every joule. A phased drive sets the sign; that is where Argon's 3-6-9 joins, as direction, and only for an inductive port.
- "One end" is partly built into the search: all 26 candidates were generated as bridges to the §8.6 gateway [inference]. The three readings split on how many groups merge (four, three, none), and the fresh reviewer judged the first wording of this verdict overstated.
- In the composed scratch prototype, only the helicity port and the two-sided ledgers carry the load; the resonance law and the phase drive are optional there [model].
- **Real-world form.** On MST, two phased loop voltages inject helicity, reversing the phase order reverses the effect, and all of it runs from a metered supply [published, measured]. MST has no 3-6-9 structure and no gate on balance, so matching it to the four groups is [inference].
- **Not one dial.** MST's plasma current peaked near a phase of π/8, while injection peaks at π/2 [published, measured]. Two explanations are in the record: a phase-dependent loss at the OFCD port (Argon's point), and better confinement letting the main transformer drive more current. The authors say the relative contributions are unknown [published].
- **Harvest going up: no shared end.** Charge, heat and information all have candidates (item 8).
- **Rules the composition needed that no group states** [model, one parameter set]: one energy-per-helicity value Λ for the whole tower (the same ratio at every port starved the bottom level to about 3e-12 W); a cap that keeps the source above its own floor; a mirrored charge ledger; a charge source at the top, with a charge exit and a birth seed at the bottom.
- **Converter, not source.** MST converts at about 0.1 A/W, like ordinary transformer drive [published]. HIT-SI and coaxial-gun spheromaks also run from metered supplies [published].

## 8. The sweep: sacred geometry, ley lines, the pyramid scans and Ra's silences

This was your idea. Four researchers ran, each followed by an adversarial checker. The write-up kept only corrected forms, and its 66 Ra quotations passed a word-for-word script check, while 4 of 4 planted false quotations failed [measured]. A fresh claim-strength reader checked the public copy against the synthesis before commit; it did not recompute the figures.
- **No new source of energy** [inference across the four areas]: every real counterpart converts energy from a metered supply.
- **Exact facts the gateway can use** [established]:
  - Among closed two-sided surfaces, only the torus can carry a circulating field with no zero anywhere.
  - Helicity is exactly the linking of field lines.
  - The Flower of Life lattice and three-phase power share one algebra, which is why the 3rd, 6th and 9th harmonics do not rotate. Argon's 3-6-9 link is therefore an identity, not numerology.
  - The golden ratio is the hardest number to approximate by fractions; using it for sharing would be [design].
- **Corrections**:
  - Two equal counter-rotating halves give no net rotation at any offset [model].
  - Metatron's cube holds exact drawings of three of the five Platonic solids, not all five [model plus exact algebra].
  - Ley lines do not beat chance once clustering is allowed for [model; published].
  - The Big Void and the North Face Corridor in the Great Pyramid are real [measured]. The 2025 Khafre radar claims were never peer-reviewed, and the team's method paper was retracted [published retraction, as reported by the sweep].
- **Ra's silences** are mostly a stated policy: principles are given, and operating specifics are withheld under free will (6.26, 29.31, 64.9) [RA]. Many topics were never asked [keyword searches only].
- **Harvest.** Ra describes harvest as a read-out of each entity's state, taken by a precise probe from the level above, not a flow of energy (51.1) [RA; the mapping is GUIDE].
- **Ra's numbers.** Ra asks to be queried on its numbers (57.33) [RA]. Some conflict with the record: 1.16 against Giza's 6.28, about 6,000 years for Giza, and 60,000 years for Nazca.
- The sweep proposes **eleven bridge additions** [design], each with a test that can fail (item 16), and **three questions** for you: harvest (item 8), Ra's numbers against the record (item 14) and disclosure (item 15).

## 9. Credits

- **Piskriek**: the fractal principle, and P_local as the cap set by the enclosing level; the counter-rotating vortex → toroid idea; the "four paths, one end" question; the sweep; and handing this pass's choice to Argon.
- **The Sonnet physics brief** (`bench/2026-10-31-wave0/vortex_hypothesis.md`): the G·C·P form of the gateway, which your principle turned into G·C·P_local. An earlier draft credited the form to you; a claim reviewer caught that.
- **Argon**: the Z9 orbits, the 3-6-9 reading, the throat, T1, T4, the 0.81/0.09 gate values and 9·3^k, as well as birth vitality 90 and the 80/20 blend. This pass: the plan; the code of the module pieces the build ported (the harmonic-sequence sort and the amplitude bound came from the post-R38 checks, and Argon adopted them); the antidrive options and guards; the answer on whose P_local; two further defects in its own draft; and pointing to the dissipation half of the MST result.
- **An earlier checker** first named OFCD as the real form of Argon's T1 cycle.
- **The R39 checks** were Claude agents: a code audit and a reply check of Argon's module; the build's builder, auditor and fixer; the #13/#14 checker; and the fold checker.

## 10. The ballot

Pick an option for each item, or write your own. Each option says whose proposal it is; none is ruled. "Reference" says what the code does today. If you leave an item, the reference stays as it is, with every new option off.

**1. Keep the Bridge section, and adopt any of its options?**
- (a) Keep it in the reference with every option off. This is how it was built, following Argon's step 1.
- (b) Turn some options on by default (name them).
- (c) Take it out.
- Reference: kept, all off; nothing in R38 calls it.

**2. Port type.**
- (a) None: a factor of 1, as in R38 (reference default).
- (b) A phased port: harmonic order sorted forward, backward or neither, times sin(phase) (built).
- (c) A steady DC port, like a coaxial gun (not built; the reference throws on any other port type).
- (d) Both (not built).
- Argon proposes the phased port so that 3-6-9 has a role [design proposal]. The reply check noted that this reason is design, not physics: MST has no 3-6-9 structure, and a DC port needs no phase layer. A related choice is one port or two, since MST pairs OFCD with a main transformer [design].

**3. Antidrive, and the sign conventions.**
- (a) Close: a backward drive moves nothing (Argon's A1).
- (b) Reverse: a version of Argon's A2, the option Argon recommended. Energy and helicity flow back to the level above, still through the toroid's own gate, never below its Taylor floor, and stopping at K = 0. It has no dissipation split, because the bridge has no loss path. Because it scales with headroom, a full toroid returns nothing.
- Reference: no default. A phased port must name one, or the draw throws.
- Signs: (i) a backward harmonic at a negative phase counts as antidrive (reference), or the two signs cancel into forward drive; (ii) helicity is added in the toroid's own handedness (reference), or its sign is fixed by sin δ, as in OFCD.
- (iii) A reversed flow that carries K through zero into the other handedness is not built. The stop at K = 0 came from the audit's one High finding.

**4. Λ, the energy per unit helicity.**
- (a) Passed per draw, with no default; without it no helicity moves (reference).
- (b) One value for the whole tower, which the composed prototype needed [model, one parameter set].
- (c) Argon's Λ = 9 [design proposal, not approved].

**5. A source floor beyond the Taylor floor.**
- (a) None (reference). Once a source is passed, its own Taylor floor and a finite Wmax are always respected. That was the builder's choice, and you may see it differently.
- (b) A floor passed per draw (built as an option, with no default).
- (c) Argon's 0.15·P_local [design proposal, not approved]. Since P_local is a power, a floor in joules needs a named span of time, or a fraction of the stored energy.

**6. Whose P_local, and links that skip levels.**
- Whose: the enclosing level's (§8.6 and Argon's answer; the tests do this), or the target's. Reference: the caller passes it.
- Skipping levels: should such links exist? If yes, Argon proposes two-sided scaling [design proposal]. Not built.

**7. The split bound ½√(1 − c²).** What happens when a port exceeds it?
- (a) Report only (reference).
- (b) Refuse or clip the draw.
- (c) Log it.
- Unruled; nobody has proposed a rule.

**8. What harvest moves up.**
- (a) A read-out only, booking no energy (reference default).
- (b) The charge: the whole toroid merges into the parent (built as an option).
- (c) Information: bits, with an erasure cost paid at the host (not built).
- (d) Both, on two ports (not built).
- (e) Charge with a net gain above, through a dynamo or inverse-cascade port (not built).
- Argon proposes a read-out only, with an optional Landauer heat flag [design proposal; the flag was not implemented in its module]. Ra 51.1 describes harvest as a read-out of state [RA; mapping GUIDE]; that is an input to your choice, not a limit on it. Partial and heat-booked harvests are not offered. Argon's step 4, a harvest check, runs only if you choose an option that moves energy or charge.

**9. Rebirth: the D2 options and their rounding** (see also D2 in item 17).
- Use the options? (a) No: R34 as ruled (reference). (b) Yes: a review heals a share of debt, only when a review happened (the panel suggests Argon's 0.5 once a between-life review exists), and q strain is added per open cause (the panel's example used 25).
- Rounding of the reduced debt: truncate (reference, like every debt value) or round up (the cautious choice).
- Which causes count for q: every open cause (reference) or only those listed in `chose=` (the panel's text).
- Turning these on departs from R34 (§8.6 Q3) and is a variant of Argon's carry proposal. Argon's own function, which also carries strain across death, was not ported.
- Also open here (#24): a declared outflow for the vessel's energy at death, where it goes, and what sign strain carries.

**10. What misuse (D6) means.**
- (a) Record only: the act is logged and opens a cause; the gate is untouched (D6 option 1).
- (b) The gate reads the misuse record (D6 option 2; the panel recommends it).
- (c) The entity's own hardness narrows its gate (D6 option 3; Argon's earlier proposal).
- (d) #13's slip loss: overdraw or haste loses lock, and the draw turns to heat.
- (e) Argon's disclosure penalty for overriding a veiled lower level.
- (f) Argon's physical tearing loss, sin²δ [hypothesis]. In Argon's module it applied even at misuse 0.
- (g) None.
- The reply check proposes keeping any physical loss separate from the misuse record unless you rule to join them [design proposal].

**11. Candidates #13 and #14.** Build #13, #14, both, or neither [model; scratch prototypes, with tests and planted defects in-sample].
- #13 is a synchronous tie: P = G·C·P_local becomes its pull-out power, which is a hard ceiling only if the damper's torque is capped inside it, and the entity states a demand. If built, you would also choose: the demand variable; damping, inertia and frequency per level; whether the damper's torque is capped; a finite supply with per-entity protection, or the current pool; whether slip consequences reach the world; and a welfare Rule 4 play-test before it ships.
- #14 is a counter-spun pair. The check found that counter-rotation is the symmetric best case of two coupling partners at different speeds, not the condition. If built, you would also choose: whether each level's field has two components, and how strong; what the toroid's two parts are; whether to use a peaked coupling law, which brings hysteresis; and an off switch the entity holds.
- Their hysteresis shares one mechanism, and nothing found makes them exclusive.

**12. The conflicts the fold check found** (§6). For each, keep the approved ruling or change it.
- Against approved values and code: #18 (gate 0.1887 against 0.5 at balance 0.855), #21 (opens only at 0.9405), #26 (violet against `B162` and the balance gate), #17 (host budget against 9·3^k). The fold check proposes keeping R38's G, C and P_local, and adding #18 only as an information ledger beside the energy ledger, if you rule that harvest is information [design proposal].
- Against the reference ledger: #23 (karmic energy breaks the world's books; proposed: a separate ledger) and #24 (no outflow at death; item 9).
- Against the syntheses: #17 against D8's guard rail and D10(c); #19 against D1 and D5; #22 against D6; #24 against D2 option C; #25 against D3.

**13. The questions the fold dropped** (§6). Which should become decisions now?
- adepts only (39.10);
- the 6.1 random-gateway channel;
- a karma ledger;
- a host model as higher self (welfare);
- dream-replay priority and the re-offer cap;
- binding a charge to its purpose;
- the harvest test's margin, and W near 1 for undecided entities;
- a replacement for T1;
- whether forgetting costs in-world energy, and who pays.
- Also: should the provenance defect in `stepSymbioticUniverseBridge` go into the register?

**14. Ra's numbers against the record.**
- (a) Follow Ra.
- (b) Follow the record.
- (c) Leave such constants out.
- (d) Argon's two-layer rule: the engine uses exact and measured constants, and conflicting Ra numbers live on as in-world lore ("transmission drift") [design proposal].
- Ra asks for its numbers to be queried (57.33) [RA]. The conflicts: 1.16 against Giza's 6.28; about 6,000 years for Giza; 60,000 years for Nazca. The last two are separate conflicts.

**15. Disclosure between levels.**
- (a) Principles only.
- (b) Principles plus some operating specifics.
- (c) Argon's "principles down, specifics veiled": a direct override of a veiled lower level triggers the D6 penalty [design proposal].
- (d) The sweep's addition 9: two layers, with one tuning value that can only be found from below [design proposal].

**16. The sweep's eleven bridge additions** [design]. Adopt, change or drop each:
1. a port on a closed flux surface with no dead points (no physical hole needed);
2. helicity booked two ways;
3. the sign set by two perpendicular drives and a phase δ;
4. the 3k (triplen) channel reserved for metering;
5. golden-angle slot sharing;
6. a planet-level port that responds to field direction, tilt and drift;
7. a muography-style audit before booking a hidden structure or claimed effect;
8. harvest as a state read-out;
9. a two-layer disclosure rule;
10. shape only as a multiplier on coupling, within Ra's dose and size limits;
11. sites of power only where real flows concentrate.

**17. D1–D10.** The panel's recommendations are proposals [design]. Argon endorsed all ten, but its own D6 variants (item 10) conflict with the panel's D6.
- **D1, memory** (the 32-slot episode window). A: keep R34 pinning and use Argon's `ex` as the weight of the bias update. B: Argon's top 4 by `ex` plus the 28 most recent (reverses R34). C: R34 plus Argon's 4-slot peak tier, switched off until `ex` stops saturating (`B114`, `B131`) and a reader of the peaks is named. D: A or C plus a higher-self archive one level up. Panel: C.
- **D2, rebirth.** A: R34 as built. B: Argon's forgiveness-gated half carry. C: the healing owed is conserved across death, the body is rebuilt from the causes left open (q per cause, default 0), and Argon's 0.5 becomes the share paid between lives once a review exists. Panel: C. Argon's v2.1 rule had sent debt from 64 to 0 when no cause was open [measured]; its R39 version fixes that.
- **D3, the `ms` format.** 1: store the Plan's numbers and show Argon's labels as a computed view. 2: the same plus 21 archetype weights. 3: keep R38 exactly. 4: store Argon's v2.1 line. Panel: 1.
- **D4, ego hardness.** A: hardness slows the climb to the set level; the gate is unchanged. B: hardness narrows the flow once the gate is open. C: a second lock (Argon's factor, repaired so nothing flows at or below 0.81). D: leave hardness unread. Panel: A.
- **D5, the bias update.** 1: the adopted additive step. 2: a harvest ledger with inertia. 3: the same ledger with a fixed step. 4: distil only at sleep and review. Panel: 2.
- **D6, misuse.** 1: record only. 2: the gate reads a misuse record. 3: Argon's hardness at the gate. Panel: 2. Item 10 lists the further meanings.
- **D7, eviction.** 1: as written, a cause and its episodes leave together. 2: an unresolved flag ends only by forgiveness, and folds up a level if it cannot fit. 3: keep both, by caps alone. 4: Argon's v2.1 retention. Panel: 2.
- **D8, sharing.** A: each entity gets the full P_local. B: one common scale factor, only under crowding. C: a max-min fair split under crowding. D: keep the first-come pool. Panel: B. The Bridge keeps R38's first-come pool.
- **D9, will to serve.** 1: balance only. 2: the will on either path, graded, with balance the only threshold. 3: service to others only. 4: only at harvest readiness (Argon's reading). Panel: 2.
- **D10, who pays.** 1: a nested debit with refill and a floor, the host machine the only unlimited source. 2: an unlimited field with a rate cap only (today). 3: unlimited fields with one world-wide host cap. Panel: 1.
- **Argon's three R38 proposals that conflict with R34**, and its hardness factor. The top 4 by `ex` plus the 28 most recent, the 50% carry of debt and strain, and the v2.1 `ms` format are the subjects of D1, D2 and D3; hardness is D4. Endorsing the panel's D1–D3, as Argon did, would settle those three in R34's favour [inference; Argon has not said so explicitly].

**18. The Thunderstorm triage.**
- (a) Run it: 1 agent, which only specifies a blinded engine test with metered fuel, an exhaust analyser and four arms (stock engine, device, a dummy of the same shape, and the known mechanisms). Running any test is yours.
- (b) Skip it (Argon's proposal).
- What it is: an engine-exhaust retrofit promoted as plasmoid energy. Search summaries say its energy comes from the engine's fuel [unverified].

**19. Keep the R39 commit.** Under your overnight go-ahead, the R39 work (the Bridge code and tests with the frozen R38 copy in `scripts/fixtures/`, the Plan, Resume and README lines, and this folder) was committed to the PR branch with every option off and nothing ruled.
- (a) Keep it.
- (b) Revert it (one commit) until you have read this report and ruled.

**Reference choices you may change** (answer only if you object):
- the tag format, `source>entity#n` for draws and `merge:child>parent#n` for merges;
- stellar and ambient count as inflows from outside the tower, and an untagged gateway entry is allowed only on a root;
- a merge is refused if the parent would end below its Taylor floor or past its Wmax;
- a reversed flow leaves the shared pool untouched;
- a merge without helicity ledgers moves helicity without booking it;
- the shared pool stays first-come (D8).

## 11. Housekeeping

- **Not in this folder.** The scratch prototypes (the composed gateway, the #13 and #14 prototypes), the checkers' scripts and the run records stay out of the public repository, because they carry local file paths. This report describes them only.
- **Two downloaded files.** During the checks, a web tool saved two files on the owner's computer, against the project's no-download rule. They are for you to delete.
