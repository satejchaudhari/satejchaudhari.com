/*
  Renders assets/js/theory.js (window.THEORY) into theory.html as a
  scalable catalog: a sticky category (tag) sidebar with live counts +
  search on the left, and the topics grouped by category on the right.

  Built to stay fast at hundreds of pages: search matches title + tag +
  description only (instant, no network). The previous version fetched
  the full text of every page on load to power full-text search — that
  does not scale past a few dozen pages, so it was removed. If full-text
  search is wanted later, generate a static search-index.json at build
  time and load that single file instead.

  You never need to edit this file — edit theory.js instead.
*/

(function () {
  const listEl = document.getElementById("theory-list");
  const navEl = document.getElementById("theory-nav");
  const countEl = document.getElementById("entry-count");
  const shownEl = document.getElementById("theory-shown");
  const searchEl = document.getElementById("theory-search");
  if (!listEl) return;

  const topics = Array.isArray(window.THEORY) ? window.THEORY : [];
  if (countEl) countEl.textContent = topics.length;

  const HUES = ["hue-cyan","hue-violet","hue-teal","hue-amber","hue-rose","hue-green","hue-blue","hue-orange","hue-slate","hue-red"];
  const UNTAGGED = "General";

  // stable category order (first appearance), plus a hue per category
  const catOrder = [];
  topics.forEach(t => {
    const c = (t.tag || UNTAGGED).trim() || UNTAGGED;
    if (!catOrder.includes(c)) catOrder.push(c);
  });
  const hueOf = {};
  catOrder.forEach((c, i) => { hueOf[c] = HUES[i % HUES.length]; });

  const searchIndex = {};
  topics.forEach((t, i) => {
    searchIndex[i] = [t.title, t.tag, t.description].filter(Boolean).join(" ").toLowerCase();
  });

  let activeCat = "ALL";
  let query = "";

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }

  function visibleTopics() {
    const q = query.trim().toLowerCase();
    return topics.filter((t, i) => {
      const cat = (t.tag || UNTAGGED).trim() || UNTAGGED;
      const matchesCat = activeCat === "ALL" || cat === activeCat;
      const matchesQuery = !q || (searchIndex[i] || "").includes(q);
      return matchesCat && matchesQuery;
    });
  }

  /* ---------- entry card ---------- */
  function buildEntry(topic) {
    const a = document.createElement("a");
    a.className = "entry";
    a.href = topic.url;

    // title + category on one line (category sits top-right)
    const head = document.createElement("div");
    head.className = "entry-head";

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = topic.title || "Untitled";
    head.appendChild(title);

    if (topic.readTime || topic.tag) {
      const tags = document.createElement("div");
      tags.className = "entry-tags";
      if (topic.readTime) {
        const rt = document.createElement("span");
        rt.className = "entry-read";
        rt.textContent = topic.readTime;
        tags.appendChild(rt);
      }
      if (topic.tag) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = topic.tag;
        tags.appendChild(tag);
      }
      head.appendChild(tags);
    }

    const excerpt = document.createElement("p");
    excerpt.className = "entry-excerpt";
    excerpt.textContent = topic.description || "";

    a.appendChild(head);
    a.appendChild(excerpt);
    return a;
  }

  /* ---------- main column: grouped by category ---------- */
  function renderList() {
    listEl.innerHTML = "";
    const vis = visibleTopics();

    if (shownEl) shownEl.textContent =
      vis.length === topics.length ? `${topics.length} topics`
      : `${vis.length} of ${topics.length} topics`;

    if (vis.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = query.trim()
        ? '// no topics match "' + query.trim() + '"'
        : "// nothing here yet";
      listEl.appendChild(empty);
      return;
    }

    // group visible topics by category, preserving global order
    const groups = {};
    vis.forEach(t => {
      const c = (t.tag || UNTAGGED).trim() || UNTAGGED;
      (groups[c] = groups[c] || []).push(t);
    });

    catOrder.filter(c => groups[c]).forEach(cat => {
      const group = document.createElement("section");
      group.className = "cat-group " + hueOf[cat];
      group.id = "cat-" + slug(cat);

      const head = document.createElement("div");
      head.className = "cat-group-head";
      head.innerHTML =
        `<span class="cat-group-bar"></span>` +
        `<h2 class="cat-group-title">${escapeHtml(cat)}</h2>` +
        `<span class="cat-group-count">${groups[cat].length}</span>`;
      group.appendChild(head);

      const wrap = document.createElement("div");
      wrap.className = "entry-list";
      groups[cat].forEach(t => wrap.appendChild(buildEntry(t)));
      group.appendChild(wrap);

      listEl.appendChild(group);
    });
  }

  /* ---------- sidebar ---------- */
  function countFor(cat) {
    const q = query.trim().toLowerCase();
    return topics.filter((t, i) => {
      const c = (t.tag || UNTAGGED).trim() || UNTAGGED;
      const okCat = cat === "ALL" || c === cat;
      const okQ = !q || (searchIndex[i] || "").includes(q);
      return okCat && okQ;
    }).length;
  }

  function buildNav() {
    if (!navEl) return;
    navEl.innerHTML = "";

    const mk = (cat, label, hue) => {
      const b = document.createElement("button");
      b.className = "catalog-nav-item" + (hue ? " " + hue : "") + (activeCat === cat ? " active" : "");
      b.dataset.cat = cat;
      b.innerHTML =
        `<span class="dot"></span>` +
        `<span class="label">${escapeHtml(label)}</span>` +
        `<span class="count">${countFor(cat)}</span>`;
      b.addEventListener("click", () => {
        activeCat = cat;
        navEl.querySelectorAll(".catalog-nav-item").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        renderList();
        listEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return b;
    };

    navEl.appendChild(mk("ALL", "All topics", ""));
    catOrder.forEach(cat => navEl.appendChild(mk(cat, cat, hueOf[cat])));
  }

  function refreshNavCounts() {
    if (!navEl) return;
    navEl.querySelectorAll(".catalog-nav-item").forEach(item => {
      const c = item.dataset.cat;
      const el = item.querySelector(".count");
      if (el) el.textContent = countFor(c);
    });
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  if (searchEl) {
    searchEl.addEventListener("input", e => {
      query = e.target.value;
      refreshNavCounts();
      renderList();
    });
  }

  buildNav();
  renderList();
})();
