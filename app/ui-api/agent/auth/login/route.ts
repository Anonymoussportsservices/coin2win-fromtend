import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  const res = await fetch(`${base}/agent/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  const out = NextResponse.json(data, { status: res.status });

  if (res.ok) {
    out.cookies.set("agent_session", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  }

  return out;
}
