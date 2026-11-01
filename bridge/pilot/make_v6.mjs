// Builds levels_v6.mjs from levels_v5.mjs (v5 stays untouched): v5 plus bridge 2, a direct link between
// rung 0 and rung 2, which closes the triangle the 3/6/9 test found open (system_369_raw.json).
//   0 -> 2 (up02):   at each rung-2 boundary  u2 = u2raw + G02 · msg(P02, x0p of the previous character)
//   2 -> 0 (down20): every character           x0' += G20 · msg(P20, src20), src20 = own u2 or a donor's
// Arms: R9 (both directions), Rskip (2 -> 0 only), Rup (0 -> 2 only); all use v5's R gate on every bridge.
import fs from 'node:fs';
const SRC = 'D:/fidelity-llm/pilot/levels_v5.mjs', DST = 'D:/fidelity-llm/pilot/levels_v6.mjs';
let s = fs.readFileSync(SRC, 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`expected 1 match, got ${n}: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };

// 1. header
rep(`// levels_v5.mjs: the Fidelity levels pilot, version 5 (see PREREG_v5.md). Plain Node, nothing to download.`,
`// levels_v6.mjs: the Fidelity levels pilot, version 6 (see PREREG_v6.md). Plain Node, nothing to download.
// v6 = v5 plus bridge 2, a direct link between rung 0 and rung 2 that closes the triangle (the owner's
// 3/6/9 test found rung 2 with nothing acting on it and no rung 0 - rung 2 link):
//   0 -> 2 (up02)    at each rung-2 boundary  u2 = u2raw + G02 · msg(P02, x0p of the previous character)
//                    (the rung-2 aux head still reads u2raw; rung 1 and donors read the acted-on u2)
//   2 -> 0 (down20)  every character  x0' = x0 + G0·msg(P1, src1) + G20·msg(P20, src20), src20 = u2 or a
//                    donor's u2 where bridge 2 is poisoned (its own schedule, the same rate)
//   R9 both directions, Rskip 2 -> 0 only, Rup 0 -> 2 only; every gate is v5's R rule, sigmoid(q·k/4 + c).
// Everything below is v5 unless marked v6.
//
// (v5 header follows)`);
rep(`//   node levels_v5.mjs --gradcheck
//   node levels_v5.mjs --arm R --seed 1 --steps 40000 --out results_v5/R_s1.json`,
`//   node levels_v6.mjs --gradcheck
//   node levels_v6.mjs --arm R9 --seed 1 --steps 40000 --out results_v6/R9_s1.json`);

// 2. arms
rep(`  RP: { mode: 'relPlan' },
});`,
`  RP: { mode: 'relPlan' },
  // v6: bridge 2 between rung 0 and rung 2
  R9: { mode: 'rel', up02: true, down20: true },
  Rskip: { mode: 'rel', down20: true },
  Rup: { mode: 'rel', up02: true },
});`);

// 3. parameters for bridge 2, drawn after every v5 parameter so shared weights start the same as R's
rep(`  // S: fixed random directions from their own generator`,
`  // v6: bridge 2 parameters, drawn last so every shared weight starts as in R (unused ones get zero gradient)
  if (arm.up02 || arm.down20) {
    par('P20', d * d, 0.5 / Math.sqrt(d)); par('Wq20', d * dq, 1 / Math.sqrt(d)); par('Wk20', d * dq, 1 / Math.sqrt(d)); par('rc20', 1, 0);
    par('P02', d * d, 0.5 / Math.sqrt(d)); par('Wq02', d * dq, 1 / Math.sqrt(d)); par('Wk02', d * dq, 1 / Math.sqrt(d)); par('rc02', 1, 0);
  }
  // S: fixed random directions from their own generator`);

// 4. streams carry rung 0's last post-message state
rep(`    hist0: [], hist1: [], u1p: konst(zero), u2: konst(zero),`,
`    hist0: [], hist1: [], u1p: konst(zero), u2: konst(zero), x0p: konst(zero),`);

// 5. tallies
rep(`    ceP: [0, 0],                                        // main CE on [clean, poisoned] rung-0 messages (counts in pn0)
  };`,
`    ceP: [0, 0],                                        // main CE on [clean, poisoned] rung-0 messages (counts in pn0)
    pg2: [0, 0], pn2: [0, 0], g02sum: 0, g02sq: 0, g02n: 0, // v6: bridge 2 (2 -> 0 by poison state; 0 -> 2 gate)
    hSum: 0,                                                // v6: summed predicted entropy (causality check)
  };`);

// 6. bridge-2 donors from their own generator (bridges 0 and 1 draw exactly as in v5), and a keyed scramble
rep(`  const prng = poison ? mulberry32(poison.rngSeed) : null;`,
`  const prng = poison ? mulberry32(poison.rngSeed) : null;
  const prng2 = poison ? mulberry32((poison.rngSeed ^ 0x5bd1e995) | 0) : null; // v6: bridge-2 donors only
  const scrambleKey = (list, key) => { // v6: the scramble control for the bridge-2 gates
    if (!(evalShuffle && !train) || list.length < 2) return;
    const perm = derangement(list.length, drng), g = list.map(o => gv(o[key]));
    list.forEach((o, j) => { o[key] = g[perm[j]]; });
  };`);
rep(`      if (isPoisoned(st, 0)) { const dn = donorOf(st, here); if (dn) donor0.set(st, dn); }
    }`,
`      if (isPoisoned(st, 0)) { const dn = donorOf(st, here); if (dn) donor0.set(st, dn); }
    }
    const donor2 = new Map(); // v6: drawn uniformly from the other streams, as on bridges 0 and 1
    if (poison && arm.down20) for (const st of here) {
      if (!isPoisoned(st, 2)) continue;
      const others = here.filter(o => o !== st);
      if (others.length) donor2.set(st, others[Math.floor(prng2() * others.length)]);
    }`);

// 7. 0 -> 2 at rung-2 boundaries: keep the raw u2 for the aux head, then act on it after every stream has formed its u2
rep(`        st.u2 = act(matvec(P.W2, P.c2, concat([...p1, u1]), fan * d, d), 'tanh');
        s2 = softmaxCE(matvec(P.A2, P.a2, st.u2, d, V), r.y, wt.a2);`,
`        st.u2 = act(matvec(P.W2, P.c2, concat([...p1, u1]), fan * d, d), 'tanh');
        s2 = softmaxCE(matvec(P.A2, P.a2, st.u2, d, V), r.y, wt.a2);
        st.u2raw = st.u2; // v6`);
rep(`    for (const q of r1) { const dn = donor1.get(q.st); q.poisoned = !!dn; q.src = dn ? donated(dn, 'u2') : q.st.u2; q.st.lastP1 = q.poisoned; }`,
`    if (arm.up02) { // v6: 0 -> 2, from rung 0's previous post-message state
      const at2 = r1.filter(q => q.s2);
      for (const q of at2) q.G02 = sigmoidNode(relScore(P.Wq02, P.Wk02, P.rc02, q.st.u2raw, q.st.x0p));
      scrambleKey(at2, 'G02');
      for (const q of at2) {
        q.st.u2 = add(q.st.u2raw, scale(msg(P.P02, q.st.x0p), q.G02));
        const g = gv(q.G02); out.g02sum += g; out.g02sq += g * g; out.g02n += 1;
      }
    }
    for (const q of r1) { const dn = donor1.get(q.st); q.poisoned = !!dn; q.src = dn ? donated(dn, 'u2') : q.st.u2; q.st.lastP1 = q.poisoned; }`);

// 8. 2 -> 0 into rung 0, then carry x0p
rep(`    for (const r of r0) r.G = gate0(r);
    shuffle(r0, 0);`,
`    for (const r of r0) r.G = gate0(r);
    shuffle(r0, 0);
    if (arm.down20) { // v6: 2 -> 0
      for (const r of r0) { const dn = donor2.get(r.st); r.poisoned2 = !!dn; r.src2 = dn ? donated(dn, 'u2') : r.st.u2; r.G20 = sigmoidNode(relScore(P.Wq20, P.Wk20, P.rc20, r.x0, r.src2)); }
      scrambleKey(r0, 'G20');
    }`);
rep(`      const x0p = add(r.x0, scale(msg(P.P1, r.src), r.G));`,
`      let x0p = add(r.x0, scale(msg(P.P1, r.src), r.G));
      if (arm.down20) { // v6
        x0p = add(x0p, scale(msg(P.P20, r.src2), r.G20));
        const g = gv(r.G20); out.pg2[r.poisoned2 ? 1 : 0] += g; out.pn2[r.poisoned2 ? 1 : 0] += 1;
      }
      st.x0p = x0p; // v6: rung 0's post-message state, read by 0 -> 2 at the next rung-2 boundary`);

// 9. carried state becomes constant
rep(`    st.u1p = konst(st.u1p.v); st.u2 = konst(st.u2.v);`,
`    st.u1p = konst(st.u1p.v); st.u2 = konst(st.u2.v);
    st.x0p = konst(st.x0p.v); if (st.u2raw) st.u2raw = konst(st.u2raw.v); // v6`);

// 10. evaluation readouts
rep(`    pg0: [0, 0], pn0: [0, 0], pg1: [0, 0], pn1: [0, 0], ceP: [0, 0],
  };
  const blockSum`,
`    pg0: [0, 0], pn0: [0, 0], pg1: [0, 0], pn1: [0, 0], ceP: [0, 0],
    pg2: [0, 0], pn2: [0, 0], g02sum: 0, g02sq: 0, g02n: 0, // v6
  };
  const blockSum`);
rep(`    for (let j = 0; j < 2; j++) { tot.pg0[j] += o.pg0[j]; tot.pn0[j] += o.pn0[j]; tot.pg1[j] += o.pg1[j]; tot.pn1[j] += o.pn1[j]; tot.ceP[j] += o.ceP[j]; }`,
`    for (let j = 0; j < 2; j++) { tot.pg0[j] += o.pg0[j]; tot.pn0[j] += o.pn0[j]; tot.pg1[j] += o.pg1[j]; tot.pn1[j] += o.pn1[j]; tot.ceP[j] += o.ceP[j]; }
    for (let j = 0; j < 2; j++) { tot.pg2[j] += o.pg2[j]; tot.pn2[j] += o.pn2[j]; } tot.g02sum += o.g02sum; tot.g02sq += o.g02sq; tot.g02n += o.g02n; // v6`);
rep(`        ceClean: f(tot.ceP[0], tot.pn0[0]), cePois: f(tot.ceP[1], tot.pn0[1]),
      };`,
`        ceClean: f(tot.ceP[0], tot.pn0[0]), cePois: f(tot.ceP[1], tot.pn0[1]),
        // v6: bridge 2
        share2: f(tot.pn2[1], tot.pn2[0] + tot.pn2[1]), g20Clean: f(tot.pg2[0], tot.pn2[0]), g20Pois: f(tot.pg2[1], tot.pn2[1]),
        gap2: tot.pn2[0] && tot.pn2[1] ? r4(tot.pg2[0] / tot.pn2[0] - tot.pg2[1] / tot.pn2[1]) : null,
        g02Mean: f(tot.g02sum, tot.g02n), g02Sd: tot.g02n ? sd(tot.g02sum, tot.g02sq, tot.g02n) : null,
      };`);

// 11. version and output line
rep(`  const rec = { version: 5,`, `  const rec = { version: 6,`);
rep("gap0/gap1 ${ev.poison.gap0}/${ev.poison.gap1},", "gap0/gap1/gap2 ${ev.poison.gap0}/${ev.poison.gap1}/${ev.poison.gap2}, g02 ${ev.poison.g02Mean},");

// ---------------------------------------------------------------- compassion: the bottom's sting goes up
// The owner named the missing piece "compassion" (suffering-with): the one above feels the sting below.
// The sting is three numbers per stream, known only after a character is scored and felt from the next one:
//   [main CE minus its running mean (how surprising that was), aux0 CE minus main CE (did the help help),
//    the running mean of that relief]. It carries no gradient.
//   RC     R9 plus the sting felt by the top (u2 += Ps·sting at its boundary) and by the downward gates
//          (each score gets + ws·sting)
//   RCtop  R9 plus the sting felt by the top only
//   RCx    RC, but each stream feels another stream's sting (the control: someone else's pain)
// The compassion weights start at zero, so RC, RCtop and RCx start exactly as R9.
rep(`  Rup: { mode: 'rel', up02: true },
});`,
`  Rup: { mode: 'rel', up02: true },
  // v6: compassion
  RC: { mode: 'rel', up02: true, down20: true, feelTop: true, feelGate: true },
  RCtop: { mode: 'rel', up02: true, down20: true, feelTop: true },
  RCx: { mode: 'rel', up02: true, down20: true, feelTop: true, feelGate: true, feelOther: true },
});`);
rep(`  // S: fixed random directions from their own generator`,
`  // v6 compassion: zero at the start, so these arms start exactly as R9
  if (arm.feelTop || arm.feelGate) { par('Ps', 3 * d, 0); par('ws0', 3, 0); par('ws1', 3, 0); par('ws20', 3, 0); }
  // S: fixed random directions from their own generator`);
rep(`    hist0: [], hist1: [], u1p: konst(zero), u2: konst(zero), x0p: konst(zero),`,
`    hist0: [], hist1: [], u1p: konst(zero), u2: konst(zero), x0p: konst(zero),
    sting: [0, 0, 0], mainMean: 2.0, // v6 compassion`);
rep(`// x / sqrt(mean(x^2) + eps): the norm lock on top-down messages`,
`// v6 compassion: z + w·s, with s a plain 3-vector (the sting) that carries no gradient
function stingTerm(z, w, s) {
  let v = z.v[0];
  for (let i = 0; i < s.length; i++) v += w.v[i] * s[i];
  const n = node(Float64Array.of(v), null);
  if (TAPE) n.back = () => { const g = n.g[0]; if (z.g) z.g[0] += g; for (let i = 0; i < s.length; i++) w.g[i] += g * s[i]; }, TAPE.push(n);
  return n;
}
// x / sqrt(mean(x^2) + eps): the norm lock on top-down messages`);
rep(`  const constG = arm.mode === 'zero'`,
`  let feelNow = new Map(); // v6 compassion: this character's felt sting per stream
  const feel = (z, w, st) => (arm.feelGate ? stingTerm(z, w, feelNow.get(st)) : z);
  const constG = arm.mode === 'zero'`);
rep(`    const z = relScore(P.Wq1, P.Wk1, P.rc1, q.u1, q.src);`,
`    const z = feel(relScore(P.Wq1, P.Wk1, P.rc1, q.u1, q.src), P.ws1, q.st);`);
rep(`    const z = relScore(P.Wq0, P.Wk0, P.rc0, r.x0, r.src);`,
`    const z = feel(relScore(P.Wq0, P.Wk0, P.rc0, r.x0, r.src), P.ws0, r.st);`);
rep(`    const donor2 = new Map(); // v6`,
`    feelNow = new Map(); // v6 compassion: felt before any state changes this character
    if (arm.feelTop || arm.feelGate) here.forEach((st, i) => feelNow.set(st, arm.feelOther && here.length > 1 ? here[(i + 1) % here.length].sting : st.sting));
    const donor2 = new Map(); // v6`);
rep(`    for (const q of r1) { const dn = donor1.get(q.st); q.poisoned = !!dn; q.src = dn ? donated(dn, 'u2') : q.st.u2; q.st.lastP1 = q.poisoned; }`,
`    if (arm.feelTop) for (const q of r1.filter(q => q.s2)) q.st.u2 = add(q.st.u2, matvec(P.Ps, null, konst(Float64Array.from(feelNow.get(q.st))), 3, d)); // v6 compassion: the top feels
    for (const q of r1) { const dn = donor1.get(q.st); q.poisoned = !!dn; q.src = dn ? donated(dn, 'u2') : q.st.u2; q.st.lastP1 = q.poisoned; }`);
rep(`r.G20 = sigmoidNode(relScore(P.Wq20, P.Wk20, P.rc20, r.x0, r.src2)); }`,
`r.G20 = sigmoidNode(feel(relScore(P.Wq20, P.Wk20, P.rc20, r.x0, r.src2), P.ws20, r.st)); }`);
rep(`      out.mainSum += sm.ce; out.tokens += 1; out.rMainSum += sm.ce - sm.H;`,
`      out.mainSum += sm.ce; out.tokens += 1; out.rMainSum += sm.ce - sm.H;
      r.mainCE = sm.ce; out.hSum += sm.H; // v6 compassion; entropy for the causality check`);
rep(`      if (!freezeB) upd(st, 0, r.s0, r.y);`,
`      if (!freezeB) upd(st, 0, r.s0, r.y);
      if (!freezeB && (arm.feelTop || arm.feelGate)) { // v6 compassion: the sting, felt from the next character on
        const relief = r.s0.ce - r.mainCE, prevMean = st.mainMean;
        st.mainMean = keep * st.mainMean + (1 - keep) * r.mainCE;
        st.sting = [r.mainCE - prevMean, relief, keep * st.sting[2] + (1 - keep) * relief];
      }`);
rep(`//   R9 both directions, Rskip 2 -> 0 only, Rup 0 -> 2 only; every gate is v5's R rule, sigmoid(q·k/4 + c).`,
`//   R9 both directions, Rskip 2 -> 0 only, Rup 0 -> 2 only; every gate is v5's R rule, sigmoid(q·k/4 + c).
// Compassion (the owner's name for the missing piece, suffering-with): the bottom's sting goes up.
//   sting = [main CE - its running mean, aux0 CE - main CE (did the help help), running mean of that relief],
//   from the previous character, no gradient.  RC: R9 + the top feels it (u2 += Ps·sting) + the downward
//   gates feel it (score += ws·sting).  RCtop: the top only.  RCx: RC feeling another stream's sting.`);
// gradient check: a non-zero sting so the compassion weights are checked (b states, and the sting, are frozen)
rep(`      if (s === 2) st.gain = [0, 1, 1];                    // rung 0 still under the guard: G0 shut`,
`      if (s === 2) st.gain = [0, 1, 1];                    // rung 0 still under the guard: G0 shut
      st.sting = [0.3, -0.2, 0.1 + 0.05 * s];              // v6 compassion: felt, frozen for the check`);
rep(`hist0: [...st.hist0], hist1: [...st.hist1] }));`, `hist0: [...st.hist0], hist1: [...st.hist1], sting: [...st.sting] }));`);

// ---------------------------------------------------------------- the pure cell (Step 0.7 review)
// gap0pure compares bridge-0 gates on characters where only bridge 0 differs: off span boundaries, own
// bridge-1 and bridge-2 messages not marked, and no echo (u2 not carrying marked content through 0 -> 2).
rep(`    sting: [0, 0, 0], mainMean: 2.0, // v6 compassion`,
`    sting: [0, 0, 0], mainMean: 2.0, // v6 compassion
    x0pOther: false, x0pB0: false, echoOther: false, echoB0: false, // v6: another timeline's content in rung 0's last state / in u2, by source (bridges 1-2, or bridge 0)`);
rep(`    hSum: 0,                                                // v6: summed predicted entropy (causality check)`,
`    hSum: 0,                                                // v6: summed predicted entropy (causality check)
    pureG: [0, 0], pureN: [0, 0], ceP2: [0, 0],             // v6: pure-cell bridge-0 gates; main CE by bridge-2 state`);
rep(`        q.st.u2 = add(q.st.u2raw, scale(msg(P.P02, q.st.x0p), q.G02));`,
`        q.st.u2 = add(q.st.u2raw, scale(msg(P.P02, q.st.x0p), q.G02));
        q.st.echoOther = q.st.x0pOther; q.st.echoB0 = q.st.x0pB0; // v6: u2 now carries what rung 0's state carried (one hop)`);
rep(`      st.x0p = x0p; // v6: rung 0's post-message state, read by 0 -> 2 at the next rung-2 boundary`,
`      // v6: the pure cell. Other bridges' marks and their echo are excluded from both groups; an echo caused by bridge 0 itself is
      // part of the treatment in the marked group and excluded from the clean group as spillover.
      if (!st.lastP1 && !r.poisoned2 && !st.echoOther && st.n % span1 !== 0 && (r.poisoned || !st.echoB0)) { const k = r.poisoned ? 1 : 0; out.pureG[k] += gv(r.G); out.pureN[k] += 1; }
      st.x0p = x0p; // v6: rung 0's post-message state, read by 0 -> 2 at the next rung-2 boundary
      st.x0pOther = !!r.poisoned2 || st.lastP1; st.x0pB0 = !!r.poisoned; // one hop: an echo does not re-mark itself (a latch emptied the pure cell)`);
rep(`      r.mainCE = sm.ce; out.hSum += sm.H; // v6 compassion; entropy for the causality check`,
`      r.mainCE = sm.ce; out.hSum += sm.H; // v6 compassion; entropy for the causality check
      if (arm.down20) out.ceP2[r.poisoned2 ? 1 : 0] += sm.ce; // v6: main CE by bridge-2 state`);
rep(`g02n: 0, // v6
  };
  const blockSum`,
`g02n: 0, // v6
    pureG: [0, 0], pureN: [0, 0], ceP2: [0, 0], // v6
  };
  const blockSum`);
rep(`tot.g02sum += o.g02sum; tot.g02sq += o.g02sq; tot.g02n += o.g02n; // v6`,
`tot.g02sum += o.g02sum; tot.g02sq += o.g02sq; tot.g02n += o.g02n; // v6
    for (let j = 0; j < 2; j++) { tot.pureG[j] += o.pureG[j]; tot.pureN[j] += o.pureN[j]; tot.ceP2[j] += o.ceP2[j]; } // v6`);
rep(`        g02Mean: f(tot.g02sum, tot.g02n), g02Sd: tot.g02n ? sd(tot.g02sum, tot.g02sq, tot.g02n) : null,`,
`        g02Mean: f(tot.g02sum, tot.g02n), g02Sd: tot.g02n ? sd(tot.g02sum, tot.g02sq, tot.g02n) : null,
        gap0pure: tot.pureN[0] && tot.pureN[1] ? r4(tot.pureG[0] / tot.pureN[0] - tot.pureG[1] / tot.pureN[1]) : null, pureN: [...tot.pureN],
        ce2Clean: f(tot.ceP2[0], tot.pn2[0]), ce2Marked: f(tot.ceP2[1], tot.pn2[1]),`);

// ---------------------------------------------------------------- causality check (v6 build check)
rep(`// ---------------------------------------------------------------- main`,
`// v6: causality check. Each arm runs 4 streams one character at a time, recording per character the summed
// predicted entropy and gate values. Then one character of the text, at a stream's step p, is changed and the
// run repeated: every record up to and including p must be identical (records after p may change).
function causalCheck(data) {
  let bad = 0, checked = 0;
  for (const armName of ['R', 'R9', 'Rskip', 'Rup', 'RC', 'RCtop', 'RCx']) {
    const net = makeNet(armName, data, 5), rng = mulberry32(77);
    let armBad = 0;
    for (let trial = 0; trial < 20; trial++) {
      const starts = [0, 1, 2, 3].map(s => 20000 + 300000 * s + Math.floor(rng() * 1000));
      const T = 48, p = 4 + Math.floor(rng() * (T - 8)), which = Math.floor(rng() * 4);
      const run = seq => {
        const streams = starts.map(a => { const st = makeStream(a, seq.length, true, data.V); st.start = 0; st.gain = [1, 1, 1]; return st; });
        const rec = [];
        for (let t = 0; t < T; t++) {
          const o = runStep(net, streams, seq, 1, { poison: { seed: 9, rngSeed: 1000 + t, rho: 0.5 } });
          rec.push([o.hSum, o.gsum0, o.gsum1, o.pg2[0] + o.pg2[1], o.g02sum]);
        }
        return rec;
      };
      const a = run(data.train), alt = Uint8Array.from(data.train), pos = starts[which] + p;
      alt[pos] = alt[pos] === 2 ? 3 : 2;
      const b = run(alt);
      for (let t = 0; t <= p; t++) {
        checked++;
        const diff = a[t].map((x, i) => (x !== b[t][i] ? i : -1)).filter(i => i >= 0);
        if (diff.length) { armBad++; console.log(\`\${armName} trial \${trial}: record \${t} changed in field(s) \${diff.join(',')} (p = \${p})\`); break; }
      }
      // the change must show after p somewhere, or the test saw nothing
      if (!a.slice(p + 1).some((row, t) => row.some((x, i) => x !== b[p + 1 + t][i]))) console.log(\`\${armName} trial \${trial}: no change after p (weak trial)\`);
    }
    bad += armBad;
    console.log(\`\${armName.padEnd(6)} causality: \${armBad ? 'FAILED' : 'ok'}\`);
  }
  console.log(\`causality check: \${checked} records, \${bad} changed\`);
  if (bad) process.exitCode = 1;
}

// ---------------------------------------------------------------- main`);
rep(`} else if (args.gradcheck) {
  gradCheck(data);`,
`} else if (args.gradcheck) {
  gradCheck(data);
} else if (args.causal) {
  causalCheck(data);`);

fs.writeFileSync(DST, s);
console.log('wrote', DST, s.length, 'chars');
