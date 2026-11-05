// upsert_task.mjs - Writes one hands task into a laptop_tasks.json without a shell heredoc.
// A heredoc once turned the \f and \t in these Windows paths into control characters (the shell
// halved the backslashes, then JavaScript read the escapes); this tool reads JSON and writes JSON.
//
//   node bridge/hands/upsert_task.mjs <source.json> [--task H005] [--file <laptop_tasks.json>] [--now]
//
// <source.json> is either a single task object or a whole fidelity-hands-v1 file (then --task picks
// the id, default: the first task). The task replaces the one with the same id in --file (default:
// bridge/hands/laptop_tasks.json) or is inserted at the front; --now stamps requested_at with the
// current time (a new request). updated_at is always stamped. The write is atomic and the result
// is re-read and checked for control characters before the old file is replaced.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = 'fidelity-hands-v1';

/** Parses the CLI. Throws on a bad command line. */
export function parseArgs(argv) {
  const opts = { source: null, task: null, file: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'laptop_tasks.json'), now: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--now') opts.now = true;
    else if (a === '--task' || a === '--file') { const v = argv[++i]; if (!v) throw new Error(`${a} needs a value`); opts[a.slice(2)] = a === '--file' ? path.resolve(v) : v; }
    else if (a.startsWith('--')) throw new Error(`unknown flag: ${a}`);
    else if (opts.source === null) opts.source = path.resolve(a);
    else throw new Error(`unexpected argument: ${a}`);
  }
  if (!opts.source) throw new Error('missing <source.json>');
  return opts;
}

/** The task to write, from a task object or a whole task file (by id, else the first task). */
export function pickTask(source, id) {
  const tasks = Array.isArray(source?.tasks) ? source.tasks : (source && typeof source === 'object' && source.id ? [source] : []);
  const task = id ? tasks.find(t => String(t?.id) === String(id)) : tasks[0];
  if (!task) throw new Error(id ? `no task ${id} in the source` : 'the source holds no task');
  for (const key of ['id', 'title', 'steps', 'report']) if (task[key] === undefined) throw new Error(`task is missing "${key}"`);
  if (!Array.isArray(task.steps) || !task.steps.every(s => typeof s === 'string')) throw new Error('task.steps must be an array of strings');
  return task;
}

/** Returns the new document: the task replaces its id's entry or goes first; stamps updated_at (and requested_at with --now). */
export function upsert(doc, task, { now = false, at = new Date().toISOString() } = {}) {
  if (doc?.schema !== SCHEMA) throw new Error(`the task file is not a ${SCHEMA} file`);
  const next = { ...task, status: 'requested' };
  if (now || !next.requested_at) next.requested_at = at;
  const tasks = (Array.isArray(doc.tasks) ? doc.tasks : []).filter(t => String(t?.id) !== String(task.id));
  tasks.unshift(next);
  tasks.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  return { ...doc, updated_at: at, tasks };
}

/** Every control character except newline in the text (there must be none in a task file). */
export function controlCharacters(text) {
  const bad = [];
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); if (c < 0x20 && c !== 0x0a) bad.push({ index: i, code: c }); }
  return bad;
}

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));

export function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (err) { process.stderr.write(`upsert_task: ${err.message}\n`); return 2; }
  try {
    const task = pickTask(readJson(opts.source), opts.task);
    const doc = upsert(readJson(opts.file), task, { now: opts.now });
    const text = `${JSON.stringify(doc, null, 2)}\n`;
    const bad = controlCharacters(text);
    if (bad.length) throw new Error(`refusing to write: ${bad.length} control character(s) in the result (first at index ${bad[0].index}, code ${bad[0].code})`);
    const tmp = `${opts.file}.tmp`;
    fs.writeFileSync(tmp, text);
    if (controlCharacters(fs.readFileSync(tmp, 'utf8')).length) throw new Error('refusing to replace: the written file differs from the text');
    fs.renameSync(tmp, opts.file);
    const written = doc.tasks.find(t => String(t.id) === String(task.id));
    process.stdout.write(`upsert_task: ${task.id} written to ${opts.file} (requested_at ${written.requested_at}, ${doc.tasks.length} task(s), ${text.length} chars, 0 control characters)\n`);
    return 0;
  } catch (err) { process.stderr.write(`upsert_task: ${err.message}\n`); return 1; }
}

if (process.argv[1] && process.argv[1].endsWith('upsert_task.mjs')) process.exitCode = main(process.argv.slice(2));
