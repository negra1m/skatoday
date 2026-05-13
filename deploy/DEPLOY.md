# Deploy skatoday → agenda.fewcompany.com

Migração big bang: substitui o app Agenda Few legado pelo skatoday novo.
Sub-domínio mantém: `agenda.fewcompany.com`.

## Pré-requisitos VPS

- Docker + Docker Compose
- Network externa `app_net` já existe
- Caddy rodando como reverse proxy no host

## 1. Backup do estado atual da VPS

```bash
ssh -i "C:/Users/vnsn_/.ssh/few-server_key.pem" fewcompany@agent.fewcompany.com

# Backup do tasks.json
sudo cp /home/fewcompany/apps/few-server/apps/agenda/data/tasks.json \
        /home/fewcompany/backup/tasks_$(date +%Y%m%d_%H%M).json

# Backup do container antigo (caso precise rollback rápido)
docker ps -a | grep agenda
docker commit agenda agenda-legacy-$(date +%Y%m%d)
```

## 2. Migração local (recomendado) ANTES de deploy

Local, testa a migração:

```powershell
cd "C:\Users\vnsn_\Documents\Few\_projetos\8.APP\_Tools\skatoday"

# Baixa o tasks.json da VPS
scp -i "C:/Users/vnsn_/.ssh/few-server_key.pem" `
    fewcompany@agent.fewcompany.com:/home/fewcompany/apps/few-server/apps/agenda/data/tasks.json `
    data/import/tasks.json

# Dry-run (gera relatório, NÃO insere)
npm run db:import-agenda

# Revisa data/import/migration-report.json
# Em especial: semanticSuspects (pares que parecem duplicados)

# Se ok, importa de verdade
npm run db:import-agenda:commit

# Testa local
npm run dev
```

## 3. Deploy do container novo

Na VPS:

```bash
# Clona o repo
cd /home/fewcompany/apps
git clone <url-skatoday> skatoday
cd skatoday

# Cria .env (mesmas vars do .env.local)
# JWT_SECRET = gerar com: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
cat > .env <<EOF
JWT_SECRET=<gerar-um-novo>
PUBLIC_BASE_URL=https://agenda.fewcompany.com
SMTP_HOST=mail.fewcompany.com
SMTP_PORT=587
SMTP_FROM=skatoday@fewcompany.com
EOF

# Build + up
docker compose build
docker compose up -d

# Verifica
docker compose logs -f skatoday
docker ps | grep skatoday
```

## 4. Caddy

Atualiza o Caddyfile do host pra apontar `agenda.fewcompany.com` pro container novo.
Usa o snippet em `deploy/Caddyfile.snippet`.

```bash
sudo nano /etc/caddy/Caddyfile
# substitui o bloco antigo de agenda.fewcompany.com pelo snippet
sudo systemctl reload caddy
```

## 5. Importar tasks.json (caso não migrou local)

Copia tasks.json pra dentro do container e roda o import:

```bash
docker cp /home/fewcompany/backup/tasks_<TIMESTAMP>.json \
          skatoday:/app/data/import/tasks.json

docker compose exec skatoday node_modules/.bin/tsx src/db/migrate-from-agenda.ts
# revisa /app/data/import/migration-report.json
docker compose exec skatoday cat /app/data/import/migration-report.json | less

# se ok:
docker compose exec skatoday node_modules/.bin/tsx src/db/migrate-from-agenda.ts --commit
```

## 6. Smoke test

```
https://agenda.fewcompany.com
→ tela /entrar
→ login com username/senha (criar admin antes: npm run user:create)
→ dashboard com tasks urgentes
→ /tarefas mostra tudo migrado
→ /projetos lista 14 projetos
→ /skate (vazio mas funciona)
```

## 7. Apaga o legado

Depois de validar 1-2 dias:

```bash
docker stop agenda && docker rm agenda
docker volume ls | grep agenda
# remove volume antigo se quiser:
# docker volume rm agenda_data
```

## Backup automático do .db

Script: `deploy/backup.sh` — faz snapshot do banco dentro do container, copia comprimido pra `/home/fewcompany/backup/skatoday/`, e remove backups com mais de 30 dias.

Instalação:

```bash
# 1. Tornar executável
chmod +x /home/fewcompany/apps/skatoday/deploy/backup.sh

# 2. Criar pasta de backups
mkdir -p /home/fewcompany/backup/skatoday

# 3. Testar manualmente
/home/fewcompany/apps/skatoday/deploy/backup.sh

# 4. Adicionar ao crontab (ver deploy/crontab.txt)
crontab -e
# Cola a linha do crontab.txt
```

Restaurar de um backup:

```bash
# Para o container
docker compose -f /home/fewcompany/apps/skatoday/docker-compose.yml down

# Descomprime backup pro lugar
gunzip -c /home/fewcompany/backup/skatoday/skatoday-20260520_033000.db.gz > \
          /var/lib/docker/volumes/skatoday_skatoday_data/_data/skatoday.db

# Sobe de novo
docker compose -f /home/fewcompany/apps/skatoday/docker-compose.yml up -d
```

## Rollback rápido (caso deploy quebre)

```bash
docker compose down
docker run -d --name agenda-legacy <imagem-snapshot>
# update Caddyfile temporariamente apontando pro container antigo
```
