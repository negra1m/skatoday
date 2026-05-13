// CLI admin pra gerenciar usuários — uso direto no servidor.
//
// Comandos:
//   npm run user:create <username> <email> <password>
//   npm run user:list
//   npm run user:reset <username>      (gera token e envia email — admin NÃO vê a senha)
//   npm run user:delete <username>
//   npm run user:promote <username>    (vira admin)

import { db, schema } from "./client";
import { eq } from "drizzle-orm";
import { hashPassword, createResetRequest } from "@/lib/auth";
import { buildResetEmail, sendMail } from "@/lib/mail";

const [, , cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case "create":
      await create(args[0], args[1], args[2]);
      break;
    case "list":
      list();
      break;
    case "reset":
      await reset(args[0]);
      break;
    case "delete":
      del(args[0]);
      break;
    case "promote":
      promote(args[0]);
      break;
    default:
      console.log("uso: create | list | reset | delete | promote");
      process.exit(1);
  }
}

async function create(username?: string, email?: string, password?: string) {
  if (!username || !email || !password) {
    console.error("create <username> <email> <password>");
    process.exit(1);
  }
  const u = username.toLowerCase();
  const e = email.toLowerCase();
  const existing = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, u))
    .get();
  if (existing) {
    console.error("usuário já existe");
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  const isFirst = !db.select().from(schema.users).get();
  const user = db
    .insert(schema.users)
    .values({
      username: u,
      email: e,
      passwordHash,
      role: isFirst ? "admin" : "user",
    })
    .returning()
    .get();
  db.insert(schema.profiles).values({ userId: user.id, name: u }).run();
  console.log(`ok: usuário ${u} criado (${user.role})`);
}

function list() {
  const rows = db.select().from(schema.users).all();
  console.log("--- users ---");
  for (const r of rows) {
    console.log(
      [
        r.username,
        r.email,
        r.role,
        r.active ? "ativo" : "inativo",
        r.lastLoginAt ? `last:${r.lastLoginAt.slice(0, 16)}` : "nunca-logou",
      ].join(" · "),
    );
  }
  console.log(`total: ${rows.length}`);
}

async function reset(username?: string) {
  if (!username) {
    console.error("reset <username>");
    process.exit(1);
  }
  const u = username.toLowerCase();
  const user = db.select().from(schema.users).where(eq(schema.users.username, u)).get();
  if (!user) {
    console.error("usuário não encontrado");
    process.exit(1);
  }
  const token = createResetRequest(user.id);
  const base = process.env.PUBLIC_BASE_URL ?? "https://agenda.fewcompany.com";
  const resetUrl = `${base}/redefinir?token=${token}`;
  const mail = buildResetEmail({ username: user.username, resetUrl, locale: user.locale });
  await sendMail({ to: user.email, ...mail });
  console.log(`ok: link de reset enviado pra ${user.email}`);
  console.log("(admin não vê senha — usuário escolhe nova senha pelo link)");
}

function del(username?: string) {
  if (!username) {
    console.error("delete <username>");
    process.exit(1);
  }
  const u = username.toLowerCase();
  const r = db.delete(schema.users).where(eq(schema.users.username, u)).run();
  console.log(`apagados: ${r.changes}`);
}

function promote(username?: string) {
  if (!username) {
    console.error("promote <username>");
    process.exit(1);
  }
  const u = username.toLowerCase();
  db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.username, u)).run();
  console.log(`ok: ${u} é admin`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
