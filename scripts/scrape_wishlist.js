const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const WISHLIST_URL = process.env.WISHLIST_URL || '';
const TOTAL_PAGES = 11;
const OUTPUT_PATH = path.join(__dirname, 'wishlist.json');

async function scrapeWishlist() {
  if (!WISHLIST_URL || /VOTRE_ID|YOUR_ID|EXAMPLE|TODO/i.test(WISHLIST_URL)) {
    console.log('❌ WISHLIST_URL manquant.');
    console.log('👉 Exemple : WISHLIST_URL="https://gg.deals/wishlist/share/TON_ID/" node scripts/scrape_wishlist.js');
    return;
  }
  console.log('🚀 Lancement du navigateur (mode stealth)...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let allGames = [];

  for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
    const url = pageNum === 1 ? WISHLIST_URL : `${WISHLIST_URL}?page=${pageNum}`;
    console.log(`📖 Page ${pageNum}/${TOTAL_PAGES}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 2000));

      // Scroll pour charger tous les éléments (lazy loading)
      await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) {
          window.scrollBy(0, window.innerHeight);
          await new Promise(r => setTimeout(r, 500));
        }
        window.scrollTo(0, 0);
      });

      await new Promise(r => setTimeout(r, 2000));
      await page.waitForSelector('.game-item', { timeout: 30000 });

      // Extraire les données enrichies
      const games = await page.evaluate(() => {
        return [...document.querySelectorAll('.game-item')].map(el => {
          const infoWrapper = el.querySelector('.game-info-wrapper');
          const name = infoWrapper?.querySelector('.game-info-title')?.textContent?.trim();
          const price = el.querySelector('.price-inner')?.textContent?.trim();
          const image = el.querySelector('img')?.src;
          const url = infoWrapper?.querySelector('a')?.href;

          // Données additionnelles si disponibles sur la wishlist
          const rating = el.querySelector('.game-score')?.textContent?.trim();
          const platforms = [...el.querySelectorAll('[class*="platform"], [class*="svg-platform"]')]
            .map(p => {
              const t = p.getAttribute('title') || p.getAttribute('aria-label') || p.getAttribute('data-tooltip') || '';
              if (t) return t.trim();
              const cls = [...p.classList].find(c => c.startsWith('svg-platform-') || c.startsWith('platform-'));
              return cls ? cls.replace(/^svg-platform-/, '').replace(/^platform-/, '') : '';
            })
            .filter(Boolean);

          const uniquePlatforms = [...new Set(platforms.map(p => p.toLowerCase()))]
            .filter(p => p && p !== 'link icon');

          const storeNameRegex = /(steam|epic|gog|ubisoft|uplay|origin|ea app|battle\\.?net|battlenet|xbox|microsoft store|itch\\.io|amazon|prime gaming|humble|rockstar|drm[- ]?free)/i;
          const storeHintRegex = /(store|launcher|games)/i;
          const launchers = [...el.querySelectorAll('[title], [aria-label], [data-tooltip], [data-store], [data-shop], [data-launcher], [class*="store"], [class*="shop"], [class*="launcher"]')]
            .map(s => {
              const t = s.getAttribute('title') || s.getAttribute('aria-label') || s.getAttribute('data-tooltip') || s.getAttribute('data-store') || s.getAttribute('data-shop') || s.getAttribute('data-launcher') || '';
              if (t && storeNameRegex.test(t)) return t.trim();
              if (t && storeHintRegex.test(t)) return 'other';
              const cls = [...s.classList].find(c => c.startsWith('svg-store-') || c.startsWith('store-') || c.startsWith('shop-') || c.startsWith('launcher-'));
              if (cls && storeNameRegex.test(cls)) return cls;
              if (cls && storeHintRegex.test(cls)) return 'other';
              return '';
            })
            .filter(Boolean);

          const normalizeLauncher = (s) => {
            const v = s.toLowerCase();
            const map = {
              'steam': 'steam',
              'steam store': 'steam',
              'epic games': 'epic',
              'epic games store': 'epic',
              'epic games launcher': 'epic',
              'gog': 'gog',
              'gog.com': 'gog',
              'gog galaxy': 'gog',
              'origin': 'ea',
              'ea app': 'ea',
              'ubisoft connect': 'ubisoft',
              'uplay': 'ubisoft',
              'battle.net': 'battlenet',
              'battlenet': 'battlenet',
              'xbox': 'microsoft',
              'microsoft store': 'microsoft',
              'itch.io': 'itch',
              'amazon games': 'prime',
              'prime gaming': 'prime',
              'humble': 'other',
              'rockstar': 'rockstar',
              'rockstar games': 'rockstar',
              'rockstar games launcher': 'rockstar',
              'drm free': 'drmfree',
              'drm-free': 'drmfree'
            };
            return map[v] || (v ? 'other' : '');
          };

          const blacklist = new Set([
            'windows', 'mac', 'linux', 'steam deck', 'steam deck verified', 'steam deck playable',
            'pc vr', 'vr', 'geforce now', 'link icon', 'playstation', 'nintendo', 'xbox cloud gaming',
            'steam deck compatible', 'steam deck unsupported'
          ]);

          const uniqueLaunchers = [...new Set(launchers.map(l => normalizeLauncher(l)).filter(l => l && !blacklist.has(l)))];

          return { name, price, image, url, rating, platforms: uniquePlatforms, launchers: uniqueLaunchers };
        });
      });

      console.log(`   ✅ ${games.length} jeux trouvés`);
      allGames = allGames.concat(games);
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allGames, null, 2));

    } catch (error) {
      console.log(`   ❌ Erreur page ${pageNum}: ${error.message}`);
      await page.screenshot({ path: `error_page${pageNum}.png` });
    }

    if (pageNum < TOTAL_PAGES) {
      console.log('   ⏳ Pause 3s...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  await browser.close();
  console.log(`\n🎮 Total: ${allGames.length} jeux sauvegardés dans wishlist.json`);
  return allGames;
}

scrapeWishlist().catch(console.error);
