#!/usr/bin/env node
// Privacy scan for the lines a change adds (bridge/PIPELINE_FRACTAL.md template F, as a script).
//
//   node bridge/tools/privacy_scan.mjs --range <base>..<head>   every commit's added lines + added file names
//   node bridge/tools/privacy_scan.mjs --diff-file <patch|->    a unified diff (git diff -U0 or git log -p -U0)
//   node bridge/tools/privacy_scan.mjs --files <file> ...       whole files
//   options: --repo <dir>  --extra <file>  --github  --json
//
// --extra is a local list of the owner's own private strings, one per line (never committed).
// Output never repeats a match in full (CI logs are public): file:line, the rule, and a masked excerpt.
// Exit 0 clean, 1 hits, 2 usage or git error. A scan is a net, not proof: read the diff too.
// This file is standalone on purpose: the workflow runs the base branch's copy, so a pull request
// cannot rewrite the checker that judges it. Patterns use [x] classes so the file does not match itself.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const NOT_NAME = '<>{}$%*\\u2026`\'"'; // a placeholder such as <name> or $USER after a home folder is not a real name

const REGEX_RULES = [
  { id: 'home-path', label: 'home or user-profile path',
    re: new RegExp(`[A-Za-z]:[\\\\/]+[U]sers[\\\\/]|[\\\\/][U]sers[\\\\/][^\\\\/\\s${NOT_NAME}]+|[\\\\/]home[\\\\/][^\\\\/\\s${NOT_NAME}]+|\\b[Aa]pp[Dd]ata\\b`, 'g') },
  { id: 'drive-path', label: 'local drive-letter path (write repository-relative paths)',
    re: /\b[A-Za-z]:[\\/]+[A-Za-z0-9_.$-]/g },
  { id: 'ip-address', label: 'IP address',
    re: new RegExp(`(?<![\\w.\\u00a7])(?:${OCTET}\\.){3}${OCTET}(?![\\w]|\\.\\d)`, 'g'),
    allow: (t) => /^(?:127\.\d+\.\d+\.\d+|0\.0\.0\.0)$/.test(t) },
  { id: 'ip-address', label: 'IPv6 or MAC address',
    re: /(?<![\w:])(?:[0-9A-Fa-f]{1,4}:){5,7}[0-9A-Fa-f]{1,4}(?![\w:])|\b[Ff][Ee]80::[0-9A-Fa-f:]*/g },
  { id: 'claude-link', label: 'claude.ai artifact, chat or session link',
    re: /claude\.ai\/(?:artifact|artifacts|chat|share|public|project|projects|code\/\S)/gi },
  { id: 'claude-link', label: 'session id',
    re: /\blocal_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\bsession_[0-9A-Za-z]{16,}\b/g },
  { id: 'drive-link', label: 'Google Docs or Drive link',
    re: /\b(?:docs|drive)\.google\.com\b/gi },
  { id: 'secret', label: 'key or token shape',
    re: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|\bgh[pousr]_[0-9A-Za-z]{20,}|\bgithub_pat_[0-9A-Za-z_]{20,}|\bAKIA[0-9A-Z]{12,}|\bxox[abprs]-[0-9A-Za-z-]{10,}|\bBearer [A-Za-z0-9._~+\/=-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g },
  { id: 'private-name', label: 'private project name',
    re: /C[a]pital[ _.-]?E[m]pire|\bC[E][ _.-]?[w]atch\b/gi },
];

const EMAIL_OK_FULL = /^(?:noreply@anthropic\.com|git@github\.com)$/i;
const EMAIL_OK_DOMAIN = /^(?:example\.(?:com|org|net)|users\.noreply\.github\.com|noreply\.github\.com)$/i;

// Linear scan around each '@' (a regex over a long unbroken line can go quadratic).
function emailMatches(line) {
  const out = [];
  let from = 0, at;
  while ((at = line.indexOf('@', from)) !== -1) {
    from = at + 1;
    let s = at;
    while (s > 0 && at - s < 64 && /[A-Za-z0-9._%+-]/.test(line[s - 1])) s--;
    if (s === at) continue;
    let e = at + 1;
    while (e < line.length && e - at < 256 && /[A-Za-z0-9.-]/.test(line[e])) e++;
    const domain = line.slice(at + 1, e).replace(/[.-]+$/, '');
    if (!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(domain)) continue;
    const text = line.slice(s, at + 1 + domain.length);
    if (EMAIL_OK_FULL.test(text) || EMAIL_OK_DOMAIN.test(domain)) continue;
    out.push({ index: s, text });
  }
  return out;
}

export function mask(text) {
  return text.length <= 3 ? `***(${text.length})` : `${text.slice(0, 2)}…(${text.length} chars)`;
}

const MAX_LINE = 20000; // a longer line is scanned in its first MAX_LINE characters (and is a smell)

// extra: lowercase literals from the owner's local list
export function scanLine(line, extra = []) {
  const hits = [];
  const text = line.length > MAX_LINE ? line.slice(0, MAX_LINE) : line;
  for (const rule of REGEX_RULES) {
    rule.re.lastIndex = 0;
    for (const m of text.matchAll(rule.re)) {
      if (rule.allow && rule.allow(m[0])) continue;
      hits.push({ rule: rule.id, label: rule.label, index: m.index, text: m[0] });
    }
  }
  if (text.includes('@')) {
    for (const m of emailMatches(text)) hits.push({ rule: 'email', label: 'email address', ...m });
  }
  if (extra.length) {
    const low = text.toLowerCase();
    for (const lit of extra) {
      const i = low.indexOf(lit);
      if (i !== -1) hits.push({ rule: 'local-list', label: 'string from the owner’s local private list', index: i, text: text.slice(i, i + lit.length) });
    }
  }
  // one string, one hit: where two rules cover the same characters, the earlier rule keeps it
  const kept = [];
  for (const h of hits) {
    if (!kept.some((k) => h.index < k.index + k.text.length && k.index < h.index + h.text.length)) kept.push(h);
  }
  return kept;
}

export function loadExtra(file) {
  if (!file) return [];
  return readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.toLowerCase());
}

// Walk the added lines of a unified diff made with -U0 (git diff or git log -p; commits marked by "\x01commit <sha>").
// Hunk line counts decide which lines are content, so an added line that reads "++ x" is not taken for a header.
// cb({ file, line, text, commit }) for each added line of a file that still exists.
export function forEachAddedLine(patch, cb) {
  let commit = null, file = null, line = 0, oldLeft = 0, newLeft = 0;
  for (const raw of patch.split('\n')) {
    const l = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (l.startsWith('\x01commit ')) { commit = l.slice(8).trim(); file = null; oldLeft = newLeft = 0; continue; }
    if (oldLeft > 0 && l.startsWith('-')) { oldLeft--; continue; }
    if (newLeft > 0 && l.startsWith('+')) {
      newLeft--;
      if (file) cb({ file, line, text: l.slice(1), commit });
      line++;
      continue;
    }
    if (l.startsWith('\\')) continue;
    oldLeft = newLeft = 0;
    if (l.startsWith('+++ ')) {
      const p = l.slice(4).replace(/\t.*$/, '');
      file = p === '/dev/null' ? null : p.replace(/^"?b\//, '').replace(/"$/, '');
    } else if (l.startsWith('@@')) {
      const m = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(l);
      if (m) { oldLeft = m[1] === undefined ? 1 : +m[1]; line = +m[2]; newLeft = m[3] === undefined ? 1 : +m[3]; }
    }
  }
}

export function scanDiffText(patch, extra = []) {
  const hits = [];
  forEachAddedLine(patch, ({ file, line, text, commit }) => {
    for (const h of scanLine(text, extra)) hits.push({ ...h, file, line, commit });
  });
  return hits;
}

function git(repo, args) {
  const r = spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 29 });
  if (r.error || r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || (r.error && r.error.message) || '').trim()}`);
  return r.stdout;
}

// range "<base>..<head>": every commit the head has beyond the base, and the names of the files it adds.
export function scanRange({ repo = '.', range, extra = [] }) {
  const m = /^(.+?)\.{2,3}(.+)$/.exec(range);
  if (!m) throw new Error(`range must look like base..head, got "${range}"`);
  const [, base, head] = m;
  const hits = scanDiffText(git(repo, ['log', '-p', '-U0', '--no-merges', '--no-color', '--format=%x01commit %H', `${base}..${head}`]), extra);
  const names = git(repo, ['diff', '--name-only', '-z', '--diff-filter=AMR', `${base}...${head}`]).split('\0').filter(Boolean);
  for (const n of names) for (const h of scanLine(n, extra)) hits.push({ ...h, file: n, line: 0, commit: null, inName: true });
  return { hits, files: names.length };
}

export function scanFiles(files, extra = []) {
  const hits = [];
  for (const f of files) {
    const buf = readFileSync(f);
    if (buf.includes(0)) continue;
    buf.toString('utf8').split(/\r?\n/).forEach((l, i) => {
      for (const h of scanLine(l, extra)) hits.push({ ...h, file: f, line: i + 1, commit: null });
    });
  }
  return hits;
}

export function formatHit(h) {
  const where = h.inName ? `${h.file} (file name)` : `${h.file ?? '?'}:${h.line}`;
  return `${where}  [${h.rule}] ${h.label}: ${mask(h.text)}${h.commit ? `  (commit ${h.commit.slice(0, 7)})` : ''}`;
}

export const ADVICE = 'A hit in an earlier commit is already public. Remove it, rewrite the branch (squash and force-push), and tell the owner if it was a key or token so it can be rotated.';

function main(argv) {
  const opt = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--range') opt.range = argv[++i];
    else if (a === '--diff-file') opt.diffFile = argv[++i];
    else if (a === '--repo') opt.repo = argv[++i];
    else if (a === '--extra') opt.extra = argv[++i];
    else if (a === '--github') opt.github = true;
    else if (a === '--json') opt.json = true;
    else if (a === '--files') { while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) opt.files.push(argv[++i]); }
    else { console.error(`unknown argument: ${a}`); return 2; }
  }
  let hits;
  try {
    const extra = loadExtra(opt.extra);
    if (opt.range) hits = scanRange({ repo: opt.repo || '.', range: opt.range, extra }).hits;
    else if (opt.diffFile) hits = scanDiffText(readFileSync(opt.diffFile === '-' ? 0 : opt.diffFile, 'utf8'), extra);
    else if (opt.files.length) hits = scanFiles(opt.files, extra);
    else { console.error('usage: privacy_scan.mjs --range base..head | --diff-file <patch|-> | --files <file>...'); return 2; }
  } catch (e) { console.error(`privacy_scan: ${e.message}`); return 2; }
  if (opt.json) console.log(JSON.stringify(hits.map((h) => ({ file: h.file, line: h.line, rule: h.rule, label: h.label, excerpt: mask(h.text), commit: h.commit })), null, 1));
  else for (const h of hits) console.log(formatHit(h));
  if (opt.github) for (const h of hits) console.log(`::error file=${h.file},line=${h.line || 1},title=Privacy scan::${h.label} (${h.rule})`);
  const nFiles = new Set(hits.map((h) => h.file)).size;
  console.log(hits.length ? `privacy_scan: ${hits.length} hit(s) in ${nFiles} file(s). ${ADVICE}` : 'privacy_scan: clean');
  return hits.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
