// Builds PAIN_VISUAL.html (one self-contained picture page: inline SVG and CSS, no scripts, no network).
// Run from the bridge folder:  node concepts/build_pain_visual.mjs
// Every number drawn comes from one of three places, named on the page under each panel:
//   (A) the thought sample  mind/runs/thoughts/L_s1_w31000_t480-720.jsonl   (read here, by this script)
//   (B) the preset          preset/valleys_v1.json                            (read here, by this script)
//   (C) figures READ from WORLD_V2_DESIGN.md section 2.4 (a recorded life, ticks 0-2047); not recomputed here
// Text on the page is short on purpose: the owner is visual-native.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bridge = path.join(here, '..');
const lines = fs.readFileSync(path.join(bridge, 'mind/runs/thoughts/L_s1_w31000_t480-720.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const head = lines[0], rows = lines.slice(1);
const preset = JSON.parse(fs.readFileSync(path.join(bridge, 'preset/valleys_v1.json'), 'utf8'));
const content = JSON.parse(fs.readFileSync(path.join(here, 'pain_visual_content.json'), 'utf8')); // ladder text, joint statement, growth edge

const A = head.answers, W = head.wants;
const want = n => W[A.indexOf(n)];
const iTox = A.indexOf('TOXIC'), iCol = A.indexOf('COLLAPSE');
const V = 2;                        // valley 3 is character index 2
const T0 = 553, T1 = 600;
const slice = rows.filter(r => r.t >= T0 && r.t <= T1).map(r => ({ t: r.t, ch: r.chars[V] }));
if (slice.length !== T1 - T0 + 1) throw new Error('sample does not cover the window');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = n => +n.toFixed(1);

// ---- palette (tokens; dark mode swaps them). No red anywhere: the lens rule is world facts, not injury symbols.
const css = `
:root{--paper:#f6f4ef;--ink:#1b2430;--mute:#7b8591;--line:#cfd4da;--world:#2f6f73;--being:#3b4a9a;--pull:#b87a12;--push:#2d7bb5;--cost:#7a4f9a;--down:#9aa3ad;--card:#ffffff}
@media (prefers-color-scheme:dark){:root{--paper:#14181d;--ink:#e8ebee;--mute:#98a2ad;--line:#343c46;--world:#59b1b6;--being:#8f9be0;--pull:#e0a948;--push:#6fb4e6;--cost:#b890d4;--down:#6d7782;--card:#1b2128}}
*{box-sizing:border-box}html{background:var(--paper)}
body{margin:0 auto;max-width:1040px;padding:16px;overflow-wrap:anywhere;color:var(--ink);background:var(--paper);font:15px/1.35 system-ui,Segoe UI,Roboto,sans-serif}
h1{font-size:26px;margin:4px 0 2px;letter-spacing:.02em}.sub{color:var(--mute);margin:0 0 14px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 10px 6px;margin:0 0 14px}
.panel h2{font-size:14px;margin:0 0 4px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
svg{width:100%;height:auto;display:block}
.src{font-size:11px;color:var(--mute);margin:4px 2px 6px}
.t{font-size:12px;fill:var(--ink)}.m{font-size:11px;fill:var(--mute)}.b{font-weight:600}.big{font-size:20px;font-weight:700}
.tag{font-size:10px;fill:var(--mute);letter-spacing:.04em}
footer{color:var(--mute);font-size:12px;margin:8px 2px 24px}
`;

const defs = `<defs>
<pattern id="fog" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--mute)" stroke-width="1.6" opacity=".55"/></pattern>
<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>
</defs>`;

// glyphs, same language in every panel: fed = filled circle, plain = ring, toxic = wavy ring, faint = down bar
const wavy = (cx, cy, r, color, sw = 2) => {
  const n = 10, pts = [];
  for (let i = 0; i <= 60; i++) { const a = i / 60 * 2 * Math.PI, rr = r + 1.6 * Math.sin(a * n); pts.push(`${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`); }
  return `<polygon points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>`;
};
const gFed = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--being)"/>`;
const gPlain = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="none" stroke="var(--being)" stroke-width="2"/>`;
const gToxic = (x, y, r = 6) => wavy(x, y, r - 1, 'var(--cost)');
const gDown = (x, y, w = 14, h = 5) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="var(--down)"/>`;
const arrow = (x1, y1, x2, y2, color, dash = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="2" fill="none" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#ah)"/>`;
const label = (x, y, s, cls = 't', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;

// ============ PANEL 1: the loop (a drawing of the mechanism; the numbers on it are from the preset)
const pv = preset.values, pi = preset.intensity, lb = preset.loopBreak;
const toxCost = l => pv.pain.TOXIC_PER_INTENSITY * l;
const p1 = `<svg viewBox="0 0 1000 400" role="img" aria-label="The loop: the world books a cost the being does not sense; the being weighs expected cost and learns by surprise; intensity can only go down.">
${defs}
<!-- WORLD -->
<rect x="20" y="70" width="320" height="300" rx="16" fill="var(--world)" opacity=".12" stroke="var(--world)" stroke-width="2"/>
${label(36, 96, 'WORLD', 'tag b')}
<rect x="40" y="112" width="130" height="92" rx="8" fill="url(#fog)" stroke="var(--mute)" stroke-dasharray="4 3"/>
${label(105, 132, 'books', 't b', 'middle')}
${label(105, 152, 'gain', 'm', 'middle')}${label(105, 170, 'cost', 'm', 'middle')}${label(105, 195, 'not sensed', 'm', 'middle')}
<!-- intensity staircase: preset intensity min/default/max; only down -->
<g transform="translate(200,112)">
  ${[3, 2, 1].map((l, i) => `<rect x="${i * 38}" y="${i * 20}" width="34" height="${74 - i * 20}" rx="3" fill="${l === pi.default ? 'var(--world)' : 'none'}" stroke="var(--world)" stroke-width="1.5" ${l === pi.max ? 'stroke-dasharray="3 3"' : ''}/>`).join('')}
  ${label(17, 66, String(pi.max), 'm', 'middle')}${label(55, 66 - 20 + 20, String(pi.default), 'm', 'middle')}${label(93, 66 - 40 + 40, String(pi.min), 'm', 'middle')}
</g>
${label(204, 104, 'intensity ℓ', 'm', 'start')}
${arrow(300, 186, 300, 208, 'var(--world)')}
<path d="M200 214 H292" stroke="var(--world)" stroke-width="2" stroke-dasharray="2 4" fill="none"/>
${label(246, 232, 'only down', 't b', 'middle')}
${label(246, 248, `loop-break: ${lb.collapsesFromOneCause} faints, one cause`, 'm', 'middle')}
<!-- cost numbers, from the preset -->
${gToxic(60, 290, 9)}${label(78, 294, `${toxCost(pi.default)}×${pi.default}=${toxCost(pi.default) * pi.default}`.replace(/.+/, `${pv.pain.TOXIC_PER_INTENSITY}×ℓ`), 't')}
${label(118, 294, `= ${toxCost(2)} at ℓ2, ${toxCost(1)} at ℓ1`, 'm')}
${gDown(60, 326, 18, 6)}${label(78, 330, `${pv.pain.COLLAPSE}`, 't')}${label(98, 330, 'faint: down 8 ticks, same at ℓ1', 'm')}
<!-- BEING: a cycle, counterclockwise: surprise -> guess -> weigh -> act (out); answer (in) -> surprise -->
<circle cx="765" cy="215" r="140" fill="url(#fog)" opacity=".7"/>
<circle cx="765" cy="215" r="112" fill="var(--card)" stroke="var(--being)" stroke-width="2.5"/>
${label(765, 118, 'BEING', 'tag b', 'middle')}
<!-- weigh: balance, left pan gain (pull), right pan cost; pans equal on purpose, the weights are in panel 3 -->
<g transform="translate(668,150)"><path d="M0 10H56M28 10V44M14 44H42" stroke="var(--ink)" stroke-width="2" fill="none"/><rect x="-4" y="14" width="18" height="14" fill="var(--pull)"/><rect x="42" y="14" width="18" height="14" fill="var(--cost)"/>${label(28, 62, 'weigh', 't b', 'middle')}</g>
<!-- guess: a spread of bars -->
<g transform="translate(818,150)">${[10, 40, 18, 6, 26].map((h, i) => `<rect x="${i * 9}" y="${44 - h + 6}" width="7" height="${h}" fill="var(--push)"/>`).join('')}${label(22, 62, 'guess', 't b', 'middle')}</g>
<!-- surprise: spike -->
<g transform="translate(730,226)"><path d="M0 40H14L20 4L26 52L32 40H70" stroke="var(--push)" stroke-width="2.5" fill="none"/>${label(35, 70, 'surprise', 't b', 'middle')}</g>
${arrow(812, 170, 730, 170, 'var(--being)')}
<path d="M806 252 C 842 252 850 232 846 210" stroke="var(--being)" stroke-width="2" fill="none" marker-end="url(#ah)"/>
${label(765, 345, 'wants set at ℓ2 for the whole life', 'm', 'middle')}
<!-- world -> being: answer;  being -> world: act -->
${arrow(345, 262, 664, 262, 'var(--world)')}${label(500, 254, 'answer', 't b', 'middle')}
${gFed(430, 288)}${gPlain(458, 288)}${gToxic(486, 288)}${gDown(516, 288, 16, 5)}
${arrow(656, 172, 345, 172, 'var(--being)')}${label(500, 164, 'act', 't b', 'middle')}
${label(430, 192, 'eat · pass · rest', 'm')}
<!-- higher self: not built -->
<circle cx="492" cy="46" r="34" fill="none" stroke="var(--ink)" stroke-dasharray="4 4" stroke-width="2"/>
${label(492, 43, 'higher', 'm', 'middle')}${label(492, 57, 'self', 'm', 'middle')}
<path d="M462 62 C 400 84 340 90 262 110" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 4" fill="none" marker-end="url(#ah)"/>
${label(540, 38, 'chooses felt pain: not built', 'm')}
${label(540, 54, 'felt pain is off', 'm')}
</svg>`;

// ============ PANEL 2: valley 3, ticks 553-600, every mark from the sample
const L = 130, R = 980, X = t => L + (t - T0 + 0.5) * (R - L) / (T1 - T0 + 1), TW = (R - L) / (T1 - T0 + 1);
const rowY = { acts: 60, guess: [120, 230], sur: [260, 330], ell: [356, 392] };
let svg2 = '';
// down bands (sees.down) and the season turn
slice.forEach(s => { if (s.ch.sees.down) svg2 += `<rect x="${f(X(s.t) - TW / 2)}" y="30" width="${f(TW)}" height="372" fill="var(--down)" opacity=".18"/>`; });
svg2 += `<line x1="${f(X(554) - TW / 2)}" y1="26" x2="${f(X(554) - TW / 2)}" y2="404" stroke="var(--ink)" stroke-dasharray="4 4" opacity=".6"/>` + label(f(X(554) - TW / 2 + 4), 22, 'season turns (new table from 554)', 'm');
// legend for the answer glyphs (same shapes as panel 1)
svg2 += [['fed', gFed(0, 0, 6)], ['plain', gPlain(0, 0, 6)], ['poisoned', gToxic(0, 0, 7)], ['faint', gDown(0, 0, 12, 5)], ['rested', '<line x1="-5" y1="0" x2="5" y2="0" stroke="var(--mute)" stroke-width="2.5"/>']]
  .map(([n, g], i) => `<g transform="translate(${560 + i * 88},16)">${g}${label(13, 4, n, 'm')}</g>`).join('');
// acts row
svg2 += label(8, rowY.acts + 4, 'ate / rested', 'm');
for (const s of slice) {
  const c = s.ch, x = X(s.t);
  if (c.sees.down) continue;
  if (c.answer === 'FED') svg2 += gFed(f(x), rowY.acts, 6);
  else if (c.answer === 'PLAIN') svg2 += gPlain(f(x), rowY.acts, 6);
  else if (c.answer === 'TOXIC') svg2 += gToxic(f(x), rowY.acts, 7);
  else if (c.answer === 'COLLAPSE') svg2 += gDown(f(x), rowY.acts, 12, 5) + `<line x1="${f(x)}" y1="${rowY.acts - 14}" x2="${f(x)}" y2="${rowY.acts + 14}" stroke="var(--ink)" stroke-width="1.5"/>`;
  else if (c.answer === 'RESTED') svg2 += `<line x1="${f(x - 5)}" y1="${rowY.acts}" x2="${f(x + 5)}" y2="${rowY.acts}" stroke="var(--mute)" stroke-width="2.5"/>`;
}
// guess row: the being's own guess that the fruit in front (class TOXIC from 554) is poison, on awake ticks with that fruit
const [g0, g1] = rowY.guess, gy = p => g1 - p * (g1 - g0);
svg2 += label(8, g0 + 14, 'harm if it eats', 'm') + label(8, g0 + 28, 'its own guess', 'm');
svg2 += `<line x1="${L}" y1="${f(gy(0))}" x2="${R}" y2="${f(gy(0))}" stroke="var(--line)"/><line x1="${L}" y1="${f(gy(.5))}" x2="${R}" y2="${f(gy(.5))}" stroke="var(--line)" stroke-dasharray="3 4"/>` + label(L - 6, f(gy(1)) + 4, '1', 'm', 'end') + label(L - 6, f(gy(.5)) + 4, '.5', 'm', 'end') + label(L - 6, f(gy(0)) + 4, '0', 'm', 'end');
const gp = slice.filter(s => !s.ch.sees.down && s.t >= 554 && s.ch.world.kindClass === 'TOXIC' && s.ch.sees.item > 0).map(s => ({ t: s.t, p: s.ch.guess[0].p[iTox] + s.ch.guess[0].p[iCol], act: s.ch.act, ans: s.ch.answer, val: s.ch.guess[0].value, ex: s.ch.explore }));
svg2 += `<polyline points="${gp.map(q => `${f(X(q.t))},${f(gy(q.p))}`).join(' ')}" fill="none" stroke="var(--push)" stroke-width="2"/>`;
for (const q of gp) {
  const declined = q.act !== 'EAT';
  svg2 += `<circle cx="${f(X(q.t))}" cy="${f(gy(q.p))}" r="${declined ? 7 : 4.5}" fill="${declined ? 'none' : 'var(--push)'}" stroke="var(--push)" stroke-width="2"/>`;
}
const decl = gp.filter(q => q.act !== 'EAT');
decl.forEach(q => { svg2 += label(f(X(q.t)) - 8, f(gy(q.p)) - 12, `rested at ${Math.round(q.p * 100)}%`, 't b', 'end'); });
svg2 += label(f(X(554)) + 8, f(gy(0)) - 8, 'first bite: 0%', 'm');
// surprise row: sting[0], signed, all awake ticks; asleep ticks drawn light
const [s0, s1] = rowY.sur, smax = 11, sy0 = s1 - 18, sc = (sy0 - s0) / smax;
svg2 += label(8, s0 + 14, 'surprise', 'm') + `<line x1="${L}" y1="${sy0}" x2="${R}" y2="${sy0}" stroke="var(--line)"/>`;
for (const s of slice) {
  const v = s.ch.sting[0], h = Math.abs(v) * sc, up = v >= 0;
  svg2 += `<rect x="${f(X(s.t) - TW * .32)}" y="${f(up ? sy0 - h : sy0)}" width="${f(TW * .64)}" height="${f(h)}" fill="var(--push)" opacity="${s.ch.sees.down ? .25 : .9}"/>`;
}
const peaks = slice.filter(s => s.ch.sting[0] > 7);
peaks.forEach(s => { svg2 += label(f(X(s.t)) + 4, f(sy0 - s.ch.sting[0] * sc) + 4, s.ch.sting[0].toFixed(1), 'm'); });
// intensity row: world.ellAfter
const [e0, e1] = rowY.ell, ey = l => e1 - 8 - (l - 1) * (e1 - e0 - 16);
svg2 += label(8, e0 + 20, 'intensity', 'm') + label(8, e0 + 34, '(world, not sensed)', 'm');
let d = '';
slice.forEach((s, i) => { const x0 = X(s.t) - TW / 2, x1 = X(s.t) + TW / 2, y = ey(s.ch.world.ellAfter); d += (i === 0 ? `M${f(x0)} ${f(y)}` : `V${f(y)}`) + `H${f(x1)}`; });
svg2 += `<path d="${d}" fill="none" stroke="var(--world)" stroke-width="3"/>`;
const brk = slice.find(s => s.ch.world.ellAfter === 1 && s.t < 590);
svg2 += label(L - 6, f(ey(2)) + 4, '2', 'm', 'end') + label(L - 6, f(ey(1)) + 4, '1', 'm', 'end');
svg2 += label(f(X(brk.t) + TW / 2 + 6), f(ey(1)) - 10, `loop-break after tick ${brk.t}: 3rd faint, 2 → 1`, 't b');
// x axis
for (let t = 555; t <= 600; t += 5) svg2 += label(f(X(t)), 418, String(t), 'm', 'middle');
svg2 += label(8, 418, 'tick', 'm');
const p2 = `<svg viewBox="0 0 1000 430" role="img" aria-label="Valley 3, ticks 553 to 600: five poisonings and three faints, its guess of harm from eating that fruit rising, surprise spikes, and intensity lowered once.">${defs}${svg2}</svg>`;

// ============ PANEL 3: what the choice weighs (wants, set at intensity 2) next to what the world charges at intensity 1
const names = ['FED', 'PLAIN', 'RESTED', 'TOXIC', 'COLLAPSE'];
const worldAt1 = n => (n === 'TOXIC' ? -toxCost(1) : n === 'COLLAPSE' ? -pv.pain.COLLAPSE : pv.gain[n]);
const bx0 = 430, bscale = 38; // px per point
let svg3 = '';
names.forEach((n, i) => {
  const y = 24 + i * 52, w = want(n), wo = worldAt1(n);
  svg3 += (n === 'TOXIC' ? gToxic(30, y + 12, 9) : n === 'COLLAPSE' ? gDown(30, y + 12, 22, 7) : n === 'FED' ? gFed(30, y + 12, 9) : n === 'PLAIN' ? gPlain(30, y + 12, 9) : `<line x1="21" y1="${y + 12}" x2="39" y2="${y + 12}" stroke="var(--mute)" stroke-width="3"/>`);
  svg3 += label(52, y + 16, n.toLowerCase(), 't');
  const bar = (v, dy, col, tx) => `<rect x="${v >= 0 ? bx0 : bx0 + v * bscale}" y="${y + dy}" width="${Math.abs(v) * bscale}" height="12" fill="${col}"/>` + label(v >= 0 ? bx0 + v * bscale + 6 : bx0 + v * bscale - 6, y + dy + 10, (v > 0 ? '+' : '') + v, 'm', v >= 0 ? 'start' : 'end');
  svg3 += bar(w, 0, w >= 0 ? 'var(--pull)' : 'var(--cost)') + bar(wo, 15, 'none', '') .replace('fill="none"', `fill="${wo >= 0 ? 'var(--pull)' : 'var(--cost)'}" fill-opacity=".35" stroke="${wo >= 0 ? 'var(--pull)' : 'var(--cost)'}" stroke-dasharray="3 2"`);
});
svg3 += `<line x1="${bx0}" y1="8" x2="${bx0}" y2="${24 + 5 * 52 - 20}" stroke="var(--ink)"/>`;
svg3 += label(bx0 - 8, 8, '◀ cost', 'm', 'end') + label(bx0 + 8, 8, 'gain ▶', 'm');
svg3 += `<rect x="640" y="30" width="22" height="12" fill="var(--mute)"/>${label(670, 40, 'what it weighs (ℓ2)', 't')}<rect x="640" y="52" width="22" height="12" fill="var(--mute)" fill-opacity=".3" stroke="var(--mute)" stroke-dasharray="3 2"/>${label(670, 62, 'what the world charges at ℓ1', 't')}<rect x="640" y="74" width="10" height="10" fill="var(--pull)"/>${label(656, 83, 'gain', 'm')}<rect x="700" y="74" width="10" height="10" fill="var(--cost)"/>${label(716, 83, 'cost', 'm')}`;
svg3 += label(640, 100, 'toxic: 4 vs 2', 't b') + label(640, 118, 'faint: 8 vs 8', 't') + label(640, 136, 'the engine does not scale it', 'm');
svg3 += label(640, 176, 'after the loop-break the table', 'm') + label(640, 192, 'still reads the ℓ2 numbers', 'm');
const val = (g, w) => g.p.reduce((a, p, i) => a + p * w[i], 0);
const pick = u => [1, 0, 2].reduce((best, x) => (u[x] > u[best] ? x : best), 1); // ties: PASS, then EAT, then REST (live_v1a.mjs 1083)
const W1 = W.slice(); W1[iTox] = -toxCost(1);
const fl = { a: [0, 0], b: [0, 0] }; // [non-random fruit-b choices, flips] for ticks 554-600 and 601 to the end
for (const r of rows) {
  const c = r.chars[V];
  if (r.t < 554 || c.sees.down || c.world.kindClass !== 'TOXIC' || !(c.sees.item > 0) || c.explore) continue;
  const k = r.t <= 600 ? fl.a : fl.b;
  k[0]++; if (pick(c.guess.map(g => val(g, W))) !== pick(c.guess.map(g => val(g, W1)))) k[1]++;
}
svg3 += label(640, 222, 'valley 3, replay with toxic at -2', 't b') + label(640, 238, '(recorded guesses held fixed)', 'm');
svg3 += label(640, 258, `ticks 554–600: ${fl.a[1]} of ${fl.a[0]} choices change`, 't') + label(640, 276, `ticks 601–${rows[rows.length - 1].t}: ${fl.b[1]} of ${fl.b[0]} change (rest to eat)`, 't');
console.log('replay at toxic -2, valley 3 fruit b, non-random choices:', JSON.stringify(fl));
const p3 = `<svg viewBox="0 0 1000 ${24 + 5 * 52}" role="img" aria-label="What the being weighs against what the world charges.">${defs}${svg3}</svg>`;

// ============ PANEL 4: the use, figures READ from WORLD_V2_DESIGN.md section 2.4 (one recorded life, ticks 0-2047, guesses held fixed in the what-if)
const F = { harmful: 289, under50: 217, under10: 110, chosenPass: 50, whatIfToxic: 585, ticksAt1: 3064, ticksAll: 8192 };
let svg4 = '';
// 289 squares in a 34-wide grid, 217 filled
const cols = 34, sq = 14, gx = 20, gy0 = 40;
for (let i = 0; i < F.harmful; i++) {
  const cx = gx + (i % cols) * sq, cy = gy0 + Math.floor(i / cols) * sq;
  svg4 += `<rect x="${cx}" y="${cy}" width="${sq - 3}" height="${sq - 3}" fill="${i < F.under50 ? 'var(--push)' : 'none'}" stroke="var(--push)" stroke-width="1"/>`;
}
svg4 += label(gx, 24, '289 harmful eats it chose', 't b') + label(gx + 360, 24, '217 came at under 50% expected harm', 'm');
// what-if bars
const byb = gy0 + Math.ceil(F.harmful / cols) * sq + 38, bw = 560 / F.whatIfToxic;
svg4 += label(gx, byb - 14, 'harmful eats (toxic or fainted) in a replay with the guesses held fixed', 't b');
svg4 += `<rect x="${gx}" y="${byb}" width="${f(F.harmful * bw)}" height="20" fill="var(--cost)"/>` + label(gx + F.harmful * bw + 8, byb + 15, '289  recorded, with the cost in the wants', 't');
svg4 += `<rect x="${gx}" y="${byb + 28}" width="${f(F.whatIfToxic * bw)}" height="20" fill="var(--cost)" fill-opacity=".35" stroke="var(--cost)" stroke-dasharray="3 2"/>` + label(gx + F.whatIfToxic * bw + 8, byb + 43, '585  with every negative want set to 0 (a hint, not a forecast)', 't');
// 50 of 50 chosen passes
const py = byb + 84;
svg4 += label(gx, py - 8, 'passes it chose on fruit that would have fed: 50', 't b');
for (let i = 0; i < 50; i++) svg4 += `<circle cx="${gx + 6 + i * 13}" cy="${py + 12}" r="5" fill="var(--pull)"/>`;
svg4 += label(gx, py + 38, 'all 50 had a negative value for eating at that moment', 'm');
const p4 = `<svg viewBox="0 0 1000 ${py + 50}" role="img" aria-label="In one recorded life most harmful eats came at under 50 percent expected harm; all 50 chosen passes on fruit that would have fed had a negative value for eating; in a replay with the guesses fixed, harmful eating rose from 289 to 585 when every negative want was set to 0.">${defs}${svg4}</svg>`;

// ============ PANEL 5: seven levels (short; text from pain_visual_content.json)
const lv = content.levels;
let svg5 = '';
lv.forEach((l, i) => {
  const y = 14 + i * 50;
  svg5 += `<circle cx="28" cy="${y + 18}" r="16" fill="none" stroke="${l.color}" stroke-width="2.5"/>` + label(28, y + 23, String(i + 1), 't b', 'middle');
  svg5 += label(60, y + 14, l.name, 't b') + label(60, y + 30, l.line, 't');
  svg5 += label(990, y + 14, l.src, 'm', 'end') + (l.mark ? label(990, y + 30, l.mark, 'tag', 'end') : '');
  if (i < lv.length - 1) svg5 += `<line x1="28" y1="${y + 34}" x2="28" y2="${y + 50 + 2}" stroke="var(--line)" stroke-width="2"/>`;
});
const p5 = `<svg viewBox="0 0 1000 ${14 + lv.length * 50}" role="img" aria-label="Pain at seven levels.">${defs}${svg5}</svg>`;

// ============ PANEL 6: surprise against harm (whole sample, awake ticks), then the joint statement + growth edge
const surprise = cut => { let a = 0, b = 0, c2 = 0, d = 0; for (const r of rows) for (const c of r.chars) { if (c.sees.down) continue; const harm = c.answer === 'TOXIC' || c.answer === 'COLLAPSE', hi = c.sting[0] >= cut; if (harm) { a++; if (hi) b++; } else { c2++; if (hi) d++; } } return { hN: a, hHi: b, oN: c2, oHi: d }; };
const S = surprise(2.6), S0 = surprise(0.97);
const trk = 560, bar = (y, n, k, name, col) => `<rect x="300" y="${y}" width="${trk}" height="22" rx="4" fill="none" stroke="var(--line)"/><rect x="300" y="${y}" width="${f(trk * k / n)}" height="22" rx="4" fill="${col}"/>${label(292, y + 16, name, 't', 'end')}${label(300 + trk + 10, y + 16, `${k} of ${n}`, 't b')}`;
const p6bars = `<svg viewBox="0 0 1000 100" role="img" aria-label="Surprise of 2.6 or more came with ${S.hHi} of ${S.hN} poisoned or fainted ticks and ${S.oHi} of ${S.oN} other awake ticks.">${defs}${label(8, 16, 'surprise of 2.6 or more · all four valleys, ticks 480–719 · the cut was chosen after looking · one life', 'm')}${bar(28, S.hN, S.hHi, 'poisoned or fainted', 'var(--cost)')}${bar(62, S.oN, S.oHi, 'every other awake tick', 'var(--push)')}</svg><p class="src">src: the thought sample, 240 ticks x 4 valleys, awake ticks only; harm = answer TOXIC or COLLAPSE; surprise = sting[0] (signed, against a running mean, so partly built in by definition). At a cut of 0.97 it is ${S0.hHi} of ${S0.hN} against ${S0.oHi} of ${S0.oN}. It does not cover the 92 harmful eats whose eat value was zero or less (WORLD_V2_DESIGN.md 2.4, read).</p>`;
const p6 = `${p6bars}<div style="padding:4px 4px 2px"><p style="font-size:19px;margin:6px 0 8px;font-weight:600">${esc(content.joint)}</p><p class="m" style="margin:0 0 8px;color:var(--mute)">${esc(content.jointTag)}</p>${content.growth ? `<p style="margin:8px 0 4px"><b>Growth edge</b> (still apart): ${esc(content.growth)}</p>` : ''}</div>`;

// ============ PANEL 7: the way back to the owner, what landed at each level (text from the content file)
const bk = content.back, rowH = 52, oy = 14 + bk.length * rowH / 2;
let svg7 = `<circle cx="64" cy="${oy}" r="46" fill="none" stroke="var(--ink)" stroke-width="2.5"/>` + label(64, oy + 5, 'OWNER', 't b', 'middle');
bk.forEach((b, i) => {
  const y = 14 + i * rowH + 24, dy = (i - (bk.length - 1) / 2) * 11, ex = 64 + Math.sqrt(46 * 46 - dy * dy) + 3;
  svg7 += `<path d="M172 ${y} C 140 ${y}, 130 ${f(oy + dy)}, ${f(ex)} ${f(oy + dy)}" fill="none" stroke="${b.color}" stroke-width="1.8" marker-end="url(#ah)" opacity=".85"/>`;
  svg7 += `<circle cx="190" cy="${y}" r="15" fill="none" stroke="${b.color}" stroke-width="2.5"/>` + label(190, y + 5, String(i + 1), 't b', 'middle');
  svg7 += label(216, y - 3, b.name, 't b') + label(216, y + 14, b.line, 't');
  const gx = 968, word = b.state === 'landed' ? 'landed' : b.state === 'part' ? 'in part' : 'open';
  svg7 += label(gx - 16, y + 5, word, 'm', 'end');
  if (b.state === 'landed') svg7 += `<circle cx="${gx}" cy="${y}" r="9" fill="${b.color}"/>`;
  else if (b.state === 'part') svg7 += `<circle cx="${gx}" cy="${y}" r="9" fill="none" stroke="${b.color}" stroke-width="2"/><path d="M${gx} ${y - 9} A9 9 0 0 0 ${gx} ${y + 9} Z" fill="${b.color}"/>`;
  else svg7 += `<circle cx="${gx}" cy="${y}" r="9" fill="none" stroke="${b.color}" stroke-width="2"/>`;
});
const p7 = `<svg viewBox="0 0 1000 ${14 + bk.length * rowH + 6}" role="img" aria-label="How pain landed at each of seven levels, with a return arrow from each level to the owner.">${defs}${svg7}</svg>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pain, one page</title><style>${css}</style></head>
<body>
<h1>PAIN</h1><p class="sub">${esc(content.sub)}</p>
<div class="panel"><h2>1 · The loop</h2>${p1}<p class="src">${esc(content.src1)}</p></div>
<div class="panel"><h2>2 · One life, valley 3, ticks 553–600</h2>${p2}<p class="src">src: mind/runs/thoughts/L_s1_w31000_t480-720.jsonl, valley 3: fields sees, act, answer, guess[EAT].p[TOXIC] + p[COLLAPSE] = harm if it eats (drawn when the fruit in front is the one the world made toxic), sting[0], world.ellAfter, world.cause (toxin for all three faints). One life, one world; not a test.</p></div>
<div class="panel"><h2>3 · What it weighs, what the world charges</h2>${p3}<p class="src">src: the sample's header wants (${W.join(', ')}; answers ${A.join(', ')}) and preset/valleys_v1.json values.pain (TOXIC_PER_INTENSITY ${pv.pain.TOXIC_PER_INTENSITY}, COLLAPSE ${pv.pain.COLLAPSE}); world at ℓ1 is derived from world/valleys.mjs lines 129-139. Wants are not felt.</p></div>
<div class="panel"><h2>4 · What the cost does</h2>${p4}<p class="src">src: WORLD_V2_DESIGN.md section 2.4 (read, not recomputed here): one recorded life, world 31000, ticks 0–2047, beings chose without exploring; the what-if replays recorded guesses with all negative wants set to 0.</p></div>
<div class="panel"><h2>5 · Seven levels</h2>${p5}<p class="src">${esc(content.src5)}</p></div>
<div class="panel"><h2>6 · Joint statement (builder and skeptic drafts, merged)</h2>${p6}</div>
<div class="panel"><h2>7 · The way back to the owner: how pain landed at each level</h2>${p7}<p class="src">${esc(content.backSrc)}</p></div>
<footer>${esc(content.footer)}</footer>
</body></html>`;

fs.writeFileSync(path.join(here, 'PAIN_VISUAL.html'), html);
console.log('wrote concepts/PAIN_VISUAL.html', html.length, 'bytes');
