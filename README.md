# skatoday

HUD pessoal Few Company. Substitui Agenda Few + serve de tracker de skate, corpo e rotina.

## Stack

- Next.js 15 (App Router) + TypeScript
- SQLite (better-sqlite3) + Drizzle ORM — banco local em `data/skatoday.db`
- Tailwind + componentes UI custom
- PWA via manifest.json
- Auth: código de acesso único via `.env` (cookie httpOnly)

## Setup local

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
# edita .env.local: define ACCESS_CODE e ACCESS_HINT
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Acessa em http://localhost:3000 — entra com o código do `.env`.

## Scripts

- `npm run dev` — Next dev
- `npm run build` — build de produção
- `npm run start` — start de produção
- `npm run type-check` — checagem TS
- `npm run db:generate` — gera SQL de migration
- `npm run db:migrate` — aplica migrations
- `npm run db:seed` — popula profile + tricks base
- `npm run db:studio` — Drizzle Studio
- `npm run db:import-agenda` — dry-run da migração tasks.json (Agenda Few)
- `npm run db:import-agenda:commit` — importa tasks.json no banco

## Páginas

- `/` — Dashboard (HUD): score do dia, streak skate, tasks urgentes, mapa do mês
- `/tarefas` — Lista de tasks com filtros, busca, voice, modal (compat Agenda Few)
- `/projetos` — Visão por projeto Few (14 projetos)
- `/skate` — Arsenal de tricks por status
- `/skate/sessao` — Registrar sessão do dia
- `/skate/trick/[id]` — Detalhe + histórico
- `/eu` — Hub pessoal: corpo, corrida, jiu, rotina
- `/corpo`, `/corrida`, `/jiu`, `/rotina` — Logs individuais

## Deploy → agenda.fewcompany.com

Ver `deploy/DEPLOY.md` pra passo-a-passo completo.

Resumo do cutover:
1. Local: testa migração de `tasks.json` (dry-run → review → commit)
2. VPS: backup `tasks.json` atual, `docker compose up -d skatoday`
3. Caddy: atualiza bloco `agenda.fewcompany.com` pro container `skatoday`
4. Smoke test → apaga container `agenda` legado

## Princípios

- Anti-coach motivacional. Painel operacional, não rede social fitness.
- Foco em flow, consistência, intimidade com o movimento.
- Andy Anderson > escada/ollie.
- Usuário NÃO é sedentário — é atleta desorganizado voltando ao eixo.
- Tarefas substituem Agenda Few. 14 projetos Few suportados.
