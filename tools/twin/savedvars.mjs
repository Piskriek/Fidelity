// tools/twin/savedvars.mjs - reads a WoW SavedVariables file (Lua table literals, as the client writes it) into
// plain values: FidelityEMatrix.lua from an owner report gives the twin its recorded shutter poses.
const TOKEN = /\s+|--[^\n]*|"(?:\\.|[^"\\])*"|-?(?:0x[0-9a-fA-F]+|\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)|[A-Za-z_][A-Za-z0-9_]*|[{}\[\]=,;]/y;
const ESC = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'", '\n': '\n' };

function unquote(s) {
  let out = '';
  for (let i = 1; i < s.length - 1; i++) {
    const c = s[i];
    if (c !== '\\') { out += c; continue; }
    const n = s[i + 1];
    if (/\d/.test(n)) {
      let j = i + 1;
      while (j < s.length - 1 && j < i + 4 && /\d/.test(s[j])) j++;
      out += String.fromCharCode(Number(s.slice(i + 1, j)));
      i = j - 1;
      continue;
    }
    out += ESC[n] ?? n;
    i++;
  }
  return out;
}

function tokenize(src) {
  const out = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < src.length) {
    const at = TOKEN.lastIndex;
    const m = TOKEN.exec(src);
    if (!m) throw new Error(`savedvars: unexpected text at ${at}: ${JSON.stringify(src.slice(at, at + 20))}`);
    const t = m[0];
    if (/^\s/.test(t) || t.startsWith('--')) continue;
    out.push(t);
  }
  return out;
}

/** Parses a SavedVariables file into { name: value }. Tables with only positional entries become arrays. */
export function parseSavedVariables(src) {
  const t = tokenize(src);
  let i = 0;
  const peek = () => t[i];
  const take = want => {
    const v = t[i++];
    if (want !== undefined && v !== want) throw new Error(`savedvars: expected ${want}, got ${v} at token ${i - 1}`);
    return v;
  };
  const value = () => {
    const v = peek();
    if (v === '{') return table();
    take();
    if (v.startsWith('"')) return unquote(v);
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'nil') return null;
    if (/^-?0x/i.test(v)) return parseInt(v, 16);
    if (/^-?[\d.]/.test(v)) return Number(v);
    throw new Error(`savedvars: bad value ${v}`);
  };
  const table = () => {
    take('{');
    const arr = [], obj = {};
    let keyed = false;
    while (peek() !== '}') {
      if (peek() === '[') { take('['); const k = value(); take(']'); take('='); obj[k] = value(); keyed = true; }
      else if (/^[A-Za-z_]/.test(peek()) && t[i + 1] === '=') { const k = take(); take('='); obj[k] = value(); keyed = true; }
      else arr.push(value());
      if (peek() === ',' || peek() === ';') take();
    }
    take('}');
    if (!keyed) return arr;
    arr.forEach((v, n) => { obj[n + 1] = v; });
    return obj;
  };
  const out = {};
  while (i < t.length) { const name = take(); take('='); out[name] = value(); }
  return out;
}

const STAMP = /taken at (\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
/** The screenshot file names a "taken at" stamp can have: that second, or the next (a file can be named a second late). */
export function shotNames(taken) {
  const m = typeof taken === 'string' && taken.match(STAMP);
  if (!m) return [];
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return [t, t + 1000].map(ms => {
    const d = new Date(ms), p = n => String(n).padStart(2, '0');
    return `WoWScrnShot_${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCFullYear() % 100)}_${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}.jpg`;
  });
}

/** The report's steps with their shutter poses and the shot files each can name. */
export function reportSteps(saved) {
  const rep = saved.FidelityEMatrix_Report || {};
  const steps = Array.isArray(rep.steps) ? rep.steps : Object.values(rep.steps || {});
  return steps.map((s, n) => ({
    index: n + 1, step: s.step, label: s.label, at: s.at,
    screenshot: s.screenshot ?? null, shots: shotNames(s.screenshot),
    twin: s.twin ? { screenshot: s.twin.screenshot ?? null, shots: shotNames(s.twin.screenshot), pose: s.twin.pose ?? null } : null,
    pose: s.pose ?? null,
  }));
}

/**
 * Matches a report's shots to the files the report holds, in time order: each shot takes the earliest unused
 * file among the two names it can have (its stamp's second or the next). Two shots in one second write one
 * file, and the later overwrites the earlier: when a shot finds no file and the shot just before it took one
 * of its own names, the file is the later shot's and the earlier shot is marked overwritten. Sets s.shot,
 * s.twin.shot and, where it applies, s.overwritten / s.twin.overwritten.
 */
export function assignShots(steps, files) {
  const have = new Set(files), used = new Set(), slots = [];
  for (const s of steps) {
    if (s.shots && s.shots.length) slots.push({ owner: s, names: s.shots });
    if (s.twin && s.twin.shots && s.twin.shots.length) slots.push({ owner: s.twin, names: s.twin.shots });
  }
  slots.forEach((slot, n) => {
    slot.owner.shot = slot.names.find(f => have.has(f) && !used.has(f)) || null;
    if (slot.owner.shot) { used.add(slot.owner.shot); return; }
    const prev = slots[n - 1];
    if (prev && prev.owner.shot && slot.names.includes(prev.owner.shot)) {
      slot.owner.shot = prev.owner.shot;
      prev.owner.shot = null;
      prev.owner.overwritten = true;
    }
  });
  return steps;
}
