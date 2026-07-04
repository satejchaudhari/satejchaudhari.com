/*
  Renders assets/js/theory.js (window.THEORY) into theory.html's
  filter bar and entry list, plus a search box that matches against
  each topic's title, tag, description, AND the full text of the
  actual page content (fetched in the background).

  NOTE: the full-content search requires the site to be served over
  http(s) — it fetches each topic's html file via the Fetch API, which
  browsers block when a page is opened directly from disk (file://).
  Every other feature on the site still works fine offline; only this
  search needs the real server (GitHub Pages / Cloudflare Pages, etc).

  You never need to edit this file — edit theory.js instead.
*/

(function () {
  const listEl = document.getElementById("log-list");
  const filterBarEl = document.getElementById("filter-bar");
  const countEl = document.getElementById("entry-count");
  const searchEl = document.getElementById("theory-search");
  const searchStatusEl = document.getElementById("theory-search-status");
  if (!listEl) return;

  const topics = Array.isArray(window.THEORY) ? window.THEORY : [];
  if (countEl) countEl.textContent = topics.length;

  let activeTag = "ALL";
  let query = "";

  // searchIndex[url] = lowercase string of title + tag + description + full page text
  const searchIndex = {};

  topics.forEach(t => {
    searchIndex[t.url] = [t.title, t.tag, t.description].filter(Boolean).join(" ").toLowerCase();
  });

  /* ---------- background fetch: pull in full page text for each topic ---------- */
  function indexFullContent() {
    if (!window.fetch) return; // very old browser, silently skip — metadata search still works

    let remaining = topics.length;
    if (remaining === 0) return;
    if (searchStatusEl) searchStatusEl.textContent = "Indexing page content…";

    topics.forEach(topic => {
      fetch(topic.url)
        .then(res => (res.ok ? res.text() : Promise.reject()))
        .then(html => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const body = doc.querySelector(".post-body");
          const text = body ? body.textContent : "";
          searchIndex[topic.url] += " " + text.toLowerCase().replace(/\s+/g, " ");
        })
        .catch(() => {
          // page couldn't be fetched (offline preview, moved file, etc.) —
          // that topic just falls back to title/tag/description matching only
        })
        .finally(() => {
          remaining -= 1;
          if (remaining === 0 && searchStatusEl) {
            searchStatusEl.textContent = "";
          }
          // re-render if the person is actively searching, so results
          // improve as content finishes indexing in the background
          if (query) render();
        });
    });
  }

  /* ---------- card builder ---------- */
  function buildEntry(topic) {
    const a = document.createElement("a");
    a.className = "entry";
    a.href = topic.url;

    const meta = document.createElement("div");
    meta.className = "entry-meta";

    const time = document.createElement("time");
    time.textContent = topic.date || "";
    meta.appendChild(time);

    if (topic.readTime) {
      const rt = document.createElement("span");
      rt.textContent = "· " + topic.readTime;
      meta.appendChild(rt);
    }

    if (topic.tag) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = topic.tag;
      meta.appendChild(tag);
    }

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = topic.title || "Untitled";

    const excerpt = document.createElement("p");
    excerpt.className = "entry-excerpt";
    excerpt.textContent = topic.description || "";

    a.appendChild(meta);
    a.appendChild(title);
    a.appendChild(excerpt);
    return a;
  }

  /* ---------- combined filter: tag chip + search query ---------- */
  function render() {
    listEl.innerHTML = "";

    const q = query.trim().toLowerCase();

    const visible = topics.filter(topic => {
      const matchesTag = activeTag === "ALL" || (topic.tag || "").toUpperCase() === activeTag;
      const matchesQuery = !q || (searchIndex[topic.url] || "").includes(q);
      return matchesTag && matchesQuery;
    });

    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = q
        ? "// no topics match \"" + query.trim() + "\""
        : "// no topics match this filter yet";
      listEl.appendChild(empty);
      return;
    }

    visible.forEach(topic => listEl.appendChild(buildEntry(topic)));
  }

  /* ---------- tag filter chips ---------- */
  function buildFilters() {
    if (!filterBarEl) return;
    const tags = Array.from(new Set(topics.map(t => (t.tag || "").toUpperCase()).filter(Boolean)));

    filterBarEl.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn active";
    allBtn.textContent = "ALL";
    allBtn.addEventListener("click", () => setActiveTag("ALL", allBtn));
    filterBarEl.appendChild(allBtn);

    tags.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = tag;
      btn.addEventListener("click", () => setActiveTag(tag, btn));
      filterBarEl.appendChild(btn);
    });
  }

  function setActiveTag(tag, btnEl) {
    activeTag = tag;
    filterBarEl.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btnEl.classList.add("active");
    render();
  }

  /* ---------- search input ---------- */
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      query = e.target.value;
      render();
    });
  }

  buildFilters();
  render();
  indexFullContent();
})();
