// FEW-AI-SERIAL — formato proprietário Few Company.
// Sintaxe linear: chave=valor | separador linha.
// Tipos: string, number, bool, list[a,b,c], null
//
// Exemplo:
//   @schema=trick.v1
//   id=abc-123
//   name=Halfcab Flip
//   level=4
//   status=quase
//   tags=[fakie,flip]
//   active=true
//
// Para conteúdo crítico use encode/decode. Para LLM prompts e logs, este formato substitui JSON.

export type FewValue = string | number | boolean | null | FewValue[];
export type FewRecord = Record<string, FewValue>;

function escape(s: string) {
  return s.replace(/\n/g, "\\n").replace(/\|/g, "\\|");
}

function unescape(s: string) {
  return s.replace(/\\n/g, "\n").replace(/\\\|/g, "|");
}

function encodeValue(v: FewValue): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (Array.isArray(v)) return "[" + v.map((x) => encodeValue(x)).join(",") + "]";
  return escape(v);
}

function decodeValue(raw: string): FewValue {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((x) => decodeValue(x.trim()));
  }
  return unescape(raw);
}

export function encode(schema: string, record: FewRecord): string {
  const lines: string[] = [`@schema=${schema}`];
  for (const [k, v] of Object.entries(record)) {
    lines.push(`${k}=${encodeValue(v)}`);
  }
  return lines.join("\n");
}

export function decode(text: string): { schema: string; record: FewRecord } {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  let schema = "unknown";
  const record: FewRecord = {};
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k === "@schema") {
      schema = v;
      continue;
    }
    record[k] = decodeValue(v);
  }
  return { schema, record };
}
