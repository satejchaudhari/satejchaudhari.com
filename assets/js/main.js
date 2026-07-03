/*
  Shared site behavior. Reads assets/js/posts.js (window.POSTS) and
  renders whichever of these pieces exist on the current page:
    - mobile nav toggle (every page)
    - #writeups-preview / #blog-preview   → homepage, latest 3 of each type
    - #log-list + #filter-bar             → writeups.html / blog.html,
                                             full filterable list, driven by
                                             <body data-post-type="writeup|blog">

  You never need to edit this file to add a post — edit assets/js/posts.js.
*/

(function () {
  const posts = Array.isArray(window.POSTS) ? window.POSTS : [];

  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- entry card builder ---------- */
  function buildEntry(post) {
    const a = document.createElement("a");
    a.className = "entry";
    a.href = post.url;

    const meta = document.createElement("div");
    meta.className = "entry-meta";

    const time = document.createElement("time");
    time.textContent = post.date || "";
    meta.appendChild(time);

    if (post.readTime) {
      const rt = document.createElement("span");
      rt.textContent = "· " + post.readTime;
      meta.appendChild(rt);
    }

    if (post.tag) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = post.tag;
      meta.appendChild(tag);
    }

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = post.title || "Untitled";

    const excerpt = document.createElement("p");
    excerpt.className = "entry-excerpt";
    excerpt.textContent = post.description || "";

    a.appendChild(meta);
    a.appendChild(title);
    a.appendChild(excerpt);
    return a;
  }

  /* ---------- homepage previews ---------- */
  function renderPreview(containerId, type, limit) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const items = posts.filter(p => p.type === type).slice(0, limit || 3);

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "// nothing published here yet";
      el.appendChild(empty);
      return;
    }

    items.forEach(post => el.appendChild(buildEntry(post)));
  }

  renderPreview("writeups-preview", "writeup", 3);
  renderPreview("blog-preview", "blog", 3);

  /* ---------- full list pages (writeups.html / blog.html) ---------- */
  const listEl = document.getElementById("log-list");
  const filterBarEl = document.getElementById("filter-bar");
  const countEl = document.getElementById("entry-count");

  if (listEl) {
    const pageType = document.body.dataset.postType; // "writeup" | "blog"
    const scoped = posts.filter(p => p.type === pageType);
    if (countEl) countEl.textContent = scoped.length;

    let activeTag = "ALL";

    function render() {
      listEl.innerHTML = "";
      const visible = activeTag === "ALL"
        ? scoped
        : scoped.filter(p => (p.tag || "").toUpperCase() === activeTag);

      if (visible.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "// no entries match this filter yet";
        listEl.appendChild(empty);
        return;
      }

      visible.forEach(post => listEl.appendChild(buildEntry(post)));
    }

    function buildFilters() {
      if (!filterBarEl) return;
      const tags = Array.from(
        new Set(scoped.map(p => (p.tag || "").toUpperCase()).filter(Boolean))
      );

      filterBarEl.innerHTML = "";

      const allBtn = document.createElement("button");
      allBtn.className = "filter-btn active";
      allBtn.textContent = "ALL";
      allBtn.addEventListener("click", () => setActive("ALL", allBtn));
      filterBarEl.appendChild(allBtn);

      tags.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.textContent = tag;
        btn.addEventListener("click", () => setActive(tag, btn));
        filterBarEl.appendChild(btn);
      });
    }

    function setActive(tag, btnEl) {
      activeTag = tag;
      filterBarEl.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btnEl.classList.add("active");
      render();
    }

    buildFilters();
    render();
  }
})();
