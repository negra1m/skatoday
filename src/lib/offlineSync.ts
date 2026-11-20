/**
 * offlineSync.ts
 *
 * Utilitário de fila offline para o skatoday.
 * Quando o usuário faz create/toggle/delete sem rede:
 *  1. A operação é gravada no IndexedDB
 *  2. O SW recebe um Background Sync tag para tentar replay quando a rede voltar
 *
 * O service worker em /public/sw.js lê esse mesmo IDB e faz o replay.
 */

const IDB_DB    = "skatoday-sync";
const IDB_STORE = "pending-ops";
const SYNC_TAG  = "skatoday-tasks-sync";

export interface PendingOp {
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Timestamp ISO para diagnóstico */
  queuedAt: string;
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOp(op: Omit<PendingOp, "queuedAt">): Promise<void> {
  if (typeof indexedDB === "undefined") return; // SSR guard

  const record: PendingOp = { ...op, queuedAt: new Date().toISOString() };
  const db = await openIdb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = store.add(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Registra background sync no SW (se disponível)
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // @ts-expect-error — SyncManager não tem tipos completos no lib DOM ainda
      await reg.sync.register(SYNC_TAG);
    } catch {
      // SyncManager indisponível (iOS Safari) — o SW vai tentar na próxima fetch
    }
  }
}

/** Retorna true se o SW existe e há ops pendentes na fila */
export async function hasPendingOps(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    const db = await openIdb();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.count();
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}
