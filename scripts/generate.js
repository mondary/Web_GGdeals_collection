const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'collection.json');
const wishlistPath = path.join(__dirname, 'wishlist.json');
const legacyPath = path.join(__dirname, 'games.json');
const templatePath = path.join(__dirname, '..', 'web', 'index.template.html');
const outputPath = path.join(__dirname, '..', 'web', 'index.html');
const drmSpritePath = path.join(__dirname, '..', 'web', 'drms.svg');

const collection = fs.existsSync(collectionPath)
  ? JSON.parse(fs.readFileSync(collectionPath, 'utf8'))
  : [];
const wishlist = fs.existsSync(wishlistPath)
  ? JSON.parse(fs.readFileSync(wishlistPath, 'utf8'))
  : (fs.existsSync(legacyPath) ? JSON.parse(fs.readFileSync(legacyPath, 'utf8')) : []);

const template = fs.readFileSync(templatePath, 'utf8');
const drmSpriteRaw = fs.existsSync(drmSpritePath)
  ? fs.readFileSync(drmSpritePath, 'utf8')
  : '';
const drmSpriteBlock = drmSpriteRaw
  ? drmSpriteRaw.replace(
      /<svg([^>]*)>/i,
      '<svg$1 style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">'
    )
  : '';
const html = template
  .replace('__COLLECTION_DATA__', JSON.stringify(collection))
  .replace('__WISHLIST_DATA__', JSON.stringify(wishlist))
  .replace('<!-- DRM_SPRITE_PLACEHOLDER -->', drmSpriteBlock);

fs.writeFileSync(outputPath, html);
const normalizeCount = (list) => {
  const seen = new Set();
  for (const g of (list || [])) {
    if (!g) continue;
    const url = (g.url || '').trim().toLowerCase();
    const name = (g.name || '').trim().toLowerCase();
    const key = url || name;
    if (!key) continue;
    seen.add(key);
  }
  return seen.size;
};
console.log('✅ web/index.html généré avec ' + normalizeCount(collection) + ' jeux (collection) et ' + normalizeCount(wishlist) + ' jeux (wishlist)');
