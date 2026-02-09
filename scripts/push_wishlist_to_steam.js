const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

puppeteer.use(StealthPlugin());

const INPUT_PATH = process.env.WISHLIST_INPUT || path.join(__dirname, 'wishlist.json');

const DEFAULT_CHROME_DIR = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
const USER_DATA_DIR = process.env.CHROME_PROFILE_DIR || DEFAULT_CHROME_DIR;
const PROFILE_NAME = process.env.CHROME_PROFILE_NAME || 'Default';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

function waitForEnter(message) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function getSteamLinkFromGG(page) {
  return page.evaluate(() => {
    const textMatch = (el, txt) =>
      (el && el.textContent && el.textContent.toLowerCase().includes(txt));

    // 1) Prefer the header "View on Steam" badge
    const headerBadge = document.querySelector('.game-header-store-link.badge');
    if (headerBadge && textMatch(headerBadge, 'view on steam')) {
      const a = headerBadge.closest('a');
      if (a && a.href) return a.href;
      const du = a ? (a.getAttribute('data-url') || a.getAttribute('data-href')) : null;
      if (du) return du;
    }

    // 2) Try to find any visible "View on Steam"
    const allEls = Array.from(document.querySelectorAll('a, button, span, div'));
    const viewOnSteam = allEls.find(el => textMatch(el, 'view on steam'));
    if (viewOnSteam) {
      const anchor = viewOnSteam.closest('a');
      if (anchor && anchor.href) return anchor.href;
      const dataUrl = viewOnSteam.getAttribute('data-url') || viewOnSteam.getAttribute('data-href');
      if (dataUrl) return dataUrl;
      const parent = viewOnSteam.closest('[data-url],[data-href]');
      if (parent) {
        return parent.getAttribute('data-url') || parent.getAttribute('data-href');
      }
    }

    const urls = [];
    document.querySelectorAll('a').forEach(a => {
      if (a.href) urls.push(a.href);
      const dh = a.getAttribute('data-href');
      const du = a.getAttribute('data-url');
      if (dh) urls.push(dh);
      if (du) urls.push(du);
    });
    document.querySelectorAll('[data-url],[data-href]').forEach(el => {
      const dh = el.getAttribute('data-href');
      const du = el.getAttribute('data-url');
      if (dh) urls.push(dh);
      if (du) urls.push(du);
    });

    const steamDirect = urls.find(u => /store\.steampowered\.com\/app\//i.test(u));
    if (steamDirect) return steamDirect;

    const ggRedirect = urls.find(u => /gg\.deals\/.*redirect/i.test(u));
    if (ggRedirect) return ggRedirect;

    return '';
  });
}

async function getSteamAppIdFromGG(page) {
  const html = await page.content();
  const appMatch = html.match(/store\.steampowered\.com\/app\/(\\d+)/i);
  if (appMatch) return appMatch[1];
  const appIdMatch = html.match(/steam_appid\"?\\s*[:=]\\s*\"?(\\d+)/i);
  if (appIdMatch) return appIdMatch[1];
  const appIdMatch2 = html.match(/steamAppId\"?\\s*[:=]\\s*\"?(\\d+)/i);
  if (appIdMatch2) return appIdMatch2[1];
  return '';
}

async function resolveGgRedirect(url) {
  if (!/gg\.deals\/.*redirect/i.test(url)) return '';
  try {
    // Try HTTP redirect headers first
    const res = await fetch(url, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    if (loc && /store\.steampowered\.com\/app\//i.test(loc)) return loc;
    if (loc && /gg\.deals\/.*redirect/i.test(loc)) url = loc;

    // Fetch HTML and search for Steam URL
    const html = await fetch(url, { redirect: 'follow' }).then(r => r.text());
    const m = html.match(/https?:\/\/store\.steampowered\.com\/app\/\d+\/?/i);
    if (m) return m[0];
    const app = html.match(/steam_appid\"?\s*[:=]\s*\"?(\d+)/i) || html.match(/steamAppId\"?\s*[:=]\s*\"?(\d+)/i);
    if (app) return `https://store.steampowered.com/app/${app[1]}/`;
    return '';
  } catch {
    return '';
  }
}


async function searchSteamByName(page, name) {
  const q = encodeURIComponent(name || '');
  const searchUrl = `https://store.steampowered.com/search/?term=${q}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('a.search_result_row', { timeout: 15000 }).catch(() => {});
  const href = await page.evaluate(() => {
    const first = document.querySelector('a.search_result_row');
    return first ? first.href : '';
  });
  if (href && /store\.steampowered\.com\/app\//i.test(href)) return href;
  return '';
}

async function handleAgeGate(page) {
  const hasGate = await page.$('select#ageYear, select#ageMonth, select#ageDay');
  if (!hasGate) return false;
  // Fill a safe adult date
  await page.select('select#ageYear', '1990').catch(() => {});
  await page.select('select#ageMonth', '1').catch(() => {});
  await page.select('select#ageDay', '1').catch(() => {});
  await page.evaluate(() => {
    const y = document.querySelector('#ageYear');
    const m = document.querySelector('#ageMonth');
    const d = document.querySelector('#ageDay');
    if (y) y.dispatchEvent(new Event('change', { bubbles: true }));
    if (m) m.dispatchEvent(new Event('change', { bubbles: true }));
    if (d) d.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Click the "View Page" button (localized)
  const btn = await page.$('#view_product_page_btn, button[type=\"submit\"], a.btnv6_green_white_innerfade');
  if (btn) {
    await page.evaluate(() => {
      if (typeof ViewProductPage === 'function') ViewProductPage();
    });
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  } else {
    // Fallback: submit the form if button not found
    await page.$eval('form', f => f.submit()).catch(() => {});
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  }
  return true;
}

async function addToWishlistOnSteam(page) {
  // If already wishlisted
  const already = await page.$('.queue_actions .queue_btn_active, .wishlist_added, .added_to_wishlist');
  if (already) return 'already';

  const selector = '#add_to_wishlist, a.btn_add_to_wishlist, .btn_add_to_wishlist, a.add_to_wishlist, a[href*="AddToWishlist"]';
  const btn = await page.$(selector);
  if (btn) {
    try {
      await btn.click();
    } catch {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
      }, selector);
    }
    await delay(1200);
    return 'added';
  }
  return 'not-found';
}

async function run() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.log('❌ wishlist.json introuvable.');
    console.log(`👉 Attendu: ${INPUT_PATH}`);
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  if (!Array.isArray(items) || items.length === 0) {
    console.log('❌ wishlist.json vide.');
    process.exit(1);
  }

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

  let page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('\n🔐 Connexion Steam...');
  await page.goto('https://steamcommunity.com/login/home/', { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('➡️  Connecte-toi sur Steam dans la page ouverte.');
  await waitForEnter('✅ Appuie sur Entrée quand tu es connecté...');

  // Pre-flight age-check on first GG item (to set cookies once)
  const first = items.find(i => i && i.url);
  if (first && first.url) {
    console.log('🧭 Age-check Steam (pré‑validation) ...');
    await page.goto(first.url, { waitUntil: 'networkidle2', timeout: 60000 });
    const appId = await getSteamAppIdFromGG(page);
    if (appId) {
      const ageUrl = `https://store.steampowered.com/agecheck/app/${appId}/`;
      console.log(`➡️  Ouvre l’age-check Steam pour l’app ${appId}.`);
      await page.goto(ageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('➡️  Choisis ton année et clique “Voir la page”.');
      await waitForEnter('✅ Appuie sur Entrée pour démarrer la synchronisation...');
    } else {
      console.log('⚠️  AppID Steam introuvable pour le premier jeu, on continue sans pré‑age-check.');
      await waitForEnter('✅ Appuie sur Entrée pour démarrer la synchronisation...');
    }
  } else {
    await waitForEnter('✅ Appuie sur Entrée pour démarrer la synchronisation...');
  }

  // Reduce age-gate interruptions
  const now = Math.floor(Date.now() / 1000);
  const birth = Math.floor(new Date('1984-01-01').getTime() / 1000);
  await page.setCookie(
    { name: 'birthtime', value: String(birth), domain: '.steampowered.com', path: '/', expires: now + 60 * 60 * 24 * 365 },
    { name: 'lastagecheckage', value: '1-January-1984', domain: '.steampowered.com', path: '/', expires: now + 60 * 60 * 24 * 365 },
    { name: 'birthtime', value: String(birth), domain: '.steamcommunity.com', path: '/', expires: now + 60 * 60 * 24 * 365 },
    { name: 'lastagecheckage', value: '1-January-1984', domain: '.steamcommunity.com', path: '/', expires: now + 60 * 60 * 24 * 365 }
  ).catch(() => {});

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const g = items[i];
    const ggUrl = g.url;
    if (!ggUrl) {
      skipped++;
      continue;
    }

    console.log(`\n[${i + 1}/${items.length}] ${g.name || 'Game'} → GG: ${ggUrl}`);
    try {
      const pages = await browser.pages();
      for (const p of pages) {
        if (p !== page) {
          await p.close().catch(() => {});
        }
      }
      await page.goto(ggUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await delay(1200);

      await page.waitForSelector('body', { timeout: 30000 }).catch(() => {});
      const steamLink = await getSteamLinkFromGG(page);
      if (!steamLink) {
        console.log('  ⚠️  Lien Steam introuvable.');
        const searchUrl = await searchSteamByName(page, g.name || '');
        if (searchUrl) {
          console.log(`  🔎 Steam search: ${searchUrl}`);
          await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        } else {
          skipped++;
          continue;
        }
      } else {
        console.log(`  🔗 Steam: ${steamLink}`);
        if (/gg\.deals\/.*redirect/i.test(steamLink)) {
          const resolved = await resolveGgRedirect(steamLink);
          if (resolved) {
            console.log(`  ↪️  Steam resolved: ${resolved}`);
            await page.goto(resolved, { waitUntil: 'networkidle2', timeout: 60000 });
          } else {
            const appId = await getSteamAppIdFromGG(page);
            if (appId) {
              const appUrl = `https://store.steampowered.com/app/${appId}/`;
              console.log(`  ↪️  Steam appid: ${appId}`);
              await page.goto(appUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            } else {
              const searchUrl = await searchSteamByName(page, g.name || '');
              if (searchUrl) {
                console.log(`  🔎 Steam search: ${searchUrl}`);
                await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
              } else {
                console.log('  ⚠️  Redirection non Steam, skip.');
                skipped++;
                continue;
              }
            }
          }
        } else if (/store\.steampowered\.com\/app\//i.test(steamLink)) {
          await page.goto(steamLink, { waitUntil: 'networkidle2', timeout: 60000 });
        } else {
          const searchUrl = await searchSteamByName(page, g.name || '');
          if (searchUrl) {
            console.log(`  🔎 Steam search: ${searchUrl}`);
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
          } else {
            console.log('  ⚠️  Redirection non Steam, skip.');
            skipped++;
            continue;
          }
        }
      }

      await handleAgeGate(page);
      await delay(1200);
      const res = await addToWishlistOnSteam(page);
      if (res === 'added') {
        console.log('  ✅ Ajouté à la wishlist');
        added++;
      } else if (res === 'already') {
        console.log('  ↪️  Déjà dans la wishlist');
        skipped++;
      } else {
        console.log('  ❌ Bouton wishlist introuvable');
        failed++;
      }

      await delay(800);
    } catch (e) {
      console.log(`  ❌ Erreur: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n🎯 Terminé. Ajoutés: ${added}, Déjà présents/skip: ${skipped}, Échecs: ${failed}`);
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
