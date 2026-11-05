// hands_sync.mjs - Mirrors Node 2's hands task file to this machine and pushes the laptop's results file back (bridge/hands/LAPTOP-HANDS.md).
// No dependencies. The laptop agent only reads the local mirror and writes laptop_results.json; this script moves the bytes and logs changes.
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getBridgeRoot } from '../../packages/triad-369/src/bridge_paths.mjs';

const SCHEMA = 'fidelity-hands-v1';
const HEARTBEAT_SCHEMA = 'fidelity-hands-heartbeat-v1';
const REMOTE_DIR = '/f/fidelity-llm/bridge/hands';
const TIMEOUT_MS = 20000;
const MAX_BYTES = 4 * 1024 * 1024;
const USAGE = 'usage: node bridge/hands/hands_sync.mjs --role laptop [--interval 20] [--heartbeat 300] [--once] [--bridge-root <dir>] [--remote <user@host>] [--key <path>] [--transport ssh|file:<dir>]';
const VALUE_FLAGS = new Set(['--role', '--interval', '--heartbeat', '--bridge-root', '--remote', '--key', '--transport']);
const REDACTED = '[REDACTED]';

/** Bad command line. The CLI prints it with the usage line and exits 2. */
export class UsageError extends Error {}

/** Parses the CLI arguments into options; defaults come from getBridgeRoot() and the environment. Throws UsageError. */
export function parseArgs(argv) {
  const opts = { role: null, interval: 20, heartbeat: 300, once: false, bridgeRoot: getBridgeRoot(), remote: process.env.REMOTE_HOST || 'RAMPAGE@192.168.0.5', key: process.env.SSH_KEY || 'C:/Users/Pierro/.ssh/id_ed25519_fidelity', transport: 'ssh' };
  for (let i = 0; i < argv.length; i++) {
    const m = /^(--[a-z-]+)(?:=(.*))?$/s.exec(argv[i]);
    if (!m) throw new UsageError(`unexpected argument: ${argv[i]}`);
    const [, name, inline] = m;
    if (name === '--once') { if (inline !== undefined) throw new UsageError('--once takes no value'); opts.once = true; continue; }
    if (!VALUE_FLAGS.has(name)) throw new UsageError(`unknown flag: ${name}`);
    const value = inline ?? argv[++i];
    if (!value) throw new UsageError(`${name} needs a value`);
    if (name === '--role') opts.role = value;
    else if (name === '--interval') { const n = Number(value); if (!Number.isFinite(n) || n <= 0) throw new UsageError('--interval must be a positive number of seconds'); opts.interval = n; }
    else if (name === '--heartbeat') { const n = Number(value); if (!Number.isFinite(n) || n < 0) throw new UsageError('--heartbeat must be a number of seconds (0 disables it)'); opts.heartbeat = n; }
    else if (name === '--bridge-root') opts.bridgeRoot = path.resolve(value);
    else if (name === '--remote') opts.remote = value;
    else if (name === '--key') opts.key = value;
    else opts.transport = value;
  }
  if (opts.role !== 'laptop') throw new UsageError(opts.role === null ? 'missing --role laptop' : `unknown role: ${opts.role}`);
  if (!(opts.transport === 'ssh' || (opts.transport.startsWith('file:') && opts.transport.length > 5))) throw new UsageError(`unknown transport: ${opts.transport}`);
  return opts;
}

/** First line of an error, for the log. */
function firstLine(err) { return String(err?.message ?? err).split(/\r?\n/)[0].trim(); }

/** Last non-empty stderr line of a failed ssh call (ssh prints warnings first), else the error's first line. */
function sshErrorLine(err, stderr) {
  if (err.killed) return `timed out after ${TIMEOUT_MS / 1000} s`;
  const lines = String(stderr ?? '').split(/\r?\n/).filter(l => l.trim());
  return (lines.length ? lines[lines.length - 1] : firstLine(err)).trim();
}

/** Atomic replace: write a sibling .tmp, then rename over the target. */
async function writeAtomic(file, bytes) { await fs.promises.writeFile(`${file}.tmp`, bytes); await fs.promises.rename(`${file}.tmp`, file); }

/** Parses bytes as JSON (a leading BOM is allowed). Returns { value } or null when they are not JSON. */
function parseJson(bytes) { try { return { value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) }; } catch { return null; } }

/** True when the file exists and holds exactly these bytes. */
async function sameBytes(file, bytes) { try { return (await fs.promises.readFile(file)).equals(bytes); } catch { return false; } }

/** Trimmed text of a small file, or '' when it is missing. */
async function readText(file) { try { return (await fs.promises.readFile(file, 'utf8')).trim(); } catch { return ''; } }

/** Pretty JSON bytes with a trailing newline, the form every pushed file takes. */
function jsonBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`); }

// Secret shapes masked before the results file leaves the laptop. Pairs go before tokens so a token behind a secret-named key counts once.
const PEM_BLOCK = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g;
const SECRET_NAME = /(token|secret|passw(?:or)?d|api[_-]?key|private[_-]?key)/i;
const SECRET_PAIR = /(["']?)([A-Za-z0-9_.-]*(?:token|secret|passw(?:or)?d|api[_-]?key|private[_-]?key)[A-Za-z0-9_.-]*)\1([ \t]*[=:][ \t]*)(?!["']?\[REDACTED\])(?:"([^"\n]+)"|'([^'\n]+)'|([^\s"',;&]+))/gi;
const SECRET_TOKEN = /\b(sk-or-v1-|sk-ant-|sk-proj-|sk-|AIza|ghp_|github_pat_|xox[baprs]-|AKIA)[A-Za-z0-9_-]{8,}/g;
// An HTTP bearer credential: the word stays, the token goes (council O2, 04 Nov: it passed through before).
const SECRET_BEARER = /\b(Bearer[ \t]+)(?!\[REDACTED\])[A-Za-z0-9._~+/=-]{12,}/g;

/**
 * Walks a parsed JSON value and masks, inside every string, PEM private key blocks, well-known API tokens (the prefix is kept),
 * and `name = value` / `name: value` pairs whose name says token, secret, password, api key or private key (the name is kept).
 * A property whose own key says so has its string value masked whole. Returns { value, count }: the redacted copy and the
 * number of replacements. Numbers, booleans and null pass through.
 */
export function redactSecrets(value) {
  let count = 0;
  const quote = (dq, sq) => (dq !== undefined ? '"' : sq !== undefined ? "'" : '');
  const mask = text => text
    .replace(PEM_BLOCK, () => { count++; return REDACTED; })
    .replace(SECRET_PAIR, (m, q, name, sep, dq, sq) => { count++; return `${q}${name}${q}${sep}${quote(dq, sq)}${REDACTED}${quote(dq, sq)}`; })
    .replace(SECRET_BEARER, (m, word) => { count++; return `${word}${REDACTED}`; })
    .replace(SECRET_TOKEN, (m, prefix) => { count++; return `${prefix}${REDACTED}`; });
  const field = (k, x) => (typeof x === 'string' && x && x !== REDACTED && SECRET_NAME.test(k) ? (count++, REDACTED) : walk(x));
  const walk = v => (typeof v === 'string' ? mask(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, field(k, x)])) : v);
  return { value: walk(value), count };
}

/** Each `git ...` invocation in a free-text step, from `git` to the next &&, ||, ;, |, newline or `git`. */
function gitCalls(text) {
  const calls = [];
  const re = /\bgit\s+/gi;
  for (let m; (m = re.exec(text));) {
    const rest = text.slice(m.index);
    const end = rest.slice(m[0].length).search(/\s*(?:&&|\|\||[;|\n])|\bgit\s/i);
    calls.push((end < 0 ? rest : rest.slice(0, m[0].length + end)).trim());
  }
  return calls;
}

/** True for the git forms LAPTOP-HANDS.md forbids: reset, clean, restore, checkout -f, stash drop, push --force, branch -D, pull/merge without --ff-only. */
function isForbiddenGit(call) {
  const t = call.split(/\s+/).map(w => w.replace(/[.,;:)]+$/, ''));
  let i = 1;
  while (i < t.length && t[i].startsWith('-')) i += t[i] === '-C' || t[i] === '-c' ? 2 : 1;
  const sub = (t[i] ?? '').toLowerCase();
  const args = t.slice(i + 1);
  const has = (...flags) => args.some(a => flags.includes(a));
  if (sub === 'reset' || sub === 'clean' || sub === 'restore') return true;
  if (sub === 'checkout') return has('-f', '--force');
  if (sub === 'stash') return args[0] === 'drop';
  // a push is forbidden when forced, mirrored, or aimed at main by any spelling (main, :main, +HEAD:main, refs/heads/main)
  if (sub === 'push') return has('-f', '--force', '--force-with-lease', '--force-if-includes', '--mirror') || args.some(a => a.startsWith('+') || /(^|:|\/)main$/.test(a));
  if (sub === 'branch') return has('-D') || (has('-d', '--delete') && has('-f', '--force'));
  if (sub === 'pull' || sub === 'merge') return !args.includes('--ff-only');
  return false;
}

/** Scans every task's `steps` strings of a parsed task file for forbidden git usages. Returns [{ id, step (1-based), text }]. */
export function forbiddenRepoSteps(doc) {
  const hits = [];
  for (const task of Array.isArray(doc?.tasks) ? doc.tasks : []) {
    (Array.isArray(task?.steps) ? task.steps : []).forEach((step, n) => {
      if (typeof step !== 'string') return;
      for (const call of gitCalls(step)) if (isForbiddenGit(call)) hits.push({ id: String(task.id ?? ''), step: n + 1, text: call.slice(0, 200) });
    });
  }
  return hits;
}

/** The pull/push/heartbeat trio for a cycle: ssh to the remote (default), or a local directory for tests and dry runs. */
export function makeTransport(opts) {
  if (opts.transport.startsWith('file:')) {
    const dir = opts.transport.slice(5);
    return {
      pull: () => fs.promises.readFile(path.join(dir, 'laptop_tasks.json')),
      push: bytes => writeAtomic(path.join(dir, 'laptop_results.json'), bytes),
      heartbeat: bytes => writeAtomic(path.join(dir, 'laptop_heartbeat.json'), bytes),
    };
  }
  const base = ['-i', opts.key, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=10'];
  const ssh = (command, stdin) => new Promise((resolve, reject) => {
    const child = execFile('ssh', [...base, opts.remote, command], { timeout: TIMEOUT_MS, maxBuffer: MAX_BYTES, encoding: 'buffer', windowsHide: true }, (err, stdout, stderr) => {
      if (err) reject(new Error(sshErrorLine(err, stderr))); else resolve(stdout);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(stdin);
  });
  // The remote login shell is a POSIX sh: write a sibling .tmp, then rename over the target (the same shape hands_gate.sh allows).
  const put = (name, bytes) => ssh(`cat > ${REMOTE_DIR}/${name}.tmp && mv ${REMOTE_DIR}/${name}.tmp ${REMOTE_DIR}/${name}`, bytes).then(() => undefined);
  return {
    pull: () => ssh(`cat ${REMOTE_DIR}/laptop_tasks.json`),
    push: bytes => put('laptop_results.json', bytes),
    heartbeat: bytes => put('laptop_heartbeat.json', bytes),
  };
}

/**
 * One cycle: pull the task file into the mirror when it changed, push the results file (secrets masked) when its bytes changed,
 * then push a heartbeat on the first cycle and whenever --heartbeat seconds have passed. Transport failures are logged, not thrown.
 * `state` is the loop's memory between cycles (last pull/push/heartbeat times, the last failure logged per kind); `now` is the clock. Returns { pulled, pushed }.
 */
export async function runCycle(opts, { transport = makeTransport(opts), echo = line => console.log(line), state = {}, now = Date.now } = {}) {
  const dir = path.join(opts.bridgeRoot, 'hands');
  const mirror = path.join(dir, 'laptop_tasks.json');
  const results = path.join(dir, 'laptop_results.json');
  const logFile = path.join(dir, 'hands.log');
  const hashFile = path.join(dir, '.last_push.sha256');
  await fs.promises.mkdir(dir, { recursive: true });
  const say = async msg => { const line = `${new Date().toISOString()} ${msg}`; await fs.promises.appendFile(logFile, `${line}\n`); echo(line); };
  // A failure that repeats every interval (an unreachable remote) is logged once per kind, until its message changes or that kind succeeds (null).
  const said = state.said ??= {};
  const sayOnChange = async (kind, msg) => { if (said[kind] !== msg) { said[kind] = msg; if (msg) await say(msg); } };
  const stamp = () => new Date(now()).toISOString();

  // (a) pull the task file
  let bytes = null;
  try { bytes = await transport.pull(); } catch (err) { await sayOnChange('pull', `pull failed: ${firstLine(err)}`); }
  if (bytes) {
    state.lastPullAt = stamp();
    const doc = parseJson(bytes);
    if (!doc || doc.value?.schema !== SCHEMA) await sayOnChange('pull', 'pull ignored: not a fidelity-hands-v1 file');
    else {
      await sayOnChange('pull', null);
      if (!(await sameBytes(mirror, bytes))) {
        await writeAtomic(mirror, bytes);
        const ids = (Array.isArray(doc.value.tasks) ? doc.value.tasks : []).filter(t => t?.status === 'requested' && t.id).map(t => String(t.id));
        await say(ids.length ? `tasks updated: ${ids.join(', ')}` : 'tasks updated: none requested');
        for (const hit of forbiddenRepoSteps(doc.value)) await say(`task ${hit.id} step ${hit.step} contains a forbidden repo command: ${hit.text}`);
      }
    }
  }

  // (b) push the results file when its bytes differ from the last push; what leaves is the redacted re-serialization, not the raw bytes
  let pushed = false;
  if (fs.existsSync(results)) {
    const out = await fs.promises.readFile(results);
    const hash = crypto.createHash('sha256').update(out).digest('hex');
    const last = await readText(hashFile);
    const doc = parseJson(out);
    if (!doc) {
      if (last !== `invalid:${hash}`) { await say('results not pushed: invalid JSON'); await fs.promises.writeFile(hashFile, `invalid:${hash}`); }
    } else if (last !== hash) {
      const { value, count } = redactSecrets(doc.value);
      const payload = jsonBytes(value);
      try {
        await transport.push(payload);
        await fs.promises.writeFile(hashFile, hash);
        state.lastPushAt = stamp();
        await sayOnChange('push', null);
        await say(`results pushed: ${payload.length} bytes${count ? ` (${count} secrets redacted)` : ''}`);
        pushed = true;
      } catch (err) { await sayOnChange('push', `push failed: ${firstLine(err)}`); }
    }
  }

  // (c) heartbeat: on the first cycle, then every --heartbeat seconds; a failed one is retried on the next cycle whose pull works
  const pullOk = bytes !== null;
  if (opts.heartbeat > 0 && (state.heartbeatAt === undefined || now() - state.heartbeatAt >= opts.heartbeat * 1000 || (said.heartbeat && pullOk))) {
    state.heartbeatAt = now();
    const beat = { schema: HEARTBEAT_SCHEMA, at: new Date(state.heartbeatAt).toISOString(), host: os.hostname(), interval: opts.interval, heartbeat: opts.heartbeat, lastPullOk: pullOk, lastPullAt: state.lastPullAt ?? null, lastPushAt: state.lastPushAt ?? null };
    try {
      await transport.heartbeat(jsonBytes(beat));
      if (said.heartbeat) await say('heartbeat recovered');
      said.heartbeat = null;
    } catch (err) { await sayOnChange('heartbeat', `heartbeat failed: ${firstLine(err)}`); }
  }
  return { pulled: pullOk, pushed };
}

/** Runs the CLI (one cycle with --once, else a cycle every interval seconds until SIGINT/SIGTERM). Returns the exit code. */
export async function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    process.stderr.write(`hands_sync: ${err.message}\n${USAGE}\n`);
    return 2;
  }
  const transport = makeTransport(opts);
  const state = {};
  const report = err => process.stderr.write(`hands_sync: ${firstLine(err)}\n`);
  if (opts.once) {
    try { return (await runCycle(opts, { transport, state })).pulled ? 0 : 1; } catch (err) { report(err); return 1; }
  }
  let busy = null;
  const tick = () => { if (!busy) busy = runCycle(opts, { transport, state }).catch(report).finally(() => { busy = null; }); };
  tick();
  const timer = setInterval(tick, opts.interval * 1000);
  await new Promise(resolve => {
    const stop = async () => { clearInterval(timer); await busy; resolve(); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('hands_sync.mjs')) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; });
}
