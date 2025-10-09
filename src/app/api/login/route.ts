import { NextResponse } from "next/server";
import { checkEnvCredentials, createSession } from "@/lib/auth";
import { appendLog } from "@/lib/fsdb";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body || {};
  const ok = checkEnvCredentials(username, password);
  if (!ok) {
    await appendLog({ time: new Date().toISOString(), level: "error", message: "Login inválido", meta: { username } });
    return NextResponse.json({ ok: false, error: "Credenciais inválidas" }, { status: 401 });
  }
  await createSession(username);
  await appendLog({ time: new Date().toISOString(), level: "info", message: "Login realizado", meta: { username } });
  return NextResponse.json({ ok: true });
}