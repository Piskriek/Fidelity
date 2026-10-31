#!/usr/bin/env node
/**
 * METHOD MIRROR — the gap map turned on our own toolkit (one rung up).
 *
 * Classifies every defect in the Plan's §8.1 register by the kind of check that exposes it, then
 * marks which tools detect that class mechanically (zero tokens, every run) and which only an LLM
 * reader catches (tokens, variable recall). Classes with no mechanical detector are candidate tools.
 * Classification is keyword-based and approximate; the per-class examples make it auditable.
 *
 * Usage: node scripts/method_mirror.mjs [--out file.md]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const plan = fs.readFileSync(path.join(ROOT, 'FIDELITY_COMPLETE_BRS_V2.md'), 'utf8');
const rows = [...plan.matchAll(/^\| `(B\d+)` \| \*\*(FIXED|OPEN)\*\* \| ([^|]*) \| (.*) \|$/gm)].map(m => ({ id: m[1], status: m[2], check: m[3].trim(), text: m[4] }));

// Detection classes, in priority order (first match wins). `mech` = tools that catch the CLASS
// mechanically today; `pinned` = a gate guards only specific instances already found;
// `llm` = methods that caught it in the benchmarks; `candidate` = the tool that would mechanize it.
const CLASSES = [
  { key: 'canon', re: /\bRa\b|Law of One|citation|SIGReg|LeJEPA|Yang|Pythagorean|just intonation|spiral|cross-wired|attracted|Logos|violet/i, mech: [], pinned: [], llm: ['canon mirror (C33)'], candidate: 'source-citation checker (fetch + compare each cited passage)' },
  { key: 'evidence / provenance', re: /hardcoded|modeled|measured|provenance|prototype|unverif|benchmark|not in (the )?repo|external/i, mech: [], pinned: [], llm: ['fresh reader', 'Opus pass'], candidate: 'evidence linker (every "verified/benchmarked" claim must point to a runnable file)' },
  { key: 'units', re: /\bunits?\b|GPa|MPa|rad\/s|N\/W|dimension|\bkJ\b|\batm\b|\bPa\b|float32|Float32/i, mech: [], pinned: ['gap map: unit *present*'], llm: ['fresh reader', 'Sonnet'], candidate: 'units engine (SI dimension propagation through formulas)' },
  { key: 'sign / logic inversion', re: /sign|invert|min\/max|\bmax\b|true|false|flip|fail(s|ed)? open|only (ever )?(rise|fall|increase|decrease)|never (fall|decay)|can only|monoton/i, mech: ['gap map: one-way quantities'], pinned: ['semantic S8 (KL sign)'], llm: ['why= teleology', 'Sonnet'], candidate: 'sign & monotonicity probe (why= turned into numeric directions)' },
  { key: 'inverse / round-trip', re: /inverse|round.?trip|bijecti|parse|format|CRC|hex/i, mech: ['v9 fuzz (reference code only)'], pinned: ['semantic S4 (CRC)'], llm: ['fresh reader', 'blind regrow'], candidate: 'round-trip tester over the plan\'s stated inverses' },
  { key: 'guards / domain', re: /divid|denominator|floor|guard|NaN|0\/0|clamp|unclamp|\bln\b|log of|domain|empty craft/i, mech: ['v9 fuzz (reference code only)'], pinned: [], llm: ['all readers'], candidate: 'counterexample search over formula inputs' },
  { key: 'boundaries / thresholds', re: /threshold|boundary|exactly|discontinu|\bGB\b|VRAM|safeG|oscillat|aspectRatio/i, mech: [], pinned: ['semantic S10 (VRAM)'], llm: ['all readers'], candidate: 'boundary scanner (x = a and a ± ε for every threshold)' },
  { key: 'counts / arithmetic', re: /count|\bsum\b|total|ledger|recount|enumerat|arithmetic|factori|span|light-year|seed|collision|10,240|2\.51|9 arms|twenty|pillars/i, mech: [], pinned: ['semantic S1, S2, S5, S6, S7'], llm: ['all readers'], candidate: 'number extractor + recompute (every stated count, sum and product)' },
  { key: 'conservation / energy', re: /conservation|energy|source|sink|\+30 J|joule|ambient|E_vent|strain/i, mech: ['gap map: one-way quantities'], pinned: [], llm: ['Sonnet', 'blind regrow'], candidate: 'conservation ledger (magnitudes on every + / − arrow)' },
  { key: 'state machines', re: /hibernation|tier|stage|cycle|state machine|reset|life cycle/i, mech: [], pinned: [], llm: ['fresh reader'], candidate: 'state-machine model checker (stuck, unreachable, oscillating states)' },
  { key: 'seams / schema', re: /seam|field|schema|grammar|shorthand|mapping|cartridge|`ms`/i, mech: ['gap map: seams'], pinned: ['semantic S9'], llm: ['all readers'], candidate: 'producer/consumer schema differ (field-by-field)' },
  { key: 'order / homes / wiring', re: /wave|order|depend|home|tree|package|folder|call graph|caller|supplier|operator/i, mech: ['gap map: homes, waves, call graph', 'semantic S3'], pinned: [], llm: ['Sonnet'], candidate: '(covered) topological wave planner would derive waves automatically' },
  { key: 'structural missing links', re: /dual|persist|save|world|review|nesting|harvest|polarity|consent|free will|adversary|support|law set|star/i, mech: ['gap map'], pinned: [], llm: ['canon mirror', 'blind regrow'], candidate: '(covered by the gap map)' },
  { key: 'cross-artifact drift / wording', re: /contradict|wording|said|stale|ripple|heading|reads as|label/i, mech: [], pinned: ['semantic S11, S14'], llm: ['fresh diff reviewer'], candidate: 'cross-artifact constant clusterer (every number + context, all docs)' },
];
const other = { key: 'other', mech: [], pinned: [], llm: [], candidate: '' };
for (const r of rows) r.cls = (CLASSES.find(c => c.re.test(r.text)) ?? other).key;

const lines = ['# Method Mirror — which defect classes have a mechanical detector?', '', `Generated by \`scripts/method_mirror.mjs\` from the ${rows.length} register rows in Plan §8.1 (\`${rows[0]?.id}\`–\`${rows.at(-1)?.id}\`). Keyword classification, approximate.`, '', '| Class | Defects | Mechanical (whole class) | Gate guards only known instances | Caught by (LLM) | Tool that would mechanize it | Example |', '|---|---|---|---|---|---|---|'];
let unmech = 0;
for (const c of [...CLASSES, other]) {
  const hit = rows.filter(r => r.cls === c.key);
  if (!hit.length) continue;
  if (!c.mech.length) unmech += hit.length;
  lines.push(`| ${c.key} | ${hit.length} | ${c.mech.join('; ') || '**none**'} | ${c.pinned.join('; ') || '—'} | ${c.llm.join('; ') || '—'} | ${c.candidate || '—'} | \`${hit[0].id}\` ${hit[0].text.slice(0, 70).replace(/\|/g, '\\|')}… |`);
}
lines.push('', `**${unmech} of ${rows.length} defects (${Math.round(100 * unmech / rows.length)}%) are in classes with no mechanical detector**: today only an LLM reader (tokens, variable recall) catches them.`, '');
const report = lines.join('\n');
if (outFile) fs.writeFileSync(path.resolve(outFile), report);
console.log(report);
