# skatoday

Personal dashboard for skate, tasks, habits and clients. Self-hosted, single user per instance, multi-user supported.

> Painel pessoal de skate, tarefas, hábitos e clientes. Self-hosted, single user por instância, suporte multi-user.

## Features

- **Tasks** — Project-grouped task list with priority, deadline, filters, search and voice capture.
- **Projects (N:N)** — Users define their own projects. Clients can be linked to projects.
- **Skate tracking** — Trick arsenal with XP, sessions, flow gauge, daily score, GitHub-style streak map.
- **Body / Runs / Jiu / Routine** — Logs with edit, delete and history.
- **Water (hydration)** — Daily goal (auto from weight or manual), scheduled reminders, real Web Push notifications.
- **Clients (CRM, admin only)** — Contacts, encrypted password vault (AES-256-GCM), links, images.
- **Auth** — Username + password (bcrypt) with JWT session cookie. Self-service signup, password reset via email.
- **i18n** — pt-BR, en, zh-CN.
- **PWA** — Installable on mobile, dark theme, neon accent.

## Stack

- Next.js 15 (App Router) + TypeScript
- SQLite (better-sqlite3) + Drizzle ORM
- Tailwind CSS + custom UI primitives
- bcryptjs + jose (JWT)
- web-push (VAPID) + Service Worker
- nodemailer (SMTP for password resets)
- Docker + Caddy for deploy

## Setup

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
# Generate secrets:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# Fill JWT_SECRET and SECRETS_KEY in .env.local

npm run db:generate
npm run db:migrate
npm run dev
```

First user that signs up at `/cadastrar` becomes admin automatically.

## Environment

```
DATABASE_URL=file:./data/skatoday.db
JWT_SECRET=<48-byte random base64url>
SECRETS_KEY=<48-byte random base64url>  # used by client vault
PUBLIC_BASE_URL=http://localhost:3000
UPLOADS_DIR=./data/uploads

# SMTP (optional in dev — logs to stdout when not set)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Web Push (VAPID). Generate keys with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

## Scripts

```
npm run dev               # Next.js dev server
npm run build             # production build
npm run start             # production server
npm run type-check        # tsc --noEmit

npm run db:generate       # generate SQL migration from schema
npm run db:migrate        # apply migrations
npm run db:studio         # Drizzle Studio

npm run user:create       # <username> <email> <password>
npm run user:list
npm run user:reset        # <username> — sends reset email
npm run user:delete       # <username>
npm run user:promote      # <username> — make admin
```

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard with score, streak, urgent tasks |
| `/tarefas` | Tasks with filters, search, voice input |
| `/projetos` | Projects (user-managed) |
| `/projetos/[id]` | Project detail: linked clients + open tasks |
| `/skate` | Trick arsenal grouped by status |
| `/skate/sessao` | Log today's skate session |
| `/skate/trick/[id]` | Trick detail with history |
| `/agua` | Hydration tracker with push notifications |
| `/corpo` | Body log with weight evolution chart |
| `/corrida` | Running log |
| `/jiu` | Jiu-jitsu log (admin only) |
| `/rotina` | Daily routine checklist |
| `/eu` | Personal hub (body/runs/water/routine) |
| `/clientes` | CRM (admin only) |
| `/clientes/[id]` | Client detail: vault, links, images, linked projects |
| `/entrar` `/cadastrar` `/esqueci-senha` `/redefinir` | Auth pages |

## Deploy

See `deploy/DEPLOY.md` for full guide including Caddy reverse proxy, backups, and Web Push cron setup.

Quick steps:

```bash
# On VPS
git clone <this-repo> /home/<user>/apps/skatoday
cd /home/<user>/apps/skatoday
# Create .env with secrets
docker compose build
docker compose up -d

# Web Push cron (runs every minute)
crontab -e
# Add: * * * * * /path/to/skatoday/deploy/push-cron.sh
```

## License

AGPL-3.0
