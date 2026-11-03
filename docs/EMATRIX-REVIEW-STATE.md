# EMatrix review, state at cut-off (2026-11-03, Node 2 session hit its usage limit)

The owner asked for the Fidelity harness to be run over the EMatrix system by several agents, each
defending a hostile thesis, to get a more accurate and efficient system. Six read-only reviewers
were launched; four reported before the session's usage limit, two were still running.

## Reports received (findings transcribed, structured, in the session scratchpad)
- `review/findings-part1.json`: head tracker (HT1-19), owner experience and safety (OX1-24),
  terrain overlay (TR1-13).
- `review/findings-part2.json`: world overlay (WO1-13).
  Scratchpad: `C:\Users\RAMPAGE\AppData\Local\Temp\claude\E--Repos-CapitalEmpire\7b1077c5-ab60-44d8-8fa9-88ec569315fe\scratchpad\review\`.
  If the scratchpad is gone, the full reports are the last message of each reviewer's transcript
  under `...\7b1077c5-ab60-44d8-8fa9-88ec569315fe\tasks\<agentId>.output` (large JSONL files).

## Still running at cut-off (their hand-back goes to the same tasks folder)
- performance and memory review (a37f762d7bfc08e56)
- the C1-C15 crawl over all code (a3aa3e9165dd364f1)

## Already fixed from the reviews
- Laptop task file: H005 steps had form feeds and tabs where backslashes belonged (a shell heredoc
  halved `\\` and JavaScript read `\f` and `\t`). Rewritten clean with backup, hash check, one
  version; H006 driver step gained hash, signature subject, exit code, service check, no reboot by
  the agent; replay rule in the file note (commit b7f4ee1). Never write task files through a shell
  heredoc again: use a script file.

## Findings the lead already agrees with on reading (verify against the code, then fix, in this order)
1. Terrain loader caches a failed load and never retries (TR1); failed slots keep their last picture (TR5);
   only one tile scanned (TR6); nearest-24 cut before view culling (TR4); far props drawn over near (TR8);
   hPx unbounded near the camera (TR10); /fide terrain head is a dead knob and the nameplate-solve claims
   are stale (TR9, OX6); WMOs sent to Model frames (TR7).
2. World overlay: copies spin with the window turntable (WO1); far band can never fire because
   CheckInteractDistance returns nil out of range (WO3); error stop is saved to config and never resets
   (WO6); no hysteresis at band edges (WO7); ghost on SetUnit failure (WO9); per-frame anchor churn (WO11);
   delete CenterInUI (WO13).
3. Head tracking: depth z never reaches a renderer (HT2); trigger rests at 0.5 (HT1); head.json write can
   kill the feed (HT5); lost-face settles at -calX (HT6); second face hijack (HT7); probe hides state (HT9);
   no vertical invert (HT10); leftstick choice (HT4); frames-dir sentinel (HT15).
4. Owner experience: login line from runtime state with counts, pcall the load path (OX4); typos must not
   change saved state (OX8); short help (OX14, OX15); check list vs hidden box (OX3); load only the
   client family's data via LoadOnDemand addons (OX21); Family() 'unsupported' outside 1.x/2.x (OX23);
   migration must not override choices (OX24).
5. Hands protocol: dedupe push failures and add a heartbeat (OX11); redact tokens before the push (OX12);
   guards on every repo step, forbid reset/clean/checkout -f (OX13); propose key restriction to the owner (OX10).

## Planned next step (ultracode was on)
A Workflow: extract/dedupe all findings (including the two late reports), adversarially verify each
with two lenses (is the code really like that; does it matter on the client), then implement the
confirmed fixes grouped by file, re-run `npm test`, bump to v1.7.0, push, and update the laptop task.

## Unchanged facts
- Branch `claude/ematrix-depth` is at b7f4ee1 (addon v1.6.1). Laptop tasks H005 (deploy) and H006
  (head tracking) are live on Node 2; Flash executes them; owner runs the in-game probes.
- Nothing is verified in the game beyond: the box renders the character, nameplates cannot be measured.
