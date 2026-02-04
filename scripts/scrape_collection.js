const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const os = require('os');

puppeteer.use(StealthPlugin());

// Collection (owned games) scraping
const COLLECTION_URL = 'https://gg.deals/collection/pc/';
// TOTAL_PAGES is determined dynamically from pagination
const OUTPUT_PATH = path.join(__dirname, 'collection.json');

// Use existing Chrome profile for logged-in session
const DEFAULT_CHROME_DIR = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
const USER_DATA_DIR = process.env.CHROME_PROFILE_DIR || DEFAULT_CHROME_DIR;
const PROFILE_NAME = process.env.CHROME_PROFILE_NAME || 'Default';

async function scrapeCollection() {
  const remotePort = process.env.CHROME_REMOTE_DEBUG_PORT;
  let browser;

  if (remotePort) {
    const remoteUrl = `http://127.0.0.1:${remotePort}`;
    console.log('🔗 Connexion à Chrome existant (remote debugging)...');
    console.log(`🌐 remote: ${remoteUrl}`);
    browser = await puppeteer.connect({ browserURL: remoteUrl });
  } else {
    console.log('🚀 Lancement du navigateur (profil Chrome existant)...');
    console.log(`📁 userDataDir: ${USER_DATA_DIR}`);
    console.log(`👤 profile: ${PROFILE_NAME}`);

    browser = await puppeteer.launch({
      headless: false,
      userDataDir: USER_DATA_DIR,
      args: [
        `--profile-directory=${PROFILE_NAME}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ]
    });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let allGames = [];
  const seen = new Map(); // key: url or name
  let totalPages = null;

  for (let pageNum = 1; ; pageNum++) {
    const url = pageNum === 1 ? COLLECTION_URL : `${COLLECTION_URL}?page=${pageNum}`;
    const totalLabel = totalPages === null ? '?' : String(totalPages);
    console.log(`📖 Page ${pageNum}/${totalLabel}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 2000));

      if (totalPages === null) {
        totalPages = await page.evaluate(() => {
          // Try to detect last page from pagination links
          const candidates = [
            ...document.querySelectorAll('a[href*="page="]'),
          ];
          const pageNums = candidates
            .map(a => {
              const href = a.getAttribute('href') || '';
              const match = href.match(/page=(\d+)/);
              return match ? parseInt(match[1], 10) : NaN;
            })
            .filter(n => Number.isFinite(n));
          return pageNums.length ? Math.max(...pageNums) : 1;
        });
        console.log(`🧮 Pages détectées: ${totalPages}`);
      }

      // Scroll pour charger tous les éléments (lazy loading)
      await page.evaluate(async () => {
        for (let i = 0; i < 12; i++) {
          window.scrollBy(0, window.innerHeight);
          await new Promise(r => setTimeout(r, 400));
        }
        window.scrollTo(0, 0);
      });

      await new Promise(r => setTimeout(r, 2000));
      await page.waitForSelector('.game-item', { timeout: 30000 });

      const games = await page.evaluate(() => {
        return [...document.querySelectorAll('.game-item')].map(el => {
          const infoWrapper = el.querySelector('.game-info-wrapper');
          const name = infoWrapper?.querySelector('.game-info-title')?.textContent?.trim();
          const price = el.querySelector('.price-inner')?.textContent?.trim();
          const image = el.querySelector('img')?.src;
          const url = infoWrapper?.querySelector('a')?.href;
          const rating = el.querySelector('.game-score')?.textContent?.trim();
          const platforms = [...el.querySelectorAll('[class*="platform"], [class*="svg-platform"]')]
            .map(p => {
              const t = p.getAttribute('title') || p.getAttribute('aria-label') || p.getAttribute('data-tooltip') || '';
              if (t) return t.trim();
              const cls = [...p.classList].find(c => c.startsWith('svg-platform-') || c.startsWith('platform-'));
              return cls ? cls.replace(/^svg-platform-/, '').replace(/^platform-/, '') : '';
            })
            .filter(Boolean);

          const uniquePlatforms = [...new Set(platforms.map(p => p.toLowerCase()))];

          return { name, price, image, url, rating, platforms: uniquePlatforms };
        });
      });

      console.log(`   ✅ ${games.length} jeux trouvés`);
      for (const g of games) {
        const key = g.url || g.name;
        if (!key) continue;
        if (!seen.has(key)) {
          seen.set(key, g);
          allGames.push(g);
        }
      }
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allGames, null, 2));

    } catch (error) {
      console.log(`   ❌ Erreur page ${pageNum}: ${error.message}`);
      await page.screenshot({ path: `error_collection_page${pageNum}.png` });
    }

    if (totalPages !== null && pageNum >= totalPages) break;
    console.log('   ⏳ Pause 2s...');
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
  console.log(`\n🎮 Total: ${allGames.length} jeux sauvegardés dans collection.json`);
  return allGames;
}

scrapeCollection().catch(console.error);
