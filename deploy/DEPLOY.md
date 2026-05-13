# Deploy guide

## Prerequisites

- Docker + Docker Compose on the VPS
- A reverse proxy (Caddy, Nginx, Traefik) — examples below use Caddy
- An external Docker network: `docker network create app_net`
- A domain pointing to your VPS

## 1. Generate secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# Run twice — one for JWT_SECRET, one for SECRETS_KEY
```

Generate VAPID keys for Web Push:

```bash
npx web-push generate-vapid-keys
```

## 2. Server setup

```bash
git clone <this-repo> /opt/skatoday
cd /opt/skatoday

cat > .env <<EOF
JWT_SECRET=<48-byte-random>
SECRETS_KEY=<48-byte-random>
PUBLIC_BASE_URL=https://your-domain.com

SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_FROM=skatoday@example.com

VAPID_PUBLIC_KEY=<from generate-vapid-keys>
VAPID_PRIVATE_KEY=<from generate-vapid-keys>
VAPID_SUBJECT=mailto:you@example.com
EOF

docker compose build
docker compose up -d
docker compose logs -f skatoday
```

## 3. Reverse proxy

See `deploy/Caddyfile.snippet` for a Caddy example. For Nginx/Traefik:

- Proxy to `skatoday:3000` on the `app_net` network
- TLS termination handled by your proxy

## 4. Web Push cron

Real notifications (Chrome/Android + iOS PWA) require a cron that runs every minute on the host:

```bash
crontab -e
```

Add:

```cron
* * * * * /opt/skatoday/deploy/push-cron.sh >> /var/log/skatoday-push.log 2>&1
```

The script invokes `docker exec skatoday node /app/scripts/push-water.mjs` which checks every user's hydration schedule and sends Web Push only at the exact minute.

## 5. First user

The first signup at `/cadastrar` becomes admin automatically. Or create from the host:

```bash
docker exec -it skatoday node scripts/user.mjs create <username> <email> <password>
```

## 6. Backups

Daily SQLite backup script: `deploy/backup.sh` (snapshots to `/var/backups/skatoday/`, gzip, 30-day retention).

```bash
chmod +x /opt/skatoday/deploy/backup.sh
crontab -e
```

```cron
30 3 * * * /opt/skatoday/deploy/backup.sh >> /var/log/skatoday-backup.log 2>&1
```

To restore:

```bash
docker compose down
gunzip -c /var/backups/skatoday/skatoday-<timestamp>.db.gz > \
  /var/lib/docker/volumes/skatoday_skatoday_data/_data/skatoday.db
docker compose up -d
```

## 7. Updates

```bash
cd /opt/skatoday
git pull
docker compose build
docker compose up -d
```

Migrations apply automatically on container start (see `scripts/entrypoint.sh`).
