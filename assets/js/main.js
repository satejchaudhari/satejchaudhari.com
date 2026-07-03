/*
  Renders the POSTS array (from posts.js) into the homepage log,
  and builds the tag filter bar automatically from whatever tags
  appear in POSTS. You never need to edit this file to add a post —
  edit assets/js/posts.js instead.
*/

(function () {
  const listEl = document.getElementById("log-list");
  const filterBarEl = document.getElementById("filter-bar");
  const countEl = document.getElementById("entry-count");

  if (!listEl) return; // not on the homepage

  const posts = Array.isArray(window.POSTS) ? window.POSTS : [];
  if (countEl) countEl.textContent = posts.length;

  let activeTag = "ALL";

  function render() {
    listEl.innerHTML = "";

    const visible = activeTag === "ALL"
      ? posts
      : posts.filter(p => (p.tag || "").toUpperCase() === activeTag);

    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "// no entries yet — add a post in posts.js to get started";
      listEl.appendChild(empty);
      return;
    }

    visible.forEach(post => {
      const a = document.createElement("a");
      a.className = "entry";
      a.href = post.url;

      const meta = document.createElement("div");
      meta.className = "entry-meta";

      const time = document.createElement("time");
      time.textContent = post.date || "";
      meta.appendChild(time);

      if (post.tag) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = post.tag;
        meta.appendChild(tag);
      }

      const title = document.createElement("h2");
      title.className = "entry-title";
      title.textContent = post.title || "Untitled";

      const excerpt = document.createElement("p");
      excerpt.className = "entry-excerpt";
      excerpt.textContent = post.description || "";

      a.appendChild(meta);
      a.appendChild(title);
      a.appendChild(excerpt);
      listEl.appendChild(a);
    });
  }

  function buildFilters() {
    if (!filterBarEl) return;

    const tags = Array.from(
      new Set(posts.map(p => (p.tag || "").toUpperCase()).filter(Boolean))
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
})();
