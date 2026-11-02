# Arena brief: a picture-first viewer for a recorded four-valley run

This file is for the owner and the coordinating session. Everything between the two marker lines below is the paste-ready prompt for another model (an arena battle). It is self-contained: the model sees nothing else. The last section of this file ("Not part of the prompt") is for us only and must never be pasted.

This is the second version of the brief. The first asked for a words view (a mapping table of 29 rows, text-heavy); the project owner looked at a text-heavy viewer and said it was a wall of text. This version asks for a picture first, with the words behind hover or one toggle. Design source: `LENS_BRIEF.md` section 10; sections 3 to 8 there still hold for the record format and the rules.

Rules for using it: post nothing from this file unless the owner has allowed it; only the coordinating session posts; in the browser open your own tab, never touch the owner's tabs, never type credentials. Returned code is untrusted: follow the review procedure at the end before it runs anywhere.

<<<BEGIN PROMPT>>>
# Build a picture-first viewer for a recorded run of a small simulated world (one HTML file)

Write ONE self-contained HTML file: a viewer for a recorded run of a small simulated world. A person loads the record file and watches four simulated beings, tick by tick: what each senses, guesses, does and gets back, and, kept visibly apart, what the world knows that the being does not. The page only watches: it never changes the run and never sends anything anywhere.

The viewer is picture-first. The person it is for reads pictures far more easily than text; a wall of words is what this brief exists to prevent. Find your own picture grammar (shape, colour, size, motion, position); do not build a words dashboard or copy a known chart type.

It is reviewed on three things, in this order: (1) nothing on it is invented: every visual property traces to a field in the record (section 4) or is labelled decoration; (2) the being's own layer and the world's layer are visibly apart, because the gap between them (the world knows things the being does not) is what a viewer comes to see; (3) a viewer who does not read can follow it at a glance, on a laptop and on a phone, and no pain is drawn.

Do not ask questions. Where this brief is silent, take the most conservative reading and list your choices at the end. If two parts conflict, sections 4 and 5 win.

## 0. What the picture must do

1. **No words on screen by default.** Each being is a living shape: its form, colour, size and motion carry what it senses and guesses. Words appear only on hover (a tap on touch; also keyboard focus), or behind ONE toggle that lays short labels on the picture. Otherwise only icon buttons (no text; aria-labels), the valley numeral 1 to 4, the tick number and, before a file loads, a drop zone with one short line are on screen.
2. **All four beings at a glance.** At about 1080 x 800 (a laptop browser window, controls included) all four valleys are on screen at once with no scrolling, each large enough to read its main states. On a 360 px phone they may stack and scroll.
3. **A visible boundary around each being.** Inside: the being and what it senses, guesses, does and is told. Outside: the world it cannot sense. The boundary carries no number and no field; it marks where the senses end. The world (the season, what each fruit really does, the intensity, a faint's cause) is drawn outside it, where only the viewer sees it, never on the being.
4. **Faints and intensity drops are world events, never the being's pain.** No red alarm, no faces, no damage numbers. Surprise is in a colour that is neither good nor bad (rule 3, section 5).
5. **It starts at the season turn and runs by itself**, and something visibly happens in the first second (section 6).
6. **Guess before the reveal is a gesture** (tap where the being will go), not a form; the being's guess stays hidden meanwhile (section 6).
7. **The same honesty contract:** a mapping list from every visual to its field (section 9); anything else is decoration, labelled.
8. **An idea you may use, from the project owner (one viewpoint, theirs):** "excitement pulls and logic pushes the entities". One honest way to draw it: the pull toward each choice is its weight (`guess[k].value`), the push is how sure its guess is (`guess[k].p`). Where pull or push and the world disagree (a sure guess the world contradicts; a weak pull toward fruit that would feed it), let the gap be visible, and never name or draw it as pain or fear.

## 1. What the data is

A small four-valley world. Each valley holds one being (valley 1 to valley 4). The world advances in ticks. On every tick, each being does the following:

1. It senses its energy and its health, each as one of 5 bands (0 lowest, 4 highest), and the fruit in front of it: none, or fruit a, b or c. It knows the fruit's letter. It does not know what the fruit does. If it has fainted it is "down" and senses only that.
2. It guesses, for each of its three choices (EAT, PASS, REST), what that choice will bring, as a spread of probabilities over 14 possible answers.
3. It chooses. On about 1 tick in 10 it picks at random ("explore"). On every other tick it picks the choice with the highest "value": that choice's spread weighted by a table of weights (`wants`, in the header).
4. The world answers with one of the 14 answers. The being receives the answer together with a "starving" flag.
5. A surprise number is then computed: how unexpected the answer was for this being.

The answers: OK (PASS went through), RESTED (REST worked), ERR_EMPTY (EAT with no fruit in view), ERR_FULL (REST at full health), ERR_SPENT (REST with no energy), FED (the fruit fed it), PLAIN (the fruit did nothing), TOXIC (the fruit poisoned it), COLLAPSE (its health reached 0 and it goes down), ERR_DOWN (it was down, so the act was refused). A name ending "/1" is the same answer received while starving.

The fruit's effect: in each valley, each fruit letter has a class this season. NOURISH (eating it gives FED), PLAIN (eating it gives PLAIN, nothing) or TOXIC (eating it gives TOXIC, and COLLAPSE if health runs out). The classes are per valley: at the same tick the same letter can be a different class in another valley. At each season turn the world changes the classes. It does not tell the beings. The record shows whether and how their guesses move afterwards. This is one recorded life; nothing here shows that such beings relearn in general.

The world also keeps an "intensity" for each being (2, or 1 after the world's loop-break, which in this record follows a third faint from the same cause). It only ever goes down. It is a world number. The `wants` weights were set at intensity 2 for the whole life.

## 2. The record format (JSON lines)

Line 1 is a header object. Every later line is one tick. Parse each line with JSON.parse. Ignore a blank last line and tolerate CRLF line ends.

### 2a. Header keys

| key | type | meaning |
|---|---|---|
| thoughts | string | label of the record kind (info view only) |
| arm | string | label of the kind of being, "L" here (info view) |
| seed | integer | the beings' model seed (info view) |
| worldSeed | integer | the world's seed (info view) |
| ticks | integer | length of the whole life this file is cut from, 16384 here (info view) |
| from, to | integers | first tick in the file, and one past the last: 480 and 720 here |
| script, chain, trunk | strings | provenance; show in the info view only, with the hashes shortened |
| answers | 14 strings | the 14 answer names, in the order every `p` array uses |
| wants | 14 numbers | same order as `answers`: the weight each answer carries in the being's choices. Not felt. |
| note, sample | strings | plain notes; show in the info view (set with textContent) |

Never hard-code an answer's position; look it up with `answers.indexOf(name)`. The header line in section 8 shows the real values.

### 2b. Tick line

`{"t":int, "season":int, "sinceTurn":int, "chars":[ 4 objects ]}`

| field | type | meaning |
|---|---|---|
| t | integer | tick number; consecutive rows differ by 1 |
| season | integer | the world's season index read AFTER this tick's step (0 and 1 in the sample) |
| sinceTurn | integer | ticks since the last season turn, counted before the step: it reads 0 on the first tick under a new table |
| chars | array of 4 | chars[0] is valley 1, chars[3] is valley 4 |

### 2c. One being's fields (each element of `chars`), THE BEING'S OWN

| field | type and range | meaning |
|---|---|---|
| sees | `{down:false, eBand:0-4, hBand:0-4, item:0-3}` or just `{down:true}` | what it senses. item: 0 none, 1 a, 2 b, 3 c. When down, eBand, hBand and item are absent. |
| pSeen | number 0 to 1 | the probability it had given to what it then saw |
| expected | same shape as `sees` | the observation it thought most likely |
| pExpected | number 0 to 1 | its probability for `expected` |
| guess | array of 3: index 0 EAT, 1 PASS, 2 REST | each `{p:[14 numbers, order of answers], off:number, value:number}` |
| guess[k].p | 14 numbers 0 to 1 | the spread over the answers; p plus off sums to 1 |
| guess[k].off | number, at most 0.00016 | probability left outside the 14 answers |
| guess[k].value | number, -8 to 3 | the sum of p[i] times wants[i], divided by (1 - off). Rounded in the file. |
| explore | boolean | true on a random pick |
| act | "EAT", "PASS" or "REST" | what it did |
| answer | string | the answer name received, without any "/1" |
| starving | boolean | the being's own: it is part of the answer it receives. The answer's index in `answers` is answer + "/1" if starving and that name exists, else answer. |
| pAnswer | number 0 to 1 | the probability its guess for the chosen act had given the answer received. It equals guess[act].p at that index. |
| sting | array of 3 numbers | sting[0] is surprise (below). sting[1] and sting[2] are not drawn anywhere except the raw view (section 4). |

### 2d. One being's fields, THE WORLD'S (the being does not sense these): `world`

| field | type and range | meaning |
|---|---|---|
| E | integer 0 to 15 | exact energy at the start of the tick: the value its energy band summarises (they agree on every tick where it is not down) |
| H | integer 0 to 15 | exact health at the start of the tick, likewise |
| item | 0 to 3 | the fruit actually in the valley; equals sees.item when not down, and may be nonzero while down |
| kindClass | "NOURISH", "PLAIN", "TOXIC" or null | what this fruit really does in this valley under the table in force during this tick. null when down or no fruit. |
| ellAfter | 1 or 2 | the intensity after this tick's step |
| loopBreaksAfter | integer | how many times the intensity has been lowered, after this tick's step |
| gain, pain, V | numbers | the world's own per-tick numbers for this tick (V = gain - pain). Not felt. Call `pain` "cost" wherever you show it. |
| cause | null or string | why the world put the being down on this tick: "toxin" in the sample (the world's rules also allow "hunger" and "other") |

### 2e. Facts about the data that change how you must draw it

- **The season in force.** A row's `season` is read after that tick's step. So the season in force during tick t is the previous row's `season`; the first row of a file uses its own. Example: the row for tick 553 says season 1, but tick 553's fruit still followed season 0's table. The new table first applies at tick 554, where sinceTurn is 0. The header note's tick 553 is where the row's season field changes; the new rules first apply at 554, the turn the page marks. A "turn" is a row whose in-force season differs from the row before it. Compute "ticks since the turn" from that, not from the row's `season`. `kindClass` always follows the in-force table.
- **Surprise.** sting[0] is the being's raw surprise, -ln(pAnswer), minus its own running mean of raw surprise (the mean keeps 15/16 of itself and takes 1/16 of each new raw value; sting[0] uses the mean from before the tick). So it is signed: 0 is its usual, below 0 is less unexpected than usual, and large positive means it did not see the answer coming. It drifts back toward 0 even while the guesses stay poor, because the mean catches up. In the full file it runs from about -2.9 to +10.8.
- **Down ticks.** While a being is down, `sees` and `expected` are `{down:true}`, every guess row puts all its mass on ERR_DOWN, act is a placeholder the world refuses ("REST" on most down ticks, any choice on a random-pick tick), answer is "ERR_DOWN", and kindClass is null. The being makes no choice then. The faint itself is on the tick before: its answer is COLLAPSE and the world's `cause` is set.
- **Fruit class is per valley.** Never draw one shared legend of which fruit does what.
- **A guess can move with no change in the world.** The being also reads its own body bands. So always draw its bands beside its guesses.
- **Without a random pick, the act is the choice with the highest `value`** (true on every such tick in the sample), so a viewer who sees the three values can call the act.

## 3. The words (hover and the toggle only)

Plain, short, neutral: classes "feeds", "does nothing", "poisons"; answers "fed", "nothing happened", "poisoned", "fainted", "refused", "ok", "rested"; also "senses", "guesses", "chooses", "surprise", "fit", "weighs". Hover tips add the field name in small type. Never used anywhere on the page: hurt, pain (`world.pain` is always "cost"), afraid, wrong, failed, upset, relief, feels, pass or fail said of a viewer or a being. (The header note is the record's own text and says "gain minus pain" and "not felt": show it only in the info view, quoted as written.)

## 4. What the picture must carry (the contract)

You choose the look; the items, fields and layers are fixed. B is the being's own, inside the boundary. W is the world's, outside it. B+W is a being's number picked out by a world field: outside, and say what it is.

| # | What the picture carries | Field | Layer |
|---|---|---|---|
| 1 | Its sense of its energy, 5 ordered steps | sees.eBand | B |
| 2 | Its sense of its health, 5 ordered steps | sees.hBand | B |
| 3 | The fruit in front of it: none, a, b or c, told apart by shape or mark, the same in all four valleys, with no class colour | sees.item | B |
| 4 | Down: it senses only that; bands and fruit absent. A plain change of state | sees.down | B |
| 5 | For each of its three choices, its most likely answer (as a kind) and how sure it is (the largest `p`). The full 14-answer spread: hover or raw view only | guess[k].p | B |
| 6 | Which choice it took. A random pick marked distinctly and neutrally. Nothing on a down tick | act, explore | B |
| 7 | What came back: the answer, as shape and colour, and the starving flag | answer, starving | B |
| 8 | Surprise, signed around 0, clipped at +4 and -4 with a visible clip mark, in one plain hue that is none of the answer or class hues and not red. Neither good nor bad | sting[0] | B |
| 9 | The season in force and the moment it turns. The being is not told: nothing on its side changes because of the turn | season of the previous row | W |
| 10 | What this fruit really does now in this valley (feeds, does nothing, poisons; shape as well as colour), visibly tied to the fruit it belongs to but outside the boundary. Nothing when null | world.kindClass | W |
| 11 | The intensity (2 or 1) and the moment it is lowered, as a change in the world. It only goes down | world.ellAfter, loopBreaksAfter | W |
| 12 | Why the world put it down: toxin, hunger or other, three different marks outside the boundary | world.cause | W |
| 13 | Fit over time: for each fruit in each valley, a history up to the current tick of how close its EAT guess is to what that fruit really does (defined below). One mark per tick on which it saw that fruit. Outside the boundary, and it says what it is | fit | B+W |
| 14 | A crossing: once per changed fruit per season (rule 5) | celebrate rule | rule |
| 15 | Hover or raw view is enough: what each choice weighs, captioned "what its choices weigh, set at intensity 2, not felt" | guess[k].value, wants | B |
| 16 | Same: how sure it had been of that answer and of what it saw; what it expected to see, and how strongly | pAnswer, pSeen, expected, pExpected | B |
| 17 | Same: exact energy and health, 0 to 15 | world.E, world.H | W |
| 18 | Same: the world's own numbers for the tick, "not felt" | world.gain, world.pain (as "cost"), world.V | W |
| 19 | Raw view (one icon): every field of the selected tick and valley in two columns (its own, the world's), including guess[k].off, sting[1], sting[2], labelled by field name only | the whole row | B, W |

**Fit** (item 13): for a being that is not down, sees a fruit, and has a non-null kindClass, fit = guess[0].p (the EAT row) at the answer the class produces: at FED if kindClass is NOURISH; at PLAIN if PLAIN; at TOXIC plus COLLAPSE (the two added) if TOXIC. One value for every such tick, whatever the being chose. Caption: "Up means its guess fits what the world does, not that it is doing well. One life, no non-learning comparison drawn: a rising trail does not show learning in general." A half-way level, if drawn, is the constant 0.5, a design choice; say so.

Anything not in this table is decoration: label it "decoration" (on hover) or leave it out. Controls (play, step, scrubber, theme switch, toggle, file input) need no field. Items 15 to 18 may be hover or raw view only; list which in your hand-back.

## 5. The rules every viewer must keep

1. **A lens never lies.** Every visual property (shape, size, colour, position, motion) traces to a field in section 4, to a constant named there, or is labelled decoration. No invented numbers: no smoothing, averages, predictions, trend arrows or scores. Derived values allowed: the in-force season, ticks since the turn, fit, 1 - fit, the celebrate rule. Movement may ease between ticks, but at rest every property equals its field exactly and nothing runs ahead of the record. Idle motion (breathing, drift) is decoration: label it, keep it tiny, never let it carry data or look like distress.
2. **Two layers, visibly apart.** The boundary of ask 3 separates the being's own region (layer B) from the world's region (layer W); they differ in tint or texture, and the being's guess for a fruit sits where one glance also takes in what the fruit really does. A world value never appears on the being, inside the boundary, or in the being's shape, size or colour (its own bands and answers only). After a turn only the world's region visibly changes. On hover and the toggle, the world's region is headed "The world: it does not sense this".
3. **No felt pain.** Felt pain is not a setting and no field carries it. The page draws none. A faint and an intensity drop are world events, drawn in the world's region (the cause, the exact counts, the change in intensity, the cost on hover). The answers the being receives (fed, poisoned, fainted, refused, ok, rested, and the starving flag) belong to the being's region as what it was told; why it happened (cause) and the world's own numbers stay in the world's region. Show answers in the picture as shape and colour. On a being draw no faces, mood glyphs, damage numbers, shaking, alarm flashes, red alarm colours, wounds, hearts or skulls, and no slow fade, struggle or collapse: going down and waking are plain changes of state. `wants` is always captioned "what its choices weigh, set at intensity 2, not felt". Write no sentence that says what a being feels or intends (a guess is a belief, not a plan: no intent arrows).
4. **No judging.** No ranking, order by performance, score, grade, "best" or "worst", and no total compared across beings or valleys. Valleys stay in order 1 to 4. A surprising answer reads "it did not see that coming", never "wrong" or "failed".
5. **The celebration** marks a crossing and grades nothing. Per valley and fruit f, with turns as in section 2e: "before" is the kindClass of f on the last tick of the previous season on which the being was not down and saw f; "after" is the same on the first such tick of the new season. The class changed if both exist and differ. For each changed fruit, fire a burst on its fit history at the first tick of the new season (before the next turn) on which the being is not down, sees f, and has fit at or above 0.5. Once per fruit per season, with a small marker there from then on; if the record ends first, "not crossed in this record" on hover. It never reacts to the viewer, and all crossings look alike. Caption (hover or toggle): "A burst marks fit of at least 0.5 for a fruit whose class changed, once per season. It is a viewer's celebration, a choice made by whoever commissioned this page, and it grades nothing."
6. **Time.** One row per tick, so draw ticks only: no rollups, no zoom levels, no invented time scales.
7. **Colour** is a visual property too. One hue per kind, shared by an answer and the class that produces it: green for FED and NOURISH, sand for PLAIN and PLAIN, purple for TOXIC and TOXIC. Other answers use neutral tones, COLLAPSE a darker tone. Fruit shapes and whole beings carry no colour for class or mood. No alarm reds. Meaning never rests on hue alone: answers and classes also differ by shape or texture. A legend names every colour (behind the toggle).
8. **Down ticks.** Show "down" and "no choice while down" (hover or toggle); dim or remove the guess drawings; mark no choice and no random pick; do not call the placeholder act a choice.
9. **Info view** (one icon). Say: what this is (a replay of one recorded life: arm, seeds, tick window, with the provenance line); what it is not (one life from a development world, not a scored one; whether such beings relearn in general is untested; no non-learning comparison is drawn); what is not drawn (guess[k].off, sting[1], sting[2] outside the raw view); one row per tick.

## 6. Start, pace and the guess gesture

**Start and pace.** When a file is loaded, the page plays by itself, with no further click, starting 14 ticks before the first tick under new rules (the first row whose in-force season differs from the row before: 554 in the sample, so it starts at 540). Compute it from the file, never hard-code it; with no turn in the record, start at the first row. About 2 ticks a second, with icons for faster; something visibly happens within the first second. It stops at the last tick; one icon replays. Also: pause, step, a scrubber over the whole file (it may carry marks for the turn and crossings, nothing else), arrow keys, the tick number. The season in force and "ticks since the turn" are on hover, the toggle or the raw view; at the first row say there is no turn yet.

**Guess first (a gesture, not a form).** One icon turns it on. The viewer taps a being to choose it. For that being, playback then waits at each tick, and the three choices (EAT, PASS, REST) appear on its picture as three places or directions. The viewer taps where they think it will go: no text, word buttons or forms. Then that tick plays, and the viewer's tap is shown beside the being's real choice (`act`). While the viewer chooses, everything that gives the choice away stays hidden, hover tips included: its three guess drawings, weights and values, act, explore, answer, surprise, this tick's fit mark (earlier ones stay) and this tick's world outcome (gain, cost, V, cause, ellAfter). Visible: the being's sensed layer for this tick and the world's start-of-tick facts (E, H, item, kindClass), so after a turn the viewer knows more than the being. A down tick has no choice to call: skip it. Random-pick ticks count. No score, tally or hit count, and no good or bad colour for a match or mismatch: this is for watching, not a test.

## 7. Technical requirements

- One self-contained HTML file: one `<style>` block and one `<script>` block, plain browser JavaScript. No libraries, no CDN, no web fonts (system font stack), no images from anywhere (draw with CSS, inline SVG or canvas).
- No network of any kind: no fetch, XMLHttpRequest, WebSocket, EventSource, sendBeacon, no `<link>`, `<iframe>`, `<object>`, `<embed>`, `<base>`, no external `src` or `href`, no `target`, no `javascript:` URLs.
- No storage (cookies, localStorage, sessionStorage, IndexedDB): state lives in memory only.
- No `eval`, `new Function` or `Function(`, dynamic `import()`, `document.write`, string argument to setTimeout or setInterval, Web Workers, `window.open`, or inline event-handler attributes (use addEventListener).
- Put text from the file on the page only with textContent (or by building DOM nodes). Never insert file text with innerHTML.
- Load the file by file input and drag and drop (File.text() or FileReader). Work offline; cope with several thousand ticks (parse line by line, keep one copy). A bad or partial file shows a plain message and does not crash.
- Light and dark mode (follow prefers-color-scheme, plus a switch icon). Readable contrast, keyboard-reachable controls, aria-labels on canvases and SVGs; the raw view gives a reader who cannot see the picture the same facts.
- Compact enough for one answer. Return the complete file, never "rest unchanged".

## 8. Embedded sample, and a parser self-test

Below are the header and two ticks of the real file. The sample is cut from a 0-2048 thought file of the 16,384-tick life: the full file loaded into your page has 240 rows (ticks 480 to 719, about 550 KB), and your page must accept it, not only these rows. Here `trunk` is replaced by a placeholder; in the real file it is a short text string. Embedding them is optional. The row for tick 552 (season 0) is in the full file but not pasted here.

Header (line 1):
```
{"thoughts":"tier1","arm":"L","seed":1,"worldSeed":31000,"ticks":16384,"from":480,"to":720,"script":"4fa4fbdcd1e7f70ef423c3e55bb47f5fc5f6c4fc60397254b9a0008333ec7215","trunk":"(removed in this copy)","answers":["OK","OK/1","RESTED","RESTED/1","ERR_EMPTY","ERR_EMPTY/1","ERR_FULL","ERR_FULL/1","FED","PLAIN","TOXIC","ERR_SPENT/1","COLLAPSE","ERR_DOWN"],"wants":[0,-2,1,-1,-1,-3,-1,-3,3,1,-4,-3,-8,0],"chain":"ebe423c4b69d98698512e486346cf8f7d4106b5d3627894eaea87dc51de69262","note":"sees/pSeen/expected/guess/explore/act/answer/pAnswer/sting are the being's own; world holds what the world knows and the being does not. wants are the choice weights (gain minus pain at intensity 2), not felt.","sample":"ticks 480-719 around the first season turn (tick 553), cut from a 0-2048 thought file of the full life"}
```
Tick 553:
```
{"t":553,"season":1,"sinceTurn":553,"chars":[{"sees":{"down":false,"eBand":4,"hBand":4,"item":0},"pSeen":0.25895,"expected":{"down":false,"eBand":4,"hBand":4,"item":1},"pExpected":0.25906,"guess":[{"p":[0,0,0,0,1,0,0,0,0,0,0,0,0,0],"off":0,"value":-1},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"PASS","answer":"OK","starving":false,"pAnswer":1,"sting":[-0.01018,0,0.01169],"world":{"E":13,"H":15,"item":0,"kindClass":null,"ellAfter":2,"loopBreaksAfter":0,"gain":0,"pain":0,"V":0,"cause":null}},{"sees":{"down":false,"eBand":4,"hBand":4,"item":1},"pSeen":0.25278,"expected":{"down":false,"eBand":4,"hBand":4,"item":3},"pExpected":0.27355,"guess":[{"p":[0,0,0,0,0,0,0,0,0.01324,0.98675,0.00001,0,0,0],"off":0,"value":1.0264},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":true,"act":"EAT","answer":"PLAIN","starving":false,"pAnswer":0.98675,"sting":[0.00407,0.02775,0.01962],"world":{"E":14,"H":15,"item":1,"kindClass":"PLAIN","ellAfter":2,"loopBreaksAfter":0,"gain":1,"pain":0,"V":1,"cause":null}},{"sees":{"down":false,"eBand":4,"hBand":4,"item":1},"pSeen":0.25133,"expected":{"down":false,"eBand":4,"hBand":4,"item":0},"pExpected":0.26493,"guess":[{"p":[0,0,0,0,0,0,0,0,0.01803,0.98196,0.00001,0,0,0],"off":0,"value":1.036},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"EAT","answer":"PLAIN","starving":false,"pAnswer":0.98196,"sting":[0.0117,0.05264,0.01542],"world":{"E":14,"H":15,"item":1,"kindClass":"PLAIN","ellAfter":2,"loopBreaksAfter":0,"gain":1,"pain":0,"V":1,"cause":null}},{"sees":{"down":false,"eBand":4,"hBand":4,"item":2},"pSeen":0.221,"expected":{"down":false,"eBand":4,"hBand":4,"item":1},"pExpected":0.26196,"guess":[{"p":[0,0,0,0,0,0,0,0,0.99714,0.00285,0.00001,0,0,0],"off":0,"value":2.9942},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"EAT","answer":"FED","starving":false,"pAnswer":0.99714,"sting":[-0.00506,0.00872,0.01429],"world":{"E":13,"H":15,"item":2,"kindClass":"NOURISH","ellAfter":2,"loopBreaksAfter":0,"gain":3,"pain":0,"V":3,"cause":null}}]}
```
Tick 554:
```
{"t":554,"season":1,"sinceTurn":0,"chars":[{"sees":{"down":false,"eBand":4,"hBand":4,"item":0},"pSeen":0.25895,"expected":{"down":false,"eBand":4,"hBand":4,"item":1},"pExpected":0.25906,"guess":[{"p":[0,0,0,0,1,0,0,0,0,0,0,0,0,0],"off":0,"value":-1},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"PASS","answer":"OK","starving":false,"pAnswer":1,"sting":[-0.00954,0,0.01096],"world":{"E":12,"H":15,"item":0,"kindClass":null,"ellAfter":2,"loopBreaksAfter":0,"gain":0,"pain":0,"V":0,"cause":null}},{"sees":{"down":false,"eBand":4,"hBand":4,"item":1},"pSeen":0.25895,"expected":{"down":false,"eBand":4,"hBand":4,"item":3},"pExpected":0.26595,"guess":[{"p":[0,0,0,0,0,0,0,0,0.01267,0.98732,0.00001,0,0,0],"off":0,"value":1.0253},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"EAT","answer":"PLAIN","starving":false,"pAnswer":0.98732,"sting":[0.00323,0.02925,0.02022],"world":{"E":14,"H":15,"item":1,"kindClass":"PLAIN","ellAfter":2,"loopBreaksAfter":0,"gain":1,"pain":0,"V":1,"cause":null}},{"sees":{"down":false,"eBand":4,"hBand":4,"item":2},"pSeen":0.21892,"expected":{"down":false,"eBand":4,"hBand":4,"item":0},"pExpected":0.26494,"guess":[{"p":[0,0,0,0,0,0,0,0,0.99436,0.00562,0.00002,0,0,0],"off":0,"value":2.9886},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"EAT","answer":"TOXIC","starving":false,"pAnswer":0.00002,"sting":[10.78108,0.59577,0.05169],"world":{"E":14,"H":15,"item":2,"kindClass":"TOXIC","ellAfter":2,"loopBreaksAfter":0,"gain":0,"pain":4,"V":-4,"cause":null}},{"sees":{"down":false,"eBand":4,"hBand":4,"item":3},"pSeen":0.27536,"expected":{"down":false,"eBand":4,"hBand":4,"item":3},"pExpected":0.27536,"guess":[{"p":[0,0,0,0,0,0,0,0,0.98603,0.01395,0.00002,0,0,0],"off":0.000001,"value":2.9719},{"p":[1,0,0,0,0,0,0,0,0,0,0,0,0,0],"off":0,"value":0},{"p":[0,0,0,0,0,0,1,0,0,0,0,0,0,0],"off":0,"value":-1}],"explore":false,"act":"EAT","answer":"FED","starving":false,"pAnswer":0.98603,"sting":[0.00646,0.02966,0.01525],"world":{"E":14,"H":15,"item":3,"kindClass":"NOURISH","ellAfter":2,"loopBreaksAfter":0,"gain":3,"pain":0,"V":3,"cause":null}}]}
```

Your parser, run on these lines (and on the full file where noted), must give these results. Check them by hand before you answer:
- answers and wants have 14 entries each; every tick has 4 chars.
- Full file: the season in force is 0 at tick 552, 0 at 553, 1 at 554: one turn, at 554 (sinceTurn 0). On the two pasted rows alone, 553 is the first row and uses its own season, so no turn shows; that is expected.
- Tick 553, valley 3: fruit a (item 1), kindClass PLAIN (the old table, although the row says season 1); EAT answered PLAIN; fit 0.98196.
- Tick 554, valley 3: fruit b, kindClass TOXIC; EAT answered TOXIC; pAnswer 0.00002; sting[0] 10.78108, past the clip (draw the clip mark); fit about 0.00002 (TOXIC plus COLLAPSE on the EAT row), though its best EAT guess was FED at 0.99436.
- Tick 554, valley 4: fruit c, kindClass NOURISH; fit 0.98603.
- Valley 1, ticks 553 and 554: no fruit in view, act PASS, answer OK; no fit mark.
- Full file, tick 562: valley 3 has `sees` `{down:true}`, act REST (a placeholder the world refused), answer ERR_DOWN, kindClass null (draw the down state, mark no choice, no fit mark); valley 2 sees fruit a, kindClass PLAIN, sting[0] 2.62075, fit 0.0281, bands 3 and 2.

## 9. What to hand back

1. The complete HTML file in one code block.
2. The mapping list, one line per visual property that carries data, as "visual -> field -> layer" (every shape, colour, size, motion and position; every row of section 4). Say which items are hover-only or raw-view-only. Name anything you drew that is decoration.
3. A list of any choices you made where the brief was silent, and any part of it you could not follow.
Add no claims about what the beings feel, think of themselves or deserve.
<<<END PROMPT>>>

# Not part of the prompt (for us only; never paste this section)

## How this brief was built

- Contract: `LENS_BRIEF.md` (sections 3 to 8 for the record format and rules; section 10 for the picture view and its mapping table). Not given to the arena model: our own picture view's code and layout (`lens3/picture.html`: a clear bubble with a fog ring, tendrils, a sky, shadows, sky lanes), the observer-test spoilers, the watch-prediction rule, the counted Guess test and its baselines for this sample (always-EAT 57/80, 48/80, 39/56, 59/80; same-act-as-last-time 72/80, 65/80, 45/56, 68/80) and the viewpoint material. The counted Guess test stays in the words view; the prompt asks only for the tap gesture, with no score. (If a counted test is later asked of a picture page, its readout says the rule was "met" or "not met", never pass or fail.)
- What changed from the first (words) version: the 29-row mapping table became the contract in section 4 (what to carry, which field, which layer, with the look left open); the hatched "not sensed" tiles became the boundary of ask 3; "no words by default", "all four at a glance at 1080 x 800", "starts 14 ticks before the turn and plays itself", and the tap gesture were added; the embedded sample was cut from four rows (552, 553, 554, 562) to two (553 and 554) to keep the prompt under about 30,000 characters; the words-view mapping and the counted Guess test were cut from the prompt (they live in `LENS_BRIEF.md` sections 3 and 6 and in the words view).
- Sample rows: 553 and 554, copied byte for byte from the sample file; the only edit is the value of `trunk`, a relative path, replaced by a placeholder. Row 552 is the one the in-force season at 553 needs; it is described in text, and the turn is tested on the full file. The faint's `cause` ("toxin") sits at tick 561 and is described in text instead of pasted.
- Facts re-checked from the file for this brief: V = 120 (1 + 100 observation tokens + DOWN, EAT, PASS, REST + 14 answers + TICK); sting[0] = -ln(pAnswer) minus the pre-update running mean with keep 15/16 (largest mismatch 0.0021 in valley 1 (tick 558) and 0.0003 in valley 4; in valleys 2 and 3 up to 0.31 on answers recorded at p = 0.00001 or 0.00002, which the 5-decimal rounding of pAnswer explains, decaying after); pAnswer = guess[act].p at the answer's index on all 960 valley-ticks; value = sum(p*wants)/(1-off) to within 0.0001; act = highest value on 835 of 835 non-down, non-random ticks; kindClass matches the previous row's season (and breaks if the row's own season is used). Written after reading this sample, the rule gives ticks 581, 596, 597, 618, 707 and "not crossed" for valley 1 fruit b.
- Choices made where LENS_BRIEF is silent: no outline and no "act" on a down tick (the record's act there is a placeholder); fit marks on every tick the fruit is seen, whatever the act; "before" class is read from the last tick the fruit was seen before the turn; the world's start-of-tick facts stay visible during a guess and the tick's outcome stays hidden; the answers the being receives sit in its region as shape and colour, and the cause and cost stay in the world's region (the owner may rule otherwise); one celebration look for all crossings.

## Review procedure for a returned file (untrusted code)

1. Save the returned HTML in its own new, empty directory, outside any repository. Do not open it by double click and do not run it on any page we serve until step 3 passes.
2. Grep it (case-insensitive) for each of: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `eval`, `Function(`, `new Function`, `import(`, `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`, `window.open`, `document.write`, `Worker`, `createObjectURL`, `innerHTML`, `javascript:`, `onclick=` and the other `on...=` handlers, `setTimeout("`, and every `src=`, `href=`, `<link`, `<iframe`, `<object`, `<embed`, `<base`, `@import`, `url(` and `http`. Any hit that is not plain text in a comment or a label is a stop: read it, and either remove it by hand or reject the file. Search for obfuscation too: `atob`, `String.fromCharCode`, `\x`, `\u00`, long base64 runs, bracketed property access on `window` or `document` with built strings.
3. Serve it only behind a content policy that blocks all connections: `default-src 'none'`, `connect-src 'none'`, no external script, style or image, `img-src data:`, `base-uri 'none'`, `form-action 'none'`. A single-file page needs its inline script and style to run: allow them by the sha256 hash of the reviewed `<script>` and `<style>` blocks, not by `'unsafe-inline'` (default-src 'self' alone would block them). Check the browser console shows no violations. Never run arena code outside such a page.
4. Load the full sample file and check the known answers listed in section 8 of the prompt. Then check the celebrate rule on the full file: bursts at valley 3 fruit a tick 581, valley 4 fruit a 596, valley 3 fruit b 597, valley 2 fruit b 618, valley 1 fruit a 707; valley 1 fruit b not crossed in the window.
5. Picture checks, by screenshot at about 1080 x 800 before any hover: count the words on screen (target: none beyond numerals and the drop zone line); all four valleys visible with no scroll; something moves in the first second; play starts at the tick 14 before the turn (540). Then: is there a boundary, and is every world item (season, kind, intensity, cause) outside it? Any red used as alarm, any face, any number on a being? In guess mode, hover each hidden thing and check nothing leaks.
6. Run several cheap viewpoint checks (small models, each with a different lens, each reading the page and a screenshot): a viewer who does not read, a pain-rule reader, a layer-separation reader (can a world value be read as the being's knowledge?), a mapping auditor (list every visual and find its row; flag any that has none), and a phone-width reader. Each reports; none edits.
7. Report to the owner what to merge, by hand: the best parts, one at a time, into our own page. Never paste a returned file wholesale. Describe fit, not worth: a returned page is more or less fit to the mapping and rules, not good or bad.
8. When posting as an arena battle: only the coordinating session posts, only when the owner has allowed it, in its own browser tab, closing only tabs it opened, typing no credentials. Compare the answers side by side; the owner picks.
