import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getCurrentSession } from "@/lib/session";
import { updateJiuAction } from "../../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function EditJiuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getCurrentSession())!;
  if (s.user.role !== "admin") notFound();
  const j = db
    .select()
    .from(schema.jiuSessions)
    .where(and(eq(schema.jiuSessions.id, id), eq(schema.jiuSessions.profileId, s.profile.id)))
    .get();
  if (!j) notFound();

  return (
    <div className="space-y-4">
      <Link href="/jiu" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Jiu
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Editar treino</h1>

      <Card>
        <CardContent className="pt-4">
          <form action={updateJiuAction} className="space-y-3">
            <input type="hidden" name="id" value={j.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={j.date} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="durationMinutes">Tempo (min)</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={j.durationMinutes ?? ""} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rolls">Rolls</Label>
                <Input id="rolls" name="rolls" type="number" min={0} defaultValue={j.rolls ?? 0} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="intensity">Intensidade 1-10</Label>
                <Input id="intensity" name="intensity" type="number" min={1} max={10} defaultValue={j.intensity ?? 5} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={j.notes ?? ""} />
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
