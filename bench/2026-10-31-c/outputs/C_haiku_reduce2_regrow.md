# Blind regrowth from reduce_cards.md (Step 3, reader 2)

Reader: fresh agent, blind. Inputs read: `benchC/in/REDUCE_v2.md` and `benchC/out/C_reduce_cards.md` only. No plan, no other file opened. Arithmetic checked with `node -e` (values quoted in Evidence).

## Regrowth

### Step 1: R0 + R1 (what each element must do, and how they connect)
- E1 Substrate: map Four Floats (Pxd, Vtx, Lx, Aq, each in [0,1]) to physical properties and a 4096-bit VSA bus. Feeds E2 (state) and E4 (values). SI outputs feed the E3 gate and E4 G2 (inferred).
- E2 Kernel: integrate a 24-float state with a passive step; score prediction loss (KL-like); roll the latent state out through E6 operators until energy is at most 1e-9.
- E3 Codec and gate: serialise records (ASCII, at most 4096 B, CRC-32); gate cartridges (thrust/power, folds, tokens); score circles. Carries E6 nemesis entries.
- E4 Genesis and taste: breadcrumb edges, reproduction mix, pins, burial by epoch; judge craft with gates G1-G4 (total T at least 0.65).
- E5 Origin and sky: world position = sector (BigInt64) + orbital (Float64) + local (Float16); multi-star gravity and coherent light. Feeds the solar and planet screens (W5).
- E6 Soul and body: archetypes, 14-zone somatic stiffness and cascade, nemesis tiers, indigo operator, lucid spore, rest cycle. Feeds E2 (rollout, rest, grudge) and E3 (nem entries).
- E7 Bridge and host: day satisfaction and reputation, weight-to-cartridge bridge, child seed, SDK entity budget, VRAM tiering.
- Build order: E2 calls into E6 only through sq-jepa, which is built last in W4, so that order is consistent. Six R1 names have no wave (finding 46).

### E1 Substrate
- Inputs clamped to [0,1]. rho(V) = 1e-4 * (2.5e8)^V kg/m^3. Inverse V(rho) = ln(clamp(rho, 1e-4, 25000)/1e-4) / ln(2.5e8), in [0,1]. The card divides by ln(25000), which does not invert rho(V) (finding 1).
- E(P) = Emin * (Emax/Emin)^P with Emin = 0.1 MPa and Emax = 1200 MPa (ratio 12,000). P(E) is its exact inverse. The card's 1e-4 GPa and 1200 MPa must be put in one unit (finding 3).
- The card's Osmium/Diamond example (1050 GPa) is 875x above the cap, so it is clamped (finding 2).
- sigma_cond = clamp01(Lx). C_p = 120 + 4080 * clamp01(Aq) J/(kg K), range [120, 4200].
- p_eff = max(1e-3, 0.08*P, p_atm)^0.08. The term 0.08*P is unitless against p_atm in atm. At p_atm = 0 the floor gives 0.5754, not 0 (finding 6).
- T_melt = (50 + 3650*P*(1 - 0.35*Aq)) * p_eff; T_boil = T_melt + (300 + 2500*(0.6P + 0.4V)) * p_eff; T_plasma = T_boil + 4000*(1.1 - 0.5L), where the 4000 term is not scaled by p_eff (finding 8). Reading P, V, L, A as Pxd, Vtx, Lx, Aq is an assumption.
- VSA: 4096 bits = Uint32Array(128) = 512 B. The card's Uint32Array(64) holds 2048 bits (finding 4). Bind = XOR. Similarity s = 1 - 2*popcount(a XOR b)/4096 in [-1,1] is inferred; the card gives no formula (finding 5).
- SI normalizer: no map from Four Floats to massKg, thrustN, powerW, torqueNm (finding 7).

### E2 Kernel
- State x = Float32Array(24) with the card's indices. Pi entries must be above 0. MU and eps are 4-vectors.
- Step: NOT regrown. J, R, M, H, G, u_policy, dt and gradH are absent. The card form is not the implicit midpoint rule. On an admissible test (J skew, R = 0, M = I, H = |x|^2/2) the midpoint rule keeps H = 0.5 while the card form gives 0.4950 per step (finding 9).
- eps = y_in - mu. L_KL = 0.5 * eps' diag(Pi) eps + 0.5 * sum_i (r_i - ln r_i - 1), r_i = Pi_i/Pi0_i. Each term is at least 0 when Pi, Pi0 > 0 (algebra). The value of Pi0 is absent.
- Energy E = L_KL + 0.1*strain + 2*debt + 1.5*grudge, at least 0 if strain, debt, grudge are at least 0.
- Roll k = 0..K and stop when E <= 1e-9. Compute E in float64. In float32 an exact E of 5.0e-9 evaluates to 0 and the test passes early (finding 12).
- Horizon K = max(K_req, ceil(strain/25) + 4, debt + 4). K_req is not given and K has no upper bound (finding 13).
- Index 6-23 units and ranges are partly absent (finding 11). Frame of QX-QZ is not stated (finding 14).

### E3 Codec and community gate
- Record: ASCII, at most 4096 B. Body lines trimmed, joined by "\n", no trailing newline. crc32 = IEEE-802.3. crcValid compares hex strings, but the hex format is not given (finding 15).
- m: of, hard, bal, inv in [0,1]; ch = r1..r7 declared Int8, which cannot hold fractions (finding 16); cyc int.
- Caps: me 32 (top 4 by ex, then 28 newest), mc 16, mb 14 (one per zone), nem 8 (highest grudge). Per-line byte sizes are absent, so the 4096 B budget cannot be checked (finding 17).
- nem tier = TIERS[min(4, ceil(score))] with score in [0,10]. Everything above score 3 is SOVEREIGN_NEMESIS (finding 18). resist = elem:id:v with v in [0, 0.85], split on the last ":".
- Gate A1: F_thrust <= min(250*m_kg, 0.45*P_in_W), as N. The power term has no W-to-N conversion (finding 19). P_in = 0 gives 0 N.
- A2/A3: four folds are undefined. A4: payload at most 4096 B; reject executable and prototype tokens (token list absent); reject loops with cycle gain at least 1.0 (procedure absent) (finding 20).
- Circles: H = clamp01((1/7) * sum_r max_{m in Circle} ray_{m,r} + Delta - 0.85*min(N_STO, N_STS)/max(1, N_total)). Circle must be non-empty. STO, STS and Delta are undefined (finding 21).

### E4 Genesis and taste
- Breadcrumb E(c,b) = (0.55*cos(s_c, s_b) + 0.45*|P_c and P_b|/max(1, |P_b|)) * max(0, 1 - 0.85*max(0, N_niche(b)/max(1, N_total) - 1/max(1, K_niches))). The s-vector dimension is absent (finding 23).
- Reproduction: s_child = clamp[0.05, 0.98](0.72*(0.60*s_M + 0.40*s_P) + 0.28*s_niche + 0.045*xi). Mix weights sum to 1. The distribution of xi is absent (finding 23).
- Pins: at most 6 active; socketsRequired = pins.length; prune lowest-utility excess (utility undefined).
- Burial z = (E_max - e)*Delta_z + z0 [m], where E_max is an epoch count and collides with E1's E_max (finding 24).
- G1: hasRootChassis and socketsConnected >= socketsRequired.
- G2 zero-G (safeG < 0.05): tau = |(r_CoM - r_thrust) x n| (or |r_CoM - r_thrust| if |n| <= 1e-9); S_stab = clamp01(1 - tau/(2*max(1e-3, r_RCS))); pass if S_stab >= 0.50. The card says <= 0.50 (finding 22).
- G2 planetary (safeG >= 0.05): w0 = sqrt(g/max(1e-3, h)); xi = |x_xz| + |v_xz|/w0; S_stab = clamp01(1 - xi/(2.2*max(1e-3, r_support))); pass if S_stab >= 0.50. safeG and the other inputs are undefined (finding 25).
- G3: S_sym = max(0, 1 - 2*|mL - mR|/max(1e-9, mL + mR)). G4: S_prop = max(0, 1 - min over t in {1, sqrt2, phi} of |ar - t|); the aspect convention is absent (finding 26).
- Total T = 0.40*S_stab + 0.35*S_sym + 0.25*S_prop >= 0.65. Weights sum to 1.

### E5 Origin and sky
- P_world = S_sector * 2^17 m + O_orbital + x_local. 2^17 m = 131,072 m = 256*512 m. S_sector spans +-2^63 sectors, i.e. +-2^80 m = +-1.278e8 ly, which matches the card.
- S_sector: BigInt64Array(3). O_orbital: Float64Array(3) in [-65536, 65536) m. The width 2^17 matches the sector quantum.
- x_local: Float16 in (-512, 512) m. Spacing is 0.25 m at |x| in [256, 512), 0.98 mm at [1, 2), 7.8 mm at 10 m. The "quantum 512 m" note conflicts. Use Float64 for sub-mm precision (finding 27).
- Jump: delta converted to BigInt by truncation; non-finite values silently become 0n. Carry rule for overflow of O and x is absent (finding 30).
- g_net(q) = sum_k G*M_k*(q_k - q) / max(1e-6, |q_k - q|^2)^(3/2): attraction toward q_k. The card's (q - q_k) gives repulsion (finding 28). G and M_k are absent.
- L_coh(q,t) = |sum_k sqrt(L_k)/max(1e-3, r_k) * exp(i*(kappa_k*r_k + phi_k(t)))|^2 with kappa_k = omega_k/c. Output is at least 0 but unbounded, while Lx is in [0,1] (finding 29).

### E6 Soul, body and nemesis
- Archetypes: Mind 1-7, Body 8-14, Spirit 15-21, Fool 22 (22 total). The card prints #11 twice and omits #12 (finding 32).
- Somatic: 14 zones (rays 1-7 x L/R). Hold = rays 1-3, ache = rays 4-6. Ray 7 has no role (finding 33).
- kappa = min(1, 0.18*ticks), ticks an int >= 0. Runaway if stage = runaway or kappa >= 0.85 (5 ticks). Stride gain = 1 - 0.55*kappa in [0.45, 1].
- Release: SHARP_PAIN with mc open = 1 gives rebound 0.35; EUREKA with open = 0 gives stiffness 0. Other release rules and the clear/congested/inflamed thresholds are absent (finding 33).
- Cascade: Sigma = sum_z kappa_z in [0, 14]. Hibernate if at least 3 zones are runaway or Sigma >= 2.2. E_vent = 18.5*Sigma J, with no sink (finding 35).
- Nemesis: temper multipliers HOTHEAD 1.4, PROUD 1.25, COLD 1.3, others 1.0 (target absent). X-ray: resist += 0.35, capped at 0.85. Grudge increments per tier are absent (finding 37).
- Indigo: I = 0.55*bal + 0.45*(Will x Faith) >= I_min in {0.65, 0.75, 0.80}. Spend 85% ambient and 15% vital above the 5 J floor; deficit goes to strain. Cost absent (finding 36). Conservation check needs a tolerance (finding 34).
- Lucid spore: veil -0.55; ego x0.35; wisdom +0.30; draw 45 J (vital plus strain deficit); debt += 2^min(6, n-1), so at most 64.
- Rest cycle: debt = max(0, debt - 1); vital = clamp(vital + 30, 5, 100); strain = max(0, strain - 25); hibernation cleared when strain < 20 J.

### E7 Bridge and host
- SDK: S_day = 0.40*a + 0.20*e + 0.20*q + 0.20*v, with inputs assumed in [0,1]. Input definitions are absent (finding 44).
- Reputation: R' = clamp01(R + 0.3*(S - 0.5)). The card's +0.5 makes reputation rise for any S in [0,1]: 0.50, 0.65, 0.80, 0.95, 1.00 after four zero days (finding 40).
- Bridge: the map from four invariants to four Four Floats is absent (finding 44). dH = 0.5*(Lx + Aq)*Sincerity*(1 + 0.5*Catalyst) in [0, 1.5]. Progress' = min(1, Progress + 0.18*dH). The card's max(1.0, ...) is a floor (finding 41).
- Child seed at S6 when H_SMC >= 0.95: seed = (round(1000*Pxd) XOR round(10000*Lx) XOR 0x4D4E4557) >>> 0. At most 10,240 distinct seeds, and Vtx and Aq are ignored (finding 42).
- Host: 64 entities at 60 Hz. "6,000 agents in < 0.5 ms" is 83 ns per agent with no evidence (finding 43).
- Governor: VRAM < 4 -> Tier 1; < 16 -> Tier 2; else Tier 3. GB vs GiB is not stated (finding 45). simulationStage is not downgraded.

## Findings from regrowth

Types: CONFLICT, GAP, UNSUPPORTED, MATH. Candidate ORNAMENT items are recorded as GAP (rows 11, 38) because the output type list does not include ORNAMENT.

| # | Element / card line | Type | Finding | Evidence | Computed by code? | Severity |
|---|---|---|---|---|---|---|
| 1 | E1 Operators, V(rho) | CONFLICT | V(rho) divides by ln(rho_max); the inverse of rho(V) = rho_min*(rho_max/rho_min)^V needs ln(rho_max/rho_min). The stated inverse does not invert, and V(rho_max) exceeds 1. | node: card V(rho_max) = 1.9095 (corrected 1.0000). H2 0.08988 gives card V = 0.6716, rho = 43.66 kg/m^3; corrected V = 0.3517, rho = 0.08988 | y | H |
| 2 | E1 State l.122; example l.120 | CONFLICT | "Osmium and Diamond (E = 1050 GPa)" is above E_max = 1200 MPa. The clamp caps it silently, so the plan's named extreme does not fit its range. | 1050 GPa = 1,050,000 MPa; divided by 1200 = 875 | y | H |
| 3 | E1 State l.122 | MATH (units) | E_min is given in GPa and E_max in MPa "as written". E_max/E_min is 1.2e7 if read literally and 12,000 in one unit, a factor of 1000. | node: 1200/1e-4 = 1.2e7; 1200/0.1 MPa = 12,000 | y | M |
| 4 | E1 VSA-4096 | MATH (type) | Uint32Array(64) holds 2048 bits (256 B), not 4096 bits. The card's own 512 B needs Uint32Array(128). | node: 64*4 = 256 B; 64*32 = 2048 bits; 4096 bits = 512 B | y | H |
| 5 | E1 VSA similarity | GAP | "s in [-1,1]" is stated with no formula. d/D gives [0,1]. The mapping s = 1 - 2d/D is inferred. | derivation | n | M |
| 6 | E1 Operators, p_eff | MATH (units) | 0.08*P is unitless and sits in max() with p_atm in atm. At p_atm = 0 (vacuum) p_eff = 0.5754 from the floor, not 0. Intent not stated. | node: (1e-3)^0.08 = 0.5754 | y | L |
| 7 | E1 SI normalizer, triad sockets | GAP | Outputs massKg, thrustN, powerW, torqueNm have no formula or input map. The E3 gate (A1) and E4 G2 need them. | card lists outputs only | n | M |
| 8 | E1 Operators, T_plasma (l.124) | GAP | The term 4000*(1.1 - 0.5L) is not scaled by p_eff, unlike the T_melt and T_boil terms. Intent not stated. | card | n | L |
| 9 | E2 Operators, Step (l.79) | UNSUPPORTED | Passivity is not derivable. The card form is not the implicit midpoint rule for xdot = (J-R) gradH; it adds an unexplained factor (I - dt/2 (J-R) M^-1)^-1. J, R, M, H, G, u_policy and dt are absent. The form loses energy on an admissible case. | node: J = [[0,1],[-1,0]], R = 0, M = I, H = |x|^2/2, dt = 0.1, x0 = (1,0). Midpoint H1 = 0.5000; card form H1 = 0.4950 | y | H |
| 10 | E2 Operators, Loss and Energy (l.326, l.335) | GAP | Pi0 value and unit absent. Dimension of y_in (hence eps) absent. Pi_i <= 0 or Pi0_i <= 0 makes ln undefined; no guard. | card | n | M |
| 11 | E2 State, indices 6-23 | GAP | Unit and range missing for XI_X and XI_Z, MU (4), PI (4), A_AWARE, D_DISTORT, LAMBDA_FTLE, H_COHERENCE. This breaks the card's own required field. A_AWARE, D_DISTORT, LAMBDA_FTLE, H_COHERENCE, H_IK, E_THERMAL, E_RESERVE and XI are read by no operator on the card (candidate ORNAMENT). | card state list against operators | n | M |
| 12 | E2 Stop (l.335), E <= 1e-9 | MATH | Float32 noise exceeds the threshold. Exact r - ln r - 1 at r = 1+1e-4 is 5.0e-9, but float32 evaluates it to 0, so the test passes early. At r = 1+1e-3 float32 is off by 2.3e-8 (4.6%). | node with Math.fround: d = 1e-4 gives exact 5.000e-9, float32 0; d = 1e-3 gives exact 4.997e-7, float32 4.768e-7 | y | M |
| 13 | E2 Horizon (P8, R24 row) | GAP | K_req is undefined. K has no upper bound. Units of the divisor 25 and of debt are absent. | card | n | L |
| 14 | E2 State, QX-QZ [m] | GAP | Frame (local or world) is not stated. If world-scale, float32 spacing is 3.9 mm for x in [2^15, 2^16), so E5's sub-mm precision is lost. | node: 2^(15-23) = 0.00390625 m | y | L |
| 15 | E3 State, crc32 and crcValid (l.53) | GAP | The hex format (case, 0x prefix, width) is not stated. === on strings fails for lowercase or unpadded values. The card example uses 0x499A7731. | card | n | M |
| 16 | E3 State, ch = 7 Int8 vs ch = r1..r7 and H_circle | CONFLICT | Int8 cannot hold fractional rays, but H_circle = clamp01(...) assumes [0,1]-scale rays. Scale not stated. | node: Int8 of 0.35 and 0.85 gives 0 and 0 | y | M |
| 17 | E3 Caps (me 32, mc 16, mb 14, nem 8) vs 4096 B | GAP | Per-line bytes are absent, so cap x item size <= 4096 cannot be run. With every cap full, the mean line must be at most 58.5 B. | node: 4096/70 = 58.51 | y | M |
| 18 | E3 Tier map (l.183) | CONFLICT | TIERS[min(4, ceil(score))] saturates. Scores 3.01 to 10 all map to SOVEREIGN_NEMESIS, which is 70% of the stated [0,10] range. The score increment rule is absent (see 37). | node: 3 gives MURDEROUS, 3.01 gives SOVEREIGN; top-tier share 0.699 | y | M |
| 19 | E3 Gate A1 (l.216) | MATH (units) | min(250*m_kg, 0.45*P_in_W) is labelled [N]. A power in W is not a force, and W = N*m/s needs a velocity. The unit of 250 (N/kg) is not stated. | dimensional analysis | n | H |
| 20 | E3 Gates A2 to A4 (l.217-218) | GAP | The four folds are undefined. The token list, the DFS and cycle-gain procedure, and the meaning of coerciveOverride are absent. | card | n | M |
| 21 | E3 Circles (l.220) | GAP | N_STO, N_STS and Delta_complement are undefined, so the sign of the penalty cannot be checked. An empty Circle makes the max undefined (Math.max() = -Infinity). | card; JS Math.max() of nothing | n | M |
| 22 | E4 Taste G2 (l.143-145) | CONFLICT | The zero-G gate requires S_stab <= 0.50 but the planetary gate requires S_stab >= 0.50, for the same S_stab, which rises with stability. A thrust-aligned zero-G craft has S_stab = 1 and fails the zero-G gate. | node: tau = 0 gives S = 1; 1 <= 0.5 is false | y | H |
| 23 | E4 Breadcrumb (l.133) and Reproduction (l.137) | GAP | s-vector dimension, range and source are absent. xi_symplectic's distribution and scale are absent. The breadcrumb cosine can be negative, so E can be negative unless s >= 0. The 1e-9 guard distorts cosine for small norms. | card | n | M |
| 24 | E4 Burial (l.139) | GAP | E_max is an epoch count here, undefined on the card, and shares the name with E1's E_max (1,200 MPa). Delta_z_epoch and z0 are undefined. | card (name collision) | n | M |
| 25 | E4 G2 inputs (l.143-145) | GAP | safeG (the branch selector), r_RCS, r_support, h_CoM, g_planet, r_thrust, n_thrust and v_nominal are undefined. How safeG relates to g_planet is not given. | card | n | M |
| 26 | E4 G4 (l.144) | GAP | The aspectRatio convention is absent. The set {1, sqrt2, phi} is not closed under reciprocal, so the convention changes the score. The card's rounded 1.414 and 1.618 are off by 2.1e-4 and 3.4e-5. | node: abs(sqrt2 - 1.414) = 2.14e-4; abs(phi - 1.618) = 3.40e-5 | y | L |
| 27 | E5 State, x_local (l.204-206) | MATH | Float16 spacing is 0.25 m for |x| in [256, 512), 0.98 mm at 1 m and 7.8 mm at 10 m. It cannot hold the sub-mm offsets that the Float64 claim is meant to protect. The "quantum 512 m" note conflicts with the (-512, 512) range. | node: 0.25 m at 256, 300 and 511 m; 9.77e-4 m at 1 m; 7.8e-3 m at 10 m | y | H |
| 28 | E5 Operators, g_net (l.206) | CONFLICT | The numerator (q - q_k) points away from the source, so gravity repels. Attraction needs (q_k - q). | node: G = M = 1, q = 1, source at 0 gives +1 (away) | y | H |
| 29 | E5 Operators, L_coh (l.206) | CONFLICT | The output |sum|^2 is unbounded. Two unit sources at r = 1e-3 in phase give 4e6, while Lx is in [0,1]. No clamp or normalisation is given. | node: (2*1/1e-3)^2 = 4e6 | y | M |
| 30 | E5 Coordinates and jumps (l.197-204) | GAP | The carry rule when O_orbital + x_local leave range (up to 512 m beyond) is absent. BigInt64 overflow behaviour is absent. Non-finite deltas silently become 0n. | card | n | M |
| 31 | E5 Constants (l.206) | GAP | G, M_k, omega_k, c_carrier, phi_k(t) and the source count K are absent. | card | n | L |
| 32 | E6 Archetypes (l.160-167) | CONFLICT | The body column prints #11 for stations 4 and 5 and omits #12. The card states 22 archetypes but lists 21 distinct IDs. | node: 22 items, 21 distinct, missing 12 | y | M |
| 33 | E6 Somatic (l.173-177) and release rules | GAP | Ray 7 has no role. Stage thresholds for clear, congested and inflamed are absent. Release rules other than SHARP_PAIN and EUREKA are absent. | card | n | M |
| 34 | E6 Indigo conservation (l.316-317) and Lucid spore (l.319) | MATH | "conservationErrorJ === 0.0" and "drawn + deficit === 45.0" are exact float tests. The indigo multiplicative 85/15 split leaves a nonzero residue for 107 of 951 values of X in [5, 100]. The spore additive split passed 10,000 random trials, so the risk is the multiplicative split. Use a tolerance. | node: 107 of 951 residues nonzero for 0.85X + 0.15X - X | y | M |
| 35 | E6 Cascade (l.175-176) | GAP | E_vent = 18.5*Sigma J has no sink. The energy invariant (conservationErrorJ = 0) breaks unless E_vent is booked to a named store. | card | n | M |
| 36 | E6 Indigo and spore inputs (l.316-319) | GAP | The indigo cost is absent. Ranges of Will and Faith are absent. "Will x Faith" is ambiguous (product or cross). Spore n is undefined. The spore draw-versus-deficit rule, including whether it respects the 5 J floor, is absent. | card | n | M |
| 37 | E6 Nemesis (l.181-190) | GAP | The grudge increment per tier step is absent, and the E3 tier map depends on it. The target of the temper multiplier is absent. The unit of town tension is absent. | card | n | M |
| 38 | E6 Polarity (l.170-171) | GAP | Weights 0.72, 0.76, 0.74 and 0.78 have no consumer on the card (candidate ORNAMENT). The pairing rule (Mind #1 with Body #9) is not stated. | card | n | L |
| 39 | E6 Animation (l.192) | GAP | "follow-through >= 5% settle": direction, tolerance and units are unclear. | card | n | L |
| 40 | E7 SDK, reputationAfter (l.222-224) | CONFLICT | R' = clamp01(R + 0.3*(S + 0.5)) adds 0.15 to 0.45 per day for any S in [0,1]. Reputation rises even at S = 0. The neutral point implies the offset should be -0.5. | node: S = 0 path 0.650, 0.800, 0.950, 1.000 | y | H |
| 41 | E7 Bridge, Progress (l.358-360) | CONFLICT | Progress' = max(1.0, Progress + 0.18*dH) is a floor, not a cap. From 0 with dH = 0.5 it becomes 1.0 on the first update. A cap would be min(1.0, ...). | node: max(1, 0.09) = 1 | y | H |
| 42 | E7 Child seed (l.361) | MATH | seed = (round(1000*Pxd) XOR round(10000*Lx) XOR 0x4D4E4557) >>> 0 has at most 10,240 distinct values (maximum XOR 10,239) over 10,011,001 grid pairs, about 978 pairs per seed. It ignores Vtx and Aq. H_SMC is undefined. | node: 10,240 distinct; 10,011,001 pairs | y | M |
| 43 | E7 Host (l.224) | UNSUPPORTED | "6,000 agents in < 0.5 ms" is 83 ns per agent. The card gives no benchmark, hardware or method. | node: 0.5e-3/6000 = 83.3 ns | y | M |
| 44 | E7 Bridge and SDK inputs (l.222-224, l.358-360) | GAP | The map from four invariants to four Four Floats is absent. Sincerity01, CatalystResolved01, arrival01, exit01, queue01 and viewing01 are undefined. | card | n | M |
| 45 | E7 Governor (l.211) | GAP | GB vs GiB is not stated for the 4 and 16 thresholds. Boundaries are otherwise consistent (4 GB gives Tier 2). | card | n | L |
| 46 | Build order (P5 4.2) vs R1 | GAP | No wave for cartridge gate, circles (E3), alchemy-catalyst, magic-indigo, anim-taste (E6), or hudlayout governor (E7). R0 names read-only player translator, self-hosting studio and settings with no R1 element. smc-nexus, voice-lang and rules-litrpg appear in waves but not in R1. | card build list against R1 | n | M |
| 47 | Plan counts (R0 and Counts) | UNSUPPORTED | "4 app screens", "16 package-home rows" and "41 sub-branches" cannot be checked from the cards, which name only the solar and planet screens. Checked: 7 waves = W1 to W7; 14 zones = 7 x 2; 99 + 18 = 117 defects; 22 archetypes fails (see 32). | node: 99 + 18 = 117; 7 waves listed | y | L |

Count: 47 findings (10 H, 27 M, 10 L).

## Notes

What the cards did not give enough to regrow:
- E2 Step (rows 9, 11): J, R, M, H, G, u_policy, dt, gradH and the Pi0 values are absent. Per the skill I stopped at Step and regrew only the Loss, Energy, Stop and Horizon pieces, plus the energy test on Step.
- E2 Horizon: K_req and the units of 25 and debt are absent.
- E3: the example body lines are not on the card, so the crc32 example (0x499A7731) cannot be recomputed. Per-line byte sizes are absent, so the 4096 B budget cannot be run. The four folds, token list and cycle-gain procedure are absent. The Circles terms STO, STS and Delta are absent.
- E4: s-vectors, xi_symplectic, safeG, r_RCS, r_support, h, g_planet, aspectRatio convention, and the Burial constants are absent.
- E5: G, M_k, omega_k, c_carrier, phi_k(t) and K are absent. The carry rule for overflow is absent.
- E6: indigo cost, Will and Faith ranges, spore n, grudge increments, temper target, stage thresholds, ray 7's role, and the E_vent sink are absent.
- E7: the SDK inputs (arrival01, exit01, queue01, viewing01), the bridge compression map, Sincerity01, CatalystResolved01, H_SMC and the GB/GiB unit are absent.
- Numbers the skill's required fields call for (unit and range) are missing for many E2 state entries.

Assumptions I made (flagged, not findings):
- Operators written with P, V, L, A are read as Pxd, Vtx, Lx, Aq.
- IEEE-802.3 CRC-32 is the standard reflected polynomial, zlib-compatible.
- Inputs named with the suffix 01 are assumed to lie in [0,1].

Not checked:
- Step 2 mechanical checks 1 to 13 are not part of this blind pass. Only arithmetic in the card's formulas was run.
- Plan sections cited on the cards (P5 4.1.1, P7 1.2, P8 R24) were not on the card, so they could not be checked.
- R0 "Works when" conditions (genesis to S3, CI scan for banned tokens) have no evidence on the card.
- Float16Array availability depends on the runtime, which the card does not name.
- The E4 zero-G direction is judged from the card's own internal consistency only, not from the plan.

Blind status: blind. No plan text was seen, and no convergence is claimed beyond the findings above.
