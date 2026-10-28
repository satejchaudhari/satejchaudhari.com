---
name: site-content
description: >-
  Create or edit ANY content on satejchaudhari.com — a toolkit tool, a
  vuln/misconfig, a theory page, a writeup/post, a web-checklist item, or an
  attack-map node (AD map, Windows/Linux privesc map, cloud map, red-team
  workflow). Use this whenever the request adds, changes, or extends site
  content, OR asks to wire new material into a map. Loads the content schema
  and the mandatory cross-link + validation steps so standards hold even after
  the conversation has been compacted.
---

# Editing content on satejchaudhari.com

This site has strict, easy-to-forget conventions. Follow this every time you
touch content — do not rely on remembering a spec you read earlier in the
conversation; **re-read it now.**

## Step 0 — ALWAYS re-read the schema first

Read **`CONTENT_SPEC.md`** (repo root) before editing. It is the single source
of truth for every field, section type, and the page structure. This matters
most *after a compaction*: the summary keeps the gist and drops the specifics,
so treat the spec as unread and open it again.

## The non-negotiables (these are what get dropped)

1. **Know the model before you touch anything.** Data-driven content (toolkit,
   vulns, web map, AD map, privesc/cloud maps) lives in `assets/js/*.js` as a
   data array/object; a `*-main.js` / `*-detail.js` renderer draws it. **Edit
   the data file, NEVER the renderer.** Hand-written content (theory, posts)
   is a standalone `.html` page PLUS a registry entry.

2. **Hand-written pages need BOTH edits + `main.js`.** A new theory page =
   `theory/<file>.html` **and** an entry in `assets/js/theory.js`. A new post =
   `posts/<file>.html` **and** an entry in `assets/js/posts.js` (newest at the
   TOP — order is manual, not sorted). The HTML must include
   `<script src="../assets/js/main.js">`. One edit without the other = broken.

3. **Wire it into the web of the site (CONTENT_SPEC §10) — this is the step
   that silently gets skipped.** Nothing auto-updates; a new entry is invisible
   to the maps until you link it by hand:
   - New **vuln/misconfig** → add a `vulns` chip (with its `id`) to the relevant
     check in `webmap.js`, and/or link it from the relevant technique in the AD
     / privesc map. Add a reciprocal `theory:` link if a theory page covers it.
   - New **tool** → wire up any placeholder chip in `webmap.js` that referenced
     it by `id`.
   - New **technique on a map** → set its `theory:` / `vuln:` links to real
     pages/ids; every `moveTo.section` must name a real section id.
   - New **theory page** → add a "Related reading" block linking 2–5 sibling
     theory pages, and back-link from any vuln it explains.
   - A chip `id` in a map/checklist **must** exist in `toolkit.js` / `vulns.js`
     or the renderer throws. Omit `id` only for a deliberate placeholder.

4. **House style:** British/International English in prose (`authorisation`,
   `behaviour`, `colour`); commands/flags/vendor names verbatim. Field-reference
   tone, not blog-chatty. Slugs/`id`s lowercase-hyphenated and unique; never
   change an existing `id` without updating every link to it. Dates `YYYY-MM-DD`.

5. **Match the nearest existing high-quality entry** in the same data file for
   depth and structure when the spec is silent.

## Step N — validate before you call it done

Run, from the repo root:

```
node scripts/validate.js       # schema + cross-link gate — must exit 0
```

It checks syntax, unique ids, registry wiring, `main.js` inclusion, and that
**every map/checklist chip and theory/vuln link resolves**. It also prints
`[orphan]` warnings for any vuln not referenced by a map or checklist — treat
each as a prompt to wire it in (step 3), unless it is genuinely standalone.

Then do the manual pass from CONTENT_SPEC §2 / §11: `node --check` any changed
JS, serve locally (`python3 -m http.server 8099`), and confirm **both** the
list page and the detail/page render and every link resolves.

Only after `validate.js` exits 0 and the pages render is the change done.
