# Lens brief: what a Four Valleys being senses and guesses (lens3)

Track A, step 3, of `PLAN_FRACTAL.md`. Written 2026-11-02 with Creative Mode (Skill Step 0.8, items 3 to 6), from the five viewpoints in `mind/runs/thoughts/lens_viewpoints_raw.json` and the fields in `mind/runs/thoughts/LENS_FACTS.md`. Every number below was read from the sample file `L_s1_w31000_t480-720.jsonl` (one life: arm L, model seed 1, world 31000, unscored, ticks 480 to 719) or from the recorder's source (`mind/live_thought.mjs`, `bridge/tokens.mjs`, `mind/live_v1a.mjs`). The page is `lens3/`.

## 1. The brief (who is watching)

- **Observer:** the owner and lay viewers. Their vocabulary: nature documentaries, sports broadcasts (a team's chance to win, calling a play before the replay), quiz reveals, and game HUDs.
- **The single job:** see what the being senses and guesses, moment to moment, and see the gap between that and what the world knows.
- **Not the job:** grading the being, ranking the valleys, or saying what it feels.

## 2. Facts checked before the design (they change the page)

- **Surprise is relative.** `sting[0]` is the raw surprise of the answer, −ln(`pAnswer`), minus its own running mean. Checked on the file by rolling the mean forward: it holds within 0.002 on every tick of valleys 1 and 4. In valleys 2 and 3 the gaps (up to 0.31) start on answers recorded at p = 0.00001 or 0.00002, where the file's 5-decimal rounding of `pAnswer` alone moves −ln(p) that much, and they decay after. So surprise is signed: below 0 means "less unexpected than its usual". It drifts back toward 0 even while the guesses stay poor, because the mean catches up. (Source: `live_v1a.mjs` line 710, `sting = [mainCE − prevMean, relief, running relief]`.)
- **The turn's timing.** The row's `season` is read after the tick's step, and `kindClass` from the table in force during the tick. At tick 553 the row says season 1, but that tick's fruit still followed season 0's table (valley 3's fruit a was PLAIN at 553 and NOURISH from 556). The new table first applies on **tick 554**, where `sinceTurn` is 0. The page draws the turn between 553 and 554 and computes "ticks since the turn" from the season change. `LENS_FACTS.md` says "turns at tick 553"; that is the tick on which the flag flips.
- **Which moment each world field describes.** `world.E`, `world.H` and `world.item` are read at the start of the tick (what its bands describe); `ellAfter` and `loopBreaksAfter` after the step; `gain`, `pain`, `V` and `cause` are the step's outcome.
- **While down, the act is a placeholder.** The world refuses it (`ERR_DOWN`), so the page outlines no choice row and greys the rows.
- **`starving` is the being's own.** It is part of the answer token the being receives (`tokens.mjs`: the answers are (name, starving) pairs; the header's `answers` list carries them as `/1`). It is true on 5 of 960 valley-ticks (valley 2, energy 0). `LENS_FACTS.md` does not list it yet.
- **The act follows its weights.** On every tick that is not down and not a random pick, the act is the choice with the highest weight (835 of 835). So a viewer who sees the weights can call the act on every tick that is not down or a random pick. The weights stay covered until the call in Guess mode.
- **The guess also reads its own body.** Valley 2's fruit a stays PLAIN across the turn, yet its guess for PLAIN falls from 0.987 (tick 554) to 0.078 (575) while its bands drop to 3 and 2 (from the owner viewpoint's check). A trail can move with no change in the world, so the bands sit beside every trail.
- **The fruit's class is per valley.** At tick 561, fruit a is PLAIN in valley 2 and NOURISH in valley 4. No shared fruit legend.
- **Six fruits changed class at the turn:** valley 1 a (PLAIN to NOURISH) and b (NOURISH to PLAIN), valley 2 b (NOURISH to TOXIC), valley 3 a (PLAIN to NOURISH) and b (NOURISH to TOXIC), valley 4 a (PLAIN to NOURISH). The game designer's viewpoint counted five; it missed valley 3's fruit a because it read class at tick 553.

## 3. The mapping table (every visual property and its field)

Layer B is the being's own: fields the recorder marks as what it senses, guesses and gets back. Layer W is the world's: fields it does not sense. Layer B+W is a being's number picked by a world field, and is drawn in the world band with that said.

| Visual property | Field | Plain words on the page | Layer |
|---|---|---|---|
| Energy pips, 4 segments, as many lit as the band (band 0 = none lit) | `sees.eBand` (0–4) | its sense of its energy | B |
| Health pips, 4 segments, as many lit as the band | `sees.hBand` (0–4) | its sense of its health | B |
| Fruit letter a, b, c in a neutral disc, or "nothing in view" | `sees.item` (0 none, 1 a, 2 b, 3 c) | the fruit in front of it (it knows the letter, not what the fruit does) | B |
| Card dimmed, "down" in place of the bands | `sees.down` | it senses it is down (no cause: it cannot sense one) | B |
| "It gave this sight X%" | `pSeen` | how expected this sight was | B |
| "Last time it saw fruit b (tick N): it ate, and got poisoned" | the latest earlier row of this valley with the same `sees.item`, not down: its `t`, `act`, `answer`, `starving` | what happened the last time it saw this | B |
| "It expected: fruit, E, H (Y%)" | `expected`, `pExpected` | what it thought it would see | B |
| Three rows EAT, PASS, REST, each a bar split into the 14 answers | `guess[k].p`, ordered and named by header `answers` | what it thinks each choice will bring | B |
| "Most likely: ANSWER N%" on each row | the largest `guess[k].p` and its name | its best guess for that choice | B |
| "weighs ±N" on each row | `guess[k].value` (from header `wants`) | what this choice weighs for it (set at intensity 2, not felt) | B |
| Weights key: FED +3, PLAIN +1, TOXIC −4, COLLAPSE −8, and the rest | header `wants` | what its choices weigh, not feelings | B |
| Outline on the chosen row | `act` | what it did | B |
| Die badge, "random pick" | `explore` | 1 tick in 10 it picks at random | B |
| Answer word, with "· starving" when flagged | `answer`, `starving` | what came back | B |
| "It had been X% sure of that" | `pAnswer` | how sure it had been | B |
| Signed surprise bar around 0, clipped at ±4 with a clip mark, one plain colour (not good or bad) | `sting[0]` | surprise: how unexpected, above its usual (0 = usual) | B |
| Surprise sparkline over the window, cursor at the tick | `sting[0]` per tick | its surprise over time | B |
| **Hatched tiles "not sensed"**: exact energy, exact health, what this fruit does now, season, intensity, why it went down | absence of a field in layer B; each tile sits above the world cell that holds it | where its senses end | B (absence) |
| Season strip "season in force · N ticks since the turn · it was not told" | `season` of the previous row; the turn where it changes | the world's season | W |
| Exact energy and health bars, 0–15 | `world.E`, `world.H` | the world's count | W |
| Fruit class chip: feeds / does nothing / poisons (NOURISH / PLAIN / TOXIC) | `world.kindClass` | what this fruit really does this season, in this valley | W |
| Intensity 2 or 1, and loop-break count | `world.ellAfter`, `world.loopBreaksAfter` | the world's intensity, which only goes down | W |
| "Engine: gain, cost, V" | `world.gain`, `world.pain` (shown as "cost"), `world.V` | the world's own numbers, not felt | W |
| "World: poison" on a faint | `world.cause` | why the world put it down | W |
| Fit trail: three lanes a, b, c, a dot on each tick it saw that fruit, height 0 to 1 | `guess[EAT].p` at FED when `kindClass` is NOURISH, PLAIN when PLAIN, TOXIC + COLLAPSE when TOXIC | "how close its guess is to what each fruit really does (fit)", in its own white box inside the world band | B+W |
| Thin line from the current dot up to the top | 1 − fit | the gap still to close | B+W |
| Dashed line at half | constant 0.5 (the owner's value choice) | half | rule |
| Burst on a lane, once per fruit per season | the celebrate rule in §6 | its guess for this fruit matches the season | rule |
| Raw drawer, every field of the tick in two columns | the whole row | every number this card is drawn from | B and W |
| Footer: one life, seed, world, window | header `arm`, `seed`, `worldSeed`, `sample` | what this shows and does not | — |

**Not drawn** (in the raw drawer only): `guess[k].off` (mass outside the 14 answers, at most 0.00016 in the sample); `sting[1]` and `sting[2]`. The code comment calls `sting[1]` "did the help help": the rung-0 aux head's surprise minus the main head's. The recorder names it "relief", a feeling word, and reading it needs the rung picture, so the main view leaves it out. Header `chain`, `script` and `trunk` are shown in the footer's provenance line only.

**The holons.** The mind's ladder has three rungs, each four times slower than the one below (every token, every tick, every 4 ticks). The Tier 1 record holds one row per tick, so the page draws the tick rung only. It has no zoom to 4-tick blocks and invents no fourth rung. A rung-2 view waits for a record of that rung.

### Step 0.7 on the table

- **Node.** The thing: the being's guess (its spread for each choice). Its opposite: what the world will answer, set by a class it cannot sense. The test: the answer that comes back, read as how sure it had been (`pAnswer`) and its surprise (`sting[0]`). Around: the valley card under the season strip. Inside: three choice rows of 14 answers. The bridge: act to answer.
- **Bridge.** The handshake: the being asks by acting, and the world answers. On the page, the viewer asks for each reveal in Guess mode and the page permits; nothing is revealed unasked. The way back: surprise reaches the next guess. Checked: valley 4's fit for fruit a goes 0.013 (tick 556), 0.530 (596), 0.996 (717). Choosing, not judging: a miss reads "it did not see that coming", never "wrong", and no score sits on a being.
- **Whole.** Three nodes: the being, the world, the viewer. Six directed links. Four are filled: being to world (act), world to being (answer), world to viewer (world band), being to viewer (its layers). Two are empty: viewer to being and viewer to world, because the lens is watch-only and must not change the run. By Step 0.7's count (3 nodes plus 6 directed links), 7 of 9 cells: the 3 nodes and 4 of the 6 links. Whether the two open cells are deliberate awaits the owner's ruling.
- **Choice, the fourth point.**
  - Fit is judged against the world's class, not against the being's own top answer. Choice-sensitive: against its own top answer, the trail would show confidence, not fit.
  - The crossing level. Choice-sensitive, checked on the six changed fruits: at 0.1 the first crossings fall at ticks 556 to 637 and all six cross; at 0.5, five cross (the sixth, valley 1's b, does not by 719); at 0.9, three cross (valley 3 a at 581, valley 4 a at 614, valley 2 b at 710). The level decides when the burst fires, so it is the owner's value choice. Default 0.5 until ruled.
  - The reveal order in Guess mode. Choice-sensitive: with the world shown first, the call becomes hindsight. Awaits the owner's ruling.
- **Plain check.** Missing caveats (one life, an unscored world, relearning in general untested) go in the footer. A missing limit (the random pick) is the die. A missing side (what it cannot sense) is the hatched tiles. A missing control: no frozen or non-learning arm is drawn beside it, so a climbing trail is not shown to be learning in general. The fit trail's caption says so.

### Dropped or changed, with the test each failed

- **The gap meter on the being's own card** (game designer). It uses `kindClass`, a world field. On the being's card it would read as the being's knowledge, which fails the two-layer rule. Kept as the fit trail, moved to the world band.
- **A separate world page** (the being's own viewpoint). It hides the gap the plan asks the lens to show. Its worry, that the being seems to know the world, is met by the hatched tiles, the labels and Guess mode's cover.
- **"Upset"** (lay viewer). It implies a favourite lost, which fails "we don't judge". Replaced by "surprise".
- **Faces, mood glyphs, damage numbers on the being.** They fail the pain rule and "a lens never lies".
- **Narrator captions.** They would assert feelings no field carries (node test).
- **A four-tick rollup zoom.** No rung record exists, which fails "don't invent a rung".
- **A live viewer score during play.** It fails "we don't judge". Only the test readout at the end, framed as a test of the page. The game-player mirror asked for a live tally (§9); declined for this reason, and recorded as a disagreement for the owner.
- **An intent telegraph.** The guess is belief, not a plan, so the label would lie.
- **"Relief" bars from `sting[1]` and `sting[2]`.** A feeling word on an aux-head difference. Cut from the main view, kept in the raw drawer.

## 4. The bold move: "not sensed" tiles that sit above the world's answer

**Chosen:** where its senses end, the being's own card shows a hatched tile labelled "not sensed", with no number. Each tile sits directly above the world-band cell that holds the value (exact energy, exact health, what the fruit does now, season, intensity, why it went down). The viewer reads down a column and sees the gap: the being has a hatched blank, and the world has a number.

**Why this, and not the viewer's guess, is the bold move.** Four of the five viewpoints converged on letting the viewer guess before the world's answer is revealed. That move stays, but as the observer test (§6), not as the bold move:
- Step 0.8 item 4 defines bold as the one move the observer's vocabulary does not already contain. Calling a play before the replay, and quiz reveals, are already in it. The game designer's viewpoint asks for familiar mechanics, and this is one.
- Item 6 asks for exactly this test (guess, then show). Four viewpoints converging on it confirms the test; it does not make it bold.
- The hatched tiles are the one move this observer has not seen: a creature's own record that marks where its senses end, in the same grid as everything else. It shows the two-layer gap in place, which is the plan's ask ("the lens lets the viewer see that gap, and does not claim it").
- A blank carries no number, so it cannot lie.

**Its fourth point.** Choice-sensitive, at one place: whether the world's values sit in the same card under the tiles, or on a separate page. In the same card, a viewer may read a world cell as the being's knowledge. The labels, the hatching and Guess mode's cover are there for that, and the mirror readers check it (§7). What the viewer may see that the being cannot is a value choice. The plan already rules that both layers are shown; **the alignment awaits the owner's ruling.** Which fields count as "not sensed" is not a choice made here: it follows the recorder's own split (header note: `sees` to `sting` are the being's; `world` is what it does not know).

## 5. The two layers

- **Its own (layer B):** what it senses (`sees`, `pSeen`, `expected`), what it guesses (`guess`, the weights), what it did (`act`, `explore`), and what came back (`answer`, `starving`, `pAnswer`, `sting[0]`). Drawn on the card's top three bands, with no world colours: a fruit is a letter in a neutral disc, since it knows the letter and not the class.
- **The world's (layer W):** `season`, `world.E`, `world.H`, `kindClass`, `ellAfter`, `loopBreaksAfter`, `gain`, `pain`, `V`, `cause`. Drawn in a separately tinted band headed "The world: it does not sense this".
- **The gap:** after the turn, the season strip says the season changed and "it was not told". The being's season tile stays hatched. Its surprise bar shows where the answers stopped matching its guesses, and its fit trail shows whether its guesses move toward the new rules. That beings relearn in general is untested.
- **Colours.** An answer and the class that produces it share a hue (FED and NOURISH green, PLAIN and PLAIN sand, TOXIC and TOXIC purple). The EAT row's share in the world chip's colour is close to the fit (for a poisoning fruit, fit also counts the faint share, drawn in its own colour). The fruit letters themselves carry no class colour.

## 6. Pass rules for the observer test (written before any test)

None of these has been run. They are written so they can fail. They were written before any viewer test, but after the designer read this life's sample: the baselines below are counted from it. They are not pre-registered in a run log.

**Guess (the plan's rule, Track A step 5).** The viewer picks one valley before starting.
- Ticks 540 to 553 are practice, not counted.
- The test assumes the viewer does not open the browser's developer tools: the page loads the whole file, and the cover is visual only.
- Scored: every tick from 554 to 633 on which that being is not down. Before each call the viewer sees only its own sensed layer for this tick, plus its history up to the tick before. The guess rows, the weights, the act, the answer, the surprise and this tick's world band stay covered.
- A hit is a call (EAT, PASS or REST) equal to `act`. Random-pick ticks are scored too, for the viewer and the baseline alike.
- **Pass:** more hits than always calling its most common choice (EAT in every valley) on the same ticks. Valley 1: 57 of 80. Valley 2: 48 of 80. Valley 3: 39 of 56. Valley 4: 59 of 80.
- **Stronger reading, reported beside the pass, not the bar:** more hits than "the same act as the last time the same thing was in view" (that fruit, or no fruit). Valley 1: 72 of 80. Valley 2: 65 of 80. Valley 3: 45 of 56. Valley 4: 68 of 80. Over all counted ticks this simple rule beats the plan's baseline in every valley, so a pass on the plan's bar alone is weak evidence that the lens adds more than that rule. On fruit-in-view ticks alone it trails always-EAT in all four valleys (53, 45, 37, 53 against 56, 48, 39, 59; counted twice): its edge comes from the no-fruit ticks.
- About 80 calls are few: a margin of one or two hits is within noise.

**Watch: the surprise prediction (the plan's rule).** Before the replay reaches tick 554, the viewer writes how many ticks after the turn it will take until it again foresees what eating a fruit brings, or "not by tick 719".
- **Measured as:** counting from tick 554, the tick of the 8th eat in a row on which it had been at least 50% sure of the answer that came. An eat is an EAT with a fruit in view while not down, whatever the fruit did; other ticks are skipped, not counted as breaks. 50% sure means raw surprise below ln 2 = 0.69 nats.
- **Why not `sting[0]` itself:** `sting[0]` is relative to its own running mean (§2), so it drifts back toward 0 even while the guesses stay poor. The rule uses the raw part, how sure it had been. In the window before the turn, every eat in all four valleys was at least 50% sure.
- **Hit:** within ±10 ticks or ±25% of the measured value, whichever is wider. "Not by 719" hits if the rule does not fire in the window.
- No chance rate exists for a free number, so this is a weak test. The measured values are kept off this brief and off the page until the viewer's prediction is in.
- The v1a reference, as the plan gives it: fruit guesses fit worse in the first 32 ticks of a season and better from 128 ticks on.

**Watch: the distance closing (Step 0.8 item 6).** It applies only to the six fruits whose class changed. The distance is 1 − fit, drawn as the line from the current dot to the top. Landing is defined by the celebrate rule; no separate pass rule.

**Celebrate.**
- For each fruit whose class in a valley differs between the season before and the season in force (the before class is the last class seen for that fruit in that valley, not down, in the season before; the after class is the first seen in the season in force): a burst at the first tick from 554 on with that fruit in view, not down, and fit at or above 0.5. Fit is the EAT row's chance for the world's answer (FED for NOURISH, PLAIN for PLAIN, TOXIC + COLLAPSE for TOXIC).
- Once per fruit per season. The 0.5 level is the owner's value choice (§3, the fourth point); 0.5 is the default until ruled.
- The burst marks the being's crossing. It never fires on a viewer's hit and never grades anyone.
- "Climb back" stays the page's own term until a registered recovery readout exists.

## 7. Mirror (Step 0.8 item 5)

Three `viewpoint` readers (a lay viewer, a stand-in for the owner, a game player) that had not seen this brief or its intent read the built page (`lens3/index.html`) and three screenshots (`lens3/screenshot_*.jpg`), and wrote out step by step what a viewer would do. They are stand-ins, not the owner or real viewers. Their playback and the disagreements are in §9.

## 8. The pain rule

- Felt pain is a higher-self choice, never a setting (the owner's ruling). No felt-pain channel exists, and the page draws none.
- The world's harms are world facts, in the world band, with the world's words: "poisons" (TOXIC), "world: poison" on a faint (`cause`), the engine's `world.pain` shown as "cost" and labelled "the world's own numbers, not felt" (both lay mirrors read "engine pain" as pain), the exact energy count. Its own card shows what it senses ("down", its health band) and the answers it is told (below), never why.
- The weights are "what its choices weigh, set at intensity 2, not felt". Intensity is a world number that only goes down (valley 3: 2 to 1 at its third faint, tick 582).
- Words never used on the page: hurt, afraid, wrong, failed, upset, relief, pass or fail said of a viewer or a being. "Pain" appears only where the page says none is drawn (the caveat line and the legend's pain rule) and as the field name `world.pain`. The recorder's field name `sting[0]` appears only in the legend and the raw drawer; the card says "surprise".
- The answers it gets back (fed, poisoned, fainted, the starving flag) are words for events it is told about, shown in its own layer because it receives them. Why it went down is the world's (`cause`).
- **We don't judge.** No rank across valleys and no score on a being. The fit trail's "up" means fit to the world's answer, not worth. Rooting for the beings and the celebration are the owner's asks, kept, and labelled as the owner's on the page.

## 9. Mirror results and claim reading

Three `viewpoint` stand-ins (Haiku) read the page and screenshots without this brief, on 2026-11-02. Their words are theirs; "guess" marks their own guesses.

**What a viewer would do (playback).**
- **Lay viewer.** Reads the season strip first ("The beings were not told") and tells itself a story: the food changed and nobody warned them. Then the fruit letter, then the fit lanes. Roots for valleys 3 and 4 "as I would for a sprinter", and pities "It cannot act until it is up". In Guess mode it thinks it is being quizzed.
- **Owner stand-in.** Finds compassion in the hatched tiles, "It cannot act until it is up", "no fruit in view", and "it had been 2.1% sure of that". Says sensed and world are "mostly clear", through the swatches, the hatching and "it knows the letter, not what it does".
- **Game player.** Learns fast that with no fruit in view the being passes or rests, settles on "EAT when there's fruit", and finds that "same act as last time with this letter" works best, which needed a notebook. Concludes the beings act on what they sensed and got back, not on what the world does. Found no on-screen leak in its reading of the code. It notes the page loads the whole file and the cover is visual only, so DevTools would show future ticks; that was not tested.

**Where the playback differed from the intent, and what changed.**
1. *"Pass / Not passed" read as a grade* (all three). The readout now asks "Does this page show its point of view?" and says the rule "was met / not met"; "scored" became "counted". The rule itself is unchanged.
2. *Pain-sounding labels* (lay viewer, owner stand-in): "sting[0]" on the card, "engine pain", and a red surprise bar. The card now says "surprise term", the engine number is "cost", and surprise has one plain colour. The legend says the answers are events it is told about, and why it went down is the world's.
3. *The world band read as the being's knowledge* (lay viewer). Its header now says "the being cannot see this band"; the fit trail sits in its own white box, "its own guess, measured against the world".
4. *"Fit" read as fitness* (lay viewer). Now "how close its guess is to what each fruit really does (fit)", with "not fitness" in the caption and legend, and a "half" label on the dashed line.
5. *Crossing times read as a race* (lay viewer, owner stand-in: "27 ticks after the turn" beside "42"). The card shows only the crossing tick; the legend says crossings are not a race.
6. *The cheer named the season,* which the being cannot sense (owner stand-in). Now "its guess for fruit a now matches what the fruit does". The "owner's ask" note moved out of every card into the legend once.
7. *"Owner" and "table" unexplained* (lay viewer). Now "the project owner" and "fruit rules".
8. *The memory rule needed a notebook* (game player). Each card now shows its own last experience with the fruit in view (mapping row added in §3). This makes the stronger baseline visible to the viewer; the pass rule is unchanged, and the stronger reading now says whether the viewer's matches outnumbered a rule they can see.
9. *"8 meals in a row" read as 8 ticks* (game player). Now "counting meals only".
10. *Caveats too low on the page* (lay viewer). A one-line caveat now sits under the title: one life, no feelings drawn for any being, nothing grades or ranks.

**Disagreements kept for the owner.**
- A live tally in Guess mode (game player) against "no live score" (§3 dropped list).
- Whether a crossing toward "poisons" gets the same burst as one toward "feeds" (owner stand-in). The rule treats both as fit.
- Whether "fainted" and "starving" belong in its own layer. This brief keeps them there because the being receives them as part of its answer (`tokens.mjs`); the owner may rule otherwise.
- The observer test assumes the viewer does not open DevTools.

**Claim reading.** A `claim-reader` read §1 to §8 and the page's text and returned 12 findings. Fixed: the rules' timing (written after reading the sample, §6); the baseline's label (it counts no-fruit ticks too); three cross at 0.9, not two; the surprise check's exceptions (§2); "always call the act" limited to non-random ticks; the owner's open rulings no longer worded as done; the 7-of-9 count explained; "now matches the season" (the being cannot sense the season) and "they find out through surprise" (a mechanism) reworded; the colour-match line; "meals" renamed "eats". The arena brief and §9 had a second read (see the report).

## 10. The picture view (round 3, 2026-11-02)

**Why.** Round 2 of the owner's observations (the manager's local observation log (not published)): looking at the words view at tick 514, the owner said "i see a wall of text, we need another bridge, youve bridged to text but text is not my native language". The scoring found that every one of Claude's guesses assumed the page would be read. The words view stays, unchanged in substance, at `/words`. The picture view is the new default at `/`.

**Viewpoints this round** (Creative Mode again): a visual thinker who does not read (new; it saw the owner's screenshot), the being's own record (honesty check), and the two most visual earlier proposals, the game designer's "Hot-Cold Fog" and the owner's "Grenade Flight". All are stand-ins; none is the owner.

**The bold move, carried over:** the being's senses are a clear bubble, and the fog ring around it is where its senses end. The world (sky, ground, each fruit's true kind, intensity, a faint's cause) lies outside the bubble, where only the viewer sees it. This is §4's "not sensed" move, drawn instead of written. Everything else uses familiar game and broadcast grammar: tendrils as hot or cold guesses, ripples, a sky that changes, a celebration burst.

**Mapping (every shape, colour and motion, and its field).** Hover any shape for its plain words and field; the Aa button lays short labels on the picture.

| Shape, colour or motion | Field | Layer |
|---|---|---|
| Sky colour (two hues); a wipe across the sky on the first tick under new rules | `season` of the previous row | W |
| Two small grey dots in the sky; one becomes an outline for good | `world.ellAfter` (intensity, only goes down), `loopBreaksAfter` | W |
| Clear bubble around the being | its senses (layer B) | B |
| Hatched fog ring around the bubble | no field: where its senses end | B (absence) |
| Bubble cut down to a small disc, body flat and grey, no tendrils (a cut, not a fade) | `sees.down` | B |
| Body size | `sees.eBand` | B |
| Body colour depth | `sees.hBand` | B |
| Gentle breathing (±2.5% size) | none: decoration, said in the code and here | — |
| Fruit shape in ink, no fill colour: circle a, triangle b, diamond c | `sees.item` | B |
| Faint dashed ghost shape near the fruit, opacity | `expected.item`, `pExpected` (drawn only when it expected a different fruit) | B |
| Three tendrils: to the fruit (eat), upward (pass), into the ground (rest) | `guess[0..2]` | B |
| Tendril colour | the kind of that row's most likely answer (fed green, plain sand, poisoned purple, fainted wine, ok or rested blue, refused grey) | B |
| Tendril thickness: the push | that row's largest `guess[k].p` (how sure) | B |
| Tendril reach: the pull (weight +3 reaches its target, 0 about half way, −4 or less stays a short stub) | `guess[k].value` (its weight, set at intensity 2, not felt) | B |
| Chosen tendril brightens; a ring pulses at its tip; the body leans to the fruit, rises, or settles | `act` | B |
| Grey sparkles on the chosen tendril | `explore` (a random pick) | B |
| A burst at the chosen tendril's tip, in the answer's colour, and a glyph: round = fed, flat bar = nothing happened, wavy = poisoned, flat ellipse = fainted, x = refused, ring = ok or rested | `answer` | B |
| Rings spreading from the body, size by surprise (clipped at 4), only above 0.15; one faint ring drawing in below −0.3; one plain colour | `sting[0]` | B |
| A shadow on the ground under the fruit: solid = feeds, dashed outline = does nothing, wavy edge = poisons, in the matching colour | `world.kindClass` | W |
| A ring around the shadow, filled to the fit | fit (§3: the EAT row's chance at the world's answer) | B+W |
| Purple mist rising from the ground, kept outside the bubble | `world.cause` (toxin) | W |
| Sky lanes, one per fruit shape: dots at fit height on each tick it saw that fruit, coloured by the world's class; a seam at the turn | fit per tick | B+W |
| Gold star on a lane, gold sparks over the shadow | the celebrate rule (§6), the owner's ask | rule |
| Valley numeral 1–4 in the corner | position in `chars` | — |
| Top strip: the whole window; a line at the turn, gold dots at crossings, a dot for now | turns, crossings | W, rule |

**Not drawn in the picture** (hover or the words view only): the exact energy and health counts; `guess[k].value` (hover); `pAnswer` and `pSeen` (hover); `starving` (hover); the engine's gain, cost and V; `sting[1]`, `sting[2]`, `off`; the "last time it saw this fruit" line.

**The owner's pull and push (one viewpoint, the owner's):** "excitement pulls and logic pushes the entities, pain is the result of distorted logic and fear is the result of distorted excitement". The picture draws the first half and leaves the second as the viewer's reading: reach is the pull (its weight for the choice), thickness is the push (how sure its guess is). Where they and the world disagree, the gap is visible and never named: a thick tendril whose answer comes back in another colour (a sure guess the world contradicted), or a short eat tendril over a solid "feeds" shadow (a weak pull toward fruit that would feed it). Since the act follows the highest weight on every tick that is not down or a random pick (§2), the chosen tendril is the longest one except on random picks. No pain or fear is drawn or written.

**Guess as a gesture.** The hand button, then tap a being: playback waits at each tick and three dashed targets appear on that being (the fruit, up, the ground). Tap where you think it will go. The tick then plays slowly: your tap stays as a dashed ring, and its real choice gets a solid ring in the answer's colour. While you choose, its tendrils, the fit ring and its current lane dot are hidden (they are its guess). The world's shadow stays visible, so after the turn you know more than the being, and the gesture asks whether you can see the world from its side. This gesture is for watching, not the counted test. The counted guess test, with its pass rule (§6), stays in the words view.

**Step 0.7, short.** Node: its guess (tendril colour) against the world's kind (shadow colour and shape); the test is the burst at the tip and the rings. Bridge: act to answer; in the gesture, the viewer asks for each reveal by tapping. Whole: as in §3, 7 of 9, with the same two open cells. Choice: tendril colour shows only the most likely answer, so a near split (51 to 49) looks like a sure guess of one colour, with thickness as the only cue. Choice-sensitive; the words view shows the full spread.

**Changes from this round's viewpoints.**
- The being's record: going down and waking are a cut, not a fade (it senses only "down", then its bands again); the random-pick sparkle is grey, not the celebration's gold; the being's colour never shows a fruit's class.
- The visual thinker: the body moves with its choice; answers and the world's kinds carry shapes as well as colours, so they read without colour; surprise below its usual draws in. It proposed cutting the gold burst ("a burst rewards a crossing"). The burst stays because celebrating a crossing is the owner's own ask; whether it stays is the owner's call.

**Value choices left for the owner:** the half line; whether a crossing toward "poisons" gets the same burst; the burst itself; the "rest = into the ground" and "pass = upward" directions.

**Mirror.** A visual-thinker stand-in (Haiku) read four stills before any words. What landed: the sticks, their colours, the fruit shapes, and "a small jolt at tile 3's burst". What it misread, and what changed:
- *"I'd think the ball can see the floor and knows the result, because the stick aims and the dotted line drops to the mark."* The thread from the fruit to its shadow is gone.
- *The fog read as "the disc's edge".* The fog band is now wider and darker hatching.
- *"I'd read the purple burst as injury and the gold dots as a grade."* Poison is now a wavy edge, not spikes, and the intensity marks are neutral grey, not gold. The gold celebration sparks stay (the owner's ask), flagged as the owner's call.
- *"Draw guesses as dashed rings and results as solid rings."* Done in the gesture.
- It read the clear disc as "the fruit, plain and empty", not as the being's senses. Not fixed by shape alone; the Aa labels and hover say it. Open for the owner's round.
It saw stills only; motion (the lean, the ripples, the wipe at the turn) was not seen by any reader.



## 11. The game view (round 4, 2026-11-02)

**Why.** Round 4 of the owner's observations: looking at the picture view, the owner said "we see shapes awesome, at least were speaking a visual language now, now its all about translating the visuals into the same visuals and mechanics humans are familiar with in our games and the gap is closed, that is the harvested mechanics from marblegp". The game view is a third view at `/game`, beside the picture view (`/`) and the words view (`/words`). It borrows conventions players already read, so the meaning may come from games rather than a legend. That is untested with the owner.

**Viewpoints this round:** a gamer who knows these conventions (it read `marblegp_groups.txt` and the MarbleGp review) and the visual thinker. Both are stand-ins.

**The spectator rule (carries the bold move).** Anything marked with a small camera, or drawn under the fog, is spectator-only: the world, which the being cannot sense. The bar at the top says "🎥 only you see". (The first build used an eye; the gamer mirror read it as "an enemy spotted you".) This is the "not sensed" move (§4) in a game's own grammar: fog of war you can see through, as a spectator.

**Mapping.**

| Game convention | Field | MarbleGp line | Layer |
|---|---|---|---|
| HUD bars, four segments: ⚡ energy (amber), ✚ health (teal); greyed out while down | `sees.eBand`, `sees.hBand`; `sees.down` | 122 (nine-zone HUD), 121 (truthful read-outs) | B |
| Exact counts beside the bars, with the camera | `world.E`, `world.H` | 121 | W |
| The fruit as an item pickup (it senses which item, not what it does) | `sees.item` | the roguelike "unidentified item" convention; no MarbleGp line | B |
| A thought bubble over the item: the effect it expects from eating it (round fed, flat nothing, wavy poisoned, flat ellipse fainted), or "?" when no answer is above half; hidden while you predict | the most likely answer of `guess[0].p`, and whether it is ≥ 0.5 | the thought-bubble convention; no MarbleGp line | B |
| Item bobbing | none: decoration | — | — |
| Spectator item tag on the ground, directly under the thought bubble: round = feeds, flat = does nothing, wavy = poisons, with the camera | `world.kindClass` | 121 | W |
| Radial action wheel: wedge to the item = eat (a bite icon), up = pass (a skip icon), down = rest (z) | `guess[0..2]` | 21 (orders vocabulary) | B |
| Wedge length: how much its weight favours the choice (the owner's "pull", §10) | `guess[k].value` (gain minus pain from the preset at intensity 2, not felt; it does not follow the world's intensity) | 32 (the Excitement Compass) | B |
| Wedge colour: what it expects; wedge brightness: how sure (the push) | most likely answer of `guess[k].p`; its probability | — | B |
| Outlined wedge and the body's lean | `act` | 105 (telegraphed wind-up) | B |
| A die on the chosen wedge | `explore` (a random pick) | — | B |
| A result icon popping up from the chosen wedge: round = fed, flat = nothing happened, wavy = poisoned, flat ellipse = fainted (a neutral grey-violet), x = refused | `answer` (and `starving`, `pAnswer` on hover) | 4 (refusal reasons as plain events) | B |
| A neutral cyan radar ping from the body, size by surprise; one faint ring drawing in below −0.3 | `sting[0]` | 20 (ping as shared referent) | B |
| Fog of war outside its awareness, see-through, with a dashed edge; it closes in while down | no field (not sensed); `sees.down` | 51 (awareness bounded by the vessel) | B (absence) |
| Weather: sun and motes, then autumn leaves; the sky colour | `season` of the previous row | 166 (sky from stage) | W |
| A word-free banner on the first tick under new rules: old weather → new weather, with the camera | the season change | 122 (banner queue), 56 (notices bound to events) | W |
| Downed: grey body, a respawn ring with the eye that counts down | `sees.down`; the down stretch read from the record (the world's own counter, which the file does not store) | — | B, W |
| A word-free banner on a faint: a lying shape ← its cause (poison for toxin, ⚡ for hunger), with the camera; the poison cloud only for toxin | `answer` COLLAPSE and `world.cause` (the world also has hunger and other causes; the sample has only toxin) | 56 | W |
| Intensity as two signal bars, the second going hollow (2, then 1), with the camera; a word-free banner (two bars → one) at a loop-break | `world.ellAfter`, `loopBreaksAfter` | 56 | W |
| Tracker per item that changed class: item → its new effect, a bar for its guess at the last tick it saw the item, a spark once it first passes half; with the camera; while you predict, the current tick's bar and spark stay hidden | fit (§3); the celebrate rule (§6) | 91 (questline; its summary in `marblegp_mechanics_raw.json` says "counters only grow"; here the bar can fall, the spark stays) | B+W |
| A word-free banner with confetti: the item, its thought bubble, "=", the world's tag, a spark | the celebrate rule, the owner's ask | 56 | rule |
| Replay timeline: the turn, dark marks at faints, gold dots where its guess first reached half | turns, `answer` COLLAPSE, crossings | 111 (clip replay) | W, rule |
| 🎯 "predict the play": pick a valley, the wedges go blank and dashed, tap one; your tap stays dashed, its real choice is outlined | viewer input; hides its guess, weights, act, answer, surprise and this tick's quest value | 20 (ping as prediction) | viewer |

**Refused (with the reason).** Red health bars, hearts and damage numbers (pain); a difficulty or tension meter (intensity is a world number, not difficulty); XP, level-up, rarity tiers, placement or a streak counter (worth and rank); a pass line on the quest bar (MarbleGp review: "pass marks that read as grades"); "QUEST COMPLETE" (an achievement) and then "CAUGHT UP" (both mirrors read it as a race or "got caught"), replaced by a word-free banner; a five-point star (read as a score), replaced by a spark; a hit flash where its guess meets the item (it would grade the guess, the visual thinker).

**Disagreement kept for the owner.** The gamer wanted the world unfogged, with only a ring at the boundary ("fog reads as danger and hides truth"). The visual thinker read "fog with a see-through overlay, instantly: dark where it cannot see". The page keeps see-through fog.

**Value choices for the owner:** the celebration (confetti, "CAUGHT UP"), the half line behind it, whether a crossing toward "poisons" celebrates the same, the respawn ring showing the world's countdown, the ⚡/✚ icons.

**Round 5 (the manager's look at /game):** "the icons are small, the dial inside the being isn't self-explaining, and two words remain". Changed: action icons, thought bubble, item, world tag, HUD bars and trackers drawn about 1.3 to 1.7 times larger; the compass needle inside the being removed (the longest wedge already shows the strongest pull); "NEW SEASON" and "DOWNED" replaced by word-free banners; trackers moved to the bottom left, clear of the item tag. The page now has no words on screen apart from the top bar's "only you see" pill and the speed label.

**Mirror (two stand-ins, Haiku, stills only).**
- *Visual thinker:* "Four small panels of a top-down arena … It reads like a stealth or pet game." States read at a glance (asleep, alert, downed). Lost: "the calm cream arena". Misread: the pink "fainted" mark and the purple cloud as being hit; "CAUGHT UP" as a race; the wheel as a cone of attention. Its suggestion became the thought bubble: the "?" resolves into what it expects, right above the world's tag.
- *Gamer:* read instantly: pause, speed, timeline, the bars, purple poison, green heal, "?", DOWNED. Needed hover: wedge names, fog, trackers, the star, the tag. Misread: the pass chevrons as level-up, the fork as magic, the intensity chevrons as fast-forward, the eye as "enemy spotted you", the star as a score, "CAUGHT UP" as "got caught". Each of those was redrawn (bite, skip, signal bars, camera, spark, word-free banner).
- No reader saw motion.

**Claim reading.** A `claim-reader` checked §11 and the page's hover text (12 findings). Fixed: the faint banner and cloud now follow `world.cause` (the world also has hunger and other causes); the tracker spark no longer shows the current tick while predicting; world banners carry the camera; the weight hover says it does not follow the world's intensity and labels "pull" as the owner's; "knows which item" became "senses which item"; surprise is "compared with its usual"; the tracker says which tick its bar is from; this section's "the meaning comes from games" became "may come …, untested"; "counters only grow" is cited to the raw summary. Its code checks passed: wedge length through the weight, the needle on the largest weight, the respawn ring from the record, the tracker hiding the current tick, the bars greying out while down, and the MarbleGp numbers.



## For checkers only (spoilers for the observer test)

With the default 0.5 level, the celebrate rule fires at: valley 3 fruit a, tick 581; valley 4 fruit a, 596; valley 3 fruit b, 597; valley 2 fruit b, 618; valley 1 fruit a, 707. Valley 1's fruit b ends the window at fit 0.141 (tick 715) and is drawn "still in flight".
