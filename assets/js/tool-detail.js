/*
  Renders a single tool's detail view on tool-detail.html, based on the
  ?tool=<id> query parameter. Looks up the matching entry in
  assets/js/toolkit.js (window.TOOLKIT) by its `id` field.

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
    div.textContent = str;
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
  }

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

  let html = `
    <p class="eyebrow">${escapeHtml(foundCategory)}</p>
    <h1 class="page-title">${escapeHtml(found.name)}</h1>
    <p class="page-lede">${escapeHtml(found.description || "")}</p>
  `;

  if (found.brief) {
    html += `<div class="tool-detail-brief"><p>${escapeHtml(found.brief)}</p></div>`;
  }

  html += `
    <div class="hero-actions" style="margin: 28px 0 8px;">
      <a class="btn btn-primary" href="${escapeAttr(found.url)}" target="_blank" rel="noopener">Visit official site</a>
      <a class="btn btn-ghost" href="toolkit.html">&larr; Back to toolkit</a>
    </div>
  `;

  if (Array.isArray(found.commands) && found.commands.length > 0) {
    html += `<div class="tool-detail-commands">`;
    found.commands.forEach(c => {
      html += `
        <div class="command-block">
          ${c.label ? `<p class="command-label">${escapeHtml(c.label)}</p>` : ""}
          <pre><code>${escapeHtml(c.cmd)}</code></pre>
        </div>
      `;
    });
    html += `</div>`;
  }

  root.innerHTML = html;
})();
