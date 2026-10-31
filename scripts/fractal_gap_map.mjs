#!/usr/bin/env node
/**
 * FRACTAL GAP MAP — the plan's point cloud, read against the framework's own laws.
 *
 * Every operator and stateful quantity the plan names lives in spine/fidelity_point_cloud.json.
 * This script places them on the framework's axes and reports the empty cells:
 *   - Inside a package (Check C11, 4 Folds): Substrate (state) · Dynamics (operators) · Transducer (interfaces) · Evaluator (gates/tests)
 *   - Around a package (Check C12, 4 Neighbours): Below (supplier it calls) · Above (host that calls it)
 *       · Lateral Dual (every drain has a restorer, every accumulation a release) · Seam (persistent state has a save path)
 *   - Plus homes, build waves and call order (C8), units/ranges (C31) and test coverage.
 * A hole is a candidate missing link, not automatically a defect: some are deliberate and need the owner's call.
 *
 * Grounding: every spine entry must still appear in the plan text, so the cloud cannot drift from the plan.
 * Usage: node scripts/fractal_gap_map.mjs [--strict] [--out file.md]   (--strict: exit 1 on ungrounded entries)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
// Triad location like the other gates: first positional arg, then FIDELITY_TRIAD_DIR, then the repo root.
const overlayPath = args.includes('--overlay') ? args[args.indexOf('--overlay') + 1] : null;
const positional = args.filter((a, i) => !a.startsWith('--') && !['--out', '--overlay'].includes(args[i - 1]));
const TRIAD_DIR = positional[0] ?? process.env.FIDELITY_TRIAD_DIR ?? ROOT;
const plan = fs.readFileSync(path.join(TRIAD_DIR, 'FIDELITY_COMPLETE_BRS_V2.md'), 'utf8');
const audit = fs.readFileSync(path.join(ROOT, 'scripts', 'adversarial_red_team_v9_audit.mjs'), 'utf8');
const cloud = JSON.parse(fs.readFileSync(path.join(ROOT, 'spine', 'fidelity_point_cloud.json'), 'utf8'));
const Q = Object.fromEntries(cloud.quantities.map(q => [q.id, q]));
const OPS = cloud.operators.map(o => ({ ...o, role: [].concat(o.role) }));

// ---- Regrow: --overlay applies proposed fills (Plan §8.2) to the cloud before mapping it again.
if (overlayPath) {
  const ov = JSON.parse(fs.readFileSync(path.resolve(overlayPath), 'utf8'));
  for (const [id, patch] of Object.entries(ov.quantities ?? {})) Object.assign(Q[id], patch);
  for (const o of ov.operators ?? []) OPS.push({ ...o, role: [].concat(o.role), proposed: true });
  for (const [id, patch] of Object.entries(ov.operatorPatches ?? {})) {
    const o = OPS.find(x => x.id === id);
    o.touches = { ...o.touches, ...patch.touches };
    o.calls = [...new Set([...(o.calls ?? []), ...(patch.calls ?? [])])];
  }
}
const opById = Object.fromEntries(OPS.map(o => [o.id, o]));
const has = (o, ...roles) => o.role.some(r => roles.includes(r));

// ---- Grounding: the cloud must be a reduction of the plan, never an invention.
// Proposed operators are grounded in the §8.2 text that proposes them.
const ungrounded = [];
for (const q of cloud.quantities) if (!plan.includes(q.ground)) ungrounded.push(`quantity ${q.id} (ground "${q.ground}")`);
for (const o of OPS) {
  if (!plan.includes(o.proposed ? o.ground : o.id)) ungrounded.push(`operator ${o.id}${o.proposed ? ` (proposal "${o.ground}")` : ''}`);
  if (o.tested && !audit.includes(`function ${o.tested}(`)) ungrounded.push(`operator ${o.id}: test reference ${o.tested} not in the v9 suite`);
  for (const q of Object.keys(o.touches ?? {})) if (!Q[q]) ungrounded.push(`operator ${o.id} touches unknown quantity ${q}`);
  for (const c of o.calls ?? []) if (!opById[c]) ungrounded.push(`operator ${o.id} calls unknown operator ${c}`);
}

// ---- Build waves from the plan text: Wave 1 = Bucket A ports; Waves 2-7 = packages named in each wave bullet.
const waveOf = {};
const bucketA = plan.match(/\*\*BUCKET A[^\n]*/)?.[0] ?? '';
for (const m of bucketA.matchAll(/@hm\/([a-z0-9-]+)/g)) waveOf[m[1]] ??= 1;
for (const m of plan.matchAll(/^- \*\*Wave (\d)[^\n]*\n((?: {2}- [^\n]*\n)*)/gm)) {
  for (const p of m[0].matchAll(/@hm\/([a-z0-9-]+)/g)) waveOf[p[1]] = Math.min(waveOf[p[1]] ?? 9, +m[1]);
  if (/apps\/universe/.test(m[0])) waveOf['apps/universe'] = Math.min(waveOf['apps/universe'] ?? 9, +m[1]);
}
// Sub-modules inherit their host's wave when they are not named in a wave themselves.
const homeOf = {};
for (const m of plan.matchAll(/^\| `@hm\/([a-z0-9-]+)` \| `packages\/([a-z0-9-]+)` \(([^)]*)\)/gm)) homeOf[m[1]] = { host: m[2], kind: m[3] };
const waveFor = pkg => waveOf[pkg] ?? (homeOf[pkg]?.kind.startsWith('sub') ? waveOf[homeOf[pkg].host] : undefined);

// ---- Holes.
const holes = [];
const hole = (axis, where, what, fill = '') => holes.push({ axis, where, what, fill });

for (const o of OPS) {
  if (!o.pkg) hole('Home (C8)', o.id, 'no home package', 'deduce from what it touches');
  else if (waveFor(o.pkg) === undefined) hole('Wave (C8)', o.id, `package ${o.pkg} is not named in any build wave`, 'name it in the wave after its suppliers');
  for (const c of o.calls ?? []) {
    const wc = waveFor(o.pkg), wd = waveFor(opById[c]?.pkg);
    if (wc !== undefined && wd !== undefined && wd > wc) hole('Order (C8)', o.id, `calls ${c} (Wave ${wd}) from Wave ${wc}`, 'move caller later or callee earlier');
  }
}

const dirs = {};
for (const o of OPS) for (const [q, d] of Object.entries(o.touches ?? {})) {
  dirs[q] ??= new Set();
  if (d === '±') { dirs[q].add('+'); dirs[q].add('-'); } else if (d !== '=') dirs[q].add(d);
}
for (const q of cloud.quantities) {
  const d = dirs[q.id] ?? new Set();
  if (d.size === 1) {
    const only = [...d][0] === '+' ? 'only ever increases' : 'only ever decreases';
    const by = OPS.filter(o => o.touches?.[q.id]).map(o => o.id).join(', ');
    hole('Lateral Dual (C12/C20)', q.id, `${only} (via ${by})${q.monotone ? ` — ${q.monotone}` : ''}`, q.monotone ? 'owner: confirm monotone by design, or add a dual' : 'add the restoring/releasing operator');
  }
  if (q.persistence === 'unspecified') hole(`Seam: ${q.scope} store (C12)`, q.id, 'persistence unspecified (saved, or per-session?)', `declare it, and name the ${q.scope} store`);
  else if (q.persistence === 'persistent' && !q.seam) {
    if (q.scope === 'soul') hole('Seam: soul cartridge (C12/C22)', q.id, 'soul state with no @hm/shorthand field: lost between sessions', 'add a shorthand field (mind the 4 KB budget, B102)');
    else hole(`Seam: ${q.scope} store (C12)`, q.id, `${q.scope} state, and the plan defines no ${q.scope} save format`, `name the ${q.scope} store and its format`);
  }
  if (!q.unit || !q.range) hole('Units (C31)', q.id, `missing ${[!q.unit && 'unit', !q.range && 'range'].filter(Boolean).join(' and ')}`, 'state unit and bounds');
}

// ---- Fold/neighbour matrix per package.
// The plan anchors every package on the root (Branch 0); a grounded declaration counts as each package's supplier below.
const deps = cloud.packageDependsOn && plan.includes(cloud.packageDependsOn.ground) ? cloud.packageDependsOn : null;
if (cloud.packageDependsOn && !deps) ungrounded.push(`packageDependsOn (ground "${cloud.packageDependsOn.ground}")`);
const pkgs = [...new Set(OPS.map(o => o.pkg).filter(Boolean))].sort();
const callers = {};
for (const o of OPS) for (const c of o.calls ?? []) { const p = opById[c]?.pkg; if (p && p !== o.pkg) (callers[p] ??= new Set()).add(o.pkg); }
const rows = pkgs.map(p => {
  const ops = OPS.filter(o => o.pkg === p);
  const touched = [...new Set(ops.flatMap(o => Object.keys(o.touches ?? {})))];
  const moving = touched.filter(q => ops.some(o => ['+', '-', '±'].includes(o.touches[q])));
  const cells = {
    Substrate: touched.length > 0 || p === 'shorthand',
    Dynamics: ops.some(o => has(o, 'dynamics', 'restore', 'driver')),
    Transducer: ops.some(o => has(o, 'transducer') || (o.calls ?? []).length > 0) || Boolean(callers[p]),
    Evaluator: ops.some(o => has(o, 'evaluator') || o.tested),
    // The root (Branch 0, (0,0,0)_Root) has no supplier below it by definition.
    Below: ops.some(o => (o.calls ?? []).some(c => opById[c]?.pkg && opById[c].pkg !== p)) || (Boolean(deps) && (p === deps.root || deps.all.some(d => d !== p))),
    Above: Boolean(callers[p]) || ops.some(o => has(o, 'driver')),
    Dual: moving.every(q => (dirs[q]?.size ?? 0) !== 1),
    Seam: touched.every(q => Q[q].persistence !== 'persistent' || Q[q].seam),
  };
  return { p, cells, wave: waveFor(p) };
});
for (const k of ['Below', 'Above']) {
  const empty = rows.filter(r => !r.cells[k]).map(r => r.p);
  if (empty.length > rows.length / 2) hole('Call graph (C8/C12)', `${empty.length}/${rows.length} packages`, `no ${k === 'Above' ? 'caller (host)' : 'supplier'} named for: ${empty.join(', ')}`, 'add a tick/call-order section: who calls whom, in what order, each frame and each eon');
  else for (const p of empty) hole(`Around: ${k}`, p, k === 'Above' ? 'no package or app calls it' : 'calls no supplier');
}
const foldHoles = rows.flatMap(r => ['Substrate', 'Dynamics', 'Transducer', 'Evaluator'].filter(k => !r.cells[k]).map(k => `${r.p}:${k}`));
const untested = OPS.filter(o => !o.tested);

// ---- Report.
const mark = v => (v ? '●' : '○');
const lines = [];
lines.push(overlayPath ? '# Fractal Gap Map — regrown with proposed fills' : '# Fractal Gap Map', '', `Generated by \`scripts/fractal_gap_map.mjs\` from \`spine/fidelity_point_cloud.json\`${overlayPath ? ` + \`${path.basename(overlayPath)}\` (PROPOSED fills, not accepted)` : ''} (${cloud.quantities.length} quantities, ${OPS.length} operators) against the plan text.`, '');
lines.push(`**Grounding:** ${ungrounded.length ? `${ungrounded.length} ungrounded entries:\n${ungrounded.map(u => `- ${u}`).join('\n')}` : 'every spine entry appears in the plan.'}`, '');
lines.push('## Package matrix (● filled, ○ hole)', '', '| Package | Wave | Substrate | Dynamics | Transducer | Evaluator | Below | Above | Dual | Seam |', '|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) lines.push(`| \`${r.p}\` | ${r.wave ?? '—'} | ${Object.values(r.cells).map(mark).join(' | ')} |`);
const groups = {};
for (const h of holes) (groups[h.axis] ??= []).push(h);
lines.push('', `## Holes (${holes.length}, plus ${foldHoles.length} law-strict fold cells)`);
for (const [axis, hs] of Object.entries(groups)) {
  lines.push('', `### ${axis} (${hs.length})`, '', '| Where | What is empty | Fill direction |', '|---|---|---|');
  for (const h of hs) lines.push(`| \`${h.where}\` | ${h.what} | ${h.fill} |`);
}
lines.push('', `## Inside folds, law-strict (${foldHoles.length})`, '', 'Read with care: a pure validator may not need its own Dynamics. These are the ○ cells under Substrate, Dynamics, Transducer and Evaluator.', '', foldHoles.map(h => `\`${h}\``).join(' · '));
lines.push('', `## Test coverage: ${OPS.length - untested.length}/${OPS.length} operators have a reference test`, '', untested.map(o => `\`${o.id}\``).join(' · '), '');
const report = lines.join('\n');
if (outFile) fs.writeFileSync(path.resolve(outFile), report);
console.log(report);
if (strict && ungrounded.length) process.exitCode = 1;
