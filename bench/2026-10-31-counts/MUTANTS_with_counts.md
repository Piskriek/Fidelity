# Automatic Mutant Generator

Every site, 307 mutants over Plan Parts 1–7 (outside code blocks). Gates: semantic, gapmap, formula, counts.

| Operator | Mutants | Killed (any gate) | semantic | gapmap | formula | counts | Killed without formula spine |
|---|---|---|---|---|---|---|---|
| min↔max | 25 | 18 (72%) | 1 | 0 | 18 | 0 | 1 (4%) |
| ≥↔≤ | 15 | 11 (73%) | 1 | 0 | 10 | 0 | 1 (7%) |
| >=→> | 3 | 3 (100%) | 1 | 0 | 3 | 0 | 1 (33%) |
| true↔false | 3 | 3 (100%) | 0 | 0 | 3 | 0 | 0 (0%) |
| swap a−b | 8 | 7 (88%) | 0 | 0 | 7 | 0 | 0 (0%) |
| −↔+ | 65 | 33 (51%) | 1 | 0 | 33 | 0 | 1 (2%) |
| coefficient ±0.1 | 61 | 18 (30%) | 7 | 2 | 17 | 0 | 9 (15%) |
| integer ×2 | 89 | 45 (51%) | 3 | 3 | 35 | 13 | 15 (17%) |
| unit swap | 14 | 11 (79%) | 0 | 0 | 11 | 0 | 0 (0%) |
| drop guard | 13 | 11 (85%) | 0 | 0 | 11 | 0 | 0 (0%) |
| type swap | 6 | 5 (83%) | 0 | 0 | 5 | 1 | 1 (17%) |
| exponent | 3 | 2 (67%) | 0 | 0 | 2 | 0 | 0 (0%) |
| drop enum member | 2 | 2 (100%) | 0 | 0 | 2 | 0 | 0 (0%) |
| **all** | 307 | 169 (55%) | 14 | 5 | 157 | 14 | 29 (9%) |

## Rates (share of mutants in each row)

| Set | Mutants | Caught by any gate | Spine proved a broken property (behavioural FAIL) | Caught only by spine DRIFT or a text pin | Caught without the spine |
|---|---|---|---|---|---|
| all sites | 307 | 169 (55%) | 107 (35%) | 49 (16%) | 29 (9%) |
| shown: the exact site was shown to a spec author | 89 | 72 (81%) | 51 (57%) | 17 (19%) | 7 (8%) |
| seen: in the formula or spine entry of a shown site or shown entry | 161 | 84 (52%) | 52 (32%) | 32 (20%) | 9 (6%) |
| **unseen: no spec author was shown a defect there** | 57 | 13 (23%) | 4 (7%) | 0 (0%) | 13 (23%) |
| — of which inside some spine entry's text | 4 | 4 (100%) | 4 (100%) | 0 (0%) | 4 (100%) |
| — of which outside every spine entry | 53 | 9 (17%) | 0 (0%) | 0 (0%) | 9 (17%) |

Shown sites: 105 of 105 found in this Plan, 89 of them still mutation sites under the current operators. Shown spine entries: F01, F02, F05, F06, F07, F08, F09, F10, F11, F12, F13, F14, F15, F16, F17, F19, F20, F25, F26, F29, F35, F36, F37, F41, F43, F44, F46. Entries marking seen territory: F01, F02, F03, F05, F06, F07, F08, F09, F10, F11, F12, F13, F14, F15, F16, F17, F19, F20, F22, F25, F26, F27, F28, F29, F30, F31, F32, F33, F34, F35, F36, F37, F38, F39, F40, F41, F42, F43, F44, F45, F46 (spans longer than 2000 characters mark none).

Gate crashes or timeouts (not counted as catches, listed separately): 0. The default gates are semantic, gap map, formula spine and count/identity audit; the v9 suite runs only with `--with-v9`, and the mutation test and clean-slate scan are not run. Equivalent mutants (changes that alter nothing that matters) are not removed, so survivors mix blind spots and harmless edits.

## Survivors (138): blind spots or equivalent mutants

| Operator | Change | Exposure | Context |
|---|---|---|---|
| min↔max | `\max` → `\min` | shown | …niche}(b)}}{\max(1, N_{\text{total}})} - \frac{1}{\max(1, K_{\text{niches}})}\right)\right)$$ ### 1.2 Cr… |
| min↔max | `\max` → `\min` | unseen | … 4 — Harmonic Proportioning**: $S_{\text{prop}} = \max(0, 1 - \min_{t \in {1.0, 1.414, 1.618}} \|\text{as… |
| min↔max | `\min` → `\max` | unseen | …c Proportioning**: $S_{\text{prop}} = \max(0, 1 - \min_{t \in {1.0, 1.414, 1.618}} \|\text{aspectRatio} -… |
| min↔max | `\max` → `\min` | shown | …eft\| \sum_{k=1}^{N_{\star}} \frac{\sqrt{L_{x,k}}}{\max(10^{-3}, \|\mathbf{q}_{\star, k} - \mathbf{q}\|_2)}… |
| min↔max | `\max` → `\min` | seen | …= \text{clamp}_{01}\left( \frac{1}{7}\sum_{r=1}^7 \max_{m \in \text{Circle}} \text{ray}_{m, r} + \Delta_… |
| min↔max | `\min` → `\max` | seen | …} + \Delta_{\text{complement}} - 0.85 \cdot \frac{\min(N_{\text{STO}}, N_{\text{STS}})}{\max(1, N_{\text… |
| min↔max | `\max` → `\min` | seen | …rgence holds by construction: the horizon is $K = \max(K_{\text{req}}, \lceil \text{strain}/25 \rceil + … |
| ≥↔≤ | `\ge` → `\le` | unseen | … Active Drive ($+8%$ overshoot), Follow-Through ($\ge 5%$ guaranteed settle window, `#06`), modulated b… |
| ≥↔≤ | `\ge` → `\le` | seen | …Pi_{0,i}} - \ln\frac{\Pi_i}{\Pi_{0,i}} - 1\right) \ge 0$$ ### 1.2 `SQ-JEPA` Action-Conditioned Latent R… |
| ≥↔≤ | `\ge` → `\le` | seen | …^{(k)}, \text{strain}^{(k)}, \text{grudge}^{(k)}) \ge 0$$ Rolls out $k = 0 \dots K$ in a single call un… |
| ≥↔≤ | `\ge` → `\le` | unseen | …ed civilization coherence reaches $H_{\text{SMC}} \ge 0.95$ (`S6`), ignites a child universe seed (`((r… |
| swap a−b | `(\mathbf{r}_{\text{CoM}} - \mathbf{r}_{\text{thrust}})` → `(\mathbf{r}_{\text{thrust}} - \mathbf{r}_{\text{CoM}})` | shown | …{thrust}})$: $$\tau_{\text{arm}} = \begin{cases} \|(\mathbf{r}_{\text{CoM}} - \mathbf{r}_{\text{thrust}}) \times \hat{\mathbf{n}}_{\text{thrust}}\|_2 & \tex… |
| −↔+ | ` + ` → ` - ` | seen | …oved in `B119`): $$\mathbf{x}^{k+1} = \mathbf{x}^k + \Delta t \left( \mathbf{I} - \frac{\Delta t}{2} (\… |
| −↔+ | ` + ` → ` - ` | seen | …{J} - \mathbf{R}) \nabla H\left(\frac{\mathbf{x}^k + \mathbf{x}^{k+1}}{2}\right) + \Delta t\, \mathbf{G… |
| −↔+ | ` + ` → ` - ` | seen | …t(\frac{\mathbf{x}^k + \mathbf{x}^{k+1}}{2}\right) + \Delta t\, \mathbf{G} u_{\text{policy}}$$ Passivit… |
| −↔+ | ` + ` → ` - ` | unseen | …_x) = \text{clamp}_{01}(L_x), \quad C_p(A_q) = 120 + 4080 \cdot \text{clamp}_{01}(A_q)\text{ [J/(kg}\cd… |
| −↔+ | ` + ` → ` - ` | seen | …ext{ [K]}, \quad T_{\text{boil}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\te… |
| −↔+ | ` + ` → ` - ` | seen | …]}, \quad T_{\text{boil}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\text{eff}… |
| −↔+ | ` + ` → ` - ` | seen | …{boil}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\text{eff}}\text{ [K]}, \qua… |
| −↔+ | ` - ` → ` + ` | seen | …uad T_{\text{plasma}} = T_{\text{boil}} + 4000(1.1 - 0.5 L_x)\text{ [K]}$$ Here $p_{\text{atm}}$ is in … |
| −↔+ | ` + ` → ` - ` | shown | …s}_b}{\max(10^{-9}, \|\mathbf{s}_c\|\|\mathbf{s}_b\|)} + 0.45 \frac{\|P_c \cap P_b\|}{\max(1, \|P_b\|)} \right)… |
| −↔+ | ` + ` → ` - ` | seen | …iator}}) + 0.28 \mathbf{s}_{\text{nicheAttractor}} + 0.045 \cdot \boldsymbol{\xi}_{\text{symplectic}}\r… |
| −↔+ | ` + ` → ` - ` | seen | …(E_{\text{max}} - e) \cdot \Delta z_{\text{epoch}} + z_0\text{ [m]}$, forming procedural underground du… |
| −↔+ | ` - ` → ` + ` | seen | …xt{arm}} = \begin{cases} \|(\mathbf{r}_{\text{CoM}} - \mathbf{r}_{\text{thrust}}) \times \hat{\mathbf{n}… |
| −↔+ | ` - ` → ` + ` | seen | …t{thrust}}\|_2 > 10^{-9} \ \|\mathbf{r}_{\text{CoM}} - \mathbf{r}_{\text{thrust}}\|_2 & \text{otherwise} \… |
| −↔+ | ` + ` → ` - ` | seen | …_{\text{offset}} = \|\mathbf{x}_{\text{CoM}, xz}\|_2 + \frac{\|\mathbf{v}_{\text{nominal}, xz}\|_2}{\omega_… |
| −↔+ | ` - ` → ` + ` | unseen | …onic Proportioning**: $S_{\text{prop}} = \max(0, 1 - \min_{t \in {1.0, 1.414, 1.618}} \|\text{aspectRati… |
| −↔+ | ` - ` → ` + ` | unseen | …in_{t \in {1.0, 1.414, 1.618}} \|\text{aspectRatio} - t\|)$ (aspectRatio = longest / max(10^{-3} m, short… |
| −↔+ | ` + ` → ` - ` | unseen | …= \mathbf{S}_{\text{sector}} \cdot 2^{17}\text{ m} + \mathbf{O}_{\text{orbital}} + \mathbf{x}_{\text{lo… |
| −↔+ | ` + ` → ` - ` | unseen | …cdot 2^{17}\text{ m} + \mathbf{O}_{\text{orbital}} + \mathbf{x}_{\text{localSelf}}$$  - **Sector $\math… |
| −↔+ | ` - ` → ` + ` | seen | …qrt{L_{x,k}}}{\max(10^{-3}, \|\mathbf{q}_{\star, k} - \mathbf{q}\|_2)} e^{i(k_k \|\mathbf{q}_{\star, k} - … |
| −↔+ | ` - ` → ` + ` | seen | … - \mathbf{q}\|_2)} e^{i(k_k \|\mathbf{q}_{\star, k} - \mathbf{q}\|_2 + \phi_k(t))} \right\|^2$$ with waven… |
| −↔+ | ` + ` → ` - ` | seen | …)} e^{i(k_k \|\mathbf{q}_{\star, k} - \mathbf{q}\|_2 + \phi_k(t))} \right\|^2$$ with wavenumber $k_k = \om… |
| −↔+ | ` + ` → ` - ` | seen | …=1}^7 \max_{m \in \text{Circle}} \text{ray}_{m, r} + \Delta_{\text{complement}} - 0.85 \cdot \frac{\min… |
| −↔+ | ` - ` → ` + ` | seen | …e}} \text{ray}_{m, r} + \Delta_{\text{complement}} - 0.85 \cdot \frac{\min(N_{\text{STO}}, N_{\text{STS… |
| −↔+ | ` - ` → ` + ` | unseen | …$\boldsymbol{\varepsilon} = \mathbf{y}_{\text{in}} - \boldsymbol{\mu}$ via Kullback-Leibler Variational… |
| −↔+ | ` + ` → ` - ` | seen | …symbol{\varepsilon}^T \Pi \boldsymbol{\varepsilon} + \frac{1}{2} \sum_{i=1}^4 \left(\frac{\Pi_i}{\Pi_{0… |
| −↔+ | ` + ` → ` - ` | shown | …max(K_{\text{req}}, \lceil \text{strain}/25 \rceil + 4, \text{debt} + 4, 12)$, capped at 72 (`B140`).  … |
| −↔+ | ` + ` → ` - ` | seen | …}, \lceil \text{strain}/25 \rceil + 4, \text{debt} + 4, 12)$, capped at 72 (`B140`).   - **Context Enco… |
| −↔+ | ` + ` → ` - ` | seen | …bol{\varepsilon}^{(k)}, \Pi^{(k)} \parallel \Pi_0) + V_{\text{Lyapunov}}(\text{debt}^{(k)}, \text{strai… |
| −↔+ | ` + ` → ` - ` | seen | …fined here (the reference uses $0.1\,\text{strain} + 2\,\text{debt} + 1.5\,\text{grudge}$). ## 2. Simul… |
| −↔+ | ` + ` → ` - ` | seen | …eference uses $0.1\,\text{strain} + 2\,\text{debt} + 1.5\,\text{grudge}$). ## 2. Simulated Music (Kuram… |
| −↔+ | ` + ` → ` - ` | seen | …*: $$\Delta H_{\text{symbiotic}} = \frac{1}{2}(L_x + A_q) \cdot \text{Sincerity}_{01} \cdot (1 + 0.5 \c… |
| −↔+ | ` + ` → ` - ` | seen | …2}(L_x + A_q) \cdot \text{Sincerity}_{01} \cdot (1 + 0.5 \cdot \text{CatalystResolved}_{01}), \quad \te… |
| coefficient ±0.1 | `0.35` → `0.45` | unseen | …${resistKey}:${resistVal}` (e.g. `elem:plasma-arc:0.35`), so parsers split on the **last** `:`. - **`B10… |
| coefficient ±0.1 | `0.08` → `0.18` | shown | …}(P_{xd}, p_{\text{atm}}) = \left(\max(10^{-3}, ; 0.08 \cdot P_{xd}, ; p_{\text{atm}})\right)^{0.08}$$ $… |
| coefficient ±0.1 | `0.08` → `0.18` | seen | …}, ; 0.08 \cdot P_{xd}, ; p_{\text{atm}})\right)^{0.08}$$ $$T_{\text{melt}} = (50 + 3650 \cdot P_{xd}(1 … |
| coefficient ±0.1 | `0.35` → `0.45` | seen | …$ $$T_{\text{melt}} = (50 + 3650 \cdot P_{xd}(1 - 0.35 A_q)) \cdot p_{\text{eff}}\text{ [K]}, \quad T_{\… |
| coefficient ±0.1 | `0.6` → `0.5` | seen | …d T_{\text{boil}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\text{eff}}\text{ … |
| coefficient ±0.1 | `0.4` → `0.5` | seen | …il}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\text{eff}}\text{ [K]}, \quad T… |
| coefficient ±0.1 | `0.5` → `0.4` | seen | … T_{\text{plasma}} = T_{\text{boil}} + 4000(1.1 - 0.5 L_x)\text{ [K]}$$ Here $p_{\text{atm}}$ is in **a… |
| coefficient ±0.1 | `0.55` → `0.45` | seen | …bExcitement`) $$E(c, b) = \text{clamp}_{01}\left( 0.55 \frac{\mathbf{s}_c \cdot \mathbf{s}_b}{\max(10^{-… |
| coefficient ±0.1 | `0.45` → `0.55` | seen | …b}{\max(10^{-9}, \|\mathbf{s}_c\|\|\mathbf{s}_b\|)} + 0.45 \frac{\|P_c \cap P_b\|}{\max(1, \|P_b\|)} \right) \cd… |
| coefficient ±0.1 | `0.85` → `0.75` | seen | …\|}{\max(1, \|P_b\|)} \right) \cdot \max\left(0, 1 - 0.85 \max\left(0, \frac{N_{\text{niche}(b)}}{\max(1, N… |
| coefficient ±0.1 | `0.05` → `0.15` | seen | …k**: $$\mathbf{s}_{\text{child}} = \text{clamp}_{[0.05, 0.98]}\left(0.72 (0.60 \mathbf{s}_{\text{Matrix}… |
| coefficient ±0.1 | `0.98` → `0.88` | shown | …$\mathbf{s}_{\text{child}} = \text{clamp}_{[0.05, 0.98]}\left(0.72 (0.60 \mathbf{s}_{\text{Matrix}} + 0.… |
| coefficient ±0.1 | `0.50` → `0.40` | seen | …rm}}}{2 \max(10^{-3}, r_{\text{RCS}})}\right) \ge 0.50$$   - In planetary gravity (`safeG >= 0.05`): $$\… |
| coefficient ±0.1 | `0.50` → `0.40` | seen | …2.2 \max(10^{-3}, r_{\text{support}})}\right) \ge 0.50$$ Lengths in metres; floors added in `B83`. *Open… |
| coefficient ±0.1 | `0.05` → `0.15` | seen | …83`. *Open (`B106`):* the hard switch at `safeG = 0.05` (unit unstated: G or m/s²?) is discontinuous, so… |
| coefficient ±0.1 | `0.65` → `0.55` | seen | … + 0.35 S_{\text{sym}} + 0.25 S_{\text{prop}} \ge 0.65$. ### 2.1 Bijective Pin-to-Part Visual Grammar (`… |
| coefficient ±0.1 | `0.72` → `0.62` | unseen | …ction = `#1 The Magician` (`willStructureWeight = 0.72`); Body attraction = `#9 The Hermit` (`kineticPre… |
| coefficient ±0.1 | `0.76` → `0.66` | unseen | …action = `#9 The Hermit` (`kineticPrecisionGain = 0.76`).   - **Feminine Polarity**: Mind attraction = `… |
| coefficient ±0.1 | `0.74` → `0.64` | shown | …= `#2 The High Priestess` (`intuitionFlowWeight = 0.74`); Body attraction = `#8 Balanced Working` (`soma… |
| coefficient ±0.1 | `0.78` → `0.68` | seen | … `#8 Balanced Working` (`somaticHomeostasisRate = 0.78`). ## 2. Coupled 14-Zone Somatic Body & Autonomic… |
| coefficient ±0.1 | `0.35` → `0.45` | unseen | …8 \cdot \text{ticks})$), `SHARP_PAIN` (`rebound = 0.35` when released while `mc open=1`), and `EUREKA` (… |
| coefficient ±0.1 | `0.0` → `0.1` | unseen | … when released while `mc open=1`), and `EUREKA` (`0.0` stiffness when released with `mc open=0`). - **C… |
| coefficient ±0.1 | `0.85` → `0.75` | seen | … stage is `runaway` or $\kappa_{\text{stiff}} \ge 0.85$, i.e. $\ge 5$ ticks; reference `v2EvaluateMultiZ… |
| coefficient ±0.1 | `0.0` → `0.1` | seen | …ictly clamped so $\text{severity}_{01} = 0$ adds $0.0$ grudge, `B57`) increments `grudgeScore` across `… |
| coefficient ±0.1 | `0.25` → `0.35` | seen | …e`, grudge does not attach to `actorId`, adding `+0.25` to local unattributed town tension instead. - **… |
| coefficient ±0.1 | `0.55` → `0.45` | seen | …modulated by Left/Right somatic stride gain ($1 - 0.55 \kappa_{\text{stiff}}$). - **Phylogenetic Conlang… |
| coefficient ±0.1 | `0.45` → `0.55` | seen | …thrust}} \le \min\left(250 \cdot m_{\text{kg}}, ; 0.45 \cdot P_{\text{in, Watts}}\right)$$ An unpowered … |
| coefficient ±0.1 | `0.85` → `0.75` | shown | … \text{ray}_{m, r} + \Delta_{\text{complement}} - 0.85 \cdot \frac{\min(N_{\text{STO}}, N_{\text{STS}})}… |
| coefficient ±0.1 | `0.3` → `0.4` | seen | …day}}) = \text{clamp}_{01}\left(R_{\text{prev}} + 0.3 \cdot (S_{\text{day}} - 0.5)\right)$$  - **64 Foc… |
| coefficient ±0.1 | `0.5` → `0.4` | seen | …eft(R_{\text{prev}} + 0.3 \cdot (S_{\text{day}} - 0.5)\right)$$  - **64 Focused Entities (**`60 Hz`**) … |
| coefficient ±0.1 | `0.5` → `0.4` | seen | …oat32Array`** Cohorts (**`6,000`** agents in **`< 0.5 ms`**)** with pure cloned state transitions (`#17… |
| coefficient ±0.1 | `0.65` → `0.55` | unseen | …Faith}) \ge I_{\min}$ across `SPIRAL_1_HEALING` (`0.65`), `SPIRAL_2_FORM_BUILDING` (`0.75`), and `SPIRAL… |
| coefficient ±0.1 | `0.75` → `0.65` | unseen | …L_1_HEALING` (`0.65`), `SPIRAL_2_FORM_BUILDING` (`0.75`), and `SPIRAL_3_ENERGIZING` (`0.80`). Ra names t… |
| coefficient ±0.1 | `0.80` → `0.70` | unseen | …M_BUILDING` (`0.75`), and `SPIRAL_3_ENERGIZING` (`0.80`). Ra names the three pyramid spirals study and h… |
| coefficient ±0.1 | `0.0` → `0.1` | unseen | … `somaticStrainJoules` so `conservationErrorJ === 0.0 J`. ## 2. Alchemical Ego-Suppressing Substances &… |
| coefficient ±0.1 | `0.55` → `0.45` | shown | …dow (**`sub:soma-lucid-spore`**)**: Thins Veil (`-0.55`), multiplies ego hardness by `0.35`, boosts Wisd… |
| coefficient ±0.1 | `0.35` → `0.45` | seen | …Thins Veil (`-0.55`), multiplies ego hardness by `0.35`, boosts Wisdom (`+0.30`) (all three clamped to [… |
| coefficient ±0.1 | `0.30` → `0.40` | seen | …ltiplies ego hardness by `0.35`, boosts Wisdom (`+0.30`) (all three clamped to [0, 1], `B148`), and requ… |
| coefficient ±0.1 | `0.1` → `0.2` | seen | …unov}}$ are not defined here (the reference uses $0.1\,\text{strain} + 2\,\text{debt} + 1.5\,\text{grud… |
| coefficient ±0.1 | `0.35` → `0.45` | shown | … prediction loss to $0$ and boosting excitement `+0.35`. - **5 Support Crew Tiers**: `1: Logos Architect… |
| coefficient ±0.1 | `0.5` → `0.4` | shown | …L_x + A_q) \cdot \text{Sincerity}_{01} \cdot (1 + 0.5 \cdot \text{CatalystResolved}_{01}), \quad \text{… |
| coefficient ±0.1 | `0.18` → `0.28` | seen | …{next}} = \min(1.0, \text{Progress}_{4\text{D}} + 0.18 \Delta H_{\text{symbiotic}})$$ **Pass R28:** this… |
| coefficient ±0.1 | `0.95` → `0.85` | unseen | …ivilization coherence reaches $H_{\text{SMC}} \ge 0.95$ (`S6`), ignites a child universe seed (`((round(… |
| integer ×2 | `4096` → `8192` | seen | … persistent Nemesis rivalry serializes into a `<= 4096` byte ASCII block with a mandatory IEEE-802.3 CRC… |
| integer ×2 | `32` → `64` | unseen | …nd §8.4 Q6); **`B103` still open**. At full caps (32 `me` + 16 `mc` + 14 `mb` + 8 `nem`) a record at t… |
| integer ×2 | `16` → `32` | unseen | …); **`B103` still open**. At full caps (32 `me` + 16 `mc` + 14 `mb` + 8 `nem`) a record at the example… |
| integer ×2 | `14` → `28` | unseen | …` still open**. At full caps (32 `me` + 16 `mc` + 14 `mb` + 8 `nem`) a record at the example line widt… |
| integer ×2 | `32` → `64` | unseen | …ned. The reference formatter/parser keep the last 32 `me` lines rather than the top 4 by `ex` + 28 mos… |
| integer ×2 | `28` → `56` | unseen | …ast 32 `me` lines rather than the top 4 by `ex` + 28 most recent. ## 2. Branch 1 Specification: Log-Bi… |
| integer ×2 | `120` → `240` | unseen | …}(L_x) = \text{clamp}_{01}(L_x), \quad C_p(A_q) = 120 + 4080 \cdot \text{clamp}_{01}(A_q)\text{ [J/(kg}… |
| integer ×2 | `4080` → `8160` | unseen | … = \text{clamp}_{01}(L_x), \quad C_p(A_q) = 120 + 4080 \cdot \text{clamp}_{01}(A_q)\text{ [J/(kg}\cdot\t… |
| integer ×2 | `50` → `100` | seen | …\text{atm}})\right)^{0.08}$$ $$T_{\text{melt}} = (50 + 3650 \cdot P_{xd}(1 - 0.35 A_q)) \cdot p_{\text… |
| integer ×2 | `3650` → `7300` | seen | …{atm}})\right)^{0.08}$$ $$T_{\text{melt}} = (50 + 3650 \cdot P_{xd}(1 - 0.35 A_q)) \cdot p_{\text{eff}}\… |
| integer ×2 | `300` → `600` | seen | … [K]}, \quad T_{\text{boil}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\text{e… |
| integer ×2 | `2500` → `5000` | seen | … \quad T_{\text{boil}} = T_{\text{melt}} + (300 + 2500(0.6 P_{xd} + 0.4 V_{tx})) \cdot p_{\text{eff}}\te… |
| integer ×2 | `4000` → `8000` | seen | …[K]}, \quad T_{\text{plasma}} = T_{\text{boil}} + 4000(1.1 - 0.5 L_x)\text{ [K]}$$ Here $p_{\text{atm}}$… |
| integer ×2 | `10` → `20` | seen | … 0.55 \frac{\mathbf{s}_c \cdot \mathbf{s}_b}{\max(10^{-9}, \|\mathbf{s}_c\|\|\mathbf{s}_b\|)} + 0.45 \frac… |
| integer ×2 | `10` → `20` | seen | …\|_2 & \text{if } \|\mathbf{n}_{\text{thrust}}\|_2 > 10^{-9} \ \|\mathbf{r}_{\text{CoM}} - \mathbf{r}_{\te… |
| integer ×2 | `10` → `20` | seen | … $$\omega_0 = \sqrt{\frac{g_{\text{planet}}}{\max(10^{-3}, h_{\text{CoM}})}}, \quad \xi_{\text{offset}… |
| integer ×2 | `10` → `20` | unseen | …{aspectRatio} - t\|)$ (aspectRatio = longest / max(10^{-3} m, shortest) extent, so ≥ 1, `B155`), with t… |
| integer ×2 | `22` → `44` | unseen | … Ascent (`S0a -> S6`) \| \| **22. The Choice** \| **#22 The Fool** *(Pure Faith Stepping Into Space Acros… |
| integer ×2 | `22` → `44` | unseen | … All 3 Complexes)* \|  \|  \| `invokeArchetypeAtWill(22)` & Polarity Commitment \|  - **Cross-Wired Gender… |
| integer ×2 | `10` → `20` | seen | …ped at 10. *Open (`B101`):* every score from 3 to 10 maps to the top tier. - **Mask Anonymity Law**: I… |
| integer ×2 | `06` → `12` | unseen | …low-Through ($\ge 5%$ guaranteed settle window, `#06`), modulated by Left/Right somatic stride gain ($… |
| integer ×2 | `07` → `14` | unseen | …af`**, **`ja`** with safe **`.en`** fallback, **`#07`**)** & **3-Tier Voice Synth** (`Tier 1 Formant`,… |
| integer ×2 | `100` → `200` | unseen | …\times 2^{17}\text{ m}$, corrected from the stale 100 km-sector value in `B77` — with zero `Int32` wrap… |
| integer ×2 | `512` → `1024` | unseen | …`B77` — with zero `Int32` wrap and $131,072 \bmod 512 \equiv 0$ zero modulo phase drift). - **Orbital $… |
| integer ×2 | `512` → `1024` | seen | …)` bounded in $(-512, +512)\text{ m}$ (`quantum = 512 m`). - **Split-Scale Jump Tuple (**`B46, B65`**)*… |
| integer ×2 | `10` → `20` | seen | …\sum_{k=1}^{N_{\star}} \frac{\sqrt{L_{x,k}}}{\max(10^{-3}, \|\mathbf{q}_{\star, k} - \mathbf{q}\|_2)} e^… |
| integer ×2 | `250` → `500` | seen | …, **`B47`**)**: $$F_{\text{thrust}} \le \min\left(250 \cdot m_{\text{kg}}, ; 0.45 \cdot P_{\text{in, Wa… |
| integer ×2 | `4096` → `8192` | unseen | …tral Gain Gate, **`B47`**)**: Rejects payloads `> 4096` bytes, executable/prototype tokens, AND runs a D… |
| integer ×2 | `64` → `128` | seen | … + 0.3 \cdot (S_{\text{day}} - 0.5)\right)$$  - **64 Focused Entities (**`60 Hz`**) + 24 Vectorized **… |
| integer ×2 | `60` → `120` | seen | …ay}} - 0.5)\right)$$  - **64 Focused Entities (**`60 Hz`**) + 24 Vectorized **`Float32Array`** Cohorts… |
| integer ×2 | `24` → `48` | seen | …right)$$  - **64 Focused Entities (**`60 Hz`**) + 24 Vectorized **`Float32Array`** Cohorts (**`6,000`*… |
| integer ×2 | `17` → `34` | seen | ….5 ms`**)** with pure cloned state transitions (`#17`) and clamped `[0, 1]` satisfaction inputs (`#35`… |
| integer ×2 | `35` → `70` | seen | …#17`) and clamped `[0, 1]` satisfaction inputs (`#35`). ## 4. Turn-Key Clean-Slate Repository Bootstra… |
| integer ×2 | `10` → `20` | unseen | …lessEonGenesis` in a Web Worker (`S0a -> S3` in `~10 ms`) with niche-speciation + symplectic mutation … |
| integer ×2 | `12` → `24` | unseen | …t contradicts the skill's own text (P9) and cost +12–33% tokens and +2–4 minutes per run. Unassisted H… |
| integer ×2 | `500` → `1000` | seen | … from `somaticStrainJoules` (`-> 0 J`; range $[0, 500]$ J, the reference clamp, `B125`), clearing `safe… |
| integer ×2 | `20` → `40` | unseen | …e` once strain drops below `20 J`.  # PART 7: THE 20 DEEP COSMOLOGICAL, BIOPHYSICAL & META-COMPUTATION… |
| integer ×2 | `10` → `20` | unseen | …, non-negative for $\Pi_i, \Pi_{0,i} > 0$ (floor $10^{-3}$ as in the reference, `B120`), relative to h… |
| integer ×2 | `25` → `50` | seen | …is $K = \max(K_{\text{req}}, \lceil \text{strain}/25 \rceil + 4, \text{debt} + 4, 12)$, capped at 72 (… |
| integer ×2 | `12` → `24` | seen | …eil \text{strain}/25 \rceil + 4, \text{debt} + 4, 12)$, capped at 72 (`B140`).   - **Context Encoder $… |
| integer ×2 | `72` → `144` | seen | …}/25 \rceil + 4, \text{debt} + 4, 12)$, capped at 72 (`B140`).   - **Context Encoder $f_\theta(\mathbf… |
| integer ×2 | `21` → `42` | unseen | …text{SQ}}) \to \mathbf{s}^{(k+1)}$**: Applies the 21 SQ Antidote Presets (annealing $\Pi \to \Pi_0$), … |
| integer ×2 | `1000` → `2000` | unseen | …$ (`S6`), ignites a child universe seed (`((round(1000*Pxd) ^ round(10000*Lx) ^ 0x4D4E4557) >>> 0)`) at … |
| integer ×2 | `10000` → `20000` | unseen | …a child universe seed (`((round(1000*Pxd) ^ round(10000*Lx) ^ 0x4D4E4557) >>> 0)`) at `S0a`. **Pass R28:*… |
| unit swap | `J` → `kJ` | unseen | …$ drawn from `vitalReserveJoules` (above the `5.0 J` floor), with any reserve deficit transferred to … |
| unit swap | `J` → `kJ` | unseen | …maticStrainJoules` so `conservationErrorJ === 0.0 J`. ## 2. Alchemical Ego-Suppressing Substances & R… |
| unit swap | `J` → `kJ` | shown | …sipates `-25 J` from `somaticStrainJoules` (`-> 0 J`; range $[0, 500]$ J, the reference clamp, `B125`… |
| drop guard | `\max(1, ` → `(` | shown | …niche}(b)}}{\max(1, N_{\text{total}})} - \frac{1}{\max(1, K_{\text{niches}})}\right)\right)$$ ### 1.2 Cross-… |
| drop guard | `\max(10^{-3}, ` → `(` | shown | …eft\| \sum_{k=1}^{N_{\star}} \frac{\sqrt{L_{x,k}}}{\max(10^{-3}, \|\mathbf{q}_{\star, k} - \mathbf{q}\|_2)} e^{i(k_k … |
| type swap | `Float32` → `Float16` | shown | …Focused Entities (**`60 Hz`**) + 24 Vectorized **`Float32Array`** Cohorts (**`6,000`** agents in **`< 0.5 m… |
| exponent | `\|^2` → `\|^3` | shown | …q}_{\star, k} - \mathbf{q}\|_2 + \phi_k(t))} \right\|^2$$ with wavenumber $k_k = \omega_k / c_{\text{carr… |
