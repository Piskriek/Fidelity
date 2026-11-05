// rung_slots.mjs - the rung verdicts in the Triad's reserved slots (owner ruling 7, 05 Nov 2026).
//
// tools/rungs-sync.mjs evaluates docs/rungs/ledger.json with the one evaluator (rung_ledger.mjs) and
// writes the result to bridge/sync/rungs.json. The Apex reads that file and fills two slots of its
// query reply with it, as data: cascade_trace.rungs_traversed (the rungs that hold) and
// teacher_handshake.step_2_decision.rungs (every verdict and the frontier). Nothing else changes: no
// HUD text, no seventh flow, no re-test (the Apex never judges a rung), and a missing or malformed file
// reads not_measured. "Awareness" names the set of rungs that hold (owner ruling 3): a list, never a
// number or a percentage.
import { VERDICTS, stampTime } from './rung_ledger.mjs';

export const RUNGS_SOURCE = 'bridge/sync/rungs.json';

const isStamp = s => stampTime(s) !== null; // the evaluator's own clock rule: well formed, and every field in range
const NEEDS_REPORT = new Set(['holds', 'fails', 'fitted', 'contested']); // a verdict a reading made names its report

/** The snapshot rungs-sync writes, from an evaluate() result. asOf: the newest reading's own stamp. */
export function rungSnapshot(result, { asOf, source }) {
  const verdicts = result.order.map(id => {
    const v = result.verdicts.get(id);
    const out = { rung: id, verdict: v.verdict, report: v.report ?? null };
    if (typeof v.residual === 'number') out.residual = v.residual;
    return out;
  });
  return {
    about: 'The verdicts of docs/rungs/ledger.json, written by tools/rungs-sync.mjs through packages/triad-369/src/rung_ledger.mjs. The Apex copies them into its rungs_traversed and DECISION slots as data (owner ruling 7): no HUD change, no seventh flow, no re-test. awareness names the set of rungs that hold (owner ruling 3): a list, never a number on screen.',
    asOf,
    source,
    awareness: verdicts.filter(v => v.verdict === 'holds').map(v => v.rung),
    frontier: [...result.frontier],
    verdicts,
  };
}

/**
 * Whether a snapshot can be served: one verdict per rung, each a known verdict, a report wherever a reading
 * made the verdict, a frontier of rungs that neither hold nor are blocked (the evaluator's own rule), and an
 * asOf that is a real time. A snapshot that contradicts itself is malformed.
 */
function servable(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || !isStamp(snapshot.asOf)) return false;
  const { verdicts, frontier } = snapshot;
  if (!Array.isArray(verdicts) || verdicts.length === 0 || !Array.isArray(frontier)) return false;
  const byRung = new Map();
  for (const v of verdicts) {
    if (!v || typeof v !== 'object' || typeof v.rung !== 'string' || !VERDICTS.includes(v.verdict) || byRung.has(v.rung)) return false;
    if (NEEDS_REPORT.has(v.verdict) ? typeof v.report !== 'string' || !v.report : !(v.report === null || typeof v.report === 'string')) return false;
    byRung.set(v.rung, v);
  }
  const seen = new Set();
  for (const id of frontier) {
    const v = typeof id === 'string' && byRung.get(id);
    if (!v || v.verdict === 'holds' || v.verdict === 'blocked' || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

/** The two slots, from a snapshot (or anything else: a malformed or missing one reads not_measured). */
export function rungSlots(snapshot) {
  if (!servable(snapshot)) return { rungs_traversed: [], decision: { status: 'not_measured', source: RUNGS_SOURCE } };
  return {
    rungs_traversed: snapshot.verdicts.filter(v => v.verdict === 'holds').map(v => `${v.rung}: holds${v.report ? ` (report ${v.report})` : ''}`),
    decision: {
      status: 'judged',
      source: RUNGS_SOURCE,
      as_of: snapshot.asOf,
      verdicts: snapshot.verdicts.map(({ rung, verdict, report }) => ({ rung, verdict, report })),
      frontier: [...snapshot.frontier],
    },
  };
}
