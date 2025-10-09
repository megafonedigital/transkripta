import { NextResponse, NextRequest } from "next/server";
import { appendLog, readTranscriptions, writeTranscriptions } from "@/lib/fsdb";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const items = await readTranscriptions();
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const removed = items[idx];
  const remaining = [...items.slice(0, idx), ...items.slice(idx + 1)];
  await writeTranscriptions(remaining);

  await appendLog({
    time: new Date().toISOString(),
    level: "info",
    message: "Transcription deleted",
    meta: { id: removed.id, title: removed.title, status: removed.status },
  });

  return NextResponse.json({ ok: true });
}