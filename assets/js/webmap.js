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
            { text: "Find the ASN(s) and owned IP ranges", desc: "Public IP ranges are grouped under Autonomous System Numbers; mapping them reveals owned netblocks and hosts that DNS alone would miss.", tools: [{ n: "Amass", id: "amass" }, { n: "Asnlookup", id: "asnlookup" }, { n: "metabigor", id: "metabigor" }, { n: "bgp.he.net", id: "bgp-he" }] },
            { text: "Review recent acquisitions and subsidiaries", desc: "Newly acquired companies often keep weaker, unmerged infrastructure, so treat each subsidiary's domains as in-scope assets.", tools: [{ n: "Crunchbase", id: "crunchbase" }] },
            { text: "Map related domains by shared registrant (reverse WHOIS)", desc: "Reverse WHOIS pivots on a shared registrant email or organisation name to surface other domains the same entity owns.", tools: [{ n: "ViewDNS", id: "viewdns" }] },
            { text: "Drop into Medium scope for each domain in turn", desc: "Once you have the full domain list, run the whole medium-scope workflow against each domain one by one." }
          ]
        },
        {
          id: "medium-scope",
          title: "Medium scope",
          scenario: "You're testing a single domain and want every subdomain and asset it exposes.",
          items: [
            { text: "Enumerate subdomains (passive, all API keys)", desc: "Passive sources (certificate logs, DNS aggregators, search engines) return known subdomains without sending a single packet to the target.", tools: [{ n: "Amass", id: "amass" }, { n: "Subfinder", id: "subfinder" }] },
            { text: "Bruteforce subdomains against a resolver list", desc: "Resolving a large candidate wordlist against the domain finds hosts that never appear in any public source.", tools: [{ n: "puredns", id: "puredns" }] },
            { text: "Permute and alter known subdomains", desc: "Generating variations of the names you already have (dev-, staging-, -uk) catches predictable hosts that brute-forcing misses.", tools: [{ n: "gotator", id: "gotator" }, { n: "ripgen", id: "ripgen" }] },
            { text: "Identify which subdomains are alive", desc: "Probing every candidate over HTTP and HTTPS keeps only the hosts that actually respond, along with their status codes and titles.", tools: [{ n: "httpx", id: "httpx" }] },
            { text: "Check every subdomain for takeover", desc: "A subdomain whose DNS still points at a de-provisioned cloud service can be claimed by an attacker, so scan every host for dangling records.", tools: [{ n: "Nuclei", id: "nuclei" }], vulns: [{ n: "Subdomain Takeover", id: "subdomain-takeover" }] },
            { text: "Enumerate exposed cloud assets (buckets, blobs)", desc: "Guessing and validating storage buckets named after the organisation often turns up publicly readable files.", tools: [{ n: "cloud_enum", id: "cloud-enum" }] },
            { text: "Search Shodan for the organisation's hosts", desc: "Shodan already indexes internet-facing services, so it surfaces exposed hosts, ports, and banners without you scanning anything.", tools: [{ n: "Shodan", id: "shodan" }] },
            { text: "Attempt a DNS zone transfer (AXFR)", desc: "A DNS server that mistakenly allows zone transfers hands you every record in the zone in a single request." },
            { text: "Run recon recursively on newly found subdomains", desc: "Feeding freshly discovered subdomains back into enumeration reaches deeper, second-level hosts.", tools: [{ n: "Amass", id: "amass" }, { n: "Subfinder", id: "subfinder" }] },
            { text: "Screenshot every live host to triage visually", desc: "Capturing every live host lets you triage hundreds of targets by eye and spot logins, dashboards, and defaults quickly.", tools: [{ n: "gowitness", id: "gowitness" }, { n: "aquatone", id: "aquatone" }] }
          ]
        },
        {
          id: "small-scope",
          title: "Small scope",
          scenario: "You're testing a single website and want to fingerprint, crawl, and mine it deeply.",
          items: [
            { text: "Fingerprint the web server, technologies, and database", desc: "Knowing the exact server, framework, and database narrows down which vulnerabilities and payloads are worth trying.", tools: [{ n: "httpx", id: "httpx" }, { n: "WhatWeb", id: "whatweb" }] },
            { text: "Fetch /robots.txt, /sitemap.xml, /.well-known/, crossdomain.xml, clientaccesspolicy.xml", desc: "These files routinely disclose hidden paths, admin areas, and endpoints the developers meant to keep out of sight." },
            { text: "Review comments in HTML and JS source", desc: "Developer comments frequently leak credentials, internal URLs, and notes about known weaknesses.", tools: [{ n: "Burp Suite", id: "burpsuite" }] },
            { text: "Enumerate directories and content", desc: "Brute-forcing paths reveals unlinked directories, backups, and admin panels that are not reachable from the UI.", tools: [{ n: "FFUF", id: "ffuf" }, { n: "Gobuster", id: "gobuster" }, { n: "feroxbuster", id: "feroxbuster" }] },
            { text: "Fuzz for hidden files and directories", desc: "Extension-aware wordlists find forgotten files such as .bak, .old, and .zip that often expose source or data.", tools: [{ n: "FFUF", id: "ffuf" }, { n: "SecLists", id: "seclists" }] },
            { text: "Search for leaked emails and credentials", desc: "Breach databases may already hold valid credentials for the target's users, so check before brute-forcing anything.", tools: [{ n: "pwndb", id: "pwndb" }] },
            { text: "Identify the WAF in front of the app", desc: "Fingerprinting the WAF tells you what will block your payloads and how to shape them to slip through.", tools: [{ n: "wafw00f", id: "wafw00f" }, { n: "WhatWaf", id: "whatwaf" }] },
            { text: "Google dorking for exposed content", desc: "Targeted search operators surface indexed sensitive files, error pages, and login portals straight from the search engine.", tools: [{ n: "Google Dorking", id: "google-dorking" }] },
            { text: "GitHub dorking for leaked code and secrets", desc: "Public repositories and commit history often expose hardcoded secrets, internal hostnames, and config files.", tools: [{ n: "git-hound", id: "git-hound" }, { n: "gitdorks_go", id: "gitdorks-go" }], vulns: [{ n: "Exposed Secrets & API Keys", id: "secrets-exposure" }] },
            { text: "Collect historical URLs", desc: "Archives such as the Wayback Machine reveal old endpoints and parameters that may still work but are no longer linked.", tools: [{ n: "gau", id: "gau" }, { n: "Wayback Machine", id: "wayback-machine" }, { n: "gospider", id: "gospider" }] },
            { text: "Filter URLs down to potentially vulnerable patterns", desc: "Pattern-matching the URL list highlights the ones carrying parameters worth testing for XSS, SSRF, LFI, and similar.", tools: [{ n: "gf-patterns", id: "gf-patterns" }] },
            { text: "Run automated XSS discovery over collected URLs", desc: "Passing collected URLs through an automated scanner flags reflected-XSS candidates quickly before manual testing.", tools: [{ n: "Dalfox", id: "dalfox" }], vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "Locate admin and login panels", desc: "Finding the authentication and admin endpoints gives you the highest-value targets for auth and access-control testing.", tools: [{ n: "FFUF", id: "ffuf" }] },
            { text: "Check for broken-link hijacking", desc: "Links pointing at expired third-party domains can be re-registered by an attacker to serve content in the site's trust context.", tools: [{ n: "broken-link-checker", id: "broken-link-checker" }] },
            { text: "Collect every JavaScript file", desc: "Client-side JavaScript maps the application's endpoints, parameters, and hidden functionality.", tools: [{ n: "subjs", id: "subjs" }, { n: "xnLinkFinder", id: "xnlinkfinder" }] },
            { text: "Hunt hardcoded API keys and secrets in JS", desc: "Front-end bundles frequently ship API keys, tokens, and internal URLs that were never meant to be public.", tools: [{ n: "Nuclei", id: "nuclei" }], vulns: [{ n: "Exposed Secrets & API Keys", id: "secrets-exposure" }] },
            { text: "Analyse JS for endpoints and words", desc: "Parsing JavaScript for endpoints and keywords expands your attack surface with routes the crawler never saw.", tools: [{ n: "subjs", id: "subjs" }, { n: "xnLinkFinder", id: "xnlinkfinder" }, { n: "JSA", id: "jsa" }] },
            { text: "Run an automated vulnerability scanner", desc: "A template-based scanner quickly flags known CVEs, misconfigurations, and exposures across every host.", tools: [{ n: "Nuclei", id: "nuclei" }] },
            { text: "Test the CORS configuration", desc: "A permissive cross-origin policy can let a malicious site read authenticated responses on the victim's behalf.", tools: [{ n: "Corsy", id: "corsy" }, { n: "CORScanner", id: "corscanner" }], vulns: [{ n: "CORS Misconfiguration", id: "cors-misconfig" }] }
          ]
        },
        {
          id: "network",
          title: "Network",
          scenario: "You have hosts/IPs in scope and want to profile exposed services and transport security.",
          items: [
            { text: "Check whether ICMP (ping) is allowed", desc: "Knowing whether ping is permitted tells you how to tune host discovery so live hosts are not missed." },
            { text: "Check DMARC / SPF / DKIM email policies", desc: "Weak or missing email-authentication records let an attacker spoof mail from the organisation's own domain.", tools: [{ n: "spoofcheck", id: "spoofcheck" }], vulns: [{ n: "Spoofable Email (SPF/DKIM/DMARC)", id: "email-spoofing" }] },
            { text: "Review open ports via Shodan", desc: "Shodan's existing scan data shows exposed ports and services without you generating any traffic.", tools: [{ n: "Shodan", id: "shodan" }] },
            { text: "Full TCP port scan of all ports", desc: "Scanning all 65,535 ports catches services hiding on non-standard ports that a top-ports scan skips.", tools: [{ n: "Nmap", id: "nmap" }] },
            { text: "Scan the common UDP ports", desc: "UDP services such as DNS, SNMP, and VPN are easy to overlook but often expose sensitive functionality.", tools: [{ n: "Nmap", id: "nmap" }, { n: "udp-proto-scanner", id: "udp-proto-scanner" }] },
            { text: "Test the SSL/TLS configuration", desc: "Auditing the TLS setup flags weak ciphers, outdated protocols, and certificate problems.", tools: [{ n: "testssl.sh", id: "testssl" }], vulns: [{ n: "Weak TLS / SSL Configuration", id: "weak-tls" }] },
            { text: "Password-spray discovered services (if you have creds)", desc: "With a valid credential and a service list, a slow spray of common passwords can find reused logins without tripping lockouts.", tools: [{ n: "brutespray", id: "brutespray" }] }
          ]
        },
        {
          id: "preparation",
          title: "Preparation",
          scenario: "Recon is done — organise everything before you start active testing.",
          items: [
            { text: "Study the site structure and user roles", desc: "Understanding how the application and its roles fit together shows where the interesting logic and access boundaries are." },
            { text: "Draft a list of test cases for every feature", desc: "A per-feature test plan makes coverage deliberate instead of ad-hoc and stops checks slipping through." },
            { text: "Understand the business area and what its users need", desc: "Understanding what the business does clarifies which flaws actually matter and what a real attacker would target." },
            { text: "Compile the asset inventory (subdomains, live hosts, wayback URLs, hidden dirs, nmap, JS files, vulnerable links)", desc: "A consolidated inventory of everything you found keeps the engagement organised so nothing is left untested." }
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
            { text: "Duplicate registration (uppercase, +1@…, dots in the name)", desc: "Try to register the same identity in disguised forms - UPPERCASE, an email +tag (user+1@site.com), or added dots (u.s.er@gmail.com) - since the app may treat each as new while the mail provider delivers them all to one inbox, letting you collide with or pre-empt a real account." },
            { text: "Overwrite an existing user (account takeover)", desc: "Register a username or email that already exists and watch whether the app updates the existing record instead of rejecting it; a successful overwrite hands you control of someone else's account.", vulns: [{ n: "Authentication Bypass", id: "auth-bypass" }] },
            { text: "Username uniqueness enforcement", desc: "Confirm the server, not just the browser, enforces uniqueness - if two concurrent or slightly-varied requests both succeed, later logic that keys on the username can be steered onto the wrong account." },
            { text: "Weak password policy (user=password, 123456, qwerty12…)", desc: "Register with deliberately terrible passwords (password, 123456, qwerty12, the username itself) to check that length, complexity, and common-password rules are enforced server-side rather than only client-side.", vulns: [{ n: "Weak Password Policy", id: "weak-password-policy" }] },
            { text: "Insufficient email verification (also my%00email@mail.com)", desc: "Check whether an account is usable before the address is verified, and try to smuggle a second address past the check with a null byte (victim%00@attacker.com) to bind your account to someone else's email.", vulns: [{ n: "Insufficient Email Verification", id: "email-verification" }] },
            { text: "Weak registration or disposable email addresses allowed", desc: "See whether throwaway domains (mailinator, guerrillamail) or malformed addresses are accepted, which enables mass fake-account creation and signals weak validation on the email field." },
            { text: "Fuzz after signup for folders created from your profile name", desc: "After signing up, fuzz for paths or files named after your profile or username - apps that auto-create a per-user directory may leave it directly reachable, exposing or overwriting other users' content." },
            { text: "Password made only of spaces", desc: "Submit a password made only of spaces; if the app trims and stores the empty result instead of rejecting it, the account can then be logged into with no password." },
            { text: "Very long password (>200 chars) causing a DoS", desc: "Send a very long password (200+ characters) - a server that hashes it uncapped with an expensive algorithm like bcrypt can be pushed into CPU exhaustion and denial of service." },
            { text: "Broken auth/session: sign up, skip verify, request reset, then check the account is active", desc: "Walk the flow out of order - sign up, skip verification, then request a password reset - and check whether the account is quietly activated, exposing a flaw in the registration/verification state machine." },
            { text: "Re-register with the same request — same and different password", desc: "Replay the exact registration request with the same and then a different password to see whether it creates duplicates or silently resets the password of an account you should not control." },
            { text: "JSON array injection in the email field {\"email\":[\"a@x\",\"b@x\"]}", desc: "If registration is JSON, send an array or extra value in the email field ({'email':['victim@x','attacker@x']}); a backend that validates the first value but delivers to the second can be tricked into binding your account to a victim's address." },
            { text: "Register with a company email where confirmation is missing", desc: "Register with an email at the target's own domain - if no confirmation is required you may inherit trust, internal roles, or SSO auto-provisioning meant only for real employees." },
            { text: "OAuth / social-media registration checks", desc: "Exercise the social sign-up path for account linking by email, missing verification, and pre-account-takeover, where you register first with a victim's email so their later social login merges into your account.", vulns: [{ n: "OAuth Misconfiguration", id: "oauth-misconfig" }] },
            { text: "State parameter on social-media registration", desc: "Confirm the OAuth state parameter is present, unpredictable, and validated on return; a missing or ignored state lets an attacker graft their authorization code onto the victim's session (login CSRF)." },
            { text: "Capture the integration URL for an integration takeover", desc: "Capture the callback/integration URL used during third-party sign-up - if it can be pointed at an attacker endpoint, the authorization code or token meant for the app is delivered to you instead." },
            { text: "Redirect handling on the register page after login", desc: "Test any redirect parameter used after registration or login for open redirect and its variants, since attackers use it to bounce victims to phishing pages under the application's trust.", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Rate limit on account creation", desc: "Automate rapid sign-ups to confirm a rate limit and CAPTCHA exist; without them the app is open to mass fake accounts, resource exhaustion, and abuse of any per-account free tier." },
            { text: "XSS in the name or email field", desc: "Place an XSS payload in the display name or email and check everywhere it is later rendered - admin panels, welcome emails, profile pages - since stored XSS here often fires in a privileged context.", vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] }
          ]
        },
        {
          id: "authentication",
          title: "Authentication",
          scenario: "Any login form or authentication endpoint.",
          items: [
            { text: "Username enumeration", desc: "Compare responses, timing, and error wording for valid versus invalid usernames across login, registration, and password reset; any observable difference lets an attacker enumerate real accounts to target.", vulns: [{ n: "Authentication Bypass", id: "auth-bypass" }] },
            { text: "Resilience to password guessing", desc: "Assess how well the login resists online guessing - lockout, throttling, CAPTCHA, and monitoring - because weak controls turn a leaked username list into compromised accounts." },
            { text: "Account-recovery function", desc: "Review every recovery path (security questions, backup email or SMS, support flow) as an alternative way in; recovery is often weaker than the primary login and bypasses it entirely." },
            { text: "“Remember me” function", desc: "Inspect the persistent-login token: is it random, revoked on password change and logout, and correctly scoped? A predictable or long-lived 'remember me' cookie is a durable account key if stolen." },
            { text: "Impersonation function", desc: "If staff can 'log in as' a user, verify it is authorised, logged, and unreachable or non-replayable by lower-privilege users, since impersonation is a direct route to any account." },
            { text: "Unsafe distribution of credentials", desc: "Check how initial or reset credentials are delivered (plaintext email, SMS, or URL) and whether they must be changed on first use; credentials sent in the clear or that never expire are easy to intercept and reuse." },
            { text: "Fail-open conditions", desc: "Force the auth backend into error or timeout states with malformed input or a downed dependency and confirm it fails closed - a system that grants access when a check errors out is trivially bypassable." },
            { text: "Multi-stage login mechanism flaws", desc: "In multi-step logins (password then OTP, or step-up auth) try to skip, reorder, or replay stages and reach the authenticated state without completing every step." },
            { text: "SQL injection in the login", desc: "Test the username and password fields for SQL injection (' OR '1'='1'-- , time-based payloads); a classic authentication bypass or data leak still lives here on legacy stacks.", tools: [{ n: "sqlmap", id: "sqlmap" }], vulns: [{ n: "SQL Injection (SQLi)", id: "sqli" }] },
            { text: "Autocomplete on sensitive fields", desc: "Confirm password and other sensitive fields disable autocomplete; on shared or public machines, cached values can otherwise be recovered by the next user." },
            { text: "Missing password confirmation on email / password / 2FA change", desc: "Attempt to change the email, password, or 2FA settings without re-entering the current password; missing confirmation lets an attacker with a hijacked session lock the real owner out permanently." },
            { text: "Login available over HTTP as well as HTTPS", desc: "If the login is reachable over plain HTTP as well as HTTPS, credentials can be captured on the wire - verify HTTP redirects to HTTPS and that HSTS is set." },
            { text: "Account lockout under brute force", desc: "Confirm repeated failures actually lock or throttle the account, and check the lockout cannot itself be abused to deny service to legitimate users." },
            { text: "Build a targeted password wordlist", desc: "Generate a candidate password list from the target's own content (site copy, employee names, product terms) with a tool like CeWL, since organisation-specific words often beat generic lists.", tools: [{ n: "CeWL", id: "cewl" }] },
            { text: "Open redirect in OAuth login", desc: "Test the OAuth redirect_uri and any post-login return URL for open redirect, which attackers chain to leak authorization codes or phish under the application's domain.", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Response tampering in SAML authentication", desc: "Intercept the SAML response and try to alter assertions (change the NameID or attributes) or strip and replace the signature (XML signature wrapping) to authenticate as another, higher-privileged user.", vulns: [{ n: "SAML Authentication Flaws", id: "saml-flaws" }] },
            { text: "OTP: guessable codes and race conditions", desc: "Check whether one-time codes are short, sequential, or reusable, and fire many verification requests in parallel to exploit race conditions that accept a code more than once or skip rate limits.", vulns: [{ n: "OTP / 2FA Bypass", id: "otp-2fa-bypass" }, { n: "Race Conditions", id: "race-condition" }] },
            { text: "OTP: response manipulation to bypass", desc: "Submit a wrong OTP and edit the server response (flip false to true, or an error code to success) to see whether the client trusts a manipulated response and lets you through.", vulns: [{ n: "OTP / 2FA Bypass", id: "otp-2fa-bypass" }] },
            { text: "OTP: brute force", desc: "Attempt to brute-force the OTP within its validity window; a short numeric code with no attempt limit or rotation is guessable in seconds.", vulns: [{ n: "OTP / 2FA Bypass", id: "otp-2fa-bypass" }] },
            { text: "JWT common flaws", desc: "Inspect the JWT for the classic weaknesses - alg:none, algorithm confusion (RS256 to HS256), weak HMAC secrets, unverified signatures, and missing expiry - any of which lets you forge a token for any user.", tools: [{ n: "jwt_tool", id: "jwt-tool" }], vulns: [{ n: "JWT Vulnerabilities", id: "jwt-vulns" }] },
            { text: "Browser cache of authenticated pages (Pragma, Expires, Max-age)", desc: "Check the cache headers on authenticated pages; without no-store/no-cache, sensitive content can be recovered from the browser cache or back button on a shared machine." },
            { text: "Open redirect / XSS via the login “next” parameter", desc: "Abuse the login 'next' or return parameter for open redirect and, where it is reflected into the page, XSS (?next=javascript:alert(1)) - both trade directly on the login page's trust.", vulns: [{ n: "Open Redirect", id: "open-redirect" }, { n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "Try default and common credentials", desc: "Try vendor defaults and common pairs (admin/admin, admin/password) on the app and any admin or device interfaces behind it; unchanged defaults are a frequent, high-impact win.", vulns: [{ n: "Default Credentials", id: "default-credentials" }] }
          ]
        },
        {
          id: "session",
          title: "Session",
          scenario: "You have a valid session or cookies to inspect.",
          items: [
            { text: "Session-handling review", desc: "Map how sessions are created, stored, transmitted, and destroyed end to end, since most session bugs are gaps in this lifecycle rather than a single missing flag." },
            { text: "Test tokens for meaning", desc: "Decode the session token and check whether it encodes meaningful data (user id, role, email) that an attacker could read or tamper with to change identity or privilege." },
            { text: "Test tokens for predictability", desc: "Collect many tokens and analyse them for structure or sequence; predictable session identifiers can be guessed to hijack other users' sessions with no interaction." },
            { text: "Insecure transmission of tokens", desc: "Confirm the session cookie is sent only over HTTPS (Secure flag) and never leaks over plain HTTP, in URLs, or to third-party domains where it could be sniffed or logged." },
            { text: "Disclosure of tokens in logs", desc: "Check that session tokens never appear in URLs, access logs, Referer headers, or error pages, since anything logged is later readable by anyone with log access." },
            { text: "Mapping of tokens to sessions", desc: "Verify each token maps to exactly one server-side session with the correct user and privileges, so it cannot be reused, shared, or desynchronised from its identity." },
            { text: "Session termination on logout", desc: "Confirm logout, timeout, and password change all invalidate the session server-side, not just clear the client cookie; a token that still works after logout is a lingering key." },
            { text: "Session fixation", desc: "Note the session id before login and confirm it is regenerated on authentication; if the same id survives, an attacker who plants it beforehand rides the victim's authenticated session.", vulns: [{ n: "Session Fixation", id: "session-fixation" }] },
            { text: "Cross-site request forgery", desc: "Test state-changing actions for CSRF - missing or loose anti-CSRF tokens, SameSite cookies, or origin checks let a malicious page act as the logged-in victim.", vulns: [{ n: "Cross-Site Request Forgery (CSRF)", id: "csrf" }] },
            { text: "Cookie scope", desc: "Review the cookie's Domain and Path; an over-broad scope (parent domain, root path) exposes the session to sibling subdomains and unrelated apps." },
            { text: "Decode the cookie (base64, hex, URL, …)", desc: "Decode the cookie through base64, hex, and URL layers to reveal what it really contains - cleartext identifiers, roles, or serialized objects are all worth attacking." },
            { text: "Cookie expiration time", desc: "Check the cookie's lifetime and whether idle and absolute timeouts are enforced server-side; excessively long-lived cookies widen the window for theft and reuse." },
            { text: "HttpOnly and Secure flags", desc: "Confirm session cookies carry HttpOnly (blocks JavaScript theft via XSS) and Secure (blocks plaintext transmission); missing flags turn a minor XSS into full session theft." },
            { text: "Reuse the cookie from a different IP or system", desc: "Replay a captured session cookie from a different IP or device; if it still works with no binding or anomaly check, a stolen cookie alone fully impersonates the user." },
            { text: "Access-control checks", desc: "Test that the session's identity and role are enforced on every sensitive request server-side, not assumed from the UI - the root of most horizontal and vertical access bugs." },
            { text: "Effectiveness of controls across multiple accounts", desc: "Using two accounts of different privilege, confirm one truly cannot reach the other's data or admin functions, verifying real enforcement rather than mere UI hiding." },
            { text: "Insecure access-control methods (request params, Referer header)", desc: "Watch for access decisions based on client-supplied values (a role parameter, hidden field, or Referer header) that a user can simply change to elevate privilege.", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Concurrent login from a different machine / IP", desc: "Log in with the same account from two machines and observe whether both sessions stay valid; unbounded concurrency can signal weak session control and complicate incident response." },
            { text: "Bypass anti-CSRF tokens", desc: "Attempt to defeat the CSRF defence - remove the token, send an empty or another user's token, change POST to GET, or swap the content-type - to check the control is truly binding.", vulns: [{ n: "Cross-Site Request Forgery (CSRF)", id: "csrf" }] },
            { text: "Weak generated security questions", desc: "Assess whether security questions have low-entropy, publicly discoverable answers (birthplace, pet name); these often offer an easier takeover route than the password." },
            { text: "Path traversal on cookies", desc: "If a cookie value is used to build a server-side file path, test it for traversal (../) to read arbitrary files or escape the intended directory.", vulns: [{ n: "Path Traversal / LFI / RFI", id: "path-traversal" }] },
            { text: "Reuse a cookie after the session is closed", desc: "After the session is closed, replay its cookie; a token that remains valid means logout does not truly terminate the session on the server." },
            { text: "Logout, then use the browser “back” button", desc: "Log out and press the browser back button to check whether authenticated pages are still viewable from cache or served without a fresh authorisation check." },
            { text: "Two tabs open: reset password in one, refresh the other", desc: "With the app open in two tabs, reset or change the password in one and refresh the other; the second session should be invalidated immediately, not keep working." },
            { text: "Repeat a privileged action with an unprivileged user's cookie", desc: "Capture a privileged action's request and replay it with a low-privilege user's session; success proves the server authorises by stored role instead of re-checking per request.", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] }
          ]
        },
        {
          id: "profile",
          title: "Profile / Account details",
          scenario: "Any page that shows or edits account data.",
          items: [
            { text: "Tamper the user-id parameter to read other users' details", desc: "Change the user identifier in profile requests to another value and see whether you can read or edit someone else's account - the canonical IDOR / broken-object-level-authorization test.", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "CSRF on account-only features", desc: "Build cross-site requests for account-only actions (change email, add a payment method) to confirm they require a valid anti-CSRF token and cannot fire from an attacker's page.", vulns: [{ n: "Cross-Site Request Forgery (CSRF)", id: "csrf" }] },
            { text: "Change email to an existing one (server-side validation?)", desc: "Set your email to one already registered and check whether the server enforces uniqueness; weak handling can merge with, collide with, or take over the other account." },
            { text: "Behaviour when an email-change link is never confirmed", desc: "Change the email but never confirm it, then test which address the app trusts - if the new address is used before confirmation, an attacker can hijack the account mid-flow." },
            { text: "File upload abuse (eicar, no size limit, extension, filter bypass, RCE)", desc: "Exercise every upload with a malicious matrix - an eicar test file, oversized files, disallowed and double extensions, content-type and magic-byte mismatches, and web-shell payloads - aiming for stored XSS or remote code execution.", tools: [{ n: "upload-scanner", id: "upload-scanner" }], vulns: [{ n: "Unrestricted File Upload", id: "file-upload" }] },
            { text: "CSV import/export injection (command, XSS, macro)", desc: "Insert formula payloads (fields beginning with =, +, -, or @) into data that ends up in exported CSVs; opened in a spreadsheet they can execute commands or exfiltrate data (formula injection)." },
            { text: "EXIF / geolocation metadata in the profile picture", desc: "Read the metadata of an uploaded or served profile image; retained EXIF can leak the uploader's GPS location, device, and software, and proves the server does not strip metadata.", tools: [{ n: "ExifTool", id: "exiftool" }] },
            { text: "ImageTragick via profile-picture upload", desc: "Upload crafted images that trigger ImageMagick parsing flaws (ImageTragick); vulnerable processing can lead to server-side request forgery or remote code execution." },
            { text: "Metadata in downloadable files (geolocation, usernames)", desc: "Pull the metadata from any downloadable document or export (PDF, Office) for author names, internal paths, and software versions that aid further attacks.", tools: [{ n: "ExifTool", id: "exiftool" }] },
            { text: "Account deletion, then reactivate via “forgot password”", desc: "Delete an account, then try to revive it via 'forgot password'; if recovery resurrects a deleted account, data-retention and de-provisioning controls are broken." },
            { text: "Brute-force enumeration when changing a unique parameter", desc: "When changing a unique field such as username or phone, watch the error responses for an oracle that lets you enumerate which values are already taken across the user base." },
            { text: "Re-authentication required for sensitive operations", desc: "Confirm high-impact actions (change email or password, disable 2FA, delete account) demand a fresh password or step-up auth, so a hijacked session cannot silently take everything over." },
            { text: "Parameter pollution (two values for the same field)", desc: "Submit the same parameter twice, or as an array, to see which value the backend honours; inconsistent handling enables mass assignment, filter bypass, and access-control tricks.", vulns: [{ n: "Mass Assignment", id: "mass-assignment" }] },
            { text: "Different-roles policy checks", desc: "Repeat each profile action across every role (user, manager, admin) to map exactly what each can see and do, exposing gaps where a lower role reaches higher-privilege functions." }
          ]
        },
        {
          id: "reset-password",
          title: "Forgot / reset password",
          scenario: "Password-reset and account-recovery flows.",
          items: [
            { text: "Session invalidated on logout and password reset", desc: "After a password reset, confirm all existing sessions and outstanding reset tokens are invalidated; if old sessions survive, whoever reset the password stays logged in even after the owner recovers." },
            { text: "Uniqueness of the reset link / code", desc: "Verify each reset link or code is unique and unpredictable per request; reused or guessable tokens let an attacker reset an account they do not control." },
            { text: "Reset-link expiration time", desc: "Check the token expires quickly and truly stops working afterwards; long-lived reset links sitting in inboxes are a standing takeover risk." },
            { text: "Tamper the user-id or other fields in the reset link", desc: "Alter the user id, email, or other parameters embedded in the reset link to point it at another account, testing for IDOR in the recovery flow.", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Request two reset links, then use the older one", desc: "Request two reset links in a row and try the first; if older tokens are not invalidated when a new one is issued, token handling is flawed and the abuse window grows." },
            { text: "Check whether many requests produce sequential tokens", desc: "Request several resets and compare the tokens for sequence or timestamp-derived structure that would let you predict a victim's token." },
            { text: "Use victim@collab.net and analyse the callback", desc: "Use an address like victim@yourcollaborator.net and watch for an out-of-band callback (Burp Collaborator), which reveals server-side request behaviour and token handling." },
            { text: "Host-header injection for token leakage", desc: "Change the Host or X-Forwarded-Host header on the reset request; if the app builds the reset link from it, the token is emailed with a link pointing at your server and leaks when clicked.", vulns: [{ n: "Host Header Injection", id: "host-header-injection" }] },
            { text: "X-Forwarded-Host: evil.com to receive the reset link", desc: "Specifically test X-Forwarded-Host: evil.com - a common variant where a proxy-trusting app uses the header to construct the reset URL, sending the victim's token to your domain." },
            { text: "Email crafting like victim@gmail.com@target.com", desc: "Try parser-confusing addresses (victim@gmail.com@attacker.com, spaces, encoded characters) so validation and delivery disagree and the victim's reset is delivered to you." },
            { text: "IDOR in the reset link", desc: "Test the reset endpoint directly for IDOR - supply another user's identifier or token and see whether you can set their password without ever seeing their email.", vulns: [{ n: "IDOR / Broken Access Control", id: "idor" }] },
            { text: "Capture a reset token and use it with another email / user id", desc: "Take a valid reset token issued for your account and submit it against a different email or user id; a token not bound to its account is an instant takeover primitive." },
            { text: "No TLD in the email parameter", desc: "Submit an email with no top-level domain or an unusual format to probe validation gaps that may accept, route, or normalise the address in an exploitable way." },
            { text: "CC injection via CRLF: victim@mail.com%0a%0dcc:hacker@mail.com", desc: "Inject CRLF into the email parameter (victim@mail.com%0d%0acc:attacker@mail.com) to smuggle an extra header and add yourself as a CC recipient of the victim's reset mail.", vulns: [{ n: "HTTP Response / Header Injection (CRLF)", id: "crlf-injection" }] },
            { text: "Very long password (>200) causing a DoS", desc: "Submit a 200+ character new password at reset time to test for the same hashing-based denial of service as at registration." },
            { text: "No rate limit — replay the request 1000+ times", desc: "Replay the reset request hundreds of times to confirm rate limiting; without it, attackers can flood victims with mail, brute-force tokens, or exhaust resources." },
            { text: "Weak encryption of the reset-password token", desc: "Analyse the token's format for weak or reversible encoding or encryption; if it is derived from predictable inputs it can be forged rather than guessed." },
            { text: "Token leak in the Referer header", desc: "Load the reset page and check whether the token in the URL leaks to third parties via the Referer header when the page loads external resources." },
            { text: "Append a second email parameter and value", desc: "Add a second email parameter and value to the reset request; parameter pollution may cause validation to check one address while the link is sent to the other." },
            { text: "Understand how the token is generated (timestamp, username, birthdate…)", desc: "Work out what the token is built from (timestamp, username, birthdate, a weak hash); a token derived from known values can be reconstructed offline." },
            { text: "Response manipulation to bypass", desc: "Force a failed reset and tamper with the server's response (status or body) to see whether the client accepts a manipulated 'success' and lets you proceed." }
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
            { text: "Fuzz all request parameters (add headers when authenticated)", desc: "Systematically fuzz every parameter - and, once authenticated, the headers and cookies too - with a broad payload set; injection bugs hide in the inputs that look boring, so coverage matters more than cleverness.", tools: [{ n: "FFUF", id: "ffuf" }, { n: "Arjun", id: "arjun" }] },
            { text: "Identify all reflected data", desc: "Map every place your input is echoed back (HTML body, attributes, JavaScript, headers), because each reflection context invites a different injection and dictates the exact payload you need." },
            { text: "Reflected XSS", desc: "Inject script payloads into parameters reflected in the response and confirm they execute in the victim's browser; reflected XSS runs in the site's own origin and is a stepping stone to session and account theft.", tools: [{ n: "Dalfox", id: "dalfox" }], vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "HTTP header injection in GET & POST (X-Forwarded-Host)", desc: "Put CRLF sequences (%0d%0a) and header-like values into inputs that end up in response headers (redirects, cookies) or request headers you control, testing for header injection and response splitting.", vulns: [{ n: "HTTP Response / Header Injection (CRLF)", id: "crlf-injection" }] },
            { text: "RCE via the Referer header", desc: "Some apps pass the Referer or other headers into shell commands, logging, or template rendering - inject command or template payloads there, since header inputs are frequently trusted and left unescaped.", vulns: [{ n: "OS Command Injection", id: "command-injection" }] },
            { text: "SQL injection via the User-Agent header", desc: "Test headers such as User-Agent and X-Forwarded-For for SQL injection; an app that logs or queries these values is a classic blind-SQLi sink that parameter-only testing misses.", tools: [{ n: "sqlmap", id: "sqlmap" }], vulns: [{ n: "SQL Injection (SQLi)", id: "sqli" }] },
            { text: "Arbitrary redirection", desc: "Feed attacker URLs into any redirect parameter and confirm the app sends the user off-site; open redirects lend phishing links the target's trust and leak tokens in OAuth flows.", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Stored attacks", desc: "For every input, check whether it is stored and later rendered to other users or admins; stored injections (XSS, SQLi, template) are higher impact because they fire automatically in someone else's session." },
            { text: "OS command injection", desc: "Where input reaches a shell (ping tools, file converters, exports), inject command separators ( ; | && $() backticks ) to run arbitrary commands on the server - one of the most severe web vulnerabilities.", tools: [{ n: "Commix", id: "commix" }], vulns: [{ n: "OS Command Injection", id: "command-injection" }] },
            { text: "Path traversal, LFI and RFI", desc: "Manipulate file-path parameters with ../ sequences and absolute paths to read files outside the intended directory (LFI) or, where remote includes are allowed, pull in attacker-hosted code (RFI).", vulns: [{ n: "Path Traversal / LFI / RFI", id: "path-traversal" }] },
            { text: "Script injection", desc: "Inject HTML or script markup into any field later rendered without encoding; if the browser executes it you have XSS - test both the immediate response and every place the value resurfaces.", vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "File inclusion", desc: "Test include, template, and language parameters (?page=, ?lang=) for local and remote file inclusion, which can leak source and config or, chained with log poisoning or PHP wrappers, reach code execution.", vulns: [{ n: "Path Traversal / LFI / RFI", id: "path-traversal" }] },
            { text: "SMTP injection", desc: "In forms that send email (contact, invite, reset), inject newline-separated SMTP headers into the name, subject, or email fields to add hidden recipients (BCC), alter headers, or relay spam through the app.", vulns: [{ n: "SMTP / Email Header Injection", id: "smtp-injection" }] },
            { text: "Native software flaws (buffer overflow, integer bugs, format strings)", desc: "Where the app fronts native code (file parsers, media processing, C/C++ backends), probe for memory-safety bugs - buffer overflows, integer overflows, format strings - that can crash or take over the process." },
            { text: "SOAP injection", desc: "For SOAP/XML web services, inject extra XML elements or malformed structures into the request body to break out of the intended data and manipulate the underlying query or application logic.", vulns: [{ n: "SOAP Injection", id: "soap-injection" }] },
            { text: "LDAP injection", desc: "In features backed by a directory (login, address book, group lookup), inject LDAP metacharacters ( * ( ) | & ) to alter the search filter, bypass authentication, or enumerate directory entries.", vulns: [{ n: "LDAP Injection", id: "ldap-injection" }] },
            { text: "SSI injection", desc: "Where Server-Side Includes are processed, inject SSI directives into stored or reflected input to run commands or read files as the web server renders the page.", vulns: [{ n: "Server-Side Includes (SSI) Injection", id: "ssi-injection" }] },
            { text: "XPath injection", desc: "For apps that query XML with XPath (often XML-based authentication or data stores), inject XPath metacharacters to bypass authentication or extract the whole document, much like SQL injection.", vulns: [{ n: "XPath Injection", id: "xpath-injection" }] },
            { text: "XXE in any request (change content-type to text/xml)", desc: "Where the app parses XML - or you can force it by switching the Content-Type to text/xml - inject external entity declarations to read local files, perform SSRF, or exfiltrate data out of band.", vulns: [{ n: "XML External Entity (XXE)", id: "xxe" }] },
            { text: "Stored XSS", desc: "Place a script payload in fields that are persisted and shown to other users (comments, profile, messages) and confirm it executes when they view it; stored XSS reaches victims with no interaction from them.", tools: [{ n: "Dalfox", id: "dalfox" }], vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "SQL injection with ' and '--+-", desc: "Test data parameters for SQL injection with quotes and comment sequences (' , '--+- , ' OR 1=1--); a hit can dump the database, bypass authentication, or in some stacks reach the operating system.", tools: [{ n: "sqlmap", id: "sqlmap" }], vulns: [{ n: "SQL Injection (SQLi)", id: "sqli" }] },
            { text: "NoSQL injection", desc: "Against NoSQL backends such as MongoDB, inject operator objects like {\"$ne\":null} or {\"$gt\":\"\"}, or server-side JavaScript, to bypass authentication and extract data, since classic SQL escaping does not apply.", tools: [{ n: "nosqli", id: "nosqli" }], vulns: [{ n: "NoSQL Injection", id: "nosqli" }] },
            { text: "HTTP request smuggling", desc: "Where a front-end and back-end disagree on request boundaries (Content-Length versus Transfer-Encoding), craft ambiguous requests to smuggle a second request - poisoning other users' responses, bypassing controls, or capturing their traffic.", vulns: [{ n: "HTTP Request Smuggling", id: "http-request-smuggling" }] },
            { text: "Open redirect", desc: "Confirm any URL-taking parameter can send users to an arbitrary external site; beyond phishing, open redirects chain into SSRF, OAuth token theft, and filter bypasses.", vulns: [{ n: "Open Redirect", id: "open-redirect" }] },
            { text: "Code injection (stored <h1> on a param)", desc: "Inject markup or code (start simple with <h1>test</h1>) into stored parameters and watch how it is rendered back; execution as HTML/script is XSS, while execution as server-side code is far more severe.", vulns: [{ n: "Cross-Site Scripting (XSS)", id: "xss" }] },
            { text: "SSRF against previously discovered open ports", desc: "Point URL, host, or file parameters at internal addresses and the open ports you found in recon (169.254.169.254, localhost, internal ranges) to make the server issue requests on your behalf and reach otherwise-unreachable services.", vulns: [{ n: "Server-Side Request Forgery (SSRF)", id: "ssrf" }] },
            { text: "xmlrpc.php DoS and user enumeration", desc: "On WordPress and similar stacks, test /xmlrpc.php for system.multicall amplification (brute force and DoS) and for pingback-based user enumeration and SSRF." },
            { text: "Dangerous HTTP methods (OPTIONS, PUT, DELETE)", desc: "Enumerate the methods the server allows with OPTIONS, then test whether PUT can upload files, DELETE can remove them, or TRACE/CONNECT are enabled - each is a direct or cross-site risk when left on.", vulns: [{ n: "Dangerous HTTP Methods", id: "dangerous-http-methods" }] },
            { text: "Discover hidden parameters", desc: "Brute-force for undocumented parameters the app still honours (debug=, admin=, id=); hidden parameters routinely unlock mass assignment, debug modes, and access-control bypasses.", tools: [{ n: "Arjun", id: "arjun" }, { n: "parameth", id: "parameth" }] },
            { text: "Insecure deserialization", desc: "Where the app deserializes user-controlled data (cookies, tokens, view state), craft malicious serialized objects with a known gadget chain to achieve code execution or logic abuse.", tools: [{ n: "ysoserial", id: "ysoserial" }], vulns: [{ n: "Insecure Deserialization", id: "insecure-deserialization" }] },
            { text: "Server-side template injection", desc: "Inject template syntax ({{7*7}}, ${7*7}, <%= 7*7 %>) into inputs rendered by a server-side template engine; if the arithmetic evaluates, you likely have a path to remote code execution.", tools: [{ n: "SSTImap", id: "sstimap" }], vulns: [{ n: "Server-Side Template Injection (SSTI)", id: "ssti" }] }
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
