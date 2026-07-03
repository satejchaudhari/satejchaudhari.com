/*
  POSTS — one entry per post, shared by the homepage previews,
  /writeups.html, and /blog.html.

  HOW TO ADD A NEW POST:
  1. Copy post-template.html, rename it, put it in /posts/, write your content.
  2. Add one object to this array (put newest posts at the TOP — order here
     controls list order, it is NOT auto-sorted).
  3. Save. Refresh. Done — no build step.

  Fields:
    title       - shown as the entry heading
    url         - path to the post's html file, relative to the page linking to it
    date        - "YYYY-MM-DD"
    type        - "writeup" or "blog" — controls which page (writeups.html /
                  blog.html) the post shows up on, and which homepage preview
                  it appears in
    tag         - short category label, e.g. RECON / WEB / AD / TOOLING —
                  free text, drives the filter buttons on writeups.html /
                  blog.html automatically
    description - one-line summary shown under the title
    readTime    - optional, e.g. "6 min read" (leave "" to hide it)
*/

const POSTS = [
  {
    title: "Welcome to the Log",
    url: "posts/2026-07-02-welcome-to-the-log.html",
    date: "2026-07-02",
    type: "blog",
    tag: "NOTES",
    description: "How this site works and how to add new writeups and posts.",
    readTime: "2 min read"
  }
];
