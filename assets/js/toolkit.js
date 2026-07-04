/*
  TOOLKIT — the data behind /toolkit.html and /tool-detail.html.

  HOW TO ADD A TOOL:
  1. Find (or add) the right category object in the array below.
  2. Add one entry to its `tools` array:
     {
       id: "unique-slug",              // required if you want a "Commands" detail page — lowercase, hyphens only
       name: "Tool Name",
       url: "https://...",             // official site — powers the "Visit site" button
       description: "One line shown on the toolkit grid card.",
       brief: "A short paragraph shown at the top of the detail page.",   // optional
       commands: [                                                        // optional
         { label: "What this command does", cmd: "the-actual-command --flag" }
       ]
     }
  3. Save and refresh — it renders automatically.

  NOTES:
  - `id` must be unique across the whole file (used to build the detail page URL: tool-detail.html?tool=your-id).
  - If a tool has no `commands` array (or it's empty), the "Commands" button
    simply won't show on its card — only the "Visit site" button will. This
    is intentional: don't add commands: [] with nothing in it, just omit the
    field entirely for GUI-only tools (Burp Suite, Ghidra, etc.).
  - Double-check every URL before publishing — this page is meant to be a
    reliable jumping-off point, broken or stale links undermine that.
*/

var TOOLKIT = [
  {
    category: "Recon & OSINT",
    tools: [
            {
        id: "nmap",
        name: "Nmap",
        url: "https://nmap.org/",
        description: "Network discovery, host enumeration, service detection, OS fingerprinting, and port scanning.",
        brief: "Nmap is the industry-standard network scanner used for host discovery, port enumeration, service/version detection, operating system fingerprinting, firewall analysis, and NSE scripting.",

        commands: [
          /* Host Discovery */
          { label: "Ping Scan (Host Discovery Only)", cmd: "nmap -sn 10.10.10.0/24" },
          { label: "Treat All Hosts As Online", cmd: "nmap -Pn 10.10.10.0/24" },
          { label: "Disable DNS Resolution", cmd: "nmap -n 10.10.10.0/24" },
          { label: "Always Resolve DNS", cmd: "nmap -R 10.10.10.0/24" },
          { label: "ICMP Echo Request Ping", cmd: "nmap -PE 10.10.10.10" },
          { label: "ICMP Timestamp Request Ping", cmd: "nmap -PP 10.10.10.10" },
          { label: "ICMP Netmask Request Ping", cmd: "nmap -PM 10.10.10.10" },
          { label: "TCP SYN Ping", cmd: "nmap -PS22,80,443 10.10.10.10" },
          { label: "TCP ACK Ping", cmd: "nmap -PA80,443 10.10.10.10" },
          { label: "UDP Ping", cmd: "nmap -PU53,161 10.10.10.10" },
          { label: "SCTP INIT Ping", cmd: "nmap -PY 10.10.10.10" },
          { label: "Disable ARP Ping", cmd: "nmap --disable-arp-ping 10.10.10.10" },

          /* Port Scanning */
          { label: "Scan Specific Ports", cmd: "nmap -p22,80,443 10.10.10.10" },
          { label: "Fast Scan", cmd: "nmap -F 10.10.10.10" },
          { label: "Top 100 Ports", cmd: "nmap --top-ports 100 10.10.10.10" },
          { label: "Full Port Scan", cmd: "nmap -p- 10.10.10.10" },

          /* Scan Techniques */
          { label: "TCP SYN Scan", cmd: "sudo nmap -sS 10.10.10.10" },
          { label: "TCP Connect Scan", cmd: "nmap -sT 10.10.10.10" },
          { label: "TCP ACK Scan", cmd: "nmap -sA 10.10.10.10" },
          { label: "UDP Scan", cmd: "sudo nmap -sU 10.10.10.10" },
          { label: "TCP Null Scan", cmd: "nmap -sN 10.10.10.10" },
          { label: "TCP FIN Scan", cmd: "nmap -sF 10.10.10.10" },
          { label: "TCP Xmas Scan", cmd: "nmap -sX 10.10.10.10" },
          { label: "TCP Window Scan", cmd: "nmap -sW 10.10.10.10" },
          { label: "TCP Maimon Scan", cmd: "nmap -sM 10.10.10.10" },
          { label: "Idle Scan", cmd: "nmap -sI zombie_host 10.10.10.10" },

          /* Service & OS Detection */
          { label: "Service Version Detection", cmd: "nmap -sV 10.10.10.10" },
          { label: "OS Detection", cmd: "sudo nmap -O 10.10.10.10" },
          { label: "Aggressive Scan", cmd: "sudo nmap -A 10.10.10.10" },
          { label: "Aggressive OS Guessing", cmd: "sudo nmap -O --osscan-guess 10.10.10.10" },

          /* NSE */
          { label: "Default NSE Scripts", cmd: "nmap -sC 10.10.10.10" },
          { label: "HTTP Enumeration Scripts", cmd: "nmap --script http* 10.10.10.10" },
          { label: "SMB Enumeration Scripts", cmd: "nmap --script smb* 10.10.10.10" },
          { label: "Vulnerability Scan", cmd: "nmap --script vuln 10.10.10.10" },

          /* Evasion */
          { label: "Fragment Packets", cmd: "sudo nmap -f 10.10.10.10" },
          { label: "Use Random Decoys", cmd: "sudo nmap -D RND:5 10.10.10.10" },
          { label: "Spoof Source IP", cmd: "sudo nmap -S 192.168.1.50 10.10.10.10" },
          { label: "Use Source Port 53", cmd: "sudo nmap -g 53 10.10.10.10" },
          { label: "Append Random Data", cmd: "sudo nmap --data-length 50 10.10.10.10" },
          { label: "Spoof MAC Address", cmd: "sudo nmap --spoof-mac 0 10.10.10.10" },

          /* Output */
          { label: "Normal Output", cmd: "nmap -oN scan.nmap 10.10.10.10" },
          { label: "XML Output", cmd: "nmap -oX scan.xml 10.10.10.10" },
          { label: "Grepable Output", cmd: "nmap -oG scan.gnmap 10.10.10.10" },
          { label: "All Output Formats", cmd: "nmap -oA scan_results 10.10.10.10" },

          /* Performance */
          { label: "Aggressive Timing", cmd: "nmap -T4 10.10.10.10" },
          { label: "Maximum Speed", cmd: "nmap -T5 10.10.10.10" },
          { label: "Set Minimum Rate", cmd: "nmap --min-rate 1000 10.10.10.10" },
          { label: "Limit Rate", cmd: "nmap --max-rate 500 10.10.10.10" },

          /* Practical */
          { label: "Fast Quick Scan", cmd: "sudo nmap -T4 -F --min-rate 300 -n -Pn 10.10.10.0/24" },
          { label: "Stealthy Evasion Scan", cmd: "sudo nmap -sS -T1 -n -Pn -f -D RND:5 --data-length 50 -g 53 10.10.10.5" },
          { label: "HTB Initial Enumeration", cmd: "sudo nmap -p- --min-rate 1000 -T4 10.10.10.10" },
          { label: "Detailed Follow-Up Scan", cmd: "sudo nmap -sC -sV -p <ports> 10.10.10.10" }
        ]
      },
      {
        id: "amass",
        name: "Amass",
        url: "https://github.com/owasp-amass/amass",
        description: "Attack surface mapping and subdomain enumeration.",
        brief: "In-depth attack surface mapping combining active recon, DNS enumeration, and OSINT data sources to build a picture of an organization's internet-facing assets.",
        commands: [
          { label: "Passive subdomain enumeration", cmd: "amass enum -passive -d example.com" },
          { label: "Active enumeration with DNS resolution", cmd: "amass enum -active -d example.com" },
          { label: "Visualize discovered assets as a graph", cmd: "amass viz -d3 -d example.com" }
        ]
      },
      {
        id: "theharvester",
        name: "theHarvester",
        url: "https://github.com/laramies/theHarvester",
        description: "Emails, subdomains, and names from public sources.",
        brief: "Gathers emails, subdomains, hosts, employee names, and open ports from public sources like search engines and certificate transparency logs — good for early-stage OSINT.",
        commands: [
          { label: "Search a domain across all supported sources", cmd: "theHarvester -d example.com -b all" },
          { label: "Limit to a specific source (e.g. crt.sh)", cmd: "theHarvester -d example.com -b crtsh" }
        ]
      },
      { name: "Shodan", url: "https://www.shodan.io/", description: "Search engine for internet-connected devices and services." },
      { name: "Wayback Machine", url: "https://web.archive.org/", description: "Historical snapshots of a target's public web presence." }
    ]
  },
  {
    category: "Web Application",
    tools: [
      { name: "Burp Suite", url: "https://portswigger.net/burp", description: "Intercepting proxy and toolkit for web app testing." },
      {
        id: "owasp-zap",
        name: "OWASP ZAP",
        url: "https://www.zaproxy.org/",
        description: "Free, open-source web app scanner and proxy.",
        brief: "Open-source web application scanner and intercepting proxy. The CLI/daemon mode is useful for scripting scans into a pipeline.",
        commands: [
          { label: "Quick baseline scan against a target", cmd: "zap-baseline.py -t https://example.com" },
          { label: "Full active scan (more thorough, noisier)", cmd: "zap-full-scan.py -t https://example.com" }
        ]
      },
      {
        id: "ffuf",
        name: "ffuf",
        url: "https://github.com/ffuf/ffuf",
        description: "Fast web fuzzer for directories, params, and vhosts.",
        brief: "Fast, flexible fuzzer written in Go — commonly used for directory/file discovery, parameter fuzzing, and virtual host enumeration.",
        commands: [
          { label: "Directory/file discovery", cmd: "ffuf -w wordlist.txt -u https://example.com/FUZZ" },
          { label: "Filter out a known response size (reduce noise)", cmd: "ffuf -w wordlist.txt -u https://example.com/FUZZ -fs 1234" },
          { label: "Virtual host discovery", cmd: "ffuf -w subdomains.txt -u https://example.com -H \"Host: FUZZ.example.com\"" }
        ]
      },
      {
        id: "sqlmap",
        name: "sqlmap",
        url: "https://sqlmap.org/",
        description: "Automated detection and exploitation of SQL injection.",
        brief: "Automates detecting and testing SQL injection points, and can enumerate databases through a confirmed injection point.",
        commands: [
          { label: "Test a URL parameter for injection", cmd: "sqlmap -u \"https://example.com/item?id=1\"" },
          { label: "Test a captured request from Burp", cmd: "sqlmap -r request.txt" },
          { label: "List databases through a confirmed injection", cmd: "sqlmap -u \"https://example.com/item?id=1\" --dbs" }
        ]
      },
      {
        id: "gobuster",
        name: "Gobuster",
        url: "https://github.com/OJ/gobuster",
        description: "Directory, DNS, and vhost brute-forcing.",
        brief: "Go-based brute-forcer for directories/files, DNS subdomains, and virtual hosts — fast and simple to use.",
        commands: [
          { label: "Directory/file brute-force", cmd: "gobuster dir -u https://example.com -w wordlist.txt" },
          { label: "DNS subdomain brute-force", cmd: "gobuster dns -d example.com -w subdomains.txt" },
          { label: "Virtual host brute-force", cmd: "gobuster vhost -u https://example.com -w subdomains.txt" }
        ]
      }
    ]
  },
  {
    category: "Network & Active Directory",
    tools: [
      {
        id: "wireshark",
        name: "Wireshark",
        url: "https://www.wireshark.org/",
        description: "Packet capture and protocol analysis.",
        brief: "The standard GUI tool for packet capture and protocol analysis. Display and capture filters are the two things worth having on hand.",
        commands: [
          { label: "Display filter: only HTTP traffic", cmd: "http" },
          { label: "Display filter: traffic to/from a host", cmd: "ip.addr == 10.10.10.10" },
          { label: "Display filter: show only SYN packets", cmd: "tcp.flags.syn == 1 && tcp.flags.ack == 0" },
          { label: "Capture filter: limit capture to one host", cmd: "host 10.10.10.10" }
        ]
      },
      { name: "BloodHound", url: "https://github.com/SpecterOps/BloodHound", description: "Visualize Active Directory attack paths." },
      {
        id: "impacket",
        name: "Impacket",
        url: "https://github.com/fortra/impacket",
        description: "Python classes for working with network protocols, widely used for AD attacks.",
        brief: "A collection of Python classes for working with network protocols (SMB, MSRPC, Kerberos, etc.), bundled with example scripts commonly used in AD assessments.",
        commands: [
          { label: "Remote command execution over SMB", cmd: "impacket-psexec domain/user:password@10.10.10.10" },
          { label: "Dump SAM/LSA secrets remotely", cmd: "impacket-secretsdump domain/user:password@10.10.10.10" },
          { label: "Request a Kerberos TGT", cmd: "impacket-getTGT domain/user:password" }
        ]
      },
      {
        id: "responder",
        name: "Responder",
        url: "https://github.com/lgandx/Responder",
        description: "LLMNR/NBT-NS/mDNS poisoner for credential capture.",
        brief: "Listens for and responds to LLMNR/NBT-NS/mDNS name resolution requests to capture NetNTLM hashes on a local network segment.",
        commands: [
          { label: "Start listening on an interface", cmd: "responder -I eth0" },
          { label: "Analyze-only mode (no poisoning, just observe)", cmd: "responder -I eth0 -A" }
        ]
      },
      {
        id: "crackmapexec",
        name: "CrackMapExec",
        url: "https://github.com/Porchetta-Industries/CrackMapExec",
        description: "Swiss-army knife for AD environment enumeration and lateral movement.",
        brief: "Enumerates and interacts with Active Directory environments over SMB/WinRM/MSSQL — validating credentials, spraying, and pulling info across many hosts at once.",
        commands: [
          { label: "Validate credentials against a subnet", cmd: "cme smb 10.10.10.0/24 -u user -p password" },
          { label: "List logged-on users on a host", cmd: "cme smb 10.10.10.10 -u user -p password --loggedon-users" }
        ]
      }
    ]
  },
  {
    category: "Exploitation Frameworks",
    tools: [
      {
        id: "metasploit",
        name: "Metasploit",
        url: "https://www.metasploit.com/",
        description: "Exploit development and delivery framework.",
        brief: "The standard framework for developing, testing, and executing exploit code, with a large built-in module library.",
        commands: [
          { label: "Launch the console", cmd: "msfconsole" },
          { label: "Search for a module", cmd: "search type:exploit platform:windows smb" },
          { label: "Use a module and check required options", cmd: "use exploit/windows/smb/ms17_010_eternalblue\nshow options" }
        ]
      },
      { name: "Cobalt Strike", url: "https://www.cobaltstrike.com/", description: "Commercial adversary simulation and C2 platform." },
      { name: "Sliver", url: "https://github.com/BishopFox/sliver", description: "Open-source cross-platform C2 framework." }
    ]
  },
  {
    category: "Forensics & Reverse Engineering",
    tools: [
      { name: "Ghidra", url: "https://ghidra-sre.org/", description: "NSA-developed software reverse engineering suite." },
      { name: "IDA Free", url: "https://hex-rays.com/ida-free/", description: "Disassembler and debugger, free tier for basic use." },
      {
        id: "volatility3",
        name: "Volatility 3",
        url: "https://github.com/volatilityfoundation/volatility3",
        description: "Memory forensics framework for incident response.",
        brief: "Open-source memory forensics framework for extracting digital artifacts from RAM captures during incident response and malware analysis.",
        commands: [
          { label: "Identify the OS profile of a memory image", cmd: "vol -f memory.dmp windows.info" },
          { label: "List running processes", cmd: "vol -f memory.dmp windows.pslist" },
          { label: "Dump network connections", cmd: "vol -f memory.dmp windows.netscan" }
        ]
      },
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
