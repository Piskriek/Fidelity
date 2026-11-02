#!/usr/bin/env node
// Sorts the paths a change touches into the groups the reviewer must read first (bridge/PR_LOOP.md).
// Nothing here fails a change: it says where a reader should look, because a pull request can edit the
// checkers, the instructions other agents read, or the files the engine auditor guards.
//
//   node bridge/tools/classify_paths.mjs --range <base>..<head> [--repo <dir>] [--github] [--json]
// Standalone on purpose (see privacy_scan.mjs).
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// The checkers: what judges a change. A change that edits these is judged by the version on the base branch.
const CHECKERS = [/^\.github\//, /^bridge\/tools\//, /^scripts\//];

// Owned by the manager (bridge/FRACTAL_ROLES.md): the triad, the instructions other agents read, the plans, the roster.
const MANAGER_OWNED_EXACT = new Set([
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'SQ_DISTORTION_CHECK_V9_SKILL.md', 'FIDELITY_COMPLETE_BRS_V2.md', 'ARGON_OPUS_MASTER_RESUME_V2.md',
  'bridge/HANDOFF.md', 'bridge/PLAN_FRACTAL.md', 'bridge/FRACTAL_ROLES.md', 'bridge/PIPELINE_FRACTAL.md',
]);
const MANAGER_OWNED_PREFIX = ['.claude/', '.claude-plugin/', '.codex-plugin/', '.agents/', 'skills/', 'bridge/roster/'];

// The engine auditor's locked files (bridge/roster/engine-auditor.md, item 1), as repository paths.
const LOCKED = [/^bridge\/world\//, /^bridge\/run\//, /^bridge\/test\//, /^bridge\/bridge\/tokens\.mjs$/, /^bridge\/preset\/valleys_v1\.json$/,
  /^bridge\/mind\/(?:nursery|live_v1a|live_y)\.mjs$/];

const CODE_EXT = /\.(?:mjs|cjs|js|ts|sh|ps1|bat|cmd|py)$/i;

const anyOf = (list, p) => list.some((re) => re.test(p));

export function classify(entries) {
  const out = { total: entries.length, checkers: [], managerOwned: [], bridgeCode: [], locked: [], deleted: [] };
  for (const { status, path } of entries) {
    if (status === 'D') out.deleted.push(path);
    if (anyOf(CHECKERS, path)) out.checkers.push(path);
    if (MANAGER_OWNED_EXACT.has(path) || MANAGER_OWNED_PREFIX.some((p) => path.startsWith(p))) out.managerOwned.push(path);
    const locked = anyOf(LOCKED, path);
    if (locked) out.locked.push(path);
    if (locked || (path.startsWith('bridge/') && !path.startsWith('bridge/tools/') && CODE_EXT.test(path))) out.bridgeCode.push(path);
  }
  out.engineAuditor = out.bridgeCode.length > 0;
  return out;
}

export function changedEntries(repo, base, head) {
  const r = spawnSync('git', ['-c', 'core.quotepath=off', 'diff', '--name-status', '-z', '--no-renames', `${base}...${head}`],
    { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error || r.status !== 0) throw new Error(`git diff failed: ${(r.stderr || (r.error && r.error.message) || '').trim()}`);
  const parts = r.stdout.split('\0').filter(Boolean);
  const entries = [];
  for (let i = 0; i + 1 < parts.length; i += 2) entries.push({ status: parts[i][0], path: parts[i + 1] });
  return entries;
}

const GROUPS = [
  ['checkers', 'edits the checkers (CI workflow, scripts, review tools); the base branch\'s copies judged it, read these first'],
  ['managerOwned', 'edits files the manager owns (triad, instructions for agents, plans, roster)'],
  ['locked', 'touches files the engine auditor guards (locked)'],
  ['deleted', 'deletes files'],
];

function main(argv) {
  let repo = '.', range = null, github = false, json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--range') range = argv[++i];
    else if (argv[i] === '--repo') repo = argv[++i];
    else if (argv[i] === '--github') github = true;
    else if (argv[i] === '--json') json = true;
    else { console.error(`unknown argument: ${argv[i]}`); return 2; }
  }
  const m = range && /^(.+?)\.{2,3}(.+)$/.exec(range);
  if (!m) { console.error('usage: classify_paths.mjs --range base..head'); return 2; }
  let c;
  try { c = classify(changedEntries(repo, m[1], m[2])); } catch (e) { console.error(`classify_paths: ${e.message}`); return 2; }
  if (json) { console.log(JSON.stringify(c, null, 1)); return 0; }
  console.log(`${c.total} file(s) changed; engine auditor needed: ${c.engineAuditor ? 'yes' : 'no'}`);
  for (const [key, text] of GROUPS) {
    if (!c[key].length) continue;
    console.log(`${text}:\n  ${c[key].slice(0, 20).join('\n  ')}${c[key].length > 20 ? `\n  ... and ${c[key].length - 20} more` : ''}`);
    if (github) console.log(`::warning title=Read first for the manager::This change ${text} (${c[key].length} file(s))`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
