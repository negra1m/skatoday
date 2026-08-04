import { db, schema } from "./client";

async function seed() {
  const existing = db.select().from(schema.profiles).get();
  if (existing) {
    console.log("seed: profile já existe", existing.name);
    return;
  }

  const profile = db
    .insert(schema.profiles)
    .values({
      accessCodeId: null,
      name: "Vini",
      birthYear: 1995,
      heightCm: 181,
      startingWeightKg: 102,
      goal: "Voltar ao eixo: skate, corpo leve, flow.",
    })
    .returning()
    .get();

  const baseTricks: Array<{
    name: string;
    category: schema.NewTrick["category"];
    stance: schema.NewTrick["stance"];
    level: number;
    status: schema.NewTrick["status"];
  }> = [
    { name: "Ollie", category: "flat", stance: "regular", level: 1, status: "arsenal" },
    { name: "FS Ollie", category: "flat", stance: "regular", level: 2, status: "aprendendo" },
    { name: "Shove-it", category: "flat", stance: "regular", level: 2, status: "arsenal" },
    { name: "Fakie Shove-it", category: "fakie", stance: "fakie", level: 2, status: "arsenal" },
    { name: "Halfcab", category: "fakie", stance: "fakie", level: 2, status: "na_base" },
    { name: "Fakie Varial", category: "fakie", stance: "fakie", level: 3, status: "na_base" },
    { name: "Halfcab Flip", category: "fakie", stance: "fakie", level: 4, status: "quase" },
    { name: "Flip parado", category: "flat", stance: "regular", level: 3, status: "aprendendo" },
    { name: "Manual", category: "manual", stance: "regular", level: 2, status: "aprendendo" },
    { name: "No Comply", category: "freestyle", stance: "regular", level: 2, status: "aprendendo" },
    { name: "Body Varial", category: "freestyle", stance: "regular", level: 3, status: "descobrindo" },
    { name: "Drop", category: "transicao", stance: "regular", level: 3, status: "pausada" },
    { name: "50-50 corrimão", category: "corrimao", stance: "regular", level: 4, status: "pausada" },
    { name: "Boardslide redondo", category: "corrimao", stance: "regular", level: 4, status: "pausada" },
    { name: "Slappy", category: "borda", stance: "regular", level: 2, status: "aprendendo" },
  ];

  for (const t of baseTricks) {
    db.insert(schema.tricks).values({ profileId: profile.id, ...t }).run();
  }

  const today = new Date().toISOString().slice(0, 10);
  db.insert(schema.bodyLogs)
    .values({
      profileId: profile.id,
      date: today,
      weightKg: 102,
      bodyFatPct: 29,
      energy: 6,
      mood: 7,
      sleepHours: 7,
      notes: "primeiro log — dia que começou skatoday",
    })
    .run();

  console.log("seed ok:", { profile: profile.name, tricks: baseTricks.length });
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
