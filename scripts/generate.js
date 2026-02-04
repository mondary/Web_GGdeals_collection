const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'collection.json');
const wishlistPath = path.join(__dirname, 'wishlist.json');
const legacyPath = path.join(__dirname, 'games.json');
const templatePath = path.join(__dirname, '..', 'web', 'index.template.html');
const outputPath = path.join(__dirname, '..', 'web', 'index.html');

const collection = fs.existsSync(collectionPath)
  ? JSON.parse(fs.readFileSync(collectionPath, 'utf8'))
  : [];
const wishlist = fs.existsSync(wishlistPath)
  ? JSON.parse(fs.readFileSync(wishlistPath, 'utf8'))
  : (fs.existsSync(legacyPath) ? JSON.parse(fs.readFileSync(legacyPath, 'utf8')) : []);

const template = fs.readFileSync(templatePath, 'utf8');
const html = template
  .replace('__COLLECTION_DATA__', JSON.stringify(collection))
  .replace('__WISHLIST_DATA__', JSON.stringify(wishlist));

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
