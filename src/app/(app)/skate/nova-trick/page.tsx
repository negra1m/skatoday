import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { createTrick } from "@/db/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

async function create(formData: FormData) {
  "use server";
  const session = (await getCurrentSession())!;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const category = String(formData.get("category")) as "flat";
  const stance = String(formData.get("stance")) as "regular";
  const level = Number(formData.get("level"));
  createTrick({ profileId: session.profile.id, name, category, stance, level });
  redirect("/skate");
}

export default function NovaTrickPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-hud text-2xl font-semibold">Nova trick</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required placeholder="Halfcab Flip" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select id="category" name="category" defaultValue="flat">
                  <option value="flat">flat</option>
                  <option value="fakie">fakie</option>
                  <option value="rampa">rampa</option>
                  <option value="corrimao">corrimão</option>
                  <option value="borda">borda</option>
                  <option value="manual">manual</option>
                  <option value="freestyle">freestyle</option>
                  <option value="transicao">transição</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stance">Stance</Label>
                <Select id="stance" name="stance" defaultValue="regular">
                  <option value="regular">regular</option>
                  <option value="fakie">fakie</option>
                  <option value="switch">switch</option>
                  <option value="nollie">nollie</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nível (1-5)</Label>
              <Input id="level" name="level" type="number" min={1} max={5} defaultValue={2} required />
            </div>
            <Button type="submit" className="w-full">
              Criar trick
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
