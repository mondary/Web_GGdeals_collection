const fs = require('fs');

const inputPath = process.argv[2];
const html = inputPath ? fs.readFileSync(inputPath, 'utf8') : '';

if (!html) {
  console.log('Usage: node scripts/test_launchers.js path/to/snippet.html');
  process.exit(1);
}

const storeNameRegex = /(steam|epic|gog|ubisoft|uplay|origin|ea app|battle\\.?net|battlenet|xbox|microsoft store|itch\\.io|amazon|prime gaming|humble|rockstar|drm[- ]?free)/i;
const storeHintRegex = /(store|launcher|games|drm)/i;

const classMatches = [...html.matchAll(/class=\"([^\"]+)\"/g)].map(m => m[1].split(/\\s+/)).flat();
const attrMatches = [
  ...html.matchAll(/(title|aria-label|data-tooltip|data-store|data-shop|data-launcher)=\"([^\"]+)\"/g)
].map(m => m[2]);

const candidates = [];
for (const v of attrMatches) {
  if (storeNameRegex.test(v)) candidates.push(v);
  else if (storeHintRegex.test(v)) candidates.push('other');
}
for (const c of classMatches) {
  if (/^(svg-store-|store-|shop-|launcher-|drm-|svg-drm-)/.test(c)) candidates.push(c);
}

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

const unique = [...new Set(candidates.map(normalizeLauncher).filter(Boolean))];
console.log('candidates:', candidates);
console.log('launchers:', unique);
