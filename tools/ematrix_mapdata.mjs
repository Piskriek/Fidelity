#!/usr/bin/env node
// tools/ematrix_mapdata.mjs
// Converts WoW map tiles (ADT v18, split root + _obj0) into Lua data for FidelityEMatrix.
//
//   node tools/ematrix_mapdata.mjs --tiles <dir> --listfile <community-listfile.csv> \
//        --map azeroth --family tbc --build 2.5.6.70577 --product wow_anniversary
//        --out FidelityEMatrix/Data/EMatrix_Data_Azeroth_tbc.lua [--tile 32_48 ...]
//
// `family` is the client family the addon selects at load from its interface number: "vanilla"
// (1.x: WoW Forever, Classic Era) or "tbc" (2.x). Each family gets its own data file because the
// builds reference different model ids for some placements.
//
// Per tile it writes: the 129x129 grid of outer terrain heights (decimetres, integers) and
// every M2 doodad and WMO placement with world position, yaw and scale, plus the model path
// resolved through the listfile. World axes follow UnitPosition: x north, y west, z up.
//
// Format references: wowdev.wiki ADT/v18 (MCNK header, MCVT 9x9 + 8x8 layout, MDDF 36-byte
// and MODF 64-byte entries, flag 0x40 = entry is a FileDataID), and the Mangos ADT notes
// (tile = 533.3333 yd, chunk = 33.3333 yd, 16x16 chunks).
import fs from 'node:fs';
import path from 'node:path';

export const TILE_SIZE = 533.33333;
export const CHUNK_SIZE = TILE_SIZE / 16;
export const UNIT_SIZE = CHUNK_SIZE / 8;
export const MAP_HALF = 32 * TILE_SIZE; // 17066.666: ADT placement coordinates are measured from the map corner

const magic = (buf, off) => buf.toString('latin1', off, off + 4).split('').reverse().join('');

/** Iterates top-level chunks: [{ id, data }]. */
export function chunks(buf) {
  const out = [];
  let off = 0;
  while (off + 8 <= buf.length) {
    const id = magic(buf, off);
    const size = buf.readUInt32LE(off + 4);
    if (off + 8 + size > buf.length) throw new Error(`chunk ${id} at ${off} runs past the end (${size} bytes)`);
    out.push({ id, data: buf.subarray(off + 8, off + 8 + size), offset: off });
    off += 8 + size;
  }
  return out;
}

/** The 145 MCVT floats in file order: 9 outer, 8 inner, 9 outer, ... (9 rows of 9 + 8 rows of 8). */
export function mcvtToOuter9x9(floats, baseZ) {
  const outer = [];
  let i = 0;
  for (let row = 0; row < 17; row++) {
    const n = row % 2 === 0 ? 9 : 8;
    const vals = floats.subarray(i, i + n);
    i += n;
    if (row % 2 === 0) outer.push(Array.from(vals, v => v + baseZ));
  }
  return outer; // [9][9], outer[j][k]: j along -x (south), k along -y (east)
}

/** Parses a root ADT: 256 chunks with their world corner and 9x9 outer heights. */
export function parseRootAdt(buf) {
  const top = chunks(buf);
  const ver = top.find(c => c.id === 'MVER');
  if (!ver || ver.data.readUInt32LE(0) !== 18) throw new Error('not an ADT v18 root file');
  const mcnks = top.filter(c => c.id === 'MCNK');
  if (mcnks.length !== 256) throw new Error(`expected 256 MCNK chunks, found ${mcnks.length}`);
  const out = [];
  for (const c of mcnks) {
    const d = c.data;
    const indexX = d.readUInt32LE(0x04), indexY = d.readUInt32LE(0x08);
    const posX = d.readFloatLE(0x68), posY = d.readFloatLE(0x6c), posZ = d.readFloatLE(0x70);
    let heights = null;
    for (const sub of chunks(d.subarray(128))) {
      if (sub.id === 'MCVT') {
        if (sub.data.length !== 580) throw new Error(`MCVT must be 580 bytes, got ${sub.data.length}`);
        const floats = new Float32Array(145);
        for (let i = 0; i < 145; i++) floats[i] = sub.data.readFloatLE(i * 4);
        heights = mcvtToOuter9x9(floats, posZ);
      }
    }
    if (!heights) throw new Error(`MCNK ${indexX},${indexY} has no MCVT`);
    out.push({ indexX, indexY, posX, posY, posZ, heights });
  }
  return out;
}

/** Stitches 256 chunks into one 129x129 outer-vertex grid. grid[j][k], j along -x from the tile's north edge, k along -y from its west edge. */
export function stitchTile(chunkList) {
  const grid = Array.from({ length: 129 }, () => new Float64Array(129));
  for (const c of chunkList) {
    for (let j = 0; j < 9; j++) for (let k = 0; k < 9; k++) {
      grid[c.indexY * 8 + j][c.indexX * 8 + k] = c.heights[j][k];
    }
  }
  const north = Math.max(...chunkList.map(c => c.posX));
  const west = Math.max(...chunkList.map(c => c.posY));
  return { grid, originX: north, originY: west };
}

/** Parses an _obj0 ADT: doodads (M2) and map objects (WMO) with world coordinates. */
export function parseObjAdt(buf) {
  const top = chunks(buf);
  const names = { mmdx: [], mwmo: [] };
  const strings = (data) => {
    const list = [];
    let start = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] === 0) { list.push({ offset: start, name: data.toString('latin1', start, i) }); start = i + 1; }
    }
    return list;
  };
  const byOffset = (list) => { const m = new Map(); for (const s of list) m.set(s.offset, s.name); return m; };
  const mmdx = top.find(c => c.id === 'MMDX'), mmid = top.find(c => c.id === 'MMID');
  const mwmo = top.find(c => c.id === 'MWMO'), mwid = top.find(c => c.id === 'MWID');
  const mmdxMap = mmdx ? byOffset(strings(mmdx.data)) : new Map();
  const mwmoMap = mwmo ? byOffset(strings(mwmo.data)) : new Map();
  const mmidList = mmid ? Array.from({ length: mmid.data.length / 4 }, (_, i) => mmid.data.readUInt32LE(i * 4)) : [];
  const mwidList = mwid ? Array.from({ length: mwid.data.length / 4 }, (_, i) => mwid.data.readUInt32LE(i * 4)) : [];

  const toWorld = (px, py, pz) => ({ x: MAP_HALF - pz, y: MAP_HALF - px, z: py });
  const doodads = [], wmos = [];
  const mddf = top.find(c => c.id === 'MDDF');
  if (mddf) {
    for (let off = 0; off + 36 <= mddf.data.length; off += 36) {
      const d = mddf.data;
      const nameId = d.readUInt32LE(off), uniqueId = d.readUInt32LE(off + 4);
      const px = d.readFloatLE(off + 8), py = d.readFloatLE(off + 12), pz = d.readFloatLE(off + 16);
      const rx = d.readFloatLE(off + 20), ry = d.readFloatLE(off + 24), rz = d.readFloatLE(off + 28);
      const scale = d.readUInt16LE(off + 32) / 1024, flags = d.readUInt16LE(off + 34);
      const isFdid = (flags & 0x40) !== 0;
      const w = toWorld(px, py, pz);
      doodads.push({ fdid: isFdid ? nameId : null, name: isFdid ? null : (mmdxMap.get(mmidList[nameId]) ?? null), uniqueId, ...w, rotX: rx, rotY: ry, rotZ: rz, yawDeg: ry - 90, scale, flags });
    }
  }
  const modf = top.find(c => c.id === 'MODF');
  if (modf) {
    for (let off = 0; off + 64 <= modf.data.length; off += 64) {
      const d = modf.data;
      const nameId = d.readUInt32LE(off), uniqueId = d.readUInt32LE(off + 4);
      const px = d.readFloatLE(off + 8), py = d.readFloatLE(off + 12), pz = d.readFloatLE(off + 16);
      const rx = d.readFloatLE(off + 20), ry = d.readFloatLE(off + 24), rz = d.readFloatLE(off + 28);
      const flags = d.readUInt16LE(off + 56), doodadSet = d.readUInt16LE(off + 58), nameSet = d.readUInt16LE(off + 60);
      const scaleRaw = d.readUInt16LE(off + 62);
      const isFdid = (flags & 0x8) !== 0; // modf_entry_is_filedata_id
      const w = toWorld(px, py, pz);
      wmos.push({ fdid: isFdid ? nameId : null, name: isFdid ? null : (mwmoMap.get(mwidList[nameId]) ?? null), uniqueId, ...w, rotX: rx, rotY: ry, rotZ: rz, yawDeg: ry - 90, scale: scaleRaw ? scaleRaw / 1024 : 1, doodadSet, nameSet, flags });
    }
  }
  return { doodads, wmos, mmdxNames: mmdxMap.size, mwmoNames: mwmoMap.size };
}

/** Loads the community listfile into a Map fdid -> path (lower-case, forward slashes). */
export function loadListfile(file, filter = () => true) {
  const map = new Map();
  const text = fs.readFileSync(file, 'latin1');
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf('\n', start);
    if (end < 0) end = text.length;
    const line = text.slice(start, end);
    start = end + 1;
    const semi = line.indexOf(';');
    if (semi < 0) continue;
    const p = line.slice(semi + 1).trim();
    if (filter(p)) map.set(Number(line.slice(0, semi)), p);
  }
  return map;
}

/** Lua-safe string literal. */
const luaStr = s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Emits one tile as a Lua table source. Heights as decimetres (integers), row-major 129x129. */
export function tileToLua(mapName, col, row, stitched, objects, listfile, family = 'tbc') {
  const { grid, originX, originY } = stitched;
  const h = [];
  for (let j = 0; j < 129; j++) {
    const line = [];
    for (let k = 0; k < 129; k++) line.push(Math.round(grid[j][k] * 10));
    h.push(line.join(','));
  }
  const resolve = (o) => {
    const p = o.name ?? (o.fdid != null ? listfile.get(o.fdid) : null);
    return p ? p.toLowerCase() : null;
  };
  const entry = (o) => `{${o.fdid ?? 0},${luaStr(resolve(o) ?? '')},${o.x.toFixed(2)},${o.y.toFixed(2)},${o.z.toFixed(2)},${o.yawDeg.toFixed(1)},${o.scale.toFixed(3)}}`;
  const doodads = objects.doodads.map(entry);
  const wmos = objects.wmos.map(entry);
  return [
    `EMatrix_Data[${luaStr(family)}][${luaStr(`${mapName}:${col}:${row}`)}] = {`,
    `  map = ${luaStr(mapName)}, col = ${col}, row = ${row},`,
    `  originX = ${originX.toFixed(3)}, originY = ${originY.toFixed(3)}, unit = ${UNIT_SIZE.toFixed(5)},`,
    `  -- heights[j*129 + k + 1] in decimetres: j along -x (south) from originX, k along -y (east) from originY`,
    `  heights = {${h.join(',\n')}},`,
    `  -- {fdid, path, x, y, z, yawDeg, scale}`,
    `  doodads = {${doodads.join(',\n')}},`,
    `  wmos = {${wmos.join(',\n')}},`,
    `}`,
  ].join('\n');
}

export function convert({ tilesDir, listfilePath, mapName, tiles, outFile, family = 'tbc', build = 'unknown', product = 'unknown' }) {
  const listfile = loadListfile(listfilePath, p => p.endsWith('.m2') || p.endsWith('.wmo') || p.endsWith('.mdx'));
  const parts = [
    '-- Generated by tools/ematrix_mapdata.mjs from the game\'s own map tiles (ADT v18). Do not edit.',
    `-- Map ${mapName}, tiles ${tiles.join(' ')}, client family ${family}, build ${build} (${product}). World axes: x north, y west, z up (UnitPosition).`,
    'EMatrix_Data = EMatrix_Data or {}',
    `EMatrix_Data[${luaStr(family)}] = EMatrix_Data[${luaStr(family)}] or {}`,
    'EMatrix_Data.builds = EMatrix_Data.builds or {}',
    `EMatrix_Data.builds[${luaStr(family)}] = { build = ${luaStr(build)}, product = ${luaStr(product)}, map = ${luaStr(mapName)}, tiles = ${luaStr(tiles.join(' '))} }`,
  ];
  const summary = [];
  for (const t of tiles) {
    const [col, row] = t.split('_').map(Number);
    const root = fs.readFileSync(path.join(tilesDir, `${mapName}_${col}_${row}.adt`));
    const obj0 = fs.readFileSync(path.join(tilesDir, `${mapName}_${col}_${row}_obj0.adt`));
    const stitched = stitchTile(parseRootAdt(root));
    const objects = parseObjAdt(obj0);
    parts.push(tileToLua(mapName, col, row, stitched, objects, listfile, family));
    const unresolved = objects.doodads.filter(o => !(o.name ?? listfile.get(o.fdid))).length;
    summary.push({ tile: t, doodads: objects.doodads.length, wmos: objects.wmos.length, unresolved, originX: stitched.originX, originY: stitched.originY, minZ: Math.min(...stitched.grid.map(r => Math.min(...r))), maxZ: Math.max(...stitched.grid.map(r => Math.max(...r))) });
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, parts.join('\n') + '\n');
  return summary;
}

if (process.argv[1] && process.argv[1].endsWith('ematrix_mapdata.mjs')) {
  const args = process.argv.slice(2);
  const get = (flag, def) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : def; };
  const tiles = args.flatMap((a, i) => (a === '--tile' ? [args[i + 1]] : []));
  const summary = convert({
    tilesDir: get('--tiles'), listfilePath: get('--listfile'), mapName: get('--map', 'azeroth'),
    tiles: tiles.length ? tiles : ['32_48'], outFile: get('--out', 'FidelityEMatrix/Data/EMatrix_Data_Azeroth_tbc.lua'),
    family: get('--family', 'tbc'), build: get('--build', 'unknown'), product: get('--product', 'unknown'),
  });
  for (const s of summary) console.log(`${s.tile}: ${s.doodads} doodads (${s.unresolved} unresolved), ${s.wmos} wmos, origin ${s.originX.toFixed(1)},${s.originY.toFixed(1)}, z ${s.minZ.toFixed(1)}..${s.maxZ.toFixed(1)}`);
}
