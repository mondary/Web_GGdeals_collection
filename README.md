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

### 1. Scraper la wishlist

```bash
npm install
node scripts/scrape.js
```

Les données sont sauvegardées dans `scripts/games.json`.

### 2. Générer le site web

```bash
node scripts/generate.js
```

Le fichier `web/index.html` est généré.

### 3. Visualiser

Ouvrir `web/index.html` dans un navigateur.

## ⚙️ Configuration

Modifier `scripts/scrape.js` :

```javascript
const WISHLIST_URL = 'https://gg.deals/wishlist/share/VOTRE_ID/';
const TOTAL_PAGES = 11; // Nombre de pages à scraper
```

## 📁 Structure

```
├── scripts/
│   ├── scrape.js      # Scraping Puppeteer
│   ├── generate.js    # Génération HTML
│   └── games.json     # Données extraites
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

- 1.1.0 : Refactorisation structure projet
- 1.0.0 : Version initiale

## 🔗 Liens

- [README EN](README_en.md)
- [GG.deals](https://gg.deals)
