/*
  THEORY — reference topics shown on theory.html.

  HOW TO ADD A NEW TOPIC:
  1. Copy theory/theory-template.html, rename it, write your content.
  2. Add one object to this array (order controls list order, not auto-sorted).
  3. Save and refresh theory.html — it appears automatically, and if the tag
     is new, a filter chip for it appears automatically too.

  Fields:
    title       - shown as the entry heading
    url         - path to the topic's html file, relative to theory.html
    date        - "YYYY-MM-DD" (last-updated date — theory content isn't
                  really "dated," but this keeps entries sortable/consistent)
    tag         - short category label, e.g. FUNDAMENTALS / CRYPTO / NETWORKING /
                  AD / WEB / CLOUD — free text, drives the filter chips
    description - one-line summary shown under the title
    readTime    - optional, e.g. "6 min read" (leave "" to hide it)
*/

var THEORY = [
  {
    title: "The CIA Triad",
    url: "theory/2026-07-04-cia-triad.html",
    date: "2026-07-04",
    tag: "FUNDAMENTALS",
    description: "Confidentiality, Integrity, and Availability — the three properties nearly every security control is ultimately protecting.",
    readTime: "4 min read"
  }
];
