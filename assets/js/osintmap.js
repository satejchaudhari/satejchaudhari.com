/*
  OSINT WORKFLOW — data for osint-map.html (rendered by osintmap-main.js).

  STATUS: work in progress. Coverage is broad but still being filled out and
  refined — items, notes and chips will keep changing.

  MODEL (same shape as webmap.js):
    OSINT_MAP = {
      meta: { title, note },
      sections: [ {                       // a PHASE / domain
        id, title, color, tag, desc,
        groups: [ {                       // a GROUP of related checks
          id, title, scenario,            // scenario = "when to use this group"
          items: [ {
            text,                          // the check, short
            desc,                          // one-line note
            tools: [ { n, id? , url? } ],  // id -> toolkit entry; url -> external; neither -> placeholder
            vulns: [ { n, url? } ]         // reference chips (OSINT has few vuln links)
          } ]
        } ]
      } ]
    }

  Edit THIS file for content; never edit osintmap-main.js.
*/

var OSINT_MAP = {
  meta: {
    title: "OSINT Workflow",
    note: "A phase-by-phase open-source intelligence workflow. Work in progress."
  },
  sections: [

    /* ------------------------------------------------------------------ */
    {
      id: "planning",
      title: "Planning, Scope & Legal",
      color: "#22d3ee",
      tag: "Pre-engagement",
      desc: "Set the objective, the authority to collect, and the boundaries before touching a single source.",
      groups: [
        {
          id: "pl-objective",
          title: "Define the objective",
          scenario: "the very start of any investigation — before you collect anything.",
          items: [
            { text: "Write the intelligence requirement as a question", desc: "State exactly what decision the intelligence supports (who / what / where), so collection stays focused and not open-ended." },
            { text: "List the selectors you already hold", desc: "Name, email, username, phone, domain, image, company — your starting pivot points drive which phases apply." },
            { text: "Set success criteria and a stop condition", desc: "Decide what 'enough' looks like so you do not rabbit-hole; OSINT expands without limit." }
          ]
        },
        {
          id: "pl-legal",
          title: "Authority, legality & ethics",
          scenario: "always — collection without authority or outside the law is not OSINT, it is a liability.",
          items: [
            { text: "Confirm written authorisation / scope", desc: "For an engagement, confirm the target, the selectors in scope, and what is explicitly off-limits (personal accounts, family, etc.)." },
            { text: "Check jurisdiction and data-protection law", desc: "GDPR and similar laws constrain collecting and storing personal data even from public sources; know what applies.", tools: [ { n: "GDPR", url: "https://gdpr-info.eu/" } ] },
            { text: "Respect platform terms and the passive boundary", desc: "Logging in, scraping, or interacting can breach ToS and crosses from passive to active collection — decide deliberately." },
            { text: "Keep an audit trail of sources and timestamps", desc: "Record where each fact came from and when; intelligence that cannot be sourced cannot be trusted or defended." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "opsec",
      title: "OPSEC & Managed Attribution",
      color: "#818cf8",
      tag: "Tradecraft",
      desc: "Keep the investigation from touching the target, and keep yourself out of your own collection.",
      groups: [
        {
          id: "op-infra",
          title: "Research environment",
          scenario: "before interacting with any target-controlled surface (their site, their social posts, their files).",
          items: [
            { text: "Use a dedicated VM / clean browser profile", desc: "Isolate research from your real identity, cookies and history; snapshot so you can roll back." },
            { text: "Route through a VPN / non-attributable egress", desc: "Avoid revealing your real IP (and employer netblock) to target-controlled servers and tracking links." },
            { text: "Disable refer- and tracking-leaks", desc: "Watch for link shorteners, tracking pixels and 'who viewed' features (e.g. LinkedIn) that tip off the target." }
          ]
        },
        {
          id: "op-puppets",
          title: "Sock puppets",
          scenario: "when a source needs an account to view, or you must blend into a community.",
          items: [
            { text: "Build aged, believable research accounts", desc: "Pre-built personas with history; never use real or employer accounts to view a target." },
            { text: "Separate puppets per platform / investigation", desc: "Avoid cross-contamination that links personas together or back to you." },
            { text: "Mind account-view and suggestion leaks", desc: "Platforms surface 'people you may know' from contacts, logins and device signals — compartmentalise hard." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "seed",
      title: "Seed Data & Pivot Points",
      color: "#c4b5fd",
      tag: "Scoping",
      desc: "Turn what you have into more selectors; OSINT is a graph you expand by pivoting one datum into the next.",
      groups: [
        {
          id: "sd-pivot",
          title: "Map your pivots",
          scenario: "right after scoping — lay out every selector so you know which phases to run.",
          items: [
            { text: "Normalise each selector", desc: "Canonical form of names, handles, emails, phones and domains so searches match (e.g. E.164 for phones)." },
            { text: "Record the entity graph as you go", desc: "Keep people, orgs, domains, accounts and their links in one place — feeds the analysis phase.", tools: [ { n: "Maltego", id: "maltego" }, { n: "OSINT Framework", url: "https://osintframework.com/" } ] },
            { text: "Decide the primary pivot order", desc: "Email -> accounts -> breaches, or domain -> infra -> people; sequence by what your objective needs first." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "org",
      title: "Organisation & Business Recon",
      color: "#f59e0b",
      tag: "Corporate",
      desc: "Understand the company: legal entity, structure, people, suppliers and footprint.",
      groups: [
        {
          id: "or-entity",
          title: "Corporate records",
          scenario: "when the target is a company, or you need to tie a person to an organisation.",
          items: [
            { text: "Pull the legal entity and filings", desc: "Registration, officers, addresses and ownership from the companies registry.", tools: [ { n: "OpenCorporates", url: "https://opencorporates.com/" }, { n: "Companies House", url: "https://find-and-update.company-information.service.gov.uk/" } ] },
            { text: "Check financial / regulatory filings", desc: "Public companies disclose structure, subsidiaries and risk in filings.", tools: [ { n: "SEC EDGAR", url: "https://www.sec.gov/edgar/search/" } ] },
            { text: "Map subsidiaries, brands and acquisitions", desc: "Expands the domain and people footprint well beyond the primary name.", tools: [ { n: "Crunchbase", url: "https://www.crunchbase.com/" } ] }
          ]
        },
        {
          id: "or-footprint",
          title: "Public footprint",
          scenario: "to build the org chart and find technology, locations and suppliers.",
          items: [
            { text: "Harvest job postings", desc: "Vacancies leak the exact tech stack, tooling, versions and internal team names." },
            { text: "Enumerate employees and roles", desc: "Build an org chart and naming convention from professional networks.", tools: [ { n: "CrossLinked" }, { n: "theHarvester", id: "theharvester" } ] },
            { text: "Find physical locations and site imagery", desc: "Offices, badges, desk photos and signage for pretexting and GEOINT." },
            { text: "Review news, press and court records", desc: "Mergers, incidents, litigation and leadership changes that shape the picture." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "domain",
      title: "Domains, DNS & Infrastructure",
      color: "#38bdf8",
      tag: "Infra",
      desc: "Map the target's internet-facing namespace: registration, DNS, subdomains and certificates.",
      groups: [
        {
          id: "dm-whois",
          title: "Registration & WHOIS",
          scenario: "once you have a domain or are hunting for related ones.",
          items: [
            { text: "Run WHOIS / RDAP on the domain", desc: "Registrar, dates, name servers and (where not redacted) registrant contact.", tools: [ { n: "whois" }, { n: "RDAP", url: "https://lookup.icann.org/" } ] },
            { text: "Pivot on registrant email / org to find sibling domains", desc: "Reverse-WHOIS links domains registered by the same entity.", tools: [ { n: "WhoisXML / ViewDNS", url: "https://viewdns.info/" } ] },
            { text: "Check historical WHOIS", desc: "Pre-privacy records often still expose the original owner." }
          ]
        },
        {
          id: "dm-dns",
          title: "DNS records",
          scenario: "to understand mail, hosting and services behind the name.",
          items: [
            { text: "Enumerate A/AAAA/MX/NS/TXT/SOA records", desc: "Maps hosting, mail providers, SPF/DKIM/DMARC and verification tokens that reveal SaaS in use.", tools: [ { n: "dig" }, { n: "dnsrecon" } ] },
            { text: "Attempt a zone transfer (AXFR)", desc: "A misconfigured NS can hand over the whole zone.", tools: [ { n: "dig" } ] },
            { text: "Query passive DNS", desc: "Historical resolutions reveal old IPs, shared hosting and related hostnames without touching the target.", tools: [ { n: "SecurityTrails", url: "https://securitytrails.com/" } ] }
          ]
        },
        {
          id: "dm-subs",
          title: "Subdomain & certificate discovery",
          scenario: "to widen the attack surface and find forgotten / dev hosts.",
          items: [
            { text: "Enumerate subdomains passively", desc: "Aggregate from many passive sources before any active probing.", tools: [ { n: "amass", id: "amass" }, { n: "subfinder", id: "subfinder" }, { n: "theHarvester", id: "theharvester" } ] },
            { text: "Mine Certificate Transparency logs", desc: "CT logs list hostnames on issued certs — including internal-looking ones.", tools: [ { n: "crt.sh", url: "https://crt.sh/" } ] },
            { text: "Resolve and triage live hosts", desc: "Which subdomains resolve, respond, and what they run.", tools: [ { n: "nmap", id: "nmap" }, { n: "whatweb", id: "whatweb" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "hosts",
      title: "Hosts, Ports & Internet Assets",
      color: "#2dd4bf",
      tag: "Attack surface",
      desc: "Find exposed services, netblocks and devices using internet-wide scan data — passively.",
      groups: [
        {
          id: "ho-scandata",
          title: "Internet scan engines",
          scenario: "to see open ports, banners and exposed devices without scanning the target yourself.",
          items: [
            { text: "Search the target in device search engines", desc: "Open ports, service banners, product/versions, screenshots and favicons — all pre-collected.", tools: [ { n: "Shodan", id: "shodan" }, { n: "Censys", id: "censys" }, { n: "FOFA", url: "https://fofa.info/" } ] },
            { text: "Pivot on favicon hash / TLS cert / title", desc: "Find other hosts sharing the same asset, revealing related infrastructure." },
            { text: "Map the ASN and IP ranges", desc: "Owned netblocks expand the asset list beyond known domains.", tools: [ { n: "bgp.he.net", url: "https://bgp.he.net/" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "web",
      title: "Websites, Web Archives & Content",
      color: "#a3e635",
      tag: "Web",
      desc: "Mine the target's web presence, its history, and what it inadvertently exposes.",
      groups: [
        {
          id: "we-live",
          title: "Live site analysis",
          scenario: "when you have a site in front of you.",
          items: [
            { text: "Fingerprint the tech stack", desc: "CMS, frameworks, analytics IDs, server headers — pivotable identifiers.", tools: [ { n: "whatweb", id: "whatweb" }, { n: "Wappalyzer", url: "https://www.wappalyzer.com/" } ] },
            { text: "Read robots.txt, sitemaps and source", desc: "Hidden paths, staging hosts, API endpoints and commented-out notes." },
            { text: "Extract reused tracking / analytics IDs", desc: "A shared Google Analytics / AdSense ID links sites owned by the same operator.", tools: [ { n: "crawl", id: "katana" } ] }
          ]
        },
        {
          id: "we-archive",
          title: "Archives & history",
          scenario: "when content has changed, been removed, or you want the site as it was.",
          items: [
            { text: "Pull historical snapshots", desc: "Recover deleted pages, old staff lists, prices and exposed files.", tools: [ { n: "Wayback Machine", url: "https://web.archive.org/" } ] },
            { text: "Harvest archived URLs", desc: "Known historical URLs reveal endpoints and parameters no longer linked.", tools: [ { n: "waybackurls / gau" } ] },
            { text: "Check cached and mirror copies", desc: "Search-engine and third-party caches when the original is down or scrubbed." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "people",
      title: "People & Identity",
      color: "#fb7185",
      tag: "HUMINT",
      desc: "Build a profile of an individual from name to full identity graph.",
      groups: [
        {
          id: "pe-identity",
          title: "Identify the person",
          scenario: "when the target is an individual, or you need to resolve a name to a real person.",
          items: [
            { text: "Disambiguate the full name and aliases", desc: "Common names need a second selector (location, employer, photo) to pin the right person." },
            { text: "People-search and public-records aggregators", desc: "Addresses, relatives, ages and past locations (coverage is region-specific).", tools: [ { n: "IntelTechniques", url: "https://inteltechniques.com/tools/" } ] },
            { text: "Voter / electoral and property records", desc: "Where legal, these confirm address and identity (jurisdiction-dependent)." },
            { text: "Build a timeline and relationship map", desc: "Employers, education, locations and associates over time." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "usernames",
      title: "Usernames & Accounts",
      color: "#f472b6",
      tag: "Accounts",
      desc: "A reused handle is one of the strongest pivots — it links accounts across the whole internet.",
      groups: [
        {
          id: "un-enum",
          title: "Username enumeration",
          scenario: "whenever you have a handle, or derive candidate handles from a name/email.",
          items: [
            { text: "Check the handle across hundreds of sites", desc: "Find every platform where the username exists.", tools: [ { n: "Sherlock", id: "sherlock" }, { n: "Maigret", id: "maigret" }, { n: "WhatsMyName", url: "https://whatsmyname.app/" } ] },
            { text: "Generate handle variants", desc: "People reuse a root with small changes; test permutations and separators." },
            { text: "Confirm and de-duplicate matches by hand", desc: "Automated hits include false positives — verify writing style, avatar and bio before linking." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "email",
      title: "Email OSINT",
      color: "#fbbf24",
      tag: "Email",
      desc: "An email address pivots into accounts, breaches, names and the org's address format.",
      groups: [
        {
          id: "em-discover",
          title: "Find & format addresses",
          scenario: "when you need a person's address or the organisation's email pattern.",
          items: [
            { text: "Derive the org email format", desc: "first.last@, flast@, etc. — one known address reveals the pattern for everyone.", tools: [ { n: "theHarvester", id: "theharvester" }, { n: "Hunter.io", url: "https://hunter.io/" } ] },
            { text: "Harvest addresses from public sources", desc: "Sites, docs, repos, leaks and search results." }
          ]
        },
        {
          id: "em-validate",
          title: "Validate & pivot",
          scenario: "once you hold a candidate address.",
          items: [
            { text: "Check which platforms the address is registered on", desc: "Account-existence checks across many services without password attempts.", tools: [ { n: "Holehe", id: "holehe" } ] },
            { text: "Verify deliverability", desc: "Confirm the mailbox exists before relying on it (SMTP/MX checks, carefully)." },
            { text: "Pivot the address into breach data", desc: "Links to the breach phase for exposed passwords and linked accounts." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "phone",
      title: "Phone Numbers",
      color: "#34d399",
      tag: "Telephony",
      desc: "A number resolves to carrier, region, line type and sometimes an owner and linked accounts.",
      groups: [
        {
          id: "ph-lookup",
          title: "Number lookups",
          scenario: "when you have a phone number as a selector.",
          items: [
            { text: "Normalise to E.164 and identify carrier / region / line type", desc: "Country, carrier and whether it is mobile, VoIP or landline.", tools: [ { n: "PhoneInfoga" } ] },
            { text: "Check caller-ID and reverse-lookup services", desc: "Crowdsourced name tags and spam reports (coverage varies by region)." },
            { text: "Test the number against messaging apps", desc: "WhatsApp/Telegram/Signal presence and profile photo can confirm ownership — mind OPSEC and consent." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "social",
      title: "Social Media Intelligence (SOCMINT)",
      color: "#60a5fa",
      tag: "SOCMINT",
      desc: "Profiles, posts and networks across platforms — the richest and noisiest source.",
      groups: [
        {
          id: "so-profiles",
          title: "Profiles & posts",
          scenario: "once an account is linked to the target.",
          items: [
            { text: "Enumerate profiles per platform", desc: "X/Twitter, Facebook, Instagram, LinkedIn, TikTok, Reddit, Telegram, Discord, Mastodon — each has its own search quirks." },
            { text: "Capture bio, links and pinned content", desc: "Bios cross-link other handles, sites and contact methods." },
            { text: "Map the social graph", desc: "Followers, friends, mutuals and tagged accounts reveal real-world relationships." },
            { text: "Mine post content for metadata", desc: "Timestamps, locations, devices, and background details in media." }
          ]
        },
        {
          id: "so-tools",
          title: "Collection aids",
          scenario: "to gather at scale and preserve evidence.",
          items: [
            { text: "Use platform-specific search operators and export tools", desc: "Advanced search, saved queries and read-only viewers reduce account risk." },
            { text: "Archive posts as you find them", desc: "Social content is deleted fast — capture it immediately.", tools: [ { n: "Hunchly" }, { n: "archive.today", url: "https://archive.ph/" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "breach",
      title: "Breaches, Leaks & Credentials",
      color: "#f87171",
      tag: "Leaks",
      desc: "Exposed credentials and leaked datasets tie identities together and reveal patterns.",
      groups: [
        {
          id: "br-exposure",
          title: "Exposure checks",
          scenario: "with an email, username, domain or phone in hand.",
          items: [
            { text: "Check which breaches an identifier appears in", desc: "Establishes exposure and which services the person used.", tools: [ { n: "Have I Been Pwned", url: "https://haveibeenpwned.com/" } ] },
            { text: "Search aggregated leak datasets", desc: "Linked emails, usernames, hashed/plaintext passwords and reuse patterns (handle lawfully and ethically).", tools: [ { n: "Dehashed", url: "https://dehashed.com/" }, { n: "Intelligence X", url: "https://intelx.io/" } ] },
            { text: "Derive password patterns, not just values", desc: "Reuse and predictable mutation across services is the useful intelligence." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "images",
      title: "Images, Faces & Media",
      color: "#e879f9",
      tag: "Media",
      desc: "Reverse-image and media analysis to find source, other appearances and context.",
      groups: [
        {
          id: "im-reverse",
          title: "Reverse image search",
          scenario: "when you have a photo, avatar or screenshot.",
          items: [
            { text: "Run the image through multiple engines", desc: "Each indexes differently — always use several.", tools: [ { n: "Google Lens", url: "https://images.google.com/" }, { n: "Yandex", url: "https://yandex.com/images/" }, { n: "TinEye", url: "https://tineye.com/" } ] },
            { text: "Crop and search regions separately", desc: "Logos, faces and landmarks in isolation often match where the whole image does not." },
            { text: "Use face-search engines with care", desc: "Face-matching across the web raises serious legal/ethical limits — only where authorised." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "geoint",
      title: "Geolocation & GEOINT",
      color: "#4ade80",
      tag: "GEOINT",
      desc: "Place a photo or event in the world: where it was taken and when.",
      groups: [
        {
          id: "ge-locate",
          title: "Geolocate imagery",
          scenario: "when an image or video must be placed on a map.",
          items: [
            { text: "Read any embedded GPS / EXIF first", desc: "If the metadata survived, the coordinates may be in the file.", tools: [ { n: "ExifTool", id: "exiftool" } ] },
            { text: "Identify landmarks, signage and language", desc: "Shop names, number plates, road markings and script narrow the region fast." },
            { text: "Cross-reference satellite and street imagery", desc: "Confirm a candidate location against aerial and ground views.", tools: [ { n: "Google Earth", url: "https://earth.google.com/" }, { n: "Mapillary", url: "https://www.mapillary.com/" } ] },
            { text: "Chronolocate via shadows / sun position and weather", desc: "Shadow angle and archived weather pin the time of day and date." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "docs",
      title: "Documents & Metadata",
      color: "#facc15",
      tag: "Metadata",
      desc: "Public documents leak authors, software, paths and internal names in their metadata.",
      groups: [
        {
          id: "dc-meta",
          title: "Find & strip metadata",
          scenario: "when the target publishes PDFs, Office files or images.",
          items: [
            { text: "Harvest public documents from the domain", desc: "Pull indexed files en masse for metadata analysis.", tools: [ { n: "metagoofil" } ] },
            { text: "Extract author, software, paths and timestamps", desc: "Usernames, internal server paths and software versions hide in document properties.", tools: [ { n: "ExifTool", id: "exiftool" }, { n: "FOCA" } ] },
            { text: "Build the internal naming / user list from metadata", desc: "Authors and path names reveal account naming conventions and infrastructure." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "search",
      title: "Search Engines & Dorking",
      color: "#fb923c",
      tag: "Dorking",
      desc: "Advanced operators turn general search engines into precision OSINT tools.",
      groups: [
        {
          id: "se-dork",
          title: "Dorking",
          scenario: "throughout — to surface exposed files, panels and mentions.",
          items: [
            { text: "Use advanced operators", desc: "site:, filetype:, intitle:, inurl:, intext: to pinpoint exposed content.", tools: [ { n: "Google Hacking DB", url: "https://www.exploit-db.com/google-hacking-database" } ] },
            { text: "Search multiple engines", desc: "Bing, DuckDuckGo, Yandex and Brave index different corners — never rely on one.", tools: [ { n: "DuckDuckGo", url: "https://duckduckgo.com/" } ] },
            { text: "Dork for exposed files and portals", desc: "Config files, backups, directory listings, login panels and spreadsheets." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "code",
      title: "Code, Repos & Secrets",
      color: "#5eead4",
      tag: "Code",
      desc: "Developers leak keys, hostnames and internal detail in public repositories.",
      groups: [
        {
          id: "cd-repos",
          title: "Repository recon",
          scenario: "when the target writes or uses public code.",
          items: [
            { text: "Enumerate org and employee repos", desc: "Public GitHub/GitLab orgs and personal accounts of staff found earlier.", tools: [ { n: "GitHub search", url: "https://github.com/search" } ] },
            { text: "Scan history for secrets", desc: "Keys and tokens committed then 'removed' live on in git history.", tools: [ { n: "gitleaks" }, { n: "trufflehog" } ] },
            { text: "Dork code for internal hostnames and credentials", desc: "Config, CI files and comments reveal infrastructure and naming." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "cloud",
      title: "Cloud & Storage Exposure",
      color: "#93c5fd",
      tag: "Cloud",
      desc: "Misconfigured buckets and blobs expose data to anyone who guesses the name.",
      groups: [
        {
          id: "cl-buckets",
          title: "Public storage",
          scenario: "once you know the org's naming conventions and brands.",
          items: [
            { text: "Enumerate S3 / Azure Blob / GCS buckets", desc: "Guess names from the org, brands and subdomains and test for public listings.", tools: [ { n: "cloud_enum" } ] },
            { text: "Search bucket-indexing services", desc: "Third parties index open buckets and their contents." },
            { text: "Check exposed object contents, not just listing", desc: "A closed listing can still serve objects whose keys you can derive." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "darkweb",
      title: "Dark Web & Paste Sites",
      color: "#9ca3af",
      tag: "Deep / Dark",
      desc: "Leak markets, forums and paste sites — high value, high legal and OPSEC risk.",
      groups: [
        {
          id: "dw-sources",
          title: "Deep & dark sources",
          scenario: "when an identifier may appear in leaks, markets or forum chatter — only where authorised.",
          items: [
            { text: "Search paste sites and leak indexes", desc: "Dumped creds, docs and chatter surface on pastebins and aggregators.", tools: [ { n: "Intelligence X", url: "https://intelx.io/" } ] },
            { text: "Query Tor hidden-service search where lawful", desc: "Specialised indexes cover onion services; treat everything as untrusted and keep hard OPSEC.", tools: [ { n: "Ahmia", url: "https://ahmia.fi/" } ] },
            { text: "Never transact or download malware", desc: "Observation only; interaction is a legal and safety line you do not cross without explicit authority." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "transport",
      title: "Transport, IoT & Niche Sources",
      color: "#c084fc",
      tag: "Specialised",
      desc: "Specialised feeds — aircraft, vessels, wireless and more — for the right investigation.",
      groups: [
        {
          id: "tr-feeds",
          title: "Specialised feeds",
          scenario: "when the objective touches movement, physical assets or wireless.",
          items: [
            { text: "Track aircraft (ADS-B)", desc: "Live and historical flights, tail numbers and operators.", tools: [ { n: "ADS-B Exchange", url: "https://globe.adsbexchange.com/" } ] },
            { text: "Track vessels (AIS)", desc: "Ship positions, ownership and port calls.", tools: [ { n: "MarineTraffic", url: "https://www.marinetraffic.com/" } ] },
            { text: "Map wireless networks", desc: "SSID/BSSID geolocation from wardriving datasets.", tools: [ { n: "WiGLE", url: "https://wigle.net/" } ] }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "analysis",
      title: "Collection, Analysis & Verification",
      color: "#2dd4bf",
      tag: "Tradecraft",
      desc: "Turn collected data into assessed intelligence — and make sure it is actually true.",
      groups: [
        {
          id: "an-automate",
          title: "Automated collection",
          scenario: "to run breadth quickly, then verify by hand.",
          items: [
            { text: "Run an automation framework over your selectors", desc: "Fan out across many sources from one seed; treat output as leads, not facts.", tools: [ { n: "SpiderFoot", id: "spiderfoot" }, { n: "recon-ng" }, { n: "Maltego", id: "maltego" } ] },
            { text: "Keep the entity graph updated", desc: "Link people, accounts, infra and events so relationships become visible.", tools: [ { n: "Maltego", id: "maltego" } ] }
          ]
        },
        {
          id: "an-verify",
          title: "Verification & analysis",
          scenario: "before anything becomes a finding.",
          items: [
            { text: "Corroborate every key fact with a second source", desc: "Single-source facts are leads; two independent sources make intelligence." },
            { text: "Check for disinformation and stale data", desc: "Public data is edited, planted and outdated — date-stamp and sanity-check it." },
            { text: "Separate fact, inference and assumption", desc: "State confidence levels; do not present analysis as observation." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "report",
      title: "Reporting & Counter-OSINT",
      color: "#94a3b8",
      tag: "Output",
      desc: "Deliver the intelligence cleanly, and understand how to reduce your own exposure.",
      groups: [
        {
          id: "rp-report",
          title: "Reporting",
          scenario: "at the end of the investigation.",
          items: [
            { text: "Write findings with sources and timestamps", desc: "Every claim traceable to where and when it was collected." },
            { text: "Include confidence and gaps", desc: "Say what you could not confirm as clearly as what you could." },
            { text: "Preserve evidence captures", desc: "Screenshots and archived copies in case the source disappears.", tools: [ { n: "Hunchly" } ] }
          ]
        },
        {
          id: "rp-counter",
          title: "Counter-OSINT (defensive)",
          scenario: "when the goal is to reduce an individual's or org's own exposure.",
          items: [
            { text: "Run the workflow against yourself / the client", desc: "Find what an attacker would before they do." },
            { text: "Remove or lock down exposed data", desc: "Opt-outs, privacy settings, takedowns, and killing reused handles/passwords." },
            { text: "Monitor for new exposure", desc: "Breach alerts and periodic re-checks of the key selectors." }
          ]
        }
      ]
    }

  ]
};
