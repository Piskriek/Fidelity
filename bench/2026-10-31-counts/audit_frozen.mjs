#!/usr/bin/env node
/**
 * COUNT & IDENTITY AUDIT — stated numbers that must agree with each other (Method Mirror: "counts /
 * arithmetic" and "cross-artifact drift"; the constant clusterer).
 *
 * The formula spine tests named formulas; this tests the plain numbers around them. Generic rules,
 * no document constants:
 *   A arithmetic  : every numeric equality chain inside math (`2^{17}\text{ m} = 131,072\text{ m} = 256 \times 512\text{ m}`),
 *                   including a parenthetical restatement right after it (`= X ($Y$)`), evaluates equal.
 *   B repeats     : a counted noun ("22 Archetypes", "14-Zone", "32 tiles") carries one number everywhere in the
 *                   corpus. Labels ("Branch 7", "Tier 1"), key=value fields and history rows are not counts.
 *   C compounds   : "N zones (`7 Rays x L/R`)", "N zones `1..7:L|R`" → N = 7 × 2; "Capped at N slots: top a … + b" → N = a + b.
 *   D typed arrays: "`Uint32Array(128)`, 512 bytes" → 128 × 4; "X-4096 (`Uint32Array(128)`" → 128 × 32 bits.
 *   E percents    : an unsigned percentage is at most 100%, and a range a–b% runs low to high.
 *   F derived     : a number introduced as derived ("that is", "i.e.", "which is", "yields", "totals", "therefore", …)
 *                   equals a restatement, product, quotient, run sum or percentage of the numbers just before it.
 *   G table totals: a table row labelled Total/Sum equals the sum of the column above it.
 *   H partitions  : "N things: a X, b Y and c Z" → N = a + b + c; shares listed as "a% X, b% Y and c% Z" sum to 100%.
 *   I powers      : a number restated as `$2^{k}$` in the same clause equals 2^k.
 *
 * Usage: node scripts/count_identity_audit.mjs [triadDir] [--quiet]   (exit 1 on any finding)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const DIR = args.find(a => !a.startsWith('--')) ?? process.env.FIDELITY_TRIAD_DIR ?? ROOT;
const FILES = ['SQ_DISTORTION_CHECK_V9_SKILL.md', 'FIDELITY_COMPLETE_BRS_V2.md', 'ARGON_OPUS_MASTER_RESUME_V2.md'];
const docs = FILES.map(f => ({ name: f, text: fs.readFileSync(path.join(DIR, f), 'utf8') }));
const findings = [];
const flag = (rule, doc, at, msg) => findings.push({ rule, where: `${doc.name.slice(0, 4)}@${at}`, msg });

// Numbers: 131,072 / 131{,}072 / 3.5 / 42. `num` parses one.
const NUM = String.raw`\d{1,3}(?:(?:,|\{,\})\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const num = s => +String(s).replace(/\{,\}|,/g, '');
const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// History rows quote past (often wrong) values on purpose: ledger and register rows, pass bullets.
const HISTORY = /^(\| `B\d+`|\| \*\*Pass|\s*- \*\*Pass|\s+- `B\d+|\s*- `B\d+)/;
const lineStarts = t => { const s = [0]; for (let i = 0; i < t.length; i++) if (t[i] === '\n') s.push(i + 1); return s; };
const lineAt = (t, starts, i) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= i) lo = mid; else hi = mid - 1; } const a = starts[lo]; const b = t.indexOf('\n', a); return t.slice(a, b < 0 ? t.length : b); };
const inCode = t => { const spans = [...t.matchAll(/```[\s\S]*?```/g)].map(m => [m.index, m.index + m[0].length]); return i => spans.some(([a, b]) => i >= a && i < b); };
for (const doc of docs) { doc._starts = lineStarts(doc.text); doc._code = inCode(doc.text); }
const prep = doc => ({ t: doc.text, code: doc._code, hist: i => HISTORY.test(lineAt(doc.text, doc._starts, i)) });

// ---------- A: arithmetic chains inside math ----------
const evalSide = raw => {
  let s = raw.trim().replace(/\\text\{\s*([^{}]*)\}/g, ' $1').replace(/\\(?:,|;|quad|qquad)/g, ' ').replace(/\{,\}/g, ',').trim();
  const unit = (s.match(/\s([a-zA-Z/]+(?:\^\d)?)$/) ?? [])[1] ?? '';
  if (unit) s = s.slice(0, -unit.length).trim();
  if (!/\d/.test(s) || !/^[\d\s.,^{}()+\-*×]+$/.test(s.replace(/\\times|\\cdot/g, '*'))) return null;
  const expr = s.replace(/\\times|\\cdot|×/g, '*').replace(/(\d),(\d{3})/g, '$1$2').replace(/(\d+(?:\.\d+)?)\^\{?(-?\d+(?:\.\d+)?)\}?/g, '($1**$2)').replace(/[{}]/g, '');
  if (!/^[\d\s.()+\-*]+$/.test(expr)) return null;
  try { const v = Function(`"use strict"; return (${expr});`)(); return Number.isFinite(v) ? { v, unit, decimals: Math.max(0, ...[...s.matchAll(/\.(\d+)/g)].map(m => m[1].length)), raw: raw.trim() } : null; } catch { return null; }
};
const agree = (a, b) => { const d = Math.min(a.decimals || 99, b.decimals || 99); const tol = d < 99 ? 0.5 * 10 ** -d : 1e-9 * Math.max(1, Math.abs(a.v)); return Math.abs(a.v - b.v) <= tol && (a.unit === b.unit || !a.unit || !b.unit); };
for (const doc of docs) {
  const { t, code } = prep(doc);
  for (const m of t.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+)\$/g)) {
    if (code(m.index)) continue;
    const body = m[1] ?? m[2];
    const sides = []; let depth = 0, last = 0;
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c === '{' || c === '(') depth++; else if (c === '}' || c === ')') depth--;
      else if (depth === 0 && body.startsWith(' = ', i)) { sides.push(body.slice(last, i)); last = i + 3; }
    }
    sides.push(body.slice(last));
    const after = t.slice(m.index + m[0].length).match(/^\s*\(\$([^$\n]+)\$\)/);
    if (after) sides.push(after[1]);
    if (sides.length < 2) continue;
    const vals = sides.map(evalSide);
    for (let i = 1; i < vals.length; i++) {
      const [a, b] = [vals[i - 1], vals[i]];
      if (a && b && !agree(a, b)) flag('A arithmetic', doc, m.index, `${a.raw} = ${b.raw}, but ${a.v} ≠ ${b.v}`);
    }
  }
}

// ---------- B: one number per counted noun across the corpus ----------
const LABEL = /(?:Branch|Branches|Pass|Passes|Wave|Waves|Part|Parts|Tier|Stage|Step|Gate|Check|Checks|Station|Phase|Level|Lens|Screen|Rung|Session|Line|Row|Rows|Revision|Version|Section|Table|Figure|Q|P|R|B|C|S|F|W|T|G|v|V|#|§)\s*$/;
const STATUS = new Set(['open', 'closed', 'fixed', 'logged', 'more', 'planted', 'run', 'arm', 'pas', 'defect', 'mutant', 'site', 'hole', 'citation', 'token', 'minute', 'second', 'hour', 'day', 'year', 'tick', 'epoch', 'byte', 'bit', 'slot', 'specification', 'percent', 'time', 'other', 'new', 'each', 'per', 'step', 'item', 'word', 'line', 'character', 'char', 'page', 'finding', 'issue', 'error', 'change', 'edit']);
const FUNC = new Set(['of', 'in', 'per', 'each', 'and', 'or', 'to', 'with', 'at', 'for', 'from', 'by', 'that', 'which', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'on', 'into', 'as', 'than', 'over', 'under', 'across', 'between', 'after', 'before', 'during', 'within', 'without', 'plus', 'minus', 'times']);
const lemma = w => w.toLowerCase().replace(/ies$/, 'y').replace(/(ss)$/, '$1').replace(/(?<!s)s$/, '');
const counts = new Map();
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  for (const m of t.matchAll(new RegExp(`(?<![\\w.,^{\\/=:+\\-±$\\\\])(${NUM})(-| )([A-Za-z][A-Za-z\\-]*(?: [A-Za-z][A-Za-z\\-]*){0,3})`, 'g'))) {
    if (code(m.index) || hist(m.index)) continue;
    if (LABEL.test(t.slice(Math.max(0, m.index - 12), m.index))) continue;
    if (/\./.test(m[1])) continue;
    const n = num(m[1]);
    // Words after the number, markdown markup removed ("3-Phase **_Hades_** Taste" → Phase Hades Taste).
    const after = t.slice(m.index + m[1].length + 1, m.index + m[1].length + 80).replace(/[*_`]/g, '');
    const words = (after.match(/^[A-Za-z][A-Za-z-]*(?: [A-Za-z][A-Za-z-]*){0,4}/)?.[0] ?? '').split(' ');
    let run = [];
    if (m[2] === '-') run = [words[0]];
    else for (const w of words) { if (FUNC.has(w.toLowerCase())) break; run.push(w); }
    if (!run.length || !run[0]) continue;
    // Hyphen compounds name the thing by the following word ("3-Tier Voice") and only pair with other compounds;
    // spaced runs end at the noun ("12 functional groups"); "N cells each" / "per tile" mark a per-unit count.
    const noun = lemma(run[run.length - 1]);
    if (STATUS.has(noun) || noun.length < 3 || !/^[a-z]+$/.test(noun)) continue;
    const nextWord = (words[run.length] ?? '').toLowerCase();
    const per = nextWord === 'each' ? 'each' : nextWord === 'per' ? `per ${(words[run.length + 1] ?? '').toLowerCase()}` : '';
    const near = per || (m[2] === '-' ? `-${words[1] && !FUNC.has(words[1].toLowerCase()) ? lemma(words[1]) : ''}` : run.length > 1 ? lemma(run[run.length - 2]) : '');
    for (const key of [noun, near ? `${noun}~${near}` : null].filter(Boolean)) {
      if (!counts.has(key)) counts.set(key, []);
      counts.get(key).push({ n, doc, at: m.index, text: m[0].slice(0, 60), near });
    }
  }
}
for (const [key, list] of counts) {
  const by = new Map();
  for (const x of list) by.set(x.n, [...(by.get(x.n) ?? []), x]);
  if (by.size < 2) continue;
  const sorted = [...by].sort((a, b) => b[1].length - a[1].length);
  const [[maj, majList]] = sorted;
  const qualified = key.includes('~');
  // Bare nouns used with several real counts (several numbers each repeated) are left alone.
  if (!qualified && sorted.filter(([, l]) => l.length >= 2).length >= 2) continue;
  // Two lone mentions disagree: evidence only when a shared qualifier names the same thing ("6-Wave Engineering"
  // vs "7-Wave Engineering"). Two bare mentions ("256 rows" of a grid, "12 rows" of a table) are not.
  const pair = list.length === 2 && qualified;
  if (majList.length < 2 && !pair) continue;
  const majNears = new Set(majList.map(x => x.near));
  for (const [, l] of sorted.slice(1)) {
    if (!(l.length === 1 || (l.length === 2 && majList.length >= 4))) continue;
    for (const x of l) {
      if (!qualified && x.near && !majNears.has(x.near)) continue;
      flag('B repeats', x.doc, x.at, `"${x.text}" but "${key.replace('~', ' ')}" is ${maj} elsewhere (${majList.length}×)`);
    }
  }
}

// ---------- C: compound counts ----------
for (const doc of docs) {
  const { t, hist } = prep(doc);
  for (const m of t.matchAll(/(\d+) ([a-z]+) \(`?(\d+) [A-Za-z]+ [x×] ([A-Z](?:\/[A-Z])+)`?\)/g)) {
    if (hist(m.index)) continue;
    const want = +m[3] * m[4].split('/').length;
    if (+m[1] !== want) flag('C compound', doc, m.index, `${m[1]} ${m[2]} stated as ${m[3]} × ${m[4]} = ${want}`);
  }
  for (const m of t.matchAll(/(\d+) ([a-z]+) \**`?1\.\.(\d+):([A-Z](?:\|[A-Z])+)/g)) {
    if (hist(m.index)) continue;
    const want = +m[3] * m[4].split('|').length;
    if (+m[1] !== want) flag('C compound', doc, m.index, `${m[1]} ${m[2]} indexed as 1..${m[3]} × ${m[4]} = ${want}`);
  }
  for (const m of t.matchAll(/Capped at (\d+) ([a-z]+): top (\d+)\b[^()+\n]{0,40}\+ (\d+)\b/g)) {
    if (hist(m.index)) continue;
    if (+m[1] !== +m[3] + +m[4]) flag('C compound', doc, m.index, `capped at ${m[1]} ${m[2]} = top ${m[3]} + ${m[4]} = ${+m[3] + +m[4]}`);
  }
}

// ---------- D: typed-array sizes ----------
const BYTES = { Int8: 1, Uint8: 1, Int16: 2, Uint16: 2, Int32: 4, Uint32: 4, Float32: 4, Float64: 8, BigInt64: 8, BigUint64: 8 };
for (const doc of docs) {
  const { t, hist } = prep(doc);
  for (const m of t.matchAll(/(?:(\w+)-(\d+) \(\**)?`?(Int8|Uint8|Int16|Uint16|Int32|Uint32|Float32|Float64|BigInt64|BigUint64)Array\((\d+)\)`?\**,? (\d[\d,]*) bytes/g)) {
    if (hist(m.index)) continue;
    const bytes = +m[4] * BYTES[m[3]];
    if (bytes !== num(m[5])) flag('D typed array', doc, m.index, `${m[3]}Array(${m[4]}) is ${bytes} bytes, stated ${m[5]}`);
    if (m[2] && bytes * 8 !== +m[2]) flag('D typed array', doc, m.index, `${m[1]}-${m[2]} but ${m[3]}Array(${m[4]}) holds ${bytes * 8} bits`);
  }
}

// ---------- E: percentages ----------
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  for (const m of t.matchAll(/(?<![\w.+\-±≥≤<>~$])(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*%/g)) {
    if (code(m.index) || hist(m.index)) continue;
    if (/[+\-−±]\s?$/.test(t.slice(Math.max(0, m.index - 2), m.index))) continue;
    const lo = +m[1], hi = m[2] !== undefined ? +m[2] : null;
    if ((hi ?? lo) > 100) flag('E percent', doc, m.index, `${m[0]} exceeds 100%`);
    if (hi !== null && lo > hi) flag('E percent', doc, m.index, `range ${m[0]} runs high to low`);
  }
}

// ---------- F: derived numbers ----------
// Every number token in a paragraph, with its value (2^{k} evaluated; binary and decimal unit words scaled).
const SCALE_WORDS = { KiB: 2 ** 10, MiB: 2 ** 20, GiB: 2 ** 30, TiB: 2 ** 40, KB: 1e3, MB: 1e6, GB: 1e9, thousand: 1e3, million: 1e6, billion: 1e9 };
const tokens = para => {
  const out = [];
  for (const m of para.matchAll(new RegExp(`(?<![\\w.^{\\\\])(?:2\\^\\{?(\\d+)\\}?|(${NUM})(\\s*%)?(?:\\s*(KiB|MiB|GiB|TiB|KB|MB|GB|thousand|million|billion)\\b)?)`, 'g'))) {
    if (m[1] !== undefined) out.push({ v: 2 ** +m[1], at: m.index, end: m.index + m[0].length, raw: m[0], pow: true });
    else {
      // Skip identifiers and labels: B175, R30, v9, C1–C34, #12, 0x…, version-like a.b.c.
      const pre = para.slice(Math.max(0, m.index - 1), m.index);
      if (/[A-Za-z#_]/.test(pre)) continue;
      const v = num(m[2]) * (m[4] ? SCALE_WORDS[m[4]] : 1);
      out.push({ v: m[3] ? v / 100 : v, pct: !!m[3], at: m.index, end: m.index + m[0].length, raw: m[0], scaled: !!m[4], base: num(m[2]) });
    }
  }
  return out;
};
const CUE = /(?:\bthat is|\bi\.e\.,?|\bwhich is|\bwhich yields|\byields|\bgiving|\bgives|\btotals?|\btotalling|\bfor a total of|\btherefore|\bexactly|\bequals?|\bin total)\s*$/i;
const derivable = (target, prior) => {
  const vs = prior.map(p => p.v);
  const T = target.v;
  for (const a of vs) if (near(a, T)) return true;
  for (let i = 0; i < vs.length; i++) for (let j = 0; j < vs.length; j++) {
    if (i === j) continue;
    const [a, b] = [vs[i], vs[j]];
    if (near(a * b, T) || (b && near(a / b, T)) || near(a + b, T) || near(a - b, T)) return true;
    for (let k = j + 1; k < vs.length; k++) if (k !== i && near(a * b * vs[k], T)) return true;
  }
  for (let i = 0; i < vs.length; i++) { let s = 0; for (let j = i; j < vs.length; j++) { s += vs[j]; if (j > i && near(s, T)) return true; } }
  return false;
};
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  // Tokens of the whole document outside code and history; a derived number may draw on any of the
  // 15 numbers before it within 3,000 characters (its inputs are often a section or two earlier).
  const toks = tokens(t).filter(tk => !code(tk.at) && !hist(tk.at) && !/^\s*\|/.test(lineAt(t, doc._starts, tk.at)));
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    const lead = t.slice(Math.max(0, tk.at - 24), tk.at);
    if (!CUE.test(lead.replace(/[*_`$]/g, '').replace(/\s+/g, ' '))) continue;
    if (/(?:about|approximately|roughly|around|nearly|almost|~|≈)\s*\$?\s*$/i.test(lead)) continue;
    const tail = t.slice(tk.end, tk.end + 200);
    // The target is part of a larger expression ("i.e. 2^{63} \times 2^{17}"): not a single derived number.
    if (/^\s*(?:\\times|×|\*|\\cdot|\^)/.test(tail)) continue;
    // The target opens a breakdown ("9 runs, i.e. 6 arms … plus 3 arms"): check the sum it starts.
    const sentenceRest = tail.split(/(?<=[.;])\s/)[0];
    const addends = [...sentenceRest.matchAll(new RegExp(`(?:\\bplus|\\+|\\band)\\s+(${NUM})\\b`, 'g'))].map(x => num(x[1]));
    const prior = toks.slice(Math.max(0, i - 15), i).filter(p => tk.at - p.end <= 3000);
    // Only a number whose own paragraph holds inputs is checked; a lone restatement ("the inventory totals 48"
    // in a checklist) points at another document.
    const paraStart = Math.max(t.lastIndexOf('\n\n', tk.at), t.lastIndexOf('\n\r\n', tk.at));
    if (!prior.some(p => p.at > paraStart)) continue;
    const ok = derivable(tk, prior) || (tk.pct && derivable({ v: tk.v * 100 }, prior)) || (addends.length && derivable({ v: tk.v + addends.reduce((a, b) => a + b, 0) }, prior));
    if (!ok) flag('F derived', doc, tk.at, `"${t.slice(Math.max(0, tk.at - 24), tk.end).replace(/\s+/g, ' ')}" is introduced as derived, but no restatement, product, quotient, sum or share of the numbers before it gives ${tk.raw}`);
  }
}

// ---------- G: table total rows ----------
for (const doc of docs) {
  const { t, hist } = prep(doc);
  const lines = t.split('\n');
  let offset = 0, table = [];
  const flush = () => {
    const rows = table.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r.text));
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].text.split('|').slice(1, -1).map(c => c.replace(/[*_`]/g, '').trim());
      if (!/^(total|sum|all)\b/i.test(cells[0] ?? '')) continue;
      for (let c = 1; c < cells.length; c++) {
        if (!new RegExp(`^(?:${NUM})$`).test(cells[c])) continue;
        const above = rows.slice(1, r).map(x => x.text.split('|').slice(1, -1)[c]?.replace(/[*_`]/g, '').trim()).filter(x => new RegExp(`^(?:${NUM})$`).test(x ?? ''));
        if (above.length < 2) continue;
        const s = above.reduce((a, x) => a + num(x), 0);
        if (!near(s, num(cells[c]))) flag('G table total', doc, rows[r].at, `"${cells[0]}" row says ${cells[c]}, the column above sums to ${s}`);
      }
    }
    table = [];
  };
  for (const line of lines) {
    if (/^\s*\|/.test(line) && !hist(offset)) table.push({ text: line, at: offset }); else if (table.length) flush();
    offset += line.length + 1;
  }
  if (table.length) flush();
}

// ---------- H: enumerated partitions ----------
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  // "N things: a X, b Y and c Z" (or an em dash / parenthesis instead of the colon).
  const SEP = '(?:,\\s*and\\s+|,\\s*|\\s+and\\s+)';
  for (const m of t.matchAll(new RegExp(`(${NUM}) ([a-z][a-z-]+)(?: [a-z][a-z-]+)?(?::| —| \\()\\s*((?:(?:${NUM}) [A-Za-z][\\w-]*(?: [A-Za-z][\\w-]*)?${SEP})+(?:${NUM}) [A-Za-z][\\w-]*)`, 'g'))) {
    if (code(m.index) || hist(m.index)) continue;
    const parts = [...m[3].matchAll(new RegExp(`(${NUM}) [A-Za-z]`, 'g'))].map(x => num(x[1]));
    if (parts.length >= 2 && !near(parts.reduce((a, b) => a + b, 0), num(m[1]))) flag('H partition', doc, m.index, `${m[1]} ${m[2]} listed as ${parts.join(' + ')} = ${parts.reduce((a, b) => a + b, 0)}`);
  }
  // Shares: "a% X, b% Y and c% Z" — three or more percentages each naming a part.
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)% [a-z][\w-]*(?: [a-z][\w-]*)?(?:,\s*and\s+|,\s*|\s+and\s+)(?:(\d+(?:\.\d+)?)% [a-z][\w-]*(?: [a-z][\w-]*)?(?:,\s*and\s+|,\s*|\s+and\s+))*(\d+(?:\.\d+)?)% [a-z][\w-]*/g)) {
    if (code(m.index) || hist(m.index)) continue;
    const ps = [...m[0].matchAll(/(\d+(?:\.\d+)?)%/g)].map(x => +x[1]);
    if (ps.length >= 3 && !near(ps.reduce((a, b) => a + b, 0), 100)) flag('H partition', doc, m.index, `shares ${ps.join('% + ')}% sum to ${ps.reduce((a, b) => a + b, 0)}%, not 100%`);
  }
}

// ---------- I: powers of two restated ----------
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  for (const m of t.matchAll(new RegExp(`(?<![\\w.^{])(${NUM})(?![\\d.])([^\\d$\\n.;]{0,40})\\$2\\^\\{?(\\d+)\\}?\\$`, 'g'))) {
    if (code(m.index) || hist(m.index)) continue;
    if (!near(num(m[1]), 2 ** +m[3])) flag('I power', doc, m.index, `${m[1]} restated as 2^${m[3]} = ${2 ** +m[3]}`);
  }
}

// One finding per location.
const seenAt = new Set();
for (let i = findings.length - 1; i >= 0; i--) { const k = findings[i].where; if (seenAt.has(k)) findings.splice(i, 1); else seenAt.add(k); }
if (!quiet) for (const f of findings) console.log(`FAIL  ${f.rule}  ${f.where}  ${f.msg}`);
console.log(`\ncount/identity audit: ${findings.length ? `${findings.length} finding(s)` : 'all stated counts and identities agree'} (${counts.size} counted-noun keys checked)`);
process.exitCode = findings.length ? 1 : 0;
