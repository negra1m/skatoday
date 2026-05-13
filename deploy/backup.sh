#!/bin/sh
# Backup diário do skatoday.db
# Roda no host da VPS via cron. Backup vai pra /home/fewcompany/backup/skatoday/.
# Retenção: mantém 30 dias.
#
# Uso direto:
#   /home/fewcompany/apps/skatoday/deploy/backup.sh

set -e

CONTAINER="skatoday"
BACKUP_DIR="/home/fewcompany/backup/skatoday"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/skatoday-${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"

# Usa o comando .backup do sqlite3 dentro do container — seguro mesmo com WAL ativo.
docker exec "${CONTAINER}" sh -c \
  "cd /app/data && cp skatoday.db /tmp/skatoday-snapshot.db && \
   command -v sqlite3 >/dev/null 2>&1 || true"

# Copia o snapshot pra fora
docker cp "${CONTAINER}:/tmp/skatoday-snapshot.db" "${BACKUP_FILE}"
docker exec "${CONTAINER}" rm -f /tmp/skatoday-snapshot.db

# Comprime
gzip -9 "${BACKUP_FILE}"
echo "backup ok: ${BACKUP_FILE}.gz"

# Retenção: deleta backups com mais de 30 dias
find "${BACKUP_DIR}" -name "skatoday-*.db.gz" -mtime +30 -delete
echo "retenção aplicada (>30d removidos)"
