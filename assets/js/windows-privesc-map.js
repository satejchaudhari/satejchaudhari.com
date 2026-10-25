/*
  WINDOWS PRIVILEGE ESCALATION MAP — data for windows-privesc-map.html

  Guided playbook (same engine as the AD / Cloud maps). Enumeration-focused;
  weaponisation detail lives in the linked theory pages.

  Rendered by assets/js/privmap-main.js (reads window.PRIVMAP_DATA).
*/
window.PRIVMAP_DATA = {
  meta: {
    title: "Windows Privilege Escalation — Guided Playbook",
    version: "v1",
    note: "For authorised testing and study only. Expand a stage, pick a technique, follow the pivots to SYSTEM."
  },
  palette: { slate: "#94a3b8", blue: "#3b9ee5", amber: "#f59e0b", violet: "#a78bfa", green: "#4ade80" },
  sections: [
    {
      id: "foothold", title: "Low-Privileged Shell", color: "#94a3b8", tag: "Start here",
      desc: "A shell as a standard user or a service account. Enumerate privileges and misconfigurations first.",
      techniques: [
        { id: "enum", title: "whoami /priv + automated enum",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Operator Cheatsheet", url: "cheatsheet.html" },
          desc: "whoami /priv is often the fastest win; WinPEAS surfaces the rest. Branch from what they show.",
          cmds: ["whoami /all", "whoami /priv", "systeminfo", "winpeas.exe quiet cmd fast"],
          outcomes: [{ label: "Enumeration done", color: "#94a3b8" }],
          moveTo: [
            { section: "token-privs", note: "if whoami /priv shows SeImpersonate/SeBackup/SeDebug" },
            { section: "services", note: "if services have weak permissions/paths" },
            { section: "scheduled", note: "if there are modifiable tasks/autoruns" },
            { section: "stored-creds", note: "always hunt stored credentials" },
            { section: "uac", note: "if you are a local admin stuck at medium integrity" },
            { section: "kernel", note: "if the host is behind on patches" }
          ] }
      ]
    },
    {
      id: "token-privs", title: "Dangerous Token Privileges", color: "#3b9ee5", tag: "whoami /priv",
      desc: "Service accounts frequently hold privileges that are a direct route to SYSTEM.",
      techniques: [
        { id: "impersonate", title: "SeImpersonate / SeAssignPrimaryToken (Potato)",
          theory: { label: "Windows Token Abuse & Potato Attacks", url: "theory/2026-10-09-windows-token-potato.html" },
          desc: "Held by many service accounts (IIS, MSSQL). The 'potato' family coerces a SYSTEM token and impersonates it.",
          cmds: ["whoami /priv | findstr /i impersonate"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "potato → SYSTEM" }] },
        { id: "backup", title: "SeBackup / SeRestore",
          theory: { label: "Windows Credential Storage", url: "theory/2026-08-18-windows-credential-storage.html" },
          desc: "Read any file (SeBackup) — dump the SAM/SYSTEM hives or SYSTEM-only files, then extract credentials offline.",
          cmds: ["whoami /priv | findstr /i backup", "reg save hklm\\sam sam; reg save hklm\\system system"],
          outcomes: [{ label: "SYSTEM creds", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "dump SAM → crack/pass the admin hash" }] },
        { id: "debug", title: "SeDebug",
          theory: { label: "LSASS Dumping & Credential Extraction", url: "theory/2026-10-09-lsass-credential-extraction.html" },
          desc: "Open any process — including LSASS — to dump credentials.",
          cmds: ["whoami /priv | findstr /i debug"],
          outcomes: [{ label: "SYSTEM creds", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "dump LSASS for SYSTEM/other creds" }] }
      ]
    },
    {
      id: "services", title: "Service Misconfigurations", color: "#3b9ee5", tag: "services",
      desc: "A service running as SYSTEM whose binary, configuration or path a low-priv user controls.",
      techniques: [
        { id: "weak-bin", title: "Weak binary / config permissions",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "If you can overwrite a SYSTEM service's executable, or reconfigure its binPath, it runs your code on restart.",
          cmds: ["sc query", "# check binary + service ACLs (accesschk / winPEAS 'Services')"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "replace/reconfig → SYSTEM on start" }] },
        { id: "unquoted", title: "Unquoted service path",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "A space in an unquoted service path lets Windows run an earlier file you can plant.",
          cmds: ["wmic service get name,pathname,startname | findstr /i /v \"\\\"\" | findstr /i /v \"C:\\Windows\""],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "plant the earlier-path binary" }] },
        { id: "dll", title: "DLL hijacking / search order",
          theory: { label: "Process Injection — Concepts & Detection", url: "theory/2026-10-15-process-injection-and-loaders.html" },
          desc: "A privileged process loading a DLL from a writable directory runs your DLL in its context.",
          cmds: ["# find missing/ writable-dir DLL loads (ProcMon / winPEAS)"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "DLL loads into the privileged process" }] }
      ]
    },
    {
      id: "scheduled", title: "Scheduled Tasks & Autoruns", color: "#f59e0b", tag: "scheduled",
      desc: "A SYSTEM task or autorun that executes something you can modify.",
      techniques: [
        { id: "tasks", title: "Modifiable scheduled task",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "A task running as SYSTEM whose script/binary (or its folder) is writable.",
          cmds: ["schtasks /query /fo LIST /v | findstr /i \"TaskName Run As User\""],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "task runs your code as SYSTEM" }] },
        { id: "autoruns", title: "Writable autorun / startup",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "A writable autorun registry value or startup item used by a privileged context.",
          cmds: ["# enumerate autoruns (winPEAS 'Autoruns')"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }, { label: "admin at logon", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "code runs at boot/logon" }] },
        { id: "awe", title: "AlwaysInstallElevated",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "If both policy keys are set, any user can install an MSI as SYSTEM.",
          cmds: ["reg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated",
                 "reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "install a crafted MSI as SYSTEM" }] }
      ]
    },
    {
      id: "stored-creds", title: "Stored Credentials", color: "#a78bfa", tag: "loot",
      desc: "Windows hosts accumulate secrets that skip escalation by handing you a higher-privileged account.",
      techniques: [
        { id: "files-reg", title: "Unattend / GPP / registry / cmdkey",
          theory: { label: "Windows Credential Storage", url: "theory/2026-08-18-windows-credential-storage.html" },
          vuln: { label: "Browser Credential & Token Theft", url: "theory/2026-10-15-browser-credential-theft.html" },
          desc: "Answer files, Group Policy Preferences cpassword, autologon registry, saved RDP/credential-manager entries.",
          cmds: ["findstr /si password *.xml *.ini *.config *.txt 2>nul", "cmdkey /list",
                 "reg query \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\""],
          outcomes: [{ label: "admin creds", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "reuse the recovered admin credential" }] }
      ]
    },
    {
      id: "uac", title: "UAC Bypass (medium → high)", color: "#3b9ee5", tag: "integrity",
      desc: "If you are a local admin at medium integrity, a UAC bypass gets you a high-integrity context (not a cross-account escalation).",
      techniques: [
        { id: "uac-bypass", title: "UAC bypass to high integrity",
          theory: { label: "Windows Access Tokens & UAC", url: "theory/2026-08-18-windows-tokens-uac.html" },
          desc: "Admin-group users run at medium integrity until elevated; auto-elevating binaries and hijacks reach high integrity without a prompt.",
          cmds: ["whoami /groups | findstr /i \"High Medium\"   # current integrity"],
          outcomes: [{ label: "high integrity", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "high integrity → SYSTEM routes open up" }] }
      ]
    },
    {
      id: "kernel", title: "Kernel & CVE Exploits", color: "#3b9ee5", tag: "CVE",
      desc: "Missing patches may expose a local SYSTEM exploit — match the build carefully.",
      techniques: [
        { id: "cve", title: "Patch-level / fast-path CVEs",
          theory: { label: "Fast-Path CVEs", url: "theory/2026-09-24-fast-path-cves.html" },
          desc: "Compare the patch level to known local-privilege-escalation CVEs; verify applicability before running.",
          cmds: ["systeminfo", "wmic qfe get HotFixID", "# map build+hotfixes to a known local-SYSTEM CVE"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "exploit yields SYSTEM" }] }
      ]
    },
    {
      id: "system", title: "SYSTEM / Local Admin", color: "#4ade80", tag: "You own it",
      desc: "You hold SYSTEM or local admin. Dump credentials and pivot into the domain.",
      techniques: [
        { id: "post", title: "Dump credentials & pivot",
          theory: { label: "LSASS Dumping & Credential Extraction", url: "theory/2026-10-09-lsass-credential-extraction.html" },
          vuln: { label: "AD Attack Map", url: "ad-map.html" },
          desc: "Dump LSASS and the SAM for cached/credential material, then move into the domain (DCSync, lateral movement).",
          cmds: ["# dump LSASS and SAM, then feed creds into the AD attack path"],
          outcomes: [{ label: "domain pivot", color: "#4ade80" }],
          moveTo: [{ section: "stored-creds", note: "reuse harvested creds across the estate" }] }
      ]
    }
  ]
};
