# Roadmap

## Done

- Auth multi-user (bcrypt + JWT)
- Password reset via email (one-time token)
- i18n (pt-BR, en, zh-CN)
- Tasks with priority, deadline, filters, search, voice input
- User-defined projects (N:N with clients)
- Skate tracking (tricks, sessions, XP, status auto)
- Body / runs / jiu / routine logging with edit + delete
- Water tracking with real Web Push (VAPID)
- Client CRM with encrypted vault (AES-256-GCM), links, images
- Swipe-to-action on list cards
- PWA installable
- Docker deploy + daily backup cron + push cron

## Next

- [ ] Editable trick sessions (currently append-only on the session itself)
- [ ] Video clips per trick (upload + playback)
- [ ] Weekly goals with progress
- [ ] CSV import for bioimpedance scales (body composition)
- [ ] Offline support beyond service worker (IndexedDB cache for reads)
- [ ] Export user data (JSON dump)
- [ ] Account deletion (GDPR / self-service)
- [ ] Web Push for tasks (deadline alerts)
