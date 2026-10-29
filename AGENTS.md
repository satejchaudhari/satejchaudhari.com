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
- Before committing: run `node --check` on every changed `assets/js/*.js`, serve
  locally (`python3 -m http.server 8099`), and confirm the list page **and** the
  detail/page render and every link resolves. See `CONTENT_SPEC.md` §2.

**Always meet the quality bar.** New content is measured against the richest
existing entry of its type (`CONTENT_SPEC.md` §2a) — match or beat it; never ship
a thin stub next to a deep neighbour.

**Always keep the maps in sync (do not skip this, even after compaction).**
Whenever you add or materially change a tool, a vuln/misconfig, a theory
technique, or a new **bypass / privilege-escalation / GUI method**, you MUST — in
the same change — surface it in the relevant interactive map **and** link the
page back to that map:

- web tool/technique → `assets/js/webmap.js`
- AD technique → `assets/js/admap-v2.js`
- Windows/Linux privesc primitive, token privilege, service/kernel abuse, or
  GUI/bypass method → `assets/js/windows-privesc-map.js` /
  `assets/js/linux-privesc-map.js`
- cloud technique → `assets/js/cloudmap.js`

A feature that exists only on its detail page but nowhere in the maps is **not
done**. Maps navigate only via `moveTo`, so every stage except the first needs an
incoming `moveTo` (no orphans), and each stage should stay broad enough to guide a
stuck operator (several techniques, an "Out of ideas?" checklist node). Full
schema and rules: `CONTENT_SPEC.md` §9a.

When a request conflicts with `CONTENT_SPEC.md`, follow the spec or flag the
conflict. When the spec is silent, match the nearest existing high-quality entry
in the same data file.
