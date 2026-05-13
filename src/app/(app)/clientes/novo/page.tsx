import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClientAction } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function NovoClientePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();

  return (
    <div className="space-y-4">
      <Link href="/clientes" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Clientes
      </Link>
      <h1 className="text-hud text-2xl font-semibold">Novo cliente</h1>

      <Card>
        <CardContent className="pt-4">
          <form action={createClientAction} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" name="company" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue="lead">
                  <option value="lead">Lead</option>
                  <option value="ativo">Ativo</option>
                  <option value="concluido">Concluído</option>
                  <option value="pausado">Pausado</option>
                  <option value="perdido">Perdido</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas (Markdown)</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="contexto, reuniões, decisões..." />
            </div>
            <Button type="submit" className="w-full">
              Criar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
