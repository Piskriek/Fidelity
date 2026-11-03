<!-- Arm A, Claude Haiku 5.5 with the Skill. Verbatim except that the local path to the Skill file was shortened to its name. -->

## Toroid free-energy plan: assessment

**Verdict.** As described, the device cannot supply net power, and nothing in the plan is measured. There is no rollout to plan yet. Plasma toroids are real, but they consume power. A bench test can settle the question cheaply, and I describe one below.

**Method.** I read `SQ_DISTORTION_CHECK_V9_SKILL.md` in full and applied its Document-Audit Mode to the proposal as a prose plan. I used no web and wrote no files. The repo scripts (`formula_spine`, `fractal_gap_map`) were not run because they read plan files from the repo, and the proposal has no formulas or point cloud. Physics figures below are recalled and were not checked against a source in this session.

**Document-Audit checks**

| Step | Result |
|---|---|
| 0 Purpose (`why=`) | "Supplies more energy than it takes in." Specific enough to fail. No metering is specified, so it is untested. **Finding (High)** |
| 1 Recount, 2 Sum | N/A, no counts or weight sets |
| 3 Units | "Draws power" has no quantity or unit, so it cannot be tested as written. **Finding (Medium)** |
| 4 Positivity probe | At zero input, energy cannot come out. A static field stores energy (B²/2μ0 is about 4×10^5 J/m³ at 1 T) but does not refill itself. The plan names no source term. **Finding (High)** |
| 5 Breakers, C5 passivity | Q = P_out / P_in is undefined when input is counted as zero. Every input must be counted: coil drive, heating, pumps, cooling, controls. **Finding (High)** |
| 6, 8, 11 | N/A, no examples, thresholds or shared constants |
| 7 Budgets | World primary energy is about 20 TW (recalled). At 1 MW per unit, that is about 20 million continuously running units. Not budgeted. **Finding (Medium)** |
| 9 Seams | Hot plasma to grid electricity: no conversion stage is named. **Finding (Medium)** |
| 10 Homes and order | Planetary rollout is listed before one metered unit exists. **Finding (High)** |
| 12 Evidence, C29 | UFO craft, government secrecy, zero-point modules and kundalini have no reproducible source. **UNSUPPORTED (High)** |
| 13, 14 | Formula spine not run (see Method). Gap map N/A. |
| 15 Claim strength | See ledger. |

First-pass findings: 8 (5 High, 3 Medium).

**Claim-strength ledger (C35)**

- Tokamaks and spheromaks are real toroidal plasma configurations, and Taylor relaxation (J. B. Taylor, 1974) describes how plasmas self-organize. *Inference from recalled literature; not checked against a source.*
- Zero-point energy cannot be pulled out as net work in a cycle, because the vacuum is the ground state. *Inference from standard QFT. Casimir forces are measured; I know of no measured net-work extraction.*
- A real route exists: electrodynamic tethers draw power from Earth's magnetic field, but only by taking energy from orbital motion. *Recalled; not checked.*
- Sunlight intercepted by Earth is about 9,000 times world primary energy use. *Arithmetic on recalled values (1361 W/m², about 20 TW).*
- NIF reached target gain just above 1 in December 2022, with wall-plug input far larger. *Recalled; not checked.*
- AARO's 2024 historical review reported no evidence of extraterrestrial technology in the cases it covered. *Recalled; not checked.*
- "UFOs fly this way," "governments keep it secret," and "draws power from the field" have no measurement or source. *Unsupported claims.*

**If the claim is worth testing, this is the cheapest falsification**

1. Build one unit and meter every input at the wall (coil drive, heating, pumps, controls, cooling, standby) with calibrated instruments.
2. Measure output into a resistive load by calorimetry (water temperature rise), not only voltage.
3. Run to steady state for at least an hour, and check with the output load disconnected to rule out self-heating.
4. Write the threshold down before the run: sustained output greater than total metered input.
5. Repeat at a second lab, blinded to the expected result where possible.

A pass is the evidence that would justify scaling. A fail costs one bench unit.

**Realistic power for the planet:** solar PV and wind with storage and transmission, efficiency, and existing nuclear fission. Magnetic-confinement fusion (tokamaks, ITER) is the real descendant of the toroid idea. It is still a net power consumer (recalled), and it is a decades-long program, not a rollout.

**Non-physics parts.** UFO and secrecy claims are not evidence for the energy mechanism. Skepticism here is the test, not a dismissal. Fractal nesting, the Logos, Stargate's ZPM and kundalini are not measurable energy sources, so they cannot enter the energy accounting. I treated them as framing only and did not consult the Law of One guide, since this question is an energy-engineering one.

**Convergence.** First pass, one lens, so not converged. ΔBugs has no earlier pass to compare against. Not executable on prose: C1, C2, C10, C13, C14, C16, C18, the C24 fuzz part, the C25 rollout part, and C26 benchmarks.
