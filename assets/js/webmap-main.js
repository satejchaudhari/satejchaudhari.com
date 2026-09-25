/*
  Renders WEB_MAP (assets/js/webmap.js) into web-map.html:
  colour-coded PHASE accordions -> collapsible GROUPS (each with a
  "when to test" scenario) -> checkable ITEMS with tool / vuln chips.

  Checkbox state is saved per-browser in localStorage. You never edit this
  file for content — edit assets/js/webmap.js instead.
*/
(function () {
  var root = document.getElementById("webmap-root");
  if (!root || typeof WEB_MAP === "undefined") return;
  var DATA = WEB_MAP;
  var STORE_KEY = "webmap-checks-v1";

  /* ---------- state ---------- */
  var state = {};
  try { state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) { state = {}; }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- helpers ---------- */
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }
  function itemId(group, item, i) { return group.id + ":" + (slug(item.text) || i); }

  var WRENCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18l3 3 6.4-6.3a4 4 0 0 0 5.3-5.4l-2.6 2.6-2-2 2.6-2.6z"></path></svg>';
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z"></path></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var TARGET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg>';

  function toolChip(t) {
    if (t.id) return '<a class="webmap-chip tool" href="tool-detail.html?tool=' + attr(t.id) + '" title="Open in the toolkit">' + WRENCH + esc(t.n) + '</a>';
    return '<span class="webmap-chip tool disabled" title="Not in the toolkit yet">' + WRENCH + esc(t.n) + '</span>';
  }
  function vulnChip(v) {
    if (v.id) return '<a class="webmap-chip vuln" href="vuln-detail.html?vuln=' + attr(v.id) + '" title="Open in Vulns &amp; Misconfigs">' + SHIELD + esc(v.n) + '</a>';
    return '<span class="webmap-chip vuln disabled" title="Not documented yet">' + SHIELD + esc(v.n) + '</span>';
  }

  /* ---------- render ---------- */
  function itemHTML(group, item, i) {
    var id = itemId(group, item, i);
    var cid = "cb-" + id.replace(/[^a-z0-9]+/gi, "-");
    var checked = state[id] ? " checked" : "";
    var h = '<li class="webmap-item' + (state[id] ? " done" : "") + '" data-item="' + attr(id) + '">';
    h += '<input type="checkbox" class="webmap-check" id="' + attr(cid) + '" data-id="' + attr(id) + '"' + checked + '>';
    h += '<div class="webmap-item-body">';
    h += '<label class="webmap-item-text" for="' + attr(cid) + '">' + esc(item.text) + '</label>';
    // one-line description — placeholder until filled in the data file
    h += item.desc
      ? '<p class="webmap-item-desc">' + esc(item.desc) + '</p>'
      : '<p class="webmap-item-desc empty">Note coming soon</p>';
    var chips = (item.tools || []).map(toolChip).concat((item.vulns || []).map(vulnChip));
    if (chips.length) h += '<div class="webmap-chips">' + chips.join("") + '</div>';
    h += '</div></li>';
    return h;
  }

  function groupHTML(group) {
    var total = group.items.length;
    var h = '<div class="webmap-group" id="grp-' + attr(group.id) + '">';
    h += '<button class="webmap-group-head" data-group="' + attr(group.id) + '">';
    h += '<span class="webmap-group-title">' + esc(group.title) + '</span>';
    h += '<span class="webmap-gcount" data-gcount="' + attr(group.id) + '">0/' + total + '</span>';
    h += '<span class="webmap-caret">' + ARROW + '</span>';
    h += '</button>';
    h += '<div class="webmap-group-body" hidden>';
    if (group.scenario) {
      h += '<div class="webmap-scenario">' + TARGET + '<span><b>When to test</b> &mdash; ' + esc(group.scenario) + '</span></div>';
    }
    h += '<ul class="webmap-items">' + group.items.map(function (it, i) { return itemHTML(group, it, i); }).join("") + '</ul>';
    h += '</div></div>';
    return h;
  }

  function sectionHTML(s) {
    var total = 0; s.groups.forEach(function (g) { total += g.items.length; });
    var h = '<section class="webmap-section" id="sec-' + attr(s.id) + '" style="--sc:' + attr(s.color || "var(--accent)") + '">';
    h += '<button class="webmap-head" data-sec="' + attr(s.id) + '" aria-expanded="false">';
    h += '<span class="webmap-swatch"></span>';
    h += '<span class="webmap-head-main"><span class="webmap-title">' + esc(s.title) + (s.tag ? '<span class="webmap-tag">' + esc(s.tag) + '</span>' : "") + '</span>';
    if (s.desc) h += '<span class="webmap-sub">' + esc(s.desc) + '</span>';
    h += '</span>';
    h += '<span class="webmap-progress" data-count="' + attr(s.id) + '">0/' + total + '</span>';
    h += '<span class="webmap-caret">' + ARROW + '</span>';
    h += '</button>';
    h += '<div class="webmap-body" hidden>' + s.groups.map(groupHTML).join("") + '</div>';
    h += '</section>';
    return h;
  }

  root.innerHTML = DATA.sections.map(sectionHTML).join("");

  /* ---------- counts / progress ---------- */
  function countChecked(items, group) {
    var n = 0; items.forEach(function (it, i) { if (state[itemId(group, it, i)]) n++; }); return n;
  }
  function refreshCounts() {
    var grand = 0, gtotal = 0;
    DATA.sections.forEach(function (s) {
      var secDone = 0, secTotal = 0;
      s.groups.forEach(function (g) {
        var done = countChecked(g.items, g), tot = g.items.length;
        secDone += done; secTotal += tot;
        var gc = root.querySelector('[data-gcount="' + g.id + '"]');
        if (gc) { gc.textContent = done + "/" + tot; gc.classList.toggle("full", done === tot && tot > 0); }
      });
      grand += secDone; gtotal += secTotal;
      var sc = root.querySelector('[data-count="' + s.id + '"]');
      if (sc) { sc.textContent = secDone + "/" + secTotal; sc.classList.toggle("full", secDone === secTotal && secTotal > 0); }
    });
    var bar = document.getElementById("webmap-bar-fill"), lbl = document.getElementById("webmap-bar-label");
    var pct = gtotal ? Math.round((grand / gtotal) * 100) : 0;
    if (bar) bar.style.width = pct + "%";
    if (lbl) lbl.textContent = grand + " / " + gtotal + " checks (" + pct + "%)";
  }
  refreshCounts();

  /* ---------- interaction ---------- */
  function openSection(id, scroll) {
    var sec = document.getElementById("sec-" + id); if (!sec) return;
    sec.classList.add("open");
    sec.querySelector(".webmap-head").setAttribute("aria-expanded", "true");
    sec.querySelector(".webmap-body").hidden = false;
    if (scroll) { sec.scrollIntoView({ behavior: "smooth", block: "start" }); sec.classList.add("flash"); setTimeout(function () { sec.classList.remove("flash"); }, 1200); }
  }
  function closeSection(sec) {
    sec.classList.remove("open");
    sec.querySelector(".webmap-head").setAttribute("aria-expanded", "false");
    sec.querySelector(".webmap-body").hidden = true;
    // also collapse its groups so it reopens clean
    sec.querySelectorAll(".webmap-group.open").forEach(function (g) { g.classList.remove("open"); g.querySelector(".webmap-group-body").hidden = true; });
  }
  function toggleGroup(id) {
    var el = document.getElementById("grp-" + id); if (!el) return;
    var open = el.classList.toggle("open");
    el.querySelector(".webmap-group-body").hidden = !open;
  }

  root.addEventListener("click", function (e) {
    var gh = e.target.closest(".webmap-group-head");
    if (gh) { toggleGroup(gh.getAttribute("data-group")); return; }
    var head = e.target.closest(".webmap-head");
    if (head) {
      var sec = document.getElementById("sec-" + head.getAttribute("data-sec"));
      if (sec.classList.contains("open")) closeSection(sec); else openSection(head.getAttribute("data-sec"), false);
      return;
    }
  });

  root.addEventListener("change", function (e) {
    var cb = e.target.closest(".webmap-check"); if (!cb) return;
    var id = cb.getAttribute("data-id");
    if (cb.checked) state[id] = 1; else delete state[id];
    var li = cb.closest(".webmap-item"); if (li) li.classList.toggle("done", cb.checked);
    save(); refreshCounts();
  });

  /* controls */
  var exp = document.getElementById("webmap-expand"), col = document.getElementById("webmap-collapse"), rst = document.getElementById("webmap-reset");
  if (exp) exp.addEventListener("click", function () { DATA.sections.forEach(function (s) { openSection(s.id, false); }); });
  if (col) col.addEventListener("click", function () { DATA.sections.forEach(function (s) { var sec = document.getElementById("sec-" + s.id); if (sec) closeSection(sec); }); });
  if (rst) rst.addEventListener("click", function () {
    if (!confirm("Reset every check? This clears your saved progress on this page.")) return;
    state = {}; save();
    root.querySelectorAll(".webmap-check").forEach(function (cb) { cb.checked = false; });
    root.querySelectorAll(".webmap-item.done").forEach(function (li) { li.classList.remove("done"); });
    refreshCounts();
  });

  /* deep-link: #<section-id> opens (and optionally #<section>/<group>) */
  function openFromHash() {
    var m = (location.hash || "").replace(/^#/, ""); if (!m) return;
    var parts = m.split("/");
    if (document.getElementById("sec-" + parts[0])) {
      openSection(parts[0], true);
      if (parts[1]) setTimeout(function () { var g = document.getElementById("grp-" + parts[1]); if (g && !g.classList.contains("open")) toggleGroup(parts[1]); }, 320);
    }
  }
  window.addEventListener("hashchange", openFromHash);
  if (location.hash) openFromHash();
  else if (DATA.sections[0]) openSection(DATA.sections[0].id, false);
})();
