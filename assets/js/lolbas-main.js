/*
  Renders LOLBAS (assets/js/lolbas.js) into lolbas.html: an OS toggle, a set of
  function filter-chips derived from the data, a free-text search, and a card
  per binary with its functions, description, example (copyable) and reference
  link. Edit assets/js/lolbas.js, never this file.
*/
(function () {
  var root = document.getElementById("lol-root");
  if (!root || typeof LOLBAS === "undefined") return;
  var DATA = LOLBAS.entries.slice();

  var state = { os: "All", fn: "All", q: "" };

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }

  // collect functions for the chip bar
  var fns = {};
  DATA.forEach(function (e) { (e.functions || []).forEach(function (f) { fns[f] = (fns[f] || 0) + 1; }); });
  var fnList = ["All"].concat(Object.keys(fns).sort());

  var osBar = document.getElementById("lol-os");
  var fnBar = document.getElementById("lol-fn");
  var searchEl = document.getElementById("lol-search");
  var countEl = document.getElementById("lol-count");

  function chip(label, active, kind) {
    return '<button class="lol-chip' + (active ? " active" : "") + '" data-kind="' + kind + '" data-val="' + attr(label) + '">' + esc(label) + '</button>';
  }
  if (osBar) osBar.innerHTML = ["All", "Windows", "Linux"].map(function (o) { return chip(o, state.os === o, "os"); }).join("");
  if (fnBar) fnBar.innerHTML = fnList.map(function (f) { return chip(f, state.fn === f, "fn"); }).join("");

  var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  function matches(e) {
    if (state.os !== "All" && e.os !== state.os) return false;
    if (state.fn !== "All" && (e.functions || []).indexOf(state.fn) === -1) return false;
    if (state.q) {
      var hay = (e.bin + " " + e.desc + " " + e.example + " " + (e.functions || []).join(" ")).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function card(e) {
    var fns = (e.functions || []).map(function (f) { return '<span class="lol-fnchip">' + esc(f) + '</span>'; }).join("");
    return '<div class="lol-card lol-' + esc(e.os.toLowerCase()) + '">' +
      '<div class="lol-head"><span class="lol-os-badge">' + esc(e.os) + '</span>' +
      '<span class="lol-bin">' + esc(e.bin) + '</span>' +
      '<a class="lol-link" href="' + attr(e.url) + '" target="_blank" rel="noopener">ref &#8599;</a></div>' +
      '<div class="lol-fns">' + fns + '</div>' +
      '<p class="lol-desc">' + esc(e.desc) + '</p>' +
      '<div class="lol-cmdwrap"><button class="lol-copy" title="Copy" aria-label="Copy">' + COPY + '</button>' +
      '<pre class="lol-cmd"><code>' + esc(e.example) + '</code></pre></div>' +
      '</div>';
  }

  function render() {
    var shown = DATA.filter(matches);
    root.innerHTML = shown.map(card).join("") || '<p class="lol-empty">No binaries match.</p>';
    if (countEl) countEl.textContent = shown.length + " / " + DATA.length;
  }
  render();

  function onChip(e) {
    var btn = e.target.closest(".lol-chip");
    if (!btn) return;
    var kind = btn.getAttribute("data-kind"), val = btn.getAttribute("data-val");
    state[kind] = val;
    (kind === "os" ? osBar : fnBar).querySelectorAll(".lol-chip").forEach(function (c) {
      c.classList.toggle("active", c.getAttribute("data-val") === val);
    });
    render();
  }
  if (osBar) osBar.addEventListener("click", onChip);
  if (fnBar) fnBar.addEventListener("click", onChip);
  if (searchEl) searchEl.addEventListener("input", function () { state.q = searchEl.value.trim().toLowerCase(); render(); });

  root.addEventListener("click", function (e) {
    var btn = e.target.closest(".lol-copy");
    if (!btn) return;
    var code = btn.parentNode.querySelector("code"); if (!code) return;
    var text = code.innerText;
    function done() { btn.classList.add("copied"); setTimeout(function () { btn.classList.remove("copied"); }, 1100); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { try { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); done(); } catch (x) {} }
  });
})();
