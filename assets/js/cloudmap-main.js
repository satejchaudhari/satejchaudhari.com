/*
  Renders CLOUD_MAP (assets/js/cloudmap.js) into cloud-map.html as a set of
  colour-coded, expandable section cards. Section -> techniques -> detail
  (theory/CVE link, description, commands, and cross-section "move to" links).

  This is the AD-explorer renderer re-pointed at the cloud playbook: it reads
  CLOUD_MAP, mounts in #cloudmap-root, and uses a cloud-specific outcome map.
  You never edit this file — edit assets/js/cloudmap.js instead.
*/
(function () {
  var root = document.getElementById("cloudmap-root");
  if (!root || typeof CLOUD_MAP === "undefined") return;
  var DATA = CLOUD_MAP;

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
  // Outcome badges whose label names a stage of the map become clickable and
  // jump to that section (optionally a technique via "section/technique").
  // Anything not listed here is a terminal state and stays a plain tag. Most
  // navigation on the cloud map is driven by explicit `moveTo` rows instead.
  var OUTCOME_LINKS = {
    "Valid identity": "authenticated", "Valid cloud identity": "authenticated",
    "Valid credentials": "authenticated", "Session token": "authenticated",
    "Role credentials": "aws-privesc", "Managed identity token": "azure-resource",
    "Global Admin": "takeover", "Account admin": "takeover", "Tenant takeover": "takeover",
    "Privileged role": "entra-privesc", "Pivot on-prem": "lateral-hybrid",
    "Persistence": "persistence"
  };
  var OUTCOME_NOTES = {
    "recon": "turn the discovered surface into a first credential",
    "initial-access": "get a first foothold identity in the tenant / account",
    "authenticated": "enumerate what this identity can see and reach",
    "entra-privesc": "escalate within Entra ID directory roles",
    "azure-resource": "abuse the Azure resource / RBAC plane",
    "aws-access": "collect AWS credentials from the environment",
    "aws-privesc": "escalate IAM privileges toward account admin",
    "kubernetes": "move through the cluster and its cloud identity",
    "lateral-hybrid": "cross the cloud / on-prem boundary",
    "takeover": "you own the tenant / account — consolidate control",
    "persistence": "plant durable, hard-to-revoke access"
  };
  function noteFor(target) { return OUTCOME_NOTES[target] || OUTCOME_NOTES[target.split("/")[0]] || ""; }
  function outcomesHTML(list) {
    if (!list || !list.length) return "";
    return '<div class="adv2-outcomes">' + list.map(function (o) {
      var target = OUTCOME_LINKS[o.label];
      if (target) {
        var parts = target.split("/");
        var sec = byId[parts[0]];
        var col = (sec && sec.color) || o.color || "#94a3b8";
        return '<button class="adv2-outcome linked" data-goto="' + attr(parts[0]) + '"' +
          (parts[1] ? ' data-tech="' + attr(parts[1]) + '"' : '') +
          ' style="--oc:' + attr(col) + '" title="Go to ' + (sec ? attr(sec.title) : "section") + '">' + esc(o.label) + '</button>';
      }
      return '<span class="adv2-outcome terminal">' + esc(o.label) + '</span>';
    }).join("") + '</div>';
  }
  function moveRowHTML(section, tech, label, note) {
    var sec = byId[section]; if (!sec) return "";
    var col = sec.color || "var(--accent)";
    var chip = '<button class="adv2-move" data-goto="' + attr(section) + '"' + (tech ? ' data-tech="' + attr(tech) + '"' : '') +
      ' style="--mc:' + attr(col) + '" title="Go to ' + attr(sec.title) + '">' +
      '<span class="adv2-move-dot"></span><span class="adv2-move-to">' + esc(label || sec.title) + '</span>' + ARROW + '</button>';
    return '<div class="adv2-move-row">' + chip + (note ? '<span class="adv2-move-note">' + esc(note) + '</span>' : "") + '</div>';
  }
  function techNavHTML(t) {
    var rows = [], seen = {};
    (t.moveTo || []).forEach(function (m) {
      if (!byId[m.section]) return;
      seen[m.section] = true;
      rows.push(moveRowHTML(m.section, m.tech || null, m.label, m.note || noteFor(m.section)));
    });
    (t.outcomes || []).forEach(function (o) {
      var target = OUTCOME_LINKS[o.label]; if (!target) return;
      var parts = target.split("/");
      if (seen[parts[0]]) return;
      rows.push(moveRowHTML(parts[0], parts[1] || null, o.label, noteFor(target)));
    });
    rows = rows.filter(Boolean);
    if (!rows.length) return "";
    return '<div class="adv2-moves"><p class="adv2-moves-l">Move to</p>' + rows.join("") + '</div>';
  }
  function terminalTagsHTML(list) {
    var terms = (list || []).filter(function (o) { return !OUTCOME_LINKS[o.label]; });
    if (!terms.length) return "";
    return '<div class="adv2-outcomes">' + terms.map(function (o) {
      return '<span class="adv2-outcome terminal">' + esc(o.label) + '</span>';
    }).join("") + '</div>';
  }
  function outcomeNavHTML(list) {
    var rows = (list || []).map(function (o) {
      var target = OUTCOME_LINKS[o.label]; if (!target) return "";
      var parts = target.split("/");
      return moveRowHTML(parts[0], parts[1] || null, o.label, noteFor(target));
    }).filter(Boolean);
    if (!rows.length) return "";
    return '<div class="adv2-moves"><p class="adv2-moves-l">Move to</p>' + rows.join("") + '</div>';
  }
  function branchesHTML(list) {
    if (!list || !list.length) return "";
    return '<div class="adv2-branches">' + list.map(function (b) {
      var h = '<div class="adv2-branch' + (b.warn ? ' warn' : '') + (b.cve ? ' cve' : '') + '">';
      h += '<p class="adv2-branch-l">' + (b.warn ? '<span class="adv2-warn">&#9888;</span>' : '') + esc(b.label) +
        (b.cve ? '<span class="adv2-branch-cve">' + esc(b.cve) + '</span>' : '') + '</p>';
      if (b.note) h += '<p class="adv2-branch-note">' + esc(b.note) + '</p>';
      (b.cmds || []).forEach(function (c) { h += cmdBlock(c); });
      h += terminalTagsHTML(b.outcomes);
      h += outcomeNavHTML(b.outcomes);
      return h + '</div>';
    }).join("") + '</div>';
  }
  function techniqueHTML(sec, t) {
    var h = '<div class="adv2-tech" id="tech-' + attr(t.id) + '">';
    h += '<button class="adv2-tech-btn" data-tech="' + attr(t.id) + '"><span class="adv2-tech-t">' + esc(t.title) + '</span><span class="adv2-tech-caret">' + ARROW + '</span></button>';
    h += '<div class="adv2-tech-body" hidden>';
    if (t.cve && (t.cve.id || t.cve.label)) {
      var cveText = (t.cve.label ? esc(t.cve.label) + ' ' : '') + (t.cve.id ? '(' + esc(t.cve.id) + ')' : '');
      h += '<div class="adv2-cvebar">' + SHIELD + '<span>' + cveText + '</span>' +
        (t.cve.url ? '<a class="adv2-cvebar-link" href="' + attr(t.cve.url) + '" target="_blank" rel="noopener">advisory &#8599;</a>'
                   : '<span class="adv2-cvebar-link disabled" title="Not documented yet">details soon</span>') + '</div>';
    }
    var links = [];
    if (t.theory) {
      if (t.theory.url) links.push('<a class="adv2-chip theory" href="' + attr(t.theory.url) + '">' + BOOK + esc(t.theory.label || "Theory") + '</a>');
      else links.push('<span class="adv2-chip theory disabled" title="Not documented yet">' + BOOK + esc(t.theory.label || "Theory") + '</span>');
    }
    if (t.vuln) {
      if (t.vuln.url) links.push('<a class="adv2-chip vuln" href="' + attr(t.vuln.url) + '">' + SHIELD + esc(t.vuln.label || "Details") + '</a>');
      else links.push('<span class="adv2-chip vuln disabled" title="Not documented yet">' + SHIELD + esc(t.vuln.label || "Details") + '</span>');
    }
    if (links.length) h += '<div class="adv2-links">' + links.join("") + '</div>';
    if (t.desc) h += '<p class="adv2-desc">' + esc(t.desc) + '</p>';
    if (t.cmds && t.cmds.length) {
      h += '<div class="adv2-cmds">' + t.cmds.map(cmdBlock).join("") + '</div>';
    }
    h += branchesHTML(t.branches);
    h += terminalTagsHTML(t.outcomes);
    h += techNavHTML(t);
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
  function collapseTechs(sec) {
    sec.querySelectorAll(".adv2-tech.open").forEach(function (el) {
      el.classList.remove("open");
      var b = el.querySelector(".adv2-tech-body");
      if (b) b.hidden = true;
    });
  }
  function closeSection(sec) {
    sec.querySelector(".adv2-head").setAttribute("aria-expanded", "false");
    sec.classList.remove("open");
    sec.querySelector(".adv2-body").hidden = true;
    collapseTechs(sec);
  }
  function toggleSection(id) {
    var sec = document.getElementById("sec-" + id);
    if (!sec) return;
    if (sec.classList.contains("open")) closeSection(sec);
    else openSection(id, false);
  }
  function toggleTech(id) {
    var el = document.getElementById("tech-" + id);
    if (!el) return;
    var body = el.querySelector(".adv2-tech-body");
    var open = el.classList.toggle("open");
    body.hidden = !open;
  }
  function openTech(id) {
    if (!id) return;
    setTimeout(function () {
      var el = document.getElementById("tech-" + id);
      if (!el || el.classList.contains("open")) return;
      el.classList.add("open");
      var body = el.querySelector(".adv2-tech-body");
      if (body) body.hidden = false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 380);
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
    var oc = e.target.closest(".adv2-outcome.linked");
    if (oc) { openSection(oc.getAttribute("data-goto"), true); openTech(oc.getAttribute("data-tech")); return; }
    var move = e.target.closest(".adv2-move");
    if (move) { openSection(move.getAttribute("data-goto"), true); openTech(move.getAttribute("data-tech")); return; }
    var techBtn = e.target.closest(".adv2-tech-btn");
    if (techBtn) { toggleTech(techBtn.getAttribute("data-tech")); return; }
    var head = e.target.closest(".adv2-head");
    if (head) { toggleSection(head.getAttribute("data-sec")); return; }
  });

  /* expand-all / collapse-all controls */
  var exp = document.getElementById("cloudmap-expand"), col = document.getElementById("cloudmap-collapse");
  if (exp) exp.addEventListener("click", function () { DATA.sections.forEach(function (s) { openSection(s.id, false); }); });
  if (col) col.addEventListener("click", function () {
    DATA.sections.forEach(function (s) {
      var sec = document.getElementById("sec-" + s.id);
      if (sec) closeSection(sec);
    });
  });

  /* deep-link: #<section-id> opens (and optionally a technique) */
  function openFromHash() {
    var m = (location.hash || "").replace(/^#/, "");
    if (!m) return;
    var parts = m.split("/");
    if (byId[parts[0]]) {
      openSection(parts[0], true);
      if (parts[1]) openTech(parts[1]);
    }
  }
  window.addEventListener("hashchange", openFromHash);
  if (location.hash) openFromHash();
  else if (DATA.sections[0]) openSection(DATA.sections[0].id, false);
})();
