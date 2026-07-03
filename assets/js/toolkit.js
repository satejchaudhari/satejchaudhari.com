/*
  TOOLKIT — the data behind /toolkit.html.

  HOW TO ADD A TOOL:
  1. Find (or add) the right category object in the array below.
  2. Add one entry to its `tools` array:
     { name: "Tool Name", url: "https://...", description: "One line on what it's for." }
  3. Save and refresh toolkit.html — it renders automatically, including
     the search box (which matches against name + description).

  HOW TO ADD A NEW CATEGORY:
  Add a new object to the top-level array:
     { category: "Category Name", tools: [ ... ] }

  Double-check every URL before publishing — this page is meant to be a
  reliable jumping-off point, broken or stale links undermine that.
*/

const TOOLKIT = [
  {
    category: "Recon & OSINT",
    tools: [
      { name: "Nmap", url: "https://nmap.org/", description: "Network discovery and port scanning." },
      { name: "Amass", url: "https://github.com/owasp-amass/amass", description: "Attack surface mapping and subdomain enumeration." },
      { name: "theHarvester", url: "https://github.com/laramies/theHarvester", description: "Emails, subdomains, and names from public sources." },
      { name: "Shodan", url: "https://www.shodan.io/", description: "Search engine for internet-connected devices and services." },
      { name: "Wayback Machine", url: "https://web.archive.org/", description: "Historical snapshots of a target's public web presence." }
    ]
  },
  {
    category: "Web Application",
    tools: [
      { name: "Burp Suite", url: "https://portswigger.net/burp", description: "Intercepting proxy and toolkit for web app testing." },
      { name: "OWASP ZAP", url: "https://www.zaproxy.org/", description: "Free, open-source web app scanner and proxy." },
      { name: "ffuf", url: "https://github.com/ffuf/ffuf", description: "Fast web fuzzer for directories, params, and vhosts." },
      { name: "sqlmap", url: "https://sqlmap.org/", description: "Automated detection and exploitation of SQL injection." },
      { name: "Gobuster", url: "https://github.com/OJ/gobuster", description: "Directory, DNS, and vhost brute-forcing." }
    ]
  },
  {
    category: "Network & Active Directory",
    tools: [
      { name: "Wireshark", url: "https://www.wireshark.org/", description: "Packet capture and protocol analysis." },
      { name: "BloodHound", url: "https://github.com/SpecterOps/BloodHound", description: "Visualize Active Directory attack paths." },
      { name: "Impacket", url: "https://github.com/fortra/impacket", description: "Python classes for working with network protocols, widely used for AD attacks." },
      { name: "Responder", url: "https://github.com/lgandx/Responder", description: "LLMNR/NBT-NS/mDNS poisoner for credential capture." },
      { name: "CrackMapExec", url: "https://github.com/Porchetta-Industries/CrackMapExec", description: "Swiss-army knife for AD environment enumeration and lateral movement." }
    ]
  },
  {
    category: "Exploitation Frameworks",
    tools: [
      { name: "Metasploit", url: "https://www.metasploit.com/", description: "Exploit development and delivery framework." },
      { name: "Cobalt Strike", url: "https://www.cobaltstrike.com/", description: "Commercial adversary simulation and C2 platform." },
      { name: "Sliver", url: "https://github.com/BishopFox/sliver", description: "Open-source cross-platform C2 framework." }
    ]
  },
  {
    category: "Forensics & Reverse Engineering",
    tools: [
      { name: "Ghidra", url: "https://ghidra-sre.org/", description: "NSA-developed software reverse engineering suite." },
      { name: "IDA Free", url: "https://hex-rays.com/ida-free/", description: "Disassembler and debugger, free tier for basic use." },
      { name: "Volatility 3", url: "https://github.com/volatilityfoundation/volatility3", description: "Memory forensics framework for incident response." },
      { name: "CyberChef", url: "https://gchq.github.io/CyberChef/", description: "Browser-based swiss-army knife for encoding, decoding, and analysis." }
    ]
  },
  {
    category: "Wordlists & References",
    tools: [
      { name: "SecLists", url: "https://github.com/danielmiessler/SecLists", description: "The wordlist collection every fuzzing tool eventually points at." },
      { name: "GTFOBins", url: "https://gtfobins.github.io/", description: "Unix binaries usable to bypass local security restrictions." },
      { name: "HackTricks", url: "https://book.hacktricks.wiki/", description: "Sprawling, community-maintained pentesting reference wiki." },
      { name: "MITRE ATT&CK", url: "https://attack.mitre.org/", description: "Knowledge base of adversary tactics and techniques." }
    ]
  }
];
