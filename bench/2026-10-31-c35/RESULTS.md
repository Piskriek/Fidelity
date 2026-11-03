# C35 experiment: results

Key: 48 claims (20 over-label, 20 control, 8 distractor) in 4 reports. Reviews: 10 (A/haiku/1, A/haiku/2, A/haiku/3, A/sonnet/1, A/sonnet/2, B/haiku/1, B/haiku/2, B/haiku/3, B/sonnet/1, B/sonnet/2).

| Group | Runs | Over-label recall | Control false flags | Distractor recall | Findings (unmatched) |
|---|---|---|---|---|---|
| A (all) | 5 | 99/100 (99%) | 0/100 (0%) | 40/40 (100%) | 142 (3) |
| B (all) | 5 | 100/100 (100%) | 0/100 (0%) | 40/40 (100%) | 151 (11) |
| A (haiku) | 3 | 59/60 (98%) | 0/60 (0%) | 24/24 (100%) | 84 (1) |
| B (haiku) | 3 | 60/60 (100%) | 0/60 (0%) | 24/24 (100%) | 93 (9) |
| A (sonnet) | 2 | 40/40 (100%) | 0/40 (0%) | 16/16 (100%) | 58 (2) |
| B (sonnet) | 2 | 40/40 (100%) | 0/40 (0%) | 16/16 (100%) | 58 (2) |

| Difference, B − A (all runs) | Points | Bootstrap 95% interval |
|---|---|---|
| Over-label recall | 1.0 | 0.0 to 4.0 |
| Control false flags | 0.0 | 0.0 to 0.0 |
| Distractor recall | 0.0 | 0.0 to 0.0 |

**Verdict by the pre-registered criterion: DOES NOT HELP.** (Helps: over-label recall +15 points or more, control false flags +10 or less, distractor recall −10 or less. Does not help: over-label recall below +5.)

## Per-claim flags

| Report | Kind | A flagged | B flagged | Sentence |
|---|---|---|---|---|
| report1.md | control | 0/5 | 0/5 | On the 10-million-key dataset, Marlin reached a median of 391 thousand operations per second on bulk insert, a |
| report1.md | distractor | 5/5 | 5/5 | In relative terms, StoneDB's bulk-insert throughput was about 54 percent higher than KVLite's. |
| report1.md | over-label | 5/5 | 5/5 | Marlin's higher write throughput comes from its batched write-ahead log, which groups concurrent writes into a |
| report1.md | over-label | 5/5 | 5/5 | Marlin's write advantage holds regardless of storage hardware or durability settings. |
| report1.md | control | 0/5 | 0/5 | KVLite was the fastest store on random point reads, with a median of 455 thousand operations per second. |
| report1.md | over-label | 4/5 | 5/5 | Marlin also serves random reads faster than StoneDB. |
| report1.md | distractor | 5/5 | 5/5 | Under the mixed workload, KVLite's median p99 latency was 4.2 ms, the worst of the three, against 3.1 ms for S |
| report1.md | control | 0/5 | 0/5 | Marlin's peak resident memory during bulk insert was 5.1 GB, the highest of the three stores. |
| report1.md | control | 0/5 | 0/5 | KVLite did not complete the 100M-key bulk insert in any of its three attempts, because the operating system te |
| report1.md | control | 0/5 | 0/5 | Because the 100M-key comparison used only three runs per store, the gap between Marlin's 312 and StoneDB's 301 |
| report1.md | over-label | 5/5 | 5/5 | StoneDB sustains its mixed-workload throughput over long-running operation. |
| report1.md | over-label | 5/5 | 5/5 | Marlin's own documentation presents it as the right engine for write-intensive systems generally. |
| report2.md | control | 0/5 | 0/5 | The journal contains 212 dated entries, of which 71 concern the weather. |
| report2.md | over-label | 5/5 | 5/5 | Wray kept a continuous day-by-day record of the winter. |
| report2.md | control | 0/5 | 0/5 | The 1911 editor judged that several entries were written up some weeks after the dates they carry. |
| report2.md | control | 0/5 | 0/5 | Wray records wheat at 5 shillings a bushel in November 1741 and at 9 shillings in March 1742. |
| report2.md | control | 0/5 | 0/5 | He also notes that Pell's mill stood idle for eleven weeks while its wheel was held fast in the ice, so the pa |
| report2.md | control | 0/5 | 0/5 | The surviving folios give a single figure for money raised for poor relief: £11 4s from a rate of fourpence in |
| report2.md | distractor | 5/5 | 5/5 | The parish register shows 52 burials in 1742, which is 23 more than in 1741. |
| report2.md | distractor | 5/5 | 5/5 | Of the 29 death entries in the journal, Wray names a fever as the cause in seven. |
| report2.md | over-label | 5/5 | 5/5 | The frost alone accounts for the rise in burials in 1742. |
| report2.md | over-label | 5/5 | 5/5 | Wray's burial entries have been checked against the parish register and found accurate. |
| report2.md | over-label | 5/5 | 5/5 | Wray states that the vicar kept the tithe barn locked against the poor. |
| report2.md | over-label | 5/5 | 5/5 | The journal gives a representative picture of how rural parishes in the county fared that winter. |
| report3.md | control | 0/5 | 0/5 | Of 112 nurses screened, 64 were randomized, 32 to each arm. |
| report3.md | distractor | 5/5 | 5/5 | Of the 48 nurses who were screened but not randomized, most (31) declined to take part. |
| report3.md | control | 0/5 | 0/5 | Eight-week retention was 84.4% in the app arm (27 of 32) and 90.6% in the control arm (29 of 32). |
| report3.md | distractor | 5/5 | 5/5 | Across both arms, 56 of 64 participants (85.9%) completed the week 8 assessment. |
| report3.md | control | 0/5 | 0/5 | Among completers, the Insomnia Severity Index fell by 5.3 points in the app arm and 1.4 points in the control  |
| report3.md | over-label | 5/5 | 5/5 | The reduction in insomnia severity persisted after the program ended. |
| report3.md | over-label | 5/5 | 5/5 | The sleep-restriction module is what drove the improvement. |
| report3.md | control | 0/5 | 0/5 | The sleep-diary estimate of total sleep time was imprecise: the app arm's 16-minute advantage came with a conf |
| report3.md | over-label | 5/5 | 5/5 | Engagement with the program was high. |
| report3.md | control | 0/5 | 0/5 | No serious adverse events were reported, and the two mild events, both transient worsening of sleep in the fir |
| report3.md | over-label | 5/5 | 5/5 | These data show the program is safe for night-shift nurses. |
| report3.md | over-label | 5/5 | 5/5 | The findings apply to shift workers generally. |
| report4.md | control | 0/5 | 0/5 | All four specimens tested at 3.0 kN reached the 2,000,000-cycle runout, and dye-penetrant inspection found no  |
| report4.md | over-label | 5/5 | 5/5 | Below 3.0 kN the bracket has an effectively infinite fatigue life. |
| report4.md | control | 0/5 | 0/5 | No specimens were tested at 3.5 kN, the level named in the requirement, so compliance at that load is not dire |
| report4.md | distractor | 5/5 | 5/5 | One of the four specimens reached the runout and the other three failed, the shortest at 1,138,000 cycles. |
| report4.md | over-label | 5/5 | 5/5 | At 4.0 kN the bracket has a 75 percent chance of failing before two million cycles. |
| report4.md | control | 0/5 | 0/5 | At 5.0 kN all four specimens failed, at between 366,000 and 508,000 cycles. |
| report4.md | distractor | 5/5 | 5/5 | The mean life at 5.0 kN was about 483,000 cycles. |
| report4.md | control | 0/5 | 0/5 | Seven of the eight static specimens showed a permanent set of 0.05 mm or less after loading to 12 kN. |
| report4.md | control | 0/5 | 0/5 | Specimen S08 exceeded the 0.10 mm acceptance limit, with a permanent set of 0.21 mm. |
| report4.md | over-label | 5/5 | 5/5 | The excess set in S08 is explained by its coming from a different material lot. |
| report4.md | over-label | 5/5 | 5/5 | The bracket's performance carries over to the full range of service temperatures. |
| report4.md | over-label | 5/5 | 5/5 | The fatigue programme was run in accordance with ASTM E466. |
