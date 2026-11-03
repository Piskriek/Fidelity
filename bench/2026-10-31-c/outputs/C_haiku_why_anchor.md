# C_haiku_why_anchor

Blind teleology pass over C_reduce_cards.md (R0-R2 cards). Purposes are inferred from rule names and context only. Arithmetic checked with node -e.

## Teleology table

T01 R0 genesis reaches S3 from S0a :: why="universe must actually develop" :: as written: stage-reach acceptance gate, no metric given :: verdict: UNCLEAR
T02 R0 shorthand crcValid === true :: why="only intact records count as valid" :: as written: boolean acceptance gate :: verdict: SERVES
T03 R0 CI scan for moon_crater, A4-01, leaks, .glb :: why="no internal names ship" :: as written: 0 hits required in packages/ and apps/, four listed tokens :: verdict: SERVES
T04 R1 build order W1-W7 :: why="inputs exist before consumers" :: as written: kernel (W2) calls E6 operators built in W4, but sq-jepa is placed last in W4 after soul; nemesis grammar (W2) precedes nemesis data (W4) :: verdict: SERVES
T05 E1 state domain V_tx, P_xd, L_x, A_q in [0,1] :: why="normalised latent floats" :: as written: unitless clamp range :: verdict: SERVES
T06 E1 unit declarations (rho kg/m^3; E in GPa for E_min, MPa for E_max; T K; p_atm atm; C_p J/(kg K)) :: why="one unit per quantity" :: as written: E bounds stated in two different units :: verdict: CONTRADICTS (C03)
T07 E1 rho bounds 1e-4 to 25,000 kg/m^3 :: why="span gas to dense metal" :: as written: bounds with H2 = 0.08988 example :: verdict: SERVES
T08 E1 rho(V) = rho_min*(rho_max/rho_min)^clamp01(V) :: why="float to log density" :: as written: log-interpolated, bounded :: verdict: SERVES
T09 E1 V(rho) = ln(clamp(rho)/rho_min)/ln(rho_max) :: why="recovers float from density" :: as written: denominator is ln(rho_max), not ln(rho_max/rho_min); V reaches 1 at rho = 2.5 kg/m^3 and exceeds 1 above it :: verdict: CONTRADICTS (C01)
T10 E1 E(P) = E_min*(E_max/E_min)^clamp01(P) :: why="float to log stiffness" :: as written: log-interpolated, bounded :: verdict: SERVES
T11 E1 P(E) = ln(clamp(E)/E_min)/ln(E_max/E_min) :: why="recovers float from stiffness" :: as written: exact inverse of E(P) on the clamp range :: verdict: SERVES
T12 E1 E_min = 1e-4 GPa, E_max = 1,200 MPa :: why="stiffness span up to diamond" :: as written: E_max is 1.2 GPa, so the card's own 1050 GPa example clamps to P = 1 :: verdict: CONTRADICTS (C02)
T13 E1 sigma_cond = clamp01(L) :: why="conductivity follows L float" :: as written: direct clamp :: verdict: SERVES
T14 E1 C_p = 120 + 4080*clamp01(A_q) :: why="heat capacity metal to water" :: as written: 120 to 4200 J/(kg K) :: verdict: SERVES
T15 E1 p_eff = (max(1e-3, 0.08*P, p_atm))^0.08 :: why="pressure shifts phase temperatures" :: as written: 1 at sea level; 0.575 to 0.817 in vacuum depending on P; the 0.08*P term is not explained by the card :: verdict: SERVES
T16 E1 T_melt = (50 + 3650*P*(1-0.35*A))*p_eff :: why="melt rises with stiffness" :: as written: 28.8 K to 3700 K before pressure; higher A_q lowers melt :: verdict: SERVES
T17 E1 T_boil = T_melt + (300 + 2500*(0.6P + 0.4V))*p_eff :: why="boil sits above melt" :: as written: gap is at least 300*p_eff, so boil is always above melt :: verdict: SERVES
T18 E1 T_plasma = T_boil + 4000*(1.1 - 0.5L) :: why="plasma sits above boil" :: as written: gap 2400 to 4400 K, shrinks with L, not pressure-scaled :: verdict: UNCLEAR
T19 E1 VSA-4096 as Uint32Array(64) :: why="4096-bit hypervector" :: as written: 64 x 4 bytes = 256 bytes = 2048 bits; card states 512 bytes :: verdict: CONTRADICTS (C04)
T20 E1 binding V_A XOR V_B :: why="reversible dissimilar binding" :: as written: self-inverse, so unbinding recovers operands :: verdict: SERVES
T21 E1 normalised Hamming similarity s in [-1,1] :: why="unrelated vectors score near zero" :: as written: range stated, formula not printed :: verdict: SERVES
T22 E1 SI normaliser outputs massKg, thrustN, powerW, torqueNm :: why="physical units for contraptions" :: as written: names only, no formula :: verdict: UNCLEAR
T23 E1 triad sockets power, signal, fluid, mechanical :: why="typed connectors" :: as written: four types listed, no rule :: verdict: UNCLEAR
T24 E2 state S = (Pxd, Vtx, Lx, Aq) in [0,1]^4 :: why="kernel uses normalised floats" :: as written: four floats in unit box :: verdict: SERVES
T25 E2 x = Float32Array(24) with StateIdx map :: why="one flat state vector" :: as written: indices 0 to 23 cover 24 slots exactly :: verdict: SERVES
T26 E2 indices 0-5 QX..PZ :: why="position and momentum" :: as written: metres and N*s, no ranges :: verdict: SERVES
T27 E2 indices 6-8 XI_X, XI_Z, H_IK :: why="3D capture point" :: as written: X and Z here, height at index 8 :: verdict: SERVES
T28 E2 indices 9-11 E_STRAIN, E_THERMAL, E_RESERVE :: why="energy stores" :: as written: joules, no ranges :: verdict: SERVES
T29 E2 indices 12-15 MU_PXD..MU_AQ :: why="generative prior over floats" :: as written: unit and range not given :: verdict: UNCLEAR
T30 E2 indices 16-19 PI_KIN..PI_PRIOR :: why="precision weights per channel" :: as written: unit and range not given :: verdict: UNCLEAR
T31 E2 indices 20-23 A_AWARE, D_DISTORT, LAMBDA_FTLE, H_COHERENCE :: why="awareness and coherence signals" :: as written: no units or ranges :: verdict: UNCLEAR
T32 E2 Step: x^{k+1} = x^k + dt*(I - (dt/2)(J-R)M^-1)^-1 (J-R) gradH(mid) + dt*G*u :: why="energy-stable state update" :: as written: M^-1 appears only inside the implicit inverse, gradH at midpoint; passivity claimed for J=-J^T, R>=0, M>0 but not shown :: verdict: UNCLEAR
T33 E2 control term dt*G*u_policy :: why="policy input enters as control" :: as written: added to the step :: verdict: SERVES
T34 E2 L_KL = (1/2) eps^T Pi eps + (1/2) sum (r - ln r - 1), r = Pi/Pi0 :: why="penalise error and precision drift" :: as written: each term nonnegative for Pi > 0 :: verdict: SERVES
T35 E2 rollout f_theta, g_phi over latent s_k :: why="multi-step latent prediction" :: as written: described in words, no formula :: verdict: UNCLEAR
T36 E2 annealing Pi -> Pi0 during rollout :: why="precision relaxes to prior" :: as written: L_KL goes to 0 when Pi equals Pi0 :: verdict: SERVES
T37 E2 V_Lyap = 0.1*strain + 2*debt + 1.5*grudge :: why="scalar measure of unsettled state" :: as written: nonnegative; weights mix J, cycles and score units; no decrease condition stated :: verdict: UNCLEAR
T38 E2 E_psi = L_KL + V_Lyap >= 0 :: why="energy certifies settledness" :: as written: nonnegative sum :: verdict: SERVES
T39 E2 stop when E_psi(s_K) <= 1e-9 :: why="stop once nothing is outstanding" :: as written: needs strain, debt and grudge all zero plus residual about 4.5e-5 or less (Pi near 1); any nonzero grudge never converges :: verdict: CONTRADICTS (C05)
T40 E2 horizon K = max(K_req, ceil(strain/25)+4, debt+4) :: why="enough steps to clear debt" :: as written: one rest removes 25 J and one debt cycle, so horizon matches :: verdict: SERVES
T41 E3 record <= 4096 bytes, ASCII :: why="bounded shareable record" :: as written: size cap, same cap used in A4 :: verdict: SERVES
T42 E3 ch = 7 Int8 values :: why="compact seven-ray channel" :: as written: Int8 with no scale stated for rays in [0,1] :: verdict: UNCLEAR
T43 E3 crc32 IEEE-802.3 over trimmed body lines, no trailing newline :: why="detect corruption" :: as written: trimming ignores edge whitespace, minor blind spot :: verdict: SERVES
T44 E3 crcValid = (computedCrcHex === declaredCrcHex) :: why="accept only intact records" :: as written: string equality; computed hex format (case, 0x prefix) not stated while the example uses 0x499A7731 :: verdict: UNCLEAR
T45 E3 m: of, hard, bal, inv in [0,1]; ch = r1..r7; cyc int :: why="mind summary record" :: as written: ranges given :: verdict: SERVES
T46 E3 me cap 32 (top 4 by ex + 28 most recent) :: why="keep key and recent events" :: as written: fixed split, overlap between the two sets not handled :: verdict: SERVES
T47 E3 me fields ex, err, h in [0,1]; t tick; st Stage :: why="typed event fields" :: as written: ranges given :: verdict: SERVES
T48 E3 mc cap 16; open 0|1 :: why="bounded conflict log" :: as written: binary open flag :: verdict: SERVES
T49 E3 mb 14 zones (z=1..7 x L|R), cap 14 :: why="one slot per zone" :: as written: 7 x 2 = 14 :: verdict: SERVES
T50 E3 nem record, cap 8 by highest grudge :: why="keep strongest grudges" :: as written: cap and ordering stated :: verdict: SERVES
T51 E3 nem score in [0,10] :: why="graded grudge severity" :: as written: tier map (T52) uses only 0 to 4, so scores above 4 are indistinguishable :: verdict: CONTRADICTS (C06)
T52 E3 tier = TIERS[min(4, ceil(score))] :: why="score bands to named tiers" :: as written: score 0 gives NONE; (0,1] RESENTFUL; (1,2] VENGEFUL; (2,3] MURDEROUS; above 3 SOVEREIGN_NEMESIS :: verdict: SERVES
T53 E3 resist = elem:id:[0,0.85] :: why="resistance kept below immunity" :: as written: upper bound matches X-ray cap (E6) :: verdict: SERVES
T54 E3 seam: resist split on last colon :: why="keys with colons round-trip" :: as written: key "elem:id" and value parse correctly :: verdict: SERVES
T55 E3 example record with TAIL crc32:0x499A7731 :: why="worked example" :: as written: CRC of the body cannot be checked from the card :: verdict: UNCLEAR
T56 E3 A1: F_thrust <= min(250*m_kg, 0.45*P_in_W) [N] :: why="cap thrust by mass and power" :: as written: 0.45 N per W carries hidden speed units; at 10 m/s, 100 W allows 45 N, i.e. 450 W of work :: verdict: CONTRADICTS (C07)
T57 E3 P_in = 0 gives 0 N :: why="no power, no electric thrust" :: as written: zero; fluid and mechanical sockets are not covered :: verdict: UNCLEAR
T58 E3 A2/A3: 4 internal folds :: why="layered validation" :: as written: folds not defined on the card :: verdict: UNCLEAR
T59 E3 A2/A3: coerciveOverride !== true :: why="block forced overrides" :: as written: only boolean true blocks; string "true", 1 or other truthy values pass :: verdict: CONTRADICTS (C08)
T60 E3 A4: reject payload > 4096 bytes and executable/prototype tokens :: why="block code injection, size abuse" :: as written: size cap stated; token list not given :: verdict: SERVES
T61 E3 DFS rejects @hm/wiregraph loops with cycle gain >= 1.0 :: why="block unstable feedback" :: as written: loop gain threshold at 1.0 :: verdict: SERVES
T62 E3 H_circle = clamp01((1/7) sum max ray + Delta_complement - 0.85*min(N_STO,N_STS)/max(1,N_total)) :: why="score circle coverage and complement" :: as written: bounded; penalty grows with the smaller of two member counts, so it lowers mixed circles; intent of that penalty unclear :: verdict: UNCLEAR
T63 E4 breadcrumb E(c,b) :: why="favour similar, uncrowded lineage" :: as written: 0.55 cosine + 0.45 pin overlap, times crowding factor; sign not bounded below :: verdict: SERVES
T64 E4 crowding factor max(0, 1 - 0.85*max(0, share - 1/K)) :: why="penalise over-full niches" :: as written: never below 0.15 :: verdict: SERVES
T65 E4 s_child blend 0.72*(0.60 s_M + 0.40 s_P) + 0.28*s_niche + 0.045*xi :: why="child inherits parents and niche" :: as written: weights 0.72 and 0.28 sum to 1 :: verdict: SERVES
T66 E4 clamp s_child to [0.05, 0.98] :: why="no dead or saturated floats" :: as written: floats never reach 0 or 1 :: verdict: SERVES
T67 E4 xi_symplectic noise weight 0.045 :: why="mutation diversity" :: as written: noise distribution not given; large draws pile on clamp bounds :: verdict: UNCLEAR
T68 E4 active pins <= 6; socketsRequired = pins.length :: why="limit contraption complexity" :: as written: cap and count rule stated :: verdict: SERVES
T69 E4 epochs 1,000+ :: why="enough generations for selection" :: as written: run length only :: verdict: SERVES
T70 E4 z_burial(e) = (E_max - e)*Delta_z_epoch + z0 :: why="older layers sit deeper" :: as written: sign convention and range of e not stated; E_max also names the E1 stiffness max :: verdict: UNCLEAR
T71 E4 G1: hasRootChassis && socketsConnected >= socketsRequired :: why="connected complete structure" :: as written: conjunction of two checks :: verdict: SERVES
T72 E4 zero-G tau = |(r_CoM - r_thrust) x n_hat| (or |r_CoM - r_thrust|) :: why="measure thrust torque arm" :: as written: falls back to distance when no thrust direction :: verdict: SERVES
T73 E4 G2 zero-G (safeG < 0.05): S_stab <= 0.50 :: why="reward stable zero-G craft" :: as written: a perfectly stable craft (S_stab = 1) fails; a craft with S_stab = 0.2 passes G2 :: verdict: CONTRADICTS (C09)
T74 E4 G2 planetary: w0 = sqrt(g/h), xi = |x_xz| + |v_xz|/w0 :: why="capture-point balance" :: as written: standard capture-point form :: verdict: SERVES
T75 E4 G2 planetary: S_stab = clamp01(1 - xi/(2.2*r_support)) >= 0.50 :: why="CoM balanced over support" :: as written: passes a capture point up to 1.1 support radii out :: verdict: CONTRADICTS (C10)
T76 E4 safeG switch at 0.05 :: why="pick model by gravity" :: as written: one threshold selects the branch :: verdict: SERVES
T77 E4 G3 S_sym = max(0, 1 - 2|m_L - m_R|/(m_L + m_R)) :: why="reward left-right mass symmetry" :: as written: a 3:1 split scores 0 :: verdict: SERVES
T78 E4 G4 S_prop = max(0, 1 - min over t in {1, 1.414, 1.618} of |aspect - t|) :: why="reward golden and root-2 proportion" :: as written: orientation of aspect ratio not fixed (0.618 and 1.618 score differently) :: verdict: SERVES
T79 E4 T = 0.40 S_stab + 0.35 S_sym + 0.25 S_prop >= 0.65 :: why="one pass mark for taste" :: as written: weights sum to 1; with S_stab = 0 the maximum T is 0.60 :: verdict: SERVES
T80 E5 P_world = S_sector*2^17 m + O_orbital + x_localSelf :: why="large coordinates keep local precision" :: as written: O and x ranges overlap, so one point has many (S, O, x) forms with no canonical form stated :: verdict: SERVES
T81 E5 S_sector BigInt64Array(3), span +/-2^63 sectors :: why="huge range without float loss" :: as written: 2^80 m = 1.278e8 ly, matches the card's 1.28e8 ly :: verdict: SERVES
T82 E5 O_orbital Float64Array(3) in [-65536, 65536) m :: why="offset covers one sector width" :: as written: half of 2^17 on each side :: verdict: SERVES
T83 E5 x_localSelf Float16Array(3) in (-512, 512) m, quantum 512 m :: why="fine local position near player" :: as written: Float16 step is 0.25 m at 256 to 512 m; 512 m is not a Float16 step :: verdict: CONTRADICTS (C11)
T84 E5 jump conversion: typeof x === bigint ? x : isFinite(x) ? BigInt(trunc(x)) : 0n :: why="exact sector jumps" :: as written: truncation drops the fraction of a sector; NaN and Infinity become 0n silently :: verdict: CONTRADICTS (C12)
T85 E5 Float64 keeps sub-mm offsets (l.204) :: why="no precision loss in remainder" :: as written: Float64 step at 65536 m is 1.46e-11 m :: verdict: SERVES
T86 E5 g_net(q) = sum G M_k (q - q_k) / max(1e-6, |q_k - q|^2)^(3/2) :: why="pull toward each star" :: as written: (q - q_k) points from star to q, so the force points away from each star :: verdict: CONTRADICTS (C13)
T87 E5 denominator floor max(1e-6, r^2)^1.5 :: why="no singular pull at a star" :: as written: softening floor on r^2 :: verdict: SERVES
T88 E5 L_x,coherent = |sum sqrt(L_k)/max(1e-3, r_k) exp(i(k_k r_k + phi_k))|^2, k = omega/c :: why="interfering sources, inverse-square" :: as written: each source gives L/r^2 intensity; wavenumber k = omega/c :: verdict: SERVES
T89 E6 archetype table, IDs 1-22 :: why="22 unique IDs" :: as written: #11 used for stations 4 and 5; #12 unused; 21 distinct IDs :: verdict: CONTRADICTS (C14)
T90 E6 polarity pairing (Mind #1 with Body #9; Mind #2 with Body #8) :: why="masculine and feminine mind-body pairing" :: as written: pairs cross stations 1 and 2 :: verdict: UNCLEAR
T91 E6 polarity weights 0.72, 0.74, 0.76, 0.78 :: why="gendered bias strengths" :: as written: named parameters, no formula :: verdict: UNCLEAR
T92 E6 somatic: hold rays 1-3, ache rays 4-6 :: why="split rays by hold and ache" :: as written: ray 7 is in neither class :: verdict: UNCLEAR
T93 E6 kappa_stiff = min(1, 0.18*ticks) :: why="stiffness builds then saturates" :: as written: 0.72 at 4 ticks, 0.90 at 5, 1.00 at 6 :: verdict: SERVES
T94 E6 SHARP_PAIN: rebound = 0.35 when released with mc open = 1 :: why="sharp release rebounds" :: as written: stated constant :: verdict: SERVES
T95 E6 EUREKA: stiffness 0 when released with mc open = 0 :: why="insight clears stiffness" :: as written: resets stiffness :: verdict: SERVES
T96 E6 stage = runaway or kappa_stiff >= 0.85 :: why="flag overload" :: as written: reached at 5 ticks; re-derivation after EUREKA not stated :: verdict: SERVES
T97 E6 Sigma >= 2.2 or >= 3 runaway zones gives safeHibernationMode :: why="protect body under overload" :: as written: OR of two triggers :: verdict: SERVES
T98 E6 E_vent = 18.5*Sigma [J] :: why="vent scales with overload" :: as written: destination of vented energy not stated :: verdict: SERVES
T99 E6 safeHibernationMode cleared when strain < 20 J :: why="rest lets body leave hibernation" :: as written: rest lowers strain but not kappa or Sigma, so the set rule fires again next tick :: verdict: CONTRADICTS (C15)
T100 E6 stride gain 1 - 0.55*kappa_stiff :: why="stiff body strides shorter" :: as written: range 0.45 to 1 :: verdict: SERVES
T101 E6 animation: anticipation -15%; drive +8% overshoot; follow-through >= 5% settle :: why="motion feel" :: as written: base for the percentages not stated :: verdict: UNCLEAR
T102 E6 temper multipliers HOTHEAD 1.4, PROUD 1.25, COLD 1.3, others 1.0 :: why="personality amplifies grudge" :: as written: quantity multiplied not named :: verdict: SERVES
T103 E6 severity01 in [0,1]; severity 0 adds 0.0 :: why="bounded severity" :: as written: range and zero case stated :: verdict: SERVES
T104 E6 grudge tiers escalate NONE to SOVEREIGN_NEMESIS :: why="escalating grudge" :: as written: order stated, increment sizes not given :: verdict: SERVES
T105 E6 mask law: if actorWoreMask === false, grudge not attached to actorId; +0.25 town tension :: why="masked actors stay anonymous" :: as written: blocks attachment only when the flag is exactly false (unmasked); masked (true) attaches, undefined attaches :: verdict: CONTRADICTS (C16)
T106 E6 X-ray: resistVal +0.35, capped at 0.85 :: why="reveal or harden resistance" :: as written: raises resist; direction for an X-ray reveal not clear :: verdict: UNCLEAR
T107 E6 nemesisEntry = {vs, tier, score, temper, scar, resistKey, resistVal} :: why="same shape across layers" :: as written: matches codec fields in E3 :: verdict: SERVES
T108 E6 forgiveness: grudgeTier = NONE, mc open = 0, Symbiotic Ally :: why="reconciliation clears grudge" :: as written: tier reset while score is kept, so tier formula (T52) re-derives it; "Symbiotic Ally" is not in the tier enum; grudge term in V_Lyap persists :: verdict: CONTRADICTS (C17)
T109 E6 indigo I = 0.55 bal_rays + 0.45 (Will x Faith) >= I_min :: why="gate higher spirals" :: as written: thresholds 0.65, 0.75, 0.80 rise with spiral level :: verdict: SERVES
T110 E6 indigo spend 85% ambient / 15% reserve above 5 J; conservationErrorJ === 0.0 J :: why="conserve energy in spend" :: as written: exact float zero fails on 110 of 1001 cost values in 0.1 J steps (1.7 J gives 1.6999999999999997) :: verdict: CONTRADICTS (C18)
T111 E6 lucid spore: drawnFromVitalJ + deficitToSomaticStrainJ === 45.0 J :: why="fixed dose cost" :: as written: holds on the 0.1 J grid tested; no general guarantee shown :: verdict: SERVES
T112 E6 recovery debt 2^min(6, n-1) :: why="repeat doses cost more" :: as written: 1 to 64 debt units :: verdict: SERVES
T113 E6 lucid spore veil -0.55, ego hardness x0.35, wisdom +0.30 :: why="spore effects" :: as written: stated multipliers :: verdict: SERVES
T114 E6 rest cycle: debt -1; vital reserve +30 J clamped [5, 100]; strain -25 J to 0 :: why="restore body" :: as written: clamps stated, floor 5 J matches indigo floor :: verdict: SERVES
T115 E7 daySatisfaction = 0.40 arrival01 + 0.20 exit01 + 0.20 queue01 + 0.20 viewing01 :: why="weighted visitor score" :: as written: weights sum to 1; direction of queue01 not stated :: verdict: UNCLEAR
T116 E7 reputationAfter = clamp01(R_prev + 0.3*(S_day + 0.5)) :: why="reputation tracks service quality" :: as written: with S_day in [0,1] reputation gains 0.15 to 0.45 every day; from 0 it reaches 1.0 in 7 days at S_day = 0 :: verdict: CONTRADICTS (C19)
T117 E7 SDK budget: 64 focused entities at 60 Hz; 6,000 agents in < 0.5 ms :: why="fit frame budget" :: as written: performance claim, no method given :: verdict: UNCLEAR
T118 E7 bridge maps four weight invariants into [Pxd, Vtx, Lx, Aq] :: why="weights health into soul cartridge" :: as written: four-to-four map :: verdict: SERVES
T119 E7 dH = 0.5*(Lx + Aq)*Sincerity01*(1 + 0.5*CatalystResolved01) :: why="progress grows with sincerity" :: as written: maximum 1.5 :: verdict: SERVES
T120 E7 Progress_next = max(1.0, Progress + 0.18*dH) :: why="progress rises" :: as written: any value below 1.0 is pinned to 1.0, so dH is ignored until progress exceeds 1; depends on initial value :: verdict: UNCLEAR
T121 E7 child universe when H_SMC >= 0.95 (S6) :: why="birth at high harmony" :: as written: threshold stated :: verdict: SERVES
T122 E7 seed = ((round(1000 Pxd) ^ round(10000 Lx) ^ 0x4D4E4557) >>> 0) :: why="distinct child seed" :: as written: only Pxd and Lx feed the seed; 10,240 distinct values over the grid; 50% collision near 119 children :: verdict: CONTRADICTS (C20)
T123 E7 governor: <4 GB Tier 1; <16 GB Tier 2; >=16 GB Tier 3 :: why="tier by memory" :: as written: exhaustive and ordered partition :: verdict: SERVES
T124 E7 simulationStage (S0a..S6) not downgraded :: why="keep progress across hardware" :: as written: cap applies to tier only :: verdict: SERVES
T125 Counts: 7 branches; 41 sub-branches; 22 archetypes; 14 zones; 7 waves; 4 screens; 16 rows; 117 defects = 99 closed + 18 open :: why="stated totals agree" :: as written: 99 + 18 = 117; 7 x 2 = 14; 7+7+7+1 = 22 slots but 21 distinct archetype IDs (see T89) :: verdict: SERVES

## Contradictions

| # | Rule | why= | As written | Scenario where it defeats its purpose | Severity H/M/L |
|---|------|------|-----------|----------------------------------------|----------------|
| C01 | V(rho) inverse (T09) | recovers float from density | ln(clamp(rho)/rho_min)/ln(rho_max) | Output is 1.0 only at rho = 25,000 kg/m^3 under the correct denominator; as written V reaches 1 at rho = 2.5. Water (1000 kg/m^3) gives V = 1.59 and osmium (22,590) gives 1.90, outside the [0,1] float domain. Any round trip or import of a liquid or solid hands the kernel an out-of-range float. Correct denominator: ln(rho_max/rho_min). | H (if V(rho) is on a live path; the card does not say) |
| C02 | E bounds (T12, with T06) | stiffness span up to diamond | E_min = 1e-4 GPa, E_max = 1,200 MPa | E_max is 1.2 GPa. The card's own 1050 GPa diamond example clamps to P = 1 (node check). Every material stiffer than 1.2 GPa collapses to the same top value, so the stiffness axis stops discriminating. Likely intended: 1,200 GPa. | H |
| C03 | E units (T06) | one unit per quantity | E_min in GPa, E_max in MPa | Literal ratio E_max/E_min = 1200/1e-4 = 1.2e7 (ln 16.3); GPa-consistent 1.2/1e-4 = 1.2e4 (ln 9.4). Same card, 1000x different ratio depending on reading, so E(P) differs by implementation. | M |
| C04 | VSA storage (T19) | 4096-bit hypervector | Uint32Array(64), stated 512 bytes | 64 x 4 = 256 bytes = 2048 bits. A 4096-bit vector needs 128 words. Binding and similarity run on half the intended dimension; capacity and noise margins drop, and nothing checks the size. | M |
| C05 | Stop criterion (T39) | stop once nothing is outstanding | E_psi <= 1e-9 | 1.5*grudge stays above 1e-9 for any nonzero grudge, and only forgiveness (C17) clears it. Every grudge-holder runs to horizon K and convergedInOnePass is always false. Wasted compute, not a wrong result. | L |
| C06 | Nemesis score range (T51, T52) | graded grudge severity | score in [0,10]; tier = TIERS[min(4, ceil(score))] | Scores 4 and 10 both map to SOVEREIGN_NEMESIS (node check). Roughly 60% of the declared range never affects tier, and cap ordering by grudge loses resolution above 4. | L |
| C07 | A1 thrust gate (T56) | cap thrust by mass and power | F <= min(250 m_kg, 0.45 P_in_W) [N] | 0.45 is N per W, which only holds at 2.22 m/s (node check). At 10 m/s, 100 W allows 45 N, i.e. 450 W of work from 100 W input. The gate checks numbers, not energy, so a claimed thrust at speed passes. The 250 N/kg mass term is also loose (about 25 g). | M |
| C08 | coerciveOverride (T59) | block forced overrides | coerciveOverride !== true | Blocks only boolean true. If the ASCII shorthand parser keeps values as strings, "true" !== true passes, so an override marked coercive gets through. The same holds for 1 or any truthy non-boolean. The gate fails open. | H (if parsed values are not typed booleans) |
| C09 | Zero-G stability test (T73) | reward stable zero-G craft | S_stab <= 0.50 when safeG < 0.05 | Inverted against the planetary branch (>= 0.50). A perfectly stable craft (S_stab = 1) fails G2, while a craft with S_stab = 0.2 passes. With T >= 0.65 and S_stab = 0 capping T at 0.60, only S_stab in [0.125, 0.5] can pass at all, so the gate prefers marginal stability. Branches flip at safeG = 0.05: a craft with S_stab 0.3 passes zero-G and fails planetary. | H |
| C10 | Planetary tolerance (T75) | CoM balanced over support | S_stab = 1 - xi/(2.2 r_support) >= 0.50 | Threshold 0.5 equals xi = 1.1 r_support, so a capture point up to 10% beyond the support radius passes. A falling CoM can clear G2. | L |
| C11 | Local position quantum (T83) | fine local position near player | Float16Array, quantum "512 m" | Float16 step is 0.25 m at 256 to 512 m (node check). A 10 cm part cannot be placed at 300 m from origin. "512 m" is not a Float16 step, so the card contradicts itself. | M |
| C12 | Jump conversion (T84) | exact sector jumps | BigInt(Math.trunc(x)), non-finite -> 0n | A numeric jump of 2.9 sectors becomes 2; the 0.9 sector (117,964.8 m) is lost unless routed to deltaSubSectorF64, which the card does not say. NaN or Infinity becomes 0n silently, so a corrupt jump is a no-op with no error. | M |
| C13 | Gravity sign (T86) | pull toward each star | g_net = sum G M_k (q - q_k) / r^3 | (q - q_k) points from star to q. At q = (1,0,0) with the star at origin the term is +x (node check): the force pushes away from the star. Bodies are expelled rather than bound; orbits do not form. | H |
| C14 | Archetype IDs (T89) | 22 unique IDs | #11 at stations 4 and 5; #12 unused | Lookup by ID returns two archetypes for #11 and none for #12, so the "22 archetypes" count holds only as slots. Likely a typo (conventional numbering puts The Hanged Man at 12). | M |
| C15 | Hibernation clear vs set (T97, T99) | rest lets body leave hibernation | cleared when strain < 20 J; set when Sigma >= 2.2 | Rest lowers strain and clears hibernation, but the set condition uses Sigma (kappa-based), which rest never touches. Next tick the mode re-sets. Rest cannot end hibernation while stiffness persists. | M |
| C16 | Mask law (T105) | masked actors stay anonymous | if actorWoreMask === false, grudge not attached | Blocks attachment only when the flag is exactly false. A masked actor (true) gets the grudge attached to actorId, so the mask does nothing. Undefined also attaches. Inverted if the field means what its name says. | H (if actorWoreMask means "wore a mask") |
| C17 | Forgiveness (T108) | reconciliation clears grudge | grudgeTier = NONE, mc open = 0, "Symbiotic Ally" | Tier is derived from score (TIERS[ceil(score)]), and score is not reset, so the next tick re-derives RESENTFUL or higher. The score still feeds the 1.5*grudge term in V_Lyap. "Symbiotic Ally" is not a value of the nem.tier enum, so the record fails its own schema. | M |
| C18 | Indigo conservation (T110) | conserve energy in spend | conservationErrorJ === 0.0 J | Exact float zero fails on 110 of 1001 cost values in 0.1 J steps (1.7 J returns 1.6999999999999997). If enforced, legitimate spends fail on rounding noise. The lucid-spore check held on the grid tested (T111), so the defect is specific to the indigo split. | M |
| C19 | Reputation update (T116) | reputation tracks service quality | clamp01(R + 0.3*(S + 0.5)) | With S_day in [0,1] (the weights imply this), reputation gains 0.15 per day at S = 0 and 0.45 at S = 1. From 0 it reaches 1.0 in 7 days regardless of service and never falls. Bad service is rewarded. | H |
| C20 | Child seed (T122) | distinct child seed | (round(1000 Pxd) ^ round(10000 Lx) ^ 0x4D4E4557) >>> 0 | Only Pxd and Lx feed the seed: 10,240 distinct values over the rounding grid (node check). Universes that match on those two floats share a seed even if Vtx and Aq differ. 50% collision reached near 119 child universes (sqrt(2N ln 2)). | M |

## Notes

- Scope: only the one card file was read. No other file or folder was opened or listed. The output file is the only file written.
- Purposes were inferred from rule names and context. Where names are opaque (Vtx, Aq, X-ray, Indigo, Lucid spore, Sincerity01), the purpose is marked UNCLEAR where the rule shape does not settle it.
- Conditional severities: C01 depends on whether V(rho) is used live; C08 depends on whether the shorthand parser keeps booleans typed; C16 depends on the field meaning what its name says.
- Not judged from the card: the SI normaliser and socket formulas (names only); index ranges and units for MU_*, PI_*, and indices 20-23; the exact Step operator form (T32); rollout f and g formulas (T35); breadcrumb sign convention (cosine can make E negative); xi_symplectic distribution; burial sign convention and the range of e (T70); ray 7 handling (T92); whether the polarity crossing is intended (T90); X-ray direction (T106); queue01 direction (T115); initial value of Progress_4D (T120); whether "Will x Faith" is a scalar product or a cross product (T109); the four internal folds (T58); the A4 token list (T60); the computed CRC hex format, which decides whether crcValid can ever be true (T44); whether P_in = 0 should also cover fluid or mechanical thrust (T57).
- Name clash: E_max is the stiffness maximum in E1 and appears as an epoch maximum in burial (T70). Check which one a burial implementation would read.
- Possible typos (flagged, not counted as separate contradictions): #11 used for The Hanged Man (C14); E_max written as 1,200 MPa beside a 1050 GPa example (C02).
- Verdict counts: 125 rules anchored, 20 CONTRADICTS, 105 SERVES or UNCLEAR across the table.
- Numeric checks run with node -e: V(rho) at water, osmium, H2 and rho_max; E-ratio units; E clamp at 1050 GPa; VSA bytes; p_eff vacuum values; 2^80 m in ly; Float16 step; gravity sign; zero-G window; A1 speed bound; reputation days; seed distinct count and birthday estimate; kappa thresholds; archetype ID count; indigo and spore 0.1 J grid checks; Float64 step at 65536 m; 0.9 sector in m.
