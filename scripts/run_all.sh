#!/bin/zsh
set -euo pipefail

REMOTE_PORT="${CHROME_REMOTE_DEBUG_PORT:-9222}"
REMOTE_DIR="${CHROME_REMOTE_DIR:-$HOME/Library/Application Support/Google/Chrome-Remote}"
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome introuvable: $CHROME_BIN"
  exit 1
fi

echo "→ Lancement de Chrome en mode remote debugging..."
"$CHROME_BIN" \
  --remote-debugging-port="$REMOTE_PORT" \
  --user-data-dir="$REMOTE_DIR" >/dev/null 2>&1 &

CHROME_PID=$!
sleep 1

echo ""
echo "Connecte-toi à GG.deals dans la fenêtre Chrome-Remote."
echo "Quand c'est bon, appuie sur Entrée pour continuer."
read -r

echo ""
echo "→ Scraping collection..."
CHROME_REMOTE_DEBUG_PORT="$REMOTE_PORT" node scripts/scrape_collection.js

echo ""
echo "→ Scraping wishlist..."
if [[ -z "${WISHLIST_URL:-}" ]]; then
  echo "WISHLIST_URL manquant."
  echo "Colle ton URL publique GG.deals (ou laisse vide pour skip) :"
  read -r WISHLIST_URL
fi
if [[ -n "${WISHLIST_URL:-}" ]]; then
  WISHLIST_URL="$WISHLIST_URL" node scripts/scrape_wishlist.js
else
  echo "↪️  Wishlist ignorée (pas d'URL)."
fi

echo ""
echo "→ Génération du site..."
node scripts/generate.js

echo ""
echo "Terminé."
echo "Tu peux fermer Chrome-Remote manuellement."
echo "Si tu veux que je le ferme automatiquement, dis-le moi."
