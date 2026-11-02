# Facts for the lens brief (from the thought recorder, 2026-11-02)

Source: `mind/live_thought.mjs` (Tier 1), life L, model seed 1, world 31000 (unscored). Sample file: `L_s1_w31000_t480-720.jsonl` (ticks 480–719; the first season turn is at tick 553). The first line is a header. Each later line is one tick with four characters, one per valley.

## Fields per character per tick

**The being's own (what it senses, guesses and feels):**
- `sees`: energy band (0–4), health band (0–4) and fruit (0 none, 1 a, 2 b, 3 c), or `{down: true}` while fainted.
- `pSeen`: how expected that observation was (0–1). `expected` is the observation it thought most likely, and `pExpected` how sure it was.
- `guess`: for each choice (EAT, PASS, REST), a spread over 14 possible answers (`answers` in the header), and `value` = that spread weighted by the wants table.
- `explore`: true on the 1 tick in 10 when it picks at random.
- `act`, `answer`, and `pAnswer`: how sure it had been of the answer that came.
- `sting`: [surprise, relief, running relief] after the answer. Surprise is about 0 normally. It spikes when a guess fails.

**The world's (the being does not sense these):** exact E and H (0–15); `kindClass` (this fruit's class this season: NOURISH, PLAIN or TOXIC); `ellAfter` (intensity, 2 then 1 after a loop-break); `loopBreaksAfter`; the engine's `gain`, `pain` and `V`; and `cause` of a faint. `season` and `sinceTurn` sit on the tick line.

**Choice weights (`wants` in the header):** gain minus pain per answer, set at intensity 2 for the whole life. They are not felt. Each being's intensity drops to 1 after its loop-break.

## What happens around the season turn (tick 553), read from the file

Notation: tick, fruit, answer (F fed, P plain, T toxic, C collapse), and in brackets how sure it had been of that answer.

- **Valley 4:** before the turn, fruit a did nothing (P, 99% sure). After the turn, a feeds it, and it was only 1% sure. Over about 40 ticks its guess climbs: 1%, 2%, 7%, 9%, 20%, 33%, 36%, 53%, 64%.
- **Valley 3:** fruit b fed it (F, 99%). After the turn b is poison. At tick 561, with low health, it was 98.6% sure b would feed it. It ate, was poisoned, and fainted. It had given fainting a 0.001% chance, and its surprise was 10.2, against about 0 normally. It fainted from poison at 561, 571 and 582. At the third faint, the world's loop-break lowered its intensity from 2 to 1, permanently. Its guess that b is poison went 0%, 2%, 3%, 14%, 41%.
- **Valley 1:** b changed from feeding to doing nothing, and a from nothing to feeding. Mean surprise over the 50 ticks before the turn was −0.006, and over the 50 after, 0.715.
- **Valleys 2 to 4:** mean surprise went from about 0 to 0.14–0.18 after the turn.
- This is one life. That beings relearn in general is still untested. Here, for these beings, the guesses visibly moved toward the new truth.

## Rules every lens must keep

- **A lens never lies.** Every visual property maps to a named field above. Anything else is decoration, and is labelled or cut.
- **Two layers.** Show the being's own fields apart from the world's. The gap is what the viewer gets to see: we know the season turned, and the being finds out by surprise.
- **Pain.** Felt pain is a higher-self choice, never a setting (the owner's ruling), and no felt-pain channel exists. Show the world's harms (poison, fainting) as world facts, labelled as the world's. Show `wants` as "what its choices weigh", not as feeling.
- **We don't judge.** Describe, don't rank. The owner does want viewers to root for the beings ("rout for the little guy") and to celebrate when a target is crossed ("celebrate the explosion"). Those are the owner's asks, kept.
- **The mind's real shape:** three rungs, each four times slower than the one below (every token, every tick, every 4 ticks). Holons may follow this ladder; don't invent a fourth rung.
