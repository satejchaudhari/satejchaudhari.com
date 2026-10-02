/*
  gen-seo.js — regenerates sitemap.xml, robots.txt, and feed.xml from the
  site's data files. No build step is required to view the site; run this
  only when you add/rename pages or posts:

      node scripts/gen-seo.js

  It reads assets/js/posts.js (POSTS) and assets/js/theory.js (THEORY) plus a
  fixed list of top-level pages, and writes the three files at the repo root.
*/
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE = "https://satejchaudhari.com";

function load(file, name) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  const sandbox = {};
  vm.runInNewContext(code + `\nthis.__out = typeof ${name} !== "undefined" ? ${name} : null;`, sandbox);
  return sandbox.__out || [];
}
const POSTS = load("assets/js/posts.js", "POSTS");
const THEORY = load("assets/js/theory.js", "THEORY");

// top-level pages (param-driven detail pages are intentionally excluded)
const STATIC = [
  { loc: "/",               pri: "1.0" },
  { loc: "/writeups.html",  pri: "0.9" },
  { loc: "/theory.html",    pri: "0.9" },
  { loc: "/toolkit.html",   pri: "0.8" },
  { loc: "/vulns.html",     pri: "0.8" },
  { loc: "/web-map.html",   pri: "0.7" },
  { loc: "/ad-map.html",    pri: "0.7" },
  { loc: "/disclaimer.html",pri: "0.3" },
];

const today = new Date().toISOString().slice(0, 10);
const xmlesc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ---------- sitemap.xml ---------- */
const urls = [];
for (const s of STATIC) urls.push({ loc: BASE + s.loc, lastmod: today, pri: s.pri });
for (const p of POSTS)  urls.push({ loc: BASE + "/" + p.url, lastmod: p.date || today, pri: "0.8" });
for (const t of THEORY) urls.push({ loc: BASE + "/" + t.url, lastmod: t.date || today, pri: "0.6" });

const sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${xmlesc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.pri}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

/* ---------- robots.txt ---------- */
fs.writeFileSync(path.join(ROOT, "robots.txt"),
`User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`);

/* ---------- feed.xml (RSS 2.0) — writeups, newest first ---------- */
function rfc822(d) {
  const dt = new Date((d || today) + "T00:00:00Z");
  return dt.toUTCString();
}
const feedItems = POSTS
  .filter(p => p.type === "writeup")
  .map(p => `    <item>
      <title>${xmlesc(p.title)}</title>
      <link>${BASE}/${xmlesc(p.url)}</link>
      <guid isPermaLink="true">${BASE}/${xmlesc(p.url)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      ${p.tag ? `<category>${xmlesc(p.tag)}</category>` : ""}
      <description>${xmlesc(p.description || "")}</description>
    </item>`).join("\n");

const feed =
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Satej Chaudhari — Writeups</title>
    <link>${BASE}/writeups.html</link>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Offensive-security writeups: HackTheBox, Vulnhub, and lab builds.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(today)}</lastBuildDate>
${feedItems}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(ROOT, "feed.xml"), feed);

console.log(`sitemap.xml: ${urls.length} urls | feed.xml: ${POSTS.filter(p=>p.type==="writeup").length} items | robots.txt written`);
