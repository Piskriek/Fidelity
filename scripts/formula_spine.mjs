#!/usr/bin/env node
/**
 * FORMULA SPINE — the plan's key formulas, read from the plan text and tested by behaviour.
 *
 * Each entry extracts its parameters (signs, min/max, inequality directions, constants, units,
 * data types, enum members) straight from the Plan with a regex, rebuilds the rule as code, and
 * checks it against its purpose (`why`), using four kinds of test:
 *   - probe      : sign / monotonicity / boundary behaviour the purpose demands
 *   - roundtrip  : a stated inverse really inverts
 *   - units      : unit tokens and scales are consistent, named extremes fit the stated range
 *   - identity   : stated counts, sums and products recompute
 * Because the parameters come from the text, editing a formula in the Plan changes what is tested;
 * an extractor that no longer matches is reported as DRIFT (the formula moved or was rewritten).
 * Units checks are token-level (unit family and scale), not full symbolic dimensional analysis.
 * Entries marked `kind: 'pin'` only check that a guard is still written; their failures are reported
 * as `FAIL(pin)`, not as proven property failures.
 *
 * Usage: node scripts/formula_spine.mjs [triadDir] [--quiet]   (exit 1 on any FAIL or DRIFT)
 *        node scripts/formula_spine.mjs [triadDir] --spans     (JSON: where each entry's text sits in the Plan)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const DIR = args.find(a => !a.startsWith('--')) ?? process.env.FIDELITY_TRIAD_DIR ?? ROOT;
const plan = fs.readFileSync(path.join(DIR, 'FIDELITY_COMPLETE_BRS_V2.md'), 'utf8');

const num = s => +String(s).replace(/,/g, '');
// Unit scales to SI. Densities appear as `\text{ kg/m}^3`, so the regexes capture `kg/m` / `g/cm`.
const SCALE = { 'kg/m': 1, 'g/cm': 1e3, Pa: 1, kPa: 1e3, MPa: 1e6, GPa: 1e9, J: 1, kJ: 1e3, MJ: 1e6 };
const clamp01 = x => Math.max(0, Math.min(1, x));
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const relNear = (a, b, rel) => Math.abs(a - b) <= rel * Math.abs(b);
const DRIFT = msg => [`DRIFT: ${msg}`];
const sum = xs => xs.reduce((a, b) => a + b, 0);
// Tests that consult other Plan text go through read/readAll, which record where, so `--spans`
// can report that text as part of the entry's territory.
let reading = null;
const reads = {};
const note = m => { if (reading && m) (reads[reading] ??= []).push([m.index, m.index + m[0].length]); return m; };
const read = re => note(plan.match(re));
const readAll = re => [...plan.matchAll(re)].map(note);
// Regex source for a floor argument: no top-level comma or parenthesis, though `\,` (a thin space) is allowed.
const FLOOR = '((?:\\\\,|[^,()])+?)';
// A floor written as `10^{-3}`, `10^{-3}\,\text{m}`, `0.001` or `1e-3`; NaN otherwise.
const floorValue = s => {
  const v = s.replace(/\\[,;]|\\text\{[^}]*\}|\s/g, '');
  const p = v.match(/^(\d+(?:\.\d+)?)\^\{?(-?\d+)\}?$/);
  return p ? (+p[1]) ** +p[2] : /^\d+(?:\.\d+)?(?:e-?\d+)?$/.test(v) ? +v : NaN;
};

// Each spec: { id, why, re, test(m) -> string[] of failures }
const SPECS = [
  { id: 'F01 density map', why: 'Vtx encodes density bijectively, spanning hydrogen to osmium',
    re: /\\rho\(V_\{tx\}\) = \\rho_\{\\min\} \\left\(\\frac\{\\rho_\{\\(max|min)\}\}\{\\rho_\{\\(min|max)\}\}\\right\)\^\{\\text\{clamp\}_\{01\}\(V_\{tx\}\)\}, \\quad V_\{tx\}\(\\rho\) = \\frac\{\\ln\(\\text\{clamp\}\(\\rho, \\rho_\{\\min\}, \\rho_\{\\max\}\) \/ \\rho_\{\\min\}\)\}\{\\ln\(([^)]*)\)\}, \\quad \\rho_\{\\min\} = 10\^\{(-?\d+)\}\\text\{ ([^}]*)\}(?:\^3)?, ; \\rho_\{\\max\} = ([\d,]+)\\text\{ ([^}]*)\}/,
    test: m => {
      const [fNum, fDen, den, e, u1, max, u2] = m.slice(1);
      if (SCALE[u1.trim()] === undefined || SCALE[u2.trim()] === undefined) return [`units: unknown unit ${u1}/${u2}`];
      const lo = 10 ** +e * SCALE[u1.trim()], hi = num(max) * SCALE[u2.trim()];
      // Forward map as the plan writes it: rho_min · (num/den)^V.
      const ratio = (fNum === 'max' ? hi : lo) / (fDen === 'min' ? lo : hi);
      const rho = v => lo * ratio ** clamp01(v);
      const D = /\/ \\rho_\{\\min\}/.test(den) ? Math.log(hi / lo) : Math.log(hi);
      const inv = r => Math.log(Math.min(hi, Math.max(lo, r)) / lo) / D;
      const f = [];
      for (const v of [0, 0.25, 0.5, 0.9, 1]) if (!near(inv(rho(v)), v, 1e-9)) { f.push(`roundtrip: V=${v} -> ${inv(rho(v)).toFixed(4)}`); break; }
      if (!(lo <= 0.08988 && hi >= 22590)) f.push(`units: range [${lo}, ${hi}] kg/m^3 does not span H2 (0.0899) to osmium (22590)`);
      // The top of the range is osmium, so it must not overshoot it by more than a design margin (×2).
      if (hi > 2 * 22590) f.push(`units: rho_max = ${hi} kg/m^3 is far above osmium (22590); unit or scale error`);
      if (!(rho(0.6) > rho(0.4))) f.push('probe: density must rise with Vtx');
      return f;
    } },
  { id: 'F02 stiffness map', why: 'Pxd encodes Young\'s modulus bijectively, reaching diamond (1050 GPa)',
    re: /E_\{\\text\{Young\}\}\(P_\{xd\}\) = E_\{\\min\} \\left\(\\frac\{E_\{\\(max|min)\}\}\{E_\{\\(min|max)\}\}\\right\)\^\{\\text\{clamp\}_\{01\}\(P_\{xd\}\)\}, \\quad P_\{xd\}\(E\) = \\frac\{\\ln\(\\text\{clamp\}\(E, E_\{\\min\}, E_\{\\max\}\) \/ E_\{\\min\}\)\}\{\\ln\(([^)]*)\)\}, \\quad E_\{\\min\} = 10\^\{(-?\d+)\}\\text\{ ([^}]*)\}, ; E_\{\\max\} = ([\d,]+)\\text\{ ([^}]*)\}/,
    test: m => {
      const [fNum, fDen, den, e, u1, max, u2] = m.slice(1);
      if (SCALE[u1.trim()] === undefined || SCALE[u2.trim()] === undefined) return [`units: unknown unit ${u1}/${u2}`];
      const lo = 10 ** +e * SCALE[u1.trim()], hi = num(max) * SCALE[u2.trim()];
      const ratio = (fNum === 'max' ? hi : lo) / (fDen === 'min' ? lo : hi);
      const E = p => lo * ratio ** clamp01(p);
      const D = /\/ E_\{\\min\}/.test(den) ? Math.log(hi / lo) : Math.log(hi);
      const inv = x => Math.log(Math.min(hi, Math.max(lo, x)) / lo) / D;
      const f = [];
      if (u1.trim() !== u2.trim()) f.push(`units: E_min in ${u1.trim()} but E_max in ${u2.trim()}`);
      if (hi < 1050e9) f.push(`units: E_max = ${hi / 1e9} GPa cannot reach diamond (1050 GPa)`);
      for (const p of [0, 0.5, 1]) if (!near(inv(E(p)), p, 1e-9)) { f.push(`roundtrip: P=${p} -> ${inv(E(p)).toFixed(4)}`); break; }
      return f;
    } },
  { id: 'F03 vacuum melting floor', why: 'matter keeps a melting point above 0 K even in vacuum, and pressure raises it',
    re: /p_\{\\text\{eff\}\}\(P_\{xd\}, p_\{\\text\{atm\}\}\) = \\left\(\\max\(10\^\{(-?\d+)\}, ; ([\d.]+) \\cdot P_\{xd\}, ; p_\{\\text\{atm\}\}\)\\right\)\^\{([\d.]+)\}\$\$ \$\$T_\{\\text\{melt\}\} = \((\d+) \+ (\d+) \\cdot P_\{xd\}\(1 - ([\d.]+) A_q\)\)/,
    test: m => {
      const [fe, b, ex, c0, c1, c2] = m.slice(1).map(num);
      const peff = (pxd, patm) => Math.max(10 ** fe, b * pxd, patm) ** ex;
      const T = (pxd, aq, patm) => (c0 + c1 * pxd * (1 - c2 * aq)) * peff(pxd, patm);
      const f = [];
      if (!(T(0, 1, 0) > 0)) f.push(`probe: T_melt in vacuum = ${T(0, 1, 0)} K`);
      if (!(T(0.8, 0.5, 1) > T(0.2, 0.5, 1))) f.push('probe: T_melt must rise with Pxd');
      if (!(T(0.5, 0.5, 2) >= T(0.5, 0.5, 1))) f.push('probe: T_melt must not fall with pressure');
      return f;
    } },
  { id: 'F04 KL precision term', why: 'the loss is >= 0 and minimal at the baseline precision',
    re: /\\frac\{\\Pi_i\}\{\\Pi_\{0,i\}\} ([+-]) \\ln\\frac\{\\Pi_i\}\{\\Pi_\{0,i\}\} - 1/,
    test: m => {
      const s = m[1] === '-' ? -1 : 1;
      const f = x => x + s * Math.log(x) - 1;
      const bad = [0.1, 0.5, 2, 10].filter(x => f(x) < 0);
      return [...(bad.length ? [`probe: term negative at ratio ${bad.join(', ')}`] : []), ...(near(f(1), 0) ? [] : ['probe: not zero at the baseline'])];
    } },
  { id: 'F05 gravity', why: 'gravity attracts toward each star and falls off as 1/r^2',
    re: /\\frac\{G M_k \(([^)]*)\)\}\{\\max\(10\^\{-6\}, \|\\mathbf\{q\}_\{\\star, k\} - \\mathbf\{q\}\|_2\^2\)\^\{([^}]*)\}\}/,
    test: m => {
      const towardStar = /^\\mathbf\{q\}_\{\\star, k\} - \\mathbf\{q\}$/.test(m[1].trim());
      const [a, b] = m[2].split('/').map(Number);
      const p = b ? a / b : a;
      const g = (q, s) => ((towardStar ? s - q : q - s) / Math.max(1e-6, (s - q) ** 2) ** p);
      const f = [];
      if (!(Math.sign(g(1, 0)) === -1)) f.push('probe: field at q=1 points away from a star at 0 (repulsive)');
      const ratio = Math.abs(g(2, 0) / g(1, 0));
      if (!near(ratio, 0.25, 1e-6)) f.push(`probe: |g(2r)|/|g(r)| = ${ratio}, expected 0.25 (inverse square)`);
      return f;
    } },
  { id: 'F06 starlight irradiance', why: 'starlight adds incoherently and falls off as 1/r^2',
    re: /E\(\\mathbf\{q\}\) = \\sum_k L_\{x,k\} \/ \(4\\pi \\max\(10\^\{(-?\d+)\}, \|\\mathbf\{q\}_\{\\star,k\} - \\mathbf\{q\}\|\^(\d)\)\)/,
    test: m => [...(+m[2] === 2 ? [] : [`probe: irradiance falls as 1/r^${m[2]}`]), ...(+m[1] <= -2 && +m[1] >= -12 ? [] : [`probe: distance floor 1e${m[1]} m² is not a small positive floor`])] },
  { id: 'F07 daySatisfaction', why: 'a convex blend of four [0,1] scores stays in [0,1]',
    re: /daySatisfaction\}\(d\) = ([^$]*)\$\$/,
    test: m => {
      const terms = [...m[1].matchAll(/(^|[+-]) ?(\d\.\d+) \\cdot/g)].map(x => (x[1] === '-' ? -1 : 1) * +x[2]);
      return near(sum(terms), 1) && terms.length === 4 && terms.every(w => w > 0) ? [] : [`identity: weights ${terms.join(', ')} (must be four positive weights summing to 1)`];
    } },
  { id: 'F08 reputation', why: 'reputation rises with good days and falls with bad ones',
    re: /R_\{\\text\{prev\}\} \+ ([\d.]+) \\cdot \(S_\{\\text\{day\}\} ([+-]) ([\d.]+)\)/,
    test: m => {
      const [k, sg, c] = [+m[1], m[2], +m[3]];
      const d = s => k * (s + (sg === '-' ? -c : c));
      const f = [];
      if (!(d(0) < 0)) f.push(`probe: a day with satisfaction 0 changes reputation by ${d(0).toFixed(2)} (should fall)`);
      if (!(d(1) > 0)) f.push('probe: a perfect day must raise reputation');
      return f;
    } },
  { id: 'F09 symbiotic progress', why: 'progress grows with practice and is capped at 1',
    re: /Progress\}_\{4\\text\{D\}\}\^\{\\text\{next\}\} = \\(min|max)\(1\.0, \\text\{Progress\}_\{4\\text\{D\}\} \+ ([\d.]+) \\Delta H/,
    test: m => {
      const op = m[1] === 'min' ? Math.min : Math.max, k = +m[2];
      const next = (p, dh) => op(1, p + k * dh);
      const f = [];
      if (next(0.2, 0) !== 0.2) f.push(`probe: progress 0.2 with no practice becomes ${next(0.2, 0)}`);
      if (next(0.95, 1) > 1) f.push('probe: progress exceeds 1');
      return f;
    } },
  { id: 'F10 zero-G stability gate', why: 'a craft thrusting through its centre of mass passes; a badly offset one fails',
    re: /\\left\(1 ([+-]) \\frac\{\\tau_\{\\text\{arm\}\}\}\{2 \\max\(10\^\{-3\}, r_\{\\text\{RCS\}\}\)\}\\right\) (\\ge|\\le) ([\d.]+)/,
    test: m => {
      const [sg, op, thr] = [m[1], m[2], +m[3]];
      const pass = s => (op === '\\ge' ? s >= thr : s <= thr);
      const S = (tau, r) => clamp01(1 + (sg === '-' ? -1 : 1) * tau / (2 * Math.max(1e-3, r)));
      return [...(pass(S(0, 1)) ? [] : ['probe: a perfectly aligned craft fails']), ...(!pass(S(2, 1)) ? [] : ['probe: a maximally offset craft passes'])];
    } },
  { id: 'F11 planetary stability gate', why: 'a craft balanced over its support passes, a far-offset one fails, and the threshold is reachable',
    re: /S_\{\\text\{stab\}\} = \\text\{clamp\}_\{01\}\\left\(1 ([+-]) \\frac\{\\xi_\{\\text\{offset\}\}\}\{2\.2 \\max\(10\^\{-3\}, r_\{\\text\{support\}\}\)\}\\right\) (\\ge|\\le) ([\d.]+)/,
    test: m => {
      const [sg, op, thr] = [m[1], m[2], +m[3]];
      const pass = s => (op === '\\ge' ? s >= thr : s <= thr);
      const S = (xi, r) => clamp01(1 + (sg === '-' ? -1 : 1) * xi / (2.2 * Math.max(1e-3, r)));
      return [...(pass(S(0, 1)) ? [] : ['probe: a craft balanced over its support fails']), ...(!pass(S(5, 1)) ? [] : ['probe: a craft offset far beyond its support passes']),
        ...(thr > 0 && thr < 1 ? [] : [`probe: threshold ${thr} is unreachable for a score clamped to [0,1]`])];
    } },
  { id: 'F12 gravity regime split', why: 'every gravity value falls in exactly one stability regime',
    re: /In Zero-G \/ Microgravity \(`safeG (<|<=) ([\d.]+)`\)[\s\S]{0,4000}?In planetary gravity \(`safeG (>=|>) ([\d.]+)`\)/,
    test: m => {
      const z = g => (m[1] === '<' ? g < +m[2] : g <= +m[2]), pl = g => (m[3] === '>=' ? g >= +m[4] : g > +m[4]);
      // Probe each parsed threshold and the points either side of it, so a gap or overlap between them shows.
      const eps = 1e-6, pts = [0, 9.81, ...[+m[2], +m[4]].flatMap(t => [t - eps, t, t + eps]), (+m[2] + +m[4]) / 2];
      const bad = pts.filter(g => Number(z(g)) + Number(pl(g)) !== 1);
      return bad.length ? [`boundary: g = ${bad.join(', ')} falls in ${bad.map(g => Number(z(g)) + Number(pl(g))).join('/')} regimes`] : [];
    } },
  { id: 'F13 lateral symmetry', why: 'balanced craft score 1, lopsided craft 0, empty craft 0',
    re: /S_\{\\text\{sym\}\} = \\(max|min)\(0, 1 ([+-]) (\d+)\|m_L - m_R\| \/ \\max\(10\^\{(-?\d+)\}, m_L \+ m_R\)\)\$, and \$S_\{\\text\{sym\}\} = (\d)\$ when \$m_L \+ m_R = 0\$/,
    test: m => {
      const [op, sg, k, fl, empty] = [m[1], m[2], +m[3], +m[4], +m[5]];
      const S = (l, r) => (l + r === 0 ? empty : (op === 'max' ? Math.max : Math.min)(0, 1 + (sg === '-' ? -1 : 1) * k * Math.abs(l - r) / Math.max(10 ** fl, l + r)));
      const f = [];
      if (S(5, 5) !== 1) f.push(`probe: a balanced craft scores ${S(5, 5)}`);
      if (S(10, 0) !== 0) f.push(`probe: a one-sided craft scores ${S(10, 0)}`);
      if (S(0, 0) !== 0) f.push(`probe: an empty craft scores ${S(0, 0)}`);
      return f;
    } },
  { id: 'F14 taste total', why: 'a convex blend of three gate scores against a reachable pass threshold',
    re: /total score \$T = ([^$]*) \\ge ([\d.]+)\$/,
    test: m => { const w = [...m[1].matchAll(/(\d\.\d+) S_/g)].map(x => +x[1]); return [...(near(sum(w), 1) && w.length === 3 ? [] : [`identity: weights ${w.join(' + ')} = ${sum(w).toFixed(2)}`]), ...(+m[2] > 0 && +m[2] < 1 ? [] : [`probe: threshold ${m[2]} is unreachable`])]; } },
  { id: 'F15 recovery debt', kind: 'pin', why: 'repeated doses cost more, but debt is bounded (64 rest cycles)',
    re: /recovery debt \$2\^\{([^}]*\}?)\}\$/,
    test: m => (/\\min\(6, n-1\)/.test(m[1]) ? [] : [`probe: debt exponent "${m[1]}" is unbounded (n = 100 gives 2^99)`]) },
  { id: 'F16 breadcrumb excitement', why: 'excitement stays in [0,1] for every breadcrumb (pinless and empty ones too), crowding never raises it, and an evenly shared niche is not penalised',
    re: /\$\$E\(c, b\) = ([\s\S]*?)\$\$/,
    test: m => {
      // Rebuild E from its parsed pieces; a missing floor evaluates as a raw denominator (0/0 at the empty case).
      const t = m[1], pick = (re, i = 1) => t.match(re)?.[i];
      const a = pick(/\\left\( ([\d.]+) \\frac\{\\mathbf\{s\}_c/), b = pick(/\)\}\s?([+-]) ([\d.]+) \\frac\{\|P_c \\cap P_b\|\}/, 2), sb = pick(/\)\}\s?([+-]) ([\d.]+) \\frac\{\|P_c \\cap P_b\|\}/);
      const outer = t.match(/\\cdot \\max\\left\(0, 1 ([+-]) ([\d.]+) \\max\\left\(0, \\frac/);
      const inner = pick(/[)}]\s*\}\s*([+-]) \\frac\{1\}\{/);
      if (!a || !b || !outer || !inner) return DRIFT('breadcrumb excitement pieces not found');
      // Floor of a denominator `{\max(floor, x)}` or `{\max(x, floor)}`; 0 when the floor is missing.
      const fl = x => { const r = t.match(new RegExp(`\\{\\s*\\\\max\\(\\s*${FLOOR}, ${x}\\s*\\)\\s*\\}|\\{\\s*\\\\max\\(\\s*${x}, ${FLOOR}\\s*\\)\\s*\\}`)); return r ? floorValue(r[1] ?? r[2]) : 0; };
      const f1 = fl('\\|\\\\mathbf\\{s\\}_c\\|\\|\\\\mathbf\\{s\\}_b\\|'), f2 = fl('\\|P_b\\|');
      const f3 = fl('N_\\{\\\\text\\{total\\}\\}'), f4 = fl('K_\\{\\\\text\\{niches\\}\\}');
      const clamped = /^\s*\\text\{clamp\}_\{01\}\\left\(/.test(t);
      const E = ({ dot = 0, norm = 0, inter = 0, Pb = 0, niche = 0, total = 0, K = 0 }) => {
        const base = +a * dot / Math.max(f1, norm) + (sb === '-' ? -1 : 1) * +b * inter / Math.max(f2, Pb);
        const pen = Math.max(0, niche / Math.max(f3, total) + (inner === '-' ? -1 : 1) / Math.max(f4, K));
        return (clamped ? clamp01(base) : base) * Math.max(0, 1 + (outer[1] === '-' ? -1 : 1) * +outer[2] * pen);
      };
      const full = { dot: 1, norm: 1, inter: 3, Pb: 3, total: 10, K: 5 };
      const cases = { empty: {}, pinless: { dot: 1, norm: 1, total: 10, K: 5, niche: 2 }, even: { ...full, niche: 2 }, crowded: { ...full, niche: 10 }, opposed: { ...full, dot: -1, niche: 2 } };
      const v = Object.fromEntries(Object.entries(cases).map(([k, c]) => [k, E(c)]));
      const f = Object.entries(v).filter(([, x]) => !(x >= 0 && x <= 1)).map(([k, x]) => `probe: ${k} breadcrumb scores ${x}`);
      if (v.crowded > v.even + 1e-12) f.push(`probe: crowding raises excitement (${v.even} → ${v.crowded})`);
      if (!near(v.even, clamped ? clamp01(+a + (sb === '-' ? -1 : 1) * +b) : +a + (sb === '-' ? -1 : 1) * +b)) f.push(`probe: an evenly shared niche is penalised (${v.even})`);
      return f;
    } },
  { id: 'F17 VSA size', why: 'a 4096-bit hypervector in 32-bit words',
    re: /VSA-4096 \(\*\*`Uint32Array\((\d+)\)`\*\*, (\d+) bytes\)/,
    test: m => (+m[1] * 32 === 4096 && +m[1] * 4 === +m[2] ? [] : [`identity: Uint32Array(${m[1]}) = ${+m[1] * 32} bits / ${+m[1] * 4} bytes, stated 4096 bits / ${m[2]} bytes`]) },
  { id: 'F18 sector quantum', why: 'the sector is an exact power of two made of whole local quanta',
    re: /quantum \$2\^\{(\d+)\}\\text\{ m\} = ([\d,]+)\\text\{ m\} = (\d+) \\times (\d+)\\text\{ m\}\$/,
    test: m => (2 ** +m[1] === num(m[2]) && +m[3] * +m[4] === num(m[2]) ? [] : [`identity: 2^${m[1]} = ${2 ** +m[1]}, ${m[3]} × ${m[4]} = ${+m[3] * +m[4]}, stated ${m[2]}`]) },
  { id: 'F19 origin coverage', why: 'orbital + local offsets cover the whole sector, at sub-millimetre precision',
    re: /Orbital \$\\mathbf\{O\}_\{\\text\{orbital\}\}\$\*\*: `Float64Array\(3\)` bounded in \$\[-([\d,]+), \+([\d,]+)\)\\text\{ m\}\$\.[\s\S]{0,40}Local \$\\mathbf\{x\}_\{\\text\{localSelf\}\}\$\*\*: `(Float\d+)Array\(3\)` bounded in \$\(-([\d,]+), \+([\d,]+)\)/,
    test: m => {
      m = [m[0], num(m[1]), num(m[2]), m[3], num(m[4]), num(m[5])];
      if (m[1] !== m[2] || m[4] !== m[5]) return [`units: bounds are asymmetric (orbital [-${m[1]}, +${m[2]}), local (-${m[4]}, +${m[5]})), so one side of the sector is not covered`];
      const half = +m[2] + +m[5];
      // The sector half-width comes from the plan's own quantum statement (F18), not a constant.
      const q = read(/quantum \$2\^\{(\d+)\}\\text\{ m\}/);
      if (!q) return DRIFT('sector quantum statement not found');
      const sectorHalf = 2 ** +q[1] / 2;
      const bits = { Float16: 10, Float32: 23, Float64: 52 }[m[3]];
      // Largest value strictly inside the open bound sits in the binade below it.
      const spacing = bits === undefined ? Infinity : 2 ** (Math.floor(Math.log2(+m[5] * (1 - 1e-12))) - bits);
      const f = [];
      if (half < sectorHalf) f.push(`units: orbital ±${m[2]} + local ±${m[5]} covers ±${half} m of a ±${sectorHalf} m sector`);
      if (!(spacing <= 1e-3)) f.push(`units: ${m[3]} spacing at ${m[5]} m is ${spacing} m, above the sub-millimetre claim`);
      return f;
    } },
  { id: 'F20 mask law', why: 'masked actors stay anonymous',
    re: /If `actorWoreMask === (true|false)`, grudge does not attach to `actorId`/,
    test: m => (m[1] === 'true' ? [] : ['probe: an actor who wore a mask gets the grudge; one who did not stays anonymous']) },
  { id: 'F21 coercion gate', why: 'any cartridge marked coercive is rejected, whatever the value\'s type',
    re: /(rejects any cartridge whose `coerciveOverride` is present with any value other than boolean `false`|Requires all 4 internal folds and `coerciveOverride !== true`)/,
    test: m => {
      const failClosed = m[1].startsWith('rejects');
      const rejects = v => (failClosed ? v !== undefined && v !== false : v === true);
      return ['true', 1, 'yes'].every(rejects) ? [] : ['probe: coerciveOverride = "true" (string) is accepted'];
    } },
  { id: 'F22 VRAM tiers', why: 'every VRAM size maps to exactly one tier',
    re: /`<(\d+)GB -> Tier 1`, `<(\d+)GB -> Tier 2`, `(>=|>)(\d+)GB -> Tier 3`/,
    test: m => {
      const t1 = v => v < +m[1], t2 = v => v >= +m[1] && v < +m[2], t3 = v => (m[3] === '>=' ? v >= +m[4] : v > +m[4]);
      const bad = [0, +m[1] - 0.01, +m[1], +m[2] - 0.01, +m[2], 64].filter(v => [t1, t2, t3].filter(f => f(v)).length !== 1);
      return bad.length ? [`boundary: ${bad.join(', ')} GB map to no tier or two tiers`] : [];
    } },
  { id: 'F23 scar resistance cap', why: 'examples respect the cap the grammar and Part 3 state',
    re: /resist=<elem:id>:<0\.\.([\d.]+)>/,
    test: m => {
      const cap = +m[1];
      const ex = readAll(/^nem .*resist=elem:[^:\s]+:([\d.]+)/gm).map(x => +x[1]);
      const p3 = +(read(/resistance \(capped at ([\d.]+)\)/)?.[1] ?? NaN);
      return [...ex.filter(v => v > cap).map(v => `units: example resist ${v} > cap ${cap}`), ...(p3 === cap ? [] : [`identity: Part 3 cap ${p3} vs grammar cap ${cap}`])];
    } },
  { id: 'F24 somatic zones', why: 'one zone per ray per side',
    re: /Capped at (\d+) zones \*\*`1\.\.(\d+):L\|R`\*\*/,
    test: m => (+m[1] === 2 * +m[2] ? [] : [`identity: ${m[2]} rays × 2 sides = ${2 * +m[2]}, cap says ${m[1]}`]) },
  { id: 'F25 temper seam', why: 'every temper an NPC can have can be written to the shorthand',
    re: /temper=<([A-Z|_]+)>/,
    test: m => {
      const grammar = new Set(m[1].split('|'));
      const list = read(/Temper \((`[^)]*`)\)/)?.[1];
      if (!list) return DRIFT('Part 3 temper list not found');
      const part3 = [...list.matchAll(/[A-Z]{3,}/g)].map(x => x[0]);
      const missing = part3.filter(x => !grammar.has(x));
      return missing.length ? [`identity: temper(s) ${missing.join(', ')} cannot be serialized`] : [];
    } },
  { id: 'F26 archetype numbering', why: '22 archetypes: mind 1-7, body 8-14, spirit 15-21',
    re: /\| \*\*1\. Matrix\*\* \|[\s\S]*?\| \*\*7\. Great Way\*\* \|[^\n]*/,
    test: m => {
      const f = [], seen = new Set();
      for (const row of m[0].split('\n')) {
        const st = +(row.match(/^\| \*\*(\d)\./)?.[1] ?? NaN);
        if (!st) continue;
        if (seen.has(st)) f.push(`identity: station ${st} row appears twice`);
        seen.add(st);
        const ids = [...row.matchAll(/\*\*#(\d+)[ .]/g)].map(x => +x[1]);
        if (ids.length !== 3) f.push(`identity: station ${st} row has ${ids.length} readable archetype ids, expected 3`);
        else if (!(ids[0] === st && ids[1] === st + 7 && ids[2] === st + 14)) f.push(`identity: station ${st} lists #${ids.join(', #')}, expected #${st}, #${st + 7}, #${st + 14}`);
      }
      for (let st = 1; st <= 7; st++) if (!seen.has(st)) f.push(`identity: station ${st} row missing`);
      return f;
    } },
  { id: 'F27 strain units', why: 'one unit for somatic strain across dose, rest step and hibernation exit',
    re: /dissipates `-25 J` from `somaticStrainJoules`[\s\S]{0,400}?drops below `20 ([a-zA-Z]+)`/,
    test: m => (m[1] === 'J' ? [] : [`units: hibernation clears below 20 ${m[1]} while strain steps are in J`]) },
  { id: 'F28 nemesis tier example', why: 'the example record obeys tier = TIERS[min(4, ceil(score))] over the grammar\'s five tiers',
    re: /^nem vs=\S+ tier=([A-Z_]+) score=([\d.]+)/m,
    test: m => {
      const T = (read(/tier=<([A-Z_|]+)>/)?.[1] ?? '').split('|');
      if (T.length !== 5) return [`identity: the tier enum has ${T.length} members; the mapping min(4, ceil(score)) needs 5`];
      const want = T[Math.min(4, Math.ceil(+m[2]))];
      return want === m[1] ? [] : [`identity: score ${m[2]} gives ${want}, example says ${m[1]}`];
    } },
  // ---- Added after the first mutant-generator run (Method Mirror): rules whose flips survived. ----
  { id: 'F29 syncope trigger', why: 'protective syncope fires when strain is HIGH, and a zone is runaway when stiffness is high',
    re: /hit `runaway` \(a zone is `runaway` when its stage is `runaway` or \$\\kappa_\{\\text\{stiff\}\} (\\ge|\\le) ([\d.]+)\$, i\.e\. \$(\\ge|\\le) (\d+)\$ ticks[\s\S]{0,200}?or \$\\Sigma_\{\\text\{strain\}\} (\\ge|\\le) ([\d.]+)\$/,
    test: m => {
      const f = [m[1], m[3], m[5]].every(x => x === '\\ge') ? [] : ['probe: a threshold that should fire on high strain or stiffness uses ≤ (fires when healthy)'];
      // κ = min(1, rate·ticks) (DULL_ACHE), so the stated tick count must be where κ first reaches the threshold.
      const rate = read(/\\kappa_\{\\text\{stiff\}\} = \\min\(1, ([\d.]+) \\cdot \\text\{ticks\}\)/);
      if (!rate) return DRIFT('DULL_ACHE stiffness rate not found');
      const ticks = Math.ceil(+m[2] / +rate[1] - 1e-9);
      if (ticks !== +m[4]) f.push(`identity: κ ≥ ${m[2]} needs ${ticks} ticks at rate ${rate[1]}, text says ${m[4]}`);
      return f;
    } },
  { id: 'F30 thrust passivity', why: 'thrust is CAPPED by mass and power, so zero power means zero thrust',
    re: /F_\{\\text\{thrust\}\} (\\le|\\ge) \\(min|max)\\left\((\d+) \\cdot m_\{\\text\{kg\}\}, ; ([\d.]+) \\cdot P_\{\\text\{in, Watts\}\}\\right\)/,
    test: m => {
      const cap = (mass, p) => (m[2] === 'min' ? Math.min : Math.max)(+m[3] * mass, +m[4] * p);
      const ok = (F, mass, p) => (m[1] === '\\le' ? F <= cap(mass, p) : F >= cap(mass, p));
      return [...(m[1] === '\\le' ? [] : ['probe: thrust bound is a floor, not a cap']), ...(ok(10, 1, 0) ? ['probe: 10 N of thrust passes with zero input power'] : [])];
    } },
  { id: 'F31 wiregraph loop gain', why: 'loops that would amplify (gain ≥ 1) are rejected; damped loops are allowed',
    re: /rejecting any `@hm\/wiregraph` loop with cycle gain \$(\\ge|\\le|>|<) ([\d.]+)\$/,
    test: m => (m[1] === '\\ge' && +m[2] === 1 ? [] : [`probe: rejects loops with gain ${m[1]} ${m[2]}, so amplifying loops pass or damped ones fail`]) },
  { id: 'F32 indigo activation', why: 'a working activates when balance and will×faith are HIGH enough',
    re: /I_\{\\text\{indigo\}\} = ([\d.]+) \\cdot \\text\{bal\}_\{\\text\{rays\}\} ([+-]) ([\d.]+) \\cdot \(\\text\{Will\} \\times \\text\{Faith\}\) (\\ge|\\le) I_\{\\min\}/,
    test: m => [...(m[2] === '+' ? [] : ['probe: will×faith lowers activation']), ...(near(+m[1] + +m[3], 1) ? [] : [`identity: weights ${m[1]} + ${m[3]} ≠ 1`]), ...(m[4] === '\\ge' ? [] : ['probe: activation requires a LOW score'])] },
  { id: 'F33 rollout stop', why: 'the rollout stops when energy is SMALL',
    re: /until \$E_\\psi\(\\mathbf\{s\}\^\{\(K\)\}\) (\\le|\\ge) 10\^\{(-?\d+)\}\$/,
    test: m => (m[1] === '\\le' && +m[2] < 0 ? [] : [`probe: stop rule E ${m[1]} 1e${m[2]} does not mean "energy is small"`]) },
  { id: 'F34 chassis gate', why: 'a design passes when every required socket is connected (equality included)',
    re: /`hasRootChassis && socketsConnected (>=|>|<=|<|===) socketsRequired`/,
    test: m => (m[1] === '>=' ? [] : [`boundary: socketsConnected ${m[1]} socketsRequired rejects a fully connected design or accepts a partial one`]) },
  { id: 'F35 VSA similarity', why: 'identical vectors score 1, opposite vectors -1',
    re: /s\(\\mathbf\{A\}, \\mathbf\{B\}\) = 1 ([+-]) 2\\, d_H\(\\mathbf\{A\}, \\mathbf\{B\}\) \/ (\d+)/,
    test: m => {
      // Opposite vectors differ in every bit of the VSA-4096 vector, so d_H = 4096 regardless of the stated denominator.
      const BITS = 4096;
      const sim = d => 1 + (m[1] === '-' ? -2 : 2) * d / +m[2];
      return sim(0) === 1 && sim(BITS) === -1 ? [] : [`probe: s(identical) = ${sim(0)}, s(opposite, d_H = ${BITS}) = ${sim(BITS)}`];
    } },
  { id: 'F36 port-Hamiltonian dissipation', why: 'R dissipates energy: the step uses J − R, and the stated energy identity has the R term negative',
    re: /\\mathbf\{x\}\^\{k\+1\} = \\mathbf\{x\}\^k \+ \\Delta t\\, \(([^()]*)\)\\, \\bar\\nabla H[\s\S]{0,600}?H\^\{k\+1\} - H\^k = ([+-]?)\s*\\Delta t\\, \\bar\\nabla H\^\\top \\mathbf\{R\}\\, \\bar\\nabla H/,
    test: m => {
      // Read the sign each of J and R carries (in any order), then run one unforced step on H = |x|²/2
      // with J skew and R = I: the energy change must be negative and carry the identity's sign.
      const s = Object.fromEntries([...m[1].matchAll(/([+-]?)\s*\\mathbf\{(J|R)\}/g)].map(t => [t[2], t[1] === '-' ? -1 : 1]));
      if (s.J === undefined || s.R === undefined) return [`probe: step lacks J or R (${m[1]})`];
      const g = [1, 0.5], Jg = [g[1], -g[0]];
      const dH = s.J * (g[0] * Jg[0] + g[1] * Jg[1]) + s.R * (g[0] ** 2 + g[1] ** 2);
      const errs = [];
      if (!(dH < 0)) errs.push(`probe: the step adds energy through R (ΔH = ${dH})`);
      if (Math.sign(dH) !== (m[2] === '-' ? -1 : 1)) errs.push(`probe: energy identity sign (${m[2] || '+'}) disagrees with the step (ΔH = ${dH})`);
      return errs;
    } },
  { id: 'F37 burial depth', why: 'older lineages (smaller epoch index e) lie deeper',
    re: /z_\{\\text\{burial\}\}\(e\) = \(([^()]*) - ([^()]*)\) \\cdot \\Delta z_\{\\text\{epoch\}\} [+-] z_0/,
    test: m => {
      // Evaluate (A − B)·Δz at an old and a young epoch (E_max = 10, Δz = 1); z_0 is an offset and cannot change the order.
      const val = (s, e) => (/E_\{\\text\{max\}\}/.test(s) ? 10 : /^e$/.test(s.trim()) ? e : NaN);
      const z = e => val(m[1], e) - val(m[2], e);
      if (Number.isNaN(z(2))) return DRIFT(`burial depth operands (${m[1]} - ${m[2]}) not readable`);
      return z(2) > z(8) ? [] : [`probe: burial depth (${m[1]} - ${m[2]}) does not grow with age`];
    } },
  { id: 'F38 plasma above boiling', why: 'the plasma threshold sits above the boiling point for every Lx in [0,1]',
    re: /T_\{\\text\{plasma\}\} = T_\{\\text\{boil\}\} ([+-]) (\d+)\(([\d.]+) ([+-]) ([\d.]+) L_x\)/,
    test: m => {
      const d = lx => (m[1] === '+' ? 1 : -1) * +m[2] * (+m[3] + (m[4] === '+' ? 1 : -1) * +m[5] * lx);
      return [0, 0.5, 1].every(lx => d(lx) > 0) ? [] : ['probe: T_plasma falls below T_boil for some Lx'];
    } },
  { id: 'F39 stride gain', why: 'a stiff (aching) side strides less, never more',
    re: /somatic stride gain \(\$1 ([+-]) ([\d.]+) \\kappa_\{\\text\{stiff\}\}\$\)/,
    test: m => (m[1] === '-' && +m[2] <= 1 ? [] : ['probe: stride gain rises with stiffness or goes negative']) },
  { id: 'F40 genome blend', why: 'offspring floats are a convex blend of parents and niche attractor',
    re: /\\left\(([\d.]+) \(([\d.]+) \\mathbf\{s\}_\{\\text\{Matrix\}\} \+ ([\d.]+) \\mathbf\{s\}_\{\\text\{Potentiator\}\}\) \+ ([\d.]+) \\mathbf\{s\}_\{\\text\{nicheAttractor\}\}/,
    test: m => { const [a, p1, p2, b] = m.slice(1).map(Number); return near(p1 + p2, 1) && near(a + b, 1) ? [] : [`identity: parent weights ${p1}+${p2}, outer weights ${a}+${b}`]; } },
  { id: 'F41 denominator floors', why: 'every listed division has a floor, so empty or zero inputs stay finite',
    re: /\\omega_0 = \\sqrt\{\\frac\{g_\{\\text\{planet\}\}\}\{(.{0,60}?)\}\}, \\quad/,
    test: m => {
      // Evaluate each denominator at its empty input (h_CoM = 0, N_total = 0): it must stay positive.
      const H = 'h_\\{\\\\text\\{CoM\\}\\}';
      const fl = m[1].match(new RegExp(`\\\\max\\(\\s*${FLOOR}, ${H}\\s*\\)|\\\\max\\(\\s*${H}, ${FLOOR}\\s*\\)`));
      const floor = fl ? floorValue(fl[1] ?? fl[2]) : 0;
      const f = floor > 0 && floor <= 0.01 ? [] : [fl ? `probe: h_CoM floor ${fl[1] ?? fl[2]} is not a small positive length` : 'probe: ω0 has no floor on h_CoM (infinite at h_CoM = 0)'];
      const NT = 'N_\\{\\\\text\\{total\\}\\}';
      const dens = readAll(new RegExp(`\\}\\{\\s*(\\\\(?:max|min)\\(\\s*(?:[^,(){}]+(?:\\{[^{}]*\\})?, ${NT}|${NT}, [^,(){}]+(?:\\{[^{}]*\\})?)\\s*\\)|${NT})\\s*\\}`, 'g'));
      if (dens.length < 2) f.push(`probe: expected the two N_total-normalised shares, found ${dens.length}`);
      for (const d of dens) {
        const g = d[1].match(new RegExp(`\\\\(max|min)\\(\\s*(.+?), (.+?)\\s*\\)$`));
        const v = g ? Math[g[1]](...[g[2], g[3]].map(x => (x.startsWith('N') ? 0 : floorValue(x)))) : 0;
        if (!(v > 0)) f.push(`probe: denominator ${d[1]} is ${v} at N_total = 0`);
      }
      return f;
    } },
  { id: 'F42 taste weights positive', why: 'each gate score raises the total',
    re: /total score \$T = ([\d.]+) S_\{\\text\{stab\}\} ([+-]) ([\d.]+) S_\{\\text\{sym\}\} ([+-]) ([\d.]+) S_\{\\text\{prop\}\}/,
    test: m => (m[2] === '+' && m[4] === '+' ? [] : ['probe: a gate score lowers the total']) },
  { id: 'F43 body energy units', why: 'dose, rest restore, rest dissipation and reserve bounds share one unit (J)',
    re: /requires `45 ([a-zA-Z]+)`[\s\S]{0,700}?restores `\+30 ([a-zA-Z]+)` to `vitalReserveJoules` \(clamped `\[5, 100\] ([a-zA-Z]+)`\)/,
    // Every energy quantity in the passage, not only the three captured ones, must be in J.
    test: m => { const u = [...m[0].matchAll(/\b\d[\d.,]* (k?J|MJ)\b/g)].map(x => x[1]); return u.length >= 3 && u.every(x => x === 'J') ? [] : [`units: ${[...new Set(u)].join(', ')} mixed in one energy budget`]; } },
  { id: 'F44 named physical examples', why: 'the worked examples carry their real-world values and units',
    re: /\\text\{H\}_2 = ([\d.]+)\\text\{ ([^}]*)\}\^?3?\$\) to Osmium and Diamond \(\$E = ([\d,]+)\\text\{ ([^}]*)\}\$\)/,
    test: m => {
      const h2 = +m[1] * (SCALE[m[2]] ?? NaN), dia = num(m[3]) * (SCALE[m[4]] ?? NaN);
      return [...(relNear(h2, 0.08988, 0.02) ? [] : [`units: H2 density stated as ${h2} kg/m^3 (real 0.0899)`]), ...(dia > 900e9 && dia < 1300e9 ? [] : [`units: diamond modulus stated as ${dia / 1e9} GPa (real ~1050)`])];
    } },
  { id: 'F45 type facts', why: 'precision claims match the named float type',
    re: /`(Float\d+)`'s (\d+)-bit mantissa/,
    test: m => ({ Float64: 53, Float32: 24, Float16: 11 }[m[1]] === +m[2] ? [] : [`identity: ${m[1]} does not have a ${m[2]}-bit mantissa`]) },
  { id: 'F46 state vector type', why: 'the state type can carry the dynamics, and a Float32 state is paired with float64 evaluation of the 1e-9 stop test (B154)',
    re: /zero-allocation `(Float\d+)Array\(24\)` state vector/,
    test: m => {
      if (m[1] === 'Float64') return [];
      if (m[1] !== 'Float32') return [`units: ${m[1]} state (≈3 significant digits) cannot carry the dynamics`];
      return read(/evaluated in float64 because the bound is below float32 resolution/) ? [] : ['units: Float32 state but the 1e-9 stop test is not evaluated in float64'];
    } },
  { id: 'F47 success flags', why: 'a passing check reports true',
    re: /\(`crcValid === (true|false)`;[\s\S]*?\(`convergedInOnePass === (true|false)`\)/,
    test: m => (m[1] === 'true' && m[2] === 'true' ? [] : ['probe: a success flag is documented as false']) },
];

if (args.includes('--spans')) {
  // Character spans of each entry's matched text and of any other Plan text its test reads, used by
  // mutant_generator.mjs to tell which entry covers a site.
  // Written synchronously so process.exit below cannot cut off a large payload on a pipe.
  fs.writeSync(1, JSON.stringify(SPECS.map(s => {
    const id = s.id.split(' ')[0], m = plan.match(s.re);
    if (!m) return { id, spans: [] };
    reading = id;
    s.test(m);
    reading = null;
    return { id, spans: [[m.index, m.index + m[0].length], ...(reads[id] ?? [])] };
  })) + '\n');
  process.exit(0);
}
const results = SPECS.map(s => {
  const m = plan.match(s.re);
  if (!m) return { id: s.id, kind: s.kind, status: 'DRIFT', detail: 'formula text not found (moved, rewritten or broken)' };
  const out = s.test(m);
  if (out.some(x => x.startsWith('DRIFT:'))) return { id: s.id, kind: s.kind, status: 'DRIFT', detail: out.join('; ') };
  return { id: s.id, kind: s.kind, status: out.length ? 'FAIL' : 'PASS', detail: out.join('; ') || s.why };
});
const bad = results.filter(r => r.status !== 'PASS');
const pins = results.filter(r => r.kind === 'pin').length;
if (!quiet) for (const r of results) console.log(`${r.status.padEnd(5)} ${r.id}${r.kind === 'pin' ? ' [text pin]' : ''}\n        ${r.detail}`);
console.log(`\n${results.length - bad.length}/${results.length} formulas behave as their purpose requires (${results.length - pins} behavioural tests, ${pins} text pin${pins === 1 ? '' : 's'})` + (bad.length ? ` — ${bad.map(r => `${r.id.split(' ')[0]} ${r.status}${r.kind === 'pin' && r.status === 'FAIL' ? '(pin)' : ''}`).join(', ')}` : ''));
process.exitCode = bad.length ? 1 : 0;
