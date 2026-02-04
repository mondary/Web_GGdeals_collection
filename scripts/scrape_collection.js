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

          const uniquePlatforms = [...new Set(platforms.map(p => p.toLowerCase()))]
            .filter(p => p && p !== 'link icon');

          const storeNameRegex = /(steam|epic|gog|ubisoft|uplay|origin|ea app|battle\\.?net|battlenet|xbox|microsoft store|itch\\.io|amazon|prime gaming|humble|rockstar|drm[- ]?free)/i;
          const storeHintRegex = /(store|launcher|games|drm)/i;
          const launchers = [...el.querySelectorAll('[title], [aria-label], [data-tooltip], [data-store], [data-shop], [data-launcher], [class*="store"], [class*="shop"], [class*="launcher"], [class*="drm"], [class*="svg-drm"]')]
            .map(s => {
              const t = s.getAttribute('title') || s.getAttribute('aria-label') || s.getAttribute('data-tooltip') || s.getAttribute('data-store') || s.getAttribute('data-shop') || s.getAttribute('data-launcher') || '';
              if (t && storeNameRegex.test(t)) return t.trim();
              if (t && storeHintRegex.test(t)) return 'other';
              const cls = [...s.classList].find(c => c.startsWith('svg-store-') || c.startsWith('store-') || c.startsWith('shop-') || c.startsWith('launcher-') || c.startsWith('drm-') || c.startsWith('svg-drm-'));
              if (cls && (cls.startsWith('drm-') || cls.startsWith('svg-drm-'))) return cls;
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
              'rockstar': 'rockstar',
              'rockstar games': 'rockstar',
              'rockstar games launcher': 'rockstar',
              'drm free': 'drmfree',
              'drm-free': 'drmfree',
              'drm-steam': 'steam',
              'drm-gog': 'gog',
              'drm-epic': 'epic',
              'drm-epic-games': 'epic',
              'drm-ubisoft': 'ubisoft',
              'drm-uplay': 'ubisoft',
              'drm-origin': 'ea',
              'drm-ea': 'ea',
              'drm-battlenet': 'battlenet',
              'drm-battle.net': 'battlenet',
              'drm-battle-net': 'battlenet',
              'drm-microsoft': 'microsoft',
              'drm-xbox': 'microsoft',
              'drm-itch': 'itch',
              'drm-itchio': 'itch',
              'drm-amazon': 'prime',
              'drm-prime': 'prime',
              'drm-prime-gaming': 'prime',
              'drm-rockstar': 'rockstar',
              'drm-galaxy': 'gog',
              'drm-other': 'other'
            };
            return map[v] || (v ? 'other' : '');
          };

          const blacklist = new Set([
            'windows', 'mac', 'linux', 'steam deck', 'steam deck verified', 'steam deck playable',
            'pc vr', 'vr', 'geforce now', 'link icon', 'playstation', 'nintendo', 'xbox cloud gaming',
            'steam deck compatible', 'steam deck unsupported'
          ]);

          let uniqueLaunchers = [...new Set(launchers.map(l => normalizeLauncher(l)).filter(l => l && !blacklist.has(l)))];
          if (uniqueLaunchers.length > 1 && uniqueLaunchers.includes('other')) {
            uniqueLaunchers = uniqueLaunchers.filter(l => l !== 'other');
          }

          const dataUrl = el.querySelector('a.collection-drms')?.getAttribute('data-url') || '';
          return { name, price, image, url, rating, platforms: uniquePlatforms, launchers: uniqueLaunchers, dataUrl };
        });
      });

      // Enrich missing launchers via collection modal endpoint (if available)
      const missing = games.filter(g => (!g.launchers || g.launchers.length === 0) && g.dataUrl);
      if (missing.length) {
        const extra = await page.evaluate(async (items) => {
          const normalize = (s) => (s || '').toLowerCase();
          const map = (v) => {
            const m = {
              'drm-steam': 'steam',
              'drm-gog': 'gog',
              'drm-epic-games': 'epic',
              'drm-ubisoft-connect': 'ubisoft',
              'drm-uplay': 'ubisoft',
              'drm-ea': 'ea',
              'drm-origin': 'ea',
              'drm-battle-net': 'battlenet',
              'drm-battlenet': 'battlenet',
              'drm-microsoft-store': 'microsoft',
              'drm-xbox': 'microsoft',
              'drm-rockstar': 'rockstar',
              'drm-prime-gaming': 'prime',
              'drm-itch-io': 'itch',
              'drm-drm-free': 'drmfree'
            };
            return m[v] || '';
          };
          const results = {};
          for (const it of items) {
            try {
              const res = await fetch(it.dataUrl, { credentials: 'include' });
              const html = await res.text();
              const m = html.match(/drm-[a-z0-9-]+/gi) || [];
              const launchers = [...new Set(m.map(x => map(normalize(x))).filter(Boolean))];
              results[it.dataUrl] = launchers;
            } catch (e) {
              results[it.dataUrl] = [];
            }
          }
          return results;
        }, missing.map(m => ({ dataUrl: m.dataUrl })));

        for (const g of games) {
          if ((!g.launchers || g.launchers.length === 0) && g.dataUrl && extra[g.dataUrl]?.length) {
            g.launchers = extra[g.dataUrl];
          }
        }
      }

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
