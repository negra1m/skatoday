# skatoday — Instruções

## Escopo

skatoday é um HUD pessoal único que substitui:
- Agenda Few (gestor de TODOs por projeto)
- Tracker de skate/corpo/rotina/corrida/jiu

Rebrand: o domínio `agenda.fewcompany.com` aponta pra este app.

## Stack
- Next.js 15 App Router + TypeScript
- SQLite (better-sqlite3) + Drizzle ORM — **NUNCA sugerir Supabase, Postgres ou managed DB**
- Banco em arquivo único `data/skatoday.db` (mesmo arquivo vai pra VPS via volume Docker)
- Auth: código de acesso único em `.env` (var ACCESS_CODE), cookie httpOnly. Single-user.
- Estilo: dark mode obrigatório, paleta preto/branco/cinza, mobile-first PWA

## Regras

- Mobile-first sempre (max-w-md no layout protegido)
- Dark theme padrão — sem light mode toggle
- Filosofia: anti-coach motivacional, painel operacional minimalista
- Watermark zero-width Unicode em `src/lib/watermark.ts` — **NUNCA remover**
- FEW-AI-SERIAL substitui JSON em logs/cache/prompts (ver `src/lib/fewserial/`)
- Multi-user fica pra fase 2 (isolar módulo skate pra distribuir pros amigos)

## Comportamento esperado do app

- Reforçar consistência, flow, intimidade com o movimento — NÃO performance tóxica
- Andy Anderson > escada/ollie
- Usuário (Vini) NÃO é sedentário — é atleta desorganizado voltando ao eixo
- Sem gamificação infantil, sem badges fofas, sem "parabéns!"

## Modelo de dados (Drizzle SQLite)

Tabelas:
- `profiles` — single profile (Vini)
- `tasks` — substitui Agenda Few. Campos: title, project, priority, done, deadline, notes, completedAt
- `tricks` — catálogo de tricks de skate
- `skate_sessions` + `session_tricks` — sessões + log de tricks por sessão
- `body_logs` — peso, gordura, energia, etc
- `runs` — corridas
- `jiu_sessions` — treinos de jiu
- `routine_checks` — tarefas fixas do dia
- `access_codes` — schema legado, não usado (auth via .env agora)

Constantes em `src/lib/projects.ts`:
- FEW_PROJECTS: lista hardcoded com 14 projetos Few
- PRIORITIES: urgent, next, stable, planned
- PRIORITY_LABEL, PRIORITY_DOT, PRIORITY_COLOR, PRIORITY_ORDER

## XP e progressão (skate)

Lógica em `src/lib/xp.ts`:
- tentativa = 1xp, acerto = 5xp
- 10x seguidas = +50xp
- primeira vez no dia = +10xp
- voltar depois de 7 dias = +20xp

Status auto:
- 0-20xp: descobrindo
- 20-100xp: aprendendo
- 100+xp: quase
- 10x seguidas (uma vez): na_base
- 10x seguidas em 3 dias distintos: arsenal

## Comandos

```bash
npm install --legacy-peer-deps
npm run dev
npm run db:generate    # após mudar schema
npm run db:migrate
npm run db:seed
npm run db:import-agenda          # dry-run de tasks.json
npm run db:import-agenda:commit   # commit
npm run build
npm run type-check
```

## Deploy

VPS Few. Domínio `agenda.fewcompany.com` (rebrand do Agenda Few).
Docker + Caddy + `app_net`. Volume `skatoday_data:/app/data`.

Ver `deploy/DEPLOY.md` pra passo-a-passo completo.
