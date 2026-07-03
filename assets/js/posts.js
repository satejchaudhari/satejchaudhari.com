/*
  POSTS — one entry per blog post.

  HOW TO ADD A NEW POST:
  1. Copy post-template.html, rename it, put it in /posts/, write your content.
  2. Add one object to this array (put newest posts at the TOP — order here
     controls list order, it is NOT auto-sorted).
  3. Save. Refresh index.html. Done — no build step.

  Fields:
    title       - shown as the entry heading
    url         - path to the post's html file, relative to index.html
    date        - "YYYY-MM-DD", shown on the card (for your own sorting only)
    tag         - short category label, e.g. WRITEUP / NOTES / TOOL / RESEARCH
                  (this also drives the filter buttons at the top of the log —
                  any new tag you use automatically gets its own filter button)
    description - one-line summary shown under the title on the homepage
    readTime    - optional, e.g. "6 min read" (leave "" to hide it)
*/

const POSTS = [
  {
    title: "Welcome to the Log",
    url: "posts/2026-07-02-welcome-to-the-log.html",
    date: "2026-07-02",
    tag: "NOTES",
    description: "How this blog works and how to add new writeups.",
    readTime: "2 min read"
  }
];
