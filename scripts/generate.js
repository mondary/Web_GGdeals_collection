const fs = require('fs');
const path = require('path');

const gamesPath = path.join(__dirname, 'games.json');
const outputPath = path.join(__dirname, '..', 'web', 'index.html');

const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bibliothèque - ${games.length} jeux</title>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    /* ===== STARDUST / GOG GALAXY THEME ===== */
    /* Colors from: github.com/darklinkpower/Stardust */

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      /* Backgrounds */
      --bg-sidebar: #0a0a0a;
      --bg-main: #262c38;
      --bg-dark: #2f3543;
      --bg-popup: #2c2b2e;
      --bg-hover: #333235;
      --bg-search: #3c3a3d;

      /* Text */
      --text-primary: #f2f2f2;
      --text-secondary: #c2c2c2;
      --text-muted: #bababa;
      --text-dark: #2f3543;

      /* Accent - Purple */
      --accent: #a17fd0;
      --accent-light: #ae91d7;
      --accent-selected: #cc90dd;

      /* Status */
      --green: #78ffa0;
      --orange: #ffa500;
      --red: #c85429;

      /* Borders */
      --border: #5c5c5e;
      --border-hover: #8e8d8f;

      /* Radius */
      --radius: 5px;
      --radius-lg: 7px;

      /* Font sizes */
      --fs-small: 12px;
      --fs-normal: 14px;
      --fs-large: 15px;
      --fs-xlarge: 20px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Lato', 'Trebuchet MS', sans-serif;
      font-size: var(--fs-normal);
      background: var(--bg-main);
      color: var(--text-primary);
      min-height: 100vh;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 240px;
      background: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      z-index: 100;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 20px 16px;
      border-bottom: 1px solid var(--bg-hover);
    }

    .logo {
      font-size: var(--fs-xlarge);
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 1px;
    }

    .search-wrapper {
      padding: 16px;
    }

    .search-box {
      width: 100%;
      padding: 10px 14px;
      background: var(--bg-search);
      border: 1px solid transparent;
      border-radius: var(--radius);
      color: var(--text-primary);
      font-size: var(--fs-normal);
      font-family: inherit;
      transition: all 0.2s;
    }

    .search-box::placeholder { color: var(--text-muted); }
    .search-box:focus {
      outline: none;
      border-color: var(--accent);
      background: var(--bg-popup);
    }

    .nav-section {
      padding: 8px 0;
    }

    .nav-title {
      padding: 8px 16px;
      font-size: var(--fs-small);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      color: var(--text-secondary);
      font-size: var(--fs-normal);
      cursor: pointer;
      transition: all 0.15s;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--bg-dark);
      color: var(--accent-light);
      border-left-color: var(--accent);
    }

    .nav-count {
      font-size: var(--fs-small);
      font-weight: 600;
      color: var(--text-muted);
    }

    .nav-item.active .nav-count {
      color: var(--accent);
    }

    .stats-panel {
      margin-top: auto;
      padding: 16px;
      background: var(--bg-popup);
      border-top: 1px solid var(--bg-hover);
    }

    .stats-title {
      font-size: var(--fs-small);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
    }

    .stat-label {
      color: var(--text-muted);
      font-size: var(--fs-small);
    }

    .stat-value {
      font-size: var(--fs-normal);
      font-weight: 600;
      color: var(--accent-light);
    }

    /* ===== MAIN ===== */
    .main {
      margin-left: 240px;
      min-height: 100vh;
      background: var(--bg-main);
    }

    .main-header {
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 16px 24px;
      background: var(--bg-dark);
      border-bottom: 1px solid var(--bg-hover);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .page-title {
      font-size: var(--fs-xlarge);
      font-weight: 600;
      color: var(--text-primary);
    }

    .page-title span {
      font-weight: 400;
      color: var(--text-muted);
      margin-left: 8px;
    }

    .content {
      padding: 24px;
    }

    /* ===== GRID ===== */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }

    .card {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-popup);
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .card:hover {
      transform: translateY(-4px);
      border-color: var(--accent);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }

    .card a {
      display: block;
      text-decoration: none;
      color: inherit;
    }

    .card-image {
      position: relative;
      aspect-ratio: 3/4;
      overflow: hidden;
      background: var(--bg-dark);
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .card:hover .card-image img {
      transform: scale(1.05);
    }

    .card-body {
      padding: 10px 12px 12px;
    }

    .card-title {
      font-size: var(--fs-small);
      font-weight: 400;
      color: var(--text-primary);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-price {
      font-size: var(--fs-normal);
      font-weight: 700;
      color: var(--green);
    }

    .no-results {
      text-align: center;
      padding: 60px 24px;
      color: var(--text-muted);
      font-size: var(--fs-large);
    }

    .hidden { display: none !important; }

    /* ===== SCROLLBAR ===== */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-sidebar); }
    ::-webkit-scrollbar-thumb {
      background: var(--bg-hover);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--border);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 900px) {
      .sidebar { display: none; }
      .main { margin-left: 0; }
    }

    @media (max-width: 600px) {
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
      }
      .content { padding: 16px; }
      .main-header { padding: 12px 16px; }
      .page-title { font-size: 18px; }
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">WISHLIST</div>
    </div>

    <div class="search-wrapper">
      <input type="text" class="search-box" id="search" placeholder="Rechercher...">
    </div>

    <nav class="nav-section">
      <div class="nav-title">Bibliothèque</div>
      <div class="nav-item active">
        Tous les jeux
        <span class="nav-count" id="nav-count">${games.length}</span>
      </div>
    </nav>

    <nav class="nav-section">
      <div class="nav-title">Trier par</div>
      <div class="nav-item" data-sort="name">Nom A-Z</div>
      <div class="nav-item" data-sort="price-asc">Prix ↑</div>
      <div class="nav-item" data-sort="price-desc">Prix ↓</div>
    </nav>

    <div class="stats-panel">
      <div class="stats-title">Stats</div>
      <div class="stat-row">
        <span class="stat-label">Jeux</span>
        <span class="stat-value" id="total-games">${games.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Valeur</span>
        <span class="stat-value" id="total-price">0 €</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Moyenne</span>
        <span class="stat-value" id="avg-price">0 €</span>
      </div>
    </div>
  </aside>

  <main class="main">
    <header class="main-header">
      <h1 class="page-title">Tous les jeux <span id="showing-count">${games.length}</span></h1>
    </header>

    <div class="content">
      <div class="grid" id="grid-view"></div>
      <div class="no-results hidden" id="no-results">Aucun jeu trouvé</div>
    </div>
  </main>

  <script>
    const games = ${JSON.stringify(games)};
    let currentSort = 'name';

    function parsePrice(p) {
      if (!p) return 0;
      return parseFloat(p.replace(/[~€\\s]/g, '').replace(',', '.')) || 0;
    }

    function updateStats(list) {
      const prices = list.map(g => parsePrice(g.price)).filter(p => p > 0);
      const sum = prices.reduce((a, b) => a + b, 0);
      const avg = prices.length ? sum / prices.length : 0;
      document.getElementById('total-games').textContent = list.length;
      document.getElementById('total-price').textContent = sum.toFixed(0) + ' €';
      document.getElementById('avg-price').textContent = avg.toFixed(0) + ' €';
      document.getElementById('nav-count').textContent = list.length;
      document.getElementById('showing-count').textContent = list.length;
    }

    function sortGames(list) {
      return [...list].sort((a, b) => {
        if (currentSort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (currentSort === 'price-asc') return parsePrice(a.price) - parsePrice(b.price);
        return parsePrice(b.price) - parsePrice(a.price);
      });
    }

    function esc(s) {
      if (!s) return '';
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function render(filter) {
      let list = games.filter(g => g.name);
      if (filter) {
        const q = filter.toLowerCase();
        list = list.filter(g => g.name.toLowerCase().includes(q));
      }
      const sorted = sortGames(list);
      updateStats(sorted);

      const grid = document.getElementById('grid-view');
      const noRes = document.getElementById('no-results');

      if (!sorted.length) {
        grid.innerHTML = '';
        noRes.classList.remove('hidden');
        return;
      }
      noRes.classList.add('hidden');

      grid.innerHTML = sorted.map(g =>
        '<div class="card"><a href="'+esc(g.url)+'" target="_blank" rel="noopener">' +
        '<div class="card-image"><img src="'+esc(g.image)+'" alt="'+esc(g.name)+'" loading="lazy"></div>' +
        '<div class="card-body"><div class="card-title">'+esc(g.name)+'</div>' +
        '<div class="card-price">'+esc(g.price||'N/A')+'</div></div></a></div>'
      ).join('');
    }

    render('');

    document.getElementById('search').addEventListener('input', e => render(e.target.value));

    document.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        render(document.getElementById('search').value);
      });
    });
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, html);
console.log('✅ web/index.html généré avec ' + games.length + ' jeux (Stardust theme)');
