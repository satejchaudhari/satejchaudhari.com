# Guidance for AI agents working in this repo

**Before creating or editing any site content — a toolkit tool, a vuln/misconfig,
a theory page, a writeup/post, a web-checklist item, or an AD attack-path node —
read [`CONTENT_SPEC.md`](CONTENT_SPEC.md) and follow it.** It is the canonical
schema: it defines every content type's model, required and optional fields, the
section types each page supports, the mandatory page structure for hand-written
pages, cross-linking rules, and the validation that makes a change "done".

Quick orientation:

- This is a **static site, no build step.** Edit a data file (`assets/js/*.js`)
  or a hand-written HTML page (`theory/*.html`, `posts/*.html`), save, refresh.
  GitHub Pages deploys on push to `main`.
- **Data-driven** content (toolkit, vulns, web map, AD map) lives in a `*.js`
  data array/object; a generic `*-main.js` / `*-detail.js` renderer draws it —
  never edit the renderer, edit the data.
- **Hand-written** content (theory, writeups) is a standalone `.html` page **plus**
  one registry entry in `assets/js/theory.js` / `assets/js/posts.js`. Both edits
  are mandatory, and the page must include `<script src="../assets/js/main.js">`.
- Before committing: run `node scripts/validate.js` (must exit 0), then
  `node --check` on every changed `assets/js/*.js`, serve locally
  (`python3 -m http.server 8099`), and confirm the list page **and** the
  detail/page render and every link resolves. See `CONTENT_SPEC.md` §2.

## Non-negotiables (true even if you have not re-read the spec this turn)

These are the rules that get dropped when the conversation is compacted. They
hold regardless — if any is unclear, re-read `CONTENT_SPEC.md` before editing.
There is a **`site-content` skill** that reloads the full schema and these
steps; invoke it (or follow it) for any content change.

1. **Never edit a `*-main.js` / `*-detail.js` renderer** to add content — edit
   the matching `*.js` data file.
2. **Hand-written page = TWO edits:** the `.html` file **and** its registry
   entry (`theory.js` / `posts.js`), and the page includes `main.js`. Posts go
   newest-at-top (manual order).
3. **Wire new content into the maps — nothing auto-updates.** A new vuln/tool is
   invisible to the web/AD/privesc maps until you add its `id`-chip or link by
   hand, and set reciprocal `theory:`/`vuln:` links (`CONTENT_SPEC.md` §10).
   Every chip `id` and map link **must** resolve to a real entry/file.
4. **House style:** British/International English in prose; commands verbatim;
   `id`s lowercase-hyphenated and unique; never repurpose an existing `id`.
5. **Done means `node scripts/validate.js` exits 0** and the pages render.

When a request conflicts with `CONTENT_SPEC.md`, follow the spec or flag the
conflict. When the spec is silent, match the nearest existing high-quality entry
in the same data file.
