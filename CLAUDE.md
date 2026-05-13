# skatoday — Project notes for Claude

Personal dashboard combining task management, skate tracking, body/habits logging, hydration with push notifications, and an admin-only CRM with encrypted password vault.

## Stack

- Next.js 15 (App Router) + TypeScript
- SQLite (better-sqlite3) + Drizzle ORM — single-file DB at `data/skatoday.db`
- Tailwind + custom UI components (no shadcn/ui dependency)
- bcryptjs + jose (JWT) for auth
- web-push (VAPID) for real notifications (works with PWA closed on Chrome/Android, requires SMTP cron for iOS)
- nodemailer for password reset emails

## Conventions

- **Mobile-first**: `max-w-md` containers, safe-area-aware (env(safe-area-inset-top))
- **Dark only**: no light mode toggle
- **Neon accent**: purple/blue/pink gradient as top bar + active state highlights
- **Multi-user**: every domain table joins by `user_id` or `profile_id`
- **Admin-only features**: `if (user.role !== "admin") notFound()` — never expose admin nav items to non-admin
- **Server Actions everywhere**: prefer `"use server"` form actions over `/api/*` for mutations
- **Swipe-to-action**: lists with edit/delete use `SwipeCard` / `LogSwipeRow` (iOS-style swipe left)

## Domain entities

Per user:
- `users`, `profiles` (1:1)
- `projects` — user-defined, N:N with clients via `client_projects`
- `routine_items` — user-defined daily checklist labels

Per profile:
- `tasks` — title, project (string FK by name), priority, deadline, notes
- `tricks`, `skate_sessions`, `session_tricks` — skate domain with XP system
- `body_logs`, `runs`, `jiu_sessions`, `routine_checks` — daily logs
- `water_configs`, `water_logs` — hydration tracking

Admin-only:
- `clients`, `client_secrets` (AES-256-GCM), `client_links`, `client_images`

Push:
- `push_subscriptions` — Web Push endpoints per user

## XP / Skate progression

Lives in `src/lib/xp.ts`:
- attempt = 1xp, land = 5xp
- 10x streak in a session = +50xp
- first time today = +10xp
- back after 7+ days = +20xp

Status auto-promoted:
- 0-20xp: descobrindo
- 20-100xp: aprendendo
- 100+xp: quase
- 10x streak once: na_base
- 10x streak in 3 different days: arsenal

## Water (hydration)

- Goal auto-calculated as `35ml × weight` (clamped 1500-5000ml), or manual override
- Schedule built from `wake_start` → `wake_end` distributed evenly across glasses needed
- Web Push real via VAPID — server cron triggers `scripts/push-water.mjs` every minute, dispatching only at scheduled times
- Falls back to in-app polling only when TimestampTrigger isn't supported

## i18n

- pt-BR (default), en, zh-CN
- Server-side via `getLocale()` cookie + `getT()` helper
- Flat dict in `src/lib/i18n/dict.ts`

## Auth

- Username + password (bcrypt, cost 12) + JWT cookie (jose, 30d)
- First signup becomes admin
- Reset password via email with one-time token (sha256 of token stored; original sent in URL)
- Admin never sees passwords — CLI `user:reset` triggers email flow

## Deploy

- Docker multi-stage (deps → builder → standalone runner)
- Volume `/app/data` (sqlite + uploads)
- Caddy reverse proxy
- Backup cron daily, push cron every minute

## Project structure

```
src/
  app/
    (auth)/...          public routes (signup, login, reset)
    (app)/...           authenticated routes (middleware guards)
    api/...             Next route handlers (push, locale)
    uploads/[file]/     authenticated image serving
  components/
    ui/                 primitives (Button, Card, Input, SwipeCard, ...)
    hud/                HUD-specific (StreakMap, FlowGauge, DailyScore, BottomNav)
    tasks/, water/, crm/  feature-specific
  db/
    schema.ts           Drizzle schema
    client.ts           connection
    queries.ts, mutations.ts, crm.ts, projects.ts, routine.ts, push.ts, water.ts
    migrations/         generated SQL
  lib/
    auth.ts, crypto.ts, push.ts, mail.ts
    water.ts, water-notifications.ts, sounds.ts
    i18n/
    uploads.ts
```

## Scripts

```bash
npm run dev
npm run build
npm run type-check
npm run db:generate    # after schema changes
npm run db:migrate
npm run db:studio

# user management (admin)
npm run user:create <username> <email> <password>
npm run user:list
npm run user:reset <username>    # sends email
npm run user:promote <username>
```
