# CONTENT_SPEC — the content schema for satejchaudhari.com

> **Read this first.** Before creating or extending **any** piece of content on
> this site — a toolkit tool, a vuln/misconfig, a theory page, a writeup, a
> checklist item, or an AD attack-path node — use this document as the baseline
> for *what fields exist, what each section must contain, and how the page is
> wired up*. It is the single source of truth for the content schema. If a
> request conflicts with this spec, follow the spec (or flag the conflict); if
> the spec is silent, match the nearest existing example in the same data file.

This is a **static site, no build step.** You edit a data file or an HTML file,
save, refresh — that is the whole pipeline. GitHub Pages deploys on push to
`main`.

---

## 1. The two content models

Every content type falls into one of two models. Know which one you are editing
before you touch anything.

| Model | What it is | You edit | Rendered by (never edit) |
|---|---|---|---|
| **Data-driven** | A JS array/object of plain objects; a generic renderer builds every page from it | the `*.js` data file | the matching `*-main.js` / `*-detail.js` |
| **Hand-written page** | A standalone `.html` file written by hand, plus one registry entry | the `.html` file **and** its registry object | the list renderer (`theory-main.js` / `main.js`) |

| Content type | Model | Data / page you edit | Registry | Renderer |
|---|---|---|---|---|
| Toolkit tool | data-driven | `assets/js/toolkit.js` | (same file) | `toolkit-main.js`, `tool-detail.js` |
| Vuln / misconfig | data-driven | `assets/js/vulns.js` | (same file) | `vulns-main.js`, `vuln-detail.js` |
| Web pentest checklist | data-driven | `assets/js/webmap.js` | (same file) | `webmap-main.js` |
| AD attack path | data-driven | `assets/js/admap-v2.js` | (same file) | `admap-v2-main.js` |
| Theory page | hand-written | `theory/<file>.html` | `assets/js/theory.js` | `theory-main.js` (list only) |
| Writeup / post | hand-written | `posts/<file>.html` | `assets/js/posts.js` | `main.js` (list only) |

Templates to copy for hand-written pages:
`theory/theory-template.html`, `posts/post-template.html`.

---

## 2. Global conventions (apply to everything)

- **Slugs / `id`:** lowercase, hyphenated, unique within the file
  (`http-parameter-pollution`, `kerberoasting`). The `id` powers detail-page
  URLs (`vuln-detail.html?vuln=<id>`, `tool-detail.html?tool=<id>`) — never
  change an existing one without updating every link to it.
- **Dates:** `"YYYY-MM-DD"`. For theory, it is a "last updated" marker; for
  posts it is the publish date. Both list orders are **manual** (array order),
  not auto-sorted — put newest at the **top** of `posts.js`.
- **File naming** for hand-written pages: `YYYY-MM-DD-slug.html`
  (e.g. `theory/2026-08-18-kerberos.html`, `posts/2026-10-02-adds-setup.html`).
- **Language:** British/International English in prose is the house style
  (`authorisation`, `behaviour`, `colour`) — match the surrounding file.
  Command syntax, flags, and vendor names stay exactly as the tool spells them.
- **Tone:** field-reference, not blog-chatty. Precise, operator-focused, no
  filler. Every claim should be technically correct and verifiable — this is a
  reference people act on.
- **Links must resolve.** Internal links are checked; a broken internal link is
  a defect. External URLs (official site, OWASP, GitHub, CVE) must be correct
  and current — verify before publishing.
- **Authorised-use framing.** Offensive content is for authorised testing and
  study. Keep the existing disclaimer framing; do not add operational guidance
  aimed at illegal targeting.
- **Images:** store screenshots as `.webp` (≈65% smaller than PNG, no visible loss) under `assets/img/<slug>/`, reference them with a real `alt`, and keep the social-card `og-default.png` as the one PNG. 
- **No secrets** in any file (no real tokens, creds, internal hostnames beyond
  lab examples).

### Validation before every commit (run from repo root)

```bash
# 1. Every data/renderer JS file must parse
for f in assets/js/*.js; do node --check "$f" || echo "SYNTAX ERROR: $f"; done

# 2. Serve locally and eyeball the page you changed
python3 -m http.server 8099   # then open http://localhost:8099/<page>

# 3. For a data file, confirm the detail page renders and the new id resolves:
#    http://localhost:8099/vuln-detail.html?vuln=<id>
#    http://localhost:8099/tool-detail.html?tool=<id>
```

A change is **done** only when: the JS parses, the new entry renders on both its
list card and (if applicable) its detail page, every link it adds resolves, and
the prose is correct and proof-read.

---

## 3. Shared section schema (Toolkit + Vulns)

Both `toolkit.js` and `vulns.js` entries carry a `sections: []` array. The detail
renderers (`tool-detail.js`, `vuln-detail.js`) support **exactly four** section
types. Anything else renders nothing.

```js
// type: "table"  — 2+ column reference (flags, options, mappings, impact)
{ title: "Options", type: "table",
  columns: ["Flag", "Description"],
  rows: [ ["-x", "what it does"], ["-y <n>", "..."] ]   // each row length === columns length
}

// type: "commands"  — named, ready-to-run sequences (\n for multi-line; # lines dim)
{ title: "Common Workflows", type: "commands",
  commands: [ { label: "Workflow name", cmd: "step one\nstep two" } ]
}

// type: "notes"  — plain bullet list, no code styling
{ title: "Notes & Tips", type: "notes",
  items: [ "A point.", "Another point." ]
}

// type: "references"  — external links, rendered as a list of <a target="_blank">
{ title: "References", type: "references",
  items: [ { label: "OWASP — HPP", url: "https://owasp.org/..." } ]
}
```

Rules:
- `rows` arrays **must** match `columns` length and order.
- `references` items are `{ label, url }` — **not** plain strings (plain strings
  render blank).
- Order sections from **concept → where to look → how to test → impact → tools →
  references → remediation** (the established flow; see any mature vuln entry).

---

## 4. Toolkit tool — `assets/js/toolkit.js`

A curated field-reference entry, **not** a link-directory row. Add to an existing
`{ category, tools: [...] }` block or create a new one.

```js
{
  id:          "unique-slug",        // REQUIRED — tool-detail.html?tool=<id>
  name:        "Tool Name",          // REQUIRED
  url:         "https://official",   // REQUIRED — "Visit site" button; verify it
  description: "One line for the grid card.",   // REQUIRED

  brief:       "Overview paragraph(s). \\n\\n between paragraphs.",  // optional
  quickReference: [                  // optional — always-visible rapid box
    { label: "What this does", cmd: "the command or action" }
  ],
  sections: [ /* §3 section objects */ ]   // optional — the bulk of the page
}
```

- Minimum viable tool: `id`, `name`, `url`, `description`.
- The card shows a **"Guide"** button only when `sections` has content — a tool
  with real depth should always have `sections`.
- Keep `quickReference` to the 3–5 most-used invocations.
- Every tool should end with a `references` section (official repo/docs).

**Definition of done:** parses; appears on `toolkit.html` (card + correct
category + search); `tool-detail.html?tool=<id>` renders brief, quick-reference,
and all sections; `url` and all reference URLs are live.

---

## 5. Vuln / misconfig — `assets/js/vulns.js`

Same shape as a tool (so the same machinery works). Add to the correct
`{ category, vulns: [...] }` block or create a new one.

```js
{
  id:          "unique-slug",        // REQUIRED — vuln-detail.html?vuln=<id>
  name:        "Vulnerability Name", // REQUIRED
  severity:    "Critical",           // REQUIRED — one of: Critical | High | Medium | Low | Info
  description: "One line for the grid card.",   // REQUIRED

  ref:         "https://...",        // optional — external reference button (OWASP/CWE/advisory)
  theory:      "theory/<file>.html", // optional — "Deep dive" button to a theory page (must exist)
  brief:       "Overview paragraph(s). \\n\\n between paragraphs.",  // optional but expected
  quickReference: [                  // optional — payloads / indicators
    { label: "...", cmd: "payload or indicator" }
  ],
  sections: [ /* §3 section objects */ ]   // expected — the depth of the entry
}
```

- `severity` is a fixed enum — use those exact strings (they drive the colour
  badge and filter).
- A full-depth entry carries, in order, sections for: **Root Cause & Concepts**
  (notes) → **Where to Look** (notes) → **How It's Tested** (commands) → an
  **Impact** table → a **Tools Used** table → **References** → **Remediation**
  (notes). Match that spine; omit a section only if it genuinely does not apply.
- Set `theory:` **only** if the target theory page actually exists and is on the
  same topic — a wrong/absent link is a defect.
- Key quoting: both quoted (`"id"`) and unquoted (`id`) keys appear in the file.
  Either is valid JS — **be consistent within the block you are editing.**

**Definition of done:** parses; card shows on `vulns.html` with the right
severity badge and category; `vuln-detail.html?vuln=<id>` renders every section;
`ref`/`theory`/reference links resolve.

---

## 6. Theory page — `theory/<file>.html` + `assets/js/theory.js`

A hand-written explainer. **Two edits are mandatory:** the HTML file *and* the
registry entry. Copy `theory/theory-template.html` to start.

### 6a. Registry entry (`assets/js/theory.js`, order = list order)

```js
{
  title:       "Topic Title",
  url:         "theory/YYYY-MM-DD-slug.html",   // relative to theory.html
  date:        "YYYY-MM-DD",
  tag:         "AD",            // free text; drives filter chips. Existing tags:
                                // FUNDAMENTALS / AI / RECON / AD / Red Team / Evasion
  description: "One-line summary shown on the card.",
  readTime:    "9 min read"     // optional; keep it honest to the length
}
```

### 6b. Page structure (every theory page MUST have, in order)

1. `<head>` with correct `<title>` (`Topic — Satej Chaudhari`), meta description,
   the favicon/fonts/`style.css` links, **and the inline theme + nav-toggle
   `<script>`** (copy verbatim from the template — it powers the theme toggle and
   mobile menu).
2. `<header class="site-header">` nav block (copy verbatim).
3. `<main class="wrap post">` → `<a class="post-back" href="../theory.html">`.
4. `<article>` → `<header class="post-header">` with
   `<span class="tag">`, `<h1 class="post-title">`, `<p class="post-meta">`
   (a `<time>` + `· N min read`). **The tag here should match the registry `tag`.**
5. `<div class="post-body">` — the content. These elements are pre-styled, use
   them directly: `<p> <h2> <h3> <ul>/<ol> <pre><code> <table> <blockquote>
   <figure>/<img> <a>`. `<h2>` gets an automatic divider — use `<h2>`s to break
   up the page.
6. **"Related reading" block** — the last section of `post-body`, linking 2–5 of
   the most relevant sibling theory pages (and optionally a key vuln/tool/post):
   ```html
   <h2>Related reading</h2>
   <ul class="related-list">
     <li><a href="2026-08-18-kerberos.html">Kerberos Authentication</a></li>
     <li><a href="2026-08-18-ntlm.html">NTLM Authentication</a></li>
   </ul>
   ```
   Every theory page should have one — no page should be a navigation dead end.
   `.related-list` is styled in `style.css`; links are **relative within
   `theory/`** (`2026-...html`), or `../posts/...` / `../vulns.html#...` to leave it.
7. `<footer class="site-footer">` (copy verbatim).
8. **`<script src="../assets/js/main.js"></script>` immediately before
   `</body>`.** This is mandatory — without it the theme toggle and mobile nav
   are dead. (Six pages were missing it; do not reintroduce that.)

**Definition of done:** registered in `theory.js`; `theory.html` shows the card
under the right tag; the page renders with working theme toggle + mobile nav;
`post-back`, every cross-link, and the Related-reading links all resolve.

---

## 7. Writeup / post — `posts/<file>.html` + `assets/js/posts.js`

A hand-written long-form writeup. Copy `posts/post-template.html`. **Two edits:**
the HTML file *and* the registry entry.

### 7a. Registry entry (`assets/js/posts.js`, newest at the TOP)

```js
{
  title:       "Post Title",
  url:         "posts/YYYY-MM-DD-slug.html",   // relative to the linking page
  date:        "YYYY-MM-DD",
  type:        "writeup",        // the ONLY post type — always "writeup"
  tag:         "Active Directory",  // free text; drives the filter buttons
  description: "One-line summary under the title.",
  readTime:    "20 min read"     // optional
}
```

> **`type` note:** `writeup` is the site's only post type (renders on
> `writeups.html` and the homepage preview). The former `blog` type and
> `blog.html` have been dropped — always use `writeup`.

### 7b. Page structure

Identical skeleton to a theory page (§6b items 1–5, 7–8) **except**:
- `post-back` points at `../writeups.html` (`&larr; back to writeups`).
- The `post-header` tag should match the registry `tag`.
- Images: put files under `assets/img/<post-slug>/`, reference them as
  `../assets/img/<post-slug>/name.png`, wrap in
  `<figure><img alt="..."><figcaption>…</figcaption></figure>` (caption optional).
  **Always set a meaningful `alt`.**
- `main.js` include before `</body>` is mandatory (same reason as theory).

**Definition of done:** registered in `posts.js` (at the top); shows on
`writeups.html` + homepage preview; page renders with working nav/theme; all
images load and have `alt`; all links resolve.

---

## 8. Web pentest checklist — `assets/js/webmap.js`

A colour-coded, tickable checklist (progress saved in the browser). Model:

```
WEB_MAP = {
  meta: { title, note },
  sections: [ {                      // a PHASE (Recon, etc.)
    id, title, color: "#hex", tag, desc,
    groups: [ {                      // a GROUP of related checks
      id, title,
      scenario: "when to test this group",
      items: [ {                     // a single CHECK
        text: "the check, short plain English",
        desc: "one-line note",
        tools: [ { n: "Name", id: "toolkit-id"? } ],   // id links to Toolkit; omit id = placeholder chip
        vulns: [ { n: "Name", id: "vuln-id"? } ]        // id links to Vulns; omit id = placeholder chip
      } ]
    } ]
  } ]
}
```

- A `tools`/`vulns` chip **with** an `id` links into that Toolkit/Vulns entry —
  the id **must exist** in `toolkit.js`/`vulns.js` or the renderer throws. Omit
  `id` for a not-yet-wired placeholder chip.
- `color` is a hex string per phase; keep the existing palette feel.
- Keep each check short and actionable; the "why" goes in `desc`, the "when" in
  the group `scenario`.

---

## 9. AD attack path — `assets/js/admap-v2.js`

A guided playbook of access sections → techniques → commands/outcomes/pivots.
Model:

```
AD_MAP_V2 = {
  meta: { title, version, note },
  palette: { name: "#hex", ... },          // shared outcome colours — reuse, don't invent
  sections: [ {                             // an ACCESS LEVEL
    id, title, color: "#hex", tag, desc,
    techniques: [ {
      id, title,
      theory: { label, url } | null,        // link to a theory page if one exists
      cve:    { id, label?, url? } | null,  // renders a CVE banner
      desc:   "short note" | null,
      cmds:   [ "command", ... ],           // lines starting # are dimmed comments
      branches: [ { label, warn?:bool, cmds:[], outcomes:[] } ],   // optional
      outcomes: [ { label, color: "#hex" } ],      // colour-coded result badges
      moveTo:   [ { section, label?, note? } ]     // pivot to another section id
    } ]
  } ]
}
```

- `moveTo.section` and any linked `section`/`id` must reference real ids.
- Outcome colours come from `palette` — reuse the named scheme for consistency.
- `theory.url` should point at an existing theory page.

---

## 10. Cross-linking rules (the web of the site)

- **Theory ↔ Vulns:** a vuln may link to a theory page via `theory:`; a theory
  page may link to a vuln via `../vulns.html#<id>` or inline prose. Keep them
  reciprocal where it makes sense.
- **Checklist / AD map → Toolkit & Vulns:** chips with `id` are hard links;
  the id must exist. When you add a tool/vuln that a checklist references by a
  placeholder, wire up the `id`.
- **Theory → Theory:** the Related-reading block (§6b.6) is the standard
  mechanism; prefer it over scattering links only in prose.
- Before publishing, confirm **every** id you referenced resolves to a real
  entry, and every relative path points at a real file.

---

## 11. Quick checklist for an AI executing a "create X" request

1. Identify the content type and its model (§1). Open the right data file / copy
   the right template.
2. Build the object/page against the schema here, matching the nearest existing
   high-quality example for depth and tone.
3. Fill **every required field**; add the expected optional depth (`brief`,
   `sections`, Related-reading, references).
4. For hand-written pages, do **both** edits (HTML **and** registry) and include
   `main.js`.
5. Verify all ids and links resolve; verify external URLs.
6. Run validation (§2): `node --check` all JS, serve locally, open the list page
   **and** the detail/page.
7. Proof-read the prose (correctness + house-style English).
8. Commit with a clear, scoped message and push to `main`.
