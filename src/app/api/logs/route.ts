import { NextResponse } from "next/server";
import { readLogs } from "@/lib/fsdb";

export async function GET() {
  const logs = await readLogs();
  return NextResponse.json({ logs });
}