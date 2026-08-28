import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      withdrawal_id: string;
    }>;
  }
) {
  const { withdrawal_id } = await params;

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

  const viewerId =
    req.nextUrl.searchParams.get("viewer_id") || "";

  if (!viewerId) {
    return NextResponse.json(
      { detail: "viewer_id required" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));

    const targetUrl = new URL(
      `${base}/admin/withdrawals/${encodeURIComponent(withdrawal_id)}/complete`
    );

    targetUrl.searchParams.set("viewer_id", viewerId);

    const res = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "X-Admin-Key": adminKey,
        Authorization: `Bearer ${agentToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await res.text();

    let data: any = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        detail:
          raw ||
          `Withdrawal action failed (${res.status})`,
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
          "Withdrawal action proxy failed",
      },
      { status: 500 }
    );
  }
}
