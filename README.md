# MyPDF

A private, browser-based PDF toolkit. Every file is processed locally on your device, and nothing is uploaded to a server.

**Live:** https://sir-troy.github.io/myPDF/

## Features

| Tool | What it does |
|---|---|
| JPG to PDF | Combine JPG, PNG, WEBP, GIF or BMP images into one PDF, with page size, orientation and margin options |
| PDF to JPG | Render each page as a JPG or PNG at 72, 144 or 216 dpi, and download the pages one by one or as a ZIP |
| Merge PDF | Combine several PDFs in a custom order (drag to reorder) |
| Split PDF | Split every page, split by ranges (`1-3, 5, 8-10`), or extract pages into one file |
| Sign PDF | Draw, type or upload a signature, place it on any page, and optionally add the date |

Other features: light and dark themes, a responsive layout and a WebGL hero. The "Your activity" counters are stored only in the browser's localStorage.

## Tech stack

- Vanilla HTML, CSS and JavaScript, with no framework and no build step
- [pdf-lib](https://github.com/Hopding/pdf-lib) to create and edit PDFs
- [PDF.js](https://github.com/mozilla/pdf.js) to render PDFs
- [JSZip](https://github.com/Stuk/jszip) to build ZIP downloads
- [three.js](https://github.com/mrdoob/three.js) for the 3D hero

All libraries are vendored in `lib/`, so the site works without any CDN.

## Project structure

```
index.html     markup for all views (hash-based routing: #merge, #sign, ...)
style.css      styles and themes
app.js         tool logic (convert, merge, split, sign), routing, theme
fx.js          visual effects (3D scene, tilt cards, counters, rotating headline)
config.js      site config (version number)
privacy.html   privacy policy
terms.html     terms of use
lib/           third-party libraries
```

## Run locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly with `file://` won't work, because the PDF.js worker needs to be served over HTTP.

## Deploy (GitHub Pages)

1. Push this folder to a public repository named `myPDF`.
2. Go to **Settings → Pages → Deploy from a branch**, choose `main` and `/ (root)`, then click **Save**.
3. The site is published at `https://<username>.github.io/myPDF/`.

## Releases

Change `VERSION` in `config.js`. The footer shows it automatically.

## Known limitations

- Very large files are limited by the device's memory. On phones, keep files under about 100 MB or 300 pages.
- Password-protected PDFs aren't supported.
- Signatures are visual only. They aren't certified digital signatures (PKI / eIDAS).
- Merge and Split don't keep bookmarks, and fillable form fields may stop working.
- HEIC images only work in Safari.
- There's no OCR, text editing or compression.

## Third-party licenses

| Library | License |
|---|---|
| pdf-lib | MIT |
| PDF.js | Apache-2.0 |
| JSZip | MIT or GPLv3 (dual) |
| three.js | MIT |

The license headers are kept in each file under `lib/`.
