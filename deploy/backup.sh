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

# O banco roda em WAL. Um `cp` cru do .db pode não conter as transações que ainda
# estão no -wal, gerando um backup silenciosamente desatualizado.
# Por isso: força um checkpoint TRUNCATE antes de copiar, o que drena o WAL para
# dentro do .db e deixa o arquivo principal consistente e completo por si só.
# Não há sqlite3 CLI na imagem — usa-se o better-sqlite3 que já está em /app/node_modules.
docker exec "${CONTAINER}" node -e 'const D=require("better-sqlite3");const d=new D("/app/data/skatoday.db");const r=d.pragma("wal_checkpoint(TRUNCATE)");console.log("checkpoint:",JSON.stringify(r));d.close();'

docker exec "${CONTAINER}" sh -c "cp /app/data/skatoday.db /tmp/skatoday-snapshot.db"

# Copia o snapshot pra fora
docker cp "${CONTAINER}:/tmp/skatoday-snapshot.db" "${BACKUP_FILE}"
docker exec "${CONTAINER}" rm -f /tmp/skatoday-snapshot.db

# Comprime
gzip -9 "${BACKUP_FILE}"
echo "backup ok: ${BACKUP_FILE}.gz"

# Retenção: deleta backups com mais de 30 dias
find "${BACKUP_DIR}" -name "skatoday-*.db.gz" -mtime +30 -delete
echo "retenção aplicada (>30d removidos)"
