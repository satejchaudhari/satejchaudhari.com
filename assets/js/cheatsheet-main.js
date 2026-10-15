/*
  Renders CHEATSHEET (assets/js/cheatsheet.js) into cheatsheet.html:
  collapsible sections, a copy button per command, live {lhost}/{lport}
  substitution from the two input boxes, and a type-to-filter search.
  Edit assets/js/cheatsheet.js, never this file.
*/
(function () {
  var root = document.getElementById("cheat-root");
  if (!root || typeof CHEATSHEET === "undefined") return;
  var DATA = CHEATSHEET;

  var lhostEl = document.getElementById("cheat-lhost");
  var lportEl = document.getElementById("cheat-lport");
  var searchEl = document.getElementById("cheat-search");

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function lhost() { return (lhostEl && lhostEl.value.trim()) || "10.10.14.1"; }
  function lport() { return (lportEl && lportEl.value.trim()) || "4444"; }
  function subst(s) {
    return String(s).split("{lhost}").join(lhost()).split("{lport}").join(lport());
  }
  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  function render() {
    root.innerHTML = DATA.groups.map(function (g) {
      var rows = g.items.map(function (it) {
        var raw = subst(it.cmd);
        var note = it.note ? '<p class="cheat-note">' + esc(it.note) + '</p>' : "";
        return '<div class="cheat-item" data-search="' + esc((it.label + " " + it.cmd + " " + (it.note || "")).toLowerCase()) + '">' +
          '<div class="cheat-label">' + esc(it.label) + '</div>' +
          '<div class="cheat-cmdwrap"><button class="cheat-copy" title="Copy" aria-label="Copy">' + COPY + '</button>' +
          '<pre class="cheat-cmd"><code>' + esc(raw) + '</code></pre></div>' + note +
          '</div>';
      }).join("");
      return '<section class="cheat-group" id="cg-' + esc(g.id) + '">' +
        '<h2 class="cheat-h">' + esc(g.title) + '</h2>' + rows + '</section>';
    }).join("");
  }
  render();

  // live re-render on LHOST/LPORT change
  [lhostEl, lportEl].forEach(function (el) {
    if (el) el.addEventListener("input", render);
  });

  // search filter
  if (searchEl) {
    searchEl.addEventListener("input", function () {
      var q = searchEl.value.trim().toLowerCase();
      root.querySelectorAll(".cheat-item").forEach(function (it) {
        it.style.display = (!q || it.getAttribute("data-search").indexOf(q) !== -1) ? "" : "none";
      });
      root.querySelectorAll(".cheat-group").forEach(function (g) {
        var any = Array.prototype.some.call(g.querySelectorAll(".cheat-item"), function (it) { return it.style.display !== "none"; });
        g.style.display = any ? "" : "none";
      });
    });
  }

  // copy
  root.addEventListener("click", function (e) {
    var btn = e.target.closest(".cheat-copy");
    if (!btn) return;
    var code = btn.parentNode.querySelector("code");
    if (!code) return;
    var text = code.innerText;
    function done() { btn.classList.add("copied"); setTimeout(function () { btn.classList.remove("copied"); }, 1100); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { try { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); done(); } catch (x) {} }
  });
})();
