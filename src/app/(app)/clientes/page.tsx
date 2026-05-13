import Link from "next/link";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listClients } from "@/db/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  ativo: "Ativo",
  concluido: "Concluído",
  pausado: "Pausado",
  perdido: "Perdido",
};

const STATUS_COLOR: Record<string, string> = {
  lead: "bg-blue-500",
  ativo: "bg-emerald-500",
  concluido: "bg-zinc-400",
  pausado: "bg-amber-500",
  perdido: "bg-red-500",
};

export default async function ClientesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  const clients = listClients(user.id);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-hud text-2xl font-semibold">Clientes</h1>
        <Link
          href="/clientes/novo"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Novo
        </Link>
      </header>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum cliente ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_COLOR[c.status])} />
                      <p className="text-sm font-medium truncate">{c.name}</p>
                    </div>
                    {c.company && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{c.company}</p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {STATUS_LABEL[c.status]}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
