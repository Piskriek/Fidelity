#!/usr/bin/env node
/**
 * AUTOMATIC MUTANT GENERATOR — mutation testing of the gates at scale (Method Mirror: "mutate").
 *
 * Hand-planted defects measure the gates against the defects one person thought of. This applies
 * mutation operators across the Plan's specification (Parts 1–7, outside code blocks) at sites
 * sampled with a fixed seed, runs every gate on each mutant, and reports:
 *   - the kill rate per operator and per gate (what each gate actually guards), and
 *   - the SURVIVORS: mutants no gate caught. Each is a blind spot or an equivalent mutant
 *     (a change that alters nothing that matters); read them to decide which.
 *
 * Usage: node scripts/mutant_generator.mjs [--per-op N] [--seed S] [--all-sites] [--tuned-file A.json[,B.json]] [--shown-specs F01,F02,…] [--with-v9] [--out file.md]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const PER_OP = +opt('--per-op', 10), SEED = +opt('--seed', 42), OUT = opt('--out', null);
const TRIAD = ['SQ_DISTORTION_CHECK_V9_SKILL.md', 'FIDELITY_COMPLETE_BRS_V2.md', 'ARGON_OPUS_MASTER_RESUME_V2.md'];
const PLAN = 'FIDELITY_COMPLETE_BRS_V2.md';
const plan = fs.readFileSync(path.join(ROOT, PLAN), 'utf8');

// Mutable region: Parts 1–7, minus fenced code blocks (shorthand records, the tree).
const start = plan.indexOf('# PART 1:'), end = plan.indexOf('# PART 8:');
const blocked = [];
for (const m of plan.matchAll(/```[\s\S]*?```/g)) blocked.push([m.index, m.index + m[0].length]);
const inRegion = i => i >= start && i < end && !blocked.some(([a, b]) => i >= a && i < b);

// Operators: [name, regex, replacement(match) -> string]. Each match site yields one mutant.
const OPS = [
  ['min↔max', /\\(min|max)(?=\(|\\left\(|_\{)/g, m => `\\${m[1] === 'min' ? 'max' : 'min'}`],
  ['≥↔≤', /\\(ge|le)\b/g, m => `\\${m[1] === 'ge' ? 'le' : 'ge'}`],
  ['>=→>', /(`[^`\n]*?)>=([^`\n]*`)/g, m => `${m[1]}>${m[2]}`],
  ['true↔false', /=== (true|false)`/g, m => `=== ${m[1] === 'true' ? 'false' : 'true'}\``],
  // Operands hold no top-level comma (so `\max(a, b - c)` is not swapped across its argument list), but
  // braces may nest two deep with commas inside, as in `\mathbf{q}_{\star, k}` or `E_{\text{max}}`.
  // A pair split by `\left(`…`\right)` is skipped (returning the match unchanged drops the site).
  ['swap a−b', /\(((?:[^()$\n,{}]|\{(?:[^{}\n]|\{[^{}\n]*\})*\}){1,40}) - ((?:[^()$\n,{}]|\{(?:[^{}\n]|\{[^{}\n]*\})*\}){1,40})\)/g,
    m => (/\\(left|right)/.test(m[1] + m[2]) ? m[0] : `(${m[2]} - ${m[1]})`)],
  // Every ` - ` / ` + ` inside a math span (not only the first): the region filter below keeps math spans only.
  ['−↔+', / (-|\+) (?=[^$\n]*\$)/g, m => ` ${m[1] === '-' ? '+' : '-'} `, 'math'],
  ['coefficient ±0.1', /(?<![\d.])(0\.\d\d?)(?![\d])/g, m => `${(+m[1] + (+m[1] >= 0.5 ? -0.1 : 0.1)).toFixed(m[1].length - 2)}`],
  ['integer ×2', /(?<![\w.,^{-])(\d{2,6})(?![\d.,}%\w-])/g, m => `${+m[1] * 2}`],
  ['unit swap', /(GPa|MPa|\bkJ\b|(?<=\d )J\b|kg\/m)/g, m => ({ GPa: 'MPa', MPa: 'GPa', kJ: 'J', J: 'kJ', 'kg/m': 'g/cm' })[m[1]]],
  ['drop guard', /\\max\((1|10\^\{-\d+\}), /g, () => '('],
  ['type swap', /(Float32|Float16|Float64|Uint32Array\(128\))/g, m => ({ Float32: 'Float16', Float16: 'Float32', Float64: 'Float32', 'Uint32Array(128)': 'Uint32Array(64)' })[m[1]]],
  ['exponent', /\^\{(3\/2|1\/2)\}|\|\^(2)\b/g, m => (m[1] ? `^{${m[1] === '3/2' ? '1/2' : '3/2'}}` : '|^3')],
  ['drop enum member', /<([A-Z_]+(?:\|[A-Z_]+){2,})>/g, m => `<${m[1].split('|').slice(0, -1).join('|')}>`],
];

// Seeded shuffle (mulberry32) so runs are reproducible.
let s = SEED >>> 0;
const rand = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Math spans ($...$ and $$...$$) for operators that only make sense inside formulas.
const mathSpans = [...plan.matchAll(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g)].map(m => [m.index, m.index + m[0].length]);
const inMath = i => mathSpans.some(([a, b]) => i > a && i < b);

// --all-sites mutates every site (no sampling bias). Exposure: how much a spec author had seen at each site.
//   --tuned-file A.json[,B.json] : exact sites (operator + context) shown to a spec author, e.g. the tuning
//                                  sample and planted defects;
//   --shown-specs F01,F02,…      : formula-spine entries whose author was shown a defect in their formula
//                                  (by a plant or a reviewer's probe).
// Each mutant is then:
//   shown  : its exact site was shown;
//   seen   : it sits in the territory of a shown site or shown entry: the formula (math span, else line)
//            around a shown site, or the text of an entry that is shown or holds a shown site, including the
//            other Plan text that entry's test reads;
//   unseen : none of the above. This is the honest generalisation rate.
const ALL = args.includes('--all-sites');
const tunedList = args.includes('--tuned-file') ? opt('--tuned-file').split(',').flatMap(f => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'))) : null;
const isTuned = (op, at) => tunedList.some(t => t.op === op && plan.slice(Math.max(0, at - 40), at + 40) === t.ctx);
const shownSpecs = new Set((opt('--shown-specs', '') || '').split(',').filter(Boolean));
// Spans longer than this are cross-section checks, not one formula; they mark no territory.
const MAX_SPAN = 2000;
const entries = tunedList ? JSON.parse(spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'formula_spine.mjs'), ROOT, '--spans'], { encoding: 'utf8' }).stdout)
  .map(e => ({ id: e.id, spans: e.spans.filter(([a, b]) => b - a <= MAX_SPAN) })) : [];
const tunedAt = tunedList ? tunedList.map(t => plan.indexOf(t.ctx)).filter(i => i >= 0).map(i => i + 40) : [];
const within = (at, spans) => spans.some(([a, b]) => at >= a && at < b);
const covering = at => entries.filter(e => within(at, e.spans));
const seenEntries = new Set(entries.filter(e => shownSpecs.has(e.id) || tunedAt.some(t => within(t, e.spans))).map(e => e.id));
// The formula around each shown site: its math span, or its line when it is not inside one.
const lineOf = i => [plan.lastIndexOf('\n', i) + 1, (plan.indexOf('\n', i) + 1 || plan.length + 1) - 1];
const shownFormulas = tunedAt.map(t => mathSpans.find(([a, b]) => t > a && t < b) ?? lineOf(t));
const exposure = (tuned, at) => (tuned ? 'shown' : within(at, shownFormulas) || covering(at).some(e => seenEntries.has(e.id)) ? 'seen' : 'unseen');
const sampleKeys = seed => {
  s = seed >>> 0;
  const keys = new Set();
  for (const [name, re, , scope] of OPS) {
    const sites = [...plan.matchAll(re)].filter(m => inRegion(m.index) && (scope !== 'math' || inMath(m.index)));
    for (const m of shuffle(sites).slice(0, PER_OP)) keys.add(`${name}@${m.index}`);
  }
  return keys;
};
const chosen = ALL ? null : sampleKeys(SEED);
const mutants = [];
for (const [name, re, rep, scope] of OPS) {
  for (const m of [...plan.matchAll(re)].filter(x => inRegion(x.index) && (scope !== 'math' || inMath(x.index)))) {
    const key = `${name}@${m.index}`;
    if (chosen && !chosen.has(key)) continue;
    const to = rep(m);
    if (to === m[0]) continue;
    const tuned = tunedList ? isTuned(name, m.index) : null;
    mutants.push({ op: name, at: m.index, from: m[0], to, tuned, exposure: tunedList ? exposure(tuned, m.index) : null, text: plan.slice(0, m.index) + to + plan.slice(m.index + m[0].length) });
  }
}

const GATES = [
  ['semantic', ['triad_semantic_audit.mjs']],
  ['gapmap', ['fractal_gap_map.mjs', '--strict']],
  ['formula', ['formula_spine.mjs', '--quiet']],
  ['counts', ['count_identity_audit.mjs', '--quiet']],
  ...(args.includes('--with-v9') ? [['v9', ['adversarial_red_team_v9_audit.mjs']]] : []),
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fidelity-mutants-'));
for (const f of TRIAD) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
// Baseline: every gate must pass on the unmutated triad, or kill counts mean nothing.
for (const [name, [script, ...flags]] of GATES) {
  if (spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), dir, ...flags]).status !== 0) throw new Error(`gate ${name} fails on the unmutated triad`);
}
for (const mu of mutants) {
  fs.writeFileSync(path.join(dir, PLAN), mu.text);
  mu.killedBy = [];
  for (const [name, [script, ...flags]] of GATES) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), dir, ...flags], { encoding: 'utf8', timeout: 60000 });
    if (r.status === 0) continue;
    // A crash or timeout is not a catch: record it separately. An uncaught exception prints stack frames.
    if (r.status === null || /\n\s+at .+:\d+:\d+\)?\s*(\n|$)/.test(r.stderr ?? '')) { (mu.errors ??= []).push(name); continue; }
    mu.killedBy.push(name);
    // The formula spine proves a broken property (FAIL), only finds a pinned guard missing (FAIL(pin)),
    // or can no longer read the formula (DRIFT).
    if (name === 'formula') {
      const listed = r.stdout.split(' — ').pop();
      mu.formulaKind = /F\d+ FAIL(?!\(pin\))/.test(listed) ? 'FAIL' : /FAIL\(pin\)/.test(listed) ? 'PIN' : 'DRIFT';
    }
  }
}
fs.rmSync(dir, { recursive: true, force: true });

// Report.
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');
const L = ['# Automatic Mutant Generator', '', `${ALL ? 'Every site' : `Seed ${SEED}, up to ${PER_OP} sites per operator`}, ${mutants.length} mutants over Plan Parts 1–7 (outside code blocks). Gates: ${GATES.map(g => g[0]).join(', ')}.`, '', '| Operator | Mutants | Killed (any gate) | ' + GATES.map(g => g[0]).join(' | ') + ' | Killed without formula spine |', '|---|---|---|' + GATES.map(() => '---|').join('') + '---|'];
const byOp = {};
for (const mu of mutants) (byOp[mu.op] ??= []).push(mu);
const row = (label, ms) => {
  const any = ms.filter(m => m.killedBy.length).length;
  const noF = ms.filter(m => m.killedBy.some(g => g !== 'formula')).length;
  return `| ${label} | ${ms.length} | ${any} (${pct(any, ms.length)}) | ` + GATES.map(([g]) => ms.filter(m => m.killedBy.includes(g)).length).join(' | ') + ` | ${noF} (${pct(noF, ms.length)}) |`;
};
for (const [op, ms] of Object.entries(byOp)) L.push(row(op, ms));
L.push(row('**all**', mutants));
const summary = (label, ms) => {
  const n = ms.length, any = ms.filter(m => m.killedBy.length).length;
  const fail = ms.filter(m => m.formulaKind === 'FAIL').length;
  const weak = ms.filter(m => (m.formulaKind === 'DRIFT' || m.formulaKind === 'PIN') && m.killedBy.length === 1).length;
  const base = ms.filter(m => m.killedBy.some(g => g !== 'formula')).length;
  return `| ${label} | ${n} | ${any} (${pct(any, n)}) | ${fail} (${pct(fail, n)}) | ${weak} (${pct(weak, n)}) | ${base} (${pct(base, n)}) |`;
};
L.push('', '## Rates (share of mutants in each row)', '', '| Set | Mutants | Caught by any gate | Spine proved a broken property (behavioural FAIL) | Caught only by spine DRIFT or a text pin | Caught without the spine |', '|---|---|---|---|---|---|');
L.push(summary(ALL ? 'all sites' : `sampled (seed ${SEED})`, mutants));
if (tunedList) {
  L.push(summary('shown: the exact site was shown to a spec author', mutants.filter(m => m.exposure === 'shown')));
  L.push(summary('seen: in the formula or spine entry of a shown site or shown entry', mutants.filter(m => m.exposure === 'seen')));
  L.push(summary('**unseen: no spec author was shown a defect there**', mutants.filter(m => m.exposure === 'unseen')));
  L.push(summary('— of which inside some spine entry\'s text', mutants.filter(m => m.exposure === 'unseen' && covering(m.at).length)));
  L.push(summary('— of which outside every spine entry', mutants.filter(m => m.exposure === 'unseen' && !covering(m.at).length)));
  L.push('', `Shown sites: ${tunedAt.length} of ${tunedList.length} found in this Plan, ${mutants.filter(m => m.tuned).length} of them still mutation sites under the current operators. Shown spine entries: ${[...shownSpecs].join(', ') || 'none'}. Entries marking seen territory: ${[...seenEntries].join(', ') || 'none'} (spans longer than ${MAX_SPAN} characters mark none).`);
} else {
  L.push('', 'Sampled run: the sample can include sites the specs were written against, so this rate is not a generalisation rate. For that, run with `--all-sites --tuned-file … --shown-specs …` and read the unseen row.');
}
const errs = mutants.filter(m => m.errors?.length);
L.push('', `Gate crashes or timeouts (not counted as catches, listed separately): ${errs.length}. The default gates are semantic, gap map, formula spine and count/identity audit; the v9 suite runs only with \`--with-v9\`, and the mutation test and clean-slate scan are not run. Equivalent mutants (changes that alter nothing that matters) are not removed, so survivors mix blind spots and harmless edits.`);
for (const mu of errs) L.push(`- crashed: ${mu.op} \`${mu.from.replace(/`/g, "'")}\` → \`${mu.to.replace(/`/g, "'")}\` (${mu.errors.join(', ')})`);
const survivors = mutants.filter(m => !m.killedBy.length && !m.errors?.length);
L.push('', `## Survivors (${survivors.length}): blind spots or equivalent mutants`, '', '| Operator | Change | Exposure | Context |', '|---|---|---|---|');
for (const mu of survivors) {
  const ctx = plan.slice(Math.max(0, mu.at - 50), mu.at + mu.from.length + 50).replace(/\n/g, ' ').replace(/\|/g, '\\|');
  L.push(`| ${mu.op} | \`${mu.from.replace(/\|/g, '\\|').replace(/`/g, "'")}\` → \`${mu.to.replace(/\|/g, '\\|').replace(/`/g, "'")}\` | ${mu.exposure ?? '—'} | …${ctx}… |`);
}
const report = L.join('\n') + '\n';
if (OUT) fs.writeFileSync(path.resolve(OUT), report);
console.log(report.split('## Survivors')[0]);
console.log(`survivors: ${survivors.length} of ${mutants.length}`);
