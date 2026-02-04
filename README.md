# GG.deals Wishlist Collection

![Project icon](icon.png)

[🇫🇷 FR](README.md) · [🇬🇧 EN](README_en.md)

Scraper et visualiseur de collection + wishlist GG.deals sous forme de bibliothèque graphique style GOG Galaxy.

## ✅ Fonctionnalités

- Scraping collection + wishlist (multi-pages) avec Puppeteer
- Contournement Cloudflare (mode stealth)
- Interface web style GOG Galaxy (thème d’origine conservé)
- Recherche et tri (nom, prix)
- Statistiques (total, valeur, moyenne)
- Filtres launchers + plateformes
- Logos launchers (SVG sprite)

## 🧠 Utilisation (procédure complète)

### Option rapide (tout-en-un)

```bash
chmod +x scripts/run_all.sh
./scripts/run_all.sh
```

Le script lance Chrome remote, attend ta connexion, scrape collection + wishlist, puis génère le site.

### 1. Lancer Chrome remote (profil séparé)

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome-Remote"
```

Dans cette fenêtre, connecte-toi à gg.deals.

### 2. Scraper la collection (jeux possédés)

```bash
CHROME_REMOTE_DEBUG_PORT=9222 node scripts/scrape_collection.js
```

Les données sont sauvegardées dans `scripts/collection.json`.

### 3. Scraper la wishlist

```bash
npm install
WISHLIST_URL="https://gg.deals/wishlist/share/TON_ID/" node scripts/scrape_wishlist.js
```

Les données sont sauvegardées dans `scripts/wishlist.json`.

### 4. Générer le site web (thème d’origine + injection collection/wishlist)

```bash
node scripts/generate.js
```

Le fichier `web/index.html` est généré.

### 5. Visualiser

Ouvrir `web/index.html` dans un navigateur.

## ⚙️ Configuration

Configurer la variable d’environnement `WISHLIST_URL` :

```javascript
WISHLIST_URL="https://gg.deals/wishlist/share/TON_ID/" node scripts/scrape_wishlist.js
const TOTAL_PAGES = 11; // Nombre de pages à scraper
```

Configuration collection : `scripts/scrape_collection.js` détecte automatiquement le nombre de pages.

## 📁 Structure

```
├── scripts/
│   ├── scrape_wishlist.js # Scraping wishlist
│   ├── scrape_collection.js # Scraping collection (jeux possédés)
│   ├── run_all.sh     # Exécution complète
│   ├── generate.js    # Génération HTML
│   ├── wishlist.json  # Données wishlist
│   └── collection.json # Données collection
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

- 2.0.4 : Patch (scroll launchers retiré, other corrigé)
- 2.0.3 : Patch (publication données + index généré)
- 2.0.2 : Patch (filtres launchers corrigés dans l’UI)
- 2.0.1 : Patch (run_all demande WISHLIST_URL, scraping launchers drm-*)
- 2.0.0 : V2 (collection + wishlist, launchers/plateformes, logos SVG, run_all)
- 1.1.1 : Mise à jour interface (style GOG, header, stats, recherche, colonnes)
- 1.1.0 : Refactorisation structure projet
- 1.0.0 : Version initiale

## 🔗 Liens

- [README EN](README_en.md)
- [GG.deals](https://gg.deals)
