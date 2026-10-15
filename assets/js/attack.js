/*
  ATTACK — data for attack.html

  A red-team MITRE ATT&CK matrix that maps THIS SITE'S content to technique IDs:
  tactics are columns, techniques are cells, and every cell links to the theory
  pages, vuln entries, interactive maps and references that cover it. It is a
  curated coverage map (the techniques this site actually documents), not the
  full ATT&CK catalogue.

  Model:
    tactics[] { id, name, short, techniques[] { id, name, links[]{label,url} } }

  Links are root-relative (attack.html lives at the site root). Edit this file,
  never attack-main.js.
*/
var ATTACK = {
  meta: {
    title: "Red Team ATT&CK Matrix",
    note: "The site's content mapped to MITRE ATT&CK. Click any linked page; use the search to jump to a technique."
  },
  tactics: [
    { id: "TA0043", name: "Reconnaissance", short: "recon", techniques: [
      { id: "T1595", name: "Active Scanning", links: [ {label:"External Red Team Workflow",url:"external-red-team-workflow.html"}, {label:"Cheatsheet — enum",url:"cheatsheet.html"} ] },
      { id: "T1589", name: "Gather Victim Identity Info", links: [ {label:"OSINT Fundamentals",url:"theory/2026-08-18-osint-fundamentals.html"}, {label:"External Red Team Workflow",url:"external-red-team-workflow.html"} ] },
      { id: "T1598", name: "Phishing for Information", links: [ {label:"Phishing & Pretext Delivery",url:"theory/2026-10-15-phishing-and-pretext-delivery.html"} ] }
    ]},
    { id: "TA0042", name: "Resource Development", short: "resdev", techniques: [
      { id: "T1583", name: "Acquire Infrastructure", links: [ {label:"C2 Infrastructure & OPSEC",url:"theory/2026-10-09-c2-infrastructure-opsec.html"} ] },
      { id: "T1587", name: "Develop Capabilities", links: [ {label:"Payload & Maldoc Tradecraft",url:"theory/2026-10-15-payload-and-maldoc-tradecraft.html"}, {label:"C2 Frameworks",url:"theory/2026-09-23-command-and-control.html"} ] },
      { id: "T1588", name: "Obtain Capabilities", links: [ {label:"Sliver C2",url:"theory/2026-09-23-sliver-c2.html"}, {label:"Fast-Path CVEs",url:"theory/2026-09-24-fast-path-cves.html"} ] }
    ]},
    { id: "TA0001", name: "Initial Access", short: "ia", techniques: [
      { id: "T1566", name: "Phishing", links: [ {label:"Phishing & Pretext Delivery",url:"theory/2026-10-15-phishing-and-pretext-delivery.html"}, {label:"Payload & Maldoc Tradecraft",url:"theory/2026-10-15-payload-and-maldoc-tradecraft.html"} ] },
      { id: "T1190", name: "Exploit Public-Facing Application", links: [ {label:"Web Pentest Checklist",url:"web-map.html"}, {label:"Perimeter → AD",url:"theory/2026-09-24-perimeter-to-ad.html"}, {label:"Vulns & Misconfigs",url:"vulns.html"} ] },
      { id: "T1133", name: "External Remote Services", links: [ {label:"External Red Team Workflow",url:"external-red-team-workflow.html"} ] },
      { id: "T1078", name: "Valid Accounts", links: [ {label:"AiTM, Token & Session Theft",url:"theory/2026-10-15-aitm-token-and-session-theft.html"}, {label:"Password Cracking",url:"theory/2026-10-09-password-cracking.html"}, {label:"Cloud Attack Map",url:"cloud-map.html"} ] }
    ]},
    { id: "TA0002", name: "Execution", short: "exec", techniques: [
      { id: "T1059", name: "Command & Scripting Interpreter", links: [ {label:"Operator Cheatsheet",url:"cheatsheet.html"}, {label:"Windows Telemetry & PS Logging",url:"theory/2026-09-23-windows-telemetry-logging.html"} ] },
      { id: "T1203", name: "Exploitation for Client Execution", links: [ {label:"Payload & Maldoc Tradecraft",url:"theory/2026-10-15-payload-and-maldoc-tradecraft.html"} ] },
      { id: "T1218", name: "System Binary Proxy Execution", links: [ {label:"LOLBAS & GTFOBins",url:"lolbas.html"}, {label:"AppLocker & WDAC Bypass",url:"theory/2026-10-08-applocker-bypass.html"} ] },
      { id: "T1204", name: "User Execution", links: [ {label:"Phishing & Pretext Delivery",url:"theory/2026-10-15-phishing-and-pretext-delivery.html"} ] },
      { id: "T1047", name: "Windows Management Instrumentation", links: [ {label:"LOLBAS & GTFOBins",url:"lolbas.html"} ] }
    ]},
    { id: "TA0003", name: "Persistence", short: "persist", techniques: [
      { id: "T1547", name: "Boot/Logon Autostart Execution", links: [ {label:"Windows Persistence",url:"theory/2026-10-09-windows-persistence.html"} ] },
      { id: "T1053", name: "Scheduled Task/Job", links: [ {label:"Windows Persistence",url:"theory/2026-10-09-windows-persistence.html"}, {label:"Linux Persistence",url:"theory/2026-10-09-linux-persistence.html"} ] },
      { id: "T1098", name: "Account Manipulation", links: [ {label:"Active Directory Persistence",url:"theory/2026-10-09-active-directory-persistence.html"}, {label:"Shadow Credentials & PKINIT",url:"theory/2026-09-24-shadow-credentials-pkinit.html"} ] },
      { id: "T1505", name: "Server Software Component (Web Shell)", links: [ {label:"File Upload Attacks",url:"theory/2026-10-15-file-upload-attacks.html"} ] },
      { id: "T1574", name: "Hijack Execution Flow", links: [ {label:"Windows Local Privilege Escalation",url:"theory/2026-10-15-windows-local-privilege-escalation.html"} ] }
    ]},
    { id: "TA0004", name: "Privilege Escalation", short: "privesc", techniques: [
      { id: "T1548", name: "Abuse Elevation Control (UAC/sudo)", links: [ {label:"Windows Access Tokens & UAC",url:"theory/2026-08-18-windows-tokens-uac.html"}, {label:"Linux Privilege Escalation",url:"theory/2026-10-09-linux-privilege-escalation.html"} ] },
      { id: "T1134", name: "Access Token Manipulation", links: [ {label:"Windows Token Abuse & Potato",url:"theory/2026-10-09-windows-token-potato.html"} ] },
      { id: "T1068", name: "Exploitation for Privilege Escalation", links: [ {label:"Fast-Path CVEs",url:"theory/2026-09-24-fast-path-cves.html"} ] },
      { id: "T1484", name: "Domain Policy Modification", links: [ {label:"Group Policy (GPO)",url:"theory/2026-08-18-group-policy.html"} ] },
      { id: "T1055", name: "Process Injection", links: [ {label:"Process Injection — Concepts & Detection",url:"theory/2026-10-15-process-injection-and-loaders.html"} ] },
      { id: "LPE", name: "Local Misconfiguration (Win/Linux)", links: [ {label:"Windows Local Privilege Escalation",url:"theory/2026-10-15-windows-local-privilege-escalation.html"}, {label:"Linux Privilege Escalation",url:"theory/2026-10-09-linux-privilege-escalation.html"} ] }
    ]},
    { id: "TA0005", name: "Defense Evasion", short: "evasion", techniques: [
      { id: "T1562", name: "Impair Defenses (AMSI/ETW)", links: [ {label:"Modern AMSI & ETW Bypasses",url:"theory/2026-10-08-amsi-bypass-modern.html"}, {label:"Windows Defense Evasion",url:"theory/2026-09-23-defense-evasion.html"} ] },
      { id: "T1218b", name: "System Binary Proxy Execution", links: [ {label:"LOLBAS & GTFOBins",url:"lolbas.html"}, {label:"AppLocker & WDAC Bypass",url:"theory/2026-10-08-applocker-bypass.html"} ] },
      { id: "T1055b", name: "Process Injection", links: [ {label:"Process Injection — Concepts & Detection",url:"theory/2026-10-15-process-injection-and-loaders.html"}, {label:"In-Memory Tradecraft",url:"theory/2026-09-23-in-memory-tradecraft.html"} ] },
      { id: "T1070", name: "Indicator Removal", links: [ {label:"Windows Telemetry & PS Logging",url:"theory/2026-09-23-windows-telemetry-logging.html"}, {label:"Logging & Telemetry",url:"theory/2026-10-09-logging-and-telemetry.html"} ] },
      { id: "T1127", name: "Trusted Developer Utilities (MSBuild)", links: [ {label:"AppLocker & WDAC Bypass",url:"theory/2026-10-08-applocker-bypass.html"} ] }
    ]},
    { id: "TA0006", name: "Credential Access", short: "credaccess", techniques: [
      { id: "T1003", name: "OS Credential Dumping", links: [ {label:"LSASS Dumping & Extraction",url:"theory/2026-10-09-lsass-credential-extraction.html"}, {label:"DCSync",url:"theory/2026-08-18-dcsync.html"}, {label:"Windows Credential Storage",url:"theory/2026-08-18-windows-credential-storage.html"} ] },
      { id: "T1558", name: "Steal or Forge Kerberos Tickets", links: [ {label:"Kerberoasting",url:"theory/2026-08-18-kerberoasting.html"}, {label:"AS-REP Roasting",url:"theory/2026-08-18-asrep-roasting.html"}, {label:"Kerberos Ticket Attacks",url:"theory/2026-08-18-ticket-attacks.html"} ] },
      { id: "T1555", name: "Credentials from Password Stores", links: [ {label:"Browser Credential & Token Theft",url:"theory/2026-10-15-browser-credential-theft.html"}, {label:"DPAPI Abuse",url:"theory/2026-10-09-dpapi-abuse.html"} ] },
      { id: "T1552", name: "Unsecured Credentials", links: [ {label:"Linux Credential Access & Looting",url:"theory/2026-10-15-linux-credential-access-and-looting.html"} ] },
      { id: "T1110", name: "Brute Force", links: [ {label:"Password Cracking",url:"theory/2026-10-09-password-cracking.html"} ] },
      { id: "T1187", name: "Forced Authentication (Coercion)", links: [ {label:"Coercion & NTLM Relay",url:"theory/2026-08-18-coercion-ntlm-relay.html"} ] },
      { id: "T1649", name: "Steal/Forge Auth Certificates", links: [ {label:"AD Certificate Services",url:"theory/2026-08-18-adcs.html"}, {label:"Shadow Credentials & PKINIT",url:"theory/2026-09-24-shadow-credentials-pkinit.html"} ] }
    ]},
    { id: "TA0007", name: "Discovery", short: "discovery", techniques: [
      { id: "T1087", name: "Account Discovery", links: [ {label:"BloodHound & AD Enumeration",url:"theory/2026-10-09-bloodhound-ad-enumeration.html"}, {label:"LDAP and the AD Database",url:"theory/2026-08-18-ldap.html"} ] },
      { id: "T1482", name: "Domain Trust Discovery", links: [ {label:"Domain and Forest Trusts",url:"theory/2026-08-18-trusts.html"} ] },
      { id: "T1046", name: "Network Service Discovery", links: [ {label:"External Red Team Workflow",url:"external-red-team-workflow.html"} ] },
      { id: "T1069", name: "Permission Groups Discovery", links: [ {label:"ACLs and DACLs",url:"theory/2026-08-18-acls-dacls.html"}, {label:"AD Attack Map",url:"ad-map.html"} ] }
    ]},
    { id: "TA0008", name: "Lateral Movement", short: "lateral", techniques: [
      { id: "T1021", name: "Remote Services (SMB/RDP/WinRM/SSH)", links: [ {label:"Linux Lateral Movement & SSH",url:"theory/2026-10-15-linux-lateral-movement-and-ssh.html"}, {label:"Operator Cheatsheet",url:"cheatsheet.html"} ] },
      { id: "T1550", name: "Use Alternate Authentication Material", links: [ {label:"Kerberos Ticket Attacks",url:"theory/2026-08-18-ticket-attacks.html"}, {label:"AD Attack Map",url:"ad-map.html"} ] },
      { id: "T1210", name: "Exploitation of Remote Services", links: [ {label:"Fast-Path CVEs",url:"theory/2026-09-24-fast-path-cves.html"} ] },
      { id: "T1572", name: "Protocol Tunneling / Pivoting", links: [ {label:"Pivoting & Tunnelling",url:"theory/2026-10-09-pivoting-and-tunnelling.html"} ] },
      { id: "T1072", name: "Software Deployment Tools (SCCM)", links: [ {label:"SCCM / MECM Abuse",url:"theory/2026-09-24-sccm-mecm-abuse.html"} ] }
    ]},
    { id: "TA0009", name: "Collection", short: "collection", techniques: [
      { id: "T1005", name: "Data from Local System", links: [ {label:"Data Collection & Exfiltration",url:"theory/2026-10-09-collection-and-exfiltration.html"} ] },
      { id: "T1039", name: "Data from Network Shared Drive", links: [ {label:"Data Collection & Exfiltration",url:"theory/2026-10-09-collection-and-exfiltration.html"} ] },
      { id: "T1213", name: "Data from Information Repositories", links: [ {label:"Data Collection & Exfiltration",url:"theory/2026-10-09-collection-and-exfiltration.html"} ] }
    ]},
    { id: "TA0011", name: "Command & Control", short: "c2", techniques: [
      { id: "T1071", name: "Application Layer Protocol", links: [ {label:"C2 Frameworks",url:"theory/2026-09-23-command-and-control.html"}, {label:"C2 Infrastructure & OPSEC",url:"theory/2026-10-09-c2-infrastructure-opsec.html"} ] },
      { id: "T1090", name: "Proxy / Pivoting", links: [ {label:"Pivoting & Tunnelling",url:"theory/2026-10-09-pivoting-and-tunnelling.html"} ] },
      { id: "T1105", name: "Ingress Tool Transfer", links: [ {label:"Operator Cheatsheet",url:"cheatsheet.html"}, {label:"LOLBAS & GTFOBins",url:"lolbas.html"} ] },
      { id: "T1573", name: "Encrypted Channel", links: [ {label:"Sliver C2",url:"theory/2026-09-23-sliver-c2.html"} ] }
    ]},
    { id: "TA0010", name: "Exfiltration", short: "exfil", techniques: [
      { id: "T1041", name: "Exfiltration Over C2 Channel", links: [ {label:"Data Collection & Exfiltration",url:"theory/2026-10-09-collection-and-exfiltration.html"} ] },
      { id: "T1048", name: "Exfiltration Over Alternative Protocol", links: [ {label:"Data Collection & Exfiltration",url:"theory/2026-10-09-collection-and-exfiltration.html"} ] },
      { id: "T1567", name: "Exfiltration Over Web Service", links: [ {label:"Data Collection & Exfiltration",url:"theory/2026-10-09-collection-and-exfiltration.html"} ] }
    ]}
  ]
};
