import { and, asc, desc, eq, like, or, ne, isNotNull } from "drizzle-orm";
import { db, schema } from "./client";

type PublicUser = {
  id: string;
  username: string;
  profileName: string | null;
};

// Lista bros aceitos (requesterId ou addresseeId = userId, status accepted).
export function listFriends(userId: string): PublicUser[] {
  // Vamos pegar as 2 direções
  const out = db
    .select({
      friendshipId: schema.friendships.id,
      requesterId: schema.friendships.requesterId,
      addresseeId: schema.friendships.addresseeId,
      // join nos users via aliases — em SQLite simples vamos puxar todos
    })
    .from(schema.friendships)
    .where(
      and(
        eq(schema.friendships.status, "accepted"),
        or(
          eq(schema.friendships.requesterId, userId),
          eq(schema.friendships.addresseeId, userId),
        ),
      ),
    )
    .all();

  const friends: PublicUser[] = [];
  for (const f of out) {
    const otherId = f.requesterId === userId ? f.addresseeId : f.requesterId;
    const u = db.select().from(schema.users).where(eq(schema.users.id, otherId)).get();
    if (!u) continue;
    const p = db.select().from(schema.profiles).where(eq(schema.profiles.userId, otherId)).get();
    friends.push({ id: u.id, username: u.username, profileName: p?.name ?? null });
  }
  return friends.sort((a, b) => a.username.localeCompare(b.username));
}

export function listPendingIncoming(userId: string) {
  const rows = db
    .select()
    .from(schema.friendships)
    .where(
      and(eq(schema.friendships.addresseeId, userId), eq(schema.friendships.status, "pending")),
    )
    .orderBy(desc(schema.friendships.createdAt))
    .all();
  return rows
    .map((f) => {
      const u = db.select().from(schema.users).where(eq(schema.users.id, f.requesterId)).get();
      if (!u) return null;
      const p = db.select().from(schema.profiles).where(eq(schema.profiles.userId, u.id)).get();
      return {
        friendshipId: f.id,
        userId: u.id,
        username: u.username,
        profileName: p?.name ?? null,
        createdAt: f.createdAt,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

export function listPendingOutgoing(userId: string) {
  const rows = db
    .select()
    .from(schema.friendships)
    .where(
      and(eq(schema.friendships.requesterId, userId), eq(schema.friendships.status, "pending")),
    )
    .orderBy(desc(schema.friendships.createdAt))
    .all();
  return rows
    .map((f) => {
      const u = db.select().from(schema.users).where(eq(schema.users.id, f.addresseeId)).get();
      if (!u) return null;
      const p = db.select().from(schema.profiles).where(eq(schema.profiles.userId, u.id)).get();
      return {
        friendshipId: f.id,
        userId: u.id,
        username: u.username,
        profileName: p?.name ?? null,
        createdAt: f.createdAt,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

export function searchUsersByUsername(q: string, excludeUserId: string, limit = 10) {
  const query = q.trim().toLowerCase();
  if (!query) return [] as PublicUser[];
  const rows = db
    .select()
    .from(schema.users)
    .where(
      and(
        ne(schema.users.id, excludeUserId),
        like(schema.users.username, `%${query}%`),
        eq(schema.users.active, true),
      ),
    )
    .orderBy(asc(schema.users.username))
    .limit(limit)
    .all();
  return rows.map((u) => {
    const p = db.select().from(schema.profiles).where(eq(schema.profiles.userId, u.id)).get();
    return { id: u.id, username: u.username, profileName: p?.name ?? null };
  });
}

// Verifica se existe relação entre A e B (qualquer direção, qualquer status).
export function getFriendshipBetween(aId: string, bId: string) {
  return db
    .select()
    .from(schema.friendships)
    .where(
      or(
        and(eq(schema.friendships.requesterId, aId), eq(schema.friendships.addresseeId, bId)),
        and(eq(schema.friendships.requesterId, bId), eq(schema.friendships.addresseeId, aId)),
      ),
    )
    .get();
}

export function areFriends(aId: string, bId: string): boolean {
  if (aId === bId) return true;
  const f = getFriendshipBetween(aId, bId);
  return f?.status === "accepted";
}

export function requestFriendship(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) throw new Error("self");
  const existing = getFriendshipBetween(requesterId, addresseeId);
  if (existing) {
    // Se já existe (pending ou accepted), não duplica
    return existing;
  }
  return db
    .insert(schema.friendships)
    .values({ requesterId, addresseeId, status: "pending" })
    .returning()
    .get();
}

export function acceptFriendship(userId: string, friendshipId: string) {
  const f = db
    .select()
    .from(schema.friendships)
    .where(eq(schema.friendships.id, friendshipId))
    .get();
  if (!f) return null;
  if (f.addresseeId !== userId) return null; // só addressee aceita
  if (f.status !== "pending") return f;
  db.update(schema.friendships)
    .set({ status: "accepted", acceptedAt: new Date().toISOString() })
    .where(eq(schema.friendships.id, friendshipId))
    .run();
  return { ...f, status: "accepted" as const };
}

export function removeFriendship(userId: string, friendshipId: string) {
  const f = db
    .select()
    .from(schema.friendships)
    .where(eq(schema.friendships.id, friendshipId))
    .get();
  if (!f) return false;
  // requester ou addressee podem remover
  if (f.requesterId !== userId && f.addresseeId !== userId) return false;
  db.delete(schema.friendships).where(eq(schema.friendships.id, friendshipId)).run();
  return true;
}

// Dado um username, busca o user (case-insensitive já é o caso na sign-up que lower-casa)
export function findUserByUsername(username: string) {
  return db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.username, username.toLowerCase()), eq(schema.users.active, true)))
    .get();
}

export function getProfileByUserId(userId: string) {
  return db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .get();
}
