import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  const forwardedFor =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "";

  const userAgent = req.headers.get("user-agent") || "";

  const res = await fetch(`${base}/agent/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      ...(userAgent ? { "user-agent": userAgent } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  const agentToken =
    res.ok && typeof data?.agent_token === "string"
      ? data.agent_token
      : "";

  const safeData = { ...data };
  delete safeData.agent_token;

  const out = NextResponse.json(safeData, { status: res.status });

  if (res.ok && agentToken) {
    out.cookies.set("agent_token", agentToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Number(data?.expires_in_hours || 72) * 60 * 60,
    });

    out.cookies.delete("agent_session");
  }

  return out;
}
