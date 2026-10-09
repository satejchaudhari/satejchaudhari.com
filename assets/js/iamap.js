/*
  INITIAL ACCESS — data for initial-access.html (rendered by iamap-main.js).

  A red-team playbook of initial-access vectors: how an external attacker turns
  reconnaissance into a first foothold. Organised by vector (web, remote
  services, credentials, network/adjacent, wireless, physical, removable/
  hardware, supply chain, drive-by, cloud/SaaS) and mapped to MITRE ATT&CK's
  Initial Access tactic (TA0001) where it applies. Picks up where the OSINT
  workflow leaves off and hands off to privilege escalation / the AD map.

  MODEL (same shape as webmap.js / osintmap.js):
    IA_MAP = { meta:{title,note}, sections:[ {id,title,color,tag,desc,
      groups:[ {id,title,scenario,items:[ {text,desc,
        tools:[{n,id?,url?}], vulns:[{n,id?,url?}] } ]} ]} ] }

  tools: id -> toolkit entry, url -> external, neither -> placeholder.
  vulns: id -> vuln-detail entry, url -> page/reference, neither -> placeholder.
  Edit THIS file for content; never edit iamap-main.js.
*/

var IA_MAP = {
  meta: {
    title: "Initial Access",
    note: "Red-team initial-access vectors, from recon hand-off to first foothold."
  },
  sections: [

    /* ------------------------------------------------------------------ */
    {
      id: "bridge",
      title: "From Recon to Access",
      color: "#22d3ee",
      tag: "Hand-off",
      desc: "Turn the OSINT picture into an access plan — pick vectors by what the attack surface actually exposes.",
      groups: [
        {
          id: "br-plan",
          title: "Choose the vector",
          scenario: "after reconnaissance — before launching anything.",
          items: [
            { text: "Inventory the exposed attack surface", desc: "Web apps, remote-access portals, email, wireless, people and physical sites found in recon.", vulns: [ { n: "OSINT Workflow", url: "osint-map.html" } ] },
            { text: "Rank vectors by likelihood and noise", desc: "Prefer the quietest path that works — credentials and phishing before loud exploitation." },
            { text: "Prepare delivery and C2 infrastructure first", desc: "Redirectors, mail infra, payloads and listeners ready before you touch the target.", vulns: [ { n: "C2 Frameworks", url: "theory/2026-09-23-command-and-control.html" } ] },
            { text: "Confirm the vector is in scope", desc: "Phishing, physical and wireless each need explicit authorisation in the RoE." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "phishing",
      title: "Phishing & Social Engineering",
      color: "#fb7185",
      tag: "T1566",
      desc: "The most common real-world entry point — get a human to run code or give up credentials.",
      groups: [
        {
          id: "ph-email",
          title: "Email phishing",
          scenario: "when email reaches users and you have addresses from recon.",
          items: [
            { text: "Spearphishing attachment", desc: "A lure document / container that delivers a payload (see Payload Delivery).", tools: [ { n: "GoPhish", id: "gophish" } ] },
            { text: "Spearphishing link (credential harvest)", desc: "Cloned login page capturing credentials; pretext tuned to the target.", tools: [ { n: "GoPhish", id: "gophish" } ] },
            { text: "Pretext / BEC without a payload", desc: "Pure social engineering — invoice fraud, HR/IT impersonation, urgency." },
            { text: "Warm up and authenticate the sending infra", desc: "SPF/DKIM/DMARC-aligned domains and aged senders to clear mail filtering." }
          ]
        },
        {
          id: "ph-modern",
          title: "MFA & modern phishing",
          scenario: "against targets protected by MFA or cloud identity.",
          items: [
            { text: "Adversary-in-the-middle (reverse proxy)", desc: "Relay the real login to steal the session cookie, defeating most MFA.", tools: [ { n: "Evilginx", url: "https://github.com/kgretzky/evilginx2" } ] },
            { text: "OAuth / app-consent phishing", desc: "Trick the user into granting a malicious app token-based access to their account." },
            { text: "Device-code phishing", desc: "Abuse the OAuth device-authorisation flow to get the user to authorise your device." },
            { text: "MFA fatigue / push bombing", desc: "Repeated push prompts until the user approves one." },
            { text: "QR-code phishing (quishing) and callback (TOAD)", desc: "Move the lure off-email via QR codes or a phone-callback pretext to dodge filters." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "web",
      title: "Public-Facing Web Applications",
      color: "#38bdf8",
      tag: "T1190",
      desc: "Exploit an internet-facing app or appliance to run code or reach internal systems.",
      groups: [
        {
          id: "we-enum",
          title: "Enumerate & fingerprint",
          scenario: "once recon surfaced live web apps, APIs or appliances.",
          items: [
            { text: "Fingerprint stack and versions", desc: "Product and version drive which known CVEs apply.", tools: [ { n: "whatweb", id: "whatweb" }, { n: "wpscan", id: "wpscan" }, { n: "nuclei", id: "nuclei" } ] },
            { text: "Content & endpoint discovery", desc: "Hidden panels, admin, APIs, backups and dev hosts.", tools: [ { n: "ffuf", id: "ffuf" }, { n: "gobuster", id: "gobuster" }, { n: "katana", id: "katana" } ] },
            { text: "Scan for known vulnerabilities", desc: "Template-based checks for exposed CVEs and misconfigs.", tools: [ { n: "nuclei", id: "nuclei" }, { n: "Burp Suite", id: "burpsuite" } ] }
          ]
        },
        {
          id: "we-exploit",
          title: "Exploit to code / data",
          scenario: "when a specific weakness is confirmed.",
          items: [
            { text: "SQL injection to data or RCE", desc: "Dump creds, or stack/xp_cmdshell/INTO OUTFILE to execution.", tools: [ { n: "sqlmap", id: "sqlmap" } ], vulns: [ { n: "SQL Injection", id: "sqli" } ] },
            { text: "File upload to web shell", desc: "Upload an executable handler and browse to it for code execution.", vulns: [ { n: "File Upload", id: "file-upload" } ] },
            { text: "Insecure deserialization", desc: "Crafted serialized object into a gadget chain for RCE.", vulns: [ { n: "Deserialization", id: "insecure-deserialization" } ] },
            { text: "Template / command injection", desc: "SSTI and OS command injection break straight to the shell.", vulns: [ { n: "SSTI", id: "ssti" }, { n: "Command Injection", id: "command-injection" } ] },
            { text: "SSRF to cloud metadata / internal", desc: "Reach the metadata service for cloud credentials, or pivot internally.", vulns: [ { n: "SSRF", id: "ssrf" } ] },
            { text: "Path traversal / LFI and XXE", desc: "Read secrets and config, sometimes chaining to RCE.", vulns: [ { n: "Path Traversal", id: "path-traversal" }, { n: "XXE", id: "xxe" } ] },
            { text: "Auth bypass / default creds on panels", desc: "Admin panels and appliances with weak or default authentication.", vulns: [ { n: "Auth Bypass", id: "auth-bypass" }, { n: "Default Credentials", id: "default-credentials" } ] },
            { text: "Exposed source / backups / secrets", desc: "Leaked repos, .git, backups and config give creds and code paths.", vulns: [ { n: "Exposed Source & Backups", id: "exposed-source-backups" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "remote",
      title: "External Remote Services",
      color: "#2dd4bf",
      tag: "T1133",
      desc: "Log in to internet-facing remote-access services — VPN, RDP, SSH, Citrix, webmail.",
      groups: [
        {
          id: "rm-enum",
          title: "Find the portals",
          scenario: "when recon shows remote-access or management interfaces exposed.",
          items: [
            { text: "Enumerate exposed services", desc: "VPN, RDP, SSH, Citrix, OWA/Exchange, VNC, management and database ports.", tools: [ { n: "nmap", id: "nmap" } ] },
            { text: "Check appliances against known CVEs", desc: "VPN/Citrix/Exchange edge devices are heavily targeted pre-auth chains.", tools: [ { n: "nuclei", id: "nuclei" } ], vulns: [ { n: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" } ] }
          ]
        },
        {
          id: "rm-access",
          title: "Authenticate in",
          scenario: "once you have candidate credentials or a sprayable portal.",
          items: [
            { text: "Password spray the portal", desc: "A few common passwords across many users to avoid lockout.", tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ] },
            { text: "Use valid accounts from recon / breaches", desc: "Reused or leaked credentials logged straight into VPN/RDP/webmail.", vulns: [ { n: "Valid Accounts — see Credentials", url: "initial-access.html#creds" } ] },
            { text: "Abuse self-service and SSO portals", desc: "Password-reset, enrolment and federation flows that leak access." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "creds",
      title: "Valid Accounts & Credentials",
      color: "#fbbf24",
      tag: "T1078",
      desc: "The quietest vector — just log in with credentials you obtained rather than exploiting anything.",
      groups: [
        {
          id: "cr-obtain",
          title: "Obtain credentials",
          scenario: "built from OSINT, breaches, phishing or exposed secrets.",
          items: [
            { text: "Reuse breach / combolist credentials", desc: "Credentials exposed in dumps, matched to the target's users and portals." },
            { text: "Harvest keys and tokens from public code", desc: "API keys, cloud creds and tokens committed to repos." },
            { text: "Capture session cookies / tokens", desc: "AiTM phishing or info-stealer logs yield live sessions that skip MFA." }
          ]
        },
        {
          id: "cr-use",
          title: "Spray & validate",
          scenario: "to turn candidate credentials into working access without lockouts.",
          items: [
            { text: "Password spray carefully", desc: "One password across all users, spaced to respect lockout thresholds.", tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ] },
            { text: "Try default and vendor credentials", desc: "Appliances, panels and databases shipped with known logins.", vulns: [ { n: "Default Credentials", id: "default-credentials" } ] },
            { text: "Validate access and map what it unlocks", desc: "Which services, mailboxes and apps the account can reach.", tools: [ { n: "netexec", id: "netexec" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "network",
      title: "Network & Adjacent Access",
      color: "#60a5fa",
      tag: "On-net",
      desc: "Once on (or next to) the internal network — via drop box, rogue device or assumed breach — abuse L2/L3 trust.",
      groups: [
        {
          id: "nw-onwire",
          title: "Get on the wire",
          scenario: "with physical or adjacent access to the LAN (drop box, planted device, insider).",
          items: [
            { text: "Plant / connect a rogue device", desc: "A drop box or implant on the LAN that calls back out (see Physical & Hardware)." },
            { text: "Bypass NAC / 802.1x", desc: "MAC spoofing, bridging behind an authorised device, or printer/VoIP impersonation." },
            { text: "VLAN hopping", desc: "Switch-spoofing or double-tagging to reach segments you should not." }
          ]
        },
        {
          id: "nw-poison",
          title: "Poisoning, relay & on-path",
          scenario: "on a segment where legacy name resolution and SMB signing are weak.",
          items: [
            { text: "LLMNR / NBT-NS / mDNS poisoning", desc: "Answer broadcast name lookups to capture NetNTLM hashes.", tools: [ { n: "Responder", id: "responder" } ], vulns: [ { n: "LLMNR/NBT-NS", id: "llmnr-nbtns" } ] },
            { text: "NTLM relay", desc: "Relay captured/coerced authentication to SMB, LDAP or AD CS for access.", tools: [ { n: "ntlmrelayx", id: "ntlmrelayx" } ], vulns: [ { n: "NTLM Relay", id: "ntlm-relay-vuln" } ] },
            { text: "Authentication coercion", desc: "Force a host to authenticate to you, then relay it.", vulns: [ { n: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" }, { n: "Auth Coercion", id: "authentication-coercion" } ] },
            { text: "IPv6 DNS takeover (mitm6)", desc: "Rogue DHCPv6/DNS to become the network's resolver and relay.", tools: [ { n: "mitm6", url: "https://github.com/dirkjanm/mitm6" } ] },
            { text: "ARP / DNS on-path", desc: "Position between hosts to capture or redirect traffic.", tools: [ { n: "bettercap", url: "https://www.bettercap.org/" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "wireless",
      title: "Wireless Access",
      color: "#a3e635",
      tag: "Wi-Fi / RF",
      desc: "Break onto Wi-Fi (or other RF) to reach the internal network or capture credentials.",
      groups: [
        {
          id: "wl-wifi",
          title: "Wi-Fi attacks",
          scenario: "within RF range of the target's wireless, where in scope.",
          items: [
            { text: "Recon APs, clients and security modes", desc: "SSIDs, WPA2-PSK vs Enterprise, channels and connected clients." },
            { text: "WPA2-PSK handshake / PMKID capture and crack", desc: "Grab the handshake or PMKID and crack offline for the pre-shared key.", tools: [ { n: "aircrack-ng", id: "aircrack-ng" }, { n: "hashcat" } ] },
            { text: "WPA2-Enterprise evil twin / EAP credential theft", desc: "Rogue RADIUS to capture and crack MSCHAPv2 from 802.1x clients.", tools: [ { n: "eaphammer", url: "https://github.com/s0lst1c3/eaphammer" }, { n: "hostapd-wpe" } ] },
            { text: "Rogue AP / Karma / captive-portal clone", desc: "Lure clients onto your AP to capture creds or deliver payloads." },
            { text: "Deauth to force reconnection", desc: "Knock clients off to capture handshakes or push them to the rogue AP." },
            { text: "Pivot from guest / IoT Wi-Fi", desc: "Weak segmentation between guest and corporate networks." }
          ]
        },
        {
          id: "wl-rf",
          title: "Other RF",
          scenario: "when the engagement includes non-Wi-Fi radio.",
          items: [
            { text: "Bluetooth / BLE discovery and abuse", desc: "Discoverable devices, peripherals and weak pairing." },
            { text: "RFID / sub-GHz capture", desc: "Badge and remote signals overlap with the Physical vector." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "physical",
      title: "Physical Access & Entry",
      color: "#f59e0b",
      tag: "Physical",
      desc: "Get a body (or a device) inside the building and onto the network.",
      groups: [
        {
          id: "py-entry",
          title: "Entry",
          scenario: "for on-site engagements with physical scope.",
          items: [
            { text: "Tailgating / piggybacking", desc: "Follow staff through controlled doors with a credible pretext." },
            { text: "Badge / RFID cloning", desc: "Read and clone proximity cards to open doors.", tools: [ { n: "Proxmark3" }, { n: "Flipper Zero" } ] },
            { text: "Lock bypass and door manipulation", desc: "Picking, shimming, under-door tools and REX-sensor tricks." },
            { text: "Pretext entry", desc: "Impersonate delivery, maintenance, fire/safety or a new starter." }
          ]
        },
        {
          id: "py-onsite",
          title: "On-site planted access",
          scenario: "once inside, to establish a network foothold or capture creds.",
          items: [
            { text: "Drop box / network implant", desc: "A small device plugged into the LAN that beacons out for remote access.", tools: [ { n: "Raspberry Pi / LAN Turtle" } ] },
            { text: "BadUSB / HID injection", desc: "A USB device that types keystrokes to run a payload on an unlocked host.", tools: [ { n: "Rubber Ducky / Flipper Zero" } ] },
            { text: "Unattended / unlocked workstation", desc: "Logged-in sessions, sticky-note creds, and kiosk breakouts." },
            { text: "Boot / media attacks", desc: "Boot from external media or bypass login on unencrypted machines.", tools: [ { n: "Kon-Boot" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "removable",
      title: "Removable Media & Hardware",
      color: "#c084fc",
      tag: "T1091 / T1200",
      desc: "Deliver access through physical media or planted hardware, often without entering yourself.",
      groups: [
        {
          id: "rv-media",
          title: "Removable media & implants",
          scenario: "when you can get hardware to a user or site.",
          items: [
            { text: "USB drop", desc: "Branded USB keys left for staff to plug in, carrying an HID or document lure.", vulns: [ { n: "see Payload Delivery", url: "initial-access.html#delivery" } ] },
            { text: "Malicious cables and peripherals", desc: "Implanted charging cables / adapters that act as keyboards or network devices.", tools: [ { n: "O.MG Cable" } ] },
            { text: "Mailed hardware implant", desc: "Posting a device (keylogger, rogue AP, 4G drop box) to a target site." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "supplychain",
      title: "Supply Chain & Trusted Relationship",
      color: "#f472b6",
      tag: "T1195 / T1199",
      desc: "Enter through a third party, vendor or dependency the target already trusts.",
      groups: [
        {
          id: "sc-supply",
          title: "Supply chain",
          scenario: "when the direct surface is hard but the software/vendor path is open.",
          items: [
            { text: "Compromise software / update channel", desc: "Trojaned installer or update pushed to the target as legitimate." },
            { text: "Malicious or typosquatted package", desc: "Poison a dependency the target builds against." },
            { text: "Compromised build / CI pipeline", desc: "Inject into artifacts the target consumes." }
          ]
        },
        {
          id: "sc-trust",
          title: "Trusted relationship",
          scenario: "when a partner, MSP or contractor has access into the target.",
          items: [
            { text: "Abuse MSP / vendor remote access", desc: "Jump in via a provider's connection, which is often broad and trusted." },
            { text: "B2B VPN / federation trust", desc: "Site-to-site links and identity federation that extend trust across orgs." },
            { text: "Shared or contractor credentials", desc: "Accounts and keys shared with third parties." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "driveby",
      title: "Drive-by & Watering Hole",
      color: "#e879f9",
      tag: "T1189",
      desc: "Compromise the user through the browser, on sites or ads they already use.",
      groups: [
        {
          id: "db-web",
          title: "Browser-delivered",
          scenario: "when you can influence or compromise content the target browses.",
          items: [
            { text: "Watering-hole a site staff visit", desc: "Compromise a niche/industry site the target frequents and serve a payload." },
            { text: "Malvertising", desc: "Malicious ads on legitimate ad networks targeting the org's demographics." },
            { text: "Browser / plugin exploitation", desc: "Exploit an out-of-date browser or plugin on visit." },
            { text: "HTML smuggling delivery", desc: "Assemble the payload in-browser from benign-looking content to slip past gateways." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "cloud",
      title: "Cloud & SaaS Entry",
      color: "#93c5fd",
      tag: "Cloud",
      desc: "Identity and misconfiguration are the new perimeter — get into the tenant, not the datacentre.",
      groups: [
        {
          id: "cl-entry",
          title: "Cloud / SaaS vectors",
          scenario: "when the target's crown jewels live in cloud and SaaS.",
          items: [
            { text: "Leaked cloud keys to console / API", desc: "Access keys from repos, laptops or metadata used against the provider API." },
            { text: "OAuth consent-grant access", desc: "A malicious app the user authorised gives token-based, MFA-surviving access." },
            { text: "SSO / federation abuse", desc: "Forged or stolen tokens and misconfigured federation into the tenant." },
            { text: "Exposed storage with secrets", desc: "Open buckets/blobs holding credentials that unlock more.", vulns: [ { n: "SSRF → metadata", id: "ssrf" } ] },
            { text: "CI/CD and pipeline access", desc: "Build systems and their service identities as a route into cloud." },
            { text: "Token / session replay", desc: "Stolen session cookies and refresh tokens replayed to skip login." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "delivery",
      title: "Payload Delivery & Execution",
      color: "#5eead4",
      tag: "Execution",
      desc: "The cross-cutting step — once a vector lands your file or command, get it to actually run.",
      groups: [
        {
          id: "dl-deliver",
          title: "Delivery & execution primitives",
          scenario: "with phishing, drop, drive-by or media — getting code to execute on the host.",
          items: [
            { text: "Container files to beat Mark-of-the-Web", desc: "ISO/IMG/VHD wrappers that strip MOTW from the payload inside." },
            { text: "LNK / HTA / scriptlet lures", desc: "Shortcut and script-host files that launch the loader." },
            { text: "Office macros / legacy formats", desc: "Still effective where macro protections are weak." },
            { text: "HTML smuggling", desc: "Reconstruct the payload client-side to evade email and web gateways." },
            { text: "Living-off-the-land execution", desc: "Signed built-in binaries to run the payload (see AppLocker/WDAC).", vulns: [ { n: "AppLocker & WDAC Bypass", url: "theory/2026-10-08-applocker-bypass.html" } ] }
          ]
        },
        {
          id: "dl-evade",
          title: "Evade the endpoint",
          scenario: "to survive AV/EDR, AMSI and logging long enough to establish C2.",
          items: [
            { text: "Bypass AMSI / ETW", desc: "Silence in-process script and telemetry inspection.", vulns: [ { n: "AMSI & ETW Bypass", url: "theory/2026-10-08-amsi-bypass-modern.html" } ] },
            { text: "Evade AV / EDR", desc: "Unhooking, in-memory execution and obfuscation of the loader.", vulns: [ { n: "Defense Evasion", url: "theory/2026-09-23-defense-evasion.html" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "foothold",
      title: "Establishing the Foothold",
      color: "#cbd5e1",
      tag: "C2",
      desc: "Convert execution into stable, controllable access and hand off to the next phase.",
      groups: [
        {
          id: "fh-c2",
          title: "Call back & stabilise",
          scenario: "the moment your code runs on a target host.",
          items: [
            { text: "Get a C2 callback / beacon", desc: "Establish command and control over a resilient channel.", tools: [ { n: "Sliver", id: "sliver" } ], vulns: [ { n: "Sliver C2", url: "theory/2026-09-23-sliver-c2.html" } ] },
            { text: "Initial situational awareness", desc: "Who am I, what host, what privileges, what network, what defences." },
            { text: "Stabilise and add initial persistence", desc: "Survive reboots and logouts without being noisy." },
            { text: "Hand off to privilege escalation / AD", desc: "Move from foothold into local privesc and the domain attack path.", vulns: [ { n: "AD Attack Map", url: "ad-map.html" }, { n: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" } ] }
          ]
        }
      ]
    }

  ]
};
