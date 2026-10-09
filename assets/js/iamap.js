/*
  INITIAL ACCESS — data for initial-access.html (rendered by iamap-main.js).

  A red-team playbook of initial-access vectors: how an external attacker turns
  reconnaissance into a first foothold. Organised by vector (web, remote
  services, credentials, network/adjacent, wireless, physical, removable/
  hardware, supply chain, drive-by, cloud/SaaS) and mapped to MITRE ATT&CK's
  Initial Access tactic (TA0001) where it applies. Picks up where the OSINT
  workflow leaves off and hands off to privilege escalation / the AD map.

  MODEL (extends the webmap.js / osintmap.js shape with an optional `flow`):
    IA_MAP = { meta:{title,note}, sections:[ {id,title,color,tag,desc,
      groups:[ {id,title,scenario,items:[ {
        text,                              // the technique, short
        desc,                              // one-line what/why
        flow:  [ "step 1", "step 2", ... ] // optional ordered end-to-end chain
        tools: [ {n,id?,url?} ],           // id -> toolkit, url -> external
        vulns: [ {n,id?,url?} ]            // id -> vuln-detail, url -> page/ref
      } ]} ]} ] }

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
            { text: "Spearphishing attachment", desc: "A lure document / container that delivers a payload (see Payload Delivery).",
              flow: [ "Register or warm a look-alike sender domain with aligned SPF/DKIM/DMARC", "Build a lure doc or ISO/IMG container carrying the loader", "Send the targeted email with a pretext tuned from OSINT", "User opens the attachment and runs the content inside", "Loader executes, evades AV/AMSI, and calls back to C2" ],
              tools: [ { n: "GoPhish", id: "gophish" } ] },
            { text: "Spearphishing link (credential harvest)", desc: "Cloned login page capturing credentials; pretext tuned to the target.",
              flow: [ "Stand up a cloned login page on a look-alike domain", "Email a pretext link (shared doc, password reset, portal notice)", "User clicks and enters their credentials", "Capture username + password server-side", "Replay them against the real service / VPN / webmail" ],
              tools: [ { n: "GoPhish", id: "gophish" } ] },
            { text: "Pretext / BEC without a payload", desc: "Pure social engineering — invoice fraud, HR/IT impersonation, urgency.",
              flow: [ "Study org chart, tone and processes from OSINT", "Impersonate a trusted party (exec, finance, IT, supplier)", "Create urgency or authority in the request", "Target performs the action (wire, cred reset, data send)", "Use the result (funds, access, information)" ] },
            { text: "Warm up and authenticate the sending infra", desc: "SPF/DKIM/DMARC-aligned domains and aged senders to clear mail filtering." }
          ]
        },
        {
          id: "ph-modern",
          title: "MFA & modern phishing",
          scenario: "against targets protected by MFA or cloud identity.",
          items: [
            { text: "Adversary-in-the-middle (reverse proxy)", desc: "Relay the real login to steal the session cookie, defeating most MFA.",
              flow: [ "Deploy a reverse-proxy phishing kit pointed at the real login", "Lure the user to the proxy via a link", "User authenticates and completes MFA against the real site through you", "Capture the authenticated session cookie as it passes", "Import the cookie to ride the session — MFA already satisfied" ],
              tools: [ { n: "Evilginx", url: "https://github.com/kgretzky/evilginx2" } ] },
            { text: "OAuth / app-consent phishing", desc: "Trick the user into granting a malicious app token-based access to their account.",
              flow: [ "Register a malicious OAuth app requesting mailbox / files scopes", "Send the user the legitimate provider consent link for your app", "User grants consent on the real provider page", "Receive an access + refresh token", "Use the tokens for persistent, MFA-surviving API access" ] },
            { text: "Device-code phishing", desc: "Abuse the OAuth device-authorisation flow to get the user to authorise your device.",
              flow: [ "Start a device-code flow for a first-party client", "Send the user the short code and the real verification URL", "User enters the code and authenticates (and MFA)", "Poll the token endpoint and receive tokens", "Access resources as the user" ] },
            { text: "MFA fatigue / push bombing", desc: "Repeated push prompts until the user approves one.",
              flow: [ "Obtain a valid username + password (spray or breach)", "Trigger repeated MFA push approvals", "Optionally call the user posing as IT to 'approve the prompt'", "User approves one out of fatigue or confusion", "Sign-in completes — establish the session" ] },
            { text: "QR-code phishing (quishing) and callback (TOAD)", desc: "Move the lure off-email via QR codes or a phone-callback pretext to dodge filters.",
              flow: [ "Send a benign-looking message with a QR code or a phone number", "User scans on a phone / calls — off the mail gateway's view", "Follow-on page harvests creds, or an operator walks them into remote access", "Use the captured credentials or planted access" ] }
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
            { text: "Fingerprint stack and versions", desc: "Product and version drive which known CVEs apply.",
              flow: [ "Read headers, cookies, favicon hash, JS bundles and error pages", "Identify the product, framework and version", "Map the version to known CVEs and default paths", "Confirm the candidate issue is reachable and unpatched" ],
              tools: [ { n: "whatweb", id: "whatweb" }, { n: "wpscan", id: "wpscan" }, { n: "nuclei", id: "nuclei" } ] },
            { text: "Content & endpoint discovery", desc: "Hidden panels, admin, APIs, backups and dev hosts.",
              flow: [ "Brute-force paths and virtual hosts from wordlists", "Pull sitemaps, robots.txt and JS for referenced routes", "Flag admin panels, APIs, upload points and backups", "Prioritise the ones that reach code or data" ],
              tools: [ { n: "ffuf", id: "ffuf" }, { n: "gobuster", id: "gobuster" }, { n: "katana", id: "katana" } ] },
            { text: "Scan for known vulnerabilities", desc: "Template-based checks for exposed CVEs and misconfigs.",
              flow: [ "Run templated vulnerability checks against the surface", "Triage hits, discarding false positives by hand", "Reproduce the real issue in a proxy", "Select the exploitation path below" ],
              tools: [ { n: "nuclei", id: "nuclei" }, { n: "Burp Suite", id: "burpsuite" } ] }
          ]
        },
        {
          id: "we-exploit",
          title: "Exploit to code / data",
          scenario: "when a specific weakness is confirmed.",
          items: [
            { text: "SQL injection to data or RCE", desc: "Dump creds, or stack/xp_cmdshell/INTO OUTFILE to execution.",
              flow: [ "Find an injectable parameter and confirm the DBMS", "Extract application and user credentials from the database", "If privileges allow, enable stacked queries / xp_cmdshell / INTO OUTFILE", "Write a web shell or run OS commands", "Foothold as the DB or web service account" ],
              tools: [ { n: "sqlmap", id: "sqlmap" } ], vulns: [ { n: "SQL Injection", id: "sqli" } ] },
            { text: "File upload to web shell", desc: "Upload an executable handler and browse to it for code execution.",
              flow: [ "Find an upload that reaches a web-served, executable path", "Bypass validation (extension, content-type, magic bytes)", "Upload a web shell or handler", "Browse to it to execute commands", "Run as the web user → foothold" ],
              vulns: [ { n: "File Upload", id: "file-upload" } ] },
            { text: "Insecure deserialization", desc: "Crafted serialized object into a gadget chain for RCE.",
              flow: [ "Identify a sink that deserializes attacker input (cookie, param, API)", "Fingerprint the framework / library in use", "Build a gadget-chain payload for that stack", "Submit it to the sink", "Gadget chain executes → RCE" ],
              vulns: [ { n: "Deserialization", id: "insecure-deserialization" } ] },
            { text: "Template / command injection", desc: "SSTI and OS command injection break straight to the shell.",
              flow: [ "Inject template / shell metacharacters into a reflected input", "Confirm evaluation with a harmless marker (math, delay)", "Escalate to template object access or an OS command", "Execute a command → shell as the app user" ],
              vulns: [ { n: "SSTI", id: "ssti" }, { n: "Command Injection", id: "command-injection" } ] },
            { text: "SSRF to cloud metadata / internal", desc: "Reach the metadata service for cloud credentials, or pivot internally.",
              flow: [ "Find a request the server makes to a URL you influence", "Point it at the cloud metadata endpoint (169.254.169.254)", "Retrieve the instance role's temporary credentials", "Use the creds against the cloud API", "Pivot into cloud resources / internal services" ],
              vulns: [ { n: "SSRF", id: "ssrf" } ] },
            { text: "Path traversal / LFI and XXE", desc: "Read secrets and config, sometimes chaining to RCE.",
              flow: [ "Find a file-path parameter or XML-parsing input", "Read config, keys and credentials (../../ or external entity)", "Harvest the secrets", "Reuse them to authenticate or exploit elsewhere" ],
              vulns: [ { n: "Path Traversal", id: "path-traversal" }, { n: "XXE", id: "xxe" } ] },
            { text: "Auth bypass / default creds on panels", desc: "Admin panels and appliances with weak or default authentication.",
              flow: [ "Identify the panel / appliance and its auth scheme", "Try default or vendor credentials, or a known bypass", "Gain admin of the app or appliance", "Use its features (upload, exec, config) for code exec or pivot" ],
              vulns: [ { n: "Auth Bypass", id: "auth-bypass" }, { n: "Default Credentials", id: "default-credentials" } ] },
            { text: "Exposed source / backups / secrets", desc: "Leaked repos, .git, backups and config give creds and code paths.",
              flow: [ "Find .git, archives, backups or a public repo", "Download and review for secrets and logic", "Extract credentials, keys and internal endpoints", "Authenticate or exploit with what you recovered" ],
              vulns: [ { n: "Exposed Source & Backups", id: "exposed-source-backups" } ] }
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
            { text: "Enumerate exposed services", desc: "VPN, RDP, SSH, Citrix, OWA/Exchange, VNC, management and database ports.",
              flow: [ "Scan the external ranges for remote-access ports and services", "Identify the product and version of each portal", "Group into spray targets vs exploit targets", "Note MFA and lockout behaviour per portal" ],
              tools: [ { n: "nmap", id: "nmap" } ] },
            { text: "Check appliances against known CVEs", desc: "VPN/Citrix/Exchange edge devices are heavily targeted pre-auth chains.",
              flow: [ "Match the appliance version to a pre-auth chain", "Obtain and verify the exploit safely", "Exploit to code execution or auth bypass on the edge device", "Harvest credentials / sessions from it", "Pivot inward from the appliance" ],
              tools: [ { n: "nuclei", id: "nuclei" } ], vulns: [ { n: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" } ] }
          ]
        },
        {
          id: "rm-access",
          title: "Authenticate in",
          scenario: "once you have candidate credentials or a sprayable portal.",
          items: [
            { text: "Password spray the portal", desc: "A few common passwords across many users to avoid lockout.",
              flow: [ "Build the user list from the OSINT email format", "Pick one or two likely passwords (season+year, company name)", "Spray across all users, spaced under the lockout threshold", "Identify valid credential pairs", "Log into the VPN / RDP / webmail" ],
              tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ] },
            { text: "Use valid accounts from recon / breaches", desc: "Reused or leaked credentials logged straight into VPN/RDP/webmail.",
              flow: [ "Take credentials from breaches, phishing or exposed secrets", "Match them to an exposed portal", "Authenticate (defeat MFA via AiTM / stolen cookie if present)", "Confirm what the account can reach" ],
              vulns: [ { n: "Valid Accounts — see Credentials", url: "initial-access.html#creds" } ] },
            { text: "Abuse self-service and SSO portals", desc: "Password-reset, enrolment and federation flows that leak access.",
              flow: [ "Find self-service reset / MFA-enrolment / SSO flows", "Abuse a weak reset or first-time-enrolment window", "Take over or enrol the account", "Use it to reach downstream apps" ] }
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
            { text: "Reuse breach / combolist credentials", desc: "Credentials exposed in dumps, matched to the target's users and portals.",
              flow: [ "Pull the target's users from breach datasets", "Filter to corporate emails and likely-reused passwords", "Validate low-and-slow against a portal", "Keep the working pairs" ] },
            { text: "Harvest keys and tokens from public code", desc: "API keys, cloud creds and tokens committed to repos.",
              flow: [ "Enumerate org and employee repositories", "Scan code and git history for keys and tokens", "Validate the secret against its service", "Use it for access or data" ] },
            { text: "Capture session cookies / tokens", desc: "AiTM phishing or info-stealer logs yield live sessions that skip MFA.",
              flow: [ "Obtain a session or refresh token (AiTM, stealer log)", "Import it into a browser or client", "Access the service as the user without logging in", "Act before the session expires" ] }
          ]
        },
        {
          id: "cr-use",
          title: "Spray & validate",
          scenario: "to turn candidate credentials into working access without lockouts.",
          items: [
            { text: "Password spray carefully", desc: "One password across all users, spaced to respect lockout thresholds.",
              flow: [ "Confirm the account-lockout policy first", "Spray a single password across the whole user list", "Wait out the observation window before the next password", "Collect valid pairs without locking anyone out" ],
              tools: [ { n: "netexec", id: "netexec" }, { n: "kerbrute", id: "kerbrute" } ] },
            { text: "Try default and vendor credentials", desc: "Appliances, panels and databases shipped with known logins.",
              flow: [ "Identify the product behind each exposed login", "Look up its default / vendor credentials", "Try them against the login", "Use any that still work" ],
              vulns: [ { n: "Default Credentials", id: "default-credentials" } ] },
            { text: "Validate access and map what it unlocks", desc: "Which services, mailboxes and apps the account can reach.",
              flow: [ "Authenticate the working credential", "Enumerate the services, mailboxes and apps it can reach", "Note privilege level and any admin surfaces", "Pick the richest foothold to develop" ],
              tools: [ { n: "netexec", id: "netexec" } ] }
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
            { text: "Plant / connect a rogue device", desc: "A drop box or implant on the LAN that calls back out (see Physical & Hardware).",
              flow: [ "Gain physical or adjacent access to a live network port", "Connect a drop box pre-configured to beacon outbound", "It establishes a tunnel / C2 out through egress", "Operate on the internal segment remotely" ] },
            { text: "Bypass NAC / 802.1x", desc: "MAC spoofing, bridging behind an authorised device, or printer/VoIP impersonation.",
              flow: [ "Identify NAC / 802.1x on the port", "Find an exempt device (printer, VoIP) or an authorised MAC", "Spoof the MAC or transparently bridge behind the device", "Obtain an internal IP and reach the LAN" ] },
            { text: "VLAN hopping", desc: "Switch-spoofing or double-tagging to reach segments you should not.",
              flow: [ "Observe switch / trunk behaviour (DTP, native VLAN)", "Switch-spoof or send double-tagged frames", "Reach a VLAN you were not meant to", "Access hosts on the target segment" ] }
          ]
        },
        {
          id: "nw-poison",
          title: "Poisoning, relay & on-path",
          scenario: "on a segment where legacy name resolution and SMB signing are weak.",
          items: [
            { text: "LLMNR / NBT-NS / mDNS poisoning", desc: "Answer broadcast name lookups to capture NetNTLM hashes.",
              flow: [ "Sit on the segment and listen for failed name lookups", "Answer LLMNR / NBT-NS / mDNS claiming to be the requested host", "Victim sends NetNTLM authentication to you", "Capture the challenge/response hash", "Crack it offline, or relay it (next item)" ],
              tools: [ { n: "Responder", id: "responder" } ], vulns: [ { n: "LLMNR/NBT-NS", id: "llmnr-nbtns" } ] },
            { text: "NTLM relay", desc: "Relay captured/coerced authentication to SMB, LDAP or AD CS for access.",
              flow: [ "Capture or coerce a victim's authentication", "Relay it to a target service with signing off (SMB / LDAP / AD CS)", "Authenticate to that service as the victim", "Execute code, add a computer/cred, or request a certificate", "Use the resulting access as a foothold" ],
              tools: [ { n: "ntlmrelayx", id: "ntlmrelayx" } ], vulns: [ { n: "NTLM Relay", id: "ntlm-relay-vuln" } ] },
            { text: "Authentication coercion", desc: "Force a host to authenticate to you, then relay it.",
              flow: [ "Pick a coercion method (printer bug, EFSRPC, DFSCoerce, etc.)", "Trigger the target host / DC to authenticate to your listener", "Capture or relay that authentication", "Gain access or set up escalation" ],
              vulns: [ { n: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" }, { n: "Auth Coercion", id: "authentication-coercion" } ] },
            { text: "IPv6 DNS takeover (mitm6)", desc: "Rogue DHCPv6/DNS to become the network's resolver and relay.",
              flow: [ "Advertise rogue DHCPv6 with yourself as the IPv6 DNS server", "Windows prefers IPv6 and starts resolving through you", "Answer WPAD / name queries to capture auth", "Relay the captured LDAP/SMB auth for access" ],
              tools: [ { n: "mitm6", url: "https://github.com/dirkjanm/mitm6" } ] },
            { text: "ARP / DNS on-path", desc: "Position between hosts to capture or redirect traffic.",
              flow: [ "ARP-spoof to insert yourself between victim and gateway", "Intercept or redirect selected traffic / name lookups", "Capture credentials or deliver a payload in-stream" ],
              tools: [ { n: "bettercap", url: "https://www.bettercap.org/" } ] }
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
            { text: "Recon APs, clients and security modes", desc: "SSIDs, WPA2-PSK vs Enterprise, channels and connected clients.",
              flow: [ "Put the adapter into monitor mode", "Enumerate APs, security modes, channels and associated clients", "Identify PSK vs Enterprise and the target BSSID", "Choose the matching attack below" ],
              tools: [ { n: "aircrack-ng", id: "aircrack-ng" } ] },
            { text: "WPA2-PSK handshake / PMKID capture and crack", desc: "Grab the handshake or PMKID and crack offline for the pre-shared key.",
              flow: [ "Capture the 4-way handshake, or request the PMKID from the AP", "Deauth a client to force a handshake if none is seen", "Crack the capture offline with a wordlist and rules", "Connect to the Wi-Fi with the recovered key", "Reach the internal network it bridges to" ],
              tools: [ { n: "aircrack-ng", id: "aircrack-ng" }, { n: "hashcat" } ] },
            { text: "WPA2-Enterprise evil twin / EAP credential theft", desc: "Rogue RADIUS to capture and crack MSCHAPv2 from 802.1x clients.",
              flow: [ "Clone the enterprise SSID with a rogue AP + RADIUS", "Deauth clients to trigger reconnection", "Client attempts 802.1x authentication against you", "Capture the MSCHAPv2 challenge/response", "Crack it offline to recover domain credentials" ],
              tools: [ { n: "eaphammer", url: "https://github.com/s0lst1c3/eaphammer" }, { n: "hostapd-wpe" } ] },
            { text: "Rogue AP / Karma / captive-portal clone", desc: "Lure clients onto your AP to capture creds or deliver payloads.",
              flow: [ "Broadcast an open or known SSID (Karma answers probe requests)", "Client auto-associates to your AP", "Serve a captive portal or a payload", "Capture credentials or land code on the client" ] },
            { text: "Deauth to force reconnection", desc: "Knock clients off to capture handshakes or push them to the rogue AP.",
              flow: [ "Identify the target BSSID and client", "Send deauthentication frames", "Client disconnects and reconnects", "Capture the handshake, or it associates to your rogue AP" ] },
            { text: "Pivot from guest / IoT Wi-Fi", desc: "Weak segmentation between guest and corporate networks.",
              flow: [ "Join the guest or IoT Wi-Fi", "Test segmentation toward the corporate network", "Find a reachable corporate service or misrouted VLAN", "Pivot into the internal network" ] }
          ]
        },
        {
          id: "wl-rf",
          title: "Other RF",
          scenario: "when the engagement includes non-Wi-Fi radio.",
          items: [
            { text: "Bluetooth / BLE discovery and abuse", desc: "Discoverable devices, peripherals and weak pairing.",
              flow: [ "Scan for discoverable BT/BLE devices nearby", "Identify peripherals, their services and pairing mode", "Abuse weak/legacy pairing or a known device flaw", "Reach the paired host or data" ] },
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
            { text: "Tailgating / piggybacking", desc: "Follow staff through controlled doors with a credible pretext.",
              flow: [ "Study entry points, badge readers and staff flow", "Prepare a credible pretext and props (lanyard, boxes, coffee)", "Follow an employee through a controlled door", "Reach an internal area without badging" ] },
            { text: "Badge / RFID cloning", desc: "Read and clone proximity cards to open doors.",
              flow: [ "Get within read range of a target card (queue, lift, long-range reader at a door)", "Read the card data", "Write a clone to a blank card or an emulator", "Present the clone to open controlled doors" ],
              tools: [ { n: "Proxmark3" }, { n: "Flipper Zero" } ] },
            { text: "Lock bypass and door manipulation", desc: "Picking, shimming, under-door tools and REX-sensor tricks.",
              flow: [ "Identify the lock and door hardware", "Apply picking / shimming / under-door / REX-sensor manipulation", "Open the door", "Enter the controlled space" ] },
            { text: "Pretext entry", desc: "Impersonate delivery, maintenance, fire/safety or a new starter.",
              flow: [ "Pick a role staff will not challenge (courier, contractor, inspector)", "Build the look and a cover story with details from OSINT", "Present at reception or an entrance", "Gain escorted or unescorted access" ] }
          ]
        },
        {
          id: "py-onsite",
          title: "On-site planted access",
          scenario: "once inside, to establish a network foothold or capture creds.",
          items: [
            { text: "Drop box / network implant", desc: "A small device plugged into the LAN that beacons out for remote access.",
              flow: [ "Pre-configure a small device to beacon out (4G out-of-band ideally)", "Find a discreet live network port on-site", "Plug it in and conceal it", "It establishes outbound C2 / a tunnel", "Operate the internal network remotely" ],
              tools: [ { n: "Raspberry Pi / LAN Turtle" } ] },
            { text: "BadUSB / HID injection", desc: "A USB device that types keystrokes to run a payload on an unlocked host.",
              flow: [ "Load a keystroke-injection payload onto an HID device", "Plug it into an unlocked / logged-in workstation", "The device types and runs the loader", "Loader calls back to C2" ],
              tools: [ { n: "Rubber Ducky / Flipper Zero" } ] },
            { text: "Unattended / unlocked workstation", desc: "Logged-in sessions, sticky-note creds, and kiosk breakouts.",
              flow: [ "Find an unattended, logged-in session", "Run a payload or harvest credentials (saved logins, sticky notes)", "Break out of any kiosk/locked-shell restriction", "Establish access" ] },
            { text: "Boot / media attacks", desc: "Boot from external media or bypass login on unencrypted machines.",
              flow: [ "Access a machine physically", "Boot from external media or a bypass tool", "Reset / bypass the local login (if the disk is unencrypted)", "Access data or plant persistent access" ],
              tools: [ { n: "Kon-Boot" } ] }
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
            { text: "USB drop", desc: "Branded USB keys left for staff to plug in, carrying an HID or document lure.",
              flow: [ "Prepare USB keys with an HID payload or an enticing document lure", "Scatter them where staff will find them (car park, lobby, desks)", "A curious user plugs one in", "Payload runs and calls back" ],
              vulns: [ { n: "see Payload Delivery", url: "initial-access.html#delivery" } ] },
            { text: "Malicious cables and peripherals", desc: "Implanted charging cables / adapters that act as keyboards or network devices.",
              flow: [ "Acquire an implanted cable / adapter (acts as keyboard or NIC)", "Get it into use at the target (gift, swap, plant at a desk)", "On connection it injects keystrokes or provides a network path", "Foothold via the injected payload or device" ],
              tools: [ { n: "O.MG Cable" } ] },
            { text: "Mailed hardware implant", desc: "Posting a device (keylogger, rogue AP, 4G drop box) to a target site.",
              flow: [ "Configure a device (keylogger, rogue AP, 4G drop box)", "Post it to a target site addressed to a plausible recipient", "Someone connects or powers it on", "It beacons out and grants access" ] }
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
            { text: "Compromise software / update channel", desc: "Trojaned installer or update pushed to the target as legitimate.",
              flow: [ "Compromise the vendor's build or update channel", "Insert the trojan into a signed, legitimate artifact", "Target pulls the update through its normal process", "Payload runs inside the target as trusted software" ] },
            { text: "Malicious or typosquatted package", desc: "Poison a dependency the target builds against.",
              flow: [ "Publish a typosquat or poison a real dependency", "Target's build or developer pulls it", "Install / build script executes", "Code runs in the pipeline or on the dev host" ] },
            { text: "Compromised build / CI pipeline", desc: "Inject into artifacts the target consumes.",
              flow: [ "Gain access to a shared build / CI system", "Inject into build steps or output artifacts", "Target consumes the artifact downstream", "Execution lands inside the target" ] }
          ]
        },
        {
          id: "sc-trust",
          title: "Trusted relationship",
          scenario: "when a partner, MSP or contractor has access into the target.",
          items: [
            { text: "Abuse MSP / vendor remote access", desc: "Jump in via a provider's connection, which is often broad and trusted.",
              flow: [ "Compromise a provider that has access into the target", "Use the provider's trusted remote-access tooling", "Enter the target through that channel", "Operate with the provider's (often broad) rights" ] },
            { text: "B2B VPN / federation trust", desc: "Site-to-site links and identity federation that extend trust across orgs.",
              flow: [ "Identify a site-to-site VPN or identity federation", "Abuse the trust (misconfig, stolen token, over-broad rules)", "Cross from the partner into the target", "Access target resources" ] },
            { text: "Shared or contractor credentials", desc: "Accounts and keys shared with third parties.",
              flow: [ "Find accounts or keys shared with contractors / partners", "Obtain them (breach, repo, the partner side)", "Authenticate into the target", "Use the shared access" ] }
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
            { text: "Watering-hole a site staff visit", desc: "Compromise a niche/industry site the target frequents and serve a payload.",
              flow: [ "Identify sites the target's staff frequent (from OSINT)", "Compromise the site or a resource it includes", "Serve a payload or exploit, optionally only to target IPs", "A staff member's browser runs it", "Foothold on their host" ] },
            { text: "Malvertising", desc: "Malicious ads on legitimate ad networks targeting the org's demographics.",
              flow: [ "Buy ads on networks the target's users see", "Point them at an exploit or lure landing page", "Target loads/clicks the ad", "Payload is delivered to the browser" ] },
            { text: "Browser / plugin exploitation", desc: "Exploit an out-of-date browser or plugin on visit.",
              flow: [ "Detect an out-of-date browser or plugin on visit", "Serve a matching exploit", "Exploit the browser process", "Execute code on the host" ] },
            { text: "HTML smuggling delivery", desc: "Assemble the payload in-browser from benign-looking content to slip past gateways.",
              flow: [ "Craft a page that assembles the payload client-side from benign parts", "Deliver the link (phish, ad, watering hole)", "Browser reconstructs and offers the file locally", "User runs it, having bypassed gateway scanning" ] }
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
            { text: "Leaked cloud keys to console / API", desc: "Access keys from repos, laptops or metadata used against the provider API.",
              flow: [ "Obtain cloud access keys (repo, laptop, SSRF-to-metadata)", "Authenticate to the provider API or console", "Enumerate the identity's permissions", "Access resources and pivot within the tenant" ],
              vulns: [ { n: "SSRF → metadata", id: "ssrf" } ] },
            { text: "OAuth consent-grant access", desc: "A malicious app the user authorised gives token-based, MFA-surviving access.",
              flow: [ "Register a malicious app with broad scopes", "Phish the user to grant consent on the real provider", "Receive access + refresh tokens", "Access the tenant with token-based auth (no password, survives MFA)" ] },
            { text: "SSO / federation abuse", desc: "Forged or stolen tokens and misconfigured federation into the tenant.",
              flow: [ "Identify the IdP and federation configuration", "Forge or steal a token, or exploit a federation misconfig", "Present it to the service provider / tenant", "Access as a federated identity" ] },
            { text: "Exposed storage with secrets", desc: "Open buckets/blobs holding credentials that unlock more.",
              flow: [ "Find open buckets / blobs via naming or indexers", "Read objects for credentials and keys", "Use those secrets to authenticate to more services", "Pivot" ] },
            { text: "CI/CD and pipeline access", desc: "Build systems and their service identities as a route into cloud.",
              flow: [ "Reach the build system or its stored secrets", "Use its service identity's cloud permissions", "Access cloud resources through the pipeline identity" ] },
            { text: "Token / session replay", desc: "Stolen session cookies and refresh tokens replayed to skip login.",
              flow: [ "Steal a session cookie or refresh token (AiTM, stealer)", "Replay it to the cloud / SaaS endpoint", "Access without logging in", "Act before it expires or is revoked" ] }
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
            { text: "Container files to beat Mark-of-the-Web", desc: "ISO/IMG/VHD wrappers that strip MOTW from the payload inside.",
              flow: [ "Wrap the payload inside an ISO / IMG / VHD", "Deliver via phishing link or download", "User mounts the container and runs the inner file", "MOTW does not propagate inside, so SmartScreen stays quiet", "Loader executes" ] },
            { text: "LNK / HTA / scriptlet lures", desc: "Shortcut and script-host files that launch the loader.",
              flow: [ "Craft a .lnk / .hta / scriptlet that launches the loader", "Deliver it (often inside a container)", "User double-clicks it", "The script host runs the payload" ] },
            { text: "Office macros / legacy formats", desc: "Still effective where macro protections are weak.",
              flow: [ "Build a macro-enabled document", "Deliver with a pretext to 'enable content'", "User enables macros", "VBA runs the loader" ] },
            { text: "HTML smuggling", desc: "Reconstruct the payload client-side to evade email and web gateways.",
              flow: [ "Encode the payload inside a benign-looking web page", "Browser reassembles it locally via JavaScript", "The file is offered to the user from their own browser", "User runs it, bypassing network scanning" ] },
            { text: "Living-off-the-land execution", desc: "Signed built-in binaries to run the payload (see AppLocker/WDAC).",
              flow: [ "Choose a signed built-in that executes code and is allowed by policy", "Stage the payload the LOLBin will run", "Invoke the LOLBin", "Code runs under a trusted, signed binary" ],
              vulns: [ { n: "AppLocker & WDAC Bypass", url: "theory/2026-10-08-applocker-bypass.html" } ] }
          ]
        },
        {
          id: "dl-evade",
          title: "Evade the endpoint",
          scenario: "to survive AV/EDR, AMSI and logging long enough to establish C2.",
          items: [
            { text: "Bypass AMSI / ETW", desc: "Silence in-process script and telemetry inspection.",
              flow: [ "Loader runs in-process on the host", "Neutralise AMSI (flag / patch / hardware breakpoint)", "Silence ETW emission for the process", "Proceed largely unscanned and unlogged" ],
              vulns: [ { n: "AMSI & ETW Bypass", url: "theory/2026-10-08-amsi-bypass-modern.html" } ] },
            { text: "Evade AV / EDR", desc: "Unhooking, in-memory execution and obfuscation of the loader.",
              flow: [ "Unhook userland or run the payload in memory", "Obfuscate the loader and its C2 traffic", "Avoid known IOCs and noisy API patterns", "Beacon survives on the host" ],
              vulns: [ { n: "Defense Evasion", url: "theory/2026-09-23-defense-evasion.html" } ] }
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
            { text: "Get a C2 callback / beacon", desc: "Establish command and control over a resilient channel.",
              flow: [ "Loader executes and decrypts the stager", "Beacon connects out to the C2 redirector over HTTPS / DNS", "Operator receives the new session", "Tasking begins over the channel" ],
              tools: [ { n: "Sliver", id: "sliver" } ], vulns: [ { n: "Sliver C2", url: "theory/2026-09-23-sliver-c2.html" } ] },
            { text: "Initial situational awareness", desc: "Who am I, what host, what privileges, what network, what defences.",
              flow: [ "Identify user, host, privileges and domain", "Enumerate network, logged-on users and reachable services", "Fingerprint the AV / EDR present", "Decide the next move from what you see" ] },
            { text: "Stabilise and add initial persistence", desc: "Survive reboots and logouts without being noisy.",
              flow: [ "Migrate or duplicate the session for resilience", "Add a low-noise persistence mechanism", "Verify it survives reboot and logout", "Keep a fallback channel" ] },
            { text: "Hand off to privilege escalation / AD", desc: "Move from foothold into local privesc and the domain attack path.",
              flow: [ "Assess local privilege-escalation options", "Escalate to admin / SYSTEM", "Harvest credentials from the host", "Enter the Active Directory attack path" ],
              vulns: [ { n: "AD Attack Map", url: "ad-map.html" }, { n: "Perimeter → AD", url: "theory/2026-09-24-perimeter-to-ad.html" } ] }
          ]
        }
      ]
    }

  ]
};
