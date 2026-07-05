/*
  TOOLKIT — the data behind /toolkit.html and /tool-detail.html.

  This file intentionally holds a small, curated set of tools — this is a
  field reference manual, not a link directory. Every tool gets the same
  structure so the detail page (and its search/quick-nav) works the same
  way everywhere:

  {
    id:          "unique-slug",              // required — powers tool-detail.html?tool=<id>
    name:        "Tool Name",
    url:         "https://...",              // official site — "Visit site" button
    description: "One line for the toolkit grid card.",
    brief:       "Overview paragraph(s). Use \n\n to separate paragraphs.",

    quickReference: [                        // always-visible rapid-access box
      { label: "What this does", cmd: "the command or action" }
    ],

    sections: [                              // collapsible, categorized reference —
                                              // this is the bulk of the page
      {
        title: "Category Name",
        type: "table",                       // flags/scripts/options/concepts — 2+ columns
        columns: ["Option", "Description"],
        rows: [["-x", "what it does"], ...]  // arrays matching `columns`, in order
      },
      {
        title: "Common Workflows",
        type: "commands",                    // named, ready-to-run sequences
        commands: [
          { label: "Workflow name", cmd: "step one\nstep two\nstep three" }
        ]
      },
      {
        title: "Notes & Tips",
        type: "notes",                       // plain bullet list, no code styling
        items: ["A tip.", "Another tip."]
      }
    ]
  }

  HOW TO ADD A TOOL:
  1. Add a new { category: "...", tools: [...] } block, or a tool into an
     existing one.
  2. Give it at least `id`, `name`, `url`, `description`. Everything else
     (brief/quickReference/sections) is optional — the detail page only
     builds a "Guide" button on the card if `sections` has content.
  3. Save and refresh — toolkit.html and tool-detail.html both render
     automatically, including the quick-nav and search box.

  Double-check every URL before publishing — this page is meant to be a
  reliable jumping-off point, broken or stale links undermine that.
*/

var TOOLKIT = [
  {
    category: "Network Recon",
    tools: [
      {
        id: "nmap",
        name: "Nmap",
        url: "https://nmap.org/",
        description: "Network discovery, port scanning, service detection, and OS fingerprinting.",
        brief: "Nmap is the standard network scanner for host discovery, port enumeration, service/version detection, OS fingerprinting, and scripted vulnerability checks via NSE. This page is organized by task — discovery, port selection, scan type, enumeration, scripting, timing, and output — so a specific flag is always a couple of seconds away, not a scroll through one long list.\n\nModern, rarely-used-in-practice scan types (Xmas, FIN, Null, Maimon, idle/zombie scans) are deliberately left out — they're evadable in theory but rarely worth reaching for on a real engagement. What's below is what actually gets used.",
        quickReference: [
          { label: "Fast first-pass sweep across a range", cmd: "sudo nmap -T4 -F --min-rate 300 -n -Pn 10.10.10.0/24" },
          { label: "Full TCP port scan, no assumptions", cmd: "sudo nmap -p- -T4 -n -Pn <target>" },
          { label: "Standard second pass — services + default scripts", cmd: "nmap -sV -sC -p<ports> <target>" },
          { label: "UDP — common ports only, it's slow", cmd: "sudo nmap -sU --top-ports 20 <target>" },
          { label: "Always save output — one flag, every format", cmd: "nmap -oA scan_name <target>" }
        ],
        sections: [
          {
            title: "Discovery",
            type: "table",
            columns: ["Option", "Description"],
            rows: [
              ["-sn", "Ping scan only — skip port scanning entirely"],
              ["-Pn", "Treat all hosts as online, skip host discovery (needed when ICMP is filtered)"],
              ["-n", "Never do DNS resolution — faster scans"],
              ["-R", "Always resolve DNS, even for offline hosts"],
              ["-PE", "ICMP Echo Request ping"],
              ["-PS<ports>", "TCP SYN ping — good ICMP-blocked alternative, e.g. -PS22,80,443"],
              ["-PA<ports>", "TCP ACK ping"],
              ["-PU<ports>", "UDP ping"],
              ["--disable-arp-ping", "Disable ARP discovery on local networks (ARP is normally used automatically and is very reliable on-LAN)"]
            ]
          },
          {
            title: "Port Selection",
            type: "table",
            columns: ["Option", "Description"],
            rows: [
              ["-p<ports>", "Specify ports to scan, e.g. -p22,80,443 or -p1-1000"],
              ["-p-", "Scan all 65,535 TCP ports"],
              ["-F", "Fast mode — scan the top 100 ports only"],
              ["--top-ports <n>", "Scan the top N most common ports"],
              ["--exclude-ports <ports>", "Exclude specific ports from an otherwise broader scan"],
              ["-r", "Scan ports in sequential order instead of randomized"]
            ]
          },
          {
            title: "Scan Types",
            type: "table",
            columns: ["Option", "Description"],
            rows: [
              ["-sS", "TCP SYN scan (half-open). Fast and the default for root — never completes the handshake, so it's quieter in application logs."],
              ["-sT", "TCP connect scan. Completes the full 3-way handshake — used when you can't get raw-socket privileges. Slower, and shows up in app-level logs."],
              ["-sU", "UDP scan. No handshake exists for UDP, so state is inferred from responses (or silence) — slow, and often reports open|filtered."]
            ]
          },
          {
            title: "Enumeration",
            type: "table",
            columns: ["Option", "Description"],
            rows: [
              ["-sV", "Probe open ports to detect service/version"],
              ["--version-intensity <0-9>", "How hard to try during version detection (higher = more probes, slower)"],
              ["-O", "OS detection via TCP/IP stack fingerprinting"],
              ["--osscan-guess", "Guess OS more aggressively when the match isn't clean"],
              ["-A", "Aggregate flag: OS detection + version detection + default scripts + traceroute, all at once"],
              ["Manual banner grab", "nc -nv <target> <port>  or  openssl s_client -connect <target>:443 — confirm what Nmap reported, by hand"]
            ]
          },
          {
            title: "NSE Scripts",
            type: "table",
            columns: ["Category", "Script / Flag", "Description"],
            rows: [
              ["flags", "-sC", "Run the default set of NSE scripts"],
              ["flags", "--script <name>", "Run specific script(s) or a category — comma-separated, wildcards ok (--script http*)"],
              ["flags", "--script-args <k=v>", "Pass arguments into NSE scripts"],
              ["flags", "--script-updatedb", "Refresh the local NSE script database"],
              ["discovery", "broadcast-ping", "Discover extra hosts on the local segment via broadcast ping"],
              ["discovery", "dns-brute", "Brute-force subdomains of a domain via DNS"],
              ["smb", "smb-os-discovery", "Fingerprint OS/version info over SMB"],
              ["smb", "smb-enum-shares", "List SMB shares visible to the supplied (or anonymous) credentials"],
              ["smb", "smb-enum-users", "Enumerate domain/local users over SMB"],
              ["smb", "smb-vuln-ms17-010", "Check for EternalBlue (MS17-010)"],
              ["smb", "smb2-security-mode", "Report whether SMB signing is required — relevant to relay attacks"],
              ["http", "http-title", "Grab the page title — quick sanity check on 80/443"],
              ["http", "http-enum", "Brute-force common web paths/directories"],
              ["http", "http-methods", "List allowed HTTP methods, flag risky ones (PUT/TRACE)"],
              ["http", "http-headers", "Dump the full HTTP response headers"],
              ["dns", "dns-zone-transfer", "Attempt an AXFR zone transfer against a DNS server"],
              ["ssl", "ssl-cert", "Retrieve and parse the presented SSL/TLS certificate"],
              ["ssl", "ssl-enum-ciphers", "Enumerate supported TLS ciphers, flag weak/deprecated ones"],
              ["vuln", "vulners", "Cross-reference detected service versions against the Vulners CVE database"],
              ["vuln", "--script vuln", "Run every installed vuln-category script at once against the target"]
            ]
          },
          {
            title: "Timing & Performance",
            type: "table",
            columns: ["Option", "Description"],
            rows: [
              ["-T0 to -T5", "Timing template — 0 is slowest/stealthiest, 5 is fastest, 3 is Nmap's own default"],
              ["--min-rate <n>", "Never send slower than this many packets/sec"],
              ["--max-rate <n>", "Never send faster than this many packets/sec"],
              ["--host-timeout <time>", "Give up on a host entirely after this long"],
              ["--max-retries <n>", "Cap retransmissions per probe — big time saver on lossy/large scans"],
              ["--scan-delay <time>", "Force a minimum delay between probes (useful for rate-limited targets)"],
              ["--min-parallelism <n>", "Floor on parallel probes — raise it if a scan feels too slow to converge"]
            ]
          },
          {
            title: "Output",
            type: "table",
            columns: ["Option", "Description"],
            rows: [
              ["-oN <file>", "Normal, human-readable output"],
              ["-oX <file>", "XML output — good for feeding into other tools"],
              ["-oG <file>", "Grepable output — handy for quick shell one-liners"],
              ["-oA <name>", "Save all three formats at once (.nmap / .xml / .gnmap)"],
              ["--append-output", "Append to existing output files instead of overwriting"],
              ["--resume <file>", "Resume a previous scan from its saved output file"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Quick external recon", cmd: "sudo nmap -T4 -F --min-rate 300 -n -Pn <target>\nnmap -sV -sC -p<open_ports> <target>\nnmap -oA recon_<target> <target>" },
              { label: "Full internal subnet sweep", cmd: "sudo nmap -sn 10.10.10.0/24 -oG live_hosts.txt\n# then, per live host:\nsudo nmap -p- -T4 -n -Pn <host> -oA fullscan_<host>" },
              { label: "Service & vulnerability enumeration", cmd: "nmap -sV -sC -p<open_ports> <target>\nnmap --script vuln -p<open_ports> <target>" },
              { label: "Stealthier timing profile", cmd: "sudo nmap -sS -T2 --min-parallelism 1 -p<ports> <target>" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "-sS, -sU, and -O all need raw-socket privileges — run with sudo, or Nmap silently falls back to a connect scan.",
              "UDP scanning is inherently slow and often ambiguous (open|filtered) — always narrow to specific/top ports first, never run a blind -p- UDP scan.",
              "-Pn is your default when a target's ICMP is filtered (very common on hardened hosts) — otherwise Nmap may report a live host as down.",
              "Port states worth remembering: open (something's listening), closed (reachable, nothing there), filtered (no response — probably a firewall), unfiltered (seen only with ACK-style probes, state undetermined).",
              "-sC runs the 'default' script category — it's broad but not exhaustive. Reach for --script <category> when you need something more targeted.",
              "Always save output (-oA at minimum) — you will want to grep back through a scan later, and re-running it isn't always cheap.",
              "Confirm you have written authorization for the target range before scanning anything you don't own."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Active Directory",
    tools: [
      {
        id: "netexec",
        name: "NetExec",
        url: "https://github.com/Pennyw0rth/NetExec",
        description: "Swiss-army knife for AD enumeration, credential validation, and lateral movement.",
        brief: "NetExec (nxc) is the actively maintained continuation of CrackMapExec — used to validate credentials, enumerate SMB/LDAP/WinRM/MSSQL, and move laterally across an Active Directory environment, all from one consistent command shape: nxc <protocol> <target> -u <user> -p <pass> [action flags].",
        quickReference: [
          { label: "Validate credentials across a subnet", cmd: "nxc smb 10.10.10.0/24 -u user -p pass" },
          { label: "List shares once creds are confirmed", cmd: "nxc smb <target> -u user -p pass --shares" },
          { label: "BloodHound collection over LDAP", cmd: "nxc ldap <dc> -u user -p pass -d domain.local --bloodhound -c All" },
          { label: "Password spray (one password, many users)", cmd: "nxc smb 10.10.10.0/24 -u users.txt -p 'Password1' --continue-on-success" },
          { label: "Run a command with valid creds", cmd: "nxc smb <target> -u user -p pass -x whoami" }
        ],
        sections: [
          {
            title: "SMB",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc smb <target> -u user -p pass", "Basic auth check — confirms creds work over SMB"],
              ["nxc smb <target> -u user -p pass --shares", "Enumerate accessible shares"],
              ["nxc smb <target> -u user -p pass --sessions", "List active sessions on the target"],
              ["nxc smb <target> -u user -p pass --loggedon-users", "List currently logged-on users"],
              ["nxc smb <target> -u user -p pass --sam", "Dump the local SAM database (needs local admin)"],
              ["nxc smb <target> -u user -p pass --lsa", "Dump LSA secrets (needs local admin)"],
              ["nxc smb <target> -u user -p pass -x \"whoami\"", "Execute a command on the target"],
              ["nxc smb <target> -u user -p pass --pass-pol", "Read the domain password policy — check this before spraying"]
            ]
          },
          {
            title: "WinRM",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc winrm <target> -u user -p pass", "Check whether the account can authenticate over WinRM"],
              ["nxc winrm <target> -u user -p pass -x \"whoami\"", "Execute a single command over WinRM"],
              ["evil-winrm -i <target> -u user -p pass", "For an actual interactive shell — nxc confirms access, evil-winrm gives you the session"]
            ]
          },
          {
            title: "LDAP",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc ldap <dc> -u user -p pass", "Basic bind check against the domain controller"],
              ["nxc ldap <dc> -u user -p pass --users", "Enumerate domain users"],
              ["nxc ldap <dc> -u user -p pass --groups", "Enumerate domain groups"],
              ["nxc ldap <dc> -u user -p pass --admin-count", "List accounts with adminCount=1 (current or former privileged accounts)"],
              ["nxc ldap <dc> -u user -p pass --trusted-for-delegation", "Find accounts trusted for unconstrained delegation"],
              ["nxc ldap <dc> -u user -p pass --asreproast out.txt", "AS-REP roast accounts with Kerberos pre-auth disabled"],
              ["nxc ldap <dc> -u user -p pass --kerberoasting out.txt", "Kerberoast accounts with an SPN set"]
            ]
          },
          {
            title: "MSSQL",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc mssql <target> -u user -p pass", "Check SQL auth (add --local-auth for a local SQL account rather than a domain one)"],
              ["nxc mssql <target> -u user -p pass -x \"whoami\"", "Execute a command via xp_cmdshell, if enabled"]
            ]
          },
          {
            title: "Password Spraying",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc smb <range> -u users.txt -p 'Password1' --continue-on-success", "Spray one password across many users — always add --continue-on-success or it stops at the first hit"],
              ["nxc smb <range> -u user -p passwords.txt", "The inverse — one user, many candidate passwords (use sparingly, lockout risk)"],
              ["nxc smb <range> -u users.txt -p passwords.txt --no-bruteforce", "Pair users.txt and passwords.txt line-by-line instead of trying every combination"]
            ]
          },
          {
            title: "Shares",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc smb <target> -u '' -p ''  --shares", "Check for shares reachable with blank/anonymous credentials"],
              ["nxc smb <target> -u user -p pass --shares", "List shares reachable with valid credentials"],
              ["smbclient //<target>/<share> -U user", "Actually browse a share's contents once you know it's accessible"]
            ]
          },
          {
            title: "Users & Groups",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc ldap <dc> -u user -p pass --users", "Enumerate all domain users"],
              ["nxc ldap <dc> -u user -p pass --groups", "Enumerate all domain groups"],
              ["nxc smb <target> -u user -p pass --rid-brute", "RID-cycle a target to enumerate users/groups even with limited LDAP access"]
            ]
          },
          {
            title: "BloodHound Collection",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc ldap <dc> -u user -p pass -d domain.local --bloodhound -c All", "Collect the full BloodHound dataset over LDAP"],
              ["--dns-server <ip>", "Point collection at a specific DNS server if the domain's default doesn't resolve for you"],
              [".zip output", "Collected data is written as a timestamped .zip — import it directly into BloodHound CE"]
            ]
          },
          {
            title: "Credential Validation",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["nxc smb <target> -u user -p pass", "Single credential check — quick pass/fail"],
              ["Green output", "Indicates the credential is valid"],
              ["(Pwn3d!)", "Appears when the account also has local admin on the target"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Initial credential validation", cmd: "nxc smb 10.10.10.0/24 -u user -p pass" },
              { label: "Enumerate once creds are confirmed", cmd: "nxc smb <target> -u user -p pass --shares\nnxc smb <target> -u user -p pass --sam\nnxc ldap <dc> -u user -p pass --users" },
              { label: "Spray, then validate the hit", cmd: "nxc smb 10.10.10.0/24 -u users.txt -p 'Season2026!' --continue-on-success\nnxc smb 10.10.10.0/24 -u <found_user> -p 'Season2026!' --shares" },
              { label: "BloodHound collection into analysis", cmd: "nxc ldap <dc> -u user -p pass -d domain.local --bloodhound -c All\n# import the resulting .zip into BloodHound CE, then run path-to-DA queries" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Always check --pass-pol before spraying — one wrong guess per account is fine, several isn't if the lockout threshold is low.",
              "--continue-on-success is easy to forget and will make a spray stop dead at the first valid hit — add it by default.",
              "NetExec is the maintained fork of CrackMapExec (cme) — same mental model, a handful of renamed flags.",
              "Combine LDAP enumeration output directly into BloodHound rather than reading it as a flat list — attack-path context is the whole point.",
              "Prefer --no-bruteforce with paired username:password files so you're not accidentally testing every combination against a locked-out-prone environment."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Command & Control",
    tools: [
      {
        id: "adaptix-c2",
        name: "Adaptix C2",
        url: "https://github.com/Adaptix-Framework/AdaptixC2",
        description: "Open-source, extensible command-and-control framework for red team operations.",
        brief: "Adaptix C2 is an open-source, extensible command-and-control framework built around a team server, configurable listeners, and generated agents (\"beacons\") that operators task from a shared console — a free alternative to commercial C2 platforms like Cobalt Strike.",
        quickReference: [
          { label: "Start the team server", cmd: "adaptixserver -profile profile.json" },
          { label: "Connect as an operator", cmd: "adaptixclient --connect <server>:<port>" },
          { label: "Add a listener", cmd: "Listeners > Add > choose HTTP/HTTPS/TCP" },
          { label: "Generate an agent", cmd: "Build > Agent > select listener + output format" },
          { label: "Task a beacon", cmd: "beacon> shell whoami" }
        ],
        sections: [
          {
            title: "Architecture",
            type: "table",
            columns: ["Component", "Description"],
            rows: [
              ["Team Server", "The central process agents call back to and operators connect to — holds all engagement state"],
              ["Listener", "Defines how an agent communicates with the team server — HTTP(S), TCP, or SMB, each with its own config"],
              ["Agent / Beacon", "The payload running on a compromised host, checking in on an interval defined at build/runtime"],
              ["Operator", "A user connected to the team server with permission to view and task agents"],
              ["Profile", "A config file (traffic shaping, ports, certs) the team server starts with"]
            ]
          },
          {
            title: "Listeners",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["HTTP(S) listener", "Most common — blends with normal web traffic, supports custom headers/URIs for traffic shaping"],
              ["TCP listener", "Used for peer-to-peer agent chaining/pivoting rather than direct external callbacks"],
              ["Redirector", "A reverse proxy sitting in front of the listener so the team server's real address is never exposed directly"],
              ["Traffic shaping", "Customizing headers, URIs, and response profiles so beacon traffic doesn't look default/templated"]
            ]
          },
          {
            title: "Payloads",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Output formats", "Agents can typically be generated as EXE, DLL, service binary, or raw shellcode depending on the delivery method"],
              ["Staged vs. stageless", "Staged payloads pull the full agent after initial execution; stageless embed everything up front — tradeoff between initial payload size and callback footprint"],
              ["Listener binding", "Each generated agent is tied to a specific listener at build time"],
              ["Sleep / jitter", "Callback interval and randomization, configurable at build time and adjustable later from the beacon console"]
            ]
          },
          {
            title: "Operators",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Multi-operator support", "Several operators can connect to the same team server at once, sharing visibility into agents and logs"],
              ["Shared session log", "Tasking and output from any operator is visible to the rest of the team — useful for deconfliction on an engagement"]
            ]
          },
          {
            title: "Beacons & Tasking",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["shell <cmd>", "Run a shell command on the compromised host"],
              ["cd <path>", "Change the beacon's working directory"],
              ["ls / dir", "List files in the current directory"],
              ["download <path>", "Pull a file back to the team server"],
              ["upload <local> <remote>", "Push a file to the compromised host"],
              ["sleep <seconds> <jitter%>", "Adjust the beacon's check-in interval and jitter"],
              ["exit", "Terminate the beacon"]
            ]
          },
          {
            title: "OPSEC Notes",
            type: "table",
            columns: ["Consideration", "Description"],
            rows: [
              ["Sleep & jitter", "Set both to something that resembles normal background traffic for the environment, not the defaults"],
              ["Redirectors", "Never expose the team server directly — front every listener with a redirector"],
              ["Payload variation", "Reuse of identical payload signatures across engagements is an easy detection/attribution vector"],
              ["Cleanup", "Tear down listeners and remove agents at the end of an engagement — don't leave infrastructure live"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Stand up a listener and generate a payload", cmd: "# 1. Start the team server\nadaptixserver -profile profile.json\n# 2. Connect as an operator\nadaptixclient --connect <server>:<port>\n# 3. Listeners > Add > HTTP(S), configure host/URI\n# 4. Build > Agent > select the listener, choose output format\n# 5. Deliver the generated agent to the target" },
              { label: "Task an active beacon", cmd: "# In the operator console:\n# 1. Select the checked-in beacon\n# 2. beacon> shell whoami\n# 3. beacon> ls\n# 4. beacon> download <interesting_file>" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Use only against systems you own or are explicitly authorized to test as part of a scoped engagement.",
              "Treat every generated agent like any other payload — build and test it in a controlled environment first.",
              "Document and tear down all listener/redirector infrastructure at the end of an engagement.",
              "Default sleep/jitter values are a starting point, not an OPSEC strategy — tune them to the environment."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "OSINT",
    tools: [
      {
        id: "hunter-io",
        name: "Hunter.io",
        url: "https://hunter.io/",
        description: "Discovers a company's email naming convention and verifies specific addresses.",
        brief: "Hunter.io is a web-based OSINT tool for figuring out how an organization structures its email addresses and checking whether a specific address is real — useful groundwork before any phishing-risk assessment or further people-focused recon.",
        quickReference: [
          { label: "Learn a domain's email pattern", cmd: "hunter.io/domain-search — enter a domain" },
          { label: "Guess a specific person's address", cmd: "hunter.io/email-finder — enter a name + domain" },
          { label: "Check if an address is real", cmd: "hunter.io/email-verifier — enter the address" },
          { label: "Same lookups via API", cmd: "api.hunter.io/v2/domain-search?domain=example.com&api_key=<key>" }
        ],
        sections: [
          {
            title: "Domain Search",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["What it returns", "The dominant email pattern for a domain (e.g. {first}.{last}@), a list of discovered addresses, and their sources"],
              ["Confidence per result", "Each discovered address includes a confidence score based on where it was found"],
              ["Typical use", "Run this first, before anything else — it tells you the naming convention everything else relies on"]
            ]
          },
          {
            title: "Email Finder",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Input required", "A person's name plus the target domain"],
              ["Output", "A best-guess address built from the domain's known pattern, plus a confidence score"],
              ["Limitation", "It's a pattern-based guess, not a confirmed mailbox — verify before relying on it"]
            ]
          },
          {
            title: "Email Verifier",
            type: "table",
            columns: ["Status", "Meaning"],
            rows: [
              ["valid", "The address is confirmed deliverable"],
              ["invalid", "The address does not exist"],
              ["accept-all", "The domain's mail server accepts everything — a specific address can't be confirmed this way"],
              ["unknown", "Verification was inconclusive"]
            ]
          },
          {
            title: "Confidence Scores",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["What the score means", "How reliable the sources are that this specific address is correct — not a guarantee"],
              ["Low-confidence hits", "Cross-verify through a second method (e.g. company site, LinkedIn) before using in a report"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Typical OSINT workflow", cmd: "1. Domain Search on the target domain — learn the naming pattern\n2. Email Finder for each named person of interest\n3. Email Verifier on every candidate address\n4. Cross-check names against LinkedIn / the company site" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The free tier has a monthly search limit — budget lookups instead of burning them on exploratory queries.",
              "Treat every result as a lead, not a confirmed contact — verify through a second method before it goes in a report.",
              "An accept-all domain makes verification unreliable by nature — flag this explicitly rather than reporting a confidence score at face value."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Web Application",
    tools: [
      {
        id: "ffuf",
        name: "FFUF",
        url: "https://github.com/ffuf/ffuf",
        description: "Fast web fuzzer for directories, virtual hosts, and parameters.",
        brief: "ffuf (Fuzz Faster U Fool) is a fast, flexible, Go-based fuzzer — the go-to for directory/file discovery, virtual host discovery, and parameter fuzzing against a web target, all using the same FUZZ-keyword syntax.",
        quickReference: [
          { label: "Directory/file discovery", cmd: "ffuf -w wordlist.txt -u https://target.com/FUZZ" },
          { label: "Virtual host discovery", cmd: "ffuf -w subdomains.txt -u https://target.com -H \"Host: FUZZ.target.com\"" },
          { label: "Parameter fuzzing", cmd: "ffuf -w wordlist.txt -u \"https://target.com/?FUZZ=test\"" },
          { label: "Cut a repeated false-positive response", cmd: "ffuf -w wordlist.txt -u https://target.com/FUZZ -fs <size>" }
        ],
        sections: [
          {
            title: "Directory Discovery",
            type: "table",
            columns: ["Flag / Example", "Description"],
            rows: [
              ["-u https://target.com/FUZZ", "Base directory/file discovery"],
              ["-e .php,.txt,.bak", "Append extensions to each wordlist entry"],
              ["-t 100", "Set thread count (default 40) — raise carefully, watch for rate limiting"],
              ["-recursion", "Automatically re-fuzz inside directories that return a hit (see Recursive Fuzzing)"]
            ]
          },
          {
            title: "Virtual Hosts",
            type: "table",
            columns: ["Flag / Example", "Description"],
            rows: [
              ["-u https://target.com -H \"Host: FUZZ.target.com\"", "Fuzz the Host header to find virtual hosts sharing one IP"],
              ["Baseline comparison", "Check the response for an obviously-wrong hostname first — a wildcard/default vhost often returns the same response for everything, so real hits are the ones that differ"]
            ]
          },
          {
            title: "Parameters",
            type: "table",
            columns: ["Flag / Example", "Description"],
            rows: [
              ["-u \"https://target.com/?FUZZ=test\"", "Fuzz GET parameter names"],
              ["-u \"https://target.com/?id=FUZZ\"", "Fuzz a known parameter's value"],
              ["-X POST -d \"user=FUZZ&pass=test\"", "Fuzz inside a POST body"]
            ]
          },
          {
            title: "Recursive Fuzzing",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-recursion", "Automatically fuzz inside any directory that returns a hit"],
              ["-recursion-depth <n>", "Cap how many levels deep recursion goes"],
              ["Caution", "Scan time grows fast with recursion on a large wordlist — start shallow"]
            ]
          },
          {
            title: "Filters",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-fc <codes>", "Filter OUT specific response status codes"],
              ["-fs <size>", "Filter OUT responses of a specific size (the classic \"kill the false-positive 404 page\" flag)"],
              ["-fw <count>", "Filter OUT responses with a specific word count"],
              ["-fl <count>", "Filter OUT responses with a specific line count"]
            ]
          },
          {
            title: "Matchers",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-mc <codes>", "Match ONLY specific status codes (default: 200-299,301,302,307,401,403,405)"],
              ["-ms <size>", "Match ONLY a specific response size"],
              ["-mr <regex>", "Match ONLY responses whose body matches a regex"]
            ]
          },
          {
            title: "Auto Calibration",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-ac", "Auto-detect and filter likely false-positive responses (wildcard/catch-all pages) instead of manually figuring out -fs/-fc"]
            ]
          },
          {
            title: "Wordlist Usage",
            type: "table",
            columns: ["Flag / Example", "Description"],
            rows: [
              ["-w wordlist.txt", "Single wordlist, keyword defaults to FUZZ"],
              ["-w list1.txt:FUZZ1 -w list2.txt:FUZZ2", "Multiple wordlists with distinct keywords, e.g. for combined vhost + path fuzzing"],
              ["SecLists cross-reference", "Discovery/Web-Content/ and Discovery/DNS/ from SecLists are the usual default wordlist source"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Initial directory sweep", cmd: "ffuf -w common.txt -u https://target.com/FUZZ\n# note the baseline 404 size, then:\nffuf -w common.txt -u https://target.com/FUZZ -fs <baseline_size>\n# once a stack is confirmed, re-run with matching extensions:\nffuf -w common.txt -u https://target.com/FUZZ -e .php,.bak" },
              { label: "Recursive enumeration", cmd: "ffuf -w common.txt -u https://target.com/FUZZ -recursion -recursion-depth 2" },
              { label: "Parameter discovery on a found endpoint", cmd: "ffuf -w params.txt -u \"https://target.com/page?FUZZ=test\"\n# once a real param is found:\nffuf -w values.txt -u \"https://target.com/page?found_param=FUZZ\"" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Add -p <seconds> to throttle requests if you start tripping a WAF or getting blocked mid-scan.",
              "Always check what a 'normal' 404/catch-all response looks like before trusting -mc or -fc results blindly.",
              "Save output with -o results.json -of json so you can diff results between runs later.",
              "-ac is a good default starting point on unfamiliar targets; drop to manual -fs/-fc once you understand the baseline."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Forensics / Reverse Engineering",
    tools: [
      {
        id: "ida-free",
        name: "IDA Free",
        url: "https://hex-rays.com/ida-free/",
        description: "Disassembler for static analysis of 32/64-bit binaries, free tier.",
        brief: "IDA is one of the most established disassemblers. The free tier covers static disassembly of 32/64-bit binaries — no debugger, no Hex-Rays pseudocode decompiler, but plenty for orienting yourself in an unfamiliar binary.",
        quickReference: [
          { label: "Load a binary", cmd: "File > Open  (let auto-analysis finish before doing anything else)" },
          { label: "Jump to strings", cmd: "Shift+F12  — fastest way to orient in an unfamiliar binary" },
          { label: "Cross-references to a selection", cmd: "X" },
          { label: "Toggle graph / linear view", cmd: "Space" }
        ],
        sections: [
          {
            title: "Interface Layout",
            type: "table",
            columns: ["Pane", "Description"],
            rows: [
              ["Functions window", "Every function IDA recognized — the main index into the binary"],
              ["Strings window", "Every printable string embedded in the binary — often the fastest orientation point"],
              ["Hex view", "Raw byte view alongside disassembly, synced to the current address"],
              ["Graph view", "Disassembly rendered as basic blocks connected by branches"],
              ["Output window", "IDA's own log — analysis progress, script output, errors"]
            ]
          },
          {
            title: "Functions",
            type: "table",
            columns: ["Action", "Description"],
            rows: [
              ["Functions window", "Lists every recognized function by name/address — double-click to jump to it"],
              ["N", "Rename the function or variable under the cursor — do this as you go, not at the end"],
              ["Likely entry points", "Look for main, WinMain, or DllMain first — everything else usually branches from there"]
            ]
          },
          {
            title: "Strings",
            type: "table",
            columns: ["Action", "Description"],
            rows: [
              ["Shift+F12", "Open the Strings window"],
              ["Filter box", "Search/filter the string list by substring"],
              ["Pivot via xref", "Double-click a suspicious string, then X to jump back into the code that references it"]
            ]
          },
          {
            title: "Cross References",
            type: "table",
            columns: ["Action", "Description"],
            rows: [
              ["X", "Show all references TO the selected function or variable"],
              ["Ctrl+X", "Alternate xref view (depending on IDA version/context)"],
              ["Reading the xref list", "Shows every caller of a function or every use of a variable — the fastest way to understand how something is actually used"]
            ]
          },
          {
            title: "Graph View",
            type: "table",
            columns: ["Action", "Description"],
            rows: [
              ["Basic blocks", "Each box is a straight-line block of instructions; arrows are branches"],
              ["Collapse / expand node", "Right-click a node to collapse it and reduce visual noise in a large function"],
              ["When to switch to linear view", "Tight loops or dense data blobs are usually easier to read as plain linear disassembly (Space toggles this)"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Static analysis workflow", cmd: "1. Load the binary, let auto-analysis finish\n2. Check the Strings window for anything suspicious\n3. Pivot via xrefs (X) into the function that uses it\n4. Rename functions/variables as you understand them\n5. Note: free tier has no F5 pseudocode — read raw disassembly" },
              { label: "Reverse engineering workflow", cmd: "1. Identify the entry point (main/WinMain/DllMain)\n2. Trace major control flow in Graph view\n3. Flag calls to interesting APIs (network, file, registry)\n4. Cross-reference each flagged call to see where it's invoked from\n5. Document findings function-by-function as you go" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The free tier has no debugger and no Hex-Rays decompiler — disassembly and static analysis only.",
              "Rename functions and variables as you go — future-you (or whoever you hand the analysis to) will thank you.",
              "If a task genuinely needs a decompiler or a debugger, Ghidra is a solid free fallback for that specific step."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Wordlists",
    tools: [
      {
        id: "seclists",
        name: "SecLists",
        url: "https://github.com/danielmiessler/SecLists",
        description: "The wordlist collection nearly every fuzzing tool ends up pointing at.",
        brief: "SecLists is the wordlist collection nearly every fuzzing and brute-force tool ends up pointing at — usernames, passwords, discovery paths, DNS, and fuzzing payload seeds, all grouped by purpose in one repo.",
        quickReference: [
          { label: "Clone the repo", cmd: "git clone https://github.com/danielmiessler/SecLists.git" },
          { label: "Default web discovery list", cmd: "SecLists/Discovery/Web-Content/common.txt" },
          { label: "Default password list", cmd: "SecLists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt" },
          { label: "Default subdomain list", cmd: "SecLists/Discovery/DNS/subdomains-top1million-5000.txt" }
        ],
        sections: [
          {
            title: "Discovery Lists",
            type: "table",
            columns: ["Path", "Description"],
            rows: [
              ["Discovery/Web-Content/", "Directory and file brute-forcing wordlists"],
              ["Discovery/DNS/", "Subdomain brute-forcing wordlists"],
              ["Discovery/SNMP/", "Common SNMP community strings"]
            ]
          },
          {
            title: "Web Content Lists",
            type: "table",
            columns: ["Path", "Description"],
            rows: [
              ["common.txt", "General-purpose default — good first pass"],
              ["quickhits.txt", "Small, low-noise, fast pass"],
              ["raft-small/-medium/-large-directories.txt", "Bigger lists, in order of size/time tradeoff"],
              ["raft-large-files.txt", "Common filenames rather than directories"]
            ]
          },
          {
            title: "DNS Lists",
            type: "table",
            columns: ["Path", "Description"],
            rows: [
              ["subdomains-top1million-5000.txt", "Fast, good default subdomain list"],
              ["subdomains-top1million-20000.txt", "Bigger, slower, more coverage"],
              ["namelist.txt", "Broader general-purpose DNS wordlist"]
            ]
          },
          {
            title: "Usernames",
            type: "table",
            columns: ["Path", "Description"],
            rows: [
              ["Usernames/Names/names.txt", "Common first/last names — good for generating username permutations"],
              ["Usernames/top-usernames-shortlist.txt", "Small, high-hit-rate default account names"],
              ["Usernames/cirt-default-usernames.txt", "Known vendor default usernames"]
            ]
          },
          {
            title: "Passwords",
            type: "table",
            columns: ["Path", "Description"],
            rows: [
              ["Passwords/Leaked-Databases/rockyou.txt", "The classic — huge, real-world leaked password corpus"],
              ["Passwords/Common-Credentials/", "Smaller curated common-password lists"],
              ["Passwords/Default-Credentials/", "Known vendor default username:password pairs"]
            ]
          },
          {
            title: "Fuzzing Lists",
            type: "table",
            columns: ["Path", "Description"],
            rows: [
              ["Fuzzing/", "General-purpose fuzzing payload seeds for input-handling tests"],
              ["Fuzzing/big-list-of-naughty-strings.txt", "Edge-case strings (unicode, encoding, format issues) for input validation testing"]
            ]
          },
          {
            title: "Recommended Lists",
            type: "table",
            columns: ["If you only grab three", "Use it for"],
            rows: [
              ["Discovery/Web-Content/common.txt", "Directory/file brute-forcing"],
              ["Passwords/Leaked-Databases/rockyou.txt", "Password cracking/spraying"],
              ["Discovery/DNS/subdomains-top1million-5000.txt", "Subdomain enumeration"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Typical workflow", cmd: "git clone https://github.com/danielmiessler/SecLists.git\n# pick list size based on time budget — start small, escalate if nothing hits\nffuf -w SecLists/Discovery/Web-Content/common.txt -u https://target.com/FUZZ\n# escalate:\nffuf -w SecLists/Discovery/Web-Content/raft-large-directories.txt -u https://target.com/FUZZ" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Bigger isn't always better — a huge wordlist against a slow endpoint can take hours; start small and escalate only if needed.",
              "Keep the repo updated (git pull) — lists get added and revised over time.",
              "Combine two lists with separate keywords (e.g. -w users.txt:USER -w passwords.txt:PASS) where the target tool supports it."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Wireless Security",
    tools: [
      {
        id: "aircrack-ng",
        name: "Aircrack-ng Suite",
        url: "https://www.aircrack-ng.org/",
        description: "WiFi auditing suite — capture, handshake collection, and WPA/WPA2 cracking.",
        brief: "Aircrack-ng is a suite of tools for auditing WiFi networks — monitor-mode capture, handshake collection, deauthentication, and offline WPA/WPA2 key cracking, all working off the same .cap capture files.",
        quickReference: [
          { label: "Enable monitor mode", cmd: "airmon-ng start wlan0" },
          { label: "Capture and scan for targets", cmd: "airodump-ng wlan0mon" },
          { label: "Deauth a client (forces a handshake)", cmd: "aireplay-ng --deauth 5 -a <bssid> wlan0mon" },
          { label: "Crack a captured handshake", cmd: "aircrack-ng -w wordlist.txt -b <bssid> capture.cap" }
        ],
        sections: [
          {
            title: "Monitor Mode",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["airmon-ng check kill", "Kill processes that tend to interfere with monitor mode (NetworkManager, wpa_supplicant)"],
              ["airmon-ng start wlan0", "Put the adapter into monitor mode (usually creates wlan0mon)"],
              ["airmon-ng stop wlan0mon", "Revert the adapter back to managed mode when done"]
            ]
          },
          {
            title: "Capture",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["airodump-ng wlan0mon", "General scan — lists nearby networks and connected clients"],
              ["airodump-ng -c <ch> --bssid <bssid> -w capture wlan0mon", "Targeted capture on one network/channel, written to a file"],
              ["Reading the output", "BSSID / PWR / CH / ENC / ESSID columns identify the network; the station table below shows connected clients"]
            ]
          },
          {
            title: "Handshake Collection",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Targeted airodump-ng capture", "Leave a targeted capture running while waiting for a client to (re)connect"],
              ["WPA handshake indicator", "airodump-ng shows a handshake notice in the top-right once one is captured"],
              ["aircrack-ng capture.cap -b <bssid>", "Quick check on an existing capture file to confirm a handshake is actually present"]
            ]
          },
          {
            title: "WPA/WPA2 Cracking",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["aircrack-ng -w wordlist.txt -b <bssid> capture.cap", "Offline dictionary attack against a captured handshake"],
              ["hcxpcapngtool -o hash.hc22000 capture.cap", "Convert a capture for GPU-accelerated cracking with hashcat instead"],
              ["Feasibility caveat", "This only works against dictionary-guessable passphrases — a strong passphrase makes the whole approach impractical"]
            ]
          },
          {
            title: "Deauthentication",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["aireplay-ng --deauth 5 -a <bssid> wlan0mon", "Deauth every client on a network — forces reconnects, useful for capturing a handshake"],
              ["aireplay-ng --deauth 5 -a <bssid> -c <client_mac> wlan0mon", "Deauth one specific client instead of the whole network"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Full handshake-and-crack workflow", cmd: "airmon-ng check kill\nairmon-ng start wlan0\nairodump-ng wlan0mon\n# note the target BSSID + channel, then:\nairodump-ng -c <ch> --bssid <bssid> -w capture wlan0mon\n# in a second terminal, force a reconnect:\naireplay-ng --deauth 5 -a <bssid> wlan0mon\n# once the handshake is confirmed captured:\naircrack-ng -w wordlist.txt -b <bssid> capture.cap" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Only test networks you own or have explicit written authorization to test — deauthing or cracking a network without authorization is illegal in most jurisdictions.",
              "Requires a wireless adapter whose chipset supports both monitor mode and packet injection — not all of them do.",
              "This cracking approach targets WPA/WPA2-PSK specifically — WPA3's SAE handshake isn't vulnerable to the same offline dictionary attack.",
              "Cracking feasibility depends entirely on the passphrase being weak or dictionary-guessable — a strong passphrase makes this impractical regardless of wordlist size."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Vulnerability Scanning",
    tools: [
      {
        id: "nessus",
        name: "Nessus",
        url: "https://www.tenable.com/products/nessus",
        description: "Vulnerability scanner for CVEs, misconfigurations, and missing patches.",
        brief: "Nessus is a vulnerability scanner used to identify known CVEs, misconfigurations, and missing patches across a network. Credentialed scans (with valid local auth) return dramatically more accurate results than remote-only checks — get creds into scope whenever the engagement allows it.",
        quickReference: [
          { label: "Default general-purpose scan", cmd: "Scan Templates > Basic Network Scan" },
          { label: "Best results, whenever you have creds", cmd: "Add credentials under the scan's Credentials tab (Credentialed Scan)" },
          { label: "Benchmark-based audits (CIS, STIG, etc.)", cmd: "Scan Templates > Compliance Scan" },
          { label: "Triage results fast", cmd: "Review by Plugin Family first, before drilling into individual hosts" }
        ],
        sections: [
          {
            title: "Scan Templates",
            type: "table",
            columns: ["Template", "Description"],
            rows: [
              ["Basic Network Scan", "General-purpose default — host discovery, common services, default plugin set"],
              ["Advanced Scan", "Full manual control over every scan setting and plugin family"],
              ["Credentialed Patch Audit", "Authenticated, patch-focused scan against local vulnerabilities"],
              ["Compliance Scan", "Benchmark/policy-based (CIS, DISA STIG, PCI-DSS, etc.)"],
              ["Web Application Tests", "Basic web-focused checks — not a substitute for manual/Burp-style testing"]
            ]
          },
          {
            title: "Basic Network Scan",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Coverage", "Host discovery plus common port/service checks against the default plugin set"],
              ["Typical use", "A fast first pass across an unfamiliar network before deciding where to go deeper"]
            ]
          },
          {
            title: "Advanced Scan",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Plugin family selection", "Full manual control over which plugin families are in/out of scope"],
              ["Custom port ranges", "Scope the scan to exactly the ports relevant to the engagement"],
              ["Timing/performance tuning", "Adjust scan aggressiveness for fragile or bandwidth-constrained networks"]
            ]
          },
          {
            title: "Credentialed Scan",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Credentials supplied", "SSH, SMB/Windows, database, or other local auth, set under the scan's Credentials tab"],
              ["Why it matters", "Local checks (installed packages, patch level) are far more accurate than remote version-guessing"],
              ["Setup", "Store credentials once in Tenable's credential manager, reuse across scan policies"]
            ]
          },
          {
            title: "Compliance Scan",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Benchmark selection", "Choose a standard like CIS Level 1/2 or DISA STIG at scan setup"],
              ["Reporting style", "Pass/fail per control, not a CVE list — built for audits rather than pentests"]
            ]
          },
          {
            title: "Plugin Families",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["What a family groups", "Related plugins under one label, e.g. \"Windows\", \"Web Servers\", \"Default Unix Accounts\""],
              ["Scoping a scan", "Enable/disable whole families to focus a scan or cut noise/runtime"],
              ["Why triage by family first", "Skimming by family surfaces patterns (e.g. \"every host missing the same patch\") far faster than reading findings host-by-host"]
            ]
          },
          {
            title: "Policies",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Policy vs. scan", "A policy is a reusable saved configuration; a scan is a specific run using one"],
              ["Common practice", "Maintain a standing \"default internal\" and \"default external\" policy rather than reconfiguring every time"]
            ]
          },
          {
            title: "Reports",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Export formats", "HTML, PDF, CSV, or Nessus's native format"],
              ["Severity breakdown", "Critical / High / Medium / Low / Info"],
              ["Filtering", "Filter the report view by plugin family or by host before exporting"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Running a credentialed internal scan", cmd: "1. New Scan > Basic Network Scan\n2. Credentials tab > add SSH/SMB creds\n3. Set scope to the internal range\n4. Launch\n5. Once complete, triage by Plugin Family first" },
              { label: "Compliance audit workflow", cmd: "1. New Scan > Compliance Scan\n2. Select the benchmark (e.g. CIS Level 1)\n3. Add credentials\n4. Run against in-scope hosts\n5. Export the pass/fail report for the audit record" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Credentialed scans return far more accurate results than remote-only checks — prioritize getting valid creds into scope wherever the engagement allows it.",
              "Keep the plugin feed updated; a stale feed misses recently disclosed vulnerabilities entirely.",
              "Spot-check a handful of findings manually before including them in a report — automated scanners do produce false positives.",
              "Heavy/aggressive scans can impact fragile or legacy systems — plan scan windows and throttling on production networks."
            ]
          }
        ]
      }
    ]
  }
];
