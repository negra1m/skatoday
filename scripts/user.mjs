// CLI admin de usuários (JS puro, sem tsx). Roda dentro do container.
//
// docker compose exec skatoday node scripts/user.mjs create <user> <email> <senha>
// docker compose exec skatoday node scripts/user.mjs list
// docker compose exec skatoday node scripts/user.mjs reset <user>
// docker compose exec skatoday node scripts/user.mjs delete <user>
// docker compose exec skatoday node scripts/user.mjs promote <user>

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";

const url = process.env.DATABASE_URL ?? "file:./data/skatoday.db";
const filePath = url.replace(/^file:/, "");
const db = new Database(filePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const [, , cmd, ...args] = process.argv;

function uuid() {
  return crypto.randomUUID();
}

async function create(username, email, password) {
  if (!username || !email || !password) die("create <username> <email> <password>");
  const u = username.toLowerCase();
  const e = email.toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE username = ?").get(u)) die("usuário já existe");
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(e)) die("email já existe");
  const hash = await bcrypt.hash(password, 12);
  const isFirst = !db.prepare("SELECT 1 FROM users LIMIT 1").get();
  const id = uuid();
  db.prepare(
    "INSERT INTO users (id, username, email, password_hash, role, locale, active) VALUES (?, ?, ?, ?, ?, 'pt-BR', 1)",
  ).run(id, u, e, hash, isFirst ? "admin" : "user");

  // Vincula ou cria profile
  const orphan = db.prepare("SELECT id FROM profiles WHERE user_id IS NULL LIMIT 1").get();
  if (orphan) {
    db.prepare("UPDATE profiles SET user_id = ? WHERE id = ?").run(id, orphan.id);
    console.log(`ok: ${u} criado (${isFirst ? "admin" : "user"}) e ligado ao profile existente`);
  } else {
    db.prepare("INSERT INTO profiles (id, user_id, name) VALUES (?, ?, ?)").run(uuid(), id, u);
    console.log(`ok: ${u} criado (${isFirst ? "admin" : "user"})`);
  }
}

function list() {
  const rows = db.prepare("SELECT username, email, role, active, last_login_at FROM users").all();
  console.log("--- users ---");
  for (const r of rows) {
    console.log(
      [r.username, r.email, r.role, r.active ? "ativo" : "inativo", r.last_login_at ?? "nunca-logou"].join(" · "),
    );
  }
  console.log(`total: ${rows.length}`);
}

async function reset(username) {
  if (!username) die("reset <username>");
  const u = username.toLowerCase();
  const user = db.prepare("SELECT id, email, username, locale FROM users WHERE username = ?").get(u);
  if (!user) die("usuário não encontrado");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  db.prepare(
    "INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
  ).run(uuid(), user.id, tokenHash, expiresAt);
  const base = process.env.PUBLIC_BASE_URL ?? "https://agenda.fewcompany.com";
  console.log(`ok: link de reset (válido 1h)`);
  console.log(`${base}/redefinir?token=${token}`);
  console.log(`(envia esse link pro usuário — admin não vê a senha)`);
}

function del(username) {
  if (!username) die("delete <username>");
  const u = username.toLowerCase();
  const r = db.prepare("DELETE FROM users WHERE username = ?").run(u);
  console.log(`apagados: ${r.changes}`);
}

function promote(username) {
  if (!username) die("promote <username>");
  const u = username.toLowerCase();
  db.prepare("UPDATE users SET role = 'admin' WHERE username = ?").run(u);
  console.log(`ok: ${u} é admin`);
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const fn = { create, list, reset, delete: del, promote }[cmd];
if (!fn) die("comandos: create | list | reset | delete | promote");
await fn(...args);
db.close();
