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
 * ADVISORY. A finding says two stated numbers disagree, not which one is wrong: check both before changing
 * either. Correct prose can trip these rules (unit conversions, a count of items followed by their sizes,
 * "which is" used for a default); mark such a line `<!-- counts:ok -->` (all rules) or `<!-- counts:ok B -->` (only the listed rules). CI runs this
 * audit without blocking. Measured in bench/2026-10-31-counts/REPORT.md.
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
// A line carrying `<!-- counts:ok -->` has been checked by a person and is skipped; `<!-- counts:ok B -->` skips
// only the listed rules, so the line's other numbers stay checked.
const flag = (rule, doc, at, msg) => {
  const ok = lineAt(doc.text, doc._starts, at).match(/counts:ok(?:\s+([A-I]+)\b)?/);
  if (!ok || (ok[1] && !ok[1].includes(rule[0]))) findings.push({ rule, where: `${doc.name.slice(0, 4)}@${at}`, msg });
};

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
  // Every thousands separator, including several in one number (3,145,728).
  const expr = s.replace(/\\times|\\cdot|×/g, '*').replace(/(?<=\d),(?=\d{3}(?!\d))/g, '').replace(/(\d+(?:\.\d+)?)\^\{?(-?\d+(?:\.\d+)?)\}?/g, '($1**$2)').replace(/[{}]/g, '');
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
      // Different units on the two sides is a conversion (1 km = 1000 m): out of scope.
      if (a && b && a.unit && b.unit && a.unit !== b.unit) continue;
      if (a && b && !agree(a, b)) flag('A arithmetic', doc, m.index, `${a.raw} = ${b.raw}, but ${a.v} ≠ ${b.v}`);
    }
  }
}

// ---------- B: one number per counted noun across the corpus ----------
const LABEL = /(?:Branch|Branches|Pass|Passes|Wave|Waves|Part|Parts|Tier|Stage|Step|Gate|Check|Checks|Station|Phase|Level|Lens|Screen|Rung|Session|Line|Row|Rows|Revision|Version|Section|Table|Figure|Q|P|R|B|C|S|F|W|T|G|v|V|#|§)\s*$/;
const STATUS = new Set(['open', 'closed', 'fixed', 'logged', 'more', 'planted', 'run', 'arm', 'pas', 'mutant', 'site', 'hole', 'citation', 'token', 'minute', 'second', 'hour', 'day', 'year', 'tick', 'epoch', 'byte', 'bit', 'slot', 'specification', 'percent', 'time', 'other', 'new', 'each', 'per', 'step', 'item', 'word', 'line', 'character', 'char', 'page', 'finding', 'issue', 'error', 'change', 'edit']);
const FUNC = new Set(['of', 'in', 'per', 'each', 'and', 'or', 'to', 'with', 'at', 'for', 'from', 'by', 'that', 'which', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'on', 'into', 'as', 'than', 'over', 'under', 'across', 'between', 'after', 'before', 'during', 'within', 'without', 'plus', 'minus', 'times']);
const lemma = w => w.toLowerCase().replace(/ies$/, 'y').replace(/(ss)$/, '$1').replace(/(?<!s)s$/, '');
const WORDNUM = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const NUMWORDS = Object.keys(WORDNUM).map(w => `[${w[0]}${w[0].toUpperCase()}]${w.slice(1)}`).join('|');
const counts = new Map();
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  // A count: digits or a number word (two–twelve; "one" is too common), optionally bold or in math, then a space
  // or a hyphen (plain, non-breaking or en dash), then words, also possibly bold.
  for (const m of t.matchAll(new RegExp(`(?<![\\w.,^{\\/=:+\\-±$\\\\])(?:\\*\\*|\\$)?(${NUM}|${NUMWORDS})(?:\\*\\*|\\$)?([-‑–]| )(?=\\**[A-Za-z])`, 'g'))) {
    if (code(m.index) || hist(m.index)) continue;
    if (LABEL.test(t.slice(Math.max(0, m.index - 12), m.index))) continue;
    if (/\./.test(m[1])) continue;
    const n = WORDNUM[m[1].toLowerCase()] ?? num(m[1]);
    if (n === 0) continue; // "0 defects" states an absence, not a count to restate.
    const sep = m[2] === ' ' ? ' ' : '-';
    // Words after the number, markdown markup removed ("3-Phase **_Hades_** Taste" → Phase Hades Taste).
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 80).replace(/[*_`]/g, '');
    const words = (after.match(/^[A-Za-z][A-Za-z-]*(?: [A-Za-z][A-Za-z-]*){0,4}/)?.[0] ?? '').split(' ');
    let run = [];
    if (sep === '-') run = [words[0]];
    else {
      // A count above one takes a plural noun: the run ends at the first plural word ("12 functional groups",
      // "22 Archetypes guide …", "480 robots today").
      for (const w of words) { if (FUNC.has(w.toLowerCase())) break; run.push(w); if (/[^s]s$/i.test(w)) break; }
      if (!/[^s]s$/i.test(run[run.length - 1] ?? '')) continue;
    }
    if (!run.length || !run[0]) continue;
    // A total is not a restatement of its parts ("12 robots … 12 robots … 24 robots in total").
    // Nor is a measurement ("16 tiles wide", "64 tiles across"): the noun is a unit there, not the thing counted.
    if (sep === ' ' && /^\s*(?:in total|total|altogether|combined|overall|wide|tall|across|long|high|deep|thick|apart|away)\b/i.test(after.slice(run.join(' ').length))) continue;
    // Hyphen compounds name the thing by the following word ("3-Tier Voice") and only pair with other compounds;
    // spaced runs end at the noun ("12 functional groups"); "N cells each" / "per tile" mark a per-unit count.
    const noun = lemma(run[run.length - 1]);
    if (STATUS.has(noun) || noun.length < 3 || !/^[a-z]+(?:-[a-z]+)*$/.test(noun)) continue;
    const nextWord = (words[run.length] ?? '').toLowerCase();
    const per = nextWord === 'each' ? 'each' : nextWord === 'per' ? `per ${(words[run.length + 1] ?? '').toLowerCase()}` : '';
    const near = per || (sep === '-' ? `-${words[1] && !FUNC.has(words[1].toLowerCase()) ? lemma(words[1]) : ''}` : run.length > 1 ? lemma(run[run.length - 2]) : '');
    for (const key of [noun, near ? `${noun}~${near}` : null].filter(Boolean)) {
      if (!counts.has(key)) counts.set(key, []);
      counts.get(key).push({ n, doc, at: m.index, text: (m[0] + after.split('\n')[0]).replace(/\s+/g, ' ').slice(0, 50).trim(), near });
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
  const where = x => `${x.doc.name.slice(0, 4)}@${x.at}`;
  for (const [, l] of sorted.slice(1)) {
    if (!(l.length === 1 || (l.length === 2 && majList.length >= 4))) continue;
    for (const x of l) {
      if (!qualified && x.near && !majNears.has(x.near)) continue;
      // Neutral wording: a one-against-one pair has no majority, and a minority can be the correct one.
      const others = majList.length === 1 ? `"${majList[0].text}" (${where(majList[0])})` : `${maj} in ${majList.length} other places`;
      flag('B repeats', x.doc, x.at, `"${x.text}" disagrees with ${others} for "${key.replace('~', ' ')}"; check which is right`);
    }
  }
}

// ---------- C: compound counts ----------
for (const doc of docs) {
  const { t, hist } = prep(doc);
  for (const m of t.matchAll(/(\d+) ([a-z]+) \(`?(\d+)(?: [A-Za-z]+)? [x×] ([A-Z](?:\/[A-Z])+)`?\)/g)) {
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
    // A name like "VSA-4096" states bits only when it is large enough to be a bit count ("UTF-8" is not).
    if (m[2] && +m[2] >= bytes * 2 && bytes * 8 !== +m[2]) flag('D typed array', doc, m.index, `${m[1]}-${m[2]} but ${m[3]}Array(${m[4]}) holds ${bytes * 8} bits`);
  }
}

// ---------- E: percentages ----------
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  for (const m of t.matchAll(/(?<![\w.+\-±≥≤<>~$])(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*%/g)) {
    if (code(m.index) || hist(m.index)) continue;
    if (/[+\-−±]\s?$/.test(t.slice(Math.max(0, m.index - 2), m.index))) continue;
    const lo = +m[1], hi = m[2] !== undefined ? +m[2] : null;
    // Ratios, not shares, can exceed 100%: zoom, CPU, growth, "200% of baseline".
    const next = t.slice(m.index + m[0].length, m.index + m[0].length + 24).replace(/[*_`]/g, '');
    const ratio = /^\s*(?:zoom|cpu|growth|increase|overhead|speed-?up|more|faster|slower|larger|bigger|scal\w*|of\b|over\b|above\b)/i.test(next);
    if ((hi ?? lo) > 100 && !ratio) flag('E percent', doc, m.index, `${m[0]} exceeds 100%`);
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
      // Skip identifiers and labels: B175, R30, v9, C1–C35, #12, 0x…, version-like a.b.c.
      const pre = para.slice(Math.max(0, m.index - 1), m.index);
      if (/[A-Za-z#_]/.test(pre)) continue;
      const v = num(m[2]) * (m[4] ? SCALE_WORDS[m[4]] : 1);
      out.push({ v: m[3] ? v / 100 : v, pct: !!m[3], at: m.index, end: m.index + m[0].length, raw: m[0], scaled: !!m[4], base: num(m[2]) });
    }
  }
  return out;
};
// "exactly" is not a cue: "exactly 4 wheels" states a value, it does not derive one.
const CUE = /(?:\bthat is|\bi\.e\.,?|\bwhich is|\bwhich yields|\byields|\bgiving|\bgives|\btotals?|\btotalling|\bfor a total of|\btherefore|\bequals?|\bin total)\s*$/i;
const unitWord = (t, end) => (t.slice(end, end + 16).match(/^\s*([A-Za-z]+)/) ?? [])[1]?.toLowerCase() ?? '';
// Unit families: a restatement between two different units of one family is a conversion.
const FAMILY = {};
for (const [fam, us] of Object.entries({ data: 'bit bits byte bytes kb kib mb mib gb gib tb tib scaled', time: 'ns us ms s sec secs second seconds min mins minute minutes h hr hrs hour hours day days week weeks year years', length: 'nm um mm cm m metre metres meter meters km kilometre kilometres kilometer kilometers in inch inches ft foot feet mi mile miles ly', mass: 'mg g gram grams kg kilogram kilograms t tonne tonnes' })) for (const u of us.split(' ')) FAMILY[u] = fam;
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
  // Sums of a run of consecutive numbers, and the mean of a run of three or more.
  for (let i = 0; i < vs.length; i++) { let s = 0; for (let j = i; j < vs.length; j++) { s += vs[j]; if (j > i && near(s, T)) return true; if (j - i >= 2 && near(s / (j - i + 1), T)) return true; } }
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
    // A restatement in another unit right after its source ("512 bytes, that is 4096 bits", "that is 4 KB") is a
    // conversion: out of scope.
    const prev = toks[i - 1];
    if (prev && tk.at - prev.end <= 30) { const [u1, u2] = [unitWord(t, prev.end), tk.scaled ? 'scaled' : unitWord(t, tk.end)]; if (FAMILY[u1] && FAMILY[u1] === FAMILY[u2] && lemma(u1) !== lemma(u2)) continue; }
    // A year or a date ("which is 2027 Q1") is not derived.
    if (!tk.pow && tk.v >= 1900 && tk.v <= 2199 && /^\s*(?:Q[1-4]|H[12]|AD|CE|BC|January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(tail)) continue;
    // "i.e." and "which is" (and a mid-sentence "that is") often introduce an example or a default; they count as a
    // derivation only when an input sits in the same sentence.
    const cueWord = (lead.match(CUE)?.[0] ?? '').trim().toLowerCase();
    const sentenceStart = Math.max(t.lastIndexOf('. ', tk.at), t.lastIndexOf('\n', tk.at));
    if (/^(?:i\.e\.|which is|that is)/.test(cueWord) && !/^\W*that is/i.test(t.slice(sentenceStart + 1, tk.at)) && !toks.slice(0, i).some(p => p.at > sentenceStart)) continue;
    const prior = toks.slice(Math.max(0, i - 15), i).filter(p => tk.at - p.end <= 3000);
    // Only a number whose own paragraph holds inputs is checked; a lone restatement ("the inventory totals 48"
    // in a checklist) points at another document.
    const paraStart = Math.max(t.lastIndexOf('\n\n', tk.at), t.lastIndexOf('\n\r\n', tk.at));
    if (!prior.some(p => p.at > paraStart)) continue;
    const ok = derivable(tk, prior) || (tk.pct && derivable({ v: tk.v * 100 }, prior)) || (addends.length && derivable({ v: tk.v + addends.reduce((a, b) => a + b, 0) }, prior));
    if (!ok) flag('F derived', doc, tk.at, `"${t.slice(Math.max(0, tk.at - 24), tk.end).replace(/\s+/g, ' ')}" reads as derived, but ${tk.raw} could not be reproduced from the numbers before it; check its inputs (or mark the line counts:ok if it is not derived)`);
  }
}

// ---------- G: table total rows ----------
for (const doc of docs) {
  const { t, hist } = prep(doc);
  const lines = t.split('\n');
  let offset = 0, table = [];
  const flush = () => {
    const rows = table.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r.text));
    const cellsOf = x => x.text.split('|').slice(1, -1).map(c => c.replace(/[*_`]/g, '').trim());
    const header = rows[0] ? cellsOf(rows[0]) : [];
    const isNum = x => new RegExp(`^(?:${NUM})$`).test(x ?? '');
    for (let r = 1; r < rows.length; r++) {
      const cells = cellsOf(rows[r]);
      if (!/^(total|sum)\b/i.test(cells[0] ?? '')) continue;
      for (let c = 1; c < cells.length; c++) {
        if (!isNum(cells[c])) continue;
        // Columns of maxima, minima, averages or rates do not add up.
        if (/max|min|avg|average|mean|median|peak|rate|%|per\b/i.test(header[c] ?? '')) continue;
        const above = rows.slice(1, r).map(x => ({ label: cellsOf(x)[0] ?? '', v: cellsOf(x)[c] })).filter(x => isNum(x.v));
        const parts = above.filter(x => !/subtotal/i.test(x.label)), subs = above.filter(x => /subtotal/i.test(x.label));
        if (parts.length < 2) continue;
        const s = parts.reduce((a, x) => a + num(x.v), 0), ss = subs.reduce((a, x) => a + num(x.v), 0);
        if (!near(s, num(cells[c])) && !(subs.length && near(ss, num(cells[c])))) flag('G table total', doc, rows[r].at, `"${cells[0]}" row says ${cells[c]}, the column above sums to ${s}`);
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
    // Parts are standalone numbers (not the 86 in "x86"). "3 layers: 64 neurons, 32 neurons and 16 neurons"
    // counts items and then gives their sizes: there N equals the number of parts, not their sum.
    const parts = [...m[3].matchAll(new RegExp(`(?<![\\w.])(${NUM}) [A-Za-z]`, 'g'))].map(x => num(x[1]));
    if (parts.length === num(m[1])) continue;
    if (parts.length >= 2 && !near(parts.reduce((a, b) => a + b, 0), num(m[1]))) flag('H partition', doc, m.index, `${m[1]} ${m[2]} listed as ${parts.join(' + ')} = ${parts.reduce((a, b) => a + b, 0)}`);
  }
  // Shares: "a% X, b% Y and c% Z" — three or more percentages each naming a part.
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)% [a-z][\w-]*(?: [a-z][\w-]*)?(?:,\s*and\s+|,\s*|\s+and\s+)(?:(\d+(?:\.\d+)?)% [a-z][\w-]*(?: [a-z][\w-]*)?(?:,\s*and\s+|,\s*|\s+and\s+))*(\d+(?:\.\d+)?)% [a-z][\w-]*/g)) {
    if (code(m.index) || hist(m.index)) continue;
    const ps = [...m[0].matchAll(/(\d+(?:\.\d+)?)%/g)].map(x => +x[1]);
    // Only a list that is nearly a whole is read as a split; "99% uptime, 95% hits and 90% coverage" is not one.
    const total = ps.reduce((a, b) => a + b, 0);
    if (ps.length >= 3 && total > 50 && total < 150 && !near(total, 100)) flag('H partition', doc, m.index, `shares ${ps.join('% + ')}% sum to ${ps.reduce((a, b) => a + b, 0)}%, not 100%`);
  }
}

// ---------- I: powers of two restated ----------
for (const doc of docs) {
  const { t, code, hist } = prep(doc);
  for (const m of t.matchAll(new RegExp(`(?<![\\w.^{])(${NUM})(?![\\d.])([^\\d$\\n.;]{0,40})\\$2\\^\\{?(\\d+)\\}?\\$`, 'g'))) {
    if (code(m.index) || hist(m.index)) continue;
    // A restatement is set off by a comma, parenthesis, "=", "or" or "i.e."; "8 sectors spans $2^{17}$" and
    // ", each $2^{4}$" describe something else.
    if (!/(?:,|\(|=|\bor|\bi\.e\.,?|\bthat is)\s*(?:[A-Za-z]+\s+){0,2}$/.test(m[2]) || /\b(?:each|per|spans?|of)\s*$/i.test(m[2])) continue;
    if (!near(num(m[1]), 2 ** +m[3])) flag('I power', doc, m.index, `${m[1]} restated as 2^${m[3]} = ${2 ** +m[3]}`);
  }
}

// One finding per location.
const seenAt = new Set();
for (let i = findings.length - 1; i >= 0; i--) { const k = findings[i].where; if (seenAt.has(k)) findings.splice(i, 1); else seenAt.add(k); }
if (!quiet) for (const f of findings) console.log(`FAIL  ${f.rule}  ${f.where}  ${f.msg}`);
console.log(`\ncount/identity audit: ${findings.length ? `${findings.length} finding(s)` : 'all stated counts and identities agree'} (${counts.size} counted-noun keys checked)`);
process.exitCode = findings.length ? 1 : 0;
