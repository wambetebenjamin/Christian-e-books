# E-Book Library

Browser-based, print-ready ebooks. Each title is a self-contained folder (or the repository root, for the first one) with its own `index.html`, `styles.css`, `app.js`, artwork, and a downloadable PDF edition.

## Titles

### 1. The Balanced Berean
A Christian youth field guide for **CHRISCO Youth Aflame** — how to test preaching without quenching the fire.

- Read: `index.html` (repository root)
- PDF: [`The-Balanced-Berean-CHRISCO-Youth-Aflame.pdf`](The-Balanced-Berean-CHRISCO-Youth-Aflame.pdf)

### 2. Clients Aren't Hiding
A field manual for getting hired: how to find clients, write cold pitches that get replies, and land internships, remote jobs and freelance work.

- Read: [`clients-arent-hiding/index.html`](clients-arent-hiding/index.html)
- PDF: [`clients-arent-hiding/Clients-Arent-Hiding.pdf`](clients-arent-hiding/Clients-Arent-Hiding.pdf) (29 pages)
- Contents: The Shift · The Map · The List · The Offer · The Cold Pitch · Proof · Remote Jobs & Internships · The Call & the Close · The 30-Day Sprint · The Swipe File

## View locally

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Open `http://localhost:8080` for *The Balanced Berean* or `http://localhost:8080/clients-arent-hiding/` for *Clients Aren't Hiding*.

## Rebuilding a PDF

*Clients Aren't Hiding* ships with a layout script that typesets the PDF straight from the HTML, with no headless browser required:

```bash
npm i pdfkit cheerio
cd clients-arent-hiding && node tools/build-pdf.js
```

## Features

- Responsive editorial reading experience
- Print/PDF optimized layout
- Reading progress indicator
- Light/dark reading themes
- Original cover artwork and custom visual illustrations
- Worksheets and copy-ready templates
