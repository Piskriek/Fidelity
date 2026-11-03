# The roster

Copies of the roster's agent definition files. In the manager's Claude Code setup they live in `.claude/agents/`, and that setup is the source: these copies are made when the manager pushes. Any model can read a file here and play the role.

Each file has a section "Lessons from earlier runs", or gets one when a run teaches something that would change a later run. The manager adds dated lines there, and an agent reads its own file before it starts (`bridge/FRACTAL_ROLES.md`, `bridge/PIPELINE_FRACTAL.md` section 1). That is how an agent that ends with each run keeps growing.

Local paths in these copies were made repository-relative. The `pr/` folder the PR translator writes to is a local folder of the manager and is not published.
