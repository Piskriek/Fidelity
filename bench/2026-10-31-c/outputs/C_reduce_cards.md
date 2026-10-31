# Reduce cards (R0-R2): FIDELITY clean-slate universe

Source: PLAN_C.md. "P<n> §x" = Part n, section x. "l.N" = line N of PLAN_C.md. Numbers and formulas are copied as the plan states them.

## R0
A headless, procedurally evolved universe of entities anchored in Four Floats (Pxd, Vtx, Lx, Aq). Contraptions and native AI civilisations self-assemble up to stage S3 from S0a. A read-only player translator, a self-hosting studio, a community cartridge layer and settings sit on top.
Works when: genesis reaches S3 from S0a; shorthand records parse with crcValid === true; the CI scan finds 0 banned tokens (moon_crater, A4-01, leaks, .glb) in packages/ and apps/.

## R1 (7 elements)
- E1 Substrate: maps Four Floats to physical properties and a VSA bus. (elements, units)
- E2 Kernel: integrates state and scores prediction loss with a latent rollout. (kernel, sq-jepa)
- E3 Codec and community gate: serializes, validates and groups shared records. (shorthand, cartridge gate, circles)
- E4 Genesis and taste: evolves presets and judges craft. (genesis, strata, taste)
- E5 Origin and sky: keeps large world coordinates and multi-star fields. (origin64)
- E6 Soul and body: runs archetype mind, 14-zone soma, enRAGE nemesis, restorative and indigo operators, animation. (soul, somatic, nemesis-enrage, alchemy-catalyst, magic-indigo, anim-taste)
- E7 Bridge and host: moves weight between rungs, runs the open host SDK, governs hardware. (universe-bridge, open-host-sdk, hudlayout governor)

Connections: E1 values feed E2 and E4. E2's predictor calls the E6 rest-cycle operator and nemesis reconciliation (P7 §1.2). E3 carries E6 nemesis entries. E5 feeds the solar and planet app screens (P5 §4.1).
Build order (P5 §4.2): W1 port and scaffold; W2 kernel, shorthand, units, elements; W3 genesis, taste, strata; W4 soul, somatic, nemesis-enrage, voice-lang, origin64, rules-litrpg, then sq-jepa last; W5 apps/universe state machine; W6 smc-nexus, open-host SDK, universe-bridge; W7 cross-tier benchmark.

## R2

### E1 Substrate (P1 §2.1-2.2; l.120-128)
State: V_tx, P_xd, L_x, A_q in [0,1] (unitless). rho in kg/m^3. E in GPa (E_min) and MPa (E_max) as written. T in K. p_atm in atm (1.0 = sea level; 0 = space vacuum). sigma_cond unitless. C_p in J/(kg K).
Numbers: rho_min = 1e-4 kg/m^3; rho_max = 25,000 kg/m^3 (l.122). E_min = 1e-4 GPa; E_max = 1,200 MPa (l.122). C_p = 120 + 4080*clamp01(A_q) (l.123). p_eff floor 1e-3, exponent 0.08 (l.124). Examples: H2 = 0.08988 kg/m^3; "Osmium and Diamond (E = 1050 GPa)" (l.120).
Operators:
- rho(V) = rho_min*(rho_max/rho_min)^clamp01(V)
- V(rho) = ln(clamp(rho, rho_min, rho_max)/rho_min) / ln(rho_max)
- E(P) = E_min*(E_max/E_min)^clamp01(P); P(E) = ln(clamp(E, E_min, E_max)/E_min) / ln(E_max/E_min)
- sigma_cond(L) = clamp01(L)
- p_eff(P, p_atm) = (max(1e-3, 0.08*P, p_atm))^0.08
- T_melt = (50 + 3650*P*(1 - 0.35*A))*p_eff; T_boil = T_melt + (300 + 2500*(0.6*P + 0.4*V))*p_eff; T_plasma = T_boil + 4000*(1.1 - 0.5*L) [K] (l.124)
- VSA-4096: Uint32Array(64), stated as 512 bytes. Binding V_A XOR V_B. Normalized Hamming similarity s in [-1,1].
- SI normalizer outputs massKg, thrustN, powerW, torqueNm. Triad sockets: power, signal, fluid, mechanical.

### E2 Kernel (P1 §1.1; P7 §1.1-1.2; l.79-96, 326-335)
State: Four Floats S = (Pxd, Vtx, Lx, Aq) in [0,1]^4. Vector x = Float32Array(24), StateIdx:
- 0-2 QX, QY, QZ [m]; 3-5 PX, PY, PZ [N*s]
- 6 XI_X, 7 XI_Z (3D capture point; unit: not given); 8 H_IK [m]
- 9 E_STRAIN, 10 E_THERMAL, 11 E_RESERVE [J]
- 12-15 MU_PXD, MU_VTX, MU_LX, MU_AQ (generative prior over Four Floats; unit and range: not given)
- 16-19 PI_KIN, PI_THERM, PI_ACOUST, PI_PRIOR (precision tensor diagonal; unit and range: not given)
- 20 A_AWARE, 21 D_DISTORT, 22 LAMBDA_FTLE, 23 H_COHERENCE (unit and range: not given)
Operators:
- Step (l.79): x^{k+1} = x^k + dt*(I - (dt/2)*(J - R)*M^-1)^-1 * (J - R) * gradH((x^k + x^{k+1})/2) + dt*G*u_policy. Passivity under J = -J^T, R >= 0, M > 0.
- Loss (l.326): eps = y_in - mu; L_KL(eps, Pi || Pi0) = (1/2)*eps^T*Pi*eps + (1/2)*sum_{i=1..4} (Pi_i/Pi0_i - ln(Pi_i/Pi0_i) - 1); stated >= 0.
- Rollout (l.333-335): f_theta(x) -> s0 (latent: four floats, Pi, somatic strain, recovery debt, nemesis grudge). g_phi(s_k, z_SQ) -> s_{k+1}: applies 21 SQ antidote presets, restorative duals (v2StepRestAndRecoveryCycle), peace reconciliation; annealing Pi -> Pi0.
- Energy (l.335): E_psi(s_k) = L_KL(eps_k, Pi_k || Pi0) + V_Lyap(debt, strain, grudge) >= 0. Reference V_Lyap = 0.1*strain + 2*debt + 1.5*grudge.
- Stop: roll k = 0..K until E_psi(s_K) <= 1e-9 (convergedInOnePass === true).
- Horizon (P8, R24 row): K = max(K_req, ceil(strain/25) + 4, debt + 4).

### E3 Codec and community gate (P1 §1.2; P5 §1-2; l.98-117, 215-220)
State: record = ASCII block, <= 4096 bytes. ch = 7 Int8 values. crc32 = IEEE-802.3 CRC-32 over body lines (trimmed, joined with "\n", no trailing newline). crcValid = (computedCrcHex === declaredCrcHex).
Grammar and caps:
- m: of, hard, bal, inv in [0,1]; ch=r1..r7; cyc int.
- me: t tick; st Stage; ex, err, h in [0,1]; d, by SQId; src=rule:name; cap 32 (top 4 by ex + 28 most recent).
- mc: by, d, n count, open 0|1; cap 16.
- mb: z=1..7:L|R (14 zones); held SQId; ache 4..6; stage clear|congested|inflamed|runaway; ticks int; rebound in [0,1]; cap 14.
- nem: vs actorId; tier NONE|RESENTFUL|VENGEFUL|MURDEROUS|SOVEREIGN_NEMESIS; score in [0,10]; temper HOTHEAD|PROUD|COLD|COWARD|GREEDY|LOYAL|DRIFTER; scar zone|none; resist=elem:id:[0,0.85]; cap 8 (highest grudge).
- Tier map (l.183): tier = TIERS[min(4, ceil(score))], TIERS = [NONE, RESENTFUL, VENGEFUL, MURDEROUS, SOVEREIGN_NEMESIS].
- Seam (l.116): nemesisEntry.score -> score=; resist = resistKey:resistVal (split on last ':').
- Example (l.101-107): five body lines then "#TAIL|schema:hm:universe:v2|crc32:0x499A7731".
Cartridge gate (P5 §1; l.216-218):
- A1: F_thrust <= min(250*m_kg, 0.45*P_in_W) [N]; P_in = 0 gives 0 N.
- A2/A3: 4 internal folds; coerciveOverride !== true.
- A4: reject payload > 4096 bytes and executable/prototype tokens; DFS rejects @hm/wiregraph loops with cycle gain >= 1.0.
Circles (P5 §2; l.220): H_circle = clamp01( (1/7)*sum_{r=1..7} max_{m in Circle} ray_{m,r} + Delta_complement - 0.85*min(N_STO, N_STS)/max(1, N_total) ).

### E4 Genesis and taste (P2 §1-2; l.133-146)
Breadcrumb (l.133): E(c,b) = (0.55*(s_c . s_b)/max(1e-9, |s_c||s_b|) + 0.45*|P_c ∩ P_b|/max(1, |P_b|)) * max(0, 1 - 0.85*max(0, N_niche(b)/max(1, N_total) - 1/max(1, K_niches))).
Reproduction (l.137): s_child = clamp_[0.05,0.98]( 0.72*(0.60*s_Matrix + 0.40*s_Potentiator) + 0.28*s_nicheAttractor + 0.045*xi_symplectic ).
Pins (l.138): active pins <= 6; socketsRequired = pins.length; lowest-utility excess pruned.
Epochs: 1,000+ (l.135). Burial (l.139): z_burial(e) = (E_max - e)*Delta_z_epoch + z0 [m].
Taste gates (l.141-146):
- G1: hasRootChassis && socketsConnected >= socketsRequired.
- G2 zero-G (safeG < 0.05): tau = |(r_CoM - r_thrust) x n_hat| if |n_thrust| > 1e-9, else |r_CoM - r_thrust|; S_stab = clamp01(1 - tau/(2*max(1e-3, r_RCS))) <= 0.50.
- G2 planetary (safeG >= 0.05): w0 = sqrt(g_planet/max(1e-3, h_CoM)); xi = |x_CoM,xz| + |v_nominal,xz|/w0; S_stab = clamp01(1 - xi/(2.2*max(1e-3, r_support))) >= 0.50.
- G3: S_sym = max(0, 1 - 2*|m_L - m_R|/max(1e-9, m_L + m_R)).
- G4: S_prop = max(0, 1 - min over t in {1.0, 1.414, 1.618} of |aspectRatio - t|).
- Total (l.146): T = 0.40*S_stab + 0.35*S_sym + 0.25*S_prop >= 0.65.

### E5 Origin and sky (P4 §1; l.197-206)
Coordinates: P_world = S_sector * 2^17 m + O_orbital + x_localSelf.
- S_sector: BigInt64Array(3); quantum 2^17 m = 131,072 m = 256*512 m; stated span ±1.28e8 ly = 2^63 * 2^17 m.
- O_orbital: Float64Array(3) in [-65536, +65536) m.
- x_localSelf: Float16Array(3) in (-512, +512) m; quantum 512 m.
- Jump tuple (deltaSectorsBigInt, deltaSubSectorF64); conversion typeof x === 'bigint' ? x : Number.isFinite(x) ? BigInt(Math.trunc(x)) : 0n. Plan states Float64 "never swallows sub-millimeter offsets" (l.204).
Multi-star (l.206): g_net(q) = sum_k G*M_k*(q - q_k) / max(1e-6, |q_k - q|^2)^(3/2).
Coherent light: L_x,coherent(q,t) = | sum_k sqrt(L_x,k)/max(1e-3, |q_k - q|) * exp(i*(k_k*|q_k - q| + phi_k(t))) |^2, with k_k = omega_k / c_carrier.

### E6 Soul, body and nemesis (P3 §1-4; P6 §1-2; l.156-193, 315-320)
Archetypes (l.160-167): stations 1-7; Mind #1-#7 (Magician, High Priestess, Empress, Emperor, Hierophant, Lovers, Chariot). Body column as printed: station 1 #8, 2 #9, 3 #10, 4 #11 The Enchantress, 5 #11 The Hanged Man, 6 #13, 7 #14. Spirit #15-#21 for stations 1-7. #22 The Fool (choice).
Polarity (l.170-171): masculine Mind #1 (willStructureWeight 0.72), Body #9 (kineticPrecisionGain 0.76); feminine Mind #2 (intuitionFlowWeight 0.74), Body #8 (somaticHomeostasisRate 0.78).
Somatic (l.173-177): 14 zones (rays 1-7 x L/R); hold rays 1-3, ache rays 4-6.
- kappa_stiff = min(1, 0.18*ticks) (DULL_ACHE). SHARP_PAIN: rebound = 0.35 when released with mc open=1. EUREKA: stiffness 0 when released with mc open=0.
- Runaway: stage = runaway or kappa_stiff >= 0.85.
- Cascade: Sigma = sum_{z=1..14} kappa_z. If >= 3 zones runaway or Sigma >= 2.2: safeHibernationMode = true; E_vent = 18.5*Sigma [J].
- Stride gain: 1 - 0.55*kappa_stiff. Animation: anticipation -15%; active drive +8% overshoot; follow-through >= 5% settle (l.192).
Nemesis (l.181-190): temper multipliers HOTHEAD 1.4, PROUD 1.25, COLD 1.3, COWARD/GREEDY/LOYAL/DRIFTER 1.0. severity01 in [0,1]; severity 0 adds 0.0. grudgeScore increments across NONE -> RESENTFUL -> VENGEFUL -> MURDEROUS -> SOVEREIGN_NEMESIS. Mask law: if actorWoreMask === false, grudge does not attach to actorId; +0.25 to town tension. X-ray: resistVal +0.35, capped 0.85. nemesisEntry = {vs, tier, score, temper, scar, resistKey, resistVal}. PEACE_TELEGRAM_RECONCILE or forgiveness: grudgeTier = NONE, mc open=0, Symbiotic Ally.
Indigo (P6 §1; l.316-317): I = 0.55*bal_rays + 0.45*(Will x Faith) >= I_min: SPIRAL_1 0.65, SPIRAL_2 0.75, SPIRAL_3 0.80. Spend: 85% from E_ambient, 15% from vitalReserveJoules above the 5.0 J floor; any deficit to somaticStrainJoules; conservationErrorJ === 0.0 J.
Lucid spore (P6 §2; l.319): veil -0.55; ego hardness x0.35; wisdom +0.30; 45 J (drawnFromVitalJ + deficitToSomaticStrainJ === 45.0 J); recovery debt 2^min(6, n-1).
Rest cycle (l.320): recoveryCyclesDebt -1 (unrecoveredDoses = 0 at debt 0); vitalReserveJoules +30 J clamped [5, 100] J; somaticStrainJoules -25 J to 0 J; safeHibernationMode cleared when strain < 20 J.

### E7 Bridge and host (P5 §3, §4.1; P7 §4; P4 §2; l.207-211, 221-224, 266, 357-361)
SDK (l.222-224): daySatisfaction(d) = 0.40*arrival01 + 0.20*exit01 + 0.20*queue01 + 0.20*viewing01; reputationAfter(R_prev, S_day) = clamp01(R_prev + 0.3*(S_day + 0.5)). 64 focused entities at 60 Hz; 24 Float32Array cohorts; "6,000 agents in < 0.5 ms" (l.224).
Bridge (l.358-360): weight invariants structuralSparsity01, spectralNormDensity01, attentionEntropyClarity01, empathyAlignment01 compressed into [Pxd, Vtx, Lx, Aq] soul cartridges. dH = 0.5*(Lx + Aq)*Sincerity01*(1 + 0.5*CatalystResolved01); Progress_4D_next = max(1.0, Progress_4D + 0.18*dH).
Child universe: when H_SMC >= 0.95 (S6), seed at S0a = ((round(1000*Pxd) ^ round(10000*Lx) ^ 0x4D4E4557) >>> 0).
Hardware governor (P4 §2; l.211): maxTierByVram: <4 GB -> Tier 1; <16 GB -> Tier 2; >=16 GB -> Tier 3; simulationStage (S0a..S6) is not downgraded.

## Counts stated in the plan
7 primary branches; 41 sub-branches (P2 diagram, l.19-64); 22 archetypes; 14 zones; 7 build waves; 4 app screens; 16 package-home rows (P5 §4.1.1); 117 defects logged (99 closed, 18 open; P8).
