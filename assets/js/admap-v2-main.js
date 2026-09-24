/*
  Renders AD_MAP_V2 (assets/js/admap-v2.js) into ad-map-v2.html as a set of
  colour-coded, expandable section cards. Section -> techniques -> detail
  (theory/CVE link, description, commands, and cross-section "move to" links).

  You never edit this file — edit assets/js/admap-v2.js instead.
*/
(function () {
  var root = document.getElementById("adv2-root");
  if (!root || typeof AD_MAP_V2 === "undefined") return;
  var DATA = AD_MAP_V2;

  var byId = {};
  DATA.sections.forEach(function (s) { byId[s.id] = s; });

  /* ---------- helpers ---------- */
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }
  // dim shell-style "# comments" so the typed command stays in focus
  function fmtCmd(s) {
    s = String(s);
    var i = s.indexOf("#");
    while (i !== -1 && i !== 0 && s[i - 1] !== " ") i = s.indexOf("#", i + 1);
    if (i === -1) return esc(s);
    return esc(s.slice(0, i)) + '<span class="cmd-comment">' + esc(s.slice(i)) + "</span>";
  }
  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  var BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z"></path></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
  function cmdBlock(c) {
    return '<div class="command-block"><button class="adv2-copy" title="Copy" aria-label="Copy command">' + COPY + '</button><pre><code>' + fmtCmd(c) + '</code></pre></div>';
  }

  /* ---------- render ---------- */
  function techniqueHTML(sec, t) {
    var h = '<div class="adv2-tech" id="tech-' + attr(t.id) + '">';
    h += '<button class="adv2-tech-btn" data-tech="' + attr(t.id) + '"><span class="adv2-tech-t">' + esc(t.title) + '</span><span class="adv2-tech-caret">' + ARROW + '</span></button>';
    h += '<div class="adv2-tech-body" hidden>';
    // links row (theory / cve)
    var links = [];
    if (t.theory && t.theory.url) links.push('<a class="adv2-chip theory" href="' + attr(t.theory.url) + '">' + BOOK + esc(t.theory.label || "Theory") + '</a>');
    if (t.cve && t.cve.url) links.push('<a class="adv2-chip cve" href="' + attr(t.cve.url) + '" target="_blank" rel="noopener">' + SHIELD + esc(t.cve.id || t.cve.label || "CVE") + '</a>');
    else if (t.cve && t.cve.id) links.push('<span class="adv2-chip cve">' + SHIELD + esc(t.cve.id) + '</span>');
    if (links.length) h += '<div class="adv2-links">' + links.join("") + '</div>';
    // short description
    if (t.desc) h += '<p class="adv2-desc">' + esc(t.desc) + '</p>';
    // commands
    if (t.cmds && t.cmds.length) {
      h += '<div class="adv2-cmds">';
      h += t.cmds.map(cmdBlock).join("");
      h += '</div>';
    }
    // move-to links (cross-section pivots)
    if (t.moveTo && t.moveTo.length) {
      h += '<div class="adv2-moves"><p class="adv2-moves-l">Move to</p>';
      h += t.moveTo.map(function (m) {
        var target = byId[m.section];
        if (!target) return "";
        var col = target.color || "var(--accent)";
        var chip = '<button class="adv2-move" data-goto="' + attr(m.section) + '" style="--mc:' + attr(col) + '">' +
          '<span class="adv2-move-dot"></span><span class="adv2-move-to">' + esc(target.title) + '</span>' + ARROW + '</button>';
        return '<div class="adv2-move-row">' + chip + (m.note ? '<span class="adv2-move-note">' + esc(m.note) + '</span>' : "") + '</div>';
      }).join("");
      h += '</div>';
    }
    h += '</div></div>';
    return h;
  }

  function sectionHTML(s) {
    var col = s.color || "var(--accent)";
    var h = '<section class="adv2-section" id="sec-' + attr(s.id) + '" style="--sc:' + attr(col) + '">';
    h += '<button class="adv2-head" data-sec="' + attr(s.id) + '" aria-expanded="false">';
    h += '<span class="adv2-swatch"></span>';
    h += '<span class="adv2-head-main"><span class="adv2-title">' + esc(s.title) + (s.tag ? '<span class="adv2-tag">' + esc(s.tag) + '</span>' : "") + '</span>';
    if (s.desc) h += '<span class="adv2-sub">' + esc(s.desc) + '</span>';
    h += '</span>';
    h += '<span class="adv2-count">' + (s.techniques ? s.techniques.length : 0) + '</span>';
    h += '<span class="adv2-caret">' + ARROW + '</span>';
    h += '</button>';
    h += '<div class="adv2-body" hidden>';
    (s.techniques || []).forEach(function (t) { h += techniqueHTML(s, t); });
    h += '</div></section>';
    return h;
  }

  function render() {
    root.innerHTML = DATA.sections.map(sectionHTML).join("");
  }
  render();

  /* ---------- interaction ---------- */
  function openSection(id, scroll) {
    var sec = document.getElementById("sec-" + id);
    if (!sec) return;
    var head = sec.querySelector(".adv2-head"), body = sec.querySelector(".adv2-body");
    head.setAttribute("aria-expanded", "true");
    sec.classList.add("open");
    body.hidden = false;
    if (scroll) {
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
      sec.classList.add("flash");
      setTimeout(function () { sec.classList.remove("flash"); }, 1200);
    }
  }
  function toggleSection(id) {
    var sec = document.getElementById("sec-" + id);
    if (!sec) return;
    if (sec.classList.contains("open")) {
      var head = sec.querySelector(".adv2-head"), body = sec.querySelector(".adv2-body");
      head.setAttribute("aria-expanded", "false");
      sec.classList.remove("open");
      body.hidden = true;
    } else {
      openSection(id, false);
    }
  }
  function toggleTech(id) {
    var el = document.getElementById("tech-" + id);
    if (!el) return;
    var body = el.querySelector(".adv2-tech-body");
    var open = el.classList.toggle("open");
    body.hidden = !open;
  }

  root.addEventListener("click", function (e) {
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
    if (move) { openSection(move.getAttribute("data-goto"), true); return; }
    var techBtn = e.target.closest(".adv2-tech-btn");
    if (techBtn) { toggleTech(techBtn.getAttribute("data-tech")); return; }
    var head = e.target.closest(".adv2-head");
    if (head) { toggleSection(head.getAttribute("data-sec")); return; }
  });

  /* expand-all / collapse-all controls */
  var exp = document.getElementById("adv2-expand"), col = document.getElementById("adv2-collapse");
  if (exp) exp.addEventListener("click", function () { DATA.sections.forEach(function (s) { openSection(s.id, false); }); });
  if (col) col.addEventListener("click", function () {
    DATA.sections.forEach(function (s) {
      var sec = document.getElementById("sec-" + s.id);
      sec.classList.remove("open"); sec.querySelector(".adv2-head").setAttribute("aria-expanded", "false"); sec.querySelector(".adv2-body").hidden = true;
    });
  });

  /* deep-link: #<section-id> opens (and optionally a technique) */
  function openFromHash() {
    var m = (location.hash || "").replace(/^#/, "");
    if (!m) return;
    var parts = m.split("/");
    if (byId[parts[0]]) {
      openSection(parts[0], true);
      if (parts[1]) setTimeout(function () { var tb = document.querySelector('[data-tech="' + parts[1] + '"]'); if (tb && !tb.parentNode.classList.contains("open")) toggleTech(parts[1]); }, 300);
    }
  }
  window.addEventListener("hashchange", openFromHash);
  // open the first section by default so the page isn't a wall of closed cards
  if (location.hash) openFromHash();
  else if (DATA.sections[0]) openSection(DATA.sections[0].id, false);
})();
