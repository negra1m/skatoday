import Link from "next/link";
import { notFound } from "next/navigation";
import { Megaphone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getClient } from "@/db/crm";
import { listCampaigns } from "@/db/traffic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { brl, CAMPAIGN_STATUS_COLOR, CAMPAIGN_STATUS_LABEL } from "@/lib/traffic";
import { cn, todayISO } from "@/lib/utils";
import { createCampaignAction } from "./actions";

export default async function TrafegoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  const { id } = await params;
  const data = getClient(user.id, id);
  if (!data) notFound();
  const { client } = data;
  const campaigns = listCampaigns(client.id);
  const today = todayISO(user.timezone);

  return (
    <div className="space-y-4">
      <Link
        href={`/clientes/${client.id}`}
        className="text-[10px] uppercase tracking-widest text-muted-foreground"
      >
        ← {client.name}
      </Link>

      <header>
        <h1 className="text-hud text-2xl font-semibold">Tráfego pago</h1>
        <p className="text-sm text-muted-foreground">
          Uma operação por imóvel/oferta anunciada.
        </p>
      </header>

      {campaigns.length > 0 && (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/clientes/${client.id}/trafego/${c.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          CAMPAIGN_STATUS_COLOR[c.status],
                        )}
                      />
                      <p className="truncate text-sm font-medium">{c.name}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {[
                        c.propertyRef,
                        c.priceBrl != null ? brl(c.priceBrl, 0) : null,
                        c.dailyBudgetBrl != null ? `${brl(c.dailyBudgetBrl, 0)}/dia` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "sem dados de verba"}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {CAMPAIGN_STATUS_LABEL[c.status]}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" /> Nova operação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
            O checklist de operação (setup, diária e semanal) já vem montado. Depois é só editar
            o que mudar.
          </p>
          <form action={createCampaignAction} className="space-y-3">
            <input type="hidden" name="clientId" value={client.id} />

            <div className="space-y-1">
              <Label htmlFor="name">Nome da operação</Label>
              <Input
                id="name"
                name="name"
                placeholder="ex: Chácara Floresta Escura"
                required
                maxLength={80}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="propertyRef">Ref. do imóvel</Label>
                <Input id="propertyRef" name="propertyRef" placeholder="ex: CHV191" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="priceBrl">Valor (R$)</Label>
                <Input id="priceBrl" name="priceBrl" inputMode="decimal" placeholder="1995000" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="propertyUrl">URL do imóvel (pro INIEC)</Label>
              <Input id="propertyUrl" name="propertyUrl" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="monthlyBudgetBrl">Verba/mês (R$)</Label>
                <Input
                  id="monthlyBudgetBrl"
                  name="monthlyBudgetBrl"
                  inputMode="decimal"
                  placeholder="1000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dailyBudgetBrl">Verba/dia (R$)</Label>
                <Input
                  id="dailyBudgetBrl"
                  name="dailyBudgetBrl"
                  inputMode="decimal"
                  placeholder="34"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="commissionPct">Comissão (%)</Label>
                <Input
                  id="commissionPct"
                  name="commissionPct"
                  inputMode="decimal"
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="startedAt">Início</Label>
                <Input id="startedAt" name="startedAt" type="date" defaultValue={today} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="planejando">
                <option value="planejando">Planejando</option>
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
                <option value="encerrada">Encerrada</option>
              </Select>
            </div>

            <SubmitButton className="w-full" pendingLabel="Criando...">
              Criar operação
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
