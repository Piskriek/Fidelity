// rung_slots.mjs - the rung verdicts in the Triad's reserved slots (owner ruling 7, 05 Nov 2026).
//
// tools/rungs-sync.mjs evaluates docs/rungs/ledger.json with the one evaluator (rung_ledger.mjs) and
// writes the result to bridge/sync/rungs.json. The Apex reads that file and fills two slots of its
// query reply with it, as data: cascade_trace.rungs_traversed (the rungs that hold) and
// teacher_handshake.step_2_decision.rungs (every verdict and the frontier). Nothing else changes: no
// HUD text, no seventh flow, no re-test (the Apex never judges a rung), and a missing or malformed file
// reads not_measured. "Awareness" names the set of rungs that hold (owner ruling 3): a list, never a
// number or a percentage.
import { VERDICTS } from './rung_ledger.mjs';

export const RUNGS_SOURCE = 'bridge/sync/rungs.json';

const isStamp = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s);

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

/** The two slots, from a snapshot (or anything else: a malformed or missing one reads not_measured). */
export function rungSlots(snapshot) {
  const valid = snapshot && typeof snapshot === 'object' && isStamp(snapshot.asOf)
    && Array.isArray(snapshot.verdicts) && snapshot.verdicts.length > 0 && Array.isArray(snapshot.frontier)
    && snapshot.verdicts.every(v => v && typeof v.rung === 'string' && VERDICTS.includes(v.verdict) && (v.report === null || typeof v.report === 'string'))
    && snapshot.frontier.every(id => typeof id === 'string' && snapshot.verdicts.some(v => v.rung === id));
  if (!valid) return { rungs_traversed: [], decision: { status: 'not_measured', source: RUNGS_SOURCE } };
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
