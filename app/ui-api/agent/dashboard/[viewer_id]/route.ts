import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ viewer_id: string }> }
) {
  const { viewer_id } = await params;

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const adminKey = process.env.ADMIN_KEY || "";
  const agentToken =
    req.cookies.get("agent_token")?.value || "";

  if (!agentToken) {
    return NextResponse.json(
      { detail: "Missing agent session" },
      { status: 401 }
    );
  }

  try {
    const targetUrl = new URL(
      `${base}/admin/agent-dashboard/${encodeURIComponent(
        viewer_id
      )}`
    );

    for (const [key, value] of req.nextUrl.searchParams.entries()) {
      targetUrl.searchParams.set(key, value);
    }

    const res = await fetch(targetUrl.toString(), {
      cache: "no-store",
      headers: {
        "X-Admin-Key": adminKey,
        Authorization: `Bearer ${agentToken}`,
        Accept: "application/json",
      },
    });

    const raw = await res.text();

    let data: any = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        detail:
          raw ||
          `Dashboard request failed (${res.status})`,
      };
    }

    const out = NextResponse.json(data, {
      status: res.status,
    });

    if (res.status === 401) {
      out.cookies.delete("agent_token");
      out.cookies.delete("agent_session");
    }

    return out;
  } catch (error: any) {
    return NextResponse.json(
      {
        detail:
          error?.message ||
          "Dashboard proxy error",
      },
      { status: 500 }
    );
  }
}
