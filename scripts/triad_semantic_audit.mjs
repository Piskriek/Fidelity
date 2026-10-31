#!/usr/bin/env node
/**
 * TRIAD SEMANTIC AUDIT (companion to adversarial_red_team_v9_audit.mjs)
 *
 * The v9 suite fuzzes the reference operators well, but its document checks only test that
 * tokens are PRESENT ("74 / 74", "Checks C1–C26"). A plan whose ledger sums to 70, whose KL term
 * has a flipped sign, or whose weights sum to 1.10 still passes it with deltaBugs === 0.
 *
 * This script checks what the documents SAY: recounts, sums, identities, caps, thresholds and
 * cross-artifact agreement. Every check is pinned to a defect that was actually found, so it
 * doubles as a regression test (Bug-to-Skill closure, C17). It cannot find new kinds of defect:
 * that is still the job of a reasoning pass (SQ skill / Reduce skill).
 *
 * Usage: node scripts/triad_semantic_audit.mjs [triadDir]   (exit code 1 on any failure)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TRIAD_DIR = process.argv[2] ?? process.env.FIDELITY_TRIAD_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(TRIAD_DIR, name), 'utf8');
const skill = read('SQ_DISTORTION_CHECK_V9_SKILL.md');
const plan = read('FIDELITY_COMPLETE_BRS_V2.md');
const resume = read('ARGON_OPUS_MASTER_RESUME_V2.md');

const results = [];
function check(id, title, fn) {
  try {
    const { pass, detail } = fn();
    results.push({ id, title, pass, detail });
  } catch (err) {
    results.push({ id, title, pass: false, detail: `check crashed: ${err.message}` });
  }
}
const near = (a, b, rel = 0.02) => Math.abs(a - b) <= rel * Math.abs(b);
const sum = xs => xs.reduce((a, b) => a + b, 0);

function crc32Hex(text) {
  let crc = 0xFFFFFFFF;
  for (const b of Buffer.from(text, 'utf8')) { crc ^= b; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0); }
  return '0x' + ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

// S1 — Ledger: logged/closed/open totals agree across heading, table rows, both status lines, the
// highest B-id and the §8.1 register (found: heading 70 vs status 74, R24 row missing).
check('S1', 'Defect ledger totals agree across Plan and Resume', () => {
  const part8 = plan.slice(plan.indexOf('# PART 8'), plan.indexOf('# PART 9'));
  const table = part8.slice(0, part8.indexOf('## 8.1'));
  const register = part8.slice(part8.indexOf('## 8.1'));
  const head = part8.match(/(\d+) DEFECTS LOGGED — (\d+) CLOSED, (\d+) OPEN/);
  const statusRe = /(\d+) Defects Logged \(`#01–#(\d+)`, Passes R1–R\d+\): (\d+) Closed \/ (\d+) Open/;
  const ps = plan.match(statusRe), rs = resume.match(statusRe);
  const rowSum = sum([...table.matchAll(/\((\d+) defects?\)/g)].map(m => +m[1]));
  const maxB = Math.max(...[...plan.matchAll(/\bB(\d{2,3})\b/g)].map(m => +m[1]));
  const regIds = [...register.matchAll(/^\| `B(\d+)` \| \*\*(FIXED|OPEN)\*\*/gm)].map(m => ({ id: +m[1], st: m[2] }));
  const regOpen = regIds.filter(r => r.st === 'OPEN').length;
  const regContiguous = regIds.length > 0 && regIds.every((r, i) => r.id === regIds[0].id + i) && regIds.at(-1).id === maxB;
  const logged = { heading: +head?.[1], rowSum, plan: +ps?.[1], planRange: +ps?.[2], resume: +rs?.[1], resumeRange: +rs?.[2], maxB };
  const open = { heading: +head?.[3], plan: +ps?.[4], resume: +rs?.[4], register: regOpen };
  const closedOk = [[head?.[2], head?.[3]], [ps?.[3], ps?.[4]], [rs?.[3], rs?.[4]]].every(([c, o]) => +c + +o === logged.heading);
  const pass = new Set(Object.values(logged)).size === 1 && new Set(Object.values(open)).size === 1 && closedOk && regContiguous;
  return { pass, detail: JSON.stringify({ logged, open, closedPlusOpenOk: closedOk, registerContiguousToMaxB: regContiguous }) };
});

// S2 — Spider diagram sub-branch count matches its heading (found: claims 32, has 41).
check('S2', 'Spider diagram sub-branch count matches heading', () => {
  const claimed = +(plan.match(/(\d+) (?:Verified )?Sub-Branches/)?.[1] ?? NaN);
  const counted = new Set([...plan.matchAll(/[├└]── (\d)\.(\d+) /g)].map(m => `${m[1]}.${m[2]}`)).size;
  return { pass: claimed === counted, detail: `claimed ${claimed}, counted ${counted}` };
});

// S3 — Every @hm package the plan names has a home (tree folder or Package Home Map row) (found: 16 homeless).
check('S3', 'Every referenced @hm package has a home in the monorepo layout', () => {
  const referenced = new Set([...plan.matchAll(/@hm\/([a-z0-9-]+)/g)].map(m => m[1]));
  const tree = plan.slice(plan.indexOf('### 4.1'), plan.indexOf('### 4.2'));
  const homes = new Set([...tree.matchAll(/[├└]── ([a-z0-9-]+)\/\s/g)].map(m => m[1]));
  for (const m of plan.matchAll(/\| `@hm\/([a-z0-9-]+)` \| `packages\/[a-z0-9-]+/g)) homes.add(m[1]);
  const homeless = [...referenced].filter(p => !homes.has(p)).sort();
  return { pass: homeless.length === 0, detail: homeless.length ? `homeless: ${homeless.join(', ')}` : `${referenced.size} packages all housed` };
});

// S4 — Embedded @hm/shorthand blocks carry correct CRC32 tails (verified true on 2026-10-31).
check('S4', 'Shorthand CRC32 tails recompute', () => {
  const out = [];
  for (const [name, doc] of [['plan', plan], ['resume', resume]]) {
    const m = doc.match(/```\r?\n(m of=[\s\S]*?)\r?\n(#TAIL\|schema:hm:universe:v2\|crc32:(0x[0-9A-F]{8}))\r?\n```/);
    if (!m) { out.push(`${name}: block not found`); continue; }
    const body = m[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n');
    out.push(`${name}: ${crc32Hex(body) === m[3] ? 'ok' : `declared ${m[3]} computed ${crc32Hex(body)}`}`);
  }
  return { pass: out.every(x => x.endsWith('ok')), detail: out.join('; ') };
});

// S5 — Origin64 span claim matches 2^63 sectors x sector quantum (found: 9.75e7 ly is the old 100 km value).
check('S5', 'Origin64 light-year span matches BigInt64 x sector size', () => {
  const m = plan.match(/spans \$\\pm ([\d.]+) \\times 10\^\{?(\d+)\}?\\text\{ light-years\}\$/);
  const claimed = m ? +m[1] * 10 ** +m[2] : NaN;
  const actual = 2 ** 63 * 131072 / 9.4607304725808e15;
  return { pass: near(claimed, actual), detail: `claimed ${claimed.toExponential(3)} ly, actual ${actual.toExponential(3)} ly` };
});

// S6 — Arithmetic identities: 131,072 m = A x B m.
check('S6', 'Sector quantum factorisation is correct', () => {
  const bad = [...plan.matchAll(/131,072\\text\{ m\} = (\d+) \\times (\d+)\\text\{ m\}/g)].filter(m => +m[1] * +m[2] !== 131072).map(m => `${m[1]}x${m[2]}`);
  return { pass: bad.length === 0, detail: bad.length ? `wrong: ${bad.join(', ')}` : 'all factorisations = 131,072' };
});

// S7 — Convex weight sums equal 1 (daySatisfaction, taste total score).
check('S7', 'Weighted-sum coefficients sum to 1', () => {
  const day = plan.match(/daySatisfaction\}\(d\) = ([^$]+)\$\$/)?.[1] ?? '';
  const dayW = [...day.matchAll(/(\d\.\d+) \\cdot/g)].map(m => +m[1]);
  const taste = plan.match(/total score \$T = ([^$]+)\$/)?.[1] ?? '';
  const tasteW = [...taste.matchAll(/(\d\.\d+) S_/g)].map(m => +m[1]);
  const ok = w => w.length > 1 && Math.abs(sum(w) - 1) < 1e-9;
  return { pass: ok(dayW) && ok(tasteW), detail: `daySatisfaction ${sum(dayW).toFixed(2)}, taste ${sum(tasteW).toFixed(2)}` };
});

// S8 — Every KL precision term has the non-negative form x - ln x - 1.
check('S8', 'KL precision term keeps x - ln(x) - 1 form everywhere', () => {
  const terms = [...`${skill}\n${plan}`.matchAll(/\\frac\{\\Pi_i\}\{\\Pi_\{0,i\}\} ([+-]) \\ln/g)].map(m => m[1]);
  return { pass: terms.length >= 2 && terms.every(s => s === '-'), detail: `signs: ${terms.join(' ') || 'none found'}` };
});

// S9 — Example nem lines respect the resist cap declared by the grammar.
check('S9', 'Shorthand nem examples respect the resist cap', () => {
  const cap = +(plan.match(/resist=<elem:id>:<0\.\.([\d.]+)>/)?.[1] ?? NaN);
  const vals = [...`${plan}\n${resume}`.matchAll(/^nem .*resist=elem:[^:\s]+:([\d.]+)/gm)].map(m => +m[1]);
  return { pass: Number.isFinite(cap) && vals.length > 0 && vals.every(v => v <= cap), detail: `cap ${cap}, examples ${vals.join(', ')}` };
});

// S10 — VRAM governor tiers cover every value with no gap.
check('S10', 'VRAM tier thresholds are contiguous', () => {
  const ok = plan.includes('`<4GB -> Tier 1`, `<16GB -> Tier 2`, `>=16GB -> Tier 3`');
  return { pass: ok, detail: ok ? '<4 | <16 | >=16' : 'tier thresholds changed or leave a gap' };
});

// S11 — Syncope threshold agrees between Skill (C7) and Plan (Part 3).
check('S11', 'Autonomic syncope zone threshold agrees across Skill and Plan', () => {
  const s = skill.match(/when \$\\ge (\d+)\$ somatic zones hit `runaway`/)?.[1];
  const p = plan.match(/When \$\\ge (\d+)\$ zones hit `runaway`/)?.[1];
  return { pass: s !== undefined && s === p, detail: `skill ${s}, plan ${p}` };
});

// S12 — Recovery debt exponent is capped (2^min(6, n-1)), matching the 64-cycle debt ceiling.
check('S12', 'Recovery-debt doubling is capped', () => {
  const ok = /recovery debt \$2\^\{\\min\(6, n-1\)\}\$/.test(plan);
  return { pass: ok, detail: ok ? '2^min(6, n-1)' : 'cap missing from Part 6 debt formula' };
});

// S13 — The clean-slate CI gate cannot fail on the constitution itself (found: Plan contains every banned token).
check('S13', 'Clean-slate gate scope excludes the triad docs that name the banned tokens', () => {
  const banned = ['moon_crater', 'A4-01', '.glb'];
  const docsHit = banned.filter(t => plan.includes(t) || resume.includes(t));
  const scoped = /verify-clean-slate\.mjs[^\n]*(scans only|only scans)[^\n]*packages\/[^\n]*apps\//.test(plan);
  return { pass: docsHit.length === 0 || scoped, detail: scoped ? 'gate scope declared (packages/, apps/)' : `docs contain ${docsHit.join(', ')} and gate has no declared scope` };
});

// S14 — Check-range and defect-range labels agree across all three artifacts.
check('S14', 'Check range and ledger range agree across the triad', () => {
  // Historical ledger rows ("| **Pass R25 ...") keep the range that was current at the time.
  const current = d => d.split('\n').filter(l => !l.startsWith('| **Pass')).join('\n');
  const ranges = [skill, plan, resume].map(d => [...current(d).matchAll(/Checks C1[–-]C(\d+)/g)].map(m => +m[1]));
  const all = ranges.flat();
  const ledger = [plan, resume].map(d => [...d.matchAll(/`#01[–-]#(\d+)`/g)].map(m => +m[1])).flat();
  const ok = new Set(all).size === 1 && new Set(ledger).size <= 1;
  return { pass: ok, detail: `check ranges ${[...new Set(all)].join('/')}; ledger ranges ${[...new Set(ledger)].join('/')}` };
});

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.title}\n        ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} semantic checks pass` + (failed.length ? ` — failing: ${failed.map(r => r.id).join(', ')}` : ''));
process.exitCode = failed.length ? 1 : 0;
