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
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-deep: #0d0d12;
      --bg-main: #13131a;
      --bg-elevated: #1a1a24;
      --bg-card: #1e1e2a;
      --bg-hover: #262635;
      --accent: #9a52a3;
      --accent-light: #b366bd;
      --accent-glow: rgba(154, 82, 163, 0.3);
      --text: #e8e8eb;
      --text-secondary: #9898a6;
      --text-muted: #5c5c6e;
      --green: #66d9a0;
      --border: rgba(255,255,255,0.06);
      --radius: 12px;
      --radius-sm: 8px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Lato', -apple-system, sans-serif;
      background: var(--bg-deep);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.5;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 260px;
      background: linear-gradient(180deg, var(--bg-main) 0%, var(--bg-deep) 100%);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 100;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 28px 24px;
      border-bottom: 1px solid var(--border);
    }

    .logo {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 2px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .search-wrapper {
      padding: 20px 16px;
    }

    .search-box {
      width: 100%;
      padding: 12px 16px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }

    .search-box::placeholder { color: var(--text-muted); }
    .search-box:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .nav-section {
      padding: 8px 0;
    }

    .nav-title {
      padding: 12px 24px 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-muted);
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
      transition: all 0.15s;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: var(--bg-elevated);
      color: var(--text);
    }

    .nav-item.active {
      background: linear-gradient(90deg, var(--accent-glow) 0%, transparent 100%);
      color: var(--text);
      border-left-color: var(--accent);
    }

    .nav-count {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      background: var(--bg-hover);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .nav-item.active .nav-count {
      background: var(--accent);
      color: white;
    }

    .stats-panel {
      margin-top: auto;
      padding: 24px;
      background: var(--bg-elevated);
      border-top: 1px solid var(--border);
    }

    .stats-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .stat-label { color: var(--text-muted); font-size: 13px; }
    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--accent-light);
    }

    /* ===== MAIN ===== */
    .main {
      margin-left: 260px;
      min-height: 100vh;
      background: var(--bg-deep);
    }

    .main-header {
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 24px 40px;
      background: rgba(13, 13, 18, 0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
    }

    .page-title span {
      font-weight: 300;
      color: var(--text-muted);
      margin-left: 8px;
    }

    .content {
      padding: 32px 40px 60px;
    }

    /* ===== GRID ===== */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 24px;
    }

    .card {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-card);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow:
        0 20px 40px rgba(0,0,0,0.4),
        0 0 40px var(--accent-glow);
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
      background: var(--bg-elevated);
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card:hover .card-image img {
      transform: scale(1.08);
    }

    .card-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        transparent 0%,
        transparent 50%,
        rgba(0,0,0,0.8) 100%
      );
      opacity: 0;
      transition: opacity 0.3s;
    }

    .card:hover .card-overlay {
      opacity: 1;
    }

    .card-body {
      padding: 14px 16px 16px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-price {
      font-size: 15px;
      font-weight: 700;
      color: var(--green);
    }

    .no-results {
      text-align: center;
      padding: 80px 40px;
      color: var(--text-muted);
      font-size: 16px;
    }

    .hidden { display: none !important; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .sidebar { display: none; }
      .main { margin-left: 0; }
      .main-header { padding: 20px 24px; }
      .content { padding: 24px; }
    }

    @media (max-width: 600px) {
      .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
      .page-title { font-size: 22px; }
    }

    /* ===== SCROLLBAR ===== */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-deep); }
    ::-webkit-scrollbar-thumb {
      background: var(--bg-hover);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">WISHLIST</div>
    </div>

    <div class="search-wrapper">
      <input type="text" class="search-box" id="search" placeholder="Rechercher un jeu...">
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
      <div class="nav-item" data-sort="price-asc">Prix croissant</div>
      <div class="nav-item" data-sort="price-desc">Prix décroissant</div>
    </nav>

    <div class="stats-panel">
      <div class="stats-title">Statistiques</div>
      <div class="stat-row">
        <span class="stat-label">Total jeux</span>
        <span class="stat-value" id="total-games">${games.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Valeur totale</span>
        <span class="stat-value" id="total-price">0 €</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Prix moyen</span>
        <span class="stat-value" id="avg-price">0 €</span>
      </div>
    </div>
  </aside>

  <main class="main">
    <header class="main-header">
      <h1 class="page-title">Tous les jeux<span id="showing-count">${games.length}</span></h1>
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
        '<div class="card-image"><img src="'+esc(g.image)+'" alt="'+esc(g.name)+'" loading="lazy"><div class="card-overlay"></div></div>' +
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
console.log('✅ web/index.html généré avec ' + games.length + ' jeux');
