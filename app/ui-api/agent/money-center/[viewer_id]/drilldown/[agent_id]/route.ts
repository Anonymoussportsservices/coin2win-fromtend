import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      viewer_id: string;
      agent_id: string;
    }>;
  }
) {
  const { viewer_id, agent_id } = await params;

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

  const qs = req.nextUrl.searchParams.toString();

  const targetUrl =
    `${base}/admin/agent-money-center/` +
    `${encodeURIComponent(viewer_id)}/drilldown/` +
    `${encodeURIComponent(agent_id)}` +
    `${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        "X-Admin-Key": adminKey,
        Authorization: `Bearer ${agentToken}`,
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
          `Money Center drilldown failed (${res.status})`,
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
  } catch (err: any) {
    return NextResponse.json(
      {
        detail:
          err?.message ||
          "Money Center drilldown proxy error",
      },
      { status: 500 }
    );
  }
}
