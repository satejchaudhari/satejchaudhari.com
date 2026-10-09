/*
  RED TEAM WORKFLOW — renders RTW_MAP (assets/js/rtwmap.js) into
  red-team-workflow.html. Two parts, two different UIs:

    recon  -> a CHECKLIST (webmap style): phases -> groups -> checkable items,
              progress saved per browser. OSINT is a coverage list, so it ticks.
    access -> a PLAYBOOK (ad-explorer style): vectors -> techniques, each with a
              note, a command, tool/theory chips, outcome badges, and jumpable
              "on success" links to the follow-up step. Initial access is a menu
              of options, not a list to complete, so it does NOT tick.

  You never edit this file for content — edit assets/js/rtwmap.js instead.
*/
(function () {
  if (typeof RTW_MAP === "undefined") return;
  var RECON = (RTW_MAP.recon && RTW_MAP.recon.sections) || [];
  var ACCESS = (RTW_MAP.access && RTW_MAP.access.sections) || [];

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

  var WRENCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18l3 3 6.4-6.3a4 4 0 0 0 5.3-5.4l-2.6 2.6-2-2 2.6-2.6z"></path></svg>';
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z"></path></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var RARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
  var TARGET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle></svg>';
  var BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
  var LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"></path><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"></path></svg>';
  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  function toolChip(t) {
    if (t.id) return '<a class="webmap-chip tool" href="tool-detail.html?tool=' + attr(t.id) + '" title="Open in the toolkit">' + WRENCH + esc(t.n) + '</a>';
    if (t.url) return '<a class="webmap-chip tool" href="' + attr(t.url) + '" target="_blank" rel="noopener" title="External resource">' + LINK + esc(t.n) + '</a>';
    return '<span class="webmap-chip tool disabled" title="Not in the toolkit yet">' + WRENCH + esc(t.n) + '</span>';
  }
  function vulnChip(v) {
    if (v.url) return '<a class="webmap-chip vuln" href="' + attr(v.url) + '"' + (/^https?:/.test(v.url) ? ' target="_blank" rel="noopener"' : '') + ' title="Reference">' + (/^https?:/.test(v.url) ? LINK : SHIELD) + esc(v.n) + '</a>';
    if (v.id) return '<a class="webmap-chip vuln" href="vuln-detail.html?vuln=' + attr(v.id) + '" title="Open in Vulns &amp; Misconfigs">' + SHIELD + esc(v.n) + '</a>';
    return '<span class="webmap-chip vuln disabled" title="Not documented yet">' + SHIELD + esc(v.n) + '</span>';
  }

  /* =================================================================== */
  /* PART 1 — RECON CHECKLIST (webmap style)                             */
  /* =================================================================== */
  var reconRoot = document.getElementById("recon-root");
  var STORE_KEY = "rtw-recon-v1";
  var state = {};
  try { state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) { state = {}; }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function itemId(group, item, i) { return group.id + ":" + (slug(item.text) || i); }

  function cItemHTML(group, item, i) {
    var id = itemId(group, item, i);
    var cid = "rcb-" + id.replace(/[^a-z0-9]+/gi, "-");
    var h = '<li class="webmap-item' + (state[id] ? " done" : "") + '" data-item="' + attr(id) + '">';
    h += '<input type="checkbox" class="webmap-check" id="' + attr(cid) + '" data-id="' + attr(id) + '"' + (state[id] ? " checked" : "") + '>';
    h += '<div class="webmap-item-body">';
    h += '<label class="webmap-item-text" for="' + attr(cid) + '">' + esc(item.text) + '</label>';
    h += item.desc ? '<p class="webmap-item-desc">' + esc(item.desc) + '</p>' : '<p class="webmap-item-desc empty">Note coming soon</p>';
    var chips = (item.tools || []).map(toolChip).concat((item.vulns || []).map(vulnChip));
    if (chips.length) h += '<div class="webmap-chips">' + chips.join("") + '</div>';
    h += '</div></li>';
    return h;
  }
  function cGroupHTML(group) {
    var h = '<div class="webmap-group" id="rgrp-' + attr(group.id) + '">';
    h += '<button class="webmap-group-head" data-group="' + attr(group.id) + '"><span class="webmap-group-title">' + esc(group.title) + '</span>';
    h += '<span class="webmap-gcount" data-gcount="' + attr(group.id) + '">0/' + group.items.length + '</span><span class="webmap-caret">' + ARROW + '</span></button>';
    h += '<div class="webmap-group-body" hidden>';
    if (group.scenario) h += '<div class="webmap-scenario">' + TARGET + '<span><b>When to use</b> &mdash; ' + esc(group.scenario) + '</span></div>';
    h += '<ul class="webmap-items">' + group.items.map(function (it, i) { return cItemHTML(group, it, i); }).join("") + '</ul>';
    h += '</div></div>';
    return h;
  }
  function cSectionHTML(s) {
    var total = 0; s.groups.forEach(function (g) { total += g.items.length; });
    var h = '<section class="webmap-section" id="rsec-' + attr(s.id) + '" style="--sc:' + attr(s.color || "var(--accent)") + '">';
    h += '<button class="webmap-head" data-sec="' + attr(s.id) + '" aria-expanded="false"><span class="webmap-swatch"></span>';
    h += '<span class="webmap-head-main"><span class="webmap-title">' + esc(s.title) + (s.tag ? '<span class="webmap-tag">' + esc(s.tag) + '</span>' : "") + '</span>';
    if (s.desc) h += '<span class="webmap-sub">' + esc(s.desc) + '</span>';
    h += '</span><span class="webmap-progress" data-count="' + attr(s.id) + '">0/' + total + '</span><span class="webmap-caret">' + ARROW + '</span></button>';
    h += '<div class="webmap-body" hidden>' + s.groups.map(cGroupHTML).join("") + '</div></section>';
    return h;
  }
  if (reconRoot) reconRoot.innerHTML = RECON.map(cSectionHTML).join("");

  function countChecked(items, group) { var n = 0; items.forEach(function (it, i) { if (state[itemId(group, it, i)]) n++; }); return n; }
  function refreshCounts() {
    if (!reconRoot) return;
    var grand = 0, gtotal = 0;
    RECON.forEach(function (s) {
      var sd = 0, st = 0;
      s.groups.forEach(function (g) {
        var done = countChecked(g.items, g), tot = g.items.length; sd += done; st += tot;
        var gc = reconRoot.querySelector('[data-gcount="' + g.id + '"]');
        if (gc) { gc.textContent = done + "/" + tot; gc.classList.toggle("full", done === tot && tot > 0); }
      });
      grand += sd; gtotal += st;
      var sc = reconRoot.querySelector('[data-count="' + s.id + '"]');
      if (sc) { sc.textContent = sd + "/" + st; sc.classList.toggle("full", sd === st && st > 0); }
    });
    var bar = document.getElementById("rtw-recon-bar-fill"), lbl = document.getElementById("rtw-recon-bar-label");
    var pct = gtotal ? Math.round((grand / gtotal) * 100) : 0;
    if (bar) bar.style.width = pct + "%";
    if (lbl) lbl.textContent = grand + " / " + gtotal + " checks (" + pct + "%)";
  }
  refreshCounts();

  function rOpen(id, scroll) {
    var sec = document.getElementById("rsec-" + id); if (!sec) return;
    sec.classList.add("open"); sec.querySelector(".webmap-head").setAttribute("aria-expanded", "true"); sec.querySelector(".webmap-body").hidden = false;
    if (scroll) { sec.scrollIntoView({ behavior: "smooth", block: "start" }); sec.classList.add("flash"); setTimeout(function () { sec.classList.remove("flash"); }, 1200); }
  }
  function rClose(sec) {
    sec.classList.remove("open"); sec.querySelector(".webmap-head").setAttribute("aria-expanded", "false"); sec.querySelector(".webmap-body").hidden = true;
    sec.querySelectorAll(".webmap-group.open").forEach(function (g) { g.classList.remove("open"); g.querySelector(".webmap-group-body").hidden = true; });
  }
  if (reconRoot) {
    reconRoot.addEventListener("click", function (e) {
      var gh = e.target.closest(".webmap-group-head");
      if (gh) { var el = document.getElementById("rgrp-" + gh.getAttribute("data-group")); if (el) { var o = el.classList.toggle("open"); el.querySelector(".webmap-group-body").hidden = !o; } return; }
      var head = e.target.closest(".webmap-head");
      if (head) { var sec = document.getElementById("rsec-" + head.getAttribute("data-sec")); if (sec.classList.contains("open")) rClose(sec); else rOpen(head.getAttribute("data-sec"), false); return; }
    });
    reconRoot.addEventListener("change", function (e) {
      var cb = e.target.closest(".webmap-check"); if (!cb) return;
      var id = cb.getAttribute("data-id");
      if (cb.checked) state[id] = 1; else delete state[id];
      var li = cb.closest(".webmap-item"); if (li) li.classList.toggle("done", cb.checked);
      save(); refreshCounts();
    });
  }
  var rE = document.getElementById("rtw-recon-expand"), rC = document.getElementById("rtw-recon-collapse"), rR = document.getElementById("rtw-recon-reset");
  if (rE) rE.addEventListener("click", function () { RECON.forEach(function (s) { rOpen(s.id, false); }); });
  if (rC) rC.addEventListener("click", function () { RECON.forEach(function (s) { var sec = document.getElementById("rsec-" + s.id); if (sec) rClose(sec); }); });
  if (rR) rR.addEventListener("click", function () {
    if (!confirm("Reset every recon check? This clears your saved progress on this page.")) return;
    state = {}; save();
    reconRoot.querySelectorAll(".webmap-check").forEach(function (cb) { cb.checked = false; });
    reconRoot.querySelectorAll(".webmap-item.done").forEach(function (li) { li.classList.remove("done"); });
    refreshCounts();
  });

  /* =================================================================== */
  /* PART 2 — INITIAL ACCESS PLAYBOOK (ad-explorer style)                */
  /* =================================================================== */
  var accessRoot = document.getElementById("access-root");
  var byId = {}; ACCESS.forEach(function (s) { byId[s.id] = s; });

  function fmtCmd(s) {
    s = String(s);
    var i = s.indexOf("#");
    while (i !== -1 && i !== 0 && s[i - 1] !== " ") i = s.indexOf("#", i + 1);
    if (i === -1) return esc(s);
    return esc(s.slice(0, i)) + '<span class="cmd-comment">' + esc(s.slice(i)) + "</span>";
  }
  function cmdBlock(c) {
    return '<div class="command-block"><button class="adv2-copy" title="Copy" aria-label="Copy command">' + COPY + '</button><pre><code>' + fmtCmd(c) + '</code></pre></div>';
  }
  function terminalTagsHTML(list) {
    if (!list || !list.length) return "";
    return '<div class="adv2-outcomes">' + list.map(function (o) {
      return '<span class="adv2-outcome terminal"' + (o.color ? ' style="--oc:' + attr(o.color) + '"' : "") + '>' + esc(o.label) + '</span>';
    }).join("") + '</div>';
  }
  function moveRow(m) {
    // external page (url) or in-page access section (sec [/ tech])
    if (m.url) {
      return '<div class="adv2-move-row"><a class="adv2-move ext" href="' + attr(m.url) + '" style="--mc:' + attr(m.color || "var(--accent)") + '">' +
        '<span class="adv2-move-dot"></span><span class="adv2-move-to">' + esc(m.label) + '</span>' + RARROW + '</a>' +
        (m.note ? '<span class="adv2-move-note">' + esc(m.note) + '</span>' : "") + '</div>';
    }
    var sec = byId[m.sec]; if (!sec) return "";
    var col = sec.color || "var(--accent)";
    var chip = '<button class="adv2-move" data-goto="' + attr(m.sec) + '"' + (m.tech ? ' data-tech="' + attr(m.tech) + '"' : '') +
      ' style="--mc:' + attr(col) + '" title="Go to ' + attr(sec.title) + '"><span class="adv2-move-dot"></span><span class="adv2-move-to">' + esc(m.label || sec.title) + '</span>' + RARROW + '</button>';
    return '<div class="adv2-move-row">' + chip + (m.note ? '<span class="adv2-move-note">' + esc(m.note) + '</span>' : "") + '</div>';
  }
  function movesHTML(list) {
    var rows = (list || []).map(moveRow).filter(Boolean);
    if (!rows.length) return "";
    return '<div class="adv2-moves"><p class="adv2-moves-l">On success &mdash; next step</p>' + rows.join("") + '</div>';
  }
  function techHTML(t) {
    var h = '<div class="adv2-tech" id="atech-' + attr(t.id) + '">';
    h += '<button class="adv2-tech-btn" data-tech="' + attr(t.id) + '"><span class="adv2-tech-t">' + esc(t.title) + '</span><span class="adv2-tech-caret">' + ARROW + '</span></button>';
    h += '<div class="adv2-tech-body" hidden>';
    var links = [];
    (t.tools || []).forEach(function (tc) {
      if (tc.id) links.push('<a class="adv2-chip tool" href="tool-detail.html?tool=' + attr(tc.id) + '">' + WRENCH + esc(tc.n) + '</a>');
      else if (tc.url) links.push('<a class="adv2-chip tool" href="' + attr(tc.url) + '" target="_blank" rel="noopener">' + LINK + esc(tc.n) + '</a>');
      else links.push('<span class="adv2-chip tool disabled" title="Not in the toolkit yet">' + WRENCH + esc(tc.n) + '</span>');
    });
    if (t.theory) {
      if (t.theory.url) links.push('<a class="adv2-chip theory" href="' + attr(t.theory.url) + '"' + (/^https?:/.test(t.theory.url) ? ' target="_blank" rel="noopener"' : '') + '>' + BOOK + esc(t.theory.label || "Theory") + '</a>');
      else links.push('<span class="adv2-chip theory disabled">' + BOOK + esc(t.theory.label || "Theory") + '</span>');
    }
    (t.vulns || []).forEach(function (v) {
      if (v.id) links.push('<a class="adv2-chip vuln" href="vuln-detail.html?vuln=' + attr(v.id) + '">' + SHIELD + esc(v.n) + '</a>');
      else if (v.url) links.push('<a class="adv2-chip vuln" href="' + attr(v.url) + '">' + SHIELD + esc(v.n) + '</a>');
    });
    if (links.length) h += '<div class="adv2-links">' + links.join("") + '</div>';
    if (t.note) h += '<p class="adv2-desc">' + esc(t.note) + '</p>';
    var cmds = t.cmds || (t.cmd ? [t.cmd] : []);
    if (cmds.length) h += '<div class="adv2-cmds">' + cmds.map(cmdBlock).join("") + '</div>';
    h += terminalTagsHTML(t.outcomes);
    h += movesHTML(t.moveTo);
    h += '</div></div>';
    return h;
  }
  function aSectionHTML(s) {
    var h = '<section class="adv2-section" id="asec-' + attr(s.id) + '" style="--sc:' + attr(s.color || "var(--accent)") + '">';
    h += '<button class="adv2-head" data-sec="' + attr(s.id) + '" aria-expanded="false"><span class="adv2-swatch"></span>';
    h += '<span class="adv2-head-main"><span class="adv2-title">' + esc(s.title) + (s.tag ? '<span class="adv2-tag">' + esc(s.tag) + '</span>' : "") + '</span>';
    if (s.desc) h += '<span class="adv2-sub">' + esc(s.desc) + '</span>';
    h += '</span><span class="adv2-count">' + (s.techniques ? s.techniques.length : 0) + '</span><span class="adv2-caret">' + ARROW + '</span></button>';
    h += '<div class="adv2-body" hidden>' + (s.techniques || []).map(techHTML).join("") + '</div></section>';
    return h;
  }
  if (accessRoot) accessRoot.innerHTML = ACCESS.map(aSectionHTML).join("");

  function aOpen(id, scroll) {
    var sec = document.getElementById("asec-" + id); if (!sec) return;
    sec.classList.add("open"); sec.querySelector(".adv2-head").setAttribute("aria-expanded", "true"); sec.querySelector(".adv2-body").hidden = false;
    if (scroll) { sec.scrollIntoView({ behavior: "smooth", block: "start" }); sec.classList.add("flash"); setTimeout(function () { sec.classList.remove("flash"); }, 1200); }
  }
  function aClose(sec) {
    sec.classList.remove("open"); sec.querySelector(".adv2-head").setAttribute("aria-expanded", "false"); sec.querySelector(".adv2-body").hidden = true;
    sec.querySelectorAll(".adv2-tech.open").forEach(function (el) { el.classList.remove("open"); var b = el.querySelector(".adv2-tech-body"); if (b) b.hidden = true; });
  }
  function aToggleTech(id) { var el = document.getElementById("atech-" + id); if (!el) return; var b = el.querySelector(".adv2-tech-body"); var o = el.classList.toggle("open"); b.hidden = !o; }
  function aOpenTech(id) {
    if (!id) return;
    setTimeout(function () {
      var el = document.getElementById("atech-" + id); if (!el || el.classList.contains("open")) return;
      el.classList.add("open"); var b = el.querySelector(".adv2-tech-body"); if (b) b.hidden = false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 380);
  }
  if (accessRoot) {
    accessRoot.addEventListener("click", function (e) {
      var copy = e.target.closest(".adv2-copy");
      if (copy) {
        var code = copy.parentNode.querySelector("code"); if (!code) return;
        var text = code.innerText;
        function done() { copy.classList.add("copied"); setTimeout(function () { copy.classList.remove("copied"); }, 1100); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
        else { try { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); done(); } catch (x) {} }
        return;
      }
      var move = e.target.closest(".adv2-move");
      if (move && move.getAttribute("data-goto")) { aOpen(move.getAttribute("data-goto"), true); aOpenTech(move.getAttribute("data-tech")); return; }
      var techBtn = e.target.closest(".adv2-tech-btn");
      if (techBtn) { aToggleTech(techBtn.getAttribute("data-tech")); return; }
      var head = e.target.closest(".adv2-head");
      if (head) { var sec = document.getElementById("asec-" + head.getAttribute("data-sec")); if (sec.classList.contains("open")) aClose(sec); else aOpen(head.getAttribute("data-sec"), false); return; }
    });
  }
  var aE = document.getElementById("rtw-access-expand"), aC = document.getElementById("rtw-access-collapse");
  if (aE) aE.addEventListener("click", function () { ACCESS.forEach(function (s) { aOpen(s.id, false); }); });
  if (aC) aC.addEventListener("click", function () { ACCESS.forEach(function (s) { var sec = document.getElementById("asec-" + s.id); if (sec) aClose(sec); }); });

  /* =================================================================== */
  /* JUMP NAV + deep links                                               */
  /* =================================================================== */
  var nav = document.getElementById("rtw-nav");
  if (nav) {
    var h = '<span class="rtw-nav-l">Recon</span>';
    h += RECON.map(function (s) { return '<button class="rtw-jump" data-part="r" data-id="' + attr(s.id) + '" style="--jc:' + attr(s.color || "var(--accent)") + '">' + esc(s.title) + '</button>'; }).join("");
    h += '<span class="rtw-nav-sep"></span><span class="rtw-nav-l">Initial access</span>';
    h += ACCESS.map(function (s) { return '<button class="rtw-jump" data-part="a" data-id="' + attr(s.id) + '" style="--jc:' + attr(s.color || "var(--accent)") + '">' + esc(s.title) + '</button>'; }).join("");
    nav.innerHTML = h;
    nav.addEventListener("click", function (e) {
      var b = e.target.closest(".rtw-jump"); if (!b) return;
      if (b.getAttribute("data-part") === "r") rOpen(b.getAttribute("data-id"), true);
      else aOpen(b.getAttribute("data-id"), true);
    });
  }
  function openFromHash() {
    var m = (location.hash || "").replace(/^#/, ""); if (!m) return;
    var parts = m.split("/");
    if (parts[0] === "access" && byId[parts[1]]) { aOpen(parts[1], true); aOpenTech(parts[2]); return; }
    if (parts[0] === "recon") { rOpen(parts[1], true); return; }
    if (byId[parts[0]]) { aOpen(parts[0], true); aOpenTech(parts[1]); return; }
    if (document.getElementById("rsec-" + parts[0])) rOpen(parts[0], true);
  }
  window.addEventListener("hashchange", openFromHash);
  if (location.hash) openFromHash();
  else { if (RECON[0]) rOpen(RECON[0].id, false); if (ACCESS[0]) aOpen(ACCESS[0].id, false); }
})();
