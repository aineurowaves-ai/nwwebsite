# Neurowaves Website

Static marketing site for [Neurowaves](https://github.com/) — IT, AI, automation & marketing.

## Live structure (deploy this)

```
├── index.html              # Home
├── services.html           # Services
├── cases.html              # Case studies
├── blog.html               # Blog index
├── blog-*.html             # Blog articles (6)
├── case-*.html             # Case detail pages (4)
├── contact.html, faq.html
├── styles.css              # Styles
├── script.js               # Interactions (stars, logo, nav)
├── i18n.js                 # Translations (EN, UK, DE, FR, ES)
├── blog-articles-i18n.js   # Full blog article bodies
└── assets/                 # Images, logos, video
```

All pages use relative paths (`assets/…`, `services.html`, etc.) — works on GitHub Pages, Netlify, or any static host from the repo root.

## Local preview

**Option A — Python (simplest):**

```bash
python -m http.server 8080
```

Open http://localhost:8080/

**Option B — PowerShell server (serves video MIME types):**

```powershell
.\_dev\_serve.ps1 -Port 8080
```

Hard-refresh after CSS/JS changes: **Ctrl+Shift+R**.

## Languages

Site supports EN, UK (Ukrainian), DE, FR, ES via `i18n.js`. Blog full text: EN + UK in `blog-articles-i18n.js`; DE/FR/ES fall back to EN for article bodies.

## Folders not for production

| Folder | Purpose |
|--------|---------|
| `_backup-versions/` | Archived drafts v1–v5 (reference only) |
| `_dev/` | Build scripts, translation cache, source video |

Do not deploy `_backup-versions` or `_dev` unless you explicitly need them.

## GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Source: **Deploy from branch** → `main` → `/ (root)`.
3. Site will be at `https://<user>.github.io/<repo>/`.

## Contact

aineurowaves@gmail.com · +49 175 2078586
