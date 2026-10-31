// Restores `_` subscripts the Drive import dropped without leaving an italic marker.
// Only rewrites patterns that are never valid LaTeX without `_`, inside $...$ / $$...$$ spans.
// Usage: node fix_residual_subscripts.mjs <file.md>...   (prints every change)
import fs from 'node:fs';

const RULES = [
  // \mathbf{x}{\text{..}} / \mathcal{L}{\text{..}} / \hat{..}{..}  -> subscript
  [/(\\(?:mathbf|mathcal|boldsymbol|hat)\{[^{}]+\})\{(\\text\{|[A-Za-z0-9,\\])/g, '$1_{$2'],
  // single-letter symbol directly followed by {\text{..}} : N{\text{total}} -> N_{\text{total}}
  [/(^|[^A-Za-z\\])([A-Za-z])\{\\text\{/g, '$1$2_{\\text{'],
  // norm subscript: |...|2 or |...|2^2 -> |..|_2
  [/\|2(?=[\s^}&)])/g, '|_2'],
  // \mathbf{s}c / \mathbf{s}b inside norms (single trailing index letter)
  [/(\\mathbf\{s\})([bc])(?=\|)/g, '$1_$2'],
];

for (const file of process.argv.slice(2)) {
  let text = fs.readFileSync(file, 'utf8');
  let changes = 0;
  text = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, span => {
    let out = span;
    for (const [re, rep] of RULES) out = out.replace(re, rep);
    if (out !== span) {
      changes++;
      console.log(`${file.split(/[\\/]/).pop()}:\n  - ${span.slice(0, 160)}\n  + ${out.slice(0, 160)}`);
    }
    return out;
  });
  fs.writeFileSync(file, text);
  console.log(`${file.split(/[\\/]/).pop()}: ${changes} math spans repaired`);
}
