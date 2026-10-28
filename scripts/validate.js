#!/usr/bin/env node
/*
  validate.js — mechanical guard for the site's content schema (CONTENT_SPEC.md).

  Runs with no dependencies: `node scripts/validate.js` from the repo root.
  Exits non-zero (and prints every problem) if any check fails, so it can gate
  a commit. It does NOT judge prose or design — only the things a machine can
  prove: syntax, unique ids, resolvable cross-links, registry/page wiring, and
  that every map chip / theory / vuln link points at something real.

  This is the backstop for the one failure mode humans and Claude both hit:
  adding content without wiring it into the web of the site (CONTENT_SPEC §10).
*/

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const JS = (f) => path.join(ROOT, 'assets', 'js', f);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// --- load a browser-style data file into a sandbox and return its globals ---
function loadGlobals(file) {
  const abs = JS(file);
  let src;
  try {
    src = fs.readFileSync(abs, 'utf8');
  } catch (e) {
    err(`[load] cannot read ${file}: ${e.message}`);
    return {};
  }
  const sandbox = { window: {}, document: { addEventListener() {} }, console };
  sandbox.window.addEventListener = () => {};
  try {
    vm.runInNewContext(src, sandbox, { filename: file, timeout: 5000 });
  } catch (e) {
    err(`[syntax] ${file}: ${e.message}`); // same failure `node --check` would catch
    return {};
  }
  // merge top-level vars (var X =) and window.X assignments
  return Object.assign({}, sandbox, sandbox.window);
}

// --- helpers ---------------------------------------------------------------
function fileExists(relFromRoot) {
  // strip query string + fragment: "tool-detail.html?tool=x#y" -> "tool-detail.html"
  const clean = String(relFromRoot).split('#')[0].split('?')[0];
  if (!clean) return true; // pure anchor / query — nothing to check on disk
  return fs.existsSync(path.join(ROOT, clean));
}
function queryId(url, key) {
  const m = String(url).match(new RegExp('[?&]' + key + '=([^&#]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function dupes(arr) {
  const seen = new Set(), dup = new Set();
  for (const x of arr) (seen.has(x) ? dup : seen).add(x);
  return [...dup];
}
function readHtml(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { return null; }
}

// --- load every data file --------------------------------------------------
// toolkit.js / vulns.js are grouped by category: [{category, tools|vulns:[...]}]
const toolkitRaw = loadGlobals('toolkit.js').TOOLKIT || [];
const vulnsRaw   = loadGlobals('vulns.js').VULNS || [];
const toolkit = toolkitRaw.flatMap((c) => (c && c.tools) || []);
const vulns   = vulnsRaw.flatMap((c) => (c && c.vulns) || []);
const webmap  = loadGlobals('webmap.js').WEB_MAP || null;
const admap   = loadGlobals('admap-v2.js').AD_MAP_V2 || null;
const privmap = loadGlobals('windows-privesc-map.js').PRIVMAP_DATA || null;
const theory  = loadGlobals('theory.js').THEORY || [];
const posts   = loadGlobals('posts.js').POSTS || [];

const toolIds = new Set(toolkit.map((t) => t && t.id).filter(Boolean));
const vulnIds = new Set(vulns.map((v) => v && v.id).filter(Boolean));

// --- 1. unique ids within each data file -----------------------------------
for (const [name, ids] of [
  ['toolkit.js', toolkit.map((t) => t && t.id)],
  ['vulns.js', vulns.map((v) => v && v.id)],
]) {
  const d = dupes(ids.filter(Boolean));
  if (d.length) err(`[dup-id] ${name}: duplicate id(s): ${d.join(', ')}`);
}

// --- 2. hand-written registries: file exists + includes main.js ------------
function checkRegistry(name, list) {
  const urls = [];
  for (const entry of list) {
    if (!entry || !entry.url) { err(`[registry] ${name}: entry missing url: ${JSON.stringify(entry)}`); continue; }
    urls.push(entry.url);
    if (!fileExists(entry.url)) {
      err(`[registry] ${name}: "${entry.title || entry.url}" -> ${entry.url} does not exist on disk`);
      continue;
    }
    const html = readHtml(entry.url.split('#')[0].split('?')[0]);
    if (html && !/assets\/js\/main\.js/.test(html)) {
      err(`[page] ${entry.url}: hand-written page must include <script src="../assets/js/main.js">`);
    }
  }
  const d = dupes(urls);
  if (d.length) err(`[dup-url] ${name}: duplicate url(s): ${d.join(', ')}`);
}
checkRegistry('theory.js', theory);
checkRegistry('posts.js', posts);

// --- 3. web checklist chips resolve to real toolkit/vuln ids ---------------
if (webmap && Array.isArray(webmap.sections)) {
  for (const sec of webmap.sections)
    for (const grp of sec.groups || [])
      for (const item of grp.items || []) {
        for (const t of item.tools || [])
          if (t.id && !toolIds.has(t.id))
            err(`[webmap] check "${item.text}": tool chip id "${t.id}" not in toolkit.js`);
        for (const v of item.vulns || [])
          if (v.id && !vulnIds.has(v.id))
            err(`[webmap] check "${item.text}": vuln chip id "${v.id}" not in vulns.js`);
      }
}

// --- 4. guided maps: moveTo sections + theory/vuln links resolve -----------
function checkGuidedMap(name, map) {
  if (!map || !Array.isArray(map.sections)) return;
  const sectionIds = new Set(map.sections.map((s) => s.id));
  for (const sec of map.sections)
    for (const tech of sec.techniques || []) {
      for (const mv of tech.moveTo || [])
        if (mv.section && !sectionIds.has(mv.section))
          err(`[${name}] technique "${tech.id}": moveTo.section "${mv.section}" is not a real section id`);
      for (const link of [tech.theory, tech.vuln])
        if (link && link.url && !fileExists(link.url)) {
          err(`[${name}] technique "${tech.id}": link ${link.url} does not resolve to a file`);
        }
      // if a link targets a detail page by id, that id must exist
      if (tech.vuln && tech.vuln.url) {
        const tId = queryId(tech.vuln.url, 'tool'), vId = queryId(tech.vuln.url, 'vuln');
        if (tId && !toolIds.has(tId)) err(`[${name}] technique "${tech.id}": tool=${tId} not in toolkit.js`);
        if (vId && !vulnIds.has(vId)) err(`[${name}] technique "${tech.id}": vuln=${vId} not in vulns.js`);
      }
    }
}
checkGuidedMap('admap', admap);
checkGuidedMap('privmap', privmap);

// --- 5. vuln -> theory links resolve ---------------------------------------
for (const v of vulns) {
  if (v && v.theory && v.theory.url && !fileExists(v.theory.url))
    err(`[vulns] "${v.id}": theory link ${v.theory.url} does not resolve to a file`);
}

// --- 6. soft check: new theory/vuln reachable from a map or checklist ------
// (warning only — a brand-new entry may legitimately not be wired yet)
const referencedVulnIds = new Set();
if (webmap) for (const s of webmap.sections || []) for (const g of s.groups || []) for (const i of g.items || []) for (const v of i.vulns || []) if (v.id) referencedVulnIds.add(v.id);
for (const m of [admap, privmap]) if (m) for (const s of m.sections || []) for (const t of s.techniques || []) if (t.vuln && t.vuln.url) { const id = queryId(t.vuln.url, 'vuln'); if (id) referencedVulnIds.add(id); }
for (const v of vulns) {
  if (v && v.id && !referencedVulnIds.has(v.id))
    warn(`[orphan] vuln "${v.id}" is not referenced by any checklist or map chip (wire it in per CONTENT_SPEC §10, or ignore if intentional)`);
}

// --- report ----------------------------------------------------------------
if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log('   ' + w);
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s) — content schema violated:`);
  for (const e of errors) console.error('   ' + e);
  console.error('\nSee CONTENT_SPEC.md. Fix the above before committing.\n');
  process.exit(1);
}
console.log(`\n✓ content schema OK — ${toolkit.length} tools, ${vulns.length} vulns, ${theory.length} theory, ${posts.length} posts; all cross-links resolve.\n`);
