import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const agentToken = req.cookies.get("agent_token")?.value || "";

  if (!agentToken) {
    return NextResponse.json(
      { detail: "Missing agent session" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${base}/agent/auth/session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${agentToken}`,
      },
      cache: "no-store",
    });

    const raw = await res.text();

    let data: any = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        detail: raw || `Session validation failed (${res.status})`,
      };
    }

    const out = NextResponse.json(data, {
      status: res.status,
    });

    if (!res.ok) {
      out.cookies.delete("agent_token");
      out.cookies.delete("agent_session");
    }

    return out;
  } catch (err: any) {
    return NextResponse.json(
      {
        detail:
          err?.message ||
          "Agent session proxy failed",
      },
      { status: 500 }
    );
  }
}
