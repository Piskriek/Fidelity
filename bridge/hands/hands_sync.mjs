// hands_sync.mjs - Mirrors Node 2's hands task file to this machine and pushes the laptop's results file back (bridge/hands/LAPTOP-HANDS.md).
// No dependencies. The laptop agent only reads the local mirror and writes laptop_results.json; this script moves the bytes and logs changes.
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getBridgeRoot } from '../../packages/triad-369/src/bridge_paths.mjs';

const SCHEMA = 'fidelity-hands-v1';
const REMOTE_TASKS = '/f/fidelity-llm/bridge/hands/laptop_tasks.json';
const REMOTE_RESULTS = '/f/fidelity-llm/bridge/hands/laptop_results.json';
const TIMEOUT_MS = 20000;
const MAX_BYTES = 4 * 1024 * 1024;
const USAGE = 'usage: node bridge/hands/hands_sync.mjs --role laptop [--interval 20] [--once] [--bridge-root <dir>] [--remote <user@host>] [--key <path>] [--transport ssh|file:<dir>]';
const VALUE_FLAGS = new Set(['--role', '--interval', '--bridge-root', '--remote', '--key', '--transport']);

/** Bad command line. The CLI prints it with the usage line and exits 2. */
export class UsageError extends Error {}

/** Parses the CLI arguments into options; defaults come from getBridgeRoot() and the environment. Throws UsageError. */
export function parseArgs(argv) {
  const opts = { role: null, interval: 20, once: false, bridgeRoot: getBridgeRoot(), remote: process.env.REMOTE_HOST || 'RAMPAGE@192.168.0.5', key: process.env.SSH_KEY || 'C:/Users/Pierro/.ssh/id_ed25519_fidelity', transport: 'ssh' };
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

/** The pull/push pair for a cycle: ssh to the remote (default), or a local directory for tests and dry runs. */
export function makeTransport(opts) {
  if (opts.transport.startsWith('file:')) {
    const dir = opts.transport.slice(5);
    return {
      pull: () => fs.promises.readFile(path.join(dir, 'laptop_tasks.json')),
      push: bytes => writeAtomic(path.join(dir, 'laptop_results.json'), bytes),
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
  return {
    pull: () => ssh(`cat ${REMOTE_TASKS}`),
    push: bytes => ssh(`cat > ${REMOTE_RESULTS}.tmp && mv ${REMOTE_RESULTS}.tmp ${REMOTE_RESULTS}`, bytes).then(() => undefined),
  };
}

/**
 * One cycle: pull the task file into the mirror when it changed, then push the results file when its bytes changed.
 * Transport failures are logged, not thrown. Returns { pulled, pushed }.
 */
export async function runCycle(opts, { transport = makeTransport(opts), echo = line => console.log(line) } = {}) {
  const dir = path.join(opts.bridgeRoot, 'hands');
  const mirror = path.join(dir, 'laptop_tasks.json');
  const results = path.join(dir, 'laptop_results.json');
  const logFile = path.join(dir, 'hands.log');
  const hashFile = path.join(dir, '.last_push.sha256');
  await fs.promises.mkdir(dir, { recursive: true });
  const say = async msg => { const line = `${new Date().toISOString()} ${msg}`; await fs.promises.appendFile(logFile, `${line}\n`); echo(line); };
  // A failure that repeats every interval (an unreachable remote) is logged once, until the message changes.
  const sayUnlessRepeated = async msg => { const l = (await readText(logFile)).split(String.fromCharCode(10)); const last = (l[l.length - 1] ?? '').trimEnd(); if (!last.endsWith(` ${msg}`)) await say(msg); };

  // (a) pull the task file
  let bytes = null;
  try { bytes = await transport.pull(); } catch (err) { await sayUnlessRepeated(`pull failed: ${firstLine(err)}`); }
  if (bytes) {
    const doc = parseJson(bytes);
    if (!doc || doc.value?.schema !== SCHEMA) await sayUnlessRepeated('pull ignored: not a fidelity-hands-v1 file');
    else if (!(await sameBytes(mirror, bytes))) {
      await writeAtomic(mirror, bytes);
      const ids = (Array.isArray(doc.value.tasks) ? doc.value.tasks : []).filter(t => t?.status === 'requested' && t.id).map(t => String(t.id));
      await say(ids.length ? `tasks updated: ${ids.join(', ')}` : 'tasks updated: none requested');
    }
  }

  // (b) push the results file when its bytes differ from the last push
  let pushed = false;
  if (fs.existsSync(results)) {
    const out = await fs.promises.readFile(results);
    const hash = crypto.createHash('sha256').update(out).digest('hex');
    const last = await readText(hashFile);
    if (!parseJson(out)) {
      if (last !== `invalid:${hash}`) { await say('results not pushed: invalid JSON'); await fs.promises.writeFile(hashFile, `invalid:${hash}`); }
    } else if (last !== hash) {
      try {
        await transport.push(out);
        await fs.promises.writeFile(hashFile, hash);
        await say(`results pushed: ${out.length} bytes`);
        pushed = true;
      } catch (err) { await say(`push failed: ${firstLine(err)}`); }
    }
  }
  return { pulled: bytes !== null, pushed };
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
  const report = err => process.stderr.write(`hands_sync: ${firstLine(err)}\n`);
  if (opts.once) {
    try { return (await runCycle(opts, { transport })).pulled ? 0 : 1; } catch (err) { report(err); return 1; }
  }
  let busy = null;
  const tick = () => { if (!busy) busy = runCycle(opts, { transport }).catch(report).finally(() => { busy = null; }); };
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
