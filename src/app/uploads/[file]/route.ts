import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { contentTypeFor, getUploadedFile } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { file } = await params;
  const buf = getUploadedFile(file);
  if (!buf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(file),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
