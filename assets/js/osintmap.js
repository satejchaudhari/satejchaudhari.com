/*
  OSINT WORKFLOW — data for osint-map.html (rendered by osintmap-main.js).

  STATUS: work in progress.

  STRUCTURE: the phases mirror the branches of the OSINT Framework
  (osintframework.com, by Justin Nordine) — organised by selector / data type —
  wrapped in a red-team workflow (planning, OPSEC, collection, analysis,
  reporting). Consumer-investigation branches (dating, terrorism, classifieds,
  mobile emulation) are left out as out of scope for org reconnaissance.

  MODEL (same shape as webmap.js):
    OSINT_MAP = {
      meta: { title, note },
      sections: [ {                       // a PHASE / data-type branch
        id, title, color, tag, desc,
        groups: [ {
          id, title, scenario,            // scenario = "when to use this group"
          items: [ {
            text, desc,
            tools: [ { n, id? , url? } ],  // id -> toolkit entry; url -> external; neither -> placeholder
            vulns: [ { n, url? } ]
          } ]
        } ]
      } ]
    }

  Edit THIS file for content; never edit osintmap-main.js.
*/

var OSINT_MAP = {
  meta: {
    title: "OSINT Workflow",
    note: "A red-team OSINT workflow organised along the OSINT Framework's branches. Work in progress."
  },
  sections: [

    /* ========================== WORKFLOW SPINE ========================== */
    {
      id: "planning",
      title: "Planning & Scoping",
      color: "#22d3ee",
      tag: "Pre-engagement",
      desc: "Set the objective and the engagement scope before collecting anything.",
      groups: [
        {
          id: "pl-objective",
          title: "Define the objective",
          scenario: "the very start of an engagement — before you collect anything.",
          items: [
            { text: "Write the recon requirement as a question", desc: "State what the recon feeds (initial-access surface, target users, infrastructure) so collection stays focused." },
            { text: "List the selectors you already hold", desc: "Company, domains, brands, names, emails, usernames — your starting pivots decide which branches below apply." },
            { text: "Set success criteria and a stop condition", desc: "Decide what 'enough' looks like; OSINT expands without limit." },
            { text: "Keep the OSINT Framework open as a decision tree", desc: "Pick the branch that matches the selector in front of you rather than running everything.", tools: [ { n: "OSINT Framework", url: "https://osintframework.com/" } ] }
          ]
        },
        {
          id: "pl-scope",
          title: "Scope & rules of engagement",
          scenario: "at kickoff — lock down what is in play before collection starts.",
          items: [
            { text: "Confirm the target scope and in-scope selectors", desc: "Which domains, brands, netblocks, people and accounts are fair game, and what is out of scope." },
            { text: "Agree rules of engagement and deconfliction", desc: "Timing windows, the passive/active boundary, points of contact, and how findings are reported." },
            { text: "Keep an audit trail of sources and timestamps", desc: "Record where each fact came from and when — backs the report and lets blue team retrace the trail." }
          ]
        }
      ]
    },

    {
      id: "opsec",
      title: "OPSEC & Managed Attribution",
      color: "#818cf8",
      tag: "OpSec",
      desc: "Keep collection from touching the target and keep yourself out of your own data (the framework's OpSec branch).",
      groups: [
        {
          id: "op-infra",
          title: "Research environment",
          scenario: "before interacting with any target-controlled surface (their site, posts, files).",
          items: [
            { text: "Use a dedicated VM / clean browser profile", desc: "Isolate research from your real identity, cookies and history; snapshot so you can roll back." },
            { text: "Route through a VPN / non-attributable egress", desc: "Avoid revealing your real IP and employer netblock to target-controlled servers and tracking links." },
            { text: "Watch for tracking and view-leaks", desc: "Link shorteners, tracking pixels and 'who viewed' features (e.g. LinkedIn) tip off the target." }
          ]
        },
        {
          id: "op-puppets",
          title: "Sock puppets",
          scenario: "when a source needs an account to view, or you must blend into a community.",
          items: [
            { text: "Build aged, believable research accounts", desc: "Pre-built personas with history; never use real or employer accounts to view a target." },
            { text: "Separate puppets per platform / engagement", desc: "Avoid cross-contamination that links personas together or back to you." },
            { text: "Mind account-suggestion leaks", desc: "Platforms surface 'people you may know' from contacts, logins and device signals — compartmentalise hard." }
          ]
        }
      ]
    },

    /* ========================== SELECTOR BRANCHES ========================== */
    {
      id: "username",
      title: "Username",
      color: "#f472b6",
      tag: "Selector",
      desc: "A reused handle links accounts across the whole internet — one of the strongest pivots.",
      groups: [
        {
          id: "un-enum",
          title: "Username search engines",
          scenario: "whenever you have a handle, or derive candidate handles from a name/email.",
          items: [
            { text: "Check the handle across hundreds of sites", desc: "Find every platform where the username exists.", tools: [ { n: "Sherlock", id: "sherlock" }, { n: "Maigret", id: "maigret" }, { n: "WhatsMyName", url: "https://whatsmyname.app/" } ] },
            { text: "Cross-check with a name/username lookup site", desc: "Account-name search services corroborate automated hits.", tools: [ { n: "NameChk", url: "https://namechk.com/" }, { n: "Instant Username", url: "https://instantusername.com/" } ] },
            { text: "Generate and test handle variants", desc: "People reuse a root with small changes; test permutations and separators." },
            { text: "Confirm and de-duplicate matches by hand", desc: "Automated hits include false positives — verify writing style, avatar and bio before linking." }
          ]
        }
      ]
    },

    {
      id: "email",
      title: "Email Address",
      color: "#fbbf24",
      tag: "Selector",
      desc: "An email pivots into accounts, breaches, names and the org's address format.",
      groups: [
        {
          id: "em-discover",
          title: "Email search & formats",
          scenario: "when you need a person's address or the organisation's email pattern.",
          items: [
            { text: "Derive the org email format", desc: "first.last@, flast@, etc. — one known address reveals the pattern for everyone.", tools: [ { n: "theHarvester", id: "theharvester" }, { n: "Hunter.io", url: "https://hunter.io/" } ] },
            { text: "Harvest addresses from public sources", desc: "Sites, docs, repos, leaks and search results.", tools: [ { n: "theHarvester", id: "theharvester" } ] }
          ]
        },
        {
          id: "em-validate",
          title: "Verification & pivots",
          scenario: "once you hold a candidate address.",
          items: [
            { text: "Check which platforms the address is registered on", desc: "Account-existence checks across many services with no password attempts.", tools: [ { n: "Holehe", id: "holehe" } ] },
            { text: "Verify deliverability", desc: "Confirm the mailbox exists (MX/SMTP checks) before relying on it." },
            { text: "Pivot the address into breach data", desc: "Links into the breaches branch for exposed passwords and linked accounts." }
          ]
        }
      ]
    },

    {
      id: "domain",
      title: "Domain Name",
      color: "#38bdf8",
      tag: "Infra",
      desc: "Map the target's namespace: registration, DNS, subdomains, certificates and reputation.",
      groups: [
        {
          id: "dm-whois",
          title: "WHOIS & registration",
          scenario: "once you have a domain or are hunting for related ones.",
          items: [
            { text: "Run WHOIS / RDAP on the domain", desc: "Registrar, dates, name servers and (where not redacted) registrant contact.", tools: [ { n: "whois" }, { n: "RDAP", url: "https://lookup.icann.org/" } ] },
            { text: "Reverse-WHOIS on registrant email / org", desc: "Finds sibling domains registered by the same entity.", tools: [ { n: "ViewDNS", url: "https://viewdns.info/" } ] },
            { text: "Check historical WHOIS", desc: "Pre-privacy records often still expose the original owner." }
          ]
        },
        {
          id: "dm-dns",
          title: "DNS & passive DNS",
          scenario: "to understand mail, hosting and services behind the name.",
          items: [
            { text: "Enumerate A/AAAA/MX/NS/TXT/SOA records", desc: "Maps hosting, mail, SPF/DKIM/DMARC and verification tokens that reveal SaaS in use.", tools: [ { n: "dig" }, { n: "dnsrecon" } ] },
            { text: "Attempt a zone transfer (AXFR)", desc: "A misconfigured NS can hand over the whole zone.", tools: [ { n: "dig" } ] },
            { text: "Query passive DNS", desc: "Historical resolutions reveal old IPs, shared hosting and related hostnames without touching the target.", tools: [ { n: "SecurityTrails", url: "https://securitytrails.com/" } ] }
          ]
        },
        {
          id: "dm-subs",
          title: "Subdomains & certificates",
          scenario: "to widen the attack surface and find forgotten / dev hosts.",
          items: [
            { text: "Enumerate subdomains passively", desc: "Aggregate from many passive sources before any active probing.", tools: [ { n: "amass", id: "amass" }, { n: "subfinder", id: "subfinder" }, { n: "theHarvester", id: "theharvester" } ] },
            { text: "Mine Certificate Transparency logs", desc: "CT logs list hostnames on issued certs — including internal-looking ones.", tools: [ { n: "crt.sh", url: "https://crt.sh/" } ] },
            { text: "Resolve and triage live hosts", desc: "Which subdomains resolve, respond, and what they run.", tools: [ { n: "whatweb", id: "whatweb" } ] }
          ]
        }
      ]
    },

    {
      id: "ip",
      title: "IP Address & Hosts",
      color: "#2dd4bf",
      tag: "Infra",
      desc: "Resolve infrastructure to IPs, netblocks and exposed services using internet-wide scan data.",
      groups: [
        {
          id: "ip-scandata",
          title: "Host & port discovery",
          scenario: "to see open ports, banners and exposed devices without scanning the target yourself.",
          items: [
            { text: "Search the target in device search engines", desc: "Open ports, service banners, product/versions, screenshots and favicons — pre-collected.", tools: [ { n: "Shodan", id: "shodan" }, { n: "Censys", id: "censys" }, { n: "FOFA", url: "https://fofa.info/" } ] },
            { text: "Pivot on favicon hash / TLS cert / page title", desc: "Finds other hosts sharing the same asset, revealing related infrastructure." },
            { text: "Active port/service scan where in scope", desc: "Confirm and detail services once passive data points you at live hosts.", tools: [ { n: "nmap", id: "nmap" } ] }
          ]
        },
        {
          id: "ip-geo",
          title: "Geolocation, ASN & reputation",
          scenario: "to place an IP, find owned ranges and check its history.",
          items: [
            { text: "Geolocate the IP and identify the hosting provider", desc: "Cloud vs on-prem, region and ISP shape the attack picture." },
            { text: "Map the ASN and netblocks", desc: "Owned ranges expand the asset list beyond known domains.", tools: [ { n: "bgp.he.net", url: "https://bgp.he.net/" } ] },
            { text: "Check IP reputation and blacklists", desc: "Prior abuse, listings and shared-hosting neighbours.", tools: [ { n: "AbuseIPDB", url: "https://www.abuseipdb.com/" } ] }
          ]
        }
      ]
    },

    {
      id: "images",
      title: "Images, Videos & Docs",
      color: "#e879f9",
      tag: "Media",
      desc: "Reverse-image, media and face analysis to find source, other appearances and context.",
      groups: [
        {
          id: "im-reverse",
          title: "Reverse image & face search",
          scenario: "when you have a photo, avatar or screenshot.",
          items: [
            { text: "Run the image through multiple engines", desc: "Each indexes differently — always use several.", tools: [ { n: "Google Lens", url: "https://images.google.com/" }, { n: "Yandex", url: "https://yandex.com/images/" }, { n: "TinEye", url: "https://tineye.com/" } ] },
            { text: "Crop and search regions separately", desc: "Logos, faces and landmarks in isolation often match where the whole image does not." },
            { text: "Use face-search engines to place a person", desc: "Match a face across the web from one photo; confirm hits by hand, false positives are common." }
          ]
        },
        {
          id: "im-video",
          title: "Video & webcams",
          scenario: "when the target or location appears in video or on public cameras.",
          items: [
            { text: "Mine video platforms for the target", desc: "Conference talks, product demos and background detail on YouTube/Vimeo." },
            { text: "Enumerate exposed webcams / cameras", desc: "Public or misconfigured cameras near a site (via device search engines).", tools: [ { n: "Shodan", id: "shodan" } ] }
          ]
        }
      ]
    },

    {
      id: "social",
      title: "Social Networks",
      color: "#60a5fa",
      tag: "SOCMINT",
      desc: "Profiles, posts and networks across platforms — the richest and noisiest source.",
      groups: [
        {
          id: "so-profiles",
          title: "Profiles & posts",
          scenario: "once an account is linked to the target.",
          items: [
            { text: "Enumerate profiles per platform", desc: "X/Twitter, Facebook, Instagram, LinkedIn, TikTok, Reddit, Mastodon — each has its own search quirks." },
            { text: "Capture bio, links and pinned content", desc: "Bios cross-link other handles, sites and contact methods." },
            { text: "Map the social graph", desc: "Followers, friends, mutuals and tagged accounts reveal real-world relationships." },
            { text: "Mine posts for metadata", desc: "Timestamps, locations, devices and background detail in media." }
          ]
        },
        {
          id: "so-tools",
          title: "Collection aids",
          scenario: "to gather at scale and preserve evidence.",
          items: [
            { text: "Use platform search operators and read-only viewers", desc: "Advanced search and viewers reduce account risk." },
            { text: "Archive posts as you find them", desc: "Social content is deleted fast — capture it immediately.", tools: [ { n: "archive.today", url: "https://archive.ph/" } ] }
          ]
        }
      ]
    },

    {
      id: "im",
      title: "Instant Messaging",
      color: "#7dd3fc",
      tag: "Selector",
      desc: "Chat platforms tie a handle, phone or email to a live, often less-guarded presence.",
      groups: [
        {
          id: "ms-apps",
          title: "Messaging presence",
          scenario: "when you hold a phone, email or handle and want a live account.",
          items: [
            { text: "Check messaging-app presence and profile data", desc: "Telegram, Discord, Signal, WhatsApp, Skype — avatar, status and username confirm ownership.", tools: [ { n: "Telegram" }, { n: "Discord" } ] },
            { text: "Enumerate Telegram / Discord communities", desc: "Public groups and servers the target or org staff frequent." },
            { text: "Operate from a sock-puppet", desc: "Interacting with chat platforms burns OPSEC — use a research persona." }
          ]
        }
      ]
    },

    {
      id: "people",
      title: "People Search Engines",
      color: "#fb7185",
      tag: "HUMINT",
      desc: "Resolve a name to a real person and build the identity graph.",
      groups: [
        {
          id: "pe-identity",
          title: "People search & identity",
          scenario: "when the target is an individual, or you must tie a name to a real person.",
          items: [
            { text: "Disambiguate the full name and aliases", desc: "Common names need a second selector (location, employer, photo) to pin the right person." },
            { text: "Query people-search aggregators", desc: "Addresses, relatives, ages and past locations (coverage is region-specific).", tools: [ { n: "IntelTechniques", url: "https://inteltechniques.com/tools/" } ] },
            { text: "Build a timeline and relationship map", desc: "Employers, education, locations and associates over time.", tools: [ { n: "Maltego", id: "maltego" } ] }
          ]
        }
      ]
    },

    {
      id: "records",
      title: "Public & Business Records",
      color: "#f59e0b",
      tag: "Corporate",
      desc: "Official records on the company and its people (the framework's Public Records + Business Records branches).",
      groups: [
        {
          id: "rc-business",
          title: "Business records",
          scenario: "when the target is a company, or you need to tie a person to an org.",
          items: [
            { text: "Pull the legal entity and officers", desc: "Registration, directors, addresses and ownership from the companies registry.", tools: [ { n: "OpenCorporates", url: "https://opencorporates.com/" }, { n: "Companies House", url: "https://find-and-update.company-information.service.gov.uk/" } ] },
            { text: "Read financial / regulatory filings", desc: "Public companies disclose structure, subsidiaries and risk.", tools: [ { n: "SEC EDGAR", url: "https://www.sec.gov/edgar/search/" } ] },
            { text: "Map subsidiaries, brands and acquisitions", desc: "Expands the domain and people footprint well beyond the primary name.", tools: [ { n: "Crunchbase", url: "https://www.crunchbase.com/" } ] },
            { text: "Harvest job postings and employee profiles", desc: "Vacancies leak the tech stack and tooling; profiles build the org chart.", tools: [ { n: "CrossLinked" }, { n: "theHarvester", id: "theharvester" } ] }
          ]
        },
        {
          id: "rc-public",
          title: "Public records",
          scenario: "to corroborate identity, location and assets through official sources.",
          items: [
            { text: "Property and land records", desc: "Ownership and addresses tied to a person or company." },
            { text: "Court, litigation and regulatory actions", desc: "Disputes, judgements and enforcement reveal relationships and pressure points." },
            { text: "Voter / electoral registers", desc: "Confirm address and identity where these registries are public (region-specific)." },
            { text: "Patents, trademarks and grants", desc: "R&D direction, named inventors and partner organisations." }
          ]
        }
      ]
    },

    {
      id: "phone",
      title: "Telephone Numbers",
      color: "#34d399",
      tag: "Selector",
      desc: "A number resolves to carrier, region, line type and sometimes an owner and linked accounts.",
      groups: [
        {
          id: "ph-lookup",
          title: "Number lookups",
          scenario: "when you have a phone number as a selector.",
          items: [
            { text: "Normalise to E.164 and identify carrier / region / line type", desc: "Country, carrier and whether it is mobile, VoIP or landline.", tools: [ { n: "PhoneInfoga" } ] },
            { text: "Check caller-ID and reverse-lookup services", desc: "Crowdsourced name tags and spam reports (coverage varies by region)." },
            { text: "Test the number against messaging apps", desc: "WhatsApp/Telegram/Signal presence and photo confirm ownership — from a sock-puppet to protect OPSEC." }
          ]
        }
      ]
    },

    {
      id: "geoint",
      title: "Geolocation & Maps",
      color: "#4ade80",
      tag: "GEOINT",
      desc: "Place a photo, site or event in the world: where and when.",
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
        },
        {
          id: "ge-recon",
          title: "Physical-site recon",
          scenario: "when the engagement may include a physical or social-engineering element.",
          items: [
            { text: "Map offices, entrances and surroundings", desc: "Satellite and street view for approach, badges, signage and smoking areas." },
            { text: "Pull geotagged social posts near a site", desc: "Staff photos reveal interior layout, badge design and desk setups." }
          ]
        }
      ]
    },

    {
      id: "search",
      title: "Search Engines & Dorking",
      color: "#fb923c",
      tag: "Dorking",
      desc: "Advanced operators turn general, code and academic search engines into precision OSINT tools.",
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
        },
        {
          id: "se-special",
          title: "Code, academic & news search",
          scenario: "to reach corners general engines miss.",
          items: [
            { text: "Search public code and config", desc: "Covered in depth under the Code branch — reachable from here too.", tools: [ { n: "grep.app", url: "https://grep.app/" } ] },
            { text: "Academic, patent and news archives", desc: "Papers, grants and press reveal people, tech and timelines." }
          ]
        }
      ]
    },

    {
      id: "forums",
      title: "Forums, Blogs & IRC",
      color: "#c4b5fd",
      tag: "Community",
      desc: "Technical forums, blogs and chat where staff ask questions and leak detail.",
      groups: [
        {
          id: "fo-sources",
          title: "Community sources",
          scenario: "to find staff discussing the target's tech, or the org's own community presence.",
          items: [
            { text: "Search Q&A and dev forums for the org / staff", desc: "Stack Overflow, Reddit and vendor forums leak stack, errors and internal names." },
            { text: "Mine company and personal blogs", desc: "Engineering blogs disclose architecture, tooling and decisions." },
            { text: "Monitor IRC / Matrix / niche communities", desc: "Where relevant, smaller communities carry franker technical talk." }
          ]
        }
      ]
    },

    {
      id: "archives",
      title: "Archives",
      color: "#a3e635",
      tag: "History",
      desc: "Recover content that has changed, been removed, or was never meant to stay public.",
      groups: [
        {
          id: "ar-web",
          title: "Web archives",
          scenario: "when content has changed, been removed, or you want the site as it was.",
          items: [
            { text: "Pull historical snapshots", desc: "Recover deleted pages, old staff lists, prices and exposed files.", tools: [ { n: "Wayback Machine", url: "https://web.archive.org/" }, { n: "archive.today", url: "https://archive.ph/" } ] },
            { text: "Harvest archived URLs", desc: "Known historical URLs reveal endpoints and parameters no longer linked.", tools: [ { n: "waybackurls / gau" } ] },
            { text: "Check cached and mirror copies", desc: "Search-engine and third-party caches when the original is down or scrubbed." }
          ]
        }
      ]
    },

    {
      id: "web",
      title: "Websites & Web Content",
      color: "#bef264",
      tag: "Web",
      desc: "Mine the target's live web presence and what it inadvertently exposes.",
      groups: [
        {
          id: "we-live",
          title: "Live site analysis",
          scenario: "when you have a site in front of you.",
          items: [
            { text: "Fingerprint the tech stack", desc: "CMS, frameworks, analytics IDs, server headers — pivotable identifiers.", tools: [ { n: "whatweb", id: "whatweb" }, { n: "Wappalyzer", url: "https://www.wappalyzer.com/" } ] },
            { text: "Read robots.txt, sitemaps and source", desc: "Hidden paths, staging hosts, API endpoints and commented-out notes." },
            { text: "Crawl for links, endpoints and tracking IDs", desc: "A shared analytics / AdSense ID links sites owned by the same operator.", tools: [ { n: "katana", id: "katana" } ] }
          ]
        }
      ]
    },

    {
      id: "metadata",
      title: "Documents & Metadata",
      color: "#facc15",
      tag: "Metadata",
      desc: "Public documents leak authors, software, paths and internal names in their metadata.",
      groups: [
        {
          id: "md-meta",
          title: "Find & extract metadata",
          scenario: "when the target publishes PDFs, Office files or images.",
          items: [
            { text: "Harvest public documents from the domain", desc: "Pull indexed files en masse for metadata analysis.", tools: [ { n: "metagoofil" } ] },
            { text: "Extract author, software, paths and timestamps", desc: "Usernames, internal server paths and software versions hide in document properties.", tools: [ { n: "ExifTool", id: "exiftool" }, { n: "FOCA" } ] },
            { text: "Build the internal user / naming list from metadata", desc: "Authors and path names reveal account conventions and infrastructure." }
          ]
        }
      ]
    },

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

    {
      id: "breach",
      title: "Breaches, Leaks & Credentials",
      color: "#f87171",
      tag: "Leaks",
      desc: "Exposed credentials and leaked datasets tie identities together and feed access.",
      groups: [
        {
          id: "br-exposure",
          title: "Exposure checks",
          scenario: "with an email, username, domain or phone in hand.",
          items: [
            { text: "Check which breaches an identifier appears in", desc: "Establishes exposure and which services the person used.", tools: [ { n: "Have I Been Pwned", url: "https://haveibeenpwned.com/" } ] },
            { text: "Search aggregated leak datasets", desc: "Linked emails, usernames, hashed/plaintext passwords and reuse patterns across dumps.", tools: [ { n: "Dehashed", url: "https://dehashed.com/" }, { n: "Intelligence X", url: "https://intelx.io/" } ] },
            { text: "Derive password patterns, not just values", desc: "Reuse and predictable mutation across services is the useful intelligence for password spraying." }
          ]
        }
      ]
    },

    {
      id: "darkweb",
      title: "Dark Web & Paste Sites",
      color: "#9ca3af",
      tag: "Deep / Dark",
      desc: "Leak markets, forums and paste sites — high value, high OPSEC and malware risk.",
      groups: [
        {
          id: "dw-sources",
          title: "Deep & dark sources",
          scenario: "when an identifier may appear in leaks, markets or forum chatter.",
          items: [
            { text: "Search paste sites and leak indexes", desc: "Dumped creds, docs and chatter surface on pastebins and aggregators.", tools: [ { n: "Intelligence X", url: "https://intelx.io/" } ] },
            { text: "Query Tor hidden-service search engines", desc: "Specialised indexes cover onion services; treat everything as untrusted and keep hard OPSEC.", tools: [ { n: "Ahmia", url: "https://ahmia.fi/" } ] },
            { text: "Observe only — do not transact or pull samples", desc: "Stay read-only: interacting with markets or downloading files is an OPSEC and malware risk to your host." }
          ]
        }
      ]
    },

    {
      id: "crypto",
      title: "Digital Currency",
      color: "#fdba74",
      tag: "Finance",
      desc: "Where a wallet address is in play, blockchains are a permanent, public ledger to trace.",
      groups: [
        {
          id: "cr-trace",
          title: "Blockchain tracing",
          scenario: "when the target exposes a Bitcoin / Ethereum / other wallet address.",
          items: [
            { text: "Explore the address on a block explorer", desc: "Balance, counterparties and transaction history are fully public.", tools: [ { n: "Blockchain.com", url: "https://www.blockchain.com/explorer" }, { n: "Etherscan", url: "https://etherscan.io/" } ] },
            { text: "Cluster addresses and tag exchanges", desc: "Heuristics link addresses to one owner and to known services." }
          ]
        }
      ]
    },

    {
      id: "transport",
      title: "Transportation & IoT",
      color: "#c084fc",
      tag: "Specialised",
      desc: "Specialised feeds — aircraft, vessels, vehicles and wireless — for the right engagement.",
      groups: [
        {
          id: "tr-feeds",
          title: "Specialised feeds",
          scenario: "when the objective touches movement, physical assets or wireless.",
          items: [
            { text: "Track aircraft (ADS-B)", desc: "Live and historical flights, tail numbers and operators.", tools: [ { n: "ADS-B Exchange", url: "https://globe.adsbexchange.com/" } ] },
            { text: "Track vessels (AIS)", desc: "Ship positions, ownership and port calls.", tools: [ { n: "MarineTraffic", url: "https://www.marinetraffic.com/" } ] },
            { text: "Map wireless networks near a site", desc: "SSID/BSSID geolocation from wardriving datasets.", tools: [ { n: "WiGLE", url: "https://wigle.net/" } ] }
          ]
        }
      ]
    },

    {
      id: "threatintel",
      title: "Threat Intelligence",
      color: "#fca5a5",
      tag: "TI",
      desc: "See the target through the lens of malware, infrastructure and indicator feeds.",
      groups: [
        {
          id: "ti-feeds",
          title: "Indicator & malware feeds",
          scenario: "to check whether the target's assets appear in threat data.",
          items: [
            { text: "Query multi-engine reputation on domains / IPs / files", desc: "Detections, passive DNS, related samples and WHOIS in one place.", tools: [ { n: "VirusTotal", url: "https://www.virustotal.com/" } ] },
            { text: "Pivot infrastructure on shared indicators", desc: "Link hosts by cert, tracker, registrant and malware callbacks.", tools: [ { n: "Shodan", id: "shodan" }, { n: "Censys", id: "censys" } ] },
            { text: "Check paste / leak monitors for the org", desc: "Mentions of the target in dumps, feeds and sandboxes.", tools: [ { n: "Intelligence X", url: "https://intelx.io/" } ] }
          ]
        }
      ]
    },

    {
      id: "encoding",
      title: "Encoding, Decoding & Utilities",
      color: "#94a3b8",
      tag: "Utilities",
      desc: "The small transforms you lean on constantly during recon.",
      groups: [
        {
          id: "en-tools",
          title: "Transforms",
          scenario: "any time collected data is encoded, hashed or obfuscated.",
          items: [
            { text: "Decode Base64 / URL / hex and inspect JWTs", desc: "Tokens, parameters and config values are often just encoded, not secret.", tools: [ { n: "CyberChef", url: "https://gchq.github.io/CyberChef/" } ] },
            { text: "Identify and look up hashes", desc: "Recognise hash types and check against lookup/cracking references." },
            { text: "Expand shortened URLs safely", desc: "Resolve link-shorteners without clicking through from an attributable browser." }
          ]
        }
      ]
    },

    /* ========================== OUTPUT ========================== */
    {
      id: "tools",
      title: "Collection & Automation",
      color: "#2dd4bf",
      tag: "Tools",
      desc: "Frameworks that fan one seed across many sources (the OSINT Framework's Tools branch).",
      groups: [
        {
          id: "to-auto",
          title: "Automation frameworks",
          scenario: "to run breadth quickly, then verify the output by hand.",
          items: [
            { text: "Run an automation framework over your selectors", desc: "Fan out across many sources from one seed; treat output as leads, not facts.", tools: [ { n: "SpiderFoot", id: "spiderfoot" }, { n: "recon-ng" }, { n: "theHarvester", id: "theharvester" } ] },
            { text: "Keep the entity graph in a link-analysis tool", desc: "Link people, accounts, infra and events so relationships become visible.", tools: [ { n: "Maltego", id: "maltego" } ] },
            { text: "Capture evidence as you go", desc: "Timestamped captures survive deletion and back the report.", tools: [ { n: "Hunchly" } ] }
          ]
        }
      ]
    },

    {
      id: "analysis",
      title: "Analysis & Verification",
      color: "#a5b4fc",
      tag: "Tradecraft",
      desc: "Turn collected data into assessed intelligence — and make sure it is actually true.",
      groups: [
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

    {
      id: "report",
      title: "Documentation & Counter-OSINT",
      color: "#cbd5e1",
      tag: "Output",
      desc: "Deliver the intelligence cleanly, and feed the defensive side.",
      groups: [
        {
          id: "rp-report",
          title: "Reporting",
          scenario: "at the end of the engagement.",
          items: [
            { text: "Write findings with sources and timestamps", desc: "Every claim traceable to where and when it was collected." },
            { text: "Include confidence and gaps", desc: "Say what you could not confirm as clearly as what you could." },
            { text: "Preserve evidence captures", desc: "Screenshots and archived copies in case the source disappears.", tools: [ { n: "Hunchly" } ] }
          ]
        },
        {
          id: "rp-counter",
          title: "Counter-OSINT (defensive)",
          scenario: "when the deliverable includes reducing the org's own exposure.",
          items: [
            { text: "Run this workflow against the client first", desc: "Find what an attacker would before they do." },
            { text: "Recommend removal / lockdown of exposed data", desc: "Opt-outs, privacy settings, takedowns, and killing reused handles/passwords." },
            { text: "Set up monitoring for new exposure", desc: "Breach alerts and periodic re-checks of the key selectors." }
          ]
        }
      ]
    }

  ]
};
