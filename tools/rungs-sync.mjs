#!/usr/bin/env node
// tools/rungs-sync.mjs - writes bridge/sync/rungs.json: the verdicts of docs/rungs/ledger.json through the
// one evaluator, for the Triad's rungs_traversed and DECISION slots (owner ruling 7, 05 Nov 2026).
//   node tools/rungs-sync.mjs          write the file
//   node tools/rungs-sync.mjs --check  exit 1 when the committed file is not the ledger's snapshot
// The snapshot is as of the ledger's newest reading (its own step stamp), so it changes only when the
// ledger or the addon's constants do: no clock, no file time.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { evaluate, readTerrainConstants, terrainRungs, stampTime } from '../packages/triad-369/src/rung_ledger.mjs';
import { rungSnapshot } from '../packages/triad-369/src/rung_slots.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUNGS_FILE = path.join(ROOT, 'bridge', 'sync', 'rungs.json');

export function buildSnapshot(root = ROOT) {
  // line endings normalised, so a CRLF checkout (core.autocrlf on Windows) hashes the same text as git stores
  const ledgerText = fs.readFileSync(path.join(root, 'docs', 'rungs', 'ledger.json'), 'utf8').replace(/\r\n/g, '\n');
  const ledger = JSON.parse(ledgerText);
  const C = readTerrainConstants(fs.readFileSync(path.join(root, 'FidelityEMatrix', 'EMatrix_Terrain.lua'), 'utf8'));
  const version = (fs.readFileSync(path.join(root, 'FidelityEMatrix', 'EMatrix_Core.lua'), 'utf8').match(/local VERSION = "([0-9.]+)"/) || [])[1] || null;
  // the client build the map data was read from (the data file's own header)
  const head = fs.readFileSync(path.join(root, 'FidelityEMatrix', 'Data', 'EMatrix_Data_Azeroth_tbc.lua'), 'utf8').slice(0, 4096);
  const build = (head.match(/builds\["tbc"\] = \{ build = "([0-9.]+)"/) || [])[1];
  if (!build) throw new Error('rungs-sync: the tbc map data names no build');
  const files = [...new Set(ledger.rows.filter(r => r.rung.startsWith('fit:')).map(r => r.rung.slice(4)))];
  const rungs = terrainRungs(C, { build, files, tolerance: ledger.tolerance, camera: ledger.camera });
  const asOf = ledger.rows.map(r => r.at).filter(a => stampTime(a) !== null).sort((a, b) => stampTime(a) - stampTime(b)).pop();
  const result = evaluate(rungs, ledger.rows, { now: asOf, manifests: ledger.manifests });
  const sha256 = crypto.createHash('sha256').update(ledgerText).digest('hex').toUpperCase();
  return rungSnapshot(result, { asOf, source: { ledger: 'docs/rungs/ledger.json', sha256, addon: version, build } });
}

export const serialize = snapshot => JSON.stringify(snapshot, null, 2) + '\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const text = serialize(buildSnapshot());
  if (process.argv.includes('--check')) {
    const committed = fs.existsSync(RUNGS_FILE) ? fs.readFileSync(RUNGS_FILE, 'utf8').replace(/\r\n/g, '\n') : '';
    if (committed !== text) { console.error('rungs-sync: bridge/sync/rungs.json is not the ledger\'s snapshot; run node tools/rungs-sync.mjs'); process.exit(1); }
    console.log('rungs-sync: bridge/sync/rungs.json matches the ledger');
  } else {
    fs.writeFileSync(RUNGS_FILE, text);
    console.log(`rungs-sync: wrote ${path.relative(ROOT, RUNGS_FILE)} (as of ${JSON.parse(text).asOf})`);
  }
}
