const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const COLLECTION_URL = 'https://gg.deals/collection/pc/';

async function main() {
  const remotePort = process.env.CHROME_REMOTE_DEBUG_PORT;
  if (!remotePort) {
    console.log('❌ CHROME_REMOTE_DEBUG_PORT manquant.');
    console.log('👉 Exemple : CHROME_REMOTE_DEBUG_PORT=9222 node scripts/test_launchers_top10.js');
    return;
  }

  const remoteUrl = `http://127.0.0.1:${remotePort}`;
  console.log('🔗 Connexion à Chrome existant (remote debugging)...');
  console.log(`🌐 remote: ${remoteUrl}`);

  const browser = await puppeteer.connect({ browserURL: remoteUrl });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  await page.goto(COLLECTION_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.game-item', { timeout: 30000 });

  const results = await page.evaluate(() => {
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
        'drm-free': 'drmfree',
        'drm-steam': 'steam',
        'drm-gog': 'gog',
        'drm-epic': 'epic',
        'drm-ubisoft': 'ubisoft',
        'drm-uplay': 'ubisoft',
        'drm-origin': 'ea',
        'drm-ea': 'ea',
        'drm-battlenet': 'battlenet',
        'drm-battle.net': 'battlenet',
        'drm-microsoft': 'microsoft',
        'drm-xbox': 'microsoft',
        'drm-itch': 'itch',
        'drm-itchio': 'itch',
        'drm-amazon': 'prime',
        'drm-prime': 'prime',
        'drm-rockstar': 'rockstar',
        'drm-galaxy': 'gog'
      };
      return map[v] || (v ? 'other' : '');
    };

    const storeNameRegex = /(steam|epic|gog|ubisoft|uplay|origin|ea app|battle\\.?net|battlenet|xbox|microsoft store|itch\\.io|amazon|prime gaming|humble|rockstar|drm[- ]?free)/i;
    const storeHintRegex = /(store|launcher|games|drm)/i;

    const items = [...document.querySelectorAll('.game-item')].slice(0, 10);
    return items.map(el => {
      const name = el.querySelector('.game-info-title')?.textContent?.trim() || '';
      const candidates = [...el.querySelectorAll('[title], [aria-label], [data-tooltip], [data-store], [data-shop], [data-launcher], [class*="store"], [class*="shop"], [class*="launcher"], [class*="drm"], [class*="svg-drm"]')]
        .map(s => {
          const t = s.getAttribute('title') || s.getAttribute('aria-label') || s.getAttribute('data-tooltip') || s.getAttribute('data-store') || s.getAttribute('data-shop') || s.getAttribute('data-launcher') || '';
          if (t && storeNameRegex.test(t)) return t.trim();
          if (t && storeHintRegex.test(t)) return 'other';
          const cls = [...s.classList].find(c => c.startsWith('svg-store-') || c.startsWith('store-') || c.startsWith('shop-') || c.startsWith('launcher-') || c.startsWith('drm-') || c.startsWith('svg-drm-'));
          if (cls && storeNameRegex.test(cls)) return cls;
          if (cls && storeHintRegex.test(cls)) return 'other';
          return '';
        })
        .filter(Boolean);
      const launchers = [...new Set(candidates.map(normalizeLauncher).filter(Boolean))];
      return { name, candidates, launchers };
    });
  });

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
