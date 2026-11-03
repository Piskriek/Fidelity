# Headroom probes: how much each candidate sense tells about the next ANSWER (Track C, step 2)

Lower CE means the sense tells more about what comes next. Each number is the held-out ANSWER cross-entropy (natural log, nats per answer token) of an add-0.5 count model over the 14 ANSWER tokens, fitted on world seeds 40000-40015 and scored on 40016-40019 (full lives of 16,384 ticks, 262,144 answers, none of these seeds in any pre-registration). No neural training.

**This ranks senses by the information the world holds under the nursery's scripted policy. It does not predict what a learner will pick up.** The nursery's trunks did not use the memory headroom they had: ANSWER CE 0.320-0.343 against the memoryless count model's 0.310, where a count model with memory inside the trunk's reach reaches 0.190 and one with unlimited memory 0.025.

**Sanity check, passed first.** The base model on the nursery's own worlds (train 20000-20019, held-out 29000-29001) gives **0.3096994566997321**, refs.json's `ansMemoryless` to the last digit (difference 0). The same rebuilt logs also give refs.json's trace numbers bit for bit: 0.025118 (last outcome), 0.189499 (feed-forward reach), 0.004281 (table oracle), and 40.5% of eats have their last same-kind eat in reach (refs: 40.5%).

## The table

Held-out worlds 40016-40019. "Distinct contexts" counts the training table's keys; "test contexts unseen" counts distinct held-out contexts the training never produced (the right-hand count is how many held-out answers fell in them). Rows 1-11 are the 11 probes asked for; "ref" is a ceiling, not a sense; "extra" rows are not in the brief (how far back the trace must reach).

| # | probe | held-out ANSWER CE | vs base | distinct contexts (train) | distinct test contexts | test contexts unseen | test answers in unseen contexts | sparse (rule declared before running) | smoothing-limited (rule added after run 1) | plain reading |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | base: (OBS, ACTION) | **0.3176** | +0.0000 | 303 | 303 | 0 | 0 (0.00%) | no | no | With only the body bands, the item and its own action, the next answer is guessed at 0.3176 nats. This is the yardstick. On the nursery worlds it was 0.3097; the five 4-life blocks here range 0.3141 to 0.3223. |
| 2 | kind trace, unlimited | **0.0272** | -0.2904 | 814 | 770 | 3 | 4 (0.00%) | no | no | Remembering what this kind did to me last time takes the uncertainty from 0.318 to 0.027: 91% of it gone. The most informative sense measured. |
| 3 | kind trace within reach | **0.1961** | -0.1215 | 969 | 938 | 1 | 1 (0.00%) | no | no | Keeping that memory only where the trunk can reach it keeps 42% of the gain (0.196); only 41% of eats have the last same-kind eat in reach. |
| 4 | witness, 4 ticks | **0.2637** | -0.0539 | 978 | 976 | 0 | 0 (0.00%) | YES | no | What another valley just got from this kind, if within the last 4 ticks, removes 17% of the uncertainty. It was there on 74% of eats. The declared sparse flag fires here, but the cause is world-to-world variation, not thin contexts (see Sparsity). |
| 5 | witness, 16 ticks | **0.2426** | -0.0750 | 951 | 910 | 2 | 2 (0.00%) | YES | no | The same within 16 ticks removes 24%, and was there on 99% of eats. It helps because about half of the (season, kind) pairs give every valley the same effect. Same sparse flag, same cause. |
| 6 | season turn flag | **0.3184** | +0.0008 | 520 | 441 | 9 | 10 (0.00%) | no | no | Knowing the season turned in the last tick tells nothing about the next answer on its own: it is on for 0.19% of ticks and the CE does not move. |
| 7 | season age (0-31, 32-127, 128+) | **0.3208** | +0.0033 | 909 | 902 | 0 | 0 (0.00%) | no | no | Season age alone tells nothing about the next answer (equal to the base at lighter smoothing). Its worth shows only beside the trace (row 11). |
| 8 | group field (others down, others warned) | **0.3305** | +0.0129 | 2,982 | 2,860 | 13 | 15 (0.01%) | no | YES | How many of the other three are down or warned tells nothing about my next answer. The higher CE is the cost of splitting into 2,982 contexts, not harm: equal to the base at add-0.01. |
| 9 | finer body (exact E and H) | **0.3314** | +0.0138 | 2,703 | 2,698 | 0 | 0 (0.00%) | no | YES | Exact E and H tell nothing the bands do not already. The higher CE is again smoothing cost: equal to the base at add-0.01. |
| 10 | kind trace + witness 16 | **0.0354** | -0.2822 | 2,678 | 2,302 | 28 | 41 (0.02%) | no | YES | Adding the witness to the full trace adds nothing measurable (0.0229 against 0.0230 at add-0.01). The higher number at add-0.5 is the cost of 2,678 contexts. |
| 11 | kind trace + season age | **0.0264** | -0.2912 | 2,292 | 2,144 | 13 | 20 (0.01%) | no | YES | Season age adds a little to the full trace: 0.0008 at add-0.5 (better in 5 of 5 rotations) and 0.0088 at add-0.01. Probably because the trace goes stale at a season turn (not tested directly). |
| ref | reference ceiling: true effect of the item this season (not a sense) | **0.0055** | -0.3120 | 753 | 746 | 0 | 0 (0.00%) | no | no | Not a sense. A ceiling: knowing the item's true effect this season. The full trace gets within 0.022 of it. |
| extra | kind trace kept up to 8 ticks old (extra) | **0.1364** | -0.1812 | 973 | 954 | 0 | 0 (0.00%) | no | no | Extra. The trace kept only when it is at most 8 ticks old keeps 62% of the full trace's gain. |
| extra | kind trace kept up to 16 ticks old (extra) | **0.0704** | -0.2472 | 978 | 964 | 0 | 0 (0.00%) | no | no | Extra. At most 16 ticks old keeps 85% of the full trace's gain. |
| extra | kind trace kept up to 32 ticks old (extra) | **0.0356** | -0.2820 | 969 | 943 | 6 | 8 (0.00%) | no | no | Extra. At most 32 ticks old keeps 97% of the full trace's gain. |

Top three by information, as rows: **kind trace, unlimited (-0.290); kind trace within reach (-0.122); witness, 16 ticks (-0.075)**. As distinct senses: the kind trace, then the witness; no other single sense shows any information on its own. The third is season age, and only beside the trace (-0.0008 at add-0.5 to -0.0088 at add-0.01 against the trace alone).

### Robustness: smoothing, rotations, where the information sits

Same probes; columns are the same tables scored at lighter smoothing (add-0.01; a sensitivity, not the headline), the split of the held-out CE into eats-with-an-item and every other tick, the in-sample CE, the other four rotations of the 20 worlds (each block of 4 lives held out in turn, the other 16 as training; the headline is the last rotation), and how many of the 16 held-out (life, character) units are below the base.

| # | probe | CE add-0.5 | CE add-0.01 | vs base at add-0.01 | CE from eats with an item | CE from all other ticks | in-sample CE (add-0.5) | 5 rotations: mean vs base (range) | rotations below base | held-out units below base |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | base: (OBS, ACTION) | 0.3176 | 0.3158 | +0.0000 | 0.3159 | 0.0017 | 0.3158 | +0.0000 (+0.0000 to +0.0000) | 0 of 5 | 0 of 16 |
| 2 | kind trace, unlimited | 0.0272 | 0.0230 | -0.2928 | 0.0236 | 0.0036 | 0.0272 | -0.2894 (-0.2943 to -0.2865) | 5 of 5 | 16 of 16 |
| 3 | kind trace within reach | 0.1961 | 0.1910 | -0.1248 | 0.1919 | 0.0042 | 0.1939 | -0.1219 (-0.1246 to -0.1205) | 5 of 5 | 16 of 16 |
| 4 | witness, 4 ticks | 0.2637 | 0.2583 | -0.0576 | 0.2593 | 0.0044 | 0.2504 | -0.0624 (-0.0753 to -0.0539) | 5 of 5 | 16 of 16 |
| 5 | witness, 16 ticks | 0.2426 | 0.2377 | -0.0781 | 0.2385 | 0.0041 | 0.2280 | -0.0844 (-0.1013 to -0.0750) | 5 of 5 | 16 of 16 |
| 6 | season turn flag | 0.3184 | 0.3160 | +0.0002 | 0.3161 | 0.0023 | 0.3163 | +0.0008 (+0.0007 to +0.0008) | 0 of 5 | 0 of 16 |
| 7 | season age (0-31, 32-127, 128+) | 0.3208 | 0.3156 | -0.0002 | 0.3163 | 0.0045 | 0.3181 | +0.0028 (+0.0026 to +0.0033) | 0 of 5 | 0 of 16 |
| 8 | group field (others down, others warned) | 0.3305 | 0.3153 | -0.0005 | 0.3177 | 0.0128 | 0.3267 | +0.0134 (+0.0128 to +0.0144) | 0 of 5 | 0 of 16 |
| 9 | finer body (exact E and H) | 0.3314 | 0.3158 | -0.0000 | 0.3187 | 0.0126 | 0.3273 | +0.0131 (+0.0126 to +0.0138) | 0 of 5 | 0 of 16 |
| 10 | kind trace + witness 16 | 0.0354 | 0.0229 | -0.2930 | 0.0257 | 0.0098 | 0.0332 | -0.2820 (-0.2861 to -0.2787) | 5 of 5 | 16 of 16 |
| 11 | kind trace + season age | 0.0264 | 0.0142 | -0.3016 | 0.0170 | 0.0094 | 0.0250 | -0.2909 (-0.2958 to -0.2883) | 5 of 5 | 16 of 16 |
| ref | reference ceiling: true effect of the item this season | 0.0055 | 0.0011 | -0.3148 | 0.0021 | 0.0035 | 0.0052 | -0.3116 (-0.3168 to -0.3088) | 5 of 5 | 16 of 16 |
| extra | kind trace kept up to 8 ticks old | 0.1364 | 0.1313 | -0.1846 | 0.1321 | 0.0043 | 0.1345 | -0.1814 (-0.1854 to -0.1798) | 5 of 5 | 16 of 16 |
| extra | kind trace kept up to 16 ticks old | 0.0704 | 0.0651 | -0.2507 | 0.0660 | 0.0044 | 0.0695 | -0.2467 (-0.2514 to -0.2438) | 5 of 5 | 16 of 16 |
| extra | kind trace kept up to 32 ticks old | 0.0356 | 0.0306 | -0.2852 | 0.0313 | 0.0042 | 0.0348 | -0.2815 (-0.2866 to -0.2784) | 5 of 5 | 16 of 16 |

Reading the second table: the information lives in the ticks where the agent eats with an item (base CE 0.3159 there, 0.0017 everywhere else). Rows 8-11 pay their cost on the other ticks (0.0094-0.0128 against 0.0017): many thin contexts where the answer is certain cost seven pseudo-counts each under add-0.5 over 14 targets.

## Sparsity: what was and was not done

- No context was merged, dropped or backed off. Every probe uses the base's smoothing (add-0.5) for the headline.
- Unseen contexts are few: at most 28 distinct test contexts (row 10: 41 answers, 0.02% of the test) and 0 for rows 1, 4, 7 and 9. They add under 0.0005 nats to any CE.
- The rule declared before running (more than 0.5% of test answers in unseen contexts, or a held-out-minus-in-sample gap above the base's by 0.005) flagged **only the two witness rows**, and for a reason other than thinness: 0-2 answers fall in unseen contexts and 0.2% sit in contexts with under 30 training answers. The gap is consistent with world-to-world variation. The share of eats on a kind that is shared that season is 0.582, 0.626, 0.550, 0.556, 0.543 in the five blocks (test block last, 0.543, the lowest), and the witness gain moves with it: row 5 is -0.0893, -0.1013, -0.0754, -0.0811, -0.0750 in the five rotations. The headline split holds out the world block where the witness is weakest; the five-rotation mean is -0.0844 (row 5) and -0.0624 (row 4).
- The declared rule missed a different problem, which is why a second flag was added after the first run: **rows 8, 9, 10 and 11 are smoothing-limited.** Their add-0.5 verdict against the base moves by more than 0.005 nats when the smoothing is lightened to add-0.01. Even in-sample, rows 8 and 9 sit above the base (0.3267, 0.3273 against 0.3158), so their higher held-out CE is smoothing cost and not information lost. Read rows 8-11 at add-0.01: group field -0.0005 and finer body -0.0000 against the base (no detectable information, to about 0.001 nats); the witness on the full trace -0.0001 against the trace alone; season age on the full trace -0.0088.

## Definitions as built

- Every probe keeps the base context (OBS token, ACTION token) and adds the sense; the sense is attached on every tick (as nursery_refs does for the trace), whether or not there is an item or an eat.
- **Kind trace:** the class (FED, PLAIN or TOXIC) of this character's last eat of the item's kind this life; "never" if none, or if there is no item. **Within reach:** nursery_refs's feed-forward window, kept only if that eat was 1 tick ago or between o+1 and o+4 ticks ago (o = tick mod 4), else "never".
- **Witness W:** the class of the most recent eat of this kind by any other valley in the last W ticks (earlier ticks only); "none" if there is none or no item.
- **Season turn flag:** 1 on the first tick of a new season (tick 0 is not a turn). **Season age:** ticks since the season began, binned 0-31, 32-127, 128+.
- **Group field:** how many of the other three show DOWN this tick (0-3), and how many of the other three, not down, carry HUNGRY, STARVING or WEAK in their bands (0-3).
- **Finer body:** exact E and H (0-15 each), with the item as in the OBS token, in place of the two bands; DOWN stays DOWN.

## Caveats

1. **The scripted policy, not a learner.** Every number comes from the nursery's behaviour policy: half uniform-random actions, half scripted (eat when an item shows and the E band tops out at 10 or below, rest when the H band tops out at 10 or below, else pass). Eats with an item are 33.0% of ticks. A learner that eats on a different schedule has different headroom: the information shows only on eats, and how often it eats and how often a kind recurs set how much there is.
2. **The information is in the world; uptake is untested.** The nursery's minds had 0.12 of memory headroom inside their reach (0.3097 down to 0.1895) and 0.28 unlimited (down to 0.0251), and scored 0.320-0.343. This ranking says which senses are worth testing, not which a mind will use. Pick-up needs its own pre-registered arm.
3. **Sparsity.** See the section above. Probes with many contexts (rows 8 to 11, 2,300 to 3,000 contexts each) have thin cells and a measurable smoothing cost; rows 8 to 11 are best read at add-0.01. In rows 8, 10 and 11, 1.0-1.2% of test answers sit in contexts with fewer than 30 training answers.
4. **Twenty worlds.** The test is 4 lives. The rotations reuse the same 20 worlds, so they check which worlds were held out, not new luck. The witness gain depends on the share of (season, kind) pairs that are shared in the world sampled (0.543-0.626 here).
5. **Which probes changed how the world is read.** No probe changed the world's rules or schedule: all are senses on the existing world (reading (a) of C-1), computed from world code as it stands. Rows 2 and 3 do not change the view at all: the trace is a function of the being's own past tokens. Rows 4, 5 and 8 add other valleys to the view; rows 6 and 7 add the season clock; row 9 changes the OBS token itself (100 band tokens, each with about 9 exact (E, H) pairs in the test worlds, would become about 1,025 tokens). Each of these is on the token table's own list of what the view drops (VIEW_KERNEL: other valleys, the season index and clock, exact E and H inside a band). Rows 10 and 11 inherit the change of their added half. The trace rows need something else instead: a way to carry memory past the trunk's reach, which this report does not measure.
6. **My own readings of the world, which a different reading could change.**
   - A COLLAPSE on an eat carries no class (the answer token is COLLAPSE), so it is not entered in any trace or witness. This is 2,415 of 86,464 eats with an item (2.8%) in the test worlds, as in nursery_refs.
   - A collapsed body shows only DOWN, so row 9 gives it no E and H (its answer is always ERR_DOWN).
   - "Warned" in row 8 means HUNGRY, STARVING or WEAK from the other valley's bands this tick; a down valley counts as down, not as warned.
   - The witness uses strictly earlier ticks; ties on the most recent tick go to the lowest valley index. The turn flag is off at tick 0 (nothing turned).
   - The "reach" definition is nursery_refs's feed-forward window, copied unchanged.
7. **Not measured.** The answer from above, attention, patterned fruit and space (the other C-1 readings), and the trace limited to the trunk's reach together with the witness (the witness might stand in where the trace is out of reach).

## What the witness is measuring

The plan notes that another valley shows the same kind 58% of the time, which is chance with independent draws. That is not the test. In the test worlds a neighbour had eaten this kind within the last 16 ticks on 99.4% of eats. When the kind is shared that season (54.3% of eats), the neighbour's outcome class equals this character's own effect 99.6% of the time (46,457 of 46,629). When it is not shared, 35.5% (13,936 of 39,308), near the 33% chance level. So the witness is worth what the world's own share rule makes it worth, not chance.

## How stale is the trace, and how far back must it reach

The full trace is old by a median of 6 ticks (90th percentile 21), and 98.2% of traces come from the current season. Kept up to 4 ticks (the nursery's window, with its refresh phase): 0.196. Up to 8: 0.1364. Up to 16: 0.0704. Up to 32: 0.0356. Unlimited: 0.0272. About 32 ticks of memory (128 tokens, four times the nursery's 32-token step) holds 97% of the trace's information here. The 0.022 that the full trace still leaves to the ceiling (0.0055) was not broken down by cause (a season turn leaves the trace stale on 1.8% of eats, and a collapse on an eat carries no class).

## 3/6/9 check on my own claims

For each claim, its opposite, and the number that decides. All differences are against the base held-out CE (0.3176) unless stated.

| # | claim | its opposite | deciding number | verdict |
|---|---|---|---|---|
| 1 | The kind trace is the most informative sense measured | It adds nothing beyond (OBS, ACTION) | -0.2904 (0.0272 against 0.3176); below base in 16 of 16 test units and 5 of 5 rotations (-0.2943 to -0.2865). The null rows sit within 0.001 of 0 at add-0.01 | claim holds |
| 2 | The trunk's reach leaves most of the trace's information unused | Reach is enough | Reach-limited 0.1961 against unlimited 0.0272: reach keeps 42% of the gain, on 41% of eats. A 32-tick window keeps 97% | claim holds, for a count model |
| 3 | The witness carries real information | A neighbour's eat tells nothing (independent draws) | -0.0750 (16 ticks) and -0.0539 (4 ticks), 16 of 16 units, 5 of 5 rotations. Class match 99.6% on shared kinds, 35.5% on others | claim holds, through the world's share rule |
| 4 | 16 ticks of witness beat 4 ticks | The same or worse | -0.0750 against -0.0539; larger in all 5 rotations | claim holds |
| 5 | The witness adds nothing once the full trace is held | It adds something | Trace + witness against the trace alone: -0.0001 at add-0.01, +0.0082 at add-0.5 (smoothing cost) | claim holds at add-0.01; untested beside a reach-limited trace |
| 6 | The season turn flag and season age tell nothing about the next answer on their own | They do | Flag +0.0008, age +0.0033 at add-0.5 (below base in 0 of 5 rotations); at add-0.01 +0.0002 and -0.0002 | claim holds |
| 7 | Season age helps the trace | It does not | Trace + age against the trace alone: -0.0008 at add-0.5 (better in 5 of 5 rotations, by 0.0008 to 0.0019) and -0.0088 at add-0.01 | holds, small, and its size depends on smoothing |
| 8 | The group field and the finer body tell nothing about the answer | They tell something | At add-0.01: -0.0005 and -0.0000. The add-0.5 figures (+0.0129, +0.0138) are smoothing cost: in-sample they are also above the base | claim holds to about 0.001 nats |
| 9 | The ranking does not depend on which worlds are held out | It does | Rows 2 > 3 > 5 > 4 in the same order in all 5 rotations; but row 5 ranges -0.0750 to -0.1013 with the share of shared kind-seasons (0.543 to 0.626) | order holds; the witness size does not |
| 10 | Ranking by information predicts what a learner will pick up | It does not | Nursery trunks: 0.320-0.343 against 0.310 memoryless, with 0.12 of headroom in reach and unused | **not decided here;** the one datum in hand points to the opposite |

## Files

- `bridge/mind/probe_senses.mjs`: the script (about 1 minute; run with `node mind/probe_senses.mjs` from the bridge directory; it stops if the base does not reproduce refs.json).
- `bridge/mind/runs/probes/probes.json`: every number, the rotations, per-life and per-unit CE, the sanity check, and the diagnostics.
- Repeated runs of the script gave the same headline table, to every printed digit.
