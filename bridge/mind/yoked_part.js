// ---------------------------------------------------------------- the yoked arm Y (BRIDGE_DESIGN.md §6.1, E2)
// Two lanes on the same world seed and trunk, in lockstep:
//   the source: an exact L life (its own world copy, its own live heads), and
//   the actor: Y's own four characters, acting in their own world copy by the §4.4 rule.
// Each actor character c learns only from the source's character (c + 1) mod 4: a shadow stream reads that character's
// tokens through the frozen trunk with the actor's own heads (the same head objects), and one Adam step per answer lands
// on the actor's heads. The actor never trains on its own answers; its own stream only forwards, for its choices.
// The actor acts first each tick, with heads trained on the source's answers up to the tick before (as L's heads hold its
// own answers up to the tick before).
function makeLane(ctx, worldSeed, stream) {
  const { net, init, K, T, ticks, PP } = ctx, Q = 4 * ticks;
  const lane = { w: createWorld(PP, worldSeed), buf: new Uint8Array(CFG.S * Q), k5: 0, explored: 0, decisions: 0, worldSeed, stream };
  lane.streams = [...Array(CFG.S).keys()].map(c => {
    const st = makeStream(c * Q, (c + 1) * Q, false, net.V, init);
    st.base = c * Q; st.cIdx = c;
    st.heads = Object.fromEntries(HEADS.map(k => [k, { v: Float64Array.from(net.P[k].v), g: new Float64Array(net.P[k].v.length) }]));
    st.adam = { t: 0, m: Object.fromEntries(HEADS.map(k => [k, new Float64Array(net.P[k].v.length)])), v: Object.fromEntries(HEADS.map(k => [k, new Float64Array(net.P[k].v.length)])) };
    return st;
  });
  lane.log = { obs: [], acts: [], answers: [], V: [], pain: [], gain: [], causes: [], seasons: [], tables: [] };
  lane.ce = { ans: 0, n: 0, eatItem: 0, nEat: 0, byAge: [[0, 0], [0, 0], [0, 0]] };
  lane.causes = { toxin: 0, hunger: 0, other: 0 };
  lane.lastSeason = -1; lane.seasonStart = 0;
  lane.series = lane.streams.map(() => []);
  lane.blank = () => ({ ce: 0, n: 0, nourish: 0, toxic: 0, collapses: 0, down: 0 });
  lane.win = lane.streams.map(lane.blank);
  return lane;
}
// OBS, ACTION and the counterfactual ANSWER forwards (no help: bridge 2 carries each character's own u2)
function lanePrepare(ctx, lane, t) {
  const { net, K, T } = ctx, w = lane.w, buf = lane.buf, streams = lane.streams;
  if (w.s !== lane.lastSeason) { lane.log.seasons.push(t); lane.log.tables.push(w.table.map(r => [...r])); lane.lastSeason = w.s; lane.seasonStart = t; }
  lane.obs = snapshot(w).valleys.map(b => K.encodeObs(b));
  streams.forEach((st, c) => { buf[st.pos] = lane.obs[c]; });
  runStep(net, streams, buf, 1, { poison: null }); // OBS
  streams.forEach(st => { buf[st.pos] = T.EAT; }); // placeholder: the ACTION target is masked
  runStep(net, streams, buf, 1, { poison: null }); // ACTION
  lane.pi = [EAT, PASS, REST].map(a => {
    const cl = streams.map(cloneStream);
    cl.forEach(st => { buf[st.pos - 1] = K.encodeAction(a); buf[st.pos] = T.ANS0; });
    runStep(net, cl, buf, 1, { poison: null });
    return cl.map(st => st.pMain);
  });
}
// the §4.4 choice, as liveMain's, with common random numbers keyed by the lane's stream
function laneChoose(ctx, lane, t, modelSeed) {
  const { K, T, wants, nAns } = ctx;
  lane.acts = lane.streams.map((st, c) => {
    lane.decisions += 1;
    const u1 = hash32(lane.worldSeed, modelSeed, LIVE.exploreTag, lane.stream, c, t) / 4294967296, u2 = hash32(lane.worldSeed, modelSeed, LIVE.pickTag, lane.stream, c, t) / 4294967296;
    let a;
    if (u1 < LIVE.eps) { a = Math.min(2, Math.floor(u2 * 3)); lane.explored += 1; } else {
      const U = [EAT, PASS, REST].map(x => {
        const p = lane.pi[x][c]; let z = 0, u = 0;
        for (let i = 0; i < nAns; i++) { z += p[T.ANS0 + i]; u += p[T.ANS0 + i] * wants[i]; }
        return u / z;
      });
      a = [PASS, EAT, REST].reduce((best, x) => (U[x] > U[best] ? x : best), PASS);
    }
    return K.decodeAction(K.encodeAction(a));
  });
  lane.streams.forEach((st, c) => { lane.buf[st.pos - 1] = K.encodeAction(lane.acts[c]); });
}
// the world steps; the real ANSWER forward (trainOwn: one Adam step on the lane's own heads, as L); K5 and the readouts
function laneAnswer(ctx, lane, t, trainOwn) {
  const { net, K } = ctx, streams = lane.streams, buf = lane.buf, acts = lane.acts, obs = lane.obs;
  lane.outs = step(lane.w, acts);
  const ansTok = lane.outs.map(o => K.encodeAnswer(o.answer, o.starving));
  streams.forEach((st, c) => { buf[st.pos] = ansTok[c]; });
  runStep(net, streams, buf, 1, { train: trainOwn, poison: null });
  streams.forEach((st, c) => {
    const want = lane.pi[acts[c]][c];
    for (let i = 0; i < want.length; i++) if (want[i] !== st.pMain[i]) { lane.k5 += 1; break; }
    const lp = -Math.log(st.pMain[ansTok[c]]), d0 = K.decodeObs(obs[c]), outs = lane.outs;
    lane.ce.ans += lp; lane.ce.n += 1;
    if (!d0.down && d0.item && acts[c] === EAT) { lane.ce.eatItem += lp; lane.ce.nEat += 1; const b = t - lane.seasonStart < 32 ? 0 : t - lane.seasonStart < 128 ? 1 : 2; lane.ce.byAge[b][0] += lp; lane.ce.byAge[b][1] += 1; }
    if (outs[c].answer === ANS.COLLAPSE) lane.causes[outs[c].cause] = (lane.causes[outs[c].cause] || 0) + 1;
    const wc = lane.win[c]; wc.ce += lp; wc.n += 1; if (d0.down) wc.down += 1; if (outs[c].answer === ANS.COLLAPSE) wc.collapses += 1;
    if (!d0.down && d0.item && acts[c] === EAT) { const eff = lane.log.tables[lane.log.tables.length - 1][c][d0.item - 1]; if (eff === NOURISH) wc.nourish += 1; if (eff === TOXIC) wc.toxic += 1; }
  });
  if (trainOwn) { streams.forEach(st => adamHeads(st, streams.length)); for (const k of Object.keys(net.P)) net.P[k].g.fill(0); }
}
function laneTick(ctx, lane, t, armName, modelSeed) {
  const { net, T, ticks } = ctx, streams = lane.streams, buf = lane.buf, outs = lane.outs;
  streams.forEach(st => { buf[st.pos] = T.TICK; });
  runStep(net, streams, buf, 1, { poison: null }); // TICK
  if ((t + 1) % 512 === 0 || t + 1 === ticks) {
    lane.win.forEach((wc, c) => lane.series[c].push({ t: t + 1, score: Math.exp(-wc.ce / Math.max(1, wc.n)), goodEats: wc.nourish - wc.toxic, nourish: wc.nourish, toxic: wc.toxic, collapses: wc.collapses, awake: 1 - wc.down / Math.max(1, wc.n) }));
    if (args.progress && armName) fs.appendFileSync(args.progress, JSON.stringify({ arm: armName, seed: modelSeed, world: lane.worldSeed, t: t + 1, season: lane.w.s, chars: lane.series.map(sr => sr[sr.length - 1]) }) + '\n');
    lane.win = streams.map(lane.blank);
  }
  const log = lane.log;
  log.obs.push(lane.obs); log.acts.push(lane.acts); log.answers.push(outs.map(o => o.answer));
  log.V.push(outs.map(o => o.V)); log.pain.push(outs.map(o => o.pain)); log.gain.push(outs.map(o => o.gain)); log.causes.push(outs.map(o => o.cause));
}
function laneLife(ctx, lane) {
  const { K, ticks } = ctx, log = lane.log, r = readouts({ log });
  const from = Math.max(0, ticks - 4096); let withItem = 0, good = 0, si = 0;
  for (let t = from; t < ticks; t++) { while (si + 1 < log.seasons.length && log.seasons[si + 1] <= t) si++; const tab = log.tables[si];
    for (let c = 0; c < CFG.S; c++) { const d = K.decodeObs(log.obs[t][c]); if (d.down || !d.item) continue; withItem++; if (log.acts[t][c] === EAT) { const e = tab[c][d.item - 1]; if (e === NOURISH) good++; if (e === TOXIC) good--; } } }
  const ce = lane.ce;
  return { worldSeed: lane.worldSeed, ...r, NGElast4k: (100 * good) / Math.max(1, withItem), collapseCauses: lane.causes, loopBreaks: [...lane.w.loopBreaks], ellEnd: [...lane.w.ell], ceAnswer: ce.ans / ce.n, ceEatItem: ce.eatItem / Math.max(1, ce.nEat), nEat: ce.nEat, ceEatByAge: ce.byAge.map(([x, n]) => (n ? x / n : null)), nByAge: ce.byAge.map(([, n]) => n), chain: lane.w.chain, series: lane.series };
}
function yokedMain() {
  const modelSeed = +args.seed, ticks = +(args.ticks || 16384), headLr = args.headlr !== undefined ? +args.headlr : LIVE.lr; // --headlr is for the lr = 0 check only
  const [w0, nw] = String(args.worlds || '31000,1').split(',').map(Number);
  const trunkRec = JSON.parse(fs.readFileSync(args.trunk, 'utf8'));
  if (trunkRec.arm !== 'RC' || !trunkRec.nursery) throw new Error('live: the trunk must be a nursery RC run');
  const PP = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'preset', 'valleys_v1.json'), 'utf8'));
  const K = makeTokens(PP), T = K.T, wants = wantsTable(PP, K), nAns = T.TICK - T.ANS0;
  const net = makeNet('RC', data, modelSeed), init = loadTrunk(net, args.trunk);
  const ctx = { net, init, K, T, wants, nAns, ticks, PP };
  const t0 = performance.now(), lives = [], sources = [];
  let k5 = 0, explored = 0, decisions = 0;
  for (let li = 0; li < nw; li++) {
    const worldSeed = w0 + li, Q = 4 * ticks;
    const actor = makeLane(ctx, worldSeed, 1), source = makeLane(ctx, worldSeed, 1);
    // the shadow: actor character c reads the source's character (c + 1) mod 4 with the actor's own heads and Adam state
    const shadows = actor.streams.map((a, c) => {
      const src = (c + 1) % CFG.S, st = makeStream(src * Q, (src + 1) * Q, false, net.V, init);
      st.base = src * Q; st.cIdx = src; st.heads = a.heads; st.adam = a.adam;
      return st;
    });
    for (let t = 0; t < ticks; t++) {
      // the actor acts in its own world; its own answers never train it
      lanePrepare(ctx, actor, t); laneChoose(ctx, actor, t, modelSeed); laneAnswer(ctx, actor, t, false); laneTick(ctx, actor, t, 'Y', modelSeed);
      // the source lives an L life; the shadow follows its tokens position by position and trains the actor's heads at ANSWER
      lanePrepare(ctx, source, t);
      runStep(net, shadows, source.buf, 1, { poison: null }); // shadow OBS
      runStep(net, shadows, source.buf, 1, { poison: null }); // shadow ACTION (target masked)
      laneChoose(ctx, source, t, modelSeed); laneAnswer(ctx, source, t, true);
      runStep(net, shadows, source.buf, 1, { train: true, poison: null }); // shadow ANSWER: the loss on another character's answer
      if (headLr > 0) shadows.forEach(st => adamHeads(st, shadows.length, headLr));
      shadows.forEach(st => HEADS.forEach(k => st.heads[k].g.fill(0)));
      for (const k of Object.keys(net.P)) net.P[k].g.fill(0);
      laneTick(ctx, source, t, null, modelSeed);
      runStep(net, shadows, source.buf, 1, { poison: null }); // shadow TICK
    }
    const life = laneLife(ctx, actor), src = laneLife(ctx, source);
    lives.push({ ...life, source: { NGE: src.NGE, collapsesPer10k: src.collapsesPer10k, ceAnswer: src.ceAnswer, k5: source.k5 } });
    k5 += actor.k5; explored += actor.explored; decisions += actor.decisions;
    console.log(JSON.stringify({ arm: 'Y', seed: modelSeed, worldSeed, NGE: +life.NGE.toFixed(2), sourceNGE: +src.NGE.toFixed(2), collapsesPer10k: +life.collapsesPer10k.toFixed(1) }));
  }
  const rec = { version: 'live1', arm: 'Y', armCfg: { live: 'shadow', bus: false, stream: 1, yoke: '(c + 1) mod 4' }, seed: modelSeed, bus: false, ticks, worlds: [w0, nw], trunk: args.trunk, trunkScript: trunkRec.script, script: selfHash, live: { ...LIVE, headLr }, wants: [...wants], k5Mismatches: k5, exploreShare: explored / decisions, lives, seconds: +((performance.now() - t0) / 1000).toFixed(1) };
  if (args.out) fs.writeFileSync(args.out, JSON.stringify(rec) + '\n');
  console.log('Y seed ' + modelSeed + ': K5 mismatches ' + k5 + ', explore share ' + rec.exploreShare.toFixed(3) + ', ' + rec.seconds + 's');
  if (k5) process.exitCode = 1;
}
