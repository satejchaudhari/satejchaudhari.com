/*
  EXTERNAL RED TEAM WORKFLOW — data for external-red-team-workflow.html
  (rendered by rtwmap-main.js). Outside-in: recon, then the vectors that turn
  recon into an internal foothold.

    recon  (OSINT)          -> a CHECKLIST (coverage is a list, so it ticks).
    access (Initial Access) -> a PLAYBOOK of vectors -> techniques. Each has a
                               note, a command, tool/theory/vuln chips, outcome
                               badges and jumpable "on success -> next step"
                               links. Vectors are options, not checks.

  MODEL
    RTW_MAP = { meta, recon:{sections:[checklist]}, access:{sections:[playbook]} }
    checklist section: {id,title,color,tag,desc, groups:[{id,title,scenario,
      items:[{text,desc,tools?,vulns?}]}]}
    playbook section:  {id,title,color,tag,desc, techniques:[{id,title,note,
      tools?,theory?,vulns?,cmd?|cmds?,outcomes:[{label,color}],
      moveTo:[{sec,tech?,label,note,color?} | {url,label,note,color?}]}]}

  Edit THIS file for content; never edit rtwmap-main.js.
*/

var RTW_MAP = {
  meta: {
    title: "External Red Team Workflow",
    note: "Reconnaissance (OSINT) as a checklist, then Initial Access as a jumpable playbook."
  },

  /* ================================================================== */
  /* PART 1 — RECONNAISSANCE (OSINT) — checklist                         */
  /* ================================================================== */
  recon: {
    sections: [
      {
        id: "r-domain", title: "Domains, DNS & Infrastructure", color: "#38bdf8", tag: "Infra",
        desc: "Map the namespace: registration, DNS, subdomains, certificates.",
        groups: [
          { id: "rd-whois", title: "WHOIS & DNS", scenario: "once you have a domain.", items: [
            { text: "WHOIS / RDAP and reverse-WHOIS for sibling domains", desc: "Registrar, dates, name servers, registrant pivots.", tools: [ { n: "ViewDNS", url: "https://viewdns.info/" } ] },
            { text: "Enumerate DNS records and attempt AXFR", desc: "A/MX/NS/TXT/SOA map hosting, mail and SaaS; a misconfigured NS leaks the zone." },
            { text: "Query passive DNS", desc: "Historical resolutions reveal old IPs and related hostnames.", tools: [ { n: "SecurityTrails", url: "https://securitytrails.com/" } ] }
          ]},
          { id: "rd-subs", title: "Subdomains & certificates", scenario: "to widen the attack surface.", items: [
            { text: "Enumerate subdomains passively", desc: "Aggregate from many passive sources.", tools: [ { n: "amass", id: "amass" }, { n: "subfinder", id: "subfinder" }, { n: "theHarvester", id: "theharvester" } ] },
            { text: "Mine Certificate Transparency logs", desc: "CT logs list hostnames on issued certs.", tools: [ { n: "crt.sh", url: "https://crt.sh/" } ] },
            { text: "Flag dangling / unclaimed subdomains", desc: "CNAMEs to deprovisioned services are takeover candidates (see Initial Access).", tools: [ { n: "whatweb", id: "whatweb" } ] }
          ]}
        ]
      },
      {
        id: "r-assets", title: "Hosts & Internet Assets", color: "#2dd4bf", tag: "Attack surface",
        desc: "Exposed services, netblocks and devices from internet-wide scan data.",
        groups: [
          { id: "ra-scan", title: "Scan engines & ASN", scenario: "to see exposure without scanning the target.", items: [
            { text: "Search the target in device search engines", desc: "Open ports, banners, versions, screenshots, favicons, exposed panels.", tools: [ { n: "Shodan", id: "shodan" }, { n: "Censys", id: "censys" } ] },
            { text: "Map the ASN and netblocks", desc: "Owned ranges expand the asset list.", tools: [ { n: "bgp.he.net", url: "https://bgp.he.net/" } ] },
            { text: "Pivot on favicon / cert / title hashes", desc: "Find other hosts sharing the same asset." }
          ]}
        ]
      },
      {
        id: "r-people", title: "People, Email & Usernames", color: "#fb7185", tag: "HUMINT",
        desc: "Build the people picture — names, roles, handles.",
        groups: [
          { id: "rpe-org", title: "Org & people", scenario: "to build the org chart and email format.", items: [
            { text: "Harvest employees, roles and email format", desc: "Org chart + first.last@ pattern drive phishing, vishing and spraying.", tools: [ { n: "theHarvester", id: "theharvester" }, { n: "Hunter.io", url: "https://hunter.io/" } ] },
            { text: "Mine job postings and public records", desc: "Vacancies leak the tech stack; registries confirm the entity.", tools: [ { n: "OpenCorporates", url: "https://opencorporates.com/" } ] },
            { text: "Identify the help desk and IT process", desc: "Who resets passwords/MFA and how — the pretext for vishing." }
          ]},
          { id: "rpe-id", title: "Usernames & email", scenario: "with a handle, email or name in hand.", items: [
            { text: "Enumerate usernames across platforms", desc: "A reused handle links accounts everywhere.", tools: [ { n: "Sherlock", id: "sherlock" }, { n: "Maigret", id: "maigret" } ] },
            { text: "Check which services an email is registered on", desc: "Account-existence checks with no password attempts.", tools: [ { n: "Holehe", id: "holehe" } ] },
            { text: "Enrich with people-search aggregators", desc: "Addresses, relatives and past locations (region-specific).", tools: [ { n: "IntelTechniques", url: "https://inteltechniques.com/tools/" } ] }
          ]}
        ]
      },
      {
        id: "r-social", title: "Social Media (SOCMINT)", color: "#60a5fa", tag: "SOCMINT",
        desc: "Profiles, posts and networks across platforms — the richest people source.",
        groups: [
          { id: "rs-profiles", title: "Profiles & posts", scenario: "once an account is linked to the target or its staff.", items: [
            { text: "Enumerate profiles per platform", desc: "LinkedIn, X, Facebook, Instagram, TikTok, Reddit, Mastodon — each has its own search quirks." },
            { text: "Map the social graph and employees", desc: "Connections and org members reveal teams, reporting lines and relationships." },
            { text: "Mine posts for operational detail", desc: "Badge photos, desk setups, screens, tech mentions, events and out-of-office windows." }
          ]},
          { id: "rs-capture", title: "Search & capture", scenario: "to gather at scale and preserve evidence.", items: [
            { text: "Use platform search operators and read-only viewers", desc: "Advanced search and viewers reduce account risk." },
            { text: "Archive posts as you find them", desc: "Social content is deleted fast — capture it immediately.", tools: [ { n: "archive.today", url: "https://archive.ph/" } ] }
          ]}
        ]
      },
      {
        id: "r-media", title: "Images, Media & Geolocation", color: "#e879f9", tag: "IMINT / GEOINT",
        desc: "Reverse-image, media and geolocation to source photos and place sites.",
        groups: [
          { id: "rm-image", title: "Reverse image & media", scenario: "when you have a photo, avatar, screenshot or video.", items: [
            { text: "Reverse-image search across engines", desc: "Each indexes differently — always use several.", tools: [ { n: "Google Lens", url: "https://images.google.com/" }, { n: "Yandex", url: "https://yandex.com/images/" }, { n: "TinEye", url: "https://tineye.com/" } ] },
            { text: "Read EXIF / embedded metadata", desc: "GPS, device and timestamps if the file kept them.", tools: [ { n: "ExifTool", id: "exiftool" } ] },
            { text: "Mine video for background detail", desc: "Conference talks and demos leak offices, screens and staff." }
          ]},
          { id: "rm-geo", title: "Geolocation & site recon", scenario: "to place a photo or map a physical site.", items: [
            { text: "Geolocate photos by landmarks and signage", desc: "Shop names, number plates, language and architecture narrow the region.", tools: [ { n: "Google Earth", url: "https://earth.google.com/" }, { n: "Mapillary", url: "https://www.mapillary.com/" } ] },
            { text: "Map offices, entrances and surroundings", desc: "Satellite and street view for the physical / wireless approach." }
          ]}
        ]
      },
      {
        id: "r-breach", title: "Breaches & Leaked Credentials", color: "#f87171", tag: "Leaks",
        desc: "Exposed credentials and leaked datasets that feed credential-based access.",
        groups: [
          { id: "rb-exposure", title: "Credential exposure", scenario: "with an email, username, domain or phone in hand.", items: [
            { text: "Check identifiers against breach indexes", desc: "Which breaches an identifier appears in, and which services the person used.", tools: [ { n: "Have I Been Pwned", url: "https://haveibeenpwned.com/" } ] },
            { text: "Search aggregated leaks and stealer logs", desc: "Linked emails, usernames, passwords and session cookies across dumps.", tools: [ { n: "Dehashed", url: "https://dehashed.com/" }, { n: "Intelligence X", url: "https://intelx.io/" } ] },
            { text: "Derive password patterns for spraying", desc: "Reuse and predictable mutation across services is the useful intelligence." }
          ]},
          { id: "rb-paste", title: "Paste & dark-web mentions", scenario: "to catch chatter and dumps naming the org.", items: [
            { text: "Monitor paste sites and leak indexes", desc: "Dumped creds, docs and chatter surface on pastebins and aggregators.", tools: [ { n: "Intelligence X", url: "https://intelx.io/" } ] },
            { text: "Search dark-web mentions of the org", desc: "Observe only — onion indexes for the target's name and domains.", tools: [ { n: "Ahmia", url: "https://ahmia.fi/" } ] }
          ]}
        ]
      },
      {
        id: "r-content", title: "Web, Code, Cloud & Metadata", color: "#a3e635", tag: "Exposure",
        desc: "What the target's web, repos, cloud and documents inadvertently expose.",
        groups: [
          { id: "rc-web", title: "Web, archives & dorking", scenario: "when you have sites or want their history.", items: [
            { text: "Fingerprint the stack and crawl content", desc: "CMS, analytics IDs, hidden paths, APIs, login panels.", tools: [ { n: "whatweb", id: "whatweb" }, { n: "katana", id: "katana" } ] },
            { text: "Pull archives and dork for exposed files", desc: "Deleted pages, configs, backups, panels, spreadsheets.", tools: [ { n: "Wayback Machine", url: "https://web.archive.org/" }, { n: "Google Hacking DB", url: "https://www.exploit-db.com/google-hacking-database" } ] }
          ]},
          { id: "rc-secrets", title: "Code, cloud & docs", scenario: "to find secrets and internal detail.", items: [
            { text: "Enumerate repos and scan for secrets", desc: "Keys and tokens in code and git history.", tools: [ { n: "GitHub search", url: "https://github.com/search" }, { n: "trufflehog" } ] },
            { text: "Enumerate public cloud storage", desc: "Open buckets/blobs guessed from naming.", tools: [ { n: "cloud_enum" } ] },
            { text: "Harvest document metadata", desc: "Authors, software, internal paths and usernames from public files.", tools: [ { n: "ExifTool", id: "exiftool" }, { n: "metagoofil" } ] }
          ]}
        ]
      }
    ]
  },

  /* ================================================================== */
  /* PART 2 — INITIAL ACCESS — playbook (jumpable)                       */
  /* ================================================================== */
  access: {
    sections: [
      {
        id: "phishing", title: "Phishing & Social Engineering", color: "#fb7185", tag: "T1566",
        desc: "Get a human to run code, hand over credentials, or approve access — the most common real-world entry.",
        techniques: [
          { id: "ph-attach", title: "Spearphishing attachment", note: "Send a lure that runs a loader when opened. The payload rides inside a container (ISO/IMG/VHD) or a macro/LNK, usually behind a password to beat the gateway sandbox. Sender domain is aged and SPF/DKIM/DMARC-aligned so it clears mail filtering.",
            tools: [ { n: "GoPhish", id: "gophish" } ],
            outcomes: [ { label: "Payload lands on a user host", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "get the loader to run and survive AV/EDR" } ] },
          { id: "ph-link", title: "Spearphishing link (credential harvest)", note: "A link to a cloned login on a look-alike domain captures the password. Works where MFA is absent or where the harvested password is reused on a non-MFA service. Pretext as a shared document, mailbox-quota or password-expiry notice.",
            tools: [ { n: "GoPhish", id: "gophish" } ],
            outcomes: [ { label: "Password captured", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate & spray", note: "confirm the password and find where it is reused" } ] },
          { id: "ph-aitm", title: "Adversary-in-the-middle (reverse proxy)", note: "A reverse-proxy phishing kit relays the real login, so the user completes MFA against the genuine site through you; you capture the issued session cookie. This defeats app/push/TOTP MFA (but not phishing-resistant FIDO2/passkeys).",
            tools: [ { n: "Evilginx", url: "https://github.com/kgretzky/evilginx2" } ],
            outcomes: [ { label: "Live session cookie (MFA bypassed)", color: "#93c5fd" } ],
            moveTo: [ { sec: "cloud", tech: "cl-replay", label: "Token / session replay", note: "import the cookie to ride the session" } ] },
          { id: "ph-consent", title: "OAuth consent / device-code phishing", note: "Instead of a password, get the user to authorise access. A malicious OAuth app requests mailbox/files scopes, or you start a device-code flow and have the user enter your code on the real provider. Both yield refresh tokens that survive password resets and MFA.",
            outcomes: [ { label: "OAuth refresh tokens", color: "#93c5fd" } ],
            moveTo: [ { sec: "cloud", label: "Cloud & SaaS Entry", note: "use the tokens against the tenant" } ] },
          { id: "ph-vish", title: "Vishing / help-desk social engineering", note: "Call the IT help desk impersonating an employee (details from recon) to reset a password or enrol an attacker-controlled MFA device — the technique behind many recent intrusions. Or call a user posing as IT to walk them into running a remote-support tool.",
            outcomes: [ { label: "Reset credentials / enrolled MFA", color: "#fbbf24" } ],
            moveTo: [ { sec: "cloud", label: "Cloud & SaaS Entry", note: "sign in with the reset account + your MFA" }, { sec: "remote", label: "External Remote Services", note: "log into VPN / webmail" } ] },
          { id: "ph-mfa", title: "MFA fatigue / push bombing", note: "With a valid password already in hand, trigger repeated push approvals (often paired with a vishing call posing as IT) until the user approves one. Only works against number-matching-free push MFA.",
            outcomes: [ { label: "Approved sign-in", color: "#fbbf24" } ],
            moveTo: [ { sec: "cloud", label: "Cloud & SaaS Entry", note: "complete the sign-in to the tenant" } ] },
          { id: "ph-smish", title: "Smishing / QR phishing / callback (TOAD)", note: "Move the lure off email, where gateways do not see it: an SMS link, a QR code the user scans on a phone, or a benign message with a callback number that routes to an operator who walks the victim into access.",
            outcomes: [ { label: "Credentials / remote access", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate the credentials", note: "see what the captured account unlocks" } ] }
        ]
      },
      {
        id: "web", title: "Public-Facing Web Applications", color: "#38bdf8", tag: "T1190",
        desc: "Exploit an internet-facing app or appliance to run code, read secrets, or reach internal systems.",
        techniques: [
          { id: "web-fp", title: "Fingerprint, map & scan", note: "Identify product/version from headers, favicon and errors; map content and APIs; and scan for known CVEs to choose an exploit. Work the app in full with the web checklist, then drop to the technique that matches the weakness you confirm.",
            tools: [ { n: "whatweb", id: "whatweb" }, { n: "nuclei", id: "nuclei" }, { n: "ffuf", id: "ffuf" }, { n: "Burp", id: "burpsuite" } ],
            cmds: [ "whatweb https://<target>", "nuclei -u https://<target>", "ffuf -u https://<target>/FUZZ -w raft-medium.txt" ],
            outcomes: [ { label: "Confirmed weakness", color: "#86efac" } ],
            moveTo: [ { url: "web-map.html", label: "Web Pentest Checklist", note: "work the app end-to-end", color: "#f59e0b" } ] },
          { id: "web-sqli", title: "SQL injection → data / RCE", note: "Dump credentials from the database, or — where the DB user is privileged — escalate to OS execution via stacked queries, xp_cmdshell (MSSQL), or INTO OUTFILE to write a web shell (MySQL).",
            tools: [ { n: "sqlmap", id: "sqlmap" } ], vulns: [ { n: "SQL Injection", id: "sqli" } ],
            cmds: [ "sqlmap -u \"https://<target>/item?id=1\" --batch --dbs", "sqlmap -u \"https://<target>/item?id=1\" --os-shell" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" }, { label: "Dumped credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "turn code exec into C2" }, { sec: "creds", label: "Reuse the dumped creds", note: "spray them at other services" } ] },
          { id: "web-upload", title: "File upload → web shell", note: "Bypass upload validation (extension, content-type, magic bytes, double extension) to place an executable handler in a web-served directory, then request it for command execution as the web user.",
            vulns: [ { n: "File Upload", id: "file-upload" } ],
            cmds: [ "# upload shell.php / shell.aspx to a served path", "curl \"https://<target>/uploads/shell.php?cmd=id\"" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "drop a beacon from the web shell" } ] },
          { id: "web-rce", title: "Injection / deserialization → RCE", note: "Server-side template injection, OS command injection, and insecure deserialization (gadget chains) all break straight to a shell. Confirm with a safe marker first, then escalate to a command.",
            vulns: [ { n: "SSTI", id: "ssti" }, { n: "Command Injection", id: "command-injection" }, { n: "Deserialization", id: "insecure-deserialization" } ],
            cmds: [ "# SSTI confirm: {{7*7}} / ${7*7}  -> then RCE gadget", "# deserialization: ysoserial <gadget> '<cmd>' -> sink" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "beacon from the exploited process" } ] },
          { id: "web-ssrf", title: "SSRF → cloud metadata / internal", note: "Abuse a server-side request to reach the cloud metadata endpoint for the instance role's temporary credentials, or to pivot to internal-only services behind the app.",
            vulns: [ { n: "SSRF", id: "ssrf" } ],
            cmds: [ "curl \"https://<target>/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/\"" ],
            outcomes: [ { label: "Cloud credentials", color: "#93c5fd" } ],
            moveTo: [ { sec: "cloud", tech: "cl-keys", label: "Cloud & SaaS Entry", note: "use the role creds against the cloud API" } ] },
          { id: "web-leak", title: "Auth bypass / default creds / exposed source", note: "Weak or default auth on panels and appliances, path traversal/LFI and XXE reading config and keys, or leaked .git/backups handing over source and credentials.",
            vulns: [ { n: "Auth Bypass", id: "auth-bypass" }, { n: "Default Creds", id: "default-credentials" }, { n: "Path Traversal", id: "path-traversal" }, { n: "XXE", id: "xxe" }, { n: "Exposed Source", id: "exposed-source-backups" } ],
            cmds: [ "# try admin:admin / vendor defaults on the panel", "git-dumper https://<target>/.git ./out" ],
            outcomes: [ { label: "Admin of app/appliance", color: "#86efac" }, { label: "Credentials / secrets", color: "#fbbf24" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "use the appliance for code exec / pivot" }, { sec: "creds", label: "Reuse recovered creds", note: "spray them elsewhere" } ] },
          { id: "web-takeover", title: "Subdomain takeover", note: "A DNS record (CNAME) still points at a deprovisioned cloud service you can re-register. Claim it to serve content from a trusted target subdomain — ideal for a far more convincing credential-harvesting or payload page.",
            cmds: [ "# dangling CNAME -> register the orphaned service and host your content" ],
            outcomes: [ { label: "Control of a trusted subdomain", color: "#fb7185" } ],
            moveTo: [ { sec: "phishing", tech: "ph-link", label: "Credential harvest on the trusted domain", note: "phish from the real target subdomain" } ] }
        ]
      },
      {
        id: "services", title: "Exposed Services & Management Interfaces", color: "#f59e0b", tag: "T1190 / T1133",
        desc: "Non-web services left on the internet — databases, CI/CD, file and management interfaces — often with no auth, default creds or a known RCE.",
        techniques: [
          { id: "sv-db", title: "Exposed databases & caches", note: "MSSQL, MySQL, MongoDB, Redis, Elasticsearch, PostgreSQL and CouchDB reachable from the internet, frequently with no authentication or weak creds. Read the data, or abuse DB features (xp_cmdshell, UDF, Redis module/cron write) for code execution.",
            tools: [ { n: "nmap", id: "nmap" }, { n: "netexec", id: "netexec" } ],
            cmds: [ "nmap -Pn -sV -p 1433,3306,5432,6379,9200,27017 <target>", "# Redis unauth: write SSH key / cron via CONFIG SET dir" ],
            outcomes: [ { label: "Data dump", color: "#fbbf24" }, { label: "Code execution", color: "#5eead4" } ],
            moveTo: [ { sec: "creds", label: "Loot credentials from the data", note: "reuse creds found in the DB" }, { sec: "foothold", label: "Establish the foothold", note: "if the DB gave code exec" } ] },
          { id: "sv-cicd", title: "Exposed CI/CD & DevOps", note: "Internet-facing Jenkins, GitLab, TeamCity, Docker registries and open Docker/Kubernetes APIs. Unauthenticated or default-cred access runs build jobs (Groovy/pipeline) or launches a privileged container — code execution in the build environment, often with cloud credentials attached.",
            tools: [ { n: "nuclei", id: "nuclei" } ],
            cmds: [ "# Jenkins /script console, or an unauth GitLab/registry", "# open Docker API: docker -H tcp://<target>:2375 run ..." ],
            outcomes: [ { label: "Build / container code exec", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "beacon from the build agent" }, { sec: "cloud", label: "Cloud & SaaS Entry", note: "pipeline identity's cloud rights" } ] },
          { id: "sv-file", title: "Exposed file & management services", note: "Anonymous SMB/NFS/FTP/rsync shares, SNMP with public community strings, and exposed admin interfaces (iDRAC/iLO, printers, VoIP, routers). Loot shares for credentials and read device config.",
            tools: [ { n: "netexec", id: "netexec" }, { n: "nmap", id: "nmap" } ],
            cmds: [ "nxc smb <target> -u '' -p '' --shares", "snmpwalk -v2c -c public <target>" ],
            outcomes: [ { label: "Credentials / config loot", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Reuse the looted credentials", note: "spray at other services" } ] }
        ]
      },
      {
        id: "remote", title: "External Remote Services / VPN", color: "#2dd4bf", tag: "T1133",
        desc: "Log in to internet-facing remote-access services — VPN, RDP, SSH, Citrix, webmail — or exploit the appliance itself.",
        techniques: [
          { id: "rm-enum", title: "Enumerate exposed portals", note: "Find VPN, RDP, SSH, Citrix/VDI, OWA/Exchange and management portals, and fingerprint edge-appliance versions for pre-auth chains (Fortinet, Citrix NetScaler, Pulse/Ivanti, GlobalProtect, Exchange).",
            tools: [ { n: "nmap", id: "nmap" }, { n: "nuclei", id: "nuclei" } ], theory: { label: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" },
            cmds: [ "nmap -Pn -sV -p 22,443,3389,5985 <target>" ],
            outcomes: [ { label: "Sprayable portal", color: "#fbbf24" }, { label: "Vulnerable appliance", color: "#86efac" } ],
            moveTo: [ { sec: "remote", tech: "rm-spray", label: "Password spray the portal", note: "if it just needs valid creds" }, { sec: "remote", tech: "rm-edge", label: "Exploit the appliance", note: "if it is a vulnerable edge device" } ] },
          { id: "rm-edge", title: "Exploit the edge appliance", note: "VPN concentrators and webmail are the most-targeted external RCE: match the version to a pre-auth chain, exploit to a web shell or auth bypass on the device, and harvest sessions/credentials from it.",
            tools: [ { n: "nuclei", id: "nuclei" } ], theory: { label: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" },
            outcomes: [ { label: "Code exec on the edge", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "pivot inward from the appliance" } ] },
          { id: "rm-spray", title: "Password spray the portal", note: "A couple of likely passwords (season+year, company name) across the whole user list, spaced under the lockout threshold. Watch for Exchange/OWA and Autodiscover, which often lack lockout.",
            tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ],
            cmds: [ "nxc smb <target> -u users.txt -p 'Spring2025!' --continue-on-success", "kerbrute passwordspray -d <domain> users.txt 'Spring2025!'" ],
            outcomes: [ { label: "Valid credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate & map access", note: "see what the account reaches" } ] },
          { id: "rm-valid", title: "Log in with valid / breach creds", note: "Reused or leaked credentials logged straight into VPN/RDP/webmail. Defeat MFA with an AiTM session cookie or a device enrolled via vishing; without MFA, a working password is a direct foothold.",
            outcomes: [ { label: "Authenticated remote access", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate from the remote session" } ] }
        ]
      },
      {
        id: "creds", title: "Valid Accounts & Credentials", color: "#fbbf24", tag: "T1078",
        desc: "The quietest vector — obtain credentials, then log in rather than exploiting anything. The hub most other vectors feed into.",
        techniques: [
          { id: "cr-obtain", title: "Obtain credentials", note: "From breach/combolist dumps matched to the target's users, keys and tokens committed to public repos, or session cookies pulled from AiTM phishing and info-stealer logs sold in bulk.",
            tools: [ { n: "trufflehog" }, { n: "Dehashed", url: "https://dehashed.com/" } ],
            cmds: [ "trufflehog github --org=<org>" ],
            outcomes: [ { label: "Candidate credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", tech: "cr-spray", label: "Spray & validate", note: "turn candidates into working access" } ] },
          { id: "cr-spray", title: "Spray, stuff & validate", note: "Password-spray one password across all users (respecting lockout), credential-stuff leaked pairs, and try default/vendor creds. Validate working pairs and map exactly which services, mailboxes and apps they reach.",
            tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ], vulns: [ { n: "Default Credentials", id: "default-credentials" } ],
            cmds: [ "nxc smb <target> -u users.txt -p 'Season2025!' --continue-on-success", "nxc <proto> <target> -u <user> -p <pass>   # validate + enumerate" ],
            outcomes: [ { label: "Working account", color: "#86efac" } ],
            moveTo: [ { sec: "remote", label: "Log in to a remote service", note: "VPN / RDP / webmail / portal" }, { sec: "cloud", label: "Cloud & SaaS Entry", note: "if it is a cloud / M365 identity" } ] }
        ]
      },
      {
        id: "cloud", title: "Cloud & SaaS Entry", color: "#93c5fd", tag: "Cloud",
        desc: "Identity and misconfiguration are the external perimeter — get into the tenant, not the datacentre.",
        techniques: [
          { id: "cl-spray", title: "Cloud identity password spray", note: "Spray the M365 / Entra ID / Okta sign-in and legacy endpoints (OWA, Autodiscord, EWS) which often lack lockout and MFA. Enumerate valid users first to avoid noise.",
            tools: [ { n: "AADInternals", url: "https://aadinternals.com/aadinternals/" } ],
            cmds: [ "# MSOLSpray / AADInternals against login.microsoftonline.com" ],
            outcomes: [ { label: "Valid cloud credentials", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate within the tenant" } ] },
          { id: "cl-keys", title: "Leaked cloud keys → console / API", note: "Access keys from repos, laptops, CI or SSRF-to-metadata used against the provider API. Enumerate the identity's permissions, then reach secrets, compute and data.",
            cmds: [ "aws sts get-caller-identity", "aws s3 ls   # then enumerate the identity's permissions" ],
            outcomes: [ { label: "Cloud API access", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "pivot to compute / secrets" } ] },
          { id: "cl-consent", title: "OAuth consent / SSO federation abuse", note: "A consented malicious app, a forged or stolen SAML/OIDC token, or a federation misconfiguration gives token-based, MFA-surviving access to the tenant and its SaaS.",
            outcomes: [ { label: "Tenant access (token)", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate within the tenant" } ] },
          { id: "cl-replay", title: "Token / session replay", note: "Replay a stolen session cookie or refresh token (from AiTM or a stealer) to the cloud / SaaS endpoint to skip the login and MFA entirely. Use it before it expires or is revoked.",
            outcomes: [ { label: "Authenticated session", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "act within the session's lifetime" } ] }
        ]
      },
      {
        id: "wireless", title: "Wireless Access", color: "#a3e635", tag: "Wi-Fi / RF",
        desc: "Within RF range, break onto Wi-Fi (or other radio) to reach the internal network or capture credentials.",
        techniques: [
          { id: "wl-psk", title: "WPA2-PSK handshake / PMKID crack", note: "Capture the 4-way handshake (deauth a client to force it) or request the PMKID from the AP, then crack offline. The recovered key puts you on a network that usually bridges to the corporate LAN.",
            tools: [ { n: "aircrack-ng", id: "aircrack-ng" }, { n: "hashcat" } ],
            cmds: [ "airodump-ng -c <ch> --bssid <bssid> -w cap wlan0mon", "aireplay-ng --deauth 5 -a <bssid> wlan0mon", "aircrack-ng -w rockyou.txt cap-01.cap" ],
            outcomes: [ { label: "Wi-Fi key → on the LAN", color: "#60a5fa" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "now hunt credentials on the segment" } ] },
          { id: "wl-eap", title: "WPA2-Enterprise evil twin", note: "A rogue AP + rogue RADIUS captures the 802.1x MSCHAPv2 challenge/response from clients that do not validate the server certificate — crack it offline for domain credentials.",
            tools: [ { n: "eaphammer", url: "https://github.com/s0lst1c3/eaphammer" } ],
            cmds: [ "eaphammer -i wlan0 --essid <SSID> --creds" ],
            outcomes: [ { label: "Domain credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate & spray", note: "use the recovered domain creds" } ] },
          { id: "wl-rogue", title: "Rogue AP / Karma / captive portal", note: "Broadcast an open or known SSID (Karma answers probe requests) so clients auto-associate, then serve a captive portal to harvest creds or deliver a payload.",
            outcomes: [ { label: "Credentials / client code exec", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery", note: "land code on the lured client" } ] },
          { id: "wl-guest", title: "Pivot from guest / IoT Wi-Fi", note: "Join the guest or IoT SSID and test segmentation toward corporate — weak VLAN separation or a dual-homed device bridges you across.",
            outcomes: [ { label: "Internal network access", color: "#60a5fa" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "pivot into the corporate segment" } ] }
        ]
      },
      {
        id: "physical", title: "Physical Access & Entry", color: "#f59e0b", tag: "Physical",
        desc: "Get a body (or a device) inside the building and onto the network.",
        techniques: [
          { id: "py-entry", title: "Entry (tailgate / badge / lock / pretext)", note: "Follow staff through controlled doors, clone an RFID badge at reading range, bypass the lock, or talk in with a courier/contractor/inspector pretext built from recon.",
            tools: [ { n: "Proxmark3" }, { n: "Flipper Zero" } ],
            outcomes: [ { label: "Inside the building", color: "#f59e0b" } ],
            moveTo: [ { sec: "physical", tech: "py-dropbox", label: "Plant access on-site", note: "now get onto the network" } ] },
          { id: "py-dropbox", title: "Drop box / network implant", note: "Plug a small, concealed device into a live LAN port (or behind a desk phone/printer) that beacons out — ideally over its own 4G, so it does not depend on the target's egress.",
            tools: [ { n: "Raspberry Pi / LAN Turtle" } ],
            outcomes: [ { label: "Internal foothold (beacon)", color: "#cbd5e1" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "operate the LAN through the implant" } ] },
          { id: "py-badusb", title: "BadUSB / HID injection", note: "A USB device that presents as a keyboard and types a payload into an unlocked, logged-in workstation.",
            tools: [ { n: "Rubber Ducky / Flipper Zero" } ],
            outcomes: [ { label: "Code execution on host", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "run the loader, evade EDR" } ] },
          { id: "py-workstation", title: "Unattended workstation / boot attack", note: "Use a logged-in unattended session, or boot from external media / a bypass tool to reset local auth on an unencrypted machine.",
            tools: [ { n: "Kon-Boot" } ],
            outcomes: [ { label: "Local access", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "plant persistent access" } ] }
        ]
      },
      {
        id: "removable", title: "Removable Media & Hardware", color: "#c084fc", tag: "T1091 / T1200",
        desc: "Deliver access through physical media or planted hardware, often without entering yourself.",
        techniques: [
          { id: "rv-usb", title: "USB drop", note: "Branded USB keys with an HID payload or an enticing document, scattered where staff will find and plug them in (car park, lobby, reception).",
            outcomes: [ { label: "Code execution on host", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "the loader runs — get it to survive" } ] },
          { id: "rv-cable", title: "Malicious cable / peripheral", note: "An implanted cable or adapter that acts as a keyboard or network device on connection — gifted, swapped in, or planted at a desk.",
            tools: [ { n: "O.MG Cable" } ],
            outcomes: [ { label: "Injected code / network path", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "land and stabilise the payload" } ] },
          { id: "rv-mail", title: "Mailed hardware implant", note: "Post a keylogger, rogue AP or 4G drop box to a target site addressed to a plausible recipient; it beacons out when connected or powered on.",
            outcomes: [ { label: "Beacon from inside", color: "#cbd5e1" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "operate once it is connected" } ] }
        ]
      },
      {
        id: "network", title: "Network & Adjacent Access", color: "#60a5fa", tag: "On-net",
        desc: "On (or next to) the internal network — via a drop box, wireless or assumed breach — abuse weak L2/L3 trust.",
        techniques: [
          { id: "nw-onwire", title: "Get on the wire (NAC / VLAN)", note: "Bypass NAC/802.1x by spoofing an exempt device (printer/VoIP) or bridging behind an authorised one, or VLAN-hop via switch-spoofing / double-tagging to reach a target segment.",
            outcomes: [ { label: "Internal network access", color: "#60a5fa" } ],
            moveTo: [ { sec: "network", tech: "nw-llmnr", label: "Poison & relay", note: "now hunt credentials on the segment" } ] },
          { id: "nw-llmnr", title: "LLMNR / NBT-NS / mDNS poisoning", note: "Answer broadcast name lookups claiming to be the requested host; victims then send NetNTLM authentication you capture, to crack offline or relay.",
            tools: [ { n: "Responder", id: "responder" } ], vulns: [ { n: "LLMNR/NBT-NS", id: "llmnr-nbtns" } ],
            cmds: [ "responder -I eth0 -wd" ],
            outcomes: [ { label: "NetNTLM hash", color: "#e8912e" } ],
            moveTo: [ { sec: "network", tech: "nw-relay", label: "NTLM relay", note: "relay the captured auth" }, { sec: "creds", label: "Crack offline", note: "recover the plaintext password" } ] },
          { id: "nw-relay", title: "NTLM relay (+ coercion)", note: "Relay captured or coerced authentication to SMB/LDAP/AD CS where signing is off — for code execution, a certificate, or a new computer account. Pair with a coercion trigger (PetitPotam, DFSCoerce) to force a DC or host to authenticate.",
            tools: [ { n: "ntlmrelayx", id: "ntlmrelayx" } ], vulns: [ { n: "NTLM Relay", id: "ntlm-relay-vuln" }, { n: "Coercion", id: "authentication-coercion" } ], theory: { label: "Coercion & Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
            cmds: [ "ntlmrelayx.py -tf targets.txt -smb2support", "# coerce: PetitPotam / Coercer / DFSCoerce -> your relay" ],
            outcomes: [ { label: "Code exec / cert / computer account", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "execute on the relayed target" } ] },
          { id: "nw-mitm6", title: "IPv6 DNS takeover (mitm6)", note: "Advertise rogue DHCPv6 + DNS so Windows resolves through you, then relay the captured WPAD/LDAP authentication, often to grant yourself directory rights.",
            tools: [ { n: "mitm6", url: "https://github.com/dirkjanm/mitm6" } ],
            cmds: [ "mitm6 -d <domain>", "ntlmrelayx.py -6 -t ldaps://<dc> --delegate-access" ],
            outcomes: [ { label: "Relayed auth / directory rights", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "use the delegated / relayed access" } ] }
        ]
      },
      {
        id: "supplychain", title: "Supply Chain & Trusted Relationship", color: "#f472b6", tag: "T1195 / T1199",
        desc: "Enter through a third party, vendor or dependency the target already trusts.",
        techniques: [
          { id: "sc-software", title: "Software / update / package poisoning", note: "Trojan a signed update, or publish a typosquatted / poisoned dependency the target's developers or build system pull; the payload runs inside the target as trusted code.",
            outcomes: [ { label: "Code exec inside target", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "callback from the trusted artifact" } ] },
          { id: "sc-trust", title: "Trusted relationship (MSP / B2B)", note: "Abuse a provider's broad, trusted remote access, a B2B VPN/federation trust, or shared contractor credentials to cross from the partner into the target.",
            outcomes: [ { label: "Access via the trusted party", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate from the partner channel" } ] }
        ]
      },
      {
        id: "driveby", title: "Drive-by & Watering Hole", color: "#e879f9", tag: "T1189",
        desc: "Compromise the user through the browser, on sites or ads they already use.",
        techniques: [
          { id: "db-water", title: "Watering hole / malvertising / browser exploit", note: "Compromise a niche/industry site staff visit, buy targeted ads pointing at a lure, or exploit an out-of-date browser/plugin on visit — optionally serving the payload only to target IP ranges.",
            outcomes: [ { label: "Code execution in browser", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "escape the browser, stabilise" } ] },
          { id: "db-smuggle", title: "HTML smuggling delivery", note: "Assemble the payload client-side from benign content so the file is offered by the user's own browser, past the email and web gateways.",
            outcomes: [ { label: "File delivered locally", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "user runs it — get it executing" } ] }
        ]
      },
      {
        id: "delivery", title: "Payload Delivery & Evasion", color: "#5eead4", tag: "Execution",
        desc: "The cross-cutting step — once a vector lands your file or command, get it to run and survive the endpoint.",
        techniques: [
          { id: "dl-run", title: "Delivery & execution primitives", note: "Container files (ISO/IMG/VHD) to strip Mark-of-the-Web, LNK/HTA/scriptlets, macro documents, HTML smuggling, and signed LOLBins to launch the loader under a trusted binary.",
            vulns: [ { n: "AppLocker & WDAC Bypass", url: "theory/2026-10-08-applocker-bypass.html" } ],
            outcomes: [ { label: "Loader runs", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", tech: "dl-evade", label: "Evade the endpoint", note: "survive AV/EDR, AMSI and logging" } ] },
          { id: "dl-evade", title: "Evade the endpoint (AMSI / ETW / EDR)", note: "Silence in-process AMSI and ETW, unhook userland, run in memory and obfuscate the loader and its C2 traffic so the beacon survives.",
            vulns: [ { n: "AMSI & ETW Bypass", url: "theory/2026-10-08-amsi-bypass-modern.html" }, { n: "Defense Evasion", url: "theory/2026-09-23-defense-evasion.html" } ],
            outcomes: [ { label: "Loader survives", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "beacon out to C2" } ] }
        ]
      },
      {
        id: "foothold", title: "Establishing the Foothold", color: "#cbd5e1", tag: "C2",
        desc: "Convert execution into stable, controllable access and hand off to the next phase.",
        techniques: [
          { id: "fh-c2", title: "Get a C2 callback / beacon", note: "Establish command and control over a resilient channel (HTTPS or DNS) through a redirector. Pick a profile that blends into the environment and matches your detection-evasion from the previous step.",
            tools: [ { n: "Sliver", id: "sliver" } ], theory: { label: "C2 Frameworks", url: "theory/2026-09-23-command-and-control.html" },
            outcomes: [ { label: "Interactive session", color: "#cbd5e1" } ],
            moveTo: [ { sec: "foothold", tech: "fh-sa", label: "Situational awareness", note: "orient before moving" } ] },
          { id: "fh-sa", title: "Situational awareness & stabilise", note: "Identify the user, host, privileges, domain and the defences present; then make the access resilient and add low-noise persistence so it survives reboot and logout.",
            cmds: [ "whoami /all" ],
            outcomes: [ { label: "Stable foothold", color: "#cbd5e1" } ],
            moveTo: [ { sec: "foothold", tech: "fh-handoff", label: "Hand off to the next phase", note: "escalate and move inward" } ] },
          { id: "fh-handoff", title: "Hand off to privilege escalation / AD", note: "From the foothold, assess local privilege escalation, then move into the domain. For a web-app foothold, keep working the application with the web checklist.",
            theory: { label: "Perimeter \u2192 AD", url: "theory/2026-09-24-perimeter-to-ad.html" },
            outcomes: [ { label: "Local admin / SYSTEM", color: "#f4b6b6" } ],
            moveTo: [ { url: "ad-map.html", label: "AD Attack-Path Explorer", note: "continue into the domain", color: "#cdc7e6" }, { url: "web-map.html", label: "Web Pentest Checklist", note: "keep testing the web app", color: "#f59e0b" } ] }
        ]
      }
    ]
  }
};
