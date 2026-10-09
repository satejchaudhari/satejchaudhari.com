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
    title: "Entra ID & Azure Attack Paths",
    url: "theory/2026-10-09-entra-azure-attack-paths.html",
    date: "2026-10-09",
    tag: "Cloud",
    description: "Attacking identity, not hosts — the Entra ID/Azure model (directory roles vs Azure RBAC, tokens and the PRT, service principals and managed identities), getting in, cloud escalation, the hybrid Entra Connect bridge in both directions, tooling (AzureHound/ROADtools/AADInternals), and detection.",
    readTime: "12 min read"
  },
  {
    title: "AWS Attack Paths",
    url: "theory/2026-10-09-aws-attack-paths.html",
    date: "2026-10-09",
    tag: "Cloud",
    description: "AWS attacks are IAM attacks — getting credentials (leaked keys, SSRF-to-IMDS, over-permissioned CI/Lambda), orienting, IAM privilege escalation patterns (PassRole, policy self-attach, AssumeRole), lateral movement and data (role chains, cross-account, SSM, snapshots), persistence, and detection.",
    readTime: "11 min read"
  },
  {
    title: "Kubernetes & Container Attacks",
    url: "theory/2026-10-09-kubernetes-container-attacks.html",
    date: "2026-10-09",
    tag: "Cloud",
    description: "Crossing the container/cluster/cloud boundaries — what a pod foothold gives you, container escape (privileged pods, host mounts, Docker socket, runtime CVEs), Kubernetes RBAC and service-account abuse, the cluster-to-cloud metadata pivot, and detection/hardening.",
    readTime: "11 min read"
  },
  {
    title: "Red Team Methodology & Threat Emulation",
    url: "theory/2026-10-09-red-team-methodology.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "What a red-team engagement actually is — red team vs pentest vs purple team, the lifecycle from scoping and ATT&CK-mapped emulation planning through recon, access, privesc, persistence, movement and actions-on-objective to reporting, and OPSEC/safety.",
    readTime: "10 min read"
  },
  {
    title: "C2 Infrastructure & OPSEC",
    url: "theory/2026-10-09-c2-infrastructure-opsec.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "Designing command-and-control infrastructure that survives — decoupling implants from the team server, redirectors (HTTP/DNS, staging/long-haul/short-haul), blending traffic (malleable profiles, domain categorisation, fronting, sleep/jitter), channel choice, OPSEC, and the defender's detection view.",
    readTime: "10 min read"
  },
  {
    title: "Data Collection & Exfiltration",
    url: "theory/2026-10-09-collection-and-exfiltration.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "Reaching and removing data, and testing whether anyone notices — collection (finding and staging crown jewels), exfiltration channels (C2, cloud HTTPS, DNS, email, physical), beating DLP and egress controls, and the detection/defence that are the real deliverable.",
    readTime: "9 min read"
  },
  {
    title: "Password Cracking",
    url: "theory/2026-10-09-password-cracking.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "Turning captured hashes into passwords with strategy — identifying the hash/mode, the wordlist -> rules -> targeted lists -> masks -> hybrid -> brute order, hashcat/John and *2john helpers, feeding cracked patterns back into spraying, and the defensive takeaways.",
    readTime: "9 min read"
  },
  {
    title: "BloodHound & AD Enumeration",
    url: "theory/2026-10-09-bloodhound-ad-enumeration.html",
    date: "2026-10-09",
    tag: "AD",
    description: "Thinking about Active Directory as a graph — SharpHound/AzureHound collection, nodes and edges (MemberOf, AdminTo, HasSession, GenericAll, delegation/cert edges), shortest-path to Domain Admin, custom Cypher, the enumerate-abuse-re-query loop, and OPSEC/detection.",
    readTime: "10 min read"
  },
  {
    title: "LSASS Dumping & Credential Extraction",
    url: "theory/2026-10-09-lsass-credential-extraction.html",
    date: "2026-10-09",
    tag: "AD",
    description: "Reading Windows' most valuable credential store — why LSASS holds hashes, Kerberos keys and sometimes plaintext, how it is dumped and parsed offline, the protections that stop it (LSA Protection/PPL, Credential Guard, ASR), where credentials live when LSASS is off the table, and detection.",
    readTime: "10 min read"
  },
  {
    title: "DPAPI Abuse",
    url: "theory/2026-10-09-dpapi-abuse.html",
    date: "2026-10-09",
    tag: "AD",
    description: "How Windows' Data Protection API is abused to recover saved secrets — browser passwords and cookies, Credential Vault, RDP/Wi-Fi — how master keys and the domain DPAPI backup key work, the paths from one user to domain-wide decryption, and detection.",
    readTime: "9 min read"
  },
  {
    title: "Active Directory Persistence",
    url: "theory/2026-10-09-active-directory-persistence.html",
    date: "2026-10-09",
    tag: "AD",
    description: "Domain persistence that survives reimaging and password resets — Golden/Silver/Diamond tickets and Skeleton Key, DCSync-rights and AdminSDHolder/ACL backdoors, certificate persistence (stolen CA key, Shadow Credentials), DSRM and DCShadow, plus detection and recovery.",
    readTime: "12 min read"
  },
  {
    title: "Windows Persistence",
    url: "theory/2026-10-09-windows-persistence.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "How access survives reboot and logout on Windows — Run keys, startup, Winlogon and logon scripts, scheduled tasks and services, fileless WMI event subscriptions, DLL/COM hijacking, and accessibility/account backdoors, by trigger, with detection.",
    readTime: "10 min read"
  },
  {
    title: "Linux Persistence",
    url: "theory/2026-10-09-linux-persistence.html",
    date: "2026-10-09",
    tag: "Linux",
    description: "How access survives on Linux — scheduled execution (cron, systemd timers), login and shell triggers (SSH keys, shell init), trusted-load hijacks (LD_PRELOAD, PAM, SUID, kernel modules), and service-level persistence, with detection and hardening.",
    readTime: "9 min read"
  },
  {
    title: "Linux Privilege Escalation",
    url: "theory/2026-10-09-linux-privilege-escalation.html",
    date: "2026-10-09",
    tag: "Linux",
    description: "The operator's map of Linux local privesc — enumeration, SUID/SGID and GTFOBins, sudo rules, cron and systemd timers, PATH and wildcard injection, capabilities, writable sensitive files, group/container escapes (docker/lxd/disk/NFS), kernel exploits, and hardening.",
    readTime: "12 min read"
  },
  {
    title: "Pivoting & Tunnelling",
    url: "theory/2026-10-09-pivoting-and-tunnelling.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "Using a foothold to reach networks you cannot touch directly — the local/remote/dynamic forwards and SOCKS, SSH tunnelling, chisel, ligolo-ng's routable interface, proxychains, Windows pivots, double pivots, and detection.",
    readTime: "10 min read"
  },
  {
    title: "Windows Token Abuse & Potato Attacks",
    url: "theory/2026-10-09-windows-token-potato.html",
    date: "2026-10-09",
    tag: "Red Team",
    description: "From a service-account foothold to SYSTEM — which token privileges are really admin (SeImpersonate, SeDebug, SeBackup/Restore, SeLoadDriver), the Potato pattern, PrintSpoofer/RoguePotato/JuicyPotato/GodPotato and when each applies, and detection.",
    readTime: "11 min read"
  },
  {
    title: "Logging & Telemetry — From Event to SIEM",
    url: "theory/2026-10-09-logging-and-telemetry.html",
    date: "2026-10-09",
    tag: "Blue Team",
    description: "An in-depth logging reference for defenders — what a log is, log sources and types, the formats (syslog, CEF, LEEF, JSON, EVTX, W3C) and normalisation schemas (ECS, OCSF, CIM), Windows Event Log with the key security Event IDs, Sysmon in depth with its full event catalogue, Linux auditd/journald, the collection-to-SIEM pipeline, and log integrity/retention.",
    readTime: "18 min read"
  },
  {
    title: "Modern AMSI & ETW Bypasses — Why They Still Work",
    url: "theory/2026-10-08-amsi-bypass-modern.html",
    date: "2026-10-08",
    tag: "Evasion",
    description: "A complete, concept-level picture of how AMSI and ETW are silenced on modern EDR-protected hosts — what each does, the shared in-process trust-boundary flaw, every bypass family up to the 2025 state of the art (state tampering, patching, patchless hardware-breakpoint/VEH, data-only context corruption, provider hijack, and footprint-hiding via unhooking/indirect syscalls), how the chain is assembled and operated, and why ETW-TI is the kernel-level ceiling that catches it. Concepts, not payloads.",
    readTime: "21 min read"
  },
  {
    title: "AppLocker & WDAC Bypass",
    url: "theory/2026-10-08-applocker-bypass.html",
    date: "2026-10-08",
    tag: "Evasion",
    description: "How Windows application whitelisting is enumerated and bypassed — AppLocker rule collections, writable allowed paths, trusted LOLBins (InstallUtil, Mshta, MSBuild, Regsvr32, Rundll32 and more), the unenforced Dll/Script collections, escaping Constrained Language Mode, and WDAC in depth: its kernel-enforced model, rule levels, signed policies, managed installer / ISG trust anchors, and how WDAC itself is bypassed.",
    readTime: "16 min read"
  },
  {
    title: "Web API Fuzzing",
    url: "theory/2026-10-07-web-api-fuzzing.html",
    date: "2026-10-07",
    tag: "WEB",
    description: "How to attack Web APIs with a fuzzer — the REST / SOAP / GraphQL models, why APIs are fuzzed differently from web servers, finding endpoints and parameters for each style, and the three kinds of API fuzzing (parameter, data-format, sequence).",
    readTime: "10 min read"
  },
  {
    title: "Active Directory Hardening & Tiering",
    url: "theory/2026-10-02-ad-hardening-tiering.html",
    date: "2026-10-02",
    tag: "AD",
    description: "The defensive mirror of the AD attack map — why AD is the crown jewel, tiering / the Enterprise Access Model, and a hardening playbook mapping each attack (credential theft, relay, roasting, delegation, ACL/GPO abuse, ticket forgery, fast-path CVEs) to the control that stops it.",
    readTime: "10 min read"
  },
  {
    title: "Privileged Access & the Enterprise Access Model",
    url: "theory/2026-10-02-privileged-access-eam.html",
    date: "2026-10-02",
    tag: "AD",
    description: "How privileged access is designed to survive credential theft — the problem of standing admin and reuse, the Enterprise Access Model (Control/Management/Data planes), PAWs, PAM with just-in-time elevation, and how it breaks the AD attack chain.",
    readTime: "8 min read"
  },
  {
    title: "Zero Trust Architecture in Practice",
    url: "theory/2026-10-02-zero-trust-architecture.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "What Zero Trust actually means beyond the buzzword — NIST 800-207's tenets and the PDP/PEP model, the CISA pillars and maturity stages, what it looks like per domain, how to migrate to it, and the attack paths it breaks.",
    readTime: "9 min read"
  },
  {
    title: "Network Segmentation & Micro-segmentation",
    url: "theory/2026-10-02-network-segmentation.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "How defenders carve a network to limit blast radius — zones, VLANs, north-south vs east-west, the micro-segmentation approaches and vendors, how to roll it out without outages, PCI scope reduction, and how it breaks lateral movement.",
    readTime: "8 min read"
  },
  {
    title: "Building a SOC — Detection to Response",
    url: "theory/2026-10-02-soc-detection-response.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "How a Security Operations Centre is built and run end to end — telemetry sources, the log pipeline and tiering, SIEM and detection content, UEBA and threat intel, SOAR, the Tier 1/2/3 workflow, the IR lifecycle, and the metrics that matter.",
    readTime: "9 min read"
  },
  {
    title: "Detection Engineering with MITRE ATT&CK",
    url: "theory/2026-10-02-detection-engineering-attack.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "Detection as an engineering discipline — the ATT&CK matrix as a coverage map, the detection lifecycle, the Pyramid of Pain, detections-as-code with Sigma, mapping the site's own attacks to detections, and validating with purple teaming and BAS.",
    readTime: "9 min read"
  },
  {
    title: "EDR/XDR — How Endpoint Detection Works",
    url: "theory/2026-10-02-edr-xdr-endpoint-detection.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "What endpoint detection & response does under the hood — sensor telemetry, behavioural analytics and the cloud backend, response actions, the EDR/EPP/XDR/MDR distinctions, the detection surfaces attackers evade, and running it at fleet scale.",
    readTime: "8 min read"
  },
  {
    title: "How Security Is Built End-to-End in a Large High-Stakes Environment",
    url: "theory/2026-10-02-security-stack-end-to-end.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "A general, vendor-level guide to the full security stack of a large high-stakes organisation (modelled on a global bank) — the network foundation in depth, identity, data, endpoint, cloud/app, the SOC workflow, offensive security, email, GRC and BCDR — naming the real tools in each category with placement, rationale, and trade-offs.",
    readTime: "48 min read"
  },
  {
    title: "How Security Is Designed for a 100,000-User Enterprise",
    url: "theory/2026-10-02-enterprise-security-architecture.html",
    date: "2026-10-02",
    tag: "Blue Team",
    description: "A general guide to securing a 100,000+ user, multi-site, PII-regulated enterprise — the Zero-Trust pillar model, identity and the Enterprise Access Model, segmentation at scale, data residency, the SOC's log-volume math, resilience, and the decision register of hard trade-offs.",
    readTime: "34 min read"
  },
  {
    title: "SCCM / MECM Abuse",
    url: "theory/2026-09-24-sccm-mecm-abuse.html",
    date: "2026-09-24",
    tag: "AD",
    description: "How Configuration Manager becomes a domain-wide code-execution and credential platform — enumeration, NAA and PXE looting, coercion-and-relay site takeover, and admin-level mass deployment.",
    readTime: "16 min read"
  },
  {
    title: "MSSQL / SQL Server Abuse",
    url: "theory/2026-09-24-mssql-abuse.html",
    date: "2026-09-24",
    tag: "AD",
    description: "SQL Server as an AD attack surface — Windows auth, xp_cmdshell and CLR execution, EXECUTE AS impersonation, trusted-link crawling, and coercing the service account for relay.",
    readTime: "15 min read"
  },
  {
    title: "Perimeter → Active Directory",
    url: "theory/2026-09-24-perimeter-to-ad.html",
    date: "2026-09-24",
    tag: "AD",
    description: "Turning an edge foothold into a domain foothold — app-server exploitation, insecure deserialization, Log4Shell and the Exchange pre-auth chains — then the pivot from web shell into the AD attack path.",
    readTime: "14 min read"
  },
  {
    title: "Shadow Credentials, PKINIT & UnPAC-the-Hash",
    url: "theory/2026-09-24-shadow-credentials-pkinit.html",
    date: "2026-09-24",
    tag: "AD",
    description: "How writing msDS-KeyCredentialLink lets you authenticate as a target via certificate-based Kerberos (PKINIT) without their password, then recover the account's NT hash from the ticket.",
    readTime: "14 min read"
  },
  {
    title: "Fast-Path CVEs: Zerologon, noPac, Certifried & PrintNightmare",
    url: "theory/2026-09-24-fast-path-cves.html",
    date: "2026-09-24",
    tag: "AD",
    description: "Four vulnerabilities that collapse the attack path to Domain Admin or SYSTEM — how each abuses a trusted-but-unverified identity, and how to detect and defend them.",
    readTime: "16 min read"
  },
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
