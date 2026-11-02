// Builds PIPELINE_PICTURE.html from PIPELINE_FRACTAL.md and FRACTAL_ROLES.md (same folder).
// States, bridge names, step, level and role texts are read from those two documents, and the build stops if the bridge count, the step names or the tally drift.
// A few hover lines (the model shapes, the arrows, the hub and the 1+1=2 bar) are typed in this file and are not checked against the documents.
// Run: node make_pipeline_picture.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(path.join(dir, f), 'utf8');
const pipe = read('PIPELINE_FRACTAL.md');
const roles = read('FRACTAL_ROLES.md');

// ---------- reading the documents ----------
const clean = (s) => s.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
const sentences = (s, n = 2, max = 230) => {
  const parts = clean(s).split(/(?<=[.!?])\s+/);
  let t = parts.slice(0, n).join(' ');
  if (t.length > max) t = t.slice(0, max - 1).trimEnd() + '…';
  return t;
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function tableRows(md, headerStart) {
  const lines = md.split('\n');
  const i = lines.findIndex((l) => l.startsWith(headerStart));
  if (i < 0) throw new Error('table not found: ' + headerStart);
  const out = [];
  for (let j = i + 2; j < lines.length && lines[j].startsWith('|'); j++) {
    out.push(lines[j].split('|').slice(1, -1).map((c) => c.trim()));
  }
  return out;
}

const unitRows = tableRows(pipe, '| Step | What it is');
const unit = Object.fromEntries(unitRows.map((r) => [clean(r[0]), sentences(r[1], 2)]));
for (const k of ['ASK', 'WORK', 'CHECK', 'REPORT', 'ROUTE', 'LANDED']) if (!unit[k]) throw new Error('missing step ' + k);

const levelRows = tableRows(pipe, '| Level | Asker');
const level = Object.fromEntries(levelRows.map((r) => [r[0], { who: clean(r[1]), way: sentences(r[4], 2, 260) }]));
for (const k of ['L0', 'L1', 'rung', 'L2', 'L3', 'L4', 'beings', 'origin']) if (!level[k]) throw new Error('missing level ' + k);

const bridgeRows = tableRows(pipe, '| # | Bridge | Loop today');
if (bridgeRows.length !== 15) throw new Error('expected 15 bridges, got ' + bridgeRows.length);
const bridges = bridgeRows.map((r) => {
  if (r.length !== 7) throw new Error('bridge row has ' + r.length + ' cells: ' + r[0]);
  return { n: Number(r[0]), name: clean(r[1]).replace(/ \(new.*$/, ' (new)'), state: r[2], way: sentences(r[5], 2, 240) };
});
const count = (s) => bridges.filter((b) => b.state === s).length;
const tally = { looping: count('looping'), half: count('half'), open: count('open') };
for (const [k, v] of Object.entries(tally)) {
  const m = pipe.match(new RegExp('Today: .*?(\\d+) ' + k));
  const claimed = k === 'looping' ? pipe.match(/Today: (\d+) looping/)?.[1] : pipe.match(new RegExp('(\\d+) ' + k + '[ (]'))?.[1];
  if (Number(claimed) !== v) throw new Error(`summary says ${claimed} ${k}, table has ${v}`);
}

const roleCards = {};
for (const m of roles.matchAll(/###\s+(Manager|Track|Expert \(viewpoint\)|Bridge agent)\s*\n+\*\*Purpose\.\*\*\s*([^\n]+)/g)) {
  roleCards[m[1].split(' ')[0].toLowerCase()] = sentences(m[2], 2, 240);
}
for (const k of ['manager', 'track', 'expert', 'bridge']) if (!roleCards[k]) throw new Error('missing role ' + k);

// ---------- drawing helpers ----------
const f = (x) => Math.round(x * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, d) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
const arc = (cx, cy, r, a1, a2, sweep = 1) => {
  const [x1, y1] = pt(cx, cy, r, a1), [x2, y2] = pt(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 ${large} ${sweep} ${f(x2)} ${f(y2)}`;
};
const tip = (t) => `data-tip="${esc(t)}" aria-label="${esc(t)}" tabindex="0"`;
const G = (x, y, s, inner, cls = '') =>
  `<g class="gl ${cls}" transform="translate(${f(x)} ${f(y)}) scale(${s})">${inner}</g>`;

const glyph = {
  eye: '<path d="M-16 0 Q0 -13 16 0 Q0 13 -16 0 Z"/><circle r="4.2" fill="currentColor"/>',
  person: '<circle cy="-8" r="6"/><path d="M-13 14 Q-13 2 0 2 Q13 2 13 14 Z"/>',
  hub: '<ellipse cy="-21" rx="9" ry="3"/><circle r="5"/><path d="M0 -5 V-11 M0 5 V11 M-5 0 H-11 M5 0 H11"/><circle cx="-14" r="2.6"/><circle cx="14" r="2.6"/><circle cy="-14" r="2.6"/><circle cy="14" r="2.6"/>',
  three: '<circle cx="-15" cy="6" r="3.5"/><circle cx="-3" cy="3" r="6"/><circle cx="14" cy="-1" r="9.5"/>',
  lanes: '<path d="M-14 -9 H12 M7 -13 L12 -9 L7 -5 M-14 0 H12 M7 -4 L12 0 L7 4 M-14 9 H12 M7 5 L12 9 L7 13"/>',
  pair: '<circle cx="-6" r="9"/><circle cx="6" r="9"/>',
  cloud: '<path d="M-14 8 Q-18 8 -18 2 Q-18 -4 -11 -4 Q-9 -13 0 -13 Q9 -13 10 -5 Q18 -5 18 2 Q18 8 12 8 Z"/>',
  world: '<rect x="-15" y="-14" width="26" height="26" rx="6"/><circle cx="-7" cy="-5" r="1.8" fill="currentColor"/><circle cx="1" cy="-3" r="1.8" fill="currentColor"/><circle cx="-4" cy="4" r="1.8" fill="currentColor"/><circle cx="10" cy="9" r="7" style="fill:var(--card)"/><path d="M15 14 L19 18"/>',
  bridge: '<path d="M-19 2 H19"/><path d="M-13 2 Q0 -14 13 2"/><path d="M-19 2 V14 M19 2 V14 M-19 14 H-11 M19 14 H11"/>',
  memory: '<ellipse cy="-9" rx="12" ry="4.5"/><path d="M-12 -9 V9 Q0 17 12 9 V-9"/><path d="M-12 0 Q0 8 12 0"/>',
  branch: '<circle cx="-8" cy="-11" r="3.2"/><circle cx="-8" cy="11" r="3.2"/><circle cx="9" cy="-3" r="3.2"/><path d="M-8 -7.8 V7.8 M-8 4 Q-8 -3 5.8 -3"/>',
  ask: '<circle cx="-14" r="3.2" fill="currentColor"/><path d="M-9 0 H13 M6 -7 L13 0 L6 7"/>',
  check: '<path d="M0 -14 L13 10 L-13 10 Z"/><circle cy="-14" r="3" fill="currentColor"/><circle cx="13" cy="10" r="3" fill="currentColor"/><circle cx="-13" cy="10" r="3" fill="currentColor"/>',
  report: '<rect x="-11" y="-14" width="22" height="28" rx="3"/><path d="M-6 -6 H6 M-6 0 H6 M-6 6 H3"/>',
  route: '<circle cx="-14" r="3" fill="currentColor"/><path d="M-11 0 L10 -10 M-11 0 L10 0 M-11 0 L10 10"/><circle cx="12" cy="-10" r="2.6"/><circle cx="12" cy="0" r="2.6"/><circle cx="12" cy="10" r="2.6"/>',
  heart: '<path d="M0 12 C-18 -2 -10 -14 0 -6 C10 -14 18 -2 0 12 Z"/>',
  translate: '<path d="M-14 -5 H12 M7 -10 L12 -5 L7 0 M14 7 H-12 M-7 2 L-12 7 L-7 12"/>',
};

// a small copy of the loop; depth nests a smaller copy in the centre (the fractal)
function miniLoop(cx, cy, R, depth, sw) {
  const stations = [-90, -30, 30, 90, 150, 210];
  const pad = Math.min(30, (R * 0.2 + 3) / R * 57.3);
  let s = '';
  for (let k = 0; k < 6; k++) {
    const a1 = stations[k] + pad, a2 = stations[k] + 60 - pad;
    const warm = k >= 4;
    s += `<path d="${arc(cx, cy, R, a1, a2)}" class="${warm ? 'warm' : 'cool'}" style="stroke-width:${warm ? sw * 1.5 : sw}"/>`;
  }
  for (let k = 0; k < 6; k++) {
    const [x, y] = pt(cx, cy, R, stations[k]);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(2, R * 0.13))}" class="dot ${k === 5 ? 'warmfill' : 'coolfill'}"/>`;
  }
  if (depth > 0) s += miniLoop(cx, cy, R * 0.42, depth - 1, sw * 0.8);
  return s;
}

// ---------- panel 1: the unit ----------
function panelUnit() {
  const C = 300, R = 190, r = 37;
  const names = ['ASK', 'WORK', 'CHECK', 'REPORT', 'ROUTE', 'LANDED'];
  const gl = ['ask', 'eye', 'check', 'report', 'route', 'heart'];
  const angles = [-90, -30, 30, 90, 150, 210];
  const padStart = ((r + 9) / R) * 57.3, padEnd = ((r + 14) / R) * 57.3;
  let s = '';
  for (let k = 0; k < 6; k++) {
    const a1 = angles[k] + padStart, a2 = angles[k] + 60 - padEnd;
    const warm = k >= 4;
    const t =
      k === 4 ? `The way back begins: the report is routed to every level that acts on it. ${unit.ROUTE}`
      : k === 5 ? `The way back: news of how it landed returns to whoever asked, and the next ask changes. ${unit.LANDED}`
      : `${names[k]} to ${names[k + 1]}. ${unit[names[k + 1]]}`;
    s += `<path d="${arc(C, C, R, a1, a2)}" class="arc ${warm ? 'warm back' : 'cool'}" marker-end="url(#${warm ? 'mw' : 'mc'})" ${tip(t)}/>`;
  }
  // the doer may decline: a short dashed arc backwards from ASK to LANDED
  s += `<path d="${arc(C, C, R * 0.8, -102, -138, 0)}" class="arc warm dash" marker-end="url(#mw)" ${tip('The doer may decline: "did not fit here: reason", never a verdict on the asker. ' + unit.ASK)}/>`;
  // stations
  for (let k = 0; k < 6; k++) {
    const [x, y] = pt(C, C, R, angles[k]);
    const warm = k === 5;
    s += `<g ${tip(names[k] + '. ' + unit[names[k]])} class="station ${warm ? 'warmst' : 'coolst'}">` +
      `<circle cx="${f(x)}" cy="${f(y)}" r="${r}"/>` + G(x, y, 1.15, glyph[gl[k]]) + `</g>`;
  }
  s += miniLoop(C, C, 70, 2, 4);
  // a dot that travels the loop (SMIL; removed for reduced motion)
  const [sx, sy] = pt(C, C, R, -90);
  s += `<circle r="7" class="runner"><animateMotion dur="12s" repeatCount="indefinite" path="M${f(sx)} ${f(sy)} A${R} ${R} 0 1 1 ${f(sx)} ${f(sy + 2 * R)} A${R} ${R} 0 1 1 ${f(sx)} ${f(sy)}"/></circle>`;
  return `<svg viewBox="0 0 600 600" role="group" aria-label="The unit as a loop">
<defs>
<marker id="mc" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" refX="13" refY="10" orient="auto"><path d="M0 1 L19 10 L0 19 z" class="mfill cool"/></marker>
<marker id="mw" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" refX="13" refY="10" orient="auto"><path d="M0 1 L19 10 L0 19 z" class="mfill warm"/></marker>
</defs>${s}</svg>`;
}

// ---------- panel 2: the levels ----------
function panelLevels() {
  const rows = [
    { key: 'L0', gl: [['person', 1.5]], title: 'Owner. ' },
    { key: 'L1', gl: [['hub', 1.35]], title: 'Manager, the loop\'s higher self. ' },
    { key: 'rung', gl: [['three', 1.3]], title: 'The rung under the manager: three horizons, quick, middle and long. ' },
    { key: 'L2', gl: [['lanes', 1.4]], title: 'Tracks. ' },
    { key: 'L3', gl: [['eye', 1.2], ['pair', 1.1]], title: 'Viewpoints and partner pairs. ' },
    { key: 'L4', gl: [['cloud', 1.4]], title: 'Outside minds. ' },
    { key: 'beings', gl: [['world', 1.4]], title: 'The beings. ' },
  ];
  const y0 = 60, dy = 100, cx = 330;
  let s = '<defs><marker id="td" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="10" refY="8" orient="auto"><path d="M0 1 L15 8 L0 15 z" class="mfill cool"/></marker><marker id="tu" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="10" refY="8" orient="auto"><path d="M0 1 L15 8 L0 15 z" class="mfill warm"/></marker></defs>';
  rows.forEach((r, i) => { s += `<rect x="20" y="${y0 + i * dy - 40}" width="560" height="80" rx="18" class="band"/>`; });
  rows.forEach((r, i) => {
    const y = y0 + i * dy;
    const t = r.title + level[r.key].who + '. Way back: ' + level[r.key].way;
    s += `<g ${tip(t)} class="row">`;
    if (r.gl.length === 1) s += G(95, y, r.gl[0][1], glyph[r.gl[0][0]]);
    else { s += G(68, y, r.gl[0][1], glyph[r.gl[0][0]]); s += G(128, y, r.gl[1][1], glyph[r.gl[1][0]]); }
    s += miniLoop(cx, y, 28, 1, 3.2) + '</g>';
    if (i < rows.length - 1) {
      const ya = y + 20, yb = y + dy - 24;
      s += `<path d="M${cx - 52} ${ya} V${yb}" class="arc cool" marker-end="url(#td)" ${tip('The ask goes down a level, in the same shape.')}/>`;
      s += `<path d="M${cx + 52} ${yb + 4} V${ya + 4}" class="arc warm" marker-end="url(#tu)" ${tip('The news of how it landed comes back up.')}/>`;
    }
  });
  // the owner hears at the end: the big return from the bottom to the owner
  const yTop = y0, yBot = y0 + (rows.length - 1) * dy;
  s += `<path d="M${cx + 66} ${yBot} C 604 ${yBot} 604 ${yTop} ${cx + 176} ${yTop}" class="arc warm back" marker-end="url(#tu)" ${tip(level.origin.who + ' ' + level.origin.way)}/>`;
  s += G(cx + 134, yTop, 1.4, glyph.heart, 'warmglyph');
  return `<svg viewBox="0 0 620 ${y0 + (rows.length - 1) * dy + 60}" role="group" aria-label="The same loop at every level">${s}</svg>`;
}

// ---------- panel 3: roles any model can take (horizontal, and a vertical version for narrow screens) ----------
function panelRoles(orient) {
  const models = [
    { shape: '<path d="M0 -16 L15 12 L-15 12 Z"/>', t: 'Argon (Gemini): a model, the library or translator that runs a role.' },
    { shape: '<rect x="-14" y="-14" width="28" height="28" rx="3"/>', t: 'Flash: a cheap model, untested here. It would qualify if it can translate and follow simple logic.' },
    { shape: '<circle r="15"/>', t: 'A Codex agent: meant to read the Drive and add files to the repository, as a bridge agent (untested here).' },
    { shape: '<path d="M-14 -8 L0 -16 L14 -8 L14 8 L0 16 L-14 8 Z"/>', t: 'A Claude session: the manager, a track or an expert.' },
  ];
  const rl = [
    { g: 'hub', k: 'manager', n: 'Manager' }, { g: 'lanes', k: 'track', n: 'Track' },
    { g: 'eye', k: 'expert', n: 'Expert' }, { g: 'bridge', k: 'bridge', n: 'Bridge agent' },
  ];
  const v = orient === 'v';
  const box = v ? [400, 600] : [780, 430];
  const c = v ? [200, 285] : [390, 212];
  const mp = v ? [55, 152, 248, 345].map((x) => [x, 50]) : [70, 165, 260, 355].map((y) => [90, y]);
  const rp = v ? [55, 152, 248, 345].map((x) => [x, 545]) : [70, 165, 260, 355].map((y) => [690, y]);
  const barAt = v ? [200, 440] : [390, 395];
  const along = (p, q, d) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); return [p[0] + (dx / L) * d, p[1] + (dy / L) * d]; };
  let s = '';
  mp.forEach((p, i) => { const a = along(p, c, 30), b = along(c, p, 62); s += `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}" class="mesh" marker-end="url(#mm)" data-m="${i}"/>`; });
  rp.forEach((p, i) => { const a = along(c, p, 62), b = along(p, c, 38); s += `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}" class="mesh" marker-end="url(#mm)" data-r="${i}"/>`; });
  models.forEach((m, i) => { s += `<g ${tip(m.t)} class="model" data-m="${i}"><g transform="translate(${mp[i][0]} ${mp[i][1]})" class="mshape">${m.shape}</g></g>`; });
  rl.forEach((r, i) => {
    s += `<g ${tip(r.n + '. ' + roleCards[r.k])} class="role" data-r="${i}"><rect x="${rp[i][0] - 34}" y="${rp[i][1] - 34}" width="68" height="68" rx="16"/>` + (r.k === 'bridge' ? G(rp[i][0] - 17, rp[i][1] - 15, 0.55, glyph.cloud) + G(rp[i][0] + 17, rp[i][1] - 15, 0.55, glyph.branch) + G(rp[i][0], rp[i][1] + 9, 0.95, glyph.bridge) : G(rp[i][0], rp[i][1], 1.4, glyph[r.g])) + '</g>';
  });
  s += `<g ${tip('The loop is the architecture: the unit plus its way back lives in the documents and the roster, not in any one model. A model is the library or translator that runs a role. Every step still runs through some model; the loop decides what is kept, routed and returned.')} class="hub">` +
    `<circle cx="${c[0]}" cy="${c[1]}" r="62" class="hubring"/>` + miniLoop(c[0], c[1], 46, 1, 4) + '</g>';
  s += `<g ${tip('The minimum bar for a role: the agent can translate, between levels and between media, and follow simple steps of logic. Everything else is in the loop and the documents.')} class="bar">` +
    G(barAt[0] - 52, barAt[1], 1.1, glyph.translate) + `<text x="${barAt[0] + 12}" y="${barAt[1] + 6}" class="eq">1+1=2</text></g>`;
  return `<svg class="roles-${orient}" viewBox="0 0 ${box[0]} ${box[1]}" role="group" aria-label="Any model can take any role"><defs><marker id="mm${orient}" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="10" refY="8" orient="auto"><path d="M0 1 L15 8 L0 15 z" class="mfill muted"/></marker></defs>${s.split('url(#mm)').join('url(#mm' + orient + ')')}</svg>`;
}

// ---------- panel 4: the bridges (an HTML grid of small tiles, so it reflows on a phone) ----------
function ringFor(state, x, y, r, n) {
  let g = '';
  const head = (px, py, dir, cls) => `<path d="M${f(px - dir * 7)} ${f(py - 7)} L${f(px)} ${f(py)} L${f(px - dir * 7)} ${f(py + 7)}" class="ringhead ${cls}"/>`;
  if (state === 'looping') {
    g += `<path d="${arc(x, y, r, -90, 90)}" class="ring out"/><path d="${arc(x, y, r, 90, 270)}" class="ring back"/>`;
    g += head(x, y + r, -1, 'out') + head(x, y - r, 1, 'back');
  } else if (state === 'half') {
    g += `<path d="${arc(x, y, r, -90, 90)}" class="ring out"/><path d="${arc(x, y, r, 90, 270)}" class="ring ghostback"/>`;
    g += head(x, y + r, -1, 'out');
  } else {
    g += `<circle cx="${x}" cy="${y}" r="${r}" class="ring open"/>`;
  }
  if (n) g += `<text x="${x}" y="${y + 7}" class="num">${n}</text>`;
  return g;
}
const ends = {1:['person','hub'],2:['hub','person'],3:['hub','lanes'],4:['lanes','hub'],5:['hub','eye'],6:['hub','memory'],7:['memory','hub'],8:['hub','report'],9:['report','lanes'],10:['hub','branch'],11:['branch','cloud'],12:['world','person'],13:['person','hub'],14:['hub','cloud'],15:['cloud','hub']};
const words = { looping: 'looping: a way out and a way back that has carried news', half: 'half: a way out, with the way back missing or not yet shown to carry news', open: 'open: no route in the system, carried by hand' };
function panelBridges() {
  const tiles = bridges.map((b) => {
    const x = 60, y = 40;
    return `<div ${tip(`${b.n}. ${b.name} is ${words[b.state]}. ${b.state === 'looping' ? 'Way back' : 'Proposed way back'}: ${b.way}`)} class="tile"><svg viewBox="0 0 120 112">${ringFor(b.state, x, y, 28, b.n)}` +
      `${G(x - 26, y + 62, 0.62, glyph[ends[b.n][0]])}<path d="M${x - 11} ${y + 62} h20 m-5 -5 l5 5 l-5 5" class="endarrow"/>${G(x + 28, y + 62, 0.62, glyph[ends[b.n][1]])}</svg></div>`;
  }).join('');
  const legend = ['looping', 'half', 'open'].map((st) =>
    `<div ${tip(words[st])} class="tile legend"><svg viewBox="0 0 150 64">${ringFor(st, 34, 32, 24, 0)}<text x="84" y="44" class="tally">${tally[st]}</text></svg></div>`).join('');
  return `<div class="bridges"><div class="tiles">${tiles}</div><div class="legends">${legend}</div></div>`;
}

// ---------- the page ----------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fidelity pipeline picture</title>
<style>
:root{--bg:#f7f6f2;--card:#fff;--ink:#1d2330;--muted:#7d8394;--line:#cfd3dc;--band:#eef0f4;--cool:#2563c9;--warm:#d9480f;--good:#0f8f6e;--mid:#c98a00;--none:#7b8294}
@media (prefers-color-scheme:dark){:root{--bg:#0f1218;--card:#181c25;--ink:#e9ecf3;--muted:#8c93a4;--line:#323847;--band:#1a1f2a;--cool:#6fa8ff;--warm:#ff9a63;--good:#3dd6a6;--mid:#f0b94a;--none:#8d95a8}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:1180px;margin:0 auto;padding:20px 16px 36px;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))}
.panel{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:14px;position:relative}
.panel.wide{grid-column:1/-1}
.panel{display:flex;align-items:center}
.roles-v{display:none}
.bridges{display:flex;flex-wrap:wrap;gap:18px 40px;width:100%;align-items:center;justify-content:space-around;padding:26px 8px 8px}
.tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;flex:1 1 300px;max-width:700px}
.legends{display:flex;flex-direction:column;gap:2px;flex:0 0 auto}
.tile svg{width:100%;height:auto}
.tile.legend svg{width:150px}
.tile{outline:none;cursor:help}
.tile:focus-visible{outline:2px solid var(--cool);border-radius:12px}
.endarrow{fill:none;stroke:var(--muted);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.panel>.n{position:absolute;top:12px;left:16px;width:26px;height:26px;border-radius:50%;border:2px solid var(--line);color:var(--muted);font:600 13px/22px system-ui;text-align:center}
svg{width:100%;height:auto;display:block;overflow:visible;flex:1}
foot{display:block}
footer{max-width:1180px;margin:0 auto;padding:0 16px 24px;color:var(--muted);font-size:15px}
/* drawing */
.gl{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;color:var(--ink)}
.warmglyph{color:var(--warm)}
.arc{fill:none;stroke-width:6;stroke-linecap:round;cursor:help}
.arc.cool{stroke:var(--cool)}.arc.warm{stroke:var(--warm)}.arc.back{stroke-width:8}
.arc.dash{stroke-dasharray:3 9;stroke-width:5}
.arc:hover,.arc:focus{stroke-width:11;outline:none}
.mfill.cool{fill:var(--cool)}.mfill.warm{fill:var(--warm)}
.station circle{fill:var(--card);stroke-width:5;transition:transform .15s}
.coolst circle{stroke:var(--cool)}.warmst circle{stroke:var(--warm)}
.station{cursor:help;outline:none}
.station:hover circle,.station:focus circle{stroke-width:8}
.runner{fill:var(--ink)}
.cool{fill:none}path.cool{stroke:var(--cool);fill:none;stroke-linecap:round}
path.warm{stroke:var(--warm);fill:none;stroke-linecap:round}
.dot.coolfill{fill:var(--cool)}.dot.warmfill{fill:var(--warm)}
.band{fill:var(--band)}
.row{cursor:help;outline:none}
.row:hover .gl,.row:focus .gl{color:var(--cool)}
.mesh{stroke:var(--line);stroke-width:3;fill:none;stroke-linecap:round;transition:stroke .15s}
.mesh.on{stroke:var(--warm)}
.model .mshape{fill:var(--card);stroke:var(--ink);stroke-width:3;stroke-linejoin:round}
.model,.role,.hub,.bar,.tile{cursor:help;outline:none}
.role rect{fill:var(--band);stroke:var(--line);stroke-width:2}
.role:hover rect,.role:focus rect,.model:hover .mshape,.model:focus .mshape{stroke:var(--warm)}
.hubring{fill:var(--band);stroke:var(--line);stroke-width:2}
.eq{font:700 22px system-ui;fill:var(--ink)}
.num{font:700 20px system-ui;fill:var(--ink);text-anchor:middle}
.tally{font:700 30px system-ui;fill:var(--ink)}
.ring{fill:none;stroke-width:7;stroke-linecap:round}
.ring.out{stroke:var(--cool)}
.ring.back{stroke:var(--warm)}
.ring.ghostback{stroke:var(--warm);stroke-width:4;stroke-dasharray:2 8;opacity:.45}
.ring.open{stroke:var(--none);stroke-width:4;stroke-dasharray:3 9}
.ringhead{fill:none;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.ringhead.out{stroke:var(--cool)}.ringhead.back{stroke:var(--warm)}
.mfill.muted{fill:var(--muted)}
.tile:hover .ring,.tile:focus .ring{stroke-width:10}
@media (max-width:640px){.tiles{grid-template-columns:repeat(3,minmax(0,1fr))}.roles-h{display:none}.roles-v{display:block}.panel{padding:10px}}
#tip{position:fixed;z-index:9;max-width:min(340px,86vw);background:var(--ink);color:var(--bg);padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.35;pointer-events:none;opacity:0;transition:opacity .12s;box-shadow:0 6px 24px rgba(0,0,0,.25)}
#tip.on{opacity:1}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<main>
<section class="panel"><span class="n">1</span>${panelUnit()}</section>
<section class="panel"><span class="n">2</span>${panelLevels()}</section>
<section class="panel wide"><span class="n">3</span>${panelRoles('h')}${panelRoles('v')}</section>
<section class="panel wide"><span class="n">4</span>${panelBridges()}</section>
</main>
<footer>From PIPELINE_FRACTAL.md and FRACTAL_ROLES.md, 2026-11-02. Hover or tap any shape for its words.</footer>
<div id="tip" role="tooltip"></div>
<script>
(function(){
  var tip=document.getElementById('tip'),shown=null;
  function place(x,y){var w=tip.offsetWidth,h=tip.offsetHeight,vw=innerWidth,vh=innerHeight;
    var left=Math.min(Math.max(8,x+14),vw-w-8),top=y+18+h>vh?Math.max(8,y-h-14):y+18;tip.style.left=left+'px';tip.style.top=top+'px';}
  function show(el,x,y){tip.textContent=el.getAttribute('data-tip');tip.classList.add('on');shown=el;place(x,y);}
  function hide(){tip.classList.remove('on');shown=null;}
  document.querySelectorAll('[data-tip]').forEach(function(el){
    el.addEventListener('pointerenter',function(e){show(el,e.clientX,e.clientY);});
    el.addEventListener('pointermove',function(e){if(shown===el)place(e.clientX,e.clientY);});
    el.addEventListener('pointerleave',hide);
    el.addEventListener('focus',function(){var b=el.getBoundingClientRect();show(el,b.left+b.width/2,b.top+b.height/2);});
    el.addEventListener('blur',hide);
    el.addEventListener('click',function(e){e.stopPropagation();if(shown===el&&e.pointerType==='touch'){hide();}else{show(el,e.clientX,e.clientY);}});
  });
  document.addEventListener('click',hide);
  // hovering a model or a role lights its line to the loop
  document.querySelectorAll('.model,.role').forEach(function(el){
    var key=el.hasAttribute('data-m')?'data-m':'data-r',v=el.getAttribute(key);
    function on(f){document.querySelectorAll('.mesh['+key+'="'+v+'"]').forEach(function(m){m.classList.toggle('on',f);});}
    el.addEventListener('pointerenter',function(){on(true);});el.addEventListener('pointerleave',function(){on(false);});
    el.addEventListener('focus',function(){on(true);});el.addEventListener('blur',function(){on(false);});
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.runner').forEach(function(r){r.remove();});}
})();
</script>
</body>
</html>
`;
writeFileSync(path.join(dir, 'PIPELINE_PICTURE.html'), html);
console.log('wrote PIPELINE_PICTURE.html', html.length, 'bytes; bridges', tally);
