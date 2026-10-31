// taylor_relax.mjs -- Hypothesis A experiment (Node.js, zero dependencies).
//
// Question: do generic, non-toroidal "spheroid" field blobs, and pairs of counter-rotating
// toroids, relax into ONE toroidal (spheromak / Taylor) state, and what does the stored
// energy do?
//
// Model (axisymmetric, zero-beta, perfectly conducting cylindrical flux conserver r<=1, 0<=z<=1,
// mu0 = 1):   B = grad(psi) x grad(phi) + F grad(phi),   psi = poloidal flux fn, F = r*B_phi.
//   W = (1/2) INT B^2 dV      = pi * INT (|grad psi|^2 + F^2)/r  dr dz
//   K = INT A.B dV (helicity) = 4*pi * INT psi*F/r               dr dz
//   Delta* psi = r d/dr( (1/r) dpsi/dr ) + d2psi/dz2
// Taylor: minimise W at fixed K  =>  F = lam*psi,  -Delta* psi = lam^2 psi (Dirichlet),  W = lam*K/2.
// Relaxation here = projected steepest descent of the Rayleigh quotient R = W/K, rescaled to
// keep K fixed after every step. It is the *variational* form of Taylor relaxation (a path of
// energy-lowering, helicity-preserving "dissipative events"), NOT a time-accurate MHD run.
//
// Usage: node taylor_relax.mjs [--quick] [--n=40] [--only=C0,C1,C2,C3] [--steps=N]   (default grid 40x40, 200000 steps, ~3 min)

const QUICK = process.argv.includes('--quick');
const argv = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--') && a.includes('=')).map((a) => a.slice(2).split('=')));
const NR = Number(argv.n) || 40, NZ = NR, DR = 1 / NR, DZ = 1 / NZ;
const NJ = NZ + 1, SZ = (NR + 1) * NJ;
const id = (i, j) => i * NJ + j;
const rr = (i) => i * DR;
const PI = Math.PI;

// ---------- special function: J1 by series (|x| < ~12 is plenty here) ----------
function J1(x) {
  let term = x / 2, sum = term;
  for (let m = 1; m < 60; m++) { term *= -(x * x / 4) / (m * (m + 1)); sum += term; }
  return sum;
}
const J11 = 3.831705970207512;               // first zero of J1
const LAM1 = Math.hypot(J11, PI);            // analytic lowest eigenvalue, a = h = 1
const LAM2 = Math.hypot(J11, 2 * PI);        // n = 2 axial mode

// ---------- discrete operators ----------
function negDeltaStar(psi, out) {            // out = -Delta* psi on interior, 0 on boundary
  out.fill(0);
  for (let i = 1; i < NR; i++) {
    const rp = (i + 0.5) * DR, rm = (i - 0.5) * DR, r = rr(i);
    for (let j = 1; j < NZ; j++) {
      const c = psi[id(i, j)];
      const radial = r * ((psi[id(i + 1, j)] - c) / rp - (c - psi[id(i - 1, j)]) / rm) / (DR * DR);
      const axial = (psi[id(i, j + 1)] - 2 * c + psi[id(i, j - 1)]) / (DZ * DZ);
      out[id(i, j)] = -(radial + axial);
    }
  }
}
function Q(a, b) {                           // weighted inner product  INT a b / r  dr dz
  let s = 0;
  for (let i = 1; i < NR; i++) { const w = DR * DZ / rr(i); for (let j = 1; j < NZ; j++) s += a[id(i, j)] * b[id(i, j)] * w; }
  return s;
}
const tmp = new Float64Array(SZ);
function energy(psi, F) { negDeltaStar(psi, tmp); return PI * (dotLw(psi, tmp) + Q(F, F)); }
function dotLw(psi, nds) {                   // P = INT psi * (-Delta* psi)/r
  let s = 0;
  for (let i = 1; i < NR; i++) { const w = DR * DZ / rr(i); for (let j = 1; j < NZ; j++) s += psi[id(i, j)] * nds[id(i, j)] * w; }
  return s;
}
const helicity = (psi, F) => 4 * PI * Q(psi, F);
function toroidalFraction(psi, F) { negDeltaStar(psi, tmp); const P = dotLw(psi, tmp), T = Q(F, F); return T / (P + T); }

// ---------- relaxation ----------
function relax(psi, F, steps, tau, label, logEvery) {
  const K0 = helicity(psi, F);
  if (!(K0 > 0)) throw new Error(label + ': need K>0, got ' + K0);
  const nds = new Float64Array(SZ);
  let W = energy(psi, F);
  const W0 = W; let violations = 0, maxRise = 0, Wprev = W; const trace = [[0, W / W0, 1]];
  for (let s = 1; s <= steps; s++) {
    negDeltaStar(psi, nds);
    const K = helicity(psi, F), R = W / K;
    for (let i = 1; i < NR; i++) for (let j = 1; j < NZ; j++) {
      const k = id(i, j);
      const gpsi = 2 * nds[k] - 4 * R * F[k];
      const gF = 2 * F[k] - 4 * R * psi[k];
      psi[k] -= tau * gpsi; F[k] -= tau * gF;
    }
    const sc = Math.sqrt(K0 / helicity(psi, F));            // restore helicity exactly
    for (let k = 0; k < SZ; k++) { psi[k] *= sc; F[k] *= sc; }
    W = energy(psi, F);
    const rise = (W - Wprev) / W0; if (rise > 1e-12) { violations++; if (rise > maxRise) maxRise = rise; }
    Wprev = W;
    if (s % logEvery === 0 || s === steps) trace.push([s, W / W0, helicity(psi, F) / K0]);
  }
  const Kend = helicity(psi, F);
  return { label, W0, W, K0, Kend, lamEff: 2 * W / Kend, released: 1 - W / W0, violations, maxRise, trace };
}

// ---------- diagnostics ----------
function axis(psi) {                          // magnetic axis = extremum of |psi|
  let best = 0, bi = 0, bj = 0;
  for (let i = 1; i < NR; i++) for (let j = 1; j < NZ; j++) { const v = Math.abs(psi[id(i, j)]); if (v > best) { best = v; bi = i; bj = j; } }
  return { r: rr(bi), z: bj * DZ };
}
function corr(a, b) { const aa = Q(a, a), bb = Q(b, b); return Q(a, b) / Math.sqrt(aa * bb); }
function analyticPsi(n) { const p = new Float64Array(SZ); for (let i = 1; i < NR; i++) for (let j = 1; j < NZ; j++) p[id(i, j)] = rr(i) * J1(J11 * rr(i)) * Math.sin(n * PI * j * DZ); return p; }
function scaled(p, f) { return p.map((v) => v * f); }
function ascii(psi) {                         // r-z half-plane mirrored: the two lobes are the torus cross-section
  const ch = ' .:-=+*#%@'; let mx = 0; for (let k = 0; k < SZ; k++) mx = Math.max(mx, Math.abs(psi[k]));
  const rows = [];
  for (let j = NZ - 2; j >= 2; j -= 2) {
    let line = '';
    for (let i = NR - 2; i >= 1; i -= 1) line += ch[Math.min(9, Math.floor((Math.abs(psi[id(i, j)]) / mx) * 9.99))];
    line += '|';
    for (let i = 1; i <= NR - 2; i += 1) line += ch[Math.min(9, Math.floor((Math.abs(psi[id(i, j)]) / mx) * 9.99))];
    rows.push(line);
  }
  return rows.join('\n');
}
const bump = (r0, z0, w) => { const p = new Float64Array(SZ); for (let i = 1; i < NR; i++) for (let j = 1; j < NZ; j++) p[id(i, j)] = Math.exp(-(((rr(i) - r0) ** 2 + (j * DZ - z0) ** 2) / (2 * w * w))); return p; };
const add = (a, b, fb = 1) => a.map((v, k) => v + fb * b[k]);

const ONLY = argv.only || '';
const want = (c) => !ONLY || ONLY.split(',').includes(c);
const SC = (40 / NR) ** 2;                    // explicit-stability scaling: tau ~ dr^2, steps ~ 1/dr^2
const STEPS = Number(argv.steps) || Math.round((QUICK ? 4000 : 200000) / SC), TAU = 4e-5 * SC;
const out = { grid: [NR, NZ], tau: TAU, steps: STEPS, lam1_analytic: LAM1, lam2_analytic: LAM2, cases: [] };
const fmt = (x, d = 4) => (typeof x === 'number' ? x.toFixed(d) : x);
console.log(`grid ${NR}x${NZ}, tau ${TAU}, steps ${STEPS}; analytic lam1=${fmt(LAM1)} lam2=${fmt(LAM2)} predicted release n=2->n=1: ${fmt(1 - LAM1 / LAM2)}`);

// ---- Case 0: control, start at analytic ground state (numerical-noise floor) ----
if (want('C0')) {
  const psi = analyticPsi(1), F = scaled(psi, LAM1);
  const r = relax(psi, F, STEPS, TAU, 'C0 control: analytic Taylor state', 5000);
  out.cases.push(r);
  console.log(`\n[C0] start in analytic ground state: W released ${fmt(100 * r.released, 3)} % (discretisation floor), lam_eff ${fmt(r.lamEff)}, K drift ${fmt(r.Kend / r.K0 - 1, 8)}, W-rise violations ${r.violations}`);
}

// ---- Case 1: generic off-centre blobs (no toroidal structure), net helicity > 0 ----
let relaxedBlob;
if (want('C1')) {
  const psi = bump(0.55, 0.35, 0.18), F = add(scaled(bump(0.45, 0.6, 0.2), 1.6), bump(0.7, 0.3, 0.15), -0.4);
  if (helicity(psi, F) < 0) F.forEach((v, k) => (F[k] = -v));
  const r = relax(psi, F, STEPS, TAU, 'C1 generic blobs', 5000);
  const ax = axis(psi), pa = analyticPsi(1);
  r.axis = ax; r.corrF = corr(F, psi); r.overlapAnalytic = Math.abs(corr(psi, pa)); r.toroidalEnergyFraction = toroidalFraction(psi, F);
  out.cases.push(r); relaxedBlob = psi;
  console.log(`\n[C1] generic blobs -> W/W0 ${fmt(r.W / r.W0)} (released ${fmt(100 * r.released, 2)} %), K drift ${fmt(r.Kend / r.K0 - 1, 8)}, lam_eff ${fmt(r.lamEff)} vs analytic ${fmt(LAM1)}`);
  console.log(`     magnetic axis at r=${fmt(ax.r, 3)}, z=${fmt(ax.z, 3)} (ring radius > 0 => toroidal), corr(F,psi) ${fmt(r.corrF, 5)}, overlap with analytic spheromak ${fmt(r.overlapAnalytic, 5)}, toroidal energy fraction ${fmt(r.toroidalEnergyFraction, 4)}, W-rise violations ${r.violations}`);
  console.log(ascii(psi));
}

// ---- Case 2: two stacked counter-poloidal toroids = excited Beltrami state n=2 (+20% n=1 admixture) ----
if (want('C2')) {
  const base = analyticPsi(2), n1 = analyticPsi(1);
  // n=2 is a saddle of W/K; admix 20 % (amplitude) of the n=1 Taylor state, in BOTH psi and F, to start off the saddle
  const eps = 0.2 * Math.max(...base) / Math.max(...n1);
  const psi = add(base, n1, eps), F = add(scaled(base, LAM2), scaled(n1, LAM1), eps);
  const r = relax(psi, F, STEPS, TAU, 'C2 two counter-poloidal toroids (n=2) -> n=1', 5000);
  r.predictedRelease = 1 - LAM1 / LAM2; r.axis = axis(psi);
  out.cases.push(r);
  console.log(`\n[C2] two stacked counter-poloidal toroids -> W/W0 ${fmt(r.W / r.W0)}, released ${fmt(100 * r.released, 2)} % (Taylor prediction ${fmt(100 * r.predictedRelease, 2)} %), lam_eff ${fmt(r.lamEff)}, axis r=${fmt(r.axis.r, 3)} z=${fmt(r.axis.z, 3)}, violations ${r.violations}`);
}

// ---- Case 3: counter-HELICITY pair: same poloidal sign, opposite toroidal sign; helicity ratio b ----
for (const b of (QUICK ? [0, 0.5] : [0, 0.25, 0.5, 0.8, 0.9]).filter(() => want('C3'))) {
  const psi = new Float64Array(SZ), F = new Float64Array(SZ);
  const pa = analyticPsi(2);
  for (let i = 1; i < NR; i++) for (let j = 1; j < NZ; j++) {
    const k = id(i, j), z = j * DZ, lower = z < 0.5;
    const amp = lower ? 1 : Math.sqrt(b);                     // K_upper = b * K_lower
    psi[k] = amp * Math.abs(pa[k]);                           // both toroids: poloidal flux > 0
    F[k] = (lower ? 1 : -1) * LAM2 * amp * Math.abs(pa[k]);   // toroidal field opposite in the upper one
  }
  // small symmetry-breaking noise so the flow can leave the two-lobe saddle
  for (let k = 0; k < SZ; k++) { const i = Math.floor(k / NJ), j = k % NJ; if (i > 0 && i < NR && j > 0 && j < NZ) psi[k] *= 1 + 0.01 * Math.sin(7 * i + 3 * j); }
  const r = relax(psi, F, STEPS, TAU, `C3 counter-helicity pair, K_up/K_low = ${b}`, 5000);
  r.b = b; r.Knet_over_Ksum = (1 - b) / (1 + b);
  r.predictedRelease = 1 - (LAM1 / LAM2) * (1 - b) / (1 + b);   // approx: ignores mid-plane interface energy
  r.axis = axis(psi); r.toroidalEnergyFraction = toroidalFraction(psi, F);
  out.cases.push(r);
  console.log(`[C3 b=${b}] W/W0 ${fmt(r.W / r.W0)}, released ${fmt(100 * r.released, 2)} % (approx prediction ${fmt(100 * r.predictedRelease, 2)} %), lam_eff ${fmt(r.lamEff)}, W_final/(lam1*K/2) ${fmt(r.W / (LAM1 * r.Kend / 2), 4)}, axis r=${fmt(r.axis.r, 3)} z=${fmt(r.axis.z, 3)}, violations ${r.violations}`);
}

// ---- Case 4: random smooth starts (generality check: do they ALL end in the same toroidal state?) ----
if (want('C4')) {
  let seed = 12345; const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rand = () => { const p = new Float64Array(SZ); for (let a = 1; a <= 4; a++) for (let b = 1; b <= 4; b++) { const c = (rnd() - 0.5) / (a * b); for (let i = 1; i < NR; i++) for (let j = 1; j < NZ; j++) p[id(i, j)] += c * Math.sin(a * PI * rr(i)) * Math.sin(b * PI * j * DZ); } return p; };
  const res = [];
  for (let n = 0; n < (QUICK ? 2 : 8); n++) {
    const psi = rand(), F = rand(); if (helicity(psi, F) < 0) F.forEach((v, k) => (F[k] = -v));
    const r = relax(psi, F, Math.min(STEPS, Math.round(100000 / SC)), TAU, 'C4 random start #' + n, 10000);
    r.axis = axis(psi); r.corrF = corr(F, psi); r.toroidalEnergyFraction = toroidalFraction(psi, F); r.overlapAnalytic = Math.abs(corr(psi, analyticPsi(1)));
    out.cases.push(r); res.push(r);
    console.log(`[C4 #${n}] W/W0 ${fmt(r.W / r.W0)}, lam_eff ${fmt(r.lamEff)}, axis r=${fmt(r.axis.r, 3)} z=${fmt(r.axis.z, 3)}, corr(F,psi) ${fmt(r.corrF, 5)}, overlap ${fmt(r.overlapAnalytic, 5)}, tor.frac ${fmt(r.toroidalEnergyFraction, 4)}, violations ${r.violations}`);
  }
  const lams = res.map((r) => r.lamEff), lmin = Math.min(...lams);
  console.log(`     C4 summary: lam_eff min ${fmt(lmin)} max ${fmt(Math.max(...lams))}; runs within 0.2% of the lowest: ${lams.filter((l) => Math.abs(l / lmin - 1) < 0.002).length}/${lams.length}`);
}

// ---- Part 2: Rayleigh discriminant for coaxial counter-rotating swirl (toroidal Taylor-cell onset) ----
{
  const N = 400; let minCo = Infinity, minCounter = Infinity;
  const gammaCo = (r) => (r < 1 ? r * r : 1);                          // Rankine core + irrotational outer flow
  const gammaCounter = (r) => (r < 1 ? r * r : 1 - 2 * Math.min(1, (r - 1) / 0.5)); // outer shell spins the other way, Gamma: +1 -> -1
  for (let i = 1; i < N; i++) {
    const r = 0.005 + (2.5 * i) / N, h = 1e-4;
    const phi = (g) => (g(r + h) ** 2 - g(r - h) ** 2) / (2 * h) / r ** 3;   // (1/r^3) d(Gamma^2)/dr
    minCo = Math.min(minCo, phi(gammaCo)); minCounter = Math.min(minCounter, phi(gammaCounter));
  }
  out.rayleigh = { minCo, minCounter };
  console.log(`\n[P2] Rayleigh discriminant min: co-rotating Rankine ${fmt(minCo, 4)} (>=0 => stable), counter-rotating shell ${fmt(minCounter, 4)} (<0 => centrifugally unstable layer => toroidal Taylor cells)`);
}

// ---- Part 3: hydraulic input power of the Gharib et al. 2017 jet from the paper's quoted d and v ----
{
  const d = 85e-6, v = 255, rho = 1000, A = PI * d * d / 4, Qv = A * v, P = 0.5 * rho * Qv * v * v;
  out.gharib = { d, v, flow_mL_s: Qv * 1e6, hydraulicPower_W: P, stagnationPressure_MPa: 0.5 * rho * v * v / 1e6 };
  console.log(`\n[P3] Gharib jet d=85 um, v=255 m/s: flow ${fmt(Qv * 1e6, 3)} mL/s, jet kinetic power ${fmt(P, 1)} W, stagnation pressure ${fmt(0.5 * rho * v * v / 1e6, 1)} MPa`);
}

import('node:fs').then((fs) => {
  const path = new URL('./taylor_relax_results' + (QUICK ? '_quick' : '') + (NR !== 40 ? '_n' + NR : '') + '.json', import.meta.url);
  fs.writeFileSync(path, JSON.stringify(out, null, 1)); console.log('\nresults written to', path.pathname);
});
