// docx (word/document.xml) -> markdown, tuned for Google Docs exports of markdown sources.
// Restores `_` subscripts that markdown->Docs import consumed as italics (in math paragraphs),
// re-fences code blocks (monospace or box-drawing paragraphs), and rebuilds YAML frontmatter.
// Usage: node docx2md.mjs <extracted_dir> <out.md>
import fs from 'node:fs';
import path from 'node:path';

const [dir, out] = process.argv.slice(2);
const xml = fs.readFileSync(path.join(dir, 'word', 'document.xml'), 'utf8');
let styles = '';
try { styles = fs.readFileSync(path.join(dir, 'word', 'styles.xml'), 'utf8'); } catch {}

const styleName = {};
for (const m of styles.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g)) {
  const n = m[2].match(/<w:name w:val="([^"]+)"/);
  if (n) styleName[m[1]] = n[1];
}

const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const PRIVATE_USE = /[-]/g;
const isOn = (body, tag) => new RegExp(`<w:${tag}/>|<w:${tag} w:val="(1|true)"/>`).test(body);

// Returns [{text, bold, italic, mono}] for a paragraph body.
function runs(p) {
  const outRuns = [];
  for (const r of p.matchAll(/<w:hyperlink\b[^>]*>([\s\S]*?)<\/w:hyperlink>|<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
    if (r[1] !== undefined) { outRuns.push(...runs(r[1])); continue; }
    const body = r[2];
    let s = '';
    for (const x of body.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
      if (x[0] === '<w:tab/>') s += '\t'; else if (x[0] === '<w:br/>') s += '\n'; else s += dec(x[1]);
    }
    s = s.replace(PRIVATE_USE, '');
    if (!s) continue;
    outRuns.push({
      text: s,
      bold: isOn(body, 'b'),
      italic: isOn(body, 'i'),
      mono: /Courier|Consolas|Mono/i.test(body.match(/<w:rFonts[^>]*>/)?.[0] ?? ''),
    });
  }
  return outRuns;
}

function render(rs) {
  const plain = rs.map(r => r.text).join('');
  const math = plain.includes('$') || /\\[a-zA-Z]+/.test(plain);
  let t = '';
  let prevItalic = false;
  for (const r of rs) {
    let s = r.text;
    if (math) {
      // Italic run boundaries are where `_` pairs were consumed: restore them.
      if (r.italic !== prevItalic) t += '_';
      prevItalic = r.italic;
    }
    if (r.mono && s.trim()) s = '`' + s + '`';
    else if (r.bold && s.trim()) s = '**' + s + '**';
    else if (!math && r.italic && s.trim()) s = '*' + s + '*';
    t += s;
  }
  if (math && prevItalic) t += '_';
  return t.replace(/\*\*\*\*/g, '').replace(/``/g, '');
}

function para(p) {
  const sid = p.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? '';
  const name = (styleName[sid] ?? sid).toLowerCase();
  const rs = runs(p);
  const plain = rs.map(r => r.text).join('');
  if (rs.length && rs.every(r => r.mono || !r.text.trim()) && plain.trim()) return { code: plain };
  // Tree / spider-diagram lines lost their monospace font but are still diagram lines.
  if (/^[├└│|]/.test(plain.trim()) || /[├└]──/.test(plain)) return { code: plain };
  const text = render(rs);
  const h = name.match(/heading\s*(\d)/) || sid.match(/^Heading(\d)$/);
  if (h && text.trim()) return { text: '#'.repeat(+h[1]) + ' ' + text.replace(/\*\*/g, '').trim() };
  if (name === 'title' && text.trim()) return { text: '# ' + text.replace(/\*\*/g, '').trim() };
  const lvl = p.match(/<w:numPr>[\s\S]*?<w:ilvl w:val="(\d+)"/);
  if (lvl && text.trim()) return { text: '  '.repeat(+lvl[1]) + '- ' + text };
  return { text };
}

const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)[1];
const blocks = [];
const re = /<w:tbl>([\s\S]*?)<\/w:tbl>|<w:p\b[^>]*\/>|<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
for (const m of body.matchAll(re)) {
  if (m[1] !== undefined) {
    const rows = [...m[1].matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)].map(r =>
      [...r[1].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)].map(c =>
        [...c[1].matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map(pp => render(runs(pp[1]))).join(' ').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()));
    if (!rows.length) continue;
    const lines = ['', '| ' + rows[0].join(' | ') + ' |', '|' + rows[0].map(() => '---').join('|') + '|', ...rows.slice(1).map(r => '| ' + r.join(' | ') + ' |'), ''];
    blocks.push({ text: lines.join('\n') });
  } else {
    blocks.push(para(m[2] ?? ''));
  }
}

const lines = [];
let inCode = false;
for (const b of blocks) {
  if (b.code !== undefined) {
    if (!inCode) { lines.push('```'); inCode = true; }
    lines.push(b.code.replace(/^`|`$/g, ''));
  } else {
    if (inCode) { lines.push('```'); inCode = false; }
    lines.push(b.text);
  }
}
if (inCode) lines.push('```');

let md = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
// Google Docs folds YAML frontmatter into one "## name: x description: y" heading.
md = md.replace(/^## name: (\S+) description: (.+)\n/, (_, n, d) => `---\nname: ${n}\ndescription: ${d.trim()}\n---\n`);
fs.writeFileSync(out, md.endsWith('\n') ? md : md + '\n');
console.log(path.basename(out), md.length, 'chars', md.split('\n').length, 'lines');
