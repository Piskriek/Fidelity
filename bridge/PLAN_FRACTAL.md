# Plan: the beings' own point of view, the still-world test, and a fractal world (2026-11-02)

Revised after three Haiku readers checked it (`review_plan_fractal_raw.json`): one on facts, one on claim strength and the owner's rulings, and one reading as the owner. Four scouts gathered the facts from the code (file:line in `scout_fractal_raw.json`).

The owner (2026-11-02):
- "fractal beings would fit a bit better in a fractal engine so they can sense the environment, the host game looks awesome but is also heavy on resources and not an accurate depiction of their pov, a goood translation can spar compassion, that is what we want".
- "your advantage is the skill (requires 3/6/9 pov's) and you have fast agents which means you can iterate quickly, and use your arena brothers to save tokens".
- "when the game engine is a fractal as well the entities who play the higherselves have the ability to ask the parts of the game to change, the engine acts as a teacher keeping them safe".

## What you will see, in order (steps, not dates)

1. **The board tells the truth more plainly.** Done. It says what finished, and which numbers are better when lower. It no longer says "guess right" or "half the minds", and it calls relearning a guess, not a fact.
2. **A sample of one being's life, tick by tick:** what it sensed, what it guessed for each choice, what it chose, what came back, and how surprised it was. From world 31000, which is not scored.
3. **The lens brief and a first drawing** of that being, for you to look at and correct.
4. **Arena's renderers,** checked here before they run on our page.
5. **A short test with you:** can you guess what the being will do next, better than chance?
6. **For the still-world test:** its written rules, which you can read before any life runs, then its result.
7. **For the fractal world:** a short report ranking the possible new senses, then your choice.

**Words used here:**
- A **tick** is one step of the world's clock; a life is 16,384 ticks.
- A **token** is one symbol the being receives.
- **Good eats (NGE)** are nourishing eats minus toxic eats, per 100 times a fruit was in front of the being.
- The **table** is which fruit kinds nourish, do nothing or poison, in each valley, each season.
- **Pre-register** means writing the pass rules down, with their hashes, before any counted run.

## What the beings actually sense today (the facts the lens must honour)

- **Each tick, one observation:**
  - energy in 5 bands;
  - health in 5 bands;
  - the fruit in front of them (none, a, b or c);
  - or a single "down" token while fainted.

  That's 101 possible observations (`bridge/tokens.mjs`). Hunger and weakness warnings are exact functions of those bands, not separate senses.
- **They do not sense** the other valleys, the season, the table, their exact energy, or their intensity.
- **They guess, then choose.** For each choice (eat, pass, rest) they guess what the world will answer, a spread over 14 possible answers. They pick by weighing those guesses with their **wants table**: fixed weights for how much each answer is worth to them. They explore 1 tick in 10.
- **Pain is in their choices, not their feelings.** The wants table is the world's gain minus pain, fixed at intensity 2 for the whole life (`mind/live.mjs` 994–1007). Every character is at intensity 1 for at least three-quarters of each life, so their wants overweight pain then. No felt-pain channel exists: by the owner's ruling, felt pain is a higher-self choice, never a setting. The value table itself is still pending the owner's review.
- **They feel three numbers, updated once a tick after the answer:**
  - surprise: how much worse this guess was than usual;
  - relief: whether help made the guess better;
  - running relief.
- **None of this per-tick life is saved.** Every guess, surprise and gate value is computed and dropped. Only 512-tick summaries and whole-life totals reach disk (`mind/live.mjs` 1031–1126).
- **Replay.** One scored life was replayed on another machine: its world chain, NGE and all 640 integer fields matched. Floats agreed to about 1 part in 10^15, not bit for bit. Whether the machine or the Node version causes that is not isolated.
- **The mind has three rungs**, each four times slower than the one below:
  - rung 0 reads the last 2 tokens;
  - rung 1 fires every tick;
  - rung 2 fires every 4 ticks.

  A season (384–640 ticks) is far above the top rung. Whether this ladder counts as "fractal" waits on the owner's reading (C-1).

## Track A: the fractal lens, their point of view, honestly translated

The aim is that a human watching can see what it is like to be one of these beings: what it senses and what it guesses. And, in the owner's words, can "rout for the little guy" and "celebrate the explosion". Every visual traces to a recorded number: a lens never lies.

1. **Board truth fixes. Done 2026-11-02.**
   - The life count is computed (240, from the local copies of the run logs).
   - "Guess right" is now "how sure they were of what really happened".
   - Faints are marked "fewer is better".
   - The win line's rule is described as set before the race, with its height from the data.
   - The in-flight calls are marked as the page's own reading.
   - "Half the minds never learn" is now "two of the five kinds".
   - Relearning is marked as untested.

   Still open: faints are a down-is-good count, against the handoff's up-is-good rule (decision A-1).
2. **Build the thought recorder** (`mind/make_thought.mjs` → `mind/live_thought.mjs`), in the repo's own pattern. It is generated from the locked `live_v1a.mjs` (checked at 7f814cbf) by exact-once patches. No locked file changes.
   - **Tier 1** patches only the tick driver. For each character it writes one row per tick:
     - the observation, decoded;
     - the three guess spreads and their wants-weighted values;
     - the explore flag, the action and the answer;
     - surprise and relief after the answer;
     - what it expected to see next.
     - Labelled as the world's, not the being's: the season, the table's class for this kind (FED, PLAIN or TOXIC, the world's own names), the faint cause, intensity and the loop-break tick.
     - It writes a world ledger as well.
   - **Tier 2** adds read-only taps inside the step function for the gates and the donor. Nothing may change a number or the call order.
   - A `--from/--to` tick window keeps files small.
   - **Checks:**
     - K5 = 0;
     - the final chain equals the record;
     - NGE and the integer series are equal;
     - floats are bit-equal on the PC, which made the scored records. This check is scheduled on the PC, with the lock check and below-normal priority.
   - Develop on world 31000. Replaying a scored life only to draw it tunes nothing, but say so wherever one is shown.
3. **Write the lens brief with Creative Mode** (Skill Step 0.8), its first real use. It works from a draft field list (the scouts' list) and is re-checked after the recorder's first run.
   - **The brief:** the observer is the owner and lay viewers. The job is to see what the being senses and guesses.
   - **Viewpoints, real ones only:**
     - the owner;
     - a lay viewer;
     - a scientist;
     - the being's own record, meaning what it can and cannot know;
     - a game designer, for the owner's proxy idea that mechanics should feel familiar.
   - **A mapping table** from each visual property to its record field, checked with Step 0.7, with at most one bold move. The holons follow the real ladder: three rungs, four to one.
   - **Two layers:** what the being senses (observation, guesses, surprise), and what the world knows (season, table). While the season stays unannounced (decision C-4), we see the season turn and the being doesn't; it finds out through surprise. The owner holds that a good translation sparks compassion. The lens lets the viewer see that gap, and does not claim it.
   - **Pain:** show the being's surprise and relief. Show the world's harms (toxic fruit, hunger, fainting) as world facts, labelled as the world's. Show the wants table as "what its choices weigh, set at intensity 2, not felt".
4. **Arena builds the renderer.** Send arena battles a self-contained brief:
   - the mapping table;
   - a sample thought file from world 31000;
   - the v1 token table (V = 120, from `tokens.mjs`, not the older design text);
   - and the requirements: plain browser code, no dependencies.

   The brief carries no machine names, addresses or private project names.

   Their code is untrusted. Before it runs on our page:
   - grep it for network and storage calls and dynamic code: fetch, XMLHttpRequest, WebSocket, sendBeacon, eval, `Function(`, `import(`, cookies, localStorage, `window.open`, and any external src or href;
   - serve it with a content policy that blocks all connections;
   - have Haiku viewpoints check that every visual is in the mapping table.

   The best parts are merged by hand.
5. **Mirror and test on the observer** (Step 0.8 items 5 and 6). A reader who hasn't seen the brief plays back what a viewer would do. Then the owner tries, with pass rules written before the test:
   - **Guess the being's next choice.** It passes if the owner's guesses beat the rate of always naming its most common choice on world 31000.
   - **Watch surprise after a season turn.** Write down beforehand, as a prediction, how many ticks the surprise takes to return to its usual level. The v1a reference: fruit guesses fit worse in the first 32 ticks and better from 128 ticks on.
   - **"Celebrate"** marks the moment a stated target is crossed, never a grade. "Climb back" stays the page's own term until a registered recovery readout exists.
6. **The host game as the main view: the owner's call.** Once the lens shows a life, the owner decides whether to stop the host game's servers. Confirm which process before stopping anything.

## Track B: E3, the still-world test (one of the gates before "evolved")

E3 asks: when the fruit rules stop changing, do the learning beings still beat their frozen copies?
- If they still lead, learning pays even in a still world, and E1 is downgraded to "more learning helps".
- If the lead vanishes, the lead needed change.

"Evolved" also needs M1–M3 and G0 to hold, and G0 ran with stated departures (BRIDGE_DESIGN.md §6.6).

**Owner decisions first:**
- **B-1. How still is the still world?**
  - **Route A:** each life gets its own fruit rules, fixed for that life and different from life to life. No change to the world's code. The scoring window then starts at tick 0, a departure from the design that must be stated. The frozen beings cannot know a new life's rules. The learning beings might work them out within one life. That is untested: N4, head-learning on an unseen fixed table, was never run, so it becomes a launch check for this route.
  - **Route B:** one set of rules for every world, the design's literal reading. It needs a default-off switch in the world code (a new hash, with the planted-mutant tests re-run). The critique warns that the frozen beings would then already know the rules, so the test might be unable to show anything.
  - Lean, by reasoning rather than measurement: Route A.
- **B-2. Under Route B only:** lock the table with a fixed formula, so nobody can tune it after seeing results. Under Route A, each life's table comes from its world seed, so there is nothing to lock. Recommended: yes, if Route B.
- **B-3. Write down every outcome before the run,** including the case where the learners do worse than the frozen beings; the rules have no line for that yet. Also decide whether to add a second frozen group, so the still world gets its own measure of noise. Recommended: yes to both.
- **B-4. Run the reference minds (oracle, table learner, eat-everything, random) in the still world,** so the regime checks mean something there. That is 64 extra lives. Recommended: yes.
- **B-5. Which worlds?** Reuse seeds 101–116, which become new worlds under a new preset (disclosed), or use a fresh block of seeds. Recommended: a fresh block.

**Then:**
1. **Build in a copy tree,** so every locked file in the main tree stays byte-identical. List each changed file and its new hash before step 2:
   - the still-world preset, as its own file;
   - the preset path in the trainer (`nursery.mjs`, which `make_live.mjs` pins by hash) and in the live runner;
   - the scorer's trunk-name check and reference runs.
2. **Train W0stat seeds 1–3** with a new worker. Its output folder and names must differ from the nursery's, because reusing `run_worker_nursery.mjs` unchanged would overwrite the locked trunks. Its code checks the PC's worker lock and sets below-normal priority; the existing workers do neither. Measured for the seasonal nursery: 1,468–1,639 s per seed, three in parallel.
3. **Pre-register.** Review it before launch, as §6.7 asks. Of the earlier reviews, v1a's pre-registration review ran before its runs; v1a's runner review and v1b's triad ran after launch.
4. **Run** the still-world lives, plus the reference minds under B-4. Measured v1a rates: frozen 70–118 s and learning 85–187 s per life, at most 20 at a time.
5. **Score,** with a Haiku triad on the write-up.

## Track C: a fractal world, so they can sense more (design first)

**The owner's frame (one viewpoint, the owner's).** In a fractal engine, the entities who play the higher selves can ask the parts of the game to change, and the engine acts as a teacher, keeping them safe. This extends the handshake the project already has:
- one side asks and the other permits;
- a character's higher self chooses which catalysts reach it;
- intensity can only go down.

In design terms:
- each part of the engine is a holon that can be asked;
- it permits or declines within safety rules (pain is chosen; intensity only goes down; a lens never lies);
- news of how the change landed returns to the one who asked. This is the way back the owner calls compassion.

What a part may change, and what "safe" means, are owner decisions (C-6). Ra's view of the higher self and catalyst is not yet looked up (step 3).

**C-1. What does "fractal engine" mean?** Three readings, each with a cost:
- **(a) New senses, same world.** The minds are retrained (measured: 1,468–1,639 s per seed, three in parallel), and the three tests are re-run.
- **(b) Fruit with patterns at 4, 16 and 64 ticks,** so the slower rungs have a pattern to read. This changes the world itself: new world code, retraining, all tests re-run. Today the fruit is drawn independently each tick (`world/valleys.mjs`). Whether grouped fruit would help rungs 1–2 is untested; the nursery's small edge on observations is unexplained.
- **(c) Space:** a ring of cells around each being, fine near and coarse far, with a move action. The biggest change: a new world, and the stage-3 step of the design.

**Candidate senses** (senses scout). The owner's rulings bind all of them, and each leaves open owner decisions, listed below.

| Sense | What the being would perceive | Evidence, and risks |
|---|---|---|
| Kind trace (a memory aid) | What this fruit did to me last time | How well an answer can be guessed, lower is better: 0.310 with no memory; 0.025 if the last outcome per kind is remembered with no limit; 0.190 if it is kept only within the minds' present reach (only 40.5% of eats have it in reach). The current minds score 0.320–0.343, so they did not use the memory available to them. 0.025 needs a route that carries memory past that reach (`NURSERY_RESULTS.md`) |
| Witness | What a neighbour just ate, and how it went | Another valley shows the same kind 58% of the time, which is just chance with independent draws (1 − (3/4)³). Whether neighbours ate it was not measured. The existing help channels made no difference: LH − L = −0.13 and Y − F = −0.11. The link to Ra's shared memory (47.2) is an analogy, not a Ra finding |
| Season weather | That the season turned, or roughly how old it is | It changes E1 and M3, because the turn is no longer a surprise |
| Group field and open seat | How many of the others are down or warned; a seat open for a wanderer | The owner's four-ball idea |
| The answer from above | A response after the being asks, in proportion to the ask, never unasked | Risk: an answer that names the good fruit hands the being the oracle (oracle 50.5 against frozen 28.6), unless asking costs something |
| Attention | Choosing where to look | Choice as the fourth point. If looking is free, always looking wins |
| Finer body | Exact energy and health | The coarse bands leave 8 of 904 (state, action) cells undecided. No gain has been measured |

**Steps:**
1. The owner answers C-1 to C-6.
2. **Headroom probes,** with no training. For each sense, measure with a count model on unscored seeds (40000 and up) how much information it adds. This ranks senses by information in the world only. It does not predict what a learner will pick up; the nursery's minds didn't use the memory headroom they had. Pick-up is tested only in a pre-registered arm.
3. **A Ra lookup,** with a Sonnet guide and a Haiku verifier: perception and senses across densities; the higher self and the programming of catalyst; teaching and safety. None exists yet.
4. Arena battles prototype the chosen world from the code and the v1 token table (not the older design text), untrusted until reviewed. Then pre-register, train and test, as for v1.

## Decisions waiting on the owner

**The lens:**
- **A-1.** Should the board show the share of time awake (higher is better) in place of a faint count (fewer is better)? Recommended: yes.
- **A-2.** Stop the host game's server once the lens shows a life? Your call.

**The still-world test:**
- **B-1.** Route A (each life fixed) or Route B (one fixed world)? Lean: A.
- **B-3.** Write every outcome down first, and add a second frozen group? Recommended: yes.
- **B-4.** Run the reference minds in the still world (64 extra lives)? Recommended: yes.
- **B-5.** A fresh block of world seeds? Recommended: yes.

**The fractal world:**
- **C-1.** Which reading: (a) new senses, (b) patterned fruit, or (c) space?
- **C-2.** Which sense first? Answer after the probe report. The plan leans to the kind trace, as its own pre-registered memory question.
- **C-3.** Can a being remember what each fruit did to it last time? Is a memory aid a sense?
- **C-4.** Should a being be told when the season turns, or should the turn stay unannounced, as now?
- **C-5.** Can a being see what others eat by default, or only when the other gives and the being asks?
- **C-6.** In the teacher engine: what may a higher-self player ask a part to change, and what counts as keeping them safe? What does an answer from above contain, and what does asking cost?

## Order, and what runs side by side

- **Track A:** step 1 is done; steps 2–3 start now.
- **Track C:** steps 2–3 (probes, Ra lookup) start now. Step 1 is the owner's.
- **Track B:** starts once B-1 and B-3 to B-5 are answered. The PC does the heavy part.
- **Every write-up, bulletin, dashboard text or handoff** gets a fresh claim-strength reader before it goes out, and a privacy scan before any push to the public repository.
- **Helpers:** Haiku viewpoints check and iterate fast. Arena builds prototypes from self-contained briefs to save tokens. The PR translator writes a bulletin after each milestone.
