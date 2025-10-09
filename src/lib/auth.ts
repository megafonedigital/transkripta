import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "transkripta_session";

export function checkEnvCredentials(username: string, password: string) {
  return (
    username === (process.env.AUTH_USERNAME || "admin") &&
    password === (process.env.AUTH_PASSWORD || "admin")
  );
}

function sign(payload: string) {
  const secret = process.env.AUTH_SECRET || "change-me-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export async function createSession(username: string) {
  const payload = JSON.stringify({ u: username, ts: Date.now() });
  const token = Buffer.from(payload).toString("base64") + "." + sign(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function isAuthenticated() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  const payload = Buffer.from(b64, "base64").toString("utf-8");
  return sign(payload) === sig;
}