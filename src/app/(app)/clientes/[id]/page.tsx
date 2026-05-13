import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink, Key, Link as LinkIcon, ImageIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getClient } from "@/db/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { SecretRow } from "@/components/crm/SecretRow";
import {
  addLinkAction,
  addSecretAction,
  deleteClientAction,
  deleteImageAction,
  deleteLinkAction,
  deleteSecretAction,
  updateClientAction,
  uploadImageAction,
} from "../actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  const { id } = await params;
  const data = getClient(user.id, id);
  if (!data) notFound();
  const { client, secrets, links, images } = data;

  return (
    <div className="space-y-4">
      <Link href="/clientes" className="text-[10px] uppercase tracking-widest text-muted-foreground">
        ← Clientes
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-hud text-2xl font-semibold">{client.name}</h1>
          {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
        </div>
        <DeleteButton
          action={deleteClientAction}
          id={client.id}
          message={`Deletar cliente "${client.name}" e tudo dele (senhas, links, imagens)?`}
          size="md"
        />
      </div>

      {/* Dados básicos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateClientAction} className="space-y-3">
            <input type="hidden" name="id" value={client.id} />
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={client.name} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" name="company" defaultValue={client.company ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={client.status}>
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
                <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" defaultValue={client.phone ?? ""} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notas (Markdown)</Label>
              <Textarea id="notes" name="notes" rows={4} defaultValue={client.notes ?? ""} />
            </div>
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cofre de senhas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> Cofre · {secrets.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {secrets.length > 0 && (
            <div className="space-y-2">
              {secrets.map((s) => (
                <SecretRow
                  key={s.id}
                  secret={s}
                  deleteAction={deleteSecretAction}
                  clientId={client.id}
                />
              ))}
            </div>
          )}
          <form action={addSecretAction} className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid grid-cols-2 gap-2">
              <Input name="label" placeholder="Label (ex: wp-admin)" required />
              <Input name="username" placeholder="Usuário (opcional)" />
            </div>
            <Input name="password" type="password" placeholder="Senha" required />
            <Input name="url" placeholder="URL (opcional)" />
            <Input name="notes" placeholder="Notas (opcional)" />
            <Button type="submit" size="sm" className="w-full">
              + Adicionar credencial
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Links · {links.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.length > 0 && (
            <div className="space-y-1">
              {links.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-2 text-sm hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate">{l.label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{l.url}</p>
                    </div>
                  </a>
                  <DeleteButton
                    action={deleteLinkAction}
                    id={l.id}
                    message="Deletar esse link?"
                    extraFields={{ clientId: client.id }}
                  />
                </div>
              ))}
            </div>
          )}
          <form action={addLinkAction} className="grid grid-cols-[1fr_2fr_auto] gap-2">
            <input type="hidden" name="clientId" value={client.id} />
            <Input name="label" placeholder="Label" required />
            <Input name="url" placeholder="https://..." required />
            <Button type="submit" size="sm">
              +
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Imagens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Imagens · {images.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group rounded-md overflow-hidden border border-border">
                  <Image
                    src={`/uploads/${img.filename}`}
                    alt={img.caption ?? "imagem"}
                    width={300}
                    height={300}
                    className="aspect-square w-full object-cover"
                    unoptimized
                  />
                  {img.caption && (
                    <p className="bg-background/90 px-2 py-1 text-[10px] text-muted-foreground truncate">
                      {img.caption}
                    </p>
                  )}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteButton
                      action={deleteImageAction}
                      id={img.id}
                      message="Deletar essa imagem?"
                      extraFields={{ clientId: client.id }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <form action={uploadImageAction} encType="multipart/form-data" className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            <input type="hidden" name="clientId" value={client.id} />
            <Input type="file" name="file" accept="image/*" required />
            <Input name="caption" placeholder="Legenda (opcional)" />
            <Button type="submit" size="sm" className="w-full">
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
