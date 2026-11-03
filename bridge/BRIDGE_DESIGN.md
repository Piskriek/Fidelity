# Four Valleys: the bridge between a running world and the levels mind (synthesis design v1)

**Status.** This is a design for the owner's review. Nothing was built or edited. To check facts for the synthesis I read:
- `levels_v6.mjs`: the header, CFG, the parameter list and the forward pass;
- `RUNLOG_v6.txt`, `V7_CANDIDATES.md` and the verdict list in `PREREG_v6.md`;
- `HARNESS_MAP.md` §5 and §6, and its list of tests;
- in `wave0_reference.mjs`: the ledger, gateway and soul-line functions;
- the Plan's §8.5 Rules 1–7 and its §8.6 rulings.

I also ran two Node one-liners: the sign-test tails, and the laptop's Node version (24.19.0). The v6 results are not on disk yet. There is no `results_v6` folder, and `RUNLOG_v6.txt` records only the hashes taken before training. So nothing below depends on how v6 scores.

**Labels.**
- [choice]: a starting value or design choice the owner can change.
- [Plan]: the Plan says it.
- [code]: it is in the reference code.
- [checked]: I read or computed it for this document.
- [estimate]: not measured.

**Where the pieces come from**

| Source | Taken |
|---|---|
| MVP design | The world (four valleys, seasons, kinds that are shared or local). The 4-token tick block aligned to the rungs. The yoked control, the stationary negative control and the transplant test. The rule that each model seed must agree. The build measured in days. |
| Plan-faithful design | Gentle lives, with no death by default. The World Ledger, where minds' choices are logged so a replay never re-runs a mind. Weight changes between lives that are staged and kept only after a held-out check. Soul records written with wave0's own functions. The stage that only rises. The pain and fear terms held at zero until the Rule 4 play-test. The P_local reading. Module names that map to Plan packages. |
| Risk-first design | A shared trunk with private live heads, so there is no hidden channel between characters. Learning on prediction only, with a declared choice rule. Measuring cross-machine parity at step 0. Lockstep that stalls and never skips, with double-buffered messages. The T5 sub-tests. Leakage tests. Planted-leak mutants written by a fresh reviewer. A world count as the primary readout. The glossary. |
| New in this synthesis | A contract that works with any engine. Live head learning in closed form, so the live loop needs no tape. Transplant probes run in place by swapping heads. Collapse in place of death. |

---

## 1. Purpose

**What it builds.** The seam between a running game world and the levels mind, plus the smallest world that can test that seam. In the owner's terms:
- a character acts;
- the engine answers, where engine errors are pain and engine warnings are fear;
- the character feels the answer and changes, while the engine runs.

**Deliverables**
1. **The bridge.** A contract that does not depend on any one engine. The first world is a stand-in engine. A later Fidelity engine implements the same contract, so the mind side does not change.
2. **A pre-registered test** of three claims:
   - characters that keep learning from their own experience do better than a frozen copy of themselves;
   - the gain is not just "more training";
   - what they learn fits their own timeline better than another character's.

**It must show that it does not repeat MarbleGp's leaks.** MarbleGp's runtime is Bucket C, so no code comes over. Only the patterns that hold are carried (HARNESS_MAP §5).

| MarbleGp leak (HARNESS_MAP) | Rule here | Tests |
|---|---|---|
| T1/T8: no translator, no round trip | Every crossing is a declared channel with an inverse and a census | B1, B2, B3, B5 |
| T3: the lens says what the world does not hold | Every shown claim carries a predicate on the snapshot | L1, L3 |
| T5: hardware reaches into the simulation | The governor touches only the lens. Time is logical lockstep. Compute per decision is fixed. P_local is a declared constant. | D0, D2, D4, D5, D6 |
| T4/T7: consent rather than reliability, and self-accepting | Only the engine's own check decides a world write. The harness decides a shared weight change, on held-out evidence. Nothing accepts its own change. | W5, W6, the stage-2 dream check |

**Patterns carried** (as patterns, not code):
- the stage is state and only rises;
- a frame-time governor that only ratchets one way;
- ground LOD, where the picture changes and the world does not;
- placement that checks twice and throws;
- staged, revertible edits;
- state-to-render tests.

**Not claimed.** That the characters feel, or are alive. The glossary in §6.6 governs every report.

---

## 2. The first world: Four Valleys v1

### 2.1 Shape
- One engine, four valleys, one character per valley.
- All valleys tick in lockstep in logical time.
- There is no space and there are no coordinates (space comes in stage 3).
- Integer state only.

### 2.2 State

| Part | Content | Type |
|---|---|---|
| Body (per valley) | Energy E 0..15, health H 0..15, `down` 0..8 (collapse countdown) | Int32 |
| Slot (per valley) | This tick's item: none, a, b or c | Int32 |
| Season | Index s, end tick, effect table 4 valleys × 3 kinds of {NOURISH, PLAIN, TOXIC} | Int32, Int8 |
| Intensity | ℓ per valley, 1..3, held at 2 in measurement runs | Int32 |
| Stage (per valley) | S0a..S6 as 0..7; only rises; only the lens reads it | Int32 |
| Counters | Collapses this season, collapses by cause, seat flag | Int32 |
| Header | Tick t, world seed, preset hash, previous chain hash | Int32, bytes |

Birth values are E = 12 and H = 15 [choice]. They map the Plan's birth vital 90 and hp 1 onto a 0–15 scale.

### 2.3 The schedule outside any character's control

All draws are counter-based: `hash32(seed, purpose, a, b, ...)`, using murmur3 fmix32 and `Math.imul`. No draw depends on how many draws came before it, so nothing a character does can shift the world's later random numbers. Every arm therefore meets the same fruit and the same seasons.
- **Item:** `hash32(worldSeed, ITEM, v, t) mod 4` gives none, a, b or c, each 1/4.
- **Season length:** `384 + hash32(worldSeed, LEN, s) mod 257`, so 384–640 ticks [choice]. It is the same for every valley and never announced.
- **Table per kind k:**
  - if `hash32(worldSeed, SHARE, s, k, r) & 1`, every valley gets the same effect, `hash32(..., EFF, s, k, 4, r) mod 3`;
  - otherwise each valley draws its own, `hash32(..., EFF, s, k, v, r) mod 3`.
  - If any valley is left with no NOURISH kind, the season is redrawn with draw counter r + 1 [choice].
- **Result:** another valley's experience fits yours on about 1/2 + 1/2 · 1/3 ≈ 2/3 of kinds [arithmetic, before the redraw condition]. The world produces "help from another timeline" by itself; nothing has to be planted.

### 2.4 Actions and the tick order

**Actions (3):** EAT, PASS, REST.

**Tick order.** This follows B128's proposal: input, then body, then render. B128 is a Plan proposal and needs a ruling (§8).
1. **Observe.** The bridge delivers each character's tokens.
2. **Collect.** The four actions arrive. The world waits for all four; it stalls and never skips.
3. **Resolve.** Each valley in index order. `canAct` is pure. `act` checks again and throws `WorldRefusal(code)`. The engine boundary turns a refusal into a typed error in the answer. A refusal is never clamped, replaced or dropped.
   - `down > 0`: any action is refused with ERR_DOWN. Then H += 1 and down −= 1, and metabolism is skipped (a protective rest).
   - EAT with no item: ERR_EMPTY.
   - EAT a NOURISH kind: E = min(15, E + 5), answer FED.
   - EAT a PLAIN kind: E = min(15, E + 1), answer PLAIN.
   - EAT a TOXIC kind: E = min(15, E + 1) and H = max(0, H − 2ℓ), answer TOXIC.
   - PASS: answer OK.
   - REST at H = 15: ERR_FULL. REST at E = 0: ERR_SPENT. Otherwise H += 1 and E −= 1, answer RESTED.
4. **Metabolism** (when not down). If E > 0, E −= 1. Otherwise H = max(0, H − 2) and the tick is flagged starving.
5. **Collapse.** If H = 0, the answer becomes COLLAPSE and down = 8 [choice]. The body wakes at H = 8 and E is unchanged. This is a gentle stand-in for the Plan's protective syncope. Death is an owner switch, off by default (§8).
6. **Bookkeeping.** Season clock, then stage, then the energy books check, then the hash chain and the log.
7. **Render**, read-only. The governor may skip drawing; it never skips the world.

### 2.5 Values, pain and fear (the engine as ego)

The value table is declared and integer [choice; it needs the owner's Rule 4 approval].

| Answer | Gain | Pain severity (an engine error) |
|---|---|---|
| FED | +3 | – |
| PLAIN, RESTED | +1 | – |
| OK, ERR_DOWN | 0 | – |
| ERR_EMPTY, ERR_FULL, ERR_SPENT | – | 1 (the action was refused) |
| TOXIC | – | 2ℓ (4 at ℓ = 2) |
| starving flag | – | 2 more |
| COLLAPSE | – | 8, replacing the tick's other terms |

- The tick's value is V_t = gain − pain. The character's tokens carry exactly what it is scored on. There is no hidden reward channel.
- **Warnings (fear)** are visible in the body token before the character acts:
  - HUNGRY: E 1–4;
  - STARVING: E = 0;
  - WEAK: H 1–5.
- Fear level f_t is the number of warnings active, 0–2 (HUNGRY and STARVING exclude each other). By default it is information and has no cost (§8).
- **Two wants:** energy and health. REST trades energy for health.

### 2.6 Stage, energy books, lives and the ledger

**Stage.** A valley's stage rises by one at a season end if that valley had no collapse that season. It never falls, and loading never raises it. The mind never sees it. It exists so the lens has a claim that can be false (MarbleGp's hardcoded "Stage 1" line), and W4 and L1 check it.

**Energy books.** Each valley gets its own `createEnergyLedger()` from wave0 [code].
- Stored energy is E, in integer joules; the unit is a design label.
- The birth E is the opening balance, so no port is needed.
- Eaten fruit posts its energy (5, 1 or 1) on `stellar`.
- Overflow above 15, metabolism and the REST cost post to `thermal`.
- `ledgerCloses({..., tol: 0})` runs every tick. The residual is computed with plain addition and subtraction [checked], and every amount is a small integer, so the doubles are exact.

**Lives.** A life is 16,384 ticks, about 32 seasons [choice]. There is no death in v1. Soul records are written at the end of each life (§4.7).

**World Ledger** (Plan proposal B127, needs a ruling). It holds:
- the format, the genesis seed, the preset hash and the code hash;
- one byte of actions per tick (4 characters × 2 bits), so a life's action log is 16 KB;
- every 256th value of the hash chain;
- the life boundaries;
- the seat sessions.

**Hash chain.** h_t = SHA-256(h_{t−1} ‖ canonical little-endian state bytes ‖ action byte), using the built-in `node:crypto`. A mismatch can be bisected to its first tick.

**Size.** About 300 lines [estimate]. A bare run with scripted policies should take well under a minute per million ticks [estimate].

### 2.7 Why this world
- It has a want, a risk, three ways to be refused, and a truth that changes without warning.
- The frozen copy's context covers about 4 ticks, so a season can only live in weights. That leaves room to learn, but it also makes E1 close to built in (§9).
- A tabular learner will probably match or beat the neural mind. That is fine: the study tests the framework as a character mind, not that a neural mind is needed.

---

## 3. The bridge

### 3.1 The seam (the contract between any engine and the mind)

```js
// Engine side: Four Valleys now, the Fidelity engine later
engine.observe(c)    -> { body: {eBand, hBand} | 'DOWN', item, lastAnswer }   // the declared slice only
engine.canAct(c, a)  -> { ok: true } | { ok: false, code }                     // pure
engine.step(acts[4]) -> { answers[4], warnings[4], hash }                      // act() re-checks; throws WorldRefusal inside
engine.snapshot()    -> deep-frozen state                                      // lens, audits and probes only
// Mind side
mind.see(c, token)                      // forward one token
mind.choose(c, u)   -> actionToken      // at the ACTION slot, u = common random numbers
mind.feel(c, answerToken, facts)        // forward ANSWER, update the sting, one step on the heads
mind.publish(c)     -> Float64Array(64) // u2, for the bus, read next tick
```

**What any engine behind the seam must do:**
- be deterministic from (seed, action log);
- never import a mind;
- report refusals as typed error codes and limits as typed warnings;
- expose only the declared slice;
- accept writes only through `canAct`/`act`;
- read nothing from the host machine.

`bridge.mjs` is the only module that imports both sides. Pain and fear numbers come from engine facts through declared tables in the bridge, never from the mind or the lens. Each crossing is a declared channel: `{encode, decode, readBack, predicate, census}`. When bodies arrive (stage 3), the graph-to-rig translation becomes one more channel, not a rewrite.

### 3.2 World to character (perception)

**The tick block** is four tokens: BODY, ITEM, ACTION, ANSWER. Rung 0 reads the two tokens before the slot it predicts (v6: k = 2 [checked]), so:
- at the ACTION slot it sees BODY and ITEM: what it decides from;
- at the ANSWER slot it sees ITEM and ACTION: "how will the world answer this act";
- rung 1 fires at each BODY slot and reads the last four rung-0 states, which together cover the previous tick (see, act, feel);
- rung 2 fires every 4 ticks.

**Vocabulary (34 tokens)** [choice]

| Group | Tokens | Count |
|---|---|---|
| PAD | before a life's first token | 1 |
| BODY | E band {0, 1–4, 5–10, 11–15} × H band {1–5, 6–10, 11–15}. Each warning is an exact predicate of the band. | 12 |
| DOWN | the body while collapsed | 1 |
| ITEM | none, a, b, c | 4 |
| ACTION | EAT, PASS, REST | 3 |
| ANSWER | The reachable pairs only: OK, RESTED, ERR_EMPTY and ERR_FULL, each fine or starving (8); FED, PLAIN and TOXIC fine only (3); ERR_SPENT starving only (1); COLLAPSE; ERR_DOWN | 13 |

Each reachable value of the declared slice has exactly one token, and no token stands for two (the "or" problem T1 found). Reachability is confirmed by exhaustive search in test B1.

**VIEW_KERNEL** is a constant that lists what the view drops:
- the effect table, the season index and its clock;
- the stage;
- exact E and H inside a band;
- other valleys;
- ℓ;
- the fit label;
- the action's own outcome on a collapse tick.

No absolute coordinate exists. When space comes, the view will be in the character's own frame (the T6b lesson).

### 3.3 Character to world (action)
- The action token is the only port from mind to world.
- `decodeAction` is total and injective. An unknown token throws, and a stale tick stamp throws.
- Then: `canAct`, and `act` checks again and throws. A refusal comes back as an `ERR_*` answer, which is the pain.
- The owner's seat uses the same port and the same validator. There is no privileged path.

### 3.4 Help from another timeline (the bus)

This is v6's bridge 2, unchanged in form [checked against `levels_v6.mjs`].
- **Schedule.** Time is cut into 64-tick segments (256 tokens, v6's `seg`). In each segment a character is a receiver with probability 0.25 (v6's `rho`). The donor is chosen by `hash32(runSeed, DONOR, c, segment)` among the other three.
- **The message.**
  - The receiver's bridge-2 source is the u2 the donor published at the end of the previous tick (double-buffered).
  - It is a constant: no gradient goes back to the donor.
  - It is norm-locked, `msgScale` 0.5.
- **The gate.** The receiver's relational gate decides: `G20 = sigmoid(q·k/4 + c + ws20·sting)`, with the query from the receiver's x0 and the key from the donated source. The receiver's own help on bridges 0 and 1 continues.
- **The fit label.** The donor's table agrees with the receiver's on the receiver's current item. This label exists only in the scorer.
- **Arms without help** run the schedule at rate 0.

### 3.5 The handshake, the way back, choosing not judging

| Bridge | Ask | Permission | The way back | Choosing, not judging |
|---|---|---|---|---|
| A world action | The action token | The engine's double check, the only judge of validity | The ANSWER token, plus pain and fear in the sting | A refusal is a typed fact. It changes nothing but the tick's metabolism. It is not a grade. |
| Help between timelines | **missing** (V7 #1) | The receiver's gate | To the receiver only, through its relief term (did the help help). **The donor never hears how its help landed** (V7 #2). | The fit label lives only in the scorer. The donor is never penalised. |

Both missing parts are named, not forced. Each enters in stage 2 as one change, and the bus has room for both (an ASK action, and a "taken / not taken" return).

### 3.6 Reliability gates (T4, T7)
- **World writes:** only the engine's check decides. A mind's confidence, a click or an agent's approval counts for nothing.
- **The live head step:** it touches only the character's own private weights, on a fixed schedule. It can never write the shared trunk or the world.
- **Shared weight changes** (stage 2, between lives): staged, and kept only if the harness's held-out check passes. The mind never accepts its own change.
- **No path to `act()`** from the lens, a narrator or the telemetry. The import graph is tested.
- **AI edits to presets:** none in v1. When they come, they are staged, revert on a timer, and are accepted only by a human action.

### 3.7 Round trip (T1, T8)

Each test counts something, and every pass mark is 0.
- **B1, exhaustive:** decode(encode(x)) = x for all 13 bodies × 4 items × 3 actions × 13 answers. No token is shared, and every reachable answer set has exactly one token.
- **B2, every tick of every run:** `readBack(tokens actually delivered)` equals `observe(state)`. It reads what arrived, not what the encoder meant to send.
- **B3, log round trip:** the token streams regenerated from (seed, log) equal what each mind received, bit for bit.
- **B4, action port:** 10^5 random logit vectors under the mask never decode to anything other than an action. Unknown tokens throw.
- **B5, scene census (T8):** the terminal view's fields per valley, read back, equal the declared projection of the snapshot.
- **T1 for graph to rig** does not apply in v1, because no translator exists. Before bodies ship, `translateWiregraphToRig` must be a channel with a pin census (§8, the "or" ruling).

### 3.8 Lens truth (T3)
- **L1:** every line the lens shows (the view, the HUD, system notices) carries a predicate on the snapshot. This extends MarbleGp's `validateScreen` from "bound" to "true".
- **L2:** the world hash is unchanged by rendering, narration and probes. The lens reads `structuredClone` copies that are `Object.freeze`d.
- **L3:** the telemetry shown (sting, gates, predictions) is recomputed from the logs and must match. Engine facts ("the engine raised TOXIC at tick 212") and the mind's own numbers ("predicted pain 0.31") are labelled separately. The lens never says "it suffers".
- **L4:** the seat shows exactly that character's four tokens per tick, in words.
- **Level of detail:** the view may summarise far valleys, so the picture changes and the world does not (the ground-LOD pattern). D4 enforces this.

---

## 4. The mind

### 4.1 Base, and a rule fixed in advance
- **The copy.** v6's operations (tape, matvec, rmsnorm, act, relScore, softmaxCE, Adam, mulberry32) are copied into `mind/v6_ops.mjs`, with `levels_v6.mjs`'s hash recorded. It must equal `fcec7505…` from `RUNLOG_v6.txt` [checked], re-checked when copied. `levels_v6.mjs` is not touched.
- **Shapes, kept from v6:** k = 2, e = 16, d = 64, H = 128, span1 = 4, span2 = 16, fan = 4, dq = 16, aux 0.3, `msgScale` 0.5 [checked].
- **The base architecture**, fixed now so the world results never depend on v6's verdicts:
  - if v6's V2 (RC ahead of R9) passes, the base is RC with the 5-term sting;
  - otherwise it is R9, with the sting computed and logged but not felt (Ps = ws = 0).
- Every neural arm uses the same base.
- **Size:** about 86.7k parameters at V = 34 [my count from v6's shapes].

### 4.2 Streams as characters: a shared trunk, private heads
- **Streams.** One stream per character, so one timeline each. v6's four streams become the four characters. Each stream carries its own state: hist0, hist1, u1p, u2, u2raw, x0p, the per-rung moving averages and the sting.
- **The trunk** is everything except two heads. It is shared, and frozen within a life.
- **Private live heads per character:** the main head (`Wout`, `bout`) and the rung-0 auxiliary head (`A0`, `a0`): 2 × (64 · 34 + 34) = 4,420 parameters [count].
- **Why:**
  - **No hidden channel.** Live updates to shared weights would let one character's experience reach another without passing the receiver's gate (the risk-first design's argument).
  - **One language.** Donated u2 stays in the shared trunk's "language". Separate forks would drift apart (a risk the MVP design names).
  - **Each valley in its own weights.** The heads hold what one valley's season taught.
  - **Transplant is a head swap** (E4).
  - **Matched capacity.** The frozen control F has the identical parameter set.
  - **No tape live.** The input to the heads is a constant during a life, so the gradient is closed-form: dW = input ⊗ (p − onehot).

### 4.3 Inputs
- the 34-token stream;
- the 5-number sting, felt from the next token on;
- on help arms, the donated u2 on its schedule;
- the stream counter is aligned so the first BODY of a life is n = 0, which puts rung 1 on every BODY and rung 2 on every 4th BODY.

### 4.4 Outputs, and the choice rule
- **Next-token distributions:** the world model, "how will the world answer". The main-head target at the ACTION slot is masked everywhere, so the mind never imitates its own behaviour.
- **The action**, chosen at the ACTION slot by a declared rule over the character's own predictions [choice; who owns the choice is an owner decision]:
  1. For each a in {EAT, PASS, REST}, run the ANSWER-slot forward with inputs (ITEM, a), as a pure function. The current u1p and u2 are unchanged, because no rung fires at ANSWER.
  2. Take π_a, the main head's distribution over the 13 answer tokens, renormalised.
  3. U(a) = Σ π_a(ans) · value(ans), using the declared table of §2.5.
  4. With probability ε = 0.1 [choice], explore: one counter uniform decides whether to explore, a second picks the action uniformly. Otherwise take argmax U, with ties broken in the order PASS, EAT, REST.
  5. Both uniforms are keyed by (worldSeed, modelSeed, c, t), so paired arms act differently only where their U differs. F′ uses a second key.
- **The published u2**, for the bus.
- **Why a rule and not a learned policy in v1:**
  - Nothing learned can game the pain signal.
  - Behaviour changes only because predictions change.
  - It costs 3 partial forward passes per character per tick, and the real ANSWER forward reuses the chosen candidate.
  - The cost: the rule is the designer's. In this world it is enough because each action's main effect lands in its own tick. A learned policy trained on the sting is a stage-2 arm.

### 4.5 The sting

The sting has five numbers with no gradient. It is set after ANSWER_t and felt from BODY_{t+1} on.

| # | Term | Source |
|---|---|---|
| 1 | pain_t / 8 | An engine fact: the severity sum of §2.5 |
| 2 | fear_t / 2 | An engine fact: the warnings in BODY_t |
| 3 | surprise: main CE on ANSWER_t minus its running mean (keep 15/16) | The mind |
| 4 | relief: aux0 CE minus main CE on ANSWER_t ("did the help help"; v6's proxy, with v6's stated limit) | The mind |
| 5 | running mean of relief | The mind |

- **Where it is felt** (RC): u2 += Ps · sting at rung-2 boundaries, with Ps of size 5 × 64; and score += ws · sting on gates G0, G1 and G20. Both start at zero and are learned in the nursery.
- **The two engine terms stay at zero until the owner has played the seat** (Rule 4) and approved the severity table. The nursery runs after that play, so the trunk learns Ps and ws with the terms already live.

### 4.6 The fast loop (live, while the engine runs)

Each tick, for each character:
1. Forward BODY, ITEM and the ACTION position (its target is masked).
2. Compute U over the counterfactuals, choose, send.
3. The engine steps.
4. Forward ANSWER for real (the same computation as the chosen candidate; K5 checks this).
5. Update the sting.
6. Take one Adam step on the private heads with loss CE_main(ANSWER) + 0.3 · CE_aux0(ANSWER): learning rate 2e-3 (v6's peak), β = (0.9, 0.999), clip 1.0, no warmup [choice].
7. Publish u2.

The trunk only feels: the sting moves its state and gates; its weights never change within a life. The frozen arm skips step 6. Compute per tick is fixed and never depends on the machine.

Cost [estimate, from the risk-first designer's reading of v4's run log, about 2,550 training tokens/s per process on the 3080]: forward only, plus 2 extra partial passes, is about 2.5–4 ms per tick for four characters. So a 16,384-tick life takes about 40–65 s. Step 0 measures it.

### 4.7 The slow loop

**In v1: records only.**
- **At the end of a life**, each character's ms line is written with `formatMsLine` [code]:
  - vital = 5 + 95 · E/15;
  - strain = the pain moving average × 10 [choice];
  - hp = H/15;
  - debt = the number of open causes;
  - chose = the world's catalyst set;
  - s, arch and pol stay at their defaults, because B179 has no update rule.
- `parseMsLine(...).invalid` must be empty, or the build throws.
- **A pointer record** sits beside the ms line: SHA-256 of the trunk, the heads and the Adam state. 86.7k weights cannot fit the 4096-byte cartridge.
- **Episode and cause records** (me and mc lines) are written as data for stage 2:
  - each pain event becomes a `me` line: t, cat = the error code, ex = surprise, err = severity;
  - `mc by=<action>:<item> d=<error>` opens when the same error recurs from the same act within a season;
  - it closes when the character PASSes that kind while it is still toxic (assimilation), or when the season ends.
- **The Rule 1 check at start:** a character whose `chose=` does not cover the world's catalyst set is refused, and the build throws.

**Stage 2: the dream between lives**, following the stages the Plan gives `dream.ts`. It is built after v1 is scored, one change per arm.
1. **higherSelfCue:** close or keep causes; set the throttle (Rule 2).
2. **replay:** `selectEpisodes(me, mc)` [code] picks the pinned unresolved episodes first.
3. **rebalance:** train a staged copy of the trunk and head template on the union of the four lives' logs, plus a fixed reservoir of nursery logs against forgetting.
4. **Accept or revert.** The harness keeps the copy only if world-model CE on a fixed held-out set gets no worse than ε and improves on the last 10% of the life.
5. **Rebirth.** Then `rebirthTransfer` [code]: arch, pol, open causes, debt and chose carry; vital, strain and hp are rebuilt; s blends 80/20; the episode window does not carry. The private heads reset to the (new) template; that is an owner decision.

**The throttle (Rule 2) and loop-break (Rule 3)** are built and unit-tested in `soul/` in v1, and set from above between lives:
- ℓ ∈ {1, 2, 3};
- the loop-break fires at N = 3 collapses from the same cause in a life [choice].

In measurement runs ℓ = 2 is fixed for every arm and the loop-break is only logged.

### 4.8 The nursery (the ancestor)
- **Data.** Behaviour logs from nursery world seeds, a range kept separate from all others. The behaviour policy [choice] is 50% uniform random and 50% a script that does not know the table: eat any fruit if E ≤ 10; otherwise REST if H ≤ 10; otherwise PASS.
- **Training.** v6's own training loop, with a pluggable data source:
  - 4 streams, which are the 4 characters;
  - L = 32 tokens per stream per step;
  - lr 2e-3, warmup 200, clip 1;
  - the ACTION target masked;
  - the bus schedule as in §3.4, so G20 is trained on donors that fit and donors that do not;
  - heads shared (the template).
- **Size.** 40,000 steps per seed, which is 320k ticks per character, about 600 seasons.
- **Two nurseries:**
  - the seasonal nursery for the main study, model seeds 1–3, giving W0_s;
  - a stationary nursery for the E3 control: one fixed table for the whole nursery, seeds 1–3, giving W0stat_s.
- **Time.** The six runs in parallel on the 3080 take about 45–60 minutes [estimate].
- **Text mode.** The same trainer with the text corpus as its data source and all new flags off must reproduce `levels_v6.mjs --arm R9 --seed 1 --steps 300` exactly on one machine (check N3).

### 4.9 Where each choice sits (the fourth point)
- **The action:** the character, from its own predictions at rung 0 with what flows down from the 4-tick top, under a rule the designer declared.
- **Trust in help:** the receiver's gate, which reads both sides.
- **Keeping a shared weight change:** the slow loop's held-out check, whose awareness covers a whole life.
- **Catalyst intensity:** the throttle above the character, between lives.
- **Validity of a world write:** the engine, the only holder of the rules.
- **Values:** the owner.
- **The lens** chooses nothing.

---

## 5. Determinism and the governor

**World.**
- Integers only, with counter-based hashing and a SHA-256 chain over canonical bytes.
- The world has no transcendental Math functions, so a replay on another machine should match by plain integer arithmetic. D2 confirms it.
- The minds' choices are ledger events, so a world replay never re-runs a mind.

**Mind.**
- Bit-identical on one machine (D9).
- Across machines it uses V8's `Math.exp`, `log` and `tanh`, which may differ between Node 22 and Node 24. Step 0 measures this. The default is to report the first tick where the two machines diverge. A mind with its own exp, log and tanh is a declared fallback the owner may require (§8).

**Time.**
- Logical lockstep: the world stalls for a slow mind, and the lens shows the slowdown.
- Messages are double-buffered, so the order in which minds finish cannot matter.
- Learning runs on a fixed schedule in ticks.
- Compute per decision is fixed: 3 counterfactuals and 1 head step.
- The seat is turn-based with no timeout, because a timeout would be a silent default action driven by wall time.

**Governor** (`lens/governor.mjs`):
- MarbleGp's one-way frame-time ratchet (two roomy windows to rise, never back to a tier that was too slow) and the Settings lock. Unknown or NaN VRAM gives Tier 1.
- Its output changes only how often the view draws and how far valleys are summarised.
- It never changes the tick rate, mind compute, model size, population or perception.
- A smaller mind for weak hardware would be a different declared world, not a quality tier. That rules out PLAN_INTO_LLM's idea of choosing model size from VRAM as a tier.

**P_local.** It is not used in v1, which has no gateway. The default recorded now is a declared constant in the world preset (§8, decision 1).

**Determinism tests** (pass marks are 0 differences):

| Id | Test |
|---|---|
| D0 | Static scan. world/, bridge/ and mind/ have no `Math.random`, `Date`, `performance`, `process.hrtime`, timers or async. world/ also has no `Math.exp/log/pow/sin/cos/tan/tanh/hypot/cbrt`, no `Float32Array`, no `for-in` and no unsorted Map/Set iteration in hashing. Import graph: world imports only world/ and the vendored ledger; mind never imports world; only lens/ imports lens/. |
| D1 | (seed, preset, action log) replays the identical per-tick chain |
| D2 | The same logs give identical chains on the laptop (Node 24) and the 3080 (Node 22) |
| D3 | A run's action log replayed with no mind loaded reproduces its chain |
| D4 | Render tiers {none, terminal-low, terminal-full} × frame budgets {8, 16, 33, 100 ms}: identical chains, token streams, action logs and head hashes |
| D5 | Injected mind delays of 0–200 ms with shuffled completion order: identical |
| D6 | 1 process against 4 worker threads (one per character), with the character order reversed: identical |
| D7 | Save at seeded ticks (world plus mind: stream states, heads, Adam moments, RNG counters, sting), load and continue: equal to the uninterrupted run. Logging out heals nothing. |
| D8 | Distinct seeds diverge |
| D9 | The same machine twice: identical head hashes and action logs. Cross-machine: report the first divergent tick. |

---

## 6. Measures and a pre-registration sketch

### 6.1 Arms

Every neural arm has the identical parameter set.

| Arm | What it is |
|---|---|
| **F** | The frozen W0_s, forward only. Its in-context state and sting still run. The key control. |
| **F′** | F with a second action-sampling stream: the noise floor. |
| **L** | Live private heads from W0_s, learning on its own ANSWERs. |
| **Y** (yoked) | The same number of head steps with the same optimiser, but on a shadow stream: the L run's logged tokens of character (c+1) mod 4, at the same model and world seed. It acts in its own valley. It learns from another timeline wholesale, with no gate. |
| **LH** | L plus help from another timeline on the §3.4 schedule (rate 0.25). |
| **L_stat, F_stat** | L and F from W0stat_s, in the stationary world that matches their nursery (for E3). |
| References, not graded | O, an oracle that knows the table: eat NOURISH and PLAIN, REST if H < 15 with no good fruit, otherwise PASS. T, a tabular learner: per-kind running mean of EAT answer values with keep 0.9, the same ε and the same REST rule. S, the nursery script. RND, random. |

### 6.2 Seeds and pairing
- Model seeds 1–3; live world seeds 101–116; so 48 pairs. Seed ranges are listed in RUNLOG and checked disjoint (K7).
- One life of 16,384 ticks per run, ℓ = 2 throughout.
- The readout runs from the first season boundary to the end of the life.
- Common random numbers on the world and on action sampling.

### 6.3 Readouts
- **Primary (a world count, not the pain signal):** NGE, defined as (NOURISH eats − TOXIC eats) per 100 ticks with an item, counted by the scorer from the event log under each valley's true table.
- **Secondary:**
  - mean V per tick;
  - pain per 100 ticks, read only together with mean E/15;
  - collapses per 10k ticks;
  - eat rates on toxic and on nourishing fruit;
  - recovery: ticks after a season change until a kind's toxic-eat rate over its last 64 appearances falls below 0.2;
  - the last 4k ticks on their own (loss of plasticity);
  - a mechanism readout: the predicted P(TOXIC | kind, EAT) against the truth each season.

### 6.4 Rule and hypotheses

**The comparison rule** [choice]. X is ahead of Y when all three hold:
- (a) for each model seed, the mean of X − Y over its world seeds is > 0;
- (b) at least 36 of 48 pairs favour X (one-sided sign-test tail 0.00036 if the pairs were independent [checked]; they are not, which is why (a) is there);
- (c) the mean of X − Y is at least m, where m = max(1.0 NGE, 3 × the sd of F − F′ over the 48 pairs).

**Regime checks.** If one fails, E1–E4 read "no test".
- **M1:** S is ahead of RND (the world rewards skill).
- **M2:** O is ahead of F by at least 3m (there is room to grow).
- **M3:** T is ahead of F by at least m (the world rewards learning from experience at all).

**G0, build gates on the exact code hash of the scored run.** All of these must pass:
- every D, W, B, L, K and N test;
- the per-tick tests (B2, W2, W3, L1) running inside every scored run;
- 100% of the frozen planted-mutant set caught.

**Hypotheses**
- **E1, changed by its own experience:** L is ahead of F.
- **E2, from its own timeline:** L is ahead of Y.
- **E3, negative control:** |mean(L_stat − F_stat)| < m. If L_stat is ahead, E1 is downgraded to "more training helps".
- **E4, fits its own timeline.**
  - **Probe:** inside the L runs, at the 3/4 point of every 4th season, the four valleys' states are forked into sandbox copies with probe item seeds. Each of the four head sets runs frozen in each valley: a fresh stream state, 16 warm-up ticks, then 128 scored ticks, with the probe's random draws keyed by valley and tick (not by head set).
  - **Home advantage** = NGE(own heads at home) − the mean NGE of the foreign heads there.
  - **Pass:** at least 10 of 12 (valley × model seed) cells are positive, and the mean is at least m.
  - **Checks:** F's home advantage must be exactly 0, which tests the probe for bias. The main chain must be unchanged by the probes (L2).
- **H1, help:** LH against L, two-sided, reported only.
- **H2, choosing what fits:**
  - **Readout:** mean G20 at the ANSWER slot on help that fits minus help that does not fit. Ticks with no item are excluded.
  - **Control:** a scramble, with G20 deranged across characters in a frozen probe (v6's `scrambleKey`).
  - **Pass:** a gap of at least 0.05 on every model seed, and at least 0.02 above the scramble's gap.

### 6.5 Predictions, to be locked by the author

| Hypothesis | Prediction |
|---|---|
| E1 | Passes widely, and partly by construction: F's context is about 4 ticks. |
| E2 | Passes. |
| E3 | Passes (about 60%). |
| E4 | Passes. |
| H1 | No confident direction. |
| H2 | Fails. The gate is frozen within a life and cannot learn which donors fit. |
| T against L | T matches or beats L (reported, not tested). |

### 6.6 What counts as "evolved", and the glossary
- **"Evolved (within a life)"** is licensed only if E1 and E2 pass, E3 does not downgrade, and M1–M3 and G0 hold.
- **E4** adds "fits its own timeline".
- **"Feels"** means only that the sting reached the gates or the top.
- **"Living"** names the project and is never a finding.
- **A full pass may say:** in this world, characters that keep learning from their own experience do better than their frozen copy and better than a copy that learns from another's timeline; and each fits its own valley better than the other valleys.
- **It may not say:** that they feel, that the neural mind is needed, or that the results carry over to richer worlds.

### 6.7 The pre-registration file

`PREREG_bridge_v1.md`:
- written before any counted run, and hashed into `RUNLOG_bridge.txt` with the code, runner and scorer hashes;
- labelled not blind, since it follows from v4–v6 and from this design;
- every laptop smoke run is listed, and only ε, the head learning rate and the stationary nursery's table seed may be set by them;
- a fresh code review before launch;
- the report generated by the scorer;
- a fresh claim-strength reader before anything goes out;
- the held-out number is reported, never the tuned one.

---

## 7. File layout and build order

### 7.1 Layout

```
D:\fidelity-llm\bridge\
  MANIFEST.json              SHA-256 of every module and vendored file
  vendor\wave0_reference.mjs copy of C:\Fidelity\opus_night1\scripts\wave0_reference.mjs, unchanged, hash pinned
  vendor\v6_ops.mjs          ops copied from levels_v6.mjs, with a provenance header and the source hash
  preset\valleys_v1.json     every world value; its hash goes into the ledger
  world\hash.mjs             fmix32 counter RNG, canonical bytes, SHA-256 chain       (Plan: kernel)
  world\valleys.mjs          the engine: state, canAct/act, step, warnings, books, stage
  world\ledger.mjs           World Ledger: save, load, replay                       (Plan: worldsave)
  bridge\contract.mjs        channel list and interface shapes (data only)
  bridge\tokens.mjs          34-token table, truth predicates, VIEW_KERNEL
  bridge\bridge.mjs          encode/decode/readBack/decodeAction, pain and fear, lockstep runner
  bridge\bus.mjs             double-buffered u2 bus and help schedule
  mind\mind.mjs              forward-only trunk, private heads, choice rule, sting, head Adam
  mind\nursery.mjs           v6 training loop with pluggable data (world logs | text)
  soul\soul.mjs              ms, me, mc and pointer records, rebirth, throttle, loop-break   (Plan: soul)
  lens\view.mjs, lens\audit.mjs, lens\governor.mjs, lens\seat.mjs                    (Plan: governor)
  run\baselines.mjs, run\live.mjs, run\probe.mjs, run\score.mjs, run\worker.mjs
  test\lint|world|bridge|determinism|lens|leak|mind .test.mjs
  test\mutants\              planted leaks written by a fresh reviewer; frozen and hashed
  PREREG_bridge_v1.md, RUNLOG_bridge.txt
```

wave0 is vendored with its hash pinned rather than imported by path, so runs on the PC do not depend on the C:\Fidelity tree. A test checks that the copy still matches the source when that source can be reached.

### 7.2 Build order (each step has its own check)

| Step | Work | Check |
|---|---|---|
| 0 (about 1 h) | Run `levels_v6.mjs --arm R9 --seed 1 --steps 300` on both machines and compare the output JSON byte for byte (v6 writes no weight hash [checked]). Measure forward-only tokens per second on both machines. | Numbers in RUNLOG. The parity result sets D9's tier. |
| 1 | world/, preset, vendored ledger, World Ledger | D0, D1, D8, W1–W6 |
| 2 | bridge/tokens and bridge.mjs | B1–B4, K4, the import-graph part of D0 |
| 3 | Baselines, lockstep runner, bus (scripted minds only) | M1 and an early M2 (O against S against RND) before any neural code. D3, D5, D6, D7, K1, K3, K7. |
| 4 | lens/: view, audit, governor, seat | L1–L4, B5, D4. **Then the owner plays a valley in the seat (Rule 4), the run is recorded, and the severity table is approved. Until then the engine sting terms are 0.** |
| 5 | Replay on the PC: 3 logs × 10k ticks | D2 |
| 6 | Planted-leak mutants by a fresh reviewer. Examples: `Math.random` in the item draw; a fruit cap that depends on the render tier; a clock read; energy minted on eat; a lens that hardcodes "all green"; an encoder that drops an item; a counterfactual that writes stream state; a damaged ms line read as defaults. | 100% caught. The gate set is frozen and hashed. |
| 7 | vendor/v6_ops, mind.mjs, nursery.mjs | N1 gradcheck (worst relative error < 1e-5, covering the 5-term sting and both heads); N2 causality (changing token t changes nothing at or before it, including the action chosen at t); N3 text regression identical to v6 R9; D9; K2, K5, K6; N4 a head-learning smoke run on an unseen fixed table (listed). |
| 8 | Nurseries on the PC (seasonal and stationary, seeds 1–3; check `/tmp/worker.lock` first and write to F:, per the Plan-faithful designer's note [unchecked]) | Hashes in RUNLOG. A preliminary M3: F is ahead of RND. |
| 9 | PREREG and scorer, hashed; fresh pre-run review. Then F, F′, L (with E4 probes), LH, O, T, S, RND; then Y from L's logs; then L_stat and F_stat. | G0 on the exact hash. A sample replayed on the laptop. About 20–30 minutes on 20 processes [estimate]. |
| 10 | Score; claim-strength review; `RESULTS_bridge_v1.md` | The glossary governs the wording |
| 11, stage 2 | One change per arm: the dream between lives and rebirth (E5: across lives, the same and a new world); felt sting on against off; ASK (V7 #1); the donor's way back (V7 #2); a learned-policy arm; a longer-context arm | Each pre-registered separately |
| 12, stage 3 | Space (integer grid, own-frame view, origin64 rebasing); bodies through `translateWiregraphToRig` with the T1 pin census; the gateway; a 3D renderer as a pure lens over the ledger; the Fidelity engine behind the same contract | The D, B and L series carried over |

---

## 8. Owner decisions

These are value choices. Each has a recommended default.

| # | Decision | Recommended default |
|---|---|---|
| 1 | **Hardware and the world.** Plan §8.6 Q1 names "the host machine's `hw:` budget" as P_local "for the whole simulation" [checked]. That conflicts with "the same world on every machine" (T5). | P_local is a declared constant in the world preset. Hardware decides only how fast the world runs in wall time. Not needed until the gateway enters, but recorded now. |
| 2 | **Welfare: Rules 1–4 and 7.** These characters receive programmed catalyst. | They get soul records (Rule 7), so Rules 1–4 apply. Rule 4: you play a valley in the seat and approve the severity table before the pain and fear terms go live or any long run starts. Nothing claims they feel. |
| 3 | **Death** | Off. Collapse instead: 8 ticks of protective rest, waking at H = 8. Death is a switch for after Rule 4. |
| 4 | **Fear** | Information only, with no cost of its own |
| 5 | **Who owns the action choice** | v1: a declared rule over the character's own predictions. A learned policy trained on the sting is a stage-2 arm. |
| 6 | **Where live learning lives** | Private heads per character; the shared trunk changes only between lives. Live shared weights would be a hidden channel that bypasses the receiver's gate. |
| 7 | **What crosses rebirth** (stage 2) | Plan-strict: rebirthTransfer's ms line and open causes. Private heads reset to the template. The trunk takes the dream's staged update only if the held-out check passes. arch and pol carry unchanged until B179 sets a rule. |
| 8 | **Weights beyond the cartridge** | A pointer record (SHA-256 of trunk, heads and Adam state) beside the unchanged ms line, in a world-save envelope (B127 is still open) |
| 9 | **Throttle and loop-break in measurement runs** | ℓ = 2 fixed for every arm; the loop-break only logged; N = 3 collapses from one cause in one life |
| 10 | **Mind determinism across machines** | Report-only, unless step 0 shows parity for free. Our own exp, log and tanh only if you require bit-identical minds. |
| 11 | **World values** | 3 kinds, half shared; seasons of 384–640 ticks; the §2.5 table; birth E = 12, H = 15; lives of 16,384 ticks; ε = 0.1 |
| 12 | **Help's first form, and the missing ask and way back** | Another character's u2 on bridge 2 on v6's schedule. ASK and the donor hearing how its help landed wait for stage 2. |
| 13 | **Plan proposals the bridge rests on** | Adopt B127 (World Ledger) and B128 (tick order) for the bridge only, each in its own module. B129, B111 and B165 are not used in v1. |
| 14 | **The chose= vocabulary, and who writes it first** | {hunger, toxin, collapse}, written by you at genesis, read as the "automatically provided aid" the Plan cites (82.25) |
| 15 | **The graph-to-rig "or" choices** (needed only in stage 3) | The pin names its part, using the Plan-faithful designer's table: sensor_out → LiDAR ring, photon_in → lens, motor_torque → wheels, and so on. Or another declared function of state. |
| 16 | **Report glossary** | As in §6.6 |

---

## 9. Risks, and what is deliberately left out

### Risks
- **E1 is close to built in**, because F remembers about 4 ticks. E2, E3 and E4 carry the claim. If only E1 passes, the write-up says only that.
- **The tabular learner will probably match or beat L.** The study tests the framework, not that a neural mind is needed.
- **The heads alone may be too small to hold a season's table.**
  - Rung 0 sees exactly (ITEM, ACTION) at the ANSWER slot, so a linear head should be enough, but this is not shown.
  - N4 checks it before the lock. If it fails, L ties F and the report says so. Wider private parts are a stage-2 arm.
- **Slow exploration.** At ε = 0.1, a kind believed toxic is re-tested about once every 120 ticks [arithmetic]. Recovery time is a readout. A greedy rule with no ε would never notice a kind that changed.
- **Loss of plasticity late in a life.** The last-4k readout will show it.
- **Mismatch between nursery and live.**
  - The behaviour policy differs from the live rule. The answer given (item, action) does not depend on the policy, but the other tokens' statistics do.
  - The bus is double-buffered live but same-step in v6's loop. They differ on 1 token in 16. The nursery uses the double-buffered rule behind a flag that N3 keeps off.
- **Cross-machine float differences in the mind.** The world stays exact through the action log.
- **The sting's engine terms repeat what the tokens already carry**, so a felt-sting arm may show nothing. That would be a readable result.
- **Leaks coming back by the back door**: a renderer that skips ticks, a governor that touches the learning schedule, a seat that shows more than the character sees. The per-tick gates run in every run, and the mutants keep the gates honest.
- **Tuning leak and over-claiming.** Smoke runs are listed, the report is generated by the scorer, and a fresh claim-strength reader checks it. This project has over-labelled its own results before.
- **Dependence on the unscored v6.** The base rule is fixed in advance. A bug found in v6 would travel in the copied ops until fixed.
- **The shared 3080.** MarbleGp uses it as a test worker; check the lock first.

### Deliberately left out of v1
Each of these enters later as one change:
- space, origin64 and rebasing;
- bodies and `translateWiregraphToRig`;
- the gateway P = G · C · P_local, toroids and the port-Hamiltonian integrator;
- death;
- the ASK action and the donor's way back;
- a learned policy;
- the dream, consolidation and rebirth (stage 2);
- B129, B111 and B165;
- genesis, taste gates 2–4, nemesis, archetypes, SQ-JEPA, voice-lang and the 3D renderer;
- any tier of mind size chosen by hardware.

### 3/6/9 check (a lens, not a measurement)

**Nodes** (thing, opposite, test):
- encoder, decoder, round trip;
- world, lens, truth audit;
- live mind, frozen mind, paired test.

**Bridges:**
- **Ask and permission:** whole for world actions; permission only for help (named, stage 2).
- **The way back:** whole to the actor; missing to the donor (named).
- **Choosing, not judging:** typed refusals, a fit label only in the scorer, the receiver's gate.

**The whole.** Two triangles close, each by replay and audit:
- world → tokens → mind → action → engine check → answer → sting → head step → next action;
- world → lens → player → the same validator → world.

The direct link between mind and player is read-only telemetry in v1. That is a chain, not a closed triangle, and is named here as a choice.

**The fourth point:** see §4.9.