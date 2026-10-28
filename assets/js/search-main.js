/*
  Site-wide search for search.html. Builds a flat index from the data files that
  are loaded before it (THEORY, VULNS, TOOLKIT, POSTS) plus the static
  interactive pages, then filters live as you type. Read-only; edit the data
  files, not this one.
*/
(function () {
  var root = document.getElementById("search-results");
  var input = document.getElementById("search-input");
  var countEl = document.getElementById("search-count");
  if (!root || !input) return;

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }

  var index = [];
  function add(type, title, sub, tag, url) {
    index.push({ type: type, title: title || "", sub: sub || "", tag: tag || "", url: url,
      hay: ((title || "") + " " + (sub || "") + " " + (tag || "") + " " + type).toLowerCase() });
  }

  // Theory
  if (typeof THEORY !== "undefined") THEORY.forEach(function (t) { add("Theory", t.title, t.description, t.tag, t.url); });
  // Vulns
  if (typeof VULNS !== "undefined") VULNS.forEach(function (c) {
    (c.vulns || []).forEach(function (v) { add("Vuln", v.name, v.description, c.category + (v.severity ? " · " + v.severity : ""), "vuln-detail.html?vuln=" + v.id); });
  });
  // Toolkit
  if (typeof TOOLKIT !== "undefined") TOOLKIT.forEach(function (c) {
    (c.tools || []).forEach(function (t) { add("Tool", t.name, t.description, c.category, "tool-detail.html?tool=" + t.id); });
  });
  // Posts / writeups
  if (typeof POSTS !== "undefined") POSTS.forEach(function (p) { add(p.type === "writeup" ? "Writeup" : "Post", p.title, p.description, p.tag, p.url); });
  // Static interactive / reference pages
  [
    ["Map", "AD Attack Path Explorer", "Guided Active Directory attack playbook", "Interactive", "ad-map.html"],
    ["Map", "Cloud Attack Path Explorer", "Entra/Azure, AWS & Kubernetes attack paths", "Interactive", "cloud-map.html"],
    ["Map", "Linux Privesc Explorer", "Guided Linux privilege-escalation playbook", "Interactive", "linux-privesc-map.html"],
    ["Map", "Windows Privesc Explorer", "Guided Windows privilege-escalation playbook", "Interactive", "windows-privesc-map.html"],
    ["Map", "Web Pentest Checklist", "WSTG-based web testing checklist", "Interactive", "web-map.html"],
    ["Map", "External Red Team Workflow", "Outside-in recon + initial-access playbook", "Interactive", "external-red-team-workflow.html"],
    ["Reference", "Operator Cheatsheet", "Reverse shells, transfer, pivoting, enumeration one-liners", "Reference", "cheatsheet.html"],
    ["Reference", "Living Off the Land — LOLBAS & GTFOBins", "Trusted binaries abused for download/exec/bypass", "Reference", "lolbas.html"]
  ].forEach(function (e) { add(e[0], e[1], e[2], e[3], e[4]); });

  var TYPE_ORDER = ["Theory", "Vuln", "Tool", "Technique", "Map", "Reference", "Writeup", "Post"];

  function render(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) {
      root.innerHTML = '<p class="search-empty">Type to search ' + index.length + ' items across theory, vulns, tools, maps and writeups.</p>';
      if (countEl) countEl.textContent = index.length + " indexed";
      return;
    }
    var terms = q.split(/\s+/);
    var hits = index.filter(function (e) { return terms.every(function (t) { return e.hay.indexOf(t) !== -1; }); });
    if (countEl) countEl.textContent = hits.length + " / " + index.length;
    if (!hits.length) { root.innerHTML = '<p class="search-empty">No matches for “' + esc(q) + '”.</p>'; return; }
    hits.sort(function (a, b) {
      var o = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
      return o !== 0 ? o : a.title.localeCompare(b.title);
    });
    root.innerHTML = hits.map(function (e) {
      return '<a class="search-hit" href="' + attr(e.url) + '">' +
        '<span class="search-type search-type-' + attr(e.type.toLowerCase()) + '">' + esc(e.type) + '</span>' +
        '<span class="search-main"><span class="search-title">' + esc(e.title) + '</span>' +
        (e.sub ? '<span class="search-sub">' + esc(e.sub) + '</span>' : '') + '</span>' +
        (e.tag ? '<span class="search-tag">' + esc(e.tag) + '</span>' : '') +
        '</a>';
    }).join("");
  }

  input.addEventListener("input", function () { render(input.value); });
  // support ?q= deep link
  var m = /[?&]q=([^&]+)/.exec(location.search);
  if (m) { input.value = decodeURIComponent(m[1].replace(/\+/g, " ")); }
  render(input.value);
  input.focus();
})();
