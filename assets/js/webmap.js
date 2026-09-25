/*
  WEB PENTEST CHECKLIST — data for web-map.html

  A guided, colour-coded checklist: PHASES (sections) you expand, each holding
  GROUPS, each holding individual CHECK items you can tick off. Every group
  carries a "When to test" scenario so you can tell, from the feature in front
  of you, whether a check applies.

  MODEL
    meta      title / note
    sections[] {
      id, title, color(hex), tag, desc,
      groups[] {
        id, title,
        scenario : "when to test this group",
        items[] {
          text  : the check (short, plain English),
          desc  : "" -> a one-line note, filled in later (placeholder for now),
          tools : [ { n:"name", id:"toolkit-id"? } ],   // no id -> placeholder chip
          vulns : [ { n:"name", id:"vuln-id"? } ]        // no id -> placeholder chip
        }
      }
    }

  A tool/vuln chip with an `id` links into the Toolkit / Vulns & Misconfigs
  pages; without an `id` it renders as a disabled placeholder to wire up later.
*/

var WEB_MAP = {
  meta: {
    title: "Web Pentest Checklist",
    note: "For authorised testing and study only. Expand a phase, read each group's “when to test” note, and tick checks as you clear them — progress is saved in your browser."
  },

  sections: [
    {
      id: "recon",
      title: "Recon",
      color: "#3b9ee5",
      tag: "Map the surface",
      desc: "Scope the target, enumerate every asset, and profile the stack before you touch anything.",
      groups: [
        {
          id: "large-scope",
          title: "Large scope",
          scenario: "You're testing a whole organisation — multiple domains, brands, and IP ranges.",
          items: [
            { text: "Find the ASN(s) and owned IP ranges", tools: [{ n: "Amass", id: "amass" }, { n: "Asnlookup" }, { n: "metabigor" }, { n: "bgp.he.net" }] },
            { text: "Review recent acquisitions and subsidiaries", tools: [{ n: "Crunchbase" }] },
            { text: "Map related domains by shared registrant (reverse WHOIS)", tools: [{ n: "ViewDNS", id: "viewdns" }] },
            { text: "Drop into Medium scope for each domain in turn" }
          ]
        },
        {
          id: "medium-scope",
          title: "Medium scope",
          scenario: "You're testing a single domain and want every subdomain and asset it exposes.",
          items: [
            { text: "Enumerate subdomains (passive, all API keys)", tools: [{ n: "Amass", id: "amass" }, { n: "Subfinder", id: "subfinder" }] },
            { text: "Bruteforce subdomains against a resolver list", tools: [{ n: "puredns" }] },
            { text: "Permute and alter known subdomains", tools: [{ n: "gotator" }, { n: "ripgen" }] },
            { text: "Identify which subdomains are alive", tools: [{ n: "httpx" }] },
            { text: "Check every subdomain for takeover", tools: [{ n: "Nuclei", id: "nuclei" }], vulns: [{ n: "Subdomain Takeover" }] },
            { text: "Enumerate exposed cloud assets (buckets, blobs)", tools: [{ n: "cloud_enum" }] },
            { text: "Search Shodan for the organisation's hosts", tools: [{ n: "Shodan", id: "shodan" }] },
            { text: "Attempt a DNS zone transfer (AXFR)" },
            { text: "Run recon recursively on newly found subdomains", tools: [{ n: "Amass", id: "amass" }, { n: "Subfinder", id: "subfinder" }] },
            { text: "Screenshot every live host to triage visually", tools: [{ n: "gowitness" }, { n: "aquatone" }] }
          ]
        },
        {
          id: "small-scope",
          title: "Small scope",
          scenario: "You're testing a single website and want to fingerprint, crawl, and mine it deeply.",
          items: [
            { text: "Fingerprint the web server, technologies, and database", tools: [{ n: "httpx" }, { n: "WhatWeb", id: "whatweb" }] },
            { text: "Fetch /robots.txt, /sitemap.xml, /.well-known/, crossdomain.xml, clientaccesspolicy.xml" },
            { text: "Review comments in HTML and JS source", tools: [{ n: "Burp Suite", id: "burpsuite" }] },
            { text: "Enumerate directories and content", tools: [{ n: "FFUF", id: "ffuf" }, { n: "Gobuster", id: "gobuster" }, { n: "feroxbuster", id: "feroxbuster" }] },
            { text: "Fuzz for hidden files and directories", tools: [{ n: "FFUF", id: "ffuf" }, { n: "SecLists", id: "seclists" }] },
            { text: "Search for leaked emails and credentials", tools: [{ n: "pwndb" }] },
            { text: "Identify the WAF in front of the app", tools: [{ n: "wafw00f" }, { n: "WhatWaf" }] },
            { text: "Google dorking for exposed content", tools: [{ n: "Google Dorking", id: "google-dorking" }] },
            { text: "GitHub dorking for leaked code and secrets", tools: [{ n: "git-hound" }, { n: "gitdorks_go" }], vulns: [{ n: "Exposed Secrets & API Keys", id: "secrets-exposure" }] },
            { text: "Collect historical URLs", tools: [{ n: "gau" }, { n: "Wayback Machine", id: "wayback-machine" }, { n: "gospider" }] },
            { text: "Filter URLs down to potentially vulnerable patterns", tools: [{ n: "gf-patterns" }] },
            { text: "Run automated XSS discovery over collected URLs", tools: [{ n: "Dalfox", id: "dalfox" }], vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "Locate admin and login panels", tools: [{ n: "FFUF", id: "ffuf" }] },
            { text: "Check for broken-link hijacking", tools: [{ n: "broken-link-checker" }] },
            { text: "Collect every JavaScript file", tools: [{ n: "subjs" }, { n: "xnLinkFinder" }] },
            { text: "Hunt hardcoded API keys and secrets in JS", tools: [{ n: "Nuclei", id: "nuclei" }], vulns: [{ n: "Exposed Secrets & API Keys", id: "secrets-exposure" }] },
            { text: "Analyse JS for endpoints and words", tools: [{ n: "subjs" }, { n: "xnLinkFinder" }, { n: "JSA" }] },
            { text: "Run an automated vulnerability scanner", tools: [{ n: "Nuclei", id: "nuclei" }] },
            { text: "Test the CORS configuration", tools: [{ n: "Corsy" }, { n: "CORScanner" }], vulns: [{ n: "CORS Misconfiguration", id: "cors-misconfig" }] }
          ]
        },
        {
          id: "network",
          title: "Network",
          scenario: "You have hosts/IPs in scope and want to profile exposed services and transport security.",
          items: [
            { text: "Check whether ICMP (ping) is allowed" },
            { text: "Check DMARC / SPF / DKIM email policies", tools: [{ n: "spoofcheck" }], vulns: [{ n: "Spoofable Email (SPF/DKIM/DMARC)", id: "email-spoofing" }] },
            { text: "Review open ports via Shodan", tools: [{ n: "Shodan", id: "shodan" }] },
            { text: "Full TCP port scan of all ports", tools: [{ n: "Nmap", id: "nmap" }] },
            { text: "Scan the common UDP ports", tools: [{ n: "Nmap", id: "nmap" }, { n: "udp-proto-scanner" }] },
            { text: "Test the SSL/TLS configuration", tools: [{ n: "testssl.sh" }], vulns: [{ n: "Weak TLS / SSL Configuration", id: "weak-tls" }] },
            { text: "Password-spray discovered services (if you have creds)", tools: [{ n: "brutespray" }] }
          ]
        },
        {
          id: "preparation",
          title: "Preparation",
          scenario: "Recon is done — organise everything before you start active testing.",
          items: [
            { text: "Study the site structure and user roles" },
            { text: "Draft a list of test cases for every feature" },
            { text: "Understand the business area and what its users need" },
            { text: "Compile the asset inventory (subdomains, live hosts, wayback URLs, hidden dirs, nmap, JS files, vulnerable links)" }
          ]
        }
      ]
    },

    {
      id: "user-management",
      title: "User Management",
      color: "#a855f7",
      tag: "Identity lifecycle",
      desc: "Attack the whole account lifecycle — registration, login, sessions, profile, and recovery.",
      groups: [
        {
          id: "registration",
          title: "Registration",
          scenario: "The target has a sign-up / account-creation flow.",
          items: [
            { text: "Duplicate registration (uppercase, +1@…, dots in the name)" },
            { text: "Overwrite an existing user (account takeover)", vulns: [{ n: "Authentication Bypass", id: "auth-bypass" }] },
            { text: "Username uniqueness enforcement" },
            { text: "Weak password policy (user=password, 123456, qwerty12…)", vulns: [{ n: "Weak Password Policy" }] },
            { text: "Insufficient email verification (also my%00email@mail.com)", vulns: [{ n: "Insufficient Email Verification" }] },
            { text: "Weak registration or disposable email addresses allowed" },
            { text: "Fuzz after signup for folders created from your profile name" },
            { text: "Password made only of spaces" },
            { text: "Very long password (>200 chars) causing a DoS" },
            { text: "Broken auth/session: sign up, skip verify, request reset, then check the account is active" },
            { text: "Re-register with the same request — same and different password" },
            { text: "JSON array injection in the email field {\"email\":[\"a@x\",\"b@x\"]}" },
            { text: "Register with a company email where confirmation is missing" },
            { text: "OAuth / social-media registration checks", vulns: [{ n: "OAuth Misconfiguration" }] },
            { text: "State parameter on social-media registration" },
            { text: "Capture the integration URL for an integration takeover" },
            { text: "Redirect handling on the register page after login", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Rate limit on account creation" },
            { text: "XSS in the name or email field", vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] }
          ]
        },
        {
          id: "authentication",
          title: "Authentication",
          scenario: "Any login form or authentication endpoint.",
          items: [
            { text: "Username enumeration", vulns: [{ n: "Authentication Bypass", id: "auth-bypass" }] },
            { text: "Resilience to password guessing" },
            { text: "Account-recovery function" },
            { text: "“Remember me” function" },
            { text: "Impersonation function" },
            { text: "Unsafe distribution of credentials" },
            { text: "Fail-open conditions" },
            { text: "Multi-stage login mechanism flaws" },
            { text: "SQL injection in the login", tools: [{ n: "sqlmap", id: "sqlmap" }], vulns: [{ n: "SQL Injection (SQLi)", id: "sqli" }] },
            { text: "Autocomplete on sensitive fields" },
            { text: "Missing password confirmation on email / password / 2FA change" },
            { text: "Login available over HTTP as well as HTTPS" },
            { text: "Account lockout under brute force" },
            { text: "Build a targeted password wordlist", tools: [{ n: "CeWL" }] },
            { text: "Open redirect in OAuth login", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Response tampering in SAML authentication", vulns: [{ n: "SAML Authentication Flaws" }] },
            { text: "OTP: guessable codes and race conditions", vulns: [{ n: "OTP / 2FA Bypass" }, { n: "Race Conditions", id: "race-condition" }] },
            { text: "OTP: response manipulation to bypass", vulns: [{ n: "OTP / 2FA Bypass" }] },
            { text: "OTP: brute force", vulns: [{ n: "OTP / 2FA Bypass" }] },
            { text: "JWT common flaws", tools: [{ n: "jwt_tool", id: "jwt-tool" }], vulns: [{ n: "JWT Vulnerabilities", id: "jwt-vulns" }] },
            { text: "Browser cache of authenticated pages (Pragma, Expires, Max-age)" },
            { text: "Open redirect / XSS via the login “next” parameter", vulns: [{ n: "Open Redirect", id: "open-redirect" }, { n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "Try default and common credentials", vulns: [{ n: "Default Credentials", id: "default-credentials" }] }
          ]
        },
        {
          id: "session",
          title: "Session",
          scenario: "You have a valid session or cookies to inspect.",
          items: [
            { text: "Session-handling review" },
            { text: "Test tokens for meaning" },
            { text: "Test tokens for predictability" },
            { text: "Insecure transmission of tokens" },
            { text: "Disclosure of tokens in logs" },
            { text: "Mapping of tokens to sessions" },
            { text: "Session termination on logout" },
            { text: "Session fixation", vulns: [{ n: "Session Fixation" }] },
            { text: "Cross-site request forgery", vulns: [{ n: "Cross-Site Request Forgery (CSRF)", id: "csrf" }] },
            { text: "Cookie scope" },
            { text: "Decode the cookie (base64, hex, URL, …)" },
            { text: "Cookie expiration time" },
            { text: "HttpOnly and Secure flags" },
            { text: "Reuse the cookie from a different IP or system" },
            { text: "Access-control checks" },
            { text: "Effectiveness of controls across multiple accounts" },
            { text: "Insecure access-control methods (request params, Referer header)", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Concurrent login from a different machine / IP" },
            { text: "Bypass anti-CSRF tokens", vulns: [{ n: "Cross-Site Request Forgery (CSRF)", id: "csrf" }] },
            { text: "Weak generated security questions" },
            { text: "Path traversal on cookies", vulns: [{ n: "Path Traversal / LFI / RFI", id: "path-traversal" }] },
            { text: "Reuse a cookie after the session is closed" },
            { text: "Logout, then use the browser “back” button" },
            { text: "Two tabs open: reset password in one, refresh the other" },
            { text: "Repeat a privileged action with an unprivileged user's cookie", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] }
          ]
        },
        {
          id: "profile",
          title: "Profile / Account details",
          scenario: "Any page that shows or edits account data.",
          items: [
            { text: "Tamper the user-id parameter to read other users' details", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "CSRF on account-only features", vulns: [{ n: "Cross-Site Request Forgery (CSRF)", id: "csrf" }] },
            { text: "Change email to an existing one (server-side validation?)" },
            { text: "Behaviour when an email-change link is never confirmed" },
            { text: "File upload abuse (eicar, no size limit, extension, filter bypass, RCE)", tools: [{ n: "upload-scanner" }], vulns: [{ n: "Unrestricted File Upload", id: "file-upload" }] },
            { text: "CSV import/export injection (command, XSS, macro)" },
            { text: "EXIF / geolocation metadata in the profile picture", tools: [{ n: "ExifTool", id: "exiftool" }] },
            { text: "ImageTragick via profile-picture upload" },
            { text: "Metadata in downloadable files (geolocation, usernames)", tools: [{ n: "ExifTool", id: "exiftool" }] },
            { text: "Account deletion, then reactivate via “forgot password”" },
            { text: "Brute-force enumeration when changing a unique parameter" },
            { text: "Re-authentication required for sensitive operations" },
            { text: "Parameter pollution (two values for the same field)", vulns: [{ n: "Mass Assignment", id: "mass-assignment" }] },
            { text: "Different-roles policy checks" }
          ]
        },
        {
          id: "reset-password",
          title: "Forgot / reset password",
          scenario: "Password-reset and account-recovery flows.",
          items: [
            { text: "Session invalidated on logout and password reset" },
            { text: "Uniqueness of the reset link / code" },
            { text: "Reset-link expiration time" },
            { text: "Tamper the user-id or other fields in the reset link", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Request two reset links, then use the older one" },
            { text: "Check whether many requests produce sequential tokens" },
            { text: "Use victim@collab.net and analyse the callback" },
            { text: "Host-header injection for token leakage", vulns: [{ n: "Host Header Injection" }] },
            { text: "X-Forwarded-Host: evil.com to receive the reset link" },
            { text: "Email crafting like victim@gmail.com@target.com" },
            { text: "IDOR in the reset link", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Capture a reset token and use it with another email / user id" },
            { text: "No TLD in the email parameter" },
            { text: "CC injection via CRLF: victim@mail.com%0a%0dcc:hacker@mail.com", vulns: [{ n: "HTTP Response / Header Injection (CRLF)" }] },
            { text: "Very long password (>200) causing a DoS" },
            { text: "No rate limit — replay the request 1000+ times" },
            { text: "Weak encryption of the reset-password token" },
            { text: "Token leak in the Referer header" },
            { text: "Append a second email parameter and value" },
            { text: "Understand how the token is generated (timestamp, username, birthdate…)" },
            { text: "Response manipulation to bypass" }
          ]
        }
      ]
    },

    {
      id: "input-handling",
      title: "Input Handling",
      color: "#ef4444",
      tag: "Injection & reflection",
      desc: "Probe every input for injection, traversal, and unexpected reflection.",
      groups: [
        {
          id: "injection",
          title: "Injection & reflection",
          scenario: "Anywhere the app accepts input — query/body params, headers, cookies, file names, JSON and XML fields.",
          items: [
            { text: "Fuzz all request parameters (add headers when authenticated)", tools: [{ n: "FFUF", id: "ffuf" }, { n: "Arjun", id: "arjun" }] },
            { text: "Identify all reflected data" },
            { text: "Reflected XSS", tools: [{ n: "Dalfox", id: "dalfox" }], vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "HTTP header injection in GET & POST (X-Forwarded-Host)", vulns: [{ n: "HTTP Response / Header Injection (CRLF)" }] },
            { text: "RCE via the Referer header", vulns: [{ n: "OS Command Injection", id: "command-injection" }] },
            { text: "SQL injection via the User-Agent header", tools: [{ n: "sqlmap", id: "sqlmap" }], vulns: [{ n: "SQL Injection (SQLi)", id: "sqli" }] },
            { text: "Arbitrary redirection", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Stored attacks" },
            { text: "OS command injection", tools: [{ n: "Commix", id: "commix" }], vulns: [{ n: "OS Command Injection", id: "command-injection" }] },
            { text: "Path traversal, LFI and RFI", vulns: [{ n: "Path Traversal / LFI / RFI", id: "path-traversal" }] },
            { text: "Script injection" },
            { text: "File inclusion", vulns: [{ n: "Path Traversal / LFI / RFI", id: "path-traversal" }] },
            { text: "SMTP injection" },
            { text: "Native software flaws (buffer overflow, integer bugs, format strings)" },
            { text: "SOAP injection" },
            { text: "LDAP injection", vulns: [{ n: "LDAP Injection", id: "ldap-injection" }] },
            { text: "SSI injection" },
            { text: "XPath injection" },
            { text: "XXE in any request (change content-type to text/xml)", vulns: [{ n: "XML External Entity (XXE)", id: "xxe" }] },
            { text: "Stored XSS", tools: [{ n: "Dalfox", id: "dalfox" }], vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "SQL injection with ' and '--+-", tools: [{ n: "sqlmap", id: "sqlmap" }], vulns: [{ n: "SQL Injection (SQLi)", id: "sqli" }] },
            { text: "NoSQL injection", tools: [{ n: "nosqli", id: "nosqli" }], vulns: [{ n: "NoSQL Injection", id: "nosqli" }] },
            { text: "HTTP request smuggling", vulns: [{ n: "HTTP Request Smuggling" }] },
            { text: "Open redirect", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Code injection (stored <h1> on a param)", vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "SSRF against previously discovered open ports", vulns: [{ n: "Server-Side Request Forgery (SSRF)", id: "ssrf" }] },
            { text: "xmlrpc.php DoS and user enumeration" },
            { text: "Dangerous HTTP methods (OPTIONS, PUT, DELETE)" },
            { text: "Discover hidden parameters", tools: [{ n: "Arjun", id: "arjun" }, { n: "parameth" }] },
            { text: "Insecure deserialization", tools: [{ n: "ysoserial", id: "ysoserial" }], vulns: [{ n: "Insecure Deserialization", id: "insecure-deserialization" }] },
            { text: "Server-side template injection", tools: [{ n: "SSTImap", id: "sstimap" }], vulns: [{ n: "Server-Side Template Injection (SSTI)", id: "ssti" }] }
          ]
        }
      ]
    },

    {
      id: "error-handling",
      title: "Error Handling",
      color: "#e8912e",
      tag: "Force error states",
      desc: "Push the app into error states to leak stack traces, paths, and logic.",
      groups: [
        {
          id: "errors",
          title: "Error generation",
          scenario: "Use these to see how the app behaves on malformed or unexpected input.",
          items: [
            { text: "Request custom / non-existent pages (/whatever_fake.php, .aspx, .html)", vulns: [{ n: "Verbose Errors & Info Disclosure", id: "verbose-errors" }] },
            { text: "Add multiple GET & POST parameters with different values" },
            { text: "Inject \"[]\", \"]]\", \"[[\" in cookie and parameter values" },
            { text: "Generate an error with /~randomthing/%s at the end of the URL" },
            { text: "Fuzz inputs to generate error codes", tools: [{ n: "Burp Suite", id: "burpsuite" }] },
            { text: "Try unusual HTTP verbs (PATCH, DEBUG) or invalid ones (FAKE)" }
          ]
        }
      ]
    },

    {
      id: "application-logic",
      title: "Application Logic",
      color: "#2fd44f",
      tag: "Break the workflow",
      desc: "Break assumptions in multi-step flows, pricing, discounts, and trust boundaries.",
      groups: [
        {
          id: "logic",
          title: "Business & logic flaws",
          scenario: "Workflows and business features — checkout, transfers, discounts, and multi-step processes.",
          items: [
            { text: "Identify the logic attack surface" },
            { text: "Test transmission of data via the client" },
            { text: "Test reliance on client-side input validation" },
            { text: "Thick-client components (Java, ActiveX, Flash)" },
            { text: "Multi-stage processes for logic flaws" },
            { text: "Handling of incomplete input" },
            { text: "Trust boundaries" },
            { text: "Transaction logic" },
            { text: "CAPTCHA present on email forms to stop flooding" },
            { text: "Tamper product id, price, or quantity in any action", vulns: [{ n: "Business Logic Flaws", id: "business-logic" }] },
            { text: "Tamper gift or discount codes", vulns: [{ n: "Business Logic Flaws", id: "business-logic" }] },
            { text: "Reuse gift codes" },
            { text: "Parameter pollution to use a gift code twice", vulns: [{ n: "Mass Assignment", id: "mass-assignment" }] },
            { text: "Stored XSS in non-limited fields like address", vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "Payment form: is CVV / card number in clear text or masked?" },
            { text: "Is payment processed by the app itself or a third party?" },
            { text: "IDOR on another user's ticket / cart / shipment", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Test credit-card numbers accepted (4111 1111 1111 1111)" },
            { text: "IDOR in PRINT / PDF generation", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Unsubscribe button leading to user enumeration" },
            { text: "Parameter pollution on social-media sharing links" },
            { text: "Change sensitive POST requests to GET" }
          ]
        }
      ]
    },

    {
      id: "other",
      title: "Other Checks",
      color: "#8a94a8",
      tag: "Infra, CAPTCHA, headers",
      desc: "Infrastructure, CAPTCHA robustness, and response-header hygiene.",
      groups: [
        {
          id: "infrastructure",
          title: "Infrastructure",
          scenario: "Against the hosting environment and web server itself.",
          items: [
            { text: "Segregation in shared infrastructure" },
            { text: "Segregation between hosted applications" },
            { text: "Web-server vulnerabilities", tools: [{ n: "Nikto", id: "nikto" }, { n: "Nuclei", id: "nuclei" }] },
            { text: "Dangerous HTTP methods" },
            { text: "Proxy functionality" },
            { text: "Virtual-host misconfiguration", tools: [{ n: "VHostScan" }], vulns: [{ n: "Virtual Host Misconfiguration" }] },
            { text: "Internal numeric IPs in requests" },
            { text: "External numeric IPs — resolve them" },
            { text: "Test cloud storage" },
            { text: "Alternative channels (www.web.com vs m.web.com)" }
          ]
        },
        {
          id: "captcha",
          title: "CAPTCHA",
          scenario: "Wherever a CAPTCHA gates an action.",
          items: [
            { text: "Send an old CAPTCHA value" },
            { text: "Send an old CAPTCHA value with an old session id" },
            { text: "Request the CAPTCHA image by absolute path" },
            { text: "Block the CAPTCHA with an adblocker and request again" },
            { text: "Bypass it with an OCR tool" },
            { text: "Change the request from POST to GET" },
            { text: "Remove the CAPTCHA parameter" },
            { text: "Convert a JSON request to a normal form request" },
            { text: "Try header injections" }
          ]
        },
        {
          id: "security-headers",
          title: "Security Headers",
          scenario: "Check these response headers on every in-scope host.",
          items: [
            { text: "X-XSS-Protection", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "Strict-Transport-Security", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "Content-Security-Policy", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "Public-Key-Pins", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "X-Frame-Options", vulns: [{ n: "Clickjacking", id: "clickjacking" }] },
            { text: "X-Content-Type-Options", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "Referrer-Policy", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "Cache-Control", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] },
            { text: "Expires", vulns: [{ n: "Missing Security Headers", id: "missing-security-headers" }] }
          ]
        }
      ]
    }
  ]
};
