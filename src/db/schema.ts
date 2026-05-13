import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  locale: text("locale", { enum: ["pt-BR", "en", "zh-CN"] }).notNull().default("pt-BR"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text("last_login_at"),
});

export const passwordResets = sqliteTable("password_resets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Schema legado — mantido pra compatibilidade da migration anterior.
export const accessCodes = sqliteTable("access_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  accessCodeId: text("access_code_id").references(() => accessCodes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthYear: integer("birth_year"),
  heightCm: integer("height_cm"),
  startingWeightKg: real("starting_weight_kg"),
  goal: text("goal"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tricks = sqliteTable("tricks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["flat", "fakie", "rampa", "corrimao", "borda", "manual", "freestyle", "transicao"],
  }).notNull(),
  stance: text("stance", { enum: ["regular", "fakie", "switch", "nollie"] }).notNull(),
  level: integer("level").notNull().default(1),
  status: text("status", {
    enum: ["descobrindo", "aprendendo", "quase", "na_base", "arsenal", "pausada"],
  })
    .notNull()
    .default("descobrindo"),
  baseRequirement: integer("base_requirement").notNull().default(10),
  totalXp: integer("total_xp").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const skateSessions = sqliteTable(
  "skate_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    durationMinutes: integer("duration_minutes"),
    location: text("location"),
    sessionType: text("session_type", { enum: ["flow", "tech", "livre"] }),
    feeling: integer("feeling"),
    confidence: integer("confidence"),
    pain: integer("pain"),
    flowState: text("flow_state", { enum: ["travado", "ok", "fluido", "absurdo"] }),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqProfileDate: uniqueIndex("skate_sessions_profile_date").on(table.profileId, table.date),
  }),
);

export const sessionTricks = sqliteTable("session_tricks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => skateSessions.id, { onDelete: "cascade" }),
  trickId: text("trick_id")
    .notNull()
    .references(() => tricks.id, { onDelete: "cascade" }),
  attempts: integer("attempts").notNull().default(0),
  lands: integer("lands").notNull().default(0),
  misses: integer("misses").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  isBaseRun: integer("is_base_run", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
});

export const bodyLogs = sqliteTable(
  "body_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    weightKg: real("weight_kg"),
    bodyFatPct: real("body_fat_pct"),
    visceralFat: real("visceral_fat"),
    muscleMassKg: real("muscle_mass_kg"),
    waterPct: real("water_pct"),
    energy: integer("energy"),
    mood: integer("mood"),
    sleepHours: real("sleep_hours"),
    notes: text("notes"),
  },
  (table) => ({
    uniqProfileDate: uniqueIndex("body_logs_profile_date").on(table.profileId, table.date),
  }),
);

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  distanceKm: real("distance_km"),
  durationMinutes: real("duration_minutes"),
  pace: text("pace"),
  type: text("type", { enum: ["leve", "longa", "tiro", "recuperacao"] }),
  notes: text("notes"),
});

export const jiuSessions = sqliteTable("jiu_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  durationMinutes: integer("duration_minutes"),
  rolls: integer("rolls"),
  intensity: integer("intensity"),
  notes: text("notes"),
});

export const routineChecks = sqliteTable(
  "routine_checks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    taskKey: text("task_key").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
  },
  (table) => ({
    uniqProfileDateTask: uniqueIndex("routine_checks_profile_date_task").on(
      table.profileId,
      table.date,
      table.taskKey,
    ),
  }),
);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  project: text("project").notNull(),
  priority: text("priority", { enum: ["urgent", "next", "stable", "planned"] })
    .notNull()
    .default("next"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  deadline: text("deadline"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    archivedAt: text("archived_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqUserName: uniqueIndex("projects_user_name").on(table.userId, table.name),
  }),
);

export const routineItems = sqliteTable(
  "routine_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqUserKey: uniqueIndex("routine_items_user_key").on(table.userId, table.key),
  }),
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type RoutineItem = typeof routineItems.$inferSelect;
export type NewRoutineItem = typeof routineItems.$inferInsert;

export const waterConfigs = sqliteTable("water_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" })
    .unique(),
  goalMl: integer("goal_ml"),           // null = auto-calculado pelo peso
  glassSizeMl: integer("glass_size_ml").notNull().default(250),
  wakeStart: text("wake_start").notNull().default("08:00"),
  wakeEnd: text("wake_end").notNull().default("22:00"),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).notNull().default(true),
  soundEnabled: integer("sound_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const waterLogs = sqliteTable(
  "water_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    glassesDrunk: integer("glasses_drunk").notNull().default(0),
    mlDrunk: integer("ml_drunk").notNull().default(0),
    goalMlSnapshot: integer("goal_ml_snapshot"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqProfileDate: uniqueIndex("water_logs_profile_date").on(table.profileId, table.date),
  }),
);

export type WaterConfig = typeof waterConfigs.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  status: text("status", { enum: ["lead", "ativo", "concluido", "pausado", "perdido"] })
    .notNull()
    .default("lead"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const clientSecrets = sqliteTable("client_secrets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  username: text("username"),
  // AES-256-GCM: iv (base64) + tag (base64) + cipher (base64), separados por ":"
  ciphertext: text("ciphertext").notNull(),
  url: text("url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const clientLinks = sqliteTable("client_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const clientImages = sqliteTable("client_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),  // nome do arquivo no volume /app/data/uploads
  caption: text("caption"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ClientSecret = typeof clientSecrets.$inferSelect;
export type ClientLink = typeof clientLinks.$inferSelect;
export type ClientImage = typeof clientImages.$inferSelect;

export type Trick = typeof tricks.$inferSelect;
export type NewTrick = typeof tricks.$inferInsert;
export type SkateSession = typeof skateSessions.$inferSelect;
export type SessionTrick = typeof sessionTricks.$inferSelect;
export type BodyLog = typeof bodyLogs.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type JiuSession = typeof jiuSessions.$inferSelect;
export type RoutineCheck = typeof routineChecks.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type AccessCode = typeof accessCodes.$inferSelect;
