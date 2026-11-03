// Held-out evaluation of a count/identity audit on a corpus written by an agent that never saw the audit.
// Mutates every number in the three files (integers ×2 and +1; decimals ×2 and +10%), runs the audit on each
// mutant, and scores catches against the corpus key: recall on bound numbers, flags on free numbers.
// Each catch is attributed to the rules that fired and marked "located" when a finding sits at the changed
// number (otherwise the audit noticed something changed but blamed other text).
// Usage: node bench/2026-10-31-counts/eval_heldout.mjs <audit.mjs> <corpusDir> [--out report.md]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [audit, corpus] = process.argv.slice(2);
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
const FILES = ['SQ_DISTORTION_CHECK_V9_SKILL.md', 'FIDELITY_COMPLETE_BRS_V2.md', 'ARGON_OPUS_MASTER_RESUME_V2.md'];
const key = JSON.parse(fs.readFileSync(path.join(corpus, 'key.json'), 'utf8'));
const texts = Object.fromEntries(FILES.map(f => [f, fs.readFileSync(path.join(corpus, f), 'utf8')]));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'counts-heldout-'));
const findingsOf = r => r.stdout.split('\n').filter(l => l.startsWith('FAIL')).map(l => { const m = l.match(/^FAIL\s+(\S)\S*.*?\s(\w{4})@(\d+)/); return m ? { rule: m[1], file: m[2], at: +m[3] } : null; }).filter(Boolean);
const run = () => spawnSync(process.execPath, [path.resolve(audit), dir], { encoding: 'utf8', timeout: 30000 });
const write = (f, t) => { for (const g of FILES) fs.writeFileSync(path.join(dir, g), g === f ? t : texts[g]); };

write(null, null);
const clean = run();
const bound = key.filter(k => k.kind === 'bound');
const L = ['# Held-out evaluation: count & identity audit', '', `Audit: \`${path.basename(audit)}\`. Corpus: \`${path.basename(corpus)}\`, written by an agent that never saw the audit. Key entries: ${key.length} (${bound.length} bound, ${key.length - bound.length} free).`, ''];
L.push(`Clean corpus: ${clean.status === 0 ? 'passes (no false findings)' : 'FAILS — false findings:'}`);
if (clean.status !== 0) for (const l of clean.stdout.split('\n').filter(l => l.startsWith('FAIL'))) L.push(`- ${l}`);

// Locate each key snippet so a mutated site can be classified.
const labels = [];
for (const k of key) {
  const t = texts[k.file]; if (!t) continue;
  const i = t.indexOf(k.snippet); if (i < 0) continue;
  const j = k.snippet.indexOf(k.number);
  labels.push({ file: k.file, a: i + Math.max(0, j), b: i + (j >= 0 ? j + k.number.length : k.snippet.length), kind: k.kind, rule: k.rule, number: k.number });
}
const classify = (f, at) => labels.find(l => l.file === f && at >= l.a && at < l.b) ?? null;

const results = [];
const mutatedLabels = new Set();
for (const f of FILES) {
  const t = texts[f];
  // Integers (with thousands separators) and decimals, including those followed by %. Number words are not mutated.
  for (const m of t.matchAll(/(?<![\w.,^{\-])(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?![\d,}\w\-])(?!\.\d)/g)) {
    const isDec = !!m[2];
    const n = +(m[1].replace(/,/g, '') + (m[2] ?? ''));
    if (!Number.isFinite(n) || n === 0) continue;
    const lab = classify(f, m.index);
    if (lab) mutatedLabels.add(lab);
    const dec = isDec ? m[2].length - 1 : 0;
    const ops = isDec ? [['×2', (n * 2).toFixed(dec)], ['+10%', (n * 1.1).toFixed(dec)]] : [['×2', n * 2], ['+1', n + 1]];
    for (const [op, to] of ops) {
      if (String(to) === m[0].replace(/,/g, '')) continue;
      write(f, t.slice(0, m.index) + String(to) + t.slice(m.index + m[0].length));
      const r = run();
      const fs_ = findingsOf(r);
      // A finding is located when it sits in the changed file within one sentence of the changed number.
      const located = fs_.some(x => f.startsWith(x.file) && Math.abs(x.at - m.index) <= 120);
      results.push({ f, at: m.index, from: m[0], to, op, kind: lab?.kind ?? 'unlabelled', rule: lab?.rule, caught: r.status === 1, located, rules: [...new Set(fs_.map(x => x.rule))].join(''), crashed: r.status !== 0 && r.status !== 1 });
    }
  }
}
fs.rmSync(dir, { recursive: true, force: true });

const pct = (a, b) => (b ? `${a}/${b} (${Math.round((100 * a) / b)}%)` : '—');
L.push('', '| Numbers | Mutants | Caught | Caught at the changed number |', '|---|---|---|---|');
for (const kind of ['bound', 'free', 'unlabelled']) for (const op of ['×2', '+1', '+10%']) {
  const rs = results.filter(r => r.kind === kind && r.op === op);
  if (rs.length) L.push(`| ${kind}, ${op} | ${rs.length} | ${pct(rs.filter(r => r.caught).length, rs.length)} | ${pct(rs.filter(r => r.caught && r.located).length, rs.length)} |`);
}
const unmutated = bound.filter(k => ![...mutatedLabels].some(l => l.file === k.file && l.number === k.number && l.kind === 'bound'));
L.push('', `Bound key entries never mutated (number words, or numbers inside identifiers): ${unmutated.length} of ${bound.length}${unmutated.length ? ` — ${unmutated.map(k => `"${k.number}"`).join(', ')}` : ''}.`);
const bc = results.filter(r => r.kind === 'bound' && r.caught);
const byRule = {};
for (const r of bc) byRule[r.rules] = (byRule[r.rules] ?? 0) + 1;
L.push('', `Bound catches by the rules that fired (letters as in the audit header): ${Object.entries(byRule).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'}.`);
L.push('', `Crashes: ${results.filter(r => r.crashed).length}.`, '', '## Bound numbers the audit missed', '', '| File | Change | Must agree with |', '|---|---|---|');
for (const r of results.filter(r => r.kind === 'bound' && !r.caught)) L.push(`| ${r.f.slice(0, 4)} | ${r.from} → ${r.to} (${r.op}) | ${r.rule ?? ''} |`);
L.push('', '## Bound numbers caught, with the rules that fired', '', '| File | Change | Rules | At the changed number |', '|---|---|---|---|');
for (const r of bc) L.push(`| ${r.f.slice(0, 4)} | ${r.from} → ${r.to} (${r.op}) | ${r.rules} | ${r.located ? 'yes' : 'no'} |`);
L.push('', '## Free numbers the audit flagged', '', '| File | Change | Rules |', '|---|---|---|');
for (const r of results.filter(r => r.kind === 'free' && r.caught)) L.push(`| ${r.f.slice(0, 4)} | ${r.from} → ${r.to} (${r.op}) | ${r.rules} |`);
const report = L.join('\n') + '\n';
if (out) fs.writeFileSync(out, report);
console.log(report);
