# O3: Bridge check, the chain to the owner (opposer, round 2026-11-04-bridges)

Snapshot: branch `francois/serene-euler-51wj3e` at `dbdccb1` (04:51:35Z), pushed (`origin/francois/serene-euler-51wj3e` is the same commit). Read-only: git log, branch and rev-list queries, `git show` of refs. Nothing run, nothing installed, no network. The HeavyMetal2 repo (hm:universe:v2, PLAN_FRACTAL.md) is not in this checkout, and nothing here is said about it. The live `laptop_tasks.json` and `laptop_results.json` sit on Node 2 (`F:\fidelity-llm\bridge\hands\`, LAPTOP-HANDS.md:5-12) and are not readable from this checkout; only the 04:22Z snapshot is.

## Thesis

The repo side of the chain is real: the code is committed, pushed and reported to pass headless tests, and the hands protocol has sane guards. The chain breaks at the laptop end, in three places that compound. First, the one task that would deploy the current build (H005) points at a branch that does not contain it, so its own version gate must block (laptop_tasks.json:11-15). Second, the build the owner has seen was deployed by a different path, from the feature branch, that no task records (RESUME.md:39-45). Third, no result from the laptop has ever come back into the repo, and no probe output has been pasted, so nothing landed here is verified on the owner's screen. The narrower claim the evidence supports is: the commits are pushed; their effect in the client is unverified. The brief's stronger wording ("nothing landed here is verified") goes one step past what the repo shows, because the headless runs are reported (RESUME.md:37, "Headless 54/54") even though the repo does not let us re-run them here.

## Ranked attacks (most blocking first)

**1. H005 cannot succeed as written. It points at a branch seven commits short of the build.** `origin/claude/ematrix-depth` is `7265578`, and its `FidelityEMatrix.toc` reads `## Version: 1.6.1` (`git show origin/claude/ematrix-depth:FidelityEMatrix/FidelityEMatrix.toc`, line 5). The v1.7.0 commit `27a5bbb` is not an ancestor of that branch or of `origin/main` (checked with `merge-base --is-ancestor`). H005's step 2 is a fast-forward to that ref (laptop_tasks.json:14), and step 3 stops with `blocked_on "director: merge the v1.7.0 PR"` if the toc still says 1.6.1 (laptop_tasks.json:15). So the task is designed to block. Counts: `origin/claude/ematrix-depth` is 7 commits behind HEAD (`0 7`), and `origin/main` is 33 behind (`0 33`). Whose: the PR merge is the owner's to approve; the retarget of H005 is ours. Check: `git merge-base --is-ancestor 27a5bbb origin/claude/ematrix-depth` (currently not an ancestor). Also the open PR itself is not checkable from here (no `gh`, no network): "needs verification with `gh pr list`".

**2. Two deploy paths contradict each other, and the one that reached the owner is not in any task.** RESUME.md:39-45 deploys by `git checkout francois/serene-euler-51wj3e` and robocopy from the repo's `FidelityEMatrix` folder, with no version gate. H005 (laptop_tasks.json:14, 37) and the hands doc build on `claude/ematrix-depth` and ff-only merges. The owner's report in `docs/council/2026-11-04/LANDED.md:11` says "v1.7.1 in the game", which matches the RESUME path, not H005. Nothing in the hands files records that deploy. Whose: ours (one instruction, one ref). Check: H005's result, when it comes back, must name the commit and the toc version it actually copied.

**3. No laptop result has ever reached the repo, and the probe is unpasted.** `bridge/hands/` holds no `laptop_results.json` (`ls bridge/hands/`); the repo copy of the tasks is a snapshot, "not live" (LAPTOP-HANDS.md:18). `docs/council/2026-11-04/LANDED.md:11` records that "the probe output is still not pasted", and both LANDED files stay `pending` (`docs/council/2026-11-04/LANDED.md:9`; `docs/council/2026-11-04-entity/LANDED.md:9`). Needs in-game verification: whether any of the three client-side claims hold (copies textured, the terrain probe, parallax). Whose: the owner's paste and Flash's run. Ours: a landing template that asks for the commit and toc version first. Check: `laptop_results.json` on Node 2 with `updated_at` and each result's `finished_at` (LAPTOP-HANDS.md:122).

**4. The Triad side runs a legacy copy.** `triad.bat:2` runs `D:\fidelity-llm\bridge\loop\triad_cli.mjs`, not the packages copy. `docs/RESUME.md` T1 (line 25, 34) records Apex flow integrity 2/3 on the laptop, and H001 (laptop_tasks.json:81-86) asks to restart from "the updated checkout" without naming the package path. This is the holon's chain, not the EMatrix one, but it is the same owner-facing claim ("holon verified"). Whose: the laptop's restart is the owner's; the rewrite of H001 is ours. Check: H007 step 2 (laptop_tasks.json:62) names which copy each `node.exe` runs. H007 has no result in the repo.

**5. The arena sync risk is still unknown.** The round-1 steer forbids merging into `main` by hand until H007 reports (`docs/council/2026-11-04/STEER.md`, "Forbidden until verified"). `origin/main` contains none of the EMatrix work (`origin/main..origin/claude/ematrix-depth` is 26 commits). H007 is priority 1 (laptop_tasks.json:58) and has no result. Whose: the laptop's inventory is Flash's; the decision to stop the push is the owner's. Check: H007's `node.exe` table and `arena_git_sync.mjs` in it or not.

**6. The definition is not signed, so no bound entity can land.** `docs/council/2026-11-04-entity/STEER.md` §2 is "flagged for the owner's sign-off"; the wave-1 split assigns the binding schema (`ns.BindCell`) to Opus only after sign-off. The Triad-to-WoW channel does not exist: "There is no channel from the holon into the WoW addon today" (entity STEER §1). Whose: the owner signs; the channel is ours to build. Check: the owner's word in the entity LANDED.md.

**7. Hands channel is one file, one direction, one checkout per name.** The results go back over SSH as `laptop_results.json` (LAPTOP-HANDS.md:7, 13), and the laptop holds two checkouts with different roles: `D:\fidelity-repo` (the repo, H005 steps) and `D:\fidelity-llm\bridge` (the bridge root, LAPTOP-HANDS.md:20). A task can therefore succeed in one and not the other with no error. Whose: ours (the task should name one). Check: the H005 report's hash count of 15 files in both trees.

## Salvageable, and the minimal honest version

Salvageable: the hands protocol's guards (never reset or force, ff-only, backup before copy, no reboot, LAPTOP-HANDS replay rule, the H005 backup and hash steps); the secret masking in `hands_sync.mjs`; the honest `pending` and `blocked_on` fields; the commit history, which lets any landing be pinned by hash. The code claims in RESUME (v1.7.1 "Headless 54/54"; v1.7.3 "math 12/12, headless 56/56") are repo-side claims that this round did not re-run.

Minimal honest version of one landing, end to end (EMatrix v1.7.3, the flip clock, which is the one the council wants seen):

1. Ours: retarget H005 at `dbdccb1` (or `78e3107`), gate on `## Version: 1.7.3`, and record the commit in the report. Write it with `bridge/hands/upsert_task.mjs`, not a heredoc (laptop_tasks.json:5 note). New `requested_at`.
2. Owner or Flash: run that H005 on the laptop; the report must show the toc version, the short hash, the robocopy summary and 15 matching SHA-256 hashes.
3. Owner: `/reload`, then paste the login line and `/fide diag` verbatim (the hash in step 2 is the only link between the paste and the code).
4. Director: read `laptop_results.json` on Node 2 and file the paste into `docs/council/2026-11-04-entity/LANDED.md`, with the age of the file and the hash.

Landed means: hash-equal copy, pasted login line, and a flip seen on the box (entity STEER §"The check that settles it", item 2). Everything else (the holon, H007, H006's driver) stays separate and pending.

## Concessions

- The thesis overreaches on the repo: the commits are pushed and the claims are reported. What is unverified is the client.
- H005's gate worked: it blocks instead of deploying 1.6.1.
- Whether the PR into `claude/ematrix-depth` is open, and whether H005 ran on the laptop at 20:18Z before the snapshot, cannot be decided from here. Both are "needs verification".
- The client claims (textures, animation, parallax, the terrain overlay) are "needs in-game verification"; the owner's screenshot evidence (LANDED.md:11) is a report, not a paste.

## Closing table

| # | Break | Evidence | Whose to fix | Blocks | Check that settles it |
| :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | H005 points at a 1.6.1 branch | laptop_tasks.json:11-15; ematrix-depth toc 1.6.1 | Owner (PR); ours (retarget) | every laptop deploy via H005 | `merge-base --is-ancestor 27a5bbb origin/claude/ematrix-depth` |
| 2 | Two deploy paths; the used one is untasked | RESUME.md:39-45; laptop_tasks.json:14, 37 | Ours | the record of what runs | H005 report names commit and toc |
| 3 | No laptop result in repo; probe unpasted | `bridge/hands/` listing; docs/council/2026-11-04/LANDED.md:11 | Owner (paste), Flash (run) | all in-game claims | `laptop_results.json` `updated_at`, `finished_at` |
| 4 | Triad runs legacy `bridge/loop` | triad.bat:2; docs/RESUME.md:25, 34 | Owner (restart); ours (H001 text) | the holon's "verified" line | H007 step 2 |
| 5 | Arena push to main unknown | docs/council/2026-11-04/STEER.md "Forbidden"; laptop_tasks.json:58-75 | Flash (inventory), owner (decision) | any merge to main | H007 `node.exe` table |
| 6 | Definition unsigned; no holon-to-WoW channel | docs/council/2026-11-04-entity/STEER.md §1-2 | Owner (sign); ours (channel) | every bound cell | owner's word in entity LANDED.md |
| 7 | Two laptop checkouts, one task | LAPTOP-HANDS.md:16, 20; laptop_tasks.json:13 | Ours | silent partial success | SHA-256 counts in both trees |
