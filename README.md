# GG.deals Wishlist Collection

![Project icon](icon.png)

[🇫🇷 FR](README.md) · [🇬🇧 EN](README_en.md)

Scraper et visualiseur de wishlist GG.deals sous forme de bibliothèque graphique style GOG Galaxy.

## ✅ Fonctionnalités

- Scraping automatique multi-pages avec Puppeteer
- Contournement Cloudflare (mode stealth)
- Interface web style GOG Galaxy
- Recherche et tri (nom, prix)
- Statistiques (total, valeur, moyenne)
- Vue grille et liste

## 🧠 Utilisation

### A. Scraper la collection (jeux possédés)

Pré-requis : lancer un Chrome dédié au remote debugging (ne touche pas à ton Chrome principal).

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome-Remote"
```

Dans cette fenêtre, connecte-toi à gg.deals.

Puis lance le scraping :

```bash
CHROME_REMOTE_DEBUG_PORT=9222 node scripts/scrape_collection.js
```

Les données sont sauvegardées dans `scripts/collection.json`.

### B. Scraper la wishlist

```bash
npm install
node scripts/scrape_wishlist.js
```

Les données sont sauvegardées dans `scripts/wishlist.json`.

### C. Générer le site web

```bash
node scripts/generate.js
```

Le fichier `web/index.html` est généré.

### D. Visualiser

Ouvrir `web/index.html` dans un navigateur.

## ⚙️ Configuration

Modifier `scripts/scrape_wishlist.js` :

```javascript
const WISHLIST_URL = 'https://gg.deals/wishlist/share/VOTRE_ID/';
const TOTAL_PAGES = 11; // Nombre de pages à scraper
```

Configuration collection : `scripts/scrape_collection.js` détecte automatiquement le nombre de pages.

## 📁 Structure

```
├── scripts/
│   ├── scrape_wishlist.js # Scraping wishlist
│   ├── scrape_collection.js # Scraping collection (jeux possédés)
│   ├── generate.js    # Génération HTML
│   └── wishlist.json  # Données extraites
├── web/
│   └── index.html     # Interface web
├── README.md
└── README_en.md
```

## 📦 Installation

```bash
npm install
```

Dépendances : `puppeteer-extra`, `puppeteer-extra-plugin-stealth`

## 🧾 Changelog

- 1.1.1 : Mise à jour interface (style GOG, header, stats, recherche, colonnes)
- 1.1.0 : Refactorisation structure projet
- 1.0.0 : Version initiale

## 🔗 Liens

- [README EN](README_en.md)
- [GG.deals](https://gg.deals)
