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
    title: "Command & Control (C2) Frameworks",
    url: "theory/2026-09-23-command-and-control.html",
    date: "2026-09-23",
    tag: "Red Team",
    description: "How C2 frameworks work — implants, listeners, beacons versus interactive sessions, staging, egress channels, redirectors, and the OPSEC that shapes every operation.",
    readTime: "10 min read"
  },
  {
    title: "Sliver C2 — Architecture & Concepts",
    url: "theory/2026-09-23-sliver-c2.html",
    date: "2026-09-23",
    tag: "Red Team",
    description: "How Sliver is put together — server and client, sessions vs beacons, listeners, implant generation and profiles, the armory and extensions, and pivots — the mechanism behind the commands.",
    readTime: "11 min read"
  },
  {
    title: "Windows Telemetry & PowerShell Logging",
    url: "theory/2026-09-23-windows-telemetry-logging.html",
    date: "2026-09-23",
    tag: "Evasion",
    description: "What Windows records when code runs — PSReadline history, Script Block (4104) and Module (4103) logging, transcription, AMSI and ETW — how each works and why in-memory tradecraft defeats them.",
    readTime: "10 min read"
  },
  {
    title: "In-Memory Post-Exploitation Tradecraft",
    url: "theory/2026-09-23-in-memory-tradecraft.html",
    date: "2026-09-23",
    tag: "Red Team",
    description: "How offensive tools run without touching disk — process injection, fork-and-run vs inline, execute-assembly and BOFs, PPID spoofing and migration, packers and unhooking.",
    readTime: "11 min read"
  },
  {
    title: "Windows Defense Evasion — AV, EDR & ASR",
    url: "theory/2026-09-23-defense-evasion.html",
    date: "2026-09-23",
    tag: "Evasion",
    description: "Why offensive tradecraft evades endpoint defences — the static and runtime detection surfaces, userland API hooking and unhooking, in-memory execution, packing, AMSI/ETW as in-process instrumentation, and ASR rules. Mechanisms, not payloads.",
    readTime: "14 min read"
  },
  {
    title: "Windows Access Tokens & UAC",
    url: "theory/2026-08-18-windows-tokens-uac.html",
    date: "2026-09-22",
    tag: "AD",
    description: "How Windows decides what a process may do \u2014 access tokens, integrity levels, privileges, and why UAC is a convenience boundary, not a security boundary.",
    readTime: "9 min read"
  },
  {
    title: "Windows Credential Storage",
    url: "theory/2026-08-18-windows-credential-storage.html",
    date: "2026-09-22",
    tag: "AD",
    description: "Where Windows keeps secrets and how it protects them \u2014 SAM, LSASS, LSA secrets, NTDS.dit, DPAPI, Kerberos keys \u2014 the mechanism behind every credential-access technique.",
    readTime: "10 min read"
  },
  {
    title: "Active Directory Fundamentals",
    url: "theory/2026-08-18-ad-fundamentals.html",
    date: "2026-08-18",
    tag: "AD",
    description: "The building blocks of Active Directory \u2014 domains, forests, objects, SIDs, and why the whole structure is a single trust boundary.",
    readTime: "11 min read"
  },
  {
    title: "Kerberos Authentication",
    url: "theory/2026-08-18-kerberos.html",
    date: "2026-08-18",
    tag: "AD",
    description: "The AS, TGS, and service-ticket exchanges, the KDC and PAC, and where each step of the Kerberos flow becomes an attack surface.",
    readTime: "12 min read"
  },
  {
    title: "NTLM Authentication",
    url: "theory/2026-08-18-ntlm.html",
    date: "2026-08-18",
    tag: "AD",
    description: "NTLM challenge-response, the NT hash vs NetNTLM, pass-the-hash, and why relay and cracking stay central to AD attacks.",
    readTime: "9 min read"
  },
  {
    title: "LDAP and the AD Database",
    url: "theory/2026-08-18-ldap.html",
    date: "2026-08-18",
    tag: "AD",
    description: "How AD stores everything as LDAP objects and attributes \u2014 the schema, distinguished names, filters, and the attributes attackers target.",
    readTime: "9 min read"
  },
  {
    title: "Kerberoasting",
    url: "theory/2026-08-18-kerberoasting.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Requesting service tickets for SPN accounts and cracking them offline to recover service-account passwords.",
    readTime: "9 min read"
  },
  {
    title: "AS-REP Roasting",
    url: "theory/2026-08-18-asrep-roasting.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Abusing disabled Kerberos pre-authentication to obtain crackable AS-REP material \u2014 sometimes with no credentials at all.",
    readTime: "7 min read"
  },
  {
    title: "Kerberos Delegation",
    url: "theory/2026-08-18-delegation.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Unconstrained, constrained, and resource-based constrained delegation, and how each variant is abused for privilege escalation.",
    readTime: "11 min read"
  },
  {
    title: "Active Directory Certificate Services",
    url: "theory/2026-08-18-adcs.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Why AD CS is dangerous \u2014 templates, PKINIT, and the ESC1\u2013ESC8 misconfiguration classes that lead to domain compromise.",
    readTime: "11 min read"
  },
  {
    title: "ACLs and DACLs in Active Directory",
    url: "theory/2026-08-18-acls-dacls.html",
    date: "2026-08-18",
    tag: "AD",
    description: "How object permissions work, and how GenericAll, WriteDACL, and GenericWrite chain into paths to Domain Admin.",
    readTime: "10 min read"
  },
  {
    title: "Group Policy (GPO)",
    url: "theory/2026-08-18-group-policy.html",
    date: "2026-08-18",
    tag: "AD",
    description: "How GPOs apply across the domain, and how write access to one becomes mass code execution on every machine it targets.",
    readTime: "8 min read"
  },
  {
    title: "Domain and Forest Trusts",
    url: "theory/2026-08-18-trusts.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Trust direction and transitivity, SID history and SID filtering, and how trusts are abused to cross domain and forest boundaries.",
    readTime: "9 min read"
  },
  {
    title: "DCSync",
    url: "theory/2026-08-18-dcsync.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Abusing directory replication to extract any account's hashes \u2014 including krbtgt \u2014 from a domain controller.",
    readTime: "8 min read"
  },
  {
    title: "Kerberos Ticket Attacks",
    url: "theory/2026-08-18-ticket-attacks.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Golden, Silver, and Diamond tickets, pass-the-ticket, and overpass-the-hash \u2014 forging and reusing Kerberos tickets.",
    readTime: "10 min read"
  },
  {
    title: "Coercion and NTLM Relay",
    url: "theory/2026-08-18-coercion-ntlm-relay.html",
    date: "2026-08-18",
    tag: "AD",
    description: "Poisoning and coercion, then relaying that authentication to SMB, LDAP, or AD CS \u2014 including the ESC8 chain.",
    readTime: "11 min read"
  },
  {
    title: "OSINT Fundamentals",
    url: "theory/2026-08-18-osint-fundamentals.html",
    date: "2026-08-18",
    tag: "RECON",
    description: "What open source intelligence actually is \u2014 the intelligence cycle, the passive/active boundary, source reliability, and the legal limits that apply to it.",
    readTime: "8 min read"
  },
  {
    title: "AI, Machine Learning, and Deep Learning Basics",
    url: "theory/2026-07-05-ai-basics.html",
    date: "2026-07-05",
    tag: "AI",
    description: "The relationship between AI, Machine Learning, and Deep Learning, including learning types and modern neural networks.",
    readTime: "5 min read"
  },
  {
    title: "The CIA Triad",
    url: "theory/2026-07-04-cia-triad.html",
    date: "2026-07-04",
    tag: "FUNDAMENTALS",
    description: "Confidentiality, Integrity, and Availability — the three properties nearly every security control is ultimately protecting.",
    readTime: "4 min read"
  }
];
