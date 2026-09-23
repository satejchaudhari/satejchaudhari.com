/*
  AD ATTACK-PATH EXPLORER — data model for ad-map.html

  An interactive re-imagining of the classic "Pentesting Active Directory"
  mind map, organised by the attacker's level of access (the map's real
  through-line) so the next step is always obvious.

  STAGES: each has a hue (color-codes the access level) and a list of
  techniques. TECHNIQUES carry:
    id     - anchor id (used by next-step links and the URL hash)
    name   - technique / attack title
    desc   - one or two sentences: what it is and what it gets you
    tools  - chips; { n: label, id: toolkit-id | null }  (null = no page yet -> blank link)
    vuln   - { l: label, id: vuln-id | null } | null      (null id = no page yet -> blank link)
    next   - follow-on steps; { l: label, to: technique-id | stage-id }

  To add a page later, fill the null id with the real toolkit/vuln id.
*/

var AD_MAP = {
  stages: [
    {
      id: "stage-nocreds",
      name: "No credentials",
      hue: "hue-slate",
      tag: "Entry point",
      summary: "You are on the network (or can reach it) but hold no valid domain account. The goal of this stage is a first credential, hash, or relayed authentication.",
      techniques: [
        {
          id: "recon-dc",
          name: "Find the domain & DCs",
          desc: "Locate domain controllers and map the estate before touching anything — DNS/SRV records, LDAP ping, SMB, and a light network sweep tell you what is reachable and what the domain is called.",
          tools: [
            { n: "nmap", id: null },
            { n: "NetExec", id: "netexec" },
            { n: "enum4linux-ng", id: "enum4linux-ng" },
            { n: "ldapsearch", id: null }
          ],
          vuln: null,
          next: [
            { l: "Anonymous enumeration", to: "null-session" },
            { l: "Poisoning & relay", to: "llmnr-poison" }
          ]
        },
        {
          id: "null-session",
          name: "Anonymous / guest enumeration",
          desc: "Null and guest sessions on SMB/LDAP can leak users, groups, password policy and shares with no credentials at all — the fastest route to a user list for spraying or roasting.",
          tools: [
            { n: "enum4linux-ng", id: "enum4linux-ng" },
            { n: "NetExec", id: "netexec" },
            { n: "ldapdomaindump", id: "ldapdomaindump" },
            { n: "windapsearch", id: "windapsearch" }
          ],
          vuln: { l: "Null / anonymous session", id: "null-session" },
          next: [
            { l: "Password spray", to: "password-spray" },
            { l: "AS-REP roast (no creds)", to: "asrep-nocreds" }
          ]
        },
        {
          id: "llmnr-poison",
          name: "LLMNR / NBT-NS / mDNS poisoning",
          desc: "Answer broadcast name-resolution requests to capture NetNTLM hashes from hosts that mistype a name — crack them offline, or relay them straight on.",
          tools: [
            { n: "Responder", id: "responder" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: { l: "LLMNR / NBT-NS poisoning", id: "llmnr-nbtns" },
          next: [
            { l: "Relay the captured auth", to: "ntlm-relay" },
            { l: "Crack the NetNTLM hash", to: "crack-hashes" }
          ]
        },
        {
          id: "ipv6-mitm",
          name: "IPv6 DNS takeover (mitm6)",
          desc: "Most networks prefer IPv6 but run no IPv6 DNS, so a rogue DHCPv6/DNS server becomes the primary resolver and funnels authentication to you for relaying.",
          tools: [
            { n: "mitm6", id: null },
            { n: "ntlmrelayx", id: "ntlmrelayx" }
          ],
          vuln: { l: "NTLM relay", id: "ntlm-relay-vuln" },
          next: [
            { l: "Relay to LDAP / SMB", to: "ntlm-relay" }
          ]
        },
        {
          id: "coerce",
          name: "Coerce authentication",
          desc: "Force a machine — often a DC — to authenticate to you over RPC (PetitPotam, PrinterBug, DFSCoerce). The coerced machine account is then relayed or captured.",
          tools: [
            { n: "Coercer", id: "coercer" },
            { n: "ntlmrelayx", id: "ntlmrelayx" }
          ],
          vuln: { l: "Authentication coercion", id: "authentication-coercion" },
          next: [
            { l: "Relay to AD CS (ESC8)", to: "adcs" },
            { l: "Relay to LDAP → RBCD", to: "rbcd" },
            { l: "Capture on unconstrained host", to: "unconstrained" }
          ]
        },
        {
          id: "ntlm-relay",
          name: "NTLM relay",
          desc: "Forward captured/coerced NTLM authentication to a service that does not enforce signing or channel binding — SMB, LDAP(S), or AD CS web enrollment — to act as the victim.",
          tools: [
            { n: "ntlmrelayx", id: "ntlmrelayx" },
            { n: "Responder", id: "responder" },
            { n: "krbrelayx", id: "krbrelayx" }
          ],
          vuln: { l: "NTLM relay", id: "ntlm-relay-vuln" },
          next: [
            { l: "SMB signing not enforced", to: "smb-unsigned" },
            { l: "Write RBCD on the target", to: "rbcd" },
            { l: "ESC8 → machine cert", to: "adcs" }
          ]
        },
        {
          id: "smb-unsigned",
          name: "SMB signing not enforced",
          desc: "Where SMB signing is off (the default on non-DC hosts), relayed authentication can be delivered to those hosts for code execution or secrets dumping.",
          tools: [
            { n: "NetExec", id: "netexec" },
            { n: "ntlmrelayx", id: "ntlmrelayx" }
          ],
          vuln: { l: "SMB signing disabled", id: "smb-signing-disabled" },
          next: [
            { l: "Dump SAM / LSA remotely", to: "sam-lsa" }
          ]
        },
        {
          id: "password-spray",
          name: "Password spraying",
          desc: "Try one common password across many accounts (respecting lockout) once you have a user list — a single hit turns 'no creds' into a valid domain user.",
          tools: [
            { n: "kerbrute", id: "kerbrute" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: null,
          next: [
            { l: "→ Valid user stage", to: "stage-user" }
          ]
        },
        {
          id: "asrep-nocreds",
          name: "AS-REP roasting (no creds)",
          desc: "Accounts with Kerberos pre-authentication disabled hand out crackable AS-REP material to anyone who asks — sometimes recoverable with just a username list.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "Impacket", id: "impacket-suite" }
          ],
          vuln: { l: "AS-REP roasting", id: "asrep-roasting-vuln" },
          next: [
            { l: "Crack the hash", to: "crack-hashes" }
          ]
        },
        {
          id: "known-cves",
          name: "Known unauthenticated CVEs",
          desc: "Unpatched estates fall to well-known bugs — Zerologon, EternalBlue, ProxyLogon/ProxyShell, PrintNightmare. High-impact but noisy; confirm scope and patch level first.",
          tools: [
            { n: "NetExec", id: "netexec" },
            { n: "Metasploit", id: null },
            { n: "searchsploit", id: null }
          ],
          vuln: null,
          next: [
            { l: "→ Domain Admin", to: "stage-da" }
          ]
        },
        {
          id: "crack-hashes",
          name: "Crack captured hashes",
          desc: "Turn NetNTLM / AS-REP / Kerberoast material into cleartext offline with a wordlist or brute force. A cracked password is a valid credential for the next stage.",
          tools: [
            { n: "hashcat", id: null },
            { n: "John the Ripper", id: null }
          ],
          vuln: null,
          next: [
            { l: "→ Valid user stage", to: "stage-user" }
          ]
        }
      ]
    },

    {
      id: "stage-user",
      name: "Valid domain user",
      hue: "hue-cyan",
      tag: "Low-priv foothold",
      summary: "You hold a valid low-privileged domain account. Enumerate deeply, then look for a mis-set right, a roastable account, a delegation, or a certificate template that lifts you higher.",
      techniques: [
        {
          id: "domain-enum",
          name: "Domain enumeration",
          desc: "Map users, groups, ACLs, GPOs, trusts, delegation and attack paths. BloodHound turns that graph into the shortest route to Domain Admin.",
          tools: [
            { n: "BloodHound", id: "bloodhound" },
            { n: "PowerView", id: "powerview" },
            { n: "StandIn", id: "standin" },
            { n: "ADSearch", id: "adsearch" },
            { n: "ldapdomaindump", id: "ldapdomaindump" },
            { n: "PingCastle", id: "pingcastle" }
          ],
          vuln: null,
          next: [
            { l: "Kerberoast SPN accounts", to: "kerberoast" },
            { l: "Abuse an ACL", to: "acl-abuse" },
            { l: "Find delegation", to: "unconstrained" }
          ]
        },
        {
          id: "kerberoast",
          name: "Kerberoasting",
          desc: "Request service tickets for SPN-bearing accounts and crack them offline — service accounts often have weak, non-expiring passwords and high privilege.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "Impacket", id: "impacket-suite" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: { l: "Kerberoasting", id: "kerberoasting-vuln" },
          next: [
            { l: "Crack the TGS", to: "crack-hashes" }
          ]
        },
        {
          id: "asrep-user",
          name: "AS-REP roasting",
          desc: "Enumerate accounts with pre-auth disabled and roast them for crackable material now that you can query the directory as a user.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "Impacket", id: "impacket-suite" }
          ],
          vuln: { l: "AS-REP roasting", id: "asrep-roasting-vuln" },
          next: [
            { l: "Crack the hash", to: "crack-hashes" }
          ]
        },
        {
          id: "acl-abuse",
          name: "ACL / ACE abuse",
          desc: "GenericAll, WriteDACL, WriteOwner, ForceChangePassword or Self-membership over a principal chain straight into control of it — reset a password, add yourself to a group, or write RBCD.",
          tools: [
            { n: "bloodyAD", id: "bloodyad" },
            { n: "PowerView", id: "powerview" },
            { n: "StandIn", id: "standin" },
            { n: "ADCollector", id: "adcollector" },
            { n: "dacledit.py", id: null }
          ],
          vuln: { l: "AD ACL abuse", id: "ad-acl-abuse" },
          next: [
            { l: "Configure RBCD", to: "rbcd" },
            { l: "Abuse a writable GPO", to: "gpo-abuse" }
          ]
        },
        {
          id: "gpo-abuse",
          name: "GPO abuse",
          desc: "Write access to a Group Policy Object is mass code execution on every machine it applies to — schedule a task, drop a script, or add a local admin across the OU.",
          tools: [
            { n: "PowerView", id: "powerview" },
            { n: "SharpGPOAbuse", id: null },
            { n: "pyGPOAbuse", id: null }
          ],
          vuln: { l: "AD ACL abuse", id: "ad-acl-abuse" },
          next: [
            { l: "→ Local admin", to: "stage-localadmin" }
          ]
        },
        {
          id: "unconstrained",
          name: "Unconstrained delegation",
          desc: "A host trusted for unconstrained delegation caches the TGT of anyone who authenticates to it. Coerce a DC to it and steal the DC's TGT.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "Coercer", id: "coercer" },
            { n: "Impacket", id: "impacket-suite" }
          ],
          vuln: { l: "Unconstrained delegation", id: "unconstrained-delegation" },
          next: [
            { l: "Coerce the DC", to: "coerce" },
            { l: "Pass the captured ticket", to: "ptt" }
          ]
        },
        {
          id: "constrained",
          name: "Constrained delegation",
          desc: "An account with msDS-AllowedToDelegateTo can request tickets to the listed services as any user (S4U) — including impersonating a Domain Admin to that service.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "Impacket", id: "impacket-suite" }
          ],
          vuln: { l: "Constrained delegation", id: "constrained-delegation" },
          next: [
            { l: "Pass the ticket", to: "ptt" }
          ]
        },
        {
          id: "rbcd",
          name: "Resource-based constrained delegation",
          desc: "If you can write msDS-AllowedToActOnBehalfOfOtherIdentity on a computer, point it at a machine account you control and S4U to impersonate anyone on it.",
          tools: [
            { n: "StandIn", id: "standin" },
            { n: "Get-RBCD-Threaded", id: "get-rbcd-threaded" },
            { n: "Rubeus", id: "rubeus" },
            { n: "bloodyAD", id: "bloodyad" }
          ],
          vuln: { l: "Resource-based constrained delegation", id: "rbcd" },
          next: [
            { l: "Pass the ticket", to: "ptt" }
          ]
        },
        {
          id: "adcs",
          name: "AD CS abuse (ESC1–ESC10)",
          desc: "Misconfigured certificate templates and CA settings let a low-priv user enroll a certificate as a privileged principal, then authenticate as them (PKINIT).",
          tools: [
            { n: "Certipy", id: "certipy" },
            { n: "Certify", id: "certify" }
          ],
          vuln: { l: "AD CS ESC misconfigurations", id: "adcs-esc" },
          next: [
            { l: "Pass the certificate", to: "ptt" },
            { l: "Coerce → ESC8 relay", to: "coerce" }
          ]
        },
        {
          id: "shadow-creds",
          name: "Shadow credentials",
          desc: "With write access to a target's msDS-KeyCredentialLink, add your own key-credential and authenticate as them via PKINIT — no password reset, quieter than most ACL abuses.",
          tools: [
            { n: "pyWhisker", id: "pywhisker" },
            { n: "Certipy", id: "certipy" }
          ],
          vuln: { l: "AD CS / key-credential abuse", id: "adcs-esc" },
          next: [
            { l: "Pass the certificate", to: "ptt" }
          ]
        },
        {
          id: "sql-abuse",
          name: "SQL Server & database links",
          desc: "Domain SQL servers and their linked-server chains lead to command execution (xp_cmdshell) and often run as a privileged account — crawl the links to a server where you are sysadmin.",
          tools: [
            { n: "PowerUpSQL / SharpSQL", id: "powerupsql" },
            { n: "NetExec", id: "netexec" },
            { n: "Impacket (mssqlclient)", id: "impacket-suite" }
          ],
          vuln: { l: "SQL Server links", id: "sql-server-links" },
          next: [
            { l: "Lateral move via MSSQL", to: "lateral" }
          ]
        },
        {
          id: "sccm-abuse",
          name: "SCCM / MECM abuse",
          desc: "Configuration Manager holds network access accounts, can push code to clients, and trusts relayed machine auth — a rich escalation and lateral-movement surface.",
          tools: [
            { n: "SharpSCCM", id: null },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: { l: "SCCM abuse", id: "sccm-abuse" },
          next: [
            { l: "→ Local admin", to: "stage-localadmin" }
          ]
        },
        {
          id: "loot-shares",
          name: "Secrets in shares, GPP & files",
          desc: "Readable shares, SYSVOL GPP passwords, scripts and config files leak credentials constantly — hunt them across the domain once you can authenticate.",
          tools: [
            { n: "Snaffler", id: "snaffler" },
            { n: "NetExec", id: "netexec" },
            { n: "DonPAPI", id: "donpapi" }
          ],
          vuln: { l: "Stored credential harvesting", id: "stored-cred-harvest" },
          next: [
            { l: "→ Local admin", to: "stage-localadmin" }
          ]
        }
      ]
    },

    {
      id: "stage-localadmin",
      name: "Local admin / SYSTEM",
      hue: "hue-amber",
      tag: "Host compromised",
      summary: "You are administrator or SYSTEM on one or more machines. Harvest every credential in memory and on disk, impersonate tokens, and pivot toward accounts that reach the DC.",
      techniques: [
        {
          id: "local-privesc",
          name: "Local privilege escalation",
          desc: "From a user shell to SYSTEM: unquoted service paths, modifiable services, writable %PATH%, AlwaysInstallElevated, or a UAC bypass. Triage first, then exploit the cleanest vector.",
          tools: [
            { n: "SharpUp", id: "sharpup" },
            { n: "Seatbelt", id: "seatbelt" },
            { n: "winPEAS", id: null }
          ],
          vuln: { l: "Windows service privilege escalation", id: "windows-service-privesc" },
          next: [
            { l: "UAC bypass", to: "uac-bypass" },
            { l: "Token / potato abuse", to: "token-abuse" }
          ]
        },
        {
          id: "uac-bypass",
          name: "UAC bypass",
          desc: "Elevate from a medium-integrity admin to high integrity without a prompt via an auto-elevating binary or COM hijack — the prerequisite for most credential dumping.",
          tools: [
            { n: "Sliver", id: "sliver" },
            { n: "Metasploit", id: null }
          ],
          vuln: { l: "UAC bypass", id: "uac-bypass" },
          next: [
            { l: "Dump LSASS", to: "lsass" }
          ]
        },
        {
          id: "token-abuse",
          name: "Token impersonation / Potato attacks",
          desc: "A service account with SeImpersonate can be walked up to SYSTEM (JuicyPotato/PrintSpoofer/RoguePotato), or an existing privileged token stolen with incognito.",
          tools: [
            { n: "PrintSpoofer", id: null },
            { n: "RoguePotato", id: null },
            { n: "mimikatz (incognito)", id: "mimikatz" }
          ],
          vuln: { l: "Token impersonation", id: "token-impersonation" },
          next: [
            { l: "Dump credentials", to: "lsass" }
          ]
        },
        {
          id: "lsass",
          name: "Dump LSASS (live credentials)",
          desc: "LSASS holds NT hashes, Kerberos keys and sometimes cleartext for logged-on users — dump it (evasively) and reuse the material for lateral movement.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "minidumpdotnet", id: "minidumpdotnet" },
            { n: "SharpSecDump", id: "sharpsecdump" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: { l: "LSASS dumping", id: "lsass-dumping" },
          next: [
            { l: "Pass the hash", to: "pth" },
            { l: "Pass the ticket", to: "ptt" }
          ]
        },
        {
          id: "sam-lsa",
          name: "Dump SAM & LSA secrets",
          desc: "The SAM gives local account hashes (great for local-admin reuse) and LSA secrets give service-account and machine credentials — pull them locally or over SMB.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "Impacket (secretsdump)", id: "impacket-suite" },
            { n: "SharpSecDump", id: "sharpsecdump" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: { l: "SAM & LSA secrets", id: "sam-lsa-secrets" },
          next: [
            { l: "Pass the hash", to: "pth" }
          ]
        },
        {
          id: "dpapi",
          name: "DPAPI secrets",
          desc: "Windows protects browser passwords, RDP creds, Wi-Fi keys and stored credentials with DPAPI — with admin (or the user's context) those master keys unlock a trove of secrets.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "DonPAPI", id: "donpapi" }
          ],
          vuln: { l: "DPAPI abuse", id: "dpapi-abuse" },
          next: [
            { l: "Reuse recovered creds", to: "lateral" }
          ]
        },
        {
          id: "pth",
          name: "Pass-the-Hash",
          desc: "Authenticate with an NT hash instead of a password — reuse a local-admin hash across machines that share it, or a domain hash to reach new hosts.",
          tools: [
            { n: "NetExec", id: "netexec" },
            { n: "Impacket", id: "impacket-suite" },
            { n: "Evil-WinRM", id: "evil-winrm" },
            { n: "mimikatz", id: "mimikatz" }
          ],
          vuln: { l: "Pass-the-hash", id: "pass-the-hash" },
          next: [
            { l: "Lateral movement", to: "lateral" }
          ]
        },
        {
          id: "ptt",
          name: "Pass-the-Ticket / OverPtH",
          desc: "Inject a stolen or forged Kerberos ticket (or use an AES key / cert) to act as another user without their password — the currency of delegation and ticket attacks.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "mimikatz", id: "mimikatz" },
            { n: "Impacket", id: "impacket-suite" }
          ],
          vuln: { l: "Kerberos ticket attacks", id: "kerberos-ticket-attacks" },
          next: [
            { l: "Lateral movement", to: "lateral" }
          ]
        },
        {
          id: "lateral",
          name: "Lateral movement",
          desc: "Move host-to-host with recovered credentials — SMB/PsExec, WMI, WinRM, DCOM or SCShell — hunting for a session or account that reaches Domain Admin.",
          tools: [
            { n: "NetExec", id: "netexec" },
            { n: "Impacket", id: "impacket-suite" },
            { n: "Evil-WinRM", id: "evil-winrm" },
            { n: "CIMplant", id: "cimplant" },
            { n: "LACheck", id: "lacheck" }
          ],
          vuln: { l: "Remote execution", id: "remote-execution" },
          next: [
            { l: "Hunt a DA session", to: "hunt-da" }
          ]
        },
        {
          id: "hunt-da",
          name: "Hunt a Domain Admin session",
          desc: "Find a machine where a Domain Admin is logged on (you already admin it, or become admin), then steal their token or credentials to inherit DA.",
          tools: [
            { n: "BloodHound", id: "bloodhound" },
            { n: "LACheck", id: "lacheck" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: null,
          next: [
            { l: "Dump their creds", to: "lsass" },
            { l: "→ Domain Admin", to: "stage-da" }
          ]
        }
      ]
    },

    {
      id: "stage-da",
      name: "Domain Admin",
      hue: "hue-orange",
      tag: "Domain owned",
      summary: "You control the domain (DA or DC access). Extract every secret, then establish persistence that survives password resets and remediation.",
      techniques: [
        {
          id: "dcsync",
          name: "DCSync",
          desc: "Abuse directory replication to pull any account's hashes — including krbtgt — straight from a DC without touching LSASS on it. The key to golden tickets.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "Impacket (secretsdump)", id: "impacket-suite" },
            { n: "SharpSecDump", id: "sharpsecdump" },
            { n: "NetExec", id: "netexec" }
          ],
          vuln: { l: "DCSync", id: "dcsync-vuln" },
          next: [
            { l: "Forge a golden ticket", to: "tickets" },
            { l: "Grant yourself DCSync (ACL)", to: "acl-abuse" }
          ]
        },
        {
          id: "ntds",
          name: "Dump NTDS.dit",
          desc: "The domain database holds every account's hash. Extract it (drsuapi or a volume shadow copy) for full offline cracking and total credential compromise.",
          tools: [
            { n: "Impacket (secretsdump)", id: "impacket-suite" },
            { n: "NetExec", id: "netexec" },
            { n: "mimikatz", id: "mimikatz" }
          ],
          vuln: { l: "NTDS.dit extraction", id: "ntds-extraction" },
          next: [
            { l: "Crack / reuse hashes", to: "crack-hashes" }
          ]
        },
        {
          id: "tickets",
          name: "Golden / Silver / Diamond tickets",
          desc: "With the krbtgt key forge a golden ticket (any user, any group); with a service key forge a silver ticket; modify a real TGT for a stealthier diamond ticket.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "Rubeus", id: "rubeus" },
            { n: "Impacket (ticketer)", id: "impacket-suite" }
          ],
          vuln: { l: "Kerberos ticket attacks", id: "kerberos-ticket-attacks" },
          next: [
            { l: "Cross a trust", to: "stage-forest" }
          ]
        },
        {
          id: "golden-cert",
          name: "Golden certificate (CA key theft)",
          desc: "Steal the CA's private key and you can forge authentication certificates for any principal indefinitely — persistence that a krbtgt reset does not fix.",
          tools: [
            { n: "Certipy", id: "certipy" }
          ],
          vuln: { l: "AD CS abuse", id: "adcs-esc" },
          next: [
            { l: "Pass the certificate", to: "ptt" }
          ]
        },
        {
          id: "dsrm",
          name: "DSRM persistence",
          desc: "The Directory Services Restore Mode local admin on a DC can be enabled for network logon and used with pass-the-hash — a durable backdoor into the DC itself.",
          tools: [
            { n: "mimikatz", id: "mimikatz" }
          ],
          vuln: { l: "DSRM persistence", id: "dsrm-persistence" },
          next: [
            { l: "Pass the hash to the DC", to: "pth" }
          ]
        },
        {
          id: "sd-backdoor",
          name: "Security-descriptor / ACL backdoors",
          desc: "Edit the ACLs on remote WMI, WinRM, the SCM or the domain object to grant a low-priv account standing admin rights — file-less, account-less persistence.",
          tools: [
            { n: "RACE", id: "race-toolkit" },
            { n: "dacledit.py", id: null },
            { n: "PowerView", id: "powerview" }
          ],
          vuln: { l: "Security descriptor / ACL backdoors", id: "security-descriptor-backdoor" },
          next: [
            { l: "Grant DCSync rights", to: "dcsync" }
          ]
        },
        {
          id: "skeleton-dcshadow",
          name: "Skeleton Key / DCShadow",
          desc: "Skeleton Key patches LSASS on a DC to accept a master password for every account; DCShadow registers a rogue DC to push malicious directory changes stealthily.",
          tools: [
            { n: "mimikatz", id: "mimikatz" }
          ],
          vuln: null,
          next: [
            { l: "→ Cross-forest", to: "stage-forest" }
          ]
        }
      ]
    },

    {
      id: "stage-forest",
      name: "Cross-forest / Enterprise Admin",
      hue: "hue-red",
      tag: "Beyond the domain",
      summary: "One domain is compromised — now cross the trust. The forest, not the domain, is the real security boundary, so a child domain frequently reaches the forest root.",
      techniques: [
        {
          id: "trust-key",
          name: "Trust key abuse / inter-realm tickets",
          desc: "Extract the trust key shared by two domains and forge inter-realm tickets to move across the trust as a high-privileged principal.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "Rubeus", id: "rubeus" },
            { n: "Impacket", id: "impacket-suite" }
          ],
          vuln: { l: "Domain / forest trust key abuse", id: "domain-trust-key-abuse" },
          next: [
            { l: "SID history injection", to: "sid-history" }
          ]
        },
        {
          id: "sid-history",
          name: "SID history injection",
          desc: "Add the forest root's Enterprise Admins SID to a forged ticket from a child domain — where SID filtering is off, it survives the boundary and grants EA.",
          tools: [
            { n: "mimikatz", id: "mimikatz" },
            { n: "Impacket (raiseChild)", id: "impacket-suite" }
          ],
          vuln: { l: "Trust key abuse", id: "domain-trust-key-abuse" },
          next: [
            { l: "Forge a golden ticket", to: "tickets" }
          ]
        },
        {
          id: "cross-forest-deleg",
          name: "Cross-trust coercion & delegation",
          desc: "Coerce a DC in a trusting forest to authenticate to an unconstrained-delegation host you control, then reuse its ticket — trusts extend the delegation and relay attacks across boundaries.",
          tools: [
            { n: "Rubeus", id: "rubeus" },
            { n: "Coercer", id: "coercer" }
          ],
          vuln: { l: "Unconstrained delegation", id: "unconstrained-delegation" },
          next: [
            { l: "Capture the TGT", to: "unconstrained" }
          ]
        },
        {
          id: "azure-hybrid",
          name: "Hybrid / Azure AD Connect",
          desc: "Where on-prem AD syncs to Entra ID via Azure AD Connect, the sync account and its stored secrets bridge the two — compromise on-prem can reach the cloud tenant and back.",
          tools: [
            { n: "AADInternals", id: null },
            { n: "adconnectdump", id: null }
          ],
          vuln: null,
          next: []
        }
      ]
    }
  ]
};
