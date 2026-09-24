/*
  Renders assets/js/toolkit.js (window.TOOLKIT) into toolkit.html,
  with a live search box that filters by tool name + description.

  Each tool card gets:
    - a "Visit site" button/link → tool.url (opens in a new tab)
    - a "Full guide" button → tool-detail.html?tool=<tool.id>
      (only shown if the tool has an `id` and at least one non-empty section)

  You never need to edit this file — edit toolkit.js instead.
*/

(function () {
  const listEl = document.getElementById("toolkit-list");
  if (!listEl) return;

  const data = Array.isArray(window.TOOLKIT) ? window.TOOLKIT : [];
  const searchEl = document.getElementById("toolkit-search");
  const countEl = document.getElementById("tool-count");
  const navEl = document.getElementById("toolkit-nav");

  function slug(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function cardId(tool) { return "tool-" + (tool.id || slug(tool.name)); }

  const totalTools = data.reduce((sum, cat) => sum + cat.tools.length, 0);
  if (countEl) countEl.textContent = totalTools;

  const externalIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
  const terminalIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;

  function render(query) {
    const q = (query || "").trim().toLowerCase();
    listEl.innerHTML = "";
    let anyVisible = false;
    const navGroups = [];

    data.forEach(cat => {
      const matches = cat.tools.filter(t =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
      if (matches.length === 0) return;

      anyVisible = true;
      navGroups.push({ category: cat.category, tools: matches.map(t => ({ name: t.name, target: cardId(t) })) });

      const section = document.createElement("div");
      section.className = "toolkit-category";

      const heading = document.createElement("h2");
      heading.className = "toolkit-category-title";
      heading.textContent = cat.category;
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "tool-grid";

      matches.forEach(tool => {
        const card = document.createElement("div");
        card.className = "tool-card";
        card.id = cardId(tool);

        const name = document.createElement("div");
        name.className = "tool-card-name";
        name.innerHTML = `<span>${escapeHtml(tool.name)}</span>`;

        const desc = document.createElement("p");
        desc.className = "tool-card-desc";
        desc.textContent = tool.description;

        const actions = document.createElement("div");
        actions.className = "tool-card-actions";

        const visitBtn = document.createElement("a");
        visitBtn.className = "tool-btn tool-btn-primary";
        visitBtn.href = tool.url;
        visitBtn.target = "_blank";
        visitBtn.rel = "noopener";
        visitBtn.innerHTML = `Visit site ${externalIcon}`;
        actions.appendChild(visitBtn);

        const hasGuide = tool.id && Array.isArray(tool.sections) &&
          tool.sections.some(sec =>
            (Array.isArray(sec.rows) && sec.rows.length > 0) ||
            (Array.isArray(sec.commands) && sec.commands.length > 0) ||
            (Array.isArray(sec.items) && sec.items.length > 0)
          );
        if (hasGuide) {
          const cmdBtn = document.createElement("a");
          cmdBtn.className = "tool-btn tool-btn-secondary";
          cmdBtn.href = `tool-detail.html?tool=${encodeURIComponent(tool.id)}`;
          cmdBtn.innerHTML = `Full guide ${terminalIcon}`;
          actions.appendChild(cmdBtn);
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
      empty.textContent = "// no tools match \"" + query + "\"";
      listEl.appendChild(empty);
    }

    buildNav(navGroups);
  }

  let hoverTimer = null;
  function scrollToCard(id, smooth) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    el.classList.add("tool-card-flash");
    setTimeout(() => el.classList.remove("tool-card-flash"), 900);
  }

  function buildNav(groups) {
    if (!navEl) return;
    navEl.innerHTML = "";
    if (!groups.length) return;
    groups.forEach(g => {
      const h = document.createElement("p");
      h.className = "toolkit-nav-cat";
      h.textContent = g.category;
      navEl.appendChild(h);
      g.tools.forEach(t => {
        const a = document.createElement("a");
        a.className = "toolkit-nav-item";
        a.href = "#" + t.target;
        a.textContent = t.name;
        // hover the name -> scroll the list to the tool (debounced); click -> jump
        a.addEventListener("mouseenter", () => {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => scrollToCard(t.target, true), 120);
        });
        a.addEventListener("mouseleave", () => clearTimeout(hoverTimer));
        a.addEventListener("click", (e) => { e.preventDefault(); scrollToCard(t.target, true); });
        navEl.appendChild(a);
      });
    });
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