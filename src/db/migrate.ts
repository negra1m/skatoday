import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const url = process.env.DATABASE_URL ?? "file:./data/skatoday.db";
const filePath = url.replace(/^file:/, "");

const dir = dirname(filePath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./src/db/migrations" });

console.log("migrations applied ->", filePath);
sqlite.close();
