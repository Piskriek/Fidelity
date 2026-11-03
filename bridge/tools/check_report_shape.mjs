#!/usr/bin/env node
// Checks that a pull request description carries a shape-B report (bridge/PIPELINE_FRACTAL.md section 6B):
// the headings REPORT, LEAD and INSIGHTS TO ROUTE, each with something under it.
//
//   PR_BODY="$text" node bridge/tools/check_report_shape.mjs [--github]
//   node bridge/tools/check_report_shape.mjs --body-file <file|->
//
// A heading is the label at the start of a line, in capitals ("LEAD  ...", also inside a code fence or a quote),
// or a Markdown heading or bold label in any case ("## Lead", "**Insights to route**"). A label in a sentence is not one.
// Exit 0 ok, 1 not ok, 2 usage. Standalone on purpose (see privacy_scan.mjs).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const REQUIRED = ['REPORT', 'LEAD', 'INSIGHTS TO ROUTE'];
const LABELS = ['VALUE CHOICES FOR THE OWNER', 'LESSONS FOR THE ROSTER', 'INSIGHTS TO ROUTE', 'DONE / NOT DONE', 'NOT DONE',
  'VIEWPOINTS', 'REPORT', 'ASKED', 'CLAIMS', 'CHECKS', 'DROPPED', 'LIMITS', 'LEAD', 'DONE'];
const MIN_ALNUM = { REPORT: 3, LEAD: 20, 'INSIGHTS TO ROUTE': 4 }; // "none" is a valid insights field; an empty heading is not
const LEAD_LIMIT = 400;

const BOUNDARY = '(?=$|[:\\s\\u00b7|\\-\\u2013\\u2014*_`)])';

// Returns { label, rest } when the line opens a template label, else null.
export function labelOf(line) {
  let s = line.replace(/^[\s>]+/, '');
  let marked = false;
  const strip = (re) => { const t = s.replace(re, ''); if (t !== s) { s = t; return true; } return false; };
  if (strip(/^#{1,6}\s*/)) marked = true;
  strip(/^(?:[-*+]|\d+\.)\s+/);
  if (strip(/^(?:\*\*|__)\s*/)) marked = true;
  strip(/^`+/);
  for (const label of LABELS) {
    const cap = new RegExp(`^${label.replace(/[/ ]/g, (c) => (c === ' ' ? '\\s+' : '\\/'))}${BOUNDARY}`);
    const loose = new RegExp(cap.source, 'i');
    if (cap.test(s) || (marked && loose.test(s))) {
      const rest = s.replace(loose, '').replace(/^[\s:*_`|\u00b7\-\u2013\u2014]+/, '');
      return { label, rest };
    }
  }
  return null;
}

const alnum = (t) => (t.replace(/<[^>]*>/g, ' ').match(/[A-Za-z0-9\u00c0-\uffff]/g) || []).length;

export function checkReportShape(body) {
  const text = String(body ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n');
  const sections = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const hit = labelOf(line);
    if (hit) {
      cur = hit.label;
      if (!(cur in sections)) sections[cur] = { content: hit.rest };
      else cur = null; // a repeated label: keep the first
      continue;
    }
    if (/^\s{0,3}#{1,6}\s/.test(line)) { cur = null; continue; }
    if (cur) sections[cur].content += `\n${line}`;
  }
  const missing = [], empty = [], warnings = [];
  for (const need of REQUIRED) {
    if (!(need in sections)) missing.push(need);
    else if (alnum(sections[need].content) < MIN_ALNUM[need]) empty.push(need);
  }
  if (sections.LEAD) {
    const lead = sections.LEAD.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (lead.length > LEAD_LIMIT) warnings.push(`LEAD is ${lead.length} characters; a relay keeps the first ${LEAD_LIMIT}, so the lead should stand alone inside them`);
  }
  return { ok: !missing.length && !empty.length, missing, empty, warnings, found: Object.keys(sections) };
}

export function describe(r) {
  if (r.ok) return `report shape: ok (found ${r.found.join(', ')})`;
  const parts = [];
  if (r.missing.length) parts.push(`missing: ${r.missing.join(', ')}`);
  if (r.empty.length) parts.push(`nothing under: ${r.empty.join(', ')}`);
  return `report shape: not ok (${parts.join('; ')}). The description needs a shape-B report: bridge/PIPELINE_FRACTAL.md section 6B (REPORT, LEAD, INSIGHTS TO ROUTE at least; any field may read "none").`;
}

function main(argv) {
  let body = process.env.PR_BODY;
  let github = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--body-file') body = readFileSync(argv[++i] === '-' ? 0 : argv[i], 'utf8');
    else if (argv[i] === '--github') github = true;
    else { console.error(`unknown argument: ${argv[i]}`); return 2; }
  }
  const r = checkReportShape(body);
  console.log(describe(r));
  for (const w of r.warnings) console.log(`warning: ${w}`);
  if (github) {
    if (!r.ok) console.log(`::error title=Report shape::${describe(r)}`);
    for (const w of r.warnings) console.log(`::warning title=Report shape::${w}`);
  }
  return r.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
