# ReefLoom Design Plan, Revision 2

Owner: simulation core team. Status: approved for implementation. This revision replaces the first draft and pins down the memory layout, the time-stepping contract and the test inventory, so that the three implementation streams can work independently of one another.

## Purpose and scope

ReefLoom is a deterministic, tile-parallel simulator of a single fringing coral reef. Its job is deliberately narrow. Given a bathymetry raster, a sea-surface-temperature series and a storm calendar, it reproduces the trajectory of benthic cover (hard coral, macroalgae, bare substrate) together with the fish assemblage that grazes on it, so that reef managers can compare recovery times after bleaching under different warming assumptions.

It is not a hydrodynamic model, not a fisheries stock-assessment tool and not a colony-level growth model. Where a process is too fine to resolve we use a closure with one or two tunable coefficients, and every coefficient lives in the parameter table below rather than in code.

Goals:

- Bit-for-bit reproducibility for a given seed, regardless of how many worker threads are used.
- A full multi-decade experiment on a laptop-class machine in under a working day.
- A state layout small enough to checkpoint, diff and ship around cheaply.
- A clean seam between the physics kernels and the scenario driver, so scenarios can be scripted without recompiling.


## Domain and discretisation

The reef patch is a regular raster of 512 columns by 256 rows. That is 131,072 cells, deliberately $2^{17}$, so that index arithmetic can use shifts and masks instead of division. Each cell is a square 25 m on a side: small enough to separate a reef crest from its back-reef flat, large enough that a single cell is not dominated by one colony.

### Cell record

Every cell is stored as a fixed 24-byte record: three float32 fields (depth, temperature, nutrient concentration), three float16 fields (coral, macroalgae and sediment cover), one uint16 occupancy mask and a four-byte tail that holds flags and padding. A grid snapshot is therefore 3,145,728 bytes, exactly 3 MiB. The solver double-buffers its state, so the resident working set is 6,291,456 bytes before agents and scratch space are counted.

The occupancy mask says which functional groups are present in a cell. The model defines 12 functional groups, listed below, and they occupy the low bits of the mask; the remaining bits are reserved for later work and must always be written as zero.

| ID | Group | Class | Role in the model |
|---|---|---|---|
| G01 | Branching Acropora | Coral | Fast growth, most bleaching-sensitive |
| G02 | Tabular Acropora | Coral | Shades neighbours, wave-fragile |
| G03 | Massive Porites | Coral | Slow growth, thermally tolerant |
| G04 | Encrusting Montipora | Coral | Pioneer on rubble |
| G05 | Turf algae | Algae | Fast coloniser of dead coral |
| G06 | Fleshy macroalgae | Algae | Main competitor of coral |
| G07 | Crustose coralline algae | Algae | Settlement cue for larvae |
| G08 | Parrotfish | Fish | Herbivore, grazes turf and macroalgae |
| G09 | Groupers and snappers | Fish | Piscivore, regulates small fish |
| G10 | Fusiliers | Fish | Planktivore, nutrient shuttle |
| G11 | Long-spined urchin | Invertebrate | Cell-bound grazer |
| G12 | Crown-of-thorns starfish | Invertebrate | Coral predator, outbreak driver |

G08 to G10 are the fish groups that are handled as agents; the other nine live entirely in the cell record.

### Tiling and parallelism

The raster is cut into tiles of 4,096 cells each, which yields 32 tiles. Tiles are the unit of scheduling: a worker claims a tile, reads a one-cell halo from its neighbours' previous-tick buffer, writes only to its own cells, and releases the tile. Because no tile ever writes into another tile's cells within a tick, the result does not depend on how tiles are assigned to threads, and that property is what makes the bit-for-bit goal achievable. Random numbers come from a per-tile stream seeded from the run seed and the tile index, never from a shared generator.

### Habitat zones

Cells are tagged with a habitat zone at load time, derived from the bathymetry. The zone only selects default coefficients; it never changes the state layout.

| Zone | Mean depth (m) | Wave exposure | Dominant processes |
|---|---|---|---|
| Lagoon | 3.5 | Low | Sediment, macroalgal blooms |
| Back-reef flat | 1.2 | Moderate | Thermal stress, urchin grazing |
| Reef crest | 0.6 | Very high | Wave damage, coralline algae |
| Fore-reef slope | 9.0 | High | Coral growth, fish grazing |

## Initial conditions

Benthic cover at the start of every run is 28% hard coral, 17% macroalgae and 55% bare substrate (turf, rubble and sand), perturbed by a small spatially correlated noise field so that tiles do not start out identical. The coral share is divided among the four coral groups in proportion to a survey-derived weighting stored alongside the bathymetry. After initialisation the model runs a warm-up of 600 ticks with forcing held at its climatological mean, and statistics from that period are discarded.

## Time stepping

One tick is six simulated hours. A simulated year is 1,460 ticks, and the reference experiment covers 50 years, which is 73,000 ticks. Within a tick the order is fixed: forcing update, thermal stress, nutrient and sediment diffusion, benthic growth and competition, agent movement, grazing and predation, then disturbance events. Changing that order changes results and requires a new golden file.

Nutrient and sediment diffusion use an implicit scheme, so the tick length is not limited by the explicit stability bound on cell size. We take a single red-black Gauss-Seidel sweep pair per tick and accept the residual, which has stayed below a relative tolerance of $10^{-4}$ in every configuration tried so far.

## Benthic dynamics

Let $C$ and $A$ be the fractional cover of coral and macroalgae in a cell, and let $K$ be the usable fraction of substrate. Growth is logistic and competitive, with grazing and bleaching mortality as the sinks:

$$\frac{dC}{dt} = r_C\,C\left(1 - \frac{C + A}{K}\right) - \mu_C(\mathrm{DHW})\,C$$

$$\frac{dA}{dt} = r_A\,A\left(1 - \frac{C + A}{K}\right) - g\,F\,A$$

Here $F$ is the local grazing pressure: the biomass-weighted contribution of parrotfish agents in the cell plus the urchin term from the cell record, scaled to the unit interval. We integrate with forward Euler at the tick length. The rates are small enough per tick that this is stable, and the cover update is clamped so that $C + A \le K$ always holds.

## Thermal stress and bleaching

Thermal stress is measured in degree heating weeks, accumulated over a rolling window of daily temperatures that spans the preceding three months:

$$\mathrm{DHW}(t) = \delta^{-1} \sum_{\tau \in W(t)} \max\bigl(0,\; T(\tau) - T_{\mathrm{MMM}} - \theta\bigr)$$

where $T_{\mathrm{MMM}}$ is the maximum monthly mean climatology, $\theta$ is the hotspot offset and $\delta$ converts days to weeks. A bleaching alert is raised when DHW passes $D_{\mathrm{alert}}$. Coral mortality follows a logistic response to accumulated stress:

$$\mu_C(\mathrm{DHW}) = \mu_{\max}\,\sigma\!\left(\frac{\mathrm{DHW} - D_{\mathrm{mid}}}{s}\right)$$

where $\sigma$ is the standard logistic function.

## Larval dispersal and recruitment

Coral larvae are not agents. Each tick, spawning coral cells emit larvae that are redistributed with an exponential kernel $P(d) \propto e^{-d/\lambda}$ over neighbouring cells, where $d$ is the centre-to-centre distance and $\lambda$ is the dispersal length. Recruits settle only on bare substrate, and settlement probability is boosted where crustose coralline algae (G07) is present. Dispersal runs in its own pass with a wider halo and is written as a gather rather than a scatter, which keeps tiles write-isolated.

## Fish agents

Groups G08 to G10 are individual agents so that movement, energy budgets and local crowding can be represented explicitly. Agents live in a fixed pool of $2^{15}$ slots, i.e. 32,768 slots, allocated once at start-up. Each slot holds position, group, energy, age and a private random stream. The pool never grows. A hard cap keeps live agents at or below 75% of the pool, which is 24,576 slots; when the cap is reached, further recruits are rejected and a counter is incremented rather than the pool being resized.

The initial population is 20,000 agents: 9,000 herbivores, 3,000 piscivores and 8,000 planktivores. Each tick an agent takes a step whose length is drawn from an exponential distribution with a mean of 60 m, biased towards cells with more food and fewer predators, pays a metabolic cost, feeds, and may die or reproduce. Adults recruit with probability $p_r$ per tick during the warm season, and background mortality is $m_a$ per tick; both are in the parameter table.

## Disturbance events

Storms arrive as a Poisson process with a mean of 0.8 events per simulated year. A storm picks a track from the calendar and applies damage that falls off with wave exposure; in the most exposed crest cells a storm removes at most 18% of coral cover. Crown-of-thorns outbreaks (G12) are triggered when the local nutrient concentration stays above 0.65 mmol/m³ for a full simulated season. The outbreak then runs as a cell-level predator-prey interaction with no agents involved.

## Parameter defaults

All tunable coefficients, with their current defaults. None of these values is derived from anything else in this plan; they are expected to move during calibration.

| Parameter | Symbol | Default | Unit |
|---|---|---|---|
| Coral intrinsic growth | $r_C$ | 0.0042 | per tick |
| Macroalgal intrinsic growth | $r_A$ | 0.011 | per tick |
| Usable substrate fraction | $K$ | 0.90 | fraction |
| Grazing coefficient | $g$ | 0.35 | per unit pressure per tick |
| Hotspot offset | $\theta$ | 1.0 | °C |
| Bleaching alert level | $D_{\mathrm{alert}}$ | 4.0 | °C-weeks |
| Mortality midpoint | $D_{\mathrm{mid}}$ | 7.5 | °C-weeks |
| Mortality steepness | $s$ | 1.5 | °C-weeks |
| Maximum bleaching mortality | $\mu_{\max}$ | 0.0035 | per tick |
| Larval dispersal length | $\lambda$ | 180 | m |
| Nutrient half-saturation | $N_h$ | 0.12 | mmol/m³ |
| Recruitment probability | $p_r$ | 0.015 | per adult per tick |
| Background agent mortality | $m_a$ | 0.0006 | per tick |

## Experiments and ensembles

The reference study compares six warming scenarios, each driven by the same bathymetry and storm calendar and each repeated with several random seeds:

- Baseline: the observed temperature history repeated without trend.
- Gradual: steady linear warming.
- Moderate: linear warming with a steeper slope after mid-century.
- Rapid: early steep warming that later flattens out.
- Pulse: baseline plus two marine heatwaves.
- Overshoot: warming that peaks and then declines.

Linear trends span 0.02 to 0.08 °C per year across the scenarios; the exact slope for each lives in the scenario file, not in code. The driver writes one checkpoint per simulated year and a compact cover summary per season.

## Interfaces and file formats

Inputs are three files: a bathymetry raster in a plain binary format that matches the cell layout above, a temperature series with one row per day, and a storm calendar in JSON. The scenario driver is a thin script layer that sets parameters, selects input files and decides when to checkpoint; it never touches cell memory directly. Outputs are a checkpoint per simulated year, a seasonal cover summary and an event log. Every output carries the schema version, the seed and the revision of the build, so any result can be traced back to code.


## Testing

Tests are layered. Unit tests cover kernels in isolation with hand-computed expected values; integration scenarios run a short coupled simulation and compare it against golden files. The inventory:

| Layer | Count | Covers |
|---|---|---|
| Unit tests | 40 | Kernels, indexing, mask handling, RNG streams |
| Integration scenarios | 8 | Coupled runs against golden output |
| **Total** | **48** | Everything above |

## Performance and operations

The target is a mean tick time of 45 ms on the reference laptop. Workers are supervised: a watchdog restarts any worker that has not reported progress for 30 s, and structured logs are flushed every 250 ticks, so that a crash loses at most a few seconds of diagnostics. Checkpoints are written atomically (write to a temporary name, flush to disk, rename), compressed with a general-purpose codec, and carry the header described above.

## Risks and open questions

- Forward Euler may need to be replaced if future parameter sets raise the per-tick rates by an order of magnitude.
- The urchin and starfish closures have no calibration data yet, so their outputs should be treated as qualitative.
- Float16 cover fields lose precision near zero. We accept this, but reviewers should confirm that clamping, not rounding, enforces the bounds.
- Larval dispersal as a gather pass may become the bottleneck if the grid is ever enlarged.
