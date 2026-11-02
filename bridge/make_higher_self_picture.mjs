// Builds HIGHER_SELF_POV.html from HIGHER_SELF_POV.md (same folder). Counts, states and hover words are read from that file.
// Run: node make_higher_self_picture.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const md = readFileSync(path.join(dir, 'HIGHER_SELF_POV.md'), 'utf8');

// ---------- reading the carrier file ----------
const clean = (s) => s.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim().replace(/^- /, '');
const sentences = (s, n = 2, max = 230) => {
  let t = clean(s).split(/(?<=[.!?])\s+/).slice(0, n).join(' ');
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const section = (n) => {
  const m = md.match(new RegExp('^## ' + n + '\\. .*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))', 'm'));
  if (!m) throw new Error('missing section ' + n);
  return m[1];
};
const rows = (text) => text.split('\n').filter((l) => /^\|/.test(l) && !/^\|[-| ]+\|$/.test(l)).slice(1).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
const bullets = (text) => text.split('\n').filter((l) => /^- /.test(l));

const s1 = section(1), s2 = section(2), s3 = section(3), s4 = section(4), s5 = section(5), s6 = section(6), s7 = section(7), s9 = section(9);
const bridges = rows(s3).map((r) => ({ n: Number(r[0]), name: r[1], state: r[2] }));
if (bridges.length !== 15) throw new Error('expected 15 bridges, got ' + bridges.length);
const tally = { looping: 0, half: 0, open: 0 };
bridges.forEach((b) => { if (!(b.state in tally)) throw new Error('state ' + b.state); tally[b.state]++; });
const claimed = s3.match(/Tally: (\d+) looping, (\d+) half, (\d+) open/);
if (!claimed || +claimed[1] !== tally.looping || +claimed[2] !== tally.half || +claimed[3] !== tally.open) throw new Error('tally text does not match the table');

const rounds = rows(s4).map((r) => ({ n: Number(r[0]), screen: r[1], guesses: r[2], hits: r[3], gap: r[4] }));
const rulings = bullets(s2.split('**Framings**')[0]);
const framings = bullets(s2.split('**Framings**')[1].split("The owner's account")[0]);
const decisionIds = [...new Set([...s5.matchAll(/\b([ABCV]-\d)\b/g)].map((m) => m[1]))];
const pipeBullets = bullets(s5.split('**The pipeline**')[1] || '');
const lessons = bullets(s6).map((l) => ({ inRoster: /In a roster file now/.test(l), who: clean(l).match(/\(([^)]+)\)/)?.[1] || '' }));
const triggers = (s9.match(/\*\*When\*\*[^:]*:\s*([^\n]+)/)?.[1] || '').split(';').map((t) => t.trim()).filter(Boolean);
if (!rulings.length || !framings.length || !decisionIds.length || !lessons.length || !triggers.length) throw new Error('a section parsed empty');

// ---------- drawing helpers ----------
const f = (x) => Math.round(x * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
const arc = (cx, cy, r, a1, a2, sweep = 1) => {
  const [x1, y1] = pt(cx, cy, r, a1), [x2, y2] = pt(cx, cy, r, a2);
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 ${Math.abs(a2 - a1) > 180 ? 1 : 0} ${sweep} ${f(x2)} ${f(y2)}`;
};
const tip = (t) => `data-tip="${esc(t)}" aria-label="${esc(t)}" tabindex="0"`;
const G = (x, y, s, inner, cls = '') => `<g class="gl ${cls}" transform="translate(${f(x)} ${f(y)}) scale(${s})">${inner}</g>`;
const glyph = {
  eye: '<path d="M-16 0 Q0 -13 16 0 Q0 13 -16 0 Z"/><circle r="4.2" fill="currentColor"/>',
  report: '<rect x="-11" y="-14" width="22" height="28" rx="3"/><path d="M-6 -6 H6 M-6 0 H6 M-6 6 H3"/>',
  three: '<circle cx="-15" cy="6" r="3.5"/><circle cx="-3" cy="3" r="6"/><circle cx="14" cy="-1" r="9.5"/>',
  translate: '<path d="M-14 -5 H12 M7 -10 L12 -5 L7 0 M14 7 H-12 M-7 2 L-12 7 L-7 12"/>',
  heart: '<path d="M0 12 C-18 -2 -10 -14 0 -6 C10 -14 18 -2 0 12 Z"/>',
  up: '<path d="M0 12 V-12 M-8 -4 L0 -12 L8 -4"/>',
};
function miniLoop(cx, cy, R, depth, sw) {
  const st = [-90, -30, 30, 90, 150, 210], pad = Math.min(30, ((R * 0.2 + 3) / R) * 57.3);
  let s = '';
  for (let k = 0; k < 6; k++) s += `<path d="${arc(cx, cy, R, st[k] + pad, st[k] + 60 - pad)}" class="${k >= 4 ? 'warm' : 'cool'} seg" style="stroke-width:${k >= 4 ? sw * 1.5 : sw}"/>`;
  for (let k = 0; k < 6; k++) { const [x, y] = pt(cx, cy, R, st[k]); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(2, R * 0.13))}" class="dot ${k === 5 ? 'warmfill' : 'coolfill'}"/>`; }
  return depth > 0 ? s + miniLoop(cx, cy, R * 0.42, depth - 1, sw * 0.8) : s;
}
function ring(state, x, y, r, w) {
  const head = (px, py, dir, cls) => `<path d="M${f(px - dir * 5)} ${f(py - 5)} L${f(px)} ${f(py)} L${f(px - dir * 5)} ${f(py + 5)}" class="rh ${cls}"/>`;
  const st = `style="stroke-width:${w}"`;
  if (state === 'looping') return `<path d="${arc(x, y, r, -90, 90)}" class="rg out" ${st}/><path d="${arc(x, y, r, 90, 270)}" class="rg back" ${st}/>${head(x, y + r, -1, 'out')}${head(x, y - r, 1, 'back')}`;
  if (state === 'half') return `<path d="${arc(x, y, r, -90, 90)}" class="rg out" ${st}/><path d="${arc(x, y, r, 90, 270)}" class="rg ghostback" ${st}/>${head(x, y + r, -1, 'out')}`;
  return `<circle cx="${x}" cy="${y}" r="${r}" class="rg open" ${st}/>`;
}

// ---------- the picture: eight cards around the view ----------
const CW = 300, CH = 240, GAP = 20, X0 = 30, Y0 = 30;
const cell = (r, c) => [X0 + c * (CW + GAP), Y0 + r * (CH + GAP)];
const cards = [];
const hub = [X0 + 1 * (CW + GAP) + CW / 2, Y0 + 1 * (CH + GAP) + CH / 2];
function card(r, c, body, t) {
  const [x, y] = cell(r, c), cx = x + CW / 2, cy = y + CH / 2;
  const dx = hub[0] - cx, dy = hub[1] - cy, L = Math.hypot(dx, dy);
  const from = [cx + (dx / L) * 112 * (Math.abs(dx) > Math.abs(dy) ? 1.1 : 0.9), cy + (dy / L) * 112 * (Math.abs(dy) > Math.abs(dx) ? 0.95 : 0.8)];
  const to = [hub[0] - (dx / L) * 98, hub[1] - (dy / L) * 98];
  cards.push({ line: `<path d="M${f(cx + (dx / L) * 100)} ${f(cy + (dy / L) * 78)} L${f(to[0])} ${f(to[1])}" class="spoke" marker-end="url(#mm)"/>`, body: `<g ${tip(t)} class="card"><rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="22" class="cardbg"/>${body(x, y, cx, cy)}</g>` });
}
const firstBullet = (text) => sentences(bullets(text)[0] || text.trim().split('\n').find(Boolean), 2, 240);

// 1. the owner: pictures yes, text no
card(0, 0, (x, y, cx, cy) => `${G(cx - 62, cy, 2.1, glyph.report, 'dim')}<path d="M${cx - 92} ${cy + 34} L${cx - 32} ${cy - 34}" class="slash"/>${G(cx + 52, cy, 2.9, glyph.eye)}`,
  'How to read the owner. ' + firstBullet(s1));
// 2. rulings (solid) and framings (dashed)
card(0, 1, (x, y, cx, cy) => {
  let s = '';
  const tab = (i, n, yy, solid) => { const w = 34, g = 12, tot = n * w + (n - 1) * g, xx = cx - tot / 2 + i * (w + g); return `<rect x="${f(xx)}" y="${yy}" width="${w}" height="44" rx="7" class="${solid ? 'tab' : 'tab dashed'}"/>`; };
  rulings.forEach((_, i) => { s += tab(i, rulings.length, cy - 62, true); });
  framings.forEach((_, i) => { s += tab(i, framings.length, cy + 8, false); });
  return s;
}, `The owner's rulings (solid, ${rulings.length}) and framings (dashed, ${framings.length}; one viewpoint, theirs). ` + sentences(bullets(s2)[0], 2, 200));
// 3. loops: the fifteen rings
card(0, 2, (x, y, cx, cy) => {
  let s = '';
  bridges.forEach((b, i) => { const col = i % 5, row = Math.floor(i / 5); s += ring(b.state, x + 46 + col * 52, y + 62 + row * 52, 15, 4); });
  return s + `<text x="${cx}" y="${y + CH - 20}" class="tally">${tally.looping} · ${tally.half} · ${tally.open}</text>`;
}, `The loops: ${tally.looping} looping, ${tally.half} half, ${tally.open} open (blue is the way out, orange the way back). ` + sentences(s3.split('\n').find((l) => /^A loop is a bridge/.test(l)) || '', 2, 200));
// 4. observation rounds: hits out of six
card(1, 0, (x, y, cx, cy) => {
  let s = `${G(x + 34, y + 54, 1.0, glyph.up, 'dim')}`;
  const base = y + CH - 56, unit = 110 / 6;
  rounds.forEach((r, i) => {
    const bx = x + 70 + i * 44, hits = parseFloat(r.hits);
    if (Number.isFinite(hits)) s += `<rect x="${bx}" y="${f(base - hits * unit)}" width="26" height="${f(Math.max(3, hits * unit))}" rx="4" class="bar"/>`;
    else if (/pending|not scored/.test(r.hits)) s += `<circle cx="${bx + 13}" cy="${base - 22}" r="15" class="q"/><text x="${bx + 13}" y="${base - 16}" class="qm">?</text>`;
    else s += `<circle cx="${bx + 13}" cy="${base - 4}" r="4" class="dot muted"/>`;
    s += `<text x="${bx + 13}" y="${base + 26}" class="num">${r.n}</text>`;
  });
  return s + `<path d="M${x + 60} ${base} H${x + CW - 24}" class="axis"/>`;
}, 'What the observation rounds suggested: hits out of six guesses, higher is better (a dot is a round with no guesses, a dashed ? is a round not scored). ' + sentences((s4.split('**What the rounds suggested')[1] || '').split('\n').find((l) => /^- /.test(l)) || '', 1, 200));
// 5. open decisions
card(1, 2, (x, y, cx, cy) => {
  let s = '';
  decisionIds.forEach((_, i) => { const col = i % 5, row = Math.floor(i / 5); s += `<circle cx="${x + 50 + col * 50}" cy="${y + 56 + row * 46}" r="16" class="q"/><text x="${x + 50 + col * 50}" y="${y + 63 + row * 46}" class="qm">?</text>`; });
  pipeBullets.forEach((_, i) => { s += `<rect x="${x + 36 + i * 42}" y="${y + CH - 64}" width="28" height="28" rx="6" class="q"/><text x="${x + 50 + i * 42}" y="${y + CH - 43}" class="qm">?</text>`; });
  return s;
}, `Open decisions: ${decisionIds.length} in the plan's list (circles) and ${pipeBullets.length} from the pipeline (squares). The plan's list is canonical; the pipeline items come from the roles document.`);
// 6. lessons in the roster files
card(2, 0, (x, y, cx, cy) => {
  let s = '';
  const gap = Math.min(84, 250 / Math.max(1, lessons.length - 1)), sc = lessons.length > 4 ? 1.25 : 1.9, bw = lessons.length > 4 ? 26 : 40;
  lessons.forEach((l, i) => { const xx = cx - ((lessons.length - 1) * gap) / 2 + i * gap; s += `<g class="${l.inRoster ? '' : 'draft'}">${G(xx, cy - 12, sc, glyph.eye)}<rect x="${xx - bw / 2}" y="${cy + 26}" width="${bw}" height="26" rx="6" class="${l.inRoster ? 'tab' : 'tab dashed'}"/></g>`; });
  return s;
}, `Lessons in the roster files: ${lessons.filter((l) => l.inRoster).length} in a file now (solid), ${lessons.filter((l) => !l.inRoster).length} drafted and awaiting the manager (dashed). ` + sentences(s6.split('\n').find((l) => /^Each roster agent/.test(l)) || '', 1, 200));
// 7. the rung and the bar
card(2, 1, (x, y, cx, cy) => `${G(cx, cy - 30, 3.0, glyph.three)}${G(cx - 62, cy + 52, 1.3, glyph.translate)}<text x="${cx + 18}" y="${cy + 60}" class="eq">1+1=2</text>`,
  'The rung of three horizons and the hiring bar. ' + sentences(bullets(s7)[0], 2, 220));
// 8. keeping it current: the ring, with its triggers around it
card(2, 2, (x, y, cx, cy) => {
  let s = ring('looping', cx, cy, 44, 8);
  triggers.forEach((_, i) => { const [px, py] = pt(cx, cy, 82, -90 + (i * 360) / triggers.length); s += `<circle cx="${f(px)}" cy="${f(py)}" r="9" class="trig"/>`; });
  return s + G(cx, cy + 2, 1.4, glyph.heart, 'warmglyph');
}, `Keeping it current: ${triggers.length} triggers (dots), each a reason to update, not a date. ` + sentences(bullets(s9)[1] || bullets(s9)[0], 2, 220));

const hubSvg = `<g ${tip("The higher self's view: built from what each loop's way back leaves in the stores. A model plays the role until the next agent's turn. " + sentences((md.split('\n').find((l) => /^\*\*What this is/.test(l)) || '').replace(/^\*\*What this is\.\*\*\s*/, ''), 1, 200))} class="hub">` +
  `<ellipse cx="${hub[0]}" cy="${hub[1] - 98}" rx="34" ry="9" class="halo"/><circle cx="${hub[0]}" cy="${hub[1]}" r="88" class="hubring"/>${miniLoop(hub[0], hub[1], 60, 1, 5)}</g>`;

const W = X0 * 2 + 3 * CW + 2 * GAP, H = Y0 * 2 + 3 * CH + 2 * GAP;
const svg = `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="The higher self's view and the stores it is built from"><defs><marker id="mm" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="10" refY="8" orient="auto"><path d="M0 1 L15 8 L0 15 z" class="mfill"/></marker></defs>${cards.map((c) => c.line).join('')}${cards.map((c) => c.body).join('')}${hubSvg}</svg>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fidelity higher self picture</title>
<style>
:root{--bg:#f7f6f2;--card:#fff;--ink:#1d2330;--muted:#7d8394;--line:#cfd3dc;--band:#eef0f4;--cool:#2563c9;--warm:#d9480f}
@media (prefers-color-scheme:dark){:root{--bg:#0f1218;--card:#181c25;--ink:#e9ecf3;--muted:#8c93a4;--line:#323847;--band:#1a1f2a;--cool:#6fa8ff;--warm:#ff9a63}}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:20px 16px 8px}
svg{width:100%;height:auto;display:block}
footer{max-width:1100px;margin:0 auto;padding:0 16px 24px;color:var(--muted);font-size:15px}
.cardbg{fill:var(--card);stroke:var(--line);stroke-width:2}
.card{cursor:help;outline:none}.card:hover .cardbg,.card:focus .cardbg{stroke:var(--cool);stroke-width:3}
.gl{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;color:var(--ink)}.gl.dim{color:var(--muted)}.gl.warmglyph{color:var(--warm)}
.slash{stroke:var(--warm);stroke-width:5;stroke-linecap:round}
.tab{fill:var(--band);stroke:var(--cool);stroke-width:3}.tab.dashed{fill:none;stroke-dasharray:5 6;stroke:var(--muted)}
.draft{opacity:.85}
.bar{fill:var(--cool)}.bar.dashed{fill:none;stroke:var(--muted);stroke-width:3;stroke-dasharray:5 6}
.axis{stroke:var(--line);stroke-width:3;stroke-linecap:round}
.num{font:700 17px system-ui;fill:var(--ink);text-anchor:middle}.tally{font:700 26px system-ui;fill:var(--ink);text-anchor:middle}
.eq{font:700 24px system-ui;fill:var(--ink)}
.q{fill:none;stroke:var(--muted);stroke-width:3;stroke-dasharray:4 5}.qm{font:700 18px system-ui;fill:var(--muted);text-anchor:middle}
.trig{fill:var(--warm)}.dot.muted{fill:var(--muted)}
.rg{fill:none;stroke-linecap:round}.rg.out{stroke:var(--cool)}.rg.back{stroke:var(--warm)}
.rg.ghostback{stroke:var(--warm);stroke-dasharray:2 7;opacity:.45}.rg.open{stroke:var(--muted);stroke-dasharray:3 8}
.rh{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.rh.out{stroke:var(--cool)}.rh.back{stroke:var(--warm)}
.seg{fill:none;stroke-linecap:round}path.cool{stroke:var(--cool)}path.warm{stroke:var(--warm)}
.dot.coolfill{fill:var(--cool)}.dot.warmfill{fill:var(--warm)}
.spoke{stroke:var(--line);stroke-width:4;stroke-linecap:round;fill:none}.mfill{fill:var(--muted)}
.hubring{fill:var(--band);stroke:var(--line);stroke-width:3}.halo{fill:none;stroke:var(--warm);stroke-width:5}
.hub{cursor:help;outline:none}.hub:hover .hubring,.hub:focus .hubring{stroke:var(--warm)}
#tip{position:fixed;z-index:9;max-width:min(360px,86vw);background:var(--ink);color:var(--bg);padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.35;pointer-events:none;opacity:0;transition:opacity .12s;box-shadow:0 6px 24px rgba(0,0,0,.25)}#tip.on{opacity:1}
@media (max-width:640px){main{padding:12px 8px 4px}}
</style></head>
<body><main>${svg}</main>
<footer>From HIGHER_SELF_POV.md, 2026-11-02. Hover or tap any card for its words.</footer>
<div id="tip" role="tooltip"></div>
<script>
(function(){var tip=document.getElementById('tip'),shown=null;
function place(x,y){var w=tip.offsetWidth,h=tip.offsetHeight,vw=innerWidth,vh=innerHeight,l=Math.min(Math.max(8,x+14),vw-w-8),t=y+18+h>vh?Math.max(8,y-h-14):y+18;tip.style.left=l+'px';tip.style.top=t+'px';}
function show(el,x,y){tip.textContent=el.getAttribute('data-tip');tip.classList.add('on');shown=el;place(x,y);}
function hide(){tip.classList.remove('on');shown=null;}
document.querySelectorAll('[data-tip]').forEach(function(el){
el.addEventListener('pointerenter',function(e){show(el,e.clientX,e.clientY);});
el.addEventListener('pointermove',function(e){if(shown===el)place(e.clientX,e.clientY);});
el.addEventListener('pointerleave',hide);
el.addEventListener('focus',function(){var b=el.getBoundingClientRect();show(el,b.left+b.width/2,b.top+b.height/2);});
el.addEventListener('blur',hide);
el.addEventListener('click',function(e){e.stopPropagation();if(shown===el&&e.pointerType==='touch'){hide();}else{show(el,e.clientX,e.clientY);}});});
document.addEventListener('click',hide);})();
</script></body></html>
`;
writeFileSync(path.join(dir, 'HIGHER_SELF_POV.html'), html);
console.log('wrote HIGHER_SELF_POV.html', html.length, 'bytes', { bridges: tally, rulings: rulings.length, framings: framings.length, decisions: decisionIds.length, pipeline: pipeBullets.length, lessons: lessons.length, triggers: triggers.length, rounds: rounds.length });
