#!/bin/sh
# Cron: dispara push de hidratação a cada minuto.
# Roda dentro do container skatoday via docker exec.
# Crontab: * * * * * /home/fewcompany/apps/few-server/apps/skatoday/deploy/push-cron.sh

docker exec skatoday node /app/scripts/push-water.mjs 2>&1 | grep -v '^$' || true
