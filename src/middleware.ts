import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next|static|public|favicon.ico).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  const token = req.cookies.get("transkripta_session")?.value;
  if (!token) {
    if (!isLogin) {
      const url = new URL("/login", req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Validar assinatura do token (base64.payload + '.' + hex(hmacSHA256(payload)))
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  try {
    const payload = atob(b64);
    const secret = process.env.AUTH_SECRET || "change-me-secret";
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const valid = signatureHex === sig;
    if (!valid && !isLogin) {
      const url = new URL("/login", req.url);
      return NextResponse.redirect(url);
    }
  } catch {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}