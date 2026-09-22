/*
  Renders assets/js/vulns.js (window.VULNS) into vulns.html, with a live
  search box that filters by vulnerability name + description.

  Each card gets:
    - a severity tag
    - a "Details" button -> vuln-detail.html?vuln=<id>
    - an optional "Reference" link -> vuln.ref (external, new tab)

  You never need to edit this file -- edit vulns.js instead.
*/

(function () {
  const listEl = document.getElementById("vulns-list");
  if (!listEl) return;

  const data = Array.isArray(window.VULNS) ? window.VULNS : [];
  const searchEl = document.getElementById("vulns-search");
  const countEl = document.getElementById("vuln-count");

  const total = data.reduce((sum, cat) => sum + cat.vulns.length, 0);
  if (countEl) countEl.textContent = total;

  const externalIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
  const bookIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

  function sevClass(sev) {
    return "sev sev-" + String(sev || "info").toLowerCase();
  }

  function render(query) {
    const q = (query || "").trim().toLowerCase();
    listEl.innerHTML = "";
    let anyVisible = false;

    data.forEach(cat => {
      const matches = cat.vulns.filter(v =>
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        cat.category.toLowerCase().includes(q)
      );
      if (matches.length === 0) return;
      anyVisible = true;

      const section = document.createElement("div");
      section.className = "toolkit-category";

      const heading = document.createElement("h2");
      heading.className = "toolkit-category-title";
      heading.textContent = cat.category;
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "tool-grid";

      matches.forEach(v => {
        const card = document.createElement("div");
        card.className = "tool-card";

        const name = document.createElement("div");
        name.className = "tool-card-name";
        const sev = v.severity ? `<span class="${sevClass(v.severity)}">${escapeHtml(v.severity)}</span>` : "";
        name.innerHTML = `<span>${escapeHtml(v.name)}</span>${sev}`;

        const desc = document.createElement("p");
        desc.className = "tool-card-desc";
        desc.textContent = v.description;

        const actions = document.createElement("div");
        actions.className = "tool-card-actions";

        const hasGuide = v.id && (
          (Array.isArray(v.sections) && v.sections.some(sec =>
            (Array.isArray(sec.rows) && sec.rows.length > 0) ||
            (Array.isArray(sec.commands) && sec.commands.length > 0) ||
            (Array.isArray(sec.items) && sec.items.length > 0)
          )) || v.brief
        );
        if (hasGuide) {
          const detailBtn = document.createElement("a");
          detailBtn.className = "tool-btn tool-btn-primary";
          detailBtn.href = `vuln-detail.html?vuln=${encodeURIComponent(v.id)}`;
          detailBtn.innerHTML = `Details ${bookIcon}`;
          actions.appendChild(detailBtn);
        }

        if (v.ref) {
          const refBtn = document.createElement("a");
          refBtn.className = "tool-btn tool-btn-secondary";
          refBtn.href = v.ref;
          refBtn.target = "_blank";
          refBtn.rel = "noopener";
          refBtn.innerHTML = `Reference ${externalIcon}`;
          actions.appendChild(refBtn);
        }

        card.appendChild(name);
        card.appendChild(desc);
        card.appendChild(actions);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      listEl.appendChild(section);
    });

    if (!anyVisible) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "// no entries match \"" + query + "\"";
      listEl.appendChild(empty);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  if (searchEl) {
    searchEl.addEventListener("input", (e) => render(e.target.value));
  }

  render("");
})();
