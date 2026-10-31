# Counter-rotating vortex to toroid: sources, testable hypotheses, and a gateway design

Prepared 2026-10-31 for Piskriek (Fidelity). Author: Claude (Sonnet 5.5), bench C sub-agent.
Scope: the owner's mechanism ("the kundalini, but outside the body ... a vortex inside a vortex spinning the other way, spheroids fold in on themselves and form donut shapes"), for (a) the simulation's energy model and (b) the real world.

*Committed copy (Pass R34): local paths were replaced, §1B and one file list were withheld, and the downloaded PDF and its extractor are not committed. Text otherwise unchanged.*

## 0. Short version, and how to read the labels

The shape you describe (a core flow, a counter-flow, and the whole thing closing on itself into a donut) is a real and recurring pattern in physics: vortex rings, Taylor-Couette cells, spheromaks, counter-helicity plasmoid merging. I keep your framing as the design intent and test the mechanics, not the belief. In every well-measured case I found, counter-rotation is a way of *converting* energy that was put in (or stored) into another form. Net energy from the vacuum is not established. Nothing I read changes that, and nothing I ran contradicts it. Whether a gateway exists in your reality is outside what a bench test can say; whether the simulation can have one is a design choice (section 5).

Claim-strength labels used everywhere:

| Label | Meaning |
|---|---|
| MEASURED | Reproducible lab or textbook-level result in the standard literature |
| PUBLISHED | Peer-reviewed, but one group or limited replication |
| CONTESTED | Published or patented, but replication failed, disputed, or I found no independent test |
| HYPOTHESIS | The owner's, Bendall's, Shoulders's, or mine; no test yet |
| MODEL | A result from the numerical experiment I ran (in-sample, my parameter choices, two grids) |
| DESIGN | A proposal for the simulation; the owner's call |
| [RA] | Paraphrase of the Law of One text via lawofone.info (fetched and summarised; NOT script-checked against the session text) |

Method notes, so you can weigh this: I could not open your Drive folder. For public copies I used WebSearch/WebFetch. The PNAS paper's HTML (PMC) and the PNAS site were blocked, so I took the open-access PDF from the Caltech repository and extracted its text with a small Node script (crude extraction: most of the main text, not the supplement). Disclosure: that PDF (1.8 MB, Caltech open-access, no login) was saved to a local scratch folder (not committed); I did this with curl without asking first, and the fetch tool also saved its own copy. Nothing else was downloaded. This document has not had a fresh-reader claim-strength pass; given the project's own experience that authors over-label, please run one.

## 1. Sources picked

### 1A. What I could read publicly, and what I took from it

| Source | URL | Read how much | What I took |
|---|---|---|---|
| Gharib, Mendoza, Rosenfeld, Beizai, Alves Pereira, PNAS 114(48):12657 (2017) | https://doi.org/10.1073/pnas.1712717114 ; open copy https://authors.library.caltech.edu/records/bhfqv-vsf77 | Most of main text (PDF text extraction); not the SI | Numbers for a real hydrodynamically produced toroidal plasma (section 2, E7) |
| Taylor, Rev. Mod. Phys. 58:741 (1986), "Relaxation and magnetic reconnection in plasmas" | https://doi.org/10.1103/RevModPhys.58.741 | Abstract-level only (paywalled) | Taylor relaxation statement |
| Taylor state (variational statement, force-free condition) | https://en.wikipedia.org/wiki/Taylor_state | Fully | W = integral B^2/2mu0, K = integral A.B, curl B = lambda B |
| Ji, Prager, Sarff 1995 (MST reversed-field pinch) | via search snippet only | Snippet | Energy fell more than helicity during a sawtooth crash: modest support for helicity-conserving relaxation. Also a 2015 study argues helicity alone does not fix the end state. |
| Counter-helicity spheromak merging: Watanabe, Sato, Hayashi 1996 | https://nifs-repository.repo.nii.ac.jp/records/10401 | Abstract-level | Counter-helicity merging leaves an FRC; co-helicity leaves a larger spheromak |
| Ono et al., TS-3/TS-4 merging (IAEA poster) | https://conferences.iaea.org/event/98/contributions/12144 | Abstract-level | Reconnection heating of ions at MW class; scales as B_rec squared |
| Plasmoid (definition, Bostick origin) | https://en.wikipedia.org/wiki/Plasmoid | Fully | Compact toroids are the lab plasmoids; fission/spin/galaxy claims are speculative |
| Bostick, Nature 179:214 (1957) | https://www.nature.com/articles/179214a0 | Abstract-level | Plasma-gun plasmoids at up to ~1e7 cm/s |
| Skeptoid #1019, "Testing the Thunderstorm Generator" | https://skeptoid.com/episodes/1019 | Fully | A desk analysis of the design (not a bench test): chamber is a heat exchanger; small real gains plausible; no independent test cited |
| US patent 5,018,180 (Shoulders) | https://patents.google.com/patent/US5018180A/en | Description, first 100k of 402k characters; claims NOT read | How EVs are made; typical stated sizes and charges; no input/output energy figures seen in what I read |
| Fleischmann-Pons DOE reviews | secondary summaries only | Summaries | Use as a methodology precedent for protocol B (not as mechanism) |
| Andereck, Liu, Swinney, JFM 164:155 (1986) | https://doi.org/10.1017/S0022112086002513 | Snippet | Regime map of counter-rotating Taylor-Couette flow (spirals, Taylor vortices) |
| Law of One 27.5 and 29.27-29.30 | https://www.lawofone.info/s/27 , https://www.lawofone.info/s/29 | Fetched, summarised by the fetch tool | [RA] paraphrases used in section 5; please script-check before relying on them |

### 1B. Your Drive folder

*Withheld from the public copy (Pass R34): this section ranked the files in the owner's Drive folder. It stays local until the owner says it may be published.*

## 2. What is established, what is published but contested, and what is hypothesis

| # | Claim | Strength | Source / note |
|---|---|---|---|
| E1 | Coaxial counter-rotating flow has a centrifugally unstable layer (Rayleigh: the circulation Gamma = r*v must not decrease outward, so circulation going from + to - guarantees an unstable band), and real counter-rotating Taylor-Couette flow forms stacked toroidal cells and spirals | MEASURED (textbook; Rayleigh 1917, Taylor 1923, Andereck et al. 1986) | The energy comes from the cylinder drives (wall torque); the cells are a *way the driven flow dissipates*, not a source |
| E2 | A vortex ring is a closed toroidal vortex with conserved impulse P = rho*Gamma*pi*R^2 and (inviscid) energy E ~ (1/2)*rho*Gamma^2*R*[ln(8R/a) - 7/4] for a thin uniform core. Coefficient: verify against Lamb s.163 / Saffman; my search confirmed the 7/4 for a solid core only through a secondary source | MEASURED (textbook) | Rings are made by pushing fluid (energy in); viscosity dissipates them |
| E3 | Taylor relaxation: in a weakly resistive plasma magnetic helicity K decays much more slowly than energy W, so the plasma settles into the minimum-energy state at fixed K, a force-free field curl B = lambda B | PUBLISHED and tested (Taylor 1974/1986; Ji-Prager-Sarff 1995 supports it in a reversed-field pinch) | Limits: helicity alone does not always fix the end state (2015 study); zero-beta idealisation |
| E4 | A spheromak is a compact toroid with both toroidal and poloidal field, formed by this relaxation; made in the lab for decades | MEASURED | Literature: Jarboe 1994 review, Bellan's "Spheromaks" (not read here). In 3D, spheromaks in short cylinders are tilt-unstable (critical elongation about 1.67 from my memory; check) |
| E5 | Merging two spheromaks of opposite helicity (counter-rotating toroids) causes reconnection, strong ion heating and an FRC; same-helicity merging gives one larger spheromak | PUBLISHED (Ono group, TS-3/TS-4; Watanabe et al. 1996 simulation) | Energy source is the stored magnetic energy and the coil drive; losses reported under 10% in one poster. Not a source of net energy |
| E6 | Bostick (1956-58): a plasma gun fires toroidal "plasma-magnetic entities"; the term plasmoid | PUBLISHED, historical. Fission, spin and galaxy-simulation claims: HYPOTHESIS | Compact toroids are now an established category |
| E7 | Gharib et al. 2017: an 85 micrometre deionised-water jet at roughly 100-300 m/s onto quartz or LiNbO3 makes a luminous ring-shaped (toroidal) plasma in air, with no applied field. Reported (air): Tg 1000-1500 K, Te about 2.6 eV, ne about 1.6e17 cm^-3 (5.4% ionised), E about 1e6 V/m, RF lines 3-40 MHz (6.8 MHz spacing on LiNbO3 only). CFD: strain rate about 5e8 1/s, wall shear about 0.5 MPa. A +/-50 kV applied potential did not disrupt it | PUBLISHED (one group, Caltech/CNR; peer-reviewed PNAS) | The *mechanism* (tribo-electric electron source) is argued from spectroscopy and chemistry. The *toroidal self-confinement* is a conjecture ("possibly", "plausible"). I found no energy-balance or net-energy claim in the text I read. My arithmetic from the quoted d = 85 micrometres and v = 255 m/s: flow 1.45 mL/s, jet kinetic power about 47 W, stagnation pressure about 32 MPa. So a driven, dissipative structure |
| C1 | Shoulders's EVs/EVOs: 1e8-1e11-electron clusters of about 1 micrometre, made at a pulsed field-emission tip, "energy conversion using high charge density" (US 5,018,180) | CONTESTED (patents and own reports; I found no independent replication or mainstream critique, which is itself informative) | Shoulders was a real pioneer of vacuum microelectronics (biographies agree); the EVO energy claims are separate and unreplicated as far as I can find |
| C2 | "Electric charge non-conservation", "a leak from our universe to another" (Shoulders 2006) | HYPOTHESIS (extraordinary claim; need the Drive files) | |
| C3 | Fleischmann-Pons 1989 excess heat and later LENR claims | CONTESTED. The 1989 DOE panel was unconvinced; the 2004 DOE panel was reportedly split on whether excess power was real and mostly unconvinced on nuclear origin (secondary summaries and proponent slides; I did not read the panel reports, and vote counts are unverified) | A methodology precedent: calorimetry artefacts, unmetered inputs, chemical storage |
| C4 | Bendall's Thunderstorm Generator and Plasmoid Unification Model (nuclear energy from protium, "self-charging atomic batteries", fuel savings) | HYPOTHESIS / CONTESTED. No independent bench test found; one unverified report of an emissions test by a UK firm under NDA. Skeptoid's design analysis calls the "plasmoid generator" a heat exchanger and expects only small real gains | |
| C5 | Schauberger-style "implosion" vortex energy | HYPOTHESIS; no replicated measurement known to me | |
| H1 | Owner: "kundalini outside the body" as a toroidal flow structure | HYPOTHESIS and metaphor. As physics, the shared *topology* is real: a central channel plus a surrounding return flow closing into a torus is exactly the poloidal circulation of a vortex ring or spheromak. Where it parts from the physical picture: the physical circulation is driven and decays | I do not test the body claim |
| H2 | Owner: magnetic fields make a vortex inside a vortex spinning the other way; spheroids fold into donuts | Split into three: (a) a counter-rotating nested structure can be formed (MEASURED in E1, E5); (b) generic configurations fold into toroids (E3/E4, and MODEL below); (c) the folding yields *net* usable energy (NOT established; this is Hypothesis B) | |
| H3 | Net energy from the vacuum ("ZPM", the Stargate zero-point module) | NOT established. The ZPM is a fictional device (Stargate Atlantis). The Casimir force is a measured vacuum effect, but no device is known that extracts net work from it, and the vacuum is the lowest-energy state | Said kindly: a lovely engineering dream, and a good game mechanic; it needs to be declared as a source, not hidden in a loop |
| R1 | "Tapping the potential yields work" (27.5); balance threshold, charged object, gateway to intelligent infinity (29.27-29.30) | [RA] design source, not a physics claim | Summary of what the fetch returned: 27.5, unity has a potential and a kinetic aspect, the potential is intelligent infinity, drawing on it yields work, and the kind of work depends on how free will is distorted. 29.27: a balance level in mind/body/spirit is required, fixed in level though the difficulties differ per entity. 29.28: only 5th density or higher can judge it. 29.29: the gateway comes from balanced sympathetic vibration with will to serve and seek. 29.30: the entity charges a physical crystal with its seeking; the crystal then acts as a catalyst, an analogue of a relatively undistorted violet ray. Note: the Ra text there is about crystals; "charged object" is your project's reading |

## 3. Hypothesis A: testable in code here (Node.js, no installs)

### 3.1 Statement (falsifiable)

**HA.** In a closed, perfectly conducting, zero-pressure, axisymmetric container, any starting field with positive helicity K (generic blobs, two stacked toroids of opposite poloidal sense, or a counter-helicity pair of toroids) relaxes under helicity-preserving energy descent into ONE toroidal state with:

- **HA1 (structure):** F = lambda*psi (force-free), a magnetic axis that is a ring at r > 0 (a torus), and equal toroidal and poloidal energy.
- **HA2 (energy floor):** W decreases monotonically and ends at W_min = lambda1*|K_net|/2 (lambda1 = 4.955 for r = z = 1).
- **HA3 (release formula):** for two toroids with helicity ratio b = K_2/K_1 of opposite sign, the fraction of stored energy released is approximately 1 - (lambda1/lambda2)*(1-b)/(1+b), with lambda2 = 7.359. Counter-helicity (b near 1) releases the most, and the release stays below 100%.
- **HA4 (no gain):** no relaxation path delivers more than W0 - W_min, and W0 had to be spent to build the toroids.

**What supports it:** all starts end with lambda_eff within 1% of 4.955, corr(F, psi) > 0.99, axis radius > 0.3, W-rise violations = 0, released fractions within 2 percentage points of HA3, and the same end state from random starts.
**What refutes the structure claim (HA1):** generic starts that stay as several separate lumps, an end state with lambda_eff clearly above 4.955 that is not an unstable saddle, a toroidal/poloidal energy split far from 50/50.
**What would refute strict conservation in the model (HA2/HA4):** any step where W rises, or any end state with W below lambda1*K/2 by more than the grid floor (see 3.4). In this model that would mean a bug, not new physics.
**An honest limit of the test:** the model is a pure descent, so "W cannot rise" is built into the algorithm, and K is held fixed by rescaling (drift 1e-15 is by construction, not a finding). What is *not* built in, and was actually tested, is (i) that generic starts all arrive at a toroid, (ii) that it is the right toroid (lambda, axis, 50/50 split match analytic Taylor values), (iii) the release numbers. A net gain can only appear if an external drive is added to the model, which is exactly what a declared port is (section 5).

### 3.2 Model and equations

Axisymmetric fields, mu0 = 1. B = grad(psi) x grad(phi) + F grad(phi), psi = poloidal flux function, F = r*B_phi. Container: perfectly conducting cylinder r in [0,1], z in [0,1]; psi = 0 and F = 0 on the boundary.

- Energy: W = pi * INT (|grad psi|^2 + F^2)/r dr dz
- Helicity: K = 4*pi * INT psi*F/r dr dz
- Operator: Delta* psi = r d/dr((1/r) dpsi/dr) + d2psi/dz2
- Taylor state (min W at fixed K): F = lambda*psi, -Delta* psi = lambda^2 psi, W = lambda*K/2. For the cylinder (a = h = 1): lambda1 = sqrt(j_{1,1}^2 + pi^2) = 4.9550, with psi = r*J1(3.8317 r)*sin(pi z); next axial mode lambda2 = sqrt(j_{1,1}^2 + (2 pi)^2) = 7.3594.
- Relaxation = projected steepest descent of the Rayleigh quotient R = W/K, in the 1/r-weighted metric: dpsi = -2*Delta*psi - 4R*F, dF = 2F - 4R*psi, followed by a rescale that restores K exactly. This is the variational form of Taylor's argument (a path of energy-lowering, helicity-preserving "dissipative events"), NOT a time-accurate resistive MHD run; the iteration index is not physical time.

Discretisation: second-order finite differences on 40x40 (and 20x20 to check convergence), explicit step tau = 4e-5 (scaled with grid), 200,000 steps. Code: `code/taylor_relax.mjs` (about 220 lines, no dependencies, about 3.5 minutes at 40x40; `--quick` runs 4000 steps and is NOT converged; `--n=20` is the coarse grid). Full output: `code/run.log` and `code/taylor_relax_results.json`.

### 3.3 Cases (parameters)

- **C0** control: start exactly in the analytic Taylor state. Measures the numerical floor.
- **C1** generic: a psi-blob at (r, z) = (0.55, 0.35) and a mixed F field of two offset blobs, chosen once, not tuned; no toroidal structure by construction.
- **C2** two stacked counter-poloidal toroids (the n = 2 Beltrami mode) plus a 20% amplitude admixture of the n = 1 state (the pure n = 2 state is a saddle and sits there; with a 2% perturbation the descent had only just begun to leave it after 60,000 steps, so I used a larger admixture).
- **C3** counter-helicity pair: both toroids have positive psi, the upper one has opposite F; helicity ratio K_up/K_low = b in {0, 0.25, 0.5, 0.8, 0.9}.
- **C4** eight random smooth (psi, F) starts (seed 12345, one draw).

### 3.4 Results (MODEL; 40x40 grid unless stated)

| Case | Result |
|---|---|
| C0 control | W unchanged (below 0.001%). Discrete ground state lambda_eff = 4.9533 vs analytic 4.9550 (error 0.034%); on the 20x20 grid 4.9484 (0.13%), so the error shrinks about 4x on halving the grid, as second order predicts. **So 0.03% (40x40) is the code's own noise floor for "energy that is not there".** |
| C1 generic blobs | W falls to 22.9% of start (77.15% released); lambda_eff 4.9533; magnetic axis at r = 0.625, z = 0.500 (analytic axis r = 2.405/3.8317 = 0.628, z = 0.5); corr(F, psi) = 1.00000; overlap with the analytic spheromak 1.00000; toroidal energy fraction 0.5000; W-rise violations 0 |
| C2 two counter-poloidal toroids | 32.05% released (the pure n = 2 to n = 1 prediction is 32.67%; the start here includes the n = 1 admixture, so the prediction is approximate); ends in the same state |
| C3 counter-helicity pair, b = 0 / 0.25 / 0.5 / 0.8 / 0.9 | Released 32.86 / 59.71 / 77.62 / 92.54 / 96.47 %. HA3 formula: 32.67 / 59.60 / 77.56 / 92.52 / 96.46 %. On 20x20: 32.59 / 59.55 / 77.53 / 92.51 / 96.45 %. Final W = 0.9997 * lambda1*K/2 (0.9987 on 20x20). All end at r = 0.625, z = 0.5 |
| C4 random starts | All 8 end at lambda_eff between 4.9533 and 4.9551 (spread 0.04%), axis r = 0.625, z = 0.5, toroidal fraction 0.5000, W-rise violations 0 |
| P2 Rayleigh check (fluid analogue) | Discriminant (1/r^3) d(Gamma^2)/dr, minimum: co-rotating Rankine vortex 0.0000 (marginal, not unstable); a profile whose outer shell spins the other way, Gamma going +1 to -1: minimum -7.72, i.e. a centrifugally unstable band, where Taylor-Couette-type toroidal cells appear. This is a one-line analytic fact, checked numerically |
| P3 | Gharib jet at the quoted conditions: about 47 W of hydraulic power in (my arithmetic) |

**Reading.** Every start folded into the same single torus, with the numbers Taylor theory predicts, which validates the code and gives the owner's picture a quantitative form: *in this idealisation, the donut is where stored field energy ends up when it is allowed to dissipate*, and a counter-rotating (counter-helicity) pair has the most to dissipate because the helicity that props up the energy cancels (HA3). The expected strict-conservation bookkeeping is then: W_mag(t) + Heat(t) = W0, with Heat(end) = W0 - lambda1*K_net/2 and no way to exceed it.

**Limits that matter (do not over-read this):**

1. Zero pressure: in the K_net -> 0 limit this model releases nearly 100% and leaves nothing, because with the container wall at psi = 0 there is nothing to hold. Real counter-helicity merging leaves an FRC held by plasma pressure (E5), so the 96% number is the idealised ceiling, not a prediction for TS-3.
2. Axisymmetric only. In 3D a spheromak in a short cylinder can tilt (E4); that changes the dynamics, not the energy ordering.
3. The relaxation is a variational path, not a resistive-MHD time evolution: no reconnection physics, no flows, no rates.
4. It does not model how a water-jet torus (Gharib), a Shoulders EV or a Bendall plasmoid is made, and it contains no claim that any of them is a Taylor state.
5. One code, one geometry, two grids, my choices of starts; in-sample.

### 3.5 Stretch A2 (not implemented): the fluid "vortex inside a vortex" twin

Axisymmetric incompressible Navier-Stokes with swirl (stream function psi, vorticity omega_theta, circulation Gamma), counter-rotating coaxial cylinders (Taylor-Couette). Spec for about 300 lines: periodic in z, FFT or per-mode tridiagonal Poisson solve, explicit advection plus implicit diffusion. Prediction (MEASURED in the literature, so a validation): stacked toroidal cells appear above a critical Taylor number, wavelength about 2x gap, and the energy ledger closes as dE_kin/dt = P_wall(torque*omega) - dissipation, with the wall torque as the declared port. A pass is closure of that ledger to the discretisation error and onset within about 10% of the published critical value (Chandrasekhar 1961 / Andereck 1986). A fail points at the code.

## 4. Hypothesis B: a real-world claim as a measurement protocol

### 4.1 The claim, stated precisely

Needed from the owner's Drive files before it is final (list withheld from the public copy). A working version:

> **HB.** A device D that uses magnetic fields to drive two coaxial, counter-rotating swirls whose inner region relaxes to a toroid, run for T >= 24 h inside a thermally closed boundary, delivers measured output energy E_out (heat + electrical + mechanical + radiated) that exceeds total measured input E_in (every electrical source, pump and fuel, plus any drawdown of stored energy) by more than the combined measurement uncertainty. The excess is absent when counter-rotation is disabled but all other inputs are held identical.

**Variant for an engine (Bendall):** brake-specific fuel consumption (fuel energy per unit brake work) falls by at least X% (X from the MSAART file) with D fitted, relative to an otherwise identical sham.

**Null (standard physics):** E_out <= E_in + Delta_U_stored, i.e. COP <= 1, with all inputs counted. Section 3 supports why: relaxation and counter-rotation convert stored or driven energy, they do not add to it.

### 4.2 Protocol

1. **Pre-register.** Before any run: the claim text, the configurations, the metrics, the analysis script (hash it), the decision rule, the stopping rule, and the largest stored-energy ceiling (below).
2. **Input metering.**
   - Electrical: a calibrated power analyser or scope-plus-current-monitor on every supply, bandwidth at least 10x the highest frequency present (pulsed or RF drives are the classic place for unmetered input), logging the integral continuously. Include pumps, fans, controllers, cooling.
   - Hydraulic or mechanical input: pressure x flow (for a Gharib-type jet, about 47 W at the quoted conditions, but the electric input to the pump will be several times larger and must be counted).
   - Fuel (engine variant): gravimetric or Coriolis mass flow, with the fuel's heating value measured, not assumed.
3. **Closed calorimetry for output.** A flow calorimeter (two matched temperature sensors, mass flow by Coriolis meter) or an isoperibolic calorimeter, with a Faraday enclosure so RF is absorbed and counted, and light absorbed inside the enclosure. Everything leaving the boundary is on the ledger. For the engine variant use a dynamometer at fixed load points with SAE-type ambient corrections.
4. **Calibration with a dummy.** A resistive heater placed where the device sits, driven with the same waveform and frequency content, at three power levels, before and after every run. Calibration constant good to a stated uncertainty (aim for 1% or better).
5. **Controls (all with identical hardware, pumps, cabling and thermal load):**
   - A: device active, counter-rotating.
   - B: sham, same geometry and power draw, counter-rotation disabled.
   - C: co-rotating drive (same power, same coils).
   - D: dummy resistive load only.
   - E: off.
   For the engine variant, a sham that includes an identical intake preheater is essential, since Skeptoid's analysis says the unit is a heat exchanger plus air bubbling.
6. **Blinding and randomisation.** A third person generates a sealed randomised schedule (interleaved, not batched) of A-E; the operator and the analyst do not know the configuration until the analysis script is frozen. Run at least 6 interleaved repeats per configuration.
7. **Duration.** At least 10 thermal time constants per run to reach steady state, plus one continuous run of at least 24 h for the cumulative ledger. A long run matters because a stored-energy release decays and a source does not.
8. **Analysis.** Ledger per run: Delta_E = E_out - E_in - Delta_U, where Delta_U is the change in stored energy (temperature drift times heat capacity, chemical change, battery or capacitor state, field energy in coils). Uncertainty: sigma_tot^2 = sigma_cal^2 + sigma_in^2 + sigma_drift^2 (+ systematics found in the dummy runs). Example: three components at 0.5% give sigma_tot about 0.9%; for 100 W in, detecting a 10% effect is then 10 sigma, and the minimum detectable effect at 3 sigma is about 2.7 W.
9. **What "excess" must exceed (all of them):**
   - 3 sigma_tot (preferably 5), from the dummy-load calibration, not a datasheet;
   - the stored-energy ceiling: the most energy any known process inside the boundary could release (chemical inventory in electrodes, water, fuel, recombination of dissociated gas; thermal inertia; field energy), times a safety factor, so the cumulative excess in the 24 h run exceeds it by at least 10x (a standard criterion in the cold-fusion debate: excess energy must exceed what chemistry or stored heat could supply; from my background knowledge, not checked against the review reports in this pass);
   - the sham/B and dummy/D values in the same blinded schedule.
10. **Decision rule (pre-specified).** The null is rejected only if the lower one-sided 99.7% bound on Delta_E is above zero in at least 80% of A runs AND B, C, D, E show no such excess. Even then the result is "candidate anomaly", and nothing is claimed until an independent lab with its own instruments reproduces it.
11. **What counts as refuting HB:** excess within noise; excess that vanishes under blinding or in the sham; excess that scales with an identified systematic (unmetered RF or pulse input, thermal lag, fuel density or temperature, sensor placement). Any of these refutes the claim *as stated*. It does not refute that the toroid forms (section 3).

### 4.3 Known failure modes to rule out first

Unmetered or aliased pulsed/RF input; thermal gradients biasing a single-point temperature; recombination or other chemical storage released over hours; calorimeter calibrated with a different heat distribution than the device's; operator or analyst expectation; for engines, intake temperature, humidity and load repeatability (modern engine control compensates for many bolt-on changes).

### 4.4 A weaker, easier cousin (no energy claim) to run first

**HB-lite:** applying a counter-rotating magnetic drive to a Gharib-type impinging-jet plasma torus changes its lifetime, diameter, luminous coherence or RF line stability, at metered hydraulic input. That tests the *structure* claim (a counter-rotating field stabilises a toroidal plasmoid), is publicly checkable against E7's baseline, and puts a first measured efficiency (optical + RF out over hydraulic in) in the ledger. No expectation of COP > 1.

## 5. Design translation for the simulation

All DESIGN unless marked. Principle: ordinary physics stays strictly conserved; the counter-rotating toroid is a *structure* with state, a converter and an antenna; the only place a net joule can enter is one declared gateway port.

### 5.1 The toroid as an ordinary-physics object

State per toroid: energy W, helicity K, geometry factor lambda_geom (from container/shape), coherence c = W_min/W in (0, 1], with W_min = lambda_geom*|K|/2 (the Taylor floor).

- **Relaxation (`stepPlasmoidRelaxation`)**: a dissipative element, a port-Hamiltonian resistor. W_free = max(0, W - W_min); dW = -min(W_free, kappa*W_free*dt); the amount lost is credited, exactly, to the local thermal (or flow, or radiation) reservoir. K changes only through a declared helicity port. This is what section 3 computed; the discrete-gradient integrator handles it (dH/dt <= 0, with the dissipated term moved into a reservoir state so the total is conserved to roundoff).
- **Counter-helicity merge**: K = K1 + K2, W0 = W1 + W2 + W_interaction, released = W0 - lambda_geom*|K|/2, to be split between heat and bulk flow. Co-helicity merging releases less (the K adds). Section 3 gives test numbers (HA3).
- **Vortex rings and counter-rotating cells (fluid)**: impulse and circulation conserved in the inviscid limit, energy by the thin-core formula (E2), viscous loss to heat. Counter-rotating swirl with a Rayleigh-negative band triggers cell formation (E1), powered by the wall or drive port.
- **`stepVortexPlasmaTransmutation`**: in ordinary physics it can only move energy through declared Q-values (mass defects). Anything that yields more than the Q-value, or that depends on a CONTESTED mechanism (LENR in a plasmoid, C3/C4), must not live in ordinary physics. Put it behind the gateway flag, or leave it out until the Drive files (Jaitner, Bendall) give a quantitative claim.

### 5.2 The gateway port (what goes in, what comes out, what gates it)

| Aspect | Specification |
|---|---|
| Takes in | **Information, not energy**: the entity's balance score b and its seeking or will signal s (non-energetic), and a reference to the *charged object*, here a toroid with coherence c. |
| Gate | Strict threshold: G = 0 exactly when b < B_THR; above it G rises smoothly (e.g. smoothstep over a small width) to 1. One global B_THR rather than a per-entity one, because [RA] 29.27 as summarised says the required level is fixed even though the difficulties differ. In-world entities below 5th density cannot read it (29.28); only the engine can. |
| Charging requirement | The object must first be *charged by the entity's own seeking* ([RA] 29.30 as summarised): the entity does ordinary work (declared in the ledger, costs time and energy) to build a high-coherence toroid, i.e. to relax it near its Taylor state. A sloppy, high-W, low-c toroid couples poorly. |
| Coupling | Capacity C = c * (1 - W/W_max): a well-relaxed object with headroom couples best. The headroom term makes it self-limiting, so there is no positive-feedback runaway. |
| Puts out | Power P_g = G * C * P_MAX into the toroid's field energy W (a declared inflow), where P_MAX is a rate cap, a world constant. The source is unlimited as a *stock*; the tap is bounded as a *flow*. After entry the energy obeys ordinary physics (it can be dissipated, radiated, used as work). |
| What the entity's focus shapes | The *form* the work takes (which toroid parameters, what is done with W), not the amount, following 27.5 as summarised ("the kind of work depends on the distortion of free will"). |
| Optional second gate | Counter-balance of the object: beta = 1 - |K1 + K2|/(|K1| + |K2|), with beta = 1 a perfectly counter-balanced pair. This maps "balance" onto the physics (zero net helicity = maximum releasable free energy, section 3). Whether the object's counter-balance should matter, or only the entity's, is the owner's call (question 1 below). |

Ledger: `ledger.gateway += P_g*dt`, a separate signed term with an entity attribution. Total energy obeys dE_total = ledger.gateway + ledger.star (+ any other declared port), and nothing else.

### 5.3 Pseudocode

```js
// ordinary physics: strictly conserved
function stepPlasmoidRelaxation(t, dt) {
  const Wmin = t.lambdaGeom * Math.abs(t.K) / 2;
  const free = Math.max(0, t.W - Wmin);
  const dW = Math.min(free, t.kappa * free * dt);     // never below the Taylor floor
  t.W -= dW; world.reservoir(t.cell).heat += dW;      // exact transfer, no creation
}
// the one declared source
function stepGateway(entity, obj, dt) {
  const G = smoothstep((entity.balance - B_THR) / WIDTH);   // exactly 0 below B_THR
  const C = obj.coherence() * Math.max(0, 1 - obj.W / obj.Wmax);
  const P = G * C * P_MAX;                                  // bounded tap
  obj.W += P * dt; ledger.gateway.push({ entity: entity.id, obj: obj.id, E: P * dt });
}
```

### 5.4 Invariants and tests (all in the sim)

- **T1** closed system, no ports: total energy drift below 1e-12 relative over N steps.
- **T2** every `stepPlasmoidRelaxation` and merge: W non-increasing, W >= W_min*(1 - floor), K unchanged (to 1e-9) except through a declared port. Set the floor from the code's own noise floor, which is 0.03% at this resolution (C0); anything smaller than the floor is not an event.
- **T3** gate closed (b < B_THR): P_g is exactly 0 for every entity, every step.
- **T4** gate open: the change in total energy equals the sum of the gateway ledger (and star ledger) within tolerance.
- **T5** free-energy detector: any step that creates energy without a ledger entry is a failure, in ordinary physics and in the gateway.
- **T6** section 3 numbers as regression tests: C3 release fractions within 2 percentage points of the HA3 formula; random starts end in the same state.

### 5.5 Where this follows or departs from Ra (for the claim-strength review)

- Follows (partly, via a fetch summary, not script-checked): a potential of intelligent infinity exists and drawing on it yields work (27.5); a fixed balance threshold (29.27); a charged object as a catalyst (29.29-29.30).
- Design interpretation, not Ra: that the charged object is a relaxed counter-rotating toroid; that the object's coherence limits the tap; the numerical P_MAX, B_THR and WIDTH; the second "counter-balance" gate.
- Departs from Ra's text: nothing that I know of, but Ra's crystal section does not say what the "object" physically is.

### 5.6 Three questions for the owner

1. Should the gate depend on the entity only, or on entity AND object counter-balance (beta)? I would start with the entity alone plus the object's coherence as a limiter.
2. Is P_MAX a world constant, or should it depend on the density or locale of the entity?
3. Keep LENR or "transmutation" gains out of ordinary physics (Q-values only) and behind the gateway flag? I recommend yes.

## 6. Reproducibility and caveats

- Run: `node code/taylor_relax.mjs` (Node 24, about 3.5 minutes; the output is deterministic; the seed for C4 is fixed). The PDF and its text extractor are not committed.
- Things I did not do: read the Drive files; read Bostick, Taylor 1986 or Shoulders's claims in full; see the supplement of Gharib et al.; script-check the Ra paraphrases; get a fresh-reader claim-strength review; implement A2.
- Numbers from my own run are MODEL-strength: one code, two grids, starts of my choosing.
- The Jaitner title could not be found online under that author and title; treat it as unverified until the Drive file is read.
