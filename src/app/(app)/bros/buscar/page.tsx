import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { getFriendshipBetween, searchUsersByUsername } from "@/db/friends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendFriendRequestAction } from "../actions";

export default async function BuscarBrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const s = (await getCurrentSession())!;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const results = q ? searchUsersByUsername(q, s.user.id) : [];

  return (
    <div className="space-y-4">
      <Link href="/bros" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Bros
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Buscar bros</h1>

      <Card>
        <CardContent className="pt-4">
          <form action="/bros/buscar" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="@username"
                autoFocus
                className="pl-9"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {q && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {results.length === 0
                ? `Nenhum usuário com "${q}"`
                : `${results.length} resultado${results.length > 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((u) => {
              const existing = getFriendshipBetween(s.user.id, u.id);
              const status = existing?.status;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">@{u.username}</p>
                    {u.profileName && (
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                        {u.profileName}
                      </p>
                    )}
                  </div>
                  {status === "accepted" ? (
                    <span className="text-[10px] uppercase tracking-widest text-emerald-400">
                      já é bro
                    </span>
                  ) : status === "pending" ? (
                    <span className="text-[10px] uppercase tracking-widest text-amber-400">
                      pendente
                    </span>
                  ) : (
                    <form action={sendFriendRequestAction}>
                      <input type="hidden" name="addresseeId" value={u.id} />
                      <Button type="submit" size="sm">
                        <UserPlus className="h-3.5 w-3.5" /> Adicionar bro
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
