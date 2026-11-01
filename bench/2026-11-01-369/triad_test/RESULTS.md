# The triad-lens test (2026-11-01)

**Question (the owner's):** is everything a triad? And is the check "where are two things that should be three?" useful?

## Design (Opus, with the prediction locked before the run)
- **Items.** A writer model (Sonnet) wrote 24 working systems, one per domain. In each, two parts A and B are connected by an essential third C. A checker model repaired any item that failed. Each item has three versions: complete, C removed, and A removed. The removals are fluent, with no hint of a gap, and the descriptions avoid wording such as "third", "pair" or "between".
- **Reading.** Six Haiku readers read every system once, with versions rotated across readers:
  - three used the triad lens ("two things described where there should be three; name the missing connecting element, or NONE");
  - three used a plain prompt ("is anything essential missing? name it, or NONE").
- **Judging.** One blind judge (it never saw which prompt produced an answer) scored each answer as HIT, MISS, FALSE_ALARM or CORRECT_NONE.

## Results (24 answers per cell)
| | triad lens | plain prompt |
|---|---|---|
| C removed (the connecting third), found | 19/24 (79%) | 19/24 (79%) |
| A removed (one side), found | **4/24 (17%)** | **14/24 (58%)** |
| Complete, false alarm | **0/24 (0%)** | **5/24 (21%)** |

## Against the prediction
| prediction | result |
|---|---|
| The lens finds more removed thirds | **Wrong.** A tie, 79% each. |
| The lens finds fewer removed sides | **Right.** 17% against 58%. |
| The lens invents more false thirds | **Wrong, in the other direction.** It invented none, against 21% for the plain prompt. |

## Reading
- The triad lens is a **precise, narrow** check. When it names a missing element it is right: no false alarms, and no wrong names when the third was removed.
- It barely notices a missing **side**: it looks between, not at the ends.
- The plain prompt casts wider and invents more.
- **Use both:** the lens for missing connections, a plain check for missing parts.

## Limits
- This tests the lens, not the claim that everything is a triad. The items were written to contain a connecting third.
- There was one reader model (Haiku) and one judge.
- With 24 per cell, a gap like 79% against 79% means no detected difference, not "equal". The side and false-alarm gaps are large enough to read.

## Audit addendum (2026-11-01, triad audit round 1)
**Item-level overlap.** Computed from `verdicts.json` and `items.json`.

| Removed element | Found by both | Triad lens only | Plain only | Either |
|---|---|---|---|---|
| Third (C) | 16 | 3 | 3 | **22/24** |
| Side (A) | 4 | 0 | 10 | 14/24 |

Each lens alone found the removed third in 19/24.

So "use both" holds for missing connections, where together they find 22 against 19 alone. For missing parts the plain check does all the work.

**The false-alarm rate was measured only where a third exists.** All 24 items were written to contain a connecting third. The lens's 0% false alarms therefore mean "on complete descriptions that contain a third, it named nothing missing". Descriptions that genuinely have no third were not tested. A separate watcher, in a local working folder not in this repository, is probing that question.

**Audit round 2 (2026-11-01): the "together" number is what any second read gives.** Each item version got exactly one triad read and one plain read, so the union is two reads against one.

| Removed element | Both lenses found it | Triad only | Plain only | Neither |
|---|---|---|---|---|
| A connecting third | 16 | 3 | 3 | 2 |
| A side | 4 | 0 | 10 | 10 |

If the two reads were independent, each finding the third at 19/24, the expected split for the connecting third would be about 15 / 4 / 4 / 1. That is what was observed. So the 22/24 against 19/24 matches what a second independent read of any kind would give. This data cannot tell whether the lenses complement each other.

Two plain reads were not tested. "Use both" still rests on two differences: the plain check finds missing sides (14 against 4), and the triad lens raises fewer false alarms. Ten of 24 removed sides were found by neither read.
