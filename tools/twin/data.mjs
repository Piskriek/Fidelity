// tools/twin/data.mjs - the addon's map data (FidelityEMatrix/Data/EMatrix_Data_Azeroth_<family>.lua) for the
// digital twin: every tile's 129 x 129 heights, every doodad placement and every building (WMO) placement,
// read from the Lua the addon itself loads, so the twin stands on the same ground as the overlay.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TILE = 533.33333; // yards per map tile (EMatrix_Terrain.lua)

// EMatrix_Terrain.lua HEIGHT_RULES and HEIGHT_DEFAULT: the nominal height a file is drawn at
export const HEIGHT_RULES = [['canopy', 16], ['tree', 14], ['bush', 2.5], ['shrub', 2], ['rock', 3], ['stone', 2.5], ['fence', 1.5], ['lamp', 4], ['post', 2], ['crate', 1], ['barrel', 1.2], ['jar', 0.7]];
export const HEIGHT_DEFAULT = 1.5;
export function nominalHeight(p) {
  const s = String(p || '').toLowerCase();
  for (const [word, h] of HEIGHT_RULES) if (s.includes(word)) return h;
  return HEIGHT_DEFAULT;
}

/** The proxy shape the twin draws for a file (a stand-in at the placement, not the game's model). */
export function kindOf(p) {
  const s = String(p || '').toLowerCase().split('/').pop();
  if (/stump/.test(s)) return 'stump';
  if (/canopy|tree|sapling/.test(s)) return 'tree';
  if (/bush|shrub|fern|plant|flower/.test(s)) return 'bush';
  if (/barrel|keg/.test(s)) return 'barrel';
  if (/crate|box|chest/.test(s)) return 'crate';
  if (/jar|jug|pot|vase|sack/.test(s)) return 'jar';
  if (/tent/.test(s)) return 'tent';
  if (/rock|stone|boulder|cliff/.test(s)) return 'rock';
  if (/fence|post|pole|sign|lamp|torch/.test(s)) return 'post';
  return 'other';
}

const ENTRY = /\{(\d+),"([^"]+)",(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)\}/g;

/** The balanced { ... } that starts at or after `from` in `src`, as [start, end) offsets of its inside. */
function braced(src, from) {
  const open = src.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return [open + 1, i];
  }
  throw new Error('twin data: an unclosed table');
}

/** Reads a generated map data file. Returns { family, build, product, map, tiles, doodads, wmos }. */
export function readMap(family = 'tbc', file = path.join(ROOT, 'FidelityEMatrix', 'Data', `EMatrix_Data_Azeroth_${family}.lua`)) {
  const src = fs.readFileSync(file, 'utf8');
  const head = src.slice(0, 4096).match(/builds\["(\w+)"\] = \{ build = "([0-9.]+)", product = "([^"]+)", map = "(\w+)"/);
  if (!head || head[1] !== family) throw new Error(`twin data: ${file} names no ${family} build`);
  const tiles = [], doodads = [], wmos = [];
  const header = new RegExp(`EMatrix_Data\\["${family}"\\]\\["((\\w+):(\\d+):(\\d+))"\\] = \\{`, 'g');
  let m;
  while ((m = header.exec(src))) {
    const [bodyStart, bodyEnd] = braced(src, m.index + m[0].length - 1);
    const body = src.slice(bodyStart, bodyEnd);
    const num = name => Number((body.match(new RegExp(`${name} = (-?[\\d.]+)`)) || [])[1]);
    const hAt = body.indexOf('heights = {');
    const [hs, he] = braced(body, hAt);
    const heights = body.slice(hs, he).split(',').map(s => s.trim()).filter(Boolean).map(Number);
    if (heights.length !== 129 * 129 || !heights.every(Number.isFinite)) throw new Error(`twin data: tile ${m[1]} has ${heights.length} heights`);
    const tile = { key: m[1], map: m[2], col: +m[3], row: +m[4], originX: num('originX'), originY: num('originY'), unit: num('unit'), heights };
    tiles.push(tile);
    for (const [section, out] of [['doodads = {', doodads], ['wmos = {', wmos]]) {
      const at = body.indexOf(section);
      if (at < 0) continue;
      const [s0, s1] = braced(body, at);
      for (const e of body.slice(s0, s1).matchAll(ENTRY)) {
        const p = e[2];
        out.push({ fdid: +e[1], path: p, file: p.split('/').pop(), x: +e[3], y: +e[4], z: +e[5], rot: +e[6], scale: +e[7], kind: kindOf(p), nominal: nominalHeight(p), tile: tile.key });
      }
    }
  }
  return { family, build: head[2], product: head[3], map: head[4], tiles, doodads, wmos };
}

/** The tile a world point lies on (EMatrix_Terrain.lua Terrain.TileFor), or null. */
export function tileFor(map, x, y) {
  const row = Math.floor(32 - x / TILE), col = Math.floor(32 - y / TILE);
  return map.tiles.find(t => t.col === col && t.row === row) || null;
}

/** The ground height at a world point: bilinear over the tile's grid (EMatrix_Terrain.lua Terrain.GroundHeight). */
export function groundHeight(tile, x, y) {
  if (!tile) return null;
  const fj = (tile.originX - x) / tile.unit, fk = (tile.originY - y) / tile.unit;
  if (fj < 0 || fk < 0 || fj > 128 || fk > 128) return null;
  let j = Math.floor(fj), k = Math.floor(fk);
  if (j === 128) j = 127;
  if (k === 128) k = 127;
  const tj = fj - j, tk = fk - k, H = tile.heights;
  const h = (jj, kk) => H[jj * 129 + kk] * 0.1;
  const top = h(j, k) * (1 - tk) + h(j, k + 1) * tk;
  const bottom = h(j + 1, k) * (1 - tk) + h(j + 1, k + 1) * tk;
  return top * (1 - tj) + bottom * tj;
}
