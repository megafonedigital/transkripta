import { NextResponse } from "next/server";
import { readTranscriptions } from "@/lib/fsdb";

export async function GET() {
  const items = await readTranscriptions();
  return NextResponse.json({ items });
}