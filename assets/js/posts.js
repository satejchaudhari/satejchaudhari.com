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

var POSTS = [
  {
    title: "A Six-Segment IDS Lab with Linux Namespaces & Suricata",
    url: "posts/2026-10-02-linux-namespaces-suricata-ids.html",
    date: "2026-10-02",
    type: "writeup",
    tag: "Blue Team",
    description: "Building an isolated six-segment network from Linux namespaces, forcing every packet through an inline Suricata sensor, and writing per-subnet rules that detect and block SQL injection, anonymous FTP, SSH brute force, LDAP honeypot enumeration, and password spraying.",
    readTime: "18 min read"
  },
  {
    title: "Setting Up Active Directory Domain Services (AD DS)",
    url: "posts/2026-10-02-adds-setup.html",
    date: "2026-10-02",
    type: "writeup",
    tag: "Active Directory",
    description: "A step-by-step build of an AD lab: installing the AD DS role, promoting a domain controller for a new forest, creating users, joining a client, and importing and linking the Windows 11 security-baseline GPO.",
    readTime: "7 min read"
  },
  {
    title: "OSINT From a Single Domain: A Red Team Methodology",
    url: "posts/2026-08-18-osint-methodology.html",
    date: "2026-08-18",
    type: "writeup",
    tag: "RECON",
    description: "A phase-by-phase OSINT workflow for an authorised red team engagement that starts with nothing but a domain name.",
    readTime: "36 min read"
  },
  {
    title: "Vintage:  HackTheBox",
    url: "posts/2026-07-03-VintageHTB.html",
    date: "2026-07-03",
    type: "writeup",
    tag: "Active Directory",
    description: "Writeup for a Active Directory machine on HackTheBox.",
    readTime: "20 min read"
  },
  {
    title: "Vulnhub: Venom",
    url: "posts/2026-01-10-vulnhub-venom.html",
    date: "2026-01-10",
    type: "writeup",
    tag: "Vulnhub",
    description: "A hash hidden in page source, an FTP foothold, a chain of encoded clues to a Subrion CMS 4.2.1 login, a public CMS exploit for the shell, and a wide-open sudo rule for root.",
    readTime: "9 min read"
  },
  {
    title: "Vulnhub: Matrix 1",
    url: "posts/2026-01-10-vulnhub-matrix-1.html",
    date: "2026-01-10",
    type: "writeup",
    tag: "Vulnhub",
    description: "A base64-then-Brainfuck clue chain leaks a partial SSH password, crunch and hydra finish it, a vi restricted-shell escape gives a real shell, and a passwordless sudo rule gives root.",
    readTime: "8 min read"
  },
  {
    title: "Vulnhub: Matrix 2",
    url: "posts/2026-01-10-vulnhub-matrix-2.html",
    date: "2026-01-10",
    type: "writeup",
    tag: "Vulnhub",
    description: "A robots.txt hint and an unauthenticated POST leak usernames, a cracked .htpasswd hash and a steghide-hidden password lead in, and a sudo-runnable gawk binary gives root.",
    readTime: "7 min read"
  },
  {
    title: "Vulnhub: Matrix 3",
    url: "posts/2026-01-10-vulnhub-matrix-3.html",
    date: "2026-01-10",
    type: "writeup",
    tag: "Vulnhub",
    description: "A white-rabbit directory maze hides a crackable hash, a Windows binary reversed in Ghidra leaks SSH credentials, and two chained sudo rules walk the way to root.",
    readTime: "8 min read"
  },
  {
    title: "Vulnhub: Aragog (HackingHP)",
    url: "posts/2026-01-10-vulnhub-aragog.html",
    date: "2026-01-10",
    type: "writeup",
    tag: "Vulnhub",
    description: "A vulnerable WordPress File Manager plugin for the foothold, database credentials that crack a user's WordPress hash, and a writable root-run backup script for the root shell.",
    readTime: "9 min read"
  },
  {
    title: "Vulnhub: Grotesque 1",
    url: "posts/2026-01-10-vulnhub-grotesque-1.html",
    date: "2026-01-10",
    type: "writeup",
    tag: "Vulnhub",
    description: "To the user flag — a WordPress password that is the MD5 of a song lyric, a reverse shell planted in the theme's 404.php, and credential reuse from wp-config.php to reach user.txt.",
    readTime: "8 min read"
  }
];
