/*
  Renders assets/js/vulns.js (window.VULNS) into vulns.html as a scalable
  catalog: a sticky sidebar (search + category list with live counts +
  severity filter) on the left, and the entries grouped by category with
  coloured headers on the right.

  Each card: severity tag, "Details" -> vuln-detail.html?vuln=<id>, and an
  optional external "Reference" link. Built to stay usable at hundreds of
  entries — filtering by category/severity/search is instant.

  You never need to edit this file -- edit vulns.js instead.
*/

(function () {
  const listEl = document.getElementById("vulns-list");
  if (!listEl) return;

  const data = Array.isArray(window.VULNS) ? window.VULNS : [];
  const navEl = document.getElementById("vulns-nav");
  const sevBarEl = document.getElementById("vulns-sev");
  const searchEl = document.getElementById("vulns-search");
  const countEl = document.getElementById("vuln-count");
  const shownEl = document.getElementById("vulns-shown");

  const total = data.reduce((sum, cat) => sum + cat.vulns.length, 0);
  if (countEl) countEl.textContent = total;

  const HUES = ["hue-red","hue-violet","hue-blue","hue-teal","hue-green","hue-amber","hue-orange","hue-cyan","hue-rose","hue-slate"];
  const hueOf = {};
  data.forEach((cat, i) => { hueOf[cat.category] = HUES[i % HUES.length]; });

  const SEV_ORDER = ["Critical", "High", "Medium", "Low", "Info"];

  const externalIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
  const bookIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

  let activeCat = "ALL";
  let activeSev = "ALL";
  let query = "";

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }
  function sevClass(sev) { return "sev sev-" + String(sev || "info").toLowerCase(); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function matchVuln(v, cat) {
    const q = query.trim().toLowerCase();
    const okCat = activeCat === "ALL" || cat.category === activeCat;
    const okSev = activeSev === "ALL" || String(v.severity || "").toLowerCase() === activeSev.toLowerCase();
    const okQ = !q ||
      v.name.toLowerCase().includes(q) ||
      (v.description || "").toLowerCase().includes(q) ||
      cat.category.toLowerCase().includes(q);
    return okCat && okSev && okQ;
  }

  function hasGuide(v) {
    return v.id && (
      (Array.isArray(v.sections) && v.sections.some(sec =>
        (Array.isArray(sec.rows) && sec.rows.length > 0) ||
        (Array.isArray(sec.commands) && sec.commands.length > 0) ||
        (Array.isArray(sec.items) && sec.items.length > 0)
      )) || v.brief
    );
  }

  function buildCard(v) {
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

    if (hasGuide(v)) {
      const b = document.createElement("a");
      b.className = "tool-btn tool-btn-primary";
      b.href = `vuln-detail.html?vuln=${encodeURIComponent(v.id)}`;
      b.innerHTML = `Details ${bookIcon}`;
      actions.appendChild(b);
    }
    if (v.ref) {
      const b = document.createElement("a");
      b.className = "tool-btn tool-btn-secondary";
      b.href = v.ref; b.target = "_blank"; b.rel = "noopener";
      b.innerHTML = `Reference ${externalIcon}`;
      actions.appendChild(b);
    }

    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(actions);
    return card;
  }

  function render() {
    listEl.innerHTML = "";
    let shown = 0;

    data.forEach(cat => {
      const matches = cat.vulns.filter(v => matchVuln(v, cat));
      if (matches.length === 0) return;
      shown += matches.length;

      const group = document.createElement("section");
      group.className = "cat-group " + (hueOf[cat.category] || "");
      group.id = "cat-" + slug(cat.category);

      const head = document.createElement("div");
      head.className = "cat-group-head";
      head.innerHTML =
        `<span class="cat-group-bar"></span>` +
        `<h2 class="cat-group-title">${escapeHtml(cat.category)}</h2>` +
        `<span class="cat-group-count">${matches.length}</span>`;
      group.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "tool-grid";
      matches.forEach(v => grid.appendChild(buildCard(v)));
      group.appendChild(grid);

      listEl.appendChild(group);
    });

    if (shownEl) shownEl.textContent =
      shown === total ? `${total} entries` : `${shown} of ${total} entries`;

    if (shown === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = query.trim()
        ? '// no entries match "' + query.trim() + '"'
        : "// no entries match this filter";
      listEl.appendChild(empty);
    }
  }

  /* ---------- sidebar: categories ---------- */
  function countForCat(catName) {
    let n = 0;
    data.forEach(cat => {
      if (catName !== "ALL" && cat.category !== catName) return;
      n += cat.vulns.filter(v => {
        const q = query.trim().toLowerCase();
        const okSev = activeSev === "ALL" || String(v.severity || "").toLowerCase() === activeSev.toLowerCase();
        const okQ = !q || v.name.toLowerCase().includes(q) || (v.description || "").toLowerCase().includes(q) || cat.category.toLowerCase().includes(q);
        return okSev && okQ;
      }).length;
    });
    return n;
  }

  function buildNav() {
    if (!navEl) return;
    navEl.innerHTML = "";
    const mk = (catName, label, hue) => {
      const b = document.createElement("button");
      b.className = "catalog-nav-item" + (hue ? " " + hue : "") + (activeCat === catName ? " active" : "");
      b.dataset.cat = catName;
      b.innerHTML = `<span class="dot"></span><span class="label">${escapeHtml(label)}</span><span class="count">${countForCat(catName)}</span>`;
      b.addEventListener("click", () => {
        activeCat = catName;
        navEl.querySelectorAll(".catalog-nav-item").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        render();
        listEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return b;
    };
    navEl.appendChild(mk("ALL", "All categories", ""));
    data.forEach(cat => navEl.appendChild(mk(cat.category, cat.category, hueOf[cat.category])));
  }

  function refreshNavCounts() {
    if (!navEl) return;
    navEl.querySelectorAll(".catalog-nav-item").forEach(item => {
      const el = item.querySelector(".count");
      if (el) el.textContent = countForCat(item.dataset.cat);
    });
  }

  /* ---------- sidebar: severity filter ---------- */
  function buildSevFilter() {
    if (!sevBarEl) return;
    const present = SEV_ORDER.filter(s =>
      data.some(cat => cat.vulns.some(v => String(v.severity || "").toLowerCase() === s.toLowerCase()))
    );
    sevBarEl.innerHTML = "";
    const mk = (sev, label) => {
      const b = document.createElement("button");
      b.className = "filter-btn" + (activeSev === sev ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        activeSev = sev;
        sevBarEl.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        refreshNavCounts();
        render();
      });
      return b;
    };
    sevBarEl.appendChild(mk("ALL", "All"));
    present.forEach(s => sevBarEl.appendChild(mk(s, s)));
  }

  if (searchEl) {
    searchEl.addEventListener("input", e => {
      query = e.target.value;
      refreshNavCounts();
      render();
    });
  }

  buildNav();
  buildSevFilter();
  render();
})();
