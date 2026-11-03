#!/usr/bin/env node
// tools/ematrix_fetch_tiles.mjs
// Downloads map tiles for one client build from wago.tools, so the EMatrix data can be
// regenerated for any build (TBC Anniversary, WoW Forever, Classic Era) with one command.
//
//   node tools/ematrix_fetch_tiles.mjs --version 1.60.1.70753 --listfile <community-listfile.csv> \
//        --map azeroth --tiles 31_47,32_47,33_47,31_48,32_48,33_48,31_49,32_49,33_49 --out <dir> [--obj1] [--force]
//
// wago.tools serves raw client files at /api/casc/<fileDataID>?version=<build>; the FileDataIDs
// come from the wowdev community listfile (github.com/wowdev/wow-listfile). Downloaded tiles are
// game data: keep them out of git (they go to a cache dir), only the converted Lua is committed.
import fs from 'node:fs';
import path from 'node:path';

export const WAGO_CASC = 'https://wago.tools/api/casc';

/** FileDataIDs of the tile files for a map, from the listfile: { 'azeroth_32_48.adt': 778027, ... }. */
export function tileFileIds(listfilePath, mapName, tiles, withObj1 = false) {
  const wanted = new Map();
  for (const t of tiles) {
    const base = `world/maps/${mapName}/${mapName}_${t}`;
    wanted.set(`${base}.adt`, `${mapName}_${t}.adt`);
    wanted.set(`${base}_obj0.adt`, `${mapName}_${t}_obj0.adt`);
    if (withObj1) wanted.set(`${base}_obj1.adt`, `${mapName}_${t}_obj1.adt`);
  }
  const ids = new Map();
  const text = fs.readFileSync(listfilePath, 'latin1');
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf('\n', start);
    if (end < 0) end = text.length;
    const line = text.slice(start, end).trim();
    start = end + 1;
    const semi = line.indexOf(';');
    if (semi < 0) continue;
    const p = line.slice(semi + 1).toLowerCase();
    const name = wanted.get(p);
    if (name) ids.set(name, Number(line.slice(0, semi)));
  }
  const missing = [...wanted.values()].filter(n => !ids.has(n));
  if (missing.length) throw new Error(`listfile has no entry for: ${missing.join(', ')}`);
  return ids;
}

export function fileUrl(fdid, version) {
  return `${WAGO_CASC}/${fdid}?version=${encodeURIComponent(version)}`;
}

/** Downloads one file; returns its byte length. Verifies the ADT magic (MVER reversed). */
export async function fetchTile(fdid, version, outFile, { force = false, fetchImpl = fetch } = {}) {
  if (!force && fs.existsSync(outFile) && fs.statSync(outFile).size > 12) return { bytes: fs.statSync(outFile).size, cached: true };
  const res = await fetchImpl(fileUrl(fdid, version), { headers: { 'User-Agent': 'FidelityEMatrix map fetch (node)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for fdid ${fdid} version ${version}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.toString('latin1', 0, 4) !== 'REVM') throw new Error(`fdid ${fdid}: not an ADT (magic ${JSON.stringify(buf.toString('latin1', 0, 4))})`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, buf);
  return { bytes: buf.length, cached: false };
}

export async function fetchTiles({ version, listfilePath, mapName, tiles, outDir, withObj1 = false, force = false, log = console.log, fetchImpl = fetch }) {
  const ids = tileFileIds(listfilePath, mapName, tiles, withObj1);
  const results = [];
  for (const [name, fdid] of ids) {
    const out = path.join(outDir, name);
    const r = await fetchTile(fdid, version, out, { force, fetchImpl });
    log(`${r.cached ? 'cached ' : 'fetched'} ${name} (fdid ${fdid}): ${r.bytes} bytes`);
    results.push({ name, fdid, ...r });
  }
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('ematrix_fetch_tiles.mjs')) {
  const args = process.argv.slice(2);
  const get = (flag, def) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : def; };
  const version = get('--version'), listfilePath = get('--listfile'), outDir = get('--out');
  if (!version || !listfilePath || !outDir) { console.error('usage: --version <build> --listfile <csv> --out <dir> [--map azeroth] [--tiles a_b,c_d] [--obj1] [--force]'); process.exit(2); }
  fetchTiles({
    version, listfilePath, outDir, mapName: get('--map', 'azeroth'),
    tiles: get('--tiles', '32_48').split(','), withObj1: args.includes('--obj1'), force: args.includes('--force'),
  }).then(r => console.log(`${r.length} files in ${outDir} for build ${version}`)).catch(err => { console.error(err.message); process.exit(1); });
}
