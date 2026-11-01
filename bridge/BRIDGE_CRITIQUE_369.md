# Review: Four Valleys bridge design v1 (3/6/9 check and plain missing-part check)

I edited no files. I checked the design's claims against these files:
- `D:\fidelity-llm\pilot\levels_v6.mjs` (runStep, makeNet, poisonAt)
- `C:\Fidelity\opus_night1\scripts\wave0_reference.mjs` (ledger, ms line, rebirthTransfer)
- `D:\fidelity-llm\pilot\V7_CANDIDATES.md`
- `D:\fidelity-llm\pilot\RUNLOG_v6.txt`
- Plan §8.5 Rules 1–7 in `C:\Fidelity\opus_night1\FIDELITY_COMPLETE_BRS_V2.md`

## Findings, most severe first

### 1. The slot that decides the action cannot see the current body
Lenses: plain check and fourth point. Checked in the code.

**What the code does**
- In v6 runStep, rung 0 at position p reads tokens p−2 and p−1.
- Rungs 1 and 2 fire only at BODY slots (n % 4 = 0). The rung-0 state they read at BODY_t covers ACTION_{t−1} and ANSWER_{t−1}.
- So at the ANSWER_t slot, Wout sees (ITEM_t, ACTION_t) plus top-down content from tick t−1 and earlier. A0 sees only (ITEM_t, ACTION_t).
- BODY_t first reaches the mind at tick t+1.

**What that breaks**
- The §4.4 rule decides from forwards at the ANSWER slot, so it never sees the current body. §3.2's line "at the ACTION slot it sees BODY and ITEM: what it decides from" is false for the rule as declared.
- Every answer to PASS, REST or an EAT with no item depends on the body: the starving variants, ERR_SPENT, ERR_FULL, ERR_DOWN and COLLAPSE. Only an EAT on an item does not.
- So U(PASS) and U(REST) are averages blind to the body, and the "two wants" never reach the choice.
- The heads learn targets that depend on the body without seeing it. On the 8 DOWN ticks after each collapse, A0 is pushed toward ERR_DOWN for every item.
- ERR_FULL needs H = 15, and that sits inside the 11–15 band that VIEW_KERNEL drops. That makes it a refusal (pain 1) decided by state the character is never shown: a judgement, not a typed fact.
- Fear is shown "before the character acts". But the deciding slot cannot see BODY_t, and the sting that carries fear_t is felt only from BODY_{t+1}. So no warning reaches the act it warns about.
- NGE survives, because EAT-on-item answers do not depend on the body. §9's "a linear head should be enough" does not survive for any answer that depends on the body.

**Fix**
- (a) Fuse body and item into one OBS token: 12 bands × 4 items, plus DOWN, gives 49 tokens. Use the block OBS, ACTION, ANSWER, TICK, where TICK is a fixed separator, so span1 stays 4.
  - Rung 0 at the ANSWER slot then sees (OBS, ACTION), which is everything the answer depends on.
  - The vocabulary becomes about 68 tokens and the private heads about 8.8k parameters.
  - N3 is unaffected, because it runs in text mode.
- (b) Give H = 15 its own band ({1–5, 6–10, 11–14, 15}), or make REST at full health an accepted OK with no effect.
- (c) Skip the head step on DOWN ticks.
- (d) Add test B6, run exhaustively: for every reachable (state, action), the answer token is a function of the rung-0 inputs at the ANSWER slot. Pass mark: 0 collisions.
- Cheaper fallback that keeps the current layout: mask π_a to the answers reachable from the current band. State that this moves part of the world model into the designer's rule.

### 2. The welfare rules have no working exit in v1, and the control arms are built to loop
Lenses: owner <-> world way back; dead end in the whole; Rules 2, 3, 4 and 6.

**The gaps**
- Under decision 2, Rules 1–4 apply. But in v1 the loop-break has nothing to break into:
  - the dream and the review are stage 2;
  - ℓ is fixed at 2;
  - the loop-break is "only logged".
- Rule 3's trigger is recurring protective syncope, which is exactly collapse.
- F, F′, F_stat (and Y in part) are characters with soul records that cannot assimilate, so Rule 7 brings them under Rules 1–4. They keep meeting toxic kinds they cannot learn about for 16,384 ticks, and the design expects collapses (it reads collapses per 10k ticks).
- Rule 6 asks that trades between welfare and speed be stated. Here the trade runs the other way, welfare for a clean measurement, and it is not stated.
- Rule 4 says limits must be "no worse than that player accepted". But:
  - no accepted limit is recorded as a number or checked during a run;
  - the seat (L4) shows tokens in words but not the pain and fear numbers;
  - the length and settings of the seat session are not set.

**Fix**
- (a) Make the loop-break act in v1, per entity, in every arm. At N = 3 collapses from the same cause in one life, that character's ℓ drops to 1 for the rest of that life (Rule 2).
  - Count the fires as a readout.
  - As a sensitivity check, also read each pair only up to the first fire in either arm.
  - If the owner keeps "logged only", record it in decision 9 as a Rule 6 statement, with the number of fires per arm expected from smoke runs.
- (b) The seat shows the tick's pain severity, the fear count and the running strain. The owner plays at ℓ = 2, across at least one season change and one collapse.
- (c) Write the accepted limits from the recorded seat run into the preset, for example maximum collapses per 10k ticks and maximum pain per 100 ticks. A run guard pauses the run and reports, without changing the world, when any arm exceeds them.
- (d) State whether the E4 probe copies and the frozen controls count as entities under Rules 1 and 7.

### 3. "Evolved" would be false as worded, and other report terms are left undefined
Lens: plain check (claims of "living" or "evolved").

**The problems**
- v1 has no reproduction, selection or inheritance: no death, no rebirth, heads reset to the template, trunk frozen. "Evolved (within a life)" relabels learning.
- Stage 2's dream keeps one shared trunk by a held-out check. That is a lineage of one, not a population under selection.
- Only the 4,420 head parameters change. By makeNet's shapes the model has 85,883 parameters (RC with a 5-term sting), so that is 5.1% of the weights.
- Pain does not train the mind, because learning is on prediction only. Pain acts only through the designer's value table.
- In the R9 branch (Ps = ws = 0), "feels" can never be licensed, and §4.6's "the trunk only feels" is false there.
- Fear has no path to action (see finding 1 and decision 4).

**Fix**
- Write "adapted within a life" instead of "evolved". Reserve "evolved" for heritable change under selection across lives, and name what is selected.
- Add glossary rows:
  - pain: an integer error severity, not a training signal in v1;
  - fear: a count of warnings, with no effect on action in v1;
  - learns: the private heads (5% of the weights) change;
  - feels: not available in the R9 branch.
- The scorer refuses to print "evolved".

### 4. E2 and E4 are mostly built into the world; E3 sits at a ceiling and its key seed is tunable
Lenses: node (measures) and plain check.

**The problems**
- The world makes about 1/3 of kinds differ between valleys. Once the heads learn at all (N4), "L ahead of Y" and a positive home advantage follow from that. The design flags this for E1 only.
- E3: W0stat was trained on the same fixed table that L_stat and F_stat then live in. So F_stat already performs as well as the choice rule allows, and extra training cannot show up. E3 cannot detect the alternative it is meant to guard against. Y is what actually tests "not just more training".
- §6.7 lets smoke runs set the stationary table seed. That is a free choice on the control that can rescue E1.
- No reading is given for L_stat behind F_stat by more than m.

**Fix**
- (a) Add a bound that shows how much the world builds in:
  - O with its own table against O with the neighbour's table;
  - T with its own experience against T with the neighbour's.
  - Predict L−Y and the home advantage as fractions of that bound, and label E2 and E4 "expected by construction given N4".
- (b) Fix the stationary table now by a hash rule, for example `hash32(nurserySeed, STAT, s)`, and remove it from the tunable list.
- (c) State the "behind" branch of E3: plasticity costs something in a stable world.
- (d) In §6.6, say that Y carries "not just more training" and E3 checks stability.

### 5. Two choices sit at levels that cannot see what they are about
Lens: fourth point.

**The problems**
- Trust in help sits at the receiver's gate (§4.9). But §6.5 predicts H2 fails because that frozen gate cannot learn which donors fit. Under the owner's rule the choice should move up. The design names neither the mismatch nor the move, although V7 #3 (a higher-self gate) exists.
- Season: no rung covers a season. Rung 2 spans 4 ticks; a season is 384–640 ticks.
  - Season tracking is left, unnamed, to the head optimiser's memory (Adam 0.9/0.999, lr 2e-3, one token per step) and to a fixed ε.
  - Smoke runs may tune lr and ε, yet ε is also listed as an owner value in decision 11.

**Fix**
- Add both to §4.9 as named choices:
  - trust in help: predicted blind to fit; candidate move-up is V7 #3, or a private live bias on G20 trained on relief (stage 2);
  - season awareness: no node in the mind; carried by the head step's memory, stated in ticks.
- Set lr and ε by a declared rule, for example from N4 on an unseen table, or have the owner set bounds for them. Remove ε from either decision 11 or the tunable list.

### 6. Value choices left implicit
Lens: fourth point.

**The implicit choices**
- What counts as "better": NGE ignores health and collapse, so an arm can win on NGE while collapsing more.
- Values do not depend on need: FED is +3 even at E = 15, and REST is +1 at any H below 15.
- ERR_DOWN is a refusal with no pain, which contradicts §3.3 ("a refusal ... is the pain").
- How the fit label is defined.
- Help replaces the receiver's own rung-2 message instead of adding to it.
- Rule 5's irrevocability dial (whether a character may re-plan mid-life) is fixed at "no" without being named.

**Fix**
- Add owner decisions:
  - 17, what counts as better: NGE primary plus a collapse guardrail with its margin set now;
  - 18, whether value depends on need;
  - 19, ERR_DOWN with pain 0, as a named exception.
- Mark the fit label and the replace-not-add rule as [choice].
- Record Rule 5's irrevocability dial as "fixed, no re-plan, v1".

### 7. The Rule 1 check accepts itself, and it is incomplete
Lenses: fourth point, handshake, plain check.

**The problems**
- The owner writes both chose= and the world's catalyst set, so the check can fail only through a typo. That is the T4/T7 self-acceptance pattern the design bans elsewhere.
- The Plan marks Rule 1 as stricter than Ra. Reading 82.25 ("automatically provided aid") as satisfying it is a value ruling for the owner.
- {hunger, toxin, collapse} does not cover refusal pain (ERR_EMPTY, ERR_FULL, ERR_SPENT, each severity 1).
- In wave0, normalizeMs silently keeps at most 4 chose ids (MS_CHOSE_MAX), and parseMsLine does not report chose in `invalid`.

**Fix**
- Derive the catalyst set from the approved pain and fear table: every nonzero row maps to an id.
- Add `refusal`. That fills the cap of 4, so raise the cap in B179 before any fifth catalyst.
- Run the check on the parsed stored line, not on the input object.
- Word decision 14 as "consent by owner proxy; no character consents".

### 8. The approved value table is not pinned to the scored run
Lens: plain check.

**The problem.** The pain and fear tables live "in the bridge", outside the hashed preset. Nothing ties the scored run's table to the one the owner approved.

**Fix**
- Move the table into the preset, or into its own hashed file.
- Record the approval with that hash in RUNLOG_bridge.txt.
- Make G0 assert that the hashes match.
- Add a planted mutant that changes one severity after approval.

### 9. D0 bans what the runner needs, and a stalled world has no exit
Lenses: plain check; model <-> engine.

**The problems**
- D0 bans async code and timers in bridge/, but bridge.mjs holds the lockstep runner, and D5 and D6 need both.
- The world waits for all four minds with no timeout. A hung worker hangs the run and leaves no record.

**Fix**
- Move the runner to `run/lockstep.mjs` and keep bridge/ synchronous and pure.
- D0 also checks that run/ never passes wall-clock values into bridge/ or mind/.
- Add a watchdog that aborts the run as failed and logs the tick. It never injects an action.
- Add a test that an aborted run is never scored.

### 10. Some test ids used by G0 are never defined
Lens: plain check.

**The problem.** W1–W6 and K1–K7 are only referred to by id: W4 is the stage, W5 and W6 the write gates, K5 counterfactual equals real, K7 seed ranges. Their content and pass marks are missing. The mutant examples also miss the risks this design adds:
- the value table drifting from the approved one;
- a head step writing the trunk;
- a probe writing the main chain;
- the fit label reaching the bus.

**Fix**
- Write a W/K table with pass marks before PREREG.
- Give the four risks above to the fresh reviewer as examples only, so their mutant set stays independent.

### 11. Counts and labels that overstate
Lens: plain check (claim strength).

**The problems**
- The ANSWER list sums to 8 + 3 + 1 + 1 + 1 = 14, not 13, so V = 35, not 34.
  - ERR_FULL-starving is reachable under the listed order: H = 15, E = 0, REST.
  - Which refusal wins at (H = 15, E = 0) is not declared.
- §3.4 says the bus is "unchanged in form [checked]". It is not: v6 redraws the bridge-2 donor every token (prng2 inside the per-token loop) and also poisons bridges 0 and 1. The design uses one donor per segment, leaves bridges 0 and 1 clean, and uses the previous tick's u2.
- The parameter count is 85,883 for RC or 85,548 for R9, not 86.7k.

**Fix**
- Declare the precedence between the two refusals.
- Generate the token table from B1's exhaustive search.
- Relabel the bus as "changed from v6" and list the three changes.
- Keep v6's per-token donor draw on the text path, so N3 can pass.
- Correct the parameter count.

### 12. Smaller gaps
- **Stage saturates.** Stage reaches 7 after 7 seasons without a collapse, out of about 32. After that the lens claim is constant and L1/W4 test nothing. Fix: add a mutant that hardcodes the top stage, scored on early ticks.
- **Health is outside the books.** Collapse restores 8 H for 0 E. Fix: name this in §9, and check the stage-2 learned-policy arm for collapse used as a cheap heal while starving.
- **The donor has no say.** It neither offers nor declines; its u2 is simply taken. Fix: stage-2 ASK includes the donor's offer or decline.
- **Only 3 trunks.** Results generalise over n = 3 ancestors. Fix: caveat in §6.6.

## 3/6/9 summary

### Node (3): the thing, its opposite, the test

**World**
- Running engine / replay with no mind / D1, D3.
- A truth that changes / the stationary world / E3 (weak; finding 4).
- Health books: none.
- Around: the counter-based schedule. Inside: the state and books (E only). Bridge: the contract.

**Bridge**
- Encode / decode and readBack / B1, B2.
- Act / refusal / canAct plus act, B4.
- Answer decidable from what the slot sees: none (finding 1).
- Table as approved / table as used: none (finding 8).

**Mind**
- Live / frozen / E1.
- Own timeline / another's / E2 (built in; finding 4).
- Choice rule / learned policy: none in v1 (named).
- Season node: none (finding 5).
- Around: nursery and soul records. Inside: frozen trunk, private heads, sting. Bridge: see / choose / feel / publish.

**Measures**
- Ahead / behind or tied / comparison rule with the F−F′ floor.
- Home / foreign / F's home advantage = 0.
- More training / own timeline / E3 at a ceiling; Y is the real test.
- Better on NGE / worse on health: none (finding 6).

### Bridge (6): handshake, way back, choosing not judging

**World <-> character**
- Handshake: whole.
- Way back: the ANSWER and the sting, but some answers cannot be foreseen (finding 1).
- Choosing, not judging: refusals are typed, except ERR_FULL on hidden state and ERR_DOWN with no pain.

**Character <-> character**
- Handshake: no ask (named); the donor has no say (finding 12).
- Way back: to the receiver only; none to the donor (named).
- Choosing, not judging: the fit label lives only in the scorer, but the gate is predicted blind to fit (finding 5).

**Model <-> engine**
- Handshake: the mind asks, the engine permits.
- Way back: the engine hears nothing. This is fine for a fixed rule-holder, but name it.
- Choosing, not judging: the engine is the only judge of validity.

**Owner <-> world**
- Handshake: the seat uses the same validator; the designer asks the owner (§8).
- Way back: the seat lacks the pain numbers, and nothing reports back how the approved values landed (finding 2).

### Whole (9): closed triangle or chain?
- **The tick loop** world → bridge → mind → bridge → world closes. World and mind meet only at the bridge, which is a hub by design; name it.
- **The owner triangle** (owner, world, mind) is open on two edges:
  - mind → owner is read-only (named);
  - world → owner gives no report of how the values landed (unnamed).
- **Across lives**, it is a chain that ends at the soul records (named, stage 2).
- **Characters** meet only at the mind level, one way.
- **Measures** are terminal by design, which is correct for pre-registration; name it as a chosen chain.
- **Dead ends in v1:**
  - soul records;
  - throttle and loop-break;
  - the sting in the R9 branch;
  - fear;
  - stage after it saturates;
  - the donor's way back;
  - P_local.

### Fourth point: where each choice sits
- **Named and given to the owner:** the 16 decisions in §8.
- **Left implicit:**
  - what counts as better;
  - values blind to need;
  - ERR_DOWN with no pain;
  - the fit label;
  - help that replaces the receiver's own message;
  - season awareness left to the optimiser;
  - Rule 5's irrevocability dial;
  - the Rule 6 statement;
  - the Rule 4 limits.
- **At the wrong level:**
  - the action choice, at a slot that cannot see the body (finding 1);
  - trust in help, at a gate predicted blind to fit (finding 5);
  - season tracking, with no node at all (finding 5);
  - ε, listed as both an owner value and a value the author may tune (finding 5);
  - the Rule 1 check, written by the party it checks (finding 7).
- **At the right level:**
  - the validity of world writes, at the engine;
  - keeping a shared weight change, at the held-out check;
  - intensity, above the character;
  - values, with the owner;
  - the lens, which chooses nothing.