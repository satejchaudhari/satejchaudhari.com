#!/usr/bin/env python3
"""Fetch reputable cybersecurity RSS/Atom feeds into assets/js/news-data.js.

Standard library only — no third-party packages, no runtime dependency for the
site. Keeps only items published in the last 72 hours. Run on a schedule by
.github/workflows/news.yml (every 3 hours). To change sources, edit FEEDS below.
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.request import Request, urlopen

# (display name, feed URL) — reputable, widely-cited security sources.
FEEDS = [
    ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
    ("BleepingComputer", "https://www.bleepingcomputer.com/feed/"),
    ("Krebs on Security", "https://krebsonsecurity.com/feed/"),
    ("Dark Reading", "https://www.darkreading.com/rss.xml"),
    ("SANS ISC", "https://isc.sans.edu/rssfeed_full.xml"),
    ("The Record", "https://therecord.media/feed/"),
    ("CISA Advisories", "https://www.cisa.gov/cybersecurity-advisories/all.xml"),
    # India-focused cybersecurity sources
    ("ETCISO", "https://ciso.economictimes.indiatimes.com/rss/topstories"),
    ("The Cyber Express", "https://thecyberexpress.com/feed/"),
    ("The420", "https://the420.in/feed/"),
]

MAX_AGE_HOURS = 72
MAX_ITEMS = 90
OUT = "assets/js/news-data.js"

# Sources whose feeds mix in general (non-cybersecurity) news. Items from these
# are kept only if their title/summary matches CYBER_RE below. The dedicated
# cybersecurity outlets above are trusted as-is. Add a source name here if it
# starts bringing in off-topic stories.
FILTER_SOURCES = {"The420"}

# A story counts as cybersecurity if any of these appears in its title/summary.
_CYBER_TERMS = [
    r"cyber", r"\bhack", r"malware", r"ransomware", r"phish", r"spyware", r"trojan",
    r"botnet", r"ddos", r"exploit", r"vulnerab", r"zero[-\s]?day", r"0-?day",
    r"\bbreach", r"infostealer", r"stealer", r"keylogger", r"rootkit", r"backdoor",
    r"credential", r"password", r"encrypt", r"decrypt", r"\bspoof", r"deepfake",
    r"sextortion", r"dark\s?web", r"sim[-\s]?box", r"sim[-\s]?swap", r"digital arrest",
    r"data\s+(?:breach|leak|theft|privacy|protection)", r"identity theft",
    r"surveillance", r"espionage", r"pegasus", r"firewall", r"antivirus",
    r"cert-in", r"owasp", r"supply[-\s]chain", r"misconfig", r"zero[-\s]?trust",
    r"sql injection", r"threat actor", r"nation-state", r"hacktivist",
    r"compromis", r"intrusion", r"cyber\s?crime", r"cyber\s?security", r"cyberattack",
    r"infosec", r"information security", r"\bscam", r"fraudster", r"phishing",
    r"online (?:fraud|scam|betting|gambling)", r"upi[-\s]?fraud", r"whatsapp",
    r"telegram", r"\bcve\b", r"\bapt\b", r"\brce\b", r"\bxss\b", r"\bvpn\b",
    r"\bmfa\b", r"\b2fa\b", r"\botp\b", r"\bupi\b", r"\bedr\b", r"\bsiem\b",
    r"\bciso\b", r"\bnist\b", r"\biot\b", r"zero-click", r"\bpatch", r"data protection",
]
CYBER_RE = re.compile("|".join(_CYBER_TERMS), re.I)

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def localname(tag):
    return tag.rsplit("}", 1)[-1].lower()


def text_of(el):
    return (el.text or "").strip() if el is not None else ""


def child(el, *names):
    wanted = {n.lower() for n in names}
    for c in el:
        if localname(c.tag) in wanted:
            return c
    return None


def parse_date(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc)
    except Exception:
        pass
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc)
    except Exception:
        return None


def clean_text(s, limit):
    s = html.unescape(TAG_RE.sub(" ", s or ""))
    s = WS_RE.sub(" ", s).strip()
    if len(s) > limit:
        s = s[:limit].rsplit(" ", 1)[0] + "…"
    return s


def get_link(item):
    links = [c for c in item if localname(c.tag) == "link"]
    for c in links:  # Atom: prefer the alternate HTML link
        if (c.get("rel") or "alternate") == "alternate" and c.get("href"):
            return c.get("href").strip()
    for c in links:  # RSS: link text
        if text_of(c):
            return text_of(c)
    return ""


def fetch(url):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (news-bot; satejchaudhari.com)"})
    with urlopen(req, timeout=30) as r:
        return r.read()


def parse_feed(source, raw):
    out = []
    root = ET.fromstring(raw)
    items = [e for e in root.iter() if localname(e.tag) in ("item", "entry")]
    for it in items:
        title = clean_text(text_of(child(it, "title")), 300)
        link = get_link(it)
        when = parse_date(text_of(child(it, "pubDate", "published", "updated", "date")))
        summary = clean_text(text_of(child(it, "description", "summary")), 240)
        if title and link and when:
            out.append(
                {
                    "title": title,
                    "link": link,
                    "source": source,
                    "published": when.isoformat().replace("+00:00", "Z"),
                    "summary": summary,
                }
            )
    return out


def main():
    cutoff = datetime.now(timezone.utc) - timedelta(hours=MAX_AGE_HOURS)
    items, seen = [], set()
    for source, url in FEEDS:
        try:
            parsed = parse_feed(source, fetch(url))
        except Exception as e:  # a dead/blocked feed must not break the build
            print(f"[skip] {source}: {e}", file=sys.stderr)
            continue
        kept = 0
        for it in parsed:
            when = parse_date(it["published"])
            if when is None or when < cutoff or it["link"] in seen:
                continue
            if source in FILTER_SOURCES and not CYBER_RE.search(it["title"] + " " + it["summary"]):
                continue  # drop non-cybersecurity stories from mixed-content sources
            seen.add(it["link"])
            items.append(it)
            kept += 1
        print(f"[ok] {source}: {kept} items in the last {MAX_AGE_HOURS}h")
    items.sort(key=lambda x: x["published"], reverse=True)
    items = items[:MAX_ITEMS]
    updated = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    body = (
        "// AUTO-GENERATED by .github/workflows/news.yml — do not edit by hand.\n"
        "// Refreshed every 3 hours; holds reputable cybersecurity headlines from the last 72 hours.\n"
        f"var NEWS_UPDATED = {json.dumps(updated)};\n"
        f"var NEWS = {json.dumps(items, ensure_ascii=False, indent=1)};\n"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(body)
    print(f"wrote {OUT} with {len(items)} items")


if __name__ == "__main__":
    main()
