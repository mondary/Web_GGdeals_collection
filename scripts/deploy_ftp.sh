#!/bin/bash
set -euo pipefail

# Usage:
#   ./scripts/deploy_ftp.sh                    # dry-run (preview)
#   ./scripts/deploy_ftp.sh --apply            # real upload
#   ./scripts/deploy_ftp.sh --verbose          # show lftp raw output
#   ./scripts/deploy_ftp.sh --apply --verbose  # upload + raw output
#
# Requires env vars:
#   OVH_FTP_HOST, OVH_FTP_USER, OVH_FTP_PASS

: "${OVH_FTP_HOST:?Missing OVH_FTP_HOST}"
: "${OVH_FTP_USER:?Missing OVH_FTP_USER}"
: "${OVH_FTP_PASS:?Missing OVH_FTP_PASS}"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

read -r -p "📁 Local source dir (default: repo root): " LOCAL_INPUT
if [[ -z "$LOCAL_INPUT" ]]; then
  LOCAL_DIR="$REPO_DIR"
elif [[ "$LOCAL_INPUT" = /* ]]; then
  LOCAL_DIR="$LOCAL_INPUT"
else
  LOCAL_DIR="$REPO_DIR/$LOCAL_INPUT"
fi

if [[ ! -d "$LOCAL_DIR" ]]; then
  echo "Local dir invalide: $LOCAL_DIR"
  exit 1
fi


EXTRA_FILES=()
if [[ "$LOCAL_DIR" == "$REPO_DIR/web" && -f "$REPO_DIR/icon.png" ]]; then
  EXTRA_FILES+=("$REPO_DIR/icon.png")
fi

read -r -p "📡 Remote project dir (under /www/pk/, ex: steamLibrary): " REMOTE_DIR
if [[ -z "$REMOTE_DIR" ]]; then
  echo "Remote dir manquant. Annule."
  exit 1
fi
if [[ "$REMOTE_DIR" != /* ]]; then
  REMOTE_DIR="/www/pk/${REMOTE_DIR}"
fi
if [[ "$REMOTE_DIR" != /www/pk/* ]]; then
  REMOTE_DIR="/www/pk${REMOTE_DIR}"
fi
if [[ "$REMOTE_DIR" != */ ]]; then
  REMOTE_DIR="${REMOTE_DIR}/"
fi

MODE="--dry-run"
if [[ "${1:-}" == "--apply" ]]; then
  MODE=""
fi
VERBOSE=0
if [[ "${1:-}" == "--verbose" || "${2:-}" == "--verbose" ]]; then
  VERBOSE=1
fi

cat <<EOF

📡 Destination distante :
  ${OVH_FTP_HOST}:${REMOTE_DIR}

📁 Source locale :
  ${LOCAL_DIR}
EOF

if [[ -n "$MODE" ]]; then
  echo ""
  echo "----------------------------------------"
  echo "🧪 Mode: DRY RUN (preview) -> use --apply to push"
  echo "----------------------------------------"
  echo ""
else
  echo ""
  echo "🚀 Mode: APPLY (upload)"
fi

if [[ -z "$MODE" ]]; then
  read -r -p "Confirmer le dossier de destination ? (y/N) " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Annule."
    exit 1
  fi
fi

PASS_RE=$(printf '%s' "$OVH_FTP_PASS" | sed -e 's/[.[\\*^$(){}+?|]/\\&/g' -e 's/[\\/&]/\\&/g')

upload_extra() {
  local mode="$1"
  if [[ "$mode" != "" ]]; then
    return
  fi
  if [[ ${#EXTRA_FILES[@]} -eq 0 ]]; then
    return
  fi

  for f in "${EXTRA_FILES[@]}"; do
    lftp -e "set ssl:verify-certificate no; set ftp:passive-mode on; open \"${OVH_FTP_HOST}\"; user \"${OVH_FTP_USER}\" \"${OVH_FTP_PASS}\"; cd \"${REMOTE_DIR}\"; put -O \"${REMOTE_DIR}\" \"${f}\"; bye" >/dev/null 2>&1
  done
}

run_mirror() {
  local mode="$1"
  LFTP_RAW=$(lftp <<EOF 2>&1
set ssl:verify-certificate no
set ftp:passive-mode on

open "${OVH_FTP_HOST}"
user "${OVH_FTP_USER}" "${OVH_FTP_PASS}"

lcd "$LOCAL_DIR"
cd "$REMOTE_DIR"

mirror -R . . ${mode} \
  --only-newer \
  --verbose \
  --exclude '.DS_Store' \
  --exclude-glob '.*'

bye
EOF
)
  LFTP_OUT=$(printf '%s' "$LFTP_RAW" | sed -E "s/${PASS_RE}/****/g")
  if [[ "$VERBOSE" -eq 1 ]]; then
    printf '%s\n' "$LFTP_OUT"
  fi
}

run_mirror "$MODE"

if [[ -z "$MODE" ]]; then
  upload_extra ""
fi

if [[ -n "$MODE" ]]; then
  echo ""

  printf '%s\n' "$LFTP_OUT" | \
    sed -n 's/.*file:\(.*\)$/\1/p' | \
    sed "s#^${LOCAL_DIR}/##" | \
    sort -u > /tmp/ftp_changed.list

  find "$LOCAL_DIR" -type f \
    ! -name '.DS_Store' \
    ! -path '*/.*' | sed "s#^${LOCAL_DIR}/##" | sort > /tmp/ftp_local.list

  comm -23 /tmp/ftp_local.list /tmp/ftp_changed.list > /tmp/ftp_unchanged.list

  if [[ -s /tmp/ftp_changed.list ]]; then
    echo "🟡 A modifier / envoyer :"
    cat /tmp/ftp_changed.list
  else
    echo "🟡 A modifier / envoyer : (aucun)"
  fi

  if [[ ${#EXTRA_FILES[@]} -gt 0 ]]; then
    echo "🟣 Extra root file :"
    for f in "${EXTRA_FILES[@]}"; do
      echo "$(basename "$f")"
    done
    echo ""
  fi
  echo ""

  if [[ -s /tmp/ftp_unchanged.list ]]; then
    echo "⚪ Inchangés :"
    cat /tmp/ftp_unchanged.list
  else
    echo "⚪ Inchangés : (aucun)"
  fi

  echo ""
  echo "1) Annuler"
  echo "2) Appliquer le déploiement"
  read -r -p "Choix (1/2) : " APPLY_CONFIRM
  if [[ "$APPLY_CONFIRM" == "2" ]]; then
    echo ""
    echo "🚀 Mode: APPLY (upload)"
    run_mirror ""
    upload_extra ""
  else
    echo "Annule."
  fi
fi

echo ""
echo "✅ Terminé."
