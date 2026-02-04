# GG.deals Wishlist Collection

![Project icon](icon.png)

[🇬🇧 EN](README_en.md) · [🇫🇷 FR](README.md)

Scraper and viewer for GG.deals collection + wishlist as a GOG Galaxy-style graphical library.

## ✅ Features

- Collection + wishlist scraping (multi-page) with Puppeteer
- Cloudflare bypass (stealth mode)
- GOG Galaxy-style web interface (original theme preserved)
- Search and sort (name, price)
- Statistics (total, value, average)
- Launcher + platform filters
- Launcher logos (SVG sprite)

## 🧠 Usage (full procedure)

### Quick option (all-in-one)

```bash
chmod +x scripts/run_all.sh
./scripts/run_all.sh
```

The script launches Chrome remote, waits for your login, scrapes collection + wishlist, then generates the site.

### 1. Launch Chrome remote (separate profile)

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome-Remote"
```

Log in to gg.deals in that window.

### 2. Scrape collection (owned games)

```bash
CHROME_REMOTE_DEBUG_PORT=9222 node scripts/scrape_collection.js
```

Data is saved to `scripts/collection.json`.

### 3. Scrape wishlist

```bash
WISHLIST_URL="https://gg.deals/wishlist/share/YOUR_ID/" node scripts/scrape_wishlist.js
```

Data is saved to `scripts/wishlist.json`.

### 4. Generate website

```bash
node scripts/generate.js
```

Generates `web/index.html`.

### 5. View

Open `web/index.html` in a browser.

## ⚙️ Configuration

Set the `WISHLIST_URL` environment variable:

```bash
WISHLIST_URL="https://gg.deals/wishlist/share/YOUR_ID/" node scripts/scrape_wishlist.js
```

## 📁 Structure

```
├── scripts/
│   ├── scrape_wishlist.js # Wishlist scraping
│   ├── scrape_collection.js # Collection scraping (owned games)
│   ├── run_all.sh     # All-in-one runner
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

- 2.0.0: V2 (collection + wishlist, launcher/platform filters, SVG logos, run_all)
- 1.1.0: Project structure refactoring
- 1.0.0: Initial release

## 🔗 Links

- [README FR](README.md)
- [GG.deals](https://gg.deals)
