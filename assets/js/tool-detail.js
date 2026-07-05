/*
  Renders a single tool's full reference page on tool-detail.html, based
  on the ?tool=<id> query parameter. Looks up the matching entry in
  assets/js/toolkit.js (window.TOOLKIT) by its `id` field.

  Page structure built here:
    - header (category / name / description / Visit site + Back buttons)
    - Overview (from `brief`) — always visible, not collapsible
    - Quick Reference (from `quickReference`) — always visible, not collapsible
    - a sticky quick-nav bar, one chip per section below
    - `sections` — each rendered as a collapsible <details>, as a
      table (flags/options/concepts), a command list (workflows), or
      a plain notes list, depending on its `type`
    - a single search box that filters every row/command/note on the
      page live, hiding whatever doesn't match and hiding a section
      entirely if nothing in it matches

  You never need to edit this file — edit toolkit.js instead.
*/

(function () {
  const root = document.getElementById("tool-detail-root");
  if (!root) return;

  const data = Array.isArray(window.TOOLKIT) ? window.TOOLKIT : [];
  const params = new URLSearchParams(window.location.search);
  const id = params.get("tool");

  let found = null;
  let foundCategory = null;

  for (const cat of data) {
    const match = (cat.tools || []).find(t => t.id === id);
    if (match) {
      found = match;
      foundCategory = cat.category;
      break;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str == null ? "" : str);
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return String(str == null ? "" : str).replace(/"/g, "&quot;");
  }
  function slugify(str) {
    return String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /* ---------- not found ---------- */
  if (!found) {
    root.innerHTML = `
      <p class="eyebrow">Toolkit</p>
      <h1 class="page-title">Tool not found</h1>
      <p class="page-lede">Couldn't find a tool matching "${escapeHtml(id || "")}". It may have been renamed or removed.</p>
      <p style="margin-top: 24px;"><a href="toolkit.html" class="btn btn-ghost">&larr; Back to toolkit</a></p>
    `;
    document.title = "Tool not found — Satej Chaudhari";
    return;
  }

  document.title = found.name + " — Toolkit — Satej Chaudhari";

  const sections = Array.isArray(found.sections) ? found.sections : [];
  const quickRef = Array.isArray(found.quickReference) ? found.quickReference : [];

  /* ---------- header ---------- */
  let html = `
    <p class="eyebrow">${escapeHtml(foundCategory)}</p>
    <h1 class="page-title">${escapeHtml(found.name)}</h1>
    <p class="page-lede">${escapeHtml(found.description || "")}</p>
    <div class="hero-actions" style="margin: 24px 0 8px;">
      <a class="btn btn-primary" href="${escapeAttr(found.url)}" target="_blank" rel="noopener">Visit official site</a>
      <a class="btn btn-ghost" href="toolkit.html">&larr; Back to toolkit</a>
    </div>
  `;

  /* ---------- overview (not collapsible) ---------- */
  if (found.brief) {
    const paragraphs = String(found.brief).split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join("");
    html += `
      <div class="tool-detail-section" id="overview">
        <h2 class="tool-detail-section-title">Overview</h2>
        <div class="tool-detail-brief">${paragraphs}</div>
      </div>
    `;
  }

  /* ---------- quick reference (not collapsible) ---------- */
  if (quickRef.length > 0) {
    html += `
      <div class="tool-detail-section" id="quick-reference">
        <h2 class="tool-detail-section-title">Quick Reference</h2>
        ${renderCommands(quickRef)}
      </div>
    `;
  }

  /* ---------- quick-nav bar ---------- */
  const navLinks = [];
  if (found.brief) navLinks.push({ label: "Overview", id: "overview" });
  if (quickRef.length > 0) navLinks.push({ label: "Quick Reference", id: "quick-reference" });
  sections.forEach(sec => navLinks.push({ label: sec.title, id: slugify(sec.title) }));

  if (navLinks.length > 0) {
    html += `<nav class="tool-detail-quicknav" aria-label="Jump to section">`;
    navLinks.forEach(l => {
      html += `<a href="#${escapeAttr(l.id)}" data-jump="${escapeAttr(l.id)}">${escapeHtml(l.label)}</a>`;
    });
    html += `</nav>`;
  }

  /* ---------- search box ---------- */
  html += `
    <input
      type="text"
      id="tool-detail-search"
      class="toolkit-search"
      placeholder="Search every flag, command, and note on this page…"
      aria-label="Search this tool's reference"
      style="margin-top: 24px;"
    >
    <p id="tool-detail-search-status" class="search-status"></p>
  `;

  /* ---------- collapsible reference sections ---------- */
  html += `<div class="tool-detail-sections">`;
  sections.forEach(sec => {
    const slug = slugify(sec.title);
    html += `<details class="tool-detail-section" id="${escapeAttr(slug)}" open>`;
    html += `<summary class="tool-detail-section-title">${escapeHtml(sec.title)}</summary>`;

    if (sec.type === "table") {
      html += renderTable(sec);
    } else if (sec.type === "commands") {
      html += renderCommands(sec.commands || []);
    } else if (sec.type === "notes") {
      html += renderNotes(sec.items || []);
    }

    html += `</details>`;
  });
  html += `</div>`;

  html += `<div id="tool-detail-empty" class="empty-state" style="display:none;"></div>`;

  root.innerHTML = html;

  /* ---------- renderers ---------- */

  function renderTable(sec) {
    const columns = sec.columns || [];
    const rows = sec.rows || [];
    let out = `<div class="tool-detail-table-wrap"><table class="tool-detail-table"><thead><tr>`;
    columns.forEach(c => { out += `<th>${escapeHtml(c)}</th>`; });
    out += `</tr></thead><tbody>`;
    rows.forEach(row => {
      out += `<tr>`;
      row.forEach(cell => { out += `<td>${escapeHtml(cell)}</td>`; });
      out += `</tr>`;
    });
    out += `</tbody></table></div>`;
    return out;
  }

  function renderCommands(commands) {
    let out = `<div class="tool-detail-commands">`;
    commands.forEach(c => {
      out += `
        <div class="command-block">
          ${c.label ? `<p class="command-label">${escapeHtml(c.label)}</p>` : ""}
          <pre><code>${escapeHtml(c.cmd)}</code></pre>
        </div>
      `;
    });
    out += `</div>`;
    return out;
  }

  function renderNotes(items) {
    let out = `<ul class="tool-detail-notes">`;
    items.forEach(item => {
      out += `<li>${escapeHtml(item)}</li>`;
    });
    out += `</ul>`;
    return out;
  }

  /* ---------- quick-nav: force-open a collapsed <details> before jumping ---------- */
  root.querySelectorAll(".tool-detail-quicknav a[data-jump]").forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.jump);
      if (target && target.tagName === "DETAILS") target.open = true;
    });
  });

  /* ---------- live search across tables / commands / notes ---------- */
  const searchEl = document.getElementById("tool-detail-search");
  const statusEl = document.getElementById("tool-detail-search-status");
  const emptyEl = document.getElementById("tool-detail-empty");

  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      let totalVisible = 0;

      root.querySelectorAll(".tool-detail-sections > .tool-detail-section").forEach(sectionEl => {
        let sectionHasMatch = false;

        // table rows
        sectionEl.querySelectorAll("tbody tr").forEach(tr => {
          const text = tr.textContent.toLowerCase();
          const match = !q || text.includes(q);
          tr.classList.toggle("is-hidden", !match);
          if (match) { sectionHasMatch = true; totalVisible++; }
        });

        // command blocks
        sectionEl.querySelectorAll(".command-block").forEach(block => {
          const text = block.textContent.toLowerCase();
          const match = !q || text.includes(q);
          block.classList.toggle("is-hidden", !match);
          if (match) { sectionHasMatch = true; totalVisible++; }
        });

        // notes list items
        sectionEl.querySelectorAll(".tool-detail-notes li").forEach(li => {
          const text = li.textContent.toLowerCase();
          const match = !q || text.includes(q);
          li.classList.toggle("is-hidden", !match);
          if (match) { sectionHasMatch = true; totalVisible++; }
        });

        sectionEl.classList.toggle("is-hidden", q.length > 0 && !sectionHasMatch);
        if (q.length > 0 && sectionHasMatch && sectionEl.tagName === "DETAILS") {
          sectionEl.open = true;
        }
      });

      // quick-nav chips follow section visibility
      root.querySelectorAll(".tool-detail-quicknav a[data-jump]").forEach(link => {
        const target = document.getElementById(link.dataset.jump);
        const isRefSection = target && target.parentElement && target.parentElement.classList.contains("tool-detail-sections");
        if (isRefSection) {
          link.classList.toggle("is-hidden", target.classList.contains("is-hidden"));
        }
      });

      if (statusEl) {
        statusEl.textContent = q ? `${totalVisible} match${totalVisible === 1 ? "" : "es"}` : "";
      }
      if (emptyEl) {
        if (q && totalVisible === 0) {
          emptyEl.style.display = "";
          emptyEl.textContent = `// nothing on this page matches "${e.target.value.trim()}"`;
        } else {
          emptyEl.style.display = "none";
        }
      }
    });
  }
})();
