# skatoday — Pendências

**Stack:** Next.js 15 + SQLite + Drizzle + Tailwind + PWA
**Domínio:** agenda.fewcompany.com (rebrand do Agenda Few)
**Status:** big bang merge concluído (skate + tarefas + corpo + projetos), pendente deploy

---

## Concluído

- [x] Estrutura inicial Next.js 15 + TypeScript + Tailwind (2026-05-13)
- [x] Schema Drizzle SQLite: 10 tabelas (profiles, tricks, sessões skate, body, runs, jiu, rotina, **tasks**) (2026-05-13)
- [x] Seed inicial: profile Vini + 15 tricks base (2026-05-13)
- [x] Auth por código único via .env (ACCESS_CODE) + cookie httpOnly + middleware (2026-05-13)
- [x] Componentes UI: Button, Card, Input, Label, Select, Textarea, Tabs, Dialog, Checkbox (2026-05-13)
- [x] Componentes HUD: StreakMap, FlowGauge, DailyScore, BottomNav (2026-05-13)
- [x] Componentes tasks: TaskCard, TaskModal, TaskFilters, VoiceCapture (Web Speech API) (2026-05-13)
- [x] Páginas skate: Arsenal, Nova trick, Sessão, Trick detail (2026-05-13)
- [x] Páginas pessoais: Corpo, Corrida, Jiu, Rotina, Eu (hub) (2026-05-13)
- [x] **Páginas merge**: /tarefas (com filtros, busca, voice), /projetos (14 projetos Few) (2026-05-13)
- [x] Dashboard reformado com bloco de tasks urgentes + stats (2026-05-13)
- [x] Lógica XP + dailyScore + streak + computeStats (2026-05-13)
- [x] Server actions tasks: create/update/toggle/delete (2026-05-13)
- [x] PWA manifest + ícones SVG (2026-05-13)
- [x] FEW-AI-SERIAL encoder/decoder + schemas (2026-05-13)
- [x] Watermark zero-width Unicode (2026-05-13)
- [x] Script de migração tasks.json → SQLite com dedup semântica (2026-05-13)
- [x] Dockerfile multi-stage + docker-compose + Caddyfile snippet (2026-05-13)
- [x] deploy/DEPLOY.md passo-a-passo (2026-05-13)
- [x] Build production OK + type-check limpo (2026-05-13)
- [x] Contraste UI ajustado (Select/Input/Textarea bg-secondary) (2026-05-13)

---

## Pendências

### Deploy (próximo passo)
- [ ] Backup tasks.json atual da VPS
- [ ] Baixar tasks.json + rodar `npm run db:import-agenda` local
- [ ] Revisar `data/import/migration-report.json` (suspeitos semânticos)
- [ ] `npm run db:import-agenda:commit` local + smoke test
- [ ] Push repo → clone na VPS → docker compose up -d
- [ ] Atualizar Caddyfile (snippet em `deploy/Caddyfile.snippet`)
- [ ] Smoke test em agenda.fewcompany.com
- [ ] Apagar container `agenda` legado depois de 1-2 dias
- [ ] Cron backup diário do .db

### Fase 2 — Isolar módulo skate pra distribuir
- [ ] Extrair só skate em app separado
- [ ] Auth multi-user (nick + senha) — adiar
- [ ] Compartilhar progresso entre amigos

### Pós-MVP
- [ ] Upload de clips de vídeo por trick
- [ ] "Jones Skate Coach" — IA enchendo o saco quando foge do drop
- [ ] Metas semanais automáticas
- [ ] Notificações push (lembrete de andar)
- [ ] Gráfico de evolução de peso ao longo do tempo
- [ ] Modo offline robusto (IndexedDB cache + service worker)
- [ ] Editar/deletar logs (atualmente só append)
- [ ] Importar dados de balança bioimpedância via CSV
