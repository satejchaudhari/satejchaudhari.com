/*
  Renders AD_MAP_V2 (assets/js/admap-v2.js) into ad-map.html as a set of
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
  // Outcome badges that name another part of the map become clickable and jump
  // to that section (optionally a specific technique via "section/technique").
  // Labels not listed here are terminal states / actions and stay plain — that
  // set is the "buttons with no link" list.
  var OUTCOME_LINKS = {
    // access levels -> their sections
    "Admin": "admin-access", "Admin MSSQL": "admin-access", "Admin on site system": "admin-access",
    "Authority/System": "admin-access",
    "Low access": "low-access", "Low Access": "low-access", "Low access (without AppLocker)": "low-access",
    "Domain admin": "domain-admin", "Domain Admin": "domain-admin",
    // usable credentials -> Valid Credentials ("Username" alone -> Valid user)
    "User + Pass": "valid-creds", "User Account": "valid-creds", "Username": "valid-user",
    "Clear text Credentials": "valid-creds", "Clear text password": "valid-creds",
    "Clear text password / NT hash": "valid-creds", "User with clear text pass": "valid-creds",
    "Account password": "valid-creds", "Service account password": "valid-creds",
    "Machine account password": "valid-creds", "Deployment credentials": "valid-creds",
    "Credentials": "valid-creds", "Credentials (NAA account)": "valid-creds",
    "Credentials (ldap/http)": "valid-creds", "NAA credentials": "valid-creds",
    "Site DB credentials": "valid-creds",
    // hashes -> Crack hash
    "Crack hash": "crack-hash", "NTLM": "crack-hash", "Hash NTLMv1 or NTLMv2": "crack-hash",
    "Hash TGS": "crack-hash", "Hash found (TGS)": "crack-hash", "Hash found TGS": "crack-hash",
    "Hash found ASREP": "crack-hash", "Hash found ASREQ": "crack-hash",
    "MSCache 2": "crack-hash", "PXE Hash": "crack-hash", "timeroast hash": "crack-hash",
    "DPAPImk": "crack-hash",
    // lateral movement
    "Lateral move": "lateral-move", "Lateral move (creds/pth)": "lateral-move", "Clear text move": "lateral-move",
    "PassTheHash": "lateral-move/lm-nthash",
    "PassTheTicket": "lateral-move/lm-kerberos", "Pass the ticket": "lateral-move/lm-kerberos",
    "PTT": "lateral-move/lm-kerberos", "Lat move PTT": "lateral-move/lm-kerberos",
    "Kerberos TGS": "lateral-move/lm-kerberos", "Kerberos TGT": "lateral-move/lm-kerberos",
    "PassTheCertificate": "lateral-move/lm-certificate", "Pass the certificate": "lateral-move/lm-certificate",
    "Pass the certificate (PKINIT)": "lateral-move/lm-certificate", "Pass the hash / ticket / certificate": "lateral-move",
    "MSSQL": "lateral-move/lm-mssql", "MSSQL Socks": "lateral-move/lm-socks", "SMB Socks": "lateral-move/lm-socks",
    // relay / coercion -> MITM
    "SMB NTLM Coerce": "mitm", "SMB Kerberos Coerce": "mitm", "Coerce SMB": "mitm", "COERCE SMB": "mitm",
    "HTTP Coerce": "mitm", "Relay NTLM": "mitm", "poisoning SMB": "mitm", "poisoning LDAP": "mitm",
    "poisoning HTTP": "mitm", "see LDAP(S)": "mitm",
    // ACLs, DCSync, delegation
    "ACL": "acls-aces", "DCSYNC": "acls-aces/acl-dcsync",
    "Shadow credentials": "acls-aces/acl-shadow-creds", "Shadow Credentials": "acls-aces/acl-shadow-creds",
    "Delegation": "kerberos-delegation", "Unconstrained delegation": "kerberos-delegation/kd-unconstrained",
    "RBCD": "kerberos-delegation/kd-rbcd",
    // AD CS
    "AD CS": "adcs", "ADCS Exploitation": "adcs", "Web enrollment": "adcs/adcs-esc8", "ESC8": "adcs/adcs-esc8",
    "Vulnerable template": "adcs/adcs-templates", "see ESC1": "adcs/adcs-templates", "see ESC3": "adcs/adcs-templates",
    "Misconfigured ACL": "adcs/adcs-acl", "Vulnerable CA": "adcs/adcs-ca", "Vulnerable PKI Object AC": "adcs/adcs-pki-object",
    // SCCM, trusts, quick wins
    "SCCM Exploitation": "sccm", "SCCM ADMIN": "sccm", "Trust": "trusts", "Vulnerable host": "quick-compromise"
  };
  // one-line "when to click this" note per destination (keyed by the same
  // target string used above; a "section/technique" key falls back to "section")
  var OUTCOME_NOTES = {
    "admin-access": "you're privileged here — harvest credentials from the host",
    "low-access": "escalate this foothold to local admin / SYSTEM",
    "domain-admin": "you own the domain — dump it and set up persistence",
    "valid-creds": "use the credentials to enumerate and move",
    "valid-user": "feed the account into spraying / roasting",
    "crack-hash": "crack the hash offline to recover the secret",
    "lateral-move": "reuse this access to execute on other hosts",
    "lateral-move/lm-nthash": "authenticate by passing the NT hash",
    "lateral-move/lm-kerberos": "reuse the Kerberos ticket or key",
    "lateral-move/lm-certificate": "authenticate with the certificate",
    "lateral-move/lm-mssql": "pivot through the SQL server",
    "lateral-move/lm-socks": "run tools through the SOCKS relay",
    "mitm": "relay or capture the authentication",
    "acls-aces": "abuse the discovered ACL / ACE rights",
    "acls-aces/acl-dcsync": "replicate the directory secrets (DCSync)",
    "acls-aces/acl-shadow-creds": "add shadow credentials to take over the object",
    "kerberos-delegation": "abuse the delegation to impersonate a user",
    "kerberos-delegation/kd-unconstrained": "dump the cached ticket from the delegation host",
    "kerberos-delegation/kd-rbcd": "configure RBCD to impersonate a user",
    "adcs": "exploit the AD CS misconfiguration",
    "adcs/adcs-esc8": "relay to web enrolment for a privileged certificate (ESC8)",
    "adcs/adcs-templates": "enrol a certificate from the vulnerable template",
    "adcs/adcs-acl": "abuse write access over the template / CA",
    "adcs/adcs-ca": "abuse the CA misconfiguration",
    "adcs/adcs-pki-object": "abuse the PKI object access control",
    "sccm": "abuse the SCCM / MECM hierarchy",
    "trusts": "pivot across the domain / forest trust",
    "quick-compromise": "try an unauthenticated quick-compromise exploit"
  };
  function noteFor(target) { return OUTCOME_NOTES[target] || OUTCOME_NOTES[target.split("/")[0]] || ""; }
  function outcomesHTML(list) {
    if (!list || !list.length) return "";
    return '<div class="adv2-outcomes">' + list.map(function (o) {
      var target = OUTCOME_LINKS[o.label];
      if (target) {
        var parts = target.split("/");
        var sec = byId[parts[0]];
        // colour the badge with its DESTINATION section's colour, so the badge
        // visibly belongs to the section it jumps to
        var col = (sec && sec.color) || o.color || "#94a3b8";
        return '<button class="adv2-outcome linked" data-goto="' + attr(parts[0]) + '"' +
          (parts[1] ? ' data-tech="' + attr(parts[1]) + '"' : '') +
          ' style="--oc:' + attr(col) + '" title="Go to ' + (sec ? attr(sec.title) : "section") + '">' + esc(o.label) + '</button>';
      }
      // no section to open -> a plain status tag, not a (dead) button
      return '<span class="adv2-outcome terminal">' + esc(o.label) + '</span>';
    }).join("") + '</div>';
  }
  // one "Move to" row: coloured button (to its section) + a one-line note
  function moveRowHTML(section, tech, label, note) {
    var sec = byId[section]; if (!sec) return "";
    var col = sec.color || "var(--accent)";
    var chip = '<button class="adv2-move" data-goto="' + attr(section) + '"' + (tech ? ' data-tech="' + attr(tech) + '"' : '') +
      ' style="--mc:' + attr(col) + '" title="Go to ' + attr(sec.title) + '">' +
      '<span class="adv2-move-dot"></span><span class="adv2-move-to">' + esc(label || sec.title) + '</span>' + ARROW + '</button>';
    return '<div class="adv2-move-row">' + chip + (note ? '<span class="adv2-move-note">' + esc(note) + '</span>' : "") + '</div>';
  }
  // technique-level navigation: explicit moveTo entries + linked outcomes,
  // all rendered as uniform "Move to" rows (deduped by destination section)
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
      if (seen[parts[0]]) return;           // already covered by an explicit moveTo
      rows.push(moveRowHTML(parts[0], parts[1] || null, o.label, noteFor(target)));
    });
    rows = rows.filter(Boolean);
    if (!rows.length) return "";
    return '<div class="adv2-moves"><p class="adv2-moves-l">Move to</p>' + rows.join("") + '</div>';
  }
  // terminal (non-navigating) outcomes -> small ghost tags
  function terminalTagsHTML(list) {
    var terms = (list || []).filter(function (o) { return !OUTCOME_LINKS[o.label]; });
    if (!terms.length) return "";
    return '<div class="adv2-outcomes">' + terms.map(function (o) {
      return '<span class="adv2-outcome terminal">' + esc(o.label) + '</span>';
    }).join("") + '</div>';
  }
  // linked outcomes (no explicit moveTo) rendered as uniform "Move to" rows —
  // used at branch level so branch buttons match the technique-level ones
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
    // CVE banner (when the technique is anchored to a CVE)
    if (t.cve && (t.cve.id || t.cve.label)) {
      var cveText = (t.cve.label ? esc(t.cve.label) + ' ' : '') + (t.cve.id ? '(' + esc(t.cve.id) + ')' : '');
      h += '<div class="adv2-cvebar">' + SHIELD + '<span>' + cveText + '</span>' +
        (t.cve.url ? '<a class="adv2-cvebar-link" href="' + attr(t.cve.url) + '" target="_blank" rel="noopener">advisory &#8599;</a>'
                   : '<span class="adv2-cvebar-link disabled" title="Not documented yet">details soon</span>') + '</div>';
    }
    // links row (theory + vuln). A link with no url renders as a disabled
    // placeholder button — the page it points to isn't published yet.
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
    // short description
    if (t.desc) h += '<p class="adv2-desc">' + esc(t.desc) + '</p>';
    // commands (flat)
    if (t.cmds && t.cmds.length) {
      h += '<div class="adv2-cmds">' + t.cmds.map(cmdBlock).join("") + '</div>';
    }
    // nested branches
    h += branchesHTML(t.branches);
    // terminal (non-navigating) outcomes as small ghost tags
    h += terminalTagsHTML(t.outcomes);
    // unified "Move to" block: linked outcomes + explicit pivots, each with a note
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
  // collapse every technique inside a section, so reopening it starts clean
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
  // force a technique open (used when arriving via an outcome / move-to link)
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
  var exp = document.getElementById("adv2-expand"), col = document.getElementById("adv2-collapse");
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
  // open the first section by default so the page isn't a wall of closed cards
  if (location.hash) openFromHash();
  else if (DATA.sections[0]) openSection(DATA.sections[0].id, false);
})();
