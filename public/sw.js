// Service Worker do skatoday
// Estratégias: cache-first estáticos, network-first /api/tasks, offline fallback /tarefas
// Background sync: fila IndexedDB para operações offline (create/toggle/delete)

const CACHE_STATIC = "skatoday-static-v1";
const CACHE_API    = "skatoday-api-v1";
const SYNC_TAG     = "skatoday-tasks-sync";
const IDB_DB       = "skatoday-sync";
const IDB_STORE    = "pending-ops";

// Assets estáticos a pré-cachear no install
const PRECACHE_URLS = [
  "/",
  "/tarefas",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ─── Install: pré-cache de shell ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})),
  );
});

// ─── Activate: limpa caches antigos ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_STATIC && k !== CACHE_API).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests não-GET (mutações vão para background sync)
  if (request.method !== "GET") return;

  // Ignora cross-origin
  if (url.origin !== self.location.origin) return;

  // Network-first: /api/tasks — sempre tenta rede, cacheia resposta bem-sucedida
  if (url.pathname.startsWith("/api/tasks")) {
    event.respondWith(networkFirstApiTasks(request));
    return;
  }

  // Cache-first: assets estáticos (_next/static, icons, manifest)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Offline fallback: /tarefas → serve do cache ou página offline simples
  if (url.pathname === "/tarefas" || url.pathname.startsWith("/tarefas")) {
    event.respondWith(networkWithOfflineFallback(request));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstApiTasks(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_API);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline", tasks: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function networkWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback mínimo mostrando tasks em cache
    const apiCache = await caches.match("/api/tasks");
    const tasksJson = apiCache ? await apiCache.text() : "[]";
    return new Response(offlineFallbackHtml(tasksJson), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

function offlineFallbackHtml(tasksJson) {
  let tasks = [];
  try { tasks = JSON.parse(tasksJson); } catch { /* noop */ }
  const items = Array.isArray(tasks)
    ? tasks.slice(0, 20).map((t) => `<li>${t.title ?? t.text ?? JSON.stringify(t)}</li>`).join("")
    : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>skatoday — offline</title>
  <style>
    body{background:#0a0a0b;color:#fafafa;font-family:ui-monospace,monospace;padding:1.5rem;max-width:28rem;margin:auto}
    h1{font-size:1rem;text-transform:uppercase;letter-spacing:.15em;color:#888;margin-bottom:1rem}
    ul{list-style:none;padding:0;margin:0}
    li{padding:.5rem 0;border-bottom:1px solid #1f1f20;font-size:.875rem}
    .badge{display:inline-block;background:#1f1f20;border-radius:.25rem;padding:.1rem .4rem;font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;margin-right:.5rem;color:#888}
  </style>
</head>
<body>
  <h1>skatoday · offline</h1>
  ${items ? `<ul>${items}</ul>` : "<p style='color:#888;font-size:.875rem'>Nenhuma tarefa em cache.</p>"}
  <p style='margin-top:1.5rem;font-size:.75rem;color:#555'>Reconectando quando houver rede…</p>
</body>
</html>`;
}

// ─── Background Sync ──────────────────────────────────────────────────────────

// Abre (ou reabre) o IDB
function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAllKeys(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayPendingOps());
  }
});

async function replayPendingOps() {
  let db;
  try { db = await openIdb(); } catch { return; }
  const ops = await idbGetAll(db);
  const keys = await idbGetAllKeys(db);
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    try {
      const response = await fetch(op.url, {
        method: op.method,
        headers: { "Content-Type": "application/json", ...op.headers },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
      if (response.ok) {
        await idbDelete(db, keys[i]);
      }
      // se 4xx, descarta: dado inválido não vai melhorar
      if (response.status >= 400 && response.status < 500) {
        await idbDelete(db, keys[i]);
      }
    } catch {
      // rede ainda indisponível — mantém na fila, próximo sync
    }
  }
}

// ─── Push (mantido do original) ───────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "skatoday", body: "Nova notificação", url: "/", tag: undefined };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url ?? "/" },
      vibrate: [120, 60, 120],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/agua";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        for (const w of wins) {
          if ("focus" in w && w.url.endsWith(url)) return w.focus();
        }
        for (const w of wins) {
          if ("focus" in w) {
            w.navigate?.(url);
            return w.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
