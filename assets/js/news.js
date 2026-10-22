/* Renders the auto-fetched security news (assets/js/news-data.js).
   Pure client-side, no external calls. Escapes all feed content (untrusted).
   Fills #news-preview (compact, homepage) and/or #news-list (full, news.html). */
(function () {
  "use strict";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function relTime(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return "";
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "just now";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60);
    if (h < 48) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }

  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }

  var MAX_AGE_MS = 72 * 3600 * 1000;

  function freshSorted(items) {
    var now = Date.now();
    return (items || [])
      .filter(function (n) { var t = Date.parse(n.published); return !isNaN(t) && (now - t) <= MAX_AGE_MS; })
      .sort(function (a, b) { return Date.parse(b.published) - Date.parse(a.published); });
  }

  function card(n) {
    return '<article class="news-item">' +
      '<div class="news-item-head">' +
        '<span class="news-src">' + escapeHtml(n.source || hostOf(n.link)) + '</span>' +
        '<time class="news-time" datetime="' + escapeHtml(n.published) + '">' + escapeHtml(relTime(n.published)) + '</time>' +
      '</div>' +
      '<h3 class="news-title"><a href="' + escapeHtml(n.link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(n.title) + '</a></h3>' +
      (n.summary ? '<p class="news-sum">' + escapeHtml(n.summary) + '</p>' : '') +
    '</article>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    var items = freshSorted(typeof NEWS !== "undefined" ? NEWS : []);

    // Homepage preview (top 4, no filters)
    var preview = document.getElementById("news-preview");
    if (preview) {
      preview.innerHTML = items.length
        ? items.slice(0, 4).map(card).join("")
        : '<div class="empty-state">// the news feed refreshes every 3 hours — nothing from the last 72 hours yet</div>';
    }

    // Full list page
    var list = document.getElementById("news-list");
    if (!list) return;

    var meta = document.getElementById("news-meta");
    if (meta) {
      var upd = (typeof NEWS_UPDATED !== "undefined" && NEWS_UPDATED) ? " · updated " + relTime(NEWS_UPDATED) : "";
      meta.textContent = items.length ? (items.length + " stories from the last 72 hours" + upd) : "";
    }

    if (!items.length) {
      list.innerHTML = '<div class="empty-state">// the news feed refreshes every 3 hours — no stories from the last 72 hours yet. Check back soon.</div>';
      return;
    }

    var sources = [];
    items.forEach(function (n) { if (sources.indexOf(n.source) < 0) sources.push(n.source); });
    sources.sort();

    var active = "All";
    function render() {
      var shown = active === "All" ? items : items.filter(function (n) { return n.source === active; });
      list.innerHTML = shown.length
        ? shown.map(card).join("")
        : '<div class="empty-state">// nothing from this source in the last 72 hours</div>';
    }

    var bar = document.getElementById("news-filters");
    if (bar) {
      bar.innerHTML = ["All"].concat(sources).map(function (s) {
        return '<button class="news-chip' + (s === "All" ? " is-active" : "") + '" data-src="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
      }).join("");
      bar.addEventListener("click", function (e) {
        var b = e.target.closest(".news-chip");
        if (!b) return;
        active = b.getAttribute("data-src");
        Array.prototype.forEach.call(bar.querySelectorAll(".news-chip"), function (x) {
          x.classList.toggle("is-active", x === b);
        });
        render();
      });
    }

    render();
  });
})();
