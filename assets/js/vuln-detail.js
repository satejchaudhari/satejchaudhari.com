/*
  Renders a single vulnerability's full reference page on vuln-detail.html,
  based on the ?vuln=<id> query parameter. Looks up the matching entry in
  assets/js/vulns.js (window.VULNS) by its `id` field.

  Structure: header (category / severity / name / description / Reference +
  Related theory + Back), Overview (from `brief`), Key Payloads / Indicators
  (from `quickReference`), a sticky quick-nav, then the collapsible
  `sections` (table / commands / notes), plus a live search over the page.

  You never need to edit this file -- edit vulns.js instead.
*/

(function () {
  const root = document.getElementById("vuln-detail-root");
  if (!root) return;

  const data = Array.isArray(window.VULNS) ? window.VULNS : [];
  const params = new URLSearchParams(window.location.search);
  const id = params.get("vuln");

  let found = null;
  let foundCategory = null;
  for (const cat of data) {
    const match = (cat.vulns || []).find(v => v.id === id);
    if (match) { found = match; foundCategory = cat.category; break; }
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
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  if (!found) {
    root.innerHTML = `
      <p class="eyebrow">Vulnerabilities</p>
      <h1 class="page-title">Entry not found</h1>
      <p class="page-lede">Couldn't find an entry matching "${escapeHtml(id || "")}". It may have been renamed or removed.</p>
      <p style="margin-top: 24px;"><a href="vulns.html" class="btn btn-ghost">&larr; Back to vulns</a></p>
    `;
    document.title = "Not found — Satej Chaudhari";
    return;
  }

  document.title = found.name + " — Vulns & Misconfigs — Satej Chaudhari";

  const sections = Array.isArray(found.sections) ? found.sections : [];
  const quickRef = Array.isArray(found.quickReference) ? found.quickReference : [];
  const sev = found.severity
    ? `<span class="sev sev-${escapeAttr(String(found.severity).toLowerCase())}" style="margin-left:10px;vertical-align:middle;">${escapeHtml(found.severity)}</span>`
    : "";

  let html = `
    <p class="eyebrow">${escapeHtml(foundCategory)}</p>
    <h1 class="page-title">${escapeHtml(found.name)}${sev}</h1>
    <p class="page-lede">${escapeHtml(found.description || "")}</p>
    <div class="hero-actions" style="margin: 24px 0 8px;">
  `;
  if (found.ref) {
    html += `<a class="btn btn-primary" href="${escapeAttr(found.ref)}" target="_blank" rel="noopener">External reference</a>`;
  }
  if (found.theory) {
    html += `<a class="btn btn-ghost" href="${escapeAttr(found.theory)}">Related theory</a>`;
  }
  html += `<a class="btn btn-ghost" href="vulns.html">&larr; Back to vulns</a></div>`;

  if (found.brief) {
    const paragraphs = String(found.brief).split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join("");
    html += `
      <div class="tool-detail-section" id="overview">
        <h2 class="tool-detail-section-title">Overview</h2>
        <div class="tool-detail-brief">${paragraphs}</div>
      </div>
    `;
  }

  if (quickRef.length > 0) {
    html += `
      <div class="tool-detail-section" id="key-payloads">
        <h2 class="tool-detail-section-title">Key Payloads &amp; Indicators</h2>
        ${renderCommands(quickRef)}
      </div>
    `;
  }

  const navLinks = [];
  if (found.brief) navLinks.push({ label: "Overview", id: "overview" });
  if (quickRef.length > 0) navLinks.push({ label: "Key Payloads", id: "key-payloads" });
  sections.forEach(sec => navLinks.push({ label: sec.title, id: slugify(sec.title) }));

  if (navLinks.length > 0) {
    html += `<nav class="tool-detail-quicknav" aria-label="Jump to section">`;
    navLinks.forEach(l => {
      html += `<a href="#${escapeAttr(l.id)}" data-jump="${escapeAttr(l.id)}">${escapeHtml(l.label)}</a>`;
    });
    html += `</nav>`;
  }

  html += `
    <input
      type="text"
      id="vuln-detail-search"
      class="toolkit-search"
      placeholder="Search every row, payload, and note on this page…"
      aria-label="Search this entry"
      style="margin-top: 24px;"
    >
    <p id="vuln-detail-search-status" class="search-status"></p>
  `;

  html += `<div class="tool-detail-sections">`;
  sections.forEach(sec => {
    const slug = slugify(sec.title);
    html += `<details class="tool-detail-section" id="${escapeAttr(slug)}" open>`;
    html += `<summary class="tool-detail-section-title">${escapeHtml(sec.title)}</summary>`;
    if (sec.type === "table") html += renderTable(sec);
    else if (sec.type === "commands") html += renderCommands(sec.commands || []);
    else if (sec.type === "notes") html += renderNotes(sec.items || []);
    else if (sec.type === "references") html += renderReferences(sec.items || []);
    html += `</details>`;
  });
  html += `</div>`;
  html += `<div id="vuln-detail-empty" class="empty-state" style="display:none;"></div>`;

  root.innerHTML = html;

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
    items.forEach(item => { out += `<li>${escapeHtml(item)}</li>`; });
    out += `</ul>`;
    return out;
  }

  function renderReferences(items) {
    let out = `<ul class="tool-detail-notes tool-detail-refs">`;
    items.forEach(item => {
      if (typeof item === "string") {
        out += `<li><a href="${escapeAttr(item)}" target="_blank" rel="noopener">${escapeHtml(item)}</a></li>`;
      } else {
        const label = escapeHtml(item.label || item.url || "");
        const url = escapeAttr(item.url || "#");
        out += `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`;
      }
    });
    out += `</ul>`;
    return out;
  }

  root.querySelectorAll(".tool-detail-quicknav a[data-jump]").forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.jump);
      if (target && target.tagName === "DETAILS") target.open = true;
    });
  });

  const searchEl = document.getElementById("vuln-detail-search");
  const statusEl = document.getElementById("vuln-detail-search-status");
  const emptyEl = document.getElementById("vuln-detail-empty");

  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      let totalVisible = 0;
      root.querySelectorAll(".tool-detail-sections > .tool-detail-section").forEach(sectionEl => {
        let sectionHasMatch = false;
        sectionEl.querySelectorAll("tbody tr").forEach(tr => {
          const match = !q || tr.textContent.toLowerCase().includes(q);
          tr.classList.toggle("is-hidden", !match);
          if (match) { sectionHasMatch = true; totalVisible++; }
        });
        sectionEl.querySelectorAll(".command-block").forEach(block => {
          const match = !q || block.textContent.toLowerCase().includes(q);
          block.classList.toggle("is-hidden", !match);
          if (match) { sectionHasMatch = true; totalVisible++; }
        });
        sectionEl.querySelectorAll(".tool-detail-notes li").forEach(li => {
          const match = !q || li.textContent.toLowerCase().includes(q);
          li.classList.toggle("is-hidden", !match);
          if (match) { sectionHasMatch = true; totalVisible++; }
        });
        sectionEl.classList.toggle("is-hidden", q.length > 0 && !sectionHasMatch);
        if (q.length > 0 && sectionHasMatch && sectionEl.tagName === "DETAILS") sectionEl.open = true;
      });
      root.querySelectorAll(".tool-detail-quicknav a[data-jump]").forEach(link => {
        const target = document.getElementById(link.dataset.jump);
        const isRefSection = target && target.parentElement && target.parentElement.classList.contains("tool-detail-sections");
        if (isRefSection) link.classList.toggle("is-hidden", target.classList.contains("is-hidden"));
      });
      if (statusEl) statusEl.textContent = q ? `${totalVisible} match${totalVisible === 1 ? "" : "es"}` : "";
      if (emptyEl) {
        if (q && totalVisible === 0) { emptyEl.style.display = ""; emptyEl.textContent = `// nothing on this page matches "${e.target.value.trim()}"`; }
        else emptyEl.style.display = "none";
      }
    });
  }

  /* ---------- scroll-spy: highlight the quick-nav chip for the section
     currently in view, and keep it visible in the horizontal strip ---------- */
  (function setupScrollSpy() {
    const quicknav = root.querySelector(".tool-detail-quicknav");
    if (!quicknav) return;
    const items = Array.prototype.slice.call(quicknav.querySelectorAll("a[data-jump]"))
      .map(link => ({ link: link, section: document.getElementById(link.dataset.jump) }))
      .filter(x => x.section);
    if (items.length === 0) return;

    let activeId = null;
    let ticking = false;

    function update() {
      ticking = false;
      const line = quicknav.getBoundingClientRect().bottom + 14;
      let current = null;
      items.forEach(it => {
        if (it.link.classList.contains("is-hidden")) return;
        if (it.section.getBoundingClientRect().top <= line) current = it;
      });
      if (!current) {
        current = items.find(it => !it.link.classList.contains("is-hidden")) || null;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        for (let i = items.length - 1; i >= 0; i--) {
          if (!items[i].link.classList.contains("is-hidden")) { current = items[i]; break; }
        }
      }
      if (!current || current.section.id === activeId) return;
      activeId = current.section.id;
      items.forEach(it => it.link.classList.toggle("is-active", it === current));
      const cl = current.link;
      const target = cl.offsetLeft - (quicknav.clientWidth - cl.offsetWidth) / 2;
      quicknav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  })();
})();
