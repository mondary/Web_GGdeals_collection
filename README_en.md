# GG.deals Wishlist Collection

![Project icon](icon.png)

[🇬🇧 EN](README_en.md) · [🇫🇷 FR](README.md)

Scraper and viewer for GG.deals wishlist as a GOG Galaxy-style graphical library.

## ✅ Features

- Automatic multi-page scraping with Puppeteer
- Cloudflare bypass (stealth mode)
- GOG Galaxy-style web interface
- Search and sort (name, price)
- Statistics (total, value, average)
- Grid and list views

## 🧠 Usage

### 1. Scrape wishlist

```bash
node scripts/scrape_wishlist.js
```

Data is saved to `scripts/wishlist.json`.

### 2. Generate website

```bash
node scripts/generate.js
```

Generates `web/index.html`.

### 3. View

Open `web/index.html` in a browser.

## ⚙️ Configuration

Edit `scripts/scrape_wishlist.js`:

```javascript
const WISHLIST_URL = 'https://gg.deals/wishlist/share/YOUR_ID/';
const TOTAL_PAGES = 11; // Number of pages to scrape
```

## 📁 Structure

```
├── scripts/
│   ├── scrape_wishlist.js # Wishlist scraping
│   ├── generate.js    # HTML generation
│   └── wishlist.json  # Extracted data
├── web/
│   └── index.html     # Web interface
├── README.md
└── README_en.md
```

## 📦 Installation

```bash
npm install
```

Dependencies: `puppeteer-extra`, `puppeteer-extra-plugin-stealth`

## 🧾 Changelog

- 1.1.0: Project structure refactoring
- 1.0.0: Initial release

## 🔗 Links

- [README FR](README.md)
- [GG.deals](https://gg.deals)
