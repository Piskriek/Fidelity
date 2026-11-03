# The PR loop (2026-11-02)

The owner's rule, applied to outside agents: "there is always someone above you to check you". Outside agents (Codex, Flash, Argon) work on their own branches and open pull requests; a free check runs on every push, an agent reads each new PR once, and the manager decides. A design choice, from the owner's request; not yet run on a real PR.

```
  OUTSIDE AGENT (Codex, Flash, Argon)
  own branch  codex/<task> | argon/<task>   ->   PR into opus/night-1-skill-benchmark
  the PR description carries a shape-B report
        |
        v
  +----------------------------------------------------------------+
  | LAYER 1   GitHub Action, free, on every push and PR            |
  |   privacy scan  .  report shape  .  the 7 gates                |
  |   warning when the PR edits the checkers, the manager's files, |
  |   or locked engine files                                       |
  +----------------------------------------------------------------+
        |   red or green on the PR; approves nothing
        v
  +----------------------------------------------------------------+
  | LAYER 2   scheduled Claude task                                |
  |   poll -- nothing new --> stop (almost free)                   |
  |   prepare -> claim-reader -> engine-auditor (bridge code only) |
  |   post: ONE review comment + ONE landed note to the author     |
  |         + lessons appended to a local file                     |
  +----------------------------------------------------------------+
        |   comment only: never approves, never merges
        v
  +----------------------------------------------------------------+
  | MANAGER   reads the PR and the review, merges or does not,     |
  |   onto opus/night-1-skill-benchmark. Nobody merges PR #1.      |
  +----------------------------------------------------------------+
        |
        +--> LANDED to the author          +--> lessons into bridge/roster/
```

## What runs where

| Piece | File | Cost |
|---|---|---|
| Layer 1 checks | `.github/workflows/outside-agent-checks.yml`, with `bridge/tools/privacy_scan.mjs`, `check_report_shape.mjs`, `classify_paths.mjs` | CI minutes only |
| The 7 gates | on a PR: `triad-gates.yml` (it runs on every pull_request); on a push to `codex/**` or `argon/**`: the `gates` job in the new workflow | CI minutes only |
| Layer 2 script | `bridge/tools/review_prs.mjs`: `poll`, `prepare <pr>`, `post <pr> --result <file>`, `status` | no model; `poll` is one `gh pr list` |
| Layer 2 prompt | `bridge/tools/REVIEW_LOOP_PROMPT.md`, read only when `poll` found something | a model, only for a new commit of a PR |
| Tests | `node bridge/tools/test_pr_checks.mjs` (checkers, the `gh` allow-list, and Layer 2 end to end against a throwaway git origin and a stub for `gh`) | none |

Private state stays outside the repository, in `~/.fidelity-pr-loop` (or `PR_LOOP_HOME`): `state.json` (which commit of which PR was reviewed), `work/` (what the readers get), and `LESSONS_FOR_ROSTER.md`, which the manager reads and folds into `bridge/roster/` (the unit's way back, `bridge/PIPELINE_FRACTAL.md` section 1).

## Rules the code holds

- **Comment only.** Every `gh` call goes through an allow-list: list, view, diff, `review --comment`, `comment`. Approve, request changes, merge, close and edit are refused, and so is PR #1 (tests cover these).
- **No PR code is run.** Layer 2 reads files fetched into a work folder; the engine auditor works statically and says "not run" for tests and the mutant suite, which the manager runs in a sandbox.
- **A PR cannot rewrite the checker that judges it.** The workflow uses the checkers on the base branch whenever it has them, and warns when a PR edits the checkers, the workflows, the triad, `AGENTS.md`, the roster or locked engine files.
- **The privacy scan reads every commit's added lines, file names and the PR text**, and prints only file, line, rule and a masked excerpt. A hit in an earlier commit is already public, so the fix is a rewritten branch (and a rotated key, if it was one). A scan is a net, not proof.
- **Posts are checked first.** The review and the landed note are scanned for private strings, stray `@` mentions are wrapped in code marks, and nothing is posted if the PR got new commits since `prepare`.
- **One review per commit.** The loop remembers the commit it reviewed; a new commit brings the PR back. Drafts are skipped.

## To switch it on (the manager)

1. Scan, commit and push the new files to `opus/night-1-skill-benchmark`. Until the checkers are on that branch, the workflow falls back to the copies on the PR's own branch (it says so).
2. Run `node bridge/tools/test_pr_checks.mjs`.
3. Create the scheduled task from the repository root, with this text, so an empty run is one command and one line:
   > Run `node bridge/tools/review_prs.mjs poll`. If it prints NOTHING_NEW, answer "No new PRs." and stop. Otherwise read `bridge/tools/REVIEW_LOOP_PROMPT.md` and follow it.

   It needs: `gh` signed in with `repo` scope, permission to run `node bridge/tools/review_prs.mjs *`, to read the work folder and write `result.json` there, and to start the `claim-reader` and `engine-auditor` agents (their files are in `bridge/roster/`).
4. A run with no model at all: have the machine's own scheduler run `node bridge/tools/review_prs.mjs poll --exit-code`, and start the Claude task only when it exits with 10.

## Limits

- Layer 1 is tested by simulation only: the YAML parses, the shell steps ran against a throwaway repo, and the scripts are tested. No Actions run has happened yet, and the real `gh pr review` and `gh pr comment` calls have not been made (there was no PR to post on).
- On a same-repository `pull_request` GitHub runs the workflow file from the PR's own merge commit, so a PR can edit the workflow. The base-branch checkers and the warning make that visible; the manager's reading is the check that cannot be edited.
- What actually stops an outside agent pushing to the shared branch is a branch protection rule on it (GitHub settings), which is the owner's to set. This loop does not set it.
- A push to a branch that already has a PR runs the checks twice (push and pull_request) with the same answer.
- The claim-reader is a Haiku-class reader and reads the description and the lines the PR adds to prose files, capped in size; the review says when its input was cut.
- Flash is read-only in `bridge/FRACTAL_ROLES.md`, so `flash/` branches are not watched. To add a prefix: `--prefixes codex/,argon/,flash/` for the script and one line in the workflow's `push.branches`.
