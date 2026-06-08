# Reidius Infra — Complete Local Project

## Quick Start

```bash
cd ~/Documents/reidius-infra-local
./start.sh           # opens on http://localhost:8787
./start.sh 9000      # custom port
```

---

## Folder Structure

```
reidius-infra-local/
│
├── *.html                    ← All 13 pages (Framer-exported, Firebase-linked)
├── serve.py                  ← Dev server (run this)
├── start.sh                  ← Quick launcher
├── README.md                 ← This file
│
├── js/
│   ├── calculator.js         ← ✅ Cost calculator logic
│   ├── firebase-config.js    ← ⚠️  PLACEHOLDER (fill in Firebase keys)
│   ├── form-handler.js       ← ⚠️  PLACEHOLDER (needs recovery)
│   └── main.js               ← ⚠️  PLACEHOLDER (unused in HTML)
│
└── assets/
    ├── framer_cdn/           ← ✅ 171 Framer CDN files (mjs, woff2, json)
    │   ├── app.framerstatic.com/
    │   ├── fonts.gstatic.com/
    │   ├── framer.com/
    │   ├── framerusercontent.com/
    │   └── www.dropbox.com/
    ├── fonts/                ← ✅ 65 woff2 font files
    ├── *.pdf                 ← ✅ 4 portfolio PDF files
    ├── images/ (empty)       ← ✅ Served from Firebase Storage
    └── videos/ (empty)       ← ✅ Served from Firebase Storage
```

---

## Asset Architecture

| Asset | Count | Location | Notes |
|-------|-------|----------|-------|
| HTML pages | 13 | This folder | All Firebase URLs baked in |
| JS bundles (.mjs) | 55 | `assets/framer_cdn/` | Framer site bundles |
| Fonts (.woff2) | 65 | `assets/fonts/` + `assets/framer_cdn/` | Inter, Archivo, etc. |
| PDFs | 4 | `assets/` | Portfolio docs |
| Images | 275 | Firebase Storage | `images%2F[name]?alt=media` |
| Videos | 10 | Firebase Storage | `videos%2F[name]?alt=media` |

---

## Firebase Storage

- **Bucket:** `gs://ri-website-c476b.firebasestorage.app`
- **Console:** https://console.firebase.google.com/project/ri-website-c476b/storage

All 285 assets (images + videos) were uploaded on **2026-06-08**.

URL format:
```
https://firebasestorage.googleapis.com/v0/b/ri-website-c476b.firebasestorage.app/o/images%2FFILENAME?alt=media
https://firebasestorage.googleapis.com/v0/b/ri-website-c476b.firebasestorage.app/o/videos%2FFILENAME?alt=media
```

---

## ⚠️ Action Required: firebase-config.js

The original `firebase-config.js` was lost (iCloud evicted). Fill in the placeholder:

1. Go to [Firebase Console](https://console.firebase.google.com/project/ri-website-c476b/settings/general)
2. Scroll to **Your Apps** → Web app → **SDK setup and configuration**
3. Copy the config object and paste into `js/firebase-config.js`

---

## ⚠️ Action Required: form-handler.js

Original `form-handler.js` (8.4 KB) was lost (iCloud evicted).  
Options to recover:
- Re-enable iCloud sync on Mac → file will re-download automatically
- Restore from any git remote/backup

---

## Pages

| Page | File |
|------|------|
| Home | `index.html` |
| About | `about.html` |
| Residences | `residences.html` |
| Architecture | `architecture.html` |
| Interior | `interior.html` |
| Commercial | `commercial.html` |
| Blog | `blog.html` |
| Careers | `careers.html` |
| Contact | `contact.html` |
| Cost Calculator | `calculator.html` |
| Consult Form | `consult-form.html` |
| Privacy Policy | `privacy-policy.html` |
| Terms | `terms-and-conditions.html` |

---

## Refreshing CDN Cache

If Framer updates their bundles, re-download:

```bash
node /tmp/restore_to_tmp.mjs        # downloads to /tmp
cp -r /tmp/framer_local_cdn/. ~/Documents/reidius-infra-local/assets/framer_cdn/
```
