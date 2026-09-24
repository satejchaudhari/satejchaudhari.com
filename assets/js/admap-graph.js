/*
  Renders AD_MAP (assets/js/admap.js) as an interactive attack-flow graph.

  Layout: access-level swimlanes, top (no access) -> bottom (forest); wide
  levels wrap into rows.

  Visual language (also shown in the on-page legend):
    * fill colour  -> attack CATEGORY (the coloured legend chips)
    * border style -> node TYPE:
        dashed grey  = recon / enum step
        thin         = attack / technique
        teal solid   = credential access
        thick double = objective / domain dominance
    * "> " label prefix -> entry point (start with no access)
    * gold ring         -> an end goal
    * solid arrow  = escalation / forward step
    * dashed arrow = lateral move or loop-back

  Features: tap a node for its full detail (commands, ATT&CK IDs, prereqs,
  detection, Theory/Tools/Vuln links); Trace-a-path between two nodes;
  a breadcrumb of the chain you walk; a minimap; a flow-only toggle that
  hides loop-back edges; and a mobile "Guided" levels view.
*/
(function () {
  if (typeof cytoscape === "undefined" || typeof AD_MAP === "undefined") return;

  var MAXCOLS = 9, COL_GAP = 182, ROW_GAP = 96, BAND_GAP = 46;
  var nodes = AD_MAP.nodes, edges = AD_MAP.edges;
  var catColor = {}, catLabel = {}, levelLabel = {}, typeById = {};
  AD_MAP.cats.forEach(function (c) { catColor[c.id] = c.color; catLabel[c.id] = c.label; });
  AD_MAP.levels.forEach(function (l) { levelLabel[l.id] = l.label; });
  (AD_MAP.types || []).forEach(function (t) { typeById[t.id] = t; });
  var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });

  var TYPE_COLOR = { enum: "#94a3b8", attack: "#8a93a3", cred: "#2dd4bf", objective: "#ff9d4d" };

  /* ---------- order within each level (barycenter crossing reduction) ---------- */
  var adj = {}; nodes.forEach(function (n) { adj[n.id] = []; });
  var out = {}; nodes.forEach(function (n) { out[n.id] = []; });
  edges.forEach(function (e) {
    if (adj[e[0]] && adj[e[1]]) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); out[e[0]].push(e[1]); }
  });
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
  nodes.forEach(function (n) {
    var cls = [n.type || "attack"];
    if (n.kind === "entry") cls.push("entry");
    if (n.kind === "goal") cls.push("goal");
    var label = (n.kind === "entry" ? "▸ " : "") + n.label;
    els.push({ data: { id: n.id, label: label, color: catColor[n.cat] || "#888", tcolor: TYPE_COLOR[n.type] || "#8a93a3" }, position: pos[n.id], classes: cls.join(" ") });
  });
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
      /* node TYPE -> border treatment (the visual language) */
      { selector: "node.enum", style: { "border-width": 2, "border-color": t.marker, "border-style": "dashed", "border-opacity": 0.9 } },
      { selector: "node.cred", style: { "border-width": 2, "border-color": "#0c6b60", "border-opacity": 0.95 } },
      { selector: "node.objective", style: { "border-width": 3, "border-color": "#1a1205", "border-style": "double", "border-opacity": 0.85 } },
      /* kind overlays */
      { selector: "node.entry", style: { "border-width": 3, "border-color": t.mark, "border-opacity": 0.9, "border-style": "solid" } },
      { selector: "node.goal", style: { "border-width": 4, "border-color": "#ffd27a", "border-opacity": 1, "border-style": "double" } },
      { selector: "edge", style: { "width": 1.4, "line-color": t.edge, "target-arrow-color": t.edge, "target-arrow-shape": "triangle", "curve-style": "bezier", "arrow-scale": 0.8, "opacity": 0.55, "z-index": 5, "transition-property": "opacity, line-color, width", "transition-duration": "0.14s" } },
      { selector: "edge[back = 1]", style: { "line-style": "dashed", "line-color": t.edgeBack, "target-arrow-color": t.edgeBack } },
      { selector: "edge.hidden", style: { "display": "none" } },
      { selector: "node.faded", style: { "opacity": 0.28 } },
      { selector: "edge.faded", style: { "opacity": 0.1 } },
      { selector: "node.hl", style: { "opacity": 1, "z-index": 30, "border-width": 3, "border-color": "#ffd27a", "border-opacity": 0.95 } },
      { selector: "node.sel", style: { "border-width": 4, "border-color": "#ff9d4d", "border-opacity": 1, "z-index": 40 } },
      { selector: "node.path", style: { "opacity": 1, "z-index": 35, "border-width": 4, "border-color": "#ff9d4d", "border-opacity": 1 } },
      { selector: "edge.hl", style: { "opacity": 1, "line-color": "#ff9d4d", "target-arrow-color": "#ff9d4d", "width": 3, "z-index": 30 } },
      { selector: "edge.path", style: { "opacity": 1, "line-color": "#ff9d4d", "target-arrow-color": "#ff9d4d", "width": 3.4, "z-index": 34, "line-style": "solid" } }
    ];
  }

  var cy = cytoscape({
    container: document.getElementById("cy"), elements: els,
    minZoom: 0.1, maxZoom: 2.5, wheelSensitivity: 0.22,
    style: buildStyle(palette()), layout: { name: "preset", fit: true, padding: 42 }
  });

  new MutationObserver(function () { cy.style(buildStyle(palette())); drawMini(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

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
    drawMini();
  }
  cy.on("viewport", clampPan);

  /* ---------- helpers ---------- */
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  // dim shell-style "# comments" (mirrors the toolkit's command styling)
  function fmtCmd(s) {
    s = String(s);
    var i = s.indexOf("#");
    // treat as comment only when # starts a token
    while (i !== -1 && i !== 0 && s[i - 1] !== " ") i = s.indexOf("#", i + 1);
    if (i === -1) return esc(s);
    return esc(s.slice(0, i)) + '<span class="cmd-comment">' + esc(s.slice(i)) + "</span>";
  }
  function attackChip(id) {
    var url = "https://attack.mitre.org/techniques/" + id.replace(".", "/") + "/";
    return '<a class="adm-att" href="' + url + '" target="_blank" rel="noopener">' + esc(id) + "</a>";
  }

  /* ---------- detail panel ---------- */
  var panel = document.getElementById("adm-detail"), pbody = document.getElementById("adm-detail-body");
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z"></path></svg>';
  var BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
  function toolChip(t) { return t[1] ? '<a class="adm-chip" href="tool-detail.html?tool=' + encodeURIComponent(t[1]) + '">' + esc(t[0]) + '</a>' : '<span class="adm-chip pending" title="Reference page coming soon">' + esc(t[0]) + '</span>'; }
  function stepChip(id) { var n = byId[id]; return n ? '<button class="adm-chip step" data-goto="' + esc(id) + '">' + esc(n.label) + '</button>' : ""; }
  function detailHTML(n) {
    var color = catColor[n.cat], ty = typeById[n.type];
    var h = '<span class="adm-detail-cat"><span class="sw" style="background:' + color + '"></span>' + esc(catLabel[n.cat]);
    if (ty) h += ' <span class="adm-type-tag ' + esc(n.type) + '">' + esc(ty.label) + '</span>';
    h += '</span>';
    h += '<h2>' + esc(n.label) + (n.cve ? '<span class="cve">' + esc(n.cve) + '</span>' : "") + '</h2>';
    h += '<div class="lvl">Grants: ' + (n.lv + 1) + ' &middot; ' + esc(levelLabel[n.lv]) + (n.kind === "entry" ? " &middot; entry point" : (n.kind === "goal" ? " &middot; objective" : "")) + '</div>';
    h += '<p class="desc">' + esc(n.desc) + '</p>';
    if (n.prereq) h += '<p class="adm-meta req"><span>Requires</span>' + esc(n.prereq) + '</p>';
    if (n.detect) h += '<p class="adm-meta det"><span>Detection / OPSEC</span>' + esc(n.detect) + '</p>';
    if (n.cmds && n.cmds.length) {
      h += '<div class="sec"><p class="sec-l">Example commands</p>';
      h += n.cmds.map(function (c) { return '<div class="command-block"><pre><code>' + fmtCmd(c) + '</code></pre></div>'; }).join("");
      h += '</div>';
    }
    if (n.attack && n.attack.length) h += '<div class="sec"><p class="sec-l">MITRE ATT&amp;CK</p><div class="adm-chips">' + n.attack.map(attackChip).join("") + '</div></div>';
    var links = [];
    if (n.th && AD_MAP.theory[n.th]) { var th = AD_MAP.theory[n.th]; links.push('<a class="adm-chip theory" href="' + esc(th.u) + '">' + BOOK + esc(th.t) + '</a>'); }
    if (links.length) h += '<div class="sec"><p class="sec-l">Theory</p><div class="adm-chips">' + links.join("") + '</div></div>';
    if (n.tools && n.tools.length) h += '<div class="sec"><p class="sec-l">Tools</p><div class="adm-chips">' + n.tools.map(toolChip).join("") + '</div></div>';
    if (n.vuln) {
      h += '<div class="sec"><p class="sec-l">Vuln write-up</p><div class="adm-chips">';
      h += n.vuln[1]
        ? '<a class="adm-chip vuln" href="vuln-detail.html?vuln=' + encodeURIComponent(n.vuln[1]) + '">' + SHIELD + esc(n.vuln[0]) + '</a>'
        : '<span class="adm-chip vuln pending" title="Write-up coming soon">' + SHIELD + esc(n.vuln[0]) + '</span>';
      h += '</div></div>';
    }
    var pre = (adjIncomers(n.id)), suc = out[n.id] || [];
    if (pre.length) h += '<div class="sec"><p class="sec-l">Reached from</p><div class="adm-chips">' + pre.map(stepChip).join("") + '</div></div>';
    if (suc.length) h += '<div class="sec"><p class="sec-l">Leads to</p><div class="adm-chips">' + suc.map(stepChip).join("") + '</div></div>';
    return h;
  }
  function adjIncomers(id) { var r = []; edges.forEach(function (e) { if (e[1] === id) r.push(e[0]); }); return r; }
  function openDetail(id) { pbody.innerHTML = detailHTML(byId[id]); panel.classList.add("open"); }

  /* ---------- breadcrumb trail ---------- */
  var trail = [], trailEl = document.getElementById("adm-trail");
  function renderTrail() {
    if (!trailEl) return;
    if (!trail.length) { trailEl.classList.remove("show"); trailEl.innerHTML = ""; return; }
    trailEl.classList.add("show");
    var html = '<span class="adm-trail-l">Trail</span>';
    html += trail.map(function (id, i) {
      return (i ? '<span class="adm-trail-sep">→</span>' : "") + '<button class="adm-trail-x" data-goto="' + esc(id) + '">' + esc(byId[id].label) + '</button>';
    }).join("");
    html += '<button class="adm-trail-clear" id="adm-trail-clear" title="Clear trail">clear</button>';
    trailEl.innerHTML = html;
  }
  function pushTrail(id) {
    if (trail[trail.length - 1] === id) return;
    var at = trail.indexOf(id);
    if (at !== -1) trail = trail.slice(0, at + 1); // revisiting an earlier crumb rewinds
    else trail.push(id);
    renderTrail();
  }

  /* ---------- selection: strong on immediate neighbours ---------- */
  var selected = null, traceActive = false;
  function clearHl() { cy.elements().removeClass("faded hl sel path"); }
  function focusNode(node) {
    var isM = window.innerWidth <= 720, z = Math.max(cy.zoom(), isM ? 0.72 : 0.6), w = cy.width(), h = cy.height();
    var tx = isM ? w / 2 : (w - 360) / 2, ty = isM ? h * 0.24 : h / 2;
    cy.animate({ zoom: z, pan: { x: tx - node.position("x") * z, y: ty - node.position("y") * z } }, { duration: 280 });
  }
  function selectNode(id, focus, addTrail) {
    var node = cy.getElementById(id); if (!node || !node.length) return;
    selected = node; clearPathState();
    var nb = node.closedNeighborhood();
    cy.elements("node[color], edge").addClass("faded");
    nb.removeClass("faded");
    nb.nodes("node[color]").addClass("hl");
    nb.edges().removeClass("faded").addClass("hl");
    node.removeClass("hl").addClass("sel");
    openDetail(id);
    if (addTrail !== false) pushTrail(id);
    if (focus || window.innerWidth <= 720) focusNode(node);
  }
  function deselect() { selected = null; clearHl(); panel.classList.remove("open"); }
  cy.on("tap", "node[color]", function (e) {
    var id = e.target.id();
    if (traceActive) { handleTraceTap(id); return; }
    selectNode(id, false, true);
  });
  cy.on("tap", function (e) { if (e.target === cy && !traceActive) deselect(); });
  cy.on("mouseover", "node[color]", function (e) {
    if (selected || traceActive || tracePath.length) return;
    var nb = e.target.closedNeighborhood();
    cy.elements("node[color], edge").addClass("faded");
    nb.removeClass("faded"); nb.edges().addClass("hl"); e.target.addClass("hl");
  });
  cy.on("mouseout", "node[color]", function () { if (!selected && !traceActive && !tracePath.length) clearHl(); });
  pbody.addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (!b) return; selectNode(b.getAttribute("data-goto"), true, true); });
  document.getElementById("adm-detail-close").addEventListener("click", deselect);
  if (trailEl) trailEl.addEventListener("click", function (e) {
    if (e.target.closest("#adm-trail-clear")) { trail = []; renderTrail(); return; }
    var b = e.target.closest("[data-goto]"); if (b) selectNode(b.getAttribute("data-goto"), true, true);
  });

  /* ---------- Trace-a-path (shortest directed path) ---------- */
  var traceFrom = null, tracePath = [];
  function bfsPath(a, b) {
    if (a === b) return [a];
    var q = [a], prev = {}; prev[a] = null;
    while (q.length) {
      var cur = q.shift();
      var nx = out[cur] || [];
      for (var i = 0; i < nx.length; i++) {
        var v = nx[i];
        if (!(v in prev)) { prev[v] = cur; if (v === b) { var path = [v]; while (prev[path[0]] != null) path.unshift(prev[path[0]]); return path; } q.push(v); }
      }
    }
    return null;
  }
  function clearPathState() { tracePath = []; }
  function drawPath(path) {
    clearHl(); selected = null; panel.classList.remove("open");
    tracePath = path;
    cy.elements("node[color], edge").addClass("faded");
    for (var i = 0; i < path.length; i++) {
      cy.getElementById(path[i]).removeClass("faded").addClass("path");
      if (i) { var eid = edgeIdBetween(path[i - 1], path[i]); if (eid) cy.getElementById(eid).removeClass("faded hidden").addClass("path"); }
    }
    trail = path.slice(); renderTrail();
    // frame the path
    var col = cy.collection(path.map(function (id) { return cy.getElementById(id); }));
    cy.animate({ fit: { eles: col, padding: 80 } }, { duration: 320 });
    setStatus(path.length + " steps: " + path.map(function (id) { return byId[id].label; }).join("  →  "));
  }
  function edgeIdBetween(a, b) { for (var k = 0; k < edges.length; k++) if (edges[k][0] === a && edges[k][1] === b) return "e" + k; return null; }
  function runTrace(a, b) {
    if (!a || !b) return;
    var path = bfsPath(a, b);
    if (!path) { setStatus("No forward path from “" + byId[a].label + "” to “" + byId[b].label + "”. Try the reverse, or a different pair."); clearHl(); return; }
    drawPath(path);
  }
  function handleTraceTap(id) {
    if (!traceFrom) { traceFrom = id; clearHl(); cy.getElementById(id).addClass("sel"); setStatus("Start: " + byId[id].label + " — now tap the goal node."); }
    else { runTrace(traceFrom, id); traceFrom = null; setTraceMode(false); }
  }
  var statusEl = document.getElementById("adm-status");
  function setStatus(s) { if (statusEl) { statusEl.textContent = s || ""; statusEl.classList.toggle("show", !!s); } }

  /* start/goal dropdowns */
  var selStart = document.getElementById("adm-start"), selGoal = document.getElementById("adm-goal");
  function fillSelect(sel, preferEntry) {
    if (!sel) return;
    var groups = {};
    nodes.forEach(function (n) { (groups[n.lv] = groups[n.lv] || []).push(n); });
    var html = '<option value="">' + (preferEntry ? "Start…" : "Goal…") + '</option>';
    lvKeys.forEach(function (lv) {
      html += '<optgroup label="' + esc((lv + 1) + " · " + levelLabel[lv]) + '">';
      groups[lv].slice().sort(function (a, b) { return a.label.localeCompare(b.label); }).forEach(function (n) {
        html += '<option value="' + esc(n.id) + '">' + esc(n.label) + (n.kind === "entry" ? " ▸" : n.kind === "goal" ? " ★" : "") + '</option>';
      });
      html += '</optgroup>';
    });
    sel.innerHTML = html;
  }
  fillSelect(selStart, true); fillSelect(selGoal, false);
  function tryDropdownTrace() { if (selStart && selGoal && selStart.value && selGoal.value) runTrace(selStart.value, selGoal.value); }
  if (selStart) selStart.addEventListener("change", tryDropdownTrace);
  if (selGoal) selGoal.addEventListener("change", tryDropdownTrace);

  var traceBtn = document.getElementById("adm-trace");
  function setTraceMode(on) {
    traceActive = on; traceFrom = null;
    if (traceBtn) { traceBtn.classList.toggle("on", on); traceBtn.textContent = on ? "Tap start node…" : "Trace path"; }
    if (on) { deselect(); setStatus("Trace mode: tap a start node, then a goal node."); } else setStatus("");
  }
  if (traceBtn) traceBtn.addEventListener("click", function () { setTraceMode(!traceActive); });

  /* ---------- flow-only toggle (hide loop-back / lateral edges) ---------- */
  var flowBtn = document.getElementById("adm-flow"), flowOnly = false;
  if (flowBtn) flowBtn.addEventListener("click", function () {
    flowOnly = !flowOnly; flowBtn.classList.toggle("on", flowOnly);
    cy.edges("[back = 1]").toggleClass("hidden", flowOnly); drawMini();
  });

  /* ---------- legend (category focus) ---------- */
  var legend = document.getElementById("adm-legend"), activeCat = null;
  legend.innerHTML = AD_MAP.cats.map(function (c) { return '<button data-cat="' + c.id + '"><span class="sw" style="background:' + c.color + '"></span>' + esc(c.label) + '</button>'; }).join("");
  legend.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    var cat = b.getAttribute("data-cat");
    legend.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
    if (activeCat === cat) { activeCat = null; clearHl(); return; }
    activeCat = cat; b.classList.add("on"); selected = null; panel.classList.remove("open"); clearPathState();
    cy.elements("node[color], edge").addClass("faded");
    cy.nodes("node[color]").filter(function (n) { return byId[n.id()].cat === cat; }).removeClass("faded").addClass("hl");
  });

  /* type legend (visual language) */
  var tLegend = document.getElementById("adm-typelegend");
  if (tLegend) tLegend.innerHTML = (AD_MAP.types || []).map(function (t) {
    return '<span class="adm-tl ' + esc(t.id) + '" title="' + esc(t.desc) + '"><span class="adm-tl-sw"></span>' + esc(t.label) + '</span>';
  }).join("");

  /* ---------- search / controls ---------- */
  var search = document.getElementById("adm-search");
  search.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var q = search.value.trim().toLowerCase(); if (!q) return;
    var hit = nodes.find(function (n) {
      return n.label.toLowerCase().indexOf(q) !== -1 ||
        (n.tools || []).some(function (t) { return t[0].toLowerCase().indexOf(q) !== -1; }) ||
        (n.attack || []).some(function (a) { return a.toLowerCase().indexOf(q) !== -1; }) ||
        (n.cmds || []).some(function (c) { return c.toLowerCase().indexOf(q) !== -1; });
    });
    if (hit) selectNode(hit.id, true, true);
  });
  document.getElementById("adm-fit").addEventListener("click", function () { cy.animate({ fit: { padding: 42 } }, { duration: 260 }); });
  document.getElementById("adm-reset").addEventListener("click", function () {
    deselect(); clearPathState(); activeCat = null; setTraceMode(false); trail = []; renderTrail(); setStatus("");
    legend.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
    if (selStart) selStart.value = ""; if (selGoal) selGoal.value = "";
    cy.animate({ fit: { padding: 42 } }, { duration: 260 });
  });

  /* ---------- minimap ---------- */
  var mini = document.getElementById("adm-mini"), mctx = mini && mini.getContext ? mini.getContext("2d") : null;
  var gbb = null;
  function graphBB() { if (!gbb) gbb = cy.elements("node[color]").boundingBox(); return gbb; }
  function drawMini() {
    if (!mctx) return;
    var W = mini.width, H = mini.height, bb = graphBB();
    var pad = 6, sx = (W - pad * 2) / bb.w, sy = (H - pad * 2) / bb.h, s = Math.min(sx, sy);
    var ox = pad + (W - pad * 2 - bb.w * s) / 2, oy = pad + (H - pad * 2 - bb.h * s) / 2;
    mctx.clearRect(0, 0, W, H);
    mini._map = { s: s, ox: ox, oy: oy, bb: bb };
    cy.nodes("node[color]").forEach(function (n) {
      var pp = n.position(), x = ox + (pp.x - bb.x1) * s, y = oy + (pp.y - bb.y1) * s;
      mctx.fillStyle = n.data("color"); mctx.globalAlpha = n.hasClass("faded") ? 0.25 : 0.9;
      mctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    });
    mctx.globalAlpha = 1;
    // viewport rectangle
    var ext = cy.extent();
    var rx = ox + (ext.x1 - bb.x1) * s, ry = oy + (ext.y1 - bb.y1) * s, rw = (ext.x2 - ext.x1) * s, rh = (ext.y2 - ext.y1) * s;
    mctx.strokeStyle = "#ff9d4d"; mctx.lineWidth = 1.2;
    mctx.strokeRect(Math.max(0, rx), Math.max(0, ry), Math.min(W, rw), Math.min(H, rh));
  }
  function miniTo(evt) {
    if (!mini._map) return;
    var r = mini.getBoundingClientRect(), m = mini._map;
    var cxp = (evt.clientX - r.left) * (mini.width / r.width), cyp = (evt.clientY - r.top) * (mini.height / r.height);
    var gx = m.bb.x1 + (cxp - m.ox) / m.s, gy = m.bb.y1 + (cyp - m.oy) / m.s;
    var z = cy.zoom();
    cy.animate({ pan: { x: cy.width() / 2 - gx * z, y: cy.height() / 2 - gy * z } }, { duration: 180 });
  }
  if (mini) {
    var dragging = false;
    mini.addEventListener("mousedown", function (e) { dragging = true; miniTo(e); });
    mini.addEventListener("mousemove", function (e) { if (dragging) miniTo(e); });
    window.addEventListener("mouseup", function () { dragging = false; });
    mini.addEventListener("click", miniTo);
  }

  /* ---------- mobile guided (levels) view ---------- */
  var guided = document.getElementById("adm-guided"), guidedBtn = document.getElementById("adm-guided-btn"), stage = document.querySelector(".adm-stage");
  function buildGuided() {
    if (!guided) return;
    var html = "";
    lvKeys.forEach(function (lv) {
      var arr = levels[lv].map(function (id) { return byId[id]; });
      html += '<details class="adm-acc" ' + (lv === 0 ? "open" : "") + '><summary><span class="adm-acc-n">' + (lv + 1) + '</span>' + esc(levelLabel[lv]) + '<span class="adm-acc-c">' + arr.length + '</span></summary><div class="adm-acc-body">';
      arr.forEach(function (n) {
        html += '<button class="adm-acc-node ' + esc(n.type) + '" data-node="' + esc(n.id) + '"><span class="adm-acc-sw" style="background:' + catColor[n.cat] + '"></span><span class="adm-acc-t">' + (n.kind === "entry" ? "▸ " : "") + esc(n.label) + '</span></button>';
        html += '<div class="adm-acc-detail" data-detail="' + esc(n.id) + '"></div>';
      });
      html += '</div></details>';
    });
    guided.innerHTML = html;
  }
  if (guided) {
    buildGuided();
    guided.addEventListener("click", function (e) {
      var b = e.target.closest("[data-node]"); if (!b) return;
      var id = b.getAttribute("data-node"), det = guided.querySelector('[data-detail="' + CSS.escape(id) + '"]');
      var open = b.classList.toggle("open");
      if (det) { det.innerHTML = open ? '<div class="adm-acc-detail-in">' + detailHTML(byId[id]) + '</div>' : ""; det.classList.toggle("open", open); }
    });
    // in-accordion chip navigation
    guided.addEventListener("click", function (e) {
      var g = e.target.closest("[data-goto]"); if (!g) return;
      e.preventDefault();
      var id = g.getAttribute("data-goto");
      var host = guided.querySelector('[data-node="' + CSS.escape(id) + '"]');
      if (host && !host.classList.contains("open")) host.click();
      if (host) host.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  function setGuided(on) {
    document.body.classList.toggle("adm-guided-on", on);
    if (guidedBtn) { guidedBtn.classList.toggle("on", on); guidedBtn.setAttribute("aria-pressed", on ? "true" : "false"); }
    if (on) panel.classList.remove("open");
    else setTimeout(function () { cy.resize(); cy.fit(undefined, 42); drawMini(); }, 30);
  }
  if (guidedBtn) guidedBtn.addEventListener("click", function () { setGuided(!document.body.classList.contains("adm-guided-on")); });
  // default to guided on small screens
  if (window.innerWidth <= 720) setGuided(true);

  /* ---------- boot ---------- */
  cy.ready(function () { cy.fit(undefined, 42); setTimeout(drawMini, 60); });
  window.addEventListener("resize", function () { gbb = null; cy.resize(); drawMini(); });
  var m = location.search.match(/[?&]node=([^&]+)/);
  if (m) { var dn = decodeURIComponent(m[1]); if (byId[dn]) setTimeout(function () { selectNode(dn, true, true); }, 220); }
})();
