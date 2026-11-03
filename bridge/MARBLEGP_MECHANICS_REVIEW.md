# MarbleGp mechanics for the characters: review (2026-11-01)

The owner asked for this: "i suggest a sonnet model searches the marblegp docs and suggests mechanics he finds in there to you for review".

**How it was made.**
- Six Sonnet scouts read all 269 docs in `C:\MarbleGp\docs`, one folder group each. They found 400 mechanics.
- One Sonnet checker per scout opened every cited doc line, and the code path for items marked built: 239 were confirmed and 161 corrected (lines or maturity). None was unsupported.
- A merge pass grouped them into 175 mechanics: 130 built, 35 spec, 10 idea.
- I reviewed the groups that serve the character system against the seam and the owner's rulings.

Raw output: `marblegp_mechanics_raw.json`; the full list is in `marblegp_groups.txt`. Paths below are relative to `C:\MarbleGp`.

**The owner's rulings used here.**
- Pain is chosen, not set.
- We don't judge: describe fit, not worth.
- A lens never lies.
- One side gives permission, the other asks.
- Compassion balanced by choice.

Most conflicts the scouts flagged are one of three: a designer-set pain or ache, a pass mark that reads as a grade, or help applied without the receiver asking.

## What fits, by the missing parts we named

### Prayer: the ask upward, and the answer in proportion
| MarbleGp | Status | Fit | What to change |
|---|---|---|---|
| **The Call, answered in proportion** (`packages/harness/src/science-cosmos.ts` `callIntensity`) | built, library only | A pure number from state; the answer is a separate choice above | Its largest input is ache (0.45). Re-source it from the character's own asks. Use Ra's verified structure for a group's call (lookup 4): the first caller is the cornerstone and is not counted, the second is added, and from the third each caller doubles the whole call |
| **Upward ask: ego digest and body warnings** (`apps/web/src/play/drone-memory.ts`) | built | The nearest built prayer: a typed message upward, whose only write is a cue list | It fires automatically on designer pain. Make it the character's own choice, an ASK token |
| **Higher Self seat: asked from below, cues dreams, never writes** (`drone-memory.ts` `checkCues`, `higherSelfWords`) | built | Exactly the design's higher self: reads the digest, cues the dream, never writes inside | Its one free line of text is not checked against the digest. Allow only lines that decode back to the record (lens truth) |
| **Suggestion handshake** (`logos-galaxy-chronos.ts`) | built | A higher rung may only suggest, never coerce | Drop the "entropy tax" that raises ache. Say "the suggestion did not land" instead |

### Gratitude: the donor hears how its help landed
| MarbleGp | Status | Fit | What to change |
|---|---|---|---|
| **Cause links and the responsibility rule** (`packages/harness/src/preset-memory.ts`) | built | The giver learns how help landed; a link closes when the receiver's dream repairs it | Its graduation gate reads as grading the helper. Keep the information, drop the gate |
| **Learn/teach reciprocity** | spec | The only two-way return path in the notes | Carry "your help landed" as information, not as felt pain |
| **Pair affinity meter (bond)** | spec | A small per-pair state: trust, owed, favours | Its gift-quality multipliers read as worth. Keep counts, drop ratings |
| **Gift economy with lineage credit** | spec | Lineage as the donor's way back | None flagged |

### Groups and triads
| MarbleGp | Status | Fit | What to change |
|---|---|---|---|
| **Polarity as a lean, dyads and nested triads** (`packages/harness/src/polarity.ts` `findDyads`, `triadsOf`) | built | Pure and symmetric: a dyad is opposite poles meeting the same catalyst with good outcomes; a third rung observes the pair, nested 3/6/9 | Its lean is yin and yang, not service-to-others against service-to-self. Keep the two apart. Lending only from "balanced" partners is a worth gate |
| **Social memory complexes: pooling at 0.95** (`system-memory.ts`, `meta-shell.ts` `evaluateParty`) | built | Memories pool above a coherence of 0.95 and separate below; individuals persist; a party doubles power | Membership needs each member's yes. A member cut off "aches" (designer pain). Doubling rewards only the balanced |
| **Harmonious doubling, 2^(N−1)** (`science-cosmos.ts`) | built, library | Close to Ra's doubling | Ra's 10.13 counts differently (the cornerstone is not counted, the second is added). Use Ra's structure if the owner wants Ra-faithful |

### Helpers as individuals
| MarbleGp | Status | Fit | What to change |
|---|---|---|---|
| **Wanderers: a higher being in a lower role** (`packages/harness/src/lifecycle.ts` `descend`, `anchorCalm`) | built, calm path unwired | The named candidate: a graduated being placed veiled, lending calm while it holds steady | Calm is applied without the receiver asking. Offer it on a call. Drop the wording that grades the helper ("panic-spraying") |

### Service-to-self as catalyst
| MarbleGp | Status | Fit | What to change |
|---|---|---|---|
| **Catalyst and limits programmed beforehand by the higher self** | idea | Matches the owner's pain ruling: the higher self declares a catalyst list, and the engine honours only that list | Intensity only goes down; no planned pain |
| **STO/STS polarity dial** | spec | Both forms buildable, each with a declared rule and cost | Its text says one path is "natural physics". Describe fit and cost instead |
| **Leak waves, sappers, aggression dial** | built | Hostile catalyst already in play | Designer-scheduled. It would have to pass through the receiver's `chose=` (Ra lookup 5: access only as far as the receiver's own calling opens the door) |

### Harvest and levels
| MarbleGp | Status | Fit | What to change |
|---|---|---|---|
| **Kundalini rise, mastery, readiness, repeat** (`lifecycle.ts` `harvestReady`) | built | Readiness derived from memory, not a timer: matches Ra lookup 4 (the gates are fixed, readiness decides which one) | "Mastered" and "repeat" rank beings. Keep "repeat, never perish" |
| **Nested presets: the Higher Self as the enclosing preset; graduation** (`inception-loop.ts`) | built | The higher self as a record that reads and cues | A 0.95 pass mark reads as a grade |
| **The Veil: a veiled Bayesian learner, and the harvest choice** (`veil-learning-harvest.ts`) | built, unwired | A declared, seeded observation filter: Ra's veil as a mechanism | Dropped or noisy observations must be declared in the slice (lens truth) |

### Thoughts to dialog and voice
**Semantic-emotional utterance pipeline**, **narrator scheduler**, **system voice** and **composite ego and language from parts**: built, apart from the language ladder, which is spec. The rule "every token must name a preset or fact and decode back to the record" is the lens-truth rule already planned in MIND_STEP7. The flagged risk: an unmapped reason id leaks raw words.

### Needs and mood (for a town-builder world whose people have no mood)
**Utility-graph NPC brains** (spec) and **needs, mood, work priorities in the RimWorld and DF style** (idea). They are the right shape for a declared-slice need scorer. A storyteller that schedules hardship is designer catalyst.

### The seam itself
- **Command-sourced world: one apply gate, typed refusals, replay hash** (`apps/web/src/base/world.ts`): the seam in working form. It is the template for a single write gate in any host engine that lacks one.
- **Per-game permission profile and observer ladder** (`packages/gamebridge/src/index.ts` `gateObservation`): one side permits, the other asks, and the gate reports what it dropped and why.

## What not to adopt
- Any designer-set pain, ache or nociception (body sickness gates, an ache that raises the call, the entropy tax, the "authentic nociception" line). Itch and eureka can stay, as unfelt flags the higher self may surface.
- Pass marks that read as grades (0.95 graduation, "mastered", service-ratio thresholds). Keep the mechanics as fit to a world.
- Help, calm or membership applied without the receiver's yes.
- Free text from outside a character that is not decoded from its record.
- Rule 7 in one of the notes: "rephrase to evade refusals" is a tactic and must not be adopted.

## Proxy play: learning good mechanics from games humans know (owner, 2026-11-01)

The owner: "the proxy is so they can learn good mechanics so our bridge translates to familiar feeling mechanics for the humans".

So the proxy serves the human-facing side of the bridge: the mechanics and their feel. It does not replace the characters' own living. MarbleGp's mechanic mimicry and harvested preset shelf is built for this. The permission profile and observer ladder decide what may be read, and the manifest says which aspects are live, documented or stand-ins.

The rule stays:
- the owner plays, and the observation is read-only;
- mechanics cross (rules, timings, costs, feel parameters);
- assets never cross (art, names, text);
- no AI input into the observed game.

Each game's terms are checked when it ships.

## Proposed next stage-2 arms (each one change, predictions locked first)
1. **Prayer:** an ASK token, plus the Call answered in proportion using Ra's structure.
2. **Gratitude:** the receiver's relief returned to the donor, after cause links, as information only.
3. **Groups:** dyads, then a triad (polarity lean plus a third that observes), with each member's yes.

These are for the owner to rule on.
