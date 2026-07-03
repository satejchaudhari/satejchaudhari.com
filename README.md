# 0x1n1t — security writeups log

A minimal, dark cybersecurity blog built in plain HTML, CSS, and JavaScript — no frameworks, no build step, no npm install. Deployed for free on Cloudflare Pages.

---

## How the site is put together

```
index.html                 → homepage, lists every post automatically
post-template.html         → COPY THIS to create a new post
posts/                     → every actual post lives here as its own .html file
assets/css/style.css       → all styling — the entire visual identity, one file
assets/js/posts.js         → the list of posts (title, date, tag, url, description)
assets/js/main.js          → reads posts.js and renders the homepage — you never edit this
assets/img/                → put your images here
```

The homepage doesn't scan folders (plain HTML/JS can't do that without a server). Instead, `assets/js/posts.js` is a simple list you keep up to date by hand — takes about 10 seconds per post.

---

## Adding a new post (do this every time)

**1. Copy the template**
Duplicate `post-template.html`, put the copy inside `/posts/`, and give it a clear filename, e.g.:
```
posts/2026-07-15-abusing-wsus-for-lateral-movement.html
```

**2. Edit the copy**
Open it and change the parts marked `<!-- 1. CHANGE ... -->` through `<!-- 5. WRITE YOUR POST BELOW -->`:
- the `<title>` and meta description
- the tag (`WRITEUP`, `NOTES`, `TOOL`, `RESEARCH` — or make up your own)
- the post title and date
- the content inside `<div class="post-body">` — this is just HTML: `<p>`, `<h2>`, `<ul>`, `<pre><code>`, `<img>`, `<blockquote>` are all pre-styled

**3. Register it in `posts.js`**
Open `assets/js/posts.js` and add one object to the top of the `POSTS` array:
```js
{
  title: "Abusing WSUS for Lateral Movement",
  url: "posts/2026-07-15-abusing-wsus-for-lateral-movement.html",
  date: "2026-07-15",
  tag: "WRITEUP",
  description: "How an unauthenticated WSUS server becomes a domain-wide code exec primitive.",
  readTime: "8 min read"
}
```

**4. Save and check `index.html`** — the new post appears at the top of the log, and if the tag is new, a filter button for it appears automatically.

That's the entire workflow. No commands to run.

---

## Adding images to a post

1. Put the image file in `assets/img/` — organizing by post keeps things tidy, e.g.:
   ```
   assets/img/wsus-lateral-movement/screenshot1.png
   ```
2. Reference it from inside `/posts/your-post.html` (note the `../` since posts live one folder down):
   ```html
   <img src="../assets/img/wsus-lateral-movement/screenshot1.png" alt="Describe the image">
   ```
3. Want a caption under it? Wrap it in a `<figure>`:
   ```html
   <figure>
     <img src="../assets/img/wsus-lateral-movement/screenshot1.png" alt="Describe the image">
     <figcaption>Optional caption text.</figcaption>
   </figure>
   ```

Images are automatically sized to fit the page width, rounded, and bordered to match the rest of the site — no extra styling needed.

---

## Previewing locally before you publish

Because the homepage loads `posts.js` and `main.js` as plain `<script>` tags (not `fetch`), you can just **double-click `index.html`** and it works straight from your file system — no local server required. This also applies to every individual post page.

---

## Deploying to Cloudflare Pages

Since your domain is already on Cloudflare, this is the smoothest path:

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → select your repo.
3. Build settings:
   ```
   Framework preset: None
   Build command:    (leave blank)
   Build output directory: /
   ```
   (There's nothing to build — it's static HTML/CSS/JS as-is.)
4. Deploy. You'll get a free `*.pages.dev` URL immediately.
5. In the Pages project → **Custom domains** → **Set up a domain** → enter your domain. Since Cloudflare already manages your DNS, the record is added automatically.

Every future `git push` redeploys the live site within seconds.

---

## Changing the look

Everything visual lives in `assets/css/style.css`:
- `--bg`, `--panel` — background colors
- `--accent` — the amber highlight color (tags, links on hover, cursor blink)
- `--mono` / `--sans` — the two font families used throughout

Change a value once at the top of the file (`:root { ... }`) and it applies sitewide.

---

## Notes

- No comments, analytics, or tracking are included — this is intentionally a plain, fast, static log.
- Tags are free text — use whatever categories make sense to you; the filter bar builds itself from whatever's actually in `posts.js`.
- There's no database and no server-side code, so there's nothing to secure or patch beyond keeping the static files themselves sane.
