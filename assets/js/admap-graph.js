/*
  Renders AD_MAP (assets/js/admap.js) as an interactive attack-flow graph.

  Layout: access-level swimlanes, top (no access) -> bottom (forest); wide
  levels wrap into rows. Tap a node to strongly highlight it and its
  IMMEDIATE neighbours (what leads straight to it / what it leads straight
  to) while the rest of the map is only lightly greyed, and open a detail
  panel that links to the tool pages and the vulnerability write-up. The
  view follows the site's light/dark theme and can't be panned off-screen.
*/
(function () {
  if (typeof cytoscape === "undefined" || typeof AD_MAP === "undefined") return;

  var MAXCOLS = 9, COL_GAP = 182, ROW_GAP = 96, BAND_GAP = 46;
  var nodes = AD_MAP.nodes, edges = AD_MAP.edges;
  var catColor = {}, catLabel = {}, levelLabel = {};
  AD_MAP.cats.forEach(function (c) { catColor[c.id] = c.color; catLabel[c.id] = c.label; });
  AD_MAP.levels.forEach(function (l) { levelLabel[l.id] = l.label; });
  var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });

  /* ---------- order within each level (barycenter crossing reduction) ---------- */
  var adj = {}; nodes.forEach(function (n) { adj[n.id] = []; });
  edges.forEach(function (e) { if (adj[e[0]] && adj[e[1]]) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); } });
  var catOrder = {}; AD_MAP.cats.forEach(function (c, i) { catOrder[c.id] = i; });
  var levels = {}; nodes.forEach(function (n) { (levels[n.lv] = levels[n.lv] || []).push(n.id); });
  var lvKeys = Object.keys(levels).map(Number).sort(function (a, b) { return a - b; });
  lvKeys.forEach(function (lv) {
    levels[lv].sort(function (a, b) { return (catOrder[byId[a].cat] - catOrder[byId[b].cat]) || byId[a].label.localeCompare(byId[b].label); });
  });
  function idxMap(arr) { var m = {}; arr.forEach(function (id, i) { m[id] = i; }); return m; }
  function reorder(lv, refLv) {
    if (!levels[refLv]) return;
    var ref = idxMap(levels[refLv]), cur = idxMap(levels[lv]);
    levels[lv] = levels[lv].map(function (id) {
      var ns = adj[id].filter(function (n) { return byId[n].lv === refLv; });
      var bary = ns.length ? ns.reduce(function (s, n) { return s + ref[n]; }, 0) / ns.length : cur[id];
      return { id: id, k: bary, t: cur[id] };
    }).sort(function (a, b) { return (a.k - b.k) || (a.t - b.t); }).map(function (o) { return o.id; });
  }
  for (var p = 0; p < 6; p++) {
    for (var i = 1; i < lvKeys.length; i++) reorder(lvKeys[i], lvKeys[i - 1]);
    for (var j = lvKeys.length - 2; j >= 0; j--) reorder(lvKeys[j], lvKeys[j + 1]);
  }

  /* ---------- positions + swimlane bands ---------- */
  var pos = {}, bands = [], bandY = 0, LANE_W = MAXCOLS * COL_GAP;
  lvKeys.forEach(function (lv) {
    var arr = levels[lv], n = arr.length, cols = Math.min(MAXCOLS, n), rows = Math.ceil(n / cols), bandH = rows * ROW_GAP;
    arr.forEach(function (id, k) { pos[id] = { x: ((k % cols) - (cols - 1) / 2) * COL_GAP, y: bandY + Math.floor(k / cols) * ROW_GAP + ROW_GAP / 2 }; });
    bands.push({ lv: lv, cy: bandY + bandH / 2, h: bandH + 20 });
    bandY += bandH + BAND_GAP;
  });
  var markerX = -LANE_W / 2 - 150;

  /* ---------- elements ---------- */
  var els = [];
  bands.forEach(function (bd) {
    els.push({ data: { id: "band-" + bd.lv, w: LANE_W + 320, h: bd.h, alt: bd.lv % 2 }, position: { x: -80, y: bd.cy }, selectable: false, grabbable: false, classes: "band" });
    els.push({ data: { id: "lvl-" + bd.lv, label: (bd.lv + 1) + "\n" + (levelLabel[bd.lv] || "").toUpperCase() }, position: { x: markerX, y: bd.cy }, selectable: false, grabbable: false, classes: "marker" });
  });
  nodes.forEach(function (n) { els.push({ data: { id: n.id, label: n.label, color: catColor[n.cat] || "#888" }, position: pos[n.id], classes: n.kind === "entry" ? "entry" : (n.kind === "goal" ? "goal" : "") }); });
  edges.forEach(function (e, k) { els.push({ data: { id: "e" + k, source: e[0], target: e[1], back: (byId[e[1]].lv <= byId[e[0]].lv) ? 1 : 0 } }); });

  /* ---------- theme-aware stylesheet ---------- */
  function isLight() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "light") return true;
    if (t === "dark") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  function palette() {
    return isLight()
      ? { edge: "#b3a88f", edgeBack: "#c7bda6", marker: "#8a8070", band: "#2a2410", mark: "#3a3a3a" }
      : { edge: "#2c333e", edgeBack: "#3a4350", marker: "#7c8593", band: "#ffffff", mark: "#ffffff" };
  }
  function buildStyle(t) {
    return [
      { selector: "node.band", style: { "shape": "round-rectangle", "background-color": t.band, "width": "data(w)", "height": "data(h)", "events": "no", "z-index": 0 } },
      { selector: "node.band[alt = 0]", style: { "background-opacity": isLight() ? 0.03 : 0.015 } },
      { selector: "node.band[alt = 1]", style: { "background-opacity": isLight() ? 0.07 : 0.045 } },
      { selector: "node.marker", style: { "background-opacity": 0, "label": "data(label)", "color": t.marker, "text-wrap": "wrap", "text-max-width": "150px", "font-family": "'JetBrains Mono', monospace", "font-size": "12px", "font-weight": "700", "text-halign": "center", "text-valign": "center", "line-height": 1.4, "events": "no", "z-index": 1 } },
      { selector: "node[color]", style: {
        "background-color": "data(color)", "shape": "round-rectangle", "label": "data(label)", "color": "#0a0c10",
        "font-family": "Inter, sans-serif", "font-size": "11px", "font-weight": "600", "text-wrap": "wrap", "text-max-width": "128px",
        "text-valign": "center", "text-halign": "center", "width": "label", "height": "label", "padding": "7px",
        "border-width": 0, "z-index": 10, "transition-property": "opacity", "transition-duration": "0.14s"
      } },
      { selector: "node.entry", style: { "border-width": 3, "border-color": t.mark, "border-opacity": 0.85 } },
      { selector: "node.goal", style: { "border-width": 4, "border-color": t.mark, "border-opacity": 0.95, "border-style": "double" } },
      { selector: "edge", style: { "width": 1.4, "line-color": t.edge, "target-arrow-color": t.edge, "target-arrow-shape": "triangle", "curve-style": "bezier", "arrow-scale": 0.8, "opacity": 0.55, "z-index": 5, "transition-property": "opacity, line-color, width", "transition-duration": "0.14s" } },
      { selector: "edge[back = 1]", style: { "line-style": "dashed", "line-color": t.edgeBack, "target-arrow-color": t.edgeBack } },
      { selector: "node.faded", style: { "opacity": 0.32 } },
      { selector: "edge.faded", style: { "opacity": 0.14 } },
      { selector: "node.hl", style: { "opacity": 1, "z-index": 30, "border-width": 3, "border-color": "#ffd27a", "border-opacity": 0.95 } },
      { selector: "node.sel", style: { "border-width": 4, "border-color": "#ff9d4d", "border-opacity": 1, "z-index": 40 } },
      { selector: "edge.hl", style: { "opacity": 1, "line-color": "#ff9d4d", "target-arrow-color": "#ff9d4d", "width": 3, "z-index": 30 } }
    ];
  }

  var cy = cytoscape({
    container: document.getElementById("cy"), elements: els,
    minZoom: 0.1, maxZoom: 2.5, wheelSensitivity: 0.22,
    style: buildStyle(palette()), layout: { name: "preset", fit: true, padding: 42 }
  });

  // re-theme when the site theme toggles
  new MutationObserver(function () { cy.style(buildStyle(palette())); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- keep the graph from being panned off-screen ---------- */
  var clamping = false;
  function clampPan() {
    if (clamping) return;
    var bb = cy.elements("node[color], node.marker").renderedBoundingBox();
    var w = cy.width(), h = cy.height(), m = 110, pan = cy.pan(), np = { x: pan.x, y: pan.y }, ch = false;
    if (bb.x2 < m) { np.x += m - bb.x2; ch = true; }
    if (bb.x1 > w - m) { np.x -= bb.x1 - (w - m); ch = true; }
    if (bb.y2 < m) { np.y += m - bb.y2; ch = true; }
    if (bb.y1 > h - m) { np.y -= bb.y1 - (h - m); ch = true; }
    if (ch) { clamping = true; cy.pan(np); clamping = false; }
  }
  cy.on("viewport", clampPan);

  /* ---------- detail panel ---------- */
  var panel = document.getElementById("adm-detail"), pbody = document.getElementById("adm-detail-body");
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z"></path></svg>';
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function toolChip(t) { return t[1] ? '<a class="adm-chip" href="tool-detail.html?tool=' + encodeURIComponent(t[1]) + '">' + esc(t[0]) + '</a>' : '<span class="adm-chip pending" title="Reference page coming soon">' + esc(t[0]) + '</span>'; }
  function stepChip(id) { var n = byId[id]; return n ? '<button class="adm-chip step" data-goto="' + esc(id) + '">' + esc(n.label) + '</button>' : ""; }
  function openDetail(node) {
    var n = byId[node.id()], color = catColor[n.cat];
    var pre = node.incomers("node[color]").map(function (x) { return x.id(); });
    var suc = node.outgoers("node[color]").map(function (x) { return x.id(); });
    var h = '<span class="adm-detail-cat"><span class="sw" style="background:' + color + '"></span>' + esc(catLabel[n.cat]) + '</span>';
    h += '<h2>' + esc(n.label) + (n.cve ? '<span class="cve">' + esc(n.cve) + '</span>' : "") + '</h2>';
    h += '<div class="lvl">Grants: ' + (n.lv + 1) + ' &middot; ' + esc(levelLabel[n.lv]) + (n.kind === "entry" ? " &middot; entry point" : "") + '</div>';
    h += '<p class="desc">' + esc(n.desc) + '</p>';
    if (n.tools && n.tools.length) h += '<div class="sec"><p class="sec-l">Tools</p><div class="adm-chips">' + n.tools.map(toolChip).join("") + '</div></div>';
    if (n.vuln) {
      h += '<div class="sec"><p class="sec-l">Vuln write-up</p><div class="adm-chips">';
      h += n.vuln[1]
        ? '<a class="adm-chip vuln" href="vuln-detail.html?vuln=' + encodeURIComponent(n.vuln[1]) + '">' + SHIELD + esc(n.vuln[0]) + '</a>'
        : '<span class="adm-chip vuln pending" title="Write-up coming soon">' + SHIELD + esc(n.vuln[0]) + '</span>';
      h += '</div></div>';
    }
    if (pre.length) h += '<div class="sec"><p class="sec-l">Reached from</p><div class="adm-chips">' + pre.map(stepChip).join("") + '</div></div>';
    if (suc.length) h += '<div class="sec"><p class="sec-l">Leads to</p><div class="adm-chips">' + suc.map(stepChip).join("") + '</div></div>';
    pbody.innerHTML = h; panel.classList.add("open");
  }

  /* ---------- selection: strong on immediate neighbours, light grey on the rest ---------- */
  var selected = null;
  function clearHl() { cy.elements().removeClass("faded hl sel"); }
  function focusNode(node) {
    var isM = window.innerWidth <= 720, z = Math.max(cy.zoom(), isM ? 0.72 : 0.6), w = cy.width(), h = cy.height();
    var tx = isM ? w / 2 : (w - 340) / 2, ty = isM ? h * 0.24 : h / 2;
    cy.animate({ zoom: z, pan: { x: tx - node.position("x") * z, y: ty - node.position("y") * z } }, { duration: 280 });
  }
  function selectNode(node, focus) {
    selected = node;
    var nb = node.closedNeighborhood();            // node + immediate neighbours + their edges
    cy.elements("node[color], edge").addClass("faded");
    nb.removeClass("faded");
    nb.nodes("node[color]").addClass("hl");
    nb.edges().addClass("hl");
    node.removeClass("hl").addClass("sel");
    openDetail(node);
    if (focus || window.innerWidth <= 720) focusNode(node);
  }
  function deselect() { selected = null; clearHl(); panel.classList.remove("open"); }
  cy.on("tap", "node[color]", function (e) { selectNode(e.target, false); });
  cy.on("tap", function (e) { if (e.target === cy) deselect(); });
  cy.on("mouseover", "node[color]", function (e) {
    if (selected) return;
    var nb = e.target.closedNeighborhood();
    cy.elements("node[color], edge").addClass("faded");
    nb.removeClass("faded"); nb.edges().addClass("hl"); e.target.addClass("hl");
  });
  cy.on("mouseout", "node[color]", function () { if (!selected) clearHl(); });
  pbody.addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (!b) return; var n = cy.getElementById(b.getAttribute("data-goto")); if (n && n.length) selectNode(n, true); });
  document.getElementById("adm-detail-close").addEventListener("click", deselect);

  /* ---------- legend (category focus) ---------- */
  var legend = document.getElementById("adm-legend"), activeCat = null;
  legend.innerHTML = AD_MAP.cats.map(function (c) { return '<button data-cat="' + c.id + '"><span class="sw" style="background:' + c.color + '"></span>' + esc(c.label) + '</button>'; }).join("");
  legend.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    var cat = b.getAttribute("data-cat");
    legend.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
    if (activeCat === cat) { activeCat = null; clearHl(); return; }
    activeCat = cat; b.classList.add("on"); selected = null; panel.classList.remove("open");
    cy.elements("node[color], edge").addClass("faded");
    cy.nodes("node[color]").filter(function (n) { return byId[n.id()].cat === cat; }).removeClass("faded").addClass("hl");
  });

  /* ---------- search / controls ---------- */
  var search = document.getElementById("adm-search");
  search.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var q = search.value.trim().toLowerCase(); if (!q) return;
    var hit = nodes.find(function (n) { return n.label.toLowerCase().indexOf(q) !== -1 || (n.tools || []).some(function (t) { return t[0].toLowerCase().indexOf(q) !== -1; }); });
    if (hit) selectNode(cy.getElementById(hit.id), true);
  });
  document.getElementById("adm-fit").addEventListener("click", function () { cy.animate({ fit: { padding: 42 } }, { duration: 260 }); });
  document.getElementById("adm-reset").addEventListener("click", function () { deselect(); activeCat = null; legend.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); }); cy.animate({ fit: { padding: 42 } }, { duration: 260 }); });

  cy.ready(function () { cy.fit(undefined, 42); });
  var m = location.search.match(/[?&]node=([^&]+)/);
  if (m) { var dn = cy.getElementById(decodeURIComponent(m[1])); if (dn && dn.length) setTimeout(function () { selectNode(dn, true); }, 220); }
})();
