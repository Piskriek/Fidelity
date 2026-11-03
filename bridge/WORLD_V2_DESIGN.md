# World v2 design: a teacher engine, which senses to try first, and the owner's questions C-1 to C-6 (2026-11-02)

**Status: a design document for Track C of `PLAN_FRACTAL.md`. Everything here is a candidate for the owner. No ruling is made, no locked file is changed, and nothing is committed.** It uses `MECHANICS_MAP.md` (rows are cited there as S1, T2, and so on).

**Words.** A **fruit kind** is a, b or c. A being's **sense profile** is the list of senses it starts with open (the owner says "kind of entity"; this file says sense profile so the two are not confused). **Removed** is the drop in a count model's held-out cross-entropy (CE: how hard the next answer is to guess; lower is easier, measured in nats), as a share of the base model's 0.3176. **Information in the world** is what a count model finds; it is not what a learner will use. **Short trace** means the kind trace limited to the minds' present reach. **NGE** (good eats) is nourishing eats minus toxic eats per 100 times a fruit was in front of the being; higher means more nourishing eating, and it describes fit to a world, not worth. **ANSWER slot** is the point where a being predicts what the world will answer to a choice. **`chose=`** is the list of catalysts a being's higher self chose. **Seat** is where a higher-self player sits: today the owner, through the lens. **a+** is a cost class defined in `MECHANICS_MAP.md` (new senses plus new world bookkeeping). **Rotation** is the same test repeated with a different block of the 20 probe worlds held out. **add-0.5 / add-0.01** is how heavily the count model is smoothed; the lighter add-0.01 is the check against smoothing cost. **Being**, **character** and **mind** name one thing here: a being in a valley and its mind.

## The short version

1. **Teacher engine.** Build the engine of parts that can each be asked, with the same four steps at every part: *ask, decision (permit, permit smaller, or decline with the nearest thing it would permit), change, news back*. The first askable parts are the body's intensity and the sense channels. One small instance already runs: the **loop-break** (world 31000, valley 3 fainted from poison at ticks 561, 571 and 582; its intensity went from 2 to 1 for good at 582). It lacks the first and last steps: nobody asks, and no landing report goes to anyone. The first build is a chain (seat, part, being, news back), not a closed triangle. (§1)
2. **Senses.** The kind trace carries by far the most information (91% removed; 38% within the minds' present reach). The witness, my candidate for the telepathy the owner named, carries 24%, **but is two-sided**: where a fruit's effect is shared by all valleys that season it removes most of the uncertainty, and where it is not shared it raises held-out CE (+0.22 per eat at 16 ticks), because there the other being's outcome matches its own effect only 35.5% of the time (chance is about 33%) and the count model follows it. A short trace plus the witness removes 49% at add-0.5 (54% at add-0.01; exploratory; flagged). First for a human viewer: lens-only lines. First for research: the kind trace, as its own pre-registered uptake question. (§2)
3. **Questions.** C-1 to C-6 in plain one-line questions with a recommendation each, V-1 (should the beings' wants hold only gains), U-1 (add the unit's two missing steps, ASK and LANDED), and new questions this round raised. **Waiting on you:** C-1, C-3 and C-5 gate the first test (the kind trace); C-6 gates the teacher engine, and its item 7 needs your number; V-1 gates two cheap test arms of the wants table; U-1 gates two arms of the help bus; N-6 to N-8 are open questions about your universe. C-1 may need a fourth reading, since I read the owner's new sentence as describing an engine made of parts that can be asked. (§3)
4. **The pipeline.** §6 says what I did with the owner's "your pipeline and way of thinking too", and where it held and did not.

## 1. The teacher engine

### 1.1 The owner's frame, and what it extends

**The owner's frame (one viewpoint, theirs), 2026-11-02:** when the game engine is a fractal as well, "the entities who play the higherselves have the ability to ask the parts of the game to change, the engine acts as a teacher keeping them safe".

The project already has the pieces of a handshake:
- one side asks and the other permits (the world's action gate, BRIDGE_DESIGN §3.5);
- a being's declared list of catalysts (`chose=`, Plan §8.5 Rule 1) limits which catalysts reach it, and intensity can only go down (Rule 2);
- news of how help landed returns to the receiver (the relief term) and does not yet return to the donor (V7 #2).

The owner's sentence adds **direction and scale**: the ask goes *from a higher-self player to a part of the engine*, and the same shape holds at each part.

**What Ra says about this shape (lookup 7; page summaries, so wording is approximate):**
- (a) higher-self entities can ask the parts of the game to change: **partly**. Programming happens before incarnation, by the entity with the higher self's help, and the incarnate self can call on the higher self. During a life the higher self does not steer, and the mid-life ask runs *upward* from the incarnate self (60.4, 70.11, 75.36);
- (b) the parts permit or decline: **partly**. Calls are answered and can be limited (8.12, 21.14, 26.23); Ra avoids an allow/forbid framing (54.13);
- (c) the engine acts as a teacher: **follows, in function**. Catalyst is a mechanism of learning and teaching (46.14); read as an intentional teacher it departs, since Ra says the mechanism works without intelligence;
- (d) it keeps them safe: **partly**. Safe from permanent separation, through guardians, guides and the higher self; not safe from harm, since catalyst can be painful (83.27; 50.5 and 51.1 as lookup 7 cites them) or intense enough to disarrange an entity (48.8; lookup 9 notes that 48.8 does not name pain).

**Two candidates for the direction of the ask. The owner chooses.**
- **(A) The seat asks the part** (the owner's direction). A higher-self player in the seat asks a part of the engine to change something for a being. The being may or may not have asked. Ra's mid-life direction is the other way, so this hop is the owner's frame, labelled as theirs.
- **(B) The being asks the seat, and the seat relays** (Ra's direction, lookup 7). A being sends an ASK upward, scaled to its call (row T13). The seat decides whether to pass it to a part. The part decides. Each hop is the same four steps.
- (A) is simpler and needs no ASK port. (B) needs the ASK port and a way for the being to hear the answer. Both can coexist; question C-6 asks which to build first. The relay in (B) is my synthesis, not the owner's and not Ra's.

### 1.2 The parts that can be asked in Four Valleys

A "part" here is something the world already holds, with a state and a gate.

| Part | Holds | What it does today | What an ask might be | If the ask is more than the part permits |
|---|---|---|---|---|
| **The body's intensity** | Intensity ℓ per being, 1 to 3, set to 2 in measurement runs. At ℓ = 2 a toxic eat costs 4 health; at ℓ = 1, 2 | The loop-break lowers it, once, on the third faint from one cause | Lower it now, for one being | Nothing is smaller than a lowering |
| **The sense channels** | The declared list of what each being's view shows | The view drops the season, other valleys, exact E and H, stage and intensity | Open a sense (the kind trace, the witness at 4 or 16 ticks, a season-turn flag) for a window | A shorter window; the smaller of two senses |
| **The helper bus** (later) | Who is a receiver, and from whom (25% chance per 64-tick segment) | Help arrives on a schedule, not on a call; the donor never hears how it landed | Help on call, scaled to the ask (row T13) | Help next segment; a smaller share |
| **The season table** | Which fruit kinds nourish, do nothing or poison, per valley per season | Redrawn every 384–640 ticks, never announced | Change a fruit's effect for one being | **Declined**; nearest permitted: a lowering of intensity, or a sense opened. Changing a table for one being hands over the table and changes the fairness among valleys; Ra says protection does not remove catalyst (L7) |
| **The group's seat** (later) | An open seat for a Wanderer | Not built | Seat a helper on the group's call | A later stage |

**The first build covers the first two rows only.** The helper bus is shared by all valleys, so any change to it must be staged (rule 9); the group seat has no group yet.

**Who stands in a seat.** Today: the owner, through a read-only lens, or through the same validator when playing a valley (BUILD_STATUS). The owner's phrase is "the entities who play the higherselves", which can include AIs. Whether an AI may sit in a seat, and with whose yes, is an owner decision (N-3). The MarbleGp rule is that a bridge agent joins with the player's own yes.

### 1.3 The protocol: ask, decision, change, news

**One ask is one record:** who asks, for which being, of which declared part, which declared change, how large, and the tick.

**The player sees three outcomes: permit, permit smaller, or decline with one reason and the nearest thing the part would permit.** Behind that, the part works through these checks in order; the first that applies decides.

| Step | Question the part asks | If not | Reason class (typed, like the world's `ERR_*`) | Nearest it would permit |
|---|---|---|---|---|
| 1 | Does the asker hold the seat for this being (or, on Path B, is it the being itself asking for what its own menu allows)? | Decline | `NOT_SEAT` | An ask from the seat |
| 2 | Is the change on the part's declared menu? | Decline | `UNDECLARED` | Anything on the menu |
| 3 | Would it raise intensity, or add a catalyst outside the being's `chose=` list? | Decline | `RAISES_INTENSITY`, `NOT_CHOSEN` | A lowering; a catalyst on the list |
| 4 | Would it hand over the table or a fruit's effect? | Decline | `ORACLE` | A sense that carries information (the kind trace) |
| 5 | Is the being over its budget for asks? | Decline for now | `BUDGET` | The same ask when the window ends |
| 6 | Does it touch something shared by all valleys? | **Stage** it: keep it only if a check the asker does not run passes | `STAGED` | – |
| 7 | Otherwise | **Permit**; if a smaller change meets the ask, **permit smaller** | – | – |

Six of seven steps decline or stage, because the table is the engine's safety side. The teacher side is the right-hand column: **a decline always names what the part would permit**, so the asker is never left with a bare refusal.

**Safety rules the parts keep.** Each comes from a ruling or a measurement:
1. Intensity only goes down. (The owner's ruling: felt pain is a higher-self choice, never a setting.) A lowering is the one change that can be applied without the being's own ask, as the loop-break does today (Plan §8.5 Rule 2). Whether the *seat* may ask for it unasked is C-6 item 5.
2. Nothing else is applied to a being unasked, and nothing is applied without the permit of the level whose awareness covers the choice. (The owner's ask-and-permit ruling, and their rule of 2026-11-01 that a choice belongs to the level whose awareness covers it; Skill Step 0.7.)
3. A catalyst reaches a being only if it is on that being's own list. (Plan §8.5 Rule 1.)
4. A lens never lies: a sense that opens is declared in the slice, with its window and anything dropped or noisy, and nothing is shown that the record does not hold.
5. A refusal is a typed fact, not a grade of the asker. (We don't judge; compassion balanced by choice.)
6. An answer offers; it does not hand over the table. An oracle that names the effect scored 50.5 on NGE against the frozen copies' 28.6 (v1a); NGE rewards telling, so that number cannot separate being told from learning. The rule rests on Ra (lookup 7: a teacher cannot learn for the student, only catalyst can be offered; no session number was given) and on the owner's rules. **Note:** the witness is not an answer from above, since it reports an outcome that already happened to another being. But where a fruit's effect is shared that season, the witness carries that effect (§2.1), so it is close to the table for those eats. On the shared-kind eats (54% of eats) the witness carries that effect 99.6% of the time, so an opened witness hands over the table's effect for about half of eats. C-6 items 3 and 6 need a rule for that (question N-10).
7. Every ask, decision and change is a ledger line, so a replay reproduces it. This needs a second ledger byte per tick (the ledger's one byte per tick is full: 4 characters at 2 bits). Build it only when an ask port exists.
8. News returns (§1.4) as information. It carries no felt pain.
9. A change to something shared is staged and kept only on a check the asker does not run. (BRIDGE_DESIGN §3.6.)

**What an answer from above contains** (a candidate; C-6 asks the owner). The menu, safest first:
- a **sense opened** for a window, from the declared menu, which the being's own gate may use or not;
- **help on call**, scaled to the call, from the bus (later);
- a **cue** with no content (for example "look again"). This needs a new token in the being's view; today it has no channel;
- never: the fruit's true effect, the table, or an instruction to act.

**What asking costs** (a candidate; the numbers are the owner's to set). Opening a sense is paid like the Plan's spore (row H6): temporary, and repaid in rest. Two design points the designer reader raised:
- *The window.* A window that ends at the season's end can be timed by the seat, since only the engine knows when a season turns. Use a **window of fixed length from the ask** (candidates 32 or 128 ticks, the bins the v1a readout already uses), with one open ask per being at a time. A life is 16,384 ticks, so with one ask per season (384–640 ticks) a being could be asked about 25 to 42 times (16,384 ÷ 640 = 25.6; 16,384 ÷ 384 = 42.7); the window rule keeps the count bounded either way.
- *The repayment.* REST costs one energy and gains one health, and scores +1 as RESTED in the world's value table (BRIDGE_DESIGN §2.4, §2.5). Repaying in REST ticks therefore scores as a gain. Whether those ticks count towards NGE or the wants table is an owner choice; I propose no number, since no measurement sets one.
- Reason for any cost: without one I expect always asking to win (untested; the same logic as free attention, row S6).

**A perceivable answer for the being (Path B only).** If a being can ask, the answer must reach it as a token it can sense: permitted, permitted smaller, or declined with a reason class. Without that, the being "called and nothing in its view changed" and cannot tell a decline from a silent yes. This needs a new answer token class. It is the being's own way back, and it keeps the lens true: the being can say "I called; the answer was a decline" from its record.

### 1.4 News returns

**The landing report** is the way back. It goes to the asker as a typed record, labelled by whose facts they are:

| Part of the report | Content | Whose |
|---|---|---|
| What was asked, and the decision | The ask record, the reason class and the nearest thing permitted | The engine's |
| When it took effect | The tick | The engine's |
| What followed, over the 32 and 128 ticks after the ask, against the same number before | Faints (by cause), eats by class (FED, PLAIN, TOXIC), mean surprise, mean relief | Counts are the world's; surprise and relief are the being's own quantities |
| What it does not contain | A verdict on the asker, a grade of the being, or advice | – |

**What surprise and relief are**, from the recorder's code (`mind/live_thought.mjs`): surprise is this answer's cross-entropy minus the running mean of the being's cross-entropy; relief is the margin by which the being's main prediction beat a second head (`aux0`). Both describe the being's own predictions. They are not a measure of wellbeing. They also feed the being's gates in the RC base (MIND_STEP7), so they are information the being itself uses.

**Who receives news.** The owner's rule is that news of how help landed returns; their question of 2026-11-01, "how do they help each other? how do they do gratitude", points at the donor (MIND_STEP7). That the report also reaches every helper is my reading, for the owner to rule. So: the **asker** gets the landing report; for help on call, the **donor** gets a count ("your help arrived"), as information and never a score; and the **being** gets its own typed answer (§1.3). A count of how often a being's outcome was used by an observer returns to the observed one in the same way (C-5). Windows 32 and 128 are the v1a readout bins (0–31, 32–127, 128 and later), so no new window is invented.

**The test that the way back works** (the Skill's own test): *does the next ask change?* A candidate pre-registered check: after a landing report, asks differ (a smaller change, a different part, a later tick) more often than after no report.

**A worked example in plain words, from the recorded thought of one life (L, model seed 1, world 31000, ticks 480–719; one life, one window):**
- ticks 561, 571 and 582: the being in valley 3 (the third character in the record) fainted from poison three times. Fruit b had fed it before the season turned and poisoned it after. At tick 561 its guess gave 98.6% to b feeding it and 0.001% to a faint.
- at 582, its third faint from poison, the world's loop-break lowered its intensity from 2 to 1, permanently.
- in ticks 583–719 (137 ticks) it did not faint again. **It ate poison eleven more times (ticks 617 to 713), each costing it 2 health instead of 4.** Before the break it had eaten poison 8 times from tick 554 to 582 (three of those ended in a faint); after it, 11 times in 137 ticks, each costing 2 health instead of 4. One life, no control: this shows no cause. Another being (valley 2) fainted from poison once, at tick 699.
- Under the protocol this would be: **no ask** (the engine acted as a floor); **permit** by rule 1; **change** at tick 582; **news** as above. Today the change is logged and no landing report goes to anyone. This is one life; it does not show that the loop-break changes what beings eat.

### 1.5 The loop-break as the small instance

| Step | In the loop-break today | What would complete it |
|---|---|---|
| Ask | None. The engine acts on its own. The Plan marks this as a departure from Ra's "guides when asked" (§8.5 Rule 2) | An optional ask from the seat to lower earlier or for another being. The floor stays: it only lowers |
| Decision | By rule: the third collapse from one cause | The decision checks in §1.3 |
| Change | Intensity 2 to 1 for the rest of the life | The same |
| News | Logged (end-of-life counts; in the thought record, `ellAfter`). The tick was not recorded for scored lives | A landing report written into the thought record and shown in the seat. This is a lens-only first build (cost: lens) |

### 1.6 What "fractal" adds here

The Plan's holon check (Skill Step 0.5): a part is complete if it has four folds *inside* (substrate, dynamics, transducer, evaluator) and four neighbours *around* (a supplier below, a host above, a lateral dual, the shorthand seam). The body's intensity as a worked example:
- inside: substrate (ℓ), dynamics (scales toxic loss), transducer (the gate that lowers it), evaluator (the loop-break rule);
- around: supplier below (the fruit's answer, the faint), host above (the world's season table and ledger), seam (the thought record), **lateral dual: none** (my reading: a recovery is not defined when intensity only goes down).

So the part passes three of the four neighbours and fails the fourth. The use of the word "fractal" here is modest: a rule that every askable part has the same shape (one gate, one ledger line, the same four steps), so a new part is added by filling in the shape. I make no claim that the run harness, the pre-registration or the lens follow the same protocol. Whether the owner means this by "fractal engine" is C-1 reading (d).

### 1.7 3/6/9 check on the frame (a lens, not a measurement)

- **Node.** The thing: a part that can be asked. Its opposite: an engine that is only an environment. The test: after the report, does the next ask change?
- **Links among the three nodes** (the being, the higher-self seat, the engine part):

| Link | Exists today? |
|---|---|
| Being to engine part: its action | Yes (the action gate) |
| Engine part to being: the answer, typed refusals | Yes |
| Being to seat: its ask (call) | **No** (Path B; row T13) |
| Seat to being: a cue, never a write | **No** in this world (the seat is read-only telemetry; MarbleGp has it built elsewhere) |
| Seat to engine part: the ask to change | **No** (Path A; this document) |
| Engine part to seat: decision and news | **No** (this document; the loop-break logs only) |

  Two of six exist. The first build is a chain (seat, part, being, news back), not a closed triangle. The count is a list of links, not a finding.
- **Fourth point (the choice).** What counts as "safe" is a value choice and belongs to the owner. The rules in §1.3 are the owner's rulings and measurements made into checks; they are not new values.
- **Plain check.** Missing: the cost number, the seat's identity, a perceivable decline for the being, and any test with a real asker. None of this has run. Nothing here is measured except what is cited.
- **The smallest test that could fail.** Pre-register "asked at birth: intensity 1 from tick 0" against "intensity 2 until the third faint from one cause" on early faints and NGE, passing only above the locked margin m = 1.02. Both arms reach intensity 1 by tick 4,096 at the latest (inferred from the scoreboard bound; exact break ticks were not recorded), so later differences would come from the different histories. If it passes nothing, the ask to lower adds nothing in this world. "A lowering can only help" is untested.

### 1.8 The same unit at every level of the engine (the owner's principle of 2026-11-02)

**The owner's principle (one viewpoint, theirs; relayed by the coordinating session).** The pipeline's unit (`PIPELINE_FRACTAL.md` §1: ASK, WORK, CHECK, REPORT, ROUTE, LANDED) can be run by any agent that can translate and follow simple logic, and what it finds comes back in the same shape. The part quoted verbatim is: "exactly, in the engine and everywhere else thats how it should work"; the rest is the coordinating session's paraphrase.

**How to read the table.** It is a reading of the design files (BRIDGE_DESIGN, MIND_STEP7), not a run. CHECK here means that something other than the doer compares the result with what was expected (an error signal, a count, a hash). The pipeline's own CHECK (3/6/9 plus a fresh reader) appears in the engine only as the planted-mutant suite and the K5 check. A decline that names the nearest thing permitted (§1.3) is the unit's fit-note ("did not fit here: reason"), and silence is "open", not "landed".

| Level | ASK (and the permit) | WORK | CHECK | REPORT and ROUTE | LANDED | Missing |
|---|---|---|---|---|---|---|
| **A rung inside a being** (fires every token, every tick, every 4 ticks) | The receiving rung's query against the sending rung's key; its gate permits | The sending rung's message; each rung's prediction | Each rung's own prediction error | The sting (surprise, relief, running relief) goes up to the top and to the gates | Relief, a proxy for "did the help help", reaches the receiver; the top feels the sting | None named: MIND_STEP7 says the triangle closes within one character. No decline names a nearest permitted action. No rung is as slow as a season |
| **A being's tick** (being and world) | The action (EAT, PASS or REST); the engine's double check permits; a decline is a typed refusal, "a typed fact, not a grade", that names no nearest permitted action | The being guesses and chooses; the world resolves | Surprise: the answer against the guess | The ANSWER token. The answer trains the being's own heads (live arms); repeated harm reaches the loop-break | Only the being's next action; the world does not read it as a landing note | The being can ask for three things, of the world only: **no ASK of another being or a higher level**; and **LANDED to the world** |
| **A being's life** (between lives, stage 2) | Not built | Not wired: the vendored wave-0 reference has episode selection and the rebirth transfer, and no bridge file calls them | Debt = open causes (written as data) | The `ms` line is written at a life's end; `me` and `mc` lines per event (data for stage 2) | Not built | The dream, the review and the rebirth: **every step beyond the records** |
| **Two beings** (the help bus) | **None**: help arrives unasked, on a schedule (25% of 64-tick segments), which the Skill's own test calls a broken handshake (V7 #1). The receiver's gate decides how much of it to use | The donor's published vector | The receiver's relief | To the receiver only | **Missing** (V7 #2): the donor never hears how it landed | **ASK and LANDED** |
| **A part of the engine** (intensity; later the sense channels, the bus) | **None**: the loop-break fires by rule, nobody asks | Intensity is lowered | The third collapse from one cause | Logged (end-of-life counts; `ellAfter` in the thought record); intensity only goes down | No landing report goes to anyone | **ASK from the seat, and a landing report to a named reader** (§1.3 to §1.5) |
| **The world** (four valleys, one ledger) | The harness gives it a seed and a preset; nothing inside the world can ask | Lockstep ticks: the world waits for all four actions | The energy books close every tick; the hash chain; the planted mutants | The ledger (one action byte per tick, the chain every 256 ticks). Stage rises one at a season end without a collapse, read by the lens only | None to the beings: the mind never sees stage or season | **ASK of the world's parts** (§1.2) and **LANDED to the beings** |
| **The higher-self seat** (the owner, or an AI with the owner's yes) | **Missing both ways**: no ask from the seat to a part, no ASK from a being | Reads the thought record | The guess-then-reveal test, planned by the lens track | Decisions go to the plan and to new arms | None to the being | **All steps in the world**: the seat is read-only telemetry there |

**What the table shows.**
- On this reading, the rung and tick rows have a mechanism for each of ASK to REPORT. Only the rung closes the loop with LANDED to the doer (the top feels the sting); at the tick, LANDED to the world is missing too.
- ASK is missing for every asker except a being asking the world (and, inside a being, a rung asking a rung). LANDED is missing wherever the doer is the engine (a part or the world) or another being.
- These are the two parts MIND_STEP7 named as missing on day one (prayer, the ask turned upward; gratitude, "your help landed" returning to the donor), plus groups.
- Ra: lookup 7 puts the mid-life ask upward from the incarnate self, with the higher self answering when asked (60.4, 70.11, 75.36). Lookup 4 puts the response after the call (positive entities wait to be called, 73.3) and scales the service to the call, by Ra's law of squares (7.1–7.2), which is stronger than "in proportion" (a guide mapping in lookup 4). Both fit the unit run by the being (Path B in §1.1); Path A is the same unit with the seat as the asker.
- **What would show the unit adds something.** The handshake (ask, permit, the way back) is already in Step 0.7 and BRIDGE_DESIGN §3.5. The unit adds WORK, CHECK, REPORT and ROUTE as named steps and a typed LANDED (used, changed, did not fit here). A test that can fail: U-1a with typed news against the same news as one number (below). If there is no difference, the typing adds nothing.

## 2. Which senses first, and why

### 2.1 The evidence

Held-out ANSWER cross-entropy (nats per answer) of a count model over the 14 ANSWER tokens, on unscored worlds 40016–40019, trained on 40000–40015, under the nursery's scripted policy. The base, with only the body bands, the item and the action, is 0.3176. Source: `mind/runs/probes/PROBES.md`, plus the new rows (`mind/probe_senses.mjs`, run today; about 52 s on this laptop by the script's own timer). The earlier 15 rows and the sanity check are byte-identical to the earlier run.

| Sense | CE | Change | Removed | Notes |
|---|---|---|---|---|
| Kind trace, unlimited | 0.0272 | −0.2904 | 91% | Below base in 16 of 16 units, 5 of 5 rotations |
| Kind trace, only inside the minds' reach | 0.1961 | −0.1215 | 38% | 40.9% of the test eats (35,333 of 86,464) have their last same-kind eat in reach (the nursery's own held-out worlds give 40.5%) |
| Kind trace, kept up to 32 ticks old | 0.0356 | −0.2820 | 89% | 97% of the full trace's gain. Up to 16 ticks: 85%; up to 8: 62% |
| **Short trace + witness, 16 ticks (new)** | 0.1609 | −0.1567 | 49% | 51% averaged over five rotations (−0.1616). −0.1696 (54%) at add-0.01. Exploratory (see below) |
| Short trace + witness, 4 ticks (new) | 0.1756 | −0.1420 | 45% | −0.1573 at add-0.01 |
| Witness, 16 ticks | 0.2426 | −0.0750 | 24% | Size moves with the share of eats on shared kinds (−0.0750 to −0.1013 across five blocks) |
| Witness, 4 ticks | 0.2637 | −0.0539 | 17% | |
| Full trace + witness | 0.0354 | – | – | Adds under 0.001 nats to the full trace at add-0.01 (0.0229 against 0.0230); the split by eat type was not run |
| Season-turn flag; season age | 0.3184; 0.3208 | +0.0008; +0.0033 | none | Age beside the full trace: −0.0008 (add-0.5) to −0.0088 (add-0.01) |
| Others down or warned (group field) | 0.3305 | +0.0129 | none | −0.0005 at add-0.01: nothing detectable to about 0.001 nats |
| Exact energy and health | 0.3314 | +0.0138 | none | −0.0000 at add-0.01 |
| Reference ceiling (the true effect this season; not a sense) | 0.0055 | −0.3120 | 98% | |

**The witness is two-sided (new diagnostic, same worlds; CE per eat with an item, add-0.5):**

| The fruit's effect is… | Eats | Base | Witness, 16 ticks | Change | Short trace | Short trace + witness |
|---|---|---|---|---|---|---|
| shared by all valleys this season | 46,935 | 0.9108 | 0.2943 | **−0.6165** | 0.5490 | 0.1938 |
| not shared | 39,529 | 1.0134 | 1.2323 | **+0.2189** | 0.6205 | 0.7623 |

Where the effect is shared, the neighbour's class matches one's own effect 99.6% of the time (46,457 of 46,629 with a witness available); where it is not, 35.5%. A count model cannot tell which case it is in, so on the not-shared eats it follows a class that matches only 35.5% of the time (chance is about 33%), and its CE rises. Taking the two change figures, the witness gains on average only if more than about 26% of eats are on shared kinds (0.2189 ÷ (0.6165 + 0.2189)). That holds the two figures at their values at 54% shared, from one held-out block; they were not measured at other shares. The five blocks of worlds ran 54% to 63%. Whether a being could tell shared from not shared (from several neighbours agreeing, or from its own trace) was not measured.

**The new probe (short trace + witness), in words.** A trace limited to the minds' reach removes 38%. Adding the 16-tick witness takes it to 49% at add-0.5 on the headline split (54% at add-0.01). The witness's own gain falls from −0.0750 to −0.0351 once the reach-limited trace is known: 53% less at add-0.5, and 43% less at add-0.01 (from −0.0781 to −0.0448). So they overlap. Beside the reach-limited trace the witness adds between −0.034 and −0.050 across the five rotations (−0.0351 on the headline split), and the combination beats the witness alone in all five. It closes 21% to 27% of the gap between the reach-limited and the unlimited trace on the headline split (21% at add-0.5, 27% at add-0.01), and 21% to 30% across the five rotations.

**Where the information sits (count model; uptake untested).** On eats where the trace is out of reach (59% of the 86,464 eats), the reach-limited trace has nothing (0.958 per eat against the base's 0.967); the witness alone gets 0.732, and the combination 0.727. On eats where the trace is in reach (41%), the trace alone is at 0.036, and adding the witness raises it to 0.057. That rise may be smoothing cost (the combined probe has 3,146 contexts) or world-to-world variation, since the held-out block has the lowest shared share (0.543); neither was tested for this split. A placebo witness (the column shuffled across eats), scored at add-0.01 and in each rotation, would decide it.

**Flags on the new rows.** The declared sparse rule fires on the held-out gap (0.0096 against the base's 0.0018), not on unseen contexts (0.03% and 0.02% of test answers; the limit is 0.5%). The smoothing flag fires. Read the new rows at add-0.01 and as exploratory.

### 2.2 What the evidence cannot say

- **It is information in the world, not what a learner will use.** The nursery's minds had 0.12 nats of headroom inside their reach (0.3097 to 0.1895) and scored 0.320–0.343 against the memoryless 0.310. Uptake needs its own pre-registered arm.
- **One policy, 20 worlds, 4 held out.** The scripted policy eats on a schedule a learner may not follow. The rotations reuse the same 20 worlds.
- **The witness depends on the world's share rule.** The gain is set by a 1-in-2 coin per season and kind in the world's code (`world/valleys.mjs`). The probe measures what a neighbour's outcome carries in this world. It does not test telepathy, and it says nothing about another world.
- **Not measured:** the answer from above, attention, patterned fruit, space, several neighbours agreeing, and the effect of different sense profiles.

### 2.3 Recommended order (steps, not dates)

**First for a human viewer, lens only, no retraining:** the landing line (§1.4, §1.5) and the guess-and-hit line already planned for the lens. The designer reader pointed out that the kind trace costs a retraining per seed (measured for the seasonal nursery: 1,468–1,639 s per seed, three in parallel) before a viewer sees anything, and its named failure case is that the trace goes unused.

**First for research: the kind trace as an explicit sense, as its own pre-registered uptake question.**
- *Why:* the largest information by far (91% unlimited); no other being involved, so no ask or permit machinery; it is the being's own data; and it gives the lens a sentence the being can say truthfully. The sentence must come from the record: "Last time I ate this, the answer was TOXIC, N ticks ago." It carries the answer the being received, not the world's `kindClass` label, and "never eaten" must read differently from "did nothing".
- *Evidence that memory can pay here, and that it has not been used:* the tabular learner, which keeps a per-kind running mean, scored 42.68 against the learning beings' 33.20 (48 of 48 pairs; not like for like). The neural minds' error (0.320–0.343) was above the memoryless count model's 0.310, which does not show whether they used their memory.
- *The question to pre-register:* if the world hands a being a note of what this fruit did last time, does learning in the heads still pay? The learning beings' NGE was 4.59 above their frozen copies' (33.2 against 28.6). A prediction to lock first: a fruit note narrows or removes that gap (a smaller gap is also a result). Failure case: the trace is not used.
- *How far back:* about 32 ticks holds 97% of the trace's information, so a trace with an age band, up to 32 ticks, keeps 97% of the trace's information in this count model.
- *Delivery:* the sense must be visible at the ANSWER slot. Three routes (a scout's reading, untested): fused into the observation token (the vocabulary grows), a separate sense token before it (the memory span grows from 2 to 3 tokens), or a side vector. A build decision after C-3.
- *Cost class:* a+ (the trace must sit in the snapshot so the token checks can run). Retrain the three trunks and rerun E1 to E3.

**Second: the witness, in worlds of beings with different sense profiles** (`MECHANICS_MAP.md` §3).
- *Why:* it is my candidate for the telepathy the owner named; it is where the ask, the permit and the way back first have something to carry; it fills in where memory is short.
- *Predictions to lock first (revised after the diagnostic):* the witness gains on average when more than about 26% of eats are on shared kinds, and costs when fewer; on the not-shared eats it raises CE; and it adds little beside the long trace. Failure case: no gain where the share is high.
- *Permit:* see C-5. A declaration by sense profile of what a being shows to others, with the observer's open witness as the ask.
- *Cost class:* a+ (the world records the last outcome and tick per valley and fruit kind: 12 + 12 integers, which changes the state bytes and the golden chain, not the dynamics). The frozen world tests and mutant checks are re-run.

**Later, in this order:**
1. **The ask (Path B, stage 2).** Needs the ASK port, the cost rule and a perceivable answer. The cost number is the owner's.
2. **The season turn flag.** Nothing alone; it changes what E1 and M3 mean (C-4).
3. **Attention.** Not measured; a cost the owner must choose.
4. **The group field and the finer body.** No information detectable. The group field matters only if groups exist (N-5).
5. **Patterned fruit and space.** Not measured; each is a new world.

### 2.4 Pull, push and their distortions, made visible (the owner's framing of 2026-11-02)

**The owner's framing (one viewpoint, theirs, relayed by the coordinating session):** "excitement pulls and logic pushes the entities, pain is the result of distorted logic and fear is the result of distorted excitement". The mapping is `MECHANICS_MAP.md` row M9. The owner's pain ruling stands as stated: felt pain is a higher-self choice, never a setting, and intensity only goes down.

**A caution on the mapping.** The value the beings choose by, U(a), is the sum over the 14 answers of guess × wants, and the wants are gain minus pain (`mind/live_v1a.mjs`, the wants at lines 994–1007 and the argmax at 1083). So it mixes the owner's *pull* (the gain part) with a *pain term*, and in this mind pain is an **input** to choice, where the owner's sentence has it as an **output** of distorted logic. The two parts can be computed apart from the recorded guess and the wants; the recorder writes only their sum. Also, the Plan itself reads the terms another way (B131: excitement tracks surprise; B130: distortion is over-precision), and this table reads excitement as the gain part of the value and distorted logic as surprise or a confident wrong guess. **The owner should choose the reading.**

| In the framing | In today's mind | Recorder field |
|---|---|---|
| Pull (excitement) | The gain part of the value: the sum over answers of guess × gains | computable from `guess[].p` and the wants |
| A pain term | The pain part of the same value: guess × pain. It is an input to choice | the same |
| Push (logic) | The guess spread, and how sure the being was of the answer that came | `guess[].p`, `pAnswer` |
| Distorted logic | Surprise after the answer (cross-entropy minus the running mean, signed); a confident wrong guess | `sting[0]`, `pAnswer` |
| Distorted pull | A gap between the value used and what the world pays at the being's current intensity | the wants (set at 2) against the world's `gain`, `pain` and `ellAfter` |
| Fear | Information only; never an input. No mapping for "distorted excitement" | – |

**What one recorded life shows (descriptive, not a test; L, model seed 1, world 31000, ticks 0–2047; regenerated into the scratchpad with `mind/live_thought.mjs`, the run reporting 165.9 s; the numbers come from `mind/pullpush_descriptives.mjs`, whose header gives the commands).** I recomputed the coordinating session's first read. Its harmful-eat counts match mine. I could not reproduce its mean predicted harm (0.335), the comparison figure (0.022) or its mean surprise (2.01) from the definition below (harm is the guess mass on TOXIC plus COLLAPSE for the EAT option, over the eats the beings chose without exploring); mine are 0.311, 0.021 and 2.17.
- 289 harmful eats chosen without exploring (TOXIC or COLLAPSE). 217 came when the being gave harm under 50%, and 110 when under 10%. The mean predicted harm was 0.311 before harmful eats, against 0.021 before the other 3,952 chosen eats.
- **Two groups, not one.** In 197 the being valued eating above zero (mean harm guess 0.11, mean surprise 3.04): 110 of these were confident wrong guesses (harm under 10%) and 87 gave 10–50%. In the other 92 the eat value was zero or negative (mean harm guess 0.74, mean surprise 0.32). All 92 were at energy band 0; in 53 of them both passing and resting were guessed to end in a faint with over 99% (value −8), against a median eat-harm guess of 0.75. These are a toxin against a predicted faint. "Distorted logic shows as surprise" fits the first group and not the second, and the framing as stated does not say what a being should do when every option harms.
- The first read counts 143 passes on fruit that would have fed, 62 with a negative eat value. 93 of the 143 were random exploration passes. Of the **50 passes the beings chose**, all 50 had a negative eat value.
- Intensity in the window: 37% of being-ticks (3,064 of 8,192) were at intensity 1. The four beings first reached 1 at ticks 1,543, 1,500, 582 and 1,503, so they spent 25%, 27%, 72% and 27% of the window at 1. HANDOFF's bound is that every being reaches 1 by tick 4,096 at the latest; a full life is not measured. Lowering is one-way, so a being lowered at tick 1,543 would be at 1 for about 91% of a 16,384-tick life.

**A what-if, guesses held fixed (not a forecast).** Replaying the recorded guesses through the choice rule reproduces the recorded act on 6,526 of 6,551 non-exploring awake decisions (99.6%). With every negative wants entry set to 0, 410 decisions (6.3%) change: 401 become eat attempts (398 with fruit in view, 3 with none) and 9 move from pass to rest. With fruit in view that is 102 more eats of nourishing or plain fruit that had been passed or rested on, and toxic fruit eaten rises from 289 to 585 (+296). The reason is simple: passing scores 0 under gains-only wants, so eating wins on any chance of a gain, and a being cannot see a fruit's kind; the median gains-only eat score in the 192 toxic-fruit pass-to-eat flips is 0.16. Zeroing only the two harm entries (toxic and faint) changes 399 decisions, all towards eating, and gives the same 585; zeroing everything except the starving entries changes 405, with 585 as well. So the rise in toxic eating comes from the toxic and faint entries. In a real arm the guesses would change as the beings learn, so this shows where the pain terms currently work and does not say what a gains-only life would look like.

**How a richer world would make pull, push and their distortions visible.** Each layer must come from a record field (a lens never lies) and describes a gap, not a fault:
1. **The kind trace** (row M2) puts the being's own memory beside its guess. A confident wrong guess then shows as a disagreement the viewer can see: the trace says the last answer was TOXIC, the guess gives 98% to FED.
2. **The witness** (row S9) puts another being's outcome beside the guess. It is two-sided (§2.1), so the disagreement it shows is information only where the effect is shared.
3. **Calibration over a window:** how sure the being said it was against how often it was right. That is a measurable form of "distorted logic" (over-precision, in the Plan's words) without a verdict. The window is to be chosen; the readout's season-age bins (0–31, 32–127, 128 and later) are one candidate, not a calibration window as they stand.
4. **An interest channel,** as a design option for the owner: excitement as its own number apart from value (the Plan's shorthand has an `ex` field per episode, Part 1 §1.2). It would be a new field.

**What Ra says about the framing (lookup 9, verified: 42 of 58 claims supported, 16 partly, 0 unsupported; page summaries, so wording is approximate).**
- "Distorted" as something gone wrong: **partly**. Ra's bare word "distortion" is neutral: free will, Love and Light are distortions, and Ra names pain, fear and hysteria as distortions themselves (83.25, 60.8, 67.2, 96.2), not as results of one. Ra sometimes adds a qualifier when it means unbalanced or gone wrong (90.3, 60.31, 34.6).
- (a) excitement pulls: **follows**, reading excitement as attraction, desire and will (the guide's mapping). The word "excitement" is **silent in the sessions checked**.
- (b) logic pushes: **partly**. Reason as a push is silent in the sessions checked; the rational/intuitive mind shapes how catalyst is used.
- (c) pain is the result of distorted logic: **partly**. Reasoning as a cause of pain is silent in the sessions checked; the mind's response (accepting, controlling, souring) decides whether catalyst is used (34.6, 46.14–46.16).
- (d) fear is the result of distorted excitement: **partly**. Fear of possession and desire for possession are listed as parallel distortions, neither derived from the other (26.38, 32.14); fear following from desire is silent in the sessions checked.
- A candidate for the owner, not a ruling: if the design carries Ra's labels, it may want one word for neutral variation and a qualifier for the unbalanced case, since Ra's bare word already spans both.

None of these adds pain or fear as a felt channel. Fear stays information.

## 3. The owner's questions, in plain words

Each is a question you can answer in a line. The recommendation follows it.

**C-1. What should "a fractal engine" mean?**
The plan listed three readings: (a) the same world, but the beings get new senses; (b) the fruit comes in clumps at several time scales (4, 16 and 64 ticks; the minds' slowest part fires only every 4 ticks, so slower clumps would need slower parts of the mind too, a named nursery-v2 candidate); (c) a map of places, a ring of cells around each being, and moving.
- *Recommendation:* start with **(a)**, with the senses nested (own memory, one neighbour, the group); plan **(b)** as the next world version once (a) has a result; leave **(c)** for later. (a) is the only reading with measured information and the cheapest retraining. From the second sense on, each opening is an ask and a permit; the first sense needs neither.
- *A fourth reading, from your 2026-11-02 sentence (my reading of it):* **(d) the engine is made of parts that can each be asked** (§1). It is compatible with (a), (b) and (c). If this is what you meant, C-1 is (d) plus (a).

**C-2. Which goal comes first: what a human viewer sees, or the kind-trace research test?** The two do not conflict; the lens-only landing line needs no answer and can start now.
- *Recommendation:* for a human viewer, the lens-only landing line and guess-hit line; for research, the **kind trace** as its own pre-registered question, then the **witness** in beings with different sense profiles, then the ask. Depends on C-3.

**C-3. Is "what this fruit did to me last time" a sense, or part of the mind?**
- *Recommendation:* **call it a sense.** It would sit in the declared slice, appear in the thought record, and let a being say something true. It changes what E1 and E3 can show; the result must say which is which. The learners' lead over their frozen copies may shrink, and that is a result.

**C-4. Should a being be told when the season turns?**
- *Recommendation:* **no, not in the first arms.** The turn flag tells nothing about the next answer on its own, and announcing the turn would change what E1 and M3 measure, and takes away the being's own discovery by surprise. Revisit it as a sense for one sense profile, opened by an ask.

**C-5. Can a being see what others eat by default, or only when the other gives and the being asks?**
- *Recommendation:* **give and ask** (your rule: one side asks, the other permits). In the first witness arm, make the permit a declaration by sense profile ("this profile shows its outcomes to others: yes or no"), and the observer's open witness is the ask. Upgrade to a per-ask exchange when the ask port exists. News returns to the one who was seen as a count of how often its outcome was used, as information and never a score.
- *Note the diagnostic in §2.1:* the witness is misleading where the effect is not shared. In these worlds the effect is not shared on 46% of eats (39,529 of 86,464), where the other's class matches only 35.5% of the time; other worlds were not measured.

**C-6. In the teacher engine, what may a higher-self player ask to change, what is safe, what does an answer contain, what does asking cost?** One yes or no each, with my recommendation:
1. May the player ask to **lower** a being's intensity? *Yes.* (At ℓ = 1 a toxic eat costs 2 health, not 4. In the one recorded example the being kept eating poison after the lowering, at the lower cost; one life, no control.)
2. May the player ask to **raise** it? *No* (your ruling).
3. May the player ask to **open a sense** for a window, from the declared menu? *Yes.*
4. May the player ask the engine to **change a fruit's effect**? *No;* offer a lower intensity or an opened sense.
5. May the seat ask for a being **without the being having asked**? *Yes for a lowering, and for opening a sense only if the being's declared sense profile allows it.*
6. May an answer contain the table or a fruit's effect? *Never.* A sense opened, help on call, or a cue.
7. Should asking cost something, and how much? *Yes: one open ask per being at a time, a window of fixed length, repaid in rest.* The repayment number, and whether those rest ticks score, are yours.
8. Does a refusal carry a reason and the nearest thing permitted? *Yes,* typed, never a grade.
9. **Which direction first?** Path A (the seat asks the part, your direction) or Path B (the being asks, the seat relays; Ra's direction)? *Path A first* (simpler, no ASK port); Path B when the ask port exists.

**V-1. Should the beings' wants hold only gains (the pull), so harm is learned through surprise alone?**
Today the table that says how much each answer is worth contains negative numbers for harm (toxic −4, a faint −8, passing while starving −2), set as if every being were at intensity 2. After the loop-break the world's toxic harm is half that (a toxic eat costs 2 health, not 4), and HANDOFF's bound puts every being at intensity 1 by tick 4,096 at the latest. By §2.4's definition that is a gap: the table is set at intensity 2 while the world's toxic harm follows 2ℓ. Candidate arms:
- **V-1a, gains-only:** all nine negative entries are set to 0. A variant zeroes only the toxic and faint entries; the recorded life says the rise in toxic eating comes from those two.
- **V-1b, toxic harm follows the being's current intensity:** the toxic entry follows 2ℓ, as the engine does. The engine does not scale the faint (−8) or starving (−2) entries by intensity. This makes the choice rule read the intensity, which the beings do not sense; the engine holds the table, not the being, so the design allows it, but it ties a choice to something outside the being's view and needs the owner's yes.
- *What the recorded life suggests (§2.4, guesses held fixed):* under V-1a, 410 of 6,551 non-exploring awake decisions change, 401 of them towards eating, and toxic fruit eaten rises from 289 to 585, because passing scores 0 and eating wins on any chance of a gain. In a real arm the guesses change as the beings learn, so this is a hint of direction only.
- *Cost:* no retraining. The wants table is read only in the choice rule (`live_v1a.mjs` line 1080), not in training. Each arm needs a runner variant built in a copy tree, so the locked runner stays byte-identical, and a pre-registration like v1's. Measured rate for a learning life: 85–187 s each, at most 20 at a time (the L-arm lines of `mind/runs/v1a/RUNLOG.txt`, on the PC).
- *Predictions to lock first (direction only):* V-1a eats toxic fruit more often than the current arm and faints more often early in a life; V-1b is closer to the current arm than V-1a is. Failure case: no difference from the current arm.
- *Care:* V-1a is predicted to faint more often. A faint is 8 ticks down (a protective rest, not a felt pain), and the loop-break stays as the floor. Whether to run an arm predicted to faint more is for the owner (the Plan's Rule 6: welfare over speed, stated). The value table is still pending the owner's review, and what counts as better is the owner's value choice.
- *Recommendation:* **yes to V-1a as a pre-registered test arm** (it answers your question), **and to V-1b if you agree that the table may follow an intensity the beings do not sense.** Neither is a default and neither is a ruling.

**U-1. Should the world add the two missing steps of the unit, ASK and LANDED?** (A candidate for the owner, beside the senses and V-1. The name U-1 is mine; `PLAN_FRACTAL.md` already uses A-1.)
§1.8 shows ASK and LANDED missing at every level above the rung and the tick. Candidate arms, one change each, pre-registered like v1:
- **U-1a, LANDED to the donor:** the donor hears "your help arrived". The donor does not choose today: it is picked by hash and publishes its vector every tick, as a message the design calls a constant, with no gradient back (BRIDGE_DESIGN §3.4). U-1a would make that vector depend on the receiver's relief, so "constant" no longer holds, though "no gradient to the gift" can; §3.4 and §3.5 would be amended together. The news would enter the donor's top, as the sting does, and no gate, so it is information and not a score. The bus is shared, so the change is staged (§1.3 rule 9). No new action and no second ledger byte.
- **U-1b, ASK on call:** a being can ask for help; the bus answers scaled to the call, never unasked; the being hears the answer as a typed token (permit, permit smaller, decline with the nearest thing permitted); asking costs something (§1.3). This is Path B's first hop (§1.1) applied to the bus: §1.3 step 1 would let a being ask for what its own menu allows, as well as the seat. It needs the ASK port and a second ledger byte, so it is not the first build (C-6 item 9 puts Path A first).
- *Test, from the Skill (does the next message change?), to pre-register:* for U-1a, against a zero-weight control arm (news weight 0), the receiver's relief on helped segments and the donor's own choices (eat, pass, rest), judged against a margin set from the noise floor before the run, as v1a did for NGE. The donor's vector differing is by construction and is not the test. An optional variant: news as three classes (used, changed, did not fit here) against the same news as one number. For U-1b: do asks differ after an answer.
- *Expectation, not locked:* no change in NGE. In one world, one value table and 16 worlds, LH − L was −0.13 against the margin 1.02 (reported, not tested as a hypothesis in v1a). That was help received, a different channel from news sent back, so I claim no expectation for the readouts above. Failure case: no difference from the control.
- The owner frames these as compassion mechanics (their framing, one viewpoint). The readout is the donor's next gift and the receiver's relief, not the score.
- *Recommendation:* **yes to both as test arms, U-1a first** (a smaller change: no new action and no second ledger byte). Neither is a default; the ask's cost number is the owner's (C-6 item 7).

### New questions this round raised

- **N-1. Do beings start with different senses, and who sets them?** *Recommend yes; the world seed sets the menu and the higher self picks from it* (your rule that a choice belongs to the level whose awareness covers it). If you would rather the seed assigns directly, that is a value choice for you. Rotate across valleys so a profile does not sit on one valley; describe by fit, never rank. Ra (lookup 8, partly) ties some abilities to stage (19.5–19.6) and to what an entity brought in (65.12, 4.11); the stage reading is a guide synthesis, and in the sessions checked Ra ties no sense to a named star.
- **N-2. May a sense open on its own as a being's stage rises?** *No:* only by an ask. A stage timer would make seasons without a faint the ones that open the view.
- **N-3. Who may sit in a higher-self seat?** *You; an AI only with your yes.*
- **N-4. How deep may sharing go?** Outward facts only (what another ate and what came), or inner state too (what it guessed)? *Outward only first.* Ra (lookup 7) has thought open to view in fourth density; the sessions checked are silent on openness in third.
- **N-5. Do you want groups in this world soon** (a triad, a four-ball with an open seat for a Wanderer)? *Not yet:* after the first two arms.
- **N-6. From your universe, which starting skills do you want first, and what does each do?** The map's menu is ordered by what the probes can measure, not by what your skills do.
- **N-7. What is the heading "Earth's Non-Telepathic Mirror" in the Plan meant to hold?** It has no text under it.
- **N-8. When you say the group "grows", do you mean more members, or deeper sharing?** (Open; lookup 6 found Ra silent on head-count and following on depth.)
- **N-8b. Is "quantum entanglement" the Plan's 4096-bit bus (Part 1 §2.2), or something else?** (Open.)
- **N-9. One higher-self seat per being, or one seat per player?** You wrote "entities", plural. *One seat per being, held by one player at a time,* as the simplest start.
- **N-10. The witness carries the table's effect on the 54% of eats where a kind is shared. Is that acceptable under "an answer never hands over the table"?** *Yes:* it is another being's outcome after it happened, not an answer from above. It is your call, since C-6 item 6 says never.

## 4. Order of work (steps, not dates)

1. **Now, no owner answer needed:** write the landing-report line into the thought record and show it in the seat (cost: lens). The thought recorder belongs to another session; this is for the coordinator to pass on.
2. **After C-1, C-2, C-3 and C-5:** pre-register the kind-trace arm with its predictions and failure case; a fresh reader reviews it before any run (as the Plan's §6.7 asks).
3. **Then:** build the sense in a copy tree (new token table, new preset), so the locked files stay byte-identical; retrain three seeds; rerun E1 to E3.
4. **In parallel and cheap:** the smallest test for the lowering ask (§1.7), if the owner wants it.
5. **After the kind-trace arm:** the witness with sense profiles; then the ask (stage 2).
6. **E3 (the still-world test) is independent** of every sense. Its fixed-table preset field must be added before any new world version exists.

Measured durations that apply (logs only): the seasonal nursery, 1,468–1,639 s per seed, three in parallel; v1a lives 69–118 s (frozen arms F and F2) and 85–187 s (learning arm L) on the PC, at most 20 at a time; v1b yoked lives 180–401 s; the probe script, about 52 s on this laptop (its own timer). Anything else would be a guess, and the owner's note stands: the human timeline, 2027, does not translate to these rates.

## 5. How this was checked

**Twenty helpers ran in all** (counts, not durations); the same ones as in `MECHANICS_MAP.md` §5. For this document:
- *Scientist* (Haiku): recomputed the new probe rows; found one mismatch (40.5% against 40.9% of eats in reach) and said the first draft over-read the new probe ("fills in where memory is short and adds nothing beside a full memory"; "most likely smoothing cost"). Both were rewritten.
- *Skeptic* (Haiku): found that the loop-break example left out eleven more poisoned eats, that an amendment to a pre-registration is not a permit, and that the six-link table graded the seat as partly present when it is read-only. All three were changed.
- *Owner reader* (Haiku, as a stand-in): found that my relay reversed the owner's direction at the first hop (now two candidates, A and B, for the owner to choose), that the decision table was mostly refusals (now each decline names the nearest thing permitted), that news should reach the helper, and one judging phrase.
- *Being reader* (Haiku): found that a decline the being cannot perceive is not a way back (now a typed answer token), and that the kind-trace sentence used a world label the being does not have.
- *Game designer* (Haiku): found that repaying in REST scores as a gain, that a season-end window can be timed by the seat, and that the first thing a human sees should be lens-only. All applied.
- *After the scientist's note* I ran one more diagnostic (the witness split by whether the fruit's effect is shared). It reversed one of my predictions: the witness raises CE where the effect is not shared.
- *Final round:* a claim-reader (thirteen findings, all applied), a number checker (five items: four wording fixes, one traced to its source), and a plain-words reader (a glossary, a "waiting on you" line, and five questions reworded so each can be answered in a line).

- *Pull, push and V-1 (added later):* a skeptic and a claim-reader read §2.4 and V-1; between them they found that the value the beings choose by mixes the owner's pull with a pain term (now stated), that the 92 non-positive-value harmful eats are a toxin against a predicted faint (53 of them), that the surprise figure pooled two groups (now split), that "gains-only" has several readings (now three variants), that V-1b makes a choice depend on an intensity the beings do not sense (now flagged for the owner), and a fault verdict ("a distortion built in by design", now "a gap"). Lookup 9 (Ra on distortion, pain and fear) was verified by a second guide. The numbers come from a script that is in the repository (`mind/pullpush_descriptives.mjs`) and can be rerun.
- *The unit at every level, and U-1 (added last):* a skeptic and a claim-reader read §1.8 and U-1. They found that the first table said the tick closed the loop when LANDED to the world is missing there too, that the bus row credited a permit to help that arrives unasked, that U-1a changes what the design calls a constant message (now stated, with the amendment to BRIDGE_DESIGN §3.4 named), that the first test could not fail on the donor half (now a zero-weight control arm and a readout of the donor's own choices), that U-1b needed §1.3 step 1 to let a being ask (now written), that "in proportion" was stronger than lookup 4 gives (Ra's law of squares, 7.1–7.2, is a stronger law; now stated), and that NGE "made no difference" is one run, reported and not tested. All applied.

**Not covered.** Nothing here has been tested with a real asker or a trained mind. The two new probe rows are exploratory and flagged. A placebo witness, and a witness with several neighbours agreeing, were not run. The readers are instances of a model reading text; the owner reader is a stand-in.

## 6. The pipeline and the way of thinking, made fractal

The owner, 2026-11-02: "its not just the engine that needs to be fractal, your pipeline and way of thinking too". This is their viewpoint. What I did with it, and where it did not hold:

- **The same cycle at each scale.** Row: each row in the map names its source and its label. Document: viewpoints read it, and a fresh claim-strength reader goes over it. Round: the coordinator receives the report and updates the plan. Project: the owner approves.
- **Inside and around.** For each document: inside, its parts (rows, rules, questions); around, a supplier below (the probes, the lookups, the Plan), a host above (`PLAN_FRACTAL.md`), and a lateral dual (a reader built to disagree, the skeptic).
- **Viewpoints grew with the level.** This work sets design rulings for the owner, so I used the six roles the brief named, plus a claim reader. Two Haiku scouts searched for mechanics I had missed before the drafts, and a Ra guide with a verifier answered the one new Ra question.
- **Where it did not hold.** The Ra step was linear: one question, a guide, a verifier. Row-by-row number checks were done by me before the readers, and by the scientist reader after. The new probe was run by me, then read by the scientist, who found one mismatch and three over-readings; so the cycle caught errors only at the second scale, not the first. Two of my sentences were wrong in a way a row-level check would have caught: the witness prediction "helps about nothing where not shared" (the diagnostic then showed it is worse than nothing there), and the loop-break example (the being did not stop eating poison).
