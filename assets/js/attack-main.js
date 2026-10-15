/*
  Renders ATTACK (assets/js/attack.js) into attack.html as a horizontal ATT&CK
  matrix: one column per tactic, a card per technique with its ATT&CK ID and the
  site pages that cover it. Type-to-search highlights and filters matching
  techniques across all columns. Edit assets/js/attack.js, never this file.
*/
(function () {
  var root = document.getElementById("atk-root");
  if (!root || typeof ATTACK === "undefined") return;
  var DATA = ATTACK;

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
  // display IDs like T1218b -> T1218 (dedup suffixes are internal only)
  function dispId(id) { return id.replace(/[a-z]$/, ""); }

  function techHTML(t) {
    var links = (t.links || []).map(function (l) {
      return '<a class="atk-link" href="' + attr(l.url) + '">' + esc(l.label) + '</a>';
    }).join("");
    var hay = (dispId(t.id) + " " + t.name + " " + (t.links || []).map(function (l) { return l.label; }).join(" ")).toLowerCase();
    return '<div class="atk-tech" data-search="' + attr(hay) + '">' +
      '<div class="atk-tid">' + esc(dispId(t.id)) + '</div>' +
      '<div class="atk-tname">' + esc(t.name) + '</div>' +
      '<div class="atk-links">' + links + '</div>' +
      '</div>';
  }

  function colHTML(tac) {
    var n = (tac.techniques || []).length;
    return '<section class="atk-col" data-tactic="' + attr(tac.short) + '">' +
      '<header class="atk-colhead"><span class="atk-tacname">' + esc(tac.name) + '</span>' +
      '<span class="atk-taccount">' + n + '</span></header>' +
      '<div class="atk-colbody">' + (tac.techniques || []).map(techHTML).join("") + '</div>' +
      '</section>';
  }

  function render() {
    root.innerHTML = DATA.tactics.map(colHTML).join("");
    var total = DATA.tactics.reduce(function (a, t) { return a + (t.techniques ? t.techniques.length : 0); }, 0);
    var c = document.getElementById("atk-total");
    if (c) c.textContent = DATA.tactics.length + " tactics · " + total + " techniques mapped";
  }
  render();

  var searchEl = document.getElementById("atk-search");
  if (searchEl) {
    searchEl.addEventListener("input", function () {
      var q = searchEl.value.trim().toLowerCase();
      root.querySelectorAll(".atk-tech").forEach(function (t) {
        var hit = !q || t.getAttribute("data-search").indexOf(q) !== -1;
        t.classList.toggle("dim", !!q && !hit);
        t.classList.toggle("hit", !!q && hit);
      });
      // show a column only if it has a hit (when searching)
      root.querySelectorAll(".atk-col").forEach(function (col) {
        if (!q) { col.style.display = ""; return; }
        var any = col.querySelector(".atk-tech.hit");
        col.style.display = any ? "" : "none";
      });
    });
  }
})();
