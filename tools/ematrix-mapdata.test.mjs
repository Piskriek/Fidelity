// tools/ematrix-mapdata.test.mjs
// The ADT -> Lua converter, checked on a synthetic tile built here (always) and on the real
// Elwynn tiles when they are present in EMATRIX_TILES (downloaded from wago.tools, never in git).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chunks, mcvtToOuter9x9, parseRootAdt, stitchTile, parseObjAdt, tileToLua, TILE_SIZE, CHUNK_SIZE, MAP_HALF } from './ematrix_mapdata.mjs';

const chunk = (id, data) => {
  const head = Buffer.alloc(8);
  head.write(id.split('').reverse().join(''), 0, 'latin1');
  head.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, data]);
};

/** A synthetic root ADT: 256 chunks whose outer heights equal 100 + K*0.5 + J*0.25 for the GLOBAL vertex (J, K), so shared edges agree. */
function syntheticRoot() {
  const parts = [chunk('MVER', Buffer.from([18, 0, 0, 0]))];
  for (let iy = 0; iy < 16; iy++) for (let ix = 0; ix < 16; ix++) {
    const header = Buffer.alloc(128);
    header.writeUInt32LE(ix, 0x04); header.writeUInt32LE(iy, 0x08);
    header.writeFloatLE((32 - 48) * TILE_SIZE - iy * CHUNK_SIZE, 0x68);
    header.writeFloatLE((32 - 32) * TILE_SIZE - ix * CHUNK_SIZE, 0x6c);
    header.writeFloatLE(100, 0x70);
    const mcvt = Buffer.alloc(580);
    let i = 0;
    for (let row = 0; row < 17; row++) {
      const n = row % 2 === 0 ? 9 : 8;
      for (let k = 0; k < n; k++) mcvt.writeFloatLE(row % 2 === 0 ? (ix * 8 + k) * 0.5 + (iy * 8 + row / 2) * 0.25 : -999, (i++) * 4);
    }
    parts.push(chunk('MCNK', Buffer.concat([header, chunk('MCVT', mcvt)])));
  }
  return Buffer.concat(parts);
}

/** A synthetic _obj0 with one named doodad, one FileDataID doodad and one WMO. */
function syntheticObj() {
  const names = Buffer.from('world/tree.m2\0', 'latin1');
  const mmid = Buffer.alloc(4); mmid.writeUInt32LE(0, 0);
  const mddf = Buffer.alloc(72);
  // entry 0: named, placed at ADT coords that map to world (x, y, z) = (-8800, -100, 60)
  mddf.writeUInt32LE(0, 0); mddf.writeUInt32LE(1, 4);
  mddf.writeFloatLE(MAP_HALF - (-100), 8); mddf.writeFloatLE(60, 12); mddf.writeFloatLE(MAP_HALF - (-8800), 16);
  mddf.writeFloatLE(0, 20); mddf.writeFloatLE(135, 24); mddf.writeFloatLE(0, 28);
  mddf.writeUInt16LE(2048, 32); mddf.writeUInt16LE(0, 34);
  // entry 1: FileDataID 123456 with flag 0x40
  mddf.writeUInt32LE(123456, 36); mddf.writeUInt32LE(2, 40);
  mddf.writeFloatLE(MAP_HALF, 44); mddf.writeFloatLE(0, 48); mddf.writeFloatLE(MAP_HALF, 52);
  mddf.writeFloatLE(0, 56); mddf.writeFloatLE(90, 60); mddf.writeFloatLE(0, 64);
  mddf.writeUInt16LE(1024, 68); mddf.writeUInt16LE(0x40, 70);
  const mwmo = Buffer.from('world/abbey.wmo\0', 'latin1');
  const mwid = Buffer.alloc(4);
  const modf = Buffer.alloc(64);
  modf.writeUInt32LE(0, 0); modf.writeUInt32LE(7, 4);
  modf.writeFloatLE(MAP_HALF - 10, 8); modf.writeFloatLE(70, 12); modf.writeFloatLE(MAP_HALF - 20, 16);
  modf.writeFloatLE(0, 20); modf.writeFloatLE(0, 24); modf.writeFloatLE(0, 28);
  modf.writeUInt16LE(0, 56); modf.writeUInt16LE(0, 58); modf.writeUInt16LE(0, 60); modf.writeUInt16LE(0, 62);
  return Buffer.concat([chunk('MVER', Buffer.from([18, 0, 0, 0])), chunk('MMDX', names), chunk('MMID', mmid), chunk('MWMO', mwmo), chunk('MWID', mwid), chunk('MDDF', mddf), chunk('MODF', modf)]);
}

test('chunk walker reads reversed magics and sizes, and rejects a truncated chunk', () => {
  const buf = Buffer.concat([chunk('MVER', Buffer.from([18, 0, 0, 0])), chunk('MHDR', Buffer.alloc(64))]);
  assert.deepEqual(chunks(buf).map(c => c.id), ['MVER', 'MHDR']);
  assert.throws(() => chunks(buf.subarray(0, buf.length - 10)), /runs past the end/);
});

test('MCVT: 145 floats become the 9x9 outer grid, inner rows skipped, base height added', () => {
  const f = new Float32Array(145);
  let i = 0;
  for (let row = 0; row < 17; row++) { const n = row % 2 === 0 ? 9 : 8; for (let k = 0; k < n; k++) f[i++] = row % 2 === 0 ? k : -1; }
  const g = mcvtToOuter9x9(f, 1000);
  assert.equal(g.length, 9);
  assert.deepEqual(g[0], [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008]);
  assert.ok(g.every(r => r.every(v => v >= 1000)), 'inner (-1) rows must not leak into the outer grid');
});

test('synthetic root tile: 256 chunks stitch into a 129x129 grid with shared edges and the tile origin', () => {
  const chunksParsed = parseRootAdt(syntheticRoot());
  assert.equal(chunksParsed.length, 256);
  const st = stitchTile(chunksParsed);
  assert.ok(Math.abs(st.originX - (32 - 48) * TILE_SIZE) < 0.01, `originX ${st.originX} (float32 in the file)`);
  assert.equal(st.originY, 0);
  assert.equal(st.grid.length, 129);
  assert.equal(st.grid[0].length, 129);
  assert.equal(st.grid[0][0], 100);
  assert.equal(st.grid[0][8], 104);        // shared edge of chunks (0,0) and (1,0): K = 8
  assert.equal(st.grid[0][9], 104.5);      // first inner vertex of chunk (1,0): K = 9
  assert.equal(st.grid[8][0], 102);        // shared edge of chunks (0,0) and (0,1): J = 8
  assert.equal(st.grid[128][128], 100 + 64 + 32); // K = 128, J = 128
});

test('synthetic obj tile: named doodad, FileDataID doodad and WMO come out in world coordinates', () => {
  const o = parseObjAdt(syntheticObj());
  assert.equal(o.doodads.length, 2);
  assert.equal(o.wmos.length, 1);
  const [named, byId] = o.doodads;
  assert.equal(named.name, 'world/tree.m2');
  assert.equal(named.fdid, null);
  assert.ok(Math.abs(named.x - (-8800)) < 0.01 && Math.abs(named.y - (-100)) < 0.01 && named.z === 60, `world pos ${named.x},${named.y},${named.z}`);
  assert.equal(named.yawDeg, 45);
  assert.equal(named.scale, 2);
  assert.equal(byId.fdid, 123456);
  assert.equal(byId.name, null);
  assert.equal(byId.scale, 1);
  assert.equal(o.wmos[0].name, 'world/abbey.wmo');
  assert.ok(Math.abs(o.wmos[0].x - 20) < 0.01 && Math.abs(o.wmos[0].y - 10) < 0.01 && o.wmos[0].z === 70);
});

test('tileToLua emits loadable Lua with decimetre heights and resolved paths', () => {
  const st = stitchTile(parseRootAdt(syntheticRoot()));
  const o = parseObjAdt(syntheticObj());
  const lua = tileToLua('azeroth', 32, 48, st, o, new Map([[123456, 'world/azeroth/elwynn/passivedoodads/trees/elwynntree01.m2']]));
  assert.match(lua, /^EMatrix_Data\["azeroth:32:48"\] = \{/);
  assert.match(lua, /heights = \{1000,1005,1010/);
  assert.match(lua, /\{123456,"world\/azeroth\/elwynn\/passivedoodads\/trees\/elwynntree01\.m2",0\.00,0\.00,0\.00,0\.0,1\.000\}/);
  assert.match(lua, /\{0,"world\/tree\.m2",-8800\.00,-100\.00,60\.00,45\.0,2\.000\}/);
  const opens = (lua.match(/\{/g) || []).length, closes = (lua.match(/\}/g) || []).length;
  assert.equal(opens, closes, 'braces must balance');
});

const tilesDir = process.env.EMATRIX_TILES;
test('real Elwynn tiles (when EMATRIX_TILES points at the downloads): layout matches the format and placements fall inside the tile', { skip: !(tilesDir && fs.existsSync(path.join(tilesDir, 'azeroth_32_48.adt'))) && 'EMATRIX_TILES not set' }, () => {
  const root = parseRootAdt(fs.readFileSync(path.join(tilesDir, 'azeroth_32_48.adt')));
  const c0 = root.find(c => c.indexX === 0 && c.indexY === 0);
  assert.ok(Math.abs(c0.posX - (32 - 48) * TILE_SIZE) < 0.05, `chunk 0,0 x ${c0.posX}`);
  assert.ok(Math.abs(c0.posY - 0) < 0.05, `chunk 0,0 y ${c0.posY}`);
  const st = stitchTile(root);
  let mn = Infinity, mx = -Infinity;
  for (const r of st.grid) for (const v of r) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  assert.ok(mn > -200 && mx < 600 && mx - mn > 10, `heights ${mn}..${mx} are not Elwynn-like`);
  const o = parseObjAdt(fs.readFileSync(path.join(tilesDir, 'azeroth_32_48_obj0.adt')));
  assert.ok(o.doodads.length > 100, `only ${o.doodads.length} doodads`);
  const inside = o.doodads.filter(d => d.x <= st.originX + 1 && d.x >= st.originX - TILE_SIZE - 1 && d.y <= st.originY + 1 && d.y >= st.originY - TILE_SIZE - 1).length;
  assert.ok(inside / o.doodads.length > 0.95, `${inside}/${o.doodads.length} doodads inside the tile`);
  assert.ok(o.wmos.length >= 1, 'Northshire has at least the abbey');
});
