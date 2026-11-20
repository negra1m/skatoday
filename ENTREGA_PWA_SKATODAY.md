# ENTREGA_PWA_SKATODAY — Checklist de Aceitação

**Branch:** `feat/pwa-instalavel`
**Data:** 2026-11-20
**Critério de pronto:** todos os 10 itens marcados ✅ + Lighthouse PWA ≥ 90 no headless

---

## Checklist de Aceitação

| # | Item | Como testar | Status |
|---|------|-------------|--------|
| 1 | **Instala no Android Chrome** | Abrir `skatoday.fewcompany.com` no Android Chrome → banner "Adicionar à tela inicial" aparece | ⬜ |
| 2 | **Ícone na home screen** | Após instalar: ícone 192×192 PNG aparece na home sem fundo branco indesejado | ⬜ |
| 3 | **Abre em modo standalone** | Tocar no ícone instalado → app abre sem barra de URL do navegador (fullscreen standalone) | ⬜ |
| 4 | **Carrega offline após 1ª visita** | Visitar `/tarefas`, desligar Wi-Fi, recarregar → página carrega com tasks em cache | ⬜ |
| 5 | **API /api/tasks funciona offline** | Offline → navegar para `/tarefas` → tasks do último fetch online aparecem | ⬜ |
| 6 | **Fallback offline visual** | Offline sem cache (1ª visita) → página offline mínima exibe "skatoday · offline" sem erro branco | ⬜ |
| 7 | **Background sync — create** | Offline → criar tarefa → reconectar → tarefa aparece no servidor (verificar em `/api/tasks`) | ⬜ |
| 8 | **Background sync — toggle** | Offline → marcar tarefa como concluída → reconectar → estado persiste no servidor | ⬜ |
| 9 | **Background sync — delete** | Offline → deletar tarefa → reconectar → tarefa removida no servidor | ⬜ |
| 10 | **Banner de instalação com dismiss persistente** | Dispensar banner → recarregar → banner não aparece mais (localStorage `pwa-install-dismissed=1`) | ⬜ |

---

## Lighthouse PWA (headless)

Rodar antes de declarar pronto:

```bash
# Em ambiente local com build de produção rodando em localhost:3000
npx lighthouse http://localhost:3000 \
  --only-categories=pwa \
  --chrome-flags="--headless --no-sandbox" \
  --output=json | jq '.categories.pwa.score * 100'
```

**Meta:** score ≥ 90

---

## Pontos de Atenção

- **Background sync item 7-9** requer que a UI chame `enqueueOp()` de `@/lib/offlineSync.ts` antes de fazer o fetch. As Server Actions atuais do skatoday (`src/app/(app)/tarefas/actions.ts`) rodam no servidor — o background sync é para chamadas `/api/tasks` via fetch no cliente. Se as mutations forem exclusivamente Server Actions (sem endpoint REST), o background sync do SW não intercepta. **Decisão pendente do Vini:** manter só Server Actions ou expor endpoints REST para offline mutations? O hook `offlineSync.ts` está pronto, aguarda integração.
- **iOS Safari** não suporta `BackgroundSyncManager` (`SyncManager`). O fallback é o replay automático ao próximo fetch (sw.js faz replay em activate). Push notifications e install prompt no iOS requerem Safari 16.4+ (iOS 16.4+).
- **Icons PNG maskable:** os ícones gerados têm safe zone de ~83% — adequado para maskable sem corte em launchers com formas dinâmicas.

---

## Arquivos Entregues

| Arquivo | Descrição |
|---------|-----------|
| `public/manifest.json` | PNG 192/512 adicionados, `scope: "/"` incluído |
| `public/icons/icon-192.png` | PNG gerado via System.Drawing |
| `public/icons/icon-512.png` | PNG gerado via System.Drawing |
| `public/sw.js` | Reescrito: cache-first estáticos, network-first `/api/tasks`, offline fallback, background sync |
| `src/components/pwa/InstallBanner.tsx` | Banner `beforeinstallprompt` com dismiss no localStorage |
| `src/components/pwa/SwRegistration.tsx` | Registra SW em `useEffect`, chama `update()` |
| `src/lib/offlineSync.ts` | Utilitário: `enqueueOp()` + `hasPendingOps()` para background sync |
| `src/app/layout.tsx` | Adiciona `<SwRegistration />` e `<InstallBanner />` |
