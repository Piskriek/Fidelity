// evidence.mjs - Turns file reads and timed commands into timestamped evidence for the Triad Apex.
// Every live number or boolean the holon reports must come from one of these, or be labelled symbolic / not measured.
import fs from 'node:fs';

const round1 = value => Math.round(value * 10) / 10;
const ageSeconds = (at, now) => { const t = Date.parse(at); return Number.isFinite(t) ? round1((now - t) / 1000) : null; };

// The JSON timestamp when it is a valid date, else the file's mtime, else null.
function timestampOf(filePath, atField) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'))?.[atField];
    if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return value;
  } catch {}
  try { return fs.statSync(filePath).mtime.toISOString(); } catch { return null; }
}

/** Freshness of a JSON file: its atField timestamp, else its mtime. Never throws. */
export function fileEvidence(filePath, { now = Date.now(), freshMs, atField = 'at' } = {}) {
  const exists = fs.existsSync(filePath);
  const at = exists ? timestampOf(filePath, atField) : null;
  const age_seconds = at ? ageSeconds(at, now) : null;
  const fresh = exists && Number.isFinite(age_seconds) && age_seconds >= 0 && age_seconds <= freshMs / 1000;
  return { kind: 'measured', source: filePath, exists, at, age_seconds, fresh, fresh_within_seconds: freshMs / 1000 };
}

/** Result of one timed command. Fresh only when it succeeded recently. */
export function commandEvidence({ source, ok, started_at_ms, finished_at_ms, error = null, now = Date.now(), freshMs }) {
  const finished = Number.isFinite(finished_at_ms);
  const at = finished ? new Date(finished_at_ms).toISOString() : null;
  const latency_ms = finished && Number.isFinite(started_at_ms) ? finished_at_ms - started_at_ms : null;
  const age_seconds = finished ? round1((now - finished_at_ms) / 1000) : null;
  return { kind: 'measured', source, ok: Boolean(ok), at, latency_ms, age_seconds, fresh: Boolean(ok) && Number.isFinite(age_seconds) && age_seconds <= freshMs / 1000, error };
}

/** One directed flow of the 3/6/9 holon, with the evidence behind its active flag. */
export function flow(id, label, channel, active, evidence, note = null) {
  return { flow: id, label, channel, active: Boolean(active), evidence, note };
}

/** Active count, total and ratio of a list of flows (ratio 0 when there are none). */
export function flowIntegrity(flows) {
  const total = flows.length;
  const active = flows.filter(f => f.active).length;
  return { active, total, ratio: total ? active / total : 0 };
}

/** A value that is a model statement, not a sensor reading. */
export function symbolic(value, note) { return { kind: 'symbolic', value, note }; }

/** A value the system does not measure at all. */
export function notMeasured(note) { return { kind: 'not_measured', value: null, note }; }
