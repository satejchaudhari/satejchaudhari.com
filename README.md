
## How the site is put together

```
index.html                 → homepage: about + preview of latest writeups & blog posts
writeups.html               → full, filterable list of all writeups
blog.html                    → full, filterable list of all blog posts
toolkit.html                 → searchable master toolkit page
post-template.html           → not used directly — see posts/post-template.html
posts/                        → every writeup and blog post lives here as its own .html file
  post-template.html          → COPY THIS to create a new post
assets/css/style.css          → all styling — the entire visual identity, one file
assets/js/posts.js            → the list of writeups & blog posts (title, date, type, tag, url...)
assets/js/toolkit.js          → the list of tools shown on toolkit.html
assets/js/main.js             → renders homepage previews + writeups.html / blog.html — you never edit this
assets/js/toolkit-main.js     → renders toolkit.html — you never edit this
assets/img/                   → put images here
```

---

## Adding a new writeup or blog post

**1. Copy the template**
Duplicate `posts/post-template.html` and give it a clear filename inside `/posts/`, e.g.:
```
posts/2026-07-15-abusing-wsus-for-lateral-movement.html
```

**2. Edit the copy**
Open it and change the parts marked with numbered comments:
- the `<title>` and meta description
- the "back to" link at the top — point it at `../writeups.html` or `../blog.html` depending on the type
- the tag (free text — `RECON`, `WEB`, `AD`, `NOTES`, whatever fits)
- the post title and date
- the content inside `<div class="post-body">` — this is just HTML: `<p>`, `<h2>`, `<ul>`, `<pre><code>`, `<img>`, `<blockquote>` are all pre-styled

**3. Register it in `assets/js/posts.js`**
Add one object to the top of the `POSTS` array:
```js
{
  title: "Abusing WSUS for Lateral Movement",
  url: "posts/2026-07-15-abusing-wsus-for-lateral-movement.html",
  date: "2026-07-15",
  type: "writeup",           // or "blog"
  tag: "WRITEUP",
  description: "How an unauthenticated WSUS server becomes a domain-wide code exec primitive.",
  readTime: "8 min read"
}
```
`type` controls which page it shows up on (`writeups.html` or `blog.html`) and which homepage preview it appears in. `tag` is free text and drives the filter buttons on that page automatically.

**4. Save and check `index.html`, `writeups.html` / `blog.html`** — the new post appears at the top of the relevant list, and if the tag is new, a filter button for it appears automatically.

That's the entire workflow. No commands to run.

---

## Adding a tool to the toolkit

Open `assets/js/toolkit.js` and add an entry to the right category:
```js
{ name: "Tool Name", url: "https://...", description: "One line on what it's for." }
```
Or add a whole new category by adding a new `{ category: "...", tools: [...] }` object to the array. The page — including the search box — rebuilds itself from this file. Double-check URLs before publishing so the page stays a reliable jumping-off point.

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

