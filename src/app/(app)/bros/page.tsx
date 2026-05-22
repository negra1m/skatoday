import Link from "next/link";
import { UserPlus, Check, X } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { listFriends, listPendingIncoming, listPendingOutgoing } from "@/db/friends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  acceptFriendRequestAction,
  removeFriendAction,
} from "./actions";

export default async function BrosPage() {
  const s = (await getCurrentSession())!;
  const bros = listFriends(s.user.id);
  const incoming = listPendingIncoming(s.user.id);
  const outgoing = listPendingOutgoing(s.user.id);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-hud text-2xl font-semibold">Bros</h1>
        <Link
          href="/bros/buscar"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <UserPlus className="h-3.5 w-3.5" /> Adicionar bro
        </Link>
      </header>

      {incoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Pedidos recebidos · {incoming.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incoming.map((p) => (
              <div
                key={p.friendshipId}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">@{p.username}</p>
                  {p.profileName && (
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {p.profileName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <form action={acceptFriendRequestAction}>
                    <input type="hidden" name="id" value={p.friendshipId} />
                    <Button type="submit" size="sm">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                  <form action={removeFriendAction}>
                    <input type="hidden" name="id" value={p.friendshipId} />
                    <Button type="submit" variant="outline" size="sm">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {bros.length === 0 ? "Sem bros ainda" : `Bros · ${bros.length}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bros.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Use{" "}
              <Link href="/bros/buscar" className="underline">
                buscar
              </Link>{" "}
              pra adicionar.
            </p>
          ) : (
            bros.map((f) => (
              <Link
                key={f.id}
                href={`/skater/${encodeURIComponent(f.username)}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">@{f.username}</p>
                  {f.profileName && (
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {f.profileName}
                    </p>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  ver ficha
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {outgoing.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Pedidos enviados · {outgoing.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outgoing.map((p) => (
              <div
                key={p.friendshipId}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">@{p.username}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    aguardando aceitar
                  </p>
                </div>
                <form action={removeFriendAction}>
                  <input type="hidden" name="id" value={p.friendshipId} />
                  <Button type="submit" variant="outline" size="sm">
                    Cancelar
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
