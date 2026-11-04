#!/usr/bin/env node
// tools/council.mjs - Scaffolds and checks one round of the compassion loop run as councils
// (.agents/skills/compassion-loop/SKILL.md): ASK (builders) -> DECISION (opposers) -> CHANGE
// (STEER.md) -> NEWS BACK (LANDED.md). The loop is healthy when its rounds close.
//
//   node tools/council.mjs new <slug> --target "<one sentence>" [--date YYYY-MM-DD] [--dir <dir>]
//        [--builders "<lens>;<lens>"] [--opposers "<thesis>;<thesis>"] [--no-briefs]
//   node tools/council.mjs check <dir>          one round: what exists, what is missing, exit 1 when unhealthy
//   node tools/council.mjs check --all [--root docs/council]   every round, newest first, and the loop's health
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA = 'fidelity-council-round-v1';
export const WORD_LIMIT = 1500;
export const STEER_HEADINGS = ['## Vector', '## First step', '## Forbidden until verified', '## The check that settles it'];
export const LANDED_STATUSES = ['used', 'changed', 'nofit', 'pending'];
const HEALTHY_AGE_DAYS = 7;

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(here, '..', 'docs', 'council');

const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'voice';
const words = text => (text.match(/\S+/g) || []).length;
const read = file => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };

/** Parses the CLI. Throws on a bad command line. */
export function parseArgs(argv) {
  const opts = { command: argv[0], slug: null, target: '', date: new Date().toISOString().slice(0, 10), dir: null, builders: [], opposers: [], briefs: true, all: false, root: DEFAULT_ROOT };
  const rest = argv.slice(1);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const value = () => { const v = rest[++i]; if (v === undefined) throw new Error(`${a} needs a value`); return v; };
    if (a === '--target') opts.target = value();
    else if (a === '--date') { opts.date = value(); if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) throw new Error('--date must be YYYY-MM-DD'); }
    else if (a === '--dir') opts.dir = path.resolve(value());
    else if (a === '--root') opts.root = path.resolve(value());
    else if (a === '--builders') opts.builders = value().split(';').map(s => s.trim()).filter(Boolean);
    else if (a === '--opposers') opts.opposers = value().split(';').map(s => s.trim()).filter(Boolean);
    else if (a === '--no-briefs') opts.briefs = false;
    else if (a === '--all') opts.all = true;
    else if (a.startsWith('--')) throw new Error(`unknown flag: ${a}`);
    else if (opts.command === 'new' && opts.slug === null) opts.slug = a;
    else if (opts.command === 'check' && opts.dir === null) opts.dir = path.resolve(a);
    else throw new Error(`unexpected argument: ${a}`);
  }
  if (opts.command === 'new') {
    if (!opts.slug) throw new Error('new needs a <slug>');
    if (!opts.target) throw new Error('new needs --target "<one sentence>"');
    if (!opts.builders.length && !opts.opposers.length) throw new Error('new needs --builders and/or --opposers');
    if (!opts.dir) opts.dir = path.join(opts.root, `${opts.date}-${opts.slug}`);
  } else if (opts.command === 'check') {
    if (!opts.all && !opts.dir) throw new Error('check needs a <dir> or --all');
  } else throw new Error('command must be new or check');
  return opts;
}

const RULES = `Rules (the SQ Distortion Check skill applies, .agents/skills/sq-distortion-check/SKILL.md): read-only on the code;
write exactly one file, your report; cite file:line for every claim about the code; mark every claim about the game
client "from the code" or "needs in-game verification"; mark rules of thumb "general knowledge"; invent no API names,
measurements or results; no git, no network; at most ${WORD_LIMIT} words; a thesis paragraph, a ranked list, a closing table.`;

/** The brief text for one voice. */
export function briefFor(voice, round) {
  const ask = voice.side === 'builder';
  return `# Brief ${voice.id}: ${ask ? "builders' council (ASK)" : 'opposing council (DECISION)'}

Target of this round: ${round.target}

${ask ? `Your lens: ${voice.lens}.

Explore the bridges we COULD build here through that lens. Rank them by visible payoff per hour. For each: the claim,
the evidence (file:line, or what the repo lacks), the effort, the risk, the first concrete step (which file and
function changes, and the test that would check it), and what would prove it works. Say what does not help.`
: `Thesis to defend: ${voice.lens}

Attack the bridges we HAVE built, as hard as the evidence allows, with numbered attacks ranked by how fatal they are;
each with its evidence (file:line) and the check that would settle it. Then concede exactly what the evidence forces:
what is salvageable, and the minimal honest version.`}

Read first: RESUME.md (the top sections), the files the target names, and the skill at
.agents/skills/sq-distortion-check/SKILL.md.

${RULES}

Output: write exactly one file, ${voice.report}. Reply with a 10-line summary of your ranking when done.
`;
}

/** Creates the round directory, ROUND.json, the briefs and the README. Returns the round. */
export function newRound(opts) {
  const voices = [];
  opts.builders.forEach((lens, i) => voices.push({ id: `B${i + 1}`, side: 'builder', lens, report: `B${i + 1}-${slugify(lens)}.md` }));
  opts.opposers.forEach((lens, i) => voices.push({ id: `O${i + 1}`, side: 'opposer', lens, report: `O${i + 1}-${slugify(lens)}.md` }));
  const round = { schema: SCHEMA, date: opts.date, slug: opts.slug, target: opts.target, created_at: new Date().toISOString(), voices };
  fs.mkdirSync(opts.dir, { recursive: true });
  const roundFile = path.join(opts.dir, 'ROUND.json');
  if (fs.existsSync(roundFile)) throw new Error(`${roundFile} exists; a round is scaffolded once`);
  fs.writeFileSync(roundFile, `${JSON.stringify(round, null, 2)}\n`);
  if (opts.briefs) for (const v of voices) fs.writeFileSync(path.join(opts.dir, `BRIEF-${v.id}.md`), briefFor(v, round));
  const lines = [`# Council round ${opts.date}: ${opts.slug}`, '', `Target: ${opts.target}`, '', '| Voice | Side | Lens or thesis | Report |', '| :--- | :--- | :--- | :--- |',
    ...voices.map(v => `| ${v.id} | ${v.side} | ${v.lens} | \`${v.report}\` |`), '',
    'Then `STEER.md` (the vector, the first step, what is forbidden until verified, the check that settles it) and `LANDED.md` (the news back: used, changed or nofit, with evidence).',
    '', '`node tools/council.mjs check <this dir>` reports the round\'s health.', ''];
  fs.writeFileSync(path.join(opts.dir, 'README.md'), lines.join('\n'));
  return round;
}

/** Checks one round directory. Returns { healthy, steps: {ask, decision, change, newsBack}, problems, warnings, round, status }. */
export function checkRound(dir) {
  const problems = [], warnings = [];
  const roundText = read(path.join(dir, 'ROUND.json'));
  let round = null;
  try { round = roundText && JSON.parse(roundText); } catch { problems.push('ROUND.json is not JSON'); }
  if (!round || round.schema !== SCHEMA) { problems.push(`no ${SCHEMA} ROUND.json`); return { healthy: false, steps: {}, problems, warnings, round: null, status: null }; }
  const reported = side => (round.voices || []).filter(v => v.side === side).map(v => {
    const text = read(path.join(dir, v.report));
    if (text === null) { problems.push(`${v.id}: report ${v.report} missing`); return false; }
    if (!/^#{1,3}\s/m.test(text) || !/^\|/m.test(text)) problems.push(`${v.id}: ${v.report} lacks a heading or a closing table`);
    const n = words(text);
    if (n > WORD_LIMIT) warnings.push(`${v.id}: ${v.report} is ${n} words (limit ${WORD_LIMIT})`);
    return true;
  });
  const builders = reported('builder'), opposers = reported('opposer');
  const ask = builders.length > 0 && builders.every(Boolean);
  const decision = opposers.length > 0 && opposers.every(Boolean);
  if (!builders.length) problems.push('no builder voices (ASK)');
  if (!opposers.length) problems.push('no opposer voices (DECISION)');
  const steer = read(path.join(dir, 'STEER.md'));
  const change = !!steer && STEER_HEADINGS.every(h => steer.includes(h));
  if (!steer) problems.push('STEER.md missing (CHANGE)');
  else for (const h of STEER_HEADINGS) if (!steer.includes(h)) problems.push(`STEER.md lacks "${h}"`);
  const landed = read(path.join(dir, 'LANDED.md'));
  let status = null;
  if (!landed) problems.push('LANDED.md missing (NEWS BACK)');
  else {
    const m = /^Status:\s*(\w+)/m.exec(landed);
    status = m ? m[1].toLowerCase() : null;
    if (!landed.includes('## News back')) problems.push('LANDED.md lacks "## News back"');
    if (!status || !LANDED_STATUSES.includes(status)) problems.push(`LANDED.md needs "Status: ${LANDED_STATUSES.join('|')}"`);
    else if (status === 'pending') warnings.push('LANDED.md is pending: the news is not back yet');
  }
  const newsBack = !!landed && !!status && status !== 'pending' && LANDED_STATUSES.includes(status);
  const healthy = ask && decision && change && newsBack;
  return { healthy, steps: { ask, decision, change, newsBack }, problems, warnings, round, status };
}

/** Every round under root (directories holding a ROUND.json), newest date first. */
export function listRounds(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).map(name => path.join(root, name)).filter(d => fs.existsSync(path.join(d, 'ROUND.json')))
    .map(d => ({ dir: d, round: JSON.parse(fs.readFileSync(path.join(d, 'ROUND.json'), 'utf8')) }))
    .sort((a, b) => (b.round.date || '').localeCompare(a.round.date || ''));
}

/** The loop's health across rounds: healthy when the newest round is closed or younger than HEALTHY_AGE_DAYS. */
export function loopHealth(root, today = new Date()) {
  const rounds = listRounds(root).map(r => ({ ...r, check: checkRound(r.dir) }));
  if (!rounds.length) return { healthy: false, reason: 'no rounds yet', rounds };
  const newest = rounds[0];
  const age = Math.floor((today - new Date(`${newest.round.date}T00:00:00Z`)) / 86400000);
  if (newest.check.healthy) return { healthy: true, reason: `newest round ${newest.round.date}-${newest.round.slug} is closed (${newest.check.status})`, rounds, age };
  if (age <= HEALTHY_AGE_DAYS) return { healthy: true, reason: `newest round ${newest.round.date}-${newest.round.slug} is open, ${age} day(s) old (closes within ${HEALTHY_AGE_DAYS})`, rounds, age };
  return { healthy: false, reason: `newest round ${newest.round.date}-${newest.round.slug} has been open ${age} days: ${newest.check.problems.join('; ')}`, rounds, age };
}

const mark = ok => (ok ? 'ok' : 'MISSING');
function printRound(dir, c) {
  const name = c.round ? `${c.round.date}-${c.round.slug}` : path.basename(dir);
  console.log(`round ${name}: ${c.healthy ? 'HEALTHY (closed)' : 'open'}  ASK ${mark(c.steps.ask)} | DECISION ${mark(c.steps.decision)} | CHANGE ${mark(c.steps.change)} | NEWS BACK ${mark(c.steps.newsBack)}${c.status ? ` (${c.status})` : ''}`);
  for (const p of c.problems) console.log(`  - ${p}`);
  for (const w of c.warnings) console.log(`  ~ ${w}`);
}

export function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (err) { process.stderr.write(`council: ${err.message}\n`); return 2; }
  try {
    if (opts.command === 'new') {
      const round = newRound(opts);
      console.log(`council: round ${round.date}-${round.slug} scaffolded in ${opts.dir}: ${round.voices.length} voice(s)${opts.briefs ? ', briefs written' : ''}`);
      return 0;
    }
    if (opts.all) {
      const h = loopHealth(opts.root);
      for (const r of h.rounds) printRound(r.dir, r.check);
      console.log(`loop: ${h.healthy ? 'HEALTHY' : 'UNHEALTHY'}: ${h.reason}`);
      return h.healthy ? 0 : 1;
    }
    const c = checkRound(opts.dir);
    printRound(opts.dir, c);
    return c.healthy ? 0 : 1;
  } catch (err) { process.stderr.write(`council: ${err.message}\n`); return 1; }
}

if (process.argv[1] && process.argv[1].endsWith('council.mjs')) process.exitCode = main(process.argv.slice(2));
