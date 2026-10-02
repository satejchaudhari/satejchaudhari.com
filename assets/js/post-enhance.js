/*
  post-enhance.js — progressive niceties for long reading pages (writeups &
  theory). Runs only when a .post-body is present and degrades to nothing if
  not. Two features:
    1. Copy buttons on every <pre> code block.
    2. A table of contents built from the <h2>/<h3> headings — a floating
       panel on wide screens, a collapsible box inline on narrow ones.
  You never need to edit this file; just include it before </body>.
*/
(function () {
  var body = document.querySelector(".post-body");
  if (!body) return;

  /* ---------- 1. copy buttons ---------- */
  var pres = body.querySelectorAll("pre");
  pres.forEach(function (pre) {
    if (pre.dataset.copyReady) return;
    pre.dataset.copyReady = "1";
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Copy code");
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var code = pre.querySelector("code");
      var text = (code || pre).innerText;
      var done = function () {
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    pre.appendChild(btn);
  });

  /* ---------- 2. table of contents ---------- */
  var headings = Array.prototype.slice.call(body.querySelectorAll("h2, h3"));
  if (headings.length < 3) return; // not worth a TOC on short pages

  function slugify(t) {
    return t.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  }
  var seen = {};
  var items = headings.map(function (h) {
    var base = slugify(h.textContent);
    var id = base, n = 2;
    while (seen[id]) { id = base + "-" + n++; }
    seen[id] = true;
    if (!h.id) h.id = id;
    return { id: h.id, text: h.textContent, level: h.tagName.toLowerCase() };
  });

  function buildList() {
    var ul = document.createElement("ul");
    ul.className = "post-toc-list";
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "toc-" + it.level;
      var a = document.createElement("a");
      a.href = "#" + it.id;
      a.textContent = it.text;
      a.dataset.target = it.id;
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  // Floating panel (shown on wide screens via CSS)
  var floatNav = document.createElement("nav");
  floatNav.className = "post-toc-float";
  floatNav.setAttribute("aria-label", "Table of contents");
  var ftitle = document.createElement("p");
  ftitle.className = "post-toc-title";
  ftitle.textContent = "On this page";
  floatNav.appendChild(ftitle);
  floatNav.appendChild(buildList());
  document.body.appendChild(floatNav);

  // Inline collapsible (shown on narrow screens via CSS)
  var inline = document.createElement("details");
  inline.className = "post-toc-inline";
  inline.open = false;
  var summary = document.createElement("summary");
  summary.textContent = "Contents";
  inline.appendChild(summary);
  inline.appendChild(buildList());
  body.insertBefore(inline, body.firstChild);

  // Active-section highlighting on the floating TOC
  var floatLinks = floatNav.querySelectorAll("a");
  function setActive(id) {
    floatLinks.forEach(function (a) {
      a.classList.toggle("active", a.dataset.target === id);
    });
  }
  if ("IntersectionObserver" in window) {
    var visible = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      // pick the first heading currently visible, in document order
      for (var i = 0; i < items.length; i++) {
        if (visible[items[i].id]) { setActive(items[i].id); break; }
      }
    }, { rootMargin: "0px 0px -70% 0px", threshold: 0 });
    headings.forEach(function (h) { obs.observe(h); });
  }

  // Smooth-close the inline TOC after a jump
  inline.addEventListener("click", function (e) {
    if (e.target.tagName === "A") inline.open = false;
  });
})();
