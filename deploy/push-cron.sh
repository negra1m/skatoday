#!/bin/sh
# Cron: dispara push de hidratação e do circuito diário a cada minuto.
# Roda dentro do container skatoday via docker exec.
# Crontab: * * * * * /home/fewcompany/apps/few-server/apps/skatoday/deploy/push-cron.sh

docker exec skatoday node /app/scripts/push-water.mjs 2>&1 | grep -v '^$' || true
docker exec skatoday node /app/scripts/push-circuit.mjs 2>&1 | grep -v '^$' || true
