---
name: sq-distortion-check
description: Fidelity's reasoning framework. Use when planning, designing, auditing a document or checking a reply before you send it. A pointer to the canonical SQ_DISTORTION_CHECK_V9_SKILL.md at the plugin root, which holds Document-Audit Mode for documents, Step 0.7, the 3/6/9 check plus the plain check, for plans, designs and replies, and Step 0.8, Creative Mode, for making something new.
---

# SQ Distortion Check (plugin pointer)

This file is a pointer, not the Skill. The canonical Skill is `SQ_DISTORTION_CHECK_V9_SKILL.md` at the root of the Fidelity repository, which is the plugin root:

- In Claude Code: `${CLAUDE_PLUGIN_ROOT}/SQ_DISTORTION_CHECK_V9_SKILL.md`.
- In other agents, such as Codex: `../../SQ_DISTORTION_CHECK_V9_SKILL.md`, relative to this file's folder.

1. Read that file in full. If it is not there, say so and stop. This pointer does not replace it.
2. Apply it: Document-Audit Mode for a plan, spec or handoff document; Step 0.7 (the 3/6/9 check plus the plain check) on plans, designs and replies; Step 0.8 (Creative Mode) when the job is to make something, not to check it.
3. Never force a third (Step 0.7). Where the frame does not fit, say so.
4. Describe fit, not worth: say what fits and what does not, without a verdict on worth. This rule comes from Fidelity's `AGENTS.md` (at the plugin root); the root Skill's Step 0.8 cautions restate it.
5. Some steps run Fidelity's own scripts (`node scripts/...`) or name its Plan and Resume. Those scripts check Fidelity's files, not yours. In another project, do the check by hand where it applies, skip the script, and say what you skipped.

Do not copy the Skill's content here. Edit the root file; this pointer stays valid. Its twin for work inside the repository is `.claude/skills/sq-distortion-check/SKILL.md`; change the steps they share in both together.
